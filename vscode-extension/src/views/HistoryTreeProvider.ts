/**
 * HistoryTreeProvider
 * 
 * TreeView provider for displaying analysis history in VS Code's sidebar.
 * Shows past analyses with results and allows reanalysis.
 * 
 * Features:
 * - Chronological history display
 * - Quick access to past results
 * - Context menu actions (reanalyze, delete, export)
 * - Grouping by date (Today, Yesterday, This Week, Older)
 */

import * as vscode from 'vscode';
import { HistoryItem } from '../panel/types';
import { StateManager } from '../panel/StateManager';

export class HistoryTreeProvider implements vscode.TreeDataProvider<HistoryTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<HistoryTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
  private stateManager: StateManager;

  constructor(
    private readonly context: vscode.ExtensionContext,
    stateManager: StateManager
  ) {
    this.stateManager = stateManager;
    
    // Listen to history changes
    this.stateManager.onHistoryChange(() => {
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
  getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of a tree item
   */
  async getChildren(element?: HistoryTreeItem): Promise<HistoryTreeItem[]> {
    if (element) {
      // If it's a group, return its children
      if (element.contextValue?.startsWith('group-')) {
        const groupName = element.label as string;
        const history = await this.stateManager.getHistory();
        const groupedItems = this._groupByDate(history);
        return groupedItems[groupName] || [];
      }
      return [];
    }

    // Root level: show grouped history
    const history = await this.stateManager.getHistory();
    
    if (history.length === 0) {
      return [];
    }

    const grouped = this._groupByDate(history);
    const groups: HistoryTreeItem[] = [];

    // Create group items
    if (grouped['Today']?.length > 0) {
      groups.push(new HistoryTreeItem(
        `Today (${grouped['Today'].length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        'group-today'
      ));
    }

    if (grouped['Yesterday']?.length > 0) {
      groups.push(new HistoryTreeItem(
        `Yesterday (${grouped['Yesterday'].length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'group-yesterday'
      ));
    }

    if (grouped['This Week']?.length > 0) {
      groups.push(new HistoryTreeItem(
        `This Week (${grouped['This Week'].length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'group-week'
      ));
    }

    if (grouped['Older']?.length > 0) {
      groups.push(new HistoryTreeItem(
        `Older (${grouped['Older'].length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'group-older'
      ));
    }

    return groups;
  }

  /**
   * Group history items by date
   */
  private _groupByDate(history: HistoryItem[]): { [key: string]: HistoryTreeItem[] } {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;

    const groups: { [key: string]: HistoryTreeItem[] } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    };

    for (const item of history) {
      const diff = now - item.timestamp;
      const treeItem = new HistoryTreeItem(item);

      if (diff < oneDayMs) {
        groups['Today'].push(treeItem);
      } else if (diff < 2 * oneDayMs) {
        groups['Yesterday'].push(treeItem);
      } else if (diff < oneWeekMs) {
        groups['This Week'].push(treeItem);
      } else {
        groups['Older'].push(treeItem);
      }
    }

    return groups;
  }

  /**
   * Get parent of a tree item
   */
  getParent(element: HistoryTreeItem): vscode.ProviderResult<HistoryTreeItem> {
    return undefined;
  }
}

/**
 * Tree item for history display
 */
export class HistoryTreeItem extends vscode.TreeItem {
  constructor(
    labelOrItem: string | HistoryItem,
    collapsibleState?: vscode.TreeItemCollapsibleState,
    contextValue?: string
  ) {
    if (typeof labelOrItem === 'string') {
      // Group item
      super(labelOrItem, collapsibleState);
      this.contextValue = contextValue;
      this.iconPath = new vscode.ThemeIcon('folder');
    } else {
      // History item
      const item = labelOrItem;
      super(item.result.rootCause.substring(0, 60) + '...', vscode.TreeItemCollapsibleState.None);
      this._setupHistoryItem(item);
    }
  }

  /**
   * Setup history item properties
   */
  private _setupHistoryItem(item: HistoryItem): void {
    // Set description (time ago)
    this.description = this._getTimeAgo(item.timestamp);
    
    // Set tooltip
    this.tooltip = this._buildTooltip(item);
    
    // Set icon based on helpfulness
    this.iconPath = this._getIcon(item);
    
    // Set context value for context menu
    this.contextValue = 'history-item';
    
    // Set command to view full result
    this.command = {
      command: 'rca-agent.viewHistoryItem',
      title: 'View Analysis',
      arguments: [item]
    };
    
    // Store history data
    (this as any).historyData = item;
  }

  /**
   * Build detailed tooltip
   */
  private _buildTooltip(item: HistoryItem): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString();
    tooltip.isTrusted = true;
    tooltip.supportHtml = true;

    tooltip.appendMarkdown(`**Root Cause:**\n\n`);
    tooltip.appendMarkdown(`${item.result.rootCause}\n\n`);
    tooltip.appendMarkdown(`---\n\n`);
    
    tooltip.appendMarkdown(`**Confidence:** ${item.result.confidence}%\n\n`);
    tooltip.appendMarkdown(`**Duration:** ${(item.duration / 1000).toFixed(2)}s\n\n`);
    tooltip.appendMarkdown(`**Iterations:** ${item.result.iterations}\n\n`);
    
    if (item.result.fixGuidelines.length > 0) {
      tooltip.appendMarkdown(`**Fixes:** ${item.result.fixGuidelines.length} suggested\n\n`);
    }

    if (item.helpful !== undefined) {
      tooltip.appendMarkdown(`**Helpful:** ${item.helpful ? '👍 Yes' : '👎 No'}\n\n`);
    }

    const timeAgo = this._getTimeAgo(item.timestamp);
    tooltip.appendMarkdown(`**Analyzed:** ${timeAgo}\n\n`);
    
    tooltip.appendMarkdown(`---\n\n`);
    tooltip.appendMarkdown(`Click to view full analysis`);

    return tooltip;
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

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  /**
   * Get icon based on item properties
   */
  private _getIcon(item: HistoryItem): vscode.ThemeIcon {
    // Show thumbs up/down if feedback provided
    if (item.helpful === true) {
      return new vscode.ThemeIcon('thumbsup', new vscode.ThemeColor('testing.iconPassed'));
    }
    if (item.helpful === false) {
      return new vscode.ThemeIcon('thumbsdown', new vscode.ThemeColor('testing.iconFailed'));
    }

    // Show confidence-based icon
    if (item.result.confidence >= 80) {
      return new vscode.ThemeIcon('check-all', new vscode.ThemeColor('testing.iconPassed'));
    } else if (item.result.confidence >= 60) {
      return new vscode.ThemeIcon('check', new vscode.ThemeColor('editorWarning.foreground'));
    } else {
      return new vscode.ThemeIcon('question', new vscode.ThemeColor('editorInfo.foreground'));
    }
  }
}
