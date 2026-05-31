/**
 * Unified Test Runner - All Test Cases
 * 
 * Consolidates chunk7, chunk8, and chunk9 test runners.
 * Runs all 10 test cases with common infrastructure.
 * 
 * Usage:
 *   npm run test:all
 *   npx ts-node scripts/run-all-tests.ts
 *   npx ts-node scripts/run-all-tests.ts --tests 1,6,7
 */

import { TestRunnerCore, TestCase } from './shared/test-runner-core.ts';

// All 10 test cases consolidated
const ALL_TEST_CASES: TestCase[] = [
  {
    id: 1,
    name: 'AGP Version Conflict',
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
  {
    id: 3,
    name: 'Compose API Breakage',
    projectPath: 'tests/fixtures/test-3-compose-breakage',
    error: {
      type: 'kotlin-compile',
      message: 'Type mismatch: inferred type is Unit but CoroutineContext was expected',
      filePath: 'MainActivity.kt',
      line: 29,
      column: 5,
      language: 'kotlin',
      metadata: {
        severity: 'error',
        context: 'LaunchedEffect signature changed in Compose 1.6',
        raw: 'Type mismatch: inferred type is Unit but CoroutineContext was expected',
      },
    },
    expectedFixes: ['LaunchedEffect(key1 = Unit)', 'named parameter'],
  },
  {
    id: 4,
    name: 'XML Layout Inflation',
    projectPath: 'tests/fixtures/test-4-xml-inflation',
    error: {
      type: 'android-runtime',
      message: 'Error inflating class com.example.xmltest.CustonButton',
      filePath: 'activity_main.xml',
      line: 14,
      column: 1,
      language: 'xml',
      metadata: {
        severity: 'error',
        context: 'ClassNotFoundException - class name typo in XML',
        raw: 'Error inflating class com.example.xmltest.CustonButton',
      },
    },
    expectedFixes: ['CustomButton', 'activity_main.xml line 14'],
  },
  {
    id: 5,
    name: 'Multi-Module Dependency Conflict',
    projectPath: 'tests/fixtures/test-5-multi-module',
    error: {
      type: 'gradle-dependency',
      message: 'Kotlin version mismatch: app module: 1.9.22, core module: 2.0.0',
      filePath: 'build.gradle',
      line: 1,
      column: 1,
      language: 'gradle',
      metadata: {
        severity: 'error',
        context: 'Multi-module Kotlin version conflict',
        raw: 'Module version conflict between app and core',
      },
    },
    expectedFixes: ['version "2.0.0"', 'app/build.gradle', 'core/build.gradle'],
  },
  {
    id: 6,
    name: 'Manifest Permission Missing',
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
    name: 'Gradle Network/Repository Issue',
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
    name: 'Build Cache Corruption',
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
    name: 'R8/ProGuard Rule Missing',
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
    name: 'Jetpack Navigation Argument Mismatch',
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

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('[LAUNCH] UNIFIED TEST RUNNER - All Test Cases');
  console.log('='.repeat(80));

  // Parse command line arguments
  const args = process.argv.slice(2);
  let testIds: number[] | null = null;

  if (args.length > 0 && args[0].startsWith('--tests')) {
    const idsArg = args[0].split('=')[1] || args[1];
    if (idsArg) {
      testIds = idsArg.split(',').map(id => parseInt(id.trim()));
      console.log(`\nRunning selected tests: ${testIds.join(', ')}`);
    }
  }

  // Filter test cases if specific tests requested
  const testCases = testIds
    ? ALL_TEST_CASES.filter(tc => testIds!.includes(tc.id))
    : ALL_TEST_CASES;

  if (testCases.length === 0) {
    console.error('[X] No valid test cases selected');
    process.exit(1);
  }

  console.log(`\n[LIST] Test Cases: ${testCases.length}`);
  console.log(`📂 Output: tests/results/\n`);
  console.log('='.repeat(80));

  try {
    // Create test runner
    const runner = new TestRunnerCore({
      outputDir: 'tests/results',
      maxIterations: 5,
      enableCaching: true,
    });

    // Initialize
    await runner.initialize();

    // Run tests
    const results = await runner.runTests(testCases);

    // Generate summary
    runner.generateSummary(results);

    // Cleanup
    await runner.cleanup();

    // Exit with appropriate code
    const failedCount = results.filter(r => r.status === 'failed').length;
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n[X] Test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
