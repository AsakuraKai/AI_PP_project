/**
 * Provider Auto-Detection Utility
 * Detects cloud LLM provider from API key format
 */

import { CloudProvider, ProviderDetectionResult } from '../types/cloud-llm';

/**
 * Detects the cloud provider based on API key prefix patterns
 * @param apiKey - The API key to analyze
 * @returns Detection result with provider and confidence level
 */
export function detectProvider(apiKey: string): ProviderDetectionResult {
  if (!apiKey || apiKey.trim().length === 0) {
    return { provider: 'unknown', confidence: 'high' };
  }

  const trimmedKey = apiKey.trim();

  // Google Gemini: AIza...
  if (trimmedKey.startsWith('AIza')) {
    return { provider: 'gemini', confidence: 'high' };
  }

  // Anthropic Claude: sk-ant-...
  if (trimmedKey.startsWith('sk-ant-')) {
    return { provider: 'anthropic', confidence: 'high' };
  }

  // OpenAI: sk-... (but not sk-ant-)
  if (trimmedKey.startsWith('sk-') && !trimmedKey.startsWith('sk-ant-')) {
    return { provider: 'openai', confidence: 'high' };
  }

  // Unknown format
  return { provider: 'unknown', confidence: 'high' };
}

/**
 * Validates if an API key format is recognized
 * @param apiKey - The API key to validate
 * @returns true if the format is recognized
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const result = detectProvider(apiKey);
  return result.provider !== 'unknown';
}

/**
 * Gets a human-readable provider name
 * @param provider - The provider identifier
 * @returns Display name for the provider
 */
export function getProviderDisplayName(provider: CloudProvider): string {
  switch (provider) {
    case 'gemini':
      return 'Google Gemini';
    case 'anthropic':
      return 'Anthropic Claude';
    case 'openai':
      return 'OpenAI';
    case 'unknown':
      return 'Unknown Provider';
  }
}
