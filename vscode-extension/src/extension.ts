// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

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
}

// Global state
let outputChannel: vscode.OutputChannel;
let debugChannel: vscode.OutputChannel;

/**
 * CHUNK 1.1: Extension Bootstrap
 * Entry point - Called when extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize output channels
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');
  context.subscriptions.push(outputChannel, debugChannel);
  
  log('info', 'RCA Agent extension activated');
  
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
  
  context.subscriptions.push(analyzeCommand);
  
  log('info', 'Command registered: rcaAgent.analyzeError');
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
    ).then(selection => {
      if (selection === 'View Debug Logs') {
        debugChannel.show();
      }
    });
    return;
  }
  
  log('info', 'Error parsed successfully', parsedError);
  
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
  if (errorText.includes('NullPointerException')) {
    errorType = 'npe';
  } else if (errorText.includes('UninitializedPropertyAccessException') || 
             errorText.includes('lateinit')) {
    errorType = 'lateinit';
  } else if (errorText.includes('UNRESOLVED_REFERENCE')) {
    errorType = 'unresolved_reference';
  }
  
  if (fileLineMatch || errorType !== 'unknown') {
    return {
      type: errorType,
      message: errorText.split('\n')[0].trim(),
      filePath: fileLineMatch ? fileLineMatch[1] : 'unknown',
      line: fileLineMatch ? parseInt(fileLineMatch[2]) : 0,
      language: 'kotlin'
    };
  }
  
  log('warn', 'Could not parse error text');
  return null;
}

/**
 * CHUNK 1.3: Analyze with progress indicator
 * Calls Kai's agent and displays results
 */
async function analyzeWithProgress(parsedError: ParsedError): Promise<void> {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'RCA Agent',
    cancellable: false,
  }, async (progress) => {
    try {
      progress.report({ message: 'Checking LLM connection...' });
      
      // Check if we can connect to Ollama (placeholder)
      const config = vscode.workspace.getConfiguration('rcaAgent');
      const ollamaUrl = config.get<string>('ollamaUrl') || 'http://localhost:11434';
      const model = config.get<string>('model') || 'granite-code:8b';
      
      log('info', 'Configuration', { ollamaUrl, model });
      
      // TODO: Wire to Kai's OllamaClient and MinimalReactAgent
      // For now, simulate analysis with placeholder
      progress.report({ message: 'Analyzing error... (using placeholder)' });
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock result (will be replaced with Kai's agent)
      const result = generateMockResult(parsedError);
      
      progress.report({ message: 'Complete!', increment: 100 });
      
      // Display result in output channel
      showResult(result);
      
      vscode.window.showInformationMessage('Analysis complete! Check the RCA Agent output.');
      
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
    }
  };
  
  const template = mockResults[parsedError.type] || {
    rootCause: 'Unable to determine root cause. Real agent analysis needed.',
    fixGuidelines: ['Run with Ollama server for detailed analysis']
  };
  
  return {
    error: parsedError.message,
    errorType: parsedError.type,
    filePath: parsedError.filePath,
    line: parsedError.line,
    rootCause: template.rootCause || 'Unknown',
    fixGuidelines: template.fixGuidelines || [],
    confidence: 0.75, // Mock confidence
    codeSnippet: '// Code snippet will be provided by agent'
  };
}

/**
 * CHUNK 1.3 & 1.5: Display results with nice formatting
 */
function showResult(result: RCAResult): void {
  // Clear previous output
  outputChannel.clear();
  
  // Use emoji and formatting for better UX
  outputChannel.appendLine('🔍 === ROOT CAUSE ANALYSIS ===\n');
  
  // Error badge
  const badge = getErrorBadge(result.errorType);
  outputChannel.appendLine(`${badge}\n`);
  
  outputChannel.appendLine(`🐛 ERROR: ${result.error}`);
  outputChannel.appendLine(`📁 FILE: ${result.filePath}:${result.line}\n`);
  
  // Code snippet if available
  if (result.codeSnippet && result.codeSnippet.length > 0) {
    outputChannel.appendLine('📝 CODE CONTEXT:');
    outputChannel.appendLine('```kotlin');
    outputChannel.appendLine(result.codeSnippet);
    outputChannel.appendLine('```\n');
  }
  
  outputChannel.appendLine(`💡 ROOT CAUSE:\n${result.rootCause}\n`);
  outputChannel.appendLine(`🛠️  FIX GUIDELINES:`);
  result.fixGuidelines.forEach((guideline, index) => {
    outputChannel.appendLine(`  ${index + 1}. ${guideline}`);
  });
  
  outputChannel.appendLine(`\n✅ CONFIDENCE: ${(result.confidence * 100).toFixed(0)}%`);
  
  // Helpful footer
  outputChannel.appendLine('\n---');
  outputChannel.appendLine('💡 TIP: This is a placeholder result. Connect to Ollama for real AI-powered analysis.');
  outputChannel.appendLine('📖 Configure: File > Preferences > Settings > RCA Agent');
  
  // Show output channel
  outputChannel.show(true);
  
  log('info', 'Result displayed in output channel');
}

/**
 * CHUNK 2.1: Error type badges with colors
 */
function getErrorBadge(errorType: string): string {
  const badges: Record<string, string> = {
    'npe': '🔴 NullPointerException',
    'lateinit': '🟠 Lateinit Error',
    'gradle_build': '🟡 Build Error',
    'unresolved_reference': '🔵 Unresolved Reference',
    'type_mismatch': '🟣 Type Mismatch',
  };
  return badges[errorType] || '⚪ Unknown Error';
}

/**
 * Error handler with helpful suggestions
 */
function handleAnalysisError(error: Error): void {
  log('error', 'Analysis failed', error);
  
  // Specific error messages
  if (error.message.includes('ECONNREFUSED') || error.message.includes('Ollama')) {
    vscode.window.showErrorMessage(
      'Could not connect to Ollama. Is it running?',
      'Start Ollama',
      'View Docs'
    ).then(selection => {
      if (selection === 'Start Ollama') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/'));
      } else if (selection === 'View Docs') {
        vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/docs'));
      }
    });
  } else {
    vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
  }
  
  outputChannel.appendLine(`\n❌ ERROR: ${error.message}`);
  outputChannel.show(true);
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
 * Extension cleanup
 */
export function deactivate(): void {
  log('info', 'RCA Agent extension deactivated');
  // Resources are disposed automatically via context.subscriptions
}
