# Phase 6: UI Polish & Accessibility

**Timeline:** Week 7  
**Priority:** [M] Medium  
**Prerequisites:** Phase 1-5 complete

---

## Overview

Polish the conversational interface with smooth animations, accessibility features, keyboard shortcuts, and performance optimizations.

### Goals

- Smooth animations and transitions
- WCAG 2.1 AA accessibility compliance
- Keyboard navigation support
- Performance optimization (60fps target)
- Screen reader compatibility

### Success Criteria

✅ All animations run at 60fps  
✅ WCAG 2.1 AA compliant  
✅ Full keyboard navigation  
✅ Screen reader announces all actions  
✅ Virtual scrolling for long conversations

---

## Implementation Plan

### Day 1-2: Animations & Transitions

#### 1. CSS Animation Utilities

**File:** `webview/src/styles/animations.css`

```css
/* Slide animations */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutToRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Fade animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Expand animations */
@keyframes expand {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Pulse animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Typing indicator */
@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* Utility classes */
.animate-slide-in {
  animation: slideInFromRight 0.3s ease-out;
}

.animate-slide-out {
  animation: slideOutToRight 0.3s ease-in;
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-fade-out {
  animation: fadeOut 0.2s ease-in;
}

.animate-expand {
  animation: expand 0.2s ease-out;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Smooth transitions */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 2. Animated ChatWidget

**File:** `webview/src/components/conversation/ChatWidget.tsx`

Add animation support:

```typescript
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWidget({ context, currentView }: ChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* Collapsed button */
          <motion.button
            key="collapsed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsExpanded(true)}
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 
                       shadow-lg hover:shadow-xl transition-all"
          >
            <MessageCircle className="w-6 h-6 mx-auto text-white" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white 
                           text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>
        ) : (
          /* Expanded panel */
          <motion.div
            key="expanded"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-96 h-[32rem] bg-zinc-900 border border-zinc-800 
                       rounded-lg shadow-2xl flex flex-col"
          >
            <ConversationView
              context={context}
              onUnreadCountChange={setUnreadCount}
              onTypingChange={setIsAgentTyping}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

#### 3. Message Entrance Animations

**File:** `webview/src/components/conversation/MessageBubble.tsx`

```typescript
import { motion } from 'framer-motion';

export function MessageBubble({ message, ...props }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={/* ... */}
    >
      {/* Message content */}
    </motion.div>
  );
}
```

---

### Day 2-3: Accessibility

#### 4. ARIA Labels & Roles

**File:** `webview/src/components/conversation/ConversationView.tsx`

```typescript
export function ConversationView({ context, ...props }: ConversationViewProps) {
  return (
    <div
      role="region"
      aria-label="Conversation with RCA Agent"
      className="flex flex-col h-full"
    >
      {/* Context indicator */}
      <ContextIndicator context={context} />

      {/* Message list */}
      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        className="flex-1 overflow-y-auto"
      >
        <MessageList messages={messages} />
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div role="status" aria-live="polite" aria-atomic="true">
          <TypingIndicator />
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isTyping}
        aria-label="Type your message"
      />
    </div>
  );
}
```

#### 5. Keyboard Navigation

**File:** `webview/src/components/conversation/ChatInput.tsx`

```typescript
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Escape to clear
    if (e.key === 'Escape') {
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
    }

    // Cmd+K or Ctrl+K to focus (global shortcut)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type your message..."
        aria-label="Message input"
        aria-describedby="input-hint"
        className={/* ... */}
      />
      <div id="input-hint" className="sr-only">
        Press Enter to send, Shift+Enter for new line
      </div>
      <Button
        onClick={handleSend}
        disabled={disabled}
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

#### 6. Screen Reader Support

**File:** `webview/src/components/conversation/MessageBubble.tsx`

```typescript
export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      role="article"
      aria-label={`Message from ${message.role}`}
      className={/* ... */}
    >
      <div className="sr-only">
        {message.role === 'user' ? 'You said:' : 'RCA Agent said:'}
      </div>
      <div className="prose prose-invert">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      <time
        dateTime={message.timestamp.toISOString()}
        className="sr-only"
      >
        {message.timestamp.toLocaleString()}
      </time>
    </div>
  );
}
```

---

### Day 3-4: Performance Optimization

#### 7. Virtual Scrolling for Messages

**File:** `webview/src/components/conversation/VirtualMessageList.tsx`

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualMessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5 // Render 5 extra items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <MessageBubble message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 8. Debounced Input

**File:** `webview/src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in ChatInput
const [draft, setDraft] = useState('');
const debouncedDraft = useDebounce(draft, 500);

useEffect(() => {
  // Save draft to localStorage
  localStorage.setItem('chat-draft', debouncedDraft);
}, [debouncedDraft]);
```

#### 9. Lazy Loading History

**File:** `webview/src/components/conversation/MessageList.tsx`

```typescript
export function MessageList({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const olderMessages = await fetchOlderMessages(sessionId, messages[0]?.messageId);
    
    if (olderMessages.length === 0) {
      setHasMore(false);
    } else {
      setMessages(prev => [...olderMessages, ...prev]);
    }
    
    setIsLoading(false);
  };

  // Detect scroll to top
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      loadMore();
    }
  };

  return (
    <div onScroll={handleScroll} className="overflow-y-auto">
      {isLoading && <Skeleton count={3} />}
      {messages.map(msg => <MessageBubble key={msg.messageId} message={msg} />)}
    </div>
  );
}
```

---

### Day 4-5: Keyboard Shortcuts & Polish

#### 10. Global Keyboard Shortcuts

**File:** `webview/src/hooks/useKeyboardShortcuts.ts`

```typescript
import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K / Ctrl+K - Focus chat input
      if (modKey && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLTextAreaElement>('[aria-label="Message input"]')?.focus();
      }

      // Cmd+Shift+C / Ctrl+Shift+C - Toggle chat widget
      if (modKey && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        // Dispatch custom event to toggle widget
        window.dispatchEvent(new CustomEvent('toggle-chat'));
      }

      // Escape - Close chat widget (if open)
      if (e.key === 'Escape') {
        const chatWidget = document.querySelector('[data-chat-widget]');
        if (chatWidget && chatWidget.getAttribute('data-expanded') === 'true') {
          window.dispatchEvent(new CustomEvent('toggle-chat'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

#### 11. Loading Skeletons

**File:** `webview/src/components/conversation/MessageSkeleton.tsx`

```typescript
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-8 h-8 bg-zinc-800 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Animation Tests

- [ ] ChatWidget expands smoothly (60fps)
- [ ] Messages fade in on appearance
- [ ] Typing indicator animates correctly
- [ ] No jank or frame drops

### Accessibility Tests

- [ ] All interactive elements have ARIA labels
- [ ] Screen reader announces messages
- [ ] Keyboard navigation works throughout
- [ ] Focus management is logical
- [ ] Color contrast meets WCAG AA (4.5:1)

### Performance Tests

- [ ] Virtual scrolling handles 1000+ messages
- [ ] Input debouncing prevents lag
- [ ] Lazy loading reduces initial load time
- [ ] 60fps maintained during animations

### Keyboard Shortcut Tests

- [ ] Cmd+K/Ctrl+K focuses input
- [ ] Enter sends message
- [ ] Shift+Enter adds new line
- [ ] Escape closes widget

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance

- [ ] Color contrast ≥4.5:1 for text
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Screen reader compatible
- [ ] Proper heading hierarchy
- [ ] Form labels associated
- [ ] Error messages accessible

---

**Navigation:**  
← [Phase 5: Rich Feedback](../Phase-5-Rich-Feedback/README.md)  
→ [Phase 7: Testing](../Phase-7-Testing/README.md)  
↑ [Back to Index](../INDEX.md)
