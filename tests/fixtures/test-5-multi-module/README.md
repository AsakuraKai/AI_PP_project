# Test 5: Multi-Module Dependency Conflict

## Error Type
Kotlin version mismatch between multiple modules

## Description
A multi-module Android project where different modules use incompatible Kotlin versions (app: 1.9.22, core: 2.0.0).

## Expected RCA Output
1. **Diagnosis**: Kotlin version conflict between app and core modules
2. **Root Cause**: 
   - app/build.gradle uses Kotlin 1.9.22
   - core/build.gradle uses Kotlin 2.0.0
   - Version mismatch causes dependency resolution failure
3. **Fix**: Unify Kotlin version across all modules:
   ```gradle
   // Root build.gradle
   ext.kotlin_version = "2.0.0"
   
   // Or in both modules
   id 'org.jetbrains.kotlin.android' version '2.0.0'
   ```
4. **Files**: 
   - app/build.gradle
   - core/build.gradle
   - Root build.gradle (recommended place for version management)
5. **Strategy**: Explain version unification best practices

## Success Criteria
- Identifies both conflicting modules
- Shows which versions are in conflict (1.9.22 vs 2.0.0)
- Suggests unified version strategy
- Provides concrete version to use (2.0.0 or compatible)
- Shows which files to modify
- Usability score: 70%+
