# ChatBox UI: Complete Implementation Guide

**Date:** January 18, 2026  
**Status:** Implementation Planning  
**Design Reference:** `Figma/Replicate UI Design/src/app/components/ChatBox.tsx`

---

## [DOCS] Documentation Structure

**⚠️ IMPORTANT: This is the ORIGINAL comprehensive guide. For organized, focused documentation, see:**

### **📚 [Start Here: Document Index](./INDEX.md)**

The implementation guide has been divided into focused, actionable documents:

- **[00-Overview](./00-Overview/README.md)** - Project overview and quick start
- **[01-Architecture](./01-Architecture/README.md)** [CRITICAL] - Single component architecture
- **[02-System-Design](./02-System-Design/README.md)** - Complete system architecture
- **[04-Context-System](./04-Context-System/README.md)** - Context-aware conversations
- **[Phase-1-Foundation](./Phase-1-Foundation/README.md)** - Week 1-2 implementation guide
- **[Quick-Reference](./Quick-Reference/README.md)** - Fast lookup for developers

**This Original Document (CHATBOX_UI_IMPLEMENTATION_GUIDE.md):**
Retained as the comprehensive single-document reference containing ALL details:
- Complete architecture (frontend + backend)
- Phase-by-phase implementation roadmap (8 phases)
- Component specifications and code examples
- Data models and API contracts
- Integration with existing RCA views
- Testing strategy and success metrics

**Backend Roadmap:**
--> [CONVERSATIONAL_RCA_ROADMAP.md](./CONVERSATIONAL_RCA_ROADMAP.md) - Backend strategy overview:
- High-level vision and goals
- What's being built and why
- Timeline summary
- Success targets

---

## 🚀 Quick Navigation

**For Developers:**
1. Read [INDEX.md](./INDEX.md) for document map
2. Start with [00-Overview](./00-Overview/README.md)
3. **MUST READ:** [01-Architecture](./01-Architecture/README.md) (Single component pattern)
4. Begin implementing with [Phase-1-Foundation](./Phase-1-Foundation/README.md)

**For Quick Reference:**
- [Quick-Reference](./Quick-Reference/README.md) - File locations, constants, patterns

**For Complete Details:**
- Continue reading this document below

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Design](#architecture-design)
3. [Current RCA Views](#current-rca-views)
4. [Floating Widget Integration](#floating-widget-integration)
5. [Component Navigation](#component-navigation)
6. [Context-Aware Conversations](#context-aware-conversations)
7. [Implementation Phases](#implementation-phases)
8. [Technical Specifications](#technical-specifications)
9. [Testing Strategy](#testing-strategy)
10. [Integration Points](#integration-points)

---

## Overview

### Purpose

Transform RCA from a **one-shot analysis tool** into an **interactive debugging assistant** by adding a floating chat interface that:

1. **Engages in Dialogue**: Users can ask follow-up questions and refine analyses
2. **Iterates Continuously**: RCA refines analysis based on feedback
3. **Learns Contextually**: Each interaction improves future analyses
4. **Provides Rich Feedback**: Beyond thumbs up/down
5. **Acts Proactively**: RCA asks clarifying questions when uncertain

### Success Criteria

- **70%+ adoption rate** among users who complete initial analysis
- **Average 2.5+ turns** per conversation (indicating engagement)
- **40%+ improvement** in analysis accuracy after refinement
- **Reduced re-analysis rate** by 35%

### What's Already Built (Reusable)

[OK] **Existing Infrastructure:**
- Modern React webview with Tailwind CSS
- VS Code message passing architecture
- ReAct Agent with multi-iteration support
- Feedback system (FeedbackHandler)
- Learning pipeline (AdaptiveLearning)
- State streaming for real-time updates
- History management and persistence
- 7 existing views (Dashboard, Error Queue, Analyze, etc.)

### Design Location
- **New Design:** `Figma/Replicate UI Design/src/app/components/ChatBox.tsx`
- **Design System:** `Figma/Replicate UI Design/src/app/components/ui/*`
- **Implementation Target:** `vscode-extension/webview/src/`

### Integration Approach
**[PRIMARY] Floating Widget Pattern** - A persistent, collapsible chatbox overlay that appears on all views, providing context-aware conversational assistance regardless of which tab the user is viewing.

---

## [ARCH] Single Component Architecture [CRITICAL]

### Design Principle

**The ChatWidget is a SINGLE React component instance** that exists throughout the application lifecycle.

#### [YES] **Correct Implementation**

```tsx
// App.tsx - CORRECT: Single instance outside routing
function App() {
  return (
    <ConversationProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/errors" element={<ErrorQueue />} />
            <Route path="/analyze" element={<Analyze />} />
            {/* ... other routes */}
          </Routes>
        </main>
      </div>
      {/* SINGLE ChatWidget for ALL views */}
      <ChatWidget context={currentContext} />
    </ConversationProvider>
  );
}
```

#### ❌ **Incorrect Implementation**

```tsx
// WRONG: Separate instance per route
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ChatWidget /> {/* ❌ Don't do this */}
    </div>
  );
}

function ErrorQueue() {
  return (
    <div>
      <h1>Errors</h1>
      <ChatWidget /> {/* ❌ Don't do this */}
    </div>
  );
}
```

### Component Behavior Across Views

#### What Changes:
- **Context data** (which view is active)
- **Suggested prompts** (view-specific quick actions)
- **Context indicator badge** (shows "Dashboard", "Errors", etc.)
- **Internal state** (e.g., which analysis is being discussed)

#### What NEVER Changes:
- **Component instance** (same React component)
- **DOM position** (fixed bottom-right)
- **Conversation history** (maintained across navigation)
- **Expanded/collapsed state** (unless configured otherwise)
- **Component structure** (same JSX tree)
- **Event listeners** (same handlers)

### Visual Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│                                                           │
│  ┌─────────────┐  ┌──────────────────────────────────┐  │
│  │   Sidebar   │  │     Main Content Area            │  │
│  │             │  │  (Routes change, widget stays)   │  │
│  │  Dashboard  │  │  ┌────────────────────────────┐  │  │
│  │  Errors     │  │  │  Dashboard View            │  │  │
│  │  Analyze  ←─┼──┼─→│  OR Error Queue View       │  │  │
│  │  History    │  │  │  OR Analyze View           │  │  │
│  │  Agent      │  │  │  OR ...                    │  │  │
│  │  Fixes      │  │  └────────────────────────────┘  │  │
│  │  Metrics    │  │                                   │  │
│  └─────────────┘  └──────────────────────────────────┘  │
│                                                           │
│         ┌─────────────────────────────────────┐          │
│         │    ChatWidget (Floating Overlay)    │          │
│         │  ┌───────────────────────────────┐  │          │
│         │  │ Context: [Active View]        │  │          │
│         │  │ Position: Fixed bottom-right  │  │          │
│         │  │ State: Persists across nav    │  │          │
│         │  │ Instance: SINGLE component    │  │          │
│         │  └───────────────────────────────┘  │          │
│         └─────────────────────────────────────┘          │
│              ↑ Same component, always present             │
└──────────────────────────────────────────────────────────┘
```

### Implementation Requirements

**[YES] MUST:**
1. Render ChatWidget **outside** `<Routes>` component
2. Use React Context to provide conversation state globally
3. Update context prop when route changes (not remount component)
4. Maintain conversation state in parent context/provider
5. Use `position: fixed` CSS for overlay behavior

**[NO] MUST NOT:**
1. Render ChatWidget inside individual route components
2. Use route-based conditional rendering for the widget
3. Unmount/remount ChatWidget on navigation
4. Store conversation state in route component state
5. Use route-dependent positioning

### Navigation Flow Example

```typescript
// User Journey:
User on Dashboard → Opens ChatWidget → Asks question
  ↓
ChatWidget expands, conversation starts
  ↓
User navigates to Error Queue (clicks sidebar)
  ↓
App.tsx updates currentRoute = '/errors'
  ↓
ChatWidget receives new context prop: { viewType: 'errors', ... }
  ↓
ChatWidget updates:
  - Context indicator badge: "Dashboard" → "Error Queue"
  - Suggested prompts: [...errorQueuePrompts]
  - Internal context state
  ↓
ChatWidget DOES NOT:
  - Unmount/remount [NO]
  - Clear conversation history [NO]
  - Reset expanded state [NO]
  - Change position [NO]
```

### Performance Benefits

**Single Instance Advantages:**
- **No re-mounting overhead** on navigation
- **Preserved scroll position** in conversation
- **Cached message rendering** (React keeps component tree)
- **Reduced memory allocation** (no duplicate instances)
- **Smooth animations** (no abrupt DOM changes)

### Visual Comparison: Single vs Multiple Instances

#### Single Instance (Correct) [YES]

```
User Journey:
Dashboard (ChatWidget present)
  ↓ Navigate to Errors
Error Queue (SAME ChatWidget, context updated)
  ↓ Navigate to Analyze
Analyze (SAME ChatWidget, context updated)

Conversation: Continuous, uninterrupted
State: Preserved
Performance: No re-mounting
```

#### Multiple Instances (Incorrect) [NO]

```
User Journey:
Dashboard (ChatWidget instance 1)
  ↓ Navigate to Errors
  ↓ Instance 1 destroyed
Error Queue (ChatWidget instance 2 created)
  ↓ Navigate to Analyze
  ↓ Instance 2 destroyed
Analyze (ChatWidget instance 3 created)

Conversation: Lost on each navigation
State: Reset on each navigation
Performance: Mounting overhead
```

### Step-by-Step Navigation Flow

```typescript
// Detailed flow when user navigates Dashboard → Error Queue

1. User clicks "Errors" in sidebar
   └─ React Router updates location

2. App.tsx detects route change
   └─ currentRoute: '/' → '/errors'

3. App.tsx updates ChatWidget prop
   └─ context: { viewType: 'dashboard' } 
       → { viewType: 'errors' }

4. ChatWidget receives new context prop
   └─ React re-renders component (same instance)
   └─ Updates internal UI elements:
       - Context badge: "Dashboard" → "Error Queue"
       - Suggested prompts: [...errorQueuePrompts]
       - Sends context change to backend

5. ChatWidget DOES NOT:
   [NO] Unmount
   [NO] Remount
   [NO] Clear conversation
   [NO] Reset state
   [NO] Change position
```

### Common Mistakes to Avoid

#### [NO] Mistake 1: Conditional Rendering in Routes

```tsx
// WRONG
<Routes>
  <Route path="/" element={
    <>
      <Dashboard />
      <ChatWidget /> {/* [NO] Unmounts on navigation */}
    </>
  } />
</Routes>
```

#### [NO] Mistake 2: Separate Context Providers Per View

```tsx
// WRONG
function Dashboard() {
  return (
    <ConversationProvider> {/* [NO] New context per view */}
      <DashboardContent />
      <ChatWidget />
    </ConversationProvider>
  );
}
```

#### [NO] Mistake 3: Key Prop Based on Route

```tsx
// WRONG - Forces remount on navigation
<ChatWidget 
  key={currentRoute} {/* [NO] New key = new instance */}
  context={...}
/>
```

#### [YES] Correct Pattern: Single Instance Outside Routes

```tsx
// CORRECT
function App() {
  const [currentRoute, setCurrentRoute] = useState('/');

  return (
    <ConversationProvider>
      <Sidebar />
      
      {/* Route-based content */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/errors" element={<ErrorQueue />} />
        {/* ...other routes */}
      </Routes>
      
      {/* SINGLE ChatWidget - outside routing */}
      <ChatWidget context={{ viewType: getViewType(currentRoute) }} />
    </ConversationProvider>
  );
}
```

### Benefits Summary

#### 1. **User Experience**
- Seamless conversation across views
- No interruption when navigating
- Maintains user's mental context
- Preserved expanded/collapsed preference

#### 2. **Performance**
- No unmounting/remounting overhead
- React keeps component tree cached
- No memory allocation per navigation
- Smooth animations (no abrupt DOM changes)

#### 3. **State Management**
- Single source of truth
- Simpler state synchronization
- No need to sync across instances
- Easier debugging

#### 4. **Code Quality**
- Cleaner architecture
- Less prop drilling
- Centralized conversation logic
- Easier to maintain

### Testing Checklist

#### Unit Tests

- [ ] ChatWidget renders in App.tsx
- [ ] Component does not remount on route change
- [ ] Context prop updates trigger re-render (not remount)
- [ ] Conversation state persists across navigation
- [ ] Expanded state persists across navigation
- [ ] Scroll position maintained in message list
- [ ] Event handlers remain attached

#### Integration Tests

- [ ] Navigate between all 7 views
- [ ] Verify same component instance throughout
- [ ] Start conversation in Dashboard, continue in Errors
- [ ] Check scroll position maintained
- [ ] Verify no memory leaks after 100+ navigations
- [ ] Test context updates correctly for each view
- [ ] Verify suggested prompts change per view

#### Manual Testing

- [ ] Open ChatWidget in Dashboard
- [ ] Type message but don't send
- [ ] Navigate to Error Queue
- [ ] Verify unsent message still in input field
- [ ] Verify conversation history visible
- [ ] Verify widget stays in same position
- [ ] Test expand/collapse state persists
- [ ] Check context badge updates correctly

### FAQ

#### Q: Does the chatbox look different on different views?

**A:** Only minor UI elements update:
- Context badge text ("Dashboard" → "Error Queue")
- Suggested action buttons (view-specific)
- Internal state data

The component structure, position, and conversation remain identical.

#### Q: What if I want view-specific behavior?

**A:** Use the `context` prop to conditionally render elements inside ChatWidget:

```tsx
function ChatWidget({ context }) {
  const suggestedActions = useMemo(() => {
    return getSuggestedActionsForView(context.viewType);
  }, [context.viewType]);
  
  return (
    <div className="chat-widget">
      {/* Same structure, different data */}
      <SuggestedActions items={suggestedActions} />
    </div>
  );
}
```

#### Q: Does this work with code splitting?

**A:** Yes! ChatWidget can be lazy-loaded:

```tsx
const ChatWidget = lazy(() => import('./components/conversation/ChatWidget'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatWidget context={...} />
    </Suspense>
  );
}
```

The component still won't remount on navigation once loaded.

#### Q: How do I test this in development?

**A:** 
1. Add `useEffect` with console.log in ChatWidget:
```tsx
useEffect(() => {
  console.log('ChatWidget mounted');
  return () => console.log('ChatWidget unmounted');
}, []);
```

2. Navigate between views
3. Should see "mounted" once, never "unmounted"

#### Q: What about performance on mobile/slow devices?

**A:** The single instance pattern is especially beneficial for performance-constrained environments:
- Reduced React reconciliation work
- Lower memory footprint
- Fewer layout recalculations
- Smoother transitions

#### Q: Can I still pass different props to the widget?

**A:** Yes! The widget accepts dynamic props:
- `context`: Changes based on active view
- `analysisId`: Updates when discussing different analyses
- Any other props can update without remounting

Only the component *instance* stays the same, not the props.

---

## Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Chat Interface (new)                                        │
│  ├─ ChatWidget.tsx               <- Floating container       │
│  ├─ ConversationView.tsx         <- Main chat UI            │
│  ├─ MessageBubble.tsx            <- Individual messages      │
│  ├─ ChatInput.tsx                <- Input with auto-resize   │
│  ├─ ContextIndicator.tsx         <- View context display     │
│  ├─ SuggestedActions.tsx         <- Quick action buttons     │
│  ├─ FeedbackPanel.tsx            <- Rich feedback form       │
│  ├─ ClarificationPrompt.tsx      <- Agent questions          │
│  └─ DiffView.tsx                 <- Analysis comparisons     │
│                                                               │
│  State Management (new)                                      │
│  ├─ useConversation.ts           <- Conversation logic       │
│  ├─ useMessageStream.ts          <- Message streaming        │
│  └─ ConversationContext.tsx      <- Global state             │
└─────────────────────────────────────────────────────────────┘
                               |
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Layer                   │
├─────────────────────────────────────────────────────────────┤
│  Message Router (enhanced)                                   │
│  ├─ RCAWebviewProvider.ts        <- Add conversation routes │
│  └─ ConversationService.ts (new) <- Orchestration           │
│                                                               │
│  Intent Classification (new)                                 │
│  └─ IntentClassifier.ts          <- Classify user requests   │
└─────────────────────────────────────────────────────────────┘
                               |
┌─────────────────────────────────────────────────────────────┐
│                       Backend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Conversation Engine (new)                                   │
│  ├─ ConversationManager.ts       <- Multi-turn orchestration │
│  ├─ ConversationMemory.ts        <- Context management       │
│  ├─ RefinementAgent.ts           <- Iterative improvement    │
│  └─ ClarificationAgent.ts        <- Ask questions            │
│                                                               │
│  Enhanced Feedback (extended)                                │
│  ├─ FeedbackHandler.ts           <- Add detailed feedback    │
│  └─ FeedbackClassifier.ts (new)  <- Categorize feedback      │
│                                                               │
│  Database Layer (extended)                                   │
│  ├─ ConversationStore.ts (new)   <- Persist conversations    │
│  └─ ChromaDBClient.ts            <- Enhanced metadata        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Scenarios

#### Scenario 1: User Asks Follow-up Question

```
User types question → ConversationView
                    ↓
             RCAWebviewProvider (Extension)
                    ↓
             ConversationService
                    ↓
             ConversationManager
                    ├→ Load conversation context
                    ├→ IntentClassifier → Determine intent
                    └→ Route to appropriate handler
                         ├→ ClarificationHandler
                         ├→ RefinementAgent
                         └→ AlternativeHandler
                    ↓
             Generate response with LLM
                    ↓
             Stream back to UI
                    ↓
             Display in MessageBubble
```

#### Scenario 2: Agent Asks Clarifying Question

```
MinimalReactAgent analyzing error
        ↓
Low confidence detected (< 0.6)
        ↓
UncertaintyDetector identifies gaps
        ↓
ClarificationAgent generates questions
        ↓
ConversationManager → ConversationService
        ↓
RCAWebviewProvider → ConversationView
        ↓
ClarificationPrompt displays with input helpers
        ↓
User provides answer → Back to Agent
        ↓
Resume analysis with new information
        ↓
Improved confidence & results
```

---

## Current RCA Views

### Existing Webview Structure

The RCA Agent webview currently has **7 main views**, each serving distinct purposes:

```
vscode-extension/webview/src/
├── App.tsx                    # Main router component
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar (persistent)
│   ├── NavigationSection.tsx # Route navigation items
│   └─ SettingsSection.tsx   # Settings controls
└── views/
    ├── Dashboard.tsx         # Default landing page
    ├── ErrorQueue.tsx        # Error management
    ├── Analyze.tsx           # Interactive analysis
    ├── History.tsx           # Past analyses
    ├── AgentState.tsx        # Agent visualization
    ├── FixManager.tsx        # Code fix management
    └── Metrics.tsx           # Performance analytics
```

### View Details

| View            | Route      | Primary Function     | Key Features                                               |
| --------------- | ---------- | -------------------- | ---------------------------------------------------------- |
| **Dashboard**   | `/`        | Landing page         | Stats cards, quick actions, recent activity, Ollama status |
| **Error Queue** | `/errors`  | Error management     | Table/card view, bulk operations, analysis triggers        |
| **Analyze**     | `/analyze` | Interactive analysis | Error input form, live progress, results display           |
| **History**     | `/history` | Past analyses        | Timeline view, search, re-analyze, export                  |
| **Agent State** | `/agent`   | Debug visualization  | Live iterations, hypothesis tracking, tool metrics         |
| **Fix Manager** | `/fixes`   | Fix management       | Pending/applied fixes, code diffs, batch operations        |
| **Metrics**     | `/metrics` | Analytics            | Success rates, charts, learning metrics                    |

### Current UI Layout

```
┌─────────────────────────────────────────────────────────┐
│                    RCA Agent Webview                    │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Sidebar   │              Main Content Area             │
│  (Fixed)   │            (Route-based Views)             │
│            │                                            │
│  - Logo    │  Dashboard  <- Default view                │
│  - Nav     │  ErrorQueue                                │
│    Items   │  Analyze    <- Primary analysis view       │
│  - Settings│  History                                   │
│            │  AgentState <- Debug/visualization         │
│            │  FixManager                                │
│            │  Metrics                                   │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

---

## Floating Widget Integration

### Design Pattern

The chatbox will be implemented as a **persistent floating widget** that overlays all views, similar to customer support chat widgets. This provides:

- **Consistent availability** across all views
- **Maintained context** when navigating between tabs
- **Non-intrusive** presence when collapsed
- **Easy access** when assistance is needed

### UI Layout with Chat Widget

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar   │         View Content                       │
│            │                                   ┌────────┤
│            │                                   │ Chat   │
│  [Home]    │  [Content varies by route]        │ Widget │
│  [Errors]  │                                   │        │
│  [Analyze] │                                   │ [Icon] │
│  [History] │                                   │  or    │
│  [Agent]   │                                   │ [Full  │
│  [Fixes]   │                                   │  Chat] │
│  [Metrics] │                                   │        │
│            │                                   │        │
└────────────┴───────────────────────────────────┴────────┘

Collapsed State:           Expanded State:
┌────────┐                 ┌──────────────────┐
│ [Chat] │                 │ Conversation     │
│  Icon  │                 │ ──────────────── │
│  [4]   │ <- badge        │ [Messages...]    │
└────────┘                 │                  │
                           │ [Input field]    │
                           └──────────────────┘
```

### Component Structure

**Location:** `vscode-extension/webview/src/components/conversation/`

**[KEY] Key Architecture Point:**
- **ChatWidget** renders ONCE in `App.tsx`
- All child components persist across route changes
- Only context props update, not component instances

**Component Hierarchy:**
```
App.tsx (Root)
├── Sidebar (Persistent)
├── Routes (Content changes)
└── ChatWidget (SINGLE INSTANCE - Floating Container)
    └── ConversationView (Chat Interface - Main Content)
        ├── AnalysisSummary (Collapsible Header)
    ├── MessageList (Scrollable Container)
    │   ├── MessageBubble (Individual Messages)
    │   │   └── MessageActions (Action Buttons)
    │   └── TypingIndicator (Loading State)
    ├── SuggestedActions (Quick Replies)
    └── ChatInput (Input Field)
        └── FeedbackPanel (Modal Dialog)
```

**File Structure:**
```
conversation/
├── ChatWidget.tsx              # [MAIN] Floating container (ENTRY POINT)
│   ├── Position: fixed bottom-4 right-4
│   ├── States: collapsed | expanded
│   ├── Animation: slide-in from right
│   └── Z-index: 1000 (above all content)
│   [ROADMAP Phase 1 - Foundation]
│
├── ConversationView.tsx        # [CHAT] Interface (when expanded)
│   ├── Header with context indicator
│   ├── Message list with virtual scrolling
│   ├── Input area
│   └── Action buttons
│   [ROADMAP Phase 1 - Foundation]
│
├── ContextIndicator.tsx        # [CONTEXT] Shows current view context
│   └── "Asking about: [View Name]"
│   [ROADMAP Phase 2 - Intent Classification]
│
├── MessageBubble.tsx           # [MESSAGE] Individual message
│   [ROADMAP Phase 1 - Foundation]
├── ChatInput.tsx               # [INPUT] Auto-resize textarea
│   [ROADMAP Phase 1 - Foundation]
├── TypingIndicator.tsx         # [LOADING] Loading state
│   [ROADMAP Phase 1 - Foundation]
├── SuggestedActions.tsx        # [ACTIONS] Context-specific quick replies
│   [ROADMAP Phase 2 - Intent Classification]
├── FeedbackPanel.tsx           # [FEEDBACK] Detailed feedback modal
│   [ROADMAP Phase 5 - Rich Feedback]
└── AnalysisSummary.tsx         # [SUMMARY] Analysis context header
    [ROADMAP Phase 3 - Iterative Refinement]
```

### Integration into App.tsx

**[YES] CORRECT PATTERN: Single Instance Outside Routes**

```tsx
// vscode-extension/webview/src/App.tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWidget } from './components/conversation/ChatWidget';
import { ConversationProvider } from './contexts/ConversationContext';

// ... view imports ...

function App() {
  const [currentRoute, setCurrentRoute] = useState('/');
  const [conversationContext, setConversationContext] = useState(null);

  // Update conversation context when route changes
  // IMPORTANT: This updates CONTEXT only, not component instance
  useEffect(() => {
    setConversationContext({
      viewType: getViewType(currentRoute),
      route: currentRoute,
      timestamp: Date.now()
    });
  }, [currentRoute]);

  const renderView = () => {
    switch (currentRoute) {
      case '/': return <Dashboard />;
      case '/errors': return <ErrorQueue />;
      case '/analyze': return <Analyze />;
      case '/history': return <History />;
      case '/agent': return <AgentState />;
      case '/fixes': return <FixManager />;
      case '/metrics': return <Metrics />;
      default: return <Dashboard />;
    }
  };

  return (
    <ConversationProvider>
      <div className="flex h-screen bg-zinc-950 text-zinc-50">
        <Sidebar onRouteChange={setCurrentRoute} />
        
        <main className="flex-1 overflow-auto">
          {/* View changes based on route */}
          {renderView()}
        </main>

        {/* ============================================= */}
        {/* CRITICAL: Single ChatWidget for ALL views    */}
        {/* - Rendered OUTSIDE route switching logic     */}
        {/* - Component instance persists across nav     */}
        {/* - Only 'context' prop updates on navigation  */}
        {/* - NEVER unmounts during normal usage         */}
        {/* ============================================= */}
        <ChatWidget 
          context={conversationContext}
          currentView={currentRoute}
        />
      </div>
    </ConversationProvider>
  );
}

function getViewType(route: string) {
  const mapping = {
    '/': 'dashboard',
    '/errors': 'errors',
    '/analyze': 'analyze',
    '/history': 'history',
    '/agent': 'agent',
    '/fixes': 'fixes',
    '/metrics': 'metrics'
  };
  return mapping[route] || 'dashboard';
}

export default App;
```

**[NO] ANTI-PATTERN: Do NOT Render Per-View**

```tsx
// WRONG - Creates separate instances per view
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* [NO] DON'T: Separate instance per view */}
      <ChatWidget context={{ viewType: 'dashboard' }} />
    </div>
  );
}

function ErrorQueue() {
  return (
    <div>
      <h1>Error Queue</h1>
      {/* [NO] DON'T: Creates new instance on navigation */}
      <ChatWidget context={{ viewType: 'errors' }} />
    </div>
  );
}

// PROBLEMS with this approach:
// 1. Conversation history lost on navigation
// 2. Expanded/collapsed state resets
// 3. Re-mounting overhead on every route change
// 4. Cannot maintain continuous conversation
// 5. Poor user experience
```

### Widget Behavior

**[LOCK] Persistence Guarantee**: The widget component instance NEVER unmounts during normal navigation. All state (collapsed/expanded, conversation history, scroll position) is preserved.

#### Collapsed State
- **Visual:** Circular icon button with badge count (if unread messages)
- **Size:** 56x56px (touch-friendly)
- **Position:** `fixed bottom-4 right-4` (stays constant across all views)
- **Badge:** Shows unread message count or agent activity indicator
- **Animation:** Subtle pulse when agent is typing

#### Expanded State
- **Visual:** Full chat panel
- **Size:** 400px wide x 600px high (adjustable)
- **Position:** Anchored to bottom-right
- **Features:**
  - Draggable header (optional)
  - Resizable borders (optional)
  - Minimize/maximize buttons
  - Close button

#### State Persistence
- Widget state (collapsed/expanded) saved to `localStorage`
- Conversation history persisted to backend
- Auto-collapses on route change (configurable)
- Restores state on webview reload

---

## Architecture Mapping

### Current Project Structure

```
vscode-extension/
├── src/                                    # Extension backend
│   ├── webview/
│   │   └── RCAWebviewProvider.ts          # [MAIN] Webview controller
│   ├── services/
│   │   └── AnalysisService.ts             # [MAIN] Analysis orchestration
│   └── extension.ts                        # Extension entry point
│
└── webview/                                # Webview frontend
    ├── src/
    │   ├── App.tsx                         # [TARGET] Main app component
    │   ├── components/                     # [TARGET] UI components location
    │   │   ├── AnalysisPanel.tsx          # Existing analysis UI
    │   │   ├── ErrorList.tsx              # Existing error list
    │   │   └── [NEW] ChatBox.tsx          # Chat interface
    │   │
    │   ├── hooks/                          # [TARGET] React hooks
    │   │   ├── useWebview.ts              # Existing webview communication
    │   │   └── [NEW] useConversation.ts   # Chat state management
    │   │
    │   ├── types/                          # [TARGET] TypeScript types
    │   │   ├── index.ts                   # Existing types
    │   │   └── [NEW] conversation.ts      # Chat types
    │   │
    │   └── styles/                         # [TARGET] Styling
    │       └── tailwind.css               # Existing Tailwind config
    │
    └── index.html                          # Webview HTML entry
```

### New Design Structure (Source)

```
Figma/Replicate UI Design/
├── src/
│   ├── app/
│   │   ├── App.tsx                         # [REF] Layout example
│   │   └── components/
│   │       ├── ChatBox.tsx                # [SOURCE] Main chat component
│   │       ├── ActivityItem.tsx           # [REF] List item pattern
│   │       ├── Sidebar.tsx                # [REF] Navigation pattern
│   │       ├── StatCard.tsx               # [REF] Card pattern
│   │       └── ui/                        # [SOURCE] shadcn/ui components
│   │           ├── button.tsx
│   │           ├── input.tsx
│   │           ├── textarea.tsx
│   │           ├── avatar.tsx
│   │           ├── badge.tsx
│   │           ├── card.tsx
│   │           ├── tooltip.tsx
│   │           └── ... (30+ components)
│   │
│   └── styles/
│       ├── tailwind.css                   # [REF] Tailwind setup
│       └── theme.css                      # [REF] Dark theme tokens
│
└── guidelines/
    └── Guidelines.md                       # [REF] Design system rules
```

---

## Context-Aware Conversations

### Conversation Context System

The chatbox dynamically adapts its behavior based on the current view, providing context-specific assistance and prompts.

#### Context Data Structure

**Location:** `vscode-extension/webview/src/types/conversation.ts`

```typescript
interface ConversationContext {
  viewType: ViewType;
  route: string;
  timestamp: number;
  contextData?: ViewContextData;
}

type ViewType = 
  | 'dashboard' 
  | 'errors' 
  | 'analyze' 
  | 'history' 
  | 'agent' 
  | 'fixes' 
  | 'metrics';

interface ViewContextData {
  // Dashboard context
  dashboardStats?: {
    pendingErrors: number;
    analysesToday: number;
    successRate: number;
  };
  
  // Analyze view context
  currentAnalysis?: {
    analysisId: string;
    errorText: string;
    status: 'idle' | 'analyzing' | 'complete' | 'error';
    iteration?: number;
  };
  
  // History view context
  selectedHistory?: {
    historyId: string;
    timestamp: number;
    errorMessage: string;
  };
  
  // Error Queue context
  selectedErrors?: {
    errorIds: string[];
    totalErrors: number;
  };
  
  // Agent State context
  agentState?: {
    phase: string;
    iteration: number;
    hypothesis: string;
  };
  
  // Fix Manager context
  pendingFixes?: {
    fixIds: string[];
    totalPending: number;
  };
  
  // Metrics context
  selectedMetric?: {
    metricType: string;
    timeRange: string;
    value: number;
  };
}
```

### View-Specific Features

#### 1. Dashboard View

**Context Awareness:**
- Greet user with workspace status
- Suggest actions based on pending errors
- Answer questions about overall health

**Example Prompts:**
```typescript
const dashboardPrompts = [
  "What errors need my attention?",
  "Show me today's analysis summary",
  "How is Ollama performing?",
  "What's the current success rate?"
];
```

**Chat Capabilities:**
- Explain dashboard statistics
- Navigate to specific views
- Trigger quick actions (scan workspace, analyze all)
- Interpret trends and patterns

#### 2. Error Queue View

**Context Awareness:**
- Reference selected errors in conversation
- Provide bulk operation guidance
- Suggest prioritization strategies

**Example Prompts:**
```typescript
const errorQueuePrompts = [
  "Which error should I fix first?",
  "Group similar errors together",
  "Explain this error type",
  "Analyze selected errors"
];
```

**Chat Capabilities:**
- Error prioritization recommendations
- Pattern detection across errors
- Bulk analysis suggestions
- Filtering and search assistance

#### 3. Analyze View

**Context Awareness:**
- Maintain conversation about active analysis
- Reference current analysis results
- Explain agent's reasoning

**Example Prompts:**
```typescript
const analyzePrompts = [
  "Why did you choose this file?",
  "Can you explain the fix?",
  "What's your confidence level?",
  "Show me alternative solutions"
];
```

**Chat Capabilities:**
- Real-time analysis discussion
- Clarification of results
- Refinement of analysis based on feedback
- Alternative solution exploration

#### 4. History View

**Context Awareness:**
- Reference selected historical analysis
- Compare with other analyses
- Explain confidence changes

**Example Prompts:**
```typescript
const historyPrompts = [
  "Compare this with previous analysis",
  "Why did confidence improve?",
  "What changed in the fix?",
  "Show similar past errors"
];
```

**Chat Capabilities:**
- Historical analysis comparison
- Trend explanation
- Pattern recognition
- Re-analysis suggestions

#### 5. Agent State View

**Context Awareness:**
- Explain current agent phase
- Clarify iteration decisions
- Detail tool usage

**Example Prompts:**
```typescript
const agentStatePrompts = [
  "Why did you use this tool?",
  "Explain your thought process",
  "What's the current hypothesis?",
  "Why is confidence changing?"
];
```

**Chat Capabilities:**
- Real-time reasoning explanation
- Tool usage justification
- Hypothesis evolution tracking
- Debugging agent behavior

#### 6. Fix Manager View

**Context Awareness:**
- Reference pending/applied fixes
- Explain code changes
- Assess fix impact

**Example Prompts:**
```typescript
const fixManagerPrompts = [
  "Will this fix break anything?",
  "Show me similar fixes",
  "Explain these code changes",
  "What's the risk level?"
];
```

**Chat Capabilities:**
- Code change explanation
- Risk assessment
- Impact analysis
- Fix recommendation

#### 7. Metrics View

**Context Awareness:**
- Reference displayed metrics
- Explain trends
- Compare time periods

**Example Prompts:**
```typescript
const metricsPrompts = [
  "Why did success rate drop?",
  "Explain this trend",
  "Compare with last month",
  "What's affecting performance?"
];
```

**Chat Capabilities:**
- Metric interpretation
- Trend analysis
- Performance insights
- Recommendation generation

### Context Switching

**IMPORTANT**: Navigation does NOT remount the ChatWidget component. Only internal state updates occur.

When user navigates between views, the chatbox:

1. **Updates context indicator:** Shows current view name (UI update only)
2. **Adjusts suggested prompts:** Displays view-relevant quick actions (UI update only)
3. **Maintains conversation:** Previous messages remain accessible (state preserved)
4. **Notifies agent:** Backend receives context change event (message passing)

**Key Principle**: The component instance persists; only props and internal state change.

**Implementation:**

```typescript
// In ChatWidget.tsx
const handleContextChange = (newContext: ConversationContext) => {
  // Update UI to show new context
  setCurrentContext(newContext);
  
  // Send context change to backend
  postMessage('conversation.contextChange', {
    sessionId: currentSession.id,
    newContext: newContext
  });
  
  // Update suggested prompts
  setSuggestedPrompts(getPromptsForView(newContext.viewType));
  
  // Optionally collapse widget if configured
  if (autoCollapseOnNavigate) {
    setIsExpanded(false);
  }
};
```

---

## Implementation Phases

### Timeline Overview

**8-Week Implementation:**

| Phase       | Duration | Focus Area            | Key Deliverables                          |
| ----------- | -------- | --------------------- | ----------------------------------------- |
| **Phase 1** | Week 1-2 | Foundation            | Chat widget, basic messaging, persistence |
| **Phase 2** | Week 3   | Intent Classification | Smart routing, context awareness          |
| **Phase 3** | Week 4   | Iterative Refinement  | Analysis improvement loop                 |
| **Phase 4** | Week 5   | Agent-Initiated       | Clarification questions                   |
| **Phase 5** | Week 6   | Rich Feedback         | Detailed feedback collection              |
| **Phase 6** | Week 7   | UI Polish             | Accessibility, animations                 |
| **Phase 7** | Week 8   | Testing               | User testing, optimization                |

---

### Phase 1: Foundation (Week 1-2) [CRITICAL]

**Goal**: Build core conversation infrastructure

#### Backend Tasks

1. **ConversationManager** (`src/agent/ConversationManager.ts`)
   ```typescript
   class ConversationManager {
     async createSession(rcaId: string, context: ConversationContext): Promise<ConversationSession>
     async continueConversation(sessionId: string, message: string): Promise<ConversationMessage>
     async getSessionHistory(sessionId: string): Promise<ConversationMessage[]>
     async routeMessage(message: ConversationMessage): Promise<Response>
   }
   ```

2. **ConversationMemory** (`src/agent/ConversationMemory.ts`)
   - Store last N messages (sliding window)
   - Compress context for long conversations
   - Retrieve relevant history

3. **ConversationStore** (`src/db/ConversationStore.ts`)
   - Persist conversations to ChromaDB
   - Query by session/user/RCA ID
   - Link to RCA documents

4. **Enhanced Types** (`src/types.ts`)
   - See [Technical Specifications](#technical-specifications) section

#### Frontend Tasks

1. **ChatWidget** (`vscode-extension/webview/src/components/conversation/ChatWidget.tsx`)
   - Floating container (fixed bottom-right)
   - Collapsed/expanded states
   - Animation transitions

2. **ConversationView** (`vscode-extension/webview/src/components/conversation/ConversationView.tsx`)
   - Message list with scrolling
   - Input form
   - Send button

3. **MessageBubble** (`vscode-extension/webview/src/components/conversation/MessageBubble.tsx`)
   - User vs agent styling
   - Markdown rendering
   - Code blocks

4. **ChatInput** (`vscode-extension/webview/src/components/conversation/ChatInput.tsx`)
   - Auto-resize textarea
   - Send on `Ctrl+Enter`

5. **useConversation Hook** (`vscode-extension/webview/src/hooks/useConversation.ts`)
   ```typescript
   function useConversation(sessionId?: string) {
     const [messages, setMessages] = useState<ConversationMessage[]>([]);
     const [isLoading, setIsLoading] = useState(false);
     
     const sendMessage = async (content: string) => { /* ... */ };
     const loadHistory = async () => { /* ... */ };
     
     return { messages, sendMessage, isLoading };
   }
   ```

6. **Integration into App.tsx**
   - Add ChatWidget to all views
   - Pass current route as context

**Deliverables:**
- [X] User can send messages
- [X] Backend receives and routes messages
- [X] Conversations persist in database
- [X] Basic UI shows sent/received messages

---

### Phase 2: Intent Classification & Routing (Week 3) [HIGH]

**Goal**: Intelligent handling of different request types

#### Intent Categories

```typescript
enum MessageIntent {
  CLARIFICATION = 'clarification',          // "What does this mean?"
  EXPLANATION = 'explanation',              // "Why did this happen?"
  DETAIL_REQUEST = 'detail_request',        // "Show me the code"
  REFINEMENT = 'refinement',                // "Try looking at X instead"
  ALTERNATIVE = 'alternative',              // "Can you suggest another approach?"
  CORRECTION = 'correction',                // "That's wrong because..."
  POSITIVE_FEEDBACK = 'positive_feedback',  // "This worked!"
  NEGATIVE_FEEDBACK = 'negative_feedback',  // "This didn't work"
  PARTIAL_FEEDBACK = 'partial_feedback',    // "This helped but..."
  NEW_ANALYSIS = 'new_analysis',            // "Analyze this other error"
  RELATED_ISSUE = 'related_issue',          // "I have a similar problem"
  AGENT_CLARIFICATION = 'agent_clarification',
  AGENT_SUGGESTION = 'agent_suggestion'
}
```

#### Backend Tasks

1. **IntentClassifier** (`src/agent/IntentClassifier.ts`)
   - LLM-based zero-shot classification
   - Confidence scoring
   - Entity extraction

2. **Intent Handlers** (`src/agent/handlers/`)
   - `ClarificationHandler.ts`
   - `RefinementHandler.ts`
   - `AlternativeHandler.ts`
   - `FeedbackHandler.ts` (enhanced)

3. **Prompt Templates** (`src/agent/prompts/conversation/`)
   - Intent classification prompt
   - Handler-specific prompts

#### Frontend Tasks

1. **ContextIndicator** (`...conversation/ContextIndicator.tsx`)
   - Badge showing current view
   - Updates on route change

2. **SuggestedActions** (`...conversation/SuggestedActions.tsx`)
   - View-specific quick replies
   - Click to send message

3. **FeedbackPanel** (`...conversation/FeedbackPanel.tsx`)
   - Category selection
   - Free-text explanation

**Deliverables:**
- [X] System classifies user intent correctly (>85% accuracy)
- [X] Different intents route to appropriate handlers
- [X] UI adapts based on message type
- [X] Users can provide detailed feedback

---

### Phase 3: Iterative Refinement (Week 4) [HIGH]

**Goal**: Enable continuous improvement of analysis

#### Backend Tasks

1. **RefinementAgent** (`src/agent/RefinementAgent.ts`)
   - Take existing analysis + user feedback
   - Re-run with constraints
   - Merge old and new insights

2. **DeltaGenerator** (`src/agent/DeltaGenerator.ts`)
   - Generate "what changed" summaries
   - Highlight key differences
   - Explain reasoning

3. **ConfidenceTracker** (`src/agent/ConfidenceTracker.ts`)
   - Track confidence evolution
   - Identify convergence patterns

#### Frontend Tasks

1. **Refinement UI** (Enhanced `ConversationView.tsx`)
   - Show analysis diffs
   - Highlight changes

2. **DiffView Component** (`...components/DiffView.tsx`)
   - Side-by-side comparison
   - Change explanations

**Refinement Flow Example:**

```
User: "Actually, the error happens in UserRepository.kt, not MainActivity.kt"

RefinementAgent:
1. Parse correction: { wrongFile: "MainActivity.kt", correctFile: "UserRepository.kt" }
2. Update analysis context
3. Re-run analysis with constraint: "Focus on UserRepository.kt"
4. Generate delta: "Changed focus from MainActivity to UserRepository"
5. Return refined analysis with confidence boost
```

**Deliverables:**
- [X] User can refine analysis iteratively
- [X] System tracks changes between iterations
- [X] UI shows what changed and why
- [X] Confidence improves over iterations

---

### Phase 4: Agent-Initiated Interactions (Week 5) [NORMAL]

**Goal**: RCA proactively asks questions and makes suggestions

#### Clarification Triggers

```typescript
interface ClarificationTrigger {
  confidence: number;          // Low confidence (<0.6)
  ambiguity: string[];         // Multiple possible causes
  missingContext: string[];    // Required info not available
  toolFailure: string[];       // Tools couldn't execute
}
```

#### Backend Tasks

1. **ClarificationAgent** (`src/agent/ClarificationAgent.ts`)
   - Detect when clarification needed
   - Generate relevant questions
   - Prioritize by impact

2. **UncertaintyDetector** (`src/agent/UncertaintyDetector.ts`)
   - Identify low-confidence areas
   - Detect ambiguous situations

3. **QuestionGenerator** (`src/agent/QuestionGenerator.ts`)
   - Template-based + LLM-generated questions
   - Rank by usefulness

#### Frontend Tasks

1. **ClarificationPrompt** (`...conversation/ClarificationPrompt.tsx`)
   - Display agent questions
   - Quick answer buttons
   - Skip/defer options

2. **Interactive Forms**
   - File picker for "which file?"
   - Version selector for "which version?"
   - Code snippet input

**Example Questions:**
```
"Which Gradle version are you using?"
"Is this error consistent or intermittent?"
"Can you share your build.gradle dependencies?"
"I see two possible causes: lateinit access or null assignment. Which scenario matches?"
```

**Deliverables:**
- [X] Agent detects when it needs more info
- [X] Agent asks relevant, specific questions
- [X] Users can answer quickly with UI helpers
- [X] Analysis improves after clarification

---

### Phase 5: Rich Feedback & Learning (Week 6) [NORMAL]

**Goal**: Capture detailed feedback for learning system

#### Feedback Schema

```typescript
interface DetailedFeedback {
  type: 'positive' | 'negative' | 'partial';
  
  categories: Array<
    | 'wrong_file'           // Incorrect file identified
    | 'wrong_cause'          // Root cause incorrect
    | 'incomplete_fix'       // Fix incomplete/missing steps
    | 'wrong_version'        // Version assumption wrong
    | 'missing_context'      // Needs more context
    | 'generic_response'     // Too generic
    | 'incorrect_code'       // Code example wrong
    | 'helpful_partial'      // Helpful but not complete
  >;
  
  corrections?: {
    correctFile?: string;
    correctCause?: string;
    additionalSteps?: string[];
  };
  
  explanation?: string;
  helpful_aspects?: string[];
}
```

#### Backend Tasks

1. **Enhanced FeedbackHandler** (Extended)
   - Accept structured feedback
   - Categorize feedback types
   - Extract actionable insights

2. **FeedbackClassifier** (`src/agent/FeedbackClassifier.ts`)
   - Classify into categories
   - Extract specific issues
   - Link to analysis dimensions

3. **Learning Integration** (Enhanced `AdaptiveLearning.ts`)
   - Process rich feedback signals
   - Adjust patterns
   - Generate training examples

#### Frontend Tasks

1. **Enhanced FeedbackPanel** (Expanded)
   - Multi-category selection
   - Issue-specific fields
   - Free-text with suggestions

2. **Feedback Templates**
   - Common patterns
   - Quick select options

**Deliverables:**
- [X] Users can provide detailed, structured feedback
- [X] Feedback categorized and stored
- [X] Learning system uses feedback
- [X] Measurable impact on future analyses

---

### Phase 6: UI Polish & UX Enhancements (Week 7)

**Goal**: Production-ready user experience

#### Tasks

1. **Visual Design**
   - Message bubbles with avatars
   - Typing indicators
   - Read receipts
   - Message reactions

2. **Keyboard Shortcuts**
   - `Cmd/Ctrl+Enter` to send
   - `↑` to edit last message
   - `Esc` to cancel input

3. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - ARIA labels
   - Focus management
   - WCAG 2.1 AA compliance

4. **Performance**
   - Virtual scrolling for long conversations
   - Message pagination
   - Lazy loading of history
   - Target: <200ms UI response time

5. **Animations**
   - Smooth slide-in/out
   - Message fade-in
   - Typing indicator pulse

**Deliverables:**
- [X] Polished, professional UI
- [X] WCAG 2.1 AA compliance
- [X] Smooth animations and transitions
- [X] 60fps scrolling performance

---

### Phase 7: Testing & Optimization (Week 8)

**Goal**: Ensure reliability and performance

#### Testing Tasks

1. **Unit Tests**
   - All new components (>90% coverage)
   - Intent classification accuracy
   - Conversation state management
   - Feedback processing

2. **Integration Tests**
   - End-to-end conversation flows
   - Multi-turn refinement
   - Clarification loops
   - Feedback submission

3. **Performance Tests**
   - Message throughput
   - Memory usage in long conversations
   - Database query performance
   - LLM response times

4. **User Testing**
   - Beta program with 10-20 users
   - A/B test conversation vs. non-conversation
   - Collect qualitative feedback
   - Measure success metrics

**Success Metrics:**
- 70%+ adoption rate
- Average 2.5+ conversation turns
- 40%+ improvement in analysis accuracy after refinement
- 35% reduction in re-analysis rate

**Deliverables:**
- [X] >90% test coverage for new code
- [X] All integration tests passing
- [X] <200ms UI response time
- [X] Validated with real users

---

## Implementation Roadmap

### Phase-to-Component Mapping

This table maps UI components in this guide to implementation phases in [CONVERSATIONAL_RCA_ROADMAP.md](./CONVERSATIONAL_RCA_ROADMAP.md):

| Component                   | ROADMAP Phase      | Priority     | Dependencies                              | Backend Integration                                                                                |
| --------------------------- | ------------------ | ------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **ChatWidget.tsx**          | Phase 1 (Week 1-2) | [!] Critical | ConversationView, ContextIndicator        | [ConversationManager](./CONVERSATIONAL_RCA_ROADMAP.md#phase-1-foundation-week-1-2)                 |
| **ConversationView.tsx**    | Phase 1 (Week 1-2) | [!] Critical | MessageBubble, ChatInput, useConversation | [ConversationMemory](./CONVERSATIONAL_RCA_ROADMAP.md#phase-1-foundation-week-1-2)                  |
| **MessageBubble.tsx**       | Phase 1 (Week 1-2) | [!] Critical | MessageActions, CodeBlock                 | Message streaming                                                                                  |
| **ChatInput.tsx**           | Phase 1 (Week 1-2) | [!] Critical | Button, Textarea                          | Message routing                                                                                    |
| **useConversation.ts**      | Phase 1 (Week 1-2) | [!] Critical | useWebview                                | [ConversationStore](./CONVERSATIONAL_RCA_ROADMAP.md#phase-1-foundation-week-1-2)                   |
| **ContextIndicator.tsx**    | Phase 2 (Week 3)   | [H] High     | Badge, Icons                              | [IntentClassifier](./CONVERSATIONAL_RCA_ROADMAP.md#phase-2-intent-classification--routing-week-3)  |
| **SuggestedActions.tsx**    | Phase 2 (Week 3)   | [H] High     | Button                                    | Intent-based routing                                                                               |
| **AnalysisSummary.tsx**     | Phase 3 (Week 4)   | [H] High     | useRCAAnalysis, ConfidenceBadge           | [RefinementAgent](./CONVERSATIONAL_RCA_ROADMAP.md#phase-3-iterative-refinement-week-4)             |
| **DiffView.tsx**            | Phase 3 (Week 4)   | [H] High     | -                                         | [DeltaGenerator](./CONVERSATIONAL_RCA_ROADMAP.md#phase-3-iterative-refinement-week-4)              |
| **ClarificationPrompt.tsx** | Phase 4 (Week 5)   | [M] Medium   | Dialog, Form inputs                       | [ClarificationAgent](./CONVERSATIONAL_RCA_ROADMAP.md#phase-4-agent-initiated-interactions-week-5)  |
| **FeedbackPanel.tsx**       | Phase 5 (Week 6)   | [M] Medium   | Dialog, Checkbox, Textarea                | [Enhanced FeedbackHandler](./CONVERSATIONAL_RCA_ROADMAP.md#phase-5-rich-feedback--learning-week-6) |
| **TypingIndicator.tsx**     | Phase 1 (Week 1-2) | [L] Low      | -                                         | Streaming status                                                                                   |
| **ConfidenceBadge.tsx**     | Phase 3 (Week 4)   | [L] Low      | Badge                                     | [ConfidenceTracker](./CONVERSATIONAL_RCA_ROADMAP.md#phase-3-iterative-refinement-week-4)           |

### Implementation Order

**Week 1-2: Core Foundation [CRITICAL]**
1. Create `ChatWidget.tsx` (floating container)
2. Create `ConversationView.tsx` (chat interface)
3. Create `MessageBubble.tsx` and `ChatInput.tsx`
4. Create `useConversation.ts` hook
5. Integrate into `App.tsx`
6. **Backend**: Setup ConversationManager, ConversationMemory, ConversationStore

**Week 3: Context Awareness [HIGH]**
1. Create `ContextIndicator.tsx`
2. Create `SuggestedActions.tsx`
3. Implement view-specific prompt suggestions
4. **Backend**: Setup IntentClassifier, Intent handlers

**Week 4: Refinement Features [HIGH]**
1. Create `AnalysisSummary.tsx`
2. Create `DiffView.tsx`
3. Create `ConfidenceBadge.tsx`
4. **Backend**: Setup RefinementAgent, DeltaGenerator, ConfidenceTracker

**Week 5: Clarification [NORMAL]**
1. Create `ClarificationPrompt.tsx`
2. Implement interactive form components
3. **Backend**: Setup ClarificationAgent, UncertaintyDetector

**Week 6: Rich Feedback [NORMAL]**
1. Enhance `FeedbackPanel.tsx`
2. Create feedback templates
3. **Backend**: Enhance FeedbackHandler, setup FeedbackClassifier

**Week 7-8: Polish & Testing**
- UI polish and accessibility
- Performance optimization
- Integration testing

---

## Component Navigation

### Core Chat Components to Build

#### 0. ChatWidget Component ([ENTRY POINT] Floating Container)
**Location:** `vscode-extension/webview/src/components/conversation/ChatWidget.tsx`  
**ROADMAP Phase:** [Phase 1 - Foundation (Week 1-2)](./CONVERSATIONAL_RCA_ROADMAP.md#phase-1-foundation-week-1-2)  
**Purpose:** Main floating widget container that wraps ConversationView

**This is the root component for the entire floating widget system.**

```typescript
/**
 * Floating chat widget - persistent across all views
 * Manages collapsed/expanded states and positioning
 */

import { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationView } from './ConversationView';
import { ContextIndicator } from './ContextIndicator';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
  context: ConversationContext;
  currentView: string;
}

export function ChatWidget({ context, currentView }: ChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chat-widget-expanded');
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved));
    }
  }, []);

  // Save state when changed
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('chat-widget-expanded', JSON.stringify(newState));
  };

  if (!isExpanded) {
    // Collapsed state - show icon button
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleExpanded}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            "bg-blue-600 hover:bg-blue-700",
            isAgentTyping && "animate-pulse"
          )}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // Expanded state - show full chat panel
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl"
         style={{ width: '400px', height: '600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <span className="font-medium">RCA Assistant</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleExpanded}
            aria-label="Minimize chat"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Context Indicator */}
      <ContextIndicator context={context} />

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <ConversationView 
          context={context}
          onUnreadCountChange={setUnreadCount}
          onTypingChange={setIsAgentTyping}
        />
      </div>
    </div>
  );
}
```

**Related Files to Create:**
- `ContextIndicator.tsx` - Shows current view context (Phase 2)
- `ConversationView.tsx` - Main chat interface (Phase 1)

**Backend Integration:**
- Connect to [ConversationManager](./CONVERSATIONAL_RCA_ROADMAP.md#conversationmanager) for session management
- Use [ConversationStore](./CONVERSATIONAL_RCA_ROADMAP.md#database-schema-extensions) for persistence

---

#### 1. ConversationView Component ([MAIN] Chat Interface)
**Source:** `Figma/Replicate UI Design/src/app/components/ChatBox.tsx`  
**Destination:** `vscode-extension/webview/src/components/conversation/ConversationView.tsx`  
**ROADMAP Phase:** [Phase 1 - Foundation (Week 1-2)](./CONVERSATIONAL_RCA_ROADMAP.md#phase-1-foundation-week-1-2)  
**Dependencies:**
- Message state management (useConversation hook)
- Webview message passing (useWebview hook)
- Scroll behavior (ScrollArea component)
- Input handling (ChatInput component)

**Backend Integration:**
- [ConversationMemory](./CONVERSATIONAL_RCA_ROADMAP.md#conversationmemory) for context management
- [Message streaming](./CONVERSATIONAL_RCA_ROADMAP.md#api-endpoints-extension--backend) for real-time responses

**Implementation Checklist:**
```typescript
// File: vscode-extension/webview/src/components/ChatBox.tsx
import { useConversation } from '@/hooks/useConversation';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { AnalysisSummary } from './AnalysisSummary';

export function ChatBox({ rcaId }: { rcaId: string }) {
  const { messages, sendMessage, isTyping } = useConversation(rcaId);
  
  return (
    <div className="flex flex-col h-full">
      <AnalysisSummary rcaId={rcaId} />
      <MessageList messages={messages} />
      {isTyping && <TypingIndicator />}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

**Related Files to Create:**
- [REQ] `MessageBubble.tsx` - Individual message display
- [REQ] `MessageList.tsx` - Scrollable message container
- [REQ] `ChatInput.tsx` - Input field with actions
- [REQ] `TypingIndicator.tsx` - Loading animation
- [REQ] `AnalysisSummary.tsx` - Collapsible analysis header

---

#### 2. ContextIndicator Component ([CONTEXT] View Context Display)
**Location:** `vscode-extension/webview/src/components/conversation/ContextIndicator.tsx`  
**ROADMAP Phase:** [Phase 2 - Intent Classification (Week 3)](./CONVERSATIONAL_RCA_ROADMAP.md#phase-2-intent-classification--routing-week-3)

```typescript
/**
 * Displays current view context in chat header
 * Updates when user navigates between views
 */

import { Badge } from '@/components/ui/badge';
import { 
  Home, AlertCircle, Search, History, Bot, Wrench, BarChart 
} from 'lucide-react';

interface ContextIndicatorProps {
  context: ConversationContext;
}

const VIEW_CONFIG = {
  dashboard: { label: 'Dashboard', icon: Home, color: 'blue' },
  errors: { label: 'Error Queue', icon: AlertCircle, color: 'red' },
  analyze: { label: 'Analysis', icon: Search, color: 'green' },
  history: { label: 'History', icon: History, color: 'purple' },
  agent: { label: 'Agent State', icon: Bot, color: 'cyan' },
  fixes: { label: 'Fix Manager', icon: Wrench, color: 'yellow' },
  metrics: { label: 'Metrics', icon: BarChart, color: 'pink' }
};

export function ContextIndicator({ context }: ContextIndicatorProps) {
  const config = VIEW_CONFIG[context.viewType];
  const Icon = config.icon;

  return (
    <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Icon className="h-3 w-3" />
        <span>Asking about:</span>
        <Badge variant="outline" className="text-xs">
          {config.label}
        </Badge>
      </div>
    </div>
  );
}
```

---

#### 3. Message Components

##### MessageBubble.tsx
**Location:** `vscode-extension/webview/src/components/conversation/MessageBubble.tsx`

```typescript
/**
 * Displays individual chat message with role-based styling
 * 
 * Features:
 * - User vs Assistant styling
 * - Timestamp display
 * - Action buttons (copy, reply, refine)
 * - Code syntax highlighting
 * - Markdown support
 */

// Reference design pattern from:
// Figma/Replicate UI Design/src/app/components/ChatBox.tsx (lines 66-88)

import { Message } from '@/types/conversation';
import { MessageActions } from './MessageActions';
import { CodeBlock } from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
  onCopy?: () => void;
  onReply?: () => void;
  onRefine?: () => void;
}

export function MessageBubble({ message, ...actions }: MessageBubbleProps) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={getMessageStyles(message.role)}>
        <MessageContent content={message.content} />
        <MessageTimestamp timestamp={message.timestamp} />
        {message.role === 'assistant' && <MessageActions {...actions} />}
      </div>
    </div>
  );
}
```

**Navigation Path:**
1. Create folder: `vscode-extension/webview/src/components/conversation/`
2. Add files:
   - `MessageBubble.tsx`
   - `MessageActions.tsx`
   - `MessageContent.tsx`
   - `MessageTimestamp.tsx`

---

##### MessageActions.tsx
**Location:** `vscode-extension/webview/src/components/conversation/MessageActions.tsx`

```typescript
/**
 * Action buttons for assistant messages
 * 
 * Actions:
 * - [+] Thumbs up (positive feedback)
 * - [>] Reply (start thread)
 * - [*] Refine (improve analysis)
 * - [=] Copy (copy to clipboard)
 * - [@] Share (generate shareable link)
 */

// New component - no direct equivalent in current codebase
// Design pattern reference: Roadmap UI mockup (lines 826-836)

import { ThumbsUp, MessageCircle, Edit, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface MessageActionsProps {
  messageId: string;
  onThumbsUp: () => void;
  onReply: () => void;
  onRefine: () => void;
  onCopy: () => void;
}

export function MessageActions({ messageId, ...handlers }: MessageActionsProps) {
  return (
    <div className="flex gap-2 mt-2 text-xs text-gray-500">
      <Tooltip content="Helpful">
        <Button variant="ghost" size="sm" onClick={handlers.onThumbsUp}>
          <ThumbsUp className="w-3 h-3" />
        </Button>
      </Tooltip>
      {/* Additional actions... */}
    </div>
  );
}
```

---

#### 3. Input Components

##### ChatInput.tsx
**Location:** `vscode-extension/webview/src/components/conversation/ChatInput.tsx`

```typescript
/**
 * Chat input field with auto-resize and keyboard shortcuts
 * 
 * Features:
 * - Auto-expanding textarea
 * - Enter to send (Shift+Enter for newline)
 * - Attachment button
 * - Send button (disabled when empty)
 * - Character limit indicator
 */

// Reference design:
// Figma/Replicate UI Design/src/app/components/ChatBox.tsx (lines 91-120)

import { Send, Plus } from 'lucide-react';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({ onSend, placeholder, maxLength = 2000 }: ChatInputProps) {
  const [input, setInput] = useState('');
  
  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-end gap-2">
        <AttachmentButton />
        <AutoResizeTextarea
          value={input}
          onChange={setInput}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        <Button onClick={handleSend} disabled={!input.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
```

---

#### 4. Context Components

##### AnalysisSummary.tsx
**Location:** `vscode-extension/webview/src/components/conversation/AnalysisSummary.tsx`

```typescript
/**
 * Collapsible header showing initial RCA analysis results
 * 
 * Displays:
 * - Root cause summary
 * - Confidence score with badge
 * - Affected file(s)
 * - Quick actions (View Full Analysis, Apply Fix)
 * - Expand/Collapse toggle
 */

// New component - integrates with existing analysis data
// Reference existing: vscode-extension/webview/src/components/AnalysisPanel.tsx

import { ChevronDown, ChevronUp } from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';
import { useRCAAnalysis } from '@/hooks/useRCAAnalysis';

interface AnalysisSummaryProps {
  rcaId: string;
  defaultExpanded?: boolean;
}

export function AnalysisSummary({ rcaId, defaultExpanded = false }: AnalysisSummaryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { analysis } = useRCAAnalysis(rcaId);
  
  return (
    <div className="border-b border-gray-800 p-4 bg-[#1a1a1a]">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-white text-sm font-semibold">Initial Analysis</h3>
          <ConfidenceBadge confidence={analysis.confidence} />
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Root Cause:</span>
            <span className="text-gray-200 ml-2">{analysis.rootCause}</span>
          </div>
          <div>
            <span className="text-gray-500">File:</span>
            <span className="text-blue-400 ml-2">{analysis.file}:{analysis.line}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Connects to Existing:**
- `src/agent/MinimalReActAgent.ts` - Analysis results
- `src/types.ts` - `RCAResult` interface
- `vscode-extension/src/services/AnalysisService.ts` - Data retrieval

---

#### 5. Feedback Components

##### FeedbackPanel.tsx
**Location:** `vscode-extension/webview/src/components/conversation/FeedbackPanel.tsx`

```typescript
/**
 * Detailed feedback collection interface
 * 
 * Features:
 * - Overall rating (helpful/partial/not helpful)
 * - Multi-select "What worked well"
 * - Multi-select "What needs improvement"
 * - Free-text explanation field
 * - Submit/Cancel actions
 */

// New component - extends existing feedback system
// Reference existing: src/agent/FeedbackHandler.ts

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface FeedbackPanelProps {
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: DetailedFeedback) => void;
}

export function FeedbackPanel({ messageId, isOpen, onClose, onSubmit }: FeedbackPanelProps) {
  const [rating, setRating] = useState<'helpful' | 'partial' | 'not-helpful'>('helpful');
  const [positiveAspects, setPositiveAspects] = useState<string[]>([]);
  const [negativeAspects, setNegativeAspects] = useState<string[]>([]);
  const [explanation, setExplanation] = useState('');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f0f] border-gray-800">
        <DialogHeader>Provide Detailed Feedback</DialogHeader>
        
        {/* Rating selection */}
        <RatingSelector value={rating} onChange={setRating} />
        
        {/* What worked well */}
        <FeedbackSection title="What worked well?">
          <CheckboxGroup
            options={POSITIVE_ASPECTS}
            value={positiveAspects}
            onChange={setPositiveAspects}
          />
        </FeedbackSection>
        
        {/* What needs improvement */}
        <FeedbackSection title="What needs improvement?">
          <CheckboxGroup
            options={NEGATIVE_ASPECTS}
            value={negativeAspects}
            onChange={setNegativeAspects}
          />
        </FeedbackSection>
        
        {/* Free-text explanation */}
        <Textarea
          placeholder="Additional details (optional)..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={4}
        />
        
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ rating, positiveAspects, negativeAspects, explanation })}>
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const POSITIVE_ASPECTS = [
  'Identified correct file',
  'Root cause was accurate',
  'Fix steps were clear',
  'Code examples were helpful',
];

const NEGATIVE_ASPECTS = [
  'Wrong file identified',
  'Root cause incorrect',
  'Fix was incomplete',
  'Too generic/not specific',
  'Missing context',
];
```

**Integrates with:**
- `src/agent/FeedbackHandler.ts` - Existing feedback processing
- `src/agent/AdaptiveLearning.ts` - Learning pipeline
- Backend endpoint: `conversation.feedback` message type

---

#### 6. Supporting Components

##### TypingIndicator.tsx
**Location:** `vscode-extension/webview/src/components/conversation/TypingIndicator.tsx`

```typescript
/**
 * Animated "agent is typing" indicator
 */

import { Loader2 } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm px-4 py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>RCA Agent is typing...</span>
    </div>
  );
}
```

##### ConfidenceBadge.tsx
**Location:** `vscode-extension/webview/src/components/conversation/ConfidenceBadge.tsx`

```typescript
/**
 * Displays confidence score with color-coded badge
 * Shows trend if previous confidence is provided
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConfidenceBadgeProps {
  confidence: number;
  previousConfidence?: number;
}

export function ConfidenceBadge({ confidence, previousConfidence }: ConfidenceBadgeProps) {
  const trend = previousConfidence ? confidence - previousConfidence : 0;
  const color = confidence >= 0.8 ? 'green' : confidence >= 0.6 ? 'yellow' : 'red';
  
  return (
    <Badge variant={color}>
      {(confidence * 100).toFixed(0)}%
      {trend !== 0 && (
        trend > 0 ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
      )}
    </Badge>
  );
}
```

##### SuggestedActions.tsx
**Location:** `vscode-extension/webview/src/components/conversation/SuggestedActions.tsx`

```typescript
/**
 * Contextual action chips below chat input
 * Shows AI-suggested follow-up questions/actions
 */

import { Button } from '@/components/ui/button';

interface SuggestedActionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestedActions({ suggestions, onSelect }: SuggestedActionsProps) {
  return (
    <div className="flex gap-2 px-4 pb-2 flex-wrap">
      <span className="text-xs text-gray-500 mr-2">[TIP] Suggested:</span>
      {suggestions.map((suggestion, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          className="text-xs"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
```

---

### UI Library Components (shadcn/ui)

These components from the Figma design need to be integrated into the webview:

**Source Location:** `Figma/Replicate UI Design/src/app/components/ui/`  
**Destination:** `vscode-extension/webview/src/components/ui/`

#### Required Components:

| Component      | Priority   | Purpose                   | File Location        |
| -------------- | ---------- | ------------------------- | -------------------- |
| **Button**     | [!] High   | All clickable actions     | `ui/button.tsx`      |
| **Input**      | [!] High   | Text input fields         | `ui/input.tsx`       |
| **Textarea**   | [!] High   | Multi-line input          | `ui/textarea.tsx`    |
| **Badge**      | [!] High   | Confidence scores, status | `ui/badge.tsx`       |
| **Card**       | [!] High   | Message containers        | `ui/card.tsx`        |
| **Dialog**     | [M] Medium | Feedback modal            | `ui/dialog.tsx`      |
| **Tooltip**    | [M] Medium | Action button hints       | `ui/tooltip.tsx`     |
| **Avatar**     | [M] Medium | User/Agent icons          | `ui/avatar.tsx`      |
| **ScrollArea** | [M] Medium | Message list scrolling    | `ui/scroll-area.tsx` |
| **Separator**  | [L] Low    | Visual dividers           | `ui/separator.tsx`   |
| **Skeleton**   | [L] Low    | Loading placeholders      | `ui/skeleton.tsx`    |

#### Migration Steps:

1. **Copy shadcn/ui components:**
   ```bash
   # Copy all UI components from Figma prototype
   cp -r "Figma/Replicate UI Design/src/app/components/ui/" \
         "vscode-extension/webview/src/components/ui/"
   ```

2. **Update import paths:**
   ```typescript
   // Change from:
   import { Button } from '@/app/components/ui/button';
   
   // To:
   import { Button } from '@/components/ui/button';
   ```

3. **Verify Tailwind config:**
   ```javascript
   // Ensure vscode-extension/webview/tailwind.config.js includes:
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
       "./index.html"
     ],
     theme: {
       extend: {
         colors: {
           // Match Figma design system colors
         }
       }
     }
   };
   ```

---

## State Management & Hooks

### React Hooks to Create

#### useConversation.ts ([MAIN] Conversation Hook)
**Location:** `vscode-extension/webview/src/hooks/useConversation.ts`  
**ROADMAP Phase:** [Phase 1 - Foundation (Week 1-2)](./CONVERSATIONAL_RCA_ROADMAP.md#phase-1-foundation-week-1-2)

```typescript
/**
 * Main conversation state management hook
 * 
 * Manages:
 * - Message list
 * - Sending messages
 * - Receiving responses
 * - Loading states
 * - Error handling
 */

// Reference existing pattern: hooks/useWebview.ts
// New implementation needed

import { useState, useEffect, useCallback } from 'react';
import { useWebview } from './useWebview';
import { Message, ConversationSession } from '@/types/conversation';

interface UseConversationReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  error: string | null;
  session: ConversationSession | null;
}

export function useConversation(rcaId: string): UseConversationReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ConversationSession | null>(null);
  
  const { postMessage, onMessage } = useWebview();
  
  // Initialize conversation session
  useEffect(() => {
    postMessage({
      type: 'conversation.start',
      data: { rcaId }
    });
  }, [rcaId]);
  
  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.type) {
        case 'conversation.message':
          setMessages(prev => [...prev, message.data]);
          setIsTyping(false);
          break;
          
        case 'conversation.session':
          setSession(message.data);
          setMessages(message.data.messages);
          break;
          
        case 'conversation.error':
          setError(message.data.error);
          setIsTyping(false);
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Send message to backend
  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);
    
    postMessage({
      type: 'conversation.send',
      data: {
        sessionId: session?.id,
        content
      }
    });
  }, [session, postMessage]);
  
  return {
    messages,
    sendMessage,
    isTyping,
    error,
    session
  };
}
```

**Connects to Existing:**
- `vscode-extension/webview/src/hooks/useWebview.ts` - Message passing
- `vscode-extension/src/webview/RCAWebviewProvider.ts` - Backend handler

**Backend Integration:**
- [ConversationManager](./CONVERSATIONAL_RCA_ROADMAP.md#conversationmanager) for session orchestration
- [ConversationMemory](./CONVERSATIONAL_RCA_ROADMAP.md#conversationmemory) for context management
- [Message Types API](./CONVERSATIONAL_RCA_ROADMAP.md#api-endpoints-extension--backend) for communication protocol

---

#### useRCAAnalysis.ts
**Location:** `vscode-extension/webview/src/hooks/useRCAAnalysis.ts`

```typescript
/**
 * Hook for fetching and subscribing to RCA analysis data
 */

// Extends existing analysis fetching
// Reference: vscode-extension/webview/src/hooks/ (current analysis hooks)

import { useState, useEffect } from 'react';
import { useWebview } from './useWebview';
import { RCAResult } from '@/types';

export function useRCAAnalysis(rcaId: string) {
  const [analysis, setAnalysis] = useState<RCAResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { postMessage, onMessage } = useWebview();
  
  useEffect(() => {
    postMessage({
      type: 'analysis.get',
      data: { rcaId }
    });
    
    const unsubscribe = onMessage((message) => {
      if (message.type === 'analysis.result' && message.data.id === rcaId) {
        setAnalysis(message.data.result);
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, [rcaId]);
  
  return { analysis, loading };
}
```

---

#### useMessageStream.ts
**Location:** `vscode-extension/webview/src/hooks/useMessageStream.ts`

```typescript
/**
 * Hook for handling streaming message responses
 * Enables real-time token-by-token display
 */

// New functionality - not in current implementation
// Required for Phase 1 streaming feature

import { useState, useEffect } from 'react';
import { useWebview } from './useWebview';

export function useMessageStream(messageId: string) {
  const [content, setContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { onMessage } = useWebview();
  
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      if (message.type === 'conversation.stream' && message.data.messageId === messageId) {
        setContent(prev => prev + message.data.chunk);
      }
      
      if (message.type === 'conversation.stream.end' && message.data.messageId === messageId) {
        setIsComplete(true);
      }
    });
    
    return unsubscribe;
  }, [messageId]);
  
  return { content, isComplete };
}
```

---

## TypeScript Types

### Type Definitions to Create

**Location:** `vscode-extension/webview/src/types/conversation.ts`

```typescript
/**
 * Conversation-specific type definitions
 * Extends existing types from src/types.ts
 */

// Reference existing types:
// - src/types.ts (RCAResult, ErrorItem, etc.)
// - CONVERSATIONAL_RCA_ROADMAP.md (lines 616-702)

export interface ConversationSession {
  id: string;
  rcaId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed';
  messages: Message[];
  metadata: {
    messageCount: number;
    confidenceEvolution: number[];
    refinementCount: number;
  };
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  metadata?: {
    intent?: MessageIntent;
    confidence?: number;
    toolsUsed?: string[];
    processingTime?: number;
  };
}

export enum MessageIntent {
  CLARIFICATION = 'clarification',
  REFINEMENT = 'refinement',
  ALTERNATIVE = 'alternative',
  EXPLANATION = 'explanation',
  CODE_FIX = 'code_fix',
  FEEDBACK = 'feedback',
  GENERAL_QUESTION = 'general_question',
  AGENT_QUESTION = 'agent_question',
  AGENT_SUGGESTION = 'agent_suggestion'
}

export interface DetailedFeedback {
  type: 'positive' | 'negative' | 'partial';
  messageId: string;
  rcaId: string;
  categories: {
    accuracy: boolean;
    completeness: boolean;
    clarity: boolean;
    actionability: boolean;
    relevance: boolean;
  };
  positiveAspects: string[];
  negativeAspects: string[];
  suggestion?: string;
  explanation?: string;
  timestamp: number;
}

export interface ConversationContext {
  originalAnalysis: RCAResult;
  refinementHistory: {
    iteration: number;
    changes: string[];
    confidence: number;
    timestamp: Date;
  }[];
  userCorrections: {
    field: string;
    from: string;
    to: string;
    timestamp: Date;
  }[];
  clarificationAnswers: Record<string, string>;
  confidenceTrend: number[];
}

// Message type definitions for webview communication
export interface WebviewMessage {
  type: string;
  data: any;
}

export interface ConversationStartRequest extends WebviewMessage {
  type: 'conversation.start';
  data: {
    rcaId: string;
  };
}

export interface ConversationSendRequest extends WebviewMessage {
  type: 'conversation.send';
  data: {
    sessionId: string;
    content: string;
  };
}

export interface ConversationMessageResponse extends WebviewMessage {
  type: 'conversation.message';
  data: Message;
}

export interface ConversationErrorResponse extends WebviewMessage {
  type: 'conversation.error';
  data: {
    error: string;
    code?: string;
  };
}
```

---

## Integration Points

### Backend Integration

#### RCAWebviewProvider.ts Modifications
**Location:** `vscode-extension/src/webview/RCAWebviewProvider.ts`

```typescript
/**
 * EXISTING FILE - NEEDS ENHANCEMENT
 * Add conversation message handlers
 */

// Current handlers:
// - handleAnalyze
// - handleValidate
// - handleFeedback

// NEW handlers to add:
private async _handleConversationStart(data: { rcaId: string }): Promise<void> {
  const conversationService = ConversationService.getInstance();
  const session = await conversationService.startConversation(data.rcaId);
  
  this._panel.webview.postMessage({
    type: 'conversation.session',
    data: session
  });
}

private async _handleConversationSend(data: { sessionId: string; content: string }): Promise<void> {
  const conversationService = ConversationService.getInstance();
  
  // Process message and get response
  const response = await conversationService.processMessage(
    data.sessionId,
    data.content
  );
  
  this._panel.webview.postMessage({
    type: 'conversation.message',
    data: response
  });
}

private async _handleConversationFeedback(data: DetailedFeedback): Promise<void> {
  const feedbackHandler = FeedbackHandler.getInstance();
  await feedbackHandler.handleDetailedFeedback(data);
}

// Update message router:
private _handleMessage(message: any): void {
  switch (message.type) {
    // ... existing cases ...
    
    case 'conversation.start':
      this._handleConversationStart(message.data);
      break;
      
    case 'conversation.send':
      this._handleConversationSend(message.data);
      break;
      
    case 'conversation.feedback':
      this._handleConversationFeedback(message.data);
      break;
  }
}
```

**Files to Create/Modify:**
- Modify: `vscode-extension/src/webview/RCAWebviewProvider.ts`
- Create: `vscode-extension/src/services/ConversationService.ts` (NEW)

---

#### ConversationService.ts (New Backend Service)
**Location:** `vscode-extension/src/services/ConversationService.ts`

```typescript
/**
 * NEW FILE - Backend service for conversation orchestration
 * Bridges between webview and agent layer
 */

import { ConversationManager } from '@/agent/ConversationManager';
import { Message, ConversationSession } from '@/types/conversation';

export class ConversationService {
  private static instance: ConversationService;
  private conversationManager: ConversationManager;
  
  private constructor() {
    this.conversationManager = new ConversationManager();
  }
  
  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }
  
  async startConversation(rcaId: string): Promise<ConversationSession> {
    return this.conversationManager.createSession(rcaId);
  }
  
  async processMessage(sessionId: string, content: string): Promise<Message> {
    return this.conversationManager.handleUserMessage(sessionId, content);
  }
  
  async getSession(sessionId: string): Promise<ConversationSession> {
    return this.conversationManager.getSession(sessionId);
  }
}
```

**Creates dependency on:**
- `src/agent/ConversationManager.ts` (NEW - from roadmap Phase 1)
- `src/agent/IntentClassifier.ts` (NEW - from roadmap Phase 2)

---

### Agent Layer Integration

#### Files from Roadmap to Implement:

1. **ConversationManager.ts**
   - Location: `src/agent/ConversationManager.ts`
   - Status: [X] Not implemented
   - Reference: Roadmap Phase 1 (lines 214-216)

2. **ConversationMemory.ts**
   - Location: `src/agent/ConversationMemory.ts`
   - Status: [X] Not implemented
   - Reference: Roadmap Phase 1 (lines 219-221)

3. **IntentClassifier.ts**
   - Location: `src/agent/IntentClassifier.ts`
   - Status: [X] Not implemented
   - Reference: Roadmap Phase 2 (lines 266-267)

4. **RefinementAgent.ts**
   - Location: `src/agent/RefinementAgent.ts`
   - Status: [X] Not implemented
   - Reference: Roadmap Phase 3 (lines 337-338)

5. **ClarificationAgent.ts**
   - Location: `src/agent/ClarificationAgent.ts`
   - Status: [X] Not implemented
   - Reference: Roadmap Phase 4 (lines 392-393)

---

## File Structure

### Complete Directory Structure After Implementation

```
vscode-extension/
├── src/                                           # Extension backend
│   ├── webview/
│   │   ├── RCAWebviewProvider.ts                 # [MODIFY] Add conversation handlers
│   │   └── ConversationWebviewProvider.ts        # [NEW] Dedicated conversation view
│   │
│   ├── services/
│   │   ├── AnalysisService.ts                    # [EXISTING]
│   │   └── ConversationService.ts                # [NEW] Conversation orchestration
│   │
│   └── extension.ts                               # [MODIFY] Register conversation commands
│
├── webview/                                       # Webview frontend
│   ├── src/
│   │   ├── App.tsx                               # [MODIFY] Add ChatBox route
│   │   │
│   │   ├── components/
│   │   │   ├── conversation/                     # [NEW FOLDER]
│   │   │   │   ├── ChatBox.tsx                  # [NEW] Main chat interface
│   │   │   │   ├── MessageList.tsx              # [NEW] Message container
│   │   │   │   ├── MessageBubble.tsx            # [NEW] Individual message
│   │   │   │   ├── MessageActions.tsx           # [NEW] Action buttons
│   │   │   │   ├── MessageContent.tsx           # [NEW] Content renderer
│   │   │   │   ├── MessageTimestamp.tsx         # [NEW] Time display
│   │   │   │   ├── ChatInput.tsx                # [NEW] Input field
│   │   │   │   ├── TypingIndicator.tsx          # [NEW] Loading animation
│   │   │   │   ├── AnalysisSummary.tsx          # [NEW] Analysis header
│   │   │   │   ├── ConfidenceBadge.tsx          # [NEW] Confidence display
│   │   │   │   ├── SuggestedActions.tsx         # [NEW] Quick actions
│   │   │   │   ├── FeedbackPanel.tsx            # [NEW] Feedback form
│   │   │   │   ├── ClarificationPrompt.tsx      # [NEW] Agent questions
│   │   │   │   ├── CodeBlock.tsx                # [NEW] Code display
│   │   │   │   └── index.ts                     # [NEW] Exports
│   │   │   │
│   │   │   ├── ui/                               # [NEW FOLDER] from Figma
│   │   │   │   ├── button.tsx                   # [COPY] from Figma
│   │   │   │   ├── input.tsx                    # [COPY] from Figma
│   │   │   │   ├── textarea.tsx                 # [COPY] from Figma
│   │   │   │   ├── badge.tsx                    # [COPY] from Figma
│   │   │   │   ├── card.tsx                     # [COPY] from Figma
│   │   │   │   ├── dialog.tsx                   # [COPY] from Figma
│   │   │   │   ├── tooltip.tsx                  # [COPY] from Figma
│   │   │   │   ├── avatar.tsx                   # [COPY] from Figma
│   │   │   │   ├── scroll-area.tsx              # [COPY] from Figma
│   │   │   │   ├── checkbox.tsx                 # [COPY] from Figma
│   │   │   │   ├── separator.tsx                # [COPY] from Figma
│   │   │   │   ├── skeleton.tsx                 # [COPY] from Figma
│   │   │   │   └── auto-resize-textarea.tsx     # [NEW] Custom component
│   │   │   │
│   │   │   ├── AnalysisPanel.tsx                # [EXISTING]
│   │   │   └── ErrorList.tsx                    # [EXISTING]
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWebview.ts                    # [EXISTING]
│   │   │   ├── useConversation.ts               # [NEW] Conversation state
│   │   │   ├── useRCAAnalysis.ts                # [NEW] Analysis data
│   │   │   ├── useMessageStream.ts              # [NEW] Streaming messages
│   │   │   └── useFeedback.ts                   # [NEW] Feedback handling
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts                         # [EXISTING]
│   │   │   └── conversation.ts                  # [NEW] Chat types
│   │   │
│   │   ├── utils/
│   │   │   ├── messageFormatters.ts             # [NEW] Format messages
│   │   │   ├── timestampUtils.ts                # [NEW] Time formatting
│   │   │   └── codeHighlighting.ts              # [NEW] Syntax highlighting
│   │   │
│   │   └── styles/
│   │       ├── tailwind.css                     # [MODIFY] Add new utilities
│   │       └── conversation.css                 # [NEW] Chat-specific styles
│   │
│   ├── index.html                                # [MODIFY] Update scripts
│   ├── package.json                              # [MODIFY] Add dependencies
│   └── tailwind.config.js                        # [MODIFY] Extend theme
│
└── package.json                                   # [MODIFY] Add dependencies
```

### Legend:
- [EXISTING] - Already in codebase, no changes needed
- [MODIFY] - Existing file needs updates
- [NEW] - New file to create
- [COPY] - Copy from Figma design

---

## Implementation Roadmap

### Phase-by-Phase Implementation Guide

#### Phase 0: Preparation (Days 1-2)
**Goal:** Set up infrastructure and copy design system components

**Tasks:**
1. Copy UI components from Figma prototype
   ```bash
   cp -r "Figma/Replicate UI Design/src/app/components/ui" \
         "vscode-extension/webview/src/components/ui"
   ```

2. Install additional dependencies
   ```bash
   cd vscode-extension/webview
   npm install lucide-react @radix-ui/react-dialog @radix-ui/react-tooltip
   npm install -D @types/node
   ```

3. Create type definitions
   - Create `types/conversation.ts`
   - Export from `types/index.ts`

4. Update Tailwind config
   - Merge Figma theme tokens
   - Add conversation-specific utilities

**Deliverables:**
- [x] UI component library integrated
- [x] Type definitions in place
- [x] Development environment ready

---

#### Phase 1: Basic Chat UI (Days 3-5)
**Goal:** Create functional chat interface without backend integration

**Tasks:**
1. Create folder structure
   ```bash
   mkdir -p vscode-extension/webview/src/components/conversation
   mkdir -p vscode-extension/webview/src/hooks
   ```

2. Build core components:
   - `ChatBox.tsx` - Main container
   - `MessageList.tsx` - Message display area
   - `MessageBubble.tsx` - Individual messages
   - `ChatInput.tsx` - Input field
   - `TypingIndicator.tsx` - Loading state

3. Implement local state management
   - Mock conversation data
   - Test message sending
   - Verify UI responsiveness

4. Add to main App
   ```tsx
   // In App.tsx
   import { ChatBox } from '@/components/conversation/ChatBox';
   
   function App() {
     return (
       <div>
         {/* Existing UI */}
         <ChatBox rcaId="mock-id" />
       </div>
     );
   }
   ```

**Deliverables:**
- [x] Chat UI renders correctly
- [x] Messages can be sent (locally)
- [x] Typing indicator works
- [x] Input field auto-resizes

**Testing:**
```bash
cd vscode-extension/webview
npm run dev
# Verify chat UI in browser
```

---

#### Phase 2: Webview Communication (Days 6-8)
**Goal:** Connect frontend to extension backend via message passing

**Tasks:**
1. Create `useConversation` hook
   - Connect to `useWebview`
   - Handle message passing
   - Manage conversation state

2. Update `RCAWebviewProvider.ts`
   - Add conversation message handlers
   - Route messages to backend

3. Create `ConversationService.ts`
   - Orchestrate conversation flow
   - Bridge webview ↔ agent layer

4. Test message flow
   - Send message from webview → extension → agent
   - Receive response agent → extension → webview

**Deliverables:**
- [x] Messages flow between webview and extension
- [x] Conversation state persists
- [x] Error handling in place

**Testing:**
```typescript
// In extension
console.log('Received message:', message);

// In webview
postMessage({ type: 'conversation.send', data: { content: 'test' } });
```

---

#### Phase 3: Analysis Integration (Days 9-11)
**Goal:** Display RCA analysis context in chat interface

**Tasks:**
1. Create `AnalysisSummary` component
   - Fetch analysis data
   - Display root cause, confidence, file
   - Add expand/collapse

2. Create `ConfidenceBadge` component
   - Show confidence score
   - Display trend arrows

3. Integrate with existing analysis
   - Connect to `AnalysisService`
   - Load analysis by RCA ID
   - Update when refined

4. Add `useRCAAnalysis` hook
   - Subscribe to analysis updates
   - Handle loading states

**Deliverables:**
- [x] Analysis summary appears above chat
- [x] Confidence badge shows score
- [x] Data loads from backend correctly

---

#### Phase 4: Interactive Features (Days 12-15)
**Goal:** Add message actions, feedback, and suggested actions

**Tasks:**
1. Create `MessageActions` component
   - Thumbs up button
   - Copy button
   - Refine button
   - Reply button

2. Create `FeedbackPanel` component
   - Multi-category selection
   - Free-text input
   - Submit to backend

3. Create `SuggestedActions` component
   - Display contextual suggestions
   - Handle selection

4. Wire up feedback pipeline
   - Connect to existing `FeedbackHandler`
   - Store detailed feedback

**Deliverables:**
- [x] Users can give thumbs up
- [x] Users can copy messages
- [x] Detailed feedback modal works
- [x] Suggested actions appear

---

#### Phase 5: Agent Layer Integration (Days 16-20)
**Goal:** Connect to conversation agent system (Phase 1-2 from roadmap)

**Tasks:**
1. Implement backend services:
   - `ConversationManager.ts`
   - `ConversationMemory.ts`
   - `IntentClassifier.ts`

2. Connect chat to agent
   - Route messages to `MinimalReactAgent`
   - Process intents
   - Return formatted responses

3. Add conversation persistence
   - Store sessions in ChromaDB
   - Link to RCA documents

4. Test end-to-end flow
   - User sends message
   - Agent processes
   - Response appears in chat

**Deliverables:**
- [x] Agent responds to user messages
- [x] Intents classified correctly
- [x] Conversations persist
- [x] Full flow works end-to-end

---

#### Phase 6: Advanced Features (Days 21-25)
**Goal:** Add clarification prompts, refinement, and streaming

**Tasks:**
1. Create `ClarificationPrompt` component
   - Display agent questions
   - Interactive answer options

2. Implement message streaming
   - Token-by-token display
   - Update message as tokens arrive

3. Add refinement flow
   - Process user corrections
   - Re-run analysis
   - Show diff/changes

4. Code syntax highlighting
   - Create `CodeBlock` component
   - Detect language
   - Apply syntax colors

**Deliverables:**
- [x] Agent can ask questions
- [x] Streaming messages work
- [x] Refinement updates analysis
- [x] Code displays with syntax highlighting

---

#### Phase 7: Polish & Testing (Days 26-30)
**Goal:** Final UI polish, accessibility, and comprehensive testing

**Tasks:**
1. Accessibility
   - Add ARIA labels
   - Test keyboard navigation
   - Screen reader support

2. Performance optimization
   - Virtual scrolling for long chats
   - Lazy loading
   - Debounce input

3. Error handling
   - Retry failed messages
   - Show error states
   - Graceful degradation

4. Testing
   - Unit tests for components
   - Integration tests for message flow
   - E2E tests for full conversation

5. Documentation
   - Component usage docs
   - API reference
   - User guide

**Deliverables:**
- [x] WCAG 2.1 AA compliant
- [x] >80% test coverage
- [x] Error states handled
- [x] Documentation complete

---

## Migration Strategy

### Migrating to Floating Chat Widget

#### Step 1: Component Development (Week 1-2)

1. **Create conversation component structure:**
   ```bash
   mkdir -p vscode-extension/webview/src/components/conversation
   mkdir -p vscode-extension/webview/src/hooks
   mkdir -p vscode-extension/webview/src/types
   ```

2. **Build components in isolation:**
   - ChatWidget.tsx (collapsed/expanded states)
   - ConversationView.tsx (main chat interface)
   - ContextIndicator.tsx (view awareness)
   - MessageBubble.tsx, ChatInput.tsx, etc.

3. **Test with mock data:**
   ```typescript
   // In development, use mock conversation data
   const mockMessages = [
     { role: 'user', content: 'Why did you choose MainActivity.kt?' },
     { role: 'assistant', content: 'I analyzed the stack trace...' }
   ];
   ```

#### Step 2: Integration into App.tsx (Week 2-3)

1. **Add ChatWidget to main app:**
   ```tsx
   // vscode-extension/webview/src/App.tsx
   function App() {
     const [currentRoute, setCurrentRoute] = useState('/');
     
     return (
       <ConversationProvider>
         <div className="flex h-screen bg-zinc-950 text-zinc-50">
           <Sidebar onRouteChange={setCurrentRoute} />
           <main className="flex-1 overflow-auto">
             {renderView()}
           </main>
           
           {/* NEW: Floating chat widget */}
           <ChatWidget 
             context={getConversationContext(currentRoute)}
             currentView={currentRoute}
           />
         </div>
       </ConversationProvider>
     );
   }
   ```

2. **Initially hidden behind feature flag:**
   ```typescript
   const ENABLE_CHAT_WIDGET = false; // Toggle for development
   
   {ENABLE_CHAT_WIDGET && <ChatWidget {...props} />}
   ```

3. **Test across all 7 views:**
   - Navigate to each view
   - Verify widget appears correctly
   - Check context updates properly
   - Ensure no layout issues

#### Step 3: Backend Integration (Week 3-4)

1. **Wire up webview message passing:**
   - Connect ChatWidget to RCAWebviewProvider
   - Implement conversation message handlers
   - Test bidirectional communication

2. **Integrate with ConversationService:**
   ```typescript
   // Backend: vscode-extension/src/services/ConversationService.ts
   export class ConversationService {
     async startConversation(context: ConversationContext) {
       // Create session with view context
     }
     
     async sendMessage(sessionId: string, message: string, context: ConversationContext) {
       // Include view context in message
     }
   }
   ```

3. **Implement context-aware responses:**
   - Backend receives current view type
   - Agent adapts responses based on context
   - Suggested prompts change per view

#### Step 4: View-Specific Features (Week 4-6)

**Implement context-specific features for each view:**

1. **Dashboard:**
   - General workspace assistance
   - Status explanations
   - Navigation guidance

2. **Error Queue:**
   - Error prioritization
   - Bulk operation suggestions
   - Pattern detection

3. **Analyze:**
   - Active analysis discussion
   - Result clarification
   - Refinement requests

4. **History:**
   - Past analysis comparison
   - Trend explanation
   - Re-analysis suggestions

5. **Agent State:**
   - Reasoning explanation
   - Tool usage justification
   - Debugging assistance

6. **Fix Manager:**
   - Code change explanation
   - Risk assessment
   - Impact analysis

7. **Metrics:**
   - Metric interpretation
   - Trend analysis
   - Performance insights

#### Step 5: Polish & Testing (Week 6-7)

1. **UI/UX refinements:**
   - Smooth animations (slide-in, fade)
   - Keyboard shortcuts (Cmd+K to toggle)
   - Accessibility improvements
   - Loading states and skeletons

2. **Performance optimization:**
   - Virtual scrolling for long conversations
   - Message pagination
   - Lazy loading of history
   - Debounced input

3. **Comprehensive testing:**
   - Unit tests for all components
   - Integration tests for message flow
   - E2E tests across all views
   - Accessibility audit (WCAG 2.1 AA)

#### Step 6: Rollout (Week 7-8)

1. **Soft launch:**
   - Enable for internal testing
   - Gather feedback from team
   - Fix critical issues

2. **Beta release:**
   - Add opt-in setting: "Enable Conversational Assistant (Beta)"
   - Monitor usage metrics
   - Collect user feedback

3. **General availability:**
   - Enable by default for all users
   - Add onboarding tooltip on first use
   - Provide help documentation

### Rollback Plan

If issues arise:

1. **Quick disable:** Feature flag can hide widget immediately
2. **No data loss:** Conversation history preserved in backend
3. **Existing features:** All current RCA features remain functional
4. **User preference:** Users can manually disable in settings

---

## Implementation Roadmap

### Phase 0: Preparation (Week 1)

**Goal:** Set up component structure and copy required UI library components

**Tasks:**
- Create folder structure: `conversation/`, `hooks/`, `types/`
- Copy shadcn/ui components from Figma design
- Set up Tailwind configuration
- Create base TypeScript types

**Deliverables:**
- Folder structure created
- UI components available
- Type definitions in place

---

### Phase 1: Core Widget Components (Week 2)

**Goal:** Build non-functional UI components with mock data

**Roadmap Phase Mapping:** CONVERSATIONAL_RCA_ROADMAP.md Phase 1 (Foundation)

**Tasks:**
1. Build ChatWidget with collapsed/expanded states
2. Build ConversationView with message list
3. Build ContextIndicator with view awareness
4. Build MessageBubble with role-based styling
5. Build ChatInput with auto-resize
6. Build TypingIndicator animation

**Component Checklist:**
- [ ] ChatWidget.tsx - Main container
- [ ] ConversationView.tsx - Chat interface  
- [ ] ContextIndicator.tsx - View indicator
- [ ] MessageBubble.tsx - Individual message
- [ ] MessageList.tsx - Scrollable container
- [ ] ChatInput.tsx - Input field
- [ ] TypingIndicator.tsx - Loading state
- [ ] SuggestedActions.tsx - Quick replies

**Deliverables:**
- All components render with mock data
- Widget toggles between collapsed/expanded
- Context indicator shows current view
- Messages display correctly

---

### Phase 2: State Management (Week 3)

**Goal:** Implement conversation state and webview communication

**Roadmap Phase Mapping:** CONVERSATIONAL_RCA_ROADMAP.md Phase 1 (Foundation)

**Tasks:**
1. Create useConversation hook
2. Create ConversationContext provider
3. Implement message sending to backend
4. Implement message receiving from backend
5. Handle loading and error states

**Hook Implementation:**

**Hook Implementation:**
```typescript
// vscode-extension/webview/src/hooks/useConversation.ts
export function useConversation(context: ConversationContext) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const { postMessage } = useWebview();
  
  // Update prompts when context changes
  useEffect(() => {
    setSuggestedPrompts(getPromptsForView(context.viewType));
  }, [context.viewType]);
  
  const sendMessage = async (content: string) => {
    // Add user message immediately
    const userMessage = { role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to backend with context
    postMessage('conversation.send', {
      content,
      context
    });
    
    setIsTyping(true);
  };
  
  // Listen for responses
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'conversation.message') {
        setMessages(prev => [...prev, event.data.message]);
        setIsTyping(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  return { messages, sendMessage, isTyping, suggestedPrompts };
}
```

**Deliverables:**
- useConversation hook functional
- Messages send to backend
- Responses received and displayed
- Context awareness working

---

### Phase 3: Context Integration (Week 4)

**Goal:** Make chat context-aware for all 7 views

**Roadmap Phase Mapping:** CONVERSATIONAL_RCA_ROADMAP.md Phase 2 (Intent Classification)

**Tasks:**
1. Implement context detection in App.tsx
2. Create view-specific prompt sets
3. Update ContextIndicator to show proper view
4. Test context switching between views

**View Integration Checklist:**
- [ ] Dashboard - General assistance
- [ ] Error Queue - Error management help
- [ ] Analyze - Active analysis discussion
- [ ] History - Past analysis exploration
- [ ] Agent State - Reasoning explanation
- [ ] Fix Manager - Code fix clarification
- [ ] Metrics - Data interpretation

**Deliverables:**
- Context updates on route change
- Suggested prompts change per view
- Backend receives context with messages

---

### Phase 4: Backend Integration (Week 5)

**Goal:** Connect to full conversational backend

**Roadmap Phase Mapping:** CONVERSATIONAL_RCA_ROADMAP.md Phase 1-3

**Tasks:**
1. Enhance RCAWebviewProvider with conversation handlers
2. Create ConversationService in extension backend
3. Integrate with ConversationManager
4. Implement message streaming
5. Add error handling and retry logic

**Backend Checklist:**
- [ ] RCAWebviewProvider message handlers
- [ ] ConversationService created
- [ ] Message routing functional
- [ ] Streaming responses working
- [ ] Error states handled

**Deliverables:**
- Full backend integration complete
- Real AI responses working
- Context-aware suggestions functional

---

### Phase 5: Advanced Features (Week 6-7)

**Goal:** Add rich interactions and feedback

**Roadmap Phase Mapping:** CONVERSATIONAL_RCA_ROADMAP.md Phase 3-5

**Tasks:**
1. Implement FeedbackPanel for detailed feedback
2. Add AnalysisSummary for context display
3. Implement MessageActions (thumbs, copy, refine)
4. Add conversation history persistence
5. Implement suggested actions

**Feature Checklist:**
- [ ] Detailed feedback panel
- [ ] Analysis summary display
- [ ] Message action buttons
- [ ] Conversation persistence
- [ ] Quick action suggestions

**Deliverables:**
- Users can provide detailed feedback
- Analysis context visible in chat
- Message interactions working
- Conversations persist across reloads

---

### Phase 6: Polish & Optimization (Week 8)

**Goal:** Production-ready quality and performance

**Roadmap Phase Mapping:** CONVERSATIONAL_RCA_ROADMAP.md Phase 6-7

**Tasks:**
1. Add animations (slide-in, fade, pulse)
2. Implement keyboard shortcuts (Cmd+K)
3. Optimize virtual scrolling
4. Add loading skeletons
5. Accessibility audit and fixes
6. Performance testing

**Quality Checklist:**
- [ ] Smooth animations
- [ ] Keyboard shortcuts working
- [ ] Virtual scrolling optimized
- [ ] Loading states polished
- [ ] WCAG 2.1 AA compliant
- [ ] >80% test coverage
- [ ] Error states handled
- [ ] Documentation complete

**Deliverables:**
- Production-ready UI
- Accessibility compliant
- Performance optimized
- Comprehensive tests

---

## Testing Checklist

### Component Testing

- [ ] **ChatWidget**
  - [ ] Toggles between collapsed and expanded states
  - [ ] Shows unread count badge
  - [ ] Pulses when agent is typing
  - [ ] Persists state to localStorage
  - [ ] Renders on all views

- [ ] **ConversationView**
  - [ ] Renders with mock data
  - [ ] Handles empty state
  - [ ] Scrolls to bottom on new message
  - [ ] Maintains scroll position when loading history
  - [ ] Updates context indicator on view change

- [ ] **ContextIndicator**
  - [ ] Shows correct view name and icon
  - [ ] Updates when route changes
  - [ ] Displays proper color coding

- [ ] **MessageBubble**
  - [ ] Displays user messages correctly
  - [ ] Displays assistant messages correctly
  - [ ] Shows timestamp
  - [ ] Renders markdown
  - [ ] Highlights code blocks

- [ ] **ChatInput**
  - [ ] Sends on Enter key
  - [ ] Shift+Enter adds newline
  - [ ] Disables when empty
  - [ ] Auto-resizes textarea
  - [ ] Clears after sending

- [ ] **MessageActions**
  - [ ] Thumbs up increments count
  - [ ] Copy copies to clipboard
  - [ ] Refine opens refinement flow
  - [ ] Reply starts new message thread

- [ ] **FeedbackPanel**
  - [ ] Opens from message action
  - [ ] Validates required fields
  - [ ] Submits to backend
  - [ ] Closes after submission

### Integration Testing

- [ ] **Message Flow**
  - [ ] User sends message -> backend receives with context
  - [ ] Backend responds -> UI updates
  - [ ] Error handling works
  - [ ] Retry mechanism functions

- [ ] **Context Switching**
  - [ ] Context updates on route change
  - [ ] Suggested prompts change per view
  - [ ] Backend receives updated context
  - [ ] Conversation maintains continuity

- [ ] **View Integration**
  - [ ] Widget appears on all 7 views
  - [ ] No layout conflicts
  - [ ] Z-index correct
  - [ ] Responsive to view content changes

- [ ] **Analysis Integration**
  - [ ] Analysis summary loads
  - [ ] Confidence badge displays correctly
  - [ ] Analysis updates trigger UI refresh

- [ ] **Conversation Persistence**
  - [ ] Sessions save to database
  - [ ] Conversation history loads
  - [ ] Resume after refresh works

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces messages
- [ ] ARIA labels present
- [ ] Focus management correct
- [ ] Color contrast passes WCAG AA

### Performance Testing

- [ ] 100+ messages scroll smoothly
- [ ] Message send latency <200ms
- [ ] Memory usage stable over time
- [ ] No memory leaks in long sessions

---

## Quick Reference

### Key Files to Remember

| Purpose               | Current Location                                                                                              | New Location                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Webview Provider**  | `vscode-extension/src/webview/RCAWebviewProvider.ts`                                                          | Modify this (add conversation handlers)                             |
| **Analysis Service**  | `vscode-extension/src/services/AnalysisService.ts`                                                            | Reference this                                                      |
| **Main App**          | `vscode-extension/webview/src/App.tsx`                                                                        | Add ChatWidget here                                                 |
| **Existing Views**    | `vscode-extension/webview/src/views/`                                                                         | Reference for context detection                                     |
| **UI Components**     | `Figma/Replicate UI Design/src/app/components/ui/`                                                            | Copy to `webview/src/components/ui/`                                |
| **Chat Design**       | `Figma/Replicate UI Design/src/app/components/ChatBox.tsx`                                                    | Adapt to `webview/src/components/conversation/ConversationView.tsx` |
| **Floating Widget**   | N/A (new)                                                                                                     | Create `webview/src/components/conversation/ChatWidget.tsx`         |
| **Context Types**     | N/A (new)                                                                                                     | Create `webview/src/types/conversation.ts`                          |
| **Conversation Hook** | N/A (new)                                                                                                     | Create `webview/src/hooks/useConversation.ts`                       |
| **Roadmap**           | `docs/_archive/RCA-AGENT-V3.5/Polishing-Improving/5-Conversational-Improvement/CONVERSATIONAL_RCA_ROADMAP.md` | Reference for backend features and phases                           |

### Component Hierarchy

```
App.tsx
├── Sidebar (existing)
├── Main Content (existing)
│   ├── Dashboard
│   ├── ErrorQueue
│   ├── Analyze
│   ├── History
│   ├── AgentState
│   ├── FixManager
│   └── Metrics
└── ChatWidget (NEW - floating)
    ├── Collapsed State (icon button)
    └── Expanded State
        ├── Header
        ├── ContextIndicator
        └── ConversationView
            ├── AnalysisSummary (conditional)
            ├── MessageList
            │   └── MessageBubble[]
            ├── TypingIndicator (conditional)
            ├── SuggestedActions
            └── ChatInput
```

### Important Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "lucide-react": "^0.294.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "tailwindcss": "^3.3.0"
  }
}
```

### Color Tokens (From Current RCA Theme)

```css
/* Current RCA theme - maintain consistency */
--background: #09090b;      /* zinc-950 */
--surface: #18181b;         /* zinc-900 */
--surface-elevated: #27272a; /* zinc-800 */
--border: #3f3f46;          /* zinc-700 */
--text-primary: #fafafa;    /* zinc-50 */
--text-secondary: #a1a1aa;  /* zinc-400 */
--accent: #2563eb;          /* blue-600 */
--success: #10b981;         /* green-500 */
--error: #ef4444;           /* red-500 */
--warning: #f59e0b;         /* yellow-500 */
```

### View Type Constants

```typescript
// Use these exact strings for view types
type ViewType = 
  | 'dashboard'  // Route: /
  | 'errors'     // Route: /errors
  | 'analyze'    // Route: /analyze
  | 'history'    // Route: /history
  | 'agent'      // Route: /agent
  | 'fixes'      // Route: /fixes
  | 'metrics';   // Route: /metrics
```

---

## Next Steps

1. **Review this document** with the team
2. **Copy UI components** from Figma to webview (Phase 0)
3. **Create folder structure** for conversation components
4. **Build ChatBox UI** with mock data (Phase 1)
5. **Wire up webview communication** (Phase 2)
6. **Integrate with backend** incrementally (Phases 3-5)

---

## Support & Resources

- **Roadmap:** [CONVERSATIONAL_RCA_ROADMAP.md](./CONVERSATIONAL_RCA_ROADMAP.md)
- **Design:** `Figma/Replicate UI Design/`
- **Existing Code:** `vscode-extension/webview/src/`
- **Backend:** `src/agent/`

---

## Summary

### Key Implementation Decisions

1. **Floating Widget Pattern**: Chat overlay accessible on all views without duplicating code
2. **Context-Aware System**: Chat adapts behavior based on current view (Dashboard, Analyze, History, etc.)
3. **Persistent State**: Widget state and conversations persist across navigation and reloads
4. **Non-Intrusive Design**: Collapsible widget doesn't disrupt existing layouts
5. **Unified Component Architecture**: Reusable components across all views

### Integration with Existing RCA Views

The chatbox integrates with all 7 existing views:

| View            | Chat Purpose        | Key Features                                        |
| --------------- | ------------------- | --------------------------------------------------- |
| **Dashboard**   | General assistance  | Status explanations, navigation guidance            |
| **Error Queue** | Error management    | Prioritization, pattern detection, bulk suggestions |
| **Analyze**     | Active analysis     | Result clarification, refinement, alternatives      |
| **History**     | Past exploration    | Comparisons, trend explanations, re-analysis        |
| **Agent State** | Debug visualization | Reasoning explanation, tool justification           |
| **Fix Manager** | Code fix help       | Change explanation, risk assessment, impact         |
| **Metrics**     | Data interpretation | Metric explanations, trend analysis, insights       |

### Component Structure Overview

```
App.tsx (Enhanced)
├── Sidebar (Existing)
├── View Router (Existing)
│   └── 7 Views (Dashboard, ErrorQueue, Analyze, History, AgentState, FixManager, Metrics)
└── ChatWidget (NEW - Floating)
    ├── Collapsed State (Icon + Badge)
    └── Expanded State (Full Chat Panel)
        ├── Header (Title + Controls)
        ├── ContextIndicator (Current View)
        └── ConversationView (Chat Interface)
            ├── AnalysisSummary (When in Analyze view)
            ├── MessageList (Virtual scrolling)
            ├── TypingIndicator (Loading state)
            ├── SuggestedActions (Context-specific)
            └── ChatInput (Auto-resize)
```

### Implementation Timeline

- **Week 1-2**: Component development with mock data
- **Week 3**: State management and webview communication
- **Week 4**: Context awareness for all 7 views
- **Week 5**: Backend integration (ConversationService, RCAWebviewProvider)
- **Week 6-7**: Advanced features (feedback, history, actions)
- **Week 8**: Polish, testing, accessibility
- **Week 7-8**: Rollout (internal → beta → GA)

### Success Criteria

- Widget appears on all 7 views consistently
- Context updates correctly on route changes
- Conversations persist across navigation
- No layout conflicts or z-index issues
- Smooth animations and transitions
- WCAG 2.1 AA accessibility compliance
- >80% test coverage
- Positive user feedback in beta testing

---

## Testing Strategy

### Unit Tests

#### Frontend Components

```typescript
// ChatWidget.test.tsx
describe('ChatWidget', () => {
  it('renders collapsed by default', () => { /* ... */ });
  it('expands on click', () => { /* ... */ });
  it('persists expanded state to localStorage', () => { /* ... */ });
  it('updates context on route change', () => { /* ... */ });
});

// ConversationView.test.tsx
describe('ConversationView', () => {
  it('displays messages in correct order', () => { /* ... */ });
  it('shows loading indicator while sending', () => { /* ... */ });
  it('handles message send errors gracefully', () => { /* ... */ });
  it('scrolls to bottom on new message', () => { /* ... */ });
});

// useConversation.test.ts
describe('useConversation hook', () => {
  it('sends message via webview API', () => { /* ... */ });
  it('updates state on message received', () => { /* ... */ });
  it('handles streaming responses', () => { /* ... */ });
  it('loads history on mount', () => { /* ... */ });
});
```

#### Backend Services

```typescript
// ConversationManager.test.ts
describe('ConversationManager', () => {
  it('creates new conversation session', async () => { /* ... */ });
  it('routes messages to correct handler', async () => { /* ... */ });
  it('maintains conversation context', async () => { /* ... */ });
  it('compresses long conversations', async () => { /* ... */ });
});

// IntentClassifier.test.ts
describe('IntentClassifier', () => {
  it('classifies clarification intents correctly', async () => {
    const result = await classifier.classify("What does this mean?");
    expect(result.intent).toBe(MessageIntent.CLARIFICATION);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  it('classifies refinement intents correctly', async () => {
    const result = await classifier.classify("Try looking in UserRepository instead");
    expect(result.intent).toBe(MessageIntent.REFINEMENT);
  });
  
  it('extracts entities from messages', async () => {
    const result = await classifier.classify("The error is in MainActivity.kt line 45");
    expect(result.entities).toContainEqual({
      type: 'file',
      value: 'MainActivity.kt'
    });
    expect(result.entities).toContainEqual({
      type: 'line',
      value: 45
    });
  });
});

// RefinementAgent.test.ts
describe('RefinementAgent', () => {
  it('applies user corrections', async () => { /* ... */ });
  it('generates meaningful deltas', async () => { /* ... */ });
  it('improves confidence after refinement', async () => { /* ... */ });
  it('merges old and new insights', async () => { /* ... */ });
});
```

### Integration Tests

#### End-to-End Conversation Flows

```typescript
describe('E2E: Complete Conversation Flow', () => {
  it('user asks follow-up question', async () => {
    // 1. Start with completed analysis
    const analysis = await runAnalysis(sampleError);
    
    // 2. User asks clarification
    await sendMessage("Why did you choose MainActivity.kt?");
    
    // 3. Verify response
    const response = await waitForResponse();
    expect(response.intent).toBe(MessageIntent.CLARIFICATION);
    expect(response.content).toContain("MainActivity");
    
    // 4. Verify conversation persisted
    const session = await getConversationSession();
    expect(session.messages).toHaveLength(2);
  });
  
  it('agent asks clarification and user responds', async () => {
    // 1. Start analysis with ambiguity
    mockLowConfidence(0.45);
    const analysis = await runAnalysis(ambiguousError);
    
    // 2. Expect clarification request
    const clarification = await waitForClarification();
    expect(clarification.questions).toHaveLength(1);
    
    // 3. User answers
    await answerClarification({
      requestId: clarification.id,
      answers: { gradleVersion: '8.0' }
    });
    
    // 4. Analysis completes with higher confidence
    const finalResult = await waitForAnalysis();
    expect(finalResult.confidence).toBeGreaterThan(0.7);
  });
  
  it('iterative refinement improves analysis', async () => {
    // 1. Initial analysis
    const v1 = await runAnalysis(sampleError);
    expect(v1.confidence).toBe(0.6);
    
    // 2. User corrects file
    await sendMessage("Actually, check UserRepository.kt instead");
    
    // 3. Refined analysis
    const v2 = await waitForRefinedAnalysis();
    expect(v2.confidence).toBeGreaterThan(v1.confidence);
    expect(v2.relevantFiles).toContain("UserRepository.kt");
    
    // 4. Delta generated
    const delta = v2.delta;
    expect(delta.changes.relevantFiles.added).toContain("UserRepository.kt");
    expect(delta.changes.relevantFiles.removed).toContain("MainActivity.kt");
  });
});

describe('E2E: Context-Aware Behavior', () => {
  it('adapts suggestions to Dashboard view', async () => {
    navigateTo('/');
    const suggestions = await getSuggestedActions();
    expect(suggestions).toContainEqual(expect.objectContaining({
      text: "What errors need my attention?"
    }));
  });
  
  it('adapts suggestions to Analyze view', async () => {
    navigateTo('/analyze');
    const suggestions = await getSuggestedActions();
    expect(suggestions).toContainEqual(expect.objectContaining({
      text: "Why did you choose this file?"
    }));
  });
  
  it('maintains conversation across views', async () => {
    // Start conversation in Analyze view
    navigateTo('/analyze');
    await sendMessage("Can you explain the root cause?");
    
    // Navigate to History
    navigateTo('/history');
    
    // Continue conversation
    await sendMessage("Compare this with the previous error");
    
    // Both messages in same session
    const session = await getConversationSession();
    expect(session.messages).toHaveLength(4); // 2 user + 2 agent
  });
});
```

### Performance Tests

```typescript
describe('Performance: Message Rendering', () => {
  it('renders 100 messages in <500ms', async () => {
    const messages = generateMessages(100);
    const start = performance.now();
    render(<ConversationView messages={messages} />);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });
  
  it('virtual scrolling maintains 60fps', async () => {
    const messages = generateMessages(1000);
    render(<ConversationView messages={messages} />);
    
    const scrollElement = screen.getByTestId('message-list');
    const frameTimings = await measureScrollPerformance(scrollElement);
    const avgFps = calculateFPS(frameTimings);
    expect(avgFps).toBeGreaterThan(55);
  });
});

describe('Performance: Streaming', () => {
  it('handles high-frequency token streams', async () => {
    const tokenStream = generateTokenStream(100, 10); // 100 tokens, 10ms interval
    const latencies = [];
    
    tokenStream.on('token', (token, timestamp) => {
      const renderStart = performance.now();
      updateMessage(token);
      const renderEnd = performance.now();
      latencies.push(renderEnd - renderStart);
    });
    
    await tokenStream.complete();
    const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
    expect(avgLatency).toBeLessThan(50);
  });
});

describe('Performance: Memory Management', () => {
  it('does not leak memory with long conversations', async () => {
    const baseline = measureMemory();
    
    // Simulate 500 messages
    for (let i = 0; i < 500; i++) {
      await sendMessage(`Message ${i}`);
      await waitForResponse();
    }
    
    // Force GC (if available)
    if (global.gc) global.gc();
    
    const final = measureMemory();
    const increase = final - baseline;
    expect(increase).toBeLessThan(50 * 1024 * 1024); // <50MB
  });
});
```

### User Acceptance Testing

#### Test Scenarios

1. **First-Time User**
   - User completes analysis
   - Notices chat widget
   - Clicks to expand
   - Asks "What does this mean?"
   - Receives clear explanation
   - Provides positive feedback

2. **Power User**
   - User has multiple errors
   - Uses chat to compare analyses
   - Refines analysis with corrections
   - Agent asks clarifying questions
   - User provides detailed feedback
   - Notices improved future analyses

3. **Accessibility User**
   - Screen reader announces chat widget
   - Keyboard navigation works (Tab, Enter, Esc)
   - Messages are properly labeled
   - Focus management is logical
   - No information loss with assistive tech

#### Success Metrics

- **Adoption**: 70%+ of users who complete analysis also use chat
- **Engagement**: Average 2.5+ turns per conversation
- **Effectiveness**: 40%+ improvement in accuracy after refinement
- **Satisfaction**: >4.0/5.0 user rating
- **Efficiency**: 35% reduction in re-analysis rate

#### Beta Testing Plan

**Week 1-2: Internal Alpha**
- 5-10 team members
- Focus on bugs and crashes
- Iterate rapidly on feedback

**Week 3-5: Closed Beta**
- 20-30 external users
- Collect usage metrics
- A/B test with control group

**Week 6-7: Open Beta**
- All users (opt-in)
- Monitor success metrics
- Prepare for GA launch

**Week 8: General Availability**
- Enable for all users
- Continue monitoring metrics
- Plan for iteration

---

## Technical Specifications

### Data Models

#### ConversationSession

```typescript
interface ConversationSession {
  id: string;                          // Unique session ID
  rcaId: string;                       // Original RCA analysis ID
  userId?: string;                     // Optional user identifier
  startTime: number;                   // Timestamp
  lastActiveTime: number;              // Last message timestamp
  status: 'active' | 'completed' | 'abandoned';
  
  // Conversation state
  messages: ConversationMessage[];
  context: ConversationContext;
  
  // Metrics
  messageCount: number;
  refinementCount: number;
  clarificationCount: number;
  finalConfidence: number;
  
  // Metadata
  metadata: {
    errorType: string;
    language: string;
    projectPath?: string;
    tags?: string[];
  };
}
```

#### ConversationMessage

```typescript
interface ConversationMessage {
  id: string;                          // Message ID
  conversationId: string;              // Parent conversation
  role: 'user' | 'assistant' | 'system';
  
  // Content
  content: string;                     // Message text
  intent?: MessageIntent;              // Classified intent
  
  // If agent message
  analysis?: Partial<RCAResult>;       // Updated analysis
  delta?: AnalysisDelta;               // What changed
  clarificationRequest?: ClarificationRequest;
  
  // If user message
  feedback?: DetailedFeedback;
  clarificationResponse?: ClarificationResponse;
  
  // Metadata
  timestamp: number;
  status: 'sending' | 'sent' | 'error';
  error?: string;
  processingTime?: number;
}
```

#### ConversationContext

```typescript
interface ConversationContext {
  viewType: ViewType;
  currentRoute: string;
  
  // View-specific context
  errorContext?: {
    errorId: string;
    errorMessage: string;
    stackTrace?: string;
  };
  
  analysisContext?: {
    analysisId: string;
    currentIteration: number;
    confidence: number;
  };
  
  historyContext?: {
    selectedAnalysisId: string;
    comparisonIds?: string[];
  };
}

type ViewType = 
  | 'dashboard' 
  | 'error-queue' 
  | 'analyze' 
  | 'history' 
  | 'agent-state' 
  | 'fix-manager' 
  | 'metrics';
```

#### AnalysisDelta

```typescript
interface AnalysisDelta {
  previousVersion: number;
  currentVersion: number;
  timestamp: number;
  
  changes: {
    rootCause?: {
      old: string;
      new: string;
      reason: string;
    };
    
    relevantFiles?: {
      added: string[];
      removed: string[];
      reason: string;
    };
    
    proposedSolution?: {
      old: string;
      new: string;
      reason: string;
    };
    
    confidence?: {
      old: number;
      new: number;
      change: number;
    };
  };
  
  summary: string;  // Human-readable summary
}
```

#### DetailedFeedback

```typescript
interface DetailedFeedback {
  type: 'positive' | 'negative' | 'partial';
  
  // Multi-dimensional assessment
  dimensions: {
    rootCauseAccuracy: 1 | 2 | 3 | 4 | 5;
    solutionQuality: 1 | 2 | 3 | 4 | 5;
    explanationClarity: 1 | 2 | 3 | 4 | 5;
    relevantFiles: 1 | 2 | 3 | 4 | 5;
    toolUsage: 1 | 2 | 3 | 4 | 5;
    overallConfidence: 1 | 2 | 3 | 4 | 5;
  };
  
  // Detailed corrections
  corrections?: {
    correctRootCause?: string;
    correctFiles?: string[];
    correctSolution?: string;
    missingContext?: string;
  };
  
  // Free-form feedback
  comment?: string;
  
  // What went wrong
  issues?: Array<{
    category: 'hallucination' | 'incomplete' | 'wrong-file' | 'wrong-logic' | 'other';
    description: string;
    severity: 'minor' | 'moderate' | 'critical';
  }>;
  
  // What went right
  strengths?: string[];
  
  // Context
  analysisId: string;
  conversationId: string;
  timestamp: number;
}
```

#### ClarificationRequest

```typescript
interface ClarificationRequest {
  id: string;
  questions: ClarificationQuestion[];
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

interface ClarificationQuestion {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'file' | 'code' | 'version';
  options?: string[];          // For type: 'choice'
  fileTypes?: string[];        // For type: 'file'
  required: boolean;
  placeholder?: string;
}

interface ClarificationResponse {
  requestId: string;
  answers: Record<string, any>;
  timestamp: number;
}
```

### API Contracts

#### Webview ↔ Extension Messages

```typescript
// User sends message
type: 'conversation.send'
data: {
  conversationId?: string;
  content: string;
  contextData?: any;
}

// Extension streams response
type: 'conversation.response'
data: {
  messageId: string;
  content: string;  // Can be partial (streaming)
  isComplete: boolean;
  metadata?: {
    intent: MessageIntent;
    confidence?: number;
    analysis?: Partial<RCAResult>;
    delta?: AnalysisDelta;
  };
}

// Agent requests clarification
type: 'conversation.clarificationNeeded'
data: {
  conversationId: string;
  request: ClarificationRequest;
}

// User provides clarification
type: 'conversation.clarificationResponse'
data: {
  conversationId: string;
  response: ClarificationResponse;
}

// User provides feedback
type: 'conversation.feedback'
data: {
  messageId: string;
  feedback: DetailedFeedback;
}

// Context changes (route navigation)
type: 'conversation.contextChange'
data: {
  conversationId: string;
  newContext: ConversationContext;
}

// Load conversation history
type: 'conversation.loadHistory'
data: {
  conversationId: string;
  limit?: number;
  before?: number;  // timestamp
}

// History response
type: 'conversation.history'
data: {
  messages: ConversationMessage[];
  hasMore: boolean;
}
```

### State Management

#### React Context Structure

```typescript
interface ConversationState {
  // Current session
  currentSession: ConversationSession | null;
  
  // Messages
  messages: ConversationMessage[];
  streamingMessage: Partial<ConversationMessage> | null;
  
  // UI State
  isExpanded: boolean;
  isLoading: boolean;
  currentView: ViewType;
  
  // Pending interactions
  pendingClarification: ClarificationRequest | null;
  
  // History
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
}

interface ConversationActions {
  sendMessage: (content: string) => Promise<void>;
  provideFeedback: (messageId: string, feedback: DetailedFeedback) => Promise<void>;
  answerClarification: (response: ClarificationResponse) => Promise<void>;
  toggleExpanded: () => void;
  loadMoreHistory: () => Promise<void>;
  updateContext: (context: ConversationContext) => void;
}
```

### Storage Strategy

#### LocalStorage (UI State Only)

```typescript
// Key: rca-conversation-ui-state
{
  isExpanded: boolean;
  autoCollapseOnNavigate: boolean;
  preferredInputHeight: number;
}
```

#### ChromaDB (Persistent Storage)

**Collection: conversations**
- Document: Full conversation session
- Metadata: rcaId, userId, status, messageCount, startTime, endTime
- Embeddings: Not used (structural data only)

**Collection: conversation_messages**
- Document: Individual messages
- Metadata: conversationId, role, intent, timestamp
- Embeddings: Message content for semantic search

### Performance Targets

| Metric             | Target | Measurement                      |
| ------------------ | ------ | -------------------------------- |
| Initial Load       | <500ms | Time to render ChatWidget        |
| Message Send       | <100ms | UI response to send button       |
| Message Receive    | <200ms | First token to render            |
| Streaming Latency  | <50ms  | Per token render time            |
| History Load       | <300ms | Load 50 messages                 |
| Virtual Scroll FPS | >55fps | Scrolling through 1000+ messages |
| Memory Footprint   | <50MB  | With 500 messages loaded         |

### Error Handling

```typescript
enum ConversationErrorCode {
  NETWORK_ERROR = 'network_error',
  LLM_ERROR = 'llm_error',
  CONTEXT_LOST = 'context_lost',
  INVALID_MESSAGE = 'invalid_message',
  RATE_LIMIT = 'rate_limit',
  SESSION_EXPIRED = 'session_expired'
}

interface ConversationError {
  code: ConversationErrorCode;
  message: string;
  recoverable: boolean;
  retryAfter?: number;
}
```

### Security Considerations

1. **Input Sanitization**
   - Sanitize all user input before sending to LLM
   - Prevent prompt injection attacks
   - Escape special characters in markdown

2. **Rate Limiting**
   - Max 10 messages per minute per user
   - Exponential backoff on failures

3. **Data Privacy**
   - No PII in conversation logs
   - Optional encryption for stored conversations
   - Clear data retention policy

4. **Token Limits**
   - Max conversation context: 4000 tokens
   - Automatic compression after limit
   - Warning to user when approaching limit

---

### Related Documentation

- **Backend Strategy**: [CONVERSATIONAL_RCA_ROADMAP.md](./CONVERSATIONAL_RCA_ROADMAP.md)
- **Design Source**: `Figma/Replicate UI Design/src/app/components/`
- **Existing Code**: `vscode-extension/webview/src/`
- **Agent Architecture**: `src/agent/`

---

**Last Updated:** January 18, 2026  
**Maintained By:** Development Team  
**Status:** Living Document (Update as implementation progresses)
