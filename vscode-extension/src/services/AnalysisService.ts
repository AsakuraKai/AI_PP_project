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
import { ErrorItem, AgentState, RCAResult } from '../types';
import { RCAResult as BackendRCAResult } from '../../../src/types';
import { MultiPassAgent } from '../../../src/agent/MultiPassAgent';
import { AgentStateStream } from '../../../src/agent/AgentStateStream';
import { OllamaClient } from '../../../src/llm/OllamaClient';
import { ErrorParser } from '../../../src/utils/ErrorParser';
import { ChromaDBClient } from '../../../src/db/ChromaDBClient';
import { RCACache } from '../../../src/cache/RCACache';
import { NetworkTimeoutHandler } from './NetworkTimeoutHandler';

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
  private _agent?: MultiPassAgent;
  private _parser?: ErrorParser;
  private _client?: OllamaClient;
  private _chromaDB?: ChromaDBClient;
  private _cache?: RCACache;
  private _stateStream?: AgentStateStream;
  private _timeoutHandler: NetworkTimeoutHandler;

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
   * Initialize backend components
   */
  async initialize(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('rcaAgent');
      const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
      const model = config.get<string>('model', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
      const chromaPath = config.get<string>('chromaDbPath', './chroma');

      console.log('[AnalysisService] Initializing with:', { ollamaUrl, model, chromaPath });

      // Initialize Ollama client
      this._client = new OllamaClient({ baseUrl: ollamaUrl, model });

      // Initialize ErrorParser
      this._parser = ErrorParser.getInstance();

      // Initialize ChromaDB client (optional - gracefully handles failure)
      try {
        this._chromaDB = await ChromaDBClient.create({ url: chromaPath });
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

      // Initialize MultiPassAgent with config
      this._agent = new MultiPassAgent(this._client, {
        maxIterations: config.get<number>('maxIterations', 5),
        numHypotheses: config.get<number>('numHypotheses', 3),
        enableConsensus: config.get<boolean>('enableConsensus', false)
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
  async checkModelAvailable(modelName: string): Promise<boolean> {
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
   * Analyze an error
   */
  async analyzeError(
    error: ErrorItem,
    onProgress: ProgressCallback,
    cancellationToken?: vscode.CancellationToken
  ): Promise<RCAResult> {
    console.log('[AnalysisService] Starting analysis for:', error.id);

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

    try {
      // Check Ollama connection first
      const connection = await this.checkOllamaConnection();
      if (!connection.available) {
        throw new Error(`Ollama server unavailable: ${connection.error}`);
      }

      // Parse error text - if error already has structured data, use it
      let parsed = this._parser!.parse(error.message, error.filePath);

      // If parsing fails but we have structured error data from ErrorItem, construct ParsedError
      if (!parsed && error.message && error.filePath && error.line) {
        console.log('[AnalysisService] Parser failed, using structured ErrorItem data');

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
          line: error.line,
          language: this._detectLanguage(error.filePath),
          column: error.column,
          stackTrace: stackFrames,
          metadata: error.metadata
        };
      }

      if (!parsed) {
        throw new Error(`Failed to parse error message: ${error.message.substring(0, 100)}`);
      }

      // Set up AgentStateStream event listeners for real-time progress
      let currentIteration = 0;
      const maxIterations = this._agent!['maxIterations'] || 5;
      const startTime = Date.now();

      this._stateStream!.on('iteration', (event) => {
        currentIteration = event.iteration;
        onProgress({
          iteration: event.iteration,
          maxIterations: event.maxIterations,
          progress: event.progress * 100,
          currentThought: '',
          recentActions: [],
          recentObservations: [],
          elapsed: Date.now() - startTime,
          isActive: true
        });
      });

      this._stateStream!.on('thought', (event) => {
        onProgress({
          iteration: currentIteration,
          maxIterations,
          progress: (currentIteration / maxIterations) * 100,
          currentThought: event.thought,
          recentActions: [],
          recentObservations: [],
          elapsed: Date.now() - startTime,
          isActive: true
        });
      });

      this._stateStream!.on('action', (event) => {
        onProgress({
          iteration: currentIteration,
          maxIterations,
          progress: (currentIteration / maxIterations) * 100,
          currentThought: `Executing tool: ${event.action.tool}`,
          recentActions: [],
          recentObservations: [],
          elapsed: Date.now() - startTime,
          isActive: true
        });
      });

      this._stateStream!.on('observation', (event) => {
        onProgress({
          iteration: currentIteration,
          maxIterations,
          progress: (currentIteration / maxIterations) * 100,
          currentThought: `Received: ${event.observation.substring(0, 50)}...`,
          recentActions: [],
          recentObservations: [],
          elapsed: Date.now() - startTime,
          isActive: true
        });
      });

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

      // Run MultiPassAgent analysis with timeout protection
      const analysisResult = await this._timeoutHandler.executeWithTimeout(
        `analysis-${error.id}`,
        async () => {
          return await Promise.race([
            this._agent!.analyze(parsed) as Promise<any>,
            cancelPromise
          ]);
        },
        30000, // 30s timeout
        3      // 3 retries
      );

      if (analysisResult.timedOut) {
        throw new Error('Analysis timed out after 30 seconds');
      }

      if (!analysisResult.success) {
        throw analysisResult.error || new Error('Analysis failed');
      }

      const result = analysisResult.data!;

      // Search for similar errors in ChromaDB
      const similarErrors = await this._searchSimilarErrors(parsed);

      // Return backend result directly (types are compatible)
      console.log('[AnalysisService] Analysis complete:', result);
      return result;

    } catch (error) {
      console.error('[AnalysisService] Analysis failed:', error);
      throw error;
    } finally {
      // Clean up event listeners
      this._stateStream!.removeAllListeners();

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
}
