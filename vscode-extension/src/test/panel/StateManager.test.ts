/**
 * Unit tests for StateManager
 * Chunk 1: Foundation & Activity Bar
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { StateManager } from '../../panel/StateManager';
import { ErrorItem, HistoryItem } from '../../panel/types';

suite('StateManager Tests', () => {
  let stateManager: StateManager;
  let mockContext: vscode.ExtensionContext;
  
  // Mock ExtensionContext for testing
  setup(() => {
    const globalState = new Map<string, any>();
    
    mockContext = {
      subscriptions: [],
      globalState: {
        get: <T>(key: string, defaultValue?: T): T => {
          return globalState.get(key) ?? defaultValue;
        },
        update: async (key: string, value: any): Promise<void> => {
          globalState.set(key, value);
        },
        setKeysForSync: () => {}
      }
    } as any;
    
    stateManager = StateManager.getInstance(mockContext);
  });
  
  teardown(async () => {
    await stateManager.reset();
  });
  
  test('Should create singleton instance', () => {
    const instance1 = StateManager.getInstance(mockContext);
    const instance2 = StateManager.getInstance(mockContext);
    assert.strictEqual(instance1, instance2, 'Should return same instance');
  });
  
  test('Should initialize with empty error queue', () => {
    const queue = stateManager.getErrorQueue();
    assert.strictEqual(queue.length, 0, 'Error queue should be empty');
  });
  
  test('Should initialize with empty history', () => {
    const history = stateManager.getHistory();
    assert.strictEqual(history.length, 0, 'History should be empty');
  });
  
  test('Should add error to queue', async () => {
    const error: ErrorItem = {
      id: 'test-1',
      message: 'NullPointerException',
      filePath: '/test/file.kt',
      line: 42,
      severity: 'critical',
      status: 'pending',
      timestamp: Date.now()
    };
    
    await stateManager.addError(error);
    
    const queue = stateManager.getErrorQueue();
    assert.strictEqual(queue.length, 1, 'Queue should have 1 error');
    assert.strictEqual(queue[0].id, 'test-1', 'Error ID should match');
  });
  
  test('Should update existing error on duplicate', async () => {
    const error1: ErrorItem = {
      id: 'test-1',
      message: 'NullPointerException',
      filePath: '/test/file.kt',
      line: 42,
      severity: 'critical',
      status: 'pending',
      timestamp: Date.now()
    };
    
    const error2: ErrorItem = {
      id: 'test-2',
      message: 'NullPointerException',
      filePath: '/test/file.kt',
      line: 42,
      severity: 'high',
      status: 'analyzing',
      timestamp: Date.now()
    };
    
    await stateManager.addError(error1);
    await stateManager.addError(error2);
    
    const queue = stateManager.getErrorQueue();
    assert.strictEqual(queue.length, 1, 'Queue should have 1 error (updated)');
    assert.strictEqual(queue[0].id, 'test-2', 'Should have updated ID');
    assert.strictEqual(queue[0].status, 'analyzing', 'Should have updated status');
  });
  
  test('Should remove error from queue', async () => {
    const error: ErrorItem = {
      id: 'test-1',
      message: 'Test Error',
      filePath: '/test/file.kt',
      line: 42,
      severity: 'medium',
      status: 'pending',
      timestamp: Date.now()
    };
    
    await stateManager.addError(error);
    await stateManager.removeError('test-1');
    
    const queue = stateManager.getErrorQueue();
    assert.strictEqual(queue.length, 0, 'Queue should be empty');
  });
  
  test('Should update error status', async () => {
    const error: ErrorItem = {
      id: 'test-1',
      message: 'Test Error',
      filePath: '/test/file.kt',
      line: 42,
      severity: 'medium',
      status: 'pending',
      timestamp: Date.now()
    };
    
    await stateManager.addError(error);
    await stateManager.updateErrorStatus('test-1', 'analyzing');
    
    const queue = stateManager.getErrorQueue();
    assert.strictEqual(queue[0].status, 'analyzing', 'Status should be updated');
  });
  
  test('Should add history item', async () => {
    const historyItem: HistoryItem = {
      id: 'history-1',
      timestamp: Date.now(),
      errorId: 'test-1',
      result: {
        rootCause: 'Null reference',
        fixGuidelines: ['Use safe call'],
        confidence: 92,
        iterations: 3,
        toolsUsed: ['ReadFileTool']
      },
      duration: 5000
    };
    
    await stateManager.addHistoryItem(historyItem);
    
    const history = stateManager.getHistory();
    assert.strictEqual(history.length, 1, 'History should have 1 item');
    assert.strictEqual(history[0].id, 'history-1', 'History ID should match');
  });
  
  test('Should limit history to 100 items', async () => {
    // Add 105 items
    for (let i = 0; i < 105; i++) {
      const historyItem: HistoryItem = {
        id: `history-${i}`,
        timestamp: Date.now(),
        errorId: `test-${i}`,
        result: {
          rootCause: 'Test',
          fixGuidelines: [],
          confidence: 90,
          iterations: 1,
          toolsUsed: []
        },
        duration: 1000
      };
      
      await stateManager.addHistoryItem(historyItem);
    }
    
    const history = stateManager.getHistory();
    assert.strictEqual(history.length, 100, 'History should be limited to 100 items');
    assert.strictEqual(history[0].id, 'history-104', 'Most recent item should be first');
  });
  
  test('Should fire event on error queue change', (done) => {
    const error: ErrorItem = {
      id: 'test-1',
      message: 'Test',
      filePath: '/test/file.kt',
      line: 1,
      severity: 'medium',
      status: 'pending',
      timestamp: Date.now()
    };
    
    const disposable = stateManager.onErrorQueueChange((queue) => {
      assert.strictEqual(queue.length, 1, 'Event should fire with updated queue');
      disposable.dispose();
      done();
    });
    
    stateManager.addError(error);
  });
  
  test('Should fire event on history change', (done) => {
    const historyItem: HistoryItem = {
      id: 'history-1',
      timestamp: Date.now(),
      errorId: 'test-1',
      result: {
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 90,
        iterations: 1,
        toolsUsed: []
      },
      duration: 1000
    };
    
    const disposable = stateManager.onHistoryChange((history) => {
      assert.strictEqual(history.length, 1, 'Event should fire with updated history');
      disposable.dispose();
      done();
    });
    
    stateManager.addHistoryItem(historyItem);
  });
  
  test('Should get panel state', () => {
    const state = stateManager.getState();
    
    assert.ok(state, 'State should exist');
    assert.ok(Array.isArray(state.errorQueue), 'Error queue should be array');
    assert.ok(Array.isArray(state.history), 'History should be array');
    assert.ok(state.view, 'View state should exist');
  });
  
  test('Should get settings from VS Code config', () => {
    const settings = stateManager.getSettings();
    
    assert.ok(settings, 'Settings should exist');
    assert.strictEqual(typeof settings.educationalMode, 'boolean');
    assert.strictEqual(typeof settings.showPerformanceMetrics, 'boolean');
    assert.ok(settings.modelName, 'Model name should exist');
    assert.ok(settings.ollamaUrl, 'Ollama URL should exist');
  });
  
  test('Should clear error queue', async () => {
    const error: ErrorItem = {
      id: 'test-1',
      message: 'Test',
      filePath: '/test/file.kt',
      line: 1,
      severity: 'medium',
      status: 'pending',
      timestamp: Date.now()
    };
    
    await stateManager.addError(error);
    await stateManager.clearErrorQueue();
    
    const queue = stateManager.getErrorQueue();
    assert.strictEqual(queue.length, 0, 'Queue should be empty after clear');
  });
  
  test('Should clear history', async () => {
    const historyItem: HistoryItem = {
      id: 'history-1',
      timestamp: Date.now(),
      errorId: 'test-1',
      result: {
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 90,
        iterations: 1,
        toolsUsed: []
      },
      duration: 1000
    };
    
    await stateManager.addHistoryItem(historyItem);
    await stateManager.clearHistory();
    
    const history = stateManager.getHistory();
    assert.strictEqual(history.length, 0, 'History should be empty after clear');
  });
  
  test('Should reset all state', async () => {
    // Add some data
    const error: ErrorItem = {
      id: 'test-1',
      message: 'Test',
      filePath: '/test/file.kt',
      line: 1,
      severity: 'medium',
      status: 'pending',
      timestamp: Date.now()
    };
    
    await stateManager.addError(error);
    await stateManager.reset();
    
    const state = stateManager.getState();
    assert.strictEqual(state.errorQueue.length, 0, 'Error queue should be empty');
    assert.strictEqual(state.history.length, 0, 'History should be empty');
    assert.strictEqual(state.currentError, undefined, 'Current error should be undefined');
  });
});
