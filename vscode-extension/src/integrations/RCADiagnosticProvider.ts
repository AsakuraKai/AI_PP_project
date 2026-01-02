/**
 * Diagnostic Provider for RCA Agent
 * Enhances error detection and links diagnostics to error queue
 * CHUNK 9-10 Consolidation: Uses BaseProvider
 * 
 * Features:
 * - Monitors workspace diagnostics
 * - Filters relevant errors for RCA analysis
 * - Links diagnostics to error queue
 * - Auto-detection of new errors
 */

import * as vscode from 'vscode';
import { BaseProvider } from './BaseProvider';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';

export class RCADiagnosticProvider extends BaseProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private autoDetectEnabled: boolean = true;

  constructor(errorQueueManager: ErrorQueueManager) {
    super({ errorQueueManager });
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('rca-agent');
    this.disposables.push(this.diagnosticCollection);
    
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
      // Use base provider's error checking
      if (this.isErrorOrWarning(diagnostic)) {
        // Check if this error is already in the queue
        const existingError = this.findErrorInQueue(uri, diagnostic);
        if (!existingError) {
          this.addDiagnosticToQueue(uri, diagnostic);
        }
      }
    }
  }

  /**
   * Add diagnostic to error queue
   */
  private addDiagnosticToQueue(uri: vscode.Uri, diagnostic: vscode.Diagnostic): void {
    const errorItem = this.createErrorItem(uri, diagnostic);
    this.errorQueueManager?.addError(errorItem);
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
  // mapSeverity is now provided by BaseProvider

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

  // dispose() is now provided by BaseProvider
}
