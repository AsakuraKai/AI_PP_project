/**
 * Chunk 8 - Test 6: Manifest Permission Missing
 * 
 * Tests the agent's ability to diagnose and fix Android manifest permission errors
 * that cause runtime SecurityException crashes.
 * 
 * Error Type: XML/Manifest configuration
 * Challenge: Runtime error, requires Manifest update, not code change
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

async function runTest6ManifestPermission(): Promise<void> {
  console.log('\n🧪 CHUNK 8 - TEST 6: MANIFEST PERMISSION MISSING\n');
  console.log('=' .repeat(80));
  
  const projectRoot = path.join(__dirname, '../tests/fixtures/test6-manifest-permission');
  
  // Test project structure
  const testFiles = {
    'AndroidManifest.xml': `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.manifesttest">

    <!-- Missing: <uses-permission android:name="android.permission.CAMERA" /> -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.AppCompat">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`,
    
    'MainActivity.kt': `package com.example.manifesttest

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // This will crash at runtime due to missing permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 1)
        }
    }
}`,
    
    'build.gradle': `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.example.manifesttest"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.core:core-ktx:1.12.0'
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
  
  // Runtime error log
  const errorLog = `FATAL EXCEPTION: main
Process: com.example.manifesttest, PID: 12345
java.lang.SecurityException: Permission Denial: starting Intent { act=android.media.action.IMAGE_CAPTURE } from ProcessRecord{abc123 12345:com.example.manifesttest/u0a123} (pid=12345, uid=10123) requires android.permission.CAMERA
    at android.os.Parcel.createExceptionOrNull(Parcel.java:3010)
    at android.os.Parcel.createException(Parcel.java:2994)
    at android.os.Parcel.readException(Parcel.java:2977)
    at android.os.Parcel.readException(Parcel.java:2919)
    at android.app.IActivityManager$Stub$Proxy.startActivity(IActivityManager.java:5140)
    at android.app.Instrumentation.execStartActivity(Instrumentation.java:1730)
    at android.app.Activity.startActivityForResult(Activity.java:5325)
    at androidx.activity.ComponentActivity.startActivityForResult(ComponentActivity.java:736)
    at android.app.Activity.startActivityForResult(Activity.java:5283)
    at androidx.activity.ComponentActivity.startActivityForResult(ComponentActivity.java:722)
    at android.app.Activity.startActivity(Activity.java:5674)
    at com.example.manifesttest.MainActivity.onCreate(MainActivity.kt:15)
    at android.app.Activity.performCreate(Activity.java:8595)
    at android.app.Activity.performCreate(Activity.java:8573)
    at android.app.Instrumentation.callActivityOnCreate(Instrumentation.java:1456)
    at android.app.ActivityThread.performLaunchActivity(ActivityThread.java:3768)`;
  
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
      type: 'runtime_security',
      message: errorLog,
      stackTrace: [],
      filePath: 'MainActivity.kt',
      line: 15,
      column: 0,
      language: 'kotlin'
    });
    
    const latency = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST 6 RESULTS\n');
    
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
    console.log(`Version Suggestions:     N/A (not applicable for manifest errors)`);
    console.log(`Overall Usability:       ${metrics.overall_usability}% ${getStatusEmoji(metrics.overall_usability, 75)}`);
    console.log(`Confidence:              ${(metrics.confidence * 100).toFixed(0)}%`);
    console.log(`Latency:                 ${(metrics.latency_ms/1000).toFixed(2)}s ${getStatusEmoji(metrics.latency_ms < 20000 ? 100 : 50, 80)}`);
    
    // Save results
    const resultsDir = path.join(__dirname, '../tests/results/chunk8');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsFile = path.join(resultsDir, `test6-manifest-${timestamp}.json`);
    
    await fs.writeFile(resultsFile, JSON.stringify({
      test: 'Test 6: Manifest Permission Missing',
      timestamp: new Date().toISOString(),
      metrics,
      agentOutput: result,
      errorLog,
      projectRoot
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📝 TEST 6 SUMMARY\n');
    
    if (metrics.overall_usability >= 75) {
      console.log('✅ TEST PASSED - Usability target exceeded!');
    } else if (metrics.overall_usability >= 60) {
      console.log('⚠️  TEST PARTIAL - Usability acceptable but below target');
    } else {
      console.log('❌ TEST FAILED - Usability below acceptable threshold');
    }
    
    console.log(`\nTarget: 75%+ usability`);
    console.log(`Actual: ${metrics.overall_usability}%`);
    console.log(`Difference: ${metrics.overall_usability >= 75 ? '+' : ''}${(metrics.overall_usability - 75).toFixed(1)}%`);
    
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
  
  // Diagnosis: Should identify missing CAMERA permission
  const rootCause = result.rootCause?.toLowerCase() || '';
  if (rootCause.includes('permission') && rootCause.includes('camera')) diagnosis += 50;
  if (rootCause.includes('manifest') || rootCause.includes('androidmanifest')) diagnosis += 30;
  if (rootCause.includes('missing') || rootCause.includes('denied')) diagnosis += 20;
  
  // Solution: Should specify exact permission and where to add it
  const fix = (Array.isArray(result.fixGuidelines) ? result.fixGuidelines.join(' ') : result.fixGuidelines || '').toLowerCase();
  if (fix.includes('androidmanifest.xml')) solution += 30;
  if (fix.includes('uses-permission') || fix.includes('<uses-permission')) solution += 30;
  if (fix.includes('android.permission.camera')) solution += 30;
  if (fix.includes('before') || fix.includes('inside') || fix.includes('<application')) solution += 10;
  
  // File identification: Should mention AndroidManifest.xml
  if (fix.includes('androidmanifest.xml')) fileId += 100;
  else if (fix.includes('manifest')) fileId += 50;
  
  // Code examples: Should show the XML tag
  const code = result.codeFix?.diff || result.fixGuidelines?.join(' ') || '';
  if (code.includes('<uses-permission')) codeEx += 60;
  if (code.includes('android:name="android.permission.CAMERA"')) codeEx += 40;
  
  const overall = (diagnosis + solution + fileId + codeEx) / 4;
  
  return {
    diagnosis_accuracy: Math.min(100, diagnosis),
    solution_specificity: Math.min(100, solution),
    file_identification: Math.min(100, fileId),
    code_examples: Math.min(100, codeEx),
    version_suggestions: -1, // N/A for manifest errors
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
runTest6ManifestPermission().catch(console.error);
