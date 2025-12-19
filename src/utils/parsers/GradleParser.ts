/**
 * GradleParser - Parser for Gradle build errors
 * 
 * Handles common Gradle build failures:
 * - Dependency resolution errors
 * - Build script syntax errors
 * - Task execution failures
 * - Version conflicts
 * 
 * Design Philosophy:
 * - Extract actionable information for fixing
 * - Support both Groovy and Kotlin DSL
 * - Identify specific failure points
 * 
 * @example
 * const parser = new GradleParser();
 * const error = parser.parse(buildOutput);
 * if (error?.type === 'dependency_conflict') {
 *   console.log(`Conflict: ${error.metadata.module}`);
 * }
 */

import { ParsedError } from '../../types';

export class GradleParser {
  /**
   * Parse Gradle build error output
   * 
   * @param errorText - Raw Gradle build output
   * @returns ParsedError if successfully parsed, null if not a Gradle error
   */
  parse(errorText: string): ParsedError | null {
    if (!errorText || typeof errorText !== 'string') {
      return null;
    }

    // Trim and limit size
    const text = errorText.trim().slice(0, 50000);

    // Try parsing different Gradle error types (order matters - most specific first)
    return (
      this.parseDependencyResolutionError(text) ||
      this.parseDependencyConflict(text) ||
      this.parseVersionMismatch(text) ||
      this.parsePluginError(text) ||
      this.parseBuildScriptSyntaxError(text) ||
      this.parseTaskFailure(text) ||
      this.parseCompilationError(text) ||
      null
    );
  }

  /**
   * Parse dependency resolution failures
   * Example: "Could not resolve com.example:library:1.0.0"
   * AG003: Repository missing or dependency not found
   */
  private parseDependencyResolutionError(text: string): ParsedError | null {
    const patterns = [
      /Could not resolve\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
      /Could not find\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
      /Could not download\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
      /Failed to resolve:\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const dependency = match[1];
        const parts = dependency.split(':');
        
        return {
          type: 'gradle_dependency_resolution_error',
          message: text,
          filePath: this.extractBuildFile(text),
          line: 0,
          language: 'gradle',
          metadata: {
            dependency,
            group: parts[0] || 'unknown',
            artifact: parts[1] || 'unknown',
            version: parts[2] || 'unspecified',
            errorType: 'Dependency resolution failed',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse dependency version conflicts
   * Example: "Conflict with dependency 'com.google.guava:guava' in project ':app'"
   * AG001: Duplicate class conflicts
   * AG007: Dependency conflicts in mixed errors
   */
  private parseDependencyConflict(text: string): ParsedError | null {
    // Pattern 0: Duplicate class conflicts (AG001 - most specific)
    const duplicateClassPattern = /Duplicate class\s+([\w.]+).*found in modules[\s\S]*?([\w.-]+\.jar)\s*\(([^)]+)\)[\s\S]*?([\w.-]+\.jar)\s*\(([^)]+)\)/i;
    const duplicateMatch = text.match(duplicateClassPattern);
    if (duplicateMatch) {
      const conflictingClass = duplicateMatch[1];
      const dep1 = duplicateMatch[3];
      const dep2 = duplicateMatch[5];
      
      return {
        type: 'gradle_dependency_conflict',
        message: text,
        filePath: this.extractBuildFile(text),
        line: 0,
        language: 'gradle',
        metadata: {
          module: conflictingClass,
          conflictingVersions: [dep1, dep2],
          errorType: 'Duplicate class - dependency conflict',
        },
      };
    }

    // Pattern 1: Explicit version conflict with versions mentioned in parentheses
    const versionPattern = /Conflict.*?['"]([^'"]+)['"].*?\(([^\s)]+)\)(?:.*?\(([^\s)]+)\))?/i;
    const versionMatch = text.match(versionPattern);
    if (versionMatch && versionMatch[2]) {
      const module = versionMatch[1];
      const version1 = versionMatch[2];
      const version2 = versionMatch[3] || 'unknown';

      return {
        type: 'gradle_dependency_conflict',
        message: text,
        filePath: this.extractBuildFile(text),
        line: 0,
        language: 'gradle',
        metadata: {
          module,
          conflictingVersions: [version1, version2].filter(v => v !== 'unknown'),
          errorType: 'Dependency version conflict',
        },
      };
    }

    // Pattern 2: "Conflict found for" with versions (AM007)
    if (/Conflict found for/i.test(text) && /Versions:/i.test(text)) {
      const moduleMatch = text.match(/Conflict found for\s+['"]([^'"]+)['"]/i);
      const versionsMatch = text.match(/Versions:\s*([\d.]+)\s+vs\s+([\d.]+)/i);
      
      if (moduleMatch || versionsMatch) {
        return {
          type: 'gradle_dependency_conflict',
          message: text,
          filePath: this.extractBuildFile(text),
          line: 0,
          language: 'gradle',
          metadata: {
            module: moduleMatch?.[1] || 'unknown',
            conflictingVersions: versionsMatch ? [versionsMatch[1], versionsMatch[2]] : [],
            errorType: 'Dependency version conflict',
          },
        };
      }
    }

    // Pattern 3: Generic multiple versions or conflict mentions
    const patterns = [
      /Multiple.*?versions.*?['"]([^'"]+)['"]/i,
      /Version conflict.*?['"]([^'"]+)['"]/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const module = match[1];
        const version1 = match[2] || 'unknown';
        const version2 = match[3] || 'unknown';

        return {
          type: 'gradle_dependency_conflict',
          message: text,
          filePath: this.extractBuildFile(text),
          line: 0,
          language: 'gradle',
          metadata: {
            module,
            conflictingVersions: [version1, version2].filter(v => v !== 'unknown'),
            errorType: 'Dependency version conflict',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse version mismatch errors
   * Example: "Module was compiled with incompatible version of Kotlin"
   * AG002: Version mismatch
   */
  private parseVersionMismatch(text: string): ParsedError | null {
    const patterns = [
      /Module was compiled with an incompatible version/i,
      /The binary version of its metadata is ([\d.]+), expected version is ([\d.]+)/i,
      /incompatible.*version.*Kotlin/i,
      /requires.*version ([\d.]+).*found ([\d.]+)/i,
    ];

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const versionMatch = text.match(/(?:version is|metadata is|version) ([\d.]+).*(?:expected|found|required).*?([\d.]+)/i);
        const moduleMatch = text.match(/Module:\s+([^\s]+)/i);
        
        return {
          type: 'gradle_version_mismatch',
          message: text,
          filePath: this.extractBuildFile(text),
          line: 0,
          language: 'gradle',
          metadata: {
            found: versionMatch?.[1] || 'unknown',
            required: versionMatch?.[2] || 'unknown',
            module: moduleMatch?.[1] || 'unknown',
            errorType: 'Version mismatch',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse plugin errors
   * Example: "Plugin [id: 'com.google.gms.google-services'] was not found"
   * AG004: Plugin not found
   */
  private parsePluginError(text: string): ParsedError | null {
    const patterns = [
      /Plugin\s+\[id:\s*['"]([^'"]+)['"]/i,
      /Plugin with id ['"]([^'"]+)['"]/i,
      /Could not find plugin ['"]([^'"]+)['"]/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && /was not found|could not resolve/i.test(text)) {
        const pluginId = match[1];
        const versionMatch = text.match(/version:[\s'"]+([\d.]+)/i);
        
        return {
          type: 'gradle_plugin_error',
          message: text,
          filePath: this.extractBuildFile(text),
          line: 0,
          language: 'gradle',
          metadata: {
            pluginId,
            version: versionMatch?.[1] || 'unspecified',
            errorType: 'Plugin not found',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse task execution failures
   * Example: "Execution failed for task ':app:compileDebugKotlin'"
   */
  /**
   * Parse generic task failures
   * NOTE: This is a catch-all for Gradle task failures that don't match more specific patterns.
   * It should NOT match when there are Kotlin/Java compilation errors present,
   * as those should be parsed by language-specific parsers instead.
   * 
   * Example: "Execution failed for task ':app:assembleDebug'"
   */
  private parseTaskFailure(text: string): ParsedError | null {
    const taskMatch = text.match(/Execution failed for task\s+'([^']+)'/i);
    if (!taskMatch) {
      return null;
    }

    // DON'T match if there are specific compilation errors that should be parsed elsewhere
    // Check for Kotlin/Java errors that KotlinParser/JavaParser should handle
    const hasSpecificError = [
      /Unresolved reference/i,
      /Type mismatch/i,
      /lateinit property/i,
      /NullPointerException/i,
      /Cannot find symbol/i,
      /incompatible types/i,
    ].some(pattern => pattern.test(text));

    if (hasSpecificError) {
      // Let language-specific parsers handle this
      return null;
    }

    const taskName = taskMatch[1];
    const { reason, details } = this.extractFailureReason(text);

    return {
      type: 'task_failure',
      message: text,
      filePath: this.extractBuildFile(text),
      line: 0,
      language: 'gradle',
      metadata: {
        taskName,
        reason,
        details,
        errorType: 'Task execution failed',
      },
    };
  }

  /**
   * Parse build script syntax errors
   * Example: "build.gradle: 15: unexpected token"
   * AG005: Syntax error in build script
   */
  private parseBuildScriptSyntaxError(text: string): ParsedError | null {
    // Check for "Could not compile build file" indicator first
    if (/Could not compile build file/i.test(text)) {
      const fileMatch = text.match(/Build file ['"]([ ^'"]+build\.gradle(?:\.kts)?)['"]\s+line:\s*(\d+)/i);
      const errorMatch = text.match(/line\s+\d+,\s+column\s+\d+\.([\s\S]*?)(?:@|$)/i);
      const tokenMatch = text.match(/unexpected token:\s*(\S+)/i);
      
      if (fileMatch) {
        return {
          type: 'gradle_build_script_syntax_error',
          message: text,
          filePath: fileMatch[1],
          line: parseInt(fileMatch[2], 10),
          language: 'gradle',
          metadata: {
            description: errorMatch?.[1]?.trim() || tokenMatch?.[0] || 'Syntax error',
            errorType: 'Build script syntax error',
          },
        };
      }
    }

    const patterns = [
      // Most specific first: Script 'full/path/build.gradle' line: X
      /Script\s+'([^']+)'\s+line:\s*(\d+)\s*(.*)/i,
      // Less specific: build.gradle line: X (may match just the filename)
      /(build\.gradle(?:\.kts)?)['"]?\s+line:\s*(\d+)/i,
      // Least specific: build.gradle:42: error
      /(build\.gradle(?:\.kts)?):?\s*(\d+):\s*(.*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[2]) {
        const filePath = match[1];
        const line = parseInt(match[2], 10);
        const errorDescription = match[3] || 'Syntax error';

        return {
          type: 'gradle_build_script_syntax_error',
          message: text,
          filePath,
          line,
          language: 'gradle',
          metadata: {
            description: errorDescription.trim(),
            errorType: 'Build script syntax error',
          },
        };
      }
    }

    return null;
  }

  /**
   * Parse compilation errors reported by Gradle
   * NOTE: This is for GRADLE compilation errors (like build script issues),
   * NOT for Kotlin/Java source code compilation errors.
   * Language-specific compilation errors should be handled by KotlinParser/JavaParser.
   * 
   * Example: "Compilation error. See log for more details." (generic Gradle message)
   */
  private parseCompilationError(text: string): ParsedError | null {
    if (!/compilation\s+(?:error|failed)/i.test(text)) {
      return null;
    }

    // DON'T match if there are specific Kotlin/Java errors present
    // These should be parsed by language-specific parsers
    const hasSpecificError = [
      /Unresolved reference/i,
      /Type mismatch/i,
      /lateinit property/i,
      /NullPointerException/i,
      /Cannot find symbol/i,
      /incompatible types/i,
    ].some(pattern => pattern.test(text));

    if (hasSpecificError) {
      // Let language-specific parsers handle this
      return null;
    }

    // Try to extract the actual compilation error
    const errorMatch = text.match(/(?:error:|e:)\s*(.+?)(?:\n|$)/i);
    const description = errorMatch ? errorMatch[1] : 'Compilation failed';

    // Try to find file reference
    const fileMatch = text.match(/(\w+\.\w+):(\d+)/);

    return {
      type: 'compilation_error',
      message: text,
      filePath: fileMatch ? fileMatch[1] : this.extractBuildFile(text),
      line: fileMatch ? parseInt(fileMatch[2], 10) : 0,
      language: 'gradle',
      metadata: {
        description: description.trim(),
        errorType: 'Compilation error',
      },
    };
  }

  /**
   * Extract build file path from error text
   */
  private extractBuildFile(text: string): string {
    // Look for explicit build file references
    const patterns = [
      /(?:file|script)?\s*'([^']*build\.gradle(?:\.kts)?[^']*)'/i,
      /((?:[\w/\\]+)?build\.gradle(?:\.kts)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Default to build.gradle
    return 'build.gradle';
  }

  /**
   * Extract failure reason and details from error text
   */
  private extractFailureReason(text: string): { reason: string; details: string } {
    // Look for "Caused by:" or "> " prefixed reasons
    const causeMatch = text.match(/Caused by:\s*([^\n]+)/i);
    if (causeMatch) {
      return {
        reason: causeMatch[1].trim(),
        details: text,
      };
    }

    const reasonMatch = text.match(/>\s*([^\n]+)/);
    if (reasonMatch) {
      return {
        reason: reasonMatch[1].trim(),
        details: text,
      };
    }

    return {
      reason: 'Unknown failure',
      details: text,
    };
  }

  /**
   * Quick check if text contains Gradle error patterns
   */
  static isGradleError(text: string): boolean {
    if (!text) return false;

    const gradleIndicators = [
      /gradle/i,
      /build\.gradle/i,
      /Execution failed for task/i,
      /Could not resolve/i,
      /BUILD FAILED/i,
      /Dependency.*resolution.*failed/i,
    ];

    return gradleIndicators.some(pattern => pattern.test(text));
  }
}
