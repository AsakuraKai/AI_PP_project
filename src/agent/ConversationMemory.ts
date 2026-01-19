/**
 * ConversationMemory - Manage conversation context and memory
 * 
 * Responsibilities:
 * - Store last N messages (sliding window)
 * - Compress context for long conversations
 * - Retrieve relevant history
 * - Manage context window limits
 */

import { ConversationMessage, CompressedContext } from '../types';
import { Logger } from '../utils/Logger';

const logger = new Logger('ConversationMemory');

export interface ConversationMemoryConfig {
    /** Maximum number of messages to keep in memory */
    maxMessages?: number;

    /** Maximum tokens for context window */
    maxTokens?: number;

    /** Whether to enable automatic compression */
    autoCompress?: boolean;

    /** Compression threshold (trigger compression after N messages) */
    compressionThreshold?: number;
}

export class ConversationMemory {
    private messages: Map<string, ConversationMessage[]>;
    private compressedContexts: Map<string, CompressedContext>;

    private readonly maxMessages: number;
    private readonly maxTokens: number;
    private readonly autoCompress: boolean;
    private readonly compressionThreshold: number;

    constructor(config: ConversationMemoryConfig = {}) {
        this.messages = new Map();
        this.compressedContexts = new Map();

        this.maxMessages = config.maxMessages || 50;
        this.maxTokens = config.maxTokens || 4000;
        this.autoCompress = config.autoCompress ?? true;
        this.compressionThreshold = config.compressionThreshold || 20;
    }

    /**
     * Add a message to memory
     */
    async addMessage(message: ConversationMessage): Promise<void> {
        try {
            const sessionId = message.sessionId;

            if (!this.messages.has(sessionId)) {
                this.messages.set(sessionId, []);
            }

            const sessionMessages = this.messages.get(sessionId)!;
            sessionMessages.push(message);

            // Trim if exceeds max messages
            if (sessionMessages.length > this.maxMessages) {
                const removed = sessionMessages.shift();
                logger.debug(`Trimmed oldest message from session ${sessionId}: ${removed?.id}`);
            }

            // Auto-compress if threshold reached
            if (this.autoCompress && sessionMessages.length >= this.compressionThreshold) {
                await this.compressContext(sessionId);
            }

            logger.debug(`Added message to memory: ${message.id} (session: ${sessionId})`);
        } catch (error) {
            logger.error(`Failed to add message to memory:`, error);
            throw error;
        }
    }

    /**
     * Get recent messages for a session
     */
    async getRecentMessages(sessionId: string, count?: number): Promise<ConversationMessage[]> {
        try {
            const sessionMessages = this.messages.get(sessionId) || [];
            const limit = count || this.maxMessages;

            // Return last N messages
            const recent = sessionMessages.slice(-limit);

            logger.debug(`Retrieved ${recent.length} recent messages for session ${sessionId}`);
            return recent;
        } catch (error) {
            logger.error(`Failed to get recent messages:`, error);
            return [];
        }
    }

    /**
     * Compress context for long conversations
     */
    async compressContext(sessionId: string): Promise<CompressedContext> {
        try {
            const sessionMessages = this.messages.get(sessionId) || [];

            if (sessionMessages.length === 0) {
                throw new Error(`No messages to compress for session ${sessionId}`);
            }

            // Simple compression: summarize older messages
            const messagesToCompress = sessionMessages.slice(0, -10); // Keep last 10 uncompressed

            // Extract key information
            const keyPoints: string[] = [];
            const decisions: string[] = [];

            for (const msg of messagesToCompress) {
                if (msg.role === 'assistant' && msg.metadata?.confidence && msg.metadata.confidence > 0.8) {
                    keyPoints.push(msg.content.substring(0, 200)); // First 200 chars of high-confidence responses
                }

                if (msg.content.toLowerCase().includes('fix') || msg.content.toLowerCase().includes('solution')) {
                    decisions.push(msg.content.substring(0, 150));
                }
            }

            const compressed: CompressedContext = {
                sessionId,
                summary: this.generateSummary(messagesToCompress),
                keyPoints: keyPoints.slice(0, 5), // Top 5 key points
                decisions: decisions.slice(0, 3), // Top 3 decisions
                compressedAt: new Date(),
                messageCount: messagesToCompress.length,
            };

            this.compressedContexts.set(sessionId, compressed);

            // Remove compressed messages from memory, keep recent ones
            this.messages.set(sessionId, sessionMessages.slice(-10));

            logger.info(`Compressed ${compressed.messageCount} messages for session ${sessionId}`);
            return compressed;
        } catch (error) {
            logger.error(`Failed to compress context for session ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Get compressed context if available
     */
    async getCompressedContext(sessionId: string): Promise<CompressedContext | null> {
        return this.compressedContexts.get(sessionId) || null;
    }

    /**
     * Get full context (compressed + recent messages)
     */
    async getFullContext(sessionId: string): Promise<{
        compressed: CompressedContext | null;
        recent: ConversationMessage[];
    }> {
        const compressed = await this.getCompressedContext(sessionId);
        const recent = await this.getRecentMessages(sessionId);

        return { compressed, recent };
    }

    /**
     * Clear memory for a session
     */
    async clearSession(sessionId: string): Promise<void> {
        this.messages.delete(sessionId);
        this.compressedContexts.delete(sessionId);
        logger.debug(`Cleared memory for session ${sessionId}`);
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats(): {
        totalSessions: number;
        totalMessages: number;
        compressedSessions: number;
        averageMessagesPerSession: number;
    } {
        let totalMessages = 0;
        for (const messages of this.messages.values()) {
            totalMessages += messages.length;
        }

        const totalSessions = this.messages.size;
        const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;

        return {
            totalSessions,
            totalMessages,
            compressedSessions: this.compressedContexts.size,
            averageMessagesPerSession,
        };
    }

    /**
     * Generate a summary from messages (simple implementation)
     */
    private generateSummary(messages: ConversationMessage[]): string {
        if (messages.length === 0) {
            return 'Empty conversation';
        }

        // Count message types
        const userMessages = messages.filter(m => m.role === 'user').length;
        const assistantMessages = messages.filter(m => m.role === 'assistant').length;

        // Get first and last topics
        const firstMessage = messages[0]?.content.substring(0, 100) || '';
        const lastMessage = messages[messages.length - 1]?.content.substring(0, 100) || '';

        return `Conversation with ${userMessages} user messages and ${assistantMessages} assistant responses. Started with: "${firstMessage}...". Latest: "${lastMessage}..."`;
    }

    /**
     * Estimate token count (rough approximation: 1 token ≈ 4 characters)
     */
    private estimateTokens(messages: ConversationMessage[]): number {
        const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
        return Math.ceil(totalChars / 4);
    }

    /**
     * Check if context is within token limit
     */
    isWithinTokenLimit(sessionId: string): boolean {
        const messages = this.messages.get(sessionId) || [];
        const tokens = this.estimateTokens(messages);
        return tokens <= this.maxTokens;
    }
}
