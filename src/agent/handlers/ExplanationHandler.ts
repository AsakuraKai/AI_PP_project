/**
 * ExplanationHandler - Handles EXPLANATION intents
 * 
 * Explains why decisions were made or why something happened.
 */

import { ConversationMessage, ConversationContext } from '../../types';
import { ClassificationResult } from '../IntentClassifier';
import { IntentHandler } from './IntentHandler';
import { OllamaClient } from '../../llm/OllamaClient';
import { Logger } from '../../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('ExplanationHandler');

export class ExplanationHandler implements IntentHandler {
    private llmClient: OllamaClient;

    constructor(llmClient: OllamaClient) {
        this.llmClient = llmClient;
    }

    async handle(
        message: ConversationMessage,
        context: ConversationContext,
        classification: ClassificationResult,
        _conversationHistory?: ConversationMessage[],
        _currentAnalysis?: import('../../types').RootCauseAnalysis
    ): Promise<ConversationMessage> {
        try {
            const explanation = await this.generateExplanation(message.content, context, classification);

            return {
                id: uuidv4(),
                sessionId: message.sessionId,
                role: 'assistant',
                content: explanation,
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    intent: 'explanation',
                    confidence: classification.confidence,
                    context
                }
            };
        } catch (error) {
            logger.error('Failed to handle explanation:', error);
            throw error;
        }
    }

    private async generateExplanation(
        userMessage: string,
        context: ConversationContext,
        classification: ClassificationResult
    ): Promise<string> {
        const entitiesContext = this.formatEntities(classification.entities);

        const prompt = `You are an Android debugging assistant explaining analysis decisions and reasoning.

**Context:** User is in the ${context.viewType} view.

**User's Question:** "${userMessage}"

**Detected Entities:** ${entitiesContext}

**Instructions:**
1. Explain the reasoning behind the decision or occurrence
2. Reference specific code elements when relevant
3. Explain the confidence level if applicable
4. Connect explanation to user's current context (${context.viewType})

**Keep response under 250 words.**
**Be clear and direct.**
**Acknowledge uncertainty when present.**

Explanation:`;

        const response = await this.llmClient.generate(prompt, {
            temperature: 0.2,
            maxTokens: 500
        });

        return response.text.trim();
    }

    private formatEntities(entities: any[]): string {
        if (entities.length === 0) {
            return 'None detected';
        }

        return entities
            .map(e => `${e.type}: ${e.value}`)
            .join(', ');
    }
}
