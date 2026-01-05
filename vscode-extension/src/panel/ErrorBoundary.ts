/**
 * Error Boundary
 * Gracefully handles and recovers from errors in the extension
 */

import * as vscode from 'vscode';

export interface ErrorContext {
  component: string;
  action: string;
  timestamp: number;
  error: Error;
  userContext?: Record<string, any>;
}

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  recoveryAction?: () => Promise<void>;
  fallbackUI?: string;
  userMessage: string;
}

export class ErrorBoundary {
  private static instance: ErrorBoundary;
  private errorLog: ErrorContext[] = [];
  private maxErrorLog = 50;
  private onErrorEmitter = new vscode.EventEmitter<ErrorContext>();
  public readonly onError = this.onErrorEmitter.event;

  private constructor() {}

  static getInstance(): ErrorBoundary {
    if (!ErrorBoundary.instance) {
      ErrorBoundary.instance = new ErrorBoundary();
    }
    return ErrorBoundary.instance;
  }

  /**
   * Wrap a function with error handling
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    func: T,
    context: { component: string; action: string }
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await func(...args);
      } catch (error) {
        await this.handleError(error as Error, context);
        throw error; // Re-throw after handling
      }
    }) as T;
  }

  /**
   * Handle an error with context
   */
  async handleError(
    error: Error,
    context: { component: string; action: string; userContext?: Record<string, any> }
  ): Promise<void> {
    const errorContext: ErrorContext = {
      component: context.component,
      action: context.action,
      timestamp: Date.now(),
      error,
      userContext: context.userContext
    };

    // Log error
    this.logError(errorContext);

    // Emit error event
    this.onErrorEmitter.fire(errorContext);

    // Determine recovery strategy
    const strategy = this.determineRecoveryStrategy(errorContext);

    // Show user-friendly message
    await this.showErrorMessage(error, strategy);

    // Attempt recovery if possible
    if (strategy.canRecover && strategy.recoveryAction) {
      try {
        await strategy.recoveryAction();
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
      }
    }
  }

  /**
   * Log error to internal log
   */
  private logError(context: ErrorContext): void {
    this.errorLog.push(context);

    // Keep only last N errors
    if (this.errorLog.length > this.maxErrorLog) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLog);
    }

    // Log to console
    console.error(
      `[RCA Agent Error] ${context.component}.${context.action}:`,
      context.error
    );
  }

  /**
   * Determine recovery strategy based on error type
   */
  private determineRecoveryStrategy(context: ErrorContext): ErrorRecoveryStrategy {
    const { error, component } = context;

    // Ollama connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          const result = await vscode.window.showInformationMessage(
            'Quick Fix: Open a terminal and run "ollama serve"',
            'Open Terminal',
            'Check Again'
          );
          if (result === 'Open Terminal') {
            const terminal = vscode.window.createTerminal('Ollama');
            terminal.show();
            terminal.sendText('ollama serve');
          }
        },
        userMessage: 'Cannot connect to Ollama AI service. Start Ollama by running "ollama serve" in a terminal.',
        fallbackUI: this.getOllamaErrorUI()
      };
    }

    // Model not found errors
    if (error.message.includes('model') && error.message.includes('not found')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          const result = await vscode.window.showInformationMessage(
            'Download the AI model to continue. This is a one-time setup (~5GB download).',
            'Download Now',
            'Choose Different Model'
          );
          if (result === 'Download Now') {
            const terminal = vscode.window.createTerminal('Model Download');
            terminal.show();
            terminal.sendText('ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
          }
        },
        userMessage: 'AI model not installed. Download it with "ollama pull" command (one-time setup).',
        fallbackUI: this.getModelErrorUI()
      };
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          await vscode.window.showInformationMessage(
            'The request timed out. This can happen with complex errors or slow systems.',
            'Understood'
          );
        },
        userMessage: 'Request timed out. Try simplifying the error or increasing timeout in settings.'
      };
    }

    // Panel-specific errors
    if (component === 'RCAPanelProvider') {
      return {
        canRecover: true,
        recoveryAction: async () => {
          // Reload panel
          await vscode.window.showInformationMessage(
            'Reloading the RCA Agent panel...',
            'OK'
          );
          await vscode.commands.executeCommand('rca-agent.togglePanel');
          await vscode.commands.executeCommand('rca-agent.togglePanel');
        },
        userMessage: 'Panel encountered an error. Reloading automatically...',
        fallbackUI: this.getGenericErrorUI()
      };
    }

    // Analysis errors
    if (component === 'AnalysisService') {
      return {
        canRecover: true,
        recoveryAction: async () => {
          const result = await vscode.window.showInformationMessage(
            'Analysis failed. This might be due to complex error text or resource constraints.',
            'Try Simpler Error',
            'Check Logs',
            'Cancel'
          );
          if (result === 'Check Logs') {
            await vscode.commands.executeCommand('rca-agent.showLogs');
          }
        },
        userMessage: 'Analysis failed. Try with a simpler error message or check if Ollama is running properly.'
      };
    }

    // Generic error
    return {
      canRecover: true,
      recoveryAction: async () => {
        await vscode.window.showInformationMessage(
          'Unexpected error occurred. Check logs for details or try restarting Ollama.',
          'View Logs',
          'Dismiss'
        ).then((selection) => {
          if (selection === 'View Logs') {
            vscode.commands.executeCommand('rca-agent.showLogs');
          }
        });
      },
      userMessage: 'An unexpected error occurred. Check the logs for more details or try restarting Ollama.',
      fallbackUI: this.getGenericErrorUI()
    };
  }

  /**
   * Show error message to user
   */
  private async showErrorMessage(
    error: Error,
    strategy: ErrorRecoveryStrategy
  ): Promise<void> {
    const actions: string[] = [];

    if (strategy.canRecover) {
      actions.push('Try Again');
    }
    actions.push('View Logs', 'Report Issue');

    const result = await vscode.window.showErrorMessage(
      `RCA Agent: ${strategy.userMessage}`,
      ...actions
    );

    switch (result) {
      case 'Try Again':
        if (strategy.recoveryAction) {
          await strategy.recoveryAction();
        }
        break;

      case 'View Logs':
        await vscode.commands.executeCommand('rca-agent.showLogs');
        break;

      case 'Report Issue':
        const issueUrl = this.generateGitHubIssueUrl(error, strategy);
        await vscode.env.openExternal(vscode.Uri.parse(issueUrl));
        break;
    }
  }

  /**
   * Get Ollama error UI with improved user guidance
   */
  private getOllamaErrorUI(): string {
    return `
      <div class="error-state" role="alert">
        <h2>Ollama Server Not Available</h2>
        <p>I can't connect to the Ollama AI service. Don't worry, this is usually an easy fix!</p>
        <div class="steps">
          <h3>Quick Fix (Most Common):</h3>
          <ol>
            <li>Open a terminal window</li>
            <li>Run: <code>ollama serve</code></li>
            <li>Wait for "Ollama is running" message</li>
            <li>Click "Check Connection" below</li>
          </ol>
          <h3>Still Not Working? Try These:</h3>
          <ul>
            <li><strong>Check if Ollama is installed:</strong> Run <code>ollama --version</code></li>
            <li><strong>Different port:</strong> If running on a non-standard port, update URL in settings</li>
            <li><strong>Firewall:</strong> Make sure port 11434 is not blocked</li>
            <li><strong>Process conflict:</strong> Kill existing Ollama process and restart</li>
          </ul>
          <p><em>Tip: Ollama needs to be running whenever you use the RCA Agent</em></p>
        </div>
        <button onclick="checkOllamaConnection()">Check Connection</button>
        <button onclick="openSettings()">Change URL</button>
        <a href="https://ollama.ai/download" target="_blank">Install Ollama</a>
      </div>
    `;
  }

  /**
   * Get model error UI with download size and time estimates
   */
  private getModelErrorUI(): string {
    return `
      <div class="error-state" role="alert">
        <h2>AI Model Not Found</h2>
        <p>The AI model needed for analysis isn't installed yet. Let's get it set up!</p>
        <div class="steps">
          <h3>Quick Install (Recommended Model):</h3>
          <ol>
            <li>Open a terminal window</li>
            <li>Run: <code>ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest</code></li>
            <li>Wait for download (~5GB, takes 5-10 minutes)</li>
            <li>Click "Check Model" below when done</li>
          </ol>
          <h3>Alternative Options:</h3>
          <ul>
            <li><strong>Smaller model:</strong> <code>ollama pull deepseek-r1:1.5b</code> (~1GB, faster but less accurate)</li>
            <li><strong>Already have a model?</strong> Click "Choose Different Model" to select it</li>
            <li><strong>Check installed models:</strong> Run <code>ollama list</code> in terminal</li>
          </ul>
          <p><em>Tip: Model only needs to be downloaded once. You can use it offline after that!</em></p>
        </div>
        <button onclick="checkModel()">Check Model</button>
        <button onclick="chooseModel()">Choose Different Model</button>
        <a href="https://ollama.ai/library" target="_blank">Browse All Models</a>
      </div>
    `;
  }

  /**
   * Get generic error UI with helpful troubleshooting steps
   */
  private getGenericErrorUI(): string {
    return `
      <div class="error-state" role="alert">
        <h2>Something Went Wrong</h2>
        <p>An unexpected error occurred, but there are a few things we can try to fix it.</p>
        <div class="steps">
          <h3>Quick Fixes to Try:</h3>
          <ol>
            <li><strong>Retry:</strong> Click "Try Again" - sometimes temporary glitches happen</li>
            <li><strong>Restart Ollama:</strong> Stop and restart the Ollama service</li>
            <li><strong>Check Resources:</strong> Make sure you have enough RAM/disk space</li>
            <li><strong>View Logs:</strong> Check the logs for more specific error details</li>
          </ol>
          <h3>Still Having Issues?</h3>
          <p>If the error persists, the logs can help identify the root cause. You can also report this issue on GitHub with the error details.</p>
        </div>
        <button onclick="retryAction()">Try Again</button>
        <button onclick="viewLogs()">View Logs</button>
        <button onclick="reportIssue()">Report Issue</button>
      </div>
    `;
  }

  /**
   * Generate GitHub issue URL with error details
   */
  private generateGitHubIssueUrl(error: Error, strategy: ErrorRecoveryStrategy): string {
    const baseUrl = 'https://github.com/your-repo/rca-agent/issues/new';
    const title = encodeURIComponent(`Error: ${error.message.substring(0, 50)}`);
    const body = encodeURIComponent(`
**Error Message:**
${error.message}

**Stack Trace:**
\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`

**User Message:**
${strategy.userMessage}

**Environment:**
- VS Code Version: ${vscode.version}
- Extension Version: [auto-filled]
- OS: ${process.platform}

**Steps to Reproduce:**
1. [Please describe what you were doing when the error occurred]

**Additional Context:**
[Any additional information that might be helpful]
    `);

    return `${baseUrl}?title=${title}&body=${body}&labels=bug`;
  }

  /**
   * Get error log
   */
  getErrorLog(): ErrorContext[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    total: number;
    byComponent: Record<string, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorContext[];
  } {
    const byComponent: Record<string, number> = {};
    const bySeverity: Record<ErrorSeverity, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0
    };

    this.errorLog.forEach(ctx => {
      byComponent[ctx.component] = (byComponent[ctx.component] || 0) + 1;
      
      // Simple severity classification
      if (ctx.error.message.includes('ECONNREFUSED') || ctx.error.message.includes('timeout')) {
        bySeverity.critical++;
      } else if (ctx.error.message.includes('not found')) {
        bySeverity.error++;
      } else {
        bySeverity.warning++;
      }
    });

    return {
      total: this.errorLog.length,
      byComponent,
      bySeverity,
      recentErrors: this.errorLog.slice(-10)
    };
  }
}
