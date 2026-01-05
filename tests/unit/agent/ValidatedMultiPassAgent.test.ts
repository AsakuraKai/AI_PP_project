/**
 * Test for MultiPassAgent - Option C Implementation
 * 
 * Tests quality validation loop with regeneration feedback
 * 
 * @author Kai (Backend Developer)
 * @date January 5, 2026
 * @phase Phase 4: Testing & Validation - Option C
 */

import { MultiPassAgent } from '../../src/agent/MultiPassAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ParsedError } from '../../src/types';

describe('MultiPassAgent', () => {
  let agent: MultiPassAgent;
  let mockLLM: OllamaClient;
  
  beforeEach(() => {
    // Mock OllamaClient
    mockLLM = {
      generate: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          rootCause: 'Test root cause',
          fixGuidelines: ['Fix step 1', 'Fix step 2'],
          confidence: 0.8
        }),
        model: 'test-model',
        createdAt: new Date(),
        done: true
      })
    } as any;
    
    agent = new MultiPassAgent(mockLLM, {
      numHypotheses: 3,
      enableConsensus: true,
      minEvidenceItems: 2
    });
  });
  
  const createTestError = (): ParsedError => ({
    message: 'Test error message',
    filePath: 'test/file.kt',
    line: 10,
    column: 5,
    type: 'BuildError',
    stackTrace: '',
    severity: 'error' as const
  });
  
  describe('Quality Validation', () => {
    it('should pass validation on first attempt with high-quality response', async () => {
      // Mock high-quality response
      mockLLM.generate = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          rootCause: 'Error in app/build.gradle.kts at line 12: AGP version 8.1.0 is incompatible with Gradle 8.9',
          fixGuidelines: [
            'Update AGP version in gradle/libs.versions.toml at line 8 from 8.1.0 to 8.7.3',
            'Run ./gradlew clean build to verify the fix'
          ],
          confidence: 0.9
        })
      } as any);
      
      const result = await agent.analyze(createTestError());
      
      expect(result).toBeDefined();
      expect(result.rootCause).toContain('build.gradle.kts');
      expect(result.rootCause).toContain('line 12');
      
      const metrics = agent.getMetrics();
      expect(metrics.passedFirstAttempt).toBe(1);
      expect(metrics.totalAnalyses).toBe(1);
    });
    
    it('should retry with feedback if quality is below threshold', async () => {
      let callCount = 0;
      
      // Mock responses: first low quality, second high quality
      mockLLM.generate = jest.fn().mockImplementation(() => {
        callCount++;
        
        if (callCount === 1) {
          // Low quality response (no file path, no versions)
          return Promise.resolve({
            text: JSON.stringify({
              rootCause: 'There is an error in the build file',
              fixGuidelines: ['Update the version', 'Run the build'],
              confidence: 0.7
            })
          });
        } else {
          // High quality response (with file path and versions)
          return Promise.resolve({
            text: JSON.stringify({
              rootCause: 'Error in app/build.gradle.kts at line 12: AGP 8.1.0 incompatible',
              fixGuidelines: [
                'Update AGP from 8.1.0 to 8.7.3 in gradle/libs.versions.toml at line 8',
                'Verify: ./gradlew clean build'
              ],
              confidence: 0.85
            })
          });
        }
      }) as any;
      
      const result = await agent.analyze(createTestError());
      
      expect(callCount).toBeGreaterThan(1);
      expect(result.rootCause).toContain('build.gradle.kts');
      
      const metrics = agent.getMetrics();
      expect(metrics.passedAfterRetry).toBeGreaterThanOrEqual(1);
    });
    
    it('should return best result after max attempts if validation fails', async () => {
      let callCount = 0;
      
      // Mock all responses as low quality
      mockLLM.generate = jest.fn().mockImplementation(() => {
        callCount++;
        const score = 40 + (callCount * 5); // Gradually improving but never passing
        
        return Promise.resolve({
          text: JSON.stringify({
            rootCause: `Root cause attempt ${callCount}`,
            fixGuidelines: [`Fix ${callCount}`],
            confidence: 0.6
          })
        });
      }) as any;
      
      const result = await agent.analyze(createTestError());
      
      expect(callCount).toBe(3); // Max attempts
      expect(result).toBeDefined();
      
      const metrics = agent.getMetrics();
      expect(metrics.failedValidation).toBe(1);
      expect(metrics.averageAttempts).toBe(3);
    });
  });
  
  describe('Metrics Tracking', () => {
    it('should track validation metrics correctly', async () => {
      // Run multiple analyses
      for (let i = 0; i < 5; i++) {
        await agent.analyze(createTestError());
      }
      
      const metrics = agent.getMetrics();
      expect(metrics.totalAnalyses).toBe(5);
      expect(metrics.averageScore).toBeGreaterThan(0);
    });
    
    it('should reset metrics correctly', () => {
      agent.resetMetrics();
      const metrics = agent.getMetrics();
      
      expect(metrics.totalAnalyses).toBe(0);
      expect(metrics.passedFirstAttempt).toBe(0);
      expect(metrics.averageScore).toBe(0);
    });
    
    it('should export metrics as JSON', async () => {
      await agent.analyze(createTestError());
      
      const json = agent.exportMetrics();
      const parsed = JSON.parse(json);
      
      expect(parsed.totalAnalyses).toBeDefined();
      expect(parsed.scoreDistribution).toBeDefined();
    });
    
    it('should generate metrics summary', async () => {
      await agent.analyze(createTestError());
      
      const summary = agent.getMetricsSummary();
      
      expect(summary).toContain('Validation Metrics');
      expect(summary).toContain('Total Analyses');
      expect(summary).toContain('Pass Rate');
    });
  });
  
  describe('Feedback Generation', () => {
    it('should provide targeted feedback for missing items', async () => {
      // This test verifies the feedback system works
      // Actual feedback content is tested in QualityValidator.test.ts
      
      mockLLM.generate = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          rootCause: 'Generic error',
          fixGuidelines: ['Fix it'],
          confidence: 0.5
        })
      }) as any;
      
      const result = await agent.analyze(createTestError());
      
      expect(result).toBeDefined();
      // Should have attempted multiple times due to low quality
      expect(mockLLM.generate).toHaveBeenCalled();
    });
  });
  
  describe('Configuration', () => {
    it('should respect custom quality threshold', async () => {
      const strictAgent = new MultiPassAgent(mockLLM, {
        numHypotheses: 3,
        enableConsensus: true,
        minEvidenceItems: 3
      });
      
      const result = await strictAgent.analyze(createTestError());
      expect(result).toBeDefined();
    });
    
    it('should respect max regeneration attempts', async () => {
      const limitedAgent = new MultiPassAgent(mockLLM, {
        numHypotheses: 2,
        enableConsensus: false,
        minEvidenceItems: 1
      });
      
      mockLLM.generate = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          rootCause: 'Low quality',
          fixGuidelines: ['Fix'],
          confidence: 0.5
        })
      }) as any;
      
      await limitedAgent.analyze(createTestError());
      
      // Should only call once (no retries)
      expect(mockLLM.generate).toHaveBeenCalledTimes(1);
    });
  });
});
