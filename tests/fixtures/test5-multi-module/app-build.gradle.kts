// app/build.gradle.kts
// Main application module
//
// ERROR: Dependency version conflict between :app and :core modules
//
// Problem at line 45:
// - :app module requires androidx.lifecycle:lifecycle-runtime-ktx:2.6.0
// - :core module requires androidx.lifecycle:lifecycle-runtime-ktx:2.5.0
// - Gradle can't resolve the conflict
//
// Error message:
//   Conflict with dependency 'androidx.lifecycle:lifecycle-runtime-ktx' in project ':app'
//   Requested versions: 2.6.0 (by :app), 2.5.0 (by :core)

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.multimodule"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.multimodule"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }
}

dependencies {
    // Line 45: Version conflict starts here
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.0")  // Requires 2.6.0
    implementation("androidx.activity:activity-compose:1.8.0")
    
    // Project module dependency (uses lifecycle 2.5.0)
    implementation(project(":core"))  // CONFLICT! core uses 2.5.0
    
    // Compose dependencies
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    
    debugImplementation("androidx.compose.ui:ui-tooling")
}

/*
  GRADLE ERROR OUTPUT:
  
  > Task :app:checkDebugDuplicateClasses FAILED
  
  Execution failed for task ':app:checkDebugDuplicateClasses'.
  > A failure occurred while executing com.android.build.gradle.internal.tasks.CheckDuplicatesRunnable
     > Duplicate class androidx.lifecycle.ViewModel found in modules:
         lifecycle-runtime-ktx-2.6.0 (androidx.lifecycle:lifecycle-runtime-ktx:2.6.0)
         lifecycle-runtime-ktx-2.5.0 (androidx.lifecycle:lifecycle-runtime-ktx:2.5.0)
  
  FIX: Align versions across all modules using gradle/libs.versions.toml
  
  Option 1: Force version in root build.gradle.kts
    configurations.all {
        resolutionStrategy {
            force("androidx.lifecycle:lifecycle-runtime-ktx:2.6.0")
        }
    }
  
  Option 2: Use version catalog (RECOMMENDED)
    gradle/libs.versions.toml:
    [versions]
    lifecycle = "2.6.0"
    
    [libraries]
    androidx-lifecycle-runtime = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle" }
    
    Then in both :app and :core:
    dependencies {
        implementation(libs.androidx.lifecycle.runtime)
    }
  
  Option 3: Update :core module to use 2.6.0
    core/build.gradle.kts:
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.0")
*/
