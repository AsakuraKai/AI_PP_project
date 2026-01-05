/**
 * Fix Application Service - Integrate FixGenerator with Chat UI
 * Phase 2-3 Week 3 Implementation
 * 
 * Bridges backend FixGenerator with frontend chat commands
 */

import * as vscode from 'vscode';
import { RCAResult } from '../panel/types';
import { ReadFileTool, WriteFileTool, EditFileTool } from '../tools/FileOperationTool';
import { SingletonService } from './BaseService';

export interface Fix {
  file: string;
  line?: number;
  before: string;
  after: string;
  explanation: string;
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

  constructor() {
    this.readTool = new ReadFileTool();
    this.writeTool = new WriteFileTool();
    this.editTool = new EditFileTool();
  }

  /**
   * Generate fix from RCA result
   * This will call backend FixGenerator when integrated
   */
  async generateFix(result: RCAResult): Promise<Fix[]> {
    // TODO: Integrate with backend FixGenerator
    // For now, parse fix guidelines into structured fixes
    
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
      file: result.filePath || 'unknown',
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
    const originalUri = vscode.Uri.parse(`rca-diff-original:${preview.file}`);
    const modifiedUri = vscode.Uri.parse(`rca-diff-modified:${preview.file}`);

    // Register content providers
    const originalProvider = vscode.workspace.registerTextDocumentContentProvider('rca-diff-original', {
      provideTextDocumentContent: () => preview.originalContent
    });

    const modifiedProvider = vscode.workspace.registerTextDocumentContentProvider('rca-diff-modified', {
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
}
