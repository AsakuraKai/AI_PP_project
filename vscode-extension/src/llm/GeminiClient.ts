/**
 * GeminiClient
 * Client for interacting with Google Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CloudModel } from '../types/cloud-llm';
import axios from 'axios';

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Valid API key is required for GeminiClient');
    }
    this.apiKey = apiKey.trim();
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Fetches available models from Google Gemini API dynamically
   * @returns List of available Gemini models
   * @throws Error if fetching fails
   */
  async listModels(): Promise<CloudModel[]> {
    try {
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      const modelsData = response.data?.models || [];

      return modelsData
        .filter((model: any) => model.name.startsWith('models/gemini'))
        .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model: any) => ({
          id: model.name.replace('models/', ''),
          name: model.displayName || this.formatModelName(model.name),
          contextWindow: model.inputTokenLimit || 0,
          description: model.description || ''
        }));
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
      // Use gemini-1.5-flash for testing as it's fast and active
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
