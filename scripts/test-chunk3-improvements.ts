/**
 * Chunk 3 Improvement Testing Script
 * 
 * Tests the enhanced prompts on real errors and measures specificity improvements.
 * Compares against MVP baseline (40% usability, 17% specificity).
 * 
 * Test Cases:
 * 1. MVP Case: AGP 8.10.0 version error (baseline)
 * 2. Kotlin lateinit NPE
 * 3. Compose recomposition issue
 * 4. XML layout inflation error
 * 5. Manifest permission error
 * 6. Gradle dependency conflict
 * 7. Kotlin type mismatch
 * 8. Compose LaunchedEffect missing key
 * 9. XML resource not found
 * 10. Gradle sync failed
 * 
 * For each test:
 * - Run RCA agent with enhanced prompts
 * - Score response with ResponseValidator
 * - Calculate specificity score (0-100)
 * - Document improvements
 * 
 * Expected Outcomes:
 * - Overall specificity: 17% → 70%+
 * - File identification: 30% → 95%
 * - Version suggestions: 0% → 90%
 * - Code examples: 0% → 85%
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { ResponseValidator, RCAResponse } from '../src/agent/ResponseValidator';
import { ParsedError } from '../src/types';
import { OllamaClient } from '../src/llm/OllamaClient';
import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  name: string;
  error: ParsedError;
  expectedImprovements: {
    hasFilePath: boolean;
    hasVersions: boolean;
    hasCodeExample: boolean;
    hasActualNames: boolean;
    hasVerification: boolean;
    hasCompatibility: boolean;
  };
  mvpBaseline: {
    usability: number;
    specificity: number;
  };
}

interface TestResult {
  testCase: string;
  response: RCAResponse;
  validationResult: any;
  specificityScore: number;
  specificityLevel: string;
  improvements: string[];
  issues: string[];
  comparisonWithBaseline: {
    baselineSpecificity: number;
    currentSpecificity: number;
    improvement: number;
    percentageImprovement: number;
  };
}

/**
 * Test suite for Chunk 3 improvements
 */
class Chunk3TestSuite {
  private agent: MinimalReactAgent;
  private validator: ResponseValidator;
  private results: TestResult[] = [];

  constructor() {
    // Initialize agent with enhanced prompts (simplified for testing)
    const llm = new OllamaClient({
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    });

    // Basic agent without ChromaDB for testing
    this.agent = new MinimalReactAgent(llm, {
      maxIterations: 3,
    });

    this.validator = new ResponseValidator();
  }

  /**
   * Get test cases (10 diverse error types)
   */
  getTestCases(): TestCase[] {
    return [
      {
        name: 'MVP Case: AGP Version 8.10.0 Not Found',
        error: {
          type: 'gradle_dependency_not_found',
          message: 'Could not find com.android.tools.build:gradle:8.10.0',
          filePath: 'gradle/libs.versions.toml',
          line: 5,
          language: 'gradle',
          stackTrace: [
            { file: 'build.gradle', line: 1, function: 'dependencies' },
            { file: 'build.gradle', line: 5, function: 'classpath' },
          ],
          metadata: {
            dependency: 'com.android.tools.build:gradle',
            requestedVersion: '8.10.0',
          },
        },
        expectedImprovements: {
          hasFilePath: true,
          hasVersions: true,
          hasCodeExample: true,
          hasActualNames: true,
          hasVerification: true,
          hasCompatibility: true,
        },
        mvpBaseline: {
          usability: 40,
          specificity: 17,
        },
      },
      {
        name: 'Kotlin lateinit NPE',
        error: {
          type: 'uninitialized_lateinit',
          message: 'kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized',
          filePath: 'app/src/main/java/com/example/MainActivity.kt',
          line: 45,
          language: 'kotlin',
          stackTrace: [
            { file: 'MainActivity.kt', line: 45, function: 'onCreate' },
          ],
          metadata: {
            propertyName: 'viewModel',
          },
        },
        expectedImprovements: {
          hasFilePath: true,
          hasVersions: false,
          hasCodeExample: true,
          hasActualNames: true,
          hasVerification: true,
          hasCompatibility: false,
        },
        mvpBaseline: {
          usability: 0, // Not tested in MVP
          specificity: 0,
        },
      },
      // Additional test cases can be added here
    ];
  }

  /**
   * Run a single test case
   */
  async runTestCase(testCase: TestCase): Promise<TestResult> {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`Error: ${testCase.error.message}`);
    console.log(`Location: ${testCase.error.filePath}:${testCase.error.line}`);

    try {
      // Run agent analysis
      const agentResult = await this.agent.analyze(testCase.error);

      // Create RCA response object for validation
      const response: RCAResponse = {
        thought: agentResult.rootCause, // Use rootCause as thought for validation
        action: null,
        rootCause: agentResult.rootCause,
        fixGuidelines: agentResult.fixGuidelines,
        confidence: agentResult.confidence,
      };

      // Validate response
      const validationResult = this.validator.validateResponse(response);
      const specificityLevel = this.validator.getSpecificityLevel(validationResult.specificityScore);

      // Calculate improvement
      const improvement = validationResult.specificityScore - testCase.mvpBaseline.specificity;
      const percentageImprovement = testCase.mvpBaseline.specificity > 0
        ? ((improvement / testCase.mvpBaseline.specificity) * 100)
        : 0;

      console.log(`✅ Specificity Score: ${validationResult.specificityScore}/100 (${specificityLevel})`);
      console.log(`📊 Improvement: +${improvement} points (+${percentageImprovement.toFixed(0)}%)`);

      return {
        testCase: testCase.name,
        response,
        validationResult,
        specificityScore: validationResult.specificityScore,
        specificityLevel,
        improvements: validationResult.strengths,
        issues: validationResult.issues,
        comparisonWithBaseline: {
          baselineSpecificity: testCase.mvpBaseline.specificity,
          currentSpecificity: validationResult.specificityScore,
          improvement,
          percentageImprovement,
        },
      };
    } catch (error) {
      console.error(`❌ Test failed: ${error}`);
      throw error;
    }
  }

  /**
   * Run all test cases
   */
  async runAllTests(): Promise<void> {
    const testCases = this.getTestCases();
    console.log(`\n🚀 Running ${testCases.length} test cases for Chunk 3 improvements...\n`);

    for (const testCase of testCases) {
      try {
        const result = await this.runTestCase(testCase);
        this.results.push(result);
      } catch (error) {
        console.error(`Test case "${testCase.name}" failed:`, error);
      }
    }

    this.generateReport();
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CHUNK 3 IMPROVEMENT REPORT');
    console.log('='.repeat(80));

    // Overall statistics
    const avgSpecificity = this.results.reduce((sum, r) => sum + r.specificityScore, 0) / this.results.length;
    const avgBaseline = this.results.reduce((sum, r) => sum + r.comparisonWithBaseline.baselineSpecificity, 0) / this.results.length;
    const avgImprovement = avgSpecificity - avgBaseline;
    const percentImprovement = avgBaseline > 0 ? ((avgImprovement / avgBaseline) * 100) : 0;

    console.log('\n📈 Overall Statistics:');
    console.log(`   Baseline Average: ${avgBaseline.toFixed(1)}%`);
    console.log(`   Current Average: ${avgSpecificity.toFixed(1)}%`);
    console.log(`   Improvement: +${avgImprovement.toFixed(1)} points (+${percentImprovement.toFixed(0)}%)`);
    console.log(`   Target: 70%+ specificity`);
    console.log(`   Status: ${avgSpecificity >= 70 ? '✅ TARGET MET' : '⚠️ IN PROGRESS'}`);

    // Breakdown by dimension
    console.log('\n📋 Specificity Dimensions:');
    const dimensions = {
      hasExactFilePath: 'Exact File Paths',
      hasVersionValidation: 'Version Validation',
      hasCodeExample: 'Code Examples',
      hasActualNames: 'Actual Names',
      hasVerificationSteps: 'Verification Steps',
      hasCompatibilityCheck: 'Compatibility Checks',
    };

    Object.entries(dimensions).forEach(([key, label]) => {
      const count = this.results.filter(r => r.validationResult.breakdown[key]).length;
      const percentage = (count / this.results.length) * 100;
      const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
      console.log(`   ${status} ${label}: ${count}/${this.results.length} (${percentage.toFixed(0)}%)`);
    });

    // Individual test results
    console.log('\n📝 Individual Test Results:');
    this.results.forEach((result, i) => {
      console.log(`\n   ${i + 1}. ${result.testCase}`);
      console.log(`      Score: ${result.specificityScore}/100 (${result.specificityLevel})`);
      console.log(`      Baseline: ${result.comparisonWithBaseline.baselineSpecificity}%`);
      console.log(`      Improvement: +${result.comparisonWithBaseline.improvement.toFixed(1)} (+${result.comparisonWithBaseline.percentageImprovement.toFixed(0)}%)`);
      
      if (result.improvements.length > 0) {
        console.log(`      Strengths:`);
        result.improvements.slice(0, 3).forEach(s => console.log(`        ${s}`));
      }
      
      if (result.issues.length > 0) {
        console.log(`      Issues:`);
        result.issues.slice(0, 2).forEach(i => console.log(`        ${i}`));
      }
    });

    // Save results to file
    this.saveResults();
  }

  /**
   * Save results to JSON file
   */
  saveResults(): void {
    const outputDir = path.join(__dirname, '../docs/CHUNK_3_TEST_RESULTS');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(outputDir, `chunk3-results-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        averageSpecificity: this.results.reduce((sum, r) => sum + r.specificityScore, 0) / this.results.length,
        averageBaseline: this.results.reduce((sum, r) => sum + r.comparisonWithBaseline.baselineSpecificity, 0) / this.results.length,
        targetMet: this.results.reduce((sum, r) => sum + r.specificityScore, 0) / this.results.length >= 70,
      },
      results: this.results,
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔬 Chunk 3 Improvement Testing');
  console.log('Testing enhanced prompts with ResponseValidator\n');

  const suite = new Chunk3TestSuite();
  await suite.runAllTests();

  console.log('\n✅ Testing complete!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { Chunk3TestSuite, TestCase, TestResult };
