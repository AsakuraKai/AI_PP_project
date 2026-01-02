/**
 * Chunk 8 - Test 7: Gradle Sync Failed (Network)
 * 
 * Tests the agent's ability to diagnose and fix Gradle dependency resolution failures
 * caused by network/repository connectivity issues.
 * 
 * Error Type: Build system / dependency resolution
 * Challenge: Non-code issue, requires configuration fix (repository setup, proxy, etc.)
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

async function runTest7GradleNetwork(): Promise<void> {
  console.log('\n🧪 CHUNK 8 - TEST 7: GRADLE SYNC FAILED (NETWORK)\n');
  console.log('='.repeat(80));
  
  const projectRoot = path.join(__dirname, '../tests/fixtures/test7-gradle-network');
  
  // Test project structure
  const testFiles = {
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
include ':app'`
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
  
  // Network error log
  const errorLog = `FAILURE: Build failed with an exception.

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
      > Could not resolve com.company.internal:sdk:2.0.0.
         > Could not get resource 'https://repo.maven.apache.org/maven2/com/company/internal/sdk/2.0.0/sdk-2.0.0.pom'.
            > Could not GET 'https://repo.maven.apache.org/maven2/com/company/internal/sdk/2.0.0/sdk-2.0.0.pom'.
               > Read timed out

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.`;
  
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
      type: 'gradle_sync',
      message: errorLog,
      stackTrace: [],
      filePath: 'app/build.gradle',
      line: 18,
      column: 0,
      language: 'gradle'
    });
    
    const latency = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST 7 RESULTS\n');
    
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
    console.log(`Version Suggestions:     N/A (not applicable for network errors)`);
    console.log(`Overall Usability:       ${metrics.overall_usability}% ${getStatusEmoji(metrics.overall_usability, 70)}`);
    console.log(`Confidence:              ${(metrics.confidence * 100).toFixed(0)}%`);
    console.log(`Latency:                 ${(metrics.latency_ms/1000).toFixed(2)}s ${getStatusEmoji(metrics.latency_ms < 20000 ? 100 : 50, 80)}`);
    
    // Save results
    const resultsDir = path.join(__dirname, '../tests/results/chunk8');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsFile = path.join(resultsDir, `test7-gradle-network-${timestamp}.json`);
    
    await fs.writeFile(resultsFile, JSON.stringify({
      test: 'Test 7: Gradle Sync Failed (Network)',
      timestamp: new Date().toISOString(),
      metrics,
      agentOutput: result,
      errorLog,
      projectRoot
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📝 TEST 7 SUMMARY\n');
    
    if (metrics.overall_usability >= 70) {
      console.log('✅ TEST PASSED - Usability target exceeded!');
    } else if (metrics.overall_usability >= 55) {
      console.log('⚠️  TEST PARTIAL - Usability acceptable but below target');
    } else {
      console.log('❌ TEST FAILED - Usability below acceptable threshold');
    }
    
    console.log(`\nTarget: 70%+ usability`);
    console.log(`Actual: ${metrics.overall_usability}%`);
    console.log(`Difference: ${metrics.overall_usability >= 70 ? '+' : ''}${(metrics.overall_usability - 70).toFixed(1)}%`);
    
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
  
  // Diagnosis: Should identify network/repository issue
  const rootCause = result.rootCause?.toLowerCase() || '';
  if (rootCause.includes('network') || rootCause.includes('connection')) diagnosis += 30;
  if (rootCause.includes('repository') || rootCause.includes('maven')) diagnosis += 30;
  if (rootCause.includes('timeout') || rootCause.includes('unreachable')) diagnosis += 20;
  if (rootCause.includes('custom-internal-repo') || rootCause.includes('internal')) diagnosis += 20;
  
  // Solution: Should suggest removing internal repo or adding VPN/proxy
  const fix = (Array.isArray(result.fixGuidelines) ? result.fixGuidelines.join(' ') : result.fixGuidelines || '').toLowerCase();
  if (fix.includes('remove') && fix.includes('repository')) solution += 30;
  if (fix.includes('build.gradle') || fix.includes('settings.gradle')) solution += 25;
  if (fix.includes('vpn') || fix.includes('proxy') || fix.includes('network')) solution += 15;
  if (fix.includes('maven { url')) solution += 15;
  if (fix.includes('comment') || fix.includes('//') || fix.includes('delete')) solution += 15;
  
  // File identification: Should mention build.gradle or settings.gradle
  if (fix.includes('build.gradle') && fix.includes('settings.gradle')) fileId += 100;
  else if (fix.includes('build.gradle') || fix.includes('settings.gradle')) fileId += 70;
  
  // Code examples: Should show how to remove/comment repository
  const code = result.codeFix?.diff || result.fixGuidelines?.join(' ') || '';
  if (code.includes('//') && code.includes('maven')) codeEx += 50;
  if (code.includes('repositories {')) codeEx += 30;
  if (code.includes('custom-internal-repo') || code.includes('remove this line')) codeEx += 20;
  
  const overall = (diagnosis + solution + fileId + codeEx) / 4;
  
  return {
    diagnosis_accuracy: Math.min(100, diagnosis),
    solution_specificity: Math.min(100, solution),
    file_identification: Math.min(100, fileId),
    code_examples: Math.min(100, codeEx),
    version_suggestions: -1, // N/A for network errors
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
runTest7GradleNetwork().catch(console.error);
