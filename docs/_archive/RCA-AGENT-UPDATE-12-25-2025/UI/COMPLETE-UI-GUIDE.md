# RCA Agent UI/UX Complete Guide

**Complete documentation for transitioning to panel-based interface**

**Status:** Proposal - Pending Review  
**Priority:** HIGH - Major UX Overhaul  
**Target:** Phase 2 - VS Code Extension Enhancement  
**Last Updated:** December 26, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Prerequisites & Environment](#prerequisites--environment)
3. [Design Principles](#design-principles)
4. [Visual Mockups & UI Designs](#visual-mockups--ui-designs)
5. [Technical Architecture](#technical-architecture)
6. [Feature Mapping (Old vs New)](#feature-mapping-old-vs-new)
7. [Step-by-Step Migration Guide](#step-by-step-migration-guide)
8. [Testing & Deployment Strategy](#testing--deployment-strategy)
9. [Success Metrics & Timeline](#success-metrics--timeline)

---

## Executive Summary

### Current Problems
- Too many manual steps (select text → run command → wait)
- No persistent UI presence (hidden until invoked)
- Fragmented features across multiple commands
- Poor discoverability for new users
- No inline error integration

### Proposed Solution
- **Dedicated RCA Agent Panel** (always visible, docked)  
- **Inline error integration** (lightbulb quick actions)  
- **Unified control center** (all features in one place)  
- **Batch error processing** (analyze multiple errors)  
- **Persistent history** (track all analyses)

### Impact Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Steps to analyze** | 4 steps | 1 click | **75% reduction** |
| **Discoverability** | Hidden | Always visible | **∞ improvement** |
| **Batch errors** | 1 at a time | All at once | **10× faster** |
| **Context switching** | High | Low | **60% reduction** |
| **Learning curve** | Moderate | Low | **40% easier** |

---

## Prerequisites & Environment

### Environment Requirements
- **VS Code:** >= 1.80.0
- **Node.js:** >= 18.x
- **TypeScript:** >= 5.0
- **Ollama:** Running locally (http://localhost:11434)
- **Model:** hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

### Pre-Migration Checklist
Before starting implementation:
- [ ] Verify backend code location (`AI_PP_project/src/`)
- [ ] Verify extension code location (`AI_PP_project/vscode-extension/src/`)
- [ ] Test current commands work as expected
- [ ] Document current state persistence mechanism
- [ ] List all existing dependencies
- [ ] Set up test environment
- [ ] Create feature branch: `feature/panel-ui-redesign`

### Development Tools
- **Testing:** Jest, @vscode/test-electron
- **Coverage:** NYC/Istanbul
- **Linting:** ESLint, Prettier
- **Debugging:** VS Code Extension Debugger

---

## Design Principles

### 1. Always Visible, Never Intrusive
- Panel docked to side/bottom (user choice)
- Collapsible when not in use
- Badge notifications for new errors
- Respects VS Code's native UI patterns

### 2. Progressive Disclosure
- Simple interface by default
- Advanced features hidden in dropdowns
- Educational mode toggleable
- Performance metrics optional

### 3. Keyboard-First, Mouse-Optional
- Every action has keyboard shortcut
- Arrow keys navigate error list
- Enter to analyze selected error
- Vim-style navigation support

### 4. Context-Aware Intelligence
- Auto-detects errors in active file
- Suggests related past solutions
- Adapts to user's project type
- Learns from user behavior

---

## Visual Mockups & UI Designs

### Activity Bar Integration

#### Icon Placement
```
┌───┐
│   │ ← Explorer
├───┤
│   │ ← Search
├───┤
│   │ ← Source Control
├───┤
│   │ ← Run & Debug
├───┤
│   │ ← Extensions
├───┤
│   │ ← RCA AGENT (NEW!)
└───┘
```

#### Badge Notifications
- Click icon → Toggle panel visibility
- Right-click → Quick actions menu
- Badge shows count of unanalyzed errors
- Animated gear icon when analyzing

---

### Main Panel Layouts

#### Default State (No Errors)
```
╔═══════════════════════════════════════════════════════╗
║ RCA AGENT                             [⚙️] [📖] [✕] ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║              [▶ Analyze Selected Error]              ║
║                                                       ║
║  ╭───────────────────────────────────────────────╮   ║
║  │        No errors detected                     │   ║
║  │                                               │   ║
║  │   Select error text in editor and            │   ║
║  │      click "Analyze Selected Error"          │   ║
║  │                                               │   ║
║  │   Or use keyboard shortcut:                  │   ║
║  │   • Ctrl+Shift+R (Quick analyze)             │   ║
║  │   • Ctrl+Shift+W (Panel analyze)             │   ║
║  ╰───────────────────────────────────────────────╯   ║
║                                                       ║
║  Tips:                                                ║
║  • Enable auto-detect in settings                    ║
║  • Right-click errors for quick actions              ║
║  • Use educational mode for learning                 ║
╚═══════════════════════════════════════════════════════╝
```

#### Active State (With Errors)
```
╔═══════════════════════════════════════════════════════╗
║ RCA AGENT                             [⚙️] [📖] [✕] ║
╠═══════════════════════════════════════════════════════╣
║ ERROR QUEUE                            [▶ Analyze All]║
╟───────────────────────────────────────────────────────╢
║ ┌─────────────────────────────────────────────────┐   ║
║ │ 🔴 NullPointerException                  Line 42│   ║
║ │    MainActivity.kt                      [Analyze]│   ║
║ ├─────────────────────────────────────────────────┤   ║
║ │ 🟡 Unresolved reference: User            Line 15│   ║
║ │    UserRepository.kt                    [Analyze]│   ║
║ ├─────────────────────────────────────────────────┤   ║
║ │ 🟢 Compose recomposition                Line 88│   ║
║ │    HomeScreen.kt                        [Analyze]│   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║ 📊 CURRENT ANALYSIS                    [⏸ Stop] [⏷] ║
╟───────────────────────────────────────────────────────╢
║ Error: NullPointerException at MainActivity.kt:42     ║
║ Type: kotlin_npe                                      ║
║                                                       ║
║ 🔄 Progress: █████████████░░░░░░░ 65%               ║
║    💭 Analyzing error pattern...                     ║
║                                                       ║
║ Iteration 2 of 3                                      ║
║ Tools used: ReadFileTool, KotlinParser                ║
║ Elapsed: 23.4s                                        ║
╠═══════════════════════════════════════════════════════╣
║ 📜 HISTORY                                      [⏷]  ║
╟───────────────────────────────────────────────────────╢
║ • NPE at MainActivity.kt:42          5 mins ago [↻]   ║
║ • lateinit at UserRepo.kt:28         1 hour ago [↻]   ║
║ • Gradle conflict                    2 hours ago [↻]  ║
╚═══════════════════════════════════════════════════════╝
```

#### Analysis Complete State
```
╔═══════════════════════════════════════════════════════╗
║ ✅ ANALYSIS COMPLETE                                 ║
║ NullPointerException at MainActivity.kt:42            ║
╟───────────────────────────────────────────────────────╢
║ 🎯 ROOT CAUSE                                        ║
║ ┌─────────────────────────────────────────────────┐   ║
║ │ Accessing 'name' property on null User object.  │   ║
║ │ The getUserById() returns null when user not    │   ║
║ │ found, but code doesn't check for null.         │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║ 📝 CODE CONTEXT                         [View File ↗]║
║ ┌─────────────────────────────────────────────────┐   ║
║ │ 40: fun displayUser(id: Int) {               │   ║
║ │ 41:   val user = getUserById(id)             │   ║
║ │ 42: → println(user.name) // 🔥 CRASH HERE    │   ║
║ │ 43:   println(user.email)                    │   ║
║ │ 44: }                                        │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║ 🛠️ FIX GUIDELINES                                    ║
║ ┌─────────────────────────────────────────────────┐   ║
║ │ 1. Use safe call operator                       │   ║
║ │    println(user?.name)              [📋 Copy]  │   ║
║ │                                                 │   ║
║ │ 2. Use Elvis operator with default             │   ║
║ │    val name = user?.name ?: "Unknown"          │   ║
║ │    println(name)                    [📋 Copy]  │   ║
║ │                                                 │   ║
║ │ 3. Check for null explicitly                   │   ║
║ │    if (user != null) {                         │   ║
║ │      println(user.name)                        │   ║
║ │    }                                [📋 Copy]  │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║ 📊 CONFIDENCE: ████████████████████░ 92%            ║
║                                                       ║
║ [👍 Helpful] [👎 Not Helpful] [💬 Feedback]         ║
╚═══════════════════════════════════════════════════════╝
```

---

### Error States

#### Ollama Server Unavailable
```
╔═══════════════════════════════════════════════════════╗
║ ⚠️ OLLAMA SERVER NOT AVAILABLE                       ║
╟───────────────────────────────────────────────────────╢
║  The Ollama server is not responding.                 ║
║                                                       ║
║  Please ensure Ollama is running:                     ║
║  1. Open terminal                                     ║
║  2. Run: ollama serve                                 ║
║  3. Wait for "Ollama is running" message              ║
║                                                       ║
║  Current URL: http://localhost:11434                  ║
║                                                       ║
║  [🔄 Check Connection] [🔧 Change URL] [📋 View Logs]║
╚═══════════════════════════════════════════════════════╝
```

#### Model Not Found
```
╔═══════════════════════════════════════════════════════╗
║ ⚠️ MODEL NOT FOUND                                   ║
╟───────────────────────────────────────────────────────╢
║  The model 'deepseek-r1' is not installed.           ║
║                                                       ║
║  To install the model:                                ║
║  1. Open terminal                                     ║
║  2. Run: ollama pull deepseek-r1                      ║
║  3. Wait for download to complete                     ║
║                                                       ║
║  Alternative models:                                  ║
║  • deepseek-coder (smaller, faster)                   ║
║  • codellama (optimized for code)                     ║
║                                                       ║
║  [⬇️ Install Model] [🔄 Choose Different Model]      ║
╚═══════════════════════════════════════════════════════╝
```

---

### Toolbar & Settings

#### Main Toolbar
```
[▶ Analyze] [⏸] [🔄] [⚙️] [❓] [✕]

▶ Analyze   = Analyze selected/all errors
⏸ Pause     = Stop current analysis
🔄 Refresh   = Reload error queue
⚙️ Settings  = Open settings dropdown
❓ Docs      = Open documentation
✕ Close     = Close panel
```

#### Settings Dropdown (Expanded)
```
┌─────────────────────────────────────────┐
│ ⚙️ SETTINGS                            │
├─────────────────────────────────────────┤
│ Display                                 │
│   ☑ Educational Mode                   │
│   ☐ Performance Metrics                │
│   ☑ Show Confidence Bars               │
│   ☑ Syntax Highlighting                │
│                                         │
│ Behavior                                │
│   ☑ Auto-detect Errors                 │
│   ☑ Auto-save Results                  │
│   ☐ Desktop Notifications              │
│   ☑ Keep Panel Open After Analysis     │
│                                         │
│ Analysis                                │
│ • Max Iterations: [3 ▼]                │
│ • Analysis Mode: [Standard ▼]          │
│   ├─ Fast (1-2 iterations)              │
│   ├─ Standard (3 iterations)            │
│   └─ Deep (5-10 iterations)             │
│                                         │
│ Model Configuration                     │
│ • Model: [DeepSeek-R1 ▼]               │
│ • Ollama URL: [localhost:11434]         │
│ • Timeout: [120s]                       │
│                                         │
│ Advanced                                │
│ • [📋 View Logs]                       │
│ • [🗑️ Clear Cache]                     │
│ • [⚙️ Advanced Settings...]            │
│                                         │
│ [Reset to Defaults] [Apply] [Cancel]   │
└─────────────────────────────────────────┘
```

---

### Inline Editor Integration

#### Lightbulb Quick Actions
```
42: println(user.name) // 💡 Error: NPE
         ↑
         └─ Hover shows lightbulb

Click lightbulb → Quick Actions Menu:
┌────────────────────────────────┐
│ 🤖 Analyze with RCA Agent     │ ← NEW!
│ 🔧 Quick Fix...               │
│ 💡 Explain Problem            │
│ 🚫 Suppress Warning           │
└────────────────────────────────┘
```

#### Peek View (After Analysis)
```
42: println(user.name) // Error
    ──────────────────────────────────────
    │ 🤖 RCA Agent - Analysis Result    │
    │─────────────────────────────────────│
    │ Root Cause: Null reference access   │
    │                                     │
    │ Fix: Use safe call operator         │
    │   println(user?.name)  [Apply Fix] │
    │                                     │
    │ [View Full] [Copy] [Dismiss]       │
    └─────────────────────────────────────┘
```

---

### Status Bar Integration

```
Idle:       🤖 RCA: Ready
Analyzing:  🔄 RCA: Analyzing (2/3) 67%
Errors:     🤖 (3) RCA: 3 errors detected
Error:      ⚠️ RCA: Analysis failed
```

---

## Technical Architecture

### Core Components Overview

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

### File Structure

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
│       └── (from ../src/)           # Imported from root
│
├── resources/                       # NEW - Assets
│   ├── icons/
│   │   ├── rca-agent.svg            # Activity bar icon
│   │   ├── error-red.svg
│   │   └── error-yellow.svg
│   └── webview/
│       ├── styles.css
│       └── scripts.js
│
└── package.json                     # Updated contributions
```

---

### VS Code API Integration

#### 1. Activity Bar Contribution (package.json)

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

#### 2. WebviewView Provider (RCAPanelProvider.ts)

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
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
      </style>
    </head>
    <body>
      <div id="app"></div>
      <script>
        const vscode = acquireVsCodeApi();
      </script>
    </body>
    </html>`;
  }
  
  private _handleMessage(message: any) {
    switch (message.type) {
      case 'analyze':
        vscode.commands.executeCommand('rca-agent.analyzeError');
        break;
    }
  }
}
```

#### 3. TreeView Provider (ErrorTreeProvider.ts)

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
  
  getTreeItem(element: ErrorItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.message,
      vscode.TreeItemCollapsibleState.None
    );
    
    treeItem.iconPath = new vscode.ThemeIcon(
      this._getIcon(element.severity, element.status),
      this._getColor(element.severity)
    );
    
    treeItem.description = `${element.filePath}:${element.line}`;
    
    treeItem.command = {
      command: 'rca-agent.analyzeError',
      title: 'Analyze',
      arguments: [element]
    };
    
    treeItem.contextValue = `error-${element.status}`;
    
    return treeItem;
  }
  
  getChildren(element?: ErrorItem): Thenable<ErrorItem[]> {
    if (element) return Promise.resolve([]);
    
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

#### 4. Code Action Provider (Lightbulb)

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
    
    for (const diagnostic of context.diagnostics) {
      const analyzeAction = new vscode.CodeAction(
        '🤖 Analyze with RCA Agent',
        vscode.CodeActionKind.QuickFix
      );
      
      analyzeAction.command = {
        command: 'rca-agent.analyzeFromDiagnostic',
        title: 'Analyze with RCA Agent',
        arguments: [document, diagnostic]
      };
      
      codeActions.push(analyzeAction);
    }
    
    return codeActions;
  }
}
```

---

### State Management

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
  
  addError(error: ErrorItem): void {
    this._errorQueue.push(error);
    this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
  }
  
  removeError(id: string): void {
    this._errorQueue = this._errorQueue.filter(e => e.id !== id);
    this._saveState();
    this._onErrorQueueChange.fire(this._errorQueue);
  }
  
  addHistoryItem(item: HistoryItem): void {
    this._history.unshift(item);
    if (this._history.length > 100) {
      this._history = this._history.slice(0, 100);
    }
    this._saveState();
  }
}
```

---

### Backend Integration

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

---

## Feature Mapping (Old vs New)

### Core Analysis Features

| Current Feature | Old Location | New Location | Keyboard Shortcut |
|----------------|--------------|--------------|-------------------|
| **Analyze Error (Output)** | Command Palette | Panel "Analyze" button | `Ctrl+Shift+R` |
| **Analyze Error (Webview)** | Command Palette | Panel main view | `Ctrl+Shift+W` |
| **Select Error Text** | Manual selection | Auto-detect + manual | N/A |
| **View Results** | Output channel / Webview | Panel analysis section | N/A |

**Old Flow:**
1. Ctrl+Shift+P (open palette)
2. Type "RCA Agent: Analyze..."
3. Select command
4. Wait for output channel

**New Flow:**
1. Click error in panel OR
2. Press Ctrl+Shift+R (direct)

---

### Display & Preferences

| Current Feature | Old Location | New Location | New UI Element |
|----------------|--------------|--------------|----------------|
| **Educational Mode** | Command: Toggle | Settings dropdown | Checkbox |
| **Performance Metrics** | Command: Toggle | Settings dropdown | Checkbox |
| **Show Logs** | Command Palette | Settings dropdown | Button |
| **Clear Cache** | N/A (new) | Settings dropdown | Button |

---

### Error Management (NEW!)

| Feature | Description | Location |
|---------|-------------|----------|
| **Error Queue** | List of detected errors | Panel top section |
| **Batch Analysis** | Process multiple errors | Panel: [Analyze All] button |
| **Error Prioritization** | Auto-sorted by severity | Critical → High → Medium |
| **Auto-detect Errors** | Scan workspace for errors | Settings toggle |
| **Pin Error** | Keep error at top | Context menu |
| **Remove Error** | Delete from queue | Context menu |

---

### Inline Editor Integration (NEW!)

| Feature | Trigger | Description |
|---------|---------|-------------|
| **Quick Analysis** | Click 💡 on error | Lightbulb menu |
| **Peek View** | Ctrl+K Ctrl+I | Inline peek view |
| **Apply Fix** | Click [Apply Fix] | One-click fix |
| **Copy Fix** | Click [Copy] | Copy to clipboard |

---

### Keyboard Shortcuts

#### Core Shortcuts (Unchanged)
- `Ctrl+Shift+R` - Analyze (Output)
- `Ctrl+Shift+W` - Analyze (Webview)
- `Ctrl+Shift+E` - Toggle Educational Mode

#### New Shortcuts
- `Ctrl+Shift+A` - Toggle Panel
- `Ctrl+Shift+Alt+A` - Analyze All
- `Alt+F8` - Next Error
- `Shift+Alt+F8` - Previous Error
- `Escape` - Stop Analysis

#### Panel Navigation
- `↓` / `Tab` - Next item
- `↑` / `Shift+Tab` - Previous item
- `Enter` - Analyze selected
- `Space` - Expand/Collapse
- `Delete` - Remove item
- `Ctrl+A` - Select all

---

## Step-by-Step Migration Guide

### Overview

**4-Phase Migration Approach:**
1. **Phase 1:** Foundation (Week 1)
2. **Phase 2:** Core Features (Week 2)
3. **Phase 3:** Advanced Features (Week 3)
4. **Phase 4:** Polish & Migration (Week 4)

**Total Duration:** 4 weeks  
**Risk Level:** Low (with proper testing)

---

### Phase 1: Foundation (Week 1)

#### Day 1: Project Setup

**1. Create New Folder Structure**

```bash
cd vscode-extension/src
mkdir panel views commands integrations services
```

**2. Create Type Definitions** (`src/panel/types.ts`)

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

**✅ Success Criteria:**
- [ ] Folder structure created
- [ ] Types defined
- [ ] No compilation errors

---

#### Day 2: Activity Bar Setup

**1. Update package.json**

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

**2. Create Icon** (`resources/icons/rca-agent.svg`)

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
  <circle cx="12" cy="12" r="3" fill="currentColor"/>
</svg>
```

**3. Create Basic Panel Provider** (`src/panel/RCAPanelProvider.ts`)

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

**4. Register in extension.ts**

```typescript
import { RCAPanelProvider } from './panel/RCAPanelProvider';

export function activate(context: vscode.ExtensionContext) {
  // Existing commands...
  
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

**✅ Success Criteria:**
- [ ] Activity bar icon appears
- [ ] Panel opens when icon clicked
- [ ] Basic HTML content displays

---

#### Day 3-5: State Management, Commands, HTML/CSS

*(Detailed implementation steps following the same pattern)*

**✅ Phase 1 Complete:**
- [ ] Panel appears
- [ ] Basic UI works
- [ ] Old commands intact
- [ ] No regressions

---

### Phase 2: Core Features (Week 2)

**Focus:**
- Analysis integration
- Error queue TreeView
- History TreeView
- Settings integration
- Status bar integration

**✅ Phase 2 Complete:**
- [ ] Full analysis workflow works
- [ ] Error queue displays and updates
- [ ] History tracking works
- [ ] Settings integrated

---

### Phase 3: Advanced Features (Week 3)

**Focus:**
- Inline code actions
- Batch analysis
- Auto-detect errors
- Peek view (optional)

**✅ Phase 3 Complete:**
- [ ] Lightbulb integration works
- [ ] Batch analysis functional
- [ ] Auto-detect operational

---

### Phase 4: Polish & Migration (Week 4)

**Focus:**
- UI polish & accessibility
- Documentation
- Testing & bug fixes
- Release preparation

**✅ Phase 4 Complete:**
- [ ] All features polished
- [ ] Documentation complete
- [ ] Tests passing
- [ ] Ready for release

---

## Testing & Deployment Strategy

### Testing Approach

#### Unit Tests
```typescript
describe('StateManager', () => {
  it('should add error to queue', () => {
    const manager = StateManager.getInstance(mockContext);
    manager.addError(mockError);
    expect(manager.getErrorQueue()).toHaveLength(1);
  });
  
  it('should emit change event on queue update', (done) => {
    const manager = StateManager.getInstance(mockContext);
    manager.onErrorQueueChange(() => done());
    manager.addError(mockError);
  });
});
```

#### Integration Tests
```typescript
describe('Panel Integration', () => {
  it('should update panel when analysis completes', async () => {
    const panel = new RCAPanelProvider(mockUri);
    await panel.updateAnalysis(mockResult);
    expect(webview.postMessage).toHaveBeenCalled();
  });
});
```

#### E2E Tests
- User opens extension
- User analyzes error
- Panel displays result
- User applies fix

---

### Deployment Strategy

#### Feature Flags
```typescript
const config = vscode.workspace.getConfiguration('rcaAgent');
const useNewUI = config.get<boolean>('experimental.newUI', false);

if (useNewUI) {
  // Use new panel-based UI
} else {
  // Use old command-based UI
}
```

#### Gradual Migration
1. **Alpha (Week 1):** Internal testing only
2. **Beta (Week 2-3):** Opt-in via setting
3. **Release (Week 4):** Default for all users
4. **Deprecation (Month 2):** Remove old UI

#### Rollback Plan
If issues arise:
1. Set `rcaAgent.experimental.newUI` to `false`
2. Restart VS Code
3. Old UI restored immediately

---

## Success Metrics & Timeline

### Success Metrics

**This redesign is successful if:**
1. ✅ Users can analyze errors in **≤2 clicks** (vs. 4 steps)
2. ✅ **80%+ users** discover RCA Agent without docs
3. ✅ **60%+ reduction** in time-to-first-fix
4. ✅ **90%+ users** prefer new UI (survey)
5. ✅ **Zero increase** in bug reports during migration

---

### Implementation Timeline

#### Week 1: Foundation
- Days 1-2: Project setup & activity bar
- Days 3-5: State management, commands, HTML/CSS

#### Week 2: Core Features
- Days 6-7: Analysis integration
- Days 8-9: Error queue & history
- Day 10: Status bar

#### Week 3: Advanced Features
- Days 11-12: Inline code actions
- Day 13: Batch analysis
- Days 14-15: Auto-detect & peek view

#### Week 4: Polish & Release
- Days 16-17: UI polish
- Day 18: Documentation
- Day 19: Testing & bug fixes
- Day 20: Release preparation

**Total Duration:** 4 weeks (20 working days)

---

### Post-Release Plan

#### Week 1 After Release
- Monitor error reports
- Gather user feedback
- Quick bug fixes

#### Month 1 After Release
- Analyze usage metrics
- Implement quick improvements
- Plan next features

#### Month 3 After Release
- Conduct user survey
- Evaluate success metrics
- Deprecate old UI if successful

---

## Rollback Procedure

### Quick Rollback (< 1 hour)
```json
{
  "rcaAgent.experimental.newUI": false
}
```

### Full Rollback (< 4 hours)
1. Revert package.json changes
2. Remove new panel code
3. Restore old command handlers
4. Test old functionality
5. Publish rollback version

---

## Next Steps

### For Project Lead
1. Review this complete guide
2. Approve/modify/reject proposal
3. Set implementation timeline

### For Developers (if approved)
1. Create branch: `feature/panel-ui-redesign`
2. Follow phase-by-phase implementation
3. Submit PRs for review

### For Users
1. Enable experimental UI: `rcaAgent.experimental.newUI: true`
2. Provide feedback via GitHub issues
3. Complete user survey after testing

---

## References

**Inspiration:**
- VS Code "Problems" panel
- VS Code "Testing" panel
- GitHub Copilot Chat interface
- JetBrains Qodana integration

**Technical References:**
- [VS Code TreeView API](https://code.visualstudio.com/api/extension-guides/tree-view)
- [WebviewView API](https://code.visualstudio.com/api/references/vscode-api#WebviewViewProvider)
- [Activity Bar Contribution](https://code.visualstudio.com/api/references/contribution-points#contributes.viewsContainers)

---

**Status:** Awaiting Approval  
**Last Updated:** December 26, 2025  
**Author:** RCA Agent Development Team

---

*This consolidated guide combines all UI documentation into a single comprehensive resource. All original files can be archived after approval.*
