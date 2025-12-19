/**
 * Unit tests for ChromaDBClient
 * 
 * Tests all ChromaDB operations including connection, CRUD operations,
 * search functionality, and error handling.
 */

import { ChromaDBClient, ChromaDBError } from '../../src/db/ChromaDBClient';
import { RCADocument } from '../../src/db/schemas/rca-collection';
import { ChromaClient } from 'chromadb';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000') // Valid v4 UUID
}));

// Mock ChromaDB
jest.mock('chromadb');

// Mock EmbeddingService
jest.mock('../../src/db/EmbeddingService', () => ({
  EmbeddingService: {
    create: jest.fn().mockResolvedValue({
      embed: jest.fn().mockResolvedValue(Array(384).fill(0.1)), // Mock 384D embedding vector
      embedBatch: jest.fn().mockResolvedValue([Array(384).fill(0.1), Array(384).fill(0.2)]),
      getEmbeddingDimension: jest.fn().mockReturnValue(384)
    })
  }
}));

describe('ChromaDBClient', () => {
  let mockChromaClient: jest.Mocked<ChromaClient>;
  let mockCollection: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock collection
    mockCollection = {
      add: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ ids: [], documents: [], metadatas: [] }),
      query: jest.fn().mockResolvedValue({ ids: [[]], documents: [[]], metadatas: [[]], distances: [[]] }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0)
    };
    
    // Create mock ChromaClient
    mockChromaClient = {
      heartbeat: jest.fn().mockResolvedValue(undefined),
      getOrCreateCollection: jest.fn().mockResolvedValue(mockCollection),
      deleteCollection: jest.fn().mockResolvedValue(undefined)
    } as any;
    
    (ChromaClient as jest.MockedClass<typeof ChromaClient>).mockImplementation(() => mockChromaClient);
  });
  
  describe('create()', () => {
    it('should create client with default configuration', async () => {
      const client = await ChromaDBClient.create();
      
      expect(client).toBeInstanceOf(ChromaDBClient);
      expect(mockChromaClient.heartbeat).toHaveBeenCalled();
      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledWith({
        name: 'rca_solutions',
        metadata: expect.objectContaining({
          description: expect.any(String)
        })
      });
    });
    
    it('should create client with custom configuration', async () => {
      const client = await ChromaDBClient.create({
        url: 'http://custom:9000',
        collectionName: 'custom_collection',
        enableHealthCheck: true
      });
      
      expect(client).toBeInstanceOf(ChromaDBClient);
      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledWith({
        name: 'custom_collection',
        metadata: expect.any(Object)
      });
    });
    
    it('should skip health check when disabled', async () => {
      await ChromaDBClient.create({ enableHealthCheck: false });
      
      expect(mockChromaClient.heartbeat).not.toHaveBeenCalled();
    });
    
    it('should throw ChromaDBError on connection failure', async () => {
      mockChromaClient.heartbeat.mockRejectedValue(new Error('Connection refused'));
      
      await expect(ChromaDBClient.create()).rejects.toThrow(ChromaDBError);
      await expect(ChromaDBClient.create()).rejects.toThrow('Failed to initialize ChromaDB client');
    });
    
    it('should throw ChromaDBError on collection initialization failure', async () => {
      mockChromaClient.getOrCreateCollection.mockRejectedValue(new Error('Collection error'));
      
      await expect(ChromaDBClient.create()).rejects.toThrow(ChromaDBError);
    });
  });
  
  describe('checkHealth()', () => {
    it('should return true when server is healthy', async () => {
      const client = await ChromaDBClient.create();
      
      const isHealthy = await client.checkHealth();
      
      expect(isHealthy).toBe(true);
      expect(mockChromaClient.heartbeat).toHaveBeenCalled();
    });
    
    it('should return false when server is unhealthy', async () => {
      const client = await ChromaDBClient.create();
      
      mockChromaClient.heartbeat.mockRejectedValue(new Error('Server down'));
      
      const isHealthy = await client.checkHealth();
      
      expect(isHealthy).toBe(false);
    });
  });
  
  describe('addRCA()', () => {
    let client: ChromaDBClient;
    
    beforeEach(async () => {
      client = await ChromaDBClient.create();
    });
    
    it('should add RCA document and return ID', async () => {
      const rca: Omit<RCADocument, 'id' | 'created_at'> = {
        error_message: 'lateinit property user has not been initialized',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Property accessed before initialization',
        fix_guidelines: ['Initialize in onCreate()'],
        confidence: 0.9,
        user_validated: false,
        quality_score: 0.9
      };
      
      const id = await client.addRCA(rca);
      
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(mockCollection.add).toHaveBeenCalledWith({
        ids: [id],
        embeddings: [expect.any(Array)], // Embedding vector
        documents: expect.arrayContaining([expect.stringContaining('Error: lateinit property')]),
        metadatas: expect.arrayContaining([
          expect.objectContaining({
            language: 'kotlin',
            error_type: 'lateinit',
            confidence: 0.9
          })
        ])
      });
    });
    
    it('should include optional fields in document', async () => {
      const rca: Omit<RCADocument, 'id' | 'created_at'> = {
        error_message: 'NullPointerException',
        error_type: 'npe',
        language: 'kotlin',
        root_cause: 'Null reference',
        fix_guidelines: ['Add null check'],
        confidence: 0.8,
        user_validated: true,
        quality_score: 0.85,
        file_path: 'MainActivity.kt',
        line_number: 45,
        code_context: 'val name = user.name'
      };
      
      const id = await client.addRCA(rca);
      
      expect(id).toBeTruthy();
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: expect.arrayContaining([
            expect.stringContaining('File: MainActivity.kt')
          ])
        })
      );
    });
    
    it('should throw error for invalid document', async () => {
      const invalidRCA: any = {
        error_message: '', // Empty not allowed
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Test',
        fix_guidelines: [],
        confidence: 0.9,
        user_validated: false,
        quality_score: 0.9
      };
      
      await expect(client.addRCA(invalidRCA)).rejects.toThrow();
    });
    
    it('should throw error for invalid confidence range', async () => {
      const invalidRCA: any = {
        error_message: 'Test error',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Test cause',
        fix_guidelines: ['Fix 1'],
        confidence: 1.5, // Invalid: > 1.0
        user_validated: false,
        quality_score: 0.9
      };
      
      await expect(client.addRCA(invalidRCA)).rejects.toThrow();
    });
    
    it('should throw ChromaDBError on storage failure', async () => {
      mockCollection.add.mockRejectedValue(new Error('Storage failure'));
      
      const rca: Omit<RCADocument, 'id' | 'created_at'> = {
        error_message: 'Test error',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Test',
        fix_guidelines: ['Fix'],
        confidence: 0.9,
        user_validated: false,
        quality_score: 0.9
      };
      
      await expect(client.addRCA(rca)).rejects.toThrow(ChromaDBError);
      await expect(client.addRCA(rca)).rejects.toThrow('Failed to add RCA document');
    });
  });
  
  describe('getById()', () => {
    let client: ChromaDBClient;
    
    beforeEach(async () => {
      client = await ChromaDBClient.create();
    });
    
    it('should retrieve document by ID', async () => {
      const mockId = '123e4567-e89b-12d3-a456-426614174000';
      const mockDoc = `Error: lateinit property user has not been initialized
Type: lateinit
Language: kotlin
Root Cause: Property accessed before initialization
Fix: Initialize in onCreate()`;
      
      mockCollection.get.mockResolvedValue({
        ids: [mockId],
        documents: [mockDoc],
        metadatas: [{
          language: 'kotlin',
          error_type: 'lateinit',
          confidence: 0.9,
          quality_score: 0.9,
          created_at: Date.now(),
          user_validated: false
        }]
      });
      
      const result = await client.getById(mockId);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockId);
      expect(result?.error_type).toBe('lateinit');
      expect(result?.language).toBe('kotlin');
      expect(mockCollection.get).toHaveBeenCalledWith({
        ids: [mockId],
        include: expect.any(Array)
      });
    });
    
    it('should return null for non-existent ID', async () => {
      mockCollection.get.mockResolvedValue({
        ids: [],
        documents: [],
        metadatas: []
      });
      
      const result = await client.getById('non-existent-id');
      
      expect(result).toBeNull();
    });
    
    it('should throw ChromaDBError on retrieval failure', async () => {
      mockCollection.get.mockRejectedValue(new Error('Database error'));
      
      await expect(client.getById('test-id')).rejects.toThrow(ChromaDBError);
    });
  });
  
  describe('searchSimilar()', () => {
    let client: ChromaDBClient;
    
    beforeEach(async () => {
      client = await ChromaDBClient.create();
    });
    
    it('should search for similar documents', async () => {
      const mockDoc1 = `Error: lateinit property user has not been initialized
Type: lateinit
Language: kotlin
Root Cause: Property accessed before initialization
Fix: Initialize in onCreate()`;
      
      const mockDoc2 = `Error: lateinit property data has not been initialized
Type: lateinit
Language: kotlin
Root Cause: Property not initialized
Fix: Add initialization`;
      
      mockCollection.query.mockResolvedValue({
        ids: [['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']],
        documents: [[mockDoc1, mockDoc2]],
        metadatas: [[
          {
            language: 'kotlin',
            error_type: 'lateinit',
            confidence: 0.9,
            quality_score: 0.9,
            created_at: Date.now(),
            user_validated: false
          },
          {
            language: 'kotlin',
            error_type: 'lateinit',
            confidence: 0.85,
            quality_score: 0.85,
            created_at: Date.now(),
            user_validated: false
          }
        ]],
        distances: [[0.1, 0.2]]
      });
      
      const results = await client.searchSimilar('lateinit property error', 5);
      
      expect(results).toHaveLength(2);
      expect(results[0].error_type).toBe('lateinit');
      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: [expect.any(Array)], // Embedding vector instead of queryTexts
        nResults: 10, // 5 * 2 for quality filtering
        where: { quality_score: { $gte: 0.5 } },
        include: expect.any(Array)
      });
    });
    
    it('should filter by minimum quality score', async () => {
      await client.searchSimilar('test error', 5, 0.8);
      
      expect(mockCollection.query).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quality_score: { $gte: 0.8 } }
        })
      );
    });
    
    it('should return empty array when no results found', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        documents: [[]],
        metadatas: [[]],
        distances: [[]]
      });
      
      const results = await client.searchSimilar('no match', 5);
      
      expect(results).toEqual([]);
    });
    
    it('should throw ChromaDBError on search failure', async () => {
      mockCollection.query.mockRejectedValue(new Error('Search failed'));
      
      await expect(client.searchSimilar('test', 5)).rejects.toThrow(ChromaDBError);
      await expect(client.searchSimilar('test', 5)).rejects.toThrow('Failed to search similar documents');
    });
  });
  
  describe('update()', () => {
    let client: ChromaDBClient;
    
    beforeEach(async () => {
      client = await ChromaDBClient.create();
    });
    
    it('should update existing document', async () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440003';
      const existingDoc = `Error: Test error message
Type: lateinit
Language: kotlin
Root Cause: Old cause explanation
Fix: Old fix`;
      
      // Mock getById to return existing document
      mockCollection.get.mockResolvedValue({
        ids: [mockId],
        documents: [existingDoc],
        metadatas: [{
          language: 'kotlin',
          error_type: 'lateinit',
          confidence: 0.8,
          quality_score: 0.8,
          created_at: Date.now(),
          user_validated: false
        }]
      });
      
      await client.update(mockId, { confidence: 0.95, user_validated: true });
      
      expect(mockCollection.update).toHaveBeenCalledWith({
        ids: [mockId],
        embeddings: [expect.any(Array)], // Embedding vector
        documents: expect.any(Array),
        metadatas: expect.arrayContaining([
          expect.objectContaining({
            confidence: 0.95,
            user_validated: true,
            quality_score: expect.any(Number)
          })
        ])
      });
    });
    
    it('should recalculate quality score on update', async () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440004';
      mockCollection.get.mockResolvedValue({
        ids: [mockId],
        documents: ['Error: Test error message\nType: test\nLanguage: kotlin\nRoot Cause: Test root cause explanation\nFix: Test fix guideline'],
        metadatas: [{
          language: 'kotlin',
          error_type: 'test',
          confidence: 0.5,
          quality_score: 0.5,
          created_at: Date.now(),
          user_validated: false
        }]
      });
      
      await client.update(mockId, { user_validated: true });
      
      expect(mockCollection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          metadatas: expect.arrayContaining([
            expect.objectContaining({
              quality_score: expect.any(Number)
            })
          ])
        })
      );
    });
    
    it('should throw error when document not found', async () => {
      mockCollection.get.mockResolvedValue({
        ids: [],
        documents: [],
        metadatas: []
      });
      
      await expect(client.update('non-existent', { confidence: 0.9 })).rejects.toThrow(ChromaDBError);
      await expect(client.update('non-existent', { confidence: 0.9 })).rejects.toThrow('Failed to update document');
    });
    
    it('should throw ChromaDBError on update failure', async () => {
      mockCollection.get.mockResolvedValue({
        ids: ['550e8400-e29b-41d4-a716-446655440005'],
        documents: ['Error: Test error message\nType: test\nLanguage: kotlin\nRoot Cause: Test root cause explanation\nFix: Test fix guideline'],
        metadatas: [{
          language: 'kotlin',
          error_type: 'test',
          confidence: 0.8,
          quality_score: 0.8,
          created_at: Date.now(),
          user_validated: false
        }]
      });
      
      mockCollection.update.mockRejectedValue(new Error('Update failed'));
      
      await expect(client.update('test-id', { confidence: 0.9 })).rejects.toThrow(ChromaDBError);
    });
  });
  
  describe('delete()', () => {
    let client: ChromaDBClient;
    
    beforeEach(async () => {
      client = await ChromaDBClient.create();
    });
    
    it('should delete document by ID', async () => {
      await client.delete('test-id');
      
      expect(mockCollection.delete).toHaveBeenCalledWith({ ids: ['test-id'] });
    });
    
    it('should throw ChromaDBError on deletion failure', async () => {
      mockCollection.delete.mockRejectedValue(new Error('Delete failed'));
      
      await expect(client.delete('test-id')).rejects.toThrow(ChromaDBError);
      await expect(client.delete('test-id')).rejects.toThrow('Failed to delete document');
    });
  });
  
  describe('getStats()', () => {
    it('should return statistics', async () => {
      const client = await ChromaDBClient.create();
      
      const stats = client.getStats();
      
      expect(stats).toHaveProperty('totalDocuments');
      expect(stats).toHaveProperty('successfulOps');
      expect(stats).toHaveProperty('failedOps');
      expect(stats).toHaveProperty('lastOpTime');
    });
    
    it('should update stats after operations', async () => {
      const client = await ChromaDBClient.create();
      
      const rca: Omit<RCADocument, 'id' | 'created_at'> = {
        error_message: 'Test',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Test root cause explanation',
        fix_guidelines: ['Fix'],
        confidence: 0.9,
        user_validated: false,
        quality_score: 0.9
      };
      
      await client.addRCA(rca);
      
      const stats = client.getStats();
      expect(stats.successfulOps).toBeGreaterThan(0);
      expect(stats.totalDocuments).toBeGreaterThan(0);
    });
  });
  
  describe('clear()', () => {
    it('should clear all documents', async () => {
      const client = await ChromaDBClient.create();
      
      await client.clear();
      
      expect(mockChromaClient.deleteCollection).toHaveBeenCalledWith({ name: 'rca_solutions' });
      expect(mockChromaClient.getOrCreateCollection).toHaveBeenCalledTimes(2); // Initial + after clear
    });
    
    it('should throw ChromaDBError on clear failure', async () => {
      const client = await ChromaDBClient.create();
      
      mockChromaClient.deleteCollection.mockRejectedValue(new Error('Clear failed'));
      
      await expect(client.clear()).rejects.toThrow(ChromaDBError);
      await expect(client.clear()).rejects.toThrow('Failed to clear collection');
    });
  });
});
