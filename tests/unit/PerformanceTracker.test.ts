import { PerformanceTracker } from '../../src/monitoring/PerformanceTracker';

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;
  
  beforeEach(() => {
    tracker = new PerformanceTracker();
  });
  
  describe('startTimer()', () => {
    it('should record metric when timer is stopped', () => {
      const stop = tracker.startTimer('test_operation');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10); // Wait ~10ms
      
      stop();
      
      const stats = tracker.getStats('test_operation');
      expect(stats.count).toBe(1);
      expect(stats.mean).toBeGreaterThanOrEqual(10);
    });
    
    it('should track multiple timers independently', () => {
      const stop1 = tracker.startTimer('operation_1');
      const stop2 = tracker.startTimer('operation_2');
      
      const start = Date.now();
      while (Date.now() - start < 5);
      stop1();
      
      while (Date.now() - start < 10);
      stop2();
      
      const stats1 = tracker.getStats('operation_1');
      const stats2 = tracker.getStats('operation_2');
      
      expect(stats1.count).toBe(1);
      expect(stats2.count).toBe(1);
      expect(stats2.mean).toBeGreaterThan(stats1.mean);
    });
  });
  
  describe('recordMetric()', () => {
    it('should record a metric value', () => {
      tracker.recordMetric('test_op', 100);
      
      const stats = tracker.getStats('test_op');
      expect(stats.count).toBe(1);
      expect(stats.mean).toBe(100);
    });
    
    it('should accumulate multiple recordings', () => {
      tracker.recordMetric('test_op', 100);
      tracker.recordMetric('test_op', 200);
      tracker.recordMetric('test_op', 300);
      
      const stats = tracker.getStats('test_op');
      expect(stats.count).toBe(3);
      expect(stats.mean).toBe(200);
    });
  });
  
  describe('getStats()', () => {
    it('should return zero stats for non-existent operation', () => {
      const stats = tracker.getStats('non_existent');
      
      expect(stats.count).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.p50).toBe(0);
      expect(stats.p90).toBe(0);
      expect(stats.p99).toBe(0);
    });
    
    it('should calculate mean correctly', () => {
      tracker.recordMetric('test', 10);
      tracker.recordMetric('test', 20);
      tracker.recordMetric('test', 30);
      
      const stats = tracker.getStats('test');
      expect(stats.mean).toBe(20);
    });
    
    it('should calculate p50 (median) correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      values.forEach((v) => tracker.recordMetric('test', v));
      
      const stats = tracker.getStats('test');
      expect(stats.p50).toBeCloseTo(5.5, 1);  // Median of 10 values is average of 5th and 6th
    });
    
    it('should calculate p90 correctly', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      values.forEach((v) => tracker.recordMetric('test', v));
      
      const stats = tracker.getStats('test');
      expect(stats.p90).toBeCloseTo(90, 0);
    });
    
    it('should calculate p99 correctly', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      values.forEach((v) => tracker.recordMetric('test', v));
      
      const stats = tracker.getStats('test');
      expect(stats.p99).toBeCloseTo(99, 0);
    });
    
    it('should track min and max values', () => {
      tracker.recordMetric('test', 50);
      tracker.recordMetric('test', 10);
      tracker.recordMetric('test', 100);
      tracker.recordMetric('test', 25);
      
      const stats = tracker.getStats('test');
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(100);
    });
  });
  
  describe('getOperations()', () => {
    it('should return empty array initially', () => {
      expect(tracker.getOperations()).toEqual([]);
    });
    
    it('should return all tracked operations', () => {
      tracker.recordMetric('op1', 100);
      tracker.recordMetric('op2', 200);
      tracker.recordMetric('op3', 300);
      
      const operations = tracker.getOperations();
      expect(operations).toHaveLength(3);
      expect(operations).toContain('op1');
      expect(operations).toContain('op2');
      expect(operations).toContain('op3');
    });
  });
  
  describe('exportMetrics()', () => {
    it('should export all metrics', () => {
      tracker.recordMetric('op1', 100);
      tracker.recordMetric('op1', 200);
      tracker.recordMetric('op2', 300);
      
      const exported = tracker.exportMetrics();
      
      expect(exported.timestamp).toBeGreaterThan(0);
      expect(exported.operations.op1).toBeDefined();
      expect(exported.operations.op1.count).toBe(2);
      expect(exported.operations.op2).toBeDefined();
      expect(exported.operations.op2.count).toBe(1);
      expect(exported.summary.totalOperations).toBe(3);
      expect(exported.summary.totalTime).toBe(600);
      expect(exported.summary.averageTime).toBe(200);
    });
    
    it('should handle empty metrics', () => {
      const exported = tracker.exportMetrics();
      
      expect(exported.operations).toEqual({});
      expect(exported.summary.totalOperations).toBe(0);
      expect(exported.summary.totalTime).toBe(0);
      expect(exported.summary.averageTime).toBe(0);
    });
  });
  
  describe('clear()', () => {
    it('should clear all metrics', () => {
      tracker.recordMetric('op1', 100);
      tracker.recordMetric('op2', 200);
      
      tracker.clear();
      
      expect(tracker.getOperations()).toEqual([]);
      const exported = tracker.exportMetrics();
      expect(exported.summary.totalOperations).toBe(0);
    });
    
    it('should reset elapsed time', () => {
      const elapsed1 = tracker.getElapsedTime();
      
      const start = Date.now();
      while (Date.now() - start < 50);
      
      tracker.clear();
      const elapsed2 = tracker.getElapsedTime();
      
      expect(elapsed2).toBeLessThan(elapsed1 + 50);
    });
  });
  
  describe('getElapsedTime()', () => {
    it('should return elapsed time since creation', () => {
      const start = Date.now();
      while (Date.now() - start < 20);
      
      const elapsed = tracker.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(20);
    });
  });
  
  describe('getMetricsByPattern()', () => {
    it('should return metrics matching regex pattern', () => {
      tracker.recordMetric('llm_inference_1', 100);
      tracker.recordMetric('llm_inference_2', 200);
      tracker.recordMetric('tool_execution', 300);
      
      const llmMetrics = tracker.getMetricsByPattern(/^llm_/);
      
      expect(llmMetrics).toHaveLength(2);
      expect(llmMetrics[0].operation).toMatch(/^llm_/);
      expect(llmMetrics[1].operation).toMatch(/^llm_/);
    });
    
    it('should return empty array if no matches', () => {
      tracker.recordMetric('op1', 100);
      
      const matches = tracker.getMetricsByPattern(/^xyz_/);
      expect(matches).toEqual([]);
    });
  });
  
  describe('getSlowestOperations()', () => {
    it('should return operations sorted by mean duration', () => {
      tracker.recordMetric('fast', 10);
      tracker.recordMetric('medium', 50);
      tracker.recordMetric('slow', 100);
      tracker.recordMetric('very_slow', 200);
      
      const slowest = tracker.getSlowestOperations(2);
      
      expect(slowest).toHaveLength(2);
      expect(slowest[0].operation).toBe('very_slow');
      expect(slowest[1].operation).toBe('slow');
    });
    
    it('should respect the limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordMetric(`op${i}`, i * 10);
      }
      
      const slowest = tracker.getSlowestOperations(3);
      expect(slowest).toHaveLength(3);
    });
    
    it('should handle empty metrics', () => {
      const slowest = tracker.getSlowestOperations();
      expect(slowest).toEqual([]);
    });
  });
  
  describe('printMetrics()', () => {
    it('should not throw when printing metrics', () => {
      tracker.recordMetric('op1', 100);
      tracker.recordMetric('op2', 200);
      
      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      expect(() => tracker.printMetrics()).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('integration scenarios', () => {
    it('should track complex analysis workflow', () => {
      // Simulate RCA analysis workflow
      const stopTotal = tracker.startTimer('total_analysis');
      
      const stopParsing = tracker.startTimer('parsing');
      const start1 = Date.now();
      while (Date.now() - start1 < 5);
      stopParsing();
      
      // Multiple LLM calls
      for (let i = 0; i < 3; i++) {
        const stopLLM = tracker.startTimer('llm_inference');
        const start2 = Date.now();
        while (Date.now() - start2 < 10);
        stopLLM();
      }
      
      const stopTool = tracker.startTimer('tool_execution');
      const start3 = Date.now();
      while (Date.now() - start3 < 8);
      stopTool();
      
      stopTotal();
      
      const exported = tracker.exportMetrics();
      
      expect(exported.operations.parsing.count).toBe(1);
      expect(exported.operations.llm_inference.count).toBe(3);
      expect(exported.operations.tool_execution.count).toBe(1);
      expect(exported.operations.total_analysis.count).toBe(1);
      expect(exported.summary.totalOperations).toBe(6);
    });
    
    it('should provide useful statistics for performance analysis', () => {
      // Simulate variable performance
      const values = [50, 60, 70, 80, 90, 100, 110, 120, 500, 600];
      values.forEach((v) => tracker.recordMetric('variable_op', v));
      
      const stats = tracker.getStats('variable_op');
      
      // Mean affected by outliers
      expect(stats.mean).toBeGreaterThan(100);
      
      // Median less affected
      expect(stats.p50).toBeLessThan(stats.mean);
      
      // p90 should catch slower operations
      expect(stats.p90).toBeGreaterThan(stats.p50);
      
      // p99 should catch outliers
      expect(stats.p99).toBeGreaterThan(stats.p90);
    });
  });
});
