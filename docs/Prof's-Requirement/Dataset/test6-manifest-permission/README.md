# Test Case 6: Manifest Permission Error

## Description
Tests Android Manifest permission declaration error causing runtime security exceptions.

## Error Type
- **Category**: Manifest/Permissions
- **Complexity**: Easy
- **Error**: SecurityException due to missing permission in manifest

## Expected Error
```
java.lang.SecurityException: Permission Denial: starting Intent requires android.permission.CAMERA
    at android.app.ContextImpl.enforce(ContextImpl.java:2074)
    at android.app.ContextImpl.startActivity(ContextImpl.java:1347)
```

## Root Cause
The AndroidManifest.xml is missing required permission declarations (e.g., CAMERA, ACCESS_FINE_LOCATION) while the code attempts to use those features, resulting in runtime SecurityException.

## Files
- `AndroidManifest.xml` - Manifest file missing permission declarations
- `MainActivity.kt` - Activity attempting to use camera without declared permission
- `build.gradle` - Standard Android app configuration

## How to Reproduce
1. Build and install the app
2. Run the app
3. Attempt to access the camera
4. Observe SecurityException in logcat

## Expected Solution
Add required permissions to AndroidManifest.xml:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```
