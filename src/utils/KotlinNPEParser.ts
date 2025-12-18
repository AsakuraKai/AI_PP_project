/**
 * KotlinNPEParser - Parser for Kotlin NullPointerException and lateinit errors
 * 
 * Extracts structured information from Kotlin error messages, including:
 * - lateinit property access errors
 * - Standard NullPointerException
 * - File paths and line numbers from stack traces
 * 
 * Design Philosophy:
 * - Regex-based parsing for speed
 * - Graceful degradation (return null if can't parse)
 * - Extract maximum context for agent reasoning
 * 
 * @example
 * const parser = new KotlinNPEParser();
 * const error = parser.parse(errorText);
 * if (error) {
 *   console.log(`Error at ${error.filePath}:${error.line}`);
 * }
 */

import { ParsedError } from '../types';

export class KotlinNPEParser {
  // Regex patterns for different Kotlin error types
  private static readonly PATTERNS = {
    // lateinit property user has not been initialized
    lateinit: /lateinit property (\w+) has not been initialized/i,
    
    // NullPointerException patterns (includes IndexOutOfBoundsException)
    npe: /(?:NullPointerException|IndexOutOfBoundsException)/i,
    
    // UninitializedPropertyAccessException
    uninitializedProperty: /UninitializedPropertyAccessException.*lateinit property (\w+)/i,
    
    // Stack trace: at com.example.MainActivity.onCreate(MainActivity.kt:45)
    stackTrace: /at\s+(?:[\w.]+\.)?(\w+)\.([\w<>]+)\((\w+\.kt):(\d+)\)/g,
    
    // Alternative stack trace format: MainActivity.kt:45
    simpleStack: /(\w+\.kt):(\d+)/g,
  };

  /**
   * Parse Kotlin error text into structured format
   * 
   * @param errorText - Raw error message from Kotlin/Android
   * @returns ParsedError if successfully parsed, null if not a Kotlin error
   */
  parse(errorText: string): ParsedError | null {
    if (!errorText || typeof errorText !== 'string') {
      return null;
    }

    // Trim and limit size to prevent DoS
    const text = errorText.trim().slice(0, 50000);

    // Try parsing as lateinit error
    const lateinitError = this.parseLateinitError(text);
    if (lateinitError) {
      return lateinitError;
    }

    // Try parsing as standard NPE
    const npeError = this.parseNPE(text);
    if (npeError) {
      return npeError;
    }

    // Not a recognizable Kotlin error
    return null;
  }

  /**
   * Parse lateinit property access error
   */
  private parseLateinitError(text: string): ParsedError | null {
    // Check for lateinit pattern
    const lateinitMatch = text.match(KotlinNPEParser.PATTERNS.lateinit);
    if (!lateinitMatch) {
      // Try UninitializedPropertyAccessException format
      const uninitMatch = text.match(KotlinNPEParser.PATTERNS.uninitializedProperty);
      if (!uninitMatch) {
        return null;
      }
      
      const propertyName = uninitMatch[1];
      const { filePath, line, stackTrace } = this.extractStackInfo(text);

      return {
        type: 'lateinit',
        message: text,
        filePath,
        line,
        language: 'kotlin',
        stackTrace,
        metadata: {
          propertyName,
          errorType: 'UninitializedPropertyAccessException',
        },
      };
    }

    const propertyName = lateinitMatch[1];
    const { filePath, line, stackTrace } = this.extractStackInfo(text);

    return {
      type: 'lateinit',
      message: text,
      filePath,
      line,
      language: 'kotlin',
      stackTrace,
      metadata: {
        propertyName,
        errorType: 'lateinit property not initialized',
      },
    };
  }

  /**
   * Parse standard NullPointerException and IndexOutOfBoundsException
   */
  private parseNPE(text: string): ParsedError | null {
    if (!KotlinNPEParser.PATTERNS.npe.test(text)) {
      return null;
    }

    const { filePath, line, stackTrace } = this.extractStackInfo(text);
    
    // Determine specific error type
    const isIndexOutOfBounds = /IndexOutOfBoundsException/i.test(text);

    return {
      type: 'npe',
      message: text,
      filePath,
      line,
      language: 'kotlin',
      stackTrace,
      metadata: {
        errorType: isIndexOutOfBounds ? 'IndexOutOfBoundsException' : 'NullPointerException',
      },
    };
  }

  /**
   * Extract file path, line number, and stack trace from error text
   */
  private extractStackInfo(text: string): {
    filePath: string;
    line: number;
    stackTrace: Array<{ file: string; line: number; function?: string; className?: string }>;
  } {
    const stackTrace: Array<{
      file: string;
      line: number;
      function?: string;
      className?: string;
    }> = [];

    // Try full stack trace format first
    let match;
    const fullStackRegex = new RegExp(KotlinNPEParser.PATTERNS.stackTrace);
    
    while ((match = fullStackRegex.exec(text)) !== null) {
      const [, className, functionName, file, lineStr] = match;
      stackTrace.push({
        file,
        line: parseInt(lineStr, 10),
        function: functionName,
        className,
      });
    }

    // If no full stack traces, try simple format
    if (stackTrace.length === 0) {
      const simpleStackRegex = new RegExp(KotlinNPEParser.PATTERNS.simpleStack);
      while ((match = simpleStackRegex.exec(text)) !== null) {
        const [, file, lineStr] = match;
        stackTrace.push({
          file,
          line: parseInt(lineStr, 10),
        });
      }
    }

    // Use first stack frame if available, otherwise use defaults
    if (stackTrace.length > 0) {
      return {
        filePath: stackTrace[0].file,
        line: stackTrace[0].line,
        stackTrace,
      };
    }

    return {
      filePath: 'unknown',
      line: 0,
      stackTrace: [],
    };
  }

  /**
   * Get supported error types
   */
  static getSupportedTypes(): string[] {
    return ['lateinit', 'npe'];
  }

  /**
   * Check if error text looks like a Kotlin error (quick check)
   */
  static isKotlinError(errorText: string): boolean {
    if (!errorText) return false;
    
    return (
      /\.kt:/i.test(errorText) || // Contains .kt file reference
      /lateinit/i.test(errorText) || // Contains lateinit keyword
      /kotlin\./i.test(errorText) || // Contains kotlin. namespace
      /UninitializedPropertyAccessException/i.test(errorText)
    );
  }
}
