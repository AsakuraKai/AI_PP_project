/**
 * Network Timeout Handler for RCA Agent
 * Handles Ollama connection timeouts, retries, and graceful degradation
 */

import * as vscode from 'vscode';

export interface TimeoutConfig {
  connectionTimeout: number;      // Initial connection timeout (ms)
  analysisTimeout: number;        // Per-iteration timeout (ms)
  totalTimeout: number;           // Total analysis timeout (ms)
  retryAttempts: number;          // Number of retry attempts
  retryDelay: number;             // Delay between retries (ms)
  exponentialBackoff: boolean;    // Use exponential backoff for retries
}

export interface TimeoutResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  timedOut: boolean;
  attempt: number;
  duration: number;
}

export class NetworkTimeoutHandler {
  private static _instance: NetworkTimeoutHandler;
  private _config: TimeoutConfig;
  private _activeTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this._config = this.loadConfig();
  }

  static getInstance(): NetworkTimeoutHandler {
    if (!NetworkTimeoutHandler._instance) {
      NetworkTimeoutHandler._instance = new NetworkTimeoutHandler();
    }
    return NetworkTimeoutHandler._instance;
  }

  private loadConfig(): TimeoutConfig {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    return {
      connectionTimeout: config.get<number>('network.connectionTimeout', 5000),
      analysisTimeout: config.get<number>('network.analysisTimeout', 30000),
      totalTimeout: config.get<number>('network.totalTimeout', 180000),
      retryAttempts: config.get<number>('network.retryAttempts', 3),
      retryDelay: config.get<number>('network.retryDelay', 1000),
      exponentialBackoff: config.get<boolean>('network.exponentialBackoff', true),
    };
  }

  /**
   * Execute async operation with timeout and retry logic
   */
  async executeWithTimeout<T>(
    operationId: string,
    operation: () => Promise<T>,
    timeoutMs: number = this._config.analysisTimeout,
    retries: number = this._config.retryAttempts
  ): Promise<TimeoutResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
          }, timeoutMs);
          
          this._activeTimeouts.set(operationId, timeout);
        });

        // Race between operation and timeout
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ]);

        // Clear timeout on success
        this.clearTimeout(operationId);
        
        return {
          success: true,
          data: result,
          timedOut: false,
          attempt,
          duration: Date.now() - startTime
        };

      } catch (error: any) {
        this.clearTimeout(operationId);
        lastError = error;
        
        // Check if it's a timeout error
        const isTimeout = error.message?.includes('timed out') || 
                         error.code === 'ETIMEDOUT' ||
                         error.code === 'ECONNABORTED';

        // If not a timeout or last attempt, throw
        if (!isTimeout || attempt > retries) {
          return {
            success: false,
            error: lastError,
            timedOut: isTimeout,
            attempt,
            duration: Date.now() - startTime
          };
        }

        // Wait before retry with exponential backoff
        const delay = this._config.exponentialBackoff
          ? this._config.retryDelay * Math.pow(2, attempt - 1)
          : this._config.retryDelay;

        console.log(`[RCA] Retry attempt ${attempt}/${retries} after ${delay}ms delay`);
        await this.sleep(delay);
      }
    }

    // Should never reach here, but for type safety
    return {
      success: false,
      error: lastError || new Error('Operation failed'),
      timedOut: true,
      attempt: retries + 1,
      duration: Date.now() - startTime
    };
  }

  /**
   * Check if Ollama server is reachable
   */
  async checkOllamaConnection(ollamaUrl: string): Promise<TimeoutResult<boolean>> {
    return this.executeWithTimeout(
      'ollama-connection-check',
      async () => {
        const response = await fetch(`${ollamaUrl}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(this._config.connectionTimeout)
        });
        return response.ok;
      },
      this._config.connectionTimeout,
      2 // Fewer retries for connection check
    );
  }

  /**
   * Execute analysis with comprehensive timeout handling
   */
  async executeAnalysis<T>(
    analysisId: string,
    analysisFn: () => Promise<T>,
    onProgress?: (status: string) => void
  ): Promise<TimeoutResult<T>> {
    const totalStartTime = Date.now();
    
    // Create abort controller for manual cancellation
    const abortController = new AbortController();
    
    // Store abort controller for external cancellation
    (this as any)._abortControllers = (this as any)._abortControllers || new Map();
    (this as any)._abortControllers.set(analysisId, abortController);

    try {
      // Set up total timeout
      const totalTimeoutId = setTimeout(() => {
        onProgress?.('Analysis exceeded maximum time limit');
        abortController.abort();
      }, this._config.totalTimeout);

      // Execute analysis
      const result = await this.executeWithTimeout(
        analysisId,
        async () => {
          if (abortController.signal.aborted) {
            throw new Error('Analysis was cancelled');
          }
          return await analysisFn();
        },
        this._config.analysisTimeout,
        this._config.retryAttempts
      );

      clearTimeout(totalTimeoutId);
      return result;

    } catch (error: any) {
      return {
        success: false,
        error: error as Error,
        timedOut: true,
        attempt: 1,
        duration: Date.now() - totalStartTime
      };
    } finally {
      (this as any)._abortControllers.delete(analysisId);
    }
  }

  /**
   * Cancel ongoing operation
   */
  cancelOperation(operationId: string): void {
    // Cancel timeout
    this.clearTimeout(operationId);
    
    // Abort operation if abort controller exists
    const abortController = (this as any)._abortControllers?.get(operationId);
    if (abortController) {
      abortController.abort();
      (this as any)._abortControllers.delete(operationId);
    }
  }

  /**
   * Clear specific timeout
   */
  private clearTimeout(operationId: string): void {
    const timeout = this._activeTimeouts.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      this._activeTimeouts.delete(operationId);
    }
  }

  /**
   * Clear all active timeouts
   */
  clearAllTimeouts(): void {
    for (const [id, timeout] of this._activeTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this._activeTimeouts.clear();
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message for timeout errors
   */
  getTimeoutErrorMessage(error: Error, context: string): string {
    if (error.message.includes('timed out')) {
      return `Analysis ${context} timed out. The operation took longer than expected. Try:\n` +
             `• Using a smaller model (e.g., 7B instead of 13B)\n` +
             `• Checking your system resources (RAM, CPU)\n` +
             `• Simplifying the error message\n` +
             `• Increasing timeout in settings`;
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return `Cannot connect to Ollama server. Please ensure:\n` +
             `• Ollama is running (ollama serve)\n` +
             `• Server URL is correct in settings\n` +
             `• No firewall blocking the connection`;
    }
    
    if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
      return `Connection to Ollama was interrupted. This can happen when:\n` +
             `• Ollama server restarted\n` +
             `• Network connection dropped\n` +
             `• Analysis was cancelled\n` +
             `Try analyzing again.`;
    }

    return `Network error: ${error.message}`;
  }

  /**
   * Show timeout error notification to user
   */
  async showTimeoutNotification(result: TimeoutResult<any>, context: string): Promise<void> {
    if (!result.success && result.error) {
      const message = this.getTimeoutErrorMessage(result.error, context);
      const action = result.timedOut ? 'Increase Timeout' : 'Check Connection';
      
      const selection = await vscode.window.showErrorMessage(
        `RCA Agent: ${message}`,
        action,
        'View Logs',
        'Dismiss'
      );

      switch (selection) {
        case 'Increase Timeout':
          await vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'rcaAgent.network'
          );
          break;
        case 'View Logs':
          await vscode.commands.executeCommand('rca-agent.showLogs');
          break;
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TimeoutConfig>): void {
    this._config = { ...this._config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<TimeoutConfig> {
    return { ...this._config };
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clearAllTimeouts();
    if ((this as any)._abortControllers) {
      for (const [id, controller] of (this as any)._abortControllers.entries()) {
        controller.abort();
      }
      (this as any)._abortControllers.clear();
    }
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly operationId: string,
    public readonly duration: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Network error class
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}
