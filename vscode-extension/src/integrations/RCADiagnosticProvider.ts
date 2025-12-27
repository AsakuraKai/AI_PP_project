/**
 * Diagnostic Provider for RCA Agent
 * Enhances error detection and links diagnostics to error queue
 * 
 * Features:
 * - Monitors workspace diagnostics
 * - Filters relevant errors for RCA analysis
 * - Links diagnostics to error queue
 * - Auto-detection of new errors
 */

import * as vscode from 'vscode';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';
import { ErrorItem } from '../panel/types';

export class RCADiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];
  private errorQueueManager: ErrorQueueManager;
  private autoDetectEnabled: boolean = true;

  constructor(errorQueueManager: ErrorQueueManager) {
    this.errorQueueManager = errorQueueManager;
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('rca-agent');
    
    // Monitor diagnostics from all sources
    this.setupDiagnosticListener();
  }

  /**
   * Set up listener for diagnostic changes across the workspace
   */
  private setupDiagnosticListener(): void {
    // Listen to diagnostic changes
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics((event) => {
        if (this.autoDetectEnabled) {
          this.handleDiagnosticChange(event);
        }
      })
    );
  }

  /**
   * Handle diagnostic change events
   */
  private handleDiagnosticChange(event: vscode.DiagnosticChangeEvent): void {
    for (const uri of event.uris) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      this.processDiagnostics(uri, diagnostics);
    }
  }

  /**
   * Process diagnostics and add relevant ones to error queue
   */
  private processDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
    for (const diagnostic of diagnostics) {
      // Only process errors and warnings
      if (
        diagnostic.severity === vscode.DiagnosticSeverity.Error ||
        diagnostic.severity === vscode.DiagnosticSeverity.Warning
      ) {
        // Check if this error is already in the queue
        const existingError = this.findErrorInQueue(uri, diagnostic);
        if (!existingError) {
          this.addDiagnosticToQueue(uri, diagnostic);
        }
      }
    }
  }

  /**
   * Find if an error already exists in the queue
   */
  private findErrorInQueue(uri: vscode.Uri, diagnostic: vscode.Diagnostic): ErrorItem | undefined {
    const allErrors = this.errorQueueManager.getAllErrors();
    return allErrors.find(error => 
      error.filePath === uri.fsPath &&
      error.line === diagnostic.range.start.line &&
      error.message === diagnostic.message
    );
  }

  /**
   * Add diagnostic to error queue
   */
  private addDiagnosticToQueue(uri: vscode.Uri, diagnostic: vscode.Diagnostic): void {
    const errorItem: ErrorItem = {
      id: this.generateErrorId(uri, diagnostic),
      message: diagnostic.message,
      filePath: uri.fsPath,
      line: diagnostic.range.start.line,
      column: diagnostic.range.start.character,
      severity: this.mapSeverity(diagnostic.severity),
      status: 'pending',
      timestamp: Date.now()
    };

    this.errorQueueManager.addError(errorItem);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    const content = `${uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.message}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `error_${Math.abs(hash)}_${Date.now()}`;
  }

  /**
   * Map VS Code diagnostic severity to RCA severity
   */
  private mapSeverity(severity: vscode.DiagnosticSeverity | undefined): 'critical' | 'high' | 'medium' {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return 'critical';
      case vscode.DiagnosticSeverity.Warning:
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Enable or disable auto-detection
   */
  public setAutoDetect(enabled: boolean): void {
    this.autoDetectEnabled = enabled;
    
    // If enabled, trigger immediate scan
    if (enabled) {
      this.scanWorkspace();
    }
  }

  /**
   * Get current auto-detect status
   */
  public isAutoDetectEnabled(): boolean {
    return this.autoDetectEnabled;
  }

  /**
   * Manually scan workspace for errors
   */
  public async scanWorkspace(): Promise<void> {
    // Get all diagnostics
    const allDiagnostics = vscode.languages.getDiagnostics();
    
    for (const [uri, diagnostics] of allDiagnostics) {
      this.processDiagnostics(uri, diagnostics);
    }
  }

  /**
   * Create custom diagnostic for RCA-specific issues
   */
  public createCustomDiagnostic(
    uri: vscode.Uri,
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity
  ): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = 'RCA Agent';
    
    // Add diagnostic to collection
    const existingDiagnostics = this.diagnosticCollection.get(uri) || [];
    this.diagnosticCollection.set(uri, [...existingDiagnostics, diagnostic]);
    
    return diagnostic;
  }

  /**
   * Clear all custom diagnostics
   */
  public clearCustomDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Clear diagnostics for specific file
   */
  public clearDiagnosticsForFile(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
