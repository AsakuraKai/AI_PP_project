/**
 * Chunk 8 - Test 10: Jetpack Navigation Argument Mismatch
 * 
 * REFACTORED: Now uses shared TestHarness to eliminate duplication
 * 
 * Tests the agent's ability to diagnose and fix Navigation component
 * type mismatch errors in Compose.
 */

import { createTestHarness, TestConfig } from './shared/test-harness';
import * as path from 'path';

async function runTest10Navigation(): Promise<void> {
  const testConfig: TestConfig = {
    testNumber: 10,
    testName: 'Test 10: Jetpack Navigation Argument Mismatch',
    description: 'Kotlin DSL navigation, type safety issue',
    errorType: 'navigation',
    projectRoot: path.join(__dirname, '../tests/fixtures/test10-navigation'),
    errorLog: `FATAL EXCEPTION: main
Process: com.example.navtest, PID: 12345
java.lang.IllegalArgumentException: Wrong argument type for 'userId' in argument bundle. Found String, expected int
    at androidx.navigation.NavType$Companion$IntType$1.get(NavType.kt:99)
    at androidx.navigation.NavType$Companion$IntType$1.get(NavType.kt:94)
    at androidx.navigation.NavBackStackEntry.handleLifecycleEvent(NavBackStackEntry.kt:152)
    at androidx.navigation.compose.NavHostKt$NavHost$10$1.invoke(NavHost.kt:177)
    at androidx.compose.runtime.DisposableEffectImpl.onRemembered(Effects.kt:82)`,
    errorContext: {
      filePath: 'Navigation.kt',
      line: 0,
      column: 0,
      language: 'kotlin',
    },
    expectedDiagnosis: ['navigation', 'argument', 'type', 'mismatch', 'string', 'int'],
    expectedSolution: ['navargument', 'navtype', 'inttype', 'toint', 'convert'],
    testFiles: {
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
}`,
    },
  };

  const harness = createTestHarness();
  await harness.runTest(testConfig);
}

// Run test if executed directly
if (require.main === module) {
  runTest10Navigation()
    .then(() => {
      console.log('\n[OK] Test 10 complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n[X] Test failed:', error);
      process.exit(1);
    });
}

export { runTest10Navigation };
