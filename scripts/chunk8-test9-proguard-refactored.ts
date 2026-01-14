/**
 * Chunk 8 - Test 9: R8/ProGuard Rule Missing
 * 
 * REFACTORED: Now uses shared TestHarness to eliminate duplication
 * 
 * Tests the agent's ability to diagnose and fix release build crashes
 * caused by missing ProGuard/R8 rules.
 */

import { createTestHarness, TestConfig } from './shared/test-harness';
import * as path from 'path';

async function runTest9ProGuard(): Promise<void> {
  const testConfig: TestConfig = {
    testNumber: 9,
    testName: 'Test 9: R8/ProGuard Rule Missing',
    description: 'Only appears in release builds, requires ProGuard configuration',
    errorType: 'proguard',
    projectRoot: path.join(__dirname, '../tests/fixtures/test9-proguard'),
    errorLog: `FATAL EXCEPTION: main
Process: com.example.proguardtest, PID: 12345
java.lang.NoSuchMethodError: No interface method getUsers()Lretrofit2/Call; in class Lcom/example/proguardtest/ApiService; or its super classes (declaration of 'com.example.proguardtest.ApiService' appears in /data/app/~~xyz==/com.example.proguardtest-abc123==/base.apk)
    at com.example.proguardtest.MainActivity.onCreate(MainActivity.kt:15)
    at android.app.Activity.performCreate(Activity.java:8595)

Note: This error only occurs in RELEASE builds with minifyEnabled = true
In DEBUG builds, the app works perfectly fine.

R8 has obfuscated/removed the ApiService interface methods because it thinks they're unused.
Need to add ProGuard rules to keep Retrofit interfaces.`,
    errorContext: {
      filePath: 'MainActivity.kt',
      line: 15,
      column: 0,
      language: 'kotlin',
    },
    expectedDiagnosis: ['proguard', 'r8', 'obfuscation', 'minify', 'retrofit', 'interface'],
    expectedSolution: ['proguard-rules.pro', '-keep', 'retrofit', 'interface', 'serializable'],
    testFiles: {
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
}`,
    },
  };

  const harness = createTestHarness();
  await harness.runTest(testConfig);
}

// Run test if executed directly
if (require.main === module) {
  runTest9ProGuard()
    .then(() => {
      console.log('\n[OK] Test 9 complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n[X] Test failed:', error);
      process.exit(1);
    });
}

export { runTest9ProGuard };
