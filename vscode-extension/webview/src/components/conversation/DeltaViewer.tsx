/**
 * DeltaViewer - Shows comparison between analysis versions
 * 
 * Phase 3: Iterative Refinement
 * 
 * Displays:
 * - Root cause changes (before/after)
 * - Confidence changes with visual indicator
 * - File changes (added/removed/modified)
 * - Reasoning for changes
 */

import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, FileText, X, Plus, Edit } from 'lucide-react';
import type { AnalysisDelta } from '../../types/conversation';

interface DeltaViewerProps {
    delta: AnalysisDelta;
    className?: string;
}

export function DeltaViewer({ delta, className = '' }: DeltaViewerProps) {
    const { changes, confidenceChange, reasoning, filesChanged, rootCauseChanged } = delta;

    return (
        <div className={`rounded-lg bg-zinc-800/50 border border-zinc-700 p-4 ${className}`}>
            {/* Header with confidence badge */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-zinc-100">Analysis Updated</h4>
                <ConfidenceChangeBadge change={confidenceChange} />
            </div>

            {/* Root Cause Comparison */}
            {rootCauseChanged && (
                <div className="mb-4">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 block">
                        Root Cause
                    </label>
                    <div className="space-y-2">
                        {/* Before */}
                        <div className="flex items-start gap-2">
                            <span className="text-xs text-zinc-500 mt-1 flex-shrink-0">Before:</span>
                            <div className="flex-1 text-sm text-zinc-400 line-through">
                                {changes.before.rootCause}
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                            <ArrowRight className="w-4 h-4 text-zinc-600" />
                        </div>

                        {/* After */}
                        <div className="flex items-start gap-2">
                            <span className="text-xs text-zinc-500 mt-1 flex-shrink-0">After:</span>
                            <div className="flex-1 text-sm text-zinc-100 font-medium">
                                {changes.after.rootCause}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Changes */}
            {filesChanged.some(f => f.type !== 'unchanged') && (
                <div className="mb-4">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 block">
                        Affected Files
                    </label>
                    <div className="space-y-1">
                        {filesChanged.map((change, idx) => {
                            if (change.type === 'unchanged') return null;
                            return <FileChangeItem key={idx} change={change} />;
                        })}
                    </div>
                </div>
            )}

            {/* Confidence Comparison */}
            <div className="mb-4">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 block">
                    Confidence
                </label>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">
                        {changes.before.confidence}%
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                    <span className="text-sm text-zinc-100 font-semibold">
                        {changes.after.confidence}%
                    </span>
                    {Math.abs(confidenceChange) >= 5 && (
                        <span className={`text-xs ${confidenceChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ({confidenceChange > 0 ? '+' : ''}{confidenceChange}%)
                        </span>
                    )}
                </div>
            </div>

            {/* Reasoning */}
            <div className="pt-3 border-t border-zinc-700">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 block">
                    Why These Changes
                </label>
                <p className="text-sm text-zinc-300 leading-relaxed">{reasoning}</p>
            </div>
        </div>
    );
}

/**
 * Confidence change badge with icon
 */
function ConfidenceChangeBadge({ change }: { change: number }) {
    if (Math.abs(change) < 5) {
        return (
            <div className="px-2 py-1 rounded-md bg-zinc-700 text-zinc-400 text-xs font-medium">
                No significant change
            </div>
        );
    }

    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const bgColor = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
    const textColor = isPositive ? 'text-green-400' : 'text-red-400';
    const borderColor = isPositive ? 'border-green-500/20' : 'border-red-500/20';

    return (
        <div className={`px-2 py-1 rounded-md border ${bgColor} ${borderColor} flex items-center gap-1`}>
            <Icon className={`w-3 h-3 ${textColor}`} />
            <span className={`text-xs font-medium ${textColor}`}>
                {isPositive ? '+' : ''}{change}%
            </span>
        </div>
    );
}

/**
 * Individual file change item
 */
function FileChangeItem({ change }: { change: { type: string; filePath: string } }) {
    const getIcon = () => {
        switch (change.type) {
            case 'added':
                return <Plus className="w-3 h-3 text-green-400" />;
            case 'removed':
                return <X className="w-3 h-3 text-red-400" />;
            case 'modified':
                return <Edit className="w-3 h-3 text-blue-400" />;
            default:
                return <FileText className="w-3 h-3 text-zinc-400" />;
        }
    };

    const getColor = () => {
        switch (change.type) {
            case 'added':
                return 'text-green-400';
            case 'removed':
                return 'text-red-400';
            case 'modified':
                return 'text-blue-400';
            default:
                return 'text-zinc-400';
        }
    };

    const getLabel = () => {
        switch (change.type) {
            case 'added':
                return 'Added';
            case 'removed':
                return 'Removed';
            case 'modified':
                return 'Modified';
            default:
                return '';
        }
    };

    return (
        <div className="flex items-center gap-2 text-sm">
            {getIcon()}
            <span className="text-xs text-zinc-500 w-16">{getLabel()}</span>
            <code className={`text-xs ${getColor()}`}>{change.filePath}</code>
        </div>
    );
}
