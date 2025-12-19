/**
 * Unit Tests: ManifestAnalyzerTool
 * 
 * Tests manifest error parsing and analysis:
 * - Merge conflict detection
 * - Missing permission detection
 * - Undeclared component detection
 * - Permission recommendations
 * - Component declaration generation
 */

import { ManifestAnalyzerTool } from '../../src/tools/ManifestAnalyzerTool';
import { ParsedError } from '../../src/types';

describe('ManifestAnalyzerTool', () => {
  let tool: ManifestAnalyzerTool;

  beforeEach(() => {
    tool = new ManifestAnalyzerTool();
  });

  describe('parseManifestError()', () => {
    describe('Manifest Merge Conflicts', () => {
      it('should parse generic manifest merge conflict', () => {
        const output = `
          Manifest merger failed with multiple errors, see logs
          Error: Attribute application@theme value=(@style/AppTheme) from AndroidManifest.xml
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_merge_conflict');
        expect(result?.filePath).toBe('AndroidManifest.xml');
        expect(result?.language).toBe('xml');
        expect(result?.framework).toBe('android');
      });

      it('should parse attribute conflict', () => {
        const output = `
          AAPT: error: attribute android:theme has already been defined
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_merge_conflict');
        expect(result?.metadata?.conflictType).toBe('attribute');
        expect(result?.metadata?.conflictAttribute).toBe('android:theme');
      });

      it('should parse element conflict', () => {
        const output = `
          Manifest merger failed: element <provider> conflicts with another element
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_merge_conflict');
        expect(result?.metadata?.conflictType).toBe('element');
        expect(result?.metadata?.conflictElement).toBe('provider');
      });
    });

    describe('Missing Permissions', () => {
      it('should parse missing CAMERA permission', () => {
        const output = `
          java.lang.SecurityException: Permission denial: starting Intent
          requires android.permission.CAMERA
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_missing_permission');
        expect(result?.metadata?.requiredPermission).toBe('android.permission.CAMERA');
        expect(result?.metadata?.permissionName).toBe('CAMERA');
        expect(result?.metadata?.isDangerous).toBe(true);
      });

      it('should parse missing INTERNET permission', () => {
        const output = `
          Permission denial: requires INTERNET
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_missing_permission');
        expect(result?.metadata?.requiredPermission).toBe('android.permission.INTERNET');
        expect(result?.metadata?.isDangerous).toBe(false);
      });

      it('should parse missing location permission', () => {
        const output = `
          Permission denial: requires ACCESS_FINE_LOCATION
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.metadata?.permissionName).toBe('ACCESS_FINE_LOCATION');
        expect(result?.metadata?.isDangerous).toBe(true);
      });
    });

    describe('Undeclared Components', () => {
      it('should parse undeclared activity', () => {
        const output = `
          android.content.ActivityNotFoundException: Unable to find explicit activity class
          {com.example.app/com.example.app.DetailActivity}
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_undeclared_activity');
        expect(result?.metadata?.componentType).toBe('activity');
        expect(result?.metadata?.componentClass).toContain('DetailActivity');
      });

      it('should parse undeclared service', () => {
        const output = `
          Service com.example.app.MyService is not registered in the manifest
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_undeclared_service');
        expect(result?.metadata?.componentType).toBe('service');
        expect(result?.metadata?.componentClass).toBe('com.example.app.MyService');
      });

      it('should parse undeclared receiver', () => {
        const output = `
          Receiver com.example.app.MyReceiver not registered
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_undeclared_receiver');
        expect(result?.metadata?.componentType).toBe('receiver');
        expect(result?.metadata?.componentClass).toBe('com.example.app.MyReceiver');
      });
    });

    describe('Invalid Manifest', () => {
      it('should parse malformed manifest error', () => {
        const output = `
          AndroidManifest.xml is malformed: missing closing tag
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_invalid_syntax');
        expect(result?.filePath).toBe('AndroidManifest.xml');
      });

      it('should parse invalid manifest error', () => {
        const output = `
          AndroidManifest.xml:42: invalid attribute name
        `;

        const result = tool.parseManifestError(output);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('manifest_invalid_syntax');
      });
    });

    describe('Non-Manifest Errors', () => {
      it('should return null for Kotlin error', () => {
        const output = `
          NullPointerException at MainActivity.kt:45
        `;

        const result = tool.parseManifestError(output);

        expect(result).toBeNull();
      });

      it('should return null for Gradle error', () => {
        const output = `
          Could not resolve dependency: com.example:library:1.0.0
        `;

        const result = tool.parseManifestError(output);

        expect(result).toBeNull();
      });
    });
  });

  describe('recommendPermissionFix()', () => {
    it('should recommend fix for dangerous permission', () => {
      const error: ParsedError = {
        type: 'manifest_missing_permission',
        message: 'Permission denial',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          requiredPermission: 'android.permission.CAMERA',
          permissionName: 'CAMERA',
          isDangerous: true,
        },
      };

      const recommendation = tool.recommendPermissionFix(error);

      expect(recommendation).not.toBeNull();
      expect(recommendation?.permission).toBe('android.permission.CAMERA');
      expect(recommendation?.category).toBe('dangerous');
      expect(recommendation?.requiresRuntime).toBe(true);
      expect(recommendation?.recommendation).toContain('<uses-permission');
      expect(recommendation?.codeSnippet).toContain('checkSelfPermission');
      expect(recommendation?.codeSnippet).toContain('REQUEST_CODE_CAMERA');
    });

    it('should recommend fix for normal permission', () => {
      const error: ParsedError = {
        type: 'manifest_missing_permission',
        message: 'Permission denial',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: {
          requiredPermission: 'android.permission.INTERNET',
          permissionName: 'INTERNET',
          isDangerous: false,
        },
      };

      const recommendation = tool.recommendPermissionFix(error);

      expect(recommendation).not.toBeNull();
      expect(recommendation?.category).toBe('normal');
      expect(recommendation?.requiresRuntime).toBe(false);
      expect(recommendation?.codeSnippet).toBeUndefined();
    });

    it('should return null for non-permission error', () => {
      const error: ParsedError = {
        type: 'manifest_merge_conflict',
        message: 'Conflict',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
      };

      const recommendation = tool.recommendPermissionFix(error);

      expect(recommendation).toBeNull();
    });
  });

  describe('analyzeMergeConflict()', () => {
    it('should analyze attribute conflict', () => {
      const error: ParsedError = {
        type: 'manifest_merge_conflict',
        message: 'Conflict',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: {
          conflictType: 'attribute',
          conflictAttribute: 'theme',
        },
      };

      const analysis = tool.analyzeMergeConflict(error);

      expect(analysis).not.toBeNull();
      expect(analysis?.conflictType).toBe('attribute');
      expect(analysis?.toolsOverride).toContain('tools:replace');
      expect(analysis?.toolsOverride).toContain('theme');
    });

    it('should analyze element conflict', () => {
      const error: ParsedError = {
        type: 'manifest_merge_conflict',
        message: 'Conflict',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: {
          conflictType: 'element',
          conflictElement: 'provider',
        },
      };

      const analysis = tool.analyzeMergeConflict(error);

      expect(analysis).not.toBeNull();
      expect(analysis?.conflictType).toBe('element');
      expect(analysis?.toolsOverride).toContain('tools:node="remove"');
      expect(analysis?.toolsOverride).toContain('provider');
    });

    it('should provide generic resolution for unknown conflict', () => {
      const error: ParsedError = {
        type: 'manifest_merge_conflict',
        message: 'Conflict',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: {},
      };

      const analysis = tool.analyzeMergeConflict(error);

      expect(analysis).not.toBeNull();
      expect(analysis?.conflictType).toBe('unknown');
      expect(analysis?.toolsOverride).toContain('xmlns:tools');
    });

    it('should return null for non-conflict error', () => {
      const error: ParsedError = {
        type: 'manifest_missing_permission',
        message: 'Permission denial',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
      };

      const analysis = tool.analyzeMergeConflict(error);

      expect(analysis).toBeNull();
    });
  });

  describe('generateComponentDeclaration()', () => {
    it('should generate activity declaration', () => {
      const error: ParsedError = {
        type: 'manifest_undeclared_activity',
        message: 'Activity not found',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: {
          componentType: 'activity',
          componentClass: '.DetailActivity',
        },
      };

      const declaration = tool.generateComponentDeclaration(error);

      expect(declaration).not.toBeNull();
      expect(declaration).toContain('<activity');
      expect(declaration).toContain('android:name=".DetailActivity"');
      expect(declaration).toContain('android:exported="false"');
    });

    it('should generate service declaration', () => {
      const error: ParsedError = {
        type: 'manifest_undeclared_service',
        message: 'Service not registered',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: {
          componentType: 'service',
          componentClass: 'com.example.MyService',
        },
      };

      const declaration = tool.generateComponentDeclaration(error);

      expect(declaration).not.toBeNull();
      expect(declaration).toContain('<service');
      expect(declaration).toContain('android:name="com.example.MyService"');
      expect(declaration).toContain('android:enabled="true"');
    });

    it('should generate receiver declaration', () => {
      const error: ParsedError = {
        type: 'manifest_undeclared_receiver',
        message: 'Receiver not registered',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: {
          componentType: 'receiver',
          componentClass: '.MyReceiver',
        },
      };

      const declaration = tool.generateComponentDeclaration(error);

      expect(declaration).not.toBeNull();
      expect(declaration).toContain('<receiver');
      expect(declaration).toContain('android:name=".MyReceiver"');
      expect(declaration).toContain('<!-- Add intent filters here -->');
    });

    it('should return null for non-component error', () => {
      const error: ParsedError = {
        type: 'manifest_merge_conflict',
        message: 'Conflict',
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
      };

      const declaration = tool.generateComponentDeclaration(error);

      expect(declaration).toBeNull();
    });
  });

  describe('isManifestError()', () => {
    it('should detect manifest merge error', () => {
      const output = 'Manifest merger failed with errors';
      expect(ManifestAnalyzerTool.isManifestError(output)).toBe(true);
    });

    it('should detect permission error', () => {
      const output = 'Permission denial: requires CAMERA';
      expect(ManifestAnalyzerTool.isManifestError(output)).toBe(true);
    });

    it('should detect undeclared activity', () => {
      const output = 'Unable to find explicit activity class';
      expect(ManifestAnalyzerTool.isManifestError(output)).toBe(true);
    });

    it('should detect manifest file reference', () => {
      const output = 'Error in AndroidManifest.xml at line 42';
      expect(ManifestAnalyzerTool.isManifestError(output)).toBe(true);
    });

    it('should return false for non-manifest error', () => {
      const output = 'NullPointerException at MainActivity.kt:45';
      expect(ManifestAnalyzerTool.isManifestError(output)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = tool.parseManifestError('');
      expect(result).toBeNull();
    });

    it('should handle very long error message', () => {
      const longError = 'Manifest merger failed' + ' error'.repeat(1000);
      const result = tool.parseManifestError(longError);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('manifest_merge_conflict');
    });

    it('should handle multiline error output', () => {
      const multiline = `
        Error occurred during build:
        Manifest merger failed with multiple errors
        See build log for details
      `;
      const result = tool.parseManifestError(multiline);
      expect(result).not.toBeNull();
    });

    it('should handle permission with full package name', () => {
      const output = 'Permission denial: requires android.permission.READ_EXTERNAL_STORAGE';
      const result = tool.parseManifestError(output);
      expect(result?.metadata?.requiredPermission).toBe('android.permission.READ_EXTERNAL_STORAGE');
    });
  });
});
