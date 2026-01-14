/**
 * Test Single Case - Quick test for debugging
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { ReadFileTool } from '../src/tools/ReadFileTool';
import { VersionLookupTool } from '../src/tools/VersionLookupTool';
import { z } from 'zod';
import * as path from 'path';

async function main() {
  console.log('[TEST] Testing single test case with few-shot example loading\n');
  
  // Initialize LLM
  const llmClient = new OllamaClient({
    baseUrl: 'http://localhost:11434',
    model: 'mistral:7b-instruct-v0.3-q4_K_M',
    timeout: 90000
  });
  
  try {
    await llmClient.connect();
    console.log('[OK] LLM connected\n');
  } catch (error: any) {
    console.error('[X] LLM connection failed:', error.message);
    process.exit(1);
  }
  
  // Register tools
  const toolRegistry = ToolRegistry.getInstance();
  toolRegistry.register(
    'read_file',
    new ReadFileTool(),
    z.object({ filePath: z.string(), line: z.number(), contextLines: z.number().optional() })
  );
  toolRegistry.register(
    'version_lookup',
    new VersionLookupTool(),
    z.object({ tool: z.enum(['agp', 'kotlin', 'gradle']), queryType: z.enum(['exists', 'latest-stable', 'latest-any', 'compatible', 'suggest']), version: z.string().optional() })
  );
  
  // Test ProGuard case
  console.log('📂 Testing Test 9: ProGuard\n');
  const testFixturePath = path.join(__dirname, '../tests/fixtures/test9-proguard');
  console.log(`   Project root: ${testFixturePath}\n`);
  
  const agent = new MinimalReactAgent(llmClient, {
    maxIterations: 3,
    projectRoot: testFixturePath,
    generateFix: true
  });
  
  const result = await agent.analyze({
    type: 'proguard',
    message: 'java.lang.NoSuchMethodError: No virtual method toJson',
    filePath: 'app/proguard-rules.pro',
    line: 1,
    column: 1,
    language: 'proguard',
    metadata: {
      severity: 'error',
      context: 'Gson reflection methods removed by R8'
    }
  });
  
  console.log('\n[STATS] Result:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
