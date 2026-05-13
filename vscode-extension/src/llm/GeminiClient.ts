/**
 * GeminiClient
 * Client for interacting with Google Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CloudModel } from '../types/cloud-llm';

export class GeminiClient {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Valid API key is required for GeminiClient');
    }
    this.client = new GoogleGenerativeAI(apiKey.trim());
  }

  /**
   * Fetches available models from Google Gemini API
   * @returns List of available Gemini models
   * @throws Error if fetching fails
   */
  async listModels(): Promise<CloudModel[]> {
    try {
      // Google Generative AI SDK doesn't provide a simple listModels method
      // Return a curated list of known Gemini models
      const knownModels: CloudModel[] = [
        {
          id: 'gemini-2.0-flash-exp',
          name: 'Gemini 2.0 Flash (Experimental)',
          contextWindow: 1000000,
          description: 'Latest experimental Gemini 2.0 Flash model'
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          contextWindow: 2000000,
          description: 'Most capable Gemini 1.5 model'
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          contextWindow: 1000000,
          description: 'Fast and efficient Gemini 1.5 model'
        },
        {
          id: 'gemini-1.5-flash-8b',
          name: 'Gemini 1.5 Flash 8B',
          contextWindow: 1000000,
          description: 'Smaller, faster Gemini 1.5 Flash variant'
        },
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          contextWindow: 32000,
          description: 'Standard Gemini Pro model'
        }
      ];

      return knownModels;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch Gemini models: ${error.message}`);
      }
      throw new Error('Failed to fetch Gemini models: Unknown error');
    }
  }

  /**
   * Tests connection to Gemini API
   * @returns true if connection successful
   * @throws Error if connection test fails
   */
  async testConnection(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('test');
      return !!result.response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid Gemini API key');
        }
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new Error('Gemini API quota exceeded');
        }
        throw new Error(`Gemini connection test failed: ${error.message}`);
      }
      throw new Error('Gemini connection test failed: Unknown error');
    }
  }

  /**
   * Formats model name for display
   * @param modelName - Raw model name from API
   * @returns Formatted display name
   */
  private formatModelName(modelName: string): string {
    const name = modelName.replace('models/', '');

    // Convert kebab-case to Title Case
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
