/**
 * AnalysisResult Component - Reusable analysis results display
 * 
 * Shows:
 * - Root cause with confidence
 * - Hypothesis and reasoning
 * - Fix suggestions
 * - Feedback section
 * - Action buttons (export, reset)
 */

import { Download, Search, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FixSuggestion } from './FixSuggestion';

export interface AnalysisResultData {
    hypothesis: string;
    rootCause: string;
    confidence: number;
    fixes: Array<{
        id: string;
        filePath: string;
        description: string;
        diff: string;
        confidence: number;
    }>;
    reasoning: string[];
    duration: number;
    feedback?: {
        enabled: boolean;
        rcaId?: string;
        errorHash?: string;
    };
}

export interface FeedbackStatus {
    status: 'idle' | 'sending' | 'sent' | 'error';
    message?: string;
}

export interface AnalysisResultProps {
    result: AnalysisResultData;
    feedbackStatus: FeedbackStatus;
    onApplyFix: (fixId: string) => void;
    onRejectFix?: (fixId: string) => void;
    onExport: () => void;
    onReset: () => void;
    onSubmitFeedback: (type: 'positive' | 'negative') => void;
}

export function AnalysisResult({
    result,
    feedbackStatus,
    onApplyFix,
    onRejectFix,
    onExport,
    onReset,
    onSubmitFeedback
}: AnalysisResultProps) {
    return (
        <div className="space-y-6" role="region" aria-label="Analysis Results">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-zinc-200">Analysis Complete</h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={onExport}
                        className="gap-2 focus-ring"
                        aria-label="Export analysis results"
                    >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        <span>Export</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onReset}
                        className="gap-2 focus-ring"
                        aria-label="Clear analysis results"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                        <span>Clear</span>
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Root Cause */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="article" aria-labelledby="root-cause-title">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="shrink-0 mt-1" aria-hidden="true">
                            <Search className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 id="root-cause-title" className="text-xl font-medium text-zinc-200 mb-2">
                                Root Cause
                            </h3>
                            <p className="text-zinc-300 leading-relaxed">
                                {result.rootCause}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
                        <Badge variant="outline" className="text-purple-400" aria-label={`Confidence: ${Math.round(result.confidence * 100)} percent`}>
                            Confidence: {Math.round(result.confidence * 100)}%
                        </Badge>
                        {result.fixes.length > 0 && (
                            <Badge variant="outline" aria-label={`${result.fixes.length} fixes suggested`}>
                                {result.fixes.length} fixes suggested
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Feedback */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="region" aria-label="Feedback">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h3 className="text-lg font-medium text-zinc-200">Was this analysis helpful?</h3>
                            <p className="text-sm text-zinc-400">
                                Your feedback improves future suggestions.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="gap-2"
                                disabled={!result.feedback?.enabled || feedbackStatus.status === 'sending'}
                                onClick={() => onSubmitFeedback('positive')}
                                aria-label="Submit positive feedback"
                            >
                                <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                                Helpful
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2"
                                disabled={!result.feedback?.enabled || feedbackStatus.status === 'sending'}
                                onClick={() => onSubmitFeedback('negative')}
                                aria-label="Submit negative feedback"
                            >
                                <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                                Not helpful
                            </Button>
                        </div>
                    </div>

                    {!result.feedback?.enabled && (
                        <p className="text-xs text-zinc-500 mt-3">
                            Feedback is disabled because the analysis was not persisted (ChromaDB not available).
                        </p>
                    )}

                    {feedbackStatus.status === 'sent' && feedbackStatus.message && (
                        <p className="text-xs text-green-400 mt-3" role="status" aria-live="polite">
                            {feedbackStatus.message}
                        </p>
                    )}
                    {feedbackStatus.status === 'error' && feedbackStatus.message && (
                        <p className="text-xs text-red-400 mt-3" role="alert">
                            {feedbackStatus.message}
                        </p>
                    )}
                </div>

                {/* Hypothesis */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="article" aria-labelledby="hypothesis-title">
                    <h3 id="hypothesis-title" className="text-lg font-medium text-zinc-200 mb-3">Hypothesis</h3>
                    <p className="text-zinc-300 leading-relaxed">{result.hypothesis}</p>
                </div>

                {/* Reasoning Steps */}
                {result.reasoning.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="article" aria-labelledby="reasoning-title">
                        <h3 id="reasoning-title" className="text-lg font-medium text-zinc-200 mb-4">
                            Reasoning Steps
                        </h3>
                        <ol className="space-y-3" aria-label="Analysis reasoning steps">
                            {result.reasoning.map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium" aria-hidden="true">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-zinc-300 leading-relaxed">
                                        {step}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Fix Suggestions */}
                {result.fixes.length > 0 && (
                    <div className="space-y-4" role="region" aria-labelledby="fixes-title">
                        <h3 id="fixes-title" className="text-lg font-medium text-zinc-200">
                            Suggested Fixes
                        </h3>
                        {result.fixes.map((fix) => (
                            <FixSuggestion
                                key={fix.id}
                                fix={fix}
                                onApply={onApplyFix}
                                onReject={onRejectFix}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
