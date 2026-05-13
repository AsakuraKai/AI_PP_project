/**
 * StateManager - Centralized state management for RCA Agent
 * 
 * Manages:
 * - Error queue state
 * - Analysis history
 * - Application settings
 * - UI state persistence
 * 
 * Uses VS Code's globalState for persistence across sessions
 */

import * as vscode from 'vscode';
import { ErrorItem, RCAResult } from '../types';
import { buildErrorItemIdentity } from './errorIdentity';

/**
 * History item for past analyses
 */
export interface HistoryItem {
  id: string;
  timestamp: number;
  error: ErrorItem;
  result: RCAResult;
  duration: number;
}

/**
 * Panel state for UI
 */
export interface PanelState {
  currentError?: ErrorItem;
  analyzing: boolean;
  progress?: number;
  iteration?: number;
  maxIterations?: number;
}

/**
 * State Manager - Singleton
 * Manages application state with persistence
 */
export class StateManager {
  private static _instance: StateManager;
  private _context: vscode.ExtensionContext;
  
  // State
  private _errorQueue: ErrorItem[] = [];
  private _history: HistoryItem[] = [];
  private _currentError?: ErrorItem;
  
  // Event emitters
  private _onErrorQueueChange = new vscode.EventEmitter<ErrorItem[]>();
  readonly onErrorQueueChange = this._onErrorQueueChange.event;
  
  private _onHistoryChange = new vscode.EventEmitter<HistoryItem[]>();
  readonly onHistoryChange = this._onHistoryChange.event;
  
  private _onStateChange = new vscode.EventEmitter<PanelState>();
  readonly onStateChange = this._onStateChange.event;
  
  private constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._loadState();
  }
  
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
    this._errorQueue = this._context.globalState.get('rca.errorQueue', []);
    this._history = this._context.globalState.get('rca.history', []);
    console.log(`[StateManager] Loaded ${this._errorQueue.length} errors, ${this._history.length} history items`);
  }
  
  /**
   * Save state to persistent storage
   */
  private async _saveState(): Promise<void> {
    await this._context.globalState.update('rca.errorQueue', this._errorQueue);
    await this._context.globalState.update('rca.history', this._history);
  }
  
  // ===== Error Queue Methods =====

  /**
   * Get all errors in queue
   */
  getErrorQueue(): ErrorItem[] {
    return [...this._errorQueue];
  }
  
  /**
   * Add error to queue
   */
  async addError(error: ErrorItem): Promise<void> {
    // Check for duplicates by deterministic identity key
    const incomingIdentity = buildErrorItemIdentity(error);
    const exists = this._errorQueue.some(e => buildErrorItemIdentity(e) === incomingIdentity);

    if (!exists) {
      this._errorQueue.push(error);
      await this._saveState();
      console.log(`[StateManager] Added error to queue: ${error.message.substring(0, 50)}... (Total: ${this._errorQueue.length})`);
      this._onErrorQueueChange.fire(this._errorQueue);
      console.log(`[StateManager] Fired onErrorQueueChange event with ${this._errorQueue.length} errors`);
      this._onStateChange.fire(this.getState());
    } else {
      console.log(`[StateManager] Error already exists, skipping: ${error.message.substring(0, 50)}...`);
    }
  }
  
  /**
   * Remove error from queue
   */
  async removeError(id: string): Promise<void> {
    this._errorQueue = this._errorQueue.filter(e => e.id !== id);
    await this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
    this._onStateChange.fire(this.getState());
  }
  
  /**
   * Update error status
   */
  async updateErrorStatus(id: string, status: ErrorItem['status']): Promise<void> {
    const error = this._errorQueue.find(e => e.id === id);
    if (error) {
      error.status = status;
      await this._saveState();
      this._onErrorQueueChange.fire(this._errorQueue);
      this._onStateChange.fire(this.getState());
    }
  }
  
  /**
   * Update error in queue
   */
  async updateError(id: string, updates: Partial<ErrorItem>): Promise<void> {
    const error = this._errorQueue.find(e => e.id === id);
    if (error) {
      Object.assign(error, updates);
      await this._saveState();
      this._onErrorQueueChange.fire(this._errorQueue);
      this._onStateChange.fire(this.getState());
    }
  }
  
  /**
   * Clear all errors
   */
  async clearErrorQueue(): Promise<void> {
    this._errorQueue = [];
    await this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
    this._onStateChange.fire(this.getState());
  }
  
  /**
   * Get errors by status
   */
  getErrorsByStatus(status: ErrorItem['status']): ErrorItem[] {
    return this._errorQueue.filter(e => e.status === status);
  }
  
  // ===== History Methods =====
  
  /**
   * Get analysis history
   */
  getHistory(limit?: number): HistoryItem[] {
    const history = [...this._history];
    return limit ? history.slice(0, limit) : history;
  }
  
  /**
   * Add to history
   */
  async addToHistory(item: HistoryItem): Promise<void> {
    this._history.unshift(item); // Add to beginning
    
    // Keep only last 100 items
    if (this._history.length > 100) {
      this._history = this._history.slice(0, 100);
    }
    
    await this._saveState();
    this._onHistoryChange.fire(this._history);
  }
  
  /**
   * Remove from history
   */
  async removeFromHistory(id: string): Promise<void> {
    this._history = this._history.filter(h => h.id !== id);
    await this._saveState();
    this._onHistoryChange.fire(this._history);
  }
  
  /**
   * Clear history
   */
  async clearHistory(): Promise<void> {
    this._history = [];
    await this._saveState();
    this._onHistoryChange.fire(this._history);
  }
  
  /**
   * Search history
   */
  searchHistory(query: string): HistoryItem[] {
    const lowerQuery = query.toLowerCase();
    return this._history.filter(item =>
      item.error.message.toLowerCase().includes(lowerQuery) ||
      item.error.filePath.toLowerCase().includes(lowerQuery) ||
      item.result.rootCause?.toLowerCase().includes(lowerQuery)
    );
  }
  
  // ===== Panel State Methods =====
  
  /**
   * Get current panel state
   */
  getState(): PanelState {
    return {
      currentError: this._currentError,
      analyzing: false,
      progress: 0
    };
  }
  
  /**
   * Set panel state (partial update)
   */
  setState(partialState: Partial<PanelState>): void {
    if (partialState.currentError !== undefined) {
      this._currentError = partialState.currentError;
    }
    
    const newState = { ...this.getState(), ...partialState };
    this._onStateChange.fire(newState);
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
  updateResult(result: RCAResult): void {
    this.setState({
      analyzing: false,
      progress: 100
    });
  }
  
  // ===== Settings Methods =====
  
  /**
   * Get configuration value
   */
  getConfig<T = any>(key: string, defaultValue?: T): T {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    return config.get<T>(key, defaultValue as T);
  }
  
  /**
   * Set configuration value
   */
  async setConfig(key: string, value: any): Promise<void> {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }
  
  // ===== Utility Methods =====
  
  /**
   * Get statistics
   */
  getStatistics() {
    const pending = this.getErrorsByStatus('pending').length;
    const analyzing = this.getErrorsByStatus('analyzing').length;
    const complete = this.getErrorsByStatus('complete').length;
    const failed = this.getErrorsByStatus('failed').length;
    
    const totalAnalyses = this._history.length;
    const successRate = totalAnalyses > 0 
      ? (complete / (complete + failed)) * 100 
      : 0;
    
    return {
      errorQueue: {
        total: this._errorQueue.length,
        pending,
        analyzing,
        complete,
        failed
      },
      history: {
        total: totalAnalyses,
        successRate: Math.round(successRate)
      }
    };
  }
  
  /**
   * Reset all state
   */
  async reset(): Promise<void> {
    this._errorQueue = [];
    this._history = [];
    this._currentError = undefined;
    await this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
    this._onHistoryChange.fire(this._history);
    this._onStateChange.fire(this.getState());
  }
}
