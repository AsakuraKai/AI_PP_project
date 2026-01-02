/**
 * Chunk 7 Test 1: Re-test MVP AGP Version Error
 * 
 * REFACTORED: Now uses shared TestHarness to eliminate duplication
 * 
 * This re-tests the original MVP error from December 26, 2025 to measure
 * the improvement from all Chunks 1-6 implementations.
 */

import { createTestHarness, TestConfig } from './shared/test-harness';
import * as path from 'path';

async function runTest1(): Promise<void> {
  const testConfig: TestConfig = {
    testNumber: 1,
    testName: 'Test 1: AGP Version Error',
    description: 'Re-test MVP AGP version error to measure improvements',
    errorType: 'gradle-dependency',
    projectRoot: path.join(__dirname, '../tests/fixtures/mvp-test-project'),
    errorLog: `
FAILURE: Build failed with an exception.

* What went wrong:
A problem occurred configuring root project 'Lab3'.
> Could not resolve all files for configuration ':classpath'.
   > Could not find com.android.tools.build:gradle:8.10.0.
     Searched in the following locations:
       - https://repo.maven.apache.org/maven2/com/android/tools/build/gradle/8.10.0/gradle-8.10.0.pom
     Required by:
         project :
`,
    errorContext: {
      filePath: 'gradle/libs.versions.toml',
      line: 2,
      column: 1,
      language: 'gradle',
    },
    expectedDiagnosis: ['agp', '8.10.0', 'version', 'not found'],
    expectedSolution: ['gradle/libs.versions.toml', 'agp', 'version', '8.'],
    baseline: {
      usability: 40,
      diagnosis: 100,
      solution: 17,
      fileId: 30,
      codeExamples: 0,
    },
  };

  const harness = createTestHarness();
  await harness.runTest(testConfig);
}

// Run test if executed directly
if (require.main === module) {
  runTest1()
    .then(() => {
      console.log('\n✅ Test 1 complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { runTest1 };
