/**
 * Phase 4 Test Runner
 * 
 * Automated test execution for all 10 test cases
 * 
 * Usage:
 *   npm run test:phase4
 *   node scripts/phase4-test-runner.ts
 */

import Phase4TestSuite from '../tests/real-world/Phase4TestSuite';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { ReadFileTool } from '../src/tools/ReadFileTool';
import { VersionLookupTool } from '../src/tools/VersionLookupTool';
import { z } from 'zod';

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('[LAUNCH] PHASE 4: REAL-WORLD TESTING');
  console.log('Testing Agent Usability on 10 Diverse Android Errors');
  console.log('='.repeat(80));

  try {
    // Initialize LLM client
    console.log('\n[INIT] Initializing Ollama LLM...');
    const llmClient = new OllamaClient({
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      temperature: 0.1,
      numPredict: 2048
    });

    // Test LLM connection
    try {
      await llmClient.connect();
      console.log('   [OK] LLM connection successful');
    } catch (error: any) {
      console.error('   [X] LLM connection failed. Is Ollama running?');
      console.error(`   Error: ${error.message}`);
      console.error('   Run: ollama serve');
      process.exit(1);
    }

    // Initialize tools
    console.log('\n[BUILD]  Initializing tools...');
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
    console.log('\n[INIT] Initializing RCA Agent...');
    const agent = new MinimalReactAgent(llmClient, {
      maxIterations: 5,
      tools: toolRegistry,
      enableCaching: true
    });
    console.log('   [OK] Agent initialized');

    // Initialize test suite
    console.log('\n[TEST] Initializing Test Suite...');
    const testSuite = new Phase4TestSuite(agent);
    console.log('   [OK] Test Suite ready with 10 test cases');

    // Run all tests
    console.log('\n[START] Starting test execution...\n');
    const startTime = Date.now();
    const report = await testSuite.runAllTests();
    const totalTime = Date.now() - startTime;

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('[OK] TEST EXECUTION COMPLETE');
    console.log('='.repeat(80));
    console.log(`   Total Time: ${Math.round(totalTime / 1000)}s`);
    console.log(`   Tests Passed: ${report.passed_tests}/${report.total_tests}`);
    console.log(`   Average Usability: ${Math.round(report.average_usability)}%`);
    console.log('='.repeat(80));

    // Exit with appropriate code
    if (report.failed_tests > 0) {
      console.log('\n[WARN]  Some tests failed. Review results for details.');
      process.exit(1);
    } else {
      console.log('\n[OK] All tests passed!');
      process.exit(0);
    }

  } catch (error: any) {
    console.error('\n[X] Test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
