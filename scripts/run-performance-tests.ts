#!/usr/bin/env ts-node
/**
 * Performance Test Runner
 * 
 * Comprehensive testing suite to evaluate RCA Agent performance across multiple error types.
 * 
 * Features:
 * - Run all 31 test cases or filter by category/complexity
 * - Measure accuracy, latency, and success rates
 * - Generate detailed performance reports
 * - Export results to JSON for analysis
 * - Compare against baseline metrics
 * 
 * Usage:
 * ```bash
 * # Run all tests
 * npm run perf-test
 * 
 * # Run specific category
 * npm run perf-test -- --category kotlin
 * 
 * # Run specific complexity
 * npm run perf-test -- --complexity simple
 * 
 * # Run specific test by ID
 * npm run perf-test -- --test KT-001
 * 
 * # Export results
 * npm run perf-test -- --output results.json
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PERFORMANCE_TEST_CASES,
  PerformanceTestCase,
  ErrorComplexity,
  ErrorCategory,
  getTestsByComplexity,
  getTestsByCategory,
  getTestById,
  TEST_STATISTICS,
} from '../tests/fixtures/performance-test-dataset';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ErrorParser } from '../src/utils/ErrorParser';

// ========================================
// TYPES
// ========================================

interface TestResult {
  testId: string;
  testName: string;
  category: ErrorCategory;
  errorType: string;
  complexity: ErrorComplexity;
  success: boolean;
  latencyMs: number;
  confidence: number;
  rootCauseFound: boolean;
  fixSuggestions: number;
  errorMessage?: string;
  timestamp: string;
}

interface PerformanceReport {
  timestamp: string;
  totalTests: number;
  testsRun: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalDurationMs: number;
  averageLatencyMs: number;
  medianLatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  averageConfidence: number;
  byCategory: Record<ErrorCategory, CategoryStats>;
  byComplexity: Record<ErrorComplexity, ComplexityStats>;
  results: TestResult[];
}

interface CategoryStats {
  total: number;
  success: number;
  failure: number;
  successRate: number;
  averageLatencyMs: number;
  averageConfidence: number;
}

interface ComplexityStats {
  total: number;
  success: number;
  failure: number;
  successRate: number;
  averageLatencyMs: number;
  averageConfidence: number;
}

interface CliOptions {
  category?: ErrorCategory;
  complexity?: ErrorComplexity;
  testId?: string;
  output?: string;
  verbose?: boolean;
  maxIterations?: number;
}

// ========================================
// CLI ARGUMENT PARSING
// ========================================

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--category':
      case '-c':
        options.category = nextArg as ErrorCategory;
        i++;
        break;
      case '--complexity':
      case '-x':
        options.complexity = nextArg as ErrorComplexity;
        i++;
        break;
      case '--test':
      case '-t':
        options.testId = nextArg;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = nextArg;
        i++;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--max-iterations':
      case '-m':
        options.maxIterations = parseInt(nextArg, 10);
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Performance Test Runner - RCA Agent Testing Suite

Usage:
  npm run perf-test [options]

Options:
  -c, --category <category>       Filter by category: kotlin, gradle, compose, xml, manifest, multi-layer
  -x, --complexity <complexity>   Filter by complexity: simple, medium, complex, edge-case
  -t, --test <testId>             Run specific test by ID (e.g., KT-001)
  -o, --output <file>             Export results to JSON file
  -m, --max-iterations <number>   Override agent max iterations (default: 3)
  -v, --verbose                   Enable verbose logging
  -h, --help                      Show this help message

Examples:
  npm run perf-test                              # Run all tests
  npm run perf-test -- --category kotlin         # Run Kotlin tests only
  npm run perf-test -- --complexity simple       # Run simple tests only
  npm run perf-test -- --test KT-001             # Run specific test
  npm run perf-test -- --output results.json     # Export results

Test Statistics:
  Total Tests: ${TEST_STATISTICS.total}
  By Category: Kotlin=${TEST_STATISTICS.byCategory.kotlin}, Gradle=${TEST_STATISTICS.byCategory.gradle}, Compose=${TEST_STATISTICS.byCategory.compose}, XML=${TEST_STATISTICS.byCategory.xml}, Manifest=${TEST_STATISTICS.byCategory.manifest}, Multi-Layer=${TEST_STATISTICS.byCategory.multiLayer}
  By Complexity: Simple=${TEST_STATISTICS.byComplexity.simple}, Medium=${TEST_STATISTICS.byComplexity.medium}, Complex=${TEST_STATISTICS.byComplexity.complex}, Edge-Case=${TEST_STATISTICS.byComplexity.edgeCase}
  Expected Duration: ${Math.round(TEST_STATISTICS.expectedTotalDuration / 60)} minutes
  `);
}

// ========================================
// TEST EXECUTION
// ========================================

async function runTest(
  testCase: PerformanceTestCase,
  agent: MinimalReactAgent,
  options: CliOptions
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    testId: testCase.id,
    testName: testCase.name,
    category: testCase.category,
    errorType: testCase.errorType,
    complexity: testCase.complexity,
    success: false,
    latencyMs: 0,
    confidence: 0,
    rootCauseFound: false,
    fixSuggestions: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // Parse error
    const parsedError = ErrorParser.getInstance().parse(testCase.error);
    
    if (!parsedError) {
      throw new Error('Failed to parse error');
    }

    if (options.verbose) {
      console.log(`  ├─ Parsed: ${parsedError.type} at ${parsedError.filePath}:${parsedError.line}`);
    }

    // Run analysis
    const rcaResult = await agent.analyze(parsedError);

    // Calculate latency
    result.latencyMs = Date.now() - startTime;

    // Evaluate results
    result.success = true;
    result.confidence = rcaResult.confidence;
    result.rootCauseFound = !!(rcaResult.rootCause && rcaResult.rootCause.length > 0);
    result.fixSuggestions = rcaResult.fixGuidelines?.length || 0;

    if (options.verbose) {
      console.log(`  ├─ Confidence: ${(rcaResult.confidence * 100).toFixed(1)}%`);
      console.log(`  ├─ Root Cause: ${result.rootCauseFound ? '✓' : '✗'}`);
      console.log(`  ├─ Fix Suggestions: ${result.fixSuggestions}`);
      console.log(`  └─ Latency: ${result.latencyMs}ms`);
    }

  } catch (error) {
    result.success = false;
    result.latencyMs = Date.now() - startTime;
    result.errorMessage = error instanceof Error ? error.message : String(error);

    if (options.verbose) {
      console.log(`  └─ Error: ${result.errorMessage}`);
    }
  }

  return result;
}

async function runAllTests(options: CliOptions): Promise<PerformanceReport> {
  console.log('🚀 Starting Performance Test Suite\n');

  // Initialize agent
  const ollamaClient = new OllamaClient({
    baseUrl: 'http://localhost:11434',
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    timeout: 120000,
  });

  const agent = new MinimalReactAgent(ollamaClient, {
    maxIterations: options.maxIterations || 3,
  });

  // Filter tests
  let testsToRun: PerformanceTestCase[] = [];

  if (options.testId) {
    const test = getTestById(options.testId);
    if (!test) {
      console.error(`❌ Test ${options.testId} not found`);
      process.exit(1);
    }
    testsToRun = [test];
  } else if (options.category) {
    testsToRun = getTestsByCategory(options.category);
  } else if (options.complexity) {
    testsToRun = getTestsByComplexity(options.complexity);
  } else {
    testsToRun = PERFORMANCE_TEST_CASES;
  }

  console.log(`📊 Running ${testsToRun.length} tests...\n`);

  // Run tests
  const results: TestResult[] = [];
  let testNumber = 0;

  for (const testCase of testsToRun) {
    testNumber++;
    console.log(`[${testNumber}/${testsToRun.length}] ${testCase.id}: ${testCase.name}`);

    const result = await runTest(testCase, agent, options);
    results.push(result);

    const statusIcon = result.success ? '✅' : '❌';
    console.log(`  ${statusIcon} ${result.success ? 'PASS' : 'FAIL'} (${result.latencyMs}ms)\n`);
  }

  // Generate report
  return generateReport(results, testsToRun.length);
}

// ========================================
// REPORT GENERATION
// ========================================

function generateReport(results: TestResult[], totalTests: number): PerformanceReport {
  const successResults = results.filter(r => r.success);
  const failureResults = results.filter(r => !r.success);

  // Calculate latency percentiles
  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b);
  const p90Index = Math.floor(latencies.length * 0.9);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  // Calculate average confidence
  const avgConfidence = successResults.length > 0
    ? successResults.reduce((sum, r) => sum + r.confidence, 0) / successResults.length
    : 0;

  // Group by category
  const byCategory: Record<ErrorCategory, CategoryStats> = {
    kotlin: calculateCategoryStats('kotlin', results),
    gradle: calculateCategoryStats('gradle', results),
    compose: calculateCategoryStats('compose', results),
    xml: calculateCategoryStats('xml', results),
    manifest: calculateCategoryStats('manifest', results),
    'multi-layer': calculateCategoryStats('multi-layer', results),
  };

  // Group by complexity
  const byComplexity: Record<ErrorComplexity, ComplexityStats> = {
    simple: calculateComplexityStats('simple', results),
    medium: calculateComplexityStats('medium', results),
    complex: calculateComplexityStats('complex', results),
    'edge-case': calculateComplexityStats('edge-case', results),
  };

  return {
    timestamp: new Date().toISOString(),
    totalTests,
    testsRun: results.length,
    successCount: successResults.length,
    failureCount: failureResults.length,
    successRate: results.length > 0 ? successResults.length / results.length : 0,
    totalDurationMs: results.reduce((sum, r) => sum + r.latencyMs, 0),
    averageLatencyMs: results.length > 0 ? results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length : 0,
    medianLatencyMs: latencies[Math.floor(latencies.length / 2)] || 0,
    p90LatencyMs: latencies[p90Index] || 0,
    p95LatencyMs: latencies[p95Index] || 0,
    p99LatencyMs: latencies[p99Index] || 0,
    averageConfidence: avgConfidence,
    byCategory,
    byComplexity,
    results,
  };
}

function calculateCategoryStats(category: ErrorCategory, results: TestResult[]): CategoryStats {
  const categoryResults = results.filter(r => r.category === category);
  const successResults = categoryResults.filter(r => r.success);

  return {
    total: categoryResults.length,
    success: successResults.length,
    failure: categoryResults.length - successResults.length,
    successRate: categoryResults.length > 0 ? successResults.length / categoryResults.length : 0,
    averageLatencyMs: categoryResults.length > 0 
      ? categoryResults.reduce((sum, r) => sum + r.latencyMs, 0) / categoryResults.length 
      : 0,
    averageConfidence: successResults.length > 0
      ? successResults.reduce((sum, r) => sum + r.confidence, 0) / successResults.length
      : 0,
  };
}

function calculateComplexityStats(complexity: ErrorComplexity, results: TestResult[]): ComplexityStats {
  const complexityResults = results.filter(r => r.complexity === complexity);
  const successResults = complexityResults.filter(r => r.success);

  return {
    total: complexityResults.length,
    success: successResults.length,
    failure: complexityResults.length - successResults.length,
    successRate: complexityResults.length > 0 ? successResults.length / complexityResults.length : 0,
    averageLatencyMs: complexityResults.length > 0
      ? complexityResults.reduce((sum, r) => sum + r.latencyMs, 0) / complexityResults.length
      : 0,
    averageConfidence: successResults.length > 0
      ? successResults.reduce((sum, r) => sum + r.confidence, 0) / successResults.length
      : 0,
  };
}

// ========================================
// REPORT DISPLAY
// ========================================

function displayReport(report: PerformanceReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE TEST REPORT');
  console.log('='.repeat(80));
  console.log(`\nTimestamp: ${report.timestamp}`);
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Tests Run: ${report.testsRun}`);
  console.log(`Success: ${report.successCount} (${(report.successRate * 100).toFixed(1)}%)`);
  console.log(`Failure: ${report.failureCount} (${((1 - report.successRate) * 100).toFixed(1)}%)`);

  console.log('\n' + '-'.repeat(80));
  console.log('⏱️  LATENCY METRICS');
  console.log('-'.repeat(80));
  console.log(`Total Duration: ${(report.totalDurationMs / 1000).toFixed(1)}s`);
  console.log(`Average Latency: ${(report.averageLatencyMs / 1000).toFixed(1)}s`);
  console.log(`Median Latency: ${(report.medianLatencyMs / 1000).toFixed(1)}s`);
  console.log(`P90 Latency: ${(report.p90LatencyMs / 1000).toFixed(1)}s`);
  console.log(`P95 Latency: ${(report.p95LatencyMs / 1000).toFixed(1)}s`);
  console.log(`P99 Latency: ${(report.p99LatencyMs / 1000).toFixed(1)}s`);
  console.log(`Average Confidence: ${(report.averageConfidence * 100).toFixed(1)}%`);

  console.log('\n' + '-'.repeat(80));
  console.log('📁 BY CATEGORY');
  console.log('-'.repeat(80));
  
  const categories: ErrorCategory[] = ['kotlin', 'gradle', 'compose', 'xml', 'manifest', 'multi-layer'];
  for (const category of categories) {
    const stats = report.byCategory[category];
    if (stats.total > 0) {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  Tests: ${stats.total} | Success: ${stats.success}/${stats.total} (${(stats.successRate * 100).toFixed(1)}%)`);
      console.log(`  Avg Latency: ${(stats.averageLatencyMs / 1000).toFixed(1)}s | Avg Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    }
  }

  console.log('\n' + '-'.repeat(80));
  console.log('🎯 BY COMPLEXITY');
  console.log('-'.repeat(80));
  
  const complexities: ErrorComplexity[] = ['simple', 'medium', 'complex', 'edge-case'];
  for (const complexity of complexities) {
    const stats = report.byComplexity[complexity];
    if (stats.total > 0) {
      console.log(`\n${complexity.toUpperCase()}:`);
      console.log(`  Tests: ${stats.total} | Success: ${stats.success}/${stats.total} (${(stats.successRate * 100).toFixed(1)}%)`);
      console.log(`  Avg Latency: ${(stats.averageLatencyMs / 1000).toFixed(1)}s | Avg Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    }
  }

  console.log('\n' + '-'.repeat(80));
  console.log('❌ FAILED TESTS');
  console.log('-'.repeat(80));
  
  const failures = report.results.filter(r => !r.success);
  if (failures.length === 0) {
    console.log('\nNo failures! 🎉');
  } else {
    for (const failure of failures) {
      console.log(`\n${failure.testId}: ${failure.testName}`);
      console.log(`  Category: ${failure.category} | Complexity: ${failure.complexity}`);
      console.log(`  Error: ${failure.errorMessage}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

// ========================================
// MAIN
// ========================================

async function main(): Promise<void> {
  try {
    const options = parseArgs();

    // Run tests
    const report = await runAllTests(options);

    // Display report
    displayReport(report);

    // Export to file
    if (options.output) {
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`\n✅ Results exported to: ${outputPath}`);
    }

    // Exit with appropriate code
    process.exit(report.successRate === 1.0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { runAllTests, generateReport, displayReport };
