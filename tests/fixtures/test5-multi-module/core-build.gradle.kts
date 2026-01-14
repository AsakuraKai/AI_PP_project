// core/build.gradle.kts
// Core library module
//
// This module uses lifecycle 2.5.0 which conflicts with :app module's 2.6.0

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.core"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        targetSdk = 34
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    
    // Line 22: OLD version causing conflict
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.5.0")  // CONFLICT with :app's 2.6.0!
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.5.0")
    
    // Kotlin coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}

/*
  This :core module is a shared library used by :app
  
  When :app depends on :core, Gradle sees:
  - :app wants lifecycle 2.6.0
  - :core wants lifecycle 2.5.0
  - CONFLICT!
  
  Solution: Both modules should use the same version (preferably via version catalog)
*/
