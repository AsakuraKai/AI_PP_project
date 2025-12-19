/**
 * Unit tests for RCACache
 * 
 * Tests caching operations, TTL management, statistics tracking,
 * and cleanup functionality.
 */

import { RCACache } from '../../src/cache/RCACache';
import { RCADocument } from '../../src/db/schemas/rca-collection';
import { ParsedError } from '../../src/types';

describe('RCACache', () => {
  let cache: RCACache;
  
  // Sample RCA document for testing
  const sampleRCA: RCADocument = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    error_message: 'lateinit property user has not been initialized',
    error_type: 'lateinit',
    language: 'kotlin',
    root_cause: 'Property accessed before initialization',
    fix_guidelines: ['Initialize in onCreate()', 'Use lazy initialization'],
    confidence: 0.9,
    created_at: Date.now(),
    user_validated: false,
    quality_score: 0.85
  };
  
  // Sample parsed error for testing
  const sampleError: ParsedError = {
    type: 'lateinit',
    message: 'lateinit property user has not been initialized',
    filePath: 'MainActivity.kt',
    line: 45,
    language: 'kotlin'
  };
  
  beforeEach(() => {
    // Create cache with auto-cleanup disabled for predictable tests
    cache = new RCACache({ enableAutoCleanup: false });
  });
  
  afterEach(() => {
    cache.dispose();
  });
  
  describe('constructor', () => {
    it('should create cache with default configuration', () => {
      const c = new RCACache({ enableAutoCleanup: false });
      expect(c.getTTL()).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(c.size).toBe(0);
      c.dispose();
    });
    
    it('should accept custom TTL', () => {
      const c = new RCACache({ ttl: 1000, enableAutoCleanup: false });
      expect(c.getTTL()).toBe(1000);
      c.dispose();
    });
    
    it('should start auto-cleanup when enabled', () => {
      jest.useFakeTimers();
      const c = new RCACache({ enableAutoCleanup: true, cleanupInterval: 1000 });
      c.set('hash1', sampleRCA, 500); // Expires in 500ms
      
      // Fast-forward past expiration and cleanup interval
      jest.advanceTimersByTime(1500);
      
      // Entry should be cleaned up
      expect(c.has('hash1')).toBe(false);
      
      c.dispose();
      jest.useRealTimers();
    });
  });
  
  describe('set() and get()', () => {
    it('should store and retrieve RCA document', () => {
      cache.set('hash1', sampleRCA);
      const result = cache.get('hash1');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sampleRCA.id);
      expect(result?.root_cause).toBe(sampleRCA.root_cause);
    });
    
    it('should return null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });
    
    it('should overwrite existing entry', () => {
      cache.set('hash1', sampleRCA);
      const newRCA = { ...sampleRCA, root_cause: 'New root cause' };
      cache.set('hash1', newRCA);
      
      const result = cache.get('hash1');
      expect(result?.root_cause).toBe('New root cause');
    });
    
    it('should update hit count on access', () => {
      cache.set('hash1', sampleRCA);
      
      cache.get('hash1');
      cache.get('hash1');
      cache.get('hash1');
      
      const stats = cache.getStats();
      expect(stats.totalHits).toBe(3);
    });
    
    it('should accept custom TTL for entry', () => {
      cache.set('hash1', sampleRCA, 100); // 100ms TTL
      
      // Entry should exist initially
      expect(cache.get('hash1')).not.toBeNull();
    });
    
    it('should evict oldest entry when max capacity reached', () => {
      const smallCache = new RCACache({ maxEntries: 3, enableAutoCleanup: false });
      
      smallCache.set('hash1', { ...sampleRCA, id: '1' });
      smallCache.set('hash2', { ...sampleRCA, id: '2' });
      smallCache.set('hash3', { ...sampleRCA, id: '3' });
      
      // Access hash2 and hash3 to make hash1 the least recently used
      smallCache.get('hash2');
      smallCache.get('hash3');
      
      // Add new entry, should evict hash1
      smallCache.set('hash4', { ...sampleRCA, id: '4' });
      
      expect(smallCache.size).toBe(3);
      expect(smallCache.get('hash1')).toBeNull(); // Evicted (LRU)
      expect(smallCache.get('hash4')).not.toBeNull(); // New entry
      
      smallCache.dispose();
    });
  });
  
  describe('TTL expiration', () => {
    it('should return null for expired entry', async () => {
      cache.set('hash1', sampleRCA, 50); // 50ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('hash1')).toBeNull();
    });
    
    it('should remove expired entry on access', async () => {
      cache.set('hash1', sampleRCA, 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      cache.get('hash1'); // This should remove the expired entry
      
      expect(cache.size).toBe(0);
    });
    
    it('should increment expiredRemoved stat', async () => {
      cache.set('hash1', sampleRCA, 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      cache.get('hash1');
      
      const stats = cache.getStats();
      expect(stats.expiredRemoved).toBe(1);
    });
    
    it('should not expire entry before TTL', async () => {
      cache.set('hash1', sampleRCA, 500); // 500ms TTL
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.get('hash1')).not.toBeNull();
    });
  });
  
  describe('setForError() and getForError()', () => {
    it('should store and retrieve using parsed error', () => {
      const hash = cache.setForError(sampleError, sampleRCA);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
      
      const result = cache.getForError(sampleError);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sampleRCA.id);
    });
    
    it('should return null for different error', () => {
      cache.setForError(sampleError, sampleRCA);
      
      const differentError = { ...sampleError, line: 100 };
      expect(cache.getForError(differentError)).toBeNull();
    });
    
    it('should handle similar errors (with number normalization)', () => {
      // Two errors that differ only in line numbers in the message
      const error1 = { ...sampleError, message: 'Error at line 45' };
      const error2 = { ...sampleError, message: 'Error at line 99' };
      
      cache.setForError(error1, sampleRCA);
      
      // Both should hash to the same value (numbers normalized to N)
      const result = cache.getForError(error2);
      expect(result).not.toBeNull();
    });
  });
  
  describe('has() and hasForError()', () => {
    it('should return true for existing entry', () => {
      cache.set('hash1', sampleRCA);
      expect(cache.has('hash1')).toBe(true);
    });
    
    it('should return false for non-existent entry', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });
    
    it('should return false for expired entry', async () => {
      cache.set('hash1', sampleRCA, 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(cache.has('hash1')).toBe(false);
    });
    
    it('should work with parsed errors', () => {
      cache.setForError(sampleError, sampleRCA);
      expect(cache.hasForError(sampleError)).toBe(true);
      
      const differentError = { ...sampleError, line: 100 };
      expect(cache.hasForError(differentError)).toBe(false);
    });
  });
  
  describe('invalidate() and invalidateForError()', () => {
    it('should remove entry by hash', () => {
      cache.set('hash1', sampleRCA);
      expect(cache.has('hash1')).toBe(true);
      
      const removed = cache.invalidate('hash1');
      
      expect(removed).toBe(true);
      expect(cache.has('hash1')).toBe(false);
    });
    
    it('should return false for non-existent entry', () => {
      expect(cache.invalidate('nonexistent')).toBe(false);
    });
    
    it('should increment invalidated stat', () => {
      cache.set('hash1', sampleRCA);
      cache.invalidate('hash1');
      
      const stats = cache.getStats();
      expect(stats.invalidated).toBe(1);
    });
    
    it('should work with parsed errors', () => {
      cache.setForError(sampleError, sampleRCA);
      
      const removed = cache.invalidateForError(sampleError);
      
      expect(removed).toBe(true);
      expect(cache.hasForError(sampleError)).toBe(false);
    });
  });
  
  describe('clear()', () => {
    it('should remove all entries', () => {
      cache.set('hash1', sampleRCA);
      cache.set('hash2', { ...sampleRCA, id: '2' });
      cache.set('hash3', { ...sampleRCA, id: '3' });
      
      expect(cache.size).toBe(3);
      
      cache.clear();
      
      expect(cache.size).toBe(0);
    });
  });
  
  describe('getStats()', () => {
    it('should return correct initial stats', () => {
      const stats = cache.getStats();
      
      expect(stats.size).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.expiredRemoved).toBe(0);
      expect(stats.invalidated).toBe(0);
    });
    
    it('should track cache hits', () => {
      cache.set('hash1', sampleRCA);
      cache.get('hash1');
      cache.get('hash1');
      
      const stats = cache.getStats();
      expect(stats.totalHits).toBe(2);
    });
    
    it('should track cache misses', () => {
      cache.get('nonexistent1');
      cache.get('nonexistent2');
      
      const stats = cache.getStats();
      expect(stats.totalMisses).toBe(2);
    });
    
    it('should calculate hit rate correctly', () => {
      cache.set('hash1', sampleRCA);
      cache.get('hash1'); // Hit
      cache.get('hash1'); // Hit
      cache.get('nonexistent'); // Miss
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.667, 2); // 2/3
    });
    
    it('should track size correctly', () => {
      cache.set('hash1', sampleRCA);
      cache.set('hash2', { ...sampleRCA, id: '2' });
      
      expect(cache.getStats().size).toBe(2);
    });
    
    it('should estimate memory usage', () => {
      cache.set('hash1', sampleRCA);
      cache.set('hash2', { ...sampleRCA, id: '2' });
      
      const stats = cache.getStats();
      expect(stats.estimatedMemoryBytes).toBeGreaterThan(0);
    });
  });
  
  describe('resetStats()', () => {
    it('should reset all statistics', () => {
      cache.set('hash1', sampleRCA);
      cache.get('hash1');
      cache.get('nonexistent');
      cache.invalidate('hash1');
      
      cache.resetStats();
      
      const stats = cache.getStats();
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.expiredRemoved).toBe(0);
      expect(stats.invalidated).toBe(0);
    });
    
    it('should not affect cached entries', () => {
      cache.set('hash1', sampleRCA);
      cache.resetStats();
      
      expect(cache.size).toBe(1);
      expect(cache.get('hash1')).not.toBeNull();
    });
  });
  
  describe('getHash()', () => {
    it('should return hash without storing', () => {
      const hash = cache.getHash(sampleError);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(cache.has(hash)).toBe(false);
    });
    
    it('should return consistent hash', () => {
      const hash1 = cache.getHash(sampleError);
      const hash2 = cache.getHash(sampleError);
      
      expect(hash1).toBe(hash2);
    });
  });
  
  describe('getEntries()', () => {
    it('should return all entries', () => {
      cache.set('hash1', sampleRCA);
      cache.set('hash2', { ...sampleRCA, id: '2' });
      
      const entries = cache.getEntries();
      
      expect(entries.length).toBe(2);
      expect(entries.map(e => e[0])).toContain('hash1');
      expect(entries.map(e => e[0])).toContain('hash2');
    });
    
    it('should return empty array for empty cache', () => {
      expect(cache.getEntries().length).toBe(0);
    });
  });
  
  describe('cleanup()', () => {
    it('should remove expired entries', async () => {
      cache.set('hash1', sampleRCA, 50);
      cache.set('hash2', { ...sampleRCA, id: '2' }, 50);
      cache.set('hash3', { ...sampleRCA, id: '3' }, 10000); // Won't expire
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const removed = cache.cleanup();
      
      expect(removed).toBe(2);
      expect(cache.size).toBe(1);
      expect(cache.has('hash3')).toBe(true);
    });
    
    it('should return 0 when no entries expired', () => {
      cache.set('hash1', sampleRCA, 10000);
      
      const removed = cache.cleanup();
      
      expect(removed).toBe(0);
    });
    
    it('should update expiredRemoved stat', async () => {
      cache.set('hash1', sampleRCA, 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      cache.cleanup();
      
      const stats = cache.getStats();
      expect(stats.expiredRemoved).toBe(1);
    });
  });
  
  describe('dispose()', () => {
    it('should clear cache and stop cleanup timer', () => {
      cache.set('hash1', sampleRCA);
      cache.dispose();
      
      expect(cache.size).toBe(0);
    });
    
    it('should be safe to call multiple times', () => {
      expect(() => {
        cache.dispose();
        cache.dispose();
      }).not.toThrow();
    });
  });
  
  describe('edge cases', () => {
    it('should handle very long hash keys', () => {
      const longHash = 'a'.repeat(1000);
      cache.set(longHash, sampleRCA);
      
      expect(cache.get(longHash)).not.toBeNull();
    });
    
    it('should handle special characters in messages', () => {
      const specialError: ParsedError = {
        ...sampleError,
        message: 'Error with "quotes" and \'apostrophes\' and <tags>'
      };
      
      cache.setForError(specialError, sampleRCA);
      expect(cache.getForError(specialError)).not.toBeNull();
    });
    
    it('should handle unicode in messages', () => {
      const unicodeError: ParsedError = {
        ...sampleError,
        message: 'Error with unicode: 你好世界 🎉 émojis'
      };
      
      cache.setForError(unicodeError, sampleRCA);
      expect(cache.getForError(unicodeError)).not.toBeNull();
    });
    
    it('should handle empty message', () => {
      const emptyMsgError: ParsedError = {
        ...sampleError,
        message: ''
      };
      
      cache.setForError(emptyMsgError, sampleRCA);
      expect(cache.getForError(emptyMsgError)).not.toBeNull();
    });
    
    it('should handle concurrent access patterns', async () => {
      // Simulate concurrent reads and writes
      const operations = [];
      
      for (let i = 0; i < 100; i++) {
        operations.push(
          Promise.resolve().then(() => {
            cache.set(`hash${i % 10}`, { ...sampleRCA, id: String(i) });
            return cache.get(`hash${i % 10}`);
          })
        );
      }
      
      await Promise.all(operations);
      
      expect(cache.size).toBeLessThanOrEqual(10);
    });
  });
});
