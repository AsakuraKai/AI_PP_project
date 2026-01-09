# Frontend Services - Technical Reference

**Category:** Frontend Services (vscode-extension/src/services/)  
**Purpose:** Primary integration points for UI

---

## Overview

These services live in the VS Code extension and bridge the UI to backend logic.

---

## 1. AnalysisService

**Location:** `vscode-extension/src/services/AnalysisService.ts`  
**Purpose:** Orchestrates error analysis using MinimalReactAgent

### Key Methods

```typescript
class AnalysisService {
  // Main analysis method
  async analyzeError(
    error: ErrorInfo,
    onProgress?: (update: ProgressUpdate) => void
  ): Promise<RCAResult>

  // Get real-time state stream
  getStateStream(): Observable<AgentState>

  // Cancel running analysis
  cancelAnalysis(): void

  // Get past analyses
  getHistory(): AnalysisResult[]

  // Search history
  searchHistory(query: string): AnalysisResult[]
}
```

### UI Integration

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Analyze View | `analyzeError()` | Trigger new analysis |
| Analyze View | `getStateStream()` | Live progress updates |
| Analyze View | `cancelAnalysis()` | Cancel button |
| History View | `getHistory()` | Load past analyses |
| History View | `searchHistory()` | Search functionality |
| Dashboard | `getHistory()` | Recent activity feed |

### Message Passing Example

```typescript
// In webview:
vscode.postMessage({
  command: 'analyzeError',
  error: { message: 'NPE at line 42', file: 'Main.kt' }
});

// In extension:
case 'analyzeError':
  const result = await analysisService.analyzeError(message.error);
  panel.webview.postMessage({ 
    command: 'analysisComplete', 
    result 
  });
```

---

## 2. FixApplicationService

**Location:** `vscode-extension/src/services/FixApplicationService.ts`  
**Purpose:** Generate, preview, and apply code fixes

**[WARNING] P0 Gap:** Currently uses templates, needs `src/agent/FixGenerator.ts` integration

### Key Methods

```typescript
class FixApplicationService {
  // Generate fix for error (TODO: Use FixGenerator)
  async generateFix(error: ErrorInfo): Promise<Fix>

  // Get all pending fixes
  getPendingFixes(): Fix[]

  // Generate diff preview
  async generateDiffPreview(fix: Fix): Promise<Diff>

  // Apply fix to file
  async applyFix(fixId: string): Promise<void>

  // Validate fix before applying
  async validateFix(fix: Fix): Promise<ValidationResult>

  // Get applied fixes history
  getAppliedFixes(): Fix[]
}
```

### UI Integration

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Analyze View | `generateFix()` | Generate fix suggestions |
| Fix Manager | `getPendingFixes()` | Load pending queue |
| Fix Manager | `generateDiffPreview()` | Show diff modal |
| Fix Manager | `applyFix()` | Apply button |
| Fix Manager | `validateFix()` | Validate before apply |
| Fix Manager | `getAppliedFixes()` | Applied history tab |

### Required Integration (P0)

```typescript
import { FixGenerator } from '../../../src/agent/FixGenerator';
import { OllamaClient } from '../../../src/llm/OllamaClient';

class FixApplicationService {
  private fixGenerator: FixGenerator;

  constructor() {
    this.fixGenerator = new FixGenerator(
      new OllamaClient({ model: 'deepseek-r1' }),
      new PromptManager()
    );
  }

  async generateFix(error: ErrorInfo): Promise<Fix> {
    return await this.fixGenerator.generateFix({
      error: error.message,
      stackTrace: error.stackTrace,
      file: error.file,
      line: error.line,
      context: await this.getFileContext(error.file, error.line)
    });
  }
}
```

---

## 3. NetworkTimeoutHandler

**Location:** `vscode-extension/src/services/NetworkTimeoutHandler.ts` (359 lines)  
**Purpose:** Timeout protection for Ollama API calls

** P0 Gap:** Exists but not used - must wrap all Ollama calls

### Key Methods

```typescript
class NetworkTimeoutHandler {
  static getInstance(): NetworkTimeoutHandler

  // Wrap operation with timeout
  async withTimeout<T>(
    operation: () => Promise<T>,
    options: TimeoutOptions
  ): Promise<T>

  // Check Ollama availability
  async checkOllamaAvailability(config: {
    baseUrl: string;
    timeout: number;
  }): Promise<OllamaStatus>

  // Configure timeout settings
  configure(settings: TimeoutSettings): void
}
```

### UI Integration

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Dashboard | `checkOllamaAvailability()` | Connection status card |
| Settings | `checkOllamaAvailability()` | Status indicator |
| Analyze View | `withTimeout()` | Wrap analysis calls |

### Required Integration (P0)

```typescript
// In AnalysisService.ts
import { NetworkTimeoutHandler } from './NetworkTimeoutHandler';

class AnalysisService {
  private timeoutHandler = NetworkTimeoutHandler.getInstance();

  async analyzeError(error: ErrorInfo): Promise<RCAResult> {
    return this.timeoutHandler.withTimeout(
      () => this.agent.analyze(error),
      { timeout: 120000, operation: 'analyzeError' }
    );
  }
}
```

---

## 4. ErrorQueueManager

**Location:** `vscode-extension/src/services/ErrorQueueManager.ts`  
**Purpose:** Manage detected errors queue

### Key Methods

```typescript
class ErrorQueueManager {
  // Get all errors
  getQueue(): ErrorInfo[]

  // Add error to queue
  addError(error: ErrorInfo): void

  // Remove error
  removeError(errorId: string): void

  // Update error status
  updateStatus(errorId: string, status: ErrorStatus): void

  // Clear queue
  clearQueue(): void
}
```

### UI Integration

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Dashboard | `getQueue()` | Pending errors count |
| Error Queue | `getQueue()` | Display all errors |
| Error Queue | `updateStatus()` | After analysis |

---

## 5. StateManager

**Location:** `vscode-extension/src/services/StateManager.ts`  
**Purpose:** Persist and retrieve application state

### Key Methods

```typescript
class StateManager {
  // Get analysis history
  getHistory(): AnalysisResult[]

  // Search history
  searchHistory(query: string): AnalysisResult[]

  // Save analysis result
  saveResult(result: AnalysisResult): void

  // Get/set configuration
  getConfig(key: string): any
  setConfig(key: string, value: any): void
}
```

### UI Integration

| UI Component | Method | Purpose |
|--------------|--------|---------|
| History View | `getHistory()` | Load timeline |
| History View | `searchHistory()` | Search box |
| Dashboard | `getHistory()` | Recent activity |
| All Views | `getConfig()`/`setConfig()` | Settings persistence |

---

## Summary

### Integration Priority

**P0 (Week 1):**
1. Fix FixApplicationService to use FixGenerator
2. Wrap all services with NetworkTimeoutHandler
3. Register ChatActionCommands

**P1 (Week 5+):**
- See [INTEGRATION_GAPS.md](INTEGRATION_GAPS.md)

### Message Passing Patterns

All services communicate with UI via message passing:

```typescript
// Extension → Webview
webview.postMessage({ command: 'dataUpdate', data: {} });

// Webview → Extension
webview.onDidReceiveMessage(msg => {
  const result = await service.method(msg.params);
  webview.postMessage({ command: 'result', result });
});
```

---

**Related:**
- [Core Agents](CORE_AGENTS.md)
- [Tools System](TOOLS_SYSTEM.md)
- [Message Passing](MESSAGE_PASSING.md)
