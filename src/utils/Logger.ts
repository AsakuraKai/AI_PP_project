export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export type LogMeta = Record<string, unknown>;

/**
 * Minimal structured logger used across backend components.
 */
export class Logger {
  private static level: LogLevel = LogLevel.INFO;

  constructor(private readonly context: string) { }

  static setLevel(level: LogLevel): void {
    Logger.level = level;
  }

  debug(message: string, meta?: LogMeta): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: LogMeta): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: LogMeta): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorMeta = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : error !== undefined
        ? { error: String(error) }
        : undefined;

    this.log(LogLevel.ERROR, message, { ...meta, ...errorMeta });
  }

  private log(level: LogLevel, message: string, meta?: LogMeta): void {
    if (level < Logger.level) return;

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const formatted = `[${timestamp}] [${levelStr}] [${this.context}] ${message}${metaStr}`;

    switch (level) {
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(formatted);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(formatted);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(formatted);
    }
  }
}
