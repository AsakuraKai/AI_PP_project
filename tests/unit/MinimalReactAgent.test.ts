/**
 * Unit tests for MinimalReactAgent
 */

import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ParsedError, LLMResponse, AnalysisTimeoutError } from '../../src/types';

// Mock OllamaClient
jest.mock('../../src/llm/OllamaClient');

describe('MinimalReactAgent', () => {
  let agent: MinimalReactAgent;
  let mockLLM: jest.Mocked<OllamaClient>;

  const createMockError = (): ParsedError => ({
    type: 'lateinit',
    message: 'lateinit property user has not been initialized',
    filePath: 'MainActivity.kt',
    line: 45,
    language: 'kotlin',
    metadata: {
      propertyName: 'user',
    },
  });

  beforeEach(() => {
    mockLLM = {
      generate: jest.fn(),
      connect: jest.fn(),
      isHealthy: jest.fn(),
      listModels: jest.fn(),
      getConfig: jest.fn(),
    } as any;

    // Use new constructor signature with config
    agent = new MinimalReactAgent(mockLLM, {
      maxIterations: 3, // Match test expectations
      usePromptEngine: false, // Use legacy mode for tests
      useToolRegistry: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze()', () => {
    it('should complete 3 iterations and return structured result', async () => {
      const error = createMockError();

      // Mock LLM responses for 3 iterations
      mockLLM.generate
        .mockResolvedValueOnce({
          text: 'Hypothesis: The lateinit property "user" was accessed before being initialized in the onCreate method.',
          tokensUsed: 50,
          generationTime: 1000,
        } as LLMResponse)
        .mockResolvedValueOnce({
          text: 'Analysis: This is a common Kotlin error when lateinit properties are accessed before assignment. The property must be initialized before any access.',
          tokensUsed: 60,
          generationTime: 1200,
        } as LLMResponse)
        .mockResolvedValueOnce({
          text: JSON.stringify({
            rootCause: 'The lateinit property "user" was accessed in onCreate before being assigned a value. Lateinit properties must be initialized before they can be used.',
            fixGuidelines: [
              'Initialize the "user" property in onCreate() before accessing it',
              'Use nullable type (User?) instead of lateinit if initialization might fail',
              'Consider using lazy delegation for delayed initialization',
            ],
            confidence: 0.9,
          }),
          tokensUsed: 100,
          generationTime: 1500,
        } as LLMResponse);

      const result = await agent.analyze(error);

      expect(mockLLM.generate).toHaveBeenCalledTimes(3);
      expect(result.error).toBe(error.message);
      expect(result.rootCause).toContain('lateinit property');
      expect(result.fixGuidelines).toHaveLength(3);
      expect(result.confidence).toBe(0.9);
    });

    it('should handle malformed JSON output gracefully', async () => {
      const error = createMockError();

      mockLLM.generate
        .mockResolvedValueOnce({ text: 'Thought 1', tokensUsed: 20 } as LLMResponse)
        .mockResolvedValueOnce({ text: 'Thought 2', tokensUsed: 30 } as LLMResponse)
        .mockResolvedValueOnce({ text: 'Thought 3', tokensUsed: 40 } as LLMResponse)
        .mockResolvedValueOnce({
          text: 'This is not valid JSON but contains analysis',
          tokensUsed: 50,
        } as LLMResponse);

      const result = await agent.analyze(error);

      // Should use fallback behavior when JSON parsing fails on final prompt (legacy mode)
      expect(result.confidence).toBe(0.3); // Legacy fallback confidence
      expect(result.fixGuidelines).toBeDefined();
      expect(Array.isArray(result.fixGuidelines)).toBe(true);
    });

    it('should parse JSON even with extra text around it', async () => {
      const error = createMockError();

      mockLLM.generate
        .mockResolvedValueOnce({ text: 'Thought 1', tokensUsed: 20 } as LLMResponse)
        .mockResolvedValueOnce({ text: 'Thought 2', tokensUsed: 30 } as LLMResponse)
        .mockResolvedValueOnce({
          text: `Here is my analysis:
          
          ${JSON.stringify({
            rootCause: 'Lateinit issue',
            fixGuidelines: ['Fix 1', 'Fix 2'],
            confidence: 0.85,
          })}
          
          Hope this helps!`,
          tokensUsed: 80,
        } as LLMResponse);

      const result = await agent.analyze(error);

      expect(result.rootCause).toBe('Lateinit issue');
      expect(result.confidence).toBe(0.85);
    });

    it('should throw AnalysisTimeoutError when timeout exceeded', async () => {
      const error = createMockError();

      // Create agent with very short timeout
      const shortTimeoutAgent = new MinimalReactAgent(mockLLM, {
        maxIterations: 3,
        timeout: 100, // 100ms timeout
        usePromptEngine: false,
        useToolRegistry: false,
      });

      // Mock slow LLM response (200ms > 100ms timeout)
      mockLLM.generate.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ text: 'Slow response', tokensUsed: 10 } as LLMResponse), 200)
          )
      );

      await expect(shortTimeoutAgent.analyze(error)).rejects.toThrow(AnalysisTimeoutError);
    });

    it('should propagate LLM errors', async () => {
      const error = createMockError();

      mockLLM.generate.mockRejectedValueOnce(new Error('LLM connection failed'));

      await expect(agent.analyze(error)).rejects.toThrow('LLM connection failed');
    });

    it('should include error metadata in prompts', async () => {
      const error = createMockError();

      mockLLM.generate
        .mockResolvedValueOnce({ text: 'Analysis' } as LLMResponse)
        .mockResolvedValueOnce({ text: 'Deeper' } as LLMResponse)
        .mockResolvedValueOnce({
          text: JSON.stringify({
            rootCause: 'Issue',
            fixGuidelines: ['Fix'],
            confidence: 0.8,
          }),
        } as LLMResponse);

      await agent.analyze(error);

      // Check that first call includes metadata
      const firstCallPrompt = mockLLM.generate.mock.calls[0][0];
      expect(firstCallPrompt).toContain('user'); // Property name from metadata
      expect(firstCallPrompt).toContain('MainActivity.kt');
      expect(firstCallPrompt).toContain('45');
    });
  });

  describe('getConfig()', () => {
    it('should return agent configuration', () => {
      const config = agent.getConfig();

      expect(config.maxIterations).toBe(3);
      expect(config.timeout).toBe(90000);
    });
  });
});
