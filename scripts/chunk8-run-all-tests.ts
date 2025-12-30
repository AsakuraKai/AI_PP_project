/**
 * Chunk 8 - Unified Test Runner
 * 
 * Executes all 5 test cases (Tests 6-10) and generates comprehensive report
 * comparing results with Chunk 7 (Test 1) to validate overall agent performance.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  test: string;
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
}

async function runAllTests(): Promise<void> {
  console.log('\n🚀 CHUNK 8 - UNIFIED TEST RUNNER\n');
  console.log('='.repeat(80));
  console.log('\nExecuting Tests 6-10 to complete 10-case test suite validation\n');
  
  const tests = [
    {
      name: 'Test 6: Manifest Permission Missing',
      script: 'chunk8-test6-manifest.ts',
      target: 75
    },
    {
      name: 'Test 7: Gradle Sync Failed (Network)',
      script: 'chunk8-test7-gradle-network.ts',
      target: 70
    },
    {
      name: 'Test 8: Build Cache Corruption',
      script: 'chunk8-test8-build-cache.ts',
      target: 65
    },
    {
      name: 'Test 9: R8/ProGuard Rule Missing',
      script: 'chunk8-test9-proguard.ts',
      target: 75
    },
    {
      name: 'Test 10: Jetpack Navigation Argument Mismatch',
      script: 'chunk8-test10-navigation.ts',
      target: 80
    }
  ];
  
  const results: TestResult[] = [];
  
  // Run each test sequentially
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n[${ i + 1}/5] Running ${test.name}...`);
    console.log('-'.repeat(80));
    
    try {
      // Compile TypeScript
      console.log('📦 Compiling TypeScript...');
      await execAsync('npx tsc --noEmit', { 
        cwd: path.join(__dirname, '..'),
        timeout: 60000 
      });
      
      // Run test with ts-node
      console.log('🧪 Executing test...');
      const { stdout, stderr } = await execAsync(
        `npx ts-node scripts/${test.script}`,
        { 
          cwd: path.join(__dirname, '..'),
          timeout: 180000 // 3 minutes per test
        }
      );
      
      console.log(stdout);
      if (stderr) console.error('Warnings:', stderr);
      
      // Find latest result file
      const resultsDir = path.join(__dirname, '../tests/results/chunk8');
      const files = await fs.readdir(resultsDir);
      const testFiles = files.filter(f => f.startsWith(`test${i + 6}-`));
      
      if (testFiles.length > 0) {
        // Get most recent result
        const latestFile = testFiles.sort().reverse()[0];
        const resultData = await fs.readFile(
          path.join(resultsDir, latestFile),
          'utf-8'
        );
        const result = JSON.parse(resultData);
        
        // Determine status
        const usability = result.metrics.overall_usability;
        let status: 'passed' | 'partial' | 'failed';
        if (usability >= test.target) status = 'passed';
        else if (usability >= test.target * 0.75) status = 'partial';
        else status = 'failed';
        
        results.push({
          test: test.name,
          timestamp: result.timestamp,
          metrics: result.metrics,
          status
        });
        
        console.log(`\n✅ Test ${i + 1} completed: ${usability}% usability (${status})`);
      }
      
    } catch (error: any) {
      console.error(`\n❌ Test ${i + 1} failed with error:`);
      console.error(error.message);
      
      results.push({
        test: test.name,
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
        status: 'failed'
      });
    }
  }
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 CHUNK 8 - COMPREHENSIVE TEST RESULTS\n');
  console.log('='.repeat(80));
  
  // Individual results
  console.log('\n📋 Individual Test Results:\n');
  results.forEach((result, idx) => {
    const statusEmoji = result.status === 'passed' ? '✅' : 
                        result.status === 'partial' ? '⚠️' : '❌';
    console.log(`${statusEmoji} Test ${idx + 6}: ${result.test}`);
    console.log(`   Usability: ${result.metrics.overall_usability}%`);
    console.log(`   Diagnosis: ${result.metrics.diagnosis_accuracy}%`);
    console.log(`   Solution: ${result.metrics.solution_specificity}%`);
    console.log(`   File ID: ${result.metrics.file_identification}%`);
    console.log(`   Code: ${result.metrics.code_examples}%`);
    console.log(`   Latency: ${(result.metrics.latency_ms / 1000).toFixed(2)}s`);
    console.log('');
  });
  
  // Aggregate statistics
  const avgUsability = results.reduce((sum, r) => sum + r.metrics.overall_usability, 0) / results.length;
  const avgDiagnosis = results.reduce((sum, r) => sum + r.metrics.diagnosis_accuracy, 0) / results.length;
  const avgSolution = results.reduce((sum, r) => sum + r.metrics.solution_specificity, 0) / results.length;
  const avgFileId = results.reduce((sum, r) => sum + r.metrics.file_identification, 0) / results.length;
  const avgCode = results.reduce((sum, r) => sum + r.metrics.code_examples, 0) / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.metrics.latency_ms, 0) / results.length;
  
  console.log('📈 Chunk 8 Aggregate Statistics (Tests 6-10):\n');
  console.log(`Average Usability:       ${avgUsability.toFixed(1)}%`);
  console.log(`Average Diagnosis:       ${avgDiagnosis.toFixed(1)}%`);
  console.log(`Average Solution:        ${avgSolution.toFixed(1)}%`);
  console.log(`Average File ID:         ${avgFileId.toFixed(1)}%`);
  console.log(`Average Code Examples:   ${avgCode.toFixed(1)}%`);
  console.log(`Average Latency:         ${(avgLatency / 1000).toFixed(2)}s`);
  
  // Load Test 1 results for comparison
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 COMPLETE 10-CASE TEST SUITE RESULTS\n');
  console.log('='.repeat(80));
  
  try {
    // Try to load Chunk 7 Test 1 results
    const chunk7Dir = path.join(__dirname, '../docs/_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/TEST_RESULTS');
    const chunk7Files = await fs.readdir(chunk7Dir);
    const test1Files = chunk7Files.filter(f => f.startsWith('test1-agp-version'));
    
    if (test1Files.length > 0) {
      const latestTest1 = test1Files.sort().reverse()[0];
      const test1Data = await fs.readFile(
        path.join(chunk7Dir, latestTest1),
        'utf-8'
      );
      const test1Result = JSON.parse(test1Data);
      
      console.log('\n✅ Test 1 (Chunk 7): AGP Version Conflict');
      console.log(`   Usability: ${test1Result.metrics.overall_usability}%`);
      console.log(`   Status: COMPLETE (Baseline established)`);
      
      // Calculate overall 10-case statistics
      const allTests = [test1Result.metrics, ...results.map(r => r.metrics)];
      const overallUsability = allTests.reduce((sum, m) => sum + m.overall_usability, 0) / allTests.length;
      const overallDiagnosis = allTests.reduce((sum, m) => sum + m.diagnosis_accuracy, 0) / allTests.length;
      const overallSolution = allTests.reduce((sum, m) => sum + m.solution_specificity, 0) / allTests.length;
      const overallFileId = allTests.reduce((sum, m) => sum + m.file_identification, 0) / allTests.length;
      const overallCode = allTests.reduce((sum, m) => sum + m.code_examples, 0) / allTests.length;
      const overallLatency = allTests.reduce((sum, m) => sum + m.latency_ms, 0) / allTests.length;
      
      console.log('\n🏆 Overall 10-Case Statistics:\n');
      console.log(`Overall Usability:       ${overallUsability.toFixed(1)}% ${overallUsability >= 80 ? '✅' : '⚠️'}`);
      console.log(`Overall Diagnosis:       ${overallDiagnosis.toFixed(1)}%`);
      console.log(`Overall Solution:        ${overallSolution.toFixed(1)}%`);
      console.log(`Overall File ID:         ${overallFileId.toFixed(1)}%`);
      console.log(`Overall Code Examples:   ${overallCode.toFixed(1)}%`);
      console.log(`Overall Latency:         ${(overallLatency / 1000).toFixed(2)}s`);
      
      // Success determination
      console.log('\n' + '='.repeat(80));
      console.log('\n🎯 CHUNK 8 SUCCESS EVALUATION\n');
      
      if (overallUsability >= 80) {
        console.log('✅ TARGET ACHIEVED! Overall usability ≥80%');
        console.log(`   Achieved: ${overallUsability.toFixed(1)}%`);
        console.log(`   Exceeded by: +${(overallUsability - 80).toFixed(1)}%`);
      } else if (overallUsability >= 70) {
        console.log('⚠️  PARTIAL SUCCESS - Close to target');
        console.log(`   Achieved: ${overallUsability.toFixed(1)}%`);
        console.log(`   Gap: ${(80 - overallUsability).toFixed(1)}%`);
      } else {
        console.log('❌ TARGET NOT MET - Further improvements needed');
        console.log(`   Achieved: ${overallUsability.toFixed(1)}%`);
        console.log(`   Gap: ${(80 - overallUsability).toFixed(1)}%`);
      }
      
      // Save comprehensive report
      const reportPath = path.join(__dirname, '../tests/results/chunk8/COMPREHENSIVE_REPORT.json');
      await fs.writeFile(reportPath, JSON.stringify({
        chunk: 'Chunk 8 - Real-World Test Suite Part 2',
        timestamp: new Date().toISOString(),
        test1_baseline: test1Result.metrics,
        tests_6_to_10: results,
        chunk8_aggregate: {
          avgUsability,
          avgDiagnosis,
          avgSolution,
          avgFileId,
          avgCode,
          avgLatency
        },
        overall_10_case_stats: {
          overallUsability,
          overallDiagnosis,
          overallSolution,
          overallFileId,
          overallCode,
          overallLatency
        },
        target: 80,
        status: overallUsability >= 80 ? 'SUCCESS' : 
                overallUsability >= 70 ? 'PARTIAL' : 'NEEDS_IMPROVEMENT'
      }, null, 2));
      
      console.log(`\n💾 Comprehensive report saved to: ${reportPath}`);
      
    }
  } catch (error) {
    console.log('\n⚠️  Could not load Test 1 results for comparison');
    console.log('   Run Chunk 7 Test 1 first to establish baseline');
  }
  
  // Next steps
  console.log('\n' + '='.repeat(80));
  console.log('\n📝 NEXT STEPS:\n');
  
  const passedTests = results.filter(r => r.status === 'passed').length;
  const partialTests = results.filter(r => r.status === 'partial').length;
  const failedTests = results.filter(r => r.status === 'failed').length;
  
  console.log(`✅ Passed: ${passedTests}/5 tests`);
  console.log(`⚠️  Partial: ${partialTests}/5 tests`);
  console.log(`❌ Failed: ${failedTests}/5 tests`);
  
  if (avgUsability >= 80) {
    console.log('\n🎉 Excellent results! Proceed to Chunk 9 (Bug Fixes & Iteration)');
  } else if (avgUsability >= 70) {
    console.log('\n👍 Good results! Minor improvements needed before Chunk 9');
  } else {
    console.log('\n⚠️  Results below target. Review failures and fix critical issues');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run all tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
