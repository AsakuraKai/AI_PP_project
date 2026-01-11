# RCA Agent - Design Vision & Overview

**Created:** January 9, 2026  
**Completed:** January 10, 2026  
**Status:** ✅ [COMPLETE] Implementation Complete

---

## [TARGET] Project Vision

Transform RCA Agent from traditional VS Code UI to a **modern, Figma-inspired interface**:

- Elegant collapsible sidebar navigation (black #000000)
- 7 specialized views for different workflows
- React + Vite + shadcn/ui components
- Professional dark theme with smooth animations
- All backend services already functional

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
│  ├─ [HISTORY] History │   • Performance Metrics   │
│  ├─ [AGENT] Agent  │                             │
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
  sidebar: '#000000',      // Pure black sidebar
  main: '#0a0a0a',         // zinc-950 main area
  card: '#18181b',         // zinc-900 cards
  hover: '#27272a',        // zinc-800 hover
  border: '#3f3f46',       // zinc-700 borders
  
  // Text
  primary: '#fafafa',      // zinc-50 primary text
  secondary: '#a1a1aa',    // zinc-400 secondary
  muted: '#71717a',        // zinc-500 muted
  
  // Status Colors
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

## [MOBILE] Navigation Structure

### 7 Main Views

| Icon | Label | Route | Purpose |
|------|-------|-------|---------|| [HOME] | Dashboard | `/` | Overview, stats, quick actions |
| [WARNING] | Error Queue | `/errors` | Browse & manage errors |
| [SEARCH] | Analyze | `/analyze` | Interactive analysis |
| [LIST] | History | `/history` | Past analyses |
| [BRAIN] | Agent State | `/agent` | Real-time visualization |
| [TOOL] | Fix Manager | `/fixes` | Review & apply fixes |
| [CHART] | Metrics | `/metrics` | Performance stats |

### Settings Section

**Features:**
- Quick model selection dropdown
- Ollama connection status indicator ([OK]/[X])
- Theme toggle
- Educational mode toggle
- Realtime detection toggle

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
- **Message Passing:** extension ↔ webview communication
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
│   │       └── ... (40+ more)
│   └── styles/                          # Tailwind config
```

**Integration Steps:**
1. Copy `project/src/app/components/` → `vscode-extension/webview/components/`
2. Copy `project/src/styles/` → `vscode-extension/webview/styles/`
3. Adapt CollapsibleSidebar navigation for RCA views
4. Connect to VS Code Webview API

---

## [BUILD] Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│         React UI (Webview)                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Dashboard  │  │ ErrorQueue │  │  Analyze   │    │
│  └────────────┘  └────────────┘  └────────────┘    │
└────────────────────┬─────────────────────────────────┘
                     │ Message Passing (postMessage)
                     ↓
┌──────────────────────────────────────────────────────┐
│    VS Code Extension (vscode-extension/src/)         │
│  ┌──────────────────────────────────────────────┐   │
│  │  Frontend Services (services/)               │   │
│  │  • AnalysisService                           │   │
│  │  • FixApplicationService                     │   │
│  │  • NetworkTimeoutHandler                     │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────┘
                     │ Direct Imports
                     ↓
┌──────────────────────────────────────────────────────┐
│       Core Backend (src/)                            │
│  • Agents (16 components)                            │
│  • Tools (15+ tools)                                 │
│  • LLM Integration                                   │
│  • Caching & Monitoring                              │
└──────────────────────────────────────────────────────┘
```

---

## [TIMER] Implementation Timeline

- **Week 1:** Foundation & Sidebar
- **Week 2:** Main Views (Dashboard, Errors, Analyze)
- **Week 3:** Main Views (History, Agent, Fixes, Metrics) + Integration
- **Week 4:** Polish, Testing, Launch

**Total Duration:** 4 weeks

---

## [DOCS] Next Steps

1. Review [Phase 1 - Foundation](phases/phase-1-foundation/README.md)
2. Fix P0 Critical Gaps first
3. Follow week-by-week implementation guide
4. Reference technical docs as needed

---

**Related Documents:**
- [Implementation Phases](phases/)
- [Technical Reference](technical/)
- [Integration Gaps](technical/INTEGRATION_GAPS.md)
