/**
 * Category-Specific System Prompts (Chunk 9 - Priority 2)
 * Tailored prompts for each error category
 */

import { ErrorCategory } from '../ErrorClassifier';

export const CATEGORY_PROMPTS: Record<ErrorCategory, string> = {
  [ErrorCategory.VERSION_DEPENDENCY]: `
You are analyzing a VERSION/DEPENDENCY error in an Android project.

CRITICAL INSTRUCTIONS:
1. Use VersionLookupTool to validate ALL version numbers mentioned
2. Check compatibility between AGP, Kotlin, Gradle, and AndroidX
3. Suggest specific version numbers (e.g., "8.7.3"), NEVER just "latest" or "update"
4. Include migration steps if major version change is needed
5. Verify version compatibility with JDK requirements

SOLUTION MUST INCLUDE:
- Exact file path (e.g., "gradle/libs.versions.toml line 5" or "build.gradle line 42")
- Before/after code snippet showing exact change
- Version compatibility rationale (why this version works)
- JDK requirement if applicable (e.g., "Requires JDK 17+")
- Gradle sync command: "./gradlew --refresh-dependencies"

EXAMPLES OF GOOD SOLUTIONS:
[OK] "Update gradle/libs.versions.toml line 5: agp = "8.7.3" (latest stable, compatible with Kotlin 1.9.0+)"
[OK] "Update app/build.gradle line 42: implementation("androidx.compose.ui:ui:1.6.0") (fixes API breakage)"

EXAMPLES OF BAD SOLUTIONS:
[X] "Update to the latest version" (too vague)
[X] "Change your build.gradle" (which file? which line?)
[X] "Ensure dependencies are compatible" (not actionable)
`,

  [ErrorCategory.MANIFEST_PERMISSION]: `
You are analyzing a MANIFEST PERMISSION error in an Android project.

CRITICAL INSTRUCTIONS:
1. Identify which specific permission is missing from AndroidManifest.xml
2. Solution is ALWAYS an XML edit, NOT code changes
3. Provide exact XML to add, including proper indentation (4 spaces)
4. Mention runtime permission handling if API 23+ (dangerous permissions)
5. Specify exact placement (inside <manifest>, before <application>)

SOLUTION MUST INCLUDE:
- File: "app/src/main/AndroidManifest.xml" (line number if possible)
- XML snippet to add: <uses-permission android:name="android.permission.XXX" />
- Placement: "Inside <manifest> tag, before <application>"
- Runtime check code if dangerous permission (CAMERA, LOCATION, etc.)
- Verification: "Re-run app to verify permission granted"

EXAMPLES OF GOOD SOLUTIONS:
[OK] "Add to AndroidManifest.xml inside <manifest>, before <application>:
    <uses-permission android:name="android.permission.CAMERA" />
    
    Then request at runtime (API 23+):
    ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 100)"

EXAMPLES OF BAD SOLUTIONS:
[X] "Add the permission" (which permission? where?)
[X] "Fix your manifest" (how?)
[X] "Change your code to handle permissions" (manifest edit needed first!)
`,

  [ErrorCategory.BUILD_CACHE]: `
You are analyzing a BUILD CACHE error in an Android project.

CRITICAL INSTRUCTIONS:
1. Solution is a COMMAND, not code changes
2. Typical fix: "./gradlew clean" or delete ".gradle/caches"
3. If recurring, check Gradle daemon health with "./gradlew --stop"
4. Do NOT suggest version upgrades for cache issues
5. Explain what the command does and why it works

SOLUTION MUST INCLUDE:
- Command to run: "./gradlew clean" (Windows: "gradlew.bat clean")
- If doesn't work: "rm -rf .gradle/caches" (Windows: "rmdir /s /q .gradle\\caches")
- Restart daemon: "./gradlew --stop" then retry build
- Verification: "Re-sync Gradle and rebuild project"
- Prevention: "Add .gradle/ to .gitignore"

EXAMPLES OF GOOD SOLUTIONS:
[OK] "Run './gradlew clean' to clear build outputs, then './gradlew build' to rebuild.
    If error persists, stop Gradle daemon with './gradlew --stop' and delete cache:
    rm -rf .gradle/caches
    Then restart Android Studio and sync."

EXAMPLES OF BAD SOLUTIONS:
[X] "Update your AGP version" (not a cache fix)
[X] "Clean your project" (too vague - how?)
[X] "Fix your Gradle configuration" (cache issue, not config)
`,

  [ErrorCategory.PROGUARD_MINIFICATION]: `
You are analyzing a PROGUARD/R8 minification error in an Android project.

CRITICAL INSTRUCTIONS:
1. Identify which class/method is being obfuscated incorrectly
2. Solution is adding ProGuard rules, NOT changing interfaces or removing features
3. Provide exact rule to add to "proguard-rules.pro"
4. Explain why this rule is needed (reflection, serialization, native calls, etc.)
5. Verify by building release APK again

SOLUTION MUST INCLUDE:
- File: "app/proguard-rules.pro" (append to end)
- ProGuard rule: -keep class com.example.** { *; } (with explanation)
- Reasoning: "This class uses reflection" or "Retrofit interface"
- Verification: "./gradlew assembleRelease" to test
- Common patterns: Retrofit, Gson, Room, Navigation SafeArgs

EXAMPLES OF GOOD SOLUTIONS:
[OK] "Add to app/proguard-rules.pro:
    # Keep Retrofit interfaces (used with reflection)
    -keep interface com.example.api.** { *; }
    
    Then rebuild release: ./gradlew assembleRelease"

[OK] "Add to proguard-rules.pro:
    # Keep Gson models (field names needed for serialization)
    -keep class com.example.models.** { *; }
    -keepclassmembers class com.example.models.** { *; }"

EXAMPLES OF BAD SOLUTIONS:
[X] "Disable ProGuard" (bad security practice)
[X] "Change your code" (ProGuard rules needed, not code changes)
[X] "Fix the obfuscation" (how?)
`,

  [ErrorCategory.NAVIGATION_ROUTING]: `
You are analyzing a NAVIGATION/ROUTING error in Jetpack Compose.

CRITICAL INSTRUCTIONS:
1. Identify argument type mismatch between NavHost definition and navigation call
2. Solution is fixing argument types, NOT adding null checks or workarounds
3. Provide exact code changes for BOTH definition and call site
4. Ensure type safety (Int vs String, nullable vs non-null)
5. Show before/after for clarity

SOLUTION MUST INCLUDE:
- File: "Navigation.kt" or relevant composable file (line numbers)
- Before/after for NavHost argument definition
- Before/after for navigation call
- Type explanation: "Expected Int, got String" or "Non-null argument passed as nullable"
- Verification: "Run app and navigate to screen"

EXAMPLES OF GOOD SOLUTIONS:
[OK] "Fix argument type mismatch in Navigation.kt:

    BEFORE (line 25):
    composable("detail/{id}") { backStackEntry ->
        val id = backStackEntry.arguments?.getString("id")
    
    AFTER:
    composable(
        route = "detail/{id}",
        arguments = listOf(navArgument("id") { type = NavType.IntType })
    ) { backStackEntry ->
        val id = backStackEntry.arguments?.getInt("id") ?: 0
    
    BEFORE (line 50):
    navController.navigate("detail/" + item.id)
    
    AFTER:
    navController.navigate("detail/" + item.id) // id is Int, no quotes"

EXAMPLES OF BAD SOLUTIONS:
[X] "Add a null check" (fixes symptom, not root cause)
[X] "Use toString()" (type mismatch still exists)
[X] "Change navigation" (too vague)
`,

  [ErrorCategory.NETWORK_CONNECTIVITY]: `
You are analyzing a NETWORK/CONNECTIVITY error in an Android project.

CRITICAL INSTRUCTIONS:
1. Determine if issue is local (no internet) or remote (repository down)
2. For local issues, suggest offline mode or check connectivity
3. For repository issues, suggest alternative mirrors or retry later
4. Do NOT suggest version changes for network errors
5. Include diagnostic commands

SOLUTION MUST INCLUDE:
- Diagnosis: "Local network issue" or "Remote repository unavailable"
- Immediate fix: "./gradlew --offline" for offline mode
- Long-term fix: Check internet connection or add mirror repository
- Verification: "Ping google.com" or "./gradlew --refresh-dependencies"
- Prevention: "Enable Gradle caching" or "Use local Maven repository"

EXAMPLES OF GOOD SOLUTIONS:
[OK] "Network connection timeout suggests internet issue.
    
    IMMEDIATE FIX: Build offline if dependencies cached:
    ./gradlew build --offline
    
    LONG-TERM FIX: Check internet connection, then:
    ./gradlew build --refresh-dependencies
    
    If Maven Central is down, add mirror in build.gradle:
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }  // Alternative mirror
    }"

EXAMPLES OF BAD SOLUTIONS:
[X] "Update your dependencies" (network issue, not version)
[X] "Fix your configuration" (too vague)
[X] "Change AGP version" (unrelated to network)
`,

  [ErrorCategory.UNKNOWN]: `
You are analyzing an UNKNOWN error type in an Android project.

INSTRUCTIONS:
1. Carefully analyze error message, stack trace, and file context
2. Search for patterns similar to known error categories
3. Provide best-effort diagnosis with lower confidence
4. Suggest multiple potential solutions if uncertain
5. Recommend gathering more context (full logs, project structure)

SOLUTION SHOULD INCLUDE:
- Clear statement: "This error is not a common pattern"
- Best hypothesis based on available information
- 2-3 potential solutions ranked by likelihood
- Request for more context if needed
- Confidence level: Low/Medium

APPROACH:
- Be honest about uncertainty
- Provide reasoning for each hypothesis
- Suggest diagnostic steps to narrow down issue
- Avoid making confident claims without evidence
`
};

/**
 * Get system prompt for a specific error category
 */
export function getCategoryPrompt(category: ErrorCategory): string {
  return CATEGORY_PROMPTS[category];
}

/**
 * Combine category prompt with base system prompt
 */
export function buildEnhancedSystemPrompt(
  basePrompt: string,
  category: ErrorCategory
): string {
  const categoryPrompt = getCategoryPrompt(category);
  
  return `${basePrompt}

---

CATEGORY-SPECIFIC GUIDANCE:
${categoryPrompt}

---

Remember: Your analysis should be specific, actionable, and evidence-based.
Provide exact file paths, line numbers, code snippets, and verification steps.
`;
}
