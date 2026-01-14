/**
 * Shared Tool Types - Common interfaces for both backend and extension tools
 * 
 * This file provides a single source of truth for tool-related types,
 * reducing duplication across the codebase.
 * 
 * @module shared-types
 */

/**
 * Base Tool interface that all tools should implement
 */
export interface BaseTool<TParams = any, TResult = any> {
  /** Unique tool identifier */
  name: string;
  
  /** Human-readable description for LLM/UI */
  description: string;
  
  /** Execute the tool with given parameters */
  execute(params: TParams): Promise<TResult>;
}

/**
 * Tool metadata for registration and documentation
 */
export interface BaseToolMetadata {
  /** Tool name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Tool category for organization */
  category?: ToolCategory;
  
  /** Parameter schema (can be Zod or JSON schema) */
  parameterSchema?: any;
  
  /** Usage examples */
  examples?: ToolExample[];
}

/**
 * Tool category for classification
 */
export type ToolCategory = 
  | 'file'
  | 'terminal'
  | 'gradle'
  | 'version'
  | 'analysis'
  | 'workspace'
  | 'search'
  | 'android';

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
 * Tool execution result (standardized)
 */
export interface ToolExecutionResult<TResult = any> {
  /** Whether execution succeeded */
  success: boolean;
  
  /** Result data if successful */
  result?: TResult;
  
  /** Error message if failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Tool execution context (optional context for execution)
 */
export interface ToolExecutionContext {
  /** Workspace path */
  workspacePath?: string;
  
  /** User ID or session */
  userId?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}
