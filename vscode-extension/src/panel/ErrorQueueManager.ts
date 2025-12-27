/**
 * ErrorQueueManager
 * 
 * Manages the queue of errors detected in the workspace.
 * Provides auto-detection, priority sorting, and CRUD operations.
 * 
 * Features:
 * - Auto-detect errors from VS Code diagnostics
 * - Priority sorting (critical → high → medium)
 * - CRUD operations (add, remove, update, clear)
 * - Event emitter for queue changes
 */

import * as vscode from 'vscode';
import { ErrorItem } from './types';

export class ErrorQueueManager {
  private static _instance: ErrorQueueManager;
  private _queue: ErrorItem[] = [];
  private _disposables: vscode.Disposable[] = [];
  
  private _onQueueChange = new vscode.EventEmitter<ErrorItem[]>();
  readonly onQueueChange = this._onQueueChange.event;
  
  private _autoDetectEnabled = true;
  private _diagnosticListener?: vscode.Disposable;

  private constructor(private readonly context: vscode.ExtensionContext) {
    this._loadQueue();
    this._setupDiagnosticListener();
  }

  static getInstance(context: vscode.ExtensionContext): ErrorQueueManager {
    if (!ErrorQueueManager._instance) {
      ErrorQueueManager._instance = new ErrorQueueManager(context);
    }
    return ErrorQueueManager._instance;
  }

  /**
   * Load queue from persistent storage
   */
  private _loadQueue(): void {
    const stored = this.context.globalState.get<ErrorItem[]>('errorQueue', []);
    this._queue = stored;
  }

  /**
   * Save queue to persistent storage
   */
  private async _saveQueue(): Promise<void> {
    await this.context.globalState.update('errorQueue', this._queue);
    this._onQueueChange.fire(this._queue);
  }

  /**
   * Setup diagnostic listener for auto-detection
   */
  private _setupDiagnosticListener(): void {
    if (!this._autoDetectEnabled) return;

    // Listen to diagnostic changes
    this._diagnosticListener = vscode.languages.onDidChangeDiagnostics(
      (event) => this._handleDiagnosticChange(event)
    );
    
    this._disposables.push(this._diagnosticListener);
    
    // Initial scan
    this._scanWorkspaceDiagnostics();
  }

  /**
   * Handle diagnostic change events
   */
  private _handleDiagnosticChange(event: vscode.DiagnosticChangeEvent): void {
    if (!this._autoDetectEnabled) return;

    for (const uri of event.uris) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      this._processDiagnostics(uri, diagnostics);
    }
  }

  /**
   * Scan all workspace diagnostics
   */
  private _scanWorkspaceDiagnostics(): void {
    const allDiagnostics = vscode.languages.getDiagnostics();
    
    for (const [uri, diagnostics] of allDiagnostics) {
      this._processDiagnostics(uri, diagnostics);
    }
  }

  /**
   * Process diagnostics and add to queue
   */
  private _processDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
    // Filter for errors only (not warnings or info)
    const errors = diagnostics.filter(
      (d) => d.severity === vscode.DiagnosticSeverity.Error
    );

    for (const diagnostic of errors) {
      const errorId = this._generateErrorId(uri, diagnostic);
      
      // Skip if already in queue
      if (this._queue.some(e => e.id === errorId)) {
        continue;
      }

      const errorItem: ErrorItem = {
        id: errorId,
        message: diagnostic.message,
        filePath: uri.fsPath,
        line: diagnostic.range.start.line + 1, // Convert to 1-based
        column: diagnostic.range.start.character + 1,
        severity: this._mapSeverity(diagnostic),
        status: 'pending',
        timestamp: Date.now(),
        source: diagnostic.source
      };

      this._queue.push(errorItem);
    }

    this._sortQueue();
    this._saveQueue();
  }

  /**
   * Generate unique error ID
   */
  private _generateErrorId(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    const path = uri.fsPath;
    const line = diagnostic.range.start.line;
    const message = diagnostic.message.substring(0, 50);
    return `${path}:${line}:${message}`.replace(/\s/g, '_');
  }

  /**
   * Map diagnostic severity to error severity
   */
  private _mapSeverity(diagnostic: vscode.Diagnostic): 'critical' | 'high' | 'medium' {
    // Check for critical keywords
    const criticalKeywords = [
      'nullpointerexception',
      'crash',
      'fatal',
      'segmentation fault',
      'cannot find symbol',
      'undefined reference'
    ];

    const highKeywords = [
      'error',
      'exception',
      'failed',
      'missing'
    ];

    const messageLower = diagnostic.message.toLowerCase();

    if (criticalKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'critical';
    }

    if (highKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Sort queue by priority (critical → high → medium)
   */
  private _sortQueue(): void {
    const severityOrder = { critical: 0, high: 1, medium: 2 };
    
    this._queue.sort((a, b) => {
      // First by severity
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Then by timestamp (newer first)
      return b.timestamp - a.timestamp;
    });
  }

  /**
   * Get all errors in queue
   */
  getQueue(): ErrorItem[] {
    return [...this._queue];
  }

  /**
   * Get error by ID
   */
  getError(id: string): ErrorItem | undefined {
    return this._queue.find(e => e.id === id);
  }

  /**
   * Add error to queue
   */
  async addError(error: ErrorItem): Promise<void> {
    // Check for duplicates
    if (this._queue.some(e => e.id === error.id)) {
      return;
    }

    this._queue.push(error);
    this._sortQueue();
    await this._saveQueue();
  }

  /**
   * Remove error from queue
   */
  async removeError(id: string): Promise<void> {
    const index = this._queue.findIndex(e => e.id === id);
    if (index !== -1) {
      this._queue.splice(index, 1);
      await this._saveQueue();
    }
  }

  /**
   * Update error status
   */
  async updateErrorStatus(
    id: string, 
    status: 'pending' | 'analyzing' | 'complete' | 'failed'
  ): Promise<void> {
    const error = this._queue.find(e => e.id === id);
    if (error) {
      error.status = status;
      await this._saveQueue();
    }
  }

  /**
   * Clear all errors
   */
  async clearQueue(): Promise<void> {
    this._queue = [];
    await this._saveQueue();
  }

  /**
   * Clear completed errors
   */
  async clearCompleted(): Promise<void> {
    this._queue = this._queue.filter(e => e.status !== 'complete');
    await this._saveQueue();
  }

  /**
   * Get pending errors (not analyzed yet)
   */
  getPendingErrors(): ErrorItem[] {
    return this._queue.filter(e => e.status === 'pending');
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'critical' | 'high' | 'medium'): ErrorItem[] {
    return this._queue.filter(e => e.severity === severity);
  }

  /**
   * Get error count by status
   */
  getCountByStatus(): { 
    pending: number; 
    analyzing: number; 
    complete: number; 
    failed: number;
  } {
    return {
      pending: this._queue.filter(e => e.status === 'pending').length,
      analyzing: this._queue.filter(e => e.status === 'analyzing').length,
      complete: this._queue.filter(e => e.status === 'complete').length,
      failed: this._queue.filter(e => e.status === 'failed').length
    };
  }

  /**
   * Enable/disable auto-detection
   */
  setAutoDetect(enabled: boolean): void {
    if (enabled === this._autoDetectEnabled) return;
    
    this._autoDetectEnabled = enabled;
    
    if (enabled) {
      this._setupDiagnosticListener();
    } else {
      this._diagnosticListener?.dispose();
      this._diagnosticListener = undefined;
    }
  }

  /**
   * Pin error to top of queue
   */
  async pinError(id: string): Promise<void> {
    const error = this._queue.find(e => e.id === id);
    if (!error) return;

    // Remove from current position
    this._queue = this._queue.filter(e => e.id !== id);
    
    // Add pinned flag
    (error as any).pinned = true;
    
    // Add to top
    this._queue.unshift(error);
    
    await this._saveQueue();
  }

  /**
   * Unpin error
   */
  async unpinError(id: string): Promise<void> {
    const error = this._queue.find(e => e.id === id);
    if (!error) return;

    // Remove pinned flag
    delete (error as any).pinned;
    
    // Re-sort queue
    this._sortQueue();
    
    await this._saveQueue();
  }

  /**
   * Refresh queue from diagnostics
   */
  async refresh(): Promise<void> {
    this._scanWorkspaceDiagnostics();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this._disposables.forEach(d => d.dispose());
    this._onQueueChange.dispose();
  }
}
