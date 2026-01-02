/**
 * PathUtils - Shared cross-platform path utilities
 * 
 * Consolidates path normalization logic used across FileResolver
 * and other modules that need cross-platform path handling.
 * 
 * Design Philosophy:
 * - Single source of truth for path operations
 * - Cross-platform compatibility (Windows/Unix)
 * - Forward slash normalization for consistency
 * 
 * @created Chunk 14-15 Consolidation
 */

import * as path from 'path';

export class PathUtils {
  /**
   * Normalize path separators to forward slashes (cross-platform)
   * 
   * Converts Windows backslashes to forward slashes for consistency.
   * 
   * @param filePath - Path to normalize
   * @returns Normalized path with forward slashes
   * 
   * @example
   * PathUtils.normalize('C:\\Users\\file.txt') // Returns: 'C:/Users/file.txt'
   * PathUtils.normalize('/usr/local/file.txt') // Returns: '/usr/local/file.txt'
   */
  static normalize(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Get relative path with normalized separators
   * 
   * @param from - Base path
   * @param to - Target path
   * @returns Normalized relative path
   */
  static relative(from: string, to: string): string {
    return this.normalize(path.relative(from, to));
  }

  /**
   * Join paths with normalized separators
   * 
   * @param paths - Path segments to join
   * @returns Normalized joined path
   */
  static join(...paths: string[]): string {
    return this.normalize(path.join(...paths));
  }

  /**
   * Resolve absolute path with normalized separators
   * 
   * @param pathSegments - Path segments to resolve
   * @returns Normalized absolute path
   */
  static resolve(...pathSegments: string[]): string {
    return this.normalize(path.resolve(...pathSegments));
  }

  /**
   * Check if path is absolute (cross-platform)
   * 
   * @param filePath - Path to check
   * @returns True if absolute path
   */
  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Get directory name from path
   * 
   * @param filePath - File path
   * @returns Directory name with normalized separators
   */
  static dirname(filePath: string): string {
    return this.normalize(path.dirname(filePath));
  }

  /**
   * Get base name from path
   * 
   * @param filePath - File path
   * @param ext - Optional extension to remove
   * @returns Base name
   */
  static basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get file extension from path
   * 
   * @param filePath - File path
   * @returns File extension including dot (e.g., '.ts')
   */
  static extname(filePath: string): string {
    return path.extname(filePath);
  }
}
