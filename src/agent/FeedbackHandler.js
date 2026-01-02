"use strict";
/**
 * Feedback Handler for User Validation of RCA Results
 *
 * Processes user feedback (thumbs up/down) to improve RCA quality over time.
 * Positive feedback increases confidence; negative feedback decreases it
 * and invalidates cache entries.
 *
 * @module agent/FeedbackHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackHandler = exports.FeedbackError = void 0;
const QualityScorer_1 = require("../db/QualityScorer");
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    positiveMultiplier: 1.2,
    negativeMultiplier: 0.5,
    maxConfidence: 1.0,
    minConfidence: 0.1,
    invalidateCacheOnNegative: true,
    enableLogging: true
};
/**
 * Error thrown when feedback processing fails
 */
class FeedbackError extends Error {
    constructor(message, rcaId, feedbackType, cause) {
        super(message);
        this.rcaId = rcaId;
        this.feedbackType = feedbackType;
        this.cause = cause;
        this.name = 'FeedbackError';
    }
}
exports.FeedbackError = FeedbackError;
/**
 * Feedback Handler for processing user validation
 *
 * Manages the feedback loop between user validation and RCA quality:
 * - Positive feedback: Increases confidence, marks as validated
 * - Negative feedback: Decreases confidence, invalidates cache
 *
 * @example
 * ```typescript
 * const handler = new FeedbackHandler(dbClient, cache);
 *
 * // User clicks thumbs up
 * const result = await handler.handlePositive(rcaId, errorHash);
 * console.log(`Confidence increased: ${result.previousConfidence} → ${result.newConfidence}`);
 *
 * // User clicks thumbs down
 * const result = await handler.handleNegative(rcaId, errorHash);
 * console.log(`Cache invalidated: ${result.cacheInvalidated}`);
 * ```
 */
class FeedbackHandler {
    /**
     * Create a new FeedbackHandler
     *
     * @param db - ChromaDB client for database operations
     * @param cache - RCA cache for invalidation
     * @param config - Optional configuration
     */
    constructor(db, cache, config) {
        this.db = db;
        this.cache = cache;
        // Statistics tracking
        this.totalPositive = 0;
        this.totalNegative = 0;
        this.totalSuccessful = 0;
        this.positiveBoosts = [];
        this.negativeReductions = [];
        this.config = {
            positiveMultiplier: config?.positiveMultiplier ?? DEFAULT_CONFIG.positiveMultiplier,
            negativeMultiplier: config?.negativeMultiplier ?? DEFAULT_CONFIG.negativeMultiplier,
            maxConfidence: config?.maxConfidence ?? DEFAULT_CONFIG.maxConfidence,
            minConfidence: config?.minConfidence ?? DEFAULT_CONFIG.minConfidence,
            invalidateCacheOnNegative: config?.invalidateCacheOnNegative ?? DEFAULT_CONFIG.invalidateCacheOnNegative,
            enableLogging: config?.enableLogging ?? DEFAULT_CONFIG.enableLogging
        };
        this.qualityScorer = new QualityScorer_1.QualityScorer({
            minQuality: this.config.minConfidence,
            maxQuality: this.config.maxConfidence
        });
    }
    /**
     * Process positive feedback (thumbs up)
     *
     * - Increases confidence by 20% (capped at 1.0)
     * - Marks document as user-validated
     * - Recalculates quality score
     *
     * @param rcaId - RCA document ID
     * @param _errorHash - Error hash for potential cache operations (reserved for future use)
     * @returns Feedback result with before/after scores
     * @throws {FeedbackError} If document not found or update fails
     */
    async handlePositive(rcaId, _errorHash) {
        this.totalPositive++;
        try {
            // Get existing document
            const rca = await this.db.getById(rcaId);
            if (!rca) {
                throw new FeedbackError(`RCA document not found: ${rcaId}`, rcaId, 'positive');
            }
            const previousConfidence = rca.confidence;
            const previousQuality = rca.quality_score;
            // Calculate new confidence (increase by multiplier, cap at max)
            const newConfidence = Math.min(rca.confidence * this.config.positiveMultiplier, this.config.maxConfidence);
            // Calculate new quality score
            const newQuality = this.calculateQuality({
                ...rca,
                confidence: newConfidence,
                user_validated: true
            });
            // Update document in database
            await this.db.update(rcaId, {
                confidence: newConfidence,
                user_validated: true,
                quality_score: newQuality
            });
            // Track statistics
            this.totalSuccessful++;
            this.positiveBoosts.push(newConfidence - previousConfidence);
            const result = {
                success: true,
                rcaId,
                feedbackType: 'positive',
                previousConfidence,
                newConfidence,
                previousQuality,
                newQuality,
                cacheInvalidated: false,
                message: `RCA ${rcaId} validated positively. Confidence: ${previousConfidence.toFixed(2)} → ${newConfidence.toFixed(2)}`
            };
            this.log(result.message);
            return result;
        }
        catch (error) {
            if (error instanceof FeedbackError) {
                throw error;
            }
            throw new FeedbackError(`Failed to process positive feedback for ${rcaId}`, rcaId, 'positive', error);
        }
    }
    /**
     * Process negative feedback (thumbs down)
     *
     * - Decreases confidence by 50% (floored at 0.1)
     * - Recalculates quality score
     * - Invalidates cache entry (if enabled)
     *
     * @param rcaId - RCA document ID
     * @param errorHash - Error hash for cache invalidation
     * @returns Feedback result with before/after scores
     * @throws {FeedbackError} If document not found or update fails
     */
    async handleNegative(rcaId, errorHash) {
        this.totalNegative++;
        try {
            // Get existing document
            const rca = await this.db.getById(rcaId);
            if (!rca) {
                throw new FeedbackError(`RCA document not found: ${rcaId}`, rcaId, 'negative');
            }
            const previousConfidence = rca.confidence;
            const previousQuality = rca.quality_score;
            // Calculate new confidence (decrease by multiplier, floor at min)
            const newConfidence = Math.max(rca.confidence * this.config.negativeMultiplier, this.config.minConfidence);
            // Calculate new quality score (don't mark as validated on negative)
            const newQuality = this.calculateQuality({
                ...rca,
                confidence: newConfidence,
                user_validated: false // Negative feedback removes validation
            });
            // Update document in database
            await this.db.update(rcaId, {
                confidence: newConfidence,
                user_validated: false,
                quality_score: newQuality
            });
            // Invalidate cache if enabled and errorHash provided
            let cacheInvalidated = false;
            if (this.config.invalidateCacheOnNegative && errorHash) {
                cacheInvalidated = this.cache.invalidate(errorHash);
            }
            // Track statistics
            this.totalSuccessful++;
            this.negativeReductions.push(previousConfidence - newConfidence);
            const result = {
                success: true,
                rcaId,
                feedbackType: 'negative',
                previousConfidence,
                newConfidence,
                previousQuality,
                newQuality,
                cacheInvalidated,
                message: `RCA ${rcaId} marked unhelpful. Confidence: ${previousConfidence.toFixed(2)} → ${newConfidence.toFixed(2)}${cacheInvalidated ? ' (cache invalidated)' : ''}`
            };
            this.log(result.message);
            return result;
        }
        catch (error) {
            if (error instanceof FeedbackError) {
                throw error;
            }
            throw new FeedbackError(`Failed to process negative feedback for ${rcaId}`, rcaId, 'negative', error);
        }
    }
    /**
     * Process feedback of either type
     *
     * Convenience method that routes to appropriate handler.
     *
     * @param rcaId - RCA document ID
     * @param feedbackType - Type of feedback
     * @param errorHash - Error hash for cache operations
     * @returns Feedback result
     */
    async handleFeedback(rcaId, feedbackType, errorHash) {
        if (feedbackType === 'positive') {
            return this.handlePositive(rcaId, errorHash);
        }
        else {
            return this.handleNegative(rcaId, errorHash);
        }
    }
    /**
     * Get feedback statistics
     *
     * @returns Current feedback statistics
     */
    getStats() {
        const total = this.totalPositive + this.totalNegative;
        return {
            totalPositive: this.totalPositive,
            totalNegative: this.totalNegative,
            total,
            successRate: total > 0 ? this.totalSuccessful / total : 0,
            avgPositiveBoost: this.calculateAverage(this.positiveBoosts),
            avgNegativeReduction: this.calculateAverage(this.negativeReductions)
        };
    }
    /**
     * Reset feedback statistics
     */
    resetStats() {
        this.totalPositive = 0;
        this.totalNegative = 0;
        this.totalSuccessful = 0;
        this.positiveBoosts = [];
        this.negativeReductions = [];
    }
    /**
     * Calculate quality score for an RCA document
     *
     * @param rca - RCA document
     * @returns Quality score (0-1)
     */
    calculateQuality(rca) {
        return this.qualityScorer.calculateQuality({
            baseConfidence: rca.confidence,
            userValidated: rca.user_validated,
            ageMs: Date.now() - rca.created_at
        });
    }
    /**
     * Calculate average of number array
     */
    calculateAverage(values) {
        if (values.length === 0)
            return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    }
    /**
     * Log message if logging enabled
     */
    log(message) {
        if (this.config.enableLogging) {
            console.log(`[FeedbackHandler] ${message}`);
        }
    }
}
exports.FeedbackHandler = FeedbackHandler;
//# sourceMappingURL=FeedbackHandler.js.map