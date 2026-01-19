/**
 * ConversationStore - Persist conversations to database
 * 
 * Phase 1: In-memory storage for rapid development
 * Phase 2+: Will migrate to ChromaDB for persistence
 */

import { ConversationSession, ConversationMessage } from '../types';
import { Logger } from '../utils/Logger';

const logger = new Logger('ConversationStore');

export class ConversationStore {
  private sessions: Map<string, ConversationSession> = new Map();
  private messages: Map<string, ConversationMessage[]> = new Map();

  constructor() {
    // Phase 1: In-memory storage
    // Phase 2+: Will integrate with ChromaDB
  }

  /**
   * Initialize conversation store
   */
  async initialize(): Promise<void> {
    logger.info('ConversationStore initialized (in-memory mode)');
  }

  /**
   * Save a conversation session
   */
  async saveSession(session: ConversationSession): Promise<void> {
    this.sessions.set(session.id, JSON.parse(JSON.stringify(session)));
    logger.debug(`Saved conversation session: ${session.id}`);
  }

  /**
   * Load a conversation session
   */
  async loadSession(sessionId: string): Promise<ConversationSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const cloned = JSON.parse(JSON.stringify(session));
    cloned.createdAt = new Date(cloned.createdAt);
    cloned.updatedAt = new Date(cloned.updatedAt);
    cloned.messages.forEach((msg: ConversationMessage) => {
      msg.timestamp = new Date(msg.timestamp);
    });

    logger.debug(`Loaded conversation session: ${sessionId}`);
    return cloned;
  }

  /**
   * Save a message
   */
  async saveMessage(message: ConversationMessage): Promise<void> {
    if (!this.messages.has(message.sessionId)) {
      this.messages.set(message.sessionId, []);
    }
    this.messages.get(message.sessionId)!.push(JSON.parse(JSON.stringify(message)));
    logger.debug(`Saved message: ${message.id}`);
  }

  /**
   * Get all messages for a session
   */
  async getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
    const messages = this.messages.get(sessionId) || [];
    const cloned = JSON.parse(JSON.stringify(messages));
    cloned.forEach((msg: ConversationMessage) => {
      msg.timestamp = new Date(msg.timestamp);
    });
    logger.debug(`Retrieved ${cloned.length} messages for session ${sessionId}`);
    return cloned;
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string, limit = 10): Promise<ConversationSession[]> {
    const allSessions = Array.from(this.sessions.values());
    const lowerQuery = query.toLowerCase();
    const matched = allSessions.filter(session => {
      const sessionJson = JSON.stringify(session).toLowerCase();
      return sessionJson.includes(lowerQuery);
    }).slice(0, limit);
    logger.debug(`Found ${matched.length} conversations matching query`);
    return matched.map(s => JSON.parse(JSON.stringify(s)));
  }

  /**
   * Get sessions by RCA ID
   */
  async getSessionsByRcaId(rcaId: string): Promise<ConversationSession[]> {
    const allSessions = Array.from(this.sessions.values());
    const matched = allSessions.filter(s => s.rcaId === rcaId);
    logger.debug(`Found ${matched.length} sessions for RCA ${rcaId}`);
    return matched.map(s => JSON.parse(JSON.stringify(s)));
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.messages.delete(sessionId);
    logger.debug(`Deleted session: ${sessionId}`);
  }

  /**
   * Get recent sessions
   */
  async getRecentSessions(limit = 10): Promise<ConversationSession[]> {
    const allSessions = Array.from(this.sessions.values());
    const sorted = allSessions.sort((a, b) =>
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    return sorted.slice(0, limit).map(s => JSON.parse(JSON.stringify(s)));
  }
}
