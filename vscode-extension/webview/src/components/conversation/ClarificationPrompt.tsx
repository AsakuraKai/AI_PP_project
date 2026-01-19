/**
 * ClarificationPrompt - Interactive UI for agent-initiated questions
 * 
 * Displays clarification questions from the agent and collects
 * user's answers through interactive forms.
 * 
 * Phase 4: Agent-Initiated Clarification
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';

interface ClarificationQuestion {
    questionId: string;
    type: 'open_ended' | 'multiple_choice' | 'yes_no' | 'file_selection';
    prompt: string;
    options?: ClarificationOption[];
    context: string;
}

interface ClarificationOption {
    value: string;
    label: string;
    description?: string;
}

interface ClarificationAnswer {
    questionId: string;
    answer: string | string[];
    timestamp: Date;
}

interface ClarificationPromptProps {
    questions: ClarificationQuestion[];
    onSubmit: (answers: ClarificationAnswer[]) => void;
    onSkip: () => void;
}

/**
 * Main clarification prompt component
 */
export function ClarificationPrompt({ questions, onSubmit, onSkip }: ClarificationPromptProps) {
    const [answers, setAnswers] = useState<Map<string, string>>(new Map());

    const handleAnswer = (questionId: string, answer: string) => {
        setAnswers(prev => new Map(prev).set(questionId, answer));
    };

    const handleSubmit = () => {
        const answerArray: ClarificationAnswer[] = Array.from(answers.entries()).map(([questionId, answer]) => ({
            questionId,
            answer,
            timestamp: new Date()
        }));

        onSubmit(answerArray);
    };

    const allAnswered = questions.every(q => answers.has(q.questionId));

    return (
        <Card className="p-4 bg-blue-900/20 border-blue-800 space-y-4">
            <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-100 mb-1">
                        I need your help
                    </h3>
                    <p className="text-sm text-blue-200/80">
                        Answering these questions will improve the analysis accuracy
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {questions.map((question, index) => (
                    <QuestionRenderer
                        key={question.questionId}
                        question={question}
                        questionNumber={index + 1}
                        value={answers.get(question.questionId)}
                        onChange={(answer) => handleAnswer(question.questionId, answer)}
                    />
                ))}
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500"
                >
                    Submit Answers
                </Button>
                <Button
                    onClick={onSkip}
                    variant="ghost"
                    className="text-zinc-400 hover:text-zinc-200"
                >
                    Skip
                </Button>
            </div>
        </Card>
    );
}

/**
 * Renders a single question based on its type
 */
function QuestionRenderer({
    question,
    questionNumber,
    value,
    onChange
}: {
    question: ClarificationQuestion;
    questionNumber: number;
    value: string | undefined;
    onChange: (answer: string) => void;
}) {
    return (
        <div className="space-y-2 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="space-y-1">
                <Label className="text-sm font-medium text-zinc-100">
                    {questionNumber}. {question.prompt}
                </Label>
                {question.context && (
                    <p className="text-xs text-zinc-400 italic">
                        {question.context}
                    </p>
                )}
            </div>

            {question.type === 'open_ended' && (
                <OpenEndedInput value={value} onChange={onChange} />
            )}

            {question.type === 'multiple_choice' && question.options && (
                <MultipleChoiceInput
                    options={question.options}
                    value={value}
                    onChange={onChange}
                />
            )}

            {question.type === 'yes_no' && (
                <YesNoInput value={value} onChange={onChange} />
            )}

            {question.type === 'file_selection' && question.options && (
                <FileSelectionInput
                    options={question.options}
                    value={value}
                    onChange={onChange}
                />
            )}
        </div>
    );
}

/**
 * Open-ended text input
 */
function OpenEndedInput({
    value,
    onChange
}: {
    value: string | undefined;
    onChange: (answer: string) => void;
}) {
    return (
        <Textarea
            value={value || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            placeholder="Type your answer..."
            className="w-full min-h-20 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
        />
    );
}

/**
 * Multiple choice radio buttons
 */
function MultipleChoiceInput({
    options,
    value,
    onChange
}: {
    options: ClarificationOption[];
    value: string | undefined;
    onChange: (answer: string) => void;
}) {
    return (
        <RadioGroup value={value} onValueChange={onChange}>
            <div className="space-y-2">
                {options.map(option => (
                    <div key={option.value} className="flex items-start gap-2">
                        <RadioGroupItem
                            value={option.value}
                            id={`${option.value}`}
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor={`${option.value}`}
                            className="text-sm cursor-pointer flex-1"
                        >
                            <div className="text-zinc-200">{option.label}</div>
                            {option.description && (
                                <div className="text-xs text-zinc-500 mt-0.5">
                                    {option.description}
                                </div>
                            )}
                        </Label>
                    </div>
                ))}
            </div>
        </RadioGroup>
    );
}

/**
 * Yes/No radio buttons
 */
function YesNoInput({
    value,
    onChange
}: {
    value: string | undefined;
    onChange: (answer: string) => void;
}) {
    return (
        <RadioGroup value={value} onValueChange={onChange}>
            <div className="flex gap-6">
                <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes" className="text-sm cursor-pointer text-zinc-200">
                        Yes
                    </Label>
                </div>
                <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no" className="text-sm cursor-pointer text-zinc-200">
                        No
                    </Label>
                </div>
            </div>
        </RadioGroup>
    );
}

/**
 * File selection with radio buttons
 */
function FileSelectionInput({
    options,
    value,
    onChange
}: {
    options: ClarificationOption[];
    value: string | undefined;
    onChange: (answer: string) => void;
}) {
    return (
        <RadioGroup value={value} onValueChange={onChange}>
            <div className="space-y-2">
                {options.map(option => (
                    <div key={option.value} className="flex items-start gap-2">
                        <RadioGroupItem
                            value={option.value}
                            id={`file-${option.value}`}
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor={`file-${option.value}`}
                            className="text-sm cursor-pointer flex-1"
                        >
                            <div className="text-zinc-200 font-mono text-xs">
                                {option.label}
                            </div>
                            {option.description && (
                                <div className="text-xs text-zinc-500 mt-0.5">
                                    {option.description}
                                </div>
                            )}
                        </Label>
                    </div>
                ))}
            </div>
        </RadioGroup>
    );
}
