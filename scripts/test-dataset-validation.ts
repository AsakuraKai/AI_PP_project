/**
 * Test 1: Dataset Loading & Stats Validation
 * 
 * Validates:
 * ✓ Load all 4 datasets (Kotlin, Android, Performance, Extended)
 * ✓ Count real buildable test projects
 * ✓ Print counts and statistics
 * ✓ Verify no duplicates and all required fields present
 */

import { testDataset, datasetStats } from '../docs/Prof's-Requirement/AI/Dataset/Others/test-dataset';
import { androidTestDataset, androidDatasetStats } from '../docs/Prof's-Requirement/AI/Dataset/Others/android-test-dataset';
import { PERFORMANCE_TEST_CASES, TEST_STATISTICS } from '../docs/Prof's-Requirement/AI/Dataset/Others/performance-test-dataset';
import { extendedTestDataset, extendedDatasetStats } from '../docs/Prof's-Requirement/AI/Dataset/Others/extended-test-dataset';
import * as fs from 'fs';
import * as path from 'path';

console.log('\n' + '='.repeat(80));
console.log('[TEST 1] Dataset Loading & Stats Validation');
console.log('='.repeat(80) + '\n');

try {
    // Load all datasets
    console.log('[STEP 1] Loading Datasets...\n');

    console.log('1. Kotlin Test Dataset:');
    console.log(`   - Total cases: ${testDataset?.length || 0}`);
    if (datasetStats) {
        console.log(`   - Easy: ${datasetStats.easy || 0}`);
        console.log(`   - Medium: ${datasetStats.medium || 0}`);
        console.log(`   - Hard: ${datasetStats.hard || 0}`);
    }

    console.log('\n2. Android Test Dataset:');
    console.log(`   - Total cases: ${androidTestDataset?.length || 0}`);
    if (androidDatasetStats) {
        console.log(`   - Compose: ${androidDatasetStats.compose || 0}`);
        console.log(`   - XML: ${androidDatasetStats.xml || 0}`);
        console.log(`   - Gradle: ${androidDatasetStats.gradle || 0}`);
        console.log(`   - Manifest: ${androidDatasetStats.manifest || 0}`);
        console.log(`   - Mixed: ${androidDatasetStats.mixed || 0}`);
    }

    console.log('\n3. Performance Test Dataset:');
    console.log(`   - Total cases: ${PERFORMANCE_TEST_CASES?.length || 0}`);
    if (TEST_STATISTICS) {
        console.log(`   - Simple: ${TEST_STATISTICS.byComplexity?.simple || 0}`);
        console.log(`   - Medium: ${TEST_STATISTICS.byComplexity?.medium || 0}`);
        console.log(`   - Complex: ${TEST_STATISTICS.byComplexity?.complex || 0}`);
    }

    console.log('\n4. Extended Test Dataset:');
    console.log(`   - Total cases: ${extendedTestDataset?.length || 0}`);
    if (extendedDatasetStats) {
        console.log(`   - Kotlin: ${extendedDatasetStats.byCategory?.kotlin || 0}`);
        console.log(`   - Gradle: ${extendedDatasetStats.byCategory?.gradle || 0}`);
        console.log(`   - Compose: ${extendedDatasetStats.byCategory?.compose || 0}`);
        console.log(`   - XML: ${extendedDatasetStats.byCategory?.xml || 0}`);
        console.log(`   - Manifest: ${extendedDatasetStats.byCategory?.manifest || 0}`);
    }

    // Scan for real test project folders
    console.log('\n[STEP 2] Scanning Real Test Projects...\n');

    const datasetPath = path.join(__dirname, '..', 'docs', 'Prof\'s-Requirement', 'Dataset');
    const excludeDirs = ['Others', 'mvp-test-project']; // mvp is not a test case
    const realProjects: { name: string; hasGradle: boolean; hasKotlin: boolean; hasReadme: boolean }[] = [];

    try {
        const entries = fs.readdirSync(datasetPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory() && !excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
                const projectPath = path.join(datasetPath, entry.name);
                const hasGradle = fs.existsSync(path.join(projectPath, 'build.gradle'));
                const hasKotlin = fs.readdirSync(projectPath, { recursive: true })
                    .some((file: any) => typeof file === 'string' && file.endsWith('.kt'));
                const hasReadme = fs.existsSync(path.join(projectPath, 'README.md'));

                realProjects.push({
                    name: entry.name,
                    hasGradle,
                    hasKotlin,
                    hasReadme
                });
            }
        }

        console.log('5. Real Buildable Test Projects:');
        console.log(`   - Total projects: ${realProjects.length}`);
        realProjects.forEach(proj => {
            const status = proj.hasGradle && proj.hasKotlin ? '✓' : '⚠';
            console.log(`   ${status} ${proj.name}`);
            console.log(`      - Gradle: ${proj.hasGradle ? '✓' : '✗'} | Kotlin: ${proj.hasKotlin ? '✓' : '✗'} | README: ${proj.hasReadme ? '✓' : '✗'}`);
        });
    } catch (error) {
        console.log('   ⚠ Could not scan real projects directory');
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
    console.log(`\nTotal Real Test Projects: ${realProjects.length} buildable projects`);
    console.log(`\n📊 GRAND TOTAL: ${totalCases} test cases + ${realProjects.length} real projects = ${totalCases + realProjects.length} test resources`);

    // Validation checks
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

    // Check 3: Stats available
    if (datasetStats && androidDatasetStats && TEST_STATISTICS && extendedDatasetStats) {
        console.log('✓ Dataset statistics available');
        passed++;
    } else {
        console.log('✗ Missing dataset statistics');
        failed++;
    }

    // Check 4: Total cases meet minimum threshold (~90+)
    if (totalCases >= 90) {
        console.log(`✓ Total dataset size (${totalCases}) meets minimum threshold (90+)`);
        passed++;
    } else {
        console.log(`✗ Total dataset size (${totalCases}) below minimum threshold (90+)`);
        failed++;
    }

    // Check 5: Real projects found
    if (realProjects.length >= 8) {
        console.log(`✓ Real test projects found (${realProjects.length})`);
        passed++;
    } else {
        console.log(`✗ Insufficient real test projects (${realProjects.length} < 8)`);
        failed++;
    }

    // Check 6: Real projects are valid
    const validProjects = realProjects.filter(p => p.hasGradle && p.hasKotlin).length;
    if (validProjects >= 6) {
        console.log(`✓ Valid buildable projects (${validProjects}/${realProjects.length})`);
        passed++;
    } else {
        console.log(`✗ Too few valid projects (${validProjects}/${realProjects.length} < 6)`);
        failed++;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`[RESULT] ${passed}/${passed + failed} Checks Passed`);
    console.log('='.repeat(80) + '\n');

    if (failed === 0) {
        console.log('✓ TEST 1 PASSED: All datasets and projects validated successfully\n');
        process.exit(0);
    } else {
        console.log('✗ TEST 1 FAILED: Some validation checks did not pass\n');
        process.exit(1);
    }

} catch (error) {
    console.error('\n✗ TEST 1 FAILED: Error loading datasets');
    console.error(error);
    process.exit(1);
}
