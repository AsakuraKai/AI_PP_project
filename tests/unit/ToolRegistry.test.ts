/**
 * Tests for ToolRegistry
 */

import { z } from 'zod';
import { ToolRegistry, Tool } from '../../src/tools/ToolRegistry';

// Mock tool for testing
class MockTool implements Tool {
  name = 'mock_tool';
  description = 'A mock tool for testing';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(parameters: Record<string, any>): Promise<any> {
    // Return parameters in result to verify they were passed correctly
    return { result: 'success', params: parameters };
  }
}

class FailingTool implements Tool {
  name = 'failing_tool';
  description = 'A tool that fails';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  async execute(_parameters: Record<string, any>): Promise<any> {
    throw new Error('Tool execution failed');
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  const mockSchema = z.object({
    param1: z.string(),
    param2: z.number().optional(),
  });

  beforeEach(() => {
    registry = ToolRegistry.getInstance();
    registry.clear(); // Clear any previous registrations
  });

  describe('registration', () => {
    it('should register a tool successfully', () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      expect(registry.has('mock')).toBe(true);
      expect(registry.list()).toContain('mock');
    });

    it('should throw error when registering duplicate tool', () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      expect(() => {
        registry.register('mock', tool, mockSchema);
      }).toThrow('Tool "mock" is already registered');
    });

    it('should unregister a tool', () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      expect(registry.has('mock')).toBe(true);
      const removed = registry.unregister('mock');

      expect(removed).toBe(true);
      expect(registry.has('mock')).toBe(false);
    });

    it('should return false when unregistering non-existent tool', () => {
      const removed = registry.unregister('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('tool retrieval', () => {
    it('should get registered tool', () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      const retrieved = registry.get('mock');
      expect(retrieved).toBe(tool);
    });

    it('should return undefined for non-existent tool', () => {
      const retrieved = registry.get('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should list all registered tools', () => {
      const tool1 = new MockTool();
      const tool2 = new MockTool();

      registry.register('tool1', tool1, mockSchema);
      registry.register('tool2', tool2, mockSchema);

      const list = registry.list();
      expect(list).toHaveLength(2);
      expect(list).toContain('tool1');
      expect(list).toContain('tool2');
    });

    it('should get metadata for a tool', () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema, {
        examples: [{ parameters: { param1: 'test' }, outcome: 'success' }],
      });

      const metadata = registry.getMetadata('mock');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('mock');
      expect(metadata?.description).toBe('A mock tool for testing');
      expect(metadata?.examples).toHaveLength(1);
    });

    it('should get all metadata', () => {
      const tool1 = new MockTool();
      const tool2 = new MockTool();

      registry.register('tool1', tool1, mockSchema);
      registry.register('tool2', tool2, mockSchema);

      const allMetadata = registry.getAllMetadata();
      expect(allMetadata).toHaveLength(2);
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);
    });

    it('should validate correct parameters', () => {
      const result = registry.validate('mock', { param1: 'test', param2: 42 });
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate parameters without optional fields', () => {
      const result = registry.validate('mock', { param1: 'test' });
      expect(result.success).toBe(true);
    });

    it('should reject missing required parameters', () => {
      const result = registry.validate('mock', { param2: 42 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameters');
    });

    it('should reject wrong parameter types', () => {
      const result = registry.validate('mock', { param1: 123 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameters');
    });

    it('should fail validation for non-existent tool', () => {
      const result = registry.validate('nonexistent', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('execution', () => {
    it('should execute tool successfully', async () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      const result = await registry.execute('mock', { param1: 'test', param2: 42 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'success', params: { param1: 'test', param2: 42 } });
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should return error for non-existent tool', async () => {
      const result = await registry.execute('nonexistent', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error for invalid parameters', async () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      const result = await registry.execute('mock', { param2: 42 }); // Missing param1

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid parameters');
    });

    it('should handle tool execution errors', async () => {
      const tool = new FailingTool();
      registry.register('failing', tool, z.object({}));

      const result = await registry.execute('failing', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool execution failed');
    });

    it('should measure execution time', async () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      const result = await registry.execute('mock', { param1: 'test' });

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.executionTime).toBeLessThan(1000); // Should be fast
    });
  });

  describe('parallel execution', () => {
    it('should execute multiple tools in parallel', async () => {
      const tool = new MockTool();
      registry.register('mock', tool, mockSchema);

      const calls = [
        { name: 'mock', parameters: { param1: 'test1' } },
        { name: 'mock', parameters: { param1: 'test2' } },
        { name: 'mock', parameters: { param1: 'test3' } },
      ];

      const results = await registry.executeParallel(calls);

      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.data.params.param1).toBe(`test${i + 1}`);
      });
    });

    it('should handle mixed success and failure in parallel', async () => {
      const mockTool = new MockTool();
      const failingTool = new FailingTool();

      registry.register('mock', mockTool, mockSchema);
      registry.register('failing', failingTool, z.object({}));

      const calls = [
        { name: 'mock', parameters: { param1: 'test' } },
        { name: 'failing', parameters: {} },
        { name: 'mock', parameters: { param1: 'test2' } },
      ];

      const results = await registry.executeParallel(calls);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('tool descriptions', () => {
    it('should generate tool descriptions for LLM', () => {
      const tool1 = new MockTool();
      const tool2 = new MockTool();

      registry.register('tool1', tool1, mockSchema, {
        examples: [
          { parameters: { param1: 'test' }, outcome: 'success' },
        ],
      });
      registry.register('tool2', tool2, mockSchema);

      const descriptions = registry.getToolDescriptions();

      expect(descriptions).toContain('tool1');
      expect(descriptions).toContain('tool2');
      expect(descriptions).toContain('A mock tool for testing');
      expect(descriptions).toContain('Examples:');
    });

    it('should return message when no tools registered', () => {
      const descriptions = registry.getToolDescriptions();
      expect(descriptions).toBe('No tools available.');
    });
  });

  describe('clear', () => {
    it('should clear all registered tools', () => {
      const tool1 = new MockTool();
      const tool2 = new MockTool();

      registry.register('tool1', tool1, mockSchema);
      registry.register('tool2', tool2, mockSchema);

      expect(registry.list()).toHaveLength(2);

      registry.clear();

      expect(registry.list()).toHaveLength(0);
      expect(registry.has('tool1')).toBe(false);
      expect(registry.has('tool2')).toBe(false);
    });
  });
});
