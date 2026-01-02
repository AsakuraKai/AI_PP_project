/**
 * TreeViewCommands
 * 
 * Commands for interacting with error queue and history tree views.
 * Handles context menu actions, navigation, and item manipulation.
 * 
 * OPTIMIZED: Now extends BaseCommandHandler to reduce duplication
 */

import * as vscode from 'vscode';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';
import { StateManager } from '../panel/StateManager';
import { ErrorItem, HistoryItem } from '../panel/types';
import { BaseCommandHandler, CommandDefinition } from './BaseCommandHandler';

export class TreeViewCommands extends BaseCommandHandler {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly queueManager: ErrorQueueManager,
    private readonly stateManager: StateManager
  ) {
    super();
  }

  /**
   * Register all tree view commands using base class infrastructure
   */
  registerCommands(): vscode.Disposable[] {
    const commands: CommandDefinition[] = [
      // Error queue commands
      { id: 'rca-agent.refreshErrorQueue', handler: 'refreshErrorQueue', title: 'Refresh Error Queue' },
      { id: 'rca-agent.clearErrorQueue', handler: 'clearErrorQueue', title: 'Clear Error Queue' },
      { id: 'rca-agent.clearCompleted', handler: 'clearCompleted', title: 'Clear Completed' },
      { id: 'rca-agent.removeError', handler: 'removeError', title: 'Remove Error' },
      { id: 'rca-agent.pinError', handler: 'pinError', title: 'Pin Error' },
      { id: 'rca-agent.unpinError', handler: 'unpinError', title: 'Unpin Error' },
      { id: 'rca-agent.openErrorLocation', handler: 'openErrorLocation', title: 'Open Error Location' },
      
      // History commands
      { id: 'rca-agent.refreshHistory', handler: 'refreshHistory', title: 'Refresh History' },
      { id: 'rca-agent.clearHistory', handler: 'clearHistory', title: 'Clear History' },
      { id: 'rca-agent.deleteHistoryItem', handler: 'deleteHistoryItem', title: 'Delete History Item' },
      { id: 'rca-agent.reanalyzeHistoryItem', handler: 'reanalyzeHistoryItem', title: 'Reanalyze History Item' },
      { id: 'rca-agent.exportHistoryItem', handler: 'exportHistoryItem', title: 'Export History Item' },
      { id: 'rca-agent.viewHistoryItem', handler: 'viewHistoryItem', title: 'View History Item' },
      { id: 'rca-agent.markHelpful', handler: 'markHelpful', title: 'Mark Helpful' },
      { id: 'rca-agent.markUnhelpful', handler: 'markUnhelpful', title: 'Mark Unhelpful' }
    ];

    return super.registerCommands(this.context, commands);
  }

  // ============================================================================
  // Error Queue Commands
  // ============================================================================

  /**
   * Refresh error queue from diagnostics
   */
  async refreshErrorQueue(): Promise<void> {
    await this.queueManager.refresh();
    this.showInfo('Error queue refreshed.');
  }

  /**
   * Clear all errors from queue
   */
  async clearErrorQueue(): Promise<void> {
    const confirmed = await this.confirm('Clear all errors from queue?');
    
    if (confirmed) {
      await this.queueManager.clearQueue();
      this.showInfo('Error queue cleared.');
    }
  }

  /**
   * Clear completed errors from queue
   */
  async clearCompleted(): Promise<void> {
    await this.queueManager.clearCompleted();
    this.showInfo('Completed errors cleared.');
  }

  /**
   * Remove specific error from queue
   */
  async removeError(item: any): Promise<void> {
    const error = item?.errorData as ErrorItem;
    if (!error) return;

    await this.queueManager.removeError(error.id);
    this.showInfo('Error removed from queue.');
  }

  /**
   * Pin error to top of queue
   */
  async pinError(item: any): Promise<void> {
    const error = item?.errorData as ErrorItem;
    if (!error) return;

    await this.queueManager.pinError(error.id);
    this.showInfo(`Error pinned: ${error.message.substring(0, 50)}...`);
  }

  /**
   * Unpin error from top of queue
   */
  async unpinError(item: any): Promise<void> {
    const error = item?.errorData as ErrorItem;
    if (!error) return;

    await this.queueManager.unpinError(error.id);
    this.showInfo(`Error unpinned: ${error.message.substring(0, 50)}...`);
  }
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
    const confirmed = await this.confirm('Clear all analysis history?');
    
    if (confirmed) {
      await this.stateManager.clearHistory();
      this.showInfo('History cleared.');
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
