/**
 * Inline Integration Commands for RCA Agent
 * Handles commands triggered from inline editor integrations
 * 
 * Commands:
 * - analyzeFromDiagnostic: Analyze error from lightbulb quick action
 * - analyzeCurrentError: Analyze error at cursor position
 * - nextError: Navigate to next error
 * - previousError: Navigate to previous error
 */

import * as vscode from 'vscode';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';
import { ErrorItem } from '../panel/types';
import { RCAPanelProvider } from '../panel/RCAPanelProvider';

export class InlineIntegrationCommands {
  constructor(
    private errorQueueManager: ErrorQueueManager,
    private panelProvider: RCAPanelProvider
  ) {}

  /**
   * Register all inline integration commands
   */
  public register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'rca-agent.analyzeFromDiagnostic',
        this.analyzeFromDiagnostic.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.analyzeCurrentError',
        this.analyzeCurrentError.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.nextError',
        this.nextError.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.previousError',
        this.previousError.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.togglePanel',
        this.togglePanel.bind(this)
      ),
      // Phase 4: New commands for enhanced code actions
      vscode.commands.registerCommand(
        'rca-agent.explainError',
        this.explainError.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.viewPreviousAnalysis',
        this.viewPreviousAnalysis.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.searchImports',
        this.searchImports.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.checkInitialization',
        this.checkInitialization.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.suggestTypeConversion',
        this.suggestTypeConversion.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.searchDependency',
        this.searchDependency.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.checkVersionCompatibility',
        this.checkVersionCompatibility.bind(this)
      ),
      vscode.commands.registerCommand(
        'rca-agent.addPermission',
        this.addPermission.bind(this)
      )
    );
  }

  /**
   * Analyze error from diagnostic (lightbulb action)
   */
  private async analyzeFromDiagnostic(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): Promise<void> {
    // Create error item from diagnostic
    const errorItem: ErrorItem = {
      id: this.generateErrorId(document.uri, diagnostic),
      message: diagnostic.message,
      filePath: document.uri.fsPath,
      line: diagnostic.range.start.line,
      column: diagnostic.range.start.character,
      severity: this.mapSeverity(diagnostic.severity),
      status: 'pending',
      timestamp: Date.now()
    };

    // Check if error already exists in queue
    const existingError = this.errorQueueManager.getAllErrors().find(
      e => e.filePath === errorItem.filePath && 
           e.line === errorItem.line && 
           e.message === errorItem.message
    );

    if (existingError) {
      // Analyze existing error
      await vscode.commands.executeCommand('rca-agent.analyzeError', existingError.id);
    } else {
      // Add to queue and analyze
      this.errorQueueManager.addError(errorItem);
      await vscode.commands.executeCommand('rca-agent.analyzeError', errorItem.id);
    }

    // Show panel
    await vscode.commands.executeCommand('rca-agent.mainPanel.focus');
  }

  /**
   * Analyze error at current cursor position
   */
  private async analyzeCurrentError(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const position = editor.selection.active;
    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);

    // Find diagnostic at cursor position
    const diagnostic = diagnostics.find(d => d.range.contains(position));

    if (!diagnostic) {
      vscode.window.showInformationMessage('No error found at cursor position');
      return;
    }

    // Use analyzeFromDiagnostic to handle the analysis
    await this.analyzeFromDiagnostic(editor.document, diagnostic);
  }

  /**
   * Navigate to next error in workspace
   */
  private async nextError(): Promise<void> {
    const errors = this.errorQueueManager.getAllErrors();
    if (errors.length === 0) {
      vscode.window.showInformationMessage('No errors in queue');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      // No active editor, go to first error
      await this.navigateToError(errors[0]);
      return;
    }

    // Find next error after current position
    const currentPosition = editor.selection.active;
    const currentFile = editor.document.uri.fsPath;
    
    // Find errors in current file after current line
    const nextInFile = errors.find(
      e => e.filePath === currentFile && e.line > currentPosition.line
    );

    if (nextInFile) {
      await this.navigateToError(nextInFile);
      return;
    }

    // Find first error in next file
    const currentFileIndex = errors.findIndex(e => e.filePath === currentFile);
    const nextError = errors[currentFileIndex + 1] || errors[0];
    await this.navigateToError(nextError);
  }

  /**
   * Navigate to previous error in workspace
   */
  private async previousError(): Promise<void> {
    const errors = this.errorQueueManager.getAllErrors();
    if (errors.length === 0) {
      vscode.window.showInformationMessage('No errors in queue');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      // No active editor, go to last error
      await this.navigateToError(errors[errors.length - 1]);
      return;
    }

    // Find previous error before current position
    const currentPosition = editor.selection.active;
    const currentFile = editor.document.uri.fsPath;
    
    // Find errors in current file before current line (reverse search)
    const prevInFile = [...errors].reverse().find(
      e => e.filePath === currentFile && e.line < currentPosition.line
    );

    if (prevInFile) {
      await this.navigateToError(prevInFile);
      return;
    }

    // Find last error in previous file
    const currentFileIndex = errors.findIndex(e => e.filePath === currentFile);
    const prevError = errors[currentFileIndex - 1] || errors[errors.length - 1];
    await this.navigateToError(prevError);
  }

  /**
   * Navigate to specific error
   */
  private async navigateToError(error: ErrorItem): Promise<void> {
    const uri = vscode.Uri.file(error.filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    const position = new vscode.Position(error.line, error.column || 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );

    // Highlight the error briefly
    this.highlightError(editor, error);
  }

  /**
   * Briefly highlight error line
   */
  private highlightError(editor: vscode.TextEditor, error: ErrorItem): void {
    const decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
      isWholeLine: true
    });

    const range = new vscode.Range(
      new vscode.Position(error.line, 0),
      new vscode.Position(error.line, Number.MAX_VALUE)
    );

    editor.setDecorations(decorationType, [range]);

    // Remove highlight after 2 seconds
    setTimeout(() => {
      decorationType.dispose();
    }, 2000);
  }

  /**
   * Toggle panel visibility
   */
  private async togglePanel(): Promise<void> {
    await vscode.commands.executeCommand('rca-agent.mainPanel.focus');
  }

  /**
   * Generate error ID
   */
  private generateErrorId(uri: vscode.Uri, diagnostic: vscode.Diagnostic): string {
    const content = `${uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.message}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `error_${Math.abs(hash)}_${Date.now()}`;
  }

  /**
   * Map diagnostic severity
   */
  private mapSeverity(severity: vscode.DiagnosticSeverity | undefined): 'critical' | 'high' | 'medium' {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return 'critical';
      case vscode.DiagnosticSeverity.Warning:
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * PHASE 4: New command implementations
   */

  /**
   * Explain error in detail
   */
  private async explainError(message: string, filePath?: string, line?: number): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'rcaErrorExplanation',
      'Error Explanation',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = this.getExplanationHtml(message, filePath, line);
  }

  /**
   * View previous analysis for error
   */
  private async viewPreviousAnalysis(error: ErrorItem): Promise<void> {
    if (!error.analysisResult) {
      vscode.window.showWarningMessage('No previous analysis found for this error');
      return;
    }

    // Focus panel and navigate to this error
    await vscode.commands.executeCommand('rca-agent.mainPanel.focus');
    // Panel will show the analysis result
  }

  /**
   * Search for missing imports (Kotlin)
   */
  private async searchImports(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): Promise<void> {
    vscode.window.showInformationMessage(
      'Searching for imports... (This feature will use RCA Agent to suggest imports)',
      'Analyze with RCA'
    ).then(selection => {
      if (selection === 'Analyze with RCA') {
        this.analyzeFromDiagnostic(document, diagnostic);
      }
    });
  }

  /**
   * Check lateinit initialization flow
   */
  private async checkInitialization(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): Promise<void> {
    vscode.window.showInformationMessage(
      'Checking initialization flow... (RCA Agent will analyze the error)',
      'Analyze'
    ).then(selection => {
      if (selection === 'Analyze') {
        this.analyzeFromDiagnostic(document, diagnostic);
      }
    });
  }

  /**
   * Suggest type conversion
   */
  private async suggestTypeConversion(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): Promise<void> {
    vscode.window.showInformationMessage(
      'Suggesting type conversions... (RCA Agent will analyze)',
      'Analyze'
    ).then(selection => {
      if (selection === 'Analyze') {
        this.analyzeFromDiagnostic(document, diagnostic);
      }
    });
  }

  /**
   * Search for dependency in Maven Central
   */
  private async searchDependency(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): Promise<void> {
    vscode.window.showInformationMessage(
      'Searching Maven Central... (RCA Agent will find the dependency)',
      'Analyze'
    ).then(selection => {
      if (selection === 'Analyze') {
        this.analyzeFromDiagnostic(document, diagnostic);
      }
    });
  }

  /**
   * Check version compatibility
   */
  private async checkVersionCompatibility(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): Promise<void> {
    vscode.window.showInformationMessage(
      'Checking version compatibility... (RCA Agent will analyze)',
      'Analyze'
    ).then(selection => {
      if (selection === 'Analyze') {
        this.analyzeFromDiagnostic(document, diagnostic);
      }
    });
  }

  /**
   * Add missing permission to AndroidManifest.xml
   */
  private async addPermission(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): Promise<void> {
    vscode.window.showInformationMessage(
      'RCA Agent will suggest the permission to add',
      'Analyze'
    ).then(selection => {
      if (selection === 'Analyze') {
        this.analyzeFromDiagnostic(document, diagnostic);
      }
    });
  }

  /**
   * Generate HTML for error explanation
   */
  private getExplanationHtml(message: string, filePath?: string, line?: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
          h1 {
            color: var(--vscode-errorForeground);
          }
          .error-info {
            background: var(--vscode-textBlockQuote-background);
            padding: 15px;
            border-left: 3px solid var(--vscode-errorForeground);
            margin: 20px 0;
          }
          .location {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>Error Explanation</h1>
        <div class="error-info">
          <strong>Message:</strong> ${message}
          ${filePath ? `<div class="location">File: ${filePath}${line !== undefined ? `:${line + 1}` : ''}</div>` : ''}
        </div>
        <p>Use "Analyze with RCA Agent" for detailed root cause analysis and fix suggestions.</p>
      </body>
      </html>
    `;
  }
}
