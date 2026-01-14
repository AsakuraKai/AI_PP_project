# Test Case 9: ProGuard Configuration Error

## Description
Tests ProGuard minification causing runtime crashes due to missing keep rules for serialization classes.

## Error Type
- **Category**: Build/ProGuard
- **Complexity**: Hard
- **Error**: Runtime crash in release build after ProGuard obfuscation

## Expected Error
```
java.lang.ClassCastException: Cannot cast java.util.LinkedHashMap to com.example.proguardtest.UserData
    at com.example.proguardtest.ApiService.parseResponse()
    at com.example.proguardtest.MainActivity.fetchData()
```

## Root Cause
ProGuard's aggressive minification removes or obfuscates serialization classes (Retrofit/Gson models) that are required at runtime. The `proguard-rules.pro` file is missing necessary `-keep` rules for data classes used with Retrofit and kotlinx.serialization.

## Files
- `app/build.gradle` - Build configuration with ProGuard enabled
- `app/proguard-rules.pro` - ProGuard rules (incomplete/missing keep rules)
- `app/src/main/kotlin/MainActivity.kt` - Activity making API calls
- `app/src/main/kotlin/ApiService.kt` - Retrofit service with data models

## How to Reproduce
1. Build the project in release mode: `./gradlew assembleRelease`
2. Install and run the release APK
3. Trigger network call that uses serialization
4. Observe ClassCastException or NoSuchMethodError

## Expected Solution
Add proper ProGuard keep rules for:
```proguard
-keep class com.example.proguardtest.** { *; }
-keepclassmembers class com.example.proguardtest.** { *; }
-keep class kotlin.Metadata { *; }
-keep class kotlinx.serialization.** { *; }
```
