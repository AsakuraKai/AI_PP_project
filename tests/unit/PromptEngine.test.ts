/**
 * Tests for PromptEngine
 */

import { PromptEngine } from '../../src/agent/PromptEngine';
import { ParsedError, AgentState } from '../../src/types';

describe('PromptEngine', () => {
  let engine: PromptEngine;

  beforeEach(() => {
    engine = new PromptEngine();
  });

  describe('getSystemPrompt', () => {
    it('should return non-empty system prompt', () => {
      const prompt = engine.getSystemPrompt();

      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should include key instructions', () => {
      const prompt = engine.getSystemPrompt();

      expect(prompt).toContain('expert');
      expect(prompt).toContain('debugging');
      expect(prompt).toContain('root cause');
      expect(prompt).toContain('JSON');
    });

    it('should mention available tools', () => {
      const prompt = engine.getSystemPrompt();

      expect(prompt).toContain('read_file');
      expect(prompt).toContain('find_callers');
    });

    it('should specify output format', () => {
      const prompt = engine.getSystemPrompt();

      expect(prompt).toContain('thought');
      expect(prompt).toContain('action');
      expect(prompt).toContain('rootCause');
      expect(prompt).toContain('fixGuidelines');
      expect(prompt).toContain('confidence');
    });
  });

  describe('getFewShotExamples', () => {
    it('should return examples for lateinit errors', () => {
      const examples = engine.getFewShotExamples('lateinit');

      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].error).toContain('lateinit');
      expect(examples[0].thought).toBeTruthy();
      expect(examples[0].conclusion).toBeDefined();
    });

    it('should return examples for npe errors', () => {
      const examples = engine.getFewShotExamples('npe');

      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].error.toLowerCase()).toContain('null');
    });

    it('should return examples for unresolved_reference errors', () => {
      const examples = engine.getFewShotExamples('unresolved_reference');

      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].error).toContain('Unresolved reference');
    });

    it('should return examples for type_mismatch errors', () => {
      const examples = engine.getFewShotExamples('type_mismatch');

      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].error).toContain('Type mismatch');
    });

    it('should return empty array for unknown error type', () => {
      const examples = engine.getFewShotExamples('unknown_error_type');

      expect(examples).toEqual([]);
    });

    it('should include all required fields in examples', () => {
      const examples = engine.getFewShotExamples('lateinit');

      examples.forEach(example => {
        expect(example.error).toBeTruthy();
        expect(example.thought).toBeTruthy();
        expect(example.action).toBeTruthy();
        expect(example.observation).toBeTruthy();
        expect(example.conclusion).toBeDefined();
        expect(example.conclusion.rootCause).toBeTruthy();
        expect(Array.isArray(example.conclusion.fixGuidelines)).toBe(true);
        expect(example.conclusion.fixGuidelines.length).toBeGreaterThan(0);
        expect(typeof example.conclusion.confidence).toBe('number');
      });
    });
  });

  describe('buildIterationPrompt (first iteration)', () => {
    const testError: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin',
    };

    it('should include error information', () => {
      const prompt = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples: [],
        error: testError,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 3,
      });

      expect(prompt).toContain('lateinit');
      expect(prompt).toContain('MainActivity.kt');
      expect(prompt).toContain('45');
    });

    it('should include system prompt', () => {
      const prompt = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples: [],
        error: testError,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 3,
      });
      
      expect(prompt).toContain('Kotlin/Android debugging');
    });

    it('should include few-shot examples for known error types', () => {
      const examples = engine.getFewShotExamples('lateinit');
      const prompt = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples,
        error: testError,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 3,
      });

      expect(prompt).toContain('EXAMPLES');
    });

    it('should include metadata when present', () => {
      const errorWithMetadata: ParsedError = {
        ...testError,
        metadata: { propertyName: 'user' },
      };

      const prompt = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples: [],
        error: errorWithMetadata,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 3,
      });

      expect(prompt).toContain('Metadata');
      expect(prompt).toContain('propertyName');
    });
  });

  describe('buildIterationPrompt', () => {
    const testError: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin',
    };

    const testState: AgentState = {
      iteration: 2,
      maxIterations: 3,
      startTime: Date.now(),
      timeout: 90000,
      mode: 'standard',
      thoughts: ['Initial hypothesis about error'],
      actions: [],
      observations: ['File content shows property declared but not initialized'],
      hypothesis: 'Property not initialized',
      rootCause: null,
      converged: false,
      error: testError,
    };

    it('should include iteration progress', () => {
      const prompt = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples: [],
        error: testError,
        previousThoughts: testState.thoughts,
        previousActions: testState.actions,
        previousObservations: testState.observations,
        iteration: 2,
        maxIterations: 3,
      });

      expect(prompt).toContain('Iteration 2/3');
    });

    it('should include previous thoughts and observations', () => {
      const prompt = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples: [],
        error: testError,
        previousThoughts: testState.thoughts,
        previousActions: testState.actions,
        previousObservations: testState.observations,
        iteration: 2,
        maxIterations: 3,
      });

      expect(prompt).toContain('Initial hypothesis');
      expect(prompt).toContain('not initialized');
    });

    it('should include examples only on first iteration', () => {
      const examples = engine.getFewShotExamples('lateinit');
      
      const prompt1 = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples,
        error: testError,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 3,
      });

      const prompt2 = engine.buildIterationPrompt({
        systemPrompt: engine.getSystemPrompt(),
        examples,
        error: testError,
        previousThoughts: testState.thoughts,
        previousActions: testState.actions,
        previousObservations: testState.observations,
        iteration: 2,
        maxIterations: 3,
      });

      expect(prompt1).toContain('EXAMPLES');
      expect(prompt2).not.toContain('EXAMPLES');
    });
  });

  describe('buildFinalPrompt', () => {
    const testError: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin',
    };

    const testState: AgentState = {
      iteration: 3,
      maxIterations: 3,
      startTime: Date.now(),
      timeout: 90000,
      mode: 'standard',
      thoughts: [
        'Initial hypothesis',
        'Deeper analysis',
        'Final reasoning',
      ],
      actions: [],
      observations: [
        'File content',
        'More context',
      ],
      hypothesis: 'Property not initialized',
      rootCause: null,
      converged: false,
      error: testError,
    };

    it('should include complete analysis history', () => {
      const prompt = engine.buildFinalPrompt(testState);

      expect(prompt).toContain('FINAL ANALYSIS');
      expect(prompt).toContain('Initial hypothesis');
      expect(prompt).toContain('Deeper analysis');
      expect(prompt).toContain('Final reasoning');
    });

    it('should include all observations', () => {
      const prompt = engine.buildFinalPrompt(testState);

      expect(prompt).toContain('File content');
      expect(prompt).toContain('More context');
    });

    it('should request structured JSON output', () => {
      const prompt = engine.buildFinalPrompt(testState);

      expect(prompt).toContain('rootCause');
      expect(prompt).toContain('fixGuidelines');
      expect(prompt).toContain('confidence');
    });
  });

  describe('parseResponse', () => {
    it('should extract JSON from clean output', () => {
      const output = JSON.stringify({
        thought: 'Analysis complete',
        rootCause: 'Property not initialized',
        fixGuidelines: ['Initialize in onCreate'],
        confidence: 0.9,
      });

      const result = engine.parseResponse(output);

      expect(result.thought).toBe('Analysis complete');
      expect(result.rootCause).toBe('Property not initialized');
      expect(result.fixGuidelines).toEqual(['Initialize in onCreate']);
      expect(result.confidence).toBe(0.9);
    });

    it('should extract JSON with surrounding text', () => {
      const output = `Here's my analysis:
${JSON.stringify({
  thought: 'After reviewing the code',
  action: { tool: 'read_file', parameters: { filePath: 'test.kt', line: 10 } },
})}
That's what I found.`;

      const result = engine.parseResponse(output);

      expect(result.thought).toBe('After reviewing the code');
      expect(result.action).toEqual({
        tool: 'read_file',
        parameters: { filePath: 'test.kt', line: 10 },
      });
    });

    it('should handle null action', () => {
      const output = JSON.stringify({
        thought: 'Final conclusion',
        action: null,
        rootCause: 'Property not initialized',
        fixGuidelines: ['Initialize in onCreate'],
        confidence: 0.9,
      });

      const result = engine.parseResponse(output);

      expect(result.action).toBeNull();
      expect(result.rootCause).toBe('Property not initialized');
    });

    it('should return fallback object if no JSON found', () => {
      const output = 'This is not JSON at all';

      const result = engine.parseResponse(output);

      // Should return fallback with low confidence
      expect(result.thought).toBe('This is not JSON at all');
      expect(result.action).toBeNull();
      expect(result.rootCause).toContain('parsing failed');
      expect(result.confidence).toBe(0.2);
    });
  });

  describe('validateResponse', () => {
    it('should accept valid response with action', () => {
      const response = {
        thought: 'Need more info',
        action: { tool: 'read_file', parameters: {} },
      };

      const result = engine.validateResponse(response);
      expect(result.valid).toBe(true);
    });

    it('should accept valid final response', () => {
      const response = {
        thought: 'Analysis complete',
        action: null,
        rootCause: 'Issue found',
        fixGuidelines: ['Fix it'],
        confidence: 0.8,
      };

      const result = engine.validateResponse(response);
      expect(result.valid).toBe(true);
    });

    it('should reject response without thought', () => {
      const response = {
        action: null,
        rootCause: 'Issue',
      };

      const result = engine.validateResponse(response);
      expect(result.valid).toBe(false);
    });

    it('should reject final response without rootCause', () => {
      const response = {
        thought: 'Done',
        action: null,
        fixGuidelines: [],
        confidence: 0.5,
      };

      const result = engine.validateResponse(response);
      expect(result.valid).toBe(false);
    });

    it('should reject final response without confidence', () => {
      const response = {
        thought: 'Done',
        action: null,
        rootCause: 'Issue',
        fixGuidelines: [],
      };

      const result = engine.validateResponse(response);
      expect(result.valid).toBe(false);
    });
  });

  describe('extractJSON', () => {
    it('should extract JSON from code blocks', () => {
      const text = '```json\n{"key": "value"}\n```';
      const result = engine.extractJSON(text);

      expect(result).toEqual({ key: 'value' });
    });

    it('should extract JSON without code blocks', () => {
      const text = 'Some text {"key": "value"} more text';
      const result = engine.extractJSON(text);

      expect(result).toEqual({ key: 'value' });
    });

    it('should handle nested JSON', () => {
      const text = JSON.stringify({
        outer: {
          inner: { value: 42 },
        },
      });

      const result = engine.extractJSON(text);

      expect(result).toEqual({
        outer: {
          inner: { value: 42 },
        },
      });
    });

    it('should throw for invalid JSON', () => {
      const text = 'This is not JSON';

      expect(() => engine.extractJSON(text)).toThrow('No JSON found in response');
    });
  });
});

