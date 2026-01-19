export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ServiceError extends AppError {
  constructor(
    message: string,
    code: string,
    isRetryable: boolean = false,
    public readonly service: string = 'unknown',
    details?: Record<string, unknown>
  ) {
    super(message, code, isRetryable, details);
  }
}

export class LLMError extends ServiceError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    isRetryable: boolean = false,
    details?: Record<string, unknown>
  ) {
    super(message, 'LLM_ERROR', isRetryable, 'OllamaClient', { statusCode, ...details });
  }

  // Backward-compatibility for callers expecting `retryable`
  get retryable(): boolean {
    return this.isRetryable;
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', false, field ? { field, value } : undefined);
  }
}

export class TimeoutError extends AppError {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(message, 'TIMEOUT_ERROR', true, { operation, timeoutMs });
  }
}
