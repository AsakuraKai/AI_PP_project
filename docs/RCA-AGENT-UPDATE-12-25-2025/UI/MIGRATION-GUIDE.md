# Migration Guide - Implementing Panel-Based UI

**Step-by-step guide to migrate from command-based to panel-based interface**

---

##  Overview

This guide outlines a **4-phase migration** approach that ensures:
- Zero disruption to existing users
- Incremental feature rollout
- Testing at each phase
- Easy rollback if needed

**Total Duration:** 3-4 weeks  
**Team Size:** 1-2 developers  
**Risk Level:** Low (with proper testing)

---

##  Migration Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up panel infrastructure without breaking existing functionality

### Phase 2: Core Features (Week 2)
**Goal:** Implement main panel features (analysis, history, queue)

### Phase 3: Advanced Features (Week 3)
**Goal:** Add inline integration, batch analysis, auto-detect

### Phase 4: Polish & Migration (Week 4)
**Goal:** Improve UX, migrate users, deprecate old code

---

##  Phase 1: Foundation (5 days)

### Day 1: Project Setup

**1.1 Create New Folder Structure**

```bash
cd vscode-extension/src
mkdir panel views commands integrations services
```

**1.2 Update package.json Dependencies**

```json
{
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@vscode/test-electron": "^2.3.0"
  },
  "engines": {
    "vscode": "^1.80.0"
  }
}
```

**1.3 Create Type Definitions**

Create `src/panel/types.ts`:

```typescript
export interface ErrorItem {
  id: string;
  message: string;
  filePath: string;
  line: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium';
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  errorId: string;
  result: RCAResult;
  duration: number;
}

export interface AnalysisProgress {
  iteration: number;
  maxIterations: number;
  progress: number;
  currentThought?: string;
}
```

---

### Day 2: Activity Bar Setup

**2.1 Update package.json Contributions**

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
          "name": "Analysis"
        }
      ]
    }
  }
}
```

**2.2 Create Icon Asset**

Create `resources/icons/rca-agent.svg`:

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
</svg>
```

**2.3 Create Basic Panel Provider**

Create `src/panel/RCAPanelProvider.ts` (skeleton):

```typescript
import * as vscode from 'vscode';

export class RCAPanelProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}
  
  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    
    webviewView.webview.html = this._getHtmlContent();
  }
  
  private _getHtmlContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>RCA Agent</title>
    </head>
    <body>
      <h1>RCA Agent Panel</h1>
      <p>Phase 1: Infrastructure setup complete</p>
    </body>
    </html>`;
  }
}
```

**2.4 Register in extension.ts**

Update `src/extension.ts`:

```typescript
import { RCAPanelProvider } from './panel/RCAPanelProvider';

export function activate(context: vscode.ExtensionContext) {
  // Existing command registrations (keep for backward compatibility)
  // ...existing code...
  
  // NEW: Register panel provider
  const panelProvider = new RCAPanelProvider(context.extensionUri);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'rca-agent.mainPanel',
      panelProvider,
      {
        webviewOptions: { retainContextWhenHidden: true }
      }
    )
  );
}
```

** Testing:** Launch extension, verify activity bar icon appears

---

### Day 3: State Management

**3.1 Create StateManager**

Create `src/panel/StateManager.ts`:

```typescript
import * as vscode from 'vscode';
import { ErrorItem, HistoryItem } from './types';

export class StateManager {
  private static _instance: StateManager;
  private _context: vscode.ExtensionContext;
  
  private _errorQueue: ErrorItem[] = [];
  private _history: HistoryItem[] = [];
  
  private _onErrorQueueChange = new vscode.EventEmitter<ErrorItem[]>();
  readonly onErrorQueueChange = this._onErrorQueueChange.event;
  
  private constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._loadState();
  }
  
  static getInstance(context: vscode.ExtensionContext): StateManager {
    if (!StateManager._instance) {
      StateManager._instance = new StateManager(context);
    }
    return StateManager._instance;
  }
  
  private _loadState(): void {
    this._errorQueue = this._context.globalState.get('errorQueue', []);
    this._history = this._context.globalState.get('history', []);
  }
  
  private async _saveState(): Promise<void> {
    await this._context.globalState.update('errorQueue', this._errorQueue);
    await this._context.globalState.update('history', this._history);
  }
  
  // Queue operations
  addError(error: ErrorItem): void {
    this._errorQueue.push(error);
    this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
  }
  
  getErrorQueue(): ErrorItem[] {
    return [...this._errorQueue];
  }
  
  removeError(id: string): void {
    this._errorQueue = this._errorQueue.filter(e => e.id !== id);
    this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
  }
  
  // History operations
  addHistoryItem(item: HistoryItem): void {
    this._history.unshift(item);
    if (this._history.length > 100) {
      this._history = this._history.slice(0, 100);
    }
    this._saveState();
  }
  
  getHistory(): HistoryItem[] {
    return [...this._history];
  }
}
```

** Testing:** Write unit tests for StateManager

---

### Day 4: Command Refactoring

**4.1 Extract Command Handlers**

Create `src/commands/analyzeCommands.ts`:

```typescript
import * as vscode from 'vscode';
import { StateManager } from '../panel/StateManager';
import { ErrorItem } from '../panel/types';

export function registerAnalyzeCommands(
  context: vscode.ExtensionContext,
  stateManager: StateManager
): void {
  // Existing command (for backward compatibility)
  context.subscriptions.push(
    vscode.commands.registerCommand('rca-agent.analyzeError', async () => {
      // Existing implementation
    })
  );
  
  // NEW: Analyze specific error from queue
  context.subscriptions.push(
    vscode.commands.registerCommand('rca-agent.analyzeFromQueue', async (error: ErrorItem) => {
      // Implementation
    })
  );
}
```

**4.2 Update extension.ts**

```typescript
import { registerAnalyzeCommands } from './commands/analyzeCommands';
import { StateManager } from './panel/StateManager';

export function activate(context: vscode.ExtensionContext) {
  // Initialize state manager
  const stateManager = StateManager.getInstance(context);
  
  // Register commands
  registerAnalyzeCommands(context, stateManager);
  
  // Register panel provider (from Day 2)
  // ...
}
```

** Testing:** Verify old commands still work

---

### Day 5: Panel HTML/CSS

**5.1 Create Webview Content Generator**

Create `src/ui/webview-content.ts`:

```typescript
import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'resources', 'webview', 'styles.css')
  );
  
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <style>
      :root {
        --vscode-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
        padding: 16px;
        margin: 0;
      }
      .section {
        margin-bottom: 20px;
      }
      .button {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 2px;
      }
      .button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
    </style>
  </head>
  <body>
    <div id="app">
      <div class="section">
        <h2>RCA Agent</h2>
        <button class="button" onclick="analyzeError()">Analyze Error</button>
      </div>
      <div id="result"></div>
    </div>
    
    <script>
      const vscode = acquireVsCodeApi();
      
      function analyzeError() {
        vscode.postMessage({ type: 'analyze' });
      }
      
      window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
          case 'result':
            document.getElementById('result').innerHTML = message.html;
            break;
        }
      });
    </script>
  </body>
  </html>`;
}
```

**5.2 Update RCAPanelProvider**

```typescript
import { getWebviewContent } from '../ui/webview-content';

export class RCAPanelProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  
  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    
    webviewView.webview.html = getWebviewContent(
      webviewView.webview,
      this._extensionUri
    );
    
    // Handle messages
    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.type) {
        case 'analyze':
          this._handleAnalyze();
          break;
      }
    });
  }
  
  private _handleAnalyze(): void {
    // Trigger analysis
    vscode.commands.executeCommand('rca-agent.analyzeError');
  }
}
```

** Phase 1 Complete:** Panel appears, basic UI works, old commands intact

---

##  Phase 2: Core Features (5 days)

### Day 6: Analysis Integration

**6.1 Connect Backend to Panel**

Create `src/services/AnalysisService.ts`:

```typescript
import { MinimalReactAgent } from '../backend/agent/MinimalReactAgent';
import { OllamaClient } from '../backend/llm/OllamaClient';
import { ErrorParser } from '../backend/utils/ErrorParser';

export class AnalysisService {
  private agent: MinimalReactAgent;
  private parser: ErrorParser;
  
  constructor(config: { ollamaUrl: string; model: string }) {
    const client = new OllamaClient(config.ollamaUrl, config.model);
    this.agent = new MinimalReactAgent(client);
    this.parser = ErrorParser.getInstance();
  }
  
  async analyzeError(
    errorText: string,
    onProgress: (iteration: number, thought: string, progress: number) => void
  ): Promise<RCAResult> {
    // Parse error
    const parsed = this.parser.parseError(errorText);
    if (!parsed) {
      throw new Error('Could not parse error');
    }
    
    // Set up progress listener
    const stream = this.agent.getStream();
    stream.on('iteration', (data) => {
      onProgress(data.iteration, data.thought, data.progress || 0);
    });
    
    // Analyze
    const result = await this.agent.analyze(parsed);
    return result;
  }
}
```

**6.2 Update Panel to Show Progress**

Update `RCAPanelProvider.ts`:

```typescript
private async _handleAnalyze(): Promise<void> {
  if (!this._view) return;
  
  const errorText = await this._getErrorText();
  
  // Show progress
  this._view.webview.postMessage({
    type: 'progress',
    iteration: 0,
    maxIterations: 3,
    status: 'Starting analysis...'
  });
  
  // Analyze
  const service = new AnalysisService({
    ollamaUrl: 'http://localhost:11434',
    model: 'deepseek-r1'
  });
  
  const result = await service.analyzeError(
    errorText,
    (iteration, thought, progress) => {
      this._view?.webview.postMessage({
        type: 'progress',
        iteration,
        maxIterations: 3,
        progress,
        thought
      });
    }
  );
  
  // Show result
  this._view.webview.postMessage({
    type: 'result',
    data: result
  });
}
```

** Testing:** Analyze error from panel, see real-time progress

---

### Day 7: Error Queue TreeView

**7.1 Create ErrorTreeProvider**

Create `src/views/ErrorTreeProvider.ts` (see PROPOSED-ARCHITECTURE.md for full code)

**7.2 Register TreeView**

Update `extension.ts`:

```typescript
import { ErrorTreeProvider } from './views/ErrorTreeProvider';

export function activate(context: vscode.ExtensionContext) {
  const stateManager = StateManager.getInstance(context);
  const errorTreeProvider = new ErrorTreeProvider(stateManager);
  
  const treeView = vscode.window.createTreeView('rca-agent.errorQueue', {
    treeDataProvider: errorTreeProvider
  });
  
  context.subscriptions.push(treeView);
  
  // Update tree when queue changes
  stateManager.onErrorQueueChange(() => {
    errorTreeProvider.refresh();
  });
}
```

**7.3 Add TreeView to package.json**

```json
{
  "views": {
    "rca-agent": [
      {
        "type": "webview",
        "id": "rca-agent.mainPanel",
        "name": "Analysis"
      },
      {
        "id": "rca-agent.errorQueue",
        "name": "Error Queue",
        "when": "rca-agent.hasErrors"
      }
    ]
  }
}
```

** Testing:** Add errors to queue, verify tree updates

---

### Day 8: History TreeView

**8.1 Create HistoryTreeProvider**

Similar to ErrorTreeProvider but for history items

**8.2 Add History Commands**

```typescript
// View history item
vscode.commands.registerCommand('rca-agent.viewHistory', async (item: HistoryItem) => {
  // Show result in panel
});

// Delete history item
vscode.commands.registerCommand('rca-agent.deleteHistory', async (item: HistoryItem) => {
  stateManager.deleteHistoryItem(item.id);
});

// Clear all history
vscode.commands.registerCommand('rca-agent.clearHistory', async () => {
  const confirm = await vscode.window.showWarningMessage(
    'Clear all history?',
    { modal: true },
    'Yes', 'No'
  );
  if (confirm === 'Yes') {
    stateManager.clearHistory();
  }
});
```

** Testing:** Analyze error, verify it appears in history

---

### Day 9: Settings Integration

**9.1 Add Settings to package.json**

```json
{
  "configuration": {
    "title": "RCA Agent",
    "properties": {
      "rcaAgent.educationalMode": {
        "type": "boolean",
        "default": false,
        "description": "Show learning notes with explanations"
      },
      "rcaAgent.showPerformanceMetrics": {
        "type": "boolean",
        "default": false,
        "description": "Display performance metrics after analysis"
      },
      "rcaAgent.autoDetectErrors": {
        "type": "boolean",
        "default": true,
        "description": "Automatically detect errors and add to queue"
      },
      "rcaAgent.maxIterations": {
        "type": "number",
        "default": 3,
        "minimum": 1,
        "maximum": 10,
        "description": "Maximum reasoning iterations"
      },
      "rcaAgent.ollamaUrl": {
        "type": "string",
        "default": "http://localhost:11434",
        "description": "Ollama server URL"
      },
      "rcaAgent.model": {
        "type": "string",
        "default": "deepseek-r1",
        "description": "LLM model to use"
      }
    }
  }
}
```

**9.2 Create Settings UI in Panel**

Add settings button to panel toolbar (gear icon), open settings UI

** Testing:** Change settings, verify they apply

---

### Day 10: Status Bar Integration

**10.1 Create StatusBarManager**

See PROPOSED-ARCHITECTURE.md for full code

**10.2 Integrate with Analysis**

```typescript
export function activate(context: vscode.ExtensionContext) {
  const statusBar = new StatusBarManager();
  context.subscriptions.push(statusBar);
  
  // Update on queue changes
  stateManager.onErrorQueueChange(queue => {
    if (queue.length > 0) {
      statusBar.setErrorCount(queue.length);
    } else {
      statusBar.setIdle();
    }
  });
  
  // Update during analysis
  analysisService.onProgress((iteration, max, progress) => {
    statusBar.setAnalyzing(iteration, max, progress);
  });
}
```

** Phase 2 Complete:** Full panel functionality with queue, history, analysis

---

##  Phase 3: Advanced Features (5 days)

### Day 11-12: Inline Code Actions

**11.1 Create CodeActionProvider**

See PROPOSED-ARCHITECTURE.md for full code

**11.2 Register Provider**

```typescript
context.subscriptions.push(
  vscode.languages.registerCodeActionsProvider(
    ['kotlin', 'java', 'xml'],
    new RCACodeActionProvider(),
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
    }
  )
);
```

** Testing:** Hover over error, verify lightbulb appears

---

### Day 13: Batch Analysis

**13.1 Add Batch Command**

```typescript
vscode.commands.registerCommand('rca-agent.analyzeAll', async () => {
  const queue = stateManager.getErrorQueue();
  
  for (const error of queue) {
    await analyzeError(error);
  }
});
```

**13.2 Add Batch UI**

Add "Analyze All" button to error queue toolbar

** Testing:** Add multiple errors, analyze all

---

### Day 14: Auto-Detect Errors

**14.1 Create DiagnosticListener**

```typescript
export class DiagnosticListener {
  constructor(private stateManager: StateManager) {
    vscode.languages.onDidChangeDiagnostics(this._onDiagnostics, this);
  }
  
  private _onDiagnostics(event: vscode.DiagnosticChangeEvent): void {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    if (!config.get('autoDetectErrors')) return;
    
    for (const uri of event.uris) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      
      for (const diagnostic of diagnostics) {
        if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
          this.stateManager.addError({
            id: generateId(),
            message: diagnostic.message,
            filePath: uri.fsPath,
            line: diagnostic.range.start.line,
            severity: 'high',
            status: 'pending',
            timestamp: Date.now()
          });
        }
      }
    }
  }
}
```

** Testing:** Open file with error, verify auto-detection

---

### Day 15: Peek View (Optional)

**15.1 Create Peek View**

```typescript
export class RCAPeekViewProvider implements vscode.DocumentPeekProvider {
  providePeekView(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.PeekView> {
    // Show RCA result inline
  }
}
```

** Phase 3 Complete:** Advanced features working

---

##  Phase 4: Polish & Migration (5 days)

### Day 16-17: UI Polish

- Add tooltips to all buttons
- Improve loading states
- Add empty states (no errors, no history)
- Add keyboard shortcuts
- Improve error messages
- Add animations (subtle)

---

### Day 18: Documentation

- Update README.md
- Create MIGRATION.md for users
- Update CHANGELOG.md
- Record demo video

---

### Day 19: Testing & Bug Fixes

- Run full test suite
- Fix any issues
- Performance testing
- Accessibility testing

---

### Day 20: Release Preparation

**20.1 Update package.json**

```json
{
  "version": "0.2.0",
  "displayName": "RCA Agent - Root Cause Analysis",
  "description": "AI-powered error analysis with dedicated panel interface"
}
```

**20.2 Create Release Notes**

```markdown
# v0.2.0 - Panel Interface Release

##  New Features

- **Dedicated Panel:** RCA Agent now has its own panel in the Activity Bar
- **Error Queue:** Auto-detect and queue errors for analysis
- **History:** View past analyses with search and filtering
- **Inline Actions:** Lightbulb integration for quick analysis
- **Batch Analysis:** Analyze multiple errors at once
- **Status Bar:** Real-time analysis progress

##  Migration

Old commands still work! The new panel is available in the Activity Bar.
See [Migration Guide](MIGRATION.md) for details.

##  Deprecation Notice

Command-based workflow will be deprecated in v0.3.0 (6 months).
Please migrate to the new panel interface.
```

**20.3 Release**

1. Merge to main branch
2. Create GitHub release with tag v0.2.0
3. Publish to VS Code Marketplace
4. Announce in VS Code Extensions Discord

** Phase 4 Complete:** Released! 

---

##  Rollback Procedure

If issues arise after release:

### Quick Rollback (< 1 hour)

1. Revert package.json version: `0.2.0` → `0.1.9`
2. Add feature flag to disable panel:

```typescript
const ENABLE_PANEL = false; // Set to false

if (ENABLE_PANEL) {
  // Panel code
}
```

3. Publish emergency patch `0.2.1`

### Full Rollback (< 4 hours)

1. Revert git commits to last stable version
2. Republish v0.1.x to marketplace
3. Investigate issues offline
4. Fix and re-release when ready

---

##  Success Metrics

### Week 1 (Foundation)
-  Activity bar icon appears
-  Basic panel renders
-  Old commands still work
-  Unit tests passing

### Week 2 (Core)
-  Error analysis works from panel
-  Progress updates in real-time
-  History saves correctly
-  Integration tests passing

### Week 3 (Advanced)
-  Auto-detect adds errors to queue
-  Batch analysis completes
-  Lightbulb actions work
-  E2E tests passing

### Week 4 (Polish)
-  UI polished and accessible
-  Documentation complete
-  Zero critical bugs
-  Performance < 1s panel open

### Post-Release (Month 1)
- Target: 70%+ users adopt panel
- Target: <5 critical bug reports
- Target: Positive user feedback
- Target: Performance maintained

---

##  Training Materials

### For Users

**Quick Start Guide:**
1. Click RCA Agent icon in Activity Bar (left sidebar)
2. Errors will auto-detect and appear in Error Queue
3. Click an error to analyze
4. View results in main panel
5. Check History tab for past analyses

**Video Tutorial:**
- 3-minute overview of new interface
- Demo of error queue and batch analysis
- Tips for inline lightbulb actions

### For Developers

**Code Walkthrough:**
- Architecture overview (PROPOSED-ARCHITECTURE.md)
- Key components and their responsibilities
- Extension points for customization
- Testing strategy

**Contributing Guide:**
- How to add new error parsers
- How to add new tools
- How to test changes
- Code style guidelines

---

##  Pre-Launch Checklist

### Code Quality
- [ ] All tests passing (unit, integration, E2E)
- [ ] Test coverage >85%
- [ ] No ESLint warnings
- [ ] TypeScript strict mode enabled
- [ ] Code reviewed by peer

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API documentation complete
- [ ] Migration guide written
- [ ] Release notes drafted

### Testing
- [ ] Manual testing on Windows
- [ ] Manual testing on Mac
- [ ] Manual testing on Linux
- [ ] Accessibility testing (screen reader)
- [ ] Performance profiling

### Release
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] GitHub release created
- [ ] VS Code Marketplace published
- [ ] Social media announced

---

##  Post-Launch Plan

### Week 1 After Release
- Monitor error reports (GitHub Issues)
- Track adoption metrics (telemetry)
- Respond to user feedback
- Fix critical bugs immediately

### Month 1 After Release
- Gather user feedback survey
- Analyze usage patterns
- Plan improvements for v0.3.0
- Begin deprecation warnings for old commands

### Month 3 After Release
- Increase deprecation warnings
- Blog post about benefits of new UI
- Email campaign to inactive users

### Month 6 After Release
- Remove old command-based code
- Release v0.3.0 with only panel interface
- Celebrate successful migration! 

---

**Migration Status:**  Ready to Execute  
**Estimated Timeline:** 3-4 weeks  
**Risk Level:** Low (with proper testing)  
**Team Size:** 1-2 developers

**Next Steps:**
1. Review this guide with team
2. Set up project tracking (GitHub Projects)
3. Begin Phase 1 Day 1
4. Daily standups for progress updates
