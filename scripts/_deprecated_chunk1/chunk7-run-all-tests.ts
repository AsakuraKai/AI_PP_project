/**
 * Chunk 7: Real-World Test Suite - All 5 Tests
 * 
 * Runs all 5 diverse Android error tests to validate Chunks 1-6 improvements:
 * - Test 1: AGP Version Conflict (already validated at 94%)
 * - Test 2: Kotlin lateinit NPE
 * - Test 3: Compose API Breakage
 * - Test 4: XML Layout Inflation
 * - Test 5: Multi-Module Dependency Conflict
 * 
 * Target: 70%+ average usability across all tests
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ParsedError } from '../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TestCase {
  id: number;
  name: string;
  projectPath: string;
  error: ParsedError;
  expectedFixes: string[];
}

interface TestResult {
  testName: string;
  error: ParsedError;
  result: any;
  metrics: {
    overallUsability: number;
    diagnosisAccuracy: number;
    solutionSpecificity: number;
    fileIdentification: number;
    codeExamples: number;
    versionSuggestions: number;
    confidence: number;
    latencyMs: number;
  };
  timestamp: string;
}

// Test definitions
const TEST_CASES: TestCase[] = [
  {
    id: 1,
    name: 'AGP Version Conflict',
    projectPath: 'tests/fixtures/mvp-test-project',
    error: {
      type: 'gradle-dependency',
      message: 'Could not find com.android.tools.build:gradle:8.10.0',
      filePath: 'gradle/libs.versions.toml',
      line: 2,
      column: 1,
      language: 'gradle',
      metadata: {
        severity: 'error',
        context: 'AGP version 8.10.0 not found in Maven Central',
        raw: `Could not find com.android.tools.build:gradle:8.10.0`
      }
    },
    expectedFixes: ['agp = "8.7.3"', 'gradle/libs.versions.toml']
  },
  {
    id: 2,
    name: 'Kotlin lateinit NPE',
    projectPath: 'tests/fixtures/test-2-lateinit-npe',
    error: {
      type: 'kotlin-runtime',
      message: 'lateinit property viewModel has not been initialized',
      filePath: 'MainActivity.kt',
      line: 14,
      column: 1,
      language: 'kotlin',
      metadata: {
        severity: 'error',
        context: 'UninitializedPropertyAccessException at runtime',
        raw: `kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized
\tat com.example.lateinittest.MainActivity.onCreate(MainActivity.kt:14)`
      }
    },
    expectedFixes: ['viewModel = ViewModelProvider', 'initialize before use']
  },
  {
    id: 3,
    name: 'Compose API Breakage',
    projectPath: 'tests/fixtures/test-3-compose-breakage',
    error: {
      type: 'kotlin-compile',
      message: 'Type mismatch: inferred type is Unit but CoroutineContext was expected',
      filePath: 'MainActivity.kt',
      line: 29,
      column: 5,
      language: 'kotlin',
      metadata: {
        severity: 'error',
        context: 'LaunchedEffect signature changed in Compose 1.6',
        raw: `e: file:///MainActivity.kt:29:5 Type mismatch: inferred type is Unit but CoroutineContext was expected
None of the following functions can be called with the arguments supplied: 
@Composable fun LaunchedEffect(key1: Any?, block: suspend CoroutineScope.() -> Unit): Unit`
      }
    },
    expectedFixes: ['LaunchedEffect(key1 = Unit)', 'named parameter']
  },
  {
    id: 4,
    name: 'XML Layout Inflation',
    projectPath: 'tests/fixtures/test-4-xml-inflation',
    error: {
      type: 'android-runtime',
      message: 'Error inflating class com.example.xmltest.CustonButton',
      filePath: 'activity_main.xml',
      line: 14,
      column: 1,
      language: 'xml',
      metadata: {
        severity: 'error',
        context: 'ClassNotFoundException - class name typo in XML',
        raw: `android.view.InflateException: Binary XML file line #14: Error inflating class com.example.xmltest.CustonButton
Caused by: java.lang.ClassNotFoundException: Didn't find class "com.example.xmltest.CustonButton"`
      }
    },
    expectedFixes: ['CustomButton', 'activity_main.xml line 14']
  },
  {
    id: 5,
    name: 'Multi-Module Dependency Conflict',
    projectPath: 'tests/fixtures/test-5-multi-module',
    error: {
      type: 'gradle-dependency',
      message: 'Kotlin version mismatch: app module: 1.9.22, core module: 2.0.0',
      filePath: 'build.gradle',
      line: 1,
      column: 1,
      language: 'gradle',
      metadata: {
        severity: 'error',
        context: 'Multi-module Kotlin version conflict',
        raw: `Module 'org.jetbrains.kotlin:kotlin-stdlib' version conflict:
- Module 'app' depends on kotlin-stdlib:1.9.22
- Module 'core' depends on kotlin-stdlib:2.0.0
All modules must use the same Kotlin version.`
      }
    },
    expectedFixes: ['version "2.0.0"', 'app/build.gradle', 'core/build.gradle']
  }
];

async function runTest(testCase: TestCase, agent: MinimalReactAgent): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[TEST] Running Test ${testCase.id}: ${testCase.name}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const startTime = Date.now();
  
  try {
    const result = await agent.analyze(testCase.error);
    const latencyMs = Date.now() - startTime;

    console.log(`\n[OK] Test ${testCase.id} complete!`);
    console.log(`[TIME]  Latency: ${(latencyMs / 1000).toFixed(2)}s`);
    
    // Calculate metrics
    const metrics = calculateMetrics(result, testCase);
    
    // Display results
    console.log('\n[STATS] Metrics:');
    console.log(`   Overall Usability: ${metrics.overallUsability}%`);
    console.log(`   Diagnosis Accuracy: ${metrics.diagnosisAccuracy}%`);
    console.log(`   Solution Specificity: ${metrics.solutionSpecificity}%`);
    console.log(`   File Identification: ${metrics.fileIdentification}%`);
    console.log(`   Code Examples: ${metrics.codeExamples}%`);
    
    return {
      testName: testCase.name,
      error: testCase.error,
      result,
      metrics: { ...metrics, latencyMs },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`\n[X] Test ${testCase.id} failed:`, error);
    throw error;
  }
}

function calculateMetrics(result: any, testCase: TestCase): any {
  const metrics = {
    overallUsability: 0,
    diagnosisAccuracy: 0,
    solutionSpecificity: 0,
    fileIdentification: 0,
    codeExamples: 0,
    versionSuggestions: 0,
    confidence: 0
  };

  // Diagnosis accuracy (does it identify the root cause?)
  if (result.rootCause && result.rootCause.length > 50) {
    metrics.diagnosisAccuracy = 100;
  }

  // Solution specificity (are fix guidelines actionable?)
  if (result.fixGuidelines && result.fixGuidelines.length > 0) {
    const guidelines = result.fixGuidelines.join(' ').toLowerCase();
    let score = 0;
    
    // Check for specific elements in expected fixes
    for (const expectedFix of testCase.expectedFixes) {
      if (guidelines.includes(expectedFix.toLowerCase())) {
        score += 100 / testCase.expectedFixes.length;
      }
    }
    metrics.solutionSpecificity = Math.round(score);
  }

  // File identification (does it identify exact file with line number?)
  if (result.affectedFiles && result.affectedFiles.length > 0) {
    const files = result.affectedFiles.join(' ').toLowerCase();
    const expectedFile = testCase.error.filePath.toLowerCase();
    
    if (files.includes(expectedFile)) {
      metrics.fileIdentification = files.includes('line') ? 100 : 50;
    }
  }

  // Code examples (does it show before/after code?)
  if (result.codeFix) {
    const hasBefore = result.codeFix.before && result.codeFix.before.length > 10;
    const hasAfter = result.codeFix.after && result.codeFix.after.length > 10;
    
    if (hasBefore && hasAfter) {
      metrics.codeExamples = 100;
    } else if (hasBefore || hasAfter) {
      metrics.codeExamples = 50;
    }
  }

  // Version suggestions (for version-related errors)
  if (testCase.error.type.includes('dependency') || testCase.error.type.includes('gradle')) {
    const content = JSON.stringify(result).toLowerCase();
    // Check if specific versions are mentioned (not just "latest" or "update")
    const versionPattern = /\d+\.\d+\.\d+/;
    if (versionPattern.test(content)) {
      metrics.versionSuggestions = 100;
    }
  } else {
    metrics.versionSuggestions = 100; // N/A for non-version errors
  }

  // Confidence
  metrics.confidence = result.confidence || 0.5;

  // Overall usability (weighted average)
  metrics.overallUsability = Math.round(
    metrics.diagnosisAccuracy * 0.3 +
    metrics.solutionSpecificity * 0.3 +
    metrics.fileIdentification * 0.2 +
    metrics.codeExamples * 0.2
  );

  return metrics;
}

async function main() {
  console.log('\n[LAUNCH] Chunk 7: Real-World Test Suite');
  console.log('Running all 5 tests to validate Chunks 1-6 improvements\n');
  console.log(`Target: 70%+ average usability\n`);

  // Initialize Ollama client
  const ollama = new OllamaClient({
    baseUrl: 'http://localhost:11434',
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    timeout: 120000
  });

  const results: TestResult[] = [];
  
  // Run all tests
  for (const testCase of TEST_CASES) {
    const projectRoot = path.resolve(__dirname, '..', testCase.projectPath);
    
    const agent = new MinimalReactAgent(ollama, {
      maxIterations: 5,
      generateFix: true,
      projectRoot
    });

    const result = await runTest(testCase, agent);
    results.push(result);
    
    // Save individual test result
    const outputPath = path.join(__dirname, '..', 'tests', 'results', `chunk7-test${testCase.id}-${Date.now()}.json`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  }

  // Calculate overall statistics
  console.log('\n\n' + '='.repeat(80));
  console.log('[STATS] OVERALL RESULTS');
  console.log('='.repeat(80) + '\n');

  const avgUsability = results.reduce((sum, r) => sum + r.metrics.overallUsability, 0) / results.length;
  const avgDiagnosis = results.reduce((sum, r) => sum + r.metrics.diagnosisAccuracy, 0) / results.length;
  const avgSolution = results.reduce((sum, r) => sum + r.metrics.solutionSpecificity, 0) / results.length;
  const avgFileId = results.reduce((sum, r) => sum + r.metrics.fileIdentification, 0) / results.length;
  const avgCodeEx = results.reduce((sum, r) => sum + r.metrics.codeExamples, 0) / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.metrics.latencyMs, 0) / results.length;

  console.log('Average Metrics:');
  console.log(`  Overall Usability: ${avgUsability.toFixed(1)}% ${avgUsability >= 70 ? '[OK]' : '[X]'}`);
  console.log(`  Diagnosis Accuracy: ${avgDiagnosis.toFixed(1)}%`);
  console.log(`  Solution Specificity: ${avgSolution.toFixed(1)}%`);
  console.log(`  File Identification: ${avgFileId.toFixed(1)}%`);
  console.log(`  Code Examples: ${avgCodeEx.toFixed(1)}%`);
  console.log(`  Average Latency: ${(avgLatency / 1000).toFixed(2)}s`);

  console.log('\n\nIndividual Test Results:');
  results.forEach((r, i) => {
    console.log(`\n  Test ${i + 1}: ${r.testName}`);
    console.log(`    Usability: ${r.metrics.overallUsability}%`);
    console.log(`    Diagnosis: ${r.metrics.diagnosisAccuracy}%`);
    console.log(`    Solution: ${r.metrics.solutionSpecificity}%`);
    console.log(`    Latency: ${(r.metrics.latencyMs / 1000).toFixed(2)}s`);
  });

  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    target: '70% average usability',
    results,
    averages: {
      usability: avgUsability,
      diagnosis: avgDiagnosis,
      solution: avgSolution,
      fileIdentification: avgFileId,
      codeExamples: avgCodeEx,
      latency: avgLatency
    },
    success: avgUsability >= 70
  };

  const summaryPath = path.join(__dirname, '..', 'tests', 'results', `chunk7-summary-${Date.now()}.json`);
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n\n💾 Summary saved to: ${summaryPath}`);

  console.log('\n' + '='.repeat(80));
  if (avgUsability >= 70) {
    console.log('[SUCCESS] SUCCESS: Target achieved! Average usability ≥ 70%');
  } else {
    console.log('[WARN]  Target not met. Average usability < 70%');
  }
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);
