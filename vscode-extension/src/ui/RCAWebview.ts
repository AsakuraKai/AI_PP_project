// CHUNK 5.1: Webview Panel Implementation
// Interactive webview for displaying RCA results with real-time progress updates

import * as vscode from 'vscode';

/**
 * Interface for RCA result data (matches backend schema)
 */
interface RCADocument {
  error: string;
  errorType: string;
  filePath: string;
  line: number;
  rootCause: string;
  fixGuidelines: string[];
  confidence: number;
  codeSnippet?: string;
  toolsUsed?: string[];
  iterations?: number;
  language?: 'kotlin' | 'java' | 'xml';
  qualityScore?: number;
  latency?: number;
  modelName?: string;
  fromCache?: boolean;
  cacheTimestamp?: string;
  
  // CHUNK 5.2: Educational mode content
  learningNotes?: string[];
  explanation?: string;
  bestPractices?: string[];
  
  // Android-specific metadata
  metadata?: {
    module?: string;
    conflictingVersions?: string[];
    recommendedVersion?: string;
    affectedDependencies?: string[];
    requiredPermission?: string;
  };
  recommendedFix?: string;
  docResults?: Array<{
    title: string;
    summary: string;
    url?: string;
  }>;
}

/**
 * RCAWebview - Interactive webview panel for displaying analysis results
 * 
 * Features:
 * - Real-time progress updates with iteration display
 * - Animated progress bar
 * - Agent thought process visualization
 * - Comprehensive result display
 * - Educational mode support (Chunk 5.2)
 * - VS Code theme integration
 */
export class RCAWebview {
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private educationalMode: boolean = false;
  private showPerformanceMetrics: boolean = false; // CHUNK 5.3
  
  /**
   * Factory method to create RCAWebview instance
   */
  static create(context: vscode.ExtensionContext, educationalMode: boolean = false): RCAWebview {
    const panel = vscode.window.createWebviewPanel(
      'rcaAgent',
      'RCA Agent - Analysis',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri]
      }
    );
    
    const instance = new RCAWebview(panel, context, educationalMode);
    return instance;
  }
  
  private constructor(
    panel: vscode.WebviewPanel,
    private context: vscode.ExtensionContext,
    educationalMode: boolean
  ) {
    this.panel = panel;
    this.educationalMode = educationalMode;
    this.setHtmlContent();
    
    // Handle disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    
    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      message => this.handleWebviewMessage(message),
      null,
      this.disposables
    );
  }
  
  /**
   * Update progress bar and show current iteration
   */
  updateProgress(iteration: number, maxIterations: number, thought: string): void {
    this.panel.webview.postMessage({
      type: 'progress',
      iteration,
      maxIterations,
      thought,
      progress: (iteration / maxIterations) * 100,
    });
  }
  
  /**
   * Display final analysis result
   */
  showFinalResult(rca: RCADocument): void {
    this.panel.webview.postMessage({
      type: 'result',
      rca,
      educationalMode: this.educationalMode
    });
  }
  
  /**
   * CHUNK 5.3: Show performance metrics
   * @param metrics Performance metrics data
   */
  showPerformanceMetrics(metrics: {
    totalTime: number;
    llmTime: number;
    toolTime: number;
    cacheHitRate: number;
    tokenUsage?: { prompt: number; completion: number; total: number };
  }): void {
    this.panel.webview.postMessage({
      type: 'metrics',
      data: metrics
    });
  }

  /**
   * Show error message in webview
   */
  showError(errorMessage: string): void {
    this.panel.webview.postMessage({
      type: 'error',
      message: errorMessage
    });
  }
  
  /**
   * Reset webview for new analysis
   */
  reset(): void {
    this.panel.webview.postMessage({
      type: 'reset'
    });
  }
  
  /**
   * Toggle educational mode
   */
  setEducationalMode(enabled: boolean): void {
    this.educationalMode = enabled;
    this.panel.webview.postMessage({
      type: 'educationalMode',
      enabled
    });
  }
  
  /**
   * CHUNK 5.3: Toggle performance metrics display
   */
  setPerformanceMetrics(enabled: boolean): void {
    this.showPerformanceMetrics = enabled;
    this.panel.webview.postMessage({
      type: 'performanceMetrics',
      enabled
    });
  }
  
  /**
   * Handle messages from webview (e.g., user interactions)
   */
  private handleWebviewMessage(message: any): void {
    switch (message.type) {
      case 'ready':
        // Webview is ready, can send initial data
        break;
      case 'copyCode':
        // Copy code snippet to clipboard
        if (message.code) {
          vscode.env.clipboard.writeText(message.code);
          vscode.window.showInformationMessage('Code copied to clipboard!');
        }
        break;
      case 'openFile':
        // Open file at specific line
        if (message.filePath) {
          const uri = vscode.Uri.file(message.filePath);
          vscode.window.showTextDocument(uri, {
            selection: new vscode.Range(message.line - 1, 0, message.line - 1, 0)
          });
        }
        break;
    }
  }
  
  /**
   * Generate HTML content for webview
   */
  private setHtmlContent(): void {
    const nonce = this.getNonce();
    this.panel.webview.html = this.getHtmlContent(nonce);
  }
  
  /**
   * Get HTML content with proper CSP and styling
   */
  private getHtmlContent(nonce: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>RCA Agent - Analysis</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    
    .header {
      border-bottom: 2px solid var(--vscode-panel-border);
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
    
    #status {
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
    }
    
    .progress-container {
      margin: 20px 0;
      padding: 15px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 6px;
    }
    
    #iteration-text {
      font-weight: bold;
      margin-bottom: 10px;
      color: var(--vscode-foreground);
    }
    
    .progress-bar {
      width: 100%;
      height: 24px;
      background-color: var(--vscode-input-background);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--vscode-input-border);
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, 
        var(--vscode-progressBar-background) 0%, 
        var(--vscode-button-background) 100%);
      transition: width 0.3s ease;
      border-radius: 12px;
    }
    
    .iteration-info {
      margin: 15px 0;
      padding: 12px;
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--vscode-textLink-activeForeground);
      border-radius: 4px;
    }
    
    .iteration-info strong {
      color: var(--vscode-textLink-foreground);
      display: block;
      margin-bottom: 6px;
    }
    
    .thought {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      font-size: 13px;
    }
    
    .result-section {
      margin: 25px 0;
      padding: 15px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 6px;
      border: 1px solid var(--vscode-panel-border);
    }
    
    .result-section h2 {
      color: var(--vscode-textLink-foreground);
      font-size: 18px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .result-section p {
      margin: 8px 0;
    }
    
    .fix-guideline {
      padding: 10px;
      margin: 8px 0;
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-button-background);
      border-radius: 3px;
    }
    
    .code-snippet {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 13px;
      overflow-x: auto;
      margin: 10px 0;
      border: 1px solid var(--vscode-panel-border);
    }
    
    .code-snippet pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 8px;
    }
    
    .badge-red { background-color: rgba(255, 0, 0, 0.2); color: #ff6b6b; }
    .badge-orange { background-color: rgba(255, 165, 0, 0.2); color: #ffa500; }
    .badge-yellow { background-color: rgba(255, 255, 0, 0.2); color: #ffd700; }
    .badge-green { background-color: rgba(0, 255, 0, 0.2); color: #4caf50; }
    .badge-blue { background-color: rgba(0, 123, 255, 0.2); color: #4da6ff; }
    .badge-purple { background-color: rgba(128, 0, 128, 0.2); color: #ba68c8; }
    
    .confidence-bar-container {
      margin: 15px 0;
    }
    
    .confidence-bar {
      width: 100%;
      height: 30px;
      background-color: var(--vscode-input-background);
      border-radius: 15px;
      overflow: hidden;
      position: relative;
      border: 1px solid var(--vscode-input-border);
    }
    
    .confidence-fill {
      height: 100%;
      transition: width 0.5s ease;
      border-radius: 15px;
    }
    
    .confidence-high { background: linear-gradient(90deg, #4caf50, #8bc34a); }
    .confidence-medium { background: linear-gradient(90deg, #ff9800, #ffc107); }
    .confidence-low { background: linear-gradient(90deg, #f44336, #ff5722); }
    
    .confidence-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: bold;
      color: var(--vscode-editor-foreground);
      text-shadow: 0 0 4px var(--vscode-editor-background);
    }
    
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin: 15px 0;
    }
    
    .metadata-item {
      padding: 8px;
      background-color: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      font-size: 13px;
    }
    
    .metadata-label {
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
      display: block;
      margin-bottom: 4px;
    }
    
    .learning-note {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 15px;
      margin: 12px 0;
      border-left: 4px solid var(--vscode-textLink-activeForeground);
      border-radius: 4px;
    }
    
    .learning-note h3 {
      margin: 0 0 10px 0;
      color: var(--vscode-textLink-foreground);
      font-size: 16px;
    }
    
    .educational-toggle {
      position: absolute;
      top: 20px;
      right: 20px;
      padding: 8px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .educational-toggle:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    
    .error-message {
      background-color: rgba(255, 0, 0, 0.1);
      color: var(--vscode-errorForeground);
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid var(--vscode-errorForeground);
      margin: 20px 0;
    }
    
    .tool-badge {
      display: inline-block;
      padding: 3px 8px;
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 10px;
      font-size: 11px;
      margin: 2px;
    }
    
    .doc-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      border-bottom: 1px dashed var(--vscode-textLink-foreground);
    }
    
    .doc-link:hover {
      color: var(--vscode-textLink-activeForeground);
    }
    
    button {
      padding: 6px 12px;
      margin: 5px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    
    .hidden {
      display: none;
    }
    
    /* CHUNK 5.3: Performance Metrics Styles */
    .performance-metrics {
      margin: 20px 0;
      padding: 15px;
      background-color: var(--vscode-textBlockQuote-background);
      border-radius: 6px;
      opacity: 0.7;
      font-size: 0.9em;
      border: 1px solid var(--vscode-panel-border);
    }
    
    .performance-metrics h3 {
      margin: 0 0 12px 0;
      color: var(--vscode-textLink-foreground);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .performance-metrics ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .performance-metrics li {
      padding: 6px 0;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .performance-metrics li:last-child {
      border-bottom: none;
    }
    
    .metrics-label {
      color: var(--vscode-descriptionForeground);
    }
    
    .metrics-value {
      font-weight: bold;
      color: var(--vscode-editor-foreground);
    }
    
    .metrics-toggle {
      background: none;
      border: 1px solid var(--vscode-button-background);
      color: var(--vscode-button-background);
      padding: 4px 8px;
      font-size: 11px;
      margin: 10px 0;
    }
    
    .metrics-toggle:hover {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    
    /* CHUNK 5.4: Accessibility & Loading States */
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--vscode-editor-background) 25%,
        var(--vscode-textBlockQuote-background) 50%,
        var(--vscode-editor-background) 75%
      );
      background-size: 200% 100%;
      animation: loading 1.5s ease-in-out infinite;
      border-radius: 4px;
      height: 20px;
      margin: 8px 0;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .retry-button {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      margin-top: 10px;
    }
    
    .retry-button:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    /* Keyboard focus indicators */
    button:focus,
    .educational-toggle:focus,
    .metrics-toggle:focus {
      outline: 2px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
    
    /* Screen reader only content */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  </style>
</head>
<body>
  <div class="header" role="banner">
    <h1 id="main-title">🔍 Root Cause Analysis</h1>
    <p id="status" role="status" aria-live="polite">Initializing...</p>
  </div>
  
  <div id="progress-container" class="progress-container hidden" role="progressbar" aria-labelledby="iteration-text" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
    <p id="iteration-text">Iteration 0/0</p>
    <div class="progress-bar">
      <div id="progress-fill" class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>
  
  <div id="iteration-display" role="log" aria-label="Analysis iterations"></div>
  <div id="result-display" role="main" aria-label="Analysis results"></div>
  <div id="metrics-display" class="hidden" role="region" aria-label="Performance metrics"></div>
  
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    
    // Notify extension that webview is ready
    vscode.postMessage({ type: 'ready' });
    
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.type) {
        case 'progress':
          handleProgress(message);
          break;
        case 'result':
          handleResult(message);
          break;
        case 'error':
          handleError(message);
          break;
        case 'reset':
          handleReset();
          break;
        case 'educationalMode':
          // Educational mode toggled
          break;
        case 'performanceMetrics':
          // CHUNK 5.3: Performance metrics toggled
          togglePerformanceMetrics(message.enabled);
          break;
        case 'metrics':
          // CHUNK 5.3: Show performance metrics
          showPerformanceMetrics(message.data);
          break;
      }
    });
    
    // CHUNK 5.3: Toggle performance metrics visibility
    function togglePerformanceMetrics(enabled) {
      const metricsDisplay = document.getElementById('metrics-display');
      if (enabled) {
        metricsDisplay.classList.remove('hidden');
      } else {
        metricsDisplay.classList.add('hidden');
      }
    }
    
    // CHUNK 5.3: Show performance metrics
    function showPerformanceMetrics(metrics) {
      const metricsDisplay = document.getElementById('metrics-display');
      
      let metricsHtml = \`
        <div class="performance-metrics">
          <h3>⚡ Performance Metrics</h3>
          <ul>
            <li>
              <span class="metrics-label">Total Time:</span>
              <span class="metrics-value">\${metrics.totalTime}ms</span>
            </li>
            <li>
              <span class="metrics-label">LLM Inference:</span>
              <span class="metrics-value">\${metrics.llmTime}ms</span>
            </li>
            <li>
              <span class="metrics-label">Tool Execution:</span>
              <span class="metrics-value">\${metrics.toolTime}ms</span>
            </li>
            <li>
              <span class="metrics-label">Cache Hit Rate:</span>
              <span class="metrics-value">\${metrics.cacheHitRate}%</span>
            </li>
      \`;
      
      if (metrics.tokenUsage) {
        metricsHtml += \`
            <li>
              <span class="metrics-label">Token Usage:</span>
              <span class="metrics-value">\${metrics.tokenUsage.total} tokens</span>
            </li>
            <li style="font-size: 0.85em; opacity: 0.8;">
              <span class="metrics-label">├─ Prompt:</span>
              <span class="metrics-value">\${metrics.tokenUsage.prompt}</span>
            </li>
            <li style="font-size: 0.85em; opacity: 0.8;">
              <span class="metrics-label">└─ Completion:</span>
              <span class="metrics-value">\${metrics.tokenUsage.completion}</span>
            </li>
        \`;
      }
      
      metricsHtml += \`
          </ul>
          <button class="metrics-toggle" onclick="vscode.postMessage({ type: 'toggleMetrics', enabled: false })">
            Hide Metrics
          </button>
        </div>
      \`;
      
      metricsDisplay.innerHTML = metricsHtml;
      metricsDisplay.classList.remove('hidden');
    }
    
    function handleProgress(message) {
      const progressContainer = document.getElementById('progress-container');
      const status = document.getElementById('status');
      const iterationText = document.getElementById('iteration-text');
      const progressFill = document.getElementById('progress-fill');
      const iterationDisplay = document.getElementById('iteration-display');
      
      progressContainer.classList.remove('hidden');
      status.textContent = 'Analyzing...';
      iterationText.textContent = \`Iteration \${message.iteration}/\${message.maxIterations}\`;
      progressFill.style.width = \`\${message.progress}%\`;
      
      // Add iteration info
      const iterDiv = document.createElement('div');
      iterDiv.className = 'iteration-info';
      iterDiv.innerHTML = \`
        <strong>Iteration \${message.iteration}</strong>
        <span class="thought">\${escapeHtml(message.thought)}</span>
      \`;
      iterationDisplay.appendChild(iterDiv);
      
      // Auto-scroll to latest iteration
      iterDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function handleResult(message) {
      const status = document.getElementById('status');
      const progressFill = document.getElementById('progress-fill');
      const resultDisplay = document.getElementById('result-display');
      
      status.textContent = 'Complete!';
      progressFill.style.width = '100%';
      
      const rca = message.rca;
      const educationalMode = message.educationalMode;
      
      // Build result HTML
      let resultHtml = '';
      
      // Error section with badge
      const badge = getErrorBadge(rca.errorType);
      resultHtml += \`
        <div class="result-section">
          <h2>🐛 Error \${badge}</h2>
          <p><strong>\${escapeHtml(rca.error)}</strong></p>
          <p><small>File: \${escapeHtml(rca.filePath)}:\${rca.line}</small></p>
        </div>
      \`;
      
      // Code snippet
      if (rca.codeSnippet) {
        resultHtml += \`
          <div class="result-section">
            <h2>📝 Code Context</h2>
            <div class="code-snippet">
              <pre>\${escapeHtml(rca.codeSnippet)}</pre>
            </div>
            <button onclick="copyCode(\\\`\${escapeHtml(rca.codeSnippet)}\\\`)">📋 Copy Code</button>
          </div>
        \`;
      }
      
      // Root cause
      resultHtml += \`
        <div class="result-section">
          <h2>💡 Root Cause</h2>
          <p>\${escapeHtml(rca.rootCause)}</p>
        </div>
      \`;
      
      // Fix guidelines
      resultHtml += \`
        <div class="result-section">
          <h2>🛠️ Fix Guidelines</h2>
          \${rca.fixGuidelines.map((guideline, index) => \`
            <div class="fix-guideline">
              <strong>\${index + 1}.</strong> \${escapeHtml(guideline)}
            </div>
          \`).join('')}
        </div>
      \`;
      
      // CHUNK 5.2: Educational mode content
      if (educationalMode && rca.learningNotes && rca.learningNotes.length > 0) {
        resultHtml += \`
          <div class="result-section">
            <h2>🎓 Learning Notes</h2>
            \${rca.learningNotes.map(note => \`
              <div class="learning-note">
                \${escapeHtml(note)}
              </div>
            \`).join('')}
          </div>
        \`;
      }
      
      // Confidence
      const confidencePercent = (rca.confidence * 100).toFixed(0);
      const confidenceClass = rca.confidence >= 0.8 ? 'confidence-high' : 
                             rca.confidence >= 0.6 ? 'confidence-medium' : 
                             'confidence-low';
      const confidenceLabel = rca.confidence >= 0.8 ? 'High Confidence' :
                             rca.confidence >= 0.6 ? 'Medium Confidence' :
                             'Low Confidence';
      
      resultHtml += \`
        <div class="result-section">
          <h2>✅ Confidence</h2>
          <div class="confidence-bar-container">
            <div class="confidence-bar">
              <div class="confidence-fill \${confidenceClass}" style="width: \${confidencePercent}%;"></div>
              <div class="confidence-text">\${confidencePercent}% - \${confidenceLabel}</div>
            </div>
          </div>
        </div>
      \`;
      
      // Metadata
      if (rca.toolsUsed || rca.iterations || rca.latency) {
        resultHtml += \`
          <div class="result-section">
            <h2>📊 Analysis Details</h2>
            <div class="metadata-grid">
              \${rca.iterations ? \`<div class="metadata-item"><span class="metadata-label">Iterations:</span>\${rca.iterations}</div>\` : ''}
              \${rca.latency ? \`<div class="metadata-item"><span class="metadata-label">Latency:</span>\${rca.latency}ms</div>\` : ''}
              \${rca.modelName ? \`<div class="metadata-item"><span class="metadata-label">Model:</span>\${rca.modelName}</div>\` : ''}
              \${rca.fromCache ? \`<div class="metadata-item"><span class="metadata-label">Source:</span>⚡ Cached</div>\` : ''}
            </div>
            \${rca.toolsUsed ? \`
              <p><strong>Tools Used:</strong></p>
              <div>
                \${rca.toolsUsed.map(tool => \`<span class="tool-badge">\${escapeHtml(tool)}</span>\`).join('')}
              </div>
            \` : ''}
          </div>
        \`;
      }
      
      // Documentation results
      if (rca.docResults && rca.docResults.length > 0) {
        resultHtml += \`
          <div class="result-section">
            <h2>📚 Relevant Documentation</h2>
            \${rca.docResults.map((doc, index) => \`
              <div style="margin: 10px 0;">
                <strong>\${index + 1}. \${escapeHtml(doc.title)}</strong><br>
                <p>\${escapeHtml(doc.summary)}</p>
                \${doc.url ? \`<a href="\${doc.url}" class="doc-link" onclick="event.preventDefault(); vscode.postMessage({ type: 'openUrl', url: '\${doc.url}' });">View Documentation →</a>\` : ''}
              </div>
            \`).join('')}
          </div>
        \`;
      }
      
      resultDisplay.innerHTML = resultHtml;
    }
    
    // CHUNK 5.4: Enhanced error handling with retry
    function handleError(message) {
      const resultDisplay = document.getElementById('result-display');
      const status = document.getElementById('status');
      
      status.textContent = 'Error occurred';
      
      // Determine if error is retryable
      const isRetryable = message.retryable !== false; // Default to true
      
      resultDisplay.innerHTML = \`
        <div class="error-message" role="alert" aria-live="assertive">
          <h2>❌ Error</h2>
          <p>\${escapeHtml(message.message)}</p>
          \${message.details ? \`<p><small>\${escapeHtml(message.details)}</small></p>\` : ''}
          \${isRetryable ? \`
            <button class="retry-button" onclick="vscode.postMessage({ type: 'retry' })" aria-label="Retry analysis">
              🔄 Retry Analysis
            </button>
          \` : ''}
        </div>
      \`;
    }
    
    // CHUNK 5.4: Show loading skeleton
    function showLoadingSkeleton() {
      const resultDisplay = document.getElementById('result-display');
      resultDisplay.innerHTML = \`
        <div role="status" aria-label="Loading analysis results">
          <span class="sr-only">Loading analysis results...</span>
          <div class="skeleton" style="width: 80%;"></div>
          <div class="skeleton" style="width: 60%;"></div>
          <div class="skeleton" style="width: 90%;"></div>
          <div class="skeleton" style="width: 70%;"></div>
        </div>
      \`;
    }
    
    function handleReset() {
      document.getElementById('status').textContent = 'Initializing...';
      document.getElementById('progress-container').classList.add('hidden');
      document.getElementById('iteration-display').innerHTML = '';
      document.getElementById('result-display').innerHTML = '';
      document.getElementById('progress-fill').style.width = '0%';
    }
    
    function getErrorBadge(errorType) {
      const badges = {
        'npe': '<span class="badge badge-red">🔴 NPE</span>',
        'lateinit': '<span class="badge badge-orange">🟠 Lateinit</span>',
        'unresolved_reference': '<span class="badge badge-blue">🔵 Unresolved</span>',
        'type_mismatch': '<span class="badge badge-purple">🟣 Type Mismatch</span>',
        'gradle_build': '<span class="badge badge-yellow">🟡 Build Error</span>',
        'gradle_dependency': '<span class="badge badge-yellow">🟡 Dependency</span>',
        'compose_remember': '<span class="badge badge-purple">🎨 Compose</span>',
        'compose_recomposition': '<span class="badge badge-purple">🎨 Compose</span>',
        'xml_inflation': '<span class="badge badge-orange">📄 XML</span>',
        'manifest_permission': '<span class="badge badge-green">📋 Manifest</span>',
      };
      
      // Check for prefixes
      if (errorType.startsWith('compose_')) return '<span class="badge badge-purple">🎨 Compose</span>';
      if (errorType.startsWith('xml_')) return '<span class="badge badge-orange">📄 XML</span>';
      if (errorType.startsWith('gradle_')) return '<span class="badge badge-yellow">🟡 Gradle</span>';
      if (errorType.startsWith('manifest_')) return '<span class="badge badge-green">📋 Manifest</span>';
      
      return badges[errorType] || '<span class="badge">⚪ Unknown</span>';
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function copyCode(code) {
      vscode.postMessage({ type: 'copyCode', code: code });
    }
  </script>
</body>
</html>`;
  }
  
  /**
   * Generate nonce for CSP
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
  /**
   * Dispose webview and cleanup resources
   */
  dispose(): void {
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
