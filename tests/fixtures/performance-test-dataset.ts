/**
 * Performance Test Dataset
 * 
 * Comprehensive test cases for evaluating RCA Agent performance across:
 * - Multiple error types (26+ types)
 * - Varying complexity levels (Simple → Complex → Edge Cases)
 * - Real-world scenarios
 * - Cross-cutting concerns (multi-layer errors)
 * 
 * Usage:
 * ```typescript
 * import { PERFORMANCE_TEST_CASES, ErrorComplexity } from './performance-test-dataset';
 * 
 * // Run all tests
 * for (const testCase of PERFORMANCE_TEST_CASES) {
 *   await agent.analyze(testCase.error);
 * }
 * 
 * // Filter by complexity
 * const simpleTests = PERFORMANCE_TEST_CASES.filter(t => t.complexity === 'simple');
 * ```
 */

export type ErrorComplexity = 'simple' | 'medium' | 'complex' | 'edge-case';
export type ErrorCategory = 'kotlin' | 'gradle' | 'compose' | 'xml' | 'manifest' | 'multi-layer';

export interface PerformanceTestCase {
  id: string;
  name: string;
  category: ErrorCategory;
  errorType: string;
  complexity: ErrorComplexity;
  description: string;
  error: string;
  expectedDuration: number; // seconds
  testObjectives: string[];
  sourceFile?: string;
  stackTrace?: string;
}

// ========================================
// CATEGORY 1: KOTLIN ERRORS (6 types)
// ========================================

export const KOTLIN_TEST_CASES: PerformanceTestCase[] = [
  {
    id: 'KT-001',
    name: 'Simple lateinit NPE',
    category: 'kotlin',
    errorType: 'lateinit',
    complexity: 'simple',
    description: 'Basic lateinit property not initialized',
    expectedDuration: 60,
    testObjectives: [
      'Baseline latency measurement',
      'Parser accuracy on simple cases',
      'ReadFileTool context extraction',
    ],
    error: `
kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized
    at com.example.app.MainActivity.onCreate(MainActivity.kt:25)
    at android.app.Activity.performCreate(Activity.java:8000)
    at android.app.Instrumentation.callActivityOnCreate(Instrumentation.java:1309)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/MainActivity.kt',
  },

  {
    id: 'KT-002',
    name: 'Standard NullPointerException',
    category: 'kotlin',
    errorType: 'npe',
    complexity: 'simple',
    description: 'Classic NPE from null reference',
    expectedDuration: 65,
    testObjectives: [
      'NPE detection accuracy',
      'Stack trace filtering (user code vs framework)',
      'Variable name extraction',
    ],
    error: `
java.lang.NullPointerException: Attempt to invoke virtual method 'java.lang.String com.example.User.getName()' on a null object reference
    at com.example.app.UserRepository.fetchUserName(UserRepository.kt:45)
    at com.example.app.ProfileViewModel.loadUser(ProfileViewModel.kt:78)
    at com.example.app.ProfileFragment.onViewCreated(ProfileFragment.kt:32)
    at androidx.fragment.app.Fragment.performViewCreated(Fragment.java:3019)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/UserRepository.kt',
  },

  {
    id: 'KT-003',
    name: 'Type mismatch error',
    category: 'kotlin',
    errorType: 'type_mismatch',
    complexity: 'medium',
    description: 'Compile-time type mismatch with generics',
    expectedDuration: 70,
    testObjectives: [
      'Compilation error parsing',
      'Generic type extraction',
      'Expected vs actual type analysis',
    ],
    error: `
e: file:///app/src/main/kotlin/com/example/app/DataManager.kt:56:28 Type mismatch: inferred type is List<String> but List<Int> was expected
    val numbers: List<Int> = dataSource.fetchData()
                             ^
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/DataManager.kt',
  },

  {
    id: 'KT-004',
    name: 'Unresolved reference',
    category: 'kotlin',
    errorType: 'unresolved_reference',
    complexity: 'medium',
    description: 'Missing import or typo in function name',
    expectedDuration: 70,
    testObjectives: [
      'Compilation error detection',
      'Symbol resolution analysis',
      'Import suggestion generation',
    ],
    error: `
e: file:///app/src/main/kotlin/com/example/app/NetworkClient.kt:42:16 Unresolved reference: Dispatchers
    withContext(Dispatchers.IO) {
                ^
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/NetworkClient.kt',
  },

  {
    id: 'KT-005',
    name: 'IndexOutOfBoundsException',
    category: 'kotlin',
    errorType: 'npe',
    complexity: 'medium',
    description: 'Array/List access beyond bounds',
    expectedDuration: 75,
    testObjectives: [
      'Index error detection',
      'Collection boundary analysis',
      'Loop/iteration logic inspection',
    ],
    error: `
java.lang.IndexOutOfBoundsException: Index: 5, Size: 3
    at java.util.ArrayList.rangeCheck(ArrayList.java:659)
    at java.util.ArrayList.get(ArrayList.java:435)
    at com.example.app.ListAdapter.onBindViewHolder(ListAdapter.kt:28)
    at androidx.recyclerview.widget.RecyclerView$Adapter.onBindViewHolder(RecyclerView.java:7065)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ListAdapter.kt',
  },

  {
    id: 'KT-006',
    name: 'Complex multi-threaded NPE',
    category: 'kotlin',
    errorType: 'npe',
    complexity: 'complex',
    description: 'Race condition causing NPE in coroutine',
    expectedDuration: 90,
    testObjectives: [
      'Concurrency error analysis',
      'Coroutine context inspection',
      'Thread-safety recommendations',
    ],
    error: `
java.lang.NullPointerException: Attempt to read from field 'java.lang.String com.example.app.data.CachedData.value' on a null object reference
    at com.example.app.CacheManager$fetchData$2.invokeSuspend(CacheManager.kt:67)
    at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33)
    at kotlinx.coroutines.DispatchedTask.run(DispatchedTask.kt:106)
    at kotlinx.coroutines.scheduling.CoroutineScheduler.runSafely(CoroutineScheduler.kt:571)
    at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.executeTask(CoroutineScheduler.kt:750)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/CacheManager.kt',
  },
];

// ========================================
// CATEGORY 2: GRADLE ERRORS (5 types)
// ========================================

export const GRADLE_TEST_CASES: PerformanceTestCase[] = [
  {
    id: 'GR-001',
    name: 'Dependency version conflict',
    category: 'gradle',
    errorType: 'dependency_conflict',
    complexity: 'medium',
    description: 'Two libraries requiring different versions of same dependency',
    expectedDuration: 80,
    testObjectives: [
      'Dependency tree analysis',
      'Version conflict resolution',
      'Resolution strategy suggestions',
    ],
    error: `
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:checkDebugDuplicateClasses'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.CheckDuplicatesRunnable
   > Duplicate class kotlin.collections.AbstractList found in modules jetified-kotlin-stdlib-1.8.0 (org.jetbrains.kotlin:kotlin-stdlib:1.8.0) and jetified-kotlin-stdlib-common-1.9.0 (org.jetbrains.kotlin:kotlin-stdlib-common:1.9.0)
     
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
    `,
    sourceFile: 'app/build.gradle.kts',
  },

  {
    id: 'GR-002',
    name: 'Missing repository',
    category: 'gradle',
    errorType: 'dependency_resolution_error',
    complexity: 'simple',
    description: 'Artifact not found in configured repositories',
    expectedDuration: 65,
    testObjectives: [
      'Repository configuration validation',
      'Artifact resolution path tracing',
      'Repository suggestion generation',
    ],
    error: `
FAILURE: Build failed with an exception.

* What went wrong:
Could not resolve all files for configuration ':app:debugCompileClasspath'.
> Could not find com.example:custom-library:1.2.3.
  Searched in the following locations:
    - https://repo.maven.apache.org/maven2/com/example/custom-library/1.2.3/custom-library-1.2.3.pom
  Required by:
      project :app
    `,
    sourceFile: 'app/build.gradle.kts',
  },

  {
    id: 'GR-003',
    name: 'Kotlin version mismatch',
    category: 'gradle',
    errorType: 'compilation_error',
    complexity: 'medium',
    description: 'Plugin and stdlib version incompatibility',
    expectedDuration: 75,
    testObjectives: [
      'Plugin version compatibility check',
      'Kotlin toolchain analysis',
      'Version alignment recommendations',
    ],
    error: `
e: java.lang.IllegalStateException: The Kotlin Gradle plugin was loaded with an older version of the Kotlin Compiler library. Expected version: 1.9.0; actual version: 1.8.10
    at org.jetbrains.kotlin.gradle.plugin.KotlinGradleSubplugin.getCompilerPluginId(KotlinGradleSubplugin.kt:85)
    
* Try:
> Use Kotlin plugin version that matches your stdlib version
    `,
    sourceFile: 'build.gradle.kts',
  },

  {
    id: 'GR-004',
    name: 'Task execution failure',
    category: 'gradle',
    errorType: 'task_failure',
    complexity: 'medium',
    description: 'Custom task failing during build',
    expectedDuration: 80,
    testObjectives: [
      'Task failure root cause identification',
      'Task dependency analysis',
      'Configuration inspection',
    ],
    error: `
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:processDebugManifest'.
> Unable to make field private final java.lang.String java.io.File.path accessible: module java.base does not "opens java.io" to unnamed module @6d4b1c02

* Try:
> Run with --stacktrace option to get the stack trace.
    `,
    sourceFile: 'app/build.gradle.kts',
  },

  {
    id: 'GR-005',
    name: 'Complex multi-module dependency cycle',
    category: 'gradle',
    errorType: 'dependency_conflict',
    complexity: 'complex',
    description: 'Circular dependencies between modules',
    expectedDuration: 95,
    testObjectives: [
      'Dependency graph analysis',
      'Cycle detection accuracy',
      'Refactoring suggestions',
    ],
    error: `
FAILURE: Build failed with an exception.

* What went wrong:
Circular dependency between the following tasks:
:app:compileDebugKotlin
\\--- :core:compileDebugKotlin
     \\--- :networking:compileDebugKotlin
          \\--- :app:compileDebugKotlin (*)

(*) - details omitted (listed previously)

* Try:
> Run with --stacktrace option to get the stack trace.
    `,
    sourceFile: 'settings.gradle.kts',
  },
];

// ========================================
// CATEGORY 3: JETPACK COMPOSE ERRORS (8 types)
// ========================================

export const COMPOSE_TEST_CASES: PerformanceTestCase[] = [
  {
    id: 'CP-001',
    name: 'Missing remember call',
    category: 'compose',
    errorType: 'compose_remember',
    complexity: 'simple',
    description: 'State not wrapped in remember',
    expectedDuration: 70,
    testObjectives: [
      'Compose API misuse detection',
      'State management analysis',
      'Recomposition impact assessment',
    ],
    error: `
java.lang.IllegalStateException: Reading a state that was created after the snapshot was taken or in a snapshot that has not yet been applied
    at androidx.compose.runtime.snapshots.SnapshotKt.readError(Snapshot.kt:2287)
    at androidx.compose.runtime.MutableState.getValue(SnapshotState.kt:42)
    at com.example.app.ui.CounterScreen(CounterScreen.kt:18)
    at androidx.compose.runtime.internal.ComposableLambdaImpl.invoke(ComposableLambda.jvm.kt:109)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/CounterScreen.kt',
  },

  {
    id: 'CP-002',
    name: 'Infinite recomposition loop',
    category: 'compose',
    errorType: 'compose_recomposition',
    complexity: 'complex',
    description: 'State change triggering endless recompositions',
    expectedDuration: 90,
    testObjectives: [
      'Recomposition loop detection',
      'State dependency analysis',
      'Performance impact assessment',
    ],
    error: `
java.lang.StackOverflowError: stack size 8192KB
    at androidx.compose.runtime.ComposerImpl.startReplaceableGroup(Composer.kt:2485)
    at com.example.app.ui.InfiniteLoopScreen(InfiniteLoopScreen.kt:25)
    at androidx.compose.runtime.internal.ComposableLambdaImpl.invoke(ComposableLambda.jvm.kt:109)
    at androidx.compose.runtime.ComposerImpl.doCompose(Composer.kt:3337)
    ... (repeating 1000+ times)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/InfiniteLoopScreen.kt',
  },

  {
    id: 'CP-003',
    name: 'LaunchedEffect missing key',
    category: 'compose',
    errorType: 'compose_launched_effect',
    complexity: 'medium',
    description: 'Side effect running on every recomposition',
    expectedDuration: 75,
    testObjectives: [
      'Side effect lifecycle analysis',
      'Key dependency inspection',
      'Performance optimization suggestions',
    ],
    error: `
E/AndroidRuntime: FATAL EXCEPTION: main
    Process: com.example.app, PID: 12345
    java.util.ConcurrentModificationException: Collection was modified during iteration
    at java.util.ArrayList$Itr.checkForComodification(ArrayList.java:937)
    at com.example.app.ui.DataScreen$1$1.invokeSuspend(DataScreen.kt:42)
    at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/DataScreen.kt',
  },

  {
    id: 'CP-004',
    name: 'CompositionLocal not provided',
    category: 'compose',
    errorType: 'compose_composition_local',
    complexity: 'medium',
    description: 'Accessing CompositionLocal without provider',
    expectedDuration: 70,
    testObjectives: [
      'Composition hierarchy analysis',
      'Provider chain inspection',
      'Scope boundary validation',
    ],
    error: `
java.lang.IllegalStateException: CompositionLocal LocalTheme not present
    at androidx.compose.runtime.CompositionLocalKt.defaultCompositionLocalReadError(CompositionLocal.kt:158)
    at androidx.compose.runtime.CompositionLocal.getCurrent(CompositionLocal.kt:74)
    at com.example.app.ui.ThemedButton(ThemedButton.kt:15)
    at androidx.compose.runtime.internal.ComposableLambdaImpl.invoke(ComposableLambda.jvm.kt:109)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/ThemedButton.kt',
  },

  {
    id: 'CP-005',
    name: 'Incorrect Modifier order',
    category: 'compose',
    errorType: 'compose_modifier_chain',
    complexity: 'simple',
    description: 'Modifier chain causing layout issues',
    expectedDuration: 65,
    testObjectives: [
      'Modifier chain analysis',
      'Layout behavior inspection',
      'Best practice validation',
    ],
    error: `
E/AndroidRuntime: java.lang.IllegalArgumentException: LayoutModifier must be applied to a measurable component
    at androidx.compose.ui.layout.LayoutModifierImpl.measure(LayoutModifier.kt:78)
    at androidx.compose.ui.node.LayoutModifierNodeCoordinator.measure-BRTryo0(LayoutModifierNodeCoordinator.kt:45)
    at com.example.app.ui.CustomCard(CustomCard.kt:32)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/CustomCard.kt',
  },

  {
    id: 'CP-006',
    name: 'SideEffect in composition',
    category: 'compose',
    errorType: 'compose_side_effect',
    complexity: 'medium',
    description: 'Direct state mutation in composable body',
    expectedDuration: 75,
    testObjectives: [
      'Side effect detection',
      'Composition phase analysis',
      'State mutation safety check',
    ],
    error: `
java.lang.IllegalStateException: Cannot modify state during composition
    at androidx.compose.runtime.snapshots.SnapshotKt.writeError(Snapshot.kt:2291)
    at androidx.compose.runtime.MutableState.setValue(SnapshotState.kt:48)
    at com.example.app.ui.BadPracticeScreen(BadPracticeScreen.kt:23)
    at androidx.compose.runtime.ComposerImpl.doCompose(Composer.kt:3337)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/BadPracticeScreen.kt',
  },

  {
    id: 'CP-007',
    name: 'DerivedStateOf misuse',
    category: 'compose',
    errorType: 'compose_derived_state',
    complexity: 'medium',
    description: 'Expensive computation not using derivedStateOf',
    expectedDuration: 80,
    testObjectives: [
      'Computed state analysis',
      'Performance profiling',
      'Optimization pattern suggestions',
    ],
    error: `
E/Choreographer: Skipped 127 frames! The application may be doing too much work on its main thread.
    at com.example.app.ui.ExpensiveScreen(ExpensiveScreen.kt:35)
    at androidx.compose.runtime.ComposerImpl.doCompose(Composer.kt:3337)
    
Note: Heavy computation in composable body causing jank
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/ExpensiveScreen.kt',
  },

  {
    id: 'CP-008',
    name: 'SnapshotStateList concurrent modification',
    category: 'compose',
    errorType: 'compose_snapshot_state',
    complexity: 'complex',
    description: 'Race condition in state list modifications',
    expectedDuration: 95,
    testObjectives: [
      'Concurrent state access analysis',
      'Snapshot system understanding',
      'Thread-safety recommendations',
    ],
    error: `
java.util.ConcurrentModificationException: snapshot state list was modified during iteration
    at androidx.compose.runtime.snapshots.SnapshotStateList$StateListIterator.validateModification(SnapshotStateList.kt:287)
    at androidx.compose.runtime.snapshots.SnapshotStateList$StateListIterator.next(SnapshotStateList.kt:276)
    at com.example.app.ui.ListScreen$1.invokeSuspend(ListScreen.kt:55)
    at kotlinx.coroutines.intrinsics.UndispatchedKt.startUndispatchedOrReturn(Undispatched.kt:89)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/ListScreen.kt',
  },
];

// ========================================
// CATEGORY 4: XML ERRORS (7 types)
// ========================================

export const XML_TEST_CASES: PerformanceTestCase[] = [
  {
    id: 'XML-001',
    name: 'Layout inflation error',
    category: 'xml',
    errorType: 'xml_inflation',
    complexity: 'simple',
    description: 'Invalid XML syntax preventing inflation',
    expectedDuration: 60,
    testObjectives: [
      'XML parsing error detection',
      'Syntax validation',
      'Line number accuracy',
    ],
    error: `
android.view.InflateException: Binary XML file line #23: Error inflating class android.widget.LinearLayout
Caused by: android.content.res.Resources$NotFoundException: Resource ID #0x7f08012c type #0x12 is not valid
    at android.content.res.Resources.getAttributeSetSourceResId(Resources.java:2349)
    at android.view.LayoutInflater.rInflate(LayoutInflater.java:1134)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:681)
    at com.example.app.MainActivity.onCreate(MainActivity.java:42)
    `,
    sourceFile: 'app/src/main/res/layout/activity_main.xml',
  },

  {
    id: 'XML-002',
    name: 'Missing view ID reference',
    category: 'xml',
    errorType: 'xml_missing_id',
    complexity: 'simple',
    description: 'findViewById returns null for non-existent ID',
    expectedDuration: 65,
    testObjectives: [
      'Resource ID validation',
      'View binding analysis',
      'XML-code synchronization check',
    ],
    error: `
java.lang.NullPointerException: Attempt to invoke virtual method 'void android.widget.TextView.setText(java.lang.CharSequence)' on a null object reference
    at com.example.app.DetailFragment.onViewCreated(DetailFragment.java:28)
    at androidx.fragment.app.Fragment.performViewCreated(Fragment.java:3019)
    
Note: titleTextView = view.findViewById(R.id.text_title) returned null
    `,
    sourceFile: 'app/src/main/res/layout/fragment_detail.xml',
  },

  {
    id: 'XML-003',
    name: 'Invalid attribute value',
    category: 'xml',
    errorType: 'xml_attribute_error',
    complexity: 'simple',
    description: 'Attribute type mismatch in XML',
    expectedDuration: 65,
    testObjectives: [
      'Attribute validation',
      'Type checking in XML',
      'Resource reference verification',
    ],
    error: `
android.view.InflateException: Binary XML file line #15: Error inflating class ImageView
Caused by: java.lang.NumberFormatException: Invalid int: "abc"
    at java.lang.Integer.invalidInt(Integer.java:138)
    at android.content.res.TypedArray.getLayoutDimension(TypedArray.java:767)
    at android.view.ViewGroup$LayoutParams.setBaseAttributes(ViewGroup.java:7867)
    
XML: <ImageView android:layout_width="abc" ... />
    `,
    sourceFile: 'app/src/main/res/layout/item_card.xml',
  },

  {
    id: 'XML-004',
    name: 'Namespace declaration missing',
    category: 'xml',
    errorType: 'xml_namespace_error',
    complexity: 'medium',
    description: 'Custom attribute without namespace',
    expectedDuration: 70,
    testObjectives: [
      'Namespace validation',
      'Custom attribute handling',
      'XML schema compliance',
    ],
    error: `
android.view.InflateException: Binary XML file line #8: Error inflating class androidx.constraintlayout.widget.ConstraintLayout
Caused by: org.xmlpull.v1.XmlPullParserException: Undefined prefix: app (position:START_TAG <androidx.constraintlayout.widget.ConstraintLayout>@8:5 in Binary XML file line #8)
    at android.content.res.Resources.loadXmlResourceParser(Resources.java:2234)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:539)
    `,
    sourceFile: 'app/src/main/res/layout/constraint_layout.xml',
  },

  {
    id: 'XML-005',
    name: 'View class not found',
    category: 'xml',
    errorType: 'xml_view_not_found',
    complexity: 'medium',
    description: 'Custom view class missing or wrong package',
    expectedDuration: 75,
    testObjectives: [
      'Custom view resolution',
      'Package name validation',
      'Classpath inspection',
    ],
    error: `
android.view.InflateException: Binary XML file line #12: Error inflating class com.example.app.widget.CustomButton
Caused by: java.lang.ClassNotFoundException: Didn't find class "com.example.app.widget.CustomButton" on path: DexPathList
    at dalvik.system.BaseDexClassLoader.findClass(BaseDexClassLoader.java:207)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:379)
    at android.view.LayoutInflater.createView(LayoutInflater.java:854)
    `,
    sourceFile: 'app/src/main/res/layout/custom_view_layout.xml',
  },

  {
    id: 'XML-006',
    name: 'Include tag error',
    category: 'xml',
    errorType: 'xml_include_error',
    complexity: 'medium',
    description: 'Invalid include reference or circular inclusion',
    expectedDuration: 75,
    testObjectives: [
      'Include directive validation',
      'Circular dependency detection',
      'Layout hierarchy analysis',
    ],
    error: `
android.view.InflateException: Binary XML file line #18: Recursive reference in <include> tag
    at android.view.LayoutInflater.parseInclude(LayoutInflater.java:1234)
    at android.view.LayoutInflater.rInflate(LayoutInflater.java:1156)
    
Note: header_layout.xml includes footer_layout.xml which includes header_layout.xml
    `,
    sourceFile: 'app/src/main/res/layout/header_layout.xml',
  },

  {
    id: 'XML-007',
    name: 'Merge tag misuse',
    category: 'xml',
    errorType: 'xml_merge_error',
    complexity: 'complex',
    description: 'Merge tag used incorrectly causing layout issues',
    expectedDuration: 85,
    testObjectives: [
      'Merge tag semantics understanding',
      'Layout optimization analysis',
      'View hierarchy validation',
    ],
    error: `
android.view.InflateException: <merge /> can be used only with a valid ViewGroup root and attachToRoot=true
    at android.view.LayoutInflater.inflate(LayoutInflater.java:565)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:515)
    at com.example.app.CustomView.init(CustomView.java:35)
    
Note: Using merge tag in standalone custom view without proper parent
    `,
    sourceFile: 'app/src/main/res/layout/merge_layout.xml',
  },
];

// ========================================
// CATEGORY 5: MANIFEST ERRORS (5 types)
// ========================================

export const MANIFEST_TEST_CASES: PerformanceTestCase[] = [
  {
    id: 'MF-001',
    name: 'Activity not declared',
    category: 'manifest',
    errorType: 'manifest_undeclared_activity',
    complexity: 'simple',
    description: 'Starting activity not registered in manifest',
    expectedDuration: 60,
    testObjectives: [
      'Manifest validation',
      'Activity registration check',
      'Intent resolution analysis',
    ],
    error: `
android.content.ActivityNotFoundException: Unable to find explicit activity class {com.example.app/com.example.app.SettingsActivity}; have you declared this activity in your AndroidManifest.xml?
    at android.app.Instrumentation.checkStartActivityResult(Instrumentation.java:2073)
    at android.app.Instrumentation.execStartActivity(Instrumentation.java:1697)
    at android.app.Activity.startActivityForResult(Activity.java:5306)
    at com.example.app.MainActivity.openSettings(MainActivity.kt:45)
    `,
    sourceFile: 'app/src/main/AndroidManifest.xml',
  },

  {
    id: 'MF-002',
    name: 'Missing permission',
    category: 'manifest',
    errorType: 'manifest_missing_permission',
    complexity: 'simple',
    description: 'Permission not declared in manifest',
    expectedDuration: 65,
    testObjectives: [
      'Permission declaration check',
      'Runtime permission analysis',
      'API level compatibility',
    ],
    error: `
java.lang.SecurityException: Permission Denial: starting Intent { act=android.intent.action.CALL dat=tel:1234567890 cmp=com.android.server.telecom/.components.UserCallActivity } from ProcessRecord{abc1234 12345:com.example.app/u0a123} (pid=12345, uid=10123) requires android.permission.CALL_PHONE
    at android.os.Parcel.createExceptionOrNull(Parcel.java:2383)
    at android.os.Parcel.createException(Parcel.java:2357)
    at com.example.app.CallManager.makeCall(CallManager.kt:28)
    `,
    sourceFile: 'app/src/main/AndroidManifest.xml',
  },

  {
    id: 'MF-003',
    name: 'Manifest merge conflict',
    category: 'manifest',
    errorType: 'manifest_merge_conflict',
    complexity: 'medium',
    description: 'Conflicting declarations between app and library manifests',
    expectedDuration: 80,
    testObjectives: [
      'Manifest merging analysis',
      'Conflict resolution strategies',
      'Merge rule recommendations',
    ],
    error: `
Execution failed for task ':app:processDebugManifest'.
> Manifest merger failed : Attribute application@icon value=(@mipmap/ic_launcher) from AndroidManifest.xml:12:9-43
        is also present at [com.example:library:1.0.0] AndroidManifest.xml:15:9-45 value=(@drawable/library_icon).
        Suggestion: add 'tools:replace="android:icon"' to <application> element at AndroidManifest.xml:10:5-38:19 to override.
    `,
    sourceFile: 'app/src/main/AndroidManifest.xml',
  },

  {
    id: 'MF-004',
    name: 'Service not declared',
    category: 'manifest',
    errorType: 'manifest_undeclared_service',
    complexity: 'medium',
    description: 'Background service not registered',
    expectedDuration: 70,
    testObjectives: [
      'Service registration validation',
      'Background execution rules',
      'Foreground service requirements',
    ],
    error: `
java.lang.IllegalArgumentException: Service Intent must be explicit: Intent { act=com.example.app.action.SYNC }
    at android.app.ContextImpl.validateServiceIntent(ContextImpl.java:1744)
    at android.app.ContextImpl.startServiceCommon(ContextImpl.java:1790)
    at android.app.ContextImpl.startService(ContextImpl.java:1762)
    at com.example.app.SyncManager.startSync(SyncManager.kt:32)
    `,
    sourceFile: 'app/src/main/AndroidManifest.xml',
  },

  {
    id: 'MF-005',
    name: 'BroadcastReceiver not declared',
    category: 'manifest',
    errorType: 'manifest_undeclared_receiver',
    complexity: 'complex',
    description: 'Broadcast receiver missing from manifest with dynamic registration issues',
    expectedDuration: 85,
    testObjectives: [
      'Receiver registration modes (static vs dynamic)',
      'Broadcast protection level analysis',
      'Intent filter validation',
    ],
    error: `
java.lang.IllegalArgumentException: Receiver not registered: com.example.app.NetworkChangeReceiver
    at android.app.LoadedApk.getReceiverDispatcher(LoadedApk.java:1101)
    at android.app.ContextImpl.unregisterReceiver(ContextImpl.java:2054)
    at com.example.app.NetworkManager.stopMonitoring(NetworkManager.kt:58)
    
Note: Receiver was not properly registered or was already unregistered
    `,
    sourceFile: 'app/src/main/AndroidManifest.xml',
  },
];

// ========================================
// CATEGORY 6: MULTI-LAYER ERRORS (Edge Cases)
// ========================================

export const MULTI_LAYER_TEST_CASES: PerformanceTestCase[] = [
  {
    id: 'ML-001',
    name: 'Compose + Kotlin NPE',
    category: 'multi-layer',
    errorType: 'npe',
    complexity: 'complex',
    description: 'NPE inside Compose due to lateinit access',
    expectedDuration: 100,
    testObjectives: [
      'Multi-layer error tracing',
      'Framework boundary analysis',
      'Cross-concern root cause identification',
    ],
    error: `
kotlin.UninitializedPropertyAccessException: lateinit property repository has not been initialized
    at com.example.app.viewmodel.UserViewModel.getUser(UserViewModel.kt:25)
    at com.example.app.ui.UserScreen$1.invokeSuspend(UserScreen.kt:42)
    at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33)
    at androidx.compose.runtime.ComposerImpl.doCompose(Composer.kt:3337)
    at androidx.compose.ui.platform.AndroidComposeView.onAttachedToWindow(AndroidComposeView.android.kt:1234)
    `,
    sourceFile: 'app/src/main/kotlin/com/example/app/ui/UserScreen.kt',
  },

  {
    id: 'ML-002',
    name: 'Gradle + Manifest conflict',
    category: 'multi-layer',
    errorType: 'manifest_merge_conflict',
    complexity: 'complex',
    description: 'Build configuration causing manifest merge issues',
    expectedDuration: 95,
    testObjectives: [
      'Build-manifest integration analysis',
      'Dependency transitive manifest inspection',
      'Version-specific conflict resolution',
    ],
    error: `
Execution failed for task ':app:processDebugManifest'.
> Manifest merger failed with multiple errors, see logs:
  Error: android:exported needs to be explicitly specified for <activity>. Apps targeting Android 12 and higher are required to specify an explicit value for android:exported
    At AndroidManifest.xml:25:9-37:20
  
  Error: Attribute application@allowBackup value=(true) from AndroidManifest.xml:12:9-35
      is also present at [androidx.security:security-crypto:1.1.0-alpha03] value=(false)
    `,
    sourceFile: 'app/src/main/AndroidManifest.xml',
  },

  {
    id: 'ML-003',
    name: 'Compose + XML mixed layout',
    category: 'multi-layer',
    errorType: 'xml_inflation',
    complexity: 'complex',
    description: 'ComposeView inside XML causing inflation error',
    expectedDuration: 95,
    testObjectives: [
      'Hybrid UI approach validation',
      'Compose-View interop analysis',
      'Layout inflation with Compose',
    ],
    error: `
android.view.InflateException: Binary XML file line #34: Error inflating class androidx.compose.ui.platform.ComposeView
Caused by: java.lang.IllegalStateException: ViewTreeLifecycleOwner not found from androidx.compose.ui.platform.ComposeView
    at androidx.compose.ui.platform.WindowRecomposer_androidKt.createLifecycleAwareWindowRecomposer(WindowRecomposer.android.kt:369)
    at androidx.compose.ui.platform.ComposeView.onAttachedToWindow(ComposeView.android.kt:145)
    at android.view.View.dispatchAttachedToWindow(View.java:20742)
    `,
    sourceFile: 'app/src/main/res/layout/hybrid_layout.xml',
  },

  {
    id: 'ML-004',
    name: 'Gradle + Kotlin + Compose version mismatch',
    category: 'multi-layer',
    errorType: 'compilation_error',
    complexity: 'complex',
    description: 'Incompatible versions across Kotlin, Compose, and Gradle',
    expectedDuration: 100,
    testObjectives: [
      'Multi-tool version compatibility',
      'Ecosystem version alignment',
      'Transitive dependency analysis',
    ],
    error: `
e: This version (1.4.3) of the Compose Compiler requires Kotlin version 1.8.21 but you appear to be using Kotlin version 1.9.0 which is not known to be compatible. Please consult the Compose-Kotlin compatibility map located at https://developer.android.com/jetpack/androidx/releases/compose-kotlin

FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:compileDebugKotlin'.
> Compilation error. See log for more details
    `,
    sourceFile: 'build.gradle.kts',
  },

  {
    id: 'ML-005',
    name: 'All layers combined',
    category: 'multi-layer',
    errorType: 'npe',
    complexity: 'edge-case',
    description: 'Catastrophic failure involving Gradle, Manifest, Kotlin, Compose, and XML',
    expectedDuration: 120,
    testObjectives: [
      'Maximum complexity handling',
      'Prioritization of root causes',
      'Agent resilience under extreme conditions',
    ],
    error: `
Multiple errors detected:

1. Manifest merger failed: Attribute application@theme conflicts between main and library manifests

2. Kotlin compilation error in UserRepository.kt:45 - Type mismatch: List<User> vs List<String>

3. Compose recomposition issue in ProfileScreen.kt causing StackOverflowError

4. XML inflation error in activity_main.xml line 67 - Custom view class not found

5. Gradle dependency conflict: kotlin-stdlib 1.8.0 vs 1.9.0 from different sources

6. NullPointerException in MainActivity.onCreate attempting to access lateinit viewModel

Build failed with 6 errors. See above for details.
    `,
    sourceFile: 'Multiple files',
  },
];

// ========================================
// AGGREGATED TEST DATASET
// ========================================

export const PERFORMANCE_TEST_CASES: PerformanceTestCase[] = [
  ...KOTLIN_TEST_CASES,
  ...GRADLE_TEST_CASES,
  ...COMPOSE_TEST_CASES,
  ...XML_TEST_CASES,
  ...MANIFEST_TEST_CASES,
  ...MULTI_LAYER_TEST_CASES,
];

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function getTestsByComplexity(complexity: ErrorComplexity): PerformanceTestCase[] {
  return PERFORMANCE_TEST_CASES.filter(test => test.complexity === complexity);
}

export function getTestsByCategory(category: ErrorCategory): PerformanceTestCase[] {
  return PERFORMANCE_TEST_CASES.filter(test => test.category === category);
}

export function getTestById(id: string): PerformanceTestCase | undefined {
  return PERFORMANCE_TEST_CASES.find(test => test.id === id);
}

export function getSimpleTests(): PerformanceTestCase[] {
  return getTestsByComplexity('simple');
}

export function getComplexTests(): PerformanceTestCase[] {
  return getTestsByComplexity('complex');
}

export function getEdgeCaseTests(): PerformanceTestCase[] {
  return getTestsByComplexity('edge-case');
}

// ========================================
// TEST STATISTICS
// ========================================

export const TEST_STATISTICS = {
  total: PERFORMANCE_TEST_CASES.length,
  byCategory: {
    kotlin: KOTLIN_TEST_CASES.length,
    gradle: GRADLE_TEST_CASES.length,
    compose: COMPOSE_TEST_CASES.length,
    xml: XML_TEST_CASES.length,
    manifest: MANIFEST_TEST_CASES.length,
    multiLayer: MULTI_LAYER_TEST_CASES.length,
  },
  byComplexity: {
    simple: getTestsByComplexity('simple').length,
    medium: getTestsByComplexity('medium').length,
    complex: getTestsByComplexity('complex').length,
    edgeCase: getTestsByComplexity('edge-case').length,
  },
  expectedTotalDuration: PERFORMANCE_TEST_CASES.reduce((sum, test) => sum + test.expectedDuration, 0),
  averageDuration: PERFORMANCE_TEST_CASES.reduce((sum, test) => sum + test.expectedDuration, 0) / PERFORMANCE_TEST_CASES.length,
};
