/**
 * Phase 4 Testing Framework - Comprehensive Test Suite
 * 
 * Provides automated testing infrastructure for validating RCA Agent
 * improvements across 10 diverse Android error types.
 * 
 * Features:
 * - Automated test execution
 * - Metrics calculation
 * - Results comparison
 * - Progress tracking
 * - Detailed reporting
 * 
 * @phase Phase 4: Real-World Testing
 * @week Week 1-2: Testing Infrastructure
 */

import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { ParsedError } from '../../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TestCase {
  id: number;
  name: string;
  description: string;
  errorType: string;
  complexity: 'simple' | 'medium' | 'complex';
  baselineUsability?: number;
  targetUsability: number;
  error: ParsedError;
  expectedFix?: {
    file: string;
    lineNumber?: number;
    codeChange?: string;
    explanation?: string;
  };
}

export interface TestMetrics {
  // Core metrics
  diagnosis_accuracy: number;        // Did agent identify the problem correctly? (0-100%)
  solution_specificity: number;      // How specific is the solution? (0-100%)
  file_identification: number;       // Identified exact file? (0-100%)
  code_examples: number;             // Provided code examples/diffs? (0-100%)
  version_suggestions: number;       // Suggested specific versions? (0-100%)
  overall_usability: number;         // Overall usefulness (0-100%)
  
  // Performance metrics
  confidence: number;                // Agent's confidence (0-100%)
  latency_ms: number;               // Response time in ms
  
  // Quality indicators
  has_root_cause: boolean;
  has_fix_guidelines: boolean;
  has_code_diff: boolean;
  has_specific_version: boolean;
  identified_exact_file: boolean;
}

export interface TestResult {
  testCase: TestCase;
  timestamp: string;
  duration_ms: number;
  agent_response: any;
  metrics: TestMetrics;
  passed: boolean;
  notes?: string;
  improvement_over_baseline?: number;
}

export interface TestSuiteReport {
  timestamp: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  average_usability: number;
  average_latency_ms: number;
  test_results: TestResult[];
  summary: {
    by_error_type: Map<string, { passed: number; total: number; avg_usability: number }>;
    by_complexity: Map<string, { passed: number; total: number; avg_usability: number }>;
    improvements: {
      test_id: number;
      name: string;
      baseline: number;
      current: number;
      improvement: number;
    }[];
  };
}

// ============================================================================
// Test Suite Definition
// ============================================================================

export class Phase4TestSuite {
  private agent: MinimalReactAgent;
  private resultsDir: string;
  private testFixturesRoot: string;
  
  // Map test IDs to actual fixture folder names
  private fixtureNameMap: Record<number, string> = {
    1: 'mvp-test-project',  // AGP test uses MVP project
    2: 'test-2-lateinit-npe',
    3: 'test3-compose-breakage',
    4: 'test-4-xml-inflation',
    5: 'test5-multi-module',
    6: 'test6-manifest-permission',
    7: 'test7-gradle-network',
    8: 'test8-build-cache',
    9: 'test9-proguard',
    10: 'test10-navigation'
  };
  
  constructor(agent: MinimalReactAgent) {
    this.agent = agent;
    this.resultsDir = path.join(__dirname, '../tests/results/phase4');
    this.testFixturesRoot = path.join(__dirname, '../fixtures');
  }
  
  /**
   * Get all 10 test cases
   */
  getAllTestCases(): TestCase[] {
    return [
      this.getTest1_AGPVersion(),
      this.getTest2_KotlinLateInit(),
      this.getTest3_ComposeAPIBreakage(),
      this.getTest4_XMLLayoutInflation(),
      this.getTest5_MultiModuleDependency(),
      this.getTest6_ManifestPermission(),
      this.getTest7_GradleNetwork(),
      this.getTest8_BuildCache(),
      this.getTest9_ProGuardRule(),
      this.getTest10_NavigationArgument()
    ];
  }
  
  /**
   * Test 1: AGP Version Conflict (Baseline test)
   */
  private getTest1_AGPVersion(): TestCase {
    return {
      id: 1,
      name: 'AGP Version Conflict',
      description: 'Invalid AGP version 8.10.0 doesn\'t exist in Maven Central',
      errorType: 'gradle-dependency',
      complexity: 'simple',
      baselineUsability: 40,
      targetUsability: 80,
      error: {
        type: 'gradle-dependency',
        message: 'Could not find com.android.tools.build:gradle:8.10.0',
        filePath: 'gradle/libs.versions.toml',
        line: 2,
        column: 1,
        language: 'gradle',
        metadata: {
          severity: 'error',
          context: 'AGP version 8.10.0 not found in Maven Central',
          raw: 'Could not find com.android.tools.build:gradle:8.10.0'
        }
      },
      expectedFix: {
        file: 'gradle/libs.versions.toml',
        lineNumber: 2,
        codeChange: 'agp = "8.7.3"',
        explanation: 'AGP 8.10.0 doesn\'t exist. Use 8.7.3 (latest stable)'
      }
    };
  }
  
  /**
   * Test 2: Kotlin lateinit NPE
   */
  private getTest2_KotlinLateInit(): TestCase {
    return {
      id: 2,
      name: 'Kotlin lateinit NPE',
      description: 'lateinit property accessed before initialization',
      errorType: 'kotlin-npe',
      complexity: 'medium',
      targetUsability: 75,
      error: {
        type: 'kotlin-npe',
        message: 'lateinit property viewModel has not been initialized',
        filePath: 'app/src/main/kotlin/MainActivity.kt',
        line: 42,
        column: 9,
        language: 'kotlin',
        metadata: {
          severity: 'error',
          context: 'Accessing viewModel before onCreate() completes'
        }
      },
      expectedFix: {
        file: 'app/src/main/kotlin/MainActivity.kt',
        lineNumber: 35,
        explanation: 'Initialize viewModel in onCreate() before first use'
      }
    };
  }
  
  /**
   * Test 3: Jetpack Compose API Breakage
   */
  private getTest3_ComposeAPIBreakage(): TestCase {
    return {
      id: 3,
      name: 'Compose API Breakage',
      description: 'Deprecated Compose API after upgrade 1.5 → 1.6',
      errorType: 'compose-deprecation',
      complexity: 'medium',
      targetUsability: 75,
      error: {
        type: 'compose-deprecation',
        message: 'Unresolved reference: MaterialTheme. Use androidx.compose.material3.MaterialTheme',
        filePath: 'app/src/main/kotlin/ui/HomeScreen.kt',
        line: 88,
        column: 5,
        language: 'kotlin',
        metadata: {
          severity: 'error',
          context: 'Compose Material upgraded to Material3'
        }
      },
      expectedFix: {
        file: 'app/src/main/kotlin/ui/HomeScreen.kt',
        lineNumber: 88,
        codeChange: 'import androidx.compose.material3.MaterialTheme',
        explanation: 'Material2 deprecated, use Material3'
      }
    };
  }
  
  /**
   * Test 4: XML Layout Inflation Error
   */
  private getTest4_XMLLayoutInflation(): TestCase {
    return {
      id: 4,
      name: 'XML Layout Inflation',
      description: 'Runtime inflation error due to unknown attribute',
      errorType: 'xml-layout',
      complexity: 'medium',
      targetUsability: 70,
      error: {
        type: 'xml-layout',
        message: 'Binary XML file line #12: Error inflating class android.widget.TextView',
        filePath: 'app/src/main/res/layout/activity_main.xml',
        line: 12,
        column: 5,
        language: 'xml',
        metadata: {
          severity: 'error',
          context: 'Unknown attribute android:textFontWeight'
        }
      },
      expectedFix: {
        file: 'app/src/main/res/layout/activity_main.xml',
        lineNumber: 12,
        explanation: 'Remove invalid attribute or use android:textStyle="bold"'
      }
    };
  }
  
  /**
   * Test 5: Multi-Module Dependency Conflict
   */
  private getTest5_MultiModuleDependency(): TestCase {
    return {
      id: 5,
      name: 'Multi-Module Dependency Conflict',
      description: 'Version conflict between :app and :core modules',
      errorType: 'gradle-dependency',
      complexity: 'complex',
      targetUsability: 70,
      error: {
        type: 'gradle-dependency',
        message: 'Conflict with dependency androidx.lifecycle:lifecycle-runtime-ktx',
        filePath: 'app/build.gradle.kts',
        line: 45,
        column: 1,
        language: 'gradle',
        metadata: {
          severity: 'error',
          context: 'Module :app requires 2.6.0, :core requires 2.5.0'
        }
      },
      expectedFix: {
        file: 'gradle/libs.versions.toml',
        explanation: 'Align lifecycle version across all modules'
      }
    };
  }
  
  /**
   * Test 6: Manifest Permission Missing
   */
  private getTest6_ManifestPermission(): TestCase {
    return {
      id: 6,
      name: 'Manifest Permission Missing',
      description: 'SecurityException due to missing CAMERA permission',
      errorType: 'manifest-permission',
      complexity: 'simple',
      baselineUsability: 65,
      targetUsability: 80,
      error: {
        type: 'manifest-permission',
        message: 'java.lang.SecurityException: Permission denial: starting Intent requires android.permission.CAMERA',
        filePath: 'app/src/main/AndroidManifest.xml',
        line: 5,
        column: 1,
        language: 'xml',
        metadata: {
          severity: 'error',
          context: 'Runtime permission error'
        }
      },
      expectedFix: {
        file: 'app/src/main/AndroidManifest.xml',
        lineNumber: 5,
        codeChange: '<uses-permission android:name="android.permission.CAMERA" />',
        explanation: 'Add CAMERA permission to manifest'
      }
    };
  }
  
  /**
   * Test 7: Gradle Sync Failed (Network)
   */
  private getTest7_GradleNetwork(): TestCase {
    return {
      id: 7,
      name: 'Gradle Network Failure',
      description: 'Failed to resolve dependency due to network/repository issue',
      errorType: 'gradle-network',
      complexity: 'medium',
      baselineUsability: 60,
      targetUsability: 75,
      error: {
        type: 'gradle-network',
        message: 'Could not resolve all dependencies for configuration :classpath',
        filePath: 'settings.gradle.kts',
        line: 15,
        column: 1,
        language: 'gradle',
        metadata: {
          severity: 'error',
          context: 'Repository not accessible or dependency missing'
        }
      },
      expectedFix: {
        file: 'settings.gradle.kts',
        explanation: 'Add missing repository or check network connection'
      }
    };
  }
  
  /**
   * Test 8: Build Cache Corruption
   */
  private getTest8_BuildCache(): TestCase {
    return {
      id: 8,
      name: 'Build Cache Corruption',
      description: 'Gradle build cache corrupted causing build failures',
      errorType: 'gradle-cache',
      complexity: 'simple',
      baselineUsability: 70,
      targetUsability: 85,
      error: {
        type: 'gradle-cache',
        message: 'Execution failed for task :app:compileDebugKotlin. Compilation error',
        filePath: 'build.gradle.kts',
        line: 1,
        column: 1,
        language: 'gradle',
        metadata: {
          severity: 'error',
          context: 'Intermittent build failures, works after clean'
        }
      },
      expectedFix: {
        file: 'build.gradle',
        explanation: 'Run ./gradlew clean or delete .gradle cache'
      }
    };
  }
  
  /**
   * Test 9: R8/ProGuard Rule Missing
   */
  private getTest9_ProGuardRule(): TestCase {
    return {
      id: 9,
      name: 'ProGuard Rule Missing',
      description: 'Runtime crash in release build due to obfuscation',
      errorType: 'proguard',
      complexity: 'complex',
      baselineUsability: 55,
      targetUsability: 70,
      error: {
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
      },
      expectedFix: {
        file: 'app/proguard-rules.pro',
        codeChange: '-keep class com.example.** { *; }',
        explanation: 'Add ProGuard keep rule for serialization classes'
      }
    };
  }
  
  /**
   * Test 10: Navigation Argument Mismatch
   */
  private getTest10_NavigationArgument(): TestCase {
    return {
      id: 10,
      name: 'Navigation Argument Mismatch',
      description: 'Runtime crash due to missing/wrong navigation arguments',
      errorType: 'navigation',
      complexity: 'medium',
      baselineUsability: 50,
      targetUsability: 70,
      error: {
        type: 'navigation',
        message: 'java.lang.IllegalArgumentException: Required argument "userId" is missing',
        filePath: 'app/src/main/kotlin/navigation/NavGraph.kt',
        line: 32,
        column: 5,
        language: 'kotlin',
        metadata: {
          severity: 'error',
          context: 'Navigation argument not passed correctly'
        }
      },
      expectedFix: {
        file: 'app/src/main/kotlin/navigation/NavGraph.kt',
        lineNumber: 32,
        explanation: 'Add userId argument to navigation call'
      }
    };
  }
  
  /**
   * Run a single test case
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    console.log(`\n🧪 Running Test ${testCase.id}: ${testCase.name}`);
    console.log(`   Error Type: ${testCase.errorType} | Complexity: ${testCase.complexity}`);
    console.log(`   Target Usability: ${testCase.targetUsability}%`);
    
    const startTime = Date.now();
    
    try {
      // Get test fixture root for this specific test using fixture name map
      const fixtureFolderName = this.fixtureNameMap[testCase.id];
      const testFixturePath = path.join(this.testFixturesRoot, fixtureFolderName);
      
      // Create a new agent with correct projectRoot for file resolution
      const testAgent = new MinimalReactAgent((this.agent as any).llm, {
        maxIterations: 5,
        generateFix: true,
        projectRoot: testFixturePath, // Fix file resolution issue
        enableCaching: true
      });
      
      console.log(`   📂 Using test fixture: ${fixtureFolderName} (${testFixturePath})`);
      
      // Run RCA Agent with test-specific agent
      const result = await testAgent.analyze(testCase.error);
      
      const duration = Date.now() - startTime;
      
      // Calculate metrics
      const metrics = this.calculateMetrics(testCase, result, duration);
      
      // Determine if test passed
      const passed = metrics.overall_usability >= testCase.targetUsability;
      
      // Calculate improvement over baseline if available
      const improvement = testCase.baselineUsability 
        ? metrics.overall_usability - testCase.baselineUsability
        : undefined;
      
      const testResult: TestResult = {
        testCase,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        agent_response: result,
        metrics,
        passed,
        improvement_over_baseline: improvement
      };
      
      console.log(`   ✅ Completed in ${duration}ms`);
      console.log(`   Overall Usability: ${metrics.overall_usability}%`);
      if (improvement !== undefined) {
        console.log(`   Improvement: +${improvement}% over baseline`);
      }
      console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      
      return testResult;
      
    } catch (error: any) {
      console.error(`   ❌ Test failed with error: ${error.message}`);
      
      return {
        testCase,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        agent_response: null,
        metrics: this.getZeroMetrics(),
        passed: false,
        notes: `Test execution failed: ${error.message}`
      };
    }
  }
  
  /**
   * Calculate test metrics from agent response
   */
  private calculateMetrics(testCase: TestCase, response: any, latency: number): TestMetrics {
    const metrics: TestMetrics = {
      diagnosis_accuracy: 0,
      solution_specificity: 0,
      file_identification: 0,
      code_examples: 0,
      version_suggestions: 0,
      overall_usability: 0,
      confidence: response.confidence || 0,
      latency_ms: latency,
      has_root_cause: false,
      has_fix_guidelines: false,
      has_code_diff: false,
      has_specific_version: false,
      identified_exact_file: false
    };
    
    // Diagnosis accuracy (did agent identify the problem?)
    if (response.rootCause && response.rootCause.length > 50) {
      metrics.diagnosis_accuracy = 90;
      metrics.has_root_cause = true;
      
      // Bonus for mentioning specific error type
      if (response.rootCause.toLowerCase().includes(testCase.errorType)) {
        metrics.diagnosis_accuracy = 100;
      }
    }
    
    // Solution specificity (is fix actionable?)
    if (response.fixGuidelines && response.fixGuidelines.length > 0) {
      metrics.has_fix_guidelines = true;
      metrics.solution_specificity = 40;
      
      // Higher score for detailed guidelines
      if (response.fixGuidelines.length >= 3) {
        metrics.solution_specificity = 60;
      }
      
      // Bonus for mentioning exact line numbers
      if (JSON.stringify(response).includes('line ')) {
        metrics.solution_specificity += 10;
      }
    }
    
    // File identification (exact file mentioned?)
    if (testCase.expectedFix?.file) {
      const expectedFile = testCase.expectedFix.file.toLowerCase();
      const responseStr = JSON.stringify(response).toLowerCase();
      
      if (responseStr.includes(expectedFile)) {
        metrics.file_identification = 100;
        metrics.identified_exact_file = true;
      } else if (responseStr.includes('gradle') || responseStr.includes('manifest')) {
        metrics.file_identification = 30; // Generic reference
      }
    }
    
    // Code examples (before/after or code snippets?)
    const responseStr = JSON.stringify(response);
    if (responseStr.includes('```') || responseStr.includes('before:') || responseStr.includes('after:')) {
      metrics.code_examples = 80;
      metrics.has_code_diff = true;
    } else if (responseStr.match(/["'].*=.*["']/)) {
      metrics.code_examples = 40; // Has some code-like content
    }
    
    // Version suggestions (specific version numbers?)
    if (testCase.errorType === 'gradle-dependency' || testCase.errorType.includes('version')) {
      const versionPattern = /\d+\.\d+\.\d+/;
      if (responseStr.match(versionPattern)) {
        metrics.version_suggestions = 90;
        metrics.has_specific_version = true;
      }
    }
    
    // Overall usability (weighted average)
    metrics.overall_usability = Math.round(
      metrics.diagnosis_accuracy * 0.3 +
      metrics.solution_specificity * 0.3 +
      metrics.file_identification * 0.2 +
      metrics.code_examples * 0.1 +
      metrics.version_suggestions * 0.1
    );
    
    return metrics;
  }
  
  /**
   * Get zero metrics for failed tests
   */
  private getZeroMetrics(): TestMetrics {
    return {
      diagnosis_accuracy: 0,
      solution_specificity: 0,
      file_identification: 0,
      code_examples: 0,
      version_suggestions: 0,
      overall_usability: 0,
      confidence: 0,
      latency_ms: 0,
      has_root_cause: false,
      has_fix_guidelines: false,
      has_code_diff: false,
      has_specific_version: false,
      identified_exact_file: false
    };
  }
  
  /**
   * Run all test cases
   */
  async runAllTests(): Promise<TestSuiteReport> {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 PHASE 4 TEST SUITE - RUNNING ALL 10 TESTS');
    console.log('='.repeat(80));
    
    const testCases = this.getAllTestCases();
    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      const result = await this.runTest(testCase);
      results.push(result);
      
      // Save individual result
      await this.saveTestResult(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate report
    const report = this.generateReport(results);
    
    // Save report
    await this.saveReport(report);
    
    // Print summary
    this.printSummary(report);
    
    return report;
  }
  
  /**
   * Generate comprehensive test suite report
   */
  private generateReport(results: TestResult[]): TestSuiteReport {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const avgUsability = results.reduce((sum, r) => sum + r.metrics.overall_usability, 0) / results.length;
    const avgLatency = results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length;
    
    // Group by error type
    const byErrorType = new Map<string, { passed: number; total: number; avg_usability: number }>();
    for (const result of results) {
      const type = result.testCase.errorType;
      if (!byErrorType.has(type)) {
        byErrorType.set(type, { passed: 0, total: 0, avg_usability: 0 });
      }
      const stats = byErrorType.get(type)!;
      stats.total++;
      if (result.passed) stats.passed++;
      stats.avg_usability += result.metrics.overall_usability;
    }
    for (const [_type, stats] of byErrorType) {
      stats.avg_usability /= stats.total;
    }
    
    // Group by complexity
    const byComplexity = new Map<string, { passed: number; total: number; avg_usability: number }>();
    for (const result of results) {
      const complexity = result.testCase.complexity;
      if (!byComplexity.has(complexity)) {
        byComplexity.set(complexity, { passed: 0, total: 0, avg_usability: 0 });
      }
      const stats = byComplexity.get(complexity)!;
      stats.total++;
      if (result.passed) stats.passed++;
      stats.avg_usability += result.metrics.overall_usability;
    }
    for (const [_complexity, stats] of byComplexity) {
      stats.avg_usability /= stats.total;
    }
    
    // Calculate improvements
    const improvements = results
      .filter(r => r.improvement_over_baseline !== undefined)
      .map(r => ({
        test_id: r.testCase.id,
        name: r.testCase.name,
        baseline: r.testCase.baselineUsability!,
        current: r.metrics.overall_usability,
        improvement: r.improvement_over_baseline!
      }))
      .sort((a, b) => b.improvement - a.improvement);
    
    return {
      timestamp: new Date().toISOString(),
      total_tests: results.length,
      passed_tests: passed,
      failed_tests: failed,
      average_usability: avgUsability,
      average_latency_ms: avgLatency,
      test_results: results,
      summary: {
        by_error_type: byErrorType,
        by_complexity: byComplexity,
        improvements
      }
    };
  }
  
  /**
   * Save individual test result
   */
  private async saveTestResult(result: TestResult): Promise<void> {
    await fs.mkdir(this.resultsDir, { recursive: true });
    
    const filename = `test${result.testCase.id}-${result.testCase.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`   💾 Saved result to ${filename}`);
  }
  
  /**
   * Save test suite report
   */
  private async saveReport(report: TestSuiteReport): Promise<void> {
    await fs.mkdir(this.resultsDir, { recursive: true });
    
    const filename = `phase4-test-suite-report-${Date.now()}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    // Convert Maps to objects for JSON serialization
    const serializable = {
      ...report,
      summary: {
        by_error_type: Object.fromEntries(report.summary.by_error_type),
        by_complexity: Object.fromEntries(report.summary.by_complexity),
        improvements: report.summary.improvements
      }
    };
    
    await fs.writeFile(filepath, JSON.stringify(serializable, null, 2));
    console.log(`\n💾 Full report saved to ${filename}`);
  }
  
  /**
   * Print test suite summary
   */
  private printSummary(report: TestSuiteReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Tests: ${report.total_tests}`);
    console.log(`   Passed: ${report.passed_tests} (${Math.round(report.passed_tests / report.total_tests * 100)}%)`);
    console.log(`   Failed: ${report.failed_tests}`);
    console.log(`   Average Usability: ${Math.round(report.average_usability)}%`);
    console.log(`   Average Latency: ${Math.round(report.average_latency_ms)}ms`);
    
    console.log(`\n📋 By Error Type:`);
    for (const [type, stats] of report.summary.by_error_type) {
      console.log(`   ${type}: ${stats.passed}/${stats.total} passed (${Math.round(stats.avg_usability)}% avg usability)`);
    }
    
    console.log(`\n🎯 By Complexity:`);
    for (const [complexity, stats] of report.summary.by_complexity) {
      console.log(`   ${complexity}: ${stats.passed}/${stats.total} passed (${Math.round(stats.avg_usability)}% avg usability)`);
    }
    
    if (report.summary.improvements.length > 0) {
      console.log(`\n📊 Improvements Over Baseline:`);
      for (const imp of report.summary.improvements) {
        console.log(`   Test ${imp.test_id} (${imp.name}): ${imp.baseline}% → ${imp.current}% (+${imp.improvement}%)`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Export for use in other scripts
export default Phase4TestSuite;
