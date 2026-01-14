/**
 * Fix Application Service - Integrate FixGenerator with Chat UI
 * Phase 2-3 Week 3 Implementation
 * 
 * Bridges backend FixGenerator with frontend chat commands
 * P0 Fix #2: Now uses FixGenerator for intelligent fix generation
 */

import * as vscode from 'vscode';
import { RCAResult, ParsedError } from '../types';
import { ReadFileTool, WriteFileTool, EditFileTool } from '../tools/FileOperationTool';
import { SingletonService } from './BaseService';
import { FixGenerator, CodeFix } from '../../../src/agent/FixGenerator';
import { OllamaClient } from '../../../src/llm/OllamaClient';
import { NetworkTimeoutHandler } from './NetworkTimeoutHandler';
import path from 'path';

export interface Fix {
  file: string;
  line?: number;
  before: string;
  after: string;
  explanation: string;
}

export interface PendingFix {
  id: string;
  fix: Fix;
  timestamp: number;
  confidence: number;
  errorContext: string;
}

export interface AppliedFix {
  id: string;
  fix: Fix;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface DiffPreview {
  file: string;
  originalContent: string;
  modifiedContent: string;
  changes: Array<{
    line: number;
    type: 'add' | 'remove' | 'modify';
    content: string;
  }>;
}

@SingletonService
export class FixApplicationService {
  static getInstance: () => FixApplicationService;

  private readTool: ReadFileTool;
  private writeTool: WriteFileTool;
  private editTool: EditFileTool;
  private fixGenerator: FixGenerator;
  private ollamaClient: OllamaClient;
  private timeoutHandler: NetworkTimeoutHandler;

  // Phase 3: Fix queue management
  private pendingFixes: Map<string, PendingFix> = new Map();
  private appliedFixes: Map<string, AppliedFix> = new Map();

  constructor() {
    this.readTool = new ReadFileTool();
    this.writeTool = new WriteFileTool();
    this.editTool = new EditFileTool();
    this.timeoutHandler = new NetworkTimeoutHandler();

    // Initialize Ollama client from configuration
    const config = vscode.workspace.getConfiguration('rcaAgent');
    const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
    const model = config.get<string>('model', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');

    this.ollamaClient = new OllamaClient({
      baseUrl: ollamaUrl,
      model: model
    });

    // Initialize FixGenerator with backend tools
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
    this.fixGenerator = new FixGenerator(
      this.ollamaClient,
      this.readTool as any, // Cast to any to allow backend ReadFileTool interface
      workspacePath
    );
  }

  /**
   * Generate fix from RCA result using intelligent FixGenerator
   * P0 Fix #2: Now uses backend FixGenerator instead of templates
   */
  async generateFix(result: RCAResult): Promise<Fix[]> {
    try {
      // Use backend FixGenerator if we have codeFix available
      if (result.codeFix) {
        const backendFix = result.codeFix;
        return [{
          file: backendFix.filePath,
          line: backendFix.line,
          before: backendFix.originalCode,
          after: backendFix.fixedCode,
          explanation: backendFix.explanation
        }];
      }

      // If codeFix not in result, try to generate it from error info
      // We need to convert RCAResult to ParsedError format
      const parsedError = this.convertToParsedError(result);
      if (!parsedError) {
        // Fallback to parsing fix guidelines
        return this.generateFixFromGuidelines(result);
      }

      // Generate fix using FixGenerator with timeout protection
      const fixResult = await this.timeoutHandler.executeWithTimeout(
        `fix-generation-${Date.now()}`,
        async () => {
          return await this.fixGenerator.generateFix(
            parsedError,
            result.rootCause,
            result.codeContext
          );
        },
        60000, // 60s timeout for fix generation
        2      // 2 retries
      );

      if (fixResult.timedOut) {
        console.warn('[FixApplicationService] Fix generation timed out, falling back to guidelines');
        return this.generateFixFromGuidelines(result);
      }

      if (!fixResult.success || !fixResult.data) {
        console.warn('[FixApplicationService] FixGenerator returned null, falling back to guidelines');
        return this.generateFixFromGuidelines(result);
      }

      const codeFix = fixResult.data;

      // Convert backend CodeFix to Fix[]
      const fixes: Fix[] = [{
        file: codeFix.filePath,
        line: codeFix.line,
        before: codeFix.originalCode,
        after: codeFix.fixedCode,
        explanation: codeFix.explanation
      }];

      // Add related file fixes if available
      if (codeFix.relatedFiles && codeFix.relatedFiles.length > 0) {
        codeFix.relatedFiles.forEach(relatedFix => {
          fixes.push({
            file: relatedFix.filePath,
            line: relatedFix.line,
            before: relatedFix.originalCode,
            after: relatedFix.fixedCode,
            explanation: relatedFix.explanation
          });
        });
      }

      return fixes;

    } catch (error) {
      console.error('[FixApplicationService] Error generating fix:', error);
      // Fallback to template-based generation
      return this.generateFixFromGuidelines(result);
    }
  }

  /**
   * Convert RCAResult to ParsedError format for FixGenerator
   */
  private convertToParsedError(result: RCAResult): ParsedError | null {
    // Try to extract file path and line from error message or context
    // This is best-effort extraction

    // Look for common patterns: "file.kt:123", "at file.java:45"
    const filePattern = /(?:at\s+)?([a-zA-Z0-9_/\\.-]+\.[a-zA-Z]{2,4}):(\d+)/;
    const match = result.error.match(filePattern);

    if (!match) {
      console.warn('[FixApplicationService] Could not extract file path from error');
      return null;
    }

    const [, filePath, lineStr] = match;
    const line = parseInt(lineStr, 10);

    // Determine language from file extension
    const ext = path.extname(filePath).toLowerCase();
    let language: 'kotlin' | 'java' | 'xml' | 'gradle' | 'proguard' = 'java';

    if (ext === '.kt' || ext === '.kts') {
      language = 'kotlin';
    } else if (ext === '.xml') {
      language = 'xml';
    } else if (ext === '.gradle') {
      language = 'gradle';
    }

    return {
      type: 'unknown', // Could be extracted from error pattern
      message: result.error,
      filePath,
      line,
      language
    };
  }

  /**
   * Fallback: Generate fix from guidelines (template-based)
   */
  private generateFixFromGuidelines(result: RCAResult): Fix[] {
    if (!result.fixGuidelines || result.fixGuidelines.length === 0) {
      return [];
    }

    // Extract file paths and code changes from guidelines
    const fixes: Fix[] = [];

    for (const guideline of result.fixGuidelines) {
      const fix = this.parseGuideline(guideline, result);
      if (fix) {
        fixes.push(fix);
      }
    }

    return fixes;
  }

  /**
   * Parse guideline into structured fix
   */
  private parseGuideline(guideline: string, result: RCAResult): Fix | null {
    // Pattern: "Update [file]:[line] from [before] to [after]"
    // Pattern: "Change [code] to [new_code] in [file]"
    // Pattern: "Add [code] to [file]:[line]"

    const patterns = [
      /(?:update|change)\s+(.+?):(\d+)\s+from\s+["'](.+?)["']\s+to\s+["'](.+?)["']/i,
      /(?:update|change)\s+(.+?)\s+line\s+(\d+):\s+(.+?)\s+→\s+(.+)/i,
      /(?:in|at)\s+(.+?):(\d+)[,:]?\s+(?:change|update)\s+(.+?)\s+to\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = guideline.match(pattern);
      if (match) {
        return {
          file: match[1].trim(),
          line: parseInt(match[2]),
          before: match[3].trim(),
          after: match[4].trim(),
          explanation: guideline
        };
      }
    }

    // Fallback: Return guideline as-is
    return {
      file: result.codeFix?.filePath || 'unknown',
      before: '',
      after: '',
      explanation: guideline
    };
  }

  /**
   * Generate diff preview for fixes
   */
  async generateDiffPreview(fixes: Fix[]): Promise<DiffPreview[]> {
    const previews: DiffPreview[] = [];

    for (const fix of fixes) {
      try {
        // Read current file content
        const currentContent = await this.readTool.execute({ path: fix.file });

        // Generate modified content
        const modifiedContent = this.applyFixToContent(currentContent, fix);

        // Calculate changes
        const changes = this.calculateChanges(currentContent, modifiedContent);

        previews.push({
          file: fix.file,
          originalContent: currentContent,
          modifiedContent,
          changes
        });
      } catch (error) {
        console.error(`Failed to generate diff preview for ${fix.file}:`, error);
      }
    }

    return previews;
  }

  /**
   * Apply fix to file content
   */
  private applyFixToContent(content: string, fix: Fix): string {
    const lines = content.split('\n');

    if (fix.line && fix.line > 0 && fix.line <= lines.length) {
      // Replace specific line
      const lineIndex = fix.line - 1;
      lines[lineIndex] = lines[lineIndex].replace(fix.before, fix.after);
    } else {
      // Replace all occurrences
      return content.replace(fix.before, fix.after);
    }

    return lines.join('\n');
  }

  /**
   * Calculate changes between original and modified content
   */
  private calculateChanges(original: string, modified: string): Array<{
    line: number;
    type: 'add' | 'remove' | 'modify';
    content: string;
  }> {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const changes: Array<{ line: number; type: 'add' | 'remove' | 'modify'; content: string }> = [];

    const maxLength = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLength; i++) {
      const origLine = originalLines[i];
      const modLine = modifiedLines[i];

      if (origLine === undefined) {
        changes.push({ line: i + 1, type: 'add', content: modLine });
      } else if (modLine === undefined) {
        changes.push({ line: i + 1, type: 'remove', content: origLine });
      } else if (origLine !== modLine) {
        changes.push({ line: i + 1, type: 'modify', content: modLine });
      }
    }

    return changes;
  }

  /**
   * Apply fixes to actual files
   */
  async applyFixes(fixes: Fix[]): Promise<{ success: boolean; applied: number; failed: number; errors: string[] }> {
    let applied = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const fix of fixes) {
      try {
        if (fix.line) {
          // Apply line-specific edit
          const result = await this.editTool.execute({
            path: fix.file,
            line: fix.line,
            oldText: fix.before,
            newText: fix.after
          });

          if (result) {
            applied++;
          } else {
            failed++;
            errors.push(`${fix.file}:${fix.line} - Failed to apply edit`);
          }
        } else {
          // Read, modify, write entire file
          const content = await this.readTool.execute({ path: fix.file });
          const modified = content.replace(fix.before, fix.after);

          await this.writeTool.execute({
            path: fix.file,
            content: modified
          });

          applied++;
        }
      } catch (error) {
        failed++;
        errors.push(`${fix.file} - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: failed === 0,
      applied,
      failed,
      errors
    };
  }

  /**
   * Show diff preview in VS Code
   */
  async showDiffInEditor(preview: DiffPreview): Promise<void> {
    // Create virtual documents for diff
    // Using valid URI scheme names (alphanumeric only, no hyphens)
    const originalUri = vscode.Uri.parse(`rcadifforiginal:${preview.file}`);
    const modifiedUri = vscode.Uri.parse(`rcadiffmodified:${preview.file}`);

    // Register content providers
    const originalProvider = vscode.workspace.registerTextDocumentContentProvider('rcadifforiginal', {
      provideTextDocumentContent: () => preview.originalContent
    });

    const modifiedProvider = vscode.workspace.registerTextDocumentContentProvider('rcadiffmodified', {
      provideTextDocumentContent: () => preview.modifiedContent
    });

    try {
      // Open diff view
      await vscode.commands.executeCommand(
        'vscode.diff',
        originalUri,
        modifiedUri,
        `Fix Preview: ${preview.file}`
      );
    } finally {
      // Cleanup providers
      originalProvider.dispose();
      modifiedProvider.dispose();
    }
  }

  /**
   * Convenience method: Show diff for file and content
   */
  async showDiff(file: string, originalContent: string, modifiedContent: string): Promise<void> {
    const changes = this.calculateChanges(originalContent, modifiedContent);
    const preview: DiffPreview = {
      file,
      originalContent,
      modifiedContent,
      changes
    };
    await this.showDiffInEditor(preview);
  }

  /**
   * Validate fix before applying
   */
  async validateFix(fix: Fix): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists
      const fileExists = await this.fileExists(fix.file);
      if (!fileExists) {
        return { valid: false, error: `File not found: ${fix.file}` };
      }

      // Check if target text exists in file
      if (fix.before) {
        const content = await this.readTool.execute({ path: fix.file });
        if (!content.includes(fix.before)) {
          return { valid: false, error: `Target text not found in file: "${fix.before}"` };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Phase 3: Fix Queue Management
  // ============================================================================

  /**
   * Add fix to pending queue
   */
  addPendingFix(fix: Fix, errorContext: string, confidence: number = 0.8): string {
    const id = `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.pendingFixes.set(id, {
      id,
      fix,
      timestamp: Date.now(),
      confidence,
      errorContext
    });
    return id;
  }

  /**
   * Get all pending fixes
   */
  getPendingFixes(): PendingFix[] {
    return Array.from(this.pendingFixes.values());
  }

  /**
   * Get all applied fixes
   */
  getAppliedFixes(): AppliedFix[] {
    return Array.from(this.appliedFixes.values());
  }

  /**
   * Preview a fix by ID
   */
  async previewFix(fixId: string): Promise<DiffPreview | null> {
    const pendingFix = this.pendingFixes.get(fixId);
    if (!pendingFix) {
      throw new Error('Fix not found in pending queue');
    }

    const previews = await this.generateDiffPreview([pendingFix.fix]);
    return previews[0] || null;
  }

  /**
   * Apply a fix by ID
   */
  async applyFixById(fixId: string): Promise<{ success: boolean; id?: string; file?: string; error?: string }> {
    const pendingFix = this.pendingFixes.get(fixId);
    if (!pendingFix) {
      return { success: false, error: 'Fix not found in pending queue' };
    }

    try {
      const result = await this.applyFixes([pendingFix.fix]);

      // Move from pending to applied
      this.pendingFixes.delete(fixId);
      const appliedId = `applied-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.appliedFixes.set(appliedId, {
        id: appliedId,
        fix: pendingFix.fix,
        timestamp: Date.now(),
        success: result.success,
        error: result.errors.length > 0 ? result.errors.join('; ') : undefined
      });

      return {
        success: result.success,
        id: appliedId,
        file: pendingFix.fix.file
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reject a fix (remove from pending)
   */
  async rejectFix(fixId: string): Promise<void> {
    this.pendingFixes.delete(fixId);
  }

  /**
   * Clear applied fixes history
   */
  async clearAppliedFixes(): Promise<void> {
    this.appliedFixes.clear();
  }
}