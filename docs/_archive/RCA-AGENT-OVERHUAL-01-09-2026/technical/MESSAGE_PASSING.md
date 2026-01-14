# Message Passing - Technical Reference

**Purpose:** Extension [H_ARROW] Webview communication patterns  
**Protocol:** VS Code Webview API

---

## Overview

The React UI (webview) communicates with the VS Code extension via message passing.

---

## Architecture

```
         
   React Webview                VS Code Extension  
                                                   
  postMessage()     onDidReceiveMessage
                                                   
  onMessage     postMessage()      
                                                   
         
```

---

## Extension → Webview

### Setup

```typescript
// In RCAWebviewProvider.ts
class RCAWebviewProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webview = webviewView.webview;

    // Send message to webview
    this.webview.postMessage({
      command: 'init',
      data: { /* ... */ }
    });
  }

  sendToWebview(message: Message) {
    this.webview?.postMessage(message);
  }
}
```

### Message Types

```typescript
// Analysis complete
webview.postMessage({
  command: 'analysisComplete',
  result: {
    rootCause: 'Variable not initialized',
    confidence: 0.95,
    fixes: [/* ... */]
  }
});

// Progress update
webview.postMessage({
  command: 'progressUpdate',
  iteration: 3,
  maxIterations: 6,
  hypothesis: 'Checking null safety...',
  confidence: 0.75
});

// Error detected
webview.postMessage({
  command: 'errorDetected',
  error: {
    message: 'NullPointerException',
    file: 'Main.kt',
    line: 42
  }
});

// Ollama status
webview.postMessage({
  command: 'ollamaStatusChanged',
  status: {
    available: true,
    latency: 120,
    model: 'deepseek-r1'
  }
});

// Configuration changed
webview.postMessage({
  command: 'configChanged',
  key: 'educationalMode',
  value: true
});

// Fix generated
webview.postMessage({
  command: 'fixGenerated',
  fix: {
    id: 'fix-123',
    title: 'Add null check',
    code: 'if (obj != null) { ... }',
    confidence: 0.85
  }
});

// History updated
webview.postMessage({
  command: 'historyUpdated',
  history: [/* recent analyses */]
});

// Error queue updated
webview.postMessage({
  command: 'queueUpdated',
  queue: [/* pending errors */]
});
```

---

## Webview → Extension

### Setup

```typescript
// In React component
const vscode = acquireVsCodeApi();

// Send message to extension
vscode.postMessage({
  command: 'analyzeError',
  error: { message: 'NPE at line 42' }
});

// Receive messages from extension
useEffect(() => {
  const handler = (event: MessageEvent) => {
    const message = event.data;
    
    switch (message.command) {
      case 'analysisComplete':
        setResult(message.result);
        break;
      
      case 'progressUpdate':
        setProgress(message);
        break;
      
      // ... other cases
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, []);
```

### Message Types

```typescript
// Analyze error
vscode.postMessage({
  command: 'analyzeError',
  error: {
    message: 'NullPointerException at line 42',
    file: 'src/Main.kt',
    line: 42,
    stackTrace: '...'
  }
});

// Cancel analysis
vscode.postMessage({
  command: 'cancelAnalysis'
});

// Generate fix
vscode.postMessage({
  command: 'generateFix',
  errorId: 'error-123'
});

// Apply fix
vscode.postMessage({
  command: 'applyFix',
  fixId: 'fix-456'
});

// Search history
vscode.postMessage({
  command: 'searchHistory',
  query: 'NullPointerException'
});

// Update configuration
vscode.postMessage({
  command: 'updateConfig',
  key: 'model',
  value: 'deepseek-r1'
});

// Navigate to file
vscode.postMessage({
  command: 'navigateToFile',
  file: 'src/Main.kt',
  line: 42
});

// Export analysis
vscode.postMessage({
  command: 'exportAnalysis',
  analysisId: 'analysis-789'
});

// Submit feedback
vscode.postMessage({
  command: 'submitFeedback',
  analysisId: 'analysis-789',
  helpful: true,
  comment: 'Great analysis!'
});

// Check Ollama status
vscode.postMessage({
  command: 'checkOllamaStatus'
});

// Bulk analyze
vscode.postMessage({
  command: 'bulkAnalyze',
  errorIds: ['error-1', 'error-2', 'error-3']
});

// Pin error
vscode.postMessage({
  command: 'pinError',
  errorId: 'error-123',
  pinned: true
});
```

---

## Extension Message Handler

```typescript
// In RCAWebviewProvider.ts
class RCAWebviewProvider {
  private setupMessageHandler() {
    this.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'analyzeError':
          await this.handleAnalyzeError(message.error);
          break;

        case 'cancelAnalysis':
          this.analysisService.cancelAnalysis();
          break;

        case 'generateFix':
          await this.handleGenerateFix(message.errorId);
          break;

        case 'applyFix':
          await this.handleApplyFix(message.fixId);
          break;

        case 'searchHistory':
          await this.handleSearchHistory(message.query);
          break;

        case 'updateConfig':
          await this.handleUpdateConfig(message.key, message.value);
          break;

        case 'navigateToFile':
          await this.handleNavigateToFile(message.file, message.line);
          break;

        case 'exportAnalysis':
          await this.handleExportAnalysis(message.analysisId);
          break;

        case 'submitFeedback':
          await this.handleSubmitFeedback(message);
          break;

        case 'checkOllamaStatus':
          await this.handleCheckOllamaStatus();
          break;

        case 'bulkAnalyze':
          await this.handleBulkAnalyze(message.errorIds);
          break;

        case 'pinError':
          await this.handlePinError(message.errorId, message.pinned);
          break;
      }
    });
  }

  private async handleAnalyzeError(error: ErrorInfo) {
    try {
      const result = await this.analysisService.analyzeError(
        error,
        (progress) => {
          // Send progress updates to webview
          this.webview.postMessage({
            command: 'progressUpdate',
            ...progress
          });
        }
      );

      // Send result to webview
      this.webview.postMessage({
        command: 'analysisComplete',
        result
      });
    } catch (error) {
      this.webview.postMessage({
        command: 'analysisError',
        error: error.message
      });
    }
  }

  // ... other handlers
}
```

---

## React Hook for Message Passing

```typescript
// useVSCode.ts
function useVSCode() {
  const vscode = acquireVsCodeApi();

  const sendMessage = useCallback((message: Message) => {
    vscode.postMessage(message);
  }, []);

  const onMessage = useCallback((handler: MessageHandler) => {
    const listener = (event: MessageEvent) => {
      handler(event.data);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return { sendMessage, onMessage };
}

// Usage in component
function AnalyzeView() {
  const { sendMessage, onMessage } = useVSCode();
  const [result, setResult] = useState<RCAResult | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    return onMessage((message) => {
      switch (message.command) {
        case 'analysisComplete':
          setResult(message.result);
          break;

        case 'progressUpdate':
          setProgress(message);
          break;
      }
    });
  }, [onMessage]);

  const handleAnalyze = (error: string) => {
    sendMessage({
      command: 'analyzeError',
      error: { message: error }
    });
  };

  return (
    <div>
      {progress && <Progress value={progress.iteration} max={6} />}
      {result && <ResultDisplay result={result} />}
      <Button onClick={() => handleAnalyze(errorText)}>
        Analyze
      </Button>
    </div>
  );
}
```

---

## Real-Time Subscriptions

For live updates (agent state, error queue):

```typescript
// Extension side
class RCAWebviewProvider {
  private subscriptions: vscode.Disposable[] = [];

  private setupSubscriptions() {
    // Subscribe to agent state stream
    const stateSubscription = this.analysisService
      .getStateStream()
      .subscribe((state) => {
        this.webview.postMessage({
          command: 'agentStateUpdate',
          state
        });
      });

    // Subscribe to error queue updates
    const queueSubscription = this.errorQueueManager
      .onQueueChanged((queue) => {
        this.webview.postMessage({
          command: 'queueUpdated',
          queue
        });
      });

    this.subscriptions.push(
      stateSubscription,
      queueSubscription
    );
  }

  dispose() {
    this.subscriptions.forEach(s => s.dispose());
  }
}

// Webview side
function AgentStateView() {
  const { onMessage } = useVSCode();
  const [state, setState] = useState<AgentState | null>(null);

  useEffect(() => {
    return onMessage((message) => {
      if (message.command === 'agentStateUpdate') {
        setState(message.state);
      }
    });
  }, [onMessage]);

  return (
    <div>
      {state && (
        <>
          <Progress value={state.iteration} max={6} />
          <p>Hypothesis: {state.hypothesis}</p>
          <p>Confidence: {state.confidence}%</p>
        </>
      )}
    </div>
  );
}
```

---

## State Persistence

```typescript
// Persist state across reloads
const vscode = acquireVsCodeApi();

// Get previous state
const previousState = vscode.getState();

// Update state
const newState = { ...previousState, key: 'value' };
vscode.setState(newState);
```

---

## Summary

### Communication Patterns

1. **Request-Response:** Webview requests, extension responds
2. **Push Updates:** Extension pushes updates to webview
3. **Real-Time Streams:** Continuous updates via subscriptions

### Best Practices

-  Use typed messages
-  Handle errors gracefully
-  Show loading states
-  Cleanup subscriptions
-  Persist state across reloads

### Performance

- Messages are serialized (use JSON-friendly data)
- Avoid sending large data frequently
- Batch updates when possible
- Use throttling for high-frequency updates

---

**Related:**
- [Frontend Services](FRONTEND_SERVICES.md)
- [Core Agents](CORE_AGENTS.md)
