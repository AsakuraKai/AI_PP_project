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
import { ErrorItem, RCAResult, AnalysisProgress } from '../panel/types';

/**
 * Progress callback for analysis updates
 */
export type ProgressCallback = (progress: AnalysisProgress) => void;

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
  
  // Backend components (will be initialized when backend is wired)
  private _agent?: any; // MinimalReactAgent
  private _parser?: any; // ErrorParser
  private _client?: any; // OllamaClient
  
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
      
      console.log('[AnalysisService] Initializing with:', { ollamaUrl, model });
      
      // TODO: Wire up Kai's backend components
      // const { OllamaClient } = await import('../../../src/llm/OllamaClient');
      // const { MinimalReactAgent } = await import('../../../src/agent/MinimalReactAgent');
      // const { ErrorParser } = await import('../../../src/utils/ErrorParser');
      
      // this._client = new OllamaClient(ollamaUrl, model);
      // this._agent = new MinimalReactAgent(this._client);
      // this._parser = ErrorParser.getInstance();
      
      console.log('[AnalysisService] Initialized successfully (mock mode)');
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
      const config = vscode.workspace.getConfiguration('rcaAgent');
      const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
      
      // TODO: Actually check Ollama connection
      // const response = await fetch(`${ollamaUrl}/api/tags`);
      // return { available: response.ok };
      
      // Mock: return success for now
      return { available: true };
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
      // TODO: Check if model exists in Ollama
      // const config = vscode.workspace.getConfiguration('rcaAgent');
      // const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
      // const response = await fetch(`${ollamaUrl}/api/tags`);
      // const data = await response.json();
      // return data.models?.some((m: any) => m.name === modelName);
      
      // Mock: return true for now
      return true;
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
      
      // Parse error text (if parser is available)
      // const parsed = this._parser ? this._parser.parseError(error.message) : null;
      
      // Mock: Simulate analysis with progress updates
      const maxIterations = 3;
      for (let i = 1; i <= maxIterations; i++) {
        if (token.isCancellationRequested) {
          throw new Error('Analysis cancelled');
        }
        
        // Update progress
        onProgress({
          iteration: i,
          maxIterations,
          progress: (i / maxIterations) * 100,
          currentThought: this._getThoughtForIteration(i),
          toolsUsed: this._getToolsForIteration(i),
          elapsed: Date.now() - this._currentAnalysis.startTime
        });
        
        // Simulate work
        await this._delay(2000);
      }
      
      // TODO: Actually run analysis with Kai's agent
      // const result = await this._agent.analyze(parsed);
      
      // Mock result
      const result: RCAResult = {
        error: error.message,
        errorType: error.severity,
        filePath: error.filePath,
        line: error.line,
        rootCause: 'This is a mock root cause analysis. The actual analysis will be performed by Kai\'s MinimalReactAgent.',
        fixGuidelines: [
          '1. Use safe call operator\n   println(user?.name)',
          '2. Use Elvis operator with default\n   val name = user?.name ?: "Unknown"\n   println(name)',
          '3. Check for null explicitly\n   if (user != null) {\n     println(user.name)\n   }'
        ],
        confidence: 85,
        codeSnippet: `40: fun displayUser(id: Int) {\n41:   val user = getUserById(id)\n42: → println(user.name) // 🔥 CRASH HERE\n43:   println(user.email)\n44: }`,
        toolsUsed: ['ReadFileTool', 'KotlinParser', 'ChromaDBTool'],
        iterations: maxIterations,
        language: 'kotlin',
        qualityScore: 0.85,
        latency: Date.now() - this._currentAnalysis.startTime,
        modelName: 'deepseek-r1',
        fromCache: false
      };
      
      console.log('[AnalysisService] Analysis complete:', result);
      return result;
      
    } catch (error) {
      console.error('[AnalysisService] Analysis failed:', error);
      throw error;
    } finally {
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
   * Mock: Get thought for iteration
   */
  private _getThoughtForIteration(iteration: number): string {
    const thoughts = [
      'Analyzing error pattern...',
      'Searching knowledge base...',
      'Generating fix guidelines...'
    ];
    return thoughts[iteration - 1] || 'Processing...';
  }
  
  /**
   * Mock: Get tools for iteration
   */
  private _getToolsForIteration(iteration: number): string[] {
    const tools = [
      ['ReadFileTool'],
      ['ReadFileTool', 'KotlinParser'],
      ['ReadFileTool', 'KotlinParser', 'ChromaDBTool']
    ];
    return tools[iteration - 1] || [];
  }
  
  /**
   * Utility: Delay
   */
  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
