/**
 * OpenAIClient
 * Client for interacting with OpenAI API
 */

import OpenAI from 'openai';
import { CloudModel } from '../types/cloud-llm';

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Valid API key is required for OpenAIClient');
    }
    this.client = new OpenAI({ apiKey: apiKey.trim() });
  }

  /**
   * Fetches available models from OpenAI API
   * @returns List of available OpenAI models
   * @throws Error if fetching fails
   */
  async listModels(): Promise<CloudModel[]> {
    try {
      const response = await this.client.models.list();

      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response from OpenAI API: expected array of models');
      }

      // Filter for chat completion models only
      const chatModels = response.data
        .filter(model => {
          // Validate model structure
          if (!model || !model.id) {
            return false;
          }
          return (
            model.id.includes('gpt') &&
            !model.id.includes('instruct') &&
            !model.id.includes('vision')
          );
        })
        .map(model => ({
          id: model.id,
          name: this.formatModelName(model.id),
          contextWindow: this.getContextWindow(model.id),
          description: `OpenAI ${this.formatModelName(model.id)}`
        }))
        .sort((a, b) => {
          // Prioritize GPT-4 over GPT-3.5
          const priority: Record<string, number> = {
            'gpt-4': 100,
            'gpt-3.5': 50
          };

          const aPriority = Object.keys(priority).find(key => a.id.startsWith(key));
          const bPriority = Object.keys(priority).find(key => b.id.startsWith(key));

          return (priority[bPriority || ''] || 0) - (priority[aPriority || ''] || 0);
        });

      if (chatModels.length === 0) {
        throw new Error('No compatible OpenAI chat models found');
      }

      return chatModels;
    } catch (error) {
      if (error instanceof Error) {
        // Check for specific API errors
        if (error.message.includes('Incorrect API key') || error.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key. Please check your API key and try again.');
        }
        if (error.message.includes('quota') || error.message.includes('rate_limit')) {
          throw new Error('OpenAI API quota exceeded. Please try again later.');
        }
        if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
          throw new Error('Network error: Unable to reach OpenAI API. Please check your internet connection.');
        }
        throw new Error(`Failed to fetch OpenAI models: ${error.message}`);
      }
      throw new Error('Failed to fetch OpenAI models: Unknown error');
    }
  }

  /**
   * Tests connection to OpenAI API
   * @returns true if connection successful
   * @throws Error if connection test fails
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Incorrect API key') || error.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key');
        }
        if (error.message.includes('quota') || error.message.includes('rate_limit')) {
          throw new Error('OpenAI API quota exceeded');
        }
        throw new Error(`OpenAI connection test failed: ${error.message}`);
      }
      throw new Error('OpenAI connection test failed: Unknown error');
    }
  }

  /**
   * Formats model name for display
   * @param modelId - Raw model ID from API
   * @returns Formatted display name
   */
  private formatModelName(modelId: string): string {
    // Convert model IDs like "gpt-4-turbo" to "GPT-4 Turbo"
    return modelId
      .split('-')
      .map((part, index) => {
        if (index === 0) {
          return part.toUpperCase(); // GPT
        }
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  /**
   * Gets context window size for known models
   * @param modelId - Model ID
   * @returns Context window size in tokens
   */
  private getContextWindow(modelId: string): number {
    const contextWindows: Record<string, number> = {
      'gpt-4-turbo': 128000,
      'gpt-4-turbo-preview': 128000,
      'gpt-4-1106-preview': 128000,
      'gpt-4-0125-preview': 128000,
      'gpt-4': 8192,
      'gpt-4-0613': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-32k-0613': 32768,
      'gpt-3.5-turbo': 16385,
      'gpt-3.5-turbo-16k': 16385,
      'gpt-3.5-turbo-1106': 16385,
      'gpt-3.5-turbo-0125': 16385
    };

    // Find matching context window
    for (const [key, value] of Object.entries(contextWindows)) {
      if (modelId.startsWith(key)) {
        return value;
      }
    }

    // Default fallback
    return 8192;
  }
}
