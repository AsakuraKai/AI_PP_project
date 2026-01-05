/**
 * Chat Action Commands - Handle button clicks from chat participant responses
 * Phase 2-3 Week 3 Implementation
 * 
 * Commands:
 * - rca-agent.applyFix: Apply suggested fix to codebase
 * - rca-agent.explainMore: Show detailed explanation
 * - rca-agent.searchSimilar: Search for similar issues
 */

import * as vscode from 'vscode';
import { RCAResult } from '../panel/types';

/**
 * Apply fix suggested by RCA analysis
 */
export async function applyFixCommand(result: RCAResult): Promise<void> {
  try {
    if (!result.fixGuidelines || result.fixGuidelines.length === 0) {
      vscode.window.showWarningMessage('No fix guidelines available for this error.');
      return;
    }

    // Show confirmation dialog
    const answer = await vscode.window.showInformationMessage(
      `Apply fix for: ${result.rootCause.substring(0, 100)}...?`,
      { modal: true },
      'Apply', 'Show Diff', 'Cancel'
    );

    if (answer === 'Cancel' || !answer) {
      return;
    }

    if (answer === 'Show Diff') {
      await showDiffPreview(result);
      return;
    }

    // Apply fix
    const success = await applyFix(result);

    if (success) {
      vscode.window.showInformationMessage('Fix applied successfully!');
      
      // Offer to run build
      const runBuild = await vscode.window.showInformationMessage(
        'Would you like to run a build to verify the fix?',
        'Run Build', 'Later'
      );

      if (runBuild === 'Run Build') {
        await vscode.commands.executeCommand('rca-agent.runGradleBuild');
      }
    } else {
      vscode.window.showErrorMessage('Failed to apply fix. Check the output for details.');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error applying fix: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Show detailed explanation of the error
 */
export async function explainMoreCommand(result: RCAResult): Promise<void> {
  try {
    const panel = vscode.window.createWebviewPanel(
      'rcaExplanation',
      'RCA Detailed Explanation',
      vscode.ViewColumn.Two,
      { enableScripts: false }
    );

    panel.webview.html = generateExplanationHTML(result);
  } catch (error) {
    vscode.window.showErrorMessage(`Error showing explanation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search for similar issues
 */
export async function searchSimilarCommand(result: RCAResult): Promise<void> {
  try {
    // Extract keywords from root cause
    const keywords = extractKeywords(result.rootCause);
    
    // Search workspace for similar errors
    const searchQuery = keywords.join(' OR ');
    
    // Trigger VS Code search
    await vscode.commands.executeCommand('workbench.action.findInFiles', {
      query: searchQuery,
      triggerSearch: true,
      isCaseSensitive: false
    });

    vscode.window.showInformationMessage(`Searching workspace for: ${keywords.join(', ')}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error searching: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Apply fix to codebase
 */
async function applyFix(result: RCAResult): Promise<boolean> {
  // For now, show fix guidelines in a new file
  // TODO: Implement actual code modification when FixGenerator provides diffs
  
  const doc = await vscode.workspace.openTextDocument({
    content: formatFixGuidelines(result),
    language: 'markdown'
  });

  await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.Beside
  });

  return true;
}

/**
 * Show diff preview before applying fix
 */
async function showDiffPreview(result: RCAResult): Promise<void> {
  // Create virtual documents for diff view
  const originalUri = vscode.Uri.parse('rca-diff:original.kt');
  const modifiedUri = vscode.Uri.parse('rca-diff:modified.kt');

  // Open diff view
  await vscode.commands.executeCommand(
    'vscode.diff',
    originalUri,
    modifiedUri,
    'Fix Preview'
  );
}

/**
 * Format fix guidelines as markdown
 */
function formatFixGuidelines(result: RCAResult): string {
  let content = `# Fix Guidelines\n\n`;
  content += `## Root Cause\n\n${result.rootCause}\n\n`;
  content += `## Confidence: ${Math.round(result.confidence)}%\n\n`;
  content += `## Steps to Fix\n\n`;

  result.fixGuidelines?.forEach((guideline, index) => {
    content += `${index + 1}. ${guideline}\n`;
  });

  content += `\n## Additional Context\n\n`;
  content += `- **File:** ${result.filePath || 'Unknown'}${result.line ? `:${result.line}` : ''}\n`;

  return content;
}

/**
 * Generate explanation HTML for webview
 */
function generateExplanationHTML(result: RCAResult): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RCA Explanation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      line-height: 1.6;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1 {
      color: var(--vscode-textLink-foreground);
      border-bottom: 2px solid var(--vscode-textLink-foreground);
      padding-bottom: 10px;
    }
    h2 {
      color: var(--vscode-textPreformat-foreground);
      margin-top: 30px;
    }
    .confidence {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 5px;
      background-color: ${result.confidence >= 0.8 ? '#4caf50' : result.confidence >= 0.5 ? '#ff9800' : '#f44336'};
      color: white;
      font-weight: bold;
    }
    .guideline {
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--vscode-textLink-foreground);
      padding: 15px;
      margin: 15px 0;
    }
    code {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
    }
  </style>
</head>
<body>
  <h1>Detailed Root Cause Analysis</h1>
  
  <h2>Root Cause</h2>
  <p>${result.rootCause}</p>
  
  <h2>Confidence Level</h2>
  <p><span class="confidence">${Math.round(result.confidence * 100)}%</span></p>
  
  <h2>Fix Guidelines</h2>
  ${result.fixGuidelines?.map((guideline, i) => `
    <div class="guideline">
      <strong>Step ${i + 1}:</strong> ${guideline}
    </div>
  `).join('') || '<p>No fix guidelines available.</p>'}
  
  <h2>Additional Context</h2>
  <ul>
    <li><strong>Confidence:</strong> ${result.confidence}%</li>
    <li><strong>Iterations:</strong> ${result.iterations}</li>
    <li><strong>Tools Used:</strong> ${result.toolsUsed?.join(', ') || 'N/A'}</li>
  </ul>
  
  <hr>
  <p><em>Generated by RCA Agent - Phase 2-3</em></p>
</body>
</html>
  `;
}

/**
 * Extract keywords from text for search
 */
function extractKeywords(text: string): string[] {
  // Remove common words and extract important terms
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Return top 5 most relevant words
  return [...new Set(words)].slice(0, 5);
}

/**
 * Register all chat action commands
 */
export function registerChatActionCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('rca-agent.applyFix', applyFixCommand),
    vscode.commands.registerCommand('rca-agent.explainMore', explainMoreCommand),
    vscode.commands.registerCommand('rca-agent.searchSimilar', searchSimilarCommand)
  );
}
