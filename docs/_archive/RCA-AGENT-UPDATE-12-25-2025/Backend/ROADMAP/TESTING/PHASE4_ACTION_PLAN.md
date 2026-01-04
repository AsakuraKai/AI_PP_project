# 🎯 Phase 4 - Quick Action Plan

**Created:** January 3, 2026  
**Status:** Ready for Implementation

---

## ✅ Completed Today

1. ✅ Verified Ollama and Chroma are running
2. ✅ Fixed Phase4TestSuite compilation errors
3. ✅ Ran 7/10 test cases successfully
4. ✅ Analyzed results and identified failure patterns
5. ✅ Created comprehensive test results document
6. ✅ Identified top 3 failure modes

---

## 🎯 Immediate Next Steps (Priority Order)

### Step 1: Complete Remaining Tests (1 hour)
```bash
npm run test:phase4
```
- Rerun test suite to complete tests 8-10
- Test 8: Build Cache Corruption
- Test 9: ProGuard Rule Missing  
- Test 10: Navigation Argument Mismatch

### Step 2: Create Few-Shot Examples (8-12 hours)
**Location:** `src/knowledge/few-shot-examples/`

**Priority Order:**
1. **kotlin-npe** (3 examples)
   - lateinit NPE
   - Nullable type access
   - Platform type NPE

2. **compose-deprecation** (3 examples)
   - Material2 → Material3 migration
   - Compose API changes
   - Deprecated composables

3. **xml-layout** (2 examples)
   - Unknown attribute errors
   - Resource inflation failures

4. **manifest-permission** (2 examples)
   - Runtime permission missing
   - Dangerous permission not declared

5. **gradle-network** (2 examples)
   - Maven repository timeout
   - Dependency resolution failure

6. **gradle-cache** (2 examples)
   - Build cache corruption
   - Stale dependency cache

7. **proguard-rules** (2 examples)
   - Missing keep rules
   - Obfuscation errors

8. **navigation-component** (2 examples)
   - Argument type mismatch
   - Deep link configuration

**Template for Each Example:**
```json
{
  "error_type": "kotlin-npe",
  "title": "lateinit property not initialized",
  "error_message": "kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized",
  "file_path": "app/src/main/kotlin/MainActivity.kt",
  "line": 42,
  "root_cause": "Accessing lateinit property before initialization in onCreate()",
  "fix_guidelines": [
    "Initialize viewModel in onCreate() before first use at line 35",
    "Before:\n```kotlin\nlateinit var viewModel: MainViewModel\n\noverride fun onCreate(savedInstanceState: Bundle?) {\n    super.onCreate(savedInstanceState)\n    // viewModel.loadData() called before initialization\n}\n```\nAfter:\n```kotlin\nlateinit var viewModel: MainViewModel\n\noverride fun onCreate(savedInstanceState: Bundle?) {\n    super.onCreate(savedInstanceState)\n    viewModel = ViewModelProvider(this)[MainViewModel::class.java]\n    viewModel.loadData()\n}\n```",
    "Verify initialization completes before any property access"
  ],
  "confidence": 0.9
}
```

### Step 3: Update System Prompt (2 hours)
**File:** `src/agent/prompts/system-prompt.ts`

**Add:**
1. More BAD vs GOOD examples (10 more pairs)
2. Stricter line number requirements
3. Version number validation rules
4. Code diff format requirements

**Example additions:**
```
❌ ULTRA BAD EXAMPLES (NEVER DO THIS):
- "Check the gradle file"
- "Update the dependency"
- "Fix the layout"
- "Add the permission"

✅ EXCELLENT EXAMPLES (ALWAYS DO THIS):
- "Update gradle/libs.versions.toml at line 2: change agp = \"8.10.0\" to agp = \"8.7.3\""
- "Add implementation(\"androidx.compose.material3:material3:1.6.0\") to app/build.gradle.kts at line 45"
- "Modify app/src/main/res/layout/activity_main.xml at line 12: remove android:textFontWeight attribute"
```

### Step 4: Fix File Resolution (1 hour)
**File:** `src/tools/FixGenerator.ts`

**Issue:** All file reads fail with "File not found after resolution"

**Fix:**
1. Add workspace root detection
2. Fix path resolution logic
3. Test with actual project files
4. Enable real code inspection

### Step 5: Enhance Quality Scorer (2 hours)
**File:** `src/quality/QualityScorer.ts`

**Add:**
1. Line number detection (regex: `/line \d+/`)
2. Version number validation (regex: `/\d+\.\d+\.\d+/`)
3. Code diff presence check
4. Specificity scoring

### Step 6: Re-test and Validate (2-3 hours)
```bash
npm run test:phase4
```

**Target Metrics:**
- Overall usability: 85%+
- Pass rate: 80%+ (8/10 tests)
- Solution specificity: 85%+
- All tests complete without errors

---

## 📊 Expected Outcomes

### Before Improvements
- Usability: 67%
- Pass Rate: 29% (2/7)
- Missing examples: 7 error types

### After Improvements
- Usability: 85%+ (target met)
- Pass Rate: 80%+ (8/10 passing)
- Complete example coverage: 10 error types

### Time Investment
- **Total:** 16-20 hours
- **When:** Spread over 2-3 days
- **Priority:** Complete few-shot examples first

---

## 🔧 Commands Reference

```bash
# Run all Phase 4 tests
npm run test:phase4

# Check test results
ls tests/tests/results/phase4/

# View specific test result
cat tests/tests/results/phase4/test1-agp-version-conflict-*.json

# Check if Ollama is running
ollama list

# Check if Chroma is accessible
curl http://localhost:8000/api/v1/heartbeat
```

---

## 📝 Progress Tracking

**Phase 4 Completion Status:**

- [x] Week 1, Day 1-2: Setup Test Matrix (16h)
  - [x] Create test project collection
  - [x] Design 10 test cases  
  - [x] Create evaluation rubric
  - [x] Build automated test harness

- [x] Week 1, Day 3-5: Run All Test Cases (Partial - 16h)
  - [x] Run 7/10 test cases
  - [x] Record metrics and responses
  - [x] Manual evaluation
  - [x] Generate initial report

- [ ] Week 2, Day 1-2: Fix Top 3 Failure Modes (16h)
  - [ ] Create few-shot examples (8-12h)
  - [ ] Update system prompt (2h)
  - [ ] Fix file resolution (1h)
  - [ ] Enhance quality scorer (2h)

- [ ] Week 2, Day 3-4: Re-test & Validate (16h)
  - [ ] Complete all 10 tests
  - [ ] Verify improvements
  - [ ] Final metrics calculation
  - [ ] Generate final report

**Current Progress:** ~40% of Phase 4 complete  
**Time Invested:** ~8 hours  
**Time Remaining:** ~30-40 hours

---

## 🎉 Quick Wins Available

1. **Complete Tests 8-10** (1 hour)
   - Simple rerun of test suite
   - Immediate visibility into full baseline

2. **Create 3 Few-Shot Examples** (1-2 hours)
   - kotlin-npe, compose-deprecation, xml-layout
   - Quick validation of approach
   - Immediate usability improvement

3. **Update Prompt with 5 More Examples** (30 mins)
   - Copy-paste from test results
   - Low effort, high impact

**Do these 3 things first for quick momentum!**

---

**Last Updated:** January 3, 2026  
**Ready to Execute:** ✅ Yes  
**Blocker:** None - proceed!
