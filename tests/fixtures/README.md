# Test Fixtures - Unified Documentation

**Last Updated:** January 3, 2026  
**Purpose:** Consolidated test fixtures for RCA Agent testing

## 📁 Directory Structure

All test fixtures follow a standardized naming convention: `test-N-description/`

### Active Test Fixtures

| Directory | Category | Description | Key Files |
|-----------|----------|-------------|-----------|
| `test-2-lateinit-npe/` | Kotlin | Lateinit property not initialized | MainActivity.kt, MainViewModel.kt |
| `test-3-compose-breakage/` | Compose | Jetpack Compose state management error | HomeScreen.kt |
| `test-4-xml-inflation/` | XML | Binary XML inflation error (misspelled class) | activity_main.xml, CustomButton.kt |
| `test-5-multi-module/` | Gradle | Multi-module Gradle configuration | app/, core/, settings.gradle |
| `test6-manifest-permission/` | Manifest | Missing Android permissions | AndroidManifest.xml |
| `test7-gradle-network/` | Gradle | Network configuration issues | build.gradle |
| `test8-build-cache/` | Gradle | Build cache problems | build.gradle |
| `test9-proguard/` | ProGuard | Code obfuscation errors | proguard-rules.pro |
| `test10-navigation/` | Navigation | Android Navigation component issues | nav_graph.xml |

**Note:** `test4-xml-layout/` directory was distinct from `test-4-xml-inflation/` - they test different XML error types:
- `test-4-xml-inflation/`: Custom view class name typo (`CustonButton` vs `CustomButton`)
- `test4-xml-layout/`: Invalid XML attribute (`android:textFontWeight` not available)

## 📊 Test Datasets

Three TypeScript datasets provide comprehensive test coverage:

### 1. `test-dataset.ts` - Kotlin NPE Errors
- **10 test cases** covering lateinit and NPE scenarios
- Difficulty: Easy (3), Medium (4), Hard (3)
- Focus: Kotlin-specific null safety issues

### 2. `android-test-dataset.ts` - Android/Compose/Gradle Errors
- **20 test cases** across multiple categories:
  - Compose: 5 cases
  - XML: 3 cases
  - Gradle: 5 cases
  - Manifest: 3 cases
  - Mixed: 4 cases
- Target accuracy: 70%+ (14/20)

### 3. `performance-test-dataset.ts` - Performance Testing
- **40+ test cases** organized by complexity:
  - Simple: Fast baseline tests
  - Medium: Typical debugging scenarios
  - Complex: Multi-layer errors
  - Edge Cases: Extreme failure modes
- Categories: Kotlin (6), Gradle (5), Compose (8), XML (7), Manifest (5), Multi-layer (5+)

### 4. `unified-test-dataset.ts` - Unified Interface ✨ NEW
- **70+ total test cases** from all datasets
- Provides unified search and filtering across all datasets
- Backwards compatible with existing imports

**Usage:**
```typescript
import { UNIFIED_TEST_DATASET, getAllTestCases, findTestById } from './unified-test-dataset';

// Get all tests
const allTests = getAllTestCases();

// Search by ID across all datasets
const test = findTestById('TC001');

// Get tests by difficulty across all datasets
const hardTests = getTestsByDifficultyAcrossAll('hard');
```

## 🔧 Consolidated Changes (Jan 3, 2026)

### Removed Duplicates:
1. ❌ `test2-kotlin-lateinit/` - Redundant with `test-2-lateinit-npe/` (had less content)
2. ❌ `test3-compose-breakage/` - Empty duplicate of `test-3-compose-breakage/`
3. ❌ `test4-xml-layout/` - Empty directory (content in `test-4-xml-inflation/`)

### Kept Distinct:
- ✅ `test-4-xml-inflation/` and original `test4-xml-layout/activity_main.xml` test **different errors**
- ✅ All hyphenated directories (`test-N-description/`) are primary fixtures

### Benefits:
- **Eliminated:** 3 duplicate/empty directories
- **Standardized:** Naming convention (hyphenated format)
- **Unified:** Single entry point for all test datasets
- **Improved:** Documentation clarity

## 🎯 Usage Guidelines

### For Test Scripts:
```typescript
// Option 1: Import specific dataset
import { testDataset } from './fixtures/test-dataset';

// Option 2: Import from unified module
import { UNIFIED_TEST_DATASET } from './fixtures/unified-test-dataset';

// Option 3: Import all
import { getAllTestCases } from './fixtures/unified-test-dataset';
```

### For Test Fixtures:
- Use hyphenated format: `test-N-description/`
- Include README.md in each fixture explaining the error
- Provide error.log with actual error output
- Include minimal reproducible code

## 📈 Statistics

```
Total Test Cases: 70+
- Kotlin NPE: 10
- Android Specific: 20
- Performance: 40+

Total Fixture Directories: 9 active
Naming Convention: 100% standardized
```

## 🔗 Related Files

- `/tests/fixtures/test-dataset.ts` - Kotlin test cases
- `/tests/fixtures/android-test-dataset.ts` - Android test cases
- `/tests/fixtures/performance-test-dataset.ts` - Performance test cases
- `/tests/fixtures/unified-test-dataset.ts` - Unified interface (NEW)
- `/docs/TESTING_COMPLETE.md` - Testing documentation
- `/docs/CHUNK3_CONSOLIDATION_COMPLETE.md` - Test runner consolidation
