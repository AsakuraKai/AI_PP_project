/**
 * ConfidenceTracker - Tracks confidence evolution over conversation
 * 
 * Phase 3: Iterative Refinement
 */

import { ConfidenceEvolution, ConfidencePoint } from '../../types';
import { Logger } from '../../utils/Logger';

const logger = new Logger('ConfidenceTracker');

export class ConfidenceTracker {
    private confidenceHistory: Map<string, ConfidencePoint[]> = new Map();

    /**
     * Record a confidence change
     */
    recordConfidence(
        rcaId: string,
        confidence: number,
        reason: string,
        messageId?: string
    ): void {
        const history = this.confidenceHistory.get(rcaId) || [];

        history.push({
            timestamp: new Date(),
            confidence,
            reason,
            messageId
        });

        this.confidenceHistory.set(rcaId, history);

        logger.debug('Confidence recorded', { rcaId, confidence, reason });
    }

    /**
     * Get confidence evolution for an RCA
     */
    getEvolution(rcaId: string): ConfidenceEvolution | null {
        const history = this.confidenceHistory.get(rcaId);
        if (!history || history.length === 0) {
            return null;
        }

        const initialConfidence = history[0].confidence;
        const currentConfidence = history[history.length - 1].confidence;
        const netChange = currentConfidence - initialConfidence;

        const trend = this.calculateTrend(history);

        return {
            rcaId,
            history,
            trend,
            initialConfidence,
            currentConfidence,
            netChange
        };
    }

    /**
     * Calculate overall trend from history
     */
    private calculateTrend(
        history: ConfidencePoint[]
    ): 'increasing' | 'decreasing' | 'stable' {
        if (history.length < 2) {
            return 'stable';
        }

        const first = history[0].confidence;
        const last = history[history.length - 1].confidence;
        const change = last - first;

        // Threshold of 5% for significant change
        if (Math.abs(change) < 5) {
            return 'stable';
        }

        return change > 0 ? 'increasing' : 'decreasing';
    }

    /**
     * Clear history for an RCA
     */
    clearHistory(rcaId: string): void {
        this.confidenceHistory.delete(rcaId);
        logger.debug('Confidence history cleared', { rcaId });
    }

    /**
     * Get all tracked RCA IDs
     */
    getTrackedRcaIds(): string[] {
        return Array.from(this.confidenceHistory.keys());
    }
}
