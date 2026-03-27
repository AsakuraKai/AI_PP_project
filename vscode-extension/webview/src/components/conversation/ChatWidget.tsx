/**
 * ChatWidget - Floating chat widget with collapsed/expanded states
 * Phase 6: Added smooth animations and transitions
 * Fix 5: Added hydration indicator for restored chat history
 *
 * This is the SINGLE component instance that persists across all views.
 * It NEVER remounts during navigation.
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, Minimize2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationContext } from '../../types/conversation';
import { ConversationView } from './ConversationView';
import { ContextIndicator } from './ContextIndicator';
import { useConversationContext, HYDRATION_INDICATOR_DURATION_MS } from '../../contexts/ConversationContext';

interface ChatWidgetProps {
    context: ConversationContext;
    currentView: string;
}

export function ChatWidget({ context }: ChatWidgetProps) {
    // Initialize from localStorage
    const [isExpanded, setIsExpanded] = useState(() => {
        const saved = localStorage.getItem('chat-widget-expanded');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const { unreadCount, isHydrated, messages } = useConversationContext();
    const [showHydrationIndicator, setShowHydrationIndicator] = useState(false);

    // Show hydration indicator when history is restored
    useEffect(() => {
        if (isHydrated && messages.length > 0) {
            setShowHydrationIndicator(true);
            // Hide after configured duration
            const timer = setTimeout(() => {
                setShowHydrationIndicator(false);
            }, HYDRATION_INDICATOR_DURATION_MS);
            return () => clearTimeout(timer);
        }
    }, [isHydrated, messages.length]);

    // Save state when changed
    const toggleExpanded = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('chat-widget-expanded', JSON.stringify(newState));
    };

    // Global keyboard shortcut listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? e.metaKey : e.ctrlKey;

            // Cmd+Shift+C / Ctrl+Shift+C - Toggle chat widget
            if (modKey && e.shiftKey && e.key === 'c') {
                e.preventDefault();
                toggleExpanded();
            }

            // Escape - Close chat widget (if open)
            if (e.key === 'Escape' && isExpanded) {
                e.preventDefault();
                setIsExpanded(false);
                localStorage.setItem('chat-widget-expanded', 'false');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded]);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <AnimatePresence mode="wait">
                {!isExpanded ? (
                    /* Collapsed button */
                    <motion.button
                        key="collapsed"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={toggleExpanded}
                        className="relative h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-xl flex items-center justify-center group"
                        aria-label="Open chat assistant"
                        data-chat-widget="collapsed"
                        data-expanded="false"
                    >
                        <MessageCircle className="h-6 w-6 text-white" />

                        {/* Unread badge */}
                        <AnimatePresence>
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse"
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        {/* Tooltip */}
                        <span className="absolute bottom-full mb-2 right-0 px-2 py-1 bg-zinc-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            RCA Assistant (Ctrl+Shift+C)
                        </span>
                    </motion.button>
                ) : (
                    /* Expanded panel */
                    <motion.div
                        key="expanded"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
                        style={{ width: '400px', height: '600px' }}
                        data-chat-widget="expanded"
                        data-expanded="true"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                    <MessageCircle className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-zinc-100">RCA Assistant</h3>
                                    <p className="text-xs text-zinc-400">Always here to help</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleExpanded}
                                    className="h-8 w-8 rounded-md hover:bg-zinc-800 flex items-center justify-center transition-colors focus-visible-ring"
                                    aria-label="Minimize chat (Escape)"
                                >
                                    <Minimize2 className="h-4 w-4 text-zinc-400" />
                                </button>
                            </div>
                        </div>

                        {/* Context Indicator */}
                        <ContextIndicator context={context} />

                        {/* Hydration Indicator */}
                        <AnimatePresence>
                            {showHydrationIndicator && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20"
                                >
                                    <div className="flex items-center gap-2 text-xs text-blue-400">
                                        <History className="h-3 w-3" />
                                        <span>Chat history restored ({messages.length} messages)</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Chat Content */}
                        <div className="flex-1 overflow-hidden">
                            <ConversationView context={context} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
