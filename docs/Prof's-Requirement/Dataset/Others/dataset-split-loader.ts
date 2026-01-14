/**
 * Dataset Split Loader
 * 
 * Loads train/test/eval splits from dataset-split.json
 * and provides utilities for accessing split-specific test cases.
 */

import { testDataset, type TestCase } from './test-dataset';
import { androidTestDataset, type AndroidTestCase } from './android-test-dataset';
import {
    PERFORMANCE_TEST_CASES,
    type PerformanceTestCase
} from './performance-test-dataset';
import { extendedTestDataset, type ExtendedTestCase } from './extended-test-dataset';
import datasetSplitConfig from './dataset-split.json';

// Union type for all test cases
export type AnyTestCase = TestCase | AndroidTestCase | PerformanceTestCase | ExtendedTestCase;

// Dataset split configuration
export interface DatasetSplit {
    train: AnyTestCase[];
    test: AnyTestCase[];
    eval: AnyTestCase[];
}

// Combine all datasets into a single map
const allTestCasesMap = new Map<string, AnyTestCase>();

// Load all test cases
[
    ...testDataset,
    ...androidTestDataset,
    ...PERFORMANCE_TEST_CASES,
    ...extendedTestDataset,
].forEach(testCase => {
    allTestCasesMap.set(testCase.id, testCase);
});

/**
 * Get test case by ID from any dataset
 */
export function getTestCaseById(id: string): AnyTestCase | undefined {
    return allTestCasesMap.get(id);
}

/**
 * Get all test cases in the train split
 */
export function getTrainSplit(): AnyTestCase[] {
    return datasetSplitConfig.splits.train
        .map(id => getTestCaseById(id))
        .filter((tc): tc is AnyTestCase => tc !== undefined);
}

/**
 * Get all test cases in the test split
 */
export function getTestSplit(): AnyTestCase[] {
    return datasetSplitConfig.splits.test
        .map(id => getTestCaseById(id))
        .filter((tc): tc is AnyTestCase => tc !== undefined);
}

/**
 * Get all test cases in the eval split
 */
export function getEvalSplit(): AnyTestCase[] {
    return datasetSplitConfig.splits.eval
        .map(id => getTestCaseById(id))
        .filter((tc): tc is AnyTestCase => tc !== undefined);
}

/**
 * Get complete dataset split
 */
export function getDatasetSplit(): DatasetSplit {
    return {
        train: getTrainSplit(),
        test: getTestSplit(),
        eval: getEvalSplit(),
    };
}

/**
 * Get dataset statistics
 */
export function getDatasetStats() {
    const split = getDatasetSplit();
    return {
        total: allTestCasesMap.size,
        train: split.train.length,
        test: split.test.length,
        eval: split.eval.length,
        metadata: datasetSplitConfig.metadata,
        distribution: datasetSplitConfig.distribution,
    };
}

/**
 * Validate dataset split (ensure all IDs exist)
 */
export function validateDatasetSplit(): {
    valid: boolean;
    missing: string[];
    duplicates: string[];
} {
    const allSplitIds = [
        ...datasetSplitConfig.splits.train,
        ...datasetSplitConfig.splits.test,
        ...datasetSplitConfig.splits.eval,
    ];

    const missing: string[] = [];
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const id of allSplitIds) {
        if (!allTestCasesMap.has(id)) {
            missing.push(id);
        }
        if (seen.has(id)) {
            duplicates.push(id);
        }
        seen.add(id);
    }

    return {
        valid: missing.length === 0 && duplicates.length === 0,
        missing,
        duplicates,
    };
}

/**
 * Get test cases by category from a specific split
 */
export function getTestCasesByCategory(
    split: 'train' | 'test' | 'eval',
    category: string
): AnyTestCase[] {
    const splitData = split === 'train' ? getTrainSplit()
        : split === 'test' ? getTestSplit()
            : getEvalSplit();

    return splitData.filter(tc => (tc as any).category === category || (!('category' in tc) && category === 'kotlin'));
}

/**
 * Get test cases by complexity from a specific split
 */
export function getTestCasesByComplexity(
    split: 'train' | 'test' | 'eval',
    complexity: 'easy' | 'medium' | 'hard' | 'simple' | 'complex' | 'edge-case'
): AnyTestCase[] {
    const splitData = split === 'train' ? getTrainSplit()
        : split === 'test' ? getTestSplit()
            : getEvalSplit();

    return splitData.filter(tc => {
        if ('complexity' in tc) {
            return tc.complexity === complexity;
        }
        if ('difficulty' in tc) {
            // Map difficulty to complexity
            return tc.difficulty === complexity;
        }
        return false;
    });
}

/**
 * Get random sample from a split
 */
export function getRandomSample(
    split: 'train' | 'test' | 'eval',
    count: number
): AnyTestCase[] {
    const splitData = split === 'train' ? getTrainSplit()
        : split === 'test' ? getTestSplit()
            : getEvalSplit();

    const shuffled = [...splitData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Export split configuration for reference
export const splitConfig = datasetSplitConfig;

// Export all datasets for backwards compatibility
export { testDataset } from './test-dataset';
export { androidTestDataset } from './android-test-dataset';
export { PERFORMANCE_TEST_CASES } from './performance-test-dataset';
export { extendedTestDataset } from './extended-test-dataset';
