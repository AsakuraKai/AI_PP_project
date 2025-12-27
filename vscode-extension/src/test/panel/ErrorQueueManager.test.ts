/**
 * ErrorQueueManager Tests
 * Tests for error queue management functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ErrorQueueManager } from '../../panel/ErrorQueueManager';
import { ErrorItem } from '../../panel/types';

suite('ErrorQueueManager Tests', () => {
  let context: vscode.ExtensionContext;
  let manager: ErrorQueueManager;

  setup(() => {
    // Create mock context
    context = {
      globalState: {
        get: () => [],
        update: async () => {},
        keys: () => []
      },
      subscriptions: []
    } as any;

    manager = ErrorQueueManager.getInstance(context);
  });

  teardown(() => {
    manager.dispose();
  });

  test('should create singleton instance', () => {
    const instance1 = ErrorQueueManager.getInstance(context);
    const instance2 = ErrorQueueManager.getInstance(context);
    assert.strictEqual(instance1, instance2, 'Should return same instance');
  });

  test('should add error to queue', async () => {
    const error: ErrorItem = {
      id: 'test-1',
      message: 'Test error',
      filePath: '/test/file.kt',
      line: 10,
      severity: 'high',
      status: 'pending',
      timestamp: Date.now()
    };

    await manager.addError(error);
    const queue = manager.getQueue();
    
    assert.strictEqual(queue.length, 1, 'Queue should have 1 error');
    assert.strictEqual(queue[0].id, 'test-1', 'Error ID should match');
  });

  test('should not add duplicate errors', async () => {
    const error: ErrorItem = {
      id: 'test-dup',
      message: 'Duplicate error',
      filePath: '/test/file.kt',
      line: 10,
      severity: 'high',
      status: 'pending',
      timestamp: Date.now()
    };

    await manager.addError(error);
    await manager.addError(error);
    
    const queue = manager.getQueue();
    assert.strictEqual(queue.length, 1, 'Should not add duplicate');
  });

  test('should remove error from queue', async () => {
    const error: ErrorItem = {
      id: 'test-remove',
      message: 'Remove me',
      filePath: '/test/file.kt',
      line: 10,
      severity: 'high',
      status: 'pending',
      timestamp: Date.now()
    };

    await manager.addError(error);
    await manager.removeError('test-remove');
    
    const queue = manager.getQueue();
    assert.strictEqual(queue.length, 0, 'Queue should be empty');
  });

  test('should update error status', async () => {
    const error: ErrorItem = {
      id: 'test-status',
      message: 'Status test',
      filePath: '/test/file.kt',
      line: 10,
      severity: 'high',
      status: 'pending',
      timestamp: Date.now()
    };

    await manager.addError(error);
    await manager.updateErrorStatus('test-status', 'analyzing');
    
    const queue = manager.getQueue();
    assert.strictEqual(queue[0].status, 'analyzing', 'Status should be updated');
  });

  test('should sort queue by severity', async () => {
    const errors: ErrorItem[] = [
      {
        id: 'medium-1',
        message: 'Medium error',
        filePath: '/test/file.kt',
        line: 10,
        severity: 'medium',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: 'critical-1',
        message: 'Critical error',
        filePath: '/test/file.kt',
        line: 20,
        severity: 'critical',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: 'high-1',
        message: 'High error',
        filePath: '/test/file.kt',
        line: 30,
        severity: 'high',
        status: 'pending',
        timestamp: Date.now()
      }
    ];

    for (const error of errors) {
      await manager.addError(error);
    }

    const queue = manager.getQueue();
    assert.strictEqual(queue[0].severity, 'critical', 'First should be critical');
    assert.strictEqual(queue[1].severity, 'high', 'Second should be high');
    assert.strictEqual(queue[2].severity, 'medium', 'Third should be medium');
  });

  test('should get pending errors', async () => {
    const errors: ErrorItem[] = [
      {
        id: 'pending-1',
        message: 'Pending error',
        filePath: '/test/file.kt',
        line: 10,
        severity: 'high',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: 'complete-1',
        message: 'Complete error',
        filePath: '/test/file.kt',
        line: 20,
        severity: 'high',
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    for (const error of errors) {
      await manager.addError(error);
    }

    const pending = manager.getPendingErrors();
    assert.strictEqual(pending.length, 1, 'Should have 1 pending error');
    assert.strictEqual(pending[0].id, 'pending-1', 'Should be pending-1');
  });

  test('should clear completed errors', async () => {
    const errors: ErrorItem[] = [
      {
        id: 'pending-1',
        message: 'Pending error',
        filePath: '/test/file.kt',
        line: 10,
        severity: 'high',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: 'complete-1',
        message: 'Complete error',
        filePath: '/test/file.kt',
        line: 20,
        severity: 'high',
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    for (const error of errors) {
      await manager.addError(error);
    }

    await manager.clearCompleted();
    const queue = manager.getQueue();
    
    assert.strictEqual(queue.length, 1, 'Should have 1 error left');
    assert.strictEqual(queue[0].status, 'pending', 'Should be pending');
  });

  test('should get count by status', async () => {
    const errors: ErrorItem[] = [
      {
        id: 'pending-1',
        message: 'Pending',
        filePath: '/test/file.kt',
        line: 10,
        severity: 'high',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: 'analyzing-1',
        message: 'Analyzing',
        filePath: '/test/file.kt',
        line: 20,
        severity: 'high',
        status: 'analyzing',
        timestamp: Date.now()
      },
      {
        id: 'complete-1',
        message: 'Complete',
        filePath: '/test/file.kt',
        line: 30,
        severity: 'high',
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    for (const error of errors) {
      await manager.addError(error);
    }

    const counts = manager.getCountByStatus();
    
    assert.strictEqual(counts.pending, 1, 'Should have 1 pending');
    assert.strictEqual(counts.analyzing, 1, 'Should have 1 analyzing');
    assert.strictEqual(counts.complete, 1, 'Should have 1 complete');
    assert.strictEqual(counts.failed, 0, 'Should have 0 failed');
  });

  test('should pin error to top', async () => {
    const errors: ErrorItem[] = [
      {
        id: 'first',
        message: 'First error',
        filePath: '/test/file.kt',
        line: 10,
        severity: 'high',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: 'second',
        message: 'Second error',
        filePath: '/test/file.kt',
        line: 20,
        severity: 'high',
        status: 'pending',
        timestamp: Date.now()
      }
    ];

    for (const error of errors) {
      await manager.addError(error);
    }

    await manager.pinError('second');
    const queue = manager.getQueue();
    
    assert.strictEqual(queue[0].id, 'second', 'Pinned error should be first');
  });

  test('should emit change events', (done) => {
    let eventFired = false;
    
    manager.onQueueChange(() => {
      eventFired = true;
      assert.strictEqual(eventFired, true, 'Change event should fire');
      done();
    });

    const error: ErrorItem = {
      id: 'event-test',
      message: 'Event test',
      filePath: '/test/file.kt',
      line: 10,
      severity: 'high',
      status: 'pending',
      timestamp: Date.now()
    };

    manager.addError(error);
  });
});
