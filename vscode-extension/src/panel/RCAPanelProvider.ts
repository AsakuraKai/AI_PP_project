/**
 * RCAPanelProvider - WebviewView provider for the RCA Agent panel
 * Chunk 2: Core Panel UI - Enhanced with webview content generation
 */

import * as vscode from 'vscode';
import { StateManager } from './StateManager';
import { WebviewMessage, ExtensionMessage, PanelState } from './types';
import { WebviewContentGenerator } from './webview-content';
import { AnalysisService } from '../services/AnalysisService';

/**
 * Provides the webview for the RCA Agent panel in the activity bar
 */
export class RCAPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'rca-agent.mainPanel';
  
  private _view?: vscode.WebviewView;
  private _stateManager: StateManager;
  private _analysisService: AnalysisService;
  
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._stateManager = StateManager.getInstance(_context);
    this._analysisService = AnalysisService.getInstance();
    
    // Listen for state changes and update webview
    this._stateManager.onStateChange(state => {
      this._updateWebview(state);
    });
  }
  
  /**
   * Called when the view is first shown
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    
    // Configure webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'resources'),
        vscode.Uri.joinPath(this._extensionUri, 'out')
      ]
    };
    
    // Set initial HTML content using WebviewContentGenerator
    const currentState = this._stateManager.getState();
    webviewView.webview.html = WebviewContentGenerator.getHtmlContent(
      webviewView.webview,
      this._extensionUri,
      currentState
    );
    
    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      message => this._handleMessage(message),
      null,
      this._context.subscriptions
    );
    
    // Send initial state to webview
    this._sendState();
    
    console.log('[RCAPanelProvider] Webview resolved with enhanced UI');
  }
  
  /**
   * Handle messages received from the webview
   */
  private async _handleMessage(message: WebviewMessage): Promise<void> {
    console.log('[RCAPanelProvider] Received message:', message.type);
    
    switch (message.type) {
      case 'analyze':
        await this._handleAnalyze(message.errorId);
        break;
        
      case 'analyzeNew':
        // Reset to empty state
        this._stateManager.setState({ view: 'empty' });
        break;
        
      case 'analyzeAll':
        // Will be implemented in Chunk 3
        vscode.window.showInformationMessage('Analyze all errors (Chunk 3)');
        break;
        
      case 'stop':
        this._handleStop();
        break;
        
      case 'refresh':
        this._sendState();
        break;
        
      case 'removeError':
        await this._stateManager.removeError(message.errorId);
        break;
        
      case 'reanalyze':
        // Get error from history and reanalyze
        const historyItem = this._stateManager.getHistoryItem(message.historyId);
        if (historyItem) {
          const error = this._stateManager.getError(historyItem.errorId);
          if (error) {
            await this._handleAnalyze(error.id);
          }
        }
        break;
        
      case 'feedback':
        await this._handleFeedback(message.value);
        break;
        
      case 'copy':
        await this._handleCopy(message.fixIndex);
        break;
        
      case 'checkConnection':
        await this._checkOllamaConnection();
        break;
        
      case 'installModel':
        await this._installModel();
        break;
        
      case 'viewLogs':
        vscode.commands.executeCommand('rcaAgent.viewLogs');
        break;
        
      case 'openDocs':
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo/docs'));
        break;
        
      case 'toggleEducational':
        vscode.commands.executeCommand('rcaAgent.toggleEducationalMode');
        break;
        
      case 'togglePerf':
        // Toggle performance metrics setting
        const config = vscode.workspace.getConfiguration('rcaAgent');
        const current = config.get<boolean>('showPerformanceMetrics', false);
        await config.update('showPerformanceMetrics', !current, true);
        vscode.window.showInformationMessage(`Performance metrics ${!current ? 'enabled' : 'disabled'}`);
        break;
        
      case 'clearCache':
        vscode.commands.executeCommand('rcaAgent.clearCache');
        break;
        
      case 'requestState':
        this._sendState();
        break;
        
      default:
        console.warn('[RCAPanelProvider] Unknown message type:', message);
    }
  }
  
  /**
   * Handle analyze error
   */
  private async _handleAnalyze(errorId?: string): Promise<void> {
    try {
      // Get error to analyze
      let error;
      if (errorId) {
        error = this._stateManager.getError(errorId);
      } else {
        // Get selected text from editor
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.selection || editor.selection.isEmpty) {
          vscode.window.showWarningMessage('Please select error text in the editor');
          return;
        }
        
        const selectedText = editor.document.getText(editor.selection);
        const filePath = editor.document.uri.fsPath;
        const line = editor.selection.start.line + 1;
        
        // Create new error item
        error = {
          id: `error-${Date.now()}`,
          message: selectedText,
          filePath,
          line,
          severity: 'high' as const,
          status: 'analyzing' as const,
          timestamp: Date.now()
        };
        
        // Add to queue
        await this._stateManager.addError(error);
      }
      
      if (!error) {
        vscode.window.showWarningMessage('No error to analyze');
        return;
      }
      
      // Update state to analyzing
      this._stateManager.setState({
        view: 'analyzing',
        currentError: error,
        progress: 0,
        currentIteration: 1,
        maxIterations: 3,
        currentThought: 'Starting analysis...',
        toolsUsed: [],
        elapsed: 0
      });
      
      // Run analysis
      const result = await this._analysisService.analyzeError(
        error,
        (progress) => {
          // Update progress in state
          this._stateManager.setState({
            view: 'analyzing',
            currentError: error,
            progress: progress.progress,
            currentIteration: progress.iteration,
            maxIterations: progress.maxIterations,
            currentThought: progress.currentThought,
            toolsUsed: progress.toolsUsed,
            elapsed: progress.elapsed
          });
        }
      );
      
      // Update error status
      error.status = 'complete';
      await this._stateManager.updateError(error);
      
      // Add to history
      await this._stateManager.addHistoryItem({
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        errorId: error.id,
        result,
        duration: result.latency || 0
      });
      
      // Update state to complete
      this._stateManager.setState({
        view: 'complete',
        result
      });
      
      vscode.window.showInformationMessage('Analysis complete!');
      
    } catch (error) {
      console.error('[RCAPanelProvider] Analysis failed:', error);
      
      const err = error as Error;
      
      // Check if it's an Ollama connection error
      if (err.message.includes('Ollama server unavailable')) {
        this._stateManager.setState({
          view: 'error',
          errorType: 'ollama-unavailable',
          errorMessage: err.message,
          ollamaUrl: vscode.workspace.getConfiguration('rcaAgent').get<string>('ollamaUrl', 'http://localhost:11434')
        });
      } else if (err.message.includes('Model') && err.message.includes('not found')) {
        this._stateManager.setState({
          view: 'error',
          errorType: 'model-not-found',
          errorMessage: err.message,
          modelName: vscode.workspace.getConfiguration('rcaAgent').get<string>('model', 'deepseek-r1')
        });
      } else {
        this._stateManager.setState({
          view: 'error',
          errorType: 'unknown',
          errorMessage: err.message
        });
      }
      
      vscode.window.showErrorMessage(`Analysis failed: ${err.message}`);
    }
  }
  
  /**
   * Handle stop analysis
   */
  private _handleStop(): void {
    this._analysisService.stopAnalysis();
    this._stateManager.setState({ view: 'empty' });
    vscode.window.showInformationMessage('Analysis stopped');
  }
  
  /**
   * Handle feedback
   */
  private async _handleFeedback(value: string): Promise<void> {
    if (value === 'custom') {
      const feedback = await vscode.window.showInputBox({
        prompt: 'Please provide your feedback',
        placeHolder: 'Enter your feedback here...'
      });
      
      if (feedback) {
        // TODO: Store feedback in database or send to analytics
        vscode.window.showInformationMessage('Thank you for your feedback!');
      }
    } else {
      // TODO: Store simple feedback (helpful/not-helpful)
      vscode.window.showInformationMessage(`Feedback recorded: ${value}`);
    }
  }
  
  /**
   * Handle copy fix
   */
  private async _handleCopy(fixIndex: string): Promise<void> {
    const state = this._stateManager.getState();
    if (state.result && state.result.fixGuidelines) {
      const fix = state.result.fixGuidelines[parseInt(fixIndex)];
      if (fix) {
        await vscode.env.clipboard.writeText(fix);
        vscode.window.showInformationMessage('Fix copied to clipboard');
      }
    }
  }
  
  /**
   * Check Ollama connection
   */
  private async _checkOllamaConnection(): Promise<void> {
    const result = await this._analysisService.checkOllamaConnection();
    if (result.available) {
      vscode.window.showInformationMessage('Ollama server is running');
      this._stateManager.setState({ view: 'empty' });
    } else {
      vscode.window.showErrorMessage(`Ollama server unavailable: ${result.error}`);
    }
  }
  
  /**
   * Install model
   */
  private async _installModel(): Promise<void> {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    const modelName = config.get<string>('model', 'deepseek-r1');
    
    const terminal = vscode.window.createTerminal('Ollama Install');
    terminal.show();
    terminal.sendText(`ollama pull ${modelName}`);
    
    vscode.window.showInformationMessage(`Installing model: ${modelName}. Check terminal for progress.`);
  }
  }
  
  /**
   * Send current state to webview (Chunk 2: regenerate HTML)
   */
  private _sendState(): void {
    if (!this._view) {
      return;
    }
    
    const state = this._stateManager.getState();
    
    // Regenerate HTML with current state
    this._view.webview.html = WebviewContentGenerator.getHtmlContent(
      this._view.webview,
      this._extensionUri,
      state
    );
    
    console.log('[RCAPanelProvider] Sent state update to webview');
  }
  
  /**
   * Update webview with new state (Chunk 2: regenerate HTML)
   */
  private _updateWebview(state: PanelState): void {
    if (!this._view) {
      return;
    }
    
    // Regenerate HTML with new state
    this._view.webview.html = WebviewContentGenerator.getHtmlContent(
      this._view.webview,
      this._extensionUri,
      state
    );
  }
}
