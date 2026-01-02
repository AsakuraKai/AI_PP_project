"use strict";
/**
 * Learning Pipeline for Automated RCA Improvement
 *
 * Orchestrates the continuous learning process:
 * - Collects feedback data
 * - Identifies improvement opportunities
 * - Generates training examples
 * - Prepares data for model fine-tuning
 *
 * @module agent/LearningPipeline
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningPipeline = void 0;
const AdaptiveLearning_1 = require("./AdaptiveLearning");
const QualityScorer_1 = require("../db/QualityScorer");
const DEFAULT_CONFIG = {
    minTrainingQuality: 0.7,
    requireValidation: true,
    maxExamplesPerType: 50,
    enableAutoRun: false,
    autoRunIntervalHours: 24,
    enableLogging: true
};
/**
 * Learning Pipeline
 *
 * Automated workflow for continuous RCA improvement:
 * 1. **Collection**: Gather feedback data from ChromaDB
 * 2. **Analysis**: Identify patterns with AdaptiveLearning
 * 3. **Curation**: Generate training examples from high-quality RCAs
 * 4. **Export**: Prepare data for model fine-tuning
 *
 * @example
 * ```typescript
 * const pipeline = new LearningPipeline(dbClient, feedbackHandler);
 *
 * // Run complete pipeline
 * const result = await pipeline.run();
 * console.log(`Generated ${result.examplesGenerated} training examples`);
 *
 * // Export examples for fine-tuning
 * const examples = await pipeline.exportTrainingData();
 * await fs.writeFile('training.json', JSON.stringify(examples, null, 2));
 * ```
 */
class LearningPipeline {
    constructor(db, feedbackHandler, config) {
        this.db = db;
        this.feedbackHandler = feedbackHandler;
        this.autoRunTimer = null;
        this.trainingExamples = new Map();
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
        this.adaptiveLearning = new AdaptiveLearning_1.AdaptiveLearning(db, feedbackHandler, {
            enableLogging: this.config.enableLogging
        });
        this.qualityScorer = new QualityScorer_1.QualityScorer();
        if (this.config.enableAutoRun) {
            this.startAutoRun();
        }
    }
    /**
     * Run the complete learning pipeline
     *
     * @returns Pipeline run result with metrics
     */
    async run() {
        const runId = `run_${Date.now()}`;
        const startedAt = Date.now();
        const stages = [];
        if (this.config.enableLogging) {
            console.log(`[LearningPipeline] Starting pipeline run ${runId}...`);
        }
        try {
            // Stage 1: Collect feedback data
            const collectResult = await this.stageCollect();
            stages.push(collectResult);
            if (!collectResult.success) {
                throw new Error(`Collection stage failed: ${collectResult.message}`);
            }
            // Stage 2: Analyze patterns
            const analyzeResult = await this.stageAnalyze();
            stages.push(analyzeResult);
            if (!analyzeResult.success) {
                throw new Error(`Analysis stage failed: ${analyzeResult.message}`);
            }
            // Stage 3: Curate training examples
            const curateResult = await this.stageCurate();
            stages.push(curateResult);
            if (!curateResult.success) {
                throw new Error(`Curation stage failed: ${curateResult.message}`);
            }
            // Stage 4: Validate examples
            const validateResult = await this.stageValidate();
            stages.push(validateResult);
            const completedAt = Date.now();
            const result = {
                runId,
                startedAt,
                completedAt,
                totalDurationMs: completedAt - startedAt,
                stages,
                examplesGenerated: curateResult.itemsOutput,
                patternsIdentified: analyzeResult.itemsOutput,
                success: true
            };
            if (this.config.enableLogging) {
                console.log(`[LearningPipeline] ✅ Pipeline completed in ${result.totalDurationMs}ms`);
                console.log(`  - Patterns identified: ${result.patternsIdentified}`);
                console.log(`  - Examples generated: ${result.examplesGenerated}`);
            }
            return result;
        }
        catch (error) {
            const completedAt = Date.now();
            if (this.config.enableLogging) {
                console.error(`[LearningPipeline] ❌ Pipeline failed: ${error}`);
            }
            return {
                runId,
                startedAt,
                completedAt,
                totalDurationMs: completedAt - startedAt,
                stages,
                examplesGenerated: 0,
                patternsIdentified: 0,
                success: false
            };
        }
    }
    /**
     * Stage 1: Collect feedback data from database
     */
    async stageCollect() {
        const startTime = Date.now();
        try {
            const allDocs = await this.db.getAll();
            const validatedDocs = allDocs.filter(d => d.user_validated !== undefined);
            return {
                stage: 'collect',
                success: true,
                itemsProcessed: allDocs.length,
                itemsOutput: validatedDocs.length,
                durationMs: Date.now() - startTime,
                message: `Collected ${validatedDocs.length} validated documents`
            };
        }
        catch (error) {
            return {
                stage: 'collect',
                success: false,
                itemsProcessed: 0,
                itemsOutput: 0,
                durationMs: Date.now() - startTime,
                message: `Failed: ${error}`
            };
        }
    }
    /**
     * Stage 2: Analyze patterns with AdaptiveLearning
     */
    async stageAnalyze() {
        const startTime = Date.now();
        try {
            const patterns = await this.adaptiveLearning.analyzeFeedbackPatterns();
            return {
                stage: 'analyze',
                success: true,
                itemsProcessed: patterns.size,
                itemsOutput: patterns.size,
                durationMs: Date.now() - startTime,
                message: `Identified ${patterns.size} learning patterns`
            };
        }
        catch (error) {
            return {
                stage: 'analyze',
                success: false,
                itemsProcessed: 0,
                itemsOutput: 0,
                durationMs: Date.now() - startTime,
                message: `Failed: ${error}`
            };
        }
    }
    /**
     * Stage 3: Curate high-quality training examples
     */
    async stageCurate() {
        const startTime = Date.now();
        try {
            const allDocs = await this.db.getAll();
            this.trainingExamples.clear();
            // Filter high-quality, validated documents
            const candidateDocs = allDocs.filter(doc => {
                if (this.config.requireValidation && !doc.user_validated) {
                    return false;
                }
                if (doc.quality_score < this.config.minTrainingQuality) {
                    return false;
                }
                return true;
            });
            // Group by error type and limit per type
            const typeGroups = new Map();
            for (const doc of candidateDocs) {
                const errorType = doc.metadata?.error_type || 'unknown';
                const existing = typeGroups.get(errorType) || [];
                existing.push(doc);
                typeGroups.set(errorType, existing);
            }
            // Generate training examples (limited per type)
            for (const [errorType, docs] of typeGroups.entries()) {
                const limitedDocs = docs
                    .sort((a, b) => b.quality_score - a.quality_score)
                    .slice(0, this.config.maxExamplesPerType);
                for (const doc of limitedDocs) {
                    const example = this.createTrainingExample(doc);
                    this.trainingExamples.set(example.id, example);
                }
            }
            return {
                stage: 'curate',
                success: true,
                itemsProcessed: candidateDocs.length,
                itemsOutput: this.trainingExamples.size,
                durationMs: Date.now() - startTime,
                message: `Curated ${this.trainingExamples.size} training examples`
            };
        }
        catch (error) {
            return {
                stage: 'curate',
                success: false,
                itemsProcessed: 0,
                itemsOutput: 0,
                durationMs: Date.now() - startTime,
                message: `Failed: ${error}`
            };
        }
    }
    /**
     * Stage 4: Validate training examples
     */
    async stageValidate() {
        const startTime = Date.now();
        try {
            const examples = Array.from(this.trainingExamples.values());
            let validCount = 0;
            for (const example of examples) {
                // Validate completeness
                if (!example.errorMessage || !example.expectedRootCause) {
                    this.trainingExamples.delete(example.id);
                    continue;
                }
                // Validate quality
                if (example.quality < this.config.minTrainingQuality) {
                    this.trainingExamples.delete(example.id);
                    continue;
                }
                validCount++;
            }
            return {
                stage: 'validate',
                success: true,
                itemsProcessed: examples.length,
                itemsOutput: validCount,
                durationMs: Date.now() - startTime,
                message: `Validated ${validCount} examples`
            };
        }
        catch (error) {
            return {
                stage: 'validate',
                success: false,
                itemsProcessed: 0,
                itemsOutput: 0,
                durationMs: Date.now() - startTime,
                message: `Failed: ${error}`
            };
        }
    }
    /**
     * Create training example from RCA document
     */
    createTrainingExample(doc) {
        return {
            id: `example_${doc.id}`,
            errorType: doc.metadata?.error_type || 'unknown',
            errorMessage: doc.metadata?.error_message || '',
            expectedRootCause: doc.root_cause,
            expectedFixGuidelines: doc.fix_guidelines,
            quality: doc.quality_score,
            validated: doc.user_validated || false,
            sourceRcaId: doc.id,
            createdAt: doc.created_at
        };
    }
    /**
     * Export training data for fine-tuning
     *
     * @param format - Export format ('json' | 'jsonl')
     * @returns Training examples in specified format
     */
    async exportTrainingData(format = 'json') {
        const examples = Array.from(this.trainingExamples.values());
        if (format === 'jsonl') {
            return examples.map(ex => JSON.stringify(ex)).join('\n');
        }
        return JSON.stringify(examples, null, 2);
    }
    /**
     * Get current training examples
     */
    getTrainingExamples() {
        return Array.from(this.trainingExamples.values());
    }
    /**
     * Get training examples for specific error type
     */
    getExamplesByType(errorType) {
        return Array.from(this.trainingExamples.values())
            .filter(ex => ex.errorType === errorType);
    }
    /**
     * Start automatic pipeline runs
     */
    startAutoRun() {
        if (this.autoRunTimer) {
            return;
        }
        const intervalMs = this.config.autoRunIntervalHours * 60 * 60 * 1000;
        this.autoRunTimer = setInterval(async () => {
            if (this.config.enableLogging) {
                console.log('[LearningPipeline] Starting scheduled pipeline run...');
            }
            await this.run();
        }, intervalMs);
        if (this.config.enableLogging) {
            console.log(`[LearningPipeline] Auto-run enabled (every ${this.config.autoRunIntervalHours}h)`);
        }
    }
    /**
     * Stop automatic pipeline runs
     */
    stopAutoRun() {
        if (this.autoRunTimer) {
            clearInterval(this.autoRunTimer);
            this.autoRunTimer = null;
            if (this.config.enableLogging) {
                console.log('[LearningPipeline] Auto-run stopped');
            }
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAutoRun();
        this.trainingExamples.clear();
    }
}
exports.LearningPipeline = LearningPipeline;
//# sourceMappingURL=LearningPipeline.js.map