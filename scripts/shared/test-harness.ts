/**
 * Unified Test Harness
 * 
 * Consolidates all common test patterns from chunk7 and chunk8 individual test files.
 * Eliminates duplication in:
 * - Agent initialization
 * - Project setup
 * - Error parsing
 * - Metrics calculation
 * - Result formatting
 * - File saving
 * 
 * Usage:
 *   import { TestHarness } from './shared/test-harness';
 *   const harness = new TestHarness();
 *   await harness.runTest({...testConfig});
 */

import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ParsedError } from '../../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TestConfig {
  testNumber: number;
  testName: string;
  description: string;
  errorType: string;
  projectRoot: string;
  errorLog: string;
  errorContext: {
    filePath: string;
    line?: number;
    column?: number;
    language: string;
  };
  expectedDiagnosis?: string[];
  expectedSolution?: string[];
  testFiles?: Record<string, string>;
  baseline?: {
    usability: number;
    diagnosis: number;
    solution: number;
    fileId: number;
    codeExamples: number;
  };
}

export interface TestMetrics {
  diagnosis_accuracy: number;
  solution_specificity: number;
  file_identification: number;
  code_examples: number;
  version_suggestions: number;
  overall_usability: number;
  confidence: number;
  latency_ms: number;
}

export interface TestResult {
  test: string;
  testNumber: number;
  timestamp: string;
  metrics: TestMetrics;
  agentOutput: any;
  errorLog: string;
  projectRoot: string;
  status: 'passed' | 'partial' | 'failed';
  improvement?: {
    usability: number;
    diagnosis: number;
    solution: number;
  };
}

/**
 * Unified Test Harness
 */
export class TestHarness {
  private llm: OllamaClient | null = null;
  private agent: MinimalReactAgent | null = null;

  constructor(
    private config: {
      model?: string;
      baseUrl?: string;
      timeout?: number;
      maxIterations?: number;
      enableFixGeneration?: boolean;
    } = {}
  ) {
    this.config = {
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      baseUrl: 'http://localhost:11434',
      timeout: 120000,
      maxIterations: 5,
      enableFixGeneration: true,
      ...config,
    };
  }

  /**
   * Initialize LLM and Agent (common setup across all tests)
   */
  async initialize(projectRoot: string): Promise<void> {
    console.log('🤖 Initializing RCA agent...');
    
    this.llm = new OllamaClient({
      model: this.config.model!,
      baseUrl: this.config.baseUrl!,
      timeout: this.config.timeout!,
    });

    this.agent = new MinimalReactAgent(this.llm, {
      maxIterations: this.config.maxIterations!,
      generateFix: this.config.enableFixGeneration!,
      projectRoot: projectRoot,
    });

    console.log('[OK] Agent initialized\n');
  }

  /**
   * Create test project structure (common across all tests)
   */
  async setupTestProject(projectRoot: string, testFiles: Record<string, string>): Promise<void> {
    console.log('[FOLDER] Creating test project...');
    await fs.mkdir(projectRoot, { recursive: true });

    for (const [filename, content] of Object.entries(testFiles)) {
      const filePath = path.join(projectRoot, filename);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
    }
    
    console.log('[OK] Test project created\n');
  }

  /**
   * Run a single test (unified execution flow)
   */
  async runTest(testConfig: TestConfig): Promise<TestResult> {
    console.log(`\n[TEST] ${testConfig.testName.toUpperCase()}\n`);
    console.log('='.repeat(80));

    // Setup test project if files provided
    if (testConfig.testFiles) {
      await this.setupTestProject(testConfig.projectRoot, testConfig.testFiles);
    }

    // Initialize agent
    await this.initialize(testConfig.projectRoot);

    // Run analysis
    console.log('[SEARCH] Running RCA analysis...\n');
    const startTime = Date.now();

    try {
      const result = await this.agent!.analyze({
        type: this.getErrorType(testConfig.errorType),
        message: testConfig.errorLog,
        stackTrace: [],
        filePath: testConfig.errorContext.filePath,
        line: testConfig.errorContext.line || 0,
        column: testConfig.errorContext.column || 0,
        language: testConfig.errorContext.language,
      } as ParsedError);

      const latency = Date.now() - startTime;

      // Display results
      this.displayResults(result, latency);

      // Calculate metrics
      const metrics = this.calculateMetrics(
        result,
        latency,
        testConfig.expectedDiagnosis,
        testConfig.expectedSolution
      );

      // Display metrics
      this.displayMetrics(metrics, testConfig.testNumber);

      // Determine status
      const status = this.getTestStatus(metrics.overall_usability);

      // Calculate improvement if baseline provided
      let improvement;
      if (testConfig.baseline) {
        improvement = {
          usability: metrics.overall_usability - testConfig.baseline.usability,
          diagnosis: metrics.diagnosis_accuracy - testConfig.baseline.diagnosis,
          solution: metrics.solution_specificity - testConfig.baseline.solution,
        };
        this.displayImprovement(testConfig.baseline, metrics);
      }

      // Save results
      const testResult: TestResult = {
        test: testConfig.testName,
        testNumber: testConfig.testNumber,
        timestamp: new Date().toISOString(),
        metrics,
        agentOutput: result,
        errorLog: testConfig.errorLog,
        projectRoot: testConfig.projectRoot,
        status,
        improvement,
      };

      await this.saveResult(testResult);

      // Display summary
      this.displaySummary(testResult);

      return testResult;
    } catch (error) {
      console.error('[X] Test failed with error:', error);
      throw error;
    }
  }

  /**
   * Calculate metrics (standardized across all tests)
   */
  private calculateMetrics(
    result: any,
    latency: number,
    expectedDiagnosis?: string[],
    expectedSolution?: string[]
  ): TestMetrics {
    let diagnosis = 0;
    let solution = 0;
    let fileId = 0;
    let codeEx = 0;
    let version = 0;

    const rootCause = (result.rootCause || '').toLowerCase();
    const fixGuidelines = Array.isArray(result.fixGuidelines)
      ? result.fixGuidelines.join(' ')
      : (result.fixGuidelines || '');
    const fixText = fixGuidelines.toLowerCase();

    // Diagnosis accuracy
    if (expectedDiagnosis && expectedDiagnosis.length > 0) {
      const matches = expectedDiagnosis.filter(keyword => 
        rootCause.includes(keyword.toLowerCase())
      );
      diagnosis = Math.min(100, (matches.length / expectedDiagnosis.length) * 100);
    } else if (rootCause.length > 50) {
      diagnosis = 80; // Default if no expected keywords
    }

    // Solution specificity
    if (expectedSolution && expectedSolution.length > 0) {
      const matches = expectedSolution.filter(keyword => 
        fixText.includes(keyword.toLowerCase())
      );
      solution = Math.min(100, (matches.length / expectedSolution.length) * 100);
    } else if (fixGuidelines.length > 0) {
      solution = fixGuidelines.length >= 3 ? 70 : 40;
    }

    // File identification
    if (result.codeFix?.filePath) {
      fileId += 60;
      if (result.codeFix.line) fileId += 40;
    } else if (/\w+\.\w+/.test(fixText)) {
      fileId = 50;
    }

    // Code examples
    if (result.codeFix) {
      if (result.codeFix.originalCode) codeEx += 30;
      if (result.codeFix.fixedCode) codeEx += 30;
      if (result.codeFix.diff) codeEx += 40;
    }

    // Version suggestions
    const versionPattern = /\d+\.\d+\.\d+/;
    if (versionPattern.test(fixText) || versionPattern.test(rootCause)) {
      version = 80;
    }

    // Overall usability (weighted average)
    const overall = Math.round(
      diagnosis * 0.30 +
      solution * 0.25 +
      fileId * 0.20 +
      codeEx * 0.15 +
      version * 0.10
    );

    return {
      diagnosis_accuracy: Math.min(100, diagnosis),
      solution_specificity: Math.min(100, solution),
      file_identification: Math.min(100, fileId),
      code_examples: Math.min(100, codeEx),
      version_suggestions: Math.min(100, version),
      overall_usability: Math.min(100, overall),
      confidence: result.confidence || 0,
      latency_ms: latency,
    };
  }

  /**
   * Get error type for ParsedError
   */
  private getErrorType(errorType: string): string {
    const typeMap: Record<string, string> = {
      'gradle-dependency': 'gradle-dependency',
      'xml': 'xml',
      'manifest': 'xml',
      'network': 'gradle-dependency',
      'cache': 'gradle',
      'proguard': 'gradle',
      'navigation': 'kotlin',
      'runtime': 'runtime',
      'security': 'runtime_security',
    };
    return typeMap[errorType.toLowerCase()] || 'unknown';
  }

  /**
   * Display agent output (standardized format)
   */
  private displayResults(result: any, latency: number): void {
    console.log('\n' + '='.repeat(80));
    console.log('[SEARCH] AGENT OUTPUT\n');
    console.log('Root Cause:', result.rootCause || 'N/A');
    console.log('\nFix Guidelines:', result.fixGuidelines || 'N/A');
    if (result.codeFix) {
      console.log('\nCode Fix:', result.codeFix.explanation || 'N/A');
    }
    console.log('\nConfidence:', result.confidence || 0);
    console.log(`Latency: ${latency}ms (${(latency / 1000).toFixed(2)}s)`);
  }

  /**
   * Display metrics (standardized format)
   */
  private displayMetrics(metrics: TestMetrics, testNumber: number): void {
    console.log('\n' + '='.repeat(80));
    console.log(`[UP] TEST ${testNumber} METRICS\n`);
    console.log(`Diagnosis Accuracy:      ${metrics.diagnosis_accuracy.toFixed(0)}% ${this.getStatusEmoji(metrics.diagnosis_accuracy, 80)}`);
    console.log(`Solution Specificity:    ${metrics.solution_specificity.toFixed(0)}% ${this.getStatusEmoji(metrics.solution_specificity, 70)}`);
    console.log(`File Identification:     ${metrics.file_identification.toFixed(0)}% ${this.getStatusEmoji(metrics.file_identification, 70)}`);
    console.log(`Code Examples:           ${metrics.code_examples.toFixed(0)}% ${this.getStatusEmoji(metrics.code_examples, 60)}`);
    console.log(`Version Suggestions:     ${metrics.version_suggestions.toFixed(0)}% ${this.getStatusEmoji(metrics.version_suggestions, 60)}`);
    console.log(`Overall Usability:       ${metrics.overall_usability.toFixed(0)}% ${this.getStatusEmoji(metrics.overall_usability, 75)}`);
    console.log(`Confidence:              ${(metrics.confidence * 100).toFixed(0)}%`);
    console.log(`Latency:                 ${(metrics.latency_ms / 1000).toFixed(2)}s ${this.getStatusEmoji(metrics.latency_ms < 20000 ? 100 : 50, 80)}`);
  }

  /**
   * Display improvement (if baseline provided)
   */
  private displayImprovement(baseline: any, metrics: TestMetrics): void {
    console.log('\n' + '='.repeat(80));
    console.log('[STATS] IMPROVEMENT FROM BASELINE\n');
    console.log(`Usability:   ${baseline.usability}% → ${metrics.overall_usability}% (${this.formatDiff(metrics.overall_usability - baseline.usability)}%)`);
    console.log(`Diagnosis:   ${baseline.diagnosis}% → ${metrics.diagnosis_accuracy}% (${this.formatDiff(metrics.diagnosis_accuracy - baseline.diagnosis)}%)`);
    console.log(`Solution:    ${baseline.solution}% → ${metrics.solution_specificity}% (${this.formatDiff(metrics.solution_specificity - baseline.solution)}%)`);
    console.log(`File ID:     ${baseline.fileId}% → ${metrics.file_identification}% (${this.formatDiff(metrics.file_identification - baseline.fileId)}%)`);
    console.log(`Code Ex:     ${baseline.codeExamples}% → ${metrics.code_examples}% (${this.formatDiff(metrics.code_examples - baseline.codeExamples)}%)`);
  }

  /**
   * Display summary (standardized format)
   */
  private displaySummary(result: TestResult): void {
    console.log('\n' + '='.repeat(80));
    console.log('[NOTE] TEST SUMMARY\n');

    if (result.status === 'passed') {
      console.log('[OK] TEST PASSED - Usability target exceeded!');
    } else if (result.status === 'partial') {
      console.log('[WARN]  TEST PARTIAL - Usability acceptable but below target');
    } else {
      console.log('[X] TEST FAILED - Usability below acceptable threshold');
    }

    console.log(`\nTarget: 75%+ usability`);
    console.log(`Actual: ${result.metrics.overall_usability.toFixed(0)}%`);
    console.log(`Difference: ${this.formatDiff(result.metrics.overall_usability - 75)}%`);
  }

  /**
   * Save test result to JSON file
   */
  private async saveResult(result: TestResult): Promise<void> {
    const resultsDir = path.join(__dirname, '../../tests/results/chunk8');
    await fs.mkdir(resultsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `test${result.testNumber}-${result.test.toLowerCase().replace(/[:\s]+/g, '-')}-${timestamp}.json`;
    const resultsFile = path.join(resultsDir, filename);

    await fs.writeFile(resultsFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }

  /**
   * Determine test status from usability score
   */
  private getTestStatus(usability: number): 'passed' | 'partial' | 'failed' {
    if (usability >= 75) return 'passed';
    if (usability >= 60) return 'partial';
    return 'failed';
  }

  /**
   * Get status emoji based on value and target
   */
  private getStatusEmoji(value: number, target: number): string {
    if (value >= target) return '[OK]';
    if (value >= target * 0.8) return '[WARN]';
    return '[X]';
  }

  /**
   * Format difference with + or -
   */
  private formatDiff(diff: number): string {
    return diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  }
}

/**
 * Factory function to create test harness
 */
export function createTestHarness(config?: {
  model?: string;
  baseUrl?: string;
  timeout?: number;
  maxIterations?: number;
  enableFixGeneration?: boolean;
}): TestHarness {
  return new TestHarness(config);
}
