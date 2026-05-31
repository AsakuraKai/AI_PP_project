jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { RefinementHandler } from '../../../../src/agent/handlers/RefinementHandler';
import { ExplanationHandler } from '../../../../src/agent/handlers/ExplanationHandler';
import { ClarificationHandler } from '../../../../src/agent/handlers/ClarificationHandler';

describe('RefinementHandler', () => {
  test('returns no-analysis response when currentAnalysis is missing', async () => {
    const mockLLM: any = { generate: async () => ({ text: 'unused' }) };
    const handler = new RefinementHandler(mockLLM);

    const message: any = { id: 'm1', sessionId: 's1', content: 'please refine' };
    const context: any = {};

    const res = await handler.handle(message, context, { intent: 'refinement', confidence: 0.5 } as any);
    expect(res.content).toMatch(/I don't have an active analysis/);
    expect(res.metadata && res.metadata.intent).toBe('refinement');
  });

  test('performs refinement when analysis provided', async () => {
    const mockLLM: any = { generate: async () => ({ text: '{"rootCause":"new","confidence":80,"category":"cat","affectedFiles":[{"filePath":"b","lineNumbers":[2],"reason":"r","relevanceScore":0.9}],"suggestedFix":"fix"}' }) };
    const handler = new RefinementHandler(mockLLM);

    const message: any = { id: 'm2', sessionId: 's2', content: 'refine this' };
    const context: any = {};
    const currentAnalysis: any = { rcaId: 'r0', errorLogId: 'e0', rootCause: 'orig', category: 'cat', affectedFiles: [{ filePath: 'a', relevanceScore: 0.5, lineNumbers: [1], reason: 'r' }], confidence: 50, suggestedFix: null, generatedAt: new Date(), modelVersion: 'v', refinementCount: 0, previousVersionId: undefined };

    const res = await handler.handle(message, context, { intent: 'refinement', confidence: 0.7 } as any, [], currentAnalysis as any);
    expect(res.metadata && res.metadata.intent).toBe('refinement');
    expect(res.metadata && res.metadata.toolsUsed).toContain('refinement_agent');
    expect(res.content).toMatch(/I've refined the analysis/);
  });
});

describe('ExplanationHandler', () => {
  test('returns generated explanation text', async () => {
    const mockLLM: any = { generate: async () => ({ text: '  This explains why.  ' }) };
    const handler = new ExplanationHandler(mockLLM as any);

    const message: any = { sessionId: 's1', content: 'Why did this happen?' };
    const context: any = { viewType: 'error_view' };
    const classification: any = { confidence: 0.9, entities: [] };

    const res = await handler.handle(message, context, classification as any);
    expect(res.content).toBe('This explains why.');
    expect(res.metadata && res.metadata.intent).toBe('explanation');
  });
});

describe('ClarificationHandler', () => {
  test('extracts quoted topic and returns explanation', async () => {
    const mockLLM: any = { generate: async () => ({ text: 'Definition of the term' }) };
    const handler = new ClarificationHandler(mockLLM as any);

    const message: any = { sessionId: 's1', content: 'What is "gradle"?' };
    const context: any = { viewType: 'editor' };
    const classification: any = { confidence: 0.8, entities: [] };

    const res = await handler.handle(message, context, classification as any);
    expect(res.content).toBe('Definition of the term');
    expect(res.metadata && res.metadata.intent).toBe('clarification');
  });

  test('falls back to entities or cleaned message', async () => {
    const mockLLM: any = { generate: async () => ({ text: 'Fallback explanation' }) };
    const handler = new ClarificationHandler(mockLLM as any);

    const message: any = { sessionId: 's1', content: 'Explain tooling.' };
    const context: any = { viewType: 'editor' };
    const classification: any = { confidence: 0.8, entities: [{ type: 'tool', value: 'tooling', confidence: 0.9 }] };

    const res = await handler.handle(message, context, classification as any);
    expect(res.content).toBe('Fallback explanation');
  });
});
