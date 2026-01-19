/**
 * QualityChecker - Shared quality validation logic
 * 
 * Centralizes quality checking logic to eliminate duplication between
 * OllamaClient.quickQualityCheck and OutputValidator dimension checks.
 * 
 * Design Decisions:
 * - Single source of truth for quality metrics
 * - Composable quality dimensions
 * - Consistent scoring algorithm (0.0-1.0)
 * - Clear weight distribution (sum = 1.0)
 * 
 * Quality Dimensions:
 * 1. Root Cause Quality (30%) - Length and specificity
 * 2. Fix Guidelines Quality (30%) - Presence and detail
 * 3. File Path Specificity (15%) - Has line numbers?
 * 4. Version Specificity (10%) - Specific vs "latest"?
 * 5. Code Examples (10%) - Before/after shown?
 * 6. Diagnostic Accuracy (5%) - Domain match?
 * 
 * @example
 * const checker = new QualityChecker();
 * const result = checker.check(jsonText, originalError);
 * if (result.score >= 0.6) { ... }
 */

export interface QualityCheckResult {
  /** Overall quality score (0.0-1.0) */
  score: number;

  /** Individual dimension scores */
  dimensions: {
    rootCauseQuality: number;
    fixGuidelinesQuality: number;
    filePathSpecificity: number;
    versionSpecificity: number;
    codeExamples: number;
    diagnosticAccuracy: number;
  };

  /** Issues found (for feedback) */
  issues: string[];

  /** Detailed breakdown for debugging */
  breakdown?: string;
}

export class QualityChecker {
  /**
   * Check JSON response quality with diagnostic accuracy
   * 
   * @param jsonText - JSON response text to check
   * @param originalError - Original error context (optional)
   * @param includeBreakdown - Include detailed score breakdown
   * @returns Quality check result
   */
  check(
    jsonText: string,
    originalError?: string,
    includeBreakdown = false
  ): QualityCheckResult {
    const issues: string[] = [];
    let json: any;

    try {
      json = JSON.parse(jsonText);
    } catch (e) {
      return {
        score: 0,
        dimensions: {
          rootCauseQuality: 0,
          fixGuidelinesQuality: 0,
          filePathSpecificity: 0,
          versionSpecificity: 0,
          codeExamples: 0,
          diagnosticAccuracy: 0,
        },
        issues: ['invalid JSON'],
      };
    }

    // Calculate individual dimensions
    const dimensions = {
      rootCauseQuality: this.checkRootCauseQuality(json, issues),
      fixGuidelinesQuality: this.checkFixGuidelinesQuality(json, issues),
      filePathSpecificity: this.checkFilePathSpecificity(jsonText, issues),
      versionSpecificity: this.checkVersionSpecificity(jsonText, issues),
      codeExamples: this.checkCodeExamples(jsonText, issues),
      diagnosticAccuracy: this.checkDiagnosticAccuracy(json, originalError, issues),
    };

    // Weighted average (weights sum to 1.0)
    const weights = {
      rootCauseQuality: 0.30,       // Critical: 30%
      fixGuidelinesQuality: 0.30,   // Critical: 30%
      filePathSpecificity: 0.15,    // Important: 15%
      versionSpecificity: 0.10,     // Moderate: 10%
      codeExamples: 0.10,           // Moderate: 10%
      diagnosticAccuracy: 0.05,     // Important but rare: 5%
    };

    const score = Object.entries(dimensions).reduce((sum, [key, value]) => {
      const weight = weights[key as keyof typeof weights];
      return sum + (value * weight);
    }, 0);

    const result: QualityCheckResult = {
      score: Math.max(0, Math.min(1, score)), // Clamp to [0, 1]
      dimensions,
      issues,
    };

    if (includeBreakdown) {
      result.breakdown = this.buildBreakdown(dimensions, weights);
    }

    return result;
  }

  /**
   * Check root cause quality (length and specificity)
   */
  private checkRootCauseQuality(json: any, issues: string[]): number {
    if (!json.rootCause) {
      issues.push('rootCause missing');
      return 0;
    }

    const length = json.rootCause.length;

    if (length < 50) {
      issues.push('rootCause too short (< 50 chars)');
      return 0.2;
    }

    if (length < 80) {
      issues.push('rootCause brief (< 80 chars)');
      return 0.5;
    }

    if (length < 120) {
      return 0.8;
    }

    return 1.0; // Detailed explanation
  }

  /**
   * Check fix guidelines quality (presence and detail)
   */
  private checkFixGuidelinesQuality(json: any, issues: string[]): number {
    if (!Array.isArray(json.fixGuidelines)) {
      issues.push('fixGuidelines missing or not array');
      return 0;
    }

    if (json.fixGuidelines.length === 0) {
      issues.push('no fixGuidelines');
      return 0;
    }

    // Check average guideline length
    const avgLength = json.fixGuidelines.reduce(
      (sum: number, g: string) => sum + g.length,
      0
    ) / json.fixGuidelines.length;

    if (avgLength < 30) {
      issues.push('fixGuidelines too vague (avg < 30 chars)');
      return 0.4;
    }

    if (avgLength < 50) {
      return 0.7;
    }

    return 1.0; // Detailed guidelines
  }

  /**
   * Check file path specificity (has line numbers?)
   */
  private checkFilePathSpecificity(jsonText: string, issues: string[]): number {
    const hasFilePaths = /\.(kt|java|xml|gradle|toml|properties)/.test(jsonText);

    if (!hasFilePaths) {
      issues.push('no file paths');
      return 0.3; // Generic response
    }

    const hasLineNumbers = /line\s*\d+|:\d+|@\d+|L\d+/i.test(jsonText);

    if (!hasLineNumbers) {
      issues.push('file paths lack line numbers');
      return 0.6; // File paths but no line numbers
    }

    return 1.0; // Specific file:line references
  }

  /**
   * Check version specificity (specific vs "latest")
   */
  private checkVersionSpecificity(jsonText: string, issues: string[]): number {
    const genericTerms = ['latest', 'newest', 'current', 'recent'];
    const hasGeneric = genericTerms.some(term =>
      jsonText.toLowerCase().includes(term)
    );

    const hasSpecific = /\d+\.\d+\.\d+/.test(jsonText);

    if (hasGeneric && !hasSpecific) {
      issues.push('uses "latest" without specific versions');
      return 0.3;
    }

    if (hasSpecific) {
      return 1.0; // Specific version numbers
    }

    return 0.7; // No versions mentioned (neutral)
  }

  /**
   * Check for code examples (before/after)
   */
  private checkCodeExamples(jsonText: string, issues: string[]): number {
    const beforeAfterIndicators = [
      'before:', 'after:',
      'current:', 'change to:',
      'old:', 'new:',
      '```', // Markdown code blocks
      'was:', 'should be:',
    ];

    const foundIndicators = beforeAfterIndicators.filter(indicator =>
      jsonText.toLowerCase().includes(indicator)
    ).length;

    if (foundIndicators === 0) {
      issues.push('no code examples');
      return 0.2;
    }

    if (foundIndicators >= 2) {
      return 1.0; // Clear before/after
    }

    return 0.6; // Some examples
  }

  /**
   * Check diagnostic accuracy (domain match with original error)
   * 
   * Validates that diagnosed cause is in the same domain as the error.
   * Prevents cache errors being diagnosed as permission errors, etc.
   */
  private checkDiagnosticAccuracy(
    json: any,
    originalError: string | undefined,
    issues: string[]
  ): number {
    // If no original error provided, can't validate
    if (!originalError || !json.rootCause) {
      return 1.0; // Assume accurate
    }

    const errorLower = originalError.toLowerCase();
    const diagnosisLower = (json.rootCause + ' ' + (json.thought || '')).toLowerCase();

    // Error domain keywords
    const errorDomains: Record<string, string[]> = {
      'permission': ['permission', 'securityexception', 'manifest'],
      'cache': ['cache', 'corrupted', 'gradle cache'],
      'network': ['network', 'maven', 'download', 'repository', 'timeout'],
      'proguard': ['proguard', 'r8', 'nosuchmethod', 'minify'],
      'navigation': ['navigation', 'argument', 'navhost'],
      'null-pointer': ['null', 'npe', 'nullpointer', 'lateinit'],
    };

    // Identify error domain
    let errorDomain: string | null = null;
    for (const [domain, keywords] of Object.entries(errorDomains)) {
      if (keywords.some(kw => errorLower.includes(kw))) {
        errorDomain = domain;
        break;
      }
    }

    // If no specific domain, can't validate
    if (!errorDomain) {
      return 1.0;
    }

    // Check if diagnosis mentions correct domain keywords
    const domainKeywords = errorDomains[errorDomain];
    const mentionsCorrect = domainKeywords.some(kw => diagnosisLower.includes(kw));

    // Check if diagnosis mentions WRONG domain keywords
    const mentionsWrong = Object.entries(errorDomains)
      .filter(([domain]) => domain !== errorDomain)
      .some(([, keywords]) => keywords.some(kw => diagnosisLower.includes(kw)));

    // Accurate if mentions correct OR doesn't mention wrong
    if (mentionsCorrect && !mentionsWrong) {
      return 1.0; // Perfect match
    }

    if (mentionsCorrect && mentionsWrong) {
      issues.push('diagnosis mentions multiple error domains');
      return 0.7; // Mixed signals
    }

    if (!mentionsCorrect && mentionsWrong) {
      issues.push('diagnosis domain mismatch');
      return 0.0; // Wrong diagnosis
    }

    // Neither correct nor wrong mentioned
    return 0.8; // Generic but not wrong
  }

  /**
   * Build detailed breakdown for debugging
   */
  private buildBreakdown(
    dimensions: QualityCheckResult['dimensions'],
    weights: Record<string, number>
  ): string {
    const lines: string[] = ['Quality Breakdown:'];

    for (const [key, score] of Object.entries(dimensions)) {
      const weight = weights[key as keyof typeof weights];
      const contribution = score * weight;
      lines.push(
        `  ${key}: ${(score * 100).toFixed(0)}% × ${(weight * 100).toFixed(0)}% = ${(contribution * 100).toFixed(1)}%`
      );
    }

    return lines.join('\n');
  }
}
