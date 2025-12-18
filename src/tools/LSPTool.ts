/**
 * LSPTool - Language Server Protocol integration for code analysis
 * 
 * NOTE: This is a placeholder implementation for Chunk 2.2.
 * Full LSP integration requires VS Code extension context, which will be
 * implemented by Sokchea in the UI integration phase.
 * 
 * For now, this provides a file-based fallback that can be tested independently.
 * 
 * Future capabilities (when integrated with VS Code):
 * - Find function callers (call hierarchy)
 * - Find function definition (go to definition)
 * - Get symbol information (hover)
 * - Search workspace symbols (workspace symbol search)
 * 
 * Design Decisions:
 * - Graceful fallback for non-VS Code environments
 * - Simple regex-based analysis for MVP
 * - Will be enhanced when VS Code API is available
 * 
 * @example
 * const lspTool = new LSPTool();
 * const callers = await lspTool.findCallers('onCreate', 'MainActivity.kt');
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './ToolRegistry';

/**
 * LSP Tool for code analysis
 */
export class LSPTool implements Tool {
  name = 'lsp_tool';
  description = 'Analyze code structure using language server capabilities';

  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  /**
   * Execute LSP tool command
   */
  async execute(parameters: Record<string, any>): Promise<any> {
    const { command, filePath, symbolName } = parameters;

    switch (command) {
      case 'find_callers':
        return this.findCallers(symbolName, filePath);
      case 'find_definition':
        return this.findDefinition(symbolName, filePath);
      case 'get_symbol_info':
        return this.getSymbolInfo(symbolName, filePath);
      case 'search_symbols':
        return this.searchWorkspaceSymbols(symbolName);
      default:
        throw new Error(`Unknown LSP command: ${command}`);
    }
  }

  /**
   * Find all callers of a function (call hierarchy)
   * 
   * NOTE: Simplified implementation using regex. Will be replaced with
   * proper LSP integration when VS Code API is available.
   */
  async findCallers(functionName: string, _filePath: string): Promise<string[]> {
    try {
      const callers: string[] = [];
      const files = await this.getKotlinFiles();

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Simple regex to find function calls
        // Matches: functionName(, functionName (, .functionName(
        const callPattern = new RegExp(
          `(?:^|[^a-zA-Z0-9_])(${functionName})\\s*\\(`,
          'gm'
        );
        
        const matches = content.matchAll(callPattern);
        for (const match of matches) {
          const lineNumber = this.getLineNumber(content, match.index!);
          callers.push(`${file}:${lineNumber}`);
        }
      }

      return callers;
    } catch (error) {
      return [`Error finding callers: ${error instanceof Error ? error.message : 'Unknown error'}`];
    }
  }

  /**
   * Find definition of a function
   * 
   * NOTE: Simplified implementation. Will be enhanced with LSP.
   */
  async findDefinition(symbolName: string, filePath: string): Promise<string | null> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.workspaceRoot, filePath);

      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Find function definition
      // Matches: fun functionName(, private fun functionName(, etc.
      const patterns = [
        new RegExp(
          `(?:^|\\s)(?:private|public|protected|internal)?\\s*fun\\s+(${symbolName})\\s*\\(`,
          'm'
        ),
        new RegExp(
          `(?:^|\\s)(?:private|public|protected|internal|abstract|open|data)?\\s*class\\s+(${symbolName})(?:\\s*[:{(]|\\s*$)`,
          'm'
        ),
        new RegExp(`(?:val|var)\\s+(${symbolName})\\s*[:=]`, 'm'),
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const lineNumber = this.getLineNumber(content, match.index!);
          return `${filePath}:${lineNumber}`;
        }
      }

      return null;
    } catch (error) {
      return `Error finding definition: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Get symbol information (type, location, documentation)
   * 
   * NOTE: Simplified implementation. Will be enhanced with LSP hover support.
   */
  async getSymbolInfo(symbolName: string, filePath: string): Promise<Record<string, any>> {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.workspaceRoot, filePath);

      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Find symbol declaration
      const patterns = [
        new RegExp(`(?:val|var)\\s+(${symbolName})\\s*[:=]`, 'm'), // Property
        new RegExp(`fun\\s+(${symbolName})\\s*\\(`, 'm'),            // Function
        new RegExp(`class\\s+(${symbolName})(?:\\s*[:{(]|\\s*$)`, 'm'), // Class
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const lineNumber = this.getLineNumber(content, match.index!);
          const line = content.split('\n')[lineNumber - 1].trim();
          
          return {
            name: symbolName,
            location: `${filePath}:${lineNumber}`,
            declaration: line,
            type: this.inferSymbolType(line),
          };
        }
      }

      return { error: `Symbol "${symbolName}" not found` };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Search workspace for symbols matching name
   */
  async searchWorkspaceSymbols(symbolName: string): Promise<Array<Record<string, any>>> {
    try {
      const results: Array<Record<string, any>> = [];
      const files = await this.getKotlinFiles();

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Search for any symbol definition
        const patterns = [
          new RegExp(`(?:val|var)\\s+(${symbolName})`, 'gm'),
          new RegExp(`fun\\s+(${symbolName})`, 'gm'),
          new RegExp(`class\\s+(${symbolName})`, 'gm'),
        ];

        for (const pattern of patterns) {
          const matches = content.matchAll(pattern);
          for (const match of matches) {
            const lineNumber = this.getLineNumber(content, match.index!);
            results.push({
              name: symbolName,
              location: `${file}:${lineNumber}`,
              file,
              line: lineNumber,
            });
          }
        }
      }

      return results;
    } catch (error) {
      return [{ error: error instanceof Error ? error.message : 'Unknown error' }];
    }
  }

  /**
   * Get all Kotlin files in workspace
   */
  private async getKotlinFiles(): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip common directories to avoid
          if (entry.isDirectory()) {
            const name = entry.name;
            if (name === 'node_modules' || name === '.git' || name === 'build' || 
                name === '.gradle' || name === 'coverage') {
              continue;
            }
            await scan(fullPath);
          } else if (entry.name.endsWith('.kt')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    await scan(this.workspaceRoot);
    return files;
  }

  /**
   * Get line number from string index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Infer symbol type from declaration
   */
  private inferSymbolType(declaration: string): string {
    if (declaration.includes('fun ')) return 'function';
    if (declaration.includes('class ')) return 'class';
    if (declaration.includes('val ')) return 'immutable_property';
    if (declaration.includes('var ')) return 'mutable_property';
    return 'unknown';
  }
}
