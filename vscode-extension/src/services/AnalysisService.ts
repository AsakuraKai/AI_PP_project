/**
 * AnalysisService - Orchestrates error analysis with backend
 * Chunk 2: Core Panel UI - Backend Integration
 * 
 * Integrates with Kai's backend components:
 * - OllamaClient (LLM communication)
 * - MinimalReactAgent (RCA analysis)
 * - ErrorParser (error parsing)
 * - ChromaDBClient (knowledge base)
 */

import * as vscode from 'vscode';
import { ErrorItem, AgentState, RCAResult, ValidatedErrorItem, getProjectScope, buildScopePromptContext } from '../types';
import { MinimalReactAgent } from '../../../src/agent/MinimalReactAgent';
import { AgentStateStream } from '../../../src/agent/AgentStateStream';
import { OllamaClient } from '../../../src/llm/OllamaClient';
import { ErrorParser } from '../../../src/utils/ErrorParser';
import { ChromaDBClient } from '../../../src/db/ChromaDBClient';
import { RCACache } from '../../../src/cache/RCACache';
import { NetworkTimeoutHandler } from './NetworkTimeoutHandler';
import { calculateQualityScore } from '../../../src/db/schemas/rca-collection';
import { CloudLLMService } from './CloudLLMService';

/**
 * Progress callback for analysis updates (uses shared AgentState)
 */
export type ProgressCallback = (progress: AgentState) => void;

/**
 * Analysis service for RCA operations
 */
export class AnalysisService {
  private static _instance: AnalysisService;
  private _currentAnalysis?: {
    errorId: string;
    startTime: number;
    cancelToken: vscode.CancellationTokenSource;
  };

  // Backend components
  private _agent?: MinimalReactAgent;
  private _parser?: ErrorParser;
  private _client?: OllamaClient;
  private _chromaDB?: ChromaDBClient;
  private _cache?: RCACache;
  private _stateStream?: AgentStateStream;
  private _timeoutHandler: NetworkTimeoutHandler;
  private _cloudLLMService?: CloudLLMService;
  private _extensionContext?: vscode.ExtensionContext;

  private constructor() {
    // Singleton
    this._timeoutHandler = new NetworkTimeoutHandler();
  }

  static getInstance(): AnalysisService {
    if (!AnalysisService._instance) {
      AnalysisService._instance = new AnalysisService();
    }
    return AnalysisService._instance;
  }

  /**
   * Set extension context for cloud LLM support
   */
  setExtensionContext(context: vscode.ExtensionContext): void {
    this._extensionContext = context;
    this._cloudLLMService = new CloudLLMService(context, context.secrets);
  }

  /**
   * Initialize backend components
   */
  async initialize(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('rcaAgent');
      const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
      const model = config.get<string>('model', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
      // Note: Despite the setting name, ChromaDBClient expects a server URL.
      // Default to localhost URL to match start.py (`chroma run --host localhost --port 8000`).
      const chromaConfigValue = config.get<string>('chromaDbPath', 'http://localhost:8000');
      const chromaUrl = /^https?:\/\//i.test(chromaConfigValue)
        ? chromaConfigValue
        : 'http://localhost:8000';

      console.log('[AnalysisService] Initializing with:', { ollamaUrl, model, chromaUrl });

      // Check if cloud LLM is configured
      let useCloudLLM = false;
      if (this._cloudLLMService) {
        useCloudLLM = await this._cloudLLMService.isConfigured();
        console.log('[AnalysisService] Cloud LLM configured:', useCloudLLM);
      }

      // Initialize LLM client (Ollama or Cloud)
      if (useCloudLLM && this._cloudLLMService) {
        const cloudClient = await this._cloudLLMService.getCloudClient();
        if (cloudClient) {
          // Wrap cloud client to be compatible with OllamaClient interface
          this._client = this._createCloudClientWrapper(cloudClient);
          console.log('[AnalysisService] Using cloud LLM client');
        } else {
          // Fallback to Ollama
          this._client = new OllamaClient({ baseUrl: ollamaUrl, model });
          console.log('[AnalysisService] Cloud client unavailable, using Ollama');
        }
      } else {
        // Use Ollama client
        this._client = new OllamaClient({ baseUrl: ollamaUrl, model });
        console.log('[AnalysisService] Using Ollama client');
      }

      // Initialize ErrorParser
      this._parser = ErrorParser.getInstance();

      // Initialize ChromaDB client (optional - gracefully handles failure)
      try {
        this._chromaDB = await ChromaDBClient.create({ url: chromaUrl });
        console.log('[AnalysisService] ChromaDB initialized successfully');
      } catch (error) {
        const err = error as Error;
        console.warn('[AnalysisService] ChromaDB initialization failed (continuing without cache):', err.message);
        this._chromaDB = undefined;
        // Extension will work without ChromaDB cache - this is expected if ChromaDB isn't set up
      }

      // Initialize RCACache
      this._cache = new RCACache({
        ttl: config.get<number>('cacheTtl', 24 * 60 * 60 * 1000), // 24 hours
        maxEntries: config.get<number>('maxCacheEntries', 1000)
      });
      console.log('[AnalysisService] RCACache initialized successfully');

      // Initialize MinimalReactAgent with config
      // Note: MultiPassAgent disabled due to performance issues (calls analyze() multiple times)
      // See docs/BUG_ANALYSIS_MULTIPASS_LOOPING.md for details
      if (!this._client) {
        throw new Error('LLM client not initialized');
      }

      this._agent = new MinimalReactAgent(this._client, {
        maxIterations: config.get<number>('maxIterations', 10),
        timeout: config.get<number>('timeout', 90000),
        usePromptEngine: true,
        useToolRegistry: true,
        generateFix: true,
        projectRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd(),
        enableProgressivePrompting: config.get<boolean>('enableProgressivePrompting', false),
        enableCaching: true
      });

      // Get state stream for real-time updates
      this._stateStream = this._agent.getStream();

      console.log('[AnalysisService] Initialized successfully');
    } catch (error) {
      console.error('[AnalysisService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if Ollama server is available
   */
  async checkOllamaConnection(): Promise<{ available: boolean; error?: string }> {
    try {
      if (!this._client) {
        await this.initialize();
      }

      // Use timeout handler for Ollama connection check
      const result = await this._timeoutHandler.executeWithTimeout(
        'ollama-connection-check',
        async () => await this._client!.isHealthy(),
        5000 // 5s timeout
      );

      if (result.timedOut) {
        return { available: false, error: 'Connection timed out' };
      }

      return { available: result.success && (result.data ?? false) };
    } catch (error) {
      const err = error as Error;
      return {
        available: false,
        error: err.message
      };
    }
  }

  /**
   * Check if model is available
   */
  async checkModelAvailable(_modelName: string): Promise<boolean> {
    try {
      if (!this._client) {
        await this.initialize();
      }

      // Client will verify model availability during health check
      return await this._client!.isHealthy();
    } catch (error) {
      console.error('[AnalysisService] Model check failed:', error);
      return false;
    }
  }

  /**
   * Get cache statistics for Metrics view
   */
  getCacheStats() {
    if (!this._cache) {
      return { hitRate: 0, size: 0, totalHits: 0, totalMisses: 0 };
    }
    return this._cache.getStats();
  }

  /**
   * Search for similar errors using ChromaDB
   */
  async searchSimilarErrors(errorMessage: string, limit: number = 5): Promise<any[]> {
    if (!this._chromaDB) {
      console.warn('[AnalysisService] ChromaDB not available for similarity search');
      return [];
    }

    try {
      const results = await this._chromaDB.searchSimilar(errorMessage, limit, 0.5);
      return results;
    } catch (error) {
      console.error('[AnalysisService] Similarity search failed:', error);
      return [];
    }
  }

  /**
   * Get ChromaDB instance for direct access
   */
  getChromaDB(): ChromaDBClient | undefined {
    return this._chromaDB;
  }

  /**
   * Get RCACache instance (used by feedback and metrics)
   */
  getCache(): RCACache | undefined {
    return this._cache;
  }

  /**
   * Validate and normalize error item
   * Ensures projectScope is always present with valid value
   */
  private _validateAndNormalizeError(error: ErrorItem): ValidatedErrorItem {
    return {
      ...error,
      projectScope: getProjectScope(error.projectScope)
    };
  }

  /**
   * Analyze an error
   */
  async analyzeError(
    error: ErrorItem,
    onProgress: ProgressCallback,
    cancellationToken?: vscode.CancellationToken
  ): Promise<RCAResult> {
    // Validate and normalize error data
    const validatedError = this._validateAndNormalizeError(error);

    console.log('[AnalysisService] Starting analysis for:', validatedError.id, {
      projectScope: validatedError.projectScope,
      filePath: validatedError.filePath
    });

    // Ensure backend is initialized
    if (!this._agent || !this._parser || !this._client) {
      await this.initialize();
    }

    // Always create an internal cancellation token so stopAnalysis() can reliably cancel.
    // If the caller provides a token, link it to the internal one.
    const cancelTokenSource = new vscode.CancellationTokenSource();
    const token = cancelTokenSource.token;
    if (cancellationToken) {
      cancellationToken.onCancellationRequested(() => cancelTokenSource.cancel());
    }

    // Store current analysis
    this._currentAnalysis = {
      errorId: error.id,
      startTime: Date.now(),
      cancelToken: cancelTokenSource
    };
    const operationId = `analysis-${error.id}`;

    // Throttle timer for progress updates (declared here so finally block can access it)
    let throttleTimer: NodeJS.Timeout | null = null;

    try {
      // Check Ollama connection first
      const connection = await this.checkOllamaConnection();
      if (!connection.available) {
        throw new Error(`Ollama server unavailable: ${connection.error}`);
      }

      // Parse error text - if error already has structured data, use it
      let parsed = this._parser!.parse(error.message, error.filePath);

      // Fallback: If parsing fails, construct ParsedError from ErrorItem structured data
      if (!parsed) {
        console.log('[AnalysisService] Parser failed, constructing from ErrorItem data');

        // Convert string[] stackTrace to StackFrame[] if available
        const stackFrames = error.stackTrace?.map((frame: string, index: number) => ({
          file: error.filePath,
          line: error.line + index,
          function: frame
        })) || [];

        parsed = {
          type: error.type || 'runtime',
          message: error.message,
          filePath: error.filePath,
          line: error.line || 0,
          language: this._detectLanguage(error.filePath) || 'typescript',
          column: error.column,
          stackTrace: stackFrames,
          metadata: {
            ...error.metadata,
            projectScope: validatedError.projectScope,
            scopeContext: buildScopePromptContext(validatedError.projectScope),
            fallback: true
          }
        };
      }

      // Set up AgentStateStream event listeners for real-time progress
      let currentIteration = 0;
      const maxIterations = this._agent!['maxIterations'] || 5;
      const startTime = Date.now();

      // Remove any existing listeners to prevent accumulation (defensive measure)
      this._stateStream!.removeAllListeners('iteration');
      this._stateStream!.removeAllListeners('thought');
      this._stateStream!.removeAllListeners('action');
      this._stateStream!.removeAllListeners('observation');

      // Throttle mechanism to prevent UI flooding with progress updates
      const PROGRESS_THROTTLE_MS = 200; // Only send updates every 200ms
      let lastProgressUpdate = 0;
      let pendingProgress: any = null;

      // State to accumulate across throttled updates
      let lastThought = '';
      const recentActions = [] as string[];
      const recentObservations = [] as string[];
      let fractionalProgress = 0; // Increases within an iteration

      const sendThrottledProgress = (progress: any) => {
        pendingProgress = progress;
        const now = Date.now();
        const timeSinceLastUpdate = now - lastProgressUpdate;

        if (timeSinceLastUpdate >= PROGRESS_THROTTLE_MS) {
          // Send immediately if enough time has passed
          onProgress(progress);
          lastProgressUpdate = now;
          if (throttleTimer) {
            clearTimeout(throttleTimer);
            throttleTimer = null;
          }
        } else {
          // Schedule deferred send if not already scheduled
          if (!throttleTimer) {
            throttleTimer = setTimeout(() => {
              if (pendingProgress) {
                onProgress(pendingProgress);
                lastProgressUpdate = Date.now();
              }
              throttleTimer = null;
            }, PROGRESS_THROTTLE_MS - timeSinceLastUpdate);
          }
        }
      };

      // Helper to build progress object with common fields (DRY principle)
      const buildProgress = () => {
        let baseProgress = ((currentIteration - 1) / maxIterations) * 100;
        if (baseProgress < 0) baseProgress = 0;
        
        // Add fractional progress (each action/observation adds 2% up to a max of iteration chunk)
        const iterationChunk = 100 / maxIterations;
        const maxFractional = iterationChunk * 0.9; // Cap at 90% of chunk
        let currentProgress = baseProgress + Math.min(fractionalProgress, maxFractional);
        if (currentProgress < 0) currentProgress = 0;
        if (currentProgress > 100) currentProgress = 100;

        return {
          iteration: currentIteration,
          maxIterations,
          progress: currentProgress,
          currentThought: lastThought,
          recentActions: [...recentActions],
          recentObservations: [...recentObservations],
          elapsed: Date.now() - startTime,
          isActive: true
        };
      };

      const handleIteration = (event: any) => {
        currentIteration = event.iteration;
        fractionalProgress = 5; // Start a bit into the chunk
        lastThought = `Starting iteration ${event.iteration}... Analyzing context.`;
        sendThrottledProgress({
          ...buildProgress(),
          iteration: event.iteration,
          maxIterations: event.maxIterations
        });
      };

      const handleThought = (event: any) => {
        fractionalProgress += 5;
        lastThought = event.thought;
        sendThrottledProgress(buildProgress());
      };

      const handleAction = (event: any) => {
        fractionalProgress += 5;
        const actionStr = `Executing tool: ${event.action.tool}`;
        lastThought = `Executing action: ${event.action.tool}...`;
        recentActions.push(actionStr);
        if (recentActions.length > 5) recentActions.shift();
        sendThrottledProgress(buildProgress());
      };

      const handleObservation = (event: any) => {
        fractionalProgress += 5;
        let obsStr = event.observation || '';
        if (obsStr.length > 50) obsStr = obsStr.substring(0, 50) + '...';
        lastThought = `Analyzing tool results...`;
        recentObservations.push(`Received: ${obsStr}`);
        if (recentObservations.length > 5) recentObservations.shift();
        sendThrottledProgress(buildProgress());
      };

      this._stateStream!.on('iteration', handleIteration);
      this._stateStream!.on('thought', handleThought);
      this._stateStream!.on('action', handleAction);
      this._stateStream!.on('observation', handleObservation);

      // Cancellation: race the analysis against a cancellation promise.
      // (MultiPassAgent doesn't accept a token; this prevents UI from waiting forever.)
      const cancelPromise = new Promise<never>((_, reject) => {
        token.onCancellationRequested(() => {
          try {
            this.stopAnalysis();
          } finally {
            reject(new Error('Analysis cancelled'));
          }
        });
      });

      // Run MultiPassAgent analysis with timeout protection (configurable via rcaAgent.network settings)
      if (!parsed) {
        throw new Error('Failed to parse error - no valid error data available');
      }

      // TypeScript type narrowing - parsed is guaranteed to be non-null here
      const parsedError = parsed;

      const analysisResult = await this._timeoutHandler.executeAnalysis(
        operationId,
        async () => {
          return await Promise.race([
            this._agent!.analyze(parsedError) as Promise<any>,
            cancelPromise
          ]);
        },
        (status) => {
          // Surface timeout warnings as progress updates so the UI reflects why we stopped
          // Reuse buildProgress helper to avoid duplication
          lastThought = status;
          sendThrottledProgress(buildProgress());
        }
      );

      if (analysisResult.timedOut) {
        const message = this._timeoutHandler.getTimeoutErrorMessage(
          analysisResult.error || new Error('Analysis timed out'),
          'run'
        );
        throw new Error(message);
      }

      if (!analysisResult.success) {
        throw analysisResult.error || new Error('Analysis failed');
      }

      const result = analysisResult.data!;

      // Compute a stable error hash for feedback/caching.
      const errorHash = this._cache?.getHash(parsed);

      // If ChromaDB is available, persist the analysis result so feedback can update it.
      // (When Chroma isn't available, feedback will be disabled in the UI.)
      let rcaId: string | undefined;
      if (this._chromaDB) {
        try {
          const storageLanguage = (parsed.language === 'proguard') ? 'gradle' : parsed.language;
          const base = {
            error_message: parsed.message,
            error_type: parsed.type,
            language: storageLanguage,
            root_cause: result.rootCause,
            fix_guidelines: result.fixGuidelines,
            confidence: result.confidence,
            user_validated: false,
            quality_score: 0,
            file_path: parsed.filePath,
            line_number: parsed.line,
            code_context: result.codeContext,
            metadata: {
              source: 'vscode-extension',
              toolsUsed: result.toolsUsed,
              iterations: result.iterations
            }
          };

          const quality_score = calculateQualityScore({
            ...base,
            created_at: Date.now()
          });

          rcaId = await this._chromaDB.addRCA({
            ...base,
            quality_score
          });

          console.log('[AnalysisService] RCA persisted to ChromaDB with id:', rcaId);

          // Cache the stored document for fast repeat lookups.
          if (errorHash && this._cache) {
            const stored = await this._chromaDB.getById(rcaId);
            if (stored) {
              this._cache.set(errorHash, stored);
            }
          }
        } catch (persistError) {
          console.warn('[AnalysisService] Failed to persist RCA to ChromaDB:', persistError);
          rcaId = undefined;
        }
      } else {
        console.warn('[AnalysisService] ChromaDB not available - analysis will not be persisted, feedback will be disabled');
      }

      // Search for similar errors in ChromaDB (for future learning/caching)
      if (parsed) {
        await this._searchSimilarErrors(parsed);
      }

      // Return backend result directly (types are compatible)
      console.log('[AnalysisService] Analysis complete:', result);
      return {
        ...result,
        // Extra fields for UI feedback wiring (kept optional and additive)
        rcaId,
        errorHash
      } as any;

    } catch (error) {
      console.error('[AnalysisService] Analysis failed:', error);
      throw error;
    } finally {
      // Clean up throttle timer
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }

      // Clean up event listeners to prevent accumulation
      if (this._stateStream) {
        this._stateStream.removeAllListeners('iteration');
        this._stateStream.removeAllListeners('thought');
        this._stateStream.removeAllListeners('action');
        this._stateStream.removeAllListeners('observation');
      }

      // Clear current analysis
      this._currentAnalysis = undefined;
      cancelTokenSource.dispose();
    }
  }

  /**
   * Stop current analysis
   */
  stopAnalysis(): void {
    if (this._currentAnalysis) {
      console.log('[AnalysisService] Stopping analysis:', this._currentAnalysis.errorId);
      this._timeoutHandler.cancelOperation(`analysis-${this._currentAnalysis.errorId}`);
      this._currentAnalysis.cancelToken.cancel();
      this._currentAnalysis = undefined;
    }
  }

  /**
   * Check if analysis is in progress
   */
  isAnalyzing(): boolean {
    return this._currentAnalysis !== undefined;
  }

  /**
   * Get current analysis info
   */
  getCurrentAnalysis(): { errorId: string; elapsed: number } | undefined {
    if (!this._currentAnalysis) {
      return undefined;
    }

    return {
      errorId: this._currentAnalysis.errorId,
      elapsed: Date.now() - this._currentAnalysis.startTime
    };
  }

  /**
   * Get AgentStateStream for subscribing to events
   */
  getStateStream(): AgentStateStream | undefined {
    return this._stateStream;
  }

  /**
   * Get current agent state (Phase 3)
   */
  getCurrentState(): AgentState | null {
    if (!this._agent || !this._stateStream) {
      return null;
    }

    // Return basic state info - the stream will provide detailed updates
    return {
      iteration: 0,
      maxIterations: 5,
      isActive: !!this._currentAnalysis,
      progress: 0,
      currentThought: '',
      hypothesis: null,
      rootCause: null
    };
  }

  /**
   * Search for similar errors in ChromaDB
   */
  private async _searchSimilarErrors(error: any): Promise<any[] | undefined> {
    try {
      if (!this._chromaDB) {
        return undefined;
      }

      const query = `${error.type} ${error.message}`;
      const results = await this._chromaDB.searchSimilar(query, 3);

      return results;
    } catch (error) {
      console.error('[AnalysisService] Similar error search failed:', error);
      return undefined;
    }
  }

  /**
   * Detect programming language from file path
   */
  private _detectLanguage(filePath: string): 'kotlin' | 'java' | 'xml' | 'gradle' {
    const ext = filePath.split('.').pop()?.toLowerCase();

    if (ext === 'kt') return 'kotlin';
    if (ext === 'java') return 'java';
    if (ext === 'xml') return 'xml';
    if (ext === 'gradle' || filePath.includes('build.gradle')) return 'gradle';

    return 'kotlin'; // default
  }

  /**
   * Create a wrapper around cloud LLM client to make it compatible with OllamaClient interface
   */
  private _createCloudClientWrapper(cloudClient: any): any {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    const cloudConfig = this._cloudLLMService ?
      this._cloudLLMService.getCloudConfig() :
      Promise.resolve(undefined);

    return {
      // Implement OllamaClient interface methods
      async generate(prompt: string, options?: any): Promise<any> {
        try {
          const config = await cloudConfig;
          if (!config) {
            throw new Error('Cloud LLM not configured');
          }

          const response = await cloudClient.generateContent(config.model, prompt);

          return {
            response: response.content,
            model: response.model,
            done: true,
            context: [],
            total_duration: 0,
            load_duration: 0,
            prompt_eval_count: response.usage?.promptTokens || 0,
            eval_count: response.usage?.completionTokens || 0
          };
        } catch (error) {
          console.error('[AnalysisService] Cloud LLM generation failed:', error);
          throw error;
        }
      },

      async isHealthy(): Promise<boolean> {
        try {
          return await cloudClient.testConnection();
        } catch (error) {
          console.error('[AnalysisService] Cloud LLM health check failed:', error);
          return false;
        }
      },

      // Pass through other properties
      baseUrl: 'cloud-llm',
      model: 'cloud'
    };
  }
}
