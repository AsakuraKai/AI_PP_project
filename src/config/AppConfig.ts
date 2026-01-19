import { Logger } from '../utils/Logger';
import { Environment } from './Environment';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

export interface ChromaConfig {
  url: string;
  collectionName: string;
  timeout: number;
}

export interface CacheConfig {
  ttl: number;
  maxEntries: number;
  cleanupInterval: number;
}

export interface AgentConfig {
  maxIterations: number;
  timeout: number;
  usePromptEngine: boolean;
  generateFix: boolean;
  enableProgressivePrompting: boolean;
}

const DEFAULT_MODEL = 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest';
const log = new Logger('AppConfig');

export class AppConfig {
  static get ollama(): OllamaConfig {
    Environment.load();
    return {
      baseUrl: this.getString('OLLAMA_BASE_URL', 'http://localhost:11434'),
      model: this.getModel(),
      timeout: this.getNumber('OLLAMA_TIMEOUT', 90_000),
      maxRetries: this.getNumber('OLLAMA_MAX_RETRIES', 3),
    };
  }

  static get chroma(): ChromaConfig {
    const raw = this.getString('CHROMA_URL', 'http://localhost:8000');
    const url = /^https?:\/\//i.test(raw) ? raw : 'http://localhost:8000';
    return {
      url,
      collectionName: this.getString('CHROMA_COLLECTION', 'rca_solutions'),
      timeout: this.getNumber('CHROMA_TIMEOUT', 30_000),
    };
  }

  static get cache(): CacheConfig {
    return {
      ttl: this.getNumber('CACHE_TTL', 24 * 60 * 60 * 1000),
      maxEntries: this.getNumber('CACHE_MAX_ENTRIES', 1000),
      cleanupInterval: this.getNumber('CACHE_CLEANUP_MS', 5 * 60 * 1000),
    };
  }

  static get agent(): AgentConfig {
    return {
      maxIterations: this.getNumber('AGENT_MAX_ITERATIONS', 10),
      timeout: this.getNumber('AGENT_TIMEOUT', 90_000),
      usePromptEngine: this.getBoolean('AGENT_USE_PROMPT_ENGINE', true),
      generateFix: this.getBoolean('AGENT_GENERATE_FIX', true),
      enableProgressivePrompting: this.getBoolean('AGENT_ENABLE_PROGRESSIVE_PROMPTING', false),
    };
  }

  static get logLevel(): number {
    return this.getNumber('LOG_LEVEL', 1);
  }

  private static getModel(): string {
    const envModel = process.env.AI_PP_OLLAMA_MODEL || process.env.OLLAMA_MODEL;
    if (envModel && envModel.trim().length > 0) return envModel.trim();
    return DEFAULT_MODEL;
  }

  private static getString(key: string, defaultValue = ''): string {
    const value = process.env[key];
    return value !== undefined ? value : defaultValue;
  }

  private static getNumber(key: string, defaultValue: number): number {
    const raw = process.env[key];
    if (!raw) return defaultValue;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      log.warn('Invalid numeric config, using default', { key, raw, defaultValue });
      return defaultValue;
    }
    return parsed;
  }

  private static getBoolean(key: string, defaultValue: boolean): boolean {
    const raw = process.env[key];
    if (!raw) return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
  }
}
