/**
 * ClarificationAgent - Main agent for handling clarification flow
 * 
 * Orchestrates the clarification process:
 * 1. Analyzes if clarification is needed
 * 2. Generates questions for user
 * 3. Processes user's answers
 * 4. Refines analysis with new information
 * 
 * Phase 4: Agent-Initiated Clarification
 */

import {
    RootCauseAnalysis,
    ConversationContext,
    ClarificationResult,
    ClarificationQuestion,
    ClarificationAnswer
} from '../../types';
import { UncertaintyDetector } from './UncertaintyDetector';
import { QuestionGenerator } from './QuestionGenerator';
import { RefinementService } from '../refinement/RefinementService';
import { Logger } from '../../utils/Logger';

const logger = new Logger('ClarificationAgent');

export class ClarificationAgent {
    constructor(
        private uncertaintyDetector: UncertaintyDetector,
        private questionGenerator: QuestionGenerator,
        private refinementService: RefinementService
    ) { }

    /**
     * Analyze if clarification is needed for the current analysis
     */
    async analyzeClarificationNeeds(
        analysis: RootCauseAnalysis,
        context: ConversationContext
    ): Promise<ClarificationResult> {
        logger.info('Analyzing clarification needs', {
            rcaId: analysis.rcaId,
            confidence: analysis.confidence
        });

        // Detect uncertainty signals
        const uncertaintyReport = this.uncertaintyDetector.detectUncertainty(
            analysis,
            context
        );

        // If no uncertainty, no need for clarification
        if (!uncertaintyReport.shouldAskClarification) {
            logger.info('No clarification needed', {
                hasUncertainty: uncertaintyReport.hasUncertainty,
                signalCount: uncertaintyReport.signals.length
            });

            return {
                needsClarification: false,
                questions: [],
                reason: 'Analysis is sufficiently confident',
                uncertaintyReport
            };
        }

        // Generate questions based on uncertainty
        const questions = this.questionGenerator.generateQuestions(
            uncertaintyReport,
            analysis
        );

        logger.info('Clarification needed', {
            questionCount: questions.length,
            severity: uncertaintyReport.overallSeverity
        });

        return {
            needsClarification: true,
            questions,
            reason: this.buildReasoningMessage(uncertaintyReport),
            uncertaintyReport
        };
    }

    /**
     * Process user's clarification answers and refine analysis
     */
    async processClarificationAnswers(
        originalAnalysis: RootCauseAnalysis,
        questions: ClarificationQuestion[],
        answers: ClarificationAnswer[]
    ): Promise<RootCauseAnalysis> {
        logger.info('Processing clarification answers', {
            rcaId: originalAnalysis.rcaId,
            questionCount: questions.length,
            answerCount: answers.length
        });

        // Build context from Q&A
        const clarificationContext = this.buildClarificationContext(questions, answers);

        // Use RefinementService for refinement
        const refinedAnalysis = await this.refinementService.refineAnalysisWithContext(
            originalAnalysis,
            {
                contextType: 'clarification',
                contextData: clarificationContext
            },
            {
                temperature: 0.2,
                generateNewId: false // Keep same ID for clarification refinements
            }
        );

        logger.info('Analysis refined with clarification', {
            rcaId: refinedAnalysis.rcaId,
            oldConfidence: originalAnalysis.confidence,
            newConfidence: refinedAnalysis.confidence,
            confidenceChange: refinedAnalysis.confidence - originalAnalysis.confidence
        });

        return refinedAnalysis;
    }

    /**
     * Build clarification context from Q&A pairs
     */
    private buildClarificationContext(
        questions: ClarificationQuestion[],
        answers: ClarificationAnswer[]
    ): string {
        const qaPairs = questions.map(q => {
            const answer = answers.find(a => a.questionId === q.questionId);
            const answerText = answer
                ? (Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer)
                : 'No answer provided';

            return `Q: ${q.prompt}\nA: ${answerText}`;
        });

        return qaPairs.join('\n\n');
    }

    /**
     * Build reasoning message from uncertainty report
     */
    private buildReasoningMessage(report: import('../../types').UncertaintyReport): string {
        const reasons = report.signals.map(s => s.description);
        return `I need clarification because: ${reasons.join(', ')}`;
    }
}
