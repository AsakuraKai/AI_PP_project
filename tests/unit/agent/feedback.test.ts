import { FeedbackClassifier } from '../../../src/agent/feedback/FeedbackClassifier';
import { EnhancedFeedbackHandler } from '../../../src/agent/feedback/EnhancedFeedbackHandler';

describe('FeedbackClassifier', () => {
  test('analyzeFeedback extracts signals and actions', () => {
    const classifier = new FeedbackClassifier();

    const feedback: any = {
      feedbackId: 'f1',
      messageId: 'm1',
      rating: 'helpful',
      explanation: 'This is a long explanation that should increase confidence.',
      timestamp: new Date(),
      corrections: {
        correctFile: 'src/foo.ts',
        correctLineNumber: 42
      },
      dimensions: {
        positiveAspects: ['concise'],
        negativeAspects: ['wrong_file', 'unclear_explanation'],
        accuracy: 4,
        clarity: 2,
        completeness: 3,
        relevance: 4
      },
      context: { path: 'src/foo.ts' }
    };

    const analysis = classifier.analyzeFeedback(feedback);
    expect(Array.isArray(analysis.learningSignals)).toBe(true);
    expect(analysis.learningSignals.length).toBeGreaterThan(0);
    expect(analysis.improvementAreas).toContain('accuracy');
    expect(Array.isArray(analysis.suggestedActions)).toBe(true);
    expect((analysis.suggestedActions || []).some(a => a.includes('Review file identification'))).toBe(true);
    expect(typeof analysis.confidence).toBe('number');

    const summary = classifier.getSummary(feedback);
    expect(typeof summary).toBe('string');
    expect(summary).toMatch(/Confidence:/);
  });
});

describe('EnhancedFeedbackHandler', () => {
  test('handleDetailedFeedback stores and processes corrections and signals', async () => {
    const save = jest.fn(async () => undefined);
    const getStats = jest.fn(async () => ({ notHelpfulCount: 0, totalFeedback: 10 }));
    const updateAnalysisMetrics = jest.fn(async () => undefined);

    const processCorrections = jest.fn(async () => undefined);
    const updateModelWeights = jest.fn(async () => undefined);
    const triggerReview = jest.fn(async () => undefined);

    const mockStore: any = {
      save,
      getStats,
      updateAnalysisMetrics
    };

    const mockLearning: any = {
      processCorrections,
      updateModelWeights,
      triggerReview
    };

    const handler = new EnhancedFeedbackHandler(mockStore, mockLearning, {
      negativeThreshold: 0.5,
      autoProcessSignals: true,
      enableAnalytics: true,
      logger: { log: () => {}, warn: () => {}, error: () => {} }
    });

    const feedback: any = {
      feedbackId: 'fb1',
      messageId: 'msg1',
      rating: 'partial',
      timestamp: new Date(),
      corrections: { correctFile: 'src/x.ts' },
      dimensions: { negativeAspects: ['wrong_file'], positiveAspects: [] }
    };

    await handler.handleDetailedFeedback(feedback);

    expect(save).toHaveBeenCalledWith(feedback);
    expect(processCorrections).toHaveBeenCalledWith(feedback.messageId, feedback.corrections);
    expect(updateModelWeights).toHaveBeenCalled();
  });

  test('classifyFeedback returns expected classification fields', () => {
    const mockStore: any = { getStats: async () => ({ notHelpfulCount: 0, totalFeedback: 1 }) };
    const mockLearning: any = { processCorrections: async () => {}, updateModelWeights: async () => {}, triggerReview: async () => {} };
    const handler = new EnhancedFeedbackHandler(mockStore, mockLearning, {});

    const feedback: any = {
      feedbackId: 'f2',
      messageId: 'm2',
      rating: 'not-helpful',
      timestamp: new Date(),
      dimensions: { negativeAspects: [], positiveAspects: [] }
    };

    const classification = handler.classifyFeedback(feedback as any);
    expect(typeof classification.isConstructive).toBe('boolean');
    expect(typeof classification.hasCorrections).toBe('boolean');
    expect(['low', 'medium', 'high']).toContain(classification.severity);
    expect(Array.isArray(classification.categories)).toBe(true);
  });
});
