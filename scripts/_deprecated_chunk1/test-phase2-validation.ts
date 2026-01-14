/**
 * Phase 2 Validation Test Script
 * 
 * Tests multi-pass reasoning, semantic search, and advanced tools
 * to validate +15-25% usability improvement target.
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { MultiPassAgent } from '../src/agent/MultiPassAgent';
import { SemanticExampleService } from '../src/knowledge/SemanticExampleService';
import { ParsedError } from '../src/types';

async function runPhase2Tests() {
  console.log('[LAUNCH] Phase 2 Validation Tests\n');
  console.log('=' .repeat(60));

  // Test 1: Multi-Pass Reasoning
  console.log('\n[LIST] TEST 1: Multi-Pass Reasoning\n');
  await testMultiPassReasoning();

  // Test 2: Semantic Example Search
  console.log('\n[LIST] TEST 2: Semantic Example Search\n');
  await testSemanticSearch();

  // Test 3: Full Phase 2 Integration
  console.log('\n[LIST] TEST 3: Full Phase 2 Integration\n');
  await testFullIntegration();

  console.log('\n' + '='.repeat(60));
  console.log('[OK] Phase 2 Validation Complete\n');
}

/**
 * Test multi-pass hypothesis generation and validation
 */
async function testMultiPassReasoning() {
  const llm = new OllamaClient({
    baseUrl: 'http://localhost:11434',
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest'
  });
  const agent = new MultiPassAgent(llm, {
    numHypotheses: 3,
    maxIterations: 3,
  });

  const testError: ParsedError = {
    type: 'build',
    message: 'Could not find com.android.tools.build:gradle:8.10.0',
    filePath: 'build.gradle',
    line: 10,
    language: 'gradle',
  };

  console.log('Error:', testError.message);
  console.log('\nGenerating hypotheses...');

  const startTime = Date.now();
  const result = await agent.analyze(testError);
  const duration = Date.now() - startTime;

  console.log('\n✓ Analysis complete');
  console.log(`[TIME]  Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`\nRoot Cause:\n${result.rootCause}`);
  console.log(`\nConfidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`\nFix Guidelines:`);
  result.fixGuidelines.forEach((guide, i) => {
    console.log(`${i + 1}. ${guide}`);
  });
}

/**
 * Test semantic example search
 */
async function testSemanticSearch() {
  const service = new SemanticExampleService({
    chromaUrl: 'http://localhost:8000',
    minSimilarity: 0.6,
    maxExamples: 5,
  });

  console.log('Initializing SemanticExampleService...');
  await service.initialize();

  if (!service.isAvailable()) {
    console.log('[WARN]  ChromaDB not available. Skipping semantic search test.');
    console.log('   Start ChromaDB: docker run -p 8000:8000 chromadb/chroma');
    return;
  }

  const testError: ParsedError = {
    type: 'lateinit',
    message: 'lateinit property viewModel has not been initialized',
    filePath: 'MainActivity.kt',
    line: 42,
    language: 'kotlin',
  };

  console.log('Error:', testError.message);
  console.log('\nSearching for similar examples...');

  const startTime = Date.now();
  const results = await service.findSimilarExamples(testError);
  const duration = Date.now() - startTime;

  console.log(`\n✓ Found ${results.length} similar examples`);
  console.log(`[TIME]  Search time: ${duration}ms`);

  results.forEach((result, i) => {
    console.log(`\n${i + 1}. Similarity: ${(result.similarity * 100).toFixed(0)}%`);
    console.log(`   Reason: ${result.reason}`);
    const errorMsg = result.example.error || result.example.errorMessage || 'Unknown error';
    console.log(`   Error: ${errorMsg.substring(0, 60)}...`);
  });
}

/**
 * Test full Phase 2 integration
 */
async function testFullIntegration() {
  console.log('Testing full Phase 2 stack integration...');

  const llm = new OllamaClient({
    baseUrl: 'http://localhost:11434',
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest'
  });
  const agent = new MultiPassAgent(llm, {
    numHypotheses: 3,
    enableConsensus: true,
    maxIterations: 5,
  });

  const testError: ParsedError = {
    type: 'npe',
    message: 'Attempt to invoke virtual method on a null object reference',
    filePath: 'UserRepository.kt',
    line: 78,
    language: 'kotlin',
  };

  console.log('Error:', testError.message);
  console.log('\nRunning full Phase 2 analysis...');

  const startTime = Date.now();
  const result = await agent.analyze(testError);
  const duration = Date.now() - startTime;

  console.log('\n✓ Full analysis complete');
  console.log(`[TIME]  Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`\nRoot Cause:\n${result.rootCause}`);
  console.log(`\nConfidence: ${(result.confidence * 100).toFixed(0)}%`);
  
  if (result.toolsUsed && result.toolsUsed.length > 0) {
    console.log(`\nTools Used: ${result.toolsUsed.join(', ')}`);
  }

  console.log(`\nFix Guidelines:`);
  result.fixGuidelines.forEach((guide, i) => {
    console.log(`${i + 1}. ${guide}`);
  });
}

// Run tests
runPhase2Tests().catch(error => {
  console.error('[X] Test failed:', error);
  process.exit(1);
});
