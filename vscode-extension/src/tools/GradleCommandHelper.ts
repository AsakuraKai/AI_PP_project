/**
 * Gradle Command Helper - Gradle-specific command utilities
 * 
 * Provides convenient methods for common Gradle commands:
 * - clean
 * - build
 * - assembleDebug
 * - dependencies
 * - sync
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 2: Chat Participant UI
 * @week Week 1
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { TerminalTool, CommandResult } from './TerminalTool';
import { Tool, ToolMetadata } from './ToolRegistry';

interface GradleCommandParams {
  task: 'clean' | 'build' | 'assembleDebug' | 'dependencies' | 'tasks' | 'sync' | 'version';
}

export class GradleCommandHelper implements Tool<GradleCommandParams, CommandResult> {
  name = 'GradleCommand';
  description = 'Execute Gradle commands (clean, build, sync, etc.)';
  
  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      task: {
        type: 'string',
        description: 'Gradle task to run',
        required: true
      }
    },
    category: 'gradle'
  };

  private gradlewPath: string;
  
  constructor(private terminalTool: TerminalTool) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    
    // Detect gradlew or gradlew.bat
    const isWindows = process.platform === 'win32';
    this.gradlewPath = path.join(
      workspaceRoot,
      isWindows ? 'gradlew.bat' : 'gradlew'
    );
  }
  
  /**
   * Execute a Gradle command (Tool interface)
   */
  async execute(params: GradleCommandParams): Promise<CommandResult> {
    switch (params.task) {
      case 'clean':
        return this.clean();
      case 'build':
        return this.build();
      case 'assembleDebug':
        return this.assembleDebug();
      case 'dependencies':
        return this.dependencies();
      case 'tasks':
        return this.tasks();
      case 'sync':
        return this.sync();
      case 'version':
        return this.version();
      default:
        throw new Error(`Unknown Gradle task: ${params.task}`);
    }
  }
  
  /**
   * Run gradle clean
   */
  async clean(): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} clean` });
  }
  
  /**
   * Run gradle build
   */
  async build(): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} build` });
  }
  
  /**
   * Run gradle assembleDebug
   */
  async assembleDebug(): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} assembleDebug` });
  }
  
  /**
   * Run gradle dependencies (show dependency tree)
   */
  async dependencies(): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} dependencies` });
  }
  
  /**
   * Run gradle tasks (list all available tasks)
   */
  async tasks(): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} tasks` });
  }
  
  /**
   * Sync gradle (refresh dependencies)
   */
  async sync(): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} --refresh-dependencies` });
  }
  
  /**
   * Check gradle version
   */
  async version(): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} --version` });
  }
  
  /**
   * Run custom gradle task
   * 
   * @param task - Task name (e.g., "app:assembleRelease")
   */
  async customTask(task: string): Promise<CommandResult> {
    return await this.terminalTool.execute({ command: `${this.gradlewPath} ${task}` });
  }
}
