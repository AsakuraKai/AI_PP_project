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

    // Try parsing different Gradle error types
    return (
      this.parseDependencyResolutionError(text) ||
      this.parseDependencyConflict(text) ||
      this.parseTaskFailure(text) ||
      this.parseBuildScriptSyntaxError(text) ||
      this.parseCompilationError(text) ||
      null
    );
  }

  /**
   * Parse dependency resolution failures
   * Example: "Could not resolve com.example:library:1.0.0"
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
          type: 'dependency_resolution_error',
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
   */
  private parseDependencyConflict(text: string): ParsedError | null {
    // Pattern 1: Explicit version conflict with versions mentioned in parentheses
    const versionPattern = /Conflict.*?['"]([^'"]+)['"].*?\(([^\s)]+)\)(?:.*?\(([^\s)]+)\))?/i;
    const versionMatch = text.match(versionPattern);
    if (versionMatch && versionMatch[2]) {
      const module = versionMatch[1];
      const version1 = versionMatch[2];
      const version2 = versionMatch[3] || 'unknown';

      return {
        type: 'dependency_conflict',
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

    // Pattern 2: Generic multiple versions or conflict mentions
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
          type: 'dependency_conflict',
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
   * Parse task execution failures
   * Example: "Execution failed for task ':app:compileDebugKotlin'"
   */
  private parseTaskFailure(text: string): ParsedError | null {
    const taskMatch = text.match(/Execution failed for task\s+'([^']+)'/i);
    if (!taskMatch) {
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
   */
  private parseBuildScriptSyntaxError(text: string): ParsedError | null {
    const patterns = [
      /(build\.gradle(?:\.kts)?):?\s*(\d+):\s*(.*)/i,
      /Script\s+'([^']+)'\s+line:\s*(\d+)\s*(.*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const filePath = match[1];
        const line = parseInt(match[2], 10);
        const errorDescription = match[3] || 'Syntax error';

        return {
          type: 'build_script_syntax_error',
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
   * Example: "Compilation error. See log for more details."
   */
  private parseCompilationError(text: string): ParsedError | null {
    if (!/compilation\s+(?:error|failed)/i.test(text)) {
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
