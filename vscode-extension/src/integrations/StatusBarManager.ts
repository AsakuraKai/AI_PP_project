/**
 * Status Bar Manager for RCA Agent
 * Manages status bar item showing RCA Agent status
 * 
 * Features:
 * - Shows current RCA status (idle/analyzing/errors/error)
 * - Badge count for unanalyzed errors
 * - Click to toggle panel
 * - Animated icon during analysis
 * - Context-aware tooltips
 */

import * as vscode from 'vscode';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';

export enum RCAStatus {
  Idle = 'idle',
  Analyzing = 'analyzing',
  HasErrors = 'hasErrors',
  Error = 'error'
}

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private currentStatus: RCAStatus = RCAStatus.Idle;
  private errorCount: number = 0;
  private animationInterval?: NodeJS.Timeout;
  private analysisProgress: number = 0;
  private disposables: vscode.Disposable[] = [];

  constructor(private errorQueueManager: ErrorQueueManager) {
    // Create status bar item (priority 100 places it to the left of common items)
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );

    this.statusBarItem.command = 'rca-agent.togglePanel';
    this.statusBarItem.name = 'RCA Agent Status';

    // Listen to error queue changes
    this.disposables.push(
      this.errorQueueManager.onErrorQueueChange((errors) => {
        const pendingErrors = errors.filter(e => e.status === 'pending');
        this.errorCount = pendingErrors.length;
        this.updateStatusBar();
      })
    );

    this.updateStatusBar();
    this.statusBarItem.show();
  }

  /**
   * Update status bar based on current state
   */
  private updateStatusBar(): void {
    switch (this.currentStatus) {
      case RCAStatus.Idle:
        this.setIdleStatus();
        break;
      case RCAStatus.Analyzing:
        this.setAnalyzingStatus();
        break;
      case RCAStatus.HasErrors:
        this.setHasErrorsStatus();
        break;
      case RCAStatus.Error:
        this.setErrorStatus();
        break;
    }
  }

  /**
   * Set idle status
   */
  private setIdleStatus(): void {
    this.statusBarItem.text = '$(robot) RCA: Ready';
    this.statusBarItem.tooltip = 'RCA Agent is ready. Click to open panel.';
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.color = undefined;
  }

  /**
   * Set analyzing status with progress
   */
  private setAnalyzingStatus(): void {
    const progressBar = this.getProgressBar(this.analysisProgress);
    this.statusBarItem.text = `$(sync~spin) RCA: Analyzing ${progressBar} ${this.analysisProgress}%`;
    this.statusBarItem.tooltip = `RCA Agent is analyzing errors. Progress: ${this.analysisProgress}%`;
    this.statusBarItem.backgroundColor = undefined;
    this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
  }

  /**
   * Set has errors status
   */
  private setHasErrorsStatus(): void {
    this.statusBarItem.text = `$(robot) (${this.errorCount}) RCA: ${this.errorCount} error${this.errorCount !== 1 ? 's' : ''} detected`;
    this.statusBarItem.tooltip = `${this.errorCount} unanalyzed error${this.errorCount !== 1 ? 's' : ''} detected. Click to analyze.`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    this.statusBarItem.color = undefined;
  }

  /**
   * Set error status
   */
  private setErrorStatus(): void {
    this.statusBarItem.text = '$(alert) RCA: Analysis failed';
    this.statusBarItem.tooltip = 'RCA Agent encountered an error. Click to view details.';
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    this.statusBarItem.color = undefined;
  }

  /**
   * Generate simple progress bar
   */
  private getProgressBar(progress: number): string {
    const total = 10;
    const filled = Math.floor((progress / 100) * total);
    return '█'.repeat(filled) + '░'.repeat(total - filled);
  }

  /**
   * Set status to idle
   */
  public setIdle(): void {
    this.currentStatus = RCAStatus.Idle;
    this.stopAnimation();
    this.updateStatusBar();
  }

  /**
   * Set status to analyzing with progress
   */
  public setAnalyzing(progress: number = 0, iteration?: number, maxIterations?: number): void {
    this.currentStatus = RCAStatus.Analyzing;
    this.analysisProgress = Math.min(100, Math.max(0, progress));
    
    if (iteration !== undefined && maxIterations !== undefined) {
      this.statusBarItem.tooltip = `RCA Agent is analyzing (iteration ${iteration}/${maxIterations}). Progress: ${this.analysisProgress}%`;
    }
    
    this.updateStatusBar();
  }

  /**
   * Set status to has errors
   */
  public setHasErrors(count: number): void {
    this.currentStatus = RCAStatus.HasErrors;
    this.errorCount = count;
    this.stopAnimation();
    this.updateStatusBar();
  }

  /**
   * Set status to error
   */
  public setError(message?: string): void {
    this.currentStatus = RCAStatus.Error;
    if (message) {
      this.statusBarItem.tooltip = `RCA Agent error: ${message}`;
    }
    this.stopAnimation();
    this.updateStatusBar();
  }

  /**
   * Start animation (for analyzing state)
   */
  private startAnimation(): void {
    if (this.animationInterval) {
      return; // Already animating
    }

    const frames = ['$(sync~spin)', '$(loading~spin)'];
    let frameIndex = 0;

    this.animationInterval = setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      if (this.currentStatus === RCAStatus.Analyzing) {
        const progressBar = this.getProgressBar(this.analysisProgress);
        this.statusBarItem.text = `${frames[frameIndex]} RCA: Analyzing ${progressBar} ${this.analysisProgress}%`;
      }
    }, 100);
  }

  /**
   * Stop animation
   */
  private stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
  }

  /**
   * Show status bar item
   */
  public show(): void {
    this.statusBarItem.show();
  }

  /**
   * Hide status bar item
   */
  public hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Update badge count
   */
  public updateBadgeCount(count: number): void {
    this.errorCount = count;
    if (count > 0 && this.currentStatus !== RCAStatus.Analyzing) {
      this.setHasErrors(count);
    } else if (count === 0 && this.currentStatus === RCAStatus.HasErrors) {
      this.setIdle();
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.stopAnimation();
    this.statusBarItem.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
