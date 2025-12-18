/**
 * ErrorParser - Main router for language-specific error parsers
 * 
 * Automatically detects error language and routes to appropriate parser:
 * - Kotlin errors → KotlinParser
 * - Gradle errors → GradleParser
 * - Auto-detection using LanguageDetector
 * 
 * Design Philosophy:
 * - Single entry point for all error parsing
 * - Automatic language detection
 * - Extensible for new parsers
 * - Type-safe parser registration
 * 
 * @example
 * const parser = ErrorParser.getInstance();
 * const error = parser.parse(errorText);
 * if (error) {
 *   console.log(`${error.type} at ${error.filePath}:${error.line}`);
 * }
 */

import { ParsedError } from '../types';
import { LanguageDetector } from './LanguageDetector';
import { KotlinParser } from './parsers/KotlinParser';
import { GradleParser } from './parsers/GradleParser';

/**
 * Interface for language-specific parsers
 */
interface LanguageParser {
  parse(errorText: string): ParsedError | null;
}

/**
 * Main error parser with automatic language detection
 */
export class ErrorParser {
  private static instance: ErrorParser;
  private parsers: Map<string, LanguageParser>;

  private constructor() {
    this.parsers = new Map();
    this.registerDefaultParsers();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorParser {
    if (!ErrorParser.instance) {
      ErrorParser.instance = new ErrorParser();
    }
    return ErrorParser.instance;
  }

  /**
   * Register default parsers for supported languages
   */
  private registerDefaultParsers(): void {
    this.registerParser('kotlin', new KotlinParser());
    this.registerParser('gradle', new GradleParser());
    // Future: Java, XML parsers will be added here
  }

  /**
   * Register a custom parser for a language
   * 
   * @param language - Language identifier
   * @param parser - Parser instance implementing LanguageParser interface
   */
  registerParser(language: string, parser: LanguageParser): void {
    this.parsers.set(language.toLowerCase(), parser);
  }

  /**
   * Parse error text with automatic language detection
   * 
   * @param errorText - Raw error message
   * @param filePath - Optional file path hint for language detection
   * @returns ParsedError if successfully parsed, null otherwise
   */
  parse(errorText: string, filePath?: string): ParsedError | null {
    if (!errorText || typeof errorText !== 'string') {
      return null;
    }

    // Detect language
    const language = LanguageDetector.detect(errorText, filePath);
    
    if (language === 'unknown') {
      // Try all parsers in order of likelihood
      return this.tryAllParsers(errorText);
    }

    // Use detected language parser
    return this.parseWithLanguage(errorText, language);
  }

  /**
   * Parse error with explicit language specification
   * 
   * @param errorText - Raw error message
   * @param language - Explicit language identifier
   * @returns ParsedError if successfully parsed, null otherwise
   */
  parseWithLanguage(errorText: string, language: string): ParsedError | null {
    const parser = this.parsers.get(language.toLowerCase());
    
    if (!parser) {
      console.warn(`No parser registered for language: ${language}`);
      return null;
    }

    try {
      return parser.parse(errorText);
    } catch (error) {
      console.error(`Parser error for ${language}:`, error);
      return null;
    }
  }

  /**
   * Try all registered parsers until one succeeds
   * Used when language detection fails
   */
  private tryAllParsers(errorText: string): ParsedError | null {
    // Try in order of most common errors
    const tryOrder = ['kotlin', 'gradle', 'java', 'xml'];

    for (const language of tryOrder) {
      const parser = this.parsers.get(language);
      if (parser) {
        try {
          const result = parser.parse(errorText);
          if (result) {
            return result;
          }
        } catch (error) {
          // Continue to next parser
          continue;
        }
      }
    }

    // Try remaining parsers
    for (const [language, parser] of this.parsers.entries()) {
      if (!tryOrder.includes(language)) {
        try {
          const result = parser.parse(errorText);
          if (result) {
            return result;
          }
        } catch (error) {
          // Continue to next parser
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.parsers.has(language.toLowerCase());
  }

  /**
   * Get parser for specific language (for testing or direct use)
   */
  getParser(language: string): LanguageParser | undefined {
    return this.parsers.get(language.toLowerCase());
  }

  /**
   * Clear all registered parsers (for testing)
   */
  clearParsers(): void {
    this.parsers.clear();
  }

  /**
   * Reset to default parsers (for testing)
   */
  resetParsers(): void {
    this.clearParsers();
    this.registerDefaultParsers();
  }
}

/**
 * Convenience function for quick parsing
 * 
 * @param errorText - Raw error message
 * @param filePath - Optional file path hint
 * @returns ParsedError if successfully parsed, null otherwise
 */
export function parseError(errorText: string, filePath?: string): ParsedError | null {
  return ErrorParser.getInstance().parse(errorText, filePath);
}
