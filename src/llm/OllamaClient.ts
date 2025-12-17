/**
 * OllamaClient - Interface to local Ollama LLM server
 * 
 * Handles communication with Ollama API for LLM inference.
 * Supports granite-code:8b model (primary) with fallback options.
 * 
 * Key Features:
 * - Connection management with health checks
 * - Retry logic with exponential backoff
 * - Timeout handling (90s default)
 * - Error recovery and graceful degradation
 * 
 * @example
 * const client = new OllamaClient();
 * await client.connect();
 * const response = await client.generate('Explain Kotlin lateinit');
 */

import { LLMError, LLMResponse, GenerateOptions } from '../types';

export interface OllamaConfig {
  /** Base URL for Ollama API (default: http://localhost:11434) */
  baseUrl?: string;
  
  /** Model to use (default: granite-code:8b) */
  model?: string;
  
  /** Request timeout in milliseconds (default: 90000) */
  timeout?: number;
  
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  
  /** Initial retry delay in milliseconds (default: 1000) */
  initialRetryDelay?: number;
}

export class OllamaClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly initialRetryDelay: number;
  private connected: boolean = false;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'granite-code:8b';
    this.timeout = config.timeout || 90000; // 90 seconds
    this.maxRetries = config.maxRetries || 3;
    this.initialRetryDelay = config.initialRetryDelay || 1000;
  }

  /**
   * Check if Ollama server is accessible and model is available
   * @throws LLMError if connection fails
   */
  async connect(): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: 'GET' },
        5000 // 5 second timeout for health check
      );

      if (!response.ok) {
        throw new LLMError(
          `Ollama server returned ${response.status}: ${response.statusText}`,
          response.status,
          false
        );
      }

      const data = await response.json();
      const models = data.models || [];
      
      const hasModel = models.some((m: any) => m.name === this.model);
      if (!hasModel) {
        throw new LLMError(
          `Model ${this.model} not found. Available models: ${models.map((m: any) => m.name).join(', ')}`,
          404,
          false
        );
      }

      this.connected = true;
      console.log(`Connected to Ollama - Model: ${this.model}`);
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      
      throw new LLMError(
        `Failed to connect to Ollama at ${this.baseUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        true
      );
    }
  }

  /**
   * Generate text using Ollama model
   * 
   * @param prompt - Input prompt for the model
   * @param options - Generation options
   * @returns LLM response with generated text
   * @throws LLMError if generation fails after retries
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<LLMResponse> {
    if (!this.connected) {
      await this.connect();
    }

    const startTime = Date.now();
    
    return await this.withRetry(async () => {
      const requestBody = {
        model: this.model,
        prompt,
        stream: false, // Use non-streaming for MVP
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2000,
          top_p: options.topP,
          top_k: options.topK,
          stop: options.stop,
        },
      };

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
        this.timeout
      );

      if (!response.ok) {
        throw new LLMError(
          `Ollama generation failed: ${response.status} ${response.statusText}`,
          response.status,
          response.status >= 500 // Retry on server errors
        );
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      return {
        text: data.response || '',
        tokensUsed: data.eval_count,
        generationTime,
        model: this.model,
      };
    });
  }

  /**
   * Check if Ollama server is healthy
   * @returns true if server is accessible
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: 'GET' },
        5000
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available models
   * @returns Array of model names
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/tags`,
        { method: 'GET' },
        5000
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch {
      return [];
    }
  }

  /**
   * Fetch with timeout support
   * Node's fetch doesn't support timeout natively, so we implement it
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LLMError(
          `Request timed out after ${timeoutMs}ms`,
          undefined,
          true
        );
      }
      
      throw error;
    }
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    let delay = this.initialRetryDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if error is not retryable
        if (error instanceof LLMError && !error.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          throw error;
        }

        console.warn(
          `Attempt ${attempt + 1}/${this.maxRetries + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
        
        // Exponential backoff with jitter
        delay = Math.min(delay * 2, 10000) + Math.random() * 100;
      }
    }

    throw lastError!;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<OllamaConfig> {
    return {
      baseUrl: this.baseUrl,
      model: this.model,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      initialRetryDelay: this.initialRetryDelay,
    };
  }
}
