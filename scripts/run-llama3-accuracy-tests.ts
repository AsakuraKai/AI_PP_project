#!/usr/bin/env ts-node
/**
 * Llama3.1 Accuracy Testing Runner
 * 
 * Runs accuracy tests specifically with llama3.1:8b-instruct-q5_K_M model
 * and generates detailed comparison reports.
 * 
 * Usage:
 *   ts-node scripts/run-llama3-accuracy-tests.ts
 *   npm run test:llama3
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { ErrorParser } from '../src/utils/ErrorParser';
import { getTestSplit, getEvalSplit, getDatasetStats } from '../tests/fixtures/dataset-split-loader';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TestResult {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  parsed: boolean;
  analyzed: boolean;
  hasRootCause: boolean;
  hasFixGuidelines: boolean;
  confidence: number;
  latency: number; // milliseconds
  error?: string;
}

interface ModelMetrics {
  model: string;
  timestamp: string;
  totalTests: number;
  parsedSuccessfully: number;
  analyzedSuccessfully: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  averageConfidence: number;
  byCategory: Record<string, { total: number; passed: number }>;
  byDifficulty: Record<string, { total: number; passed: number }>;
  results: TestResult[];
}

async function main() {
  const MODEL = 'llama3.1:8b-instruct-q5_K_M';

  console.log('[LAUNCH] Starting Llama3.1 Accuracy Test Suite\n');
  console.log(`Model: ${MODEL}`);
  console.log('Dataset: Test Split (20 cases) + Eval Split (10 cases)\n');

  // Check if Ollama is available
  const isOllamaRunning = await checkOllama();

  if (!isOllamaRunning) {
    console.error('[X] Ollama is not running!');
    console.log('\n[TOOL] To run accuracy tests:');
    console.log('   1. Start Ollama: ollama serve');
    console.log('   2. Pull model: ollama pull llama3.1:8b-instruct-q5_K_M');
    console.log('   3. Re-run this script\n');
    process.exit(1);
  }

  // Check if model is available
  const hasModel = await checkModel(MODEL);
  if (!hasModel) {
    console.error(`[X] Model ${MODEL} not found!`);
    console.log(`\n[TOOL] Pull the model:`);
    console.log(`   ollama pull ${MODEL}\n`);
    process.exit(1);
  }

  console.log('[OK] Ollama is running');
  console.log(`[OK] Model ${MODEL} is available\n`);

  try {
    // Initialize components
    const llmClient = new OllamaClient({ model: MODEL });
    await llmClient.connect();

    const errorParser = ErrorParser.getInstance();
    const agent = new MinimalReactAgent(llmClient, {
      maxIterations: 3,
      usePromptEngine: true,
      useToolRegistry: true,
    });

    // Get test cases
    const stats = getDatasetStats();
    console.log('[STATS] Dataset Statistics:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Train: ${stats.train}`);
    console.log(`  Test: ${stats.test}`);
    console.log(`  Eval: ${stats.eval}\n`);

    // Run on Test Split
    console.log('Running tests on Test Split (20 cases)...\n');
    const testSplit = getTestSplit();
    const testResults = await runTests(agent, errorParser, testSplit);

    // Run on Eval Split
    console.log('\nRunning tests on Eval Split (10 cases)...\n');
    const evalSplit = getEvalSplit();
    const evalResults = await runTests(agent, errorParser, evalSplit);

    // Generate combined metrics
    const allResults = [...testResults, ...evalResults];
    const metrics = generateMetrics(MODEL, allResults);

    // Save results
    await saveResults(metrics);

    // Display summary
    displaySummary(metrics);

    console.log('\n[OK] Llama3.1 accuracy tests completed successfully');

  } catch (error) {
    console.error('\n[X] Tests failed:', error);
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
 * Check if specific model is available
 */
async function checkModel(model: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return false;

    const data = await response.json() as { models?: Array<{ name: string }> };
    const models = data.models || [];
    return models.some((m: any) => m.name === model || m.name.includes(model));
  } catch {
    return false;
  }
}

/**
 * Run tests on a set of test cases
 */
async function runTests(
  agent: MinimalReactAgent,
  errorParser: ErrorParser,
  testCases: any[]
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`[${i + 1}/${testCases.length}] Testing ${testCase.id}: ${testCase.name}`);

    const startTime = Date.now();
    const result: TestResult = {
      id: testCase.id,
      name: testCase.name,
      category: (testCase as any).category || 'kotlin', // Default to 'kotlin' for TestCase without category
      difficulty: testCase.difficulty || 'medium',
      parsed: false,
      analyzed: false,
      hasRootCause: false,
      hasFixGuidelines: false,
      confidence: 0,
      latency: 0,
    };

    try {
      // Step 1: Parse error text
      const parsedError = errorParser.parse(testCase.errorText);

      if (!parsedError) {
        result.error = 'Failed to parse error';
        result.latency = Date.now() - startTime;
        console.log(`  [X] ${testCase.id}: Parse failed`);
        results.push(result);
        continue;
      }

      result.parsed = true;

      // Step 2: Run analysis
      const analysis = await agent.analyze(parsedError);

      result.parsed = true;
      result.analyzed = !!analysis;
      result.hasRootCause = !!(analysis?.rootCause && analysis.rootCause.length > 10);
      result.hasFixGuidelines = !!(analysis?.fixGuidelines && analysis.fixGuidelines.length > 0);
      result.confidence = analysis?.confidence || 0;
      result.latency = Date.now() - startTime;

      const status = result.analyzed && result.hasRootCause ? '[OK]' : '[X]';
      console.log(`  ${status} ${testCase.id}: ${(result.latency / 1000).toFixed(1)}s`);

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.latency = Date.now() - startTime;
      console.log(`  [X] ${testCase.id}: Error - ${result.error}`);
    }

    results.push(result);
  }

  return results;
}

/**
 * Generate metrics from test results
 */
function generateMetrics(model: string, results: TestResult[]): ModelMetrics {
  const parsed = results.filter(r => r.parsed).length;
  const analyzed = results.filter(r => r.analyzed && r.hasRootCause).length;
  const latencies = results.map(r => r.latency);

  // Category breakdown
  const byCategory: Record<string, { total: number; passed: number }> = {};
  results.forEach(r => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { total: 0, passed: 0 };
    }
    byCategory[r.category].total++;
    if (r.analyzed && r.hasRootCause) {
      byCategory[r.category].passed++;
    }
  });

  // Difficulty breakdown
  const byDifficulty: Record<string, { total: number; passed: number }> = {};
  results.forEach(r => {
    if (!byDifficulty[r.difficulty]) {
      byDifficulty[r.difficulty] = { total: 0, passed: 0 };
    }
    byDifficulty[r.difficulty].total++;
    if (r.analyzed && r.hasRootCause) {
      byDifficulty[r.difficulty].passed++;
    }
  });

  return {
    model,
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    parsedSuccessfully: parsed,
    analyzedSuccessfully: analyzed,
    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    maxLatency: Math.max(...latencies),
    minLatency: Math.min(...latencies),
    averageConfidence: results.reduce((a, r) => a + r.confidence, 0) / results.length,
    byCategory,
    byDifficulty,
    results,
  };
}

/**
 * Save results to file
 */
async function saveResults(metrics: ModelMetrics) {
  const outputDir = path.join(__dirname, '../test-results');
  await fs.mkdir(outputDir, { recursive: true });

  const filename = `llama3-accuracy-${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, JSON.stringify(metrics, null, 2));
  console.log(`\n[NOTE] Results saved to: ${filename}`);
}

/**
 * Display summary
 */
function displaySummary(metrics: ModelMetrics) {
  console.log('\n========================================');
  console.log('[STATS] LLAMA3.1 ACCURACY REPORT');
  console.log('========================================\n');

  console.log(`Model: ${metrics.model}`);
  console.log(`Timestamp: ${new Date(metrics.timestamp).toLocaleString()}\n`);

  console.log('Overall Metrics:');
  console.log(`  Total Tests: ${metrics.totalTests}`);
  console.log(`  Parsed Successfully: ${metrics.parsedSuccessfully}/${metrics.totalTests} (${((metrics.parsedSuccessfully / metrics.totalTests) * 100).toFixed(1)}%)`);
  console.log(`  Analyzed Successfully: ${metrics.analyzedSuccessfully}/${metrics.totalTests} (${((metrics.analyzedSuccessfully / metrics.totalTests) * 100).toFixed(1)}%)`);
  console.log(`  Average Confidence: ${metrics.averageConfidence.toFixed(2)}`);
  console.log(`  Average Latency: ${(metrics.averageLatency / 1000).toFixed(1)}s`);
  console.log(`  Max Latency: ${(metrics.maxLatency / 1000).toFixed(1)}s`);
  console.log(`  Min Latency: ${(metrics.minLatency / 1000).toFixed(1)}s\n`);

  console.log('By Category:');
  Object.entries(metrics.byCategory).forEach(([category, stats]) => {
    const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`  ${category}: ${stats.passed}/${stats.total} (${percentage}%)`);
  });

  console.log('\nBy Difficulty:');
  Object.entries(metrics.byDifficulty).forEach(([difficulty, stats]) => {
    const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`  ${difficulty}: ${stats.passed}/${stats.total} (${percentage}%)`);
  });

  console.log('\n========================================\n');
}

// Run tests
main().catch(console.error);
