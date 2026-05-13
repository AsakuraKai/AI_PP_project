/**
 * SecretStorageService
 * Wrapper for VS Code SecretStorage API for secure API key management
 */

import * as vscode from 'vscode';

export class SecretStorageService {
  private static readonly CLOUD_API_KEY_PREFIX = 'rca.cloud.apiKey';

  constructor(private secretStorage: vscode.SecretStorage) {}

  /**
   * Stores an API key securely using VS Code's encrypted storage
   * @param provider - The cloud provider identifier
   * @param apiKey - The API key to store
   */
  async storeApiKey(provider: string, apiKey: string): Promise<void> {
    const key = `${SecretStorageService.CLOUD_API_KEY_PREFIX}.${provider}`;
    await this.secretStorage.store(key, apiKey);
  }

  /**
   * Retrieves an API key from secure storage
   * @param provider - The cloud provider identifier
   * @returns The API key or undefined if not found
   */
  async getApiKey(provider: string): Promise<string | undefined> {
    const key = `${SecretStorageService.CLOUD_API_KEY_PREFIX}.${provider}`;
    return await this.secretStorage.get(key);
  }

  /**
   * Deletes an API key from secure storage
   * @param provider - The cloud provider identifier
   */
  async deleteApiKey(provider: string): Promise<void> {
    const key = `${SecretStorageService.CLOUD_API_KEY_PREFIX}.${provider}`;
    await this.secretStorage.delete(key);
  }

  /**
   * Checks if an API key exists for a provider
   * @param provider - The cloud provider identifier
   * @returns true if an API key exists
   */
  async hasApiKey(provider: string): Promise<boolean> {
    const apiKey = await this.getApiKey(provider);
    return apiKey !== undefined && apiKey.length > 0;
  }
}
