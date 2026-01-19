/**
 * UncertaintyDetector - Detects uncertainty signals in RCA analysis
 * 
 * Analyzes root cause analysis results and context to identify when
 * the agent needs additional information from the user.
 * 
 * Phase 4: Agent-Initiated Clarification
 */

import {
    RootCauseAnalysis,
    ConversationContext,
    UncertaintyReport,
    UncertaintySignal,
    AffectedFile
} from '../../types';
import { Logger } from '../../utils/Logger';

const logger = new Logger('UncertaintyDetector');

export class UncertaintyDetector {
    /**
     * Detect uncertainty indicators in analysis
     */
    detectUncertainty(
        analysis: RootCauseAnalysis,
        context: ConversationContext
    ): UncertaintyReport {
        const signals: UncertaintySignal[] = [];

        // Check for low confidence
        if (this.hasLowConfidence(analysis)) {
            signals.push({
                type: 'low_confidence',
                severity: 'high',
                description: `Confidence is only ${analysis.confidence}%`,
                suggestedQuestion: 'I need more information to be confident. Can you provide additional context about when this error occurs?'
            });
        }

        // Check for ambiguous files
        if (this.hasAmbiguousFiles(analysis.affectedFiles)) {
            signals.push({
                type: 'ambiguous_files',
                severity: 'medium',
                description: 'Multiple files have similar relevance scores',
                suggestedQuestion: `I found multiple files that could be the cause. Which one is most relevant: ${this.formatFileOptions(analysis.affectedFiles)}?`
            });
        }

        // Check for missing context
        if (this.isMissingContext(context)) {
            signals.push({
                type: 'missing_context',
                severity: 'medium',
                description: 'Error log lacks crucial details',
                suggestedQuestion: 'Can you describe what actions led to this error?'
            });
        }

        // Check for unclear intent
        if (this.hasUnclearIntent(context)) {
            signals.push({
                type: 'unclear_intent',
                severity: 'low',
                description: 'User message is ambiguous',
                suggestedQuestion: 'Could you clarify what you\'re asking about?'
            });
        }

        const overallSeverity = this.calculateOverallSeverity(signals);
        const shouldAsk = this.shouldAskClarification(signals);

        logger.info(`Detected ${signals.length} uncertainty signals`, {
            overallSeverity,
            shouldAsk,
            signalTypes: signals.map(s => s.type)
        });

        return {
            hasUncertainty: signals.length > 0,
            signals,
            overallSeverity,
            shouldAskClarification: shouldAsk
        };
    }

    /**
     * Check if confidence is below threshold
     */
    private hasLowConfidence(analysis: RootCauseAnalysis): boolean {
        const CONFIDENCE_THRESHOLD = 70;
        return analysis.confidence < CONFIDENCE_THRESHOLD;
    }

    /**
     * Check if multiple files have ambiguous relevance
     */
    private hasAmbiguousFiles(files: AffectedFile[]): boolean {
        if (files.length < 2) {
            return false;
        }

        const topScore = files[0].relevanceScore;
        const secondScore = files[1].relevanceScore;

        // If top 2 scores are within 10%, consider ambiguous
        const AMBIGUITY_THRESHOLD = 0.1;
        return Math.abs(topScore - secondScore) < AMBIGUITY_THRESHOLD;
    }

    /**
     * Check if context is missing crucial information
     */
    private isMissingContext(context: ConversationContext): boolean {
        // Check if we have basic context about the error
        // This could be expanded based on specific context requirements
        return !context.errorType || context.errorType === 'unknown';
    }

    /**
     * Check if user intent is unclear
     */
    private hasUnclearIntent(context: ConversationContext): boolean {
        // Check if intent classification was unclear or general
        return context.lastUserMessage?.metadata?.intent === 'general' ||
            !context.lastUserMessage?.metadata?.intent;
    }

    /**
     * Calculate overall severity from all signals
     */
    private calculateOverallSeverity(signals: UncertaintySignal[]): 'low' | 'medium' | 'high' {
        if (signals.length === 0) {
            return 'low';
        }

        // Highest severity wins
        if (signals.some(s => s.severity === 'high')) {
            return 'high';
        }

        if (signals.some(s => s.severity === 'medium')) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Determine if clarification should be requested
     */
    private shouldAskClarification(signals: UncertaintySignal[]): boolean {
        // Ask if any high severity signals OR 2+ medium signals
        const highCount = signals.filter(s => s.severity === 'high').length;
        const mediumCount = signals.filter(s => s.severity === 'medium').length;

        return highCount > 0 || mediumCount >= 2;
    }

    /**
     * Format file options for question text
     */
    private formatFileOptions(files: AffectedFile[]): string {
        return files
            .slice(0, 3)
            .map(f => f.filePath)
            .join(', ');
    }
}
