"use strict";
/**
 * Quality Scorer for RCA Documents
 *
 * Calculates quality scores for RCA documents based on multiple factors:
 * - Base confidence score from analysis
 * - User validation feedback
 * - Document age (newer is better)
 * - Usage frequency (more used = higher quality)
 *
 * @module db/QualityScorer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityScorer = void 0;
/**
 * Quality Scorer for RCA documents
 *
 * Implements a multi-factor quality scoring algorithm to rank RCA documents.
 * Higher quality documents are prioritized in search results.
 *
 * @example
 * ```typescript
 * const scorer = new QualityScorer();
 *
 * const quality = scorer.calculateQuality({
 *   baseConfidence: 0.9,
 *   userValidated: true,
 *   ageMs: Date.now() - oneMonthAgo,
 *   usageCount: 5
 * });
 *
 * console.log(quality); // 0.95 (high quality)
 * ```
 */
class QualityScorer {
    /**
     * Create quality scorer with optional configuration
     *
     * @param config - Optional configuration for quality calculation
     */
    constructor(config) {
        this.config = {
            ageThreshold: config?.ageThreshold || 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
            maxAgePenalty: config?.maxAgePenalty || 0.5,
            validationBonus: config?.validationBonus || 0.2,
            minQuality: config?.minQuality || 0.1,
            maxQuality: config?.maxQuality || 1.0
        };
    }
    /**
     * Calculate quality score for RCA document
     *
     * Algorithm:
     * 1. Start with base confidence (0-1)
     * 2. Add validation bonus if user validated (+0.2)
     * 3. Apply age penalty if older than threshold (up to -50%)
     * 4. Add usage bonus based on helpfulness count
     * 5. Clamp to [minQuality, maxQuality]
     *
     * @param factors - Factors to consider in quality calculation
     * @returns Quality score between 0 and 1
     *
     * @example
     * ```typescript
     * const score = scorer.calculateQuality({
     *   baseConfidence: 0.8,
     *   userValidated: true,
     *   ageMs: 1000 * 60 * 60 * 24 * 30, // 1 month old
     *   usageCount: 3
     * });
     * ```
     */
    calculateQuality(factors) {
        let quality = factors.baseConfidence;
        // Add user validation bonus
        if (factors.userValidated) {
            quality += this.config.validationBonus;
        }
        // Apply age penalty
        const agePenalty = this.calculateAgePenalty(factors.ageMs);
        quality *= (1 - agePenalty);
        // Add usage bonus (logarithmic scaling)
        if (factors.usageCount && factors.usageCount > 0) {
            const usageBonus = Math.log10(factors.usageCount + 1) * 0.1;
            quality += usageBonus;
        }
        // Clamp to valid range
        return Math.max(this.config.minQuality, Math.min(this.config.maxQuality, quality));
    }
    /**
     * Calculate quality score with detailed breakdown
     *
     * Useful for debugging and understanding quality scores.
     *
     * @param factors - Factors to consider
     * @returns Detailed breakdown of quality calculation
     *
     * @example
     * ```typescript
     * const breakdown = scorer.calculateQualityWithBreakdown(factors);
     * console.log('Base:', breakdown.baseConfidence);
     * console.log('Validation:', breakdown.validationBonus);
     * console.log('Age penalty:', breakdown.agePenalty);
     * console.log('Final score:', breakdown.score);
     * ```
     */
    calculateQualityWithBreakdown(factors) {
        const baseConfidence = factors.baseConfidence;
        const validationBonus = factors.userValidated ? this.config.validationBonus : 0;
        const agePenalty = this.calculateAgePenalty(factors.ageMs);
        const usageBonus = factors.usageCount
            ? Math.log10(factors.usageCount + 1) * 0.1
            : 0;
        let score = baseConfidence;
        score += validationBonus;
        score *= (1 - agePenalty);
        score += usageBonus;
        score = Math.max(this.config.minQuality, Math.min(this.config.maxQuality, score));
        return {
            score,
            baseConfidence,
            validationBonus,
            agePenalty,
            usageBonus
        };
    }
    /**
     * Calculate age penalty factor
     *
     * Linear interpolation from 0 (new) to maxAgePenalty (old).
     * Documents older than ageThreshold get maximum penalty.
     *
     * @param ageMs - Document age in milliseconds
     * @returns Penalty factor (0 to maxAgePenalty)
     */
    calculateAgePenalty(ageMs) {
        if (ageMs <= 0) {
            return 0;
        }
        if (ageMs >= this.config.ageThreshold) {
            return this.config.maxAgePenalty;
        }
        // Linear interpolation
        const ageFactor = ageMs / this.config.ageThreshold;
        return ageFactor * this.config.maxAgePenalty;
    }
    /**
     * Check if document quality is below minimum threshold
     *
     * Used to filter out low-quality documents from search results.
     *
     * @param quality - Quality score to check
     * @returns True if quality is too low
     */
    isBelowMinimum(quality) {
        return quality < this.config.minQuality;
    }
    /**
     * Adjust quality score after positive feedback
     *
     * Increases confidence by 20% (capped at 1.0).
     *
     * @param currentQuality - Current quality score
     * @returns Updated quality score
     */
    applyPositiveFeedback(currentQuality) {
        const boosted = currentQuality * 1.2;
        return Math.min(this.config.maxQuality, boosted);
    }
    /**
     * Adjust quality score after negative feedback
     *
     * Decreases confidence by 50% (floored at minQuality).
     *
     * @param currentQuality - Current quality score
     * @returns Updated quality score
     */
    applyNegativeFeedback(currentQuality) {
        const reduced = currentQuality * 0.5;
        return Math.max(this.config.minQuality, reduced);
    }
    /**
     * Get configuration used by this scorer
     *
     * @returns Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.QualityScorer = QualityScorer;
//# sourceMappingURL=QualityScorer.js.map