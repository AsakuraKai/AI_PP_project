/**
 * Option C Test Runner - Run Phase 4 tests with MultiPassAgent
 * 
 * This script runs the full Phase 4 test suite using the new
 * MultiPassAgent with quality validation.
 * 
 * Usage:
 *   npm run test:phase4-optionc
 *   # or
 *   ts-node tests/real-world/run-option-c-tests.ts
 * 
 * @date January 5, 2026
 * @phase Phase 4: Testing & Validation - Option C
 */

import { OllamaClient } from '../../src/llm/OllamaClient';
import { MultiPassAgent } from '../../src/agent/MultiPassAgent';
import { Phase4TestSuite } from './Phase4TestSuite';
import * as path from 'path';
import * as fs from 'fs/promises';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
  qualityThreshold: 70,
  maxRegenerationAttempts: 3,
  verboseValidation: true,
  trackMetrics: true,
  
  // Test selection
  runAllTests: true,
  specificTests: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Run all 10 tests
  
  // Output
  resultsDir: path.join(__dirname, '../tests/results/phase4/option-c'),
  saveIndividualResults: true,
  generateComparisonReport: true
};

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('[LAUNCH] PHASE 4 - OPTION C TEST RUN');
  console.log('='.repeat(80));
  console.log();
  console.log('[LIST] Configuration:');
  console.log(`   Model: ${CONFIG.model}`);
  console.log(`   Quality Threshold: ${CONFIG.qualityThreshold}%`);
  console.log(`   Max Regeneration Attempts: ${CONFIG.maxRegenerationAttempts}`);
  console.log(`   Track Metrics: ${CONFIG.trackMetrics}`);
  console.log(`   Tests to Run: ${CONFIG.runAllTests ? 'All 10 tests' : CONFIG.specificTests.join(', ')}`);
  console.log();
  
  // Initialize LLM client
  console.log('[TOOL] Initializing Ollama client...');
  const llm = new OllamaClient({
    model: CONFIG.model,
    baseUrl: 'http://localhost:11434',
    timeout: 120000 // 2 minute timeout
  });
  
  // Initialize MultiPassAgent
  console.log('[INIT] Creating MultiPassAgent with quality validation...');
  const agent = new MultiPassAgent(llm, {
    maxIterations: 5,
    generateFix: true,
    enableCaching: true,
    qualityThreshold: CONFIG.qualityThreshold,
    maxRegenerationAttempts: CONFIG.maxRegenerationAttempts,
    verboseValidation: CONFIG.verboseValidation,
    trackMetrics: CONFIG.trackMetrics
  });
  
  // Initialize test suite
  console.log('[PACKAGE] Setting up Phase 4 test suite...');
  const testSuite = new Phase4TestSuite(agent, { useValidation: true });
  
  // Get test cases
  const allTests = testSuite.getAllTestCases();
  const testsToRun = CONFIG.runAllTests 
    ? allTests 
    : allTests.filter(t => CONFIG.specificTests.includes(t.id));
  
  console.log(`\n[OK] Ready to run ${testsToRun.length} test(s)\n`);
  
  // Run tests
  console.log('='.repeat(80));
  console.log('[TEST] RUNNING TESTS');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  const report = await testSuite.runAllTests();
  const totalDuration = Date.now() - startTime;
  
  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('[STATS] RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log(`[TIME]  Total Duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`[UP] Tests Passed: ${report.passed_tests}/${report.total_tests} (${Math.round(report.passed_tests / report.total_tests * 100)}%)`);
  console.log(`[STATS] Average Usability: ${Math.round(report.average_usability)}%`);
  console.log(`[FAST] Average Latency: ${Math.round(report.average_latency_ms)}ms`);
  console.log();
  
  // Get validation metrics from agent
  const validationMetrics = agent.getMetrics();
  console.log('[TARGET] VALIDATION METRICS (Option C Performance)');
  console.log('='.repeat(80));
  console.log(agent.getMetricsSummary());
  
  // Save detailed results
  console.log('\n💾 Saving results...');
  await fs.mkdir(CONFIG.resultsDir, { recursive: true });
  
  // Save main report
  const reportPath = path.join(CONFIG.resultsDir, `option-c-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: CONFIG,
    testResults: report,
    validationMetrics,
    totalDuration
  }, null, 2));
  console.log(`   [OK] Report saved: ${path.basename(reportPath)}`);
  
  // Save metrics
  const metricsPath = path.join(CONFIG.resultsDir, `validation-metrics-${Date.now()}.json`);
  await fs.writeFile(metricsPath, agent.exportMetrics());
  console.log(`   [OK] Metrics saved: ${path.basename(metricsPath)}`);
  
  // Generate comparison if baseline exists
  if (CONFIG.generateComparisonReport) {
    try {
      await generateComparisonReport(report, validationMetrics);
    } catch (error) {
      console.log(`   [WARN]  Could not generate comparison (baseline may not exist): ${error}`);
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('[OK] OPTION C TEST RUN COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log('[STATS] Key Findings:');
  console.log(`   - Usability Score: ${Math.round(report.average_usability)}% (Baseline: ~56%, Target: 70-75%)`);
  console.log(`   - Tests Passing: ${report.passed_tests}/${report.total_tests} (Target: 7/10)`);
  console.log(`   - First Attempt Pass Rate: ${Math.round(validationMetrics.passedFirstAttempt / validationMetrics.totalAnalyses * 100)}%`);
  console.log(`   - Average Validation Score: ${validationMetrics.averageScore.toFixed(1)}/100`);
  console.log();
  
  // Determine success
  const targetMet = report.average_usability >= 70;
  if (targetMet) {
    console.log('[SUCCESS] SUCCESS! Target usability of 70% achieved!');
    console.log('   Phase 4 can be marked as COMPLETE [OK]');
  } else {
    const improvement = report.average_usability - 56; // Baseline from Iteration 8
    console.log(`[UP] Improvement: +${improvement.toFixed(1)}% over baseline (56%)`);
    if (report.average_usability >= 65) {
      console.log('   Close to target! Consider additional tuning or trying Option A (Claude/GPT-4).');
    } else {
      console.log('   Below expectations. May need to try Option A (better model) or refine validation logic.');
    }
  }
  console.log();
  console.log('[FILE] Full results saved to:', CONFIG.resultsDir);
  console.log();
}

// ============================================================================
// Comparison Report Generation
// ============================================================================

async function generateComparisonReport(currentReport: any, validationMetrics: any) {
  console.log('\n[STATS] Generating comparison report...');
  
  // Load most recent Iteration 8 baseline
  const baselineDir = path.join(__dirname, '../tests/results/phase4');
  const files = await fs.readdir(baselineDir);
  const baselineFiles = files
    .filter(f => f.startsWith('phase4-test-suite-report-') && !f.includes('option-c'))
    .sort()
    .reverse();
  
  if (baselineFiles.length === 0) {
    throw new Error('No baseline report found');
  }
  
  const baselinePath = path.join(baselineDir, baselineFiles[0]);
  const baselineContent = await fs.readFile(baselinePath, 'utf-8');
  const baseline = JSON.parse(baselineContent);
  
  // Calculate improvements
  const comparison = {
    baseline: {
      iteration: 'Iteration 8',
      average_usability: baseline.average_usability,
      tests_passed: baseline.passed_tests,
      average_latency: baseline.average_latency_ms
    },
    optionC: {
      iteration: 'Option C (Validation)',
      average_usability: currentReport.average_usability,
      tests_passed: currentReport.passed_tests,
      average_latency: currentReport.average_latency_ms,
      validation_metrics: {
        first_attempt_pass_rate: validationMetrics.passedFirstAttempt / validationMetrics.totalAnalyses * 100,
        average_score: validationMetrics.averageScore,
        average_attempts: validationMetrics.averageAttempts
      }
    },
    improvements: {
      usability_delta: currentReport.average_usability - baseline.average_usability,
      usability_percent_change: ((currentReport.average_usability - baseline.average_usability) / baseline.average_usability * 100).toFixed(1),
      tests_passed_delta: currentReport.passed_tests - baseline.passed_tests,
      latency_delta: currentReport.average_latency_ms - baseline.average_latency_ms,
      latency_percent_change: ((currentReport.average_latency_ms - baseline.average_latency_ms) / baseline.average_latency_ms * 100).toFixed(1)
    }
  };
  
  const comparisonPath = path.join(CONFIG.resultsDir, `comparison-iteration8-vs-optionc-${Date.now()}.json`);
  await fs.writeFile(comparisonPath, JSON.stringify(comparison, null, 2));
  console.log(`   [OK] Comparison saved: ${path.basename(comparisonPath)}`);
  
  // Print comparison
  console.log('\n[STATS] COMPARISON: Iteration 8 vs Option C');
  console.log('='.repeat(80));
  console.log(`Usability:     ${baseline.average_usability.toFixed(1)}% → ${currentReport.average_usability.toFixed(1)}% (${comparison.improvements.usability_delta > 0 ? '+' : ''}${comparison.improvements.usability_delta.toFixed(1)}%, ${comparison.improvements.usability_percent_change}%)`);
  console.log(`Tests Passed:  ${baseline.passed_tests}/10 → ${currentReport.passed_tests}/10 (${comparison.improvements.tests_passed_delta > 0 ? '+' : ''}${comparison.improvements.tests_passed_delta})`);
  console.log(`Latency:       ${baseline.average_latency_ms.toFixed(0)}ms → ${currentReport.average_latency_ms.toFixed(0)}ms (${comparison.improvements.latency_delta > 0 ? '+' : ''}${comparison.improvements.latency_delta.toFixed(0)}ms, ${comparison.improvements.latency_percent_change}%)`);
  console.log('='.repeat(80));
}

// ============================================================================
// Run Script
// ============================================================================

main().catch(error => {
  console.error('\n[X] Test run failed:', error);
  process.exit(1);
});
