/**
 * Phase 1 Quick Re-Test
 * Run only the 5 core validation tests (6-10) to confirm Phase 1 stability
 * Expected: 67.8% average usability (all tests 66-72%)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  testNumber: number;
  testName: string;
  usability: number;
  latency: number;
  passed: boolean;
}

const TESTS = [
  { num: 6, name: 'Manifest Permission', script: 'chunk8-test6-manifest.ts', target: 67.5 },
  { num: 7, name: 'Network Connectivity', script: 'chunk8-test7-gradle-network.ts', target: 72.0 },
  { num: 8, name: 'Build Cache', script: 'chunk8-test8-build-cache.ts', target: 66.0 },
  { num: 9, name: 'ProGuard Minification', script: 'chunk8-test9-proguard.ts', target: 66.0 },
  { num: 10, name: 'Navigation Argument', script: 'chunk8-test10-navigation.ts', target: 67.5 },
];

const PHASE_1_TARGET = 65; // Overall target
const EXPECTED_AVERAGE = 67.8; // Achieved in Phase 1

console.log('[LAUNCH] PHASE 1 QUICK RE-TEST\n');
console.log('================================================================================\n');
console.log('Running 5 core validation tests to confirm Phase 1 stability');
console.log(`Expected: ${EXPECTED_AVERAGE}% average (all tests 66-72%)\n`);
console.log('================================================================================\n');

const results: TestResult[] = [];
let totalUsability = 0;
let totalLatency = 0;
let passedTests = 0;

for (const test of TESTS) {
  console.log(`\n[${test.num - 5}/5] Running Test ${test.num}: ${test.name}...`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`   Target: ${test.target}%\n`);

  try {
    const scriptPath = path.join(__dirname, test.script);
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`[X] Script not found: ${test.script}`);
      results.push({
        testNumber: test.num,
        testName: test.name,
        usability: 0,
        latency: 0,
        passed: false,
      });
      continue;
    }

    const startTime = Date.now();
    
    // Run test and capture output
    const output = execSync(`tsx "${scriptPath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const duration = (Date.now() - startTime) / 1000;

    // Parse usability from output
    const usabilityMatch = output.match(/Overall Usability:\s+(\d+(?:\.\d+)?)%/);
    const latencyMatch = output.match(/Latency:\s+(\d+(?:\.\d+)?)(?:ms|s)/);

    if (!usabilityMatch) {
      console.error('[WARN] Could not parse usability from output');
      console.log('Last 500 chars of output:', output.slice(-500));
      results.push({
        testNumber: test.num,
        testName: test.name,
        usability: 0,
        latency: duration,
        passed: false,
      });
      continue;
    }

    const usability = parseFloat(usabilityMatch[1]);
    const latency = latencyMatch ? parseFloat(latencyMatch[1]) : duration;
    const passed = usability >= test.target - 5; // Allow 5% margin

    console.log(`[OK] Test ${test.num} completed: ${usability}% usability`);
    console.log(`   Target: ${test.target}% → Actual: ${usability}% (${passed ? 'PASSED' : 'FAILED'})`);
    console.log(`   Latency: ${latency.toFixed(1)}s`);

    results.push({
      testNumber: test.num,
      testName: test.name,
      usability,
      latency,
      passed,
    });

    totalUsability += usability;
    totalLatency += latency;
    if (passed) passedTests++;

  } catch (error: any) {
    console.error(`[X] Test ${test.num} failed with error:`, error.message);
    results.push({
      testNumber: test.num,
      testName: test.name,
      usability: 0,
      latency: 0,
      passed: false,
    });
  }
}

// Calculate statistics
const avgUsability = totalUsability / TESTS.length;
const avgLatency = totalLatency / TESTS.length;
const passRate = (passedTests / TESTS.length) * 100;

console.log('\n\n================================================================================');
console.log('[STATS] PHASE 1 RE-TEST RESULTS');
console.log('================================================================================\n');

console.log('Individual Test Results:');
console.log('--------------------------------------------------------------------------------');
results.forEach((result) => {
  const status = result.passed ? '[OK] PASS' : '[X] FAIL';
  console.log(
    `Test ${result.testNumber}: ${result.testName.padEnd(25)} ${result.usability.toFixed(1)}%  ${status}`
  );
});

console.log('\n--------------------------------------------------------------------------------');
console.log('Overall Statistics:');
console.log('--------------------------------------------------------------------------------');
console.log(`Average Usability:     ${avgUsability.toFixed(1)}% (expected: ${EXPECTED_AVERAGE}%)`);
console.log(`Average Latency:       ${avgLatency.toFixed(1)}s`);
console.log(`Tests Passed:          ${passedTests}/${TESTS.length} (${passRate.toFixed(0)}%)`);
console.log(`Phase 1 Target:        ${PHASE_1_TARGET}%`);

const deviation = avgUsability - EXPECTED_AVERAGE;
const deviationPct = (deviation / EXPECTED_AVERAGE) * 100;

console.log(`\nDeviation from Phase 1: ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}% (${deviationPct > 0 ? '+' : ''}${deviationPct.toFixed(1)}%)`);

console.log('\n================================================================================');
console.log('PHASE 1 STATUS');
console.log('================================================================================\n');

if (avgUsability >= PHASE_1_TARGET && passedTests >= 4) {
  console.log('[OK] PHASE 1 STABLE - Ready to proceed to Phase 2\n');
  console.log(`   Average usability: ${avgUsability.toFixed(1)}% (target: ${PHASE_1_TARGET}%)`);
  console.log(`   Tests passing: ${passedTests}/5 (80%+)`);
  console.log(`   Performance: ${avgLatency.toFixed(1)}s average\n`);
  console.log('[LAUNCH] You can now start Phase 2 with confidence!');
} else if (avgUsability >= PHASE_1_TARGET - 5) {
  console.log('[WARN] PHASE 1 MOSTLY STABLE - Minor issues detected\n');
  console.log(`   Average usability: ${avgUsability.toFixed(1)}% (target: ${PHASE_1_TARGET}%)`);
  console.log(`   Tests passing: ${passedTests}/5`);
  console.log(`   Gap: ${(PHASE_1_TARGET - avgUsability).toFixed(1)}%\n`);
  console.log('Recommendation: Review failed tests before Phase 2');
} else {
  console.log('[X] PHASE 1 REGRESSION DETECTED - Do not proceed to Phase 2\n');
  console.log(`   Average usability: ${avgUsability.toFixed(1)}% (target: ${PHASE_1_TARGET}%)`);
  console.log(`   Tests passing: ${passedTests}/5`);
  console.log(`   Gap: ${(PHASE_1_TARGET - avgUsability).toFixed(1)}%\n`);
  console.log('Recommendation: Apply hotfixes and re-run validation');
}

console.log('\n================================================================================\n');

// Save results
const resultsPath = path.join(
  __dirname,
  '..',
  'tests',
  'results',
  'phase1',
  `retest-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`
);

fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
fs.writeFileSync(
  resultsPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      phase: 'Phase 1 Re-Test',
      results,
      summary: {
        avgUsability,
        avgLatency,
        passedTests,
        totalTests: TESTS.length,
        passRate,
        target: PHASE_1_TARGET,
        expected: EXPECTED_AVERAGE,
        deviation,
        stable: avgUsability >= PHASE_1_TARGET && passedTests >= 4,
      },
    },
    null,
    2
  )
);

console.log(`💾 Results saved to: ${resultsPath}\n`);

// Exit with appropriate code
process.exit(avgUsability >= PHASE_1_TARGET && passedTests >= 4 ? 0 : 1);
