/**
 * StateManager - Singleton for managing RCA Agent panel state
 * Chunk 1: Foundation & Activity Bar
 */

import * as vscode from 'vscode';
import { ErrorItem, HistoryItem, PanelState, PanelSettings } from './types';

/**
 * Learning metrics for display
 */
export interface LearningMetrics {
  totalAnalyses: number;
  successfulAnalyses: number;
  averageConfidence: number;
  averageLatency: number; // ms
  topErrorTypes: Array<{ type: string; count: number }>;
  improvementTrend: number; // -1 to 1 (negative = worse, positive = better)
  cacheHitRate: number; // 0-1
  lastUpdated: number; // timestamp
}

/**
 * Manages global state for the RCA Agent panel
 * Implements singleton pattern to ensure single source of truth
 */
export class StateManager {
  private static _instance: StateManager | undefined;
  private _context: vscode.ExtensionContext;
  
  // State storage
  private _errorQueue: ErrorItem[] = [];
  private _history: HistoryItem[] = [];
  private _currentError: ErrorItem | undefined;
  
  // Learning metrics storage
  private _learningMetrics: LearningMetrics | undefined;
  
  // Event emitters for state changes
  private _onErrorQueueChange = new vscode.EventEmitter<ErrorItem[]>();
  private _onHistoryChange = new vscode.EventEmitter<HistoryItem[]>();
  private _onStateChange = new vscode.EventEmitter<PanelState>();
  private _onMetricsChange = new vscode.EventEmitter<LearningMetrics>();
  
  // Public event subscriptions
  readonly onErrorQueueChange = this._onErrorQueueChange.event;
  readonly onHistoryChange = this._onHistoryChange.event;
  readonly onStateChange = this._onStateChange.event;
  readonly onMetricsChange = this._onMetricsChange.event;
  
  private constructor(context: vscode.ExtensionContext) {
    this._context = context;
    // Ensure context.globalState is available before loading
    if (!context.globalState) {
      console.error('[StateManager] Context globalState not available!');
      this._errorQueue = [];
      this._history = [];
      this._learningMetrics = undefined;
    } else {
      this._loadState();
    }
  }
  
  /**
   * Get or create the singleton instance
   */
  static getInstance(context: vscode.ExtensionContext): StateManager {
    if (!StateManager._instance) {
      StateManager._instance = new StateManager(context);
    }
    return StateManager._instance;
  }
  
  /**
   * Load state from persistent storage
   */
  private _loadState(): void {
    try {
      this._errorQueue = this._context.globalState.get<ErrorItem[]>('errorQueue', []);
      this._history = this._context.globalState.get<HistoryItem[]>('history', []);
      this._learningMetrics = this._context.globalState.get<LearningMetrics>('learningMetrics');
      console.log(`[StateManager] Loaded state: ${this._errorQueue.length} errors, ${this._history.length} history items`);
      
      // Compute metrics if not available
      if (!this._learningMetrics) {
        this._computeMetrics();
      }
    } catch (error) {
      console.error('[StateManager] Failed to load state:', error);
      this._errorQueue = [];
      this._history = [];
      this._learningMetrics = undefined;
    }
  }
  
  /**
   * Save state to persistent storage
   */
  private async _saveState(): Promise<void> {
    try {
      await this._context.globalState.update('errorQueue', this._errorQueue);
      await this._context.globalState.update('history', this._history);
      await this._context.globalState.update('learningMetrics', this._learningMetrics);
      console.log(`[StateManager] Saved state: ${this._errorQueue.length} errors, ${this._history.length} history items`);
    } catch (error) {
      console.error('[StateManager] Failed to save state:', error);
    }
  }
  
  /**
   * Get the current panel state
   */
  getState(): PanelState {
    return {
      view: this._currentError ? 'active' : (this._errorQueue.length > 0 ? 'empty' : 'empty'),
      currentError: this._currentError,
      errorQueue: this._errorQueue,
      history: this._history.slice(0, 50) // Limit to 50 most recent
    };
  }

  /**
   * Set panel state (partial update)
   */
  setState(partialState: Partial<PanelState>): void {
    // Update current error if provided
    if (partialState.currentError !== undefined) {
      this._currentError = partialState.currentError;
    }
    
    // Fire state change event with merged state
    const newState = { ...this.getState(), ...partialState };
    this._onStateChange.fire(newState);
    console.log(`[StateManager] State updated:`, partialState);
  }

  /**
   * Update state with progress information
   */
  updateProgress(progress: Partial<PanelState>): void {
    this.setState(progress);
  }

  /**
   * Update state with result information
   */
  updateResult(result: Partial<PanelState>): void {
    this.setState(result);
  }
  
  /**
   * Get all errors in the queue
   */
  getErrorQueue(): ErrorItem[] {
    return [...this._errorQueue];
  }
  
  /**
   * Get all history items
   */
  getHistory(): HistoryItem[] {
    return [...this._history];
  }
  
  /**
   * Add an error to the queue
   */
  async addError(error: ErrorItem): Promise<void> {
    // Check for duplicates
    const existingIndex = this._errorQueue.findIndex(
      e => e.filePath === error.filePath && e.line === error.line && e.message === error.message
    );
    
    if (existingIndex >= 0) {
      // Update existing error
      this._errorQueue[existingIndex] = error;
      console.log(`[StateManager] Updated existing error: ${error.id}`);
    } else {
      // Add new error
      this._errorQueue.push(error);
      console.log(`[StateManager] Added new error: ${error.id}`);
    }
    
    await this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
    this._onStateChange.fire(this.getState());
  }
  
  /**
   * Remove an error from the queue
   */
  async removeError(id: string): Promise<void> {
    const oldLength = this._errorQueue.length;
    this._errorQueue = this._errorQueue.filter(e => e.id !== id);
    
    if (this._errorQueue.length < oldLength) {
      console.log(`[StateManager] Removed error: ${id}`);
      await this._saveState();
      this._onErrorQueueChange.fire(this._errorQueue);
      this._onStateChange.fire(this.getState());
    }
  }
  
  /**
   * Update an error's status
   */
  async updateErrorStatus(id: string, status: ErrorItem['status']): Promise<void> {
    const error = this._errorQueue.find(e => e.id === id);
    if (error) {
      error.status = status;
      console.log(`[StateManager] Updated error ${id} status to ${status}`);
      await this._saveState();
      this._onErrorQueueChange.fire(this._errorQueue);
      this._onStateChange.fire(this.getState());
    }
  }

  /**
   * Update an error in the queue
   */
  async updateError(id: string, updates: Partial<ErrorItem>): Promise<void> {
    const error = this._errorQueue.find(e => e.id === id);
    if (error) {
      Object.assign(error, updates);
      console.log(`[StateManager] Updated error ${id}:`, updates);
      await this._saveState();
      this._onErrorQueueChange.fire(this._errorQueue);
      this._onStateChange.fire(this.getState());
    }
  }
  
  /**
   * Clear all errors from the queue
   */
  async clearErrorQueue(): Promise<void> {
    this._errorQueue = [];
    console.log('[StateManager] Cleared error queue');
    await this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
    this._onStateChange.fire(this.getState());
  }
  
  /**
   * Set the currently analyzing error
   */
  setCurrentError(error: ErrorItem | undefined): void {
    this._currentError = error;
    console.log(`[StateManager] Set current error: ${error?.id || 'none'}`);
    this._onStateChange.fire(this.getState());
  }
  
  /**
   * Add an item to the history
   */
  async addHistoryItem(item: HistoryItem): Promise<void> {
    // Add to beginning of history
    this._history.unshift(item);
    
    // Keep only last 100 items
    if (this._history.length > 100) {
      this._history = this._history.slice(0, 100);
    }
    
    console.log(`[StateManager] Added history item: ${item.id}`);
    await this._saveState();
    this._onHistoryChange.fire(this._history);
    this._onStateChange.fire(this.getState());
  }
  
  /**
   * Remove an item from the history
   */
  async removeHistoryItem(id: string): Promise<void> {
    const oldLength = this._history.length;
    this._history = this._history.filter(h => h.id !== id);
    
    if (this._history.length < oldLength) {
      console.log(`[StateManager] Removed history item: ${id}`);
      await this._saveState();
      this._onHistoryChange.fire(this._history);
      this._onStateChange.fire(this.getState());
    }
  }
  
  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    this._history = [];
    console.log('[StateManager] Cleared history');
    await this._saveState();
    this._onHistoryChange.fire(this._history);
    this._onStateChange.fire(this.getState());
  }
  
  /**
   * Get a history item by ID
   */
  getHistoryItem(id: string): HistoryItem | undefined {
    return this._history.find(h => h.id === id);
  }
  
  /**
   * Update history item feedback
   */
  async updateHistoryItemFeedback(id: string, helpful: boolean, feedback?: string): Promise<void> {
    const item = this._history.find(h => h.id === id);
    if (item) {
      item.helpful = helpful;
      if (feedback) {
        item.feedback = feedback;
      }
      console.log(`[StateManager] Updated history item ${id} feedback: ${helpful}`);
      await this._saveState();
      this._onHistoryChange.fire(this._history);
    }
  }
  
  /**
   * Get an error by ID
   */
  getError(id: string): ErrorItem | undefined {
    return this._errorQueue.find(e => e.id === id);
  }
  
  /**
   * Get settings from VS Code configuration
   */
  getSettings(): PanelSettings {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    
    return {
      educationalMode: config.get<boolean>('educationalMode', false),
      showPerformanceMetrics: config.get<boolean>('showPerformanceMetrics', false),
      showConfidenceBars: true, // Default to true
      syntaxHighlighting: true, // Default to true
      autoDetectErrors: false, // Implement in Chunk 3
      autoSaveResults: true, // Default to true
      desktopNotifications: false, // Implement later
      keepPanelOpen: true, // Default to true
      maxIterations: 3,
      analysisMode: 'standard',
      modelName: config.get<string>('model', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest'),
      ollamaUrl: config.get<string>('ollamaUrl', 'http://localhost:11434'),
      timeoutSeconds: 120
    };
  }
  
  /**
   * Reset all state (for testing/debugging)
   */
  async reset(): Promise<void> {
    this._errorQueue = [];
    this._history = [];
    this._currentError = undefined;
    this._learningMetrics = undefined;
    await this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
    this._onHistoryChange.fire(this._history);
    this._onStateChange.fire(this.getState());
    this._onMetricsChange.fire(this._getDefaultMetrics());
    console.log('[StateManager] State reset');
  }
  
  /**
   * Get learning metrics
   */
  getLearningMetrics(): LearningMetrics {
    if (!this._learningMetrics) {
      this._computeMetrics();
    }
    return this._learningMetrics!;
  }
  
  /**
   * Refresh learning metrics from history
   */
  async refreshMetrics(): Promise<void> {
    this._computeMetrics();
    await this._saveState();
    if (this._learningMetrics) {
      this._onMetricsChange.fire(this._learningMetrics);
    }
  }
  
  /**
   * Compute learning metrics from history
   */
  private _computeMetrics(): void {
    const history = this._history.slice(0, 100); // Last 100 analyses
    
    if (history.length === 0) {
      this._learningMetrics = this._getDefaultMetrics();
      return;
    }
    
    // Total analyses
    const totalAnalyses = history.length;
    
    // Successful analyses (confidence > 70%)
    const successfulAnalyses = history.filter(h => (h.confidence || 0) > 70).length;
    
    // Average confidence
    const confidences = history.map(h => h.confidence || 0);
    const averageConfidence = confidences.reduce((a, b) => a + b, 0) / totalAnalyses;
    
    // Average latency (if available)
    const latencies = history
      .map(h => h.latency || 0)
      .filter(l => l > 0);
    const averageLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    
    // Top error types
    const errorTypeCounts: { [key: string]: number } = {};
    history.forEach(h => {
      const type = h.errorType || 'Unknown';
      errorTypeCounts[type] = (errorTypeCounts[type] || 0) + 1;
    });
    
    const topErrorTypes = Object.entries(errorTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Improvement trend (compare first 50% to last 50%)
    const halfPoint = Math.floor(totalAnalyses / 2);
    const firstHalf = history.slice(halfPoint);
    const secondHalf = history.slice(0, halfPoint);
    
    const firstAvg = firstHalf.reduce((sum, h) => sum + (h.confidence || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, h) => sum + (h.confidence || 0), 0) / secondHalf.length;
    const improvementTrend = (secondAvg - firstAvg) / 100; // Normalize to -1 to 1
    
    // Cache hit rate (if fromCache field exists)
    const cacheHits = history.filter(h => (h as any).fromCache === true).length;
    const cacheHitRate = totalAnalyses > 0 ? cacheHits / totalAnalyses : 0;
    
    this._learningMetrics = {
      totalAnalyses,
      successfulAnalyses,
      averageConfidence,
      averageLatency,
      topErrorTypes,
      improvementTrend,
      cacheHitRate,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Get default metrics
   */
  private _getDefaultMetrics(): LearningMetrics {
    return {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      averageConfidence: 0,
      averageLatency: 0,
      topErrorTypes: [],
      improvementTrend: 0,
      cacheHitRate: 0,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this._onErrorQueueChange.dispose();
    this._onHistoryChange.dispose();
    this._onStateChange.dispose();
    this._onMetricsChange.dispose();
    StateManager._instance = undefined;
  }
}
