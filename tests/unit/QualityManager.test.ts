/**
 * Unit tests for QualityManager
 * 
 * Tests document evaluation, pruning operations, quality metrics,
 * and auto-prune functionality.
 */

import { QualityManager } from '../../src/db/QualityManager';
import { ChromaDBClient } from '../../src/db/ChromaDBClient';
import { RCADocument } from '../../src/db/schemas/rca-collection';

// Mock dependencies
jest.mock('../../src/db/ChromaDBClient');

describe('QualityManager', () => {
  let manager: QualityManager;
  let mockDb: jest.Mocked<ChromaDBClient>;
  
  const NOW = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_MONTH = 30 * ONE_DAY;
  const SIX_MONTHS = 6 * ONE_MONTH;
  
  // Sample RCA documents for testing
  const createSampleRCA = (overrides?: Partial<RCADocument>): RCADocument => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    error_message: 'lateinit property user has not been initialized',
    error_type: 'lateinit',
    language: 'kotlin',
    root_cause: 'Property accessed before initialization',
    fix_guidelines: ['Initialize in onCreate()'],
    confidence: 0.8,
    created_at: NOW - ONE_DAY, // 1 day old
    user_validated: false,
    quality_score: 0.75,
    ...overrides
  });
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    
    // Create mock instance
    mockDb = {
      getById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      searchSimilar: jest.fn().mockResolvedValue([])
    } as unknown as jest.Mocked<ChromaDBClient>;
    
    // Create manager with logging disabled and auto-prune disabled
    manager = new QualityManager(mockDb, { 
      enableLogging: false,
      enableAutoPrune: false 
    });
  });
  
  afterEach(() => {
    manager.dispose();
    jest.useRealTimers();
  });
  
  describe('constructor', () => {
    it('should create manager with default configuration', () => {
      const m = new QualityManager(mockDb, { enableLogging: false });
      expect(m).toBeDefined();
      expect(m.getConfig().minQualityThreshold).toBe(0.3);
      expect(m.getConfig().maxAgeMs).toBe(SIX_MONTHS);
      m.dispose();
    });
    
    it('should accept custom configuration', () => {
      const m = new QualityManager(mockDb, {
        minQualityThreshold: 0.5,
        maxAgeMs: ONE_MONTH,
        enableLogging: false
      });
      
      expect(m.getConfig().minQualityThreshold).toBe(0.5);
      expect(m.getConfig().maxAgeMs).toBe(ONE_MONTH);
      m.dispose();
    });
    
    it('should start auto-prune when enabled', () => {
      const m = new QualityManager(mockDb, {
        enableAutoPrune: true,
        autoPruneInterval: 1000,
        enableLogging: false
      });
      
      // Verify timer was set
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      m.dispose();
    });
  });
  
  describe('evaluateDocument()', () => {
    it('should return keep recommendation for good quality recent document', () => {
      const doc = createSampleRCA({ 
        quality_score: 0.8, 
        created_at: NOW - ONE_DAY 
      });
      
      const result = manager.evaluateDocument(doc);
      
      expect(result.id).toBe(doc.id);
      expect(result.quality).toBe(0.8);
      expect(result.isBelowThreshold).toBe(false);
      expect(result.isExpired).toBe(false);
      expect(result.recommendation).toBe('keep');
    });
    
    it('should return prune recommendation for low quality document', () => {
      const doc = createSampleRCA({ 
        quality_score: 0.2, // Below 0.3 threshold
        user_validated: false
      });
      
      const result = manager.evaluateDocument(doc);
      
      expect(result.isBelowThreshold).toBe(true);
      expect(result.recommendation).toBe('prune');
    });
    
    it('should return prune recommendation for expired document', () => {
      const doc = createSampleRCA({ 
        quality_score: 0.8,
        created_at: NOW - (SIX_MONTHS + ONE_DAY) // Just over 6 months
      });
      
      const result = manager.evaluateDocument(doc);
      
      expect(result.isExpired).toBe(true);
      expect(result.recommendation).toBe('prune');
    });
    
    it('should return flag recommendation for validated low-quality document', () => {
      const doc = createSampleRCA({ 
        quality_score: 0.2,
        user_validated: true,
        created_at: NOW - ONE_DAY // Not expired
      });
      
      const result = manager.evaluateDocument(doc);
      
      expect(result.isBelowThreshold).toBe(true);
      expect(result.recommendation).toBe('flag');
    });
    
    it('should return prune for validated expired document', () => {
      const doc = createSampleRCA({ 
        quality_score: 0.8,
        user_validated: true,
        created_at: NOW - (SIX_MONTHS + ONE_DAY)
      });
      
      const result = manager.evaluateDocument(doc);
      
      expect(result.isExpired).toBe(true);
      expect(result.recommendation).toBe('prune'); // Expired overrides validation
    });
    
    it('should calculate age correctly', () => {
      const threeDaysAgo = NOW - (3 * ONE_DAY);
      const doc = createSampleRCA({ created_at: threeDaysAgo });
      
      const result = manager.evaluateDocument(doc);
      
      expect(result.ageMs).toBeCloseTo(3 * ONE_DAY, -3);
    });
  });
  
  describe('pruneLowQuality()', () => {
    it('should remove documents below quality threshold', async () => {
      const lowQualityDoc = createSampleRCA({ 
        id: 'low-quality',
        quality_score: 0.2,
        user_validated: false
      });
      const highQualityDoc = createSampleRCA({ 
        id: 'high-quality',
        quality_score: 0.8 
      });
      
      mockDb.searchSimilar.mockResolvedValue([lowQualityDoc, highQualityDoc]);
      mockDb.delete.mockResolvedValue(undefined);
      
      const result = await manager.pruneLowQuality();
      
      expect(result.removedLowQuality).toBe(1);
      expect(result.retained).toBe(1);
      expect(mockDb.delete).toHaveBeenCalledWith('low-quality');
      expect(mockDb.delete).not.toHaveBeenCalledWith('high-quality');
    });
    
    it('should not prune user-validated low-quality documents', async () => {
      const validatedDoc = createSampleRCA({ 
        id: 'validated-low',
        quality_score: 0.2,
        user_validated: true // Should not be pruned
      });
      
      mockDb.searchSimilar.mockResolvedValue([validatedDoc]);
      
      const result = await manager.pruneLowQuality();
      
      expect(result.removedLowQuality).toBe(0);
      expect(result.retained).toBe(1);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
    
    it('should return correct prune statistics', async () => {
      const docs = [
        createSampleRCA({ id: '1', quality_score: 0.1 }),
        createSampleRCA({ id: '2', quality_score: 0.2 }),
        createSampleRCA({ id: '3', quality_score: 0.5 }),
        createSampleRCA({ id: '4', quality_score: 0.8 })
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      mockDb.delete.mockResolvedValue(undefined);
      
      const result = await manager.pruneLowQuality();
      
      expect(result.totalScanned).toBe(4);
      expect(result.removedLowQuality).toBe(2); // ids 1 and 2
      expect(result.retained).toBe(2);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeCloseTo(NOW, -2);
    });
    
    it('should handle empty database gracefully', async () => {
      mockDb.searchSimilar.mockResolvedValue([]);
      
      const result = await manager.pruneLowQuality();
      
      expect(result.totalScanned).toBe(0);
      expect(result.removedLowQuality).toBe(0);
      expect(result.retained).toBe(0);
    });
  });
  
  describe('pruneExpired()', () => {
    it('should remove documents older than max age', async () => {
      const expiredDoc = createSampleRCA({ 
        id: 'expired',
        created_at: NOW - (SIX_MONTHS + ONE_DAY)
      });
      const recentDoc = createSampleRCA({ 
        id: 'recent',
        created_at: NOW - ONE_DAY
      });
      
      mockDb.searchSimilar.mockResolvedValue([expiredDoc, recentDoc]);
      mockDb.delete.mockResolvedValue(undefined);
      
      const result = await manager.pruneExpired();
      
      expect(result.removedExpired).toBe(1);
      expect(mockDb.delete).toHaveBeenCalledWith('expired');
      expect(mockDb.delete).not.toHaveBeenCalledWith('recent');
    });
    
    it('should remove documents exactly at max age boundary', async () => {
      const atBoundary = createSampleRCA({ 
        id: 'boundary',
        created_at: NOW - SIX_MONTHS - 1 // Just over threshold
      });
      
      mockDb.searchSimilar.mockResolvedValue([atBoundary]);
      mockDb.delete.mockResolvedValue(undefined);
      
      const result = await manager.pruneExpired();
      
      expect(result.removedExpired).toBe(1);
    });
    
    it('should keep documents just under max age', async () => {
      const almostExpired = createSampleRCA({ 
        id: 'almost',
        created_at: NOW - SIX_MONTHS + ONE_DAY // Just under threshold
      });
      
      mockDb.searchSimilar.mockResolvedValue([almostExpired]);
      
      const result = await manager.pruneExpired();
      
      expect(result.removedExpired).toBe(0);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('pruneAll()', () => {
    it('should remove both low-quality and expired documents', async () => {
      const lowQuality = createSampleRCA({ 
        id: 'low', 
        quality_score: 0.2 
      });
      const expired = createSampleRCA({ 
        id: 'old', 
        quality_score: 0.8,
        created_at: NOW - (SIX_MONTHS + ONE_DAY)
      });
      const good = createSampleRCA({ 
        id: 'good', 
        quality_score: 0.8 
      });
      
      mockDb.searchSimilar.mockResolvedValue([lowQuality, expired, good]);
      mockDb.delete.mockResolvedValue(undefined);
      
      const result = await manager.pruneAll();
      
      expect(result.removedLowQuality).toBe(1);
      expect(result.removedExpired).toBe(1);
      expect(result.totalRemoved).toBe(2);
      expect(result.retained).toBe(1);
    });
    
    it('should count documents correctly when same document is both low-quality and expired', async () => {
      const bothBad = createSampleRCA({ 
        id: 'both-bad', 
        quality_score: 0.1,
        created_at: NOW - (SIX_MONTHS + ONE_DAY)
      });
      
      mockDb.searchSimilar.mockResolvedValue([bothBad]);
      mockDb.delete.mockResolvedValue(undefined);
      
      const result = await manager.pruneAll();
      
      // Should be counted as expired (primary reason)
      expect(result.totalRemoved).toBe(1);
    });
  });
  
  describe('getQualityMetrics()', () => {
    it('should return empty metrics for empty database', async () => {
      mockDb.searchSimilar.mockResolvedValue([]);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.totalDocuments).toBe(0);
      expect(metrics.averageQuality).toBe(0);
      expect(metrics.medianQuality).toBe(0);
    });
    
    it('should calculate correct quality counts', async () => {
      const docs = [
        createSampleRCA({ quality_score: 0.9 }), // Excellent
        createSampleRCA({ quality_score: 0.7 }), // Good
        createSampleRCA({ quality_score: 0.5 }), // Fair
        createSampleRCA({ quality_score: 0.2 })  // Poor
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.totalDocuments).toBe(4);
      expect(metrics.highQualityCount).toBe(3); // >= 0.3 threshold
      expect(metrics.lowQualityCount).toBe(1);  // < 0.3 threshold
    });
    
    it('should calculate correct quality distribution', async () => {
      const docs = [
        createSampleRCA({ quality_score: 0.9 }),  // Excellent
        createSampleRCA({ quality_score: 0.85 }), // Excellent
        createSampleRCA({ quality_score: 0.7 }),  // Good
        createSampleRCA({ quality_score: 0.5 }),  // Fair
        createSampleRCA({ quality_score: 0.3 })   // Poor
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.qualityDistribution.excellent).toBe(2);
      expect(metrics.qualityDistribution.good).toBe(1);
      expect(metrics.qualityDistribution.fair).toBe(1);
      expect(metrics.qualityDistribution.poor).toBe(1);
    });
    
    it('should calculate average quality correctly', async () => {
      const docs = [
        createSampleRCA({ quality_score: 0.8 }),
        createSampleRCA({ quality_score: 0.6 }),
        createSampleRCA({ quality_score: 0.4 })
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.averageQuality).toBeCloseTo(0.6, 2);
    });
    
    it('should calculate median quality correctly for odd count', async () => {
      const docs = [
        createSampleRCA({ quality_score: 0.9 }),
        createSampleRCA({ quality_score: 0.5 }),
        createSampleRCA({ quality_score: 0.3 })
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.medianQuality).toBe(0.5);
    });
    
    it('should calculate median quality correctly for even count', async () => {
      const docs = [
        createSampleRCA({ quality_score: 0.9 }),
        createSampleRCA({ quality_score: 0.7 }),
        createSampleRCA({ quality_score: 0.5 }),
        createSampleRCA({ quality_score: 0.3 })
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.medianQuality).toBe(0.6); // (0.5 + 0.7) / 2
    });
    
    it('should count validated documents', async () => {
      const docs = [
        createSampleRCA({ user_validated: true }),
        createSampleRCA({ user_validated: true }),
        createSampleRCA({ user_validated: false })
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.validatedCount).toBe(2);
    });
    
    it('should count old documents', async () => {
      const threeMonthsAgo = NOW - (3 * ONE_MONTH + ONE_DAY);
      const docs = [
        createSampleRCA({ created_at: threeMonthsAgo }), // Old
        createSampleRCA({ created_at: threeMonthsAgo }), // Old
        createSampleRCA({ created_at: NOW - ONE_DAY })   // Recent
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.oldDocumentsCount).toBe(2);
    });
  });
  
  describe('getDocumentsNeedingAttention()', () => {
    it('should return low-quality documents', async () => {
      const lowQuality = createSampleRCA({ 
        id: 'low', 
        quality_score: 0.2 
      });
      const good = createSampleRCA({ 
        id: 'good', 
        quality_score: 0.8 
      });
      
      mockDb.searchSimilar.mockResolvedValue([lowQuality, good]);
      
      const needsAttention = await manager.getDocumentsNeedingAttention();
      
      expect(needsAttention).toHaveLength(1);
      expect(needsAttention[0].id).toBe('low');
    });
    
    it('should return expired documents', async () => {
      const expired = createSampleRCA({ 
        id: 'expired',
        quality_score: 0.8,
        created_at: NOW - (SIX_MONTHS + ONE_DAY)
      });
      
      mockDb.searchSimilar.mockResolvedValue([expired]);
      
      const needsAttention = await manager.getDocumentsNeedingAttention();
      
      expect(needsAttention).toHaveLength(1);
      expect(needsAttention[0].isExpired).toBe(true);
    });
    
    it('should return documents nearing expiration', async () => {
      // 3 months before expiry warning threshold
      const almostExpired = createSampleRCA({ 
        id: 'warning',
        quality_score: 0.8,
        created_at: NOW - (SIX_MONTHS - ONE_MONTH) // 5 months old
      });
      
      mockDb.searchSimilar.mockResolvedValue([almostExpired]);
      
      const needsAttention = await manager.getDocumentsNeedingAttention();
      
      expect(needsAttention).toHaveLength(1);
    });
    
    it('should sort by quality (lowest first)', async () => {
      const docs = [
        createSampleRCA({ id: 'mid', quality_score: 0.25 }),
        createSampleRCA({ id: 'low', quality_score: 0.1 }),
        createSampleRCA({ id: 'high', quality_score: 0.29 })
      ];
      
      mockDb.searchSimilar.mockResolvedValue(docs);
      
      const needsAttention = await manager.getDocumentsNeedingAttention();
      
      expect(needsAttention[0].id).toBe('low');
      expect(needsAttention[1].id).toBe('mid');
      expect(needsAttention[2].id).toBe('high');
    });
  });
  
  describe('recalculateAllQualityScores()', () => {
    it('should update documents with changed quality scores', async () => {
      const doc = createSampleRCA({ 
        id: 'test',
        confidence: 0.8,
        quality_score: 0.5 // Will be recalculated higher
      });
      
      mockDb.searchSimilar.mockResolvedValue([doc]);
      mockDb.update.mockResolvedValue(undefined);
      
      const updated = await manager.recalculateAllQualityScores();
      
      expect(updated).toBe(1);
      expect(mockDb.update).toHaveBeenCalled();
    });
    
    it('should not update documents with unchanged quality scores', async () => {
      const doc = createSampleRCA({ 
        id: 'test',
        confidence: 0.8,
        user_validated: false,
        created_at: NOW, // Just now, no age penalty
        quality_score: 0.8 // Already correct
      });
      
      mockDb.searchSimilar.mockResolvedValue([doc]);
      
      const updated = await manager.recalculateAllQualityScores();
      
      expect(updated).toBe(0);
    });
  });
  
  describe('auto-prune functionality', () => {
    it('should run prune automatically at configured interval', async () => {
      const m = new QualityManager(mockDb, {
        enableAutoPrune: true,
        autoPruneInterval: 1000,
        enableLogging: false
      });
      
      const lowDoc = createSampleRCA({ quality_score: 0.1 });
      mockDb.searchSimilar.mockResolvedValue([lowDoc]);
      mockDb.delete.mockResolvedValue(undefined);
      
      // Fast-forward past interval
      jest.advanceTimersByTime(1500);
      
      // Give async operations time to complete
      await Promise.resolve();
      
      m.dispose();
    });
    
    it('should stop auto-prune when disposed', () => {
      const m = new QualityManager(mockDb, {
        enableAutoPrune: true,
        autoPruneInterval: 1000,
        enableLogging: false
      });
      
      const timersBefore = jest.getTimerCount();
      m.dispose();
      const timersAfter = jest.getTimerCount();
      
      expect(timersAfter).toBeLessThan(timersBefore);
    });
    
    it('should allow manual start/stop of auto-prune', () => {
      manager.startAutoPrune();
      expect(jest.getTimerCount()).toBeGreaterThan(0);
      
      manager.stopAutoPrune();
      // Timer should be cleared
    });
  });
  
  describe('statistics tracking', () => {
    it('should track prune operations', async () => {
      const doc = createSampleRCA({ quality_score: 0.1 });
      mockDb.searchSimilar.mockResolvedValue([doc]);
      mockDb.delete.mockResolvedValue(undefined);
      
      await manager.pruneLowQuality();
      await manager.pruneExpired();
      
      const stats = manager.getPruneStats();
      
      expect(stats.totalOperations).toBe(2);
      expect(stats.totalDocumentsPruned).toBe(1); // Only low quality was pruned
    });
    
    it('should store last prune result', async () => {
      const doc = createSampleRCA({ quality_score: 0.1 });
      mockDb.searchSimilar.mockResolvedValue([doc]);
      mockDb.delete.mockResolvedValue(undefined);
      
      await manager.pruneLowQuality();
      
      const lastResult = manager.getLastPruneResult();
      
      expect(lastResult).not.toBeNull();
      expect(lastResult!.removedLowQuality).toBe(1);
    });
  });
  
  describe('error handling', () => {
    it('should handle database errors gracefully in pruning and return empty result', async () => {
      mockDb.searchSimilar.mockRejectedValue(new Error('DB error'));
      
      // QualityManager catches getAllDocuments errors and returns empty array
      const result = await manager.pruneLowQuality();
      
      expect(result.totalScanned).toBe(0);
      expect(result.removedLowQuality).toBe(0);
    });
    
    it('should handle database errors gracefully in metrics and return empty result', async () => {
      mockDb.searchSimilar.mockRejectedValue(new Error('DB error'));
      
      // QualityManager catches getAllDocuments errors and returns empty metrics
      const metrics = await manager.getQualityMetrics();
      
      expect(metrics.totalDocuments).toBe(0);
      expect(metrics.averageQuality).toBe(0);
    });
  });
});
