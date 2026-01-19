import * as fs from 'fs';
import * as path from 'path';

/**
 * Lightweight .env loader to avoid external dependency.
 */
export class Environment {
  private static loaded = false;

  static load(): void {
    if (Environment.loaded) return;
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      Environment.loaded = true;
      return;
    }

    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    Environment.loaded = true;
  }

  static get isDevelopment(): boolean {
    return (process.env.NODE_ENV || 'development') !== 'production';
  }

  static get isTest(): boolean {
    return Boolean(process.env.JEST_WORKER_ID);
  }

  static get logLevel(): number {
    return Number(process.env.LOG_LEVEL ?? '1');
  }
}
