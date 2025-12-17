/**
 * Example usage of RCA Agent (Chunks 1.1-1.3)
 * 
 * This demonstrates how to use the implemented components:
 * - OllamaClient for LLM communication
 * - KotlinNPEParser for error parsing
 * - MinimalReactAgent for root cause analysis
 * 
 * Run with: ts-node examples/basic-usage.ts
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { KotlinNPEParser } from '../src/utils/KotlinNPEParser';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';

async function exampleLateinitError() {
  console.log('=== Example 1: Lateinit Error Analysis ===\n');

  // Sample error from Android app
  const errorText = `
    kotlin.UninitializedPropertyAccessException: 
    lateinit property user has not been initialized
    at com.example.MainActivity.onCreate(MainActivity.kt:45)
    at android.app.Activity.performCreate(Activity.java:7224)
  `.trim();

  try {
    // 1. Initialize LLM client
    console.log('1. Connecting to Ollama...');
    const llm = new OllamaClient({
      baseUrl: 'http://localhost:11434',
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    });
    await llm.connect();
    console.log('   ✓ Connected\n');

    // 2. Parse error
    console.log('2. Parsing error...');
    const parser = new KotlinNPEParser();
    const error = parser.parse(errorText);

    if (!error) {
      console.error('   ✗ Failed to parse error');
      return;
    }

    console.log('   ✓ Parsed successfully');
    console.log('   Type:', error.type);
    console.log('   File:', error.filePath);
    console.log('   Line:', error.line);
    console.log('   Property:', error.metadata?.propertyName);
    console.log('');

    // 3. Analyze with agent
    console.log('3. Running RCA analysis (this may take 30-60s)...');
    const agent = new MinimalReactAgent(llm);
    const result = await agent.analyze(error);

    console.log('   ✓ Analysis complete\n');

    // 4. Display results
    console.log('=== ANALYSIS RESULTS ===\n');
    console.log('Root Cause:');
    console.log(result.rootCause);
    console.log('');

    console.log('Fix Guidelines:');
    result.fixGuidelines.forEach((guideline, i) => {
      console.log(`${i + 1}. ${guideline}`);
    });
    console.log('');

    console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

async function exampleNullPointerException() {
  console.log('\n=== Example 2: NullPointerException Analysis ===\n');

  const errorText = `
    java.lang.NullPointerException: Attempt to invoke virtual method 'java.lang.String com.example.User.getName()' on a null object reference
    at com.example.UserRepository.formatUserName(UserRepository.kt:23)
    at com.example.MainActivity.displayUser(MainActivity.kt:67)
  `.trim();

  try {
    const llm = new OllamaClient();
    await llm.connect();

    const parser = new KotlinNPEParser();
    const error = parser.parse(errorText);

    if (!error) {
      console.error('Failed to parse error');
      return;
    }

    console.log('Parsed Error:');
    console.log('  Type:', error.type);
    console.log('  File:', error.filePath);
    console.log('  Stack depth:', error.stackTrace?.length || 0);
    console.log('');

    console.log('Analyzing...');
    const agent = new MinimalReactAgent(llm);
    const result = await agent.analyze(error);

    console.log('\nRoot Cause:');
    console.log(result.rootCause);
    console.log('\nRecommended Fixes:');
    result.fixGuidelines.forEach((fix, i) => console.log(`  ${i + 1}. ${fix}`));
  } catch (error) {
    console.error('Error:', error);
  }
}

async function checkOllamaStatus() {
  console.log('=== Checking Ollama Status ===\n');

  try {
    const client = new OllamaClient();

    // Check health
    const healthy = await client.isHealthy();
    console.log('Ollama Server:', healthy ? '✓ Online' : '✗ Offline');

    if (!healthy) {
      console.log('\n❌ Ollama is not running!');
      console.log('Please start Ollama:');
      console.log('  ollama serve');
      return;
    }

    // List models
    const models = await client.listModels();
    console.log('\nAvailable Models:');
    models.forEach((model) => console.log(`  - ${model}`));

    const hasGraniteCode = models.includes('hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
    console.log('\ngranite-code:8b:', hasGraniteCode ? '✓ Installed' : '✗ Not found');

    if (!hasGraniteCode) {
      console.log('\n❌ Required model not found!');
      console.log('Please download:');
      console.log('  ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
      return;
    }

    console.log('\n✅ All prerequisites met!');
  } catch (error) {
    console.error('Error checking Ollama:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  switch (command) {
    case 'check':
      await checkOllamaStatus();
      break;
    case 'lateinit':
      await exampleLateinitError();
      break;
    case 'npe':
      await exampleNullPointerException();
      break;
    case 'all':
      await checkOllamaStatus();
      console.log('\n' + '='.repeat(50) + '\n');
      await exampleLateinitError();
      console.log('\n' + '='.repeat(50) + '\n');
      await exampleNullPointerException();
      break;
    default:
      console.log('Usage: ts-node examples/basic-usage.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  check     - Check Ollama status (default)');
      console.log('  lateinit  - Run lateinit error example');
      console.log('  npe       - Run NPE error example');
      console.log('  all       - Run all examples');
      break;
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { exampleLateinitError, exampleNullPointerException, checkOllamaStatus };
