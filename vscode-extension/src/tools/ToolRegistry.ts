/**
 * Tool Registry - Central registry for all tools available to the chat participant
 * Manages tool registration, execution, and metadata
 */

export interface ToolMetadata {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required: boolean;
    };
  };
  category: 'file' | 'terminal' | 'gradle' | 'version' | 'analysis' | 'workspace';
}

export interface Tool<TParams = any, TResult = any> {
  name: string;
  description: string;
  metadata: ToolMetadata;
  execute(params: TParams): Promise<TResult>;
}

export interface ToolExecutionResult<TResult = any> {
  success: boolean;
  result?: TResult;
  error?: string;
  executionTime: number;
}

/**
 * Central tool registry for the RCA Agent
 */
export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private executionHistory: Array<{
    toolName: string;
    timestamp: Date;
    success: boolean;
    duration: number;
  }> = [];

  /**
   * Register a new tool
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): boolean {
    return this.tools.delete(toolName);
  }

  /**
   * Check if a tool exists
   */
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get a specific tool
   */
  get(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Execute a tool with the given parameters
   */
  async execute<TParams = any, TResult = any>(
    toolName: string,
    params: TParams
  ): Promise<ToolExecutionResult<TResult>> {
    const startTime = Date.now();
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        executionTime: 0
      };
    }

    try {
      const result = await tool.execute(params);
      const executionTime = Date.now() - startTime;

      // Record execution
      this.executionHistory.push({
        toolName,
        timestamp: new Date(),
        success: true,
        duration: executionTime
      });

      return {
        success: true,
        result,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Record failure
      this.executionHistory.push({
        toolName,
        timestamp: new Date(),
        success: false,
        duration: executionTime
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime
      };
    }
  }

  /**
   * Get all available tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): Tool[] {
    return this.getAll().filter(tool => tool.metadata.category === category);
  }

  /**
   * Get tool metadata for all registered tools
   */
  getAllMetadata(): ToolMetadata[] {
    return this.getAll().map(tool => tool.metadata);
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    toolUsageCounts: Record<string, number>;
  } {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(e => e.success).length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
    
    const totalTime = this.executionHistory.reduce((sum, e) => sum + e.duration, 0);
    const averageExecutionTime = totalExecutions > 0 ? totalTime / totalExecutions : 0;

    const toolUsageCounts: Record<string, number> = {};
    this.executionHistory.forEach(e => {
      toolUsageCounts[e.toolName] = (toolUsageCounts[e.toolName] || 0) + 1;
    });

    return {
      totalExecutions,
      successRate,
      averageExecutionTime,
      toolUsageCounts
    };
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Get recent execution history
   */
  getRecentHistory(limit: number = 10): Array<{
    toolName: string;
    timestamp: Date;
    success: boolean;
    duration: number;
  }> {
    return this.executionHistory.slice(-limit);
  }
}

/**
 * Singleton instance
 */
let registryInstance: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registryInstance) {
    registryInstance = new ToolRegistry();
  }
  return registryInstance;
}
