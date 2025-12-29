/**
 * Build Cache Few-Shot Examples (Chunk 9 - Priority 3)
 * 5 examples for build cache corruption errors
 */

import { FewShotExample } from '../FewShotExampleService';

export const BUILD_CACHE_EXAMPLES: FewShotExample[] = [
  {
    id: 'cache_gradle_daemon_died',
    errorType: 'BUILD_CACHE',
    error: `Gradle build daemon disappeared unexpectedly (it may have been killed or may have crashed)`,
    diagnosis: {
      problem: 'Gradle daemon process terminated unexpectedly during build',
      rootCause: 'Corrupted daemon state, memory issues, or system instability',
      evidence: 'Error message indicates daemon disappeared during operation',
      confidence: 0.9
    },
    solution: {
      summary: 'Stop Gradle daemon, clear caches, and restart build',
      specificFix: `Run these commands in order:

1. Stop all Gradle daemons:
   ./gradlew --stop

2. Clean build outputs:
   ./gradlew clean

3. Clear Gradle caches (if issue persists):
   rm -rf ~/.gradle/caches/
   (Windows: rmdir /s /q %USERPROFILE%\\.gradle\\caches)

4. Restart Android Studio and sync Gradle

5. Rebuild project:
   ./gradlew build`,
      fileIdentification: 'N/A (command-line fix)',
      codeExamples: [],
      verificationSteps: [
        'Run ./gradlew --stop',
        'Run ./gradlew clean',
        'Sync Gradle in Android Studio',
        'Build should complete without daemon crash'
      ]
    }
  },

  {
    id: 'cache_incremental_compilation_failed',
    errorType: 'BUILD_CACHE',
    error: `Internal error in Kotlin incremental compilation
    Caused by: java.io.IOException: Could not read file: .gradle/caches/transforms-X/files-X.bin`,
    diagnosis: {
      problem: 'Kotlin incremental compilation cache corrupted',
      rootCause: 'Corrupted cache files in .gradle/caches directory, possibly from interrupted build',
      evidence: 'IOException reading cache files, incremental compilation state invalid',
      confidence: 0.95
    },
    solution: {
      summary: 'Clean Kotlin caches and rebuild',
      specificFix: `1. Clean build outputs:
   ./gradlew clean

2. Delete Kotlin incremental compilation cache:
   rm -rf .gradle/caches/
   (Windows: rmdir /s /q .gradle\\caches)

3. Invalidate Android Studio caches:
   File → Invalidate Caches → Invalidate and Restart

4. Rebuild project:
   ./gradlew build

Optional: Disable incremental compilation temporarily in gradle.properties:
   kotlin.incremental=false`,
      fileIdentification: '.gradle/caches/ (directory)',
      codeExamples: [],
      verificationSteps: [
        'Delete .gradle/caches/',
        'Invalidate IDE caches',
        'Clean and rebuild',
        'Verify build completes'
      ]
    }
  },

  {
    id: 'cache_build_cache_corrupt',
    errorType: 'BUILD_CACHE',
    error: `Could not load cache value for task ':app:compileDebugKotlin'
    Caused by: java.lang.IllegalStateException: Could not open cache directory`,
    diagnosis: {
      problem: 'Gradle build cache directory corrupted or locked',
      rootCause: 'Build cache state corrupted, possibly from concurrent builds or system crash',
      evidence: 'IllegalStateException opening cache directory, cache metadata invalid',
      confidence: 0.9
    },
    solution: {
      summary: 'Clear build cache and rebuild',
      specificFix: `1. Stop any running Gradle processes:
   ./gradlew --stop

2. Clean build outputs:
   ./gradlew clean

3. Clear build cache:
   ./gradlew cleanBuildCache

4. Delete cache directory manually:
   rm -rf .gradle/caches/ .gradle/build-cache/
   (Windows: rmdir /s /q .gradle\\caches .gradle\\build-cache)

5. Rebuild:
   ./gradlew build --no-build-cache

Optional: Disable build cache in gradle.properties:
   org.gradle.caching=false`,
      fileIdentification: '.gradle/caches/, .gradle/build-cache/',
      codeExamples: [],
      verificationSteps: [
        'Stop Gradle daemon',
        'Delete cache directories',
        'Rebuild without build cache',
        'Re-enable caching if fixed'
      ]
    }
  },

  {
    id: 'cache_lock_timeout',
    errorType: 'BUILD_CACHE',
    error: `Timeout waiting to lock file cache (~/.gradle/caches/modules-2/files-2.1).
    It is currently in use by another Gradle instance.`,
    diagnosis: {
      problem: 'Multiple Gradle instances trying to access cache simultaneously',
      rootCause: 'Another Gradle build running, or orphaned lock file from crashed process',
      evidence: 'Lock timeout error, cache directory locked by another process',
      confidence: 0.95
    },
    solution: {
      summary: 'Stop all Gradle processes and clear lock files',
      specificFix: `1. Stop all Gradle daemons:
   ./gradlew --stop

2. Check for running Gradle processes:
   ps aux | grep gradle (Linux/Mac)
   tasklist | findstr gradle (Windows)

3. Kill orphaned Gradle processes if found:
   kill -9 <PID> (Linux/Mac)
   taskkill /F /PID <PID> (Windows)

4. Remove lock files manually:
   rm ~/.gradle/caches/modules-2/*.lock
   rm ~/.gradle/caches/*/*.lock
   (Windows: del %USERPROFILE%\\.gradle\\caches\\modules-2\\*.lock)

5. Restart build:
   ./gradlew build`,
      fileIdentification: '~/.gradle/caches/ (lock files)',
      codeExamples: [],
      verificationSteps: [
        'Stop all Gradle processes',
        'Remove .lock files',
        'Restart build',
        'Verify no lock timeout'
      ]
    }
  },

  {
    id: 'cache_metadata_corrupt',
    errorType: 'BUILD_CACHE',
    error: `Could not read metadata for dependency: androidx.compose.ui:ui:1.6.0
    Caused by: java.io.InvalidClassException: invalid stream header`,
    diagnosis: {
      problem: 'Corrupted dependency metadata cache',
      rootCause: 'Cache metadata files corrupted, possibly from Gradle version upgrade or interrupted download',
      evidence: 'InvalidClassException reading metadata, serialized data invalid',
      confidence: 0.9
    },
    solution: {
      summary: 'Clear dependency cache and re-download',
      specificFix: `1. Clean Gradle dependency cache:
   rm -rf ~/.gradle/caches/modules-2/
   (Windows: rmdir /s /q %USERPROFILE%\\.gradle\\caches\\modules-2)

2. Force refresh dependencies:
   ./gradlew build --refresh-dependencies

3. If issue persists, clear all caches:
   rm -rf ~/.gradle/caches/
   ./gradlew clean
   ./gradlew build --refresh-dependencies

4. Verify in build.gradle repositories are correct:
   repositories {
       google()
       mavenCentral()
   }`,
      fileIdentification: '~/.gradle/caches/modules-2/',
      codeExamples: [],
      verificationSteps: [
        'Delete modules-2 cache',
        'Run with --refresh-dependencies',
        'Verify dependencies download',
        'Build completes successfully'
      ]
    }
  }
];
