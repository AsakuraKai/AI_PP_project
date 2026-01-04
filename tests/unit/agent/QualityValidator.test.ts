/**
 * Test for QualityValidator - Option C Implementation
 * 
 * Tests quality validation and feedback generation
 * 
 * @author Kai (Backend Developer)
 * @date January 5, 2026
 * @phase Phase 4: Testing & Validation - Option C
 */

import { QualityValidator } from '../../src/agent/QualityValidator';
import { RCAResponse } from '../../src/agent/ResponseValidator';

describe('QualityValidator', () => {
  let validator: QualityValidator;
  
  beforeEach(() => {
    validator = new QualityValidator({
      threshold: 70,
      maxAttempts: 3,
      verboseFeedback: true
    });
  });
  
  describe('Quality Validation', () => {
    it('should pass high-quality response with all critical items', () => {
      const response: RCAResponse = {
        thought: 'Analysis complete',
        action: null,
        rootCause: 'Error in app/build.gradle.kts at line 12: AGP version 8.1.0 is incompatible with Gradle 8.9',
        fixGuidelines: [
          'Update AGP version in gradle/libs.versions.toml at line 8:',
          '```kotlin',
          '// Before:',
          'val agp = "8.1.0"',
          '',
          '// After:',
          'val agp = "8.7.3"',
          '```',
          'Run ./gradlew clean build to verify the fix works'
        ],
        confidence: 0.9
      };
      
      const validation = validator.validate(response, 1);
      
      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(70);
      expect(validation.shouldRegenerate).toBe(false);
    });
    
    it('should fail response missing exact file path', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'The build file has an error with AGP version 8.1.0',
        fixGuidelines: ['Update AGP to 8.7.3'],
        confidence: 0.8
      };
      
      const validation = validator.validate(response, 1);
      
      expect(validation.passed).toBe(false);
      expect(validation.details.breakdown.hasExactFilePath).toBe(false);
    });
    
    it('should fail response with vague version references', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error in build.gradle.kts at line 12',
        fixGuidelines: ['Update to the latest version', 'Rebuild the project'],
        confidence: 0.7
      };
      
      const validation = validator.validate(response, 1);
      
      expect(validation.passed).toBe(false);
      expect(validation.details.breakdown.hasVersionValidation).toBe(false);
    });
    
    it('should recommend regeneration if below threshold and attempts remain', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Generic error message',
        fixGuidelines: ['Fix it'],
        confidence: 0.5
      };
      
      const validation = validator.validate(response, 1);
      
      expect(validation.shouldRegenerate).toBe(true);
      expect(validation.feedback).toContain('CRITICAL MISSING ITEMS');
    });
    
    it('should not recommend regeneration on last attempt', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Generic error',
        fixGuidelines: ['Fix'],
        confidence: 0.5
      };
      
      const validation = validator.validate(response, 3); // Last attempt
      
      expect(validation.shouldRegenerate).toBe(false);
    });
  });
  
  describe('Feedback Generation', () => {
    it('should generate targeted feedback for missing file path', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'AGP version error',
        fixGuidelines: ['Update AGP to 8.7.3'],
        confidence: 0.7
      };
      
      const validation = validator.validate(response, 1);
      
      expect(validation.feedback).toContain('Exact file path with line number');
      expect(validation.feedback).toContain('app/build.gradle.kts at line 12');
    });
    
    it('should generate targeted feedback for missing version numbers', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error in build.gradle.kts at line 12',
        fixGuidelines: ['Update to latest version'],
        confidence: 0.7
      };
      
      const validation = validator.validate(response, 1);
      
      expect(validation.feedback).toContain('Specific version numbers');
      expect(validation.feedback).toContain('AGP 8.7.3');
    });
    
    it('should include examples in feedback for first attempt', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error',
        fixGuidelines: ['Fix'],
        confidence: 0.5
      };
      
      const validation = validator.validate(response, 1);
      
      expect(validation.feedback).toContain('EXAMPLE OF HIGH-QUALITY RESPONSE');
    });
    
    it('should provide stricter guidance for second attempt', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error',
        fixGuidelines: ['Fix'],
        confidence: 0.5
      };
      
      const validation = validator.validate(response, 2);
      
      expect(validation.feedback).toContain('LAST ATTEMPT');
      expect(validation.feedback).toContain('Be very specific');
    });
  });
  
  describe('Score Calculation', () => {
    it('should award correct points for each criterion', () => {
      const baseResponse: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: '',
        fixGuidelines: [],
        confidence: 0.8
      };
      
      // Test file path (30 points)
      const withFilePath = {
        ...baseResponse,
        rootCause: 'Error in app/build.gradle.kts at line 12',
        fixGuidelines: ['Fix']
      };
      const validation1 = validator.validate(withFilePath, 1);
      expect(validation1.details.breakdown.hasExactFilePath).toBe(true);
      expect(validation1.score).toBeGreaterThanOrEqual(30);
      
      // Test version validation (25 points)
      const withVersion = {
        ...withFilePath,
        rootCause: 'Error in app/build.gradle.kts at line 12: AGP 8.1.0',
        fixGuidelines: ['Update to AGP 8.7.3']
      };
      const validation2 = validator.validate(withVersion, 1);
      expect(validation2.details.breakdown.hasVersionValidation).toBe(true);
      expect(validation2.score).toBeGreaterThanOrEqual(55);
      
      // Test code example (20 points)
      const withCode = {
        ...withVersion,
        fixGuidelines: [
          '```kotlin',
          '// Before:',
          'val agp = "8.1.0"',
          '// After:',
          'val agp = "8.7.3"',
          '```'
        ]
      };
      const validation3 = validator.validate(withCode, 1);
      expect(validation3.details.breakdown.hasCodeExample).toBe(true);
      expect(validation3.score).toBeGreaterThanOrEqual(75);
    });
    
    it('should calculate potential improvement correctly', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Generic error',
        fixGuidelines: ['Fix'],
        confidence: 0.5
      };
      
      const validation = validator.validate(response, 1);
      const potential = validator.calculatePotentialImprovement(validation);
      
      // Should be close to 100 since almost everything is missing
      expect(potential).toBeGreaterThan(80);
    });
  });
  
  describe('Utility Methods', () => {
    it('should generate correct summary', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error in app/build.gradle.kts at line 12: AGP 8.1.0',
        fixGuidelines: ['Update to 8.7.3'],
        confidence: 0.8
      };
      
      const validation = validator.validate(response, 1);
      const summary = validator.getSummary(validation);
      
      expect(summary).toContain('Score:');
      expect(summary).toContain('Attempt');
    });
    
    it('should extract improvement suggestions', () => {
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error in build.gradle.kts at line 12',
        fixGuidelines: ['Fix it'],
        confidence: 0.7
      };
      
      const validation = validator.validate(response, 1);
      const suggestions = validator.getImprovementSuggestions(validation);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('version'))).toBe(true);
    });
    
    it('should check if response is good enough', () => {
      const goodResponse: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error in app/build.gradle.kts at line 12: AGP 8.1.0 incompatible with Gradle 8.9',
        fixGuidelines: [
          'Update AGP to 8.7.3 in gradle/libs.versions.toml at line 8',
          '```kotlin\nval agp = "8.7.3"\n```',
          'Run ./gradlew clean build'
        ],
        confidence: 0.9
      };
      
      expect(validator.isGoodEnough(goodResponse)).toBe(true);
      
      const badResponse: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error',
        fixGuidelines: ['Fix'],
        confidence: 0.5
      };
      
      expect(validator.isGoodEnough(badResponse)).toBe(false);
    });
  });
  
  describe('Configuration', () => {
    it('should respect custom threshold', () => {
      const strictValidator = new QualityValidator({
        threshold: 90,
        maxAttempts: 3
      });
      
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error in app/build.gradle.kts at line 12: AGP 8.1.0',
        fixGuidelines: ['Update to 8.7.3'],
        confidence: 0.8
      };
      
      const validation = strictValidator.validate(response, 1);
      
      // Should fail with 90% threshold (score likely around 55-60)
      expect(validation.passed).toBe(false);
    });
    
    it('should respect max attempts setting', () => {
      const limitedValidator = new QualityValidator({
        threshold: 70,
        maxAttempts: 2
      });
      
      const response: RCAResponse = {
        thought: 'Analysis',
        action: null,
        rootCause: 'Error',
        fixGuidelines: ['Fix'],
        confidence: 0.5
      };
      
      const validation1 = limitedValidator.validate(response, 1);
      expect(validation1.shouldRegenerate).toBe(true);
      
      const validation2 = limitedValidator.validate(response, 2);
      expect(validation2.shouldRegenerate).toBe(false); // Last attempt
    });
  });
});
