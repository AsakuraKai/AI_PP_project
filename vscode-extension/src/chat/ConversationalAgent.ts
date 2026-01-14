/**
 * Conversational Agent - Maintains multi-turn conversations with context
 * 
 * Enables interactive debugging through conversational AI:
 * - Maintains chat history for context-aware responses
 * - Handles follow-up questions intelligently
 * - Supports guided debugging workflows
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 4: Real-World Testing - Week 3-4
 * @feature Interactive Debugging
 */

import * as vscode from 'vscode';
import { AnalysisService } from '../services/AnalysisService';
import { ChatPromptEngine } from './ChatPromptEngine';
import { OllamaClient } from '../../../src/llm/OllamaClient';

/**
 * Represents a single message in the conversation
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    errorContext?: any;
    fixApplied?: boolean;
    filesReferenced?: string[];
  };
}

/**
 * Represents a conversation session
 */
export interface ConversationSession {
  id: string;
  startTime: number;
  messages: ChatMessage[];
  context: ConversationContext;
  lastUpdated: number;
}

/**
 * Context maintained throughout the conversation
 */
export interface ConversationContext {
  // Current error being discussed
  currentError?: {
    message: string;
    file: string;
    line: number;
  };

  // Files the conversation is about
  relevantFiles: string[];

  // Whether a fix has been suggested/applied
  fixStatus?: {
    suggested: boolean;
    applied: boolean;
    fixDescription?: string;
  };

  // User's stated preferences during conversation
  userPreferences?: {
    explanationLevel?: 'beginner' | 'intermediate' | 'expert';
    preferredApproach?: string;
  };
}

/**
 * ConversationalAgent - Manages multi-turn conversations with memory
 * 
 * Key Features:
 * 1. Chat History: Remembers previous messages for context
 * 2. Smart Context: Tracks what's being discussed (errors, files, fixes)
 * 3. Follow-up Handling: Understands references to previous discussion
 * 4. Session Management: Separate conversations for different errors
 */
export class ConversationalAgent {
  private sessions: Map<string, ConversationSession> = new Map();
  private currentSessionId: string | null = null;
  private analysisService: AnalysisService;
  private promptEngine: ChatPromptEngine;
  private context: vscode.ExtensionContext;
  private llmClient?: OllamaClient;
  private readonly maxHistoryLength = 20; // Keep last 20 messages

  constructor(analysisService?: AnalysisService, context?: vscode.ExtensionContext) {
    this.analysisService = analysisService || AnalysisService.getInstance();
    this.promptEngine = new ChatPromptEngine();
    this.context = context!; // Will be set if provided
    this.initializeLLM();
  }

  /**
   * Initialize Ollama LLM client for conversational responses
   */
  private async initializeLLM(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('rcaAgent');
      const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
      const model = config.get<string>('model', 'deepseek-r1');

      this.llmClient = new OllamaClient({ baseUrl: ollamaUrl, model });
      console.log('[ConversationalAgent] LLM client initialized');
    } catch (error) {
      console.error('[ConversationalAgent] Failed to initialize LLM:', error);
    }
  }

  /**
   * Start a new conversation session
   */
  startNewSession(context?: Partial<ConversationContext>): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: ConversationSession = {
      id: sessionId,
      startTime: Date.now(),
      messages: [],
      context: {
        relevantFiles: [],
        ...context
      },
      lastUpdated: Date.now()
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    return sessionId;
  }

  /**
   * Resume an existing conversation session
   */
  resumeSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
      return true;
    }
    return false;
  }

  /**
   * Get current active session
   */
  getCurrentSession(): ConversationSession | null {
    if (!this.currentSessionId) return null;
    return this.sessions.get(this.currentSessionId) || null;
  }

  /**
   * Main chat method - handles user messages and generates responses
   * 
   * @param message - User's message
   * @param additionalContext - Any additional context from VS Code
   * @returns AI response
   */
  async chat(
    message: string,
    additionalContext?: any
  ): Promise<string> {
    // Get or create session
    let session = this.getCurrentSession();
    if (!session) {
      const sessionId = this.startNewSession();
      session = this.sessions.get(sessionId)!;
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    session.messages.push(userMessage);

    // Detect if this is a follow-up question
    const isFollowUp = this.isFollowUpQuestion(message, session);

    // Build context-aware prompt
    const prompt = this.buildContextualPrompt(
      message,
      session,
      isFollowUp,
      additionalContext
    );

    // Generate response using LLM with history
    const response = await this.generateResponse(prompt, session);

    // Add assistant response to history
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    };
    session.messages.push(assistantMessage);

    // Update session
    session.lastUpdated = Date.now();
    this.trimHistoryIfNeeded(session);

    return response;
  }

  /**
   * Detect if message is a follow-up question based on context
   */
  private isFollowUpQuestion(message: string, session: ConversationSession): boolean {
    const lowerMessage = message.toLowerCase();

    // Check for explicit follow-up indicators
    const followUpIndicators = [
      'why',
      'how',
      'what about',
      'can you explain',
      'show me',
      'what does',
      'more details',
      'elaborate',
      'that',
      'this',
      'it',
      'the error',
      'the fix'
    ];

    // Has indicators AND previous messages exist
    if (session.messages.length > 0) {
      return followUpIndicators.some(indicator => lowerMessage.includes(indicator));
    }

    return false;
  }

  /**
   * Build a context-aware prompt that includes conversation history
   */
  private buildContextualPrompt(
    currentMessage: string,
    session: ConversationSession,
    isFollowUp: boolean,
    additionalContext?: any
  ): string {
    let prompt = '';

    // System prompt
    prompt += this.getSystemPrompt(session.context);
    prompt += '\n\n';

    // Conversation history (last N messages for context)
    if (session.messages.length > 1) {
      prompt += '=== Conversation History ===\n';

      const recentMessages = session.messages.slice(-6); // Last 6 messages
      for (const msg of recentMessages) {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      }

      prompt += '\n';
    }

    // Current context
    if (session.context.currentError) {
      prompt += '=== Current Error Context ===\n';
      prompt += `File: ${session.context.currentError.file}\n`;
      prompt += `Line: ${session.context.currentError.line}\n`;
      prompt += `Error: ${session.context.currentError.message}\n\n`;
    }

    // Fix status
    if (session.context.fixStatus) {
      prompt += '=== Fix Status ===\n';
      prompt += `Fix Suggested: ${session.context.fixStatus.suggested}\n`;
      prompt += `Fix Applied: ${session.context.fixStatus.applied}\n`;
      if (session.context.fixStatus.fixDescription) {
        prompt += `Fix: ${session.context.fixStatus.fixDescription}\n`;
      }
      prompt += '\n';
    }

    // Current user message
    if (isFollowUp) {
      prompt += `=== Follow-up Question ===\n`;
      prompt += `The user is asking a follow-up question about the previous discussion.\n`;
      prompt += `Make sure your answer relates to the context above.\n\n`;
    }

    prompt += `USER: ${currentMessage}\n\n`;
    prompt += `ASSISTANT: `;

    return prompt;
  }

  /**
   * Get system prompt based on conversation context
   */
  private getSystemPrompt(context: ConversationContext): string {
    let prompt = `You are RCA Agent, an expert Android/Kotlin debugging assistant.
You are having a conversation with a developer to help them debug an error.

CONVERSATION GUIDELINES:
1. Remember the conversation history - refer to previous messages when relevant
2. For follow-up questions, build on your previous answers
3. Be conversational and natural - you're chatting, not just answering queries
4. Ask clarifying questions if needed
5. Suggest next steps based on conversation flow

RESPONSE STYLE:
- Friendly and supportive tone
- Clear and concise explanations
- Use markdown formatting (headings, code blocks, lists)
- Break down complex topics into simple steps`;

    // Add context-specific instructions
    if (context.userPreferences?.explanationLevel === 'beginner') {
      prompt += '\n\nUSER PREFERENCE: Explain in simple terms (beginner level)';
    } else if (context.userPreferences?.explanationLevel === 'expert') {
      prompt += '\n\nUSER PREFERENCE: Provide detailed technical information (expert level)';
    }

    if (context.fixStatus?.suggested && !context.fixStatus?.applied) {
      prompt += '\n\nNOTE: A fix has been suggested but not yet applied. User may be asking about the fix.';
    }

    return prompt;
  }

  /**
   * Generate response using LLM with full conversation context
   */
  private async generateResponse(
    prompt: string,
    session: ConversationSession
  ): Promise<string> {
    try {
      // TODO: Implement full conversational response generation
      // For now, return a placeholder response
      return 'Conversational response feature is under development. Please use the standard RCA analysis features.';
    } catch (error: any) {
      console.error('[ConversationalAgent] Error generating response:', error);
      return `I encountered an error processing your message: ${error.message}. Please try again.`;
    }
  }

  /**
   * Trim conversation history if it exceeds max length
   */
  private trimHistoryIfNeeded(session: ConversationSession): void {
    if (session.messages.length > this.maxHistoryLength) {
      // Keep only the most recent messages
      // Always keep the first message for context
      const firstMessage = session.messages[0];
      const recentMessages = session.messages.slice(-this.maxHistoryLength + 1);
      session.messages = [firstMessage, ...recentMessages];
    }
  }

  /**
   * Update conversation context (e.g., when error changes or fix is applied)
   */
  updateContext(updates: Partial<ConversationContext>): void {
    const session = this.getCurrentSession();
    if (session) {
      session.context = {
        ...session.context,
        ...updates
      };
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear old sessions (cleanup)
   */
  clearOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastUpdated > maxAgeMs) {
        this.sessions.delete(id);
      }
    }
  }

  /**
   * Export conversation to markdown for sharing/documentation
   */
  exportToMarkdown(sessionId?: string): string {
    const session = sessionId
      ? this.sessions.get(sessionId)
      : this.getCurrentSession();

    if (!session) {
      return '# No conversation found';
    }

    let markdown = `# RCA Agent Conversation\n\n`;
    markdown += `**Session ID:** ${session.id}\n`;
    markdown += `**Start Time:** ${new Date(session.startTime).toLocaleString()}\n`;
    markdown += `**Duration:** ${Math.round((session.lastUpdated - session.startTime) / 1000 / 60)} minutes\n\n`;

    if (session.context.currentError) {
      markdown += `## Context\n\n`;
      markdown += `**Error:** ${session.context.currentError.message}\n`;
      markdown += `**File:** ${session.context.currentError.file}:${session.context.currentError.line}\n\n`;
    }

    markdown += `## Conversation\n\n`;

    for (const message of session.messages) {
      if (message.role === 'user') {
        markdown += `### 👤 User\n\n`;
      } else {
        markdown += `### [AGENT] RCA Agent\n\n`;
      }

      markdown += `${message.content}\n\n`;
      markdown += `*${new Date(message.timestamp).toLocaleTimeString()}*\n\n`;
      markdown += `---\n\n`;
    }

    return markdown;
  }

  /**
   * Load sessions from persisted storage (for persistence across restarts)
   */
  async loadSessions(sessionsData?: any): Promise<void> {
    // If no data provided, load from context storage
    if (!sessionsData && this.context) {
      sessionsData = this.context.globalState.get('conversationSessions', []);
    }

    if (!Array.isArray(sessionsData)) {
      return;
    }

    for (const sessionData of sessionsData) {
      if (sessionData && sessionData.id) {
        this.sessions.set(sessionData.id, sessionData as ConversationSession);
      }
    }
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get all sessions (for persistence)
   */
  getSessions(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
    this.currentSessionId = null;
  }
}
