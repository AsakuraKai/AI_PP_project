# Proposed Architecture - RCA Agent Panel UI

**Technical design and implementation details for the panel-based interface**

---

##  Architecture Overview

The new panel-based architecture uses VS Code's native extension APIs to create a persistent, integrated user experience.

### Core Components

```
┌─────────────────────────────────────────────────┐
│ VS Code Extension Host                          │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ RCA Agent Extension                      │  │
│  │                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐ │  │
│  │  │ Activity Bar   │  │ TreeView       │ │  │
│  │  │ Contribution   │──│ Provider       │ │  │
│  │  └────────────────┘  └───────┬────────┘ │  │
│  │                              │          │  │
│  │  ┌────────────────┐          │          │  │
│  │  │ WebviewView    │──────────┘          │  │
│  │  │ Provider       │                     │  │
│  │  └───────┬────────┘                     │  │
│  │          │                              │  │
│  │  ┌───────────────────────────────────┐ │  │
│  │  │ RCA Panel Manager                  │ │  │
│  │  │ • Error Queue                      │ │  │
│  │  │ • Analysis Engine                  │ │  │
│  │  │ • History Manager                  │ │  │
│  │  │ • State Synchronizer               │ │  │
│  │  └────────────────────────────────────┘ │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │ Backend Integration (Kai's code)   │ │  │
│  │  │ • OllamaClient                     │ │  │
│  │  │ • MinimalReactAgent                │ │  │
│  │  │ • ErrorParser                      │ │  │
│  │  │ • ChromaDBClient                   │ │  │
│  │  └────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

##  File Structure

### New File Organization

```
vscode-extension/
├── src/
│   ├── extension.ts                 # Main entry point (refactored)
│   │
│   ├── panel/                       # NEW - Panel components
│   │   ├── RCAPanelProvider.ts      # Main panel provider
│   │   ├── ErrorQueueManager.ts     # Error queue logic
│   │   ├── HistoryManager.ts        # Analysis history
│   │   ├── StateManager.ts          # Global state
│   │   └── types.ts                 # Panel-specific types
│   │
│   ├── views/                       # NEW - TreeView components
│   │   ├── ErrorTreeProvider.ts     # Error list TreeView
│   │   ├── HistoryTreeProvider.ts   # History TreeView
│   │   └── TreeItem.ts              # Custom tree items
│   │
│   ├── ui/                          # Existing - Refactored
│   │   ├── RCAWebview.ts            # Now used IN panel
│   │   └── webview-content.ts       # HTML/CSS generation
│   │
│   ├── commands/                    # NEW - Command handlers
│   │   ├── analyzeCommands.ts       # Analysis commands
│   │   ├── panelCommands.ts         # Panel control
│   │   └── historyCommands.ts       # History commands
│   │
│   ├── integrations/                # NEW - Editor integration
│   │   ├── CodeActionProvider.ts    # Lightbulb actions
│   │   ├── DiagnosticProvider.ts    # Error detection
│   │   └── PeekViewProvider.ts      # Inline peek view
│   │
│   ├── services/                    # NEW - Business logic
│   │   ├── AnalysisService.ts       # Analysis orchestration
│   │   ├── CacheService.ts          # Cache management
│   │   └── NotificationService.ts   # Notifications
│   │
│   └── backend/                     # Existing - Kai's code
│       ├── (from ../src/)           # Imported from root
│       └── ...
│
├── resources/                       # NEW - Assets
│   ├── icons/
│   │   ├── rca-agent.svg            # Activity bar icon
│   │   ├── error-red.svg
│   │   ├── error-yellow.svg
│   │   └── ...
│   └── webview/
│       ├── styles.css
│       └── scripts.js
│
└── package.json                     # Updated contributions
```

---

##  VS Code API Integration

### 1. Activity Bar Contribution

**package.json:**
```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "rca-agent",
          "title": "RCA Agent",
          "icon": "resources/icons/rca-agent.svg"
        }
      ]
    },
    "views": {
      "rca-agent": [
        {
          "type": "webview",
          "id": "rca-agent.mainPanel",
          "name": "Analysis",
          "contextualTitle": "RCA Agent"
        },
        {
          "id": "rca-agent.errorQueue",
          "name": "Error Queue",
          "when": "rca-agent.hasErrors"
        },
        {
          "id": "rca-agent.history",
          "name": "History",
          "when": "rca-agent.hasHistory"
        }
      ]
    }
  }
}
```

**Implementation (extension.ts):**
```typescript
export function activate(context: vscode.ExtensionContext) {
  // Register panel provider
  const panelProvider = new RCAPanelProvider(context.extensionUri);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'rca-agent.mainPanel',
      panelProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );
  
  // Register TreeView providers
  const errorQueueProvider = new ErrorTreeProvider();
  const historyProvider = new HistoryTreeProvider();
  
  vscode.window.createTreeView('rca-agent.errorQueue', {
    treeDataProvider: errorQueueProvider
  });
  
  vscode.window.createTreeView('rca-agent.history', {
    treeDataProvider: historyProvider
  });
}
```

---

### 2. WebviewView Provider

**RCAPanelProvider.ts:**
```typescript
import * as vscode from 'vscode';

export class RCAPanelProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  
  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);
    
    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      message => this._handleMessage(message)
    );
  }
  
  // Update panel with analysis result
  public updateAnalysis(result: RCAResult) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'analysisComplete',
        data: result
      });
    }
  }
  
  // Update progress
  public updateProgress(progress: number, status: string) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'progress',
        progress,
        status
      });
    }
  }
  
  private _getHtmlContent(webview: vscode.Webview): string {
    // Generate HTML with CSS variables for theming
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 16px;
        }
        /* ...more styles... */
      </style>
    </head>
    <body>
      <div id="app">
        <!-- React-style dynamic content -->
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        // ...webview logic...
      </script>
    </body>
    </html>`;
  }
  
  private _handleMessage(message: any) {
    switch (message.type) {
      case 'analyze':
        // Trigger analysis
        break;
      case 'applyFix':
        // Apply fix to editor
        break;
      case 'copyCode':
        // Copy to clipboard
        break;
    }
  }
}
```

---

### 3. TreeView Provider (Error Queue)

**ErrorTreeProvider.ts:**
```typescript
import * as vscode from 'vscode';

interface ErrorItem {
  id: string;
  message: string;
  filePath: string;
  line: number;
  severity: 'critical' | 'high' | 'medium';
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
}

export class ErrorTreeProvider implements vscode.TreeDataProvider<ErrorItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ErrorItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
  private errors: ErrorItem[] = [];
  
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
  
  addError(error: ErrorItem): void {
    this.errors.push(error);
    this.refresh();
  }
  
  removeError(id: string): void {
    this.errors = this.errors.filter(e => e.id !== id);
    this.refresh();
  }
  
  getTreeItem(element: ErrorItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.message,
      vscode.TreeItemCollapsibleState.None
    );
    
    // Icon based on severity and status
    treeItem.iconPath = new vscode.ThemeIcon(
      this._getIcon(element.severity, element.status),
      this._getColor(element.severity)
    );
    
    // Description shows file and line
    treeItem.description = `${element.filePath}:${element.line}`;
    
    // Tooltip shows full error
    treeItem.tooltip = new vscode.MarkdownString(
      `**${element.message}**\n\n` +
      `File: ${element.filePath}\n` +
      `Line: ${element.line}\n` +
      `Status: ${element.status}`
    );
    
    // Command to analyze on click
    treeItem.command = {
      command: 'rca-agent.analyzeError',
      title: 'Analyze',
      arguments: [element]
    };
    
    // Context value for context menu
    treeItem.contextValue = `error-${element.status}`;
    
    return treeItem;
  }
  
  getChildren(element?: ErrorItem): Thenable<ErrorItem[]> {
    if (element) {
      return Promise.resolve([]);
    }
    
    // Sort by severity
    const sorted = this.errors.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    return Promise.resolve(sorted);
  }
  
  private _getIcon(severity: string, status: string): string {
    if (status === 'analyzing') return 'sync~spin';
    if (status === 'complete') return 'check';
    if (status === 'failed') return 'error';
    
    return severity === 'critical' ? 'circle-filled' : 'circle-outline';
  }
  
  private _getColor(severity: string): vscode.ThemeColor {
    const colors = {
      critical: new vscode.ThemeColor('errorForeground'),
      high: new vscode.ThemeColor('warningForeground'),
      medium: new vscode.ThemeColor('descriptionForeground')
    };
    return colors[severity as keyof typeof colors];
  }
}
```

---

### 4. Code Action Provider (Lightbulb)

**CodeActionProvider.ts:**
```typescript
import * as vscode from 'vscode';

export class RCACodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const codeActions: vscode.CodeAction[] = [];
    
    // Check if there are diagnostics (errors) in this range
    for (const diagnostic of context.diagnostics) {
      // Create "Analyze with RCA Agent" action
      const analyzeAction = new vscode.CodeAction(
        ' Analyze with RCA Agent',
        vscode.CodeActionKind.QuickFix
      );
      
      analyzeAction.command = {
        command: 'rca-agent.analyzeFromDiagnostic',
        title: 'Analyze with RCA Agent',
        arguments: [document, diagnostic]
      };
      
      analyzeAction.isPreferred = false; // Not the default action
      codeActions.push(analyzeAction);
      
      // Create "Explain Problem" action
      const explainAction = new vscode.CodeAction(
        ' Explain Problem (RCA)',
        vscode.CodeActionKind.QuickFix
      );
      
      explainAction.command = {
        command: 'rca-agent.explainProblem',
        title: 'Explain Problem',
        arguments: [document, diagnostic]
      };
      
      codeActions.push(explainAction);
    }
    
    return codeActions;
  }
}

// Register in extension.ts:
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ['kotlin', 'java', 'xml'],
      new RCACodeActionProvider(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
      }
    )
  );
}
```

---

### 5. Status Bar Integration

**StatusBarManager.ts:**
```typescript
import * as vscode from 'vscode';

export class StatusBarManager {
  private _statusBarItem: vscode.StatusBarItem;
  
  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    
    this._statusBarItem.command = 'rca-agent.togglePanel';
    this._statusBarItem.show();
    this.setIdle();
  }
  
  setIdle(): void {
    this._statusBarItem.text = '$(robot) RCA: Ready';
    this._statusBarItem.tooltip = 'Click to open RCA Agent panel';
    this._statusBarItem.backgroundColor = undefined;
  }
  
  setAnalyzing(iteration: number, max: number, progress: number): void {
    this._statusBarItem.text = 
      `$(sync~spin) RCA: Analyzing (${iteration}/${max}) ${progress}%`;
    this._statusBarItem.tooltip = 'Analysis in progress...';
    this._statusBarItem.backgroundColor = 
      new vscode.ThemeColor('statusBarItem.warningBackground');
  }
  
  setErrorCount(count: number): void {
    this._statusBarItem.text = `$(robot) (${count}) RCA: ${count} errors detected`;
    this._statusBarItem.tooltip = `${count} unanalyzed errors. Click to view.`;
    this._statusBarItem.backgroundColor = 
      new vscode.ThemeColor('statusBarItem.errorBackground');
  }
  
  setComplete(success: boolean): void {
    if (success) {
      this._statusBarItem.text = '$(check) RCA: Complete';
      this._statusBarItem.backgroundColor = undefined;
    } else {
      this._statusBarItem.text = '$(error) RCA: Failed';
      this._statusBarItem.backgroundColor = 
        new vscode.ThemeColor('statusBarItem.errorBackground');
    }
    
    // Reset after 5 seconds
    setTimeout(() => this.setIdle(), 5000);
  }
  
  dispose(): void {
    this._statusBarItem.dispose();
  }
}
```

---

##  State Management

### Global State Manager

**StateManager.ts:**
```typescript
import * as vscode from 'vscode';

interface GlobalState {
  errorQueue: ErrorItem[];
  analysisHistory: HistoryItem[];
  currentAnalysis?: AnalysisState;
  settings: UserSettings;
}

interface AnalysisState {
  errorId: string;
  iteration: number;
  maxIterations: number;
  progress: number;
  startTime: number;
}

export class StateManager {
  private _context: vscode.ExtensionContext;
  private _state: GlobalState;
  private _onStateChange = new vscode.EventEmitter<GlobalState>();
  
  readonly onStateChange = this._onStateChange.event;
  
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._state = this._loadState();
  }
  
  // Load state from VS Code's global state
  private _loadState(): GlobalState {
    return {
      errorQueue: this._context.globalState.get('errorQueue', []),
      analysisHistory: this._context.globalState.get('history', []),
      currentAnalysis: undefined,
      settings: this._loadSettings()
    };
  }
  
  // Save state to VS Code's global state
  private async _saveState(): Promise<void> {
    await this._context.globalState.update('errorQueue', this._state.errorQueue);
    await this._context.globalState.update('history', this._state.analysisHistory);
    this._onStateChange.fire(this._state);
  }
  
  // Error queue operations
  addError(error: ErrorItem): void {
    this._state.errorQueue.push(error);
    this._saveState();
  }
  
  removeError(id: string): void {
    this._state.errorQueue = this._state.errorQueue.filter(e => e.id !== id);
    this._saveState();
  }
  
  getErrorQueue(): ErrorItem[] {
    return [...this._state.errorQueue];
  }
  
  // Analysis state operations
  startAnalysis(errorId: string, maxIterations: number): void {
    this._state.currentAnalysis = {
      errorId,
      iteration: 0,
      maxIterations,
      progress: 0,
      startTime: Date.now()
    };
    this._onStateChange.fire(this._state);
  }
  
  updateAnalysisProgress(iteration: number, progress: number): void {
    if (this._state.currentAnalysis) {
      this._state.currentAnalysis.iteration = iteration;
      this._state.currentAnalysis.progress = progress;
      this._onStateChange.fire(this._state);
    }
  }
  
  completeAnalysis(result: RCAResult): void {
    if (this._state.currentAnalysis) {
      const duration = Date.now() - this._state.currentAnalysis.startTime;
      
      // Add to history
      this._state.analysisHistory.unshift({
        id: generateId(),
        timestamp: Date.now(),
        error: this._state.currentAnalysis.errorId,
        result,
        duration
      });
      
      // Limit history to 100 items
      if (this._state.analysisHistory.length > 100) {
        this._state.analysisHistory = this._state.analysisHistory.slice(0, 100);
      }
      
      // Remove from queue
      this.removeError(this._state.currentAnalysis.errorId);
      
      // Clear current analysis
      this._state.currentAnalysis = undefined;
      
      this._saveState();
    }
  }
  
  // History operations
  getHistory(): HistoryItem[] {
    return [...this._state.analysisHistory];
  }
  
  deleteHistoryItem(id: string): void {
    this._state.analysisHistory = this._state.analysisHistory.filter(h => h.id !== id);
    this._saveState();
  }
  
  clearHistory(): void {
    this._state.analysisHistory = [];
    this._saveState();
  }
  
  // Settings operations
  private _loadSettings(): UserSettings {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    return {
      educationalMode: config.get('educationalMode', false),
      performanceMetrics: config.get('showPerformanceMetrics', false),
      autoDetect: config.get('autoDetectErrors', true),
      // ...more settings
    };
  }
  
  updateSettings(settings: Partial<UserSettings>): void {
    this._state.settings = { ...this._state.settings, ...settings };
    this._onStateChange.fire(this._state);
  }
}
```

---

##  Backend Integration

### Connecting to Kai's Code

**AnalysisService.ts:**
```typescript
// Import backend components from root src directory
import { MinimalReactAgent } from '../../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../../src/llm/OllamaClient';
import { ErrorParser } from '../../../src/utils/ErrorParser';
import { RCACache } from '../../../src/cache/RCACache';
import { ChromaDBClient } from '../../../src/db/ChromaDBClient';

export class AnalysisService {
  private agent: MinimalReactAgent;
  private parser: ErrorParser;
  private cache: RCACache;
  private db: ChromaDBClient;
  
  constructor(config: {
    ollamaUrl: string;
    model: string;
    chromaUrl: string;
  }) {
    // Initialize Kai's components
    const ollamaClient = new OllamaClient(config.ollamaUrl, config.model);
    this.agent = new MinimalReactAgent(ollamaClient);
    this.parser = ErrorParser.getInstance();
    this.cache = RCACache.getInstance();
    this.db = new ChromaDBClient(config.chromaUrl);
  }
  
  async analyzeError(
    errorText: string,
    onProgress?: (iteration: number, thought: string) => void
  ): Promise<RCAResult> {
    // 1. Parse error
    const parsed = this.parser.parseError(errorText);
    if (!parsed) {
      throw new Error('Could not parse error');
    }
    
    // 2. Check cache
    const cached = await this.cache.get(errorText);
    if (cached) {
      return { ...cached, fromCache: true };
    }
    
    // 3. Run agent analysis
    const stream = this.agent.getStream();
    
    if (onProgress) {
      stream.on('iteration', (data) => {
        onProgress(data.iteration, data.thought);
      });
    }
    
    const result = await this.agent.analyze(parsed);
    
    // 4. Store in cache and DB
    await this.cache.set(errorText, result);
    await this.db.storeRCA(result, parsed);
    
    return result;
  }
  
  async searchSimilar(errorText: string): Promise<RCAResult[]> {
    return await this.db.searchSimilar(errorText, 5);
  }
  
  async provideFeedback(
    rcaId: string,
    helpful: boolean,
    comment?: string
  ): Promise<void> {
    await this.db.storeFeedback(rcaId, helpful, comment);
  }
}
```

---

##  Error Handling Architecture

### Centralized Error Handling

**ErrorHandler.ts:**
```typescript
export class ErrorHandler {
  static async handle(error: Error, context: string): Promise<void> {
    // Log error
    logger.error(`[${context}]`, error);
    
    // Check error type
    if (error instanceof OllamaUnavailableError) {
      vscode.window.showErrorMessage(
        'Ollama server not running. Start it with: ollama serve',
        'Open Settings', 'Dismiss'
      ).then(action => {
        if (action === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'rcaAgent.ollamaUrl');
        }
      });
    } else if (error instanceof ParseError) {
      vscode.window.showErrorMessage(
        `Could not parse error format: ${error.message}`,
        'View Logs'
      );
    } else if (error instanceof TimeoutError) {
      vscode.window.showWarningMessage(
        'Analysis timed out. Try Fast mode or increase timeout in settings.',
        'Settings', 'Retry'
      );
    } else {
      vscode.window.showErrorMessage(
        `Analysis failed: ${error.message}`,
        'Report Issue', 'View Logs'
      );
    }
    
    // Track telemetry
    TelemetryReporter.trackError(error, context);
  }
}
```

### Health Check System

**HealthChecker.ts:**
```typescript
export class HealthChecker {
  async checkOllama(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async checkModel(url: string, model: string): Promise<boolean> {
    const tags = await this.getModels(url);
    return tags.includes(model);
  }
}
```

##  Performance Considerations

### 1. Lazy Loading

- Load webview content only when panel is visible
- Initialize backend components on first use
- Cache compiled webview HTML

### 2. Memory Management & Resource Cleanup

**Disposal Pattern:**
```typescript
export class RCAPanelProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private _disposables: vscode.Disposable[] = [];
  
  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }
  
  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    
    // Track disposables
    this._disposables.push(
      webviewView.webview.onDidReceiveMessage(this._handleMessage, this),
      webviewView.onDidDispose(this._onDidDispose, this)
    );
  }
  
  dispose() {
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      disposable?.dispose();
    }
  }
  
  private _onDidDispose() {
    this._view = undefined;
    // Cancel any ongoing analysis
    if (this._currentAnalysis) {
      this._currentAnalysis.cancel();
    }
  }
}
```

**Memory Limits:**
- Limit error queue to 50 items (auto-trim oldest)
- Limit history to 100 items (LRU eviction)
- Clean up cache entries after 24h
- Dispose event listeners on panel close
- Cancel pending analysis on reload

##  Telemetry & Monitoring

### Telemetry Reporter

**TelemetryReporter.ts:**
```typescript
import TelemetryReporter from '@vscode/extension-telemetry';

export class RCATelemetryReporter {
  private static _reporter: TelemetryReporter;
  
  static initialize(extensionId: string, version: string, key: string) {
    this._reporter = new TelemetryReporter(extensionId, version, key);
  }
  
  static trackPanelOpen(): void {
    this._reporter?.sendTelemetryEvent('panel.open');
  }
  
  static trackAnalysisStart(source: 'panel' | 'command' | 'inline'): void {
    this._reporter?.sendTelemetryEvent('analysis.start', { source });
  }
  
  static trackAnalysisComplete(duration: number, success: boolean): void {
    this._reporter?.sendTelemetryEvent('analysis.complete', 
      { success: String(success) },
      { duration }
    );
  }
  
  static trackError(error: Error, context: string): void {
    this._reporter?.sendTelemetryErrorEvent('error', {
      context,
      errorType: error.constructor.name,
      message: error.message
    });
  }
  
  static trackFeatureUsage(feature: string): void {
    this._reporter?.sendTelemetryEvent('feature.used', { feature });
  }
  
  dispose() {
    this._reporter?.dispose();
  }
}
```

**Usage in extension.ts:**
```typescript
export function activate(context: vscode.ExtensionContext) {
  // Initialize telemetry (with user consent)
  if (vscode.workspace.getConfiguration('rcaAgent').get('enableTelemetry', true)) {
    RCATelemetryReporter.initialize(
      'rca-agent',
      context.extension.packageJSON.version,
      process.env.TELEMETRY_KEY || ''
    );
  }
  
  // Track activation
  RCATelemetryReporter.trackFeatureUsage('extension.activated');
  
  // ... rest of activation
}

export function deactivate() {
  RCATelemetryReporter.dispose();
}
```

### 3. Responsiveness

- Use web workers for heavy computations in webview
- Stream analysis progress instead of blocking
- Debounce UI updates (max 100ms refresh rate)

---

##  Testing Strategy

### Unit Tests

```typescript
// test/unit/ErrorQueueManager.test.ts
describe('ErrorQueueManager', () => {
  it('should add error to queue', () => {
    // ...
  });
  
  it('should prioritize critical errors', () => {
    // ...
  });
  
  it('should remove analyzed errors', () => {
    // ...
  });
});
```

### Integration Tests

```typescript
// test/integration/panel.test.ts
describe('RCA Panel Integration', () => {
  it('should open panel on activation', async () => {
    // ...
  });
  
  it('should analyze error from queue', async () => {
    // ...
  });
  
  it('should update UI on progress', async () => {
    // ...
  });
});
```

### E2E Tests

```typescript
// test/e2e/workflow.test.ts
describe('Complete Workflow', () => {
  it('should detect, analyze, and fix error', async () => {
    // 1. Open file with error
    // 2. Error auto-detected
    // 3. Analyze from panel
    // 4. Apply fix
    // 5. Verify error resolved
  });
});
```

---

##  Deployment Strategy

### 1. Feature Flags

```typescript
// Control rollout with feature flags
const FEATURE_FLAGS = {
  enablePanel: true,
  enableAutoDetect: false,  // Gradual rollout
  enableBatchAnalysis: false,
  enablePeekView: false
};
```

### 2. Gradual Migration

- Phase 1: Panel available, old commands work
- Phase 2: Migrate users to panel, keep fallback
- Phase 3: Deprecate old commands (with warnings)
- Phase 4: Remove old code (6 months notice)

### 3. Rollback Plan

- Keep old implementation as `extension-legacy.ts`
- Feature flag to switch between old/new
- Monitor error rates and user feedback
- Quick rollback if issues detected

---

**Architecture Status:**  Ready for Implementation  
**Estimated Effort:** 2-3 weeks (1 senior developer)  
**Dependencies:** VS Code API 1.80+, Node.js 18+
