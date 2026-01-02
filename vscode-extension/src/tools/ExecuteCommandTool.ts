/**
 * Execute Command Tool - Execute shell commands via TerminalTool
 * 
 * Simple wrapper around TerminalTool for command execution
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 2: Chat Participant UI
 * @week Week 1
 */

import { TerminalTool, CommandResult, ExecuteCommandParams } from './TerminalTool';
import { Tool, ToolMetadata } from './ToolRegistry';

export class ExecuteCommandTool implements Tool<ExecuteCommandParams, CommandResult> {
  name = 'ExecuteCommand';
  description = 'Execute shell commands in terminal';
  
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
      }
    },
    category: 'terminal'
  };

  constructor(private terminalTool: TerminalTool) {}
  
  /**
   * Execute a shell command
   */
  async execute(params: ExecuteCommandParams): Promise<CommandResult> {
    return await this.terminalTool.execute(params);
  }
  
  /**
   * Execute a shell command (legacy method)
   */
  async executeCommand(command: string, cwd?: string): Promise<CommandResult> {
    return await this.terminalTool.execute({ command, cwd });
  }
}
