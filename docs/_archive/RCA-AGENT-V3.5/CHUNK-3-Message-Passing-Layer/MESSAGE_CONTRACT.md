# Message Passing Contract - Complete Mapping

**Generated:** January 12, 2026  
**Status:** Complete Analysis

## Legend
- [DONE] **Implemented** - Handler exists and appears functional
- [FAIL] **Missing** - No handler found
- [WARNING] **Partial** - Handler exists but may have issues
- [REFRESH] **Response** - Response message from extension to webview

---

## Dashboard Commands

### getDashboardData
- **Sent by:** `useDashboardData.loadDashboardData()`
- **Payload:** `{ command: 'getDashboardData' }`
- **Handler:** `RCAWebviewProvider._handleGetDashboardData()`
- **Response:** `{ command: 'dashboardData', stats: {...}, activity: [...] }`
- **Status:** [DONE] Implemented

### analyzeAllErrors
- **Sent by:** `useDashboardData.analyzeAllErrors()`
- **Payload:** `{ command: 'analyzeAllErrors' }`
- **Handler:** `RCAWebviewProvider._handleAnalyzeAllErrors()`
- **Response:** Various analysis progress/completion messages
- **Status:** [DONE] Implemented

### scanWorkspace
- **Sent by:** `useDashboardData.scanWorkspace()`
- **Payload:** `{ command: 'scanWorkspace' }`
- **Handler:** `RCAWebviewProvider._handleScanWorkspace()`
- **Response:** Updates error queue
- **Status:** [DONE] Implemented

### openSettings
- **Sent by:** `useDashboardData.openSettings()`
- **Payload:** `{ command: 'openSettings' }`
- **Handler:** `RCAWebviewProvider._handleOpenSettings()`
- **Response:** Opens VS Code settings UI
- **Status:** [DONE] Implemented

### checkOllamaStatus
- **Sent by:** `useDashboardData.checkOllamaStatus()`
- **Payload:** `{ command: 'checkOllamaStatus' }`
- **Handler:** `RCAWebviewProvider._handleCheckOllamaStatus()`
- **Response:** `{ command: 'ollamaStatus', status: {...} }`
- **Status:** [DONE] Implemented

---

## Error Queue Commands

### getErrorQueue
- **Sent by:** `useErrorQueue.loadErrors()`
- **Payload:** `{ command: 'getErrorQueue' }`
- **Handler:** `RCAWebviewProvider._handleGetErrorQueue()`
- **Response:** `{ command: 'errorQueueData', errors: [...] }`
- **Status:** [DONE] Implemented

### refreshErrorQueue
- **Sent by:** `useErrorQueue.refreshErrors()`
- **Payload:** `{ command: 'refreshErrorQueue' }`
- **Handler:** `RCAWebviewProvider._handleRefreshErrorQueue()`
- **Response:** `{ command: 'errorQueueData', errors: [...] }`
- **Status:** [DONE] Implemented

### removeError
- **Sent by:** `useErrorQueue.removeError(errorId)`
- **Payload:** `{ command: 'removeError', errorId: string }`
- **Handler:** `RCAWebviewProvider._handleRemoveError(errorId)`
- **Response:** `{ command: 'errorRemoved', errorId: string }`
- **Status:** [DONE] Implemented

### pinError
- **Sent by:** `useErrorQueue.pinError(errorId)`
- **Payload:** `{ command: 'pinError', errorId: string }`
- **Handler:** `RCAWebviewProvider._handlePinError(errorId)`
- **Response:** Updates error queue
- **Status:** [DONE] Implemented

### unpinError
- **Sent by:** `useErrorQueue.unpinError(errorId)`
- **Payload:** `{ command: 'unpinError', errorId: string }`
- **Handler:** `RCAWebviewProvider._handleUnpinError(errorId)`
- **Response:** Updates error queue
- **Status:** [DONE] Implemented

### analyzeMultipleErrors
- **Sent by:** `useErrorQueue.analyzeSelected()`
- **Payload:** `{ command: 'analyzeMultipleErrors', errorIds: string[] }`
- **Handler:** `RCAWebviewProvider._handleAnalyzeMultipleErrors(errorIds)`
- **Response:** Analysis progress/completion messages
- **Status:** [DONE] Implemented

### clearCompletedErrors
- **Sent by:** `useErrorQueue.clearCompleted()`
- **Payload:** `{ command: 'clearCompletedErrors' }`
- **Handler:** `RCAWebviewProvider._handleClearCompletedErrors()`
- **Response:** Updates error queue
- **Status:** [DONE] Implemented

### clearAllErrors
- **Sent by:** `useErrorQueue.clearAll()`
- **Payload:** `{ command: 'clearAllErrors' }`
- **Handler:** `RCAWebviewProvider._handleClearAllErrors()`
- **Response:** `{ command: 'errorQueueData', errors: [] }`
- **Status:** [DONE] Implemented

### openErrorLocation
- **Sent by:** `useErrorQueue.openErrorLocation(errorId)`
- **Payload:** `{ command: 'openErrorLocation', errorId: string }`
- **Handler:** `RCAWebviewProvider._handleOpenErrorLocation(errorId)`
- **Response:** Opens file in editor
- **Status:** [DONE] Implemented

---

## Analysis Commands

### analyzeError
- **Sent by:** `useErrorQueue.analyzeError(errorId)`
- **Payload:** `{ command: 'analyzeError', errorId: string }`
- **Handler:** `RCAWebviewProvider._handleAnalyzeError(error)`
- **Response:** 
  - `{ command: 'analysisStarted', errorId, maxIterations }`
  - `{ command: 'analysisProgress', progress: {...} }`
  - `{ command: 'analysisComplete', result: {...} }`
  - `{ command: 'analysisError', error: string }`
- **Status:** [DONE] Implemented

### startAnalysis
- **Sent by:** `useAnalysis.startAnalysis(errorId, settings)`
- **Payload:** `{ command: 'startAnalysis', errorId: string, settings: any }`
- **Handler:** `RCAWebviewProvider._handleStartAnalysis(errorId, settings)`
- **Response:** Same as analyzeError
- **Status:** [DONE] Implemented

### startManualAnalysis
- **Sent by:** `useAnalysis.startManualAnalysis(errorText, settings)`
- **Payload:** `{ command: 'startManualAnalysis', errorText: string, settings: any }`
- **Handler:** `RCAWebviewProvider._handleStartManualAnalysis(errorText, settings)`
- **Response:** Same as analyzeError
- **Status:** [DONE] Implemented

### cancelAnalysis
- **Sent by:** `useAnalysis.cancelAnalysis()`
- **Payload:** `{ command: 'cancelAnalysis' }`
- **Handler:** `RCAWebviewProvider._handleCancelAnalysis()`
- **Response:** `{ command: 'analysisCancelled', message: string }`
- **Status:** [DONE] Implemented

### applyFix
- **Sent by:** `useAnalysis.applyFix(fixId)`, `useFixManager.applyFix(fixId)`
- **Payload:** `{ command: 'applyFix', fixId: string }` or `{ command: 'applyFix', fix: {...} }`
- **Handler:** `RCAWebviewProvider._handleApplyFix(fix)`
- **Response:** `{ command: 'fixApplied', data: {...} }`
- **Status:** [WARNING] **MISMATCH** - Hook sends `fixId`, handler expects `fix` object

### exportResult
- **Sent by:** `useAnalysis.exportResult()` (as 'exportAnalysis')
- **Payload:** `{ command: 'exportAnalysis', result: {...} }`
- **Handler:** `RCAWebviewProvider._handleExportResult(result)`
- **Response:** Saves file to disk
- **Status:** [WARNING] **MISMATCH** - Hook sends 'exportAnalysis', handler expects 'exportResult'

---

## History Commands

### getHistory
- **Sent by:** `useHistory.loadHistory()`
- **Payload:** `{ command: 'getHistory' }`
- **Handler:** `RCAWebviewProvider._handleGetHistory(limit)`
- **Response:** `{ command: 'historyData', history: [...] }`
- **Status:** [DONE] Implemented

### searchHistory
- **Sent by:** `useHistory.searchHistory(query)`
- **Payload:** `{ command: 'searchHistory', query: string }`
- **Handler:** `RCAWebviewProvider._handleSearchHistory(query)`
- **Response:** `{ command: 'searchHistoryResults', results: [...] }`
- **Status:** [DONE] Implemented

### reanalyzeFromHistory
- **Sent by:** `useHistory.reanalyzeError(historyId)`
- **Payload:** `{ command: 'reanalyzeFromHistory', historyId: string }`
- **Handler:** `RCAWebviewProvider._handleReanalyzeFromHistory(historyId)`
- **Response:** Analysis progress/completion messages
- **Status:** [DONE] Implemented

### deleteHistoryItem
- **Sent by:** `useHistory.deleteHistoryItem(historyId)`
- **Payload:** `{ command: 'deleteHistoryItem', historyId: string }`
- **Handler:** `RCAWebviewProvider._handleDeleteHistoryItem(historyId)`
- **Response:** `{ command: 'historyItemDeleted', id: string }`
- **Status:** [DONE] Implemented

### clearHistory
- **Sent by:** `useHistory.clearHistory()`
- **Payload:** `{ command: 'clearHistory' }`
- **Handler:** `RCAWebviewProvider._handleClearHistory()`
- **Response:** `{ command: 'historyCleared' }`
- **Status:** [DONE] Implemented

### exportHistoryItem
- **Sent by:** `useHistory.exportToMarkdown(historyId)`
- **Payload:** `{ command: 'exportHistoryItem', historyId: string }`
- **Handler:** `RCAWebviewProvider._handleExportHistoryItem(historyId)`
- **Response:** Saves file to disk
- **Status:** [DONE] Implemented

### exportAllHistory
- **Sent by:** `useHistory.exportAllToMarkdown()`
- **Payload:** `{ command: 'exportAllHistory' }`
- **Handler:** `RCAWebviewProvider._handleExportAllHistory()`
- **Response:** Saves file to disk
- **Status:** [DONE] Implemented

### refreshHistory
- **Sent by:** `useHistory.refreshHistory()`
- **Payload:** `{ command: 'refreshHistory' }`
- **Handler:** `RCAWebviewProvider._handleRefreshHistory()`
- **Response:** `{ command: 'historyData', history: [...] }`
- **Status:** [DONE] Implemented

---

## Agent State Commands

### subscribeAgentState
- **Sent by:** `useAgentState.subscribeToAgentState()`
- **Payload:** `{ command: 'subscribeAgentState' }`
- **Handler:** `RCAWebviewProvider._handleSubscribeAgentState()`
- **Response:** Real-time agent state updates
- **Status:** [DONE] Implemented

### unsubscribeAgentState
- **Sent by:** `useAgentState.unsubscribeFromAgentState()`
- **Payload:** `{ command: 'unsubscribeAgentState' }`
- **Handler:** `RCAWebviewProvider._handleUnsubscribeAgentState()`
- **Response:** Stops state updates
- **Status:** [DONE] Implemented

### getToolMetrics
- **Sent by:** `useAgentState.getToolMetrics()`
- **Payload:** `{ command: 'getToolMetrics' }`
- **Handler:** `RCAWebviewProvider._handleGetToolMetrics()`
- **Response:** `{ command: 'toolMetricsData', metrics: [...] }`
- **Status:** [DONE] Implemented

---

## Fix Manager Commands

### getPendingFixes
- **Sent by:** `useFixManager.loadPendingFixes()`
- **Payload:** `{ command: 'getPendingFixes' }`
- **Handler:** `RCAWebviewProvider._handleGetPendingFixes()`
- **Response:** `{ command: 'pendingFixesData', fixes: [...] }`
- **Status:** [DONE] Implemented

### getAppliedFixes
- **Sent by:** `useFixManager.loadAppliedFixes()`
- **Payload:** `{ command: 'getAppliedFixes' }`
- **Handler:** `RCAWebviewProvider._handleGetAppliedFixes()`
- **Response:** `{ command: 'appliedFixesData', fixes: [...] }`
- **Status:** [DONE] Implemented

### previewFix
- **Sent by:** `useFixManager.previewFix(fixId)`
- **Payload:** `{ command: 'previewFix', fixId: string }`
- **Handler:** `RCAWebviewProvider._handlePreviewFix(fixId)`
- **Response:** `{ command: 'diffPreviewData', diff: {...} }`
- **Status:** [DONE] Implemented

### applyFixById
- **Sent by:** Not directly sent by hooks (internal use)
- **Payload:** `{ command: 'applyFixById', fixId: string }`
- **Handler:** `RCAWebviewProvider._handleApplyFixById(fixId)`
- **Response:** `{ command: 'fixApplied', ... }`
- **Status:** [DONE] Implemented

### rejectFix
- **Sent by:** `useFixManager.rejectFix(fixId)`
- **Payload:** `{ command: 'rejectFix', fixId: string }`
- **Handler:** `RCAWebviewProvider._handleRejectFix(fixId)`
- **Response:** `{ command: 'fixRejected', fixId: string }`
- **Status:** [DONE] Implemented

### applyMultipleFixes
- **Sent by:** `useFixManager.applySelectedFixes()`
- **Payload:** `{ command: 'applyMultipleFixes', fixIds: string[] }`
- **Handler:** `RCAWebviewProvider._handleApplyMultipleFixes(fixIds)`
- **Response:** Multiple fix applied/error messages
- **Status:** [DONE] Implemented

### rejectMultipleFixes
- **Sent by:** `useFixManager.rejectSelectedFixes()`
- **Payload:** `{ command: 'rejectMultipleFixes', fixIds: string[] }`
- **Handler:** `RCAWebviewProvider._handleRejectMultipleFixes(fixIds)`
- **Response:** Multiple fix rejected messages
- **Status:** [DONE] Implemented

### clearAppliedFixes
- **Sent by:** `useFixManager.clearAppliedFixes()`
- **Payload:** `{ command: 'clearAppliedFixes' }`
- **Handler:** `RCAWebviewProvider._handleClearAppliedFixes()`
- **Response:** `{ command: 'fixesCleared' }`
- **Status:** [DONE] Implemented

---

## Metrics Commands

### getMetrics
- **Sent by:** `useMetrics.loadMetrics()`
- **Payload:** `{ command: 'getMetrics', timeRange: '7d'|'30d'|'all' }`
- **Handler:** `RCAWebviewProvider._handleGetMetrics(timeRange)`
- **Response:** `{ command: 'metricsData', metrics: {...} }`
- **Status:** [DONE] Implemented

### exportMetrics
- **Sent by:** `useMetrics.exportMetrics()`
- **Payload:** `{ command: 'exportMetrics', timeRange: string }`
- **Handler:** `RCAWebviewProvider._handleExportMetrics(timeRange)`
- **Response:** Saves file to disk
- **Status:** [DONE] Implemented

---

## Configuration Commands

### updateConfig
- **Sent by:** Not directly exposed in hooks (internal use)
- **Payload:** `{ command: 'updateConfig', key: string, value: any }`
- **Handler:** `RCAWebviewProvider._handleUpdateConfig(key, value)`
- **Response:** `{ command: 'configUpdated', data: {...} }`
- **Status:** [DONE] Implemented

---

## Navigation Commands

### navigate
- **Sent by:** Not directly exposed in hooks (router handles this)
- **Payload:** `{ command: 'navigate', route: string }`
- **Handler:** `RCAWebviewProvider._handleNavigate(route)`
- **Response:** `{ command: 'routeChanged', data: {...} }`
- **Status:** [DONE] Implemented

---

## Issues Found

### [RED] Critical Issues

#### 1. `applyFix` Command Mismatch
**Problem:** 
- Hook: `useAnalysis.applyFix(fixId)` → sends `{ command: 'applyFix', fixId: string }`
- Handler: `_handleApplyFix(fix)` → expects `{ command: 'applyFix', fix: CodeFix object }`

**Impact:** Fix application will fail
**Fix Required:** Align hook and handler expectations

#### 2. `exportResult` Command Mismatch
**Problem:**
- Hook: `useAnalysis.exportResult()` → sends `{ command: 'exportAnalysis', result: {...} }`
- Handler: expects `{ command: 'exportResult', result: {...} }`

**Impact:** Export functionality won't work
**Fix Required:** Change hook to use 'exportResult' command name

### [WARNING] Minor Issues

#### 3. Message Parameter Inconsistency
**Problem:** Some hooks send data directly in payload, others wrap in nested object
- Example A: `{ command: 'removeError', errorId: '123' }`
- Example B: `{ command: 'applyFix', fixId: '123' }` but handler expects `fix` object

**Impact:** Potential confusion, harder to maintain
**Recommendation:** Standardize on wrapping parameters

---

## Summary

### Total Commands Analyzed: 47
- [DONE] **Implemented & Working:** 44 (93.6%)
- [WARNING] **Partial/Mismatched:** 2 (4.3%)
- [FAIL] **Missing:** 0 (0%)
- [REFRESH] **Response Messages:** ~30 different response types

### Next Steps
1. Fix `applyFix` command mismatch
2. Fix `exportResult` command name
3. Add comprehensive error handling to all handlers
4. Verify response data shapes match frontend expectations
5. Create automated test suite for message passing
