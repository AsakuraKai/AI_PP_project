/**
 * Performance Comparison Tool
 * 
 * Compares current performance test results against baseline metrics
 * from Phase 1 completion and historical runs.
 * 
 * Features:
 * - Load baseline metrics from Phase 1
 * - Compare against historical test runs
 * - Detect regressions (performance degradation)
 * - Track improvements over time
 * - Generate visual comparison reports
 * 
 * Usage:
 * ```bash
 * # Compare latest results against baseline
 * npm run perf-compare
 * 
 * # Compare specific result file
 * npm run perf-compare -- --file results.json
 * 
 * # Show historical trends
 * npm run perf-compare -- --history
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

// ========================================
// TYPES
// ========================================

interface PerformanceMetrics {
  timestamp: string;
  totalTests: number;
  testsRun: number;
  successRate: number;
  averageLatencyMs: number;
  medianLatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  averageConfidence: number;
  byCategory?: Record<string, CategoryMetrics>;
  byComplexity?: Record<string, ComplexityMetrics>;
}

interface CategoryMetrics {
  total: number;
  successRate: number;
  averageLatencyMs: number;
  averageConfidence: number;
}

interface ComplexityMetrics {
  total: number;
  successRate: number;
  averageLatencyMs: number;
  averageConfidence: number;
}

interface ComparisonResult {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  percentChange: number;
  status: 'improved' | 'degraded' | 'stable';
  threshold?: number;
}

interface ComparisonReport {
  timestamp: string;
  baselineDate: string;
  currentDate: string;
  overallStatus: 'pass' | 'fail' | 'warning';
  summary: {
    improvements: number;
    degradations: number;
    stable: number;
  };
  comparisons: ComparisonResult[];
  recommendations: string[];
}

// ========================================
// BASELINE METRICS (Phase 1)
// ========================================

const PHASE_1_BASELINE: PerformanceMetrics = {
  timestamp: '2025-12-20T00:00:00.000Z',
  totalTests: 30, // 10 Kotlin + 20 Android
  testsRun: 30,
  successRate: 1.0, // 100% (30/30)
  averageLatencyMs: 75800, // 75.8s
  medianLatencyMs: 74200,
  p90LatencyMs: 103300, // 103.3s
  p95LatencyMs: 111500, // 111.5s
  p99LatencyMs: 115000,
  averageConfidence: 0.90, // ~90%
  byCategory: {
    kotlin: {
      total: 10,
      successRate: 1.0,
      averageLatencyMs: 68200,
      averageConfidence: 0.92,
    },
    gradle: {
      total: 5,
      successRate: 1.0,
      averageLatencyMs: 78500,
      averageConfidence: 0.88,
    },
    compose: {
      total: 8,
      successRate: 1.0,
      averageLatencyMs: 81300,
      averageConfidence: 0.89,
    },
    xml: {
      total: 7,
      successRate: 1.0,
      averageLatencyMs: 65800,
      averageConfidence: 0.91,
    },
  },
  byComplexity: {
    simple: {
      total: 8,
      successRate: 1.0,
      averageLatencyMs: 62500,
      averageConfidence: 0.93,
    },
    medium: {
      total: 15,
      successRate: 1.0,
      averageLatencyMs: 73800,
      averageConfidence: 0.90,
    },
    complex: {
      total: 7,
      successRate: 1.0,
      averageLatencyMs: 92100,
      averageConfidence: 0.87,
    },
  },
};

// ========================================
// REGRESSION THRESHOLDS
// ========================================

const REGRESSION_THRESHOLDS = {
  successRate: {
    critical: -0.10, // -10% is critical regression
    warning: -0.05,  // -5% is warning
  },
  latency: {
    critical: 0.25,   // +25% is critical regression
    warning: 0.15,    // +15% is warning
  },
  confidence: {
    critical: -0.15,  // -15% is critical regression
    warning: -0.10,   // -10% is warning
  },
};

// ========================================
// COMPARISON LOGIC
// ========================================

function compareMetrics(
  baseline: PerformanceMetrics,
  current: PerformanceMetrics
): ComparisonResult[] {
  const comparisons: ComparisonResult[] = [];

  // Success Rate
  comparisons.push(compareMetric(
    'Success Rate',
    baseline.successRate,
    current.successRate,
    'percentage',
    REGRESSION_THRESHOLDS.successRate.warning,
    true // higher is better
  ));

  // Latency Metrics
  comparisons.push(compareMetric(
    'Average Latency',
    baseline.averageLatencyMs / 1000,
    current.averageLatencyMs / 1000,
    'seconds',
    REGRESSION_THRESHOLDS.latency.warning,
    false // lower is better
  ));

  comparisons.push(compareMetric(
    'Median Latency',
    baseline.medianLatencyMs / 1000,
    current.medianLatencyMs / 1000,
    'seconds',
    REGRESSION_THRESHOLDS.latency.warning,
    false
  ));

  comparisons.push(compareMetric(
    'P90 Latency',
    baseline.p90LatencyMs / 1000,
    current.p90LatencyMs / 1000,
    'seconds',
    REGRESSION_THRESHOLDS.latency.warning,
    false
  ));

  comparisons.push(compareMetric(
    'P95 Latency',
    baseline.p95LatencyMs / 1000,
    current.p95LatencyMs / 1000,
    'seconds',
    REGRESSION_THRESHOLDS.latency.warning,
    false
  ));

  // Confidence
  comparisons.push(compareMetric(
    'Average Confidence',
    baseline.averageConfidence,
    current.averageConfidence,
    'percentage',
    REGRESSION_THRESHOLDS.confidence.warning,
    true
  ));

  return comparisons;
}

function compareMetric(
  name: string,
  baseline: number,
  current: number,
  _unit: 'percentage' | 'seconds', // Prefix with underscore to mark as intentionally unused
  threshold: number,
  higherIsBetter: boolean
): ComparisonResult {
  const change = current - baseline;
  const percentChange = baseline !== 0 ? (change / baseline) : 0;

  let status: 'improved' | 'degraded' | 'stable';
  
  if (higherIsBetter) {
    if (percentChange > Math.abs(threshold) / 2) status = 'improved';
    else if (percentChange < threshold) status = 'degraded';
    else status = 'stable';
  } else {
    if (percentChange < -Math.abs(threshold) / 2) status = 'improved';
    else if (percentChange > Math.abs(threshold)) status = 'degraded';
    else status = 'stable';
  }

  return {
    metric: name,
    baseline,
    current,
    change,
    percentChange,
    status,
    threshold,
  };
}

// ========================================
// REPORT GENERATION
// ========================================

function generateComparisonReport(
  baseline: PerformanceMetrics,
  current: PerformanceMetrics
): ComparisonReport {
  const comparisons = compareMetrics(baseline, current);
  
  const improvements = comparisons.filter(c => c.status === 'improved').length;
  const degradations = comparisons.filter(c => c.status === 'degraded').length;
  const stable = comparisons.filter(c => c.status === 'stable').length;

  // Determine overall status
  const criticalDegradations = comparisons.filter(c => {
    if (c.status !== 'degraded') return false;
    if (c.metric.includes('Success Rate')) {
      return c.percentChange < REGRESSION_THRESHOLDS.successRate.critical;
    } else if (c.metric.includes('Latency')) {
      return c.percentChange > REGRESSION_THRESHOLDS.latency.critical;
    } else if (c.metric.includes('Confidence')) {
      return c.percentChange < REGRESSION_THRESHOLDS.confidence.critical;
    }
    return false;
  });

  const overallStatus = criticalDegradations.length > 0 ? 'fail' : 
                        degradations > 0 ? 'warning' : 'pass';

  // Generate recommendations
  const recommendations = generateRecommendations(comparisons, current);

  return {
    timestamp: new Date().toISOString(),
    baselineDate: baseline.timestamp,
    currentDate: current.timestamp,
    overallStatus,
    summary: {
      improvements,
      degradations,
      stable,
    },
    comparisons,
    recommendations,
  };
}

function generateRecommendations(
  comparisons: ComparisonResult[],
  current: PerformanceMetrics
): string[] {
  const recommendations: string[] = [];

  // Success rate recommendations
  const successRateComp = comparisons.find(c => c.metric === 'Success Rate');
  if (successRateComp && successRateComp.status === 'degraded') {
    recommendations.push(
      '⚠️ Success rate has decreased. Review failed test cases and improve error handling.'
    );
    if (current.successRate < 0.90) {
      recommendations.push(
        '🔴 CRITICAL: Success rate below 90% target. Immediate investigation required.'
      );
    }
  }

  // Latency recommendations
  const avgLatency = comparisons.find(c => c.metric === 'Average Latency');
  if (avgLatency && avgLatency.status === 'degraded') {
    recommendations.push(
      '⚠️ Latency has increased. Consider optimizing prompt engineering or reducing iterations.'
    );
    if (avgLatency.current > 90) {
      recommendations.push(
        '🔴 CRITICAL: Average latency exceeds 90s target. Performance optimization needed.'
      );
    }
  }

  const p95Latency = comparisons.find(c => c.metric === 'P95 Latency');
  if (p95Latency && p95Latency.current > 110) {
    recommendations.push(
      '⚠️ P95 latency exceeds 110s threshold. Some complex tests are taking too long.'
    );
  }

  // Confidence recommendations
  const confidenceComp = comparisons.find(c => c.metric === 'Average Confidence');
  if (confidenceComp && confidenceComp.status === 'degraded') {
    recommendations.push(
      '⚠️ Confidence scores have decreased. Review agent reasoning quality and few-shot examples.'
    );
    if (confidenceComp.current < 0.85) {
      recommendations.push(
        '🔴 CRITICAL: Confidence below 85% target. Analysis quality needs improvement.'
      );
    }
  }

  // Positive feedback
  if (recommendations.length === 0) {
    recommendations.push(
      '✅ All metrics are stable or improved. Performance is meeting or exceeding baseline.'
    );
  }

  return recommendations;
}

// ========================================
// DISPLAY
// ========================================

function displayComparisonReport(report: ComparisonReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE COMPARISON REPORT');
  console.log('='.repeat(80));
  
  const statusIcon = report.overallStatus === 'pass' ? '✅' : 
                     report.overallStatus === 'warning' ? '⚠️' : '🔴';
  
  console.log(`\n${statusIcon} Overall Status: ${report.overallStatus.toUpperCase()}`);
  console.log(`Baseline: ${new Date(report.baselineDate).toLocaleDateString()}`);
  console.log(`Current:  ${new Date(report.currentDate).toLocaleDateString()}`);
  
  console.log('\n' + '-'.repeat(80));
  console.log('📈 SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Improvements: ${report.summary.improvements} ⬆️`);
  console.log(`Stable:       ${report.summary.stable} ➡️`);
  console.log(`Degradations: ${report.summary.degradations} ⬇️`);

  console.log('\n' + '-'.repeat(80));
  console.log('🔍 DETAILED COMPARISON');
  console.log('-'.repeat(80));
  console.log(
    `${'Metric'.padEnd(25)} ${'Baseline'.padEnd(12)} ${'Current'.padEnd(12)} ${'Change'.padEnd(12)} Status`
  );
  console.log('-'.repeat(80));

  for (const comp of report.comparisons) {
    const statusIcon = comp.status === 'improved' ? '✅' :
                       comp.status === 'degraded' ? '❌' : '➡️';
    
    const baselineStr = formatMetricValue(comp.metric, comp.baseline);
    const currentStr = formatMetricValue(comp.metric, comp.current);
    const changeStr = formatChange(comp.change, comp.percentChange, comp.metric);
    
    console.log(
      `${comp.metric.padEnd(25)} ${baselineStr.padEnd(12)} ${currentStr.padEnd(12)} ${changeStr.padEnd(12)} ${statusIcon}`
    );
  }

  console.log('\n' + '-'.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('-'.repeat(80));
  for (const rec of report.recommendations) {
    console.log(`\n${rec}`);
  }

  console.log('\n' + '='.repeat(80));
}

function formatMetricValue(metric: string, value: number): string {
  if (metric.includes('Rate') || metric.includes('Confidence')) {
    return `${(value * 100).toFixed(1)}%`;
  } else if (metric.includes('Latency')) {
    return `${value.toFixed(1)}s`;
  }
  return value.toFixed(2);
}

function formatChange(change: number, percentChange: number, metric: string): string {
  const sign = change >= 0 ? '+' : '';
  if (metric.includes('Rate') || metric.includes('Confidence')) {
    return `${sign}${(percentChange * 100).toFixed(1)}%`;
  } else if (metric.includes('Latency')) {
    return `${sign}${change.toFixed(1)}s (${sign}${(percentChange * 100).toFixed(1)}%)`;
  }
  return `${sign}${change.toFixed(2)} (${sign}${(percentChange * 100).toFixed(1)}%)`;
}

// ========================================
// FILE OPERATIONS
// ========================================

function loadResultsFile(filePath: string): PerformanceMetrics {
  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Results file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content) as PerformanceMetrics;
}

function saveComparisonReport(report: ComparisonReport, outputPath?: string): void {
  const defaultPath = path.join(process.cwd(), 'performance-comparison.json');
  const finalPath = outputPath ? path.resolve(outputPath) : defaultPath;
  
  fs.writeFileSync(finalPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n✅ Comparison report saved to: ${finalPath}`);
}

function getHistoricalResults(): PerformanceMetrics[] {
  const resultsDir = path.join(process.cwd(), 'performance-results');
  
  if (!fs.existsSync(resultsDir)) {
    return [];
  }

  const files = fs.readdirSync(resultsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  return files.slice(0, 10).map(file => {
    const content = fs.readFileSync(path.join(resultsDir, file), 'utf-8');
    return JSON.parse(content) as PerformanceMetrics;
  });
}

// ========================================
// CLI
// ========================================

interface CompareOptions {
  file?: string;
  output?: string;
  history?: boolean;
  baseline?: 'phase1' | string;
}

function parseArgs(): CompareOptions {
  const args = process.argv.slice(2);
  const options: CompareOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--file':
      case '-f':
        options.file = nextArg;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = nextArg;
        i++;
        break;
      case '--history':
      case '-h':
        options.history = true;
        break;
      case '--baseline':
      case '-b':
        options.baseline = nextArg;
        i++;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Performance Comparison Tool - Track Performance Over Time

Usage:
  npm run perf-compare [options]

Options:
  -f, --file <path>        Path to results JSON file to compare
  -o, --output <path>      Save comparison report to file
  -h, --history            Show historical performance trends
  -b, --baseline <source>  Baseline to compare against (default: phase1)
  --help                   Show this help message

Examples:
  npm run perf-compare                              # Compare latest results
  npm run perf-compare -- --file results.json       # Compare specific file
  npm run perf-compare -- --history                 # Show trends
  npm run perf-compare -- --output comparison.json  # Save report

Baseline Metrics (Phase 1):
  Tests: 30 (10 Kotlin + 20 Android)
  Success Rate: 100%
  Average Latency: 75.8s
  P95 Latency: 111.5s
  Average Confidence: 90%
  `);
}

// ========================================
// MAIN
// ========================================

async function main(): Promise<void> {
  try {
    const options = parseArgs();

    // Load baseline
    const baseline = PHASE_1_BASELINE;

    if (options.history) {
      console.log('\n📊 Historical Performance Trends');
      console.log('='.repeat(80));
      
      const historical = getHistoricalResults();
      if (historical.length === 0) {
        console.log('\nNo historical results found. Run performance tests to generate data.');
        return;
      }

      console.log(`\nFound ${historical.length} historical result(s):\n`);
      console.log(
        `${'Date'.padEnd(20)} ${'Tests'.padEnd(10)} ${'Success'.padEnd(12)} ${'Avg Latency'.padEnd(15)} Confidence`
      );
      console.log('-'.repeat(80));

      for (const result of historical) {
        const date = new Date(result.timestamp).toLocaleDateString();
        const tests = `${result.testsRun}/${result.totalTests}`;
        const success = `${(result.successRate * 100).toFixed(1)}%`;
        const latency = `${(result.averageLatencyMs / 1000).toFixed(1)}s`;
        const confidence = `${(result.averageConfidence * 100).toFixed(1)}%`;
        
        console.log(
          `${date.padEnd(20)} ${tests.padEnd(10)} ${success.padEnd(12)} ${latency.padEnd(15)} ${confidence}`
        );
      }
      
      return;
    }

    // Load current results
    let current: PerformanceMetrics;
    
    if (options.file) {
      current = loadResultsFile(options.file);
    } else {
      // Look for most recent results file
      const defaultPath = path.join(process.cwd(), 'results.json');
      if (fs.existsSync(defaultPath)) {
        current = loadResultsFile(defaultPath);
      } else {
        console.error('\n❌ No results file found. Run performance tests first:');
        console.error('   npm run perf-test -- --output results.json');
        process.exit(1);
      }
    }

    // Generate and display report
    const report = generateComparisonReport(baseline, current);
    displayComparisonReport(report);

    // Save report if requested
    if (options.output) {
      saveComparisonReport(report, options.output);
    }

    // Exit with appropriate code
    process.exit(report.overallStatus === 'fail' ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  compareMetrics,
  generateComparisonReport,
  displayComparisonReport,
  PHASE_1_BASELINE,
  REGRESSION_THRESHOLDS,
};
