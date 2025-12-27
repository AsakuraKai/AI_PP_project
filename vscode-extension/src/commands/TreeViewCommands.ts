/**
 * TreeViewCommands
 * 
 * Commands for interacting with error queue and history tree views.
 * Handles context menu actions, navigation, and item manipulation.
 */

import * as vscode from 'vscode';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';
import { StateManager } from '../panel/StateManager';
import { ErrorItem, HistoryItem } from '../panel/types';

export class TreeViewCommands {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly queueManager: ErrorQueueManager,
    private readonly stateManager: StateManager
  ) {}

  /**
   * Register all tree view commands
   */
  registerCommands(): vscode.Disposable[] {
    return [
      // Error queue commands
      vscode.commands.registerCommand('rca-agent.refreshErrorQueue', () => this.refreshErrorQueue()),
      vscode.commands.registerCommand('rca-agent.clearErrorQueue', () => this.clearErrorQueue()),
      vscode.commands.registerCommand('rca-agent.clearCompleted', () => this.clearCompleted()),
      vscode.commands.registerCommand('rca-agent.removeError', (item) => this.removeError(item)),
      vscode.commands.registerCommand('rca-agent.pinError', (item) => this.pinError(item)),
      vscode.commands.registerCommand('rca-agent.unpinError', (item) => this.unpinError(item)),
      vscode.commands.registerCommand('rca-agent.openErrorLocation', (error) => this.openErrorLocation(error)),
      
      // History commands
      vscode.commands.registerCommand('rca-agent.refreshHistory', () => this.refreshHistory()),
      vscode.commands.registerCommand('rca-agent.clearHistory', () => this.clearHistory()),
      vscode.commands.registerCommand('rca-agent.deleteHistoryItem', (item) => this.deleteHistoryItem(item)),
      vscode.commands.registerCommand('rca-agent.reanalyzeHistoryItem', (item) => this.reanalyzeHistoryItem(item)),
      vscode.commands.registerCommand('rca-agent.exportHistoryItem', (item) => this.exportHistoryItem(item)),
      vscode.commands.registerCommand('rca-agent.viewHistoryItem', (item) => this.viewHistoryItem(item)),
      vscode.commands.registerCommand('rca-agent.markHelpful', (item) => this.markHelpful(item, true)),
      vscode.commands.registerCommand('rca-agent.markUnhelpful', (item) => this.markUnhelpful(item, false))
    ];
  }

  // ============================================================================
  // Error Queue Commands
  // ============================================================================

  /**
   * Refresh error queue from diagnostics
   */
  async refreshErrorQueue(): Promise<void> {
    await this.queueManager.refresh();
    vscode.window.showInformationMessage('Error queue refreshed.');
  }

  /**
   * Clear all errors from queue
   */
  async clearErrorQueue(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      'Clear all errors from queue?',
      { modal: true },
      'Clear'
    );

    if (result === 'Clear') {
      await this.queueManager.clearQueue();
      vscode.window.showInformationMessage('Error queue cleared.');
    }
  }

  /**
   * Clear completed errors from queue
   */
  async clearCompleted(): Promise<void> {
    await this.queueManager.clearCompleted();
    vscode.window.showInformationMessage('Completed errors cleared.');
  }

  /**
   * Remove specific error from queue
   */
  async removeError(item: any): Promise<void> {
    const error = item?.errorData as ErrorItem;
    if (!error) return;

    await this.queueManager.removeError(error.id);
    vscode.window.showInformationMessage('Error removed from queue.');
  }

  /**
   * Pin error to top of queue
   */
  async pinError(item: any): Promise<void> {
    const error = item?.errorData as ErrorItem;
    if (!error) return;

    await this.queueManager.pinError(error.id);
    vscode.window.showInformationMessage('Error pinned to top.');
  }

  /**
   * Unpin error
   */
  async unpinError(item: any): Promise<void> {
    const error = item?.errorData as ErrorItem;
    if (!error) return;

    await this.queueManager.unpinError(error.id);
    vscode.window.showInformationMessage('Error unpinned.');
  }

  /**
   * Open error location in editor
   */
  async openErrorLocation(error: ErrorItem): Promise<void> {
    try {
      const uri = vscode.Uri.file(error.filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      // Move cursor to error line
      const position = new vscode.Position(error.line - 1, error.column ? error.column - 1 : 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to open file: ${(err as Error).message}`);
    }
  }

  // ============================================================================
  // History Commands
  // ============================================================================

  /**
   * Refresh history view
   */
  refreshHistory(): void {
    // History auto-refreshes via state manager events
    vscode.window.showInformationMessage('History refreshed.');
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      'Clear all analysis history?',
      { modal: true },
      'Clear'
    );

    if (result === 'Clear') {
      await this.stateManager.clearHistory();
      vscode.window.showInformationMessage('History cleared.');
    }
  }

  /**
   * Delete specific history item
   */
  async deleteHistoryItem(item: any): Promise<void> {
    const history = item?.historyData as HistoryItem;
    if (!history) return;

    await this.stateManager.removeHistoryItem(history.id);
    vscode.window.showInformationMessage('History item deleted.');
  }

  /**
   * Reanalyze from history item
   */
  async reanalyzeHistoryItem(item: any): Promise<void> {
    const history = item?.historyData as HistoryItem;
    if (!history) return;

    // Find original error
    const error = this.queueManager.getError(history.errorId);
    
    if (error) {
      // Trigger analysis command
      await vscode.commands.executeCommand('rca-agent.analyzeError', error);
    } else {
      vscode.window.showWarningMessage('Original error not found in queue.');
    }
  }

  /**
   * Export history item to file
   */
  async exportHistoryItem(item: any): Promise<void> {
    const history = item?.historyData as HistoryItem;
    if (!history) return;

    const content = this._formatHistoryExport(history);
    
    // Show save dialog
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`rca-analysis-${Date.now()}.md`),
      filters: {
        'Markdown': ['md'],
        'Text': ['txt'],
        'All Files': ['*']
      }
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
      vscode.window.showInformationMessage('Analysis exported successfully.');
    }
  }

  /**
   * View history item details
   */
  async viewHistoryItem(item: HistoryItem): Promise<void> {
    // Open in panel or create a new document
    const content = this._formatHistoryView(item);
    
    const doc = await vscode.workspace.openTextDocument({
      content,
      language: 'markdown'
    });
    
    await vscode.window.showTextDocument(doc);
  }

  /**
   * Mark history item as helpful
   */
  async markHelpful(item: any, helpful: boolean): Promise<void> {
    const history = item?.historyData as HistoryItem;
    if (!history) return;

    await this.stateManager.updateHistoryItemFeedback(history.id, helpful);
    vscode.window.showInformationMessage(
      helpful ? 'Marked as helpful' : 'Marked as unhelpful'
    );
  }

  /**
   * Mark history item as unhelpful
   */
  async markUnhelpful(item: any, helpful: boolean): Promise<void> {
    await this.markHelpful(item, helpful);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Format history item for export
   */
  private _formatHistoryExport(item: HistoryItem): string {
    const date = new Date(item.timestamp).toLocaleString();
    
    return `# RCA Agent Analysis Report
    
**Date:** ${date}
**Duration:** ${(item.duration / 1000).toFixed(2)}s
**Confidence:** ${item.result.confidence}%
**Iterations:** ${item.result.iterations}

---

## Root Cause

${item.result.rootCause}

---

## Code Context

\`\`\`
${item.result.codeContext || 'N/A'}
\`\`\`

---

## Fix Guidelines

${item.result.fixGuidelines.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

---

## Tools Used

${item.result.toolsUsed.join(', ')}

${item.result.educationalExplanation ? `---\n\n## Educational Explanation\n\n${item.result.educationalExplanation}` : ''}

${item.result.performanceMetrics ? `---\n\n## Performance Metrics\n\n- Total Time: ${item.result.performanceMetrics.totalTime}ms\n- LLM Calls: ${item.result.performanceMetrics.llmCalls}\n- Tool Calls: ${item.result.performanceMetrics.toolCalls}` : ''}
`;
  }

  /**
   * Format history item for viewing
   */
  private _formatHistoryView(item: HistoryItem): string {
    return this._formatHistoryExport(item);
  }
}
