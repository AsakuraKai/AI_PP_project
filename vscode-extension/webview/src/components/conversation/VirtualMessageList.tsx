/**
 * VirtualMessageList - Performance-optimized message list with virtual scrolling
 * Phase 6: UI Polish & Accessibility
 * 
 * Uses @tanstack/react-virtual for efficient rendering of long message lists
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ConversationMessage } from '../../types/conversation';
import { MessageBubble } from './MessageBubble';

interface VirtualMessageListProps {
    messages: ConversationMessage[];
    onClarificationSubmit?: (answers: any[]) => void;
    onClarificationSkip?: () => void;
}

export function VirtualMessageList({
    messages,
    onClarificationSubmit,
    onClarificationSkip
}: VirtualMessageListProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100, // Estimated message height in pixels
        overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
    });

    return (
        <div
            ref={parentRef}
            className="h-full overflow-y-auto p-4"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const message = messages[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                        >
                            <MessageBubble
                                message={message}
                                onClarificationSubmit={onClarificationSubmit}
                                onClarificationSkip={onClarificationSkip}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
