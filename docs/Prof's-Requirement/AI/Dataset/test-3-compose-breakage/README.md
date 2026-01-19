# Test 3: Jetpack Compose API Breakage (1.5 → 1.6)

## Error Type
Compose API compatibility issue - function signature changed

## Description
Code written for Compose 1.5 breaks when upgrading to 1.6 due to API changes in LaunchedEffect.

## Expected RCA Output
1. **Diagnosis**: LaunchedEffect signature changed between Compose versions
2. **Root Cause**: Code uses old API pattern, new version requires explicit key parameter names
3. **Fix**: Update LaunchedEffect call to use named parameter:
   ```kotlin
   // Old (1.5)
   LaunchedEffect(Unit) { ... }
   
   // New (1.6)
   LaunchedEffect(key1 = Unit) { ... }
   ```
4. **File**: MainActivity.kt, line 29
5. **Migration Guide**: Reference Compose 1.6 migration notes

## Success Criteria
- Identifies Compose version incompatibility
- Explains API signature change
- Shows exact code fix with named parameters
- Links to or mentions migration documentation
- Usability score: 70%+
