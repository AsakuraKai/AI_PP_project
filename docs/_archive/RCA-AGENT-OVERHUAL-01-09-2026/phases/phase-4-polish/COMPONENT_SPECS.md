# Phase 4 - Component Specifications

**Created:** January 9, 2026  
**Phase:** Polish & Launch  
**Status:** [DESIGN] Documentation in progress

---

## Overview

This document details all UI components built during Phases 1-3, their current state, and required Phase 4 enhancements.

---

## Views (7 Total)

### 1. Dashboard View
**File:** `vscode-extension/webview/src/views/Dashboard.tsx`  
**Hook:** `useDashboardData.ts`

#### Current Features
- [DONE] Statistics cards (Pending Errors, Analyses Today, Success Rate, Average Time)
- [DONE] Quick action buttons (Analyze All, Scan Workspace, Settings)
- [DONE] Recent activity feed with type indicators
- [DONE] Ollama status panel
- [DONE] Empty state for activity feed
- [DONE] Refresh functionality

#### Phase 4 Enhancements Needed
- [ ] **Keyboard Navigation:** Tab through stats and buttons, Enter to activate
- [ ] **ARIA Labels:** Add proper aria-labels to stats cards and buttons
- [ ] **Loading Skeleton:** Add skeleton for stats cards during initial load
- [ ] **Animation:** Page transition on mount (300ms fade-in)
- [ ] **Responsive:** Test on mobile viewport (sidebar collapse)
- [ ] **Empty State:** Enhanced empty state when pendingErrors === 0

#### Props/Parameters
```typescript
interface DashboardStats {
  pendingErrors: number;
  analyzesPerformed: number;
  successRate: number;
  averageTime: number;
}

interface ActivityItem {
  id: string;
  timestamp: number;
  message: string;
  type: 'success' | 'error' | 'analyzing';
  errorMessage?: string;
}

interface OllamaStatus {
  connected: boolean;
  model?: string;
  responseTime?: number;
  error?: string;
}
```

#### Backend Integration
- **Messages Sent:** `getDashboardData`, `checkOllamaStatus`, `analyzeAllErrors`, `scanWorkspace`, `openSettings`
- **Messages Received:** `dashboardData`, `activityUpdate`, `ollamaStatus`
- **Update Frequency:** 30-second polling for data refresh

---

### 2. ErrorQueue View
**File:** `vscode-extension/webview/src/views/ErrorQueue.tsx`  
**Hook:** `useErrorQueue.ts`

#### Current Features
- [DONE] Table layout for errors with file, line, type, status
- [DONE] Search functionality
- [DONE] Filter by status (pending, analyzing, completed, failed)
- [DONE] Filter by type (type-error, null-pointer, etc.)
- [DONE] Bulk selection and operations
- [DONE] Pin/unpin errors
- [DONE] Empty state with messaging
- [DONE] Quick navigation to source file

#### Phase 4 Enhancements Needed
- [ ] **Keyboard Navigation:** Arrow keys to navigate table rows, Space to select
- [ ] **ARIA Labels:** Table headers, row selection state, filter controls
- [ ] **Loading Skeleton:** Table rows skeleton during refresh
- [ ] **Animation:** Row hover effects, smooth expand/collapse
- [ ] **Responsive:** Card view on mobile (< 768px)
- [ ] **Empty State:** Different messages for filtered vs. no errors
- [ ] **Accessibility:** Screen reader announces row count and selection

#### Props/Parameters
```typescript
interface ErrorItem {
  id: string;
  file: string;
  line: number;
  message: string;
  type: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  pinned: boolean;
  timestamp: number;
}

type FilterStatus = 'all' | 'pending' | 'analyzing' | 'completed' | 'failed';
type FilterType = 'all' | string;
```

#### Backend Integration
- **Messages Sent:** `getErrors`, `analyzeError`, `analyzeSelected`, `analyzeAll`, `removeError`, `clearCompleted`, `pinError`, `unpinError`, `openErrorLocation`
- **Messages Received:** `errorQueueData`, `errorUpdate`
- **Real-time:** Subscribes to error status changes

---

### 3. Analyze View
**File:** `vscode-extension/webview/src/views/Analyze.tsx`  
**Hook:** `useAnalysis.ts`

#### Current Features
- [DONE] Manual error input form
- [DONE] File context picker
- [DONE] Real-time analysis progress
- [DONE] Step-by-step progress indicators
- [DONE] Cancel analysis button
- [DONE] Results display
- [DONE] Fix suggestions

#### Phase 4 Enhancements Needed
- [ ] **Keyboard Navigation:** Tab through form fields, Enter to submit
- [ ] **ARIA Labels:** Form inputs, progress steps, cancel button
- [ ] **Loading State:** Animated progress bar with percentage
- [ ] **Animation:** Smooth step transitions, success celebration
- [ ] **Empty State:** Helpful prompt when no error provided
- [ ] **Accessibility:** Live region for progress updates

#### Backend Integration
- **Messages Sent:** `analyzeError`, `cancelAnalysis`
- **Messages Received:** `analysisProgress`, `analysisComplete`, `analysisError`
- **Real-time:** Progress stream with step updates

---

### 4. History View
**File:** `vscode-extension/webview/src/views/History.tsx`  
**Hook:** `useHistory.ts`

#### Current Features
- [DONE] Timeline of past analyses
- [DONE] Filter by date range
- [DONE] Search functionality
- [DONE] View details of past analysis
- [DONE] Re-analyze option
- [DONE] Export history

#### Phase 4 Enhancements Needed
- [ ] **Keyboard Navigation:** Arrow keys through timeline
- [ ] **ARIA Labels:** Timeline items, date filters
- [ ] **Loading Skeleton:** Timeline skeleton during load
- [ ] **Animation:** Expand/collapse details with slide
- [ ] **Empty State:** First-time user message
- [ ] **Accessibility:** Screen reader timeline navigation

---

### 5. AgentState View
**File:** `vscode-extension/webview/src/views/AgentState.tsx`  
**Hook:** `useAgentState.ts`

#### Current Features
- [DONE] Current agent status
- [DONE] Active tools list
- [DONE] Memory/cache usage
- [DONE] LLM statistics
- [DONE] Real-time updates

#### Phase 4 Enhancements Needed
- [ ] **Keyboard Navigation:** Focus on status panels
- [ ] **ARIA Labels:** Status indicators, tool list
- [ ] **Loading State:** Metrics loading indicators
- [ ] **Animation:** Smooth updates on state change
- [ ] **Empty State:** Idle state message
- [ ] **Accessibility:** Live region for status changes

---

### 6. FixManager View
**File:** `vscode-extension/webview/src/views/FixManager.tsx`  
**Hook:** `useFixManager.ts`

#### Current Features
- [DONE] Pending fixes queue
- [DONE] Preview diff before applying
- [DONE] Apply individual or batch fixes
- [DONE] Undo applied fixes
- [DONE] Fix confidence scores

#### Phase 4 Enhancements Needed
- [ ] **Keyboard Navigation:** Tab through fixes, Enter to preview
- [ ] **ARIA Labels:** Fix items, confidence badges, apply buttons
- [ ] **Loading State:** Apply fix progress indicator
- [ ] **Animation:** Success/error toast notifications
- [ ] **Empty State:** No pending fixes message
- [ ] **Accessibility:** Screen reader announces application results

---

### 7. Metrics View
**File:** `vscode-extension/webview/src/views/Metrics.tsx`  
**Hook:** `useMetrics.ts`

#### Current Features
- [DONE] Performance charts
- [DONE] Success rate over time
- [DONE] Average analysis time
- [DONE] Error type distribution
- [DONE] Date range selector

#### Phase 4 Enhancements Needed
- [ ] **Keyboard Navigation:** Tab through date selectors and charts
- [ ] **ARIA Labels:** Chart descriptions, data points
- [ ] **Loading Skeleton:** Chart placeholders
- [ ] **Animation:** Chart data transitions
- [ ] **Empty State:** No data available message
- [ ] **Accessibility:** Data table alternative for charts

---

## Components

### Sidebar
**File:** `vscode-extension/webview/src/components/Sidebar.tsx`

#### Current Features
- [DONE] Collapsible sidebar (persists to localStorage)
- [DONE] Navigation section with icons
- [DONE] Settings section
- [DONE] Smooth expand/collapse animation

#### Phase 4 Enhancements
- [ ] **Keyboard Navigation:** Arrow keys between nav items
- [ ] **ARIA Labels:** Nav items, collapse button
- [ ] **Responsive:** Auto-collapse on < 768px
- [ ] **Accessibility:** Proper nav landmarks

---

### StatsCard
**File:** `vscode-extension/webview/src/components/StatsCard.tsx`

#### Phase 4 Enhancements
- [ ] **ARIA Labels:** Stat values and trends
- [ ] **Animation:** Hover lift effect
- [ ] **Accessibility:** Proper heading levels

---

### AnalysisProgress
**File:** `vscode-extension/webview/src/components/AnalysisProgress.tsx`

#### Phase 4 Enhancements
- [ ] **ARIA Labels:** Progress percentage, step names
- [ ] **Animation:** Progress bar animation
- [ ] **Accessibility:** Live region for progress updates

---

### FixSuggestion
**File:** `vscode-extension/webview/src/components/FixSuggestion.tsx`

#### Phase 4 Enhancements
- [ ] **ARIA Labels:** Confidence score, apply button
- [ ] **Keyboard Navigation:** Tab to apply/dismiss
- [ ] **Animation:** Expand/collapse diff preview

---

## UI Component Library (shadcn/ui)

**Location:** `vscode-extension/webview/src/components/ui/`

The following shadcn/ui components are already installed and used:
- [DONE] Button
- [DONE] Badge
- [DONE] Card
- [DONE] Progress
- [DONE] Select
- [DONE] Switch
- [DONE] Tabs
- [DONE] Checkbox

All shadcn/ui components already have:
- [DONE] Keyboard navigation built-in
- [DONE] ARIA labels (Radix UI primitives)
- [DONE] Focus indicators
- [DONE] Dark theme support

---

## Animations & Transitions

### Existing Animations
**File:** `vscode-extension/resources/animations.css`

Already implemented:
- [DONE] Panel slide-in (300ms)
- [DONE] Fade-in/fade-out
- [DONE] Button hover effects
- [DONE] Loading spinner
- [DONE] Pulse animation
- [DONE] Progress bar fill
- [DONE] Reduced motion support
- [DONE] CSS variables for timing

### Animations to Add
- [ ] Page transition fade (300ms) on route change
- [ ] Toast notification slide-in from bottom
- [ ] Success checkmark animation
- [ ] Error shake animation
- [ ] Loading skeleton shimmer

---

## Testing Requirements

### Unit Tests (To Be Created)
Each component needs tests for:
1. **Rendering:** Component renders without crashing
2. **Props:** Handles all prop combinations
3. **User Interaction:** Button clicks, form inputs
4. **Empty States:** Renders empty states correctly
5. **Loading States:** Shows loading indicators
6. **Error States:** Handles errors gracefully

### Integration Tests (To Be Created)
Each view needs tests for:
1. **Data Flow:** Hook → Component → UI updates
2. **Message Passing:** Sends correct messages to extension
3. **Real-time Updates:** Handles incoming messages
4. **Navigation:** Route changes work correctly

### E2E Tests (To Be Created)
Workflows to test:
1. **Complete Analysis:** Error queue → analyze → fix → apply
2. **Dashboard Actions:** Analyze all, scan workspace
3. **Fix Application:** Preview → apply → undo
4. **Settings Changes:** Toggle options, persist

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance
- [ ] **Keyboard Navigation:** All interactive elements accessible via keyboard
- [ ] **Focus Indicators:** Visible focus on all focusable elements
- [ ] **ARIA Labels:** All buttons, inputs, and controls labeled
- [ ] **Landmarks:** Proper nav, main, complementary roles
- [ ] **Headings:** Logical heading hierarchy (h1 → h2 → h3)
- [ ] **Color Contrast:** 4.5:1 for text, 3:1 for UI elements
- [ ] **Alt Text:** All icons have text alternatives
- [ ] **Live Regions:** Dynamic content announces to screen readers
- [ ] **Reduced Motion:** Respects prefers-reduced-motion
- [ ] **Screen Reader:** Tested with NVDA/JAWS

---

## Performance Targets

- Initial load: < 1s
- View switch: < 200ms
- Error queue (100+ items): smooth scrolling (60fps)
- Memory usage: < 50MB for webview
- Bundle size: < 500KB

---

## Browser/VS Code Support

- VS Code: 1.85+
- Webview API: Latest
- No cross-browser concerns (VS Code's Electron)

---

## Next Steps

1. Implement missing empty states
2. Add keyboard navigation handlers
3. Add ARIA labels to all components
4. Create loading skeletons
5. Set up testing infrastructure
6. Write comprehensive tests
7. Accessibility audit with screen reader
8. Performance profiling

---
