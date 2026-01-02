/**
 * BatchAnalysisCommands
 * 
 * Commands for batch analysis of multiple errors.
 * Provides sequential processing with queue management, progress tracking,
 * and cancel/pause functionality.
 * 
 * OPTIMIZED: Now extends BaseCommandHandler to reduce duplication
 */

import * as vscode from 'vscode';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';
import { AnalysisService } from '../services/AnalysisService';
import { StateManager } from '../panel/StateManager';
import { ErrorItem, HistoryItem } from '../panel/types';
import { BaseCommandHandler, CommandDefinition } from './BaseCommandHandler';

export class BatchAnalysisCommands extends BaseCommandHandler {
  private _isAnalyzing = false;
  private _shouldCancel = false;
  private _currentProgress: vscode.Progress<{ message?: string; increment?: number }> | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly queueManager: ErrorQueueManager,
    private readonly analysisService: AnalysisService,
    private readonly stateManager: StateManager
  ) {
    super();
  }

  /**
   * Register all batch analysis commands using base class infrastructure
   */
  registerCommands(): vscode.Disposable[] {
    const commands: CommandDefinition[] = [
      { id: 'rca-agent.analyzeAll', handler: 'analyzeAll', title: 'Analyze All' },
      { id: 'rca-agent.analyzePending', handler: 'analyzePending', title: 'Analyze Pending' },
      { id: 'rca-agent.cancelBatch', handler: 'cancelBatch', title: 'Cancel Batch' },
      { id: 'rca-agent.analyzeSelected', handler: 'analyzeSelected', title: 'Analyze Selected' }
    ];

    return super.registerCommands(this.context, commands);
  }

  /**
   * Analyze all errors in queue
   */
  async analyzeAll(): Promise<void> {
    const errors = this.queueManager.getQueue();
    
    if (errors.length === 0) {
      this.showInfo('No errors in queue to analyze.');
      return;
    }

    await this._runBatchAnalysis(errors);
  }

  /**
   * Analyze only pending errors
   */
  async analyzePending(): Promise<void> {
    const errors = this.queueManager.getPendingErrors();
    
    if (errors.length === 0) {
      this.showInfo('No pending errors to analyze.');
      return;
    }

    await this._runBatchAnalysis(errors);
  }

  /**
   * Analyze selected errors
   */
  async analyzeSelected(errors: ErrorItem[]): Promise<void> {
    if (!errors || errors.length === 0) {
      this.showInfo('No errors selected.');
      return;
    }

    await this._runBatchAnalysis(errors);
  }

  /**
   * Cancel ongoing batch analysis
   */
  cancelBatch(): void {
    if (!this._isAnalyzing) {
      this.showInfo('No batch analysis in progress.');
      return;
    }

    this._shouldCancel = true;
    this.showInfo('Cancelling batch analysis...');
  }

  /**
   * Run batch analysis with progress tracking
   */
  private async _runBatchAnalysis(errors: ErrorItem[]): Promise<void> {
    if (this._isAnalyzing) {
      vscode.window.showWarningMessage('Batch analysis already in progress.');
      return;
    }

    this._isAnalyzing = true;
    this._shouldCancel = false;

    const totalErrors = errors.length;
    let completed = 0;
    let succeeded = 0;
    let failed = 0;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Analyzing ${totalErrors} error${totalErrors > 1 ? 's' : ''}`,
        cancellable: true
      },
      async (progress, token) => {
        this._currentProgress = progress;

        // Handle cancellation
        token.onCancellationRequested(() => {
          this._shouldCancel = true;
        });

        // Process each error sequentially
        for (const error of errors) {
          if (this._shouldCancel) {
            vscode.window.showWarningMessage(
              `Batch analysis cancelled. Completed ${completed}/${totalErrors} errors.`
            );
            break;
          }

          try {
            // Update progress
            progress.report({
              message: `(${completed + 1}/${totalErrors}) ${error.message.substring(0, 30)}...`,
              increment: (1 / totalErrors) * 100
            });

            // Update error status
            await this.queueManager.updateErrorStatus(error.id, 'analyzing');

            // Analyze error
            const startTime = Date.now();
            const result = await this.analysisService.analyzeError(
              error,
              (progress) => {}, // Progress callback (not used for batch)
              undefined // Cancellation token
            );

            const duration = Date.now() - startTime;

            // Update error status
            await this.queueManager.updateErrorStatus(error.id, 'complete');

            // Add to history
            const historyItem: HistoryItem = {
              id: `history-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              timestamp: Date.now(),
              errorId: error.id,
              result,
              duration
            };
            await this.stateManager.addHistoryItem(historyItem);

            succeeded++;
          } catch (err) {
            // Update error status
            await this.queueManager.updateErrorStatus(error.id, 'failed');
            
            failed++;
            
            console.error(`Failed to analyze error ${error.id}:`, err);
          }

          completed++;
        }

        this._currentProgress = undefined;
        this._isAnalyzing = false;

        // Show completion message
        if (!this._shouldCancel) {
          const message = `Batch analysis complete: ${succeeded} succeeded, ${failed} failed`;
          
          if (failed > 0) {
            vscode.window.showWarningMessage(message);
          } else {
            vscode.window.showInformationMessage(message);
          }
        }
      }
    );
  }

  /**
   * Check if batch analysis is running
   */
  isAnalyzing(): boolean {
    return this._isAnalyzing;
  }
}
