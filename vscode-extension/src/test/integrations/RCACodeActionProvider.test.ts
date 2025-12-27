/**
 * Tests for RCACodeActionProvider
 * Verifies lightbulb quick actions functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { RCACodeActionProvider } from '../../integrations/RCACodeActionProvider';

suite('RCACodeActionProvider Tests', () => {
  let provider: RCACodeActionProvider;

  setup(() => {
    provider = new RCACodeActionProvider();
  });

  test('Should provide code action for error diagnostic', () => {
    const document = createMockDocument();
    const diagnostic = createMockDiagnostic(vscode.DiagnosticSeverity.Error);
    const context = createMockContext([diagnostic]);
    const range = new vscode.Range(0, 0, 0, 10);

    const actions = provider.provideCodeActions(document, range, context, {} as vscode.CancellationToken);

    assert.ok(actions, 'Should return code actions');
    assert.strictEqual(actions!.length, 1, 'Should have one action');
    assert.strictEqual(actions![0].title, '🤖 Analyze with RCA Agent');
  });

  test('Should provide code action for warning diagnostic', () => {
    const document = createMockDocument();
    const diagnostic = createMockDiagnostic(vscode.DiagnosticSeverity.Warning);
    const context = createMockContext([diagnostic]);
    const range = new vscode.Range(0, 0, 0, 10);

    const actions = provider.provideCodeActions(document, range, context, {} as vscode.CancellationToken);

    assert.ok(actions, 'Should return code actions');
    assert.strictEqual(actions!.length, 1, 'Should have one action for warning');
  });

  test('Should not provide code action for information diagnostic', () => {
    const document = createMockDocument();
    const diagnostic = createMockDiagnostic(vscode.DiagnosticSeverity.Information);
    const context = createMockContext([diagnostic]);
    const range = new vscode.Range(0, 0, 0, 10);

    const actions = provider.provideCodeActions(document, range, context, {} as vscode.CancellationToken);

    assert.strictEqual(actions, undefined, 'Should not provide actions for info diagnostics');
  });

  test('Should not provide code action when no diagnostics', () => {
    const document = createMockDocument();
    const context = createMockContext([]);
    const range = new vscode.Range(0, 0, 0, 10);

    const actions = provider.provideCodeActions(document, range, context, {} as vscode.CancellationToken);

    assert.strictEqual(actions, undefined, 'Should not provide actions without diagnostics');
  });

  test('Code action should have correct command', () => {
    const document = createMockDocument();
    const diagnostic = createMockDiagnostic(vscode.DiagnosticSeverity.Error);
    const context = createMockContext([diagnostic]);
    const range = new vscode.Range(0, 0, 0, 10);

    const actions = provider.provideCodeActions(document, range, context, {} as vscode.CancellationToken);

    assert.ok(actions![0].command, 'Action should have a command');
    assert.strictEqual(actions![0].command!.command, 'rca-agent.analyzeFromDiagnostic');
    assert.strictEqual(actions![0].command!.arguments!.length, 2);
  });

  test('Code action should be QuickFix kind', () => {
    const document = createMockDocument();
    const diagnostic = createMockDiagnostic(vscode.DiagnosticSeverity.Error);
    const context = createMockContext([diagnostic]);
    const range = new vscode.Range(0, 0, 0, 10);

    const actions = provider.provideCodeActions(document, range, context, {} as vscode.CancellationToken);

    assert.strictEqual(actions![0].kind?.value, vscode.CodeActionKind.QuickFix.value);
  });

  test('Should handle multiple diagnostics', () => {
    const document = createMockDocument();
    const diagnostic1 = createMockDiagnostic(vscode.DiagnosticSeverity.Error);
    const diagnostic2 = createMockDiagnostic(vscode.DiagnosticSeverity.Warning);
    const context = createMockContext([diagnostic1, diagnostic2]);
    const range = new vscode.Range(0, 0, 0, 10);

    const actions = provider.provideCodeActions(document, range, context, {} as vscode.CancellationToken);

    assert.ok(actions, 'Should return code actions');
    assert.strictEqual(actions!.length, 2, 'Should have two actions for two diagnostics');
  });

  // Helper functions
  function createMockDocument(): vscode.TextDocument {
    return {
      uri: vscode.Uri.file('/test/file.kt'),
      fileName: '/test/file.kt',
      getText: () => 'val x = null',
      lineAt: () => ({ text: 'val x = null' } as any)
    } as vscode.TextDocument;
  }

  function createMockDiagnostic(severity: vscode.DiagnosticSeverity): vscode.Diagnostic {
    const range = new vscode.Range(0, 0, 0, 10);
    return new vscode.Diagnostic(range, 'Test error', severity);
  }

  function createMockContext(diagnostics: vscode.Diagnostic[]): vscode.CodeActionContext {
    return {
      diagnostics,
      only: undefined,
      triggerKind: vscode.CodeActionTriggerKind.Automatic
    };
  }
});
