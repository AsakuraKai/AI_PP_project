/**
 * Extended Test Dataset - 30 Additional Cases
 * 
 * Brings total dataset to 100 cases (70 existing + 30 new)
 * Designed for 8B model constraints with diverse real-world scenarios
 * 
 * Focus areas:
 * - Underrepresented error types
 * - Multi-language scenarios (Kotlin + Java interop)
 * - Build system errors (Maven, Gradle plugins)
 * - Resource and configuration errors
 * - Edge cases for RCA agent
 */

export interface ExtendedTestCase {
    id: string;
    name: string;
    category: 'kotlin' | 'gradle' | 'compose' | 'xml' | 'manifest' | 'build' | 'resource' | 'interop';
    errorType: string;
    complexity: 'easy' | 'medium' | 'hard';
    description: string;
    errorText: string;
    expectedRootCause: string;
    sampleCode: string;
    tags: string[];
}

export const extendedTestDataset: ExtendedTestCase[] = [
    // ========== KOTLIN ADVANCED ERRORS (5) ==========

    {
        id: 'EXT-001',
        name: 'Sealed Class Exhaustive When',
        category: 'kotlin',
        errorType: 'compilation_error',
        complexity: 'medium',
        description: 'Non-exhaustive when statement on sealed class',
        errorText: `
e: MainActivity.kt:45:9 'when' expression must be exhaustive, add necessary 'is Error' branch or 'else' branch instead
    at com.example.MainActivity.handleResult(MainActivity.kt:45)`,
        expectedRootCause: 'When expression not exhaustive - missing sealed class branch',
        sampleCode: `sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
    object Loading : Result()
}

fun handleResult(result: Result) {
    when (result) {
        is Result.Success -> println(result.data)
        is Result.Loading -> println("Loading...")
        // ERROR: Missing 'is Result.Error' branch
    }
}`,
        tags: ['kotlin', 'sealed-class', 'when', 'exhaustive'],
    },

    {
        id: 'EXT-002',
        name: 'Coroutine Context Missing',
        category: 'kotlin',
        errorType: 'runtime_error',
        complexity: 'hard',
        description: 'Coroutine launched without proper context',
        errorText: `
IllegalStateException: Module with the Main dispatcher had failed to initialize
    at kotlinx.coroutines.internal.MissingMainCoroutineDispatcher.missing(Missing.kt:14)
    at kotlinx.coroutines.Dispatchers.getMain(Dispatchers.kt:52)
    at com.example.MainViewModel.loadData(MainViewModel.kt:28)`,
        expectedRootCause: 'Missing kotlinx-coroutines-android dependency for Main dispatcher',
        sampleCode: `class MainViewModel : ViewModel() {
    fun loadData() {
        viewModelScope.launch {
            // ERROR: Dispatchers.Main not available
            val data = repository.fetchData()
            _state.value = data
        }
    }
}

// FIX: Add dependency in build.gradle
// implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"`,
        tags: ['kotlin', 'coroutines', 'dispatcher', 'dependency'],
    },

    {
        id: 'EXT-003',
        name: 'Delegation Property Error',
        category: 'kotlin',
        errorType: 'unresolved_reference',
        complexity: 'medium',
        description: 'Property delegation to unresolved delegate',
        errorText: `
e: HomeFragment.kt:22:24 Unresolved reference: viewModel
    val viewModel: HomeViewModel by viewModel()
                                     ^`,
        expectedRootCause: 'Missing Koin dependency or import for viewModel() delegate',
        sampleCode: `class HomeFragment : Fragment() {
    // ERROR: viewModel() delegate not found
    private val viewModel: HomeViewModel by viewModel()
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.loadData()
    }
}

// FIX: Add import
// import org.koin.androidx.viewmodel.ext.android.viewModel`,
        tags: ['kotlin', 'delegation', 'koin', 'dependency-injection'],
    },

    {
        id: 'EXT-004',
        name: 'Data Class Copy Error',
        category: 'kotlin',
        errorType: 'type_mismatch',
        complexity: 'easy',
        description: 'Type mismatch in data class copy function',
        errorText: `
e: UserRepository.kt:34:42 Type mismatch: inferred type is Int but String was expected
    val updated = user.copy(age = "25")
                                  ^`,
        expectedRootCause: 'Passing String to Int parameter in copy function',
        sampleCode: `data class User(
    val name: String,
    val age: Int
)

fun updateUser(user: User) {
    // ERROR: age is Int, not String
    val updated = user.copy(age = "25")
}`,
        tags: ['kotlin', 'data-class', 'type-mismatch'],
    },

    {
        id: 'EXT-005',
        name: 'Extension Function Receiver Null',
        category: 'kotlin',
        errorType: 'npe',
        complexity: 'medium',
        description: 'NPE in extension function on nullable receiver',
        errorText: `
NullPointerException: Attempt to invoke virtual method 'int java.lang.String.length()' on null
    at com.example.StringExtKt.isValid(StringExt.kt:15)
    at com.example.ValidationUtils.validate(ValidationUtils.kt:22)`,
        expectedRootCause: 'Extension function called on null receiver without safe call',
        sampleCode: `fun String.isValid(): Boolean {
    return this.length > 3 && this.isNotBlank()
}

fun validate(input: String?) {
    // ERROR: input is nullable, should use safe call
    if (input.isValid()) {
        println("Valid input")
    }
}

// FIX: Use safe call
fun validate(input: String?) {
    if (input?.isValid() == true) {
        println("Valid input")
    }
}`,
        tags: ['kotlin', 'extension', 'nullable', 'npe'],
    },

    // ========== GRADLE BUILD ERRORS (5) ==========

    {
        id: 'EXT-006',
        name: 'Gradle Version Catalog Error',
        category: 'gradle',
        errorType: 'dependency_error',
        complexity: 'medium',
        description: 'Version catalog library reference not found',
        errorText: `
> Could not resolve all dependencies for configuration ':app:debugRuntimeClasspath'.
   > Could not find libs.androidx.lifecycle.runtime.
     Searched in the following locations:
       - file:/C:/Users/Admin/.gradle/caches/modules-2/files-2.1/libs/androidx/lifecycle/runtime/
     Required by:
         project :app`,
        expectedRootCause: 'Version catalog reference incorrect or libs.versions.toml not found',
        sampleCode: `// build.gradle.kts (app)
dependencies {
    // ERROR: libs.androidx.lifecycle.runtime not defined in version catalog
    implementation(libs.androidx.lifecycle.runtime)
}

// FIX: Check libs.versions.toml
// [libraries]
// androidx-lifecycle-runtime = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle" }`,
        tags: ['gradle', 'version-catalog', 'dependency'],
    },

    {
        id: 'EXT-007',
        name: 'Gradle Plugin Portal Timeout',
        category: 'gradle',
        errorType: 'network_error',
        complexity: 'easy',
        description: 'Network timeout downloading Gradle plugin',
        errorText: `
> Could not resolve all files for configuration ':classpath'.
   > Could not resolve com.android.tools.build:gradle:8.2.0.
     Required by:
         project :
      > Could not resolve com.android.tools.build:gradle:8.2.0.
         > Could not get resource 'https://plugins.gradle.org/m2/com/android/tools/build/gradle/8.2.0/gradle-8.2.0.pom'.
            > Read timed out`,
        expectedRootCause: 'Network connectivity issue or proxy configuration needed',
        sampleCode: `// build.gradle.kts (project)
buildscript {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal() // Timeout here
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
    }
}

// FIX: Check network, add proxy if needed in gradle.properties
// systemProp.http.proxyHost=proxy.company.com
// systemProp.http.proxyPort=8080`,
        tags: ['gradle', 'network', 'timeout', 'plugin'],
    },

    {
        id: 'EXT-008',
        name: 'Kotlin Multiplatform Plugin Conflict',
        category: 'gradle',
        errorType: 'plugin_error',
        complexity: 'hard',
        description: 'Conflicting Kotlin plugins in multiplatform project',
        errorText: `
> The Kotlin Gradle plugin was loaded multiple times in different subprojects, which is not supported and may break the build.
  This might happen in subprojects that apply the Kotlin plugins with different versions.
  
  - project ':app' -> kotlin("android") version "1.9.20"
  - project ':shared' -> kotlin("multiplatform") version "1.9.22"`,
        expectedRootCause: 'Inconsistent Kotlin plugin versions across modules',
        sampleCode: `// settings.gradle.kts
pluginManagement {
    plugins {
        kotlin("android") version "1.9.20" apply false
        kotlin("multiplatform") version "1.9.22" apply false // ERROR: Version mismatch
    }
}

// FIX: Use same version
pluginManagement {
    val kotlinVersion = "1.9.22"
    plugins {
        kotlin("android") version kotlinVersion apply false
        kotlin("multiplatform") version kotlinVersion apply false
    }
}`,
        tags: ['gradle', 'kotlin', 'multiplatform', 'plugin', 'version'],
    },

    {
        id: 'EXT-009',
        name: 'Gradle Daemon OutOfMemory',
        category: 'gradle',
        errorType: 'build_config_error',
        complexity: 'medium',
        description: 'Gradle daemon runs out of heap memory',
        errorText: `
Expiring Daemon because JVM heap space is exhausted
java.lang.OutOfMemoryError: Java heap space
    at org.gradle.internal.io.LineBufferingOutputStream.write(LineBufferingOutputStream.java:62)
    at com.android.build.gradle.internal.tasks.Workers.kt:123

* What went wrong:
Gradle build daemon disappeared unexpectedly`,
        expectedRootCause: 'Insufficient heap size for large project or parallel execution',
        sampleCode: `// gradle.properties (Current - Too small)
org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=512m

// FIX: Increase heap size
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError

// Also consider reducing parallel workers
org.gradle.workers.max=4`,
        tags: ['gradle', 'memory', 'performance', 'daemon'],
    },

    {
        id: 'EXT-010',
        name: 'Gradle Build Cache Corruption',
        category: 'gradle',
        errorType: 'build_config_error',
        complexity: 'medium',
        description: 'Corrupted build cache causing build failures',
        errorText: `
> Task :app:compileDebugKotlin FAILED
Could not read cache entry for task ':app:compileDebugKotlin'

Caused by: java.io.EOFException: Unexpected end of ZLIB input stream
    at java.util.zip.InflaterInputStream.fill(InflaterInputStream.java:242)
    at org.gradle.cache.internal.DefaultSerializer.read`,
        expectedRootCause: 'Corrupted Gradle build cache entries',
        sampleCode: `// Command to fix
// 1. Stop Gradle daemon
./gradlew --stop

// 2. Clean build cache
./gradlew cleanBuildCache

// 3. Delete .gradle directory
rm -rf .gradle/

// 4. Rebuild
./gradlew clean build

// Or disable build cache temporarily in gradle.properties
// org.gradle.caching=false`,
        tags: ['gradle', 'cache', 'corruption', 'build'],
    },

    // ========== JETPACK COMPOSE ERRORS (5) ==========

    {
        id: 'EXT-011',
        name: 'Compose Modifier Order Wrong',
        category: 'compose',
        errorType: 'modifier_chain',
        complexity: 'medium',
        description: 'Incorrect modifier order causing layout issues',
        errorText: `
java.lang.IllegalStateException: LayoutNode should be attached to an owner
    at androidx.compose.ui.node.LayoutNode.onAttach(LayoutNode.kt:856)
    at com.example.ProfileScreen(ProfileScreen.kt:45)`,
        expectedRootCause: 'Clickable modifier applied after padding - events not capturing correctly',
        sampleCode: `@Composable
fun ProfileCard() {
    // ERROR: clickable should come after padding for proper hit area
    Box(
        modifier = Modifier
            .clickable { /* ... */ }
            .padding(16.dp)
            .background(Color.White)
    ) {
        Text("Profile")
    }
}

// FIX: Correct order
Box(
    modifier = Modifier
        .padding(16.dp)
        .clickable { /* ... */ }
        .background(Color.White)
) {
    Text("Profile")
}`,
        tags: ['compose', 'modifier', 'order', 'clickable'],
    },

    {
        id: 'EXT-012',
        name: 'Compose Key Not Stable',
        category: 'compose',
        errorType: 'recomposition',
        complexity: 'hard',
        description: 'LazyColumn item key changes causing recomposition',
        errorText: `
IllegalStateException: Key ABC123 was already used. Keys must be unique.
    at androidx.compose.foundation.lazy.LazyListKt.items(LazyList.kt:234)
    at com.example.UserListScreen(UserListScreen.kt:56)`,
        expectedRootCause: 'Duplicate or changing keys in LazyColumn causing state loss',
        sampleCode: `@Composable
fun UserList(users: List<User>) {
    LazyColumn {
        items(
            items = users,
            // ERROR: Using index as key - causes issues when list changes
            key = { index -> index }
        ) { user ->
            UserItem(user)
        }
    }
}

// FIX: Use stable unique key
LazyColumn {
    items(
        items = users,
        key = { user -> user.id } // Stable unique key
    ) { user ->
        UserItem(user)
    }
}`,
        tags: ['compose', 'lazy-column', 'key', 'recomposition'],
    },

    {
        id: 'EXT-013',
        name: 'CompositionLocal Not Provided',
        category: 'compose',
        errorType: 'runtime_error',
        complexity: 'medium',
        description: 'CompositionLocal accessed before being provided',
        errorText: `
IllegalStateException: CompositionLocal LocalAppTheme not present
    at androidx.compose.runtime.CompositionLocal.getCurrent(CompositionLocal.kt:55)
    at com.example.ThemedButton(ThemedButton.kt:23)`,
        expectedRootCause: 'CompositionLocalProvider not wrapping composable hierarchy',
        sampleCode: `val LocalAppTheme = compositionLocalOf<AppTheme> {
    error("No theme provided")
}

@Composable
fun ThemedButton() {
    // ERROR: LocalAppTheme not provided
    val theme = LocalAppTheme.current
    Button(colors = ButtonDefaults.buttonColors(theme.primaryColor)) {
        Text("Click")
    }
}

// FIX: Provide at app root
CompositionLocalProvider(LocalAppTheme provides AppTheme.Default) {
    ThemedButton()
}`,
        tags: ['compose', 'composition-local', 'provider'],
    },

    {
        id: 'EXT-014',
        name: 'Compose State Hoisting Missing',
        category: 'compose',
        errorType: 'compose_remember',
        complexity: 'easy',
        description: 'State not hoisted causing preview issues',
        errorText: `
java.lang.IllegalStateException: Reading a state that was created in a composable function but not remembered
    at androidx.compose.runtime.ComposerImpl.createState(Composer.kt:1823)
    at com.example.SearchBar(SearchBar.kt:18)`,
        expectedRootCause: 'State created in composable without remember - lost on recomposition',
        sampleCode: `@Composable
fun SearchBar() {
    // ERROR: State not remembered
    var query = mutableStateOf("")
    
    TextField(
        value = query.value,
        onValueChange = { query.value = it }
    )
}

// FIX: Use remember
@Composable
fun SearchBar() {
    var query by remember { mutableStateOf("") }
    
    TextField(
        value = query,
        onValueChange = { query = it }
    )
}`,
        tags: ['compose', 'state', 'remember', 'hoisting'],
    },

    {
        id: 'EXT-015',
        name: 'Compose SnapshotState Mutation',
        category: 'compose',
        errorType: 'snapshot_state',
        complexity: 'hard',
        description: 'Mutating snapshot state outside composition',
        errorText: `
IllegalStateException: Cannot modify state during composition
    at androidx.compose.runtime.snapshots.SnapshotStateList.add(SnapshotStateList.kt:123)
    at com.example.TaskList.addTask(TaskList.kt:34)`,
        expectedRootCause: 'Attempting to modify state list during composition phase',
        sampleCode: `@Composable
fun TaskList() {
    val tasks = remember { mutableStateListOf<Task>() }
    
    // ERROR: Modifying state during composition
    if (tasks.isEmpty()) {
        tasks.add(Task("Default"))
    }
    
    LazyColumn {
        items(tasks) { task ->
            TaskItem(task)
        }
    }
}

// FIX: Use LaunchedEffect
@Composable
fun TaskList() {
    val tasks = remember { mutableStateListOf<Task>() }
    
    LaunchedEffect(Unit) {
        if (tasks.isEmpty()) {
            tasks.add(Task("Default"))
        }
    }
    
    LazyColumn {
        items(tasks) { task ->
            TaskItem(task)
        }
    }
}`,
        tags: ['compose', 'snapshot-state', 'mutation', 'side-effect'],
    },

    // ========== ANDROID XML / RESOURCE ERRORS (5) ==========

    {
        id: 'EXT-016',
        name: 'Vector Drawable Compatibility',
        category: 'xml',
        errorType: 'resource_not_found',
        complexity: 'medium',
        description: 'Vector drawable not rendering on API < 21',
        errorText: `
android.content.res.Resources$NotFoundException: Drawable res/drawable/ic_search.xml with resource ID #0x7f070045
Caused by: org.xmlpull.v1.XmlPullParserException: Binary XML file line #2: invalid drawable tag vector
    at android.graphics.drawable.DrawableInflater.inflateFromXml(DrawableInflater.java:129)`,
        expectedRootCause: 'Vector drawable requires vectorDrawables.useSupportLibrary flag for old APIs',
        sampleCode: `<!-- res/drawable/ic_search.xml -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path android:fillColor="#FF000000"
          android:pathData="M15.5,14h-0.79l-0.28,-0.27C15.41,12.59 16,11.11 16,9.5"/>
</vector>

<!-- FIX: Add to build.gradle -->
android {
    defaultConfig {
        vectorDrawables.useSupportLibrary = true
    }
}

<!-- Use AppCompatImageView in layouts -->
<androidx.appcompat.widget.AppCompatImageView
    android:src="@drawable/ic_search" />`,
        tags: ['xml', 'vector', 'compatibility', 'resource'],
    },

    {
        id: 'EXT-017',
        name: 'ConstraintLayout Circular Dependency',
        category: 'xml',
        errorType: 'layout_inflation',
        complexity: 'hard',
        description: 'Circular constraint causing inflation crash',
        errorText: `
android.view.InflateException: Binary XML file line #12: Binary XML file line #12: Error inflating class androidx.constraintlayout.widget.ConstraintLayout
Caused by: java.lang.IllegalStateException: Circular dependencies cannot exist in RelativeLayout
    at androidx.constraintlayout.widget.ConstraintLayout.onMeasure(ConstraintLayout.java:1532)`,
        expectedRootCause: 'View A constrained to B, View B constrained to A - circular dependency',
        sampleCode: `<!-- ERROR: Circular constraint -->
<androidx.constraintlayout.widget.ConstraintLayout>
    
    <TextView
        android:id="@+id/textA"
        app:layout_constraintTop_toBottomOf="@id/textB" />
    
    <TextView
        android:id="@+id/textB"
        app:layout_constraintTop_toBottomOf="@id/textA" />
        
</androidx.constraintlayout.widget.ConstraintLayout>

<!-- FIX: Break circular dependency -->
<androidx.constraintlayout.widget.ConstraintLayout>
    
    <TextView
        android:id="@+id/textA"
        app:layout_constraintTop_toTopOf="parent" />
    
    <TextView
        android:id="@+id/textB"
        app:layout_constraintTop_toBottomOf="@id/textA" />
        
</androidx.constraintlayout.widget.ConstraintLayout>`,
        tags: ['xml', 'constraint-layout', 'circular', 'layout'],
    },

    {
        id: 'EXT-018',
        name: 'Theme Attribute Not Found',
        category: 'xml',
        errorType: 'attribute_error',
        complexity: 'easy',
        description: 'Custom theme attribute referenced but not defined',
        errorText: `
android.content.res.Resources$NotFoundException: Attribute "customTextColor" not found
    at android.content.res.TypedArray.getColor(TypedArray.java:468)
    at androidx.appcompat.widget.TintTypedArray.getColor(TintTypedArray.java:137)`,
        expectedRootCause: 'Theme attribute used in XML but not declared in attrs.xml',
        sampleCode: `<!-- layout.xml -->
<TextView
    android:textColor="?attr/customTextColor" />
    <!-- ERROR: customTextColor not defined -->

<!-- FIX: Define in res/values/attrs.xml -->
<resources>
    <declare-styleable name="AppTheme">
        <attr name="customTextColor" format="color" />
    </declare-styleable>
</resources>

<!-- Then set in theme (themes.xml) -->
<style name="AppTheme" parent="Theme.Material3...">
    <item name="customTextColor">@color/primary_text</item>
</style>`,
        tags: ['xml', 'theme', 'attribute', 'resource'],
    },

    {
        id: 'EXT-019',
        name: 'Data Binding Expression Error',
        category: 'xml',
        errorType: 'compilation_error',
        complexity: 'medium',
        description: 'Invalid expression in data binding layout',
        errorText: `
error: cannot find symbol
  symbol:   method getFullname()
  location: variable user of type User
  
  file: ActivityMainBinding.java:156
  <TextView android:text="@{user.fullname}" />
                                ^
Execution failed for task ':app:dataBindingGenBaseClassesDebug'.`,
        expectedRootCause: 'Data binding expression references non-existent property',
        sampleCode: `<!-- activity_main.xml -->
<layout>
    <data>
        <variable name="user" type="com.example.User" />
    </data>
    
    <TextView
        android:text="@{user.fullname}" />
        <!-- ERROR: User has firstName/lastName, not fullname -->
</layout>

<!-- FIX: Use correct property or computed value -->
<TextView
    android:text="@{user.firstName + ' ' + user.lastName}" />

<!-- Or add property to User class -->
data class User(
    val firstName: String,
    val lastName: String
) {
    val fullname: String get() = "$firstName $lastName"
}`,
        tags: ['xml', 'data-binding', 'expression', 'property'],
    },

    {
        id: 'EXT-020',
        name: 'Drawable Resource Qualifier Conflict',
        category: 'xml',
        errorType: 'resource_not_found',
        complexity: 'medium',
        description: 'Conflicting resource qualifiers causing wrong drawable selection',
        errorText: `
android.content.res.Resources$NotFoundException: Resource ID #0x7f07006a type #0x0 is not valid
    at android.content.res.Resources.loadDrawableForCookie(Resources.java:2633)
    
Found in: drawable-night-xxhdpi but not in drawable or drawable-xxhdpi`,
        expectedRootCause: 'Drawable exists in specific qualifier folder but not in default folder',
        sampleCode: `// File structure
res/
  drawable-night-xxhdpi/
    ic_logo.png          ← Exists
  drawable-xxhdpi/       ← Missing ic_logo.png
  drawable/              ← Missing ic_logo.png

// ERROR: Night mode + xxhdpi works, but day mode crashes

// FIX: Provide default fallback
res/
  drawable/
    ic_logo.png          ← Add default
  drawable-night/
    ic_logo.png          ← Night variant
  drawable-xxhdpi/
    ic_logo.png          ← High-res default

// Or use single vector drawable
res/
  drawable/
    ic_logo.xml          ← Vector works for all densities`,
        tags: ['xml', 'resource', 'qualifier', 'drawable'],
    },

    // ========== ANDROID MANIFEST ERRORS (5) ==========

    {
        id: 'EXT-021',
        name: 'Manifest Merger Attribute Conflict',
        category: 'manifest',
        errorType: 'manifest_merger_error',
        complexity: 'hard',
        description: 'Conflicting attributes from library manifest',
        errorText: `
Manifest merger failed : Attribute application@allowBackup value=(false) from AndroidManifest.xml:12:9-36
is also present at [com.example:library:1.0.0] AndroidManifest.xml:8:9-35 value=(true).
Suggestion: add 'tools:replace="android:allowBackup"' to <application> element at AndroidManifest.xml:11:5-45:19 to override.`,
        expectedRootCause: 'Library manifest has conflicting allowBackup attribute',
        sampleCode: `<!-- AndroidManifest.xml (app) -->
<manifest>
    <application
        android:allowBackup="false"> <!-- Conflict with library -->
    </application>
</manifest>

<!-- Library manifest has allowBackup="true" -->

<!-- FIX: Use tools:replace -->
<manifest xmlns:tools="http://schemas.android.com/tools">
    <application
        android:allowBackup="false"
        tools:replace="android:allowBackup">
    </application>
</manifest>`,
        tags: ['manifest', 'merger', 'conflict', 'attribute'],
    },

    {
        id: 'EXT-022',
        name: 'Exported Component Without Intent Filter',
        category: 'manifest',
        errorType: 'permission_error',
        complexity: 'medium',
        description: 'Component exported without intent-filter (Android 12+)',
        errorText: `
Apps targeting Android 12 and higher are required to specify an explicit value for android:exported when the corresponding component has an intent filter defined.
AndroidManifest.xml:23: error: Attribute android:exported missing for <activity>`,
        expectedRootCause: 'Android 12+ requires explicit exported attribute for activities with intent filters',
        sampleCode: `<!-- ERROR: Missing exported attribute -->
<activity android:name=".ShareActivity">
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>
</activity>

<!-- FIX: Add explicit exported -->
<activity 
    android:name=".ShareActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>
</activity>`,
        tags: ['manifest', 'exported', 'android-12', 'security'],
    },

    {
        id: 'EXT-023',
        name: 'Missing Splash Screen Theme',
        category: 'manifest',
        errorType: 'theme_error',
        complexity: 'easy',
        description: 'Missing splash screen theme for Android 12+',
        errorText: `
java.lang.RuntimeException: Unable to start activity ComponentInfo: 
android.content.res.Resources$NotFoundException: Resource ID #0x0109030a type #0x01 is not valid
    at android.window.SplashScreen.getOnExitAnimationListener(SplashScreen.java:145)`,
        expectedRootCause: 'Missing windowSplashScreenAnimatedIcon in Android 12+ theme',
        sampleCode: `<!-- AndroidManifest.xml -->
<application
    android:theme="@style/Theme.App">
    <!-- Missing splash screen theme configuration -->
</application>

<!-- FIX: Add splash screen theme (themes.xml v31+) -->
<style name="Theme.App" parent="Theme.Material3...">
    <item name="android:windowSplashScreenBackground">@color/splash_bg</item>
    <item name="android:windowSplashScreenAnimatedIcon">@drawable/ic_launcher</item>
    <item name="android:windowSplashScreenAnimationDuration">500</item>
</style>

<!-- Or use SplashScreen API -->
dependencies {
    implementation "androidx.core:core-splashscreen:1.0.1"
}`,
        tags: ['manifest', 'splash-screen', 'android-12', 'theme'],
    },

    {
        id: 'EXT-024',
        name: 'Duplicate Permission Declaration',
        category: 'manifest',
        errorType: 'permission_error',
        complexity: 'medium',
        description: 'Permission declared multiple times causing merge failure',
        errorText: `
Manifest merger failed : Attribute permission#android.permission.CAMERA@name value=(android.permission.CAMERA) 
from AndroidManifest.xml:15:5-76
is also present at AndroidManifest.xml:8:5-76.`,
        expectedRootCause: 'Same permission declared twice in manifest',
        sampleCode: `<!-- ERROR: Duplicate permission -->
<manifest>
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- ... other content ... -->
    
    <uses-permission android:name="android.permission.CAMERA" /> <!-- Duplicate -->
</manifest>

<!-- FIX: Remove duplicate -->
<manifest>
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- Only declare each permission once -->
</manifest>`,
        tags: ['manifest', 'permission', 'duplicate', 'merger'],
    },

    {
        id: 'EXT-025',
        name: 'Service Missing Foreground Service Type',
        category: 'manifest',
        errorType: 'permission_error',
        complexity: 'medium',
        description: 'Foreground service missing required type (Android 14+)',
        errorText: `
java.lang.SecurityException: Starting FGS with type location 
callerApp=ProcessRecord requires permissions: all of the permissions
    at com.example.LocationService.onCreate(LocationService.kt:45)
    
Missing foregroundServiceType in manifest for Android 14+`,
        expectedRootCause: 'Android 14+ requires explicit foregroundServiceType declaration',
        sampleCode: `<!-- ERROR: Missing foregroundServiceType -->
<service android:name=".LocationService" />

<!-- FIX: Add foregroundServiceType -->
<service 
    android:name=".LocationService"
    android:foregroundServiceType="location"
    android:permission="android.permission.FOREGROUND_SERVICE_LOCATION">
</service>

<!-- And request permission in manifest -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`,
        tags: ['manifest', 'service', 'foreground', 'android-14'],
    },

    // ========== MULTI-LAYER / COMPLEX ERRORS (5) ==========

    {
        id: 'EXT-026',
        name: 'ProGuard Rule Missing for Reflection',
        category: 'build',
        errorType: 'obfuscation_error',
        complexity: 'hard',
        description: 'ProGuard removes class accessed via reflection',
        errorText: `
java.lang.ClassNotFoundException: com.example.data.UserResponse
    at java.lang.Class.classForName(Native Method)
    at retrofit2.Platform.loadServiceMethod(Platform.java:128)
    
NOTE: Release build only - works in debug`,
        expectedRootCause: 'ProGuard obfuscated/removed class used by Retrofit/Gson via reflection',
        sampleCode: `// proguard-rules.pro (Missing rules)
-keep class com.example.** { *; }

// ERROR: Too broad, slows down obfuscation

// FIX: Specific rules for data models
-keep class com.example.data.** { *; }
-keepclassmembers class com.example.data.** {
    <fields>;
    <init>(...);
}

// Keep Retrofit/Gson annotations
-keepattributes Signature
-keepattributes *Annotation*

// Retrofit
-keep interface com.example.api.** { *; }

// Gson
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.SerializedName <fields>;
}`,
        tags: ['proguard', 'reflection', 'obfuscation', 'retrofit'],
    },

    {
        id: 'EXT-027',
        name: 'Dex Method Limit Exceeded',
        category: 'build',
        errorType: 'dex_error',
        complexity: 'medium',
        description: 'DEX file method count exceeds 65K limit',
        errorText: `
DexArchiveMergerException: Error while merging dex archives:
The number of method references in a .dex file cannot exceed 64K.
Learn how to resolve this issue at https://developer.android.com/tools/building/multidex.html

com.android.builder.dexing.DexArchiveMergerException: Unable to merge dex`,
        expectedRootCause: 'App exceeds 65,536 method limit without MultiDex enabled',
        sampleCode: `// build.gradle.kts (app)
android {
    defaultConfig {
        minSdk = 21
        // ERROR: Missing multiDexEnabled
    }
}

dependencies {
    // Many large libraries
    implementation("com.google.android.gms:play-services:18.0.0") // 20K methods
}

// FIX: Enable MultiDex
android {
    defaultConfig {
        minSdk = 21
        multiDexEnabled = true
    }
}

dependencies {
    implementation("androidx.multidex:multidex:2.0.1")
}

// For minSdk < 21, update Application class
class MyApp : MultiDexApplication()`,
        tags: ['dex', 'method-limit', 'multidex', 'build'],
    },

    {
        id: 'EXT-028',
        name: 'R8 Full Mode Breaking App',
        category: 'build',
        errorType: 'obfuscation_error',
        complexity: 'hard',
        description: 'R8 full mode optimization removes used code',
        errorText: `
java.lang.NoSuchMethodError: No virtual method setValue(Ljava/lang/Object;)V in class Landroidx/lifecycle/MutableLiveData
    at com.example.MainViewModel.updateData(MainViewModel.kt:34)
    
NOTE: Only in release build with R8 full mode`,
        expectedRootCause: 'R8 full mode optimizes away overloaded methods',
        sampleCode: `// gradle.properties
android.enableR8.fullMode=true  # ERROR: Too aggressive

// proguard-rules.pro (Missing rules)
# No keep rules for ViewModels

// FIX: Add keep rules
-keep class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}

-keepclassmembers class * extends androidx.lifecycle.ViewModel {
    <fields>;
    <methods>;
}

// Or disable full mode temporarily
android.enableR8.fullMode=false`,
        tags: ['r8', 'optimization', 'viewmodel', 'release'],
    },

    {
        id: 'EXT-029',
        name: 'Room Database Migration Missing',
        category: 'interop',
        errorType: 'runtime_error',
        complexity: 'medium',
        description: 'Room database schema changed without migration',
        errorText: `
java.lang.IllegalStateException: Room cannot verify the data integrity. 
Looks like you've changed schema but forgot to update the version number. 
You can simply fix this by increasing the version number.

Expected: TableInfo{name='users', columns={id=Column{...}, email=Column{...}}}
Found:    TableInfo{name='users', columns={id=Column{...}}}`,
        expectedRootCause: 'Database schema changed (added email column) but version not incremented',
        sampleCode: `// UserDao.kt (Old)
@Entity(tableName = "users")
data class User(
    @PrimaryKey val id: Int
)

@Database(entities = [User::class], version = 1) // ERROR: Version not updated
abstract class AppDatabase : RoomDatabase()

// UserDao.kt (New - added email)
@Entity(tableName = "users")
data class User(
    @PrimaryKey val id: Int,
    val email: String // New field
)

// FIX: Increment version and provide migration
@Database(entities = [User::class], version = 2)
abstract class AppDatabase : RoomDatabase()

val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''")
    }
}

Room.databaseBuilder(context, AppDatabase::class.java, "app.db")
    .addMigrations(MIGRATION_1_2)
    .build()`,
        tags: ['room', 'database', 'migration', 'schema'],
    },

    {
        id: 'EXT-030',
        name: 'WorkManager CoroutineWorker Crash',
        category: 'interop',
        errorType: 'runtime_error',
        complexity: 'hard',
        description: 'WorkManager Worker crashes with coroutine error',
        errorText: `
java.lang.IllegalStateException: Module with the Main dispatcher had failed to initialize
    at kotlinx.coroutines.internal.MissingMainCoroutineDispatcher.missing(Missing.kt:14)
    at com.example.SyncWorker.doWork(SyncWorker.kt:23)
    at androidx.work.CoroutineWorker$startWork$1.invokeSuspend(CoroutineWorker.kt:68)`,
        expectedRootCause: 'WorkManager Worker runs in background - needs explicit dispatcher',
        sampleCode: `class SyncWorker(context: Context, params: WorkerParameters) 
    : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        // ERROR: Tries to use Dispatchers.Main implicitly
        viewModelScope.launch {
            repository.sync()
        }
        return Result.success()
    }
}

// FIX: Use explicit dispatcher
class SyncWorker(context: Context, params: WorkerParameters) 
    : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            repository.sync()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}

// Or ensure kotlinx-coroutines-android is included
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}`,
        tags: ['workmanager', 'coroutines', 'dispatcher', 'background'],
    },
];

// ========== DATASET STATISTICS ==========

export const extendedDatasetStats = {
    totalCases: 30,
    byCategory: {
        kotlin: 5,
        gradle: 5,
        compose: 5,
        xml: 5,
        manifest: 5,
        build: 3,
        interop: 2,
    },
    byComplexity: {
        easy: 6,
        medium: 15,
        hard: 9,
    },
    byErrorType: {
        compilation_error: 3,
        runtime_error: 6,
        dependency_error: 2,
        network_error: 1,
        plugin_error: 2,
        build_config_error: 3,
        layout_inflation: 2,
        resource_not_found: 3,
        attribute_error: 2,
        permission_error: 3,
        theme_error: 1,
        obfuscation_error: 2,
        npe: 1,
        type_mismatch: 1,
        unresolved_reference: 1,
        modifier_chain: 1,
        recomposition: 1,
        compose_remember: 1,
        snapshot_state: 1,
        manifest_merger_error: 1,
        dex_error: 1,
    },
};

// ========== UTILITY FUNCTIONS ==========

export function getExtendedTestCaseById(id: string): ExtendedTestCase | undefined {
    return extendedTestDataset.find(tc => tc.id === id);
}

export function getExtendedTestCasesByCategory(category: string): ExtendedTestCase[] {
    return extendedTestDataset.filter(tc => tc.category === category);
}

export function getExtendedTestCasesByComplexity(complexity: 'easy' | 'medium' | 'hard'): ExtendedTestCase[] {
    return extendedTestDataset.filter(tc => tc.complexity === complexity);
}

export function getExtendedTestCasesByTag(tag: string): ExtendedTestCase[] {
    return extendedTestDataset.filter(tc => tc.tags.includes(tag));
}
