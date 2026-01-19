/**
 * Enhanced Feedback Type Definitions
 * 
 * Comprehensive types for multi-dimensional feedback collection,
 * structured corrections, and learning signal extraction.
 * 
 * @module types/feedback
 */

import type { ViewType } from '../types';

/**
 * Overall feedback rating
 */
export type FeedbackRating = 'helpful' | 'partial' | 'not-helpful';

/**
 * Positive aspects of the analysis
 */
export type PositiveAspect =
    | 'correct_file'
    | 'accurate_root_cause'
    | 'clear_explanation'
    | 'helpful_examples'
    | 'good_confidence'
    | 'relevant_context';

/**
 * Negative aspects needing improvement
 */
export type NegativeAspect =
    | 'wrong_file'
    | 'incorrect_root_cause'
    | 'unclear_explanation'
    | 'missing_examples'
    | 'wrong_confidence'
    | 'missing_context'
    | 'too_generic';

/**
 * Error categories for classification
 */
export type ErrorCategory =
    | 'runtime_error'
    | 'build_error'
    | 'syntax_error'
    | 'logic_error'
    | 'configuration_error'
    | 'dependency_error'
    | 'performance_issue'
    | 'other';

/**
 * Multi-dimensional feedback aspects
 */
export interface FeedbackDimensions {
    /** What worked well */
    positiveAspects: PositiveAspect[];

    /** What needs improvement */
    negativeAspects: NegativeAspect[];

    /** Optional: Accuracy rating (1-5) */
    accuracy?: number;

    /** Optional: Clarity rating (1-5) */
    clarity?: number;

    /** Optional: Completeness rating (1-5) */
    completeness?: number;

    /** Optional: Relevance rating (1-5) */
    relevance?: number;
}

/**
 * Structured corrections for wrong analyses
 */
export interface FeedbackCorrections {
    /** Correct file path if wrong file was identified */
    correctFile?: string;

    /** Correct line number */
    correctLineNumber?: number;

    /** Correct root cause if analysis was wrong */
    correctRootCause?: string;

    /** Correct error category */
    correctCategory?: ErrorCategory;

    /** Correct fix if suggested fix was wrong */
    correctFix?: string;

    /** Correct approach/explanation */
    correctApproach?: string;
}

/**
 * Detailed feedback from user
 */
export interface DetailedFeedback {
    /** Unique feedback ID */
    feedbackId: string;

    /** ID of message being rated */
    messageId: string;

    /** Optional: Analysis ID that was provided feedback on */
    analysisId?: string;

    /** Overall rating */
    rating: FeedbackRating;

    /** Multi-dimensional feedback */
    dimensions: FeedbackDimensions;

    /** Optional: Free-text explanation */
    explanation?: string;

    /** Optional: Structured corrections */
    corrections?: FeedbackCorrections;

    /** Timestamp of feedback */
    timestamp: Date;

    /** Current view context */
    context: ViewType;

    /** Optional: User ID */
    userId?: string;

    /** Optional: Conversation ID */
    conversationId?: string;
}

/**
 * Classification of feedback quality and actionability
 */
export interface FeedbackClassification {
    /** Whether feedback is constructive */
    isConstructive: boolean;

    /** Whether feedback includes corrections */
    hasCorrections: boolean;

    /** Severity level */
    severity: 'low' | 'medium' | 'high';

    /** Categories mentioned in feedback */
    categories: string[];

    /** Whether feedback is actionable */
    actionable: boolean;
}

/**
 * Learning signal extracted from feedback
 */
export interface LearningSignal {
    /** Type of learning signal */
    type:
    | 'file_identification_error'
    | 'root_cause_error'
    | 'confidence_miscalibration'
    | 'clarity_issue'
    | 'context_gap';

    /** Severity of the issue */
    severity: 'low' | 'medium' | 'high';

    /** Associated data for learning */
    data: Record<string, any>;

    /** Timestamp when signal was generated */
    timestamp: Date;
}

/**
 * Analysis of feedback and extracted insights
 */
export interface FeedbackAnalysis {
    /** Learning signals extracted */
    learningSignals: LearningSignal[];

    /** Areas identified for improvement */
    improvementAreas: string[];

    /** Success patterns to reinforce */
    successPatterns: string[];

    /** Confidence score of the feedback (0-100) */
    confidence: number;

    /** Suggested actions based on feedback */
    suggestedActions?: string[];
}

/**
 * Aggregated feedback statistics
 */
export interface FeedbackStats {
    /** Total feedback received */
    totalFeedback: number;

    /** Count of helpful feedback */
    helpfulCount: number;

    /** Count of partial feedback */
    partialCount: number;

    /** Count of not-helpful feedback */
    notHelpfulCount: number;

    /** Overall approval rate (0-1) */
    approvalRate: number;

    /** Most common positive aspects */
    commonPositiveAspects: PositiveAspect[];

    /** Most common negative aspects */
    commonNegativeAspects: NegativeAspect[];

    /** Average dimension ratings */
    averageRatings: {
        accuracy?: number;
        clarity?: number;
        completeness?: number;
        relevance?: number;
    };
}

/**
 * Feedback storage interface
 */
export interface IFeedbackStore {
    /** Save feedback */
    save(feedback: DetailedFeedback): Promise<void>;

    /** Retrieve feedback by ID */
    getById(feedbackId: string): Promise<DetailedFeedback | null>;

    /** Retrieve recent feedback */
    getRecent(limit: number): Promise<DetailedFeedback[]>;

    /** Get feedback for specific analysis */
    getForAnalysis(analysisId: string): Promise<DetailedFeedback[]>;

    /** Get feedback statistics */
    getStats(): Promise<FeedbackStats>;

    /** Update analysis metrics based on feedback */
    updateAnalysisMetrics(
        analysisId: string,
        metrics: Record<string, any>
    ): Promise<void>;
}

/**
 * Learning service interface
 */
export interface ILearningService {
    /** Process corrections for learning */
    processCorrections(messageId: string, corrections: FeedbackCorrections): Promise<void>;

    /** Trigger model retraining review */
    triggerReview(reason: string): Promise<void>;

    /** Update model weights based on feedback */
    updateModelWeights(signals: LearningSignal[]): Promise<void>;
}
