/**
 * FileResolver - Resolve generic file references to exact paths
 * 
 * This utility helps identify exact file paths from generic references like
 * "build.gradle" by analyzing the project structure and context.
 * 
 * **Purpose:** Address MVP test finding where agent said "build.gradle" 
 * but actual file was "gradle/libs.versions.toml"
 * 
 * **Target:** File identification accuracy 30% → 85%
 * 
 * @example
 * ```typescript
 * const resolver = new FileResolver('/path/to/project');
 * const result = await resolver.resolve('build.gradle', { 
 *   errorType: 'gradle-dependency',
 *   context: 'AGP version'
 * });
 * // Returns: { path: 'gradle/libs.versions.toml', confidence: 0.95, reason: '...' }
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * File resolution result
 */
export interface FileResolutionResult {
  /** Exact file path (absolute) */
  path: string;
  
  /** Relative path from project root */
  relativePath: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Reason for choosing this file */
  reason: string;
  
  /** Alternative candidates */
  alternatives?: FileCandidate[];
  
  /** Whether file exists */
  exists: boolean;
  
  /** Line number (if applicable) */
  line?: number;
  
  /** Suggestion if file doesn't exist */
  creationSuggestion?: string;
}

/**
 * File candidate with confidence score
 */
export interface FileCandidate {
  path: string;
  relativePath: string;
  confidence: number;
  reason: string;
}

/**
 * Resolution context
 */
export interface ResolutionContext {
  /** Error type (e.g., 'gradle-dependency', 'kotlin-npe') */
  errorType?: string;
  
  /** Context from error message (e.g., 'AGP version', 'lateinit') */
  context?: string;
  
  /** Module name (for multi-module projects) */
  module?: string;
  
  /** Line content (if available) */
  lineContent?: string;
  
  /** Original error message */
  errorMessage?: string;
}

/**
 * Project structure information
 */
export interface ProjectStructure {
  /** Project root directory */
  root: string;
  
  /** Whether version catalog is used */
  hasVersionCatalog: boolean;
  
  /** Version catalog path (if exists) */
  versionCatalogPath?: string;
  
  /** Whether multi-module project */
  isMultiModule: boolean;
  
  /** List of modules */
  modules: string[];
  
  /** Root build.gradle path */
  rootBuildGradle?: string;
  
  /** settings.gradle path */
  settingsGradle?: string;
  
  /** Gradle version */
  gradleVersion?: string;
}

/**
 * FileResolver - Intelligently resolve file paths from generic references
 */
export class FileResolver {
  private projectRoot: string;
  private structureCache: ProjectStructure | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Resolve a generic file reference to exact path
   * 
   * @param genericPath - Generic reference (e.g., "build.gradle", "dependencies")
   * @param context - Resolution context
   * @returns File resolution result
   */
  async resolve(
    genericPath: string,
    context?: ResolutionContext
  ): Promise<FileResolutionResult> {
    // Get project structure
    const structure = await this.getProjectStructure();

    // Determine resolution strategy based on file type
    if (this.isGradleVersionReference(genericPath, context)) {
      return this.resolveGradleVersion(structure, context);
    }

    if (this.isGradleDependencyReference(genericPath, context)) {
      return this.resolveGradleDependency(structure, context);
    }

    if (this.isBuildFileReference(genericPath, context)) {
      return this.resolveBuildFile(structure, context);
    }

    if (this.isManifestReference(genericPath, context)) {
      return this.resolveManifest(structure, context);
    }

    if (this.isSourceCodeReference(genericPath, context)) {
      return this.resolveSourceCode(structure, context, genericPath);
    }

    // Fallback: try direct path resolution
    return this.resolveDirect(genericPath, context);
  }

  /**
   * Resolve Gradle version reference (AGP, Kotlin, etc.)
   */
  private async resolveGradleVersion(
    structure: ProjectStructure,
    context?: ResolutionContext
  ): Promise<FileResolutionResult> {
    const candidates: FileCandidate[] = [];

    // Priority 1: Version catalog (if exists)
    if (structure.hasVersionCatalog && structure.versionCatalogPath) {
      const catalogPath = structure.versionCatalogPath;
      const exists = await this.fileExists(catalogPath);
      
      if (exists) {
        // Try to find exact line number
        const line = await this.findLineInFile(catalogPath, context);
        
        candidates.push({
          path: catalogPath,
          relativePath: this.normalizePath(path.relative(structure.root, catalogPath)),
          confidence: 0.95,
          reason: 'Version catalog is the primary location for version declarations in modern Gradle projects'
        });

        return {
          path: catalogPath,
          relativePath: this.normalizePath(path.relative(structure.root, catalogPath)),
          confidence: 0.95,
          reason: 'Version catalog (gradle/libs.versions.toml) is used for centralized version management',
          exists: true,
          line,
          alternatives: []
        };
      }
    }

    // Priority 2: Root build.gradle
    if (structure.rootBuildGradle) {
      const exists = await this.fileExists(structure.rootBuildGradle);
      
      if (exists) {
        const line = await this.findLineInFile(structure.rootBuildGradle, context);
        
        candidates.push({
          path: structure.rootBuildGradle,
          relativePath: this.normalizePath(path.relative(structure.root, structure.rootBuildGradle)),
          confidence: 0.80,
          reason: 'Root build.gradle typically contains plugin versions'
        });

        return {
          path: structure.rootBuildGradle,
          relativePath: this.normalizePath(path.relative(structure.root, structure.rootBuildGradle)),
          confidence: 0.80,
          reason: 'Root build.gradle contains plugin version declarations',
          exists: true,
          line,
          alternatives: candidates.slice(1)
        };
      }
    }

    // Priority 3: gradle.properties
    const gradleProperties = path.join(structure.root, 'gradle.properties');
    const propsExists = await this.fileExists(gradleProperties);
    
    if (propsExists) {
      const line = await this.findLineInFile(gradleProperties, context);
      
      return {
        path: gradleProperties,
        relativePath: 'gradle.properties',
        confidence: 0.60,
        reason: 'gradle.properties may contain version properties',
        exists: true,
        line,
        alternatives: candidates
      };
    }

    // No match found
    return this.createNotFoundResult('version declaration file', structure);
  }

  /**
   * Resolve Gradle dependency reference
   */
  private async resolveGradleDependency(
    structure: ProjectStructure,
    context?: ResolutionContext
  ): Promise<FileResolutionResult> {
    const candidates: FileCandidate[] = [];

    // Priority 1: Module build.gradle (if module specified) - check FIRST
    if (context?.module) {
      const moduleBuildGradle = path.join(structure.root, context.module, 'build.gradle');
      const exists = await this.fileExists(moduleBuildGradle);
      
      if (exists) {
        const line = await this.findLineInFile(moduleBuildGradle, context);
        
        return {
          path: moduleBuildGradle,
          relativePath: this.normalizePath(path.relative(structure.root, moduleBuildGradle)),
          confidence: 0.90, // Higher confidence when module is explicitly specified
          reason: `Dependencies for ${context.module} module`,
          exists: true,
          line,
          alternatives: []
        };
      }
    }

    // Priority 2: Version catalog (if exists)
    if (structure.hasVersionCatalog && structure.versionCatalogPath) {
      const catalogPath = structure.versionCatalogPath;
      const exists = await this.fileExists(catalogPath);
      
      if (exists) {
        const line = await this.findLineInFile(catalogPath, context);
        
        return {
          path: catalogPath,
          relativePath: this.normalizePath(path.relative(structure.root, catalogPath)),
          confidence: 0.85,
          reason: 'Version catalog manages dependencies centrally',
          exists: true,
          line,
          alternatives: []
        };
      }
    }

    // Priority 3: app/build.gradle (common default module)
    const appBuildGradle = path.join(structure.root, 'app', 'build.gradle');
    const appExists = await this.fileExists(appBuildGradle);
    
    if (appExists) {
      const line = await this.findLineInFile(appBuildGradle, context);
      
      return {
        path: appBuildGradle,
        relativePath: 'app/build.gradle',
        confidence: 0.75,
        reason: 'App module build.gradle contains application dependencies',
        exists: true,
        line,
        alternatives: candidates
      };
    }

    // Priority 4: Root build.gradle
    if (structure.rootBuildGradle) {
      const exists = await this.fileExists(structure.rootBuildGradle);
      
      if (exists) {
        const line = await this.findLineInFile(structure.rootBuildGradle, context);
        
        return {
          path: structure.rootBuildGradle,
          relativePath: this.normalizePath(path.relative(structure.root, structure.rootBuildGradle)),
          confidence: 0.65,
          reason: 'Root build.gradle may contain shared dependencies',
          exists: true,
          line,
          alternatives: candidates
        };
      }
    }

    return this.createNotFoundResult('dependency file', structure);
  }

  /**
   * Resolve build file reference (generic "build.gradle")
   */
  private async resolveBuildFile(
    structure: ProjectStructure,
    context?: ResolutionContext
  ): Promise<FileResolutionResult> {
    // If context suggests version management, prefer version catalog
    if (this.isVersionContext(context)) {
      return this.resolveGradleVersion(structure, context);
    }

    // If context suggests dependency, prefer dependency files
    if (this.isDependencyContext(context)) {
      return this.resolveGradleDependency(structure, context);
    }

    // Default: root build.gradle
    if (structure.rootBuildGradle) {
      const exists = await this.fileExists(structure.rootBuildGradle);
      const line = await this.findLineInFile(structure.rootBuildGradle, context);
      
      return {
        path: structure.rootBuildGradle,
        relativePath: this.normalizePath(path.relative(structure.root, structure.rootBuildGradle)),
        confidence: 0.70,
        reason: 'Root build.gradle is the primary build configuration',
        exists,
        line
      };
    }

    return this.createNotFoundResult('build.gradle', structure);
  }

  /**
   * Resolve AndroidManifest.xml reference
   */
  private async resolveManifest(
    structure: ProjectStructure,
    context?: ResolutionContext
  ): Promise<FileResolutionResult> {
    // Try common locations
    const manifestPaths = [
      path.join(structure.root, 'app', 'src', 'main', 'AndroidManifest.xml'),
      path.join(structure.root, 'src', 'main', 'AndroidManifest.xml'),
    ];

    // If module specified, try that first
    if (context?.module) {
      manifestPaths.unshift(
        path.join(structure.root, context.module, 'src', 'main', 'AndroidManifest.xml')
      );
    }

    for (const manifestPath of manifestPaths) {
      const exists = await this.fileExists(manifestPath);
      if (exists) {
        const line = await this.findLineInFile(manifestPath, context);
        
        return {
          path: manifestPath,
          relativePath: this.normalizePath(path.relative(structure.root, manifestPath)),
          confidence: 0.95,
          reason: 'AndroidManifest.xml found at standard location',
          exists: true,
          line
        };
      }
    }

    return this.createNotFoundResult('AndroidManifest.xml', structure);
  }

  /**
   * Resolve source code file reference
   */
  private async resolveSourceCode(
    structure: ProjectStructure,
    context: ResolutionContext | undefined,
    genericPath: string
  ): Promise<FileResolutionResult> {
    // Try to find file in project
    const found = await this.findFileByName(genericPath, structure.root);
    
    if (found) {
      const line = await this.findLineInFile(found, context);
      
      return {
        path: found,
        relativePath: this.normalizePath(path.relative(structure.root, found)),
        confidence: 0.90,
        reason: `Found ${genericPath} in project`,
        exists: true,
        line
      };
    }

    return this.createNotFoundResult(genericPath, structure);
  }

  /**
   * Direct path resolution (fallback)
   */
  private async resolveDirect(
    genericPath: string,
    context?: ResolutionContext
  ): Promise<FileResolutionResult> {
    let absolutePath: string;
    
    // Handle absolute paths (cross-platform)
    if (path.isAbsolute(genericPath)) {
      absolutePath = genericPath;
    } else {
      absolutePath = path.join(this.projectRoot, genericPath);
    }
    
    // Normalize path separators
    absolutePath = path.normalize(absolutePath);
    
    const exists = await this.fileExists(absolutePath);
    const line = exists ? await this.findLineInFile(absolutePath, context) : undefined;
    
    return {
      path: absolutePath,
      relativePath: this.normalizePath(path.relative(this.projectRoot, absolutePath)),
      confidence: exists ? 0.95 : 0.30,
      reason: exists ? 'File found at specified path' : 'File path provided but not found',
      exists,
      line
    };
  }

  /**
   * Get or build project structure
   */
  private async getProjectStructure(): Promise<ProjectStructure> {
    // Check cache
    if (this.structureCache && (Date.now() - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.structureCache;
    }

    // Build structure
    const structure: ProjectStructure = {
      root: this.projectRoot,
      hasVersionCatalog: false,
      isMultiModule: false,
      modules: []
    };

    // Check for version catalog
    const versionCatalogPath = path.join(this.projectRoot, 'gradle', 'libs.versions.toml');
    structure.hasVersionCatalog = await this.fileExists(versionCatalogPath);
    if (structure.hasVersionCatalog) {
      structure.versionCatalogPath = versionCatalogPath;
    }

    // Check for root build.gradle
    const rootBuildGradle = path.join(this.projectRoot, 'build.gradle');
    if (await this.fileExists(rootBuildGradle)) {
      structure.rootBuildGradle = rootBuildGradle;
    }

    // Check for settings.gradle
    const settingsGradle = path.join(this.projectRoot, 'settings.gradle');
    if (await this.fileExists(settingsGradle)) {
      structure.settingsGradle = settingsGradle;
      structure.modules = await this.parseModulesFromSettings(settingsGradle);
      structure.isMultiModule = structure.modules.length > 1;
    }

    // Cache and return
    this.structureCache = structure;
    this.cacheTimestamp = Date.now();
    return structure;
  }

  /**
   * Parse modules from settings.gradle
   */
  private async parseModulesFromSettings(settingsPath: string): Promise<string[]> {
    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const modules: string[] = [];
      
      // Match include ':module' patterns (various formats)
      const includePattern = /include\s+['"]:([^'"]+)['"]/g;
      let match;
      
      while ((match = includePattern.exec(content)) !== null) {
        const moduleName = match[1];
        // Verify module directory exists
        const projectRoot = path.dirname(settingsPath);
        const modulePath = path.join(projectRoot, moduleName);
        try {
          const stats = await fs.stat(modulePath);
          if (stats.isDirectory()) {
            modules.push(moduleName);
          }
        } catch {
          // Module directory doesn't exist, skip it
        }
      }
      
      return modules;
    } catch (error) {
      return [];
    }
  }

  /**
   * Find line number in file based on context
   */
  private async findLineInFile(
    filePath: string,
    context?: ResolutionContext
  ): Promise<number | undefined> {
    if (!context?.context && !context?.lineContent && !context?.errorMessage) {
      return undefined;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Build search terms from context with priorities
      const exactSearchTerms: string[] = [];
      const fuzzySearchTerms: string[] = [];
      
      if (context?.context) {
        const contextLower = context.context.toLowerCase();
        
        // Extract exact version patterns (highest priority)
        const versionMatch = contextLower.match(/[\d.]+/);
        if (versionMatch) {
          exactSearchTerms.push(versionMatch[0]);
        }
        
        // Extract key variable names
        const keywordMatch = contextLower.match(/\b(agp|kotlin|androidx|compose|core)\b/);
        if (keywordMatch) {
          exactSearchTerms.push(keywordMatch[0]);
        }
        
        // Add full context as fuzzy term
        fuzzySearchTerms.push(contextLower);
      }
      
      if (context?.lineContent) {
        exactSearchTerms.push(context.lineContent.toLowerCase().trim());
      }
      
      if (context?.errorMessage) {
        const errorLower = context.errorMessage.toLowerCase();
        const versionMatch = errorLower.match(/[\d.]+/);
        if (versionMatch) {
          exactSearchTerms.push(versionMatch[0]);
        }
      }

      // First pass: exact matches
      for (let i = 0; i < lines.length; i++) {
        const lineLower = lines[i].toLowerCase().trim();
        
        for (const term of exactSearchTerms) {
          if (term && term.length > 1 && lineLower.includes(term)) {
            // Return 1-indexed line number
            return i + 1;
          }
        }
      }
      
      // Second pass: fuzzy matches
      for (let i = 0; i < lines.length; i++) {
        const lineLower = lines[i].toLowerCase().trim();
        
        for (const term of fuzzySearchTerms) {
          if (term && term.length > 3 && lineLower.includes(term)) {
            return i + 1;
          }
        }
      }
    } catch (error) {
      // File read error, return undefined
    }

    return undefined;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find file by name recursively
   */
  private async findFileByName(
    fileName: string,
    directory: string,
    maxDepth: number = 10,
    currentDepth: number = 0
  ): Promise<string | null> {
    if (currentDepth >= maxDepth) return null;

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      // First pass: check files in current directory
      for (const entry of entries) {
        if (entry.isFile() && entry.name === fileName) {
          return path.join(directory, entry.name);
        }
      }
      
      // Second pass: recurse into subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            entry.name !== 'node_modules' && entry.name !== 'build' && entry.name !== 'out') {
          const fullPath = path.join(directory, entry.name);
          const found = await this.findFileByName(fileName, fullPath, maxDepth, currentDepth + 1);
          if (found) return found;
        }
      }
    } catch (error) {
      // Directory read error, continue
    }

    return null;
  }

  /**
   * Create "not found" result with suggestions
   */
  private createNotFoundResult(
    fileType: string,
    _structure: ProjectStructure
  ): FileResolutionResult {
    let creationSuggestion = '';
    
    if (fileType.includes('version')) {
      creationSuggestion = 'Consider creating gradle/libs.versions.toml for centralized version management';
    } else if (fileType.includes('build')) {
      creationSuggestion = 'Create build.gradle in project root or module directory';
    }

    return {
      path: '',
      relativePath: '',
      confidence: 0,
      reason: `Could not find ${fileType} in project`,
      exists: false,
      creationSuggestion
    };
  }

  // ==================== Helper Methods ====================

  private isGradleVersionReference(genericPath: string, context?: ResolutionContext): boolean {
    const versionKeywords = ['version', 'agp', 'kotlin', 'gradle', 'plugin'];
    const lowerPath = genericPath.toLowerCase();
    const lowerContext = context?.context?.toLowerCase() || '';
    const lowerError = context?.errorType?.toLowerCase() || '';
    
    return versionKeywords.some(kw => 
      lowerPath.includes(kw) || lowerContext.includes(kw) || lowerError.includes(kw)
    );
  }

  private isGradleDependencyReference(genericPath: string, context?: ResolutionContext): boolean {
    const dependencyKeywords = ['dependency', 'dependencies', 'library', 'artifact'];
    const lowerPath = genericPath.toLowerCase();
    const lowerContext = context?.context?.toLowerCase() || '';
    
    return dependencyKeywords.some(kw => 
      lowerPath.includes(kw) || lowerContext.includes(kw)
    );
  }

  private isBuildFileReference(genericPath: string, _context?: ResolutionContext): boolean {
    const lowerPath = genericPath.toLowerCase();
    return lowerPath.includes('build.gradle') || lowerPath === 'build';
  }

  private isManifestReference(genericPath: string, _context?: ResolutionContext): boolean {
    const lowerPath = genericPath.toLowerCase();
    return lowerPath.includes('manifest') || lowerPath.includes('androidmanifest');
  }

  private isSourceCodeReference(genericPath: string, _context?: ResolutionContext): boolean {
    const sourceExtensions = ['.kt', '.java', '.xml'];
    return sourceExtensions.some(ext => genericPath.endsWith(ext));
  }

  private isVersionContext(context?: ResolutionContext): boolean {
    const versionKeywords = ['version', 'agp', 'kotlin', 'gradle'];
    const ctx = context?.context?.toLowerCase() || '';
    const err = context?.errorType?.toLowerCase() || '';
    
    return versionKeywords.some(kw => ctx.includes(kw) || err.includes(kw));
  }

  private isDependencyContext(context?: ResolutionContext): boolean {
    const dependencyKeywords = ['dependency', 'dependencies', 'library'];
    const ctx = context?.context?.toLowerCase() || '';
    
    return dependencyKeywords.some(kw => ctx.includes(kw));
  }

  /**
   * Clear structure cache (useful for testing)
   */
  clearCache(): void {
    this.structureCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Normalize path separators to forward slashes (cross-platform)
   */
  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }
}

