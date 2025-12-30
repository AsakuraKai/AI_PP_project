/**
 * OutputValidator - Quality checks for agent output
 * 
 * Phase 1 Strengthening: Validates that agent responses meet quality standards
 * before returning to user. Checks for specificity, code examples, file paths,
 * version numbers, and other requirements from roadmap.
 * 
 * Design Decisions:
 * - Multi-factor scoring (0.0-1.0)
 * - Specific checks for each quality dimension
 * - Regeneration trigger when score < threshold
 * - Detailed feedback for improvement prompts
 * 
 * Quality Dimensions:
 * 1. File Path Specificity (has line numbers?)
 * 2. Version Numbers (specific vs "latest"?)
 * 3. Code Examples (before/after shown?)
 * 4. Variable References (actual names used?)
 * 5. Verification Steps (test instructions?)
 * 6. Completeness (all required fields?)
 * 
 * @example
 * const validator = new OutputValidator();
 * const result = validator.validate(rcaResult, parsedError);
 * if (result.score < 0.7) {
 *   // Regenerate with feedback
 *   const feedback = result.getFeedback();
 * }
 */

import { RCAResult, ParsedError } from '../types';

export interface ValidationResult {
  /** Overall quality score (0.0-1.0) */
  score: number;
  
  /** Whether output passes validation */
  passes: boolean;
  
  /** Individual dimension scores */
  dimensions: {
    filePathSpecificity: number;
    versionSpecificity: number;
    codeExamples: number;
    variableReferences: number;
    verificationSteps: number;
    completeness: number;
  };
  
  /** Issues found (for regeneration feedback) */
  issues: string[];
  
  /** Get feedback message for regeneration */
  getFeedback(): string;
}

export class OutputValidator {
  private readonly PASS_THRESHOLD = 0.60; // 60% quality required (PHASE 1 target)
  
  /**
   * Validate RCA result quality with weighted dimensions
   */
  validate(result: RCAResult, _error: ParsedError): ValidationResult {
    const dimensions = {
      filePathSpecificity: this.checkFilePathSpecificity(result),
      versionSpecificity: this.checkVersionSpecificity(result),
      codeExamples: this.checkCodeExamples(result),
      variableReferences: this.checkVariableReferences(result),
      verificationSteps: this.checkVerificationSteps(result),
      completeness: this.checkCompleteness(result),
    };
    
    // WEIGHTED AVERAGE - Rebalanced for Phase 1 (Loop 1: Increased code examples)
    const weights = {
      filePathSpecificity: 0.25,    // Important: exact file paths (25%)
      versionSpecificity: 0.15,     // Moderate: specific versions (15%)
      codeExamples: 0.25,           // CRITICAL: before/after code (25%) ← INCREASED!
      variableReferences: 0.15,     // Moderate: actual names (15%)
      verificationSteps: 0.15,      // Important: test instructions (15%)
      completeness: 0.05,           // Basic: all fields present (5%)
    };
    
    const score = Object.entries(dimensions).reduce((sum, [key, value]) => {
      const weight = weights[key as keyof typeof weights];
      return sum + (value * weight);
    }, 0);
    
    const passes = score >= this.PASS_THRESHOLD;
    
    const issues = this.collectIssues(dimensions, result);
    
    return {
      score,
      passes,
      dimensions,
      issues,
      getFeedback: () => this.buildFeedback(dimensions, issues),
    };
  }
  
  /**
   * Check if file paths are specific with line numbers
   */
  private checkFilePathSpecificity(result: RCAResult): number {
    const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');
    
    let score = 0.0;
    let checks = 0;
    
    // Check for file paths (build.gradle, .kt files, .xml files)
    const filePathRegex = /([a-zA-Z0-9_\-\/]+\.(gradle|kt|kts|xml|toml|properties))/g;
    const filePaths = text.match(filePathRegex) || [];
    
    if (filePaths.length === 0) {
      // No file paths mentioned - 0.3 score (generic)
      return 0.3;
    }
    
    // Check each file path for line numbers
    for (const path of filePaths) {
      checks++;
      // Look for line number near this file path
      const context = text.substring(
        Math.max(0, text.indexOf(path) - 50),
        Math.min(text.length, text.indexOf(path) + path.length + 50)
      );
      
      if (/line\s+\d+|:\d+|@\d+|L\d+/.test(context)) {
        score += 1.0; // Has line number
      } else {
        score += 0.3; // File path but no line number
      }
    }
    
    return checks > 0 ? score / checks : 0.5;
  }
  
  /**
   * Check if version numbers are specific (not "latest", "newest", etc.)
   */
  private checkVersionSpecificity(result: RCAResult): number {
    const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');
    
    // Check for generic version terms (bad)
    const genericTerms = [
      'latest', 'newest', 'current', 'update to latest',
      'newer version', 'recent version', 'upgrade to latest'
    ];
    
    const hasGenericTerms = genericTerms.some(term => 
      text.toLowerCase().includes(term)
    );
    
    // Check for specific version numbers (good)
    const specificVersions = text.match(/\d+\.\d+\.\d+/g) || [];
    
    if (hasGenericTerms && specificVersions.length === 0) {
      return 0.2; // Uses "latest" without specific versions
    }
    
    if (specificVersions.length > 0) {
      return 1.0; // Has specific version numbers
    }
    
    return 0.6; // No versions mentioned (neutral)
  }
  
  /**
   * Check if code examples are shown (before/after)
   */
  private checkCodeExamples(result: RCAResult): number {
    const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');
    
    // Look for code example indicators
    const beforeAfterIndicators = [
      'before:', 'after:',
      'current:', 'change to:',
      'old:', 'new:',
      '```', // Markdown code blocks
      'was:', 'should be:',
    ];
    
    let foundIndicators = 0;
    for (const indicator of beforeAfterIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        foundIndicators++;
      }
    }
    
    // Check for actual code-like content
    const hasCodeLike = /[=:]\s*["'][^"']+["']|[{}\[\]()]/.test(text);
    
    if (foundIndicators >= 2 && hasCodeLike) {
      return 1.0; // Clear before/after with code
    }
    
    if (foundIndicators >= 1) {
      return 0.6; // Some code examples
    }
    
    return 0.2; // No code examples
  }
  
  /**
   * Build specific feedback message for regeneration
   */
  private buildFeedback(dimensions: any, issues: string[]): string {
    const weakDimensions = Object.entries(dimensions)
      .filter(([_, score]: [string, any]) => score < 0.7)
      .sort((a, b) => (a[1] as number) - (b[1] as number));
    
    let feedback = 'Your response needs improvement in these areas:\n\n';
    
    for (const [dim, score] of weakDimensions) {
      feedback += `${dim}: ${(score as number * 100).toFixed(0)}%\n`;
      
      if (dim === 'filePathSpecificity') {
        feedback += '  → Add exact file paths with line numbers (e.g., "gradle/libs.versions.toml at line 5")\n';
      } else if (dim === 'versionSpecificity') {
        feedback += '  → Use specific version numbers (e.g., "AGP 8.7.3"), not "latest" or "newest"\n';
      } else if (dim === 'codeExamples') {
        feedback += '  → Show before/after code examples with actual code snippets\n';
      } else if (dim === 'variableReferences') {
        feedback += '  → Reference actual variable/function names from the code\n';
      } else if (dim === 'verificationSteps') {
        feedback += '  → Add verification steps (e.g., "Run \'./gradlew build\' to test")\n';
      }
    }
    
    feedback += '\nTop Issues:\n';
    issues.slice(0, 5).forEach((issue, i) => {
      feedback += `${i + 1}. ${issue}\n`;
    });
    
    return feedback;
  }

  /**
   * Check if actual variable/function names are referenced
   */
  private checkVariableReferences(result: RCAResult): number {
    const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');
    
    // Generic terms (bad)
    const genericTerms = [
      'the variable', 'the function', 'the method',
      'the property', 'the field', 'the class',
      'this variable', 'that function',
    ];
    
    const genericCount = genericTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;
    
    // Specific references (good) - camelCase or PascalCase names
    const specificRefs = text.match(/\b[a-z][a-zA-Z0-9]*\b|\b[A-Z][a-zA-Z0-9]*\b/g) || [];
    const meaningfulRefs = specificRefs.filter(ref => 
      ref.length > 3 && // Not too short
      !/^(the|and|for|with|from|this|that|will|should|must)$/i.test(ref) // Not common words
    );
    
    if (meaningfulRefs.length > 5) {
      return 1.0; // Many specific references
    }
    
    if (meaningfulRefs.length > 2) {
      return 0.7; // Some specific references
    }
    
    if (genericCount > 2) {
      return 0.3; // Mostly generic terms
    }
    
    return 0.5; // Neutral
  }
  
  /**
   * Check if verification/testing steps are provided
   */
  private checkVerificationSteps(result: RCAResult): number {
    const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');
    
    // Look for verification indicators
    const verificationTerms = [
      'run', 'test', 'verify', 'check',
      './gradlew', 'gradle', 'build',
      'compile', 'sync', 'clean',
      'after applying', 'to confirm', 'to ensure',
    ];
    
    const found = verificationTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;
    
    if (found >= 3) {
      return 1.0; // Clear verification steps
    }
    
    if (found >= 1) {
      return 0.6; // Some verification
    }
    
    return 0.2; // No verification steps
  }
  
  /**
   * Check if all required fields are present and non-empty
   */
  private checkCompleteness(result: RCAResult): number {
    let score = 1.0;
    
    if (!result.rootCause || result.rootCause.trim().length < 20) {
      score -= 0.3; // Root cause too short or missing
    }
    
    if (!result.fixGuidelines || result.fixGuidelines.length === 0) {
      score -= 0.3; // No fix guidelines
    }
    
    if (result.fixGuidelines.length === 1 && result.fixGuidelines[0].length < 20) {
      score -= 0.2; // Fix guidelines too short
    }
    
    if (result.confidence === undefined || result.confidence < 0.5) {
      score -= 0.2; // Low or missing confidence
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Collect issues for feedback
   */
  private collectIssues(
    dimensions: ValidationResult['dimensions'],
    _result: RCAResult
  ): string[] {
    const issues: string[] = [];
    
    if (dimensions.filePathSpecificity < 0.7) {
      issues.push('File paths lack line numbers - specify exact locations');
    }
    
    if (dimensions.versionSpecificity < 0.7) {
      issues.push('Version numbers are generic - use specific versions (e.g., 8.7.3)');
    }
    
    if (dimensions.codeExamples < 0.7) {
      issues.push('Missing code examples - show before/after snippets');
    }
    
    if (dimensions.variableReferences < 0.7) {
      issues.push('Using generic terms - reference actual variable/function names');
    }
    
    if (dimensions.verificationSteps < 0.7) {
      issues.push('Missing verification steps - explain how to test the fix');
    }
    
    if (dimensions.completeness < 0.7) {
      issues.push('Response incomplete - add more detail to root cause or fixes');
    }
    
    return issues;
  }
}
