/**
 * ConversationContext - Global state management for conversations
 * Fix 5: Added chat history persistence and hydration with validation
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ConversationSession, ConversationMessage } from '../types/conversation';
import { useVSCode } from '../hooks/useVSCode';
import { z } from 'zod';

// Zod schema for validating persisted chat history
const MessageSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.string(),
    status: z.string().optional(),
    metadata: z.any().optional(),
});

const SessionSchema = z.object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    status: z.string(),
    messages: z.array(MessageSchema).optional(),
    metadata: z.any().optional(),
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

const STORAGE_KEY = 'rca-chat-history';

export function ConversationProvider({ children }: { children: ReactNode }) {
    const { postMessage } = useVSCode();
    const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate from workspace state on mount
    useEffect(() => {
        const hydrate = async () => {
            try {
                // Request persisted state from extension
                postMessage('getChatHistory', {});

                // Listen for response
                const handler = (event: MessageEvent) => {
                    const { command, data } = event.data;
                    if (command === 'chatHistoryData') {
                        if (data) {
                            try {
                                // Validate data with Zod
                                const validatedData = ChatHistorySchema.parse(data);

                                // Restore messages
                                const restoredMessages = validatedData.messages.map((msg) => ({
                                    ...msg,
                                    timestamp: new Date(msg.timestamp),
                                }));
                                setMessages(restoredMessages);

                                if (validatedData.session) {
                                    setCurrentSession(validatedData.session as ConversationSession);
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

                // Timeout after 2 seconds
                setTimeout(() => {
                    setIsHydrated(true);
                    window.removeEventListener('message', handler);
                }, 2000);
            } catch (error) {
                console.error('[ConversationContext] Failed to hydrate:', error);
                setIsHydrated(true);
            }
        };

        hydrate();
    }, [postMessage]);

    // Persist messages whenever they change
    useEffect(() => {
        if (isHydrated && messages.length > 0) {
            const persistData = {
                messages: messages.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                })),
                session: currentSession,
                lastUpdated: new Date().toISOString(),
            };
            postMessage('saveChatHistory', persistData);
        }
    }, [messages, currentSession, isHydrated, postMessage]);

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
