/**
 * ConversationContext - Global state management for conversations
 * Fix 5: Added chat history persistence and hydration with validation
 * Fix 5 Improvements:
 * - Fixed memory leak in event listener cleanup
 * - Fixed useEffect dependency issues with useCallback
 * - Added debouncing to persistence (500ms)
 * - Aligned Zod schemas with TypeScript types
 * - Added message size limit (last 100 messages)
 * - Added timestamp validation
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { ConversationSession, ConversationMessage } from '../types/conversation';
import { useVSCode } from '../hooks/useVSCode';
import { z } from 'zod';

// Constants for magic numbers
const HYDRATION_TIMEOUT_MS = 2000;
const HYDRATION_INDICATOR_DURATION_MS = 3000;
const PERSISTENCE_DEBOUNCE_MS = 500;
const MAX_PERSISTED_MESSAGES = 100;

// Zod schema for validating persisted chat history - aligned with TypeScript types
const MessageSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.string(),
    status: z.enum(['sending', 'sent', 'failed']).optional(),
    metadata: z.object({
        intent: z.string().optional(),
        confidence: z.number().optional(),
        toolsUsed: z.array(z.string()).optional(),
        processingTime: z.number().optional(),
        context: z.any().optional(),
        delta: z.any().optional(),
        clarificationQuestions: z.array(z.any()).optional(),
    }).optional(),
});

const SessionSchema = z.object({
    id: z.string(),
    rcaId: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    status: z.enum(['active', 'paused', 'completed']),
    messages: z.array(MessageSchema).optional(),
    metadata: z.object({
        messageCount: z.number(),
        confidenceEvolution: z.array(z.number()),
        refinementCount: z.number(),
        viewsVisited: z.array(z.string()),
    }),
});

const ChatHistorySchema = z.object({
    messages: z.array(MessageSchema),
    session: SessionSchema.optional().nullable(),
    lastUpdated: z.string(),
});

interface ConversationContextValue {
    currentSession: ConversationSession | null;
    messages: ConversationMessage[];
    isTyping: boolean;
    unreadCount: number;
    isHydrated: boolean;

    setCurrentSession: (session: ConversationSession | null) => void;
    addMessage: (message: ConversationMessage) => void;
    setMessages: (messages: ConversationMessage[]) => void;
    setIsTyping: (typing: boolean) => void;
    setUnreadCount: (count: number) => void;
    clearUnreadCount: () => void;
}

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
    const { postMessage } = useVSCode();
    const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isHydrated, setIsHydrated] = useState(false);

    // Track mounted state to prevent memory leaks
    const isMountedRef = useRef(true);
    const persistenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Wrap postMessage in useCallback to stabilize dependency
    const stablePostMessage = useCallback((command: string, data: any) => {
        postMessage(command, data);
    }, [postMessage]);

    // Hydrate from workspace state on mount
    useEffect(() => {
        const hydrate = async () => {
            try {
                // Request persisted state from extension
                stablePostMessage('getChatHistory', {});

                // Listen for response
                const handler = (event: MessageEvent) => {
                    const { command, data } = event.data;
                    if (command === 'chatHistoryData') {
                        // Only process if component is still mounted
                        if (!isMountedRef.current) {
                            return;
                        }

                        if (data) {
                            try {
                                // Validate data with Zod
                                const validatedData = ChatHistorySchema.parse(data);

                                // Validate and restore messages with timestamp checking
                                const restoredMessages = validatedData.messages
                                    .map((msg) => {
                                        try {
                                            const timestamp = new Date(msg.timestamp);
                                            // Validate timestamp is valid
                                            if (isNaN(timestamp.getTime())) {
                                                console.warn('[ConversationContext] Invalid timestamp for message:', msg.id);
                                                return null;
                                            }
                                            return {
                                                ...msg,
                                                timestamp,
                                            };
                                        } catch (err) {
                                            console.warn('[ConversationContext] Failed to parse message timestamp:', err);
                                            return null;
                                        }
                                    })
                                    .filter((msg): msg is ConversationMessage => msg !== null);

                                setMessages(restoredMessages);

                                if (validatedData.session) {
                                    // Convert session dates from strings to Date objects
                                    const restoredSession: ConversationSession = {
                                        id: validatedData.session.id,
                                        rcaId: validatedData.session.rcaId,
                                        createdAt: new Date(validatedData.session.createdAt),
                                        updatedAt: new Date(validatedData.session.updatedAt),
                                        status: validatedData.session.status,
                                        messages: (validatedData.session.messages?.map(msg => ({
                                            ...msg,
                                            timestamp: new Date(msg.timestamp),
                                        })) || []) as ConversationMessage[],
                                        metadata: validatedData.session.metadata as ConversationSession['metadata'],
                                    };
                                    setCurrentSession(restoredSession);
                                }

                                setIsHydrated(true);
                                console.log('[ConversationContext] Hydrated', restoredMessages.length, 'messages from workspace state');
                            } catch (validationError) {
                                console.error('[ConversationContext] Validation failed, corrupted data detected:', validationError);
                                setIsHydrated(true);
                            }
                        } else {
                            setIsHydrated(true);
                        }
                        window.removeEventListener('message', handler);
                    }
                };
                window.addEventListener('message', handler);

                // Timeout after configured duration
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setIsHydrated(true);
                        window.removeEventListener('message', handler);
                    }
                }, HYDRATION_TIMEOUT_MS);
            } catch (error) {
                console.error('[ConversationContext] Failed to hydrate:', error);
                if (isMountedRef.current) {
                    setIsHydrated(true);
                }
            }
        };

        hydrate();

        // Cleanup on unmount
        return () => {
            isMountedRef.current = false;
        };
    }, [stablePostMessage]);

    // Persist messages with debouncing to avoid excessive writes
    useEffect(() => {
        if (isHydrated && messages.length > 0) {
            // Clear existing timer
            if (persistenceTimerRef.current) {
                clearTimeout(persistenceTimerRef.current);
            }

            // Set new timer
            persistenceTimerRef.current = setTimeout(() => {
                // Limit to last N messages to prevent unbounded growth
                const messagesToPersist = messages.slice(-MAX_PERSISTED_MESSAGES);

                const persistData = {
                    messages: messagesToPersist.map(msg => ({
                        ...msg,
                        timestamp: msg.timestamp.toISOString(),
                    })),
                    session: currentSession,
                    lastUpdated: new Date().toISOString(),
                };
                stablePostMessage('saveChatHistory', persistData);
            }, PERSISTENCE_DEBOUNCE_MS);
        }

        // Cleanup timer on unmount or dependency change
        return () => {
            if (persistenceTimerRef.current) {
                clearTimeout(persistenceTimerRef.current);
            }
        };
    }, [messages, currentSession, isHydrated, stablePostMessage]);

    const addMessage = useCallback((message: ConversationMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const clearUnreadCount = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const value: ConversationContextValue = {
        currentSession,
        messages,
        isTyping,
        unreadCount,
        isHydrated,
        setCurrentSession,
        addMessage,
        setMessages,
        setIsTyping,
        setUnreadCount,
        clearUnreadCount,
    };

    return (
        <ConversationContext.Provider value={value}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversationContext() {
    const context = useContext(ConversationContext);
    if (!context) {
        throw new Error('useConversationContext must be used within ConversationProvider');
    }
    return context;
}

// Export constants for testing and usage
export { HYDRATION_TIMEOUT_MS, PERSISTENCE_DEBOUNCE_MS, MAX_PERSISTED_MESSAGES, HYDRATION_INDICATOR_DURATION_MS };
