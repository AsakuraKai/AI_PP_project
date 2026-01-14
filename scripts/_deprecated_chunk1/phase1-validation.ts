/**
 * Phase 1 Validation Script - Test Quick Wins Implementation
 * 
 * Tests the improvements from Phase 1:
 * - Day 1: LLM configuration (temperature=0.0, seed=42, JSON enforcement)
 * - Day 2: Enhanced prompts with specificity constraints
 * - Day 3: Improved example ranking
 * 
 * Expected Results:
 * - Reduced variance (80% → 30%)
 * - Improved usability (40% → 65-70%)
 * - Better solution specificity
 */

import * as path from 'path';
import * as fs from 'fs';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { ErrorParser } from '../src/utils/ErrorParser';
import { OllamaClient } from '../src/llm/OllamaClient';

interface TestCase {
  name: string;
  errorLog: string;
  expectedCategory: string;
  expectedKeywords: string[];
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Test 6: Manifest Permission',
    errorLog: `
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:processDebugMainManifest'.
> Manifest merger failed : uses-sdk:minSdkVersion 21 cannot be smaller than version 23 declared in library [androidx.work:work-runtime:2.9.0]

* Try:
Run with --stacktrace option to get the stack trace.
Run with --info or --debug option to get more log output.
    `,
    expectedCategory: 'manifest',
    expectedKeywords: ['AndroidManifest.xml', 'minSdk', 'line number', 'specific fix']
  },
  {
    name: 'Test 7: Network Connectivity',
    errorLog: `
> Could not resolve all dependencies for configuration ':app:debugRuntimeClasspath'.
   > Could not resolve com.google.android.material:material:1.9.0.
     Required by:
         project :app
      > Could not resolve com.google.android.material:material:1.9.0.
         > Could not get resource 'https://dl.google.com/dl/android/maven2/com/google/android/material/material/1.9.0/material-1.9.0.pom'.
            > Could not GET 'https://dl.google.com/dl/android/maven2/com/google/android/material/material/1.9.0/material-1.9.0.pom'.
               > Connect to dl.google.com:443 [dl.google.com/142.251.41.46] failed: Connection timed out: connect
    `,
    expectedCategory: 'network',
    expectedKeywords: ['build.gradle', 'repository', 'maven', 'proxy', 'offline']
  },
  {
    name: 'Test 8: Build Cache',
    errorLog: `
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:compileDebugKotlin'.
> Could not open cp_proj generic class cache for build file 'build.gradle'.
  > Unexpected lock protocol found in lock file. Expected 3, found 10.
  > Gradle cache corrupted at /Users/project/.gradle/caches/7.4/

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.

* Exception is:
org.gradle.cache.CacheOpenException: Could not open cache
	at build.gradle:1
    `,
    expectedCategory: 'cache',
    expectedKeywords: ['./gradlew', 'clean', '.gradle', 'rm -rf', 'terminal command']
  },
  {
    name: 'Test 9: ProGuard Minification',
    errorLog: `
> Task :app:minifyReleaseWithR8 FAILED
R8: Missing class com.example.models.UserProfile
R8: Missing class com.example.api.ApiService
R8: Missing class retrofit2.Call

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:minifyReleaseWithR8'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.R8Task$R8Runnable
   > Compilation failed to complete, origin: /home/user/project/app/build/intermediates/classes.jar
    `,
    expectedCategory: 'proguard',
    expectedKeywords: ['proguard-rules.pro', '-keep', 'class', 'exact rule', 'file location']
  },
  {
    name: 'Test 10: Navigation Argument Mismatch',
    errorLog: `
e: ProfileFragment.kt: (67, 25): Type mismatch: inferred type is Int but String was expected
e: ProfileFragment.kt: (67, 25): Navigation argument 'userId' expects String but received Int

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:compileDebugKotlin'.
> Compilation error. See log for more details.

* Try:
Run with --stacktrace option to get the stack trace.
    `,
    expectedCategory: 'navigation',
    expectedKeywords: ['nav_graph.xml', 'argType', 'line number', 'type mismatch']
  }
];

interface TestResult {
  testName: string;
  passed: boolean;
  usabilityScore: number;
  specificityScore: number;
  issues: string[];
  highlights: string[];
  latency: number;
  response: any;
}

async function calculateUsabilityScore(response: any, expectedKeywords: string[]): Promise<number> {
  let score = 0;
  
  // Check if response has required structure (20 points)
  if (response.rootCause) score += 20;
  if (response.fixGuidelines && response.fixGuidelines.length >= 3) score += 20;
  
  // Check for specificity (30 points)
  const text = JSON.stringify(response).toLowerCase();
  
  // File path with line number (10 points)
  if (/\w+\.\w+.*line\s*\d+/.test(text) || /\w+\/\w+\.\w+:\d+/.test(text)) score += 10;
  
  // Code examples (10 points)
  if (/before:.*after:/i.test(text) || text.includes('```')) score += 10;
  
  // Specific version numbers (10 points)
  if (/\d+\.\d+\.\d+/.test(text) && !text.includes('latest')) score += 10;
  
  // Expected keywords present (30 points total)
  const keywordsFound = expectedKeywords.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
  score += Math.min(30, (keywordsFound.length / expectedKeywords.length) * 30);
  
  return score;
}

async function calculateSpecificityScore(response: any): Promise<number> {
  let score = 0;
  const text = JSON.stringify(response).toLowerCase();
  
  // Exact file path with line number (30 points)
  if (/\w+\/\w+\.\w+.*line\s*\d+/.test(text)) score += 30;
  else if (/\w+\.\w+/.test(text)) score += 15;
  
  // Code snippets with before/after (30 points)
  if (text.includes('before:') && text.includes('after:')) score += 30;
  else if (text.includes('```')) score += 15;
  
  // Specific terminal commands (20 points)
  if (/(\.\/gradlew|rm -rf|gradle clean|adb )/i.test(text)) score += 20;
  
  // Specific version numbers (20 points)
  const versionMatches = text.match(/\d+\.\d+\.\d+/g);
  if (versionMatches && versionMatches.length >= 2) score += 20;
  else if (versionMatches && versionMatches.length === 1) score += 10;
  
  return score;
}

async function runTest(testCase: TestCase): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Running: ${testCase.name}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const startTime = Date.now();
  
  try {
    // Initialize agent
    const llm = new OllamaClient();
    await llm.connect();
    const agent = new MinimalReactAgent(llm);
    
    // Parse error
    const parser = ErrorParser.getInstance();
    const parsedError = parser.parse(testCase.errorLog);
    
    if (!parsedError) {
      throw new Error(`Failed to parse error for ${testCase.name}`);
    }
    
    console.log(`Error Type: ${parsedError.type}`);
    console.log(`Message: ${parsedError.message.substring(0, 100)}...`);
    
    // Run RCA
    const result = await agent.analyze(parsedError);
    const latency = Date.now() - startTime;
    
    // Calculate scores
    const usabilityScore = await calculateUsabilityScore(result, testCase.expectedKeywords);
    const specificityScore = await calculateSpecificityScore(result);
    
    // Analyze response
    const issues: string[] = [];
    const highlights: string[] = [];
    
    const text = JSON.stringify(result).toLowerCase();
    
    // Check for issues
    if (!result.rootCause) issues.push('Missing rootCause');
    if (!result.fixGuidelines || result.fixGuidelines.length < 2) {
      issues.push('Insufficient fix guidelines (need >= 2)');
    }
    if (!text.includes('line') && !/:\d+/.test(text)) {
      issues.push('No line numbers specified');
    }
    if (text.includes('latest') || text.includes('newest')) {
      issues.push('Generic version suggestions (should be specific)');
    }
    // More lenient code example check for Phase 1
    if (!/(before|after|add:|change:|fix:)/i.test(text) && !text.includes('```')) {
      issues.push('Could add more code examples');
    }
    
    // Check for highlights
    if (/\w+\/\w+\.\w+.*line\s*\d+/.test(text)) {
      highlights.push('Exact file path with line number [OK]');
    }
    if (text.includes('before:') && text.includes('after:')) {
      highlights.push('Code before/after examples [OK]');
    }
    const versionMatches = text.match(/\d+\.\d+\.\d+/g);
    if (versionMatches && versionMatches.length >= 2) {
      highlights.push(`Specific version numbers: ${versionMatches.join(', ')} [OK]`);
    }
    if (/(\.\/gradlew|rm -rf)/i.test(text)) {
      highlights.push('Specific terminal commands [OK]');
    }
    
    // Determine pass/fail (target: 65%+ usability)
    const passed = usabilityScore >= 65 && issues.length <= 2;
    
    return {
      testName: testCase.name,
      passed,
      usabilityScore,
      specificityScore,
      issues,
      highlights,
      latency,
      response: result
    };
    
  } catch (error) {
    console.error(`Test failed with error:`, error);
    return {
      testName: testCase.name,
      passed: false,
      usabilityScore: 0,
      specificityScore: 0,
      issues: [`Critical error: ${error}`],
      highlights: [],
      latency: Date.now() - startTime,
      response: null
    };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         Phase 1 Validation - Quick Wins Testing                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Testing improvements:');
  console.log('  ✓ LLM config: temperature=0.0, seed=42, JSON enforcement');
  console.log('  ✓ Enhanced prompts: BAD vs GOOD examples, specificity rules');
  console.log('  ✓ Category-specific constraints (manifest, cache, proguard, etc.)');
  console.log('  ✓ Improved example ranking: multi-factor scoring');
  console.log('');
  console.log(`Target: 65-70% usability (up from 40%)`);
  console.log(`Baseline Chunk 8: 34% average\n`);
  
  const results: TestResult[] = [];
  
  // Run all tests
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Print immediate results
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`RESULTS: ${result.testName}`);
    console.log(`${'-'.repeat(80)}`);
    console.log(`Status: ${result.passed ? '[OK] PASS' : '[X] FAIL'}`);
    console.log(`Usability Score: ${result.usabilityScore}% (target: 65%)`);
    console.log(`Specificity Score: ${result.specificityScore}%`);
    console.log(`Latency: ${(result.latency / 1000).toFixed(2)}s`);
    
    if (result.highlights.length > 0) {
      console.log(`\nHighlights:`);
      result.highlights.forEach(h => console.log(`  ${h}`));
    }
    
    if (result.issues.length > 0) {
      console.log(`\nIssues:`);
      result.issues.forEach(issue => console.log(`  [X] ${issue}`));
    }
    
    console.log('');
  }
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           PHASE 1 SUMMARY                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const avgUsability = results.reduce((sum, r) => sum + r.usabilityScore, 0) / results.length;
  const avgSpecificity = results.reduce((sum, r) => sum + r.specificityScore, 0) / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const passedTests = results.filter(r => r.passed).length;
  
  console.log(`Tests Passed: ${passedTests}/${results.length}`);
  console.log(`Average Usability: ${avgUsability.toFixed(1)}% (target: 65-70%, baseline: 40%)`);
  console.log(`Average Specificity: ${avgSpecificity.toFixed(1)}%`);
  console.log(`Average Latency: ${(avgLatency / 1000).toFixed(2)}s`);
  console.log('');
  
  // Improvement calculation
  const baselineUsability = 40;
  const improvement = avgUsability - baselineUsability;
  const targetUsability = 67.5; // Mid-point of 65-70%
  const progressToTarget = ((avgUsability - baselineUsability) / (targetUsability - baselineUsability)) * 100;
  
  console.log(`Improvement: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}% (from 40% baseline)`);
  console.log(`Progress to Target: ${progressToTarget.toFixed(0)}%`);
  console.log('');
  
  // Individual test breakdown
  console.log('Individual Test Results:');
  console.log('─'.repeat(80));
  results.forEach(r => {
    const status = r.passed ? '[OK]' : '[X]';
    console.log(`${status} ${r.testName.padEnd(35)} ${r.usabilityScore.toString().padStart(3)}% usability`);
  });
  console.log('');
  
  // Phase 1 verdict
  if (avgUsability >= 65) {
    console.log('[OK] PHASE 1 SUCCESS - Target achieved (65%+)!');
    console.log('   Ready to proceed to Phase 2 (Deep Intelligence)');
  } else if (avgUsability >= 55) {
    console.log('[WARN]  PHASE 1 PARTIAL - Good progress but below target');
    console.log(`   Need +${(65 - avgUsability).toFixed(1)}% more to reach 65%`);
    console.log('   Consider: More aggressive prompt constraints or additional examples');
  } else {
    console.log('[X] PHASE 1 NEEDS WORK - Below expectations');
    console.log(`   Need +${(65 - avgUsability).toFixed(1)}% to reach target`);
    console.log('   Review: LLM config, prompt effectiveness, example quality');
  }
  
  // Save results
  const resultsDir = path.join(__dirname, '../tests/results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const resultsPath = path.join(resultsDir, `phase1-validation-${timestamp}.json`);
  
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      testsRun: results.length,
      testsPassed: passedTests,
      avgUsability,
      avgSpecificity,
      avgLatency,
      improvement,
      progressToTarget
    },
    results
  }, null, 2));
  
  console.log(`\nResults saved to: ${resultsPath}`);
}

main().catch(console.error);
