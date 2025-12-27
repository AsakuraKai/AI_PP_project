/**
 * Unit tests for FewShotExampleService
 * 
 * Tests:
 * - Database loading
 * - Relevant example retrieval  
 * - Example formatting for prompts
 * - Statistics generation
 */

import { FewShotExampleService, getFewShotService } from '../../../src/knowledge/FewShotExampleService';
import { ParsedError } from '../../../src/types';

describe('FewShotExampleService', () => {
  let service: FewShotExampleService;

  beforeEach(() => {
    service = new FewShotExampleService();
  });

  describe('Database Loading', () => {
    it('should load the few-shot examples database successfully', async () => {
      await expect(service.loadDatabase()).resolves.not.toThrow();
      
      const stats = service.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats!.totalExamples).toBeGreaterThan(0);
    });

    it('should load at least 39 examples as per Chunk 4 requirements', async () => {
      await service.loadDatabase();
      
      const stats = service.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats!.totalExamples).toBeGreaterThanOrEqual(39);
    });

    it('should have examples in all required categories', async () => {
      await service.loadDatabase();
      
      const stats = service.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats!.byCategory).toHaveProperty('gradle');
      expect(stats!.byCategory).toHaveProperty('kotlin');
      expect(stats!.byCategory).toHaveProperty('compose');
      expect(stats!.byCategory).toHaveProperty('xml');
      expect(stats!.byCategory).toHaveProperty('manifest');
    });

    it('should have at least 15 Gradle examples', async () => {
      await service.loadDatabase();
      
      const gradleExamples = service.getExamplesByCategory('gradle');
      expect(gradleExamples.length).toBeGreaterThanOrEqual(15);
    });

    it('should have at least 15 Kotlin examples', async () => {
      await service.loadDatabase();
      
      const kotlinExamples = service.getExamplesByCategory('kotlin');
      expect(kotlinExamples.length).toBeGreaterThanOrEqual(15);
    });

    it('should calculate average confidence score', async () => {
      await service.loadDatabase();
      
      const stats = service.getStatistics();
      expect(stats).not.toBeNull();
      expect(stats!.avgConfidence).toBeGreaterThan(0);
      expect(stats!.avgConfidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Relevant Example Retrieval', () => {
    beforeEach(async () => {
      await service.loadDatabase();
    });

    it('should find relevant examples for Gradle AGP version error', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Could not find com.android.tools.build:gradle:8.10.0',
        filePath: 'gradle/libs.versions.toml',
        line: 5,
        language: 'kotlin',
        metadata: {
          projectType: 'android',
          buildTool: 'gradle'
        }
      };

      const examples = await service.findRelevantExamples(error, 3);
      
      expect(examples.length).toBeGreaterThan(0);
      expect(examples.length).toBeLessThanOrEqual(3);
      expect(examples[0].errorType).toBe('GRADLE_DEPENDENCY');
    });

    it('should find relevant examples for Kotlin lateinit error', async () => {
      const error: ParsedError = {
        type: 'KOTLIN_LATEINIT',
        message: 'lateinit property viewModel has not been initialized',
        filePath: 'MainActivity.kt',
        line: 45,
        language: 'kotlin'
      };

      const examples = await service.findRelevantExamples(error, 3);
      
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].errorType).toBe('KOTLIN_LATEINIT');
    });

    it('should return empty array for unsupported error types', async () => {
      const error: ParsedError = {
        type: 'UNKNOWN_ERROR_TYPE',
        message: 'Some unknown error',
        filePath: 'UnknownFile.java',
        line: 1,
        language: 'java'
      };

      const examples = await service.findRelevantExamples(error, 3);
      
      expect(examples).toEqual([]);
    });

    it('should limit results to maxExamples parameter', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency resolution failed',
        filePath: 'build.gradle',
        line: 10,
        language: 'kotlin'
      };

      const examples1 = await service.findRelevantExamples(error, 1);
      const examples3 = await service.findRelevantExamples(error, 3);
      
      expect(examples1.length).toBeLessThanOrEqual(1);
      expect(examples3.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Example Formatting', () => {
    beforeEach(async () => {
      await service.loadDatabase();
    });

    it('should format examples for LLM prompt', async () => {
      const error: ParsedError = {
        type: 'GRADLE_DEPENDENCY',
        message: 'Dependency not found',
        filePath: 'build.gradle',
        line: 10,
        language: 'kotlin'
      };

      const examples = await service.findRelevantExamples(error, 2);
      const formatted = service.formatExamplesForPrompt(examples);
      
      expect(formatted).toContain('Similar Cases from Knowledge Base');
      expect(formatted).toContain('Example 1:');
      expect(formatted).toContain('**Error Type:**');
      expect(formatted).toContain('**Analysis:**');
      expect(formatted).toContain('**Solution:**');
      expect(formatted).toContain('**Confidence:**');
    });

    it('should return empty string for no examples', () => {
      const formatted = service.formatExamplesForPrompt([]);
      expect(formatted).toBe('');
    });
  });

  describe('Example Retrieval by ID', () => {
    beforeEach(async () => {
      await service.loadDatabase();
    });

    it('should retrieve example by ID', async () => {
      const example = service.getExampleById('gradle-001');
      
      expect(example).not.toBeNull();
      expect(example!.id).toBe('gradle-001');
      expect(example!.errorType).toContain('GRADLE');
    });

    it('should return null for non-existent ID', async () => {
      const example = service.getExampleById('non-existent-id');
      expect(example).toBeNull();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await service.loadDatabase();
    });

    it('should return accurate total example count', async () => {
      const stats = service.getStatistics();
      const totalCount = service.getTotalExampleCount();
      
      expect(stats).not.toBeNull();
      expect(stats!.totalExamples).toBe(totalCount);
    });

    it('should calculate realistic average confidence', async () => {
      const stats = service.getStatistics();
      
      expect(stats).not.toBeNull();
      // Confidence should be between 85-99 based on Chunk 4 examples
      expect(stats!.avgConfidence).toBeGreaterThanOrEqual(85);
      expect(stats!.avgConfidence).toBeLessThanOrEqual(99);
    });

    it('should return null statistics before loading', () => {
      const newService = new FewShotExampleService();
      const stats = newService.getStatistics();
      
      expect(stats).toBeNull();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getFewShotService', () => {
      const service1 = getFewShotService();
      const service2 = getFewShotService();
      
      expect(service1).toBe(service2);
    });

    it('should share loaded state across singleton instances', async () => {
      const service1 = getFewShotService();
      await service1.loadDatabase();
      
      const service2 = getFewShotService();
      const stats = service2.getStatistics();
      
      expect(stats).not.toBeNull();
      expect(stats!.totalExamples).toBeGreaterThan(0);
    });
  });
});
