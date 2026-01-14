/**
 * Chunk 8 - Test 9: R8/ProGuard Rule Missing
 * 
 * Tests the agent's ability to diagnose and fix release build crashes
 * caused by missing ProGuard/R8 rules.
 * 
 * Error Type: Build / minification
 * Challenge: Only appears in release builds, requires ProGuard configuration
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

async function runTest9ProGuard(): Promise<void> {
  console.log('\n[TEST] CHUNK 8 - TEST 9: R8/PROGUARD RULE MISSING\n');
  console.log('='.repeat(80));

  const projectRoot = path.join(__dirname, '../tests/fixtures/test9-proguard');

  // Test project structure
  const testFiles = {
    'app/build.gradle': `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'org.jetbrains.kotlin.plugin.serialization' version '1.9.20'
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.example.proguardtest"
        minSdk 24
        targetSdk 34
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0'
}`,

    'app/proguard-rules.pro': `# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

-keep class * {
    public private *;
}`,

    'app/src/main/kotlin/ApiService.kt': `package com.example.proguardtest

import retrofit2.Call
import retrofit2.http.GET
import kotlinx.serialization.Serializable

interface ApiService {
    @GET("users")
    fun getUsers(): Call<List<User>>
}

@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String
)`,

    'app/src/main/kotlin/MainActivity.kt': `package com.example.proguardtest

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val retrofit = Retrofit.Builder()
            .baseUrl("https://api.example.com/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        val service = retrofit.create(ApiService::class.java)
        // This will crash in release build due to missing ProGuard rules
        val users = service.getUsers()
    }
}`
  };

  // Create test project
  console.log('[FOLDER] Creating test project...');
  await fs.mkdir(projectRoot, { recursive: true });

  for (const [filename, content] of Object.entries(testFiles)) {
    const filePath = path.join(projectRoot, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }
  console.log('[OK] Test project created\n');

  // ProGuard error log
  const errorLog = `FATAL EXCEPTION: main
Process: com.example.proguardtest, PID: 12345
java.lang.NoSuchMethodError: No interface method getUsers()Lretrofit2/Call; in class Lcom/example/proguardtest/ApiService; or its super classes (declaration of 'com.example.proguardtest.ApiService' appears in /data/app/~~xyz==/com.example.proguardtest-abc123==/base.apk)
    at com.example.proguardtest.MainActivity.onCreate(MainActivity.kt:15)
    at android.app.Activity.performCreate(Activity.java:8595)
    at android.app.Activity.performCreate(Activity.java:8573)
    at android.app.Instrumentation.callActivityOnCreate(Instrumentation.java:1456)
    at android.app.ActivityThread.performLaunchActivity(ActivityThread.java:3768)

Note: This error only occurs in RELEASE builds with minifyEnabled = true
In DEBUG builds, the app works perfectly fine.

R8 has obfuscated/removed the ApiService interface methods because it thinks they're unused.
Need to add ProGuard rules to keep Retrofit interfaces.`;

  // Initialize agent
  console.log('[INIT] Initializing RCA agent...');
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

  console.log('[OK] Agent initialized\n');

  // Run analysis
  console.log('[SEARCH] Running RCA analysis...\n');
  const startTime = Date.now();

  try {
    const result = await agent.analyze({
      type: 'runtime_nosuchmethod',
      message: errorLog,
      stackTrace: [],
      filePath: 'app/src/main/kotlin/MainActivity.kt',
      line: 15,
      column: 0,
      language: 'kotlin'
    });

    const latency = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    console.log('[STATS] TEST 9 RESULTS\n');

    console.log('[SEARCH] AGENT OUTPUT:\n');
    console.log('Root Cause:', result.rootCause);
    console.log('\nFix Guidelines:', result.fixGuidelines);
    if (result.codeFix) {
      console.log('\nCode Fix:', result.codeFix.explanation);
    }
    console.log('\nConfidence:', result.confidence);
    console.log('Latency:', `${latency}ms (${(latency / 1000).toFixed(2)}s)`);

    // Calculate metrics
    const metrics = calculateMetrics(result, latency);

    console.log('\n[UP] DETAILED METRICS:\n');
    console.log(`Diagnosis Accuracy:      ${metrics.diagnosis_accuracy}% ${getStatusEmoji(metrics.diagnosis_accuracy, 90)}`);
    console.log(`Solution Specificity:    ${metrics.solution_specificity}% ${getStatusEmoji(metrics.solution_specificity, 70)}`);
    console.log(`File Identification:     ${metrics.file_identification}% ${getStatusEmoji(metrics.file_identification, 85)}`);
    console.log(`Code Examples:           ${metrics.code_examples}% ${getStatusEmoji(metrics.code_examples, 70)}`);
    console.log(`Version Suggestions:     N/A (not applicable for ProGuard errors)`);
    console.log(`Overall Usability:       ${metrics.overall_usability}% ${getStatusEmoji(metrics.overall_usability, 75)}`);
    console.log(`Confidence:              ${(metrics.confidence * 100).toFixed(0)}%`);
    console.log(`Latency:                 ${(metrics.latency_ms / 1000).toFixed(2)}s ${getStatusEmoji(metrics.latency_ms < 20000 ? 100 : 50, 80)}`);

    // Save results
    const resultsDir = path.join(__dirname, '../tests/results/chunk8');
    await fs.mkdir(resultsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsFile = path.join(resultsDir, `test9-proguard-${timestamp}.json`);

    await fs.writeFile(resultsFile, JSON.stringify({
      test: 'Test 9: R8/ProGuard Rule Missing',
      timestamp: new Date().toISOString(),
      metrics,
      agentOutput: result,
      errorLog,
      projectRoot
    }, null, 2));

    console.log(`\n💾 Results saved to: ${resultsFile}`);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('[NOTE] TEST 9 SUMMARY\n');

    if (metrics.overall_usability >= 75) {
      console.log('[OK] TEST PASSED - Usability target exceeded!');
    } else if (metrics.overall_usability >= 60) {
      console.log('[WARN]  TEST PARTIAL - Usability acceptable but below target');
    } else {
      console.log('[X] TEST FAILED - Usability below acceptable threshold');
    }

    console.log(`\nTarget: 75%+ usability`);
    console.log(`Actual: ${metrics.overall_usability}%`);
    console.log(`Difference: ${metrics.overall_usability >= 75 ? '+' : ''}${(metrics.overall_usability - 75).toFixed(1)}%`);

  } catch (error) {
    console.error('[X] Test failed with error:', error);
    throw error;
  }
}

function calculateMetrics(result: any, latency: number): TestMetrics {
  let diagnosis = 0;
  let solution = 0;
  let fileId = 0;
  let codeEx = 0;

  // Diagnosis: Should identify R8/ProGuard obfuscation
  const rootCause = result.rootCause?.toLowerCase() || '';
  if (rootCause.includes('proguard') || rootCause.includes('r8')) diagnosis += 35;
  if (rootCause.includes('obfuscat') || rootCause.includes('minif')) diagnosis += 30;
  if (rootCause.includes('release') && rootCause.includes('build')) diagnosis += 20;
  if (rootCause.includes('keep') || rootCause.includes('rule')) diagnosis += 15;

  // Solution: Should mention proguard-rules.pro and specific rules
  const fix = (Array.isArray(result.fixGuidelines) ? result.fixGuidelines.join(' ') : result.fixGuidelines || '').toLowerCase();
  if (fix.includes('proguard-rules.pro')) solution += 35;
  if (fix.includes('-keep') || fix.includes('keep class')) solution += 30;
  if (fix.includes('retrofit') || fix.includes('apiservice')) solution += 20;
  if (fix.includes('interface') || fix.includes('annotation')) solution += 15;

  // File identification: Should specify proguard-rules.pro
  if (fix.includes('proguard-rules.pro') || fix.includes('app/proguard-rules.pro')) fileId += 100;
  else if (fix.includes('proguard')) fileId += 50;

  // Code examples: Should show exact ProGuard rules
  const code = result.codeFix?.diff || result.fixGuidelines?.join(' ') || '';
  if (code.includes('-keep')) codeEx += 40;
  if (code.includes('interface') || code.includes('**')) codeEx += 30;
  if (code.includes('Retrofit') || code.includes('retrofit2')) codeEx += 30;

  const overall = (diagnosis + solution + fileId + codeEx) / 4;

  return {
    diagnosis_accuracy: Math.min(100, diagnosis),
    solution_specificity: Math.min(100, solution),
    file_identification: Math.min(100, fileId),
    code_examples: Math.min(100, codeEx),
    version_suggestions: -1, // N/A for ProGuard errors
    overall_usability: Math.min(100, Math.round(overall)),
    confidence: result.confidence || 0,
    latency_ms: latency
  };
}

function getStatusEmoji(value: number, target: number): string {
  if (value >= target) return '[OK]';
  if (value >= target * 0.8) return '[WARN]';
  return '[X]';
}

// Run test
runTest9ProGuard().catch(console.error);
