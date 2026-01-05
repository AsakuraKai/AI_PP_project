/**
 * Few-Shot Example Service
 * 
 * Loads and retrieves relevant few-shot learning examples for RCA agent.
 * Uses semantic similarity to find most relevant examples for given error.
 * ENHANCED (Chunk 9): Supports category-based example selection
 */

import * as fs from 'fs';
import * as path from 'path';
import { ParsedError } from '../types';
import { ErrorCategory } from '../agent/ErrorClassifier';

// Dynamic import to avoid circular dependencies
const { ALL_CATEGORY_EXAMPLES } = require('./few-shot-examples/index');

export interface FewShotExample {
  id: string;
  title?: string;
  errorType: string;
  error?: string; // Chunk 9: Alias for errorMessage
  errorMessage?: string;
  filePath?: string | null;
  lineNumber?: number | null;
  context?: Record<string, any>;
  diagnosis?: { // Chunk 9: Alias for analysis
    problem: string;
    rootCause: string;
    evidence: string;
    confidence: number;
  };
  analysis?: {
    problem: string;
    rootCause: string;
    evidence: string[];
  };
  solution: {
    summary: string;
    specificFix?: string; // Chunk 9: Detailed fix description
    fileIdentification?: string; // Chunk 9: Exact file path
    codeExamples?: Array<{ before: string; after: string; }>; // Chunk 9: Code snippets
    verificationSteps?: string[]; // Chunk 9: How to verify the fix
    steps?: string[]; // Optional: Step-by-step instructions
    codeChange?: { // Optional: Code change details
      file: string | null;
      lineNumber: number | null;
      before: string | null;
      after: string | null;
      explanation: string;
    } | null;
    verification?: string[]; // Optional: Verification steps
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
  confidence?: number; // Optional
  tags?: string[]; // Optional
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
  private allExamples: FewShotExample[] = []; // Combined examples from JSON + TS
  private loadPromise: Promise<void> | null = null; // Track loading state
  private isLoaded: boolean = false; // Track if successfully loaded

  constructor() {
    this.examplesPath = path.join(__dirname, '../knowledge/few-shot-examples.json');
  }

  /**
   * Load few-shot examples database from JSON file and TypeScript examples
   * THREAD-SAFE: Multiple concurrent calls will share the same loading promise
   * IDEMPOTENT: Subsequent calls after successful load return immediately
   */
  public async loadDatabase(): Promise<void> {
    // If already loaded successfully, return immediately
    if (this.isLoaded && this.database) {
      return;
    }

    // If currently loading, wait for existing load to complete
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start new load
    this.loadPromise = this._loadDatabaseInternal();
    
    try {
      await this.loadPromise;
    } finally {
      // Clear promise after completion (success or failure)
      this.loadPromise = null;
    }
  }

  /**
   * Internal database loading implementation
   * Should only be called through loadDatabase()
   */
  private async _loadDatabaseInternal(): Promise<void> {
    try {
      console.log('🔄 Loading few-shot database...');
      
      // 1. Load JSON database (version/dependency examples)
      const content = await fs.promises.readFile(this.examplesPath, 'utf-8');
      this.database = JSON.parse(content);
      
      // Count JSON examples safely
      const jsonExampleCount = this.database && this.database.categories
        ? Object.values(this.database.categories).reduce((sum, cat) => sum + cat.examples.length, 0)
        : 0;
      
      // 2. Load TypeScript examples directly (no compilation needed)
      const tsExamples = ALL_CATEGORY_EXAMPLES || [];
      const tsExampleCount = tsExamples.length;
      
      console.log(`[FewShotService] TS examples loaded: ${tsExampleCount} examples`);
      
      if (!this.database) {
        throw new Error('Database structure invalid');
      }
      
      // 3. Merge TypeScript examples into database categories
      const categoryMap: Record<string, string> = {
        'manifest_permission': 'manifest',
        'MANIFEST_PERMISSION': 'manifest',
        'build_cache': 'cache',
        'BUILD_CACHE': 'cache',
        'proguard_minification': 'proguard',
        'PROGUARD_MINIFICATION': 'proguard',
        'navigation_routing': 'navigation',
        'NAVIGATION_ROUTING': 'navigation',
        'network_connectivity': 'network',
        'NETWORK_CONNECTIVITY': 'network',
        'kotlin_npe': 'kotlin',
        'KOTLIN_NPE': 'kotlin',
        'compose_deprecation': 'compose',
        'COMPOSE_DEPRECATION': 'compose',
        'xml_layout': 'xml',
        'XML_LAYOUT': 'xml',
      };
      
      for (const example of tsExamples) {
        const dbCategory = categoryMap[example.errorType] || example.errorType.toLowerCase();
        
        if (!this.database.categories[dbCategory]) {
          this.database.categories[dbCategory] = {
            description: `${dbCategory} error examples`,
            examples: []
          };
        }
        
        this.database.categories[dbCategory].examples.push(example);
      }
      
      // 4. Store combined examples
      this.allExamples = [
        ...this.getAllExamplesFromDatabase(),
        ...tsExamples
      ];
      
      const totalCount = jsonExampleCount + tsExampleCount;
      this.isLoaded = true; // Mark as successfully loaded
      
      console.log(`✅ Loaded ${totalCount} few-shot examples (${jsonExampleCount} JSON + ${tsExampleCount} TS) v${this.database?.version}`);
      console.log(`   Available categories: ${Object.keys(this.database.categories).join(', ')}`);
      console.log(`   Category counts:`, Object.fromEntries(
        Object.entries(this.database.categories).map(([k, v]) => [k, v.examples.length])
      ));
      
    } catch (error) {
      this.isLoaded = false;
      this.database = null;
      this.allExamples = [];
      
      // In test environment, it's OK if few-shot examples aren't available
      if (!process.env.JEST_WORKER_ID) {
        console.error('Failed to load few-shot examples database:', error);
        console.warn('\u26a0\ufe0f  Running without few-shot examples');
      }
      
      // Don't throw - allow tests to continue without few-shot examples
    }
  }
  
  /**
   * Get all examples from database (helper method)
   */
  private getAllExamplesFromDatabase(): FewShotExample[] {
    if (!this.database) return [];
    return Object.values(this.database.categories).flatMap(cat => cat.examples);
  }

  /**
   * Get total number of examples across all categories
   * Chunk 9: Returns combined count (JSON + TypeScript)
   */
  public getTotalExampleCount(): number {
    if (this.allExamples.length > 0) {
      return this.allExamples.length; // Return combined count if available
    }
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
    console.log(`[FewShotService] Looking for examples:
  - Error type: ${error.type}
  - Mapped category: ${category || 'null'}
  - Database loaded: ${!!this.database}
  - Available categories: ${this.database ? Object.keys(this.database.categories).join(', ') : 'N/A'}`);
    
    if (!category || !this.database.categories[category]) {
      console.warn(`No few-shot examples found for error type: ${error.type}`);
      console.warn(`  Mapped category: ${category || 'null'}`);
      console.warn(`  Available categories: ${Object.keys(this.database.categories).join(', ')}`);
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
   * Find examples by error category (Chunk 9 - NEW METHOD)
   * 
   * @param category - Error category from ErrorClassifier
   * @param maxExamples - Maximum number of examples to return (default: 3)
   * @returns Array of examples for the category
   */
  public findExamplesByCategory(
    category: ErrorCategory,
    maxExamples: number = 3
  ): FewShotExample[] {
    if (!this.database) {
      console.warn('Database not loaded, cannot find examples by category');
      return [];
    }
    
    // Map category to database category key
    const categoryMap: Record<string, string> = {
      'manifest_permission': 'manifest',
      'manifest-permission': 'manifest',
      'build_cache': 'cache',
      'gradle-cache': 'cache',
      'gradle_cache': 'cache',
      'proguard_minification': 'proguard',
      'proguard-minification': 'proguard',
      'proguard': 'proguard',
      'navigation_routing': 'navigation',
      'navigation-routing': 'navigation',
      'navigation': 'navigation',
      'network_connectivity': 'network',
      'gradle-network': 'network',
      'gradle_network': 'network',
      'version_dependency': 'version_dependency',
      'gradle-dependency': 'version_dependency',
      'kotlin-npe': 'kotlin',
      'kotlin_npe': 'kotlin',
      'compose-deprecation': 'compose',
      'compose_deprecation': 'compose',
      'xml-layout': 'xml',
      'xml_layout': 'xml',
      'unknown': 'gradle', // Fallback to generic Gradle examples
    };
    
    const dbCategory = categoryMap[category] || 'gradle';
    const examples = this.database.categories[dbCategory]?.examples || [];
    
    if (examples.length === 0) {
      console.warn(`No few-shot examples for category: ${category} (mapped to ${dbCategory})`);
      return [];
    }
    
    // Return up to maxExamples, selecting diverse examples if possible
    return examples.slice(0, maxExamples);
  }

  /**
   * Get category name from error type
   * Maps error types to few-shot example categories
   * ENHANCED: Now supports kebab-case, snake_case, and UPPER_SNAKE_CASE formats
   */
  private getCategoryFromErrorType(errorType: string): string | null {
    // Normalize the errorType to UPPER_SNAKE_CASE for lookup
    const normalizedType = errorType
      .replace(/-/g, '_')  // Replace hyphens with underscores
      .toUpperCase();      // Convert to uppercase
    
    const typeMap: Record<string, string> = {
      // Gradle errors (support all formats)
      'GRADLE_DEPENDENCY': 'gradle',
      'GRADLE_COMPATIBILITY': 'gradle',
      'GRADLE_PLUGIN': 'gradle',
      'GRADLE_REPOSITORY': 'gradle',
      'GRADLE_CACHE': 'cache',      // Map to cache category
      'GRADLE-CACHE': 'cache',      // Support hyphenated version
      'GRADLE_NETWORK': 'network',  // Map to network category
      'GRADLE-NETWORK': 'network',  // Support hyphenated version
      'GRADLE_MANIFEST': 'gradle',
      'GRADLE_R8': 'gradle',
      'GRADLE_NATIVE': 'gradle',
      'GRADLE_MEMORY': 'gradle',
      'GRADLE_CATALOG': 'gradle',
      'GRADLE_BUILD_TYPE': 'gradle',
      'GRADLE_CONFIG_CACHE': 'gradle',
      
      // Kotlin errors
      'KOTLIN_NPE': 'kotlin',
      'KOTLIN-NPE': 'kotlin',       // Support hyphenated version
      'KOTLIN_TYPE_MISMATCH': 'kotlin',
      'KOTLIN_LATEINIT': 'kotlin',
      'KOTLIN_COROUTINE': 'kotlin',
      
      // Compose errors
      'COMPOSE_API_BREAKAGE': 'compose',
      'COMPOSE_DEPRECATION': 'compose',  // NEW: Support compose-deprecation
      'COMPOSE-DEPRECATION': 'compose',  // Support hyphenated version
      'COMPOSE_RECOMPOSITION': 'compose',
      'COMPOSE_STATE': 'compose',
      
      // XML errors
      'XML_INFLATION': 'xml',
      'XML_ATTRIBUTE': 'xml',
      'XML_LAYOUT': 'xml',  // NEW: Support xml-layout
      'XML-LAYOUT': 'xml',  // Support hyphenated version
      
      // Manifest errors
      'MANIFEST_PERMISSION': 'manifest',
      'MANIFEST-PERMISSION': 'manifest',  // Support hyphenated version
      'MANIFEST_COMPONENT': 'manifest',
      'MANIFEST_MERGE': 'manifest',
      
      // ProGuard errors
      'PROGUARD': 'proguard',
      'PROGUARD_MINIFICATION': 'proguard',
      'PROGUARD-MINIFICATION': 'proguard',  // Support hyphenated version
      
      // Navigation errors
      'NAVIGATION': 'navigation',
      'NAVIGATION_ROUTING': 'navigation',
      'NAVIGATION-ROUTING': 'navigation',  // Support hyphenated version
    };

    const mappedCategory = typeMap[normalizedType];
    
    if (!mappedCategory) {
      console.warn(`No category mapping for error type: ${errorType} (normalized: ${normalizedType})`);
    }
    
    return mappedCategory || null;
  }

  /**
   * Calculate relevance score between error and example
   * 
   * Scoring factors (Phase 1 Enhanced):
   * - Exact error type match: +40 points (30%)
   * - Error message similarity (keywords): +35 points (25%)
   * - File path similarity: +20 points (15%)
   * - Historical success rate: +25 points (20%)
   * - Example recency: +10 points (10%)
   * - Tag overlap: +10 bonus points
   * 
   * @returns Score from 0-140 (100 base + 10 bonus + 30 quality metrics)
   */
  private calculateRelevanceScore(error: ParsedError, example: FewShotExample): number {
    let score = 0;

    // 1. Error type match (30% weight - most important)
    if (error.type === example.errorType) {
      score += 40;
    } else if (this.areRelatedErrorTypes(error.type, example.errorType)) {
      score += 20; // Partial match for related types
    }

    // 2. Error message similarity (25% weight - keyword matching)
    if (error.message && (example.errorMessage || example.error)) {
      const exampleMsg = example.errorMessage || example.error || '';
      const errorKeywords = this.extractKeywords(error.message);
      const exampleKeywords = this.extractKeywords(exampleMsg);
      const commonKeywords = errorKeywords.filter(k => exampleKeywords.includes(k));
      
      // More keywords = higher score, up to 35 points
      const keywordScore = Math.min(35, commonKeywords.length * 5);
      score += keywordScore;
    }

    // 3. File path similarity (15% weight)
    if (error.filePath && example.filePath) {
      const errorFileName = path.basename(error.filePath);
      const exampleFileName = path.basename(example.filePath);
      
      // Exact file match
      if (errorFileName === exampleFileName) {
        score += 20;
      } 
      // Partial match (e.g., build.gradle vs app/build.gradle)
      else if (errorFileName.includes(exampleFileName) || exampleFileName.includes(errorFileName)) {
        score += 10;
      }
      // Same file type (e.g., both .kt files)
      else if (path.extname(errorFileName) === path.extname(exampleFileName)) {
        score += 5;
      }
    }

    // 4. Historical success rate (20% weight - Phase 1 new)
    // Higher confidence examples are more likely to be helpful
    const confidenceScore = (example.confidence || 0.5) * 25; // 0-25 points
    score += confidenceScore;

    // 5. Example recency (10% weight - Phase 1 new)
    // Prefer more recent examples (newer patterns, versions)
    const recencyScore = this.calculateRecencyScore(example);
    score += recencyScore;

    // 6. Tag overlap (bonus points)
    if (example.tags && example.tags.length > 0) {
      const errorContext = this.extractContextKeywords(error);
      const tagMatches = example.tags.filter(tag => 
        errorContext.some(ctx => ctx.toLowerCase().includes(tag.toLowerCase()))
      );
      score += Math.min(10, tagMatches.length * 3);
    }

    return score;
    const errorTags = this.extractErrorTags(error);
    const commonTags = errorTags.filter(t => example.tags?.includes(t));
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
        `- Problem: ${example.analysis?.problem || example.diagnosis?.problem || 'N/A'}`,
        `- Root Cause: ${example.analysis?.rootCause || example.diagnosis?.rootCause || 'N/A'}`,
        `- Evidence: ${(example.analysis?.evidence || [example.diagnosis?.evidence || 'N/A']).map((e: any) => `\n  - ${e}`).join('')}`,
        '',
        '**Solution:**',
        `Summary: ${example.solution.summary}`,
        '',
        'Steps:',
        ...(example.solution.steps?.map((step, i) => `${i + 1}. ${step}`) || []),
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
        ...(example.solution.verification?.map((step, i) => `${i + 1}. ${step}`) || [])
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
   * Check if two error types are related (Phase 1 - NEW)
   * Helps with partial matching when exact type isn't available
   */
  private areRelatedErrorTypes(type1: string, type2: string): boolean {
    const relatedGroups = [
      ['GRADLE_DEPENDENCY', 'GRADLE_COMPATIBILITY', 'GRADLE_CATALOG'],
      ['KOTLIN_NPE', 'KOTLIN_LATEINIT', 'KOTLIN_TYPE_MISMATCH'],
      ['COMPOSE_API_BREAKAGE', 'COMPOSE_RECOMPOSITION', 'COMPOSE_STATE'],
      ['XML_INFLATION', 'XML_ATTRIBUTE'],
      ['MANIFEST_PERMISSION', 'MANIFEST_COMPONENT', 'MANIFEST_MERGE'],
    ];

    return relatedGroups.some(group => 
      group.includes(type1) && group.includes(type2)
    );
  }

  /**
   * Calculate recency score for example (Phase 1 - NEW)
   * Newer examples get higher scores (patterns evolve, versions update)
   */
  private calculateRecencyScore(example: FewShotExample): number {
    // If example has no date info, give neutral score
    if (!example.context?.createdAt && !example.context?.updatedAt) {
      return 5; // Neutral score
    }

    const dateStr = example.context?.updatedAt || example.context?.createdAt;
    if (!dateStr) return 5;

    try {
      const exampleDate = new Date(dateStr);
      const now = new Date();
      const ageInDays = (now.getTime() - exampleDate.getTime()) / (1000 * 60 * 60 * 24);

      // Scoring: newer = better, up to 10 points
      // < 30 days: 10 points
      // < 90 days: 8 points
      // < 180 days: 6 points
      // < 365 days: 4 points
      // > 365 days: 2 points
      if (ageInDays < 30) return 10;
      if (ageInDays < 90) return 8;
      if (ageInDays < 180) return 6;
      if (ageInDays < 365) return 4;
      return 2;
    } catch {
      return 5; // Neutral score if date parsing fails
    }
  }

  /**
   * Extract context keywords from error (Phase 1 - NEW)
   * Used for tag matching
   */
  private extractContextKeywords(error: ParsedError): string[] {
    const keywords: string[] = [];

    // From error message
    if (error.message) {
      keywords.push(...this.extractKeywords(error.message));
    }

    // From file path
    if (error.filePath) {
      const fileName = path.basename(error.filePath);
      keywords.push(fileName);
      
      // Add file extension
      const ext = path.extname(fileName).replace('.', '');
      if (ext) keywords.push(ext);
    }

    // From error type
    if (error.type) {
      keywords.push(...error.type.toLowerCase().split('_'));
    }

    return keywords;
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

    // Use allExamples for accurate count (includes both JSON and TS examples)
    const totalExamples = this.allExamples.length;
    
    const byCategory: Record<string, number> = {};
    let totalConfidence = 0;

    // Count by category from database structure
    for (const [category, data] of Object.entries(this.database.categories)) {
      byCategory[category] = data.examples.length;
    }
    
    // Calculate confidence from all examples
    for (const example of this.allExamples) {
      totalConfidence += example.confidence || 0;
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
