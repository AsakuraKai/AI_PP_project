<<<<<<< HEAD
# 🎨 PHASE 1 OPTION B: SOKCHEA'S WORK (UI & Integration)

> **Role:** UI Developer & Integration Specialist - Connects Kai's backend to VS Code extension
> **Responsibility:** No business logic - focus purely on UI/UX and wiring

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Best Practices & Critical Rules](#-best-practices--critical-rules)
3. [Development Chunks](#chunk-1-mvp-ui-weeks-1-2)
4. [Collaboration with Kai](#collaboration-with-kai)
5. [Success Metrics](#success-metrics)

---

## Overview

**What Sokchea Does:**
- ✅ VS Code extension structure and activation
- ✅ Command registration and user interaction
- ✅ Display Kai's results in UI (output channels, webviews)
- ✅ Wire UI events to Kai's backend functions
- ✅ Create webview panels with HTML/CSS
- ✅ User-facing documentation
- ✅ Extension packaging and deployment

**What Sokchea Does NOT Do:**
- ❌ Business logic or algorithms
- ❌ Parser implementation
- ❌ Agent reasoning
- ❌ Database operations
- ❌ Tool execution logic

**Key Principle:** Sokchea CALLS Kai's functions, never implements them.

---

## 🎯 Best Practices & Critical Rules

### 🚨 CRITICAL: Extension Development Rules

#### 1. Resource Management (Memory Leaks Prevention)
```typescript
// ✅ ALWAYS: Dispose resources properly
export function activate(context: vscode.ExtensionContext) {
  const disposables: vscode.Disposable[] = [];
  
  // All registrations must be disposed
  disposables.push(
    vscode.commands.registerCommand('cmd', handler),
    vscode.window.onDidChangeActiveTextEditor(onEditorChange),
    vscode.workspace.onDidCloseTextDocument(onDocClose)
  );
  
  // Add to context for automatic cleanup
  disposables.forEach(d => context.subscriptions.push(d));
}

export function deactivate() {
  // Manual cleanup if needed
  outputChannel?.dispose();
  webviewPanel?.dispose();
}

// ❌ NEVER: Leave event listeners without disposal
class BadWebview {
  constructor() {
    this.panel.webview.onDidReceiveMessage((msg) => {
      // Memory leak - handler never disposed!
    });
  }
}
```

#### 2. Async/Await - Never Block Extension Host
```typescript
// ❌ NEVER: Synchronous blocking operations
function badAnalyze() {
  const result = agent.analyzeSync(error); // Freezes VS Code!
  showResult(result);
}

// ✅ ALWAYS: Use async/await with progress indicators
async function goodAnalyze() {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Analyzing error...',
    cancellable: false
  }, async (progress) => {
    const result = await agent.analyze(error); // Non-blocking
    progress.report({ increment: 100 });
    showResult(result);
  });
}
```

#### 3. Error Handling - User-Friendly Messages
```typescript
// ✅ ALWAYS: Comprehensive error handling with actions
async function analyzeWithErrorHandling() {
  try {
    const result = await agent.analyze(error);
    return result;
  } catch (error) {
    // Specific error handling
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
      vscode.window.showErrorMessage(
        'Could not connect to Ollama. Is it running?',
        'Start Ollama',
        'View Docs'
      ).then(selection => {
        if (selection === 'Start Ollama') {
          vscode.env.openExternal(vscode.Uri.parse('ollama://'));
        } else if (selection === 'View Docs') {
          vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
        }
      });
    } else {
      vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
    }
    
    // Log to debug channel
    debugChannel.appendLine(`Error: ${error.stack}`);
  }
}
```

---

### 🔒 Security Best Practices

#### Content Security Policy for Webviews
```typescript
// ✅ CRITICAL: Always set strict CSP for webviews
function getHtmlContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
  const nonce = getNonce(); // Generate nonce for inline scripts
  
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'webview.js')
  );
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src 'nonce-${nonce}';
    img-src ${webview.cspSource} https: data:;
  ">
</head>
<body>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

#### Input Validation & Sanitization
```typescript
// ✅ ALWAYS: Validate and sanitize all user input
function sanitizeErrorText(input: string): string {
  // 1. Length validation
  if (input.length > 50000) {
    throw new Error('Error text too large (max 50KB)');
  }
  
  // 2. Remove XSS attempts
  const sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // 3. Remove control characters
  return sanitized.replace(/[\x00-\x1F\x7F]/g, '');
}
```

---

### ⚡ Performance Optimization

#### Lazy Loading
```typescript
// ✅ BEST PRACTICE: Lazy load heavy dependencies
export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('rcaAgent.analyzeError', async () => {
      // Import only when needed
      const { MinimalReactAgent } = await import('./agent/MinimalReactAgent');
      const { OllamaClient } = await import('./llm/OllamaClient');
      
      const llm = await OllamaClient.create({ model: 'granite-code:8b' });
      const agent = new MinimalReactAgent(llm);
    })
  );
}
```

#### Debouncing & Throttling
```typescript
// ✅ BEST PRACTICE: Debounce expensive operations
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage: Don't spam the backend
const debouncedSearch = debounce(async (query: string) => {
  const results = await db.searchSimilar(query, 5);
  updateUI(results);
}, 500);
```

#### Efficient Webview Updates
```typescript
// ❌ BAD: Recreating entire HTML on each update
function badUpdate(result: RCAResult) {
  webview.html = getFullHtml(result); // Re-renders everything!
}

// ✅ GOOD: Use message passing for incremental updates
function goodUpdate(result: RCAResult) {
  webview.postMessage({
    type: 'updateResult',
    data: result
  });
}
```

---

### ♿ Accessibility Guidelines

```html
<!-- ✅ ALWAYS: Include ARIA labels and roles -->
<div role="main" aria-label="Root Cause Analysis Results">
  <div role="region" aria-labelledby="error-heading">
    <h2 id="error-heading">Error Details</h2>
    <p aria-describedby="error-description">
      <span id="error-description">{{ errorMessage }}</span>
    </p>
  </div>
  
  <div role="region" aria-live="polite" aria-atomic="true">
    <!-- Dynamic content announcements -->
    {{ rootCause }}
  </div>
</div>
```

---

### 🧪 Testing Strategies

#### Unit Testing Pattern
```typescript
// tests/unit/extension.test.ts
import * as assert from 'assert';
import { sanitizeErrorText } from '../../extension';

suite('Extension Unit Tests', () => {
  test('sanitizeErrorText removes HTML', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeErrorText(input);
    assert.strictEqual(output, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
  
  test('sanitizeErrorText enforces length limit', () => {
    const input = 'a'.repeat(60000);
    assert.throws(() => sanitizeErrorText(input));
  });
});
```

#### Integration Testing with Mocks
```typescript
// tests/integration/agent-integration.test.ts
import * as sinon from 'sinon';
import { MinimalReactAgent } from '../../agent/MinimalReactAgent';

suite('Agent Integration Tests', () => {
  let analyzeStub: sinon.SinonStub;
  
  setup(() => {
    analyzeStub = sinon.stub(MinimalReactAgent.prototype, 'analyze');
    analyzeStub.resolves({
      error: 'NullPointerException',
      rootCause: 'Variable not initialized',
      confidence: 0.95
    });
  });
  
  teardown(() => {
    analyzeStub.restore();
  });
  
  test('UI displays mocked result', async () => {
    await vscode.commands.executeCommand('rcaAgent.analyzeError');
    assert.ok(analyzeStub.calledOnce);
  });
});
```

---

### 📝 TypeScript Best Practices

```typescript
// ✅ ALWAYS: Use strict type checking
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// ✅ ALWAYS: Define interfaces for all data
interface RCAResult {
  error: string;
  errorType: string;
  rootCause: string;
  fixGuidelines: string[];
  confidence: number;
  codeSnippet?: string;
  metadata?: Record<string, unknown>;
}

// ✅ ALWAYS: Use type guards
function isRCAResult(obj: unknown): obj is RCAResult {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  
  return (
    typeof r.error === 'string' &&
    typeof r.rootCause === 'string' &&
    Array.isArray(r.fixGuidelines) &&
    typeof r.confidence === 'number'
  );
}

// ❌ NEVER: Use 'any' type
function bad(data: any) { } // Loses type safety!

// ✅ ALWAYS: Use proper types or generics
function good<T>(data: T): T { return data; }
```

---

### 🤝 Integration with Kai's Backend

#### Interface Contracts
```typescript
// ✅ CRITICAL: Define clear contracts with Kai
// contracts/agent.contract.ts

export interface ParsedError {
  type: string;
  message: string;
  filePath: string;
  line: number;
  language: 'kotlin' | 'java' | 'xml';
}

export interface IErrorParser {
  parse(errorText: string): ParsedError | null;
}

export interface IReactAgent {
  analyze(error: ParsedError): Promise<RCADocument>;
}
```

#### Dependency Injection
```typescript
// ✅ BEST PRACTICE: Use DI for testability
class RCAExtension {
  constructor(
    private parser: IErrorParser,  // Kai's implementation
    private agent: IReactAgent,    // Kai's implementation
    private ui: IUserInterface     // Sokchea's implementation
  ) {}
  
  async analyzeError(errorText: string): Promise<void> {
    const parsed = this.parser.parse(errorText); // Call Kai's code
    if (!parsed) {
      this.ui.showError('Could not parse error');
      return;
    }
    
    this.ui.showProgress('Analyzing...');
    const result = await this.agent.analyze(parsed); // Call Kai's code
    this.ui.showResult(result); // Sokchea's code
  }
}
```

---

### 🚫 Common Pitfalls to Avoid

```typescript
// ❌ NEVER: Implement business logic (that's Kai's job!)
function parseKotlinError(errorText: string) {
  // DON'T DO THIS - use Kai's parser!
  const match = errorText.match(/at (.+):(\d+)/);
  return { filePath: match[1], line: parseInt(match[2]) };
}

// ✅ ALWAYS: Call Kai's functions
import { KotlinNPEParser } from './utils/KotlinNPEParser'; // Kai's code
function parseError(errorText: string) {
  const parser = new KotlinNPEParser(); // Kai's class
  return parser.parse(errorText); // Kai's method
}

// ❌ NEVER: Hardcode paths
const iconPath = 'C:\\Users\\Sokchea\\project\\icon.png';

// ✅ ALWAYS: Use context URIs
const iconPath = vscode.Uri.joinPath(
  context.extensionUri,
  'media',
  'icon.png'
);

// ❌ NEVER: Ignore disposal
let panel: vscode.WebviewPanel | undefined;
function showWebview() {
  panel = vscode.window.createWebviewPanel(...);
  // Panel lives forever!
}

// ✅ ALWAYS: Track and dispose
let currentPanel: vscode.WebviewPanel | undefined;
function showWebview() {
  if (currentPanel) {
    currentPanel.reveal();
    return;
  }
  currentPanel = vscode.window.createWebviewPanel(...);
  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });
}
```

---

### 📊 Debugging & Logging

```typescript
// ✅ BEST PRACTICE: Use output channel for debugging
const debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  debugChannel.appendLine(logMessage);
  if (data) {
    debugChannel.appendLine(JSON.stringify(data, null, 2));
  }
  
  // Also console.log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage, data);
  }
}

// Usage
log('info', 'Starting analysis', { errorType: 'NPE' });
log('error', 'Agent failed', { error: error.message, stack: error.stack });
```

---

### ✅ Quick Reference Checklist

**Before Each Commit:**
- [ ] All resources disposed properly
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] CSP set for webviews
- [ ] TypeScript strict mode enabled
- [ ] No `any` types used
- [ ] Tests written and passing
- [ ] Only calling Kai's functions (no business logic)
- [ ] Logging added for debugging
- [ ] Paths use context URIs (not hardcoded)

**DO's ✅**
- ✅ Dispose all resources
- ✅ Use async/await
- ✅ Validate user input
- ✅ Set strict CSP
- ✅ Use message passing for webviews
- ✅ Add ARIA labels
- ✅ Call Kai's functions
- ✅ Write tests
- ✅ Log errors

**DON'Ts ❌**
- ❌ Implement business logic
- ❌ Block extension host
- ❌ Hardcode paths
- ❌ Skip disposal
- ❌ Use `any` type
- ❌ Recreate HTML on updates
- ❌ Skip input validation
- ❌ Leave listeners un-disposed

---

## CHUNK 1: MVP UI (Weeks 1-2)

### CHUNK 1.1: Extension Bootstrap (Days 1-3, ~24h)

**Goal:** Get basic extension working with command registration

**Tasks:**
- [ ] Create VS Code extension project
  - [ ] Run `yo code` (VS Code Extension generator)
  - [ ] Configure TypeScript
  - [ ] Set up package.json
  
- [ ] `src/extension.ts` - Extension entry point
  - [ ] `activate()` function (register commands)
  - [ ] `deactivate()` function (cleanup)
  - [ ] Register `rcaAgent.analyzeError` command
  - [ ] Test command appears in command palette
  
- [ ] Test extension activation
  - [ ] F5 to debug
  - [ ] Command palette shows command
  - [ ] Command executes (empty handler for now)

**Implementation Example:**
```typescript
// src/extension.ts
import * as vscode from 'vscode';

// BEST PRACTICE: Initialize channels and state
let outputChannel: vscode.OutputChannel;
let debugChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  // Initialize output channels
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');
  context.subscriptions.push(outputChannel, debugChannel);
  
  log('info', 'RCA Agent extension activated');
  
  // Register analyze command with error handling
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      try {
        log('info', 'Analyze command triggered');
        vscode.window.showInformationMessage('RCA Agent: Analyzing error...');
        // Will wire to Kai's backend in later chunks
      } catch (error) {
        log('error', 'Command execution failed', error);
        vscode.window.showErrorMessage(`RCA Agent error: ${error.message}`);
      }
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}

export function deactivate() {
  log('info', 'RCA Agent extension deactivated');
  // Manual cleanup
  outputChannel?.dispose();
  debugChannel?.dispose();
}

// Logging helper (from best practices)
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  debugChannel.appendLine(logMessage);
  if (data) {
    debugChannel.appendLine(JSON.stringify(data, null, 2));
  }
}
```

**package.json Configuration:**
```json
{
  "name": "rca-agent",
  "displayName": "RCA Agent - Root Cause Analysis",
  "description": "AI-powered debugging assistant for Kotlin/Android",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Programming Languages", "Debuggers"],
  "activationEvents": ["onCommand:rcaAgent.analyzeError"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "rcaAgent.analyzeError",
        "title": "RCA Agent: Analyze Error"
      }
    ],
    "keybindings": [
      {
        "command": "rcaAgent.analyzeError",
        "key": "ctrl+shift+r",
        "mac": "cmd+shift+r",
        "when": "editorTextFocus"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Tests:**
- [ ] Extension activates in debug mode (F5)
- [ ] Command appears in command palette (Ctrl+Shift+P)
- [ ] Command executes and shows notification
- [ ] Keybinding works (Ctrl+Shift+R)
- [ ] Output channels created successfully
- [ ] Logging to debug channel works
- [ ] No console errors on activation
- [ ] Proper cleanup on deactivation

**Quality Checks:**
- [ ] All disposables registered with context
- [ ] Error handling implemented
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with zero warnings

---

### CHUNK 1.2: User Input Handling (Days 4-6, ~24h)

**Goal:** Get error text from user and pass to Kai's parser

**Tasks:**
- [ ] Get error text from selected text in editor
- [ ] Fallback to input box if no selection
- [ ] Display parsing errors to user
- [ ] Wire to Kai's `KotlinNPEParser.parse()` function

**Implementation Example:**
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { KotlinNPEParser } from './utils/KotlinNPEParser'; // Kai's parser

export function activate(context: vscode.ExtensionContext) {
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      try {
        // Step 1: Get error text from user
        const errorText = await getErrorText();
        if (!errorText) {
          vscode.window.showErrorMessage('No error text provided');
          return;
        }
        
        // BEST PRACTICE: Validate and sanitize input
        const sanitized = sanitizeErrorText(errorText);
        log('info', 'Received error text', { length: sanitized.length });
        
        // Step 2: Parse error using Kai's parser
        const parser = new KotlinNPEParser(); // Kai's class
        const parsedError = parser.parse(sanitized); // Kai's method
        
        if (!parsedError) {
          vscode.window.showErrorMessage(
            'Could not parse error. Is this a Kotlin error?',
            'View Debug Logs'
          ).then(selection => {
            if (selection === 'View Debug Logs') {
              debugChannel.show();
            }
          });
          return;
        }
        
        log('info', 'Error parsed successfully', parsedError);
        
        // Step 3: Display parsed details (for now, will wire to agent later)
        vscode.window.showInformationMessage(
          `Parsed error: ${parsedError.type} at ${parsedError.filePath}:${parsedError.line}`
        );
      } catch (error) {
        log('error', 'Analysis failed', error);
        vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
      }
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}

async function getErrorText(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  
  // Try to get selected text
  if (editor && !editor.selection.isEmpty) {
    return editor.document.getText(editor.selection);
  }
  
  // Fallback to input box with validation
  return await vscode.window.showInputBox({
    prompt: 'Paste your error message or stack trace',
    placeHolder: 'e.g., kotlin.UninitializedPropertyAccessException: lateinit property...',
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Error text cannot be empty';
      }
      if (value.length > 50000) {
        return 'Error text too large (max 50KB)';
      }
      return null; // Valid
    }
  });
}

// BEST PRACTICE: Input sanitization (from security section)
function sanitizeErrorText(input: string): string {
  if (input.length > 50000) {
    throw new Error('Error text too large (max 50KB)');
  }
  
  // Remove control characters
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}
```

**Tests:**
- [ ] Get text from editor selection
- [ ] Show input box if no selection
- [ ] Input validation works (empty text rejected)
- [ ] Input validation works (too large text rejected)
- [ ] Display parsed error details
- [ ] Show error if parsing fails
- [ ] Error messages include helpful actions
- [ ] Debug logs written correctly
- [ ] Input sanitization removes control characters

**Quality Checks:**
- [ ] Error handling comprehensive
- [ ] Input validation strict
- [ ] Type safety maintained
- [ ] User-friendly error messages

---

### CHUNK 1.3: Output Display (Days 7-9, ~24h)

**Goal:** Show Kai's agent results in output channel

**Tasks:**
- [ ] Create output channel for RCA results
- [ ] Wire to Kai's `MinimalReactAgent.analyze()` function
- [ ] Display agent's reasoning (thoughts)
- [ ] Display final root cause and fix guidelines
- [ ] Show progress notifications

**Implementation Example:**
```typescript
// src/extension.ts
import { MinimalReactAgent } from './agent/MinimalReactAgent'; // Kai's agent
import { OllamaClient } from './llm/OllamaClient'; // Kai's LLM client

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  // Create output channel
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  context.subscriptions.push(outputChannel);
  
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      // ... get error text and parse (from previous chunk) ...
      
      // Step 4: Analyze with Kai's agent
      await analyzeWithProgress(parsedError);
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}

// BEST PRACTICE: Use withProgress for better UX
async function analyzeWithProgress(parsedError: ParsedError) {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'RCA Agent',
    cancellable: false,
  }, async (progress) => {
    try {
      progress.report({ message: 'Initializing LLM...' });
      
      // Create Kai's components
      const llm = await OllamaClient.create({ model: 'granite-code:8b' }); // Kai's class
      
      progress.report({ message: 'Analyzing error...' });
      
      const agent = new MinimalReactAgent(llm); // Kai's agent
      const result = await agent.analyze(parsedError); // Kai's method
      
      progress.report({ message: 'Complete!', increment: 100 });
      
      // Display result in output channel
      showResult(result);
      
      vscode.window.showInformationMessage('Analysis complete!');
      
    } catch (error) {
      log('error', 'Analysis failed', error);
      
      // BEST PRACTICE: User-friendly error messages with actions
      if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
        vscode.window.showErrorMessage(
          'Could not connect to Ollama. Is it running?',
          'Start Ollama',
          'View Docs'
        ).then(selection => {
          if (selection === 'Start Ollama') {
            vscode.env.openExternal(vscode.Uri.parse('ollama://'));
          } else if (selection === 'View Docs') {
            vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
          }
        });
      } else {
        vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
      }
      
      outputChannel.appendLine(`❌ Error: ${error.message}`);
      outputChannel.show(true);
    }
  });
}

function showResult(result: RCAResult) {
  // Clear previous output
  outputChannel.clear();
  
  // Show result
  outputChannel.appendLine('=== ROOT CAUSE ANALYSIS ===\n');
  outputChannel.appendLine(`ERROR: ${result.error}\n`);
  outputChannel.appendLine(`ROOT CAUSE:\n${result.rootCause}\n`);
  outputChannel.appendLine(`FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  outputChannel.appendLine(`\nCONFIDENCE: ${(result.confidence * 100).toFixed(0)}%`);
  
  // Show output channel
  outputChannel.show(true);
}
```

**Tests:**
- [ ] Output channel created and displayed
- [ ] Agent result shown correctly
- [ ] Fix guidelines formatted nicely
- [ ] Error messages displayed on failure

---

### CHUNK 1.4: Code Context Display (Days 10-12, ~24h)

**Goal:** Show code snippets that agent read

**Tasks:**
- [ ] Display file reading status
- [ ] Show code snippet in output (optional)
- [ ] Format code with syntax highlighting (basic)
- [ ] Handle file reading errors gracefully

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  outputChannel.clear();
  
  outputChannel.appendLine('=== ROOT CAUSE ANALYSIS ===\n');
  outputChannel.appendLine(`ERROR: ${result.error}`);
  outputChannel.appendLine(`FILE: ${result.filePath}:${result.line}\n`);
  
  // Show code snippet if available (Kai provides this)
  if (result.codeSnippet) {
    outputChannel.appendLine('CODE CONTEXT:');
    outputChannel.appendLine('```kotlin');
    outputChannel.appendLine(result.codeSnippet);
    outputChannel.appendLine('```\n');
  }
  
  outputChannel.appendLine(`ROOT CAUSE:\n${result.rootCause}\n`);
  outputChannel.appendLine(`FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  
  outputChannel.show(true);
}
```

**Tests:**
- [ ] Code snippet displayed correctly
- [ ] Syntax highlighting (basic markdown)
- [ ] Handles missing code snippets
- [ ] File path displayed as clickable link (if supported)

---

### CHUNK 1.5: MVP Polish (Days 13-14, ~16h)

**Goal:** Improve output formatting and error handling

**Tasks:**
- [ ] Better output formatting
  - [ ] Use markdown-style formatting
  - [ ] Add emoji for visual appeal
  - [ ] Color-code sections (if possible)
  
- [ ] Add copy-to-clipboard button (optional)
- [ ] Improve error messages
  - [ ] User-friendly error text
  - [ ] Suggest fixes for common issues (Ollama not running, etc.)
  
- [ ] Test extension installation
  - [ ] Package as `.vsix`
  - [ ] Install in fresh VS Code
  - [ ] Test activation

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  outputChannel.clear();
  
  // Use emoji and formatting
  outputChannel.appendLine('🔍 === ROOT CAUSE ANALYSIS ===\n');
  outputChannel.appendLine(`🐛 ERROR: ${result.error}`);
  outputChannel.appendLine(`📁 FILE: ${result.filePath}:${result.line}\n`);
  
  if (result.codeSnippet) {
    outputChannel.appendLine('📝 CODE CONTEXT:');
    outputChannel.appendLine(result.codeSnippet);
    outputChannel.appendLine('');
  }
  
  outputChannel.appendLine(`💡 ROOT CAUSE:\n${result.rootCause}\n`);
  outputChannel.appendLine(`🛠️  FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  
  outputChannel.appendLine(`\n✅ CONFIDENCE: ${(result.confidence * 100).toFixed(0)}%`);
  
  // Add helpful footer
  outputChannel.appendLine('\n---');
  outputChannel.appendLine('Was this helpful? Run "RCA Agent: Give Feedback" to help improve results.');
  
  outputChannel.show(true);
}

// Better error handling
function handleError(error: any) {
  if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
    vscode.window.showErrorMessage(
      'Could not connect to Ollama. Is Ollama running? Start it with: ollama serve',
      'Open Ollama Docs'
    ).then(selection => {
      if (selection === 'Open Ollama Docs') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
      }
    });
  } else {
    vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
  }
  
  outputChannel.appendLine(`❌ Error: ${error.message}`);
  outputChannel.show(true);
}
```

**Tests:**
- [ ] Output looks good (emoji, formatting)
- [ ] Error messages are helpful
- [ ] Extension packages successfully
- [ ] Installs and works in fresh VS Code

---

## CHUNK 2: Core UI Enhancements (Week 3)

### CHUNK 2.1: Error Type Badges (Days 1-3, ~24h)

**Goal:** Visual indicators for different error types

**Tasks:**
- [ ] Display error type badge in output
- [ ] Color-code different error types
  - [ ] Red for NPE
  - [ ] Orange for lateinit
  - [ ] Yellow for build errors
  - [ ] Blue for type errors
  
- [ ] Wire to Kai's expanded `ErrorParser` (5+ error types)
- [ ] Update output formatting with badges

**Implementation Example:**
```typescript
function getErrorBadge(errorType: string): string {
  const badges: Record<string, string> = {
    'npe': '🔴 NullPointerException',
    'lateinit': '🟠 Lateinit Error',
    'gradle_build': '🟡 Build Error',
    'unresolved_reference': '🔵 Unresolved Reference',
    'type_mismatch': '🟣 Type Mismatch',
  };
  return badges[errorType] || '⚪ Unknown Error';
}

function showResult(result: RCAResult) {
  outputChannel.clear();
  
  // Show error badge
  const badge = getErrorBadge(result.errorType);
  outputChannel.appendLine(`${badge}\n`);
  outputChannel.appendLine(`ERROR: ${result.error}`);
  
  // ... rest of output ...
}
```

**Tests:**
- [ ] Badges display correctly for 5+ error types
- [ ] Colors are visually distinct
- [ ] Unknown errors have fallback badge

---

### CHUNK 2.2: Tool Execution Feedback (Days 4-5, ~16h)

**Goal:** Show what tools agent is using

**Tasks:**
- [ ] Display tool execution status
  - [ ] "Reading file..."
  - [ ] "Finding callers..."
  - [ ] "Searching documentation..."
  
- [ ] Show tool results (optional)
- [ ] Format LSP results for readability
- [ ] Wire to Kai's `ToolRegistry` and `LSPTool`

**Implementation Example:**
```typescript
// Subscribe to Kai's agent events (if available)
function analyzeWithProgress(agent: MinimalReactAgent, error: ParsedError) {
  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'RCA Agent',
    cancellable: false,
  }, async (progress) => {
    progress.report({ message: 'Parsing error...' });
    
    // If Kai's agent emits events, listen to them
    if (agent.on) {
      agent.on('tool_execution', (tool: string) => {
        progress.report({ message: `Executing tool: ${tool}...` });
      });
    }
    
    const result = await agent.analyze(error);
    progress.report({ message: 'Complete!' });
    
    return result;
  });
}
```

**Tests:**
- [ ] Progress notifications show tool execution
- [ ] Tool results formatted nicely
- [ ] LSP results (callers) displayed in output

---

### CHUNK 2.3: Accuracy Metrics Display (Days 6-7, ~16h)

**Goal:** Show confidence scores and test results

**Tasks:**
- [ ] Display confidence score prominently
- [ ] Add confidence bar (visual)
- [ ] Show accuracy metrics (optional)
- [ ] Wire to Kai's accuracy measurements

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing output ...
  
  // Confidence bar
  const confidence = result.confidence;
  const barLength = 20;
  const filledLength = Math.round(confidence * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  outputChannel.appendLine(`\n✅ CONFIDENCE: ${(confidence * 100).toFixed(0)}%`);
  outputChannel.appendLine(`   ${bar}`);
  
  // Confidence interpretation
  if (confidence >= 0.8) {
    outputChannel.appendLine('   High confidence - likely accurate');
  } else if (confidence >= 0.6) {
    outputChannel.appendLine('   Medium confidence - verify suggestion');
  } else {
    outputChannel.appendLine('   Low confidence - use as starting point');
  }
}
```

**Tests:**
- [ ] Confidence score displayed correctly
- [ ] Visual bar renders properly
- [ ] Interpretation text matches confidence level

---

## CHUNK 3: Database UI (Weeks 4-5)

### CHUNK 3.1: Storage Notifications (Days 1-3, ~24h)

**Goal:** Show when RCAs are stored in database

**Tasks:**
- [ ] Display "Storing result..." notification
- [ ] Show storage success/failure
- [ ] Wire to Kai's `ChromaDBClient.addRCA()`
- [ ] Handle storage errors gracefully

**Implementation Example:**
```typescript
async function analyzeAndStore(agent, error) {
  // Analyze
  const result = await agent.analyze(error);
  
  // Display result
  showResult(result);
  
  // Store in database
  try {
    vscode.window.showInformationMessage('Storing result in database...');
    
    const db = await ChromaDBClient.create(); // Kai's class
    const rcaId = await db.addRCA({
      error_message: result.error,
      error_type: result.errorType,
      language: 'kotlin',
      root_cause: result.rootCause,
      fix_guidelines: result.fixGuidelines,
      confidence: result.confidence,
      user_validated: false,
      quality_score: result.confidence,
    });
    
    vscode.window.showInformationMessage('Result saved! ID: ' + rcaId.substring(0, 8));
  } catch (error) {
    vscode.window.showWarningMessage('Could not store result: ' + error.message);
  }
}
```

**Tests:**
- [ ] Storage notification displayed
- [ ] Success message shown on save
- [ ] Error handled if ChromaDB unavailable

---

### CHUNK 3.2: Similar Solutions Display (Days 4-6, ~24h)

**Goal:** Show past similar solutions to user

**Tasks:**
- [ ] Display "Searching past solutions..." status
- [ ] Show similar errors found (if any)
- [ ] Format similarity scores
- [ ] Wire to Kai's `ChromaDBClient.searchSimilar()`

**Implementation Example:**
```typescript
async function analyzeWithSimilaritySearch(agent, db, error) {
  // Search for similar past solutions
  vscode.window.showInformationMessage('Searching for similar past errors...');
  
  const similarRCAs = await db.searchSimilar(error.message, 3); // Kai's method
  
  if (similarRCAs.length > 0) {
    outputChannel.appendLine('📚 SIMILAR PAST SOLUTIONS:\n');
    similarRCAs.forEach((rca, index) => {
      outputChannel.appendLine(`${index + 1}. ${rca.error_message}`);
      outputChannel.appendLine(`   Root Cause: ${rca.root_cause}`);
      outputChannel.appendLine(`   Confidence: ${(rca.confidence * 100).toFixed(0)}%\n`);
    });
    outputChannel.appendLine('---\n');
  }
  
  // Continue with new analysis
  const result = await agent.analyze(error);
  showResult(result);
}
```

**Tests:**
- [ ] Similar solutions displayed before new analysis
- [ ] Formatted nicely with separators
- [ ] Handles case with no similar solutions

---

### CHUNK 3.3: Cache Hit Notifications (Days 7-9, ~24h)

**Goal:** Show when result comes from cache

**Tasks:**
- [ ] Display "Cache hit!" notification
- [ ] Show cached result instantly
- [ ] Indicate result is from cache (not new analysis)
- [ ] Wire to Kai's `RCACache.get()`

**Implementation Example:**
```typescript
async function analyzeWithCache(agent, cache, db, error) {
  // Check cache first
  const errorHash = new ErrorHasher().hash(error); // Kai's class
  const cached = cache.get(errorHash); // Kai's method
  
  if (cached) {
    vscode.window.showInformationMessage('✅ Found in cache! (instant result)');
    outputChannel.appendLine('⚡ CACHED RESULT (analyzed previously)\n');
    showResult(cached);
    return;
  }
  
  // Not in cache, run full analysis
  vscode.window.showInformationMessage('No cache hit, analyzing...');
  const result = await agent.analyze(error);
  
  // Store in cache
  cache.set(errorHash, result); // Kai's method
  
  showResult(result);
}
```

**Tests:**
- [ ] Cache hit notification shown
- [ ] Cached result displayed instantly (<5s)
- [ ] Indicator shows it's cached
- [ ] New analysis runs if cache miss

---

### CHUNK 3.4: Feedback Buttons (Days 10-12, ~24h)

**Goal:** "Helpful/Not Helpful" buttons for user feedback

**Tasks:**
- [ ] Add "👍 Helpful" button to output
- [ ] Add "👎 Not Helpful" button to output
- [ ] Wire buttons to Kai's `FeedbackHandler`
- [ ] Show thank you message on feedback
- [ ] Optional comment box for detailed feedback

**Implementation Example:**
```typescript
function showResultWithFeedback(result: RCAResult, rcaId: string, errorHash: string) {
  showResult(result);
  
  // Add feedback section
  outputChannel.appendLine('\n---');
  outputChannel.appendLine('Was this helpful?');
  
  // Show feedback buttons
  vscode.window.showInformationMessage(
    'Was this RCA helpful?',
    '👍 Yes',
    '👎 No'
  ).then(async selection => {
    const feedbackHandler = new FeedbackHandler(db, cache); // Kai's class
    
    if (selection === '👍 Yes') {
      await feedbackHandler.handlePositive(rcaId, errorHash); // Kai's method
      vscode.window.showInformationMessage('Thank you! This will improve future analyses.');
    } else if (selection === '👎 No') {
      await feedbackHandler.handleNegative(rcaId, errorHash); // Kai's method
      vscode.window.showInformationMessage('Feedback noted. We\'ll try to improve.');
      
      // Optional: Ask for details
      const comment = await vscode.window.showInputBox({
        prompt: 'What was wrong with the analysis? (optional)',
        placeHolder: 'e.g., Incorrect root cause, missing context...',
      });
      
      if (comment) {
        outputChannel.appendLine(`User feedback: ${comment}`);
      }
    }
  });
}
```

**Tests:**
- [ ] Feedback buttons appear
- [ ] Thumbs up calls Kai's positive handler
- [ ] Thumbs down calls Kai's negative handler
- [ ] Thank you message displayed
- [ ] Optional comment box works

---

## CHUNK 4: Android UI (Weeks 6-8)

### CHUNK 4.1: Compose Error Badge (Days 1-4, ~32h)

**Goal:** Visual indicators for Compose errors

**Tasks:**
- [ ] Compose error badge (🎨 icon)
- [ ] Display Compose-specific hints
- [ ] Format remember/recomposition errors nicely
- [ ] Wire to Kai's `JetpackComposeParser`

**Implementation Example:**
```typescript
function getErrorBadge(errorType: string): string {
  const badges: Record<string, string> = {
    // ... existing badges ...
    'compose_remember': '🎨 Compose - Remember Error',
    'compose_recomposition': '🎨 Compose - Recomposition Issue',
    'compose_launched_effect': '🎨 Compose - LaunchedEffect Error',
  };
  return badges[errorType] || '⚪ Unknown Error';
}

function showResult(result: RCAResult) {
  // ... existing code ...
  
  // Add Compose-specific hints
  if (result.errorType.startsWith('compose_')) {
    outputChannel.appendLine('\n💡 COMPOSE TIP:');
    
    if (result.errorType === 'compose_remember') {
      outputChannel.appendLine('   Use remember { mutableStateOf() } for state in composables');
    } else if (result.errorType === 'compose_recomposition') {
      outputChannel.appendLine('   Check for unstable parameters causing excessive recomposition');
    }
  }
}
```

**Tests:**
- [ ] Compose badges display correctly
- [ ] Compose tips shown for Compose errors
- [ ] Works with Kai's Compose parser

---

### CHUNK 4.2: XML Error Display (Days 5-7, ~24h)

**Goal:** Show XML layout errors clearly

**Tasks:**
- [ ] XML error badge
- [ ] Display XML code snippets
- [ ] Show line numbers in XML files
- [ ] Format XML attribute suggestions
- [ ] Wire to Kai's `XMLParser`

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing code ...
  
  // XML-specific formatting
  if (result.language === 'xml') {
    outputChannel.appendLine('\n📄 XML LAYOUT:');
    outputChannel.appendLine(`   File: ${result.filePath}`);
    outputChannel.appendLine(`   Line: ${result.line}`);
    
    if (result.codeSnippet) {
      outputChannel.appendLine('\n```xml');
      outputChannel.appendLine(result.codeSnippet);
      outputChannel.appendLine('```');
    }
    
    // XML attribute suggestions
    if (result.suggestedAttributes) {
      outputChannel.appendLine('\n✏️  SUGGESTED ATTRIBUTES:');
      result.suggestedAttributes.forEach(attr => {
        outputChannel.appendLine(`   ${attr}`);
      });
    }
  }
}
```

**Tests:**
- [ ] XML badge displayed
- [ ] XML code snippet formatted
- [ ] Attribute suggestions shown
- [ ] Works with Kai's XML parser

---

### CHUNK 4.3: Gradle Conflict Visualization (Days 8-11, ~32h)

**Goal:** Show Gradle dependency conflicts clearly

**Tasks:**
- [ ] Gradle error badge
- [ ] Display dependency conflicts visually
- [ ] Format version recommendations
- [ ] Show Kai's build fix suggestions
- [ ] Wire to Kai's `AndroidBuildTool`

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing code ...
  
  // Gradle-specific formatting
  if (result.errorType.includes('gradle')) {
    outputChannel.appendLine('\n📦 GRADLE BUILD:');
    
    if (result.metadata?.module && result.metadata?.conflictingVersions) {
      const { module, conflictingVersions } = result.metadata;
      
      outputChannel.appendLine(`   Module: ${module}`);
      outputChannel.appendLine(`   Conflicting Versions:`);
      conflictingVersions.forEach((version: string) => {
        outputChannel.appendLine(`     - ${version}`);
      });
      
      if (result.recommendedFix) {
        outputChannel.appendLine('\n🔧 RECOMMENDED FIX:');
        outputChannel.appendLine(result.recommendedFix);
      }
    }
  }
}
```

**Tests:**
- [ ] Gradle badge displayed
- [ ] Conflict visualization clear
- [ ] Version recommendations shown
- [ ] Works with Kai's Android build tool

---

### CHUNK 4.4: Manifest & Docs Display (Days 12-15, ~32h)

**Goal:** Show manifest errors and Android documentation

**Tasks:**
- [ ] Manifest error badge
- [ ] Display Kai's manifest analysis
- [ ] Show Kai's docs search results
- [ ] Format permission suggestions
- [ ] Link to relevant documentation

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing code ...
  
  // Manifest-specific formatting
  if (result.errorType.includes('manifest')) {
    outputChannel.appendLine('\n📋 ANDROID MANIFEST:');
    
    if (result.metadata?.requiredPermission) {
      outputChannel.appendLine(`   Missing Permission: ${result.metadata.requiredPermission}`);
      outputChannel.appendLine('\n✏️  ADD TO AndroidManifest.xml:');
      outputChannel.appendLine(`   <uses-permission android:name="${result.metadata.requiredPermission}" />`);
    }
  }
  
  // Documentation results
  if (result.docResults && result.docResults.length > 0) {
    outputChannel.appendLine('\n📚 RELEVANT DOCUMENTATION:');
    result.docResults.forEach((doc, index) => {
      outputChannel.appendLine(`   ${index + 1}. ${doc.title}`);
      outputChannel.appendLine(`      ${doc.summary}`);
      if (doc.url) {
        outputChannel.appendLine(`      Link: ${doc.url}`);
      }
      outputChannel.appendLine('');
    });
  }
}
```

**Tests:**
- [ ] Manifest badge displayed
- [ ] Permission suggestions formatted correctly
- [ ] Docs search results shown
- [ ] Links work (if provided)

---

### CHUNK 4.5: Android Testing (Days 16-18, ~24h)

**Goal:** Test all Android UI components

**Tasks:**
- [ ] Test all Android error badges
- [ ] Test all Android-specific formatting
- [ ] Test with real Android errors
- [ ] Polish Android UI elements
- [ ] Document Android-specific features

**Tests:**
- [ ] All Android badges work
- [ ] Compose/XML/Gradle/Manifest errors display correctly
- [ ] User can understand Android-specific output
- [ ] No visual bugs or formatting issues

---

## CHUNK 5: Webview UI (Weeks 9-12)

### CHUNK 5.1: Webview Panel (Days 1-5, ~40h)

**Goal:** Replace output channel with interactive webview

**Tasks:**
- [ ] Create webview panel (`RCAWebview.ts`)
- [ ] Design HTML/CSS layout
  - [ ] Header with status
  - [ ] Progress bar
  - [ ] Iteration display
  - [ ] Result sections
  
- [ ] Message passing (extension ↔ webview)
- [ ] Wire to Kai's `AgentStateStream`
- [ ] Display Kai's synthesized reports

**Implementation Example:**
```typescript
// src/ui/RCAWebview.ts
import * as vscode from 'vscode';

export class RCAWebview {
  private panel: vscode.WebviewPanel;
  
  static create(context: vscode.ExtensionContext): RCAWebview {
    const panel = vscode.window.createWebviewPanel(
      'rcaAgent',
      'RCA Agent - Analysis',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    
    const instance = new RCAWebview(panel, context);
    instance.setHtmlContent();
    return instance;
  }
  
  private constructor(panel: vscode.WebviewPanel, private context: vscode.ExtensionContext) {
    this.panel = panel;
  }
  
  updateProgress(iteration: number, maxIterations: number, thought: string) {
    this.panel.webview.postMessage({
      type: 'progress',
      iteration,
      maxIterations,
      thought,
      progress: (iteration / maxIterations) * 100,
    });
  }
  
  showFinalResult(rca: RCADocument) {
    this.panel.webview.postMessage({
      type: 'result',
      rca,
    });
  }
  
  private setHtmlContent() {
    this.panel.webview.html = this.getHtmlContent();
  }
  
  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RCA Agent</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: var(--vscode-input-background);
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background-color: var(--vscode-button-background);
      transition: width 0.3s ease;
    }
    .iteration-info {
      margin: 20px 0;
      padding: 10px;
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-button-background);
    }
    .thought {
      color: var(--vscode-editor-foreground);
      font-style: italic;
    }
    .result-section {
      margin: 20px 0;
    }
    .result-section h2 {
      color: var(--vscode-textLink-foreground);
    }
    .fix-guideline {
      padding: 5px 0;
      border-left: 2px solid var(--vscode-button-background);
      padding-left: 10px;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Root Cause Analysis</h1>
    <p id="status">Initializing...</p>
  </div>
  
  <div id="progress-container" style="display: none;">
    <p id="iteration-text">Iteration 0/0</p>
    <div class="progress-bar">
      <div id="progress-fill" class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>
  
  <div id="iteration-display"></div>
  <div id="result-display"></div>
  
  <script>
    const vscode = acquireVsCodeApi();
    
    window.addEventListener('message', event => {
      const message = event.data;
      
      if (message.type === 'progress') {
        document.getElementById('progress-container').style.display = 'block';
        document.getElementById('status').textContent = 'Analyzing...';
        document.getElementById('iteration-text').textContent = 
          \`Iteration \${message.iteration}/\${message.maxIterations}\`;
        document.getElementById('progress-fill').style.width = \`\${message.progress}%\`;
        
        // Add iteration info
        const iterDiv = document.createElement('div');
        iterDiv.className = 'iteration-info';
        iterDiv.innerHTML = \`
          <strong>Iteration \${message.iteration}</strong><br>
          <span class="thought">\${message.thought}</span>
        \`;
        document.getElementById('iteration-display').appendChild(iterDiv);
      }
      
      if (message.type === 'result') {
        document.getElementById('status').textContent = 'Complete!';
        document.getElementById('progress-fill').style.width = '100%';
        
        const rca = message.rca;
        const resultHtml = \`
          <div class="result-section">
            <h2>🐛 Error</h2>
            <p>\${rca.error}</p>
          </div>
          
          <div class="result-section">
            <h2>💡 Root Cause</h2>
            <p>\${rca.rootCause}</p>
          </div>
          
          <div class="result-section">
            <h2>🛠️ Fix Guidelines</h2>
            \${rca.fixGuidelines.map(guideline => 
              \`<div class="fix-guideline">\${guideline}</div>\`
            ).join('')}
          </div>
          
          <div class="result-section">
            <p>✅ Confidence: \${(rca.confidence * 100).toFixed(0)}%</p>
          </div>
        \`;
        
        document.getElementById('result-display').innerHTML = resultHtml;
      }
    });
  </script>
</body>
</html>`;
  }
}
```

**Usage in extension.ts:**
```typescript
async function analyzeWithWebview(error: ParsedError) {
  const webview = RCAWebview.create(context);
  
  const llm = await OllamaClient.create({ model: 'granite-code:8b' });
  const agent = new ReactAgent(llm); // Kai's agent
  
  // Subscribe to Kai's stream
  const stream = agent.getStream(); // Kai's method
  
  stream.on('iteration', (data) => {
    webview.updateProgress(data.iteration, data.maxIterations, data.thought);
  });
  
  stream.on('complete', (data) => {
    webview.showFinalResult(data.rca);
  });
  
  // Start analysis
  await agent.analyze(error);
}
```

**Tests:**
- [ ] Webview panel creates successfully
- [ ] Progress bar animates
- [ ] Iterations display in real-time
- [ ] Final result renders correctly
- [ ] Webview styling matches VS Code theme

---

### CHUNK 5.2: Educational Mode UI (Days 6-10, ~40h)

**Goal:** Display educational content in webview

**Tasks:**
- [ ] Educational mode toggle
- [ ] "🎓 Learning Note" sections
- [ ] Display Kai's educational content
- [ ] Format tips and examples
- [ ] "Why This Error Happened" section
- [ ] Wire to Kai's `EducationalAgent`

**Implementation Example:**
```typescript
// Add to webview HTML
function showEducationalResult(rca: RCADocument) {
  const educationalHtml = `
    <div class="result-section">
      <h2>🎓 Learning Notes</h2>
      ${rca.learningNotes.map(note => `
        <div class="learning-note">
          ${note}
        </div>
      `).join('')}
    </div>
  `;
  
  document.getElementById('result-display').innerHTML += educationalHtml;
}

// Add CSS for learning notes
.learning-note {
  background-color: var(--vscode-textBlockQuote-background);
  padding: 15px;
  margin: 10px 0;
  border-left: 4px solid var(--vscode-textLink-foreground);
  border-radius: 4px;
}

.learning-note h3 {
  margin-top: 0;
  color: var(--vscode-textLink-foreground);
}
```

**Tests:**
- [ ] Educational mode toggle works
- [ ] Learning notes display correctly
- [ ] Formatting is beginner-friendly
- [ ] Tips and examples render nicely

---

### CHUNK 5.3: Performance Display (Days 11-14, ~32h)

**Goal:** Optional performance metrics display

**Tasks:**
- [ ] Performance metrics section (optional)
- [ ] Show latency breakdown
- [ ] Display cache hit rate
- [ ] Token usage stats (if available)
- [ ] Wire to Kai's `PerformanceTracker`

**Implementation Example:**
```typescript
// Optional: Show performance metrics
function showPerformanceMetrics(metrics: PerformanceMetrics) {
  const metricsHtml = `
    <div class="result-section" style="opacity: 0.7; font-size: 0.9em;">
      <h3>⚡ Performance Metrics</h3>
      <ul>
        <li>Total Time: ${metrics.totalTime}ms</li>
        <li>LLM Inference: ${metrics.llmTime}ms</li>
        <li>Tool Execution: ${metrics.toolTime}ms</li>
        <li>Cache Hit Rate: ${metrics.cacheHitRate}%</li>
      </ul>
    </div>
  `;
  
  document.getElementById('result-display').innerHTML += metricsHtml;
}
```

**Tests:**
- [ ] Metrics display correctly
- [ ] Styling is subtle (not distracting)
- [ ] Can be toggled on/off (optional)

---

### CHUNK 5.4: UI Polish (Days 15-19, ~40h)

**Goal:** Final UI improvements and testing

**Tasks:**
- [ ] Loading states optimization
  - [ ] Skeleton loaders
  - [ ] Smooth transitions
  
- [ ] Error states
  - [ ] Friendly error messages in webview
  - [ ] Retry buttons
  
- [ ] Accessibility improvements
  - [ ] ARIA labels
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  
- [ ] UI responsiveness
  - [ ] Handle window resizing
  - [ ] Mobile-friendly (if applicable)
  
- [ ] Test all UI components
  - [ ] Different error types
  - [ ] Different screen sizes
  - [ ] Different VS Code themes

**Tests:**
- [ ] All loading states work
- [ ] Error states are clear
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Responsive layout

---

### CHUNK 5.5: Documentation & Packaging (Days 20-24, ~40h)

**Goal:** User documentation and extension packaging

**Tasks:**
- [ ] User guide (`README.md`)
  - [ ] Installation instructions
  - [ ] Usage guide with screenshots
  - [ ] Troubleshooting section
  - [ ] FAQ
  
- [ ] Educational mode guide (`EDUCATIONAL_MODE.md`)
  - [ ] What is educational mode
  - [ ] How to enable
  - [ ] Best practices
  
- [ ] Screenshots and demo video
  - [ ] Extension in action
  - [ ] Webview UI
  - [ ] Educational mode
  
- [ ] Extension packaging
  - [ ] Create `.vsix` file
  - [ ] Test installation on clean VS Code
  - [ ] Prepare for marketplace (optional)

**README.md Structure:**
```markdown
# RCA Agent - Root Cause Analysis for Kotlin/Android

AI-powered debugging assistant that analyzes your errors and suggests fixes.

## Features
- 🔍 Automatic error analysis
- 💡 Root cause identification
- 🛠️ Fix guidelines
- 🎓 Educational mode for learning
- 📚 Learns from your errors

## Installation
1. Download `rca-agent-0.1.0.vsix`
2. Open VS Code
3. Run: Extensions > Install from VSIX
4. Reload VS Code

## Prerequisites
- [Ollama](https://ollama.ai) installed and running
- Model installed: `ollama pull granite-code:8b`
- ChromaDB (optional for learning): `docker run -p 8000:8000 chromadb/chroma`

## Usage
1. Select your error message or stack trace
2. Press `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)
3. Or: Command Palette > "RCA Agent: Analyze Error"
4. View analysis in webview panel

## Troubleshooting
### "Could not connect to Ollama"
- Make sure Ollama is running: `ollama serve`
- Check if model is installed: `ollama list`

### "Analysis timed out"
- Increase timeout in settings
- Check if model is compatible (7B-8B recommended)

## Educational Mode
Enable educational mode for beginner-friendly explanations.
See [EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md) for details.

## Feedback
Click "👍 Helpful" or "👎 Not Helpful" to improve future analyses.

## License
MIT
```

**Packaging Commands:**
```bash
# Install vsce (VS Code Extension CLI)
npm install -g vsce

# Package extension
vsce package

# Output: rca-agent-0.1.0.vsix

# Test installation
code --install-extension rca-agent-0.1.0.vsix
```

**Tests:**
- [ ] README is clear and comprehensive
- [ ] Screenshots are high-quality
- [ ] Demo video shows key features
- [ ] Extension packages successfully
- [ ] Installs on clean VS Code
- [ ] All features work after installation

---

## Collaboration with Kai

### Integration Points

**Sokchea calls Kai's functions:**
1. `KotlinNPEParser.parse(errorText)` → Get ParsedError
2. `ReactAgent.analyze(error)` → Get RCADocument
3. `ReactAgent.getStream()` → Subscribe to progress events
4. `ChromaDBClient.addRCA(rca)` → Store result
5. `ChromaDBClient.searchSimilar(query)` → Get similar RCAs
6. `RCACache.get(hash)` → Check cache
7. `FeedbackHandler.handlePositive(id)` → Process feedback

### Communication

**Daily Sync:**
- Ask Kai: "What functions are ready?"
- Share: "What UI components need data?"
- Coordinate: Function signatures and data formats

**Integration Days (end of week):**
- Kai demos backend functionality
- Sokchea demos UI wireframes
- Together: Wire UI to backend
- Fix interface mismatches

### Testing Together

**Sokchea tests:**
- UI displays correctly
- Button clicks work
- Error messages shown
- Webview renders properly

**Kai tests:**
- Backend functions work
- Data formats correct
- API contracts honored

**Together test:**
- End-to-end workflow (user action → backend → UI display)
- Edge cases (errors, timeouts, missing data)
- Performance (fast enough for good UX)

---

## Success Metrics

### Phase 1 Complete When:
- ✅ Extension activates and registers commands
- ✅ Can parse errors and display results
- ✅ Webview UI works smoothly
- ✅ Educational mode displays learning notes
- ✅ Feedback buttons functional
- ✅ All Android error types display correctly
- ✅ Extension packaged as `.vsix`
- ✅ Documentation complete
- ✅ Installs and works on fresh VS Code
- ✅ You actually use it during development

### Code Quality Metrics:
- ✅ Zero ESLint warnings
- ✅ TypeScript strict mode enabled
- ✅ 80%+ test coverage
- ✅ All tests passing
- ✅ No memory leaks (all disposables cleaned)
- ✅ No hardcoded paths
- ✅ Proper error handling throughout
- ✅ Input validation on all user inputs
- ✅ CSP set for all webviews
- ✅ ARIA labels for accessibility

---

## 📚 Implementation Strategy Summary

### Week-by-Week Focus

**Weeks 1-2: MVP Core**
- Focus: Get basic extension working
- Priority: Command registration, parsing, output display
- Goal: User can analyze error and see result
- Quality: Basic error handling, logging

**Week 3: Core Enhancements**
- Focus: Better UX and error handling
- Priority: Progress indicators, error badges, tool feedback
- Goal: Professional-looking UI
- Quality: Comprehensive error handling

**Weeks 4-5: Database Integration**
- Focus: Learning from past errors
- Priority: ChromaDB connection, caching, feedback
- Goal: System gets smarter over time
- Quality: Proper state management

**Weeks 6-8: Android-Specific UI**
- Focus: Android error handling
- Priority: Compose, XML, Gradle UI components
- Goal: Full Android support
- Quality: Domain-specific UX

**Weeks 9-12: Webview & Polish**
- Focus: Interactive UI and documentation
- Priority: Real-time updates, educational mode, packaging
- Goal: Production-ready extension
- Quality: Accessibility, performance, documentation

### Daily Workflow

```typescript
// EVERY CODING SESSION:
// 1. Read best practices section
// 2. Check "DO's and DON'Ts"
// 3. Implement feature
// 4. Write tests
// 5. Check quality checklist
// 6. Commit with descriptive message

// BEFORE COMMITTING:
✓ All disposables registered
✓ Error handling added
✓ Input validation present
✓ Tests written and passing
✓ ESLint clean
✓ TypeScript compiles
✓ No `any` types
✓ Only calling Kai's functions
✓ Logged important events
```

### Integration Points with Kai

**What Sokchea Calls:**
```typescript
// Parsers
parser.parse(errorText) → ParsedError
parser.canHandle(errorText) → boolean

// Agent
agent.analyze(error) → Promise<RCADocument>
agent.getStream() → EventEmitter<AgentEvent>

// Database
db.addRCA(rca) → Promise<string>
db.searchSimilar(query) → Promise<RCADocument[]>

// Cache
cache.get(hash) → RCADocument | null
cache.set(hash, rca) → void

// Feedback
feedback.handlePositive(id) → Promise<void>
feedback.handleNegative(id) → Promise<void>

// Tools (for display purposes)
tool.execute(params) → Promise<ToolResult>
```

**What Sokchea NEVER Does:**
- ❌ Implement parsing logic
- ❌ Implement agent reasoning
- ❌ Implement database operations
- ❌ Implement tool execution
- ❌ Implement any algorithms
- ❌ Duplicate Kai's code

### Communication Protocol

**Daily Sync (5-10 minutes):**
- Ask Kai: "What functions are ready today?"
- Share: "What UI components need data?"
- Coordinate: Function signatures match?

**Integration Days (end of week):**
- Kai demos backend functionality
- Sokchea demos UI wireframes
- Together: Wire UI to backend
- Test: End-to-end workflow
- Fix: Interface mismatches

**When Blocked:**
1. Check if Kai's function is ready
2. Use mock/stub if not ready yet
3. Document expected interface
4. Continue with other tasks
5. Integrate when ready

---

## 🎓 Learning Resources

### VS Code Extension Development
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

### TypeScript Best Practices
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Accessibility
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Sinon.JS (Mocking)](https://sinonjs.org/)

---

## Notes

- Focus on UI/UX and integration
- Never implement business logic (Kai's job)
- Call Kai's functions, don't rewrite them
- Make UI intuitive and visually appealing
- Test on different VS Code themes
- Document everything for users
- Ask Kai for clarification on interfaces

**This is Sokchea's complete work breakdown. Kai handles all backend separately.**
=======
# 🎨 PHASE 1 OPTION B: SOKCHEA'S WORK (UI & Integration)

> **Role:** UI Developer & Integration Specialist - Connects Kai's backend to VS Code extension
> **Responsibility:** No business logic - focus purely on UI/UX and wiring

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Best Practices & Critical Rules](#-best-practices--critical-rules)
3. [Development Chunks](#chunk-1-mvp-ui-weeks-1-2)
4. [Collaboration with Kai](#collaboration-with-kai)
5. [Success Metrics](#success-metrics)

---

## Overview

**What Sokchea Does:**
- ✅ VS Code extension structure and activation
- ✅ Command registration and user interaction
- ✅ Display Kai's results in UI (output channels, webviews)
- ✅ Wire UI events to Kai's backend functions
- ✅ Create webview panels with HTML/CSS
- ✅ User-facing documentation
- ✅ Extension packaging and deployment

**What Sokchea Does NOT Do:**
- ❌ Business logic or algorithms
- ❌ Parser implementation
- ❌ Agent reasoning
- ❌ Database operations
- ❌ Tool execution logic

**Key Principle:** Sokchea CALLS Kai's functions, never implements them.

---

## 🎯 Best Practices & Critical Rules

### 🚨 CRITICAL: Extension Development Rules

#### 1. Resource Management (Memory Leaks Prevention)
```typescript
// ✅ ALWAYS: Dispose resources properly
export function activate(context: vscode.ExtensionContext) {
  const disposables: vscode.Disposable[] = [];
  
  // All registrations must be disposed
  disposables.push(
    vscode.commands.registerCommand('cmd', handler),
    vscode.window.onDidChangeActiveTextEditor(onEditorChange),
    vscode.workspace.onDidCloseTextDocument(onDocClose)
  );
  
  // Add to context for automatic cleanup
  disposables.forEach(d => context.subscriptions.push(d));
}

export function deactivate() {
  // Manual cleanup if needed
  outputChannel?.dispose();
  webviewPanel?.dispose();
}

// ❌ NEVER: Leave event listeners without disposal
class BadWebview {
  constructor() {
    this.panel.webview.onDidReceiveMessage((msg) => {
      // Memory leak - handler never disposed!
    });
  }
}
```

#### 2. Async/Await - Never Block Extension Host
```typescript
// ❌ NEVER: Synchronous blocking operations
function badAnalyze() {
  const result = agent.analyzeSync(error); // Freezes VS Code!
  showResult(result);
}

// ✅ ALWAYS: Use async/await with progress indicators
async function goodAnalyze() {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Analyzing error...',
    cancellable: false
  }, async (progress) => {
    const result = await agent.analyze(error); // Non-blocking
    progress.report({ increment: 100 });
    showResult(result);
  });
}
```

#### 3. Error Handling - User-Friendly Messages
```typescript
// ✅ ALWAYS: Comprehensive error handling with actions
async function analyzeWithErrorHandling() {
  try {
    const result = await agent.analyze(error);
    return result;
  } catch (error) {
    // Specific error handling
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
      vscode.window.showErrorMessage(
        'Could not connect to Ollama. Is it running?',
        'Start Ollama',
        'View Docs'
      ).then(selection => {
        if (selection === 'Start Ollama') {
          vscode.env.openExternal(vscode.Uri.parse('ollama://'));
        } else if (selection === 'View Docs') {
          vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
        }
      });
    } else {
      vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
    }
    
    // Log to debug channel
    debugChannel.appendLine(`Error: ${error.stack}`);
  }
}
```

---

### 🔒 Security Best Practices

#### Content Security Policy for Webviews
```typescript
// ✅ CRITICAL: Always set strict CSP for webviews
function getHtmlContent(webview: vscode.Webview, context: vscode.ExtensionContext): string {
  const nonce = getNonce(); // Generate nonce for inline scripts
  
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'media', 'webview.js')
  );
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src 'nonce-${nonce}';
    img-src ${webview.cspSource} https: data:;
  ">
</head>
<body>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

#### Input Validation & Sanitization
```typescript
// ✅ ALWAYS: Validate and sanitize all user input
function sanitizeErrorText(input: string): string {
  // 1. Length validation
  if (input.length > 50000) {
    throw new Error('Error text too large (max 50KB)');
  }
  
  // 2. Remove XSS attempts
  const sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // 3. Remove control characters
  return sanitized.replace(/[\x00-\x1F\x7F]/g, '');
}
```

---

### ⚡ Performance Optimization

#### Lazy Loading
```typescript
// ✅ BEST PRACTICE: Lazy load heavy dependencies
export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('rcaAgent.analyzeError', async () => {
      // Import only when needed
      const { MinimalReactAgent } = await import('./agent/MinimalReactAgent');
      const { OllamaClient } = await import('./llm/OllamaClient');
      
      const llm = await OllamaClient.create({ model: 'granite-code:8b' });
      const agent = new MinimalReactAgent(llm);
    })
  );
}
```

#### Debouncing & Throttling
```typescript
// ✅ BEST PRACTICE: Debounce expensive operations
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage: Don't spam the backend
const debouncedSearch = debounce(async (query: string) => {
  const results = await db.searchSimilar(query, 5);
  updateUI(results);
}, 500);
```

#### Efficient Webview Updates
```typescript
// ❌ BAD: Recreating entire HTML on each update
function badUpdate(result: RCAResult) {
  webview.html = getFullHtml(result); // Re-renders everything!
}

// ✅ GOOD: Use message passing for incremental updates
function goodUpdate(result: RCAResult) {
  webview.postMessage({
    type: 'updateResult',
    data: result
  });
}
```

---

### ♿ Accessibility Guidelines

```html
<!-- ✅ ALWAYS: Include ARIA labels and roles -->
<div role="main" aria-label="Root Cause Analysis Results">
  <div role="region" aria-labelledby="error-heading">
    <h2 id="error-heading">Error Details</h2>
    <p aria-describedby="error-description">
      <span id="error-description">{{ errorMessage }}</span>
    </p>
  </div>
  
  <div role="region" aria-live="polite" aria-atomic="true">
    <!-- Dynamic content announcements -->
    {{ rootCause }}
  </div>
</div>
```

---

### 🧪 Testing Strategies

#### Unit Testing Pattern
```typescript
// tests/unit/extension.test.ts
import * as assert from 'assert';
import { sanitizeErrorText } from '../../extension';

suite('Extension Unit Tests', () => {
  test('sanitizeErrorText removes HTML', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeErrorText(input);
    assert.strictEqual(output, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
  
  test('sanitizeErrorText enforces length limit', () => {
    const input = 'a'.repeat(60000);
    assert.throws(() => sanitizeErrorText(input));
  });
});
```

#### Integration Testing with Mocks
```typescript
// tests/integration/agent-integration.test.ts
import * as sinon from 'sinon';
import { MinimalReactAgent } from '../../agent/MinimalReactAgent';

suite('Agent Integration Tests', () => {
  let analyzeStub: sinon.SinonStub;
  
  setup(() => {
    analyzeStub = sinon.stub(MinimalReactAgent.prototype, 'analyze');
    analyzeStub.resolves({
      error: 'NullPointerException',
      rootCause: 'Variable not initialized',
      confidence: 0.95
    });
  });
  
  teardown(() => {
    analyzeStub.restore();
  });
  
  test('UI displays mocked result', async () => {
    await vscode.commands.executeCommand('rcaAgent.analyzeError');
    assert.ok(analyzeStub.calledOnce);
  });
});
```

---

### 📝 TypeScript Best Practices

```typescript
// ✅ ALWAYS: Use strict type checking
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// ✅ ALWAYS: Define interfaces for all data
interface RCAResult {
  error: string;
  errorType: string;
  rootCause: string;
  fixGuidelines: string[];
  confidence: number;
  codeSnippet?: string;
  metadata?: Record<string, unknown>;
}

// ✅ ALWAYS: Use type guards
function isRCAResult(obj: unknown): obj is RCAResult {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  
  return (
    typeof r.error === 'string' &&
    typeof r.rootCause === 'string' &&
    Array.isArray(r.fixGuidelines) &&
    typeof r.confidence === 'number'
  );
}

// ❌ NEVER: Use 'any' type
function bad(data: any) { } // Loses type safety!

// ✅ ALWAYS: Use proper types or generics
function good<T>(data: T): T { return data; }
```

---

### 🤝 Integration with Kai's Backend

#### Interface Contracts
```typescript
// ✅ CRITICAL: Define clear contracts with Kai
// contracts/agent.contract.ts

export interface ParsedError {
  type: string;
  message: string;
  filePath: string;
  line: number;
  language: 'kotlin' | 'java' | 'xml';
}

export interface IErrorParser {
  parse(errorText: string): ParsedError | null;
}

export interface IReactAgent {
  analyze(error: ParsedError): Promise<RCADocument>;
}
```

#### Dependency Injection
```typescript
// ✅ BEST PRACTICE: Use DI for testability
class RCAExtension {
  constructor(
    private parser: IErrorParser,  // Kai's implementation
    private agent: IReactAgent,    // Kai's implementation
    private ui: IUserInterface     // Sokchea's implementation
  ) {}
  
  async analyzeError(errorText: string): Promise<void> {
    const parsed = this.parser.parse(errorText); // Call Kai's code
    if (!parsed) {
      this.ui.showError('Could not parse error');
      return;
    }
    
    this.ui.showProgress('Analyzing...');
    const result = await this.agent.analyze(parsed); // Call Kai's code
    this.ui.showResult(result); // Sokchea's code
  }
}
```

---

### 🚫 Common Pitfalls to Avoid

```typescript
// ❌ NEVER: Implement business logic (that's Kai's job!)
function parseKotlinError(errorText: string) {
  // DON'T DO THIS - use Kai's parser!
  const match = errorText.match(/at (.+):(\d+)/);
  return { filePath: match[1], line: parseInt(match[2]) };
}

// ✅ ALWAYS: Call Kai's functions
import { KotlinNPEParser } from './utils/KotlinNPEParser'; // Kai's code
function parseError(errorText: string) {
  const parser = new KotlinNPEParser(); // Kai's class
  return parser.parse(errorText); // Kai's method
}

// ❌ NEVER: Hardcode paths
const iconPath = 'C:\\Users\\Sokchea\\project\\icon.png';

// ✅ ALWAYS: Use context URIs
const iconPath = vscode.Uri.joinPath(
  context.extensionUri,
  'media',
  'icon.png'
);

// ❌ NEVER: Ignore disposal
let panel: vscode.WebviewPanel | undefined;
function showWebview() {
  panel = vscode.window.createWebviewPanel(...);
  // Panel lives forever!
}

// ✅ ALWAYS: Track and dispose
let currentPanel: vscode.WebviewPanel | undefined;
function showWebview() {
  if (currentPanel) {
    currentPanel.reveal();
    return;
  }
  currentPanel = vscode.window.createWebviewPanel(...);
  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });
}
```

---

### 📊 Debugging & Logging

```typescript
// ✅ BEST PRACTICE: Use output channel for debugging
const debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  debugChannel.appendLine(logMessage);
  if (data) {
    debugChannel.appendLine(JSON.stringify(data, null, 2));
  }
  
  // Also console.log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage, data);
  }
}

// Usage
log('info', 'Starting analysis', { errorType: 'NPE' });
log('error', 'Agent failed', { error: error.message, stack: error.stack });
```

---

### ✅ Quick Reference Checklist

**Before Each Commit:**
- [ ] All resources disposed properly
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] CSP set for webviews
- [ ] TypeScript strict mode enabled
- [ ] No `any` types used
- [ ] Tests written and passing
- [ ] Only calling Kai's functions (no business logic)
- [ ] Logging added for debugging
- [ ] Paths use context URIs (not hardcoded)

**DO's ✅**
- ✅ Dispose all resources
- ✅ Use async/await
- ✅ Validate user input
- ✅ Set strict CSP
- ✅ Use message passing for webviews
- ✅ Add ARIA labels
- ✅ Call Kai's functions
- ✅ Write tests
- ✅ Log errors

**DON'Ts ❌**
- ❌ Implement business logic
- ❌ Block extension host
- ❌ Hardcode paths
- ❌ Skip disposal
- ❌ Use `any` type
- ❌ Recreate HTML on updates
- ❌ Skip input validation
- ❌ Leave listeners un-disposed

---

## 🔧 Prerequisites & Environment Setup (Day 0 - Sokchea's Setup)

> **Your Role:** Set up VS Code extension development environment and UI tools.

---

### 📦 Required Manual Installations

**Priority 1: Core Development Tools**

1. **Node.js 18+ LTS**
   - Download: https://nodejs.org/
   - Choose LTS (Long Term Support) version
   - Verify: `node --version` (should show v18+)
   - **Why:** Required for TypeScript and VS Code extension API

2. **Visual Studio Code**
   - Download: https://code.visualstudio.com/
   - Install all recommended extensions when prompted
   - Verify: `code --version`
   - **Why:** Your primary development IDE

3. **Git for Windows**
   - Download: https://git-scm.com/download/win
   - During install: Choose "Git from command line and 3rd-party software"
   - Verify: `git --version`
   - **Why:** Version control and collaboration with Kai

**Priority 2: Optional but Recommended**

4. **Windows Terminal** (Optional)
   - Microsoft Store: Search "Windows Terminal"
   - **Why:** Better terminal experience, multiple tabs

5. **Postman** (Optional, for Chunk 3+)
   - Download: https://www.postman.com/downloads/
   - **Why:** Test APIs (Ollama, ChromaDB) during integration

---

### ⌨️ Terminal-Based Setup

**Step 1: Verify Node.js Installation**
```bash
# Open PowerShell or Command Prompt
node --version
# Expected: v18.x.x or higher ✅

npm --version
# Expected: v9.x.x or higher ✅
```

**Step 2: Install Global NPM Tools (VS Code Extension Development)**
```bash
# Yeoman - Project scaffolding tool
npm install -g yo

# VS Code Extension Generator
npm install -g generator-code

# TypeScript Compiler
npm install -g typescript

# ESLint - Code quality checker
npm install -g eslint

# Prettier - Code formatter (optional)
npm install -g prettier

# Verify installations
yo --version
# Expected: 4.x.x ✅

generator-code --version
# Expected: Should not error ✅

tsc --version
# Expected: 5.x.x ✅

eslint --version
# Expected: 8.x.x ✅
```

**Step 3: Configure npm (Optional but Recommended)**
```bash
# Set npm to use faster registry (optional)
npm config set registry https://registry.npmjs.org/

# Check npm config
npm config list
```

**Step 4: Install VS Code Extensions (via Terminal)**
```bash
# ESLint Extension
code --install-extension dbaeumer.vscode-eslint

# Prettier Extension
code --install-extension esbenp.prettier-vscode

# TypeScript Extension Pack
code --install-extension ms-vscode.vscode-typescript-next

# GitLens (Better Git integration)
code --install-extension eamodio.gitlens

# Jest Test Explorer (for running tests)
code --install-extension kavod-io.vscode-jest-test-adapter

# Error Lens (Show errors inline)
code --install-extension usernamehw.errorlens

# List installed extensions
code --list-extensions
```

---

### ✅ Sokchea's Validation Checklist

**Run these commands to verify your setup:**

```bash
# 1. Node.js check
node --version
# ✅ Should show v18+ or v20+

# 2. npm check
npm --version
# ✅ Should show v9+ or v10+

# 3. TypeScript check
tsc --version
# ✅ Should show version 5.x

# 4. Yeoman check
yo --version
# ✅ Should show version

# 5. VS Code check
code --version
# ✅ Should show VS Code version

# 6. Git check
git --version
# ✅ Should show git version

# 7. ESLint check
eslint --version
# ✅ Should show version
```

**All checks passed?** ✅ You're ready for Day 1!

---

### 🧪 Test VS Code Extension Generator

**Quick test to ensure everything works:**

```bash
# Create a test directory
mkdir test-extension
cd test-extension

# Run extension generator
yo code

# Follow prompts:
# ? What type of extension? → New Extension (TypeScript)
# ? What's the name? → test-extension
# ? What's the identifier? → test-extension
# ? What's the description? → Test
# ? Initialize git? → Yes
# ? Bundle? → No
# ? Package manager? → npm

# Wait for npm install to complete...

# Open in VS Code
code .

# Press F5 to run extension in debug mode
# A new VS Code window should open with "[Extension Development Host]" in title
# ✅ Success!

# Cleanup
cd ..
rmdir /s test-extension
```

---

### 🚨 Common Issues & Solutions (Sokchea-Specific)

**Issue 1: `yo: command not found` after installation**
```bash
# Solution: npm global packages not in PATH
npm config get prefix
# Note the path shown

# Add to PATH:
# Windows: Search "Environment Variables"
# → Edit "Path" variable
# → Add: C:\Users\YourName\AppData\Roaming\npm
# → Restart terminal
```

**Issue 2: VS Code extensions won't install**
```bash
# Solution: Install manually via VS Code UI
# 1. Open VS Code
# 2. Click Extensions icon (Ctrl+Shift+X)
# 3. Search for extension name
# 4. Click Install
```

**Issue 3: `code` command not recognized**
```bash
# Solution: Add VS Code to PATH
# 1. Open VS Code
# 2. Press Ctrl+Shift+P
# 3. Type: "Shell Command: Install 'code' command in PATH"
# 4. Restart terminal
```

**Issue 4: npm install very slow**
```bash
# Solution: Clear npm cache
npm cache clean --force

# Or use faster registry
npm config set registry https://registry.npmjs.org/
```

**Issue 5: TypeScript errors in VS Code**
```bash
# Solution: Reload VS Code TypeScript server
# Press Ctrl+Shift+P
# Type: "TypeScript: Restart TS Server"
```

---

### ⏱️ Sokchea's Setup Time Estimate

| Task | Time | Priority |
|------|------|----------|
| Download & install software | 30-60min | 🔥 Critical |
| Terminal setup (npm packages) | 15-30min | 🔥 Critical |
| VS Code extensions | 10-15min | 🔥 Critical |
| Test extension generator | 10-15min | 🔥 Critical |
| Optional tools (Postman, etc.) | 15-30min | 🟡 Optional |
| **Total** | **1.5-2.5h** | **Do before Day 1** |

---

### 📚 Recommended Reading (Before Day 1)

**Essential (1-2 hours):**
- VS Code Extension API: https://code.visualstudio.com/api
  - Read: "Get Started" section
  - Read: "Extension Anatomy"
  - Skim: "Common Capabilities"

**Optional (if time permits):**
- VS Code Webview API: https://code.visualstudio.com/api/extension-guides/webview
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

---

### 🤝 Coordination with Kai

**Before Day 1, sync with Kai to ensure:**
- [ ] Kai has Ollama running (`ollama serve`)
- [ ] Kai can test granite-code:8b model
- [ ] Both have Git configured (username, email)
- [ ] Both can create a test project with `yo code`
- [ ] Decide on project name and Git repository location

**Quick sync command to verify both setups:**
```bash
# Sokchea runs:
yo --version && code --version && tsc --version

# Kai should also run (his checks):
ollama list && node --version
```

---

### ✅ Ready for Day 1?

**Checklist before starting Chunk 1.1:**
- [x] Node.js 18+ installed and verified
- [x] VS Code installed with extensions
- [x] Yeoman and generator-code installed
- [x] TypeScript and ESLint installed globally
- [x] Can run `yo code` successfully
- [x] Tested extension generator (created test extension)
- [x] Git installed and configured
- [x] VS Code `code` command works in terminal
- [x] Synced with Kai on setup status

**All checked?** ✅ Start Day 1 - Extension Bootstrap!

---

## CHUNK 1: MVP UI (Weeks 1-2)

### CHUNK 1.1: Extension Bootstrap (Days 1-3, ~24h)

**Goal:** Get basic extension working with command registration

**Tasks:**
- [ ] Create VS Code extension project
  - [ ] Run `yo code` (VS Code Extension generator)
  - [ ] Configure TypeScript
  - [ ] Set up package.json
  
- [ ] `src/extension.ts` - Extension entry point
  - [ ] `activate()` function (register commands)
  - [ ] `deactivate()` function (cleanup)
  - [ ] Register `rcaAgent.analyzeError` command
  - [ ] Test command appears in command palette
  
- [ ] Test extension activation
  - [ ] F5 to debug
  - [ ] Command palette shows command
  - [ ] Command executes (empty handler for now)

**Implementation Example:**
```typescript
// src/extension.ts
import * as vscode from 'vscode';

// BEST PRACTICE: Initialize channels and state
let outputChannel: vscode.OutputChannel;
let debugChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  // Initialize output channels
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');
  context.subscriptions.push(outputChannel, debugChannel);
  
  log('info', 'RCA Agent extension activated');
  
  // Register analyze command with error handling
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      try {
        log('info', 'Analyze command triggered');
        vscode.window.showInformationMessage('RCA Agent: Analyzing error...');
        // Will wire to Kai's backend in later chunks
      } catch (error) {
        log('error', 'Command execution failed', error);
        vscode.window.showErrorMessage(`RCA Agent error: ${error.message}`);
      }
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}

export function deactivate() {
  log('info', 'RCA Agent extension deactivated');
  // Manual cleanup
  outputChannel?.dispose();
  debugChannel?.dispose();
}

// Logging helper (from best practices)
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  debugChannel.appendLine(logMessage);
  if (data) {
    debugChannel.appendLine(JSON.stringify(data, null, 2));
  }
}
```

**package.json Configuration:**
```json
{
  "name": "rca-agent",
  "displayName": "RCA Agent - Root Cause Analysis",
  "description": "AI-powered debugging assistant for Kotlin/Android",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Programming Languages", "Debuggers"],
  "activationEvents": ["onCommand:rcaAgent.analyzeError"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "rcaAgent.analyzeError",
        "title": "RCA Agent: Analyze Error"
      }
    ],
    "keybindings": [
      {
        "command": "rcaAgent.analyzeError",
        "key": "ctrl+shift+r",
        "mac": "cmd+shift+r",
        "when": "editorTextFocus"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Tests:**
- [ ] Extension activates in debug mode (F5)
- [ ] Command appears in command palette (Ctrl+Shift+P)
- [ ] Command executes and shows notification
- [ ] Keybinding works (Ctrl+Shift+R)
- [ ] Output channels created successfully
- [ ] Logging to debug channel works
- [ ] No console errors on activation
- [ ] Proper cleanup on deactivation

**Quality Checks:**
- [ ] All disposables registered with context
- [ ] Error handling implemented
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with zero warnings

---

### CHUNK 1.2: User Input Handling (Days 4-6, ~24h)

**Goal:** Get error text from user and pass to Kai's parser

**Tasks:**
- [ ] Get error text from selected text in editor
- [ ] Fallback to input box if no selection
- [ ] Display parsing errors to user
- [ ] Wire to Kai's `KotlinNPEParser.parse()` function

**Implementation Example:**
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { KotlinNPEParser } from './utils/KotlinNPEParser'; // Kai's parser

export function activate(context: vscode.ExtensionContext) {
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      try {
        // Step 1: Get error text from user
        const errorText = await getErrorText();
        if (!errorText) {
          vscode.window.showErrorMessage('No error text provided');
          return;
        }
        
        // BEST PRACTICE: Validate and sanitize input
        const sanitized = sanitizeErrorText(errorText);
        log('info', 'Received error text', { length: sanitized.length });
        
        // Step 2: Parse error using Kai's parser
        const parser = new KotlinNPEParser(); // Kai's class
        const parsedError = parser.parse(sanitized); // Kai's method
        
        if (!parsedError) {
          vscode.window.showErrorMessage(
            'Could not parse error. Is this a Kotlin error?',
            'View Debug Logs'
          ).then(selection => {
            if (selection === 'View Debug Logs') {
              debugChannel.show();
            }
          });
          return;
        }
        
        log('info', 'Error parsed successfully', parsedError);
        
        // Step 3: Display parsed details (for now, will wire to agent later)
        vscode.window.showInformationMessage(
          `Parsed error: ${parsedError.type} at ${parsedError.filePath}:${parsedError.line}`
        );
      } catch (error) {
        log('error', 'Analysis failed', error);
        vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
      }
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}

async function getErrorText(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  
  // Try to get selected text
  if (editor && !editor.selection.isEmpty) {
    return editor.document.getText(editor.selection);
  }
  
  // Fallback to input box with validation
  return await vscode.window.showInputBox({
    prompt: 'Paste your error message or stack trace',
    placeHolder: 'e.g., kotlin.UninitializedPropertyAccessException: lateinit property...',
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Error text cannot be empty';
      }
      if (value.length > 50000) {
        return 'Error text too large (max 50KB)';
      }
      return null; // Valid
    }
  });
}

// BEST PRACTICE: Input sanitization (from security section)
function sanitizeErrorText(input: string): string {
  if (input.length > 50000) {
    throw new Error('Error text too large (max 50KB)');
  }
  
  // Remove control characters
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}
```

**Tests:**
- [ ] Get text from editor selection
- [ ] Show input box if no selection
- [ ] Input validation works (empty text rejected)
- [ ] Input validation works (too large text rejected)
- [ ] Display parsed error details
- [ ] Show error if parsing fails
- [ ] Error messages include helpful actions
- [ ] Debug logs written correctly
- [ ] Input sanitization removes control characters

**Quality Checks:**
- [ ] Error handling comprehensive
- [ ] Input validation strict
- [ ] Type safety maintained
- [ ] User-friendly error messages

---

### CHUNK 1.3: Output Display (Days 7-9, ~24h)

**Goal:** Show Kai's agent results in output channel

**Tasks:**
- [ ] Create output channel for RCA results
- [ ] Wire to Kai's `MinimalReactAgent.analyze()` function
- [ ] Display agent's reasoning (thoughts)
- [ ] Display final root cause and fix guidelines
- [ ] Show progress notifications

**Implementation Example:**
```typescript
// src/extension.ts
import { MinimalReactAgent } from './agent/MinimalReactAgent'; // Kai's agent
import { OllamaClient } from './llm/OllamaClient'; // Kai's LLM client

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  // Create output channel
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  context.subscriptions.push(outputChannel);
  
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      // ... get error text and parse (from previous chunk) ...
      
      // Step 4: Analyze with Kai's agent
      await analyzeWithProgress(parsedError);
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}

// BEST PRACTICE: Use withProgress for better UX
async function analyzeWithProgress(parsedError: ParsedError) {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'RCA Agent',
    cancellable: false,
  }, async (progress) => {
    try {
      progress.report({ message: 'Initializing LLM...' });
      
      // Create Kai's components
      const llm = await OllamaClient.create({ model: 'granite-code:8b' }); // Kai's class
      
      progress.report({ message: 'Analyzing error...' });
      
      const agent = new MinimalReactAgent(llm); // Kai's agent
      const result = await agent.analyze(parsedError); // Kai's method
      
      progress.report({ message: 'Complete!', increment: 100 });
      
      // Display result in output channel
      showResult(result);
      
      vscode.window.showInformationMessage('Analysis complete!');
      
    } catch (error) {
      log('error', 'Analysis failed', error);
      
      // BEST PRACTICE: User-friendly error messages with actions
      if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
        vscode.window.showErrorMessage(
          'Could not connect to Ollama. Is it running?',
          'Start Ollama',
          'View Docs'
        ).then(selection => {
          if (selection === 'Start Ollama') {
            vscode.env.openExternal(vscode.Uri.parse('ollama://'));
          } else if (selection === 'View Docs') {
            vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
          }
        });
      } else {
        vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
      }
      
      outputChannel.appendLine(`❌ Error: ${error.message}`);
      outputChannel.show(true);
    }
  });
}

function showResult(result: RCAResult) {
  // Clear previous output
  outputChannel.clear();
  
  // Show result
  outputChannel.appendLine('=== ROOT CAUSE ANALYSIS ===\n');
  outputChannel.appendLine(`ERROR: ${result.error}\n`);
  outputChannel.appendLine(`ROOT CAUSE:\n${result.rootCause}\n`);
  outputChannel.appendLine(`FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  outputChannel.appendLine(`\nCONFIDENCE: ${(result.confidence * 100).toFixed(0)}%`);
  
  // Show output channel
  outputChannel.show(true);
}
```

**Tests:**
- [ ] Output channel created and displayed
- [ ] Agent result shown correctly
- [ ] Fix guidelines formatted nicely
- [ ] Error messages displayed on failure

---

### CHUNK 1.4: Code Context Display (Days 10-12, ~24h)

**Goal:** Show code snippets that agent read

**Tasks:**
- [ ] Display file reading status
- [ ] Show code snippet in output (optional)
- [ ] Format code with syntax highlighting (basic)
- [ ] Handle file reading errors gracefully

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  outputChannel.clear();
  
  outputChannel.appendLine('=== ROOT CAUSE ANALYSIS ===\n');
  outputChannel.appendLine(`ERROR: ${result.error}`);
  outputChannel.appendLine(`FILE: ${result.filePath}:${result.line}\n`);
  
  // Show code snippet if available (Kai provides this)
  if (result.codeSnippet) {
    outputChannel.appendLine('CODE CONTEXT:');
    outputChannel.appendLine('```kotlin');
    outputChannel.appendLine(result.codeSnippet);
    outputChannel.appendLine('```\n');
  }
  
  outputChannel.appendLine(`ROOT CAUSE:\n${result.rootCause}\n`);
  outputChannel.appendLine(`FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  
  outputChannel.show(true);
}
```

**Tests:**
- [ ] Code snippet displayed correctly
- [ ] Syntax highlighting (basic markdown)
- [ ] Handles missing code snippets
- [ ] File path displayed as clickable link (if supported)

---

### CHUNK 1.5: MVP Polish (Days 13-14, ~16h)

**Goal:** Improve output formatting and error handling

**Tasks:**
- [ ] Better output formatting
  - [ ] Use markdown-style formatting
  - [ ] Add emoji for visual appeal
  - [ ] Color-code sections (if possible)
  
- [ ] Add copy-to-clipboard button (optional)
- [ ] Improve error messages
  - [ ] User-friendly error text
  - [ ] Suggest fixes for common issues (Ollama not running, etc.)
  
- [ ] Test extension installation
  - [ ] Package as `.vsix`
  - [ ] Install in fresh VS Code
  - [ ] Test activation

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  outputChannel.clear();
  
  // Use emoji and formatting
  outputChannel.appendLine('🔍 === ROOT CAUSE ANALYSIS ===\n');
  outputChannel.appendLine(`🐛 ERROR: ${result.error}`);
  outputChannel.appendLine(`📁 FILE: ${result.filePath}:${result.line}\n`);
  
  if (result.codeSnippet) {
    outputChannel.appendLine('📝 CODE CONTEXT:');
    outputChannel.appendLine(result.codeSnippet);
    outputChannel.appendLine('');
  }
  
  outputChannel.appendLine(`💡 ROOT CAUSE:\n${result.rootCause}\n`);
  outputChannel.appendLine(`🛠️  FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  
  outputChannel.appendLine(`\n✅ CONFIDENCE: ${(result.confidence * 100).toFixed(0)}%`);
  
  // Add helpful footer
  outputChannel.appendLine('\n---');
  outputChannel.appendLine('Was this helpful? Run "RCA Agent: Give Feedback" to help improve results.');
  
  outputChannel.show(true);
}

// Better error handling
function handleError(error: any) {
  if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
    vscode.window.showErrorMessage(
      'Could not connect to Ollama. Is Ollama running? Start it with: ollama serve',
      'Open Ollama Docs'
    ).then(selection => {
      if (selection === 'Open Ollama Docs') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
      }
    });
  } else {
    vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
  }
  
  outputChannel.appendLine(`❌ Error: ${error.message}`);
  outputChannel.show(true);
}
```

**Tests:**
- [ ] Output looks good (emoji, formatting)
- [ ] Error messages are helpful
- [ ] Extension packages successfully
- [ ] Installs and works in fresh VS Code

---

## CHUNK 2: Core UI Enhancements (Week 3)

### CHUNK 2.1: Error Type Badges (Days 1-3, ~24h)

**Goal:** Visual indicators for different error types

**Tasks:**
- [ ] Display error type badge in output
- [ ] Color-code different error types
  - [ ] Red for NPE
  - [ ] Orange for lateinit
  - [ ] Yellow for build errors
  - [ ] Blue for type errors
  
- [ ] Wire to Kai's expanded `ErrorParser` (5+ error types)
- [ ] Update output formatting with badges

**Implementation Example:**
```typescript
function getErrorBadge(errorType: string): string {
  const badges: Record<string, string> = {
    'npe': '🔴 NullPointerException',
    'lateinit': '🟠 Lateinit Error',
    'gradle_build': '🟡 Build Error',
    'unresolved_reference': '🔵 Unresolved Reference',
    'type_mismatch': '🟣 Type Mismatch',
  };
  return badges[errorType] || '⚪ Unknown Error';
}

function showResult(result: RCAResult) {
  outputChannel.clear();
  
  // Show error badge
  const badge = getErrorBadge(result.errorType);
  outputChannel.appendLine(`${badge}\n`);
  outputChannel.appendLine(`ERROR: ${result.error}`);
  
  // ... rest of output ...
}
```

**Tests:**
- [ ] Badges display correctly for 5+ error types
- [ ] Colors are visually distinct
- [ ] Unknown errors have fallback badge

---

### CHUNK 2.2: Tool Execution Feedback (Days 4-5, ~16h)

**Goal:** Show what tools agent is using

**Tasks:**
- [ ] Display tool execution status
  - [ ] "Reading file..."
  - [ ] "Finding callers..."
  - [ ] "Searching documentation..."
  
- [ ] Show tool results (optional)
- [ ] Format LSP results for readability
- [ ] Wire to Kai's `ToolRegistry` and `LSPTool`

**Implementation Example:**
```typescript
// Subscribe to Kai's agent events (if available)
function analyzeWithProgress(agent: MinimalReactAgent, error: ParsedError) {
  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'RCA Agent',
    cancellable: false,
  }, async (progress) => {
    progress.report({ message: 'Parsing error...' });
    
    // If Kai's agent emits events, listen to them
    if (agent.on) {
      agent.on('tool_execution', (tool: string) => {
        progress.report({ message: `Executing tool: ${tool}...` });
      });
    }
    
    const result = await agent.analyze(error);
    progress.report({ message: 'Complete!' });
    
    return result;
  });
}
```

**Tests:**
- [ ] Progress notifications show tool execution
- [ ] Tool results formatted nicely
- [ ] LSP results (callers) displayed in output

---

### CHUNK 2.3: Accuracy Metrics Display (Days 6-7, ~16h)

**Goal:** Show confidence scores and test results

**Tasks:**
- [ ] Display confidence score prominently
- [ ] Add confidence bar (visual)
- [ ] Show accuracy metrics (optional)
- [ ] Wire to Kai's accuracy measurements

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing output ...
  
  // Confidence bar
  const confidence = result.confidence;
  const barLength = 20;
  const filledLength = Math.round(confidence * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  outputChannel.appendLine(`\n✅ CONFIDENCE: ${(confidence * 100).toFixed(0)}%`);
  outputChannel.appendLine(`   ${bar}`);
  
  // Confidence interpretation
  if (confidence >= 0.8) {
    outputChannel.appendLine('   High confidence - likely accurate');
  } else if (confidence >= 0.6) {
    outputChannel.appendLine('   Medium confidence - verify suggestion');
  } else {
    outputChannel.appendLine('   Low confidence - use as starting point');
  }
}
```

**Tests:**
- [ ] Confidence score displayed correctly
- [ ] Visual bar renders properly
- [ ] Interpretation text matches confidence level

---

## CHUNK 3: Database UI (Weeks 4-5)

### CHUNK 3.1: Storage Notifications (Days 1-3, ~24h)

**Goal:** Show when RCAs are stored in database

**Tasks:**
- [ ] Display "Storing result..." notification
- [ ] Show storage success/failure
- [ ] Wire to Kai's `ChromaDBClient.addRCA()`
- [ ] Handle storage errors gracefully

**Implementation Example:**
```typescript
async function analyzeAndStore(agent, error) {
  // Analyze
  const result = await agent.analyze(error);
  
  // Display result
  showResult(result);
  
  // Store in database
  try {
    vscode.window.showInformationMessage('Storing result in database...');
    
    const db = await ChromaDBClient.create(); // Kai's class
    const rcaId = await db.addRCA({
      error_message: result.error,
      error_type: result.errorType,
      language: 'kotlin',
      root_cause: result.rootCause,
      fix_guidelines: result.fixGuidelines,
      confidence: result.confidence,
      user_validated: false,
      quality_score: result.confidence,
    });
    
    vscode.window.showInformationMessage('Result saved! ID: ' + rcaId.substring(0, 8));
  } catch (error) {
    vscode.window.showWarningMessage('Could not store result: ' + error.message);
  }
}
```

**Tests:**
- [ ] Storage notification displayed
- [ ] Success message shown on save
- [ ] Error handled if ChromaDB unavailable

---

### CHUNK 3.2: Similar Solutions Display (Days 4-6, ~24h)

**Goal:** Show past similar solutions to user

**Tasks:**
- [ ] Display "Searching past solutions..." status
- [ ] Show similar errors found (if any)
- [ ] Format similarity scores
- [ ] Wire to Kai's `ChromaDBClient.searchSimilar()`

**Implementation Example:**
```typescript
async function analyzeWithSimilaritySearch(agent, db, error) {
  // Search for similar past solutions
  vscode.window.showInformationMessage('Searching for similar past errors...');
  
  const similarRCAs = await db.searchSimilar(error.message, 3); // Kai's method
  
  if (similarRCAs.length > 0) {
    outputChannel.appendLine('📚 SIMILAR PAST SOLUTIONS:\n');
    similarRCAs.forEach((rca, index) => {
      outputChannel.appendLine(`${index + 1}. ${rca.error_message}`);
      outputChannel.appendLine(`   Root Cause: ${rca.root_cause}`);
      outputChannel.appendLine(`   Confidence: ${(rca.confidence * 100).toFixed(0)}%\n`);
    });
    outputChannel.appendLine('---\n');
  }
  
  // Continue with new analysis
  const result = await agent.analyze(error);
  showResult(result);
}
```

**Tests:**
- [ ] Similar solutions displayed before new analysis
- [ ] Formatted nicely with separators
- [ ] Handles case with no similar solutions

---

### CHUNK 3.3: Cache Hit Notifications (Days 7-9, ~24h)

**Goal:** Show when result comes from cache

**Tasks:**
- [ ] Display "Cache hit!" notification
- [ ] Show cached result instantly
- [ ] Indicate result is from cache (not new analysis)
- [ ] Wire to Kai's `RCACache.get()`

**Implementation Example:**
```typescript
async function analyzeWithCache(agent, cache, db, error) {
  // Check cache first
  const errorHash = new ErrorHasher().hash(error); // Kai's class
  const cached = cache.get(errorHash); // Kai's method
  
  if (cached) {
    vscode.window.showInformationMessage('✅ Found in cache! (instant result)');
    outputChannel.appendLine('⚡ CACHED RESULT (analyzed previously)\n');
    showResult(cached);
    return;
  }
  
  // Not in cache, run full analysis
  vscode.window.showInformationMessage('No cache hit, analyzing...');
  const result = await agent.analyze(error);
  
  // Store in cache
  cache.set(errorHash, result); // Kai's method
  
  showResult(result);
}
```

**Tests:**
- [ ] Cache hit notification shown
- [ ] Cached result displayed instantly (<5s)
- [ ] Indicator shows it's cached
- [ ] New analysis runs if cache miss

---

### CHUNK 3.4: Feedback Buttons (Days 10-12, ~24h)

**Goal:** "Helpful/Not Helpful" buttons for user feedback

**Tasks:**
- [ ] Add "👍 Helpful" button to output
- [ ] Add "👎 Not Helpful" button to output
- [ ] Wire buttons to Kai's `FeedbackHandler`
- [ ] Show thank you message on feedback
- [ ] Optional comment box for detailed feedback

**Implementation Example:**
```typescript
function showResultWithFeedback(result: RCAResult, rcaId: string, errorHash: string) {
  showResult(result);
  
  // Add feedback section
  outputChannel.appendLine('\n---');
  outputChannel.appendLine('Was this helpful?');
  
  // Show feedback buttons
  vscode.window.showInformationMessage(
    'Was this RCA helpful?',
    '👍 Yes',
    '👎 No'
  ).then(async selection => {
    const feedbackHandler = new FeedbackHandler(db, cache); // Kai's class
    
    if (selection === '👍 Yes') {
      await feedbackHandler.handlePositive(rcaId, errorHash); // Kai's method
      vscode.window.showInformationMessage('Thank you! This will improve future analyses.');
    } else if (selection === '👎 No') {
      await feedbackHandler.handleNegative(rcaId, errorHash); // Kai's method
      vscode.window.showInformationMessage('Feedback noted. We\'ll try to improve.');
      
      // Optional: Ask for details
      const comment = await vscode.window.showInputBox({
        prompt: 'What was wrong with the analysis? (optional)',
        placeHolder: 'e.g., Incorrect root cause, missing context...',
      });
      
      if (comment) {
        outputChannel.appendLine(`User feedback: ${comment}`);
      }
    }
  });
}
```

**Tests:**
- [ ] Feedback buttons appear
- [ ] Thumbs up calls Kai's positive handler
- [ ] Thumbs down calls Kai's negative handler
- [ ] Thank you message displayed
- [ ] Optional comment box works

---

## CHUNK 4: Android UI (Weeks 6-8)

### CHUNK 4.1: Compose Error Badge (Days 1-4, ~32h)

**Goal:** Visual indicators for Compose errors

**Tasks:**
- [ ] Compose error badge (🎨 icon)
- [ ] Display Compose-specific hints
- [ ] Format remember/recomposition errors nicely
- [ ] Wire to Kai's `JetpackComposeParser`

**Implementation Example:**
```typescript
function getErrorBadge(errorType: string): string {
  const badges: Record<string, string> = {
    // ... existing badges ...
    'compose_remember': '🎨 Compose - Remember Error',
    'compose_recomposition': '🎨 Compose - Recomposition Issue',
    'compose_launched_effect': '🎨 Compose - LaunchedEffect Error',
  };
  return badges[errorType] || '⚪ Unknown Error';
}

function showResult(result: RCAResult) {
  // ... existing code ...
  
  // Add Compose-specific hints
  if (result.errorType.startsWith('compose_')) {
    outputChannel.appendLine('\n💡 COMPOSE TIP:');
    
    if (result.errorType === 'compose_remember') {
      outputChannel.appendLine('   Use remember { mutableStateOf() } for state in composables');
    } else if (result.errorType === 'compose_recomposition') {
      outputChannel.appendLine('   Check for unstable parameters causing excessive recomposition');
    }
  }
}
```

**Tests:**
- [ ] Compose badges display correctly
- [ ] Compose tips shown for Compose errors
- [ ] Works with Kai's Compose parser

---

### CHUNK 4.2: XML Error Display (Days 5-7, ~24h)

**Goal:** Show XML layout errors clearly

**Tasks:**
- [ ] XML error badge
- [ ] Display XML code snippets
- [ ] Show line numbers in XML files
- [ ] Format XML attribute suggestions
- [ ] Wire to Kai's `XMLParser`

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing code ...
  
  // XML-specific formatting
  if (result.language === 'xml') {
    outputChannel.appendLine('\n📄 XML LAYOUT:');
    outputChannel.appendLine(`   File: ${result.filePath}`);
    outputChannel.appendLine(`   Line: ${result.line}`);
    
    if (result.codeSnippet) {
      outputChannel.appendLine('\n```xml');
      outputChannel.appendLine(result.codeSnippet);
      outputChannel.appendLine('```');
    }
    
    // XML attribute suggestions
    if (result.suggestedAttributes) {
      outputChannel.appendLine('\n✏️  SUGGESTED ATTRIBUTES:');
      result.suggestedAttributes.forEach(attr => {
        outputChannel.appendLine(`   ${attr}`);
      });
    }
  }
}
```

**Tests:**
- [ ] XML badge displayed
- [ ] XML code snippet formatted
- [ ] Attribute suggestions shown
- [ ] Works with Kai's XML parser

---

### CHUNK 4.3: Gradle Conflict Visualization (Days 8-11, ~32h)

**Goal:** Show Gradle dependency conflicts clearly

**Tasks:**
- [ ] Gradle error badge
- [ ] Display dependency conflicts visually
- [ ] Format version recommendations
- [ ] Show Kai's build fix suggestions
- [ ] Wire to Kai's `AndroidBuildTool`

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing code ...
  
  // Gradle-specific formatting
  if (result.errorType.includes('gradle')) {
    outputChannel.appendLine('\n📦 GRADLE BUILD:');
    
    if (result.metadata?.module && result.metadata?.conflictingVersions) {
      const { module, conflictingVersions } = result.metadata;
      
      outputChannel.appendLine(`   Module: ${module}`);
      outputChannel.appendLine(`   Conflicting Versions:`);
      conflictingVersions.forEach((version: string) => {
        outputChannel.appendLine(`     - ${version}`);
      });
      
      if (result.recommendedFix) {
        outputChannel.appendLine('\n🔧 RECOMMENDED FIX:');
        outputChannel.appendLine(result.recommendedFix);
      }
    }
  }
}
```

**Tests:**
- [ ] Gradle badge displayed
- [ ] Conflict visualization clear
- [ ] Version recommendations shown
- [ ] Works with Kai's Android build tool

---

### CHUNK 4.4: Manifest & Docs Display (Days 12-15, ~32h)

**Goal:** Show manifest errors and Android documentation

**Tasks:**
- [ ] Manifest error badge
- [ ] Display Kai's manifest analysis
- [ ] Show Kai's docs search results
- [ ] Format permission suggestions
- [ ] Link to relevant documentation

**Implementation Example:**
```typescript
function showResult(result: RCAResult) {
  // ... existing code ...
  
  // Manifest-specific formatting
  if (result.errorType.includes('manifest')) {
    outputChannel.appendLine('\n📋 ANDROID MANIFEST:');
    
    if (result.metadata?.requiredPermission) {
      outputChannel.appendLine(`   Missing Permission: ${result.metadata.requiredPermission}`);
      outputChannel.appendLine('\n✏️  ADD TO AndroidManifest.xml:');
      outputChannel.appendLine(`   <uses-permission android:name="${result.metadata.requiredPermission}" />`);
    }
  }
  
  // Documentation results
  if (result.docResults && result.docResults.length > 0) {
    outputChannel.appendLine('\n📚 RELEVANT DOCUMENTATION:');
    result.docResults.forEach((doc, index) => {
      outputChannel.appendLine(`   ${index + 1}. ${doc.title}`);
      outputChannel.appendLine(`      ${doc.summary}`);
      if (doc.url) {
        outputChannel.appendLine(`      Link: ${doc.url}`);
      }
      outputChannel.appendLine('');
    });
  }
}
```

**Tests:**
- [ ] Manifest badge displayed
- [ ] Permission suggestions formatted correctly
- [ ] Docs search results shown
- [ ] Links work (if provided)

---

### CHUNK 4.5: Android Testing (Days 16-18, ~24h)

**Goal:** Test all Android UI components

**Tasks:**
- [ ] Test all Android error badges
- [ ] Test all Android-specific formatting
- [ ] Test with real Android errors
- [ ] Polish Android UI elements
- [ ] Document Android-specific features

**Tests:**
- [ ] All Android badges work
- [ ] Compose/XML/Gradle/Manifest errors display correctly
- [ ] User can understand Android-specific output
- [ ] No visual bugs or formatting issues

---

## CHUNK 5: Webview UI (Weeks 9-12)

### CHUNK 5.1: Webview Panel (Days 1-5, ~40h)

**Goal:** Replace output channel with interactive webview

**Tasks:**
- [ ] Create webview panel (`RCAWebview.ts`)
- [ ] Design HTML/CSS layout
  - [ ] Header with status
  - [ ] Progress bar
  - [ ] Iteration display
  - [ ] Result sections
  
- [ ] Message passing (extension ↔ webview)
- [ ] Wire to Kai's `AgentStateStream`
- [ ] Display Kai's synthesized reports

**Implementation Example:**
```typescript
// src/ui/RCAWebview.ts
import * as vscode from 'vscode';

export class RCAWebview {
  private panel: vscode.WebviewPanel;
  
  static create(context: vscode.ExtensionContext): RCAWebview {
    const panel = vscode.window.createWebviewPanel(
      'rcaAgent',
      'RCA Agent - Analysis',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    
    const instance = new RCAWebview(panel, context);
    instance.setHtmlContent();
    return instance;
  }
  
  private constructor(panel: vscode.WebviewPanel, private context: vscode.ExtensionContext) {
    this.panel = panel;
  }
  
  updateProgress(iteration: number, maxIterations: number, thought: string) {
    this.panel.webview.postMessage({
      type: 'progress',
      iteration,
      maxIterations,
      thought,
      progress: (iteration / maxIterations) * 100,
    });
  }
  
  showFinalResult(rca: RCADocument) {
    this.panel.webview.postMessage({
      type: 'result',
      rca,
    });
  }
  
  private setHtmlContent() {
    this.panel.webview.html = this.getHtmlContent();
  }
  
  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RCA Agent</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: var(--vscode-input-background);
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background-color: var(--vscode-button-background);
      transition: width 0.3s ease;
    }
    .iteration-info {
      margin: 20px 0;
      padding: 10px;
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-button-background);
    }
    .thought {
      color: var(--vscode-editor-foreground);
      font-style: italic;
    }
    .result-section {
      margin: 20px 0;
    }
    .result-section h2 {
      color: var(--vscode-textLink-foreground);
    }
    .fix-guideline {
      padding: 5px 0;
      border-left: 2px solid var(--vscode-button-background);
      padding-left: 10px;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Root Cause Analysis</h1>
    <p id="status">Initializing...</p>
  </div>
  
  <div id="progress-container" style="display: none;">
    <p id="iteration-text">Iteration 0/0</p>
    <div class="progress-bar">
      <div id="progress-fill" class="progress-fill" style="width: 0%;"></div>
    </div>
  </div>
  
  <div id="iteration-display"></div>
  <div id="result-display"></div>
  
  <script>
    const vscode = acquireVsCodeApi();
    
    window.addEventListener('message', event => {
      const message = event.data;
      
      if (message.type === 'progress') {
        document.getElementById('progress-container').style.display = 'block';
        document.getElementById('status').textContent = 'Analyzing...';
        document.getElementById('iteration-text').textContent = 
          \`Iteration \${message.iteration}/\${message.maxIterations}\`;
        document.getElementById('progress-fill').style.width = \`\${message.progress}%\`;
        
        // Add iteration info
        const iterDiv = document.createElement('div');
        iterDiv.className = 'iteration-info';
        iterDiv.innerHTML = \`
          <strong>Iteration \${message.iteration}</strong><br>
          <span class="thought">\${message.thought}</span>
        \`;
        document.getElementById('iteration-display').appendChild(iterDiv);
      }
      
      if (message.type === 'result') {
        document.getElementById('status').textContent = 'Complete!';
        document.getElementById('progress-fill').style.width = '100%';
        
        const rca = message.rca;
        const resultHtml = \`
          <div class="result-section">
            <h2>🐛 Error</h2>
            <p>\${rca.error}</p>
          </div>
          
          <div class="result-section">
            <h2>💡 Root Cause</h2>
            <p>\${rca.rootCause}</p>
          </div>
          
          <div class="result-section">
            <h2>🛠️ Fix Guidelines</h2>
            \${rca.fixGuidelines.map(guideline => 
              \`<div class="fix-guideline">\${guideline}</div>\`
            ).join('')}
          </div>
          
          <div class="result-section">
            <p>✅ Confidence: \${(rca.confidence * 100).toFixed(0)}%</p>
          </div>
        \`;
        
        document.getElementById('result-display').innerHTML = resultHtml;
      }
    });
  </script>
</body>
</html>`;
  }
}
```

**Usage in extension.ts:**
```typescript
async function analyzeWithWebview(error: ParsedError) {
  const webview = RCAWebview.create(context);
  
  const llm = await OllamaClient.create({ model: 'granite-code:8b' });
  const agent = new ReactAgent(llm); // Kai's agent
  
  // Subscribe to Kai's stream
  const stream = agent.getStream(); // Kai's method
  
  stream.on('iteration', (data) => {
    webview.updateProgress(data.iteration, data.maxIterations, data.thought);
  });
  
  stream.on('complete', (data) => {
    webview.showFinalResult(data.rca);
  });
  
  // Start analysis
  await agent.analyze(error);
}
```

**Tests:**
- [ ] Webview panel creates successfully
- [ ] Progress bar animates
- [ ] Iterations display in real-time
- [ ] Final result renders correctly
- [ ] Webview styling matches VS Code theme

---

### CHUNK 5.2: Educational Mode UI (Days 6-10, ~40h)

**Goal:** Display educational content in webview

**Tasks:**
- [ ] Educational mode toggle
- [ ] "🎓 Learning Note" sections
- [ ] Display Kai's educational content
- [ ] Format tips and examples
- [ ] "Why This Error Happened" section
- [ ] Wire to Kai's `EducationalAgent`

**Implementation Example:**
```typescript
// Add to webview HTML
function showEducationalResult(rca: RCADocument) {
  const educationalHtml = `
    <div class="result-section">
      <h2>🎓 Learning Notes</h2>
      ${rca.learningNotes.map(note => `
        <div class="learning-note">
          ${note}
        </div>
      `).join('')}
    </div>
  `;
  
  document.getElementById('result-display').innerHTML += educationalHtml;
}

// Add CSS for learning notes
.learning-note {
  background-color: var(--vscode-textBlockQuote-background);
  padding: 15px;
  margin: 10px 0;
  border-left: 4px solid var(--vscode-textLink-foreground);
  border-radius: 4px;
}

.learning-note h3 {
  margin-top: 0;
  color: var(--vscode-textLink-foreground);
}
```

**Tests:**
- [ ] Educational mode toggle works
- [ ] Learning notes display correctly
- [ ] Formatting is beginner-friendly
- [ ] Tips and examples render nicely

---

### CHUNK 5.3: Performance Display (Days 11-14, ~32h)

**Goal:** Optional performance metrics display

**Tasks:**
- [ ] Performance metrics section (optional)
- [ ] Show latency breakdown
- [ ] Display cache hit rate
- [ ] Token usage stats (if available)
- [ ] Wire to Kai's `PerformanceTracker`

**Implementation Example:**
```typescript
// Optional: Show performance metrics
function showPerformanceMetrics(metrics: PerformanceMetrics) {
  const metricsHtml = `
    <div class="result-section" style="opacity: 0.7; font-size: 0.9em;">
      <h3>⚡ Performance Metrics</h3>
      <ul>
        <li>Total Time: ${metrics.totalTime}ms</li>
        <li>LLM Inference: ${metrics.llmTime}ms</li>
        <li>Tool Execution: ${metrics.toolTime}ms</li>
        <li>Cache Hit Rate: ${metrics.cacheHitRate}%</li>
      </ul>
    </div>
  `;
  
  document.getElementById('result-display').innerHTML += metricsHtml;
}
```

**Tests:**
- [ ] Metrics display correctly
- [ ] Styling is subtle (not distracting)
- [ ] Can be toggled on/off (optional)

---

### CHUNK 5.4: UI Polish (Days 15-19, ~40h)

**Goal:** Final UI improvements and testing

**Tasks:**
- [ ] Loading states optimization
  - [ ] Skeleton loaders
  - [ ] Smooth transitions
  
- [ ] Error states
  - [ ] Friendly error messages in webview
  - [ ] Retry buttons
  
- [ ] Accessibility improvements
  - [ ] ARIA labels
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  
- [ ] UI responsiveness
  - [ ] Handle window resizing
  - [ ] Mobile-friendly (if applicable)
  
- [ ] Test all UI components
  - [ ] Different error types
  - [ ] Different screen sizes
  - [ ] Different VS Code themes

**Tests:**
- [ ] All loading states work
- [ ] Error states are clear
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Responsive layout

---

### CHUNK 5.5: Documentation & Packaging (Days 20-24, ~40h)

**Goal:** User documentation and extension packaging

**Tasks:**
- [ ] User guide (`README.md`)
  - [ ] Installation instructions
  - [ ] Usage guide with screenshots
  - [ ] Troubleshooting section
  - [ ] FAQ
  
- [ ] Educational mode guide (`EDUCATIONAL_MODE.md`)
  - [ ] What is educational mode
  - [ ] How to enable
  - [ ] Best practices
  
- [ ] Screenshots and demo video
  - [ ] Extension in action
  - [ ] Webview UI
  - [ ] Educational mode
  
- [ ] Extension packaging
  - [ ] Create `.vsix` file
  - [ ] Test installation on clean VS Code
  - [ ] Prepare for marketplace (optional)

**README.md Structure:**
```markdown
# RCA Agent - Root Cause Analysis for Kotlin/Android

AI-powered debugging assistant that analyzes your errors and suggests fixes.

## Features
- 🔍 Automatic error analysis
- 💡 Root cause identification
- 🛠️ Fix guidelines
- 🎓 Educational mode for learning
- 📚 Learns from your errors

## Installation
1. Download `rca-agent-0.1.0.vsix`
2. Open VS Code
3. Run: Extensions > Install from VSIX
4. Reload VS Code

## Prerequisites
- [Ollama](https://ollama.ai) installed and running
- Model installed: `ollama pull granite-code:8b`
- ChromaDB (optional for learning): `docker run -p 8000:8000 chromadb/chroma`

## Usage
1. Select your error message or stack trace
2. Press `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)
3. Or: Command Palette > "RCA Agent: Analyze Error"
4. View analysis in webview panel

## Troubleshooting
### "Could not connect to Ollama"
- Make sure Ollama is running: `ollama serve`
- Check if model is installed: `ollama list`

### "Analysis timed out"
- Increase timeout in settings
- Check if model is compatible (7B-8B recommended)

## Educational Mode
Enable educational mode for beginner-friendly explanations.
See [EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md) for details.

## Feedback
Click "👍 Helpful" or "👎 Not Helpful" to improve future analyses.

## License
MIT
```

**Packaging Commands:**
```bash
# Install vsce (VS Code Extension CLI)
npm install -g vsce

# Package extension
vsce package

# Output: rca-agent-0.1.0.vsix

# Test installation
code --install-extension rca-agent-0.1.0.vsix
```

**Tests:**
- [ ] README is clear and comprehensive
- [ ] Screenshots are high-quality
- [ ] Demo video shows key features
- [ ] Extension packages successfully
- [ ] Installs on clean VS Code
- [ ] All features work after installation

---

## Collaboration with Kai

### Integration Points

**Sokchea calls Kai's functions:**
1. `KotlinNPEParser.parse(errorText)` → Get ParsedError
2. `ReactAgent.analyze(error)` → Get RCADocument
3. `ReactAgent.getStream()` → Subscribe to progress events
4. `ChromaDBClient.addRCA(rca)` → Store result
5. `ChromaDBClient.searchSimilar(query)` → Get similar RCAs
6. `RCACache.get(hash)` → Check cache
7. `FeedbackHandler.handlePositive(id)` → Process feedback

### Communication

**Daily Sync:**
- Ask Kai: "What functions are ready?"
- Share: "What UI components need data?"
- Coordinate: Function signatures and data formats

**Integration Days (end of week):**
- Kai demos backend functionality
- Sokchea demos UI wireframes
- Together: Wire UI to backend
- Fix interface mismatches

### Testing Together

**Sokchea tests:**
- UI displays correctly
- Button clicks work
- Error messages shown
- Webview renders properly

**Kai tests:**
- Backend functions work
- Data formats correct
- API contracts honored

**Together test:**
- End-to-end workflow (user action → backend → UI display)
- Edge cases (errors, timeouts, missing data)
- Performance (fast enough for good UX)

---

## Success Metrics

### Phase 1 Complete When:
- ✅ Extension activates and registers commands
- ✅ Can parse errors and display results
- ✅ Webview UI works smoothly
- ✅ Educational mode displays learning notes
- ✅ Feedback buttons functional
- ✅ All Android error types display correctly
- ✅ Extension packaged as `.vsix`
- ✅ Documentation complete
- ✅ Installs and works on fresh VS Code
- ✅ You actually use it during development

### Code Quality Metrics:
- ✅ Zero ESLint warnings
- ✅ TypeScript strict mode enabled
- ✅ 80%+ test coverage
- ✅ All tests passing
- ✅ No memory leaks (all disposables cleaned)
- ✅ No hardcoded paths
- ✅ Proper error handling throughout
- ✅ Input validation on all user inputs
- ✅ CSP set for all webviews
- ✅ ARIA labels for accessibility

---

## 📚 Implementation Strategy Summary

### Week-by-Week Focus

**Weeks 1-2: MVP Core**
- Focus: Get basic extension working
- Priority: Command registration, parsing, output display
- Goal: User can analyze error and see result
- Quality: Basic error handling, logging

**Week 3: Core Enhancements**
- Focus: Better UX and error handling
- Priority: Progress indicators, error badges, tool feedback
- Goal: Professional-looking UI
- Quality: Comprehensive error handling

**Weeks 4-5: Database Integration**
- Focus: Learning from past errors
- Priority: ChromaDB connection, caching, feedback
- Goal: System gets smarter over time
- Quality: Proper state management

**Weeks 6-8: Android-Specific UI**
- Focus: Android error handling
- Priority: Compose, XML, Gradle UI components
- Goal: Full Android support
- Quality: Domain-specific UX

**Weeks 9-12: Webview & Polish**
- Focus: Interactive UI and documentation
- Priority: Real-time updates, educational mode, packaging
- Goal: Production-ready extension
- Quality: Accessibility, performance, documentation

### Daily Workflow

```typescript
// EVERY CODING SESSION:
// 1. Read best practices section
// 2. Check "DO's and DON'Ts"
// 3. Implement feature
// 4. Write tests
// 5. Check quality checklist
// 6. Commit with descriptive message

// BEFORE COMMITTING:
✓ All disposables registered
✓ Error handling added
✓ Input validation present
✓ Tests written and passing
✓ ESLint clean
✓ TypeScript compiles
✓ No `any` types
✓ Only calling Kai's functions
✓ Logged important events
```

### Integration Points with Kai

**What Sokchea Calls:**
```typescript
// Parsers
parser.parse(errorText) → ParsedError
parser.canHandle(errorText) → boolean

// Agent
agent.analyze(error) → Promise<RCADocument>
agent.getStream() → EventEmitter<AgentEvent>

// Database
db.addRCA(rca) → Promise<string>
db.searchSimilar(query) → Promise<RCADocument[]>

// Cache
cache.get(hash) → RCADocument | null
cache.set(hash, rca) → void

// Feedback
feedback.handlePositive(id) → Promise<void>
feedback.handleNegative(id) → Promise<void>

// Tools (for display purposes)
tool.execute(params) → Promise<ToolResult>
```

**What Sokchea NEVER Does:**
- ❌ Implement parsing logic
- ❌ Implement agent reasoning
- ❌ Implement database operations
- ❌ Implement tool execution
- ❌ Implement any algorithms
- ❌ Duplicate Kai's code

### Communication Protocol

**Daily Sync (5-10 minutes):**
- Ask Kai: "What functions are ready today?"
- Share: "What UI components need data?"
- Coordinate: Function signatures match?

**Integration Days (end of week):**
- Kai demos backend functionality
- Sokchea demos UI wireframes
- Together: Wire UI to backend
- Test: End-to-end workflow
- Fix: Interface mismatches

**When Blocked:**
1. Check if Kai's function is ready
2. Use mock/stub if not ready yet
3. Document expected interface
4. Continue with other tasks
5. Integrate when ready

---

## 🎓 Learning Resources

### VS Code Extension Development
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

### TypeScript Best Practices
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Accessibility
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Sinon.JS (Mocking)](https://sinonjs.org/)

---

## Notes

- Focus on UI/UX and integration
- Never implement business logic (Kai's job)
- Call Kai's functions, don't rewrite them
- Make UI intuitive and visually appealing
- Test on different VS Code themes
- Document everything for users
- Ask Kai for clarification on interfaces

**This is Sokchea's complete work breakdown. Kai handles all backend separately.**
>>>>>>> 8c58113224bbf7a87a7715a24cf9d7750b167135
