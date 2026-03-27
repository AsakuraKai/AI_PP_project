/**
 * Manual test script for RCA Context Injection (Fix 4)
 *
 * Verifies that RCA context is properly injected into fix generation prompts
 */

import { FixGenerator } from '../src/agent/FixGenerator';
import { ParsedError, RootCauseAnalysis } from '../src/types';

// Mock LLM client for testing
class MockLLMClient {
  async generate(prompt: string, options?: any) {
    console.log('\n=== GENERATED PROMPT ===');
    console.log(prompt);
    console.log('=== END PROMPT ===\n');

    // Return mock fixed code
    return {
      text: `fun greet(name: String) {
    println("Hello, \$name")
}`,
      tokensUsed: 50,
      generationTime: 100,
    };
  }
}

// Mock ReadFileTool
class MockReadFileTool {
  async execute(params: any) {
    return `Lines 1-5 of test.kt:
fun greet(name: String) {
    println("Hello, " + name)
}`;
  }
}

// Mock FileResolver
class MockFileResolver {
  async resolve(path: string) {
    return {
      exists: true,
      path: path,
      isAbsolute: false,
    };
  }
}

async function testRCAInjection() {
  console.log('Testing RCA Context Injection...\n');

  // Create mock instances
  const mockLLM = new MockLLMClient() as any;
  const mockReadFile = new MockReadFileTool() as any;
  const mockFileResolver = new MockFileResolver() as any;

  const generator = new FixGenerator(
    mockLLM,
    mockReadFile,
    process.cwd(),
    mockFileResolver
  );

  // Test error
  const error: ParsedError = {
    type: 'string_concatenation',
    message: 'Use string template instead of concatenation',
    filePath: 'src/test.kt',
    line: 2,
    language: 'kotlin',
  };

  // Test RCA with full context
  const rca: RootCauseAnalysis = {
    rcaId: 'test-rca-001',
    errorLogId: 'error-001',
    rootCause: 'String concatenation used instead of Kotlin string template',
    category: 'kotlin-style',
    affectedFiles: [
      {
        filePath: 'src/test.kt',
        lineNumbers: [2],
        reason: 'Contains string concatenation that should use template',
        relevanceScore: 0.95,
      },
    ],
    confidence: 85,
    suggestedFix: {
      type: 'replace',
      pattern: '"Hello, " + name',
      replacement: '"Hello, $name"',
    },
    generatedAt: new Date(),
    modelVersion: 'test-v1',
    refinementCount: 0,
  };

  console.log('Test Case 1: Fix generation WITH RCA context');
  console.log('='.repeat(60));

  const fixWithRCA = await generator.generateFix(
    error,
    'String concatenation used instead of string template',
    'Kotlin best practices recommend using string templates',
    undefined,
    rca
  );

  if (fixWithRCA) {
    console.log('\n✓ Fix generated successfully with RCA context');
    console.log(`  Confidence: ${fixWithRCA.confidence}%`);
    console.log(`  Syntax Valid: ${fixWithRCA.syntaxValid}`);
  } else {
    console.log('\n✗ Failed to generate fix with RCA');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Case 2: Fix generation WITHOUT RCA context');
  console.log('='.repeat(60));

  const fixWithoutRCA = await generator.generateFix(
    error,
    'String concatenation used instead of string template',
    'Kotlin best practices recommend using string templates'
  );

  if (fixWithoutRCA) {
    console.log('\n✓ Fix generated successfully without RCA context');
    console.log(`  Confidence: ${fixWithoutRCA.confidence}%`);
    console.log(`  Syntax Valid: ${fixWithoutRCA.syntaxValid}`);
  } else {
    console.log('\n✗ Failed to generate fix without RCA');
  }

  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION CHECKLIST:');
  console.log('='.repeat(60));
  console.log('[ ] Prompt with RCA includes "ROOT CAUSE ANALYSIS:" section');
  console.log('[ ] RCA section appears AFTER error context');
  console.log('[ ] RCA section appears BEFORE original code');
  console.log('[ ] RCA includes category, confidence, and root cause');
  console.log('[ ] RCA includes affected files with relevance scores');
  console.log('[ ] RCA includes suggested fix details');
  console.log('[ ] Prompt without RCA does NOT include RCA section');
  console.log('[ ] Both prompts generate valid fixes');
  console.log('='.repeat(60));
}

// Run test
testRCAInjection().catch(console.error);
