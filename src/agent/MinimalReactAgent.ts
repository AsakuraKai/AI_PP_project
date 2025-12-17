/**
 * MinimalReactAgent - Simplified ReAct loop for MVP
 * 
 * Implements a 3-iteration reasoning loop with file reading tool (Chunk 1.4).
 * Uses the ReAct (Reasoning + Acting) paradigm:
 * - Thought: Generate hypothesis about error
 * - Action: Read file at error location
 * - Observation: Code context around error
 * 
 * Design Decisions:
 * - Fixed 3 iterations for MVP (will become dynamic later)
 * - Integrates ReadFileTool for code context
 * - Simple JSON parsing with fallback
 * - Timeout handling (90s default)
 * 
 * @example
 * const agent = new MinimalReactAgent(ollamaClient);
 * const result = await agent.analyze(parsedError);
 * console.log(result.rootCause);
 */

import { OllamaClient } from '../llm/OllamaClient';
import { ReadFileTool } from '../tools/ReadFileTool';
import {
  ParsedError,
  RCAResult,
  AgentState,
  AnalysisTimeoutError,
  LLMError,
} from '../types';

export class MinimalReactAgent {
  private readonly maxIterations = 3;
  private readonly timeout = 90000; // 90 seconds
  private readonly readFileTool: ReadFileTool;

  constructor(
    private llm: OllamaClient,
    readFileTool?: ReadFileTool
  ) {
    this.readFileTool = readFileTool || new ReadFileTool();
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
      // Read file context for error location
      let fileContent: string | null = null;
      try {
        fileContent = await this.readFileTool.execute(error.filePath, error.line);
      } catch (e) {
        console.warn('Failed to read file, continuing without code context:', e);
        fileContent = null;
      }

      // Store file content in state for later use
      state.fileContent = fileContent;

      // Iteration 1: Initial hypothesis
      state.iteration = 1;
      const thought1 = await this.generateThought(state, null);
      state.thoughts.push(thought1);
      state.hypothesis = thought1;

      this.checkTimeout(state);

      // Iteration 2: Deeper analysis with code context
      state.iteration = 2;
      const thought2 = await this.generateThought(state, thought1);
      state.thoughts.push(thought2);

      this.checkTimeout(state);

      // Iteration 3: Final conclusion with full context
      state.iteration = 3;
      const finalOutput = await this.generateFinalAnalysis(state);

      return this.parseOutput(finalOutput, error);
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
   * Generate thought for current iteration
   */
  private async generateThought(
    state: AgentState,
    previousThought: string | null
  ): Promise<string> {
    const prompt = this.buildThoughtPrompt(state, previousThought);
    const response = await this.llm.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    return response.text.trim();
  }

  /**
   * Generate final analysis with structured output
   */
  private async generateFinalAnalysis(state: AgentState): Promise<string> {
    const prompt = this.buildFinalPrompt(state);
    const response = await this.llm.generate(prompt, {
      temperature: 0.5, // Lower temperature for structured output
      maxTokens: 1500,
    });

    return response.text.trim();
  }

  /**
   * Build prompt for thought generation
   */
  private buildThoughtPrompt(
    state: AgentState,
    previousThought: string | null
  ): string {
    const { error, iteration, fileContent } = state;

    let prompt = `You are a debugging expert analyzing a Kotlin error. This is iteration ${iteration}/${this.maxIterations}.

ERROR INFORMATION:
Type: ${error.type}
Message: ${error.message}
File: ${error.filePath}
Line: ${error.line}
${error.metadata ? `Additional Info: ${JSON.stringify(error.metadata, null, 2)}` : ''}`;

    // Include code context if available
    if (fileContent && iteration >= 2) {
      prompt += `\n\nCODE CONTEXT:\n${fileContent}\n`;
    }

    prompt += `\n${previousThought ? `PREVIOUS ANALYSIS:\n${previousThought}\n\n` : ''}

TASK:
${iteration === 1 ? 'Generate your initial hypothesis about what caused this error. Focus on Kotlin-specific issues.' : ''}
${iteration === 2 ? 'Deepen your analysis using the code context. What are the likely causes? Look at the actual code and identify specific issues.' : ''}

Be specific and reference the actual code when available. Think step-by-step.

YOUR ANALYSIS:`;

    return prompt;
  }

  /**
   * Build prompt for final analysis
   */
  private buildFinalPrompt(state: AgentState): string {
    const { error, thoughts, fileContent } = state;

    let prompt = `Based on your analysis, provide the final root cause and fix guidelines.

ERROR: ${error.message}

YOUR REASONING:
${thoughts.map((t, i) => `Iteration ${i + 1}: ${t}`).join('\n\n')}`;

    // Include code context in final analysis
    if (fileContent) {
      prompt += `\n\nCODE CONTEXT:\n${fileContent}\n`;
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
   * Parse LLM output into structured result
   */
  private parseOutput(output: string, error: ParsedError): RCAResult {
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
    };
  }
}
