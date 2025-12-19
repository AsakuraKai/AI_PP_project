/**
 * MinimalReactAgent - Enhanced ReAct loop with ToolRegistry and PromptEngine
 * 
 * Implements a dynamic reasoning loop with tool execution (Chunk 2.4).
 * Uses the ReAct (Reasoning + Acting) paradigm:
 * - Thought: Generate hypothesis about error (using PromptEngine)
 * - Action: Execute tools dynamically (via ToolRegistry)
 * - Observation: Tool results and code context
 * 
 * Design Decisions:
 * - Dynamic iterations (up to 10, agent decides when to conclude)
 * - Integrates ToolRegistry for flexible tool execution
 * - Uses PromptEngine for improved prompts with few-shot examples
 * - Graceful tool failure handling
 * - Timeout handling (90s default)
 * 
 * @example
 * const agent = new MinimalReactAgent(ollamaClient);
 * const result = await agent.analyze(parsedError);
 * console.log(result.rootCause);
 */

import { OllamaClient } from '../llm/OllamaClient';
import { ReadFileTool } from '../tools/ReadFileTool';
import { LSPTool } from '../tools/LSPTool';
import { ToolRegistry } from '../tools/ToolRegistry';
import { PromptEngine } from './PromptEngine';
import { z } from 'zod';
import {
  ParsedError,
  RCAResult,
  AgentState,
  ToolCall,
  AnalysisTimeoutError,
  LLMError,
} from '../types';

/**
 * Agent configuration options
 */
export interface AgentConfig {
  maxIterations?: number;
  timeout?: number;
  usePromptEngine?: boolean;
  useToolRegistry?: boolean;
}

export class MinimalReactAgent {
  private readonly maxIterations: number;
  private readonly timeout: number;
  private readonly usePromptEngine: boolean;
  private readonly useToolRegistry: boolean;
  private readonly toolRegistry: ToolRegistry;
  private readonly promptEngine: PromptEngine;
  private readonly readFileTool: ReadFileTool;

  constructor(
    private llm: OllamaClient,
    config?: AgentConfig
  ) {
    // Configuration with defaults
    this.maxIterations = config?.maxIterations ?? 10;
    this.timeout = config?.timeout ?? 90000;
    this.usePromptEngine = config?.usePromptEngine ?? true;
    this.useToolRegistry = config?.useToolRegistry ?? true;

    // Initialize tools
    this.readFileTool = new ReadFileTool();
    this.toolRegistry = ToolRegistry.getInstance();
    this.promptEngine = new PromptEngine();

    // Register tools if using ToolRegistry
    if (this.useToolRegistry) {
      this.registerTools();
    }
  }

  /**
   * Register available tools with ToolRegistry
   */
  private registerTools(): void {
    try {
      // Register ReadFileTool
      if (!this.toolRegistry.has('read_file')) {
        const readFileSchema = z.object({
          filePath: z.string(),
          line: z.number(),
          contextLines: z.number().optional(),
        });

        this.toolRegistry.register(
          'read_file',
          this.readFileTool,
          readFileSchema,
          {
            examples: [
              {
                parameters: { filePath: 'MainActivity.kt', line: 45, contextLines: 25 },
                outcome: 'Returns code around line 45',
              },
            ],
          }
        );
      }

      // Register LSPTool (placeholder implementation)
      if (!this.toolRegistry.has('find_callers')) {
        const lspTool = new LSPTool();
        const lspSchema = z.object({
          functionName: z.string(),
          filePath: z.string(),
        });

        this.toolRegistry.register('find_callers', lspTool, lspSchema, {
          examples: [
            {
              parameters: { functionName: 'onCreate', filePath: 'MainActivity.kt' },
              outcome: 'Returns list of callers',
            },
          ],
        });
      }
    } catch (error) {
      // Tools already registered - this is fine
      if (!(error instanceof Error) || !error.message.includes('already registered')) {
        console.warn('Error registering tools:', error);
      }
    }
  }

  /**
   * Analyze error and generate Root Cause Analysis
   * 
   * @param error - Parsed error information
   * @returns RCA result with root cause and fix guidelines
   * @throws AnalysisTimeoutError if analysis exceeds timeout
   * @throws LLMError if LLM communication fails
   */
  async analyze(error: ParsedError): Promise<RCAResult> {
    const startTime = Date.now();

    // Initialize agent state
    const state: AgentState = {
      iteration: 0,
      maxIterations: this.maxIterations,
      startTime,
      timeout: this.timeout,
      mode: 'standard',
      thoughts: [],
      actions: [],
      observations: [],
      hypothesis: null,
      rootCause: null,
      converged: false,
      error,
    };

    try {
      // Get system prompt and few-shot examples if using PromptEngine
      const systemPrompt = this.usePromptEngine
        ? this.promptEngine.getSystemPrompt()
        : null;
      const examples = this.usePromptEngine
        ? this.promptEngine.getFewShotExamples(error.type)
        : [];

      // Dynamic iteration loop
      for (let i = 0; i < this.maxIterations; i++) {
        state.iteration = i + 1;
        this.checkTimeout(state);

        // Generate thought/action using PromptEngine or fallback
        let response: { thought: string; action: ToolCall | null; rootCause?: string; fixGuidelines?: string[]; confidence?: number };
        
        if (this.usePromptEngine) {
          const prompt = this.promptEngine.buildIterationPrompt({
            systemPrompt: systemPrompt || '',
            examples: i === 0 ? examples : [], // Only first iteration
            error,
            previousThoughts: state.thoughts,
            previousActions: state.actions,
            previousObservations: state.observations,
            iteration: i + 1,
            maxIterations: this.maxIterations,
          });

          const llmResponse = await this.llm.generate(prompt, {
            temperature: 0.7,
            maxTokens: 1500,
          });

          response = this.promptEngine.parseResponse(llmResponse.text);
        } else {
          // Fallback to old behavior (for A/B testing)
          response = await this.generateThoughtLegacy(state);
        }

        // Store thought
        state.thoughts.push(response.thought);
        if (i === 0) {
          state.hypothesis = response.thought;
        }

        // Execute action if specified
        if (response.action && response.action.tool && this.useToolRegistry) {
          try {
            const toolResult = await this.toolRegistry.execute(
              response.action.tool,
              response.action.parameters
            );

            state.actions.push(response.action);
            state.observations.push(toolResult.success ? toolResult.data : toolResult.error || 'Tool execution failed');

            console.log(`✓ Tool ${response.action.tool} executed successfully`);
          } catch (toolError) {
            const errorMsg = `Tool ${response.action.tool} failed: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`;
            state.observations.push(errorMsg);
            console.warn(`✗ ${errorMsg}`);
          }
        } else if (response.action && response.action.tool === 'read_file' && !this.useToolRegistry) {
          // Fallback: Execute read_file directly (backward compatibility)
          try {
            const params = response.action.parameters as { filePath: string; line: number };
            const fileContent = await this.readFileTool.execute(params.filePath, params.line);
            state.actions.push(response.action);
            state.observations.push(fileContent || 'No file content available');
          } catch (e) {
            const errorMsg = `Failed to read file: ${e instanceof Error ? e.message : 'Unknown error'}`;
            state.observations.push(errorMsg);
            console.warn(errorMsg);
          }
        }

        // Check if agent decided to conclude
        if (response.rootCause && response.fixGuidelines) {
          console.log(`✓ Agent concluded after ${i + 1} iterations`);
          return {
            error: error.message,
            rootCause: response.rootCause,
            fixGuidelines: response.fixGuidelines,
            confidence: response.confidence || 0.5,
            iterations: i + 1,
            toolsUsed: state.actions.map((a) => a.tool),
          };
        }
      }

      // Reached max iterations - force conclusion
      console.warn(`⚠ Reached max iterations (${this.maxIterations}), forcing conclusion`);
      
      const finalPrompt = this.usePromptEngine
        ? this.promptEngine.buildFinalPrompt(state)
        : this.buildFinalPromptLegacy(state);

      const finalResponse = await this.llm.generate(finalPrompt, {
        temperature: 0.5,
        maxTokens: 1500,
      });

      if (this.usePromptEngine) {
        const parsed = this.promptEngine.parseResponse(finalResponse.text);
        return {
          error: error.message,
          rootCause: parsed.rootCause || 'Analysis incomplete - reached max iterations',
          fixGuidelines: parsed.fixGuidelines || ['Review error and code context'],
          confidence: parsed.confidence || 0.3,
          iterations: this.maxIterations,
          toolsUsed: state.actions.map((a) => a.tool),
        };
      } else {
        return this.parseOutputLegacy(finalResponse.text, error, state);
      }
    } catch (error) {
      if (error instanceof AnalysisTimeoutError || error instanceof LLMError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new LLMError(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        false
      );
    }
  }

  /**
   * Legacy method: Generate thought for current iteration (for A/B testing)
   */
  private async generateThoughtLegacy(state: AgentState): Promise<{
    thought: string;
    action: ToolCall | null;
    rootCause?: string;
    fixGuidelines?: string[];
    confidence?: number;
  }> {
    // Read file if first iteration and not already done
    if (state.iteration === 1 && state.observations.length === 0) {
      try {
        const fileContent = await this.readFileTool.execute(state.error.filePath, state.error.line);
        state.observations.push(fileContent || 'No file content available');
        state.actions.push({
          tool: 'read_file',
          parameters: { filePath: state.error.filePath, line: state.error.line },
          timestamp: Date.now(),
        });
      } catch (e) {
        console.warn('Failed to read file:', e);
      }
    }

    const prompt = this.buildThoughtPromptLegacy(state);
    const response = await this.llm.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    // For final iteration, try to extract JSON
    if (state.iteration === this.maxIterations) {
      return this.parseResponseLegacy(response.text);
    }

    return {
      thought: response.text.trim(),
      action: null,
    };
  }

  /**
   * Legacy method: Build prompt for thought generation
   */
  private buildThoughtPromptLegacy(state: AgentState): string {
    const { error, iteration, observations } = state;

    let prompt = `You are a debugging expert analyzing a Kotlin error. This is iteration ${iteration}/${this.maxIterations}.

ERROR INFORMATION:
Type: ${error.type}
Message: ${error.message}
File: ${error.filePath}
Line: ${error.line}
${error.metadata ? `Additional Info: ${JSON.stringify(error.metadata, null, 2)}` : ''}`;

    // Include code context if available
    if (observations.length > 0 && iteration >= 2) {
      prompt += `\n\nCODE CONTEXT:\n${observations[0]}\n`;
    }

    if (state.thoughts.length > 0) {
      prompt += `\nPREVIOUS ANALYSIS:\n${state.thoughts.join('\n\n')}\n\n`;
    }

    prompt += `\nTASK:
${iteration === 1 ? 'Generate your initial hypothesis about what caused this error. Focus on Kotlin-specific issues.' : ''}
${iteration === 2 ? 'Deepen your analysis using the code context. What are the likely causes? Look at the actual code and identify specific issues.' : ''}
${iteration === this.maxIterations ? 'Provide your final conclusion with root cause and fix guidelines in JSON format.' : ''}

Be specific and reference the actual code when available. Think step-by-step.

YOUR ANALYSIS:`;

    return prompt;
  }

  /**
   * Legacy method: Build prompt for final analysis
   */
  private buildFinalPromptLegacy(state: AgentState): string {
    const { error, thoughts, observations } = state;

    let prompt = `Based on your analysis, provide the final root cause and fix guidelines.

ERROR: ${error.message}

YOUR REASONING:
${thoughts.map((t, i) => `Iteration ${i + 1}: ${t}`).join('\n\n')}`;

    // Include code context in final analysis
    if (observations.length > 0) {
      prompt += `\n\nCODE CONTEXT:\n${observations[0]}\n`;
    }

    prompt += `\nRespond in this EXACT JSON format (no other text):
{
  "rootCause": "Clear explanation of what went wrong and why, referencing specific code when available",
  "fixGuidelines": [
    "Step 1: Specific action to fix the issue (reference line numbers if applicable)",
    "Step 2: Another specific action",
    "Step 3: Best practice to prevent recurrence"
  ],
  "confidence": 0.85
}

IMPORTANT: Respond ONLY with valid JSON, no other text.`;

    return prompt;
  }

  /**
   * Legacy method: Parse response for final conclusion
   */
  private parseResponseLegacy(output: string): {
    thought: string;
    action: ToolCall | null;
    rootCause?: string;
    fixGuidelines?: string[];
    confidence?: number;
  } {
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.rootCause && Array.isArray(parsed.fixGuidelines)) {
          return {
            thought: output,
            action: null,
            rootCause: parsed.rootCause,
            fixGuidelines: parsed.fixGuidelines,
            confidence: parsed.confidence || 0.5,
          };
        }
      }
    } catch (e) {
      // Fall through to default
    }

    return {
      thought: output.trim(),
      action: null,
    };
  }

  /**
   * Legacy method: Parse LLM output into structured result
   */
  private parseOutputLegacy(output: string, error: ParsedError, state: AgentState): RCAResult {
    try {
      // Try to extract JSON from output (LLM might add extra text)
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in output');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.rootCause || !Array.isArray(parsed.fixGuidelines)) {
        throw new Error('Invalid JSON structure');
      }

      return {
        error: error.message,
        rootCause: parsed.rootCause,
        fixGuidelines: parsed.fixGuidelines,
        confidence: parsed.confidence || 0.5,
        iterations: state.iteration,
        toolsUsed: state.actions.map((a) => a.tool),
      };
    } catch (e) {
      // Fallback: Use output as-is
      console.warn('Failed to parse JSON output, using fallback:', e);

      return {
        error: error.message,
        rootCause: output,
        fixGuidelines: [
          'Review the error message and stack trace',
          'Check variable initialization',
          'Verify null safety in Kotlin code',
        ],
        confidence: 0.3, // Low confidence for fallback
        iterations: state.iteration,
        toolsUsed: state.actions.map((a) => a.tool),
      };
    }
  }

  /**
   * Check if analysis has exceeded timeout
   */
  private checkTimeout(state: AgentState): void {
    const elapsed = Date.now() - state.startTime;
    if (elapsed > state.timeout) {
      throw new AnalysisTimeoutError(
        `Analysis timed out after ${elapsed}ms`,
        state.iteration,
        state.maxIterations
      );
    }
  }

  /**
   * Get agent configuration
   */
  getConfig() {
    return {
      maxIterations: this.maxIterations,
      timeout: this.timeout,
      usePromptEngine: this.usePromptEngine,
      useToolRegistry: this.useToolRegistry,
    };
  }

  /**
   * Get tool registry (for testing and inspection)
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * Get prompt engine (for testing and inspection)
   */
  getPromptEngine(): PromptEngine {
    return this.promptEngine;
  }
}
