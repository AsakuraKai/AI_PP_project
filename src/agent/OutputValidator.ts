/**
 * OutputValidator - Quality checks for agent output
 * 
 * @deprecated Use UnifiedValidator instead for better features
 * This class is maintained for backward compatibility only.
 * 
 * Phase 1 Strengthening: Validates that agent responses meet quality standards
 * before returning to user. Checks for specificity, code examples, file paths,
 * version numbers, and other requirements from roadmap.
 * 
 * New in v2: Now wraps UnifiedValidator with metric tracking and adaptive thresholds.
 * 
 * @example
 * // Old way (still works)
 * const validator = new OutputValidator();
 * const result = validator.validate(rcaResult, parsedError);
 * 
 * // New way (recommended)
 * import { UnifiedValidator } from './UnifiedValidator';
 * const validator = new UnifiedValidator({ mode: 'final' });
 * const result = validator.validate(rcaResult, parsedError);
 */

import { RCAResult, ParsedError } from '../types';
import { UnifiedValidator } from './UnifiedValidator';

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
  private readonly unifiedValidator: UnifiedValidator;

  /**
   * @deprecated Use UnifiedValidator directly for better features
   */
  constructor() {
    this.unifiedValidator = new UnifiedValidator({
      mode: 'final',
      adaptiveThresholds: true,
      trackMetrics: true,
    });
  }

  /**
   * Validate RCA result quality with weighted dimensions
   * Now delegates to UnifiedValidator with adaptive thresholds and metric tracking
   * 
   * @deprecated Use UnifiedValidator.validate() directly
   */
  validate(result: RCAResult, error: ParsedError, regenerationCount = 0): ValidationResult {
    return this.unifiedValidator.validate(result, error, regenerationCount);
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    return this.unifiedValidator.getMetrics();
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    return this.unifiedValidator.getMetricsSummary();
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return this.unifiedValidator.exportMetrics();
  }
}
