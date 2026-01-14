/**
 * KotlinParser - Comprehensive parser for all Kotlin errors
 * 
 * Handles all Kotlin error types:
 * - lateinit property errors
 * - NullPointerException and IndexOutOfBoundsException
 * - Unresolved reference errors
 * - Type mismatch errors
 * - Compilation errors
 * - Import errors
 * 
 * Design Philosophy:
 * - Extends BaseParser for shared utilities
 * - Pattern matching for each error type
 * - Extract maximum context for debugging
 * - Consolidated from KotlinNPEParser (no longer separate)
 * 
 * @example
 * const parser = new KotlinParser();
 * const error = parser.parse(errorText);
 * if (error?.type === 'unresolved_reference') {
 *   console.log(`Cannot resolve: ${error.metadata.symbolName}`);
 * }
 */

import { ParsedError } from '../../types';
import { BaseParser } from './BaseParser';

export class KotlinParser extends BaseParser {
  // Regex patterns for lateinit and NPE errors
  private static readonly NPE_PATTERNS = {
    lateinit: /lateinit property (\w+) has not been initialized/i,
    npe: /(?:NullPointerException|IndexOutOfBoundsException)/i,
    uninitializedProperty: /UninitializedPropertyAccessException.*lateinit property (\w+)/i,
  };

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

    // Sanitize input
    const text = this.sanitizeInput(errorText, 100000);

    // Try parsing lateinit and NPE errors first (most common)
    const npeError = this.parseLateinitOrNPE(text);
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
   * Parse lateinit and NullPointerException errors
   * Consolidated from KotlinNPEParser
   */
  private parseLateinitOrNPE(text: string): ParsedError | null {
    // Try lateinit errors first
    const lateinitError = this.parseLateinitError(text);
    if (lateinitError) {
      return lateinitError;
    }

    // Try NPE errors
    return this.parseNPE(text);
  }

  /**
   * Parse lateinit property access error
   */
  private parseLateinitError(text: string): ParsedError | null {
    // Check for lateinit pattern
    const lateinitMatch = text.match(KotlinParser.NPE_PATTERNS.lateinit);
    if (!lateinitMatch) {
      // Try UninitializedPropertyAccessException format
      const uninitMatch = text.match(KotlinParser.NPE_PATTERNS.uninitializedProperty);
      if (!uninitMatch) {
        return null;
      }
      
      const propertyName = uninitMatch[1];
      const { filePath, line, stackTrace } = this.extractStackInfo(text, 'kt');

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
    const { filePath, line, stackTrace } = this.extractStackInfo(text, 'kt');

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
    if (!KotlinParser.NPE_PATTERNS.npe.test(text)) {
      return null;
    }

    const { filePath, line, stackTrace } = this.extractStackInfo(text, 'kt');
    
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
        const { filePath, line } = this.extractFileInfo(text, 'kt');

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
        const { filePath, line } = this.extractFileInfo(text, 'kt');

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
        const { filePath, line } = this.extractFileInfo(text, 'kt');
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
        const { filePath, line } = this.extractFileInfo(text, 'kt');

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
      /NullPointerException/i,
      /IndexOutOfBoundsException/i,
      /UninitializedPropertyAccessException/i,
    ];

    return kotlinIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Get supported error types
   */
  static getSupportedTypes(): string[] {
    return [
      'lateinit',
      'npe',
      'unresolved_reference',
      'type_mismatch',
      'compilation_error',
      'import_error',
    ];
  }
}
