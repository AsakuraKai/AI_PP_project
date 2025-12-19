/**
 * Tests for AndroidBuildTool
 * 
 * Validates:
 * - Gradle error parsing (delegates to GradleParser)
 * - Version resolution recommendations
 * - Dependency conflict analysis
 * - Repository diagnostics
 * - Groovy and Kotlin DSL code generation
 */

import { AndroidBuildTool } from '../../src/tools/AndroidBuildTool';

describe('AndroidBuildTool', () => {
  let tool: AndroidBuildTool;

  beforeEach(() => {
    tool = new AndroidBuildTool();
  });

  describe('parseBuildError()', () => {
    it('should delegate to GradleParser for dependency resolution errors', () => {
      const errorText = `
        FAILURE: Build failed with an exception.
        
        * What went wrong:
        Could not resolve com.google.android.material:material:1.9.0
      `.trim();

      const result = tool.parseBuildError(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_resolution_error');
      expect(result?.metadata?.dependency).toBe('com.google.android.material:material:1.9.0');
    });

    it('should delegate to GradleParser for dependency conflicts', () => {
      const errorText = `
        Conflict with dependency 'com.google.guava:guava' (28.0-android) and (30.1-android)
      `.trim();

      const result = tool.parseBuildError(errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('dependency_conflict');
    });

    it('should return null for non-Gradle errors', () => {
      const errorText = 'NullPointerException at MainActivity.kt:45';
      const result = tool.parseBuildError(errorText);
      expect(result).toBeNull();
    });
  });

  describe('recommendResolution()', () => {
    it('should recommend highest version for dependency conflict', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict with com.google.guava:guava',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.google.guava:guava',
          conflictingVersions: ['28.0-android', '30.1-android'],
        },
      };

      const resolution = tool.recommendResolution(error);

      expect(resolution).not.toBeNull();
      expect(resolution?.recommended).toBe('30.1-android');
      expect(resolution?.reason).toContain('highest version');
      expect(resolution?.implementation.groovy).toContain("'com.google.guava:guava:30.1-android'");
      expect(resolution?.implementation.kotlin).toContain('"com.google.guava:guava:30.1-android"');
    });

    it('should handle semantic versioning correctly', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Version conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'androidx.core:core-ktx',
          conflictingVersions: ['1.9.0', '1.12.0', '1.10.1'],
        },
      };

      const resolution = tool.recommendResolution(error);

      expect(resolution).not.toBeNull();
      expect(resolution?.recommended).toBe('1.12.0'); // Should select 1.12.0 over 1.10.1 and 1.9.0
    });

    it('should handle single version gracefully', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.example:library',
          conflictingVersions: ['1.0.0'],
        },
      };

      const resolution = tool.recommendResolution(error);

      expect(resolution).not.toBeNull();
      expect(resolution?.recommended).toBe('1.0.0');
      expect(resolution?.reason).toContain('Only one version');
    });

    it('should provide repository configuration for resolution errors', () => {
      const error = {
        type: 'dependency_resolution_error' as const,
        message: 'Could not resolve',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          dependency: 'com.example:library:1.0.0',
          module: 'com.example:library',
          conflictingVersions: [],
        },
      };

      const resolution = tool.recommendResolution(error);

      expect(resolution).not.toBeNull();
      expect(resolution?.reason).toContain('not found in configured repositories');
      expect(resolution?.implementation.groovy).toContain('repositories');
    });

    it('should return null for non-dependency errors', () => {
      const error = {
        type: 'task_failure' as const,
        message: 'Task failed',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {},
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution).toBeNull();
    });

    it('should generate valid Groovy DSL code', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.google.code.gson:gson',
          conflictingVersions: ['2.8.9', '2.10.1'],
        },
      };

      const resolution = tool.recommendResolution(error);

      expect(resolution?.implementation.groovy).toContain('configurations.all');
      expect(resolution?.implementation.groovy).toContain('resolutionStrategy');
      expect(resolution?.implementation.groovy).toContain("force 'com.google.code.gson:gson:2.10.1'");
      expect(resolution?.implementation.groovy).toContain('dependencies');
      expect(resolution?.implementation.groovy).toContain('exclude');
    });

    it('should generate valid Kotlin DSL code', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle.kts',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.google.code.gson:gson',
          conflictingVersions: ['2.8.9', '2.10.1'],
        },
      };

      const resolution = tool.recommendResolution(error);

      expect(resolution?.implementation.kotlin).toContain('configurations.all');
      expect(resolution?.implementation.kotlin).toContain('resolutionStrategy');
      expect(resolution?.implementation.kotlin).toContain('force("com.google.code.gson:gson:2.10.1")');
      expect(resolution?.implementation.kotlin).toContain('dependencies');
      expect(resolution?.implementation.kotlin).toContain('exclude');
    });
  });

  describe('analyzeDependencyConflict()', () => {
    it('should provide detailed conflict analysis', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'org.jetbrains.kotlin:kotlin-stdlib',
          conflictingVersions: ['1.8.0', '1.9.0', '1.9.22'],
        },
      };

      const analysis = tool.analyzeDependencyConflict(error);

      expect(analysis).not.toBeNull();
      expect(analysis?.module).toBe('org.jetbrains.kotlin:kotlin-stdlib');
      expect(analysis?.requestedVersions).toEqual(['1.8.0', '1.9.0', '1.9.22']);
      expect(analysis?.conflicts).toHaveLength(3);
      expect(analysis?.recommendation.recommended).toBe('1.9.22');
    });

    it('should return null for non-conflict errors', () => {
      const error = {
        type: 'task_failure' as const,
        message: 'Task failed',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {},
      };

      const analysis = tool.analyzeDependencyConflict(error);
      expect(analysis).toBeNull();
    });
  });

  describe('diagnoseRepositoryIssues()', () => {
    it('should diagnose Android library repository issues', () => {
      const error = {
        type: 'dependency_resolution_error' as const,
        message: 'Could not resolve',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          dependency: 'androidx.appcompat:appcompat:1.6.1',
          group: 'androidx.appcompat',
        },
      };

      const diagnosis = tool.diagnoseRepositoryIssues(error);

      expect(diagnosis).not.toBeNull();
      expect(diagnosis).toContain('Android/AndroidX library');
      expect(diagnosis).toContain('google()');
    });

    it('should diagnose Kotlin library repository issues', () => {
      const error = {
        type: 'dependency_resolution_error' as const,
        message: 'Could not resolve',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          dependency: 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0',
          group: 'org.jetbrains.kotlin',
        },
      };

      const diagnosis = tool.diagnoseRepositoryIssues(error);

      expect(diagnosis).not.toBeNull();
      expect(diagnosis).toContain('Kotlin library');
      expect(diagnosis).toContain('mavenCentral()');
    });

    it('should suggest common repositories for third-party libraries', () => {
      const error = {
        type: 'dependency_resolution_error' as const,
        message: 'Could not resolve',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          dependency: 'com.squareup.retrofit2:retrofit:2.9.0',
          group: 'com.squareup.retrofit2',
        },
      };

      const diagnosis = tool.diagnoseRepositoryIssues(error);

      expect(diagnosis).not.toBeNull();
      expect(diagnosis).toContain('Third-party library');
      expect(diagnosis).toContain('google()');
      expect(diagnosis).toContain('mavenCentral()');
      expect(diagnosis).toContain('jitpack.io');
    });

    it('should return null for non-resolution errors', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {},
      };

      const diagnosis = tool.diagnoseRepositoryIssues(error);
      expect(diagnosis).toBeNull();
    });
  });

  describe('isBuildError()', () => {
    it('should detect Gradle build errors', () => {
      const texts = [
        'Could not resolve com.example:library:1.0.0',
        'Execution failed for task :app:compileDebugKotlin',
        'BUILD FAILED in 5s',
        'build.gradle: 15: unexpected token',
      ];

      texts.forEach(text => {
        expect(AndroidBuildTool.isBuildError(text)).toBe(true);
      });
    });

    it('should return false for non-Gradle errors', () => {
      const texts = [
        'NullPointerException at MainActivity.kt:45',
        'lateinit property user has not been initialized',
        'Type mismatch: inferred type is String but Int was expected',
      ];

      texts.forEach(text => {
        expect(AndroidBuildTool.isBuildError(text)).toBe(false);
      });
    });
  });

  describe('Version comparison', () => {
    it('should handle version prefixes (v, V)', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.example:library',
          conflictingVersions: ['v1.0.0', 'V2.0.0', '1.5.0'],
        },
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution?.recommended).toBe('V2.0.0'); // Highest version
    });

    it('should handle versions with different part counts', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.example:library',
          conflictingVersions: ['1.0', '1.0.0', '1.0.0.0'],
        },
      };

      const resolution = tool.recommendResolution(error);
      // All versions are equal (1.0 = 1.0.0 = 1.0.0.0), first equal highest is returned
      expect(['1.0', '1.0.0', '1.0.0.0']).toContain(resolution?.recommended);
    });

    it('should handle major version differences', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.example:library',
          conflictingVersions: ['2.0.0', '1.99.99', '3.0.0'],
        },
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution?.recommended).toBe('3.0.0');
    });

    it('should handle minor version differences', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.example:library',
          conflictingVersions: ['1.5.0', '1.12.0', '1.3.0'],
        },
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution?.recommended).toBe('1.12.0');
    });

    it('should handle patch version differences', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.example:library',
          conflictingVersions: ['1.0.5', '1.0.12', '1.0.3'],
        },
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution?.recommended).toBe('1.0.12');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty conflicting versions array', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'com.example:library',
          conflictingVersions: [],
        },
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution).not.toBeNull();
    });

    it('should handle missing metadata', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {},
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution).toBeNull();
    });

    it('should handle malformed module names', () => {
      const error = {
        type: 'dependency_conflict' as const,
        message: 'Conflict',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle' as const,
        metadata: {
          module: 'invalid-module-name',
          conflictingVersions: ['1.0.0'],
        },
      };

      const resolution = tool.recommendResolution(error);
      expect(resolution).not.toBeNull();
      expect(resolution?.implementation.groovy).toContain('invalid-module-name');
    });
  });
});
