/**
 * Quality Manager for RCA Document Maintenance
 * 
 * Manages the lifecycle of RCA documents in the database:
 * - Auto-prunes low-quality documents
 * - Implements expiration policy for old documents
 * - Maintains quality metrics and statistics
 * 
 * @module db/QualityManager
 */

import { ChromaDBClient } from './ChromaDBClient';
import { RCADocument } from './schemas/rca-collection';
import { QualityScorer } from './QualityScorer';

/**
 * Quality manager configuration
 */
export interface QualityManagerConfig {
  /** Minimum quality threshold for retention (default: 0.3) */
  minQualityThreshold?: number;
  
  /** Maximum age before document expires in ms (default: 6 months) */
  maxAgeMs?: number;
  
  /** Whether to enable automatic pruning (default: false) */
  enableAutoPrune?: boolean;
  
  /** Auto-prune interval in ms (default: 24 hours) */
  autoPruneInterval?: number;
  
  /** Whether to log pruning events (default: true) */
  enableLogging?: boolean;
  
  /** Batch size for pruning operations (default: 100) */
  pruneBatchSize?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<QualityManagerConfig> = {
  minQualityThreshold: 0.3,
  maxAgeMs: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
  enableAutoPrune: false,
  autoPruneInterval: 24 * 60 * 60 * 1000, // 24 hours
  enableLogging: true,
  pruneBatchSize: 100
};

/**
 * Result of a prune operation
 */
export interface PruneResult {
  /** Number of documents removed for low quality */
  removedLowQuality: number;
  
  /** Number of documents removed for being expired */
  removedExpired: number;
  
  /** Total documents removed */
  totalRemoved: number;
  
  /** Total documents scanned */
  totalScanned: number;
  
  /** Documents retained */
  retained: number;
  
  /** Operation duration in milliseconds */
  durationMs: number;
  
  /** Timestamp of operation */
  timestamp: number;
}

/**
 * Quality metrics for the document collection
 */
export interface QualityMetrics {
  /** Total documents in collection */
  totalDocuments: number;
  
  /** Documents with quality >= threshold */
  highQualityCount: number;
  
  /** Documents with quality < threshold */
  lowQualityCount: number;
  
  /** User-validated documents */
  validatedCount: number;
  
  /** Documents older than 3 months */
  oldDocumentsCount: number;
  
  /** Average quality score */
  averageQuality: number;
  
  /** Median quality score */
  medianQuality: number;
  
  /** Quality distribution buckets */
  qualityDistribution: {
    excellent: number;  // >= 0.8
    good: number;       // 0.6 - 0.8
    fair: number;       // 0.4 - 0.6
    poor: number;       // < 0.4
  };
}

/**
 * Document evaluation result
 */
export interface DocumentEvaluation {
  /** Document ID */
  id: string;
  
  /** Current quality score */
  quality: number;
  
  /** Document age in milliseconds */
  ageMs: number;
  
  /** Whether document is below quality threshold */
  isBelowThreshold: boolean;
  
  /** Whether document is expired */
  isExpired: boolean;
  
  /** Recommended action */
  recommendation: 'keep' | 'prune' | 'flag';
}

/**
 * Quality Manager for maintaining RCA document health
 * 
 * Handles automatic and manual pruning of low-quality documents,
 * enforces retention policies, and provides quality metrics.
 * 
 * @example
 * ```typescript
 * const manager = new QualityManager(dbClient);
 * 
 * // Get quality metrics
 * const metrics = await manager.getQualityMetrics();
 * console.log(`Average quality: ${metrics.averageQuality}`);
 * 
 * // Prune low-quality documents
 * const result = await manager.pruneAll();
 * console.log(`Removed ${result.totalRemoved} documents`);
 * ```
 */
export class QualityManager {
  private readonly config: Required<QualityManagerConfig>;
  private readonly qualityScorer: QualityScorer;
  private autoPruneTimer: NodeJS.Timeout | null = null;
  
  // Statistics tracking
  private totalPruneOperations: number = 0;
  private totalDocumentsPruned: number = 0;
  private lastPruneResult: PruneResult | null = null;
  
  /**
   * Create a new QualityManager
   * 
   * @param db - ChromaDB client for database operations
   * @param config - Optional configuration
   */
  constructor(
    private readonly db: ChromaDBClient,
    config?: QualityManagerConfig
  ) {
    this.config = {
      minQualityThreshold: config?.minQualityThreshold ?? DEFAULT_CONFIG.minQualityThreshold,
      maxAgeMs: config?.maxAgeMs ?? DEFAULT_CONFIG.maxAgeMs,
      enableAutoPrune: config?.enableAutoPrune ?? DEFAULT_CONFIG.enableAutoPrune,
      autoPruneInterval: config?.autoPruneInterval ?? DEFAULT_CONFIG.autoPruneInterval,
      enableLogging: config?.enableLogging ?? DEFAULT_CONFIG.enableLogging,
      pruneBatchSize: config?.pruneBatchSize ?? DEFAULT_CONFIG.pruneBatchSize
    };
    
    this.qualityScorer = new QualityScorer({
      minQuality: 0.1
    });
    
    // Start auto-prune if enabled
    if (this.config.enableAutoPrune) {
      this.startAutoPrune();
    }
  }
  
  /**
   * Evaluate a single document for quality
   * 
   * @param doc - RCA document to evaluate
   * @returns Evaluation result with recommendations
   */
  evaluateDocument(doc: RCADocument): DocumentEvaluation {
    const ageMs = Date.now() - doc.created_at;
    const quality = doc.quality_score;
    
    const isBelowThreshold = quality < this.config.minQualityThreshold;
    const isExpired = ageMs > this.config.maxAgeMs;
    
    let recommendation: 'keep' | 'prune' | 'flag';
    if (isBelowThreshold || isExpired) {
      // User-validated documents get flagged instead of auto-pruned
      if (doc.user_validated && !isExpired) {
        recommendation = 'flag';
      } else {
        recommendation = 'prune';
      }
    } else {
      recommendation = 'keep';
    }
    
    return {
      id: doc.id,
      quality,
      ageMs,
      isBelowThreshold,
      isExpired,
      recommendation
    };
  }
  
  /**
   * Prune low-quality documents
   * 
   * Removes documents with quality score below threshold.
   * User-validated documents are not pruned unless expired.
   * 
   * @returns Prune result with statistics
   */
  async pruneLowQuality(): Promise<PruneResult> {
    const startTime = Date.now();
    let removedLowQuality = 0;
    let totalScanned = 0;
    
    try {
      // Get all documents by searching with empty query
      // This is a workaround since ChromaDB doesn't have a "list all" method
      const documents = await this.getAllDocuments();
      totalScanned = documents.length;
      
      for (const doc of documents) {
        if (doc.quality_score < this.config.minQualityThreshold) {
          // Don't prune user-validated documents (they're still useful)
          if (!doc.user_validated) {
            await this.db.delete(doc.id);
            removedLowQuality++;
          }
        }
      }
      
      const result: PruneResult = {
        removedLowQuality,
        removedExpired: 0,
        totalRemoved: removedLowQuality,
        totalScanned,
        retained: totalScanned - removedLowQuality,
        durationMs: Date.now() - startTime,
        timestamp: Date.now()
      };
      
      this.recordPruneResult(result);
      this.log(`Pruned ${removedLowQuality} low-quality documents (${result.durationMs}ms)`);
      
      return result;
    } catch (error) {
      this.log(`Error pruning low-quality documents: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Prune expired documents
   * 
   * Removes documents older than the maximum age.
   * 
   * @returns Prune result with statistics
   */
  async pruneExpired(): Promise<PruneResult> {
    const startTime = Date.now();
    let removedExpired = 0;
    let totalScanned = 0;
    
    try {
      const documents = await this.getAllDocuments();
      totalScanned = documents.length;
      const now = Date.now();
      
      for (const doc of documents) {
        const ageMs = now - doc.created_at;
        if (ageMs > this.config.maxAgeMs) {
          await this.db.delete(doc.id);
          removedExpired++;
        }
      }
      
      const result: PruneResult = {
        removedLowQuality: 0,
        removedExpired,
        totalRemoved: removedExpired,
        totalScanned,
        retained: totalScanned - removedExpired,
        durationMs: Date.now() - startTime,
        timestamp: Date.now()
      };
      
      this.recordPruneResult(result);
      this.log(`Pruned ${removedExpired} expired documents (${result.durationMs}ms)`);
      
      return result;
    } catch (error) {
      this.log(`Error pruning expired documents: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Prune all documents that meet removal criteria
   * 
   * Combines low-quality and expired pruning in one operation.
   * 
   * @returns Prune result with statistics
   */
  async pruneAll(): Promise<PruneResult> {
    const startTime = Date.now();
    let removedLowQuality = 0;
    let removedExpired = 0;
    let totalScanned = 0;
    
    try {
      const documents = await this.getAllDocuments();
      totalScanned = documents.length;
      
      for (const doc of documents) {
        const evaluation = this.evaluateDocument(doc);
        
        if (evaluation.recommendation === 'prune') {
          await this.db.delete(doc.id);
          
          if (evaluation.isExpired) {
            removedExpired++;
          } else if (evaluation.isBelowThreshold) {
            removedLowQuality++;
          }
        }
      }
      
      const totalRemoved = removedLowQuality + removedExpired;
      
      const result: PruneResult = {
        removedLowQuality,
        removedExpired,
        totalRemoved,
        totalScanned,
        retained: totalScanned - totalRemoved,
        durationMs: Date.now() - startTime,
        timestamp: Date.now()
      };
      
      this.recordPruneResult(result);
      this.log(`Pruned ${totalRemoved} documents (${removedLowQuality} low-quality, ${removedExpired} expired) in ${result.durationMs}ms`);
      
      return result;
    } catch (error) {
      this.log(`Error in pruneAll: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Get quality metrics for the entire collection
   * 
   * @returns Quality metrics
   */
  async getQualityMetrics(): Promise<QualityMetrics> {
    try {
      const documents = await this.getAllDocuments();
      
      if (documents.length === 0) {
        return this.createEmptyMetrics();
      }
      
      const qualities = documents.map(d => d.quality_score);
      const threeMonthsAgo = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000);
      
      const highQualityCount = documents.filter(
        d => d.quality_score >= this.config.minQualityThreshold
      ).length;
      
      const lowQualityCount = documents.length - highQualityCount;
      const validatedCount = documents.filter(d => d.user_validated).length;
      const oldDocumentsCount = documents.filter(d => d.created_at < threeMonthsAgo).length;
      
      // Calculate quality distribution
      const distribution = {
        excellent: documents.filter(d => d.quality_score >= 0.8).length,
        good: documents.filter(d => d.quality_score >= 0.6 && d.quality_score < 0.8).length,
        fair: documents.filter(d => d.quality_score >= 0.4 && d.quality_score < 0.6).length,
        poor: documents.filter(d => d.quality_score < 0.4).length
      };
      
      return {
        totalDocuments: documents.length,
        highQualityCount,
        lowQualityCount,
        validatedCount,
        oldDocumentsCount,
        averageQuality: this.calculateAverage(qualities),
        medianQuality: this.calculateMedian(qualities),
        qualityDistribution: distribution
      };
    } catch (error) {
      this.log(`Error getting quality metrics: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Get documents needing attention (low quality or near expiration)
   * 
   * @returns Array of document evaluations needing attention
   */
  async getDocumentsNeedingAttention(): Promise<DocumentEvaluation[]> {
    const documents = await this.getAllDocuments();
    const evaluations: DocumentEvaluation[] = [];
    
    const threeMonthsMs = 3 * 30 * 24 * 60 * 60 * 1000;
    const warningAge = this.config.maxAgeMs - threeMonthsMs; // 3 months before expiry
    
    for (const doc of documents) {
      const evaluation = this.evaluateDocument(doc);
      
      // Flag documents that need attention
      if (evaluation.isBelowThreshold || 
          evaluation.isExpired || 
          evaluation.ageMs > warningAge) {
        evaluations.push(evaluation);
      }
    }
    
    // Sort by quality (lowest first)
    evaluations.sort((a, b) => a.quality - b.quality);
    
    return evaluations;
  }
  
  /**
   * Recalculate quality scores for all documents
   * 
   * Useful after changing quality scoring parameters.
   * 
   * @returns Number of documents updated
   */
  async recalculateAllQualityScores(): Promise<number> {
    const documents = await this.getAllDocuments();
    let updated = 0;
    
    for (const doc of documents) {
      const newQuality = this.qualityScorer.calculateQuality({
        baseConfidence: doc.confidence,
        userValidated: doc.user_validated,
        ageMs: Date.now() - doc.created_at
      });
      
      // Only update if quality changed significantly
      if (Math.abs(newQuality - doc.quality_score) > 0.01) {
        await this.db.update(doc.id, { quality_score: newQuality });
        updated++;
      }
    }
    
    this.log(`Recalculated quality scores for ${updated} documents`);
    return updated;
  }
  
  /**
   * Get last prune result
   * 
   * @returns Last prune result or null
   */
  getLastPruneResult(): PruneResult | null {
    return this.lastPruneResult;
  }
  
  /**
   * Get pruning statistics
   */
  getPruneStats(): { totalOperations: number; totalDocumentsPruned: number } {
    return {
      totalOperations: this.totalPruneOperations,
      totalDocumentsPruned: this.totalDocumentsPruned
    };
  }
  
  /**
   * Start automatic pruning
   */
  startAutoPrune(): void {
    if (this.autoPruneTimer) {
      return;
    }
    
    this.autoPruneTimer = setInterval(async () => {
      try {
        await this.pruneAll();
      } catch (error) {
        this.log(`Auto-prune failed: ${(error as Error).message}`);
      }
    }, this.config.autoPruneInterval);
    
    // Prevent timer from keeping process alive
    if (this.autoPruneTimer.unref) {
      this.autoPruneTimer.unref();
    }
    
    this.log('Auto-prune started');
  }
  
  /**
   * Stop automatic pruning
   */
  stopAutoPrune(): void {
    if (this.autoPruneTimer) {
      clearInterval(this.autoPruneTimer);
      this.autoPruneTimer = null;
      this.log('Auto-prune stopped');
    }
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAutoPrune();
  }
  
  /**
   * Get configuration
   */
  getConfig(): Required<QualityManagerConfig> {
    return { ...this.config };
  }
  
  /**
   * Get all documents from the database
   * 
   * @private
   */
  private async getAllDocuments(): Promise<RCADocument[]> {
    // Use a very generic search to get all documents
    // ChromaDB doesn't have a "list all" method, so we use a workaround
    try {
      // Search with a generic term that should match everything
      const results = await this.db.searchSimilar('error', 1000, 0);
      return results;
    } catch (error) {
      // If search fails, return empty array
      this.log(`Failed to get all documents: ${(error as Error).message}`);
      return [];
    }
  }
  
  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): QualityMetrics {
    return {
      totalDocuments: 0,
      highQualityCount: 0,
      lowQualityCount: 0,
      validatedCount: 0,
      oldDocumentsCount: 0,
      averageQuality: 0,
      medianQuality: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      }
    };
  }
  
  /**
   * Record prune result for statistics
   */
  private recordPruneResult(result: PruneResult): void {
    this.totalPruneOperations++;
    this.totalDocumentsPruned += result.totalRemoved;
    this.lastPruneResult = result;
  }
  
  /**
   * Calculate average of number array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  /**
   * Calculate median of number array
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }
  
  /**
   * Log message if logging enabled
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[QualityManager] ${message}`);
    }
  }
}
