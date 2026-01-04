/**
 * Adaptive Learning System for Continuous Improvement
 * 
 * Analyzes user feedback patterns to automatically adapt RCA quality
 * and improve error diagnosis over time.
 * 
 * @module agent/AdaptiveLearning
 */

import { ChromaDBClient } from '../db/ChromaDBClient';
import { RCADocument } from '../db/schemas/rca-collection';
import { FeedbackHandler } from './FeedbackHandler';

/**
 * Learning pattern identified from feedback
 */
export interface LearningPattern {
  /** Error type that shows consistent feedback patterns */
  errorType: string;
  
  /** Total feedback samples for this pattern */
  sampleCount: number;
  
  /** Success rate (positive feedback / total) */
  successRate: number;
  
  /** Average confidence of successful RCAs */
  avgSuccessConfidence: number;
  
  /** Average confidence of failed RCAs */
  avgFailureConfidence: number;
  
  /** Recommended confidence threshold */
  recommendedThreshold: number;
  
  /** Common root causes for this error type */
  commonRootCauses: string[];
  
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Adaptation strategy for improving RCA quality
 */
export interface AdaptationStrategy {
  /** Strategy type */
  type: 'confidence_adjustment' | 'pattern_reinforcement' | 'example_curation';
  
  /** Target error types */
  errorTypes: string[];
  
  /** Strategy description */
  description: string;
  
  /** Expected impact (0-1) */
  expectedImpact: number;
  
  /** Priority (1-5, 5 is highest) */
  priority: number;
}

/**
 * Learning metrics over time
 */
export interface LearningMetrics {
  /** Total feedback processed */
  totalFeedback: number;
  
  /** Overall success rate trend (last 30 days) */
  successRateTrend: number[];
  
  /** Top improving error types */
  topImprovements: Array<{
    errorType: string;
    beforeRate: number;
    afterRate: number;
    improvement: number;
  }>;
  
  /** Error types needing attention */
  needsAttention: string[];
  
  /** Last metrics calculation */
  calculatedAt: number;
}

/**
 * Configuration for adaptive learning
 */
export interface AdaptiveLearningConfig {
  /** Minimum samples before identifying pattern (default: 5) */
  minPatternSamples?: number;
  
  /** Success rate threshold for "good" pattern (default: 0.7) */
  successThreshold?: number;
  
  /** Enable automatic confidence adjustments (default: false) */
  enableAutoAdjustments?: boolean;
  
  /** Learning rate for confidence updates (default: 0.1) */
  learningRate?: number;
  
  /** Enable logging (default: true) */
  enableLogging?: boolean;
}

const DEFAULT_CONFIG: Required<AdaptiveLearningConfig> = {
  minPatternSamples: 5,
  successThreshold: 0.7,
  enableAutoAdjustments: false,
  learningRate: 0.1,
  enableLogging: true
};

/**
 * Adaptive Learning System
 * 
 * Continuously learns from user feedback to improve RCA quality:
 * - Identifies error type patterns
 * - Adapts confidence thresholds
 * - Curates high-quality examples
 * - Generates improvement strategies
 * 
 * @example
 * ```typescript
 * const learning = new AdaptiveLearning(dbClient, feedbackHandler);
 * 
 * // Analyze patterns after feedback
 * await learning.analyzeFeedbackPatterns();
 * 
 * // Get improvement strategies
 * const strategies = await learning.generateAdaptationStrategies();
 * console.log(`Found ${strategies.length} improvement opportunities`);
 * 
 * // Apply learning (if auto-adjustments enabled)
 * await learning.applyLearning();
 * ```
 */
export class AdaptiveLearning {
  private readonly config: Required<AdaptiveLearningConfig>;
  private patterns: Map<string, LearningPattern> = new Map();
  private metrics: LearningMetrics | null = null;
  
  constructor(
    private readonly db: ChromaDBClient,
    private readonly feedbackHandler: FeedbackHandler,
    config?: AdaptiveLearningConfig
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }
  
  /**
   * Analyze feedback patterns across all RCA documents
   * 
   * Groups documents by error type and calculates success metrics
   * to identify patterns that can inform future improvements.
   * 
   * @returns Map of error type to learning pattern
   */
  async analyzeFeedbackPatterns(): Promise<Map<string, LearningPattern>> {
    if (this.config.enableLogging) {
      console.log('[AdaptiveLearning] Starting feedback pattern analysis...');
    }
    
    // Get all RCA documents using collection query
    // Note: ChromaDB doesn't have getAll(), so we fetch with high limit
    const allDocs = await this.db.searchSimilar('', 1000, 0.0);
    
    // Group by error type
    const errorTypeGroups = new Map<string, RCADocument[]>();
    for (const doc of allDocs) {
      const errorType = doc.metadata?.error_type || 'unknown';
      const existing = errorTypeGroups.get(errorType) || [];
      existing.push(doc);
      errorTypeGroups.set(errorType, existing);
    }
    
    // Analyze each error type
    this.patterns.clear();
    for (const [errorType, docs] of errorTypeGroups.entries()) {
      if (docs.length < this.config.minPatternSamples) {
        continue; // Not enough samples
      }
      
      const pattern = this.analyzeErrorTypePattern(errorType, docs);
      this.patterns.set(errorType, pattern);
    }
    
    if (this.config.enableLogging) {
      console.log(`[AdaptiveLearning] Identified ${this.patterns.size} patterns from ${allDocs.length} documents`);
    }
    
    return this.patterns;
  }
  
  /**
   * Analyze pattern for a specific error type
   */
  private analyzeErrorTypePattern(errorType: string, docs: RCADocument[]): LearningPattern {
    const validatedDocs = docs.filter(d => d.user_validated !== undefined);
    const positiveDocs = validatedDocs.filter(d => d.user_validated === true);
    const negativeDocs = validatedDocs.filter(d => d.user_validated === false);
    
    const successRate = validatedDocs.length > 0
      ? positiveDocs.length / validatedDocs.length
      : 0;
    
    const avgSuccessConfidence = positiveDocs.length > 0
      ? positiveDocs.reduce((sum, d) => sum + d.confidence, 0) / positiveDocs.length
      : 0;
    
    const avgFailureConfidence = negativeDocs.length > 0
      ? negativeDocs.reduce((sum, d) => sum + d.confidence, 0) / negativeDocs.length
      : 0;
    
    // Recommend threshold: midpoint between avg failure and success confidence
    const recommendedThreshold = (avgFailureConfidence + avgSuccessConfidence) / 2;
    
    // Extract common root causes
    const rootCauseCounts = new Map<string, number>();
    for (const doc of positiveDocs) {
      const rootCause = this.extractRootCauseKeywords(doc.root_cause);
      rootCauseCounts.set(rootCause, (rootCauseCounts.get(rootCause) || 0) + 1);
    }
    
    const commonRootCauses = Array.from(rootCauseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cause]) => cause);
    
    return {
      errorType,
      sampleCount: docs.length,
      successRate,
      avgSuccessConfidence,
      avgFailureConfidence,
      recommendedThreshold,
      commonRootCauses,
      updatedAt: Date.now()
    };
  }
  
  /**
   * Extract keywords from root cause for pattern matching
   */
  private extractRootCauseKeywords(rootCause: string): string {
    // Extract key phrases (simplified approach)
    const words = rootCause.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    // Return first 3 meaningful words
    return words.slice(0, 3).join(' ');
  }
  
  /**
   * Generate adaptation strategies based on patterns
   * 
   * Analyzes learning patterns to create actionable strategies
   * for improving RCA quality.
   * 
   * @returns Array of prioritized adaptation strategies
   */
  async generateAdaptationStrategies(): Promise<AdaptationStrategy[]> {
    if (this.patterns.size === 0) {
      await this.analyzeFeedbackPatterns();
    }
    
    const strategies: AdaptationStrategy[] = [];
    
    for (const [errorType, pattern] of this.patterns.entries()) {
      // Strategy 1: Adjust confidence for low-performing error types
      if (pattern.successRate < this.config.successThreshold) {
        strategies.push({
          type: 'confidence_adjustment',
          errorTypes: [errorType],
          description: `Increase confidence threshold for ${errorType} from ${pattern.avgFailureConfidence.toFixed(2)} to ${pattern.recommendedThreshold.toFixed(2)}`,
          expectedImpact: (this.config.successThreshold - pattern.successRate) * 0.5,
          priority: 4
        });
      }
      
      // Strategy 2: Reinforce successful patterns
      if (pattern.successRate >= this.config.successThreshold && pattern.sampleCount >= 10) {
        strategies.push({
          type: 'pattern_reinforcement',
          errorTypes: [errorType],
          description: `Promote ${errorType} examples (${pattern.successRate.toFixed(0)}% success) to training set`,
          expectedImpact: 0.15,
          priority: 3
        });
      }
      
      // Strategy 3: Curate examples for common patterns
      if (pattern.commonRootCauses.length >= 2) {
        strategies.push({
          type: 'example_curation',
          errorTypes: [errorType],
          description: `Create focused examples for ${errorType} covering: ${pattern.commonRootCauses.join(', ')}`,
          expectedImpact: 0.2,
          priority: 5
        });
      }
    }
    
    // Sort by priority (descending)
    strategies.sort((a, b) => b.priority - a.priority);
    
    if (this.config.enableLogging) {
      console.log(`[AdaptiveLearning] Generated ${strategies.length} adaptation strategies`);
    }
    
    return strategies;
  }
  
  /**
   * Calculate learning metrics over time
   * 
   * @returns Current learning metrics
   */
  async calculateMetrics(): Promise<LearningMetrics> {
    if (this.patterns.size === 0) {
      await this.analyzeFeedbackPatterns();
    }
    
    const stats = this.feedbackHandler.getStats();
    const allPatterns = Array.from(this.patterns.values());
    
    // Calculate overall success rate trend (simplified: current rate)
    const currentSuccessRate = stats.successRate;
    const successRateTrend = [currentSuccessRate]; // In production, track historical data
    
    // Top improvements (compare current vs baseline 0.5)
    const BASELINE_RATE = 0.5;
    const topImprovements = allPatterns
      .filter(p => p.successRate > BASELINE_RATE)
      .map(p => ({
        errorType: p.errorType,
        beforeRate: BASELINE_RATE,
        afterRate: p.successRate,
        improvement: p.successRate - BASELINE_RATE
      }))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5);
    
    // Error types needing attention (below threshold)
    const needsAttention = allPatterns
      .filter(p => p.successRate < this.config.successThreshold)
      .map(p => p.errorType);
    
    this.metrics = {
      totalFeedback: stats.total,
      successRateTrend,
      topImprovements,
      needsAttention,
      calculatedAt: Date.now()
    };
    
    return this.metrics;
  }
  
  /**
   * Apply learning automatically (if enabled)
   * 
   * Executes adaptation strategies to improve future RCA quality.
   * Currently logs recommendations; future versions will apply changes.
   * 
   * @returns Number of strategies applied
   */
  async applyLearning(): Promise<number> {
    if (!this.config.enableAutoAdjustments) {
      if (this.config.enableLogging) {
        console.log('[AdaptiveLearning] Auto-adjustments disabled. Call with enableAutoAdjustments: true to apply changes.');
      }
      return 0;
    }
    
    const strategies = await this.generateAdaptationStrategies();
    let appliedCount = 0;
    
    for (const strategy of strategies) {
      if (strategy.priority >= 4) {
        // Apply high-priority strategies
        if (this.config.enableLogging) {
          console.log(`[AdaptiveLearning] Applying: ${strategy.description}`);
        }
        
        // In production, this would:
        // - Update confidence thresholds in PromptEngine
        // - Add high-quality examples to few-shot prompts
        // - Adjust quality scoring weights
        
        appliedCount++;
      }
    }
    
    if (this.config.enableLogging) {
      console.log(`[AdaptiveLearning] Applied ${appliedCount}/${strategies.length} strategies`);
    }
    
    return appliedCount;
  }
  
  /**
   * Get current patterns
   */
  getPatterns(): Map<string, LearningPattern> {
    return new Map(this.patterns);
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): LearningMetrics | null {
    return this.metrics;
  }
  
  /**
   * Reset learning state (for testing)
   */
  reset(): void {
    this.patterns.clear();
    this.metrics = null;
  }
}
