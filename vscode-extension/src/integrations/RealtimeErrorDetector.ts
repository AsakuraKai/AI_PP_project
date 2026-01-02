/**
 * Real-Time Error Detector for RCA Agent
 * Monitors file changes and detects errors as user types
 * CHUNK 9-10 Consolidation: Uses BaseProvider
 * 
 * Features:
 * - Debounced file change detection (500ms)
 * - Quick syntax validation
 * - Proactive error detection
 * - Smart error prioritization
 * - Integration with error queue
 */

import * as vscode from 'vscode';
import { BaseProvider } from './BaseProvider';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';

export class RealtimeErrorDetector extends BaseProvider {
  private detectionEnabled: boolean = true;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 500; // 500ms
  private readonly MAX_ERRORS_PER_FILE = 10;
  private processedErrors: Set<string> = new Set();

  constructor(errorQueueManager: ErrorQueueManager) {
    super({ errorQueueManager });
    this.setupFileWatchers();
  }

  /**
   * Set up file change watchers
   */
  private setupFileWatchers(): void {
    // Watch for text document changes (as user types)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (this.detectionEnabled && this.isRelevantDocument(event.document)) {
          this.handleDocumentChange(event);
        }
      })
    );

    // Watch for saved documents (more comprehensive check)
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (this.detectionEnabled && this.isRelevantDocument(document)) {
          this.handleDocumentSave(document);
        }
      })
    );

    // Watch for opened documents (scan for existing errors)
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (this.detectionEnabled && this.isRelevantDocument(document)) {
          this.handleDocumentOpen(document);
        }
      })
    );
  }

  // isRelevantDocument is now provided by BaseProvider

  /**
   * Handle document changes with debouncing
   */
  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const uri = event.document.uri.toString();

    // Clear existing timer for this document
    const existingTimer = this.debounceTimers.get(uri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(() => {
      this.detectErrorsInDocument(event.document);
      this.debounceTimers.delete(uri);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(uri, timer);
  }

  /**
   * Handle document save (immediate detection)
   */
  private handleDocumentSave(document: vscode.TextDocument): void {
    // Clear any pending debounce timer
    const uri = document.uri.toString();
    const existingTimer = this.debounceTimers.get(uri);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(uri);
    }

    // Immediate detection on save
    this.detectErrorsInDocument(document);
  }

  /**
   * Handle document open (scan for existing errors)
   */
  private handleDocumentOpen(document: vscode.TextDocument): void {
    // Small delay to let other extensions process first
    setTimeout(() => {
      this.detectErrorsInDocument(document);
    }, 100);
  }

  /**
   * Detect errors in document
   */
  private async detectErrorsInDocument(document: vscode.TextDocument): Promise<void> {
    try {
      // Get diagnostics for this document
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      
      if (diagnostics.length === 0) {
        return;
      }

      // Filter and prioritize errors
      const relevantErrors = this.filterRelevantErrors(diagnostics);
      const prioritizedErrors = this.prioritizeErrors(relevantErrors);

      // Limit number of errors per file
      const limitedErrors = prioritizedErrors.slice(0, this.MAX_ERRORS_PER_FILE);

      // Add to error queue
      for (const diagnostic of limitedErrors) {
        await this.addErrorToQueue(document, diagnostic);
      }

      // Show notification if many errors detected
      if (prioritizedErrors.length > this.MAX_ERRORS_PER_FILE) {
        vscode.window.showInformationMessage(
          `RCA Agent: Detected ${prioritizedErrors.length} errors in ${document.fileName}. Showing top ${this.MAX_ERRORS_PER_FILE}.`,
          'View All'
        ).then(selection => {
          if (selection === 'View All') {
            vscode.commands.executeCommand('rca-agent.mainPanel.focus');
          }
        });
      }
    } catch (error) {
      console.error('Error detecting errors in document:', error);
    }
  }

  /**
   * Filter relevant errors (errors and warnings)
   */
  private filterRelevantErrors(diagnostics: vscode.Diagnostic[]): vscode.Diagnostic[] {
    return diagnostics.filter(diagnostic =>
      diagnostic.severity === vscode.DiagnosticSeverity.Error ||
      diagnostic.severity === vscode.DiagnosticSeverity.Warning
    );
  }

  /**
   * Prioritize errors by severity and impact
   */
  private prioritizeErrors(diagnostics: vscode.Diagnostic[]): vscode.Diagnostic[] {
    return diagnostics.sort((a, b) => {
      // Sort by severity first (errors before warnings)
      if (a.severity !== b.severity) {
        return a.severity - b.severity;
      }

      // Then by position (earlier in file first)
      if (a.range.start.line !== b.range.start.line) {
        return a.range.start.line - b.range.start.line;
      }

      return a.range.start.character - b.range.start.character;
    });
  }

  /**
   * Add error to queue if not already present
   */
  private async addErrorToQueue(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): Promise<void> {
    const errorKey = this.generateErrorKey(document.uri, diagnostic);

    // Check if already processed
    if (this.processedErrors.has(errorKey)) {
      return;
    }

    // Check if already in queue
    const existingError = this.errorQueueManager.getAllErrors().find(error =>
      error.filePath === document.uri.fsPath &&
      error.line === diagnostic.range.start.line &&
      error.message === diagnostic.message
    );

    if (existingError) {
      return;
    }

    // Create error item
    const errorItem: ErrorItem = {
      id: this.generateErrorId(document.uri, diagnostic),
      message: diagnostic.message,
      filePath: document.uri.fsPath,
      line: diagnostic.range.start.line,
      column: diagnostic.range.start.character,
      severity: this.mapSeverity(diagnostic.severity),
      status: 'pending',
      timestamp: Date.now(),
      source: diagnostic.source || 'real-time-detection'
    };

    // Add to queue
    this.errorQueueManager.addError(errorItem);

    // Mark as processed
    this.processedErrors.add(errorKey);

    // Clean up processed errors set if too large
    if (this.processedErrors.size > 1000) {
      const toDelete = Array.from(this.processedErrors).slice(0, 500);
      toDelete.forEach(key => this.processedErrors.delete(key));
    }
  }

  /**
   * Generate unique error key
   */
  private generateErrorKey(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    return `${uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.range.start.character}:${diagnostic.message}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(`${uri.fsPath}:${diagnostic.message}:${timestamp}`);
    return `rtd-${hash}`;
  }

  /**
   * Simple hash function for IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Map VS Code severity to RCA severity
   */
  private mapSeverity(severity: vscode.DiagnosticSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return 'error';
      case vscode.DiagnosticSeverity.Warning:
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Enable/disable real-time detection
   */
  public setEnabled(enabled: boolean): void {
    this.detectionEnabled = enabled;
    
    if (!enabled) {
      // Clear all pending timers
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();
    }
  }

  /**
   * Check if detection is enabled
   */
  public isEnabled(): boolean {
    return this.detectionEnabled;
  }

  /**
   * Clear processed errors cache
   */
  public clearProcessedCache(): void {
    this.processedErrors.clear();
  }

  /**
   * Manually trigger detection on active document
   */
  public async detectInActiveDocument(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor && this.isRelevantDocument(editor.document)) {
      await this.detectErrorsInDocument(editor.document);
    }
  }

  /**
   * Get statistics
   */
  public getStatistics(): RealtimeDetectionStats {
    return {
      enabled: this.detectionEnabled,
      processedErrorsCount: this.processedErrors.size,
      pendingDetections: this.debounceTimers.size
    };
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Clear processed errors
    this.processedErrors.clear();

    // Dispose event listeners
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
  }
}

/**
 * Statistics for real-time detection
 */
export interface RealtimeDetectionStats {
  enabled: boolean;
  processedErrorsCount: number;
  pendingDetections: number;
}
