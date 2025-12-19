/**
 * Tests for DocumentSynthesizer
 * 
 * Tests markdown generation, formatting, and section organization.
 */

import { DocumentSynthesizer } from '../../src/agent/DocumentSynthesizer';
import { RCAResult, ParsedError, AgentState } from '../../src/types';

describe('DocumentSynthesizer', () => {
  let synthesizer: DocumentSynthesizer;

  beforeEach(() => {
    synthesizer = new DocumentSynthesizer();
  });

  describe('synthesize()', () => {
    it('should generate complete markdown document', () => {
      const error: ParsedError = {
        type: 'lateinit',
        message: 'lateinit property user has not been initialized',
        filePath: 'MainActivity.kt',
        line: 45,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'The lateinit property "user" is accessed before initialization in onCreate()',
        fixGuidelines: [
          'Initialize user property in onCreate() before accessing it',
          'Add null check with ::user.isInitialized before accessing',
          'Consider using nullable type (User?) instead of lateinit',
        ],
        confidence: 0.9,
        iterations: 5,
        toolsUsed: ['read_file'],
      };

      const markdown = synthesizer.synthesize(rca, error);

      // Check for main sections
      expect(markdown).toContain('# 🔍 Root Cause Analysis: Lateinit');
      expect(markdown).toContain('## 📋 Summary');
      expect(markdown).toContain('## 🎯 Root Cause');
      expect(markdown).toContain('## 🛠️ Fix Guidelines');
      expect(markdown).toContain('## 🔧 Analysis Tools Used');
      expect(markdown).toContain('## 📊 Analysis Metadata');

      // Check content
      expect(markdown).toContain('lateinit property user has not been initialized');
      expect(markdown).toContain('MainActivity.kt:45');
      expect(markdown).toContain('Initialize user property in onCreate()');
    });

    it('should include code context when available', () => {
      const error: ParsedError = {
        type: 'npe',
        message: 'NullPointerException',
        filePath: 'UserActivity.kt',
        line: 23,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'Variable is null',
        fixGuidelines: ['Add null check'],
        confidence: 0.8,
        codeContext: 'val name = user.name\nval email = user.email',
      };

      const markdown = synthesizer.synthesize(rca, error, undefined, {
        includeCodeContext: true,
      });

      expect(markdown).toContain('## 📄 Code Context');
      expect(markdown).toContain('```kotlin');
      expect(markdown).toContain('val name = user.name');
    });

    it('should truncate very long code context', () => {
      const longCode = 'x'.repeat(2000);

      const error: ParsedError = {
        type: 'compilation_error',
        message: 'Compilation failed',
        filePath: 'Test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'Syntax error',
        fixGuidelines: ['Fix syntax'],
        confidence: 0.7,
        codeContext: longCode,
      };

      const markdown = synthesizer.synthesize(rca, error, undefined, {
        maxCodeLength: 1000,
      });

      expect(markdown).toContain('[truncated]');
      expect(markdown.length).toBeLessThan(longCode.length + 500);
    });

    it('should handle missing optional sections', () => {
      const error: ParsedError = {
        type: 'build_error',
        message: 'Build failed',
        filePath: 'build.gradle',
        line: 10,
        language: 'gradle',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'Dependency conflict',
        fixGuidelines: ['Update dependency version'],
        confidence: 0.6,
      };

      const markdown = synthesizer.synthesize(rca, error, undefined, {
        includeCodeContext: false,
        includeToolDetails: false,
        includeMetadata: false,
      });

      expect(markdown).not.toContain('## 📄 Code Context');
      expect(markdown).not.toContain('## 🔧 Analysis Tools Used');
      expect(markdown).not.toContain('## 📊 Analysis Metadata');

      // Should still have required sections
      expect(markdown).toContain('## 📋 Summary');
      expect(markdown).toContain('## 🎯 Root Cause');
      expect(markdown).toContain('## 🛠️ Fix Guidelines');
    });

    it('should handle framework metadata', () => {
      const error: ParsedError = {
        type: 'compose_remember',
        message: 'remember not called',
        filePath: 'HomeScreen.kt',
        line: 34,
        language: 'kotlin',
        framework: 'compose',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'State not remembered in composable',
        fixGuidelines: ['Wrap state with remember { }'],
        confidence: 0.95,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('KOTLIN (compose)');
      expect(markdown).toContain('Compose Remember');
    });
  });

  describe('formatConfidence()', () => {
    it('should format high confidence correctly', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.9,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('90%');
      expect(markdown).toContain('(High)');
      expect(markdown).toMatch(/█{9}░{1}/); // 9 filled, 1 empty
    });

    it('should format medium confidence correctly', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.6,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('60%');
      expect(markdown).toContain('(Medium)');
      expect(markdown).toMatch(/█{6}░{4}/); // 6 filled, 4 empty
    });

    it('should format low confidence correctly', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.3,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('30%');
      expect(markdown).toContain('(Low)');
      expect(markdown).toMatch(/█{3}░{7}/); // 3 filled, 7 empty
    });
  });

  describe('formatErrorType()', () => {
    it('should format snake_case error types', () => {
      const error: ParsedError = {
        type: 'unresolved_reference',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('Unresolved Reference');
    });

    it('should format single word error types', () => {
      const error: ParsedError = {
        type: 'npe',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('Npe');
    });
  });

  describe('formatToolName()', () => {
    it('should format standard tool names', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
        toolsUsed: ['read_file', 'find_callers', 'vector_search_db'],
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('📖 Read File');
      expect(markdown).toContain('🔍 Find Callers (LSP)');
      expect(markdown).toContain('🗄️ Vector Search');
    });

    it('should format custom tool names', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
        toolsUsed: ['custom_tool_name'],
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('custom tool name');
    });
  });

  describe('generateQuickSummary()', () => {
    it('should generate concise single-line summary', () => {
      const error: ParsedError = {
        type: 'lateinit',
        message: 'lateinit property user has not been initialized',
        filePath: 'MainActivity.kt',
        line: 45,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'Property not initialized',
        fixGuidelines: ['Initialize property'],
        confidence: 0.87,
      };

      const summary = synthesizer.generateQuickSummary(rca, error);

      expect(summary).toBe('Lateinit in MainActivity.kt:45 (87% confidence)');
      expect(summary.split('\n').length).toBe(1);
    });

    it('should round confidence percentage', () => {
      const error: ParsedError = {
        type: 'npe',
        message: 'NullPointerException',
        filePath: 'Test.kt',
        line: 10,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'Null value',
        fixGuidelines: ['Add null check'],
        confidence: 0.666,
      };

      const summary = synthesizer.generateQuickSummary(rca, error);

      expect(summary).toContain('67% confidence');
    });
  });

  describe('metadata section', () => {
    it('should include iteration count', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
        iterations: 7,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('**Iterations:** 7');
    });

    it('should calculate duration from state', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const state: Partial<AgentState> = {
        startTime: Date.now() - 45000, // 45 seconds ago
      };

      const markdown = synthesizer.synthesize(rca, error, state);

      expect(markdown).toMatch(/\*\*Analysis Duration:\*\* \d+\.\d+s/);
    });

    it('should include custom metadata', () => {
      const error: ParsedError = {
        type: 'lateinit',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
        metadata: {
          propertyName: 'user',
          className: 'MainActivity',
        },
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('**PropertyName:** user');
      expect(markdown).toContain('**ClassName:** MainActivity');
    });
  });

  describe('syntax highlighting', () => {
    it('should use correct language for Kotlin', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
        codeContext: 'val x = 10',
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('```kotlin');
    });

    it('should use correct language for Java', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'Test.java',
        line: 1,
        language: 'java',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
        codeContext: 'int x = 10;',
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('```java');
    });

    it('should use groovy for Gradle files', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'build.gradle',
        line: 1,
        language: 'gradle',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
        codeContext: 'implementation "androidx.core:core-ktx:1.12.0"',
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('```groovy');
    });
  });

  describe('edge cases', () => {
    it('should handle error at unknown location', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Unknown error',
        filePath: 'unknown',
        line: 0,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('Unknown location');
    });

    it('should handle empty fix guidelines', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Test',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain('## 🛠️ Fix Guidelines');
      // Should not crash, even with empty array
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'X'.repeat(5000);

      const error: ParsedError = {
        type: 'test',
        message: longMessage,
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: longMessage,
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const markdown = synthesizer.synthesize(rca, error);

      expect(markdown).toContain(longMessage);
      expect(markdown.length).toBeGreaterThan(5000);
    });

    it('should handle special characters in error message', () => {
      const error: ParsedError = {
        type: 'test',
        message: 'Error: <script>alert("XSS")</script>',
        filePath: 'test.kt',
        line: 1,
        language: 'kotlin',
      };

      const rca: RCAResult = {
        error: error.message,
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      const markdown = synthesizer.synthesize(rca, error);

      // Should not escape or modify - markdown will handle it
      expect(markdown).toContain('<script>alert("XSS")</script>');
    });
  });
});
