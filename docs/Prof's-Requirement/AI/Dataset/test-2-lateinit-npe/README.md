# Test 2: Kotlin lateinit NPE

## Error Type
Kotlin UninitializedPropertyAccessException - lateinit property not initialized

## Description
A common Android lifecycle issue where a lateinit property (viewModel) is used before being initialized in onCreate().

## Expected RCA Output
1. **Diagnosis**: Identify that viewModel is used on line 14 before initialization
2. **Root Cause**: lateinit property accessed before assignment
3. **Fix**: Initialize viewModel BEFORE use:
   ```kotlin
   viewModel = ViewModelProvider(this).get(MainViewModel::class.java)
   ```
4. **File**: MainActivity.kt, line 14
5. **Code Example**: Show before/after with proper initialization order

## Success Criteria
- Identifies exact line (14) where property is used
- Explains lateinit initialization rules
- Suggests where to initialize (before line 14 in onCreate)
- Shows code fix with initialization
- Usability score: 70%+
