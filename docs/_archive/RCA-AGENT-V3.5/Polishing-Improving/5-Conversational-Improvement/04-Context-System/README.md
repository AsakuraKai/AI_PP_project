# Context-Aware Conversation System

**Status:** Design Document  
**Priority:** [H] High - Core feature

---

## Table of Contents

- [Conversation Context System](#conversation-context-system)
- [View-Specific Features](#view-specific-features)
- [Context Switching](#context-switching)

---

## Conversation Context System

The chatbox dynamically adapts its behavior based on the current view, providing context-specific assistance and prompts.

### Context Data Structure

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

---

## View-Specific Features

### 1. Dashboard View

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

---

### 2. Error Queue View

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

---

### 3. Analyze View

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

---

### 4. History View

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

---

### 5. Agent State View

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

---

### 6. Fix Manager View

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

---

### 7. Metrics View

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

---

## Context Switching

**IMPORTANT**: Navigation does NOT remount the ChatWidget component. Only internal state updates occur.

When user navigates between views, the chatbox:

1. **Updates context indicator:** Shows current view name (UI update only)
2. **Adjusts suggested prompts:** Displays view-relevant quick actions (UI update only)
3. **Maintains conversation:** Previous messages remain accessible (state preserved)
4. **Notifies agent:** Backend receives context change event (message passing)

**Key Principle**: The component instance persists; only props and internal state change.

### Implementation

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

**Next:** [Component Specifications](../03-Component-Specifications/README.md)  
**Back:** [System Design](../02-System-Design/README.md)
