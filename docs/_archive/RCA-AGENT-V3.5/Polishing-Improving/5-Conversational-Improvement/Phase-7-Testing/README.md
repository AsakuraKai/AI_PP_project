# Phase 7: Testing & Quality Assurance

**Timeline:** Week 8  
**Priority:** [!] Critical  
**Prerequisites:** Phase 1-6 complete

---

## Overview

Comprehensive testing strategy covering unit tests, integration tests, E2E tests, and user acceptance testing to ensure production readiness.

### Goals

- >90% code coverage for conversation components
- All integration flows tested
- E2E scenarios validated
- Performance benchmarks met
- Accessibility verified

### Success Criteria

✅ >90% unit test coverage  
✅ All critical paths integration tested  
✅ E2E tests pass for all user flows  
✅ Performance targets met (60fps, <200ms response)  
✅ WCAG 2.1 AA validated  
✅ Beta testing feedback incorporated

---

## Testing Strategy

### 1. Unit Tests (Components & Hooks)

#### Test Setup

**File:** `webview/src/tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock VS Code API
global.acquireVsCodeApi = vi.fn(() => ({
  postMessage: vi.fn(),
  setState: vi.fn(),
  getState: vi.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

#### Component Tests

**File:** `webview/src/tests/components/MessageBubble.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/conversation/MessageBubble';
import { describe, it, expect } from 'vitest';

describe('MessageBubble', () => {
  const mockUserMessage = {
    messageId: '1',
    sessionId: 'session-1',
    role: 'user' as const,
    content: 'Test message',
    timestamp: new Date()
  };

  const mockAssistantMessage = {
    ...mockUserMessage,
    messageId: '2',
    role: 'assistant' as const
  };

  it('renders user message with correct styling', () => {
    render(<MessageBubble message={mockUserMessage} />);
    const bubble = screen.getByRole('article');
    expect(bubble).toHaveClass('ml-auto', 'bg-blue-600');
  });

  it('renders assistant message with correct styling', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    const bubble = screen.getByRole('article');
    expect(bubble).toHaveClass('mr-auto', 'bg-zinc-800');
  });

  it('displays message content', () => {
    render(<MessageBubble message={mockUserMessage} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('shows timestamp', () => {
    render(<MessageBubble message={mockUserMessage} />);
    const timestamp = screen.getByRole('time');
    expect(timestamp).toBeInTheDocument();
  });

  it('handles markdown rendering', () => {
    const messageWithMarkdown = {
      ...mockUserMessage,
      content: '**Bold** and `code`'
    };
    render(<MessageBubble message={messageWithMarkdown} />);
    expect(screen.getByText('Bold')).toHaveClass('font-bold');
    expect(screen.getByText('code')).toHaveClass('code');
  });
});
```

**File:** `webview/src/tests/components/ChatInput.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '@/components/conversation/ChatInput';
import { describe, it, expect, vi } from 'vitest';

describe('ChatInput', () => {
  it('calls onSend when Enter is pressed', async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Test message{Enter}');
    
    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('adds new line when Shift+Enter is pressed', async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    await userEvent.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');
    
    expect(input.value).toContain('\n');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<ChatInput onSend={vi.fn()} disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('auto-resizes as user types', async () => {
    render(<ChatInput onSend={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    
    const initialHeight = input.scrollHeight;
    await userEvent.type(input, 'Line 1\nLine 2\nLine 3\nLine 4');
    
    expect(input.scrollHeight).toBeGreaterThan(initialHeight);
  });
});
```

#### Hook Tests

**File:** `webview/src/tests/hooks/useConversation.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useConversation } from '@/hooks/useConversation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useConversation({ currentView: 'analyze', rcaId: '123' }));
    expect(result.current.messages).toEqual([]);
  });

  it('sends message and adds to list', async () => {
    const { result } = renderHook(() => useConversation({ currentView: 'analyze', rcaId: '123' }));
    
    await result.current.sendMessage('Test message');
    
    await waitFor(() => {
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe('Test message');
      expect(result.current.messages[0].role).toBe('user');
    });
  });

  it('sets isTyping to true when sending', async () => {
    const { result } = renderHook(() => useConversation({ currentView: 'analyze', rcaId: '123' }));
    
    result.current.sendMessage('Test');
    
    expect(result.current.isTyping).toBe(true);
  });

  it('receives assistant response', async () => {
    const { result } = renderHook(() => useConversation({ currentView: 'analyze', rcaId: '123' }));
    
    // Simulate receiving message from extension
    window.postMessage({
      type: 'conversation.message',
      data: {
        messageId: '2',
        role: 'assistant',
        content: 'Response',
        timestamp: new Date()
      }
    }, '*');
    
    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
      expect(result.current.isTyping).toBe(false);
    });
  });
});
```

---

### 2. Integration Tests

#### Conversation Flow Test

**File:** `tests/integration/conversation-flow.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Conversation Flow', () => {
  test('user can send message and receive response', async ({ page }) => {
    // Open extension
    await page.goto('vscode://...');
    
    // Open chat widget
    await page.click('[data-testid="chat-toggle"]');
    await expect(page.locator('[data-testid="chat-widget"]')).toBeVisible();
    
    // Send message
    const input = page.locator('textarea[aria-label="Message input"]');
    await input.fill('Why did you choose MainActivity.kt?');
    await input.press('Enter');
    
    // Verify message appears
    await expect(page.locator('text=Why did you choose MainActivity.kt?')).toBeVisible();
    
    // Wait for typing indicator
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Wait for response
    await expect(page.locator('[role="article"]').last()).toContainText('analyzed the stack trace');
    
    // Verify typing indicator disappears
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
  });

  test('suggested actions work', async ({ page }) => {
    await page.goto('vscode://...');
    await page.click('[data-testid="chat-toggle"]');
    
    // Click suggested action
    await page.click('text=Why did you choose this file?');
    
    // Verify message sent
    await expect(page.locator('text=Why did you choose this file?')).toBeVisible();
  });

  test('feedback submission works', async ({ page }) => {
    await page.goto('vscode://...');
    await page.click('[data-testid="chat-toggle"]');
    
    // Click thumbs up on a message
    await page.hover('[data-testid="message-1"]');
    await page.click('[data-testid="thumbs-up"]');
    
    // Verify feedback recorded
    await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
  });
});
```

#### Refinement Flow Test

**File:** `tests/integration/refinement-flow.test.ts`

```typescript
test.describe('Refinement Flow', () => {
  test('user can refine analysis through conversation', async ({ page }) => {
    // Start with initial analysis
    await page.goto('vscode://...?rcaId=123');
    
    // Open chat
    await page.click('[data-testid="chat-toggle"]');
    
    // Provide refinement context
    const input = page.locator('textarea[aria-label="Message input"]');
    await input.fill('Actually, the error happens in UserViewModel.kt, not MainActivity');
    await input.press('Enter');
    
    // Wait for refined analysis
    await expect(page.locator('[data-testid="delta-viewer"]')).toBeVisible();
    
    // Verify delta shows changes
    await expect(page.locator('text=Root Cause Updated')).toBeVisible();
    await expect(page.locator('text=UserViewModel.kt')).toBeVisible();
    
    // Verify confidence changed
    const confidenceBadge = page.locator('[data-testid="confidence-badge"]');
    await expect(confidenceBadge).toContainText('%');
  });
});
```

---

### 3. Backend Integration Tests

**File:** `src/tests/agent/ConversationManager.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationManager } from '@/agent/ConversationManager';
import { ConversationMemory } from '@/agent/ConversationMemory';

describe('ConversationManager', () => {
  let manager: ConversationManager;
  let memory: ConversationMemory;

  beforeEach(() => {
    memory = new ConversationMemory();
    manager = new ConversationManager(memory);
  });

  it('creates conversation session', async () => {
    const session = await manager.createSession('rca-123');
    
    expect(session.sessionId).toBeDefined();
    expect(session.rcaId).toBe('rca-123');
    expect(session.messages).toEqual([]);
  });

  it('handles user message and generates response', async () => {
    const session = await manager.createSession('rca-123');
    
    const response = await manager.handleUserMessage(
      session.sessionId,
      'Why did you choose this file?'
    );
    
    expect(response.role).toBe('assistant');
    expect(response.content).toBeTruthy();
  });

  it('maintains conversation context', async () => {
    const session = await manager.createSession('rca-123');
    
    await manager.handleUserMessage(session.sessionId, 'First message');
    await manager.handleUserMessage(session.sessionId, 'Second message');
    
    const updatedSession = await manager.getSession(session.sessionId);
    expect(updatedSession.messages.length).toBe(4); // 2 user + 2 assistant
  });

  it('classifies message intent', async () => {
    const session = await manager.createSession('rca-123');
    
    const response = await manager.handleUserMessage(
      session.sessionId,
      'Can you explain why?'
    );
    
    expect(response.metadata?.intent).toBe('EXPLANATION');
  });
});
```

---

### 4. E2E User Scenarios

**File:** `tests/e2e/user-scenarios.spec.ts`

```typescript
test.describe('User Scenarios', () => {
  test('Scenario 1: Developer questions analysis result', async ({ page }) => {
    // 1. Developer sees error in queue
    await page.goto('vscode://errors');
    await page.click('[data-testid="error-item-1"]');
    
    // 2. Triggers analysis
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="analysis-result"]');
    
    // 3. Opens chat to ask question
    await page.click('[data-testid="chat-toggle"]');
    const input = page.locator('textarea');
    await input.fill('Why MainActivity.kt instead of UserViewModel.kt?');
    await input.press('Enter');
    
    // 4. Receives explanation
    await expect(page.locator('[role="article"]').last()).toContainText('stack trace');
    
    // 5. Provides feedback
    await page.hover('[data-testid="last-message"]');
    await page.click('[data-testid="thumbs-up"]');
  });

  test('Scenario 2: Agent asks clarification question', async ({ page }) => {
    // 1. Analysis has low confidence
    await page.goto('vscode://analyze?rcaId=low-confidence');
    
    // 2. Agent proactively asks question
    await expect(page.locator('[data-testid="clarification-prompt"]')).toBeVisible();
    await expect(page.locator('text=Which file is most relevant')).toBeVisible();
    
    // 3. User answers
    await page.click('[value="MainActivity.kt"]');
    await page.click('text=Submit Answers');
    
    // 4. Analysis updates
    await expect(page.locator('[data-testid="confidence-badge"]')).toContainText('85%');
  });

  test('Scenario 3: Iterative refinement', async ({ page }) => {
    // 1. Initial analysis
    await page.goto('vscode://analyze?rcaId=123');
    await page.click('[data-testid="chat-toggle"]');
    
    // 2. First refinement
    const input = page.locator('textarea');
    await input.fill('It only happens on app startup');
    await input.press('Enter');
    await expect(page.locator('[data-testid="delta-viewer"]')).toBeVisible();
    
    // 3. Second refinement
    await input.fill('And only when there\\'s no network connection');
    await input.press('Enter');
    await expect(page.locator('[data-testid="confidence-badge"]')).toContainText('9');
  });
});
```

---

### 5. Performance Tests

**File:** `tests/performance/chat-performance.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('chat widget opens in <200ms', async ({ page }) => {
    await page.goto('vscode://...');
    
    const startTime = Date.now();
    await page.click('[data-testid="chat-toggle"]');
    await page.waitForSelector('[data-testid="chat-widget"]', { state: 'visible' });
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(200);
  });

  test('handles 100+ messages without lag', async ({ page }) => {
    // Load conversation with 100 messages
    await page.goto('vscode://...?sessionId=long-conversation');
    await page.click('[data-testid="chat-toggle"]');
    
    // Measure scroll performance
    const scrollContainer = page.locator('[data-testid="message-list"]');
    
    const startTime = Date.now();
    await scrollContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(100);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(100);
  });

  test('typing response time <50ms', async ({ page }) => {
    await page.goto('vscode://...');
    await page.click('[data-testid="chat-toggle"]');
    
    const input = page.locator('textarea');
    
    const startTime = Date.now();
    await input.type('Test message');
    const endTime = Date.now();
    
    const avgTimePerChar = (endTime - startTime) / 12;
    expect(avgTimePerChar).toBeLessThan(50);
  });
});
```

---

### 6. Accessibility Tests

**File:** `tests/accessibility/a11y.test.ts`

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('chat widget meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('vscode://...');
    await page.click('[data-testid="chat-toggle"]');
    
    await injectAxe(page);
    await checkA11y(page, '[data-testid="chat-widget"]', {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('vscode://...');
    
    // Tab to chat toggle
    await page.keyboard.press('Tab');
    // ... (keep tabbing until chat toggle)
    await page.keyboard.press('Enter');
    
    // Verify chat opened
    await expect(page.locator('[data-testid="chat-widget"]')).toBeVisible();
    
    // Tab to input
    await page.keyboard.press('Tab');
    await page.keyboard.type('Test message');
    await page.keyboard.press('Enter');
    
    // Verify message sent
    await expect(page.locator('text=Test message')).toBeVisible();
  });

  test('screen reader announcements', async ({ page }) => {
    await page.goto('vscode://...');
    await page.click('[data-testid="chat-toggle"]');
    
    // Check for live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
    
    // Send message
    const input = page.locator('textarea');
    await input.fill('Test');
    await input.press('Enter');
    
    // Verify announcement
    await expect(liveRegion).toContainText('RCA Agent is typing');
  });
});
```

---

## Test Coverage Goals

### Unit Tests
- **Target:** >90% coverage
- Components: 100%
- Hooks: 95%
- Utilities: 90%

### Integration Tests
- All message flows
- All handler types
- Context switching
- Refinement loops

### E2E Tests
- 5+ critical user scenarios
- All 7 view contexts
- Error handling
- Edge cases

---

## Beta Testing Plan

### Week 1: Internal Alpha
- **Participants:** Development team (5 people)
- **Focus:** Bug identification, crash reports
- **Success Criteria:** No critical bugs

### Week 2-3: Beta Release
- **Participants:** 20-30 early adopters
- **Focus:** Usability, feature requests
- **Feedback Collection:** In-app survey + interviews

### Week 4: General Availability Prep
- **Tasks:** Fix beta issues, polish, documentation
- **Success Criteria:** >80% satisfaction rating

---

## Quality Metrics

### Performance Targets
- [ ] Chat widget opens <200ms
- [ ] Message response time <2s (P95)
- [ ] Animations at 60fps
- [ ] Virtual scrolling for 1000+ messages

### Reliability Targets
- [ ] 99.9% uptime
- [ ] <1% error rate
- [ ] Graceful degradation on failures

### User Satisfaction
- [ ] >80% positive feedback
- [ ] <5% feature requests for critical issues
- [ ] >70% daily active usage

---

**Navigation:**  
← [Phase 6: UI Polish](../Phase-6-UI-Polish/README.md)  
↑ [Back to Index](../INDEX.md)  
✓ [Implementation Complete](../DOCUMENTATION_SUMMARY.md)
