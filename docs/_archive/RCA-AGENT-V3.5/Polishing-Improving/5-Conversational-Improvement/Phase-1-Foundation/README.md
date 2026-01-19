# Phase 1: Foundation (Week 1-2) [CRITICAL]

**Goal**: Build core conversation infrastructure

**Status:** Implementation Phase  
**Priority:** [!] Critical  
**Timeline:** Week 1-2

---

## Table of Contents

- [Overview](#overview)
- [Backend Tasks](#backend-tasks)
- [Frontend Tasks](#frontend-tasks)
- [Deliverables](#deliverables)
- [Testing Checklist](#testing-checklist)
- [Implementation Guide](#implementation-guide)

---

## Overview

This phase establishes the foundational infrastructure for conversational RCA:
- Basic chat UI components
- Message passing between webview and extension
- Conversation persistence
- State management

**Success Criteria:**
- ✅ User can send messages
- ✅ Backend receives and routes messages
- ✅ Conversations persist in database
- ✅ Basic UI shows sent/received messages

---

## Backend Tasks

### 1. ConversationManager (`src/agent/ConversationManager.ts`)

```typescript
class ConversationManager {
  async createSession(rcaId: string, context: ConversationContext): Promise<ConversationSession>
  async continueConversation(sessionId: string, message: string): Promise<ConversationMessage>
  async getSessionHistory(sessionId: string): Promise<ConversationMessage[]>
  async routeMessage(message: ConversationMessage): Promise<Response>
}
```

**Responsibilities:**
- Create and manage conversation sessions
- Route messages to appropriate handlers
- Maintain conversation context
- Orchestrate multi-turn interactions

**Implementation Priority:** Week 1

---

### 2. ConversationMemory (`src/agent/ConversationMemory.ts`)

**Responsibilities:**
- Store last N messages (sliding window)
- Compress context for long conversations
- Retrieve relevant history
- Manage context window limits

**Key Methods:**
```typescript
class ConversationMemory {
  async addMessage(message: ConversationMessage): Promise<void>
  async getRecentMessages(sessionId: string, count: number): Promise<ConversationMessage[]>
  async compressContext(sessionId: string): Promise<CompressedContext>
  async clearSession(sessionId: string): Promise<void>
}
```

**Implementation Priority:** Week 1

---

### 3. ConversationStore (`src/db/ConversationStore.ts`)

**Responsibilities:**
- Persist conversations to ChromaDB
- Query by session/user/RCA ID
- Link to RCA documents
- Support history retrieval

**Key Methods:**
```typescript
class ConversationStore {
  async saveSession(session: ConversationSession): Promise<void>
  async loadSession(sessionId: string): Promise<ConversationSession | null>
  async saveMessage(message: ConversationMessage): Promise<void>
  async getSessionMessages(sessionId: string): Promise<ConversationMessage[]>
  async searchConversations(query: string): Promise<ConversationSession[]>
}
```

**Implementation Priority:** Week 1-2

---

### 4. Enhanced Types (`src/types.ts`)

Add conversation-specific interfaces:

```typescript
interface ConversationSession {
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

interface Message {
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
```

**Implementation Priority:** Week 1

---

## Frontend Tasks

### 1. ChatWidget (`vscode-extension/webview/src/components/conversation/ChatWidget.tsx`)

**Main floating container with collapsed/expanded states**

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

interface ChatWidgetProps {
  context: ConversationContext;
  currentView: string;
}

export function ChatWidget({ context, currentView }: ChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleExpanded}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
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

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl"
         style={{ width: '400px', height: '600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <span className="font-medium">RCA Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleExpanded}>
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Context Indicator */}
      <ContextIndicator context={context} />

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <ConversationView 
          context={context}
          onUnreadCountChange={setUnreadCount}
        />
      </div>
    </div>
  );
}
```

**Implementation Priority:** Week 1

---

### 2. ConversationView (`ConversationView.tsx`)

**Main chat interface with message list and input**

```typescript
import { useConversation } from '@/hooks/useConversation';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';

interface ConversationViewProps {
  context: ConversationContext;
  onUnreadCountChange: (count: number) => void;
}

export function ConversationView({ context, onUnreadCountChange }: ConversationViewProps) {
  const { messages, sendMessage, isTyping } = useConversation(context);
  
  return (
    <div className="flex flex-col h-full">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
      
      {/* Input Area */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

**Implementation Priority:** Week 1

---

### 3. MessageBubble (`MessageBubble.tsx`)

**Individual message display with role-based styling**

```typescript
interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-zinc-800 text-zinc-100'
      }`}>
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
```

**Implementation Priority:** Week 1

---

### 4. ChatInput (`ChatInput.tsx`)

**Auto-resize textarea with send button**

```typescript
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
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
    <div className="p-3 border-t border-zinc-800">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="flex-1 bg-zinc-800 text-zinc-100 rounded-lg p-2 text-sm resize-none"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Implementation Priority:** Week 1

---

### 5. useConversation Hook (`hooks/useConversation.ts`)

**Main conversation state management**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useWebview } from './useWebview';

export function useConversation(context: ConversationContext) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { postMessage, onMessage } = useWebview();
  
  // Initialize conversation
  useEffect(() => {
    postMessage({
      type: 'conversation.start',
      data: { context }
    });
  }, [context.viewType]);
  
  // Listen for messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      if (type === 'conversation.message') {
        setMessages(prev => [...prev, data]);
        setIsTyping(false);
      }
    };
    
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
  
  // Send message
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
    
    postMessage({
      type: 'conversation.send',
      data: { content, context }
    });
  }, [context]);
  
  return { messages, sendMessage, isTyping };
}
```

**Implementation Priority:** Week 1-2

---

### 6. Integration into App.tsx

**Add ChatWidget to main application**

```tsx
// vscode-extension/webview/src/App.tsx
import { ChatWidget } from './components/conversation/ChatWidget';
import { ConversationProvider } from './contexts/ConversationContext';

function App() {
  const [currentRoute, setCurrentRoute] = useState('/');
  
  const conversationContext = useMemo(() => ({
    viewType: getViewType(currentRoute),
    route: currentRoute,
    timestamp: Date.now()
  }), [currentRoute]);

  return (
    <ConversationProvider>
      <div className="flex h-screen bg-zinc-950 text-zinc-50">
        <Sidebar onRouteChange={setCurrentRoute} />
        
        <main className="flex-1 overflow-auto">
          {renderView(currentRoute)}
        </main>

        {/* SINGLE ChatWidget for ALL views */}
        <ChatWidget 
          context={conversationContext}
          currentView={currentRoute}
        />
      </div>
    </ConversationProvider>
  );
}
```

**Implementation Priority:** Week 2

---

## Deliverables

- ✅ **User can send messages** - ChatInput functional
- ✅ **Backend receives and routes messages** - Message passing works
- ✅ **Conversations persist in database** - ConversationStore implemented
- ✅ **Basic UI shows sent/received messages** - MessageBubble displays correctly

---

## Testing Checklist

### Unit Tests

- [ ] ChatWidget renders and toggles states
- [ ] ConversationView displays messages
- [ ] MessageBubble shows user vs assistant styling
- [ ] ChatInput handles Enter key correctly
- [ ] useConversation hook manages state properly

### Integration Tests

- [ ] Message sent from UI reaches backend
- [ ] Backend response displayed in UI
- [ ] Conversation persists to database
- [ ] History loads correctly

### Manual Tests

- [ ] Widget expands/collapses smoothly
- [ ] Messages appear in correct order
- [ ] Typing indicator shows when waiting
- [ ] Input clears after sending
- [ ] State persists across page reload

---

## Implementation Guide

### Day 1-2: Setup
1. Create folder structure
2. Copy UI components from Figma
3. Set up types

### Day 3-5: UI Components
1. Build ChatWidget (collapsed/expanded)
2. Build ConversationView
3. Build MessageBubble and ChatInput
4. Test with mock data

### Day 6-8: Backend
1. Implement ConversationManager
2. Implement ConversationMemory
3. Implement ConversationStore
4. Set up message handlers in RCAWebviewProvider

### Day 9-10: Integration
1. Wire up webview communication
2. Connect useConversation hook
3. Test end-to-end message flow

### Day 11-14: Polish & Testing
1. Add error handling
2. Write unit tests
3. Write integration tests
4. Fix bugs

---

**Next:** [Phase 2: Intent Classification](../Phase-2-Intent-Classification/README.md)  
**Back:** [Overview](../00-Overview/README.md)
