/**
 * Unified Test Runner Core
 * 
 * Common infrastructure for all test runners to eliminate duplication.
 * Provides shared functionality for:
 * - Agent initialization
 * - Test execution
 * - Result collection and formatting
 * - Metrics calculation
 */

import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ToolRegistry } from '../../src/tools/ToolRegistry';
import { ReadFileTool } from '../../src/tools/ReadFileTool';
import { VersionLookupTool } from '../../src/tools/VersionLookupTool';
import { ParsedError } from '../../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

export interface TestCase {
  id: number;
  name: string;
  projectPath: string;
  error: ParsedError;
  expectedFixes: string[];
}

export interface TestMetrics {
  overallUsability: number;
  diagnosisAccuracy: number;
  solutionSpecificity: number;
  fileIdentification: number;
  codeExamples: number;
  versionSuggestions: number;
  confidence: number;
  latencyMs: number;
}

export interface TestResult {
  testName: string;
  error: ParsedError;
  result: any;
  metrics: TestMetrics;
  timestamp: string;
  status: 'passed' | 'partial' | 'failed';
}

export interface TestRunnerConfig {
  model?: string;
  temperature?: number;
  maxIterations?: number;
  enableCaching?: boolean;
  outputDir?: string;
}

/**
 * Core test runner class with shared functionality
 */
export class TestRunnerCore {
  private llmClient: OllamaClient | null = null;
  private agent: MinimalReactAgent | null = null;
  private config: TestRunnerConfig;

  constructor(config: TestRunnerConfig = {}) {
    this.config = {
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      temperature: 0.1,
      maxIterations: 5,
      enableCaching: true,
      outputDir: 'tests/results',
      ...config,
    };
  }

  /**
   * Initialize LLM and agent
   */
  async initialize(): Promise<void> {
    console.log('[INIT] Initializing Ollama LLM...');
    this.llmClient = new OllamaClient({
      model: this.config.model!,
      temperature: this.config.temperature,
      numPredict: 2048,
    });

    // Test LLM connection
    try {
      await this.llmClient.health();
      console.log('   [OK] LLM connection successful');
    } catch (error) {
      throw new Error('LLM connection failed. Is Ollama running? Run: ollama serve');
    }

    // Initialize tools
    console.log('[BUILD]  Initializing tools...');
    const toolRegistry = ToolRegistry.getInstance();

    // Register ReadFileTool
    toolRegistry.register(
      'read_file',
      new ReadFileTool(),
      z.object({ filePath: z.string(), line: z.number(), contextLines: z.number().optional() })
    );

    // Register VersionLookupTool
    toolRegistry.register(
      'version_lookup',
      new VersionLookupTool(),
      z.object({ tool: z.enum(['agp', 'kotlin', 'gradle']), queryType: z.enum(['exists', 'latest-stable', 'latest-any', 'compatible', 'suggest']), version: z.string().optional() })
    );

    console.log('   [OK] Tools registered');

    // Initialize agent
    console.log('[INIT] Initializing RCA Agent...');
    this.agent = new MinimalReactAgent(this.llmClient, {
      maxIterations: this.config.maxIterations,
      tools: toolRegistry,
      enableCaching: this.config.enableCaching,
    });
    console.log('   [OK] Agent initialized');
  }

  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    console.log(`\n[LIST] Test ${testCase.id}: ${testCase.name}`);
    console.log('-'.repeat(80));

    try {
      // Run analysis
      const result = await this.agent.analyze(testCase.error);
      const latencyMs = Date.now() - startTime;

      // Calculate metrics
      const metrics = this.calculateMetrics(result, testCase.expectedFixes, latencyMs);

      // Determine status
      let status: 'passed' | 'partial' | 'failed';
      if (metrics.overallUsability >= 75) status = 'passed';
      else if (metrics.overallUsability >= 50) status = 'partial';
      else status = 'failed';

      console.log(`   Overall Usability: ${metrics.overallUsability}%`);
      console.log(`   Status: ${status.toUpperCase()}`);
      console.log(`   Latency: ${latencyMs}ms`);

      return {
        testName: testCase.name,
        error: testCase.error,
        result,
        metrics,
        timestamp: new Date().toISOString(),
        status,
      };
    } catch (error: any) {
      console.error(`   [X] Test failed: ${error.message}`);
      return {
        testName: testCase.name,
        error: testCase.error,
        result: null,
        metrics: this.getEmptyMetrics(),
        timestamp: new Date().toISOString(),
        status: 'failed',
      };
    }
  }

  /**
   * Run multiple test cases
   */
  async runTests(testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log(`\n[TEST] Running ${testCases.length} test cases...\n`);

    for (let i = 0; i < testCases.length; i++) {
      const result = await this.runTest(testCases[i]);
      results.push(result);

      // Save individual result
      if (this.config.outputDir) {
        await this.saveResult(result, testCases[i].id);
      }
    }

    return results;
  }

  /**
   * Calculate test metrics
   */
  private calculateMetrics(result: any, expectedFixes: string[], latencyMs: number): TestMetrics {
    const text = JSON.stringify(result).toLowerCase();

    // Diagnosis accuracy (0-100)
    const hasRootCause = result.rootCause && result.rootCause.length > 50;
    const diagnosisAccuracy = hasRootCause ? 85 : 40;

    // Solution specificity (0-100)
    const hasGuidelines = result.fixGuidelines && result.fixGuidelines.length >= 3;
    const hasSpecificSteps = expectedFixes.some(fix => text.includes(fix.toLowerCase()));
    let solutionSpecificity = 0;
    if (hasGuidelines) solutionSpecificity += 50;
    if (hasSpecificSteps) solutionSpecificity += 50;

    // File identification (0-100)
    const hasFilePath = /\w+\.\w+/.test(text);
    const hasLineNumber = /line\s*\d+|:\d+|#L\d+/i.test(text);
    let fileIdentification = 0;
    if (hasFilePath) fileIdentification += 50;
    if (hasLineNumber) fileIdentification += 50;

    // Code examples (0-100)
    const hasCodeBlock = /```|before:|after:/i.test(text);
    const codeExamples = hasCodeBlock ? 90 : 20;

    // Version suggestions (0-100, or -1 if N/A)
    const hasVersion = /\d+\.\d+\.\d+/.test(text);
    const versionSuggestions = hasVersion ? 80 : 0;

    // Overall usability (weighted average)
    const overallUsability = Math.round(
      diagnosisAccuracy * 0.25 +
      solutionSpecificity * 0.25 +
      fileIdentification * 0.2 +
      codeExamples * 0.15 +
      versionSuggestions * 0.15
    );

    return {
      overallUsability,
      diagnosisAccuracy,
      solutionSpecificity,
      fileIdentification,
      codeExamples,
      versionSuggestions,
      confidence: result.confidence || 0,
      latencyMs,
    };
  }

  /**
   * Get empty metrics for failed tests
   */
  private getEmptyMetrics(): TestMetrics {
    return {
      overallUsability: 0,
      diagnosisAccuracy: 0,
      solutionSpecificity: 0,
      fileIdentification: 0,
      codeExamples: 0,
      versionSuggestions: -1,
      confidence: 0,
      latencyMs: 0,
    };
  }

  /**
   * Save test result to file
   */
  private async saveResult(result: TestResult, testId: number): Promise<void> {
    const outputDir = path.join(process.cwd(), this.config.outputDir!);
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTestName = result.testName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = `test${testId}-${safeTestName}-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    await fs.mkdir(path.dirname(filepath), { recursive: true });

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`   💾 Result saved: ${filename}`);
  }

  /**
   * Generate summary report
   */
  generateSummary(results: TestResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('[STATS] TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = results.filter(r => r.status === 'passed').length;
    const partial = results.filter(r => r.status === 'partial').length;
    const failed = results.filter(r => r.status === 'failed').length;

    const avgUsability = results.reduce((sum, r) => sum + r.metrics.overallUsability, 0) / results.length;
    const avgLatency = results.reduce((sum, r) => sum + r.metrics.latencyMs, 0) / results.length;

    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`[OK] Passed: ${passed} (${((passed / results.length) * 100).toFixed(0)}%)`);
    console.log(`[WARN]  Partial: ${partial} (${((partial / results.length) * 100).toFixed(0)}%)`);
    console.log(`[X] Failed: ${failed} (${((failed / results.length) * 100).toFixed(0)}%)`);
    console.log(`\nAverage Usability: ${avgUsability.toFixed(1)}%`);
    console.log(`Average Latency: ${(avgLatency / 1000).toFixed(2)}s`);

    console.log('\n' + '-'.repeat(80));
    console.log('Individual Results:');
    console.log('-'.repeat(80));

    results.forEach((result, i) => {
      const statusIcon = result.status === 'passed' ? '[OK]' : result.status === 'partial' ? '[WARN]' : '[X]';
      console.log(`${i + 1}. ${result.testName.padEnd(40)} ${result.metrics.overallUsability}% ${statusIcon}`);
    });

    console.log('='.repeat(80));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Add any cleanup logic if needed
    console.log('\n🧹 Cleanup complete');
  }
}

/**
 * Helper function to create a test runner with default config
 */
export function createTestRunner(config?: TestRunnerConfig): TestRunnerCore {
  return new TestRunnerCore(config);
}
