# System Design and Architecture

**Status:** Design Document  
**Priority:** [H] High - Core system understanding

---

## Table of Contents

- [System Components](#system-components)
- [Data Flow Scenarios](#data-flow-scenarios)
- [Current RCA Views](#current-rca-views)
- [Floating Widget Integration](#floating-widget-integration)
- [Architecture Mapping](#architecture-mapping)

---

## System Components

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

---

## Data Flow Scenarios

### Scenario 1: User Asks Follow-up Question

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

### Scenario 2: Agent Asks Clarifying Question

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

**Next:** [Component Specifications](../03-Component-Specifications/README.md)  
**Back:** [Architecture](../01-Architecture/README.md)
