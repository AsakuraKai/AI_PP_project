/**
 * Shared Test Types
 * 
 * Common interfaces used across all test scripts to avoid duplication.
 * Single source of truth for test result structures.
 */

/**
 * Test case definition
 */
export interface TestCase {
  id: number;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  projectPath?: string;
  errorMessage?: string;
  expectedKeywords?: string[];
}

/**
 * Test metrics (standardized across all tests)
 */
export interface TestMetrics {
  diagnosis_accuracy: number;
  solution_specificity: number;
  file_identification: number;
  code_examples: number;
  version_suggestions: number;
  overall_usability: number;
  confidence: number;
  latency_ms: number;
}

/**
 * Test result
 */
export interface TestResult {
  test: string;
  testNumber?: number;
  timestamp: string;
  metrics: TestMetrics;
  status: 'passed' | 'partial' | 'failed';
  baseline?: number;
  improvement?: number;
}

/**
 * Test comparison data
 */
export interface ComparisonData {
  test: string;
  baseline: number;
  current: number;
  improvement: number;
  status: string;
}

/**
 * Calculate overall usability from individual metrics
 */
export function calculateUsability(metrics: Partial<TestMetrics>): number {
  const weights = {
    diagnosis_accuracy: 0.30,
    solution_specificity: 0.25,
    file_identification: 0.15,
    version_suggestions: 0.15,
    code_examples: 0.15
  };
  
  let usability = 0;
  if (metrics.diagnosis_accuracy !== undefined) {
    usability += metrics.diagnosis_accuracy * weights.diagnosis_accuracy;
  }
  if (metrics.solution_specificity !== undefined) {
    usability += metrics.solution_specificity * weights.solution_specificity;
  }
  if (metrics.file_identification !== undefined) {
    usability += metrics.file_identification * weights.file_identification;
  }
  if (metrics.version_suggestions !== undefined) {
    usability += metrics.version_suggestions * weights.version_suggestions;
  }
  if (metrics.code_examples !== undefined) {
    usability += metrics.code_examples * weights.code_examples;
  }
  
  return Math.round(usability);
}

/**
 * Determine test status from usability score
 */
export function getTestStatus(usability: number): 'passed' | 'partial' | 'failed' {
  if (usability >= 80) return 'passed';
  if (usability >= 60) return 'partial';
  return 'failed';
}
