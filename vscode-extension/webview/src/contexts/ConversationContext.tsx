/**
 * ConversationContext - Global state management for conversations
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConversationSession, ConversationMessage } from '../types/conversation';

interface ConversationContextValue {
    currentSession: ConversationSession | null;
    messages: ConversationMessage[];
    isTyping: boolean;
    unreadCount: number;

    setCurrentSession: (session: ConversationSession | null) => void;
    addMessage: (message: ConversationMessage) => void;
    setMessages: (messages: ConversationMessage[]) => void;
    setIsTyping: (typing: boolean) => void;
    setUnreadCount: (count: number) => void;
    clearUnreadCount: () => void;
}

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

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
