# Phase 3 - Component Specifications

**Created:** January 9, 2026  
**Status:** [DONE] Complete

---

## Overview

This document provides detailed specifications for all components created in Phase 3. Each component follows the established patterns from Phase 1 & 2, using shadcn/ui design system and React hooks for state management.

---

## 1. History View

### Purpose
Browse and search past analyses with timeline grouping and detailed inspection.

### Location
`vscode-extension/webview/src/views/History.tsx`

### Props/Parameters
None (uses routing)

### Backend Integration

#### Services Used
- `StateManager.getHistory(limit?: number)` - Get all history items
- `StateManager.searchHistory(query: string)` - Search with query
- `StateManager.addToHistory(item)` - Add new item (automatic)
- `StateManager.removeFromHistory(id)` - Delete item
- `StateManager.clearHistory()` - Clear all
- `StateManager.onHistoryChange` - Real-time updates

#### Message Flow
```typescript
// Request history
webview → extension: { command: 'getHistory' }
extension → webview: { command: 'historyData', history: HistoryItem[] }

// Search
webview → extension: { command: 'searchHistory', query: string }
extension → webview: { command: 'searchHistoryResults', results: HistoryItem[] }

// Re-analyze
webview → extension: { command: 'reanalyzeFromHistory', historyId: string }

// Delete
webview → extension: { command: 'deleteHistoryItem', historyId: string }
extension → webview: { command: 'historyItemDeleted', id: string }

// Export
webview → extension: { command: 'exportHistoryItem', historyId: string }
webview → extension: { command: 'exportAllHistory' }

// Real-time updates
extension → webview: { command: 'historyUpdated', history: HistoryItem[] }
```

### State Management
```typescript
interface HistoryState {
  historyItems: HistoryItem[]
  loading: boolean
  searchQuery: string
  filterStatus: 'all' | 'success' | 'failed'
  sortBy: 'timestamp' | 'confidence' | 'duration'
  sortOrder: 'asc' | 'desc'
  stats: {
    total: number
    successful: number
    failed: number
    avgDuration: number
    avgConfidence: number
  }
}
```

### Key Features
1. **Timeline Grouping**: Groups by Today, Yesterday, This Week, This Month, or month name
2. **Search**: Debounced search across error messages, files, and root causes
3. **Filters**: Status filter (all/success/failed)
4. **Sorting**: By timestamp, confidence, or duration (asc/desc)
5. **Expandable Cards**: Click to expand and see full details
6. **Actions**: Re-analyze, Export, Delete per item
7. **Statistics**: Real-time stats cards showing totals and averages
8. **Bulk Actions**: Export all, Clear all

### Edge Cases
- Empty history → Shows empty state with helpful message
- Search no results → Shows "No matches" message
- Long error messages → Truncated with title attribute for full text
- Long stack traces → Scrollable with max-height

### Performance Notes
- Debounced search (300ms delay)
- Client-side filtering and sorting
- Expandable cards prevent rendering all details at once
- Auto-refresh every 60 seconds (history changes less frequently than errors)

---

## 2. Agent State View

### Purpose
Real-time visualization of the agent's thought process during analysis.

### Location
`vscode-extension/webview/src/views/AgentState.tsx`

### Props/Parameters
None (uses routing)

### Backend Integration

#### Services Used
- `AnalysisService.getStateStream()` - Get AgentStateStream
- `AgentStateStream.on(event, handler)` - Subscribe to events
- `PerformanceTracker.getToolMetrics()` - Get tool usage stats (if available)

#### Message Flow
```typescript
// Subscribe
webview → extension: { command: 'subscribeAgentState' }
webview → extension: { command: 'unsubscribeAgentState' }

// State updates
extension → webview: { command: 'agentStateUpdate', state: AgentState }

// Iteration updates
extension → webview: { 
  command: 'agentIterationUpdate',
  iteration: number,
  maxIterations: number,
  progress: number
}

// Thought updates
extension → webview: { command: 'agentThoughtUpdate', thought: string }

// Action updates
extension → webview: { 
  command: 'agentActionUpdate',
  tool: string,
  params: any,
  timestamp: number
}

// Observation updates
extension → webview: { 
  command: 'agentObservationUpdate',
  observation: string,
  timestamp: number,
  isFinal?: boolean
}

// Hypothesis updates
extension → webview: { 
  command: 'agentHypothesisUpdate',
  hypothesis: string,
  confidence: number
}

// Phase updates
extension → webview: { command: 'agentPhaseUpdate', phase: string }

// Completion
extension → webview: { command: 'agentComplete' }
extension → webview: { command: 'agentError' }

// Tool metrics
webview → extension: { command: 'getToolMetrics' }
extension → webview: { command: 'toolMetricsData', metrics: ToolMetrics[] }
```

### State Management
```typescript
interface AgentStateState {
  agentState: AgentState | null
  toolMetrics: ToolMetrics[]
  consensusData: any
  loading: boolean
  metrics: {
    totalIterations: number
    progressPercentage: number
    elapsedTime: number
    actionsCount: number
    observationsCount: number
    currentPhase: string
  }
}
```

### Key Features
1. **Status Overview**: Active/Idle with phase indicators
2. **Progress Tracking**: Iteration count, percentage, elapsed time
3. **Current State**: Hypothesis with confidence, current thought
4. **Recent Actions**: Last 10 actions with tool names and parameters
5. **Recent Observations**: Last 10 observations with timestamps
6. **Tool Metrics**: Table showing call count, duration, success rate
7. **Phase Indicators**: Visual indicators for different analysis phases
8. **Real-time Updates**: Subscribes on mount, unsubscribes on unmount

### Edge Cases
- No active analysis → Shows empty state
- Tool metrics unavailable → Shows "No data available"
- Long action params → Scrollable pre block
- Final observations → Highlighted in green

### Performance Notes
- Limits actions/observations to last 10 to prevent memory issues
- Subscribes only when view is active
- Unsubscribes on unmount to prevent memory leaks
- Animated phase icons for visual feedback

---

## 3. Fix Manager View

### Purpose
Manage pending code fixes and track applied fixes history.

### Location
`vscode-extension/webview/src/views/FixManager.tsx`

### Props/Parameters
None (uses routing)

### Backend Integration

#### Services Used
- `FixApplicationService.getPendingFixes()` - Get pending fixes
- `FixApplicationService.generateDiffPreview(fixId)` - Preview diff
- `FixApplicationService.applyFix(fixId)` - Apply fix
- `FixApplicationService.rejectFix(fixId)` - Reject fix
- `FixGenerator` - Backend fix generation (automatic)

#### Message Flow
```typescript
// Get fixes
webview → extension: { command: 'getPendingFixes' }
extension → webview: { command: 'pendingFixesData', fixes: PendingFix[] }

webview → extension: { command: 'getAppliedFixes' }
extension → webview: { command: 'appliedFixesData', fixes: AppliedFix[] }

// Preview
webview → extension: { command: 'previewFix', fixId: string }
extension → webview: { command: 'diffPreviewData', diff: DiffPreview }

// Apply
webview → extension: { command: 'applyFix', fixId: string }
extension → webview: { command: 'fixApplied', fixId: string, id: string, file: string }
// or
extension → webview: { command: 'fixApplyError', fixId: string, error: string }

// Reject
webview → extension: { command: 'rejectFix', fixId: string }
extension → webview: { command: 'fixRejected', fixId: string }

// Batch operations
webview → extension: { command: 'applyMultipleFixes', fixIds: string[] }
webview → extension: { command: 'rejectMultipleFixes', fixIds: string[] }

// Clear history
webview → extension: { command: 'clearAppliedFixes' }
extension → webview: { command: 'fixesCleared' }

// New fix generated (from analysis)
extension → webview: { command: 'newFixGenerated', fix: PendingFix }
```

### State Management
```typescript
interface FixManagerState {
  pendingFixes: PendingFix[]
  appliedFixes: AppliedFix[]
  diffPreview: DiffPreview | null
  loading: boolean
  selectedFixes: Set<string>
  stats: {
    pending: number
    applied: number
    failed: number
    selected: number
    avgConfidence: number
  }
}
```

### Key Features
1. **Pending Fixes Tab**:
   - Bulk selection with checkboxes
   - Apply/reject individual or multiple
   - Code diff preview (before/after)
   - Expandable details
   - Confidence badges

2. **Applied Fixes Tab**:
   - Success/failure status
   - Timestamps
   - Error messages for failures
   - Clear history button

3. **Statistics Cards**: Pending, Applied, Failed, Avg Confidence
4. **Diff Preview**: Modal showing full file diff
5. **Real-time Updates**: New fixes appear automatically

### Edge Cases
- No pending fixes → Shows empty state
- Fix application fails → Shows error in applied tab
- Long code blocks → Scrollable with max-height
- Multiple selections → Batch operations available

### Performance Notes
- Auto-refresh every 30 seconds
- Expandable cards prevent rendering all code at once
- Set-based selection for O(1) lookups
- Client-side filtering for instant feedback

---

## 4. Metrics View

### Purpose
Performance analytics and insights for RCA analyses.

### Location
`vscode-extension/webview/src/views/Metrics.tsx`

### Props/Parameters
None (uses routing)

### Backend Integration

#### Services Used
- `PerformanceTracker.getMetrics(timeRange)` - Get all metrics
- `AdaptiveLearning.getMetrics()` - Get learning metrics
- `StateManager.getHistory()` - Calculate metrics from history

#### Message Flow
```typescript
// Get metrics
webview → extension: { command: 'getMetrics', timeRange: '7d' | '30d' | 'all' }
extension → webview: { command: 'metricsData', metrics: MetricsData }

// Export
webview → extension: { command: 'exportMetrics', timeRange: string }

// Real-time updates
extension → webview: { command: 'metricsUpdated', metrics: MetricsData }
```

### State Management
```typescript
interface MetricsState {
  metricsData: MetricsData | null
  loading: boolean
  timeRange: '7d' | '30d' | 'all'
  successRateChartData: ChartData | null
  analysisTimeChartData: ChartData | null
  summaryStats: {
    totalAnalyses: number
    overallSuccessRate: number
    avgAnalysisTime: number
    topErrorType: string
    cacheHitRate: number
    avgConfidence: number
  } | null
}
```

### Key Features
1. **Summary Statistics**: 6 cards showing key metrics
2. **Success Rate Chart**: Line graph over time
3. **Analysis Time Chart**: Bar graph over time
4. **Error Type Distribution**: Progress bars with success rates
5. **Model Performance**: Current model stats
6. **Learning Metrics**: Total learnings, cache hit rate, confidence improvement
7. **Time Range Selector**: 7d, 30d, all time
8. **Export**: Export metrics data

### Edge Cases
- No data → Shows empty state
- Time range change → Reloads metrics
- Chart data missing → Shows fallback message
- Division by zero → Handles with Math.round() checks

### Performance Notes
- Custom SVG-based charts (no external libraries)
- Auto-refresh every 60 seconds
- Client-side chart data transformation
- Lightweight and responsive

### Custom Components
- `SimpleLineChart`: SVG-based line chart
- `SimpleBarChart`: Flex-based bar chart

---

## Custom Hooks

### 1. useHistory

**Location**: `vscode-extension/webview/src/hooks/useHistory.ts`

**Purpose**: Manage history data, search, filter, and actions

**Returns**:
```typescript
{
  historyItems: HistoryItem[]
  groupedByDate: Record<string, HistoryItem[]>
  loading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterStatus: FilterStatus
  setFilterStatus: (status: FilterStatus) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  stats: { total, successful, failed, avgDuration, avgConfidence }
  loadHistory: () => void
  refreshHistory: () => void
  searchHistory: (query: string) => void
  reanalyzeError: (historyId: string) => void
  deleteHistoryItem: (historyId: string) => void
  clearHistory: () => void
  exportToMarkdown: (historyId: string) => void
  exportAllToMarkdown: () => void
}
```

### 2. useAgentState

**Location**: `vscode-extension/webview/src/hooks/useAgentState.ts`

**Purpose**: Subscribe to real-time agent state updates

**Returns**:
```typescript
{
  agentState: AgentState | null
  toolMetrics: ToolMetrics[]
  consensusData: any
  loading: boolean
  metrics: { totalIterations, progressPercentage, elapsedTime, actionsCount, observationsCount, currentPhase }
  subscribeToAgentState: () => void
  unsubscribeFromAgentState: () => void
  getToolMetrics: () => void
  resetAgentState: () => void
}
```

### 3. useFixManager

**Location**: `vscode-extension/webview/src/hooks/useFixManager.ts`

**Purpose**: Manage pending and applied fixes

**Returns**:
```typescript
{
  pendingFixes: PendingFix[]
  appliedFixes: AppliedFix[]
  diffPreview: DiffPreview | null
  loading: boolean
  selectedFixes: Set<string>
  stats: { pending, applied, failed, selected, avgConfidence }
  loadPendingFixes: () => void
  loadAppliedFixes: () => void
  refreshFixes: () => void
  previewFix: (fixId: string) => void
  applyFix: (fixId: string) => void
  rejectFix: (fixId: string) => void
  applySelectedFixes: () => void
  rejectSelectedFixes: () => void
  clearAppliedFixes: () => void
  toggleSelection: (fixId: string) => void
  selectAll: () => void
  deselectAll: () => void
}
```

### 4. useMetrics

**Location**: `vscode-extension/webview/src/hooks/useMetrics.ts`

**Purpose**: Load and transform metrics data

**Returns**:
```typescript
{
  metricsData: MetricsData | null
  loading: boolean
  timeRange: '7d' | '30d' | 'all'
  setTimeRange: (range) => void
  successRateChartData: ChartData | null
  analysisTimeChartData: ChartData | null
  summaryStats: { totalAnalyses, overallSuccessRate, avgAnalysisTime, topErrorType, cacheHitRate, avgConfidence } | null
  loadMetrics: () => void
  refreshMetrics: () => void
  exportMetrics: () => void
}
```

---

## UI Components Created

### 1. Checkbox
**Location**: `components/ui/checkbox.tsx`  
**Based on**: Radix UI Checkbox  
**Usage**: Bulk selection in Fix Manager, History

### 2. Tabs
**Location**: `components/ui/tabs.tsx`  
**Based on**: Radix UI Tabs  
**Usage**: Fix Manager (Pending/Applied tabs)

### 3. Card
**Location**: `components/ui/card.tsx`  
**Usage**: All views for content containers

### 4. Input
**Location**: `components/ui/input.tsx`  
**Usage**: Search boxes in History, Error Queue

### 5. Progress
**Location**: `components/ui/progress.tsx`  
**Based on**: Radix UI Progress  
**Usage**: Agent State iteration progress

### 6. Table
**Location**: `components/ui/table.tsx`  
**Usage**: Agent State tool metrics

---

## Design Patterns Used

### 1. Message Passing Pattern
All views use the same pattern:
1. `postMessage(command, data)` to send requests
2. `window.addEventListener('message')` to receive responses
3. Cleanup listeners on unmount

### 2. Hook-Based State Management
Each view has a dedicated custom hook that:
1. Encapsulates all data fetching logic
2. Manages local state
3. Provides action methods
4. Handles message passing

### 3. Real-time Updates
Views that need real-time updates:
1. Subscribe on mount
2. Listen for update messages
3. Unsubscribe on unmount

### 4. Empty States
All views handle empty states with:
1. Icon
2. Title
3. Helpful message
4. Call-to-action (if applicable)

### 5. Loading States
All views show loading indicators:
1. On initial load
2. On refresh
3. On data operations

---

## Accessibility

All components follow accessibility best practices:
- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Focus indicators
- Color contrast compliance

---

## Testing Recommendations

### Unit Tests
1. Test hooks in isolation
2. Test message handling logic
3. Test state transformations
4. Test edge cases

### Integration Tests
1. Test view rendering with mock data
2. Test user interactions
3. Test message flow
4. Test real-time updates

### E2E Tests
1. Test complete workflows
2. Test with real backend
3. Test error scenarios
4. Test performance under load

---

## Future Enhancements

### Potential Improvements
1. **Virtual scrolling** for large lists (History, Fix Manager)
2. **Advanced filtering** with multiple criteria
3. **Chart interactions** (tooltips, zoom, pan)
4. **Export formats** (PDF, CSV, JSON)
5. **Keyboard shortcuts** for common actions
6. **Drag-and-drop** for reordering
7. **Themes** (light/dark mode toggle)
8. **Animations** for smoother transitions

---

## Maintenance Notes

### Common Issues
1. **Message not received**: Check command spelling and handler registration
2. **State not updating**: Verify event listeners are set up correctly
3. **Performance issues**: Check for memory leaks, unnecessary re-renders
4. **Build errors**: Ensure all dependencies are installed

### Debugging Tips
1. Use React DevTools for component inspection
2. Check browser console for errors
3. Use VS Code Developer Tools for webview debugging
4. Add console.log statements in message handlers

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Status:** [DONE] Complete
