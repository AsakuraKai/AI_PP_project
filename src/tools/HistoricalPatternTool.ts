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

export interface ToolExecutionContext {
  workspacePath?: string;
}
import * as fs from 'fs';
import * as path from 'path';

import { Logger } from '../utils/Logger';
import { ParsedError, RCAResult } from '../types';

export abstract class Tool {
  abstract name: string;
  abstract description: string;
  abstract execute(params: any, context?: ToolExecutionContext): Promise<any>;
}

/**
 * Historical error record
 */
export interface HistoricalError {
  /** Error identifier */
  id: string;

  /** Original error */
  error: ParsedError;

  /** Applied fix (if available) */
  fix?: RCAResult;

  /** When error occurred */
  timestamp: number;

  /** Whether fix was successful */
  fixSuccessful?: boolean;

  /** Time to resolve (ms) */
  resolutionTime?: number;

  /** User feedback */
  feedback?: {
    helpful: boolean;
    comments?: string;
  };
}

/**
 * Pattern analysis result
 */
export interface ErrorPattern {
  /** Pattern identifier */
  id: string;

  /** Error type */
  errorType: string;

  /** Common characteristics */
  characteristics: string[];

  /** Frequency (number of occurrences) */
  frequency: number;

  /** Success rate of fixes */
  successRate: number;

  /** Most effective fix */
  bestFix?: {
    rootCause: string;
    fixGuidelines: string[];
    successCount: number;
  };

  /** Similar historical errors */
  examples: HistoricalError[];
}

/**
 * HistoricalPatternTool parameters
 */
export interface HistoricalPatternParams {
  /** Current error to analyze */
  error: ParsedError;

  /** Project path */
  projectPath: string;

  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;

  /** Maximum historical results */
  maxResults?: number;
}

/**
 * HistoricalPatternTool tracks and analyzes error history
 */
export class HistoricalPatternTool extends Tool {
  name = 'historical_pattern';
  description = 'Analyze historical error patterns and successful fixes';

  private readonly logger = new Logger('HistoricalPatternTool');
  private historyPath: string = '';

  /**
   * Execute historical pattern analysis
   */
  async execute(params: HistoricalPatternParams, _context?: ToolExecutionContext): Promise<ErrorPattern | null> {
    this.logger.info('Analyzing historical patterns');

    try {
      this.historyPath = path.join(params.projectPath, '.rca-agent', 'history.json');

      // Load historical errors
      const history = await this.loadHistory();

      if (history.length === 0) {
        this.logger.info('No historical data available');
        return null;
      }

      this.logger.info('Loaded historical errors', { count: history.length });

      // Find similar errors
      const similar = this.findSimilarErrors(params.error, history, params.minSimilarity || 0.6);

      if (similar.length === 0) {
        this.logger.info('No similar historical errors found');
        return null;
      }

      this.logger.info('Found similar historical errors', { count: similar.length });

      // Analyze patterns
      const pattern = this.analyzePattern(params.error, similar);

      this.logger.info('Pattern analysis complete', { successRate: pattern.successRate });

      return pattern;

    } catch (error) {
      this.logger.error('Historical pattern analysis failed', error);
      return null;
    }
  }

  /**
   * Record error and fix for future analysis
   */
  async recordError(error: ParsedError, fix: RCAResult, projectPath: string, successful?: boolean): Promise<void> {
    try {
      this.historyPath = path.join(projectPath, '.rca-agent', 'history.json');

      // Load existing history
      const history = await this.loadHistory();

      // Create historical record
      const record: HistoricalError = {
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

      this.logger.info('Recorded error in history');

    } catch (error) {
      this.logger.warn('Failed to record error', { error });
    }
  }

  /**
   * Record user feedback on fix
   */
  async recordFeedback(errorId: string, helpful: boolean, comments: string, projectPath: string): Promise<void> {
    try {
      this.historyPath = path.join(projectPath, '.rca-agent', 'history.json');

      const history = await this.loadHistory();
      const record = history.find(r => r.id === errorId);

      if (record) {
        record.feedback = { helpful, comments };
        await this.saveHistory(history);
        this.logger.info('Recorded user feedback', { errorId });
      }

    } catch (error) {
      this.logger.warn('Failed to record feedback', { error });
    }
  }

  /**
   * Load history from disk
   */
  private async loadHistory(): Promise<HistoricalError[]> {
    try {
      if (!fs.existsSync(this.historyPath)) {
        return [];
      }

      const content = fs.readFileSync(this.historyPath, 'utf-8');
      return JSON.parse(content);

    } catch (error) {
      this.logger.warn('Failed to load history', { error });
      return [];
    }
  }

  /**
   * Save history to disk
   */
  private async saveHistory(history: HistoricalError[]): Promise<void> {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));

    } catch (error) {
      this.logger.warn('Failed to save history', { error });
    }
  }

  /**
   * Find similar errors in history
   */
  private findSimilarErrors(error: ParsedError, history: HistoricalError[], minSimilarity: number): HistoricalError[] {
    const similar: Array<{ record: HistoricalError; similarity: number }> = [];

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
  private calculateSimilarity(error1: ParsedError, error2: ParsedError): number {
    let score = 0;

    // Error type match (40%)
    if (error1.type === error2.type) {
      score += 0.4;
    }

    // File path match (20%)
    if (error1.filePath === error2.filePath) {
      score += 0.2;
    } else if (path.basename(error1.filePath) === path.basename(error2.filePath)) {
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
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Analyze pattern from similar errors
   */
  private analyzePattern(currentError: ParsedError, similarErrors: HistoricalError[]): ErrorPattern {
    // Extract common characteristics
    const characteristics: string[] = [];

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
  private findBestFix(successfulErrors: HistoricalError[]): ErrorPattern['bestFix'] | undefined {
    if (successfulErrors.length === 0) return undefined;

    // Group by root cause
    const fixGroups = new Map<string, { count: number; fix: RCAResult }>();

    for (const error of successfulErrors) {
      if (!error.fix) continue;

      const key = error.fix.rootCause.substring(0, 100); // Group by first 100 chars

      if (!fixGroups.has(key)) {
        fixGroups.set(key, { count: 0, fix: error.fix });
      }

      fixGroups.get(key)!.count++;
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
  private getFrequency(items: string[]): Map<string, number> {
    const freq = new Map<string, number>();

    for (const item of items) {
      freq.set(item, (freq.get(item) || 0) + 1);
    }

    return freq;
  }

  /**
   * Get error statistics
   */
  async getStatistics(projectPath: string): Promise<{
    totalErrors: number;
    errorsByType: Map<string, number>;
    successRate: number;
    avgResolutionTime: number;
  }> {
    this.historyPath = path.join(projectPath, '.rca-agent', 'history.json');
    const history = await this.loadHistory();

    const errorsByType = new Map<string, number>();
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
