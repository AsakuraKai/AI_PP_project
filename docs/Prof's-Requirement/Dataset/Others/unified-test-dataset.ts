/**
 * Unified Test Dataset
 * 
 * Consolidated test cases from:
 * - test-dataset.ts (10 Kotlin NPE cases)
 * - android-test-dataset.ts (20 Android/Compose/Gradle cases)
 * - performance-test-dataset.ts (40+ performance test cases)
 * 
 * This module re-exports all test datasets with a unified interface.
 * Individual files are kept for backwards compatibility but import from this module.
 */

// Import from individual datasets
import { 
  testDataset, 
  getTestCasesByDifficulty, 
  getTestCaseById, 
  datasetStats,
  type TestCase 
} from './test-dataset';

import { 
  androidTestDataset, 
  getTestCasesByCategory,
  getAndroidTestCasesByDifficulty,
  getAndroidTestCaseById,
  getTestCasesByTag,
  androidDatasetStats,
  type AndroidTestCase
} from './android-test-dataset';

import { 
  PERFORMANCE_TEST_CASES,
  KOTLIN_TEST_CASES,
  GRADLE_TEST_CASES,
  COMPOSE_TEST_CASES,
  XML_TEST_CASES,
  MANIFEST_TEST_CASES,
  MULTI_LAYER_TEST_CASES,
  getTestsByComplexity,
  getTestsByCategory,
  getTestById,
  getSimpleTests,
  getComplexTests,
  getEdgeCaseTests,
  TEST_STATISTICS,
  type ErrorComplexity,
  type ErrorCategory,
  type PerformanceTestCase
} from './performance-test-dataset';

// Re-export Kotlin NPE test cases
export type { TestCase } from './test-dataset';
export {
  testDataset,
  getTestCasesByDifficulty,
  getTestCaseById,
  datasetStats
} from './test-dataset';

// Re-export Android test cases
export type { AndroidTestCase } from './android-test-dataset';
export {
  androidTestDataset,
  getTestCasesByCategory,
  getAndroidTestCasesByDifficulty,
  getAndroidTestCaseById,
  getTestCasesByTag,
  androidDatasetStats
} from './android-test-dataset';

// Re-export Performance test cases
export type {
  ErrorComplexity,
  ErrorCategory,
  PerformanceTestCase
} from './performance-test-dataset';
export {
  PERFORMANCE_TEST_CASES,
  KOTLIN_TEST_CASES,
  GRADLE_TEST_CASES,
  COMPOSE_TEST_CASES,
  XML_TEST_CASES,
  MANIFEST_TEST_CASES,
  MULTI_LAYER_TEST_CASES,
  getTestsByComplexity,
  getTestsByCategory,
  getTestById,
  getSimpleTests,
  getComplexTests,
  getEdgeCaseTests,
  TEST_STATISTICS
} from './performance-test-dataset';

/**
 * Unified test dataset combining all categories
 */
export const UNIFIED_TEST_DATASET = {
  kotlin: testDataset,
  android: androidTestDataset,
  performance: PERFORMANCE_TEST_CASES,
  
  // Statistics
  stats: {
    totalKotlinTests: datasetStats.total,
    totalAndroidTests: androidDatasetStats.total,
    totalPerformanceTests: TEST_STATISTICS.total,
    grandTotal: datasetStats.total + androidDatasetStats.total + TEST_STATISTICS.total
  }
};

/**
 * Get all test cases across all datasets
 */
export function getAllTestCases() {
  return [
    ...testDataset.map(tc => ({ ...tc, dataset: 'kotlin' as const })),
    ...androidTestDataset.map(tc => ({ ...tc, dataset: 'android' as const })),
    ...PERFORMANCE_TEST_CASES.map(tc => ({ ...tc, dataset: 'performance' as const }))
  ];
}

/**
 * Search across all datasets by ID
 */
export function findTestById(id: string) {
  return (
    getTestCaseById(id) ||
    getAndroidTestCaseById(id) ||
    getTestById(id)
  );
}

/**
 * Get tests by difficulty across all datasets
 */
export function getTestsByDifficultyAcrossAll(difficulty: 'easy' | 'medium' | 'hard') {
  return [
    ...getTestCasesByDifficulty(difficulty).map(tc => ({ ...tc, dataset: 'kotlin' as const })),
    ...getAndroidTestCasesByDifficulty(difficulty).map(tc => ({ ...tc, dataset: 'android' as const })),
    ...getTestsByComplexity(difficulty === 'easy' ? 'simple' : difficulty === 'hard' ? 'complex' : 'medium')
      .map(tc => ({ ...tc, dataset: 'performance' as const }))
  ];
}

/**
 * Print unified statistics
 */
export function printUnifiedStats() {
  console.log('='.repeat(50));
  console.log('UNIFIED TEST DATASET STATISTICS');
  console.log('='.repeat(50));
  console.log(`Total Kotlin NPE Tests: ${UNIFIED_TEST_DATASET.stats.totalKotlinTests}`);
  console.log(`Total Android Tests: ${UNIFIED_TEST_DATASET.stats.totalAndroidTests}`);
  console.log(`Total Performance Tests: ${UNIFIED_TEST_DATASET.stats.totalPerformanceTests}`);
  console.log(`-`.repeat(50));
  console.log(`GRAND TOTAL: ${UNIFIED_TEST_DATASET.stats.grandTotal} test cases`);
  console.log('='.repeat(50));
}
