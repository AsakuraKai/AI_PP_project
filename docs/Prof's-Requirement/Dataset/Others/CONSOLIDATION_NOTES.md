# Dataset Consolidation Report

## Changes Made

### 1. **Removed Redundant Type Declarations**
- ✅ Moved `performance-test-dataset.d.ts` → `.backup-performance-test-dataset.d.ts`
- ✅ Moved `test-dataset.d.ts` → `.backup-test-dataset.d.ts`
- **Reason**: These are auto-generated TypeScript declaration files from the `.ts` implementations. Modern TypeScript projects don't need manual `.d.ts` files alongside source files.

### 2. **Removed Duplicate Test Case**
- ✅ **EXT-005**: Replaced duplicate NPE test with "Sealed Class Missing Branch" (unique error type)
- **Original Issue**: EXT-005 was testing extension function NPE on nullable receiver, which duplicated TC002 (Null Pointer - Missing Safe Call)
- **Resolution**: Changed to test sealed class exhaustive when statement - fills a Kotlin compilation error gap

### 3. **Fixed dataset-split.json References**
- ✅ Updated train/test/eval splits to reference actual test case IDs
- ✅ Removed non-existent references: AC015-AC020 (only AC001-AC010 exist)
- ✅ Added missing test cases to appropriate splits
- ✅ Updated distribution stats to match real data

## Dataset Structure

### Files
```
├── test-dataset.ts                    (10 Kotlin NPE cases)
├── android-test-dataset.ts            (20 Android/Compose/Gradle cases)
├── extended-test-dataset.ts           (30 extended/advanced cases)
├── performance-test-dataset.ts        (40+ performance test cases)
├── unified-test-dataset.ts            (aggregates all datasets)
├── dataset-split-loader.ts            (utilities for train/test/eval splits)
├── dataset-split.json                 (split configuration)
├── .backup-*.d.ts                     (archived declaration files)
└── CONSOLIDATION_NOTES.md             (this file)
```

### Statistics
- **Total Test Cases**: 100
- **Train Split**: 70 cases (70%)
- **Test Split**: 20 cases (20%)
- **Eval Split**: 10 cases (10%)

### Coverage by Category
| Category | Count | Examples |
|----------|-------|----------|
| Kotlin | 28 | NPE, lateinit, type mismatch |
| Gradle | 12 | Dependencies, plugins, versions |
| Compose | 15 | Recomposition, state, modifiers |
| XML | 8 | Layout inflation, resources |
| Manifest | 4 | Permissions, activities |
| Build/Interop | 3 | ProGuard, dex, WorkManager |
| Multi-layer | 2 | Complex cross-concern errors |

## No Breaking Changes
- All existing imports continue to work
- `unified-test-dataset.ts` re-exports everything with unified interface
- `dataset-split-loader.ts` automatically finds test cases by ID
- Backup `.d.ts` files archived in case of future reference

## Benefits
✅ **Reduced Duplication**: One less test case to maintain  
✅ **Cleaner Structure**: No redundant generated files  
✅ **Correct References**: Split configuration matches actual test cases  
✅ **Better Maintainability**: Single source of truth for each error type  

## Migration Path (if needed)
If `.d.ts` files are required:
1. Restore from backup: `.backup-performance-test-dataset.d.ts`
2. Or regenerate using: `tsc --declaration --emitDeclarationOnly`
