# Test Case 8: Build Cache Configuration Error

## Description
Tests Gradle build cache misconfiguration causing stale outputs and inconsistent build results.

## Error Type
- **Category**: Gradle/Build Cache
- **Complexity**: Medium
- **Error**: Build produces stale or incorrect outputs due to cache issues

## Expected Error
```
Execution failed for task ':app:compileDebugKotlin'.
> Compilation error. See log for more details
> Build cache key collision detected
```

## Root Cause
Gradle build cache is configured incorrectly or corrupted, causing the build system to use stale cached artifacts. This can lead to:
- Code changes not being reflected in the build
- Incorrect dependency resolution
- Cache key collisions

## Files
- `build.gradle` - Root build configuration
- `app/build.gradle` - App module with caching configuration
- `app/src/` - Source code directory

## How to Reproduce
1. Build the project: `./gradlew assembleDebug`
2. Make code changes
3. Build again - observe stale outputs
4. Changes not reflected in built APK

## Expected Solution
1. Clear the build cache: `./gradlew clean --build-cache`
2. Review and fix gradle.properties cache settings
3. Disable cache for debugging: `org.gradle.caching=false`
4. Or properly configure cache directories in gradle.properties
