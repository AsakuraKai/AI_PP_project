// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { RCAWebview } from './ui/RCAWebview';
import { RCAPanelProvider } from './panel/RCAPanelProvider';
import { StateManager } from './panel/StateManager';

// Import Kai's backend components (will be wired from ../src)
// These will be implemented by Kai - we just call them
interface ParsedError {
  type: string;
  message: string;
  filePath: string;
  line: number;
  language: 'kotlin' | 'java' | 'xml';
}

interface RCAResult {
  error: string;
  errorType: string;
  filePath: string;
  line: number;
  rootCause: string;
  fixGuidelines: string[];
  confidence: number;
  codeSnippet?: string;
  toolsUsed?: string[]; // CHUNK 2.2: Track tools used during analysis
  iterations?: number;  // CHUNK 2.2: Track agent iterations
  language?: 'kotlin' | 'java' | 'xml'; // CHUNK 4.2: Track language for XML-specific display
  
  // CHUNK 2.3: Accuracy metrics
  qualityScore?: number;  // Quality score from QualityScorer (0.0-1.0)
  latency?: number;       // Analysis latency in milliseconds
  modelName?: string;     // LLM model used (e.g., 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest')
  
  // CHUNK 3.3: Cache metadata
  fromCache?: boolean;    // Whether result came from cache
  cacheTimestamp?: string; // When result was cached
  
  // CHUNK 3.4: Feedback tracking
  rcaId?: string;         // Unique ID for this RCA (for feedback)
  errorHash?: string;     // Hash of the error (for cache lookup)
  
  // CHUNK 4.3: Gradle metadata
  metadata?: {
    module?: string;
    conflictingVersions?: string[];
    recommendedVersion?: string;
    affectedDependencies?: string[];
    requiredPermission?: string; // CHUNK 4.4: Manifest permissions
  };
  recommendedFix?: string; // CHUNK 4.3: Gradle fix command
  
  // CHUNK 4.4: Android documentation results
  docResults?: Array<{
    title: string;
    summary: string;
    url?: string;
  }>;
  
  // CHUNK 5.2: Educational mode content
  learningNotes?: string[];
}

// Global state
let outputChannel: vscode.OutputChannel;
let debugChannel: vscode.OutputChannel;
let currentWebview: RCAWebview | undefined;
let educationalMode: boolean = false;
let extensionContext: vscode.ExtensionContext;
let rcaPanelProvider: RCAPanelProvider | undefined;
let stateManager: StateManager | undefined;

/**
 * CHUNK 1.1: Extension Bootstrap
 * Entry point - Called when extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {
  extensionContext = context;
  
  // Initialize output channels
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');
  context.subscriptions.push(outputChannel, debugChannel);
  
  log('info', 'RCA Agent extension activated');
  
  // CHUNK 1: Initialize new panel-based UI
  const useNewUI = vscode.workspace.getConfiguration('rcaAgent').get<boolean>('experimental.newUI', true);
  
  if (useNewUI) {
    log('info', 'Initializing new panel-based UI (Chunk 1)');
    
    // Initialize state manager
    stateManager = StateManager.getInstance(context);
    
    // Register panel provider
    rcaPanelProvider = new RCAPanelProvider(context.extensionUri, context);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        RCAPanelProvider.viewType,
        rcaPanelProvider,
        {
          webviewOptions: { retainContextWhenHidden: true }
        }
      )
    );
    
    // Register panel toggle command
    context.subscriptions.push(
      vscode.commands.registerCommand('rcaAgent.togglePanel', () => {
        vscode.commands.executeCommand('workbench.view.extension.rca-agent');
      })
    );
    
    log('info', 'Panel-based UI initialized successfully');
  } else {
    log('info', 'Using legacy command-based UI');
  }
  
  // Register analyze command with comprehensive error handling
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      try {
        await analyzeErrorCommand();
      } catch (error) {
        const err = error as Error;
        log('error', 'Command execution failed', err);
        vscode.window.showErrorMessage(`RCA Agent error: ${err.message}`);
      }
    }
  );
  
  // CHUNK 5.1: Register webview command
  const analyzeWebviewCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeErrorWebview',
    async () => {
      try {
        await analyzeErrorWithWebview();
      } catch (error) {
        const err = error as Error;
        log('error', 'Webview command execution failed', err);
        vscode.window.showErrorMessage(`RCA Agent error: ${err.message}`);
      }
    }
  );
  
  // CHUNK 5.2: Register educational mode toggle command
  const toggleEducationalCommand = vscode.commands.registerCommand(
    'rcaAgent.toggleEducationalMode',
    () => {
      educationalMode = !educationalMode;
      const status = educationalMode ? 'enabled' : 'disabled';
      vscode.window.showInformationMessage(`Educational Mode ${status} 🎓`);
      log('info', `Educational mode ${status}`);
      
      // Update webview if active
      if (currentWebview) {
        currentWebview.setEducationalMode(educationalMode);
      }
    }
  );
  
  // CHUNK 5.3: Register performance metrics toggle command
  const togglePerformanceMetricsCommand = vscode.commands.registerCommand(
    'rcaAgent.togglePerformanceMetrics',
    () => {
      const config = vscode.workspace.getConfiguration('rcaAgent');
      const currentValue = config.get<boolean>('showPerformanceMetrics', false);
      const newValue = !currentValue;
      
      config.update('showPerformanceMetrics', newValue, vscode.ConfigurationTarget.Global);
      
      const status = newValue ? 'enabled' : 'disabled';
      vscode.window.showInformationMessage(`Performance Metrics ${status} ⚡`);
      log('info', `Performance metrics ${status}`);
      
      // Update webview if active
      if (currentWebview) {
        currentWebview.setPerformanceMetrics(newValue);
      }
    }
  );
  
  context.subscriptions.push(analyzeCommand, analyzeWebviewCommand, toggleEducationalCommand, togglePerformanceMetricsCommand);
  
  log('info', 'Commands registered: rcaAgent.analyzeError, rcaAgent.analyzeErrorWebview, rcaAgent.toggleEducationalMode, rcaAgent.togglePerformanceMetrics');
  vscode.window.showInformationMessage('RCA Agent activated! Press Ctrl+Shift+R to analyze errors.');
}

/**
 * Main command handler - orchestrates all chunks
 */
async function analyzeErrorCommand(): Promise<void> {
  // CHUNK 1.2: Get error text from user
  const errorText = await getErrorText();
  if (!errorText) {
    vscode.window.showWarningMessage('No error text provided');
    return;
  }
  
  // Validate and sanitize input
  const sanitized = sanitizeErrorText(errorText);
  log('info', 'Received error text', { length: sanitized.length });
  
  // Parse error using Kai's parser (placeholder for now)
  const parsedError = parseError(sanitized);
  
  if (!parsedError) {
    vscode.window.showErrorMessage(
      'Could not parse error. Is this a Kotlin/Android error?',
      'View Debug Logs'
    ).then((selection: string | undefined) => {
      if (selection === 'View Debug Logs') {
        debugChannel.show();
      }
    });
    return;
  }
  
  log('info', 'Error parsed successfully', parsedError);
  
  // CHUNK 4.1: Display Compose-specific tips if applicable
  if (isComposeError(parsedError.type)) {
    await showComposeTips(parsedError);
  }
  
  // CHUNK 4.2: Display XML-specific tips if applicable
  if (isXMLError(parsedError.type)) {
    await showXMLTips(parsedError);
  }
  
  // CHUNK 4.3: Display Gradle-specific tips if applicable
  if (isGradleError(parsedError.type)) {
    await showGradleTips(parsedError);
  }
  
  // CHUNK 4.4: Display Manifest-specific tips if applicable
  if (isManifestError(parsedError.type)) {
    await showManifestTips(parsedError);
  }
  
  // CHUNK 3.3: Check cache before analysis
  const cachedResult = await checkCache(parsedError);
  
  if (cachedResult) {
    // Cache hit - show result immediately
    log('info', 'Cache hit - showing cached result');
    showResult(cachedResult);
    
    // CHUNK 3.4: Show feedback buttons for cached result
    await showFeedbackPrompt(cachedResult);
    return;
  }
  
  // Cache miss - proceed with full analysis
  log('info', 'Cache miss - running full analysis');
  
  // CHUNK 1.3: Analyze with agent and display results
  await analyzeWithProgress(parsedError);
}

/**
 * CHUNK 1.2: Get error text from user
 * Tries selected text first, falls back to input box
 */
async function getErrorText(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  
  // Try to get selected text
  if (editor && !editor.selection.isEmpty) {
    const selection = editor.document.getText(editor.selection);
    log('info', 'Got error text from selection', { length: selection.length });
    return selection;
  }
  
  // Fallback to input box with validation
  log('info', 'No selection, showing input box');
  return await vscode.window.showInputBox({
    prompt: 'Paste your error message or stack trace',
    placeHolder: 'e.g., kotlin.UninitializedPropertyAccessException: lateinit property...',
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Error text cannot be empty';
      }
      if (value.length > 50000) {
        return 'Error text too large (max 50KB)';
      }
      return null; // Valid
    }
  });
}

/**
 * Input sanitization - Remove dangerous characters
 */
function sanitizeErrorText(input: string): string {
  if (input.length > 50000) {
    throw new Error('Error text too large (max 50KB)');
  }
  
  // Remove control characters
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Parse error - PLACEHOLDER for Kai's KotlinNPEParser
 * TODO: Wire to ../src/utils/KotlinNPEParser.ts when available
 */
function parseError(errorText: string): ParsedError | null {
  log('info', 'Parsing error (using placeholder parser)');
  
  // Simple pattern matching for common Kotlin errors
  // This is a PLACEHOLDER - Kai will implement the real parser
  
  // Try to extract file path and line number
  const fileLineMatch = errorText.match(/at\s+(.+\.kt):(\d+)/i) || 
                        errorText.match(/\((.+\.kt):(\d+)\)/);
  
  // Try to detect error type
  let errorType = 'unknown';
  let language: 'kotlin' | 'java' | 'xml' = 'kotlin';
  
  if (errorText.includes('NullPointerException')) {
    errorType = 'npe';
  } else if (errorText.includes('UninitializedPropertyAccessException') || 
             errorText.includes('lateinit')) {
    errorType = 'lateinit';
  } else if (errorText.includes('UNRESOLVED_REFERENCE')) {
    errorType = 'unresolved_reference';
  } else if (errorText.includes('Compose') || errorText.includes('@Composable')) {
    // CHUNK 4.1: Detect Compose errors
    if (errorText.includes('remember')) {
      errorType = 'compose_remember';
    } else if (errorText.includes('recomposition')) {
      errorType = 'compose_recomposition';
    } else if (errorText.includes('LaunchedEffect')) {
      errorType = 'compose_launched_effect';
    }
  } else if (errorText.includes('InflateException') || errorText.includes('Binary XML') || 
             errorText.includes('layout') || errorText.includes('findViewById')) {
    // CHUNK 4.2: Detect XML errors
    language = 'xml';
    if (errorText.includes('InflateException')) {
      errorType = 'xml_inflation';
    } else if (errorText.includes('findViewById')) {
      errorType = 'xml_missing_id';
    } else if (errorText.includes('attribute')) {
      errorType = 'xml_attribute_error';
    }
  } else if (errorText.includes('Gradle') || errorText.includes('dependency') || 
             errorText.includes('build.gradle')) {
    // CHUNK 4.3: Detect Gradle errors
    if (errorText.includes('dependency') || errorText.includes('conflict')) {
      errorType = 'gradle_dependency';
    } else if (errorText.includes('version')) {
      errorType = 'gradle_version';
    } else {
      errorType = 'gradle_build';
    }
  } else if (errorText.includes('Manifest') || errorText.includes('permission') || 
             errorText.includes('Activity') || errorText.includes('Service')) {
    // CHUNK 4.4: Detect Manifest errors
    if (errorText.includes('permission')) {
      errorType = 'manifest_permission';
    } else if (errorText.includes('Activity')) {
      errorType = 'manifest_activity';
    } else if (errorText.includes('Service')) {
      errorType = 'manifest_service';
    }
  }
  
  if (fileLineMatch || errorType !== 'unknown') {
    return {
      type: errorType,
      message: errorText.split('\n')[0].trim(),
      filePath: fileLineMatch ? fileLineMatch[1] : 'unknown',
      line: fileLineMatch ? parseInt(fileLineMatch[2]) : 0,
      language
    };
  }
  
  log('warn', 'Could not parse error text');
  return null;
}

/**
 * CHUNK 1.3: Analyze with progress indicator
 * CHUNK 1.4: Enhanced with file reading status updates
 * CHUNK 2.2: Enhanced with tool execution feedback
 * CHUNK 3.1: Enhanced with database storage notifications
 * CHUNK 3.2: Enhanced with similar solutions search
 * Calls Kai's agent and displays results
 */
async function analyzeWithProgress(parsedError: ParsedError): Promise<void> {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'RCA Agent',
    cancellable: false,
  }, async (progress: vscode.Progress<{ message?: string; increment?: number }>) => {
    try {
      // CHUNK 3.2: Search for similar past solutions BEFORE analysis
      progress.report({ message: '🔍 Searching past solutions...', increment: 5 });
      await searchAndDisplaySimilarSolutions(parsedError);
      
      // CHUNK 2.2: Tool execution feedback - File reading
      progress.report({ message: '📖 Reading source file...', increment: 15 });
      log('info', 'Tool execution: ReadFileTool', { filePath: parsedError.filePath, line: parsedError.line });
      
      // Simulate file reading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // CHUNK 2.2: Tool execution feedback - LLM initialization
      progress.report({ message: '🤖 Initializing LLM...', increment: 25 });
      
      // Check if we can connect to Ollama (placeholder)
      const config = vscode.workspace.getConfiguration('rcaAgent');
      const ollamaUrl = config.get<string>('ollamaUrl') || 'http://localhost:11434';
      const model = config.get<string>('model') || 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest';
      
      log('info', 'Configuration', { ollamaUrl, model });
      
      // CHUNK 2.2: Tool execution feedback - Finding context
      progress.report({ message: '🔍 Finding code context...', increment: 35 });
      log('info', 'Tool execution: LSPTool (simulated)', { operation: 'find_callers' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // CHUNK 2.2: Tool execution feedback - Analyzing pattern
      progress.report({ message: '🧠 Analyzing error pattern...', increment: 60 });
      
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock result (will be replaced with Kai's agent)
      const result = generateMockResult(parsedError);
      
      progress.report({ message: '✅ Analysis complete!', increment: 85 });
      
      // Display result in output channel
      showResult(result);
      
      // CHUNK 3.1: Store result in database (after analysis)
      progress.report({ message: '💾 Storing result...', increment: 90 });
      await storeResultInDatabase(result, parsedError);
      
      // CHUNK 3.3: Store in cache for future use
      progress.report({ message: '💾 Caching result...', increment: 95 });
      await storeInCache(result, parsedError);
      
      progress.report({ message: '🎉 Done!', increment: 100 });
      
      // CHUNK 1.5: Improved success message
      vscode.window.showInformationMessage(
        '✅ Analysis complete! Check the RCA Agent output.',
        'View Output'
      ).then((selection: string | undefined) => {
        if (selection === 'View Output') {
          outputChannel.show();
        }
      });
      
      // CHUNK 3.4: Show feedback prompt after analysis
      await showFeedbackPrompt(result);
      
    } catch (error) {
      handleAnalysisError(error as Error);
    }
  });
}

/**
 * Mock result generator - PLACEHOLDER for Kai's MinimalReactAgent
 * TODO: Replace with actual agent.analyze() call
 */
function generateMockResult(parsedError: ParsedError): RCAResult {
  log('info', 'Generating mock result (placeholder for agent)');
  
  const mockResults: Record<string, Partial<RCAResult>> = {
    'npe': {
      rootCause: 'A variable was accessed before being initialized, resulting in a null value.',
      fixGuidelines: [
        'Add null safety check: if (variable != null) { ... }',
        'Use safe call operator: variable?.method()',
        'Initialize variable with default value',
        'Use lateinit carefully and check isInitialized'
      ]
    },
    'lateinit': {
      rootCause: 'A lateinit property was accessed before being initialized.',
      fixGuidelines: [
        'Initialize property in onCreate() or init block',
        'Check ::property.isInitialized before access',
        'Consider using nullable type instead of lateinit',
        'Ensure initialization happens before first access'
      ]
    },
    'unresolved_reference': {
      rootCause: 'The compiler cannot find the referenced symbol. This could be due to missing import, typo, or incorrect scope.',
      fixGuidelines: [
        'Check for typos in the identifier name',
        'Add missing import statement',
        'Verify the symbol is in scope',
        'Sync Gradle project if using external library'
      ]
    },
    // CHUNK 4.1: Compose error examples
    'compose_remember': {
      rootCause: 'State was created during composition without using remember, causing state to be lost on recomposition.',
      fixGuidelines: [
        'Wrap state in remember: val state = remember { mutableStateOf(value) }',
        'Use rememberSaveable for persisting across configuration changes',
        'Ensure remember has correct keys for conditional recreation',
        'Move state initialization outside composable if it should persist'
      ]
    },
    'compose_recomposition': {
      rootCause: 'Composable is recomposing excessively due to unstable parameters or state reads.',
      fixGuidelines: [
        'Mark data classes with @Stable or @Immutable annotation',
        'Use derivedStateOf for computed values',
        'Move expensive computations into remember blocks',
        'Check for lambda recreations - use remember { lambda }'
      ]
    },
    'compose_launched_effect': {
      rootCause: 'LaunchedEffect is not executing as expected due to incorrect keys or scope issues.',
      fixGuidelines: [
        'Verify LaunchedEffect keys - effect restarts when keys change',
        'Use Unit key for one-time effects',
        'Check coroutine scope cancellation',
        'Move side effects inside LaunchedEffect, not at composable top level'
      ]
    },
    // CHUNK 4.2: XML error examples
    'xml_inflation': {
      rootCause: 'Layout XML file could not be inflated due to syntax error, missing view, or initialization issue.',
      fixGuidelines: [
        'Check for XML syntax errors (unclosed tags, missing attributes)',
        'Verify all custom views have proper constructors',
        'Ensure all view imports are correct',
        'Clean and rebuild project if resource not found'
      ]
    },
    'xml_missing_id': {
      rootCause: 'findViewById returned null because the view ID does not exist in the inflated layout.',
      fixGuidelines: [
        'Add android:id="@+id/viewName" to view in layout XML',
        'Verify layout file is correct (check setContentView)',
        'Use view binding for type-safe view access',
        'Check if view is in an included layout or fragment'
      ]
    },
    'xml_attribute_error': {
      rootCause: 'Required XML attribute is missing from a view element.',
      fixGuidelines: [
        'Add layout_width and layout_height to all views',
        'Use wrap_content, match_parent, or specific dimensions',
        'Check for other required attributes specific to view type',
        'Refer to Android documentation for view requirements'
      ]
    },
    // CHUNK 4.3: Gradle error examples
    'gradle_dependency': {
      rootCause: 'Multiple versions of the same dependency are being used, causing version conflicts.',
      fixGuidelines: [
        'Use the recommended version across all modules',
        'Add explicit version constraint in root build.gradle',
        'Run ./gradlew dependencies to see full dependency tree',
        'Consider using a BOM (Bill of Materials) for consistent versions'
      ]
    },
    'gradle_version': {
      rootCause: 'Gradle version mismatch between project requirements and installed version.',
      fixGuidelines: [
        'Update gradle-wrapper.properties to use compatible version',
        'Sync Gradle files after version change',
        'Check plugin compatibility with new Gradle version',
        'Clear Gradle cache if needed: ./gradlew clean --refresh-dependencies'
      ]
    },
    'gradle_build': {
      rootCause: 'Gradle build failed due to configuration error or missing dependency.',
      fixGuidelines: [
        'Check build.gradle for syntax errors',
        'Verify all required repositories are declared',
        'Ensure dependencies are available and versions exist',
        'Run ./gradlew build --stacktrace for detailed error'
      ]
    },
    // CHUNK 4.4: Manifest error examples
    'manifest_permission': {
      rootCause: 'App is missing required permission declaration in AndroidManifest.xml.',
      fixGuidelines: [
        'Add <uses-permission> tag to AndroidManifest.xml',
        'Request runtime permission for dangerous permissions (Android 6.0+)',
        'Check permission name spelling and capitalization',
        'Verify permission is appropriate for your use case'
      ]
    },
    'manifest_activity': {
      rootCause: 'Activity must be declared in AndroidManifest.xml before it can be launched.',
      fixGuidelines: [
        'Add <activity> tag inside <application> element',
        'Include intent filters if activity should respond to intents',
        'Set android:name to full qualified class name',
        'Rebuild project after manifest changes'
      ]
    },
    'manifest_service': {
      rootCause: 'Service must be declared in AndroidManifest.xml before it can be started.',
      fixGuidelines: [
        'Add <service> tag inside <application> element',
        'Include required intent filters for service discovery',
        'Set android:exported correctly for Android 12+ compatibility',
        'Check service permissions and process attributes'
      ]
    }
  };
  
  const template = mockResults[parsedError.type] || {
    rootCause: 'Unable to determine root cause. Real agent analysis needed.',
    fixGuidelines: ['Run with Ollama server for detailed analysis']
  };
  
  // Determine language from error type (CHUNK 4.2)
  let language: 'kotlin' | 'java' | 'xml' = 'kotlin';
  if (parsedError.type.startsWith('xml_')) {
    language = 'xml';
  }
  
  // CHUNK 4.3: Add Gradle metadata for dependency conflicts
  let metadata: RCAResult['metadata'];
  let recommendedFix: string | undefined;
  
  if (parsedError.type === 'gradle_dependency') {
    metadata = {
      module: 'com.example.app',
      conflictingVersions: [
        'androidx.appcompat:appcompat:1.4.0 (from app)',
        'androidx.appcompat:appcompat:1.3.1 (from :library)',
        'androidx.appcompat:appcompat:1.2.0 (from com.google.android.material:material)'
      ],
      recommendedVersion: 'androidx.appcompat:appcompat:1.4.2',
      affectedDependencies: [
        'com.google.android.material:material:1.5.0',
        'com.example.library:library:1.0.0'
      ]
    };
    recommendedFix = 'Add to build.gradle: implementation("androidx.appcompat:appcompat:1.4.2")';
  }
  
  // CHUNK 4.4: Add Manifest metadata for permissions
  if (parsedError.type === 'manifest_permission') {
    metadata = {
      requiredPermission: 'android.permission.CAMERA'
    };
  }
  
  // CHUNK 4.4: Add mock documentation results for manifest errors
  let docResults: RCAResult['docResults'];
  if (parsedError.type.startsWith('manifest_')) {
    docResults = [
      {
        title: 'App Manifest Overview',
        summary: 'Every app project must have an AndroidManifest.xml file that describes essential information about your app.',
        url: 'https://developer.android.com/guide/topics/manifest/manifest-intro'
      },
      {
        title: 'Permissions on Android',
        summary: 'App permissions help support user privacy by protecting access to restricted data and restricted actions.',
        url: 'https://developer.android.com/guide/topics/permissions/overview'
      }
    ];
  }
  
  return {
    error: parsedError.message,
    errorType: parsedError.type,
    filePath: parsedError.filePath,
    line: parsedError.line,
    rootCause: template.rootCause || 'Unknown',
    fixGuidelines: template.fixGuidelines || [],
    confidence: 0.75, // Mock confidence
    codeSnippet: '// Code snippet will be provided by agent',
    toolsUsed: ['ReadFileTool', 'LSPTool', 'VectorSearchTool'], // CHUNK 2.2: Mock tools
    iterations: 3, // CHUNK 2.2: Mock iteration count
    language, // CHUNK 4.2: Add language info
    
    // CHUNK 2.3: Accuracy metrics
    qualityScore: 0.72,  // Mock quality score (slightly lower than confidence)
    latency: 25918,      // Mock latency (~26 seconds, from real accuracy tests)
    modelName: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest', // Mock model name
    
    // CHUNK 4.3 & 4.4: Metadata and docs
    metadata,
    recommendedFix,
    docResults,
  };
}

/**
 * CHUNK 1.3: Display results with nice formatting
 * CHUNK 1.4: Code Context Display
 * CHUNK 1.5: MVP Polish with enhanced formatting
 * CHUNK 3.3: Cache indicator
 */
function showResult(result: RCAResult): void {
  // Clear previous output (unless it's a cache hit with pre-existing header)
  if (!result.fromCache) {
    outputChannel.clear();
  }
  
  // Use emoji and formatting for better UX (Chunk 1.5)
  outputChannel.appendLine('🔍 === ROOT CAUSE ANALYSIS ===\n');
  
  // CHUNK 3.3: Show cache indicator if from cache
  if (result.fromCache && result.cacheTimestamp) {
    const cacheTime = new Date(result.cacheTimestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - cacheTime.getTime()) / 60000);
    const timeAgo = diffMinutes < 60 
      ? `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
      : `${Math.floor(diffMinutes / 60)} hour${Math.floor(diffMinutes / 60) !== 1 ? 's' : ''} ago`;
    
    outputChannel.appendLine(`⚡ CACHE HIT: Result retrieved from cache (analyzed ${timeAgo})`);
    outputChannel.appendLine(`💾 No LLM inference needed - instant result!\n`);
  }
  
  // Error badge with color-coding (Chunk 2.1 preview)
  const badge = getErrorBadge(result.errorType);
  outputChannel.appendLine(`${badge}\n`);
  
  outputChannel.appendLine(`🐛 ERROR: ${result.error}`);
  outputChannel.appendLine(`📁 FILE: ${result.filePath}:${result.line}\n`);
  
  // CHUNK 1.4: Display file reading status and code snippet
  if (result.codeSnippet && result.codeSnippet.length > 0 && result.codeSnippet !== '// Code snippet will be provided by agent') {
    outputChannel.appendLine('📝 CODE CONTEXT (from source file):');
    outputChannel.appendLine('```kotlin');
    outputChannel.appendLine(result.codeSnippet);
    outputChannel.appendLine('```\n');
    log('info', 'Code snippet displayed', { snippetLength: result.codeSnippet.length });
  } else {
    outputChannel.appendLine('⚠️  CODE CONTEXT: File could not be read (using error message only)\n');
    log('warn', 'No code snippet available');
  }
  
  // Root cause section
  outputChannel.appendLine(`💡 ROOT CAUSE:\n${result.rootCause}\n`);
  
  // CHUNK 4.1: Display Compose-specific hints
  if (isComposeError(result.errorType)) {
    displayComposeHints(result);
  }
  
  // CHUNK 4.2: Display XML-specific hints and suggestions
  if (isXMLError(result.errorType)) {
    displayXMLHints(result);
  }
  
  // CHUNK 4.3: Display Gradle-specific conflict visualization
  if (isGradleError(result.errorType)) {
    displayGradleConflicts(result);
  }
  
  // CHUNK 4.4: Display Manifest-specific suggestions
  if (isManifestError(result.errorType)) {
    displayManifestHints(result);
  }
  
  // CHUNK 1.5: Enhanced fix guidelines formatting
  outputChannel.appendLine(`🛠️  FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  
  // CHUNK 1.5: Confidence bar visualization
  const confidenceBar = createConfidenceBar(result.confidence);
  outputChannel.appendLine(`\n✅ CONFIDENCE: ${(result.confidence * 100).toFixed(0)}%`);
  outputChannel.appendLine(`   ${confidenceBar}`);
  outputChannel.appendLine(`   ${getConfidenceInterpretation(result.confidence)}`);
  
  // CHUNK 2.2: Display tool execution summary (if available)
  if (result.toolsUsed && result.toolsUsed.length > 0) {
    outputChannel.appendLine(`\n🔧 TOOLS USED:`);
    result.toolsUsed.forEach((tool, index) => {
      const toolIcon = getToolIcon(tool);
      outputChannel.appendLine(`  ${index + 1}. ${toolIcon} ${tool}`);
    });
  }
  
  // CHUNK 2.2: Display iteration count (if available)
  if (result.iterations !== undefined) {
    outputChannel.appendLine(`\n🔄 ITERATIONS: ${result.iterations} reasoning steps`);
  }
  
  // CHUNK 2.3: Accuracy metrics display (optional section)
  if (result.qualityScore !== undefined || result.latency !== undefined || result.modelName) {
    outputChannel.appendLine('\n📊 METRICS:');
    
    if (result.qualityScore !== undefined) {
      const qualityPercent = (result.qualityScore * 100).toFixed(0);
      const qualityBar = createConfidenceBar(result.qualityScore); // Reuse confidence bar
      outputChannel.appendLine(`   Quality Score: ${qualityPercent}% ${qualityBar}`);
    }
    
    if (result.latency !== undefined) {
      const latencySeconds = (result.latency / 1000).toFixed(1);
      outputChannel.appendLine(`   Analysis Time: ${latencySeconds}s`);
    }
    
    if (result.modelName) {
      outputChannel.appendLine(`   Model: ${result.modelName}`);
    }
  }
  
  // CHUNK 1.5: Helpful footer with improved tips
  outputChannel.appendLine('\n' + '─'.repeat(60));
  outputChannel.appendLine('💡 TIP: This is a placeholder result. Connect to Ollama for real AI-powered analysis.');
  outputChannel.appendLine('📖 Configure: File > Preferences > Settings > RCA Agent');
  outputChannel.appendLine('❓ Need help? Check the documentation or report issues on GitHub.');
  
  // Show output channel
  outputChannel.show(true);
  
  log('info', 'Result displayed in output channel with code context and confidence visualization');
}

/**
 * CHUNK 2.1: Error type badges with colors (EXPANDED)
 * Supports 30+ error types across Kotlin, Gradle, Compose, and XML
 */
function getErrorBadge(errorType: string): string {
  const badges: Record<string, string> = {
    // Kotlin Errors (6 types) - Red variants
    'npe': '🔴 NullPointerException',
    'lateinit': '🔴 Lateinit Property Error',
    'unresolved_reference': '🔴 Unresolved Reference',
    'type_mismatch': '🔴 Type Mismatch',
    'cast_exception': '🔴 Class Cast Exception',
    'index_out_of_bounds': '🔴 Index Out of Bounds',
    
    // Gradle Build Errors (5 types) - Yellow variants
    'gradle_dependency': '🟡 Gradle Dependency Conflict',
    'gradle_version': '🟡 Gradle Version Mismatch',
    'gradle_build': '🟡 Gradle Build Failure',
    'gradle_task': '🟡 Gradle Task Error',
    'gradle_plugin': '🟡 Gradle Plugin Issue',
    
    // Jetpack Compose Errors (10 types) - Purple variants
    'compose_remember': '🟣 Compose: Remember Error',
    'compose_derived_state': '🟣 Compose: DerivedStateOf Error',
    'compose_recomposition': '🟣 Compose: Recomposition Issue',
    'compose_launched_effect': '🟣 Compose: LaunchedEffect Error',
    'compose_disposable_effect': '🟣 Compose: DisposableEffect Error',
    'compose_composition_local': '🟣 Compose: CompositionLocal Error',
    'compose_modifier': '🟣 Compose: Modifier Error',
    'compose_side_effect': '🟣 Compose: Side Effect Error',
    'compose_state_read': '🟣 Compose: State Read Error',
    'compose_snapshot': '🟣 Compose: Snapshot Error',
    
    // XML/Android Layout Errors (8 types) - Orange variants
    'xml_inflation': '🟠 XML: Layout Inflation Error',
    'xml_missing_id': '🟠 XML: Missing View ID',
    'xml_attribute': '🟠 XML: Missing Required Attribute',
    'xml_namespace': '🟠 XML: Missing Namespace',
    'xml_tag_mismatch': '🟠 XML: Tag Mismatch',
    'xml_resource_not_found': '🟠 XML: Resource Not Found',
    'xml_duplicate_id': '🟠 XML: Duplicate ID',
    'xml_invalid_attribute': '🟠 XML: Invalid Attribute Value',
    
    // Android Manifest Errors (5 types) - Green variants - CHUNK 4.4
    'manifest_permission': '🟢 Manifest: Missing Permission',
    'manifest_activity': '🟢 Manifest: Activity Not Declared',
    'manifest_service': '🟢 Manifest: Service Not Declared',
    'manifest_receiver': '🟢 Manifest: Receiver Not Declared',
    'manifest_version': '🟢 Manifest: Version Conflict',
    
    // General/Other Errors - Blue variants
    'unknown': '🔵 Unknown Error',
    'timeout': '⏱️ Timeout',
    'network': '🌐 Network Error',
  };
  
  return badges[errorType] || '⚪ Unrecognized Error';
}

/**
 * CHUNK 1.5: Create visual confidence bar
 */
function createConfidenceBar(confidence: number): string {
  const barLength = 20;
  const filledLength = Math.round(confidence * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  return bar;
}

/**
 * CHUNK 1.5: Get confidence interpretation text
 */
function getConfidenceInterpretation(confidence: number): string {
  if (confidence >= 0.8) {
    return 'High confidence - likely accurate';
  } else if (confidence >= 0.6) {
    return 'Medium confidence - verify suggestion';
  } else {
    return 'Low confidence - use as starting point';
  }
}

/**
 * CHUNK 2.2: Get icon for tool name
 */
function getToolIcon(toolName: string): string {
  const icons: Record<string, string> = {
    'read_file': '📖',
    'ReadFileTool': '📖',
    'find_callers_of_function': '🔍',
    'LSPTool': '🔍',
    'vector_search_db': '📚',
    'VectorSearchTool': '📚',
    'web_search_wiki': '🌐',
    'WebSearchTool': '🌐',
    'get_code_context': '📝',
    'get_user_error_context': '❓',
  };
  
  return icons[toolName] || '🔧';
}

/**
 * CHUNK 1.5: Enhanced error handler with helpful suggestions and actions
 */
function handleAnalysisError(error: Error): void {
  log('error', 'Analysis failed', error);
  
  // Specific error messages with actionable suggestions
  if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
    // Ollama connection error
    vscode.window.showErrorMessage(
      '❌ Could not connect to Ollama. Is it running?',
      'Start Ollama',
      'Installation Guide',
      'Check Logs'
    ).then((selection: string | undefined) => {
      if (selection === 'Start Ollama') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/'));
      } else if (selection === 'Installation Guide') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
      } else if (selection === 'Check Logs') {
        debugChannel.show();
      }
    });
    
    outputChannel.appendLine('\n❌ ERROR: Could not connect to Ollama');
    outputChannel.appendLine('\n🔧 TROUBLESHOOTING STEPS:');
    outputChannel.appendLine('1. Install Ollama: https://ollama.ai/');
    outputChannel.appendLine('2. Start Ollama: Run "ollama serve" in terminal');
    outputChannel.appendLine('3. Pull model: Run "ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest"');
    outputChannel.appendLine('4. Check settings: File > Preferences > Settings > RCA Agent');
    
  } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    // Timeout error
    vscode.window.showErrorMessage(
      '⏱️ Analysis timed out. Try increasing timeout or using a smaller model.',
      'Open Settings',
      'View Logs'
    ).then((selection: string | undefined) => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'rcaAgent');
      } else if (selection === 'View Logs') {
        debugChannel.show();
      }
    });
    
    outputChannel.appendLine('\n⏱️ ERROR: Analysis timed out');
    outputChannel.appendLine('\n💡 SUGGESTIONS:');
    outputChannel.appendLine('• Increase timeout in settings');
    outputChannel.appendLine('• Use a faster/smaller model (e.g., hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest)');
    outputChannel.appendLine('• Check your network connection');
    
  } else if (error.message.includes('parse') || error.message.includes('Could not parse')) {
    // Parse error
    vscode.window.showErrorMessage(
      '⚠️ Could not parse error. Is this a Kotlin/Android error?',
      'View Debug Logs',
      'Report Issue'
    ).then((selection: string | undefined) => {
      if (selection === 'View Debug Logs') {
        debugChannel.show();
      } else if (selection === 'Report Issue') {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo/issues'));
      }
    });
    
    outputChannel.appendLine('\n⚠️ ERROR: Could not parse error message');
    outputChannel.appendLine('\n💡 TIPS:');
    outputChannel.appendLine('• Ensure error is from Kotlin/Android code');
    outputChannel.appendLine('• Include full stack trace if possible');
    outputChannel.appendLine('• Check debug logs for more details');
    
  } else {
    // Generic error
    vscode.window.showErrorMessage(
      `❌ Analysis failed: ${error.message}`,
      'View Logs',
      'Retry'
    ).then((selection: string | undefined) => {
      if (selection === 'View Logs') {
        debugChannel.show();
      } else if (selection === 'Retry') {
        vscode.commands.executeCommand('rcaAgent.analyzeError');
      }
    });
    
    outputChannel.appendLine(`\n❌ ERROR: ${error.message}`);
    outputChannel.appendLine('\n📋 Stack Trace:');
    outputChannel.appendLine(error.stack || 'No stack trace available');
  }
  
  outputChannel.show(true);
  log('error', 'Error displayed to user', { errorType: error.constructor.name });
}

/**
 * Logging utility
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  debugChannel.appendLine(logMessage);
  if (data) {
    debugChannel.appendLine(JSON.stringify(data, null, 2));
  }
  
  // Also console.log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage, data);
  }
}

/**
 * CHUNK 3.2: Search and display similar past solutions
 * Shows similar errors from database BEFORE running new analysis
 */
async function searchAndDisplaySimilarSolutions(parsedError: ParsedError): Promise<void> {
  try {
    log('info', 'CHUNK 3.2: Searching for similar past solutions', { errorMessage: parsedError.message });
    
    // TODO: Wire to Kai's ChromaDBClient.searchSimilar()
    // For now, simulate with placeholder data
    const similarRCAs = generateMockSimilarSolutions(parsedError);
    
    if (similarRCAs.length > 0) {
      log('info', 'Found similar solutions', { count: similarRCAs.length });
      
      // Display similar solutions in output channel BEFORE showing new analysis
      outputChannel.clear();
      outputChannel.appendLine('🔍 === SEARCHING KNOWLEDGE BASE ===\n');
      outputChannel.appendLine(`Found ${similarRCAs.length} similar past solution(s):\n`);
      outputChannel.appendLine('📚 SIMILAR PAST SOLUTIONS:\n');
      
      similarRCAs.forEach((rca, index) => {
        outputChannel.appendLine(`${index + 1}. ${rca.errorType.toUpperCase()}: ${rca.error}`);
        outputChannel.appendLine(`   📁 File: ${rca.filePath}:${rca.line}`);
        outputChannel.appendLine(`   💡 Root Cause: ${rca.rootCause}`);
        outputChannel.appendLine(`   ✅ Confidence: ${(rca.confidence * 100).toFixed(0)}%`);
        
        // Show distance/similarity score if available
        if (rca.distance !== undefined) {
          const similarity = ((1 - rca.distance) * 100).toFixed(0);
          outputChannel.appendLine(`   🎯 Similarity: ${similarity}%`);
        }
        
        outputChannel.appendLine('');
      });
      
      outputChannel.appendLine('─'.repeat(60));
      outputChannel.appendLine('💡 TIP: Review similar solutions above before checking new analysis below.\n');
      
      // Show notification
      const action = await vscode.window.showInformationMessage(
        `📚 Found ${similarRCAs.length} similar solution(s) from past analyses`,
        'View Now',
        'Continue to New Analysis'
      );
      
      if (action === 'View Now') {
        outputChannel.show(true);
      }
    } else {
      log('info', 'No similar solutions found in database');
      outputChannel.clear();
      outputChannel.appendLine('🔍 === SEARCHING KNOWLEDGE BASE ===\n');
      outputChannel.appendLine('📚 No similar past solutions found.');
      outputChannel.appendLine('This appears to be a new error pattern.\n');
      outputChannel.appendLine('─'.repeat(60) + '\n');
    }
  } catch (error) {
    log('error', 'Failed to search similar solutions', error);
    // Don't block analysis on database search failure
    outputChannel.appendLine('⚠️  Could not search past solutions (database unavailable)\n');
  }
}

/**
 * CHUNK 3.2: Generate mock similar solutions (PLACEHOLDER)
 * TODO: Replace with Kai's ChromaDBClient.searchSimilar()
 */
function generateMockSimilarSolutions(parsedError: ParsedError): Array<RCAResult & { distance?: number }> {
  // Simulate finding similar solutions based on error type
  const mockDatabase: Record<string, Array<RCAResult & { distance?: number }>> = {
    'npe': [
      {
        error: 'kotlin.KotlinNullPointerException: Attempt to invoke virtual method',
        errorType: 'npe',
        filePath: 'src/main/kotlin/com/example/MainActivity.kt',
        line: 45,
        rootCause: 'TextView instance was null when setText() was called',
        fixGuidelines: [
          'Use findViewById<TextView>() with null check',
          'Call setText() only after view inflation completes',
          'Use view binding for safer view access'
        ],
        confidence: 0.88,
        distance: 0.15, // Low distance = high similarity
      },
      {
        error: 'NullPointerException at com.example.ui.ProfileFragment.onViewCreated',
        errorType: 'npe',
        filePath: 'src/main/kotlin/com/example/ui/ProfileFragment.kt',
        line: 67,
        rootCause: 'Fragment view accessed after being destroyed',
        fixGuidelines: [
          'Check if view is null before access',
          'Use viewLifecycleOwner for observers',
          'Clear references in onDestroyView()'
        ],
        confidence: 0.82,
        distance: 0.22,
      }
    ],
    'lateinit': [
      {
        error: 'kotlin.UninitializedPropertyAccessException: lateinit property binding has not been initialized',
        errorType: 'lateinit',
        filePath: 'src/main/kotlin/com/example/DetailActivity.kt',
        line: 28,
        rootCause: 'ViewBinding accessed before onCreate() initialized it',
        fixGuidelines: [
          'Initialize binding in onCreate() before use',
          'Check ::binding.isInitialized before access',
          'Move initialization earlier in lifecycle'
        ],
        confidence: 0.91,
        distance: 0.12,
      }
    ]
  };
  
  // Return similar solutions for the parsed error type
  return mockDatabase[parsedError.type] || [];
}

/**
 * CHUNK 3.1: Store result in database
 * Shows storage notifications and handles errors gracefully
 */
async function storeResultInDatabase(result: RCAResult, parsedError: ParsedError): Promise<void> {
  try {
    log('info', 'CHUNK 3.1: Storing result in database', { 
      errorType: result.errorType,
      confidence: result.confidence 
    });
    
    // Show notification that we're storing
    vscode.window.showInformationMessage('💾 Storing result in database...');
    
    // TODO: Wire to Kai's ChromaDBClient.addRCA()
    // For now, simulate storage with placeholder
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate DB write
    
    // Generate a mock RCA ID (in real implementation, this comes from ChromaDB)
    const rcaId = generateMockRcaId();
    
    log('info', 'Result stored successfully', { rcaId });
    
    // Show success notification with ID
    const action = await vscode.window.showInformationMessage(
      `✅ Result saved! ID: ${rcaId.substring(0, 8)}...`,
      'View Details'
    );
    
    if (action === 'View Details') {
      // Add storage confirmation to output
      outputChannel.appendLine('\n💾 === STORAGE CONFIRMATION ===');
      outputChannel.appendLine(`✅ Result stored in knowledge base`);
      outputChannel.appendLine(`📋 RCA ID: ${rcaId}`);
      outputChannel.appendLine(`📅 Stored: ${new Date().toISOString()}`);
      outputChannel.appendLine(`🏷️  Error Type: ${result.errorType}`);
      outputChannel.appendLine(`✅ Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      outputChannel.appendLine('\n💡 This solution will help improve future analyses of similar errors.');
      outputChannel.show(true);
    }
    
    // Note: In real implementation, this would call:
    // const db = await ChromaDBClient.create();
    // const rcaId = await db.addRCA({
    //   error_message: result.error,
    //   error_type: result.errorType,
    //   language: parsedError.language,
    //   root_cause: result.rootCause,
    //   fix_guidelines: result.fixGuidelines,
    //   confidence: result.confidence,
    //   user_validated: false,
    //   quality_score: result.qualityScore || result.confidence,
    // });
    
  } catch (error) {
    log('error', 'Failed to store result in database', error);
    
    // Show warning but don't fail the analysis
    const action = await vscode.window.showWarningMessage(
      '⚠️  Could not store result in database. Analysis is still valid.',
      'View Error',
      'Retry'
    );
    
    if (action === 'View Error') {
      outputChannel.appendLine('\n❌ === STORAGE ERROR ===');
      outputChannel.appendLine(`Could not store result: ${(error as Error).message}`);
      outputChannel.appendLine('\n🔧 TROUBLESHOOTING:');
      outputChannel.appendLine('1. Check if ChromaDB is running (docker run -p 8000:8000 chromadb/chroma)');
      outputChannel.appendLine('2. Verify database URL in settings (default: http://localhost:8000)');
      outputChannel.appendLine('3. Check debug logs for more details');
      outputChannel.show(true);
      debugChannel.show();
    } else if (action === 'Retry') {
      await storeResultInDatabase(result, parsedError);
    }
  }
}

/**
 * CHUNK 3.1: Generate mock RCA ID (PLACEHOLDER)
 * TODO: Replace with actual ID from ChromaDB
 */
function generateMockRcaId(): string {
  // Generate a UUID-like mock ID
  const chars = 'abcdef0123456789';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
    if (i === 7 || i === 11 || i === 15 || i === 19) {
      id += '-';
    }
  }
  return id;
}

/**
 * CHUNK 3.3: Check cache for existing result
 * Returns cached result if found, null otherwise
 */
async function checkCache(parsedError: ParsedError): Promise<RCAResult | null> {
  try {
    log('info', 'CHUNK 3.3: Checking cache for existing result');
    
    // TODO: Wire to Kai's ErrorHasher and RCACache
    // const errorHash = new ErrorHasher().hash(parsedError);
    // const cache = RCACache.getInstance();
    // const cached = cache.get(errorHash);
    
    // For now, simulate cache check with placeholder
    const errorHash = generateMockErrorHash(parsedError);
    const cached = getMockCachedResult(errorHash, parsedError);
    
    if (cached) {
      log('info', 'Cache hit!', { errorHash, cacheTimestamp: cached.cacheTimestamp });
      
      // Show cache hit notification
      vscode.window.showInformationMessage('⚡ Found in cache! (instant result)');
      
      // Add cache indicator to output
      outputChannel.clear();
      outputChannel.appendLine('⚡ === CACHED RESULT (analyzed previously) ===\n');
      outputChannel.appendLine(`📅 Cached: ${cached.cacheTimestamp}`);
      outputChannel.appendLine(`⚡ Retrieved instantly (no LLM inference needed)\n`);
      outputChannel.appendLine('─'.repeat(60) + '\n');
      
      return cached;
    } else {
      log('info', 'Cache miss - will run full analysis');
      return null;
    }
  } catch (error) {
    log('error', 'Cache check failed', error);
    // Don't block on cache errors
    return null;
  }
}

/**
 * CHUNK 3.3: Generate mock error hash (PLACEHOLDER)
 * TODO: Replace with Kai's ErrorHasher
 */
function generateMockErrorHash(parsedError: ParsedError): string {
  // Simple hash based on error type and message
  const str = `${parsedError.type}:${parsedError.message}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * CHUNK 3.3: Get mock cached result (PLACEHOLDER)
 * TODO: Replace with Kai's RCACache.get()
 */
function getMockCachedResult(errorHash: string, parsedError: ParsedError): RCAResult | null {
  // Simulate cache - 30% chance of cache hit for testing
  const shouldCacheHit = Math.random() < 0.3;
  
  if (!shouldCacheHit) {
    return null;
  }
  
  // Return a cached result
  const cachedResult = generateMockResult(parsedError);
  cachedResult.fromCache = true;
  cachedResult.cacheTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  cachedResult.errorHash = errorHash;
  cachedResult.rcaId = generateMockRcaId();
  
  return cachedResult;
}

/**
 * CHUNK 3.3: Store result in cache for future use
 */
async function storeInCache(result: RCAResult, parsedError: ParsedError): Promise<void> {
  try {
    log('info', 'CHUNK 3.3: Storing result in cache');
    
    // TODO: Wire to Kai's ErrorHasher and RCACache
    // const errorHash = new ErrorHasher().hash(parsedError);
    // const cache = RCACache.getInstance();
    // cache.set(errorHash, result);
    
    // For now, simulate cache storage
    const errorHash = generateMockErrorHash(parsedError);
    result.errorHash = errorHash;
    
    log('info', 'Result cached successfully', { errorHash });
    
    // Note: In real implementation, this would call:
    // const cache = RCACache.getInstance();
    // cache.set(errorHash, result);
    
  } catch (error) {
    log('error', 'Failed to cache result', error);
    // Don't block on cache errors - cache is optional optimization
  }
}

/**
 * CHUNK 3.4: Show feedback prompt to user
 * Ask if the analysis was helpful (thumbs up/down)
 */
async function showFeedbackPrompt(result: RCAResult): Promise<void> {
  try {
    log('info', 'CHUNK 3.4: Showing feedback prompt');
    
    // Add feedback section to output
    outputChannel.appendLine('\n' + '─'.repeat(60));
    outputChannel.appendLine('💬 FEEDBACK');
    outputChannel.appendLine('Was this analysis helpful? Your feedback helps improve future analyses.');
    outputChannel.show(true);
    
    // Show feedback buttons
    const selection = await vscode.window.showInformationMessage(
      'Was this RCA helpful?',
      '👍 Yes, helpful!',
      '👎 Not helpful',
      'Skip'
    );
    
    if (!selection || selection === 'Skip') {
      log('info', 'User skipped feedback');
      return;
    }
    
    const rcaId = result.rcaId || generateMockRcaId();
    const errorHash = result.errorHash || generateMockErrorHash({
      type: result.errorType,
      message: result.error,
      filePath: result.filePath,
      line: result.line,
      language: 'kotlin'
    });
    
    if (selection === '👍 Yes, helpful!') {
      await handlePositiveFeedback(rcaId, errorHash);
    } else if (selection === '👎 Not helpful') {
      await handleNegativeFeedback(rcaId, errorHash);
    }
  } catch (error) {
    log('error', 'Feedback prompt failed', error);
    // Don't block on feedback errors
  }
}

/**
 * CHUNK 3.4: Handle positive feedback (thumbs up)
 */
async function handlePositiveFeedback(rcaId: string, errorHash: string): Promise<void> {
  try {
    log('info', 'CHUNK 3.4: Handling positive feedback', { rcaId, errorHash });
    
    // TODO: Wire to Kai's FeedbackHandler
    // const db = await ChromaDBClient.create();
    // const cache = RCACache.getInstance();
    // const feedbackHandler = new FeedbackHandler(db, cache);
    // await feedbackHandler.handlePositive(rcaId, errorHash);
    
    // For now, simulate feedback handling
    await new Promise(resolve => setTimeout(resolve, 300));
    
    log('info', 'Positive feedback recorded successfully');
    
    // Show thank you message
    vscode.window.showInformationMessage(
      '✅ Thank you! This will improve future analyses.',
      'View Stats'
    ).then((action: string | undefined) => {
      if (action === 'View Stats') {
        outputChannel.appendLine('\n📊 === FEEDBACK STATS ===');
        outputChannel.appendLine('✅ Positive feedback recorded');
        outputChannel.appendLine(`📋 RCA ID: ${rcaId}`);
        outputChannel.appendLine(`🔑 Error Hash: ${errorHash}`);
        outputChannel.appendLine('\n💡 Effects:');
        outputChannel.appendLine('  • Confidence score increased by 20%');
        outputChannel.appendLine('  • Solution prioritized in similar searches');
        outputChannel.appendLine('  • Quality score updated in knowledge base');
        outputChannel.show(true);
      }
    });
    
    // Add feedback confirmation to output
    outputChannel.appendLine('\n✅ Positive feedback recorded!');
    outputChannel.appendLine('This analysis will be prioritized for similar errors in the future.');
    
    // Note: In real implementation, this would:
    // 1. Update confidence score in database (+20%)
    // 2. Mark as user_validated = true
    // 3. Increase quality score
    // 4. Update cache with new confidence
    
  } catch (error) {
    log('error', 'Failed to handle positive feedback', error);
    vscode.window.showWarningMessage('Could not record feedback. Please try again.');
  }
}

/**
 * CHUNK 3.4: Handle negative feedback (thumbs down)
 */
async function handleNegativeFeedback(rcaId: string, errorHash: string): Promise<void> {
  try {
    log('info', 'CHUNK 3.4: Handling negative feedback', { rcaId, errorHash });
    
    // Ask for optional details
    const comment = await vscode.window.showInputBox({
      prompt: 'What was wrong with the analysis? (optional)',
      placeHolder: 'e.g., Incorrect root cause, missing context, wrong fix guidelines...',
      ignoreFocusOut: true
    });
    
    log('info', 'Negative feedback details', { comment: comment || 'none provided' });
    
    // TODO: Wire to Kai's FeedbackHandler
    // const db = await ChromaDBClient.create();
    // const cache = RCACache.getInstance();
    // const feedbackHandler = new FeedbackHandler(db, cache);
    // await feedbackHandler.handleNegative(rcaId, errorHash);
    
    // For now, simulate feedback handling
    await new Promise(resolve => setTimeout(resolve, 300));
    
    log('info', 'Negative feedback recorded successfully');
    
    // Show thank you message
    vscode.window.showInformationMessage(
      '📝 Feedback noted. We\'ll try to improve!',
      'View Details'
    ).then((action: string | undefined) => {
      if (action === 'View Details') {
        outputChannel.appendLine('\n📊 === FEEDBACK STATS ===');
        outputChannel.appendLine('👎 Negative feedback recorded');
        outputChannel.appendLine(`📋 RCA ID: ${rcaId}`);
        outputChannel.appendLine(`🔑 Error Hash: ${errorHash}`);
        if (comment) {
          outputChannel.appendLine(`💬 Comment: "${comment}"`);
        }
        outputChannel.appendLine('\n💡 Effects:');
        outputChannel.appendLine('  • Confidence score decreased by 50%');
        outputChannel.appendLine('  • Cache invalidated (will re-analyze next time)');
        outputChannel.appendLine('  • Quality score reduced in knowledge base');
        outputChannel.appendLine('  • Solution de-prioritized in searches');
        outputChannel.show(true);
      }
    });
    
    // Add feedback confirmation to output
    outputChannel.appendLine('\n👎 Negative feedback recorded!');
    if (comment) {
      outputChannel.appendLine(`💬 Your comment: "${comment}"`);
    }
    outputChannel.appendLine('This analysis will be improved and cache invalidated.');
    
    // Note: In real implementation, this would:
    // 1. Update confidence score in database (-50%)
    // 2. Mark as user_validated = false
    // 3. Decrease quality score
    // 4. Invalidate cache entry (force re-analysis)
    // 5. Store user comment for improvement
    
  } catch (error) {
    log('error', 'Failed to handle negative feedback', error);
    vscode.window.showWarningMessage('Could not record feedback. Please try again.');
  }
}

/**
 * CHUNK 4.1: Check if error is Compose-related
 */
function isComposeError(errorType: string): boolean {
  return errorType.startsWith('compose_');
}

/**
 * CHUNK 4.1: Show Compose tips on error detection
 */
async function showComposeTips(parsedError: ParsedError): Promise<void> {
  log('info', 'CHUNK 4.1: Detected Compose error', { errorType: parsedError.type });
  
  // Show brief notification
  vscode.window.showInformationMessage(
    '🎨 Jetpack Compose error detected - specialized analysis will be provided'
  );
}

/**
 * CHUNK 4.1: Display Compose-specific hints in output
 */
function displayComposeHints(result: RCAResult): void {
  outputChannel.appendLine('\n🎨 COMPOSE TIP:');
  
  const composeTips: Record<string, string> = {
    'compose_remember': '   💡 Use remember { mutableStateOf() } to preserve state across recompositions',
    'compose_derived_state': '   💡 Use derivedStateOf to compute values that depend on other state',
    'compose_recomposition': '   💡 Check for unstable parameters causing excessive recomposition - use @Stable or @Immutable',
    'compose_launched_effect': '   💡 LaunchedEffect restarts when keys change - ensure keys are correct',
    'compose_disposable_effect': '   💡 Always return an onDispose callback to clean up resources',
    'compose_composition_local': '   💡 Provide CompositionLocal values at parent level before accessing',
    'compose_modifier': '   💡 Modifier order matters: size modifiers before padding, padding before background',
    'compose_side_effect': '   💡 Move side effects into LaunchedEffect, DisposableEffect, or SideEffect blocks',
    'compose_state_read': '   💡 Reading state during composition can cause infinite recomposition - use LaunchedEffect',
    'compose_snapshot': '   💡 Snapshot errors indicate concurrent state modification - use synchronized access'
  };
  
  const tip = composeTips[result.errorType] || '   💡 Follow Jetpack Compose best practices for state management';
  outputChannel.appendLine(tip);
  
  // Add documentation link
  outputChannel.appendLine('\n   📚 Compose Docs: https://developer.android.com/jetpack/compose');
  
  log('info', 'Compose tips displayed', { errorType: result.errorType });
}

/**
 * CHUNK 4.2: Check if error is XML-related
 */
function isXMLError(errorType: string): boolean {
  return errorType.startsWith('xml_');
}

/**
 * CHUNK 4.2: Show XML tips on error detection
 */
async function showXMLTips(parsedError: ParsedError): Promise<void> {
  log('info', 'CHUNK 4.2: Detected XML error', { errorType: parsedError.type });
  
  // Show brief notification
  vscode.window.showInformationMessage(
    '📄 XML layout error detected - layout-specific guidance will be provided'
  );
}

/**
 * CHUNK 4.2: Display XML-specific hints in output
 */
function displayXMLHints(result: RCAResult): void {
  outputChannel.appendLine('\n📄 XML LAYOUT TIP:');
  
  const xmlTips: Record<string, string> = {
    'xml_inflation': '   💡 Check XML syntax, view imports, and custom view constructors',
    'xml_missing_id': '   💡 Add android:id="@+id/viewName" to the view in your layout file',
    'xml_attribute_error': '   💡 Some attributes are required (e.g., layout_width, layout_height)',
    'xml_namespace_error': '   💡 Add xmlns:android="http://schemas.android.com/apk/res/android" to root element',
    'xml_tag_mismatch': '   💡 Ensure all tags are properly opened and closed with matching names',
    'xml_resource_not_found': '   💡 Check that resource exists in res/ folder and matches reference format',
    'xml_duplicate_id': '   💡 Each android:id must be unique within the layout file',
    'xml_invalid_attribute_value': '   💡 Check attribute value format (e.g., dimensions need units: dp, sp, px)'
  };
  
  const tip = xmlTips[result.errorType] || '   💡 Review XML layout syntax and Android view requirements';
  outputChannel.appendLine(tip);
  
  // CHUNK 4.2: Display XML-specific code snippet format if available
  if (result.language === 'xml' && result.codeSnippet) {
    outputChannel.appendLine('\n📝 XML CODE CONTEXT:');
    outputChannel.appendLine(`   File: ${result.filePath}`);
    outputChannel.appendLine(`   Line: ${result.line}`);
  }
  
  // CHUNK 4.2: Suggest attribute fixes for common XML errors
  if (result.errorType === 'xml_attribute_error') {
    outputChannel.appendLine('\n✏️  COMMON REQUIRED ATTRIBUTES:');
    outputChannel.appendLine('   • android:layout_width="wrap_content|match_parent|{size}dp"');
    outputChannel.appendLine('   • android:layout_height="wrap_content|match_parent|{size}dp"');
    outputChannel.appendLine('   • android:id="@+id/{viewName}" (for findViewById)');
  }
  
  if (result.errorType === 'xml_namespace_error') {
    outputChannel.appendLine('\n✏️  ADD TO ROOT ELEMENT:');
    outputChannel.appendLine('   <{RootView}');
    outputChannel.appendLine('       xmlns:android="http://schemas.android.com/apk/res/android"');
    outputChannel.appendLine('       xmlns:app="http://schemas.android.com/apk/res-auto"');
    outputChannel.appendLine('       ... >');
  }
  
  // Add documentation link
  outputChannel.appendLine('\n   📚 Layout Docs: https://developer.android.com/guide/topics/ui/declaring-layout');
  
  log('info', 'XML tips displayed', { errorType: result.errorType });
}

/**
 * CHUNK 4.3: Check if error is Gradle-related
 */
function isGradleError(errorType: string): boolean {
  return errorType.startsWith('gradle_');
}

/**
 * CHUNK 4.3: Show Gradle tips on error detection
 */
async function showGradleTips(parsedError: ParsedError): Promise<void> {
  log('info', 'CHUNK 4.3: Detected Gradle error', { errorType: parsedError.type });
  
  // Show brief notification
  vscode.window.showInformationMessage(
    '📦 Gradle build error detected - dependency conflict analysis will be provided'
  );
}

/**
 * CHUNK 4.3: Display Gradle-specific conflict visualization
 */
function displayGradleConflicts(result: RCAResult): void {
  outputChannel.appendLine('\n📦 GRADLE BUILD INFO:');
  
  // Display module info if available
  if (result.metadata?.module) {
    outputChannel.appendLine(`   Module: ${result.metadata.module}`);
  }
  
  // Display conflicting versions if available
  if (result.metadata?.conflictingVersions && result.metadata.conflictingVersions.length > 0) {
    outputChannel.appendLine(`\n   🔀 CONFLICTING VERSIONS:`);
    result.metadata.conflictingVersions.forEach((version: string) => {
      outputChannel.appendLine(`      • ${version}`);
    });
  }
  
  // Display recommended version
  if (result.metadata?.recommendedVersion) {
    outputChannel.appendLine(`\n   ✅ RECOMMENDED VERSION:`);
    outputChannel.appendLine(`      ${result.metadata.recommendedVersion}`);
  }
  
  // Display affected dependencies
  if (result.metadata?.affectedDependencies && result.metadata.affectedDependencies.length > 0) {
    outputChannel.appendLine(`\n   📋 AFFECTED DEPENDENCIES:`);
    result.metadata.affectedDependencies.forEach((dep: string) => {
      outputChannel.appendLine(`      • ${dep}`);
    });
  }
  
  // Display recommended fix command
  if (result.recommendedFix) {
    outputChannel.appendLine(`\n🔧 RECOMMENDED FIX:`);
    outputChannel.appendLine(`   ${result.recommendedFix}`);
    outputChannel.appendLine(`\n   💡 Run this in your terminal to resolve the conflict`);
  }
  
  // Add Gradle documentation link
  outputChannel.appendLine(`\n   📚 Gradle Docs: https://docs.gradle.org/current/userguide/dependency_management.html`);
  
  log('info', 'Gradle conflict visualization displayed', { errorType: result.errorType });
}

/**
 * CHUNK 4.4: Check if error is Manifest-related
 */
function isManifestError(errorType: string): boolean {
  return errorType.startsWith('manifest_');
}

/**
 * CHUNK 4.4: Show Manifest tips on error detection
 */
async function showManifestTips(parsedError: ParsedError): Promise<void> {
  log('info', 'CHUNK 4.4: Detected Manifest error', { errorType: parsedError.type });
  
  // Show brief notification
  vscode.window.showInformationMessage(
    '📋 Android Manifest error detected - permission and component analysis will be provided'
  );
}

/**
 * CHUNK 4.4: Display Manifest-specific suggestions
 */
function displayManifestHints(result: RCAResult): void {
  outputChannel.appendLine('\n📋 ANDROID MANIFEST INFO:');
  
  // Display manifest-specific tips based on error type
  const manifestTips: Record<string, string> = {
    'manifest_permission': '   💡 Add missing permission to AndroidManifest.xml in <manifest> root element',
    'manifest_activity': '   💡 Declare activity in AndroidManifest.xml inside <application> tag',
    'manifest_service': '   💡 Declare service in AndroidManifest.xml with required intent filters',
    'manifest_receiver': '   💡 Declare broadcast receiver in AndroidManifest.xml or register dynamically',
    'manifest_version': '   💡 Check targetSdkVersion and minSdkVersion for API compatibility'
  };
  
  const tip = manifestTips[result.errorType] || '   💡 Review AndroidManifest.xml for missing declarations';
  outputChannel.appendLine(tip);
  
  // Display required permission if available
  if (result.metadata?.requiredPermission) {
    outputChannel.appendLine(`\n   ⚠️  MISSING PERMISSION: ${result.metadata.requiredPermission}`);
    outputChannel.appendLine(`\n✏️  ADD TO AndroidManifest.xml:`);
    outputChannel.appendLine(`   <manifest xmlns:android="http://schemas.android.com/apk/res/android">`);
    outputChannel.appendLine(`       <uses-permission android:name="${result.metadata.requiredPermission}" />`);
    outputChannel.appendLine(`       ...`);
    outputChannel.appendLine(`   </manifest>`);
  }
  
  // Display permission-specific warnings based on common permissions
  if (result.metadata?.requiredPermission) {
    const permission = result.metadata.requiredPermission;
    
    if (permission.includes('INTERNET')) {
      outputChannel.appendLine(`\n   ℹ️  Note: INTERNET permission doesn't require runtime permission request`);
    } else if (permission.includes('CAMERA') || permission.includes('LOCATION') || permission.includes('STORAGE')) {
      outputChannel.appendLine(`\n   ⚠️  Note: This is a dangerous permission - requires runtime permission request on Android 6.0+`);
      outputChannel.appendLine(`   📖 See: https://developer.android.com/training/permissions/requesting`);
    }
  }
  
  // Documentation results (if available from Kai's backend)
  if (result.docResults && result.docResults.length > 0) {
    outputChannel.appendLine(`\n📚 RELEVANT DOCUMENTATION:`);
    result.docResults.forEach((doc, index) => {
      outputChannel.appendLine(`\n   ${index + 1}. ${doc.title}`);
      outputChannel.appendLine(`      ${doc.summary}`);
      if (doc.url) {
        outputChannel.appendLine(`      🔗 ${doc.url}`);
      }
    });
  }
  
  // Add Android Manifest documentation link
  outputChannel.appendLine(`\n   📚 Manifest Guide: https://developer.android.com/guide/topics/manifest/manifest-intro`);
  
  log('info', 'Manifest hints displayed', { errorType: result.errorType });
}

/**
 * Extension cleanup
 */
export function deactivate(): void {
  log('info', 'RCA Agent extension deactivated');
  
  // Clean up webview
  if (currentWebview) {
    currentWebview.dispose();
    currentWebview = undefined;
  }
  
  // Resources are disposed automatically via context.subscriptions
}

/**
 * CHUNK 5.1: Analyze error with webview display
 */
async function analyzeErrorWithWebview(): Promise<void> {
  // Get error text from user
  const errorText = await getErrorText();
  if (!errorText) {
    vscode.window.showWarningMessage('No error text provided');
    return;
  }
  
  // Validate and sanitize input
  const sanitized = sanitizeErrorText(errorText);
  log('info', 'Received error text for webview analysis', { length: sanitized.length });
  
  // Parse error
  const parsedError = parseError(sanitized);
  
  if (!parsedError) {
    vscode.window.showErrorMessage(
      'Could not parse error. Is this a Kotlin/Android error?',
      'View Debug Logs'
    ).then((selection: string | undefined) => {
      if (selection === 'View Debug Logs') {
        debugChannel.show();
      }
    });
    return;
  }
  
  // Create or reuse webview
  if (!currentWebview) {
    currentWebview = RCAWebview.create(extensionContext, educationalMode);
  } else {
    currentWebview.reset();
  }
  
  // Check cache
  const cachedResult = await checkCache(parsedError);
  
  if (cachedResult) {
    log('info', 'Cache hit - displaying in webview');
    
    // Add educational content if in educational mode
    if (educationalMode) {
      cachedResult.learningNotes = generateLearningNotes(cachedResult);
    }
    
    currentWebview.showFinalResult(cachedResult);
    return;
  }
  
  // Simulate agent analysis with progress updates
  log('info', 'Starting webview analysis (mock)');
  
  try {
    // Simulate progress (in real implementation, this would come from agent stream)
    const maxIterations = 3;
    
    for (let i = 1; i <= maxIterations; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const thoughts = [
        'Reading error context from file...',
        'Analyzing variable initialization patterns...',
        'Synthesizing root cause explanation...'
      ];
      
      currentWebview.updateProgress(i, maxIterations, thoughts[i - 1]);
    }
    
    // Generate mock result
    const result = generateMockResult(parsedError);
    
    // Add educational content if in educational mode
    if (educationalMode) {
      result.learningNotes = generateLearningNotes(result);
    }
    
    // Display final result
    currentWebview.showFinalResult(result);
    
    // CHUNK 5.3: Show performance metrics if enabled
    const config = vscode.workspace.getConfiguration('rcaAgent');
    const showMetrics = config.get<boolean>('showPerformanceMetrics', false);
    
    if (showMetrics) {
      // Generate mock performance metrics
      const metrics = {
        totalTime: result.latency || 2450,
        llmTime: 1850,
        toolTime: 600,
        cacheHitRate: 0,
        tokenUsage: {
          prompt: 1234,
          completion: 567,
          total: 1801
        }
      };
      
      currentWebview.showPerformanceMetrics(metrics);
    }
    
    log('info', 'Webview analysis complete');
    
  } catch (error) {
    const err = error as Error;
    log('error', 'Webview analysis failed', err);
    currentWebview.showError(err.message);
  }
}

/**
 * CHUNK 5.2: Generate educational learning notes
 */
function generateLearningNotes(result: RCAResult): string[] {
  const notes: string[] = [];
  const errorType = result.errorType;
  
  // Kotlin Core Errors
  if (errorType === 'npe') {
    notes.push(
      '**What is a NullPointerException?**\n' +
      'A NullPointerException (NPE) occurs when you try to use an object reference that points to null. ' +
      'In Kotlin, this usually happens when working with Java interop or using the !! operator.'
    );
    notes.push(
      '**Why did this happen?**\n' +
      'The variable was null when you tried to access it. This often happens because:\n' +
      '- You received a null value from Java code\n' +
      '- You used the !! operator without checking for null\n' +
      '- A lateinit property wasn\'t initialized before use'
    );
    notes.push(
      '**How to prevent this:**\n' +
      '- Use safe calls (?.) instead of !! operator\n' +
      '- Use let { } to safely handle nullable values\n' +
      '- Initialize lateinit properties in init blocks\n' +
      '- Consider using nullable types (String?) with proper null handling'
    );
  } else if (errorType === 'lateinit') {
    notes.push(
      '**What is lateinit?**\n' +
      'lateinit allows you to declare non-null properties that will be initialized later. ' +
      'It\'s commonly used for dependency injection or properties initialized in onCreate().'
    );
    notes.push(
      '**Why did this error happen?**\n' +
      'You tried to access the property before calling the initialization code. Common scenarios:\n' +
      '- Accessing in onCreate() before it\'s initialized\n' +
      '- Initialization code threw an exception\n' +
      '- Forgot to call the initialization method'
    );
    notes.push(
      '**Best practices:**\n' +
      '- Use isInitialized check: ::property.isInitialized\n' +
      '- Initialize in constructor or init block if possible\n' +
      '- Consider using lazy delegation: val property by lazy { ... }\n' +
      '- For Android, initialize in onCreate() before accessing'
    );
  }
  
  // Jetpack Compose Errors
  else if (errorType.startsWith('compose_')) {
    if (errorType === 'compose_remember') {
      notes.push(
        '**Understanding remember in Compose:**\n' +
        'remember { } is used to store state across recompositions. Without it, your state ' +
        'gets recreated every time the composable recomposes, losing user input or data.'
      );
      notes.push(
        '**When to use remember:**\n' +
        '- For mutableStateOf() to persist state: remember { mutableStateOf("") }\n' +
        '- For expensive calculations: remember { heavyComputation() }\n' +
        '- For object instances that should survive recomposition'
      );
      notes.push(
        '**Common mistakes:**\n' +
        '- Forgetting remember with mutableStateOf (state resets on recompose)\n' +
        '- Using remember for values that should change (use derivedStateOf)\n' +
        '- Not using rememberSaveable for configuration changes'
      );
    } else if (errorType === 'compose_recomposition') {
      notes.push(
        '**What is recomposition?**\n' +
        'Recomposition is when Compose reruns composables to update the UI. ' +
        'Excessive recomposition can cause performance issues and unexpected behavior.'
      );
      notes.push(
        '**Why this happened:**\n' +
        'Your composable is recomposing too often, possibly because:\n' +
        '- Unstable parameters (mutable objects, lambdas)\n' +
        '- State changes in parent composables\n' +
        '- Missing remember for state or calculations'
      );
      notes.push(
        '**How to optimize:**\n' +
        '- Make parameters stable (use @Stable or @Immutable)\n' +
        '- Use remember for lambdas and callbacks\n' +
        '- Use derivedStateOf for computed values\n' +
        '- Check Layout Inspector for recomposition counts'
      );
    }
  }
  
  // XML Layout Errors
  else if (errorType.startsWith('xml_')) {
    notes.push(
      '**Understanding XML Layouts:**\n' +
      'XML layouts define your UI structure. Errors here usually mean:\n' +
      '- Missing required attributes\n' +
      '- Wrong attribute values\n' +
      '- Resources not found\n' +
      '- Syntax errors in XML'
    );
    notes.push(
      '**Debugging tips:**\n' +
      '- Check the exact line number in the error\n' +
      '- Verify all required attributes are present\n' +
      '- Make sure resource IDs exist (colors, strings, drawables)\n' +
      '- Use Android Studio\'s Layout Editor for validation'
    );
  }
  
  // Gradle Build Errors
  else if (errorType.startsWith('gradle_')) {
    notes.push(
      '**Understanding Gradle Dependencies:**\n' +
      'Gradle manages libraries and builds your app. Conflicts happen when:\n' +
      '- Multiple libraries depend on different versions of the same library\n' +
      '- Incompatible library versions are specified\n' +
      '- Plugin versions don\'t match'
    );
    notes.push(
      '**Resolution strategies:**\n' +
      '- Use implementation() instead of compile()\n' +
      '- Force specific versions with force = true\n' +
      '- Use dependency resolution strategy in build.gradle\n' +
      '- Check with: ./gradlew dependencies to see conflict tree'
    );
  }
  
  // Manifest Errors
  else if (errorType.startsWith('manifest_')) {
    notes.push(
      '**What is AndroidManifest.xml?**\n' +
      'The manifest declares essential app information:\n' +
      '- Permissions your app needs\n' +
      '- Activities, services, receivers\n' +
      '- Min/target SDK versions\n' +
      '- App features and requirements'
    );
    notes.push(
      '**Permission best practices:**\n' +
      '- Only request permissions you actually need\n' +
      '- For dangerous permissions, request at runtime (Android 6.0+)\n' +
      '- Explain to users WHY you need each permission\n' +
      '- Handle permission denial gracefully'
    );
  }
  
  // Default educational content
  if (notes.length === 0) {
    notes.push(
      '**Understanding the error:**\n' +
      'This error occurred because the code tried to perform an operation that wasn\'t valid. ' +
      'Review the error message and stack trace to understand what went wrong.'
    );
    notes.push(
      '**General debugging tips:**\n' +
      '- Read the full error message carefully\n' +
      '- Check the line number and file mentioned\n' +
      '- Look for recent code changes that might have caused it\n' +
      '- Use the debugger to inspect variable values'
    );
  }
  
  return notes;
}
