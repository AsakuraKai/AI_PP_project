jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { UncertaintyDetector } from '../../../src/agent/clarification/UncertaintyDetector';
import { QuestionGenerator } from '../../../src/agent/clarification/QuestionGenerator';
import { ClarificationAgent } from '../../../src/agent/clarification/ClarificationAgent';

describe('UncertaintyDetector', () => {
  test('detects low confidence and missing context', () => {
    const detector = new UncertaintyDetector();

    const analysis: any = {
      confidence: 50,
      affectedFiles: [{ filePath: 'a', relevanceScore: 0.9 }]
    };

    const context: any = { errorType: 'unknown', lastUserMessage: {} };

    const report = detector.detectUncertainty(analysis, context as any);
    expect(report.hasUncertainty).toBe(true);
    expect(report.signals.length).toBeGreaterThan(0);
    expect(report.overallSeverity).toBe('high');
  });

  test('does not detect uncertainty for high confidence and clear context', () => {
    const detector = new UncertaintyDetector();
    const analysis: any = { confidence: 95, affectedFiles: [{ filePath: 'a', relevanceScore: 0.99 }] };
    const context: any = { errorType: 'build_failure', lastUserMessage: { metadata: { intent: 'specific' } } };

    const report = detector.detectUncertainty(analysis, context as any);
    expect(report.hasUncertainty).toBe(false);
    expect(report.shouldAskClarification).toBe(false);
  });
});

describe('QuestionGenerator', () => {
  test('generates questions for signals', () => {
    const gen = new QuestionGenerator();

    const report: any = {
      signals: [
        { type: 'low_confidence' },
        { type: 'missing_context' }
      ]
    };

    const analysis: any = { confidence: 40, affectedFiles: [{ filePath: 'a' }] };

    const questions = gen.generateQuestions(report as any, analysis as any);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.some(q => q.prompt && typeof q.prompt === 'string')).toBe(true);
  });
});

describe('ClarificationAgent', () => {
  test('analyzeClarificationNeeds returns questions when needed', async () => {
    const detector = new UncertaintyDetector();
    const generator = new QuestionGenerator();

    // Mock refinement service with a minimal interface
    const mockRefinement: any = { refineAnalysisWithContext: async () => ({ rcaId: 'r1', confidence: 90, affectedFiles: [{ filePath: 'a', relevanceScore: 0.9 }], rootCause: 'x', errorLogId: 'e1', refinementCount: 0, generatedAt: new Date(), modelVersion: 'v', previousVersionId: 'r0' }) };

    const agent = new ClarificationAgent(detector, generator, mockRefinement);

    const analysis: any = { rcaId: 'r0', confidence: 50, affectedFiles: [{ filePath: 'a', relevanceScore: 0.9 }], rootCause: 'orig', errorLogId: 'e0', refinementCount: 0, generatedAt: new Date(), modelVersion: 'v', previousVersionId: undefined };
    const context: any = { errorType: 'unknown' };

    const result = await agent.analyzeClarificationNeeds(analysis, context);
    expect(result.needsClarification).toBe(true);
    expect(Array.isArray(result.questions)).toBe(true);

    // Now simulate processing answers
    const questions = result.questions;
    const answers = questions.map((q: any) => ({ questionId: q.questionId, answer: 'test' }));

    const refined = await agent.processClarificationAnswers(analysis, questions as any, answers as any);
    expect(refined).toHaveProperty('rcaId');
    expect(refined.confidence).toBeGreaterThanOrEqual(0);
  });
});
