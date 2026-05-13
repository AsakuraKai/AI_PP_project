/**
 * CloudLLMClient - Unified interface for cloud LLM providers
 * Provides a consistent interface for Gemini, Claude, and OpenAI
 */

import { CloudModel, CloudProvider, CloudLLMResponse } from '../types/cloud-llm';
import { GeminiClient } from './GeminiClient';
import { OpenAIClient } from './OpenAIClient';
import { getClaudeModels } from '../config/anthropic-models';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Unified interface for all cloud LLM clients
 */
export interface ICloudLLMClient {
  /**
   * List available models for this provider
   */
  listModels(): Promise<CloudModel[]>;

  /**
   * Test connection to the provider
   */
  testConnection(): Promise<boolean>;

  /**
   * Generate content using the specified model
   */
  generateContent(model: string, prompt: string): Promise<CloudLLMResponse>;
}

/**
 * Gemini client implementation
 */
class GeminiClientAdapter implements ICloudLLMClient {
  private client: GeminiClient;

  constructor(apiKey: string) {
    this.client = new GeminiClient(apiKey);
  }

  async listModels(): Promise<CloudModel[]> {
    return this.client.listModels();
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  async generateContent(model: string, prompt: string): Promise<CloudLLMResponse> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.client['client'].apiKey);
    const generativeModel = genAI.getGenerativeModel({ model });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;

    return {
      content: response.text(),
      model,
      provider: 'gemini',
      usage: {
        promptTokens: 0, // Gemini doesn't provide token counts in response
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
}

/**
 * Claude client implementation
 */
class ClaudeClientAdapter implements ICloudLLMClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Valid API key is required for ClaudeClient');
    }
    this.client = new Anthropic({ apiKey: apiKey.trim() });
  }

  async listModels(): Promise<CloudModel[]> {
    return getClaudeModels();
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test with a minimal request
      await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid Anthropic API key');
        }
        if (error.message.includes('quota') || error.message.includes('rate_limit')) {
          throw new Error('Anthropic API quota exceeded');
        }
        throw new Error(`Claude connection test failed: ${error.message}`);
      }
      throw new Error('Claude connection test failed: Unknown error');
    }
  }

  async generateContent(model: string, prompt: string): Promise<CloudLLMResponse> {
    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return {
      content: text,
      model,
      provider: 'anthropic',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  }
}

/**
 * OpenAI client implementation
 */
class OpenAIClientAdapter implements ICloudLLMClient {
  private client: OpenAIClient;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAIClient(apiKey);
  }

  async listModels(): Promise<CloudModel[]> {
    return this.client.listModels();
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  async generateContent(model: string, prompt: string): Promise<CloudLLMResponse> {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: this.apiKey });

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096
    });

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      model,
      provider: 'openai',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  }
}

/**
 * Factory function to create appropriate cloud LLM client
 */
export function createCloudLLMClient(provider: CloudProvider, apiKey: string): ICloudLLMClient {
  switch (provider) {
    case 'gemini':
      return new GeminiClientAdapter(apiKey);
    case 'anthropic':
      return new ClaudeClientAdapter(apiKey);
    case 'openai':
      return new OpenAIClientAdapter(apiKey);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Export client adapters for testing
 */
export { GeminiClientAdapter, ClaudeClientAdapter, OpenAIClientAdapter };
