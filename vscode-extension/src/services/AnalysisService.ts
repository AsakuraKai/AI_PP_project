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
import { ErrorItem, AnalysisProgress } from '../panel/types';
import { RCAResult as ExtensionRCAResult } from '../panel/types';
import { RCAResult as BackendRCAResult } from '../../../src/types';
import { MultiPassAgent } from '../../../src/agent/MultiPassAgent';
import { AgentStateStream } from '../../../src/agent/AgentStateStream';
import { OllamaClient } from '../../../src/llm/OllamaClient';
import { ErrorParser } from '../../../src/utils/ErrorParser';
import { ChromaDBClient } from '../../../src/db/ChromaDBClient';

/**
 * Progress callback for analysis updates
 */
export type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * Type alias for RCA results (using extension's type)
 */
type RCAResult = ExtensionRCAResult;

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
  private _stateStream?: AgentStateStream;
  
  private constructor() {
    // Singleton
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
      const model = config.get<string>('model', 'deepseek-r1');
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
      
      const isHealthy = await this._client!.isHealthy();
      return { available: isHealthy };
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
    
    // Create cancellation token if not provided
    const cancelTokenSource = new vscode.CancellationTokenSource();
    const token = cancellationToken || cancelTokenSource.token;
    
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
      
      // Parse error text
      const parsed = this._parser!.parse(error.message, error.filePath);
      
      if (!parsed) {
        throw new Error('Failed to parse error message');
      }
      
      // Set up AgentStateStream event listeners for real-time progress
      let currentIteration = 0;
      const maxIterations = this._agent!['maxIterations'] || 5;
      
      this._stateStream!.on('iteration', (event) => {
        currentIteration = event.iteration;
        onProgress({
          iteration: event.iteration,
          maxIterations: event.maxIterations,
          progress: event.progress * 100,
          currentThought: ''
        });
      });
      
      this._stateStream!.on('thought', (event) => {
        onProgress({
          iteration: currentIteration,
          maxIterations,
          progress: (currentIteration / maxIterations) * 100,
          currentThought: event.thought
        });
      });
      
      this._stateStream!.on('action', (event) => {
        onProgress({
          iteration: currentIteration,
          maxIterations,
          progress: (currentIteration / maxIterations) * 100,
          currentThought: `Executing tool: ${event.action.tool}`
        });
      });
      
      this._stateStream!.on('observation', (event) => {
        onProgress({
          iteration: currentIteration,
          maxIterations,
          progress: (currentIteration / maxIterations) * 100,
          currentThought: `Received: ${event.observation.substring(0, 50)}...`
        });
      });
      
      // Handle cancellation
      const cancelHandler = () => {
        if (token.isCancellationRequested) {
          this.stopAnalysis();
          throw new Error('Analysis cancelled');
        }
      };
      token.onCancellationRequested(cancelHandler);
      
      // Run MultiPassAgent analysis
      const result = await this._agent!.analyze(parsed);
      
      // Search for similar errors in ChromaDB
      const similarErrors = await this._searchSimilarErrors(parsed);
      
      // Return backend result directly (types are compatible)
      console.log('[AnalysisService] Analysis complete:', result);
      return result as any as ExtensionRCAResult;
      
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
