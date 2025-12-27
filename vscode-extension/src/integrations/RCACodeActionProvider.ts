/**
 * Code Action Provider for RCA Agent
 * Provides lightbulb quick actions for errors in the editor
 * 
 * Features:
 * - Shows "Analyze with RCA Agent" in quick fix menu
 * - Integrates with VS Code diagnostics
 * - Triggers panel analysis from inline context
 */

import * as vscode from 'vscode';

export class RCACodeActionProvider implements vscode.CodeActionProvider {
  private static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  /**
   * Provides code actions for diagnostics at the given range
   */
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] | undefined {
    const codeActions: vscode.CodeAction[] = [];

    // Check if there are any diagnostics (errors/warnings) in the context
    if (context.diagnostics.length === 0) {
      return undefined;
    }

    // Create code actions for each diagnostic
    for (const diagnostic of context.diagnostics) {
      // Only provide actions for errors and warnings
      if (
        diagnostic.severity === vscode.DiagnosticSeverity.Error ||
        diagnostic.severity === vscode.DiagnosticSeverity.Warning
      ) {
        const analyzeAction = this.createAnalyzeAction(document, diagnostic);
        codeActions.push(analyzeAction);

        // If RCA Agent previously analyzed this, add "View Previous Analysis" action
        const viewPreviousAction = this.createViewPreviousAction(document, diagnostic);
        if (viewPreviousAction) {
          codeActions.push(viewPreviousAction);
        }
      }
    }

    return codeActions.length > 0 ? codeActions : undefined;
  }

  /**
   * Creates the "Analyze with RCA Agent" quick fix action
   */
  private createAnalyzeAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '🤖 Analyze with RCA Agent',
      vscode.CodeActionKind.QuickFix
    );

    // Set the command to execute when user selects this action
    action.command = {
      command: 'rca-agent.analyzeFromDiagnostic',
      title: 'Analyze with RCA Agent',
      arguments: [document, diagnostic]
    };

    // Set diagnostics that this action will fix (for informational purposes)
    action.diagnostics = [diagnostic];

    // Mark as preferred action (appears at top of quick fix menu)
    action.isPreferred = false; // Set to true to make it the default action

    return action;
  }

  /**
   * Creates "View Previous Analysis" action if error was analyzed before
   */
  private createViewPreviousAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    // TODO: Check if this error was previously analyzed
    // For now, return undefined until history integration is complete
    return undefined;
  }

  /**
   * Returns the code action kinds this provider provides
   */
  public static getProvidedCodeActionKinds(): vscode.CodeActionKind[] {
    return RCACodeActionProvider.providedCodeActionKinds;
  }
}
