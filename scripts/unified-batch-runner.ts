/**
 * Unified Batch Test Runner
 * 
 * REPLACES: chunk7-run-all-tests.ts, chunk8-run-all-tests.ts, chunk9-retest-all.ts
 * 
 * Runs all individual tests using the shared TestHarness infrastructure.
 * Eliminates duplication across multiple batch runners.
 * 
 * Usage:
 *   npm run test:all           # Run all tests
 *   npm run test:range 1-5     # Run tests 1-5
 *   npm run test:single 6      # Run test 6
 */

import { runTest1 } from './chunk7-test1-agp-refactored';
import { runTest6ManifestPermission } from './chunk8-test6-manifest-refactored';
import { runTest7GradleNetwork } from './chunk8-test7-gradle-network-refactored';
import { runTest8BuildCache } from './chunk8-test8-build-cache-refactored';
import { runTest9ProGuard } from './chunk8-test9-proguard-refactored';
import { runTest10Navigation } from './chunk8-test10-navigation-refactored';

interface BatchConfig {
  tests?: number[];  // Specific test numbers to run
  startTest?: number;
  endTest?: number;
  continueOnError?: boolean;
}

const TEST_FUNCTIONS = [
  { id: 1, name: 'AGP Version Error', fn: runTest1 },
  { id: 6, name: 'Manifest Permission Missing', fn: runTest6ManifestPermission },
  { id: 7, name: 'Gradle Sync Failed (Network)', fn: runTest7GradleNetwork },
  { id: 8, name: 'Build Cache Corruption', fn: runTest8BuildCache },
  { id: 9, name: 'R8/ProGuard Rule Missing', fn: runTest9ProGuard },
  { id: 10, name: 'Jetpack Navigation Argument Mismatch', fn: runTest10Navigation },
];

/**
 * Run multiple tests in batch
 */
async function runBatchTests(config: BatchConfig = {}): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 UNIFIED BATCH TEST RUNNER');
  console.log('='.repeat(80));

  // Determine which tests to run
  let testsToRun = TEST_FUNCTIONS;

  if (config.tests && config.tests.length > 0) {
    testsToRun = TEST_FUNCTIONS.filter(t => config.tests!.includes(t.id));
  } else if (config.startTest !== undefined || config.endTest !== undefined) {
    const start = config.startTest || 1;
    const end = config.endTest || 10;
    testsToRun = TEST_FUNCTIONS.filter(t => t.id >= start && t.id <= end);
  }

  console.log(`\n📋 Running ${testsToRun.length} test(s):\n`);
  testsToRun.forEach(t => console.log(`   ${t.id}. ${t.name}`));
  console.log('');

  const results = {
    total: testsToRun.length,
    passed: 0,
    failed: 0,
    errors: [] as Array<{ test: number; error: any }>,
  };

  const startTime = Date.now();

  // Run tests
  for (const test of testsToRun) {
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`▶ Starting Test ${test.id}: ${test.name}`);
      console.log('='.repeat(80));

      await test.fn();
      results.passed++;

      console.log(`\n✅ Test ${test.id} completed successfully`);
    } catch (error) {
      results.failed++;
      results.errors.push({ test: test.id, error });

      console.error(`\n❌ Test ${test.id} failed:`, error);

      if (!config.continueOnError) {
        console.error('\n⚠️  Stopping batch execution due to test failure');
        break;
      } else {
        console.log('\n⚠️  Continuing to next test...');
      }
    }
  }

  const totalTime = Date.now() - startTime;

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 BATCH TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.errors.forEach(({ test, error }) => {
      console.log(`   Test ${test}: ${error.message || error}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // Exit with appropriate code
  if (results.failed > 0) {
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): BatchConfig {
  const args = process.argv.slice(2);
  const config: BatchConfig = {
    continueOnError: args.includes('--continue-on-error'),
  };

  // Check for specific test numbers
  const testArg = args.find(arg => arg.startsWith('--tests='));
  if (testArg) {
    const testNums = testArg.split('=')[1].split(',').map(Number);
    config.tests = testNums;
    return config;
  }

  // Check for range
  const rangeArg = args.find(arg => arg.startsWith('--range='));
  if (rangeArg) {
    const [start, end] = rangeArg.split('=')[1].split('-').map(Number);
    config.startTest = start;
    config.endTest = end;
    return config;
  }

  // Check for start/end separately
  const startArg = args.find(arg => arg.startsWith('--start='));
  if (startArg) {
    config.startTest = Number(startArg.split('=')[1]);
  }

  const endArg = args.find(arg => arg.startsWith('--end='));
  if (endArg) {
    config.endTest = Number(endArg.split('=')[1]);
  }

  return config;
}

// Run if executed directly
if (require.main === module) {
  const config = parseArgs();

  runBatchTests(config)
    .then(() => {
      console.log('\n✅ Batch execution complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Batch execution failed:', error);
      process.exit(1);
    });
}

export { runBatchTests, TEST_FUNCTIONS };
