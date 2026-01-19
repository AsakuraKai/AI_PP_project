/**
 * IntentClassifier - Classifies user messages into specific intents
 * 
 * Uses LLM-based zero-shot classification to understand user intent
 * and extract relevant entities from messages.
 */

import { ConversationMessage, ConversationContext, MessageIntent } from '../types';
import { OllamaClient } from '../llm/OllamaClient';
import { Logger } from '../utils/Logger';

const logger = new Logger('IntentClassifier');

export interface ClassificationResult {
    /** Classified intent */
    intent: MessageIntent;

    /** Confidence score (0.0-1.0) */
    confidence: number;

    /** Extracted entities from message */
    entities: ExtractedEntity[];

    /** Reasoning for classification */
    reasoning: string;
}

export interface ExtractedEntity {
    /** Type of entity */
    type: 'file' | 'line' | 'function' | 'variable' | 'error_type' | 'class';

    /** Entity value */
    value: string | number;

    /** Confidence in extraction */
    confidence: number;
}

export class IntentClassifier {
    private llmClient: OllamaClient;

    constructor(llmClient: OllamaClient) {
        this.llmClient = llmClient;
    }

    /**
     * Classify user message into specific intent
     */
    async classify(
        message: string,
        context: ConversationContext,
        conversationHistory?: ConversationMessage[]
    ): Promise<ClassificationResult> {
        try {
            const prompt = this.buildClassificationPrompt(message, context, conversationHistory);

            const response = await this.llmClient.generate(prompt, {
                temperature: 0.1, // Low temperature for consistent classification
                maxTokens: 500
            });

            return this.parseClassificationResponse(response.text);
        } catch (error) {
            logger.error('Classification failed:', error);
            // Return safe fallback
            return {
                intent: 'explanation',
                confidence: 0.5,
                entities: [],
                reasoning: 'Classification failed, defaulting to EXPLANATION intent'
            };
        }
    }

    /**
     * Build prompt for intent classification
     */
    private buildClassificationPrompt(
        message: string,
        context: ConversationContext,
        conversationHistory?: ConversationMessage[]
    ): string {
        const historyContext = this.formatHistory(conversationHistory);

        return `You are an intent classifier for a conversational Android debugging RCA system.

**Current Context:**
- User's current view: ${context.viewType}
- Route: ${context.route}

**Recent Conversation:**
${historyContext}

**User Message:**
"${message}"

**Task:** Classify this message into ONE of these intents:

1. **CLARIFICATION** - User asking for explanation of concept/term
   Examples: "What does lateinit mean?", "Explain ViewBinding"

2. **EXPLANATION** - User asking why something happened or was chosen
   Examples: "Why did you choose MainActivity?", "Why is confidence low?"

3. **DETAIL_REQUEST** - User requesting more information/details
   Examples: "Show me the stack trace", "Give me more details"

4. **REFINEMENT** - User providing correction/constraint for analysis
   Examples: "Check UserRepository instead", "Focus on line 45"

5. **ALTERNATIVE** - User asking for different solutions
   Examples: "Any other solutions?", "What else could fix this?"

6. **CORRECTION** - User stating something is wrong
   Examples: "That's incorrect", "Wrong file, it's in MainActivity"

7. **POSITIVE_FEEDBACK** - User indicating success
   Examples: "This fixed it!", "Working now", "Perfect!"

8. **NEGATIVE_FEEDBACK** - User indicating failure
   Examples: "Didn't work", "Still broken", "Made it worse"

9. **PARTIAL_FEEDBACK** - Mixed feedback
   Examples: "This helped but...", "Partially working"

10. **NEW_ANALYSIS** - User requesting new analysis
    Examples: "Analyze this error", "Check this crash"

11. **RELATED_ISSUE** - User mentioning similar problem
    Examples: "I have a similar issue", "Related to previous error"

**Also extract entities:**
- **File names**: MainActivity.kt, UserRepository.java
- **Line numbers**: line 45, L:23
- **Function names**: onCreate, fetchData
- **Variables**: userId, viewModel
- **Error types**: NullPointerException, InflateException
- **Class names**: MainActivity, UserViewModel

**Response Format (JSON):**
{
  "intent": "one of the intents above (lowercase with underscores)",
  "confidence": 0.0-1.0,
  "entities": [
    {
      "type": "file|line|function|variable|error_type|class",
      "value": "extracted value",
      "confidence": 0.0-1.0
    }
  ],
  "reasoning": "Brief explanation why you chose this intent"
}

Respond ONLY with valid JSON. No other text.`;
    }

    /**
     * Parse LLM response into structured result
     */
    private parseClassificationResponse(response: string): ClassificationResult {
        try {
            // Clean response - remove markdown code blocks if present
            const cleanedResponse = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const parsed = JSON.parse(cleanedResponse);

            // Validate intent
            const validIntents: MessageIntent[] = [
                'clarification', 'explanation', 'detail_request', 'refinement',
                'alternative', 'correction', 'positive_feedback', 'negative_feedback',
                'partial_feedback', 'new_analysis', 'related_issue',
                'agent_clarification', 'agent_suggestion'
            ];

            const intent = validIntents.includes(parsed.intent)
                ? parsed.intent
                : 'explanation';

            return {
                intent,
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
                entities: Array.isArray(parsed.entities) ? parsed.entities : [],
                reasoning: parsed.reasoning || 'No reasoning provided'
            };
        } catch (error) {
            logger.error('Failed to parse classification response:', error);
            logger.debug('Raw response:', { response });

            // Fallback to explanation intent
            return {
                intent: 'explanation',
                confidence: 0.5,
                entities: [],
                reasoning: 'Failed to parse classification, defaulting to EXPLANATION'
            };
        }
    }

    /**
     * Format conversation history for context
     */
    private formatHistory(history?: ConversationMessage[]): string {
        if (!history || history.length === 0) {
            return 'No previous messages';
        }

        return history
            .slice(-3) // Last 3 messages for context
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');
    }

    /**
     * Quick classification without LLM (pattern-based fallback)
     * Useful for common patterns to reduce LLM calls
     */
    async classifyFast(message: string): Promise<MessageIntent> {
        const lowerMessage = message.toLowerCase();

        // Positive feedback patterns
        if (/\b(fixed|works?|working|solved|perfect|thanks?|great|excellent)\b/i.test(lowerMessage)) {
            return 'positive_feedback';
        }

        // Negative feedback patterns
        if (/\b(didn'?t work|not working|failed|broken|worse|wrong)\b/i.test(lowerMessage)) {
            return 'negative_feedback';
        }

        // Question patterns
        if (/^(what|why|how|when|where|who|which)\b/i.test(lowerMessage)) {
            if (/^why\b/i.test(lowerMessage)) {
                return 'explanation';
            }
            if (/^what\b/i.test(lowerMessage)) {
                return 'clarification';
            }
        }

        // Show/display/give patterns
        if (/\b(show|display|give|provide)\b/i.test(lowerMessage)) {
            return 'detail_request';
        }

        // Correction patterns
        if (/\b(actually|no,|wrong|incorrect|instead|should be)\b/i.test(lowerMessage)) {
            return 'correction';
        }

        // Default to explanation
        return 'explanation';
    }
}
