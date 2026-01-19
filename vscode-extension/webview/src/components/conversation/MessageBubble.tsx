/**
 * MessageBubble - Individual message display component
 * 
 * Phase 3: Enhanced with delta support for showing analysis changes
 * Phase 4: Enhanced with clarification prompt support
 * Phase 6: Added entrance animations and screen reader support
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { ConversationMessage, AnalysisDelta } from '../../types/conversation';
import { DeltaViewer } from './DeltaViewer';
import { ClarificationPrompt } from './ClarificationPrompt';

interface MessageBubbleProps {
    message: ConversationMessage;
    onClarificationSubmit?: (answers: any[]) => void;
    onClarificationSkip?: () => void;
}

export function MessageBubble({ message, onClarificationSubmit, onClarificationSkip }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    // Extract delta from metadata if this is a refinement message
    const delta = message.metadata?.delta as AnalysisDelta | undefined;

    // Extract clarification questions if this is an agent-initiated question
    const clarificationQuestions = message.metadata?.clarificationQuestions;
    const hasQuestions = clarificationQuestions && Array.isArray(clarificationQuestions) && clarificationQuestions.length > 0;

    // System messages (centered, subtle)
    if (isSystem) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center my-4"
            >
                <div
                    role="status"
                    aria-live="polite"
                    className="max-w-[80%] rounded-lg px-4 py-2 bg-zinc-800/50 text-zinc-400 text-sm text-center"
                >
                    {message.content}
                </div>
            </motion.div>
        );
    }

    // User and assistant messages
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div
                role="article"
                aria-label={`Message from ${isUser ? 'you' : 'RCA Agent'}`}
                className={`max-w-[80%] rounded-lg px-4 py-3 ${isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    }`}
            >
                {/* Screen reader only announcement */}
                <div className="sr-only">
                    {isUser ? 'You said:' : 'RCA Agent said:'}
                </div>

                {/* Message content with markdown support */}
                <div className="text-sm whitespace-pre-wrap break-words prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                        components={{
                            // Customize markdown rendering
                            p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
                            code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
                                const isInline = !className;
                                return isInline ? (
                                    <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">{children}</code>
                                ) : (
                                    <code className="block bg-zinc-900 p-2 rounded text-xs overflow-x-auto">{children}</code>
                                );
                            },
                            strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
                            ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                            ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                            li: ({ children }: { children?: React.ReactNode }) => <li className="mb-1">{children}</li>,
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                {/* Delta viewer for refinement messages */}
                {delta && (
                    <div className="mt-3">
                        <DeltaViewer delta={delta} />
                    </div>
                )}

                {/* Clarification prompt for agent-initiated questions */}
                {hasQuestions && onClarificationSubmit && onClarificationSkip && (
                    <div className="mt-3">
                        <ClarificationPrompt
                            questions={clarificationQuestions}
                            onSubmit={onClarificationSubmit}
                            onSkip={onClarificationSkip}
                        />
                    </div>
                )}

                {/* Message metadata */}
                <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    {/* Timestamp for screen readers */}
                    <time
                        dateTime={new Date(message.timestamp).toISOString()}
                        className="sr-only"
                    >
                        {new Date(message.timestamp).toLocaleString()}
                    </time>

                    <span aria-hidden="true">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>

                    {message.status === 'sending' && (
                        <span role="status" aria-live="polite">Sending...</span>
                    )}

                    {message.status === 'failed' && (
                        <span role="alert" className="text-red-400">Failed</span>
                    )}

                    {message.metadata?.confidence !== undefined && !isUser && (
                        <span aria-label={`Confidence: ${Math.round(message.metadata.confidence * 100)} percent`}>
                            {Math.round(message.metadata.confidence * 100)}% confidence
                        </span>
                    )}

                    {message.metadata?.intent && !isUser && (
                        <span className="capitalize">
                            {message.metadata.intent.replace('_', ' ')}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

