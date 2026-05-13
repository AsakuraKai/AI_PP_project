/**
 * Anthropic Claude Model Configuration
 * Anthropic doesn't provide a model listing API, so we maintain a curated list
 */

import { CloudModel } from '../types/cloud-llm';

/**
 * Curated list of Claude models
 * Updated: 2026-03-30
 */
export const CLAUDE_MODELS: CloudModel[] = [
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    contextWindow: 200000,
    description: 'Most capable Claude model for complex tasks'
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    contextWindow: 200000,
    description: 'Balanced performance and speed'
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    contextWindow: 200000,
    description: 'Fast and efficient for simpler tasks'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    description: 'Previous generation Sonnet model'
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextWindow: 200000,
    description: 'Previous generation Opus model'
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    contextWindow: 200000,
    description: 'Previous generation Haiku model'
  }
];

/**
 * Gets the list of available Claude models
 * @returns List of Claude models
 */
export function getClaudeModels(): CloudModel[] {
  return [...CLAUDE_MODELS];
}

/**
 * Validates if a model ID is a valid Claude model
 * @param modelId - Model ID to validate
 * @returns true if valid
 */
export function isValidClaudeModel(modelId: string): boolean {
  return CLAUDE_MODELS.some(model => model.id === modelId);
}

/**
 * Gets a specific Claude model by ID
 * @param modelId - Model ID
 * @returns Model or undefined if not found
 */
export function getClaudeModel(modelId: string): CloudModel | undefined {
  return CLAUDE_MODELS.find(model => model.id === modelId);
}
