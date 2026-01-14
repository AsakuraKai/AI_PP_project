# Chunk 3: Message Passing Layer

**Priority:** HIGH | **Phase:** Communication & Data Flow | **Est. Time:** 3-4 hours  
**Depends On:** Chunk 2 (Extension Entry Point)  
**Unblocks:** All UI functionality

## Pre-Chunk Checklist

- [ ] Chunks 1 and 2 are complete and verified
- [ ] Git branch created: `fix/chunk-3-message-passing`
- [ ] Extension activates successfully (from Chunk 2)
- [ ] Have both extension code and webview code open
- [ ] Browser DevTools ready for webview debugging
- [ ] Message contracts documented (see MESSAGE_PASSING.md)

## Objectives

- [DONE] Map all message commands (Webview → Extension)
- [DONE] Map all message responses (Extension → Webview)
- [DONE] Verify message handlers exist for all commands
- [DONE] Ensure response data matches frontend expectations
- [DONE] Fix any missing handlers
- [DONE] Test message flow end-to-end

## Files to Analyze

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

## Message Contract Analysis

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

## Commands to Verify

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

## Critical Issues to Fix

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

## Validation Criteria

- [DONE] All commands have handlers
- [DONE] All handlers return expected responses
- [DONE] Error cases handled gracefully
- [DONE] No silent failures
- [DONE] Message flow tested end-to-end

## Post-Chunk Verification

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

**3. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-3): Message passing layer complete with all handlers"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-3-message-passing
git tag chunk-3-complete -m "Chunk 3: Message Passing Layer - Complete"
```

## Session Log Template

```markdown
## Chunk 3: Message Passing Layer - Session Log

**Date:** [Date]
**Duration:** [Time]
**Status:** [RED] Not Started | [YELLOW] In Progress | [GREEN] Complete

### Objectives
- [ ] Map all message commands
- [ ] Verify all handlers exist
- [ ] Fix response data shapes

### Message Matrix
| Command | Handler | Status |
|---------|---------|--------|
| analyzeError | _handleAnalyzeError | [DONE] |
| getErrorQueue | _handleGetErrorQueue | [FAIL] |

### Issues Found
1. **Missing Handler for X**
   - Severity: High
   - Fix: Implemented handler

### Next Session
- Proceed to Chunk 4
```
