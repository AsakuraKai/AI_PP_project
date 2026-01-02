/**
 * Comprehensive Error Handling for Chat Participant
 * Phase 2-3 Week 5 Implementation
 * 
 * Handles all error scenarios gracefully:
 * - LLM connection failures
 * - File operation errors
 * - Workspace errors
 * - User cancellation
 * - Invalid input
 * - Edge cases
 */

import * as vscode from 'vscode';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface RCAError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  details?: any;
  userMessage: string;
  recovery?: () => Promise<void>;
}

export class ErrorHandler {
  private static errorLog: RCAError[] = [];
  private static maxLogSize = 100;

  /**
   * Handle errors in chat participant workflow
   */
  static async handleChatError(
    error: Error,
    stream: vscode.ChatResponseStream,
    context: string = 'chat'
  ): Promise<void> {
    const rcaError = this.classifyError(error, context);
    this.logError(rcaError);

    // Show user-friendly error message in chat
    stream.markdown(`\n\n## ❌ Error: ${rcaError.message}\n\n`);
    stream.markdown(`${rcaError.userMessage}\n\n`);

    // Add recovery suggestions
    if (rcaError.recovery) {
      stream.markdown(`**Recovery:**\n`);
      stream.button({
        command: 'rca-agent.retry',
        title: '🔄 Retry',
        arguments: [rcaError]
      });
    }

    // Add help button
    stream.button({
      command: 'rca-agent.showErrorHelp',
      title: '❓ Get Help',
      arguments: [rcaError]
    });

    // Show error notification for critical errors
    if (rcaError.severity === ErrorSeverity.CRITICAL) {
      await vscode.window.showErrorMessage(
        `RCA Agent: ${rcaError.message}`,
        'Show Details',
        'Dismiss'
      ).then(choice => {
        if (choice === 'Show Details') {
          this.showErrorDetails(rcaError);
        }
      });
    }
  }

  /**
   * Classify error and provide user-friendly message
   */
  private static classifyError(error: Error, context: string): RCAError {
    // LLM connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      return {
        code: 'LLM_CONNECTION_ERROR',
        message: 'Cannot connect to Ollama',
        severity: ErrorSeverity.CRITICAL,
        details: error,
        userMessage: `I couldn't connect to the Ollama LLM service. Make sure Ollama is running:
        
1. Check if Ollama is installed: \`ollama --version\`
2. Start Ollama: \`ollama serve\`
3. Verify model is available: \`ollama list\`

If you don't have Ollama installed, visit: https://ollama.ai/download`,
        recovery: async () => {
          await vscode.window.showInformationMessage(
            'Please start Ollama service and try again',
            'Open Ollama Docs'
          ).then(choice => {
            if (choice) {
              vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/download'));
            }
          });
        }
      };
    }

    // Model not found errors
    if (error.message.includes('model not found') || error.message.includes('pull model')) {
      return {
        code: 'MODEL_NOT_FOUND',
        message: 'LLM model not found',
        severity: ErrorSeverity.ERROR,
        details: error,
        userMessage: `The required LLM model is not installed. Run this command to download it:

\`\`\`bash
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
\`\`\`

This will download the model (~5GB). It may take a few minutes.`,
        recovery: async () => {
          const terminal = vscode.window.createTerminal('Ollama Model Download');
          terminal.show();
          terminal.sendText('ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
        }
      };
    }

    // File not found errors
    if (error.message.includes('ENOENT') || error.message.includes('File not found')) {
      return {
        code: 'FILE_NOT_FOUND',
        message: 'File not found',
        severity: ErrorSeverity.WARNING,
        details: error,
        userMessage: `The specified file could not be found. Make sure:

1. The file exists in your workspace
2. The file path is correct
3. You have permission to access the file

Try opening the file in VS Code first, then ask me to analyze it.`
      };
    }

    // Permission errors
    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      return {
        code: 'PERMISSION_DENIED',
        message: 'Permission denied',
        severity: ErrorSeverity.ERROR,
        details: error,
        userMessage: `I don't have permission to access the file or directory. 

Check file permissions and make sure VS Code has access to the workspace.`
      };
    }

    // Workspace errors
    if (error.message.includes('No workspace') || error.message.includes('workspace folder')) {
      return {
        code: 'NO_WORKSPACE',
        message: 'No workspace open',
        severity: ErrorSeverity.WARNING,
        details: error,
        userMessage: `No workspace is currently open. 

Please open a folder or workspace in VS Code first.`,
        recovery: async () => {
          await vscode.commands.executeCommand('workbench.action.files.openFolder');
        }
      };
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return {
        code: 'TIMEOUT',
        message: 'Analysis timed out',
        severity: ErrorSeverity.WARNING,
        details: error,
        userMessage: `The analysis took too long and timed out. This can happen with:

1. Very large files
2. Slow LLM response
3. Network issues

Try again with a smaller file or simpler query.`,
        recovery: async () => {
          await vscode.window.showInformationMessage(
            'Retry with a simpler query or smaller file',
            'Retry'
          );
        }
      };
    }

    // Parsing errors
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      return {
        code: 'PARSE_ERROR',
        message: 'Failed to parse response',
        severity: ErrorSeverity.WARNING,
        details: error,
        userMessage: `I couldn't understand the error format. This might be a temporary issue.

Try rephrasing your question or selecting a specific error message to analyze.`
      };
    }

    // User cancellation
    if (error.message.includes('cancel') || error.message.includes('abort')) {
      return {
        code: 'USER_CANCELLED',
        message: 'Operation cancelled',
        severity: ErrorSeverity.INFO,
        details: error,
        userMessage: `Operation was cancelled. Feel free to try again anytime!`
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      severity: ErrorSeverity.ERROR,
      details: error,
      userMessage: `An unexpected error occurred: ${error.message}

This might be a bug. Please report it if it persists.`,
      recovery: async () => {
        await vscode.window.showErrorMessage(
          'Report this issue on GitHub?',
          'Report Issue',
          'Dismiss'
        ).then(choice => {
          if (choice === 'Report Issue') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/AsakuraKai/AI_PP_project/issues/new'));
          }
        });
      }
    };
  }

  /**
   * Log error for debugging
   */
  private static logError(error: RCAError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console for debugging
    console.error('[RCA Agent Error]', {
      code: error.code,
      message: error.message,
      severity: error.severity,
      timestamp: new Date().toISOString(),
      details: error.details
    });
  }

  /**
   * Show detailed error information
   */
  private static async showErrorDetails(error: RCAError): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'rcaErrorDetails',
      'RCA Error Details',
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    );

    panel.webview.html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    h1 { color: var(--vscode-errorForeground); }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: var(--vscode-textLink-foreground); }
    .value {
      background: var(--vscode-textCodeBlock-background);
      padding: 10px;
      border-radius: 4px;
      margin-top: 5px;
      font-family: monospace;
    }
    .severity {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      background: ${error.severity === ErrorSeverity.CRITICAL ? '#f44336' : 
                    error.severity === ErrorSeverity.ERROR ? '#ff9800' : 
                    error.severity === ErrorSeverity.WARNING ? '#ffc107' : '#2196f3'};
    }
  </style>
</head>
<body>
  <h1>❌ Error Details</h1>
  
  <div class="field">
    <div class="label">Error Code:</div>
    <div class="value">${error.code}</div>
  </div>
  
  <div class="field">
    <div class="label">Message:</div>
    <div class="value">${error.message}</div>
  </div>
  
  <div class="field">
    <div class="label">Severity:</div>
    <div><span class="severity">${error.severity.toUpperCase()}</span></div>
  </div>
  
  <div class="field">
    <div class="label">User Message:</div>
    <div class="value">${error.userMessage.replace(/\n/g, '<br>')}</div>
  </div>
  
  <div class="field">
    <div class="label">Technical Details:</div>
    <div class="value">${JSON.stringify(error.details, null, 2)}</div>
  </div>
  
  <div class="field">
    <div class="label">Timestamp:</div>
    <div class="value">${new Date().toLocaleString()}</div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get error log for debugging
   */
  static getErrorLog(): RCAError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Export error log to file
   */
  static async exportErrorLog(): Promise<void> {
    const log = this.errorLog.map(err => ({
      timestamp: new Date().toISOString(),
      ...err,
      details: err.details instanceof Error ? {
        name: err.details.name,
        message: err.details.message,
        stack: err.details.stack
      } : err.details
    }));

    const content = JSON.stringify(log, null, 2);
    
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('rca-error-log.json'),
      filters: { 'JSON': ['json'] }
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
      vscode.window.showInformationMessage(`Error log exported to ${uri.fsPath}`);
    }
  }
}

/**
 * Edge case handlers
 */
export class EdgeCaseHandler {
  /**
   * Handle empty workspace
   */
  static async handleEmptyWorkspace(stream: vscode.ChatResponseStream): Promise<void> {
    stream.markdown(`## ℹ️ No Workspace Open\n\n`);
    stream.markdown(`I need a workspace to analyze errors. Please open a folder or workspace first.\n\n`);
    stream.button({
      command: 'workbench.action.files.openFolder',
      title: '📁 Open Folder',
      arguments: []
    });
  }

  /**
   * Handle no errors found
   */
  static async handleNoErrors(stream: vscode.ChatResponseStream): Promise<void> {
    stream.markdown(`## ✅ No Errors Found\n\n`);
    stream.markdown(`Great! I couldn't find any errors in your workspace. Your code looks good!\n\n`);
    stream.markdown(`💡 **Tip:** If you're seeing errors in your IDE, try:\n`);
    stream.markdown(`- Running a build to update diagnostics\n`);
    stream.markdown(`- Reloading the window\n`);
    stream.markdown(`- Checking if the error is in a different file\n`);
  }

  /**
   * Handle ambiguous request
   */
  static async handleAmbiguousRequest(stream: vscode.ChatResponseStream, prompt: string): Promise<void> {
    stream.markdown(`## ❓ Need More Information\n\n`);
    stream.markdown(`I'm not sure what you want me to do. Could you be more specific?\n\n`);
    stream.markdown(`**Examples:**\n`);
    stream.markdown(`- "Analyze the gradle error in build.gradle"\n`);
    stream.markdown(`- "Fix the NullPointerException in MainActivity.kt"\n`);
    stream.markdown(`- "Explain the compose recomposition issue"\n`);
    stream.markdown(`- "Run gradle build"\n`);
  }

  /**
   * Handle too many errors
   */
  static async handleTooManyErrors(
    stream: vscode.ChatResponseStream,
    errorCount: number
  ): Promise<void> {
    stream.markdown(`## ⚠️ Too Many Errors (${errorCount})\n\n`);
    stream.markdown(`Your workspace has ${errorCount} errors. That's a lot! Let me help you prioritize:\n\n`);
    stream.markdown(`**Suggestions:**\n`);
    stream.markdown(`1. Fix build-blocking errors first (Gradle, dependencies)\n`);
    stream.markdown(`2. Then fix compilation errors\n`);
    stream.markdown(`3. Finally tackle warnings\n\n`);
    stream.markdown(`Would you like me to analyze the most critical errors first?\n\n`);
    stream.button({
      command: 'rca-agent.analyzeCriticalErrors',
      title: '🔴 Analyze Critical Errors',
      arguments: []
    });
  }

  /**
   * Handle large file
   */
  static async handleLargeFile(
    stream: vscode.ChatResponseStream,
    filePath: string,
    size: number
  ): Promise<void> {
    stream.markdown(`## ⚠️ Large File Warning\n\n`);
    stream.markdown(`The file ${filePath} is very large (${(size / 1024 / 1024).toFixed(2)} MB).\n\n`);
    stream.markdown(`Analysis might take longer or fail. Consider:\n`);
    stream.markdown(`- Analyzing a specific section of the file\n`);
    stream.markdown(`- Breaking the file into smaller modules\n`);
    stream.markdown(`- Providing more specific error location\n\n`);
    stream.button({
      command: 'rca-agent.analyzeAnyway',
      title: '▶️ Analyze Anyway',
      arguments: [filePath]
    });
  }
}
