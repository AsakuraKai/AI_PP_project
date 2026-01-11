/**
 * ErrorQueueManager - Manages the error detection and queue
 * 
 * Responsibilities:
 * - Detect errors from VS Code diagnostics
 * - Manage error queue
 * - Provide error filtering and sorting
 * - Emit events for error changes
 */

import * as vscode from 'vscode';
import { ErrorItem } from '../types';
import { StateManager } from './StateManager';

/**
 * Error Queue Manager - Singleton
 * Manages error detection and queue operations
 */
export class ErrorQueueManager {
  private static _instance: ErrorQueueManager;
  private _stateManager: StateManager;
  private _diagnosticSubscription?: vscode.Disposable;

  // Event emitter for queue changes (alias for compatibility)
  private _onQueueChange = new vscode.EventEmitter<ErrorItem[]>();
  readonly onQueueChange = this._onQueueChange.event;
  readonly onErrorQueueChange = this._onQueueChange.event; // Alias

  private constructor(context: vscode.ExtensionContext) {
    this._stateManager = StateManager.getInstance(context);

    // Forward state manager events
    this._stateManager.onErrorQueueChange(queue => {
      this._onQueueChange.fire(queue);
    });

    // Subscribe to VS Code diagnostics for automatic error detection
    this._diagnosticSubscription = vscode.languages.onDidChangeDiagnostics(
      this._handleDiagnosticChanges.bind(this)
    );

    // Perform initial scan of existing diagnostics
    this._performInitialScan();
  }

  /**
   * Perform initial scan of existing diagnostics
   */
  private _performInitialScan(): void {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    const autoDetect = config.get<boolean>('autoDetectErrors', true);

    if (!autoDetect) {
      return;
    }

    // Get all existing diagnostics
    const allDiagnostics = vscode.languages.getDiagnostics();
    console.log(`[ErrorQueueManager] Initial scan found ${allDiagnostics.length} diagnostic sources`);

    for (const [uri, diagnostics] of allDiagnostics) {
      const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
      if (errors.length > 0) {
        this._processDiagnostics(uri);
      }
    }

    console.log(`[ErrorQueueManager] Initial scan complete, ${this.getErrorCount()} errors in queue`);
  }

  static getInstance(context: vscode.ExtensionContext): ErrorQueueManager {
    if (!ErrorQueueManager._instance) {
      ErrorQueueManager._instance = new ErrorQueueManager(context);
    }
    return ErrorQueueManager._instance;
  }

  /**
   * Handle diagnostic changes from VS Code
   */
  private _handleDiagnosticChanges(event: vscode.DiagnosticChangeEvent): void {
    // Only process if auto-detection is enabled
    const config = vscode.workspace.getConfiguration('rcaAgent');
    const autoDetect = config.get<boolean>('autoDetectErrors', true);

    if (!autoDetect) {
      return;
    }

    for (const uri of event.uris) {
      this._processDiagnostics(uri);
    }
  }

  /**
   * Process diagnostics for a file
   */
  private _processDiagnostics(uri: vscode.Uri): void {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

    for (const diagnostic of errors) {
      const errorItem: ErrorItem = {
        id: this._generateId(uri, diagnostic),
        timestamp: Date.now(),
        message: diagnostic.message,
        type: this._inferErrorType(diagnostic),
        filePath: uri.fsPath,
        line: diagnostic.range.start.line + 1, // Convert to 1-indexed
        column: diagnostic.range.start.character,
        severity: 'error',
        status: 'pending',
        stackTrace: [],
        metadata: {
          source: diagnostic.source,
          code: diagnostic.code
        }
      };

      this.addError(errorItem);
    }
  }

  /**
   * Generate unique ID for error
   */
  private _generateId(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    const hash = `${uri.fsPath}-${diagnostic.range.start.line}-${diagnostic.message}`;
    return Buffer.from(hash).toString('base64').slice(0, 16);
  }

  /**
   * Infer error type from diagnostic
   */
  private _inferErrorType(diagnostic: vscode.Diagnostic): ErrorItem['type'] {
    const message = diagnostic.message.toLowerCase();
    const source = diagnostic.source?.toLowerCase() || '';

    if (source.includes('typescript') || source.includes('eslint')) {
      return 'lint';
    }
    if (message.includes('syntax')) {
      return 'syntax';
    }
    if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
      return 'warning';
    }

    return 'runtime';
  }

  // ===== Queue Operations =====

  /**
   * Get all errors in queue
   */
  getQueue(): ErrorItem[] {
    return this._stateManager.getErrorQueue();
  }

  /**
   * Get all errors (alias for compatibility)
   */
  getAllErrors(): ErrorItem[] {
    return this.getQueue();
  }

  /**
   * Get errors (alias)
   */
  getErrors(): ErrorItem[] {
    return this.getQueue();
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.getQueue().length;
  }

  /**
   * Add error to queue
   */
  async addError(error: ErrorItem): Promise<void> {
    await this._stateManager.addError(error);
  }

  /**
   * Remove error from queue
   */
  async removeError(id: string): Promise<void> {
    await this._stateManager.removeError(id);
  }

  /**
   * Update error status
   */
  async updateStatus(id: string, status: ErrorItem['status']): Promise<void> {
    await this._stateManager.updateErrorStatus(id, status);
  }

  /**
   * Clear all errors
   */
  async clearQueue(): Promise<void> {
    await this._stateManager.clearErrorQueue();
  }

  /**
   * Clear completed errors
   */
  async clearCompleted(): Promise<void> {
    const queue = this.getQueue();
    const completed = queue.filter(e => e.status === 'complete' || e.status === 'failed');

    for (const error of completed) {
      await this.removeError(error.id);
    }
  }

  // ===== Filtering and Sorting =====

  /**
   * Get errors by status
   */
  getErrorsByStatus(status: ErrorItem['status']): ErrorItem[] {
    return this._stateManager.getErrorsByStatus(status);
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: ErrorItem['type']): ErrorItem[] {
    return this.getQueue().filter(e => e.type === type);
  }

  /**
   * Get errors by file
   */
  getErrorsByFile(filePath: string): ErrorItem[] {
    return this.getQueue().filter(e => e.filePath === filePath);
  }

  /**
   * Search errors
   */
  searchErrors(query: string): ErrorItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getQueue().filter(error =>
      error.message.toLowerCase().includes(lowerQuery) ||
      error.filePath.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Sort errors
   */
  sortErrors(
    sortBy: 'timestamp' | 'file' | 'type' | 'severity',
    order: 'asc' | 'desc' = 'desc'
  ): ErrorItem[] {
    const errors = [...this.getQueue()];

    errors.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'file':
          comparison = a.filePath.localeCompare(b.filePath);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'severity':
          const severityOrder = { error: 0, warning: 1, info: 2 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return errors;
  }

  // ===== Pinning =====

  /**
   * Pin an error (mark as important)
   */
  async pinError(id: string): Promise<void> {
    const error = this.getQueue().find(e => e.id === id);
    if (error) {
      error.metadata = { ...error.metadata, pinned: true };
      await this._stateManager.updateError(id, error);
    }
  }

  /**
   * Unpin an error
   */
  async unpinError(id: string): Promise<void> {
    const error = this.getQueue().find(e => e.id === id);
    if (error) {
      error.metadata = { ...error.metadata, pinned: false };
      await this._stateManager.updateError(id, error);
    }
  }

  /**
   * Get pinned errors
   */
  getPinnedErrors(): ErrorItem[] {
    return this.getQueue().filter(e => e.metadata?.pinned === true);
  }

  // ===== Manual Detection =====

  /**
   * Manually scan workspace for errors
   */
  async detectErrors(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    // Get all diagnostics
    const allDiagnostics = vscode.languages.getDiagnostics();

    for (const [uri, diagnostics] of allDiagnostics) {
      this._processDiagnostics(uri);
    }

    vscode.window.showInformationMessage(
      `Detected ${this.getErrorCount()} errors in workspace`
    );
  }

  /**
   * Open error location in editor
   */
  async openErrorLocation(errorId: string): Promise<void> {
    const error = this.getQueue().find(e => e.id === errorId);
    if (!error) {
      return;
    }

    try {
      const document = await vscode.workspace.openTextDocument(error.filePath);
      const editor = await vscode.window.showTextDocument(document);

      // Move cursor to error location
      const position = new vscode.Position(error.line - 1, error.column || 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    } catch (err) {
      vscode.window.showErrorMessage(`Could not open file: ${error.filePath}`);
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this._diagnosticSubscription?.dispose();
    this._onQueueChange.dispose();
  }
}
