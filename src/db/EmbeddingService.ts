/**
 * Embedding Service for Semantic Similarity
 * 
 * Generates vector embeddings for text using sentence-transformers model.
 * Supports batch processing and caching for efficiency.
 * 
 * @module db/EmbeddingService
 */

/**
 * Configuration for embedding service
 */
export interface EmbeddingConfig {
  /** Model identifier (default: all-MiniLM-L6-v2) */
  model?: string;
  
  /** Maximum batch size for processing (default: 32) */
  batchSize?: number;
  
  /** Enable caching of embeddings (default: true) */
  enableCache?: boolean;
  
  /** API endpoint for embedding service (default: Ollama) */
  endpoint?: string;
}

/**
 * Error thrown when embedding operations fail
 */
export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

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
export class EmbeddingService {
  private cache: Map<string, number[]> = new Map();
  private config: Required<EmbeddingConfig>;
  
  /**
   * Private constructor - use create() factory method
   */
  private constructor(config?: EmbeddingConfig) {
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
  static async create(config?: EmbeddingConfig): Promise<EmbeddingService> {
    const service = new EmbeddingService(config);
    await service.initialize();
    return service;
  }
  
  /**
   * Initialize the embedding service
   * 
   * @throws {EmbeddingError} If initialization fails
   */
  private async initialize(): Promise<void> {
    // Verify Ollama endpoint is reachable
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama server returned ${response.status}`);
      }
    } catch (error) {
      throw new EmbeddingError(
        'Failed to connect to Ollama embedding service',
        error as Error
      );
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
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new EmbeddingError('Cannot embed empty text');
    }
    
    // Check cache
    const cacheKey = this.getCacheKey(text);
    if (this.config.enableCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
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
      const embedding = (data as { embedding: number[] }).embedding;
      
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding response from Ollama');
      }
      
      // Cache result
      if (this.config.enableCache) {
        this.cache.set(cacheKey, embedding);
      }
      
      return embedding;
    } catch (error) {
      throw new EmbeddingError(
        `Failed to generate embedding for text: ${text.slice(0, 50)}...`,
        error as Error
      );
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
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }
    
    const embeddings: number[][] = [];
    
    // Process in batches
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize);
      
      // Process batch sequentially (could be parallelized further)
      const batchResults = await Promise.all(
        batch.map(text => this.embed(text))
      );
      
      embeddings.push(...batchResults);
    }
    
    return embeddings;
  }
  
  /**
   * Clear the embedding cache
   * 
   * Useful for testing or when memory usage is high.
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Object with cache size and hit rate information
   */
  getCacheStats(): { size: number; enabled: boolean } {
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
  private getCacheKey(text: string): string {
    return text.trim().toLowerCase();
  }
  
  /**
   * Get the dimension of embeddings produced by this service
   * 
   * @returns Embedding dimension (384 for all-MiniLM-L6-v2)
   */
  getEmbeddingDimension(): number {
    // all-MiniLM-L6-v2 produces 384-dimensional embeddings
    return 384;
  }
}
