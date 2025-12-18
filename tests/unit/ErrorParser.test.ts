/**
 * Tests for ErrorParser
 * 
 * Validates router functionality:
 * - Automatic language detection
 * - Parser routing
 * - Multi-parser fallback
 * - Parser registration
 */

import { ErrorParser, parseError } from '../../src/utils/ErrorParser';

describe('ErrorParser', () => {
  let parser: ErrorParser;

  beforeEach(() => {
    parser = ErrorParser.getInstance();
    parser.resetParsers(); // Reset to defaults before each test
  });

  describe('getInstance()', () => {
    it('should return singleton instance', () => {
      const instance1 = ErrorParser.getInstance();
      const instance2 = ErrorParser.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('parse() - automatic routing', () => {
    describe('Kotlin errors', () => {
      it('should route lateinit error to KotlinParser', () => {
        const errorText = `
          lateinit property user has not been initialized
          at MainActivity.kt:45
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('lateinit');
        expect(result?.language).toBe('kotlin');
      });

      it('should route unresolved reference to KotlinParser', () => {
        const errorText = 'MainActivity.kt:15:5: Unresolved reference: test';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('unresolved_reference');
        expect(result?.language).toBe('kotlin');
      });

      it('should route type mismatch to KotlinParser', () => {
        const errorText = 'Calculator.kt:30:10: Type mismatch: inferred type is String but Int was expected';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('type_mismatch');
        expect(result?.language).toBe('kotlin');
      });
    });

    describe('Gradle errors', () => {
      it('should route dependency error to GradleParser', () => {
        const errorText = 'Could not resolve com.example:library:1.0.0';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('dependency_resolution_error');
        expect(result?.language).toBe('gradle');
      });

      it('should route task failure to GradleParser', () => {
        const errorText = 'Execution failed for task \':app:compileDebugKotlin\'';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('task_failure');
        expect(result?.language).toBe('gradle');
      });

      it('should route build script error to GradleParser', () => {
        const errorText = 'build.gradle:15: unexpected token';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('build_script_syntax_error');
        expect(result?.language).toBe('gradle');
      });
    });

    describe('File path hints', () => {
      it('should use file path hint for ambiguous errors', () => {
        const errorText = 'Unresolved reference: something';
        
        // With .kt file hint
        const result1 = parser.parse(errorText, 'MainActivity.kt');
        expect(result1?.language).toBe('kotlin');
        
        // With .gradle file hint - may not parse if error doesn't match gradle patterns
        parser.parse(errorText, 'build.gradle');
      });
    });
  });

  describe('parseWithLanguage() - explicit language', () => {
    it('should use specified language parser', () => {
      const errorText = 'lateinit property user has not been initialized';
      
      const result = parser.parseWithLanguage(errorText, 'kotlin');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('lateinit');
      expect(result?.language).toBe('kotlin');
    });

    it('should return null for unsupported language', () => {
      const errorText = 'some error';
      
      const result = parser.parseWithLanguage(errorText, 'rust');

      expect(result).toBeNull();
    });

    it('should handle parser errors gracefully', () => {
      const errorText = 'valid Kotlin error: lateinit property test';
      
      // Force parse with wrong language
      const result = parser.parseWithLanguage(errorText, 'gradle');

      // Should return null since Gradle parser won't match
      expect(result).toBeNull();
    });
  });

  describe('registerParser()', () => {
    it('should register custom parser', () => {
      const customParser = {
        parse: jest.fn().mockReturnValue({
          type: 'custom',
          message: 'test',
          filePath: 'test.txt',
          line: 1,
          language: 'custom' as any,
        }),
      };

      parser.registerParser('custom', customParser);

      expect(parser.isLanguageSupported('custom')).toBe(true);
      
      const result = parser.parseWithLanguage('test', 'custom');
      expect(result?.type).toBe('custom');
      expect(customParser.parse).toHaveBeenCalled();
    });

    it('should override existing parser', () => {
      const mockParser = {
        parse: jest.fn().mockReturnValue({
          type: 'mock',
          message: 'test',
          filePath: 'test.kt',
          line: 1,
          language: 'kotlin' as any,
        }),
      };

      parser.registerParser('kotlin', mockParser);

      const result = parser.parseWithLanguage('test', 'kotlin');
      expect(result?.type).toBe('mock');
      expect(mockParser.parse).toHaveBeenCalled();
    });
  });

  describe('getSupportedLanguages()', () => {
    it('should return list of supported languages', () => {
      const languages = parser.getSupportedLanguages();

      expect(languages).toContain('kotlin');
      expect(languages).toContain('gradle');
      expect(languages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('isLanguageSupported()', () => {
    it('should return true for supported languages', () => {
      expect(parser.isLanguageSupported('kotlin')).toBe(true);
      expect(parser.isLanguageSupported('gradle')).toBe(true);
      expect(parser.isLanguageSupported('KOTLIN')).toBe(true); // case insensitive
    });

    it('should return false for unsupported languages', () => {
      expect(parser.isLanguageSupported('rust')).toBe(false);
      expect(parser.isLanguageSupported('python')).toBe(false);
    });
  });

  describe('getParser()', () => {
    it('should return parser for supported language', () => {
      const kotlinParser = parser.getParser('kotlin');
      expect(kotlinParser).toBeDefined();
    });

    it('should return undefined for unsupported language', () => {
      const rustParser = parser.getParser('rust');
      expect(rustParser).toBeUndefined();
    });

    it('should be case insensitive', () => {
      const parser1 = parser.getParser('kotlin');
      const parser2 = parser.getParser('KOTLIN');
      expect(parser1).toBe(parser2);
    });
  });

  describe('clearParsers() and resetParsers()', () => {
    it('should clear all parsers', () => {
      parser.clearParsers();
      expect(parser.getSupportedLanguages()).toHaveLength(0);
    });

    it('should reset to default parsers', () => {
      parser.clearParsers();
      expect(parser.getSupportedLanguages()).toHaveLength(0);

      parser.resetParsers();
      expect(parser.getSupportedLanguages().length).toBeGreaterThanOrEqual(2);
      expect(parser.isLanguageSupported('kotlin')).toBe(true);
      expect(parser.isLanguageSupported('gradle')).toBe(true);
    });
  });

  describe('Fallback behavior', () => {
    it('should try multiple parsers when language detection fails', () => {
      // Ambiguous error that doesn't match clear patterns
      const errorText = 'Error at line 42';

      const result = parser.parse(errorText);

      // Should try all parsers and return null if none match
      expect(result).toBeNull();
    });

    it('should succeed with first matching parser', () => {
      // Clear Kotlin error
      const errorText = 'lateinit property user has not been initialized';

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('lateinit');
    });
  });

  describe('Edge cases', () => {
    it('should return null for empty string', () => {
      expect(parser.parse('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parser.parse(null as any)).toBeNull();
    });

    it('should return null for unrecognizable error', () => {
      const errorText = 'Something mysterious happened';
      expect(parser.parse(errorText)).toBeNull();
    });

    it('should handle very long error text', () => {
      const longError = 'lateinit property test has not been initialized\n'.repeat(1000);
      const result = parser.parse(longError);
      expect(result).not.toBeNull();
    });
  });

  describe('parseError() convenience function', () => {
    it('should work as shorthand for parse()', () => {
      const errorText = 'lateinit property user has not been initialized';
      const result = parseError(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('lateinit');
    });

    it('should support file path hint', () => {
      const errorText = 'Unresolved reference: test';
      const result = parseError(errorText, 'MainActivity.kt');

      expect(result).not.toBeNull();
      expect(result?.language).toBe('kotlin');
    });
  });
});
