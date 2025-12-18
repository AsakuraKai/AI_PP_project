/**
 * PromptEngine - Advanced prompt generation with few-shot examples
 * 
 * Provides structured prompts with:
 * - System instructions for agent behavior
 * - Few-shot examples for each error type
 * - Chain-of-thought prompting templates
 * - Structured output formatting
 * 
 * Design Decisions:
 * - Separate system prompt from user prompts
 * - Error-type specific examples for better accuracy
 * - JSON output templates for consistent parsing
 * - Modular prompt construction for flexibility
 * 
 * @example
 * const engine = new PromptEngine();
 * const prompt = engine.buildAnalysisPrompt(parsedError, fileContent, iteration);
 */

import { ParsedError, AgentState } from '../types';

/**
 * Few-shot example for teaching agent
 */
export interface FewShotExample {
  /** Error description */
  error: string;
  
  /** Agent's thought process */
  thought: string;
  
  /** Action taken */
  action: string;
  
  /** Observation from action */
  observation: string;
  
  /** Final analysis */
  conclusion: {
    rootCause: string;
    fixGuidelines: string[];
    confidence: number;
  };
}

/**
 * Prompt templates for different analysis stages
 */
export class PromptEngine {
  /**
   * Get system prompt with agent instructions
   */
  getSystemPrompt(): string {
    return `You are an expert Kotlin/Android debugging assistant specializing in root cause analysis.

**YOUR ROLE:**
You help developers understand WHY errors occur and HOW to fix them properly.

**ANALYSIS WORKFLOW:**
1. **THOUGHT**: Form a specific hypothesis about the error cause
2. **ACTION**: Use available tools to gather evidence (read_file, find_callers, etc.)
3. **OBSERVATION**: Analyze the evidence collected
4. **ITERATE**: Refine hypothesis based on observations
5. **CONCLUDE**: Provide clear root cause and actionable fix steps

**QUALITY STANDARDS:**
- Be specific - reference actual variable names, line numbers, function names
- Explain WHY, not just WHAT - teach the developer
- Provide actionable fixes - concrete steps, not vague advice
- Use code examples when helpful
- Cite evidence from code you've examined
- Admit uncertainty when appropriate - don't guess

**OUTPUT FORMAT:**
Always respond with valid JSON:
{
  "thought": "Your reasoning about what's happening",
  "action": { "tool": "tool_name", "parameters": {...} } OR null if ready to conclude,
  "rootCause": "Clear explanation of what went wrong" (only when concluding),
  "fixGuidelines": ["Step 1", "Step 2", "Step 3"] (only when concluding),
  "confidence": 0.0-1.0 (only when concluding)
}

**TOOLS AVAILABLE:**
- read_file: Read code at specific location
- find_callers: Find where a function is called
- find_definition: Find where a symbol is defined
- get_symbol_info: Get information about a symbol

**REMEMBER:**
- Real code context beats assumptions
- Multiple iterations are OK - be thorough
- Teaching moment: explain concepts when relevant
- Prevention: suggest how to avoid similar issues`;
  }

  /**
   * Get few-shot examples for specific error type
   */
  getFewShotExamples(errorType: string): FewShotExample[] {
    const examples: Record<string, FewShotExample[]> = {
      'lateinit': [
        {
          error: 'kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized at UserActivity.kt:45',
          thought: 'This is a lateinit property access before initialization. I need to check where "user" is declared and where it should be initialized.',
          action: 'read_file at UserActivity.kt:45 to see the access point and property declaration',
          observation: 'Found: "val name = user.name" at line 45. Property "lateinit var user: User" declared at line 12. No initialization in onCreate() or init block.',
          conclusion: {
            rootCause: 'The lateinit property "user" is declared but never initialized before being accessed. Lateinit properties require explicit initialization before first use, but onCreate() does not initialize it.',
            fixGuidelines: [
              'Initialize "user" in onCreate() before accessing: user = User()',
              'Or make it nullable instead: var user: User? = null',
              'Or check initialization before use: if (::user.isInitialized) { ... }',
            ],
            confidence: 0.95,
          },
        },
      ],
      'npe': [
        {
          error: 'NullPointerException at line 67 in MainActivity.kt: textView.text = data',
          thought: 'NullPointerException suggests textView is null. Need to check how it\'s initialized.',
          action: 'read_file at MainActivity.kt:67 to see textView declaration and initialization',
          observation: 'Found: "private var textView: TextView? = null" at line 15. Line 67: "textView?.text = data" - wait, the error says non-null access. Let me check again... Actually "textView.text" not "textView?.text".',
          conclusion: {
            rootCause: 'textView is declared as nullable (TextView?) but accessed with non-null assertion (textView.text instead of textView?.text). It\'s null at line 67 because findViewById() returned null - likely wrong ID or view not inflated yet.',
            fixGuidelines: [
              'Use safe call: textView?.text = data',
              'Or check for null: if (textView != null) { textView.text = data }',
              'Verify the view ID in findViewById() matches the layout XML',
              'Ensure setContentView() is called before accessing views',
            ],
            confidence: 0.9,
          },
        },
      ],
      'unresolved_reference': [
        {
          error: 'Unresolved reference: AppDatabase at DatabaseHelper.kt:23',
          thought: 'Unresolved reference usually means missing import or the class doesn\'t exist. Let me check the imports and see if AppDatabase is defined.',
          action: 'read_file at DatabaseHelper.kt:23 to see imports and usage',
          observation: 'No import for AppDatabase. Found reference to "val db = AppDatabase.getInstance()". Searching workspace... AppDatabase.kt exists but in different package.',
          conclusion: {
            rootCause: 'AppDatabase class exists in the codebase but is not imported. The file DatabaseHelper.kt is missing the import statement for AppDatabase.',
            fixGuidelines: [
              'Add import statement: import com.example.app.database.AppDatabase',
              'Or use auto-import in IDE (Alt+Enter in IntelliJ/Android Studio)',
              'Verify AppDatabase is in the correct package and compiled',
            ],
            confidence: 0.85,
          },
        },
      ],
      'type_mismatch': [
        {
          error: 'Type mismatch: inferred type is String but Int was expected at line 34 in Calculator.kt',
          thought: 'Type mismatch between String and Int. Need to see what\'s being assigned.',
          action: 'read_file at Calculator.kt:34',
          observation: 'Found: "val result: Int = userInput" where userInput is String from EditText.getText().toString()',
          conclusion: {
            rootCause: 'Attempting to assign a String value directly to an Int variable without conversion. Kotlin requires explicit type conversion.',
            fixGuidelines: [
              'Convert String to Int: val result: Int = userInput.toIntOrNull() ?: 0',
              'Handle invalid input: val result = userInput.toIntOrNull() ?: run { showError(); return }',
              'Use try-catch for conversion: try { userInput.toInt() } catch(e: NumberFormatException) { 0 }',
            ],
            confidence: 0.92,
          },
        },
      ],
    };

    return examples[errorType] || [];
  }

  /**
   * Build initial analysis prompt (iteration 1)
   */
  buildInitialPrompt(error: ParsedError, fileContent?: string | null): string {
    const examples = this.getFewShotExamples(error.type);
    const examplesText = examples.length > 0
      ? `\n\n**EXAMPLES OF SIMILAR ANALYSIS:**\n${this.formatExamples(examples)}`
      : '';

    let contextText = '';
    if (fileContent) {
      contextText = `\n\n**CODE CONTEXT:**\n\`\`\`kotlin\n${fileContent}\n\`\`\``;
    }

    return `${this.getSystemPrompt()}

**ERROR TO ANALYZE:**
Type: ${error.type}
Message: ${error.message}
Location: ${error.filePath}:${error.line}
Language: ${error.language}
${error.metadata ? `Metadata: ${JSON.stringify(error.metadata, null, 2)}` : ''}${contextText}${examplesText}

**YOUR TASK:**
This is iteration 1. Start by forming an initial hypothesis about what caused this error.
Consider what you know from the error message and code context (if available).

Respond with JSON containing your thought and next action.`;
  }

  /**
   * Build iteration prompt (iterations 2+)
   */
  buildIterationPrompt(
    error: ParsedError,
    state: AgentState,
    _previousThought: string,
    previousObservation?: string
  ): string {
    const progress = `Iteration ${state.iteration}/${state.maxIterations}`;
    
    let historyText = '\n**ANALYSIS SO FAR:**\n';
    state.thoughts.forEach((thought, i) => {
      historyText += `\nIteration ${i + 1} Thought: ${thought}\n`;
      if (state.observations[i]) {
        historyText += `Observation: ${state.observations[i]}\n`;
      }
    });

    let observationText = '';
    if (previousObservation) {
      observationText = `\n**LATEST OBSERVATION:**\n${previousObservation}\n`;
    }

    return `${progress}

**ERROR:**
${error.message} at ${error.filePath}:${error.line}
${historyText}${observationText}

**YOUR TASK:**
Based on what you've learned, continue your analysis.
- If you have enough information, provide final conclusion (set action to null)
- If you need more information, specify the next tool to use

Respond with JSON.`;
  }

  /**
   * Build final conclusion prompt
   */
  buildFinalPrompt(error: ParsedError, state: AgentState): string {
    let historyText = '\n**COMPLETE ANALYSIS HISTORY:**\n';
    state.thoughts.forEach((thought, i) => {
      historyText += `\nIteration ${i + 1}:\n`;
      historyText += `  Thought: ${thought}\n`;
      if (state.observations[i]) {
        historyText += `  Observation: ${state.observations[i]}\n`;
      }
    });

    return `**FINAL ANALYSIS REQUIRED**

**ERROR:**
${error.type}: ${error.message}
Location: ${error.filePath}:${error.line}
${historyText}

**YOUR TASK:**
Synthesize everything you've learned and provide your final analysis.

Respond with JSON including:
- thought: Your final reasoning
- action: null (no more actions needed)
- rootCause: Clear explanation of what went wrong
- fixGuidelines: Step-by-step fix instructions (array of strings)
- confidence: Your confidence level (0.0-1.0)

Be specific, cite evidence from code you examined, and provide actionable guidance.`;
  }

  /**
   * Build tool usage prompt
   */
  buildToolPrompt(availableTools: string[]): string {
    return `\n\n**AVAILABLE TOOLS:**
${availableTools.map(tool => `- ${tool}`).join('\n')}

To use a tool, include in your JSON:
"action": { "tool": "tool_name", "parameters": { "param1": "value1" } }

To conclude without using a tool:
"action": null`;
  }

  /**
   * Format few-shot examples
   */
  private formatExamples(examples: FewShotExample[]): string {
    return examples.map((example, i) => {
      return `
Example ${i + 1}:
Error: ${example.error}
Thought: "${example.thought}"
Action: ${example.action}
Observation: ${example.observation}
Conclusion:
  Root Cause: ${example.conclusion.rootCause}
  Fix Guidelines:
${example.conclusion.fixGuidelines.map(step => `    - ${step}`).join('\n')}
  Confidence: ${example.conclusion.confidence}`;
    }).join('\n---\n');
  }

  /**
   * Extract JSON from LLM response (handles extra text)
   */
  extractJSON(response: string): any {
    // Try to find JSON object in response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Invalid JSON in response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate agent response structure
   */
  validateResponse(response: any): { valid: boolean; error?: string } {
    if (!response || typeof response !== 'object') {
      return { valid: false, error: 'Response must be an object' };
    }

    if (!response.thought || typeof response.thought !== 'string') {
      return { valid: false, error: 'Missing or invalid "thought" field' };
    }

    // If action is present, validate it
    if (response.action !== null && response.action !== undefined) {
      if (typeof response.action !== 'object') {
        return { valid: false, error: 'Action must be an object or null' };
      }
      if (!response.action.tool || typeof response.action.tool !== 'string') {
        return { valid: false, error: 'Action must have a "tool" field' };
      }
    }

    // If concluding (action is null), validate conclusion fields
    if (response.action === null) {
      if (!response.rootCause || typeof response.rootCause !== 'string') {
        return { valid: false, error: 'Missing or invalid "rootCause" when concluding' };
      }
      if (!Array.isArray(response.fixGuidelines) || response.fixGuidelines.length === 0) {
        return { valid: false, error: 'Missing or invalid "fixGuidelines" when concluding' };
      }
      if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
        return { valid: false, error: 'Invalid "confidence" value (must be 0.0-1.0)' };
      }
    }

    return { valid: true };
  }
}
