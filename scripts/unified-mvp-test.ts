/**
 * Unified MVP Test Runner
 * 
 * Consolidates all MVP test scripts into one parameterized test runner.
 * Replaces: simple-mvp-test.ts, simple-mvp-test-v2.ts, test-mvp-project.ts
 * 
 * Features:
 * - Configurable output formats (simple, detailed, validation)
 * - Optional ResponseValidator integration for specificity scoring
 * - Parameterized test cases
 * - Consistent reporting
 * - Performance benchmarking
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { GradleParser } from '../src/utils/parsers/GradleParser';
import { ResponseValidator } from '../src/agent/ResponseValidator';
import { ParsedError } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration Types
// ============================================================================

interface TestConfig {
  /** Output format */
  format: 'simple' | 'detailed' | 'validation';
  /** Enable ResponseValidator specificity scoring */
  validateSpecificity: boolean;
  /** Save results to file */
  saveReport: boolean;
  /** Report output directory */
  reportDir: string;
  /** Performance target (seconds) */
  performanceTarget: number;
  /** Confidence target (0-1) */
  confidenceTarget: number;
  /** Model configuration */
  model: {
    baseUrl: string;
    name: string;
    timeout: number;
  };
}

interface TestCase {
  name: string;
  description: string;
  error: ParsedError;
  expectedKeywords: string[];
  mvpBaseline?: {
    specificity: number;
    usability: number;
  };
}

interface TestResult {
  testCase: string;
  duration: number;
  success: boolean;
  iterations: number;
  confidence: number;
  rootCause: string;
  fixGuidelines: string[];
  toolsUsed?: string[];
  keywordsFound: string[];
  accuracy: boolean;
  specificityScore?: number;
  specificityLevel?: string;
  validationResult?: any;
  error?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: TestConfig = {
  format: 'detailed',
  validateSpecificity: false,
  saveReport: true,
  reportDir: path.join(__dirname, '..', 'docs', 'TEST_RESULTS'),
  performanceTarget: 90,
  confidenceTarget: 0.7,
  model: {
    baseUrl: 'http://localhost:11434',
    name: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    timeout: 120000,
  },
};

// ============================================================================
// Unified MVP Test Runner
// ============================================================================

class UnifiedMVPTestRunner {
  private config: TestConfig;
  private parser: GradleParser;
  private ollamaClient: OllamaClient;
  private agent: MinimalReactAgent;
  private validator?: ResponseValidator;
  private results: TestResult[] = [];

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.parser = new GradleParser();
    this.ollamaClient = new OllamaClient({
      baseUrl: this.config.model.baseUrl,
      model: this.config.model.name,
      timeout: this.config.model.timeout,
    });
    this.agent = new MinimalReactAgent(this.ollamaClient);
    
    if (this.config.validateSpecificity) {
      this.validator = new ResponseValidator();
    }
  }

  /**
   * Get standard MVP test case (AGP 8.10.0 error)
   */
  static getStandardMVPCase(): TestCase {
    const gradleError = `
FAILURE: Build failed with an exception.

* What went wrong:
Could not resolve all files for configuration ':classpath'.
> Could not find com.android.tools.build:gradle:8.10.0.
  Searched in the following locations:
    - https://dl.google.com/dl/android/maven2/com/android/tools/build/gradle/8.10.0/gradle-8.10.0.pom
  Required by:
      project : > com.android.application:com.android.application.gradle.plugin:8.10.0

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.

BUILD FAILED in 937ms
`;

    return {
      name: 'MVP Standard: Invalid AGP Version',
      description: 'Tests AGP version 8.10.0 (non-existent) in gradle/libs.versions.toml',
      error: {
        type: 'gradle_dependency_not_found',
        message: 'Could not find com.android.tools.build:gradle:8.10.0',
        filePath: 'gradle/libs.versions.toml',
        line: 5,
        language: 'gradle',
        stackTrace: [
          { file: 'build.gradle', line: 1, function: 'buildscript' },
        ],
        metadata: {
          dependency: 'com.android.tools.build:gradle',
          requestedVersion: '8.10.0',
          errorDetails: [gradleError],
        },
      },
      expectedKeywords: ['8.10.0', 'version', 'AGP', 'gradle', 'plugin'],
      mvpBaseline: {
        specificity: 17,
        usability: 40,
      },
    };
  }

  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    this.printTestHeader(testCase);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Parse
      this.log('⚙️  Step 1: Parsing error...');
      const parsed = testCase.error.metadata?.errorDetails
        ? this.parser.parse(testCase.error.metadata.errorDetails[0])
        : testCase.error;
      
      if (!parsed) {
        throw new Error('Failed to parse error');
      }
      
      this.log('✅ Parsed successfully');
      this.log(`   Type: ${parsed.type}`);
      this.log(`   Message: ${parsed.message.substring(0, 80)}...\n`);
      
      // Step 2: Analyze
      this.log('⚙️  Step 2: Analyzing with RCA Agent...');
      this.log(`   Model: ${this.config.model.name.split('/').pop()}`);
      this.log(`   Max Iterations: 3`);
      this.log(`   Timeout: ${this.config.model.timeout / 1000}s\n`);
      
      const result = await this.agent.analyze(parsed);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      // Step 3: Validate keywords
      const analysisText = `${result.rootCause} ${result.fixGuidelines.join(' ')}`.toLowerCase();
      const keywordsFound = testCase.expectedKeywords.filter(kw =>
        analysisText.includes(kw.toLowerCase())
      );
      const accuracy = keywordsFound.length >= testCase.expectedKeywords.length * 0.6 &&
                      result.confidence >= this.config.confidenceTarget;
      
      // Step 4: Optional specificity validation
      let validationResult: any = undefined;
      let specificityScore: number | undefined;
      let specificityLevel: string | undefined;
      
      if (this.validator) {
        validationResult = this.validator.validateResponse({
          thought: 'Analysis complete',
          action: null,
          rootCause: result.rootCause,
          fixGuidelines: result.fixGuidelines,
          confidence: result.confidence,
        });
        specificityScore = validationResult.specificityScore;
        specificityLevel = this.validator.getSpecificityLevel(specificityScore ?? 0);
      }
      
      const testResult: TestResult = {
        testCase: testCase.name,
        duration,
        success: true,
        iterations: result.iterations || 0,
        confidence: result.confidence,
        rootCause: result.rootCause,
        fixGuidelines: result.fixGuidelines,
        toolsUsed: result.toolsUsed,
        keywordsFound,
        accuracy,
        specificityScore,
        specificityLevel,
        validationResult,
      };
      
      this.results.push(testResult);
      this.printTestResults(testResult, testCase);
      
      return testResult;
      
    } catch (error: any) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      const testResult: TestResult = {
        testCase: testCase.name,
        duration,
        success: false,
        iterations: 0,
        confidence: 0,
        rootCause: '',
        fixGuidelines: [],
        keywordsFound: [],
        accuracy: false,
        error: error.message,
      };
      
      this.results.push(testResult);
      this.printTestError(testResult, error);
      
      return testResult;
    }
  }

  /**
   * Print test header
   */
  private printTestHeader(testCase: TestCase): void {
    if (this.config.format === 'simple') {
      console.log(`\n🧪 ${testCase.name}`);
      console.log(`📋 ${testCase.description}`);
    } else {
      console.log('='.repeat(80));
      console.log(`🧪 ${testCase.name.toUpperCase()}`);
      console.log('='.repeat(80));
      console.log(`\n📋 ${testCase.description}`);
      console.log(`📁 Location: ${testCase.error.filePath}`);
      console.log(`❌ Issue: ${testCase.error.message}\n`);
    }
  }

  /**
   * Print test results
   */
  private printTestResults(result: TestResult, testCase: TestCase): void {
    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    
    // Performance metrics
    console.log(`\n⏱️  Duration: ${result.duration.toFixed(2)}s`);
    console.log(`🔄 Iterations: ${result.iterations}`);
    console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    
    // Root cause and fixes
    if (this.config.format !== 'simple') {
      console.log(`\n📝 Root Cause:`);
      console.log('-'.repeat(80));
      console.log(result.rootCause);
      
      console.log(`\n💡 Fix Guidelines:`);
      console.log('-'.repeat(80));
      result.fixGuidelines.forEach((fix, idx) => {
        console.log(`${idx + 1}. ${fix}`);
      });
    }
    
    // Verification
    console.log(`\n🎯 Verification:`);
    console.log(`   Keywords: ${result.keywordsFound.length}/${testCase.expectedKeywords.length} (${result.keywordsFound.join(', ')})`);
    console.log(`   Accuracy: ${result.accuracy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Performance: ${result.duration < this.config.performanceTarget ? '✅' : '⚠️'} (${result.duration.toFixed(2)}s vs ${this.config.performanceTarget}s target)`);
    console.log(`   Confidence: ${result.confidence >= this.config.confidenceTarget ? '✅' : '⚠️'} (${(result.confidence * 100).toFixed(0)}% vs ${(this.config.confidenceTarget * 100).toFixed(0)}% target)`);
    
    // Specificity validation
    if (result.specificityScore !== undefined && testCase.mvpBaseline) {
      console.log(`\n📊 Specificity Analysis:`);
      console.log(`   Score: ${result.specificityScore}/100 (${result.specificityLevel})`);
      console.log(`   Baseline: ${testCase.mvpBaseline.specificity}%`);
      console.log(`   Improvement: +${result.specificityScore - testCase.mvpBaseline.specificity} points`);
      console.log(`   Target: 70%+ ${result.specificityScore >= 70 ? '✅ MET' : '⚠️ IN PROGRESS'}`);
      
      if (result.validationResult && this.config.format === 'detailed') {
        console.log(`\n   Breakdown:`);
        console.log(`   - Exact File Path: ${result.validationResult.breakdown.hasExactFilePath ? '✅' : '❌'}`);
        console.log(`   - Version Validation: ${result.validationResult.breakdown.hasVersionValidation ? '✅' : '❌'}`);
        console.log(`   - Code Example: ${result.validationResult.breakdown.hasCodeExample ? '✅' : '❌'}`);
        console.log(`   - Actual Names: ${result.validationResult.breakdown.hasActualNames ? '✅' : '❌'}`);
      }
    }
  }

  /**
   * Print test error
   */
  private printTestError(result: TestResult, error: Error): void {
    console.log('\n' + '='.repeat(80));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(80));
    console.log(`\n⏱️  Duration: ${result.duration.toFixed(2)}s`);
    console.log(`📛 Error: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.log('\n💡 TIP: Make sure Ollama is running:');
      console.log('   ollama serve');
    }
  }

  /**
   * Save report to file
   */
  saveReport(testCase: TestCase, result: TestResult): void {
    if (!this.config.saveReport) return;
    
    const reportDir = this.config.reportDir;
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const report = `# MVP Test Report: ${testCase.name}

**Generated:** ${timestamp}  
**Duration:** ${result.duration.toFixed(2)}s  
**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}

---

## Test Case

**Description:** ${testCase.description}  
**File:** \`${testCase.error.filePath}\`  
**Error Type:** ${testCase.error.type}  
**Issue:** ${testCase.error.message}

---

## Results

### Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Duration | ${result.duration.toFixed(2)}s | ${result.duration < this.config.performanceTarget ? '✅' : '⚠️'} |
| Iterations | ${result.iterations} | ${result.iterations <= 3 ? '✅' : '⚠️'} |
| Confidence | ${(result.confidence * 100).toFixed(0)}% | ${result.confidence >= this.config.confidenceTarget ? '✅' : '⚠️'} |
| Accuracy | ${result.accuracy ? 'PASS' : 'FAIL'} | ${result.accuracy ? '✅' : '❌'} |

### Root Cause

\`\`\`
${result.rootCause}
\`\`\`

### Fix Guidelines

${result.fixGuidelines.map((fix, idx) => `${idx + 1}. ${fix}`).join('\n')}

### Verification

- **Keywords Found:** ${result.keywordsFound.length}/${testCase.expectedKeywords.length} (${result.keywordsFound.join(', ')})
- **Verdict:** ${result.accuracy ? '✅ PASS' : '❌ FAIL'}

${result.specificityScore !== undefined && testCase.mvpBaseline ? `
### Specificity Analysis

- **Score:** ${result.specificityScore}/100 (${result.specificityLevel})
- **Baseline:** ${testCase.mvpBaseline.specificity}%
- **Improvement:** +${result.specificityScore - testCase.mvpBaseline.specificity} points
- **Target:** 70%+ ${result.specificityScore >= 70 ? '✅ MET' : '⚠️ IN PROGRESS'}

**Breakdown:**
- Exact File Path: ${result.validationResult?.breakdown.hasExactFilePath ? '✅' : '❌'}
- Version Validation: ${result.validationResult?.breakdown.hasVersionValidation ? '✅' : '❌'}
- Code Example: ${result.validationResult?.breakdown.hasCodeExample ? '✅' : '❌'}
- Actual Names: ${result.validationResult?.breakdown.hasActualNames ? '✅' : '❌'}
- Verification Steps: ${result.validationResult?.breakdown.hasVerificationSteps ? '✅' : '❌'}
` : ''}

---

## Verdict

**Overall:** ${result.success && result.accuracy ? '✅ EXCELLENT' : result.success ? '⚠️ GOOD' : '❌ FAILED'}

${result.success && result.accuracy ? 
  'The RCA Agent successfully analyzed the error with high accuracy and confidence.' :
  result.success ? 
    'The analysis completed but has areas for improvement.' :
    'The test failed. Check error logs for details.'}

---

**Test Completed:** ${timestamp}
`;
    
    const filename = `mvp-test-${testCase.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const filepath = path.join(reportDir, filename);
    fs.writeFileSync(filepath, report);
    
    console.log(`\n💾 Report saved: ${filename}`);
  }

  /**
   * Log with format-aware output
   */
  private log(message: string): void {
    if (this.config.format !== 'simple') {
      console.log(message);
    }
  }

  /**
   * Get test summary
   */
  getSummary(): string {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success && r.accuracy).length;
    const failed = total - passed;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    const avgConfidence = this.results.reduce((sum, r) => sum + r.confidence, 0) / total;
    
    return `
═══════════════════════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════════════════════
Total Tests:      ${total}
Passed:           ${passed} ✅
Failed:           ${failed} ${failed > 0 ? '❌' : ''}
Avg Duration:     ${avgDuration.toFixed(2)}s
Avg Confidence:   ${(avgConfidence * 100).toFixed(0)}%
═══════════════════════════════════════════════════════════
`;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  // Parse command line args
  const args = process.argv.slice(2);
  const format = args.includes('--simple') ? 'simple' : 
                 args.includes('--validation') ? 'validation' : 'detailed';
  const validateSpecificity = args.includes('--validation') || args.includes('--specificity');
  const noSave = args.includes('--no-save');
  
  // Create runner
  const runner = new UnifiedMVPTestRunner({
    format,
    validateSpecificity,
    saveReport: !noSave,
  });
  
  // Get standard MVP test case
  const testCase = UnifiedMVPTestRunner.getStandardMVPCase();
  
  // Run test
  console.log('\n🚀 Running Unified MVP Test...\n');
  const result = await runner.runTest(testCase);
  
  // Save report
  if (!noSave) {
    runner.saveReport(testCase, result);
  }
  
  // Print summary
  console.log(runner.getSummary());
  
  // Exit with appropriate code
  process.exit(result.success && result.accuracy ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

export { UnifiedMVPTestRunner, TestConfig, TestCase, TestResult };
