/**
 * ToolOrchestrator - Phase 5: Smart tool orchestration and parallel execution
 * 
 * Optimizes tool execution with:
 * - Parallel execution of independent tools
 * - Smart tool selection based on error category
 * - Result caching and deduplication
 * - Performance monitoring
 * 
 * @author Kai (Backend Developer)
 * @created January 5, 2026
 * @phase Phase 5: Backend Intelligence Polish
 */

import { Tool, ToolRegistry } from '../tools/ToolRegistry';
import { ParsedError } from '../types';
import { PerformanceTracker } from '../monitoring/PerformanceTracker';

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  result: any;
  executionTime: number;
  error?: string;
}

/**
 * Tool execution plan
 */
export interface ToolExecutionPlan {
  /** Tools to execute in parallel */
  parallelGroups: string[][];
  /** Estimated total execution time (ms) */
  estimatedTime: number;
  /** Reasoning for tool selection */
  reasoning: string;
}

/**
 * ToolOrchestrator for optimized tool execution
 */
export class ToolOrchestrator {
  private toolRegistry: ToolRegistry;
  private performanceTracker: PerformanceTracker;
  private resultCache: Map<string, any>;
  private cacheTimestamps: Map<string, number>;
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
    this.performanceTracker = new PerformanceTracker();
    this.resultCache = new Map();
    this.cacheTimestamps = new Map();
  }

  /**
   * Create optimized execution plan for error analysis
   * Phase 5: Smart tool selection based on error patterns
   */
  createExecutionPlan(error: ParsedError): ToolExecutionPlan {
    const selectedTools: string[] = [];
    const errorType = error.errorType?.toLowerCase() || '';
    const errorMessage = error.message.toLowerCase();

    // Always useful tools
    selectedTools.push('read_file'); // Get code context
    selectedTools.push('error_parser'); // Parse error details

    // Error-type specific tools
    if (errorType.includes('gradle') || errorMessage.includes('gradle')) {
      selectedTools.push('version_lookup', 'android_build');
    }

    if (errorType.includes('kotlin') || errorType.includes('npe')) {
      selectedTools.push('language_detector', 'semantic_search');
    }

    if (errorType.includes('dependency') || errorMessage.includes('could not find')) {
      selectedTools.push('version_lookup', 'dependency_graph');
    }

    if (errorType.includes('manifest') || errorMessage.includes('manifest')) {
      selectedTools.push('manifest_analyzer');
    }

    if (errorMessage.includes('deprecated') || errorMessage.includes('compose')) {
      selectedTools.push('android_docs_search', 'semantic_search');
    }

    // Organize into parallel groups
    // Group 1: Fast, independent reads
    const parallelGroup1 = ['read_file', 'error_parser', 'language_detector'].filter(t =>
      selectedTools.includes(t)
    );

    // Group 2: Version/dependency lookups (can be parallel)
    const parallelGroup2 = ['version_lookup', 'dependency_graph'].filter(t =>
      selectedTools.includes(t)
    );

    // Group 3: Analysis tools (depend on context)
    const parallelGroup3 = [
      'android_build',
      'manifest_analyzer',
      'android_docs_search',
      'semantic_search',
    ].filter(t => selectedTools.includes(t));

    const parallelGroups = [parallelGroup1, parallelGroup2, parallelGroup3].filter(
      g => g.length > 0
    );

    // Estimate execution time (rough approximation)
    const estimatedTime = parallelGroups.length * 500; // 500ms per group

    return {
      parallelGroups,
      estimatedTime,
      reasoning: `Selected ${selectedTools.length} tools for ${errorType} error, organized in ${parallelGroups.length} parallel groups`,
    };
  }

  /**
   * Execute tools in parallel according to plan
   * Phase 5: Parallel execution with error handling
   */
  async executePlan(
    plan: ToolExecutionPlan,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult[]> {
    const allResults: ToolExecutionResult[] = [];

    console.log(`[ToolOrchestrator] Executing ${plan.parallelGroups.length} parallel groups...`);

    for (const [groupIndex, toolGroup] of plan.parallelGroups.entries()) {
      console.log(
        `  Group ${groupIndex + 1}: [${toolGroup.join(', ')}] (parallel execution)`
      );

      // Execute all tools in this group in parallel
      const groupPromises = toolGroup.map(toolName =>
        this.executeToolWithCache(toolName, parameters)
      );

      const groupResults = await Promise.allSettled(groupPromises);

      // Process results
      groupResults.forEach((result, index) => {
        const toolName = toolGroup[index];

        if (result.status === 'fulfilled') {
          allResults.push(result.value);
          console.log(`    ✓ ${toolName}: ${result.value.executionTime}ms`);
        } else {
          allResults.push({
            toolName,
            success: false,
            result: null,
            executionTime: 0,
            error: result.reason?.message || 'Unknown error',
          });
          console.warn(`    ✗ ${toolName}: ${result.reason}`);
        }
      });
    }

    console.log(
      `[ToolOrchestrator] Completed ${allResults.length} tool executions`
    );
    return allResults;
  }

  /**
   * Execute single tool with caching
   * Phase 5: Result caching for duplicate calls
   */
  private async executeToolWithCache(
    toolName: string,
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    // Generate cache key
    const cacheKey = `${toolName}:${JSON.stringify(parameters)}`;

    // Check cache
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log(`    💾 ${toolName}: cache hit`);
      return {
        toolName,
        success: true,
        result: cached,
        executionTime: 0, // From cache
      };
    }

    // Execute tool
    const startTime = Date.now();
    const timer = this.performanceTracker.startTimer(`tool_${toolName}`);

    try {
      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found in registry`);
      }

      const result = await tool.execute(parameters);
      const executionTime = Date.now() - startTime;

      timer();

      // Cache successful results
      this.setCachedResult(cacheKey, result);

      return {
        toolName,
        success: true,
        result,
        executionTime,
      };
    } catch (error) {
      timer();

      return {
        toolName,
        success: false,
        result: null,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult(key: string): any | null {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return null;

    const now = Date.now();
    if (now - timestamp > this.CACHE_TTL) {
      // Cache expired
      this.resultCache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return this.resultCache.get(key) || null;
  }

  /**
   * Cache result
   */
  private setCachedResult(key: string, result: any): void {
    this.resultCache.set(key, result);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.resultCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return this.performanceTracker.getMetrics();
  }
}
