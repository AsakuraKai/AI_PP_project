# Phase 2: Intent Classification & Routing (Week 3) [HIGH]

**Goal**: Intelligent handling of different request types

**Status:** Implementation Phase  
**Priority:** [H] High  
**Timeline:** Week 3

---

## Table of Contents

- [Overview](#overview)
- [Intent Categories](#intent-categories)
- [Backend Tasks](#backend-tasks)
- [Frontend Tasks](#frontend-tasks)
- [Deliverables](#deliverables)
- [Testing Checklist](#testing-checklist)
- [Implementation Guide](#implementation-guide)

---

## Overview

This phase adds intelligent message routing based on user intent:
- Classify user messages into specific intents
- Route to appropriate handlers
- Display context-aware UI elements
- Show view-specific suggested actions

**Success Criteria:**
- ✅ System classifies user intent correctly (>85% accuracy)
- ✅ Different intents route to appropriate handlers
- ✅ UI adapts based on message type
- ✅ Users can provide detailed feedback

---

## Intent Categories

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

### Intent Examples

| Intent                | Example User Message               | Expected Response          |
| --------------------- | ---------------------------------- | -------------------------- |
| **CLARIFICATION**     | "What does lateinit mean?"         | Explain concept clearly    |
| **EXPLANATION**       | "Why did you choose MainActivity?" | Explain reasoning          |
| **DETAIL_REQUEST**    | "Show me the stack trace"          | Display detailed info      |
| **REFINEMENT**        | "Check UserRepository instead"     | Re-run with new constraint |
| **ALTERNATIVE**       | "Any other solutions?"             | Propose alternatives       |
| **CORRECTION**        | "Wrong, it's in line 45"           | Accept correction, update  |
| **POSITIVE_FEEDBACK** | "This fixed it!"                   | Thank user, learn          |
| **NEGATIVE_FEEDBACK** | "Didn't work"                      | Ask for details, refine    |

---

## Backend Tasks

### 1. IntentClassifier (`src/agent/IntentClassifier.ts`)

**Responsibilities:**
- LLM-based zero-shot classification
- Confidence scoring
- Entity extraction (file names, line numbers, etc.)
- Contextual classification (considers view type)

```typescript
/**
 * Classifies user messages into specific intents
 */

interface ClassificationResult {
  intent: MessageIntent;
  confidence: number;
  entities: ExtractedEntity[];
  reasoning: string;
}

interface ExtractedEntity {
  type: 'file' | 'line' | 'function' | 'variable' | 'error_type';
  value: string | number;
  confidence: number;
}

export class IntentClassifier {
  private llmAdapter: LLMAdapter;
  
  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter;
  }
  
  async classify(
    message: string,
    context: ConversationContext,
    conversationHistory?: Message[]
  ): Promise<ClassificationResult> {
    const prompt = this.buildClassificationPrompt(message, context, conversationHistory);
    
    const response = await this.llmAdapter.generateCompletion({
      prompt,
      temperature: 0.1, // Low temperature for consistent classification
      maxTokens: 500
    });
    
    return this.parseClassificationResponse(response);
  }
  
  private buildClassificationPrompt(
    message: string,
    context: ConversationContext,
    conversationHistory?: Message[]
  ): string {
    return `
You are an intent classifier for a conversational RCA system.

User's current view: ${context.viewType}
Recent conversation: ${this.formatHistory(conversationHistory)}

User message: "${message}"

Classify this message into ONE of these intents:
- CLARIFICATION: User asking for explanation of concept/term
- EXPLANATION: User asking why something happened or was chosen
- DETAIL_REQUEST: User requesting more information/details
- REFINEMENT: User providing correction/constraint for analysis
- ALTERNATIVE: User asking for different solutions
- CORRECTION: User stating something is wrong
- POSITIVE_FEEDBACK: User indicating success
- NEGATIVE_FEEDBACK: User indicating failure
- PARTIAL_FEEDBACK: Mixed feedback
- NEW_ANALYSIS: User requesting new analysis
- RELATED_ISSUE: User mentioning similar problem

Extract entities:
- File names (e.g., "MainActivity.kt")
- Line numbers (e.g., "line 45")
- Function names
- Variables
- Error types

Return JSON:
{
  "intent": "...",
  "confidence": 0.0-1.0,
  "entities": [...],
  "reasoning": "Why this intent"
}
`;
  }
  
  private parseClassificationResponse(response: string): ClassificationResult {
    try {
      const parsed = JSON.parse(response);
      return {
        intent: parsed.intent as MessageIntent,
        confidence: parsed.confidence,
        entities: parsed.entities || [],
        reasoning: parsed.reasoning
      };
    } catch (error) {
      // Fallback to EXPLANATION intent if parsing fails
      return {
        intent: MessageIntent.EXPLANATION,
        confidence: 0.5,
        entities: [],
        reasoning: 'Failed to parse classification, defaulting to EXPLANATION'
      };
    }
  }
  
  private formatHistory(history?: Message[]): string {
    if (!history || history.length === 0) return 'No previous messages';
    
    return history
      .slice(-3) // Last 3 messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }
}
```

**Implementation Priority:** Week 3, Days 1-2

---

### 2. Intent Handlers (`src/agent/handlers/`)

Create specialized handlers for each intent type:

#### ClarificationHandler.ts

```typescript
/**
 * Handles CLARIFICATION intents
 * Provides clear, educational explanations
 */

export class ClarificationHandler implements IntentHandler {
  async handle(message: ConversationMessage, context: ConversationContext): Promise<ConversationMessage> {
    // Extract what user is asking about
    const topic = this.extractTopic(message.content);
    
    // Generate explanation
    const explanation = await this.generateExplanation(topic, context);
    
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: explanation,
      timestamp: new Date(),
      metadata: {
        intent: MessageIntent.CLARIFICATION,
        handler: 'ClarificationHandler'
      }
    };
  }
  
  private async generateExplanation(topic: string, context: ConversationContext): Promise<string> {
    const prompt = `
Explain "${topic}" in the context of ${context.viewType} clearly and concisely.
Focus on practical understanding.
Include a brief example if relevant.
Keep response under 200 words.
`;
    
    return await this.llmAdapter.generateCompletion({ prompt });
  }
}
```

#### RefinementHandler.ts

```typescript
/**
 * Handles REFINEMENT intents
 * Re-runs analysis with user constraints
 */

export class RefinementHandler implements IntentHandler {
  async handle(message: ConversationMessage, context: ConversationContext): Promise<ConversationMessage> {
    // Extract constraints from message
    const constraints = this.extractConstraints(message);
    
    // Re-run analysis with constraints
    const refinedAnalysis = await this.refineAnalysis(
      context.analysisContext?.analysisId,
      constraints
    );
    
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: this.formatRefinementResponse(refinedAnalysis),
      timestamp: new Date(),
      metadata: {
        intent: MessageIntent.REFINEMENT,
        handler: 'RefinementHandler',
        analysis: refinedAnalysis
      }
    };
  }
  
  private extractConstraints(message: ConversationMessage): AnalysisConstraint[] {
    // Use NER or regex to extract constraints
    // Example: "Check UserRepository.kt instead" → { type: 'file', value: 'UserRepository.kt' }
    return [];
  }
}
```

#### AlternativeHandler.ts, FeedbackHandler.ts, etc.

Create similar handlers for other intents.

**Implementation Priority:** Week 3, Days 2-4

---

### 3. Prompt Templates (`src/agent/prompts/conversation/`)

Create structured prompts for each handler:

```typescript
// prompts/conversation/clarification.ts
export const CLARIFICATION_PROMPT = `
You are a helpful Android debugging assistant.
User is asking for clarification about: {topic}
Context: {context}

Provide a clear, concise explanation that:
1. Defines the concept
2. Explains why it's relevant
3. Gives a practical example
4. Suggests next steps if applicable

Keep response under 200 words.
`;

// prompts/conversation/refinement.ts
export const REFINEMENT_PROMPT = `
User provided refinement: {refinement}
Original analysis: {original_analysis}

Re-analyze with these constraints:
{constraints}

Explain what changed and why confidence improved/decreased.
`;
```

**Implementation Priority:** Week 3, Day 2

---

## Frontend Tasks

### 1. ContextIndicator (`components/conversation/ContextIndicator.tsx`)

**Shows current view context in chat header**

```typescript
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

**Implementation Priority:** Week 3, Day 1

---

### 2. SuggestedActions (`components/conversation/SuggestedActions.tsx`)

**View-specific quick reply buttons**

```typescript
interface SuggestedActionsProps {
  viewType: ViewType;
  onSelect: (action: string) => void;
}

export function SuggestedActions({ viewType, onSelect }: SuggestedActionsProps) {
  const suggestions = getSuggestionsForView(viewType);
  
  return (
    <div className="p-3 border-t border-zinc-800">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function getSuggestionsForView(viewType: ViewType): string[] {
  const suggestions = {
    dashboard: [
      "What errors need attention?",
      "Show today's summary",
      "How is Ollama performing?"
    ],
    analyze: [
      "Why this file?",
      "Explain the fix",
      "Show alternatives"
    ],
    errors: [
      "Which to fix first?",
      "Group similar errors",
      "Analyze selected"
    ],
    // ... other views
  };
  
  return suggestions[viewType] || [];
}
```

**Implementation Priority:** Week 3, Day 3

---

### 3. Enhanced FeedbackPanel

Add intent-based feedback options:

```typescript
export function FeedbackPanel({ messageId, intent }: FeedbackPanelProps) {
  const feedbackOptions = getFeedbackOptionsForIntent(intent);
  
  return (
    <Dialog>
      <DialogContent>
        <h3>What worked well?</h3>
        <CheckboxGroup options={feedbackOptions.positive} />
        
        <h3>What needs improvement?</h3>
        <CheckboxGroup options={feedbackOptions.negative} />
        
        <Textarea placeholder="Additional details..." />
        
        <Button onClick={handleSubmit}>Submit</Button>
      </DialogContent>
    </Dialog>
  );
}

function getFeedbackOptionsForIntent(intent: MessageIntent) {
  if (intent === MessageIntent.CLARIFICATION) {
    return {
      positive: ['Clear explanation', 'Good example', 'Helpful'],
      negative: ['Too technical', 'Missing details', 'Confusing']
    };
  }
  // ... other intents
}
```

**Implementation Priority:** Week 3, Day 4

---

## Deliverables

- ✅ **System classifies user intent correctly** (>85% accuracy)
- ✅ **Different intents route to appropriate handlers**
- ✅ **UI adapts based on message type**
- ✅ **Users can provide detailed feedback**

---

## Testing Checklist

### Unit Tests

- [ ] IntentClassifier correctly classifies various messages
- [ ] Each handler processes its intent correctly
- [ ] ContextIndicator displays correct view info
- [ ] SuggestedActions shows view-specific prompts
- [ ] Feedback options adapt to intent

### Integration Tests

- [ ] Message classified and routed to correct handler
- [ ] Handler response displayed in UI
- [ ] Context indicator updates on navigation
- [ ] Suggested actions change per view
- [ ] Feedback submitted successfully

### Manual Tests

- [ ] Test all intent types with sample messages
- [ ] Verify classification accuracy
- [ ] Check handler responses are appropriate
- [ ] Navigate between views, verify context updates
- [ ] Test suggested action clicks

---

## Implementation Guide

### Day 1: Intent Classification
1. Create IntentClassifier
2. Write classification prompts
3. Test with sample messages
4. Build ContextIndicator component

### Day 2: Basic Handlers
1. Create ClarificationHandler
2. Create RefinementHandler
3. Create FeedbackHandler extensions
4. Test handler responses

### Day 3: UI Components
1. Implement SuggestedActions
2. Wire up to ConversationView
3. Test view-specific prompts
4. Add animations

### Day 4: Integration & Testing
1. Connect handlers to message router
2. Test end-to-end intent flow
3. Write unit tests
4. Fix bugs

### Day 5: Polish & Documentation
1. Refine handler responses
2. Improve classification accuracy
3. Add error handling
4. Update documentation

---

**Next:** [Phase 3: Iterative Refinement](../Phase-3-Iterative-Refinement/README.md)  
**Back:** [Phase 1: Foundation](../Phase-1-Foundation/README.md)
