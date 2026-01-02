"use strict";
/**
 * Embedding Service for Semantic Similarity
 *
 * Generates vector embeddings for text using sentence-transformers model.
 * Supports batch processing and caching for efficiency.
 *
 * @module db/EmbeddingService
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = exports.EmbeddingError = void 0;
/**
 * Error thrown when embedding operations fail
 */
class EmbeddingError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'EmbeddingError';
    }
}
exports.EmbeddingError = EmbeddingError;
/**
 * Embedding Service using Ollama's embedding API
 *
 * Uses Ollama's built-in embedding endpoint for generating vector embeddings.
 * ChromaDB will handle the embedding model internally, so this service
 * primarily provides a consistent interface and caching layer.
 *
 * @example
 * ```typescript
 * const embedder = await EmbeddingService.create();
 *
 * // Single text embedding
 * const vector = await embedder.embed('NullPointerException in MainActivity');
 *
 * // Batch embeddings
 * const vectors = await embedder.embedBatch([
 *   'lateinit property not initialized',
 *   'NullPointerException at line 45',
 *   'Type mismatch error'
 * ]);
 * ```
 */
class EmbeddingService {
    /**
     * Private constructor - use create() factory method
     */
    constructor(config) {
        this.cache = new Map();
        this.config = {
            model: config?.model || 'all-MiniLM-L6-v2',
            batchSize: config?.batchSize || 32,
            enableCache: config?.enableCache !== false,
            endpoint: config?.endpoint || 'http://localhost:11434'
        };
    }
    /**
     * Create and initialize embedding service
     *
     * @param config - Optional configuration
     * @returns Initialized embedding service
     *
     * @example
     * ```typescript
     * const embedder = await EmbeddingService.create({
     *   model: 'all-MiniLM-L6-v2',
     *   batchSize: 16
     * });
     * ```
     */
    static async create(config) {
        const service = new EmbeddingService(config);
        await service.initialize();
        return service;
    }
    /**
     * Initialize the embedding service
     *
     * @throws {EmbeddingError} If initialization fails
     */
    async initialize() {
        // Verify Ollama endpoint is reachable
        try {
            const response = await fetch(`${this.config.endpoint}/api/tags`);
            if (!response.ok) {
                throw new Error(`Ollama server returned ${response.status}`);
            }
        }
        catch (error) {
            throw new EmbeddingError('Failed to connect to Ollama embedding service', error);
        }
    }
    /**
     * Generate embedding for a single text
     *
     * Uses Ollama's embedding API. For ChromaDB integration, embeddings are
     * generated as 384-dimensional vectors (default for all-MiniLM-L6-v2).
     *
     * @param text - Text to embed
     * @returns Embedding vector (384-dimensional)
     * @throws {EmbeddingError} If embedding generation fails
     *
     * @example
     * ```typescript
     * const vector = await embedder.embed('NullPointerException');
     * console.log(vector.length); // 384
     * ```
     */
    async embed(text) {
        if (!text || text.trim().length === 0) {
            throw new EmbeddingError('Cannot embed empty text');
        }
        // Check cache
        const cacheKey = this.getCacheKey(text);
        if (this.config.enableCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            // Use Ollama's embedding endpoint
            const response = await fetch(`${this.config.endpoint}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'all-minilm:l6-v2',
                    prompt: text
                })
            });
            if (!response.ok) {
                throw new Error(`Ollama embedding API returned ${response.status}`);
            }
            const data = await response.json();
            const embedding = data.embedding;
            if (!Array.isArray(embedding) || embedding.length === 0) {
                throw new Error('Invalid embedding response from Ollama');
            }
            // Cache result
            if (this.config.enableCache) {
                this.cache.set(cacheKey, embedding);
            }
            return embedding;
        }
        catch (error) {
            throw new EmbeddingError(`Failed to generate embedding for text: ${text.slice(0, 50)}...`, error);
        }
    }
    /**
     * Generate embeddings for multiple texts in batch
     *
     * Processes texts in batches for efficiency. Uses internal batching
     * to avoid overwhelming the embedding service.
     *
     * @param texts - Array of texts to embed
     * @returns Array of embedding vectors
     * @throws {EmbeddingError} If batch embedding fails
     *
     * @example
     * ```typescript
     * const vectors = await embedder.embedBatch([
     *   'error message 1',
     *   'error message 2',
     *   'error message 3'
     * ]);
     * ```
     */
    async embedBatch(texts) {
        if (texts.length === 0) {
            return [];
        }
        const embeddings = [];
        // Process in batches
        for (let i = 0; i < texts.length; i += this.config.batchSize) {
            const batch = texts.slice(i, i + this.config.batchSize);
            // Process batch sequentially (could be parallelized further)
            const batchResults = await Promise.all(batch.map(text => this.embed(text)));
            embeddings.push(...batchResults);
        }
        return embeddings;
    }
    /**
     * Clear the embedding cache
     *
     * Useful for testing or when memory usage is high.
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     *
     * @returns Object with cache size and hit rate information
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            enabled: this.config.enableCache
        };
    }
    /**
     * Generate cache key for text
     *
     * Uses normalized text as cache key to maximize hit rate.
     */
    getCacheKey(text) {
        return text.trim().toLowerCase();
    }
    /**
     * Get the dimension of embeddings produced by this service
     *
     * @returns Embedding dimension (384 for all-MiniLM-L6-v2)
     */
    getEmbeddingDimension() {
        // all-MiniLM-L6-v2 produces 384-dimensional embeddings
        return 384;
    }
}
exports.EmbeddingService = EmbeddingService;
//# sourceMappingURL=EmbeddingService.js.map