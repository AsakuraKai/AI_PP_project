/**
 * RCAPanelProvider - WebviewView provider for the RCA Agent panel
 * Chunk 1: Foundation & Activity Bar
 */

import * as vscode from 'vscode';
import { StateManager } from './StateManager';
import { WebviewMessage, ExtensionMessage, PanelState } from './types';

/**
 * Provides the webview for the RCA Agent panel in the activity bar
 */
export class RCAPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'rca-agent.mainPanel';
  
  private _view?: vscode.WebviewView;
  private _stateManager: StateManager;
  
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._stateManager = StateManager.getInstance(_context);
    
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
    
    // Set initial HTML content
    webviewView.webview.html = this._getHtmlContent(webviewView.webview);
    
    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      message => this._handleMessage(message),
      null,
      this._context.subscriptions
    );
    
    // Send initial state to webview
    this._sendState();
    
    console.log('[RCAPanelProvider] Webview resolved');
  }
  
  /**
   * Handle messages received from the webview
   */
  private async _handleMessage(message: WebviewMessage): Promise<void> {
    console.log('[RCAPanelProvider] Received message:', message.type);
    
    switch (message.type) {
      case 'analyze':
        // Will be implemented in Chunk 2
        vscode.window.showInformationMessage(`Analyze error: ${message.errorId} (Chunk 2)`);
        break;
        
      case 'analyzeAll':
        // Will be implemented in Chunk 3
        vscode.window.showInformationMessage('Analyze all errors (Chunk 3)');
        break;
        
      case 'stop':
        // Will be implemented in Chunk 2
        vscode.window.showInformationMessage('Stop analysis (Chunk 2)');
        break;
        
      case 'refresh':
        this._sendState();
        break;
        
      case 'removeError':
        await this._stateManager.removeError(message.errorId);
        break;
        
      case 'reanalyze':
        // Will be implemented in Chunk 2
        vscode.window.showInformationMessage(`Reanalyze: ${message.historyId} (Chunk 2)`);
        break;
        
      case 'feedback':
        // Will be implemented in Chunk 2
        vscode.window.showInformationMessage('Feedback received (Chunk 2)');
        break;
        
      case 'requestState':
        this._sendState();
        break;
        
      default:
        console.warn('[RCAPanelProvider] Unknown message type:', message);
    }
  }
  
  /**
   * Send current state to webview
   */
  private _sendState(): void {
    if (!this._view) {
      return;
    }
    
    const state = this._stateManager.getState();
    const message: ExtensionMessage = {
      type: 'stateUpdate',
      state
    };
    
    this._view.webview.postMessage(message);
    console.log('[RCAPanelProvider] Sent state update to webview');
  }
  
  /**
   * Update webview with new state
   */
  private _updateWebview(state: PanelState): void {
    if (!this._view) {
      return;
    }
    
    const message: ExtensionMessage = {
      type: 'stateUpdate',
      state
    };
    
    this._view.webview.postMessage(message);
  }
  
  /**
   * Generate HTML content for the webview
   */
  private _getHtmlContent(webview: vscode.Webview): string {
    // For Chunk 1, we just display a basic "Hello World" UI
    // Full UI will be implemented in Chunk 2
    
    const nonce = this._getNonce();
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <title>RCA Agent</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          font-size: var(--vscode-font-size);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
          margin: 0;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
        }
        
        h1 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--vscode-foreground);
        }
        
        .status {
          padding: 12px;
          border-radius: 4px;
          background-color: var(--vscode-textBlockQuote-background);
          border-left: 4px solid var(--vscode-textLink-foreground);
          margin-bottom: 16px;
        }
        
        .status-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .info {
          color: var(--vscode-descriptionForeground);
          font-size: 13px;
          line-height: 1.6;
        }
        
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 16px;
          border-radius: 2px;
          cursor: pointer;
          font-size: 13px;
          margin-right: 8px;
          margin-bottom: 8px;
        }
        
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        
        .checklist {
          list-style: none;
          padding: 0;
          margin: 16px 0;
        }
        
        .checklist li {
          padding: 8px 0;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .checklist li:before {
          content: "✓ ";
          color: var(--vscode-testing-iconPassed);
          font-weight: bold;
          margin-right: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 RCA Agent Panel</h1>
        
        <div class="status">
          <div class="status-icon">✅</div>
          <strong>Chunk 1: Foundation Complete!</strong>
          <div class="info">
            The panel infrastructure is now in place. This is the foundational layer
            for the new RCA Agent UI experience.
          </div>
        </div>
        
        <h2 style="font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Completed:</h2>
        <ul class="checklist">
          <li>Activity bar icon registered</li>
          <li>Panel provider implemented</li>
          <li>State management system created</li>
          <li>Type definitions established</li>
          <li>Command registration updated</li>
        </ul>
        
        <div class="info" style="margin-top: 24px;">
          <strong>Next Steps (Chunk 2):</strong><br>
          • Implement full panel UI with all 3 states<br>
          • Connect to backend analysis engine<br>
          • Add real-time progress tracking<br>
          • Integrate settings dropdown
        </div>
        
        <div style="margin-top: 24px;">
          <button onclick="testRefresh()">🔄 Refresh State</button>
          <button onclick="testAnalyze()">▶ Test Analyze</button>
        </div>
        
        <div id="state-display" style="margin-top: 16px; font-size: 11px; color: var(--vscode-descriptionForeground);"></div>
      </div>
      
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        function testRefresh() {
          vscode.postMessage({ type: 'requestState' });
        }
        
        function testAnalyze() {
          vscode.postMessage({ type: 'analyze', errorId: 'test-1' });
        }
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
          const message = event.data;
          console.log('Received message:', message.type);
          
          if (message.type === 'stateUpdate') {
            const stateDisplay = document.getElementById('state-display');
            stateDisplay.innerHTML = '<strong>Current State:</strong><br><pre>' + 
              JSON.stringify(message.state, null, 2) + '</pre>';
          }
        });
        
        // Request initial state
        vscode.postMessage({ type: 'requestState' });
      </script>
    </body>
    </html>`;
  }
  
  /**
   * Generate a random nonce for CSP
   */
  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
  /**
   * Public method to update analysis progress (for Chunk 2)
   */
  public updateProgress(iteration: number, thought: string, progress: number): void {
    if (!this._view) {
      return;
    }
    
    const message: ExtensionMessage = {
      type: 'progressUpdate',
      progress: {
        iteration,
        maxIterations: 3,
        progress,
        currentThought: thought
      }
    };
    
    this._view.webview.postMessage(message);
  }
  
  /**
   * Public method to show analysis result (for Chunk 2)
   */
  public showResult(result: any): void {
    if (!this._view) {
      return;
    }
    
    const message: ExtensionMessage = {
      type: 'analysisComplete',
      result
    };
    
    this._view.webview.postMessage(message);
  }
  
  /**
   * Public method to show error (for Chunk 2)
   */
  public showError(error: string): void {
    if (!this._view) {
      return;
    }
    
    const message: ExtensionMessage = {
      type: 'analysisError',
      error
    };
    
    this._view.webview.postMessage(message);
  }
}
