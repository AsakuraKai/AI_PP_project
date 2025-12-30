/**
 * Tests for FileResolver
 * 
 * Tests file path resolution from generic references to exact paths.
 * Target: 20+ test cases covering diverse project structures.
 */

import { FileResolver } from '../../../src/utils/FileResolver';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FileResolver', () => {
  let tempDir: string;
  let resolver: FileResolver;

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fileresolver-test-'));
    resolver = new FileResolver(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Project Structure Detection', () => {
    test('should detect version catalog project', async () => {
      // Create version catalog
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[versions]\nagp = "8.7.3"\n'
      );

      const result = await resolver.resolve('version', { 
        context: 'agp',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('gradle/libs.versions.toml');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should detect legacy project without version catalog', async () => {
      // Create root build.gradle
      await fs.writeFile(
        path.join(tempDir, 'build.gradle'),
        'buildscript {\n  ext.agp_version = "7.4.2"\n}\n'
      );

      const result = await resolver.resolve('version', {
        context: 'agp',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('build.gradle');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect multi-module project', async () => {
      // Create settings.gradle with modules
      await fs.writeFile(
        path.join(tempDir, 'settings.gradle'),
        "include ':app'\ninclude ':core'\ninclude ':feature-home'\n"
      );

      // Create module build files
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'app', 'build.gradle'), 'dependencies {\n}\n');

      const result = await resolver.resolve('dependencies', {
        module: 'app',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('app/build.gradle');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Version Resolution', () => {
    test('should resolve AGP version to version catalog', async () => {
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[versions]\nagp = "8.10.0"\nkotlin = "2.0.0"\n'
      );

      const result = await resolver.resolve('agp version', {
        context: 'AGP version 8.10.0',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('gradle/libs.versions.toml');
      expect(result.line).toBe(2); // Line with AGP
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reason).toContain('Version catalog');
    });

    test('should resolve Kotlin version to version catalog', async () => {
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[versions]\nagp = "8.7.3"\nkotlin = "2.0.0"\n'
      );

      const result = await resolver.resolve('kotlin version', {
        context: 'kotlin = "2.0.0"',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.line).toBe(3); // Line with Kotlin
    });

    test('should fallback to build.gradle if no version catalog', async () => {
      await fs.writeFile(
        path.join(tempDir, 'build.gradle'),
        'buildscript {\n  ext.kotlin_version = "1.9.0"\n}\n'
      );

      const result = await resolver.resolve('kotlin version', {
        context: 'kotlin_version',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('build.gradle');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should check gradle.properties for versions', async () => {
      await fs.writeFile(
        path.join(tempDir, 'gradle.properties'),
        'kotlin.version=1.9.0\nandroid.useAndroidX=true\n'
      );

      const result = await resolver.resolve('version', {
        context: 'kotlin.version',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('gradle.properties');
      expect(result.line).toBe(1);
    });
  });

  describe('Dependency Resolution', () => {
    test('should resolve dependency to version catalog', async () => {
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[libraries]\nandroidx-core = { group = "androidx.core", name = "core-ktx", version.ref = "core" }\n'
      );

      const result = await resolver.resolve('dependencies', {
        context: 'androidx.core',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('gradle/libs.versions.toml');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    test('should resolve to module build.gradle', async () => {
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'build.gradle'),
        'dependencies {\n  implementation "androidx.core:core-ktx:1.12.0"\n}\n'
      );

      const result = await resolver.resolve('dependencies', {
        module: 'app',
        context: 'androidx.core',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('app/build.gradle');
      expect(result.line).toBe(2);
    });

    test('should default to app/build.gradle for dependencies', async () => {
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'build.gradle'),
        'dependencies {\n  implementation libs.androidx.core\n}\n'
      );

      const result = await resolver.resolve('dependency', {
        context: 'androidx.core',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('app/build.gradle');
    });
  });

  describe('Build File Resolution', () => {
    test('should resolve "build.gradle" to root by default', async () => {
      await fs.writeFile(path.join(tempDir, 'build.gradle'), 'plugins {\n}\n');

      const result = await resolver.resolve('build.gradle', {});

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('build.gradle');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should resolve to version catalog when version context', async () => {
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[versions]\nagp = "8.7.3"\n'
      );
      await fs.writeFile(path.join(tempDir, 'build.gradle'), 'plugins {\n}\n');

      const result = await resolver.resolve('build.gradle', {
        context: 'AGP version',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('gradle/libs.versions.toml');
      expect(result.reason).toContain('Version catalog');
    });
  });

  describe('Manifest Resolution', () => {
    test('should resolve AndroidManifest.xml in app module', async () => {
      await fs.mkdir(path.join(tempDir, 'app', 'src', 'main'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'src', 'main', 'AndroidManifest.xml'),
        '<manifest></manifest>'
      );

      const result = await resolver.resolve('AndroidManifest.xml', {
        errorType: 'manifest'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('app/src/main/AndroidManifest.xml');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should resolve manifest in specified module', async () => {
      await fs.mkdir(path.join(tempDir, 'feature', 'src', 'main'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'feature', 'src', 'main', 'AndroidManifest.xml'),
        '<manifest></manifest>'
      );

      const result = await resolver.resolve('manifest', {
        module: 'feature',
        errorType: 'manifest'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toBe('feature/src/main/AndroidManifest.xml');
    });
  });

  describe('Source Code Resolution', () => {
    test('should find Kotlin source file', async () => {
      await fs.mkdir(path.join(tempDir, 'app', 'src', 'main', 'kotlin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'src', 'main', 'kotlin', 'MainActivity.kt'),
        'class MainActivity {\n  lateinit var viewModel: ViewModel\n}\n'
      );

      const result = await resolver.resolve('MainActivity.kt', {
        errorType: 'kotlin-npe'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toContain('MainActivity.kt');
      expect(result.confidence).toBeGreaterThan(0.85);
    });

    test('should find Java source file', async () => {
      await fs.mkdir(path.join(tempDir, 'app', 'src', 'main', 'java'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'src', 'main', 'java', 'Utils.java'),
        'public class Utils {}\n'
      );

      const result = await resolver.resolve('Utils.java', {
        errorType: 'java-error'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toContain('Utils.java');
    });

    test('should find XML layout file', async () => {
      await fs.mkdir(path.join(tempDir, 'app', 'src', 'main', 'res', 'layout'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'src', 'main', 'res', 'layout', 'activity_main.xml'),
        '<LinearLayout></LinearLayout>'
      );

      const result = await resolver.resolve('activity_main.xml', {
        errorType: 'xml-error'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toContain('activity_main.xml');
    });
  });

  describe('Line Number Detection', () => {
    test('should find exact line with context', async () => {
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[versions]\nagp = "8.10.0"\nkotlin = "2.0.0"\ncompose = "1.6.0"\n'
      );

      const result = await resolver.resolve('version', {
        context: 'agp = "8.10.0"',
        errorType: 'gradle-dependency'
      });

      expect(result.line).toBe(2); // AGP is on line 2
    });

    test('should find line with partial match', async () => {
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'build.gradle'),
        'dependencies {\n  implementation libs.androidx.core\n  implementation libs.compose.ui\n}\n'
      );

      const result = await resolver.resolve('dependencies', {
        context: 'androidx.core',
        module: 'app'
      });

      expect(result.line).toBe(2); // androidx.core is on line 2
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing file gracefully', async () => {
      const result = await resolver.resolve('nonexistent.gradle', {
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.path).toBe('');
    });

    test('should suggest creation for missing version catalog', async () => {
      const result = await resolver.resolve('version', {
        context: 'agp',
        errorType: 'gradle-dependency'
      });

      expect(result.exists).toBe(false);
      expect(result.creationSuggestion).toContain('gradle/libs.versions.toml');
    });

    test('should handle absolute paths', async () => {
      const absolutePath = path.join(tempDir, 'custom.gradle');
      await fs.writeFile(absolutePath, 'plugins {}\n');

      const result = await resolver.resolve(absolutePath, {});

      expect(result.exists).toBe(true);
      expect(result.path).toBe(absolutePath);
    });

    test('should handle deep directory structures', async () => {
      await fs.mkdir(
        path.join(tempDir, 'modules', 'feature', 'src', 'main', 'kotlin'),
        { recursive: true }
      );
      await fs.writeFile(
        path.join(tempDir, 'modules', 'feature', 'src', 'main', 'kotlin', 'Feature.kt'),
        'class Feature {}\n'
      );

      const result = await resolver.resolve('Feature.kt', {
        errorType: 'kotlin-error'
      });

      expect(result.exists).toBe(true);
      expect(result.relativePath).toContain('Feature.kt');
    });

    test('should cache project structure', async () => {
      // Create files
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[versions]\n'
      );

      // First call
      const result1 = await resolver.resolve('version', { context: 'agp' });
      expect(result1.relativePath).toBe('gradle/libs.versions.toml');
      expect(result1.exists).toBe(true);
      
      // Delete file (cache still remembers structure, but fileExists will fail)
      await fs.rm(path.join(tempDir, 'gradle', 'libs.versions.toml'));
      
      // Second call (cache says version catalog exists, but file check should detect it's gone)
      const result2 = await resolver.resolve('version', { context: 'agp' });
      
      // The path should be the same (cached structure), but exists should be false
      expect(result2.relativePath).toBe('gradle/libs.versions.toml');
      expect(result2.exists).toBe(false);

      // Clear cache
      resolver.clearCache();
      
      // Third call (no cached structure, should try build.gradle or fail)
      const result3 = await resolver.resolve('version', { context: 'agp' });
      
      // Should fallback or return not found
      expect(result3.relativePath).not.toBe('gradle/libs.versions.toml');
    });
  });

  describe('Context-Aware Resolution', () => {
    test('should prioritize version catalog for AGP errors', async () => {
      // Create both files
      await fs.mkdir(path.join(tempDir, 'gradle'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'gradle', 'libs.versions.toml'),
        '[versions]\nagp = "8.7.3"\n'
      );
      await fs.writeFile(
        path.join(tempDir, 'build.gradle'),
        'buildscript {\n  ext.agp_version = "7.4.2"\n}\n'
      );

      const result = await resolver.resolve('build.gradle', {
        context: 'AGP version',
        errorMessage: 'Could not find com.android.tools.build:gradle:8.10.0',
        errorType: 'gradle-dependency'
      });

      // Should prefer version catalog
      expect(result.relativePath).toBe('gradle/libs.versions.toml');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should use error message for context', async () => {
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'app', 'build.gradle'),
        'dependencies {\n  implementation "androidx.core:core-ktx:1.12.0"\n}\n'
      );

      const result = await resolver.resolve('dependencies', {
        errorMessage: 'Could not find androidx.core:core-ktx:1.12.0',
        module: 'app'
      });

      expect(result.exists).toBe(true);
      expect(result.line).toBe(2);
    });
  });
});
