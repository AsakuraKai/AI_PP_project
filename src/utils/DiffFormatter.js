"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffFormatter = void 0;
/**
 * DiffFormatter class
 */
class DiffFormatter {
    /**
     * Format a diff between original and fixed code
     *
     * @param original - Original code
     * @param fixed - Fixed code
     * @param format - Desired diff format
     * @param filePath - File path (for context)
     * @returns Formatted diff string
     */
    format(original, fixed, format = 'markdown', filePath) {
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
    formatMarkdown(original, fixed, filePath) {
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
    formatUnified(original, fixed, filePath) {
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
    formatSideBySide(original, fixed, filePath) {
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
     * Compute line-by-line diff
     *
     * @param original - Original code
     * @param fixed - Fixed code
     * @returns Array of diff lines
     */
    computeDiff(original, fixed) {
        const originalLines = original.split('\n');
        const fixedLines = fixed.split('\n');
        const diffLines = [];
        // Simple line-by-line comparison
        // TODO: Implement proper Myers diff algorithm for better results
        const maxLines = Math.max(originalLines.length, fixedLines.length);
        for (let i = 0; i < maxLines; i++) {
            const origLine = i < originalLines.length ? originalLines[i] : null;
            const fixLine = i < fixedLines.length ? fixedLines[i] : null;
            if (origLine === fixLine) {
                // Unchanged line
                diffLines.push({
                    type: 'unchanged',
                    originalLine: origLine,
                    fixedLine: fixLine,
                    originalLineNum: i + 1,
                    fixedLineNum: i + 1,
                });
            }
            else if (origLine === null) {
                // Added line
                diffLines.push({
                    type: 'added',
                    originalLine: null,
                    fixedLine: fixLine,
                    originalLineNum: null,
                    fixedLineNum: i + 1,
                });
            }
            else if (fixLine === null) {
                // Removed line
                diffLines.push({
                    type: 'removed',
                    originalLine: origLine,
                    fixedLine: null,
                    originalLineNum: i + 1,
                    fixedLineNum: null,
                });
            }
            else {
                // Modified line (treat as remove + add)
                diffLines.push({
                    type: 'removed',
                    originalLine: origLine,
                    fixedLine: null,
                    originalLineNum: i + 1,
                    fixedLineNum: null,
                });
                diffLines.push({
                    type: 'added',
                    originalLine: null,
                    fixedLine: fixLine,
                    originalLineNum: null,
                    fixedLineNum: i + 1,
                });
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
    groupIntoHunks(diffLines) {
        const hunks = [];
        let currentHunk = [];
        let contextCount = 0;
        const CONTEXT_LINES = 3; // Lines of context around changes
        for (let i = 0; i < diffLines.length; i++) {
            const line = diffLines[i];
            if (line.type === 'unchanged') {
                contextCount++;
                // If we've seen enough context and have a current hunk, end it
                if (contextCount > CONTEXT_LINES * 2 && currentHunk.length > 0) {
                    // Add trailing context
                    currentHunk.push(...diffLines.slice(Math.max(0, i - CONTEXT_LINES), i));
                    hunks.push(currentHunk);
                    currentHunk = [];
                    contextCount = 0;
                }
                else if (currentHunk.length > 0) {
                    currentHunk.push(line);
                }
            }
            else {
                // Changed line
                if (currentHunk.length === 0) {
                    // Start new hunk with leading context
                    currentHunk.push(...diffLines.slice(Math.max(0, i - CONTEXT_LINES), i));
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
    formatHunk(hunk) {
        if (hunk.length === 0)
            return '';
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
    detectLanguage(filePath) {
        if (!filePath)
            return '';
        const ext = filePath.split('.').pop()?.toLowerCase();
        const languageMap = {
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
    getStatistics(original, fixed) {
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
    isIdentical(original, fixed) {
        return original.trim() === fixed.trim();
    }
}
exports.DiffFormatter = DiffFormatter;
//# sourceMappingURL=DiffFormatter.js.map