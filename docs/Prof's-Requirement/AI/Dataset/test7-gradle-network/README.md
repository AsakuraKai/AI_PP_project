# Test Case 7: Gradle Network Configuration Error

## Description
Tests Gradle build failure due to unreachable custom Maven repository in network configuration.

## Error Type
- **Category**: Gradle/Build
- **Complexity**: Medium
- **Error**: Build failure due to unreachable repository

## Expected Error
```
Could not resolve all dependencies for configuration ':app:debugRuntimeClasspath'.
> Could not resolve com.android.tools.build:gradle:8.2.0.
  Required by:
      project :
   > Could not resolve com.android.tools.build:gradle:8.2.0.
      > Could not get resource 'https://custom-internal-repo.company.com/maven/...'
         > Could not GET 'https://custom-internal-repo.company.com/maven/...'
            > Connect timed out
```

## Root Cause
The build.gradle file references a custom internal Maven repository (`https://custom-internal-repo.company.com/maven`) that is unreachable. This causes Gradle to fail when trying to resolve dependencies because it attempts the unreachable repository first before falling back to other repositories.

## Files
- `build.gradle` - Root build file with incorrect repository configuration
- `app/build.gradle` - App module build file
- `settings.gradle` - Project settings
- `app/src/main/kotlin/MainActivity.kt` - Simple placeholder class

## How to Reproduce
1. Attempt to build the project with `./gradlew build`
2. Gradle will timeout trying to reach the custom repository
3. Build will fail with network timeout error

## Expected Solution
1. Remove or comment out the unreachable custom repository
2. Ensure google() and mavenCentral() are sufficient for dependencies
3. If custom repository is needed, verify URL is accessible or add proper authentication
