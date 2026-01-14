/**
 * Tests for LanguageDetector
 * 
 * Validates language detection from error text and file paths
 */

import { LanguageDetector } from '../../src/utils/LanguageDetector';

describe('LanguageDetector', () => {
  describe('detect()', () => {
    describe('Kotlin detection', () => {
      it('should detect Kotlin from lateinit error', () => {
        const errorText = 'lateinit property user has not been initialized';
        expect(LanguageDetector.detect(errorText)).toBe('kotlin');
      });

      it('should detect Kotlin from .kt file in stack trace', () => {
        const errorText = 'Error at MainActivity.kt:45';
        expect(LanguageDetector.detect(errorText)).toBe('kotlin');
      });

      it('should detect Kotlin from kotlin.* exception', () => {
        const errorText = 'kotlin.UninitializedPropertyAccessException occurred';
        expect(LanguageDetector.detect(errorText)).toBe('kotlin');
      });

      it('should detect Kotlin from coroutine error', () => {
        const errorText = 'suspend function called outside coroutine';
        expect(LanguageDetector.detect(errorText)).toBe('kotlin');
      });

      it('should detect Kotlin from smart cast error', () => {
        const errorText = 'Smart cast to String is impossible';
        expect(LanguageDetector.detect(errorText)).toBe('kotlin');
      });
    });

    describe('Gradle detection', () => {
      it('should detect Gradle from build failed message', () => {
        const errorText = 'BUILD FAILED in 2s';
        expect(LanguageDetector.detect(errorText)).toBe('gradle');
      });

      it('should detect Gradle from dependency resolution error', () => {
        const errorText = 'Could not resolve dependency com.example:library:1.0.0';
        expect(LanguageDetector.detect(errorText)).toBe('gradle');
      });

      it('should detect Gradle from task execution error', () => {
        const errorText = 'Execution failed for task \':app:compileDebugKotlin\'';
        expect(LanguageDetector.detect(errorText)).toBe('gradle');
      });

      it('should detect Gradle from build.gradle reference', () => {
        const errorText = 'Error in build.gradle line 42';
        expect(LanguageDetector.detect(errorText)).toBe('gradle');
      });
    });

    describe('XML detection', () => {
      it('should detect XML from InflateException', () => {
        const errorText = 'InflateException: Binary XML file line #23';
        expect(LanguageDetector.detect(errorText)).toBe('xml');
      });

      it('should detect XML from layout inflation error', () => {
        const errorText = 'Error inflating class androidx.constraintlayout.widget.ConstraintLayout';
        expect(LanguageDetector.detect(errorText)).toBe('xml');
      });

      it('should detect XML from findViewById error', () => {
        const errorText = 'findViewById returned null for R.id.button';
        expect(LanguageDetector.detect(errorText)).toBe('xml');
      });

      it('should detect XML from resource not found', () => {
        const errorText = 'Resource not found: @layout/activity_main';
        expect(LanguageDetector.detect(errorText)).toBe('xml');
      });
    });

    describe('Java detection', () => {
      it('should detect Java from .java file in stack trace', () => {
        const errorText = 'at com.example.MainActivity.java:45';
        expect(LanguageDetector.detect(errorText)).toBe('java');
      });

      it('should detect Java from java.* exception', () => {
        const errorText = 'java.lang.NullPointerException at MainActivity.java:23';
        expect(LanguageDetector.detect(errorText)).toBe('java');
      });
    });

    describe('File path hints', () => {
      it('should use file path when error text is ambiguous', () => {
        const errorText = 'Error occurred';
        expect(LanguageDetector.detect(errorText, 'MainActivity.kt')).toBe('kotlin');
        expect(LanguageDetector.detect(errorText, 'build.gradle')).toBe('gradle');
        expect(LanguageDetector.detect(errorText, 'activity_main.xml')).toBe('xml');
      });

      it('should prioritize error text over file path', () => {
        const errorText = 'lateinit property user has not been initialized';
        // Even though we pass build.gradle, error is clearly Kotlin
        expect(LanguageDetector.detect(errorText, 'build.gradle')).toBe('kotlin');
      });
    });

    describe('Edge cases', () => {
      it('should return unknown for empty string', () => {
        expect(LanguageDetector.detect('')).toBe('unknown');
      });

      it('should return unknown for unrecognizable error', () => {
        const errorText = 'Something went wrong';
        expect(LanguageDetector.detect(errorText)).toBe('unknown');
      });

      it('should handle mixed language errors (Gradle wins for build errors)', () => {
        const errorText = 'Execution failed for task compiling MainActivity.kt';
        // Should detect as Gradle since it\'s a build error
        expect(LanguageDetector.detect(errorText)).toBe('gradle');
      });
    });
  });

  describe('detectFromFilePath()', () => {
    it('should detect Kotlin from .kt extension', () => {
      expect(LanguageDetector.detectFromFilePath('MainActivity.kt')).toBe('kotlin');
      expect(LanguageDetector.detectFromFilePath('src/main/MainActivity.kt')).toBe('kotlin');
    });

    it('should detect Java from .java extension', () => {
      expect(LanguageDetector.detectFromFilePath('MainActivity.java')).toBe('java');
    });

    it('should detect XML from .xml extension', () => {
      expect(LanguageDetector.detectFromFilePath('activity_main.xml')).toBe('xml');
    });

    it('should detect Gradle from .gradle extension', () => {
      expect(LanguageDetector.detectFromFilePath('build.gradle')).toBe('gradle');
      expect(LanguageDetector.detectFromFilePath('settings.gradle')).toBe('gradle');
    });

    it('should detect Gradle from .gradle.kts extension', () => {
      expect(LanguageDetector.detectFromFilePath('build.gradle.kts')).toBe('gradle');
    });

    it('should return unknown for unrecognized extension', () => {
      expect(LanguageDetector.detectFromFilePath('readme.md')).toBe('unknown');
    });

    it('should be case insensitive', () => {
      expect(LanguageDetector.detectFromFilePath('MainActivity.KT')).toBe('kotlin');
      expect(LanguageDetector.detectFromFilePath('BUILD.GRADLE')).toBe('gradle');
    });
  });

  describe('getConfidence()', () => {
    it('should return 0 for unknown language', () => {
      expect(LanguageDetector.getConfidence('some error', 'unknown')).toBe(0);
    });

    it('should return 0 for empty error text', () => {
      expect(LanguageDetector.getConfidence('', 'kotlin')).toBe(0);
    });

    it('should return high confidence for strong Kotlin indicators', () => {
      const errorText = 'lateinit property user has not been initialized at MainActivity.kt:45';
      const confidence = LanguageDetector.getConfidence(errorText, 'kotlin');
      expect(confidence).toBeGreaterThan(0.7);
    });

    it('should return high confidence for strong Gradle indicators', () => {
      const errorText = 'Execution failed for task \':app:compile\'. Gradle build failed.';
      const confidence = LanguageDetector.getConfidence(errorText, 'gradle');
      expect(confidence).toBeGreaterThan(0.7);
    });

    it('should return base confidence for weak indicators', () => {
      const errorText = 'Error in file.kt';
      const confidence = LanguageDetector.getConfidence(errorText, 'kotlin');
      expect(confidence).toBeGreaterThanOrEqual(0.5);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should never exceed 1.0', () => {
      const errorText = 'lateinit lateinit lateinit .kt: .kt: .kt:'.repeat(10);
      const confidence = LanguageDetector.getConfidence(errorText, 'kotlin');
      expect(confidence).toBeLessThanOrEqual(1.0);
    });
  });
});
