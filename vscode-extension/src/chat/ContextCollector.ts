/**
 * Context Collector - Gather workspace context for RCA analysis
 * 
 * Collects:
 * - Workspace structure (gradle files, kotlin files)
 * - Current errors (diagnostics)
 * - Terminal output (recent commands)
 * - Relevant files (open editors)
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 2: Chat Participant UI
 * @week Week 1
 */

import * as vscode from 'vscode';
import { ChatIntent } from './ChatRequestRouter';

export interface CollectedContext {
  workspace: WorkspaceContext;
  errors: ErrorInfo[];
  terminal: TerminalContext;
  files: FileContext[];
}

export interface WorkspaceContext {
  root: string;
  gradleFiles: string[];
  kotlinFiles: string[];
  buildFiles: string[];
}

export interface ErrorInfo {
  file: string;
  line: number;
  message: string;
  severity: string;
  source?: string;
}

export interface TerminalContext {
  recentOutput: string;
  lastCommand?: string;
}

export interface FileContext {
  path: string;
  content?: string;
  language: string;
}

import { TerminalTool } from '../tools/TerminalTool';

export class ContextCollector {
  private terminalTool: TerminalTool;

  constructor() {
    this.terminalTool = new TerminalTool();
  }

  /**
   * Collect all relevant context for RCA analysis
   */
  async collect(intent: ChatIntent): Promise<CollectedContext> {
    const workspace = await this.collectWorkspaceContext();
    const errors = await this.collectErrors(intent);
    const terminal = await this.collectTerminalContext();
    const files = await this.collectRelevantFiles(intent);

    return { workspace, errors, terminal, files };
  }

  /**
   * Collect workspace structure information
   */
  private async collectWorkspaceContext(): Promise<WorkspaceContext> {
    const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';

    // Find gradle files
    const gradleFiles = await vscode.workspace.findFiles(
      '{build.gradle,build.gradle.kts,settings.gradle,settings.gradle.kts,gradle/libs.versions.toml}',
      '**/node_modules/**'
    );

    // Find kotlin files (limit to 100 for performance)
    const kotlinFiles = await vscode.workspace.findFiles(
      '**/*.kt',
      '**/node_modules/**',
      100
    );

    // Find all build-related files
    const buildFiles = await vscode.workspace.findFiles(
      '{gradle.properties,local.properties,gradlew,gradlew.bat}',
      '**/node_modules/**'
    );

    return {
      root,
      gradleFiles: gradleFiles.map(f => f.fsPath),
      kotlinFiles: kotlinFiles.map(f => f.fsPath),
      buildFiles: buildFiles.map(f => f.fsPath)
    };
  }

  /**
   * Collect error information from VS Code diagnostics
   */
  private async collectErrors(intent: ChatIntent): Promise<ErrorInfo[]> {
    const errors: ErrorInfo[] = [];

    // Get errors from diagnostics
    for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
      for (const diagnostic of diagnostics) {
        if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
          errors.push({
            file: uri.fsPath,
            line: diagnostic.range.start.line + 1,
            message: diagnostic.message,
            severity: 'error',
            source: diagnostic.source
          });
        }
      }
    }

    // Limit to 50 most relevant errors to avoid overwhelming the LLM
    return errors.slice(0, 50);
  }

  /**
   * Collect terminal output context
   */
  private async collectTerminalContext(): Promise<TerminalContext> {
    // Get recent terminal command history
    const history = this.terminalTool.getCommandHistory();
    const recentOutput = history.slice(-10).join('\n'); // Last 10 commands

    return {
      recentOutput
    };
  }

  /**
   * Collect relevant file contents
   */
  private async collectRelevantFiles(intent: ChatIntent): Promise<FileContext[]> {
    const files: FileContext[] = [];

    // If analyzing error, get the error file
    if (intent.errorContext) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        files.push({
          path: editor.document.uri.fsPath,
          content: editor.document.getText(),
          language: editor.document.languageId
        });
      }
    }

    return files;
  }
}
