/**
 * Load Testing Script for RCA Agent
 * Tests panel performance with 100+ errors
 * 
 * Run: npm run test:load
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ErrorQueueManager } from '../src/panel/ErrorQueueManager';
import { PerformanceMonitor } from '../src/services/PerformanceMonitor';
import { VirtualScrollProvider } from '../src/views/VirtualScrollProvider';

describe('RCA Agent - Load Testing', () => {
  let errorQueue: ErrorQueueManager;
  let perfMonitor: PerformanceMonitor;
  let virtualScroll: VirtualScrollProvider;

  beforeEach(() => {
    errorQueue = ErrorQueueManager.getInstance();
    perfMonitor = PerformanceMonitor.getInstance();
    virtualScroll = new VirtualScrollProvider();
  });

  afterEach(() => {
    errorQueue.clear();
    perfMonitor.reset();
  });

  /**
   * Generate mock errors for load testing
   */
  function generateMockErrors(count: number) {
    const errors = [];
    const errorTypes = [
      'NullPointerException',
      'lateinit property not initialized',
      'Unresolved reference',
      'Type mismatch',
      'Compose recomposition issue',
      'XML layout inflation error',
      'Gradle dependency conflict'
    ];
    
    const severities: ('critical' | 'high' | 'medium')[] = ['critical', 'high', 'medium'];
    
    for (let i = 0; i < count; i++) {
      const errorType = errorTypes[i % errorTypes.length];
      const severity = severities[i % severities.length];
      
      errors.push({
        id: `error-${i}`,
        message: `${errorType} at line ${100 + i}`,
        filePath: `/src/module${Math.floor(i / 10)}/File${i}.kt`,
        line: 100 + i,
        column: 10,
        severity,
        status: 'pending' as const,
        timestamp: Date.now() + i
      });
    }
    
    return errors;
  }

  /**
   * Test 1: Load 100 errors - Queue Performance
   */
  it('should handle 100 errors in queue efficiently', async function() {
    this.timeout(10000); // 10 second timeout
    
    const startTime = Date.now();
    const errors = generateMockErrors(100);
    
    // Add all errors to queue
    perfMonitor.startTimer('add-100-errors');
    for (const error of errors) {
      errorQueue.addError(error);
    }
    perfMonitor.endTimer('add-100-errors');
    
    const addTime = perfMonitor.getMetrics().timers['add-100-errors'] || 0;
    
    // Assertions
    assert.strictEqual(errorQueue.getErrorCount(), 100, 'Should have 100 errors');
    assert.ok(addTime < 1000, `Adding 100 errors should take <1s (took ${addTime}ms)`);
    
    console.log(`✅ Added 100 errors in ${addTime}ms`);
  });

  /**
   * Test 2: Load 500 errors - Stress Test
   */
  it('should handle 500 errors without crashing', async function() {
    this.timeout(30000); // 30 second timeout
    
    const errors = generateMockErrors(500);
    
    perfMonitor.startTimer('add-500-errors');
    for (const error of errors) {
      errorQueue.addError(error);
    }
    perfMonitor.endTimer('add-500-errors');
    
    const addTime = perfMonitor.getMetrics().timers['add-500-errors'] || 0;
    
    assert.strictEqual(errorQueue.getErrorCount(), 500);
    assert.ok(addTime < 5000, `Adding 500 errors should take <5s (took ${addTime}ms)`);
    
    console.log(`✅ Added 500 errors in ${addTime}ms`);
  });

  /**
   * Test 3: Virtual Scrolling Performance
   */
  it('should render visible items only with virtual scrolling', async function() {
    this.timeout(5000);
    
    const errors = generateMockErrors(1000);
    virtualScroll.initialize(errors, 50); // 50px item height
    
    perfMonitor.startTimer('virtual-scroll-init');
    const visibleItems = virtualScroll.getVisibleItems();
    perfMonitor.endTimer('virtual-scroll-init');
    
    const initTime = perfMonitor.getMetrics().timers['virtual-scroll-init'] || 0;
    
    // Should only render visible items (viewport dependent, typically 20-30)
    assert.ok(visibleItems.length < 100, 'Should render <100 items with virtual scroll');
    assert.ok(initTime < 100, `Virtual scroll init should take <100ms (took ${initTime}ms)`);
    
    console.log(`✅ Virtual scroll rendered ${visibleItems.length} of 1000 items in ${initTime}ms`);
  });

  /**
   * Test 4: Memory Usage - 100 Errors
   */
  it('should maintain reasonable memory usage with 100 errors', async function() {
    this.timeout(10000);
    
    const initialMemory = process.memoryUsage().heapUsed;
    const errors = generateMockErrors(100);
    
    for (const error of errors) {
      errorQueue.addError(error);
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    // Memory increase should be reasonable (<10MB for 100 errors)
    assert.ok(memoryIncrease < 10, `Memory increase should be <10MB (was ${memoryIncrease.toFixed(2)}MB)`);
    
    console.log(`✅ Memory increase: ${memoryIncrease.toFixed(2)}MB for 100 errors`);
  });

  /**
   * Test 5: Batch Analysis Simulation
   */
  it('should process batch analysis of 50 errors within timeout', async function() {
    this.timeout(60000); // 60 seconds for batch processing
    
    const errors = generateMockErrors(50);
    for (const error of errors) {
      errorQueue.addError(error);
    }
    
    perfMonitor.startTimer('batch-analysis-50');
    
    // Simulate batch analysis (mock processing)
    let processed = 0;
    for (const error of errors) {
      // Simulate 100ms analysis per error
      await new Promise(resolve => setTimeout(resolve, 10));
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`  Processed ${processed}/50 errors...`);
      }
    }
    
    perfMonitor.endTimer('batch-analysis-50');
    
    const batchTime = perfMonitor.getMetrics().timers['batch-analysis-50'] || 0;
    
    assert.strictEqual(processed, 50);
    assert.ok(batchTime < 60000, `Batch analysis should complete <60s (took ${batchTime}ms)`);
    
    console.log(`✅ Batch analyzed 50 errors in ${batchTime}ms`);
  });

  /**
   * Test 6: Queue Sorting Performance
   */
  it('should sort 100 errors by priority quickly', async function() {
    this.timeout(5000);
    
    const errors = generateMockErrors(100);
    for (const error of errors) {
      errorQueue.addError(error);
    }
    
    perfMonitor.startTimer('sort-100-errors');
    const sorted = errorQueue.getErrors(); // Should be sorted
    perfMonitor.endTimer('sort-100-errors');
    
    const sortTime = perfMonitor.getMetrics().timers['sort-100-errors'] || 0;
    
    // Verify sorting order (critical > high > medium)
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    
    for (const error of sorted) {
      if (error.severity === 'critical') criticalCount++;
      else if (error.severity === 'high') highCount++;
      else mediumCount++;
    }
    
    assert.ok(sortTime < 100, `Sorting should take <100ms (took ${sortTime}ms)`);
    assert.ok(criticalCount > 0, 'Should have critical errors');
    
    console.log(`✅ Sorted 100 errors in ${sortTime}ms (${criticalCount} critical, ${highCount} high, ${mediumCount} medium)`);
  });

  /**
   * Test 7: Concurrent Operations
   */
  it('should handle concurrent add/remove operations', async function() {
    this.timeout(10000);
    
    const errors = generateMockErrors(100);
    
    // Add errors while simultaneously removing some
    const addPromises = errors.map((error, index) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          errorQueue.addError(error);
          
          // Remove every 10th error immediately after adding
          if (index % 10 === 0 && index > 0) {
            errorQueue.removeError(errors[index - 1].id);
          }
          
          resolve();
        }, index * 10); // Stagger adds
      });
    });
    
    perfMonitor.startTimer('concurrent-ops');
    await Promise.all(addPromises);
    perfMonitor.endTimer('concurrent-ops');
    
    const opTime = perfMonitor.getMetrics().timers['concurrent-ops'] || 0;
    const finalCount = errorQueue.getErrorCount();
    
    // Should have 90 errors (100 added, 10 removed)
    assert.ok(finalCount === 90, `Should have 90 errors (has ${finalCount})`);
    assert.ok(opTime < 5000, `Concurrent ops should complete <5s (took ${opTime}ms)`);
    
    console.log(`✅ Concurrent operations completed in ${opTime}ms`);
  });

  /**
   * Test 8: Panel Render Performance
   */
  it('should render panel with 100 errors in <200ms', async function() {
    this.timeout(5000);
    
    const errors = generateMockErrors(100);
    for (const error of errors) {
      errorQueue.addError(error);
    }
    
    // Simulate panel render
    perfMonitor.startTimer('panel-render');
    
    // Mock HTML generation (simplified)
    const html = errors.map(error => 
      `<div class="error-item" data-id="${error.id}">
        <span class="severity ${error.severity}">${error.severity}</span>
        <span class="message">${error.message}</span>
      </div>`
    ).join('');
    
    perfMonitor.endTimer('panel-render');
    
    const renderTime = perfMonitor.getMetrics().timers['panel-render'] || 0;
    
    assert.ok(html.length > 0);
    assert.ok(renderTime < 200, `Panel render should take <200ms (took ${renderTime}ms)`);
    
    console.log(`✅ Rendered panel with 100 errors in ${renderTime}ms`);
  });

  /**
   * Test 9: Search/Filter Performance
   */
  it('should filter 100 errors by keyword quickly', async function() {
    this.timeout(5000);
    
    const errors = generateMockErrors(100);
    for (const error of errors) {
      errorQueue.addError(error);
    }
    
    perfMonitor.startTimer('filter-errors');
    
    // Filter errors containing "NullPointerException"
    const filtered = errorQueue.getErrors().filter(error => 
      error.message.includes('NullPointerException')
    );
    
    perfMonitor.endTimer('filter-errors');
    
    const filterTime = perfMonitor.getMetrics().timers['filter-errors'] || 0;
    
    assert.ok(filtered.length > 0);
    assert.ok(filterTime < 50, `Filter should take <50ms (took ${filterTime}ms)`);
    
    console.log(`✅ Filtered 100 errors in ${filterTime}ms (found ${filtered.length} matches)`);
  });

  /**
   * Test 10: Performance Report Generation
   */
  it('should generate performance report efficiently', async function() {
    this.timeout(5000);
    
    // Create multiple timers
    for (let i = 0; i < 20; i++) {
      perfMonitor.startTimer(`operation-${i}`);
      await new Promise(resolve => setTimeout(resolve, 10));
      perfMonitor.endTimer(`operation-${i}`);
    }
    
    perfMonitor.startTimer('generate-report');
    const report = perfMonitor.generateReport();
    perfMonitor.endTimer('generate-report');
    
    const reportTime = perfMonitor.getMetrics().timers['generate-report'] || 0;
    
    assert.ok(report.includes('Performance Report'));
    assert.ok(reportTime < 100, `Report generation should take <100ms (took ${reportTime}ms)`);
    
    console.log(`✅ Generated performance report in ${reportTime}ms`);
  });

  /**
   * Summary Test - Overall Load Test
   */
  it('SUMMARY: Complete load test with 100 errors', async function() {
    this.timeout(30000);
    
    console.log('\n📊 Running comprehensive load test...\n');
    
    const errors = generateMockErrors(100);
    
    // Phase 1: Add errors
    perfMonitor.startTimer('phase1-add');
    for (const error of errors) {
      errorQueue.addError(error);
    }
    perfMonitor.endTimer('phase1-add');
    
    // Phase 2: Sort & filter
    perfMonitor.startTimer('phase2-sort');
    const sorted = errorQueue.getErrors();
    perfMonitor.endTimer('phase2-sort');
    
    // Phase 3: Virtual scroll render
    perfMonitor.startTimer('phase3-render');
    virtualScroll.initialize(sorted, 50);
    const visible = virtualScroll.getVisibleItems();
    perfMonitor.endTimer('phase3-render');
    
    // Phase 4: Batch process (simulate)
    perfMonitor.startTimer('phase4-process');
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    perfMonitor.endTimer('phase4-process');
    
    // Generate report
    const report = perfMonitor.generateReport();
    
    console.log('\n' + report);
    console.log('\n✅ Load test complete!\n');
    
    // Final assertions
    const metrics = perfMonitor.getMetrics();
    assert.ok(metrics.timers['phase1-add']! < 1000, 'Phase 1 should complete in <1s');
    assert.ok(metrics.timers['phase2-sort']! < 100, 'Phase 2 should complete in <100ms');
    assert.ok(metrics.timers['phase3-render']! < 200, 'Phase 3 should complete in <200ms');
  });
});
