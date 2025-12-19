/**
 * Tests for EmbeddingService
 */

import { EmbeddingService, EmbeddingError } from '../../src/db/EmbeddingService';

// Mock fetch globally
global.fetch = jest.fn();

describe('EmbeddingService', () => {
  let embedder: EmbeddingService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(async () => {
    if (embedder) {
      embedder.clearCache();
    }
  });
  
  describe('create()', () => {
    it('should create and initialize embedding service', async () => {
      // Mock successful Ollama connection
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      embedder = await EmbeddingService.create();
      
      expect(embedder).toBeInstanceOf(EmbeddingService);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });
    
    it('should throw error if Ollama is not reachable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
      
      await expect(EmbeddingService.create()).rejects.toThrow(EmbeddingError);
    });
    
    it('should accept custom configuration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      embedder = await EmbeddingService.create({
        model: 'custom-model',
        batchSize: 16,
        endpoint: 'http://custom:8080'
      });
      
      expect(mockFetch).toHaveBeenCalledWith('http://custom:8080/api/tags');
    });
  });
  
  describe('embed()', () => {
    beforeEach(async () => {
      // Mock initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      embedder = await EmbeddingService.create();
    });
    
    it('should generate embedding for text', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embedding: mockEmbedding })
      } as Response);
      
      const result = await embedder.embed('NullPointerException in MainActivity');
      
      expect(result).toEqual(mockEmbedding);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/embeddings',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('NullPointerException in MainActivity')
        })
      );
    });
    
    it('should throw error for empty text', async () => {
      await expect(embedder.embed('')).rejects.toThrow(EmbeddingError);
      await expect(embedder.embed('   ')).rejects.toThrow(EmbeddingError);
    });
    
    it('should cache embeddings', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: mockEmbedding })
      } as Response);
      
      // Reset call count after initialization
      mockFetch.mockClear();
      
      // First call - should hit API
      const result1 = await embedder.embed('test text');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      const result2 = await embedder.embed('test text');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
      
      expect(result1).toEqual(result2);
    });
    
    it('should normalize text for caching', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: mockEmbedding })
      } as Response);
      
      // Reset call count after initialization
      mockFetch.mockClear();
      
      // Different casing/whitespace should use same cache
      await embedder.embed('Test Text');
      await embedder.embed('test text');
      await embedder.embed('  test text  ');
      
      // Should only call API once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    
    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);
      
      await expect(embedder.embed('test')).rejects.toThrow(EmbeddingError);
    });
    
    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embedding: null })
      } as Response);
      
      await expect(embedder.embed('test')).rejects.toThrow(EmbeddingError);
    });
  });
  
  describe('embedBatch()', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      embedder = await EmbeddingService.create();
    });
    
    it('should generate embeddings for multiple texts', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: mockEmbedding })
      } as Response);
      
      const texts = ['error 1', 'error 2', 'error 3'];
      const results = await embedder.embedBatch(texts);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toHaveLength(384);
    });
    
    it('should return empty array for empty input', async () => {
      const results = await embedder.embedBatch([]);
      expect(results).toEqual([]);
    });
    
    it('should process in batches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      // Create service with small batch size
      const smallBatchEmbedder = await EmbeddingService.create({ batchSize: 2 });
      
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: mockEmbedding })
      } as Response);
      
      const texts = ['text1', 'text2', 'text3', 'text4', 'text5'];
      const results = await smallBatchEmbedder.embedBatch(texts);
      
      expect(results).toHaveLength(5);
      // Should batch into: [1,2], [3,4], [5]
    });
    
    it('should handle partial failures gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ embedding: new Array(384).fill(0) })
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ embedding: new Array(384).fill(0) })
        } as Response);
      
      const texts = ['text1', 'text2', 'text3'];
      
      // Should fail on second text
      await expect(embedder.embedBatch(texts)).rejects.toThrow();
    });
  });
  
  describe('cache management', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      embedder = await EmbeddingService.create();
    });
    
    it('should clear cache', async () => {
      const mockEmbedding = new Array(384).fill(0);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: mockEmbedding })
      } as Response);
      
      await embedder.embed('test');
      expect(embedder.getCacheStats().size).toBe(1);
      
      embedder.clearCache();
      expect(embedder.getCacheStats().size).toBe(0);
    });
    
    it('should provide cache statistics', async () => {
      const stats = embedder.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('enabled');
      expect(stats.enabled).toBe(true);
    });
    
    it('should respect cache disable flag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      const noCacheEmbedder = await EmbeddingService.create({ enableCache: false });
      
      expect(noCacheEmbedder.getCacheStats().enabled).toBe(false);
    });
  });
  
  describe('getEmbeddingDimension()', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as Response);
      
      embedder = await EmbeddingService.create();
    });
    
    it('should return correct embedding dimension', () => {
      expect(embedder.getEmbeddingDimension()).toBe(384);
    });
  });
});
