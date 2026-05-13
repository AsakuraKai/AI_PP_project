/**
 * CloudLLMService
 * Main service for managing cloud LLM provider configuration and operations
 */

import * as vscode from 'vscode';
import { CloudProvider, CloudConfig, CloudModel, TestConnectionResult } from '../types/cloud-llm';
import { SecretStorageService } from './SecretStorageService';
import { detectProvider, getProviderDisplayName } from '../utils/detectProvider';
import { GeminiClient } from '../llm/GeminiClient';
import { OpenAIClient } from '../llm/OpenAIClient';
import { getClaudeModels } from '../config/anthropic-models';

export class CloudLLMService {
  private static readonly CONFIG_KEY = 'rca.cloud.config';
  private secretStorageService: SecretStorageService;

  constructor(
    private context: vscode.ExtensionContext,
    secretStorage: vscode.SecretStorage
  ) {
    this.secretStorageService = new SecretStorageService(secretStorage);
  }

  /**
   * Detects provider from API key and stores both key and config
   * @param apiKey - The API key to store
   * @param model - The selected model ID
   * @returns The detected provider
   * @throws Error if API key or model is invalid
   */
  async saveCloudConfig(apiKey: string, model: string): Promise<CloudProvider> {
    // Validate inputs
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('API key is required and must be a non-empty string');
    }

    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      throw new Error('Model is required and must be a non-empty string');
    }

    // Trim whitespace from inputs
    apiKey = apiKey.trim();
    model = model.trim();

    const detection = detectProvider(apiKey);
    const provider = detection.provider;

    if (provider === 'unknown') {
      throw new Error('Unable to detect provider from API key format. Supported formats: Google (AIza...), Anthropic (sk-ant-...), OpenAI (sk-...)');
    }

    try {
      // Store API key securely
      await this.secretStorageService.storeApiKey(provider, apiKey);

      // Store config (without API key)
      const config: CloudConfig = {
        provider,
        model
      };
      await this.context.globalState.update(CloudLLMService.CONFIG_KEY, config);

      return provider;
    } catch (error) {
      // Rollback on failure
      try {
        await this.secretStorageService.deleteApiKey(provider);
      } catch (rollbackError) {
        console.error('[CloudLLMService] Failed to rollback API key storage:', rollbackError);
      }
      throw new Error(`Failed to save cloud configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves the current cloud configuration
   * @returns The cloud config or undefined if not configured
   */
  async getCloudConfig(): Promise<CloudConfig | undefined> {
    return this.context.globalState.get<CloudConfig>(CloudLLMService.CONFIG_KEY);
  }

  /**
   * Retrieves the API key for the currently configured provider
   * @returns The API key or undefined if not found
   */
  async getApiKey(): Promise<string | undefined> {
    const config = await this.getCloudConfig();
    if (!config) {
      return undefined;
    }
    return await this.secretStorageService.getApiKey(config.provider);
  }

  /**
   * Tests connection to the cloud provider
   * @param apiKey - The API key to test
   * @param model - The model to test with
   * @returns Test result with success status and latency
   */
  async testConnection(apiKey: string, model: string): Promise<TestConnectionResult> {
    // Validate inputs
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return {
        success: false,
        error: 'API key is required and must be a non-empty string'
      };
    }

    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      return {
        success: false,
        error: 'Model is required and must be a non-empty string'
      };
    }

    apiKey = apiKey.trim();
    model = model.trim();

    const detection = detectProvider(apiKey);
    const provider = detection.provider;

    if (provider === 'unknown') {
      return {
        success: false,
        error: 'Unknown API key format. Supported: Google (AIza...), Anthropic (sk-ant-...), OpenAI (sk-...)'
      };
    }

    const startTime = Date.now();
    const timeout = 30000; // 30 second timeout

    try {
      let connectionSuccess = false;

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timed out after 30 seconds')), timeout);
      });

      // Race between connection test and timeout
      const testPromise = (async () => {
        switch (provider) {
          case 'gemini':
            const geminiClient = new GeminiClient(apiKey);
            return await geminiClient.testConnection();
          case 'openai':
            const openaiClient = new OpenAIClient(apiKey);
            return await openaiClient.testConnection();
          case 'anthropic':
            // Anthropic doesn't have a simple test endpoint, so we'll just validate the key format
            return true;
          default:
            return false;
        }
      })();

      connectionSuccess = await Promise.race([testPromise, timeoutPromise]);

      const latency = Date.now() - startTime;

      return {
        success: connectionSuccess,
        latency,
        provider
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        provider,
        latency
      };
    }
  }

  /**
   * Fetches available models from the provider
   * @param apiKey - The API key to use
   * @returns List of available models
   * @throws Error if API key is invalid or model fetching fails
   */
  async fetchAvailableModels(apiKey: string): Promise<CloudModel[]> {
    // Validate input
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('API key is required and must be a non-empty string');
    }

    apiKey = apiKey.trim();

    const detection = detectProvider(apiKey);
    const provider = detection.provider;

    if (provider === 'unknown') {
      throw new Error('Unknown API key format. Supported formats: Google (AIza...), Anthropic (sk-ant-...), OpenAI (sk-...)');
    }

    const timeout = 30000; // 30 second timeout

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Model fetching timed out after 30 seconds')), timeout);
      });

      // Race between model fetching and timeout
      const fetchPromise = (async () => {
        switch (provider) {
          case 'gemini':
            const geminiClient = new GeminiClient(apiKey);
            return await geminiClient.listModels();

          case 'openai':
            const openaiClient = new OpenAIClient(apiKey);
            return await openaiClient.listModels();

          case 'anthropic':
            // Anthropic doesn't provide a model listing API
            return getClaudeModels();

          default:
            return [];
        }
      })();

      const models = await Promise.race([fetchPromise, timeoutPromise]);

      // Validate returned models
      if (!Array.isArray(models)) {
        throw new Error('Invalid response from provider: expected array of models');
      }

      // Filter out invalid models
      const validModels = models.filter(model =>
        model &&
        typeof model.id === 'string' &&
        typeof model.name === 'string' &&
        typeof model.contextWindow === 'number' &&
        model.id.length > 0 &&
        model.name.length > 0 &&
        model.contextWindow > 0
      );

      if (validModels.length === 0 && models.length > 0) {
        throw new Error('No valid models found in provider response');
      }

      return validModels;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch models from ${provider}: ${errorMessage}`);
    }
  }

  /**
   * Clears all cloud configuration and stored API keys
   * @throws Error if clearing fails
   */
  async clearCloudConfig(): Promise<void> {
    try {
      const config = await this.getCloudConfig();
      if (config) {
        try {
          await this.secretStorageService.deleteApiKey(config.provider);
        } catch (error) {
          console.error('[CloudLLMService] Failed to delete API key:', error);
          // Continue to clear config even if API key deletion fails
        }
      }
      await this.context.globalState.update(CloudLLMService.CONFIG_KEY, undefined);
    } catch (error) {
      throw new Error(`Failed to clear cloud configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if cloud LLM is currently configured
   * @returns true if configured
   */
  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.getCloudConfig();
      if (!config) {
        return false;
      }
      return await this.secretStorageService.hasApiKey(config.provider);
    } catch (error) {
      console.error('[CloudLLMService] Error checking configuration status:', error);
      return false;
    }
  }

  /**
   * Gets a configured cloud LLM client
   * @returns Cloud LLM client or undefined if not configured
   */
  async getCloudClient(): Promise<any | undefined> {
    try {
      const config = await this.getCloudConfig();
      if (!config) {
        return undefined;
      }

      const apiKey = await this.getApiKey();
      if (!apiKey) {
        return undefined;
      }

      const { createCloudLLMClient } = await import('../llm/CloudLLMClient');
      return createCloudLLMClient(config.provider, apiKey);
    } catch (error) {
      console.error('[CloudLLMService] Error getting cloud client:', error);
      return undefined;
    }
  }

  /**
   * Validates a model ID for the given provider
   * @param provider - The cloud provider
   * @param modelId - The model ID to validate
   * @returns true if valid
   */
  async validateModel(provider: CloudProvider, modelId: string): Promise<boolean> {
    if (!modelId || typeof modelId !== 'string' || modelId.trim().length === 0) {
      return false;
    }

    try {
      // For Anthropic, check against hardcoded list
      if (provider === 'anthropic') {
        const models = getClaudeModels();
        return models.some(m => m.id === modelId.trim());
      }

      // For other providers, we'd need to fetch models (requires API key)
      // This is a basic validation
      return true;
    } catch (error) {
      console.error('[CloudLLMService] Error validating model:', error);
      return false;
    }
  }
}
