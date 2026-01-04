"use strict";
/**
 * Build Cache Few-Shot Examples (Chunk 9 - Priority 3)
 * 5 examples for build cache corruption errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILD_CACHE_EXAMPLES = void 0;
exports.BUILD_CACHE_EXAMPLES = [
    {
        id: 'cache_gradle_daemon_died',
        errorType: 'BUILD_CACHE',
        error: "Gradle build daemon disappeared unexpectedly (it may have been killed or may have crashed)",
        diagnosis: {
            problem: 'Gradle daemon process terminated unexpectedly during build',
            rootCause: 'Corrupted daemon state, memory issues, or system instability',
            evidence: 'Error message indicates daemon disappeared during operation',
            confidence: 0.9
        },
        solution: {
            summary: 'Stop Gradle daemon, clear caches, and restart build',
            specificFix: "Run these commands in order:\n\n1. Stop all Gradle daemons:\n   ./gradlew --stop\n\n2. Clean build outputs:\n   ./gradlew clean\n\n3. Clear Gradle caches (if issue persists):\n   rm -rf ~/.gradle/caches/\n   (Windows: rmdir /s /q %USERPROFILE%\\.gradle\\caches)\n\n4. Restart Android Studio and sync Gradle\n\n5. Rebuild project:\n   ./gradlew build",
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
        error: "Internal error in Kotlin incremental compilation\n    Caused by: java.io.IOException: Could not read file: .gradle/caches/transforms-X/files-X.bin",
        diagnosis: {
            problem: 'Kotlin incremental compilation cache corrupted',
            rootCause: 'Corrupted cache files in .gradle/caches directory, possibly from interrupted build',
            evidence: 'IOException reading cache files, incremental compilation state invalid',
            confidence: 0.95
        },
        solution: {
            summary: 'Clean Kotlin caches and rebuild',
            specificFix: "1. Clean build outputs:\n   ./gradlew clean\n\n2. Delete Kotlin incremental compilation cache:\n   rm -rf .gradle/caches/\n   (Windows: rmdir /s /q .gradle\\caches)\n\n3. Invalidate Android Studio caches:\n   File \u2192 Invalidate Caches \u2192 Invalidate and Restart\n\n4. Rebuild project:\n   ./gradlew build\n\nOptional: Disable incremental compilation temporarily in gradle.properties:\n   kotlin.incremental=false",
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
        error: "Could not load cache value for task ':app:compileDebugKotlin'\n    Caused by: java.lang.IllegalStateException: Could not open cache directory",
        diagnosis: {
            problem: 'Gradle build cache directory corrupted or locked',
            rootCause: 'Build cache state corrupted, possibly from concurrent builds or system crash',
            evidence: 'IllegalStateException opening cache directory, cache metadata invalid',
            confidence: 0.9
        },
        solution: {
            summary: 'Clear build cache and rebuild',
            specificFix: "1. Stop any running Gradle processes:\n   ./gradlew --stop\n\n2. Clean build outputs:\n   ./gradlew clean\n\n3. Clear build cache:\n   ./gradlew cleanBuildCache\n\n4. Delete cache directory manually:\n   rm -rf .gradle/caches/ .gradle/build-cache/\n   (Windows: rmdir /s /q .gradle\\caches .gradle\\build-cache)\n\n5. Rebuild:\n   ./gradlew build --no-build-cache\n\nOptional: Disable build cache in gradle.properties:\n   org.gradle.caching=false",
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
        error: "Timeout waiting to lock file cache (~/.gradle/caches/modules-2/files-2.1).\n    It is currently in use by another Gradle instance.",
        diagnosis: {
            problem: 'Multiple Gradle instances trying to access cache simultaneously',
            rootCause: 'Another Gradle build running, or orphaned lock file from crashed process',
            evidence: 'Lock timeout error, cache directory locked by another process',
            confidence: 0.95
        },
        solution: {
            summary: 'Stop all Gradle processes and clear lock files',
            specificFix: "1. Stop all Gradle daemons:\n   ./gradlew --stop\n\n2. Check for running Gradle processes:\n   ps aux | grep gradle (Linux/Mac)\n   tasklist | findstr gradle (Windows)\n\n3. Kill orphaned Gradle processes if found:\n   kill -9 <PID> (Linux/Mac)\n   taskkill /F /PID <PID> (Windows)\n\n4. Remove lock files manually:\n   rm ~/.gradle/caches/modules-2/*.lock\n   rm ~/.gradle/caches/*/*.lock\n   (Windows: del %USERPROFILE%\\.gradle\\caches\\modules-2\\*.lock)\n\n5. Restart build:\n   ./gradlew build",
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
        error: "Could not read metadata for dependency: androidx.compose.ui:ui:1.6.0\n    Caused by: java.io.InvalidClassException: invalid stream header",
        diagnosis: {
            problem: 'Corrupted dependency metadata cache',
            rootCause: 'Cache metadata files corrupted, possibly from Gradle version upgrade or interrupted download',
            evidence: 'InvalidClassException reading metadata, serialized data invalid',
            confidence: 0.9
        },
        solution: {
            summary: 'Clear dependency cache and re-download',
            specificFix: "1. Clean Gradle dependency cache:\n   rm -rf ~/.gradle/caches/modules-2/\n   (Windows: rmdir /s /q %USERPROFILE%\\.gradle\\caches\\modules-2)\n\n2. Force refresh dependencies:\n   ./gradlew build --refresh-dependencies\n\n3. If issue persists, clear all caches:\n   rm -rf ~/.gradle/caches/\n   ./gradlew clean\n   ./gradlew build --refresh-dependencies\n\n4. Verify in build.gradle repositories are correct:\n   repositories {\n       google()\n       mavenCentral()\n   }",
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
