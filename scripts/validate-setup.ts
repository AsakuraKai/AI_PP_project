#!/usr/bin/env ts-node
/**
 * Setup Validation Script
 * 
 * Quick validation to ensure the performance testing suite is properly configured
 * and the RCA Agent backend is functional.
 * 
 * Validates:
 * - Ollama server is running
 * - Model is loaded
 * - Backend components are functional
 * - Test dataset is accessible
 * - Agent can perform basic analysis
 * 
 * Usage:
 * ```bash
 * npm run perf-validate
 * ```
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { ErrorParser } from '../src/utils/ErrorParser';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { getTestById } from '../tests/fixtures/performance-test-dataset';

// ========================================
// VALIDATION TESTS
// ========================================

interface ValidationResult {
  test: string;
  status: 'pass' | 'fail';
  message: string;
  duration?: number;
}

async function validateOllamaServer(): Promise<ValidationResult> {
  const startTime = Date.now();
  
  try {
    const client = new OllamaClient({
      baseUrl: 'http://localhost:11434',
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      timeout: 30000, // 30s for quick validation test
    });

    // Test basic connectivity
    await client.generate('Test', { maxTokens: 10 });
    
    return {
      test: 'Ollama Server Connectivity',
      status: 'pass',
      message: 'Ollama server is running and responding',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      test: 'Ollama Server Connectivity',
      status: 'fail',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function validateErrorParser(): Promise<ValidationResult> {
  const startTime = Date.now();
  
  try {
    const testError = `
kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized
    at com.example.app.MainActivity.onCreate(MainActivity.kt:25)
    at android.app.Activity.performCreate(Activity.java:8000)
    `;

    const parser = ErrorParser.getInstance();
    const parsed = parser.parse(testError);

    if (!parsed) {
      throw new Error('Parser returned null for valid error');
    }

    if (parsed.type !== 'lateinit') {
      throw new Error(`Expected type 'lateinit', got '${parsed.type}'`);
    }

    return {
      test: 'Error Parser',
      status: 'pass',
      message: `Successfully parsed error as type '${parsed.type}'`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      test: 'Error Parser',
      status: 'fail',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function validateTestDataset(): Promise<ValidationResult> {
  const startTime = Date.now();
  
  try {
    const testCase = getTestById('KT-001');
    
    if (!testCase) {
      throw new Error('Test case KT-001 not found in dataset');
    }

    if (!testCase.error || testCase.error.length === 0) {
      throw new Error('Test case has empty error string');
    }

    return {
      test: 'Test Dataset',
      status: 'pass',
      message: `Test dataset loaded successfully (found KT-001: ${testCase.name})`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      test: 'Test Dataset',
      status: 'fail',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function validateAgentAnalysis(): Promise<ValidationResult> {
  const startTime = Date.now();
  
  try {
    // Get simple test case
    const testCase = getTestById('KT-001');
    if (!testCase) {
      throw new Error('Test case KT-001 not found');
    }

    // Parse error
    const parser = ErrorParser.getInstance();
    const parsedError = parser.parse(testCase.error);
    
    if (!parsedError) {
      throw new Error('Failed to parse test error');
    }

    // Run agent analysis
    const ollamaClient = new OllamaClient({
      baseUrl: 'http://localhost:11434',
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      timeout: 120000,
    });

    const agent = new MinimalReactAgent(ollamaClient, {
      maxIterations: 3,
    });

    const result = await agent.analyze(parsedError);

    if (!result) {
      throw new Error('Agent returned null result');
    }

    if (!result.rootCause || result.rootCause.length === 0) {
      throw new Error('Agent did not identify root cause');
    }

    const duration = Date.now() - startTime;

    return {
      test: 'Agent End-to-End Analysis',
      status: 'pass',
      message: `Agent successfully analyzed test case (confidence: ${(result.confidence * 100).toFixed(1)}%, latency: ${(duration / 1000).toFixed(1)}s)`,
      duration,
    };
  } catch (error) {
    return {
      test: 'Agent End-to-End Analysis',
      status: 'fail',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

// ========================================
// MAIN
// ========================================

async function main(): Promise<void> {
  console.log('\n🔍 Validating Performance Testing Setup\n');
  console.log('='.repeat(80));
  
  const results: ValidationResult[] = [];

  // Test 1: Ollama Server
  console.log('\n[1/4] Testing Ollama server connectivity...');
  const ollamaResult = await validateOllamaServer();
  results.push(ollamaResult);
  printResult(ollamaResult);

  if (ollamaResult.status === 'fail') {
    console.log('\n❌ Ollama server validation failed. Please ensure:');
    console.log('   1. Ollama is installed: https://ollama.ai/download');
    console.log('   2. Ollama server is running: ollama serve');
    console.log('   3. Model is downloaded: ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
    console.log('\nSkipping remaining tests...');
    printSummary(results);
    process.exit(1);
  }

  // Test 2: Error Parser
  console.log('\n[2/4] Testing error parser...');
  const parserResult = await validateErrorParser();
  results.push(parserResult);
  printResult(parserResult);

  // Test 3: Test Dataset
  console.log('\n[3/4] Testing performance test dataset...');
  const datasetResult = await validateTestDataset();
  results.push(datasetResult);
  printResult(datasetResult);

  // Test 4: Agent Analysis (only if previous tests passed)
  if (results.every(r => r.status === 'pass')) {
    console.log('\n[4/4] Running agent end-to-end test (KT-001: Simple lateinit NPE)...');
    console.log('   ⏳ This may take 60-90 seconds...');
    const agentResult = await validateAgentAnalysis();
    results.push(agentResult);
    printResult(agentResult);
  } else {
    console.log('\n[4/4] Skipping agent test due to previous failures...');
    results.push({
      test: 'Agent End-to-End Analysis',
      status: 'fail',
      message: 'Skipped due to previous failures',
    });
  }

  // Summary
  printSummary(results);

  // Exit with appropriate code
  const allPassed = results.every(r => r.status === 'pass');
  process.exit(allPassed ? 0 : 1);
}

function printResult(result: ValidationResult): void {
  const icon = result.status === 'pass' ? '✅' : '❌';
  const durationStr = result.duration ? ` (${(result.duration / 1000).toFixed(2)}s)` : '';
  
  console.log(`   ${icon} ${result.test}${durationStr}`);
  console.log(`      ${result.message}`);
}

function printSummary(results: ValidationResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION SUMMARY\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed === total) {
    console.log('\n🎉 All validation tests passed!');
    console.log('✅ Performance testing suite is ready to use.');
    console.log('\nNext steps:');
    console.log('  - Run quick test (8 simple cases, ~9 min):');
    console.log('    npm run perf-test:quick');
    console.log('  - Run full suite (31 tests, ~40 min):');
    console.log('    npm run perf-test');
  } else {
    console.log('\n❌ Some validation tests failed.');
    console.log('Please address the issues above before running performance tests.');
  }

  console.log('\n' + '='.repeat(80));
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error during validation:', error);
    process.exit(1);
  });
}

export { validateOllamaServer, validateErrorParser, validateTestDataset, validateAgentAnalysis };
