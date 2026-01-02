/**
 * Chunk 8 - Test 10: Jetpack Navigation Argument Mismatch
 * 
 * Tests the agent's ability to diagnose and fix Navigation component
 * type mismatch errors in Compose.
 * 
 * Error Type: Compose / Navigation
 * Challenge: Kotlin DSL navigation, type safety issue
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

async function runTest10Navigation(): Promise<void> {
  console.log('\n🧪 CHUNK 8 - TEST 10: JETPACK NAVIGATION ARGUMENT MISMATCH\n');
  console.log('='.repeat(80));
  
  const projectRoot = path.join(__dirname, '../tests/fixtures/test10-navigation');
  
  // Test project structure
  const testFiles = {
    'app/build.gradle': `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.example.navtest"
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
    implementation 'androidx.navigation:navigation-compose:2.7.5'
}`,
    
    'app/src/main/kotlin/Navigation.kt': `package com.example.navtest

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onNavigateToProfile = { userId ->
                    // Passing String but profile expects Int
                    navController.navigate("profile/\${userId}")
                }
            )
        }
        
        composable(
            route = "profile/{userId}",
            arguments = listOf(
                navArgument("userId") {
                    type = NavType.IntType  // Expects Int
                }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getInt("userId") ?: 0
            ProfileScreen(userId = userId)
        }
    }
}

@Composable
fun HomeScreen(onNavigateToProfile: (String) -> Unit) {
    // User clicks button, passes String ID
    // But should pass Int or convert properly
}

@Composable
fun ProfileScreen(userId: Int) {
    // Expects Int userId
}`,
    
    'app/src/main/kotlin/MainActivity.kt': `package com.example.navtest

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val navController = rememberNavController()
            AppNavigation(navController = navController)
        }
    }
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
  
  // Navigation error log
  const errorLog = `FATAL EXCEPTION: main
Process: com.example.navtest, PID: 12345
java.lang.IllegalArgumentException: Wrong argument type for 'userId' in argument bundle. Found String, expected int
    at androidx.navigation.NavType$Companion$IntType$1.get(NavType.kt:99)
    at androidx.navigation.NavType$Companion$IntType$1.get(NavType.kt:94)
    at androidx.navigation.NavBackStackEntry.handleLifecycleEvent(NavBackStackEntry.kt:152)
    at androidx.navigation.compose.NavHostKt$NavHost$10$1.invoke(NavHost.kt:177)
    at androidx.navigation.compose.NavHostKt$NavHost$10$1.invoke(NavHost.kt:176)
    at androidx.compose.runtime.DisposableEffectImpl.onRemembered(Effects.kt:82)

Error occurs when navigating from HomeScreen to ProfileScreen.
HomeScreen passes: navController.navigate("profile/\${userId}") where userId is a String
ProfileScreen expects: navArgument("userId") { type = NavType.IntType }

Type mismatch: String → Int`;
  
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
      type: 'runtime_illegalargument',
      message: errorLog,
      stackTrace: [],
      filePath: 'app/src/main/kotlin/Navigation.kt',
      line: 17,
      column: 0,
      language: 'kotlin'
    });
    
    const latency = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST 10 RESULTS\n');
    
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
    console.log(`Version Suggestions:     N/A (not applicable for navigation errors)`);
    console.log(`Overall Usability:       ${metrics.overall_usability}% ${getStatusEmoji(metrics.overall_usability, 80)}`);
    console.log(`Confidence:              ${(metrics.confidence * 100).toFixed(0)}%`);
    console.log(`Latency:                 ${(metrics.latency_ms/1000).toFixed(2)}s ${getStatusEmoji(metrics.latency_ms < 20000 ? 100 : 50, 80)}`);
    
    // Save results
    const resultsDir = path.join(__dirname, '../tests/results/chunk8');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsFile = path.join(resultsDir, `test10-navigation-${timestamp}.json`);
    
    await fs.writeFile(resultsFile, JSON.stringify({
      test: 'Test 10: Jetpack Navigation Argument Mismatch',
      timestamp: new Date().toISOString(),
      metrics,
      agentOutput: result,
      errorLog,
      projectRoot
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📝 TEST 10 SUMMARY\n');
    
    if (metrics.overall_usability >= 80) {
      console.log('✅ TEST PASSED - Usability target exceeded!');
    } else if (metrics.overall_usability >= 65) {
      console.log('⚠️  TEST PARTIAL - Usability acceptable but below target');
    } else {
      console.log('❌ TEST FAILED - Usability below acceptable threshold');
    }
    
    console.log(`\nTarget: 80%+ usability`);
    console.log(`Actual: ${metrics.overall_usability}%`);
    console.log(`Difference: ${metrics.overall_usability >= 80 ? '+' : ''}${(metrics.overall_usability - 80).toFixed(1)}%`);
    
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
  
  // Diagnosis: Should identify type mismatch in navigation arguments
  const rootCause = result.rootCause?.toLowerCase() || '';
  if (rootCause.includes('type') && rootCause.includes('mismatch')) diagnosis += 30;
  if (rootCause.includes('navigation') || rootCause.includes('navargument')) diagnosis += 30;
  if (rootCause.includes('string') && rootCause.includes('int')) diagnosis += 25;
  if (rootCause.includes('userid')) diagnosis += 15;
  
  // Solution: Should explain to either change navArgument type or convert value
  const fix = (Array.isArray(result.fixGuidelines) ? result.fixGuidelines.join(' ') : result.fixGuidelines || '').toLowerCase();
  if (fix.includes('navtype.stringtype') || fix.includes('navtype.inttype')) solution += 35;
  if (fix.includes('toint()') || fix.includes('convert')) solution += 25;
  if (fix.includes('navigation.kt') || fix.includes('line')) solution += 20;
  if (fix.includes('either') || fix.includes('option')) solution += 20;
  
  // File identification: Should specify Navigation.kt
  if (fix.includes('navigation.kt')) fileId += 100;
  else if (fix.includes('navigation')) fileId += 60;
  
  // Code examples: Should show before/after for both options
  const code = result.codeFix?.diff || result.fixGuidelines?.join(' ') || '';
  if (code.includes('NavType.StringType') || code.includes('NavType.IntType')) codeEx += 40;
  if (code.includes('.toInt()') || code.includes('$')) codeEx += 30;
  if (code.includes('navArgument(') || code.includes('arguments')) codeEx += 30;
  
  const overall = (diagnosis + solution + fileId + codeEx) / 4;
  
  return {
    diagnosis_accuracy: Math.min(100, diagnosis),
    solution_specificity: Math.min(100, solution),
    file_identification: Math.min(100, fileId),
    code_examples: Math.min(100, codeEx),
    version_suggestions: -1, // N/A for navigation errors
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
runTest10Navigation().catch(console.error);
