/**
 * Unit tests for ToolOrchestrator (Phase 5)
 * 
 * Tests smart tool selection, parallel execution, and caching
 */

import { ToolOrchestrator, ToolExecutionPlan } from '../../../src/utils/ToolOrchestrator';
import { ToolRegistry } from '../../../src/tools/ToolRegistry';
import { ParsedError } from '../../../src/types';

describe('ToolOrchestrator', () => {
  let orchestrator: ToolOrchestrator;
  let mockRegistry: ToolRegistry;

  beforeEach(() => {
    // Create mock tool registry
    mockRegistry = {
      getTool: jest.fn((name: string) => ({
        name,
        description: `Mock ${name}`,
        execute: jest.fn(async () => ({ success: true, data: `${name} result` })),
      })),
      listTools: jest.fn(() => []),
      registerTool: jest.fn(),
    } as any;

    orchestrator = new ToolOrchestrator(mockRegistry);
  });

  afterEach(() => {
    orchestrator.clearCache();
  });

  describe('Tool Selection', () => {
    test('should select gradle tools for gradle errors', () => {
      const error: ParsedError = {
        filePath: 'build.gradle',
        line: 10,
        message: 'Could not find com.android.tools.build:gradle:8.0.0',
        type: 'gradle-dependency',
        language: 'gradle',
      };

      const plan = orchestrator.createExecutionPlan(error);

      expect(plan.parallelGroups.length).toBeGreaterThan(0);
      const allTools = plan.parallelGroups.flat();
      expect(allTools).toContain('version_lookup');
    });

    test('should select kotlin tools for NPE errors', () => {
      const error: ParsedError = {
        filePath: 'MainActivity.kt',
        line: 42,
        message: 'NullPointerException: lateinit property not initialized',
        type: 'kotlin-npe',
        language: 'kotlin',
      };

      const plan = orchestrator.createExecutionPlan(error);

      const allTools = plan.parallelGroups.flat();
      expect(allTools).toContain('language_detector');
    });

    test('should select manifest tools for manifest errors', () => {
      const error: ParsedError = {
        filePath: 'AndroidManifest.xml',
        line: 15,
        message: 'Missing permission android.permission.INTERNET',
        type: 'manifest-permission',
        language: 'xml',
      };

      const plan = orchestrator.createExecutionPlan(error);

      const allTools = plan.parallelGroups.flat();
      expect(allTools).toContain('manifest_analyzer');
    });

    test('should include common tools for all errors', () => {
      const error: ParsedError = {
        filePath: 'SomeFile.kt',
        line: 1,
        message: 'Some error',
        type: 'unknown',
        language: 'kotlin',
      };

      const plan = orchestrator.createExecutionPlan(error);

      const allTools = plan.parallelGroups.flat();
      expect(allTools).toContain('read_file');
      expect(allTools).toContain('error_parser');
    });
  });

  describe('Parallel Execution', () => {
    test('should organize tools into parallel groups', () => {
      const error: ParsedError = {
        filePath: 'build.gradle',
        line: 10,
        message: 'Gradle error',
        type: 'gradle',
        language: 'gradle',
      };

      const plan = orchestrator.createExecutionPlan(error);

      expect(plan.parallelGroups.length).toBeGreaterThanOrEqual(1);
      expect(plan.reasoning).toContain('parallel groups');
    });

    test('should execute all tools in plan', async () => {
      const error: ParsedError = {
        filePath: 'test.kt',
        line: 1,
        message: 'error',
        type: 'test',
        language: 'kotlin',
      };

      const plan = orchestrator.createExecutionPlan(error);
      const results = await orchestrator.executePlan(plan, {});

      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result).toHaveProperty('toolName');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('executionTime');
      });
    });

    test('should handle tool execution failures gracefully', async () => {
      mockRegistry.get = jest.fn(() => ({
        name: 'failing_tool',
        description: 'Mock failing tool',
        execute: jest.fn(async () => {
          throw new Error('Tool failed');
        }),
      })) as any;

      const plan: ToolExecutionPlan = {
        parallelGroups: [['failing_tool']],
        estimatedTime: 100,
        reasoning: 'Test failure handling',
      };

      const results = await orchestrator.executePlan(plan, {});

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('Caching', () => {
    test('should cache successful results', async () => {
      const executeSpy = jest.fn(async () => ({ success: true, data: 'result' }));
      mockRegistry.get = jest.fn(() => ({
        name: 'cached_tool',
        description: 'Mock cached tool',
        execute: executeSpy,
      })) as any;

      const plan: ToolExecutionPlan = {
        parallelGroups: [['cached_tool']],
        estimatedTime: 100,
        reasoning: 'Test caching',
      };

      const params = { test: 'data' };

      // First execution
      await orchestrator.executePlan(plan, params);
      expect(executeSpy).toHaveBeenCalledTimes(1);

      // Second execution (should use cache)
      await orchestrator.executePlan(plan, params);
      expect(executeSpy).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    test('should not cache failed results', async () => {
      const executeSpy = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ success: true, data: 'success' });

      mockRegistry.get = jest.fn(() => ({
        name: 'retry_tool',
        description: 'Mock retry tool',
        execute: executeSpy,
      })) as any;

      const plan: ToolExecutionPlan = {
        parallelGroups: [['retry_tool']],
        estimatedTime: 100,
        reasoning: 'Test retry',
      };

      // First execution (fails)
      await orchestrator.executePlan(plan, {});
      expect(executeSpy).toHaveBeenCalledTimes(1);

      // Second execution (should retry, not use cache)
      await orchestrator.executePlan(plan, {});
      expect(executeSpy).toHaveBeenCalledTimes(2);
    });

    test('should clear cache on demand', async () => {
      const executeSpy = jest.fn(async () => ({ success: true, data: 'result' }));
      mockRegistry.get = jest.fn(() => ({
        name: 'tool',
        description: 'Mock tool',
        execute: executeSpy,
      })) as any;

      const plan: ToolExecutionPlan = {
        parallelGroups: [['tool']],
        estimatedTime: 100,
        reasoning: 'Test cache clear',
      };

      // First execution
      await orchestrator.executePlan(plan, {});
      expect(executeSpy).toHaveBeenCalledTimes(1);

      // Clear cache
      orchestrator.clearCache();

      // Third execution (should not use cache after clear)
      await orchestrator.executePlan(plan, {});
      expect(executeSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Tracking', () => {
    test('should track execution time per tool', async () => {
      const plan: ToolExecutionPlan = {
        parallelGroups: [['read_file']],
        estimatedTime: 100,
        reasoning: 'Test timing',
      };

      const results = await orchestrator.executePlan(plan, {});

      expect(results[0].executionTime).toBeGreaterThanOrEqual(0);
    });

    test('should provide performance metrics', async () => {
      const plan: ToolExecutionPlan = {
        parallelGroups: [['read_file']],
        estimatedTime: 100,
        reasoning: 'Test metrics',
      };

      await orchestrator.executePlan(plan, {});

      const metrics = orchestrator.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Execution Plan', () => {
    test('should estimate execution time', () => {
      const error: ParsedError = {
        filePath: 'test.kt',
        line: 1,
        message: 'error',
        type: 'test',
        language: 'kotlin',
      };

      const plan = orchestrator.createExecutionPlan(error);

      expect(plan.estimatedTime).toBeGreaterThan(0);
      expect(typeof plan.estimatedTime).toBe('number');
    });

    test('should provide reasoning for tool selection', () => {
      const error: ParsedError = {
        filePath: 'build.gradle',
        line: 1,
        message: 'Gradle sync failed',
        type: 'gradle',
        language: 'gradle',
      };

      const plan = orchestrator.createExecutionPlan(error);

      expect(plan.reasoning).toBeDefined();
      expect(plan.reasoning.length).toBeGreaterThan(0);
    });
  });
});
