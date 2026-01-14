#!/usr/bin/env ts-node
/**
 * Quick Llama3.1 Test - 5 sample cases
 * 
 * Quick validation test with llama3.1:8b-instruct-q5_K_M model
 * Tests 5 diverse cases for rapid feedback.
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { ErrorParser } from '../src/utils/ErrorParser';
import { getTestSplit } from '../tests/fixtures/dataset-split-loader';

const MODEL = 'llama3.1:8b-instruct-q5_K_M';

async function main() {
  console.log('[LAUNCH] Quick Llama3.1 Test (5 cases)\n');
  console.log(`Model: ${MODEL}\n`);

  // Initialize
  const llmClient = new OllamaClient({ model: MODEL });
  await llmClient.connect();

  const errorParser = ErrorParser.getInstance();
  const agent = new MinimalReactAgent(llmClient, {
    maxIterations: 3,
    usePromptEngine: true,
    useToolRegistry: true,
  });

  // Get first 5 test cases
  const testCases = getTestSplit().slice(0, 5);

  let passed = 0;
  const total = testCases.length;

  console.log(`Running ${total} test cases...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i] as any; // Type cast to handle different test case types
    console.log(`[${i + 1}/${total}] Testing ${testCase.id}: ${testCase.name}`);

    try {
      const startTime = Date.now();

      // Parse and analyze
      const parsedError = errorParser.parse(testCase.errorText || testCase.error);

      if (!parsedError) {
        console.log(`  [X] Parse failed`);
        continue;
      }

      const analysis = await agent.analyze(parsedError);
      const latency = Date.now() - startTime;

      if (analysis && analysis.rootCause && analysis.rootCause.length > 10) {
        passed++;
        console.log(`  [OK] Success (${(latency / 1000).toFixed(1)}s)`);
      } else {
        console.log(`  [X] No root cause (${(latency / 1000).toFixed(1)}s)`);
      }

    } catch (error) {
      console.log(`  [X] Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`[STATS] QUICK TEST RESULTS`);
  console.log(`========================================`);
  console.log(`Model: ${MODEL}`);
  console.log(`Passed: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`========================================\n`);
}

main().catch(console.error);
