/**
 * Unit tests for FeedbackHandler
 * 
 * Tests user feedback processing, confidence adjustments, cache invalidation,
 * and quality score updates.
 */

import { FeedbackHandler, FeedbackError } from '../../src/agent/FeedbackHandler';
import { ChromaDBClient } from '../../src/db/ChromaDBClient';
import { RCACache } from '../../src/cache/RCACache';
import { RCADocument } from '../../src/db/schemas/rca-collection';

// Mock dependencies
jest.mock('../../src/db/ChromaDBClient');
jest.mock('../../src/cache/RCACache');

describe('FeedbackHandler', () => {
  let handler: FeedbackHandler;
  let mockDb: jest.Mocked<ChromaDBClient>;
  let mockCache: jest.Mocked<RCACache>;
  
  // Sample RCA document for testing
  const createSampleRCA = (overrides?: Partial<RCADocument>): RCADocument => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    error_message: 'lateinit property user has not been initialized',
    error_type: 'lateinit',
    language: 'kotlin',
    root_cause: 'Property accessed before initialization',
    fix_guidelines: ['Initialize in onCreate()', 'Use lazy initialization'],
    confidence: 0.7,
    created_at: Date.now() - 1000 * 60 * 60, // 1 hour ago
    user_validated: false,
    quality_score: 0.65,
    ...overrides
  });
  
  beforeEach(() => {
    // Create mock instances
    mockDb = {
      getById: jest.fn(),
      update: jest.fn(),
      searchSimilar: jest.fn(),
      addRCA: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<ChromaDBClient>;
    
    mockCache = {
      invalidate: jest.fn(),
      get: jest.fn(),
      set: jest.fn()
    } as unknown as jest.Mocked<RCACache>;
    
    // Create handler with logging disabled for cleaner test output
    handler = new FeedbackHandler(mockDb, mockCache, { enableLogging: false });
  });
  
  describe('constructor', () => {
    it('should create handler with default configuration', () => {
      const h = new FeedbackHandler(mockDb, mockCache);
      expect(h).toBeDefined();
    });
    
    it('should accept custom configuration', () => {
      const h = new FeedbackHandler(mockDb, mockCache, {
        positiveMultiplier: 1.5,
        negativeMultiplier: 0.3,
        maxConfidence: 0.95,
        minConfidence: 0.15
      });
      expect(h).toBeDefined();
    });
  });
  
  describe('handlePositive()', () => {
    it('should increase confidence by 20%', async () => {
      const rca = createSampleRCA({ confidence: 0.7 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handlePositive(rca.id);
      
      expect(result.success).toBe(true);
      expect(result.previousConfidence).toBe(0.7);
      expect(result.newConfidence).toBeCloseTo(0.84, 2); // 0.7 * 1.2
    });
    
    it('should cap confidence at 1.0', async () => {
      const rca = createSampleRCA({ confidence: 0.9 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handlePositive(rca.id);
      
      expect(result.newConfidence).toBe(1.0); // Capped at max
    });
    
    it('should mark document as user-validated', async () => {
      const rca = createSampleRCA({ user_validated: false });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await handler.handlePositive(rca.id);
      
      expect(mockDb.update).toHaveBeenCalledWith(
        rca.id,
        expect.objectContaining({ user_validated: true })
      );
    });
    
    it('should recalculate quality score', async () => {
      const rca = createSampleRCA({ confidence: 0.7, quality_score: 0.65 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handlePositive(rca.id);
      
      expect(result.newQuality).toBeGreaterThan(result.previousQuality);
    });
    
    it('should not invalidate cache on positive feedback', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handlePositive(rca.id, 'errorHash123');
      
      expect(result.cacheInvalidated).toBe(false);
      expect(mockCache.invalidate).not.toHaveBeenCalled();
    });
    
    it('should throw FeedbackError if document not found', async () => {
      mockDb.getById.mockResolvedValue(null);
      
      await expect(handler.handlePositive('nonexistent'))
        .rejects.toThrow(FeedbackError);
    });
    
    it('should return correct feedback type in result', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handlePositive(rca.id);
      
      expect(result.feedbackType).toBe('positive');
      expect(result.rcaId).toBe(rca.id);
    });
  });
  
  describe('handleNegative()', () => {
    it('should decrease confidence by 50%', async () => {
      const rca = createSampleRCA({ confidence: 0.8 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      mockCache.invalidate.mockReturnValue(true);
      
      const result = await handler.handleNegative(rca.id, 'errorHash');
      
      expect(result.success).toBe(true);
      expect(result.previousConfidence).toBe(0.8);
      expect(result.newConfidence).toBeCloseTo(0.4, 2); // 0.8 * 0.5
    });
    
    it('should floor confidence at 0.1', async () => {
      const rca = createSampleRCA({ confidence: 0.15 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      mockCache.invalidate.mockReturnValue(true);
      
      const result = await handler.handleNegative(rca.id, 'errorHash');
      
      expect(result.newConfidence).toBe(0.1); // Floored at min
    });
    
    it('should remove user-validated status', async () => {
      const rca = createSampleRCA({ user_validated: true });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      mockCache.invalidate.mockReturnValue(true);
      
      await handler.handleNegative(rca.id, 'errorHash');
      
      expect(mockDb.update).toHaveBeenCalledWith(
        rca.id,
        expect.objectContaining({ user_validated: false })
      );
    });
    
    it('should invalidate cache when errorHash provided', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      mockCache.invalidate.mockReturnValue(true);
      
      const result = await handler.handleNegative(rca.id, 'errorHash123');
      
      expect(mockCache.invalidate).toHaveBeenCalledWith('errorHash123');
      expect(result.cacheInvalidated).toBe(true);
    });
    
    it('should not invalidate cache when errorHash not provided', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handleNegative(rca.id);
      
      expect(mockCache.invalidate).not.toHaveBeenCalled();
      expect(result.cacheInvalidated).toBe(false);
    });
    
    it('should report false if cache invalidation fails', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      mockCache.invalidate.mockReturnValue(false);
      
      const result = await handler.handleNegative(rca.id, 'nonexistent');
      
      expect(result.cacheInvalidated).toBe(false);
    });
    
    it('should throw FeedbackError if document not found', async () => {
      mockDb.getById.mockResolvedValue(null);
      
      await expect(handler.handleNegative('nonexistent', 'hash'))
        .rejects.toThrow(FeedbackError);
    });
    
    it('should return correct feedback type in result', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handleNegative(rca.id);
      
      expect(result.feedbackType).toBe('negative');
      expect(result.rcaId).toBe(rca.id);
    });
    
    it('should recalculate quality score', async () => {
      const rca = createSampleRCA({ confidence: 0.8, quality_score: 0.75 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handleNegative(rca.id);
      
      expect(result.newQuality).toBeLessThan(result.previousQuality);
    });
  });
  
  describe('handleFeedback()', () => {
    it('should route to handlePositive for positive feedback', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handleFeedback(rca.id, 'positive');
      
      expect(result.feedbackType).toBe('positive');
      expect(result.newConfidence).toBeGreaterThan(result.previousConfidence);
    });
    
    it('should route to handleNegative for negative feedback', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await handler.handleFeedback(rca.id, 'negative');
      
      expect(result.feedbackType).toBe('negative');
      expect(result.newConfidence).toBeLessThan(result.previousConfidence);
    });
    
    it('should pass errorHash to both handlers', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      mockCache.invalidate.mockReturnValue(true);
      
      const result = await handler.handleFeedback(rca.id, 'negative', 'hash123');
      
      expect(mockCache.invalidate).toHaveBeenCalledWith('hash123');
      expect(result.cacheInvalidated).toBe(true);
    });
  });
  
  describe('getStats()', () => {
    it('should return initial empty stats', () => {
      const stats = handler.getStats();
      
      expect(stats.totalPositive).toBe(0);
      expect(stats.totalNegative).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
    });
    
    it('should track positive feedback count', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await handler.handlePositive(rca.id);
      await handler.handlePositive(rca.id);
      
      const stats = handler.getStats();
      expect(stats.totalPositive).toBe(2);
      expect(stats.total).toBe(2);
    });
    
    it('should track negative feedback count', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await handler.handleNegative(rca.id);
      await handler.handleNegative(rca.id);
      await handler.handleNegative(rca.id);
      
      const stats = handler.getStats();
      expect(stats.totalNegative).toBe(3);
      expect(stats.total).toBe(3);
    });
    
    it('should calculate success rate correctly', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await handler.handlePositive(rca.id);
      await handler.handleNegative(rca.id);
      await handler.handlePositive(rca.id);
      await handler.handleNegative(rca.id);
      
      const stats = handler.getStats();
      expect(stats.successRate).toBe(1.0); // All succeeded
    });
    
    it('should calculate average positive boost', async () => {
      const rca = createSampleRCA({ confidence: 0.5 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await handler.handlePositive(rca.id);
      
      const stats = handler.getStats();
      expect(stats.avgPositiveBoost).toBeCloseTo(0.1, 2); // 0.6 - 0.5
    });
    
    it('should calculate average negative reduction', async () => {
      const rca = createSampleRCA({ confidence: 0.8 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await handler.handleNegative(rca.id);
      
      const stats = handler.getStats();
      expect(stats.avgNegativeReduction).toBeCloseTo(0.4, 2); // 0.8 - 0.4
    });
  });
  
  describe('resetStats()', () => {
    it('should reset all statistics to zero', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await handler.handlePositive(rca.id);
      await handler.handleNegative(rca.id);
      
      handler.resetStats();
      
      const stats = handler.getStats();
      expect(stats.totalPositive).toBe(0);
      expect(stats.totalNegative).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.avgPositiveBoost).toBe(0);
      expect(stats.avgNegativeReduction).toBe(0);
    });
  });
  
  describe('configuration options', () => {
    it('should respect custom positive multiplier', async () => {
      const customHandler = new FeedbackHandler(mockDb, mockCache, {
        positiveMultiplier: 1.5,
        enableLogging: false
      });
      
      const rca = createSampleRCA({ confidence: 0.6 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await customHandler.handlePositive(rca.id);
      
      expect(result.newConfidence).toBeCloseTo(0.9, 2); // 0.6 * 1.5
    });
    
    it('should respect custom negative multiplier', async () => {
      const customHandler = new FeedbackHandler(mockDb, mockCache, {
        negativeMultiplier: 0.3,
        enableLogging: false
      });
      
      const rca = createSampleRCA({ confidence: 0.9 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await customHandler.handleNegative(rca.id);
      
      expect(result.newConfidence).toBeCloseTo(0.27, 2); // 0.9 * 0.3
    });
    
    it('should respect custom max confidence', async () => {
      const customHandler = new FeedbackHandler(mockDb, mockCache, {
        maxConfidence: 0.95,
        enableLogging: false
      });
      
      const rca = createSampleRCA({ confidence: 0.9 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await customHandler.handlePositive(rca.id);
      
      expect(result.newConfidence).toBe(0.95); // Capped at custom max
    });
    
    it('should respect custom min confidence', async () => {
      const customHandler = new FeedbackHandler(mockDb, mockCache, {
        minConfidence: 0.2,
        enableLogging: false
      });
      
      const rca = createSampleRCA({ confidence: 0.3 });
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      const result = await customHandler.handleNegative(rca.id);
      
      expect(result.newConfidence).toBe(0.2); // Floored at custom min
    });
    
    it('should disable cache invalidation when configured', async () => {
      const customHandler = new FeedbackHandler(mockDb, mockCache, {
        invalidateCacheOnNegative: false,
        enableLogging: false
      });
      
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockResolvedValue(undefined);
      
      await customHandler.handleNegative(rca.id, 'hash');
      
      expect(mockCache.invalidate).not.toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should wrap database errors in FeedbackError', async () => {
      mockDb.getById.mockRejectedValue(new Error('Database connection lost'));
      
      await expect(handler.handlePositive('someId'))
        .rejects.toThrow(FeedbackError);
    });
    
    it('should include rcaId in FeedbackError', async () => {
      mockDb.getById.mockResolvedValue(null);
      
      try {
        await handler.handlePositive('testId123');
      } catch (error) {
        expect(error).toBeInstanceOf(FeedbackError);
        expect((error as FeedbackError).rcaId).toBe('testId123');
      }
    });
    
    it('should include feedbackType in FeedbackError', async () => {
      mockDb.getById.mockResolvedValue(null);
      
      try {
        await handler.handleNegative('testId');
      } catch (error) {
        expect(error).toBeInstanceOf(FeedbackError);
        expect((error as FeedbackError).feedbackType).toBe('negative');
      }
    });
    
    it('should handle update failures gracefully', async () => {
      const rca = createSampleRCA();
      mockDb.getById.mockResolvedValue(rca);
      mockDb.update.mockRejectedValue(new Error('Update failed'));
      
      await expect(handler.handlePositive(rca.id))
        .rejects.toThrow(FeedbackError);
    });
  });
});
