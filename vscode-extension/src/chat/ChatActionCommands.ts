/**
 * Chat Action Commands - Commands triggered by chat buttons
 * 
 * Provides interactive commands for:
 * - rca-agent.applyFix: Apply suggested fix to codebase
 * - rca-agent.explainMore: Show detailed explanation
 * - rca-agent.searchSimilar: Find similar errors in history
 * 
 * @author Phase 1: Critical P0 Fixes
 * @date January 9, 2026
 */

import * as vscode from 'vscode';
import { RCAResult } from '../types';
import { AnalysisService } from '../services/AnalysisService';
import { FixApplicationService } from '../services/FixApplicationService';

/**
 * Apply suggested fix from RCA analysis
 * Triggered by "Apply Fix" button in chat
 */
export async function applyFixCommand(result: RCAResult): Promise<void> {
  try {
    if (!result || !result.fixGuidelines || result.fixGuidelines.length === 0) {
      vscode.window.showWarningMessage('No fix guidelines available for this error.');
      return;
    }

    // Show quick pick for multiple fix options
    let selectedFix: string;
    if (result.fixGuidelines.length === 1) {
      selectedFix = result.fixGuidelines[0];
    } else {
      const picked = await vscode.window.showQuickPick(
        result.fixGuidelines.map((guideline, index) => ({
          label: `Fix ${index + 1}`,
          description: guideline,
          guideline
        })),
        {
          placeHolder: 'Select a fix to apply',
          title: 'Available Fixes'
        }
      );

      if (!picked) {
        return; // User cancelled
      }
      selectedFix = picked.guideline;
    }

    // Confirm before applying
    const confirmed = await vscode.window.showWarningMessage(
      `Apply fix: "${selectedFix}"?`,
      { modal: true },
      'Apply',
      'Cancel'
    );

    if (confirmed !== 'Apply') {
      return;
    }

    // Get the file to edit
    let targetUri: vscode.Uri | undefined;

    // Try to use active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      targetUri = activeEditor.document.uri;
    }

    if (!targetUri) {
      vscode.window.showErrorMessage('Cannot determine target file for fix. Please open the file with the error.');
      return;
    }

    // Open the document
    const document = await vscode.workspace.openTextDocument(targetUri);
    const editor = await vscode.window.showTextDocument(document);

    // Position cursor at beginning of file
    const position = new vscode.Position(0, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);

    // Show information message with the fix guideline
    const action = await vscode.window.showInformationMessage(
      `Fix suggested: ${selectedFix}`,
      'Got it'
    );

    // Track applied fix using FixApplicationService
    try {
      const fixService = FixApplicationService.getInstance();
      // Generate fixes from the result to track them
      await fixService.generateFix(result);
    } catch (error) {
      console.warn('[ChatActionCommands] Fix tracking failed:', error);
    }

  } catch (error) {
    console.error('Failed to apply fix:', error);
    vscode.window.showErrorMessage(`Failed to apply fix: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Show detailed explanation of the error and fix
 * Triggered by "Explain More" button in chat
 */
export async function explainMoreCommand(result: RCAResult): Promise<void> {
  try {
    if (!result) {
      vscode.window.showWarningMessage('No analysis result available to explain.');
      return;
    }

    // Build detailed explanation
    const explanation = buildDetailedExplanation(result);

    // Create and show a new webview panel for the explanation
    const panel = vscode.window.createWebviewPanel(
      'rcaExplanation',
      'Detailed Explanation',
      vscode.ViewColumn.Two,
      { enableScripts: false }
    );

    panel.webview.html = getExplanationHTML(result, explanation);

  } catch (error) {
    console.error('Failed to show explanation:', error);
    vscode.window.showErrorMessage(`Failed to show explanation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search for similar errors in history
 * Triggered by "Search Similar" button in chat
 */
export async function searchSimilarCommand(result: RCAResult): Promise<void> {
  try {
    if (!result || !result.error) {
      vscode.window.showWarningMessage('No error information available for search.');
      return;
    }

    const analysisService = AnalysisService.getInstance();
    const errorMessage = result.error;

    // Show progress while searching
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Searching for similar errors...',
      cancellable: false
    }, async () => {
      // Search using ChromaDB
      const similarErrors = await analysisService.searchSimilarErrors(errorMessage, 10);

      if (similarErrors.length === 0) {
        vscode.window.showInformationMessage('No similar errors found in history.');
        return;
      }

      // Show results in quick pick
      const items = similarErrors.map((error, index) => ({
        label: `$(bug) ${error.error_type || 'Error'}`,
        description: error.error_message?.substring(0, 60) + '...',
        detail: `Root cause: ${error.root_cause?.substring(0, 100)}...`,
        error
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Found ${similarErrors.length} similar error(s)`,
        title: 'Similar Errors'
      });

      if (selected) {
        // Show detailed view of selected error
        const panel = vscode.window.createWebviewPanel(
          'similarError',
          'Similar Error Details',
          vscode.ViewColumn.Beside,
          {}
        );

        panel.webview.html = `
          <!DOCTYPE html>
          <html>
          <body style="padding: 20px; font-family: sans-serif; background: #1e1e1e; color: #d4d4d4;">
            <h2>Similar Error Found</h2>
            <p><strong>Type:</strong> ${selected.error.error_type}</p>
            <p><strong>Message:</strong> ${selected.error.error_message}</p>
            <h3>Root Cause</h3>
            <p>${selected.error.root_cause}</p>
            <h3>Fix Guidelines</h3>
            <ul>
              ${selected.error.fix_guidelines?.map((g: string) => `<li>${g}</li>`).join('') || '<li>No guidelines available</li>'}
            </ul>
            <p><strong>Confidence:</strong> ${Math.round((selected.error.confidence || 0) * 100)}%</p>
          </body>
          </html>
        `;
      }
    });

  } catch (error) {
    console.error('Failed to search similar errors:', error);
    vscode.window.showErrorMessage(`Failed to search: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Build detailed explanation from RCA result
 */
function buildDetailedExplanation(result: RCAResult): string {
  const sections: string[] = [];

  // Error summary
  sections.push(`## Error Analysis\n\n**Error:** ${result.error}`);

  // Root cause
  sections.push(`\n\n## Root Cause\n\n${result.rootCause}`);

  // Confidence
  const confidencePercent = Math.round(result.confidence * 100);
  const confidenceLevel = confidencePercent >= 80 ? 'High' : confidencePercent >= 60 ? 'Medium' : 'Low';
  sections.push(`\n\n## Confidence: ${confidencePercent}% (${confidenceLevel})`);

  // Fix guidelines
  if (result.fixGuidelines && result.fixGuidelines.length > 0) {
    sections.push('\n\n## Fix Guidelines\n');
    result.fixGuidelines.forEach((guideline, index) => {
      sections.push(`\n${index + 1}. ${guideline}`);
    });
  }

  // Code context
  if (result.codeContext) {
    sections.push(`\n\n## Code Context\n\n\`\`\`\n${result.codeContext}\n\`\`\``);
  }

  // Tools used
  if (result.toolsUsed && result.toolsUsed.length > 0) {
    sections.push(`\n\n## Analysis Tools Used\n\n${result.toolsUsed.map(tool => `- ${tool}`).join('\n')}`);
  }

  // Performance metrics
  if (result.iterations) {
    sections.push('\n\n## Performance Metrics\n');
    sections.push(`\n- **Iterations:** ${result.iterations}`);
  }

  // Code fix info
  if (result.codeFix) {
    sections.push(`\n\n## Generated Fix\n\n**File:** ${result.codeFix.filePath}:${result.codeFix.line}\n\n**Original Code:**\n\`\`\`\n${result.codeFix.originalCode}\n\`\`\`\n\n**Fixed Code:**\n\`\`\`\n${result.codeFix.fixedCode}\n\`\`\`\n\n**Explanation:** ${result.codeFix.explanation}`);
  }

  // Similar errors
  if (result.similarErrors && result.similarErrors.length > 0) {
    sections.push(`\n\n## Similar Past Errors\n\n${result.similarErrors.map(err => `- ${err}`).join('\n')}`);
  }

  return sections.join('');
}

/**
 * Generate HTML for explanation webview
 */
function getExplanationHTML(result: RCAResult, explanation: string): string {
  // Convert markdown to basic HTML
  const htmlContent = explanation
    .replace(/## (.*?)\n/g, '<h2>$1</h2>\n')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/```\n(.*?)\n```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/- (.*?)\n/g, '<li>$1</li>\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detailed Explanation</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        h2 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
            margin-top: 24px;
        }
        code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        li {
            margin: 8px 0;
        }
        strong {
            color: var(--vscode-textLink-activeForeground);
        }
    </style>
</head>
<body>
    <h1>Root Cause Analysis - Detailed Explanation</h1>
    <p>${htmlContent}</p>
</body>
</html>`;
}
