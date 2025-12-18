/**
 * Tests for GradleParser
 * 
 * Validates parsing of Gradle build errors:
 * - Dependency resolution errors
 * - Dependency version conflicts
 * - Task execution failures
 * - Build script syntax errors
 * - Compilation errors
 */

import { GradleParser } from '../../src/utils/parsers/GradleParser';

describe('GradleParser', () => {
  let parser: GradleParser;

  beforeEach(() => {
    parser = new GradleParser();
  });

  describe('parse() - dependency resolution errors', () => {
    it('should parse "Could not resolve" error', () => {
      const errorText = `
        FAILURE: Build failed with an exception.
        
        * What went wrong:
        Could not resolve com.google.android.material:material:1.9.0
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_resolution_error');
      expect(result?.metadata?.dependency).toBe('com.google.android.material:material:1.9.0');
      expect(result?.metadata?.group).toBe('com.google.android.material');
      expect(result?.metadata?.artifact).toBe('material');
      expect(result?.metadata?.version).toBe('1.9.0');
      expect(result?.language).toBe('gradle');
    });

    it('should parse "Could not find" error', () => {
      const errorText = `
        Could not find androidx.core:core-ktx:1.15.0
        Searched in the following locations:
          - https://repo.maven.apache.org/...
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_resolution_error');
      expect(result?.metadata?.dependency).toBe('androidx.core:core-ktx:1.15.0');
      expect(result?.metadata?.group).toBe('androidx.core');
      expect(result?.metadata?.artifact).toBe('core-ktx');
      expect(result?.metadata?.version).toBe('1.15.0');
    });

    it('should parse "Could not download" error', () => {
      const errorText = `
        Could not download com.squareup.okhttp3:okhttp:4.10.0
        Connection timeout
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_resolution_error');
      expect(result?.metadata?.dependency).toBe('com.squareup.okhttp3:okhttp:4.10.0');
    });

    it('should parse "Failed to resolve" error', () => {
      const errorText = `
        Failed to resolve: com.github.bumptech.glide:glide:4.14.2
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_resolution_error');
      expect(result?.metadata?.dependency).toBe('com.github.bumptech.glide:glide:4.14.2');
    });
  });

  describe('parse() - dependency conflicts', () => {
    it('should parse version conflict', () => {
      const errorText = `
        Conflict with dependency 'com.google.guava:guava' (26.0-android) and (27.0-jre)
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_conflict');
      expect(result?.metadata?.module).toBe('com.google.guava:guava');
      // Should contain at least one version
      expect(result?.metadata?.conflictingVersions.length).toBeGreaterThan(0);
      expect(result?.language).toBe('gradle');
    });

    it('should parse multiple versions error', () => {
      const errorText = `
        Multiple versions of 'com.google.code.gson:gson' found in dependencies
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_conflict');
      expect(result?.metadata?.module).toBe('com.google.code.gson:gson');
    });

    it('should parse version conflict with "Version conflict" text', () => {
      const errorText = `
        Version conflict for module 'org.jetbrains.kotlin:kotlin-stdlib'
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_conflict');
      expect(result?.metadata?.module).toBe('org.jetbrains.kotlin:kotlin-stdlib');
    });
  });

  describe('parse() - task failures', () => {
    it('should parse task execution failure', () => {
      const errorText = `
        FAILURE: Build failed with an exception.
        
        * What went wrong:
        Execution failed for task ':app:compileDebugKotlin'.
        > Compilation error. See log for more details.
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('task_failure');
      expect(result?.metadata?.taskName).toBe(':app:compileDebugKotlin');
      expect(result?.metadata?.reason).toContain('Compilation error');
      expect(result?.language).toBe('gradle');
    });

    it('should parse task failure with Caused by', () => {
      const errorText = `
        Execution failed for task ':app:processDebugResources'.
        Caused by: com.android.ide.common.process.ProcessException: Failed to execute aapt
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('task_failure');
      expect(result?.metadata?.taskName).toBe(':app:processDebugResources');
      expect(result?.metadata?.reason).toContain('ProcessException');
    });

    it('should parse task failure with > reason format', () => {
      const errorText = `
        Execution failed for task ':app:lintVitalRelease'.
        > Lint found errors in the project; aborting build.
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('task_failure');
      expect(result?.metadata?.reason).toContain('Lint found errors');
    });
  });

  describe('parse() - build script syntax errors', () => {
    it('should parse build.gradle syntax error', () => {
      const errorText = `
        build.gradle: 15: unexpected token: {
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('build_script_syntax_error');
      expect(result?.filePath).toBe('build.gradle');
      expect(result?.line).toBe(15);
      expect(result?.metadata?.description).toContain('unexpected token');
      expect(result?.language).toBe('gradle');
    });

    it('should parse build.gradle.kts syntax error', () => {
      const errorText = `
        build.gradle.kts:42: Unresolved reference: implementation
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('build_script_syntax_error');
      expect(result?.filePath).toBe('build.gradle.kts');
      expect(result?.line).toBe(42);
    });

    it('should parse script line error format', () => {
      const errorText = `
        Script 'app/build.gradle' line: 28 unexpected symbol
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('build_script_syntax_error');
      expect(result?.filePath).toBe('app/build.gradle');
      expect(result?.line).toBe(28);
    });
  });

  describe('parse() - compilation errors', () => {
    it('should parse compilation error reported by Gradle', () => {
      const errorText = `
        Compilation failed; see the compiler error output for details.
        e: MainActivity.kt:15: Unresolved reference: test
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compilation_error');
      expect(result?.metadata?.description).toBeTruthy();
      expect(result?.language).toBe('gradle');
    });

    it('should parse compilation error with file reference', () => {
      const errorText = `
        Compilation error. See log for more details.
        error: UserActivity.kt:42: Type mismatch
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compilation_error');
      expect(result?.filePath).toBe('UserActivity.kt');
      expect(result?.line).toBe(42);
    });

    it('should extract description from error: prefix', () => {
      const errorText = `
        Compilation failed
        error: lateinit property not initialized
      `.trim();

      const result = parser.parse(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compilation_error');
      expect(result?.metadata?.description).toContain('lateinit');
    });
  });

  describe('isGradleError()', () => {
    it('should return true for Gradle errors', () => {
      expect(GradleParser.isGradleError('BUILD FAILED')).toBe(true);
      expect(GradleParser.isGradleError('Could not resolve dependency')).toBe(true);
      expect(GradleParser.isGradleError('Execution failed for task :app:compile')).toBe(true);
      expect(GradleParser.isGradleError('Error in build.gradle')).toBe(true);
      expect(GradleParser.isGradleError('Gradle build failed')).toBe(true);
    });

    it('should return false for non-Gradle errors', () => {
      expect(GradleParser.isGradleError('')).toBe(false);
      expect(GradleParser.isGradleError('lateinit property not initialized')).toBe(false);
      expect(GradleParser.isGradleError('Something went wrong')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should return null for empty string', () => {
      expect(parser.parse('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parser.parse(null as any)).toBeNull();
    });

    it('should return null for non-Gradle error', () => {
      expect(parser.parse('lateinit property not initialized')).toBeNull();
    });

    it('should handle very long error text', () => {
      const longError = 'Could not resolve com.example:library:1.0.0\n'.repeat(5000);
      const result = parser.parse(longError);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_resolution_error');
    });

    it('should default to build.gradle when no file found', () => {
      const errorText = 'Execution failed for task \':app:compile\'';
      const result = parser.parse(errorText);
      expect(result).not.toBeNull();
      expect(result?.filePath).toBe('build.gradle');
    });

    it('should handle missing version in dependency', () => {
      const errorText = 'Could not resolve com.example:library';
      const result = parser.parse(errorText);
      expect(result).not.toBeNull();
      expect(result?.metadata?.version).toBe('unspecified');
    });
  });
});
