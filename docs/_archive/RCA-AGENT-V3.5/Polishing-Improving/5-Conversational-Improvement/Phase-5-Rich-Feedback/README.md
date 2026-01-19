# Phase 5: Rich Feedback System

**Timeline:** Week 6  
**Priority:** [M] Medium  
**Prerequisites:** Phase 1, Phase 2 complete

---

## Overview

Enhance feedback collection with multi-dimensional ratings, structured corrections, and detailed explanations to better train and improve the agent.

### Goals

- Collect multi-dimensional feedback (accuracy, clarity, completeness, relevance)
- Enable structured corrections (correct file, correct root cause)
- Capture positive aspects alongside negative ones
- Store detailed feedback for agent learning

### Success Criteria

✅ Users can provide granular feedback across multiple dimensions  
✅ Structured correction capture works  
✅ Feedback includes both positive and negative aspects  
✅ All feedback stored for analysis and learning

---

## Implementation Plan

### Day 1-2: Backend - Feedback System

#### 1. Enhance FeedbackHandler

**File:** `src/agent/feedback/FeedbackHandler.ts`

```typescript
import { DetailedFeedback, Message } from '@/types';

export class EnhancedFeedbackHandler {
  constructor(
    private feedbackStore: FeedbackStore,
    private learningService: LearningService
  ) {}

  /**
   * Process detailed multi-dimensional feedback
   */
  async handleDetailedFeedback(feedback: DetailedFeedback): Promise<void> {
    // Validate feedback
    this.validateFeedback(feedback);

    // Store in database
    await this.feedbackStore.save(feedback);

    // Extract corrections for learning
    if (feedback.corrections) {
      await this.learningService.processCorrections(
        feedback.messageId,
        feedback.corrections
      );
    }

    // Update analysis metrics
    await this.updateAnalysisMetrics(feedback);

    // Trigger re-training if threshold met
    await this.checkRetrainingThreshold();
  }

  /**
   * Classify feedback type
   */
  classifyFeedback(feedback: DetailedFeedback): FeedbackClassification {
    const { dimensions, corrections } = feedback;

    return {
      isConstructive: this.isConstructive(feedback),
      hasCorrections: corrections !== undefined,
      severity: this.calculateSeverity(dimensions),
      categories: this.extractCategories(dimensions),
      actionable: this.isActionable(feedback)
    };
  }

  private isConstructive(feedback: DetailedFeedback): boolean {
    return (
      feedback.explanation !== undefined ||
      (feedback.positiveAspects && feedback.positiveAspects.length > 0) ||
      (feedback.corrections && Object.keys(feedback.corrections).length > 0)
    );
  }

  private calculateSeverity(dimensions: FeedbackDimensions): 'low' | 'medium' | 'high' {
    const negativeCount = dimensions.negativeAspects.length;
    
    if (negativeCount === 0) return 'low';
    if (negativeCount <= 2) return 'medium';
    return 'high';
  }

  private extractCategories(dimensions: FeedbackDimensions): string[] {
    return [...dimensions.positiveAspects, ...dimensions.negativeAspects];
  }

  private isActionable(feedback: DetailedFeedback): boolean {
    return (
      feedback.corrections !== undefined ||
      feedback.negativeAspects.includes('wrong_file') ||
      feedback.negativeAspects.includes('incorrect_root_cause')
    );
  }

  private async updateAnalysisMetrics(feedback: DetailedFeedback): Promise<void> {
    if (!feedback.analysisId) return;

    await this.feedbackStore.updateAnalysisMetrics(feedback.analysisId, {
      feedbackReceived: true,
      feedbackRating: feedback.rating,
      feedbackTimestamp: feedback.timestamp
    });
  }

  private async checkRetrainingThreshold(): Promise<void> {
    const recentFeedback = await this.feedbackStore.getRecentFeedback(100);
    const negativeRate = recentFeedback.filter(f => f.rating === 'not-helpful').length / recentFeedback.length;

    if (negativeRate > 0.3) {
      // 30% negative feedback - trigger review
      await this.learningService.triggerReview('high_negative_feedback_rate');
    }
  }
}
```

#### 2. Create FeedbackClassifier

**File:** `src/agent/feedback/FeedbackClassifier.ts`

```typescript
export class FeedbackClassifier {
  /**
   * Analyze feedback to extract learning signals
   */
  analyzeFeedback(feedback: DetailedFeedback): FeedbackAnalysis {
    return {
      learningSignals: this.extractLearningSignals(feedback),
      improvementAreas: this.identifyImprovementAreas(feedback),
      successPatterns: this.identifySuccessPatterns(feedback),
      confidence: this.calculateFeedbackConfidence(feedback)
    };
  }

  private extractLearningSignals(feedback: DetailedFeedback): LearningSignal[] {
    const signals: LearningSignal[] = [];

    // File identification errors
    if (feedback.negativeAspects.includes('wrong_file') && feedback.corrections?.correctFile) {
      signals.push({
        type: 'file_identification_error',
        severity: 'high',
        data: {
          incorrectFile: '', // Would need original analysis
          correctFile: feedback.corrections.correctFile
        }
      });
    }

    // Root cause errors
    if (feedback.negativeAspects.includes('incorrect_root_cause') && feedback.corrections?.correctRootCause) {
      signals.push({
        type: 'root_cause_error',
        severity: 'high',
        data: {
          correctRootCause: feedback.corrections.correctRootCause
        }
      });
    }

    // Confidence calibration
    if (feedback.negativeAspects.includes('wrong_confidence')) {
      signals.push({
        type: 'confidence_miscalibration',
        severity: 'medium',
        data: {}
      });
    }

    return signals;
  }

  private identifyImprovementAreas(feedback: DetailedFeedback): string[] {
    const areas: string[] = [];

    if (feedback.negativeAspects.includes('too_generic')) {
      areas.push('specificity');
    }
    if (feedback.negativeAspects.includes('unclear_explanation')) {
      areas.push('clarity');
    }
    if (feedback.negativeAspects.includes('missing_context')) {
      areas.push('context_awareness');
    }

    return areas;
  }

  private identifySuccessPatterns(feedback: DetailedFeedback): string[] {
    return feedback.positiveAspects || [];
  }

  private calculateFeedbackConfidence(feedback: DetailedFeedback): number {
    let score = 50; // Base confidence

    // Increase for detailed explanations
    if (feedback.explanation && feedback.explanation.length > 20) {
      score += 20;
    }

    // Increase for corrections
    if (feedback.corrections && Object.keys(feedback.corrections).length > 0) {
      score += 20;
    }

    // Increase for multiple aspects mentioned
    const aspectCount = (feedback.positiveAspects?.length || 0) + feedback.negativeAspects.length;
    score += Math.min(aspectCount * 5, 15);

    return Math.min(score, 100);
  }
}
```

---

### Day 2-3: Types and Data Models

#### 3. Define Detailed Feedback Types

**File:** `src/types/feedback.ts`

```typescript
export interface DetailedFeedback {
  feedbackId: string;
  messageId: string;
  analysisId?: string;
  
  // Overall rating
  rating: FeedbackRating;
  
  // Multi-dimensional feedback
  dimensions: FeedbackDimensions;
  
  // Free-text
  explanation?: string;
  
  // Structured corrections
  corrections?: FeedbackCorrections;
  
  // Metadata
  timestamp: Date;
  context: ViewType;
  userId?: string;
}

export type FeedbackRating = 'helpful' | 'partial' | 'not-helpful';

export interface FeedbackDimensions {
  // What worked well
  positiveAspects: PositiveAspect[];
  
  // What needs improvement
  negativeAspects: NegativeAspect[];
  
  // Specific ratings (1-5, optional)
  accuracy?: number;
  clarity?: number;
  completeness?: number;
  relevance?: number;
}

export type PositiveAspect =
  | 'correct_file'
  | 'accurate_root_cause'
  | 'clear_explanation'
  | 'helpful_examples'
  | 'good_confidence'
  | 'relevant_context';

export type NegativeAspect =
  | 'wrong_file'
  | 'incorrect_root_cause'
  | 'unclear_explanation'
  | 'missing_examples'
  | 'wrong_confidence'
  | 'missing_context'
  | 'too_generic';

export interface FeedbackCorrections {
  // File corrections
  correctFile?: string;
  correctLineNumber?: number;
  
  // Root cause corrections
  correctRootCause?: string;
  correctCategory?: ErrorCategory;
  
  // Fix corrections
  correctFix?: string;
  correctApproach?: string;
}

export interface FeedbackClassification {
  isConstructive: boolean;
  hasCorrections: boolean;
  severity: 'low' | 'medium' | 'high';
  categories: string[];
  actionable: boolean;
}

export interface FeedbackAnalysis {
  learningSignals: LearningSignal[];
  improvementAreas: string[];
  successPatterns: string[];
  confidence: number;
}

export interface LearningSignal {
  type: 'file_identification_error' | 'root_cause_error' | 'confidence_miscalibration' | 'clarity_issue';
  severity: 'low' | 'medium' | 'high';
  data: Record<string, any>;
}
```

---

### Day 3-5: Frontend - Feedback UI

#### 4. Create Enhanced FeedbackPanel

**File:** `webview/src/components/conversation/FeedbackPanel.tsx`

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import type { DetailedFeedback, FeedbackDimensions } from '@/types/feedback';

interface FeedbackPanelProps {
  messageId: string;
  analysisId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: DetailedFeedback) => void;
}

export function FeedbackPanel({ messageId, analysisId, isOpen, onClose, onSubmit }: FeedbackPanelProps) {
  const [rating, setRating] = useState<'helpful' | 'partial' | 'not-helpful' | null>(null);
  const [positiveAspects, setPositiveAspects] = useState<string[]>([]);
  const [negativeAspects, setNegativeAspects] = useState<string[]>([]);
  const [explanation, setExplanation] = useState('');
  const [corrections, setCorrections] = useState({
    correctFile: '',
    correctRootCause: '',
    correctFix: ''
  });

  const handleSubmit = () => {
    if (!rating) return;

    const feedback: DetailedFeedback = {
      feedbackId: crypto.randomUUID(),
      messageId,
      analysisId,
      rating,
      dimensions: {
        positiveAspects: positiveAspects as any,
        negativeAspects: negativeAspects as any
      },
      explanation: explanation || undefined,
      corrections: Object.values(corrections).some(v => v) ? corrections : undefined,
      timestamp: new Date(),
      context: 'analyze' // Would come from props
    };

    onSubmit(feedback);
    onClose();
  };

  const toggleAspect = (aspect: string, type: 'positive' | 'negative') => {
    if (type === 'positive') {
      setPositiveAspects(prev =>
        prev.includes(aspect) ? prev.filter(a => a !== aspect) : [...prev, aspect]
      );
    } else {
      setNegativeAspects(prev =>
        prev.includes(aspect) ? prev.filter(a => a !== aspect) : [...prev, aspect]
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Provide Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Overall Rating</label>
            <div className="flex gap-2">
              <Button
                variant={rating === 'helpful' ? 'default' : 'outline'}
                onClick={() => setRating('helpful')}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Helpful
              </Button>
              <Button
                variant={rating === 'partial' ? 'default' : 'outline'}
                onClick={() => setRating('partial')}
                className="flex-1"
              >
                <Minus className="w-4 h-4 mr-2" />
                Partially
              </Button>
              <Button
                variant={rating === 'not-helpful' ? 'default' : 'outline'}
                onClick={() => setRating('not-helpful')}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Not Helpful
              </Button>
            </div>
          </div>

          {/* What Worked Well */}
          <div>
            <label className="text-sm font-medium mb-2 block">What worked well?</label>
            <div className="grid grid-cols-2 gap-2">
              {POSITIVE_ASPECTS.map(aspect => (
                <div key={aspect.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={positiveAspects.includes(aspect.value)}
                    onCheckedChange={() => toggleAspect(aspect.value, 'positive')}
                  />
                  <label className="text-sm">{aspect.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* What Needs Improvement */}
          <div>
            <label className="text-sm font-medium mb-2 block">What needs improvement?</label>
            <div className="grid grid-cols-2 gap-2">
              {NEGATIVE_ASPECTS.map(aspect => (
                <div key={aspect.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={negativeAspects.includes(aspect.value)}
                    onCheckedChange={() => toggleAspect(aspect.value, 'negative')}
                  />
                  <label className="text-sm">{aspect.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Corrections (if applicable) */}
          {negativeAspects.some(a => ['wrong_file', 'incorrect_root_cause'].includes(a)) && (
            <div className="space-y-3 p-3 bg-zinc-900 rounded-lg">
              <label className="text-sm font-medium">Corrections (Optional)</label>
              
              {negativeAspects.includes('wrong_file') && (
                <Input
                  placeholder="Correct file path..."
                  value={corrections.correctFile}
                  onChange={(e) => setCorrections(prev => ({ ...prev, correctFile: e.target.value }))}
                />
              )}
              
              {negativeAspects.includes('incorrect_root_cause') && (
                <Textarea
                  placeholder="Correct root cause..."
                  value={corrections.correctRootCause}
                  onChange={(e) => setCorrections(prev => ({ ...prev, correctRootCause: e.target.value }))}
                />
              )}
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="text-sm font-medium mb-2 block">Additional Comments (Optional)</label>
            <Textarea
              placeholder="Any other feedback or suggestions..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!rating} className="flex-1">
              Submit Feedback
            </Button>
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const POSITIVE_ASPECTS = [
  { value: 'correct_file', label: 'Identified correct file' },
  { value: 'accurate_root_cause', label: 'Root cause was accurate' },
  { value: 'clear_explanation', label: 'Explanation was clear' },
  { value: 'helpful_examples', label: 'Examples were helpful' },
  { value: 'good_confidence', label: 'Appropriate confidence level' },
  { value: 'relevant_context', label: 'Used relevant context' }
];

const NEGATIVE_ASPECTS = [
  { value: 'wrong_file', label: 'Wrong file identified' },
  { value: 'incorrect_root_cause', label: 'Root cause incorrect' },
  { value: 'unclear_explanation', label: 'Explanation unclear' },
  { value: 'missing_examples', label: 'Missing examples' },
  { value: 'wrong_confidence', label: 'Confidence too high/low' },
  { value: 'missing_context', label: 'Missing context' },
  { value: 'too_generic', label: 'Too generic' }
];
```

---

## Testing Checklist

### Backend Tests

- [ ] EnhancedFeedbackHandler processes all feedback types
- [ ] FeedbackClassifier extracts learning signals correctly
- [ ] Corrections are stored properly
- [ ] Retraining threshold detection works

### Frontend Tests

- [ ] FeedbackPanel renders all sections
- [ ] Rating selection works
- [ ] Aspect checkboxes toggle correctly
- [ ] Corrections show when applicable
- [ ] Submit button enables appropriately

### Integration Tests

- [ ] Feedback flows from frontend to backend
- [ ] Structured corrections stored correctly
- [ ] Learning signals extracted and processed

---

**Navigation:**  
← [Phase 4: Agent-Initiated](../Phase-4-Agent-Initiated/README.md)  
→ [Phase 6: UI Polish](../Phase-6-UI-Polish/README.md)  
↑ [Back to Index](../INDEX.md)
