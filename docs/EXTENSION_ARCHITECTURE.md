# 🏗️ VS Code Extension - Technical Architecture

> **Internal Architecture, Component Interactions, and Implementation Details**

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [UI Components](#ui-components)
5. [Backend Integration](#backend-integration)
6. [State Management](#state-management)
7. [Performance Optimizations](#performance-optimizations)
8. [Extension Lifecycle](#extension-lifecycle)

---

## 🎯 System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                    │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Extension (extension.ts)                  │  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │   Command   │  │    Event     │  │   Settings   │ │  │
│  │  │  Handlers   │  │   Listeners  │  │   Manager    │ │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘ │  │
│  │         │                │                  │          │  │
│  │         └────────────────┼──────────────────┘          │  │
│  │                          │                             │  │
│  │  ┌───────────────────────▼──────────────────────────┐ │  │
│  │  │            Analysis Orchestrator                 │ │  │
│  │  │  - Input validation & sanitization               │ │  │
│  │  │  - Error parsing & language detection            │ │  │
│  │  │  - Cache management (check/store)                │ │  │
│  │  │  - Agent execution & progress tracking           │ │  │
│  │  │  - Result formatting & display                   │ │  │
│  │  │  - Feedback handling                             │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                          │                             │  │
│  │         ┌────────────────┼────────────────┐           │  │
│  │         ▼                ▼                ▼           │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────────┐   │  │
│  │  │  Output  │    │ Webview  │    │   Feedback   │   │  │
│  │  │ Channel  │    │   Panel  │    │   Buttons    │   │  │
│  │  └──────────┘    └──────────┘    └──────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services (src/)                   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Parsers    │  │    Agent     │  │   Database   │     │
│  │  (26 types)  │  │   (ReAct)    │  │  (ChromaDB)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│  ┌────────────────────────▼───────────────────────────┐    │
│  │              Ollama LLM Service                     │    │
│  │         (http://localhost:11434)                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Architecture

### 1. Extension Entry Point (extension.ts)

**File:** `vscode-extension/src/extension.ts` (2053 lines)

**Key Functions:**

#### `activate(context: ExtensionContext)`
- Called when extension is first activated
- Registers all commands and event listeners
- Initializes output channels
- Sets up global state

```typescript
export function activate(context: vscode.ExtensionContext): void {
  // Initialize output channels
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');
  
  // Register commands
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => await analyzeErrorCommand()
  );
  
  context.subscriptions.push(analyzeCommand, ...);
}
```

#### `analyzeErrorCommand()`
- Main command handler (orchestrates entire analysis flow)
- Steps:
  1. Get error text from user (selection or input box)
  2. Validate and sanitize input
  3. Parse error with language detection
  4. Check cache for existing analysis
  5. Display cached result OR run full analysis
  6. Show feedback prompt

```typescript
async function analyzeErrorCommand(): Promise<void> {
  // 1. Get error text
  const errorText = await getErrorText();
  
  // 2. Sanitize
  const sanitized = sanitizeErrorText(errorText);
  
  // 3. Parse
  const parsedError = parseError(sanitized);
  
  // 4. Check cache
  const cachedResult = await checkCache(parsedError);
  if (cachedResult) {
    showResult(cachedResult);
    await showFeedbackPrompt(cachedResult);
    return;
  }
  
  // 5. Run full analysis
  await analyzeWithProgress(parsedError);
}
```

---

### 2. Webview Component (RCAWebview.ts)

**File:** `vscode-extension/src/ui/RCAWebview.ts` (1007 lines)

**Purpose:** Interactive visual panel for displaying analysis results

**Key Features:**
- Real-time progress updates
- Agent thought process visualization
- Theme-aware UI (follows VS Code theme)
- Educational mode support
- Performance metrics display
- Copy-to-clipboard functionality

**API:**

```typescript
export class RCAWebview {
  // Factory method
  static create(context: ExtensionContext, educationalMode: boolean): RCAWebview;
  
  // Update progress during analysis
  updateProgress(iteration: number, maxIterations: number, thought: string): void;
  
  // Display final result
  showFinalResult(rca: RCADocument): void;
  
  // Show performance metrics
  showPerformanceMetrics(metrics: PerformanceMetrics): void;
  
  // Toggle features
  setEducationalMode(enabled: boolean): void;
  setPerformanceMetrics(enabled: boolean): void;
}
```

**Message Protocol:**

Extension → Webview:
```typescript
// Progress update
{ type: 'progress', iteration: 2, maxIterations: 3, thought: '...', progress: 66 }

// Final result
{ type: 'result', rca: {...}, educationalMode: true }

// Performance metrics
{ type: 'metrics', data: {...} }

// Error
{ type: 'error', message: '...' }
```

Webview → Extension:
```typescript
// Ready for data
{ type: 'ready' }

// Copy code snippet
{ type: 'copyCode', code: '...' }

// Open file at line
{ type: 'openFile', filePath: '...', line: 42 }

// Provide feedback
{ type: 'feedback', positive: true, rcaId: '...' }
```

---

### 3. Error Parsing System

**Flow:**

```
Input Text
    ↓
sanitizeErrorText() - Remove control chars, validate length
    ↓
LanguageDetector.detect() - Heuristic detection (keyword + extension)
    ↓
ErrorParser.parse() - Route to language-specific parser
    ↓
[KotlinParser | GradleParser | XMLParser | ComposeParser | ManifestParser]
    ↓
ParsedError {
  type: 'lateinit' | 'npe' | 'compose_remember' | ...
  message: string
  filePath: string
  line: number
  language: 'kotlin' | 'java' | 'xml'
  stackTrace?: string[]
}
```

**Parser Hierarchy:**

```typescript
// Base interface
interface ParsedError {
  type: string;
  message: string;
  filePath: string;
  line: number;
  language: 'kotlin' | 'java' | 'xml';
}

// Language detection
class LanguageDetector {
  detect(errorText: string): {
    language: string;
    confidence: number;
  };
}

// Main error parser (singleton)
class ErrorParser {
  static getInstance(): ErrorParser;
  parse(errorText: string, language?: string): ParsedError | null;
}

// Language-specific parsers
class KotlinParser {
  parse(errorText: string): ParsedError | null;
  // Handles: npe, lateinit, unresolved_reference, type_mismatch, etc.
}

class JetpackComposeParser {
  parse(errorText: string): ParsedError | null;
  // Handles: compose_remember, compose_recomposition, etc.
}

// ... XMLParser, GradleParser, ManifestParser
```

---

### 4. Cache System

**Architecture:**

```
Error Input
    ↓
ErrorHasher.hash() - Generate SHA-256 hash
    ↓
RCACache.get(hash) - Check L1 in-memory cache
    ↓
    ├── Cache Hit → Return cached result (<5s)
    │
    └── Cache Miss → Run full analysis (75s avg)
            ↓
        RCACache.set(hash, result) - Store for future use
```

**Implementation:**

```typescript
// Error hashing (normalization + SHA-256)
class ErrorHasher {
  hash(error: ParsedError): string {
    // Normalize error message
    const normalized = this.normalize(error.message);
    
    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256')
      .update(`${error.type}:${normalized}`)
      .digest('hex');
    
    return hash;
  }
  
  private normalize(message: string): string {
    return message
      .toLowerCase()
      .replace(/\d+/g, 'N')  // Replace numbers
      .replace(/['"]/g, '')   // Remove quotes
      .trim();
  }
}

// L1 in-memory cache
class RCACache {
  private cache: Map<string, CacheEntry>;
  private ttl: number = 24 * 60 * 60 * 1000; // 24 hours
  
  get(hash: string): RCAResult | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(hash);
      return null;
    }
    
    return entry.result;
  }
  
  set(hash: string, result: RCAResult): void {
    this.cache.set(hash, {
      result,
      timestamp: Date.now()
    });
  }
  
  invalidate(hash: string): void {
    this.cache.delete(hash);
  }
}
```

**Cache Metadata:**

```typescript
interface RCAResult {
  // ... other fields
  fromCache?: boolean;           // Was result from cache?
  cacheTimestamp?: string;       // When was it cached?
  errorHash?: string;            // Cache key
}
```

---

### 5. Agent Integration

**ReAct Loop:**

```
Initialize Agent
    ↓
┌─────────────────────────────────────┐
│       Iteration Loop (max 3)        │
│                                     │
│  1. Reasoning Phase                 │
│     - Analyze current situation     │
│     - Decide next action            │
│     - Generate thought              │
│                                     │
│  2. Action Phase                    │
│     - Execute tool(s)               │
│     - Gather context                │
│     - Update knowledge              │
│                                     │
│  3. Observation Phase               │
│     - Process tool results          │
│     - Update confidence             │
│     - Check if done                 │
│                                     │
└─────────────────────────────────────┘
    ↓
Generate Final RCA Report
```

**Implementation:**

```typescript
class MinimalReactAgent {
  async analyze(parsedError: ParsedError): Promise<RCAResult> {
    const maxIterations = 3;
    let context = '';
    
    for (let i = 1; i <= maxIterations; i++) {
      // 1. Reasoning: Generate thought
      const thought = await this.generateThought(parsedError, context, i);
      this.emitProgress(i, maxIterations, thought);
      
      // 2. Action: Execute tools
      const tools = this.selectTools(thought);
      const toolResults = await this.executeTools(tools);
      context += toolResults;
      
      // 3. Observation: Check if done
      if (this.shouldStop(i, context)) break;
    }
    
    // Generate final RCA
    return await this.generateRCA(parsedError, context);
  }
}
```

**Tool Execution:**

```typescript
interface Tool {
  name: string;
  description: string;
  execute(params: any): Promise<string>;
}

class ToolRegistry {
  private tools: Map<string, Tool>;
  
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  execute(name: string, params: any): Promise<string>;
}

// Available tools:
// - ReadFileTool: Extract code context (±25 lines)
// - LSPTool: Code analysis (types, references)
// - AndroidBuildTool: Version resolution
// - AndroidDocsSearchTool: Offline documentation
// - ManifestAnalyzerTool: Manifest errors
```

---

## 🔄 Data Flow

### Complete Analysis Flow

```
┌─────────────────┐
│  User Action    │
│  (Ctrl+Shift+R) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  1. Input Handling                              │
│     - Get text (selection or input box)         │
│     - Validate length (<50KB)                   │
│     - Sanitize (remove control chars)           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  2. Error Parsing                               │
│     - Detect language (Kotlin/Compose/XML/etc)  │
│     - Extract error type, file, line            │
│     - Parse stack trace                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  3. Cache Lookup                                │
│     - Generate error hash (SHA-256)             │
│     - Check L1 cache (Map)                      │
│     - Check TTL (24 hours)                      │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼ (Hit)              ▼ (Miss)
┌──────────────┐    ┌─────────────────────────────┐
│ Return Cache │    │  4. Full Analysis           │
│ (<5s)        │    │     - Initialize agent      │
└──────┬───────┘    │     - Run ReAct loop (3x)   │
       │            │     - Execute tools          │
       │            │     - Generate RCA           │
       │            └─────────────┬───────────────┘
       │                          │
       │                          ▼
       │            ┌─────────────────────────────┐
       │            │  5. Store in Cache          │
       │            │     - Generate hash         │
       │            │     - Store with TTL        │
       │            └─────────────┬───────────────┘
       │                          │
       └──────────────┬───────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  6. Display Results                             │
│     - Format as markdown/HTML                   │
│     - Show in output channel OR webview         │
│     - Display performance metrics (if enabled)  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  7. Feedback Collection                         │
│     - Show 👍/👎 buttons                        │
│     - Collect optional comments                 │
│     - Update quality scores                     │
│     - Invalidate cache if negative              │
└─────────────────────────────────────────────────┘
```

---

## 🎨 UI Components

### Output Channel (Text-Based)

**Format Structure:**

```
🔴 ERROR ANALYSIS
════════════════════════════════════════════════════
[Header with file, type, message]

────────────────────────────────────────────────────
🎯 ROOT CAUSE
────────────────────────────────────────────────────
[Analysis paragraph]

────────────────────────────────────────────────────
🛠️  FIX GUIDELINES
────────────────────────────────────────────────────
1. [Step 1]
2. [Step 2]
...

────────────────────────────────────────────────────
📊 METADATA
────────────────────────────────────────────────────
[Confidence, tools, timing, cache status]

────────────────────────────────────────────────────
🎓 LEARNING NOTES (if educational mode)
────────────────────────────────────────────────────
[What/Why/How sections]

────────────────────────────────────────────────────
💬 FEEDBACK
────────────────────────────────────────────────────
[Prompt for feedback]
```

### Webview Panel (HTML/CSS/JS)

**Component Hierarchy:**

```html
<div class="rca-container">
  <!-- Header -->
  <div class="header">
    <span class="error-badge">🔴 LATEINIT</span>
    <h1>MainActivity.kt:42</h1>
  </div>
  
  <!-- Progress (during analysis) -->
  <div class="progress-section">
    <div class="progress-bar" style="width: 66%"></div>
    <p>Iteration 2/3: Analyzing code context...</p>
  </div>
  
  <!-- Results (after analysis) -->
  <div class="results-section">
    <h2>🎯 Root Cause</h2>
    <p>[Analysis]</p>
    
    <h2>🛠️ Fix Guidelines</h2>
    <ol>
      <li>[Step 1]</li>
      <li>[Step 2]</li>
    </ol>
    
    <h2>📄 Code Snippet</h2>
    <pre><code class="language-kotlin">[Code]</code></pre>
  </div>
  
  <!-- Educational (if enabled) -->
  <div class="learning-notes">
    <h3>🎓 What</h3>
    <p>[Explanation]</p>
    
    <h3>🎓 Why</h3>
    <p>[Causes]</p>
    
    <h3>🎓 How</h3>
    <p>[Prevention]</p>
  </div>
  
  <!-- Performance Metrics (if enabled) -->
  <div class="performance-metrics">
    <h3>⚡ Performance</h3>
    <ul>
      <li>Total Time: 12.5s</li>
      <li>LLM Time: 10.2s</li>
      <li>Tool Time: 2.3s</li>
    </ul>
  </div>
  
  <!-- Actions -->
  <div class="actions">
    <button onclick="copyCode()">📋 Copy Code</button>
    <button onclick="openFile()">📂 Open File</button>
    <button onclick="sendFeedback(true)">👍 Helpful</button>
    <button onclick="sendFeedback(false)">👎 Not Helpful</button>
  </div>
</div>
```

**Styling:**

- Uses VS Code CSS variables for theme compatibility
- Responsive layout (adapts to panel width)
- Animated progress bar
- Syntax highlighted code blocks

```css
:root {
  --vscode-editor-foreground: ...;
  --vscode-editor-background: ...;
  --vscode-textLink-foreground: ...;
  /* ... other VS Code theme variables */
}
```

---

## 🔌 Backend Integration

### Service Communication

```typescript
// Extension → Backend
import { ErrorParser } from '../src/utils/ErrorParser';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { RCACache } from '../src/cache/RCACache';
import { ChromaDBClient } from '../src/db/ChromaDBClient';

// Initialize services
const ollamaClient = new OllamaClient({
  baseUrl: settings.get('ollamaUrl'),
  model: settings.get('model')
});

const agent = new MinimalReactAgent(ollamaClient);
const cache = RCACache.getInstance();

// Use in extension
async function analyzeError(error: ParsedError): Promise<RCAResult> {
  // Check cache first
  const hash = ErrorHasher.hash(error);
  const cached = cache.get(hash);
  if (cached) return cached;
  
  // Run agent
  const result = await agent.analyze(error);
  
  // Cache result
  cache.set(hash, result);
  
  return result;
}
```

### Configuration Bridge

```typescript
// VS Code settings → Backend config
function getOllamaConfig(): OllamaConfig {
  const config = vscode.workspace.getConfiguration('rcaAgent');
  
  return {
    baseUrl: config.get<string>('ollamaUrl', 'http://localhost:11434'),
    model: config.get<string>('model', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest'),
    timeout: 120000, // 2 minutes
    retryAttempts: 3
  };
}
```

---

## 📊 State Management

### Global State

```typescript
// Extension-wide state
let extensionContext: vscode.ExtensionContext;
let outputChannel: vscode.OutputChannel;
let debugChannel: vscode.OutputChannel;
let currentWebview: RCAWebview | undefined;
let educationalMode: boolean = false;

// Persistent state (survives reload)
context.globalState.update('educationalMode', true);
const mode = context.globalState.get<boolean>('educationalMode');

// Workspace state (per-workspace)
context.workspaceState.update('lastAnalysis', result);
```

### Webview State

```typescript
// Webview maintains own state
class RCAWebview {
  private educationalMode: boolean;
  private showPerformanceMetrics: boolean;
  private currentResult: RCADocument | null;
  
  // State updates trigger UI re-render
  setEducationalMode(enabled: boolean): void {
    this.educationalMode = enabled;
    this.panel.webview.postMessage({
      type: 'educationalMode',
      enabled
    });
  }
}
```

---

## ⚡ Performance Optimizations

### 1. Lazy Loading

```typescript
// Load heavy dependencies only when needed
async function analyzeWithLLM(error: ParsedError): Promise<RCAResult> {
  // Only import when actually needed
  const { MinimalReactAgent } = await import('../src/agent/MinimalReactAgent');
  const { OllamaClient } = await import('../src/llm/OllamaClient');
  
  const agent = new MinimalReactAgent(new OllamaClient());
  return await agent.analyze(error);
}
```

### 2. Caching Strategy

```typescript
// L1: In-memory cache (Map) - <5ms
// L2: ChromaDB vector store - 200-500ms
// L3: Full LLM analysis - 75s avg

async function getCachedOrAnalyze(error: ParsedError): Promise<RCAResult> {
  const hash = ErrorHasher.hash(error);
  
  // L1: Memory
  const l1 = RCACache.getInstance().get(hash);
  if (l1) return l1;
  
  // L2: Database (semantic search)
  const l2 = await searchSimilarErrors(error);
  if (l2 && l2.similarity > 0.95) return l2.result;
  
  // L3: Full analysis
  const result = await runFullAnalysis(error);
  
  // Cache in both layers
  RCACache.getInstance().set(hash, result);
  await storeInDatabase(result);
  
  return result;
}
```

### 3. Progressive Rendering

```typescript
// Show results as they arrive
async function analyzeWithProgress(error: ParsedError): Promise<void> {
  const agent = new MinimalReactAgent(ollamaClient);
  
  // Subscribe to progress events
  agent.getStream().on('iteration', (data) => {
    // Update webview immediately
    currentWebview?.updateProgress(
      data.iteration,
      data.maxIterations,
      data.thought
    );
  });
  
  // Final result
  const result = await agent.analyze(error);
  currentWebview?.showFinalResult(result);
}
```

---

## 🔄 Extension Lifecycle

### Activation Flow

```
VS Code Startup
    ↓
Extension Manifest Check (package.json)
    ↓
Activation Events Match?
    - onCommand:rcaAgent.analyzeError
    - onCommand:rcaAgent.analyzeErrorWebview
    - onCommand:rcaAgent.toggleEducationalMode
    - onCommand:rcaAgent.togglePerformanceMetrics
    ↓ (Yes)
Extension Activated
    ↓
activate(context) called
    ↓
    ├─ Create output channels
    ├─ Register commands
    ├─ Setup event listeners
    └─ Initialize global state
    ↓
Extension Ready
```

### Command Registration

```typescript
export function activate(context: vscode.ExtensionContext): void {
  // Register command with error handling
  const command = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      try {
        await analyzeErrorCommand();
      } catch (error) {
        log('error', 'Command failed', error);
        vscode.window.showErrorMessage(`RCA Agent error: ${error.message}`);
      }
    }
  );
  
  // Add to subscriptions for cleanup
  context.subscriptions.push(command);
}
```

### Deactivation Flow

```
VS Code Shutdown
    ↓
deactivate() called
    ↓
    ├─ Dispose output channels
    ├─ Close webview panels
    ├─ Clear cache (optional)
    └─ Cleanup resources
    ↓
Extension Deactivated
```

```typescript
export function deactivate(): void {
  // Cleanup resources
  outputChannel?.dispose();
  debugChannel?.dispose();
  currentWebview?.dispose();
  
  // Optional: Clear cache
  RCACache.getInstance().clear();
}
```

---

## 🎓 Best Practices

### Error Handling

```typescript
// Always wrap command handlers
vscode.commands.registerCommand('rcaAgent.analyzeError', async () => {
  try {
    await analyzeErrorCommand();
  } catch (error) {
    // Log to debug channel
    debugChannel.appendLine(`ERROR: ${error.message}`);
    debugChannel.appendLine(error.stack);
    
    // Show user-friendly message
    vscode.window.showErrorMessage(
      `RCA Agent error: ${error.message}`,
      'View Logs'
    ).then((action) => {
      if (action === 'View Logs') {
        debugChannel.show();
      }
    });
  }
});
```

### Resource Management

```typescript
// Always dispose resources
class ResourceManager {
  private disposables: vscode.Disposable[] = [];
  
  register(disposable: vscode.Disposable): void {
    this.disposables.push(disposable);
  }
  
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

// Usage
const manager = new ResourceManager();
manager.register(outputChannel);
manager.register(webview);

context.subscriptions.push({
  dispose: () => manager.dispose()
});
```

### Configuration Watching

```typescript
// React to settings changes
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration('rcaAgent.model')) {
    const newModel = vscode.workspace.getConfiguration('rcaAgent')
      .get<string>('model');
    
    // Reinitialize Ollama client
    ollamaClient = new OllamaClient({ model: newModel });
    
    vscode.window.showInformationMessage(
      `RCA Agent now using model: ${newModel}`
    );
  }
});
```

---

## 📚 References

- **VS Code Extension API**: https://code.visualstudio.com/api
- **Extension Samples**: https://github.com/microsoft/vscode-extension-samples
- **Webview API**: https://code.visualstudio.com/api/extension-guides/webview

---

**Last Updated:** December 24, 2025  
**Version:** 0.1.0

