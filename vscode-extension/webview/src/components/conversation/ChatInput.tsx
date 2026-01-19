/**
 * ChatInput - Auto-resize textarea with send button
 * Phase 6: Enhanced with keyboard navigation and accessibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    // Load draft from localStorage
    useEffect(() => {
        const draft = localStorage.getItem('chat-draft');
        if (draft) {
            setInput(draft);
        }
    }, []);

    // Save draft to localStorage (debounced via direct implementation)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (input) {
                localStorage.setItem('chat-draft', input);
            } else {
                localStorage.removeItem('chat-draft');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [input]);

    const handleSend = () => {
        if (!input.trim() || disabled) return;
        onSend(input);
        setInput('');
        localStorage.removeItem('chat-draft');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter to send (Shift+Enter for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }

        // Escape to clear
        if (e.key === 'Escape') {
            e.preventDefault();
            setInput('');
            localStorage.removeItem('chat-draft');
        }

        // Cmd+K or Ctrl+K to focus (already focused, but handle for consistency)
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modKey = isMac ? e.metaKey : e.ctrlKey;
        if (modKey && e.key === 'k') {
            e.preventDefault();
            textareaRef.current?.focus();
        }
    };

    return (
        <div className="p-3 border-t border-zinc-800 bg-zinc-900">
            <div className="flex gap-2 items-end">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question... (Shift+Enter for new line)"
                    disabled={disabled}
                    aria-label="Message input"
                    aria-describedby="input-hint"
                    className="flex-1 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-10 max-h-30 focus-visible-ring"
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || disabled}
                    aria-label="Send message"
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors focus-visible-ring"
                >
                    <Send className="h-4 w-4 text-white" />
                </button>
            </div>
            <p id="input-hint" className="text-xs text-zinc-500 mt-2">
                Press Enter to send, Shift+Enter for new line, Escape to clear
            </p>
        </div>
    );
}
