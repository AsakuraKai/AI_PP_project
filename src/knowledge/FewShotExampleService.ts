/**
 * Few-Shot Example Service
 * 
 * Loads and retrieves relevant few-shot learning examples for RCA agent.
 * Uses semantic similarity to find most relevant examples for given error.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ParsedError } from '../types';

export interface FewShotExample {
  id: string;
  title: string;
  errorType: string;
  errorMessage: string;
  filePath: string | null;
  lineNumber: number | null;
  context: Record<string, any>;
  analysis: {
    problem: string;
    rootCause: string;
    evidence: string[];
  };
  solution: {
    summary: string;
    steps: string[];
    codeChange: {
      file: string | null;
      lineNumber: number | null;
      before: string | null;
      after: string | null;
      explanation: string;
    } | null;
    verification: string[];
    alternatives?: Array<{
      version?: string;
      approach?: string;
      code?: string;
      pros: string;
      cons: string;
      migrationRequired?: boolean;
      note?: string;
    }>;
  };
  confidence: number;
  tags: string[];
}

export interface FewShotCategory {
  description: string;
  examples: FewShotExample[];
}

export interface FewShotDatabase {
  version: string;
  lastUpdated: string;
  description: string;
  categories: Record<string, FewShotCategory>;
}

export class FewShotExampleService {
  private database: FewShotDatabase | null = null;
  private examplesPath: string;

  constructor() {
    this.examplesPath = path.join(__dirname, '../knowledge/few-shot-examples.json');
  }

  /**
   * Load few-shot examples database from JSON file
   */
  public async loadDatabase(): Promise<void> {
    try {
      const content = await fs.promises.readFile(this.examplesPath, 'utf-8');
      this.database = JSON.parse(content);
      console.log(`Loaded ${this.getTotalExampleCount()} few-shot examples (v${this.database?.version})`);
    } catch (error) {
      console.error('Failed to load few-shot examples database:', error);
      throw new Error('Few-shot examples database not available');
    }
  }

  /**
   * Get total number of examples across all categories
   */
  public getTotalExampleCount(): number {
    if (!this.database) return 0;
    return Object.values(this.database.categories).reduce(
      (sum, category) => sum + category.examples.length,
      0
    );
  }

  /**
   * Find most relevant examples for given error
   * 
   * @param error - Parsed error to find examples for
   * @param maxExamples - Maximum number of examples to return (default: 3)
   * @returns Array of relevant examples, sorted by relevance
   */
  public async findRelevantExamples(
    error: ParsedError,
    maxExamples: number = 3
  ): Promise<FewShotExample[]> {
    if (!this.database) {
      await this.loadDatabase();
    }

    if (!this.database) {
      return [];
    }

    // 1. Determine error category from type
    const category = this.getCategoryFromErrorType(error.type);
    if (!category || !this.database.categories[category]) {
      console.warn(`No few-shot examples found for error type: ${error.type}`);
      return [];
    }

    // 2. Get all examples from category
    const categoryExamples = this.database.categories[category].examples;

    // 3. Score and rank examples by relevance
    const scoredExamples = categoryExamples.map(example => ({
      example,
      score: this.calculateRelevanceScore(error, example)
    }));

    // 4. Sort by score (highest first) and take top N
    scoredExamples.sort((a, b) => b.score - a.score);
    
    return scoredExamples
      .slice(0, maxExamples)
      .map(scored => scored.example);
  }

  /**
   * Get category name from error type
   * Maps error types to few-shot example categories
   */
  private getCategoryFromErrorType(errorType: string): string | null {
    const typeMap: Record<string, string> = {
      // Gradle errors
      'GRADLE_DEPENDENCY': 'gradle',
      'GRADLE_COMPATIBILITY': 'gradle',
      'GRADLE_PLUGIN': 'gradle',
      'GRADLE_REPOSITORY': 'gradle',
      'GRADLE_CACHE': 'gradle',
      'GRADLE_MANIFEST': 'gradle',
      'GRADLE_R8': 'gradle',
      'GRADLE_NATIVE': 'gradle',
      'GRADLE_MEMORY': 'gradle',
      'GRADLE_CATALOG': 'gradle',
      'GRADLE_BUILD_TYPE': 'gradle',
      'GRADLE_CONFIG_CACHE': 'gradle',
      
      // Kotlin errors
      'KOTLIN_NPE': 'kotlin',
      'KOTLIN_TYPE_MISMATCH': 'kotlin',
      'KOTLIN_LATEINIT': 'kotlin',
      'KOTLIN_COROUTINE': 'kotlin',
      
      // Compose errors
      'COMPOSE_API_BREAKAGE': 'compose',
      'COMPOSE_RECOMPOSITION': 'compose',
      'COMPOSE_STATE': 'compose',
      
      // XML errors
      'XML_INFLATION': 'xml',
      'XML_ATTRIBUTE': 'xml',
      
      // Manifest errors
      'MANIFEST_PERMISSION': 'manifest',
      'MANIFEST_COMPONENT': 'manifest',
      'MANIFEST_MERGE': 'manifest',
    };

    return typeMap[errorType] || null;
  }

  /**
   * Calculate relevance score between error and example
   * 
   * Scoring factors:
   * - Exact error type match: +50 points
   * - Error message similarity: +30 points
   * - File path similarity: +10 points
   * - Tag overlap: +10 points
   * 
   * @returns Score from 0-100
   */
  private calculateRelevanceScore(error: ParsedError, example: FewShotExample): number {
    let score = 0;

    // 1. Error type match (most important)
    if (error.type === example.errorType) {
      score += 50;
    }

    // 2. Error message similarity (keyword matching)
    if (error.message && example.errorMessage) {
      const errorKeywords = this.extractKeywords(error.message);
      const exampleKeywords = this.extractKeywords(example.errorMessage);
      const commonKeywords = errorKeywords.filter(k => exampleKeywords.includes(k));
      score += Math.min(30, commonKeywords.length * 5);
    }

    // 3. File path similarity
    if (error.filePath && example.filePath) {
      const errorFileName = path.basename(error.filePath);
      const exampleFileName = path.basename(example.filePath);
      if (errorFileName.includes(exampleFileName) || exampleFileName.includes(errorFileName)) {
        score += 10;
      }
    }

    // 4. Tag overlap (context matching)
    const errorTags = this.extractErrorTags(error);
    const commonTags = errorTags.filter(t => example.tags.includes(t));
    score += Math.min(10, commonTags.length * 2);

    return Math.min(100, score);
  }

  /**
   * Extract keywords from error message
   * Removes common words and focuses on technical terms
   */
  private extractKeywords(message: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were', 'be', 'been', 'being']);
    
    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Extract tags from error context
   */
  private extractErrorTags(error: ParsedError): string[] {
    const tags: string[] = [];
    
    // Add file extension as tag
    if (error.filePath) {
      const ext = path.extname(error.filePath).toLowerCase();
      if (ext === '.kt') tags.push('kotlin');
      if (ext === '.xml') tags.push('xml');
      if (ext === '.gradle' || ext === '.kts') tags.push('gradle');
    }

    // Add error type components as tags
    if (error.type) {
      const typeParts = error.type.toLowerCase().split('_');
      tags.push(...typeParts);
    }

    return tags;
  }

  /**
   * Format examples for LLM prompt
   * Creates human-readable representation of examples
   */
  public formatExamplesForPrompt(examples: FewShotExample[]): string {
    if (examples.length === 0) {
      return '';
    }

    const formatted = examples.map((example, index) => {
      const parts: string[] = [
        `\n### Example ${index + 1}: ${example.title}`,
        `**Error Type:** ${example.errorType}`,
        `**Error Message:** ${example.errorMessage}`,
        '',
        '**Analysis:**',
        `- Problem: ${example.analysis.problem}`,
        `- Root Cause: ${example.analysis.rootCause}`,
        `- Evidence: ${example.analysis.evidence.map(e => `\n  - ${e}`).join('')}`,
        '',
        '**Solution:**',
        `Summary: ${example.solution.summary}`,
        '',
        'Steps:',
        ...example.solution.steps.map((step, i) => `${i + 1}. ${step}`),
      ];

      // Add code change if available
      if (example.solution.codeChange) {
        const change = example.solution.codeChange;
        parts.push(
          '',
          `**Code Change (${change.file}${change.lineNumber ? ` line ${change.lineNumber}` : ''}):**`,
          '',
          'Before:',
          '```',
          change.before || 'N/A',
          '```',
          '',
          'After:',
          '```',
          change.after || 'N/A',
          '```',
          '',
          `Explanation: ${change.explanation}`
        );
      }

      // Add verification steps
      parts.push(
        '',
        '**Verification:**',
        ...example.solution.verification.map((step, i) => `${i + 1}. ${step}`)
      );

      // Add confidence
      parts.push('', `**Confidence:** ${example.confidence}%`);

      return parts.join('\n');
    });

    return [
      '\n## 📚 Similar Cases from Knowledge Base',
      '',
      'Here are relevant examples of similar errors and their solutions:',
      '',
      ...formatted
    ].join('\n');
  }

  /**
   * Get all examples from a specific category
   */
  public getExamplesByCategory(category: string): FewShotExample[] {
    if (!this.database || !this.database.categories[category]) {
      return [];
    }
    return this.database.categories[category].examples;
  }

  /**
   * Get example by ID
   */
  public getExampleById(id: string): FewShotExample | null {
    if (!this.database) {
      return null;
    }

    for (const category of Object.values(this.database.categories)) {
      const example = category.examples.find(ex => ex.id === id);
      if (example) {
        return example;
      }
    }

    return null;
  }

  /**
   * Get database statistics
   */
  public getStatistics(): {
    version: string;
    lastUpdated: string;
    totalExamples: number;
    byCategory: Record<string, number>;
    avgConfidence: number;
  } | null {
    if (!this.database) {
      return null;
    }

    const byCategory: Record<string, number> = {};
    let totalConfidence = 0;
    let totalExamples = 0;

    for (const [category, data] of Object.entries(this.database.categories)) {
      byCategory[category] = data.examples.length;
      totalExamples += data.examples.length;
      totalConfidence += data.examples.reduce((sum, ex) => sum + ex.confidence, 0);
    }

    return {
      version: this.database.version,
      lastUpdated: this.database.lastUpdated,
      totalExamples,
      byCategory,
      avgConfidence: totalExamples > 0 ? Math.round(totalConfidence / totalExamples) : 0
    };
  }
}

// Singleton instance
let fewShotService: FewShotExampleService | null = null;

/**
 * Get or create singleton instance of FewShotExampleService
 */
export function getFewShotService(): FewShotExampleService {
  if (!fewShotService) {
    fewShotService = new FewShotExampleService();
  }
  return fewShotService;
}
