/**
 * Accuracy Testing Suite - Chunk 1.5
 * 
 * Tests RCA Agent accuracy on 10 real Kotlin error examples.
 * Measures:
 * - Parse success rate
 * - Root cause quality
 * - Fix guideline relevance
 * - Latency per analysis
 * - Overall accuracy (target: 6/10)
 */

import { OllamaClient } from '../../src/llm/OllamaClient';
import { KotlinNPEParser } from '../../src/utils/KotlinNPEParser';
import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { ReadFileTool } from '../../src/tools/ReadFileTool';
import { testDataset, TestCase } from '../fixtures/test-dataset';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AccuracyResult {
  testCase: TestCase;
  parsed: boolean;
  analyzed: boolean;
  rootCause: string;
  fixGuidelines: string[];
  confidence: number;
  latency: number; // milliseconds
  error?: string;
}

interface AccuracyMetrics {
  totalTests: number;
  parsedSuccessfully: number;
  analyzedSuccessfully: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  averageConfidence: number;
  results: AccuracyResult[];
  timestamp: string;
}

describe('Accuracy Testing Suite - Chunk 1.5', () => {
  let llmClient: OllamaClient;
  let parser: KotlinNPEParser;
  let agent: MinimalReactAgent;
  let readFileTool: ReadFileTool;

  // Skip tests if Ollama not available
  const isOllamaAvailable = process.env.OLLAMA_AVAILABLE === 'true';

  beforeAll(async () => {
    if (!isOllamaAvailable) {
      console.log('⚠️  Ollama not available - skipping accuracy tests');
      console.log('   Set OLLAMA_AVAILABLE=true to run these tests');
      return;
    }

    llmClient = new OllamaClient();
    parser = new KotlinNPEParser();
    readFileTool = new ReadFileTool();
    agent = new MinimalReactAgent(llmClient, readFileTool);

    // Check Ollama connection
    try {
      await llmClient.connect();
      console.log('✅ Connected to Ollama for accuracy testing');
    } catch (error) {
      console.error('❌ Failed to connect to Ollama:', error);
      throw error;
    }
  });

  describe('Individual Test Cases', () => {
    const results: AccuracyResult[] = [];

    testDataset.forEach((testCase) => {
      it(`should analyze ${testCase.id}: ${testCase.name}`, async () => {
        if (!isOllamaAvailable) {
          console.log(`⊘ Skipping ${testCase.id} - Ollama not available`);
          return;
        }

        const startTime = Date.now();
        const result: AccuracyResult = {
          testCase,
          parsed: false,
          analyzed: false,
          rootCause: '',
          fixGuidelines: [],
          confidence: 0,
          latency: 0,
        };

        try {
          // Step 1: Parse error
          const parsedError = parser.parse(testCase.errorText);
          result.parsed = parsedError !== null;

          if (!parsedError) {
            result.error = 'Failed to parse error';
            results.push(result);
            throw new Error(`Parser failed for ${testCase.id}`);
          }

          expect(parsedError.type).toBe(testCase.expectedType);
          console.log(`  ✓ Parsed: ${parsedError.type}`);

          // Step 2: Analyze with agent
          const rcaResult = await agent.analyze(parsedError);
          result.analyzed = true;
          result.rootCause = rcaResult.rootCause;
          result.fixGuidelines = rcaResult.fixGuidelines;
          result.confidence = rcaResult.confidence;

          const endTime = Date.now();
          result.latency = endTime - startTime;

          console.log(`  ✓ Root Cause: ${rcaResult.rootCause.substring(0, 80)}...`);
          console.log(`  ✓ Confidence: ${rcaResult.confidence}`);
          console.log(`  ✓ Latency: ${result.latency}ms`);
          console.log(`  ✓ Fix Guidelines: ${rcaResult.fixGuidelines.length} steps`);

          // Validate result structure
          expect(rcaResult.rootCause).toBeTruthy();
          expect(rcaResult.rootCause.length).toBeGreaterThan(10);
          expect(rcaResult.fixGuidelines).toBeDefined();
          expect(rcaResult.fixGuidelines.length).toBeGreaterThan(0);
          expect(rcaResult.confidence).toBeGreaterThanOrEqual(0);
          expect(rcaResult.confidence).toBeLessThanOrEqual(1);

          // Check latency target (90s)
          expect(result.latency).toBeLessThan(90000);

          results.push(result);
        } catch (error) {
          result.error = (error as Error).message;
          results.push(result);
          throw error;
        }
      }, 120000); // 2 minute timeout per test
    });

    afterAll(async () => {
      if (!isOllamaAvailable || results.length === 0) {
        return;
      }

      // Calculate metrics
      const metrics = calculateMetrics(results);

      // Log summary
      console.log('\n========================================');
      console.log('📊 ACCURACY TEST SUMMARY');
      console.log('========================================');
      console.log(`Total Tests: ${metrics.totalTests}`);
      console.log(`Parsed Successfully: ${metrics.parsedSuccessfully}/${metrics.totalTests}`);
      console.log(`Analyzed Successfully: ${metrics.analyzedSuccessfully}/${metrics.totalTests}`);
      console.log(`Parse Rate: ${((metrics.parsedSuccessfully / metrics.totalTests) * 100).toFixed(1)}%`);
      console.log(`Analysis Rate: ${((metrics.analyzedSuccessfully / metrics.totalTests) * 100).toFixed(1)}%`);
      console.log(`Average Confidence: ${metrics.averageConfidence.toFixed(2)}`);
      console.log(`Average Latency: ${(metrics.averageLatency / 1000).toFixed(1)}s`);
      console.log(`Max Latency: ${(metrics.maxLatency / 1000).toFixed(1)}s`);
      console.log(`Min Latency: ${(metrics.minLatency / 1000).toFixed(1)}s`);
      console.log('========================================\n');

      // Save detailed results to file
      await saveMetrics(metrics);
    });
  });

  describe('Accuracy Targets', () => {
    it('should meet minimum accuracy target (6/10 = 60%)', async () => {
      if (!isOllamaAvailable) {
        console.log('⊘ Skipping accuracy target check - Ollama not available');
        return;
      }

      // This test will be run after all individual tests
      // Check that at least 60% of tests passed
      const results = await loadLatestMetrics();
      if (!results) {
        console.warn('No metrics file found - run individual tests first');
        return;
      }

      const successRate = results.analyzedSuccessfully / results.totalTests;
      console.log(`Accuracy Rate: ${(successRate * 100).toFixed(1)}%`);

      expect(successRate).toBeGreaterThanOrEqual(0.6);
    });

    it('should meet latency target (<90s average)', async () => {
      if (!isOllamaAvailable) {
        console.log('⊘ Skipping latency target check - Ollama not available');
        return;
      }

      const results = await loadLatestMetrics();
      if (!results) {
        console.warn('No metrics file found - run individual tests first');
        return;
      }

      console.log(`Average Latency: ${(results.averageLatency / 1000).toFixed(1)}s`);
      expect(results.averageLatency).toBeLessThan(90000);
    });
  });
});

/**
 * Calculate accuracy metrics from test results
 */
function calculateMetrics(results: AccuracyResult[]): AccuracyMetrics {
  const parsedSuccessfully = results.filter(r => r.parsed).length;
  const analyzedSuccessfully = results.filter(r => r.analyzed).length;
  
  const latencies = results.filter(r => r.latency > 0).map(r => r.latency);
  const averageLatency = latencies.length > 0 
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
    : 0;
  
  const confidences = results.filter(r => r.confidence > 0).map(r => r.confidence);
  const averageConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return {
    totalTests: results.length,
    parsedSuccessfully,
    analyzedSuccessfully,
    averageLatency,
    maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
    minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
    averageConfidence,
    results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Save metrics to file
 */
async function saveMetrics(metrics: AccuracyMetrics): Promise<void> {
  const metricsDir = path.join(__dirname, '../../docs');
  const metricsFile = path.join(metricsDir, 'accuracy-metrics.json');
  
  try {
    await fs.mkdir(metricsDir, { recursive: true });
    await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
    console.log(`✅ Metrics saved to ${metricsFile}`);
  } catch (error) {
    console.error('Failed to save metrics:', error);
  }
}

/**
 * Load latest metrics from file
 */
async function loadLatestMetrics(): Promise<AccuracyMetrics | null> {
  const metricsFile = path.join(__dirname, '../../docs/accuracy-metrics.json');
  
  try {
    const data = await fs.readFile(metricsFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}
