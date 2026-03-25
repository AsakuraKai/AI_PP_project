/**
 * Enhanced Feedback Handler for Rich Feedback System
 * 
 * Processes multi-dimensional feedback with structured corrections,
 * extracts learning signals, and manages feedback-driven model improvement.
 * 
 * @module agent/feedback/EnhancedFeedbackHandler
 */

import type {
    DetailedFeedback,
    FeedbackClassification,
    IFeedbackStore,
    ILearningService
} from '../../types/feedback';
import { FeedbackClassifier } from './FeedbackClassifier';

/**
 * Configuration for enhanced feedback handling
 */
export interface EnhancedFeedbackConfig {
    /** Negative feedback threshold for triggering review (0-1) */
    negativeThreshold?: number;

    /** Enable automatic learning signal processing */
    autoProcessSignals?: boolean;

    /** Enable feedback analytics */
    enableAnalytics?: boolean;

    /** Logger instance */
    logger?: any;
}

/**
 * Enhanced feedback handler for processing detailed feedback
 */
export class EnhancedFeedbackHandler {
    private readonly classifier: FeedbackClassifier;
    private readonly config: Required<EnhancedFeedbackConfig>;

    constructor(
        private feedbackStore: IFeedbackStore,
        private learningService: ILearningService,
        config: EnhancedFeedbackConfig = {}
    ) {
        this.classifier = new FeedbackClassifier();
        this.config = {
            negativeThreshold: config.negativeThreshold ?? 0.3,
            autoProcessSignals: config.autoProcessSignals ?? true,
            enableAnalytics: config.enableAnalytics ?? true,
            logger: config.logger ?? console
        };
    }

    /**
     * Process detailed multi-dimensional feedback
     */
    async handleDetailedFeedback(feedback: DetailedFeedback): Promise<void> {
        try {
            // Validate feedback
            this.validateFeedback(feedback);

            this.config.logger.log(`Processing feedback: ${feedback.feedbackId}`);

            // Store in database
            await this.feedbackStore.save(feedback);

            // Extract and process corrections
            if (feedback.corrections) {
                await this.learningService.processCorrections(
                    feedback.messageId,
                    feedback.corrections
                );
            }

            // Extract learning signals
            if (this.config.autoProcessSignals) {
                const analysis = this.classifier.analyzeFeedback(feedback);

                if (analysis.learningSignals.length > 0) {
                    await this.learningService.updateModelWeights(analysis.learningSignals);
                }
            }

            // Update analysis metrics
            if (feedback.analysisId) {
                await this.updateAnalysisMetrics(feedback);
            }

            // Check if retraining is needed
            await this.checkRetrainingThreshold();

            this.config.logger.log(`Feedback processed successfully: ${feedback.feedbackId}`);
        } catch (error) {
            this.config.logger.error('Error processing feedback:', error);
            throw error;
        }
    }

    /**
     * Classify feedback to understand its nature and impact
     */
    classifyFeedback(feedback: DetailedFeedback): FeedbackClassification {
        const { dimensions, corrections } = feedback;

        return {
            isConstructive: this.isConstructive(feedback),
            hasCorrections: corrections !== undefined && Object.keys(corrections).length > 0,
            severity: this.calculateSeverity(dimensions.negativeAspects.length),
            categories: this.extractCategories(dimensions),
            actionable: this.isActionable(feedback)
        };
    }

    /**
     * Get feedback statistics for analytics
     */
    async getFeedbackAnalytics() {
        return await this.feedbackStore.getStats();
    }

    /**
     * Validate feedback format and content
     */
    private validateFeedback(feedback: DetailedFeedback): void {
        if (!feedback.feedbackId || feedback.feedbackId.trim() === '') {
            throw new Error('Feedback ID is required');
        }

        if (!feedback.messageId || feedback.messageId.trim() === '') {
            throw new Error('Message ID is required');
        }

        if (!feedback.rating || !['helpful', 'partial', 'not-helpful'].includes(feedback.rating)) {
            throw new Error('Invalid feedback rating');
        }

        if (!feedback.dimensions || !Array.isArray(feedback.dimensions.negativeAspects)) {
            throw new Error('Feedback dimensions are required');
        }

        if (!feedback.timestamp || !(feedback.timestamp instanceof Date)) {
            throw new Error('Valid timestamp is required');
        }
    }

    /**
     * Check if feedback is constructive
     */
    private isConstructive(feedback: DetailedFeedback): boolean {
        return (
            feedback.explanation !== undefined ||
            (feedback.dimensions.positiveAspects !== undefined && feedback.dimensions.positiveAspects.length > 0) ||
            (feedback.corrections !== undefined && Object.keys(feedback.corrections).length > 0)
        );
    }

    /**
     * Calculate severity based on negative aspects count
     */
    private calculateSeverity(negativeCount: number): 'low' | 'medium' | 'high' {
        if (negativeCount === 0) return 'low';
        if (negativeCount <= 2) return 'medium';
        return 'high';
    }

    /**
     * Extract categories from feedback dimensions
     */
    private extractCategories(dimensions: any): string[] {
        return [
            ...(dimensions.positiveAspects || []),
            ...(dimensions.negativeAspects || [])
        ];
    }

    /**
     * Check if feedback is actionable
     */
    private isActionable(feedback: DetailedFeedback): boolean {
        const hasCorrections = feedback.corrections && Object.keys(feedback.corrections).length > 0;
        const hasCriticalIssues =
            feedback.dimensions.negativeAspects.includes('wrong_file') ||
            feedback.dimensions.negativeAspects.includes('incorrect_root_cause');

        return hasCorrections || hasCriticalIssues;
    }

    /**
     * Update analysis metrics based on feedback
     */
    private async updateAnalysisMetrics(feedback: DetailedFeedback): Promise<void> {
        if (!feedback.analysisId) return;

        const metrics = {
            feedbackReceived: true,
            feedbackRating: feedback.rating,
            feedbackTimestamp: feedback.timestamp.toISOString(),
            isConstructive: this.isConstructive(feedback),
            hasCorrections: feedback.corrections !== undefined
        };

        await this.feedbackStore.updateAnalysisMetrics(feedback.analysisId, metrics);
    }

    /**
     * Check if negative feedback threshold is exceeded
     */
    private async checkRetrainingThreshold(): Promise<void> {
        try {
            const stats = await this.feedbackStore.getStats();
            const negativeRate = stats.notHelpfulCount / Math.max(stats.totalFeedback, 1);

            if (negativeRate > this.config.negativeThreshold) {
                this.config.logger.warn(
                    `High negative feedback rate detected: ${(negativeRate * 100).toFixed(2)}%`
                );
                await this.learningService.triggerReview('high_negative_feedback_rate');
            }
        } catch (error) {
            this.config.logger.error('Error checking retraining threshold:', error);
        }
    }
}
