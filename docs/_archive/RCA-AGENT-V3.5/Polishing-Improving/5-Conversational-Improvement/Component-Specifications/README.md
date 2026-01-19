# Component Specifications

**Purpose:** Detailed specifications for all chat components  
**Audience:** Developers implementing UI components

---

## Table of Contents

- [Core Components](#core-components)
- [Message Components](#message-components)
- [Input Components](#input-components)
- [Feedback Components](#feedback-components)
- [Context Components](#context-components)
- [Supporting Components](#supporting-components)
- [UI Library Integration](#ui-library-integration)

---

## Core Components

### ChatWidget (Floating Container)

**Location:** `vscode-extension/webview/src/components/conversation/ChatWidget.tsx`  
**Priority:** [!] Critical  
**Phase:** 1

**Purpose:** Main floating widget container that wraps ConversationView

**Props:**
```typescript
interface ChatWidgetProps {
  context: ConversationContext;
  currentView: string;
}
```

**States:**
- `isExpanded`: boolean - Widget is expanded or collapsed
- `unreadCount`: number - Number of unread messages
- `isAgentTyping`: boolean - Agent is currently responding

**Features:**
- Fixed positioning (bottom-4 right-4)
- Persists state to localStorage
- Smooth expand/collapse animation
- Badge shows unread count
- Pulse animation when agent typing

**CSS Classes:**
```css
/* Container */
.fixed.bottom-4.right-4.z-50

/* Collapsed button */
.h-14.w-14.rounded-full.bg-blue-600.hover:bg-blue-700

/* Expanded panel */
.bg-zinc-900.border.border-zinc-800.rounded-lg.shadow-2xl
```

**Code Example:** See [Phase 1 Guide](../Phase-1-Foundation/README.md#1-chatwidget)

---

### ConversationView (Main Chat Interface)

**Location:** `.../conversation/ConversationView.tsx`  
**Priority:** [!] Critical  
**Phase:** 1

**Purpose:** Main chat interface containing message list and input

**Props:**
```typescript
interface ConversationViewProps {
  context: ConversationContext;
  onUnreadCountChange: (count: number) => void;
  onTypingChange: (isTyping: boolean) => void;
}
```

**Children:**
- ContextIndicator (optional header)
- MessageList (scrollable container)
- TypingIndicator (conditional)
- SuggestedActions (conditional)
- ChatInput (always visible)

**Layout:**
```
┌─────────────────────────┐
│   ContextIndicator      │ ← Optional
├─────────────────────────┤
│                         │
│   MessageList           │ ← Scrollable
│   (Flex-1)              │
│                         │
├─────────────────────────┤
│   TypingIndicator       │ ← Conditional
├─────────────────────────┤
│   SuggestedActions      │ ← Conditional
├─────────────────────────┤
│   ChatInput             │ ← Fixed
└─────────────────────────┘
```

---

## Message Components

### MessageBubble

**Location:** `.../conversation/MessageBubble.tsx`  
**Priority:** [!] Critical  
**Phase:** 1

**Purpose:** Display individual chat messages

**Props:**
```typescript
interface MessageBubbleProps {
  message: Message;
  onCopy?: () => void;
  onReply?: () => void;
  onRefine?: () => void;
}
```

**Variants:**
- User message: Right-aligned, blue background
- Assistant message: Left-aligned, dark background
- System message: Centered, muted

**Features:**
- Markdown rendering
- Code syntax highlighting
- Timestamp display
- Action buttons (hover)
- Copy button
- Reactions (optional)

**Styling:**
```typescript
const getMessageStyles = (role: MessageRole) => {
  if (role === 'user') {
    return 'ml-auto bg-blue-600 text-white';
  }
  return 'mr-auto bg-zinc-800 text-zinc-100';
};
```

---

### MessageList

**Location:** `.../conversation/MessageList.tsx`  
**Priority:** [H] High  
**Phase:** 1

**Purpose:** Scrollable container for messages

**Features:**
- Auto-scroll to bottom on new message
- Preserve scroll position when loading history
- Virtual scrolling for performance (Phase 6)
- Load more on scroll to top
- Smooth scroll animations

**Implementation:**
```typescript
const messageListRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  // Auto-scroll to bottom on new message
  if (messageListRef.current) {
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }
}, [messages.length]);
```

---

## Input Components

### ChatInput

**Location:** `.../conversation/ChatInput.tsx`  
**Priority:** [!] Critical  
**Phase:** 1

**Purpose:** Multi-line input with auto-resize

**Props:**
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}
```

**Features:**
- Auto-expanding textarea
- Enter to send, Shift+Enter for new line
- Send button (disabled when empty)
- Character count (optional)
- Attachment button (Phase 4+)
- Emoji picker (Phase 6)

**Keyboard Shortcuts:**
```typescript
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

---

## Feedback Components

### FeedbackPanel

**Location:** `.../conversation/FeedbackPanel.tsx`  
**Priority:** [M] Medium  
**Phase:** 5

**Purpose:** Collect detailed feedback

**Props:**
```typescript
interface FeedbackPanelProps {
  messageId: string;
  analysisId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: DetailedFeedback) => void;
}
```

**Sections:**
1. Overall rating (helpful/partial/not helpful)
2. What worked well (multi-select)
3. What needs improvement (multi-select)
4. Free-text explanation
5. Specific corrections (optional)

**Feedback Categories:**
```typescript
const POSITIVE_ASPECTS = [
  'Identified correct file',
  'Root cause was accurate',
  'Fix steps were clear',
  'Code examples were helpful',
  'Appropriate confidence level'
];

const NEGATIVE_ASPECTS = [
  'Wrong file identified',
  'Root cause incorrect',
  'Fix was incomplete',
  'Too generic/not specific',
  'Missing context',
  'Confidence too high/low'
];
```

---

## Context Components

### ContextIndicator

**Location:** `.../conversation/ContextIndicator.tsx`  
**Priority:** [H] High  
**Phase:** 2

**Purpose:** Show current view context

**Props:**
```typescript
interface ContextIndicatorProps {
  context: ConversationContext;
}
```

**Features:**
- View icon and name
- Badge styling
- Updates on navigation
- Tooltip with details (optional)

**View Configuration:**
```typescript
const VIEW_CONFIG = {
  dashboard: { label: 'Dashboard', icon: Home, color: 'blue' },
  errors: { label: 'Error Queue', icon: AlertCircle, color: 'red' },
  analyze: { label: 'Analysis', icon: Search, color: 'green' },
  history: { label: 'History', icon: History, color: 'purple' },
  agent: { label: 'Agent State', icon: Bot, color: 'cyan' },
  fixes: { label: 'Fix Manager', icon: Wrench, color: 'yellow' },
  metrics: { label: 'Metrics', icon: BarChart, color: 'pink' }
};
```

---

### SuggestedActions

**Location:** `.../conversation/SuggestedActions.tsx`  
**Priority:** [H] High  
**Phase:** 2

**Purpose:** Quick reply buttons

**Props:**
```typescript
interface SuggestedActionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}
```

**Features:**
- View-specific prompts
- Click to send
- Horizontal scroll on overflow
- Fade in animation

**Suggested Prompts by View:**
```typescript
const VIEW_PROMPTS = {
  dashboard: [
    "What errors need attention?",
    "Show today's summary",
    "How is Ollama performing?"
  ],
  analyze: [
    "Why did you choose this file?",
    "Can you explain the fix?",
    "Show me alternatives"
  ],
  errors: [
    "Which error should I fix first?",
    "Group similar errors",
    "Analyze selected"
  ]
  // ... other views
};
```

---

### AnalysisSummary

**Location:** `.../conversation/AnalysisSummary.tsx`  
**Priority:** [M] Medium  
**Phase:** 3

**Purpose:** Collapsible analysis context header

**Props:**
```typescript
interface AnalysisSummaryProps {
  rcaId: string;
  defaultExpanded?: boolean;
}
```

**Displays:**
- Root cause summary
- Confidence badge with trend
- Affected file(s)
- Quick actions (View Full, Apply Fix)
- Expand/collapse toggle

**Layout:**
```
┌────────────────────────────────┐
│ Initial Analysis  [83% ↑]  [v]│
├────────────────────────────────┤
│ Root Cause: lateinit access    │
│ File: MainActivity.kt:45       │
│ [View Full] [Apply Fix]        │
└────────────────────────────────┘
```

---

## Supporting Components

### TypingIndicator

**Location:** `.../conversation/TypingIndicator.tsx`  
**Priority:** [L] Low  
**Phase:** 1

**Purpose:** Show agent is typing

**Features:**
- Animated dots or spinner
- "RCA Agent is typing..." text
- Smooth fade in/out
- Pulsing animation

```typescript
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-zinc-500 text-sm px-4 py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>RCA Agent is typing...</span>
    </div>
  );
}
```

---

### ConfidenceBadge

**Location:** `.../conversation/ConfidenceBadge.tsx`  
**Priority:** [L] Low  
**Phase:** 3

**Purpose:** Display confidence score with trend

**Props:**
```typescript
interface ConfidenceBadgeProps {
  confidence: number;
  previousConfidence?: number;
  showTrend?: boolean;
}
```

**Colors:**
- Green: ≥80%
- Yellow: 60-79%
- Red: <60%

**Trend Indicators:**
- ↑ Improved
- ↓ Decreased
- ─ Unchanged

---

### CodeBlock

**Location:** `.../conversation/CodeBlock.tsx`  
**Priority:** [M] Medium  
**Phase:** 3

**Purpose:** Syntax-highlighted code display

**Props:**
```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}
```

**Features:**
- Syntax highlighting (Prism.js or Shiki)
- Line numbers
- Copy button
- Language badge
- Highlight specific lines

---

## UI Library Integration

### Required shadcn/ui Components

Copy from `Figma/Replicate UI Design/src/app/components/ui/` to `vscode-extension/webview/src/components/ui/`:

| Component  | Priority | Usage              |
| ---------- | -------- | ------------------ |
| Button     | Critical | All actions        |
| Input      | Critical | Text fields        |
| Textarea   | Critical | Multi-line input   |
| Badge      | High     | Status, confidence |
| Card       | High     | Message containers |
| Dialog     | Medium   | Feedback modal     |
| Tooltip    | Medium   | Help hints         |
| Avatar     | Medium   | User/agent icons   |
| ScrollArea | Medium   | Message list       |
| Checkbox   | Medium   | Feedback options   |
| Separator  | Low      | Dividers           |
| Skeleton   | Low      | Loading states     |

### Migration Command

```bash
cp -r "Figma/Replicate UI Design/src/app/components/ui/" \
      "vscode-extension/webview/src/components/ui/"
```

### Import Path Updates

```typescript
// Change from:
import { Button } from '@/app/components/ui/button';

// To:
import { Button } from '@/components/ui/button';
```

---

## Component Dependencies

```
ChatWidget
├── ConversationView
│   ├── ContextIndicator
│   ├── MessageList
│   │   └── MessageBubble
│   │       ├── MessageActions
│   │       ├── CodeBlock
│   │       └── ConfidenceBadge
│   ├── TypingIndicator
│   ├── SuggestedActions
│   └── ChatInput
└── AnalysisSummary (conditional)
```

---

## Styling Guidelines

### Color Palette

```css
/* Message bubbles */
--user-message: #2563eb;      /* blue-600 */
--assistant-message: #27272a; /* zinc-800 */
--system-message: #3f3f46;    /* zinc-700 */

/* Confidence colors */
--confidence-high: #10b981;   /* green-500 */
--confidence-medium: #f59e0b; /* yellow-500 */
--confidence-low: #ef4444;    /* red-500 */
```

### Typography

```css
/* Message text */
.message-content {
  font-size: 0.875rem;        /* text-sm */
  line-height: 1.5rem;
}

/* Timestamps */
.message-timestamp {
  font-size: 0.75rem;          /* text-xs */
  opacity: 0.7;
}
```

---

**Next:** [Type Definitions](../Type-Definitions/README.md)  
**Back:** [Phase 2](../Phase-2-Intent-Classification/README.md)
