jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { RefinementService } from '../../../src/agent/refinement/RefinementService';
import { RefinementAgent } from '../../../src/agent/refinement/RefinementAgent';

describe('RefinementService', () => {
  test('refineAnalysisWithContext parses JSON response from LLM', async () => {
    // Mock LLM client
    const mockLLM: any = {
      generate: async () => ({ text: '{"rootCause":"updated","confidence":88,"category":"cat","affectedFiles":[{"filePath":"x","lineNumbers":[1],"reason":"r","relevanceScore":0.9}],"suggestedFix":"fix"}' })
    };

    const service = new RefinementService(mockLLM);

    const original: any = { rcaId: 'r0', errorLogId: 'e0', rootCause: 'orig', category: 'cat', affectedFiles: [{ filePath: 'a', relevanceScore: 0.5, lineNumbers: [1], reason: 'r' }], confidence: 50, suggestedFix: null, generatedAt: new Date(), modelVersion: 'v', refinementCount: 0, previousVersionId: undefined };

    const refined = await service.refineAnalysisWithContext(original, { contextType: 'user_feedback', contextData: 'ctx' }, { generateNewId: true });
    expect(refined.rootCause).toBe('updated');
    expect(refined.confidence).toBe(88);
    expect(refined.refinementCount).toBe(original.refinementCount + 1);
  });

  test('refineAnalysisWithContext falls back on invalid response', async () => {
    const mockLLM: any = { generate: async () => ({ text: 'no json here' }) };
    const service = new RefinementService(mockLLM);
    const original: any = { rcaId: 'r0', errorLogId: 'e0', rootCause: 'orig', category: 'cat', affectedFiles: [{ filePath: 'a', relevanceScore: 0.5, lineNumbers: [1], reason: 'r' }], confidence: 50, suggestedFix: null, generatedAt: new Date(), modelVersion: 'v', refinementCount: 1, previousVersionId: undefined };

    const refined = await service.refineAnalysisWithContext(original, { contextType: 'clarification', contextData: 'ctx' }, { generateNewId: false });
    expect(refined.refinementCount).toBe(original.refinementCount + 1);
    expect(refined.rcaId).toBe(original.rcaId);
  });
});

describe('RefinementAgent', () => {
  test('refineAnalysis returns delta and reasoning', async () => {
    const refinedMock: any = { rcaId: 'r1', errorLogId: 'e0', rootCause: 'new', category: 'cat', affectedFiles: [{ filePath: 'b', relevanceScore: 0.9, lineNumbers: [2], reason: 'r' }], confidence: 80, suggestedFix: null, generatedAt: new Date(), modelVersion: 'v', refinementCount: 1, previousVersionId: 'r0' };

    const mockService: any = { refineAnalysisWithContext: async () => refinedMock };
    const agent = new RefinementAgent(mockService);

    const original: any = { rcaId: 'r0', errorLogId: 'e0', rootCause: 'orig', category: 'cat', affectedFiles: [{ filePath: 'a', relevanceScore: 0.5, lineNumbers: [1], reason: 'r' }], confidence: 50, suggestedFix: null, generatedAt: new Date(), modelVersion: 'v', refinementCount: 0, previousVersionId: undefined };

    const result = await agent.refineAnalysis(original, 'user context', []);
    expect(result.refinedAnalysis).toBeDefined();
    expect(typeof result.delta.confidenceChange).toBe('number');
    expect(result.delta.reasoning).toBeDefined();
  });
});
