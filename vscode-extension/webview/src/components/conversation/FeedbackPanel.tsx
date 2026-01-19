/**
 * FeedbackPanel - Rich Multi-Dimensional Feedback Collection
 * 
 * Phase 5: Enhanced feedback with multi-dimensional ratings,
 * structured corrections, and detailed feedback capture.
 */

import React, { useState } from 'react';
import { MessageIntent } from '../../types/conversation';
import { ThumbsUp, ThumbsDown, MessageSquare, X, Star } from 'lucide-react';

interface FeedbackPanelProps {
    messageId: string;
    analysisId?: string;
    intent?: MessageIntent;
    onSubmit: (feedback: FeedbackData) => void;
    onClose: () => void;
}

export interface FeedbackData {
    messageId: string;
    analysisId?: string;
    rating: 'helpful' | 'partial' | 'not-helpful';
    selectedPositive: string[];
    selectedNegative: string[];
    additionalComments: string;
    corrections?: {
        correctFile?: string;
        correctRootCause?: string;
        correctFix?: string;
    };
    ratings?: {
        accuracy?: number;
        clarity?: number;
        completeness?: number;
        relevance?: number;
    };
}

export function FeedbackPanel({ messageId, analysisId, intent, onSubmit, onClose }: FeedbackPanelProps) {
    const [rating, setRating] = useState<'helpful' | 'partial' | 'not-helpful' | null>(null);
    const [positiveAspects, setPositiveAspects] = useState<string[]>([]);
    const [negativeAspects, setNegativeAspects] = useState<string[]>([]);
    const [comments, setComments] = useState('');
    const [corrections, setCorrections] = useState({
        correctFile: '',
        correctRootCause: '',
        correctFix: ''
    });
    const [ratings, setRatings] = useState({
        accuracy: 0,
        clarity: 0,
        completeness: 0,
        relevance: 0
    });
    const [showCorrections, setShowCorrections] = useState(false);

    const positiveOptions = POSITIVE_ASPECTS;
    const negativeOptions = NEGATIVE_ASPECTS;

    const handleSubmit = () => {
        if (!rating) return;

        onSubmit({
            messageId,
            analysisId,
            rating,
            selectedPositive: positiveAspects,
            selectedNegative: negativeAspects,
            additionalComments: comments,
            corrections: Object.values(corrections).some(v => v) ? corrections : undefined,
            ratings: Object.values(ratings).some(v => v > 0) ? ratings : undefined
        });
    };

    const togglePositiveAspect = (aspect: string) => {
        setPositiveAspects(prev =>
            prev.includes(aspect)
                ? prev.filter(a => a !== aspect)
                : [...prev, aspect]
        );
    };

    const toggleNegativeAspect = (aspect: string) => {
        setNegativeAspects(prev =>
            prev.includes(aspect)
                ? prev.filter(a => a !== aspect)
                : [...prev, aspect]
        );
        // Show corrections panel if critical issues selected
        if (['wrong_file', 'incorrect_root_cause'].includes(aspect)) {
            setShowCorrections(true);
        }
    };

    const needsCorrections = negativeAspects.some(a =>
        ['wrong_file', 'incorrect_root_cause'].includes(a)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[500px] max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-zinc-100">Rich Feedback</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-md hover:bg-zinc-800 flex items-center justify-center transition-colors"
                    >
                        <X className="h-4 w-4 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-5">
                    {/* Overall Rating */}
                    <div>
                        <p className="text-sm font-medium text-zinc-300 mb-3">Overall Rating</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRating('helpful')}
                                className={`flex-1 py-2.5 px-3 rounded-lg border transition-all text-sm font-medium ${rating === 'helpful'
                                    ? 'border-green-500 bg-green-500/20 text-green-400'
                                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                                    }`}
                            >
                                <ThumbsUp className="h-4 w-4 mx-auto mb-1" />
                                <span>Helpful</span>
                            </button>
                            <button
                                onClick={() => setRating('partial')}
                                className={`flex-1 py-2.5 px-3 rounded-lg border transition-all text-sm font-medium ${rating === 'partial'
                                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                                    }`}
                            >
                                <span>Partially</span>
                            </button>
                            <button
                                onClick={() => setRating('not-helpful')}
                                className={`flex-1 py-2.5 px-3 rounded-lg border transition-all text-sm font-medium ${rating === 'not-helpful'
                                    ? 'border-red-500 bg-red-500/20 text-red-400'
                                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                                    }`}
                            >
                                <ThumbsDown className="h-4 w-4 mx-auto mb-1" />
                                <span>Not Helpful</span>
                            </button>
                        </div>
                    </div>

                    {rating && (
                        <>
                            {/* What Worked Well */}
                            <div>
                                <p className="text-sm font-medium text-zinc-300 mb-3">What worked well?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {positiveOptions.map((aspect) => (
                                        <label
                                            key={aspect.value}
                                            className="flex items-start gap-2 p-2 rounded-md hover:bg-zinc-800 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={positiveAspects.includes(aspect.value)}
                                                onChange={() => togglePositiveAspect(aspect.value)}
                                                className="mt-0.5 rounded border-zinc-600"
                                            />
                                            <span className="text-sm text-zinc-300">{aspect.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* What Needs Improvement */}
                            <div>
                                <p className="text-sm font-medium text-zinc-300 mb-3">What needs improvement?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {negativeOptions.map((aspect) => (
                                        <label
                                            key={aspect.value}
                                            className="flex items-start gap-2 p-2 rounded-md hover:bg-zinc-800 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={negativeAspects.includes(aspect.value)}
                                                onChange={() => toggleNegativeAspect(aspect.value)}
                                                className="mt-0.5 rounded border-zinc-600"
                                            />
                                            <span className="text-sm text-zinc-300">{aspect.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Dimension Ratings */}
                            <div>
                                <p className="text-sm font-medium text-zinc-300 mb-3">Rate Dimensions (Optional)</p>
                                <div className="space-y-3">
                                    {[
                                        { key: 'accuracy', label: 'Accuracy' },
                                        { key: 'clarity', label: 'Clarity' },
                                        { key: 'completeness', label: 'Completeness' },
                                        { key: 'relevance', label: 'Relevance' }
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-zinc-400">{label}</span>
                                                <span className="text-xs text-zinc-500">{ratings[key as keyof typeof ratings]}/5</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setRatings(prev => ({
                                                            ...prev,
                                                            [key]: star
                                                        }))}
                                                        className={`h-6 w-6 transition-colors ${star <= (ratings[key as keyof typeof ratings] || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-zinc-700'
                                                            }`}
                                                    >
                                                        <Star className="h-4 w-4 fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Corrections (if applicable) */}
                            {needsCorrections && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-3">
                                    <p className="text-sm font-medium text-red-400">
                                        Provide Corrections (Optional)
                                    </p>

                                    {negativeAspects.includes('wrong_file') && (
                                        <input
                                            type="text"
                                            placeholder="Correct file path..."
                                            value={corrections.correctFile}
                                            onChange={(e) => setCorrections(prev => ({
                                                ...prev,
                                                correctFile: e.target.value
                                            }))}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                                        />
                                    )}

                                    {negativeAspects.includes('incorrect_root_cause') && (
                                        <textarea
                                            placeholder="Correct root cause..."
                                            value={corrections.correctRootCause}
                                            onChange={(e) => setCorrections(prev => ({
                                                ...prev,
                                                correctRootCause: e.target.value
                                            }))}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
                                            rows={2}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Additional Comments */}
                            <div>
                                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                    Additional Comments (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Any other feedback or suggestions..."
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Submit Feedback
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Get feedback options based on intent and rating
 * 
 * Phase 5: Returns predefined positive and negative aspects
 */
const POSITIVE_ASPECTS = [
    { value: 'correct_file', label: 'Identified correct file' },
    { value: 'accurate_root_cause', label: 'Root cause was accurate' },
    { value: 'clear_explanation', label: 'Explanation was clear' },
    { value: 'helpful_examples', label: 'Examples were helpful' },
    { value: 'good_confidence', label: 'Confidence level appropriate' },
    { value: 'relevant_context', label: 'Used relevant context' }
];

const NEGATIVE_ASPECTS = [
    { value: 'wrong_file', label: 'Wrong file identified' },
    { value: 'incorrect_root_cause', label: 'Root cause incorrect' },
    { value: 'unclear_explanation', label: 'Explanation unclear' },
    { value: 'missing_examples', label: 'Missing examples' },
    { value: 'wrong_confidence', label: 'Confidence too high/low' },
    { value: 'missing_context', label: 'Missing context' },
    { value: 'too_generic', label: 'Too generic' }
];

/**
 * Get feedback options based on intent and rating (deprecated in Phase 5)
 * Kept for backward compatibility
 */
function getFeedbackOptionsForIntent(
    intent?: MessageIntent,
    rating?: 'helpful' | 'partial' | 'not-helpful' | null
): string[] {
    if (!intent || !rating) return [];

    const options: Record<MessageIntent, { positive: string[]; negative: string[] }> = {
        clarification: {
            positive: ['Clear explanation', 'Good example', 'Helpful context'],
            negative: ['Too technical', 'Missing details', 'Confusing example']
        },
        explanation: {
            positive: ['Clear reasoning', 'Good context', 'Helpful'],
            negative: ['Unclear reasoning', 'Missing context', 'Wrong explanation']
        },
        detail_request: {
            positive: ['Complete details', 'Well formatted', 'Helpful'],
            negative: ['Incomplete details', 'Hard to read', 'Wrong info']
        },
        refinement: {
            positive: ['Better analysis', 'Good constraints', 'Improved accuracy'],
            negative: ['Didn\'t improve', 'Missed constraints', 'Still inaccurate']
        },
        alternative: {
            positive: ['Good alternatives', 'Clear pros/cons', 'Practical'],
            negative: ['Not useful alternatives', 'Unclear differences', 'Impractical']
        },
        correction: {
            positive: ['Acknowledged well', 'Updated correctly', 'Helpful'],
            negative: ['Didn\'t acknowledge', 'Still wrong', 'Defensive']
        },
        positive_feedback: {
            positive: ['Learned from success', 'Good follow-up'],
            negative: ['Dismissive', 'Didn\'t learn']
        },
        negative_feedback: {
            positive: ['Good clarification', 'Helpful questions', 'Responsive'],
            negative: ['Not responsive', 'Didn\'t help', 'Defensive']
        },
        partial_feedback: {
            positive: ['Addressed issues', 'Good follow-up', 'Responsive'],
            negative: ['Didn\'t address issues', 'Not helpful', 'Missed context']
        },
        new_analysis: {
            positive: ['Good analysis', 'Clear results', 'Accurate'],
            negative: ['Poor analysis', 'Unclear results', 'Inaccurate']
        },
        related_issue: {
            positive: ['Found connection', 'Helpful comparison', 'Useful'],
            negative: ['Missed connection', 'Not related', 'Confusing']
        },
        agent_clarification: {
            positive: ['Good question', 'Helpful', 'Relevant'],
            negative: ['Unclear question', 'Not helpful', 'Irrelevant']
        },
        agent_suggestion: {
            positive: ['Good suggestion', 'Helpful', 'Practical'],
            negative: ['Poor suggestion', 'Not helpful', 'Impractical']
        },
        followup: {
            positive: ['Good follow-up', 'Helpful', 'Relevant'],
            negative: ['Poor follow-up', 'Not helpful', 'Irrelevant']
        },
        feedback: {
            positive: ['Clear feedback', 'Helpful', 'Constructive'],
            negative: ['Unclear feedback', 'Not helpful', 'Vague']
        },
        general: {
            positive: ['Helpful', 'Clear', 'Relevant'],
            negative: ['Not helpful', 'Unclear', 'Irrelevant']
        }
    };

    const intentOptions = options[intent];
    return rating === 'helpful' ? intentOptions.positive : intentOptions.negative;
}
