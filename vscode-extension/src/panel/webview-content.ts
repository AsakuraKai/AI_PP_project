/**
 * Webview HTML/CSS Content Generator for RCA Agent Panel
 * Chunk 2: Core Panel UI
 * 
 * Generates HTML/CSS for all panel states:
 * 1. Empty State (no errors)
 * 2. Active State (with errors/analysis)
 * 3. Complete State (analysis done)
 * 4. Error States (Ollama down, model missing)
 */

import * as vscode from 'vscode';
import { PanelState } from './types';

export class WebviewContentGenerator {
  
  /**
   * Generate complete HTML content for the panel
   */
  static getHtmlContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    state?: PanelState
  ): string {
    // Get URIs for resources
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'resources', 'webview', 'styles.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'resources', 'webview', 'scripts.js')
    );
    
    // Generate nonce for security
    const nonce = getNonce();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>RCA Agent</title>
  <style nonce="${nonce}">
    ${this.getStyles()}
  </style>
</head>
<body>
  <div id="root">
    ${this.getHeaderHTML()}
    <div id="content">
      ${this.getContentHTML(state)}
    </div>
  </div>
  
  <script nonce="${nonce}">
    ${this.getScript()}
  </script>
</body>
</html>`;
  }
  
  /**
   * Generate CSS styles with VS Code theming
   */
  private static getStyles(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        font-weight: var(--vscode-font-weight);
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
        padding: 0;
        margin: 0;
      }
      
      #root {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }
      
      /* Header */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-sideBar-background);
      }
      
      .header h1 {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-foreground);
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
      
      /* Toolbar buttons */
      .icon-button {
        background: none;
        border: none;
        color: var(--vscode-foreground);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 16px;
        transition: background-color 0.1s;
      }
      
      .icon-button:hover {
        background-color: var(--vscode-toolbar-hoverBackground);
      }
      
      .icon-button:active {
        background-color: var(--vscode-toolbar-activeBackground);
      }
      
      /* Content area */
      #content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      
      /* Button styles */
      .button {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background-color 0.1s;
      }
      
      .button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
      
      .button:active {
        background-color: var(--vscode-button-background);
        opacity: 0.8;
      }
      
      .button-secondary {
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
      }
      
      .button-secondary:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
      }
      
      .button-large {
        padding: 12px 24px;
        font-size: 14px;
      }
      
      /* Empty state */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px 24px;
        min-height: 400px;
      }
      
      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.6;
      }
      
      .empty-state h2 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--vscode-foreground);
      }
      
      .empty-state p {
        color: var(--vscode-descriptionForeground);
        margin-bottom: 24px;
        max-width: 400px;
        line-height: 1.5;
      }
      
      .empty-state-tips {
        margin-top: 32px;
        text-align: left;
        width: 100%;
        max-width: 400px;
      }
      
      .empty-state-tips h3 {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--vscode-foreground);
      }
      
      .empty-state-tips ul {
        list-style: none;
        padding: 0;
      }
      
      .empty-state-tips li {
        padding: 6px 0;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        line-height: 1.4;
      }
      
      .empty-state-tips li::before {
        content: "• ";
        color: var(--vscode-textLink-foreground);
        font-weight: bold;
        margin-right: 8px;
      }
      
      .shortcut-hint {
        display: inline-block;
        background-color: var(--vscode-keybindingLabel-background);
        color: var(--vscode-keybindingLabel-foreground);
        border: 1px solid var(--vscode-keybindingLabel-border);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 11px;
        font-family: monospace;
        margin: 0 4px;
      }
      
      /* Error queue */
      .error-queue {
        margin-bottom: 24px;
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .error-list {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        overflow: hidden;
      }
      
      .error-item {
        padding: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        cursor: pointer;
        transition: background-color 0.1s;
      }
      
      .error-item:last-child {
        border-bottom: none;
      }
      
      .error-item:hover {
        background-color: var(--vscode-list-hoverBackground);
      }
      
      .error-item.analyzing {
        background-color: var(--vscode-list-activeSelectionBackground);
        opacity: 0.7;
      }
      
      .error-info {
        flex: 1;
      }
      
      .error-message {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        margin-bottom: 4px;
      }
      
      .error-location {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        font-family: monospace;
      }
      
      .error-severity {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }
      
      .severity-critical {
        background-color: var(--vscode-errorForeground);
      }
      
      .severity-high {
        background-color: var(--vscode-warningForeground);
      }
      
      .severity-medium {
        background-color: var(--vscode-notificationsInfoIcon-foreground);
      }
      
      /* Analysis section */
      .analysis-section {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 24px;
        background-color: var(--vscode-sideBar-background);
      }
      
      .analysis-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .analysis-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
      }
      
      .analysis-actions {
        display: flex;
        gap: 8px;
      }
      
      /* Progress bar */
      .progress-container {
        margin: 16px 0;
      }
      
      .progress-bar {
        width: 100%;
        height: 6px;
        background-color: var(--vscode-progressBar-background);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
      }
      
      .progress-fill {
        height: 100%;
        background-color: var(--vscode-progressBar-background);
        transition: width 0.3s ease;
      }
      
      .progress-text {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid var(--vscode-progressBar-background);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .iteration-info {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 8px;
      }
      
      /* Results section */
      .result-section {
        margin-bottom: 24px;
      }
      
      .result-box {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 16px;
        background-color: var(--vscode-editor-background);
        margin-bottom: 16px;
      }
      
      .result-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      
      .result-content {
        font-size: 13px;
        line-height: 1.6;
        color: var(--vscode-foreground);
      }
      
      .code-block {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 12px;
        margin: 12px 0;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        overflow-x: auto;
      }
      
      .code-line {
        display: flex;
        padding: 2px 0;
      }
      
      .line-number {
        color: var(--vscode-editorLineNumber-foreground);
        margin-right: 16px;
        user-select: none;
        min-width: 30px;
        text-align: right;
      }
      
      .line-content {
        color: var(--vscode-editor-foreground);
      }
      
      .line-highlight {
        background-color: var(--vscode-editor-lineHighlightBackground);
        margin: 0 -12px;
        padding: 0 12px;
      }
      
      /* Fix guidelines */
      .fix-list {
        list-style: none;
        padding: 0;
      }
      
      .fix-item {
        padding: 12px;
        margin-bottom: 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        background-color: var(--vscode-editor-background);
      }
      
      .fix-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .fix-number {
        font-weight: 600;
        color: var(--vscode-textLink-foreground);
      }

      .file-link {
        color: var(--vscode-textLink-foreground);
        text-decoration: none;
        word-break: break-all;
      }

      .file-link:hover {
        text-decoration: underline;
      }

      .fix-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }

      .fix-item-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .copy-button {
        background: none;
        border: 1px solid var(--vscode-button-border);
        color: var(--vscode-button-foreground);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
        transition: all 0.1s;
      }
      
      .copy-button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }

      .preview-button,
      .apply-button {
        background: none;
        border: 1px solid var(--vscode-button-border);
        color: var(--vscode-button-foreground);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
        transition: all 0.1s;
      }

      .preview-button:hover,
      .apply-button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }

      details.expandable {
        margin-top: 8px;
      }

      details.expandable summary {
        cursor: pointer;
        color: var(--vscode-textLink-foreground);
        user-select: none;
      }

      details.expandable .expandable-body {
        margin-top: 8px;
      }

      pre.code {
        white-space: pre;
      }

      .tok-keyword {
        color: var(--vscode-symbolIcon-keywordForeground, var(--vscode-textLink-foreground));
        font-weight: 600;
      }

      .tok-string {
        color: var(--vscode-symbolIcon-stringForeground, var(--vscode-charts-orange));
      }

      .tok-number {
        color: var(--vscode-symbolIcon-numberForeground, var(--vscode-charts-blue));
      }

      .tok-comment {
        color: var(--vscode-descriptionForeground);
        font-style: italic;
      }

      .diff-add {
        color: var(--vscode-gitDecoration-addedResourceForeground, var(--vscode-charts-green));
      }

      .diff-remove {
        color: var(--vscode-gitDecoration-deletedResourceForeground, var(--vscode-charts-red));
      }

      .diff-hunk {
        color: var(--vscode-textLink-foreground);
      }

      .diff-meta {
        color: var(--vscode-descriptionForeground);
      }

      .settings-panel {
        margin-top: 16px;
      }

      .settings-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .settings-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .settings-row input[type="text"],
      .settings-row select {
        width: 60%;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 3px;
        padding: 6px 8px;
      }

      .settings-row.settings-actions {
        justify-content: flex-end;
      }
      
      /* Confidence bar */
      .confidence-container {
        margin: 16px 0;
      }
      
      .confidence-bar {
        width: 100%;
        height: 8px;
        background-color: var(--vscode-progressBar-background);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 4px;
      }
      
      .confidence-fill {
        height: 100%;
        background-color: var(--vscode-charts-green);
        transition: width 0.3s ease;
      }
      
      .confidence-fill.low {
        background-color: var(--vscode-charts-red);
      }
      
      .confidence-fill.medium {
        background-color: var(--vscode-charts-yellow);
      }
      
      .confidence-label {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        text-align: right;
      }
      
      /* Feedback section */
      .feedback-section {
        display: flex;
        gap: 12px;
        padding: 16px 0;
        border-top: 1px solid var(--vscode-panel-border);
      }
      
      /* Error states */
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 48px 24px;
        min-height: 300px;
        justify-content: center;
      }
      
      .error-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .error-state h2 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--vscode-errorForeground);
      }
      
      .error-state-message {
        color: var(--vscode-descriptionForeground);
        margin-bottom: 24px;
        max-width: 400px;
        line-height: 1.6;
      }
      
      .error-state-steps {
        text-align: left;
        margin: 24px 0;
        padding: 16px;
        background-color: var(--vscode-textCodeBlock-background);
        border-radius: 4px;
        max-width: 400px;
      }
      
      .error-state-steps ol {
        margin: 0;
        padding-left: 20px;
      }
      
      .error-state-steps li {
        padding: 4px 0;
        color: var(--vscode-foreground);
        font-size: 12px;
      }
      
      .code-hint {
        display: inline-block;
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 11px;
        margin: 0 4px;
      }
      
      /* Settings dropdown (will be enhanced in later iterations) */
      .settings-dropdown {
        position: absolute;
        top: 48px;
        right: 16px;
        background-color: var(--vscode-dropdown-background);
        border: 1px solid var(--vscode-dropdown-border);
        border-radius: 4px;
        padding: 8px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 200px;
        display: none;
      }
      
      .settings-dropdown.show {
        display: block;
      }
      
      .settings-item {
        padding: 8px 16px;
        cursor: pointer;
        font-size: 12px;
        color: var(--vscode-foreground);
      }
      
      .settings-item:hover {
        background-color: var(--vscode-list-hoverBackground);
      }
      
      /* Utility classes */
      .text-center {
        text-align: center;
      }
      
      .mt-16 {
        margin-top: 16px;
      }
      
      .mb-16 {
        margin-bottom: 16px;
      }
      
      .hidden {
        display: none !important;
      }
    `;
  }
  
  /**
   * Generate header HTML
   */
  private static getHeaderHTML(): string {
    return `
      <div class="header">
        <h1>RCA Agent</h1>
        <div class="header-actions">
          <button class="icon-button" id="refresh-btn" title="Refresh" aria-label="Refresh">
            
          </button>
          <button class="icon-button" id="settings-btn" title="Settings" aria-label="Settings">
            
          </button>
          <button class="icon-button" id="help-btn" title="Help" aria-label="Help">
            ?
          </button>
        </div>
      </div>
      <div class="settings-dropdown" id="settings-dropdown">
        <div class="settings-item" id="open-settings-panel">Settings...</div>
        <div class="settings-item" id="toggle-educational">Toggle Educational Mode</div>
        <div class="settings-item" id="toggle-perf">Toggle Performance Metrics</div>
        <div class="settings-item" id="view-logs">View Logs</div>
        <div class="settings-item" id="clear-cache">Clear Cache</div>
      </div>
    `;
  }
  
  /**
   * Generate content HTML based on state
   */
  private static getContentHTML(state?: PanelState): string {
    if (!state || state.view === 'empty') {
      return this.getEmptyStateHTML();
    }
    
    if (state.view === 'error') {
      return this.getErrorStateHTML(state);
    }
    
    if (state.view === 'analyzing') {
      return this.getAnalyzingStateHTML(state);
    }
    
    if (state.view === 'complete') {
      return this.getCompleteStateHTML(state);
    }
    
    return this.getEmptyStateHTML();
  }
  
  /**
   * Empty state (no errors detected)
   */
  private static getEmptyStateHTML(): string {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">■</div>
        <h2>No errors detected</h2>
        <p>
          Select error text in your editor and click "Analyze Selected Error" or use the keyboard shortcut to analyze errors.
        </p>
        <button class="button button-large" id="analyze-btn">
          > Analyze Selected Error
        </button>
        
        <div class="empty-state-tips">
          <h3>Quick Start Tips:</h3>
          <ul>
            <li><strong>Keyboard Shortcuts:</strong> <span class="shortcut-hint">Ctrl+Shift+R</span> for quick analysis or <span class="shortcut-hint">Ctrl+Shift+W</span> for panel view</li>
            <li><strong>Select & Analyze:</strong> Highlight error text in editor and click "Analyze Selected Error"</li>
            <li><strong>Right-Click Menu:</strong> Right-click on any error for quick actions (fix, search, copy)</li>
            <li><strong>Auto-Detect:</strong> Enable in settings to automatically catch build errors</li>
            <li><strong>Learning Mode:</strong> Turn on educational mode to see detailed explanations with each analysis</li>
            <li><strong>Need Help?</strong> Click the <strong>?</strong> button in the header for full documentation</li>
          </ul>
        </div>
      </div>
    `;
  }
  
  /**
   * Error state (Ollama down, model missing)
   */
  private static getErrorStateHTML(state: PanelState): string {
    if (state.errorType === 'ollama-unavailable') {
      return `
        <div class="error-state">
          <div class="error-state-icon">!</div>
          <h2>Ollama Server Not Available</h2>
          <div class="error-state-message">
            <p>The Ollama server is not responding.</p>
            <p>Please ensure Ollama is running:</p>
          </div>
          <div class="error-state-steps">
            <ol>
              <li>Open terminal</li>
              <li>Run: <span class="code-hint">ollama serve</span></li>
              <li>Wait for "Ollama is running" message</li>
            </ol>
          </div>
          <p>Current URL: ${state.ollamaUrl || 'http://localhost:11434'}</p>
          <div class="mt-16">
            <button class="button" id="check-connection-btn">
              Check Connection
            </button>
            <button class="button button-secondary" id="view-logs-btn">
              View Logs
            </button>
          </div>
        </div>
      `;
    }
    
    if (state.errorType === 'model-not-found') {
      return `
        <div class="error-state">
          <div class="error-state-icon">!</div>
          <h2>Model Not Found</h2>
          <div class="error-state-message">
            <p>The model '${state.modelName || 'deepseek-r1'}' is not installed.</p>
            <p>To install the model:</p>
          </div>
          <div class="error-state-steps">
            <ol>
              <li>Open terminal</li>
              <li>Run: <span class="code-hint">ollama pull ${state.modelName || 'deepseek-r1'}</span></li>
              <li>Wait for download to complete</li>
            </ol>
          </div>
          <div class="mt-16">
            <button class="button" id="install-model-btn">
              Install Model
            </button>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="error-state">
        <div class="error-state-icon"></div>
        <h2>Analysis Error</h2>
        <div class="error-state-message">
          <p>${state.errorMessage || 'An unexpected error occurred during analysis.'}</p>
        </div>
        <div class="mt-16">
          <button class="button" id="retry-btn">
             Retry
          </button>
          <button class="button button-secondary" id="view-logs-btn">
            [MANIFEST] View Logs
          </button>
          <button class="button button-secondary" id="help-inline-btn">
            Help
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Analyzing state (analysis in progress)
   */
  private static getAnalyzingStateHTML(state: PanelState): string {
    const progress = state.progress || 0;
    const iteration = state.currentIteration || 1;
    const maxIterations = state.maxIterations || 3;
    const thought = state.currentThought || 'Analyzing error pattern...';

    const elapsedMs = state.elapsed || 0;
    const etaSeconds = progress > 1 && elapsedMs > 0
      ? Math.max(0, ((elapsedMs / (progress / 100)) - elapsedMs) / 1000)
      : undefined;
    
    return `
      <div class="analysis-section">
        <div class="analysis-header">
          <div class="analysis-title">CURRENT ANALYSIS</div>
          <div class="analysis-actions">
            <button class="icon-button" id="stop-btn" title="Stop Analysis">||</button>
          </div>
        </div>
        
        <div class="result-content">
          <strong>Error:</strong> ${state.currentError?.message || 'Unknown error'}
        </div>
        <div class="result-content mt-16">
          <strong>Location:</strong> ${state.currentError?.filePath || 'Unknown'}:${state.currentError?.line || 0}
        </div>
        
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">
            <span class="spinner"></span>
            <span>${thought}</span>
          </div>
          <div class="iteration-info">
            Iteration ${iteration} of ${maxIterations}
            ${state.toolsUsed ? `• Tools used: ${state.toolsUsed.join(', ')}` : ''}
            ${state.elapsed ? `• Elapsed: ${(state.elapsed / 1000).toFixed(1)}s` : ''}
            ${etaSeconds !== undefined ? `• ETA: ${etaSeconds.toFixed(1)}s` : ''}
          </div>
        </div>
      </div>
      
      <div class="text-center">
        <button class="button button-secondary" id="cancel-btn">
          Cancel Analysis
        </button>
      </div>
    `;
  }
  
  /**
   * Complete state (analysis finished)
   */
  private static getCompleteStateHTML(state: PanelState): string {
    const result = state.result;
    if (!result) {
      return this.getEmptyStateHTML();
    }

    const errorType = (result as any).errorType as string | undefined;
    const icon = this.getErrorTypeIcon(errorType, result.error || state.currentError?.message);
    const filePath = result.filePath || state.currentError?.filePath || '';
    const line = result.line || state.currentError?.line || 1;
    const locationLabel = filePath ? `${filePath}:${line}` : 'Unknown location';

    const rootCauseHtml = this.renderMarkdown(result.rootCause || '');
    
    return `
      <div class="result-section">
        <div class="section-header">
          <div class="section-title">${icon} ANALYSIS COMPLETE</div>
        </div>
        
        <div class="result-content mb-16">
          <strong>${this.escapeHtml(result.error || state.currentError?.message || 'Unknown error')}</strong>
          <span> at </span>
          <a href="#" class="file-link" data-file-path="${this.escapeHtml(filePath)}" data-line="${line}">${this.escapeHtml(locationLabel)}</a>
        </div>
        
        <!-- Root Cause -->
        <div class="result-box">
          <div class="result-label">ROOT CAUSE</div>
          <div class="result-content">
            ${rootCauseHtml}
          </div>
        </div>
        
        <!-- Code Context -->
        ${result.codeSnippet ? `
        <div class="result-box">
          <div class="result-label">CODE CONTEXT</div>
          <div class="code-block">
            <pre class="code"><code>${this.highlightCode(this.escapeHtml(result.codeSnippet), this.guessLanguage(filePath))}</code></pre>
          </div>
        </div>
        ` : ''}
        
        <!-- Fix Guidelines -->
        <div class="result-box">
          <div class="result-label">FIX GUIDELINES</div>
          <div class="fix-actions">
            <button class="button button-secondary" id="search-similar-btn">Search Similar Errors</button>
            <button class="button button-secondary" id="run-validation-btn">Run Validation Tests</button>
            <button class="button" id="apply-all-fixes-btn">Apply All Fixes</button>
          </div>
          <ul class="fix-list">
            ${result.fixGuidelines.map((fix, index) => `
              <li class="fix-item">
                <div class="fix-item-header">
                  <span class="fix-number">${index + 1}. ${this.escapeHtml(fix.split('\n')[0] || fix)}</span>
                  <div class="fix-item-actions">
                    <button class="copy-button" data-fix="${index}">Copy</button>
                    <button class="preview-button" data-fix="${index}">Preview Diff</button>
                    <button class="apply-button" data-fix="${index}">Apply</button>
                  </div>
                </div>
                ${this.renderFixBody(fix)}
              </li>
            `).join('')}
          </ul>
        </div>
        
        <!-- Confidence -->
        <div class="confidence-container">
          <div class="result-label">CONFIDENCE</div>
          <div class="confidence-bar">
            <div class="confidence-fill ${this.getConfidenceClass(result.confidence)}" 
                 style="width: ${result.confidence}%"></div>
          </div>
          <div class="confidence-label">${result.confidence}%</div>
        </div>
        
        <!-- Feedback -->
        <div class="feedback-section">
          <button class="button" id="helpful-btn">Helpful</button>
          <button class="button button-secondary" id="not-helpful-btn">Not Helpful</button>
          <button class="button button-secondary" id="feedback-btn">[COMMENT] Feedback</button>
        </div>

        <!-- Settings Panel (Phase 6) -->
        <div class="settings-panel" id="settings-panel" style="display:none;">
          <div class="result-box">
            <div class="result-label">SETTINGS</div>
            <div class="settings-grid">
              <label class="settings-row">
                <input type="checkbox" id="setting-syntax" checked />
                <span>Syntax highlighting</span>
              </label>
              <label class="settings-row">
                <input type="checkbox" id="setting-perf" />
                <span>Show performance metrics</span>
              </label>
              <div class="settings-row">
                <span>Model</span>
                <select id="setting-model">
                  <option value="hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest">DeepSeek-R1-Distill-Qwen-7B</option>
                  <option value="codellama:7b">Code Llama 7B</option>
                  <option value="qwen-coder:7b">Qwen Coder 7B</option>
                  <option value="deepseek-coder:6.7b">DeepSeek Coder 6.7B</option>
                </select>
              </div>
              <div class="settings-row">
                <span>Ollama URL</span>
                <input type="text" id="setting-ollama" placeholder="http://localhost:11434" />
              </div>
              <div class="settings-row settings-actions">
                <button class="button button-secondary" id="settings-cancel-btn">Cancel</button>
                <button class="button" id="settings-save-btn">Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="text-center mt-16">
        <button class="button" id="analyze-new-btn">
          Analyze Another Error
        </button>
      </div>
    `;
  }
  
  /**
   * Generate inline JavaScript for webview
   */
  private static getScript(): string {
    return `
      const vscode = acquireVsCodeApi();

      const escapeHtml = (text) => {
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // Event handlers
      document.getElementById('analyze-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'analyze' });
      });
      
      document.getElementById('refresh-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'refresh' });
      });
      
      document.getElementById('settings-btn')?.addEventListener('click', () => {
        const dropdown = document.getElementById('settings-dropdown');
        dropdown?.classList.toggle('show');
      });
      
      document.getElementById('help-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'openDocs' });
      });
      
      document.getElementById('stop-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'stop' });
      });
      
      document.getElementById('cancel-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'stop' });
      });
      
      document.getElementById('check-connection-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'checkConnection' });
      });
      
      document.getElementById('install-model-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'installModel' });
      });
      
      document.getElementById('view-logs-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'viewLogs' });
      });

      document.getElementById('help-inline-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'openDocs' });
      });
      
      document.getElementById('retry-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'analyze' });
      });
      
      document.getElementById('analyze-new-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'analyzeNew' });
      });
      
      // Settings dropdown items
      document.getElementById('toggle-educational')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'toggleEducational' });
        document.getElementById('settings-dropdown')?.classList.remove('show');
      });
      
      document.getElementById('toggle-perf')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'togglePerf' });
        document.getElementById('settings-dropdown')?.classList.remove('show');
      });

      document.getElementById('open-settings-panel')?.addEventListener('click', () => {
        const panel = document.getElementById('settings-panel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
        document.getElementById('settings-dropdown')?.classList.remove('show');
      });
      
      document.getElementById('view-logs')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'viewLogs' });
        document.getElementById('settings-dropdown')?.classList.remove('show');
      });
      
      document.getElementById('clear-cache')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'clearCache' });
        document.getElementById('settings-dropdown')?.classList.remove('show');
      });
      
      // Feedback buttons
      document.getElementById('helpful-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'feedback', value: 'helpful' });
      });
      
      document.getElementById('not-helpful-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'feedback', value: 'not-helpful' });
      });
      
      document.getElementById('feedback-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'feedback', value: 'custom' });
      });
      
      // Copy buttons for fix guidelines
      document.querySelectorAll('.copy-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const fixIndex = e.target.getAttribute('data-fix');
          vscode.postMessage({ type: 'copy', fixIndex });
        });
      });

      // Preview diff buttons
      document.querySelectorAll('.preview-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const fixIndex = e.target.getAttribute('data-fix');
          vscode.postMessage({ type: 'previewFix', fixIndex: Number(fixIndex) });
        });
      });

      // Apply single fix buttons
      document.querySelectorAll('.apply-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const fixIndex = e.target.getAttribute('data-fix');
          vscode.postMessage({ type: 'applyFixIndex', fixIndex: Number(fixIndex) });
        });
      });

      // Apply all fixes
      document.getElementById('apply-all-fixes-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'applyAllFixes' });
      });

      // Search similar errors
      document.getElementById('search-similar-btn')?.addEventListener('click', () => {
        const err = document.querySelector('.result-content strong')?.textContent || '';
        vscode.postMessage({ type: 'searchSimilar', query: err });
      });

      // Run validation tests
      document.getElementById('run-validation-btn')?.addEventListener('click', () => {
        vscode.postMessage({ type: 'runValidationTests' });
      });

      // Clickable file links
      document.querySelectorAll('.file-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = e.currentTarget;
          const filePath = target.getAttribute('data-file-path');
          const line = Number(target.getAttribute('data-line') || '1');
          if (filePath) {
            vscode.postMessage({ type: 'viewFile', filePath, line });
          }
        });
      });

      // External links in rendered markdown
      document.querySelectorAll('a.external-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const url = e.currentTarget.getAttribute('data-url');
          if (url) {
            vscode.postMessage({ type: 'openExternal', url });
          }
        });
      });

      document.getElementById('settings-cancel-btn')?.addEventListener('click', () => {
        const panel = document.getElementById('settings-panel');
        if (panel) panel.style.display = 'none';
      });

      document.getElementById('settings-save-btn')?.addEventListener('click', () => {
        const syntax = document.getElementById('setting-syntax')?.checked ?? true;
        const perf = document.getElementById('setting-perf')?.checked ?? false;
        const model = document.getElementById('setting-model')?.value;
        const ollamaUrl = document.getElementById('setting-ollama')?.value;
        vscode.postMessage({
          type: 'updateSettings',
          settings: {
            syntaxHighlighting: !!syntax,
            showPerformanceMetrics: !!perf,
            modelName: model,
            ollamaUrl
          }
        });
        const panel = document.getElementById('settings-panel');
        if (panel) panel.style.display = 'none';
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.icon-button') && !e.target.closest('.settings-dropdown')) {
          document.getElementById('settings-dropdown')?.classList.remove('show');
        }
      });
      
      // Handle messages from extension
      window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
          case 'updateState':
            // State update will trigger full refresh
            break;
          case 'showNotification':
            // Could add toast notifications here
            console.log('Notification:', message.message);
            break;
        }
      });

      // Keyboard shortcuts (Phase 6)
      document.addEventListener('keydown', (e) => {
        const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

        // Ctrl/Cmd+Enter: Analyze
        if (ctrlOrCmd && e.key === 'Enter') {
          if (document.getElementById('analyze-btn')) {
            e.preventDefault();
            vscode.postMessage({ type: 'analyze' });
          }
        }

        // Ctrl/Cmd+Shift+F: Search similar (when available)
        if (ctrlOrCmd && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
          const btn = document.getElementById('search-similar-btn');
          if (btn) {
            e.preventDefault();
            btn.click();
          }
        }

        // Ctrl/Cmd+Shift+T: Run validation tests (when available)
        if (ctrlOrCmd && e.shiftKey && (e.key === 'T' || e.key === 't')) {
          const btn = document.getElementById('run-validation-btn');
          if (btn) {
            e.preventDefault();
            btn.click();
          }
        }
      });
    `;
  }
  
  /**
   * Utility: Escape HTML
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static renderFixBody(fix: string): string {
    const body = fix.includes('\n') ? fix.substring(fix.indexOf('\n') + 1) : '';
    if (!body.trim()) {
      return '';
    }

    // Detect diff-like content and render as expandable block
    const isDiff = /(^diff --git\s)|(^@@\s)|(^\+\+\+\s)|(^---\s)|(^[+-].+)/m.test(body);
    const bodyHtml = isDiff
      ? `<pre class="code diff"><code>${this.highlightDiff(this.escapeHtml(body))}</code></pre>`
      : this.renderMarkdown(body);

    return `
      <details class="expandable">
        <summary>Details</summary>
        <div class="expandable-body">${bodyHtml}</div>
      </details>
    `;
  }

  private static renderMarkdown(text: string): string {
    const escaped = this.escapeHtml(text);

    // Links
    let html = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="#" class="external-link" data-url="$2">$1</a>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Basic lists
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

    // Paragraphs / line breaks
    html = html
      .split(/\n\n+/)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    // Fenced code blocks (post-process on the raw text to keep code intact)
    // If the original includes ``` blocks, render them specially.
    if (text.includes('```')) {
      return this.renderFencedCodeBlocks(text);
    }

    return html;
  }

  private static renderFencedCodeBlocks(text: string): string {
    // Split into fenced code blocks and prose.
    const parts: string[] = [];
    const fenceRe = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = fenceRe.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) {
        parts.push(this.renderMarkdown(before));
      }

      const lang = (match[1] || '').trim().toLowerCase();
      const code = match[2] || '';
      const safe = this.escapeHtml(code);
      const highlighted = lang === 'diff' ? this.highlightDiff(safe) : this.highlightCode(safe, lang);
      parts.push(`<pre class="code"><code>${highlighted}</code></pre>`);

      lastIndex = match.index + match[0].length;
    }

    const after = text.slice(lastIndex);
    if (after.trim()) {
      parts.push(this.renderMarkdown(after));
    }

    return parts.join('');
  }

  private static guessLanguage(filePath?: string): string {
    const fp = (filePath || '').toLowerCase();
    if (fp.endsWith('.kt') || fp.endsWith('.kts')) return 'kotlin';
    if (fp.endsWith('.java')) return 'java';
    if (fp.endsWith('.xml')) return 'xml';
    if (fp.endsWith('.gradle') || fp.includes('build.gradle')) return 'gradle';
    if (fp.endsWith('.toml')) return 'toml';
    return '';
  }

  private static highlightDiff(escapedCode: string): string {
    // escapedCode is already HTML-escaped.
    return escapedCode
      .split('\n')
      .map(line => {
        if (line.startsWith('+') && !line.startsWith('+++')) return `<span class="diff-add">${line}</span>`;
        if (line.startsWith('-') && !line.startsWith('---')) return `<span class="diff-remove">${line}</span>`;
        if (line.startsWith('@@')) return `<span class="diff-hunk">${line}</span>`;
        if (line.startsWith('diff --git') || line.startsWith('+++') || line.startsWith('---')) return `<span class="diff-meta">${line}</span>`;
        return line;
      })
      .join('\n');
  }

  private static highlightCode(escapedCode: string, language: string): string {
    // escapedCode is already HTML-escaped.
    const keywords = {
      kotlin: ['fun', 'val', 'var', 'class', 'object', 'interface', 'when', 'if', 'else', 'try', 'catch', 'finally', 'return', 'null', 'true', 'false', 'override', 'private', 'public', 'protected', 'internal', 'suspend', 'data', 'sealed'],
      java: ['class', 'interface', 'enum', 'public', 'private', 'protected', 'static', 'final', 'void', 'new', 'return', 'null', 'true', 'false', 'try', 'catch', 'finally', 'throw', 'throws', 'extends', 'implements'],
      xml: ['android', 'xmlns', 'layout_width', 'layout_height', 'id'],
      gradle: ['plugins', 'dependencies', 'android', 'compileSdk', 'defaultConfig', 'minSdk', 'targetSdk', 'implementation', 'api', 'classpath', 'kotlin', 'id'],
      toml: ['version', 'versions', 'libraries', 'plugins', 'group', 'name']
    } as Record<string, string[]>;

    const lang = (language || '').toLowerCase();
    let html = escapedCode;

    // Comments
    html = html.replace(/(^\s*\/\/.*$)/gm, '<span class="tok-comment">$1</span>');
    html = html.replace(/(^\s*#.*$)/gm, '<span class="tok-comment">$1</span>');
    html = html.replace(/(<!--([\s\S]*?)-->)/g, '<span class="tok-comment">$1</span>');

    // Strings
    html = html.replace(/(&quot;[^\n&]*?&quot;)/g, '<span class="tok-string">$1</span>');
    html = html.replace(/('(?:\\'|[^'])*')/g, '<span class="tok-string">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');

    // Keywords
    const ks = keywords[lang];
    if (ks && ks.length) {
      const re = new RegExp(`\\b(${ks.map(k => k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})\\b`, 'g');
      html = html.replace(re, '<span class="tok-keyword">$1</span>');
    }

    return html;
  }

  private static getErrorTypeIcon(errorType?: string, errorText?: string): string {
    const t = (errorType || '').toLowerCase();
    const msg = (errorText || '').toLowerCase();
    if (t.includes('gradle') || msg.includes('gradle') || msg.includes('agp')) return '[G]';
    if (t.includes('kotlin') || msg.includes('kotlin') || msg.includes('kotlinnullpointerexception')) return '[K]';
    if (t.includes('compose') || msg.includes('compose')) return '[C]';
    if (t.includes('manifest') || msg.includes('androidmanifest')) return '[M]';
    if (t.includes('xml') || msg.includes('inflate') || msg.includes('xml')) return '[X]';
    if (t.includes('proguard') || msg.includes('proguard') || msg.includes('r8')) return '[P]';
    if (t.includes('navigation') || msg.includes('navigation')) return '[N]';
    return '[E]';
  }
  
  /**
   * Utility: Get confidence CSS class
   */
  private static getConfidenceClass(confidence: number): string {
    if (confidence < 50) return 'low';
    if (confidence < 75) return 'medium';
    return '';
  }
}

/**
 * Generate a random nonce for CSP
 */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
