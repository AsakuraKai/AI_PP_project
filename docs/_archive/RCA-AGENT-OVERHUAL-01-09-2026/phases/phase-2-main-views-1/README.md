# Phase 2 - Main Views Part 1 (Week 2)

**Duration:** 7 days  
**Prerequisites:** Phase 1 complete  
**Views:** Dashboard, Error Queue, Analyze

---

## [TARGET] Phase Goals

Build the three most critical user-facing views:
1. **Dashboard** - Landing page with overview and quick actions
2. **Error Queue** - Browse and manage detected errors
3. **Analyze** - Interactive error analysis with live progress

---

## [LIST] Task Breakdown

### Days 1-2: Dashboard View

See [DASHBOARD_VIEW.md](DASHBOARD_VIEW.md) for detailed specifications.

**Components to Build:**
- [ ] Stats cards (Pending Errors, Analyses Today, Success Rate)
- [ ] Quick action buttons
- [ ] Recent activity feed
- [ ] Ollama status card
- [ ] Workspace health indicator

**Backend Integration:**
- `ErrorQueueManager.getQueue()` → Pending count
- `StateManager.getHistory()` → Recent activity
- `PerformanceMonitor.getMetrics()` → Stats
- `NetworkTimeoutHandler.checkOllamaAvailability()` → Status

**Effort:** 2 days

---

### Days 3-4: Error Queue View

See [ERROR_QUEUE_VIEW.md](ERROR_QUEUE_VIEW.md) for detailed specifications.

**Components to Build:**
- [ ] Table/card layout for errors
- [ ] Filter by status (Pending/Analyzing/Complete)
- [ ] Search functionality
- [ ] Bulk operations (select multiple, analyze all)
- [ ] Pin/unpin errors
- [ ] Quick navigation to source file

**Backend Integration:**
- `ErrorQueueManager.getQueue()` → All errors
- `RealtimeErrorDetector.detectErrors()` → Live updates
- `AnalysisService.analyzeError()` → Trigger analysis

**Effort:** 2 days

---

### Days 5-7: Analyze View

See [ANALYZE_VIEW.md](ANALYZE_VIEW.md) for detailed specifications.

**Components to Build:**
- [ ] Three states: Empty, Analyzing, Complete
- [ ] Error input form
- [ ] Live iteration progress display
- [ ] Real-time hypothesis updates
- [ ] Result display with code diffs
- [ ] Fix suggestion cards
- [ ] Export functionality

**Backend Integration:**
- `AnalysisService.analyzeError()` with progress callbacks
- `AnalysisService.getStateStream()` → Real-time updates
- `FixApplicationService.generateFix()` → Fix suggestions

**Effort:** 3 days

---

##  Completion Criteria

### Dashboard View
- [ ] All stats cards display real data
- [ ] Quick actions trigger correct commands
- [ ] Recent activity updates in real-time
- [ ] Ollama status shows connection/latency
- [ ] Workspace health accurate

### Error Queue View
- [ ] Errors displayed in table/card format
- [ ] Filters work correctly
- [ ] Search finds errors by message/file
- [ ] Bulk operations functional
- [ ] Pin/unpin persists
- [ ] File navigation opens correct location

### Analyze View
- [ ] Empty state accepts input
- [ ] Analysis shows progress (iteration X/6)
- [ ] Hypothesis updates live
- [ ] Complete state shows results
- [ ] Fix suggestions actionable
- [ ] Export generates markdown

---

##  Testing Checklist

### Dashboard
- [ ] Stats update when errors analyzed
- [ ] Quick actions work
- [ ] Activity feed shows last 5
- [ ] Ollama status reflects reality

### Error Queue
- [ ] Large lists (100+ errors) perform well
- [ ] Filters combine correctly
- [ ] Search is fast (<100ms)
- [ ] Bulk analyze works
- [ ] Pins survive reload

### Analyze
- [ ] Progress updates every iteration
- [ ] Cancel stops analysis
- [ ] Results display correctly
- [ ] Fixes can be applied
- [ ] Export includes all details

---

##  Key Files

```
vscode-extension/webview/src/
 views/
    Dashboard.tsx
    ErrorQueue.tsx
    Analyze.tsx
 components/
    StatsCard.tsx
    ErrorTable.tsx
    AnalysisProgress.tsx
    FixSuggestion.tsx
 hooks/
     useDashboardData.ts
     useErrorQueue.ts
     useAnalysis.ts
```

---

##  Next Phase

**[Phase 3 - Main Views Part 2](../phase-3-main-views-2/README.md)**
