"use strict";
/**
 * ProGuard/R8 Minification Few-Shot Examples (Chunk 9 - Priority 3)
 * 10 examples for ProGuard/R8 obfuscation errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGUARD_EXAMPLES = void 0;
exports.PROGUARD_EXAMPLES = [
    {
        id: 'proguard_retrofit_interface',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.NoSuchMethodError: No interface method getUsers()Lretrofit2/Call; in class Lcom/example/api/ApiService;\n    at com.example.app.MainActivity.onCreate(MainActivity.kt:42)",
        diagnosis: {
            problem: 'Retrofit interface methods obfuscated by R8, preventing reflection-based invocation',
            rootCause: 'ProGuard/R8 removed or renamed interface methods that Retrofit uses via reflection',
            evidence: 'NoSuchMethodError for interface method in release build, works in debug',
            confidence: 0.95
        },
        solution: {
            summary: 'Add ProGuard keep rule for Retrofit interfaces',
            specificFix: "File: app/proguard-rules.pro\n\nAdd at end of file:\n# Keep Retrofit interfaces (used with reflection)\n-keep interface com.example.api.** { *; }\n\n# Keep Retrofit annotations\n-keepattributes Signature\n-keepattributes Exceptions\n-keepattributes *Annotation*\n\n# Keep generic types for Retrofit\n-keepattributes RuntimeVisible...Annotations, AnnotationDefault\n\nVerify: ./gradlew assembleRelease\nThen test: Install and run release APK",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add keep rules to proguard-rules.pro',
                'Build release: ./gradlew assembleRelease',
                'Install release APK',
                'Test API calls work'
            ]
        }
    },
    {
        id: 'proguard_gson_models',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.RuntimeException: Failed to invoke constructor com.example.models.User with no args\n    Caused by: java.lang.NoSuchMethodException: com.example.models.User.<init> []",
        diagnosis: {
            problem: 'Gson data class fields renamed/removed by R8, breaking JSON deserialization',
            rootCause: 'ProGuard/R8 obfuscated field names, Gson cannot match JSON keys to fields',
            evidence: 'NoSuchMethodException for constructor, or fields mismatch after deserialization',
            confidence: 0.95
        },
        solution: {
            summary: 'Add ProGuard keep rule for Gson model classes',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep Gson model classes (field names needed for serialization)\n-keep class com.example.models.** { *; }\n-keepclassmembers class com.example.models.** { *; }\n\n# Keep generic types for Gson\n-keepattributes Signature\n\n# Keep annotations for Gson\n-keepattributes *Annotation*\n\n# Alternative: Use @Keep annotation on each model class\nimport androidx.annotation.Keep\n@Keep\ndata class User(val id: Int, val name: String)",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add keep rules',
                'Build release',
                'Test JSON deserialization',
                'Verify all fields present'
            ]
        }
    },
    {
        id: 'proguard_room_dao',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.RuntimeException: cannot find implementation for com.example.db.AppDatabase. AppDatabase_Impl does not exist",
        diagnosis: {
            problem: 'Room generated implementation classes removed by R8',
            rootCause: 'ProGuard/R8 removed Room generated classes (_Impl suffix) used at runtime',
            evidence: 'RuntimeException stating _Impl class does not exist in release build',
            confidence: 0.95
        },
        solution: {
            summary: 'Add ProGuard keep rule for Room generated classes',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep Room database and DAOs\n-keep class * extends androidx.room.RoomDatabase\n-keep @androidx.room.Database class *\n-keep @androidx.room.Dao class *\n-keep @androidx.room.Entity class *\n\n# Keep Room generated implementation classes\n-keep class **_Impl { *; }\n\n# Keep query methods\n-keepclassmembers class * extends androidx.room.RoomDatabase {\n    public abstract **;\n}",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add Room keep rules',
                'Clean and rebuild release',
                'Test database operations',
                'Verify queries work'
            ]
        }
    },
    {
        id: 'proguard_fragment_constructor',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.RuntimeException: Unable to instantiate fragment com.example.ui.ProfileFragment: could not find Fragment constructor",
        diagnosis: {
            problem: 'Fragment no-arg constructor removed by R8',
            rootCause: 'ProGuard/R8 removed default constructor, required by Android framework for fragment recreation',
            evidence: 'RuntimeException unable to instantiate fragment, missing constructor',
            confidence: 0.9
        },
        solution: {
            summary: 'Add ProGuard keep rule for Fragment constructors',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep Fragment constructors (needed by Android framework)\n-keep public class * extends androidx.fragment.app.Fragment {\n    public <init>();\n}\n\n# Keep Fragment arguments\n-keepclassmembers class * extends androidx.fragment.app.Fragment {\n    public <init>(...);\n}\n\n# Alternative: Ensure Fragment has public no-arg constructor\nclass ProfileFragment : Fragment() {\n    // Empty constructor exists by default in Kotlin\n}",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add Fragment keep rules',
                'Rebuild release',
                'Test fragment navigation',
                'Test configuration changes'
            ]
        }
    },
    {
        id: 'proguard_viewmodel_methods',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.NoSuchMethodError: No virtual method updateUser(Lcom/example/models/User;)V in class Lcom/example/viewmodels/ProfileViewModel;",
        diagnosis: {
            problem: 'ViewModel methods removed by R8 (appears unused but called from XML or reflection)',
            rootCause: 'ProGuard/R8 removed methods that are only called from data binding or reflection',
            evidence: 'NoSuchMethodError for ViewModel method in release, works in debug',
            confidence: 0.85
        },
        solution: {
            summary: 'Add ProGuard keep rule for ViewModel methods',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep ViewModel classes and methods (used by data binding)\n-keep class * extends androidx.lifecycle.ViewModel {\n    public <methods>;\n}\n\n# Keep methods called from XML layouts (data binding)\n-keepclassmembers class * extends androidx.lifecycle.ViewModel {\n    public *;\n}\n\n# Keep LiveData methods\n-keep class androidx.lifecycle.LiveData { *; }\n-keep class androidx.lifecycle.MutableLiveData { *; }",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add ViewModel keep rules',
                'Rebuild release',
                'Test UI interactions',
                'Verify data binding works'
            ]
        }
    },
    {
        id: 'proguard_navigation_safeargs',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.ClassNotFoundException: Didn't find class \"com.example.ui.ProfileFragmentArgs\" on path: DexPathList",
        diagnosis: {
            problem: 'Navigation SafeArgs generated classes removed by R8',
            rootCause: 'ProGuard/R8 removed generated Args and Directions classes used by Navigation component',
            evidence: 'ClassNotFoundException for *Args or *Directions classes in release',
            confidence: 0.95
        },
        solution: {
            summary: 'Add ProGuard keep rule for SafeArgs generated classes',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep Navigation SafeArgs generated classes\n-keep class **Args { *; }\n-keep class **Directions { *; }\n\n# Keep navigation component classes\n-keep class androidx.navigation.** { *; }\n-keepnames class androidx.navigation.** { *; }\n\n# Keep parcelable arguments\n-keepclassmembers class * implements android.os.Parcelable {\n    public static final ** CREATOR;\n}",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add SafeArgs keep rules',
                'Clean and rebuild release',
                'Test navigation with arguments',
                'Verify argument passing works'
            ]
        }
    },
    {
        id: 'proguard_crashlytics',
        errorType: 'PROGUARD_MINIFICATION',
        error: "Firebase Crashlytics: No crash reports appearing in console after minification",
        diagnosis: {
            problem: 'Crashlytics unable to report crashes due to obfuscated stack traces',
            rootCause: 'ProGuard/R8 removed line numbers and class names needed for crash reports',
            evidence: 'Crashlytics works in debug, no reports in release build',
            confidence: 0.9
        },
        solution: {
            summary: 'Add ProGuard rules to preserve crash reporting info',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep line numbers for crash reports\n-keepattributes SourceFile,LineNumberTable\n\n# Keep custom exception classes\n-keep public class * extends java.lang.Exception\n\n# Keep Crashlytics\n-keep class com.google.firebase.crashlytics.** { *; }\n-dontwarn com.google.firebase.crashlytics.**\n\n# Also add mapping file upload in build.gradle:\nandroid {\n    buildTypes {\n        release {\n            minifyEnabled true\n            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n            firebaseCrashlytics {\n                mappingFileUploadEnabled true\n            }\n        }\n    }\n}",
            fileIdentification: 'app/proguard-rules.pro, app/build.gradle',
            codeExamples: [],
            verificationSteps: [
                'Add Crashlytics keep rules',
                'Enable mapping file upload',
                'Build and deploy release',
                'Trigger test crash',
                'Verify readable stack traces in console'
            ]
        }
    },
    {
        id: 'proguard_coroutines_dispatcher',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.NoSuchMethodError: No static method Dispatchers()Lkotlinx/coroutines/Dispatchers; in class Lkotlinx/coroutines/Dispatchers;",
        diagnosis: {
            problem: 'Kotlin coroutines dispatcher methods obfuscated by R8',
            rootCause: 'ProGuard/R8 removed or renamed coroutine dispatcher methods',
            evidence: 'NoSuchMethodError for Dispatchers in release, coroutines fail',
            confidence: 0.85
        },
        solution: {
            summary: 'Add ProGuard keep rule for Kotlin coroutines',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep Kotlin coroutines\n-keepclassmembers class kotlinx.coroutines.** {\n    volatile <fields>;\n}\n-keep class kotlinx.coroutines.** { *; }\n\n# Keep ServiceLoader support for coroutines\n-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}\n-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}\n\n# Keep dispatchers\n-keep class kotlinx.coroutines.Dispatchers { *; }\n-keep class kotlinx.coroutines.android.** { *; }",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add coroutines keep rules',
                'Rebuild release',
                'Test async operations',
                'Verify dispatchers work'
            ]
        }
    },
    {
        id: 'proguard_kotlin_reflection',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.ClassNotFoundException: kotlin.reflect.jvm.internal.ReflectionFactoryImpl",
        diagnosis: {
            problem: 'Kotlin reflection classes removed by R8',
            rootCause: 'ProGuard/R8 removed Kotlin reflection support classes used at runtime',
            evidence: 'ClassNotFoundException for Kotlin reflection classes',
            confidence: 0.9
        },
        solution: {
            summary: 'Add ProGuard keep rule for Kotlin reflection',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep Kotlin reflection\n-keep class kotlin.reflect.** { *; }\n-keep class kotlin.Metadata { *; }\n\n# Keep reflection factory\n-keep class kotlin.reflect.jvm.internal.** { *; }\n\n# Keep annotations used by reflection\n-keepattributes *Annotation*\n\nNote: Kotlin reflection is heavy. If not needed, avoid ::class usage in code.\nConsider using regular classes instead of KClass where possible.",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add reflection keep rules',
                'Rebuild release',
                'Test code using ::class',
                'Or refactor to avoid reflection'
            ]
        }
    },
    {
        id: 'proguard_enum_serialization',
        errorType: 'PROGUARD_MINIFICATION',
        error: "java.lang.IllegalArgumentException: No enum constant com.example.models.Status.ACTIVE",
        diagnosis: {
            problem: 'Enum constant names obfuscated by R8, breaking serialization/deserialization',
            rootCause: 'ProGuard/R8 renamed enum constants, JSON parser cannot match names',
            evidence: 'IllegalArgumentException for enum constant in release',
            confidence: 0.95
        },
        solution: {
            summary: 'Add ProGuard keep rule for enum classes',
            specificFix: "File: app/proguard-rules.pro\n\nAdd:\n# Keep enum classes and their values\n-keepclassmembers enum * {\n    public static **[] values();\n    public static ** valueOf(java.lang.String);\n}\n\n# Keep specific enum package\n-keep class com.example.models.** extends java.lang.Enum { *; }\n\n# Keep enum names for serialization\n-keepnames class * extends java.lang.Enum {\n    *;\n}",
            fileIdentification: 'app/proguard-rules.pro',
            codeExamples: [],
            verificationSteps: [
                'Add enum keep rules',
                'Rebuild release',
                'Test enum serialization',
                'Verify enum constants accessible'
            ]
        }
    }
];
