/**
 * Tool Initialization - Register all tools with the registry
 */

import * as vscode from 'vscode';
import { getToolRegistry } from './ToolRegistry';
import { ReadFileTool, WriteFileTool, EditFileTool, DeleteFileTool } from './FileOperationTool';
import { FindFilesTool, SearchInFilesTool, GetWorkspaceInfoTool, DetectGradleFilesTool } from './WorkspaceSearchTool';
import { TerminalTool } from './TerminalTool';
import { GradleCommandHelper } from './GradleCommandHelper';

/**
 * Initialize and register all tools
 */
export function initializeTools(context: vscode.ExtensionContext): void {
  const registry = getToolRegistry();

  // File operation tools
  registry.register(new ReadFileTool());
  registry.register(new WriteFileTool());
  registry.register(new EditFileTool());
  registry.register(new DeleteFileTool());

  // Workspace search tools
  registry.register(new FindFilesTool());
  registry.register(new SearchInFilesTool());
  registry.register(new GetWorkspaceInfoTool());
  registry.register(new DetectGradleFilesTool());

  // Terminal tools
  const terminalTool = new TerminalTool();
  terminalTool.initializeWatcher(); // Start watching terminal output
  registry.register(terminalTool);

  // Gradle tools (uses TerminalTool directly)
  registry.register(new GradleCommandHelper(terminalTool));

  // Cleanup on extension deactivation
  context.subscriptions.push({
    dispose: () => {
      registry.clearHistory();
    }
  });

  console.log(`✅ Registered ${registry.getAll().length} tools`);
}

/**
 * Get tool statistics for monitoring
 */
export function getToolStatistics() {
  return getToolRegistry().getStatistics();
}
