/**
 * RCA Cache for Fast Repeat Error Lookups
 * 
 * In-memory cache with TTL management for storing previously analyzed
 * Root Cause Analysis results. Enables fast lookups for repeat errors
 * without requiring full LLM analysis.
 * 
 * @module cache/RCACache
 */

import { RCADocument } from '../db/schemas/rca-collection';
import { ParsedError } from '../types';
import { ErrorHasher, ErrorHasherConfig } from './ErrorHasher';

/**
 * Cache entry stored in RCACache
 */
export interface CacheEntry {
  /** Cached RCA document */
  rca: RCADocument;
  
  /** Expiration timestamp (milliseconds since epoch) */
  expires: number;
  
  /** Number of times this entry has been accessed */
  hits: number;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Last access timestamp */
  lastAccessed: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  /** Current number of entries in cache */
  size: number;
  
  /** Total cache hits since creation */
  totalHits: number;
  
  /** Total cache misses since creation */
  totalMisses: number;
  
  /** Cache hit rate (0.0-1.0) */
  hitRate: number;
  
  /** Number of expired entries removed */
  expiredRemoved: number;
  
  /** Number of entries invalidated */
  invalidated: number;
  
  /** Memory usage estimate in bytes */
  estimatedMemoryBytes: number;
}

/**
 * Configuration options for RCACache
 */
export interface RCACacheConfig {
  /** Time-to-live in milliseconds (default: 24 hours) */
  ttl?: number;
  
  /** Maximum number of entries (default: 1000) */
  maxEntries?: number;
  
  /** Cleanup interval in milliseconds (default: 5 minutes) */
  cleanupInterval?: number;
  
  /** Enable automatic cleanup (default: true) */
  enableAutoCleanup?: boolean;
  
  /** ErrorHasher configuration */
  hasherConfig?: ErrorHasherConfig;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<Omit<RCACacheConfig, 'hasherConfig'>> = {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 1000,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  enableAutoCleanup: true
};

/**
 * RCA Cache for fast repeat error lookups
 * 
 * Provides an in-memory cache layer for RCA results to avoid
 * redundant LLM analyses for identical or similar errors.
 * 
 * Features:
 * - TTL-based expiration (default: 24 hours)
 * - Automatic cleanup of expired entries
 * - LRU-like eviction when max entries reached
 * - Cache hit/miss statistics
 * - Manual invalidation support
 * - Thread-safe operations
 * 
 * @example
 * ```typescript
 * const cache = new RCACache();
 * 
 * // Store result
 * cache.set(errorHash, rcaDocument);
 * 
 * // Retrieve result
 * const cached = cache.get(errorHash);
 * if (cached) {
 *   console.log('Cache hit:', cached.root_cause);
 * }
 * 
 * // Check stats
 * console.log('Hit rate:', cache.getStats().hitRate);
 * ```
 */
export class RCACache {
  private readonly cache: Map<string, CacheEntry>;
  private readonly config: Required<Omit<RCACacheConfig, 'hasherConfig'>>;
  private readonly hasher: ErrorHasher;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // Statistics tracking
  private totalHits: number = 0;
  private totalMisses: number = 0;
  private expiredRemoved: number = 0;
  private invalidatedCount: number = 0;
  
  /**
   * Create a new RCACache instance
   * 
   * @param config - Cache configuration options
   */
  constructor(config: RCACacheConfig = {}) {
    this.cache = new Map();
    this.config = {
      ttl: config.ttl ?? DEFAULT_CONFIG.ttl,
      maxEntries: config.maxEntries ?? DEFAULT_CONFIG.maxEntries,
      cleanupInterval: config.cleanupInterval ?? DEFAULT_CONFIG.cleanupInterval,
      enableAutoCleanup: config.enableAutoCleanup ?? DEFAULT_CONFIG.enableAutoCleanup
    };
    this.hasher = new ErrorHasher(config.hasherConfig);
    
    // Start automatic cleanup if enabled
    if (this.config.enableAutoCleanup) {
      this.startCleanup();
    }
  }
  
  /**
   * Get cached RCA document by hash
   * 
   * Returns null if entry doesn't exist or has expired.
   * Updates hit count and last accessed time on successful retrieval.
   * 
   * @param hash - Error hash key
   * @returns Cached RCA document or null
   */
  get(hash: string): RCADocument | null {
    const entry = this.cache.get(hash);
    
    if (!entry) {
      this.totalMisses++;
      return null;
    }
    
    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(hash);
      this.expiredRemoved++;
      this.totalMisses++;
      return null;
    }
    
    // Update access statistics
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.totalHits++;
    
    return entry.rca;
  }
  
  /**
   * Get cached RCA document for a parsed error
   * 
   * Automatically hashes the error and looks up in cache.
   * 
   * @param error - Parsed error to look up
   * @returns Cached RCA document or null
   */
  getForError(error: ParsedError): RCADocument | null {
    const hash = this.hasher.hash(error);
    return this.get(hash);
  }
  
  /**
   * Store RCA document in cache
   * 
   * Evicts oldest entries if max capacity reached.
   * 
   * @param hash - Error hash key
   * @param rca - RCA document to cache
   * @param customTtl - Optional custom TTL for this entry
   */
  set(hash: string, rca: RCADocument, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl ?? this.config.ttl;
    
    // Evict if at capacity
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }
    
    const entry: CacheEntry = {
      rca,
      expires: now + ttl,
      hits: 0,
      createdAt: now,
      lastAccessed: now
    };
    
    this.cache.set(hash, entry);
  }
  
  /**
   * Store RCA document for a parsed error
   * 
   * Automatically hashes the error and stores in cache.
   * 
   * @param error - Parsed error (used as key)
   * @param rca - RCA document to cache
   * @param customTtl - Optional custom TTL for this entry
   * @returns The hash key used for storage
   */
  setForError(error: ParsedError, rca: RCADocument, customTtl?: number): string {
    const hash = this.hasher.hash(error);
    this.set(hash, rca, customTtl);
    return hash;
  }
  
  /**
   * Check if cache contains a valid entry for hash
   * 
   * @param hash - Error hash to check
   * @returns True if entry exists and is not expired
   */
  has(hash: string): boolean {
    const entry = this.cache.get(hash);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(hash);
      this.expiredRemoved++;
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if cache contains a valid entry for an error
   * 
   * @param error - Parsed error to check
   * @returns True if entry exists and is not expired
   */
  hasForError(error: ParsedError): boolean {
    const hash = this.hasher.hash(error);
    return this.has(hash);
  }
  
  /**
   * Invalidate (remove) a cached entry
   * 
   * Used when negative feedback indicates cached result was wrong.
   * 
   * @param hash - Error hash to invalidate
   * @returns True if entry was found and removed
   */
  invalidate(hash: string): boolean {
    const deleted = this.cache.delete(hash);
    if (deleted) {
      this.invalidatedCount++;
    }
    return deleted;
  }
  
  /**
   * Invalidate cached entry for an error
   * 
   * @param error - Parsed error to invalidate
   * @returns True if entry was found and removed
   */
  invalidateForError(error: ParsedError): boolean {
    const hash = this.hasher.hash(error);
    return this.invalidate(hash);
  }
  
  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Current cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.totalHits + this.totalMisses;
    
    return {
      size: this.cache.size,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRate: totalRequests > 0 ? this.totalHits / totalRequests : 0,
      expiredRemoved: this.expiredRemoved,
      invalidated: this.invalidatedCount,
      estimatedMemoryBytes: this.estimateMemoryUsage()
    };
  }
  
  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.totalHits = 0;
    this.totalMisses = 0;
    this.expiredRemoved = 0;
    this.invalidatedCount = 0;
  }
  
  /**
   * Get the hash for an error without storing it
   * 
   * @param error - Parsed error to hash
   * @returns The hash that would be used as cache key
   */
  getHash(error: ParsedError): string {
    return this.hasher.hash(error);
  }
  
  /**
   * Get all cache entries (for debugging/export)
   * 
   * @returns Array of [hash, entry] pairs
   */
  getEntries(): Array<[string, CacheEntry]> {
    return Array.from(this.cache.entries());
  }
  
  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Get TTL configuration
   */
  getTTL(): number {
    return this.config.ttl;
  }
  
  /**
   * Stop automatic cleanup timer
   * 
   * Should be called when cache is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    this.stopCleanup();
    this.clear();
  }
  
  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expires;
  }
  
  /**
   * Evict oldest entry (by last accessed time)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Remove all expired entries
   * 
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    this.expiredRemoved += removed;
    return removed;
  }
  
  /**
   * Start automatic cleanup timer
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      return;
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
    
    // Prevent timer from keeping process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }
  
  /**
   * Stop automatic cleanup timer
   */
  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  /**
   * Estimate memory usage of cache
   * 
   * Rough estimate based on average entry size.
   */
  private estimateMemoryUsage(): number {
    // Rough estimate: 2KB per entry (JSON + overhead)
    const avgEntrySize = 2048;
    return this.cache.size * avgEntrySize;
  }
}
