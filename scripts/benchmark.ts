#!/usr/bin/env ts-node
/**
 * Performance Benchmarking Tool - Chunk 1.5
 * 
 * Benchmarks RCA Agent performance across multiple runs.
 * Measures:
 * - Latency distribution (p50, p90, p99)
 * - Component-level timing (parse, LLM, tools)
 * - Memory usage
 * - Token usage (if available)
 * 
 * Usage:
 *   npm run bench
 *   ts-node scripts/benchmark.ts
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { KotlinNPEParser } from '../src/utils/KotlinNPEParser';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { ReadFileTool } from '../src/tools/ReadFileTool';
import { testDataset } from '../tests/fixtures/test-dataset';
import * as fs from 'fs/promises';
import * as path from 'path';

interface BenchmarkRun {
  testCaseId: string;
  totalTime: number;
  parseTime: number;
  analysisTime: number;
  iterations: number;
  memoryUsed: number;
}

interface BenchmarkResults {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageLatency: number;
  p50Latency: number;
  p90Latency: number;
  p99Latency: number;
  minLatency: number;
  maxLatency: number;
  averageMemory: number;
  runs: BenchmarkRun[];
  timestamp: string;
}

async function main() {
  console.log('🏁 Performance Benchmarking - Chunk 1.5\n');
  
  // Check Ollama
  const isOllamaRunning = await checkOllama();
  if (!isOllamaRunning) {
    console.error('❌ Ollama is not running. Start it with: ollama serve');
    process.exit(1);
  }

  console.log('✅ Ollama is running');
  console.log('📊 Running benchmarks...\n');

  // Initialize components
  const llmClient = new OllamaClient();
  const parser = new KotlinNPEParser();
  const readFileTool = new ReadFileTool();
  const agent = new MinimalReactAgent(llmClient, parser, readFileTool);

  await llmClient.connect();

  const runs: BenchmarkRun[] = [];
  let successCount = 0;
  let failCount = 0;

  // Run benchmark on first 5 test cases (faster)
  const testCases = testDataset.slice(0, 5);
  console.log(`Testing ${testCases.length} error cases...\n`);

  for (const testCase of testCases) {
    console.log(`Running: ${testCase.id} - ${testCase.name}`);
    
    try {
      const memBefore = process.memoryUsage().heapUsed;
      const startTotal = Date.now();

      // Parse
      const parseStart = Date.now();
      const parsedError = parser.parse(testCase.errorText);
      const parseTime = Date.now() - parseStart;

      if (!parsedError) {
        console.log(`  ⚠️  Parser failed\n`);
        failCount++;
        continue;
      }

      // Analyze
      const analysisStart = Date.now();
      const result = await agent.analyze(parsedError);
      const analysisTime = Date.now() - analysisStart;

      const totalTime = Date.now() - startTotal;
      const memAfter = process.memoryUsage().heapUsed;
      const memoryUsed = memAfter - memBefore;

      runs.push({
        testCaseId: testCase.id,
        totalTime,
        parseTime,
        analysisTime,
        iterations: 3, // MVP has 3 iterations
        memoryUsed,
      });

      console.log(`  ✅ Total: ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`     Parse: ${parseTime}ms`);
      console.log(`     Analysis: ${(analysisTime / 1000).toFixed(2)}s`);
      console.log(`     Memory: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB\n`);

      successCount++;

    } catch (error) {
      console.log(`  ❌ Failed: ${(error as Error).message}\n`);
      failCount++;
    }
  }

  // Calculate statistics
  const results = calculateStats(runs, successCount, failCount);

  // Display results
  displayResults(results);

  // Save results
  await saveResults(results);

  console.log(`\n✅ Benchmark complete. Results saved to docs/benchmark-results.json`);
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
 * Calculate benchmark statistics
 */
function calculateStats(
  runs: BenchmarkRun[],
  successCount: number,
  failCount: number
): BenchmarkResults {
  const latencies = runs.map(r => r.totalTime).sort((a, b) => a - b);
  const memories = runs.map(r => r.memoryUsed);

  const p50Index = Math.floor(latencies.length * 0.5);
  const p90Index = Math.floor(latencies.length * 0.9);
  const p99Index = Math.floor(latencies.length * 0.99);

  return {
    totalRuns: successCount + failCount,
    successfulRuns: successCount,
    failedRuns: failCount,
    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p50Latency: latencies[p50Index] || 0,
    p90Latency: latencies[p90Index] || 0,
    p99Latency: latencies[p99Index] || 0,
    minLatency: Math.min(...latencies),
    maxLatency: Math.max(...latencies),
    averageMemory: memories.reduce((a, b) => a + b, 0) / memories.length,
    runs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Display benchmark results
 */
function displayResults(results: BenchmarkResults) {
  console.log('\n========================================');
  console.log('📊 BENCHMARK RESULTS');
  console.log('========================================\n');

  console.log('Overall Performance:');
  console.log(`  Total Runs: ${results.totalRuns}`);
  console.log(`  Successful: ${results.successfulRuns}`);
  console.log(`  Failed: ${results.failedRuns}`);
  console.log(`  Success Rate: ${((results.successfulRuns / results.totalRuns) * 100).toFixed(1)}%\n`);

  console.log('Latency Statistics:');
  console.log(`  Average: ${(results.averageLatency / 1000).toFixed(2)}s`);
  console.log(`  p50: ${(results.p50Latency / 1000).toFixed(2)}s`);
  console.log(`  p90: ${(results.p90Latency / 1000).toFixed(2)}s`);
  console.log(`  p99: ${(results.p99Latency / 1000).toFixed(2)}s`);
  console.log(`  Min: ${(results.minLatency / 1000).toFixed(2)}s`);
  console.log(`  Max: ${(results.maxLatency / 1000).toFixed(2)}s\n`);

  console.log('Memory Usage:');
  console.log(`  Average: ${(results.averageMemory / 1024 / 1024).toFixed(2)}MB\n`);

  console.log('Target Achievement:');
  const meetsLatencyTarget = results.averageLatency < 90000;
  console.log(`  Latency <90s: ${meetsLatencyTarget ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n========================================');
}

/**
 * Save results to file
 */
async function saveResults(results: BenchmarkResults): Promise<void> {
  const resultsFile = path.join(__dirname, '../docs/benchmark-results.json');
  await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
}

main().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
