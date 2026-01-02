"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileResolver = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * FileResolver - Intelligently resolve file paths from generic references
 */
class FileResolver {
    constructor(projectRoot) {
        this.structureCache = null;
        this.cacheTimestamp = 0;
        this.CACHE_TTL = 30000; // 30 seconds
        this.projectRoot = path.resolve(projectRoot);
    }
    /**
     * Resolve a generic file reference to exact path
     *
     * @param genericPath - Generic reference (e.g., "build.gradle", "dependencies")
     * @param context - Resolution context
     * @returns File resolution result
     */
    async resolve(genericPath, context) {
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
        // Chunk 9: New file type resolvers
        if (this.isProguardReference(genericPath, context)) {
            return this.resolveProguardRules(structure, context);
        }
        if (this.isNavigationReference(genericPath, context)) {
            return this.resolveNavigationFile(structure, context);
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
    async resolveGradleVersion(structure, context) {
        const candidates = [];
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
    async resolveGradleDependency(structure, context) {
        const candidates = [];
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
    async resolveBuildFile(structure, context) {
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
    async resolveManifest(structure, context) {
        // Try common locations
        const manifestPaths = [
            path.join(structure.root, 'app', 'src', 'main', 'AndroidManifest.xml'),
            path.join(structure.root, 'src', 'main', 'AndroidManifest.xml'),
        ];
        // If module specified, try that first
        if (context?.module) {
            manifestPaths.unshift(path.join(structure.root, context.module, 'src', 'main', 'AndroidManifest.xml'));
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
     * Resolve ProGuard rules file reference (Chunk 9)
     */
    async resolveProguardRules(structure, context) {
        // Try common locations for proguard-rules.pro
        const proguardPaths = [
            path.join(structure.root, 'app', 'proguard-rules.pro'),
            path.join(structure.root, 'proguard-rules.pro'),
            path.join(structure.root, 'app', 'proguard.pro'),
        ];
        // If module specified, try that first
        if (context?.module) {
            proguardPaths.unshift(path.join(structure.root, context.module, 'proguard-rules.pro'));
        }
        for (const proguardPath of proguardPaths) {
            const exists = await this.fileExists(proguardPath);
            if (exists) {
                return {
                    path: proguardPath,
                    relativePath: this.normalizePath(path.relative(structure.root, proguardPath)),
                    confidence: 0.95,
                    reason: 'ProGuard rules file found at standard location',
                    exists: true
                };
            }
        }
        // File doesn't exist - suggest creation
        const suggestedPath = path.join(structure.root, 'app', 'proguard-rules.pro');
        return {
            path: suggestedPath,
            relativePath: 'app/proguard-rules.pro',
            confidence: 0.85,
            reason: 'ProGuard rules file does not exist but should be created here',
            exists: false,
            creationSuggestion: 'Create app/proguard-rules.pro and add keep rules for obfuscated classes'
        };
    }
    /**
     * Resolve Navigation file reference (Chunk 9)
     */
    async resolveNavigationFile(structure, context) {
        // Try to find Navigation.kt or nav_graph files
        const searchPatterns = [
            '**/Navigation.kt',
            '**/NavGraph.kt',
            '**/navigation/**/*.kt',
            '**/nav_graph.xml',
            '**/navigation.xml'
        ];
        // Search for navigation files
        const navigationFiles = [];
        for (const pattern of searchPatterns) {
            const found = await this.findFilesByPattern(pattern, structure.root);
            navigationFiles.push(...found);
        }
        if (navigationFiles.length > 0) {
            // Prefer Compose Navigation.kt over XML nav graphs
            const composeNav = navigationFiles.find(f => f.endsWith('Navigation.kt') || f.endsWith('NavGraph.kt'));
            const targetFile = composeNav || navigationFiles[0];
            const line = await this.findLineInFile(targetFile, context);
            return {
                path: targetFile,
                relativePath: this.normalizePath(path.relative(structure.root, targetFile)),
                confidence: 0.90,
                reason: composeNav ? 'Compose Navigation file' : 'Navigation graph file',
                exists: true,
                line,
                alternatives: navigationFiles.slice(1).map(alt => ({
                    path: alt,
                    relativePath: this.normalizePath(path.relative(structure.root, alt)),
                    confidence: 0.75,
                    reason: 'Alternative navigation file'
                }))
            };
        }
        return this.createNotFoundResult('Navigation.kt', structure);
    }
    /**
     * Resolve source code file reference
     */
    async resolveSourceCode(structure, context, genericPath) {
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
    async resolveDirect(genericPath, context) {
        let absolutePath;
        // Handle absolute paths (cross-platform)
        if (path.isAbsolute(genericPath)) {
            absolutePath = genericPath;
        }
        else {
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
    async getProjectStructure() {
        // Check cache
        if (this.structureCache && (Date.now() - this.cacheTimestamp) < this.CACHE_TTL) {
            return this.structureCache;
        }
        // Build structure
        const structure = {
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
    async parseModulesFromSettings(settingsPath) {
        try {
            const content = await fs.readFile(settingsPath, 'utf-8');
            const modules = [];
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
                }
                catch {
                    // Module directory doesn't exist, skip it
                }
            }
            return modules;
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Find line number in file based on context
     */
    async findLineInFile(filePath, context) {
        if (!context?.context && !context?.lineContent && !context?.errorMessage) {
            return undefined;
        }
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            // Build search terms from context with priorities
            const exactSearchTerms = [];
            const fuzzySearchTerms = [];
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
        }
        catch (error) {
            // File read error, return undefined
        }
        return undefined;
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Find file by name recursively
     */
    async findFileByName(fileName, directory, maxDepth = 10, currentDepth = 0) {
        if (currentDepth >= maxDepth)
            return null;
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
                    if (found)
                        return found;
                }
            }
        }
        catch (error) {
            // Directory read error, continue
        }
        return null;
    }
    /**
     * Find files matching pattern (Chunk 9)
     * Simple glob pattern matching (supports ** and *)
     */
    async findFilesByPattern(pattern, directory, maxDepth = 5, currentDepth = 0) {
        if (currentDepth >= maxDepth)
            return [];
        const results = [];
        const patternParts = pattern.split('/').filter(p => p);
        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                // Skip common ignored directories
                if (entry.isDirectory() && (entry.name.startsWith('.') ||
                    entry.name === 'node_modules' ||
                    entry.name === 'build' ||
                    entry.name === 'out')) {
                    continue;
                }
                // Check if this entry matches the pattern
                if (this.matchesPattern(entry.name, patternParts[patternParts.length - 1])) {
                    if (entry.isFile()) {
                        results.push(fullPath);
                    }
                }
                // Recurse into subdirectories
                if (entry.isDirectory()) {
                    const subResults = await this.findFilesByPattern(pattern, fullPath, maxDepth, currentDepth + 1);
                    results.push(...subResults);
                }
            }
        }
        catch (error) {
            // Directory read error, continue
        }
        return results;
    }
    /**
     * Simple pattern matching helper (Chunk 9)
     */
    matchesPattern(fileName, pattern) {
        if (pattern === '**' || pattern === '*')
            return true;
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(fileName);
    }
    /**
     * Create "not found" result with suggestions
     */
    createNotFoundResult(fileType, _structure) {
        let creationSuggestion = '';
        if (fileType.includes('version')) {
            creationSuggestion = 'Consider creating gradle/libs.versions.toml for centralized version management';
        }
        else if (fileType.includes('build')) {
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
    isGradleVersionReference(genericPath, context) {
        const versionKeywords = ['version', 'agp', 'kotlin', 'gradle', 'plugin'];
        const lowerPath = genericPath.toLowerCase();
        const lowerContext = context?.context?.toLowerCase() || '';
        const lowerError = context?.errorType?.toLowerCase() || '';
        return versionKeywords.some(kw => lowerPath.includes(kw) || lowerContext.includes(kw) || lowerError.includes(kw));
    }
    isGradleDependencyReference(genericPath, context) {
        const dependencyKeywords = ['dependency', 'dependencies', 'library', 'artifact'];
        const lowerPath = genericPath.toLowerCase();
        const lowerContext = context?.context?.toLowerCase() || '';
        return dependencyKeywords.some(kw => lowerPath.includes(kw) || lowerContext.includes(kw));
    }
    isBuildFileReference(genericPath, _context) {
        const lowerPath = genericPath.toLowerCase();
        return lowerPath.includes('build.gradle') || lowerPath === 'build';
    }
    isManifestReference(genericPath, _context) {
        const lowerPath = genericPath.toLowerCase();
        return lowerPath.includes('manifest') || lowerPath.includes('androidmanifest');
    }
    /**
     * Check if reference is to ProGuard rules file (Chunk 9)
     */
    isProguardReference(genericPath, context) {
        const lowerPath = genericPath.toLowerCase();
        const lowerContext = context?.context?.toLowerCase() || '';
        const errorType = context?.errorType?.toLowerCase() || '';
        return lowerPath.includes('proguard') ||
            lowerPath.includes('r8') ||
            lowerPath.includes('minification') ||
            lowerContext.includes('proguard') ||
            lowerContext.includes('obfuscation') ||
            errorType.includes('proguard');
    }
    /**
     * Check if reference is to Navigation file (Chunk 9)
     */
    isNavigationReference(genericPath, context) {
        const lowerPath = genericPath.toLowerCase();
        const lowerContext = context?.context?.toLowerCase() || '';
        const errorType = context?.errorType?.toLowerCase() || '';
        return lowerPath.includes('navigation') ||
            lowerPath.includes('navgraph') ||
            lowerPath.includes('nav_graph') ||
            lowerContext.includes('navigation') ||
            lowerContext.includes('routing') ||
            errorType.includes('navigation');
    }
    isSourceCodeReference(genericPath, _context) {
        const sourceExtensions = ['.kt', '.java', '.xml'];
        return sourceExtensions.some(ext => genericPath.endsWith(ext));
    }
    isVersionContext(context) {
        const versionKeywords = ['version', 'agp', 'kotlin', 'gradle'];
        const ctx = context?.context?.toLowerCase() || '';
        const err = context?.errorType?.toLowerCase() || '';
        return versionKeywords.some(kw => ctx.includes(kw) || err.includes(kw));
    }
    isDependencyContext(context) {
        const dependencyKeywords = ['dependency', 'dependencies', 'library'];
        const ctx = context?.context?.toLowerCase() || '';
        return dependencyKeywords.some(kw => ctx.includes(kw));
    }
    /**
     * Clear structure cache (useful for testing)
     */
    clearCache() {
        this.structureCache = null;
        this.cacheTimestamp = 0;
    }
    /**
     * Normalize path separators to forward slashes (cross-platform)
     */
    normalizePath(filePath) {
        return filePath.replace(/\\/g, '/');
    }
}
exports.FileResolver = FileResolver;
//# sourceMappingURL=FileResolver.js.map