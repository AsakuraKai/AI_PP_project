# RCA Agent UI Implementation Roadmap

**Last Updated**: January 9, 2026  
**Status**: [DESIGN] Design Approved → [BUILD] Ready to Build

---

## [TARGET] Project Overview

Transform RCA Agent from traditional VS Code UI to a modern, Figma-inspired interface with:
- Elegant collapsible sidebar navigation
- 7 specialized views for different workflows  
- React-based UI with shadcn/ui components
- Professional dark theme matching VS Code
- All backend services already functional

---

## [LIST] Documents

| Document | Purpose | Status |
|----------|---------|--------|
| [RCA_UI_FIGMA_PLAN.md](./RCA_UI_FIGMA_PLAN.md) | Visual design, mockups, views | [DONE] Complete |
| [RCA_UI_WIRING_GUIDE.md](./RCA_UI_WIRING_GUIDE.md) | Backend API mapping | [DONE] Updated |
| [RCA_UI_REMOVAL_SUMMARY.md](./RCA_UI_REMOVAL_SUMMARY.md) | What was removed | [DONE] Complete |
| This document | Implementation roadmap | [DONE] Complete |

---

## [CALENDAR] Timeline (4 Weeks)

### Week 1: Foundation & Sidebar
**Days 1-3: Setup**
- [ ] Setup Vite + React + TypeScript for webview
- [ ] Configure Tailwind with RCA color theme
- [ ] Import shadcn/ui component library (40+ components)
- [ ] Setup VS Code webview integration
- [ ] Configure message passing (extension [H_ARROW] webview)

**Days 4-7: Sidebar**
- [ ] Build CollapsibleSidebar component
- [ ] Implement SettingsSection (replaces date)
  - Model configuration
  - Ollama connection status
  - Quick toggles
- [ ] Implement NavigationSection
  - 7 navigation items with icons
  - Active state styling
  - Badge support for error counts
- [ ] Wire collapse/expand animations (300ms transitions)
- [ ] Connect to VS Code configuration API

**Milestone:** Sidebar complete with smooth animations [DONE]

---

### Week 2: Main Views (Part 1)

**Days 1-2: Dashboard View**
- [ ] Stats cards (Pending Errors, Analyses Today, Success Rate)
- [ ] Quick action buttons
- [ ] Recent activity feed
- [ ] Ollama status card
- [ ] Wire to backend services

**Days 3-4: Error Queue View**
- [ ] Error list with table/card layout
- [ ] Filter and search functionality
- [ ] Bulk operations (select multiple, analyze all)
- [ ] Real-time updates
- [ ] Wire to ErrorQueueManager

**Days 5-7: Analyze View**
- [ ] Manual error input form
- [ ] Analysis progress display
- [ ] Real-time agent iteration updates
- [ ] Result display with code diffs
- [ ] Apply fix buttons
- [ ] Wire to AnalysisService

**Milestone:** 3 primary views functional [DONE]

---

### Week 3: Main Views (Part 2) & Integration

**Days 1-2: History View**
- [ ] Timeline-based history display
- [ ] Search and filter functionality
- [ ] Detail modal for viewing past analyses
- [ ] Export functionality
- [ ] Wire to StateManager

**Day 3: Agent State View**
- [ ] Real-time iteration display
- [ ] Hypothesis cards
- [ ] Tool usage visualization
- [ ] Consensus building progress
- [ ] Wire to analysis progress callbacks

**Day 4: Fix Manager View**
- [ ] Pending fixes list
- [ ] Code diff preview
- [ ] Apply/reject actions
- [ ] Applied fixes history
- [ ] Wire to FixApplicationService

**Day 5: Metrics View**
- [ ] Performance charts
- [ ] Success rate trends
- [ ] Model comparison
- [ ] Learning metrics

**Days 6-7: Backend Integration**
- [ ] Complete message passing implementation
- [ ] Setup all real-time update subscriptions
- [ ] Test full data flow (extension [H_ARROW] webview)
- [ ] Error handling and timeouts
- [ ] State persistence

**Milestone:** All 7 views complete and integrated [DONE]

---

### Week 4: Polish & Testing

**Days 1-2: Polish**
- [ ] Implement all animations and transitions
- [ ] Add loading skeletons
- [ ] Create empty states for all views
- [ ] Add keyboard navigation
- [ ] Optimize performance (lazy loading, virtual scrolling)

**Days 3-4: Testing**
- [ ] Unit tests for components
- [ ] Integration tests for views
- [ ] E2E tests for user workflows
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance profiling

**Days 5-7: Documentation & Launch**
- [ ] Component API documentation
- [ ] User guide updates
- [ ] Developer setup guide
- [ ] Record demo video
- [ ] Final bug fixes
- [ ] [LAUNCH] Launch!

**Milestone:** Production-ready UI [DONE]

---

## [DESIGN] Design System

### Layout
- **Sidebar**: 224px expanded, 64px collapsed (300ms transition)
- **Main Content**: Flex-1, responsive padding
- **Max Content Width**: 1280px (max-w-6xl)

### Colors
```typescript
primary: '#030213'    // Deep blue-black
sidebar: '#000000'    // Pure black
content: '#0a0a0a'    // zinc-950
cards: '#171717'      // zinc-900
borders: '#27272a'    // zinc-800
text: '#ffffff'       // White
textMuted: '#a1a1aa'  // zinc-400
accent: '#3b82f6'     // Blue
```

### Typography
- Headings: System font, font-light (300)
- Body: 14px, line-height 1.5
- Code: JetBrains Mono

---

## [TOOL] Technical Stack

**Frontend:**
- React 18 + TypeScript
- Vite (bundling)
- Tailwind CSS (styling)
- shadcn/ui (components)
- Lucide React (icons)
- Framer Motion (animations)

**VS Code Integration:**
- Webview API
- Message passing
- Configuration API
- FileSystemWatcher

**Backend (Already Built):**
- AnalysisService
- ErrorQueueManager
- StateManager
- FixApplicationService
- MultiPassAgent
- OllamaClient

---

## [CHART] Navigation Structure

| Icon | Route | View | Purpose |
|------|-------|------|---------|
| [HOME] | `/` | Dashboard | Overview & quick actions |
| [WARNING] | `/errors` | Error Queue | Browse & manage errors |
| [SEARCH] | `/analyze` | Analyze | Interactive analysis |
| [SCROLL] | `/history` | History | Past analyses |
|  | `/agent` | Agent State | Real-time visualization |
|  | `/fixes` | Fix Manager | Review & apply fixes |
|  | `/metrics` | Metrics | Performance stats |

---

##  Success Criteria

### Visual
- [ ] Matches Figma design aesthetic
- [ ] Smooth 60fps animations
- [ ] Responsive layout works
- [ ] Professional dark theme

### Functional
- [ ] All 7 views implemented
- [ ] Real-time error detection
- [ ] Live analysis progress
- [ ] Fix preview and application
- [ ] History with search
- [ ] Settings persistence

### Performance
- [ ] Initial load < 1s
- [ ] View transitions < 200ms
- [ ] Handles 100+ errors
- [ ] No memory leaks

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Full keyboard navigation
- [ ] Screen reader support
- [ ] High contrast mode

---

##  Getting Started

### Prerequisites
```bash
# Ensure Node.js 18+ installed
node --version

# Install dependencies
cd vscode-extension/webview
npm install
```

### Development
```bash
# Start Vite dev server
npm run dev

# Watch mode (VS Code extension)
npm run watch

# Build for production
npm run build
```

### Testing in VS Code
1. Open extension workspace
2. Press F5 to launch Extension Development Host
3. Open webview: `Cmd+Shift+P` → "RCA Agent: Open Panel"
4. Test all views and interactions

---

##  Key Features by View

### Dashboard
- Live error count
- Today's analysis stats
- Success rate trends
- Quick actions
- Ollama status

### Error Queue
- Real-time error detection
- Filter by status
- Bulk analyze
- Pin important errors
- Jump to source

### Analyze
- Manual error input
- Live progress tracking
- Agent thought process
- Fix suggestions
- Code diff preview

### History
- Timeline view
- Full-text search
- Reanalyze past errors
- Export to markdown
- Feedback system

### Agent State
- Iteration progress
- Hypothesis evolution
- Tool usage tracking
- Consensus building
- Live updates

### Fix Manager
- Pending fixes queue
- Code diff preview
- Apply/reject actions
- Batch operations
- Applied fixes history

### Metrics
- Success rate charts
- Average analysis time
- Error type distribution
- Model performance
- Learning analytics

---

##  Notes

### From Figma Concept
The original Figma design used generic navigation items (Home, Files, YouTube, etc.). We've mapped these to RCA-specific features:

| Figma Item | RCA Feature |
|-----------|-------------|
| Date Display | Settings Panel |
| Home | Dashboard |
| Files | Error Queue |
| YouTube | Analyze |
| Spotify | History |
| Camera | Agent State |
| Chrome | Fix Manager |
| Twitter | Metrics |

### Design Philosophy
- **Clean & Minimal**: Focus on content, not chrome
- **Fast & Responsive**: Instant feedback, smooth animations
- **Professional**: Match VS Code aesthetic
- **Accessible**: Keyboard navigation, screen readers
- **Delightful**: Small touches that make users smile

---

##  Contributing

Once implementation begins:

1. Pick a view from the roadmap
2. Follow the design specs in [RCA_UI_FIGMA_PLAN.md](./RCA_UI_FIGMA_PLAN.md)
3. Use backend wiring from [RCA_UI_WIRING_GUIDE.md](./RCA_UI_WIRING_GUIDE.md)
4. Test thoroughly
5. Submit PR with screenshots

---

##  References

- [Figma Design Plan](./RCA_UI_FIGMA_PLAN.md)
- [Backend Wiring Guide](./RCA_UI_WIRING_GUIDE.md)
- [UI Removal Summary](./RCA_UI_REMOVAL_SUMMARY.md)
- [shadcn/ui](https://ui.shadcn.com/)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)

---

**Let's build something amazing! **
