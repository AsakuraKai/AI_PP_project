jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));
import { FeedbackIntentHandler } from '../../../../src/agent/handlers/FeedbackIntentHandler';

describe('FeedbackIntentHandler', () => {
  test('handle returns assistant response for positive feedback', async () => {
    const handler = new FeedbackIntentHandler();

    const message: any = {
      sessionId: 'sess1',
      content: 'Great job!',
      timestamp: new Date()
    };

    const context: any = { userId: 'u1' };
    const classification: any = { intent: 'positive_feedback', confidence: 0.98 };

    const response = await handler.handle(message, context, classification);

    expect(response).toHaveProperty('role', 'assistant');
    expect(response).toHaveProperty('content');
    expect(response.metadata && response.metadata.intent).toBe('positive_feedback');
  });

  test('handle returns assistant response for negative feedback', async () => {
    const handler = new FeedbackIntentHandler();

    const message: any = { sessionId: 'sess2', content: 'This failed', timestamp: new Date() };
    const context: any = {};
    const classification: any = { intent: 'negative_feedback', confidence: 0.6 };

    const response = await handler.handle(message, context, classification);

    expect(response).toHaveProperty('role', 'assistant');
    expect(response.content).toMatch(/I understand this didn't work/);
    expect(response.metadata && response.metadata.intent).toBe('negative_feedback');
  });
});
