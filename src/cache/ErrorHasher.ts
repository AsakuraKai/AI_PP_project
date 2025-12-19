/**
 * Error Hasher for RCA Cache
 * 
 * Generates consistent SHA-256 hashes for parsed errors to enable
 * fast cache lookups for repeat errors. Normalizes error messages
 * to improve cache hit rates for semantically similar errors.
 * 
 * @module cache/ErrorHasher
 */

import * as crypto from 'crypto';
import { ParsedError } from '../types';

/**
 * Configuration for ErrorHasher
 */
export interface ErrorHasherConfig {
  /** Include file path in hash (default: true) */
  includeFilePath?: boolean;
  
  /** Include line number in hash (default: true) */
  includeLineNumber?: boolean;
  
  /** Include column number in hash (default: false) */
  includeColumnNumber?: boolean;
  
  /** Hash algorithm to use (default: 'sha256') */
  algorithm?: 'sha256' | 'sha512' | 'md5';
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ErrorHasherConfig> = {
  includeFilePath: true,
  includeLineNumber: true,
  includeColumnNumber: false,
  algorithm: 'sha256'
};

/**
 * Error Hasher for generating cache keys
 * 
 * Generates deterministic hashes for ParsedError objects to enable
 * efficient caching and lookup of previously analyzed errors.
 * 
 * Key features:
 * - Normalizes error messages (lowercase, whitespace, numbers)
 * - Configurable hash components (file path, line number)
 * - SHA-256 for security and uniqueness
 * - Handles edge cases (null, undefined, empty strings)
 * 
 * @example
 * ```typescript
 * const hasher = new ErrorHasher();
 * const hash = hasher.hash(parsedError);
 * // Returns: 'a1b2c3d4...' (64-char hex string)
 * ```
 */
export class ErrorHasher {
  private readonly config: Required<ErrorHasherConfig>;
  
  /**
   * Create a new ErrorHasher instance
   * 
   * @param config - Configuration options
   */
  constructor(config: ErrorHasherConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Generate hash for a parsed error
   * 
   * Creates a deterministic hash based on:
   * - Error type
   * - Normalized error message
   * - File path (optional)
   * - Line number (optional)
   * 
   * @param error - Parsed error to hash
   * @returns SHA-256 hash as hex string
   * 
   * @example
   * ```typescript
   * const hash = hasher.hash({
   *   type: 'lateinit',
   *   message: 'lateinit property user has not been initialized',
   *   filePath: 'MainActivity.kt',
   *   line: 45,
   *   language: 'kotlin'
   * });
   * ```
   */
  hash(error: ParsedError): string {
    // Build key components
    const components: string[] = [
      error.type,
      this.normalize(error.message),
      error.language
    ];
    
    if (this.config.includeFilePath && error.filePath) {
      // Normalize file path: lowercase, forward slashes
      components.push(this.normalizeFilePath(error.filePath));
    }
    
    if (this.config.includeLineNumber && error.line > 0) {
      components.push(String(error.line));
    }
    
    if (this.config.includeColumnNumber && error.column && error.column > 0) {
      components.push(String(error.column));
    }
    
    // Join with separator and hash
    const key = components.join('|');
    return this.computeHash(key);
  }
  
  /**
   * Generate a hash for just the error message (without location)
   * 
   * Useful for finding semantically similar errors across different files.
   * 
   * @param error - Parsed error to hash
   * @returns SHA-256 hash as hex string
   */
  hashMessageOnly(error: ParsedError): string {
    const components: string[] = [
      error.type,
      this.normalize(error.message),
      error.language
    ];
    
    const key = components.join('|');
    return this.computeHash(key);
  }
  
  /**
   * Generate a hash for custom content
   * 
   * @param content - String content to hash
   * @returns Hash as hex string
   */
  hashString(content: string): string {
    return this.computeHash(content);
  }
  
  /**
   * Normalize error message for consistent hashing
   * 
   * Applies transformations:
   * - Convert to lowercase
   * - Collapse whitespace to single space
   * - Replace numbers with 'N' (for line numbers, memory addresses, etc.)
   * - Trim leading/trailing whitespace
   * - Remove ANSI escape codes
   * 
   * @param message - Error message to normalize
   * @returns Normalized message
   */
  normalize(message: string): string {
    if (!message) {
      return '';
    }
    
    return message
      // Remove ANSI escape codes (color codes in terminal output)
      .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
      // Replace UUIDs first (before other transformations affect them)
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID')
      // Replace memory addresses like 0x1a2b3c (before number replacement)
      .replace(/0x[a-f0-9]+/gi, 'HEXADDR')
      // Replace numbers with placeholder (preserves pattern without specific values)
      .replace(/\d+/g, 'N')
      // Convert to lowercase (after N replacement so N stays as n)
      .toLowerCase()
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      // Trim
      .trim();
  }
  
  /**
   * Normalize file path for consistent hashing
   * 
   * @param filePath - File path to normalize
   * @returns Normalized path
   */
  normalizeFilePath(filePath: string): string {
    if (!filePath) {
      return '';
    }
    
    return filePath
      // Convert to lowercase
      .toLowerCase()
      // Normalize path separators to forward slash
      .replace(/\\/g, '/')
      // Remove leading ./ if present
      .replace(/^\.\//, '')
      // Remove trailing slash
      .replace(/\/$/, '');
  }
  
  /**
   * Compute hash using configured algorithm
   * 
   * @param content - Content to hash
   * @returns Hash as hex string
   */
  private computeHash(content: string): string {
    return crypto
      .createHash(this.config.algorithm)
      .update(content, 'utf8')
      .digest('hex');
  }
  
  /**
   * Get the algorithm being used
   */
  getAlgorithm(): string {
    return this.config.algorithm;
  }
  
  /**
   * Get the current configuration
   */
  getConfig(): Required<ErrorHasherConfig> {
    return { ...this.config };
  }
  
  /**
   * Check if two errors would generate the same hash
   * 
   * @param error1 - First error
   * @param error2 - Second error
   * @returns True if hashes match
   */
  areEqual(error1: ParsedError, error2: ParsedError): boolean {
    return this.hash(error1) === this.hash(error2);
  }
}
