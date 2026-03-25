/**
 * RefinementHandler - Handles REFINEMENT intents
 * 
 * Phase 3: Fully integrated with RefinementAgent for actual re-analysis
 */

import {
    ConversationMessage,
    ConversationContext,
    RootCauseAnalysis,
    RefinementResult
} from '../../types';
import { ClassificationResult } from '../IntentClassifier';
import { IntentHandler } from './IntentHandler';
import { OllamaClient } from '../../llm/OllamaClient';
import { RefinementAgent } from '../refinement/RefinementAgent';
import { RefinementService } from '../refinement/RefinementService';
import { ConfidenceTracker } from '../refinement/ConfidenceTracker';
import { Logger } from '../../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('RefinementHandler');

export interface AnalysisConstraint {
    type: 'file' | 'line' | 'function' | 'approach';
    value: string | number;
    action: 'focus' | 'exclude' | 'prioritize';
}

export class RefinementHandler implements IntentHandler {
    private refinementAgent: RefinementAgent;
    private confidenceTracker: ConfidenceTracker;

    constructor(llmClient: OllamaClient) {
        const refinementService = new RefinementService(llmClient);
        this.refinementAgent = new RefinementAgent(refinementService);
        this.confidenceTracker = new ConfidenceTracker();
    }

    async handle(
        message: ConversationMessage,
        context: ConversationContext,
        _classification: ClassificationResult,
        conversationHistory?: ConversationMessage[],
        currentAnalysis?: RootCauseAnalysis
    ): Promise<ConversationMessage> {
        try {
            // Check if we have an active analysis to refine
            if (!currentAnalysis) {
                return this.createNoAnalysisResponse(message);
            }

            // Perform refinement
            const refinementResult = await this.refinementAgent.refineAnalysis(
                currentAnalysis,
                message.content,
                conversationHistory || []
            );

            // Track confidence change
            this.confidenceTracker.recordConfidence(
                refinementResult.refinedAnalysis.rcaId,
                refinementResult.refinedAnalysis.confidence,
                refinementResult.reasoning,
                message.id
            );

            // Build response
            const responseContent = this.buildRefinementResponse(refinementResult);

            return {
                id: uuidv4(),
                sessionId: message.sessionId,
                role: 'assistant',
                content: responseContent,
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    intent: 'refinement',
                    confidence: refinementResult.refinedAnalysis.confidence,
                    context,
                    toolsUsed: ['refinement_agent', 'confidence_tracker'],
                    // Include delta for frontend rendering
                    delta: refinementResult.delta
                }
            };
        } catch (error) {
            logger.error('Failed to handle refinement:', error);
            return this.createErrorResponse(message, error);
        }
    }

    /**
     * Build response message with delta information
     */
    private buildRefinementResponse(result: RefinementResult): string {
        const { delta, confidenceChange } = result;
        const parts: string[] = [];

        parts.push("✅ I've refined the analysis based on your input.\n");

        // Confidence change
        if (Math.abs(confidenceChange) >= 5) {
            const direction = confidenceChange > 0 ? 'increased' : 'decreased';
            const emoji = confidenceChange > 0 ? '📈' : '📉';
            parts.push(
                `${emoji} **Confidence ${direction}** by ${Math.abs(confidenceChange)}% ` +
                `(${result.originalAnalysis.confidence}% → ${result.refinedAnalysis.confidence}%)\n`
            );
        }

        // Root cause change
        if (delta.rootCauseChanged) {
            parts.push(`\n**Updated Root Cause:**`);
            parts.push(`"${result.refinedAnalysis.rootCause}"\n`);
        }

        // File changes
        const addedFiles = delta.filesChanged.filter(f => f.type === 'added');
        const removedFiles = delta.filesChanged.filter(f => f.type === 'removed');

        if (addedFiles.length > 0 || removedFiles.length > 0) {
            parts.push(`\n**File Changes:**`);
            if (addedFiles.length > 0) {
                parts.push(`- ➕ Added: ${addedFiles.map(f => f.filePath).join(', ')}`);
            }
            if (removedFiles.length > 0) {
                parts.push(`- ➖ Removed: ${removedFiles.map(f => f.filePath).join(', ')}`);
            }
            parts.push('');
        }

        // Reasoning
        parts.push(`\n**Reasoning:**`);
        parts.push(delta.reasoning);

        parts.push(`\n💡 You can continue refining or ask for more details about the changes.`);

        return parts.join('\n');
    }

    /**
     * Create response when no active analysis exists
     */
    private createNoAnalysisResponse(message: ConversationMessage): ConversationMessage {
        return {
            id: uuidv4(),
            sessionId: message.sessionId,
            role: 'assistant',
            content:
                "I don't have an active analysis to refine. Please start by analyzing an error first, " +
                "then I can help refine the results based on your feedback.",
            timestamp: new Date(),
            status: 'sent',
            metadata: {
                intent: 'refinement',
                confidence: 1.0
            }
        };
    }

    /**
     * Create error response
     */
    private createErrorResponse(
        message: ConversationMessage,
        error: any
    ): ConversationMessage {
        return {
            id: uuidv4(),
            sessionId: message.sessionId,
            role: 'assistant',
            content:
                "I encountered an error while refining the analysis. " +
                "Please try again or rephrase your feedback.",
            timestamp: new Date(),
            status: 'sent',
            metadata: {
                intent: 'refinement',
                confidence: 0,
                error: error.message
            }
        };
    }

    /**
     * Get confidence tracker instance
     */
    getConfidenceTracker(): ConfidenceTracker {
        return this.confidenceTracker;
    }
}

