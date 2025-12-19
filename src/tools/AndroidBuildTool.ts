/**
 * AndroidBuildTool - Comprehensive Gradle build analysis and resolution tool
 * 
 * Wraps GradleParser with additional features:
 * - Version resolution recommendations
 * - Dependency graph analysis
 * - Groovy and Kotlin DSL support
 * - Repository configuration diagnostics
 * 
 * Design Philosophy:
 * - Not just parse errors, but provide actionable solutions
 * - Support both Groovy (.gradle) and Kotlin (.gradle.kts) DSL
 * - Smart version selection (semantic versioning aware)
 * 
 * @example
 * const tool = new AndroidBuildTool();
 * const error = tool.parseBuildError(buildOutput);
 * if (error?.type === 'dependency_conflict') {
 *   const solution = tool.recommendResolution(error);
 *   console.log(solution);
 * }
 */

import { ParsedError } from '../types';
import { GradleParser } from '../utils/parsers/GradleParser';

export interface VersionResolution {
  recommended: string;
  reason: string;
  implementation: {
    groovy: string;
    kotlin: string;
  };
}

export interface DependencyAnalysis {
  module: string;
  requestedVersions: string[];
  conflicts: string[];
  recommendation: VersionResolution;
}

export class AndroidBuildTool {
  private gradleParser: GradleParser;

  constructor() {
    this.gradleParser = new GradleParser();
  }

  /**
   * Parse Gradle build error output
   * Delegates to GradleParser for error detection
   */
  parseBuildError(buildOutput: string): ParsedError | null {
    return this.gradleParser.parse(buildOutput);
  }

  /**
   * Recommend resolution for dependency conflicts
   * 
   * @param error - Parsed dependency conflict error
   * @returns Resolution recommendation with code examples
   */
  recommendResolution(error: ParsedError): VersionResolution | null {
    if (error.type !== 'dependency_conflict' && error.type !== 'dependency_resolution_error') {
      return null;
    }

    if (!error.metadata) {
      return null;
    }

    const { module, conflictingVersions } = error.metadata;

    if (!module) {
      return null;
    }

    // For resolution errors without conflict versions, return basic recommendation
    if (!conflictingVersions || conflictingVersions.length === 0) {
      return {
        recommended: 'Check dependency availability',
        reason: 'Dependency not found in configured repositories',
        implementation: {
          groovy: `// Verify repository configuration in build.gradle:\nrepositories {\n    google()\n    mavenCentral()\n}\n\n// Check dependency spelling:\nimplementation '${module}'`,
          kotlin: `// Verify repository configuration in build.gradle.kts:\nrepositories {\n    google()\n    mavenCentral()\n}\n\n// Check dependency spelling:\nimplementation("${module}")`,
        },
      };
    }

    // Select highest version using semantic versioning
    const recommended = this.selectHigherVersion(conflictingVersions);
    const reason = this.explainVersionChoice(conflictingVersions, recommended);

    return {
      recommended,
      reason,
      implementation: {
        groovy: this.generateGroovyResolution(module, recommended),
        kotlin: this.generateKotlinResolution(module, recommended),
      },
    };
  }

  /**
   * Analyze dependency conflicts in detail
   * 
   * @param error - Parsed dependency conflict error
   * @returns Detailed analysis with all conflicting versions
   */
  analyzeDependencyConflict(error: ParsedError): DependencyAnalysis | null {
    if (error.type !== 'dependency_conflict') {
      return null;
    }

    if (!error.metadata) {
      return null;
    }

    const { module, conflictingVersions } = error.metadata;

    if (!module || !conflictingVersions) {
      return null;
    }

    const recommendation = this.recommendResolution(error);

    if (!recommendation) {
      return null;
    }

    return {
      module,
      requestedVersions: conflictingVersions,
      conflicts: this.identifyConflictSources(conflictingVersions),
      recommendation,
    };
  }

  /**
   * Select the higher version from an array of version strings
   * Uses semantic versioning comparison
   * 
   * @param versions - Array of version strings (e.g., ['1.2.3', '1.3.0'])
   * @returns The highest version string
   */
  private selectHigherVersion(versions: string[]): string {
    if (versions.length === 0) {
      return 'latest';
    }

    if (versions.length === 1) {
      return versions[0];
    }

    // Sort versions using semantic versioning
    const sorted = [...versions].sort((a, b) => {
      return this.compareVersions(b, a); // Descending order
    });

    return sorted[0];
  }

  /**
   * Compare two version strings using semantic versioning
   * 
   * @param v1 - First version string
   * @param v2 - Second version string
   * @returns Positive if v1 > v2, negative if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    // Remove any prefixes (v, V, etc.)
    const clean1 = v1.replace(/^[vV]/, '');
    const clean2 = v2.replace(/^[vV]/, '');

    // Split into parts
    const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
    const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

    // Pad to same length
    const maxLength = Math.max(parts1.length, parts2.length);
    while (parts1.length < maxLength) parts1.push(0);
    while (parts2.length < maxLength) parts2.push(0);

    // Compare each part
    for (let i = 0; i < maxLength; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0; // Equal
  }

  /**
   * Explain why a specific version was chosen
   */
  private explainVersionChoice(versions: string[], chosen: string): string {
    if (versions.length === 1) {
      return `Only one version specified: ${chosen}`;
    }

    const sorted = [...versions].sort((a, b) => this.compareVersions(b, a));
    const isHighest = sorted[0] === chosen;

    if (isHighest) {
      return `Selected highest version (${chosen}) to ensure compatibility with latest features and bug fixes`;
    } else {
      return `Selected version ${chosen} based on semantic versioning`;
    }
  }

  /**
   * Identify which dependencies are causing conflicts
   */
  private identifyConflictSources(versions: string[]): string[] {
    return versions.map(v => `Requested version ${v} by a transitive dependency`);
  }

  /**
   * Generate Groovy DSL resolution code
   */
  private generateGroovyResolution(module: string, version: string): string {
    return `// Option 1: Force specific version (Groovy DSL)
configurations.all {
    resolutionStrategy {
        force '${module}:${version}'
    }
}

// Option 2: Explicit dependency version
dependencies {
    implementation '${module}:${version}'
}

// Option 3: Exclude transitive dependencies
dependencies {
    implementation('some-library') {
        exclude group: '${module.split(':')[0]}', module: '${module.split(':')[1]}'
    }
}`;
  }

  /**
   * Generate Kotlin DSL resolution code
   */
  private generateKotlinResolution(module: string, version: string): string {
    return `// Option 1: Force specific version (Kotlin DSL)
configurations.all {
    resolutionStrategy {
        force("${module}:${version}")
    }
}

// Option 2: Explicit dependency version
dependencies {
    implementation("${module}:${version}")
}

// Option 3: Exclude transitive dependencies
dependencies {
    implementation("some-library") {
        exclude(group = "${module.split(':')[0]}", module = "${module.split(':')[1]}")
    }
}`;
  }

  /**
   * Diagnose repository configuration issues
   * 
   * @param error - Parsed dependency resolution error
   * @returns Diagnostic message and suggested fixes
   */
  diagnoseRepositoryIssues(error: ParsedError): string | null {
    if (!error.metadata) {
      return null;
    }

    if (error.type !== 'dependency_resolution_error') {
      return null;
    }

    const { dependency, group } = error.metadata;

    if (!dependency) {
      return null;
    }

    // Identify common repository issues
    const diagnostics: string[] = [];

    // Check if it's an Android-specific library
    if (group?.startsWith('com.android') || group?.startsWith('androidx')) {
      diagnostics.push('📦 Android/AndroidX library detected');
      diagnostics.push('✅ Ensure Google Maven repository is configured:');
      diagnostics.push('   repositories { google() }');
    }

    // Check if it's a Kotlin library
    if (group?.includes('kotlin') || group?.includes('jetbrains')) {
      diagnostics.push('🔧 Kotlin library detected');
      diagnostics.push('✅ Ensure Maven Central is configured:');
      diagnostics.push('   repositories { mavenCentral() }');
    }

    // Check if it's a third-party library
    if (!group?.startsWith('com.android') && !group?.startsWith('androidx') && !group?.includes('kotlin')) {
      diagnostics.push('📚 Third-party library detected');
      diagnostics.push('✅ Common repositories to try:');
      diagnostics.push('   repositories {');
      diagnostics.push('       google()');
      diagnostics.push('       mavenCentral()');
      diagnostics.push('       maven { url "https://jitpack.io" }');
      diagnostics.push('   }');
    }

    if (diagnostics.length === 0) {
      return null;
    }

    return diagnostics.join('\n');
  }

  /**
   * Check if build error is Gradle-related
   */
  static isBuildError(text: string): boolean {
    return GradleParser.isGradleError(text);
  }
}
