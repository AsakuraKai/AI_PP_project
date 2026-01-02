"use strict";
/**
 * ChromaDB Client for RCA Document Storage
 *
 * Provides interface to ChromaDB vector database for storing and retrieving
 * Root Cause Analysis documents. Supports similarity search, metadata filtering,
 * and quality-based ranking.
 *
 * @module db/ChromaDBClient
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromaDBClient = exports.ChromaDBError = void 0;
const chromadb_1 = require("chromadb");
const uuid_1 = require("uuid");
const rca_collection_1 = require("./schemas/rca-collection");
const EmbeddingService_1 = require("./EmbeddingService");
/**
 * Error thrown when ChromaDB operations fail
 */
class ChromaDBError extends Error {
    constructor(message, operation, cause) {
        super(message);
        this.operation = operation;
        this.cause = cause;
        this.name = 'ChromaDBError';
    }
}
exports.ChromaDBError = ChromaDBError;
/**
 * ChromaDB Client for managing RCA documents
 *
 * Handles all interactions with ChromaDB vector database including:
 * - Collection management
 * - Document storage and retrieval
 * - Similarity search
 * - Metadata filtering
 * - Health monitoring
 *
 * @example
 * ```typescript
 * const client = await ChromaDBClient.create({ url: 'http://localhost:8000' });
 *
 * // Add RCA document
 * const id = await client.addRCA({
 *   error_message: 'lateinit property user has not been initialized',
 *   error_type: 'lateinit',
 *   language: 'kotlin',
 *   root_cause: 'Property accessed before initialization',
 *   fix_guidelines: ['Initialize in onCreate()'],
 *   confidence: 0.9,
 *   user_validated: false,
 *   quality_score: 0.9
 * });
 *
 * // Search similar errors
 * const results = await client.searchSimilar('NullPointerException', 5);
 * ```
 */
class ChromaDBClient {
    /**
     * Private constructor - use create() factory method instead
     */
    constructor(config) {
        this.stats = {
            totalDocuments: 0,
            successfulOps: 0,
            failedOps: 0,
            lastOpTime: 0
        };
        this.config = {
            url: config.url || 'http://localhost:8000',
            collectionName: config.collectionName || 'rca_solutions',
            enableHealthCheck: config.enableHealthCheck ?? true,
            timeout: config.timeout || 30000
        };
        this.client = new chromadb_1.ChromaClient({ path: this.config.url });
    }
    /**
     * Factory method to create and initialize ChromaDB client
     *
     * @param config - Configuration options
     * @returns Initialized ChromaDB client
     * @throws {ChromaDBError} If connection or initialization fails
     *
     * @example
     * ```typescript
     * const client = await ChromaDBClient.create();
     * ```
     */
    static async create(config = {}) {
        const instance = new ChromaDBClient(config);
        try {
            // Initialize embedding service
            instance.embedder = await EmbeddingService_1.EmbeddingService.create();
            // Check connection health
            if (instance.config.enableHealthCheck) {
                const isHealthy = await instance.checkHealth();
                if (!isHealthy) {
                    throw new Error('ChromaDB server is not responding');
                }
            }
            // Initialize collection
            await instance.initializeCollection();
            console.log(`ChromaDB client connected to ${instance.config.url}`);
            console.log(`Embedding service initialized (${instance.embedder.getEmbeddingDimension()}D vectors)`);
            return instance;
        }
        catch (error) {
            throw new ChromaDBError('Failed to initialize ChromaDB client', 'create', error);
        }
    }
    /**
     * Check if ChromaDB server is healthy and responding
     *
     * @returns True if server is healthy, false otherwise
     */
    async checkHealth() {
        try {
            await this.client.heartbeat();
            return true;
        }
        catch (error) {
            console.error('ChromaDB health check failed:', error);
            return false;
        }
    }
    /**
     * Initialize or get existing collection
     *
     * Creates collection with proper metadata schema if it doesn't exist,
     * or retrieves existing collection.
     *
     * @private
     */
    async initializeCollection() {
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: this.config.collectionName,
                metadata: {
                    description: 'Root Cause Analysis solutions with vector embeddings',
                    'hnsw:space': 'cosine' // Use cosine similarity for semantic search
                }
            });
            // Update stats
            const count = await this.collection.count();
            this.stats.totalDocuments = count;
            console.log(`Collection "${this.config.collectionName}" initialized with ${count} documents`);
        }
        catch (error) {
            throw new ChromaDBError('Failed to initialize collection', 'initializeCollection', error);
        }
    }
    /**
     * Add RCA document to the database
     *
     * Generates UUID, validates document structure, and stores with embeddings.
     * ChromaDB automatically generates embeddings from the document text.
     *
     * @param rca - RCA document (without id and created_at)
     * @returns Generated document ID (UUID)
     * @throws {ChromaDBError} If validation or storage fails
     *
     * @example
     * ```typescript
     * const id = await client.addRCA({
     *   error_message: 'lateinit property user has not been initialized',
     *   error_type: 'lateinit',
     *   language: 'kotlin',
     *   root_cause: 'Property accessed before initialization',
     *   fix_guidelines: ['Initialize in onCreate()'],
     *   confidence: 0.9,
     *   user_validated: false,
     *   quality_score: 0.9
     * });
     * ```
     */
    async addRCA(rca) {
        const startTime = Date.now();
        try {
            // Generate ID and timestamp
            const id = (0, uuid_1.v4)();
            const created_at = Date.now();
            // Create complete document
            const document = {
                ...rca,
                id,
                created_at
            };
            // Validate document structure
            rca_collection_1.RCADocumentSchema.parse(document);
            // Extract metadata for filtering
            const metadata = (0, rca_collection_1.extractMetadata)(document);
            // Create embedding text (combines key fields for semantic search)
            const embeddingText = this.createEmbeddingText(document);
            // Generate embedding vector
            const embedding = await this.embedder.embed(embeddingText);
            // Store in ChromaDB with embedding
            await this.collection.add({
                ids: [id],
                embeddings: [embedding],
                documents: [embeddingText],
                metadatas: [metadata]
            });
            // Update stats
            this.stats.successfulOps++;
            this.stats.totalDocuments++;
            this.stats.lastOpTime = Date.now() - startTime;
            console.log(`Added RCA document ${id} (${this.stats.lastOpTime}ms)`);
            return id;
        }
        catch (error) {
            this.stats.failedOps++;
            throw new ChromaDBError('Failed to add RCA document', 'addRCA', error);
        }
    }
    /**
     * Retrieve RCA document by ID
     *
     * @param id - Document UUID
     * @returns RCA document or null if not found
     * @throws {ChromaDBError} If retrieval fails
     *
     * @example
     * ```typescript
     * const rca = await client.getById('123e4567-e89b-12d3-a456-426614174000');
     * if (rca) {
     *   console.log(rca.root_cause);
     * }
     * ```
     */
    async getById(id) {
        try {
            const results = await this.collection.get({
                ids: [id],
                include: [chromadb_1.IncludeEnum.metadatas, chromadb_1.IncludeEnum.documents]
            });
            if (!results.ids || results.ids.length === 0) {
                return null;
            }
            return this.reconstructDocument(results.ids[0], results.documents?.[0], results.metadatas?.[0]);
        }
        catch (error) {
            throw new ChromaDBError(`Failed to retrieve document ${id}`, 'getById', error);
        }
    }
    /**
     * Search for similar RCA documents using semantic similarity
     *
     * @param errorMessage - Error message to search for
     * @param limit - Maximum number of results (default: 5)
     * @param minQuality - Minimum quality score filter (default: 0.5)
     * @returns Array of similar RCA documents, ranked by relevance
     * @throws {ChromaDBError} If search fails
     *
     * @example
     * ```typescript
     * const similar = await client.searchSimilar(
     *   'lateinit property user has not been initialized',
     *   5,
     *   0.7
     * );
     * ```
     */
    async searchSimilar(errorMessage, limit = 5, minQuality = 0.5) {
        const startTime = Date.now();
        try {
            // Generate embedding for query
            const queryEmbedding = await this.embedder.embed(errorMessage);
            // Search with embedding-based similarity
            const results = await this.collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: limit * 2, // Fetch more to allow for quality filtering
                where: {
                    quality_score: { $gte: minQuality }
                },
                include: [chromadb_1.IncludeEnum.metadatas, chromadb_1.IncludeEnum.documents, chromadb_1.IncludeEnum.distances]
            });
            if (!results.ids || results.ids[0].length === 0) {
                return [];
            }
            const documents = [];
            for (let i = 0; i < results.ids[0].length; i++) {
                const doc = this.reconstructDocument(results.ids[0][i], results.documents?.[0]?.[i], results.metadatas?.[0]?.[i]);
                if (doc) {
                    documents.push(doc);
                }
            }
            // Rank by quality score and limit results
            documents.sort((a, b) => b.quality_score - a.quality_score);
            const topResults = documents.slice(0, limit);
            this.stats.lastOpTime = Date.now() - startTime;
            console.log(`Found ${topResults.length} similar documents (${this.stats.lastOpTime}ms)`);
            return topResults;
        }
        catch (error) {
            throw new ChromaDBError('Failed to search similar documents', 'searchSimilar', error);
        }
    }
    /**
     * Update existing RCA document
     *
     * @param id - Document UUID
     * @param updates - Partial document with fields to update
     * @throws {ChromaDBError} If update fails
     *
     * @example
     * ```typescript
     * await client.update('123e4567-e89b-12d3-a456-426614174000', {
     *   confidence: 0.95,
     *   user_validated: true
     * });
     * ```
     */
    async update(id, updates) {
        try {
            // Get existing document
            const existing = await this.getById(id);
            if (!existing) {
                throw new Error(`Document ${id} not found`);
            }
            // Merge updates
            const updated = {
                ...existing,
                ...updates,
                id: existing.id, // Preserve ID
                created_at: existing.created_at // Preserve creation time
            };
            // Recalculate quality score if confidence or validation changed
            if (updates.confidence !== undefined || updates.user_validated !== undefined) {
                updated.quality_score = (0, rca_collection_1.calculateQualityScore)(updated);
            }
            // Validate updated document
            rca_collection_1.RCADocumentSchema.parse(updated);
            // Extract metadata
            const metadata = (0, rca_collection_1.extractMetadata)(updated);
            // Create embedding text
            const embeddingText = this.createEmbeddingText(updated);
            // Regenerate embedding if error message or root cause changed
            const embedding = await this.embedder.embed(embeddingText);
            // Update in ChromaDB
            await this.collection.update({
                ids: [id],
                embeddings: [embedding],
                documents: [embeddingText],
                metadatas: [metadata]
            });
            this.stats.successfulOps++;
            console.log(`Updated document ${id}`);
        }
        catch (error) {
            this.stats.failedOps++;
            throw new ChromaDBError(`Failed to update document ${id}`, 'update', error);
        }
    }
    /**
     * Delete RCA document by ID
     *
     * @param id - Document UUID
     * @throws {ChromaDBError} If deletion fails
     *
     * @example
     * ```typescript
     * await client.delete('123e4567-e89b-12d3-a456-426614174000');
     * ```
     */
    async delete(id) {
        try {
            await this.collection.delete({ ids: [id] });
            this.stats.successfulOps++;
            this.stats.totalDocuments--;
            console.log(`Deleted document ${id}`);
        }
        catch (error) {
            this.stats.failedOps++;
            throw new ChromaDBError(`Failed to delete document ${id}`, 'delete', error);
        }
    }
    /**
     * Get statistics about ChromaDB operations
     *
     * @returns Current statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear all documents from the collection
     *
     * WARNING: This is destructive and cannot be undone!
     *
     * @throws {ChromaDBError} If clearing fails
     */
    async clear() {
        try {
            // Delete and recreate collection
            await this.client.deleteCollection({ name: this.config.collectionName });
            await this.initializeCollection();
            this.stats.totalDocuments = 0;
            console.log(`Cleared collection "${this.config.collectionName}"`);
        }
        catch (error) {
            throw new ChromaDBError('Failed to clear collection', 'clear', error);
        }
    }
    /**
     * Create embedding text from RCA document
     *
     * Combines key fields into a single text for semantic search.
     *
     * @private
     * @param doc - RCA document
     * @returns Text for embedding generation
     */
    createEmbeddingText(doc) {
        const parts = [
            `Error: ${doc.error_message}`,
            `Type: ${doc.error_type}`,
            `Language: ${doc.language}`,
            `Root Cause: ${doc.root_cause}`,
            `Fix: ${doc.fix_guidelines.join('; ')}`
        ];
        if (doc.file_path) {
            parts.push(`File: ${doc.file_path}`);
        }
        if (doc.code_context) {
            parts.push(`Context: ${doc.code_context.slice(0, 500)}`); // Limit context length
        }
        return parts.join('\n');
    }
    /**
     * Reconstruct RCADocument from ChromaDB results
     *
     * @private
     * @param id - Document ID
     * @param embeddingText - Stored embedding text
     * @param metadata - Document metadata
     * @returns Reconstructed RCA document or null if invalid
     */
    reconstructDocument(id, embeddingText, metadata) {
        try {
            // Parse embedding text to extract fields
            const lines = embeddingText.split('\n');
            const doc = {
                id,
                language: metadata.language,
                error_type: metadata.error_type,
                confidence: metadata.confidence,
                quality_score: metadata.quality_score,
                created_at: metadata.created_at,
                user_validated: metadata.user_validated
            };
            // Extract error_message
            const errorLine = lines.find(l => l.startsWith('Error: '));
            if (errorLine) {
                doc.error_message = errorLine.replace('Error: ', '');
            }
            else {
                // Fallback: use first line if no Error: prefix
                doc.error_message = lines[0] || 'Unknown error';
            }
            // Extract root_cause
            const rootCauseLine = lines.find(l => l.startsWith('Root Cause: '));
            if (rootCauseLine) {
                doc.root_cause = rootCauseLine.replace('Root Cause: ', '');
            }
            else {
                // Required field - must be present
                console.warn(`Missing root_cause for ID ${id}`);
                return null;
            }
            // Extract fix_guidelines
            const fixLine = lines.find(l => l.startsWith('Fix: '));
            if (fixLine) {
                doc.fix_guidelines = fixLine.replace('Fix: ', '').split('; ').filter(g => g.trim());
            }
            else {
                // Required field - provide default
                doc.fix_guidelines = ['Review the error and code context'];
            }
            // Extract file_path (optional)
            const fileLine = lines.find(l => l.startsWith('File: '));
            if (fileLine) {
                doc.file_path = fileLine.replace('File: ', '');
            }
            // Extract code_context (optional)
            const contextLine = lines.find(l => l.startsWith('Context: '));
            if (contextLine) {
                doc.code_context = contextLine.replace('Context: ', '');
            }
            // Validate and return
            try {
                rca_collection_1.RCADocumentSchema.parse(doc);
                return doc;
            }
            catch (validationError) {
                console.warn(`Invalid document structure for ID ${id}:`, {
                    doc,
                    validationError: validationError instanceof Error ? validationError.message : String(validationError)
                });
                return null;
            }
        }
        catch (error) {
            console.error(`Failed to reconstruct document ${id}:`, error);
            return null;
        }
    }
}
exports.ChromaDBClient = ChromaDBClient;
//# sourceMappingURL=ChromaDBClient.js.map