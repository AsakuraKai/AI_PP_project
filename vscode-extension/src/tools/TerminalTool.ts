/**
 * Terminal Tool - Capture and execute terminal commands
 * 
 * Features:
 * - Capture terminal output in real-time
 * - Execute shell commands
 * - Store command history
 * - Detect build errors
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 2: Chat Participant UI
 * @week Week 1
 */

import * as vscode from 'vscode';
import { Tool, ToolMetadata } from './ToolRegistry';

export interface CommandResult {
  success: boolean;
  output: string;
  command: string;
  exitCode?: number;
  duration?: number;
}

export interface ExecuteCommandParams {
  command: string;
  cwd?: string;
  timeout?: number;
}

export class TerminalTool implements Tool<ExecuteCommandParams, CommandResult> {
  name = 'TerminalTool';
  description = 'Execute terminal commands and capture output';
  
  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      command: {
        type: 'string',
        description: 'Command to execute',
        required: true
      },
      cwd: {
        type: 'string',
        description: 'Working directory',
        required: false
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds',
        required: false
      }
    },
    category: 'terminal'
  };

  private outputCache: string[] = [];
  private maxCacheSize = 1000;
  private commandHistory: string[] = [];
  
  constructor() {
    this.initializeWatcher();
  }
  
  /**
   * Initialize terminal output watcher
   */
  initializeWatcher(): void {
    // Check if API exists (might not be available in all VS Code versions)
    if ('onDidWriteTerminalData' in vscode.window) {
      // @ts-ignore - API might not be in typings yet
      vscode.window.onDidWriteTerminalData(event => {
        this.outputCache.push(event.data);
        
        // Maintain cache size
        if (this.outputCache.length > this.maxCacheSize) {
          this.outputCache.shift();
        }
      });
      
      console.log('[TerminalTool] Terminal watcher initialized');
    } else {
      console.warn('[TerminalTool] onDidWriteTerminalData not available');
    }
  }
  
  /**
   * Get recent terminal output
   * 
   * @param lines - Number of recent lines to return (default: 50)
   * @returns Recent terminal output
   */
  getRecentOutput(lines: number = 50): string {
    return this.outputCache.slice(-lines).join('\n');
  }
  
  /**
   * Get all terminal output
   */
  getAllOutput(): string {
    return this.outputCache.join('\n');
  }
  
  /**
   * Execute a command in terminal (Tool interface implementation)
   */
  async execute(params: ExecuteCommandParams): Promise<CommandResult> {
    return this.executeCommand(params.command, params.cwd, params.timeout);
  }

  /**
   * Execute a command in terminal
   * 
   * @param command - Command to execute
   * @param cwd - Working directory (optional)
   * @param timeout - Timeout in milliseconds (default: 3000)
   * @returns Command result with output
   */
  async executeCommand(command: string, cwd?: string, timeout: number = 3000): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Create terminal
      const terminal = vscode.window.createTerminal({
        name: 'RCA Agent',
        cwd: cwd || vscode.workspace.workspaceFolders?.[0].uri.fsPath
      });
      
      // Show terminal
      terminal.show();
      
      // Store command in history
      this.commandHistory.push(command);
      
      // Send command
      terminal.sendText(command);
      
      // Wait for output (simplified - actual implementation needs proper detection)
      setTimeout(() => {
        const duration = Date.now() - startTime;
        const output = this.getRecentOutput(100);
        const success = this.isSuccessfulOutput(output);
        
        resolve({
          success,
          output,
          command,
          duration
        });
      }, timeout); // Use configured timeout
    });
  }
  
  /**
   * Check if terminal output indicates success
   */
  private isSuccessfulOutput(output: string): boolean {
    const outputLower = output.toLowerCase();
    
    // Check for error indicators
    if (outputLower.includes('error') || 
        outputLower.includes('failed') ||
        outputLower.includes('exception')) {
      return false;
    }
    
    // Check for success indicators
    if (outputLower.includes('success') || 
        outputLower.includes('build successful')) {
      return true;
    }
    
    // Default to true if no clear indicators
    return true;
  }
  
  /**
   * Get command history
   */
  getCommandHistory(): string[] {
    return [...this.commandHistory];
  }
  
  /**
   * Clear output cache
   */
  clearCache(): void {
    this.outputCache = [];
  }
  
  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory = [];
  }
}
