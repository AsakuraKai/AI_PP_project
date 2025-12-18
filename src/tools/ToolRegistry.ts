/**
 * ToolRegistry - Central registry for managing agent tools
 * 
 * Provides a unified interface for tool registration, discovery, and execution.
 * Supports dynamic tool loading and validation using Zod schemas.
 * 
 * Design Decisions:
 * - Singleton pattern for global tool access
 * - Schema validation with Zod for type safety
 * - Error handling for tool failures
 * - Tool execution logging for debugging
 * 
 * @example
 * const registry = ToolRegistry.getInstance();
 * registry.register('read_file', readFileTool, readFileSchema);
 * const result = await registry.execute('read_file', { filePath: 'test.kt', line: 10 });
 */

import { z } from 'zod';

/**
 * Tool interface that all tools must implement
 */
export interface Tool {
  /** Tool name (unique identifier) */
  name: string;
  
  /** Tool description for LLM */
  description: string;
  
  /** Execute the tool with given parameters */
  execute(parameters: Record<string, any>): Promise<any>;
}

/**
 * Tool metadata for LLM understanding
 */
export interface ToolMetadata {
  /** Tool name */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** JSON schema for parameters */
  parameterSchema: z.ZodSchema;
  
  /** Examples of tool usage */
  examples?: ToolExample[];
}

/**
 * Tool usage example
 */
export interface ToolExample {
  /** Example parameters */
  parameters: Record<string, any>;
  
  /** Expected outcome description */
  outcome: string;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  /** Whether execution succeeded */
  success: boolean;
  
  /** Result data if successful */
  data?: any;
  
  /** Error message if failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Registry for managing agent tools
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, Tool> = new Map();
  private schemas: Map<string, z.ZodSchema> = new Map();
  private metadata: Map<string, ToolMetadata> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Register a new tool
   * 
   * @param name - Unique tool name
   * @param tool - Tool implementation
   * @param schema - Zod schema for parameter validation
   * @param metadata - Optional metadata for LLM
   */
  register(
    name: string,
    tool: Tool,
    schema: z.ZodSchema,
    metadata?: Partial<ToolMetadata>
  ): void {
    if (this.tools.has(name)) {
      throw new Error(`Tool "${name}" is already registered`);
    }

    this.tools.set(name, tool);
    this.schemas.set(name, schema);
    
    const fullMetadata: ToolMetadata = {
      name,
      description: tool.description,
      parameterSchema: schema,
      examples: metadata?.examples,
    };
    this.metadata.set(name, fullMetadata);
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    const existed = this.tools.has(name);
    this.tools.delete(name);
    this.schemas.delete(name);
    this.metadata.delete(name);
    return existed;
  }

  /**
   * Check if a tool is registered
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get tool instance
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get tool metadata
   */
  getMetadata(name: string): ToolMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * List all registered tool names
   */
  list(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all tool metadata for LLM context
   */
  getAllMetadata(): ToolMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Validate parameters against tool schema
   */
  validate(name: string, parameters: Record<string, any>): { success: boolean; error?: string } {
    const schema = this.schemas.get(name);
    if (!schema) {
      return { success: false, error: `Tool "${name}" not found` };
    }

    try {
      schema.parse(parameters);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }
      return { success: false, error: 'Unknown validation error' };
    }
  }

  /**
   * Execute a tool with given parameters
   * 
   * @param name - Tool name
   * @param parameters - Tool parameters
   * @returns Tool execution result
   */
  async execute(name: string, parameters: Record<string, any>): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Check if tool exists
      const tool = this.tools.get(name);
      if (!tool) {
        return {
          success: false,
          error: `Tool "${name}" not found`,
          executionTime: Date.now() - startTime,
        };
      }

      // Validate parameters
      const validation = this.validate(name, parameters);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error,
          executionTime: Date.now() - startTime,
        };
      }

      // Execute tool
      const data = await tool.execute(parameters);

      return {
        success: true,
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute multiple tools in parallel
   * 
   * @param calls - Array of tool calls (name + parameters)
   * @returns Array of tool results
   */
  async executeParallel(
    calls: Array<{ name: string; parameters: Record<string, any> }>
  ): Promise<ToolResult[]> {
    const promises = calls.map(call => this.execute(call.name, call.parameters));
    return Promise.all(promises);
  }

  /**
   * Clear all registered tools (useful for testing)
   */
  clear(): void {
    this.tools.clear();
    this.schemas.clear();
    this.metadata.clear();
  }

  /**
   * Generate tool descriptions for LLM prompt
   */
  getToolDescriptions(): string {
    const tools = this.getAllMetadata();
    
    if (tools.length === 0) {
      return 'No tools available.';
    }

    return tools.map(tool => {
      let desc = `**${tool.name}**: ${tool.description}`;
      
      if (tool.examples && tool.examples.length > 0) {
        desc += '\nExamples:\n';
        tool.examples.forEach(example => {
          desc += `  - Parameters: ${JSON.stringify(example.parameters)}\n`;
          desc += `    Outcome: ${example.outcome}\n`;
        });
      }
      
      return desc;
    }).join('\n\n');
  }
}
