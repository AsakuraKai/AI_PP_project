// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// Backend service imports (KEPT - UI will wire to these)
import { AnalysisService } from './services/AnalysisService';
import { FixApplicationService } from './services/FixApplicationService';
import { ErrorQueueManager } from './services/ErrorQueueManager';
import { StateManager } from './services/StateManager';
import { AdvancedErrorDetector } from './services/AdvancedErrorDetector';

// Webview Provider import (NEW - Phase 1)
import { RCAWebviewProvider } from './webview/RCAWebviewProvider';

// Chat Participant imports (KEPT - Not UI related)
import { registerChatParticipant } from './chat/RCAChatParticipant';
import { initializeTools } from './tools';
import { ConversationalAgent } from './chat/ConversationalAgent';
import { GuidedDebuggingWorkflow } from './chat/GuidedDebuggingWorkflow';
import {
  applyFixCommand,
  explainMoreCommand,
  searchSimilarCommand
} from './chat/ChatActionCommands';

// ============================================================================
// NOTE: All UI components have been removed
// See docs/RCA_UI_WIRING_GUIDE.md for future UI implementation
// Backend services (AnalysisService, FixApplicationService) remain available
// ============================================================================

// Global state
let outputChannel: vscode.OutputChannel;
let debugChannel: vscode.OutputChannel;
let extensionContext: vscode.ExtensionContext;
let statusBarItem: vscode.StatusBarItem;

// Backend service instances (KEPT - UI will use these)
let analysisService: AnalysisService | undefined;
let fixApplicationService: FixApplicationService | undefined;
let errorQueueManager: ErrorQueueManager | undefined;
let stateManager: StateManager | undefined;
let advancedErrorDetector: AdvancedErrorDetector | undefined;

// Chat/workflow instances (KEPT - Not UI related)
let conversationalAgent: ConversationalAgent | undefined;
let guidedWorkflow: GuidedDebuggingWorkflow | undefined;

/**
 * Extension Bootstrap - Entry point
 * Called when extension is activated
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  extensionContext = context;

  // Initialize output channels
  outputChannel = vscode.window.createOutputChannel('RCA Agent');
  debugChannel = vscode.window.createOutputChannel('RCA Agent Debug');
  context.subscriptions.push(outputChannel, debugChannel);

  log('info', 'RCA Agent extension activated - UI removed, backend services available');

  // Initialize state manager and error queue (MUST be before backend services)
  stateManager = StateManager.getInstance(context);
  errorQueueManager = ErrorQueueManager.getInstance(context);
  log('info', 'StateManager and ErrorQueueManager initialized - error detection active');

  // Create status bar item for error count
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'rca-agent.showErrorQueue';
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Update status bar when error queue changes
  errorQueueManager.onErrorQueueChange(() => {
    updateStatusBar();
  });

  // Initialize backend services (KEPT - UI will use these)
  await initializeBackendServices(context);

  // Register Webview Provider (NEW - Phase 1)
  try {
    log('info', 'Registering webview provider...');
    const webviewProvider = new RCAWebviewProvider(context.extensionUri, context);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        RCAWebviewProvider.viewType,
        webviewProvider,
        {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        }
      )
    );
    log('info', 'Webview provider registered successfully');
  } catch (error) {
    log('error', 'Failed to register webview provider', error);
  }

  // Initialize chat participant (KEPT - Not UI related)
  try {
    log('info', 'Registering chat participant...');
    await registerChatParticipant(context);
    log('info', 'Chat participant registered successfully');
  } catch (error) {
    log('error', 'Failed to register chat participant', error);
  }

  // Register Chat Action Commands (P0 Fix #1)
  try {
    log('info', 'Registering chat action commands...');
    context.subscriptions.push(
      vscode.commands.registerCommand('rca-agent.applyFix', applyFixCommand),
      vscode.commands.registerCommand('rca-agent.explainMore', explainMoreCommand),
      vscode.commands.registerCommand('rca-agent.searchSimilar', searchSimilarCommand)
    );
    log('info', 'Chat action commands registered successfully');
  } catch (error) {
    log('error', 'Failed to register chat action commands', error);
  }

  // Initialize Advanced Error Detector (after webview registration)
  if (errorQueueManager) {
    advancedErrorDetector = AdvancedErrorDetector.getInstance(context, errorQueueManager);
    await advancedErrorDetector.startDetection();
    log('info', 'Advanced error detection started (terminal, build files)');
  }

  // Register Error Detection Commands
  try {
    log('info', 'Registering error detection commands...');
    context.subscriptions.push(
      vscode.commands.registerCommand('rca-agent.detectErrors', async () => {
        if (errorQueueManager) {
          await errorQueueManager.detectErrors();
          const errorCount = errorQueueManager.getErrorCount();
          vscode.window.showInformationMessage(`RCA Agent: Detected ${errorCount} errors in workspace`);
        }
      }),
      vscode.commands.registerCommand('rca-agent.showErrorQueue', async () => {
        if (errorQueueManager) {
          const errors = errorQueueManager.getAllErrors();
          const errorCount = errors.length;
          if (errorCount === 0) {
            vscode.window.showInformationMessage('RCA Agent: No errors detected. Try opening files with errors or running a build.');
          } else {
            const pending = errorQueueManager.getErrorsByStatus('pending').length;
            const analyzing = errorQueueManager.getErrorsByStatus('analyzing').length;
            const complete = errorQueueManager.getErrorsByStatus('complete').length;
            const failed = errorQueueManager.getErrorsByStatus('failed').length;
            vscode.window.showInformationMessage(
              `RCA Agent: ${errorCount} errors in queue\n` +
              `Pending: ${pending}, Analyzing: ${analyzing}, Complete: ${complete}, Failed: ${failed}`
            );
          }
        }
      }),
      vscode.commands.registerCommand('rca-agent.addManualError', async () => {
        const errorText = await vscode.window.showInputBox({
          prompt: 'Paste error message, stack trace, or build output',
          placeHolder: 'e.g., NullPointerException at MainActivity.kt:42',
          value: await vscode.env.clipboard.readText() // Pre-fill from clipboard
        });

        if (errorText && advancedErrorDetector) {
          await advancedErrorDetector.addManualError(errorText);
        }
      }),
      vscode.commands.registerCommand('rca-agent.captureTerminalErrors', async () => {
        if (advancedErrorDetector) {
          await advancedErrorDetector.captureActiveTerminalErrors();
        }
      }),
      // Diagnostic command to test end-to-end flow
      vscode.commands.registerCommand('rca-agent.testErrorFlow', async () => {
        if (!errorQueueManager) {
          vscode.window.showErrorMessage('ErrorQueueManager not initialized');
          return;
        }

        // Create a test error
        const testError = {
          id: `test-${Date.now()}`,
          timestamp: Date.now(),
          message: 'TEST ERROR: This is a diagnostic test error',
          type: 'runtime' as const,
          filePath: '/test/TestFile.kt',
          line: 42,
          column: 10,
          severity: 'error' as const,
          status: 'pending' as const,
          stackTrace: ['at TestFile.testMethod(TestFile.kt:42)', 'at TestRunner.main(TestRunner.kt:10)']
        };

        // Add to queue
        log('info', `[TEST] Adding test error: ${testError.id}`);
        errorQueueManager.addError(testError);

        // Check queue
        const allErrors = errorQueueManager.getAllErrors();
        const foundError = allErrors.find(e => e.id === testError.id);

        if (foundError) {
          vscode.window.showInformationMessage(
            `[OK] Test error added successfully!\n` +
            `ID: ${testError.id}\n` +
            `Total errors in queue: ${allErrors.length}\n` +
            `Check RCA Agent view to see if it displays.`
          );
        } else {
          vscode.window.showErrorMessage('[X] Test error was not added to queue');
        }
      })
    );
    log('info', 'Error detection commands registered successfully');
  } catch (error) {
    log('error', 'Failed to register error detection commands', error);
  }

  // Initialize tools (KEPT - Used by chat participant)
  try {
    log('info', 'Initializing tools...');
    initializeTools(context);
    log('info', 'Tools initialized successfully');
  } catch (error) {
    log('error', 'Failed to initialize tools', error);
  }

  // Initialize conversational agent and guided workflow (KEPT)
  try {
    conversationalAgent = new ConversationalAgent(analysisService, context);
    guidedWorkflow = new GuidedDebuggingWorkflow();

    // Register conversational debugging commands
    context.subscriptions.push(
      vscode.commands.registerCommand('rcaAgent.startConversation', async () => {
        vscode.window.showInformationMessage('Conversational debugging will be available after UI implementation.');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('rcaAgent.startGuidedDebugging', async () => {
        vscode.window.showInformationMessage('Guided debugging will be available after UI implementation.');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('rcaAgent.exportConversation', async () => {
        vscode.window.showInformationMessage('Conversation export will be available after UI implementation.');
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('rcaAgent.clearConversations', async () => {
        vscode.window.showInformationMessage('Clear conversations will be available after UI implementation.');
      })
    );

    log('info', 'Conversational agent and guided workflow initialized');
  } catch (error) {
    log('error', 'Failed to initialize conversational features', error);
  }

  // Show activation summary with error detection status
  const errorCount = errorQueueManager?.getErrorCount() || 0;
  const config = vscode.workspace.getConfiguration('rcaAgent');
  const autoDetect = config.get<boolean>('autoDetectErrors', true);

  log('info', `RCA Agent activated - Backend services ready. Detected ${errorCount} errors. Auto-detection: ${autoDetect ? 'enabled' : 'disabled'}`);

  if (autoDetect && errorCount > 0) {
    vscode.window.showInformationMessage(
      `RCA Agent: Detected ${errorCount} error${errorCount > 1 ? 's' : ''} in workspace. Open RCA panel to view.`
    );
  } else if (!autoDetect) {
    vscode.window.showWarningMessage(
      'RCA Agent: Auto-detection is disabled. Enable "rcaAgent.autoDetectErrors" in settings or run "RCA Agent: Detect Errors" command.'
    );
  }
}

/**
 * Initialize backend services
 * Sets up AnalysisService and FixApplicationService
 */
async function initializeBackendServices(context: vscode.ExtensionContext): Promise<void> {
  try {
    log('info', 'Initializing backend services...');

    // Initialize AnalysisService (singleton)
    analysisService = AnalysisService.getInstance();
    analysisService.setExtensionContext(context); // Set context for cloud LLM support
    await analysisService.initialize();
    log('info', 'AnalysisService initialized successfully');

    // Initialize FixApplicationService
    fixApplicationService = new FixApplicationService();
    log('info', 'FixApplicationService initialized successfully');

    log('info', 'Backend services initialization complete');
  } catch (error) {
    const err = error as Error;
    log('error', 'Failed to initialize backend services', err);
    vscode.window.showErrorMessage(
      `RCA Agent: Failed to initialize backend services: ${err.message}`
    );
  }
}

/**
 * Update status bar with current error count
 */
function updateStatusBar(): void {
  if (!statusBarItem || !errorQueueManager) {
    return;
  }

  const errorCount = errorQueueManager.getErrorCount();
  const pending = errorQueueManager.getErrorsByStatus('pending').length;
  const analyzing = errorQueueManager.getErrorsByStatus('analyzing').length;

  if (errorCount === 0) {
    statusBarItem.text = '$(check) RCA: No errors';
    statusBarItem.tooltip = 'No errors detected in workspace';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = `$(error) RCA: ${errorCount} error${errorCount > 1 ? 's' : ''}`;
    statusBarItem.tooltip = `${pending} pending, ${analyzing} analyzing\nClick to show error queue`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }

  statusBarItem.show();
}

/**
 * Called when extension is deactivated
 */
export function deactivate(): void {
  statusBarItem?.dispose();
  log('info', 'RCA Agent extension deactivated');
}

/**
 * Logging utility
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (outputChannel) {
    outputChannel.appendLine(logMessage);
    if (data) {
      outputChannel.appendLine(JSON.stringify(data, null, 2));
    }
  }

  if (level === 'error') {
    console.error(logMessage, data);
  } else if (level === 'warn') {
    console.warn(logMessage, data);
  } else {
    console.log(logMessage, data);
  }

  // Also log to debug channel for detailed debugging
  if (debugChannel) {
    debugChannel.appendLine(logMessage);
    if (data) {
      debugChannel.appendLine(JSON.stringify(data, null, 2));
    }
  }
}

// Export services for UI to use
export function getAnalysisService(): AnalysisService | undefined {
  return analysisService;
}

export function getFixApplicationService(): FixApplicationService | undefined {
  return fixApplicationService;
}

export function getErrorQueueManager(): ErrorQueueManager | undefined {
  return errorQueueManager;
}

export function getStateManager(): StateManager | undefined {
  return stateManager;
}

export function getExtensionContext(): vscode.ExtensionContext {
  return extensionContext;
}
