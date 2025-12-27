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

/**
 * Few-shot example for teaching agent
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
export class PromptEngine {
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

1. **File Paths - MUST be exact with line numbers:**
   ❌ BAD: "Update build.gradle"
   ❌ BAD: "Fix the version in the configuration file"
   ✅ GOOD: "Update gradle/libs.versions.toml at line 5"
   ✅ GOOD: "Modify app/build.gradle.kts at line 42"
   
2. **Version Numbers - MUST be specific and validated:**
   ❌ BAD: "Update to latest AGP"
   ❌ BAD: "Use a newer version"
   ✅ GOOD: "Update to AGP 8.7.3 (stable, released Nov 2024)"
   ✅ GOOD: "Upgrade Kotlin to 2.0.0 (compatible with AGP 8.7.3+)"
   → ALWAYS use VersionLookupTool to validate versions before suggesting!
   
3. **Code Examples - MUST show before/after:**
   ❌ BAD: "Change the version"
   ❌ BAD: "Initialize the variable"
   ✅ GOOD: Show before/after code snippets with line numbers and actual changes
   
4. **Variable/Function Names - MUST reference actual code:**
   ❌ BAD: "The variable is not initialized"
   ❌ BAD: "Fix the null pointer"
   ✅ GOOD: "Variable 'viewModel' (declared at line 15) is not initialized before use at line 45"
   ✅ GOOD: "Function 'loadData()' (called at UserActivity.kt:67) receives null from 'getUserId()'"
   
5. **Verification Steps - MUST explain how to test fix:**
   ❌ BAD: "This should fix it"
   ❌ BAD: "The error will be resolved"
   ✅ GOOD: "After applying fix, run './gradlew clean build' to verify compilation succeeds"
   ✅ GOOD: "Test fix by running the app and navigating to ProfileScreen to ensure no crash"
   
6. **Dependencies/Compatibility - MUST validate relationships:**
   ❌ BAD: "Ensure dependencies are compatible"
   ❌ BAD: "Update related libraries"
   ✅ GOOD: "AGP 8.7.3 requires Gradle 8.9+ (current: 8.2) - update gradle/wrapper/gradle-wrapper.properties"
   ✅ GOOD: "Kotlin 2.0.0 requires kotlin-compose-compiler 2.0.0 (currently using 1.9.0) - update in build.gradle.kts"

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
   * Extract JSON from LLM response (handles extra text)
   */
  extractJSON(response: string): any {
    // Try to find JSON object in response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Invalid JSON in response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build iteration prompt with comprehensive context (NEW - for Chunk 2.4)
   */
  buildIterationPrompt(params: {
    systemPrompt: string;
    examples: FewShotExample[];
    error: ParsedError;
    previousThoughts: string[];
    previousActions: any[];
    previousObservations: string[];
    iteration: number;
    maxIterations: number;
  }): string {
    const { systemPrompt, examples, error, previousThoughts, previousActions, previousObservations, iteration, maxIterations } = params;

    let prompt = `${systemPrompt}\n\n`;

    // Add examples only on first iteration
    if (iteration === 1 && examples.length > 0) {
      prompt += `**EXAMPLES OF SIMILAR ANALYSIS:**\n${this.formatExamples(examples)}\n\n`;
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
  "rootCause": "Explanation" (only when action is null),
  "fixGuidelines": ["Step 1", "Step 2", ...] (only when action is null),
  "confidence": 0.0-1.0 (only when action is null)
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
  "rootCause": "Clear explanation of what went wrong and why",
  "fixGuidelines": ["Step 1", "Step 2", "Step 3"],
  "confidence": 0.0-1.0
}`;

    return prompt;
  }

  /**
   * Parse LLM response into structured format (NEW - for Chunk 2.4)
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
        // Return minimal valid response
        return {
          thought: json.thought || response,
          action: null,
          rootCause: 'Analysis incomplete - validation failed',
          fixGuidelines: ['Review error and context'],
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
      // Fallback
      return {
        thought: response,
        action: null,
        rootCause: 'Analysis incomplete - parsing failed',
        fixGuidelines: ['Review error message and code context'],
        confidence: 0.2,
      };
    }
  }

  /**
   * Validate agent response structure
   */
  validateResponse(response: any): { valid: boolean; error?: string } {
    if (!response || typeof response !== 'object') {
      return { valid: false, error: 'Response must be an object' };
    }

    if (!response.thought || typeof response.thought !== 'string') {
      return { valid: false, error: 'Missing or invalid "thought" field' };
    }

    // If action is present, validate it
    if (response.action !== null && response.action !== undefined) {
      if (typeof response.action !== 'object') {
        return { valid: false, error: 'Action must be an object or null' };
      }
      if (!response.action.tool || typeof response.action.tool !== 'string') {
        return { valid: false, error: 'Action must have a "tool" field' };
      }
    }

    // If concluding (action is null), validate conclusion fields
    if (response.action === null) {
      if (!response.rootCause || typeof response.rootCause !== 'string') {
        return { valid: false, error: 'Missing or invalid "rootCause" when concluding' };
      }
      if (!Array.isArray(response.fixGuidelines) || response.fixGuidelines.length === 0) {
        return { valid: false, error: 'Missing or invalid "fixGuidelines" when concluding' };
      }
      if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
        return { valid: false, error: 'Invalid "confidence" value (must be 0.0-1.0)' };
      }
    }

    return { valid: true };
  }
}
