/**
 * Feedback Classifier for Learning Signal Extraction
 * 
 * Analyzes detailed feedback to extract learning signals,
 * identify improvement areas, and measure feedback quality.
 * 
 * @module agent/feedback/FeedbackClassifier
 */

import type {
    DetailedFeedback,
    FeedbackAnalysis,
    LearningSignal,
    NegativeAspect,
    FeedbackDimensions
} from '../../types/feedback';

/**
 * Classifier for extracting insights from user feedback
 */
export class FeedbackClassifier {
    /**
     * Analyze feedback to extract learning signals and insights
     */
    analyzeFeedback(feedback: DetailedFeedback): FeedbackAnalysis {
        return {
            learningSignals: this.extractLearningSignals(feedback),
            improvementAreas: this.identifyImprovementAreas(feedback),
            successPatterns: this.identifySuccessPatterns(feedback),
            confidence: this.calculateFeedbackConfidence(feedback),
            suggestedActions: this.generateSuggestedActions(feedback)
        };
    }

    /**
     * Extract learning signals from feedback
     */
    private extractLearningSignals(feedback: DetailedFeedback): LearningSignal[] {
        const signals: LearningSignal[] = [];

        // File identification errors
        if (
            feedback.dimensions.negativeAspects.includes('wrong_file') &&
            feedback.corrections?.correctFile
        ) {
            signals.push({
                type: 'file_identification_error',
                severity: 'high',
                data: {
                    correctFile: feedback.corrections.correctFile,
                    correctLineNumber: feedback.corrections.correctLineNumber,
                    context: feedback.context,
                    messageId: feedback.messageId
                },
                timestamp: feedback.timestamp
            });
        }

        // Root cause identification errors
        if (
            feedback.dimensions.negativeAspects.includes('incorrect_root_cause') &&
            feedback.corrections?.correctRootCause
        ) {
            signals.push({
                type: 'root_cause_error',
                severity: 'high',
                data: {
                    correctRootCause: feedback.corrections.correctRootCause,
                    correctCategory: feedback.corrections.correctCategory,
                    explanation: feedback.explanation,
                    messageId: feedback.messageId
                },
                timestamp: feedback.timestamp
            });
        }

        // Confidence calibration issues
        if (feedback.dimensions.negativeAspects.includes('wrong_confidence')) {
            signals.push({
                type: 'confidence_miscalibration',
                severity: 'medium',
                data: {
                    rating: feedback.rating,
                    explanation: feedback.explanation,
                    messageId: feedback.messageId
                },
                timestamp: feedback.timestamp
            });
        }

        // Clarity issues
        if (
            feedback.dimensions.negativeAspects.includes('unclear_explanation') ||
            feedback.dimensions.negativeAspects.includes('too_generic')
        ) {
            signals.push({
                type: 'clarity_issue',
                severity: 'medium',
                data: {
                    issues: feedback.dimensions.negativeAspects.filter(a =>
                        ['unclear_explanation', 'too_generic'].includes(a)
                    ),
                    explanation: feedback.explanation,
                    messageId: feedback.messageId
                },
                timestamp: feedback.timestamp
            });
        }

        // Context gaps
        if (feedback.dimensions.negativeAspects.includes('missing_context')) {
            signals.push({
                type: 'context_gap',
                severity: 'medium',
                data: {
                    missingContext: feedback.explanation,
                    currentContext: feedback.context,
                    messageId: feedback.messageId
                },
                timestamp: feedback.timestamp
            });
        }

        return signals;
    }

    /**
     * Identify areas needing improvement
     */
    private identifyImprovementAreas(feedback: DetailedFeedback): string[] {
        const areas = new Set<string>();
        const negatives = feedback.dimensions.negativeAspects;
        const dimensions = feedback.dimensions;

        // Map negative aspects to improvement areas
        if (negatives.includes('too_generic') || negatives.includes('unclear_explanation')) {
            areas.add('specificity');
        }

        if (negatives.includes('unclear_explanation') || negatives.includes('missing_examples')) {
            areas.add('clarity');
        }

        if (negatives.includes('missing_context') || negatives.includes('too_generic')) {
            areas.add('context_awareness');
        }

        if (
            negatives.includes('wrong_file') ||
            negatives.includes('incorrect_root_cause')
        ) {
            areas.add('accuracy');
        }

        if (negatives.includes('wrong_confidence')) {
            areas.add('confidence_calibration');
        }

        if (dimensions.clarity && dimensions.clarity < 3) {
            areas.add('clarity');
        }

        if (dimensions.completeness && dimensions.completeness < 3) {
            areas.add('completeness');
        }

        if (dimensions.accuracy && dimensions.accuracy < 3) {
            areas.add('accuracy');
        }

        if (dimensions.relevance && dimensions.relevance < 3) {
            areas.add('relevance');
        }

        return Array.from(areas);
    }

    /**
     * Identify success patterns to reinforce
     */
    private identifySuccessPatterns(feedback: DetailedFeedback): string[] {
        const patterns: string[] = [];

        // Positive aspects
        patterns.push(...feedback.dimensions.positiveAspects);

        // High ratings indicate success
        if (feedback.dimensions.accuracy && feedback.dimensions.accuracy >= 4) {
            patterns.push('high_accuracy');
        }

        if (feedback.dimensions.clarity && feedback.dimensions.clarity >= 4) {
            patterns.push('good_clarity');
        }

        if (feedback.dimensions.completeness && feedback.dimensions.completeness >= 4) {
            patterns.push('comprehensive');
        }

        if (feedback.rating === 'helpful') {
            patterns.push('overall_helpful');
        }

        return patterns;
    }

    /**
     * Calculate confidence in the feedback quality
     */
    private calculateFeedbackConfidence(feedback: DetailedFeedback): number {
        let score = 40; // Base confidence (40%)

        // Increase for detailed explanations (max +20)
        if (feedback.explanation && feedback.explanation.trim().length > 20) {
            score += 20;
        }

        // Increase for corrections (max +25)
        if (feedback.corrections) {
            const correctionCount = Object.values(feedback.corrections).filter(v => v).length;
            score += Math.min(correctionCount * 8, 25);
        }

        // Increase for multiple specific aspects (max +15)
        const aspectCount =
            (feedback.dimensions.positiveAspects?.length || 0) +
            feedback.dimensions.negativeAspects.length;
        score += Math.min(aspectCount * 2, 15);

        // Increase for numeric ratings (max +10)
        const ratingCount = [
            feedback.dimensions.accuracy,
            feedback.dimensions.clarity,
            feedback.dimensions.completeness,
            feedback.dimensions.relevance
        ].filter(r => r !== undefined).length;
        score += Math.min(ratingCount * 2.5, 10);

        // Decrease for vague negative feedback without explanation
        if (
            feedback.rating === 'not-helpful' &&
            !feedback.explanation &&
            feedback.dimensions.negativeAspects.length === 0
        ) {
            score -= 20;
        }

        return Math.max(Math.min(score, 100), 0);
    }

    /**
     * Generate suggested actions based on feedback
     */
    private generateSuggestedActions(feedback: DetailedFeedback): string[] {
        const actions: string[] = [];

        // File identification errors
        if (feedback.dimensions.negativeAspects.includes('wrong_file')) {
            actions.push('Review file identification logic in parser');
            actions.push('Add test case for this file type');
        }

        // Root cause errors
        if (feedback.dimensions.negativeAspects.includes('incorrect_root_cause')) {
            actions.push('Review root cause classification model');
            actions.push('Add this scenario to training data');
        }

        // Clarity issues
        if (feedback.dimensions.negativeAspects.includes('unclear_explanation')) {
            actions.push('Review explanation generation template');
            actions.push('Improve prompt clarity guidance');
        }

        // Missing examples
        if (feedback.dimensions.negativeAspects.includes('missing_examples')) {
            actions.push('Add example generation to prompt');
            actions.push('Review knowledge base for relevant examples');
        }

        // Multiple improvements needed
        if (feedback.dimensions.negativeAspects.length > 3) {
            actions.push('Schedule comprehensive model review');
        }

        // High positive feedback
        if (feedback.rating === 'helpful' && feedback.dimensions.positiveAspects.length > 0) {
            actions.push('Preserve current analysis approach');
        }

        return actions;
    }

    /**
     * Get summary of feedback profile
     */
    getSummary(feedback: DetailedFeedback): string {
        const analysis = this.analyzeFeedback(feedback);
        const hasCorrections = feedback.corrections && Object.keys(feedback.corrections).length > 0;

        let summary = `Feedback (${feedback.rating}): `;

        if (analysis.learningSignals.length > 0) {
            summary += `${analysis.learningSignals.length} learning signals extracted. `;
        }

        if (analysis.improvementAreas.length > 0) {
            summary += `Improve: ${analysis.improvementAreas.join(', ')}. `;
        }

        if (hasCorrections) {
            summary += 'Contains corrections. ';
        }

        summary += `Confidence: ${analysis.confidence}%`;

        return summary;
    }
}
