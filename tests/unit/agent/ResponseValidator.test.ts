/**
 * Tests for ResponseValidator
 * 
 * Validates the validator itself - ensures it correctly scores
 * RCA responses for specificity according to Chunk 3 requirements.
 */

import { ResponseValidator, RCAResponse } from '../../../src/agent/ResponseValidator';

describe('ResponseValidator', () => {
  let validator: ResponseValidator;

  beforeEach(() => {
    validator = new ResponseValidator();
  });

  describe('Basic Validation', () => {
    it('should validate intermediate response (action not null)', () => {
      const response: RCAResponse = {
        thought: 'Need to check the version',
        action: { tool: 'version_lookup', parameters: { queryType: 'exists', toolType: 'agp', version: '8.10.0' } },
      };

      const result = validator.validateResponse(response);

      expect(result.valid).toBe(true);
      expect(result.specificityScore).toBe(0); // Not applicable
      expect(result.strengths).toContain('Still analyzing - not yet concluded');
    });

    it('should validate complete response with all fields', () => {
      const response: RCAResponse = {
        thought: 'Found the issue',
        action: null,
        rootCause: 'AGP version 8.10.0 does not exist',
        fixGuidelines: ['Update gradle/libs.versions.toml at line 5 to AGP 8.7.3'],
        confidence: 0.95,
      };

      const result = validator.validateResponse(response);

      expect(result.valid).toBe(true);
    });

    it('should reject response missing root cause', () => {
      const response: RCAResponse = {
        thought: 'Analysis complete',
        action: null,
        fixGuidelines: ['Fix it'],
        confidence: 0.8,
      };

      const result = validator.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing or empty root cause explanation');
    });

    it('should reject response missing fix guidelines', () => {
      const response: RCAResponse = {
        thought: 'Analysis complete',
        action: null,
        rootCause: 'Something is wrong',
        confidence: 0.8,
      };

      const result = validator.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing or empty fix guidelines');
    });

    it('should reject response with invalid confidence', () => {
      const response: RCAResponse = {
        thought: 'Analysis complete',
        action: null,
        rootCause: 'Issue identified',
        fixGuidelines: ['Fix it'],
        confidence: 1.5, // Invalid
      };

      const result = validator.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing or invalid confidence score');
    });
  });

  describe('Specificity Scoring - File Paths', () => {
    it('should detect exact file path with "at line" format', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'The issue is in gradle/libs.versions.toml at line 5',
        fixGuidelines: ['Update the version'],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasExactFilePath).toBe(true);
      expect(result.strengths).toContain('✅ Includes exact file path with line number');
    });

    it('should detect exact file path with colon format', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'The error is at MainActivity.kt:45',
        fixGuidelines: ['Fix the variable'],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasExactFilePath).toBe(true);
    });

    it('should reject vague file references', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'The issue is in the build.gradle file',
        fixGuidelines: ['Update the configuration'],
        confidence: 0.8,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasExactFilePath).toBe(false);
      expect(result.issues).toContain('❌ Missing exact file path with line number (e.g., "gradle/libs.versions.toml at line 5")');
    });
  });

  describe('Specificity Scoring - Version Numbers', () => {
    it('should detect specific version numbers', () => {
      const response: RCAResponse = {
        thought: 'Version issue',
        action: null,
        rootCause: 'AGP version 8.10.0 does not exist',
        fixGuidelines: ['Update to AGP 8.7.3 (stable)'],
        confidence: 0.95,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasVersionValidation).toBe(true);
      expect(result.strengths).toContain('✅ Includes specific version numbers');
    });

    it('should reject vague version references', () => {
      const response: RCAResponse = {
        thought: 'Version issue',
        action: null,
        rootCause: 'AGP version is wrong',
        fixGuidelines: ['Update to latest version'],
        confidence: 0.8,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasVersionValidation).toBe(false);
      expect(result.issues).toContain('❌ Missing specific version numbers (e.g., "AGP 8.7.3" not "latest version")');
    });
  });

  describe('Specificity Scoring - Code Examples', () => {
    it('should detect code fences', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'Variable not initialized',
        fixGuidelines: [
          'Add initialization:',
          '```kotlin\nval user = User()\n```',
        ],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasCodeExample).toBe(true);
      expect(result.strengths).toContain('✅ Includes code example with before/after');
    });

    it('should detect before/after format', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'Wrong version',
        fixGuidelines: [
          'Before: agp = "8.10.0"',
          'After: agp = "8.7.3"',
        ],
        confidence: 0.95,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasCodeExample).toBe(true);
    });

    it('should note missing code examples', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'Variable not initialized',
        fixGuidelines: ['Initialize the variable before use'],
        confidence: 0.8,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasCodeExample).toBe(false);
      expect(result.issues).toContain('⚠️ Missing code example showing before/after (recommended)');
    });
  });

  describe('Specificity Scoring - Actual Names', () => {
    it('should detect quoted variable names', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: "Variable 'viewModel' is not initialized",
        fixGuidelines: ["Initialize 'viewModel' in onCreate()"],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasActualNames).toBe(true);
      expect(result.strengths).toContain('✅ References actual variable/function names');
    });

    it('should detect function calls', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'Function loadData() receives null',
        fixGuidelines: ['Check getUserId() before calling loadData()'],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasActualNames).toBe(true);
    });

    it('should reject generic references', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'The variable is not initialized',
        fixGuidelines: ['Initialize the variable'],
        confidence: 0.8,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasActualNames).toBe(false);
      expect(result.issues).toContain('⚠️ Missing specific variable/function names (generic references used)');
    });
  });

  describe('Specificity Scoring - Verification Steps', () => {
    it('should detect command execution steps', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'Configuration error',
        fixGuidelines: [
          'Update the version',
          'Run ./gradlew clean build to verify',
        ],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasVerificationSteps).toBe(true);
      expect(result.strengths).toContain('✅ Includes verification/testing steps');
    });

    it('should detect testing instructions', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'Crash in UI',
        fixGuidelines: [
          'Fix the initialization',
          'Test by navigating to ProfileScreen',
        ],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasVerificationSteps).toBe(true);
    });

    it('should note missing verification steps', () => {
      const response: RCAResponse = {
        thought: 'Found it',
        action: null,
        rootCause: 'Configuration error',
        fixGuidelines: ['Update the version'],
        confidence: 0.8,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasVerificationSteps).toBe(false);
      expect(result.issues).toContain('⚠️ Missing verification steps (how to test the fix)');
    });
  });

  describe('Specificity Scoring - Compatibility', () => {
    it('should detect compatibility requirements', () => {
      const response: RCAResponse = {
        thought: 'Version issue',
        action: null,
        rootCause: 'AGP version incompatible',
        fixGuidelines: [
          'Update to AGP 8.7.3',
          'Note: AGP 8.7.3 requires Gradle 8.9+',
        ],
        confidence: 0.95,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasCompatibilityCheck).toBe(true);
      expect(result.strengths).toContain('✅ Mentions version compatibility');
    });

    it('should detect compatible with patterns', () => {
      const response: RCAResponse = {
        thought: 'Version issue',
        action: null,
        rootCause: 'Version mismatch',
        fixGuidelines: [
          'Update Kotlin to 2.0.0 (compatible with AGP 8.7.3+)',
        ],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.breakdown.hasCompatibilityCheck).toBe(true);
    });
  });

  describe('Overall Scoring', () => {
    it('should score excellent response (85-100)', () => {
      const response: RCAResponse = {
        thought: 'Complete analysis',
        action: null,
        rootCause: "Variable 'agp' in gradle/libs.versions.toml at line 5 has invalid value 8.10.0 which does not exist in Maven Central",
        fixGuidelines: [
          'Update gradle/libs.versions.toml at line 5:',
          'Before: agp = "8.10.0"',
          'After: agp = "8.7.3"',
          "Note: AGP 8.7.3 requires Gradle 8.9+ (check gradle/wrapper/gradle-wrapper.properties)",
          'Verify fix by running ./gradlew --version to confirm AGP updated',
        ],
        confidence: 0.95,
      };

      const result = validator.validateResponse(response);

      expect(result.specificityScore).toBeGreaterThanOrEqual(85);
      expect(validator.getSpecificityLevel(result.specificityScore)).toBe('Excellent');
      expect(result.breakdown.hasExactFilePath).toBe(true);
      expect(result.breakdown.hasVersionValidation).toBe(true);
      expect(result.breakdown.hasCodeExample).toBe(true);
      expect(result.breakdown.hasActualNames).toBe(true); // Now includes 'agp' variable
      expect(result.breakdown.hasVerificationSteps).toBe(true);
      expect(result.breakdown.hasCompatibilityCheck).toBe(true);
    });

    it('should score good response (70-84)', () => {
      const response: RCAResponse = {
        thought: 'Analysis done',
        action: null,
        rootCause: "Variable 'viewModel' not initialized at MainActivity.kt:45",
        fixGuidelines: [
          "Initialize 'viewModel' in onCreate() before use:",
          '```kotlin\noverride fun onCreate() {\n  viewModel = ViewModelProvider(this).get(MyViewModel::class.java)\n}\n```',
          'Run the app to verify no crash',
        ],
        confidence: 0.9,
      };

      const result = validator.validateResponse(response);

      expect(result.specificityScore).toBeGreaterThanOrEqual(70);
      expect(result.specificityScore).toBeLessThan(85);
      expect(validator.getSpecificityLevel(result.specificityScore)).toBe('Good');
    });

    it('should score poor response (17% MVP baseline)', () => {
      const response: RCAResponse = {
        thought: 'Found the issue',
        action: null,
        rootCause: 'The build.gradle configuration is incorrect',
        fixGuidelines: [
          'Update the dependencies',
          'Ensure Maven Central is configured',
          'Sync the project',
        ],
        confidence: 0.7,
      };

      const result = validator.validateResponse(response);

      // This represents the MVP test baseline (17% specificity)
      expect(result.specificityScore).toBeLessThan(30);
      expect(validator.getSpecificityLevel(result.specificityScore)).toBe('Very Poor');
      expect(result.breakdown.hasExactFilePath).toBe(false);
      expect(result.breakdown.hasVersionValidation).toBe(false);
      expect(result.breakdown.hasCodeExample).toBe(false);
    });
  });

  describe('Validation with Suggestions', () => {
    it('should provide actionable suggestions for poor response', () => {
      const response: RCAResponse = {
        thought: 'Done',
        action: null,
        rootCause: 'Configuration is wrong',
        fixGuidelines: ['Fix the configuration'],
        confidence: 0.8,
      };

      const { result, suggestions } = validator.validateWithSuggestions(response);

      expect(result.specificityScore).toBeLessThan(30); // Very poor
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('Add exact file path with line number (e.g., "gradle/libs.versions.toml at line 5")');
      expect(suggestions).toContain('Include specific version numbers (e.g., "AGP 8.7.3" instead of "latest version")');
      expect(suggestions).toContain('Add code example showing before/after changes');
    });

    it('should provide no suggestions for excellent response', () => {
      const response: RCAResponse = {
        thought: 'Complete',
        action: null,
        rootCause: "Variable 'agp' at gradle/libs.versions.toml line 5 has non-existent version 8.10.0",
        fixGuidelines: [
          'Update gradle/libs.versions.toml at line 5:',
          'Before: agp = "8.10.0"',
          'After: agp = "8.7.3"',
          "AGP 8.7.3 requires Gradle 8.9+ - verify gradle/wrapper/gradle-wrapper.properties has distributionUrl with gradle-8.9 or later",
          'Run ./gradlew --version to verify AGP version updated correctly',
        ],
        confidence: 0.95,
      };

      const { result, suggestions } = validator.validateWithSuggestions(response);

      expect(result.specificityScore).toBeGreaterThanOrEqual(85);
      expect(suggestions.length).toBe(0);
      // Verify all breakdown items are true
      expect(result.breakdown.hasExactFilePath).toBe(true);
      expect(result.breakdown.hasVersionValidation).toBe(true);
      expect(result.breakdown.hasCodeExample).toBe(true);
      expect(result.breakdown.hasCompatibilityCheck).toBe(true);
      expect(result.breakdown.hasVerificationSteps).toBe(true);
      expect(result.breakdown.hasActualNames).toBe(true);
    });
  });
});
