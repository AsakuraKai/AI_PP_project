/**
 * Phase Validation Test Runner
 * 
 * Consolidates:
 * - phase1-validation.ts
 * - phase1-quick-retest.ts
 * - test-phase1-quick.ts
 * - test-phase2-validation.ts
 * 
 * Usage:
 *   npm run test:phase1
 *   npm run test:phase2
 *   npx ts-node scripts/run-phase-tests.ts --phase 1
 */

import { TestRunnerCore, TestCase } from './shared/test-runner-core';

const PHASE_1_TESTS: TestCase[] = [
  {
    id: 6,
    name: 'Manifest Permission',
    projectPath: 'tests/fixtures/test6-manifest-permission',
    error: {
      type: 'android-manifest',
      message: 'uses-sdk:minSdkVersion 21 cannot be smaller than version 23 declared in library',
      filePath: 'AndroidManifest.xml',
      line: 8,
      column: 1,
      language: 'xml',
      metadata: {
        severity: 'error',
        context: 'AndroidX Work requires minSdk 23',
        raw: 'Manifest merger failed: uses-sdk:minSdkVersion 21 cannot be smaller than version 23',
      },
    },
    expectedFixes: ['minSdkVersion 23', 'AndroidManifest.xml'],
  },
  {
    id: 7,
    name: 'Network Connectivity',
    projectPath: 'tests/fixtures/test7-gradle-network',
    error: {
      type: 'gradle-dependency',
      message: 'Could not GET https://dl.google.com/.../material-1.9.0.pom. Connection timed out',
      filePath: 'build.gradle',
      line: 1,
      column: 1,
      language: 'gradle',
      metadata: {
        severity: 'error',
        context: 'Network connectivity issue',
        raw: 'Could not resolve com.google.android.material:material:1.9.0',
      },
    },
    expectedFixes: ['repositories', 'mavenCentral', 'proxy', 'offline mode'],
  },
  {
    id: 8,
    name: 'Build Cache',
    projectPath: 'tests/fixtures/test8-build-cache',
    error: {
      type: 'gradle-cache',
      message: 'Could not open cp_proj generic class cache. Unexpected lock protocol found',
      filePath: 'build.gradle',
      line: 1,
      column: 1,
      language: 'gradle',
      metadata: {
        severity: 'error',
        context: 'Gradle cache corrupted',
        raw: 'Gradle cache corrupted at ~/.gradle/caches/7.4/',
      },
    },
    expectedFixes: ['./gradlew clean', 'rm -rf .gradle', 'invalidate caches'],
  },
  {
    id: 9,
    name: 'ProGuard Minification',
    projectPath: 'tests/fixtures/test9-proguard',
    error: {
      type: 'proguard',
      message: 'R8: Missing class com.example.models.UserProfile',
      filePath: 'proguard-rules.pro',
      line: 1,
      column: 1,
      language: 'proguard',
      metadata: {
        severity: 'error',
        context: 'R8 minification removing required classes',
        raw: 'R8: Missing class com.example.models.UserProfile',
      },
    },
    expectedFixes: ['-keep class', 'proguard-rules.pro', 'UserProfile'],
  },
  {
    id: 10,
    name: 'Navigation Argument',
    projectPath: 'tests/fixtures/test10-navigation',
    error: {
      type: 'kotlin-compile',
      message: 'Navigation argument userId expects String but received Int',
      filePath: 'ProfileFragment.kt',
      line: 67,
      column: 25,
      language: 'kotlin',
      metadata: {
        severity: 'error',
        context: 'Type mismatch in navigation arguments',
        raw: 'Type mismatch: inferred type is Int but String was expected',
      },
    },
    expectedFixes: ['nav_graph.xml', 'argType="string"', 'line 67'],
  },
];

const PHASE_2_TESTS: TestCase[] = [
  {
    id: 1,
    name: 'AGP Version Error',
    projectPath: 'tests/fixtures/mvp-test-project',
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
        raw: 'Could not find com.android.tools.build:gradle:8.10.0',
      },
    },
    expectedFixes: ['agp = "8.7.3"', 'gradle/libs.versions.toml'],
  },
  {
    id: 2,
    name: 'Kotlin lateinit NPE',
    projectPath: 'tests/fixtures/test-2-lateinit-npe',
    error: {
      type: 'kotlin-runtime',
      message: 'lateinit property viewModel has not been initialized',
      filePath: 'MainActivity.kt',
      line: 14,
      column: 1,
      language: 'kotlin',
      metadata: {
        severity: 'error',
        context: 'UninitializedPropertyAccessException at runtime',
        raw: 'kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized',
      },
    },
    expectedFixes: ['viewModel = ViewModelProvider', 'initialize before use'],
  },
];

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let phase = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase' && args[i + 1]) {
      phase = parseInt(args[i + 1]);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`🚀 PHASE ${phase} VALIDATION TEST RUNNER`);
  console.log('='.repeat(80));

  const testCases = phase === 1 ? PHASE_1_TESTS : PHASE_2_TESTS;
  const expectedAvg = phase === 1 ? 67.8 : 80.0;
  const target = phase === 1 ? 65 : 75;

  console.log(`\n📋 Test Cases: ${testCases.length}`);
  console.log(`🎯 Expected Average: ${expectedAvg}%`);
  console.log(`📊 Phase ${phase} Target: ${target}%`);
  console.log(`📂 Output: tests/results/phase${phase}/\n`);
  console.log('='.repeat(80));

  try {
    // Create test runner
    const runner = new TestRunnerCore({
      outputDir: `tests/results/phase${phase}`,
      maxIterations: 5,
      enableCaching: true,
    });

    // Initialize
    await runner.initialize();

    // Run tests
    const results = await runner.runTests(testCases);

    // Generate summary
    runner.generateSummary(results);

    // Phase-specific analysis
    console.log('\n' + '='.repeat(80));
    console.log(`📈 PHASE ${phase} ANALYSIS`);
    console.log('='.repeat(80));

    const avgUsability = results.reduce((sum, r) => sum + r.metrics.overallUsability, 0) / results.length;
    const deviation = avgUsability - expectedAvg;
    const targetMet = avgUsability >= target;

    console.log(`\nExpected Average: ${expectedAvg}%`);
    console.log(`Actual Average:   ${avgUsability.toFixed(1)}%`);
    console.log(`Deviation:        ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`);
    console.log(`Target (${target}%):     ${targetMet ? '✅ MET' : '❌ NOT MET'}`);

    if (phase === 1) {
      console.log('\nPhase 1 Improvements Validated:');
      console.log('  ✓ LLM configuration (temperature=0.0, seed=42, JSON enforcement)');
      console.log('  ✓ Enhanced prompts with specificity constraints');
      console.log('  ✓ Improved example ranking');
    } else if (phase === 2) {
      console.log('\nPhase 2 Improvements Validated:');
      console.log('  ✓ Multi-pass reasoning');
      console.log('  ✓ Semantic example search');
      console.log('  ✓ Advanced tools integration');
    }

    console.log('='.repeat(80));

    // Cleanup
    await runner.cleanup();

    // Exit with appropriate code
    const failedCount = results.filter(r => r.status === 'failed').length;
    process.exit(failedCount > 0 || !targetMet ? 1 : 0);
  } catch (error: any) {
    console.error('\n❌ Test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
