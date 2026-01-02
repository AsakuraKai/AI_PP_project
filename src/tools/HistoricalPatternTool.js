"use strict";
/**
 * HistoricalPatternTool - Analyze historical error patterns
 *
 * Phase 2 Enhancement: Track and analyze historical error occurrences
 * to identify recurring patterns and successful fixes.
 *
 * Key Features:
 * - Track error history in project
 * - Identify recurring error patterns
 * - Find successful fixes from history
 * - Predict likely fixes based on patterns
 *
 * Expected Impact: Part of +5-10% usability from advanced tools
 *
 * @example
 * const tool = new HistoricalPatternTool();
 * const patterns = await tool.execute({ error, projectPath });
 * console.log(patterns.similarErrors); // Historical similar errors
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalPatternTool = exports.Tool = void 0;
class Tool {
}
exports.Tool = Tool;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * HistoricalPatternTool tracks and analyzes error history
 */
class HistoricalPatternTool extends Tool {
    constructor() {
        super(...arguments);
        this.name = 'historical_pattern';
        this.description = 'Analyze historical error patterns and successful fixes';
        this.historyPath = '';
    }
    /**
     * Execute historical pattern analysis
     */
    async execute(params, _context) {
        console.log('🔍 Analyzing historical patterns...');
        try {
            this.historyPath = path.join(params.projectPath, '.rca-agent', 'history.json');
            // Load historical errors
            const history = await this.loadHistory();
            if (history.length === 0) {
                console.log('  No historical data available');
                return null;
            }
            console.log(`  Loaded ${history.length} historical errors`);
            // Find similar errors
            const similar = this.findSimilarErrors(params.error, history, params.minSimilarity || 0.6);
            if (similar.length === 0) {
                console.log('  No similar historical errors found');
                return null;
            }
            console.log(`  Found ${similar.length} similar errors`);
            // Analyze patterns
            const pattern = this.analyzePattern(params.error, similar);
            console.log(`✓ Pattern analysis complete (success rate: ${(pattern.successRate * 100).toFixed(0)}%)`);
            return pattern;
        }
        catch (error) {
            console.warn('⚠️ Historical pattern analysis failed:', error);
            return null;
        }
    }
    /**
     * Record error and fix for future analysis
     */
    async recordError(error, fix, projectPath, successful) {
        try {
            this.historyPath = path.join(projectPath, '.rca-agent', 'history.json');
            // Load existing history
            const history = await this.loadHistory();
            // Create historical record
            const record = {
                id: `error_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                error,
                fix,
                timestamp: Date.now(),
                fixSuccessful: successful,
            };
            // Add to history
            history.push(record);
            // Keep only last 1000 errors
            const trimmedHistory = history.slice(-1000);
            // Save
            await this.saveHistory(trimmedHistory);
            console.log('✓ Recorded error in history');
        }
        catch (error) {
            console.warn('⚠️ Failed to record error:', error);
        }
    }
    /**
     * Record user feedback on fix
     */
    async recordFeedback(errorId, helpful, comments, projectPath) {
        try {
            this.historyPath = path.join(projectPath, '.rca-agent', 'history.json');
            const history = await this.loadHistory();
            const record = history.find(r => r.id === errorId);
            if (record) {
                record.feedback = { helpful, comments };
                await this.saveHistory(history);
                console.log('✓ Recorded user feedback');
            }
        }
        catch (error) {
            console.warn('⚠️ Failed to record feedback:', error);
        }
    }
    /**
     * Load history from disk
     */
    async loadHistory() {
        try {
            if (!fs.existsSync(this.historyPath)) {
                return [];
            }
            const content = fs.readFileSync(this.historyPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            console.warn('⚠️ Failed to load history:', error);
            return [];
        }
    }
    /**
     * Save history to disk
     */
    async saveHistory(history) {
        try {
            const dir = path.dirname(this.historyPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
        }
        catch (error) {
            console.warn('⚠️ Failed to save history:', error);
        }
    }
    /**
     * Find similar errors in history
     */
    findSimilarErrors(error, history, minSimilarity) {
        const similar = [];
        for (const record of history) {
            const similarity = this.calculateSimilarity(error, record.error);
            if (similarity >= minSimilarity) {
                similar.push({ record, similarity });
            }
        }
        // Sort by similarity
        similar.sort((a, b) => b.similarity - a.similarity);
        return similar.map(s => s.record);
    }
    /**
     * Calculate similarity between two errors
     */
    calculateSimilarity(error1, error2) {
        let score = 0;
        // Error type match (40%)
        if (error1.type === error2.type) {
            score += 0.4;
        }
        // File path match (20%)
        if (error1.filePath === error2.filePath) {
            score += 0.2;
        }
        else if (path.basename(error1.filePath) === path.basename(error2.filePath)) {
            score += 0.1; // Same filename, different path
        }
        // Language match (10%)
        if (error1.language === error2.language) {
            score += 0.1;
        }
        // Message similarity (30%)
        const messageSimilarity = this.calculateTextSimilarity(error1.message, error2.message);
        score += messageSimilarity * 0.3;
        return score;
    }
    /**
     * Calculate text similarity (Jaccard similarity on words)
     */
    calculateTextSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    /**
     * Analyze pattern from similar errors
     */
    analyzePattern(currentError, similarErrors) {
        // Extract common characteristics
        const characteristics = [];
        // Error type
        characteristics.push(`Error type: ${currentError.type}`);
        // Common file patterns
        const files = similarErrors.map(e => path.basename(e.error.filePath));
        const fileFreq = this.getFrequency(files);
        if (fileFreq.size > 0) {
            const mostCommon = [...fileFreq.entries()].sort((a, b) => b[1] - a[1])[0];
            characteristics.push(`Common file: ${mostCommon[0]} (${mostCommon[1]} occurrences)`);
        }
        // Calculate success rate
        const fixedErrors = similarErrors.filter(e => e.fixSuccessful === true);
        const successRate = similarErrors.length > 0 ? fixedErrors.length / similarErrors.length : 0;
        // Find most effective fix
        const bestFix = this.findBestFix(fixedErrors);
        return {
            id: `pattern_${currentError.type}`,
            errorType: currentError.type,
            characteristics,
            frequency: similarErrors.length,
            successRate,
            bestFix,
            examples: similarErrors.slice(0, 5), // Top 5 examples
        };
    }
    /**
     * Find most effective fix from successful fixes
     */
    findBestFix(successfulErrors) {
        if (successfulErrors.length === 0)
            return undefined;
        // Group by root cause
        const fixGroups = new Map();
        for (const error of successfulErrors) {
            if (!error.fix)
                continue;
            const key = error.fix.rootCause.substring(0, 100); // Group by first 100 chars
            if (!fixGroups.has(key)) {
                fixGroups.set(key, { count: 0, fix: error.fix });
            }
            fixGroups.get(key).count++;
        }
        // Find most common fix
        const sorted = [...fixGroups.entries()].sort((a, b) => b[1].count - a[1].count);
        if (sorted.length > 0) {
            const [_, { count, fix }] = sorted[0];
            return {
                rootCause: fix.rootCause,
                fixGuidelines: fix.fixGuidelines,
                successCount: count,
            };
        }
        return undefined;
    }
    /**
     * Get frequency map
     */
    getFrequency(items) {
        const freq = new Map();
        for (const item of items) {
            freq.set(item, (freq.get(item) || 0) + 1);
        }
        return freq;
    }
    /**
     * Get error statistics
     */
    async getStatistics(projectPath) {
        this.historyPath = path.join(projectPath, '.rca-agent', 'history.json');
        const history = await this.loadHistory();
        const errorsByType = new Map();
        let successCount = 0;
        let totalResolutionTime = 0;
        let resolutionCount = 0;
        for (const record of history) {
            // Count by type
            const type = record.error.type;
            errorsByType.set(type, (errorsByType.get(type) || 0) + 1);
            // Success rate
            if (record.fixSuccessful === true) {
                successCount++;
            }
            // Resolution time
            if (record.resolutionTime) {
                totalResolutionTime += record.resolutionTime;
                resolutionCount++;
            }
        }
        return {
            totalErrors: history.length,
            errorsByType,
            successRate: history.length > 0 ? successCount / history.length : 0,
            avgResolutionTime: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
        };
    }
}
exports.HistoricalPatternTool = HistoricalPatternTool;
//# sourceMappingURL=HistoricalPatternTool.js.map