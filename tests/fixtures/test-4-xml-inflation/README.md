# Test 4: XML Layout Inflation Error

## Error Type
ClassNotFoundException during XML layout inflation - misspelled custom view class

## Description
XML layout references a custom view with incorrect class name ("CustonButton" instead of "CustomButton").

## Expected RCA Output
1. **Diagnosis**: Class name mismatch in XML layout
2. **Root Cause**: XML references "CustonButton" but actual class is "CustomButton" (typo)
3. **Fix**: Correct the class name in XML:
   ```xml
   <!-- Before -->
   <com.example.xmltest.CustonButton ... />
   
   <!-- After -->
   <com.example.xmltest.CustomButton ... />
   ```
4. **File**: activity_main.xml, line 14
5. **Available Classes**: Should detect CustomButton exists in project

## Success Criteria
- Identifies XML file and exact line (14)
- Detects class name typo (CustonButton vs CustomButton)
- Shows corrected XML code
- Explains ClassNotFoundException cause
- Usability score: 70%+
