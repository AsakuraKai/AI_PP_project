/**
 * RetryUtils - Shared retry and backoff utilities
 * 
 * Centralizes retry logic to eliminate duplication across OllamaClient,
 * NetworkTimeoutHandler, and other services.
 * 
 * Features:
 * - Exponential backoff with jitter
 * - Configurable retry strategies
 * - Sleep/delay utilities
 * - Timeout promises
 * 
 * @example
 * const result = await RetryUtils.withExponentialBackoff(
 *   async () => await someOperation(),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 */

export interface RetryConfig {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;

  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;

  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;

  /** Whether to add random jitter (default: true) */
  jitter?: boolean;

  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;

  /** Function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;

  /** Callback for each retry attempt */
  onRetry?: (attempt: number, delay: number, error: Error) => void;
}

export class RetryUtils {
  /**
   * Execute operation with exponential backoff retry
   * 
   * @param operation - Async operation to retry
   * @param config - Retry configuration
   * @returns Result of successful operation
   * @throws Last error if all attempts fail
   */
  static async withExponentialBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      jitter = true,
      backoffMultiplier = 2,
      isRetryable = () => true,
      onRetry,
    } = config;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!isRetryable(lastError)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts - 1) {
          throw lastError;
        }

        // Calculate delay with jitter
        const actualDelay = jitter
          ? delay + Math.random() * 100
          : delay;

        // Notify retry
        if (onRetry) {
          onRetry(attempt + 1, actualDelay, lastError);
        }

        // Wait before retry
        await this.sleep(actualDelay);

        // Exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute operation with linear backoff retry
   * 
   * @param operation - Async operation to retry
   * @param config - Retry configuration
   * @returns Result of successful operation
   * @throws Last error if all attempts fail
   */
  static async withLinearBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      jitter = true,
      isRetryable = () => true,
      onRetry,
    } = config;

    let lastError: Error;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!isRetryable(lastError)) {
          throw lastError;
        }

        if (attempt === maxAttempts - 1) {
          throw lastError;
        }

        // Linear backoff: delay * (attempt + 1)
        const baseDelay = Math.min(
          initialDelay * (attempt + 1),
          maxDelay
        );

        const actualDelay = jitter
          ? baseDelay + Math.random() * 100
          : baseDelay;

        if (onRetry) {
          onRetry(attempt + 1, actualDelay, lastError);
        }

        await this.sleep(actualDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create timeout promise that rejects after specified time
   * 
   * @param ms - Timeout in milliseconds
   * @param message - Error message
   * @returns Promise that rejects after timeout
   */
  static timeout(ms: number, message?: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message || `Operation timed out after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Race operation against timeout
   * 
   * @param operation - Async operation
   * @param timeoutMs - Timeout in milliseconds
   * @param message - Timeout error message
   * @returns Result of operation or timeout error
   */
  static async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    message?: string
  ): Promise<T> {
    return Promise.race([
      operation,
      this.timeout(timeoutMs, message),
    ]);
  }

  /**
   * Create abort controller with timeout
   * 
   * @param timeoutMs - Timeout in milliseconds
   * @returns Abort controller and cleanup function
   */
  static createAbortController(timeoutMs: number): {
    controller: AbortController;
    cleanup: () => void;
  } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return {
      controller,
      cleanup: () => clearTimeout(timeoutId),
    };
  }
}
