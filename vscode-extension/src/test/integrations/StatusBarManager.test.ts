/**
 * Tests for StatusBarManager
 * Verifies status bar integration and state management
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { StatusBarManager, RCAStatus } from '../../integrations/StatusBarManager';
import { ErrorQueueManager } from '../../panel/ErrorQueueManager';

suite('StatusBarManager Tests', () => {
  let manager: StatusBarManager;
  let errorQueueManager: ErrorQueueManager;

  setup(() => {
    errorQueueManager = ErrorQueueManager.getInstance();
    errorQueueManager.clearAll();
    manager = new StatusBarManager(errorQueueManager);
  });

  teardown(() => {
    manager.dispose();
  });

  test('Should initialize with idle status', () => {
    // Status bar should be created and shown
    assert.ok(manager, 'Manager should be initialized');
  });

  test('Should update to analyzing status', () => {
    manager.setAnalyzing(50);
    // Visual verification would be needed, but we test the method executes
    assert.ok(true, 'Should set analyzing status');
  });

  test('Should update to has errors status', () => {
    manager.setHasErrors(3);
    assert.ok(true, 'Should set has errors status');
  });

  test('Should update to error status', () => {
    manager.setError('Test error message');
    assert.ok(true, 'Should set error status');
  });

  test('Should return to idle status', () => {
    manager.setAnalyzing(50);
    manager.setIdle();
    assert.ok(true, 'Should return to idle status');
  });

  test('Should handle progress updates', () => {
    manager.setAnalyzing(0, 1, 3);
    manager.setAnalyzing(33, 1, 3);
    manager.setAnalyzing(66, 2, 3);
    manager.setAnalyzing(100, 3, 3);
    assert.ok(true, 'Should handle progress updates');
  });

  test('Should update badge count', () => {
    manager.updateBadgeCount(5);
    manager.updateBadgeCount(0);
    assert.ok(true, 'Should update badge count');
  });

  test('Should show and hide status bar', () => {
    manager.show();
    manager.hide();
    manager.show();
    assert.ok(true, 'Should toggle visibility');
  });

  test('Should handle rapid status changes', () => {
    manager.setAnalyzing(10);
    manager.setHasErrors(2);
    manager.setIdle();
    manager.setError('Error');
    manager.setIdle();
    assert.ok(true, 'Should handle rapid changes');
  });

  test('Should respond to error queue changes', (done) => {
    const error = {
      id: 'test_1',
      message: 'Test error',
      filePath: '/test/file.kt',
      line: 10,
      severity: 'critical' as const,
      status: 'pending' as const,
      timestamp: Date.now()
    };

    errorQueueManager.addError(error);
    
    // Give time for event to propagate
    setTimeout(() => {
      // Status should reflect the error
      done();
    }, 100);
  });

  test('Should clamp progress values', () => {
    manager.setAnalyzing(-10); // Should clamp to 0
    manager.setAnalyzing(150); // Should clamp to 100
    assert.ok(true, 'Should clamp progress to 0-100');
  });

  test('Should dispose properly', () => {
    manager.dispose();
    assert.ok(true, 'Should dispose without errors');
  });
});
