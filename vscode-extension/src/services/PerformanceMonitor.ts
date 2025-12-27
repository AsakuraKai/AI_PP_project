/**
 * Performance Monitor
 * Tracks load times, memory usage, and performance metrics
 */

import * as vscode from 'vscode';

export interface PerformanceMetrics {
  panelLoadTime: number;
  analysisStartTime: number;
  errorQueueRenderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: number;
}

export interface PerformanceThreshold {
  panelLoad: number; // Target: <100ms
  analysisStart: number; // Target: <50ms
  errorQueueRender: number; // Target: <200ms
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private timers: Map<string, number> = new Map();
  private thresholds: PerformanceThreshold = {
    panelLoad: 100,
    analysisStart: 50,
    errorQueueRender: 200
  };

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start a performance timer
   */
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * End a performance timer and return duration
   */
  endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);
    
    // Log warning if threshold exceeded
    this.checkThreshold(label, duration);
    
    return duration;
  }

  /**
   * Check if duration exceeds threshold
   */
  private checkThreshold(label: string, duration: number): void {
    let threshold: number | undefined;
    
    if (label.includes('panel-load')) {
      threshold = this.thresholds.panelLoad;
    } else if (label.includes('analysis-start')) {
      threshold = this.thresholds.analysisStart;
    } else if (label.includes('error-queue')) {
      threshold = this.thresholds.errorQueueRender;
    }

    if (threshold && duration > threshold) {
      console.warn(
        `Performance threshold exceeded: ${label} took ${duration}ms (threshold: ${threshold}ms)`
      );
    }
  }

  /**
   * Record complete metrics snapshot
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    const fullMetrics: PerformanceMetrics = {
      panelLoadTime: metrics.panelLoadTime || 0,
      analysisStartTime: metrics.analysisStartTime || 0,
      errorQueueRenderTime: metrics.errorQueueRenderTime || 0,
      memoryUsage: metrics.memoryUsage || this.getMemoryUsage(),
      cpuUsage: metrics.cpuUsage || 0,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetrics);
    
    // Keep only last 100 measurements
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number {
    try {
      if (process.memoryUsage) {
        const usage = process.memoryUsage();
        return Math.round(usage.heapUsed / 1024 / 1024); // Convert to MB
      }
    } catch (error) {
      // Not available in all environments
    }
    return 0;
  }

  /**
   * Get average metrics over time
   */
  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;

    const sum = this.metrics.reduce(
      (acc, m) => ({
        panelLoadTime: acc.panelLoadTime + m.panelLoadTime,
        analysisStartTime: acc.analysisStartTime + m.analysisStartTime,
        errorQueueRenderTime: acc.errorQueueRenderTime + m.errorQueueRenderTime,
        memoryUsage: acc.memoryUsage + m.memoryUsage,
        cpuUsage: acc.cpuUsage + m.cpuUsage,
        timestamp: 0
      }),
      {
        panelLoadTime: 0,
        analysisStartTime: 0,
        errorQueueRenderTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        timestamp: 0
      }
    );

    const count = this.metrics.length;
    return {
      panelLoadTime: Math.round(sum.panelLoadTime / count),
      analysisStartTime: Math.round(sum.analysisStartTime / count),
      errorQueueRenderTime: Math.round(sum.errorQueueRenderTime / count),
      memoryUsage: Math.round(sum.memoryUsage / count),
      cpuUsage: Math.round(sum.cpuUsage / count),
      timestamp: Date.now()
    };
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * Check if performance meets targets
   */
  isPerformanceAcceptable(): {
    acceptable: boolean;
    issues: string[];
  } {
    const avg = this.getAverageMetrics();
    if (!avg) {
      return { acceptable: true, issues: [] };
    }

    const issues: string[] = [];

    if (avg.panelLoadTime > this.thresholds.panelLoad) {
      issues.push(
        `Panel load time (${avg.panelLoadTime}ms) exceeds target (${this.thresholds.panelLoad}ms)`
      );
    }

    if (avg.analysisStartTime > this.thresholds.analysisStart) {
      issues.push(
        `Analysis start time (${avg.analysisStartTime}ms) exceeds target (${this.thresholds.analysisStart}ms)`
      );
    }

    if (avg.errorQueueRenderTime > this.thresholds.errorQueueRender) {
      issues.push(
        `Error queue render time (${avg.errorQueueRenderTime}ms) exceeds target (${this.thresholds.errorQueueRender}ms)`
      );
    }

    if (avg.memoryUsage > 100) {
      // 100MB threshold
      issues.push(`Memory usage (${avg.memoryUsage}MB) is high`);
    }

    return {
      acceptable: issues.length === 0,
      issues
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const avg = this.getAverageMetrics();
    const latest = this.getLatestMetrics();
    const status = this.isPerformanceAcceptable();

    if (!avg || !latest) {
      return 'No performance data available';
    }

    return `
RCA Agent Performance Report
============================

Latest Metrics:
- Panel Load: ${latest.panelLoadTime}ms (target: <${this.thresholds.panelLoad}ms)
- Analysis Start: ${latest.analysisStartTime}ms (target: <${this.thresholds.analysisStart}ms)
- Error Queue Render: ${latest.errorQueueRenderTime}ms (target: <${this.thresholds.errorQueueRender}ms)
- Memory Usage: ${latest.memoryUsage}MB

Average Metrics (last ${this.metrics.length} measurements):
- Panel Load: ${avg.panelLoadTime}ms
- Analysis Start: ${avg.analysisStartTime}ms
- Error Queue Render: ${avg.errorQueueRenderTime}ms
- Memory Usage: ${avg.memoryUsage}MB

Status: ${status.acceptable ? '✅ ACCEPTABLE' : '⚠️ NEEDS IMPROVEMENT'}
${status.issues.length > 0 ? '\nIssues:\n' + status.issues.map(i => `- ${i}`).join('\n') : ''}
    `.trim();
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Debounce a function for performance
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    };
  }

  /**
   * Throttle a function for performance
   */
  static throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
}
