/**
 * StateManager - Singleton for managing RCA Agent panel state
 * Chunk 1: Foundation & Activity Bar
 */

import * as vscode from 'vscode';
import { ErrorItem, HistoryItem, PanelState, PanelSettings } from './types';

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
  
  // Event emitters for state changes
  private _onErrorQueueChange = new vscode.EventEmitter<ErrorItem[]>();
  private _onHistoryChange = new vscode.EventEmitter<HistoryItem[]>();
  private _onStateChange = new vscode.EventEmitter<PanelState>();
  
  // Public event subscriptions
  readonly onErrorQueueChange = this._onErrorQueueChange.event;
  readonly onHistoryChange = this._onHistoryChange.event;
  readonly onStateChange = this._onStateChange.event;
  
  private constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._loadState();
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
      console.log(`[StateManager] Loaded state: ${this._errorQueue.length} errors, ${this._history.length} history items`);
    } catch (error) {
      console.error('[StateManager] Failed to load state:', error);
      this._errorQueue = [];
      this._history = [];
    }
  }
  
  /**
   * Save state to persistent storage
   */
  private async _saveState(): Promise<void> {
    try {
      await this._context.globalState.update('errorQueue', this._errorQueue);
      await this._context.globalState.update('history', this._history);
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
    await this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
    this._onHistoryChange.fire(this._history);
    this._onStateChange.fire(this.getState());
    console.log('[StateManager] State reset');
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this._onErrorQueueChange.dispose();
    this._onHistoryChange.dispose();
    this._onStateChange.dispose();
    StateManager._instance = undefined;
  }
}
