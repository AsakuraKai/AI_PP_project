/**
 * Unit tests for OllamaClient
 */

import { OllamaClient } from '../../src/llm/OllamaClient';
import { LLMError } from '../../src/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('OllamaClient', () => {
  let client: OllamaClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new OllamaClient({
      baseUrl: 'http://localhost:11434',
      model: 'granite-code:8b',
      timeout: 90000,
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect()', () => {
    it('should successfully connect when model is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'granite-code:8b' },
            { name: 'llama2:7b' },
          ],
        }),
      } as Response);

      await expect(client.connect()).resolves.not.toThrow();
    });

    it('should throw LLMError when server is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.connect()).rejects.toThrow(LLMError);
      await expect(client.connect()).rejects.toThrow(/Failed to connect/);
    });

    it('should throw LLMError when model is not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama2:7b' },
          ],
        }),
      } as Response);

      await expect(client.connect()).rejects.toThrow(LLMError);
      await expect(client.connect()).rejects.toThrow(/Model granite-code:8b not found/);
    });

    it('should throw LLMError when server returns error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(client.connect()).rejects.toThrow(LLMError);
    });
  });

  describe('generate()', () => {
    beforeEach(async () => {
      // Mock successful connection
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [{ name: 'granite-code:8b' }],
        }),
      } as Response);
      await client.connect();
      mockFetch.mockClear();
    });

    it('should generate text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Generated response text',
          eval_count: 150,
        }),
      } as Response);

      const result = await client.generate('Test prompt');

      expect(result.text).toBe('Generated response text');
      expect(result.tokensUsed).toBe(150);
      expect(result.model).toBe('granite-code:8b');
      expect(result.generationTime).toBeGreaterThan(0);
    });

    it('should use custom generation options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Response',
        }),
      } as Response);

      await client.generate('Test', {
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.9,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.5'),
        })
      );
    });

    it('should retry on server errors', async () => {
      // First two attempts fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error',
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Success after retries',
          }),
        } as Response);

      const result = await client.generate('Test');

      expect(result.text).toBe('Success after retries');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw LLMError after max retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

      await expect(client.generate('Test')).rejects.toThrow(LLMError);
      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(client.generate('Test')).rejects.toThrow(LLMError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('isHealthy()', () => {
    it('should return true when server is accessible', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      } as Response);

      const healthy = await client.isHealthy();

      expect(healthy).toBe(true);
    });

    it('should return false when server is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const healthy = await client.isHealthy();

      expect(healthy).toBe(false);
    });
  });

  describe('listModels()', () => {
    it('should return list of available models', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'granite-code:8b' },
            { name: 'llama2:7b' },
            { name: 'codellama:7b' },
          ],
        }),
      } as Response);

      const models = await client.listModels();

      expect(models).toEqual([
        'granite-code:8b',
        'llama2:7b',
        'codellama:7b',
      ]);
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const models = await client.listModels();

      expect(models).toEqual([]);
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = client.getConfig();

      expect(config.baseUrl).toBe('http://localhost:11434');
      expect(config.model).toBe('granite-code:8b');
      expect(config.timeout).toBe(90000);
    });
  });
});
