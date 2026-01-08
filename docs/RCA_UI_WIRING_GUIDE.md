# RCA Agent UI Wiring Guide

> **Document Purpose**: Complete reference for future UI implementation  
> **Created**: January 8, 2026  
> **Status**: All UI components removed - Ready for fresh implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Overview](#architecture-overview)
3. [Component Mapping](#component-mapping)
4. [Backend Services](#backend-services)
5. [Command Registry](#command-registry)
6. [UI State Management](#ui-state-management)
7. [Integration Points](#integration-points)
8. [Wiring Instructions](#wiring-instructions)

---

## Overview

This document maps **every function to its UI component** for the RCA Agent VS Code extension. All existing UI components have been removed, and this serves as the blueprint for future implementation.

### Removed Components

The following UI components have been completely removed:

#### **Panel Components** (`vscode-extension/src/panel/`)
- `RCAPanelProvider.ts` - Main webview panel provider
- `StateManager.ts` - Global state management
- `ErrorQueueManager.ts` - Error queue management
- `webview-content.ts` - HTML/CSS/JS generation for webview
- `EmptyStateTemplates.ts` - Empty state templates
- `ErrorBoundary.ts` - Error boundary wrapper
- `types.ts` - Panel-specific type definitions

#### **View Components** (`vscode-extension/src/views/`)
- `ErrorTreeProvider.ts` - Error queue tree view
- `HistoryTreeProvider.ts` - Analysis history tree view
- `AgentStateViewer.ts` - Agent state visualization
- `VirtualScrollProvider.ts` - Virtual scrolling for large lists

#### **Integration Components** (`vscode-extension/src/integrations/`)
- `RCACodeActionProvider.ts` - Quick fix code actions (lightbulb)
- `RCADiagnosticProvider.ts` - Error detection/highlighting
- `RCAHoverProvider.ts` - Hover tooltips
- `StatusBarManager.ts` - Status bar integration
- `RealtimeErrorDetector.ts` - Real-time error detection
- `BaseProvider.ts` - Base class for providers

#### **UI Components** (`vscode-extension/src/ui/`)
- `RCAWebview.ts` - Standalone webview panel

#### **Command Handlers** (`vscode-extension/src/commands/`)
- `BatchAnalysisCommands.ts` - Batch analysis commands
- `TreeViewCommands.ts` - Tree view commands
- `ChatActionCommands.ts` - Chat action commands
- `InlineIntegrationCommands.ts` - Inline integration commands
- `BaseCommandHandler.ts` - Base command handler

#### **Services** (`vscode-extension/src/services/`)
- `AccessibilityService.ts` - Accessibility support
- `ThemeManager.ts` - Theme detection/switching
- `PerformanceMonitor.ts` - Performance tracking
- `FeatureFlagManager.ts` - Feature flag management

#### **Package.json Contributions**
- Activity bar container (`rca-agent`)
- Webview panel view (`rca-agent.mainPanel`)
- Error queue tree view (`rca-agent.errorQueue`)
- History tree view (`rca-agent.history`)
- 40+ commands for UI interactions

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              UI Layer (TO BE BUILT)                │ │
│  │                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │ │
│  │  │ Activity Bar │  │ Panel/Views  │  │ Status   │ │ │
│  │  │ Container    │  │ (Webview)    │  │ Bar      │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │ │
│  │         │                 │                │       │ │
│  │         └─────────────────┴────────────────┘       │ │
│  │                          │                         │ │
│  └──────────────────────────┼─────────────────────────┘ │
│                             │                           │
│  ┌──────────────────────────┼─────────────────────────┐ │
│  │         Backend Services │ (AVAILABLE)             │ │
│  │                          ▼                         │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ AnalysisService                              │ │ │
│  │  │ - analyzeError()                             │ │ │
│  │  │ - analyzeErrorWithSettings()                 │ │ │
│  │  │ - cancelAnalysis()                           │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ FixApplicationService                        │ │ │
│  │  │ - applyFix()                                 │ │ │
│  │  │ - validateFix()                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │ Core Backend (Kai's Implementation)          │ │ │
│  │  │ - MultiPassAgent                             │ │ │
│  │  │ - OllamaClient                               │ │ │
│  │  │ - ErrorParser                                │ │ │
│  │  │ - ChromaDBClient                             │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → UI Component → Command Handler → Backend Service → Core Backend
     ↑                                                                  │
     └──────────────────── Progress Updates ←──────────────────────────┘
```

---

## Component Mapping

### 1. Activity Bar & Panel

#### **Activity Bar Container**
**What it does**: Adds RCA Agent icon to VS Code's left sidebar

**Backend Functions**:
- None (UI registration only)

**Wiring Instructions**:
```json
// package.json
"viewsContainers": {
  "activitybar": [
    {
      "id": "rca-agent",
      "title": "RCA Agent",
      "icon": "resources/icons/rca-agent.svg"
    }
  ]
}
```

**Icon Location**: `resources/icons/rca-agent.svg` (still exists)

---

#### **Main Panel (Webview)**
**What it does**: Primary analysis interface with live updates

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `analyzeError(errorItem, progressCallback)` | AnalysisService | Start error analysis |
| `analyzeErrorWithSettings(errorItem, settings, progressCallback)` | AnalysisService | Analyze with custom settings |
| `cancelAnalysis()` | AnalysisService | Cancel ongoing analysis |
| `applyFix(result, documentUri, edit)` | FixApplicationService | Apply fix to code |

**UI States to Implement**:
1. **Empty State** - No errors detected
   - Show: Welcome message, "Start analyzing" button
   - Wire to: `RealtimeErrorDetector.detectErrors()`

2. **Queue State** - Errors waiting
   - Show: List of pending errors, "Analyze" button
   - Wire to: `AnalysisService.analyzeError()`

3. **Analyzing State** - Analysis in progress
   - Show: Progress bar, agent iterations, current thought
   - Wire to: `AnalysisService.analyzeError()` progress callbacks
   - Update from: `AgentState` updates

4. **Complete State** - Analysis finished
   - Show: Root cause, fix suggestions, confidence score
   - Wire to: 
     - Apply fix: `FixApplicationService.applyFix()`
     - Explain more: Chat participant
     - Search similar: History search

5. **Error State** - Analysis failed
   - Show: Error message, retry button
   - Wire to: `AnalysisService.analyzeError()` (retry)

**Message Handlers** (Webview ↔ Extension):

```typescript
// Messages FROM webview TO extension
type WebviewMessage =
  | { type: 'analyze'; errorId?: string }           // → AnalysisService.analyzeError()
  | { type: 'analyzeNew' }                          // → AnalysisService.analyzeError() (new error)
  | { type: 'analyzeAll' }                          // → Batch analysis
  | { type: 'cancel' }                              // → AnalysisService.cancelAnalysis()
  | { type: 'applyFix'; result: RCAResult }         // → FixApplicationService.applyFix()
  | { type: 'copyCode'; code: string }              // → Clipboard API
  | { type: 'openSettings' }                        // → VS Code settings
  | { type: 'toggleEducationalMode'; enabled: boolean } // → Config update
  | { type: 'refreshQueue' }                        // → Re-detect errors
  | { type: 'removeError'; errorId: string }        // → Queue management
  | { type: 'viewHistory'; itemId: string }         // → History service
  | { type: 'exportAnalysis'; result: RCAResult }   // → Export service

// Messages FROM extension TO webview
type ExtensionMessage =
  | { type: 'stateUpdate'; state: PanelState }      // State changed
  | { type: 'progressUpdate'; progress: AgentState } // Analysis progress
  | { type: 'analysisComplete'; result: RCAResult }  // Analysis done
  | { type: 'analysisError'; error: string }         // Analysis failed
  | { type: 'settingsUpdate'; settings: PanelSettings } // Settings changed
```

**Wiring Instructions**:
```typescript
// extension.ts
const panelProvider = new RCAPanelProvider(context.extensionUri, context);
context.subscriptions.push(
  vscode.window.registerWebviewViewProvider(
    'rca-agent.mainPanel',
    panelProvider,
    { webviewOptions: { retainContextWhenHidden: true } }
  )
);
```

---

### 2. Error Queue Tree View

#### **Error Queue TreeView**
**What it does**: Lists all detected errors with status indicators

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `analyzeError(errorItem, progressCallback)` | AnalysisService | Analyze selected error |
| `removeError(errorId)` | State Management | Remove from queue |
| `clearQueue()` | State Management | Clear all errors |
| `pinError(errorId)` | State Management | Pin error to top |

**Data Source**:
- Errors from: `RCADiagnosticProvider` (real-time detection)
- Error format: `ErrorItem` interface

**UI Features to Implement**:
- Icon-based severity (error/warning/info)
- Status badges (pending/analyzing/complete/failed)
- Context menu actions
- Keyboard navigation
- Virtual scrolling for large lists (>100 items)

**Tree Item Structure**:
```typescript
interface ErrorTreeItem {
  id: string;
  label: string;              // Error message
  description: string;        // File path + line
  iconPath: ThemeIcon;        // Severity icon
  contextValue: string;       // For context menu
  command?: Command;          // Click action
  tooltip: MarkdownString;    // Hover tooltip
}
```

**Context Menu Commands**:
- "Analyze Error" → `AnalysisService.analyzeError()`
- "Go to Location" → `vscode.window.showTextDocument()`
- "Remove from Queue" → Queue management
- "Pin Error" → Queue management

**Wiring Instructions**:
```typescript
// extension.ts
const errorTreeProvider = new ErrorTreeProvider(context, errorQueueManager);
context.subscriptions.push(
  vscode.window.registerTreeDataProvider(
    'rca-agent.errorQueue',
    errorTreeProvider
  )
);
```

---

### 3. History Tree View

#### **History TreeView**
**What it does**: Shows past analyses with timestamps

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `getHistory()` | State Management | Retrieve history items |
| `reanalyzeError(historyItem)` | AnalysisService | Re-run analysis |
| `deleteHistoryItem(itemId)` | State Management | Delete history entry |
| `exportHistory(itemId)` | Export Service | Export to markdown |

**Data Source**:
- History from: `StateManager.getHistory()`
- Item format: `HistoryItem` interface

**UI Features to Implement**:
- Chronological grouping (Today, Yesterday, This Week)
- Status indicators (successful/failed)
- Search/filter capability
- Export functionality

**Tree Item Structure**:
```typescript
interface HistoryTreeItem {
  id: string;
  label: string;              // Error type + timestamp
  description: string;        // Result summary
  iconPath: ThemeIcon;        // Success/fail icon
  contextValue: string;       // For context menu
  command?: Command;          // Click to view
  children?: HistoryTreeItem[]; // For grouping
}
```

**Context Menu Commands**:
- "View Analysis" → Show results in panel
- "Reanalyze" → `AnalysisService.analyzeError()`
- "Export" → Export to markdown
- "Delete" → Remove from history
- "Mark Helpful/Unhelpful" → Feedback system

**Wiring Instructions**:
```typescript
// extension.ts
const historyTreeProvider = new HistoryTreeProvider(context, stateManager);
context.subscriptions.push(
  vscode.window.registerTreeDataProvider(
    'rca-agent.history',
    historyTreeProvider
  )
);
```

---

### 4. Status Bar Integration

#### **Status Bar Item**
**What it does**: Shows RCA status in bottom status bar

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `getErrorCount()` | State Management | Get pending error count |
| `isAnalyzing()` | AnalysisService | Check if analyzing |

**UI States**:
1. **Idle**: `$(check) RCA: Ready`
2. **Analyzing**: `$(sync~spin) RCA: Analyzing (2/5)`
3. **Has Errors**: `$(warning) RCA: 3 errors`
4. **Error**: `$(error) RCA: Failed`

**Click Action**: Toggle panel visibility

**Wiring Instructions**:
```typescript
// extension.ts
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);
statusBarItem.command = 'rcaAgent.togglePanel';
statusBarItem.show();
```

---

### 5. Editor Integrations

#### **Code Actions Provider (Lightbulb)**
**What it does**: Shows "Analyze with RCA Agent" in editor lightbulb menu

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `analyzeFromDiagnostic(diagnostic)` | AnalysisService | Analyze error at cursor |

**Trigger Conditions**:
- Cursor on diagnostic (error/warning)
- Diagnostic is from supported language (Kotlin, Java, XML)

**UI Actions**:
- "🤖 Analyze with RCA Agent" → `AnalysisService.analyzeFromDiagnostic()`

**Wiring Instructions**:
```typescript
// extension.ts
const codeActionProvider = new RCACodeActionProvider(analysisService);
context.subscriptions.push(
  vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: '*' },
    codeActionProvider,
    { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
  )
);
```

---

#### **Diagnostic Provider**
**What it does**: Real-time error detection and highlighting

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `parseError(errorText)` | ErrorParser | Parse build/runtime errors |
| `detectErrors()` | RealtimeErrorDetector | Scan workspace for errors |

**Detection Sources**:
1. **Build Output** - Gradle/Maven errors
2. **Terminal Output** - Runtime exceptions
3. **File Changes** - On save/edit
4. **Workspace Scan** - Manual trigger

**UI Features**:
- Squiggly underlines in editor
- Problem panel integration
- Severity levels (error/warning/info)

**Wiring Instructions**:
```typescript
// extension.ts
const diagnosticProvider = new RCADiagnosticProvider();
const diagnosticCollection = vscode.languages.createDiagnosticCollection('rca-agent');
context.subscriptions.push(diagnosticCollection);
```

---

#### **Hover Provider**
**What it does**: Shows error details on hover

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `getErrorInfo(diagnostic)` | State Management | Get error details |
| `getCachedResult(errorHash)` | ChromaDBClient | Get cached analysis |

**Hover Content**:
- Error message
- Error type
- Quick actions (Analyze, Ignore)
- Cached result preview (if available)

**Wiring Instructions**:
```typescript
// extension.ts
const hoverProvider = new RCAHoverProvider(stateManager);
context.subscriptions.push(
  vscode.languages.registerHoverProvider(
    { scheme: 'file', language: '*' },
    hoverProvider
  )
);
```

---

### 6. Agent State Viewer

#### **Agent State Webview**
**What it does**: Visualizes agent's thought process in real-time

**Backend Functions**:
| Function | Service | Purpose |
|----------|---------|---------|
| `subscribeToStateUpdates()` | AgentStateStream | Receive state updates |

**UI Features**:
- Iteration counter
- Current hypothesis
- Tool usage visualization
- Consensus building progress

**State Updates**:
```typescript
interface AgentState {
  iteration: number;
  maxIterations: number;
  currentHypothesis: string;
  toolsUsed: string[];
  consensusScore?: number;
  thoughts: string[];
  observations: string[];
}
```

**Wiring Instructions**:
```typescript
// extension.ts
const agentStateViewer = new AgentStateViewer(context.extensionUri);
// Subscribe to AnalysisService progress updates
analysisService.onProgress(state => {
  agentStateViewer.updateState(state);
});
```

---

## Backend Services

### Available Services (READY TO USE)

#### **1. AnalysisService**
**Location**: `vscode-extension/src/services/AnalysisService.ts`

**Purpose**: Orchestrates error analysis with backend

**Key Methods**:
```typescript
class AnalysisService {
  // Initialize backend components (Ollama, ChromaDB, etc.)
  async initialize(): Promise<void>
  
  // Analyze a single error with progress callback
  async analyzeError(
    errorItem: ErrorItem,
    progressCallback?: ProgressCallback
  ): Promise<RCAResult>
  
  // Analyze with custom settings (iterations, hypotheses, etc.)
  async analyzeErrorWithSettings(
    errorItem: ErrorItem,
    settings: AnalysisSettings,
    progressCallback?: ProgressCallback
  ): Promise<RCAResult>
  
  // Cancel ongoing analysis
  cancelAnalysis(): void
  
  // Check if analysis is running
  isAnalyzing(): boolean
  
  // Get analysis history
  getHistory(): HistoryItem[]
}
```

**Progress Callback**:
```typescript
type ProgressCallback = (progress: AgentState) => void;

interface AgentState {
  iteration: number;
  maxIterations: number;
  currentHypothesis: string;
  toolsUsed: string[];
  thoughts: string[];
  observations: string[];
  consensusScore?: number;
}
```

**Usage Example**:
```typescript
const analysisService = AnalysisService.getInstance();
await analysisService.initialize();

const result = await analysisService.analyzeError(
  errorItem,
  (progress) => {
    // Update UI with progress
    webview.postMessage({
      type: 'progressUpdate',
      progress
    });
  }
);
```

---

#### **2. FixApplicationService**
**Location**: `vscode-extension/src/services/FixApplicationService.ts`

**Purpose**: Applies code fixes to workspace

**Key Methods**:
```typescript
class FixApplicationService {
  // Apply fix from RCA result
  async applyFix(
    result: RCAResult,
    documentUri: vscode.Uri,
    edit: vscode.WorkspaceEdit
  ): Promise<boolean>
  
  // Validate fix before applying
  async validateFix(
    result: RCAResult
  ): Promise<ValidationResult>
  
  // Preview fix changes
  async previewFix(
    result: RCAResult
  ): Promise<DiffPreview>
}
```

**Usage Example**:
```typescript
const fixService = new FixApplicationService();
const success = await fixService.applyFix(
  rcaResult,
  document.uri,
  workspaceEdit
);

if (success) {
  vscode.window.showInformationMessage('Fix applied successfully');
}
```

---

#### **3. NetworkTimeoutHandler**
**Location**: `vscode-extension/src/services/NetworkTimeoutHandler.ts`

**Purpose**: Handles Ollama connection timeouts gracefully

**Key Methods**:
```typescript
class NetworkTimeoutHandler {
  // Wrap async operation with timeout
  async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number
  ): Promise<T>
  
  // Check if Ollama is available
  async checkOllamaAvailability(): Promise<boolean>
}
```

---

### Core Backend Components (Kai's Implementation)

These are the underlying services that power the AnalysisService:

#### **1. MultiPassAgent**
**Location**: `src/agent/MultiPassAgent.ts`

**Purpose**: Multi-pass RCA agent with hypothesis generation

**Key Features**:
- Generates multiple hypotheses
- Iterative refinement
- Consensus building
- Tool usage

---

#### **2. OllamaClient**
**Location**: `src/llm/OllamaClient.ts`

**Purpose**: LLM communication via Ollama

**Key Features**:
- Streaming responses
- Model selection
- Retry logic
- Error handling

---

#### **3. ErrorParser**
**Location**: `src/utils/ErrorParser.ts`

**Purpose**: Parse build/runtime errors

**Key Features**:
- Gradle error parsing
- Stack trace parsing
- Multi-language support (Kotlin, Java, XML)

---

#### **4. ChromaDBClient**
**Location**: `src/db/ChromaDBClient.ts`

**Purpose**: Vector database for caching analyses

**Key Features**:
- Semantic search
- Result caching
- Similarity matching

---

## Command Registry

### Complete Command List

All commands that need UI implementation:

#### **Analysis Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rcaAgent.analyzeError` | Analyze Error | `AnalysisService.analyzeError()` |
| `rcaAgent.analyzeErrorWebview` | Analyze Error (Webview) | `AnalysisService.analyzeError()` + show webview |
| `rca-agent.analyzeAll` | Analyze All Errors | Batch: `AnalysisService.analyzeError()` for each |
| `rca-agent.analyzePending` | Analyze Pending Errors | Batch: `AnalysisService.analyzeError()` for pending |
| `rca-agent.analyzeFromDiagnostic` | Analyze from Diagnostic | `AnalysisService.analyzeFromDiagnostic()` |
| `rca-agent.analyzeCurrentError` | Analyze Current Error | `AnalysisService.analyzeError()` at cursor |
| `rca-agent.cancelBatch` | Cancel Batch Analysis | `AnalysisService.cancelAnalysis()` |

---

#### **Queue Management Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rca-agent.refreshErrorQueue` | Refresh Error Queue | `RealtimeErrorDetector.detectErrors()` |
| `rca-agent.clearErrorQueue` | Clear Error Queue | `ErrorQueueManager.clearQueue()` |
| `rca-agent.clearCompleted` | Clear Completed Errors | `ErrorQueueManager.clearCompleted()` |
| `rca-agent.removeError` | Remove Error | `ErrorQueueManager.removeError(id)` |
| `rca-agent.pinError` | Pin Error | `ErrorQueueManager.pinError(id)` |
| `rca-agent.unpinError` | Unpin Error | `ErrorQueueManager.unpinError(id)` |
| `rca-agent.openErrorLocation` | Go to Error Location | `vscode.window.showTextDocument()` |

---

#### **History Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rca-agent.refreshHistory` | Refresh History | `StateManager.getHistory()` |
| `rca-agent.clearHistory` | Clear History | `StateManager.clearHistory()` |
| `rca-agent.deleteHistoryItem` | Delete History Item | `StateManager.deleteHistoryItem(id)` |
| `rca-agent.reanalyzeHistoryItem` | Reanalyze | `AnalysisService.analyzeError()` |
| `rca-agent.exportHistoryItem` | Export Analysis | Export to markdown |
| `rca-agent.viewHistoryItem` | View Analysis | Show in panel |
| `rca-agent.markHelpful` | Mark as Helpful | Feedback system |
| `rca-agent.markUnhelpful` | Mark as Unhelpful | Feedback system |

---

#### **Fix Application Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rca-agent.applyFix` | Apply Fix | `FixApplicationService.applyFix()` |
| `rca-agent.explainMore` | Show Detailed Explanation | Chat participant |
| `rca-agent.searchSimilar` | Search Similar Issues | History search |

---

#### **Panel Control Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rcaAgent.togglePanel` | Toggle Panel | `vscode.commands.executeCommand('rca-agent.mainPanel.focus')` |
| `rcaAgent.checkUIStatus` | Check UI Status | Show configuration info |

---

#### **Settings Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rcaAgent.toggleEducationalMode` | Toggle Educational Mode | Config: `rcaAgent.educationalMode` |
| `rcaAgent.togglePerformanceMetrics` | Toggle Performance Metrics | Config: `rcaAgent.showPerformanceMetrics` |
| `rca-agent.toggleRealtimeDetection` | Toggle Realtime Detection | Config: `rcaAgent.realtimeDetection` |
| `rca-agent.detectErrors` | Detect Errors | `RealtimeErrorDetector.detectErrors()` |

---

#### **Debug/Developer Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rcaAgent.showAgentState` | Show Agent State | Show AgentStateViewer |
| `rcaAgent.showLearningMetrics` | Show Learning Metrics | Show metrics panel |
| `rca-agent.showPerformanceMetrics` | Show Performance Metrics | `PerformanceMonitor.getMetrics()` |
| `rca-agent.toggleFeatureFlag` | Toggle Feature Flag | `FeatureFlagManager.toggle()` |

---

#### **Navigation Commands**

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rca-agent.nextError` | Next Error | Navigate to next error in queue |
| `rca-agent.previousError` | Previous Error | Navigate to previous error in queue |

---

## UI State Management

### State Types

#### **1. PanelState**
Represents the entire panel's state

```typescript
interface PanelState {
  view: 'empty' | 'queue' | 'analyzing' | 'complete' | 'error';
  errorQueue: ErrorItem[];
  currentError?: ErrorItem;
  currentResult?: RCAResult;
  analysisProgress?: AgentState;
  history: HistoryItem[];
  settings: PanelSettings;
}
```

#### **2. ErrorItem**
Represents an error in the queue

```typescript
interface ErrorItem {
  id: string;
  timestamp: number;
  message: string;
  type: string;
  filePath: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  result?: RCAResult;
  isPinned?: boolean;
}
```

#### **3. HistoryItem**
Represents a past analysis

```typescript
interface HistoryItem {
  id: string;
  timestamp: number;
  error: ErrorItem;
  result: RCAResult;
  duration: number;
  wasSuccessful: boolean;
  feedback?: 'helpful' | 'unhelpful';
}
```

#### **4. RCAResult**
Analysis result from backend

```typescript
interface RCAResult {
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
  rcaId?: string;
  errorHash?: string;
  learningNotes?: string[];
}
```

#### **5. AgentState**
Agent's current state during analysis

```typescript
interface AgentState {
  iteration: number;
  maxIterations: number;
  currentHypothesis: string;
  toolsUsed: string[];
  thoughts: string[];
  observations: string[];
  consensusScore?: number;
}
```

#### **6. PanelSettings**
User-configurable settings

```typescript
interface PanelSettings {
  educationalMode: boolean;
  showPerformanceMetrics: boolean;
  maxIterations: number;
  numHypotheses: number;
  enableConsensus: boolean;
  realtimeDetection: boolean;
  autoAnalyze: boolean;
}
```

---

### State Management Pattern

#### **Singleton StateManager** (needs reimplementation)

```typescript
class StateManager {
  private static _instance: StateManager;
  private _panelState: PanelState;
  private _onStateChangeEmitter: vscode.EventEmitter<PanelState>;
  
  static getInstance(context: vscode.ExtensionContext): StateManager {
    if (!StateManager._instance) {
      StateManager._instance = new StateManager(context);
    }
    return StateManager._instance;
  }
  
  // Get current state
  getState(): PanelState {
    return this._panelState;
  }
  
  // Update state
  updateState(updates: Partial<PanelState>): void {
    this._panelState = { ...this._panelState, ...updates };
    this._onStateChangeEmitter.fire(this._panelState);
  }
  
  // Listen to state changes
  onStateChange(listener: (state: PanelState) => void): vscode.Disposable {
    return this._onStateChangeEmitter.event(listener);
  }
  
  // Persist state to disk
  private async persist(): Promise<void> {
    await this._context.globalState.update('rcaAgentState', this._panelState);
  }
  
  // Load state from disk
  private async load(): Promise<void> {
    const saved = await this._context.globalState.get<PanelState>('rcaAgentState');
    if (saved) {
      this._panelState = saved;
    }
  }
}
```

---

## Integration Points

### 1. Extension Initialization

**File**: `vscode-extension/src/extension.ts`

**Initialization Sequence**:

```typescript
export async function activate(context: vscode.ExtensionContext) {
  // 1. Initialize backend services
  const analysisService = AnalysisService.getInstance();
  await analysisService.initialize();
  
  // 2. Initialize state management
  const stateManager = StateManager.getInstance(context);
  
  // 3. Initialize error queue manager
  const errorQueueManager = ErrorQueueManager.getInstance(context);
  
  // 4. Register UI providers
  // - Activity bar panel
  // - Tree views
  // - Status bar
  // - Code actions
  // - Diagnostics
  // - Hover
  
  // 5. Register commands
  // - Analysis commands
  // - Queue management
  // - History
  // - Settings
  
  // 6. Start real-time error detection (if enabled)
  if (config.get('realtimeDetection')) {
    const detector = new RealtimeErrorDetector();
    detector.start();
  }
}
```

---

### 2. Webview Communication

**Pattern**: Message passing between webview and extension

**Setup**:
```typescript
// In provider
webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
  switch (message.type) {
    case 'analyze':
      await handleAnalyze(message.errorId);
      break;
    case 'cancel':
      analysisService.cancelAnalysis();
      break;
    // ... other handlers
  }
});

// Send message to webview
webviewView.webview.postMessage({
  type: 'progressUpdate',
  progress: agentState
});
```

---

### 3. Event Listeners

**Key Events to Wire**:

```typescript
// State changes
stateManager.onStateChange(state => {
  // Update all UI components
  panelProvider.updateWebview(state);
  errorTreeProvider.refresh();
  historyTreeProvider.refresh();
  statusBarManager.updateStatus(state);
});

// Analysis progress
analysisService.onProgress(progress => {
  // Update progress UI
  panelProvider.updateProgress(progress);
  agentStateViewer.updateState(progress);
});

// Error queue changes
errorQueueManager.onQueueChange(queue => {
  // Update error tree view
  errorTreeProvider.refresh();
  statusBarManager.updateErrorCount(queue.length);
});

// File system changes
vscode.workspace.onDidSaveTextDocument(doc => {
  // Trigger error detection
  if (config.get('realtimeDetection')) {
    realtimeDetector.scanDocument(doc);
  }
});

// Diagnostic changes
vscode.languages.onDidChangeDiagnostics(event => {
  // Update error queue from diagnostics
  diagnosticProvider.updateFromDiagnostics(event);
});
```

---

## Wiring Instructions

### Step-by-Step Implementation Guide

#### **Phase 1: Foundation** (1-2 days)

1. **Create State Management**
   - Implement `StateManager` singleton
   - Define all state interfaces
   - Add persistence (globalState)
   - Add event emitters

2. **Create Error Queue Manager**
   - Implement `ErrorQueueManager` singleton
   - Add queue operations (add, remove, clear, pin)
   - Add event emitters
   - Integrate with StateManager

3. **Register Activity Bar**
   - Add viewsContainers to package.json
   - Create activity bar icon SVG
   - Test: Icon appears in activity bar

---

#### **Phase 2: Main Panel** (3-4 days)

1. **Create Panel Provider**
   - Implement `RCAPanelProvider`
   - Register webview view provider
   - Create basic HTML structure

2. **Implement Panel States**
   - Empty state HTML
   - Queue state HTML
   - Analyzing state HTML
   - Complete state HTML
   - Error state HTML

3. **Wire Message Handlers**
   - Handle analyze command
   - Handle cancel command
   - Handle apply fix command
   - Handle settings changes

4. **Connect to AnalysisService**
   - Call `analyzeError()` on analyze
   - Subscribe to progress updates
   - Update UI with progress
   - Show results on completion

---

#### **Phase 3: Tree Views** (2-3 days)

1. **Implement Error Queue TreeView**
   - Create `ErrorTreeProvider`
   - Register tree data provider
   - Implement tree item generation
   - Add context menu commands
   - Connect to ErrorQueueManager

2. **Implement History TreeView**
   - Create `HistoryTreeProvider`
   - Register tree data provider
   - Implement tree item generation
   - Add context menu commands
   - Connect to StateManager

3. **Add Virtual Scrolling** (optional, for large lists)
   - Implement `VirtualScrollProvider`
   - Integrate with tree providers
   - Test with 1000+ items

---

#### **Phase 4: Editor Integrations** (2-3 days)

1. **Implement Code Actions**
   - Create `RCACodeActionProvider`
   - Register code actions provider
   - Add "Analyze with RCA Agent" action
   - Connect to AnalysisService

2. **Implement Diagnostics**
   - Create `RCADiagnosticProvider`
   - Register diagnostic collection
   - Detect errors in real-time
   - Update error queue

3. **Implement Hover**
   - Create `RCAHoverProvider`
   - Register hover provider
   - Show error details on hover
   - Add quick actions

4. **Implement Status Bar**
   - Create `StatusBarManager`
   - Create status bar item
   - Update status on state changes
   - Add click to toggle panel

---

#### **Phase 5: Commands** (1-2 days)

1. **Register All Commands**
   - Analysis commands
   - Queue management commands
   - History commands
   - Settings commands
   - Navigation commands

2. **Wire Command Handlers**
   - Connect each command to backend function
   - Add error handling
   - Show user feedback (notifications)

---

#### **Phase 6: Polish** (2-3 days)

1. **Add Accessibility**
   - Keyboard navigation
   - Screen reader support
   - High contrast themes

2. **Add Theme Support**
   - Detect VS Code theme
   - Apply theme colors
   - Support custom themes

3. **Add Performance Monitoring**
   - Track analysis latency
   - Monitor memory usage
   - Add performance metrics UI

4. **Add Feature Flags**
   - Implement feature flag system
   - Add debug mode
   - Add experimental features toggle

---

### Testing Checklist

#### **Unit Tests**

- [ ] StateManager: State updates, persistence, events
- [ ] ErrorQueueManager: Queue operations, pinning
- [ ] AnalysisService: Mock backend calls
- [ ] FixApplicationService: Fix validation, application

#### **Integration Tests**

- [ ] Panel → AnalysisService: Analyze error flow
- [ ] Tree views → Commands: Context menu actions
- [ ] Code actions → AnalysisService: Lightbulb analyze
- [ ] Status bar → Panel: Click to toggle

#### **E2E Tests**

- [ ] Full analysis workflow: Detect → Queue → Analyze → Fix
- [ ] Real-time detection: File save triggers detection
- [ ] Batch analysis: Analyze all errors
- [ ] History: View, reanalyze, export

---

## Configuration Settings

### User-Configurable Settings

Add to `package.json` → `contributes.configuration`:

```json
{
  "rcaAgent.ollamaUrl": {
    "type": "string",
    "default": "http://localhost:11434",
    "description": "Ollama server URL"
  },
  "rcaAgent.model": {
    "type": "string",
    "default": "deepseek-r1",
    "description": "LLM model to use for analysis"
  },
  "rcaAgent.maxIterations": {
    "type": "number",
    "default": 5,
    "description": "Maximum agent iterations per analysis"
  },
  "rcaAgent.numHypotheses": {
    "type": "number",
    "default": 3,
    "description": "Number of hypotheses to generate"
  },
  "rcaAgent.enableConsensus": {
    "type": "boolean",
    "default": false,
    "description": "Enable consensus building mode"
  },
  "rcaAgent.educationalMode": {
    "type": "boolean",
    "default": false,
    "description": "Show learning notes in results"
  },
  "rcaAgent.showPerformanceMetrics": {
    "type": "boolean",
    "default": false,
    "description": "Show performance metrics in UI"
  },
  "rcaAgent.realtimeDetection": {
    "type": "boolean",
    "default": true,
    "description": "Enable real-time error detection"
  },
  "rcaAgent.autoAnalyze": {
    "type": "boolean",
    "default": false,
    "description": "Automatically analyze new errors"
  },
  "rcaAgent.chromaDbPath": {
    "type": "string",
    "default": "./chroma",
    "description": "ChromaDB data directory path"
  }
}
```

---

## Quick Reference

### Most Important Wiring Points

#### **1. Start Analysis**
```typescript
// User clicks "Analyze" button in panel
webview.onDidReceiveMessage(async (msg) => {
  if (msg.type === 'analyze') {
    const errorItem = errorQueueManager.getError(msg.errorId);
    const result = await analysisService.analyzeError(
      errorItem,
      (progress) => {
        webview.postMessage({ type: 'progressUpdate', progress });
      }
    );
    webview.postMessage({ type: 'analysisComplete', result });
  }
});
```

#### **2. Apply Fix**
```typescript
// User clicks "Apply Fix" button
webview.onDidReceiveMessage(async (msg) => {
  if (msg.type === 'applyFix') {
    const success = await fixApplicationService.applyFix(
      msg.result,
      vscode.Uri.file(msg.result.filePath),
      /* workspace edit */
    );
    if (success) {
      vscode.window.showInformationMessage('Fix applied!');
    }
  }
});
```

#### **3. Real-time Detection**
```typescript
// On file save
vscode.workspace.onDidSaveTextDocument(async (doc) => {
  if (config.get('realtimeDetection')) {
    const errors = await realtimeDetector.scanDocument(doc);
    errors.forEach(error => errorQueueManager.addError(error));
  }
});
```

#### **4. Tree View Click**
```typescript
// User clicks error in tree view
const errorTreeItem: TreeItem = {
  command: {
    command: 'rca-agent.openErrorLocation',
    title: 'Go to Error',
    arguments: [errorItem]
  }
};

// Command handler
vscode.commands.registerCommand('rca-agent.openErrorLocation', (error) => {
  vscode.window.showTextDocument(
    vscode.Uri.file(error.filePath),
    { selection: new vscode.Range(error.line, 0, error.line, 0) }
  );
});
```

---

## Architecture Diagrams

### Component Dependency Graph

```
                         ┌─────────────────┐
                         │  extension.ts   │
                         │  (Entry Point)  │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
          ┌─────────▼────────┐    │    ┌────────▼─────────┐
          │  RCAPanelProvider│    │    │  ErrorTreeProvider│
          │   (Main Panel)   │    │    │  HistoryTreeProvider│
          └─────────┬────────┘    │    └────────┬─────────┘
                    │             │             │
                    │    ┌────────▼────────┐    │
                    └────►  StateManager   ◄────┘
                         │  (Singleton)    │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
          ┌─────────▼────────┐    │    ┌────────▼─────────┐
          │ AnalysisService  │    │    │ ErrorQueueManager│
          │  (Backend API)   │    │    │   (Queue Logic)  │
          └─────────┬────────┘    │    └──────────────────┘
                    │             │
          ┌─────────▼────────┐    │
          │ MultiPassAgent   │    │
          │ OllamaClient     │    │
          │ ErrorParser      │    │
          │ ChromaDBClient   │    │
          └──────────────────┘    │
```

---

## Summary

### Key Takeaways

1. **Backend is Ready**: AnalysisService and FixApplicationService are fully implemented and tested
2. **Clear Separation**: UI components are independent from backend logic
3. **Progressive Enhancement**: Implement in phases (Foundation → Panel → TreeViews → Integrations)
4. **State-Driven**: All UI updates are driven by StateManager events
5. **Message Passing**: Webview communication uses typed message interfaces

### Next Steps for Implementation

1. Start with Phase 1 (Foundation) - StateManager and ErrorQueueManager
2. Implement Phase 2 (Main Panel) - Core user interaction point
3. Add Phase 3 (Tree Views) - Secondary UI for queue/history
4. Complete Phase 4 (Editor Integrations) - Code actions, diagnostics, hover
5. Wire Phase 5 (Commands) - Connect all commands to backend
6. Polish with Phase 6 - Accessibility, themes, performance

### Files to Keep

- `resources/icons/rca-agent.svg` - Activity bar icon
- `vscode-extension/src/services/AnalysisService.ts` - Backend integration
- `vscode-extension/src/services/FixApplicationService.ts` - Fix application
- `vscode-extension/src/services/NetworkTimeoutHandler.ts` - Timeout handling
- All files in `src/` (core backend) - Kai's implementation

### Files to Recreate

- All files in `vscode-extension/src/panel/`
- All files in `vscode-extension/src/views/`
- All files in `vscode-extension/src/integrations/`
- All files in `vscode-extension/src/ui/`
- All files in `vscode-extension/src/commands/`
- Some files in `vscode-extension/src/services/` (AccessibilityService, ThemeManager, etc.)

---

**Document Version**: 1.0  
**Last Updated**: January 8, 2026  
**Status**: Complete - Ready for implementation
