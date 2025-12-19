/**
 * ReadFileTool - File reading utility for code context
 * 
 * Reads source code files and extracts context around error locations.
 * Designed for use in RCA analysis to provide LLM with relevant code snippets.
 * 
 * Features:
 * - Reads ±25 lines around error location (50 lines total)
 * - Handles file not found gracefully
 * - Handles binary files
 * - UTF-8 encoding support
 * - Performance optimized for large files
 * 
 * @example
 * const tool = new ReadFileTool();
 * const content = await tool.execute('MainActivity.kt', 45);
 * // Returns: "Lines 20-70 of MainActivity.kt:\n<code>"
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './ToolRegistry';

export interface ReadFileOptions {
  /** Number of lines before error line (default: 25) */
  linesBefore?: number;
  /** Number of lines after error line (default: 25) */
  linesAfter?: number;
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number;
}

export class ReadFileTool implements Tool {
  public readonly name = 'read_file';
  public readonly description = 'Read source code file and extract context around error location';
  
  private readonly DEFAULT_LINES_BEFORE = 25;
  private readonly DEFAULT_LINES_AFTER = 25;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Execute file reading operation (implements Tool interface)
   * 
   * @param parameters - Tool parameters { filePath, line, contextLines? }
   * @returns Formatted string with file content, or error message
   */
  async execute(parameters: Record<string, any>): Promise<string>;
  
  /**
   * Execute file reading operation (legacy overload for backward compatibility)
   * 
   * @param filePath - Absolute or relative path to file
   * @param errorLine - Line number where error occurred (1-indexed)
   * @param options - Optional configuration
   * @returns Formatted string with file content, or error message
   */
  async execute(
    filePath: string,
    errorLine: number,
    options?: ReadFileOptions
  ): Promise<string>;
  
  async execute(
    filePathOrParams: string | Record<string, any>,
    errorLine?: number,
    options: ReadFileOptions = {}
  ): Promise<string> {
    // Handle two signatures: new (params object) and old (filePath, errorLine, options)
    let filePath: string;
    let line: number;
    let opts: ReadFileOptions;

    if (typeof filePathOrParams === 'string') {
      // Old signature
      filePath = filePathOrParams;
      line = errorLine!;
      opts = options;
    } else {
      // New signature
      const params = filePathOrParams;
      filePath = params.filePath || params.file;
      line = params.line || params.errorLine;
      opts = {
        linesBefore: params.contextLines || params.linesBefore,
        linesAfter: params.contextLines || params.linesAfter,
      };
    }

    const linesBefore = opts.linesBefore ?? this.DEFAULT_LINES_BEFORE;
    const linesAfter = opts.linesAfter ?? this.DEFAULT_LINES_AFTER;
    const maxFileSize = opts.maxFileSize ?? this.MAX_FILE_SIZE;

    try {
      // Validate inputs
      if (!filePath) {
        return 'Error: File path is empty';
      }

      if (line < 0) {
        return 'Error: Line number must be non-negative';
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return `Error: File not found: ${filePath}`;
      }

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > maxFileSize) {
        return `Error: File too large (${this.formatBytes(stats.size)}). Maximum size: ${this.formatBytes(maxFileSize)}`;
      }

      // Check if binary file
      if (await this.isBinaryFile(filePath)) {
        return `Error: Cannot read binary file: ${filePath}`;
      }

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Calculate line range (1-indexed to 0-indexed)
      const startLine = Math.max(0, line - 1 - linesBefore);
      const endLine = Math.min(lines.length, line + linesAfter);

      // Extract lines
      const extractedLines = lines.slice(startLine, endLine);

      // Format output with line numbers
      const formattedLines = extractedLines.map((lineText, index) => {
        const lineNumber = startLine + index + 1;
        const indicator = lineNumber === line ? '→ ' : '  ';
        return `${indicator}${lineNumber.toString().padStart(4, ' ')} | ${lineText}`;
      }).join('\n');

      return `Lines ${startLine + 1}-${endLine} of ${path.basename(filePath)}:\n${formattedLines}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Error reading file: ${errorMessage}`;
    }
  }

  /**
   * Check if file is binary by reading first 8KB
   */
  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const buffer = Buffer.alloc(8192);
      const fd = await fs.open(filePath, 'r');
      
      try {
        const { bytesRead } = await fd.read(buffer, 0, buffer.length, 0);
        const chunk = buffer.slice(0, bytesRead);
        
        // Check for null bytes or high percentage of non-text characters
        for (let i = 0; i < chunk.length; i++) {
          const byte = chunk[i];
          // Null byte indicates binary
          if (byte === 0) {
            return true;
          }
          // Check for control characters (except common ones like \n, \r, \t)
          if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
            return true;
          }
        }
        
        return false;
      } finally {
        await fd.close();
      }
    } catch {
      return false; // If can't determine, assume text
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Read file without line context (entire file)
   * Useful for small files or when full context is needed
   */
  async readEntireFile(filePath: string): Promise<string> {
    try {
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return `Error: File not found: ${filePath}`;
      }

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        return `Error: File too large (${this.formatBytes(stats.size)})`;
      }

      // Check if binary
      if (await this.isBinaryFile(filePath)) {
        return `Error: Cannot read binary file: ${filePath}`;
      }

      // Read entire file
      const content = await fs.readFile(filePath, 'utf-8');
      return `Content of ${path.basename(filePath)}:\n${content}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Error reading file: ${errorMessage}`;
    }
  }
}
