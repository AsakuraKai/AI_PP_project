/**
 * ResponseValidator - Validates and scores RCA response quality
 * 
 * Ensures agent responses meet specificity requirements defined in Chunk 3:
 * - Exact file paths with line numbers
 * - Specific version numbers (validated)
 * - Code examples with before/after
 * - Actual variable/function names
 * - Verification steps
 * - Dependency compatibility checks
 * 
 * Provides scoring metrics to track improvement over time.
 * 
 * @example
 * const validator = new ResponseValidator();
 * const result = validator.validateResponse(agentResponse);
 * console.log(`Specificity Score: ${result.specificityScore}%`);
 */

export interface RCAResponse {
  thought: string;
  action: { tool: string; parameters: any } | null;
  rootCause?: string;
  fixGuidelines?: string[];
  confidence?: number;
}

export interface ValidationResult {
  valid: boolean;
  specificityScore: number; // 0-100
  issues: string[];
  strengths: string[];
  breakdown: {
    hasExactFilePath: boolean; // CRITICAL: exact file path with line number
    hasVersionValidation: boolean; // CRITICAL: specific version numbers
    hasCodeExample: boolean; // CRITICAL: before/after code
    hasActualNames: boolean; // References actual variables/functions
    hasVerificationSteps: boolean; // How to test the fix
    hasCompatibilityCheck: boolean; // Dependency compatibility
  };
}

/**
 * Validates RCA response quality and specificity
 */
export class ResponseValidator {
  /**
   * Validate a complete RCA response
   */
  validateResponse(response: RCAResponse): ValidationResult {
    const issues: string[] = [];
    const strengths: string[] = [];
    const breakdown = {
      hasExactFilePath: false,
      hasVersionValidation: false,
      hasCodeExample: false,
      hasActualNames: false,
      hasVerificationSteps: false,
      hasCompatibilityCheck: false,
    };

    // Only validate conclusion (when action is null)
    if (response.action !== null) {
      return {
        valid: true,
        specificityScore: 0, // Not applicable for intermediate steps
        issues: [],
        strengths: ['Still analyzing - not yet concluded'],
        breakdown,
      };
    }

    // Validate required fields
    if (!response.rootCause || response.rootCause.trim().length === 0) {
      issues.push('Missing or empty root cause explanation');
      return { valid: false, specificityScore: 0, issues, strengths, breakdown }; // Early exit
    }

    if (!response.fixGuidelines || response.fixGuidelines.length === 0) {
      issues.push('Missing or empty fix guidelines');
      return { valid: false, specificityScore: 0, issues, strengths, breakdown }; // Early exit
    }

    if (response.confidence === undefined || response.confidence < 0 || response.confidence > 1) {
      issues.push('Missing or invalid confidence score');
      return { valid: false, specificityScore: 0, issues, strengths, breakdown }; // Early exit
    }

    // Validate specificity (only if we have fixGuidelines)
    if (response.fixGuidelines && response.fixGuidelines.length > 0) {
      const fullText = `${response.rootCause}\n${response.fixGuidelines.join('\n')}`;

      // 1. Check for exact file paths with line numbers
      breakdown.hasExactFilePath = this.hasExactFilePath(fullText);
      if (breakdown.hasExactFilePath) {
        strengths.push('✅ Includes exact file path with line number');
      } else {
        issues.push('❌ Missing exact file path with line number (e.g., "gradle/libs.versions.toml at line 5")');
      }

      // 2. Check for specific version numbers
      breakdown.hasVersionValidation = this.hasSpecificVersions(fullText);
      if (breakdown.hasVersionValidation) {
        strengths.push('✅ Includes specific version numbers');
      } else {
        issues.push('❌ Missing specific version numbers (e.g., "AGP 8.7.3" not "latest version")');
      }

      // 3. Check for code examples with before/after
      breakdown.hasCodeExample = this.hasCodeExample(fullText);
      if (breakdown.hasCodeExample) {
        strengths.push('✅ Includes code example with before/after');
      } else {
        issues.push('⚠️ Missing code example showing before/after (recommended)');
      }

      // 4. Check for actual variable/function names
      breakdown.hasActualNames = this.hasActualNames(fullText);
      if (breakdown.hasActualNames) {
        strengths.push('✅ References actual variable/function names');
      } else {
        issues.push('⚠️ Missing specific variable/function names (generic references used)');
      }

      // 5. Check for verification steps
      breakdown.hasVerificationSteps = this.hasVerificationSteps(fullText);
      if (breakdown.hasVerificationSteps) {
        strengths.push('✅ Includes verification/testing steps');
      } else {
        issues.push('⚠️ Missing verification steps (how to test the fix)');
      }

      // 6. Check for compatibility mentions
      breakdown.hasCompatibilityCheck = this.hasCompatibilityCheck(fullText);
      if (breakdown.hasCompatibilityCheck) {
        strengths.push('✅ Mentions version compatibility');
      } else {
        // Not always required, so just note it
        if (fullText.toLowerCase().includes('version') || fullText.toLowerCase().includes('gradle')) {
          issues.push('⚠️ Version-related error but no compatibility check mentioned');
        }
      }
    }

    // Calculate specificity score
    const specificityScore = this.calculateSpecificityScore(breakdown);

    return {
      valid: issues.filter(i => i.startsWith('❌')).length === 0,
      specificityScore,
      issues,
      strengths,
      breakdown,
    };
  }

  /**
   * Check if response includes exact file path with line number
   * Examples: "gradle/libs.versions.toml at line 5", "MainActivity.kt:45"
   */
  private hasExactFilePath(text: string): boolean {
    const patterns = [
      /\.(kt|kts|java|xml|toml|gradle|properties)[:\s]+(?:at\s+)?line\s+\d+/i,
      /\.(kt|kts|java|xml|toml|gradle|properties):\d+/,
      /(?:at|in)\s+[\w\/\-\.]+\.(kt|kts|java|xml|toml|gradle|properties)\s+(?:at\s+)?line\s+\d+/i,
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if response includes specific version numbers
   * Good: "AGP 8.7.3", "Kotlin 2.0.0"
   * Bad: "latest version", "newer version", "update the version"
   */
  private hasSpecificVersions(text: string): boolean {
    // Look for version patterns like X.Y.Z
    const versionPattern = /\d+\.\d+\.\d+/;
    const hasVersionNumber = versionPattern.test(text);

    // If no version numbers at all, definitely bad
    if (!hasVersionNumber) {
      return false;
    }

    // Check for vague phrases WITHOUT version numbers following them
    const vaguePatterns = [
      /\blatest\s+version\b(?!\s+\d+\.\d+)/i,
      /\bnewer\s+version\b(?!\s+\d+\.\d+)/i,
      /\bupdate\s+to\s+latest\b(?!\s+\d+\.\d+)/i,
    ];
    
    const hasVaguePhrases = vaguePatterns.some(pattern => pattern.test(text));

    // Good if has specific version and no vague phrases
    return hasVersionNumber && !hasVaguePhrases;
  }

  /**
   * Check if response includes code example (ideally with before/after)
   */
  private hasCodeExample(text: string): boolean {
    // Look for code blocks or before/after patterns
    const patterns = [
      /```[\w]*\s/m, // Code fence (more lenient)
      /before\s*[:：\-]/i,
      /after\s*[:：\-]/i,
      /\/\/\s*before/i,
      /\/\/\s*after/i,
      /change.*from.*to/i,
      /old\s*:\s*\S+/i, // old: something
      /new\s*:\s*\S+/i, // new: something
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if response references actual variable/function names
   * Good: "Variable 'viewModel'", "Function 'loadData()'"
   * Bad: "the variable", "the function", "this property"
   */
  private hasActualNames(text: string): boolean {
    // Look for quoted identifiers or specific naming patterns
    const patterns = [
      /'[a-zA-Z_][a-zA-Z0-9_]*'/g, // Single-quoted identifiers
      /`[a-zA-Z_][a-zA-Z0-9_]*`/g, // Backtick-quoted identifiers
      /\b[a-zA-Z_][a-zA-Z0-9_]*\(\)/g, // Function calls like loadData()
      /variable ['"`][a-zA-Z_][a-zA-Z0-9_]*['"`]/gi,
      /function ['"`][a-zA-Z_][a-zA-Z0-9_]*['"`]/gi,
      /property ['"`][a-zA-Z_][a-zA-Z0-9_]*['"`]/gi,
    ];

    // Need at least 2 specific identifiers for good score
    const matches = patterns.reduce((count, pattern) => {
      const found = text.match(pattern);
      return count + (found ? found.length : 0);
    }, 0);

    return matches >= 2;
  }

  /**
   * Check if response includes verification/testing steps
   * Good: "Run ./gradlew build", "Test by navigating to X", "Verify by"
   * Bad: "This should fix it", "The error will be resolved"
   */
  private hasVerificationSteps(text: string): boolean {
    const patterns = [
      /(?:run|execute|test)\s+[\.\/\w\-]+/i, // run ./gradlew, execute command
      /verify\s+(?:by|that|the|fix)/i,
      /to\s+(?:test|verify|confirm)\s+(?:this|the)/i,
      /after\s+(?:applying|making|fixing)/i,
      /check\s+(?:that|if|by|the)/i,
      /confirm\s+(?:that|the|by)/i,
      /ensure\s+(?:that|the)\s+\w+\s+\w+/i, // ensure that something happens
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if response mentions version compatibility
   * Good: "AGP 8.7.3 requires Gradle 8.9+", "Kotlin 2.0.0 compatible with AGP 8.7.3+"
   */
  private hasCompatibilityCheck(text: string): boolean {
    const patterns = [
      /(?:requires?|needs?)\s+\w+\s+\d+\.\d+/i,
      /compatible\s+with/i,
      /works?\s+with/i,
      /\d+\.\d+\.\d+\+/,
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate specificity score (0-100)
   * 
   * Scoring:
   * - Exact file path: 30 points (CRITICAL)
   * - Version validation: 25 points (CRITICAL)
   * - Code example: 20 points (CRITICAL)
   * - Actual names: 10 points
   * - Verification steps: 10 points
   * - Compatibility check: 5 points
   */
  private calculateSpecificityScore(breakdown: ValidationResult['breakdown']): number {
    let score = 0;

    if (breakdown.hasExactFilePath) score += 30;
    if (breakdown.hasVersionValidation) score += 25;
    if (breakdown.hasCodeExample) score += 20;
    if (breakdown.hasActualNames) score += 10;
    if (breakdown.hasVerificationSteps) score += 10;
    if (breakdown.hasCompatibilityCheck) score += 5;

    return score;
  }

  /**
   * Get human-readable specificity level
   */
  getSpecificityLevel(score: number): string {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Adequate';
    if (score >= 30) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Validate and provide improvement suggestions
   */
  validateWithSuggestions(response: RCAResponse): {
    result: ValidationResult;
    suggestions: string[];
  } {
    const result = this.validateResponse(response);
    const suggestions: string[] = [];

    if (!result.breakdown.hasExactFilePath) {
      suggestions.push('Add exact file path with line number (e.g., "gradle/libs.versions.toml at line 5")');
    }

    if (!result.breakdown.hasVersionValidation) {
      suggestions.push('Include specific version numbers (e.g., "AGP 8.7.3" instead of "latest version")');
      suggestions.push('Use VersionLookupTool to validate versions before suggesting');
    }

    if (!result.breakdown.hasCodeExample) {
      suggestions.push('Add code example showing before/after changes');
    }

    if (!result.breakdown.hasActualNames) {
      suggestions.push('Reference actual variable/function names from the code');
    }

    if (!result.breakdown.hasVerificationSteps) {
      suggestions.push('Add verification steps (e.g., "Run ./gradlew build to verify")');
    }

    return { result, suggestions };
  }
}
