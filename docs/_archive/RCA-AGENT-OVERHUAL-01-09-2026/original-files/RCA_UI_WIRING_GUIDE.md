# RCA Agent UI Wiring Guide

> **Document Purpose**: Complete reference for future UI implementation  
> **Created**: January 8, 2026  
> **Updated**: January 9, 2026 - Comprehensive update with all components  
> **Status**:  100% COMPLETE - All 60+ components documented  
> **Design System**: Modern collapsible sidebar with React + shadcn/ui

>  **Quick Links:**  
> - [**Figma Design Plan**](./RCA_UI_FIGMA_PLAN.md) - Visual design, views, and implementation phases  
> - [**RCA_UI_REMOVAL_SUMMARY.md**](./RCA_UI_REMOVAL_SUMMARY.md) - What was removed and why  
> - This document - Complete technical reference for all backend components

---

##  Table of Contents

1. [Overview](#overview)
2. [Architecture Overview](#architecture-overview)
3. [Component Mapping](#component-mapping)
4. [Backend Services](#backend-services)
   - Available Services (AnalysisService, FixApplicationService, NetworkTimeoutHandler)
   - Core Backend Components (Agents, LLM, Parser, DB)
   - Advanced Agent Infrastructure (Engines, Validators, Adapters)
   - Specialized Agent Components (FixGenerator, ErrorClassifier, etc.)
5. [Tool System](#tool-system-)
   - Tool Registry
   - File & Code Tools
   - Android-Specific Tools
   - Analysis Tools
   - Workspace Tools
6. [Utility Components](#utility-components-)
   - ErrorParser, DiffFormatter, FileResolver, LanguageDetector, PathUtils, ToolOrchestrator
7. [Caching System](#caching-system-)
   - RCACache, ErrorHasher
8. [Database Layer](#database-layer-)
   - ChromaDBClient, EmbeddingService, QualityManager, QualityScorer
9. [Monitoring & Performance](#monitoring--performance-)
   - PerformanceTracker
10. [Chat Participant Integration](#chat-participant-integration-)
    - RCAChatParticipant, ConversationalAgent, GuidedDebuggingWorkflow, and more
11. [Command Registry](#command-registry)
12. [UI State Management](#ui-state-management)
13. [Integration Points](#integration-points)
14. [Wiring Instructions](#wiring-instructions)
15. [Configuration Reference](#configuration-settings)
16. [Tool Inspector View](#tool-inspector-view-)
17. [Learning Metrics View](#learning-metrics-view-)

---

## Overview

This document maps **every function to its UI component** for the RCA Agent VS Code extension. All existing UI components have been removed, and this serves as the blueprint for future implementation.

### UI Prototype Reference

**Location**: `project/` directory

The UI implementation should be based on the React + Vite prototype in the `project/` folder:

```
project/
 src/
    app/
       App.tsx                          # Main app entry
       components/
           CollapsibleSidebar.tsx       #  Base sidebar design (USE THIS)
           ui/                          #  50+ shadcn/ui components
               accordion.tsx
               alert.tsx
               badge.tsx
               button.tsx
               card.tsx
               chart.tsx
               dialog.tsx
               progress.tsx
               scroll-area.tsx
               select.tsx
               sidebar.tsx
               switch.tsx
               table.tsx
               tabs.tsx
               ... (40+ more)
    styles/                              #  Tailwind CSS config
 package.json                             # Dependencies
 vite.config.ts                           # Vite config
 tsconfig.json                            # TypeScript config
```

**Key Design Elements**:
- **Black Sidebar (#000000)** - Collapsible navigation with icons
- **Dark Content Area (#0a0a0a zinc-950)** - Main content display
- **Auto-collapse** - Sidebar collapses when switching views
- **Icon-only mode** - Minimal 64px width when collapsed
- **Modern animations** - Smooth transitions (300ms ease-in-out)
- **shadcn/ui** - Complete UI component library included

**Integration Steps**:
1. Copy `project/src/app/components/` to `vscode-extension/webview/components/`
2. Copy `project/src/styles/` to `vscode-extension/webview/styles/`
3. Adapt CollapsibleSidebar navigation items for RCA Agent views
4. Connect to VS Code Webview API for message passing
5. Wire backend services to UI components

---

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

### High-Level Architecture - Figma-Inspired Sidebar Design

```

                VS Code Extension (Webview)                           
                                                                      
     
     Sidebar (Black)        Main Content Area (zinc-950)         
     #000000                #0a0a0a                              
                                                                  
     Settings            Current View Content                
     Model Config            
     Theme                                                   
     Preferences           Analysis Results                  
                             Error Queue Display               
     Navigation            History View                      
      Dashboard          Agent State Viewer                
      Error Queue        etc...                            
      Analyze                                              
      History           (Uses shadcn/ui components         
      Agent State        from project/src/app/             
      Fix Manager        components/ui/)                   
      Chat Part.                                           
      Tool Insp.           
      Metrics                                                 
                                                                  
     Collapse                                                   
                                                                  
     
                             ↕ Message Passing                       
    
           Backend Services (vscode-extension/src/services/)       
                                                                   
        
     AnalysisService (Singleton)                               
     - analyzeError()                                          
     - cancelAnalysis()                                        
     - getStateStream() → AgentStateStream                    
        
        
     FixApplicationService                                     
     - applyFix()                                              
     - validateFix()                                           
     - generateDiffPreview()                                   
        
        
     NetworkTimeoutHandler                                     
     - withTimeout()                                           
     - checkOllamaAvailability()                               
        
    
                             ↕                                       
    
           Core Backend (src/ - Kai's Implementation)              
    
    Agents (16 components):                                      
     • MinimalReactAgent        • MultiPassAgent                  
     • EducationalAgent         • ErrorClassifier                 
     • FixGenerator             • DocumentSynthesizer             
     • PromptEngine              • TemplateEngine                 
     • ResponseValidator        • OutputValidator                
     • ModelAdapter             • AgentStateStream               
     • AdaptiveLearning         • LearningPipeline               
     • FeedbackHandler          • BasePromptEngine               
                                                                   
    Tools (15+ tools):                                           
     • ReadFileTool             • WriteFileTool                   
     • EditFileTool             • SearchInFilesTool               
     • AndroidBuildTool         • ManifestAnalyzerTool            
     • DependencyGraphTool      • HistoricalPatternTool           
     • LSPTool                  • SemanticCodeSearchTool          
     • VersionLookupTool        • TerminalTool                    
     • GradleCommandHelper      • ToolRegistry                    
     • AndroidDocsSearchTool                                      
                                                                   
    Utilities (6 components):                                    
     • ErrorParser              • DiffFormatter                   
     • FileResolver             • LanguageDetector                
     • PathUtils                • ToolOrchestrator                
                                                                   
    Caching (2 components):                                      
     • RCACache                 • ErrorHasher                     
                                                                   
    Database (4 components):                                     
     • ChromaDBClient           • EmbeddingService                
     • QualityManager           • QualityScorer                   
                                                                   
    Monitoring:                                                  
     • PerformanceTracker                                         
                                                                   
    LLM Client:                                                  
     • OllamaClient (deepseek-r1, llama3, etc.)                  
    
                                                                      
    
           Chat Participant (7 components)                         
    
   @rca in VS Code Chat:                                           
     • RCAChatParticipant       • ConversationalAgent             
     • GuidedDebuggingWorkflow  • ContextCollector                
     • ChatRequestRouter        • ResponseStreamer                
     • ChatPromptEngine                                            
    


                               ↕ VS Code APIs


                  VS Code Editor & Environment                        

 • File System                    • Language Servers (LSP)            
 • Terminal                       • Diagnostics                       
 • Git Integration                • Chat Participant API              
 • Workspace API                  • Webview API                       

```

### Design System

**Color Palette**:
```typescript
const theme = {
  primary: '#030213',    // Deep blue-black
  sidebar: '#000000',    // Pure black
  content: '#0a0a0a',    // zinc-950
  cards: '#171717',      // zinc-900
  borders: '#27272a',    // zinc-800
  hover: '#18181b',      // zinc-900 hover
  muted: '#52525b',      // zinc-600
  text: '#ffffff',       // White
  textMuted: '#a1a1aa',  // zinc-400
  accent: '#3b82f6',     // Blue accent for active states
};
```

### Data Flow

```
User Action (Sidebar Click) → Route Change → View Component → Backend Service → Core Backend
         ↑                                                                        
          State Updates & Progress Callbacks ←
```

### UI Component Hierarchy

```
App.tsx (Main Entry Point)

 CollapsibleSidebar (Black #000000)
  
   Header Section
     Date Display (Day number + Month)
     Collapse/Expand Button
  
   Settings Section ()
     Model Configuration Dropdown
     Theme Toggle (Dark/Light/Auto)
     Educational Mode Toggle
     Advanced Settings Dialog
  
   Navigation Section
       Dashboard (Home)
       Error Queue
       Analyze
       History
       Agent State
       Fix Manager
       Chat Participant
       Tool Inspector
       Learning Metrics

 MainContent (zinc-950 #0a0a0a)
   
    DashboardView
      Quick Stats Cards
      Recent Analyses
      Error Summary
   
    ErrorQueueView
      Filter/Sort Controls
      Category Badges (ErrorClassifier)
      Error List (Virtual Scroll)
      Batch Action Buttons
   
    AnalyzeView
      Error Input Form
      Analysis Progress
      Live Agent State
      Results Display
   
    HistoryView
      Timeline/Calendar View
      Search/Filter
      History Items
      Export Options
   
    AgentStateView
      Iteration Counter
      Current Hypothesis
      Tool Execution Log
      Consensus Progress
      Real-time Updates
   
    FixManagerView
      Available Fixes List
      Diff Preview (Monaco Editor)
      Apply/Reject Buttons
      Multi-file Fix Support
   
    ChatParticipantView  NEW
      Conversation History
      Message Input
      Slash Command Menu
      Session Management
   
    ToolInspectorView  NEW
      Available Tools List
      Tool Usage Statistics
      Execution History
      Performance Metrics
   
    LearningMetricsView  NEW
       Success Rate Trends (Chart)
       Top Improvements
       Error Types Needing Attention
       Training Examples Count
       Pipeline Status
```

### shadcn/ui Components Used

**From `project/src/app/components/ui/`**:

- `button.tsx` - All action buttons
- `card.tsx` - Stats cards, error cards
- `badge.tsx` - Status badges, category tags
- `accordion.tsx` - Collapsible sections
- `tabs.tsx` - View switching
- `dialog.tsx` - Settings, confirmations
- `select.tsx` - Model selection, filters
- `switch.tsx` - Toggle settings
- `progress.tsx` - Analysis progress bars
- `scroll-area.tsx` - Scrollable lists
- `table.tsx` - History table
- `alert.tsx` - Error/warning messages
- `tooltip.tsx` - Hover information
- `skeleton.tsx` - Loading states
- `chart.tsx` - Metrics visualization
- `sidebar.tsx` - Main sidebar component
- `separator.tsx` - Visual dividers
- `collapsible.tsx` - Expandable sections

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
- " Analyze with RCA Agent" → `AnalysisService.analyzeFromDiagnostic()`

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

**Purpose**: Orchestrates error analysis with backend (primary service for UI integration)

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

#### **2. EducationalAgent**  NEW
**Location**: `src/agent/EducationalAgent.ts`

**Purpose**: Learning-focused error analysis with educational content

**Key Features**:
- Extends MinimalReactAgent
- Generates beginner-friendly explanations
- Clarifies root causes with analogies
- Provides prevention tips
- Supports sync/async learning note generation

**UI Integration**:
```typescript
// Toggle educational mode in settings
const eduAgent = new EducationalAgent(ollamaClient);
const result = await eduAgent.analyze(error, 'sync');

// Display in UI
if (result.learningNotes) {
  showLearningNotesPanel(result.learningNotes);
}
```

---

#### **3. OllamaClient**
**Location**: `src/llm/OllamaClient.ts`

**Purpose**: LLM communication via Ollama

**Key Features**:
- Streaming responses
- Model selection
- Retry logic
- Error handling

---

#### **4. ErrorParser**
**Location**: `src/utils/ErrorParser.ts`

**Purpose**: Parse build/runtime errors

**Key Features**:
- Gradle error parsing
- Stack trace parsing
- Multi-language support (Kotlin, Java, XML)

---

#### **5. ChromaDBClient**
**Location**: `src/db/ChromaDBClient.ts`

**Purpose**: Vector database for caching analyses

**Key Features**:
- Semantic search
- Result caching
- Similarity matching

---

#### **6. MinimalReactAgent** 
**Location**: `src/agent/MinimalReactAgent.ts`

**Purpose**: Core ReAct agent implementation (base class for all agents)

**Key Features**:
- ReAct loop (Reason → Act → Observe)
- Tool execution through ToolRegistry
- Streaming state updates via AgentStateStream
- Configurable max iterations
- Progressive L1 hypothesis generation
- Timeout handling

**UI Integration**:
```typescript
const agent = new MinimalReactAgent(ollamaClient, {
  maxIterations: 5,
  generateFix: true
});

const result = await agent.analyze(parsedError);
console.log(result.rootCause);
console.log(result.confidence);
```

---

#### **7. AgentStateStream** 
**Location**: `src/agent/AgentStateStream.ts`

**Purpose**: Real-time event streaming for agent state updates

**Key Features**:
- Iteration progress events
- Thought/action/observation events
- Hypothesis generation events
- Tool usage events
- Streaming to UI

**UI Integration**:
```typescript
const stateStream = agent.getStream();

stateStream.on('thought', (thought, iteration) => {
  updateAgentStateUI({ iteration, thought });
});

stateStream.on('action', (tool, params, iteration) => {
  showToolExecution(tool, params, iteration);
});

stateStream.on('observation', (result, iteration, isFinal) => {
  displayObservation(result, iteration, isFinal);
});
```

---

### Specialized Agent Components

#### **6. FixGenerator** 
**Location**: `src/agent/FixGenerator.ts`

**Purpose**: Automated code fix generation with diff support

**Key Features**:
- Generates before/after code diffs
- Multiple diff formats (markdown, unified)
- Syntax validation
- Multi-file fix support
- VS Code diff preview compatible

**UI Integration**:
```typescript
const fixGenerator = new FixGenerator(ollamaClient, readFileTool);
const fix = await fixGenerator.generateFix(error, rootCause, analysis);

// Show diff preview in UI
showDiffPreview({
  filePath: fix.filePath,
  originalCode: fix.originalCode,
  fixedCode: fix.fixedCode,
  diff: fix.diff
});
```

---

#### **7. ErrorClassifier** 
**Location**: `src/agent/ErrorClassifier.ts`

**Purpose**: Categorizes errors for targeted analysis

**Error Categories**:
- `VERSION_DEPENDENCY` - Version conflicts, missing dependencies
- `MANIFEST_PERMISSION` - AndroidManifest.xml issues
- `BUILD_CACHE` - Corrupted cache/build state
- `PROGUARD_MINIFICATION` - R8/ProGuard obfuscation issues
- `NAVIGATION_ROUTING` - Jetpack Navigation issues
- `NETWORK_CONNECTIVITY` - Network/repository errors

**UI Integration**:
```typescript
const classifier = new ErrorClassifier();
const classification = classifier.classify(parsedError);

// Show category badge in error list
showCategoryBadge(classification.category, classification.confidence);
```

---

#### **8. DocumentSynthesizer** 
**Location**: `src/agent/DocumentSynthesizer.ts`

**Purpose**: Generate formatted markdown RCA reports

**Key Features**:
- Structured markdown output
- Syntax highlighting for code
- VS Code file path links
- Confidence visualization
- Tool usage summary

**UI Integration**:
```typescript
const synthesizer = new DocumentSynthesizer();
const markdown = synthesizer.synthesize(rca, error, agentState);

// Export or display in markdown viewer
exportMarkdownReport(markdown);
```

---

### Phase 5: Continuous Learning & Adaptation 

#### **9. AdaptiveLearning**
**Location**: `src/agent/AdaptiveLearning.ts`

**Purpose**: Pattern recognition and automatic quality improvement

**Key Features**:
- Analyzes feedback patterns across error types
- Generates adaptation strategies
- Calculates learning metrics
- Adjusts confidence thresholds
- Curates high-quality examples

**UI Integration**:
```typescript
const learning = new AdaptiveLearning(db, feedbackHandler);

// Analyze patterns
await learning.analyzeFeedbackPatterns();
const patterns = learning.getPatterns();

// Show metrics in Metrics view
const metrics = await learning.calculateMetrics();
showLearningMetrics(metrics);
```

---

#### **10. LearningPipeline**
**Location**: `src/agent/LearningPipeline.ts`

**Purpose**: Automated workflow for continuous improvement

**Pipeline Stages**:
1. **Collection** - Gather feedback data
2. **Analysis** - Identify patterns
3. **Curation** - Generate training examples
4. **Export** - Prepare fine-tuning data

**UI Integration**:
```typescript
const pipeline = new LearningPipeline(db, feedbackHandler, {
  minTrainingQuality: 0.7,
  maxExamplesPerType: 50
});

// Run pipeline with progress updates
const result = await pipeline.run();
showPipelineResults(result);
```

---

#### **11. FeedbackHandler**
**Location**: `src/agent/FeedbackHandler.ts`

**Purpose**: User validation and quality tracking

**Key Features**:
- Mark analyses as helpful/unhelpful
- Update confidence scores
- Track validation status
- Calculate success rates

**UI Integration**:
```typescript
const feedbackHandler = new FeedbackHandler(db, cache);

// User clicks "Helpful" button
await feedbackHandler.recordFeedback(rcaId, 'positive');

// User validates root cause
await feedbackHandler.markValidated(rcaId, true);
```

---

### Advanced Agent Infrastructure

#### **12. PromptEngine** 
**Location**: `src/agent/PromptEngine.ts`

**Purpose**: Dynamic prompt generation with context optimization

**Key Features**:
- Context-aware prompt templates
- Progressive L1 generation (fast hypothesis)
- Multi-hypothesis prompt formatting
- Tool usage prompting
- Specialized error category prompts

**UI Integration**:
```typescript
const promptEngine = new PromptEngine();
const prompt = promptEngine.generateAnalysisPrompt(error, context);
```

---

#### **13. TemplateEngine** 
**Location**: `src/agent/TemplateEngine.ts`

**Purpose**: Template-based prompt generation for consistency

**Key Features**:
- Pre-defined templates for error categories
- Variable interpolation
- Template caching
- Multi-language support

---

#### **14. ResponseValidator** 
**Location**: `src/agent/ResponseValidator.ts`

**Purpose**: Validates LLM responses for completeness and correctness

**Key Features**:
- JSON schema validation
- Required field checking
- Confidence score validation
- Sanitization of malformed responses

---

#### **15. OutputValidator** 
**Location**: `src/agent/OutputValidator.ts`

**Purpose**: Validates agent output quality before returning to user

**Key Features**:
- RCA completeness check
- Fix guideline quality check
- Confidence threshold enforcement
- Error detection in responses

---

#### **16. ModelAdapter** 
**Location**: `src/agent/ModelAdapter.ts`

**Purpose**: Adapts prompts and responses for different LLM models

**Key Features**:
- Model-specific prompt formatting
- Response parsing per model type
- Token limit awareness
- Fallback strategies

---

## Utility Components 

### Core Utilities

#### **1. ErrorParser** 
**Location**: `src/utils/ErrorParser.ts`

**Purpose**: Parse and normalize errors from multiple sources

**Supported Error Types**:
- Kotlin compile errors
- Java compile errors
- Gradle build errors
- Runtime exceptions (stack traces)
- XML validation errors
- ProGuard/R8 errors
- Android manifest errors

**Key Methods**:
```typescript
class ErrorParser {
  static getInstance(): ErrorParser
  
  parseError(
    errorText: string,
    source?: 'build' | 'runtime' | 'compiler'
  ): ParsedError | null
  
  parseStackTrace(stackTrace: string): ParsedError | null
  
  extractFileLocation(error: string): {
    filePath: string;
    line: number;
    column?: number;
  } | null
}
```

**UI Integration**:
```typescript
const parser = ErrorParser.getInstance();
const parsed = parser.parseError(buildOutput);

if (parsed) {
  errorQueueManager.addError({
    id: generateId(),
    message: parsed.message,
    filePath: parsed.filePath,
    line: parsed.line,
    type: parsed.type,
    severity: 'error',
    status: 'pending'
  });
}
```

---

#### **2. DiffFormatter** 
**Location**: `src/utils/DiffFormatter.ts`

**Purpose**: Generate formatted diffs for code fixes

**Diff Formats**:
- Unified diff (Git-style)
- Markdown diff (with syntax highlighting)
- VS Code diff viewer compatible
- Side-by-side comparison

**Key Methods**:
```typescript
class DiffFormatter {
  formatUnified(original: string, fixed: string, filePath: string): string
  formatMarkdown(original: string, fixed: string, language: string): string
  formatVSCodeDiff(original: string, fixed: string): DiffPreview
}
```

---

#### **3. FileResolver** 
**Location**: `src/utils/FileResolver.ts`

**Purpose**: Resolve file paths in workspace

**Key Features**:
- Absolute path resolution
- Relative path handling
- Workspace root detection
- Multi-root workspace support
- Symbolic link resolution

---

#### **4. LanguageDetector** 
**Location**: `src/utils/LanguageDetector.ts`

**Purpose**: Detect programming language from file extension or content

**Supported Languages**:
- Kotlin (.kt, .kts)
- Java (.java)
- XML (.xml)
- Gradle (.gradle, .gradle.kts)
- JSON (.json)

---

#### **5. PathUtils** 
**Location**: `src/utils/PathUtils.ts`

**Purpose**: Cross-platform path manipulation

**Key Features**:
- Normalize paths (Windows/Unix)
- Relative path calculation
- URI conversion
- Workspace-relative paths

---

#### **6. ToolOrchestrator** 
**Location**: `src/utils/ToolOrchestrator.ts`

**Purpose**: Orchestrates complex multi-tool operations

**Key Features**:
- Sequential tool execution
- Parallel tool execution
- Dependency resolution
- Result aggregation
- Error handling and retries

---

## Caching System 

### Cache Architecture

#### **1. RCACache** 
**Location**: `src/cache/RCACache.ts`

**Purpose**: In-memory LRU cache for fast repeat error lookups

**Key Features**:
- Time-to-live (TTL) management
- LRU eviction policy
- Cache statistics (hit rate, miss rate)
- Configurable cache size
- Persistence to disk (optional)

**Cache Entry Structure**:
```typescript
interface CacheEntry {
  rca: RCADocument;
  expires: number;
  hits: number;
  createdAt: number;
  lastAccessed: number;
}
```

**Key Methods**:
```typescript
class RCACache {
  get(errorHash: string): RCADocument | undefined
  set(errorHash: string, rca: RCADocument, ttl?: number): void
  has(errorHash: string): boolean
  invalidate(errorHash: string): void
  clear(): void
  getStats(): CacheStats
}
```

**UI Integration**:
```typescript
const cache = new RCACache({ maxSize: 100, defaultTTL: 3600000 });

// Check cache before analysis
const cached = cache.get(errorHash);
if (cached) {
  showCachedResult(cached);
} else {
  const result = await analysisService.analyzeError(error);
  cache.set(errorHash, result);
}

// Show cache stats in UI
const stats = cache.getStats();
showCacheMetrics({
  hitRate: stats.hitRate,
  size: stats.size,
  totalHits: stats.totalHits
});
```

---

#### **2. ErrorHasher** 
**Location**: `src/cache/ErrorHasher.ts`

**Purpose**: Generate consistent hash keys for error caching

**Hashing Strategy**:
- Normalizes error messages (remove line numbers, timestamps)
- Includes error type and file path
- Configurable hash algorithm (SHA-256, MD5)
- Collision detection

**Key Methods**:
```typescript
class ErrorHasher {
  static hash(
    error: ParsedError,
    config?: ErrorHasherConfig
  ): string
  
  static normalize(errorMessage: string): string
}
```

---

## Database Layer 

### ChromaDB Integration (Extended)

#### **1. ChromaDBClient** (Complete Reference)
**Location**: `src/db/ChromaDBClient.ts`

**Purpose**: Vector database for semantic error search and result caching

**Collections**:
- `rca_results` - Completed analyses
- `error_patterns` - Historical error patterns
- `training_examples` - Curated examples for fine-tuning

**Key Methods**:
```typescript
class ChromaDBClient {
  static async create(config?: ChromaConfig): Promise<ChromaDBClient>
  
  async addRCA(rca: RCADocument): Promise<string>
  async searchSimilar(query: string, limit?: number): Promise<RCADocument[]>
  async getRCAById(id: string): Promise<RCADocument | null>
  async updateRCA(id: string, updates: Partial<RCADocument>): Promise<void>
  async deleteRCA(id: string): Promise<void>
  
  // Quality management
  async updateQualityScore(id: string, score: number): Promise<void>
  async getHighQualityExamples(minScore: number): Promise<RCADocument[]>
}
```

**UI Integration**:
```typescript
// Search similar errors
const similar = await chromaDB.searchSimilar(
  errorMessage,
  5 // top 5 results
);

showSimilarErrorsPanel(similar);

// Get high-quality examples for training
const examples = await chromaDB.getHighQualityExamples(0.8);
exportTrainingData(examples);
```

---

#### **2. EmbeddingService** 
**Location**: `src/db/EmbeddingService.ts`

**Purpose**: Generate embeddings for semantic search

**Key Features**:
- Text-to-vector conversion
- Batch embedding generation
- Caching of embeddings
- Multiple embedding models support

---

#### **3. QualityManager** 
**Location**: `src/db/QualityManager.ts`

**Purpose**: Manage analysis quality metadata

**Key Features**:
- Track user feedback
- Calculate quality scores
- Flag low-quality analyses
- Identify high-quality examples

---

#### **4. QualityScorer** 
**Location**: `src/db/QualityScorer.ts`

**Purpose**: Calculate quality scores for RCA results

**Scoring Factors**:
- Confidence score (0-1)
- User feedback (helpful/unhelpful)
- Validation status
- Tool usage diversity
- Analysis completeness

**UI Integration**:
```typescript
const scorer = new QualityScorer();
const score = scorer.scoreRCA(result, feedback);

showQualityBadge(score); // Shows:  (4.2/5.0)
```

---

## Monitoring & Performance 

### Performance Tracking

#### **1. PerformanceTracker** [TIME]
**Location**: `src/monitoring/PerformanceTracker.ts`

**Purpose**: Track and measure performance metrics

**Tracked Metrics**:
- Analysis latency (total, per iteration)
- Tool execution time
- LLM response time
- Cache hit/miss rate
- Memory usage
- Error rate

**Key Methods**:
```typescript
class PerformanceTracker {
  startTimer(label: string): () => number
  recordMetric(name: string, value: number): void
  getMetrics(): PerformanceMetrics
  reset(): void
}
```

**UI Integration**:
```typescript
const perf = new PerformanceTracker();
const timer = perf.startTimer('analysis');

const result = await agent.analyze(error);
const elapsed = timer();

showPerformanceMetrics({
  totalTime: elapsed,
  iterations: result.iterations,
  avgTimePerIteration: elapsed / result.iterations
});
```

---

## Backend Tools (Complete List) 

### File & Code Tools

#### **1. ReadFileTool** 
**Location**: `src/tools/ReadFileTool.ts`

**Purpose**: Read file contents for analysis

**Parameters**:
- `path` - File path (absolute or workspace-relative)
- `startLine` - Optional start line
- `endLine` - Optional end line
- `maxLines` - Max lines to read (default: 1000)

**UI Display**: Show in "Tool Inspector" view when agent reads files

---

#### **2. WriteFileTool** 
**Location**: `vscode-extension/src/tools/FileOperationTool.ts`

**Purpose**: Write content to files (for fix application)

**Safety Features**:
- Backup before overwrite
- Dry-run mode
- Confirmation required for overwrite

---

#### **3. EditFileTool** 
**Location**: `vscode-extension/src/tools/FileOperationTool.ts`

**Purpose**: Make targeted edits to files

**Edit Types**:
- Replace line range
- Insert lines
- Delete lines
- Find and replace

---

### Android-Specific Tools

#### **4. AndroidBuildTool** 
**Location**: `src/tools/AndroidBuildTool.ts`

**Purpose**: Analyze Android build configuration

**Analyzes**:
- build.gradle files
- Android SDK versions
- Build types and flavors
- Dependencies and versions

---

#### **5. ManifestAnalyzerTool** 
**Location**: `src/tools/ManifestAnalyzerTool.ts`

**Purpose**: Analyze AndroidManifest.xml

**Checks**:
- Permissions
- Activities and components
- Intent filters
- Application configuration

---

#### **6. AndroidDocsSearchTool** 
**Location**: `src/tools/AndroidDocsSearchTool.ts`

**Purpose**: Search Android documentation

**Sources**:
- Official Android docs
- Stack Overflow
- Android guides
- API references

---

### Analysis Tools

#### **7. DependencyGraphTool** 
**Location**: `src/tools/DependencyGraphTool.ts`

**Purpose**: Analyze dependency tree

**Features**:
- Dependency resolution
- Version conflict detection
- Transitive dependencies
- Vulnerability scanning

---

#### **8. HistoricalPatternTool** 
**Location**: `src/tools/HistoricalPatternTool.ts`

**Purpose**: Search historical error patterns

**Queries ChromaDB**:
- Similar past errors
- Common root causes
- Effective fixes
- Success rate statistics

---

#### **9. LSPTool** 
**Location**: `src/tools/LSPTool.ts`

**Purpose**: Language Server Protocol integration

**LSP Features**:
- Symbol resolution
- Type inference
- Go to definition
- Find references
- Hover information

---

#### **10. SemanticCodeSearchTool** 
**Location**: `src/tools/SemanticCodeSearchTool.ts`

**Purpose**: Semantic code search across workspace

**Search Types**:
- Function definitions
- Class declarations
- Variable usages
- Import statements

---

#### **11. VersionLookupTool** 
**Location**: `src/tools/VersionLookupTool.ts`

**Purpose**: Look up latest library versions

**Sources**:
- Maven Central
- Google Maven
- JCenter
- Custom repositories

---

### Workspace Tools

#### **12. WorkspaceSearchTool** 
**Location**: `vscode-extension/src/tools/WorkspaceSearchTool.ts`

**Sub-tools**:
- **FindFilesTool** - Find files by pattern
- **SearchInFilesTool** - Search text in files
- **GetWorkspaceInfoTool** - Get workspace structure

---

#### **13. TerminalTool** ⌨
**Location**: `vscode-extension/src/tools/TerminalTool.ts`

**Purpose**: Execute terminal commands

**Common Uses**:
- Build commands
- Clean cache
- Run tests
- Install dependencies

---

#### **14. GradleCommandHelper** 
**Location**: `vscode-extension/src/tools/GradleCommandHelper.ts`

**Purpose**: Execute Gradle commands

**Common Commands**:
- `clean` - Clean build directory
- `build` - Build project
- `dependencies` - Show dependencies
- `--refresh-dependencies` - Refresh from repositories

---

## Tool Inspector View 

### Tool Execution Visualization

**UI Components**:

1. **Tool Execution Log**
   ```
   
    Tool Execution Log                  
   
    Iteration 1:                        
       read_file                      
         path: app/MainActivity.kt      
         lines: 45-60                   
         [TIME] 125ms                        
          Success: Read 15 lines      
                                        
    Iteration 2:                        
       search_in_files                
         pattern: "NullPointerException"
         [TIME] 450ms                        
          Success: Found 3 matches    
                                        
       android_build_tool             
         action: analyze_dependencies   
         [TIME] 1.2s                         
          Success: 45 dependencies    
   
   ```

2. **Tool Statistics**
   - Most used tools (bar chart)
   - Avg execution time per tool
   - Success rate per tool

3. **Tool Result Viewer**
   - Expandable results for each tool call
   - Formatted output (JSON, text, code)
   - Error details if tool failed

---

## Chat Participant (Complete) 

### Chat Components (Detailed)

#### **7. ChatPromptEngine** 
**Location**: `vscode-extension/src/chat/ChatPromptEngine.ts`

**Purpose**: Generate chat-specific prompts

**Features**:
- Conversational tone
- Context inclusion (open files, terminal output)
- Follow-up question handling
- Guided workflow prompting

---

## Learning Metrics View 

### Metrics Dashboard

**UI Sections**:

1. **Overall Statistics**
   - Total analyses performed
   - Success rate (%)
   - Average confidence score
   - Cache hit rate (%)

2. **Category Breakdown**
   - Analyses per error category (pie chart)
   - Success rate per category (bar chart)
   - Average time per category

3. **Feedback Analysis**
   - Helpful vs Unhelpful ratio
   - Feedback trends over time (line chart)
   - Most common feedback comments

4. **Learning Progress**
   - Training examples curated
   - Quality improvements over time
   - Adaptation strategies applied

5. **Pattern Recognition**
   - Detected error patterns
   - Pattern frequency
   - Pattern success rate

**Backend Wire**:
```typescript
const learning = new AdaptiveLearning(db, feedbackHandler);
const metrics = await learning.calculateMetrics();

showLearningMetrics({
  totalAnalyses: metrics.totalAnalyses,
  successRate: metrics.successRate,
  avgConfidence: metrics.avgConfidence,
  categoryBreakdown: metrics.byCategory,
  feedbackRatio: metrics.feedbackRatio
});
```

---

## Complete Tool Integration Map 

### Tool → UI Component Mapping

| Tool | UI Component | Display Location |
|------|--------------|------------------|
| ReadFileTool | Tool Inspector | Tool execution log |
| SearchInFilesTool | Tool Inspector | Search results panel |
| AndroidBuildTool | Analyze View | Build config section |
| ManifestAnalyzerTool | Analyze View | Manifest issues section |
| DependencyGraphTool | Analyze View | Dependency tree |
| HistoricalPatternTool | History View | Similar errors sidebar |
| LSPTool | Inline | Editor hover/goto definition |
| TerminalTool | Agent State View | Command output |
| GradleCommandHelper | Agent State View | Build log |

---

## Extended Configuration 

### Advanced Settings

```json
{
  "rcaAgent.cache.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable RCA result caching"
  },
  "rcaAgent.cache.ttl": {
    "type": "number",
    "default": 3600000,
    "description": "Cache time-to-live in milliseconds"
  },
  "rcaAgent.cache.maxSize": {
    "type": "number",
    "default": 100,
    "description": "Maximum cache entries"
  },
  "rcaAgent.tools.readFile.maxLines": {
    "type": "number",
    "default": 1000,
    "description": "Max lines to read per file"
  },
  "rcaAgent.tools.timeout": {
    "type": "number",
    "default": 30000,
    "description": "Tool execution timeout (ms)"
  },
  "rcaAgent.performance.trackMetrics": {
    "type": "boolean",
    "default": true,
    "description": "Track performance metrics"
  },
  "rcaAgent.embeddings.model": {
    "type": "string",
    "default": "all-MiniLM-L6-v2",
    "description": "Embedding model for semantic search"
  },
  "rcaAgent.quality.minScore": {
    "type": "number",
    "default": 0.7,
    "description": "Minimum quality score for training examples"
  }
}
```

---

## Chat Participant Integration 

### Overview

The RCA Agent includes a **VS Code Chat Participant** (`@rca`) for conversational debugging. This provides a natural language interface to the agent's capabilities without requiring a traditional UI.

**Location**: `vscode-extension/src/chat/`

### Key Components

#### **1. RCAChatParticipant**
**Location**: `vscode-extension/src/chat/RCAChatParticipant.ts`

**Purpose**: Main chat participant handler

**Features**:
- Registers `@rca` participant
- Routes user queries to appropriate handlers
- Streams responses with progress updates
- Provides slash commands

**Slash Commands**:
- `/analyze` - Analyze an error
- `/fix` - Generate code fixes
- `/explain` - Explain error concepts
- `/history` - View past analyses

**Usage Example**:
```
User: @rca analyze this NullPointerException
RCA: [Analyzes error and provides root cause]

User: @rca /fix
RCA: [Generates code fix with diff]
```

---

#### **2. ConversationalAgent**
**Location**: `vscode-extension/src/chat/ConversationalAgent.ts`

**Purpose**: Multi-turn conversation management

**Features**:
- Maintains conversation context
- Tracks debugging sessions
- Remembers previous analyses
- Provides contextual follow-ups

**UI Integration**:
```typescript
const convAgent = new ConversationalAgent(analysisService, context);

// Start conversation
const session = convAgent.startSession(errorContext);

// Show conversation history in sidebar
showConversationHistory(session.messages);
```

---

#### **3. GuidedDebuggingWorkflow**
**Location**: `vscode-extension/src/chat/GuidedDebuggingWorkflow.ts`

**Purpose**: Step-by-step debugging assistance

**Workflow Stages**:
1. **Context Gathering** - Collect error info
2. **Hypothesis Generation** - Propose potential causes
3. **Investigation** - Guide user through checks
4. **Resolution** - Provide fix recommendations
5. **Verification** - Confirm fix works

**UI Integration**:
```typescript
const workflow = new GuidedDebuggingWorkflow();

// Show workflow steps in sidebar
const steps = workflow.getCurrentStep();
showWorkflowProgress(steps);
```

---

#### **4. ContextCollector**
**Location**: `vscode-extension/src/chat/ContextCollector.ts`

**Purpose**: Gather workspace context for chat

**Collects**:
- Open files
- Active editor content
- Terminal output
- Build errors
- Git status
- Workspace structure

---

#### **5. ChatRequestRouter**
**Location**: `vscode-extension/src/chat/ChatRequestRouter.ts`

**Purpose**: Intent detection and routing

**Detected Intents**:
- `analyze_error` - Error analysis request
- `generate_fix` - Fix generation request
- `explain_concept` - Explanation request
- `search_history` - History search
- `general_help` - General assistance

---

#### **6. ResponseStreamer**
**Location**: `vscode-extension/src/chat/ResponseStreamer.ts`

**Purpose**: Stream chat responses with formatting

**Features**:
- Markdown formatting
- Code block syntax highlighting
- Progress indicators
- Button actions

---

## Tool System 

### Overview

The agent uses a **tool-based architecture** (ReAct paradigm) where the LLM decides which tools to call to gather context and execute actions.

**Location**: `vscode-extension/src/tools/`

### Tool Registry

**Location**: `vscode-extension/src/tools/ToolRegistry.ts`

**Purpose**: Central registry for all tools

**Features**:
- Register/unregister tools
- Tool execution tracking
- Usage statistics
- Execution history

### Available Tools

#### **File Operation Tools**
**Location**: `vscode-extension/src/tools/FileOperationTool.ts`

1. **ReadFileTool**
   - Read file contents
   - Support for line ranges
   - Multiple file types

2. **WriteFileTool**
   - Write content to files
   - Create new files
   - Overwrite existing files

3. **EditFileTool**
   - Make targeted edits
   - Line-based changes
   - Preserve formatting

4. **DeleteFileTool**
   - Delete files safely
   - Confirmation required

---

#### **Workspace Search Tools**
**Location**: `vscode-extension/src/tools/WorkspaceSearchTool.ts`

1. **FindFilesTool**
   - Search for files by name/pattern
   - Glob pattern support
   - Recursive search

2. **SearchInFilesTool**
   - Content search across files
   - Regex support
   - Context lines

3. **GetWorkspaceInfoTool**
   - Get workspace structure
   - List directories
   - File statistics

4. **DetectGradleFilesTool**
   - Find Gradle build files
   - Parse dependencies
   - Version detection

---

#### **Terminal Tools**
**Location**: `vscode-extension/src/tools/TerminalTool.ts`

**TerminalTool**
- Execute commands
- Monitor output
- Capture errors
- Stream results

**Features**:
- Real-time output watching
- Error detection
- Build command support

---

#### **Gradle Tools**
**Location**: `vscode-extension/src/tools/GradleCommandHelper.ts`

**GradleCommandHelper**
- Clean builds
- Dependency resolution
- Task execution
- Cache clearing

**Common Commands**:
- `./gradlew clean build`
- `./gradlew dependencies`
- `./gradlew --refresh-dependencies`

---

### Tool Usage in UI

**Agent State Viewer** should show:
- Tool execution log
- Tool parameters
- Tool results
- Execution timing

**Example Display**:
```
Iteration 2:
   read_file("app/MainActivity.kt", lines: 45-60)
  ⏱ 125ms
   Read 15 lines
  
   search_in_files("NullPointerException")
  ⏱ 450ms
   Found 3 matches
```

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

#### **Learning & Feedback Commands**  NEW

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rca-agent.runLearningPipeline` | Run Learning Pipeline | `LearningPipeline.run()` |
| `rca-agent.showLearningMetrics` | Show Learning Metrics | `AdaptiveLearning.calculateMetrics()` |
| `rca-agent.exportTrainingData` | Export Training Data | `LearningPipeline.exportTrainingData()` |
| `rca-agent.analyzeFeedbackPatterns` | Analyze Feedback Patterns | `AdaptiveLearning.analyzeFeedbackPatterns()` |

---

#### **Learning & Feedback Commands**  NEW

| Command ID | Title | Function to Wire |
|------------|-------|------------------|
| `rca-agent.runLearningPipeline` | Run Learning Pipeline | `LearningPipeline.run()` |
| `rca-agent.showLearningMetrics` | Show Learning Metrics | `AdaptiveLearning.calculateMetrics()` |
| `rca-agent.exportTrainingData` | Export Training Data | `LearningPipeline.exportTrainingData()` |
| `rca-agent.analyzeFeedbackPatterns` | Analyze Feedback Patterns | `AdaptiveLearning.analyzeFeedbackPatterns()` |

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

## Configuration Reference

### Complete VS Code Settings

**Location**: `vscode-extension/package.json` → `contributes.configuration`

```json
{
  "rcaAgent.ollamaUrl": {
    "type": "string",
    "default": "http://localhost:11434",
    "description": "Ollama server URL for LLM inference"
  },
  "rcaAgent.model": {
    "type": "string",
    "default": "deepseek-r1",
    "description": "LLM model to use for analysis",
    "enum": ["deepseek-r1", "llama3", "codellama", "mistral"]
  },
  "rcaAgent.maxIterations": {
    "type": "number",
    "default": 5,
    "minimum": 1,
    "maximum": 10,
    "description": "Maximum agent iterations per analysis"
  },
  "rcaAgent.numHypotheses": {
    "type": "number",
    "default": 3,
    "minimum": 1,
    "maximum": 5,
    "description": "Number of hypotheses to generate"
  },
  "rcaAgent.enableConsensus": {
    "type": "boolean",
    "default": false,
    "description": "Enable consensus building for multi-hypothesis analysis"
  },
  "rcaAgent.chromaDbPath": {
    "type": "string",
    "default": "./chroma",
    "description": "ChromaDB data directory for caching"
  },
  "rcaAgent.educationalMode": {
    "type": "boolean",
    "default": false,
    "description": "Enable educational mode with learning notes"
  },
  "rcaAgent.showPerformanceMetrics": {
    "type": "boolean",
    "default": true,
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
  "rcaAgent.theme": {
    "type": "string",
    "default": "auto",
    "enum": ["dark", "light", "auto"],
    "description": "UI theme preference"
  }
}
```

---

## Wiring Instructions

### Step-by-Step Implementation Guide

#### **Phase 1: Foundation** (2-3 days)

1. **Setup React + Vite Project**
   - Use existing `project/` as base
   - Already includes:
     -  shadcn/ui components
     -  Tailwind CSS
     -  CollapsibleSidebar component
     -  TypeScript configuration
   - Integrate with VS Code Webview API

2. **Create State Management**
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
    "description": "Enable educational mode with learning notes"
  },
  "rcaAgent.showPerformanceMetrics": {
    "type": "boolean",
    "default": true,
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
    "description": "ChromaDB data directory path for caching"
  },
  "rcaAgent.theme": {
    "type": "string",
    "default": "auto",
    "enum": ["dark", "light", "auto"],
    "description": "UI theme preference"
  }
}
```

---

## Complete Configuration Reference

See settings above for all available configuration options. Settings can be modified through:
- VS Code Settings UI
- `settings.json` file
- Webview settings panel

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
                         
                           extension.ts   
                           (Entry Point)  
                         
                                  
          
                                                        
        
 RCAPanelProvider      RCAChatParticipant      TreeProviders   
  (React Webview)       (@rca in chat)        (Error/History) 
        
                                                        
          
                                  
                         
                           StateManager   
                            (Singleton)   
                         
                                  
          
                                                        
        
 AnalysisService       ToolRegistry          ErrorQueueManager
  (Backend API)         (Tool System)          (Queue Logic)  
        
                                 
                       
                        File/Workspace   
                        Terminal/Gradle  
                           Tools         
                       
          

         Core Agent Layer (Kai's Backend)      

 • MultiPassAgent     • EducationalAgent       
 • ErrorClassifier    • FixGenerator           
 • AdaptiveLearning   • LearningPipeline       
 • FeedbackHandler    • DocumentSynthesizer    
 • OllamaClient       • ErrorParser            
 • ChromaDBClient     • AgentStateStream       

```

---

### Data Flow Diagram

```

                    USER ACTIONS                          

           
    
  Webview UI               Chat: @rca      
  (React + shadcn)         (Conversational)
    
                                   
           
                        
                
                 Message Router 
                  (Intent Det.) 
                
                        
    
                                          
           
Analyze        Generate Fix          History  
 Error         (FixGenerator)        Search   
           
                                          
    
                        
              
                AnalysisService 
                 (Orchestrator) 
              
                        
        
                                      
    
MultiPassAgent     Tools       ChromaDB  
(ReAct Loop)    (Read/Exec)    (Cache)   
    
                                      
        
                        
              
                 LLM (Ollama)   
                deepseek-r1     
              
                        
              
                RCA Result +    
                Learning Notes  
              
                        
        
                                      
    
   UI Update    Feedback      Training   
  (Streaming)    Handler       Pipeline  
    
```

---

## Summary

### Key Takeaways

1. **Backend is Complete**: All agent components, services, and tools are fully implemented
2. **Phase 5 Learning**: AdaptiveLearning, LearningPipeline, and continuous improvement ready
3. **Chat Integration**: Full conversational debugging via VS Code Chat Participant
4. **Tool System**: Comprehensive file, workspace, terminal, and Gradle tools
5. **Specialized Agents**: EducationalAgent, FixGenerator, ErrorClassifier, DocumentSynthesizer
6. **Clear Separation**: UI components are independent from backend logic
7. **Progressive Enhancement**: Implement in phases from foundation to advanced features

### Component Coverage Summary

####  **Fully Documented**
- **Core Services**: AnalysisService, FixApplicationService, NetworkTimeoutHandler
- **Agent Components**: MinimalReactAgent, MultiPassAgent, EducationalAgent, ErrorClassifier, FixGenerator, DocumentSynthesizer
- **Advanced Agent Infrastructure**: PromptEngine, TemplateEngine, ResponseValidator, OutputValidator, ModelAdapter, AgentStateStream
- **Learning System**: AdaptiveLearning, LearningPipeline, FeedbackHandler
- **Chat System**: RCAChatParticipant, ConversationalAgent, GuidedDebuggingWorkflow, ContextCollector, ChatRequestRouter, ResponseStreamer, ChatPromptEngine
- **Tool System (15+ tools)**:
  - File operations: ReadFileTool, WriteFileTool, EditFileTool, DeleteFileTool
  - Workspace: FindFilesTool, SearchInFilesTool, GetWorkspaceInfoTool
  - Android: AndroidBuildTool, ManifestAnalyzerTool, AndroidDocsSearchTool
  - Analysis: DependencyGraphTool, HistoricalPatternTool, LSPTool, SemanticCodeSearchTool, VersionLookupTool
  - Execution: TerminalTool, GradleCommandHelper
- **Utilities**: ErrorParser, DiffFormatter, FileResolver, LanguageDetector, PathUtils, ToolOrchestrator
- **Caching**: RCACache, ErrorHasher
- **Database**: ChromaDBClient, EmbeddingService, QualityManager, QualityScorer
- **Monitoring**: PerformanceTracker
- **UI Design**: CollapsibleSidebar with shadcn/ui components (from project/ prototype)
- **Configuration**: Complete settings reference with 20+ options

####  **Comprehensive Coverage (This Update)**
- **16 Agent Components** - All agent types, validators, engines
- **15+ Tool Implementations** - Complete tool ecosystem
- **6 Utility Components** - Parsing, formatting, resolution
- **2 Caching Components** - Cache + hasher
- **4 Database Components** - ChromaDB + quality management
- **1 Performance Component** - PerformanceTracker
- **7 Chat Components** - Full conversational debugging
- **Tool Inspector View** - Tool execution visualization
- **Learning Metrics View** - Comprehensive metrics dashboard
- **Extended Configuration** - 8 additional advanced settings

####  **Coverage Statistics**
- **Total Components Documented**: 60+
- **Backend Services**: 3 (AnalysisService, FixApplicationService, NetworkTimeoutHandler)
- **Agent Types**: 6 (Minimal, MultiPass, Educational, Classifier, FixGenerator, Synthesizer)
- **Agent Infrastructure**: 10 (Engines, validators, adapters, streams)
- **Learning Components**: 3 (AdaptiveLearning, Pipeline, Feedback)
- **Tools**: 15+ (File, workspace, Android, analysis, execution)
- **Utilities**: 6 (Parser, formatter, resolver, detector, paths, orchestrator)
- **Database**: 4 (Client, embeddings, quality manager/scorer)
- **Chat**: 7 (Participant, agent, workflow, collector, router, streamer, engine)
- **UI Components**: 50+ shadcn/ui components + custom sidebar
- **Views**: 9 (Dashboard, ErrorQueue, Analyze, History, AgentState, FixManager, ChatParticipant, ToolInspector, LearningMetrics)

### Implementation Phases

#### **Phase 1: Foundation (2-3 days)**
- Setup React + Vite from `project/` folder
- Integrate with VS Code Webview API
- Create StateManager singleton
- Implement ErrorQueueManager
- Add message passing infrastructure

#### **Phase 2: Core UI (3-4 days)**
- Implement CollapsibleSidebar (already prototyped)
- Create navigation system
- Build DashboardView
- Add ErrorQueueView with ErrorClassifier badges
- Implement AnalyzeView with live progress

#### **Phase 3: Analysis Flow (2-3 days)**
- Wire AnalysisService to UI
- Add real-time agent state updates
- Implement progress callbacks
- Show tool execution in UI
- Display learning notes (EducationalAgent)

#### **Phase 4: History & Fixes (2 days)**
- Build HistoryView with timeline
- Implement FixManagerView with Monaco diff
- Add export functionality
- Wire feedback buttons

#### **Phase 5: Advanced Features (2-3 days)**
- Add ChatParticipantView
- Implement ToolInspectorView
- Build LearningMetricsView
- Wire learning pipeline commands
- Add training data export

#### **Phase 6: Tree Views & Integrations (2-3 days)**
- Recreate ErrorTreeProvider
- Recreate HistoryTreeProvider
- Add code actions (lightbulb)
- Implement diagnostic provider
- Add hover provider

#### **Phase 7: Polish (1-2 days)**
- Accessibility testing
- Theme switching
- Performance optimization
- Error handling
- Documentation

**Total Estimated Time: 14-20 days**

### Files Reference

#### **Keep (Backend - Complete)**
- `resources/icons/rca-agent.svg` - Activity bar icon
- `vscode-extension/src/extension.ts` - Entry point
- `vscode-extension/src/services/AnalysisService.ts` - Analysis orchestration
- `vscode-extension/src/services/FixApplicationService.ts` - Fix application
- `vscode-extension/src/services/NetworkTimeoutHandler.ts` - Timeout handling
- `vscode-extension/src/chat/**/*` - Chat participant (complete)
- `vscode-extension/src/tools/**/*` - Tool system (complete)
- All files in `src/agent/` - Agent components
- All files in `src/llm/` - LLM client
- All files in `src/utils/` - Utilities
- All files in `src/db/` - Database
- All files in `src/cache/` - Caching

#### **Create (UI - To Implement)**
- `vscode-extension/webview/` - React app based on `project/`
- `vscode-extension/src/panel/RCAPanelProvider.ts` - Webview provider
- `vscode-extension/src/views/ErrorTreeProvider.ts` - Error tree
- `vscode-extension/src/views/HistoryTreeProvider.ts` - History tree
- `vscode-extension/src/integrations/` - Code actions, diagnostics, hover
- `vscode-extension/src/commands/` - Command handlers

#### **Use as Base (UI Prototype)**
- `project/src/app/App.tsx` - Main app structure
- `project/src/app/components/CollapsibleSidebar.tsx` - Sidebar component
- `project/src/app/components/ui/**/*` - shadcn/ui components
- `project/src/styles/**/*` - Tailwind config and theme

---

**Document Version**: 3.0 - Complete Edition  
**Last Updated**: January 9, 2026  
**Status**:  COMPREHENSIVE - 100% coverage of all RCA Agent components  
**Coverage**: 60+ components - All backend services, agents, tools, utilities, chat, learning, database, monitoring, and UI design  
**Update Notes**: Added 40+ missing components including utilities, cache system, database layer, tool ecosystem, advanced agent infrastructure, and extended configuration

---

## Appendix: Quick Command Reference

### Most Used Commands
```bash
# Analyze current error
@rca analyze this error

# Generate fix
@rca /fix

# Run learning pipeline
Command Palette → "RCA Agent: Run Learning Pipeline"

# Show metrics
Command Palette → "RCA Agent: Show Learning Metrics"

# Export analysis
Command Palette → "RCA Agent: Export Analysis"
```

### Configuration Quick Settings
```json
{
  "rcaAgent.model": "deepseek-r1",
  "rcaAgent.educationalMode": true,
  "rcaAgent.maxIterations": 5,
  "rcaAgent.realtimeDetection": true
}
```

### Tool Usage Example
```typescript
// Read file
await readFileTool.execute({ path: "app/MainActivity.kt", startLine: 45, endLine: 60 });

// Search in files
await searchInFilesTool.execute({ pattern: "NullPointerException", includePattern: "**/*.kt" });

// Execute gradle
await terminalTool.execute({ command: "./gradlew clean build" });
```

---

##  UI Prototype → Extension Integration

### From Prototype to Production

The `project/` folder contains a fully functional React + Vite prototype demonstrating the Figma-inspired collapsible sidebar design. Follow these steps to adapt it for the VS Code extension:

#### **Step 1: Copy UI Assets**
```bash
# Copy shadcn/ui components (50+ pre-built components)
cp -r project/src/app/components/ui vscode-extension/webview/src/components/ui

# Copy CollapsibleSidebar (base design - IMPORTANT!)
cp project/src/app/components/CollapsibleSidebar.tsx vscode-extension/webview/src/components/

# Copy styles (Tailwind + theme)
cp -r project/src/styles vscode-extension/webview/src/styles
cp project/tailwind.config.js vscode-extension/webview/
```

#### **Step 2: Adapt Navigation for RCA Views**

**Replace generic nav items with RCA-specific views:**

```typescript
// project/src/app/components/CollapsibleSidebar.tsx (Original)
const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'files', label: 'My Files', icon: FolderOpen },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  // ... generic app items
];

// vscode-extension/webview/src/components/Sidebar.tsx (Adapted)
import { AlertCircle, Search, History, Bot, Wrench, MessageSquare, Tool, BarChart3 } from 'lucide-react';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'error-queue', label: 'Error Queue', icon: AlertCircle },
  { id: 'analyze', label: 'Analyze', icon: Search },
  { id: 'history', label: 'History', icon: History },
  { id: 'agent-state', label: 'Agent State', icon: Bot },
  { id: 'fix-manager', label: 'Fix Manager', icon: Wrench },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'tools', label: 'Tool Inspector', icon: Tool },
  { id: 'metrics', label: 'Learning Metrics', icon: BarChart3 },
];
```

#### **Step 3: Add VS Code Webview API**

```typescript
// In webview/src/main.tsx (Entry point)
declare global {
  interface Window {
    acquireVsCodeApi(): {
      postMessage(message: any): void;
      getState(): any;
      setState(state: any): void;
    };
  }
}

const vscode = window.acquireVsCodeApi();

// Send message to extension
export function sendMessage(type: string, data: any) {
  vscode.postMessage({ type, ...data });
}

// Receive messages from extension
window.addEventListener('message', (event) => {
  const message = event.data;
  handleExtensionMessage(message);
});
```

#### **Step 4: Build Configuration**

```typescript
// vscode-extension/webview/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../out/webview',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
```

#### **Step 5: Create Webview Provider**

```typescript
// vscode-extension/src/panel/RCAPanelProvider.ts
import * as vscode from 'vscode';
import { AnalysisService } from '../services/AnalysisService';

export class RCAPanelProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _analysisService: AnalysisService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._analysisService = AnalysisService.getInstance();
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out', 'webview')
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._setupMessageHandlers(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'assets', 'index.css')
    );

    return `<!DOCTYPE html>
    <html lang="en" class="dark">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${styleUri}">
        <title>RCA Agent</title>
      </head>
      <body class="bg-black">
        <div id="root"></div>
        <script type="module" src="${scriptUri}"></script>
      </body>
    </html>`;
  }

  private _setupMessageHandlers(webview: vscode.Webview) {
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'analyze':
          await this._handleAnalyze(message.errorId, webview);
          break;
        case 'cancel':
          this._analysisService.stopAnalysis();
          break;
        case 'applyFix':
          await this._handleApplyFix(message.result, webview);
          break;
        // ... more handlers
      }
    });
  }

  private async _handleAnalyze(errorId: string, webview: vscode.Webview) {
    const error = this._getError(errorId);
    
    const result = await this._analysisService.analyzeError(
      error,
      (progress) => {
        // Stream progress updates to webview
        webview.postMessage({
          type: 'progressUpdate',
          progress: {
            iteration: progress.iteration,
            maxIterations: progress.maxIterations,
            currentHypothesis: progress.currentHypothesis,
            toolsUsed: progress.toolsUsed
          }
        });
      }
    );

    // Send final result
    webview.postMessage({
      type: 'analysisComplete',
      result
    });
  }
}
```

#### **Step 6: Register Provider in Extension**

```typescript
// vscode-extension/src/extension.ts
import { RCAPanelProvider } from './panel/RCAPanelProvider';

export function activate(context: vscode.ExtensionContext) {
  // ... other initializations
  
  // Register webview provider
  const panelProvider = new RCAPanelProvider(context.extensionUri, context);
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
}
```

#### **Step 7: Build & Test**

```bash
# 1. Build webview
cd vscode-extension/webview
npm install
npm run build

# 2. Compile extension
cd ..
npm run compile

# 3. Run in VS Code
# Press F5 to launch Extension Development Host
# Open Command Palette: "View: Show RCA Agent"
```

---

### Key Adaptations

1. **Dark Theme Colors** - Already configured in prototype
   - Sidebar: `#000000` (pure black)
   - Content: `#0a0a0a` (zinc-950)
   - Borders: `#27272a` (zinc-800)

2. **Collapsible Behavior** - Already implemented
   - Auto-collapse on view switch
   - 56px collapsed, 224px expanded
   - Smooth 300ms transitions

3. **shadcn/ui Components** - All ready to use
   - Button, Card, Badge for error items
   - Progress for analysis status
   - Tabs for multi-view layouts
   - Dialog for settings
   - Select for model picker
   - Switch for toggles
   - Table for history
   - Chart for metrics

4. **Message Passing** - Connect UI to backend
   - Use `vscode.postMessage()` from webview
   - Use `webview.postMessage()` from extension
   - Handle state updates reactively

---

### UI Component Examples

#### **Error Card (with ErrorClassifier badge)**
```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

function ErrorCard({ error }: { error: ErrorItem }) {
  const categoryColors = {
    VERSION_DEPENDENCY: 'bg-yellow-500',
    MANIFEST_PERMISSION: 'bg-red-500',
    BUILD_CACHE: 'bg-blue-500',
    PROGUARD_MINIFICATION: 'bg-purple-500',
    NAVIGATION_ROUTING: 'bg-green-500',
    NETWORK_CONNECTIVITY: 'bg-orange-500'
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-white font-medium">{error.message}</h3>
          {error.category && (
            <Badge className={categoryColors[error.category]}>
              {error.category.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-400">
          {error.filePath}:{error.line}
        </p>
        <Button onClick={() => sendMessage('analyze', { errorId: error.id })}>
          Analyze
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### **Live Analysis Progress**
```tsx
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

function AnalysisProgress({ state }: { state: AgentState }) {
  const progress = (state.iteration / state.maxIterations) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white">Iteration {state.iteration}/{state.maxIterations}</span>
          <span className="text-zinc-400">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="hypothesis">
          <AccordionTrigger>Current Hypothesis</AccordionTrigger>
          <AccordionContent>
            <p className="text-zinc-300">{state.currentHypothesis}</p>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="tools">
          <AccordionTrigger>Tools Used</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1">
              {state.toolsUsed.map((tool, i) => (
                <li key={i} className="text-sm text-zinc-400"> {tool}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

---

### Final Checklist

- [ ] Copy `project/src/app/components/ui/` to webview
- [ ] Copy `project/src/app/components/CollapsibleSidebar.tsx`
- [ ] Adapt navigation items for RCA views
- [ ] Add VS Code Webview API integration
- [ ] Configure Vite build for extension output
- [ ] Create RCAPanelProvider
- [ ] Register provider in extension.ts
- [ ] Setup message handlers (both directions)
- [ ] Build and test in Extension Development Host
- [ ] Verify dark theme colors match Figma design

**Result**: Beautiful, functional UI with zero custom CSS needed! 


