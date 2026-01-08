// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// Backend service imports (KEPT - UI will wire to these)
import { AnalysisService } from './services/AnalysisService';
import { FixApplicationService } from './services/FixApplicationService';

// Chat Participant imports (KEPT - Not UI related)
import { registerChatParticipant } from './chat/RCAChatParticipant';
import { initializeTools } from './tools';
import { ConversationalAgent } from './chat/ConversationalAgent';
import { GuidedDebuggingWorkflow } from './chat/GuidedDebuggingWorkflow';

// ============================================================================
// NOTE: All UI components have been removed
// See docs/RCA_UI_WIRING_GUIDE.md for future UI implementation
// Backend services (AnalysisService, FixApplicationService) remain available
// ============================================================================

// Global state
let outputChannel: vscode.OutputChannel;
let debugChannel: vscode.OutputChannel;
let extensionContext: vscode.ExtensionContext;

// Backend service instances (KEPT - UI will use these)
let analysisService: AnalysisService | undefined;
let fixApplicationService: FixApplicationService | undefined;

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
  
  // Initialize backend services (KEPT - UI will use these)
  await initializeBackendServices(context);
  
  // Initialize chat participant (KEPT - Not UI related)
  try {
    log('info', 'Registering chat participant...');
    await registerChatParticipant(context);
    log('info', 'Chat participant registered successfully');
  } catch (error) {
    log('error', 'Failed to register chat participant', error);
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
  
  log('info', 'RCA Agent activated - Backend services ready');
  vscode.window.showInformationMessage(
    'RCA Agent activated! Backend services available. UI components removed - see docs/RCA_UI_WIRING_GUIDE.md for implementation guide.'
  );
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
 * Called when extension is deactivated
 */
export function deactivate(): void {
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

export function getExtensionContext(): vscode.ExtensionContext {
  return extensionContext;
}
