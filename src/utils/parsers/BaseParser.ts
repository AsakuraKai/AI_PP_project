/**
 * BaseParser - Abstract base class for all error parsers
 * 
 * Provides common functionality for error parsing:
 * - File path and line number extraction
 * - Stack trace parsing
 * - Validation utilities
 * - Pattern matching helpers
 * 
 * Design Philosophy:
 * - DRY: Single source of truth for common parsing logic
 * - Extensible: Easy to add new parsers
 * - Type-safe: Strong typing for parser implementations
 * 
 * @example
 * class MyParser extends BaseParser {
 *   parse(errorText: string): ParsedError | null {
 *     const { filePath, line } = this.extractFileInfo(errorText);
 *     return { type: 'my_error', message: errorText, filePath, line };
 *   }
 * }
 */

import { ParsedError } from '../../types';

/**
 * Common interface for all language-specific parsers
 */
export interface IParser {
  parse(errorText: string): ParsedError | null;
}

/**
 * Stack frame information
 */
export interface StackFrame {
  file: string;
  line: number;
  function?: string;
  className?: string;
}

/**
 * Abstract base parser with shared utilities
 */
export abstract class BaseParser implements IParser {
  /**
   * Parse error text - must be implemented by subclasses
   */
  abstract parse(errorText: string): ParsedError | null;

  /**
   * Extract file path and line number from error text
   * Handles multiple common formats:
   * - "file.kt:line:column"
   * - "file.kt:line"
   * - "(file.kt:line)"
   * - "at path/file.kt (file.kt:line)"
   * 
   * @param text - Error text to extract from
   * @param fileExtension - File extension to look for (default: 'kt')
   * @returns File path and line number
   */
  protected extractFileInfo(
    text: string,
    fileExtension: string = 'kt'
  ): { filePath: string; line: number } {
    if (!text) {
      return { filePath: 'unknown', line: 0 };
    }

    // Create dynamic regex based on file extension
    const ext = fileExtension.replace('.', '');

    // Try standard compiler format: "file.ext:line:column"
    const compilerPattern = new RegExp(`([\\w-]+\\.${ext}):(\\d+):(\\d+)`);
    const compilerMatch = text.match(compilerPattern);
    if (compilerMatch) {
      return {
        filePath: compilerMatch[1],
        line: parseInt(compilerMatch[2], 10),
      };
    }

    // Try simplified format: "file.ext:line"
    const simplePattern = new RegExp(`([\\w-]+\\.${ext}):(\\d+)`);
    const simpleMatch = text.match(simplePattern);
    if (simpleMatch) {
      return {
        filePath: simpleMatch[1],
        line: parseInt(simpleMatch[2], 10),
      };
    }

    // Try format with parentheses: "(file.ext:line)"
    const parenPattern = new RegExp(`\\(([\\w.-]+\\.${ext}):(\\d+)\\)`);
    const parenMatch = text.match(parenPattern);
    if (parenMatch) {
      return {
        filePath: parenMatch[1],
        line: parseInt(parenMatch[2], 10),
      };
    }

    // Try format with path: "at path/file.ext (file.ext:line)"
    const pathPattern = new RegExp(`at\\s+[\\w./]+\\(([\\w.]+\\.${ext}):(\\d+)\\)`);
    const pathMatch = text.match(pathPattern);
    if (pathMatch) {
      return {
        filePath: pathMatch[1],
        line: parseInt(pathMatch[2], 10),
      };
    }

    return { filePath: 'unknown', line: 0 };
  }

  /**
   * Extract stack trace information from error text
   * Handles Kotlin/Java stack trace formats
   * 
   * @param text - Error text containing stack traces
   * @param fileExtension - File extension to look for (default: 'kt')
   * @returns Array of stack frames with first frame as primary
   */
  protected extractStackInfo(
    text: string,
    fileExtension: string = 'kt'
  ): {
    filePath: string;
    line: number;
    stackTrace: StackFrame[];
  } {
    if (!text) {
      return { filePath: 'unknown', line: 0, stackTrace: [] };
    }

    const stackTrace: StackFrame[] = [];
    const ext = fileExtension.replace('.', '');

    // Try full stack trace format: "at com.example.MainActivity.onCreate(MainActivity.kt:45)"
    const fullStackPattern = new RegExp(
      `at\\s+(?:[\\w.]+\\.)?(\\w+)\\.(\\w+)\\(([\\w.-]+\\.${ext}):(\\d+)\\)`,
      'g'
    );
    
    let match;
    while ((match = fullStackPattern.exec(text)) !== null) {
      const [, className, functionName, file, lineStr] = match;
      stackTrace.push({
        file,
        line: parseInt(lineStr, 10),
        function: functionName,
        className,
      });
    }

    // If no full stack traces, try simple format: "File.kt:45"
    if (stackTrace.length === 0) {
      const simpleStackPattern = new RegExp(`([\\w.-]+\\.${ext}):(\\d+)`, 'g');
      while ((match = simpleStackPattern.exec(text)) !== null) {
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
   * Extract build file path from Gradle error text
   * Handles both Groovy (.gradle) and Kotlin DSL (.gradle.kts)
   * 
   * @param text - Gradle error text
   * @returns Build file path or 'build.gradle'
   */
  protected extractBuildFile(text: string): string {
    if (!text) return 'build.gradle';

    // Try to find explicit build file reference
    const patterns = [
      /Build file '([^']+)'/i,
      /build\.gradle\.kts:(\d+)/i,
      /build\.gradle:(\d+)/i,
      /settings\.gradle\.kts/i,
      /settings\.gradle/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return 'build.gradle';
  }

  /**
   * Safely trim and limit text size to prevent DoS
   * 
   * @param text - Text to sanitize
   * @param maxLength - Maximum length (default: 100000)
   * @returns Sanitized text
   */
  protected sanitizeInput(text: string, maxLength: number = 100000): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.trim().slice(0, maxLength);
  }

  /**
   * Check if text matches any of the provided patterns
   * 
   * @param text - Text to check
   * @param patterns - Array of RegExp patterns
   * @returns True if any pattern matches
   */
  protected matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract a specific capture group from first matching pattern
   * 
   * @param text - Text to search
   * @param patterns - Array of RegExp patterns
   * @param groupIndex - Capture group index (default: 1)
   * @returns Captured text or null
   */
  protected extractFromPatterns(
    text: string,
    patterns: RegExp[],
    groupIndex: number = 1
  ): string | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[groupIndex]) {
        return match[groupIndex];
      }
    }
    return null;
  }
}

/**
 * Type guard for checking if an object is a valid ParsedError
 */
export function isParsedError(obj: any): obj is ParsedError {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.language === 'string'
  );
}
