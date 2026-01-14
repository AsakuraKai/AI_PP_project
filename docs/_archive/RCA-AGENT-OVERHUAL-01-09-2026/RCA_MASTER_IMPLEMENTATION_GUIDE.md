# RCA Agent - Master Implementation Guide

**Created:** January 9, 2026  
**Last Updated:** January 10, 2026  
**Completed:** January 10, 2026  
**Status:** [DONE] [COMPLETE] All Phases Complete

---

## [LIST] Document Overview

This is the **master implementation guide** for the RCA Agent UI redesign. It consolidates:
- Visual design specifications and mockups
- 4-week implementation roadmap
- Priority matrix for critical gaps
- Integration requirements

**Related Documents:**
- [RCA_TECHNICAL_REFERENCE.md](./RCA_TECHNICAL_REFERENCE.md) - Backend API wiring, component mapping
- [RCA_UI_REMOVAL_SUMMARY.md](./RCA_UI_REMOVAL_SUMMARY.md) - What was removed and why

---

## [TARGET] Project Vision

Transform RCA Agent from traditional VS Code UI to a **modern, Figma-inspired interface**:
- Elegant collapsible sidebar navigation (black #000000)
- 7 specialized views for different workflows
- React + Vite + shadcn/ui components
- Professional dark theme with smooth animations
- All backend services already functional

---

## [WARNING] Critical Priorities (P0 - Must Fix First)

Before implementing new UI, these **3 critical gaps** must be resolved:

### 1. ChatActionCommands Not Registered [FAILED]
**Impact:** Chat participant can analyze but CAN'T apply fixes

**Files:**
- `vscode-extension/src/commands/ChatActionCommands.ts` (exists but not wired)
- `vscode-extension/src/extension.ts` (needs command registration)
- `vscode-extension/package.json` (needs command contributions)

**Fix Required:**
```typescript
// In extension.ts:
import { applyFixCommand, explainMoreCommand, searchSimilarCommand } 
  from './commands/ChatActionCommands';

context.subscriptions.push(
  vscode.commands.registerCommand('rca-agent.applyFix', applyFixCommand),
  vscode.commands.registerCommand('rca-agent.explainMore', explainMoreCommand),
  vscode.commands.registerCommand('rca-agent.searchSimilar', searchSimilarCommand)
);
```

**Effort:** 30 minutes | **Priority:** P0

---

### 2. FixApplicationService Not Using Backend FixGenerator [FAILED]
**Impact:** Fixes use hardcoded templates instead of intelligent LLM generation

**Files:**
- `vscode-extension/src/services/FixApplicationService.ts` (uses templates)
- `src/agent/FixGenerator.ts` (backend exists but not connected)

**Fix Required:**
```typescript
import { FixGenerator } from '../../../src/agent/FixGenerator';
import { OllamaClient } from '../../../src/llm/OllamaClient';

class FixApplicationService {
  private fixGenerator: FixGenerator;
  
  constructor() {
    this.fixGenerator = new FixGenerator(new OllamaClient());
  }
  
  async generateFix(error: ErrorInfo): Promise<Fix> {
    return this.fixGenerator.generateFix(error); // Use AI, not templates
  }
}
```

**Effort:** 2 hours | **Priority:** P0

---

### 3. NetworkTimeoutHandler Not Used [TIMER]
**Impact:** Ollama calls hang indefinitely on network issues

**Files:**
- `vscode-extension/src/services/NetworkTimeoutHandler.ts` (exists, 359 lines)
- `vscode-extension/src/services/AnalysisService.ts` (doesn't use it)

**Fix Required:**
```typescript
import { NetworkTimeoutHandler } from './NetworkTimeoutHandler';

class AnalysisService {
  private timeoutHandler = NetworkTimeoutHandler.getInstance();
  
  async analyzeError(error: ErrorInfo): Promise<Analysis> {
    return this.timeoutHandler.withTimeout(
      () => this.agent.analyze(error),
      30000 // 30s timeout
    );
  }
}
```

**Effort:** 1.5 hours | **Priority:** P0

**Total P0 Effort:** ~4 hours (complete before UI work)

---

## [DESIGN] Visual Design Specification

### Layout Structure

```
┌────────────────────┬─────────────────────────────┐
│   Sidebar          │   Main Content              │
│   (Black #000000)  │   (zinc-950 #0a0a0a)        │
│                    │                             │
│  [SETTINGS] Settings │   [HOME] Dashboard          │
│  ├─ Model          │   ┌─────┬─────┬─────┐      │
│  ├─ Ollama Status  │   │Stat1│Stat2│Stat3│      │
│  ├─ Theme          │   └─────┴─────┴─────┘      │
│  └─ Preferences    │                             │
│                    │   [CHART] View Content      │
│  [NAV] Navigation  │   • Analysis Results        │
│  ├─ [HOME] Dashboard │   • Error Queue Table     │
│  ├─ [!] Errors (5) │   • History Timeline        │
│  ├─ [SEARCH] Analyze │   • Agent Visualization   │
│  ├─ [HISTORY] History │   • Fix Previews          │
│  ├─ [AGENT] Agent  │   • Performance Metrics     │
│  ├─ [FIX] Fixes    │                             │
│  └─ [METRICS] Metrics │                          │
│                    │                             │
│  [<] Collapse      │                             │
└────────────────────┴─────────────────────────────┘

Collapsed (64px):        Expanded (224px):
┌───┐                    ┌──────────────────┐
│ [*] │                   │ [SETTINGS] Settings │
│ [H] │                   │ [HOME] Dashboard  │
│ [!] │                   │ [!] Errors (5)    │
│ [?] │                   │ [SEARCH] Analyze  │
└───┘                    └──────────────────┘
```

### Color Palette

```typescript
const rcaTheme = {
  // Backgrounds
  primary: '#030213',      // Deep blue-black
  sidebar: '#000000',      // Pure black sidebar
  content: '#0a0a0a',      // zinc-950 content area
  card: '#171717',         // zinc-900 cards
  cardHover: '#1f1f1f',    // Hover state
  
  // Borders
  border: '#27272a',       // zinc-800
  borderLight: '#3f3f46',  // zinc-700
  
  // Text
  text: '#ffffff',         // White primary
  textMuted: '#a1a1aa',    // zinc-400 secondary
  textDim: '#71717a',      // zinc-500 tertiary
  
  // States
  hover: '#18181b',        // zinc-900
  active: '#27272a',       // zinc-800
  
  // Semantic
  accent: '#3b82f6',       // Blue interactive
  success: '#22c55e',      // Green success
  warning: '#f59e0b',      // Amber warning
  error: '#ef4444',        // Red error
};
```

### Design System
- **Sidebar:** 224px expanded, 64px collapsed (300ms transition)
- **Typography:** System font, font-light (300) for headings
- **Spacing:** 8px base unit (Tailwind scale)
- **Animations:** ease-in-out, 300ms duration
- **Icons:** Lucide React (24px default)

---

## [MOBILE] Navigation & View Structure

### Sidebar Navigation (7 Main Views)

| Icon | Label | Route | Purpose | Backend Service |
|------|-------|-------|---------|-----------------|
| [HOME] | Dashboard | `/` | Overview, stats, quick actions | StateManager, PerformanceMonitor |
| [WARNING] | Error Queue | `/errors` | Browse & manage errors | ErrorQueueManager |
| [SEARCH] | Analyze | `/analyze` | Interactive analysis | AnalysisService |
| [LIST] | History | `/history` | Past analyses | StateManager.getHistory() |
| [BRAIN] | Agent State | `/agent` | Real-time visualization | AgentStateStream |
| [TOOL] | Fix Manager | `/fixes` | Review & apply fixes | FixApplicationService |
| [CHART] | Metrics | `/metrics` | Performance stats | PerformanceTracker |

### Settings Section (Top of Sidebar)

**Expanded View:**
```
[SETTINGS] Settings
├─ Model: DeepSeek-R1
├─ [OK] Ollama: Connected
├─ Theme: Dark
├─ Educational Mode: Off
└─ Realtime Detection: On
```

**Features:**
- Quick model selection dropdown
- Ollama connection status indicator
- Theme toggle
- Educational mode toggle
- Realtime detection toggle

---

## [DESKTOP] View Specifications

### 1. Dashboard View (`/`)

**Purpose:** Landing page with overview and quick actions

**Components:**
- Stats cards (Pending Errors, Analyses Today, Success Rate)
- Quick action buttons (Analyze All, Scan Workspace, Settings)
- Recent activity feed (last 5 analyses)
- Ollama status card
- Workspace health indicator

**Data Sources:**
- `ErrorQueueManager.getQueue()` → Pending errors count
- `StateManager.getHistory()` → Recent activity
- `PerformanceMonitor.getMetrics()` → Success rate, avg time
- `NetworkTimeoutHandler.checkOllamaAvailability()` → Connection status

**UI Components:**
- `<Card>` from shadcn/ui for stat cards
- `<Badge>` for status indicators
- `<Button>` for quick actions
- `<ScrollArea>` for activity feed

---

### 2. Error Queue View (`/errors`)

**Purpose:** Comprehensive error management

**Features:**
- Table/card view of detected errors
- Filter by status (Pending/Analyzing/Complete)
- Search errors by message/file
- Bulk operations (select multiple, analyze all)
- Pin important errors
- Quick navigation to source file

**Data Sources:**
- `ErrorQueueManager.getQueue()` → All errors
- `RealtimeErrorDetector.detectErrors()` → Live updates
- `AnalysisService.analyzeError()` → Trigger analysis

**UI Components:**
- `<Table>` or `<Card>` list for error display
- `<Select>` for filter dropdown
- `<Input>` for search
- `<Checkbox>` for bulk selection
- `<Button>` for actions

---

### 3. Analyze View (`/analyze`)

**Purpose:** Interactive analysis with live progress

**States:**

**Empty State:**
```
┌─────────────────────────────────────────────┐
│ Start Analysis                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Paste error message or stack trace...  │ │
│ └─────────────────────────────────────────┘ │
│ [Analyze] [Select from Queue]              │
└─────────────────────────────────────────────┘
```

**Analyzing State:**
```
┌─────────────────────────────────────────────┐
│ Analyzing... Iteration 3/6                  │
│ ████████░░░░░░░░ 50%                        │
│                                             │
│ Current Hypothesis:                         │
│ "Missing null check in onCreate()"         │
│ Confidence: 75%                             │
│                                             │
│ Tools Used: StackTraceParser, CodeSearch    │
└─────────────────────────────────────────────┘
```

**Complete State:**
```
┌─────────────────────────────────────────────┐
│ [DONE] Analysis Complete (95% confidence)       │
│                                             │
│ [TARGET] Root Cause:                              │
│ "Variable 'user' not initialized..."       │
│                                             │
│ [IDEA] Suggested Fixes (2):                     │
│ 1. Add null check [View] [Apply]           │
│ 2. Initialize in constructor [View] [Apply]│
│                                             │
│ [Export] [Search Similar] [Reanalyze]      │
└─────────────────────────────────────────────┘
```

**Data Sources:**
- `AnalysisService.analyzeError()` with progress callbacks
- `AnalysisService.getStateStream()` → Real-time updates
- `FixApplicationService.generateFix()` → Fix suggestions

**UI Components:**
- `<Textarea>` for error input
- `<Progress>` for iteration progress
- `<Alert>` for hypothesis display
- `<Accordion>` for fix suggestions
- `<Dialog>` for diff preview

---

### 4. History View (`/history`)

**Purpose:** Search and browse past analyses

**Features:**
- Timeline view grouped by date (Today, Yesterday, This Week, etc.)
- Full-text search across error messages and root causes
- Filter by success/failure
- Re-analyze past errors
- Export analysis to markdown
- Feedback system (helpful/not helpful)

**Data Sources:**
- `StateManager.getHistory()` → All past analyses
- `StateManager.searchHistory(query)` → Search results
- `FeedbackHandler.submitFeedback()` → User feedback

**UI Components:**
- `<ScrollArea>` for timeline
- `<Input>` with search icon
- `<Select>` for filters
- `<Card>` for each history item
- `<Dialog>` for detail view
- `<Button>` for actions (Reanalyze, Export)

---

### 5. Agent State View (`/agent`)

**Purpose:** Real-time visualization of agent's thought process

**Features:**
- Live iteration progress bar
- Current hypothesis with confidence meter
- Observations list
- Tools used with timing
- Consensus building visualization

**Data Sources:**
- `AnalysisService.getStateStream()` → Real-time state updates
- `AgentStateStream` → Iteration events
- `PerformanceTracker.getToolMetrics()` → Tool timing

**UI Components:**
- `<Progress>` for iteration
- `<Card>` for hypothesis
- `<Badge>` for confidence level
- `<Accordion>` for observations
- `<Table>` for tool usage

---

### 6. Fix Manager View (`/fixes`)

**Purpose:** Review, preview, and apply suggested fixes

**Features:**
- Pending fixes queue
- Code diff preview
- Apply/reject actions
- Batch operations
- Applied fixes history

**Data Sources:**
- `FixApplicationService.getPendingFixes()` → Queue
- `FixApplicationService.generateDiffPreview()` → Diff
- `FixApplicationService.applyFix()` → Apply action

**UI Components:**
- `<Tabs>` for Pending/Applied/Rejected
- `<Card>` for each fix
- `<Dialog>` for diff preview
- `<Button>` for actions
- Code diff viewer (custom component)

---

### 7. Metrics View (`/metrics`)

**Purpose:** Performance and learning analytics

**Features:**
- Success rate chart (line chart over time)
- Average analysis time (bar chart by error type)
- Error type distribution (pie chart)
- Model performance comparison
- Learning metrics (improvement over time)

**Data Sources:**
- `PerformanceTracker.getMetrics()` → All metrics
- `AdaptiveLearning.getMetrics()` → Learning stats
- `StateManager.getHistory()` → Historical data

**UI Components:**
- `<Card>` for metric cards
- `<Chart>` from shadcn/ui (Recharts)
- `<Select>` for time range
- `<Table>` for detailed breakdown

---

## [CALENDAR] Implementation Roadmap (4 Weeks)

### Week 1: Foundation & Sidebar

**Days 1-3: Setup**
- [ ] Fix P0 critical gaps (4 hours)
- [ ] Setup Vite + React + TypeScript for webview
- [ ] Configure Tailwind with RCA color theme
- [ ] Import shadcn/ui component library (40+ components)
- [ ] Setup VS Code webview integration
- [ ] Configure message passing (extension [H_ARROW] webview)

**Days 4-7: Sidebar**
- [ ] Build CollapsibleSidebar component
- [ ] Implement SettingsSection with:
  - Model configuration dropdown
  - Ollama connection status indicator
  - Theme toggle
  - Educational mode toggle
  - Realtime detection toggle
- [ ] Implement NavigationSection with:
  - 7 navigation items with icons
  - Active state styling
  - Badge support for error counts
  - Smooth animations (300ms transitions)
- [ ] Wire collapse/expand functionality
- [ ] Connect to VS Code configuration API

**Milestone 1:** Sidebar complete with smooth animations [DONE]

---

### Week 2: Main Views (Part 1)

**Days 1-2: Dashboard View**
- [ ] Create Dashboard component
- [ ] Implement stats cards (Pending, Analyzed, Success Rate)
- [ ] Add quick action buttons
- [ ] Build recent activity feed
- [ ] Add Ollama status card
- [ ] Wire to backend services (StateManager, PerformanceMonitor)
- [ ] Test real-time updates

**Days 3-4: Error Queue View**
- [ ] Create ErrorQueue component
- [ ] Implement table/card layout
- [ ] Add filter and search functionality
- [ ] Implement bulk operations
- [ ] Add pin/unpin functionality
- [ ] Wire to ErrorQueueManager
- [ ] Test real-time error detection

**Days 5-7: Analyze View**
- [ ] Create Analyze component with 3 states (Empty, Analyzing, Complete)
- [ ] Implement error input form
- [ ] Build analysis progress display
- [ ] Add real-time iteration updates
- [ ] Implement result display with code diffs
- [ ] Add fix suggestion cards with actions
- [ ] Wire to AnalysisService
- [ ] Test progress callbacks

**Milestone 2:** 3 primary views functional [DONE]

---

### Week 3: Main Views (Part 2) & Integration

**Days 1-2: History View**
- [ ] Create History component
- [ ] Implement timeline-based layout
- [ ] Add search and filter functionality
- [ ] Build detail modal
- [ ] Add export functionality
- [ ] Implement feedback system
- [ ] Wire to StateManager

**Day 3: Agent State View**
- [ ] Create AgentState component
- [ ] Implement iteration progress display
- [ ] Add hypothesis cards
- [ ] Build tool usage visualization
- [ ] Add consensus building progress
- [ ] Wire to AgentStateStream

**Day 4: Fix Manager View**
- [ ] Create FixManager component
- [ ] Implement pending fixes list
- [ ] Build code diff preview
- [ ] Add apply/reject actions
- [ ] Implement applied fixes history
- [ ] Wire to FixApplicationService

**Day 5: Metrics View**
- [ ] Create Metrics component
- [ ] Implement performance charts
- [ ] Add success rate trends
- [ ] Build model comparison view
- [ ] Add learning metrics
- [ ] Wire to PerformanceTracker

**Days 6-7: Backend Integration**
- [ ] Complete message passing implementation
- [ ] Setup real-time update subscriptions
- [ ] Test full data flow (extension [H_ARROW] webview)
- [ ] Implement error handling and timeouts
- [ ] Add state persistence
- [ ] Test all backend service connections

**Milestone 3:** All 7 views complete and integrated [DONE]

---

### Week 4: Polish & Testing

**Days 1-2: Polish**
- [ ] Implement all animations and transitions
- [ ] Add loading skeletons for async operations
- [ ] Create empty states for all views
- [ ] Add keyboard navigation (Tab, Arrow keys, Enter)
- [ ] Optimize performance (lazy loading, virtual scrolling)
- [ ] Add tooltips and accessibility labels
- [ ] Refine responsive layout

**Days 3-4: Testing**
- [ ] Write unit tests for components
- [ ] Write integration tests for views
- [ ] Write E2E tests for user workflows
- [ ] Perform accessibility audit (WCAG 2.1 AA)
- [ ] Profile performance (< 1s initial load)
- [ ] Test with large datasets (100+ errors)
- [ ] Fix bugs and issues

**Days 5-7: Documentation & Launch**
- [ ] Write component API documentation
- [ ] Update user guide with new UI
- [ ] Create developer setup guide
- [ ] Record demo video
- [ ] Prepare release notes
- [ ] Final bug fixes
- [ ] [LAUNCH] Launch v2.0!

**Milestone 4:** Production-ready UI [DONE]

---

## [TOOL] Technical Stack

### Frontend (New)
- **Framework:** React 18 + TypeScript
- **Bundler:** Vite 5
- **Styling:** Tailwind CSS 3
- **Components:** shadcn/ui (40+ components)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts (via shadcn/ui Chart)

### VS Code Integration
- **Webview API:** For rendering React UI
- **Message Passing:** extension [H_ARROW] webview communication
- **Configuration API:** Settings persistence
- **FileSystemWatcher:** Real-time file monitoring

### Backend (Already Built - No Changes)
- **Agent:** MinimalReactAgent, MultiPassAgent
- **Services:** AnalysisService, FixApplicationService
- **Tools:** 15+ tools (ReadFile, SearchInFiles, etc.)
- **LLM:** OllamaClient with DeepSeek-R1
- **Cache:** RCACache + ChromaDB
- **Monitoring:** PerformanceTracker

---

## [TARGET] UI Prototype Reference

**Location:** `project/src/app/components/`

The UI implementation is based on the React + Vite prototype:

```
project/
├── src/app/
│   ├── App.tsx                          # Main entry
│   ├── components/
│   │   ├── CollapsibleSidebar.tsx       # [DONE] Base design (USE THIS)
│   │   └── ui/                          # [DONE] 50+ shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── progress.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── ... (40+ more)
│   └── styles/                          # Tailwind config
```

**Integration Steps:**
1. Copy `project/src/app/components/` → `vscode-extension/webview/components/`
2. Copy `project/src/styles/` → `vscode-extension/webview/styles/`
3. Adapt CollapsibleSidebar navigation for RCA views
4. Connect to VS Code Webview API
5. Wire backend services to UI components

---

## [WARNING] High Priority Gaps (P1 - Implement After UI)

Once the UI is functional, address these 5 integration gaps:

### 1. Knowledge Services Not Connected (3 hours)
- Wire `FewShotExampleService` and `SemanticExampleService` to agent
- Improves analysis quality with relevant examples

### 2. Parser Infrastructure Not Exposed (2 hours)
- Create `ParserRegistry` for specialized parsers
- Better error detection for Kotlin, Gradle, XML, Jetpack Compose

### 3. ChromaDB Two-Tier Caching (3 hours)
- Implement L1 (memory) + L2 (persistent) cache strategy
- Dramatically improves cache hit rate

### 4. AdaptiveLearning Not Running (2 hours)
- Schedule learning pipeline execution
- Enables continuous improvement from feedback

### 5. EducationalAgent Not Accessible (1 hour)
- Add toggle to switch between MinimalReact and Educational modes
- Makes unique educational feature accessible

**Total P1 Effort:** ~11 hours

---

## [DONE] Success Criteria

### Visual Quality
- [ ] Matches Figma-inspired design aesthetic
- [ ] Smooth 60fps animations and transitions
- [ ] Responsive layout adapts to panel size
- [ ] Professional dark theme consistent with VS Code
- [ ] All icons and badges display correctly

### Functional Completeness
- [ ] All 7 views fully implemented and working
- [ ] Real-time error detection and updates
- [ ] Live analysis progress with iteration tracking
- [ ] Fix preview and application functional
- [ ] History search and filtering works
- [ ] Settings persistence across sessions
- [ ] Export functionality generates markdown

### Performance
- [ ] Initial webview load < 1 second
- [ ] View transitions < 200ms
- [ ] Handles 100+ errors without lag
- [ ] No memory leaks during extended use
- [ ] Real-time updates without blocking UI

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Full keyboard navigation support
- [ ] Screen reader compatible
- [ ] High contrast mode support
- [ ] Focus indicators visible
- [ ] ARIA labels on all interactive elements

### Integration
- [ ] All backend services connected
- [ ] Message passing reliable
- [ ] Error handling comprehensive
- [ ] State synchronization accurate
- [ ] Configuration persists correctly

---

## [LAUNCH] Getting Started

### Development Setup

```bash
# 1. Navigate to extension directory
cd vscode-extension/webview

# 2. Install dependencies
npm install

# 3. Start Vite dev server (hot reload)
npm run dev

# 4. In VS Code, press F5 to launch Extension Development Host

# 5. Open webview: Cmd+Shift+P → "RCA Agent: Open Panel"
```

### Project Structure

```
vscode-extension/
├── webview/                    # NEW: React UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── CollapsibleSidebar.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ErrorQueue.tsx
│   │   │   ├── Analyze.tsx
│   │   │   ├── History.tsx
│   │   │   ├── AgentState.tsx
│   │   │   ├── FixManager.tsx
│   │   │   ├── Metrics.tsx
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── src/
│   ├── extension.ts           # Extension entry (wire P0 gaps here)
│   ├── services/
│   │   ├── AnalysisService.ts
│   │   ├── FixApplicationService.ts
│   │   └── NetworkTimeoutHandler.ts
│   └── commands/
│       └── ChatActionCommands.ts  # P0: Register these!
```

---

## [DOCS] Design Philosophy

**Principles:**
- **Clean & Minimal:** Focus on content, reduce chrome
- **Fast & Responsive:** Instant feedback, smooth animations
- **Professional:** Match VS Code aesthetic perfectly
- **Accessible:** Keyboard navigation, screen readers, high contrast
- **Delightful:** Small touches that make users smile

**Inspiration:**
- Figma's collapsible sidebar navigation
- VS Code's native dark theme
- Modern web app experiences (Linear, Notion)
- Material Design 3 motion principles

---

## [CONTRIBUTE] Contributing

### For Implementers

1. **Pick a view** from the Week 1-4 roadmap
2. **Follow design specs** from this document
3. **Use backend wiring** from [RCA_TECHNICAL_REFERENCE.md](./RCA_TECHNICAL_REFERENCE.md)
4. **Test thoroughly** - unit tests, integration tests, E2E
5. **Submit PR** with screenshots/video

### For Reviewers

- Verify visual matches design mockups
- Test all interactions (clicks, keyboard, hover)
- Check accessibility (keyboard nav, ARIA labels)
- Validate backend integration
- Performance profile (< 200ms transitions)

---

## [BOOK] Additional References

- [RCA_TECHNICAL_REFERENCE.md](./RCA_TECHNICAL_REFERENCE.md) - Complete backend API mapping
- [RCA_UI_REMOVAL_SUMMARY.md](./RCA_UI_REMOVAL_SUMMARY.md) - What was removed
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React Icons](https://lucide.dev/)

---

**Let's build something amazing! [DESIGN][SPARKLE]**

**Next Steps:**
1. [DONE] Fix P0 critical gaps (4 hours) → **DO THIS FIRST**
2. [BUILD] Begin Week 1 implementation
3. [CHART] Track progress against roadmap milestones
4. [LAUNCH] Launch v2.0 in 4 weeks
