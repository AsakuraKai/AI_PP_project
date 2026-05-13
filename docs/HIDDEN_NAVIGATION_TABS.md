# Hidden Navigation Tabs Documentation

This document describes the navigation tabs that have been temporarily hidden from the RCA Agent VS Code extension sidebar. These features are fully implemented and can be re-enabled when needed.

## How to Re-enable Hidden Tabs

To show these tabs again, edit the file:
```
vscode-extension/webview/src/components/NavigationSection.tsx
```

Find the `navItems` array and set `hidden: false` (or remove the `hidden` property) for the tabs you want to show:

```typescript
{ id: 'agent', icon: Bot, label: 'Agent State', route: '/agent', hidden: false },
{ id: 'fixes', icon: Wrench, label: 'Fix Manager', route: '/fixes', hidden: false },
{ id: 'metrics', icon: BarChart, label: 'Metrics', route: '/metrics', hidden: false },
```

Then rebuild the webview:
```bash
cd vscode-extension/webview
npm run build
```

---

## Hidden Tab 1: Agent State

**Route:** `/agent`
**Icon:** Bot (lucide-react)
**View File:** `vscode-extension/webview/src/views/AgentState.tsx`
**Hook:** `vscode-extension/webview/src/hooks/useAgentState.ts`

### Purpose
Displays real-time state of the RCA analysis agent during error analysis. Shows the agent's thinking process, tool usage, and iteration progress.

### Features
- **Real-time iteration tracking** - Shows current iteration number and max iterations
- **Agent thoughts** - Displays the agent's reasoning process
- **Tool/Action monitoring** - Shows which tools the agent is using and their parameters
- **Observation results** - Displays results from tool executions
- **Hypothesis tracking** - Shows generated hypotheses with confidence scores
- **Phase indicators** - Shows current analysis phase

### Backend Handlers (RCAWebviewProvider.ts)
- `subscribeAgentState` - Subscribe to real-time agent state updates
- `unsubscribeAgentState` - Unsubscribe from agent state updates
- `getToolMetrics` - Get tool usage metrics

### Message Types
- `agentStateUpdate` - Full state update
- `agentIterationUpdate` - Iteration progress
- `agentThoughtUpdate` - New agent thought
- `agentActionUpdate` - Tool/action executed
- `agentObservationUpdate` - Tool result received
- `agentHypothesisUpdate` - New hypothesis generated
- `agentPhaseUpdate` - Phase change
- `agentComplete` - Analysis complete
- `agentError` - Error occurred

---

## Hidden Tab 2: Fix Manager

**Route:** `/fixes`
**Icon:** Wrench (lucide-react)
**View File:** `vscode-extension/webview/src/views/FixManager.tsx`
**Hook:** `vscode-extension/webview/src/hooks/useFixManager.ts`
**Service:** `vscode-extension/src/services/FixApplicationService.ts`

### Purpose
Manages suggested code fixes from RCA analysis. Allows users to preview, apply, or reject fixes with diff visualization.

### Features
- **Pending fixes queue** - List of suggested fixes awaiting user action
- **Applied fixes history** - Record of previously applied fixes
- **Diff preview** - Visual diff showing before/after code changes
- **Batch operations** - Apply or reject multiple fixes at once
- **Fix confidence scores** - Shows AI confidence for each fix

### Backend Handlers (RCAWebviewProvider.ts)
- `getPendingFixes` - Get list of pending fixes
- `getAppliedFixes` - Get list of applied fixes
- `previewFix` - Generate diff preview for a fix
- `applyFixById` - Apply a specific fix
- `rejectFix` - Reject a specific fix
- `applyMultipleFixes` - Batch apply fixes
- `rejectMultipleFixes` - Batch reject fixes
- `clearAppliedFixes` - Clear applied fixes history

### Message Types
- `pendingFixesData` - Pending fixes list
- `appliedFixesData` - Applied fixes list
- `diffPreviewData` - Diff preview content
- `fixApplied` - Fix successfully applied
- `fixApplyError` - Fix application failed
- `fixRejected` - Fix rejected
- `fixesCleared` - Fixes history cleared

### Fix Data Structure
```typescript
interface Fix {
  id: string;
  file: string;
  line: number;
  before: string;  // Original code
  after: string;   // Fixed code
  explanation: string;
  confidence: number;
  errorContext: string;
}
```

---

## Hidden Tab 3: Metrics

**Route:** `/metrics`
**Icon:** BarChart (lucide-react)
**View File:** `vscode-extension/webview/src/views/Metrics.tsx`
**Hook:** `vscode-extension/webview/src/hooks/useMetrics.ts`

### Purpose
Displays analytics and performance metrics for RCA analyses over time. Helps track analysis effectiveness and identify patterns.

### Features
- **Success rate tracking** - Overall and daily success rates
- **Analysis time metrics** - Average and median analysis durations
- **Error type distribution** - Breakdown by error categories
- **Model performance stats** - LLM usage and confidence metrics
- **Learning metrics** - Cache hit rates and confidence improvements
- **Time range filtering** - 7 days, 30 days, or all time
- **Export functionality** - Export metrics as Markdown reports

### Backend Handlers (RCAWebviewProvider.ts)
- `getMetrics` - Get metrics for specified time range
- `exportMetrics` - Export metrics to file

### Message Types
- `metricsData` - Full metrics data response

### Metrics Data Structure
```typescript
interface MetricsData {
  successRate: {
    overall: number;  // 0-1
    byDay: Array<{ date: string; success: number; failed: number; rate: number }>;
  };
  analysisTime: {
    average: number;  // milliseconds
    median: number;
    byDay: Array<{ date: string; avgTime: number }>;
  };
  errorTypes: Array<{ type: string; count: number; successRate: number }>;
  modelPerformance: {
    model: string;
    totalAnalyses: number;
    successRate: number;
    avgTime: number;
    avgConfidence: number;
  };
  learningMetrics: {
    totalLearnings: number;
    cacheHitRate: number;
    avgConfidenceImprovement: number;
  };
}
```

### Time Range Options
- `7d` - Last 7 days
- `30d` - Last 30 days
- `all` - All time

---

## Related Files

### Views
- `vscode-extension/webview/src/views/AgentState.tsx`
- `vscode-extension/webview/src/views/FixManager.tsx`
- `vscode-extension/webview/src/views/Metrics.tsx`

### Hooks
- `vscode-extension/webview/src/hooks/useAgentState.ts`
- `vscode-extension/webview/src/hooks/useFixManager.ts`
- `vscode-extension/webview/src/hooks/useMetrics.ts`

### Backend Services
- `vscode-extension/src/services/FixApplicationService.ts`
- `vscode-extension/src/services/StateManager.ts`
- `vscode-extension/src/services/AnalysisService.ts`

### Navigation
- `vscode-extension/webview/src/components/NavigationSection.tsx`

---

## Notes

- All backend handlers remain active even when tabs are hidden
- Routes still work if accessed directly (e.g., via URL)
- No functionality is removed, only hidden from UI navigation
- Data continues to be collected for metrics even when tab is hidden
