"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
const zod_1 = require("zod");
/**
 * Registry for managing agent tools
 */
class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.schemas = new Map();
        this.metadata = new Map();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
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
    register(name, tool, schema, metadata) {
        if (this.tools.has(name)) {
            throw new Error(`Tool "${name}" is already registered`);
        }
        this.tools.set(name, tool);
        this.schemas.set(name, schema);
        const fullMetadata = {
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
    unregister(name) {
        const existed = this.tools.has(name);
        this.tools.delete(name);
        this.schemas.delete(name);
        this.metadata.delete(name);
        return existed;
    }
    /**
     * Check if a tool is registered
     */
    has(name) {
        return this.tools.has(name);
    }
    /**
     * Get tool instance
     */
    get(name) {
        return this.tools.get(name);
    }
    /**
     * Get tool metadata
     */
    getMetadata(name) {
        return this.metadata.get(name);
    }
    /**
     * List all registered tool names
     */
    list() {
        return Array.from(this.tools.keys());
    }
    /**
     * Get all tool metadata for LLM context
     */
    getAllMetadata() {
        return Array.from(this.metadata.values());
    }
    /**
     * Validate parameters against tool schema
     */
    validate(name, parameters) {
        const schema = this.schemas.get(name);
        if (!schema) {
            return { success: false, error: `Tool "${name}" not found` };
        }
        try {
            schema.parse(parameters);
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
    async execute(name, parameters) {
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
        }
        catch (error) {
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
    async executeParallel(calls) {
        const promises = calls.map(call => this.execute(call.name, call.parameters));
        return Promise.all(promises);
    }
    /**
     * Clear all registered tools (useful for testing)
     */
    clear() {
        this.tools.clear();
        this.schemas.clear();
        this.metadata.clear();
    }
    /**
     * Generate tool descriptions for LLM prompt
     */
    getToolDescriptions() {
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
exports.ToolRegistry = ToolRegistry;
//# sourceMappingURL=ToolRegistry.js.map