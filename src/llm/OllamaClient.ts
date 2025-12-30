/**
 * OllamaClient - Interface to local Ollama LLM server
 * 
 * Handles communication with Ollama API for LLM inference.
 * Supports hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest model (primary) with fallback options.
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

import { LLMError, LLMResponse, GenerateOptions, RetryConfig } from '../types';

export interface OllamaConfig {
  /** Base URL for Ollama API (default: http://localhost:11434) */
  baseUrl?: string;
  
  /** Model to use (default: hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest) */
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
    this.model = config.model || 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest';
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

      const data = await response.json() as { models?: Array<{ name: string }> };
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
        format: 'json', // Enforce JSON output format (Chunk 9 Phase 1)
        options: {
          temperature: options.temperature ?? 0.0, // Deterministic output (was 0.7) - Chunk 9 Phase 1
          num_predict: options.maxTokens ?? 2048, // Increased from 2000 for complete responses - Chunk 9 Phase 1
          num_ctx: 8192, // Increased context window for RAG + examples (Iteration 6 Phase 1)
          repeat_penalty: 1.1, // Reduce repetition - Chunk 9 Phase 1
          seed: options.seed ?? 42, // Reproducible outputs - Chunk 9 Phase 1
          top_p: options.topP,
          top_k: options.topK,
          stop: options.stop || ['<think>', '</think>'], // Explicit stop tokens (Iteration 6 Phase 1)
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

      const data = await response.json() as { response?: string; eval_count?: number };
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
   * Generate text with quality-based retry logic (Iteration 6 Phase 2 + P3)
   * 
   * Uses progressive temperature and multiple retry strategies to prevent
   * empty JSON responses and improve output quality.
   * 
   * @param prompt - Input prompt for the model
   * @param options - Generation options
   * @param config - Retry configuration
   * @param originalError - Original error context for diagnostic accuracy check (P3)
   * @returns LLM response with generated text
   * @throws LLMError if all attempts fail
   */
  async generateWithRetry(
    prompt: string,
    options?: GenerateOptions,
    config?: RetryConfig,
    originalError?: string
  ): Promise<LLMResponse> {
    const maxAttempts = config?.maxAttempts ?? 4;
    const qualityThreshold = config?.qualityThreshold ?? 0.50; // P2: Lowered from 0.6 to accept "good enough" responses
    
    // Progressive temperature strategies for each attempt
    const strategies = [
      { temp: 0.0, promptSuffix: '' },  // Attempt 1: Deterministic
      { temp: 0.3, promptSuffix: '\n\n**CRITICAL: Provide COMPLETE JSON with all required fields. Include exact file paths with line numbers.**' },  // Attempt 2: Low exploration
      { temp: 0.5, promptSuffix: '\n\n**PREVIOUS ATTEMPTS FAILED. Use this format:**\n```json\n{\n  "thought": "200+ chars analysis",\n  "rootCause": "Specific cause with file:line",\n  "fixGuidelines": ["Step 1 with code", "Step 2 with verification"]\n}\n```' },  // Attempt 3: Medium exploration with template
      { temp: 0.7, promptSuffix: '\n\n**FINAL ATTEMPT: Think step-by-step, then output complete JSON.**' }  // Attempt 4: High exploration
    ];

    let lastError: Error | null = null;
    let bestResponse: { response: LLMResponse; quality: number } | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const strategy = strategies[Math.min(attempt, strategies.length - 1)];
      
      console.log(`🔄 Attempt ${attempt + 1}/${maxAttempts} (temp: ${strategy.temp})...`);
      
      try {
        const response = await this.generate(
          prompt + strategy.promptSuffix,
          { ...options, temperature: strategy.temp }
        );

        // Quick quality check before validation (P3: now includes diagnostic accuracy)
        const quality = this.quickQualityCheck(response.text, originalError);
        
        console.log(`📊 Quality score: ${(quality.score * 100).toFixed(1)}%`);
        
        // Track best response across all attempts
        if (!bestResponse || quality.score > bestResponse.quality) {
          bestResponse = { response, quality: quality.score };
        }

        // Early exit if quality meets threshold
        if (quality.score >= qualityThreshold) {
          console.log(`✅ Quality threshold met on attempt ${attempt + 1}`);
          return response;
        }

        console.log(`⚠️ Quality below threshold (${quality.issues.join(', ')}), retrying...`);
        
        // Exponential backoff between attempts
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Attempt ${attempt + 1} failed: ${lastError.message}`);
      }
    }

    // Return best attempt if quality is reasonable (>30%)
    if (bestResponse && bestResponse.quality > 0.3) {
      console.log(`⚠️ Returning best attempt (quality: ${(bestResponse.quality * 100).toFixed(1)}%)`);
      return bestResponse.response;
    }

    // Graceful degradation - return fallback response
    console.warn(`⚠️ All attempts failed. Returning fallback response.`);
    return this.createFallbackResponse(prompt, lastError);
  }

  /**
   * Quick quality check for JSON responses (Iteration 6 Phase 2 + P3)
   * 
   * Evaluates response quality based on:
   * - rootCause length and specificity
   * - fixGuidelines presence and quality
   * - File path references
   * - Line number references
   * - Diagnostic accuracy (P3: checks if diagnosis matches error domain)
   * 
   * @param jsonText - JSON response text to check
   * @param originalError - Original error context for accuracy check (P3)
   * @returns Quality score (0-1) and list of issues
   */
  private quickQualityCheck(jsonText: string, originalError?: string): { score: number; issues: string[] } {
    let score = 1.0;
    const issues: string[] = [];

    try {
      const json = JSON.parse(jsonText);

      // Check rootCause quality
      if (!json.rootCause || json.rootCause.length < 80) {
        score -= 0.3;
        issues.push('rootCause too short');
      }

      // Check fixGuidelines quality
      if (!Array.isArray(json.fixGuidelines) || json.fixGuidelines.length === 0) {
        score -= 0.3;
        issues.push('no fixGuidelines');
      } else if (json.fixGuidelines.every((g: string) => g.length < 40)) {
        score -= 0.2;
        issues.push('fixGuidelines too vague');
      }

      // Check for file paths
      const hasFilePaths = /\.(kt|java|xml|gradle)/.test(jsonText);
      if (!hasFilePaths) {
        score -= 0.15;
        issues.push('no file paths');
      }

      // Check for line numbers
      const hasLineNumbers = /line\s*\d+|:\d+/i.test(jsonText);
      if (!hasLineNumbers) {
        score -= 0.1;
        issues.push('no line numbers');
      }

      // P3: Check diagnostic accuracy (if originalError provided)
      if (originalError && json.rootCause) {
        const isAccurate = this.checkDiagnosticAccuracy(json.rootCause, json.thought || '', originalError);
        if (!isAccurate) {
          score -= 0.25; // Major penalty for wrong diagnosis
          issues.push('diagnosis domain mismatch');
        }
      }

    } catch (e) {
      score = 0;
      issues.push('invalid JSON');
    }

    return { score: Math.max(0, score), issues };
  }

  /**
   * Check if diagnosis matches error domain (P3)
   * 
   * Validates that the diagnosed cause is in the same domain as the original error.
   * Prevents regeneration from changing cache errors to permission errors, etc.
   * 
   * @param rootCause - Diagnosed root cause
   * @param thought - Agent's reasoning
   * @param originalError - Original error message and stack
   * @returns true if diagnosis matches error domain, false if mismatch
   */
  private checkDiagnosticAccuracy(
    rootCause: string,
    thought: string,
    originalError: string
  ): boolean {
    const errorLower = originalError.toLowerCase();
    const diagnosisLower = (rootCause + ' ' + thought).toLowerCase();
    
    // Identify error domain from original error
    const errorDomains: Record<string, string[]> = {
      'permission': ['permission', 'securityexception', 'manifest'],
      'cache': ['cache', 'corrupted', 'gradle cache'],
      'network': ['network', 'maven', 'download', 'repository', 'timeout'],
      'proguard': ['proguard', 'r8', 'nosuchmethod', 'minify'],
      'navigation': ['navigation', 'argument', 'navhost'],
      'null-pointer': ['null', 'npe', 'nullpointer', 'lateinit']
    };
    
    // Find which domain the error belongs to
    let errorDomain: string | null = null;
    for (const [domain, keywords] of Object.entries(errorDomains)) {
      if (keywords.some(keyword => errorLower.includes(keyword))) {
        errorDomain = domain;
        break;
      }
    }
    
    // If no specific domain, accept any diagnosis (can't verify)
    if (!errorDomain) {
      return true;
    }
    
    // Check if diagnosis mentions keywords from the error domain
    const domainKeywords = errorDomains[errorDomain];
    const mentionsKeyTerms = domainKeywords.some(keyword => diagnosisLower.includes(keyword));
    
    // Check if diagnosis mentions keywords from WRONG domains
    const mentionsWrongDomain = Object.entries(errorDomains)
      .filter(([domain]) => domain !== errorDomain)
      .some(([, keywords]) => keywords.some(keyword => diagnosisLower.includes(keyword)));
    
    // Accurate if mentions correct terms and doesn't mention wrong domain terms
    return mentionsKeyTerms || !mentionsWrongDomain;
  }

  /**
   * Create fallback response when all attempts fail (Iteration 6 Phase 2)
   * 
   * @param prompt - Original prompt
   * @param error - Last error encountered
   * @returns Minimal but valid LLM response
   */
  private createFallbackResponse(prompt: string, error: Error | null): LLMResponse {
    return {
      text: JSON.stringify({
        thought: `Analysis incomplete after multiple attempts. Error: ${error?.message || 'Unknown'}`,
        action: null,
        rootCause: `Unable to generate complete analysis. Manual review recommended. Context: ${prompt.substring(0, 150)}...`,
        fixGuidelines: [
          '1. Review the error logs carefully for stack traces and error messages',
          '2. Check official Android/Kotlin documentation for this error type',
          '3. Search Stack Overflow with specific error message',
          '4. Consider using a larger model or manual analysis for complex errors'
        ],
        confidence: 0.2
      }),
      model: this.model,
      generationTime: 0
    };
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

      const data = await response.json() as { models?: Array<{ name: string }> };
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
