# Chunk 5: Error Detection & Queue Management

**Priority:** HIGH | **Phase:** Communication & Data Flow | **Est. Time:** 2-3 hours  
**Depends On:** Chunk 2 (Extension Entry Point)  
**Enables:** Testing of all subsequent features (provides data)

## Pre-Chunk Checklist

- [ ] Chunk 2 is complete (services initialize correctly)
- [ ] Git branch created: `fix/chunk-5-error-detection`
- [ ] Have a test project with known errors ready
- [ ] Understand VS Code Diagnostics API
- [ ] Review AdvancedErrorDetector and ErrorQueueManager code
- [ ] Have Error Queue UI accessible (from Chunk 3)

## Objectives

- [DONE] Verify error detection sources (diagnostics, terminal, build files)
- [DONE] Ensure `AdvancedErrorDetector` is running
- [DONE] Verify `ErrorQueueManager` receives errors
- [DONE] Test error flow: Detection → Queue → UI
- [DONE] Fix any gaps in error pipeline

## Files to Analyze

1. **`vscode-extension/src/services/AdvancedErrorDetector.ts`**
   ```typescript
   // Key methods:
   // - startDetection(): Promise<void>
   // - stopDetection(): void
   // - detectFromDiagnostics(): void
   // - detectFromTerminal(): void
   // - detectFromBuildFiles(): void
   ```

2. **`vscode-extension/src/services/ErrorQueueManager.ts`**
   ```typescript
   // Key methods:
   // - addError(error: ErrorInfo): void
   // - removeError(errorId: string): void
   // - updateErrorStatus(errorId: string, status: string): void
   // - getAllErrors(): ErrorInfo[]
   // - getErrorsByStatus(status: string): ErrorInfo[]
   ```

## Error Flow Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     ERROR SOURCES                            │
├─────────────────────────────────────────────────────────────┤
│ 1. VS Code Diagnostics                                      │
│ 2. Terminal Output                                          │
│ 3. Build Files (gradle logs, compiler output)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              AdvancedErrorDetector                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              ErrorQueueManager                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              RCAWebviewProvider                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         [DOWN]
┌─────────────────────────────────────────────────────────────┐
│              Webview (React UI)                              │
└─────────────────────────────────────────────────────────────┘
```

## Validation Criteria

- [DONE] AdvancedErrorDetector starts successfully
- [DONE] Diagnostic errors are detected
- [DONE] Errors added to queue
- [DONE] Queue change events fire
- [DONE] Webview receives error queue data
- [DONE] UI displays errors

## Post-Chunk Verification

**1. Service Initialization Check:**
```typescript
console.log('ErrorQueueManager:', errorQueueManager);
console.log('AdvancedErrorDetector:', advancedErrorDetector);
// Both should be defined objects
```

**2. Manual Error Detection Test:**
```typescript
// Create a file with obvious error in test workspace
await advancedErrorDetector.detectFromDiagnostics();
const count = errorQueueManager.getErrorCount();
console.log('Errors detected:', count);
// Expected: count > 0
```

**3. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-5): Error detection pipeline fully operational"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-5-error-detection
git tag chunk-5-complete -m "Chunk 5: Error Detection - Complete"
```

## Session Log Template

```markdown
## Chunk 5: Error Detection - Session Log

**Date:** [Date]
**Duration:** [Time]
**Status:** [YELLOW] In Progress

### Objectives
- [ ] Verify error detection sources
- [ ] Ensure AdvancedErrorDetector is running
- [ ] Test error flow to UI

### Issues Found
1. **Detection Not Starting**
   - Severity: Critical
   - Description: startDetection() not called
   - Fix: Added initialization in extension.ts

### Next Session
- Proceed to Chunk 6
```
