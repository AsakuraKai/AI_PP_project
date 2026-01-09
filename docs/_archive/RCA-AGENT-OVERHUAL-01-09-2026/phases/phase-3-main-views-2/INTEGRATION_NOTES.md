# Phase 3 - Integration Notes

**Created:** January 9, 2026  
**Status:** 🔄 In Progress

---

## Overview

This document outlines the integration between the Phase 3 frontend views and the VS Code extension backend. It provides detailed instructions for implementing message handlers in `extension.ts` and wiring up the backend services.

---

## Architecture

### Message Passing Flow

```
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────┐
│  Webview (React)│          │  Extension.ts    │          │  Backend        │
│                 │          │                  │          │  Services       │
│  - Views        │ ─────▶   │  - Message       │ ─────▶   │  - StateManager │
│  - Hooks        │  postMsg │    Handlers      │  calls   │  - Analysis     │
│  - Components   │          │  - Event         │          │  - Fix          │
│                 │ ◀─────   │    Listeners     │ ◀─────   │  - Metrics      │
└─────────────────┘  message └──────────────────┘  events  └─────────────────┘
```

### Message Types

1. **Request/Response**: Webview requests data, extension responds
2. **Action/Confirmation**: Webview triggers action, extension confirms
3. **Event Subscription**: Webview subscribes, extension sends updates

---

## Backend Services Reference

### StateManager
**Location**: `vscode-extension/src/services/StateManager.ts`

**Purpose**: Singleton service for persistent storage via VS Code globalState

**Key Methods**:
```typescript
// History
getHistory(limit?: number): HistoryItem[]
addToHistory(item: HistoryItem): void
removeFromHistory(id: string): void
clearHistory(): void
searchHistory(query: string): HistoryItem[]
onHistoryChange: Event<HistoryItem[]>

// Error Queue
getErrorQueue(): ErrorItem[]
addToQueue(error: ErrorItem): void
removeFromQueue(id: string): void

// Diagnostics
saveDiagnosticsSnapshot(snapshot: DiagnosticsSnapshot): void
getDiagnosticsHistory(): DiagnosticsSnapshot[]
```

### AnalysisService
**Location**: `vscode-extension/src/services/AnalysisService.ts`

**Purpose**: Orchestrates the MultiPassAgent for RCA analysis

**Key Methods**:
```typescript
analyzeError(errorItem: ErrorItem): Promise<AnalysisResult>
getStateStream(): AgentStateStream
getCurrentState(): AgentState | null
```

### FixApplicationService
**Location**: `vscode-extension/src/services/FixApplicationService.ts`

**Purpose**: Integrates FixGenerator with workspace file operations

**Key Methods**:
```typescript
generateFix(analysisResult: AnalysisResult): Promise<Fix>
applyFix(fix: Fix): Promise<ApplyFixResult>
previewFix(fix: Fix): Promise<DiffPreview>
getPendingFixes(): PendingFix[]
getAppliedFixes(): AppliedFix[]
```

### AgentStateStream
**Location**: `vscode-extension/src/core/AgentStateStream.ts`

**Purpose**: Real-time event emission for agent thoughts, actions, observations

**Key Methods**:
```typescript
on(event: string, handler: Function): void
off(event: string, handler: Function): void
emit(event: string, data: any): void
```

**Events**:
- `iteration` - New iteration started
- `thought` - Agent thinking
- `action` - Tool invocation
- `observation` - Tool result
- `hypothesis` - New hypothesis
- `phase` - Phase change
- `complete` - Analysis complete
- `error` - Error occurred

### PerformanceTracker
**Location**: `vscode-extension/src/performance/PerformanceTracker.ts`

**Purpose**: Track tool usage metrics and performance data

**Key Methods**:
```typescript
trackToolUsage(tool: string, duration: number, success: boolean): void
getToolMetrics(): ToolMetrics[]
getMetrics(timeRange?: string): MetricsData
```

---

## Message Handlers Implementation

### 1. History View Handlers

Add to `extension.ts` in the webview message handler:

```typescript
// Get history
case 'getHistory': {
  const stateManager = StateManager.getInstance(context);
  const history = stateManager.getHistory();
  panel.webview.postMessage({
    command: 'historyData',
    history
  });
  break;
}

// Search history
case 'searchHistory': {
  const { query } = message;
  const stateManager = StateManager.getInstance(context);
  const results = stateManager.searchHistory(query);
  panel.webview.postMessage({
    command: 'searchHistoryResults',
    results
  });
  break;
}

// Re-analyze from history
case 'reanalyzeFromHistory': {
  const { historyId } = message;
  const stateManager = StateManager.getInstance(context);
  const history = stateManager.getHistory();
  const item = history.find(h => h.id === historyId);
  
  if (item) {
    // Convert history item to error item
    const errorItem: ErrorItem = {
      id: `reanalysis-${Date.now()}`,
      message: item.errorMessage,
      file: item.file,
      line: item.line,
      stackTrace: item.stackTrace,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Add to queue and trigger analysis
    stateManager.addToQueue(errorItem);
    panel.webview.postMessage({
      command: 'errorAdded',
      error: errorItem
    });
    
    // Trigger analysis
    vscode.commands.executeCommand('rca-agent.analyzeError', errorItem.id);
  }
  break;
}

// Delete history item
case 'deleteHistoryItem': {
  const { historyId } = message;
  const stateManager = StateManager.getInstance(context);
  stateManager.removeFromHistory(historyId);
  panel.webview.postMessage({
    command: 'historyItemDeleted',
    id: historyId
  });
  break;
}

// Clear history
case 'clearHistory': {
  const stateManager = StateManager.getInstance(context);
  stateManager.clearHistory();
  panel.webview.postMessage({
    command: 'historyCleared'
  });
  break;
}

// Export history item
case 'exportHistoryItem': {
  const { historyId } = message;
  const stateManager = StateManager.getInstance(context);
  const history = stateManager.getHistory();
  const item = history.find(h => h.id === historyId);
  
  if (item) {
    const markdown = generateHistoryMarkdown(item);
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`history-${item.id}.md`),
      filters: { 'Markdown': ['md'] }
    });
    
    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown, 'utf8'));
      vscode.window.showInformationMessage('History exported successfully!');
    }
  }
  break;
}

// Export all history
case 'exportAllHistory': {
  const stateManager = StateManager.getInstance(context);
  const history = stateManager.getHistory();
  const markdown = generateAllHistoryMarkdown(history);
  
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('rca-history.md'),
    filters: { 'Markdown': ['md'] }
  });
  
  if (uri) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown, 'utf8'));
    vscode.window.showInformationMessage('All history exported successfully!');
  }
  break;
}
```

**Real-time updates**: Wire up StateManager events

```typescript
// In createWebviewPanel function, after panel creation:
const stateManager = StateManager.getInstance(context);

// Listen for history changes
const historyChangeDisposable = stateManager.onHistoryChange((history) => {
  panel.webview.postMessage({
    command: 'historyUpdated',
    history
  });
});

// Cleanup on panel dispose
panel.onDidDispose(() => {
  historyChangeDisposable.dispose();
});
```

**Helper functions**:

```typescript
function generateHistoryMarkdown(item: HistoryItem): string {
  return `# RCA Analysis Report

**ID**: ${item.id}
**Timestamp**: ${new Date(item.timestamp).toLocaleString()}
**Status**: ${item.status}
**Confidence**: ${(item.confidence * 100).toFixed(1)}%

## Error Details

**File**: ${item.file}:${item.line}
**Message**: ${item.errorMessage}

## Root Cause

${item.rootCause}

## Fix Suggestion

\`\`\`${item.file.split('.').pop()}
${item.fixSuggestion}
\`\`\`

## Additional Context

${item.context || 'N/A'}

---
*Generated by RCA Agent*
`;
}

function generateAllHistoryMarkdown(history: HistoryItem[]): string {
  let markdown = '# RCA Analysis History\n\n';
  markdown += `**Total Analyses**: ${history.length}\n`;
  markdown += `**Success Rate**: ${(history.filter(h => h.status === 'success').length / history.length * 100).toFixed(1)}%\n\n`;
  markdown += '---\n\n';
  
  history.forEach((item, index) => {
    markdown += `## ${index + 1}. ${item.errorMessage}\n\n`;
    markdown += `**Status**: ${item.status} | **Confidence**: ${(item.confidence * 100).toFixed(1)}%\n\n`;
    markdown += `**Root Cause**: ${item.rootCause}\n\n`;
    markdown += '---\n\n';
  });
  
  return markdown;
}
```

---

### 2. Agent State View Handlers

```typescript
// Subscribe to agent state
case 'subscribeAgentState': {
  const analysisService = AnalysisService.getInstance(context);
  const stateStream = analysisService.getStateStream();
  
  // Store subscription reference
  if (!context.subscriptions.find(s => s === agentStateSubscription)) {
    agentStateSubscription = new vscode.Disposable(() => {
      // Cleanup subscriptions
    });
    context.subscriptions.push(agentStateSubscription);
  }
  
  // Set up event listeners
  stateStream.on('iteration', (data) => {
    panel.webview.postMessage({
      command: 'agentIterationUpdate',
      iteration: data.current,
      maxIterations: data.max,
      progress: (data.current / data.max) * 100
    });
  });
  
  stateStream.on('thought', (thought) => {
    panel.webview.postMessage({
      command: 'agentThoughtUpdate',
      thought
    });
  });
  
  stateStream.on('action', (action) => {
    panel.webview.postMessage({
      command: 'agentActionUpdate',
      tool: action.tool,
      params: action.params,
      timestamp: Date.now()
    });
  });
  
  stateStream.on('observation', (observation) => {
    panel.webview.postMessage({
      command: 'agentObservationUpdate',
      observation: observation.content,
      timestamp: Date.now(),
      isFinal: observation.isFinal
    });
  });
  
  stateStream.on('hypothesis', (hypothesis) => {
    panel.webview.postMessage({
      command: 'agentHypothesisUpdate',
      hypothesis: hypothesis.text,
      confidence: hypothesis.confidence
    });
  });
  
  stateStream.on('phase', (phase) => {
    panel.webview.postMessage({
      command: 'agentPhaseUpdate',
      phase
    });
  });
  
  stateStream.on('complete', () => {
    panel.webview.postMessage({
      command: 'agentComplete'
    });
  });
  
  stateStream.on('error', (error) => {
    panel.webview.postMessage({
      command: 'agentError',
      error: error.message
    });
  });
  
  // Send current state
  const currentState = analysisService.getCurrentState();
  if (currentState) {
    panel.webview.postMessage({
      command: 'agentStateUpdate',
      state: currentState
    });
  }
  break;
}

// Unsubscribe from agent state
case 'unsubscribeAgentState': {
  const analysisService = AnalysisService.getInstance(context);
  const stateStream = analysisService.getStateStream();
  
  // Remove all listeners
  stateStream.removeAllListeners();
  break;
}

// Get tool metrics
case 'getToolMetrics': {
  const tracker = PerformanceTracker.getInstance();
  const metrics = tracker.getToolMetrics();
  panel.webview.postMessage({
    command: 'toolMetricsData',
    metrics
  });
  break;
}
```

---

### 3. Fix Manager Handlers

```typescript
// Get pending fixes
case 'getPendingFixes': {
  const fixService = FixApplicationService.getInstance(context);
  const fixes = fixService.getPendingFixes();
  panel.webview.postMessage({
    command: 'pendingFixesData',
    fixes
  });
  break;
}

// Get applied fixes
case 'getAppliedFixes': {
  const fixService = FixApplicationService.getInstance(context);
  const fixes = fixService.getAppliedFixes();
  panel.webview.postMessage({
    command: 'appliedFixesData',
    fixes
  });
  break;
}

// Preview fix
case 'previewFix': {
  const { fixId } = message;
  const fixService = FixApplicationService.getInstance(context);
  const fixes = fixService.getPendingFixes();
  const fix = fixes.find(f => f.id === fixId);
  
  if (fix) {
    const preview = await fixService.previewFix(fix);
    panel.webview.postMessage({
      command: 'diffPreviewData',
      diff: preview
    });
  }
  break;
}

// Apply fix
case 'applyFix': {
  const { fixId } = message;
  const fixService = FixApplicationService.getInstance(context);
  const fixes = fixService.getPendingFixes();
  const fix = fixes.find(f => f.id === fixId);
  
  if (fix) {
    try {
      const result = await fixService.applyFix(fix);
      panel.webview.postMessage({
        command: 'fixApplied',
        fixId,
        id: result.id,
        file: result.file
      });
      vscode.window.showInformationMessage(`Fix applied to ${result.file}`);
    } catch (error) {
      panel.webview.postMessage({
        command: 'fixApplyError',
        fixId,
        error: error.message
      });
      vscode.window.showErrorMessage(`Failed to apply fix: ${error.message}`);
    }
  }
  break;
}

// Reject fix
case 'rejectFix': {
  const { fixId } = message;
  const fixService = FixApplicationService.getInstance(context);
  fixService.rejectFix(fixId);
  panel.webview.postMessage({
    command: 'fixRejected',
    fixId
  });
  break;
}

// Apply multiple fixes
case 'applyMultipleFixes': {
  const { fixIds } = message;
  const fixService = FixApplicationService.getInstance(context);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const fixId of fixIds) {
    const fixes = fixService.getPendingFixes();
    const fix = fixes.find(f => f.id === fixId);
    
    if (fix) {
      try {
        await fixService.applyFix(fix);
        panel.webview.postMessage({
          command: 'fixApplied',
          fixId,
          id: fix.id,
          file: fix.file
        });
        successCount++;
      } catch (error) {
        panel.webview.postMessage({
          command: 'fixApplyError',
          fixId,
          error: error.message
        });
        failCount++;
      }
    }
  }
  
  vscode.window.showInformationMessage(
    `Applied ${successCount} fix(es). ${failCount > 0 ? `Failed: ${failCount}` : ''}`
  );
  break;
}

// Reject multiple fixes
case 'rejectMultipleFixes': {
  const { fixIds } = message;
  const fixService = FixApplicationService.getInstance(context);
  
  fixIds.forEach(fixId => {
    fixService.rejectFix(fixId);
    panel.webview.postMessage({
      command: 'fixRejected',
      fixId
    });
  });
  
  vscode.window.showInformationMessage(`Rejected ${fixIds.length} fix(es)`);
  break;
}

// Clear applied fixes
case 'clearAppliedFixes': {
  const fixService = FixApplicationService.getInstance(context);
  fixService.clearAppliedFixes();
  panel.webview.postMessage({
    command: 'fixesCleared'
  });
  break;
}
```

**Real-time updates**: Wire up fix generation events

```typescript
// In analysis completion handler:
analysisService.on('analysisComplete', async (result) => {
  // Generate fix
  const fixService = FixApplicationService.getInstance(context);
  const fix = await fixService.generateFix(result);
  
  // Notify webview
  panel.webview.postMessage({
    command: 'newFixGenerated',
    fix
  });
});
```

---

### 4. Metrics View Handlers

```typescript
// Get metrics
case 'getMetrics': {
  const { timeRange = '7d' } = message;
  
  // Get metrics from different sources
  const stateManager = StateManager.getInstance(context);
  const history = stateManager.getHistory();
  const tracker = PerformanceTracker.getInstance();
  
  // Calculate metrics based on time range
  const cutoffTime = Date.now() - getTimeRangeMs(timeRange);
  const filteredHistory = history.filter(h => h.timestamp >= cutoffTime);
  
  // Build metrics data
  const metricsData = {
    successRate: calculateSuccessRate(filteredHistory),
    analysisTime: calculateAnalysisTime(filteredHistory),
    errorTypes: calculateErrorTypes(filteredHistory),
    toolMetrics: tracker.getToolMetrics(),
    modelPerformance: {
      currentModel: 'sonnet-4-20250514',
      totalTokens: 0, // TODO: Track tokens
      avgTokensPerAnalysis: 0,
      costEstimate: 0
    },
    learningMetrics: {
      totalLearnings: 0, // TODO: Get from AdaptiveLearning
      cacheHitRate: 0,
      avgConfidenceImprovement: 0
    },
    timeRange
  };
  
  panel.webview.postMessage({
    command: 'metricsData',
    metrics: metricsData
  });
  break;
}

// Export metrics
case 'exportMetrics': {
  const { timeRange } = message;
  // Similar to getMetrics, but format as CSV or JSON
  const metrics = await getMetricsData(timeRange);
  const json = JSON.stringify(metrics, null, 2);
  
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`rca-metrics-${timeRange}.json`),
    filters: { 'JSON': ['json'] }
  });
  
  if (uri) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf8'));
    vscode.window.showInformationMessage('Metrics exported successfully!');
  }
  break;
}
```

**Helper functions**:

```typescript
function getTimeRangeMs(range: string): number {
  switch (range) {
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    case 'all': return Infinity;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

function calculateSuccessRate(history: HistoryItem[]): ChartData {
  // Group by day and calculate success rate
  const grouped = new Map<string, { total: number; success: number }>();
  
  history.forEach(item => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!grouped.has(date)) {
      grouped.set(date, { total: 0, success: 0 });
    }
    const stats = grouped.get(date)!;
    stats.total++;
    if (item.status === 'success') stats.success++;
  });
  
  return {
    labels: Array.from(grouped.keys()),
    data: Array.from(grouped.values()).map(s => 
      s.total > 0 ? (s.success / s.total) * 100 : 0
    )
  };
}

function calculateAnalysisTime(history: HistoryItem[]): ChartData {
  // Group by day and calculate average analysis time
  const grouped = new Map<string, number[]>();
  
  history.forEach(item => {
    if (item.duration) {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(item.duration);
    }
  });
  
  return {
    labels: Array.from(grouped.keys()),
    data: Array.from(grouped.values()).map(times =>
      times.reduce((a, b) => a + b, 0) / times.length / 1000 // Convert to seconds
    )
  };
}

function calculateErrorTypes(history: HistoryItem[]): ErrorTypeData[] {
  // Group errors by type
  const types = new Map<string, { total: number; success: number }>();
  
  history.forEach(item => {
    const type = item.errorType || 'Unknown';
    if (!types.has(type)) {
      types.set(type, { total: 0, success: 0 });
    }
    const stats = types.get(type)!;
    stats.total++;
    if (item.status === 'success') stats.success++;
  });
  
  return Array.from(types.entries()).map(([type, stats]) => ({
    type,
    count: stats.total,
    successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0
  }));
}
```

---

## Testing Integration

### 1. Manual Testing Steps

**History View**:
1. Run analysis on an error
2. Check if it appears in History view
3. Test search functionality
4. Test delete and clear operations
5. Verify export to markdown

**Agent State View**:
1. Start an analysis
2. Open Agent State view
3. Verify real-time updates appear
4. Check iterations counter increments
5. Verify tool metrics table

**Fix Manager View**:
1. Complete an analysis with fix
2. Check pending fixes appear
3. Test preview diff
4. Test apply fix
5. Check applied fixes history

**Metrics View**:
1. Run multiple analyses
2. Open Metrics view
3. Verify charts render
4. Test time range selector
5. Test export metrics

### 2. Unit Tests

Create tests in `vscode-extension/src/__tests__/`:

```typescript
// message-handlers.test.ts
describe('Message Handlers', () => {
  test('getHistory returns history items', async () => {
    // Test implementation
  });
  
  test('applyFix applies fix and sends confirmation', async () => {
    // Test implementation
  });
  
  // Add more tests...
});
```

### 3. Integration Tests

```typescript
// integration.test.ts
describe('View Integration', () => {
  test('History view displays items from StateManager', async () => {
    // Test implementation
  });
  
  test('Agent State view receives real-time updates', async () => {
    // Test implementation
  });
  
  // Add more tests...
});
```

---

## Deployment Checklist

- [ ] All message handlers implemented in `extension.ts`
- [ ] Event listeners wired up for real-time updates
- [ ] Helper functions added (markdown generation, metrics calculation)
- [ ] Error handling added for all handlers
- [ ] User notifications added for actions
- [ ] Cleanup/dispose logic added
- [ ] TypeScript compilation successful
- [ ] Manual testing completed for all views
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Documentation updated (README, inline comments)
- [ ] Performance tested with large datasets
- [ ] Memory leaks checked and fixed

---

## Troubleshooting

### Common Issues

**Issue**: Messages not received in webview  
**Solution**: Check `postMessage` command spelling, verify message handler is registered

**Issue**: Real-time updates not working  
**Solution**: Verify event listeners are set up, check dispose cleanup logic

**Issue**: Fix apply fails  
**Solution**: Check file permissions, verify file exists, check workspace trust

**Issue**: Metrics not calculating  
**Solution**: Verify history items have required fields, check time range calculation

**Issue**: Memory leak over time  
**Solution**: Ensure event listeners are removed on dispose, check for circular references

---

## Performance Considerations

1. **Debounce searches** to avoid excessive backend calls
2. **Limit history size** to prevent memory issues (e.g., max 1000 items)
3. **Batch updates** when possible to reduce message overhead
4. **Use virtual scrolling** for large lists (future enhancement)
5. **Cache metrics** to avoid recalculating on every request
6. **Dispose listeners** properly to prevent memory leaks

---

## Security Considerations

1. **Sanitize user inputs** before file operations
2. **Validate file paths** to prevent directory traversal
3. **Check workspace trust** before applying fixes
4. **Limit export file sizes** to prevent denial of service
5. **Validate message commands** to prevent injection attacks

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Status:** 🔄 In Progress (Backend handlers pending)
