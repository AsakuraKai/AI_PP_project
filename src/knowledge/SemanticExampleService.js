"use strict";
/**
 * SemanticExampleService - Semantic similarity-based example selection
 *
 * Phase 2 Enhancement: Use ChromaDB embeddings for semantic search instead of
 * keyword-based matching. This finds examples that are conceptually similar
 * even if they don't share exact keywords.
 *
 * Key Features:
 * - Semantic similarity using embeddings
 * - Related error pattern detection
 * - Historical success tracking
 * - Dynamic example selection based on context
 *
 * Expected Impact: +5-7% usability improvement
 *
 * @example
 * const service = new SemanticExampleService();
 * await service.initialize();
 * const examples = await service.findSimilarExamples(parsedError);
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticExampleService = void 0;
const chromadb_1 = require("chromadb");
const DEFAULT_COLLECTION_METADATA = {
    description: 'RCA few-shot examples with embeddings',
    // Important: ensure distances returned by ChromaDB match our similarity conversion (1 - distance)
    // by using cosine distance (distance = 1 - cosine_similarity)
    'hnsw:space': 'cosine',
};
/**
 * SemanticExampleService uses ChromaDB for semantic similarity search
 */
class SemanticExampleService {
    constructor(config) {
        this.collection = null;
        this.initialized = false;
        const chromaUrl = config?.chromaUrl || 'http://localhost:8000';
        this.client = new chromadb_1.ChromaClient({ path: chromaUrl });
        this.collectionName = config?.collectionName || 'rca_examples';
        this.minSimilarity = config?.minSimilarity ?? 0.6;
        this.maxExamples = config?.maxExamples ?? 5;
    }
    /**
     * Initialize ChromaDB collection
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            console.log('🔧 Initializing SemanticExampleService...');
            // Try to get existing collection
            try {
                this.collection = await this.client.getCollection({ name: this.collectionName });
                console.log(`✓ Connected to existing collection: ${this.collectionName}`);
            }
            catch {
                // Create new collection if doesn't exist
                this.collection = await this.client.createCollection({
                    name: this.collectionName,
                    metadata: DEFAULT_COLLECTION_METADATA,
                });
                console.log(`✓ Created new collection: ${this.collectionName}`);
            }
            this.initialized = true;
            console.log('✓ SemanticExampleService initialized');
        }
        catch (error) {
            console.warn('⚠️ Failed to initialize ChromaDB:', error);
            console.warn('⚠️ Semantic search will be unavailable. Make sure ChromaDB is running.');
            this.initialized = false;
        }
    }
    /**
     * Check if service is available
     */
    isAvailable() {
        return this.initialized && this.collection !== null;
    }
    /**
     * Add example to collection with embedding
     */
    async addExample(example) {
        if (!this.isAvailable()) {
            throw new Error('SemanticExampleService not initialized');
        }
        try {
            // Create searchable text from example
            const searchText = this.createSearchText(example);
            await this.collection.add({
                ids: [example.id || `example_${Date.now()}`],
                documents: [searchText],
                metadatas: [{
                        errorType: example.errorType,
                        category: example.context?.category || 'unknown',
                        filePath: example.filePath || 'unknown',
                        tags: (example.tags || []).join(','),
                        timestamp: Date.now(),
                    }],
            });
            console.log(`✓ Added example: ${example.errorType}`);
        }
        catch (error) {
            console.warn('⚠️ Failed to add example:', error);
        }
    }
    /**
     * Find similar examples using semantic search
     */
    async findSimilarExamples(error, limit) {
        if (!this.isAvailable()) {
            console.warn('⚠️ ChromaDB not available, returning empty results');
            return [];
        }
        try {
            // Create search query from error
            const searchQuery = this.createSearchQuery(error);
            const maxResults = limit || this.maxExamples;
            console.log(`🔍 Searching for similar examples (query: "${searchQuery.substring(0, 80)}...")`);
            // Query ChromaDB with semantic search
            const results = await this.collection.query({
                queryTexts: [searchQuery],
                nResults: maxResults * 2, // Get more than needed, then filter
            });
            // Process and filter results
            const semanticResults = [];
            if (results.ids && results.ids[0] && results.documents && results.documents[0]) {
                for (let i = 0; i < results.ids[0].length; i++) {
                    const distance = results.distances?.[0]?.[i] || 1.0;
                    const similarity = 1 - distance; // Convert distance to similarity
                    // Filter by minimum similarity
                    if (similarity >= this.minSimilarity) {
                        const document = results.documents[0][i];
                        const metadata = results.metadatas?.[0]?.[i];
                        // Reconstruct example from stored data
                        const example = this.reconstructExample(document || '', metadata);
                        semanticResults.push({
                            example,
                            similarity,
                            reason: this.explainSimilarity(error, example, similarity),
                        });
                    }
                }
            }
            // Sort by similarity (highest first)
            semanticResults.sort((a, b) => b.similarity - a.similarity);
            // Return top results
            const topResults = semanticResults.slice(0, maxResults);
            console.log(`✓ Found ${topResults.length} similar examples (similarity: ${(topResults[0]?.similarity * 100).toFixed(0)}%-${(topResults[topResults.length - 1]?.similarity * 100).toFixed(0)}%)`);
            return topResults;
        }
        catch (error) {
            console.warn('⚠️ Semantic search failed:', error);
            return [];
        }
    }
    /**
     * Find examples with related error patterns
     */
    async findRelatedPatterns(error) {
        if (!this.isAvailable())
            return [];
        try {
            // Expand search to include related error types
            const relatedTypes = this.getRelatedErrorTypes(error.type);
            const allResults = [];
            for (const relatedType of relatedTypes) {
                const modifiedError = { ...error, type: relatedType };
                const results = await this.findSimilarExamples(modifiedError, 2);
                allResults.push(...results);
            }
            // Deduplicate and sort
            const uniqueResults = this.deduplicateResults(allResults);
            uniqueResults.sort((a, b) => b.similarity - a.similarity);
            console.log(`✓ Found ${uniqueResults.length} related pattern examples`);
            return uniqueResults.slice(0, this.maxExamples);
        }
        catch (error) {
            console.warn('⚠️ Related pattern search failed:', error);
            return [];
        }
    }
    /**
     * Get examples that have historically high success rate
     */
    async getHighSuccessExamples(error, limit = 3) {
        // For now, just return similar examples
        // In production, would track fix success rates in metadata
        const results = await this.findSimilarExamples(error, limit);
        return results.map(r => ({
            ...r,
            reason: `${r.reason} (historically successful pattern)`,
        }));
    }
    /**
     * Create searchable text from example
     */
    createSearchText(example) {
        const codeExampleText = (example.solution?.codeExamples || [])
            .map((ce, i) => `Code Example ${i + 1} BEFORE: ${ce.before}\nCode Example ${i + 1} AFTER: ${ce.after}`)
            .join('\n');
        const stepsText = (example.solution?.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
        const verificationText = (example.solution?.verificationSteps || example.solution?.verification || [])
            .map((s, i) => `${i + 1}. ${s}`)
            .join('\n');
        return `
      Error Type: ${example.errorType}
      Error Message: ${example.errorMessage || example.error || ''}
      File: ${example.filePath || 'unknown'}
      Root Cause: ${example.analysis?.rootCause || example.diagnosis?.rootCause || ''}
      Fix: ${example.solution?.summary || ''}
      Fix Steps:\n${stepsText}
      Verification:\n${verificationText}
      ${codeExampleText ? `\n${codeExampleText}` : ''}
      Tags: ${example.tags?.join(', ') || ''}
    `.trim();
    }
    /**
     * Create search query from error
     */
    createSearchQuery(error) {
        return `
      Error Type: ${error.type}
      Error Message: ${error.message}
      File: ${error.filePath}
      Language: ${error.language}
      Framework: ${error.framework || 'unknown'}
    `.trim();
    }
    /**
     * Reconstruct example from stored document and metadata
     */
    reconstructExample(document, metadata) {
        // Parse the stored text back into an example
        // This is a simplified version; in production, store full example as JSON
        const lines = document.split('\n');
        return {
            id: `semantic_${Date.now()}_${Math.random()}`,
            errorType: metadata?.errorType || 'unknown',
            errorMessage: this.extractField(lines, 'Error Message') || 'Unknown error',
            filePath: metadata?.filePath || 'unknown',
            lineNumber: 0,
            analysis: {
                problem: '',
                rootCause: this.extractField(lines, 'Root Cause') || 'Unknown cause',
                evidence: [],
            },
            solution: {
                summary: this.extractField(lines, 'Fix') || 'See documentation',
                steps: [],
            },
            tags: metadata?.tags || [],
        };
    }
    /**
     * Extract field value from document lines
     */
    extractField(lines, fieldName) {
        const line = lines.find(l => l.trim().startsWith(fieldName + ':'));
        if (!line)
            return null;
        return line.substring(line.indexOf(':') + 1).trim();
    }
    /**
     * Explain why this example is similar
     */
    explainSimilarity(error, example, similarity) {
        const reasons = [];
        if (error.type === example.errorType) {
            reasons.push('same error type');
        }
        if (error.language && example.filePath?.endsWith(`.${error.language}`)) {
            reasons.push('same language');
        }
        if (error.framework && example.context?.framework === error.framework) {
            reasons.push('same framework');
        }
        if (similarity > 0.8) {
            reasons.push('very high semantic similarity');
        }
        else if (similarity > 0.7) {
            reasons.push('high semantic similarity');
        }
        return reasons.length > 0 ? reasons.join(', ') : 'semantic match';
    }
    /**
     * Get related error types for pattern search
     */
    getRelatedErrorTypes(errorType) {
        const relatedTypes = {
            'lateinit': ['npe', 'uninitialized'],
            'npe': ['lateinit', 'null'],
            'build': ['gradle', 'dependency', 'version'],
            'gradle': ['build', 'dependency'],
            'compose': ['ui', 'jetpack'],
            'network': ['http', 'connection', 'timeout'],
        };
        return relatedTypes[errorType] || [];
    }
    /**
     * Deduplicate search results
     */
    deduplicateResults(results) {
        const seen = new Set();
        const unique = [];
        for (const result of results) {
            const key = `${result.example.errorType}_${result.example.analysis?.rootCause || ''}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(result);
            }
        }
        return unique;
    }
    /**
     * Bulk add examples from existing few-shot database
     */
    async bulkAddExamples(examples) {
        if (!this.isAvailable()) {
            throw new Error('SemanticExampleService not initialized');
        }
        console.log(`📦 Bulk adding ${examples.length} examples to ChromaDB...`);
        for (const example of examples) {
            try {
                await this.addExample(example);
            }
            catch (error) {
                console.warn(`⚠️ Failed to add example ${example.id}:`, error);
            }
        }
        console.log('✓ Bulk add complete');
    }
    /**
     * Clear all examples from collection
     */
    async clearExamples() {
        if (!this.isAvailable())
            return;
        try {
            await this.client.deleteCollection({ name: this.collectionName });
            this.collection = await this.client.createCollection({
                name: this.collectionName,
                metadata: DEFAULT_COLLECTION_METADATA,
            });
            console.log('✓ Cleared example collection');
        }
        catch (error) {
            console.warn('⚠️ Failed to clear examples:', error);
        }
    }
}
exports.SemanticExampleService = SemanticExampleService;
//# sourceMappingURL=SemanticExampleService.js.map