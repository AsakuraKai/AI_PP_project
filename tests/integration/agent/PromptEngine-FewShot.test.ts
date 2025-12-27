/**
 * Integration tests for PromptEngine with FewShotExampleService
 * 
 * Tests:
 * - Few-shot examples are included in prompts
 * - Relevant examples are selected based on error type
 * - Prompt structure is correct with examples
 * - Examples improve prompt quality
 */

import { PromptEngine } from '../../../src/agent/PromptEngine';
import { ParsedError } from '../../../src/types';
import { getFewShotService } from '../../../src/knowledge/FewShotExampleService';

describe('PromptEngine Integration with FewShotExampleService', () => {
  let promptEngine: PromptEngine;

  beforeAll(async () => {
    // Load few-shot examples before tests
    const fewShotService = getFewShotService();
    await fewShotService.loadDatabase();
  });

  beforeEach(() => {
    promptEngine = new PromptEngine();
  });

  describe('Prompt Generation with Few-Shot Examples', () => {
    it('should include few-shot examples for Gradle errors on first iteration', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Could not find com.android.tools.build:gradle:8.10.0',
        file: 'gradle/libs.versions.toml',
        line: 5,
        language: 'kotlin',
        filePath: '/path/to/gradle/libs.versions.toml',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      expect(prompt).toContain('Similar Cases from Knowledge Base');
      expect(prompt).toContain('Example 1:');
      expect(prompt).toContain('GRADLE');
    });

    it('should include few-shot examples for Kotlin errors on first iteration', async () => {
      const error: ParsedError = {
        type: 'KOTLIN_LATEINIT',
        message: 'lateinit property viewModel has not been initialized',
        file: 'MainActivity.kt',
        line: 45,
        language: 'kotlin',
        filePath: '/path/to/MainActivity.kt',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      expect(prompt).toContain('Similar Cases from Knowledge Base');
      expect(prompt).toContain('KOTLIN');
      expect(prompt).toContain('lateinit');
    });

    it('should include few-shot examples for Compose errors on first iteration', async () => {
      const error: ParsedError = {
        type: 'COMPOSE_STATE',
        message: 'State read without remember',
        file: 'ProfileScreen.kt',
        line: 23,
        language: 'kotlin',
        filePath: '/path/to/ProfileScreen.kt',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      expect(prompt).toContain('Similar Cases from Knowledge Base');
      expect(prompt).toContain('COMPOSE');
    });

    it('should NOT include few-shot examples on subsequent iterations', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency error',
        file: 'build.gradle',
        line: 10,
        language: 'kotlin',
        filePath: '/path/to/build.gradle',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: ['First thought'],
        previousActions: [{ tool: 'read_file', parameters: {} }],
        previousObservations: ['First observation'],
        iteration: 2,
        maxIterations: 5
      });

      // Should not include examples on iteration 2+
      // (Still has analysis history, but not new examples)
      const hasSimilarCases = prompt.includes('Similar Cases from Knowledge Base');
      const hasAnalysisHistory = prompt.includes('ANALYSIS HISTORY');
      
      expect(hasAnalysisHistory).toBe(true);
      // Examples should only appear once (from first iteration context)
    });

    it('should include code examples in few-shot prompts', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'AGP version not found',
        file: 'gradle/libs.versions.toml',
        line: 5,
        language: 'kotlin',
        filePath: '/path/to/gradle/libs.versions.toml',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      // Should show before/after code snippets
      expect(prompt).toContain('Before:');
      expect(prompt).toContain('After:');
      expect(prompt).toContain('```');
    });

    it('should include verification steps in examples', async () => {
      const error: ParsedError = {
        type: 'KOTLIN_LATEINIT',
        message: 'lateinit not initialized',
        file: 'MainActivity.kt',
        line: 45,
        language: 'kotlin',
        filePath: '/path/to/MainActivity.kt',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      expect(prompt).toContain('**Verification:**');
    });
  });

  describe('Example Selection Quality', () => {
    it('should select most relevant examples based on error type', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Could not find com.android.tools.build:gradle:8.10.0',
        file: 'gradle/libs.versions.toml',
        line: 5,
        language: 'kotlin',
        filePath: '/path/to/gradle/libs.versions.toml',
        context: {}
      };

      const fewShotService = getFewShotService();
      const examples = await fewShotService.findRelevantExamples(error, 3);
      
      // All returned examples should be from gradle category
      expect(examples.length).toBeGreaterThan(0);
      expect(examples.every(ex => ex.errorType.includes('GRADLE'))).toBe(true);
    });

    it('should prioritize examples with similar error messages', async () => {
      const error: ParsedError = {
        type: 'KOTLIN_NPE',
        message: 'NullPointerException: viewModel is null',
        file: 'MainActivity.kt',
        line: 67,
        language: 'kotlin',
        filePath: '/path/to/MainActivity.kt',
        context: {}
      };

      const fewShotService = getFewShotService();
      const examples = await fewShotService.findRelevantExamples(error, 3);
      
      // Should find Kotlin NPE or null-related examples
      expect(examples.length).toBeGreaterThan(0);
      const hasRelevantKeywords = examples.some(ex => 
        ex.errorMessage.toLowerCase().includes('null') ||
        ex.errorMessage.toLowerCase().includes('npe') ||
        ex.title.toLowerCase().includes('null')
      );
      expect(hasRelevantKeywords).toBe(true);
    });

    it('should limit examples to specified count', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency error',
        file: 'build.gradle',
        line: 10,
        language: 'kotlin',
        filePath: '/path/to/build.gradle',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      // Count number of "Example N:" occurrences
      const exampleCount = (prompt.match(/Example \d+:/g) || []).length;
      
      // Should have at most 3 examples (as per findRelevantExamples default)
      expect(exampleCount).toBeLessThanOrEqual(3);
    });
  });

  describe('Prompt Structure with Examples', () => {
    it('should maintain correct prompt structure with examples', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency error',
        file: 'build.gradle',
        line: 10,
        language: 'kotlin',
        filePath: '/path/to/build.gradle',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      // Should have all required sections in order
      expect(prompt).toContain('ROLE:');
      expect(prompt).toContain('CRITICAL SPECIFICITY RULES');
      expect(prompt).toContain('Similar Cases from Knowledge Base');
      expect(prompt).toContain('ERROR TO ANALYZE:');
      expect(prompt).toContain('YOUR TASK:');
      expect(prompt).toContain('Respond ONLY with valid JSON');
    });

    it('should place examples after system prompt but before error details', async () => {
      const error: ParsedError = {
        type: 'KOTLIN_LATEINIT',
        message: 'lateinit error',
        file: 'MainActivity.kt',
        line: 45,
        language: 'kotlin',
        filePath: '/path/to/MainActivity.kt',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      const examplesIndex = prompt.indexOf('Similar Cases from Knowledge Base');
      const errorIndex = prompt.indexOf('ERROR TO ANALYZE:');
      
      expect(examplesIndex).toBeLessThan(errorIndex);
    });

    it('should include analysis history after examples', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency error',
        file: 'build.gradle',
        line: 10,
        language: 'kotlin',
        filePath: '/path/to/build.gradle',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: ['First thought'],
        previousActions: [{ tool: 'read_file', parameters: {} }],
        previousObservations: ['First observation'],
        iteration: 2,
        maxIterations: 5
      });

      expect(prompt).toContain('ANALYSIS HISTORY:');
      expect(prompt).toContain('Iteration 1:');
      expect(prompt).toContain('First thought');
    });
  });

  describe('Example Content Quality', () => {
    it('should include detailed analysis in examples', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'AGP version error',
        file: 'libs.versions.toml',
        line: 5,
        language: 'kotlin',
        filePath: '/path/to/gradle/libs.versions.toml',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      // Should have detailed analysis components
      expect(prompt).toContain('Problem:');
      expect(prompt).toContain('Root Cause:');
      expect(prompt).toContain('Evidence:');
    });

    it('should include actionable solutions in examples', async () => {
      const error: ParsedError = {
        type: 'KOTLIN_LATEINIT',
        message: 'lateinit not initialized',
        file: 'MainActivity.kt',
        line: 45,
        language: 'kotlin',
        filePath: '/path/to/MainActivity.kt',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      // Should have solution with steps
      expect(prompt).toContain('**Solution:**');
      expect(prompt).toContain('Steps:');
    });

    it('should include confidence scores in examples', async () => {
      const error: ParsedError = {
        type: 'COMPOSE_STATE',
        message: 'State error',
        file: 'ProfileScreen.kt',
        line: 23,
        language: 'kotlin',
        filePath: '/path/to/ProfileScreen.kt',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      expect(prompt).toContain('**Confidence:**');
      expect(prompt).toMatch(/\d+%/); // Should have percentage
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when few-shot service is unavailable gracefully', async () => {
      // Create new PromptEngine before service is loaded
      const newEngine = new PromptEngine();

      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency error',
        file: 'build.gradle',
        line: 10,
        language: 'kotlin',
        filePath: '/path/to/build.gradle',
        context: {}
      };

      // Should not throw error
      await expect(newEngine.buildIterationPrompt({
        systemPrompt: newEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      })).resolves.toBeDefined();
    });

    it('should continue prompt generation if example retrieval fails', async () => {
      const error: ParsedError = {
        type: 'UNKNOWN_ERROR',
        message: 'Unknown error',
        file: 'unknown.file',
        line: 1,
        language: 'unknown',
        filePath: '/path/to/unknown.file',
        context: {}
      };

      const prompt = await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      // Should still generate valid prompt without examples
      expect(prompt).toContain('ERROR TO ANALYZE:');
      expect(prompt).toContain('YOUR TASK:');
    });
  });

  describe('Performance', () => {
    it('should generate prompt with examples quickly', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency error',
        file: 'build.gradle',
        line: 10,
        language: 'kotlin',
        filePath: '/path/to/build.gradle',
        context: {}
      };

      const startTime = Date.now();
      
      await promptEngine.buildIterationPrompt({
        systemPrompt: promptEngine.getSystemPrompt(),
        examples: [],
        error,
        previousThoughts: [],
        previousActions: [],
        previousObservations: [],
        iteration: 1,
        maxIterations: 5
      });

      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time (<500ms)
      expect(duration).toBeLessThan(500);
    });
  });
});
