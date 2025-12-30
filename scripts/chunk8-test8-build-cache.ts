/**
 * Chunk 8 - Test 8: Build Cache Corruption
 * 
 * Tests the agent's ability to diagnose and fix Gradle build failures
 * caused by corrupted build cache.
 * 
 * Error Type: Build system / cache
 * Challenge: Vague error message, requires cache clear solution
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TestMetrics {
  diagnosis_accuracy: number;
  solution_specificity: number;
  file_identification: number;
  code_examples: number;
  version_suggestions: number;
  overall_usability: number;
  confidence: number;
  latency_ms: number;
}

async function runTest8BuildCache(): Promise<void> {
  console.log('\n🧪 CHUNK 8 - TEST 8: BUILD CACHE CORRUPTION\n');
  console.log('='.repeat(80));
  
  const projectRoot = path.join(__dirname, '../tests/fixtures/test8-build-cache');
  
  // Test project structure
  const testFiles = {
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
}`
  };
  
  // Create test project
  console.log('📁 Creating test project...');
  await fs.mkdir(projectRoot, { recursive: true });
  
  for (const [filename, content] of Object.entries(testFiles)) {
    const filePath = path.join(projectRoot, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }
  console.log('✅ Test project created\n');
  
  // Cache corruption error log
  const errorLog = `FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:compileDebugKotlin'.
> Compilation error. See log for more details.

* Exception is:
org.gradle.api.tasks.TaskExecutionException: Execution failed for task ':app:compileDebugKotlin'.
    at org.gradle.api.internal.tasks.execution.ExecuteActionsTaskExecuter.lambda$executeIfValid$1(ExecuteActionsTaskExecuter.java:205)
    at org.gradle.internal.Try$Failure.ifSuccessfulOrElse(Try.java:263)
    ...
Caused by: java.lang.IllegalStateException: Backend Internal error: Exception during IR lowering
File being compiled: /app/src/main/kotlin/MainActivity.kt
    at org.jetbrains.kotlin.backend.common.CodegenUtil.reportBackendException(CodegenUtil.kt:253)
    ...
Caused by: java.io.IOException: Cannot read from cache: corrupted cache header
    at org.jetbrains.kotlin.backend.common.serialization.metadata.DynamicTypeDeserializer.deserialize(DynamicTypeDeserializer.kt:123)
    at org.jetbrains.kotlin.backend.common.serialization.IrModuleDeserializer.deserializeIrModuleHeader(IrModuleDeserializer.kt:45)

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.

BUILD FAILED in 12s`;
  
  // Initialize agent
  console.log('🤖 Initializing RCA agent...');
  const llm = new OllamaClient({
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    baseUrl: 'http://localhost:11434',
    timeout: 120000
  });
  
  const agent = new MinimalReactAgent(llm, {
    maxIterations: 5,
    generateFix: true,
    projectRoot: projectRoot
  });
  
  console.log('✅ Agent initialized\n');
  
  // Run analysis
  console.log('🔍 Running RCA analysis...\n');
  const startTime = Date.now();
  
  try {
    const result = await agent.analyze({
      type: 'kotlin_compilation',
      message: errorLog,
      stackTrace: [],
      filePath: 'app/src/main/kotlin/MainActivity.kt',
      line: 0,
      column: 0,
      language: 'kotlin'
    });
    
    const latency = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST 8 RESULTS\n');
    
    console.log('🔍 AGENT OUTPUT:\n');
    console.log('Root Cause:', result.rootCause);
    console.log('\nFix Guidelines:', result.fixGuidelines);
    if (result.codeFix) {
      console.log('\nCode Fix:', result.codeFix.explanation);
    }
    console.log('\nConfidence:', result.confidence);
    console.log('Latency:', `${latency}ms (${(latency/1000).toFixed(2)}s)`);
    
    // Calculate metrics
    const metrics = calculateMetrics(result, latency);
    
    console.log('\n📈 DETAILED METRICS:\n');
    console.log(`Diagnosis Accuracy:      ${metrics.diagnosis_accuracy}% ${getStatusEmoji(metrics.diagnosis_accuracy, 90)}`);
    console.log(`Solution Specificity:    ${metrics.solution_specificity}% ${getStatusEmoji(metrics.solution_specificity, 70)}`);
    console.log(`File Identification:     ${metrics.file_identification}% ${getStatusEmoji(metrics.file_identification, 85)}`);
    console.log(`Code Examples:           ${metrics.code_examples}% ${getStatusEmoji(metrics.code_examples, 70)}`);
    console.log(`Version Suggestions:     N/A (not applicable for cache errors)`);
    console.log(`Overall Usability:       ${metrics.overall_usability}% ${getStatusEmoji(metrics.overall_usability, 65)}`);
    console.log(`Confidence:              ${(metrics.confidence * 100).toFixed(0)}%`);
    console.log(`Latency:                 ${(metrics.latency_ms/1000).toFixed(2)}s ${getStatusEmoji(metrics.latency_ms < 20000 ? 100 : 50, 80)}`);
    
    // Save results
    const resultsDir = path.join(__dirname, '../tests/results/chunk8');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsFile = path.join(resultsDir, `test8-build-cache-${timestamp}.json`);
    
    await fs.writeFile(resultsFile, JSON.stringify({
      test: 'Test 8: Build Cache Corruption',
      timestamp: new Date().toISOString(),
      metrics,
      agentOutput: result,
      errorLog,
      projectRoot
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📝 TEST 8 SUMMARY\n');
    
    if (metrics.overall_usability >= 65) {
      console.log('✅ TEST PASSED - Usability target exceeded!');
    } else if (metrics.overall_usability >= 50) {
      console.log('⚠️  TEST PARTIAL - Usability acceptable but below target');
    } else {
      console.log('❌ TEST FAILED - Usability below acceptable threshold');
    }
    
    console.log(`\nTarget: 65%+ usability`);
    console.log(`Actual: ${metrics.overall_usability}%`);
    console.log(`Difference: ${metrics.overall_usability >= 65 ? '+' : ''}${(metrics.overall_usability - 65).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  }
}

function calculateMetrics(result: any, latency: number): TestMetrics {
  let diagnosis = 0;
  let solution = 0;
  let fileId = 0;
  let codeEx = 0;
  
  // Diagnosis: Should identify cache corruption
  const rootCause = result.rootCause?.toLowerCase() || '';
  if (rootCause.includes('cache') && rootCause.includes('corrupt')) diagnosis += 40;
  if (rootCause.includes('build cache') || rootCause.includes('gradle cache')) diagnosis += 30;
  if (rootCause.includes('kotlin') || rootCause.includes('compiler')) diagnosis += 20;
  if (rootCause.includes('ir lowering') || rootCause.includes('backend')) diagnosis += 10;
  
  // Solution: Should suggest cache clear commands
  const fix = (Array.isArray(result.fixGuidelines) ? result.fixGuidelines.join(' ') : result.fixGuidelines || '').toLowerCase();
  if (fix.includes('./gradlew clean')) solution += 35;
  if (fix.includes('--no-daemon') || fix.includes('stop daemon')) solution += 20;
  if (fix.includes('.gradle') && fix.includes('delete')) solution += 20;
  if (fix.includes('invalidate') || fix.includes('caches')) solution += 15;
  if (fix.includes('rebuild') || fix.includes('clean build')) solution += 10;
  
  // File identification: N/A for cache issues (no specific file to edit)
  if (fix.includes('terminal') || fix.includes('command')) fileId += 50;
  if (fix.includes('./gradlew')) fileId += 50;
  
  // Code examples: Should show exact commands
  const code = result.codeFix?.diff || result.fixGuidelines?.join(' ') || '';
  if (code.includes('./gradlew clean')) codeEx += 40;
  if (code.includes('./gradlew build')) codeEx += 30;
  if (code.includes('rm -rf .gradle') || code.includes('delete .gradle')) codeEx += 30;
  
  const overall = (diagnosis + solution + fileId + codeEx) / 4;
  
  return {
    diagnosis_accuracy: Math.min(100, diagnosis),
    solution_specificity: Math.min(100, solution),
    file_identification: Math.min(100, fileId),
    code_examples: Math.min(100, codeEx),
    version_suggestions: -1, // N/A for cache errors
    overall_usability: Math.min(100, Math.round(overall)),
    confidence: result.confidence || 0,
    latency_ms: latency
  };
}

function getStatusEmoji(value: number, target: number): string {
  if (value >= target) return '✅';
  if (value >= target * 0.8) return '⚠️';
  return '❌';
}

// Run test
runTest8BuildCache().catch(console.error);
