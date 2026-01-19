# Phase 2 Migration & Usage Guide

**For Developers Integrating Phase 2 Features**

---

## 🚀 Quick Start

### Backend Integration

#### 1. Initialize ConversationManager with LLM Client

**Before (Phase 1):**
```typescript
const conversationManager = new ConversationManager({
    memory: conversationMemory,
    store: conversationStore
});
```

**After (Phase 2):**
```typescript
const llmClient = new OllamaClient({
    model: 'your-model-name',
    temperature: 0.7
});

const conversationManager = new ConversationManager({
    memory: conversationMemory,
    store: conversationStore,
    llmClient: llmClient  // ← Add this for intent classification
});
```

**What This Enables:**
- Automatic intent classification
- Intelligent message routing
- Handler-based responses
- Context-aware replies

**Fallback:** If no `llmClient` provided, Phase 1 behavior (echo responses) continues.

---

#### 2. No Changes Required to Existing Code!

Your existing conversation code continues to work:

```typescript
// This works exactly the same in Phase 2
const response = await conversationManager.continueConversation(
    sessionId,
    userMessage,
    context
);
```

**What Happens Internally (Phase 2):**
1. Message is classified into an intent
2. Appropriate handler is selected
3. Handler generates intelligent response
4. Response is returned

---

### Frontend Integration

#### 1. Import and Use SuggestedActions

```typescript
import { SuggestedActions } from '@/components/conversation/SuggestedActions';

// In your component
<SuggestedActions 
    viewType={context.viewType}
    onSelect={sendMessage}
    disabled={isTyping}
/>
```

**Props:**
- `viewType`: Current view type (dashboard, analyze, errors, etc.)
- `onSelect`: Callback when user clicks a suggestion
- `disabled`: Optional, disables buttons during processing

---

#### 2. Use FeedbackPanel (Optional)

```typescript
import { FeedbackPanel, FeedbackData } from '@/components/conversation/FeedbackPanel';

const [showFeedback, setShowFeedback] = useState(false);
const [currentMessageId, setCurrentMessageId] = useState('');

const handleFeedbackSubmit = (feedback: FeedbackData) => {
    // Send feedback to backend
    postMessage('conversation.feedback', feedback);
    setShowFeedback(false);
};

// In your JSX
{showFeedback && (
    <FeedbackPanel
        messageId={currentMessageId}
        intent={message.metadata?.intent}
        onSubmit={handleFeedbackSubmit}
        onClose={() => setShowFeedback(false)}
    />
)}
```

---

## 🎨 Customization

### Adding a New Intent

**1. Update Intent Type (if needed)**

```typescript
// src/types.ts
export type MessageIntent = 
    | 'clarification'
    | 'explanation'
    // ... existing intents
    | 'your_new_intent';  // ← Add here
```

**2. Create Handler**

```typescript
// src/agent/handlers/YourNewHandler.ts
import { IntentHandler } from './IntentHandler';
import { ConversationMessage, ConversationContext } from '../../types';
import { ClassificationResult } from '../IntentClassifier';

export class YourNewHandler implements IntentHandler {
    async handle(
        message: ConversationMessage,
        context: ConversationContext,
        classification: ClassificationResult
    ): Promise<ConversationMessage> {
        // Your handler logic
        return {
            id: uuidv4(),
            sessionId: message.sessionId,
            role: 'assistant',
            content: 'Your response',
            timestamp: new Date(),
            status: 'sent',
            metadata: {
                intent: 'your_new_intent',
                confidence: classification.confidence,
                context
            }
        };
    }
}
```

**3. Register Handler**

```typescript
// src/agent/ConversationManager.ts constructor
this.intentHandlers = new Map([
    // ... existing handlers
    ['your_new_intent', new YourNewHandler(config.llmClient)]
]);
```

**4. Update IntentClassifier Prompt**

```typescript
// src/agent/IntentClassifier.ts
// Add your new intent to the classification prompt
**YOUR_NEW_INTENT** - Description
   Examples: "example 1", "example 2"
```

**5. Add Feedback Options (Optional)**

```typescript
// vscode-extension/webview/src/components/conversation/FeedbackPanel.tsx
const options: Record<MessageIntent, { positive: string[]; negative: string[] }> = {
    // ... existing options
    your_new_intent: {
        positive: ['Option 1', 'Option 2', 'Option 3'],
        negative: ['Issue 1', 'Issue 2', 'Issue 3']
    }
};
```

---

### Adding View-Specific Suggestions

```typescript
// vscode-extension/webview/src/components/conversation/SuggestedActions.tsx

function getSuggestionsForView(viewType: ViewType): string[] {
    const suggestions: Record<ViewType, string[]> = {
        // ... existing views
        your_new_view: [
            "Suggestion 1",
            "Suggestion 2",
            "Suggestion 3"
        ]
    };
    
    return suggestions[viewType] || [];
}
```

---

### Creating Custom Prompt Templates

```typescript
// src/agent/prompts/conversation/templates.ts

export const YOUR_CUSTOM_PROMPT = (
    param1: string,
    param2: string,
    context: string
) => `
You are [role description].

**Context:** ${context}

**User Input:** ${param1}

**Additional Info:** ${param2}

**Instructions:**
1. Step one
2. Step two
3. Step three

**Keep response under X words.**

Response:
`.trim();
```

**Usage:**
```typescript
const prompt = YOUR_CUSTOM_PROMPT(value1, value2, context.viewType);
const response = await this.llmClient.generate({ prompt });
```

---

## 🧪 Testing Your Changes

### Backend Testing

```typescript
// Test intent classification
import { IntentClassifier } from '@/agent/IntentClassifier';
import { OllamaClient } from '@/llm/OllamaClient';

const llm = new OllamaClient();
const classifier = new IntentClassifier(llm);

const result = await classifier.classify(
    "What does lateinit mean?",
    { viewType: 'analyze', route: '/analyze', timestamp: Date.now() }
);

console.log(result);
// Expected: { intent: 'clarification', confidence: >0.8, ... }
```

### Frontend Testing

```typescript
// Test SuggestedActions rendering
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestedActions } from '@/components/conversation/SuggestedActions';

test('renders suggestions for dashboard view', () => {
    const onSelect = jest.fn();
    render(
        <SuggestedActions 
            viewType="dashboard" 
            onSelect={onSelect}
        />
    );
    
    const suggestion = screen.getByText("What errors need attention?");
    expect(suggestion).toBeInTheDocument();
    
    fireEvent.click(suggestion);
    expect(onSelect).toHaveBeenCalledWith("What errors need attention?");
});
```

---

## 🐛 Troubleshooting

### Issue: Intent Classification Not Working

**Symptom:** Always getting 'explanation' intent

**Solutions:**
1. Check if LLM client is passed to ConversationManager
2. Verify OllamaClient is connected: `await llmClient.connect()`
3. Check LLM model supports JSON output
4. Review classification prompt in logs
5. Try fast classification fallback: `classifier.classifyFast(message)`

---

### Issue: Handler Not Found

**Symptom:** "No handler found for intent: X" in logs

**Solutions:**
1. Verify handler is created and exported
2. Check handler is registered in ConversationManager constructor
3. Ensure intent name matches exactly (lowercase with underscores)
4. Check type definitions include the intent

---

### Issue: Suggested Actions Not Showing

**Symptom:** No quick action buttons appear

**Solutions:**
1. Verify SuggestedActions is imported and rendered
2. Check viewType prop is correct
3. Ensure getSuggestionsForView includes the view
4. Check console for rendering errors
5. Verify component isn't hidden by CSS

---

### Issue: FeedbackPanel Missing Options

**Symptom:** No feedback options shown for an intent

**Solutions:**
1. Check intent is passed to FeedbackPanel
2. Verify getFeedbackOptionsForIntent includes the intent
3. Ensure rating is selected (options only show after rating)
4. Check message.metadata?.intent is set correctly

---

## 📚 API Reference

### IntentClassifier

```typescript
class IntentClassifier {
    constructor(llmClient: OllamaClient);
    
    async classify(
        message: string,
        context: ConversationContext,
        conversationHistory?: ConversationMessage[]
    ): Promise<ClassificationResult>;
    
    async classifyFast(message: string): Promise<MessageIntent>;
}
```

### IntentHandler Interface

```typescript
interface IntentHandler {
    handle(
        message: ConversationMessage,
        context: ConversationContext,
        classification: ClassificationResult
    ): Promise<ConversationMessage>;
}
```

### ConversationManager Updates

```typescript
class ConversationManager {
    constructor(config: {
        memory: ConversationMemory;
        store: ConversationStore;
        llmClient?: OllamaClient;  // ← New optional parameter
    });
    
    // Existing methods work the same
    async continueConversation(...): Promise<ConversationMessage>;
    
    // New method for explicit routing
    async routeMessage(
        message: ConversationMessage,
        context: ConversationContext
    ): Promise<ConversationMessage | null>;
}
```

---

## 🎯 Best Practices

### 1. Always Provide Context

```typescript
// ✅ Good
const response = await conversationManager.continueConversation(
    sessionId,
    message,
    {
        viewType: currentView,
        route: currentRoute,
        timestamp: Date.now()
    }
);

// ❌ Bad
const response = await conversationManager.continueConversation(
    sessionId,
    message
);
```

### 2. Handle Errors Gracefully

```typescript
try {
    const response = await conversationManager.continueConversation(...);
    // Handle response
} catch (error) {
    logger.error('Conversation failed:', error);
    // Show user-friendly error message
    showErrorToast('Failed to process message. Please try again.');
}
```

### 3. Use Fast Classification When Appropriate

```typescript
// For real-time typing indicators
const quickIntent = await classifier.classifyFast(partialMessage);
if (quickIntent === 'positive_feedback') {
    showThumbsUpAnimation();
}
```

### 4. Provide Feedback Context

```typescript
// Include message metadata for better feedback
<FeedbackPanel
    messageId={message.id}
    intent={message.metadata?.intent}  // ← Important!
    onSubmit={handleFeedback}
    onClose={handleClose}
/>
```

---

## 📖 Additional Resources

- **Phase 2 README:** Full implementation details
- **Phase 2 IMPLEMENTATION_COMPLETE:** Component-by-component breakdown
- **Type Definitions:** `src/types.ts` for all interfaces
- **Example Usage:** See existing handlers for patterns

---

**Questions?** Check the comprehensive documentation in the Phase-2-Intent-Classification folder!
