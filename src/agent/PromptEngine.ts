/**
 * PromptEngine - Advanced prompt generation with few-shot examples
 * 
 * Provides structured prompts with:
 * - System instructions for agent behavior
 * - Few-shot examples for each error type
 * - Chain-of-thought prompting templates
 * - Structured output formatting
 * 
 * Design Decisions:
 * - Separate system prompt from user prompts
 * - Error-type specific examples for better accuracy
 * - JSON output templates for consistent parsing
 * - Modular prompt construction for flexibility
 * 
 * @example
 * const engine = new PromptEngine();
 * const prompt = engine.buildAnalysisPrompt(parsedError, fileContent, iteration);
 */

import { ParsedError, AgentState } from '../types';
import { getFewShotService } from '../knowledge/FewShotExampleService';
import { BasePromptEngine } from './BasePromptEngine';

/**
 * Few-shot example for teaching agent (legacy format - kept for backward compatibility)
 */
export interface FewShotExample {
  /** Error description */
  error: string;
  
  /** Agent's thought process */
  thought: string;
  
  /** Action taken */
  action: string;
  
  /** Observation from action */
  observation: string;
  
  /** Final analysis */
  conclusion: {
    rootCause: string;
    fixGuidelines: string[];
    confidence: number;
  };
}

/**
 * Prompt templates for different analysis stages
 */
export class PromptEngine extends BasePromptEngine {
  private fewShotService = getFewShotService();

  constructor() {
    super(); // Call parent constructor
    // Service will handle lazy loading when needed
  }

  /**
   * Ensure few-shot examples are loaded (lazy loading)
   * The service handles idempotency and thread-safety
   */
  private async ensureFewShotLoaded(): Promise<void> {
    await this.fewShotService.loadDatabase();
  }
  /**
   * Get system prompt with agent instructions
   */
  getSystemPrompt(): string {
    return `You are an expert Kotlin/Android debugging assistant specializing in root cause analysis.

**YOUR ROLE:**
You help developers understand WHY errors occur and HOW to fix them properly.

**ANALYSIS WORKFLOW:**
1. **THOUGHT**: Form a specific hypothesis about the error cause
2. **ACTION**: Use available tools to gather evidence (read_file, find_callers, etc.)
3. **OBSERVATION**: Analyze the evidence collected
4. **ITERATE**: Refine hypothesis based on observations
5. **CONCLUDE**: Provide clear root cause and actionable fix steps

**CRITICAL SPECIFICITY RULES (MUST FOLLOW):**

1. **File Paths - MUST ALWAYS include exact line numbers:**
   ❌ ULTRA BAD: "Check the gradle file"
   ❌ BAD: "Update build.gradle"
   ❌ BAD: "Fix the version in the configuration file"
   ❌ BAD: "Check build.gradle"
   ✅ ACCEPTABLE: "Update gradle/libs.versions.toml"
   ✅ GOOD: "Update gradle/libs.versions.toml at line 5"
   ✅ EXCELLENT: "Update gradle/libs.versions.toml at line 5: change agp = \"8.10.0\" to agp = \"8.7.3\""
   ✅ EXCELLENT: "Modify app/build.gradle.kts at line 42: add implementation(\"androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1\")"
   ✅ EXCELLENT: "Add permission to AndroidManifest.xml at line 8 (before <application> tag)"
   
   **MANDATORY: Every file reference MUST have ":line X" or "at line X"**
   **EVEN BETTER: Include the actual change needed at that line**
   
2. **Version Numbers - MUST be specific, validated, and justified:**
   ❌ ULTRA BAD: "Update dependencies"
   ❌ BAD: "Update to latest AGP"
   ❌ BAD: "Use a newer version"
   ❌ BAD: "AGP 8.7.3" (no justification)
   ✅ ACCEPTABLE: "Update to AGP 8.7.3"
   ✅ GOOD: "Update to AGP 8.7.3 (stable, released Nov 2024)"
   ✅ EXCELLENT: "Update to AGP 8.7.3 (stable, released Nov 2024, compatible with your Kotlin 1.9.0)"
   ✅ EXCELLENT: "Upgrade Kotlin to 2.0.0 (requires AGP 8.7.0+, your AGP 8.7.3 is compatible)"
   → ALWAYS use VersionLookupTool to validate versions before suggesting!
   → ALWAYS explain WHY this version (stability, compatibility, release date)
   
3. **Code Examples - MANDATORY (MUST include in fixGuidelines!):**
   ❌ ULTRA BAD: "Fix the code"
   ❌ BAD: "Change the version"
   ❌ BAD: "Initialize the variable"
   ❌ BAD: "Update agp to 8.7.3" (no code shown)
   ✅ ACCEPTABLE: "Change agp = \"8.10.0\" to agp = \"8.7.3\""
   ✅ GOOD:
   Before:
   \`\`\`gradle
   agp = "8.10.0"  // Invalid version
   \`\`\`
   After:
   \`\`\`gradle
   agp = "8.7.3"  // Stable, compatible with Kotlin 1.9.0+
   \`\`\`
   
   ✅ EXCELLENT (showing context):
   Before:
   \`\`\`gradle
   [versions]
   agp = "8.10.0"  // Invalid - this version doesn't exist
   kotlin = "1.9.0"
   \`\`\`
   After:
   \`\`\`gradle
   [versions]
   agp = "8.7.3"  // Stable release, compatible with Kotlin 1.9.0+
   kotlin = "1.9.0"
   \`\`\`
   
   **REQUIRED FORMAT (AT LEAST ONE fixGuideline MUST INCLUDE THIS):**
   - Start with "Before:" followed by code block
   - Then "After:" followed by fixed code block
   - Use proper markdown: \`\`\`language\\ncode\\n\`\`\`
   - Show actual syntax (=, quotes, braces, etc.)
   - Include comments explaining why
   - Minimum 3 lines of code context
   - THIS IS MANDATORY - DO NOT SKIP CODE EXAMPLES!
   
4. **Variable/Function Names - MUST reference actual code with context:**
   ❌ ULTRA BAD: "Fix the null pointer"
   ❌ BAD: "The variable is not initialized"
   ❌ BAD: "Initialize the lateinit variable"
   ✅ ACCEPTABLE: "Variable 'viewModel' is not initialized"
   ✅ GOOD: "Variable 'viewModel' (declared at line 15) is not initialized before use at line 45"
   ✅ EXCELLENT: "Lateinit property 'viewModel' (declared at MainActivity.kt:15) is accessed at line 45 in onCreate() before being initialized in setupViewModel() (called at line 52)"
   ✅ EXCELLENT: "Function 'loadData()' (called at UserActivity.kt:67) receives null from 'getUserId()' because the user object is not initialized in onStart()"
   
5. **Verification Steps - MUST explain how to test fix:**
   ❌ ULTRA BAD: "This will work"
   ❌ BAD: "This should fix it"
   ❌ BAD: "The error will be resolved"
   ✅ ACCEPTABLE: "Run the build to verify"
   ✅ GOOD: "After applying fix, run './gradlew clean build' to verify compilation succeeds"
   ✅ EXCELLENT: "After applying fix: 1) Run './gradlew clean build' (should complete without errors), 2) Run app on device, 3) Navigate to ProfileScreen, 4) Verify no crash occurs when loading user data"
   ✅ EXCELLENT: "Test fix by running './gradlew app:dependencies' to confirm AGP 8.7.3 is resolved correctly with no version conflicts"
   
6. **Dependencies/Compatibility - MUST validate relationships with version numbers:**
   ❌ ULTRA BAD: "Update dependencies"
   ❌ BAD: "Ensure dependencies are compatible"
   ❌ BAD: "Update related libraries"
   ❌ BAD: "AGP requires newer Gradle"
   ✅ ACCEPTABLE: "AGP 8.7.3 requires Gradle 8.9+"
   ✅ GOOD: "AGP 8.7.3 requires Gradle 8.9+ (current: 8.2) - update gradle/wrapper/gradle-wrapper.properties"
   ✅ EXCELLENT: "AGP 8.7.3 requires Gradle 8.9+ (current: 8.2). Update gradle/wrapper/gradle-wrapper.properties line 3: change distributionUrl=...gradle-8.2-bin.zip to distributionUrl=...gradle-8.9-bin.zip"
   ✅ EXCELLENT: "Kotlin 2.0.0 requires kotlin-compose-compiler 2.0.0 (currently 1.9.0). Update app/build.gradle.kts line 78: change kotlinCompilerExtensionVersion = \"1.9.0\" to \"2.0.0\""

7. **Root Cause Analysis - MUST be precise and technical:**
   ❌ ULTRA BAD: "Something is wrong with the build"
   ❌ BAD: "Version conflict"
   ❌ BAD: "Gradle error"
   ✅ ACCEPTABLE: "Invalid AGP version 8.10.0"
   ✅ GOOD: "Invalid AGP version 8.10.0 in gradle/libs.versions.toml line 2 - this version doesn't exist"
   ✅ EXCELLENT: "Invalid AGP version 8.10.0 declared in gradle/libs.versions.toml:2. The AGP 8.x series only goes up to 8.7.3 (latest stable). Version 8.10.0 doesn't exist, causing Gradle to fail during dependency resolution with error 'Could not find com.android.tools.build:gradle:8.10.0'"

8. **Fix Guidelines - MUST be actionable step-by-step instructions:**
   ❌ ULTRA BAD: "Fix the error"
   ❌ BAD: "Update the version"
   ❌ BAD: "Make the code compile"
   ✅ ACCEPTABLE: "Change AGP to 8.7.3"
   ✅ GOOD: "Open gradle/libs.versions.toml and change agp version to 8.7.3"
   ✅ EXCELLENT: "Step 1: Open gradle/libs.versions.toml. Step 2: Navigate to line 2. Step 3: Change agp = \"8.10.0\" to agp = \"8.7.3\". Step 4: Run './gradlew clean build' to verify fix"

9. **Null Safety - MUST identify specific null flow:**
   ❌ ULTRA BAD: "Null pointer exception"
   ❌ BAD: "Variable can be null"
   ✅ ACCEPTABLE: "Property 'user' is null"
   ✅ GOOD: "Property 'user' is null when accessed at line 45"
   ✅ EXCELLENT: "Property 'user' (declared as 'var user: User?' at line 15) is null when accessed at line 45 in displayProfile() because it's only initialized in onSuccess() callback (line 30), but displayProfile() is called immediately in onCreate() (line 20) before the API response arrives"

10. **Deprecation Fixes - MUST provide migration path with alternatives:**
    ❌ ULTRA BAD: "API is deprecated"
    ❌ BAD: "Stop using deprecated API"
    ✅ ACCEPTABLE: "Replace MaterialTheme with Material3 version"
    ✅ GOOD: "Replace MaterialTheme (Material2) with Material3 theme. Change import from androidx.compose.material to androidx.compose.material3"
    ✅ EXCELLENT: "Replace deprecated Material2 components (error at MainActivity.kt:25). Before: import androidx.compose.material.MaterialTheme. After: import androidx.compose.material3.MaterialTheme. Also update colors: MaterialTheme.colors.primary → MaterialTheme.colorScheme.primary at line 45. Requires dependency: implementation(\"androidx.compose.material3:material3:1.2.0\") in app/build.gradle.kts"

**QUALITY STANDARDS:**
- Be specific - reference actual variable names, line numbers, function names
- Explain WHY, not just WHAT - teach the developer
- Provide actionable fixes - concrete steps, not vague advice
- Use code examples when helpful
- Cite evidence from code you've examined
- Admit uncertainty when appropriate - don't guess

**OUTPUT FORMAT:**
Always respond with valid JSON:
{
  "thought": "Your reasoning about what's happening",
  "action": { "tool": "tool_name", "parameters": {...} } OR null if ready to conclude,
  "rootCause": "Clear explanation of what went wrong" (only when concluding),
  "fixGuidelines": ["Step 1", "Step 2", "Step 3"] (only when concluding),
  "confidence": 0.0-1.0 (only when concluding)
}

**TOOLS AVAILABLE:**
- read_file: Read code at specific location
- find_callers: Find where a function is called
- find_definition: Find where a symbol is defined
- get_symbol_info: Get information about a symbol
- **version_lookup**: Query valid AGP/Kotlin/Gradle versions and compatibility

**TOOL USAGE GUIDELINES:**

1. **For Version Errors - ALWAYS use version_lookup first:**
   - Check if version exists: { "tool": "version_lookup", "parameters": { "queryType": "exists", "toolType": "agp", "version": "8.10.0" } }
   - Get latest stable: { "tool": "version_lookup", "parameters": { "queryType": "latest-stable", "toolType": "agp" } }
   - Get suggestions: { "tool": "version_lookup", "parameters": { "queryType": "suggest", "toolType": "agp", "currentVersion": "8.10.0" } }
   - Check compatibility: { "tool": "version_lookup", "parameters": { "queryType": "compatible", "toolType": "agp", "version": "8.7.3", "kotlinVersion": "2.0.0" } }

2. **For Code Errors - Use code inspection tools:**
   - read_file: To see actual code at error location
   - find_callers: To understand how functions are called
   - find_definition: To locate declarations

3. **Chain Tools When Needed:**
   - First get version info → Then read files to see current configuration
   - First find definition → Then find callers to understand usage

**REMEMBER:**
- Real code context beats assumptions
- Multiple iterations are OK - be thorough
- Teaching moment: explain concepts when relevant
- Prevention: suggest how to avoid similar issues
- ALWAYS validate versions with version_lookup before suggesting changes
- NEVER suggest versions without checking they exist and are compatible`;
  }

  /**
   * Get few-shot examples for specific error type
   */
  getFewShotExamples(errorType: string): FewShotExample[] {
    const examples: Record<string, FewShotExample[]> = {
      'lateinit': [
        {
          error: 'kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized at UserActivity.kt:45',
          thought: 'This is a lateinit property access before initialization. I need to check where "user" is declared and where it should be initialized.',
          action: 'read_file at UserActivity.kt:45 to see the access point and property declaration',
          observation: 'Found: "val name = user.name" at line 45. Property "lateinit var user: User" declared at line 12. No initialization in onCreate() or init block.',
          conclusion: {
            rootCause: 'The lateinit property "user" is declared but never initialized before being accessed. Lateinit properties require explicit initialization before first use, but onCreate() does not initialize it.',
            fixGuidelines: [
              'Initialize "user" in onCreate() before accessing: user = User()',
              'Or make it nullable instead: var user: User? = null',
              'Or check initialization before use: if (::user.isInitialized) { ... }',
            ],
            confidence: 0.95,
          },
        },
      ],
      'npe': [
        {
          error: 'NullPointerException at line 67 in MainActivity.kt: textView.text = data',
          thought: 'NullPointerException suggests textView is null. Need to check how it\'s initialized.',
          action: 'read_file at MainActivity.kt:67 to see textView declaration and initialization',
          observation: 'Found: "private var textView: TextView? = null" at line 15. Line 67: "textView?.text = data" - wait, the error says non-null access. Let me check again... Actually "textView.text" not "textView?.text".',
          conclusion: {
            rootCause: 'textView is declared as nullable (TextView?) but accessed with non-null assertion (textView.text instead of textView?.text). It\'s null at line 67 because findViewById() returned null - likely wrong ID or view not inflated yet.',
            fixGuidelines: [
              'Use safe call: textView?.text = data',
              'Or check for null: if (textView != null) { textView.text = data }',
              'Verify the view ID in findViewById() matches the layout XML',
              'Ensure setContentView() is called before accessing views',
            ],
            confidence: 0.9,
          },
        },
      ],
      'unresolved_reference': [
        {
          error: 'Unresolved reference: AppDatabase at DatabaseHelper.kt:23',
          thought: 'Unresolved reference usually means missing import or the class doesn\'t exist. Let me check the imports and see if AppDatabase is defined.',
          action: 'read_file at DatabaseHelper.kt:23 to see imports and usage',
          observation: 'No import for AppDatabase. Found reference to "val db = AppDatabase.getInstance()". Searching workspace... AppDatabase.kt exists but in different package.',
          conclusion: {
            rootCause: 'AppDatabase class exists in the codebase but is not imported. The file DatabaseHelper.kt is missing the import statement for AppDatabase.',
            fixGuidelines: [
              'Add import statement: import com.example.app.database.AppDatabase',
              'Or use auto-import in IDE (Alt+Enter in IntelliJ/Android Studio)',
              'Verify AppDatabase is in the correct package and compiled',
            ],
            confidence: 0.85,
          },
        },
      ],
      'type_mismatch': [
        {
          error: 'Type mismatch: inferred type is String but Int was expected at line 34 in Calculator.kt',
          thought: 'Type mismatch between String and Int. Need to see what\'s being assigned.',
          action: 'read_file at Calculator.kt:34',
          observation: 'Found: "val result: Int = userInput" where userInput is String from EditText.getText().toString()',
          conclusion: {
            rootCause: 'Attempting to assign a String value directly to an Int variable without conversion. Kotlin requires explicit type conversion.',
            fixGuidelines: [
              'Convert String to Int: val result: Int = userInput.toIntOrNull() ?: 0',
              'Handle invalid input: val result = userInput.toIntOrNull() ?: run { showError(); return }',
              'Use try-catch for conversion: try { userInput.toInt() } catch(e: NumberFormatException) { 0 }',
            ],
            confidence: 0.92,
          },
        },
      ],
      // Jetpack Compose-specific examples (added in Chunk 4.1)
      'compose_remember': [
        {
          error: 'Creating a state object during composition without using remember at HomeScreen.kt:45',
          thought: 'This Compose error indicates state is being created without remember. This means the state will be recreated on every recomposition, losing its value.',
          action: 'read_file at HomeScreen.kt:45 to see the state creation',
          observation: 'Found: "var counter = mutableStateOf(0)" at line 45 without remember wrapper.',
          conclusion: {
            rootCause: 'State is created with mutableStateOf() but not wrapped in remember { }. In Compose, state created during composition without remember is recreated on every recomposition, losing its value.',
            fixGuidelines: [
              'Wrap in remember: val counter = remember { mutableStateOf(0) }',
              'Or use the by delegate: var counter by remember { mutableStateOf(0) }',
              'For state that survives config changes: rememberSaveable { mutableStateOf(0) }',
            ],
            confidence: 0.95,
          },
        },
      ],
      'compose_recomposition': [
        {
          error: 'Performance warning: Recomposing 150 times in ItemCard composable at ItemCard.kt:23',
          thought: 'Excessive recomposition indicates a performance issue. The composable is being recomposed too often, likely due to unstable parameters or state reading.',
          action: 'read_file at ItemCard.kt:23 to check composable parameters and state usage',
          observation: 'Found: "@Composable fun ItemCard(onClick: () -> Unit)" - lambda parameter is unstable. Parent passes new lambda instance on each recomposition.',
          conclusion: {
            rootCause: 'The ItemCard composable receives an unstable lambda parameter (onClick: () -> Unit) which causes recomposition on every parent update. Lambda instances are not stable by default in Compose.',
            fixGuidelines: [
              'Wrap callback in remember: remember { { onItemClick(item.id) } }',
              'Move lambda to companion or top-level for stability',
              'Use key() to scope recomposition: key(item.id) { ItemCard(...) }',
              'Consider using Immutable/Stable annotations on data classes',
            ],
            confidence: 0.88,
          },
        },
      ],
      'compose_launched_effect': [
        {
          error: 'LaunchedEffect must have at least one key parameter at DataLoader.kt:34',
          thought: 'LaunchedEffect requires keys to control when the effect re-runs. Missing keys means the effect might not restart when needed.',
          action: 'read_file at DataLoader.kt:34 to see LaunchedEffect usage',
          observation: 'Found: "LaunchedEffect { loadData() }" without any key parameter.',
          conclusion: {
            rootCause: 'LaunchedEffect is called without a key parameter. The key determines when the effect restarts. Without keys, the effect only runs once and never restarts even if dependencies change.',
            fixGuidelines: [
              'Add appropriate key: LaunchedEffect(userId) { loadData(userId) }',
              'Use Unit for one-time effects: LaunchedEffect(Unit) { initializeOnce() }',
              'Multiple keys: LaunchedEffect(key1, key2) { ... }',
              'Never use mutable objects as keys - use their IDs instead',
            ],
            confidence: 0.92,
          },
        },
      ],
      'compose_composition_local': [
        {
          error: 'CompositionLocal LocalTheme not provided at ThemedButton.kt:12',
          thought: 'CompositionLocal requires a provider higher in the composition tree. The composable is trying to access a local value that wasn\'t provided.',
          action: 'read_file at ThemedButton.kt:12 to see how LocalTheme is accessed',
          observation: 'Found: "val theme = LocalTheme.current" but no CompositionLocalProvider wrapping this composable tree.',
          conclusion: {
            rootCause: 'ThemedButton accesses LocalTheme.current but no ancestor composable provides a value via CompositionLocalProvider. CompositionLocals must be provided before they can be consumed.',
            fixGuidelines: [
              'Wrap the composable tree with provider: CompositionLocalProvider(LocalTheme provides myTheme) { ThemedButton() }',
              'Provide at app root level for global access',
              'Or define default value: staticCompositionLocalOf { DefaultTheme }',
              'Check that provider is above consumer in composition tree',
            ],
            confidence: 0.9,
          },
        },
      ],
      'compose_derived_state': [
        {
          error: 'derivedStateOf should be used with remember at SearchScreen.kt:56',
          thought: 'derivedStateOf without remember means the derivation is recalculated on every recomposition instead of only when source state changes.',
          action: 'read_file at SearchScreen.kt:56 to see derivedStateOf usage',
          observation: 'Found: "val filteredItems = derivedStateOf { items.filter { it.matches(query) } }" outside of remember.',
          conclusion: {
            rootCause: 'derivedStateOf is used without remember, causing the derivation to be recreated on every recomposition. This defeats the purpose of derivedStateOf which is to cache derived values.',
            fixGuidelines: [
              'Wrap in remember: val filteredItems = remember { derivedStateOf { items.filter { it.matches(query) } } }',
              'The outer remember caches the derivedStateOf, inner derivedStateOf caches the computation',
              'Only re-derives when source state (items, query) actually changes',
            ],
            confidence: 0.93,
          },
        },
      ],
      // XML Layout-specific examples (added in Chunk 4.2)
      'xml_inflation': [
        {
          error: 'android.view.InflateException: Binary XML file line #42: Error inflating class com.example.CustomView in activity_main.xml',
          thought: 'XML inflation error indicates the view class cannot be instantiated. Could be a missing constructor, wrong class name, or initialization issue in the custom view.',
          action: 'read_file at CustomView.kt to check the view class definition',
          observation: 'Found CustomView class but constructor is private: "private constructor(context: Context) : View(context)". Views must have public constructor with Context and AttributeSet.',
          conclusion: {
            rootCause: 'The CustomView has a private constructor instead of the required public constructor. Android Views inflated from XML must have a public constructor taking Context and AttributeSet parameters.',
            fixGuidelines: [
              'Change constructor to public: constructor(context: Context, attrs: AttributeSet?) : super(context, attrs)',
              'Or add the required constructor if missing: constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr)',
              'Ensure the view class is not abstract',
              'Verify the class is in the correct package and accessible',
            ],
            confidence: 0.92,
          },
        },
      ],
      'xml_missing_id': [
        {
          error: 'java.lang.NullPointerException: findViewById(R.id.text_title) returned null at MainActivity.kt:23',
          thought: 'findViewById returning null means the view ID does not exist in the inflated layout. Need to check if the ID is defined in the XML and if the correct layout is inflated.',
          action: 'read_file at MainActivity.kt:23 to see which layout is set and how findViewById is called',
          observation: 'setContentView(R.layout.activity_main) at line 20. findViewById(R.id.text_title) at line 23. Checked activity_main.xml - no view with id "text_title", found "textTitle" (camelCase) instead.',
          conclusion: {
            rootCause: 'The view ID "text_title" does not exist in activity_main.xml. The layout has "textTitle" (camelCase) but the code looks for "text_title" (snake_case). ID mismatch between XML and code.',
            fixGuidelines: [
              'Change Kotlin code to match XML: findViewById(R.id.textTitle)',
              'Or change XML to match code: android:id="@+id/text_title"',
              'Use View Binding to avoid ID mismatches: ActivityMainBinding.inflate(layoutInflater)',
              'Verify setContentView() is called before findViewById()',
              'Ensure you are looking in the correct layout file',
            ],
            confidence: 0.95,
          },
        },
      ],
      'xml_attribute_error': [
        {
          error: 'Error parsing XML: attribute layout_width not specified in activity_main.xml at line 15',
          thought: 'Missing required attribute. Android views in XML must have layout_width and layout_height specified. This is a common oversight.',
          action: 'read_file at activity_main.xml:15 to see the view definition',
          observation: 'Found TextView at line 15 with android:text but no layout_width or layout_height attributes.',
          conclusion: {
            rootCause: 'TextView is missing the required layout_width and layout_height attributes. All Android views must specify their size constraints when used in layouts.',
            fixGuidelines: [
              'Add required attributes: android:layout_width="wrap_content" android:layout_height="wrap_content"',
              'Common values: wrap_content (size to content), match_parent (fill parent), or specific dp value like "48dp"',
              'Use IDE autocomplete to avoid missing required attributes',
              'Enable XML validation warnings in IDE settings',
            ],
            confidence: 0.98,
          },
        },
      ],
      'xml_resource_not_found': [
        {
          error: 'android.content.res.Resources$NotFoundException: String resource @string/app_name not found in activity_main.xml',
          thought: 'Resource reference error means the string resource is not defined or misspelled. Need to check strings.xml.',
          action: 'Search workspace for strings.xml and check if app_name is defined',
          observation: 'Found strings.xml in res/values/ but "app_name" is not defined. Only "application_name" exists.',
          conclusion: {
            rootCause: 'The string resource @string/app_name is referenced but not defined in strings.xml. The actual resource is named "application_name". Resource name mismatch.',
            fixGuidelines: [
              'Define the missing string in res/values/strings.xml: <string name="app_name">My App</string>',
              'Or change XML reference to existing resource: @string/application_name',
              'Use IDE "Extract String Resource" to avoid typos',
              'Check for typos in resource names (app_name vs application_name)',
            ],
            confidence: 0.93,
          },
        },
      ],
      'xml_duplicate_id': [
        {
          error: 'Error: Duplicate id @+id/button_submit, already defined earlier in this layout in activity_main.xml at line 45',
          thought: 'Duplicate ID in the same layout file. Each view must have a unique ID within a layout. This usually happens when copy-pasting views.',
          action: 'read_file at activity_main.xml:45 and search for other instances of button_submit',
          observation: 'Found button_submit defined at line 28 (inside a LinearLayout) and again at line 45 (inside a RelativeLayout). Both are Button views.',
          conclusion: {
            rootCause: 'The ID "button_submit" is used for two different buttons in the same layout. IDs must be unique within a layout file. This likely occurred from copy-pasting without renaming the ID.',
            fixGuidelines: [
              'Rename one of the buttons: android:id="@+id/button_confirm" or android:id="@+id/button_submit_secondary"',
              'Use descriptive IDs based on location/purpose: button_submit_top, button_submit_bottom',
              'After renaming, update Kotlin code that references the old ID',
              'Use IDE refactoring (Shift+F6) to rename IDs safely',
            ],
            confidence: 0.96,
          },
        },
      ],
      'xml_invalid_attribute_value': [
        {
          error: 'Error: "wrap_contentt" is not a valid value for attribute layout_width in activity_main.xml at line 12',
          thought: 'Typo in attribute value. "wrap_contentt" has an extra "t" at the end. Should be "wrap_content".',
          action: 'read_file at activity_main.xml:12 to confirm the typo',
          observation: 'Found: android:layout_width="wrap_contentt" - confirmed typo.',
          conclusion: {
            rootCause: 'Typo in layout_width value: "wrap_contentt" instead of "wrap_content". Extra "t" at the end causes XML parser to reject the attribute value.',
            fixGuidelines: [
              'Fix typo: android:layout_width="wrap_content"',
              'Valid values are: wrap_content, match_parent, or specific dimensions like "48dp"',
              'Enable XML validation in IDE to catch typos at edit time',
              'Use IDE autocomplete for attributes to avoid typos',
            ],
            confidence: 0.99,
          },
        },
      ],
    };

    return examples[errorType] || [];
  }

  /**
   * Build regeneration prompt with specific feedback (P1: Enhanced to preserve diagnoses)
   */
  buildRegenerationPrompt(params: {
    error: ParsedError;
    previousResponse: any;
    feedback: string;
    specificIssues: string[];
    dimensionScores: any;
    iteration: number;
  }): string {
    const { error, previousResponse, specificIssues } = params;
    
    // Extract core diagnosis to preserve
    const coreDiagnosis = previousResponse.rootCause || 
                         previousResponse.thought || 
                         'analysis incomplete';
    
    // Identify error domain for domain-specific examples
    const errorDomain = this.classifyErrorDomain(error);
    
    return `You're improving a previous analysis. **CRITICAL: Keep the core diagnosis intact.**

**YOUR PREVIOUS DIAGNOSIS (PRESERVE THIS):**
"${coreDiagnosis.substring(0, 200)}..."

**WHAT TO KEEP:**
- ✅ The fundamental cause you identified
- ✅ The error category (${errorDomain})
- ✅ The general solution approach

**WHAT TO ADD (without changing core diagnosis):**
${specificIssues.slice(0, 3).map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

**EXAMPLE OF ENHANCING (not replacing) for ${errorDomain} errors:**

ORIGINAL (correct but vague):
{
  "rootCause": "${this.getVagueExample(errorDomain)}",
  "fixGuidelines": ["${this.getVagueFix(errorDomain)}"]
}

ENHANCED (same diagnosis + detail):
{
  "rootCause": "${this.getDetailedExample(errorDomain)}",
  "fixGuidelines": [
    "${this.getDetailedFix(errorDomain, 1)}",
    "${this.getDetailedFix(errorDomain, 2)}",
    "${this.getDetailedFix(errorDomain, 3)}"
  ]
}

**FORBIDDEN:**
- ❌ Changing from ${errorDomain} error to different category
- ❌ Abandoning your previous reasoning completely
- ❌ Introducing new error types not in original diagnosis

**NOW ENHANCE (don't replace) YOUR DIAGNOSIS - OUTPUT ONLY VALID JSON:**

{
  "thought": "Brief explanation of what you're enhancing",
  "action": null,
  "rootCause": "Enhanced version with file paths and line numbers",
  "fixGuidelines": ["Step 1 with BEFORE/AFTER code", "Step 2 with specifics", "Step 3 with verification"],
  "confidence": 0.6-0.95
}`;
  }

  /**
   * Classify error domain for domain-specific examples (P1)
   */
  private classifyErrorDomain(error: ParsedError): string {
    const msg = error.message.toLowerCase();
    const stack = error.stackTrace?.map(f => f.file).join(' ').toLowerCase() || '';
    const combined = msg + ' ' + stack;
    
    if (combined.includes('permission') || combined.includes('securityexception')) {
      return 'permission';
    }
    if (combined.includes('cache') || combined.includes('corrupted')) {
      return 'cache';
    }
    if (combined.includes('network') || combined.includes('maven') || combined.includes('download')) {
      return 'network';
    }
    if (combined.includes('proguard') || combined.includes('r8') || combined.includes('nosuchmethod')) {
      return 'proguard';
    }
    if (combined.includes('navigation') || combined.includes('argument')) {
      return 'navigation';
    }
    if (combined.includes('null') || combined.includes('npe')) {
      return 'null-pointer';
    }
    
    return 'general';
  }

  /**
   * Get vague example for error domain (P1)
   */
  private getVagueExample(domain: string): string {
    const examples: Record<string, string> = {
      'permission': 'Permission is missing in manifest',
      'cache': 'Build cache is corrupted',
      'network': 'Network connection failed',
      'proguard': 'ProGuard removed the method',
      'navigation': 'Navigation argument is missing',
      'null-pointer': 'Variable is null',
      'general': 'Error in the code'
    };
    return examples[domain] || examples['general'];
  }

  /**
   * Get vague fix for error domain (P1)
   */
  private getVagueFix(domain: string): string {
    const fixes: Record<string, string> = {
      'permission': 'Add the permission to manifest',
      'cache': 'Clean the build cache',
      'network': 'Check your internet connection',
      'proguard': 'Update ProGuard rules',
      'navigation': 'Pass the required argument',
      'null-pointer': 'Initialize the variable',
      'general': 'Fix the error'
    };
    return fixes[domain] || fixes['general'];
  }

  /**
   * Get detailed example for error domain (P1)
   */
  private getDetailedExample(domain: string): string {
    const examples: Record<string, string> = {
      'permission': 'App requires CAMERA permission (android.permission.CAMERA) at MainActivity.kt line 15, but AndroidManifest.xml is missing the declaration at line 8. This causes SecurityException at runtime when camera access is attempted.',
      'cache': 'Gradle build cache at ~/.gradle/caches/ contains corrupted metadata for dependency com.example:library:1.0.0, causing build.gradle.kts at line 42 to fail resolution with "Could not resolve" error.',
      'network': 'Maven repository download fails at build.gradle.kts line 12 due to network timeout connecting to https://repo1.maven.org. Error occurs during dependency resolution for androidx.core:core-ktx:1.12.0.',
      'proguard': 'ProGuard in build.gradle.kts line 28 (minifyEnabled=true) removes method getUserName() from User class at User.kt line 45, causing NoSuchMethodError at runtime in MainActivity.kt line 102.',
      'navigation': 'NavHost in MainActivity.kt line 67 expects required argument "userId" (type: String) defined in navigation.xml line 23, but calling code at HomeFragment.kt line 89 passes no arguments.',
      'null-pointer': 'Variable userProfile at MainActivity.kt line 56 is accessed before initialization (lateinit not initialized), causing NullPointerException when accessed at line 78 in getUserData() method.',
      'general': 'Error occurs at specific location with detailed context about the cause and impact.'
    };
    return examples[domain] || examples['general'];
  }

  /**
   * Get detailed fix for error domain (P1)
   */
  private getDetailedFix(domain: string, step: number): string {
    const fixes: Record<string, string[]> = {
      'permission': [
        '1. Edit AndroidManifest.xml line 8: Add <uses-permission android:name="android.permission.CAMERA" /> before <application> tag | BEFORE: <manifest>\\n  <application...> | AFTER: <manifest>\\n  <uses-permission android:name="android.permission.CAMERA" />\\n  <application...>',
        '2. For Android 6.0+ (API 23+), add runtime permission check in MainActivity.kt onCreate() at line 15: if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) { ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), 100) }',
        '3. Verify: Run "./gradlew build" to confirm build succeeds, then test camera feature - should show permission dialog on first use'
      ],
      'cache': [
        '1. Clean Gradle build cache: Run "./gradlew clean --no-build-cache" to delete corrupted cache at ~/.gradle/caches/',
        '2. Delete specific corrupted dependency cache: rm -rf ~/.gradle/caches/modules-2/files-2.1/com.example/library/1.0.0/',
        '3. Rebuild project: Run "./gradlew build --refresh-dependencies" to re-download fresh dependency metadata and verify build.gradle.kts line 42 resolves correctly'
      ],
      'network': [
        '1. Add alternative Maven repository in build.gradle.kts at line 10 before mavenCentral(): maven { url = uri("https://maven.aliyun.com/repository/central") } // China mirror',
        '2. Increase network timeout in gradle.properties: org.gradle.daemon.idletimeout=60000 and systemProp.http.connectionTimeout=60000',
        '3. Verify connectivity: curl -I https://repo1.maven.org/maven2/ should return 200 OK, then run "./gradlew build --refresh-dependencies"'
      ],
      'proguard': [
        '1. Edit proguard-rules.pro at line 15: Add -keep class com.example.User { public java.lang.String getUserName(); } to preserve method',
        '2. Disable minification for debug builds in build.gradle.kts line 28: buildTypes { debug { isMinifyEnabled = false } release { isMinifyEnabled = true } }',
        '3. Verify: Run "./gradlew assembleRelease" and check build/outputs/mapping/release/usage.txt to confirm getUserName() is not removed, test at MainActivity.kt line 102'
      ],
      'navigation': [
        '1. Add argument to navigation call in HomeFragment.kt at line 89: findNavController().navigate(R.id.action_home_to_profile, bundleOf("userId" to currentUserId))',
        '2. Verify navigation.xml line 23 defines required argument: <argument android:name="userId" app:argType="string" />',
        '3. Test navigation flow: Run app, navigate from HomeFragment to ProfileFragment - should pass userId correctly, verify in ProfileFragment onCreate() with arguments?.getString("userId")'
      ],
      'null-pointer': [
        '1. Initialize lateinit variable in MainActivity.kt line 56: lateinit var userProfile: UserProfile, then initialize in onCreate() at line 60: userProfile = UserProfile(userId)',
        '2. Alternative: Use nullable type with safe call: var userProfile: UserProfile? = null, then access with userProfile?.getUserData() at line 78',
        '3. Add null check before access at line 78: if (::userProfile.isInitialized) { userProfile.getUserData() } else { Log.e("MainActivity", "userProfile not initialized") }'
      ],
      'general': [
        '1. Identify exact file and line number where error occurs, add specific code change with BEFORE/AFTER example',
        '2. Provide concrete implementation with actual syntax, not just description of what to do',
        '3. Include verification steps: commands to run and expected output to confirm fix works'
      ]
    };
    const domainFixes = fixes[domain] || fixes['general'];
    return domainFixes[step - 1] || domainFixes[0];
  }

  /**
   * Build tool usage prompt
   */
  buildToolPrompt(availableTools: string[]): string {
    return `\n\n**AVAILABLE TOOLS:**
${availableTools.map(tool => `- ${tool}`).join('\n')}

To use a tool, include in your JSON:
"action": { "tool": "tool_name", "parameters": { "param1": "value1" } }

To conclude without using a tool:
"action": null`;
  }

  /**
   * Format few-shot examples
   */
  private formatExamples(examples: FewShotExample[]): string {
    return examples.map((example, i) => {
      return `
Example ${i + 1}:
Error: ${example.error}
Thought: "${example.thought}"
Action: ${example.action}
Observation: ${example.observation}
Conclusion:
  Root Cause: ${example.conclusion.rootCause}
  Fix Guidelines:
${example.conclusion.fixGuidelines.map(step => `    - ${step}`).join('\n')}
  Confidence: ${example.conclusion.confidence}`;
    }).join('\n---\n');
  }

  /**
   * Build iteration prompt with comprehensive context (NEW - for Chunk 2.4)
   * NOW ENHANCED: Includes relevant few-shot examples from knowledge base
   */
  async buildIterationPrompt(params: {
    systemPrompt: string;
    examples: FewShotExample[];
    error: ParsedError;
    previousThoughts: string[];
    previousActions: any[];
    previousObservations: string[];
    iteration: number;
    maxIterations: number;
  }): Promise<string> {
    const { systemPrompt, examples, error, previousThoughts, previousActions, previousObservations, iteration, maxIterations } = params;

    let prompt = `${systemPrompt}\n\n`;

    // Add legacy examples (from old system) only on first iteration
    if (iteration === 1 && examples.length > 0) {
      prompt += `**EXAMPLES OF SIMILAR ANALYSIS:**\n${this.formatExamples(examples)}\n\n`;
    }

    // Add few-shot examples from knowledge base (on first iteration only)
    if (iteration === 1) {
      try {
        // Ensure few-shot examples are loaded before use (fixes race condition)
        await this.ensureFewShotLoaded();
        
        // Use only 1 most relevant example to avoid noise
        const relevantExamples = await this.fewShotService.findRelevantExamples(error, 1);
        if (relevantExamples.length > 0) {
          const formattedExamples = this.fewShotService.formatExamplesForPrompt(relevantExamples);
          prompt += `${formattedExamples}\n\n`;
          console.log(`📚 Added ${relevantExamples.length} best matching example to prompt`);
        }
      } catch (error) {
        console.warn('Failed to retrieve few-shot examples:', error);
      }
    }

    prompt += `**ERROR TO ANALYZE:**
Type: ${error.type}
Message: ${error.message}
Location: ${error.filePath}:${error.line}
Language: ${error.language}
${error.metadata ? `Metadata: ${JSON.stringify(error.metadata, null, 2)}` : ''}

**PROGRESS:** Iteration ${iteration}/${maxIterations}\n`;

    // Add history if exists
    if (previousThoughts.length > 0) {
      prompt += `\n**ANALYSIS HISTORY:**\n`;
      previousThoughts.forEach((thought, i) => {
        prompt += `\nIteration ${i + 1}:\n`;
        prompt += `  Thought: ${thought}\n`;
        if (previousActions[i]) {
          prompt += `  Action: ${JSON.stringify(previousActions[i])}\n`;
        }
        if (previousObservations[i]) {
          prompt += `  Observation: ${previousObservations[i]}\n`;
        }
      });
    }

    prompt += `\n**YOUR TASK:**\n`;
    if (iteration === 1) {
      prompt += `This is your first analysis. Form an initial hypothesis about what caused this error.
Consider using the read_file tool to examine the code at the error location.\n`;
    } else {
      prompt += `Continue your analysis based on what you've learned.
- If you have sufficient information, provide your final conclusion (set action to null)
- If you need more information, specify the next tool to use\n`;
    }

    prompt += `\nRespond ONLY with valid JSON (no other text):\n`;
    prompt += `{
  "thought": "Your current reasoning",
  "action": { "tool": "tool_name", "parameters": {...} } OR null if concluding,
  "rootCause": "Explanation with file:line references" (only when action is null),
  "fixGuidelines": [
    "1. First step with exact file path and line number",
    "2. Code example (MANDATORY - MUST INCLUDE):\\nBefore:\\n\`\`\`kotlin\\nold code here\\n\`\`\`\\nAfter:\\n\`\`\`kotlin\\nfixed code here\\n\`\`\`",
    "3. Verification step explaining how to test the fix"
  ] (only when action is null - NOTE: fixGuidelines is an array of STRINGS, not objects!),
  "confidence": 0.0-1.0 (only when action is null)
}

⚠️ CRITICAL RULES:
1. fixGuidelines MUST be an array of STRINGS (not objects!)
2. At least ONE string MUST contain a code example with Before/After blocks
3. Use \\n for newlines within strings, not actual line breaks`;

    return prompt;
  }

  /**
   * Build a progressive, one-shot analysis prompt.
   *
   * Phase 3 (optional): start with lightweight prompting, then add
   * RAG examples / full system prompt only if needed.
   *
   * IMPORTANT: This prompt is designed to produce a final conclusion in one response
   * (action MUST be null) and should be validated by OutputValidator.
   */
  async buildProgressiveAnalysisPrompt(params: {
    error: ParsedError;
    level: 1 | 2 | 3;
    systemPrompt?: string;
  }): Promise<string> {
    const { error, level, systemPrompt } = params;

    // Keep Level 1 intentionally lightweight: no giant system prompt, no history.
    // Levels 2-3 add few-shot/RAG examples to improve specificity.
    const includeSystemPrompt = level >= 3 && systemPrompt;
    const includeExamples = level >= 2;
    const exampleCount = level >= 3 ? 10 : 3;

    let prompt = '';

    if (includeSystemPrompt) {
      prompt += `${systemPrompt}\n\n`;
    } else {
      prompt += `You are an expert Kotlin/Android debugging assistant. Output ONLY valid JSON.\n\n`;
      prompt += `CRITICAL RULES:\n`;
      prompt += `1) Never output empty JSON {}\n`;
      prompt += `2) Always include: thought (100+ chars), rootCause (100+ chars), fixGuidelines (array of strings)\n`;
      prompt += `3) Include exact file path + line number when possible (e.g., \'MainActivity.kt:42\')\n`;
      prompt += `4) At least ONE fixGuideline must include a Before/After code example\n\n`;
    }

    if (includeExamples) {
      try {
        // Ensure database is loaded (idempotent)
        await this.ensureFewShotLoaded();
        
        const relevantExamples = await this.fewShotService.findRelevantExamples(error, exampleCount);
        if (relevantExamples.length > 0) {
          prompt += this.fewShotService.formatExamplesForPrompt(relevantExamples);
          prompt += `\n\n`;
        }
      } catch (e) {
        // Best-effort: progressive prompting should never fail the whole analysis path.
      }
    }

    prompt += `Analyze this error and provide a final conclusion.\n\n`;
    prompt += `ERROR:\n${error.message}\n`;
    prompt += `TYPE: ${error.type}\n`;
    prompt += `FILE: ${error.filePath}:${error.line}\n`;
    prompt += `LANGUAGE: ${error.language}\n`;
    if (error.metadata) {
      prompt += `METADATA: ${JSON.stringify(error.metadata)}\n`;
    }

    prompt += `\nOUTPUT JSON ONLY (action MUST be null):\n`;
    prompt += `{
  "thought": "Detailed reasoning (100+ chars)",
  "action": null,
  "rootCause": "Specific cause with file:line references (100+ chars)",
  "fixGuidelines": [
    "1. Step with exact file path and line number",
    "2. Step with BEFORE/AFTER code example:\\nBefore:\\n\`\`\`kotlin\\n...\\n\`\`\`\\nAfter:\\n\`\`\`kotlin\\n...\\n\`\`\`",
    "3. Verification step (how to test the fix)"
  ],
  "confidence": 0.7
}`;

    return prompt;
  }

  /**
   * Build final prompt with all state (NEW - for Chunk 2.4)
   */
  buildFinalPrompt(state: AgentState): string {
    const { error, thoughts, actions, observations } = state;

    let prompt = `**FINAL ANALYSIS REQUIRED**

You have reached the maximum number of iterations. Provide your final conclusion now.

**ERROR:**
Type: ${error.type}
Message: ${error.message}
Location: ${error.filePath}:${error.line}

**COMPLETE ANALYSIS HISTORY:**\n`;

    thoughts.forEach((thought, i) => {
      prompt += `\nIteration ${i + 1}:\n`;
      prompt += `  Thought: ${thought}\n`;
      if (actions[i]) {
        prompt += `  Action: ${JSON.stringify(actions[i])}\n`;
      }
      if (observations[i]) {
        prompt += `  Observation: ${observations[i]}\n`;
      }
    });

    prompt += `\n**YOUR TASK:**
Synthesize all information gathered and provide your final analysis.

Respond ONLY with valid JSON (no other text):
{
  "thought": "Your final reasoning",
  "action": null,
  "rootCause": "Clear explanation of what went wrong and why with file:line references",
  "fixGuidelines": [
    "1. First step with exact file path and line number",
    "2. Code example (MANDATORY):\\nBefore:\\n\`\`\`kotlin\\nold code here\\n\`\`\`\\nAfter:\\n\`\`\`kotlin\\nfixed code here\\n\`\`\`",
    "3. Verification step explaining how to test the fix"
  ],
  "confidence": 0.0-1.0
}

⚠️ CRITICAL: fixGuidelines is an array of STRINGS (not objects!) and MUST include code examples!`;

    return prompt;
  }

  /**
   * Parse LLM response into structured format (ENHANCED - Phase 1.1 Fix)
   */
  parseResponse(response: string): {
    thought: string;
    action: any | null;
    rootCause?: string;
    fixGuidelines?: string[];
    confidence?: number;
  } {
    try {
      const json = this.extractJSON(response);
      const validation = this.validateResponse(json);

      if (!validation.valid) {
        console.warn(`Response validation failed: ${validation.error}`);
        
        // Try to salvage what we can from the JSON
        if (json.thought && typeof json.thought === 'string') {
          // Has thought, so partially valid
          if (json.action === null || json.action === undefined) {
            // Concluding but missing required fields
            return {
              thought: json.thought,
              action: null,
              rootCause: json.rootCause || 'Analysis incomplete - see thought field for details',
              fixGuidelines: Array.isArray(json.fixGuidelines) && json.fixGuidelines.length > 0 
                ? json.fixGuidelines 
                : ['Review the thought process above', 'Examine error context and code'],
              confidence: typeof json.confidence === 'number' ? json.confidence : 0.3,
            };
          } else {
            // Has action, return as tool call
            return {
              thought: json.thought,
              action: json.action,
            };
          }
        }
        
        // Cannot salvage - return minimal response
        return {
          thought: JSON.stringify(json).substring(0, 200) || response.substring(0, 200),
          action: null,
          rootCause: 'Analysis incomplete - validation failed',
          fixGuidelines: ['Review error and context', 'Check system logs for more details'],
          confidence: 0.2,
        };
      }

      return {
        thought: json.thought,
        action: json.action,
        rootCause: json.rootCause,
        fixGuidelines: json.fixGuidelines,
        confidence: json.confidence,
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      // Fallback - extract as much meaning as possible
      const textExtract = response.substring(0, 500);
      return {
        thought: textExtract,
        action: null,
        rootCause: 'Analysis incomplete - JSON parsing failed',
        fixGuidelines: [
          'Manual review required - LLM response was not valid JSON',
          'Check the thought field above for any insights',
          'Review error message and code context manually'
        ],
        confidence: 0.15,
      };
    }
  }

}
