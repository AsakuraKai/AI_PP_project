# Single Component Architecture [CRITICAL]

**Status:** Core Architectural Decision  
**Priority:** [!] Critical - Must understand before implementing

---

## Table of Contents

- [Design Principle](#design-principle)
- [Component Behavior Across Views](#component-behavior-across-views)
- [Visual Architecture](#visual-architecture)
- [Implementation Requirements](#implementation-requirements)
- [Navigation Flow](#navigation-flow)
- [Performance Benefits](#performance-benefits)
- [Common Mistakes](#common-mistakes)
- [Testing Checklist](#testing-checklist)
- [FAQ](#faq)

---

## Design Principle

**The ChatWidget is a SINGLE React component instance** that exists throughout the application lifecycle.

### Correct Implementation

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

### Incorrect Implementation

```tsx
// WRONG: Separate instance per route
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ChatWidget /> {/* Don't do this */}
    </div>
  );
}

function ErrorQueue() {
  return (
    <div>
      <h1>Errors</h1>
      <ChatWidget /> {/* Don't do this */}
    </div>
  );
}
```

---

## Component Behavior Across Views

### What Changes:
- **Context data** (which view is active)
- **Suggested prompts** (view-specific quick actions)
- **Context indicator badge** (shows "Dashboard", "Errors", etc.)
- **Internal state** (e.g., which analysis is being discussed)

### What NEVER Changes:
- **Component instance** (same React component)
- **DOM position** (fixed bottom-right)
- **Conversation history** (maintained across navigation)
- **Expanded/collapsed state** (unless configured otherwise)
- **Component structure** (same JSX tree)
- **Event listeners** (same handlers)

---

## Visual Architecture

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

---

## Implementation Requirements

### MUST:
1. Render ChatWidget **outside** `<Routes>` component
2. Use React Context to provide conversation state globally
3. Update context prop when route changes (not remount component)
4. Maintain conversation state in parent context/provider
5. Use `position: fixed` CSS for overlay behavior

### [NO] MUST NOT:
1. Render ChatWidget inside individual route components
2. Use route-based conditional rendering for the widget
3. Unmount/remount ChatWidget on navigation
4. Store conversation state in route component state
5. Use route-dependent positioning

---

## Navigation Flow

### User Journey Example

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

---

## Performance Benefits

### Single Instance Advantages:
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

---

## Common Mistakes

### [NO] Mistake 1: Conditional Rendering in Routes

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

### [NO] Mistake 2: Separate Context Providers Per View

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

### [NO] Mistake 3: Key Prop Based on Route

```tsx
// WRONG - Forces remount on navigation
<ChatWidget 
  key={currentRoute} {/* [NO] New key = new instance */}
  context={...}
/>
```

### Correct Pattern: Single Instance Outside Routes

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

---

## Testing Checklist

### Unit Tests

- [ ] ChatWidget renders in App.tsx
- [ ] Component does not remount on route change
- [ ] Context prop updates trigger re-render (not remount)
- [ ] Conversation state persists across navigation
- [ ] Expanded state persists across navigation
- [ ] Scroll position maintained in message list
- [ ] Event handlers remain attached

### Integration Tests

- [ ] Navigate between all 7 views
- [ ] Verify same component instance throughout
- [ ] Start conversation in Dashboard, continue in Errors
- [ ] Check scroll position maintained
- [ ] Verify no memory leaks after 100+ navigations
- [ ] Test context updates correctly for each view
- [ ] Verify suggested prompts change per view

### Manual Testing

- [ ] Open ChatWidget in Dashboard
- [ ] Type message but don't send
- [ ] Navigate to Error Queue
- [ ] Verify unsent message still in input field
- [ ] Verify conversation history visible
- [ ] Verify widget stays in same position
- [ ] Test expand/collapse state persists
- [ ] Check context badge updates correctly

---

## FAQ

### Q: Does the chatbox look different on different views?

**A:** Only minor UI elements update:
- Context badge text ("Dashboard" → "Error Queue")
- Suggested action buttons (view-specific)
- Internal state data

The component structure, position, and conversation remain identical.

### Q: What if I want view-specific behavior?

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

### Q: Does this work with code splitting?

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

### Q: How do I test this in development?

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

### Q: What about performance on mobile/slow devices?

**A:** The single instance pattern is especially beneficial for performance-constrained environments:
- Reduced React reconciliation work
- Lower memory footprint
- Fewer layout recalculations
- Smoother transitions

### Q: Can I still pass different props to the widget?

**A:** Yes! The widget accepts dynamic props:
- `context`: Changes based on active view
- `analysisId`: Updates when discussing different analyses
- Any other props can update without remounting

Only the component *instance* stays the same, not the props.

---

## Benefits Summary

### 1. User Experience
- Seamless conversation across views
- No interruption when navigating
- Maintains user's mental context
- Preserved expanded/collapsed preference

### 2. Performance
- No unmounting/remounting overhead
- React keeps component tree cached
- No memory allocation per navigation
- Smooth animations (no abrupt DOM changes)

### 3. State Management
- Single source of truth
- Simpler state synchronization
- No need to sync across instances
- Easier debugging

### 4. Code Quality
- Cleaner architecture
- Less prop drilling
- Centralized conversation logic
- Easier to maintain

---

**Next:** [System Design](../02-System-Design/README.md)  
**Back:** [Overview](../00-Overview/README.md)
