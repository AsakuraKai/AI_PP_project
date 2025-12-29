# Chunk 9 Priority Action Plan

**Based on Chunk 8 Test Results**  
**Created:** December 28, 2025  
**Status:** 🔴 URGENT - Critical fixes required before Phase 4

---

## 🚨 Executive Summary

**Chunk 8 Revealed Critical Gaps:**
- Version errors: **94% usability** ✅
- Non-version errors: **24% usability** ❌
- Overall: Agent is a "one-trick pony" - excellent at versions, fails at everything else

**Root Cause:** 
1. Over-trained on version/dependency patterns (39/39 few-shot examples)
2. No error classification - treats all errors as version problems
3. LLM response parsing broken for complex errors
4. Prompts assume code fixes, not commands/config changes

**Impact:** Agent is **NOT production-ready** for diverse Android errors

---

## 🎯 Chunk 9 Goals (Revised)

**Original Goal:** Bug fixes & iteration (3 days)  
**Revised Goal:** Fundamental architecture improvements (5-7 days)

**Success Criteria:**
- ✅ Test 10 parsing fixed (0% → 60%+)
- ✅ Error classification implemented
- ✅ Non-version errors improved (24% → 60%+)
- ✅ Few-shot examples diversified (39 → 70+)
- ✅ Test suite re-run shows improvement

---

## 🔥 Priority 1: Fix LLM Response Parsing (DAY 1)

**Issue:** Test 10 failed with 0% usability due to JSON extraction error

**Error Message:**
```
Failed to parse LLM response: Error: Invalid JSON in response: <think>
Okay, so I'm trying to help fix this runtime error in the app...
```

**Root Cause:** 
- DeepSeek-R1 model includes `<think>` tags for chain-of-thought reasoning
- Current JSON extractor breaks when encountering these tags
- No fallback parsing strategy

**Fix Implementation:**

### Task 1.1: Improve JSON Extraction (4 hours)
**File:** `src/agent/PromptEngine.ts` (line 568: extractJSON method)

**Current Code:**
```typescript
private extractJSON(text: string): any {
  // Current implementation fails on <think> tags
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found');
  return JSON.parse(jsonMatch[0]);
}
```

**New Code:**
```typescript
private extractJSON(text: string): any {
  // Strategy 1: Remove <think> tags first
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Strategy 2: Try multiple JSON extraction patterns
  const patterns = [
    /```json\s*(\{[\s\S]*?\})\s*```/,  // Markdown code block
    /\{[\s\S]*\}/,                      // Plain JSON
    /"analysis":\s*\{[\s\S]*\}/        // Partial JSON starting with key
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1] || match[0]);
      } catch (e) {
        continue; // Try next pattern
      }
    }
  }
  
  // Strategy 3: If all fail, return minimal valid response
  return {
    root_cause: "Analysis incomplete - parsing failed",
    fix_guidelines: ["Review error message and code context"],
    confidence: 0.2
  };
}
```

**Testing:**
- Re-run Test 10 (Navigation Argument Mismatch)
- Expected: 0% → 60%+ usability

---

## 🔥 Priority 2: Error Classification System (DAY 2-3)

**Issue:** Agent treats all errors as version problems

**Evidence:**
- Test 7 (Network error) → suggested version change
- Test 8 (Cache corruption) → suggested AGP upgrade
- Test 6 (Manifest permission) → suggested code change

**Fix Implementation:**

### Task 2.1: Create Error Classifier (8 hours)

**New File:** `src/agent/ErrorClassifier.ts`

```typescript
export enum ErrorCategory {
  VERSION_DEPENDENCY = 'version_dependency',
  MANIFEST_PERMISSION = 'manifest_permission',
  BUILD_CACHE = 'build_cache',
  PROGUARD_MINIFICATION = 'proguard_minification',
  NAVIGATION_ROUTING = 'navigation_routing',
  RUNTIME_EXCEPTION = 'runtime_exception',
  COMPILATION_ERROR = 'compilation_error',
  UNKNOWN = 'unknown'
}

export class ErrorClassifier {
  classify(error: ParsedError): ErrorCategory {
    const message = error.message.toLowerCase();
    const stackTrace = error.stackTrace?.toLowerCase() || '';
    
    // Version/Dependency patterns
    if (
      message.includes('could not find') && message.includes('gradle') ||
      message.includes('dependency') && message.includes('version') ||
      message.includes('com.android.tools.build:gradle')
    ) {
      return ErrorCategory.VERSION_DEPENDENCY;
    }
    
    // Manifest permission patterns
    if (
      message.includes('permission denial') ||
      message.includes('securityexception') ||
      stackTrace.includes('android.permission.')
    ) {
      return ErrorCategory.MANIFEST_PERMISSION;
    }
    
    // Build cache patterns
    if (
      message.includes('compilation error. see log') ||
      message.includes('gradle daemon') && message.includes('died') ||
      message.includes('could not open') && message.includes('cache')
    ) {
      return ErrorCategory.BUILD_CACHE;
    }
    
    // ProGuard patterns
    if (
      message.includes('nosuchmethoderror') && stackTrace.includes('release') ||
      message.includes('r8') || message.includes('proguard') ||
      message.includes('shrink') && message.includes('obfuscat')
    ) {
      return ErrorCategory.PROGUARD_MINIFICATION;
    }
    
    // Navigation patterns
    if (
      message.includes('navigation') && message.includes('argument') ||
      message.includes('wrong argument type') ||
      stackTrace.includes('androidx.navigation')
    ) {
      return ErrorCategory.NAVIGATION_ROUTING;
    }
    
    // Generic runtime exception
    if (stackTrace && stackTrace.includes('exception')) {
      return ErrorCategory.RUNTIME_EXCEPTION;
    }
    
    // Generic compilation error
    if (message.includes('compilation') || message.includes('compile')) {
      return ErrorCategory.COMPILATION_ERROR;
    }
    
    return ErrorCategory.UNKNOWN;
  }
  
  getPromptTemplate(category: ErrorCategory): string {
    // Return category-specific prompt template
    // See Task 2.2 below
  }
}
```

### Task 2.2: Category-Specific Prompts (8 hours)

**New File:** `src/agent/prompts/CategoryPrompts.ts`

```typescript
export const VERSION_DEPENDENCY_PROMPT = `
You are analyzing a VERSION/DEPENDENCY error in an Android project.

CRITICAL INSTRUCTIONS:
1. Use VersionLookupTool to validate versions
2. Check compatibility between AGP, Kotlin, Gradle
3. Suggest specific version numbers (e.g., "8.7.3"), not "latest"
4. Include migration steps if major version change

SOLUTION MUST INCLUDE:
- Exact file path (e.g., gradle/libs.versions.toml line 5)
- Before/after code snippet
- Version compatibility rationale
`;

export const MANIFEST_PERMISSION_PROMPT = `
You are analyzing a MANIFEST PERMISSION error in an Android project.

CRITICAL INSTRUCTIONS:
1. Identify which permission is missing from AndroidManifest.xml
2. Solution is ALWAYS an XML edit, NOT code changes
3. Provide exact XML to add, including proper indentation
4. Mention runtime permission handling if API 23+

SOLUTION MUST INCLUDE:
- File: app/src/main/AndroidManifest.xml (line number)
- XML snippet to add (e.g., <uses-permission android:name="..." />)
- Placement (inside <manifest>, before <application>)
- If dangerous permission, mention runtime check code
`;

export const BUILD_CACHE_PROMPT = `
You are analyzing a BUILD CACHE error in an Android project.

CRITICAL INSTRUCTIONS:
1. Solution is a COMMAND, not code changes
2. Typical fix: ./gradlew clean or delete .gradle/caches
3. If recurring, check Gradle daemon health
4. Do NOT suggest version upgrades for cache issues

SOLUTION MUST INCLUDE:
- Command to run: ./gradlew clean
- If doesn't work: rm -rf .gradle/caches
- Check: ./gradlew --stop (restart daemon)
- Verify: Re-sync Gradle after cache clear
`;

export const PROGUARD_MINIFICATION_PROMPT = `
You are analyzing a PROGUARD/R8 minification error.

CRITICAL INSTRUCTIONS:
1. Identify which class/method is being obfuscated incorrectly
2. Solution is adding ProGuard rules, NOT interface changes
3. Provide exact rule to add to proguard-rules.pro
4. Explain why this rule is needed

SOLUTION MUST INCLUDE:
- File: app/proguard-rules.pro (append to end)
- ProGuard rule (e.g., -keep class com.example.** { *; })
- Explanation of what the rule does
- Verify: Build release APK again
`;

export const NAVIGATION_ROUTING_PROMPT = `
You are analyzing a NAVIGATION/ROUTING error in Jetpack Compose.

CRITICAL INSTRUCTIONS:
1. Identify argument type mismatch between navigation definition and usage
2. Solution is fixing NavHost arguments, NOT adding null checks
3. Provide exact code changes for both definition and call site
4. Ensure type safety (Int vs String, nullable vs non-null)

SOLUTION MUST INCLUDE:
- File: Navigation.kt (line numbers for both definition and usage)
- Before/after for NavHost definition
- Before/after for navigation call
- Type explanation (why mismatch occurred)
`;
```

### Task 2.3: Integrate Classifier into Agent (4 hours)

**File:** `src/agent/MinimalReactAgent.ts`

**Current Code (line ~200):**
```typescript
async analyze(error: ParsedError): Promise<RCAResult> {
  const prompt = this.promptEngine.buildPrompt(error);
  const response = await this.llm.generate(prompt);
  return this.promptEngine.parseResponse(response);
}
```

**New Code:**
```typescript
async analyze(error: ParsedError): Promise<RCAResult> {
  // 1. Classify error first
  const classifier = new ErrorClassifier();
  const category = classifier.classify(error);
  
  // 2. Get category-specific prompt template
  const template = classifier.getPromptTemplate(category);
  
  // 3. Build prompt with template
  const prompt = this.promptEngine.buildPrompt(error, {
    template,
    category
  });
  
  // 4. Generate response (as before)
  const response = await this.llm.generate(prompt);
  return this.promptEngine.parseResponse(response);
}
```

**Testing:**
- Re-run Tests 6-10
- Expected improvements:
  - Test 6: 13% → 70%+ (manifest fix)
  - Test 7: 54% → 70%+ (network diagnosis)
  - Test 8: 10% → 65%+ (cache command)
  - Test 9: 45% → 75%+ (ProGuard rules)
  - Test 10: Already handled by Priority 1

---

## 🔥 Priority 3: Diversify Few-Shot Examples (DAY 4-5)

**Issue:** 39/39 examples are version/dependency errors

**Current Distribution:**
- Version/Dependency: 39 examples (100%)
- Manifest: 0 examples (0%)
- Cache: 0 examples (0%)
- ProGuard: 0 examples (0%)
- Navigation: 0 examples (0%)

**Target Distribution:**
- Version/Dependency: 20 examples (40%)
- Manifest: 10 examples (20%)
- Cache: 5 examples (10%)
- ProGuard: 10 examples (20%)
- Navigation: 5 examples (10%)
- **Total: 50 examples**

### Task 3.1: Create Manifest Examples (8 hours)

**File:** `src/knowledge/few-shot-examples/manifest-examples.ts`

**10 Examples to Create:**
1. Camera permission missing
2. Location permission missing
3. Storage permission missing
4. Internet permission missing
5. Phone state permission missing
6. Bluetooth permission missing
7. Contacts permission missing
8. Calendar permission missing
9. Microphone permission missing
10. SMS permission missing

**Example Template:**
```typescript
{
  id: "manifest_camera_permission",
  category: "MANIFEST_PERMISSION",
  error: {
    message: "java.lang.SecurityException: Permission Denial: starting Intent { act=android.media.action.IMAGE_CAPTURE } requires android.permission.CAMERA",
    file: "MainActivity.kt",
    line: 45
  },
  analysis: {
    root_cause: "The app attempts to use the camera but hasn't declared the CAMERA permission in AndroidManifest.xml",
    diagnosis_steps: [
      "Error mentions 'Permission Denial' and 'requires android.permission.CAMERA'",
      "This is a manifest permission issue, not a code issue",
      "Solution: Add permission to AndroidManifest.xml"
    ]
  },
  solution: {
    file: "app/src/main/AndroidManifest.xml",
    line: 3,
    before: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">

    <application`,
    after: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">
    
    <uses-permission android:name="android.permission.CAMERA" />

    <application`,
    explanation: "Added CAMERA permission inside <manifest>, before <application>. For API 23+, also need runtime permission request in code."
  }
}
```

### Task 3.2: Create Cache Examples (4 hours)

**5 Examples:**
1. Gradle daemon died unexpectedly
2. Kotlin incremental compilation cache corrupt
3. Build cache out of date
4. Could not open cache metadata
5. Gradle sync failed - cache lock

### Task 3.3: Create ProGuard Examples (8 hours)

**10 Examples:**
1. NoSuchMethodError after R8
2. ClassNotFoundException in release build
3. Retrofit interface obfuscated
4. Gson model fields removed
5. Fragment constructor removed
6. Room database queries obfuscated
7. Crashlytics not working after minification
8. ViewModel methods removed
9. Navigation SafeArgs removed
10. Coroutines dispatcher obfuscated

### Task 3.4: Create Navigation Examples (4 hours)

**5 Examples:**
1. Argument type mismatch (Int vs String)
2. Missing required argument
3. Nullable argument not handled
4. Destination not found
5. Deep link argument parsing failed

### Task 3.5: Integrate into FewShotSelector (4 hours)

**File:** `src/agent/FewShotExampleSelector.ts`

**Update to Use Category:**
```typescript
selectExamples(error: ParsedError, category: ErrorCategory, count: number = 3): FewShotExample[] {
  // 1. Filter by category first
  const categoryExamples = this.examples.filter(ex => ex.category === category);
  
  // 2. Rank by similarity
  const ranked = this.rankBySimilarity(error, categoryExamples);
  
  // 3. Return top N
  return ranked.slice(0, count);
}
```

**Testing:**
- Re-run all 10 tests
- Verify agent selects category-appropriate examples
- Expected: Improved diagnosis and solution specificity

---

## 🔥 Priority 4: FileResolver Extension (DAY 6)

**Issue:** FileResolver only handles Gradle files well

**Evidence:**
- Test 6: 0% file identification (should find AndroidManifest.xml)
- Test 9: 50% file identification (should find proguard-rules.pro)

### Task 4.1: Extend FileResolver (8 hours)

**File:** `src/utils/FileResolver.ts`

**Add New Methods:**
```typescript
class FileResolver {
  // Existing: resolveGradleFile()
  
  async resolveManifestFile(projectPath: string): Promise<string> {
    // Standard location: app/src/main/AndroidManifest.xml
    // Fallback: search for AndroidManifest.xml recursively
    const standardPath = path.join(projectPath, 'app/src/main/AndroidManifest.xml');
    if (await fs.pathExists(standardPath)) return standardPath;
    
    // Search
    const manifests = await glob('**/AndroidManifest.xml', { cwd: projectPath });
    return manifests[0] || standardPath; // Return first or standard path
  }
  
  async resolveProguardFile(projectPath: string): Promise<string> {
    // Standard location: app/proguard-rules.pro
    // Also check: proguard.pro, proguard-project.txt
    const candidates = [
      'app/proguard-rules.pro',
      'proguard-rules.pro',
      'app/proguard.pro',
      'proguard.pro'
    ];
    
    for (const candidate of candidates) {
      const fullPath = path.join(projectPath, candidate);
      if (await fs.pathExists(fullPath)) return fullPath;
    }
    
    return path.join(projectPath, 'app/proguard-rules.pro'); // Default
  }
  
  async resolveNavigationFile(projectPath: string): Promise<string> {
    // Compose: usually in Navigation.kt or NavGraph.kt
    // XML: usually in res/navigation/*.xml
    const kotlinFiles = await glob('**/Navigation*.kt', { cwd: projectPath });
    if (kotlinFiles.length > 0) return kotlinFiles[0];
    
    const xmlFiles = await glob('**/res/navigation/*.xml', { cwd: projectPath });
    return xmlFiles[0] || path.join(projectPath, 'app/src/main/kotlin/Navigation.kt');
  }
  
  async resolveFileByCategory(
    genericPath: string, 
    category: ErrorCategory, 
    projectPath: string
  ): Promise<string> {
    switch (category) {
      case ErrorCategory.VERSION_DEPENDENCY:
        return this.resolveGradleFile(genericPath, projectPath);
      case ErrorCategory.MANIFEST_PERMISSION:
        return this.resolveManifestFile(projectPath);
      case ErrorCategory.PROGUARD_MINIFICATION:
        return this.resolveProguardFile(projectPath);
      case ErrorCategory.NAVIGATION_ROUTING:
        return this.resolveNavigationFile(projectPath);
      default:
        return this.resolveGradleFile(genericPath, projectPath); // Fallback
    }
  }
}
```

### Task 4.2: Update FixGenerator to Use Category (4 hours)

**File:** `src/agent/FixGenerator.ts`

**Update:**
```typescript
async generateFix(
  error: ParsedError, 
  rootCause: string, 
  category: ErrorCategory
): Promise<CodeFix> {
  // Resolve file based on category
  const filePath = await this.fileResolver.resolveFileByCategory(
    error.file,
    category,
    this.projectPath
  );
  
  // Rest of fix generation...
}
```

**Testing:**
- Re-run Tests 6, 9, 10
- Expected: File identification 0-50% → 80-95%

---

## 🔥 Priority 5: Re-Test & Validate (DAY 7)

### Task 5.1: Re-Run All 10 Tests (4 hours)

**Script:** `scripts/chunk9-retest-all.ts`

```bash
npx ts-node scripts/chunk9-retest-all.ts
```

**Expected Improvements:**

| Test | Current | Target | Improvement Strategy |
|------|---------|--------|---------------------|
| Test 1 | 94% | 94%+ | Maintain (no regression) |
| Test 6 | 13% | 70%+ | Manifest prompt + examples |
| Test 7 | 54% | 70%+ | Better classification |
| Test 8 | 10% | 65%+ | Cache prompt + command solution |
| Test 9 | 45% | 75%+ | ProGuard prompt + rules examples |
| Test 10 | 0% | 60%+ | Fix JSON parsing |
| **Average** | **36%** | **72%+** | **+36% improvement** |

### Task 5.2: Document Results (2 hours)

**Create:** `docs/_archive/.../COMPLETION/CHUNK_9_COMPLETION.md`

**Include:**
- Before/after metrics for each test
- Analysis of remaining gaps
- Readiness assessment for Phase 4

### Task 5.3: Update Roadmap (2 hours)

**File:** `docs/IMPROVEMENT_ROADMAP.md`

**Update:**
- Mark Chunk 9 as complete
- Document actual vs planned work
- Adjust Phase 4 timeline if needed

---

## 📊 Success Criteria Checklist

- [ ] Test 10 parsing fixed (0% → 60%+)
- [ ] ErrorClassifier implemented and tested
- [ ] Category-specific prompts created (6 categories)
- [ ] Few-shot examples expanded (39 → 50+)
- [ ] FileResolver extended (3 new file types)
- [ ] All 10 tests re-run with improvements
- [ ] Average usability: 36% → 72%+ (target: 2x improvement)
- [ ] No regressions on Test 1 (maintain 94%)
- [ ] Chunk 9 completion document written
- [ ] Ready to proceed to Phase 4

---

## ⏱️ Time Estimate

**Total Duration:** 5-7 days (120-168 hours)

**Breakdown:**
- Day 1: JSON parsing fix (8h)
- Day 2-3: Error classification + prompts (20h)
- Day 4-5: Few-shot examples (28h)
- Day 6: FileResolver extension (12h)
- Day 7: Re-testing + documentation (8h)

**Comparison to Original Plan:**
- Original Chunk 9: 3 days (bug fixes)
- Revised Chunk 9: 7 days (architecture improvements)
- **Justification:** Test results revealed fundamental issues, not just bugs

---

## 🎓 Key Lessons from Chunk 8

1. **"One Trick Pony" Problem:** Agent excellent at one thing (versions) ≠ good at everything
2. **Few-Shot Bias:** 100% version examples = 100% version solutions (even when wrong)
3. **Classification Matters:** Need to identify error type BEFORE suggesting fixes
4. **Prompts Must Match Reality:** Can't use "suggest code fix" prompt for manifest/cache issues
5. **Testing Saves You:** Without Chunk 8, we'd have shipped a broken agent

**Quote:** *"Testing is how you find out your baby is ugly before you show it to the world."*

---

**Created:** December 28, 2025 19:00  
**Owner:** Kai (Backend Developer)  
**Status:** 🔴 URGENT - Start immediately  
**Next Review:** After Day 3 (classification complete)
