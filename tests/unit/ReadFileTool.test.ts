/**
 * Unit tests for ReadFileTool
 * 
 * Tests file reading capabilities including:
 * - Reading files with line context
 * - Error handling (file not found, binary files, large files)
 * - Line range calculations
 * - Edge cases (small files, boundary lines)
 */

import { ReadFileTool } from '../../src/tools/ReadFileTool';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ReadFileTool', () => {
  let tool: ReadFileTool;
  let tempDir: string;

  beforeEach(() => {
    tool = new ReadFileTool();
  });

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'readfiletool-test-'));
  });

  afterAll(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('execute()', () => {
    it('should read file with 50 lines of context (±25)', async () => {
      // Create a test file with 100 lines
      const testFile = path.join(tempDir, 'test-50-lines.kt');
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(testFile, lines.join('\n'), 'utf-8');

      // Read around line 50 (should get lines 25-75)
      const result = await tool.execute(testFile, 50);

      expect(result).toContain('Lines 25-75');
      expect(result).toContain('Line 25');
      expect(result).toContain('Line 75');
      expect(result).toContain('→   50 | Line 50'); // Error line marked
      expect(result).not.toContain('Line 24');
      expect(result).not.toContain('Line 76');
    });

    it('should handle files smaller than context window', async () => {
      // Create a file with only 10 lines
      const testFile = path.join(tempDir, 'test-small.kt');
      const lines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(testFile, lines.join('\n'), 'utf-8');

      // Request line 5 with ±25 lines (should get all 10 lines)
      const result = await tool.execute(testFile, 5);

      expect(result).toContain('Lines 1-10');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 10');
      expect(result).toContain('→    5 | Line 5');
    });

    it('should handle error line at start of file', async () => {
      const testFile = path.join(tempDir, 'test-start.kt');
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(testFile, lines.join('\n'), 'utf-8');

      // Request line 1 (should start from line 1, not negative)
      const result = await tool.execute(testFile, 1);

      expect(result).toContain('Lines 1-26');
      expect(result).toContain('→    1 | Line 1');
    });

    it('should handle error line at end of file', async () => {
      const testFile = path.join(tempDir, 'test-end.kt');
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(testFile, lines.join('\n'), 'utf-8');

      // Request line 100 (should end at line 100, not beyond)
      const result = await tool.execute(testFile, 100);

      expect(result).toContain('Lines 75-100');
      expect(result).toContain('→  100 | Line 100');
    });

    it('should handle out-of-bounds line numbers gracefully', async () => {
      const testFile = path.join(tempDir, 'test-bounds.kt');
      await fs.writeFile(testFile, 'Line 1\nLine 2\nLine 3', 'utf-8');

      // Request line 999 (beyond file length)
      const result = await tool.execute(testFile, 999);

      // Should not crash, should return content from end of file
      expect(result).toContain('test-bounds.kt');
      expect(result).not.toContain('Error');
    });

    it('should return error for non-existent file', async () => {
      const result = await tool.execute('/nonexistent/file.kt', 10);

      expect(result).toContain('Error: File not found');
      expect(result).toContain('/nonexistent/file.kt');
    });

    it('should return error for empty file path', async () => {
      const result = await tool.execute('', 10);

      expect(result).toContain('Error: File path is empty');
    });

    it('should return error for negative line number', async () => {
      const testFile = path.join(tempDir, 'test-negative.kt');
      await fs.writeFile(testFile, 'Line 1', 'utf-8');

      const result = await tool.execute(testFile, -5);

      expect(result).toContain('Error: Line number must be non-negative');
    });

    it('should handle binary files gracefully', async () => {
      // Create a binary file (PNG header)
      const binaryFile = path.join(tempDir, 'test-binary.png');
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
      await fs.writeFile(binaryFile, binaryData);

      const result = await tool.execute(binaryFile, 1);

      expect(result).toContain('Error: Cannot read binary file');
    });

    it('should handle large files gracefully', async () => {
      // Create a file larger than 10MB (default limit)
      const largeFile = path.join(tempDir, 'test-large.txt');
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      await fs.writeFile(largeFile, largeContent);

      const result = await tool.execute(largeFile, 1);

      expect(result).toContain('Error: File too large');
      expect(result).toContain('11.00 MB');
    });

    it('should use custom line context options', async () => {
      const testFile = path.join(tempDir, 'test-custom-context.kt');
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(testFile, lines.join('\n'), 'utf-8');

      // Use custom context: ±5 lines
      const result = await tool.execute(testFile, 50, {
        linesBefore: 5,
        linesAfter: 5,
      });

      expect(result).toContain('Lines 45-55');
      expect(result).toContain('Line 45');
      expect(result).toContain('Line 55');
      expect(result).not.toContain('Line 44');
      expect(result).not.toContain('Line 56');
    });

    it('should format line numbers with proper padding', async () => {
      const testFile = path.join(tempDir, 'test-formatting.kt');
      const lines = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(testFile, lines.join('\n'), 'utf-8');

      const result = await tool.execute(testFile, 500);

      // Line numbers should be padded (at least 3 digits for these line numbers)
      expect(result).toMatch(/\d{3,} \|/);
      expect(result).toContain('→  500 | Line 500');
    });

    it('should preserve code indentation', async () => {
      const testFile = path.join(tempDir, 'test-indentation.kt');
      const content = `fun example() {
    val user = User()
        user.name = "Test"
            println(user)
}`;
      await fs.writeFile(testFile, content, 'utf-8');

      const result = await tool.execute(testFile, 3);

      // Indentation should be preserved
      expect(result).toContain('    val user');
      expect(result).toContain('        user.name');
      expect(result).toContain('            println');
    });
  });

  describe('readEntireFile()', () => {
    it('should read entire file content', async () => {
      const testFile = path.join(tempDir, 'test-entire.kt');
      const content = 'Line 1\nLine 2\nLine 3';
      await fs.writeFile(testFile, content, 'utf-8');

      const result = await tool.readEntireFile(testFile);

      expect(result).toContain('Content of test-entire.kt');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
    });

    it('should return error for non-existent file', async () => {
      const result = await tool.readEntireFile('/nonexistent/file.kt');

      expect(result).toContain('Error: File not found');
    });

    it('should return error for binary file', async () => {
      const binaryFile = path.join(tempDir, 'test-entire-binary.bin');
      const binaryData = Buffer.from([0x00, 0x01, 0x02]);
      await fs.writeFile(binaryFile, binaryData);

      const result = await tool.readEntireFile(binaryFile);

      expect(result).toContain('Error: Cannot read binary file');
    });

    it('should return error for large file', async () => {
      const largeFile = path.join(tempDir, 'test-entire-large.txt');
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      await fs.writeFile(largeFile, largeContent);

      const result = await tool.readEntireFile(largeFile);

      expect(result).toContain('Error: File too large');
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with Windows line endings (CRLF)', async () => {
      const testFile = path.join(tempDir, 'test-crlf.kt');
      const content = 'Line 1\r\nLine 2\r\nLine 3\r\n';
      await fs.writeFile(testFile, content, 'utf-8');

      const result = await tool.execute(testFile, 2);

      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
    });

    it('should handle files with mixed line endings', async () => {
      const testFile = path.join(tempDir, 'test-mixed-endings.kt');
      const content = 'Line 1\nLine 2\r\nLine 3\rLine 4\n';
      await fs.writeFile(testFile, content, 'utf-8');

      const result = await tool.execute(testFile, 2);

      expect(result).toContain('test-mixed-endings.kt');
      expect(result).not.toContain('Error');
    });

    it('should handle empty files', async () => {
      const testFile = path.join(tempDir, 'test-empty.kt');
      await fs.writeFile(testFile, '', 'utf-8');

      const result = await tool.execute(testFile, 1);

      expect(result).toContain('test-empty.kt');
      expect(result).not.toContain('Error');
    });

    it('should handle files with special characters', async () => {
      const testFile = path.join(tempDir, 'test-special.kt');
      const content = 'val emoji = "🎯"\nval unicode = "こんにちは"\nval symbols = "@#$%"';
      await fs.writeFile(testFile, content, 'utf-8');

      const result = await tool.execute(testFile, 2);

      expect(result).toContain('🎯');
      expect(result).toContain('こんにちは');
      expect(result).toContain('@#$%');
    });
  });
});
