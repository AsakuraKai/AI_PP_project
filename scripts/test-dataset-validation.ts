/**
 * Dataset Validation Script with Zod Schema Validation
 *
 * Validates:
 * ✓ Load all 4 datasets (Kotlin, Android, Performance, Extended)
 * ✓ Validate data structure and types using Zod schemas
 * ✓ Check file existence for referenced files
 * ✓ Verify no duplicate IDs
 * ✓ Count real buildable test projects
 * ✓ Comprehensive error reporting with context
 */

import { testDataset, datasetStats } from "../docs/Prof's-Requirement/AI/Dataset/Others/test-dataset";
import { androidTestDataset, androidDatasetStats } from "../docs/Prof's-Requirement/AI/Dataset/Others/android-test-dataset";
import { PERFORMANCE_TEST_CASES, TEST_STATISTICS } from "../docs/Prof's-Requirement/AI/Dataset/Others/performance-test-dataset";
import { extendedTestDataset, extendedDatasetStats } from "../docs/Prof's-Requirement/AI/Dataset/Others/extended-test-dataset";
import * as fs from 'fs';
import * as path from 'path';
import {
  TestCaseSchema,
  AndroidTestCaseSchema,
  PerformanceTestCaseSchema,
  ExtendedTestCaseSchema,
  DatasetStatsSchema,
  AndroidDatasetStatsSchema,
  PerformanceStatsSchema,
  ExtendedDatasetStatsSchema,
  ValidationResult,
  ValidationError,
  FileValidationResult,
} from '../src/types/dataset';
import { z } from 'zod';

// ============================================================================
// Validation Constants
// ============================================================================

const MIN_TOTAL_CASES = 90;
const MIN_REAL_PROJECTS = 8;
const MIN_VALID_PROJECTS = 6;
const MAX_SCAN_DEPTH = 2;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates a dataset against a Zod schema
 * @param data - The dataset to validate
 * @param itemSchema - The Zod schema to validate against
 * @param datasetName - Name of the dataset for reporting
 * @returns Validation result with errors and statistics
 */
function validateDataset<T>(
  data: unknown,
  itemSchema: z.ZodSchema<T>,
  datasetName: string
): ValidationResult {
  const errors: ValidationError[] = [];
  let validCases = 0;

  if (!Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ path: 'root', message: 'Dataset is not an array' }],
      datasetName,
      totalCases: 0,
      validCases: 0,
    };
  }

  // Validate individual items
  data.forEach((item, index) => {
    try {
      itemSchema.parse(item);
      validCases++;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            path: `[${index}].${err.path.join('.')}`,
            message: err.message,
            value: err.path.length > 0 ? getNestedValue(item, err.path) : item,
          });
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    datasetName,
    totalCases: data.length,
    validCases,
  };
}

/**
 * Retrieves a nested value from an object using a path array
 * @param obj - The object to traverse
 * @param path - Array of keys to follow
 * @returns The value at the nested path
 */
function getNestedValue(obj: unknown, path: (string | number)[]): unknown {
  return path.reduce((current: any, key) => current?.[key], obj);
}

/**
 * Checks for duplicate IDs across multiple datasets
 * @param datasets - Array of datasets to check
 * @returns Array of validation errors for duplicates
 */
function checkDuplicateIds(datasets: { name: string; data: unknown[] }[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const idMap = new Map<string, string[]>();

  datasets.forEach(({ name, data }) => {
    if (!Array.isArray(data)) return;

    data.forEach((item, index) => {
      const id = (item as any)?.id;
      if (id) {
        if (!idMap.has(id)) {
          idMap.set(id, []);
        }
        idMap.get(id)!.push(`${name}[${index}]`);
      }
    });
  });

  idMap.forEach((locations, id) => {
    if (locations.length > 1) {
      errors.push({
        path: 'duplicate_ids',
        message: `Duplicate ID "${id}" found in: ${locations.join(', ')}`,
        value: id,
      });
    }
  });

  return errors;
}

/**
 * Validates that all required dataset files exist
 * @param datasetPath - Path to the dataset directory
 * @returns Array of file validation results
 */
function validateFileReferences(datasetPath: string): FileValidationResult[] {
  const results: FileValidationResult[] = [];

  const filesToCheck = [
    'test-dataset.ts',
    'android-test-dataset.ts',
    'performance-test-dataset.ts',
    'extended-test-dataset.ts',
  ];

  filesToCheck.forEach((file) => {
    const fullPath = path.join(datasetPath, file);
    const exists = fs.existsSync(fullPath);
    results.push({
      exists,
      path: fullPath,
      error: exists ? undefined : `File not found: ${fullPath}`,
    });
  });

  return results;
}

/**
 * Scans a directory for Kotlin files with depth limit
 * @param dirPath - Directory to scan
 * @param depth - Current depth level
 * @param maxDepth - Maximum depth to scan
 * @returns True if any .kt files found
 */
function hasKotlinFiles(dirPath: string, depth: number = 0, maxDepth: number = MAX_SCAN_DEPTH): boolean {
    if (depth > maxDepth) return false;

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;

            if (entry.isFile() && entry.name.endsWith('.kt')) {
                return true;
            }

            if (entry.isDirectory()) {
                const subPath = path.join(dirPath, entry.name);
                if (hasKotlinFiles(subPath, depth + 1, maxDepth)) {
                    return true;
                }
            }
        }
    } catch (error) {
        // Ignore permission errors or inaccessible directories
    }

    return false;
}

function printValidationResult(result: ValidationResult): void {
  console.log(`\n${result.datasetName}:`);
  console.log(`   - Total cases: ${result.totalCases}`);
  console.log(`   - Valid cases: ${result.validCases}`);
  console.log(`   - Status: ${result.valid ? '✓ VALID' : '✗ INVALID'}`);

  if (result.errors.length > 0) {
    console.log(`   - Errors: ${result.errors.length}`);
    result.errors.slice(0, 5).forEach((error) => {
      console.log(`     • ${error.path}: ${error.message}`);
      if (error.value !== undefined) {
        const valueStr = JSON.stringify(error.value);
        console.log(`       Value: ${valueStr.length > 50 ? valueStr.substring(0, 50) + '...' : valueStr}`);
      }
    });
    if (result.errors.length > 5) {
      console.log(`     ... and ${result.errors.length - 5} more errors`);
    }
  }
}

// ============================================================================
// Main Validation Script
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('[DATASET VALIDATION] Comprehensive Schema & Structure Validation');
console.log('='.repeat(80) + '\n');

try {
    // STEP 1: Validate Dataset Schemas
    console.log('[STEP 1] Validating Dataset Schemas with Zod...\n');

    const kotlinResult = validateDataset(testDataset, TestCaseSchema, '1. Kotlin Test Dataset');
    const androidResult = validateDataset(androidTestDataset, AndroidTestCaseSchema, '2. Android Test Dataset');
    const performanceResult = validateDataset(PERFORMANCE_TEST_CASES, PerformanceTestCaseSchema, '3. Performance Test Dataset');
    const extendedResult = validateDataset(extendedTestDataset, ExtendedTestCaseSchema, '4. Extended Test Dataset');

    printValidationResult(kotlinResult);
    printValidationResult(androidResult);
    printValidationResult(performanceResult);
    printValidationResult(extendedResult);

    // STEP 2: Validate Statistics
    console.log('\n[STEP 2] Validating Dataset Statistics...\n');

    const statsResults = [
      { name: 'Kotlin Stats', data: datasetStats, schema: DatasetStatsSchema },
      { name: 'Android Stats', data: androidDatasetStats, schema: AndroidDatasetStatsSchema },
      { name: 'Performance Stats', data: TEST_STATISTICS, schema: PerformanceStatsSchema },
      { name: 'Extended Stats', data: extendedDatasetStats, schema: ExtendedDatasetStatsSchema },
    ];

    let statsValid = true;
    statsResults.forEach(({ name, data, schema }) => {
      try {
        schema.parse(data);
        console.log(`✓ ${name}: Valid`);
      } catch (error) {
        statsValid = false;
        console.log(`✗ ${name}: Invalid`);
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            console.log(`   • ${err.path.join('.')}: ${err.message}`);
          });
        }
      }
    });

    // STEP 3: Check for Duplicate IDs
    console.log('\n[STEP 3] Checking for Duplicate IDs...\n');

    const duplicateErrors = checkDuplicateIds([
      { name: 'Kotlin', data: testDataset },
      { name: 'Android', data: androidTestDataset },
      { name: 'Performance', data: PERFORMANCE_TEST_CASES },
      { name: 'Extended', data: extendedTestDataset },
    ]);

    if (duplicateErrors.length === 0) {
      console.log('✓ No duplicate IDs found');
    } else {
      console.log(`✗ Found ${duplicateErrors.length} duplicate ID(s):`);
      duplicateErrors.forEach((error) => {
        console.log(`   • ${error.message}`);
      });
    }

    // STEP 4: Validate File References
    console.log('\n[STEP 4] Validating File References...\n');

    const datasetPath = path.join(__dirname, '..', 'docs', 'Prof\'s-Requirement', 'AI', 'Dataset', 'Others');
    const fileResults = validateFileReferences(datasetPath);

    let allFilesExist = true;
    fileResults.forEach((result) => {
      if (result.exists) {
        console.log(`✓ ${path.basename(result.path)}`);
      } else {
        allFilesExist = false;
        console.log(`✗ ${path.basename(result.path)}: ${result.error}`);
      }
    });

    // STEP 5: Scan for Real Test Projects
    console.log('\n[STEP 5] Scanning Real Test Projects...\n');

    const projectsPath = path.join(__dirname, '..', 'docs', 'Prof\'s-Requirement', 'Dataset');
    const excludeDirs = ['Others', 'mvp-test-project'];
    const realProjects: { name: string; hasGradle: boolean; hasKotlin: boolean; hasReadme: boolean }[] = [];

    let projectScanSuccess = false;
    try {
        if (fs.existsSync(projectsPath)) {
            const entries = fs.readdirSync(projectsPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory() && !excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
                    const projectPath = path.join(projectsPath, entry.name);
                    const hasGradle = fs.existsSync(path.join(projectPath, 'build.gradle'));
                    const hasKotlin = hasKotlinFiles(projectPath);
                    const hasReadme = fs.existsSync(path.join(projectPath, 'README.md'));

                    realProjects.push({
                        name: entry.name,
                        hasGradle,
                        hasKotlin,
                        hasReadme
                    });
                }
            }

            console.log('Real Buildable Test Projects:');
            console.log(`   - Total projects: ${realProjects.length}`);
            realProjects.forEach(proj => {
                const status = proj.hasGradle && proj.hasKotlin ? '✓' : '⚠';
                console.log(`   ${status} ${proj.name}`);
                console.log(`      - Gradle: ${proj.hasGradle ? '✓' : '✗'} | Kotlin: ${proj.hasKotlin ? '✓' : '✗'} | README: ${proj.hasReadme ? '✓' : '✗'}`);
            });
            projectScanSuccess = true;
        } else {
            console.log(`⚠ Projects directory not found: ${projectsPath}`);
        }
    } catch (error) {
        console.log('⚠ Could not scan real projects directory');
        console.log(`   Error: ${error}`);
    }

    // Summary
    const totalCases =
        (testDataset?.length || 0) +
        (androidTestDataset?.length || 0) +
        (PERFORMANCE_TEST_CASES?.length || 0) +
        (extendedTestDataset?.length || 0);

    console.log('\n' + '='.repeat(80));
    console.log('[SUMMARY]');
    console.log('='.repeat(80));
    console.log(`Total Test Case Definitions: ${totalCases} cases`);
    console.log(`   - Kotlin: ${testDataset?.length || 0}`);
    console.log(`   - Android: ${androidTestDataset?.length || 0}`);
    console.log(`   - Performance: ${PERFORMANCE_TEST_CASES?.length || 0}`);
    console.log(`   - Extended: ${extendedTestDataset?.length || 0}`);
    if (projectScanSuccess) {
        console.log(`\nTotal Real Test Projects: ${realProjects.length} buildable projects`);
        console.log(`\nGRAND TOTAL: ${totalCases} test cases + ${realProjects.length} real projects = ${totalCases + realProjects.length} test resources`);
    }

    // Validation Checks
    console.log('\n[VALIDATION CHECKS]');
    console.log('='.repeat(80));

    let passed = 0;
    let failed = 0;

    // Check 1: All datasets loaded
    if (testDataset && androidTestDataset && PERFORMANCE_TEST_CASES && extendedTestDataset) {
        console.log('✓ All 4 datasets loaded successfully');
        passed++;
    } else {
        console.log('✗ Failed to load one or more datasets');
        failed++;
    }

    // Check 2: Datasets are not empty
    if ((testDataset?.length || 0) > 0 &&
        (androidTestDataset?.length || 0) > 0 &&
        (PERFORMANCE_TEST_CASES?.length || 0) > 0 &&
        (extendedTestDataset?.length || 0) > 0) {
        console.log('✓ All datasets contain test cases');
        passed++;
    } else {
        console.log('✗ One or more datasets are empty');
        failed++;
    }

    // Check 3: Schema validation passed
    if (kotlinResult.valid && androidResult.valid && performanceResult.valid && extendedResult.valid) {
        console.log('✓ All datasets pass Zod schema validation');
        passed++;
    } else {
        console.log('✗ One or more datasets failed schema validation');
        const totalErrors = kotlinResult.errors.length + androidResult.errors.length +
                           performanceResult.errors.length + extendedResult.errors.length;
        console.log(`   Total validation errors: ${totalErrors}`);
        failed++;
    }

    // Check 4: Stats validation
    if (statsValid) {
        console.log('✓ Dataset statistics are valid');
        passed++;
    } else {
        console.log('✗ Dataset statistics validation failed');
        failed++;
    }

    // Check 5: No duplicate IDs
    if (duplicateErrors.length === 0) {
        console.log('✓ No duplicate IDs found across datasets');
        passed++;
    } else {
        console.log(`✗ Found ${duplicateErrors.length} duplicate ID(s)`);
        failed++;
    }

    // Check 6: File references exist
    if (allFilesExist) {
        console.log('✓ All dataset files exist');
        passed++;
    } else {
        console.log('✗ Some dataset files are missing');
        failed++;
    }

    // Check 7: Total cases meet minimum threshold
    if (totalCases >= MIN_TOTAL_CASES) {
        console.log(`✓ Total dataset size (${totalCases}) meets minimum threshold (${MIN_TOTAL_CASES}+)`);
        passed++;
    } else {
        console.log(`✗ Total dataset size (${totalCases}) below minimum threshold (${MIN_TOTAL_CASES}+)`);
        failed++;
    }

    // Check 8: Real projects found (if scan succeeded)
    if (projectScanSuccess) {
        if (realProjects.length >= MIN_REAL_PROJECTS) {
            console.log(`✓ Real test projects found (${realProjects.length})`);
            passed++;
        } else {
            console.log(`✗ Insufficient real test projects (${realProjects.length} < ${MIN_REAL_PROJECTS})`);
            failed++;
        }

        // Check 9: Real projects are valid
        const validProjects = realProjects.filter(p => p.hasGradle && p.hasKotlin).length;
        if (validProjects >= MIN_VALID_PROJECTS) {
            console.log(`✓ Valid buildable projects (${validProjects}/${realProjects.length})`);
            passed++;
        } else {
            console.log(`✗ Too few valid projects (${validProjects}/${realProjects.length} < ${MIN_VALID_PROJECTS})`);
            failed++;
        }
    } else {
        console.log('⚠ Skipped real project validation (directory not found)');
    }

    console.log('\n' + '='.repeat(80));
    console.log(`[RESULT] ${passed}/${passed + failed} Checks Passed`);
    console.log('='.repeat(80) + '\n');

    if (failed === 0) {
        console.log('✓ VALIDATION PASSED: All datasets validated successfully\n');
        process.exit(0);
    } else {
        console.log('✗ VALIDATION FAILED: Some validation checks did not pass\n');
        console.log('Review the errors above and fix the issues in the dataset files.\n');
        process.exit(1);
    }

} catch (error) {
    console.error('\n✗ VALIDATION FAILED: Error during validation');
    console.error(error);
    process.exit(1);
}
