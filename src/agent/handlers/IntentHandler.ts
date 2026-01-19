/**
 * IntentHandler - Base interface for all intent handlers
 * 
 * Phase 3: Extended with optional parameters for refinement support
 */

import { ConversationMessage, ConversationContext, RootCauseAnalysis } from '../../types';
import { ClassificationResult } from '../IntentClassifier';

export interface IntentHandler {
    /**
     * Handle a message with classified intent
     * @param message User message
     * @param context Conversation context
     * @param classification Intent classification result
     * @param conversationHistory Optional conversation history for context
     * @param currentAnalysis Optional current RCA being discussed (for refinement)
     * @returns Assistant response message
     */
    handle(
        message: ConversationMessage,
        context: ConversationContext,
        classification: ClassificationResult,
        conversationHistory?: ConversationMessage[],
        currentAnalysis?: RootCauseAnalysis
    ): Promise<ConversationMessage>;
}

