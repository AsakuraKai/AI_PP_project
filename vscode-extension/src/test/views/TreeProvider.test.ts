/**
 * TreeProvider Tests
 * Tests for ErrorTreeProvider and HistoryTreeProvider
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ErrorTreeProvider } from '../../views/ErrorTreeProvider';
import { HistoryTreeProvider } from '../../views/HistoryTreeProvider';
import { ErrorQueueManager } from '../../panel/ErrorQueueManager';
import { StateManager } from '../../panel/StateManager';
import { ErrorItem, HistoryItem } from '../../panel/types';

suite('TreeProvider Tests', () => {
  let context: vscode.ExtensionContext;
  let queueManager: ErrorQueueManager;
  let stateManager: StateManager;

  setup(() => {
    context = {
      globalState: {
        get: () => [],
        update: async () => {},
        keys: () => []
      },
      subscriptions: []
    } as any;

    queueManager = ErrorQueueManager.getInstance(context);
    stateManager = StateManager.getInstance(context);
  });

  teardown(() => {
    queueManager.dispose();
    stateManager.dispose();
  });

  suite('ErrorTreeProvider', () => {
    let treeProvider: ErrorTreeProvider;

    setup(() => {
      treeProvider = new ErrorTreeProvider(context, queueManager);
    });

    test('should create tree provider', () => {
      assert.ok(treeProvider, 'Tree provider should be created');
    });

    test('should return empty children when no errors', async () => {
      const children = await treeProvider.getChildren();
      assert.strictEqual(children.length, 0, 'Should return empty array');
    });

    test('should return errors when queue has items', async () => {
      const error: ErrorItem = {
        id: 'test-1',
        message: 'Test error',
        filePath: '/test/file.kt',
        line: 10,
        severity: 'critical',
        status: 'pending',
        timestamp: Date.now()
      };

      await queueManager.addError(error);
      const children = await treeProvider.getChildren();
      
      assert.ok(children.length > 0, 'Should return children');
    });

    test('should group errors by severity', async () => {
      const errors: ErrorItem[] = [
        {
          id: 'critical-1',
          message: 'Critical error',
          filePath: '/test/file.kt',
          line: 10,
          severity: 'critical',
          status: 'pending',
          timestamp: Date.now()
        },
        {
          id: 'high-1',
          message: 'High error',
          filePath: '/test/file.kt',
          line: 20,
          severity: 'high',
          status: 'pending',
          timestamp: Date.now()
        }
      ];

      for (const error of errors) {
        await queueManager.addError(error);
      }

      const children = await treeProvider.getChildren();
      
      // Should have categories (Critical Errors, High Priority, etc.)
      assert.ok(children.length > 0, 'Should have grouped items');
    });

    test('should refresh tree on queue change', (done) => {
      let refreshFired = false;

      treeProvider.onDidChangeTreeData(() => {
        refreshFired = true;
        assert.strictEqual(refreshFired, true, 'Tree should refresh');
        done();
      });

      const error: ErrorItem = {
        id: 'refresh-test',
        message: 'Refresh test',
        filePath: '/test/file.kt',
        line: 10,
        severity: 'high',
        status: 'pending',
        timestamp: Date.now()
      };

      queueManager.addError(error);
    });
  });

  suite('HistoryTreeProvider', () => {
    let treeProvider: HistoryTreeProvider;

    setup(() => {
      treeProvider = new HistoryTreeProvider(context, stateManager);
    });

    test('should create tree provider', () => {
      assert.ok(treeProvider, 'Tree provider should be created');
    });

    test('should return empty children when no history', async () => {
      const children = await treeProvider.getChildren();
      assert.strictEqual(children.length, 0, 'Should return empty array');
    });

    test('should return history items when available', async () => {
      const historyItem: HistoryItem = {
        id: 'history-1',
        timestamp: Date.now(),
        errorId: 'error-1',
        result: {
          rootCause: 'Test root cause',
          fixGuidelines: ['Fix 1', 'Fix 2'],
          confidence: 85,
          iterations: 3,
          toolsUsed: ['Tool1', 'Tool2']
        },
        duration: 5000
      };

      await stateManager.addHistoryItem(historyItem);
      const children = await treeProvider.getChildren();
      
      assert.ok(children.length > 0, 'Should return children');
    });

    test('should group history by date', async () => {
      const now = Date.now();
      const yesterday = now - (24 * 60 * 60 * 1000);

      const items: HistoryItem[] = [
        {
          id: 'history-today',
          timestamp: now,
          errorId: 'error-1',
          result: {
            rootCause: 'Today error',
            fixGuidelines: [],
            confidence: 85,
            iterations: 3,
            toolsUsed: []
          },
          duration: 5000
        },
        {
          id: 'history-yesterday',
          timestamp: yesterday,
          errorId: 'error-2',
          result: {
            rootCause: 'Yesterday error',
            fixGuidelines: [],
            confidence: 85,
            iterations: 3,
            toolsUsed: []
          },
          duration: 5000
        }
      ];

      for (const item of items) {
        await stateManager.addHistoryItem(item);
      }

      const children = await treeProvider.getChildren();
      
      // Should have grouped items (Today, Yesterday, etc.)
      assert.ok(children.length > 0, 'Should have grouped items');
    });

    test('should refresh tree on history change', (done) => {
      let refreshFired = false;

      treeProvider.onDidChangeTreeData(() => {
        refreshFired = true;
        assert.strictEqual(refreshFired, true, 'Tree should refresh');
        done();
      });

      const historyItem: HistoryItem = {
        id: 'refresh-test',
        timestamp: Date.now(),
        errorId: 'error-1',
        result: {
          rootCause: 'Test',
          fixGuidelines: [],
          confidence: 85,
          iterations: 3,
          toolsUsed: []
        },
        duration: 5000
      };

      stateManager.addHistoryItem(historyItem);
    });
  });
});
