/**
 * AdvancedErrorDetector - Multi-source error detection for Android/Kotlin projects
 * 
 * Detection Sources:
 * 1. VS Code Diagnostics (lint, syntax) - Already working
 * 2. Terminal Output (gradle build, logcat, tests)
 * 3. Build Output Files (build/outputs/*.log)
 * 4. Manual Input (user paste)
 * 5. Active Terminal Content
 * 
 * This complements ErrorQueueManager with additional detection methods
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ErrorItem } from '../types';
import { ErrorQueueManager } from './ErrorQueueManager';

export interface TerminalOutputError {
  message: string;
  file?: string;
  line?: number;
  type: 'gradle' | 'kotlin' | 'test' | 'runtime' | 'unknown';
  fullOutput: string;
}

/**
 * Advanced Error Detector
 * Extends error detection beyond VS Code diagnostics
 */
export class AdvancedErrorDetector {
  private static _instance: AdvancedErrorDetector;
  private _disposables: vscode.Disposable[] = [];
  private _terminalWatcher?: vscode.Disposable;
  private _buildFileWatcher?: vscode.FileSystemWatcher;
  private _lastTerminalText: string = '';

  private constructor(
    private context: vscode.ExtensionContext,
    private errorQueueManager: ErrorQueueManager
  ) {
    console.log('[AdvancedErrorDetector] Initializing...');
  }

  static getInstance(
    context: vscode.ExtensionContext,
    errorQueueManager: ErrorQueueManager
  ): AdvancedErrorDetector {
    if (!AdvancedErrorDetector._instance) {
      AdvancedErrorDetector._instance = new AdvancedErrorDetector(context, errorQueueManager);
    }
    return AdvancedErrorDetector._instance;
  }

  /**
   * Start all detection methods
   */
  async startDetection(): Promise<void> {
    const config = vscode.workspace.getConfiguration('rcaAgent');
    
    // 1. Watch terminal output (always enabled)
    this.watchTerminalOutput();
    
    // 2. Watch build output files
    if (config.get<boolean>('watchBuildFiles', true)) {
      this.watchBuildFiles();
    }
    
    // 3. Register terminal close handler to capture final output
    this._disposables.push(
      vscode.window.onDidCloseTerminal(terminal => {
        this.captureTerminalOnClose(terminal);
      })
    );

    console.log('[AdvancedErrorDetector] All detection methods started');
  }

  /**
   * Watch terminal output for errors
   * Monitors active terminal and detects error patterns
   */
  private watchTerminalOutput(): void {
    // Register command to manually capture terminal output
    const captureCommand = vscode.commands.registerCommand(
      'rca-agent.captureTerminalErrors',
      async () => {
        await this.captureActiveTerminalErrors();
      }
    );

    this._disposables.push(captureCommand);
    console.log('[AdvancedErrorDetector] Terminal monitoring active');
  }

  /**
   * Capture errors from active terminal
   */
  async captureActiveTerminalErrors(): Promise<void> {
    const activeTerminal = vscode.window.activeTerminal;
    
    if (!activeTerminal) {
      vscode.window.showWarningMessage('No active terminal. Run a command first.');
      return;
    }

    // Prompt user to select text containing errors
    const selection = await vscode.window.showInformationMessage(
      'Select error text in terminal, then click "Parse"',
      'Parse', 'Cancel'
    );

    if (selection !== 'Parse') {
      return;
    }

    // Get terminal text from clipboard (user must copy it)
    const clipboardText = await vscode.env.clipboard.readText();
    
    if (!clipboardText || clipboardText.length < 10) {
      vscode.window.showWarningMessage('No text found in clipboard. Copy terminal output first.');
      return;
    }

    await this.parseTerminalOutput(clipboardText);
  }

  /**
   * Parse terminal output for errors
   */
  private async parseTerminalOutput(output: string): Promise<void> {
    const errors = this.extractErrorsFromOutput(output);
    
    console.log(`[AdvancedErrorDetector] Found ${errors.length} errors in terminal output`);
    
    for (const error of errors) {
      const errorItem: ErrorItem = {
        id: this.generateId(error.message),
        timestamp: Date.now(),
        message: error.message,
        type: this.mapErrorType(error.type),
        filePath: error.file || 'unknown',
        line: error.line || 0,
        severity: 'error',
        status: 'pending',
        stackTrace: [error.fullOutput],
        metadata: {
          source: 'terminal',
          detectionMethod: 'terminal-capture'
        }
      };

      await this.errorQueueManager.addError(errorItem);
    }

    if (errors.length > 0) {
      vscode.window.showInformationMessage(
        `Detected ${errors.length} error(s) from terminal output`
      );
    } else {
      vscode.window.showInformationMessage('No errors detected in terminal output');
    }
  }

  /**
   * Extract errors from terminal output
   */
  private extractErrorsFromOutput(output: string): TerminalOutputError[] {
    const errors: TerminalOutputError[] = [];
    const lines = output.split('\n');

    // Pattern 1: Gradle build errors
    // e.g., "Execution failed for task ':app:compileDebugKotlin'"
    const gradleTaskPattern = /Execution failed for task '(.+)'/;
    
    // Pattern 2: Kotlin compilation errors
    // e.g., "e: file:///path/File.kt:42:5 Unresolved reference: foo"
    const kotlinErrorPattern = /e: (?:file:\/\/\/)?(.+\.kt):(\d+):(\d+) (.+)/;
    
    // Pattern 3: Java compilation errors
    // e.g., "/path/File.java:42: error: cannot find symbol"
    const javaErrorPattern = /(.+\.java):(\d+): error: (.+)/;
    
    // Pattern 4: Test failures
    // e.g., "FAILED: testSomething()"
    const testFailurePattern = /FAILED: (.+)/;
    
    // Pattern 5: Exception stack traces
    // e.g., "java.lang.NullPointerException: Cannot invoke"
    const exceptionPattern = /([\w.]+Exception): (.+)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check Gradle task failure
      const gradleMatch = line.match(gradleTaskPattern);
      if (gradleMatch) {
        // Look ahead for actual error message
        let errorMessage = gradleMatch[1];
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes('* What went wrong') || lines[j].includes('> ')) {
            errorMessage = lines[j].trim();
            break;
          }
        }
        
        errors.push({
          message: `Gradle task failed: ${errorMessage}`,
          type: 'gradle',
          fullOutput: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 10)).join('\n')
        });
        continue;
      }

      // Check Kotlin error
      const kotlinMatch = line.match(kotlinErrorPattern);
      if (kotlinMatch) {
        errors.push({
          message: kotlinMatch[4],
          file: kotlinMatch[1],
          line: parseInt(kotlinMatch[2]),
          type: 'kotlin',
          fullOutput: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 5)).join('\n')
        });
        continue;
      }

      // Check Java error
      const javaMatch = line.match(javaErrorPattern);
      if (javaMatch) {
        errors.push({
          message: javaMatch[3],
          file: javaMatch[1],
          line: parseInt(javaMatch[2]),
          type: 'kotlin', // Map to kotlin for processing
          fullOutput: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 5)).join('\n')
        });
        continue;
      }

      // Check test failure
      const testMatch = line.match(testFailurePattern);
      if (testMatch) {
        errors.push({
          message: `Test failed: ${testMatch[1]}`,
          type: 'test',
          fullOutput: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 10)).join('\n')
        });
        continue;
      }

      // Check exception
      const exceptionMatch = line.match(exceptionPattern);
      if (exceptionMatch) {
        errors.push({
          message: `${exceptionMatch[1]}: ${exceptionMatch[2]}`,
          type: 'runtime',
          fullOutput: lines.slice(Math.max(0, i), Math.min(lines.length, i + 20)).join('\n')
        });
        continue;
      }
    }

    return errors;
  }

  /**
   * Watch build output files for errors
   */
  private watchBuildFiles(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    // Watch build/outputs/**/*.log files
    this._buildFileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolders[0], 'build/outputs/**/*.log')
    );

    this._buildFileWatcher.onDidChange(async (uri) => {
      console.log(`[AdvancedErrorDetector] Build log changed: ${uri.fsPath}`);
      await this.parseBuildLog(uri);
    });

    this._buildFileWatcher.onDidCreate(async (uri) => {
      console.log(`[AdvancedErrorDetector] New build log: ${uri.fsPath}`);
      await this.parseBuildLog(uri);
    });

    this._disposables.push(this._buildFileWatcher);
    console.log('[AdvancedErrorDetector] Build file watcher active');
  }

  /**
   * Parse build log file for errors
   */
  private async parseBuildLog(uri: vscode.Uri): Promise<void> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(content).toString('utf8');
      
      await this.parseTerminalOutput(text);
    } catch (error) {
      console.error('[AdvancedErrorDetector] Failed to parse build log:', error);
    }
  }

  /**
   * Capture terminal content when closed
   * (Placeholder - VS Code API doesn't expose terminal content directly)
   */
  private captureTerminalOnClose(terminal: vscode.Terminal): void {
    // VS Code API limitation: Cannot directly access terminal content
    // User must manually copy-paste or we rely on build logs
    console.log(`[AdvancedErrorDetector] Terminal closed: ${terminal.name}`);
  }

  /**
   * Add manual error from user input
   */
  async addManualError(errorText: string, filePath?: string): Promise<void> {
    const errors = this.extractErrorsFromOutput(errorText);
    
    if (errors.length === 0) {
      // Treat entire input as single error
      const errorItem: ErrorItem = {
        id: this.generateId(errorText),
        timestamp: Date.now(),
        message: errorText,
        type: 'runtime',
        filePath: filePath || 'unknown',
        line: 0,
        severity: 'error',
        status: 'pending',
        metadata: {
          source: 'manual',
          detectionMethod: 'manual-input'
        }
      };

      await this.errorQueueManager.addError(errorItem);
    } else {
      // Use parsed errors
      for (const error of errors) {
        const errorItem: ErrorItem = {
          id: this.generateId(error.message),
          timestamp: Date.now(),
          message: error.message,
          type: this.mapErrorType(error.type),
          filePath: error.file || filePath || 'unknown',
          line: error.line || 0,
          severity: 'error',
          status: 'pending',
          stackTrace: [error.fullOutput],
          metadata: {
            source: 'manual',
            detectionMethod: 'manual-input'
          }
        };

        await this.errorQueueManager.addError(errorItem);
      }
    }

    vscode.window.showInformationMessage(`Added ${errors.length || 1} error(s) to queue`);
  }

  /**
   * Map terminal error type to ErrorItem type
   */
  private mapErrorType(type: string): ErrorItem['type'] {
    switch (type) {
      case 'gradle':
        return 'build';
      case 'kotlin':
      case 'test':
        return 'runtime';
      default:
        return 'runtime';
    }
  }

  /**
   * Generate unique ID for error
   */
  private generateId(message: string): string {
    const hash = `${message}-${Date.now()}`;
    return Buffer.from(hash).toString('base64').slice(0, 16);
  }

  /**
   * Clean up
   */
  dispose(): void {
    this._disposables.forEach(d => d.dispose());
    this._buildFileWatcher?.dispose();
  }
}
