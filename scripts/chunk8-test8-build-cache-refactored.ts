/**
 * Chunk 8 - Test 8: Build Cache Corruption
 * 
 * REFACTORED: Now uses shared TestHarness to eliminate duplication
 * 
 * Tests the agent's ability to diagnose and fix Gradle build failures
 * caused by corrupted build cache.
 */

import { createTestHarness, TestConfig } from './shared/test-harness';
import * as path from 'path';

async function runTest8BuildCache(): Promise<void> {
  const testConfig: TestConfig = {
    testNumber: 8,
    testName: 'Test 8: Build Cache Corruption',
    description: 'Vague error message, requires cache clear solution',
    errorType: 'cache',
    projectRoot: path.join(__dirname, '../tests/fixtures/test8-build-cache'),
    errorLog: `FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:compileDebugKotlin'.
> Compilation error. See log for more details.

* Exception is:
org.gradle.api.tasks.TaskExecutionException: Execution failed for task ':app:compileDebugKotlin'.
    at org.gradle.api.internal.tasks.execution.ExecuteActionsTaskExecuter.lambda$executeIfValid$1(ExecuteActionsTaskExecuter.java:205)
    ...
Caused by: java.lang.IllegalStateException: Backend Internal error: Exception during IR lowering
File being compiled: /app/src/main/kotlin/MainActivity.kt
    at org.jetbrains.kotlin.backend.common.CodegenUtil.reportBackendException(CodegenUtil.kt:253)
    ...
Caused by: java.io.IOException: Cannot read from cache: corrupted cache header
    at org.jetbrains.kotlin.backend.common.serialization.metadata.DynamicTypeDeserializer.deserialize(DynamicTypeDeserializer.kt:123)

BUILD FAILED in 12s`,
    errorContext: {
      filePath: 'MainActivity.kt',
      line: 0,
      column: 0,
      language: 'kotlin',
    },
    expectedDiagnosis: ['cache', 'corrupted', 'gradle', 'kotlin'],
    expectedSolution: ['clean', 'invalidate', 'cache', '.gradle', 'build'],
    testFiles: {
      'build.gradle': `buildscript {
    repositories {
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
        applicationId "com.example.cachetest"
        minSdk 24
        targetSdk 34
    }
    
    buildFeatures {
        compose true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion '1.5.4'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.compose.ui:ui:1.5.4'
    implementation 'androidx.compose.material3:material3:1.1.2'
}`,
      'app/src/main/kotlin/MainActivity.kt': `package com.example.cachetest

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Greeting("Android")
        }
    }
}

@Composable
fun Greeting(name: String) {
    Text(text = "Hello \$name!")
}`,
    },
  };

  const harness = createTestHarness();
  await harness.runTest(testConfig);
}

// Run test if executed directly
if (require.main === module) {
  runTest8BuildCache()
    .then(() => {
      console.log('\n✅ Test 8 complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { runTest8BuildCache };
