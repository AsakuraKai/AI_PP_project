# RCA Agent Backend Polish and Fix - Comprehensive Guideline

**Created:** January 12, 2026  
**Status:** Active Debugging Roadmap  
**Purpose:** Systematic approach to resolving RCA agent backend bugs and errors

> **Critical Context:** The project has undergone 3 frontend iterations:
> 1. **Original UI** (Pre-Dec 2025) - Traditional VS Code extension UI
> 2. **First Overhaul** (Dec 25, 2025) - React/Webview based UI  
> 3. **Second Overhaul** (Jan 9, 2026) - Figma-inspired Modern UI (Current)
> 
> Backend services exist in `src/` while extension code is in `vscode-extension/src/`

---

## [CLIPBOARD] Table of Contents

1. [Overview & Strategy](#overview--strategy)
2. [Known Issues & Pain Points](#known-issues--pain-points)
3. [Session-Based Debugging Approach](#session-based-debugging-approach)
4. [Chunk 1: Core Backend Services](#chunk-1-core-backend-services)
5. [Chunk 2: Extension Entry Point & Initialization](#chunk-2-extension-entry-point--initialization)
6. [Chunk 3: Message Passing Layer](#chunk-3-message-passing-layer)
7. [Chunk 4: Frontend Services Integration](#chunk-4-frontend-services-integration)
8. [Chunk 5: Error Detection & Queue Management](#chunk-5-error-detection--queue-management)
9. [Chunk 6: Agent System & Analysis Flow](#chunk-6-agent-system--analysis-flow)
10. [Chunk 7: Tools System](#chunk-7-tools-system)
11. [Chunk 8: Cross-Cutting Concerns](#chunk-8-cross-cutting-concerns)
12. [Verification & Testing](#verification--testing)

---

## [TARGET] Overview & Strategy

### Current Situation

The RCA Agent backend is experiencing a "stalemate" with bugs and errors that prevent proper functionality. The complexity arises from:

1. **Multiple Frontend Versions:** 3 UI iterations with potential orphaned code/contracts
2. **Path Issues:** Backend in `src/`, extension in `vscode-extension/src/`
3. **Message Passing Complexity:** Extension [H_ARROW] Webview [H_ARROW] Backend communication
4. **API Mismatches:** Constructor signatures, method calls, type incompatibilities
5. **State Management:** Multiple singleton managers with unclear initialization order
6. **Integration Gaps:** Documented features not fully wired to UI

### Debugging Philosophy

**File-by-File, Function-by-Function Analysis:**
- Start with foundational code (types, utilities)
- Work through dependency chains
- Verify each integration point
- Connect UI requirements to backend capabilities
- Document all findings and fixes

**Session-Based Chunking:**
- Each chunk = 1-2 hour focused session
- Clear entry/exit criteria
- Incremental validation
- Track progress and blockers

### Recommended Execution Order

**Phase 1: Foundation (Critical Path)**
1. **Chunk 1** (Core Backend Services) - FOUNDATIONAL
   - Unblocks: Chunks 4, 6, 7
   - Priority: CRITICAL - Nothing works without this
   - Estimated Time: 2-3 hours

2. **Chunk 2** (Extension Entry Point) - FOUNDATIONAL
   - Unblocks: Chunks 3, 5
   - Priority: CRITICAL - Extension must activate
   - Estimated Time: 2-3 hours

**Phase 2: Communication & Data Flow**
3. **Chunk 3** (Message Passing Layer) - CRITICAL PATH
   - Depends on: Chunk 2
   - Unblocks: All UI functionality
   - Priority: HIGH - Enables UI-backend communication
   - Estimated Time: 3-4 hours

4. **Chunk 5** (Error Detection) - CRITICAL PATH
   - Depends on: Chunk 2
   - Enables: Testing of all subsequent features
   - Priority: HIGH - Provides data to test with
   - Estimated Time: 2-3 hours

**Phase 3: Core Features**
5. **Chunk 4** (Frontend Services Integration)
   - Depends on: Chunks 1, 2, 3
   - Enables: Analysis and fix application
   - Priority: HIGH - Core business logic
   - Estimated Time: 2-3 hours

6. **Chunk 6** (Agent System)
   - Depends on: Chunks 1, 4, 5
   - Enables: Actual analysis functionality
   - Priority: HIGH - Core feature
   - Estimated Time: 3-4 hours

7. **Chunk 7** (Tools System)
   - Depends on: Chunk 6
   - Enhances: Agent capabilities
   - Priority: MEDIUM - Extends functionality
   - Estimated Time: 4-5 hours

**Phase 4: Polish & Optimization**
8. **Chunk 8** (Cross-Cutting Concerns)
   - Depends on: All previous chunks
   - Improves: Quality, performance, UX
   - Priority: MEDIUM - Nice-to-have improvements
   - Estimated Time: 2-3 hours

**Total Estimated Time: 20-28 hours**

### Version Control Strategy

**Branch Management:**
```bash
# Create main fix branch
git checkout -b fix/backend-polish-comprehensive

# Create chunk-specific branches
git checkout -b fix/chunk-1-core-backend
# After chunk complete:
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-1-core-backend
git tag chunk-1-complete
```

**Commit Strategy:**
- Commit after each file modification
- Use conventional commit format:
  - `fix(chunk-N): Brief description`
  - `test(chunk-N): Add verification test`
  - `docs(chunk-N): Update session log`

**Rollback Strategy:**
```bash
# If chunk validation fails
git reset --hard chunk-(N-1)-complete

# If specific file breaks something
git checkout HEAD~1 -- path/to/file.ts

# Nuclear option (start chunk over)
git checkout fix/backend-polish-comprehensive
git branch -D fix/chunk-N-name
git checkout -b fix/chunk-N-name
```

### Success Criteria - Minimum Viable Product

Before considering the polish complete, verify:

**Core Functionality:**
- [ ] Extension activates without TypeScript compilation errors
- [ ] Extension activates without runtime errors in console
- [ ] At least one error source (diagnostics) is working
- [ ] Error appears in Error Queue UI
- [ ] "Analyze" button triggers analysis
- [ ] Analysis completes and shows RCA result
- [ ] At least one suggested fix is generated
- [ ] Fix preview shows diff correctly
- [ ] "Apply Fix" modifies code successfully
- [ ] Applied fix appears in history

**Quality Gates:**
- [ ] No console errors during normal operation
- [ ] No unhandled promise rejections
- [ ] All message handlers have error handling
- [ ] TypeScript strict mode passes
- [ ] At least 70% code coverage for modified files

**Performance Baselines:**
- [ ] Extension activation: < 3 seconds
- [ ] Error detection scan: < 500ms for 100 errors
- [ ] Analysis completion: < 30s for typical error
- [ ] UI update latency: < 100ms after data change
- [ ] Memory overhead: < 200MB in extension host

---

## [ALERT] Known Issues & Pain Points

### Critical Issues (Blocking)

1. **Module Path Constraint (~80 errors)**
   - Backend files (`src/`) outside `vscode-extension/src/` rootDir
   - TypeScript won't compile due to rootDir constraint
   - **Location:** `tsconfig.json`, build configuration
   - **Impact:** Extension cannot compile

2. **API Signature Mismatches (~10+ errors)**
   - `OllamaClient` constructor expects 1 param, code passes 2
   - `ChromaDBClient` constructor is private
   - `ErrorParser.parseError()` API doesn't match usage
   - **Location:** Service initialization in `extension.ts`, `RCAWebviewProvider.ts`
   - **Impact:** Runtime crashes on service initialization

3. **Message Passing Inconsistencies**
   - Commands expected by webview not implemented in extension
   - Response data structures don't match frontend expectations
   - **Location:** `RCAWebviewProvider.ts`, webview hooks
   - **Impact:** UI features don't work, silent failures

4. **State Manager Singleton Issues**
   - Multiple managers initialized in different orders
   - Race conditions between `StateManager`, `ErrorQueueManager`, services
   - **Location:** `extension.ts` activation, `RCAWebviewProvider` constructor
   - **Impact:** Undefined references, null pointers

### High Priority Issues

5. **Type System Fragmentation**
   - Types defined in multiple locations: `src/types.ts`, `vscode-extension/src/types/`
   - Incompatible interfaces between backend and extension
   - **Location:** Type definitions across project
   - **Impact:** TypeScript compilation errors, runtime type mismatches

6. **Webview Asset Loading**
   - Vite build output not in expected location for webview
   - Asset URI construction may be incorrect
   - **Location:** `RCAWebviewProvider._getHtmlForWebview()`
   - **Impact:** Blank webview, JS/CSS not loading

7. **Error Detection Not Triggering**
   - `AdvancedErrorDetector` may not be activating
   - Diagnostic listeners not firing
   - **Location:** `AdvancedErrorDetector.ts`, `ErrorQueueManager.ts`
   - **Impact:** No errors appear in queue

### Medium Priority Issues

8. **Incomplete Backend Wiring**
   - Some backend services not exposed to extension
   - Missing commands for documented features
   - **Location:** Service registration in `extension.ts`
   - **Impact:** Features work in isolation but not integrated

9. **Educational Mode Integration**
   - `EducationalAgent` exists but not wired to UI
   - Settings not propagating to backend
   - **Location:** Agent initialization, settings handling
   - **Impact:** Educational mode doesn't work

10. **Performance Monitoring Gaps**
    - Metrics collection code exists but not connected
    - No way to view metrics from UI
    - **Location:** `MetricsCollector.ts`, metrics view integration
    - **Impact:** Performance issues not visible

---

## [DOCS] Session-Based Debugging Approach

### Session Structure

Each debugging session follows this structure:

```
1. PREPARATION (10 min)
   - Review chunk objectives
   - Gather related documentation
   - Identify files to inspect
   
2. ANALYSIS (40 min)
   - Read files systematically
   - Document function signatures
   - Map dependencies
   - Identify bugs/issues
   
3. FIXING (50 min)
   - Implement fixes file-by-file
   - Test each fix incrementally
   - Document changes
   
4. VALIDATION (20 min)
   - Run relevant tests
   - Verify integration points
   - Update chunk status
```

### Progress Tracking

Use this template for each chunk:

```markdown
## Chunk X: [Name] - Session Log

**Date:** [Date]
**Duration:** [Time]
**Status:** [RED] Not Started | [YELLOW] In Progress | [GREEN] Complete | 🔵 Blocked

### Objectives
- [ ] Objective 1
- [ ] Objective 2

### Files Analyzed
- `path/to/file.ts` - [Brief description of findings]

### Issues Found
1. **Issue Title** (Severity: Critical/High/Medium/Low)
   - Description
   - Location
   - Fix applied: Yes/No

### Fixes Implemented
1. **Fix Description**
   - File: `path/to/file.ts`
   - Change: [Brief description]
   - Verification: Pass/Fail

### Blockers
- None / [Description of blocker]

### Next Session
- [What to tackle next]
```

---

## [TOOL] Chunk 1: Core Backend Services

**Priority:** CRITICAL | **Phase:** Foundation | **Est. Time:** 2-3 hours  
**Depends On:** None (Foundational)  
**Unblocks:** Chunks 4, 6, 7

### Pre-Chunk Checklist

- [ ] Git branch created: `fix/chunk-1-core-backend`
- [ ] Current branch is clean (no uncommitted changes)
- [ ] Extension is not running (close all VS Code instances with extension)
- [ ] Read through this entire chunk before starting
- [ ] Have terminal ready for quick verification tests
- [ ] Backup important files if unsure about changes

### Objectives

- [DONE] Verify `src/types.ts` definitions are correct
- [DONE] Verify LLM client (`OllamaClient`) API
- [DONE] Verify database client (`ChromaDBClient`) API
- [DONE] Verify core parsers (`ErrorParser`, `LogcatParser`, etc.)
- [DONE] Document actual signatures vs expected signatures
- [DONE] Create compatibility layer if needed

### Files to Analyze

1. **`src/types.ts`** (Core type definitions)
   - Verify `RCAResult`, `ErrorInfo`, `ToolCall`, etc.
   - Check for breaking changes from UI overhauls
   - Document all exported types

2. **`src/llm/OllamaClient.ts`** (LLM Integration)
   ```typescript
   // What to check:
   // - Constructor signature: OllamaClient(baseUrl: string, options?: OllamaOptions)
   // - analyze() method signature
   // - streaming support
   // - error handling
   ```

3. **`src/db/ChromaDBClient.ts`** (Vector Database)
   ```typescript
   // What to check:
   // - Is constructor private? Why?
   // - getInstance() method
   // - addExample() / queryExamples() methods
   // - Initialization requirements
   ```

4. **`src/utils/ErrorParser.ts`** (Error Parsing)
   ```typescript
   // What to check:
   // - parseError() signature and return type
   // - Support for different error formats
   // - Integration with diagnostic sources
   ```

### Analysis Script

```typescript
// Run this to document current APIs
import { OllamaClient } from '../src/llm/OllamaClient';
import { ChromaDBClient } from '../src/db/ChromaDBClient';
import { ErrorParser } from '../src/utils/ErrorParser';

// Document constructor signatures
console.log('OllamaClient constructor:', OllamaClient.constructor.length, 'params');
console.log('ChromaDBClient constructor:', ChromaDBClient.constructor.length, 'params');

// Document key method signatures
console.log('ErrorParser.parseError:', typeof ErrorParser.parseError);
```

### Expected Issues

1. **Constructor Mismatches**
   - Extension code may be using old signatures
   - Need to update all initialization code

2. **Missing Methods**
   - UI expects methods that don't exist in backend
   - Need to implement or create adapters

3. **Type Incompatibilities**
   - Backend returns one shape, UI expects another
   - Need normalization functions

### Validation Criteria

- [DONE] All backend services can be imported without errors
- [DONE] All constructor calls use correct parameters
- [DONE] All method calls match actual signatures
- [DONE] Types are consistent between backend and extension

### Post-Chunk Verification

**1. Compilation Test:**
```bash
cd vscode-extension
npm run compile
# Expected: 0 errors related to src/* imports
```

**2. Import Test:**
```typescript
// Create temp file: vscode-extension/src/test-chunk-1.ts
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ChromaDBClient } from '../../src/db/ChromaDBClient';
import { ErrorParser } from '../../src/utils/ErrorParser';
import type { RCAResult, ErrorInfo } from '../../src/types';

console.log('All imports successful');
```
Run: `npx ts-node vscode-extension/src/test-chunk-1.ts`

**3. API Verification:**
```typescript
// Verify constructor signatures
const ollama = new OllamaClient(/* verify param count */);
const chroma = new ChromaDBClient(/* verify param count */);
console.log('Constructors accept correct parameters');
```

**4. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-1): Core backend services verified and fixed"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-1-core-backend
git tag chunk-1-complete -m "Chunk 1: Core Backend Services - Complete"
```

**5. Checklist:**
- [ ] Compilation passes without backend-related errors
- [ ] All imports resolve correctly
- [ ] No runtime errors when instantiating services
- [ ] Types are properly exported and importable
- [ ] All fixes are committed and tagged
- [ ] Session log updated with findings

**If any check fails:** Review fixes, do NOT proceed to Chunk 2.

---

## 🔌 Chunk 2: Extension Entry Point & Initialization

**Priority:** CRITICAL | **Phase:** Foundation | **Est. Time:** 2-3 hours  
**Depends On:** Chunk 1 (Core Backend Services)  
**Unblocks:** Chunks 3, 5

### Pre-Chunk Checklist

- [ ] Chunk 1 is complete and verified
- [ ] Git branch created: `fix/chunk-2-extension-entry`
- [ ] Run `npm run compile` - should have 0 backend import errors
- [ ] Review Chunk 1 session log for any backend API notes
- [ ] Have VS Code Extension Host debugger ready
- [ ] Read through extension.ts before making changes

### Objectives

- [DONE] Understand extension activation flow
- [DONE] Verify service initialization order
- [DONE] Fix singleton initialization race conditions
- [DONE] Ensure all required services are initialized
- [DONE] Verify error handling during initialization

### Files to Analyze

1. **`vscode-extension/src/extension.ts`** (Main entry point - 394 lines)
   ```typescript
   // Key functions to analyze:
   // - activate(context: vscode.ExtensionContext)
   // - initializeBackendServices(context)
   // - deactivate()
   
   // Key initialization order (CRITICAL):
   // 1. Output channels
   // 2. StateManager (singleton)
   // 3. ErrorQueueManager (singleton)
   // 4. Status bar
   // 5. Backend services (AnalysisService, FixApplicationService)
   // 6. Webview provider
   // 7. Chat participant
   // 8. Advanced error detector
   // 9. Commands
   ```

2. **Global State Variables**
   ```typescript
   // Document what's in global scope:
   let outputChannel: vscode.OutputChannel;
   let debugChannel: vscode.OutputChannel;
   let extensionContext: vscode.ExtensionContext;
   let statusBarItem: vscode.StatusBarItem;
   let analysisService: AnalysisService | undefined;
   let fixApplicationService: FixApplicationService | undefined;
   let errorQueueManager: ErrorQueueManager | undefined;
   let stateManager: StateManager | undefined;
   let advancedErrorDetector: AdvancedErrorDetector | undefined;
   let conversationalAgent: ConversationalAgent | undefined;
   let guidedWorkflow: GuidedDebuggingWorkflow | undefined;
   
   // Are these all properly initialized?
   // Are they used consistently?
   ```

### Critical Issues to Fix

1. **Service Initialization Order**
   ```typescript
   // PROBLEM: Services initialized before singletons ready
   // FIX: Ensure correct order
   
   // CORRECT ORDER:
   async function activate(context: vscode.ExtensionContext) {
     // 1. Infrastructure first
     outputChannel = vscode.window.createOutputChannel('RCA Agent');
     debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');
     
     // 2. Singletons (StateManager, ErrorQueueManager)
     stateManager = StateManager.getInstance(context);
     errorQueueManager = ErrorQueueManager.getInstance(context);
     
     // 3. Backend services (depend on singletons)
     await initializeBackendServices(context);
     
     // 4. UI (depends on services)
     const webviewProvider = new RCAWebviewProvider(context.extensionUri, context);
     
     // 5. Error detection (depends on everything)
     advancedErrorDetector = AdvancedErrorDetector.getInstance(context, errorQueueManager);
   }
   ```

2. **API Mismatch in Service Initialization**
   ```typescript
   // Find and fix all instances like:
   
   // WRONG:
   const ollamaClient = new OllamaClient(baseUrl, options);
   
   // RIGHT (check actual constructor):
   const ollamaClient = new OllamaClient(baseUrl); // Only 1 param?
   // OR
   const ollamaClient = OllamaClient.getInstance(config); // Factory method?
   ```

### Analysis Checklist

- [ ] Read full `extension.ts` file (394 lines)
- [ ] Document all services created
- [ ] Map dependencies between services
- [ ] Identify initialization order dependencies
- [ ] Check error handling for each init step
- [ ] Verify cleanup in `deactivate()`
- [ ] Test: Does extension activate without errors?

### Validation Criteria

- [DONE] Extension activates successfully
- [DONE] No undefined reference errors
- [DONE] All services initialized in correct order
- [DONE] Proper error handling if service fails
- [DONE] Clean deactivation without warnings

### Post-Chunk Verification

**1. Activation Test:**
```bash
# Open VS Code with extension
code --extensionDevelopmentPath=./vscode-extension
# Check Output > RCA Agent for initialization logs
# Expected: No errors, all services initialized
```

**2. Debug Console Check:**
- Open Debug Console (Ctrl+Shift+Y)
- Look for any red errors
- Verify all services show "initialized" logs

**3. Command Palette Test:**
```
Ctrl+Shift+P > "RCA Agent"
# Should show all registered commands
# Try: "RCA Agent: Show Error Queue"
# Expected: Webview opens (even if empty)
```

**4. Deactivation Test:**
```
# Close VS Code window
# Check console for any errors during deactivation
# Expected: Clean shutdown, no warnings
```

**5. Integration Smoke Test:**
```typescript
// In extension.ts, add temporary test after activation:
console.log('Service check:', {
  ollamaClient: !!ollamaClient,
  chromaClient: !!chromaClient,
  errorQueueManager: !!errorQueueManager,
  analysisService: !!analysisService
});
// All should be true
```

**6. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-2): Extension initialization fixed and verified"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-2-extension-entry
git tag chunk-2-complete -m "Chunk 2: Extension Entry Point - Complete"
```

**7. Checklist:**
- [ ] Extension activates without errors
- [ ] All services are defined (not undefined/null)
- [ ] Webview can be opened
- [ ] No console errors during startup
- [ ] Deactivation is clean
- [ ] All fixes committed and tagged

**If any check fails:** Fix before proceeding to Chunk 3.

---

## [CHAT] Chunk 3: Message Passing Layer

**Priority:** HIGH | **Phase:** Communication & Data Flow | **Est. Time:** 3-4 hours  
**Depends On:** Chunk 2 (Extension Entry Point)  
**Unblocks:** All UI functionality

### Pre-Chunk Checklist

- [ ] Chunks 1 and 2 are complete and verified
- [ ] Git branch created: `fix/chunk-3-message-passing`
- [ ] Extension activates successfully (from Chunk 2)
- [ ] Have both extension code and webview code open
- [ ] Browser DevTools ready for webview debugging
- [ ] Message contracts documented (see MESSAGE_PASSING.md)

### Objectives

- [DONE] Map all message commands (Webview → Extension)
- [DONE] Map all message responses (Extension → Webview)
- [DONE] Verify message handlers exist for all commands
- [DONE] Ensure response data matches frontend expectations
- [DONE] Fix any missing handlers
- [DONE] Test message flow end-to-end

### Files to Analyze

1. **`vscode-extension/src/webview/RCAWebviewProvider.ts`** (Primary message handler)
   ```typescript
   // Key methods:
   // - resolveWebviewView() - Setup
   // - _handleMessage(message: any) - Main dispatcher
   // - _sendMessage(message: any) - Send to webview
   // - All handler methods: _handleAnalyzeError(), _handleGetErrorQueue(), etc.
   ```

2. **Webview Hooks (Frontend)**
   - `vscode-extension/webview/src/hooks/useErrorQueue.ts`
   - `vscode-extension/webview/src/hooks/useAnalyze.ts`
   - `vscode-extension/webview/src/hooks/useFixManager.ts`
   - `vscode-extension/webview/src/hooks/useHistory.ts`
   - `vscode-extension/webview/src/hooks/useAgentState.ts`
   - `vscode-extension/webview/src/hooks/useMetrics.ts`

### Message Contract Analysis

Create a mapping document:

```markdown
### Command: analyzeError
- **Sent by:** useAnalyze hook
- **Payload:** { command: 'analyzeError', error: ErrorInfo }
- **Handler:** RCAWebviewProvider._handleAnalyzeError()
- **Response:** { command: 'analysisComplete', result: RCAResult }
- **Status:** [DONE] Implemented / [FAIL] Missing / [WARNING] Partial

### Command: getErrorQueue
- **Sent by:** useErrorQueue hook
- **Payload:** { command: 'getErrorQueue' }
- **Handler:** RCAWebviewProvider._handleGetErrorQueue()
- **Response:** { command: 'errorQueueData', errors: ErrorItem[] }
- **Status:** [DONE] Implemented / [FAIL] Missing / [WARNING] Partial

// ... repeat for ALL commands
```

### Commands to Verify (Based on Documentation)

From `docs/_archive/RCA-AGENT-OVERHUAL-01-09-2026/technical/MESSAGE_PASSING.md`:

**Analysis Commands:**
- `analyzeError` - Analyze single error
- `analyzeAllErrors` - Batch analysis
- `cancelAnalysis` - Stop ongoing analysis
- `reanalyze` - Re-run analysis

**Error Queue Commands:**
- `getErrorQueue` - Fetch all errors
- `refreshErrorQueue` - Re-scan workspace
- `removeError` - Remove from queue
- `pinError` / `unpinError` - Pin management
- `analyzeMultipleErrors` - Batch analysis
- `clearCompletedErrors` - Clear analyzed errors

**Fix Management Commands:**
- `getPendingFixes` - Get suggested fixes
- `getAppliedFixes` - Get fix history
- `previewFix` - Show diff
- `applyFix` - Apply code change
- `rejectFix` - Reject fix
- `applyMultipleFixes` - Batch apply
- `clearAppliedFixes` - Clear history

**History Commands:**
- `getHistory` - Fetch analysis history
- `getHistoryItem` - Get detailed history entry
- `deleteHistoryItem` - Remove history entry
- `clearHistory` - Clear all history
- `searchHistory` - Search history
- `exportHistory` - Export history data

**Agent State Commands:**
- `subscribeAgentState` - Real-time updates
- `unsubscribeAgentState` - Stop updates
- `getToolMetrics` - Tool usage stats

**Metrics Commands:**
- `getMetrics` - Fetch all metrics
- `refreshMetrics` - Recalculate metrics

**Configuration Commands:**
- `getConfig` - Get all settings
- `updateConfig` - Update settings
- `resetConfig` - Reset to defaults

### Critical Issues to Fix

1. **Missing Handlers**
   ```typescript
   // PROBLEM: Command sent from webview but no handler
   
   // In RCAWebviewProvider._handleMessage():
   case 'someCommand':
     // [FAIL] No implementation
     break;
   
   // FIX: Implement handler
   case 'someCommand':
     await this._handleSomeCommand(message.payload);
     break;
   ```

2. **Response Data Mismatch**
   ```typescript
   // PROBLEM: Backend returns different shape than UI expects
   
   // Backend sends:
   this._sendMessage({
     command: 'analysisComplete',
     result: { rootCause: '...', fixes: [...] }
   });
   
   // But UI expects:
   // { command: 'analysisComplete', result: { hypothesis: '...', reasoning: [...] } }
   
   // FIX: Use normalization function
   this._sendMessage({
     command: 'analysisComplete',
     result: this._normalizeResultForWebview(backendResult)
   });
   ```

3. **No Error Handling**
   ```typescript
   // PROBLEM: Handler throws, webview waits forever
   
   // BAD:
   async _handleAnalyzeError(error: any) {
     const result = await this.analysisService.analyze(error); // May throw
     this._sendMessage({ command: 'analysisComplete', result });
   }
   
   // GOOD:
   async _handleAnalyzeError(error: any) {
     try {
       const result = await this.analysisService.analyze(error);
       this._sendMessage({ command: 'analysisComplete', result });
     } catch (err) {
       console.error('[RCA] Analysis failed:', err);
       this._sendMessage({ 
         command: 'analysisError', 
         error: { message: err.message, stack: err.stack }
       });
     }
   }
   ```

### Analysis Process

1. **Create Message Matrix**
   - List all commands from each hook
   - Find corresponding handler in RCAWebviewProvider
   - Mark status (Implemented/Missing/Broken)

2. **Test Each Message Flow**
   ```typescript
   // Manual test script
   const testMessageFlow = async (command: string, payload: any) => {
     console.log(`Testing: ${command}`);
     webview.postMessage({ command, ...payload });
     // Wait for response...
     // Verify data shape...
   };
   ```

3. **Fix Gaps**
   - Implement missing handlers
   - Fix response data shapes
   - Add error handling

### Validation Criteria

- [DONE] All commands have handlers
- [DONE] All handlers return expected responses
- [DONE] Error cases handled gracefully
- [DONE] No silent failures
- [DONE] Message flow tested end-to-end

### Post-Chunk Verification

**1. Message Handler Audit:**
```typescript
// Create test script: scripts/verify-message-handlers.ts
const expectedCommands = [
  'analyzeError', 'getErrorQueue', 'applyFix', 'getMetrics', // etc.
];
const implementedHandlers = /* extract from RCAWebviewProvider */;
const missing = expectedCommands.filter(cmd => !implementedHandlers.includes(cmd));
console.log('Missing handlers:', missing);
// Expected: empty array
```

**2. Manual Message Test:**
```javascript
// In webview DevTools console:
vscode.postMessage({ command: 'getErrorQueue' });
// Expected: Response within 1 second
vscode.postMessage({ command: 'getMetrics' });
// Expected: Response with metrics data
```

**3. Error Handling Test:**
```javascript
// In webview:
vscode.postMessage({ command: 'analyzeError', error: null });
// Expected: Error response, not silent failure
vscode.postMessage({ command: 'nonExistentCommand' });
// Expected: "Unknown command" error
```

**4. Response Format Verification:**
```typescript
// For each handler, verify response shape matches frontend:
interface GetErrorQueueResponse {
  command: 'errorQueueData';
  errors: ErrorItem[];
}
// Check actual response matches this
```

**5. Performance Test:**
```javascript
// Measure message round-trip time:
const start = Date.now();
vscode.postMessage({ command: 'getErrorQueue' });
// In response listener:
const latency = Date.now() - start;
console.log('Latency:', latency, 'ms');
// Expected: < 100ms for simple queries
```

**6. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-3): Message passing layer complete with all handlers"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-3-message-passing
git tag chunk-3-complete -m "Chunk 3: Message Passing Layer - Complete"
```

**7. Checklist:**
- [ ] All expected commands have handlers
- [ ] All handlers tested and return correct data
- [ ] Error handling works for invalid commands
- [ ] No silent failures in console
- [ ] Message latency < 100ms
- [ ] All fixes committed and tagged

**Critical:** This chunk is on the critical path. UI functionality depends on this.

---

## [TOOL] Chunk 4: Frontend Services Integration

**Priority:** HIGH | **Phase:** Communication & Data Flow | **Est. Time:** 2-3 hours  
**Depends On:** Chunks 1, 2, 3 (Core Backend, Extension Entry, Message Passing)  
**Unblocks:** Analysis and fix application features

### Pre-Chunk Checklist

- [ ] Chunks 1, 2, and 3 are complete and verified
- [ ] Git branch created: `fix/chunk-4-frontend-services`
- [ ] Message passing tested and working (from Chunk 3)
- [ ] Backend services documented (from Chunk 1)
- [ ] Have service files and backend API docs open
- [ ] Review AnalysisService and FixApplicationService before starting

### Objectives

- [DONE] Verify `AnalysisService` integration
- [DONE] Verify `FixApplicationService` integration
- [DONE] Verify `NetworkTimeoutHandler` usage
- [DONE] Ensure services use correct backend APIs
- [DONE] Test service methods from extension context

### Files to Analyze

1. **`vscode-extension/src/services/AnalysisService.ts`**
   ```typescript
   // Key methods:
   // - analyze(error: ErrorInfo): Promise<RCAResult>
   // - cancelAnalysis(): void
   // - getProgress(): AnalysisProgress
   
   // Check:
   // - How does it call backend agents?
   // - Does it use correct OllamaClient API?
   // - How does it handle streaming?
   // - Error handling complete?
   ```

2. **`vscode-extension/src/services/FixApplicationService.ts`**
   ```typescript
   // Key methods:
   // - applyFix(fix: PendingFix): Promise<AppliedFix>
   // - previewFix(fix: PendingFix): Promise<DiffPreview>
   // - rejectFix(fixId: string): void
   
   // Check:
   // - Does it use FixGenerator from backend?
   // - File manipulation correct?
   // - Undo/redo support?
   ```

3. **`vscode-extension/src/services/NetworkTimeoutHandler.ts`**
   ```typescript
   // Purpose: Wrap service calls with timeout/retry logic
   
   // Check:
   // - Is it actually being used?
   // - Timeout values reasonable?
   // - Retry logic correct?
   ```

4. **`vscode-extension/src/services/StateManager.ts`**
   ```typescript
   // Manages extension state
   
   // Check:
   // - Singleton implementation correct?
   // - Event emitters working?
   // - State persistence to VS Code storage?
   ```

5. **`vscode-extension/src/services/ErrorQueueManager.ts`**
   ```typescript
   // Manages error queue
   
   // Check:
   // - Integration with AdvancedErrorDetector?
   // - Add/remove/update operations correct?
   // - Event notifications working?
   ```

### Critical Integration Points

1. **AnalysisService [H_ARROW] Backend Agents**
   ```typescript
   // In AnalysisService.ts
   
   // VERIFY:
   import { MinimalReactAgent } from '../../../src/agent/MinimalReactAgent';
   import { MultiPassAgent } from '../../../src/agent/MultiPassAgent';
   import { OllamaClient } from '../../../src/llm/OllamaClient';
   
   // Check if imports work (path issues?)
   // Check if constructors match
   // Check if method calls match
   ```

2. **FixApplicationService [H_ARROW] FixGenerator**
   ```typescript
   // In FixApplicationService.ts
   
   // VERIFY:
   import { FixGenerator } from '../../../src/agent/FixGenerator';
   
   // Does it use FixGenerator?
   // Or does it have its own fix logic?
   // Documentation says to use FixGenerator (P0 fix)
   ```

3. **Services [H_ARROW] RCAWebviewProvider**
   ```typescript
   // In RCAWebviewProvider.ts
   
   // Services are injected:
   this.analysisService = AnalysisService.getInstance();
   this.fixApplicationService = FixApplicationService.getInstance();
   
   // Check:
   // - Singleton pattern correct?
   // - Services initialized before use?
   // - Method calls match signatures?
   ```

### Issues to Fix

1. **Path Import Issues**
   ```typescript
   // PROBLEM: Backend in src/, extension in vscode-extension/src/
   
   // Imports may fail:
   import { SomeAgent } from '../../../src/agent/SomeAgent';
   // ^ Might not compile due to tsconfig rootDir
   
   // SOLUTIONS:
   // A) Fix tsconfig with composite projects
   // B) Build backend as separate package
   // C) Copy backend types to extension
   ```

2. **API Mismatches**
   ```typescript
   // PROBLEM: Service uses old API
   
   // Service calls:
   const result = await this.agent.analyze(error, options);
   
   // But agent expects:
   async analyze(prompt: string, tools: Tool[]): Promise<RCAResult>
   
   // FIX: Update service to use correct API
   const prompt = this.buildPromptFromError(error);
   const tools = this.getAvailableTools();
   const result = await this.agent.analyze(prompt, tools);
   ```

3. **Missing Error Handling**
   ```typescript
   // PROBLEM: Service doesn't handle backend errors
   
   // BAD:
   async analyze(error: ErrorInfo) {
     const result = await this.backend.analyze(error);
     return result; // What if backend throws?
   }
   
   // GOOD:
   async analyze(error: ErrorInfo) {
     try {
       const result = await this.backend.analyze(error);
       return result;
     } catch (err) {
       console.error('[AnalysisService] Backend error:', err);
       return {
         success: false,
         error: 'Analysis failed: ' + err.message,
         rootCause: 'Error during analysis',
         confidence: 0,
         fixes: []
       };
     }
   }
   ```

### Validation Criteria

- [DONE] All services can import backend code
- [DONE] All services use correct backend APIs
- [DONE] Service methods work in isolation
- [DONE] Services integrated with webview provider
- [DONE] Error handling comprehensive

### Post-Chunk Verification

**1. Service Import Test:**
```bash
npm run compile
# Expected: No import errors for AnalysisService, FixApplicationService, etc.
```

**2. Isolated Service Test:**
```typescript
// Create: vscode-extension/src/test/service-integration.test.ts
import { AnalysisService } from '../services/AnalysisService';

const service = new AnalysisService(/* correct params */);
// Verify: Instantiation succeeds
// Verify: Methods exist and have correct signatures
console.log('analyze:', typeof service.analyze); // 'function'
```

**3. Backend API Usage Verification:**
```typescript
// Check that services call backend correctly:
// In AnalysisService.analyze():
// Should use: agent.analyze() with correct params
// Should handle: agent errors gracefully
// Should return: proper RCAResult format
```

**4. Integration with Message Handlers:**
```typescript
// In RCAWebviewProvider:
// Verify handlers call services:
case 'analyzeError':
  const result = await this.analysisService.analyze(error);
  // Result should be valid RCAResult
  this.postMessage({ command: 'analysisComplete', result });
```

**5. Error Handling Test:**
```typescript
// Test service error handling:
try {
  await analysisService.analyze(null); // Invalid input
} catch (error) {
  console.log('Caught error:', error.message);
  // Expected: Proper error, not crash
}
```

**6. Network Timeout Test:**
```typescript
// Verify NetworkTimeoutHandler integration:
const handler = new NetworkTimeoutHandler(context);
// Simulate slow operation
const result = await handler.withTimeout(
  () => new Promise(resolve => setTimeout(resolve, 60000)),
  5000
);
// Expected: Timeout after 5 seconds, not 60
```

**7. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-4): Frontend services integration complete"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-4-frontend-services
git tag chunk-4-complete -m "Chunk 4: Frontend Services Integration - Complete"
```

**8. Checklist:**
- [ ] All services compile without errors
- [ ] Services instantiate correctly
- [ ] Backend APIs called with correct parameters
- [ ] Services integrated with message handlers
- [ ] Error handling tested and working
- [ ] Network timeouts enforced
- [ ] All fixes committed and tagged

**Note:** Don't test full analysis yet - need error detection from Chunk 5.

---

## [SEARCH] Chunk 5: Error Detection & Queue Management

**Priority:** HIGH | **Phase:** Communication & Data Flow | **Est. Time:** 2-3 hours  
**Depends On:** Chunk 2 (Extension Entry Point)  
**Enables:** Testing of all subsequent features (provides data)

### Pre-Chunk Checklist

- [ ] Chunk 2 is complete (services initialize correctly)
- [ ] Git branch created: `fix/chunk-5-error-detection`
- [ ] Have a test project with known errors ready
- [ ] Understand VS Code Diagnostics API
- [ ] Review AdvancedErrorDetector and ErrorQueueManager code
- [ ] Have Error Queue UI accessible (from Chunk 3)

### Objectives

- [DONE] Verify error detection sources (diagnostics, terminal, build files)
- [DONE] Ensure `AdvancedErrorDetector` is running
- [DONE] Verify `ErrorQueueManager` receives errors
- [DONE] Test error flow: Detection → Queue → UI
- [DONE] Fix any gaps in error pipeline

### Files to Analyze

1. **`vscode-extension/src/services/AdvancedErrorDetector.ts`**
   ```typescript
   // Key methods:
   // - startDetection(): Promise<void>
   // - stopDetection(): void
   // - detectFromDiagnostics(): void
   // - detectFromTerminal(): void
   // - detectFromBuildFiles(): void
   
   // Check:
   // - Are all detection sources active?
   // - Do listeners actually fire?
   // - Are errors properly parsed?
   // - Are errors sent to ErrorQueueManager?
   ```

2. **`vscode-extension/src/services/ErrorQueueManager.ts`**
   ```typescript
   // Key methods:
   // - addError(error: ErrorInfo): void
   // - removeError(errorId: string): void
   // - updateErrorStatus(errorId: string, status: string): void
   // - getAllErrors(): ErrorInfo[]
   // - getErrorsByStatus(status: string): ErrorInfo[]
   
   // Check:
   // - Singleton pattern correct?
   // - Event emitters working?
   // - State persisted to VS Code storage?
   // - UI notified on changes?
   ```

3. **Integration in `extension.ts`**
   ```typescript
   // Check initialization:
   errorQueueManager = ErrorQueueManager.getInstance(context);
   
   // ... later ...
   
   advancedErrorDetector = AdvancedErrorDetector.getInstance(
     context,
     errorQueueManager
   );
   await advancedErrorDetector.startDetection();
   
   // Is this actually happening?
   // Is initialization order correct?
   ```

### Error Flow Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     ERROR SOURCES                            │
├─────────────────────────────────────────────────────────────┤
│ 1. VS Code Diagnostics (vscode.languages.getDiagnostics)   │
│ 2. Terminal Output (vscode.window.onDidWriteTerminalData)  │
│ 3. Build Files (gradle logs, compiler output)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Detected errors
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              AdvancedErrorDetector                           │
├─────────────────────────────────────────────────────────────┤
│ - Parse error format                                         │
│ - Extract error details (message, file, line, stack)        │
│ - Create ErrorInfo object                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Parsed ErrorInfo
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              ErrorQueueManager                               │
├─────────────────────────────────────────────────────────────┤
│ - Add to queue with unique ID                                │
│ - Deduplicate similar errors                                 │
│ - Set initial status (pending)                               │
│ - Persist to VS Code storage                                 │
│ - Emit 'errorQueueChange' event                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Event notification
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              RCAWebviewProvider                              │
├─────────────────────────────────────────────────────────────┤
│ - Listen to 'errorQueueChange' event                         │
│ - Fetch updated error queue                                  │
│ - Send to webview: { command: 'errorQueueData', errors }     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Message passing
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              Webview (React UI)                              │
├─────────────────────────────────────────────────────────────┤
│ - useErrorQueue hook receives message                        │
│ - Update local state                                         │
│ - Re-render Error Queue view                                 │
└─────────────────────────────────────────────────────────────┘
```

### Issues to Investigate

1. **Detection Not Starting**
   ```typescript
   // In extension.ts activate():
   // Is this code actually reached?
   if (errorQueueManager) {
     advancedErrorDetector = AdvancedErrorDetector.getInstance(
       context,
       errorQueueManager
     );
     await advancedErrorDetector.startDetection();
     log('info', 'Advanced error detection started');
   }
   
   // Add logging to verify
   // Check if errorQueueManager is undefined
   // Check if startDetection() completes
   ```

2. **Diagnostics Not Captured**
   ```typescript
   // In AdvancedErrorDetector.ts
   detectFromDiagnostics() {
     const diagnostics = vscode.languages.getDiagnostics();
     // Are diagnostics actually returned?
     console.log('[ErrorDetector] Found diagnostics:', diagnostics.length);
     
     for (const [uri, diags] of diagnostics) {
       // Are errors being parsed correctly?
       for (const diag of diags) {
         if (diag.severity === vscode.DiagnosticSeverity.Error) {
           // Is ErrorParser working?
           const errorInfo = this.parseErrorFromDiagnostic(diag, uri);
           this.errorQueueManager.addError(errorInfo);
         }
       }
     }
   }
   ```

3. **Event Listeners Not Firing**
   ```typescript
   // In RCAWebviewProvider.ts
   constructor() {
     // ...
     this.errorQueueManager.onErrorQueueChange(() => {
       console.log('[Webview] Error queue changed!');
       this._handleErrorQueueChanged();
     });
   }
   
   // Is this listener ever called?
   // Is event emitter implemented correctly in ErrorQueueManager?
   ```

### Testing Script

```typescript
// Manual test in extension.ts or debug console:

// 1. Check if services exist
console.log('ErrorQueueManager:', errorQueueManager);
console.log('AdvancedErrorDetector:', advancedErrorDetector);

// 2. Manually add an error
if (errorQueueManager) {
  errorQueueManager.addError({
    id: 'test-error-1',
    message: 'Test error',
    file: 'test.kt',
    line: 10,
    severity: 'error',
    status: 'pending'
  });
  console.log('Error count:', errorQueueManager.getErrorCount());
}

// 3. Force detection
if (advancedErrorDetector) {
  await advancedErrorDetector.detectFromDiagnostics();
  console.log('Detection complete');
}

// 4. Check if webview receives update
// Look in webview console for message
```

### Validation Criteria

- [DONE] AdvancedErrorDetector starts successfully
- [DONE] Diagnostic errors are detected
- [DONE] Errors added to queue
- [DONE] Queue change events fire
- [DONE] Webview receives error queue data
- [DONE] UI displays errors

### Post-Chunk Verification

**1. Service Initialization Check:**
```typescript
// In extension.ts after activation:
console.log('ErrorQueueManager:', errorQueueManager);
console.log('AdvancedErrorDetector:', advancedErrorDetector);
// Both should be defined objects
```

**2. Manual Error Detection Test:**
```typescript
// Create a file with obvious error in test workspace:
// test.ts: const x: string = 123; // Type error

// In Debug Console:
await advancedErrorDetector.detectFromDiagnostics();
const count = errorQueueManager.getErrorCount();
console.log('Errors detected:', count);
// Expected: count > 0
```

**3. Error Queue Flow Test:**
```typescript
// Add error manually:
errorQueueManager.addError({
  id: 'test-error-1',
  message: 'Test error',
  severity: 'error',
  source: 'test',
  filePath: '/test.ts',
  line: 1,
  timestamp: Date.now(),
  status: 'pending'
});

// Check queue:
const errors = errorQueueManager.getAllErrors();
console.log('Queue size:', errors.length);
// Expected: 1
```

**4. Event Propagation Test:**
```typescript
// Listen for queue change:
errorQueueManager.onErrorQueueChange(() => {
  console.log('Queue changed!');
});

// Add error:
errorQueueManager.addError(/* ... */);
// Expected: Console log "Queue changed!"
```

**5. UI Update Test:**
```javascript
// In webview DevTools console:
// Listen for messages:
window.addEventListener('message', (event) => {
  if (event.data.command === 'errorQueueData') {
    console.log('Received errors:', event.data.errors.length);
  }
});

// Trigger refresh:
vscode.postMessage({ command: 'refreshErrorQueue' });
// Expected: Receive errorQueueData message
```

**6. Diagnostic Listener Test:**
```typescript
// Create a new .ts file with error
// Save file
// Wait 1-2 seconds
// Check error queue
const errors = errorQueueManager.getAllErrors();
console.log('Auto-detected errors:', errors.length);
// Expected: New error in queue
```

**7. Performance Test:**
```typescript
// Measure detection time:
const start = Date.now();
await advancedErrorDetector.detectFromDiagnostics();
const duration = Date.now() - start;
console.log('Detection took:', duration, 'ms');
// Expected: < 500ms for 100 errors
```

**8. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-5): Error detection pipeline fully operational"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-5-error-detection
git tag chunk-5-complete -m "Chunk 5: Error Detection - Complete"
```

**9. Checklist:**
- [ ] AdvancedErrorDetector initializes correctly
- [ ] Diagnostics detected (tested with real error)
- [ ] Errors added to ErrorQueueManager
- [ ] Queue change events fire correctly
- [ ] Webview receives updated error data
- [ ] UI displays detected errors
- [ ] Detection completes in < 500ms
- [ ] All fixes committed and tagged

**Critical:** This enables testing for all remaining chunks. Must work perfectly.

---

## [BOT] Chunk 6: Agent System & Analysis Flow

**Priority:** HIGH | **Phase:** Core Features | **Est. Time:** 3-4 hours  
**Depends On:** Chunks 1, 4, 5 (Backend Services, Frontend Services, Error Detection)  
**Enables:** Actual analysis functionality - core feature

### Pre-Chunk Checklist

- [ ] Chunks 1, 4, and 5 are complete and verified
- [ ] Git branch created: `fix/chunk-6-agent-system`
- [ ] Ollama is running: `ollama list` shows available models
- [ ] Have at least one real error in queue (from Chunk 5)
- [ ] Review agent architecture: MinimalReactAgent, MultiPassAgent
- [ ] Understand ReAct loop: Think → Act → Observe
- [ ] Have PromptEngine and DocumentSynthesizer docs ready

### Objectives

- [DONE] Verify agent initialization
- [DONE] Test agent analysis flow end-to-end
- [DONE] Verify tool orchestration
- [DONE] Check streaming/progress updates
- [DONE] Validate result format
- [DONE] Test error handling in agent
- [DONE] Integrate EducationalAgent (if educational mode enabled)

### Files to Analyze

1. **`src/agent/MinimalReactAgent.ts`** (Core ReAct agent)
2. **`src/agent/MultiPassAgent.ts`** (Multi-pass workflow)
3. **`src/agent/ToolOrchestrator.ts`** (Tool selection & execution)
4. **`src/agent/PromptEngine.ts`** (Prompt generation)
5. **`src/agent/DocumentSynthesizer.ts`** (Final RCA document)
6. **`src/agent/FixGenerator.ts`** (Code fix generation)
7. **Integration in `AnalysisService.ts`**

### Analysis Flow

```
User clicks "Analyze" in UI
  ↓
Webview sends: { command: 'analyzeError', error: ErrorInfo }
  ↓
RCAWebviewProvider._handleAnalyzeError(error)
  ↓
AnalysisService.analyze(error)
  ↓
Create MultiPassAgent (or MinimalReactAgent)
  ↓
agent.analyze(prompt, tools)
  ↓
[Agent Loop]
  - Think (generate hypothesis)
  - Act (select tool, execute)
  - Observe (process tool result)
  - Update progress
  - Emit state stream
  - Repeat until done
  ↓
DocumentSynthesizer.synthesize(agentResult)
  ↓
Return RCAResult
  ↓
RCAWebviewProvider sends: { command: 'analysisComplete', result }
  ↓
Webview displays result
```

### Critical Checks

1. **Agent Initialization**
   ```typescript
   // In AnalysisService.ts
   
   // How is agent created?
   const ollamaClient = new OllamaClient(config.ollamaUrl);
   const agent = new MultiPassAgent(ollamaClient, tools);
   
   // Check:
   // - OllamaClient constructor correct?
   // - Tools array properly initialized?
   // - Agent configured correctly?
   ```

2. **Tool System**
   ```typescript
   // In ToolOrchestrator.ts or agent initialization
   
   // Are all tools registered?
   const tools = [
     new FileResolverTool(),
     new VersionLookupTool(),
     new FixGeneratorTool(),
     // ... etc
   ];
   
   // Check:
   // - All 15+ tools imported correctly?
   // - Tool interfaces match agent expectations?
   // - Tool execution working?
   ```

3. **Streaming Progress**
   ```typescript
   // In AnalysisService.ts
   
   // Does service listen to agent stream?
   agent.on('iteration', (data) => {
     // Send progress to UI
     this.sendProgressUpdate(data);
   });
   
   agent.on('complete', (result) => {
     // Send final result
     this.sendComplete(result);
   });
   
   // Check:
   // - Event emitters working?
   // - Progress updates sent to UI?
   // - Final result sent?
   ```

### Testing the Agent

```typescript
// Minimal test script
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';

async function testAgent() {
  const client = new OllamaClient('http://localhost:11434');
  const agent = new MinimalReactAgent(client);
  
  const result = await agent.analyze(
    'Analyze this error: NullPointerException at line 42 in MainActivity.kt',
    []
  );
  
  console.log('Result:', result);
  return result;
}

testAgent().catch(console.error);
```

### Validation Criteria

- [DONE] Agent initializes without errors
- [DONE] Agent can execute analysis
- [DONE] Tool orchestration works
- [DONE] Progress updates stream correctly
- [DONE] Final result has correct format
- [DONE] Error handling robust
- [DONE] Educational mode functional (if enabled)

### Post-Chunk Verification

**1. Agent Initialization Test:**
```typescript
import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';

const client = new OllamaClient('http://localhost:11434');
const agent = new MinimalReactAgent({ llmClient: client });
console.log('Agent created:', agent);
// Expected: No errors
```

**2. Simple Analysis Test:**
```typescript
// Use error from queue:
const error = errorQueueManager.getAllErrors()[0];
const result = await analysisService.analyze(error);
console.log('Analysis result:', result);
// Expected: RCAResult with rootCause, explanation, fixes
```

**3. Tool Orchestration Verification:**
```typescript
// Check that agent uses tools:
// Enable debug logging in ToolOrchestrator
// Run analysis
// Check console for tool execution logs:
// "Executing tool: FileResolverTool"
// "Tool result: ..."
// Expected: At least 2-3 tools used per analysis
```

**4. Progress Streaming Test:**
```typescript
// In AnalysisService.analyze():
analysisService.onProgress((update) => {
  console.log('Progress:', update.stage, update.message);
});

await analysisService.analyze(error);
// Expected: Multiple progress updates logged
// Stages: "Initializing", "Analyzing", "Generating fixes", "Complete"
```

**5. Result Format Validation:**
```typescript
const result = await analysisService.analyze(error);

// Verify structure:
assert(result.rootCause, 'Missing rootCause');
assert(result.explanation, 'Missing explanation');
assert(Array.isArray(result.fixes), 'Fixes not an array');
assert(result.confidence >= 0 && result.confidence <= 1, 'Invalid confidence');
console.log('Result format valid');
```

**6. Error Handling Test:**
```typescript
// Test with invalid input:
try {
  await analysisService.analyze(null);
} catch (error) {
  console.log('Handled null error correctly');
}

// Test with Ollama down:
// Stop Ollama: killall ollama
try {
  await analysisService.analyze(error);
} catch (error) {
  console.log('Handled Ollama unavailable:', error.message);
  // Expected: Graceful error, not crash
}
```

**7. End-to-End UI Test:**
```
1. Open Error Queue in webview
2. Click "Analyze" on an error
3. Observe:
   - Spinner/loading indicator appears
   - Progress messages update
   - After ~10-30s, result appears
   - Result shows root cause, explanation, fixes
4. No console errors
```

**8. Educational Mode Test (if applicable):**
```typescript
// Enable educational mode in settings
// Run analysis
const result = await analysisService.analyze(error);

// Verify enhanced explanations:
assert(result.educationalNotes, 'Missing educational notes');
assert(result.explanation.length > 200, 'Explanation not detailed enough');
console.log('Educational mode working');
```

**9. Performance Benchmark:**
```typescript
const start = Date.now();
const result = await analysisService.analyze(error);
const duration = Date.now() - start;
console.log('Analysis took:', duration, 'ms');
// Expected: < 30 seconds for typical error
// If > 30s, check for:
// - Ollama model not loaded
// - Network issues
// - Infinite tool loops
```

**10. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-6): Agent system fully functional with analysis flow"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-6-agent-system
git tag chunk-6-complete -m "Chunk 6: Agent System - Complete"
```

**11. Checklist:**
- [ ] Agent initializes without errors
- [ ] Analysis completes end-to-end
- [ ] Tools are executed during analysis
- [ ] Progress updates stream to UI
- [ ] Result format is correct (RCAResult)
- [ ] Error handling robust (null inputs, Ollama down)
- [ ] Educational mode works (if enabled)
- [ ] Analysis completes in < 30 seconds
- [ ] UI displays result correctly
- [ ] All fixes committed and tagged

**Critical:** This is the core feature. Everything depends on this working.

---

## [FIX] Chunk 7: Tools System

**Priority:** MEDIUM | **Phase:** Core Features | **Est. Time:** 4-5 hours  
**Depends On:** Chunk 6 (Agent System)  
**Enhances:** Agent capabilities with specialized tools

### Pre-Chunk Checklist

- [ ] Chunk 6 is complete (agent can run basic analysis)
- [ ] Git branch created: `fix/chunk-7-tools-system`
- [ ] Review tool inventory (15+ tools listed below)
- [ ] Have sample Android project for testing tools
- [ ] Understand tool interface: name, description, parameters, execute()
- [ ] Review ToolOrchestrator code
- [ ] Have tools documentation open (docs/api/Tools.md)

### Objectives

- [DONE] Verify all 15+ tools are implemented
- [DONE] Test each tool in isolation
- [DONE] Ensure tools integrate with agent
- [DONE] Check tool parameters and return types
- [DONE] Validate tool documentation/descriptions
- [DONE] Ensure ToolOrchestrator selects tools correctly

### Tool Inventory

From `docs/api/Tools.md`:

1. **FileResolverTool** - Resolve file paths
2. **VersionLookupTool** - Check version info
3. **FixGeneratorTool** - Generate code fixes
4. **GradleAnalyzerTool** - Analyze Gradle configs
5. **DependencyResolverTool** - Resolve dependencies
6. **StackTraceAnalyzerTool** - Parse stack traces
7. **LogcatParserTool** - Parse Android logs
8. **ManifestAnalyzerTool** - Analyze AndroidManifest.xml
9. **ProGuardAnalyzerTool** - Analyze ProGuard rules
10. **NetworkAnalyzerTool** - Check network issues
11. **PermissionCheckerTool** - Check permissions
12. **ResourceAnalyzerTool** - Analyze resources
13. **BuildCacheAnalyzerTool** - Check build cache
14. **CompatibilityCheckerTool** - API compatibility
15. **PerformanceAnalyzerTool** - Performance issues

### Analysis Process

For each tool:

1. **Verify Implementation**
   ```typescript
   // File: src/tools/[ToolName].ts
   
   // Check:
   // - Class exists
   // - Implements correct interface
   // - Has execute() method
   // - Parameters typed correctly
   // - Return type correct
   // - Error handling present
   ```

2. **Test Execution**
   ```typescript
   // Minimal test for each tool
   import { FileResolverTool } from '../src/tools/FileResolverTool';
   
   const tool = new FileResolverTool();
   const result = await tool.execute({
     fileName: 'MainActivity.kt',
     workspace: '/path/to/workspace'
   });
   
   console.log('Tool result:', result);
   // Verify result shape matches expectations
   ```

3. **Check Integration**
   ```typescript
   // In ToolOrchestrator.ts or agent init
   
   // Are all tools registered?
   const allTools = this.getAvailableTools();
   console.log('Tools available:', allTools.map(t => t.name));
   
   // Expected: All 15 tools listed
   ```

### Common Tool Issues

1. **Tool Not Registered**
   ```typescript
   // PROBLEM: Tool implemented but not added to registry
   
   // FIX: In ToolOrchestrator.ts or agent init
   import { NewTool } from '../tools/NewTool';
   
   this.tools.push(new NewTool());
   ```

2. **Parameter Mismatch**
   ```typescript
   // PROBLEM: Agent passes different parameters than tool expects
   
   // Agent calls:
   await tool.execute({ file: 'MainActivity.kt' });
   
   // But tool expects:
   async execute(params: { filePath: string }) { ... }
   
   // FIX: Standardize parameter names
   ```

3. **Return Type Mismatch**
   ```typescript
   // PROBLEM: Tool returns string, agent expects object
   
   // BAD:
   async execute(params) {
     return 'File found at /path/to/file';
   }
   
   // GOOD:
   async execute(params) {
     return {
       success: true,
       filePath: '/path/to/file',
       content: '...'
     };
   }
   ```

### Validation Criteria

- [DONE] All 15 tools implemented
- [DONE] Each tool has unit test
- [DONE] All tools registered in orchestrator
- [DONE] Tool parameters standardized
- [DONE] Tool return types consistent
- [DONE] Error handling in all tools

### Post-Chunk Verification

**1. Tool Inventory Check:**
```typescript
import { ToolOrchestrator } from '../src/agent/ToolOrchestrator';

const orchestrator = new ToolOrchestrator();
const tools = orchestrator.getAllTools();

console.log('Registered tools:', tools.length);
tools.forEach(tool => console.log(`- ${tool.name}`));
// Expected: 15 tools listed
```

**2. Individual Tool Tests:**
```bash
# Run tool-specific tests:
npm test -- tests/unit/tools/
# Expected: All tool tests pass

# Verify coverage:
npm run test:coverage -- tests/unit/tools/
# Expected: > 80% coverage for each tool
```

**3. Tool Execution Test (Each Tool):**
```typescript
// Example for FileResolverTool:
import { FileResolverTool } from '../src/tools/FileResolverTool';

const tool = new FileResolverTool();
const result = await tool.execute({
  fileName: 'MainActivity.kt',
  workspacePath: '/path/to/project'
});

console.log('FileResolverTool result:', result);
// Expected: File path or "File not found"

// Repeat for all 15 tools
```

**4. Tool Integration with Agent:**
```typescript
// Run analysis with tool usage logging:
const error = /* error requiring multiple tools */;
const result = await analysisService.analyze(error);

// Check agent used appropriate tools:
// For Gradle error, expect: GradleAnalyzerTool, DependencyResolverTool
// For manifest error, expect: ManifestAnalyzerTool, PermissionCheckerTool
// For crash, expect: StackTraceAnalyzerTool, LogcatParserTool
```

**5. Tool Selection Logic Test:**
```typescript
// Test ToolOrchestrator selects correct tools:
const orchestrator = new ToolOrchestrator();

// For different error types:
const gradleTools = orchestrator.selectTools('Gradle build failed');
console.log('Gradle tools:', gradleTools.map(t => t.name));
// Expected: GradleAnalyzerTool, DependencyResolverTool

const crashTools = orchestrator.selectTools('App crashed with NPE');
console.log('Crash tools:', crashTools.map(t => t.name));
// Expected: StackTraceAnalyzerTool, LogcatParserTool
```

**6. Tool Error Handling:**
```typescript
// Test tool with invalid input:
const tool = new FileResolverTool();
try {
  await tool.execute({ fileName: null });
} catch (error) {
  console.log('Handled null input correctly');
}

// Test tool with missing file:
const result = await tool.execute({
  fileName: 'NonExistent.kt',
  workspacePath: '/path'
});
console.log('Missing file handled:', result.includes('not found'));
// Expected: Graceful error, not crash
```

**7. Tool Performance Test:**
```typescript
// Measure tool execution time:
for (const toolName of ['FileResolverTool', 'GradleAnalyzerTool', /* etc */]) {
  const tool = /* get tool instance */;
  const start = Date.now();
  await tool.execute(/* valid params */);
  const duration = Date.now() - start;
  console.log(`${toolName}: ${duration}ms`);
  // Expected: < 5 seconds per tool
}
```

**8. Tool Documentation Verification:**
```typescript
// Check each tool has proper metadata:
tools.forEach(tool => {
  assert(tool.name, 'Missing tool name');
  assert(tool.description, 'Missing tool description');
  assert(tool.parameters, 'Missing tool parameters');
  console.log(`${tool.name}: ✓`);
});
```

**9. End-to-End Tool Usage Test:**
```
1. Create error requiring specific tool:
   - Gradle dependency conflict
   - Manifest permission issue
   - ProGuard obfuscation problem
2. Run analysis
3. Verify in logs:
   - Correct tool was selected
   - Tool executed successfully
   - Tool result used in analysis
4. Verify in RCA result:
   - Tool findings incorporated
   - Fixes based on tool analysis
```

**10. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-7): All 15 tools implemented, tested, and integrated"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-7-tools-system
git tag chunk-7-complete -m "Chunk 7: Tools System - Complete"
```

**11. Checklist:**
- [ ] All 15 tools implemented
- [ ] Each tool has unit test passing
- [ ] All tools registered in orchestrator
- [ ] Tool selection logic correct
- [ ] Tools integrate with agent
- [ ] Error handling robust in all tools
- [ ] Tool execution time < 5s each
- [ ] Tool documentation complete
- [ ] End-to-end tool usage verified
- [ ] All fixes committed and tagged

**Note:** This chunk takes longer due to 15+ tools. Budget 4-5 hours.

---

## [WEB] Chunk 8: Cross-Cutting Concerns

**Priority:** MEDIUM | **Phase:** Polish & Optimization | **Est. Time:** 2-3 hours  
**Depends On:** All previous chunks (1-7)  
**Improves:** Quality, performance, user experience

### Pre-Chunk Checklist

- [ ] Chunks 1-7 are complete and verified
- [ ] Git branch created: `fix/chunk-8-cross-cutting`
- [ ] Core functionality working end-to-end
- [ ] Review logging patterns across codebase
- [ ] Review configuration settings in package.json
- [ ] Understand caching strategy (ErrorHasher)
- [ ] Have performance profiling tools ready

### Objectives

- [DONE] Verify logging/telemetry
- [DONE] Test error handling patterns
- [DONE] Check configuration management
- [DONE] Verify caching/performance optimizations
- [DONE] Test educational mode integration (elevate from "nice-to-have")
- [DONE] Review security considerations
- [DONE] Optimize memory usage
- [DONE] Ensure graceful degradation

### Files to Analyze

1. **Logging**
   - `src/utils/Logger.ts`
   - Check: Consistent usage across codebase

2. **Error Handling**
   - `src/utils/ErrorHandler.ts`
   - Check: All errors properly caught and reported

3. **Configuration**
   - `vscode-extension/package.json` (contribution points)
   - `vscode-extension/src/config/` (if exists)
   - Check: Settings propagate correctly

4. **Caching**
   - `src/cache/ErrorHasher.ts`
   - `src/cache/CacheManager.ts`
   - Check: Cache hit rate, invalidation logic

5. **Educational Mode**
   - `src/agent/EducationalAgent.ts`
   - Check: Integration with main agent, UI display

### Configuration Flow

```
User changes setting in VS Code
  ↓
VS Code emits onDidChangeConfiguration event
  ↓
extension.ts listener catches event
  ↓
Read new config: vscode.workspace.getConfiguration('rcaAgent')
  ↓
Update backend services with new config
  ↓
Notify webview: { command: 'configChanged', key, value }
  ↓
Webview updates UI
```

### Validation Criteria

- [DONE] Logging consistent and useful
- [DONE] Errors handled gracefully
- [DONE] Configuration changes apply immediately
- [DONE] Caching improves performance
- [DONE] Educational mode works
- [DONE] No security vulnerabilities
- [DONE] Memory usage acceptable
- [DONE] Performance meets baselines

### Post-Chunk Verification

**1. Logging Audit:**
```bash
# Search for inconsistent logging:
grep -r "console.log" vscode-extension/src/ | wc -l
grep -r "Logger." vscode-extension/src/ | wc -l
# Expected: Minimal console.log, most use Logger

# Check log levels:
grep -r "Logger.error" vscode-extension/src/ | head
grep -r "Logger.info" vscode-extension/src/ | head
grep -r "Logger.debug" vscode-extension/src/ | head
# Expected: Appropriate log levels used
```

**2. Configuration Management Test:**
```typescript
// Change setting in VS Code:
// File > Preferences > Settings > RCA Agent
// Change "ollama.model" to "llama2"

// Verify change propagates:
const config = vscode.workspace.getConfiguration('rcaAgent');
console.log('Model:', config.get('ollama.model'));
// Expected: "llama2"

// Verify service updates:
console.log('OllamaClient model:', ollamaClient.currentModel);
// Expected: "llama2"
```

**3. Caching Performance Test:**
```typescript
import { ErrorHasher } from '../src/cache/ErrorHasher';

// First analysis (cache miss):
const start1 = Date.now();
const result1 = await analysisService.analyze(error);
const time1 = Date.now() - start1;

// Second analysis of same error (cache hit):
const start2 = Date.now();
const result2 = await analysisService.analyze(error);
const time2 = Date.now() - start2;

console.log('First:', time1, 'ms, Second:', time2, 'ms');
// Expected: time2 < time1 / 10 (cache is 10x faster)
```

**4. Error Handling Audit:**
```bash
# Find try-catch blocks without proper handling:
grep -A 5 "catch (" vscode-extension/src/ | grep -c "console.error"
# Expected: All catches log or handle errors

# Find Promise rejections without .catch():
grep "async " vscode-extension/src/ -A 10 | grep "await" | grep -v ".catch"
# Review: Ensure critical awaits have error handling
```

**5. Educational Mode Integration Test:**
```typescript
// Enable educational mode:
vscode.workspace.getConfiguration('rcaAgent').update(
  'educationalMode',
  true,
  vscode.ConfigurationTarget.Global
);

// Run analysis:
const result = await analysisService.analyze(error);

// Verify enhanced output:
assert(result.educationalNotes, 'Missing educational notes');
assert(result.explanation.length > 200, 'Not detailed enough');
assert(result.learningResources, 'Missing learning resources');
console.log('Educational mode fully functional');
```

**6. Memory Usage Test:**
```typescript
// Monitor memory before and after operations:
const before = process.memoryUsage();

// Perform 10 analyses:
for (let i = 0; i < 10; i++) {
  await analysisService.analyze(error);
}

const after = process.memoryUsage();
const delta = after.heapUsed - before.heapUsed;
console.log('Memory delta:', (delta / 1024 / 1024).toFixed(2), 'MB');
// Expected: < 50MB increase
// If > 50MB, check for memory leaks
```

**7. Security Audit:**
```bash
# Check for hardcoded secrets:
grep -r "password" vscode-extension/src/ src/
grep -r "api_key" vscode-extension/src/ src/
grep -r "token" vscode-extension/src/ src/
# Expected: No hardcoded credentials

# Check for unsafe operations:
grep -r "eval(" vscode-extension/src/ src/
grep -r "Function(" vscode-extension/src/ src/
# Expected: No eval() or Function() constructor

# Check for command injection risks:
grep -r "exec(" vscode-extension/src/ src/
grep -r "spawn(" vscode-extension/src/ src/
# Review: Ensure inputs are sanitized
```

**8. Performance Baseline Verification:**
```typescript
// Run performance suite:
const metrics = {
  activation: 0,
  errorDetection: 0,
  analysisCompletion: 0,
  uiUpdate: 0
};

// Measure each:
const start = Date.now();
// ... activate extension
metrics.activation = Date.now() - start;

// Assert baselines:
assert(metrics.activation < 3000, 'Activation too slow');
assert(metrics.errorDetection < 500, 'Detection too slow');
assert(metrics.analysisCompletion < 30000, 'Analysis too slow');
assert(metrics.uiUpdate < 100, 'UI update too slow');

console.log('All performance baselines met');
```

**9. Graceful Degradation Test:**
```typescript
// Test with Ollama unavailable:
// Stop Ollama: killall ollama

// Attempt analysis:
try {
  await analysisService.analyze(error);
} catch (error) {
  // Expected: User-friendly error message
  // NOT: Stack trace or "Connection refused"
  assert(error.message.includes('Ollama'), 'Error not user-friendly');
}

// Test with ChromaDB unavailable:
// Similar test

// Expected: Extension still usable, just degraded features
```

**10. Final Integration Test:**
```
1. Fresh VS Code instance
2. Install extension from .vsix
3. Open test project with errors
4. Run through all features:
   - Error detection works
   - Analysis completes
   - Fixes can be applied
   - History is recorded
   - Metrics are displayed
   - Settings changes apply
   - Educational mode enhances output
5. No errors in any console
6. Performance acceptable
7. Memory usage stable
```

**11. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-8): Cross-cutting concerns polished and optimized"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-8-cross-cutting
git tag chunk-8-complete -m "Chunk 8: Cross-Cutting Concerns - Complete"
git tag backend-polish-complete -m "Backend Polish Complete - All Chunks Done"
```

**12. Final Checklist:**
- [ ] Logging consistent (using Logger, not console)
- [ ] All errors handled gracefully
- [ ] Configuration changes apply immediately
- [ ] Caching provides measurable speedup
- [ ] Educational mode fully integrated
- [ ] No security vulnerabilities found
- [ ] Memory usage < 200MB overhead
- [ ] All performance baselines met
- [ ] Graceful degradation when services unavailable
- [ ] Full integration test passes
- [ ] All fixes committed and tagged
- [ ] Backend polish COMPLETE [DONE]

---

## [DONE] Verification & Testing

### Test Levels

1. **Unit Tests**
   - Test each function in isolation
   - Mock dependencies
   - Fast, comprehensive coverage

2. **Integration Tests**
   - Test service interactions
   - Test message passing
   - Test agent + tools

3. **End-to-End Tests**
   - Test full user workflows
   - From error detection to fix application
   - In real VS Code environment

### Test Scenarios

#### Scenario 1: Error Detection to Analysis

```gherkin
Given a Kotlin file with a compilation error
When the error is detected by AdvancedErrorDetector
Then the error appears in the Error Queue
When I click "Analyze" on the error
Then the agent analyzes the error
And I see progress updates in real-time
And I receive an RCA result with root cause
And I see suggested fixes
```

#### Scenario 2: Fix Application

```gherkin
Given an analyzed error with suggested fixes
When I click "Preview" on a fix
Then I see a diff preview
When I click "Apply Fix"
Then the code change is applied
And the error is resolved
And the fix appears in history
```

#### Scenario 3: Educational Mode

```gherkin
Given Educational Mode is enabled
When I analyze an error
Then the result includes learning notes
And explanations are more detailed
And I see "Why" and "How" sections
```

### Testing Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/unit/agent.test.ts

# Run integration tests
npm test -- tests/integration/

# Run extension tests
npm test -- vscode-extension/src/test/

# Check coverage
npm run test:coverage
```

### Manual Testing Checklist

- [ ] Extension activates without errors
- [ ] Error detection finds errors in workspace
- [ ] Error queue displays detected errors
- [ ] Analysis starts when clicking "Analyze"
- [ ] Progress updates appear during analysis
- [ ] Analysis completes with RCA result
- [ ] Fixes are displayed
- [ ] Fix preview shows diff
- [ ] Apply fix modifies code correctly
- [ ] History records analysis
- [ ] Metrics update correctly
- [ ] Educational mode provides detailed explanations
- [ ] Settings changes apply immediately
- [ ] No console errors or warnings

---

## [CHART] Progress Tracker

### Overall Status

| Chunk | Name                  | Status        | Completion % | Blockers               |
| ----- | --------------------- | ------------- | ------------ | ---------------------- |
| 1     | Core Backend Services | [RED] Not Started | 0%           | -                      |
| 2     | Extension Entry Point | [RED] Not Started | 0%           | -                      |
| 3     | Message Passing Layer | [RED] Not Started | 0%           | -                      |
| 4     | Frontend Services     | [RED] Not Started | 0%           | Depends on Chunk 1     |
| 5     | Error Detection       | [RED] Not Started | 0%           | Depends on Chunk 2     |
| 6     | Agent System          | [RED] Not Started | 0%           | Depends on Chunks 1, 4 |
| 7     | Tools System          | [RED] Not Started | 0%           | Depends on Chunk 6     |
| 8     | Cross-Cutting         | [RED] Not Started | 0%           | -                      |

**Legend:**
- [RED] Not Started
- [YELLOW] In Progress
- [GREEN] Complete
- 🔵 Blocked
- [WARNING] Issues Found

### Session Log Template

Create a new file for each session: `Backend-Polish-Session-[N]-[YYYY-MM-DD].md`

```markdown
# Session [N]: [Chunk Name]

**Date:** [Date]
**Duration:** [Start] - [End] ([Duration])
**Focus:** Chunk [N] - [Name]
**Status:** [YELLOW] In Progress

## Objectives

- [ ] Objective 1
- [ ] Objective 2

## Work Done

### Files Modified

1. `path/to/file.ts`
   - Change 1
   - Change 2

### Issues Fixed

1. **Issue Title**
   - **Severity:** Critical
   - **Description:** ...
   - **Fix:** ...
   - **Verified:** [DONE] Yes / [FAIL] No

### Issues Found

1. **Issue Title**
   - **Severity:** High
   - **Description:** ...
   - **Next Steps:** ...

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual test: [Describe test]

## Blockers

- None / [Description]

## Next Session

- Continue with Chunk [N] / Move to Chunk [N+1]
- Focus on: [Specific area]

## Notes

- [Any additional notes, insights, or questions]
```

---

## [TARGET] Recommended Session Sequence

### Week 1: Foundation

**Session 1:** Chunk 1 - Core Backend Services (2 hours)
- Document all backend APIs
- Fix constructor signatures
- Create compatibility layer if needed
- **Deliverable:** Backend API reference document

**Session 2:** Chunk 2 - Extension Entry Point (2 hours)
- Fix initialization order
- Resolve API mismatches
- Test extension activation
- **Deliverable:** Extension activates successfully

**Session 3:** Chunk 8 (Partial) - Configuration (1.5 hours)
- Verify settings schema
- Test configuration reading
- **Deliverable:** Settings load correctly

### Week 2: Integration

**Session 4:** Chunk 4 - Frontend Services (2 hours)
- Fix AnalysisService backend integration
- Fix FixApplicationService integration
- Test service methods
- **Deliverable:** Services work in isolation

**Session 5:** Chunk 3 - Message Passing (2.5 hours)
- Create message contract matrix
- Implement missing handlers
- Fix response data shapes
- **Deliverable:** Message flow works end-to-end

**Session 6:** Chunk 5 - Error Detection (2 hours)
- Fix error detection activation
- Test error pipeline
- Verify UI updates
- **Deliverable:** Errors appear in queue

### Week 3: Core Features

**Session 7:** Chunk 6 - Agent System (2 hours)
- Test agent initialization
- Test analysis flow
- Fix streaming issues
- **Deliverable:** Analysis works end-to-end

**Session 8:** Chunk 7 - Tools System (2 hours)
- Verify all tools
- Test tool execution
- Fix tool integration
- **Deliverable:** All tools working

**Session 9:** Chunk 8 (Complete) - Cross-Cutting (1.5 hours)
- Test educational mode
- Verify caching
- Check error handling
- **Deliverable:** All features integrated

### Week 4: Polish & Testing

**Session 10:** End-to-End Testing (2 hours)
- Test all user workflows
- Fix edge cases
- Performance optimization
- **Deliverable:** All scenarios pass

**Session 11:** Documentation & Cleanup (1.5 hours)
- Update documentation
- Remove dead code
- Add inline comments
- **Deliverable:** Clean, documented codebase

---

## [DOCS] Reference Documentation

### Key Documents

- **Architecture:** `docs/architecture/overview.md`
- **API Reference:** `docs/api/` folder
- **Backend Wiring:** `docs/RCA_UI_WIRING_GUIDE.md`
- **Message Passing:** `docs/_archive/RCA-AGENT-OVERHUAL-01-09-2026/technical/MESSAGE_PASSING.md`
- **Integration Gaps:** `docs/_archive/RCA-AGENT-OVERHUAL-01-09-2026/technical/INTEGRATION_GAPS.md`
- **UI Removal Summary:** `docs/RCA_UI_REMOVAL_SUMMARY.md`
- **Project Structure:** `docs/PROJECT_STRUCTURE.md`

### Quick Links

- **Backend Source:** `src/`
- **Extension Source:** `vscode-extension/src/`
- **Webview Source:** `vscode-extension/webview/src/` or `project/src/`
- **Tests:** `tests/`, `vscode-extension/src/test/`

### Development Commands

```bash
# Build backend
npm run build

# Build extension
cd vscode-extension
npm run compile

# Build webview (if using separate Vite project)
cd project
npm run build

# Run tests
npm test

# Watch mode
npm run watch

# Lint
npm run lint

# Format
npm run format
```

---

## [LAUNCH] Success Criteria

### Minimum Viable (Must Have)

- [DONE] Extension activates without errors
- [DONE] Error detection finds at least diagnostic errors
- [DONE] Error queue displays errors
- [DONE] Analysis can be triggered
- [DONE] Analysis completes with result
- [DONE] Result displays in UI
- [DONE] No console errors

### Full Feature (Should Have)

- [DONE] All error detection sources work (diagnostics, terminal, build)
- [DONE] Real-time error detection
- [DONE] Streaming progress updates
- [DONE] Fix generation works
- [DONE] Fix preview works
- [DONE] Fix application works
- [DONE] History tracking works
- [DONE] Metrics display correctly
- [DONE] Educational mode works
- [DONE] Settings apply immediately

### Excellence (Nice to Have)

- [DONE] All 15 tools working
- [DONE] Multi-pass analysis
- [DONE] Adaptive learning
- [DONE] Performance optimizations (caching, etc.)
- [DONE] Comprehensive error handling
- [DONE] Detailed logging
- [DONE] 90%+ test coverage
- [DONE] No TypeScript errors
- [DONE] No lint warnings

---

## [IDEA] Tips & Best Practices

### Debugging Tips

1. **Use Console Logging Liberally**
   ```typescript
   console.log('[Component] Checkpoint:', data);
   ```

2. **Test in Isolation First**
   - Test backend services separately
   - Test extension components separately
   - Then test integration

3. **Reproduce Manually**
   - Open extension development host
   - Open a project with errors
   - Click through UI
   - Watch console output

4. **Check Multiple Sources**
   - Extension host console (for extension code)
   - Webview developer tools (for React code)
   - VS Code output panel
   - Debug console

### Common Pitfalls

1. **Assuming Singletons Are Ready**
   - Always check if service is undefined before using
   - Initialize in correct order

2. **Forgetting Async/Await**
   - Most backend calls are async
   - Always await promises

3. **Ignoring Error Handling**
   - Backend can fail (Ollama down, network issues)
   - Always wrap in try-catch

4. **Not Testing Message Flow**
   - Message passing is easy to get wrong
   - Test each command/response pair

### Development Workflow

1. **Make Small Changes**
   - One fix at a time
   - Test after each change

2. **Keep Dev Host Running**
   - Use hot reload when possible
   - Restart extension host after changes

3. **Document As You Go**
   - Update session logs
   - Add inline comments
   - Update architecture docs

4. **Commit Frequently**
   - Commit after each working fix
   - Use descriptive commit messages

---

## [CALL] Getting Help

### When Stuck

1. **Check Documentation**
   - Read relevant docs in `docs/` folder
   - Check VS Code API docs

2. **Search for Similar Code**
   - Look for similar patterns in codebase
   - Check how other services do it

3. **Simplify**
   - Remove complexity
   - Test minimal case first
   - Add features back incrementally

4. **Ask for Clarification**
   - Document the confusion
   - Prepare specific questions
   - Include code examples

### Debug Helpers

```typescript
// Add to any file for detailed logging
const DEBUG = true;
const log = (...args: any[]) => {
  if (DEBUG) console.log('[DEBUG]', ...args);
};

// Use throughout code
log('Service initialized:', this.analysisService);
log('Message received:', message);
log('Result:', result);
```

---

## [NOTE] Conclusion

This guideline provides a structured, systematic approach to debugging and fixing the RCA Agent backend. By following the chunk-based sessions and carefully analyzing each component, you'll be able to identify and resolve the issues causing the stalemate.

**Remember:**
- Work systematically, one chunk at a time
- Document everything
- Test incrementally
- Don't skip validation steps
- Ask for help when stuck

**Good luck! [LAUNCH]**

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Status:** Ready for Use
