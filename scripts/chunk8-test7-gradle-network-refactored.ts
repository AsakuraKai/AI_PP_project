/**
 * Chunk 8 - Test 7: Gradle Sync Failed (Network)
 * 
 * REFACTORED: Now uses shared TestHarness to eliminate duplication
 * 
 * Tests the agent's ability to diagnose and fix Gradle dependency resolution failures
 * caused by network/repository connectivity issues.
 */

import { createTestHarness, TestConfig } from './shared/test-harness';
import * as path from 'path';

async function runTest7GradleNetwork(): Promise<void> {
  const testConfig: TestConfig = {
    testNumber: 7,
    testName: 'Test 7: Gradle Sync Failed (Network)',
    description: 'Non-code issue, requires configuration fix (repository setup, proxy, etc.)',
    errorType: 'network',
    projectRoot: path.join(__dirname, '../tests/fixtures/test7-gradle-network'),
    errorLog: `FAILURE: Build failed with an exception.

* What went wrong:
A problem occurred configuring project ':app'.
> Could not resolve all files for configuration ':app:debugCompileClasspath'.
   > Could not resolve com.company.internal:sdk:2.0.0.
     Required by:
         project :app
      > Could not resolve com.company.internal:sdk:2.0.0.
         > Could not get resource 'https://custom-internal-repo.company.com/maven/com/company/internal/sdk/2.0.0/sdk-2.0.0.pom'.
            > Could not GET 'https://custom-internal-repo.company.com/maven/com/company/internal/sdk/2.0.0/sdk-2.0.0.pom'.
               > Connect to custom-internal-repo.company.com:443 [custom-internal-repo.company.com/10.0.1.50] failed: Connection timed out: connect

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.`,
    errorContext: {
      filePath: 'build.gradle',
      line: 0,
      column: 0,
      language: 'gradle',
    },
    expectedDiagnosis: ['network', 'repository', 'connection', 'timeout', 'unreachable'],
    expectedSolution: ['repository', 'maven', 'remove', 'internal', 'build.gradle'],
    testFiles: {
      'build.gradle': `buildscript {
    repositories {
        // Using custom repository that's unreachable
        maven { url 'https://custom-internal-repo.company.com/maven' }
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.0'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.20'
    }
}

allprojects {
    repositories {
        maven { url 'https://custom-internal-repo.company.com/maven' }
        google()
        mavenCentral()
    }
}`,
      'app/build.gradle': `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.example.networktest"
        minSdk 24
        targetSdk 34
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    // Dependency only available on internal repo
    implementation 'com.company.internal:sdk:2.0.0'
}`,
      'settings.gradle': `pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "NetworkTest"
include ':app'`,
    },
  };

  const harness = createTestHarness();
  await harness.runTest(testConfig);
}

// Run test if executed directly
if (require.main === module) {
  runTest7GradleNetwork()
    .then(() => {
      console.log('\n✅ Test 7 complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { runTest7GradleNetwork };
