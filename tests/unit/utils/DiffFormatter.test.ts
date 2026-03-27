/**
 * Unit tests for DiffFormatter
 * 
 * Tests diff formatting functionality:
 * - Markdown format
 * - Unified format
 * - Side-by-side format
 * - Diff statistics
 * 
 * @author Kai (Backend Developer)
 * @created December 27, 2025
 * @phase Chunk 5: Fix Generator Foundation
 */

import { DiffFormatter } from '../../../src/utils/DiffFormatter';

describe('DiffFormatter', () => {
  let formatter: DiffFormatter;

  beforeEach(() => {
    formatter = new DiffFormatter();
  });

  describe('format', () => {
    const original = `val x = 5
val y = 10
val z = 15`;

    const fixed = `val x = 5
val y = 20
val z = 15`;

    it('should format as markdown by default', () => {
      // Act
      const diff = formatter.format(original, fixed, 'markdown', 'Test.kt');

      // Assert
      expect(diff).toContain('**File:**');
      expect(diff).toContain('Test.kt');
      expect(diff).toContain('**Before:**');
      expect(diff).toContain('**After:**');
      expect(diff).toContain('```kotlin');
      expect(diff).toContain(original);
      expect(diff).toContain(fixed);
    });

    it('should format as unified diff', () => {
      // Act
      const diff = formatter.format(original, fixed, 'unified', 'Test.kt');

      // Assert
      expect(diff).toContain('--- a/Test.kt');
      expect(diff).toContain('+++ b/Test.kt');
      expect(diff).toContain('@@');
      expect(diff).toContain(' val x = 5'); // Unchanged
      expect(diff).toContain('-val y = 10'); // Removed
      expect(diff).toContain('+val y = 20'); // Added
    });

    it('should format as side-by-side', () => {
      // Act
      const diff = formatter.format(original, fixed, 'side-by-side', 'Test.kt');

      // Assert
      expect(diff).toContain('| Original | Fixed |');
      expect(diff).toContain('|----------|-------|');
      expect(diff).toContain('val x = 5');
      expect(diff).toContain('val y = 10');
      expect(diff).toContain('val y = 20');
    });

    it('should detect language from file extension', () => {
      // Act
      const kotlinDiff = formatter.format(original, fixed, 'markdown', 'Test.kt');
      const javaDiff = formatter.format(original, fixed, 'markdown', 'Test.java');
      const xmlDiff = formatter.format(original, fixed, 'markdown', 'layout.xml');

      // Assert
      expect(kotlinDiff).toContain('```kotlin');
      expect(javaDiff).toContain('```java');
      expect(xmlDiff).toContain('```xml');
    });

    it('should handle files without extension', () => {
      // Act
      const diff = formatter.format(original, fixed, 'markdown', 'Test');

      // Assert
      expect(diff).toContain('```'); // Empty language
      expect(diff).toContain('**Before:**');
    });

    it('should work without file path', () => {
      // Act
      const diff = formatter.format(original, fixed, 'markdown');

      // Assert
      expect(diff).not.toContain('**File:**');
      expect(diff).toContain('**Before:**');
      expect(diff).toContain('**After:**');
    });
  });

  describe('getStatistics', () => {
    it('should calculate correct statistics for simple changes', () => {
      // Arrange
      const original = `line 1
line 2
line 3`;

      const fixed = `line 1
line 2 modified
line 3`;

      // Act
      const stats = formatter.getStatistics(original, fixed);

      // Assert
      expect(stats.linesUnchanged).toBe(2); // lines 1 and 3
      expect(stats.linesRemoved).toBe(1);
      expect(stats.linesAdded).toBe(1);
    });

    it('should calculate statistics for added lines', () => {
      // Arrange
      const original = `line 1
line 2`;

      const fixed = `line 1
line 2
line 3
line 4`;

      // Act
      const stats = formatter.getStatistics(original, fixed);

      // Assert
      expect(stats.linesUnchanged).toBe(2);
      expect(stats.linesAdded).toBe(2);
      expect(stats.linesRemoved).toBe(0);
    });

    it('should calculate statistics for removed lines', () => {
      // Arrange
      const original = `line 1
line 2
line 3
line 4`;

      const fixed = `line 1
line 2`;

      // Act
      const stats = formatter.getStatistics(original, fixed);

      // Assert
      expect(stats.linesUnchanged).toBe(2);
      expect(stats.linesAdded).toBe(0);
      expect(stats.linesRemoved).toBe(2);
    });

    it('should calculate statistics for identical code', () => {
      // Arrange
      const code = `line 1
line 2
line 3`;

      // Act
      const stats = formatter.getStatistics(code, code);

      // Assert
      expect(stats.linesUnchanged).toBe(3);
      expect(stats.linesAdded).toBe(0);
      expect(stats.linesRemoved).toBe(0);
    });
  });

  describe('isIdentical', () => {
    it('should return true for identical code', () => {
      // Arrange
      const code1 = `val x = 5
val y = 10`;
      const code2 = `val x = 5
val y = 10`;

      // Act
      const result = formatter.isIdentical(code1, code2);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for code with different leading/trailing whitespace', () => {
      // Arrange
      const code1 = `val x = 5
val y = 10`;
      const code2 = ` val x = 5
val y = 10 `; // Only leading/trailing spaces

      // Act
      const result = formatter.isIdentical(code1, code2);

      // Assert
      expect(result).toBe(true); // Trimmed comparison
    });

    it('should return false for different code', () => {
      // Arrange
      const code1 = `val x = 5`;
      const code2 = `val x = 10`;

      // Act
      const result = formatter.isIdentical(code1, code2);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Unified diff format details', () => {
    it('should generate correct hunk headers', () => {
      // Arrange
      const original = `line 1
line 2
line 3
line 4
line 5`;

      const fixed = `line 1
line 2 modified
line 3
line 4
line 5`;

      // Act
      const diff = formatter.format(original, fixed, 'unified');

      // Assert
      expect(diff).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/);
    });

    it('should group multiple changes into hunks', () => {
      // Arrange
      const original = `line 1
line 2
line 3
line 4
line 5
line 6
line 7
line 8`;

      const fixed = `line 1
line 2 modified
line 3
line 4
line 5
line 6 modified
line 7
line 8`;

      // Act
      const diff = formatter.format(original, fixed, 'unified');

      // Assert
      expect(diff).toContain('@@');
      expect(diff).toContain('-line 2');
      expect(diff).toContain('+line 2 modified');
      expect(diff).toContain('-line 6');
      expect(diff).toContain('+line 6 modified');
    });
  });

  describe('Side-by-side format details', () => {
    it('should escape pipe characters in code', () => {
      // Arrange
      const original = 'val x = "a|b"';
      const fixed = 'val x = "a\\|b"';

      // Act
      const diff = formatter.format(original, fixed, 'side-by-side');

      // Assert
      expect(diff).toContain('\\|');
      // Should still be valid markdown table
      expect(diff).toContain('| Original | Fixed |');
    });

    it('should handle different line counts', () => {
      // Arrange
      const original = `line 1
line 2`;

      const fixed = `line 1
line 2
line 3`;

      // Act
      const diff = formatter.format(original, fixed, 'side-by-side');

      // Assert
      expect(diff).toContain('line 1');
      expect(diff).toContain('line 2');
      expect(diff).toContain('line 3');
    });
  });

  describe('Language detection', () => {
    const testCases = [
      { file: 'Test.kt', expected: 'kotlin' },
      { file: 'Test.java', expected: 'java' },
      { file: 'build.gradle', expected: 'gradle' },
      { file: 'build.gradle.kts', expected: 'kotlin' },
      { file: 'layout.xml', expected: 'xml' },
      { file: 'config.json', expected: 'json' },
      { file: 'config.toml', expected: 'toml' },
      { file: 'script.py', expected: 'python' },
      { file: 'script.js', expected: 'javascript' },
      { file: 'script.ts', expected: 'typescript' },
    ];

    testCases.forEach(({ file, expected }) => {
      it(`should detect ${expected} from ${file}`, () => {
        // Act
        const diff = formatter.format('code', 'code', 'markdown', file);

        // Assert
        expect(diff).toContain(`\`\`\`${expected}`);
      });
    });

    it('should handle unknown extensions', () => {
      // Act
      const diff = formatter.format('code', 'code', 'markdown', 'file.unknown');

      // Assert
      expect(diff).toContain('```'); // Empty language
    });
  });
});
