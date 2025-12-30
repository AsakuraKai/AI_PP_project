/**
 * Unit tests for FixGenerator
 * 
 * Tests the fix generation functionality including:
 * - Code fix generation
 * - Diff formatting
 * - Syntax validation
 * - Integration with agent workflow
 * 
 * @author Kai (Backend Developer)
 * @created December 27, 2025
 * @phase Chunk 5: Fix Generator Foundation
 */

import { FixGenerator } from '../../../src/agent/FixGenerator';
import { OllamaClient } from '../../../src/llm/OllamaClient';
import { ReadFileTool } from '../../../src/tools/ReadFileTool';
import { ParsedError } from '../../../src/types';

describe('FixGenerator', () => {
  let fixGenerator: FixGenerator;
  let mockLLM: jest.Mocked<OllamaClient>;
  let mockReadFileTool: jest.Mocked<ReadFileTool>;

  beforeEach(() => {
    // Mock LLM
    mockLLM = {
      generate: jest.fn(),
    } as any;

    // Mock ReadFileTool
    mockReadFileTool = {
      execute: jest.fn(),
    } as any;

    fixGenerator = new FixGenerator(mockLLM, mockReadFileTool);
  });

  describe('generateFix', () => {
    it('should generate a code fix for Kotlin lateinit error', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'lateinit',
        message: 'lateinit property viewModel has not been initialized',
        filePath: 'MainActivity.kt',
        line: 15,
        language: 'kotlin',
      };

      const rootCause = 'viewModel is declared as lateinit but never initialized before use';

      // Mock file reading
      mockReadFileTool.execute.mockResolvedValue(`
Lines 10-20 of MainActivity.kt:
class MainActivity : AppCompatActivity() {
    private lateinit var viewModel: MyViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // viewModel used here without initialization
        viewModel.loadData()
    }
}
      `.trim());

      // Mock LLM fix generation
      mockLLM.generate.mockResolvedValue({
        text: `\`\`\`kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var viewModel: MyViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // Initialize viewModel before use
        viewModel = MyViewModel()
        viewModel.loadData()
    }
}
\`\`\``,
      });

      // Act
      const fix = await fixGenerator.generateFix(error, rootCause);

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.filePath).toBe('MainActivity.kt');
      expect(fix!.line).toBe(15);
      expect(fix!.originalCode).toContain('lateinit var viewModel');
      expect(fix!.fixedCode).toContain('viewModel = MyViewModel()');
      expect(fix!.diff).toBeTruthy();
      expect(fix!.explanation).toContain(rootCause);
      expect(fix!.syntaxValid).toBe(true);
      expect(fix!.confidence).toBeGreaterThan(0);
    });

    it('should generate a code fix for Gradle version error', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'gradle',
        message: 'Could not find com.android.tools.build:gradle:8.10.0',
        filePath: 'gradle/libs.versions.toml',
        line: 5,
        language: 'gradle',
      };

      const rootCause = 'AGP version 8.10.0 does not exist in Maven Central';

      // Mock file reading
      mockReadFileTool.execute.mockResolvedValue(`
Lines 1-10 of gradle/libs.versions.toml:
[versions]
agp = "8.10.0"
kotlin = "1.9.0"
      `.trim());

      // Mock LLM fix generation
      mockLLM.generate.mockResolvedValue({
        text: `[versions]
agp = "8.7.3"
kotlin = "1.9.0"`,
      });

      // Act
      const fix = await fixGenerator.generateFix(error, rootCause);

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.filePath).toBe('gradle/libs.versions.toml');
      expect(fix!.originalCode).toContain('8.10.0');
      expect(fix!.fixedCode).toContain('8.7.3');
      expect(fix!.confidence).toBeGreaterThan(0);
    });

    it('should handle file read failure gracefully', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Some error',
        filePath: 'NonExistent.kt',
        line: 10,
        language: 'kotlin',
      };

      // Mock file read failure
      mockReadFileTool.execute.mockRejectedValue(new Error('File not found'));

      // Act
      const fix = await fixGenerator.generateFix(error, 'Some cause');

      // Assert
      expect(fix).toBeNull();
    });

    it('should handle LLM generation failure gracefully', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Some error',
        filePath: 'Test.kt',
        line: 10,
        language: 'kotlin',
      };

      mockReadFileTool.execute.mockResolvedValue('some code');
      mockLLM.generate.mockRejectedValue(new Error('LLM failed'));

      // Act
      const fix = await fixGenerator.generateFix(error, 'Some cause');

      // Assert
      expect(fix).toBeNull();
    });

    it('should validate Kotlin syntax', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Error',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      mockReadFileTool.execute.mockResolvedValue('val x = 5');

      // Mock LLM with invalid syntax (unbalanced braces)
      mockLLM.generate.mockResolvedValue({
        text: 'val x = 5 { }}}', // Extra closing braces
      });

      // Act
      const fix = await fixGenerator.generateFix(error, 'test', undefined, {
        validateSyntax: true,
      });

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.syntaxValid).toBe(false); // Unbalanced braces (3 close, 1 open)
    });

    it('should generate explanation for fix', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'NPE',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      const rootCause = 'Variable not initialized';

      mockReadFileTool.execute.mockResolvedValue('val x: String');
      mockLLM.generate.mockResolvedValue({
        text: 'val x: String = ""',
      });

      // Act
      const fix = await fixGenerator.generateFix(error, rootCause);

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.explanation).toContain(rootCause);
    });

    it('should calculate confidence score correctly', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Error',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      mockReadFileTool.execute.mockResolvedValue('val x = 5');
      mockLLM.generate.mockResolvedValue({
        text: 'val x = 10', // Minimal change
      });

      // Act
      const fix = await fixGenerator.generateFix(error, 'test');

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.confidence).toBeGreaterThanOrEqual(50);
      expect(fix!.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('generateAlternatives', () => {
    it('should generate multiple fix alternatives', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Error',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      const rootCause = 'Test cause';

      mockReadFileTool.execute.mockResolvedValue('original code');
      mockLLM.generate
        .mockResolvedValueOnce({ text: 'fix 1' })
        .mockResolvedValueOnce({ text: 'fix 2' })
        .mockResolvedValueOnce({ text: 'fix 3' });

      // Act
      const alternatives = await fixGenerator.generateAlternatives(error, rootCause, 3);

      // Assert
      expect(alternatives).toHaveLength(3);
      expect(alternatives[0].confidence).toBeGreaterThanOrEqual(alternatives[1].confidence);
      expect(alternatives[1].confidence).toBeGreaterThanOrEqual(alternatives[2].confidence);
    });

    it('should handle partial failures in alternatives generation', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Error',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      mockReadFileTool.execute.mockResolvedValue('original code');
      mockLLM.generate
        .mockResolvedValueOnce({ text: 'fix 1' })
        .mockRejectedValueOnce(new Error('LLM failed'))
        .mockResolvedValueOnce({ text: 'fix 3' });

      // Act
      const alternatives = await fixGenerator.generateAlternatives(error, 'test', 3);

      // Assert
      expect(alternatives.length).toBeLessThan(3); // Some failed
      expect(alternatives.length).toBeGreaterThan(0); // But some succeeded
    });
  });

  describe('Diff formats', () => {
    it('should support markdown diff format', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Error',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      mockReadFileTool.execute.mockResolvedValue('val x = 5');
      mockLLM.generate.mockResolvedValue({ text: 'val x = 10' });

      // Act
      const fix = await fixGenerator.generateFix(error, 'test', undefined, {
        diffFormat: 'markdown',
      });

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.diff).toContain('**Before:**');
      expect(fix!.diff).toContain('**After:**');
      expect(fix!.diff).toContain('```kotlin');
    });

    it('should support unified diff format', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Error',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      mockReadFileTool.execute.mockResolvedValue('val x = 5');
      mockLLM.generate.mockResolvedValue({ text: 'val x = 10' });

      // Act
      const fix = await fixGenerator.generateFix(error, 'test', undefined, {
        diffFormat: 'unified',
      });

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.diff).toContain('---');
      expect(fix!.diff).toContain('+++');
      expect(fix!.diff).toContain('@@');
    });

    it('should support side-by-side diff format', async () => {
      // Arrange
      const error: ParsedError = {
        type: 'kotlin',
        message: 'Error',
        filePath: 'Test.kt',
        line: 5,
        language: 'kotlin',
      };

      mockReadFileTool.execute.mockResolvedValue('val x = 5');
      mockLLM.generate.mockResolvedValue({ text: 'val x = 10' });

      // Act
      const fix = await fixGenerator.generateFix(error, 'test', undefined, {
        diffFormat: 'side-by-side',
      });

      // Assert
      expect(fix).not.toBeNull();
      expect(fix!.diff).toContain('| Original |');
      expect(fix!.diff).toContain('| Fixed |');
    });
  });

  describe('Error type coverage', () => {
    const errorTypes = [
      { type: 'lateinit', language: 'kotlin' as const },
      { type: 'npe', language: 'kotlin' as const },
      { type: 'gradle', language: 'gradle' as const },
      { type: 'xml', language: 'xml' as const },
      { type: 'manifest', language: 'xml' as const },
    ];

    errorTypes.forEach(({ type, language }) => {
      it(`should generate fixes for ${type} errors`, async () => {
        // Arrange
        const error: ParsedError = {
          type,
          message: `Test ${type} error`,
          filePath: `test.${language}`,
          line: 5,
          language,
        };

        mockReadFileTool.execute.mockResolvedValue('test code');
        mockLLM.generate.mockResolvedValue({ text: 'fixed code' });

        // Act
        const fix = await fixGenerator.generateFix(error, 'test cause');

        // Assert
        expect(fix).not.toBeNull();
        expect(fix!.filePath).toBe(`test.${language}`);
      });
    });
  });
});
