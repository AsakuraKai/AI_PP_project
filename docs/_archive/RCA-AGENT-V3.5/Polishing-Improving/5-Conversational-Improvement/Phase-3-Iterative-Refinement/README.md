# Phase 3: Iterative Refinement

**Timeline:** Week 4  
**Priority:** [H] High  
**Prerequisites:** Phase 1, Phase 2 complete

---

## Overview

Enable users to refine analyses through conversation, with the agent tracking confidence changes and explaining improvements.

### Goals

- Allow users to provide additional context that refines analysis
- Track confidence changes over time
- Show delta/diff between analysis versions
- Explain what changed and why

### Success Criteria

✅ Users can refine analyses by providing more context  
✅ Confidence scores improve with refinement  
✅ Delta view shows what changed between versions  
✅ Agent explains reasoning for changes

---

## Implementation Plan

### Day 1-2: Backend - Refinement System

#### 1. Create RefinementAgent

**File:** `src/agent/refinement/RefinementAgent.ts`

```typescript
import { RootCauseAnalysis, Message, ConversationContext } from '@/types';
import { OllamaService } from '@/llm/OllamaService';

export class RefinementAgent {
  constructor(
    private ollamaService: OllamaService,
    private analysisStore: AnalysisStore
  ) {}

  /**
   * Refine an existing analysis with new user context
   */
  async refineAnalysis(
    originalAnalysis: RootCauseAnalysis,
    userContext: string,
    conversationHistory: Message[]
  ): Promise<RefinementResult> {
    // Build refinement prompt
    const prompt = this.buildRefinementPrompt(
      originalAnalysis,
      userContext,
      conversationHistory
    );

    // Generate refined analysis
    const response = await this.ollamaService.generate(prompt);
    const refinedAnalysis = this.parseRefinementResponse(response);

    // Calculate delta
    const delta = this.calculateDelta(originalAnalysis, refinedAnalysis);

    // Store version history
    await this.analysisStore.saveRefinement(
      originalAnalysis.rcaId,
      refinedAnalysis,
      delta
    );

    return {
      originalAnalysis,
      refinedAnalysis,
      delta,
      reasoning: delta.reasoning,
      confidenceChange: refinedAnalysis.confidence - originalAnalysis.confidence
    };
  }

  /**
   * Build prompt for refinement
   */
  private buildRefinementPrompt(
    original: RootCauseAnalysis,
    userContext: string,
    history: Message[]
  ): string {
    return `
You are refining a root cause analysis based on new information from the user.

ORIGINAL ANALYSIS:
Root Cause: ${original.rootCause}
File: ${original.affectedFiles[0].filePath}
Confidence: ${original.confidence}%

USER'S ADDITIONAL CONTEXT:
${userContext}

CONVERSATION HISTORY:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}

TASK:
1. Re-analyze the error with this new context
2. Determine if the root cause should change
3. Adjust confidence based on new information
4. Explain what changed and why

OUTPUT FORMAT (JSON):
{
  "rootCause": "refined root cause description",
  "affectedFiles": [
    {
      "filePath": "path/to/file.kt",
      "lineNumbers": [45, 46],
      "reason": "why this file is affected",
      "relevanceScore": 0.95
    }
  ],
  "confidence": 87,
  "changes": {
    "whatChanged": "summary of changes",
    "reasoning": "why changes were made",
    "confidenceJustification": "why confidence increased/decreased"
  }
}
`.trim();
  }

  /**
   * Parse LLM response
   */
  private parseRefinementResponse(response: string): RootCauseAnalysis {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse refinement response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      rcaId: '', // Will be set by caller
      errorLogId: '',
      rootCause: parsed.rootCause,
      category: this.inferCategory(parsed.rootCause),
      affectedFiles: parsed.affectedFiles,
      confidence: parsed.confidence,
      suggestedFix: parsed.suggestedFix || {},
      generatedAt: new Date(),
      modelVersion: 'ollama-refinement-v1',
      refinementCount: 0 // Will be incremented by store
    };
  }

  /**
   * Calculate delta between versions
   */
  private calculateDelta(
    original: RootCauseAnalysis,
    refined: RootCauseAnalysis
  ): AnalysisDelta {
    return {
      rootCauseChanged: original.rootCause !== refined.rootCause,
      filesChanged: this.compareFiles(original.affectedFiles, refined.affectedFiles),
      confidenceChange: refined.confidence - original.confidence,
      
      changes: {
        before: {
          rootCause: original.rootCause,
          primaryFile: original.affectedFiles[0]?.filePath,
          confidence: original.confidence
        },
        after: {
          rootCause: refined.rootCause,
          primaryFile: refined.affectedFiles[0]?.filePath,
          confidence: refined.confidence
        }
      },
      
      reasoning: this.explainChanges(original, refined)
    };
  }

  /**
   * Explain what changed and why
   */
  private explainChanges(
    original: RootCauseAnalysis,
    refined: RootCauseAnalysis
  ): string {
    const parts: string[] = [];

    if (original.rootCause !== refined.rootCause) {
      parts.push(`Root cause updated from "${original.rootCause}" to "${refined.rootCause}"`);
    }

    const confChange = refined.confidence - original.confidence;
    if (Math.abs(confChange) >= 5) {
      const direction = confChange > 0 ? 'increased' : 'decreased';
      parts.push(`Confidence ${direction} by ${Math.abs(confChange)}%`);
    }

    const originalFile = original.affectedFiles[0]?.filePath;
    const refinedFile = refined.affectedFiles[0]?.filePath;
    if (originalFile !== refinedFile) {
      parts.push(`Primary file changed from ${originalFile} to ${refinedFile}`);
    }

    return parts.join('. ');
  }
}
```

#### 2. Define Types

**File:** `src/types/refinement.ts`

```typescript
export interface RefinementResult {
  originalAnalysis: RootCauseAnalysis;
  refinedAnalysis: RootCauseAnalysis;
  delta: AnalysisDelta;
  reasoning: string;
  confidenceChange: number;
}

export interface AnalysisDelta {
  rootCauseChanged: boolean;
  filesChanged: FileChange[];
  confidenceChange: number;
  
  changes: {
    before: AnalysisSnapshot;
    after: AnalysisSnapshot;
  };
  
  reasoning: string;
}

export interface AnalysisSnapshot {
  rootCause: string;
  primaryFile: string;
  confidence: number;
}

export interface FileChange {
  type: 'added' | 'removed' | 'unchanged';
  filePath: string;
  oldRelevance?: number;
  newRelevance?: number;
}
```

#### 3. Create RefinementHandler

**File:** `src/agent/handlers/RefinementHandler.ts`

```typescript
export class RefinementHandler implements IntentHandler {
  name = 'RefinementHandler';
  supportedIntents = [MessageIntent.REFINE_ANALYSIS, MessageIntent.PROVIDE_MORE_CONTEXT];

  constructor(
    private refinementAgent: RefinementAgent,
    private conversationManager: ConversationManager
  ) {}

  canHandle(message: Message, context: ConversationContext): boolean {
    // Must have an active RCA
    return context.rcaId !== undefined;
  }

  async handle(message: Message, context: ConversationContext): Promise<HandlerResult> {
    try {
      // Get original analysis
      const originalAnalysis = await this.getAnalysis(context.rcaId!);
      
      // Get conversation history
      const history = await this.conversationManager.getMessages(message.sessionId, 10);
      
      // Refine analysis
      const result = await this.refinementAgent.refineAnalysis(
        originalAnalysis,
        message.content,
        history
      );

      // Build response
      const response = this.buildRefinementResponse(result);

      return {
        success: true,
        response,
        handlerName: this.name,
        processingTime: 0,
        updatedContext: {
          rcaId: result.refinedAnalysis.rcaId
        }
      };
    } catch (error) {
      return {
        success: false,
        response: 'Failed to refine analysis. Please try again.',
        error: error.message,
        handlerName: this.name,
        processingTime: 0
      };
    }
  }

  private buildRefinementResponse(result: RefinementResult): string {
    const { delta, confidenceChange } = result;

    let response = "I've refined the analysis based on your input.\n\n";

    // Confidence change
    if (Math.abs(confidenceChange) >= 5) {
      const direction = confidenceChange > 0 ? 'increased' : 'decreased';
      const emoji = confidenceChange > 0 ? '📈' : '📉';
      response += `${emoji} Confidence ${direction} by ${Math.abs(confidenceChange)}%\n\n`;
    }

    // What changed
    if (delta.rootCauseChanged) {
      response += `**Root Cause Updated:**\n`;
      response += `- Before: ${delta.changes.before.rootCause}\n`;
      response += `- After: ${delta.changes.after.rootCause}\n\n`;
    }

    if (delta.filesChanged.some(f => f.type !== 'unchanged')) {
      response += `**Affected Files Changed:**\n`;
      delta.filesChanged.forEach(change => {
        if (change.type === 'added') {
          response += `- ➕ Added: ${change.filePath}\n`;
        } else if (change.type === 'removed') {
          response += `- ➖ Removed: ${change.filePath}\n`;
        }
      });
      response += '\n';
    }

    // Reasoning
    response += `**Why These Changes:**\n${delta.reasoning}\n\n`;

    // Actions
    response += `You can view the full comparison or apply the refined analysis.`;

    return response;
  }
}
```

---

### Day 3-4: Frontend - Delta View

#### 1. Create DeltaViewer Component

**File:** `webview/src/components/conversation/DeltaViewer.tsx`

```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { AnalysisDelta } from '@/types/refinement';

interface DeltaViewerProps {
  delta: AnalysisDelta;
}

export function DeltaViewer({ delta }: DeltaViewerProps) {
  const { changes, confidenceChange, reasoning } = delta;

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium">Analysis Updated</h3>
        <ConfidenceChangeBadge change={confidenceChange} />
      </div>

      {/* Root Cause Comparison */}
      {delta.rootCauseChanged && (
        <div className="mb-4">
          <label className="text-xs text-zinc-500 uppercase">Root Cause</label>
          <div className="flex items-start gap-2 mt-1">
            <div className="flex-1">
              <div className="text-sm text-zinc-400 line-through">
                {changes.before.rootCause}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-zinc-100">
                {changes.after.rootCause}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Comparison */}
      {changes.before.primaryFile !== changes.after.primaryFile && (
        <div className="mb-4">
          <label className="text-xs text-zinc-500 uppercase">Primary File</label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-sm text-zinc-400 line-through">
              {changes.before.primaryFile}
            </code>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
            <code className="text-sm text-zinc-100">
              {changes.after.primaryFile}
            </code>
          </div>
        </div>
      )}

      {/* Confidence Comparison */}
      <div className="mb-4">
        <label className="text-xs text-zinc-500 uppercase">Confidence</label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-zinc-400">{changes.before.confidence}%</span>
          <ArrowRight className="w-4 h-4 text-zinc-600" />
          <span className="text-sm text-zinc-100">{changes.after.confidence}%</span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="pt-3 border-t border-zinc-800">
        <label className="text-xs text-zinc-500 uppercase mb-2 block">Why These Changes</label>
        <p className="text-sm text-zinc-300">{reasoning}</p>
      </div>
    </Card>
  );
}

function ConfidenceChangeBadge({ change }: { change: number }) {
  if (Math.abs(change) < 5) return null;

  const isPositive = change > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <Badge variant="outline" className={`${colorClass} border-current`}>
      <Icon className="w-3 h-3 mr-1" />
      {isPositive ? '+' : ''}{change}%
    </Badge>
  );
}
```

#### 2. Update MessageBubble to Show Delta

**File:** `webview/src/components/conversation/MessageBubble.tsx`

Add delta support:

```typescript
interface MessageBubbleProps {
  message: Message;
  delta?: AnalysisDelta; // New prop
  onCopy?: () => void;
  onRefine?: () => void;
}

export function MessageBubble({ message, delta, ...handlers }: MessageBubbleProps) {
  // ... existing code

  return (
    <div className={/* ... */}>
      {/* Message content */}
      <div className="prose prose-invert">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>

      {/* Delta viewer (if refinement message) */}
      {delta && <DeltaViewer delta={delta} className="mt-3" />}

      {/* ... actions */}
    </div>
  );
}
```

---

### Day 5: Integration & Testing

#### 1. Register RefinementHandler

**File:** `src/agent/AgentOrchestrator.ts`

```typescript
// Add to constructor
this.handlers.push(
  new RefinementHandler(
    new RefinementAgent(this.ollamaService, this.analysisStore),
    this.conversationManager
  )
);
```

#### 2. Update Webview Message Handler

**File:** `vscode-extension/src/webview/RCAWebviewProvider.ts`

```typescript
case 'sendMessage': {
  const result = await this.conversationService.handleMessage(
    message.sessionId,
    message.content,
    message.context
  );

  // Include delta if this was a refinement
  const delta = result.metadata?.delta;

  this._view?.webview.postMessage({
    command: 'messageReceived',
    message: result.message,
    delta // Pass delta to frontend
  });
  break;
}
```

---

## Testing Checklist

### Backend Tests

- [ ] RefinementAgent correctly parses LLM responses
- [ ] Delta calculation identifies all changes
- [ ] Confidence changes are accurate
- [ ] Analysis versions are stored correctly
- [ ] RefinementHandler only activates when rcaId exists

### Frontend Tests

- [ ] DeltaViewer renders all change types
- [ ] Before/after comparison is clear
- [ ] Confidence badge colors are correct
- [ ] Reasoning text wraps properly
- [ ] Component handles missing delta gracefully

### Integration Tests

- [ ] End-to-end refinement flow works
- [ ] Multiple refinements create version history
- [ ] Delta persists across sessions
- [ ] Webview receives delta with message

### User Scenarios

**Scenario 1: User provides file context**
```
User: "Actually, the error happens in UserViewModel.kt, not MainActivity"
Agent: [Shows delta with file change]
```

**Scenario 2: User clarifies timing**
```
User: "This only happens on app startup, not during normal use"
Agent: [Shows delta with updated root cause]
```

**Scenario 3: User provides code snippet**
```
User: "Here's the actual initialization code: [paste]"
Agent: [Shows delta with improved confidence]
```

---

## Common Issues

### Issue: Confidence doesn't improve after refinement
**Solution:** Check that RefinementAgent's prompt includes clear instructions to adjust confidence based on new information.

### Issue: Delta shows no changes when there were changes
**Solution:** Verify delta calculation logic handles string comparisons correctly (trim whitespace, normalize).

### Issue: Version history grows too large
**Solution:** Implement pruning strategy (keep last N versions, compress old versions).

---

## Next Steps

After Phase 3, proceed to:
- **[Phase 4: Agent-Initiated Interactions](../Phase-4-Agent-Initiated/README.md)** - Proactive clarification questions

---

**Navigation:**  
← [Phase 2: Intent Classification](../Phase-2-Intent-Classification/README.md)  
→ [Phase 4: Agent-Initiated](../Phase-4-Agent-Initiated/README.md)  
↑ [Back to Index](../INDEX.md)
