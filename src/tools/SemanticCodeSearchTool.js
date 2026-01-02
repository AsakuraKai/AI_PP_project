"use strict";
/**
 * SemanticCodeSearchTool - Semantic search across codebase
 *
 * Phase 2 Enhancement: Find code locations semantically related to an error,
 * not just by exact text matching. Uses ChromaDB embeddings.
 *
 * Key Features:
 * - Semantic code search (find conceptually similar code)
 * - Variable/function usage tracking
 * - Cross-file relationship detection
 * - Context-aware code retrieval
 *
 * Expected Impact: Part of +5-10% usability from advanced tools
 *
 * @example
 * const tool = new SemanticCodeSearchTool();
 * await tool.initialize(projectPath);
 * const results = await tool.execute({ error, query: "initialization" });
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
exports.SemanticCodeSearchTool = exports.Tool = void 0;
const chromadb_1 = require("chromadb");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Tool {
}
exports.Tool = Tool;
/**
 * SemanticCodeSearchTool uses ChromaDB for semantic code search
 */
class SemanticCodeSearchTool extends Tool {
    constructor() {
        super();
        this.name = 'semantic_code_search';
        this.description = 'Search codebase semantically for related code patterns';
        this.collection = null;
        this.projectPath = '';
        this.initialized = false;
        this.client = new chromadb_1.ChromaClient({ path: 'http://localhost:8000' });
    }
    /**
     * Initialize with project path and index codebase
     */
    async initialize(projectPath) {
        if (this.initialized && this.projectPath === projectPath)
            return;
        this.projectPath = projectPath;
        try {
            console.log('🔧 Initializing SemanticCodeSearchTool...');
            // Create or get collection
            const collectionName = `code_${path.basename(projectPath)}`;
            try {
                this.collection = await this.client.getCollection({ name: collectionName });
                console.log(`✓ Connected to existing collection: ${collectionName}`);
            }
            catch {
                this.collection = await this.client.createCollection({
                    name: collectionName,
                    metadata: { projectPath, indexed: Date.now() },
                });
                console.log(`✓ Created new collection: ${collectionName}`);
                // Index the codebase
                await this.indexCodebase(projectPath);
            }
            this.initialized = true;
            console.log('✓ SemanticCodeSearchTool initialized');
        }
        catch (error) {
            console.warn('⚠️ Failed to initialize SemanticCodeSearchTool:', error);
            this.initialized = false;
        }
    }
    /**
     * Execute semantic code search
     */
    async execute(params, _context) {
        if (!this.initialized || !this.collection) {
            console.warn('⚠️ SemanticCodeSearchTool not initialized');
            return [];
        }
        try {
            const query = params.query || params.error.message;
            const maxResults = params.maxResults || 5;
            const minSimilarity = params.minSimilarity || 0.6;
            console.log(`🔍 Semantic code search: "${query.substring(0, 60)}..."`);
            // Query ChromaDB
            const results = await this.collection.query({
                queryTexts: [query],
                nResults: maxResults * 2,
            });
            const codeLocations = [];
            if (results.ids && results.ids[0] && results.documents && results.documents[0]) {
                for (let i = 0; i < results.ids[0].length; i++) {
                    const distance = results.distances?.[0]?.[i] || 1.0;
                    const similarity = 1 - distance;
                    if (similarity >= minSimilarity) {
                        const metadata = results.metadatas?.[0]?.[i];
                        const code = results.documents[0][i];
                        codeLocations.push({
                            filePath: String(metadata?.filePath || 'unknown'),
                            startLine: Number(metadata?.startLine) || 0,
                            endLine: Number(metadata?.endLine) || 0,
                            code: code || '',
                            similarity,
                            relevance: this.explainRelevance(params.error, code || '', similarity),
                        });
                    }
                }
            }
            codeLocations.sort((a, b) => b.similarity - a.similarity);
            const topResults = codeLocations.slice(0, maxResults);
            console.log(`✓ Found ${topResults.length} relevant code locations`);
            return topResults;
        }
        catch (error) {
            console.warn('⚠️ Semantic code search failed:', error);
            return [];
        }
    }
    /**
     * Index codebase for semantic search
     */
    async indexCodebase(projectPath) {
        console.log('📦 Indexing codebase...');
        const codeFiles = await this.findCodeFiles(projectPath);
        console.log(`  Found ${codeFiles.length} code files`);
        let indexed = 0;
        for (const file of codeFiles) {
            try {
                await this.indexFile(file);
                indexed++;
                if (indexed % 10 === 0) {
                    console.log(`  Indexed ${indexed}/${codeFiles.length} files...`);
                }
            }
            catch (error) {
                console.warn(`⚠️ Failed to index ${file}:`, error);
            }
        }
        console.log(`✓ Indexed ${indexed} files`);
    }
    /**
     * Index a single file
     */
    async indexFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const chunks = this.splitIntoChunks(content);
        const ids = [];
        const documents = [];
        const metadatas = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            ids.push(`${filePath}_chunk_${i}`);
            documents.push(chunk.code);
            metadatas.push({
                filePath,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                chunkIndex: i,
            });
        }
        if (ids.length > 0) {
            await this.collection.add({ ids, documents, metadatas });
        }
    }
    /**
     * Split file content into semantic chunks
     */
    splitIntoChunks(content) {
        const lines = content.split('\n');
        const chunks = [];
        const chunkSize = 20; // Lines per chunk
        for (let i = 0; i < lines.length; i += chunkSize) {
            const chunkLines = lines.slice(i, i + chunkSize);
            chunks.push({
                code: chunkLines.join('\n'),
                startLine: i + 1,
                endLine: Math.min(i + chunkSize, lines.length),
            });
        }
        return chunks;
    }
    /**
     * Find all code files in project
     */
    async findCodeFiles(dir) {
        const files = [];
        const extensions = ['.kt', '.java', '.xml', '.gradle', '.kts'];
        const walk = (currentDir) => {
            try {
                const entries = fs.readdirSync(currentDir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);
                    // Skip common ignore patterns
                    if (entry.name.startsWith('.') ||
                        entry.name === 'node_modules' ||
                        entry.name === 'build' ||
                        entry.name === '.gradle') {
                        continue;
                    }
                    if (entry.isDirectory()) {
                        walk(fullPath);
                    }
                    else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (extensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        walk(dir);
        return files;
    }
    /**
     * Explain why code is relevant
     */
    explainRelevance(error, code, similarity) {
        const reasons = [];
        // Check for error-related keywords
        const errorKeywords = this.extractKeywords(error.message);
        const codeKeywords = this.extractKeywords(code);
        const commonKeywords = errorKeywords.filter(k => codeKeywords.includes(k));
        if (commonKeywords.length > 0) {
            reasons.push(`mentions ${commonKeywords.slice(0, 3).join(', ')}`);
        }
        if (similarity > 0.8) {
            reasons.push('very high semantic similarity');
        }
        else if (similarity > 0.7) {
            reasons.push('high semantic similarity');
        }
        // Check for variable names from error
        const filePath = error.filePath.toLowerCase();
        if (code.toLowerCase().includes(path.basename(filePath))) {
            reasons.push('references same file');
        }
        return reasons.length > 0 ? reasons.join(', ') : 'semantic match';
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);
    }
}
exports.SemanticCodeSearchTool = SemanticCodeSearchTool;
//# sourceMappingURL=SemanticCodeSearchTool.js.map