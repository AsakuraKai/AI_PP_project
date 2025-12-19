/**
 * Performance monitoring and metrics collection for RCA analysis.
 * Tracks latency per component (parser, LLM, tools, DB) and exports metrics.
 * 
 * @example
 * ```typescript
 * const tracker = new PerformanceTracker();
 * 
 * const stopTotal = tracker.startTimer('total_analysis');
 * // ... perform analysis
 * stopTotal();
 * 
 * const stats = tracker.getStats('total_analysis');
 * console.log(`Mean: ${stats.mean}ms, p50: ${stats.p50}ms, p90: ${stats.p90}ms`);
 * 
 * const metrics = tracker.exportMetrics();
 * fs.writeFileSync('metrics.json', JSON.stringify(metrics, null, 2));
 * ```
 */

export interface Stats {
  p50: number;
  p90: number;
  p99: number;
  mean: number;
  count: number;
  min: number;
  max: number;
}

export interface MetricsExport {
  timestamp: number;
  operations: Record<string, Stats>;
  summary: {
    totalOperations: number;
    totalTime: number;
    averageTime: number;
  };
}

export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  private startTime: number = Date.now();
  
  /**
   * Start a timer for an operation.
   * Returns a function that stops the timer and records the duration.
   * 
   * @param operation - Name of the operation to track
   * @returns Function to stop the timer
   * 
   * @example
   * ```typescript
   * const stop = tracker.startTimer('llm_inference');
   * await llm.generate(prompt);
   * stop();
   * ```
   */
  startTimer(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration);
    };
  }
  
  /**
   * Record a metric value manually.
   * 
   * @param operation - Name of the operation
   * @param duration - Duration in milliseconds
   */
  recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }
  
  /**
   * Get statistics for a specific operation.
   * 
   * @param operation - Name of the operation
   * @returns Statistics object with percentiles and mean
   */
  getStats(operation: string): Stats {
    const values = this.metrics.get(operation) || [];
    if (values.length === 0) {
      return { p50: 0, p90: 0, p99: 0, mean: 0, count: 0, min: 0, max: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      p50: this.percentile(sorted, 0.5),
      p90: this.percentile(sorted, 0.9),
      p99: this.percentile(sorted, 0.99),
      mean: sum / values.length,
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }
  
  /**
   * Calculate percentile from sorted array.
   * Uses linear interpolation for more accurate results.
   * 
   * @param sorted - Sorted array of values
   * @param p - Percentile (0-1)
   * @returns Percentile value
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];
    
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
  
  /**
   * Get all tracked operations.
   * 
   * @returns Array of operation names
   */
  getOperations(): string[] {
    return Array.from(this.metrics.keys());
  }
  
  /**
   * Export all metrics to JSON-serializable format.
   * 
   * @returns Metrics export object
   */
  exportMetrics(): MetricsExport {
    const operations: Record<string, Stats> = {};
    let totalOps = 0;
    let totalTime = 0;
    
    for (const [operation, values] of this.metrics.entries()) {
      operations[operation] = this.getStats(operation);
      totalOps += values.length;
      totalTime += values.reduce((a, b) => a + b, 0);
    }
    
    return {
      timestamp: Date.now(),
      operations,
      summary: {
        totalOperations: totalOps,
        totalTime,
        averageTime: totalOps > 0 ? totalTime / totalOps : 0,
      },
    };
  }
  
  /**
   * Clear all recorded metrics.
   */
  clear(): void {
    this.metrics.clear();
    this.startTime = Date.now();
  }
  
  /**
   * Get total elapsed time since tracker creation.
   * 
   * @returns Elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
  
  /**
   * Print formatted metrics to console.
   */
  printMetrics(): void {
    console.log('\n📊 Performance Metrics');
    console.log('='.repeat(80));
    
    const metrics = this.exportMetrics();
    
    console.log(`\n⏱️  Total Time: ${metrics.summary.totalTime.toFixed(2)}ms`);
    console.log(`📈 Total Operations: ${metrics.summary.totalOperations}`);
    console.log(`⌀  Average Time: ${metrics.summary.averageTime.toFixed(2)}ms`);
    
    console.log('\n📋 Operation Breakdown:');
    console.log('-'.repeat(80));
    console.log(
      'Operation'.padEnd(30) +
      'Mean'.padEnd(12) +
      'p50'.padEnd(12) +
      'p90'.padEnd(12) +
      'p99'.padEnd(12) +
      'Count'
    );
    console.log('-'.repeat(80));
    
    for (const [operation, stats] of Object.entries(metrics.operations)) {
      console.log(
        operation.padEnd(30) +
        `${stats.mean.toFixed(2)}ms`.padEnd(12) +
        `${stats.p50.toFixed(2)}ms`.padEnd(12) +
        `${stats.p90.toFixed(2)}ms`.padEnd(12) +
        `${stats.p99.toFixed(2)}ms`.padEnd(12) +
        stats.count
      );
    }
    
    console.log('='.repeat(80) + '\n');
  }
  
  /**
   * Get metrics for operations matching a pattern.
   * 
   * @param pattern - Regex pattern to match operation names
   * @returns Array of matching stats with operation names
   */
  getMetricsByPattern(pattern: RegExp): Array<{ operation: string; stats: Stats }> {
    const matches: Array<{ operation: string; stats: Stats }> = [];
    
    for (const operation of this.getOperations()) {
      if (pattern.test(operation)) {
        matches.push({
          operation,
          stats: this.getStats(operation),
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Get slowest operations.
   * 
   * @param limit - Number of operations to return
   * @returns Array of slowest operations with stats
   */
  getSlowestOperations(limit: number = 5): Array<{ operation: string; stats: Stats }> {
    const allOps = this.getOperations().map((op) => ({
      operation: op,
      stats: this.getStats(op),
    }));
    
    return allOps
      .sort((a, b) => b.stats.mean - a.stats.mean)
      .slice(0, limit);
  }
}
