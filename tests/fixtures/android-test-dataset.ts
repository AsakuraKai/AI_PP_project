/**
 * Android Test Dataset - Real Android/Compose/Gradle Errors
 * 
 * Collection of 20 real-world Android error examples for Chunk 4.5 testing.
 * Covers:
 * - 5 Jetpack Compose errors
 * - 3 XML layout errors
 * - 5 Gradle build errors
 * - 3 Manifest errors
 * - 4 Mixed errors (multiple error types)
 * 
 * Each error includes:
 * - Raw error text
 * - Expected error type
 * - Expected parser (which tool should parse it)
 * - Expected root cause category
 * - Sample code/config context
 * - Difficulty level
 * 
 * Target accuracy: 14/20 (70%+)
 */

export interface AndroidTestCase {
  id: string;
  name: string;
  category: 'compose' | 'xml' | 'gradle' | 'manifest' | 'mixed';
  errorText: string;
  expectedType: string;
  expectedParser: string;
  expectedRootCause: string;
  sampleCode: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export const androidTestDataset: AndroidTestCase[] = [
  // ========== JETPACK COMPOSE ERRORS (5) ==========
  
  // AC001: remember not used
  {
    id: 'AC001',
    name: 'Compose State Without remember',
    category: 'compose',
    errorText: `IllegalStateException: Reading a state that was created in a composable function but not called with remember
    at androidx.compose.runtime.ComposerImpl.createState(Composer.kt:1823)
    at com.example.HomeScreen(HomeScreen.kt:45)`,
    expectedType: 'compose_remember',
    expectedParser: 'JetpackComposeParser',
    expectedRootCause: 'State created without remember - will reset on recomposition',
    sampleCode: `@Composable
fun HomeScreen() {
    var count = mutableStateOf(0) // ERROR: Should use remember
    
    Button(onClick = { count.value++ }) {
        Text("Count: \${count.value}")
    }
}

// FIX:
@Composable
fun HomeScreen() {
    var count by remember { mutableStateOf(0) }
    
    Button(onClick = { count++ }) {
        Text("Count: \$count")
    }
}`,
    difficulty: 'medium',
    tags: ['compose', 'state', 'remember'],
  },

  // AC002: Infinite recomposition
  {
    id: 'AC002',
    name: 'Compose Infinite Recomposition',
    category: 'compose',
    errorText: `IllegalStateException: Recomposing 1000 times, possible infinite recomposition detected
    at androidx.compose.runtime.Recomposer.recompose(Recomposer.kt:567)
    at com.example.ProfileCard(ProfileCard.kt:28)`,
    expectedType: 'compose_recomposition',
    expectedParser: 'JetpackComposeParser',
    expectedRootCause: 'State change inside composition causing infinite recomposition loop',
    sampleCode: `@Composable
fun ProfileCard(name: String) {
    var displayName by remember { mutableStateOf(name) }
    
    // ERROR: Setting state during composition
    displayName = name.uppercase()
    
    Text(text = displayName)
}

// FIX:
@Composable
fun ProfileCard(name: String) {
    val displayName = remember(name) {
        name.uppercase()
    }
    
    Text(text = displayName)
}`,
    difficulty: 'hard',
    tags: ['compose', 'recomposition', 'performance'],
  },

  // AC003: LaunchedEffect key missing
  {
    id: 'AC003',
    name: 'LaunchedEffect Without Key',
    category: 'compose',
    errorText: `IllegalStateException: LaunchedEffect called with key 'true' runs only once. Use specific keys to relaunch.
    at com.example.DataScreen(DataScreen.kt:52)`,
    expectedType: 'compose_launched_effect',
    expectedParser: 'JetpackComposeParser',
    expectedRootCause: 'LaunchedEffect with constant key - effect will not rerun when data changes',
    sampleCode: `@Composable
fun DataScreen(userId: String) {
    var userData by remember { mutableStateOf<User?>(null) }
    
    // ERROR: Using 'true' as key - effect runs only once
    LaunchedEffect(true) {
        userData = fetchUser(userId)
    }
    
    Text(userData?.name ?: "Loading...")
}

// FIX:
@Composable
fun DataScreen(userId: String) {
    var userData by remember { mutableStateOf<User?>(null) }
    
    LaunchedEffect(userId) { // Rerun when userId changes
        userData = fetchUser(userId)
    }
    
    Text(userData?.name ?: "Loading...")
}`,
    difficulty: 'medium',
    tags: ['compose', 'side-effects', 'launched-effect'],
  },

  // AC004: CompositionLocal not provided
  {
    id: 'AC004',
    name: 'CompositionLocal Not Provided',
    category: 'compose',
    errorText: `IllegalStateException: CompositionLocal LocalUserSession not present
    at androidx.compose.runtime.CompositionLocalKt.CompositionLocalConsumer(CompositionLocal.kt:89)
    at com.example.UserProfile(UserProfile.kt:15)`,
    expectedType: 'compose_composition_local',
    expectedParser: 'JetpackComposeParser',
    expectedRootCause: 'CompositionLocal accessed but not provided by parent composable',
    sampleCode: `val LocalUserSession = compositionLocalOf<UserSession?> { null }

@Composable
fun UserProfile() {
    // ERROR: LocalUserSession not provided
    val session = LocalUserSession.current
    Text(session!!.username)
}

// FIX:
@Composable
fun App() {
    CompositionLocalProvider(LocalUserSession provides userSession) {
        UserProfile()
    }
}`,
    difficulty: 'hard',
    tags: ['compose', 'composition-local', 'context'],
  },

  // AC005: Modifier chain wrong order
  {
    id: 'AC005',
    name: 'Compose Modifier Order Issue',
    category: 'compose',
    errorText: `IllegalArgumentException: Clickable modifier must come before padding/size modifiers
    at com.example.CustomButton(CustomButton.kt:22)`,
    expectedType: 'compose_modifier',
    expectedParser: 'JetpackComposeParser',
    expectedRootCause: 'Modifier chain in wrong order - clickable area smaller than expected',
    sampleCode: `@Composable
fun CustomButton() {
    Box(
        modifier = Modifier
            .size(100.dp)
            .clickable { /* Click */ } // ERROR: After size
            .padding(16.dp)
    )
}

// FIX:
@Composable
fun CustomButton() {
    Box(
        modifier = Modifier
            .clickable { /* Click */ } // Before size/padding
            .size(100.dp)
            .padding(16.dp)
    )
}`,
    difficulty: 'easy',
    tags: ['compose', 'modifier', 'ui'],
  },

  // ========== XML LAYOUT ERRORS (3) ==========

  // AX001: Inflation error
  {
    id: 'AX001',
    name: 'XML Layout Inflation Error',
    category: 'xml',
    errorText: `android.view.InflateException: Binary XML file line #23: Error inflating class TextView
Caused by: android.content.res.Resources$NotFoundException: Resource ID #0x7f080045
    at android.content.res.Resources.getValue(Resources.java:1351)
    at com.example.MainActivity.onCreate(MainActivity.kt:18)`,
    expectedType: 'xml_inflation',
    expectedParser: 'XMLParser',
    expectedRootCause: 'Invalid resource reference in XML layout',
    sampleCode: `<!-- activity_main.xml line 23 -->
<TextView
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:text="@string/invalid_id" />  <!-- ERROR: Resource not found -->

<!-- Fix: Check strings.xml or use valid resource -->
<TextView
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:text="@string/app_name" />`,
    difficulty: 'easy',
    tags: ['xml', 'inflation', 'resources'],
  },

  // AX002: Missing required attribute
  {
    id: 'AX002',
    name: 'XML Missing Required Attribute',
    category: 'xml',
    errorText: `android.view.InflateException: Binary XML file line #45: You must supply a layout_width attribute
    at android.view.LayoutInflater.inflate(LayoutInflater.java:551)
    at com.example.fragments.HomeFragment.onCreateView(HomeFragment.kt:28)`,
    expectedType: 'xml_missing_attribute',
    expectedParser: 'XMLParser',
    expectedRootCause: 'Required layout attribute missing from view declaration',
    sampleCode: `<!-- fragment_home.xml line 45 -->
<ImageView
    android:layout_height="100dp"
    android:src="@drawable/logo" />  <!-- ERROR: Missing layout_width -->

<!-- Fix: Add required attributes -->
<ImageView
    android:layout_width="wrap_content"
    android:layout_height="100dp"
    android:src="@drawable/logo" />`,
    difficulty: 'easy',
    tags: ['xml', 'attributes', 'layout'],
  },

  // AX003: findViewById returns null
  {
    id: 'AX003',
    name: 'XML View ID Not Found',
    category: 'xml',
    errorText: `NullPointerException: Attempt to invoke virtual method 'void android.widget.Button.setOnClickListener()' on null
    at com.example.DetailActivity.setupUI(DetailActivity.kt:34)`,
    expectedType: 'xml_missing_id',
    expectedParser: 'XMLParser',
    expectedRootCause: 'findViewById returns null - ID not in current layout',
    sampleCode: `// DetailActivity.kt line 34
class DetailActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detail)
        
        // ERROR: saveButton not in activity_detail.xml
        val saveButton = findViewById<Button>(R.id.saveButton)
        saveButton.setOnClickListener { /* ... */ }
    }
}

<!-- activity_detail.xml - saveButton missing -->
<LinearLayout>
    <TextView android:id="@+id/title" />
    <!-- No saveButton defined -->
</LinearLayout>

<!-- Fix: Add button to layout -->
<LinearLayout>
    <TextView android:id="@+id/title" />
    <Button android:id="@+id/saveButton" />
</LinearLayout>`,
    difficulty: 'medium',
    tags: ['xml', 'findviewbyid', 'null'],
  },

  // ========== GRADLE BUILD ERRORS (5) ==========

  // AG001: Dependency conflict
  {
    id: 'AG001',
    name: 'Gradle Dependency Conflict',
    category: 'gradle',
    errorText: `FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:checkDebugDuplicateClasses'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.CheckDuplicatesRunnable
   > Duplicate class com.google.common.util.concurrent.ListenableFuture found in modules
     guava-30.1-jre.jar (com.google.guava:guava:30.1-jre)
     listenablefuture-1.0.jar (com.google.guava:listenablefuture:1.0)`,
    expectedType: 'gradle_dependency_conflict',
    expectedParser: 'GradleParser',
    expectedRootCause: 'Multiple dependencies include same classes - version conflict',
    sampleCode: `// build.gradle (app) - BEFORE
dependencies {
    implementation 'com.google.guava:guava:30.1-jre'
    implementation 'com.google.guava:listenablefuture:1.0'
}

// Fix: Exclude conflicting dependency
dependencies {
    implementation('com.google.guava:guava:30.1-jre') {
        exclude group: 'com.google.guava', module: 'listenablefuture'
    }
}`,
    difficulty: 'medium',
    tags: ['gradle', 'dependency', 'conflict'],
  },

  // AG002: Version mismatch
  {
    id: 'AG002',
    name: 'Gradle Kotlin Version Mismatch',
    category: 'gradle',
    errorText: `FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:compileDebugKotlin'.
> Module was compiled with an incompatible version of Kotlin. The binary version of its metadata is 1.9.0, expected version is 1.7.10.
  Module: androidx.compose.runtime:runtime-desktop:1.5.0`,
    expectedType: 'gradle_version_mismatch',
    expectedParser: 'GradleParser',
    expectedRootCause: 'Kotlin compiler version older than library requirements',
    sampleCode: `// build.gradle (project) - BEFORE
buildscript {
    ext.kotlin_version = '1.7.10'  // Too old
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

// Fix: Update Kotlin version
buildscript {
    ext.kotlin_version = '1.9.0'  // Match or exceed library requirement
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}`,
    difficulty: 'medium',
    tags: ['gradle', 'kotlin', 'version'],
  },

  // AG003: Repository missing
  {
    id: 'AG003',
    name: 'Gradle Repository Not Found',
    category: 'gradle',
    errorText: `FAILURE: Build failed with an exception.

* What went wrong:
Could not resolve all dependencies for configuration ':app:debugRuntimeClasspath'.
> Could not find androidx.compose.ui:ui:1.5.0.
  Searched in the following locations:
    - https://repo.maven.apache.org/maven2/androidx/compose/ui/ui/1.5.0/ui-1.5.0.pom
  Required by:
      project :app`,
    expectedType: 'gradle_dependency_resolution_error',
    expectedParser: 'GradleParser',
    expectedRootCause: 'Maven repository missing - Google Maven not configured',
    sampleCode: `// build.gradle (project) - BEFORE
allprojects {
    repositories {
        mavenCentral()
        // Missing Google Maven
    }
}

// Fix: Add Google Maven repository
allprojects {
    repositories {
        google()  // Add this for AndroidX and Jetpack libraries
        mavenCentral()
    }
}`,
    difficulty: 'easy',
    tags: ['gradle', 'repository', 'maven'],
  },

  // AG004: Plugin not found
  {
    id: 'AG004',
    name: 'Gradle Plugin Not Applied',
    category: 'gradle',
    errorText: `FAILURE: Build failed with an exception.

* What went wrong:
Plugin [id: 'com.google.gms.google-services', version: '4.3.15'] was not found in any of the following sources:
- Gradle Core Plugins (plugin is not in 'org.gradle' namespace)
- Plugin Repositories (could not resolve plugin artifact 'com.google.gms:google-services:4.3.15')`,
    expectedType: 'gradle_plugin_error',
    expectedParser: 'GradleParser',
    expectedRootCause: 'Plugin classpath missing from buildscript dependencies',
    sampleCode: `// build.gradle (app) - BEFORE
plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'  // Plugin not in classpath
}

// build.gradle (project) - Fix
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
        classpath 'com.google.gms:google-services:4.3.15'  // Add plugin
    }
}`,
    difficulty: 'medium',
    tags: ['gradle', 'plugin', 'classpath'],
  },

  // AG005: Gradle sync failed
  {
    id: 'AG005',
    name: 'Gradle Build Script Syntax Error',
    category: 'gradle',
    errorText: `FAILURE: Build failed with an exception.

* Where:
Build file 'C:\\Users\\Admin\\project\\app\\build.gradle' line: 45

* What went wrong:
Could not compile build file 'C:\\Users\\Admin\\project\\app\\build.gradle'.
> startup failed:
  build file 'C:\\Users\\Admin\\project\\app\\build.gradle': 45: unexpected token: { @ line 45, column 25.
     implementation("androidx.core:core-ktx:1.10.0" {`,
    expectedType: 'gradle_build_script_syntax_error',
    expectedParser: 'GradleParser',
    expectedRootCause: 'Syntax error in build.gradle - missing closing parenthesis',
    sampleCode: `// build.gradle (app) line 45 - BEFORE
dependencies {
    implementation("androidx.core:core-ktx:1.10.0" {  // ERROR: Missing )
        exclude group: 'test'
    }
}

// Fix: Add missing parenthesis
dependencies {
    implementation("androidx.core:core-ktx:1.10.0") {
        exclude group: 'test'
    }
}`,
    difficulty: 'easy',
    tags: ['gradle', 'syntax', 'build-script'],
  },

  // ========== MANIFEST ERRORS (3) ==========

  // AM001: Missing permission
  {
    id: 'AM001',
    name: 'Manifest Missing Camera Permission',
    category: 'manifest',
    errorText: `java.lang.SecurityException: Permission Denial: starting Intent { act=android.media.action.IMAGE_CAPTURE } from ProcessRecord{abc123 12345:com.example.app/u0a123} (pid=12345, uid=10123) requires android.permission.CAMERA
    at android.os.Parcel.createException(Parcel.java:2079)
    at com.example.CameraActivity.takePicture(CameraActivity.kt:56)`,
    expectedType: 'manifest_missing_permission',
    expectedParser: 'ManifestAnalyzerTool',
    expectedRootCause: 'CAMERA permission not declared in AndroidManifest.xml',
    sampleCode: `<!-- AndroidManifest.xml - BEFORE -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Missing CAMERA permission -->
    <application>...</application>
</manifest>

<!-- Fix: Add permission declaration -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.CAMERA" />
    <application>...</application>
</manifest>

// Also need runtime permission check for Android 6.0+
if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
    != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this, 
        arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA)
}`,
    difficulty: 'medium',
    tags: ['manifest', 'permission', 'camera'],
  },

  // AM002: Undeclared activity
  {
    id: 'AM002',
    name: 'Manifest Undeclared Activity',
    category: 'manifest',
    errorText: `android.content.ActivityNotFoundException: Unable to find explicit activity class {com.example.app/com.example.app.SettingsActivity}; have you declared this activity in your AndroidManifest.xml?
    at android.app.Instrumentation.checkStartActivityResult(Instrumentation.java:2005)
    at com.example.MainActivity.openSettings(MainActivity.kt:89)`,
    expectedType: 'manifest_undeclared_activity',
    expectedParser: 'ManifestAnalyzerTool',
    expectedRootCause: 'Activity not declared in manifest - cannot be launched',
    sampleCode: `<!-- AndroidManifest.xml - BEFORE -->
<application>
    <activity android:name=".MainActivity" />
    <!-- SettingsActivity not declared -->
</application>

<!-- Fix: Add activity declaration -->
<application>
    <activity android:name=".MainActivity" />
    <activity 
        android:name=".SettingsActivity"
        android:label="@string/settings_title" />
</application>`,
    difficulty: 'easy',
    tags: ['manifest', 'activity', 'declaration'],
  },

  // AM003: Manifest merge conflict
  {
    id: 'AM003',
    name: 'Manifest Merge Conflict',
    category: 'manifest',
    errorText: `Execution failed for task ':app:processDebugManifest'.
> Manifest merger failed : Attribute application@allowBackup value=(false) from AndroidManifest.xml:12:9-36
  	is also present at [com.example:library:1.0.0] AndroidManifest.xml:8:9-35 value=(true).
  	Suggestion: add 'tools:replace="android:allowBackup"' to <application> element at AndroidManifest.xml:11:5-45:19 to override.`,
    expectedType: 'manifest_merge_conflict',
    expectedParser: 'ManifestAnalyzerTool',
    expectedRootCause: 'Conflicting attribute values between app and library manifests',
    sampleCode: `<!-- AndroidManifest.xml - BEFORE -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="false">  <!-- Conflicts with library -->
        ...
    </application>
</manifest>

<!-- Fix: Use tools:replace to override -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <application
        android:allowBackup="false"
        tools:replace="android:allowBackup">  <!-- Override library value -->
        ...
    </application>
</manifest>`,
    difficulty: 'medium',
    tags: ['manifest', 'merge', 'conflict'],
  },

  // ========== MIXED ERRORS (4) ==========

  // AM004: Kotlin + Gradle mixed
  {
    id: 'AM004',
    name: 'Mixed: Unresolved Reference + Dependency',
    category: 'mixed',
    errorText: `Unresolved reference: viewModelScope
e: C:\\Users\\Admin\\project\\app\\src\\main\\java\\com\\example\\MainViewModel.kt: (23, 9): Unresolved reference: viewModelScope

FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:compileDebugKotlin'.
> Compilation error. See log for more details`,
    expectedType: 'unresolved_reference',
    expectedParser: 'KotlinParser',
    expectedRootCause: 'Missing lifecycle-viewmodel-ktx dependency for viewModelScope',
    sampleCode: `// MainViewModel.kt line 23 - ERROR
class MainViewModel : ViewModel() {
    fun loadData() {
        viewModelScope.launch {  // ERROR: Unresolved reference
            // ...
        }
    }
}

// build.gradle (app) - Fix
dependencies {
    implementation "androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1"
    // This adds viewModelScope extension
}`,
    difficulty: 'medium',
    tags: ['kotlin', 'gradle', 'dependency', 'unresolved'],
  },

  // AM005: XML + Manifest mixed
  {
    id: 'AM005',
    name: 'Mixed: Layout + Permission',
    category: 'mixed',
    errorText: `android.view.InflateException: Binary XML file line #34: Error inflating class WebView
Caused by: java.lang.SecurityException: Permission Denial: WebView requires INTERNET permission
    at android.webkit.WebView.<init>(WebView.java:789)
    at com.example.BrowserFragment.onCreateView(BrowserFragment.kt:28)`,
    expectedType: 'xml_inflation',
    expectedParser: 'XMLParser',
    expectedRootCause: 'WebView requires INTERNET permission not declared in manifest',
    sampleCode: `<!-- fragment_browser.xml line 34 -->
<WebView
    android:id="@+id/webView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />

<!-- AndroidManifest.xml - Missing permission -->
<manifest>
    <!-- Add INTERNET permission -->
    <uses-permission android:name="android.permission.INTERNET" />
    <application>...</application>
</manifest>`,
    difficulty: 'medium',
    tags: ['xml', 'manifest', 'permission', 'webview'],
  },

  // AM006: Compose + Kotlin mixed
  {
    id: 'AM006',
    name: 'Mixed: Compose + Lateinit',
    category: 'mixed',
    errorText: `kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized
    at com.example.MainScreen$lambda-2(MainScreen.kt:35)
    at androidx.compose.runtime.ComposerImpl.invokeComposable(Composer.kt:1567)`,
    expectedType: 'lateinit',
    expectedParser: 'KotlinNPEParser',
    expectedRootCause: 'ViewModel accessed in Composable before initialization',
    sampleCode: `// MainScreen.kt
class MainActivity : ComponentActivity() {
    private lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            MainScreen(viewModel)  // ERROR: Called before initialization
        }
        
        viewModel = ViewModelProvider(this)[MainViewModel::class.java]
    }
}

@Composable
fun MainScreen(viewModel: MainViewModel) {
    // ...
}

// Fix: Initialize before setContent
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    viewModel = ViewModelProvider(this)[MainViewModel::class.java]
    
    setContent {
        MainScreen(viewModel)
    }
}`,
    difficulty: 'hard',
    tags: ['compose', 'kotlin', 'lateinit', 'lifecycle'],
  },

  // AM007: Gradle + Manifest mixed
  {
    id: 'AM007',
    name: 'Mixed: Gradle + Manifest Conflict',
    category: 'mixed',
    errorText: `Execution failed for task ':app:processDebugManifest'.
> Manifest merger failed with multiple errors, see logs

  Error: Attribute application@appComponentFactory value=(androidx.core.app.CoreComponentFactory) from [androidx.core:core:1.10.0]
  	is also present at [androidx.core:core:1.6.0] AndroidManifest.xml:24:18-86 value=(androidx.core.app.CoreComponentFactory).
  
FAILURE: Build failed with an exception.
* What went wrong:
Could not resolve all dependencies for configuration ':app:debugRuntimeClasspath'.
> Conflict found for 'androidx.core:core' library
  Versions: 1.10.0 vs 1.6.0`,
    expectedType: 'gradle_dependency_conflict',
    expectedParser: 'GradleParser',
    expectedRootCause: 'Multiple dependency versions causing manifest merge conflict',
    sampleCode: `// build.gradle (app) - BEFORE
dependencies {
    implementation 'androidx.core:core-ktx:1.10.0'  // Brings core:1.10.0
    implementation 'com.example:old-library:1.0' {
        // This library depends on core:1.6.0
    }
}

// Fix: Force single version
dependencies {
    implementation 'androidx.core:core-ktx:1.10.0'
    
    // Force all androidx.core to use same version
    constraints {
        implementation('androidx.core:core:1.10.0') {
            because 'Resolve manifest merge conflict'
        }
    }
    
    implementation 'com.example:old-library:1.0'
}`,
    difficulty: 'hard',
    tags: ['gradle', 'manifest', 'dependency', 'conflict'],
  },
];

/**
 * Get test cases by category
 */
export function getTestCasesByCategory(
  category: 'compose' | 'xml' | 'gradle' | 'manifest' | 'mixed'
): AndroidTestCase[] {
  return androidTestDataset.filter(tc => tc.category === category);
}

/**
 * Get test cases by difficulty
 */
export function getAndroidTestCasesByDifficulty(
  difficulty: 'easy' | 'medium' | 'hard'
): AndroidTestCase[] {
  return androidTestDataset.filter(tc => tc.difficulty === difficulty);
}

/**
 * Get test case by ID
 */
export function getAndroidTestCaseById(id: string): AndroidTestCase | undefined {
  return androidTestDataset.find(tc => tc.id === id);
}

/**
 * Get test cases by tag
 */
export function getTestCasesByTag(tag: string): AndroidTestCase[] {
  return androidTestDataset.filter(tc => tc.tags.includes(tag));
}

/**
 * Statistics about Android test dataset
 */
export const androidDatasetStats = {
  total: androidTestDataset.length,
  compose: androidTestDataset.filter(tc => tc.category === 'compose').length,
  xml: androidTestDataset.filter(tc => tc.category === 'xml').length,
  gradle: androidTestDataset.filter(tc => tc.category === 'gradle').length,
  manifest: androidTestDataset.filter(tc => tc.category === 'manifest').length,
  mixed: androidTestDataset.filter(tc => tc.category === 'mixed').length,
  easy: androidTestDataset.filter(tc => tc.difficulty === 'easy').length,
  medium: androidTestDataset.filter(tc => tc.difficulty === 'medium').length,
  hard: androidTestDataset.filter(tc => tc.difficulty === 'hard').length,
};

console.log('Android Test Dataset Stats:');
console.log('============================');
console.log(`Total: ${androidDatasetStats.total}`);
console.log(`Compose: ${androidDatasetStats.compose}`);
console.log(`XML: ${androidDatasetStats.xml}`);
console.log(`Gradle: ${androidDatasetStats.gradle}`);
console.log(`Manifest: ${androidDatasetStats.manifest}`);
console.log(`Mixed: ${androidDatasetStats.mixed}`);
console.log(`Easy: ${androidDatasetStats.easy}`);
console.log(`Medium: ${androidDatasetStats.medium}`);
console.log(`Hard: ${androidDatasetStats.hard}`);
