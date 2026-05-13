# Manual Testing Checklist - Phase 1

Complete this checklist before deploying to production.

## Pre-Testing Setup
- [ ] Build the VSCode extension: `npm run build` in `vscode-extension/`
- [ ] Install the extension in VSCode
- [ ] Open a test project with Kotlin/Android code
- [ ] Ensure Ollama is running with a compatible model

---

## Fix 1: Diff Algorithm Accuracy

### Test Scenario 1: Simple Code Change
- [ ] Create a file with whitespace differences (tabs vs spaces)
- [ ] Generate a fix suggestion
- [ ] Verify diff shows correct line mappings
- [ ] Verify whitespace-only changes are ignored

### Test Scenario 2: Multi-line Changes
- [ ] Create a file with multiple changes in different locations
- [ ] Generate a fix suggestion
- [ ] Verify all changes are accurately mapped
- [ ] Verify context lines (3 lines) appear around changes

**Expected**: Accurate line numbers, whitespace normalized, proper context

---

## Fix 2: Dataset Validation

### Test Scenario 1: Valid Dataset
- [ ] Run `npm run validate:dataset`
- [ ] Verify all 96 test cases pass
- [ ] Check no duplicate IDs reported

### Test Scenario 2: Corrupted Dataset (Optional)
- [ ] Temporarily corrupt a dataset file
- [ ] Run validation
- [ ] Verify clear error messages appear
- [ ] Restore original dataset

**Expected**: All datasets validate successfully, clear error reporting

---

## Fix 3: Fix Minimality

### Test Scenario 1: Small Change
- [ ] Generate a fix for a single-line error
- [ ] Verify suggestion shows only changed line + 2 lines context
- [ ] Check minimality score is calculated
- [ ] Verify no unnecessary unchanged lines included

### Test Scenario 2: Large File
- [ ] Generate a fix for error in large file (100+ lines)
- [ ] Verify suggestion doesn't include entire file
- [ ] Check only relevant section is shown

**Expected**: Minimal fixes with only necessary context

---

## Fix 4: RCA Context Injection

### Test Scenario 1: Fix with RCA
- [ ] Generate a fix that includes root cause analysis
- [ ] Check the prompt sent to LLM (enable debug logging if needed)
- [ ] Verify RCA section appears before code context
- [ ] Verify RCA includes: category, confidence, root cause, affected files

### Test Scenario 2: Fix without RCA
- [ ] Generate a fix without RCA data
- [ ] Verify system still works (backward compatible)

**Expected**: RCA properly injected when available, optional when not

---

## Fix 5: Chat History Hydration

### Test Scenario 1: Normal Reload
- [ ] Open RCA Agent Dashboard
- [ ] Generate 2-3 fix suggestions (create conversation history)
- [ ] Reload the webview (close and reopen panel)
- [ ] Verify blue banner appears: "Chat history restored (N messages)"
- [ ] Verify all previous messages are visible
- [ ] Verify banner disappears after 3 seconds

### Test Scenario 2: Empty History
- [ ] Clear workspace state (or use fresh workspace)
- [ ] Open RCA Agent Dashboard
- [ ] Verify no hydration banner appears
- [ ] Verify empty state is shown

### Test Scenario 3: Large History
- [ ] Generate 10+ messages
- [ ] Reload webview
- [ ] Verify only last 100 messages are restored
- [ ] Verify no performance issues

**Expected**: History persists across reloads, hydration indicator shows, no memory leaks

---

## Fix 6: Syntax Highlighting

### Test Scenario 1: Diff Display
- [ ] Generate a fix suggestion
- [ ] Expand the diff section
- [ ] Verify added lines have green background
- [ ] Verify removed lines have red background
- [ ] Verify + and - markers appear (not doubled)

### Test Scenario 2: Multiple Languages
- [ ] Test with Kotlin file
- [ ] Test with Java file
- [ ] Test with JavaScript/TypeScript file
- [ ] Verify styling works for all

**Expected**: Clear visual distinction between additions/removals, no double markers

---

## Fix 7: Acceptance Workflow

### Test Scenario 1: Accept Fix
- [ ] Generate a fix suggestion
- [ ] Click "Accept" button
- [ ] Verify confirmation dialog appears with:
  - File path
  - Fix description
  - Cancel and Apply buttons
- [ ] Click "Apply"
- [ ] Verify success toast appears (green, top-right)
- [ ] Verify "Applied" badge appears on fix
- [ ] Verify Accept/Reject buttons are disabled
- [ ] Open the file and verify changes were applied

### Test Scenario 2: Reject Fix
- [ ] Generate a fix suggestion
- [ ] Click "Reject" button
- [ ] Verify fix is removed from UI immediately
- [ ] Verify no error messages

### Test Scenario 3: Error Handling
- [ ] Generate a fix for non-existent file
- [ ] Click "Accept" and "Apply"
- [ ] Verify error toast appears (red, top-right)
- [ ] Verify clear error message
- [ ] Verify fix remains in UI (not marked as applied)

### Test Scenario 4: Multiple Fixes
- [ ] Generate 3 fix suggestions
- [ ] Accept first fix
- [ ] Reject second fix
- [ ] Leave third fix pending
- [ ] Verify each behaves correctly

**Expected**: Complete workflow works, clear feedback, file changes applied

---

## Integration Testing

### Test Scenario 1: Complete Workflow
- [ ] Start with fresh workspace
- [ ] Analyze an error
- [ ] Verify RCA is generated
- [ ] Verify fix suggestion appears with:
  - Accurate diff (Fix 1)
  - Minimal context (Fix 3)
  - Syntax highlighting (Fix 6)
  - Accept/Reject buttons (Fix 7)
- [ ] Accept the fix
- [ ] Verify file is updated
- [ ] Reload webview
- [ ] Verify chat history restored (Fix 5)

### Test Scenario 2: Performance
- [ ] Generate 5+ fix suggestions
- [ ] Verify no lag or performance issues
- [ ] Check bundle size is reasonable
- [ ] Verify memory usage is stable

### Test Scenario 3: Error Recovery
- [ ] Disconnect Ollama
- [ ] Try to generate fix
- [ ] Verify graceful error handling
- [ ] Reconnect Ollama
- [ ] Verify system recovers

**Expected**: All fixes work together seamlessly, no conflicts

---

## Regression Testing

### Test Scenario 1: Existing Features
- [ ] Error analysis still works
- [ ] Multiple file analysis works
- [ ] Dashboard statistics display correctly
- [ ] Ollama status indicator works

### Test Scenario 2: Edge Cases
- [ ] Empty files
- [ ] Very large files (1000+ lines)
- [ ] Binary files
- [ ] Files with special characters
- [ ] Read-only files

**Expected**: No regressions, all existing features work

---

## Sign-off

- [ ] All test scenarios completed
- [ ] No critical issues found
- [ ] Performance is acceptable
- [ ] Ready for production deployment

**Tested by**: _______________
**Date**: _______________
**Notes**: _______________

---

## Issues Found

Document any issues discovered during testing:

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
|       |          |             |        |
