/**
 * TypingIndicator - Shows when assistant is typing
 */

import React from 'react';

export function TypingIndicator() {
    return (
        <div className="flex justify-start mb-4">
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-zinc-800 text-zinc-100 border border-zinc-700">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-zinc-400">Assistant is typing</span>
                </div>
            </div>
        </div>
    );
}
