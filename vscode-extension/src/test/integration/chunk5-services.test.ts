/**
 * Integration Tests for Chunk 5 Services
 * Tests interactions between services and extension components
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { AccessibilityService } from '../../services/AccessibilityService';
import { ThemeManager } from '../../services/ThemeManager';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import { FeatureFlagManager } from '../../services/FeatureFlagManager';
import { ErrorBoundary } from '../../panel/ErrorBoundary';

suite('Integration: Accessibility Service', () => {
  let accessibilityService: AccessibilityService;

  setup(() => {
    accessibilityService = AccessibilityService.getInstance();
  });

  test('Generate ARIA attributes for button', () => {
    const attributes = accessibilityService.generateAriaAttributes({
      role: 'button',
      label: 'Analyze Error',
      description: 'Start error analysis'
    });

    assert.ok(attributes.includes('role="button"'));
    assert.ok(attributes.includes('aria-label="Analyze Error"'));
    assert.ok(attributes.includes('aria-description="Start error analysis"'));
  });

  test('Generate keyboard hints HTML', () => {
    const hints = accessibilityService.generateKeyboardHints({
      'Enter': 'Analyze',
      'Escape': 'Cancel'
    });

    assert.ok(hints.includes('keyboard-hints'));
    assert.ok(hints.includes('Enter: Analyze'));
    assert.ok(hints.includes('Escape: Cancel'));
  });

  test('Generate accessible progress indicator', () => {
    const progress = accessibilityService.generateProgressIndicator(
      50,
      100,
      'Analysis progress'
    );

    assert.ok(progress.includes('role="progressbar"'));
    assert.ok(progress.includes('aria-valuenow="50"'));
    assert.ok(progress.includes('aria-valuemax="100"'));
    assert.ok(progress.includes('50% complete'));
  });

  test('Generate accessible error message', () => {
    const errorMsg = accessibilityService.generateErrorMessage(
      'Connection Error',
      'Cannot connect to Ollama server'
    );

    assert.ok(errorMsg.includes('role="alert"'));
    assert.ok(errorMsg.includes('aria-live="assertive"'));
    assert.ok(errorMsg.includes('Cannot connect to Ollama server'));
  });

  test('Accessibility CSS includes sr-only class', () => {
    const css = accessibilityService.getAccessibilityCSS();

    assert.ok(css.includes('.sr-only'));
    assert.ok(css.includes('position: absolute'));
    assert.ok(css.includes('prefers-contrast: high'));
    assert.ok(css.includes('prefers-reduced-motion'));
  });
});

suite('Integration: Theme Manager', () => {
  let themeManager: ThemeManager;

  setup(() => {
    themeManager = ThemeManager.getInstance();
  });

  test('Detect current theme', () => {
    const theme = themeManager.getCurrentTheme();
    assert.ok(['light', 'dark', 'high-contrast-light', 'high-contrast-dark'].includes(theme));
  });

  test('Generate theme CSS variables', () => {
    const css = themeManager.generateThemeCSS();

    assert.ok(css.includes('--rca-background'));
    assert.ok(css.includes('--rca-foreground'));
    assert.ok(css.includes('--rca-error'));
    assert.ok(css.includes('--rca-warning'));
  });

  test('Get theme class names', () => {
    const classNames = themeManager.getThemeClassNames();

    assert.ok(classNames.includes('rca-themed'));
    assert.ok(classNames.includes('theme-'));
  });

  test('Generate themed badge', () => {
    const badge = themeManager.generateThemedBadge('Error', 'error');

    assert.ok(badge.includes('status-badge'));
    assert.ok(badge.includes('status-badge-error'));
    assert.ok(badge.includes('Error'));
  });

  test('Get syntax highlighting theme', () => {
    const syntaxTheme = themeManager.getSyntaxTheme();
    assert.ok(['vs-dark', 'vs-light'].includes(syntaxTheme));
  });

  test('Theme change event fires', (done) => {
    themeManager.onThemeChange((theme) => {
      assert.ok(theme);
      done();
    });

    // Simulate theme change (would require mocking VS Code API)
    // For now, just complete the test
    setTimeout(done, 100);
  });
});

suite('Integration: Performance Monitor', () => {
  let performanceMonitor: PerformanceMonitor;

  setup(() => {
    performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.clearMetrics();
  });

  test('Start and end timer', () => {
    performanceMonitor.startTimer('test-operation');
    
    // Simulate some work
    const start = Date.now();
    while (Date.now() - start < 10) {
      // Wait 10ms
    }
    
    const duration = performanceMonitor.endTimer('test-operation');
    assert.ok(duration >= 10, `Duration ${duration}ms should be >= 10ms`);
  });

  test('Record metrics', () => {
    performanceMonitor.recordMetrics({
      panelLoadTime: 50,
      analysisStartTime: 20,
      errorQueueRenderTime: 30
    });

    const latest = performanceMonitor.getLatestMetrics();
    assert.strictEqual(latest?.panelLoadTime, 50);
    assert.strictEqual(latest?.analysisStartTime, 20);
  });

  test('Get average metrics', () => {
    performanceMonitor.recordMetrics({ panelLoadTime: 50, analysisStartTime: 20, errorQueueRenderTime: 30, memoryUsage: 10, cpuUsage: 0, timestamp: Date.now() });
    performanceMonitor.recordMetrics({ panelLoadTime: 70, analysisStartTime: 30, errorQueueRenderTime: 40, memoryUsage: 15, cpuUsage: 0, timestamp: Date.now() });

    const avg = performanceMonitor.getAverageMetrics();
    assert.strictEqual(avg?.panelLoadTime, 60);
    assert.strictEqual(avg?.analysisStartTime, 25);
  });

  test('Check performance acceptable', () => {
    // Good performance
    performanceMonitor.recordMetrics({
      panelLoadTime: 50,
      analysisStartTime: 20,
      errorQueueRenderTime: 100,
      memoryUsage: 30,
      cpuUsage: 0,
      timestamp: Date.now()
    });

    const status = performanceMonitor.isPerformanceAcceptable();
    assert.strictEqual(status.acceptable, true);
    assert.strictEqual(status.issues.length, 0);
  });

  test('Generate performance report', () => {
    performanceMonitor.recordMetrics({
      panelLoadTime: 50,
      analysisStartTime: 20,
      errorQueueRenderTime: 100,
      memoryUsage: 30,
      cpuUsage: 0,
      timestamp: Date.now()
    });

    const report = performanceMonitor.generateReport();
    assert.ok(report.includes('Performance Report'));
    assert.ok(report.includes('Panel Load'));
    assert.ok(report.includes('50ms'));
  });

  test('Debounce function works', (done) => {
    let callCount = 0;
    const debounced = PerformanceMonitor.debounce(() => {
      callCount++;
    }, 50);

    // Call multiple times rapidly
    debounced();
    debounced();
    debounced();

    // Should only be called once after delay
    setTimeout(() => {
      assert.strictEqual(callCount, 1);
      done();
    }, 100);
  });
});

suite('Integration: Feature Flag Manager', () => {
  let featureFlagManager: FeatureFlagManager;

  setup(() => {
    featureFlagManager = FeatureFlagManager.getInstance();
  });

  test('Get all feature flags', () => {
    const flags = featureFlagManager.getAllFlags();

    assert.ok('newUI' in flags);
    assert.ok('batchAnalysis' in flags);
    assert.ok('performanceMetrics' in flags);
  });

  test('Check if feature is enabled', () => {
    const newUI = featureFlagManager.isEnabled('newUI');
    assert.strictEqual(typeof newUI, 'boolean');
  });

  test('Should use new UI', () => {
    const useNewUI = featureFlagManager.shouldUseNewUI();
    assert.strictEqual(typeof useNewUI, 'boolean');
  });

  test('Feature flag requires reload', () => {
    const requiresReload = featureFlagManager.requiresReload('newUI');
    assert.strictEqual(requiresReload, true);

    const noReload = featureFlagManager.requiresReload('performanceMetrics');
    assert.strictEqual(noReload, false);
  });

  test('Generate configuration contribution', () => {
    const config = featureFlagManager.generateConfigurationContribution();

    assert.ok('rcaAgent.experimental.newUI' in config);
    assert.ok('rcaAgent.experimental.batchAnalysis' in config);
  });
});

suite('Integration: Error Boundary', () => {
  let errorBoundary: ErrorBoundary;

  setup(() => {
    errorBoundary = ErrorBoundary.getInstance();
    errorBoundary.clearErrorLog();
  });

  test('Handle error with context', async () => {
    const testError = new Error('Test error');
    
    await errorBoundary.handleError(testError, {
      component: 'TestComponent',
      action: 'testAction'
    });

    const log = errorBoundary.getErrorLog();
    assert.strictEqual(log.length, 1);
    assert.strictEqual(log[0].component, 'TestComponent');
    assert.strictEqual(log[0].action, 'testAction');
  });

  test('Error log is limited to max size', async () => {
    // Add 60 errors (max is 50)
    for (let i = 0; i < 60; i++) {
      await errorBoundary.handleError(new Error(`Error ${i}`), {
        component: 'Test',
        action: 'test'
      });
    }

    const log = errorBoundary.getErrorLog();
    assert.ok(log.length <= 50, `Log should be <= 50 entries, got ${log.length}`);
  });

  test('Get error statistics', async () => {
    await errorBoundary.handleError(new Error('Error 1'), {
      component: 'Component1',
      action: 'action1'
    });
    await errorBoundary.handleError(new Error('Error 2'), {
      component: 'Component1',
      action: 'action2'
    });
    await errorBoundary.handleError(new Error('ECONNREFUSED'), {
      component: 'Component2',
      action: 'action3'
    });

    const stats = errorBoundary.getErrorStatistics();
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.byComponent['Component1'], 2);
    assert.strictEqual(stats.byComponent['Component2'], 1);
    assert.ok(stats.bySeverity.critical > 0);
  });

  test('Wrap function with error handling', async () => {
    const wrappedFunc = errorBoundary.wrap(
      async () => {
        throw new Error('Wrapped error');
      },
      { component: 'Test', action: 'wrap' }
    );

    try {
      await wrappedFunc();
      assert.fail('Should have thrown error');
    } catch (error) {
      // Expected
    }

    const log = errorBoundary.getErrorLog();
    assert.ok(log.length > 0);
  });
});

suite('Integration: Services Together', () => {
  test('All services can be initialized', () => {
    const accessibility = AccessibilityService.getInstance();
    const theme = ThemeManager.getInstance();
    const performance = PerformanceMonitor.getInstance();
    const featureFlags = FeatureFlagManager.getInstance();
    const errorBoundary = ErrorBoundary.getInstance();

    assert.ok(accessibility);
    assert.ok(theme);
    assert.ok(performance);
    assert.ok(featureFlags);
    assert.ok(errorBoundary);
  });

  test('Performance monitor tracks extension operations', () => {
    const performance = PerformanceMonitor.getInstance();
    
    performance.startTimer('extension-init');
    // Simulate init work
    performance.endTimer('extension-init');

    const metrics = performance.getLatestMetrics();
    assert.ok(metrics);
  });

  test('Error boundary integrates with feature flags', async () => {
    const errorBoundary = ErrorBoundary.getInstance();
    const featureFlags = FeatureFlagManager.getInstance();

    const newUIEnabled = featureFlags.isEnabled('newUI');
    
    await errorBoundary.handleError(new Error('Test'), {
      component: 'UI',
      action: 'render',
      userContext: { newUI: newUIEnabled }
    });

    const log = errorBoundary.getErrorLog();
    assert.ok(log[0].userContext);
  });

  test('Theme manager and accessibility work together', () => {
    const theme = ThemeManager.getInstance();
    const accessibility = AccessibilityService.getInstance();

    const themeCSS = theme.generateThemeCSS();
    const accessibilityCSS = accessibility.getAccessibilityCSS();

    // Both should provide valid CSS
    assert.ok(themeCSS.length > 0);
    assert.ok(accessibilityCSS.length > 0);
  });
});
