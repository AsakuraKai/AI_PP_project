/**
 * ProGuard/R8 Minification Few-Shot Examples (Chunk 9 - Priority 3)
 * 10 examples for ProGuard/R8 obfuscation errors
 */

import { FewShotExample } from '../FewShotExampleService';

export const PROGUARD_EXAMPLES: FewShotExample[] = [
  {
    id: 'proguard_retrofit_interface',
    errorType: 'PROGUARD_MINIFICATION',
    error: `java.lang.NoSuchMethodError: No interface method getUsers()Lretrofit2/Call; in class Lcom/example/api/ApiService;
    at com.example.app.MainActivity.onCreate(MainActivity.kt:42)`,
    diagnosis: {
      problem: 'Retrofit interface methods obfuscated by R8, preventing reflection-based invocation',
      rootCause: 'ProGuard/R8 removed or renamed interface methods that Retrofit uses via reflection',
      evidence: 'NoSuchMethodError for interface method in release build, works in debug',
      confidence: 0.95
    },
    solution: {
      summary: 'Add ProGuard keep rule for Retrofit interfaces',
      specificFix: `File: app/proguard-rules.pro

Add at end of file:
# Keep Retrofit interfaces (used with reflection)
-keep interface com.example.api.** { *; }

# Keep Retrofit annotations
-keepattributes Signature
-keepattributes Exceptions
-keepattributes *Annotation*

# Keep generic types for Retrofit
-keepattributes RuntimeVisible...Annotations, AnnotationDefault

Verify: ./gradlew assembleRelease
Then test: Install and run release APK`,
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
    error: `java.lang.RuntimeException: Failed to invoke constructor com.example.models.User with no args
    Caused by: java.lang.NoSuchMethodException: com.example.models.User.<init> []`,
    diagnosis: {
      problem: 'Gson data class fields renamed/removed by R8, breaking JSON deserialization',
      rootCause: 'ProGuard/R8 obfuscated field names, Gson cannot match JSON keys to fields',
      evidence: 'NoSuchMethodException for constructor, or fields mismatch after deserialization',
      confidence: 0.95
    },
    solution: {
      summary: 'Add ProGuard keep rule for Gson model classes',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep Gson model classes (field names needed for serialization)
-keep class com.example.models.** { *; }
-keepclassmembers class com.example.models.** { *; }

# Keep generic types for Gson
-keepattributes Signature

# Keep annotations for Gson
-keepattributes *Annotation*

# Alternative: Use @Keep annotation on each model class
import androidx.annotation.Keep
@Keep
data class User(val id: Int, val name: String)`,
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
    error: `java.lang.RuntimeException: cannot find implementation for com.example.db.AppDatabase. AppDatabase_Impl does not exist`,
    diagnosis: {
      problem: 'Room generated implementation classes removed by R8',
      rootCause: 'ProGuard/R8 removed Room generated classes (_Impl suffix) used at runtime',
      evidence: 'RuntimeException stating _Impl class does not exist in release build',
      confidence: 0.95
    },
    solution: {
      summary: 'Add ProGuard keep rule for Room generated classes',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep Room database and DAOs
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Database class *
-keep @androidx.room.Dao class *
-keep @androidx.room.Entity class *

# Keep Room generated implementation classes
-keep class **_Impl { *; }

# Keep query methods
-keepclassmembers class * extends androidx.room.RoomDatabase {
    public abstract **;
}`,
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
    error: `java.lang.RuntimeException: Unable to instantiate fragment com.example.ui.ProfileFragment: could not find Fragment constructor`,
    diagnosis: {
      problem: 'Fragment no-arg constructor removed by R8',
      rootCause: 'ProGuard/R8 removed default constructor, required by Android framework for fragment recreation',
      evidence: 'RuntimeException unable to instantiate fragment, missing constructor',
      confidence: 0.9
    },
    solution: {
      summary: 'Add ProGuard keep rule for Fragment constructors',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep Fragment constructors (needed by Android framework)
-keep public class * extends androidx.fragment.app.Fragment {
    public <init>();
}

# Keep Fragment arguments
-keepclassmembers class * extends androidx.fragment.app.Fragment {
    public <init>(...);
}

# Alternative: Ensure Fragment has public no-arg constructor
class ProfileFragment : Fragment() {
    // Empty constructor exists by default in Kotlin
}`,
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
    error: `java.lang.NoSuchMethodError: No virtual method updateUser(Lcom/example/models/User;)V in class Lcom/example/viewmodels/ProfileViewModel;`,
    diagnosis: {
      problem: 'ViewModel methods removed by R8 (appears unused but called from XML or reflection)',
      rootCause: 'ProGuard/R8 removed methods that are only called from data binding or reflection',
      evidence: 'NoSuchMethodError for ViewModel method in release, works in debug',
      confidence: 0.85
    },
    solution: {
      summary: 'Add ProGuard keep rule for ViewModel methods',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep ViewModel classes and methods (used by data binding)
-keep class * extends androidx.lifecycle.ViewModel {
    public <methods>;
}

# Keep methods called from XML layouts (data binding)
-keepclassmembers class * extends androidx.lifecycle.ViewModel {
    public *;
}

# Keep LiveData methods
-keep class androidx.lifecycle.LiveData { *; }
-keep class androidx.lifecycle.MutableLiveData { *; }`,
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
    error: `java.lang.ClassNotFoundException: Didn't find class "com.example.ui.ProfileFragmentArgs" on path: DexPathList`,
    diagnosis: {
      problem: 'Navigation SafeArgs generated classes removed by R8',
      rootCause: 'ProGuard/R8 removed generated Args and Directions classes used by Navigation component',
      evidence: 'ClassNotFoundException for *Args or *Directions classes in release',
      confidence: 0.95
    },
    solution: {
      summary: 'Add ProGuard keep rule for SafeArgs generated classes',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep Navigation SafeArgs generated classes
-keep class **Args { *; }
-keep class **Directions { *; }

# Keep navigation component classes
-keep class androidx.navigation.** { *; }
-keepnames class androidx.navigation.** { *; }

# Keep parcelable arguments
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}`,
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
    error: `Firebase Crashlytics: No crash reports appearing in console after minification`,
    diagnosis: {
      problem: 'Crashlytics unable to report crashes due to obfuscated stack traces',
      rootCause: 'ProGuard/R8 removed line numbers and class names needed for crash reports',
      evidence: 'Crashlytics works in debug, no reports in release build',
      confidence: 0.9
    },
    solution: {
      summary: 'Add ProGuard rules to preserve crash reporting info',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable

# Keep custom exception classes
-keep public class * extends java.lang.Exception

# Keep Crashlytics
-keep class com.google.firebase.crashlytics.** { *; }
-dontwarn com.google.firebase.crashlytics.**

# Also add mapping file upload in build.gradle:
android {
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            firebaseCrashlytics {
                mappingFileUploadEnabled true
            }
        }
    }
}`,
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
    error: `java.lang.NoSuchMethodError: No static method Dispatchers()Lkotlinx/coroutines/Dispatchers; in class Lkotlinx/coroutines/Dispatchers;`,
    diagnosis: {
      problem: 'Kotlin coroutines dispatcher methods obfuscated by R8',
      rootCause: 'ProGuard/R8 removed or renamed coroutine dispatcher methods',
      evidence: 'NoSuchMethodError for Dispatchers in release, coroutines fail',
      confidence: 0.85
    },
    solution: {
      summary: 'Add ProGuard keep rule for Kotlin coroutines',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep Kotlin coroutines
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
-keep class kotlinx.coroutines.** { *; }

# Keep ServiceLoader support for coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Keep dispatchers
-keep class kotlinx.coroutines.Dispatchers { *; }
-keep class kotlinx.coroutines.android.** { *; }`,
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
    error: `java.lang.ClassNotFoundException: kotlin.reflect.jvm.internal.ReflectionFactoryImpl`,
    diagnosis: {
      problem: 'Kotlin reflection classes removed by R8',
      rootCause: 'ProGuard/R8 removed Kotlin reflection support classes used at runtime',
      evidence: 'ClassNotFoundException for Kotlin reflection classes',
      confidence: 0.9
    },
    solution: {
      summary: 'Add ProGuard keep rule for Kotlin reflection',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep Kotlin reflection
-keep class kotlin.reflect.** { *; }
-keep class kotlin.Metadata { *; }

# Keep reflection factory
-keep class kotlin.reflect.jvm.internal.** { *; }

# Keep annotations used by reflection
-keepattributes *Annotation*

Note: Kotlin reflection is heavy. If not needed, avoid ::class usage in code.
Consider using regular classes instead of KClass where possible.`,
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
    error: `java.lang.IllegalArgumentException: No enum constant com.example.models.Status.ACTIVE`,
    diagnosis: {
      problem: 'Enum constant names obfuscated by R8, breaking serialization/deserialization',
      rootCause: 'ProGuard/R8 renamed enum constants, JSON parser cannot match names',
      evidence: 'IllegalArgumentException for enum constant in release',
      confidence: 0.95
    },
    solution: {
      summary: 'Add ProGuard keep rule for enum classes',
      specificFix: `File: app/proguard-rules.pro

Add:
# Keep enum classes and their values
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep specific enum package
-keep class com.example.models.** extends java.lang.Enum { *; }

# Keep enum names for serialization
-keepnames class * extends java.lang.Enum {
    *;
}`,
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
