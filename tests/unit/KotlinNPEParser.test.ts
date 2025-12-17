/**
 * Unit tests for KotlinNPEParser
 */

import { KotlinNPEParser } from '../../src/utils/KotlinNPEParser';

describe('KotlinNPEParser', () => {
  let parser: KotlinNPEParser;

  beforeEach(() => {
    parser = new KotlinNPEParser();
  });

  describe('parse()', () => {
    describe('when parsing lateinit error', () => {
      it('should extract property name from error message', () => {
        const errorText = `
          kotlin.UninitializedPropertyAccessException: 
          lateinit property user has not been initialized
          at com.example.MainActivity.onCreate(MainActivity.kt:45)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('lateinit');
        expect(result?.metadata?.propertyName).toBe('user');
        expect(result?.filePath).toBe('MainActivity.kt');
        expect(result?.line).toBe(45);
        expect(result?.language).toBe('kotlin');
      });

      it('should handle simple lateinit format', () => {
        const errorText = 'lateinit property repository has not been initialized';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('lateinit');
        expect(result?.metadata?.propertyName).toBe('repository');
      });

      it('should handle missing file path gracefully', () => {
        const errorText = 'lateinit property user has not been initialized';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.filePath).toBe('unknown');
        expect(result?.line).toBe(0);
      });

      it('should extract stack trace with multiple frames', () => {
        const errorText = `
          lateinit property binding has not been initialized
          at com.example.MainActivity.setupUI(MainActivity.kt:67)
          at com.example.MainActivity.onCreate(MainActivity.kt:45)
          at android.app.Activity.performCreate(Activity.java:7224)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.stackTrace).toHaveLength(2); // Only .kt files
        expect(result?.stackTrace?.[0].file).toBe('MainActivity.kt');
        expect(result?.stackTrace?.[0].line).toBe(67);
        expect(result?.stackTrace?.[0].function).toBe('setupUI');
      });
    });

    describe('when parsing NullPointerException', () => {
      it('should parse standard NPE', () => {
        const errorText = `
          NullPointerException
          at MainActivity.kt:42
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('npe');
        expect(result?.filePath).toBe('MainActivity.kt');
        expect(result?.line).toBe(42);
      });

      it('should parse NPE with full stack trace', () => {
        const errorText = `
          java.lang.NullPointerException: Attempt to invoke virtual method
          at com.example.UserRepository.getUser(UserRepository.kt:23)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('npe');
        expect(result?.filePath).toBe('UserRepository.kt');
        expect(result?.line).toBe(23);
      });
    });

    describe('when parsing non-Kotlin error', () => {
      it('should return null for JavaScript error', () => {
        const errorText = 'TypeError: Cannot read property of undefined';

        const result = parser.parse(errorText);

        expect(result).toBeNull();
      });

      it('should return null for Python error', () => {
        const errorText = 'AttributeError: module has no attribute';

        const result = parser.parse(errorText);

        expect(result).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(parser.parse('')).toBeNull();
      });

      it('should handle null input', () => {
        expect(parser.parse(null as any)).toBeNull();
      });

      it('should handle undefined input', () => {
        expect(parser.parse(undefined as any)).toBeNull();
      });

      it('should handle multiline stack traces', () => {
        const errorText = `
          NullPointerException
          at MainActivity.kt:45
          at Fragment.kt:23
          at Activity.kt:12
        `.trim();

        const result = parser.parse(errorText);
        
        expect(result).not.toBeNull();
        expect(result?.line).toBe(45); // First occurrence
        expect(result?.stackTrace).toHaveLength(3);
      });

      it('should handle very long error messages', () => {
        const longError = 'lateinit property test has not been initialized\n' + 'x'.repeat(100000);
        
        const result = parser.parse(longError);
        
        expect(result).not.toBeNull();
        expect(result?.type).toBe('lateinit');
        // Should truncate to 50000 chars
      });

      it('should handle special characters in property names', () => {
        const errorText = 'lateinit property _user123 has not been initialized';

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.metadata?.propertyName).toBe('_user123');
      });
    });
  });

  describe('isKotlinError()', () => {
    it('should identify .kt file references', () => {
      expect(KotlinNPEParser.isKotlinError('Error at MainActivity.kt:45')).toBe(true);
    });

    it('should identify lateinit keyword', () => {
      expect(KotlinNPEParser.isKotlinError('lateinit property not initialized')).toBe(true);
    });

    it('should identify kotlin namespace', () => {
      expect(KotlinNPEParser.isKotlinError('kotlin.UninitializedPropertyAccessException')).toBe(true);
    });

    it('should return false for non-Kotlin errors', () => {
      expect(KotlinNPEParser.isKotlinError('TypeError in file.js')).toBe(false);
    });

    it('should handle empty input', () => {
      expect(KotlinNPEParser.isKotlinError('')).toBe(false);
    });
  });

  describe('getSupportedTypes()', () => {
    it('should return array of supported error types', () => {
      const types = KotlinNPEParser.getSupportedTypes();
      
      expect(Array.isArray(types)).toBe(true);
      expect(types).toContain('lateinit');
      expect(types).toContain('npe');
    });
  });
});
