/**
 * Golden Test Suite - Reference RCA Examples
 * 
 * These are curated examples of error analysis with expected outcomes.
 * Used for regression testing to ensure agent behavior remains consistent.
 * 
 * Each test includes:
 * - Input: Parsed error
 * - Expected output: Root cause analysis
 * - Tolerance: Acceptable variation (LLMs are non-deterministic)
 */

import { ParsedError } from '../../src/types';
import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';

// Skip these tests by default (require Ollama running)
const describeGolden = process.env.RUN_GOLDEN_TESTS ? describe : describe.skip;

/**
 * Golden test cases - curated reference examples
 */
export const goldenTestCases: Array<{
  name: string;
  error: ParsedError;
  expectedRootCause: string[];  // Multiple acceptable root causes
  expectedFixKeywords: string[];  // Keywords that should appear in fix guidelines
  minConfidence: number;
}> = [
  {
    name: 'Kotlin lateinit not initialized',
    error: {
      type: 'lateinit',
      message: 'kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin',
      metadata: { propertyName: 'user' },
    },
    expectedRootCause: [
      'property',
      'initialized',
      'before',
      'accessed',
    ],
    expectedFixKeywords: [
      'initialize',
      'onCreate',
      'constructor',
      'init',
      '::user.isInitialized',
    ],
    minConfidence: 0.7,
  },
  {
    name: 'Kotlin NullPointerException',
    error: {
      type: 'npe',
      message: 'NullPointerException at MainActivity.kt:42',
      filePath: 'MainActivity.kt',
      line: 42,
      language: 'kotlin',
    },
    expectedRootCause: [
      'null',
      'variable',
      'nullable',
    ],
    expectedFixKeywords: [
      'null',
      'check',
      '?.',
      '!!',
      'let',
    ],
    minConfidence: 0.6,
  },
  {
    name: 'Kotlin unresolved reference',
    error: {
      type: 'unresolved_reference',
      message: 'Unresolved reference: getUserData',
      filePath: 'UserRepository.kt',
      line: 23,
      language: 'kotlin',
      metadata: { symbolName: 'getUserData' },
    },
    expectedRootCause: [
      'function',
      'not found',
      'imported',
      'defined',
    ],
    expectedFixKeywords: [
      'import',
      'define',
      'package',
      'spelling',
    ],
    minConfidence: 0.6,
  },
  {
    name: 'Kotlin type mismatch',
    error: {
      type: 'type_mismatch',
      message: 'Type mismatch: inferred type is String but Int was expected',
      filePath: 'Calculator.kt',
      line: 15,
      language: 'kotlin',
      metadata: {
        expected: 'Int',
        actual: 'String',
      },
    },
    expectedRootCause: [
      'type',
      'String',
      'Int',
      'convert',
    ],
    expectedFixKeywords: [
      'toInt',
      'cast',
      'convert',
      'type',
    ],
    minConfidence: 0.7,
  },
  {
    name: 'Gradle dependency conflict',
    error: {
      type: 'gradle_dependency_conflict',
      message: 'Conflict detected for androidx.appcompat:appcompat versions 1.6.0 and 1.5.1',
      filePath: 'build.gradle',
      line: 0,
      language: 'gradle',
      metadata: {
        dependency: 'androidx.appcompat:appcompat',
        versions: ['1.6.0', '1.5.1'],
      },
    },
    expectedRootCause: [
      'conflict',
      'version',
      'dependency',
      'transitive',
    ],
    expectedFixKeywords: [
      'force',
      'resolutionStrategy',
      'exclude',
      'version',
    ],
    minConfidence: 0.7,
  },
  {
    name: 'Jetpack Compose remember error',
    error: {
      type: 'compose_remember',
      message: 'Accessing state without remember() in composable function',
      filePath: 'ProfileScreen.kt',
      line: 28,
      language: 'kotlin',
      framework: 'compose',
    },
    expectedRootCause: [
      'remember',
      'state',
      'recomposition',
      'composable',
    ],
    expectedFixKeywords: [
      'remember',
      'mutableStateOf',
      'rememberSaveable',
    ],
    minConfidence: 0.6,
  },
  {
    name: 'XML InflateException',
    error: {
      type: 'xml_inflation',
      message: 'InflateException: Binary XML file line #12: Error inflating class Button',
      filePath: 'activity_main.xml',
      line: 12,
      language: 'xml',
      framework: 'android',
    },
    expectedRootCause: [
      'xml',
      'layout',
      'inflate',
      'attribute',
    ],
    expectedFixKeywords: [
      'xml',
      'attribute',
      'layout_width',
      'layout_height',
      'namespace',
    ],
    minConfidence: 0.6,
  },
];

describeGolden('Golden Test Suite', () => {
  let agent: MinimalReactAgent;
  let ollamaClient: OllamaClient;

  beforeAll(async () => {
    ollamaClient = new OllamaClient({
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    });
    agent = new MinimalReactAgent(ollamaClient);
  }, 30000);

  // Test each golden case
  goldenTestCases.forEach((testCase, index) => {
    it(`[Golden ${index + 1}] ${testCase.name}`, async () => {
      console.log(`\n🔍 Running golden test: ${testCase.name}`);
      console.log(`   Error: ${testCase.error.message}`);

      const startTime = Date.now();
      const result = await agent.analyze(testCase.error);
      const duration = Date.now() - startTime;

      console.log(`   ✓ Analysis completed in ${duration}ms`);
      console.log(`   Root cause: ${result.rootCause}`);
      console.log(`   Confidence: ${result.confidence}`);
      console.log(`   Iterations: ${result.iterations}`);

      // Validate root cause contains expected keywords
      const rootCauseLower = result.rootCause.toLowerCase();
      const matchedKeywords = testCase.expectedRootCause.filter((keyword) =>
        rootCauseLower.includes(keyword.toLowerCase())
      );

      expect(matchedKeywords.length).toBeGreaterThanOrEqual(
        Math.ceil(testCase.expectedRootCause.length * 0.5)
      );

      // Validate fix guidelines contain expected keywords
      const fixGuidelinesText = result.fixGuidelines.join(' ').toLowerCase();
      const matchedFixKeywords = testCase.expectedFixKeywords.filter((keyword) =>
        fixGuidelinesText.includes(keyword.toLowerCase())
      );

      expect(matchedFixKeywords.length).toBeGreaterThanOrEqual(1);

      // Validate confidence
      expect(result.confidence).toBeGreaterThanOrEqual(testCase.minConfidence);

      // Validate basic structure
      expect(result.rootCause).toBeTruthy();
      expect(result.rootCause.length).toBeGreaterThan(10);
      expect(result.fixGuidelines.length).toBeGreaterThan(0);

      // Performance check (should be reasonable)
      expect(duration).toBeLessThan(120000); // 2 minutes max
    }, 180000); // 3 minute timeout per test
  });

  describe('Golden Suite Summary', () => {
    it('should run all golden tests', async () => {
      console.log(`\n📊 Golden Test Suite Summary`);
      console.log(`   Total test cases: ${goldenTestCases.length}`);
      console.log(`   Coverage:`);
      
      const errorTypes = new Set(goldenTestCases.map((tc) => tc.error.type));
      console.log(`   - Error types: ${errorTypes.size} (${Array.from(errorTypes).join(', ')})`);
      
      const languages = new Set(goldenTestCases.map((tc) => tc.error.language));
      console.log(`   - Languages: ${languages.size} (${Array.from(languages).join(', ')})`);
      
      const frameworks = new Set(
        goldenTestCases
          .filter((tc) => tc.error.framework)
          .map((tc) => tc.error.framework)
      );
      if (frameworks.size > 0) {
        console.log(`   - Frameworks: ${frameworks.size} (${Array.from(frameworks).join(', ')})`);
      }
    });
  });

  describe('Regression Detection', () => {
    it('should maintain consistent accuracy across versions', async () => {
      // This test helps detect regressions in agent behavior
      // Run a subset of golden tests and verify results are consistent
      
      const testSubset = goldenTestCases.slice(0, 3);
      const results: Array<{ passed: boolean; confidence: number }> = [];

      for (const testCase of testSubset) {
        try {
          const result = await agent.analyze(testCase.error);
          
          const rootCauseLower = result.rootCause.toLowerCase();
          const matchedKeywords = testCase.expectedRootCause.filter((keyword) =>
            rootCauseLower.includes(keyword.toLowerCase())
          );
          
          const passed = 
            matchedKeywords.length >= Math.ceil(testCase.expectedRootCause.length * 0.5) &&
            result.confidence >= testCase.minConfidence;
          
          results.push({ passed, confidence: result.confidence });
        } catch (error) {
          results.push({ passed: false, confidence: 0 });
        }
      }

      const passedCount = results.filter((r) => r.passed).length;
      const passRate = passedCount / results.length;
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

      console.log(`\n📈 Regression Check:`);
      console.log(`   Pass rate: ${(passRate * 100).toFixed(1)}% (${passedCount}/${results.length})`);
      console.log(`   Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);

      // Expect at least 66% pass rate for regression check
      expect(passRate).toBeGreaterThanOrEqual(0.66);
      expect(avgConfidence).toBeGreaterThanOrEqual(0.5);
    }, 360000); // 6 minute timeout for regression test
  });
});
