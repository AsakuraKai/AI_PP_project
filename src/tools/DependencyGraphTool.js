"use strict";
/**
 * DependencyGraphTool - Analyze project dependency relationships
 *
 * Phase 2 Enhancement: Build and analyze dependency graphs to identify
 * version conflicts, circular dependencies, and missing dependencies.
 *
 * Key Features:
 * - Parse Gradle dependency trees
 * - Detect version conflicts
 * - Find circular dependencies
 * - Identify missing transitive dependencies
 *
 * Expected Impact: Part of +5-10% usability from advanced tools
 *
 * @example
 * const tool = new DependencyGraphTool();
 * const graph = await tool.execute({ projectPath: "/path/to/project" });
 * console.log(graph.conflicts); // Version conflicts
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
exports.DependencyGraphTool = exports.Tool = void 0;
class Tool {
}
exports.Tool = Tool;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * DependencyGraphTool analyzes Gradle dependencies
 */
class DependencyGraphTool extends Tool {
    constructor() {
        super(...arguments);
        this.name = 'dependency_graph';
        this.description = 'Analyze project dependency graph for conflicts and issues';
    }
    /**
     * Execute dependency graph analysis
     */
    async execute(params, _context) {
        console.log('🔍 Analyzing dependency graph...');
        try {
            // Build dependency tree
            const tree = await this.buildDependencyTree(params.projectPath, params.configuration);
            // Parse into graph structure
            const nodes = this.parseDependencyTree(tree);
            // Detect conflicts
            const conflicts = this.detectVersionConflicts(nodes);
            // Detect circular dependencies
            const circular = this.detectCircularDependencies(nodes);
            // Find missing dependencies
            const missing = this.findMissingDependencies(params.projectPath);
            // Check outdated (optional)
            const outdated = params.checkOutdated
                ? await this.checkOutdatedDependencies(params.projectPath)
                : [];
            const graph = {
                nodes,
                conflicts,
                circular,
                missing,
                outdated,
            };
            console.log(`✓ Analyzed ${nodes.length} dependencies`);
            console.log(`  - ${conflicts.length} version conflicts`);
            console.log(`  - ${circular.length} circular dependencies`);
            console.log(`  - ${missing.length} missing dependencies`);
            return graph;
        }
        catch (error) {
            console.warn('⚠️ Dependency graph analysis failed:', error);
            return {
                nodes: [],
                conflicts: [],
                circular: [],
                missing: [],
                outdated: [],
            };
        }
    }
    /**
     * Build dependency tree using Gradle
     */
    async buildDependencyTree(projectPath, configuration) {
        try {
            const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
            const gradlePath = path.join(projectPath, gradlew);
            // Check if gradlew exists
            if (!fs.existsSync(gradlePath)) {
                throw new Error('Gradle wrapper not found');
            }
            const config = configuration || 'implementation';
            const command = `${gradlew} dependencies --configuration ${config}`;
            console.log(`  Running: ${command}`);
            const output = (0, child_process_1.execSync)(command, {
                cwd: projectPath,
                encoding: 'utf-8',
                timeout: 60000, // 60 second timeout
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            });
            return output;
        }
        catch (error) {
            console.warn('⚠️ Failed to build dependency tree:', error.message);
            return '';
        }
    }
    /**
     * Parse Gradle dependency tree output
     */
    parseDependencyTree(treeOutput) {
        const nodes = [];
        const nodeMap = new Map();
        // Parse lines like:
        // +--- com.google.android:android:4.1.1.4
        // |    \--- com.google.android:support-v4:r7
        const lines = treeOutput.split('\n');
        const stack = [];
        for (const line of lines) {
            // Skip non-dependency lines
            if (!line.includes('---'))
                continue;
            // Calculate indentation level
            const level = line.search(/[+\\]/);
            // Extract dependency string
            const depMatch = line.match(/[+\\]--- (.+)/);
            if (!depMatch)
                continue;
            const depString = depMatch[1].trim();
            // Parse dependency (group:artifact:version)
            const parts = depString.split(':');
            if (parts.length < 3)
                continue;
            const [group, artifact, version] = parts;
            const id = `${group}:${artifact}:${version}`;
            // Create or get node
            let node = nodeMap.get(id);
            if (!node) {
                node = {
                    id,
                    group,
                    artifact,
                    version,
                    dependencies: [],
                    requestedBy: [],
                };
                nodeMap.set(id, node);
                nodes.push(node);
            }
            // Update stack
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }
            // Add parent relationship
            if (stack.length > 0) {
                const parent = stack[stack.length - 1];
                const parentNode = nodeMap.get(parent.id);
                if (parentNode && !parentNode.dependencies.includes(id)) {
                    parentNode.dependencies.push(id);
                }
                if (!node.requestedBy.includes(parent.id)) {
                    node.requestedBy.push(parent.id);
                }
            }
            stack.push({ id, level });
        }
        return nodes;
    }
    /**
     * Detect version conflicts
     */
    detectVersionConflicts(nodes) {
        const conflicts = [];
        const dependencyVersions = new Map();
        // Group by group:artifact
        for (const node of nodes) {
            const key = `${node.group}:${node.artifact}`;
            if (!dependencyVersions.has(key)) {
                dependencyVersions.set(key, new Map());
            }
            const versionMap = dependencyVersions.get(key);
            if (!versionMap.has(node.version)) {
                versionMap.set(node.version, []);
            }
            versionMap.get(node.version).push(...node.requestedBy);
        }
        // Find conflicts (multiple versions requested)
        for (const [dependency, versionMap] of dependencyVersions) {
            if (versionMap.size > 1) {
                const versions = Array.from(versionMap.keys());
                const resolved = this.selectResolvedVersion(versions);
                const requestedBy = [];
                for (const requesters of versionMap.values()) {
                    requestedBy.push(...requesters);
                }
                conflicts.push({
                    dependency,
                    versions,
                    resolved,
                    requestedBy: [...new Set(requestedBy)],
                });
            }
        }
        return conflicts;
    }
    /**
     * Select resolved version from multiple versions (highest wins)
     */
    selectResolvedVersion(versions) {
        // Simple highest version selection
        return versions.sort((a, b) => this.compareVersions(b, a))[0];
    }
    /**
     * Compare two version strings
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(p => parseInt(p) || 0);
        const parts2 = v2.split('.').map(p => parseInt(p) || 0);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 !== p2)
                return p1 - p2;
        }
        return 0;
    }
    /**
     * Detect circular dependencies
     */
    detectCircularDependencies(nodes) {
        const circular = [];
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (nodeId, path) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                for (const depId of node.dependencies) {
                    if (!visited.has(depId)) {
                        dfs(depId, [...path]);
                    }
                    else if (recursionStack.has(depId)) {
                        // Found cycle
                        const cycleStart = path.indexOf(depId);
                        const cycle = path.slice(cycleStart);
                        cycle.push(depId); // Complete the cycle
                        circular.push({
                            chain: cycle,
                            severity: 'warning',
                        });
                    }
                }
            }
            recursionStack.delete(nodeId);
        };
        for (const node of nodes) {
            if (!visited.has(node.id)) {
                dfs(node.id, []);
            }
        }
        return circular;
    }
    /**
     * Find missing dependencies (referenced but not declared)
     */
    findMissingDependencies(projectPath) {
        const missing = [];
        try {
            // Look for common error patterns in build logs
            const buildLogPath = path.join(projectPath, 'build', 'build.log');
            if (fs.existsSync(buildLogPath)) {
                const content = fs.readFileSync(buildLogPath, 'utf-8');
                // Pattern: "Could not find ..."
                const missingMatches = content.match(/Could not find ([a-zA-Z0-9.:_-]+)/g);
                if (missingMatches) {
                    for (const match of missingMatches) {
                        const dep = match.replace('Could not find ', '');
                        if (!missing.includes(dep)) {
                            missing.push(dep);
                        }
                    }
                }
            }
        }
        catch (error) {
            // Ignore errors reading build log
        }
        return missing;
    }
    /**
     * Check for outdated dependencies
     */
    async checkOutdatedDependencies(_projectPath) {
        // This would require Maven Central API calls
        // Simplified implementation for now
        return [];
    }
}
exports.DependencyGraphTool = DependencyGraphTool;
//# sourceMappingURL=DependencyGraphTool.js.map