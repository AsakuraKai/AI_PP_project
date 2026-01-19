/**
 * ConversationManager - Orchestrate multi-turn conversations
 * 
 * Responsibilities:
 * - Create and manage conversation sessions
 * - Route messages to appropriate handlers
 * - Maintain conversation context
 * - Orchestrate multi-turn interactions
 */

import { ConversationSession, ConversationMessage, ConversationContext, RootCauseAnalysis, ClarificationResult, ClarificationAnswer } from '../types';
import { ConversationMemory } from './ConversationMemory';
import { ConversationStore } from '../db/ConversationStore';
import { IntentClassifier } from './IntentClassifier';
import {
    ClarificationHandler,
    ExplanationHandler,
    RefinementHandler,
    FeedbackIntentHandler
} from './handlers';
import { IntentHandler } from './handlers/IntentHandler';
import { OllamaClient } from '../llm/OllamaClient';
import { ClarificationAgent, UncertaintyDetector, QuestionGenerator } from './clarification';
import { RefinementService } from './refinement/RefinementService';
import { Logger } from '../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('ConversationManager');

export interface ConversationManagerConfig {
    memory: ConversationMemory;
    store: ConversationStore;
    llmClient?: OllamaClient;
}

export class ConversationManager {
    private memory: ConversationMemory;
    private store: ConversationStore;
    private activeSessions: Map<string, ConversationSession>;
    private intentClassifier?: IntentClassifier;
    private intentHandlers: Map<string, IntentHandler>;
    private clarificationAgent?: ClarificationAgent;

    constructor(config: ConversationManagerConfig) {
        this.memory = config.memory;
        this.store = config.store;
        this.activeSessions = new Map();

        // Initialize intent classification system if LLM client provided
        if (config.llmClient) {
            this.intentClassifier = new IntentClassifier(config.llmClient);

            // Initialize intent handlers with common IntentHandler type
            const handlers: Array<[string, IntentHandler]> = [
                ['clarification', new ClarificationHandler(config.llmClient)],
                ['explanation', new ExplanationHandler(config.llmClient)],
                ['refinement', new RefinementHandler(config.llmClient)],
                ['positive_feedback', new FeedbackIntentHandler()],
                ['negative_feedback', new FeedbackIntentHandler()],
                ['partial_feedback', new FeedbackIntentHandler()],
            ];
            this.intentHandlers = new Map(handlers);

            // Initialize shared RefinementService
            const refinementService = new RefinementService(config.llmClient);

            // Initialize Phase 4: Agent-initiated clarification
            const uncertaintyDetector = new UncertaintyDetector();
            const questionGenerator = new QuestionGenerator();
            this.clarificationAgent = new ClarificationAgent(
                uncertaintyDetector,
                questionGenerator,
                refinementService
            );
        } else {
            this.intentHandlers = new Map();
        }
    }

    /**
     * Create a new conversation session
     */
    async createSession(
        rcaId?: string,
        context?: ConversationContext
    ): Promise<ConversationSession> {
        try {
            const session: ConversationSession = {
                id: uuidv4(),
                rcaId,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active',
                messages: [],
                metadata: {
                    messageCount: 0,
                    confidenceEvolution: [],
                    refinementCount: 0,
                    viewsVisited: context ? [context.viewType] : [],
                },
            };

            // Add system message
            const systemMessage: ConversationMessage = {
                id: uuidv4(),
                sessionId: session.id,
                role: 'system',
                content: 'Conversation started. I\'m here to help you understand and fix errors in your codebase.',
                timestamp: new Date(),
                status: 'sent',
                metadata: { context },
            };

            session.messages.push(systemMessage);
            await this.memory.addMessage(systemMessage);

            // Save to store
            await this.store.saveSession(session);
            await this.store.saveMessage(systemMessage);

            // Track active session
            this.activeSessions.set(session.id, session);

            logger.info(`Created conversation session: ${session.id}`);
            return session;
        } catch (error) {
            logger.error('Failed to create conversation session:', error);
            throw error;
        }
    }

    /**
     * Continue an existing conversation
     */
    async continueConversation(
        sessionId: string,
        content: string,
        context?: ConversationContext
    ): Promise<ConversationMessage> {
        try {
            // Load or get session
            let session = this.activeSessions.get(sessionId);
            if (!session) {
                session = await this.store.loadSession(sessionId) ?? undefined;
                if (!session) {
                    throw new Error(`Session not found: ${sessionId}`);
                }
                this.activeSessions.set(sessionId, session);
            }

            // Create user message
            const userMessage: ConversationMessage = {
                id: uuidv4(),
                sessionId,
                role: 'user',
                content,
                timestamp: new Date(),
                status: 'sent',
                metadata: { context },
            };

            // Add to session and memory
            session.messages.push(userMessage);
            session.metadata.messageCount++;
            session.updatedAt = new Date();

            // Track view if context provided
            if (context && !session.metadata.viewsVisited.includes(context.viewType)) {
                session.metadata.viewsVisited.push(context.viewType);
            }

            await this.memory.addMessage(userMessage);
            await this.store.saveMessage(userMessage);
            await this.store.saveSession(session);

            logger.info(`User message added to session ${sessionId}: ${userMessage.id}`);

            // Generate assistant response
            const assistantMessage = await this.generateResponse(session, userMessage, context);

            // Add assistant message
            session.messages.push(assistantMessage);
            session.metadata.messageCount++;
            session.updatedAt = new Date();

            await this.memory.addMessage(assistantMessage);
            await this.store.saveMessage(assistantMessage);
            await this.store.saveSession(session);

            logger.info(`Assistant message added to session ${sessionId}: ${assistantMessage.id}`);

            return assistantMessage;
        } catch (error) {
            logger.error(`Failed to continue conversation ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Generate assistant response using intent classification and routing
     */
    private async generateResponse(
        session: ConversationSession,
        userMessage: ConversationMessage,
        context?: ConversationContext
    ): Promise<ConversationMessage> {
        const startTime = Date.now();

        try {
            // Phase 2: Intent-based routing
            if (this.intentClassifier && context) {
                // Get recent conversation history for context
                const recentMessages = await this.memory.getRecentMessages(session.id, 5);

                // Classify intent
                const classification = await this.intentClassifier.classify(
                    userMessage.content,
                    context,
                    recentMessages
                );

                logger.debug(`Classified intent: ${classification.intent} (confidence: ${classification.confidence})`);

                // Update message metadata with classification
                userMessage.metadata = {
                    ...userMessage.metadata,
                    intent: classification.intent
                };

                // Route to appropriate handler
                const handler = this.intentHandlers.get(classification.intent);

                if (handler) {
                    // Get current analysis if available (for refinement)
                    const currentAnalysis = undefined;
                    if (context.activeRcaId) {
                        // TODO: Fetch actual analysis from analysis store
                        // For now, handlers can work without it
                    }

                    const response = await handler.handle(
                        userMessage,
                        context,
                        classification,
                        recentMessages,
                        currentAnalysis
                    );
                    response.metadata = {
                        ...response.metadata,
                        processingTime: Date.now() - startTime
                    };
                    return response;
                }

                // Fallback to explanation handler if no specific handler
                const explanationHandler = this.intentHandlers.get('explanation');
                if (explanationHandler) {
                    const response = await explanationHandler.handle(
                        userMessage,
                        context,
                        classification,
                        recentMessages
                    );
                    response.metadata = {
                        ...response.metadata,
                        processingTime: Date.now() - startTime
                    };
                    return response;
                }
            }

            // Phase 1 fallback: Simple acknowledgment response
            let content = '';

            if (context?.viewType === 'analyze') {
                content = `I understand you're asking about the analysis. Let me help you with that. You said: "${userMessage.content}"`;
            } else if (context?.viewType === 'errors') {
                content = `I can help you with the error queue. Regarding your question: "${userMessage.content}"`;
            } else if (context?.viewType === 'dashboard') {
                content = `Looking at the dashboard overview. About your question: "${userMessage.content}"`;
            } else {
                content = `I'm here to help! You asked: "${userMessage.content}"`;
            }

            const assistantMessage: ConversationMessage = {
                id: uuidv4(),
                sessionId: session.id,
                role: 'assistant',
                content,
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    context,
                    confidence: 0.8,
                    processingTime: Date.now() - startTime,
                },
            };

            return assistantMessage;
        } catch (error) {
            logger.error('Failed to generate response:', error);

            // Return error message to user
            return {
                id: uuidv4(),
                sessionId: session.id,
                role: 'assistant',
                content: 'I apologize, but I encountered an error processing your request. Please try again.',
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    context,
                    processingTime: Date.now() - startTime,
                },
            };
        }
    }

    /**
     * Get conversation history
     */
    async getSessionHistory(sessionId: string): Promise<ConversationMessage[]> {
        try {
            // Try memory first
            const memoryMessages = await this.memory.getRecentMessages(sessionId);

            if (memoryMessages.length > 0) {
                return memoryMessages;
            }

            // Fall back to store
            const storeMessages = await this.store.getSessionMessages(sessionId);

            // Load into memory for future access
            for (const message of storeMessages) {
                await this.memory.addMessage(message);
            }

            return storeMessages;
        } catch (error) {
            logger.error(`Failed to get session history ${sessionId}:`, error);
            return [];
        }
    }

    /**
     * Get or create session for RCA
     */
    async getOrCreateSessionForRca(rcaId: string, context: ConversationContext): Promise<ConversationSession> {
        try {
            // Check for existing sessions
            const existingSessions = await this.store.getSessionsByRcaId(rcaId);

            // Find active session
            const activeSession = existingSessions.find((s: ConversationSession) => s.status === 'active');
            if (activeSession) {
                this.activeSessions.set(activeSession.id, activeSession);
                return activeSession;
            }

            // Create new session
            return await this.createSession(rcaId, context);
        } catch (error) {
            logger.error(`Failed to get or create session for RCA ${rcaId}:`, error);
            throw error;
        }
    }

    /**
     * Update session status
     */
    async updateSessionStatus(
        sessionId: string,
        status: 'active' | 'paused' | 'completed'
    ): Promise<void> {
        try {
            const session = this.activeSessions.get(sessionId) || await this.store.loadSession(sessionId);

            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }

            session.status = status;
            session.updatedAt = new Date();

            await this.store.saveSession(session);

            if (status === 'completed') {
                this.activeSessions.delete(sessionId);
            }

            logger.info(`Updated session ${sessionId} status to: ${status}`);
        } catch (error) {
            logger.error(`Failed to update session status ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Get active sessions
     */
    getActiveSessions(): ConversationSession[] {
        return Array.from(this.activeSessions.values());
    }

    /**
     * Route message based on intent (Phase 2: Implemented)
     */
    async routeMessage(
        message: ConversationMessage,
        context: ConversationContext
    ): Promise<ConversationMessage | null> {
        try {
            if (!this.intentClassifier) {
                logger.warn('Intent classifier not initialized');
                return null;
            }

            // Get recent conversation history
            const recentMessages = await this.memory.getRecentMessages(message.sessionId, 5);

            // Classify intent
            const classification = await this.intentClassifier.classify(
                message.content,
                context,
                recentMessages
            );

            // Get appropriate handler
            const handler = this.intentHandlers.get(classification.intent);

            if (!handler) {
                logger.warn(`No handler found for intent: ${classification.intent}`);
                return null;
            }

            // Get current analysis if available
            const currentAnalysis = undefined;
            if (context.activeRcaId) {
                // TODO: Fetch from analysis store
            }

            // Handle message
            return await handler.handle(
                message,
                context,
                classification,
                recentMessages,
                currentAnalysis
            );
        } catch (error) {
            logger.error('Failed to route message:', error);
            return null;
        }
    }

    /**
     * Clean up inactive sessions from memory
     */
    async cleanupInactiveSessions(maxAgeHours = 24): Promise<void> {
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;

        for (const [sessionId, session] of this.activeSessions.entries()) {
            const age = now - session.updatedAt.getTime();

            if (age > maxAge && session.status !== 'active') {
                this.activeSessions.delete(sessionId);
                await this.memory.clearSession(sessionId);
                logger.debug(`Cleaned up inactive session: ${sessionId}`);
            }
        }
    }

    // ========================================================================
    // Phase 4: Agent-Initiated Clarification Methods
    // ========================================================================

    /**
     * Check if agent should ask clarification questions for an analysis
     * @param sessionId Session to add questions to
     * @param analysis RCA to check for uncertainty
     * @param context Current conversation context
     * @returns Clarification result with questions (if needed)
     */
    async checkClarificationNeeds(
        sessionId: string,
        analysis: RootCauseAnalysis,
        context: ConversationContext
    ): Promise<ClarificationResult | null> {
        try {
            if (!this.clarificationAgent) {
                logger.warn('Clarification agent not initialized');
                return null;
            }

            const result = await this.clarificationAgent.analyzeClarificationNeeds(
                analysis,
                context
            );

            // If clarification needed, add agent message with questions
            if (result.needsClarification && result.questions.length > 0) {
                const session = this.activeSessions.get(sessionId) || await this.store.loadSession(sessionId);

                if (session) {
                    const agentMessage: ConversationMessage = {
                        id: uuidv4(),
                        sessionId,
                        role: 'assistant',
                        content: result.reason,
                        timestamp: new Date(),
                        status: 'sent',
                        metadata: {
                            intent: 'agent_clarification',
                            clarificationQuestions: result.questions,
                            context
                        }
                    };

                    session.messages.push(agentMessage);
                    session.metadata.messageCount++;
                    session.updatedAt = new Date();

                    await this.memory.addMessage(agentMessage);
                    await this.store.saveMessage(agentMessage);
                    await this.store.saveSession(session);

                    logger.info(`Agent asked ${result.questions.length} clarification questions in session ${sessionId}`);
                }
            }

            return result;
        } catch (error) {
            logger.error('Failed to check clarification needs:', error);
            return null;
        }
    }

    /**
     * Process user's answers to clarification questions
     * @param sessionId Session containing the clarification
     * @param answers User's answers to clarification questions
     * @param originalAnalysis Original RCA that needed clarification
     * @returns Refined analysis incorporating clarification
     */
    async processClarificationAnswers(
        sessionId: string,
        answers: ClarificationAnswer[],
        originalAnalysis: RootCauseAnalysis
    ): Promise<RootCauseAnalysis | null> {
        try {
            if (!this.clarificationAgent) {
                logger.warn('Clarification agent not initialized');
                return null;
            }

            // Get the last message with clarification questions
            const session = this.activeSessions.get(sessionId) || await this.store.loadSession(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }

            const lastAgentMessage = [...session.messages]
                .reverse()
                .find(m => m.role === 'assistant' && m.metadata?.clarificationQuestions);

            if (!lastAgentMessage || !lastAgentMessage.metadata?.clarificationQuestions) {
                throw new Error('No pending clarification questions found');
            }

            const questions = lastAgentMessage.metadata.clarificationQuestions;

            // Process answers and refine analysis
            const refinedAnalysis = await this.clarificationAgent.processClarificationAnswers(
                originalAnalysis,
                questions,
                answers
            );

            // Add user answer message
            const userAnswerMessage: ConversationMessage = {
                id: uuidv4(),
                sessionId,
                role: 'user',
                content: this.formatClarificationAnswers(questions, answers),
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    intent: 'clarification_answer',
                    clarificationAnswers: answers
                }
            };

            // Add refined analysis message
            const refinedMessage: ConversationMessage = {
                id: uuidv4(),
                sessionId,
                role: 'assistant',
                content: `Thank you for the clarification! I've refined my analysis with confidence now at ${refinedAnalysis.confidence}%.`,
                timestamp: new Date(),
                status: 'sent',
                metadata: {
                    intent: 'refined_analysis',
                    refinedAnalysis
                }
            };

            // Update session
            session.messages.push(userAnswerMessage, refinedMessage);
            session.metadata.messageCount += 2;
            session.metadata.refinementCount++;
            session.updatedAt = new Date();

            await this.memory.addMessage(userAnswerMessage);
            await this.memory.addMessage(refinedMessage);
            await this.store.saveMessage(userAnswerMessage);
            await this.store.saveMessage(refinedMessage);
            await this.store.saveSession(session);

            logger.info(`Processed clarification answers and refined analysis in session ${sessionId}`);

            return refinedAnalysis;
        } catch (error) {
            logger.error('Failed to process clarification answers:', error);
            return null;
        }
    }

    /**
     * Format clarification answers for display
     */
    private formatClarificationAnswers(
        questions: import('../types').ClarificationQuestion[],
        answers: ClarificationAnswer[]
    ): string {
        const formatted = questions.map((q, i) => {
            const answer = answers.find(a => a.questionId === q.questionId);
            const answerText = answer
                ? (Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer)
                : 'No answer';
            return `${i + 1}. ${q.prompt}\n   → ${answerText}`;
        });

        return `My answers:\n${formatted.join('\n')}`;
    }
}
