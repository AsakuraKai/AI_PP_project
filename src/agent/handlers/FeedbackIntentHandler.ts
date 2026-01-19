/**
 * FeedbackIntentHandler - Handles feedback intents
 * 
 * Handles positive, negative, and partial feedback from users.
 */

import { ConversationMessage, ConversationContext, MessageIntent } from '../../types';
import { ClassificationResult } from '../IntentClassifier';
import { IntentHandler } from './IntentHandler';
import { Logger } from '../../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('FeedbackIntentHandler');

export class FeedbackIntentHandler implements IntentHandler {
    async handle(
        message: ConversationMessage,
        context: ConversationContext,
        classification: ClassificationResult,
        _conversationHistory?: ConversationMessage[],
        _currentAnalysis?: import('../../types').RootCauseAnalysis
    ): Promise<ConversationMessage> {
        try {
            const response = this.generateFeedbackResponse(
                classification.intent,
                message.content,
                context
            );

            return {
                id: uuidv4(),
                sessionId: message.sessionId,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    intent: classification.intent,
                    confidence: classification.confidence,
                    context
                }
            };
        } catch (error) {
            logger.error('Failed to handle feedback:', error);
            throw error;
        }
    }

    private generateFeedbackResponse(
        intent: MessageIntent,
        userMessage: string,
        context: ConversationContext
    ): string {
        switch (intent) {
            case 'positive_feedback':
                return this.handlePositiveFeedback(userMessage, context);

            case 'negative_feedback':
                return this.handleNegativeFeedback(userMessage, context);

            case 'partial_feedback':
                return this.handlePartialFeedback(userMessage, context);

            default:
                return "Thank you for your feedback! It helps me improve.";
        }
    }

    private handlePositiveFeedback(_message: string, _context: ConversationContext): string {
        return "🎉 Excellent! I'm glad the solution worked for you.\n\n" +
            "Your success helps me learn and improve future analysis. " +
            "If you encounter similar issues, feel free to ask!";
    }

    private handleNegativeFeedback(_message: string, _context: ConversationContext): string {
        return "I understand this didn't work as expected. Let me help further.\n\n" +
            "Could you provide more details?\n" +
            "- What exactly happened when you tried the fix?\n" +
            "- Did you see any new error messages?\n" +
            "- Which part of the solution didn't work?\n\n" +
            "This will help me provide a better solution.";
    }

    private handlePartialFeedback(_message: string, _context: ConversationContext): string {
        return "Thanks for the detailed feedback. I see there's partial progress.\n\n" +
            "Let's address what's still not working:\n" +
            "- What part worked well?\n" +
            "- What still needs fixing?\n" +
            "- Any new symptoms or errors?\n\n" +
            "I'll refine the analysis to address the remaining issues.";
    }
}
