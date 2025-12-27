/**
 * ErrorTreeProvider
 * 
 * TreeView provider for displaying the error queue in VS Code's sidebar.
 * Shows errors with icons, status indicators, and context menus.
 * 
 * Features:
 * - Hierarchical error display
 * - Icon-based severity indicators
 * - Status-based icons (pending, analyzing, complete, failed)
 * - Context menu actions (analyze, remove, pin)
 * - Keyboard navigation support
 */

import * as vscode from 'vscode';
import { ErrorItem } from '../panel/types';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';

export class ErrorTreeProvider implements vscode.TreeDataProvider<ErrorTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ErrorTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
  private queueManager: ErrorQueueManager;

  constructor(
    private readonly context: vscode.ExtensionContext,
    queueManager: ErrorQueueManager
  ) {
    this.queueManager = queueManager;
    
    // Listen to queue changes
    this.queueManager.onQueueChange(() => {
      this.refresh();
    });
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Get tree item representation
   */
  getTreeItem(element: ErrorTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of a tree item
   */
  getChildren(element?: ErrorTreeItem): Thenable<ErrorTreeItem[]> {
    if (element) {
      // No nested children for now
      return Promise.resolve([]);
    }

    // Root level: show all errors grouped by severity
    const errors = this.queueManager.getQueue();
    
    if (errors.length === 0) {
      return Promise.resolve([]);
    }

    // Group by severity
    const critical = errors.filter(e => e.severity === 'critical');
    const high = errors.filter(e => e.severity === 'high');
    const medium = errors.filter(e => e.severity === 'medium');

    const items: ErrorTreeItem[] = [];

    // Add critical errors
    if (critical.length > 0) {
      items.push(new ErrorTreeItem(
        `Critical Errors (${critical.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        'category-critical'
      ));
      items.push(...critical.map(e => new ErrorTreeItem(e)));
    }

    // Add high errors
    if (high.length > 0) {
      items.push(new ErrorTreeItem(
        `High Priority (${high.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        'category-high'
      ));
      items.push(...high.map(e => new ErrorTreeItem(e)));
    }

    // Add medium errors
    if (medium.length > 0) {
      items.push(new ErrorTreeItem(
        `Medium Priority (${medium.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'category-medium'
      ));
      items.push(...medium.map(e => new ErrorTreeItem(e)));
    }

    return Promise.resolve(items);
  }

  /**
   * Get parent of a tree item
   */
  getParent(element: ErrorTreeItem): vscode.ProviderResult<ErrorTreeItem> {
    return undefined; // Flat structure for now
  }
}

/**
 * Tree item for error display
 */
export class ErrorTreeItem extends vscode.TreeItem {
  constructor(
    labelOrError: string | ErrorItem,
    collapsibleState?: vscode.TreeItemCollapsibleState,
    contextValue?: string
  ) {
    if (typeof labelOrError === 'string') {
      // Category item
      super(labelOrError, collapsibleState);
      this.contextValue = contextValue;
      this._setupCategoryIcon(contextValue!);
    } else {
      // Error item
      const error = labelOrError;
      super(error.message, vscode.TreeItemCollapsibleState.None);
      this._setupErrorItem(error);
    }
  }

  /**
   * Setup category icon
   */
  private _setupCategoryIcon(category: string): void {
    if (category === 'category-critical') {
      this.iconPath = new vscode.ThemeIcon(
        'error',
        new vscode.ThemeColor('errorForeground')
      );
    } else if (category === 'category-high') {
      this.iconPath = new vscode.ThemeIcon(
        'warning',
        new vscode.ThemeColor('editorWarning.foreground')
      );
    } else if (category === 'category-medium') {
      this.iconPath = new vscode.ThemeIcon(
        'info',
        new vscode.ThemeColor('editorInfo.foreground')
      );
    }
  }

  /**
   * Setup error item properties
   */
  private _setupErrorItem(error: ErrorItem): void {
    // Set description (file:line)
    const fileName = error.filePath.split(/[/\\]/).pop() || error.filePath;
    this.description = `${fileName}:${error.line}`;
    
    // Set tooltip
    this.tooltip = this._buildTooltip(error);
    
    // Set icon based on severity and status
    this.iconPath = this._getIcon(error.severity, error.status);
    
    // Set context value for context menu
    this.contextValue = `error-${error.status}`;
    
    // Set command to open file and analyze
    this.command = {
      command: 'rca-agent.openErrorLocation',
      title: 'Go to Error',
      arguments: [error]
    };
    
    // Store error data
    (this as any).errorData = error;
  }

  /**
   * Build detailed tooltip
   */
  private _buildTooltip(error: ErrorItem): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString();
    tooltip.isTrusted = true;
    tooltip.supportHtml = true;

    tooltip.appendMarkdown(`**Error:** ${error.message}\n\n`);
    tooltip.appendMarkdown(`**File:** ${error.filePath}\n\n`);
    tooltip.appendMarkdown(`**Location:** Line ${error.line}`);
    
    if (error.column) {
      tooltip.appendMarkdown(`, Column ${error.column}`);
    }
    
    tooltip.appendMarkdown(`\n\n**Severity:** ${error.severity.toUpperCase()}\n\n`);
    tooltip.appendMarkdown(`**Status:** ${this._formatStatus(error.status)}\n\n`);
    
    if (error.source) {
      tooltip.appendMarkdown(`**Source:** ${error.source}\n\n`);
    }

    const timeAgo = this._getTimeAgo(error.timestamp);
    tooltip.appendMarkdown(`**Detected:** ${timeAgo}\n\n`);
    
    tooltip.appendMarkdown(`---\n\n`);
    tooltip.appendMarkdown(`Click to open file and view error`);

    return tooltip;
  }

  /**
   * Format status text
   */
  private _formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '⏳ Pending Analysis',
      'analyzing': '🔄 Analyzing...',
      'complete': '✅ Analysis Complete',
      'failed': '❌ Analysis Failed'
    };
    return statusMap[status] || status;
  }

  /**
   * Get time ago string
   */
  private _getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  /**
   * Get icon based on severity and status
   */
  private _getIcon(
    severity: 'critical' | 'high' | 'medium',
    status: 'pending' | 'analyzing' | 'complete' | 'failed'
  ): vscode.ThemeIcon {
    // Status-based icons
    if (status === 'analyzing') {
      return new vscode.ThemeIcon('sync~spin');
    }
    if (status === 'complete') {
      return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
    }
    if (status === 'failed') {
      return new vscode.ThemeIcon('x', new vscode.ThemeColor('testing.iconFailed'));
    }

    // Severity-based icons for pending
    const iconMap: { [key: string]: [string, vscode.ThemeColor] } = {
      'critical': ['error', new vscode.ThemeColor('errorForeground')],
      'high': ['warning', new vscode.ThemeColor('editorWarning.foreground')],
      'medium': ['info', new vscode.ThemeColor('editorInfo.foreground')]
    };

    const [icon, color] = iconMap[severity];
    return new vscode.ThemeIcon(icon, color);
  }
}
