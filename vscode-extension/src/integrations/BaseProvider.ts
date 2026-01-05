/**
 * Base Provider Class
 * Consolidates common provider patterns from CHUNK 10
 * 
 * Provides:
 * - Document validation
 * - Diagnostic management
 * - Error queue integration
 * - Caching support
 * - Disposal management
 */

import * as vscode from 'vscode';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';
import { ErrorItem } from '../panel/types';

export interface ProviderConfig {
  errorQueueManager?: ErrorQueueManager;
  relevantLanguages?: string[];
  relevantExtensions?: string[];
  cacheTTL?: number;
}

/**
 * Base class for all VS Code providers
 * Eliminates duplicate validation and caching logic
 */
export abstract class BaseProvider implements vscode.Disposable {
  protected disposables: vscode.Disposable[] = [];
  protected errorQueueManager?: ErrorQueueManager;
  protected relevantLanguages: string[];
  protected relevantExtensions: string[];
  protected cache: Map<string, CachedItem<any>> = new Map();
  protected cacheTTL: number;

  constructor(config: ProviderConfig = {}) {
    this.errorQueueManager = config.errorQueueManager;
    this.relevantLanguages = config.relevantLanguages || [
      'kotlin', 'java', 'groovy', 'xml', 'gradle'
    ];
    this.relevantExtensions = config.relevantExtensions || [
      '.kt', '.java', '.gradle', '.gradle.kts', '.xml'
    ];
    this.cacheTTL = config.cacheTTL || 60000; // 1 minute default
  }

  /**
   * Check if document is relevant for RCA analysis
   */
  protected isRelevantDocument(document: vscode.TextDocument): boolean {
    const hasRelevantLanguage = this.relevantLanguages.includes(document.languageId);
    const hasRelevantExtension = this.relevantExtensions.some(ext => 
      document.uri.fsPath.endsWith(ext)
    );

    return (hasRelevantLanguage || hasRelevantExtension) && !document.isUntitled;
  }

  /**
   * Find diagnostic at the given position
   */
  protected findDiagnosticAtPosition(
    diagnostics: vscode.Diagnostic[],
    position: vscode.Position
  ): vscode.Diagnostic | undefined {
    return diagnostics.find(diagnostic => 
      diagnostic.range.contains(position)
    );
  }

  /**
   * Check if diagnostic is an error or warning
   */
  protected isErrorOrWarning(diagnostic: vscode.Diagnostic): boolean {
    return (
      diagnostic.severity === vscode.DiagnosticSeverity.Error ||
      diagnostic.severity === vscode.DiagnosticSeverity.Warning
    );
  }

  /**
   * Generate unique error ID
   */
  protected generateErrorId(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    return `${uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.message}`;
  }

  /**
   * Map VS Code severity to error item severity
   */
  protected mapSeverity(severity: vscode.DiagnosticSeverity): 'critical' | 'high' | 'medium' {
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
   * Get severity icon
   */
  protected getSeverityIcon(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return '[ERR]';
      case vscode.DiagnosticSeverity.Warning:
        return '[WARN]';
      case vscode.DiagnosticSeverity.Information:
        return '[INFO]';
      default:
        return '[TIP]';
    }
  }

  /**
   * Cache management with TTL
   */
  protected getCached<T>(key: string): T | undefined {
    const cached = this.cache.get(key) as CachedItem<T> | undefined;
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return undefined;
  }

  protected setCached<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  protected clearCache(): void {
    this.cache.clear();
  }

  /**
   * Find error in queue
   */
  protected findErrorInQueue(
    uri: vscode.Uri,
    diagnostic: vscode.Diagnostic
  ): ErrorItem | undefined {
    if (!this.errorQueueManager) return undefined;
    
    const allErrors = this.errorQueueManager.getAllErrors();
    return allErrors.find(error => 
      error.filePath === uri.fsPath &&
      error.line === diagnostic.range.start.line &&
      error.message === diagnostic.message
    );
  }

  /**
   * Create error item from diagnostic
   */
  protected createErrorItem(uri: vscode.Uri, diagnostic: vscode.Diagnostic): ErrorItem {
    return {
      id: this.generateErrorId(uri, diagnostic),
      message: diagnostic.message,
      filePath: uri.fsPath,
      line: diagnostic.range.start.line,
      column: diagnostic.range.start.character,
      severity: this.mapSeverity(diagnostic.severity),
      status: 'pending',
      timestamp: Date.now()
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.clearCache();
  }
}

interface CachedItem<T> {
  data: T;
  timestamp: number;
}
