# Phase 4: Agent-Initiated Interactions

**Timeline:** Week 5  
**Priority:** [H] High  
**Prerequisites:** Phase 1, Phase 2, Phase 3 complete

---

## Overview

Enable the agent to proactively ask clarification questions when uncertain, improving analysis quality through interactive dialogue.

### Goals

- Agent detects uncertainty in analysis
- Agent asks targeted clarification questions
- User provides answers interactively
- Agent incorporates answers into analysis

### Success Criteria

✅ Agent identifies when it needs more information  
✅ Questions are specific and actionable  
✅ User can answer via interactive forms or text  
✅ Clarification improves analysis confidence

---

## Implementation Plan

### Day 1-2: Backend - Uncertainty Detection

#### 1. Create UncertaintyDetector

**File:** `src/agent/clarification/UncertaintyDetector.ts`

```typescript
import { RootCauseAnalysis, AnalysisContext } from '@/types';

export class UncertaintyDetector {
  /**
   * Detect uncertainty indicators in analysis
   */
  detectUncertainty(analysis: RootCauseAnalysis, context: AnalysisContext): UncertaintyReport {
    const signals: UncertaintySignal[] = [];

    // Low confidence
    if (analysis.confidence < 70) {
      signals.push({
        type: 'low_confidence',
        severity: 'high',
        description: `Confidence is only ${analysis.confidence}%`,
        suggestedQuestion: 'I need more information to be confident. Can you provide additional context about when this error occurs?'
      });
    }

    // Multiple equally likely files
    if (this.hasAmbiguousFiles(analysis.affectedFiles)) {
      signals.push({
        type: 'ambiguous_files',
        severity: 'medium',
        description: 'Multiple files have similar relevance scores',
        suggestedQuestion: `I found multiple files that could be the cause. Which one is most relevant: ${this.formatFileOptions(analysis.affectedFiles)}?`
      });
    }

    // Missing context in error log
    if (this.isMissingContext(context)) {
      signals.push({
        type: 'missing_context',
        severity: 'medium',
        description: 'Error log lacks crucial details',
        suggestedQuestion: 'Can you describe what actions led to this error?'
      });
    }

    // Unclear intent
    if (context.userIntent === 'unclear') {
      signals.push({
        type: 'unclear_intent',
        severity: 'low',
        description: 'User message is ambiguous',
        suggestedQuestion: 'Could you clarify what you\'re asking about?'
      });
    }

    return {
      hasUncertainty: signals.length > 0,
      signals,
      overallSeverity: this.calculateOverallSeverity(signals),
      shouldAskClarification: this.shouldAsk(signals)
    };
  }

  private hasAmbiguousFiles(files: AffectedFile[]): boolean {
    if (files.length < 2) return false;
    
    const topScore = files[0].relevanceScore;
    const secondScore = files[1].relevanceScore;
    
    // If top 2 scores are within 10%, ambiguous
    return Math.abs(topScore - secondScore) < 0.1;
  }

  private isMissingContext(context: AnalysisContext): boolean {
    return !context.userActions || context.userActions.length === 0;
  }

  private calculateOverallSeverity(signals: UncertaintySignal[]): 'low' | 'medium' | 'high' {
    if (signals.some(s => s.severity === 'high')) return 'high';
    if (signals.some(s => s.severity === 'medium')) return 'medium';
    return 'low';
  }

  private shouldAsk(signals: UncertaintySignal[]): boolean {
    // Ask if any high severity signals OR 2+ medium signals
    const highCount = signals.filter(s => s.severity === 'high').length;
    const mediumCount = signals.filter(s => s.severity === 'medium').length;
    
    return highCount > 0 || mediumCount >= 2;
  }

  private formatFileOptions(files: AffectedFile[]): string {
    return files.slice(0, 3).map(f => f.filePath).join(', ');
  }
}
```

#### 2. Define Types

**File:** `src/types/clarification.ts`

```typescript
export interface UncertaintyReport {
  hasUncertainty: boolean;
  signals: UncertaintySignal[];
  overallSeverity: 'low' | 'medium' | 'high';
  shouldAskClarification: boolean;
}

export interface UncertaintySignal {
  type: 'low_confidence' | 'ambiguous_files' | 'missing_context' | 'unclear_intent';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedQuestion: string;
}

export interface ClarificationQuestion {
  questionId: string;
  type: 'open_ended' | 'multiple_choice' | 'yes_no' | 'file_selection';
  prompt: string;
  options?: ClarificationOption[];
  context: string; // Why asking
}

export interface ClarificationOption {
  value: string;
  label: string;
  description?: string;
}

export interface ClarificationAnswer {
  questionId: string;
  answer: string | string[];
  timestamp: Date;
}
```

---

### Day 2-3: Backend - Question Generation

#### 3. Create QuestionGenerator

**File:** `src/agent/clarification/QuestionGenerator.ts`

```typescript
export class QuestionGenerator {
  /**
   * Generate targeted clarification questions
   */
  generateQuestions(uncertaintyReport: UncertaintyReport, analysis: RootCauseAnalysis): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];

    for (const signal of uncertaintyReport.signals) {
      const question = this.generateQuestionForSignal(signal, analysis);
      if (question) {
        questions.push(question);
      }
    }

    // Prioritize by severity
    return questions.sort((a, b) => this.getPriority(b.type) - this.getPriority(a.type));
  }

  private generateQuestionForSignal(signal: UncertaintySignal, analysis: RootCauseAnalysis): ClarificationQuestion | null {
    switch (signal.type) {
      case 'low_confidence':
        return {
          questionId: crypto.randomUUID(),
          type: 'open_ended',
          prompt: 'Can you provide more context about when this error occurs?',
          context: `Current confidence: ${analysis.confidence}%. Additional context will help improve accuracy.`,
          options: undefined
        };

      case 'ambiguous_files':
        return {
          questionId: crypto.randomUUID(),
          type: 'multiple_choice',
          prompt: 'Which file is most relevant to this error?',
          context: 'Multiple files have similar relevance scores.',
          options: analysis.affectedFiles.slice(0, 4).map(file => ({
            value: file.filePath,
            label: file.filePath,
            description: file.reason
          }))
        };

      case 'missing_context':
        return {
          questionId: crypto.randomUUID(),
          type: 'open_ended',
          prompt: 'What steps led to this error?',
          context: 'Understanding the user flow will help identify the root cause.',
          options: undefined
        };

      case 'unclear_intent':
        return {
          questionId: crypto.randomUUID(),
          type: 'multiple_choice',
          prompt: 'What would you like me to do?',
          context: 'I want to provide the most helpful response.',
          options: [
            { value: 'explain', label: 'Explain the current analysis' },
            { value: 'alternatives', label: 'Show alternative causes' },
            { value: 'fix', label: 'Suggest a fix' },
            { value: 'refine', label: 'Refine the analysis' }
          ]
        };

      default:
        return null;
    }
  }

  private getPriority(type: ClarificationQuestion['type']): number {
    const priorities = {
      'file_selection': 3,
      'multiple_choice': 2,
      'yes_no': 1,
      'open_ended': 0
    };
    return priorities[type];
  }
}
```

---

### Day 3-4: Backend - Clarification Agent

#### 4. Create ClarificationAgent

**File:** `src/agent/clarification/ClarificationAgent.ts`

```typescript
export class ClarificationAgent {
  constructor(
    private uncertaintyDetector: UncertaintyDetector,
    private questionGenerator: QuestionGenerator,
    private ollamaService: OllamaService
  ) {}

  /**
   * Analyze if clarification is needed
   */
  async analyzeClarificationNeeds(
    analysis: RootCauseAnalysis,
    context: AnalysisContext
  ): Promise<ClarificationResult> {
    // Detect uncertainty
    const uncertaintyReport = this.uncertaintyDetector.detectUncertainty(analysis, context);

    if (!uncertaintyReport.shouldAskClarification) {
      return {
        needsClarification: false,
        questions: [],
        reason: 'Analysis is sufficiently confident'
      };
    }

    // Generate questions
    const questions = this.questionGenerator.generateQuestions(uncertaintyReport, analysis);

    return {
      needsClarification: true,
      questions,
      reason: this.buildReasoningMessage(uncertaintyReport),
      uncertaintyReport
    };
  }

  /**
   * Process user's clarification answers
   */
  async processClarificationAnswers(
    originalAnalysis: RootCauseAnalysis,
    questions: ClarificationQuestion[],
    answers: ClarificationAnswer[]
  ): Promise<RootCauseAnalysis> {
    // Build context from Q&A
    const clarificationContext = this.buildClarificationContext(questions, answers);

    // Build refinement prompt
    const prompt = `
You previously analyzed an error but had some uncertainty.
I asked clarification questions, and here are the answers:

${clarificationContext}

ORIGINAL ANALYSIS:
${JSON.stringify(originalAnalysis, null, 2)}

TASK:
Re-analyze with this new information and provide an updated analysis.
Increase confidence if the clarification resolved uncertainty.

OUTPUT FORMAT (JSON):
{
  "rootCause": "updated root cause",
  "confidence": 85,
  "affectedFiles": [...],
  "reasoning": "How clarification improved analysis"
}
`.trim();

    // Generate refined analysis
    const response = await this.ollamaService.generate(prompt);
    const refinedAnalysis = this.parseRefinementResponse(response);

    return refinedAnalysis;
  }

  private buildClarificationContext(questions: ClarificationQuestion[], answers: ClarificationAnswer[]): string {
    return questions.map((q, i) => {
      const answer = answers.find(a => a.questionId === q.questionId);
      return `Q: ${q.prompt}\nA: ${answer?.answer || 'No answer provided'}`;
    }).join('\n\n');
  }

  private buildReasoningMessage(report: UncertaintyReport): string {
    const reasons = report.signals.map(s => s.description);
    return `I need clarification because: ${reasons.join(', ')}`;
  }
}
```

---

### Day 4-5: Frontend - Clarification UI

#### 5. Create ClarificationPrompt Component

**File:** `webview/src/components/conversation/ClarificationPrompt.tsx`

```typescript
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HelpCircle } from 'lucide-react';
import type { ClarificationQuestion, ClarificationAnswer } from '@/types/clarification';

interface ClarificationPromptProps {
  questions: ClarificationQuestion[];
  onSubmit: (answers: ClarificationAnswer[]) => void;
  onSkip: () => void;
}

export function ClarificationPrompt({ questions, onSubmit, onSkip }: ClarificationPromptProps) {
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => new Map(prev).set(questionId, answer));
  };

  const handleSubmit = () => {
    const answerArray: ClarificationAnswer[] = Array.from(answers.entries()).map(([questionId, answer]) => ({
      questionId,
      answer,
      timestamp: new Date()
    }));

    onSubmit(answerArray);
  };

  const allAnswered = questions.every(q => answers.has(q.questionId));

  return (
    <Card className="p-4 bg-blue-900/20 border-blue-800">
      <div className="flex items-start gap-3 mb-4">
        <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-100 mb-1">
            I need your help
          </h3>
          <p className="text-sm text-blue-200/80">
            Answering these questions will improve the analysis
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionRenderer
            key={question.questionId}
            question={question}
            questionNumber={index + 1}
            value={answers.get(question.questionId)}
            onChange={(answer) => handleAnswer(question.questionId, answer)}
          />
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="flex-1"
        >
          Submit Answers
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
        >
          Skip
        </Button>
      </div>
    </Card>
  );
}

function QuestionRenderer({ question, questionNumber, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {questionNumber}. {question.prompt}
      </label>
      {question.context && (
        <p className="text-xs text-zinc-400">{question.context}</p>
      )}

      {question.type === 'open_ended' && (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          className="w-full"
        />
      )}

      {question.type === 'multiple_choice' && (
        <RadioGroup value={value} onValueChange={onChange}>
          {question.options?.map(option => (
            <div key={option.value} className="flex items-start gap-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <label htmlFor={option.value} className="text-sm cursor-pointer">
                <div>{option.label}</div>
                {option.description && (
                  <div className="text-xs text-zinc-500">{option.description}</div>
                )}
              </label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === 'yes_no' && (
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="yes" />
              <label htmlFor="yes">Yes</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="no" />
              <label htmlFor="no">No</label>
            </div>
          </div>
        </RadioGroup>
      )}
    </div>
  );
}
```

---

### Day 5: Integration & Testing

#### 6. Create ClarificationHandler

**File:** `src/agent/handlers/ClarificationHandler.ts`

```typescript
export class ClarificationHandler implements IntentHandler {
  name = 'ClarificationHandler';
  supportedIntents = [MessageIntent.AGENT_QUESTION];

  constructor(
    private clarificationAgent: ClarificationAgent
  ) {}

  canHandle(message: Message, context: ConversationContext): boolean {
    // This handler is triggered by the agent, not user messages
    return false;
  }

  async handleAgentInitiated(
    analysis: RootCauseAnalysis,
    context: AnalysisContext
  ): Promise<HandlerResult> {
    const result = await this.clarificationAgent.analyzeClarificationNeeds(analysis, context);

    if (!result.needsClarification) {
      return {
        success: true,
        response: '',
        handlerName: this.name,
        processingTime: 0
      };
    }

    return {
      success: true,
      response: result.reason,
      handlerName: this.name,
      processingTime: 0,
      metadata: {
        clarificationQuestions: result.questions
      }
    };
  }
}
```

---

## Testing Checklist

### Backend Tests

- [ ] UncertaintyDetector identifies all signal types
- [ ] QuestionGenerator creates appropriate questions
- [ ] ClarificationAgent processes answers correctly
- [ ] Refined analysis incorporates clarification
- [ ] Confidence improves after clarification

### Frontend Tests

- [ ] ClarificationPrompt renders all question types
- [ ] Open-ended questions accept text input
- [ ] Multiple choice questions work
- [ ] Submit button enables when all answered
- [ ] Skip button works

### Integration Tests

- [ ] Agent asks questions when uncertain
- [ ] User submits answers
- [ ] Analysis updates with new info
- [ ] Confidence score increases

### User Scenarios

**Scenario 1: Ambiguous file**
```
Agent: "I found two files with similar relevance. Which is more relevant: MainActivity.kt or UserViewModel.kt?"
User: [Selects MainActivity.kt]
Agent: "Thanks! Updating analysis..." [Confidence: 67% → 85%]
```

**Scenario 2: Missing context**
```
Agent: "Can you describe what actions led to this error?"
User: "It happens when I click the login button without network"
Agent: "That helps! It's likely a network timeout..." [Confidence: 62% → 81%]
```

---

## Next Steps

After Phase 4, proceed to:
- **[Phase 5: Rich Feedback](../Phase-5-Rich-Feedback/README.md)** - Multi-dimensional feedback capture

---

**Navigation:**  
← [Phase 3: Iterative Refinement](../Phase-3-Iterative-Refinement/README.md)  
→ [Phase 5: Rich Feedback](../Phase-5-Rich-Feedback/README.md)  
↑ [Back to Index](../INDEX.md)
