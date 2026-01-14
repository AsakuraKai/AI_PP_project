/**
 * BasePromptEngine - Shared prompt utilities for backend and chat
 * 
 * Consolidates common prompt generation logic between:
 * - src/agent/PromptEngine.ts (backend agent)
 * - vscode-extension/src/chat/ChatPromptEngine.ts (chat participant)
 * 
 * This base class provides:
 * - JSON extraction/parsing with multiple strategies
 * - Response validation
 * - Common prompt formatting utilities
 * 
 * @created Chunk 14-15 Consolidation
 */

export interface ParsedError {
  type?: string;
  message: string;
  filePath?: string;
  line?: number;
  stackTrace?: string[];
  language?: string;
  metadata?: any;
}

/**
 * Base class for all prompt engines
 */
export abstract class BasePromptEngine {
  /**
   * Extract JSON from LLM response (handles extra text)
   * Multi-strategy parsing with fallbacks and repair logic
   */
  extractJSON(response: string): any {
    // Pre-processing: Remove <think> tags that DeepSeek-R1 adds
    let cleaned = response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    cleaned = cleaned.replace(/`<think>[\s\S]*$/gi, '').trim();
    
    // Strategy 1: Try direct parsing
    try {
      return JSON.parse(cleaned);
    } catch {}

    // Strategy 2: Extract from markdown code blocks
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([{[][\s\S]*?[}\]])\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {}
    }

    // Strategy 3: Find the FIRST complete JSON object (balanced braces)
    const jsonMatches = this.extractBalancedJSON(cleaned);
    for (const jsonStr of jsonMatches) {
      try {
        return JSON.parse(jsonStr);
      } catch {
        // Strategy 4: Try to fix common JSON issues
        try {
          const fixed = jsonStr
            .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
            .replace(/\\'/g, "'")            // Fix escaped quotes
            .replace(/\n/g, ' ')             // Remove newlines in strings
            .replace(/\r/g, '')              // Remove carriage returns
            .replace(/\t/g, ' ')             // Replace tabs
            .replace(/""([^"]+)""/g, '"$1"'); // Fix double-quoted strings
          
          return JSON.parse(fixed);
        } catch {}
      }
    }

    // Strategy 5: Try to extract partial JSON and fill missing fields
    const partialJSON = this.extractPartialJSON(cleaned);
    if (partialJSON) {
      return partialJSON;
    }

    // Strategy 6: NEVER FAIL - Return minimal valid JSON
    if (!process.env.JEST_WORKER_ID) {
      console.warn('[WARN] All JSON extraction strategies failed, creating minimal fallback');
    }
    return {
      thought: 'JSON parsing failed - response was: ' + response.substring(0, 150),
      action: null,
      rootCause: 'Analysis incomplete - LLM response could not be parsed',
      fixGuidelines: ['Review the raw LLM output', 'Try running analysis again'],
      confidence: 0.1
    };
  }

  /**
   * Extract balanced JSON objects from text (handles nested braces)
   */
  protected extractBalancedJSON(text: string): string[] {
    const results: string[] = [];
    let depth = 0;
    let start = -1;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (text[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          results.push(text.substring(start, i + 1));
          start = -1;
        }
      }
    }
    
    return results;
  }

  /**
   * Extract partial JSON and fill required fields with defaults
   */
  protected extractPartialJSON(text: string): any | null {
    try {
      const thoughtMatch = text.match(/["']thought["']\s*:\s*["']([^"']+)["']/);
      const actionMatch = text.match(/["']action["']\s*:\s*(null|\{[^}]*\})/);
      const rootCauseMatch = text.match(/["']rootCause["']\s*:\s*["']([^"']*)["']/);
      const fixMatch = text.match(/["']fixGuidelines["']\s*:\s*\[([^\]]*)\]/);
      
      if (thoughtMatch) {
        const partial: any = {
          thought: thoughtMatch[1],
          action: actionMatch ? (actionMatch[1] === 'null' ? null : JSON.parse(actionMatch[1])) : null,
        };
        
        if (partial.action === null) {
          partial.rootCause = rootCauseMatch ? rootCauseMatch[1] : 'Analysis incomplete - see thought';
          partial.fixGuidelines = fixMatch ? JSON.parse(`[${fixMatch[1]}]`) : ['Review error context'];
          partial.confidence = 0.3;
        }
        
        return partial;
      }
      
      if (rootCauseMatch || text.includes('rootCause') || text.includes('error')) {
        if (!process.env.JEST_WORKER_ID) {
          console.warn('[WARN] Using ultra-lenient extraction - creating minimal valid response');
        }
        return {
          thought: rootCauseMatch ? `Analysis: ${rootCauseMatch[1].substring(0, 100)}` : 'See analysis below',
          action: null,
          rootCause: rootCauseMatch ? rootCauseMatch[1] : 'Analysis incomplete - JSON parsing failed',
          fixGuidelines: fixMatch ? JSON.parse(`[${fixMatch[1]}]`) : ['Review error and context', 'Check system logs for more details'],
          confidence: 0.2
        };
      }
    } catch {}
    
    return null;
  }

  /**
   * Validate agent response structure
   */
  validateResponse(response: any): { valid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];
    
    if (!response || typeof response !== 'object') {
      return { valid: false, error: 'Response must be an object' };
    }

    if (!response.thought || typeof response.thought !== 'string' || response.thought.trim().length === 0) {
      return { valid: false, error: 'Missing or invalid "thought" field (required, non-empty string)' };
    }

    // If action is present, validate it
    if (response.action !== null && response.action !== undefined) {
      if (typeof response.action !== 'object') {
        return { valid: false, error: 'Action must be an object or null' };
      }
      if (!response.action.tool || typeof response.action.tool !== 'string') {
        return { valid: false, error: 'Action must have a "tool" field' };
      }
      return { valid: true };
    }

    // If concluding (action is null or undefined), validate conclusion fields
    if (response.action === null || response.action === undefined) {
      if (!response.rootCause || typeof response.rootCause !== 'string' || response.rootCause.trim().length === 0) {
        warnings.push('Missing or empty "rootCause" - using fallback');
        response.rootCause = 'See thought field for analysis';
      }
      
      if (!Array.isArray(response.fixGuidelines)) {
        warnings.push('Missing "fixGuidelines" array - using defaults');
        response.fixGuidelines = ['Review thought field above', 'Manually investigate error'];
      } else if (response.fixGuidelines.length === 0) {
        warnings.push('Empty "fixGuidelines" - adding default');
        response.fixGuidelines.push('Review error context and apply fixes as needed');
      }
      
      if (typeof response.confidence !== 'number') {
        warnings.push('Missing "confidence" - using default 0.5');
        response.confidence = 0.5;
      } else if (response.confidence < 0 || response.confidence > 1) {
        warnings.push(`Invalid confidence ${response.confidence} - clamping to 0.0-1.0`);
        response.confidence = Math.max(0, Math.min(1, response.confidence));
      }
      
      if (warnings.length > 0 && !process.env.JEST_WORKER_ID) {
        console.warn(`[WARN] Response validation warnings (auto-fixed): ${warnings.join(', ')}`);
      }
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  /**
   * Detect language from file path
   */
  protected detectLanguage(filePath?: string): string {
    if (!filePath) return 'text';
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'kt': 'kotlin',
      'java': 'java',
      'xml': 'xml',
      'gradle': 'gradle',
      'kts': 'kotlin',
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
      'md': 'markdown'
    };
    
    return ext ? (languageMap[ext] || 'text') : 'text';
  }

  /**
   * Format diff for display
   */
  protected formatDiff(original: string, fixed: string, _language: string = 'kotlin'): string {
    return `\`\`\`diff
- ${original}
+ ${fixed}
\`\`\``;
  }

  /**
   * Format code block
   */
  protected formatCodeBlock(code: string, language: string = 'kotlin'): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }
}
