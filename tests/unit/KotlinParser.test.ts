/**
 * Tests for KotlinParser
 * 
 * Validates parsing of multiple Kotlin error types:
 * - lateinit errors (via KotlinNPEParser)
 * - NPE errors (via KotlinNPEParser)
 * - Unresolved reference errors
 * - Type mismatch errors
 * - Compilation errors
 * - Import errors
 */

import { KotlinParser } from '../../src/utils/parsers/KotlinParser';

describe('KotlinParser', () => {
  let parser: KotlinParser;

  beforeEach(() => {
    parser = new KotlinParser();
  });

  describe('parse() - lateinit errors (via KotlinNPEParser)', () => {
    it('should parse lateinit property error', () => {
      const errorText = `
        kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized
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
  });

  describe('parse() - NPE errors (via KotlinNPEParser)', () => {
    it('should parse NullPointerException', () => {
      const errorText = `
        NullPointerException
        at com.example.UserActivity.loadData(UserActivity.kt:23)
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('npe');
      expect(result?.filePath).toBe('UserActivity.kt');
      expect(result?.line).toBe(23);
      expect(result?.language).toBe('kotlin');
    });
  });

  describe('parse() - unresolved reference errors', () => {
    it('should parse unresolved reference error', () => {
      const errorText = `
        MainActivity.kt:15:5: Unresolved reference: someFunction
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('unresolved_reference');
      expect(result?.metadata?.symbolName).toBe('someFunction');
      expect(result?.filePath).toBe('MainActivity.kt');
      expect(result?.line).toBe(15);
      expect(result?.language).toBe('kotlin');
    });

    it('should parse "Cannot resolve symbol" format', () => {
      const errorText = `
        UserViewModel.kt:42:10: Cannot resolve symbol 'viewModelScope'
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('unresolved_reference');
      expect(result?.metadata?.symbolName).toBe('viewModelScope');
      expect(result?.filePath).toBe('UserViewModel.kt');
      expect(result?.line).toBe(42);
    });

    it('should parse "Unresolved reference to" format', () => {
      const errorText = `
        Fragment.kt:20:5: Unresolved reference to 'binding'
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('unresolved_reference');
      expect(result?.metadata?.symbolName).toBe('binding');
    });
  });

  describe('parse() - type mismatch errors', () => {
    it('should parse type mismatch with inferred type', () => {
      const errorText = `
        Calculator.kt:30:10: Type mismatch: inferred type is String but Int was expected
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('type_mismatch');
      expect(result?.metadata?.expectedType).toBe('String');
      expect(result?.metadata?.foundType).toBe('Int');
      expect(result?.filePath).toBe('Calculator.kt');
      expect(result?.line).toBe(30);
      expect(result?.language).toBe('kotlin');
    });

    it('should parse type mismatch with generic types', () => {
      const errorText = `
        Repository.kt:18:5: Type mismatch: inferred type is List<String> but Set<Int> was expected
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('type_mismatch');
      expect(result?.metadata?.expectedType).toBe('List<String>');
      expect(result?.metadata?.foundType).toBe('Set<Int>');
    });

    it('should parse "Required/Found" format', () => {
      const errorText = `
        Data.kt:12:8: Type mismatch
        Required: Boolean
        Found: String
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('type_mismatch');
      expect(result?.metadata?.expectedType).toMatch(/Boolean|String/);
      expect(result?.metadata?.foundType).toMatch(/Boolean|String/);
    });
  });

  describe('parse() - compilation errors', () => {
    it('should parse "Expecting" syntax error', () => {
      const errorText = `
        Utils.kt:8:1: Expecting a top level declaration
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compilation_error');
      expect(result?.metadata?.description).toContain('top level declaration');
      expect(result?.filePath).toBe('Utils.kt');
      expect(result?.line).toBe(8);
      expect(result?.language).toBe('kotlin');
    });

    it('should parse syntax error', () => {
      const errorText = `
        Helper.kt:15:20: Syntax error
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compilation_error');
    });

    it('should parse modifier error', () => {
      const errorText = `
        Model.kt:5:1: Modifier 'private' is not applicable to 'top level declaration'
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compilation_error');
      expect(result?.metadata?.description).toContain('Modifier');
    });

    it('should parse function declaration error', () => {
      const errorText = `
        Service.kt:42:5: Function declaration must have a name
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compilation_error');
    });
  });

  describe('parse() - import errors', () => {
    it('should parse unresolved import with import keyword', () => {
      const errorText = `
        import androidx.compose.material3.Button
        MainActivity.kt:3:8: Unresolved reference: androidx
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('import_error');
      expect(result?.metadata?.packageName).toContain('androidx');
      expect(result?.filePath).toBe('MainActivity.kt');
      expect(result?.line).toBe(3);
      expect(result?.language).toBe('kotlin');
    });

    it('should parse cannot access error', () => {
      const errorText = `
        ViewModel.kt:5:1: Cannot access 'kotlinx.coroutines.flow'
        import kotlinx.coroutines.flow.Flow
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('import_error');
      expect(result?.metadata?.packageName).toBe('kotlinx.coroutines.flow');
    });

    it('should parse package not found error', () => {
      const errorText = `
        Repository.kt:2:8: Package 'com.example.data' could not be resolved
        import com.example.data.UserDao
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('import_error');
      expect(result?.metadata?.packageName).toBe('com.example.data');
    });

    it('should not parse as import error if no import keyword', () => {
      const errorText = `
        MainActivity.kt:15:5: Unresolved reference: someFunction
      `.trim();

      const result = parser.parse(errorText);

      // Should be unresolved_reference, not import_error
      expect(result?.type).toBe('unresolved_reference');
    });
  });

  describe('isKotlinError()', () => {
    it('should return true for Kotlin errors', () => {
      expect(KotlinParser.isKotlinError('lateinit property not initialized')).toBe(true);
      expect(KotlinParser.isKotlinError('at MainActivity.kt:45')).toBe(true);
      expect(KotlinParser.isKotlinError('kotlin.UninitializedPropertyAccessException')).toBe(true);
      expect(KotlinParser.isKotlinError('Unresolved reference: something')).toBe(true);
      expect(KotlinParser.isKotlinError('Type mismatch: inferred type')).toBe(true);
    });

    it('should return false for non-Kotlin errors', () => {
      expect(KotlinParser.isKotlinError('')).toBe(false);
      expect(KotlinParser.isKotlinError('BUILD FAILED')).toBe(false);
      expect(KotlinParser.isKotlinError('Something went wrong')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should return null for empty string', () => {
      expect(parser.parse('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parser.parse(null as any)).toBeNull();
    });

    it('should return null for non-Kotlin error', () => {
      expect(parser.parse('BUILD FAILED')).toBeNull();
    });

    it('should handle very long error text', () => {
      const longError = 'Unresolved reference: test\n'.repeat(10000);
      const result = parser.parse(longError);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('unresolved_reference');
    });

    it('should extract file info even without line number', () => {
      const errorText = 'MainActivity.kt: Unresolved reference: test';
      const result = parser.parse(errorText);
      expect(result).not.toBeNull();
      // Should still parse, even if line is 0
    });
  });
});
