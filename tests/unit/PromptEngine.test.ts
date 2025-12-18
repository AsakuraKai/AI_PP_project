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

  describe('buildInitialPrompt', () => {
    const testError: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin',
    };

    it('should include error information', () => {
      const prompt = engine.buildInitialPrompt(testError);

      expect(prompt).toContain('lateinit');
      expect(prompt).toContain('MainActivity.kt');
      expect(prompt).toContain('45');
    });

    it('should include system prompt', () => {
      const prompt = engine.buildInitialPrompt(testError);
      const systemPrompt = engine.getSystemPrompt();

      expect(prompt).toContain(systemPrompt);
    });

    it('should include few-shot examples for known error types', () => {
      const prompt = engine.buildInitialPrompt(testError);

      expect(prompt).toContain('EXAMPLES');
    });

    it('should include code context when provided', () => {
      const fileContent = 'private lateinit var user: User\nval name = user.name';
      const prompt = engine.buildInitialPrompt(testError, fileContent);

      expect(prompt).toContain('CODE CONTEXT');
      expect(prompt).toContain(fileContent);
    });

    it('should work without code context', () => {
      const prompt = engine.buildInitialPrompt(testError, null);

      expect(prompt).toBeTruthy();
      expect(prompt).not.toContain('CODE CONTEXT');
    });

    it('should include metadata when present', () => {
      const errorWithMetadata: ParsedError = {
        ...testError,
        metadata: { propertyName: 'user' },
      };

      const prompt = engine.buildInitialPrompt(errorWithMetadata);

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
      hypothesis: 'Property not initialized in onCreate',
      rootCause: null,
      converged: false,
      error: testError,
    };

    it('should include iteration progress', () => {
      const prompt = engine.buildIterationPrompt(
        testError,
        testState,
        'Continuing analysis',
        'New observation'
      );

      expect(prompt).toContain('Iteration 2/3');
    });

    it('should include analysis history', () => {
      const prompt = engine.buildIterationPrompt(
        testError,
        testState,
        'Continuing analysis',
        'New observation'
      );

      expect(prompt).toContain('ANALYSIS SO FAR');
      expect(prompt).toContain('Initial hypothesis');
      expect(prompt).toContain('File content shows property');
    });

    it('should include latest observation', () => {
      const prompt = engine.buildIterationPrompt(
        testError,
        testState,
        'Continuing analysis',
        'New observation about initialization'
      );

      expect(prompt).toContain('LATEST OBSERVATION');
      expect(prompt).toContain('New observation about initialization');
    });

    it('should work without observation', () => {
      const prompt = engine.buildIterationPrompt(
        testError,
        testState,
        'Continuing analysis'
      );

      expect(prompt).toBeTruthy();
      expect(prompt).not.toContain('LATEST OBSERVATION');
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
      thoughts: ['Hypothesis 1', 'Hypothesis 2', 'Final hypothesis'],
      actions: [],
      observations: ['Observation 1', 'Observation 2', 'Observation 3'],
      hypothesis: 'Property not initialized',
      rootCause: null,
      converged: false,
      error: testError,
    };

    it('should request final analysis', () => {
      const prompt = engine.buildFinalPrompt(testError, testState);

      expect(prompt).toContain('FINAL ANALYSIS');
      expect(prompt).toContain('Synthesize');
    });

    it('should include complete history', () => {
      const prompt = engine.buildFinalPrompt(testError, testState);

      expect(prompt).toContain('COMPLETE ANALYSIS HISTORY');
      expect(prompt).toContain('Hypothesis 1');
      expect(prompt).toContain('Hypothesis 2');
      expect(prompt).toContain('Final hypothesis');
      expect(prompt).toContain('Observation 1');
      expect(prompt).toContain('Observation 2');
    });

    it('should specify required output fields', () => {
      const prompt = engine.buildFinalPrompt(testError, testState);

      expect(prompt).toContain('rootCause');
      expect(prompt).toContain('fixGuidelines');
      expect(prompt).toContain('confidence');
      expect(prompt).toContain('action: null');
    });
  });

  describe('buildToolPrompt', () => {
    it('should list available tools', () => {
      const tools = ['read_file', 'find_callers', 'get_symbol_info'];
      const prompt = engine.buildToolPrompt(tools);

      expect(prompt).toContain('AVAILABLE TOOLS');
      expect(prompt).toContain('read_file');
      expect(prompt).toContain('find_callers');
      expect(prompt).toContain('get_symbol_info');
    });

    it('should include usage instructions', () => {
      const tools = ['read_file'];
      const prompt = engine.buildToolPrompt(tools);

      expect(prompt).toContain('tool_name');
      expect(prompt).toContain('parameters');
      expect(prompt).toContain('action');
    });

    it('should handle empty tool list', () => {
      const prompt = engine.buildToolPrompt([]);

      expect(prompt).toBeTruthy();
    });
  });

  describe('extractJSON', () => {
    it('should extract valid JSON', () => {
      const response = '{"thought": "test", "action": null}';
      const json = engine.extractJSON(response);

      expect(json).toEqual({ thought: 'test', action: null });
    });

    it('should extract JSON with extra text before', () => {
      const response = 'Here is my analysis: {"thought": "test", "action": null}';
      const json = engine.extractJSON(response);

      expect(json).toEqual({ thought: 'test', action: null });
    });

    it('should extract JSON with extra text after', () => {
      const response = '{"thought": "test", "action": null} - end of analysis';
      const json = engine.extractJSON(response);

      expect(json).toEqual({ thought: 'test', action: null });
    });

    it('should extract JSON with markdown formatting', () => {
      const response = '```json\n{"thought": "test", "action": null}\n```';
      const json = engine.extractJSON(response);

      expect(json).toEqual({ thought: 'test', action: null });
    });

    it('should throw error when no JSON found', () => {
      const response = 'No JSON here';

      expect(() => engine.extractJSON(response)).toThrow('No JSON found');
    });

    it('should throw error for invalid JSON', () => {
      const response = '{"thought": "test", action: null}'; // Missing quotes

      expect(() => engine.extractJSON(response)).toThrow('Invalid JSON');
    });
  });

  describe('validateResponse', () => {
    it('should validate correct response with action', () => {
      const response = {
        thought: 'Analyzing error',
        action: { tool: 'read_file', parameters: { filePath: 'test.kt' } },
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate correct final response', () => {
      const response = {
        thought: 'Final analysis',
        action: null,
        rootCause: 'Property not initialized',
        fixGuidelines: ['Initialize in onCreate'],
        confidence: 0.9,
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(true);
    });

    it('should reject response without thought', () => {
      const response = {
        action: null,
        rootCause: 'Test',
        fixGuidelines: ['Fix it'],
        confidence: 0.8,
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('thought');
    });

    it('should reject final response without rootCause', () => {
      const response = {
        thought: 'Analysis',
        action: null,
        fixGuidelines: ['Fix it'],
        confidence: 0.8,
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('rootCause');
    });

    it('should reject final response without fixGuidelines', () => {
      const response = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error',
        confidence: 0.8,
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('fixGuidelines');
    });

    it('should reject final response with empty fixGuidelines', () => {
      const response = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error',
        fixGuidelines: [],
        confidence: 0.8,
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('fixGuidelines');
    });

    it('should reject final response with invalid confidence', () => {
      const response = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error',
        fixGuidelines: ['Fix'],
        confidence: 1.5, // Invalid
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('confidence');
    });

    it('should reject response with action missing tool', () => {
      const response = {
        thought: 'Analysis',
        action: { parameters: {} }, // Missing tool
      };

      const result = engine.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('tool');
    });

    it('should reject non-object response', () => {
      const result = engine.validateResponse('not an object');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('object');
    });

    it('should reject null response', () => {
      const result = engine.validateResponse(null);

      expect(result.valid).toBe(false);
    });
  });
});
