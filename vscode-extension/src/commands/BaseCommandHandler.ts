/**
 * BaseCommandHandler - Base class for all command handlers
 * 
 * Provides common functionality to reduce code duplication across command classes:
 * - Standardized command registration
 * - Common error handling
 * - Consistent logging
 * - Shared user notification patterns
 * 
 * CONSOLIDATION: Reduces ~50 lines of duplicate code per command class
 */

import * as vscode from 'vscode';

/**
 * Command definition for type-safe registration
 */
export interface CommandDefinition {
  /** Command ID (e.g., 'rca-agent.analyzeAll') */
  id: string;
  /** Handler method name to call */
  handler: string;
  /** Optional: Command title for logging */
  title?: string;
}

/**
 * Base class for command handlers with common patterns
 */
export abstract class BaseCommandHandler {
  /**
   * Register all commands defined by the handler
   * Automatically wraps handlers with error handling
   * 
   * @param context - VSCode extension context
   * @returns Array of disposables for cleanup
   */
  protected registerCommands(context: vscode.ExtensionContext, commands: CommandDefinition[]): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    for (const cmd of commands) {
      const handler = (this as any)[cmd.handler];
      if (typeof handler !== 'function') {
        console.error(`Command handler method '${cmd.handler}' not found in ${this.constructor.name}`);
        continue;
      }

      // Wrap handler with error handling
      const wrappedHandler = async (...args: any[]) => {
        try {
          return await handler.call(this, ...args);
        } catch (error) {
          this.handleCommandError(cmd.id, error);
        }
      };

      const disposable = vscode.commands.registerCommand(cmd.id, wrappedHandler);
      disposables.push(disposable);
      context.subscriptions.push(disposable);
    }

    return disposables;
  }

  /**
   * Centralized error handling for commands
   * Override in subclasses for custom error handling
   */
  protected handleCommandError(commandId: string, error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in command ${commandId}:`, error);
    
    vscode.window.showErrorMessage(
      `Failed to execute command: ${errorMessage}`,
      'View Logs'
    ).then(selection => {
      if (selection === 'View Logs') {
        vscode.commands.executeCommand('workbench.action.showErrorsWarnings');
      }
    });
  }

  /**
   * Show info message with consistent formatting
   */
  protected showInfo(message: string, ...actions: string[]): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(message, ...actions);
  }

  /**
   * Show warning message with consistent formatting
   */
  protected showWarning(message: string, ...actions: string[]): Thenable<string | undefined> {
    return vscode.window.showWarningMessage(message, ...actions);
  }

  /**
   * Show error message with consistent formatting
   */
  protected showError(message: string, ...actions: string[]): Thenable<string | undefined> {
    return vscode.window.showErrorMessage(message, ...actions);
  }

  /**
   * Show confirmation dialog with Yes/No options
   */
  protected async confirm(
    message: string,
    detail?: string,
    yesLabel: string = 'Yes',
    noLabel: string = 'No'
  ): Promise<boolean> {
    const result = await vscode.window.showWarningMessage(
      message,
      { modal: true, detail },
      yesLabel,
      noLabel
    );
    return result === yesLabel;
  }

  /**
   * Execute command with error handling
   */
  protected async executeCommand(command: string, ...args: any[]): Promise<any> {
    try {
      return await vscode.commands.executeCommand(command, ...args);
    } catch (error) {
      this.handleCommandError(command, error);
      throw error;
    }
  }

  /**
   * Log debug message if in debug mode
   */
  protected logDebug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.constructor.name}] ${message}`, ...args);
    }
  }

  /**
   * Log info message
   */
  protected logInfo(message: string, ...args: any[]): void {
    console.log(`[${this.constructor.name}] ${message}`, ...args);
  }

  /**
   * Log warning message
   */
  protected logWarn(message: string, ...args: any[]): void {
    console.warn(`[${this.constructor.name}] ${message}`, ...args);
  }

  /**
   * Log error message
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.constructor.name}] ${message}`, error);
  }

  /**
   * Get active text editor or show error if none
   */
  protected getActiveEditor(): vscode.TextEditor | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.showWarning('No active text editor.');
    }
    return editor;
  }

  /**
   * Get workspace root path or show error if not in workspace
   */
  protected getWorkspaceRoot(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      this.showWarning('No workspace folder open.');
      return undefined;
    }
    return workspaceFolders[0].uri.fsPath;
  }
}
