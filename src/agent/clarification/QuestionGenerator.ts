/**
 * QuestionGenerator - Generates targeted clarification questions
 * 
 * Creates appropriate questions based on uncertainty signals detected
 * in the analysis. Supports multiple question types and prioritizes
 * questions by importance.
 * 
 * Phase 4: Agent-Initiated Clarification
 */

import {
    UncertaintyReport,
    UncertaintySignal,
    RootCauseAnalysis,
    ClarificationQuestion,
    ClarificationOption
} from '../../types';
import { Logger } from '../../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('QuestionGenerator');

export class QuestionGenerator {
    /**
     * Generate targeted clarification questions from uncertainty report
     */
    generateQuestions(
        uncertaintyReport: UncertaintyReport,
        analysis: RootCauseAnalysis
    ): ClarificationQuestion[] {
        const questions: ClarificationQuestion[] = [];

        for (const signal of uncertaintyReport.signals) {
            const question = this.generateQuestionForSignal(signal, analysis);
            if (question) {
                questions.push(question);
            }
        }

        // Prioritize by question type (multiple choice > yes/no > open-ended)
        const prioritized = questions.sort((a, b) =>
            this.getQuestionPriority(b.type) - this.getQuestionPriority(a.type)
        );

        logger.info(`Generated ${questions.length} clarification questions`, {
            types: questions.map(q => q.type)
        });

        return prioritized;
    }

    /**
     * Generate a question for a specific uncertainty signal
     */
    private generateQuestionForSignal(
        signal: UncertaintySignal,
        analysis: RootCauseAnalysis
    ): ClarificationQuestion | null {
        switch (signal.type) {
            case 'low_confidence':
                return this.generateLowConfidenceQuestion(analysis);

            case 'ambiguous_files':
                return this.generateAmbiguousFilesQuestion(analysis);

            case 'missing_context':
                return this.generateMissingContextQuestion();

            case 'unclear_intent':
                return this.generateUnclearIntentQuestion();

            default:
                logger.warn(`Unknown uncertainty signal type: ${signal.type}`);
                return null;
        }
    }

    /**
     * Generate question for low confidence
     */
    private generateLowConfidenceQuestion(analysis: RootCauseAnalysis): ClarificationQuestion {
        return {
            questionId: uuidv4(),
            type: 'open_ended',
            prompt: 'Can you provide more context about when this error occurs?',
            context: `Current confidence: ${analysis.confidence}%. Additional context will help improve accuracy.`,
            options: undefined
        };
    }

    /**
     * Generate question for ambiguous files
     */
    private generateAmbiguousFilesQuestion(analysis: RootCauseAnalysis): ClarificationQuestion {
        const topFiles = analysis.affectedFiles.slice(0, 4);

        const options: ClarificationOption[] = topFiles.map(file => ({
            value: file.filePath,
            label: file.filePath,
            description: file.reason
        }));

        // Add "None of these" option
        options.push({
            value: '__none__',
            label: 'None of these',
            description: 'The issue is in a different file'
        });

        return {
            questionId: uuidv4(),
            type: 'file_selection',
            prompt: 'Which file is most relevant to this error?',
            context: 'Multiple files have similar relevance scores. Your input will help focus the analysis.',
            options
        };
    }

    /**
     * Generate question for missing context
     */
    private generateMissingContextQuestion(): ClarificationQuestion {
        return {
            questionId: uuidv4(),
            type: 'open_ended',
            prompt: 'What steps led to this error?',
            context: 'Understanding the user flow will help identify the root cause.',
            options: undefined
        };
    }

    /**
     * Generate question for unclear intent
     */
    private generateUnclearIntentQuestion(): ClarificationQuestion {
        const options: ClarificationOption[] = [
            {
                value: 'explain',
                label: 'Explain the current analysis',
                description: 'Help me understand what the agent found'
            },
            {
                value: 'alternatives',
                label: 'Show alternative causes',
                description: 'Explore other possible root causes'
            },
            {
                value: 'fix',
                label: 'Suggest a fix',
                description: 'Provide code changes to resolve the issue'
            },
            {
                value: 'refine',
                label: 'Refine the analysis',
                description: 'Improve accuracy with more information'
            }
        ];

        return {
            questionId: uuidv4(),
            type: 'multiple_choice',
            prompt: 'What would you like me to do?',
            context: 'I want to provide the most helpful response.',
            options
        };
    }

    /**
     * Get priority score for question type (higher = more priority)
     */
    private getQuestionPriority(type: ClarificationQuestion['type']): number {
        const priorities: Record<string, number> = {
            'file_selection': 4,
            'multiple_choice': 3,
            'yes_no': 2,
            'open_ended': 1
        };
        return priorities[type] || 0;
    }
}
