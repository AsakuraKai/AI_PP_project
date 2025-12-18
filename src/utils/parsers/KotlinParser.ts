/**
 * KotlinParser - Comprehensive parser for Kotlin errors
 * 
 * Extends KotlinNPEParser to handle additional Kotlin error types:
 * - Unresolved reference errors
 * - Type mismatch errors
 * - Compilation errors
 * - Import errors
 * - lateinit and NPE errors (from KotlinNPEParser)
 * 
 * Design Philosophy:
 * - Composition over inheritance (uses KotlinNPEParser)
 * - Pattern matching for each error type
 * - Extract maximum context for debugging
 * 
 * @example
 * const parser = new KotlinParser();
 * const error = parser.parse(errorText);
 * if (error?.type === 'unresolved_reference') {
 *   console.log(`Cannot resolve: ${error.metadata.symbolName}`);
 * }
 */

import { ParsedError } from '../../types';
import { KotlinNPEParser } from '../KotlinNPEParser';

export class KotlinParser {
  private npeParser: KotlinNPEParser;

  constructor() {
    this.npeParser = new KotlinNPEParser();
  }

  /**
   * Parse Kotlin error text into structured format
   * Tries multiple error type parsers in order of specificity
   * 
   * @param errorText - Raw error message from Kotlin compiler or runtime
   * @returns ParsedError if successfully parsed, null if not a Kotlin error
   */
  parse(errorText: string): ParsedError | null {
    if (!errorText || typeof errorText !== 'string') {
      return null;
    }

    // Trim and limit size
    const text = errorText.trim().slice(0, 100000);

    // Try parsing with KotlinNPEParser first (lateinit, NPE)
    const npeError = this.npeParser.parse(text);
    if (npeError) {
      return npeError;
    }

    // Try other Kotlin-specific errors (order matters - check import before unresolved reference)
    return (
      this.parseImportError(text) ||
      this.parseUnresolvedReference(text) ||
      this.parseTypeMismatch(text) ||
      this.parseCompilationError(text) ||
      null
    );
  }

  /**
   * Parse unresolved reference errors
   * Example: "Unresolved reference: someFunction"
   */
  private parseUnresolvedReference(text: string): ParsedError | null {
    const patterns = [
      /Unresolved reference:\s*(\w+)/i,
      /Cannot resolve symbol\s+'(\w+)'/i,
      /Unresolved reference to '(\w+)'/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const symbolName = match[1];
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'unresolved_reference',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            symbolName,
            errorType: 'Unresolved reference',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse type mismatch errors
   * Example: "Type mismatch: inferred type is String but Int was expected"
   */
  private parseTypeMismatch(text: string): ParsedError | null {
    const patterns = [
      /Type mismatch:.*inferred type is\s+(\w+(?:<[^>]+>)?)\s+but\s+(\w+(?:<[^>]+>)?)\s+was expected/i,
      /Required:\s*(\w+(?:<[^>]+>)?)\s*Found:\s*(\w+(?:<[^>]+>)?)/i,
      /Type mismatch:\s*required\s+(\w+)\s+found\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const foundType = match[2] || match[1];
        const expectedType = match[1] || match[2];
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'type_mismatch',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            expectedType,
            foundType,
            errorType: 'Type mismatch',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse compilation errors
   * Example: "Expecting a top level declaration"
   */
  private parseCompilationError(text: string): ParsedError | null {
    const patterns = [
      /Expecting\s+(.*?)(?:\n|$)/i,
      /Syntax error/i,
      /Declaration expected/i,
      /Modifier\s+'\w+'\s+is not applicable/i,
      /Function declaration must have a name/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const { filePath, line } = this.extractFileInfo(text);
        const description = match[1] || match[0];

        return {
          type: 'compilation_error',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            description: description.trim(),
            errorType: 'Compilation error',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse import errors
   * Example: "Unresolved reference: androidx"
   */
  private parseImportError(text: string): ParsedError | null {
    // Must be an import-related error - check for import context more strictly
    const lines = text.split('\n').length;
    const hasImportContext = /\bimport\b.*unresolved/i.test(text) || 
                             /unresolved.*import/i.test(text) ||
                             (text.includes('import') && lines <= 5);
    
    if (!hasImportContext) {
      return null;
    }

    const patterns = [
      /Unresolved reference:\s*(\w+(?:\.\w+)*)/i,
      /Cannot access\s+'([^']+)'/i,
      /Package '([^']+)' could not be resolved/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const packageName = match[1];
        const { filePath, line } = this.extractFileInfo(text);

        return {
          type: 'import_error',
          message: text,
          filePath,
          line,
          language: 'kotlin',
          metadata: {
            packageName,
            errorType: 'Import error',
          },
        };
      }
    }

    return null;
  }

  /**
   * Extract file path and line number from error text
   */
  private extractFileInfo(text: string): { filePath: string; line: number } {
    // Try standard compiler format: "file.kt:line:column"
    const compilerMatch = text.match(/(\w+\.kt):(\d+):(\d+)/);
    if (compilerMatch) {
      return {
        filePath: compilerMatch[1],
        line: parseInt(compilerMatch[2], 10),
      };
    }

    // Try simplified format: "file.kt:line"
    const simpleMatch = text.match(/(\w+\.kt):(\d+)/);
    if (simpleMatch) {
      return {
        filePath: simpleMatch[1],
        line: parseInt(simpleMatch[2], 10),
      };
    }

    // Try format with path: "at path/file.kt (file.kt:line)"
    const pathMatch = text.match(/\(([\w.]+\.kt):(\d+)\)/);
    if (pathMatch) {
      return {
        filePath: pathMatch[1],
        line: parseInt(pathMatch[2], 10),
      };
    }

    return {
      filePath: 'unknown',
      line: 0,
    };
  }

  /**
   * Quick check if text contains Kotlin error patterns
   * Useful for routing before full parsing
   */
  static isKotlinError(text: string): boolean {
    if (!text) return false;

    const kotlinIndicators = [
      /\.kt:/,
      /kotlin\./i,
      /lateinit/i,
      /suspend/i,
      /coroutine/i,
      /Unresolved reference/i,
      /Type mismatch/i,
    ];

    return kotlinIndicators.some(pattern => pattern.test(text));
  }
}
