/**
 * DiffFormatter - Formatted diff generation for code changes
 * 
 * Provides multiple diff formats for displaying code changes:
 * - Markdown: Human-readable with syntax highlighting
 * - Unified: Standard unified diff format (- / +)
 * - Side-by-side: Compare original and fixed code
 * 
 * Used by FixGenerator to create visual diffs for users.
 * 
 * @example
 * const formatter = new DiffFormatter();
 * const diff = formatter.format(original, fixed, 'markdown', 'file.kt');
 * console.log(diff);
 * // Output:
 * // ```kotlin
 * // - lateinit var viewModel: MyViewModel
 * // + private lateinit var viewModel: MyViewModel
 * // ```
 * 
 * @author Kai (Backend Developer)
 * @created December 27, 2025
 * @phase Chunk 5: Fix Generator Foundation
 */

/**
 * Available diff formats
 */
export type DiffFormat = 'markdown' | 'unified' | 'side-by-side';

/**
 * Diff line type
 */
type LineType = 'added' | 'removed' | 'unchanged' | 'modified';

/**
 * Diff line with metadata
 */
interface DiffLine {
  type: LineType;
  originalLine: string | null;
  fixedLine: string | null;
  originalLineNum: number | null;
  fixedLineNum: number | null;
}

/**
 * DiffFormatter class
 */
export class DiffFormatter {
  /**
   * Format a diff between original and fixed code
   * 
   * @param original - Original code
   * @param fixed - Fixed code
   * @param format - Desired diff format
   * @param filePath - File path (for context)
   * @returns Formatted diff string
   */
  format(
    original: string,
    fixed: string,
    format: DiffFormat = 'markdown',
    filePath?: string
  ): string {
    switch (format) {
      case 'markdown':
        return this.formatMarkdown(original, fixed, filePath);
      case 'unified':
        return this.formatUnified(original, fixed, filePath);
      case 'side-by-side':
        return this.formatSideBySide(original, fixed, filePath);
      default:
        throw new Error(`Unknown diff format: ${format}`);
    }
  }

  /**
   * Format as markdown with syntax highlighting
   * 
   * Shows before/after code blocks with clear labels
   * 
   * @param original - Original code
   * @param fixed - Fixed code
   * @param filePath - File path
   * @returns Markdown formatted diff
   */
  private formatMarkdown(
    original: string,
    fixed: string,
    filePath?: string
  ): string {
    const language = this.detectLanguage(filePath);
    const header = filePath ? `**File:** \`${filePath}\`\n\n` : '';
    
    return `${header}**Before:**
\`\`\`${language}
${original}
\`\`\`

**After:**
\`\`\`${language}
${fixed}
\`\`\``;
  }

  /**
   * Format as unified diff (- / + format)
   * 
   * Standard diff format used by Git and other tools
   * 
   * @param original - Original code
   * @param fixed - Fixed code
   * @param filePath - File path
   * @returns Unified diff format
   */
  private formatUnified(
    original: string,
    fixed: string,
    filePath?: string
  ): string {
    const diffLines = this.computeDiff(original, fixed);
    const fileName = filePath || 'file';
    
    let result = `--- a/${fileName}\n`;
    result += `+++ b/${fileName}\n`;
    
    // Group changes into hunks
    const hunks = this.groupIntoHunks(diffLines);
    
    for (const hunk of hunks) {
      result += this.formatHunk(hunk);
    }
    
    return result;
  }

  /**
   * Format as side-by-side comparison
   * 
   * Shows original and fixed code side by side (markdown table)
   * 
   * @param original - Original code
   * @param fixed - Fixed code
   * @param filePath - File path
   * @returns Side-by-side diff
   */
  private formatSideBySide(
    original: string,
    fixed: string,
    filePath?: string
  ): string {
    const originalLines = original.split('\n');
    const fixedLines = fixed.split('\n');
    const maxLines = Math.max(originalLines.length, fixedLines.length);
    
    let result = filePath ? `**File:** \`${filePath}\`\n\n` : '';
    result += '| Original | Fixed |\n';
    result += '|----------|-------|\n';
    
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const fixLine = fixedLines[i] || '';
      
      // Escape pipe characters in code
      const escapedOrig = origLine.replace(/\|/g, '\\|');
      const escapedFix = fixLine.replace(/\|/g, '\\|');
      
      result += `| \`${escapedOrig}\` | \`${escapedFix}\` |\n`;
    }
    
    return result;
  }

  /**
   * Compute line-by-line diff using Myers algorithm
   *
   * @param original - Original code
   * @param fixed - Fixed code
   * @returns Array of diff lines
   */
  private computeDiff(original: string, fixed: string): DiffLine[] {
    const originalLines = original.split('\n');
    const fixedLines = fixed.split('\n');

    // Use Myers diff algorithm for better results
    const editScript = this.myersDiff(originalLines, fixedLines);

    return this.convertEditScriptToDiffLines(editScript);
  }

  /**
   * Normalize whitespace for comparison
   * Handles leading/trailing whitespace and collapses multiple spaces
   *
   * @param line - Line to normalize
   * @returns Normalized line
   */
  private normalizeWhitespace(line: string): string {
    return line
      .trim()
      .replace(/\t/g, '  ') // Convert tabs to 2 spaces
      .replace(/\s+/g, ' '); // Collapse multiple spaces to single space
  }

  /**
   * Myers diff algorithm implementation
   * Computes the shortest edit script (SES) between two sequences
   *
   * @param a - Original lines
   * @param b - Fixed lines
   * @returns Edit script
   */
  private myersDiff(a: string[], b: string[]): Array<{type: 'add' | 'remove' | 'keep', line: string, aIndex?: number, bIndex?: number}> {
    const n = a.length;
    const m = b.length;
    const max = n + m;

    // V array stores the furthest reaching path for each diagonal
    const v: Map<number, number> = new Map();
    v.set(1, 0);

    // Trace stores the path history
    const trace: Array<Map<number, number>> = [];

    // Find the shortest edit script
    for (let d = 0; d <= max; d++) {
      trace.push(new Map(v));

      for (let k = -d; k <= d; k += 2) {
        let x: number;

        // Determine if we should move down or right
        const goDown = k === -d || (k !== d && (v.get(k - 1) || 0) < (v.get(k + 1) || 0));

        if (goDown) {
          x = v.get(k + 1) || 0;
        } else {
          x = (v.get(k - 1) || 0) + 1;
        }

        let y = x - k;

        // Follow diagonal (matching lines) with whitespace normalization
        while (x < n && y < m && this.normalizeWhitespace(a[x]) === this.normalizeWhitespace(b[y])) {
          x++;
          y++;
        }

        v.set(k, x);

        // Check if we've reached the end
        if (x >= n && y >= m) {
          return this.backtrackMyersDiff(a, b, trace, d);
        }
      }
    }

    // Fallback: shouldn't reach here
    return [];
  }

  /**
   * Backtrack through Myers diff trace to build edit script
   *
   * @param a - Original lines
   * @param b - Fixed lines
   * @param trace - Trace history
   * @param d - Final distance
   * @returns Edit script
   */
  private backtrackMyersDiff(
    a: string[],
    b: string[],
    trace: Array<Map<number, number>>,
    d: number
  ): Array<{type: 'add' | 'remove' | 'keep', line: string, aIndex?: number, bIndex?: number}> {
    let x = a.length;
    let y = b.length;

    const script: Array<{type: 'add' | 'remove' | 'keep', line: string, aIndex?: number, bIndex?: number}> = [];

    for (let depth = d; depth >= 0; depth--) {
      const v = trace[depth];
      const k = x - y;

      let prevK: number;
      const goDown = k === -depth || (k !== depth && (v.get(k - 1) || 0) < (v.get(k + 1) || 0));

      if (goDown) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = v.get(prevK) || 0;
      const prevY = prevX - prevK;

      // Add diagonal moves (matches)
      while (x > prevX && y > prevY) {
        script.unshift({
          type: 'keep',
          line: a[x - 1],
          aIndex: x - 1,
          bIndex: y - 1
        });
        x--;
        y--;
      }

      if (depth === 0) break;

      // Add the edit operation
      if (x === prevX) {
        // Insertion
        script.unshift({
          type: 'add',
          line: b[y - 1],
          bIndex: y - 1
        });
        y--;
      } else {
        // Deletion
        script.unshift({
          type: 'remove',
          line: a[x - 1],
          aIndex: x - 1
        });
        x--;
      }
    }

    return script;
  }

  /**
   * Convert edit script to DiffLine format
   *
   * @param script - Edit script from Myers diff
   * @returns Array of diff lines
   */
  private convertEditScriptToDiffLines(
    script: Array<{type: 'add' | 'remove' | 'keep', line: string, aIndex?: number, bIndex?: number}>
  ): DiffLine[] {
    const diffLines: DiffLine[] = [];
    let originalLineNum = 1;
    let fixedLineNum = 1;

    for (const edit of script) {
      switch (edit.type) {
        case 'keep':
          diffLines.push({
            type: 'unchanged',
            originalLine: edit.line,
            fixedLine: edit.line,
            originalLineNum: originalLineNum++,
            fixedLineNum: fixedLineNum++
          });
          break;

        case 'remove':
          diffLines.push({
            type: 'removed',
            originalLine: edit.line,
            fixedLine: null,
            originalLineNum: originalLineNum++,
            fixedLineNum: null
          });
          break;

        case 'add':
          diffLines.push({
            type: 'added',
            originalLine: null,
            fixedLine: edit.line,
            originalLineNum: null,
            fixedLineNum: fixedLineNum++
          });
          break;
      }
    }

    return diffLines;
  }

  /**
   * Group diff lines into hunks (sections with changes)
   * 
   * @param diffLines - All diff lines
   * @returns Array of hunks
   */
  private groupIntoHunks(diffLines: DiffLine[]): DiffLine[][] {
    const hunks: DiffLine[][] = [];
    let currentHunk: DiffLine[] = [];
    let contextCount = 0;
    const CONTEXT_LINES = 3; // Lines of context around changes
    
    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];
      
      if (line.type === 'unchanged') {
        contextCount++;
        
        // If we've seen enough context and have a current hunk, end it
        if (contextCount > CONTEXT_LINES * 2 && currentHunk.length > 0) {
          // Add trailing context
          currentHunk.push(...diffLines.slice(
            Math.max(0, i - CONTEXT_LINES),
            i
          ));
          hunks.push(currentHunk);
          currentHunk = [];
          contextCount = 0;
        } else if (currentHunk.length > 0) {
          currentHunk.push(line);
        }
      } else {
        // Changed line
        if (currentHunk.length === 0) {
          // Start new hunk with leading context
          currentHunk.push(...diffLines.slice(
            Math.max(0, i - CONTEXT_LINES),
            i
          ));
        }
        currentHunk.push(line);
        contextCount = 0;
      }
    }
    
    // Add final hunk if exists
    if (currentHunk.length > 0) {
      hunks.push(currentHunk);
    }
    
    return hunks;
  }

  /**
   * Format a hunk for unified diff
   * 
   * @param hunk - Hunk lines
   * @returns Formatted hunk string
   */
  private formatHunk(hunk: DiffLine[]): string {
    if (hunk.length === 0) return '';
    
    // Calculate hunk header (@@ -start,count +start,count @@)
    const firstOrigLine = hunk.find(l => l.originalLineNum !== null)?.originalLineNum || 1;
    const firstFixLine = hunk.find(l => l.fixedLineNum !== null)?.fixedLineNum || 1;
    const origCount = hunk.filter(l => l.originalLineNum !== null).length;
    const fixCount = hunk.filter(l => l.fixedLineNum !== null).length;
    
    let result = `@@ -${firstOrigLine},${origCount} +${firstFixLine},${fixCount} @@\n`;
    
    for (const line of hunk) {
      switch (line.type) {
        case 'unchanged':
          result += ` ${line.originalLine}\n`;
          break;
        case 'removed':
          result += `-${line.originalLine}\n`;
          break;
        case 'added':
          result += `+${line.fixedLine}\n`;
          break;
      }
    }
    
    return result;
  }

  /**
   * Detect programming language from file path
   * 
   * @param filePath - File path
   * @returns Language identifier for syntax highlighting
   */
  private detectLanguage(filePath?: string): string {
    if (!filePath) return '';
    
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'kt': 'kotlin',
      'java': 'java',
      'gradle': 'gradle',
      'kts': 'kotlin',
      'xml': 'xml',
      'json': 'json',
      'toml': 'toml',
      'properties': 'properties',
      'ts': 'typescript',
      'js': 'javascript',
      'py': 'python',
    };
    
    return ext && languageMap[ext] ? languageMap[ext] : '';
  }

  /**
   * Get diff statistics (lines added/removed)
   * 
   * @param original - Original code
   * @param fixed - Fixed code
   * @returns Statistics object
   */
  getStatistics(original: string, fixed: string): {
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
    linesUnchanged: number;
  } {
    const diffLines = this.computeDiff(original, fixed);
    
    return {
      linesAdded: diffLines.filter(l => l.type === 'added').length,
      linesRemoved: diffLines.filter(l => l.type === 'removed').length,
      linesModified: diffLines.filter(l => l.type === 'modified').length,
      linesUnchanged: diffLines.filter(l => l.type === 'unchanged').length,
    };
  }

  /**
   * Check if two code blocks are identical
   * 
   * @param original - Original code
   * @param fixed - Fixed code
   * @returns True if identical
   */
  isIdentical(original: string, fixed: string): boolean {
    return original.trim() === fixed.trim();
  }
}
