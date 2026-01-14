/**
 * Kotlin NPE Few-Shot Examples
 * Examples for Kotlin NullPointerException scenarios
 */

import { FewShotExample } from '../FewShotExampleService';

export const KOTLIN_NPE_EXAMPLES: FewShotExample[] = [
  {
    id: 'kotlin_lateinit_not_initialized',
    errorType: 'KOTLIN_NPE',
    error: `kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized
    at com.example.app.MainActivity.loadData(MainActivity.kt:42)
    at com.example.app.MainActivity.onCreate(MainActivity.kt:28)`,
    diagnosis: {
      problem: 'Accessing lateinit property before it has been initialized',
      rootCause: 'The viewModel lateinit property is accessed at line 42 before being initialized in onCreate() method',
      evidence: 'Stack trace shows UninitializedPropertyAccessException at MainActivity.kt:42, and onCreate at line 28 suggests initialization happens after first access',
      confidence: 0.95
    },
    solution: {
      summary: 'Initialize lateinit property before first use in onCreate() method',
      specificFix: `File: app/src/main/kotlin/MainActivity.kt at line 35-42

The viewModel must be initialized BEFORE any method calls on it.

Before:
\`\`\`kotlin
class MainActivity : AppCompatActivity() {
    lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        loadData() // Called at line 28 - ERROR: viewModel not initialized yet!
        
        // Initialize viewModel AFTER it's already used
        viewModel = ViewModelProvider(this)[MainViewModel::class.java]
    }
    
    private fun loadData() {
        viewModel.loadData() // Line 42 - CRASH: lateinit property not initialized
    }
}
\`\`\`

After:
\`\`\`kotlin
class MainActivity : AppCompatActivity() {
    lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize viewModel FIRST at line 28
        viewModel = ViewModelProvider(this)[MainViewModel::class.java]
        
        // Now safe to call methods that use viewModel
        loadData()
    }
    
    private fun loadData() {
        viewModel.loadData() // Line 42 - NOW SAFE: viewModel is initialized
    }
}
\`\`\``,
      fileIdentification: 'app/src/main/kotlin/MainActivity.kt:42',
      codeExamples: [
        {
          before: `override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    loadData() // viewModel accessed here but not initialized yet
    viewModel = ViewModelProvider(this)[MainViewModel::class.java]
}`,
          after: `override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    viewModel = ViewModelProvider(this)[MainViewModel::class.java]
    loadData() // Safe - viewModel now initialized
}`
        }
      ],
      verificationSteps: [
        'Move viewModel initialization before first use',
        'Ensure initialization happens in onCreate() before any method calls',
        'Run app and verify no UninitializedPropertyAccessException',
        'Consider using "by viewModels()" delegate to avoid manual initialization'
      ]
    }
  },

  {
    id: 'kotlin_nullable_access',
    errorType: 'KOTLIN_NPE',
    error: `java.lang.NullPointerException: Attempt to invoke virtual method 'int java.lang.String.length()' on a null object reference
    at com.example.app.UserRepository.getUserName(UserRepository.kt:25)`,
    diagnosis: {
      problem: 'Attempting to access property or method on a nullable type without null check',
      rootCause: 'The user?.name value is null but being accessed with non-null assertion (!!) or unsafe call at line 25',
      evidence: 'NPE when calling .length() on String suggests nullable String accessed without null safety',
      confidence: 0.90
    },
    solution: {
      summary: 'Use safe call operator (?.) or null check before accessing nullable properties',
      specificFix: `File: app/src/main/kotlin/UserRepository.kt at line 25

Before:
\`\`\`kotlin
fun getUserName(): String {
    val user = userDao.getCurrentUser()
    // UNSAFE: user could be null, accessing name without null check
    return user.name.uppercase() // Line 25 - CRASH if user or name is null
}
\`\`\`

After (Option 1 - Safe call with default):
\`\`\`kotlin
fun getUserName(): String {
    val user = userDao.getCurrentUser()
    // SAFE: Use safe call (?.) and provide default value with elvis operator (?:)
    return user?.name?.uppercase() ?: "Unknown" // Line 25 - Returns "Unknown" if null
}
\`\`\`

After (Option 2 - Explicit null check):
\`\`\`kotlin
fun getUserName(): String {
    val user = userDao.getCurrentUser()
    // SAFE: Explicit null check before access
    return if (user != null && user.name != null) {
        user.name.uppercase() // Line 25 - Only called if not null
    } else {
        "Unknown"
    }
}
\`\`\`

After (Option 3 - let scope function):
\`\`\`kotlin
fun getUserName(): String {
    val user = userDao.getCurrentUser()
    // SAFE: let only executes if user and name are not null
    return user?.name?.let { name ->
        name.uppercase() // Line 25 - Only called if name is not null
    } ?: "Unknown"
}
\`\`\``,
      fileIdentification: 'app/src/main/kotlin/UserRepository.kt:25',
      codeExamples: [
        {
          before: `return user.name.uppercase()`,
          after: `return user?.name?.uppercase() ?: "Unknown"`
        }
      ],
      verificationSteps: [
        'Add null safety operators (?.) or explicit null checks',
        'Provide default values with elvis operator (?: )',
        'Run app and verify no NullPointerException',
        'Consider making return type nullable (String?) if null is valid'
      ]
    }
  },

  {
    id: 'kotlin_platform_type_npe',
    errorType: 'KOTLIN_NPE',
    error: `java.lang.NullPointerException: Parameter specified as non-null is null: method MainActivity.onActivityResult, parameter data
    at com.example.app.MainActivity.onActivityResult(MainActivity.kt:55)`,
    diagnosis: {
      problem: 'Platform type (from Java) returned null but treated as non-null in Kotlin',
      rootCause: 'Intent data from onActivityResult() can be null (Java API) but Kotlin code assumes non-null at line 55',
      evidence: 'NPE with "Parameter specified as non-null is null" indicates platform type null received by Kotlin non-null parameter',
      confidence: 0.92
    },
    solution: {
      summary: 'Treat platform types as nullable and add null checks',
      specificFix: `File: app/src/main/kotlin/MainActivity.kt at line 55

Platform types (from Java APIs) should always be treated as nullable in Kotlin.

Before:
\`\`\`kotlin
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent) {
    // UNSAFE: data parameter treated as non-null but can be null from Java
    if (resultCode == RESULT_OK) {
        val uri = data.data // Line 55 - CRASH: data can be null
        processImage(uri)
    }
}
\`\`\`

After:
\`\`\`kotlin
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    // SAFE: data parameter explicitly nullable
    if (resultCode == RESULT_OK && data != null) {
        val uri = data.data // Line 55 - Safe: null checked before access
        if (uri != null) {
            processImage(uri)
        }
    }
}
\`\`\`

Even better (with safe calls):
\`\`\`kotlin
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    // SAFE: Using safe call chain
    if (resultCode == RESULT_OK) {
        data?.data?.let { uri ->
            processImage(uri) // Line 55 - Only called if both data and uri are not null
        }
    }
}
\`\`\``,
      fileIdentification: 'app/src/main/kotlin/MainActivity.kt:55',
      codeExamples: [
        {
          before: `override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent) {
    val uri = data.data
    processImage(uri)
}`,
          after: `override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    data?.data?.let { uri ->
        processImage(uri)
    }
}`
        }
      ],
      verificationSteps: [
        'Change platform type parameters to nullable (Intent?)',
        'Add null checks before accessing platform type values',
        'Use safe call operators (?.) for chained access',
        'Test with scenarios where platform methods return null'
      ]
    }
  }
];
