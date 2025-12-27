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
        canRecover: false,
        userMessage: 'Cannot connect to Ollama server. Please ensure Ollama is running.',
        fallbackUI: this.getOllamaErrorUI()
      };
    }

    // Model not found errors
    if (error.message.includes('model') && error.message.includes('not found')) {
      return {
        canRecover: false,
        userMessage: 'Model not found. Please install the required model.',
        fallbackUI: this.getModelErrorUI()
      };
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          // Could implement retry logic here
        },
        userMessage: 'Request timed out. Would you like to try again?'
      };
    }

    // Panel-specific errors
    if (component === 'RCAPanelProvider') {
      return {
        canRecover: true,
        recoveryAction: async () => {
          // Reload panel
          await vscode.commands.executeCommand('rca-agent.togglePanel');
          await vscode.commands.executeCommand('rca-agent.togglePanel');
        },
        userMessage: 'Panel error occurred. Reloading panel...',
        fallbackUI: this.getGenericErrorUI()
      };
    }

    // Analysis errors
    if (component === 'AnalysisService') {
      return {
        canRecover: true,
        userMessage: 'Analysis failed. You can try again or check the error details.'
      };
    }

    // Generic error
    return {
      canRecover: false,
      userMessage: 'An unexpected error occurred. Please check the output logs.',
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
   * Get Ollama error UI
   */
  private getOllamaErrorUI(): string {
    return `
      <div class="error-state" role="alert">
        <h2>⚠️ Ollama Server Not Available</h2>
        <p>The Ollama server is not responding.</p>
        <div class="steps">
          <h3>To fix this:</h3>
          <ol>
            <li>Open a terminal</li>
            <li>Run: <code>ollama serve</code></li>
            <li>Wait for "Ollama is running" message</li>
            <li>Click "Check Connection" below</li>
          </ol>
        </div>
        <button onclick="checkOllamaConnection()">🔄 Check Connection</button>
        <button onclick="openSettings()">🔧 Change URL</button>
      </div>
    `;
  }

  /**
   * Get model error UI
   */
  private getModelErrorUI(): string {
    return `
      <div class="error-state" role="alert">
        <h2>⚠️ Model Not Found</h2>
        <p>The required model is not installed.</p>
        <div class="steps">
          <h3>To install:</h3>
          <ol>
            <li>Open a terminal</li>
            <li>Run: <code>ollama pull deepseek-r1</code></li>
            <li>Wait for download to complete</li>
            <li>Click "Check Model" below</li>
          </ol>
        </div>
        <button onclick="checkModel()">🔄 Check Model</button>
        <button onclick="chooseModel()">🔽 Choose Different Model</button>
      </div>
    `;
  }

  /**
   * Get generic error UI
   */
  private getGenericErrorUI(): string {
    return `
      <div class="error-state" role="alert">
        <h2>⚠️ Error Occurred</h2>
        <p>An unexpected error occurred. Please try again.</p>
        <button onclick="retryAction()">🔄 Try Again</button>
        <button onclick="viewLogs()">📋 View Logs</button>
        <button onclick="reportIssue()">🐛 Report Issue</button>
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
