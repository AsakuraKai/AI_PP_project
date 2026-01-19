/**
 * ClarificationHandler - Handles CLARIFICATION intents
 * 
 * Provides clear, educational explanations of concepts and terms.
 */

import { ConversationMessage, ConversationContext } from '../../types';
import { ClassificationResult } from '../IntentClassifier';
import { IntentHandler } from './IntentHandler';
import { OllamaClient } from '../../llm/OllamaClient';
import { Logger } from '../../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('ClarificationHandler');

export class ClarificationHandler implements IntentHandler {
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
            const topic = this.extractTopic(message.content, classification);
            const explanation = await this.generateExplanation(topic, context);

            return {
                id: uuidv4(),
                sessionId: message.sessionId,
                role: 'assistant',
                content: explanation,
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    intent: 'clarification',
                    confidence: classification.confidence,
                    context
                }
            };
        } catch (error) {
            logger.error('Failed to handle clarification:', error);
            throw error;
        }
    }

    /**
     * Extract the main topic from user message
     */
    private extractTopic(messageContent: string, classification: ClassificationResult): string {
        // Check for quoted terms
        const quotedMatch = messageContent.match(/"([^"]+)"/);
        if (quotedMatch) {
            return quotedMatch[1];
        }

        // Check for common question patterns
        const patterns = [
            /what (?:is|are|does|do) (.+?)[\?\.]/i,
            /explain (.+?)[\?\.]/i,
            /what's (.+?)[\?\.]/i,
            /tell me about (.+?)[\?\.]/i,
        ];

        for (const pattern of patterns) {
            const match = messageContent.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        // Check extracted entities
        if (classification.entities.length > 0) {
            const highestConfEntity = classification.entities.reduce((prev, current) =>
                current.confidence > prev.confidence ? current : prev
            );
            return String(highestConfEntity.value);
        }

        // Fallback: return cleaned message
        return messageContent.replace(/^(what|explain|tell me about)\s+/i, '').replace(/[\?\.]+$/, '');
    }

    /**
     * Generate clear explanation using LLM
     */
    private async generateExplanation(topic: string, context: ConversationContext): Promise<string> {
        const prompt = `You are a helpful Android debugging assistant providing clear, concise explanations.

**Context:** User is currently in the ${context.viewType} view.

**User wants to understand:** "${topic}"

**Instructions:**
1. Define the concept clearly and simply
2. Explain why it's relevant to Android development
3. Provide a brief, practical example
4. Suggest next steps if applicable

**Keep response under 200 words.**
**Be conversational and helpful.**
**Focus on practical understanding, not textbook definitions.**

Explanation:`;

        const response = await this.llmClient.generate(prompt, {
            temperature: 0.3, // Slightly higher for natural language
            maxTokens: 400
        });

        return response.text.trim();
    }
}
