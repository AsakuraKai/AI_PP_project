/**
 * useConversation - Main conversation state management hook
 */

import { useEffect, useCallback } from 'react';
import { ConversationMessage, ConversationContext } from '../types/conversation';
import { useVSCode } from './useVSCode';
import { useConversationContext } from '../contexts/ConversationContext';

export function useConversation(context: ConversationContext) {
    const { postMessage } = useVSCode();
    const {
        messages,
        isTyping,
        setIsTyping,
        currentSession,
        setCurrentSession,
        setMessages,
        addMessage,
        unreadCount,
        setUnreadCount,
    } = useConversationContext();

    // Initialize conversation session
    useEffect(() => {
        postMessage('conversation.start', { context });
    }, [context, postMessage]);

    // Listen for backend messages
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const { type, data } = event.data;

            switch (type) {
                case 'conversation.session':
                    setCurrentSession(data.session);
                    setMessages(data.session.messages || []);
                    break;

                case 'conversation.message': {
                    // Add new message
                    const newMessage: ConversationMessage = {
                        ...data,
                        timestamp: new Date(data.timestamp),
                    };
                    addMessage(newMessage);
                    setIsTyping(false);

                    // Increment unread count if assistant message
                    if (newMessage.role === 'assistant') {
                        setUnreadCount(unreadCount + 1);
                    }
                    break;
                }

                case 'conversation.typing':
                    setIsTyping(data.typing);
                    break;

                case 'conversation.history': {
                    const typedMessages = data.messages as Array<{
                        id: string;
                        sessionId: string;
                        role: 'user' | 'assistant' | 'system';
                        content: string;
                        timestamp: string;
                        [key: string]: unknown;
                    }>;
                    setMessages(typedMessages.map((msg) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    })));
                    break;
                }

                case 'conversation.error':
                    console.error('Conversation error:', data.error);
                    setIsTyping(false);
                    break;
            }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [setCurrentSession, setMessages, setIsTyping, setUnreadCount, addMessage, unreadCount]);

    // Send message
    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim()) return;

            const userMessage: ConversationMessage = {
                id: crypto.randomUUID(),
                sessionId: currentSession?.id || 'temp',
                role: 'user',
                content,
                timestamp: new Date(),
                status: 'sending',
            };

            addMessage(userMessage);
            setIsTyping(true);

            // Send to backend
            postMessage('conversation.send', {
                content,
                context,
                sessionId: currentSession?.id,
            });
        },
        [context, currentSession, postMessage, addMessage, setIsTyping]
    );

    return {
        messages,
        sendMessage,
        isTyping,
        session: currentSession,
    };
}
