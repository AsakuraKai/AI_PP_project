/**
 * Chunk 8 - Test 6: Manifest Permission Missing
 * 
 * REFACTORED: Now uses shared TestHarness to eliminate duplication
 * 
 * Tests the agent's ability to diagnose and fix Android manifest permission errors
 * that cause runtime SecurityException crashes.
 */

import { createTestHarness, TestConfig } from './shared/test-harness';
import * as path from 'path';

async function runTest6ManifestPermission(): Promise<void> {
  const testConfig: TestConfig = {
    testNumber: 6,
    testName: 'Test 6: Manifest Permission Missing',
    description: 'Runtime error, requires Manifest update, not code change',
    errorType: 'security',
    projectRoot: path.join(__dirname, '../tests/fixtures/test6-manifest-permission'),
    errorLog: `FATAL EXCEPTION: main
Process: com.example.manifesttest, PID: 12345
java.lang.SecurityException: Permission Denial: starting Intent { act=android.media.action.IMAGE_CAPTURE } from ProcessRecord{abc123 12345:com.example.manifesttest/u0a123} (pid=12345, uid=10123) requires android.permission.CAMERA
    at android.os.Parcel.createExceptionOrNull(Parcel.java:3010)
    at android.os.Parcel.createException(Parcel.java:2994)
    at android.os.Parcel.readException(Parcel.java:2977)
    at android.os.Parcel.readException(Parcel.java:2919)
    at android.app.IActivityManager$Stub$Proxy.startActivity(IActivityManager.java:5140)
    at android.app.Instrumentation.execStartActivity(Instrumentation.java:1730)
    at android.app.Activity.startActivityForResult(Activity.java:5325)
    at com.example.manifesttest.MainActivity.onCreate(MainActivity.kt:15)`,
    errorContext: {
      filePath: 'MainActivity.kt',
      line: 15,
      column: 0,
      language: 'kotlin',
    },
    expectedDiagnosis: ['permission', 'camera', 'manifest', 'missing'],
    expectedSolution: ['androidmanifest.xml', 'uses-permission', 'android.permission.camera'],
    testFiles: {
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
}`,
    },
  };

  const harness = createTestHarness();
  await harness.runTest(testConfig);
}

// Run test if executed directly
if (require.main === module) {
  runTest6ManifestPermission()
    .then(() => {
      console.log('\n✅ Test 6 complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { runTest6ManifestPermission };
