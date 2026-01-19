/**
 * ConversationView - Main chat interface with message list and input
 * Phase 6: Enhanced with ARIA labels and accessibility features
 */

import React, { useEffect, useRef } from 'react';
import { ConversationContext } from '../../types/conversation';
import { useConversation } from '../../hooks/useConversation';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedActions } from './SuggestedActions';
import { useConversationContext } from '../../contexts/ConversationContext';

interface ConversationViewProps {
    context: ConversationContext;
}

export function ConversationView({ context }: ConversationViewProps) {
    const { messages, sendMessage, isTyping } = useConversation(context);
    const { clearUnreadCount } = useConversationContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear unread count when view is visible
    useEffect(() => {
        clearUnreadCount();
    }, [clearUnreadCount]);

    // Empty state
    if (messages.length === 0) {
        return (
            <div
                className="flex flex-col h-full"
                role="region"
                aria-label="Conversation with RCA Agent"
            >
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center text-zinc-400" role="status">
                        <p className="text-sm mb-2">Yo!</p>
                        <p className="text-xs">Ask me if you need anything.</p>
                    </div>
                </div>
                <SuggestedActions
                    viewType={context.viewType}
                    onSelect={sendMessage}
                    disabled={isTyping}
                />
                <ChatInput onSend={sendMessage} disabled={isTyping} />
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full"
            role="region"
            aria-label="Conversation with RCA Agent"
        >
            {/* Message List */}
            <div
                ref={messagesContainerRef}
                role="log"
                aria-live="polite"
                aria-atomic="false"
                aria-relevant="additions"
                className="flex-1 overflow-y-auto p-4 space-y-1"
            >
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}
                {isTyping && (
                    <div role="status" aria-live="polite" aria-atomic="true">
                        <span className="sr-only">RCA Agent is typing</span>
                        <TypingIndicator />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Actions */}
            <SuggestedActions
                viewType={context.viewType}
                onSelect={sendMessage}
                disabled={isTyping}
            />

            {/* Input Area */}
            <ChatInput onSend={sendMessage} disabled={isTyping} />
        </div>
    );
}
