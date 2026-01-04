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

import { ChromaDBClient } from '../db/ChromaDBClient';
import { RCADocument } from '../db/schemas/rca-collection';
import { FeedbackHandler } from './FeedbackHandler';
import { AdaptiveLearning } from './AdaptiveLearning';

/**
 * Training example generated from successful RCAs
 */
export interface TrainingExample {
  /** Unique example ID */
  id: string;
  
  /** Error type */
  errorType: string;
  
  /** Error message */
  errorMessage: string;
  
  /** Expected root cause */
  expectedRootCause: string;
  
  /** Expected fix guidelines */
  expectedFixGuidelines: string[];
  
  /** Quality score (0-1) */
  quality: number;
  
  /** User validated */
  validated: boolean;
  
  /** Source RCA ID */
  sourceRcaId: string;
  
  /** Created timestamp */
  createdAt: number;
}

/**
 * Pipeline stage result
 */
export interface StageResult {
  /** Stage name */
  stage: string;
  
  /** Success status */
  success: boolean;
  
  /** Items processed */
  itemsProcessed: number;
  
  /** Items generated/modified */
  itemsOutput: number;
  
  /** Duration in milliseconds */
  durationMs: number;
  
  /** Optional message */
  message?: string;
}

/**
 * Complete pipeline run result
 */
export interface PipelineResult {
  /** Pipeline run ID */
  runId: string;
  
  /** Start timestamp */
  startedAt: number;
  
  /** End timestamp */
  completedAt: number;
  
  /** Total duration */
  totalDurationMs: number;
  
  /** Stage results */
  stages: StageResult[];
  
  /** Training examples generated */
  examplesGenerated: number;
  
  /** Patterns identified */
  patternsIdentified: number;
  
  /** Overall success */
  success: boolean;
}

/**
 * Pipeline configuration
 */
export interface LearningPipelineConfig {
  /** Minimum quality for training examples (default: 0.7) */
  minTrainingQuality?: number;
  
  /** Require user validation (default: true) */
  requireValidation?: boolean;
  
  /** Max examples per error type (default: 50) */
  maxExamplesPerType?: number;
  
  /** Enable automatic pipeline runs (default: false) */
  enableAutoRun?: boolean;
  
  /** Auto-run interval in hours (default: 24) */
  autoRunIntervalHours?: number;
  
  /** Enable logging (default: true) */
  enableLogging?: boolean;
}

const DEFAULT_CONFIG: Required<LearningPipelineConfig> = {
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
export class LearningPipeline {
  private readonly config: Required<LearningPipelineConfig>;
  private readonly adaptiveLearning: AdaptiveLearning;
  // private readonly qualityScorer: QualityScorer; // Unused for now
  private autoRunTimer: NodeJS.Timeout | null = null;
  private trainingExamples: Map<string, TrainingExample> = new Map();
  
  constructor(
    private readonly db: ChromaDBClient,
    _feedbackHandler: FeedbackHandler, // Removed private readonly - not stored
    config?: LearningPipelineConfig
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    this.adaptiveLearning = new AdaptiveLearning(db, _feedbackHandler, {
      enableLogging: this.config.enableLogging
    });
    
    // this.qualityScorer = new QualityScorer(); // Commented out - unused
    
    if (this.config.enableAutoRun) {
      this.startAutoRun();
    }
  }
  
  /**
   * Run the complete learning pipeline
   * 
   * @returns Pipeline run result with metrics
   */
  async run(): Promise<PipelineResult> {
    const runId = `run_${Date.now()}`;
    const startedAt = Date.now();
    const stages: StageResult[] = [];
    
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
      const result: PipelineResult = {
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
      
    } catch (error) {
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
  private async stageCollect(): Promise<StageResult> {
    const startTime = Date.now();
    
    try {
      const allDocs = await this.db.searchSimilar('', 1000, 0.0);
      const validatedDocs = allDocs.filter(d => d.user_validated !== undefined);
      
      return {
        stage: 'collect',
        success: true,
        itemsProcessed: allDocs.length,
        itemsOutput: validatedDocs.length,
        durationMs: Date.now() - startTime,
        message: `Collected ${validatedDocs.length} validated documents`
      };
    } catch (error) {
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
  private async stageAnalyze(): Promise<StageResult> {
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
    } catch (error) {
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
  private async stageCurate(): Promise<StageResult> {
    const startTime = Date.now();
    
    try {
      const allDocs = await this.db.searchSimilar('', 1000, 0.0);
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
      const typeGroups = new Map<string, RCADocument[]>();
      for (const doc of candidateDocs) {
        const errorType = doc.metadata?.error_type || 'unknown';
        const existing = typeGroups.get(errorType) || [];
        existing.push(doc);
        typeGroups.set(errorType, existing);
      }
      
      // Generate training examples (limited per type)
      for (const [_errorType, docs] of typeGroups.entries()) {
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
    } catch (error) {
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
  private async stageValidate(): Promise<StageResult> {
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
    } catch (error) {
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
  private createTrainingExample(doc: RCADocument): TrainingExample {
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
  async exportTrainingData(format: 'json' | 'jsonl' = 'json'): Promise<string> {
    const examples = Array.from(this.trainingExamples.values());
    
    if (format === 'jsonl') {
      return examples.map(ex => JSON.stringify(ex)).join('\n');
    }
    
    return JSON.stringify(examples, null, 2);
  }
  
  /**
   * Get current training examples
   */
  getTrainingExamples(): TrainingExample[] {
    return Array.from(this.trainingExamples.values());
  }
  
  /**
   * Get training examples for specific error type
   */
  getExamplesByType(errorType: string): TrainingExample[] {
    return Array.from(this.trainingExamples.values())
      .filter(ex => ex.errorType === errorType);
  }
  
  /**
   * Start automatic pipeline runs
   */
  private startAutoRun(): void {
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
  stopAutoRun(): void {
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
  destroy(): void {
    this.stopAutoRun();
    this.trainingExamples.clear();
  }
}
