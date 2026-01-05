/**
 * Hover Provider for RCA Agent
 * Shows inline error explanations when hovering over errors
 * CHUNK 9-10 Consolidation: Uses BaseProvider
 * 
 * Features:
 * - Shows brief error explanation on hover
 * - Links to full RCA analysis
 * - Displays confidence and suggested actions
 * - Integrates with diagnostic provider
 */

import * as vscode from 'vscode';
import { BaseProvider } from './BaseProvider';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';
import { AnalysisService } from '../services/AnalysisService';

interface CachedAnalysis {
  result: QuickAnalysisResult;
  timestamp: number;
}

interface QuickAnalysisResult {
  message: string;
  confidence?: number;
  fixes?: string[];
}

export class RCAHoverProvider extends BaseProvider implements vscode.HoverProvider {
  private analysisService: AnalysisService | null;
  private analysisCache: Map<string, CachedAnalysis> = new Map();

  constructor(
    errorQueueManager: ErrorQueueManager,
    analysisService: AnalysisService | null
  ) {
    super({ errorQueueManager, cacheTTL: 60000 }); // 1 minute cache
    this.analysisService = analysisService;
  }

  /**
   * Provide hover information for errors in the document
   */
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    // Get diagnostics at this position
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    const relevantDiagnostic = this.findDiagnosticAtPosition(diagnostics, position);

    if (!relevantDiagnostic || !this.isErrorOrWarning(relevantDiagnostic)) {
      return undefined;
    }

    // Generate hover content
    const hoverContent = await this.generateHoverContent(
      document,
      relevantDiagnostic,
      token
    );

    if (!hoverContent) {
      return undefined;
    }

    return new vscode.Hover(hoverContent, relevantDiagnostic.range);
  }

  // findDiagnosticAtPosition is now provided by BaseProvider

  /**
   * Generate hover content for a diagnostic
   */
  private async generateHoverContent(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    token: vscode.CancellationToken
  ): Promise<vscode.MarkdownString[] | undefined> {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Add diagnostic source and severity
    const severityIcon = this.getSeverityIcon(diagnostic.severity);
    markdown.appendMarkdown(`### ${severityIcon} ${diagnostic.source || 'Error'}\n\n`);

    // Add the error message
    markdown.appendMarkdown(`**Message:** ${diagnostic.message}\n\n`);

    // Try to get quick analysis
    const quickAnalysis = await this.getQuickAnalysis(document, diagnostic, token);
    
    if (quickAnalysis) {
      markdown.appendMarkdown(`---\n\n`);
      markdown.appendMarkdown(`**Quick Analysis**\n\n`);
      markdown.appendMarkdown(`${quickAnalysis.summary}\n\n`);
      
      if (quickAnalysis.confidence) {
        markdown.appendMarkdown(`**Confidence:** ${this.formatConfidence(quickAnalysis.confidence)}\n\n`);
      }

      if (quickAnalysis.suggestedAction) {
        markdown.appendMarkdown(`**Suggested Fix:** ${quickAnalysis.suggestedAction}\n\n`);
      }
    }

    // Add links to actions
    markdown.appendMarkdown(`---\n\n`);
    
    const analyzeCommand = this.createCommandUri(
      'rca-agent.analyzeFromDiagnostic',
      'Analyze with RCA Agent',
      [document, diagnostic]
    );
    markdown.appendMarkdown(`[$(search) Analyze with RCA Agent](${analyzeCommand})\n\n`);

    const explainCommand = this.createCommandUri(
      'rca-agent.explainError',
      'Explain in Detail',
      [diagnostic.message]
    );
    markdown.appendMarkdown(`[$(book) Explain in Detail](${explainCommand})\n\n`);

    return [markdown];
  }

  /**
   * Get quick analysis for error (cached or lightweight)
   */
  private async getQuickAnalysis(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    token: vscode.CancellationToken
  ): Promise<QuickAnalysisResult | null> {
    const cacheKey = this.generateCacheKey(document.uri, diagnostic);
    
    // Check cache first using BaseProvider's cache
    const cached = this.getCached<QuickAnalysisResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check if error is in queue and already analyzed
    const queuedError = this.errorQueueManager?.getAllErrors().find(error =>
      error.filePath === document.uri.fsPath &&
      error.line === diagnostic.range.start.line &&
      error.message === diagnostic.message
    );

    if (queuedError?.analysisResult) {
      const result: QuickAnalysisResult = {
        message: queuedError.message,
        summary: this.extractSummary(queuedError.analysisResult.explanation),
        confidence: queuedError.analysisResult.confidence,
        suggestedAction: this.extractQuickFix(queuedError.analysisResult.fixGuidelines)
      };
      
      this.setCached(cacheKey, result);
      return result;
    }

    // For now, return null (could add lightweight LLM call here)
    return null;
  }

  /**
   * Extract a brief summary from full explanation
   */
  private extractSummary(explanation: string): string {
    // Take first 2 sentences or first 150 chars
    const sentences = explanation.split(/[.!?]+/);
    if (sentences.length > 0) {
      const summary = sentences.slice(0, 2).join('. ').trim();
      return summary.length > 150 ? summary.substring(0, 147) + '...' : summary + '.';
    }
    return explanation.substring(0, 150) + '...';
  }

  /**
   * Extract quick fix suggestion from fix guidelines
   */
  private extractQuickFix(fixGuidelines?: string[]): string | undefined {
    if (!fixGuidelines || fixGuidelines.length === 0) {
      return undefined;
    }
    return fixGuidelines[0]; // Return first guideline
  }

  // getSeverityIcon is now provided by BaseProvider

  /**
   * Format confidence score
   */
  private formatConfidence(confidence: number): string {
    const percentage = Math.round(confidence * 100);
    const bars = Math.round(confidence * 5);
    const barDisplay = '█'.repeat(bars) + '░'.repeat(5 - bars);
    return `${barDisplay} ${percentage}%`;
  }

  /**
   * Create command URI for markdown link
   */
  private createCommandUri(command: string, title: string, args: any[]): string {
    const argsJson = encodeURIComponent(JSON.stringify(args));
    return `command:${command}?${argsJson}`;
  }

  /**
   * Generate cache key for analysis
   */
  private generateCacheKey(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    return `${uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.message}`;
  }

  /**
   * Cache analysis result
   */
  private cacheAnalysis(key: string, result: QuickAnalysisResult): void {
    this.analysisCache.set(key, {
      result,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (this.analysisCache.size > 100) {
      const oldestKeys = Array.from(this.analysisCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 50)
        .map(entry => entry[0]);
      
      oldestKeys.forEach(key => this.analysisCache.delete(key));
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.clearCache();
  }
}

/**
 * Quick analysis result for hover display
 */
interface QuickAnalysisResult {
  summary: string;
  confidence?: number;
  suggestedAction?: string;
}

