/**
 * Code Action Provider for RCA Agent
 * Provides lightbulb quick actions for errors in the editor
 * CHUNK 9-10 Consolidation: Uses BaseProvider
 * 
 * Features:
 * - Shows "Analyze with RCA Agent" in quick fix menu
 * - Provides smart context-aware quick fixes
 * - Integrates with VS Code diagnostics
 * - Triggers panel analysis from inline context
 * - Offers multiple fix strategies
 */

import * as vscode from 'vscode';
import { BaseProvider } from './BaseProvider';
import { ErrorQueueManager } from '../panel/ErrorQueueManager';

export class RCACodeActionProvider extends BaseProvider implements vscode.CodeActionProvider {
  private static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor
  ];

  constructor(errorQueueManager?: ErrorQueueManager) {
    super({ errorQueueManager });
  }

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
      // Use BaseProvider's error checking
      if (this.isErrorOrWarning(diagnostic)) {
        // Primary action: Analyze with RCA Agent
        const analyzeAction = this.createAnalyzeAction(document, diagnostic);
        codeActions.push(analyzeAction);

        // Secondary action: Explain error in detail
        const explainAction = this.createExplainAction(document, diagnostic);
        codeActions.push(explainAction);

        // Check for previous analysis
        const viewPreviousAction = this.createViewPreviousAction(document, diagnostic);
        if (viewPreviousAction) {
          codeActions.push(viewPreviousAction);
        }

        // Context-specific quick fixes
        const contextActions = this.createContextSpecificActions(document, diagnostic, range);
        codeActions.push(...contextActions);
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
      '[AI] Analyze with RCA Agent',
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
    // Check if this error was previously analyzed
    if (!this.errorQueueManager) {
      return undefined;
    }

    const previousError = this.errorQueueManager.getAllErrors().find(error =>
      error.filePath === document.uri.fsPath &&
      error.line === diagnostic.range.start.line &&
      error.message === diagnostic.message &&
      error.analysisResult
    );

    if (!previousError) {
      return undefined;
    }

    const action = new vscode.CodeAction(
      'View Previous Analysis',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.viewPreviousAnalysis',
      title: 'View Previous Analysis',
      arguments: [previousError]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Creates "Explain Error" action for detailed explanation
   */
  private createExplainAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '📖 Explain This Error',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.explainError',
      title: 'Explain Error',
      arguments: [diagnostic.message, document.uri.fsPath, diagnostic.range.start.line]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Create context-specific quick fix actions
   */
  private createContextSpecificActions(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    range: vscode.Range | vscode.Selection
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const errorMessage = diagnostic.message.toLowerCase();

    // Kotlin-specific actions
    if (document.languageId === 'kotlin') {
      // Unresolved reference
      if (errorMessage.includes('unresolved reference')) {
        actions.push(this.createSearchImportsAction(document, diagnostic));
      }

      // Lateinit not initialized
      if (errorMessage.includes('lateinit') && errorMessage.includes('not')) {
        actions.push(this.createCheckInitializationAction(document, diagnostic));
      }

      // Type mismatch
      if (errorMessage.includes('type mismatch')) {
        actions.push(this.createFixTypeMismatchAction(document, diagnostic));
      }
    }

    // Gradle-specific actions
    if (document.uri.fsPath.includes('build.gradle') || 
        document.uri.fsPath.includes('.gradle.kts')) {
      if (errorMessage.includes('could not find') || errorMessage.includes('not found')) {
        actions.push(this.createSearchDependencyAction(document, diagnostic));
      }

      if (errorMessage.includes('version')) {
        actions.push(this.createCheckVersionCompatibilityAction(document, diagnostic));
      }
    }

    // XML/Android Manifest actions
    if (document.languageId === 'xml') {
      if (errorMessage.includes('permission')) {
        actions.push(this.createAddPermissionAction(document, diagnostic));
      }
    }

    return actions;
  }

  /**
   * Action: Search for missing imports
   */
  private createSearchImportsAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Search for Missing Import',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.searchImports',
      title: 'Search Imports',
      arguments: [document, diagnostic]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Action: Check lateinit initialization
   */
  private createCheckInitializationAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Check Initialization Flow',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.checkInitialization',
      title: 'Check Initialization',
      arguments: [document, diagnostic]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Action: Fix type mismatch
   */
  private createFixTypeMismatchAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Suggest Type Conversion',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.suggestTypeConversion',
      title: 'Suggest Type Conversion',
      arguments: [document, diagnostic]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Action: Search for dependency
   */
  private createSearchDependencyAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Search Maven Central',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.searchDependency',
      title: 'Search Dependency',
      arguments: [document, diagnostic]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Action: Check version compatibility
   */
  private createCheckVersionCompatibilityAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Check Version Compatibility',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.checkVersionCompatibility',
      title: 'Check Compatibility',
      arguments: [document, diagnostic]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Action: Add missing permission
   */
  private createAddPermissionAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      '➕ Add Missing Permission',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'rca-agent.addPermission',
      title: 'Add Permission',
      arguments: [document, diagnostic]
    };

    action.diagnostics = [diagnostic];
    return action;
  }

  /**
   * Returns the code action kinds this provider provides
   */
  public static getProvidedCodeActionKinds(): vscode.CodeActionKind[] {
    return RCACodeActionProvider.providedCodeActionKinds;
  }
}
