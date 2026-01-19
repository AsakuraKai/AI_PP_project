# Quick Reference Guide

**Purpose:** Fast lookup for common development tasks  
**Audience:** Developers actively implementing

---

## Table of Contents

- [Key File Locations](#key-file-locations)
- [Component Hierarchy](#component-hierarchy)
- [Important Dependencies](#important-dependencies)
- [Color Tokens](#color-tokens)
- [View Type Constants](#view-type-constants)
- [Common Patterns](#common-patterns)

---

## Key File Locations

### Frontend (Webview)

| Purpose                | Current Location                                                      | New/Modified            |
| ---------------------- | --------------------------------------------------------------------- | ----------------------- |
| **Main App**           | `vscode-extension/webview/src/App.tsx`                                | Modify (add ChatWidget) |
| **Webview Hook**       | `vscode-extension/webview/src/hooks/useWebview.ts`                    | Reference               |
| **Existing Views**     | `vscode-extension/webview/src/views/`                                 | Reference               |
| **Chat Widget**        | `vscode-extension/webview/src/components/conversation/ChatWidget.tsx` | Create                  |
| **Conversation View**  | `.../conversation/ConversationView.tsx`                               | Create                  |
| **Message Components** | `.../conversation/Message*.tsx`                                       | Create                  |
| **Conversation Hook**  | `vscode-extension/webview/src/hooks/useConversation.ts`               | Create                  |
| **Conversation Types** | `.../types/conversation.ts`                                           | Create                  |
| **UI Components**      | `.../components/ui/`                                                  | Copy from Figma         |

### Backend (Extension)

| Purpose                  | Location                                             | Action                |
| ------------------------ | ---------------------------------------------------- | --------------------- |
| **Webview Provider**     | `vscode-extension/src/webview/RCAWebviewProvider.ts` | Modify (add handlers) |
| **Analysis Service**     | `.../services/AnalysisService.ts`                    | Reference             |
| **Conversation Service** | `.../services/ConversationService.ts`                | Create                |
| **Conversation Manager** | `src/agent/ConversationManager.ts`                   | Create                |
| **Conversation Memory**  | `src/agent/ConversationMemory.ts`                    | Create                |
| **Conversation Store**   | `src/db/ConversationStore.ts`                        | Create                |
| **Intent Classifier**    | `src/agent/IntentClassifier.ts`                      | Create                |

### Design Source

| Component       | Figma Location                                             |
| --------------- | ---------------------------------------------------------- |
| **Chat Design** | `Figma/Replicate UI Design/src/app/components/ChatBox.tsx` |
| **UI Library**  | `.../components/ui/*`                                      |
| **Theme**       | `.../styles/theme.css`                                     |

---

## Component Hierarchy

```
App.tsx (Root)
├── Sidebar (Persistent)
├── Routes (Content changes)
│   ├── Dashboard
│   ├── ErrorQueue
│   ├── Analyze
│   ├── History
│   ├── AgentState
│   ├── FixManager
│   └── Metrics
└── ChatWidget (SINGLE INSTANCE - Floating)
    └── ConversationView
        ├── ContextIndicator
        ├── MessageList
        │   └── MessageBubble[]
        ├── TypingIndicator
        ├── SuggestedActions
        └── ChatInput
```

---

## Important Dependencies

### Required NPM Packages

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

### Installation Command

```bash
cd vscode-extension/webview
npm install lucide-react @radix-ui/react-dialog @radix-ui/react-tooltip
```

---

## Color Tokens

### Current RCA Theme (Maintain Consistency)

```css
/* Dark theme - Zinc scale */
--background: #09090b;      /* zinc-950 */
--surface: #18181b;         /* zinc-900 */
--surface-elevated: #27272a; /* zinc-800 */
--border: #3f3f46;          /* zinc-700 */
--text-primary: #fafafa;    /* zinc-50 */
--text-secondary: #a1a1aa;  /* zinc-400 */

/* Semantic colors */
--accent: #2563eb;          /* blue-600 */
--success: #10b981;         /* green-500 */
--error: #ef4444;           /* red-500 */
--warning: #f59e0b;         /* yellow-500 */
```

### Usage in Components

```tsx
// Message bubbles
<div className="bg-blue-600 text-white">  // User messages
<div className="bg-zinc-800 text-zinc-100">  // Assistant messages

// Widget container
<div className="bg-zinc-900 border-zinc-800">

// Input field
<textarea className="bg-zinc-800 text-zinc-100 border-zinc-700" />
```

---

## View Type Constants

### TypeScript Definition

```typescript
type ViewType = 
  | 'dashboard'  // Route: /
  | 'errors'     // Route: /errors
  | 'analyze'    // Route: /analyze
  | 'history'    // Route: /history
  | 'agent'      // Route: /agent
  | 'fixes'      // Route: /fixes
  | 'metrics';   // Route: /metrics
```

### Route to ViewType Mapping

```typescript
function getViewType(route: string): ViewType {
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
```

---

## Common Patterns

### 1. Sending Message to Backend

```typescript
// In frontend component
const { postMessage } = useWebview();

postMessage({
  type: 'conversation.send',
  data: {
    content: userInput,
    context: currentContext
  }
});
```

### 2. Receiving Message from Backend

```typescript
// In frontend component
useEffect(() => {
  const handler = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    if (type === 'conversation.message') {
      setMessages(prev => [...prev, data]);
    }
  };
  
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, []);
```

### 3. Backend Message Handler

```typescript
// In RCAWebviewProvider.ts
private async _handleConversationSend(data: any): Promise<void> {
  const conversationService = ConversationService.getInstance();
  const response = await conversationService.processMessage(
    data.content,
    data.context
  );
  
  this._panel.webview.postMessage({
    type: 'conversation.message',
    data: response
  });
}
```

### 4. Context Update on Navigation

```typescript
// In App.tsx
useEffect(() => {
  const newContext = {
    viewType: getViewType(currentRoute),
    route: currentRoute,
    timestamp: Date.now()
  };
  setConversationContext(newContext);
}, [currentRoute]);
```

### 5. Conditional Rendering Based on View

```typescript
// In ChatWidget or child components
const suggestedPrompts = useMemo(() => {
  switch (context.viewType) {
    case 'dashboard':
      return ["What errors need attention?", "Show analysis summary"];
    case 'analyze':
      return ["Why this file?", "Explain the fix"];
    // ... other cases
  }
}, [context.viewType]);
```

---

## Keyboard Shortcuts

```typescript
// ChatInput.tsx
const handleKeyPress = (e: React.KeyboardEvent) => {
  // Send message
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
  
  // New line
  if (e.key === 'Enter' && e.shiftKey) {
    // Allow default behavior (newline)
  }
};

// Global shortcuts (in App.tsx or ChatWidget)
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    // Toggle chat widget
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleChatWidget();
    }
    
    // Close chat
    if (e.key === 'Escape' && isExpanded) {
      setIsExpanded(false);
    }
  };
  
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

---

## CSS Classes Quick Reference

### Layout

```css
/* Fixed positioning (ChatWidget) */
.fixed.bottom-4.right-4.z-50

/* Flexbox containers */
.flex.flex-col.h-full
.flex.items-center.gap-2

/* Scrollable area */
.overflow-y-auto.p-4.space-y-4
```

### Styling

```css
/* Widget container */
.bg-zinc-900.border.border-zinc-800.rounded-lg.shadow-2xl

/* Collapsed button */
.h-14.w-14.rounded-full.bg-blue-600.hover:bg-blue-700

/* Message bubbles */
.max-w-[80%].rounded-lg.p-3
.bg-blue-600.text-white  /* User */
.bg-zinc-800.text-zinc-100  /* Assistant */
```

---

## Testing Quick Commands

```bash
# Run unit tests
npm test

# Run specific test file
npm test ChatWidget.test.tsx

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## Common Issues & Solutions

### Issue: Widget not appearing
**Solution:** Check App.tsx - ChatWidget must be outside `<Routes>`

### Issue: Conversation lost on navigation
**Solution:** Ensure ChatWidget has no `key` prop based on route

### Issue: Messages not persisting
**Solution:** Verify ConversationStore is saving to database

### Issue: Context not updating
**Solution:** Check context prop is updating in App.tsx useEffect

### Issue: TypeScript errors
**Solution:** Ensure types defined in `types/conversation.ts` and exported

---

## Performance Targets

| Metric             | Target | How to Measure              |
| ------------------ | ------ | --------------------------- |
| Initial Load       | <500ms | Chrome DevTools Performance |
| Message Send       | <100ms | UI response time            |
| Message Receive    | <200ms | First token render          |
| Streaming Latency  | <50ms  | Per token                   |
| Scroll Performance | >55fps | Chrome DevTools FPS meter   |
| Memory Footprint   | <50MB  | Chrome DevTools Memory      |

---

## Useful VS Code Commands

```typescript
// In extension.ts - register conversation commands
context.subscriptions.push(
  vscode.commands.registerCommand('rca.openChat', () => {
    // Open chat widget
  }),
  vscode.commands.registerCommand('rca.clearConversation', () => {
    // Clear current conversation
  })
);
```

---

**Need More Details?** Check:
- [Component Specifications](../Component-Specifications/README.md)
- [Technical Specifications](../Technical-Specifications/README.md)
- [Phase Implementation Guides](../INDEX.md)
