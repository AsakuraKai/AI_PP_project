/**
 * Chat Request Router - Detect user intent from chat messages
 * 
 * Analyzes user's message to determine what they want:
 * - Analyze error
 * - Fix error
 * - Explain error
 * - Build/Gradle issues
 * - Batch analyze multiple errors
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 2: Chat Participant UI
 * @week Week 1
 */

import * as vscode from 'vscode';

export interface ChatIntent {
  type: 'analyze-error' | 'explain-error' | 'fix-error' | 
        'build-issue' | 'batch-analyze' | 'general-question';
  errorContext?: ErrorContext;
  buildContext?: BuildContext;
}

export interface ErrorContext {
  file: string;
  line: number;
  message: string;
  diagnostics: vscode.Diagnostic[];
}

export interface BuildContext {
  terminalOutput: string;
  gradleVersion?: string;
  projectRoot: string;
}

export class ChatRequestRouter {
  /**
   * Route user's chat request to appropriate handler
   * 
   * @param request - User's chat request
   * @returns Intent with relevant context
   */
  async route(request: vscode.ChatRequest): Promise<ChatIntent> {
    const prompt = request.prompt.toLowerCase();
    
    // Detect intent from user message
    if (this.isAnalyzeIntent(prompt)) {
      return {
        type: 'analyze-error',
        errorContext: await this.getErrorContext()
      };
    }
    
    if (this.isExplainIntent(prompt)) {
      return {
        type: 'explain-error',
        errorContext: await this.getErrorContext()
      };
    }
    
    if (this.isFixIntent(prompt)) {
      return {
        type: 'fix-error',
        errorContext: await this.getErrorContext()
      };
    }
    
    if (this.isBuildIntent(prompt)) {
      return {
        type: 'build-issue',
        buildContext: await this.getBuildContext()
      };
    }
    
    if (this.isBatchIntent(prompt)) {
      return {
        type: 'batch-analyze',
        errorContext: await this.getAllErrors()
      };
    }
    
    return { type: 'general-question' };
  }
  
  private isAnalyzeIntent(prompt: string): boolean {
    return prompt.includes('analyze') || 
           prompt.includes('check') ||
           prompt.includes('what') ||
           prompt.includes('why');
  }
  
  private isExplainIntent(prompt: string): boolean {
    return prompt.includes('explain') || 
           prompt.includes('tell me') ||
           prompt.includes('how');
  }
  
  private isFixIntent(prompt: string): boolean {
    return prompt.includes('fix') || 
           prompt.includes('solve') ||
           prompt.includes('repair');
  }
  
  private isBuildIntent(prompt: string): boolean {
    return prompt.includes('build') || 
           prompt.includes('gradle') ||
           prompt.includes('compile');
  }
  
  private isBatchIntent(prompt: string): boolean {
    return prompt.includes('all errors') || 
           prompt.includes('batch') ||
           prompt.includes('multiple');
  }
  
  /**
   * Get error context from active editor
   */
  private async getErrorContext(): Promise<ErrorContext | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;
    
    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
    const errors = diagnostics.filter(
      d => d.severity === vscode.DiagnosticSeverity.Error
    );
    
    if (errors.length === 0) return undefined;
    
    const firstError = errors[0];
    return {
      file: editor.document.uri.fsPath,
      line: firstError.range.start.line + 1,
      message: firstError.message,
      diagnostics: errors
    };
  }
  
  /**
   * Get build context from workspace
   */
  private async getBuildContext(): Promise<BuildContext> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
    
    return {
      terminalOutput: '', // Will be populated by TerminalTool
      projectRoot: workspaceRoot
    };
  }
  
  /**
   * Get all errors in workspace (batch analyze)
   */
  private async getAllErrors(): Promise<ErrorContext | undefined> {
    const allDiagnostics: vscode.Diagnostic[] = [];
    
    for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
      const errors = diagnostics.filter(
        d => d.severity === vscode.DiagnosticSeverity.Error
      );
      allDiagnostics.push(...errors);
    }
    
    if (allDiagnostics.length === 0) return undefined;
    
    return {
      file: 'multiple',
      line: 0,
      message: `${allDiagnostics.length} errors found`,
      diagnostics: allDiagnostics
    };
  }
}
