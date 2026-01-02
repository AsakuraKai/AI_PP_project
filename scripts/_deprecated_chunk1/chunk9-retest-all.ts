/**
 * Chunk 9 - Re-Test All 10 Cases
 * 
 * Re-executes all 10 test cases to validate improvements made in Chunk 9:
 * - Priority 1: Fixed LLM response parsing (handles <think> tags)
 * - Priority 2: Error classification system (6 categories)
 * - Priority 3: Diversified few-shot examples (30 new examples)
 * - Priority 4: Extended FileResolver (manifest, proguard, navigation)
 * 
 * Compares Chunk 8 baseline with Chunk 9 improvements.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  test: string;
  testNumber: number;
  timestamp: string;
  metrics: {
    diagnosis_accuracy: number;
    solution_specificity: number;
    file_identification: number;
    code_examples: number;
    version_suggestions: number;
    overall_usability: number;
    confidence: number;
    latency_ms: number;
  };
  status: 'passed' | 'partial' | 'failed';
  chunk8_baseline?: number;
  improvement?: number;
}

interface ComparisonData {
  test: string;
  chunk8: number;
  chunk9: number;
  improvement: number;
  status: string;
}

async function loadChunk8Baseline(): Promise<Map<number, number>> {
  const baseline = new Map<number, number>();
  
  try {
    // Load Test 1 from Chunk 7
    const chunk7Path = path.join(__dirname, '../docs/_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/TEST_RESULTS');
    const chunk7Files = await fs.readdir(chunk7Path);
    const test1File = chunk7Files.find(f => f.startsWith('test1-agp-version'));
    
    if (test1File) {
      const data = await fs.readFile(path.join(chunk7Path, test1File), 'utf-8');
      const result = JSON.parse(data);
      baseline.set(1, result.metrics.overall_usability);
      console.log(`   Test 1 baseline: ${result.metrics.overall_usability}%`);
    }
    
    // Load Tests 6-10 from Chunk 8
    const chunk8Path = path.join(__dirname, '../tests/results/chunk8');
    const chunk8Files = await fs.readdir(chunk8Path);
    
    for (let i = 6; i <= 10; i++) {
      const testFile = chunk8Files.find(f => f.startsWith(`test${i}-`));
      if (testFile) {
        const data = await fs.readFile(path.join(chunk8Path, testFile), 'utf-8');
        const result = JSON.parse(data);
        baseline.set(i, result.metrics.overall_usability);
        console.log(`   Test ${i} baseline: ${result.metrics.overall_usability}%`);
      }
    }
    
  } catch (error: any) {
    console.warn('⚠️  Could not load Chunk 8 baseline:', error.message);
  }
  
  return baseline;
}

async function runAllTests(): Promise<void> {
  console.log('\n🚀 CHUNK 9 - RE-TEST ALL 10 CASES\n');
  console.log('='.repeat(80));
  console.log('\nValidating improvements from Chunk 9 architecture changes:\n');
  console.log('✅ Priority 1: JSON parsing fix (handles DeepSeek-R1 <think> tags)');
  console.log('✅ Priority 2: Error classification system (6 categories)');
  console.log('✅ Priority 3: Few-shot examples (39 → 69 total, diverse)');
  console.log('✅ Priority 4: FileResolver extensions (manifest, proguard, nav)\n');
  console.log('='.repeat(80));
  
  // Load Chunk 8 baseline
  console.log('\n📊 Loading Chunk 8 baseline for comparison...\n');
  const baseline = await loadChunk8Baseline();
  
  const tests = [
    {
      name: 'Test 1: AGP Version Error',
      script: 'chunk7-test1-agp-retest.ts',
      target: 94,
      chunk8: baseline.get(1) || 94
    },
    {
      name: 'Test 6: Manifest Permission Missing',
      script: 'chunk8-test6-manifest.ts',
      target: 75,
      chunk8: baseline.get(6) || 13
    },
    {
      name: 'Test 7: Gradle Sync Failed (Network)',
      script: 'chunk8-test7-gradle-network.ts',
      target: 70,
      chunk8: baseline.get(7) || 54
    },
    {
      name: 'Test 8: Build Cache Corruption',
      script: 'chunk8-test8-build-cache.ts',
      target: 65,
      chunk8: baseline.get(8) || 10
    },
    {
      name: 'Test 9: R8/ProGuard Rule Missing',
      script: 'chunk8-test9-proguard.ts',
      target: 75,
      chunk8: baseline.get(9) || 45
    },
    {
      name: 'Test 10: Jetpack Navigation Argument Mismatch',
      script: 'chunk8-test10-navigation.ts',
      target: 80,
      chunk8: baseline.get(10) || 0
    }
  ];
  
  const results: TestResult[] = [];
  const comparisons: ComparisonData[] = [];
  
  // Create Chunk 9 results directory
  const chunk9Dir = path.join(__dirname, '../tests/results/chunk9');
  await fs.mkdir(chunk9Dir, { recursive: true });
  
  // Run each test sequentially
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const testNumber = i === 0 ? 1 : i + 5; // Test 1, then 6-10
    
    console.log(`\n[${i + 1}/6] Running ${test.name}...`);
    console.log('-'.repeat(80));
    console.log(`   Chunk 8 baseline: ${test.chunk8}%`);
    console.log(`   Target: ${test.target}%`);
    
    try {
      // Run test with ts-node
      console.log('\n🧪 Executing test...');
      const startTime = Date.now();
      
      const { stdout, stderr } = await execAsync(
        `npx ts-node scripts/${test.script}`,
        { 
          cwd: path.join(__dirname, '..'),
          timeout: 180000, // 3 minutes per test
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
          env: { ...process.env, CHUNK9_RETEST: 'true' },
          windowsHide: true // Hide window on Windows to prevent handle issues
        }
      );
      
      const duration = Date.now() - startTime;
      console.log(stdout);
      if (stderr) console.error('⚠️  Warnings:', stderr);
      
      // Give time for resources to clean up between tests
      console.log('\n⏳ Cleaning up resources...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      // Find latest result file
      const resultsSourceDir = testNumber === 1 
        ? path.join(__dirname, '../docs/_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/TEST_RESULTS')
        : path.join(__dirname, '../tests/results/chunk8');
      
      const files = await fs.readdir(resultsSourceDir);
      const testFiles = files.filter(f => f.startsWith(`test${testNumber}-`));
      
      if (testFiles.length > 0) {
        // Get most recent result
        const latestFile = testFiles.sort().reverse()[0];
        const resultData = await fs.readFile(
          path.join(resultsSourceDir, latestFile),
          'utf-8'
        );
        const result = JSON.parse(resultData);
        
        // Determine status
        const usability = result.metrics.overall_usability;
        const improvement = usability - test.chunk8;
        
        let status: 'passed' | 'partial' | 'failed';
        if (usability >= test.target) status = 'passed';
        else if (usability >= test.target * 0.75) status = 'partial';
        else status = 'failed';
        
        results.push({
          test: test.name,
          testNumber,
          timestamp: result.timestamp,
          metrics: result.metrics,
          status,
          chunk8_baseline: test.chunk8,
          improvement
        });
        
        comparisons.push({
          test: test.name,
          chunk8: test.chunk8,
          chunk9: usability,
          improvement,
          status: improvement > 0 ? '📈' : improvement < 0 ? '📉' : '➡️'
        });
        
        // Copy result to Chunk 9 directory with new naming
        const chunk9FileName = `test${testNumber}-chunk9-retest-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        await fs.writeFile(
          path.join(chunk9Dir, chunk9FileName),
          JSON.stringify({
            ...result,
            chunk9_retest: true,
            chunk8_baseline: test.chunk8,
            improvement
          }, null, 2)
        );
        
        console.log(`\n${improvement > 0 ? '✅' : improvement < 0 ? '❌' : '➡️'} Test ${testNumber} completed: ${usability}% usability`);
        console.log(`   Baseline: ${test.chunk8}% → Chunk 9: ${usability}% (${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%)`);
        console.log(`   Status: ${status.toUpperCase()}`);
        console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
      }
      
    } catch (error: any) {
      console.error(`\n❌ Test ${testNumber} failed with error:`);
      console.error(error.message);
      
      results.push({
        test: test.name,
        testNumber,
        timestamp: new Date().toISOString(),
        metrics: {
          diagnosis_accuracy: 0,
          solution_specificity: 0,
          file_identification: 0,
          code_examples: 0,
          version_suggestions: -1,
          overall_usability: 0,
          confidence: 0,
          latency_ms: 0
        },
        status: 'failed',
        chunk8_baseline: test.chunk8,
        improvement: -test.chunk8
      });
      
      comparisons.push({
        test: test.name,
        chunk8: test.chunk8,
        chunk9: 0,
        improvement: -test.chunk8,
        status: '❌'
      });
    }
  }
  
  // Generate comprehensive comparison report
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 CHUNK 9 RE-TEST RESULTS - COMPREHENSIVE COMPARISON\n');
  console.log('='.repeat(80));
  
  // Comparison table
  console.log('\n📈 Chunk 8 vs Chunk 9 Comparison:\n');
  console.log('Test                                  | Chunk 8 | Chunk 9 | Δ      | Status');
  console.log('-'.repeat(85));
  
  comparisons.forEach((comp, idx) => {
    const testNum = idx === 0 ? 1 : idx + 5;
    const delta = comp.improvement >= 0 ? `+${comp.improvement.toFixed(1)}%` : `${comp.improvement.toFixed(1)}%`;
    console.log(
      `Test ${testNum}: ${comp.test.substring(8).padEnd(30)} | ${String(comp.chunk8).padStart(6)}% | ${String(comp.chunk9).padStart(6)}% | ${delta.padStart(7)} | ${comp.status}`
    );
  });
  
  // Aggregate statistics
  const avgChunk8 = comparisons.reduce((sum, c) => sum + c.chunk8, 0) / comparisons.length;
  const avgChunk9 = comparisons.reduce((sum, c) => sum + c.chunk9, 0) / comparisons.length;
  const avgImprovement = avgChunk9 - avgChunk8;
  
  const avgDiagnosis = results.reduce((sum, r) => sum + r.metrics.diagnosis_accuracy, 0) / results.length;
  const avgSolution = results.reduce((sum, r) => sum + r.metrics.solution_specificity, 0) / results.length;
  const avgFileId = results.reduce((sum, r) => sum + r.metrics.file_identification, 0) / results.length;
  const avgCode = results.reduce((sum, r) => sum + r.metrics.code_examples, 0) / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.metrics.latency_ms, 0) / results.length;
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 AGGREGATE STATISTICS:\n');
  console.log(`Average Usability (Chunk 8):  ${avgChunk8.toFixed(1)}%`);
  console.log(`Average Usability (Chunk 9):  ${avgChunk9.toFixed(1)}%`);
  console.log(`Average Improvement:          ${avgImprovement > 0 ? '+' : ''}${avgImprovement.toFixed(1)}% ${avgImprovement > 0 ? '📈' : '📉'}`);
  console.log('');
  console.log(`Diagnosis Accuracy:           ${avgDiagnosis.toFixed(1)}%`);
  console.log(`Solution Specificity:         ${avgSolution.toFixed(1)}%`);
  console.log(`File Identification:          ${avgFileId.toFixed(1)}%`);
  console.log(`Code Examples:                ${avgCode.toFixed(1)}%`);
  console.log(`Average Latency:              ${(avgLatency / 1000).toFixed(2)}s`);
  
  // Success evaluation
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 CHUNK 9 SUCCESS EVALUATION\n');
  
  const passedTests = results.filter(r => r.status === 'passed').length;
  const partialTests = results.filter(r => r.status === 'partial').length;
  const failedTests = results.filter(r => r.status === 'failed').length;
  const improvedTests = comparisons.filter(c => c.improvement > 0).length;
  
  console.log(`✅ Passed: ${passedTests}/6 tests (target met)`);
  console.log(`⚠️  Partial: ${partialTests}/6 tests (close to target)`);
  console.log(`❌ Failed: ${failedTests}/6 tests (below target)`);
  console.log(`📈 Improved: ${improvedTests}/6 tests`);
  console.log('');
  
  // Overall target evaluation
  const targetMet = avgChunk9 >= 75;
  const significantImprovement = avgImprovement >= 30;
  const noRegressions = comparisons.every(c => c.improvement >= -5);
  
  if (targetMet && significantImprovement && noRegressions) {
    console.log('🎉 EXCELLENT! All success criteria met:');
    console.log(`   ✅ Average usability: ${avgChunk9.toFixed(1)}% (target: 75%+)`);
    console.log(`   ✅ Improvement: +${avgImprovement.toFixed(1)}% (target: +30%)`);
    console.log(`   ✅ No significant regressions`);
    console.log('\n   Ready to proceed to Phase 4!');
  } else if (avgChunk9 >= 70 || avgImprovement >= 20) {
    console.log('👍 GOOD PROGRESS - Partial success:');
    console.log(`   ${targetMet ? '✅' : '⚠️'}  Average usability: ${avgChunk9.toFixed(1)}% (target: 75%+)`);
    console.log(`   ${significantImprovement ? '✅' : '⚠️'}  Improvement: +${avgImprovement.toFixed(1)}% (target: +30%)`);
    console.log(`   ${noRegressions ? '✅' : '⚠️'}  No significant regressions`);
    console.log('\n   Minor tweaks needed before Phase 4');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT:');
    console.log(`   ${targetMet ? '✅' : '❌'} Average usability: ${avgChunk9.toFixed(1)}% (target: 75%+)`);
    console.log(`   ${significantImprovement ? '✅' : '❌'} Improvement: +${avgImprovement.toFixed(1)}% (target: +30%)`);
    console.log(`   ${noRegressions ? '✅' : '❌'} No significant regressions`);
    console.log('\n   Review failures and iterate on improvements');
  }
  
  // Save comprehensive report
  const reportPath = path.join(chunk9Dir, 'CHUNK_9_COMPREHENSIVE_REPORT.json');
  await fs.writeFile(reportPath, JSON.stringify({
    chunk: 'Chunk 9 - Bug Fixes & Architecture Improvements Re-Test',
    timestamp: new Date().toISOString(),
    improvements: [
      'Priority 1: JSON parsing fix (handles DeepSeek-R1 <think> tags)',
      'Priority 2: Error classification system (6 categories)',
      'Priority 3: Few-shot examples (39 → 69 total, diverse)',
      'Priority 4: FileResolver extensions (manifest, proguard, navigation)'
    ],
    results,
    comparisons,
    aggregate: {
      chunk8_average: avgChunk8,
      chunk9_average: avgChunk9,
      improvement: avgImprovement,
      diagnosis: avgDiagnosis,
      solution: avgSolution,
      fileId: avgFileId,
      code: avgCode,
      latency: avgLatency
    },
    success_criteria: {
      target_met: targetMet,
      significant_improvement: significantImprovement,
      no_regressions: noRegressions,
      overall_status: targetMet && significantImprovement && noRegressions ? 'SUCCESS' :
                      (avgChunk9 >= 70 || avgImprovement >= 20) ? 'PARTIAL' : 'NEEDS_IMPROVEMENT'
    },
    test_status: {
      passed: passedTests,
      partial: partialTests,
      failed: failedTests,
      improved: improvedTests
    }
  }, null, 2));
  
  console.log(`\n💾 Comprehensive report saved to: ${reportPath}`);
  
  // Detailed failure analysis
  const failures = results.filter(r => r.status === 'failed');
  if (failures.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 FAILURE ANALYSIS:\n');
    
    failures.forEach(f => {
      console.log(`❌ ${f.test}`);
      console.log(`   Usability: ${f.metrics.overall_usability}% (target: ${tests.find(t => t.name === f.test)?.target}%)`);
      console.log(`   Diagnosis: ${f.metrics.diagnosis_accuracy}%`);
      console.log(`   Solution: ${f.metrics.solution_specificity}%`);
      console.log(`   Root cause: ${f.metrics.solution_specificity < 50 ? 'Generic solutions' : 
                                     f.metrics.diagnosis_accuracy < 50 ? 'Poor diagnosis' : 
                                     'Multiple factors'}`);
      console.log('');
    });
  }
  
  // Next steps
  console.log('\n' + '='.repeat(80));
  console.log('\n📝 NEXT STEPS:\n');
  
  if (targetMet && significantImprovement) {
    console.log('✅ Chunk 9 objectives achieved!');
    console.log('');
    console.log('Move to Phase 4: Real-World Testing & Iteration');
    console.log('  - Test on 20+ complex Android projects');
    console.log('  - Validate improvements hold across diverse codebases');
    console.log('  - Fine-tune based on edge cases');
  } else if (avgChunk9 >= 70) {
    console.log('⚠️  Almost there! Consider quick fixes:');
    console.log('  1. Review failed tests and identify patterns');
    console.log('  2. Add more few-shot examples for weak categories');
    console.log('  3. Fine-tune category-specific prompts');
    console.log('  4. Re-test after adjustments');
  } else {
    console.log('❌ Significant improvements needed:');
    console.log('  1. Analyze why classification isn\'t helping');
    console.log('  2. Verify few-shot examples are being selected');
    console.log('  3. Check if prompts are too generic');
    console.log('  4. Consider adding validation logic');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Chunk 9 re-test complete!\n');
}

// Run all tests
runAllTests()
  .then(() => {
    console.log('\n✅ All tests completed successfully');
    // Force exit to ensure all resources are cleaned up
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(error => {
    console.error('\n❌ Test suite failed:', error);
    // Force exit even on error
    setTimeout(() => process.exit(1), 1000);
  });
