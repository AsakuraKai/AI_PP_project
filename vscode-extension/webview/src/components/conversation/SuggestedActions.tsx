/**
 * SuggestedActions - View-specific quick reply buttons
 * 
 * Displays context-aware suggested prompts based on current view.
 */

import React from 'react';
import { ViewType } from '../../types/conversation';
import { Sparkles } from 'lucide-react';

interface SuggestedActionsProps {
    viewType: ViewType;
    onSelect: (action: string) => void;
    disabled?: boolean;
}

export function SuggestedActions({ viewType, onSelect, disabled }: SuggestedActionsProps) {
    const suggestions = getSuggestionsForView(viewType);

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3 w-3 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-medium">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(suggestion)}
                        disabled={disabled}
                        className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:cursor-not-allowed text-zinc-200 rounded-full transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * Get view-specific suggested actions
 */
function getSuggestionsForView(viewType: ViewType): string[] {
    const suggestions: Record<ViewType, string[]> = {
        dashboard: [
            "What errors need attention?",
            "Show today's summary",
            "How is performance?"
        ],
        errors: [
            "Which error should I fix first?",
            "Group similar errors",
            "Analyze selected errors"
        ],
        analyze: [
            "Why this file?",
            "Explain the fix",
            "Show alternatives"
        ],
        history: [
            "Compare with previous analysis",
            "Why did confidence change?",
            "Show similar past errors"
        ],
        agent: [
            "Explain your reasoning",
            "Why this tool?",
            "What's the hypothesis?"
        ],
        fixes: [
            "Will this break anything?",
            "Explain these changes",
            "Show similar fixes"
        ],
        metrics: [
            "Why did success rate change?",
            "Explain this trend",
            "Compare with last week"
        ]
    };

    return suggestions[viewType] || [];
}
