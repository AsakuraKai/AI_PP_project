#!/usr/bin/env ts-node
/**
 * Accuracy Testing Runner - Chunk 1.5
 * 
 * Runs accuracy tests and generates detailed reports.
 * 
 * Usage:
 *   npm run test:accuracy
 *   ts-node scripts/run-accuracy-tests.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  console.log('[LAUNCH] Starting Accuracy Test Suite - Chunk 1.5\n');
  console.log('Testing Requirements:');
  console.log('  ✓ Parse 10 real Kotlin NPE errors');
  console.log('  ✓ Analyze root causes');
  console.log('  ✓ Measure accuracy (target: 6/10 = 60%)');
  console.log('  ✓ Measure latency (target: <90s average)');
  console.log('  ✓ No crashes or unhandled exceptions\n');

  // Check if Ollama is available
  const isOllamaRunning = await checkOllama();
  
  if (!isOllamaRunning) {
    console.error('[X] Ollama is not running!');
    console.log('\n[TOOL] To run accuracy tests:');
    console.log('   1. Start Ollama: ollama serve');
    console.log('   2. Pull model: ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
    console.log('   3. Set environment: set OLLAMA_AVAILABLE=true');
    console.log('   4. Re-run: npm run test:accuracy\n');
    process.exit(1);
  }

  console.log('[OK] Ollama is running\n');

  try {
    // Run accuracy tests
    console.log('Running accuracy tests...\n');
    execSync('npm test -- tests/integration/accuracy.test.ts', {
      stdio: 'inherit',
      env: {
        ...process.env,
        OLLAMA_AVAILABLE: 'true'
      }
    });

    console.log('\n[OK] Accuracy tests completed successfully');

    // Load and display results
    await displayResults();

  } catch (error) {
    console.error('\n[X] Accuracy tests failed:', error);
    process.exit(1);
  }
}

/**
 * Check if Ollama is running
 */
async function checkOllama(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Display test results summary
 */
async function displayResults() {
  const metricsFile = path.join(__dirname, '../docs/accuracy-metrics.json');
  
  try {
    const data = await fs.readFile(metricsFile, 'utf-8');
    const metrics = JSON.parse(data);

    console.log('\n========================================');
    console.log('[STATS] DETAILED ACCURACY REPORT');
    console.log('========================================\n');

    console.log('Overall Metrics:');
    console.log(`  Total Tests: ${metrics.totalTests}`);
    console.log(`  Parsed Successfully: ${metrics.parsedSuccessfully}/${metrics.totalTests} (${((metrics.parsedSuccessfully / metrics.totalTests) * 100).toFixed(1)}%)`);
    console.log(`  Analyzed Successfully: ${metrics.analyzedSuccessfully}/${metrics.totalTests} (${((metrics.analyzedSuccessfully / metrics.totalTests) * 100).toFixed(1)}%)`);
    console.log(`  Average Confidence: ${metrics.averageConfidence.toFixed(2)}`);
    console.log(`  Average Latency: ${(metrics.averageLatency / 1000).toFixed(1)}s`);
    console.log(`  Max Latency: ${(metrics.maxLatency / 1000).toFixed(1)}s`);
    console.log(`  Min Latency: ${(metrics.minLatency / 1000).toFixed(1)}s`);

    console.log('\nPer-Test Results:');
    metrics.results.forEach((result: any) => {
      const status = result.analyzed ? '[OK]' : '[X]';
      const latency = (result.latency / 1000).toFixed(1);
      console.log(`  ${status} ${result.testCase.id}: ${result.testCase.name}`);
      console.log(`     Latency: ${latency}s | Confidence: ${result.confidence.toFixed(2)}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    console.log('\nTarget Achievement:');
    const accuracyTarget = metrics.analyzedSuccessfully >= metrics.totalTests * 0.6;
    const latencyTarget = metrics.averageLatency < 90000;
    
    console.log(`  Accuracy Target (60%): ${accuracyTarget ? '[OK] PASS' : '[X] FAIL'}`);
    console.log(`  Latency Target (<90s): ${latencyTarget ? '[OK] PASS' : '[X] FAIL'}`);

    console.log('\n========================================');
    console.log(`Report saved: ${metricsFile}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Failed to load results:', error);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
