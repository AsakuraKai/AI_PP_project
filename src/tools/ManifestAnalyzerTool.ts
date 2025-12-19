/**
 * ManifestAnalyzerTool - Android manifest error analysis tool
 * 
 * Provides:
 * - Manifest merge conflict detection and resolution
 * - Missing permission detection with recommendations
 * - Undeclared component (Activity/Service/Receiver) detection
 * - XML merge marker parsing
 * - Permission priority analysis
 * 
 * Design Philosophy:
 * - Parse manifest-related errors from build output
 * - Provide actionable solutions with code snippets
 * - Understand Android permission model (dangerous vs normal)
 * 
 * @example
 * const tool = new ManifestAnalyzerTool();
 * const error = tool.parseManifestError(buildOutput);
 * if (error?.type === 'manifest_missing_permission') {
 *   const solution = tool.recommendPermissionFix(error);
 *   console.log(solution);
 * }
 */

import { ParsedError } from '../types';

export interface PermissionRecommendation {
  permission: string;
  category: 'dangerous' | 'normal' | 'signature';
  requiresRuntime: boolean;
  recommendation: string;
  codeSnippet?: string;
}

export interface MergeConflictAnalysis {
  conflictType: 'attribute' | 'element' | 'permission' | 'unknown';
  suggestedResolution: string;
  toolsOverride?: string;
}

export class ManifestAnalyzerTool {
  // Common Android permissions and their categories
  private static readonly DANGEROUS_PERMISSIONS = new Set([
    'CAMERA',
    'READ_CONTACTS',
    'WRITE_CONTACTS',
    'GET_ACCOUNTS',
    'ACCESS_FINE_LOCATION',
    'ACCESS_COARSE_LOCATION',
    'RECORD_AUDIO',
    'READ_PHONE_STATE',
    'CALL_PHONE',
    'READ_CALL_LOG',
    'WRITE_CALL_LOG',
    'ADD_VOICEMAIL',
    'USE_SIP',
    'PROCESS_OUTGOING_CALLS',
    'BODY_SENSORS',
    'SEND_SMS',
    'RECEIVE_SMS',
    'READ_SMS',
    'RECEIVE_WAP_PUSH',
    'RECEIVE_MMS',
    'READ_EXTERNAL_STORAGE',
    'WRITE_EXTERNAL_STORAGE',
  ]);

  /**
   * Parse manifest-related error from build output
   */
  parseManifestError(output: string): ParsedError | null {
    return (
      this.parseManifestMergeConflict(output) ||
      this.parseMissingPermission(output) ||
      this.parseUndeclaredComponent(output) ||
      this.parseInvalidManifest(output) ||
      null
    );
  }

  /**
   * Parse manifest merge conflicts
   */
  private parseManifestMergeConflict(output: string): ParsedError | null {
    // Pattern: Manifest merger failed with multiple errors
    if (output.includes('Manifest merger failed') || output.includes('AAPT: error: attribute')) {
      // Try to extract specific conflict details
      const attributeMatch = output.match(/attribute\s+(\S+)\s+.*?has already been defined/i);
      const elementMatch = output.match(/element\s+<(\S+)>\s+.*?conflicts/i);
      // Pattern for "Attribute application@allowBackup value=..."
      const atAttributeMatch = output.match(/Attribute\s+\w+@(\w+)\s+value=/i);
      
      let metadata: any = {};
      
      if (attributeMatch) {
        metadata.conflictType = 'attribute';
        metadata.conflictAttribute = attributeMatch[1];
      } else if (elementMatch) {
        metadata.conflictType = 'element';
        metadata.conflictElement = elementMatch[1];
      } else if (atAttributeMatch) {
        metadata.conflictType = 'attribute';
        metadata.conflictAttribute = atAttributeMatch[1];
      }
      
      return {
        type: 'manifest_merge_conflict',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
        metadata,
      };
    }
    
    return null;
  }

  /**
   * Parse missing permission errors
   */
  private parseMissingPermission(output: string): ParsedError | null {
    // Pattern: Permission denial... requires <permission>
    // More flexible pattern to match various formats
    const permMatch = output.match(/requires\s+(android\.permission\.[A-Z_]+|[A-Z_]+)/i);
    
    if (permMatch) {
      const permission = permMatch[1];
      const shortName = permission.split('.').pop() || permission;
      const fullPermission = permission.includes('.')
        ? permission
        : `android.permission.${permission}`;
      
      return {
        type: 'manifest_missing_permission',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          requiredPermission: fullPermission,
          permissionName: shortName,
          isDangerous: ManifestAnalyzerTool.DANGEROUS_PERMISSIONS.has(shortName),
        },
      };
    }
    
    return null;
  }

  /**
   * Parse undeclared component errors
   */
  private parseUndeclaredComponent(output: string): ParsedError | null {
    // Pattern: Unable to find explicit activity class
    const activityMatch = output.match(/Unable to find explicit activity class\s+\{(.+?)\}/);
    if (activityMatch) {
      return {
        type: 'manifest_undeclared_activity',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          componentType: 'activity',
          componentClass: activityMatch[1],
        },
      };
    }
    
    // Pattern: Service not registered
    const serviceMatch = output.match(/Service\s+(.+?)\s+.*?not\s+registered/i);
    if (serviceMatch) {
      return {
        type: 'manifest_undeclared_service',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          componentType: 'service',
          componentClass: serviceMatch[1],
        },
      };
    }
    
    // Pattern: Receiver not registered
    const receiverMatch = output.match(/Receiver\s+(.+?)\s+.*?not\s+registered/i);
    if (receiverMatch) {
      return {
        type: 'manifest_undeclared_receiver',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          componentType: 'receiver',
          componentClass: receiverMatch[1],
        },
      };
    }
    
    return null;
  }

  /**
   * Parse invalid manifest syntax errors
   */
  private parseInvalidManifest(output: string): ParsedError | null {
    if (output.includes('AndroidManifest.xml') && (output.includes('malformed') || output.includes('invalid'))) {
      return {
        type: 'manifest_invalid_syntax',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
      };
    }
    
    return null;
  }

  /**
   * Recommend permission fix with runtime check if needed
   */
  recommendPermissionFix(error: ParsedError): PermissionRecommendation | null {
    if (error.type !== 'manifest_missing_permission' || !error.metadata) {
      return null;
    }
    
    const { requiredPermission, permissionName, isDangerous } = error.metadata as {
      requiredPermission: string;
      permissionName: string;
      isDangerous: boolean;
    };
    
    const fullPermission = requiredPermission.includes('.')
      ? requiredPermission
      : `android.permission.${requiredPermission}`;
    
    const recommendation: PermissionRecommendation = {
      permission: fullPermission,
      category: isDangerous ? 'dangerous' : 'normal',
      requiresRuntime: isDangerous,
      recommendation: `Add permission to AndroidManifest.xml:\n<uses-permission android:name="${fullPermission}" />`,
    };
    
    // Add runtime permission check code for dangerous permissions
    if (isDangerous) {
      recommendation.codeSnippet = `// Runtime permission check (required for dangerous permissions)
if (ContextCompat.checkSelfPermission(this, Manifest.permission.${permissionName})
    != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this,
        arrayOf(Manifest.permission.${permissionName}),
        REQUEST_CODE_${permissionName})
}`;
    }
    
    return recommendation;
  }

  /**
   * Analyze manifest merge conflict and suggest resolution
   */
  analyzeMergeConflict(error: ParsedError): MergeConflictAnalysis | null {
    if (error.type !== 'manifest_merge_conflict') {
      return null;
    }
    
    const { conflictType, conflictAttribute, conflictElement } = error.metadata || {};
    
    if (conflictType === 'attribute') {
      return {
        conflictType: 'attribute',
        suggestedResolution: `The attribute "${conflictAttribute}" is defined in multiple manifest files. Use tools:replace to override:`,
        toolsOverride: `<application
    android:name=".MyApp"
    tools:replace="${conflictAttribute}">`,
      };
    }
    
    if (conflictType === 'element') {
      return {
        conflictType: 'element',
        suggestedResolution: `The element <${conflictElement}> conflicts. Use tools:node="remove" to exclude from libraries:`,
        toolsOverride: `<${conflictElement} tools:node="remove" />`,
      };
    }
    
    // Generic conflict
    return {
      conflictType: 'unknown',
      suggestedResolution: 'Add tools namespace and use tools:replace or tools:remove to resolve conflicts',
      toolsOverride: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">`,
    };
  }

  /**
   * Generate component declaration XML
   */
  generateComponentDeclaration(error: ParsedError): string | null {
    if (!error.type.startsWith('manifest_undeclared_') || !error.metadata) {
      return null;
    }
    
    const { componentType, componentClass } = error.metadata as {
      componentType: string;
      componentClass: string;
    };
    
    switch (componentType) {
      case 'activity':
        return `<activity
    android:name="${componentClass}"
    android:exported="false" />`;
      
      case 'service':
        return `<service
    android:name="${componentClass}"
    android:enabled="true"
    android:exported="false" />`;
      
      case 'receiver':
        return `<receiver
    android:name="${componentClass}"
    android:enabled="true"
    android:exported="false">
    <!-- Add intent filters here -->
</receiver>`;
      
      default:
        return null;
    }
  }

  /**
   * Static helper to check if output contains manifest error
   */
  static isManifestError(output: string): boolean {
    return (
      output.includes('AndroidManifest.xml') ||
      output.includes('Manifest merger failed') ||
      output.includes('Permission denial') ||
      output.includes('activity class') ||
      output.includes('Service') && output.includes('not registered') ||
      output.includes('Receiver') && output.includes('not registered')
    );
  }
}
