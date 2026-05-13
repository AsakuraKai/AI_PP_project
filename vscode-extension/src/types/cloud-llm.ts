/**
 * Cloud LLM Integration Types
 * Defines interfaces and types for third-party cloud LLM providers
 */

export type CloudProvider = 'gemini' | 'anthropic' | 'openai' | 'unknown';

export interface CloudModel {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
}

export interface CloudConfig {
  provider: CloudProvider;
  model: string;
  apiKey?: string; // Never stored in config, only in SecretStorage
}

export interface TestConnectionResult {
  success: boolean;
  latency?: number;
  error?: string;
  provider?: CloudProvider;
}

export interface ProviderDetectionResult {
  provider: CloudProvider;
  confidence: 'high' | 'medium' | 'low';
}

export interface CloudLLMResponse {
  content: string;
  model: string;
  provider: CloudProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
