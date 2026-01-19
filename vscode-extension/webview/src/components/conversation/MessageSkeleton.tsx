/**
 * MessageSkeleton - Loading placeholder for messages
 * Phase 6: UI Polish & Accessibility
 * 
 * Displays a skeleton loader while messages are being fetched or loaded
 */

import React from 'react';

interface MessageSkeletonProps {
    count?: number;
    isUser?: boolean;
}

/**
 * Single message skeleton
 */
function SingleMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${isUser ? 'bg-blue-600/20' : 'bg-zinc-800/50 border border-zinc-700/50'
                    }`}
                role="status"
                aria-label="Loading message"
            >
                <div className="animate-shimmer space-y-2">
                    {/* Message content lines */}
                    <div className="h-4 bg-zinc-700/50 rounded w-3/4" />
                    <div className="h-4 bg-zinc-700/50 rounded w-1/2" />

                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-3 bg-zinc-700/50 rounded w-16" />
                    </div>
                </div>
                <span className="sr-only">Loading message...</span>
            </div>
        </div>
    );
}

/**
 * Multiple message skeletons
 */
export function MessageSkeleton({ count = 3, isUser = false }: MessageSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <SingleMessageSkeleton key={index} isUser={isUser && index % 2 === 0} />
            ))}
        </>
    );
}

/**
 * Compact skeleton for typing indicator
 */
export function TypingMessageSkeleton() {
    return (
        <div className="flex justify-start mb-4">
            <div
                className="rounded-lg px-4 py-3 bg-zinc-800/50 border border-zinc-700/50"
                role="status"
                aria-label="Agent is typing"
            >
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="sr-only">RCA Agent is typing...</span>
            </div>
        </div>
    );
}
