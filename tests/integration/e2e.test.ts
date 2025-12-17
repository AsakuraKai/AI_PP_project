/**
 * End-to-End Integration Tests for RCA Agent MVP
 * 
 * Tests the complete flow: Parse → Analyze → Result
 * Validates MVP functionality with real Kotlin error examples.
 * 
 * Chunk 1.5: MVP Testing & Refinement
 */

import { KotlinNPEParser } from '../../src/utils/KotlinNPEParser';
import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ReadFileTool } from '../../src/tools/ReadFileTool';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock OllamaClient for tests
jest.mock('../../src/llm/OllamaClient');

describe('End-to-End Integration Tests', () => {
  let parser: KotlinNPEParser;
  let agent: MinimalReactAgent;
  let mockLLM: jest.Mocked<OllamaClient>;
  let readFileTool: ReadFileTool;
  let tempDir: string;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'e2e-test-'));
  });

  afterAll(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    parser = new KotlinNPEParser();
    readFileTool = new ReadFileTool();

    // Create mock LLM
    mockLLM = new OllamaClient() as jest.Mocked<OllamaClient>;
    agent = new MinimalReactAgent(mockLLM, readFileTool);
  });

  describe('Complete Workflow: Parse → Analyze → Result', () => {
    it('should successfully analyze lateinit property error', async () => {
      // 1. Parse error
      const errorText = `
        kotlin.UninitializedPropertyAccessException: 
        lateinit property user has not been initialized
        at com.example.MainActivity.onCreate(MainActivity.kt:45)
      `.trim();

      const parsedError = parser.parse(errorText);
      expect(parsedError).not.toBeNull();
      expect(parsedError?.type).toBe('lateinit');

      // 2. Create test source file
      const testFile = path.join(tempDir, 'MainActivity.kt');
      const sourceCode = `
package com.example

import android.os.Bundle

class MainActivity : AppCompatActivity() {
    private lateinit var user: User
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // ERROR: Accessing user before initialization
        val name = user.name
        
        // Should initialize here first:
        // user = User("John", "Doe")
    }
}
      `.trim();
      await fs.writeFile(testFile, sourceCode, 'utf-8');

      // Update parsed error with test file path
      parsedError!.filePath = testFile;

      // 3. Mock LLM responses
      mockLLM.generate
        .mockResolvedValueOnce({
          text: 'Initial hypothesis: The lateinit property "user" is being accessed before initialization in onCreate(). This violates Kotlin\'s lateinit contract.',
          model: 'test-model',
        })
        .mockResolvedValueOnce({
          text: 'Deeper analysis: Looking at the code, line 13 accesses user.name, but user is never initialized before this point. The lateinit keyword defers initialization, but the developer must ensure initialization happens before first access.',
          model: 'test-model',
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            rootCause: 'The lateinit property "user" is accessed at line 13 before it is initialized. Lateinit properties must be explicitly initialized before first use.',
            fixGuidelines: [
              'Initialize the user property before accessing it in onCreate()',
              'Add: user = User("John", "Doe") before line 13',
              'Alternatively, use nullable type (var user: User?) and check for null before access',
            ],
            confidence: 0.9,
          }),
          model: 'test-model',
        });

      // 4. Analyze
      const result = await agent.analyze(parsedError!);

      // 5. Validate result
      expect(result).toBeDefined();
      expect(result.rootCause).toContain('lateinit');
      expect(result.rootCause).toContain('initialized');
      expect(result.fixGuidelines).toHaveLength(3);
      expect(result.fixGuidelines[0]).toContain('Initialize');
      expect(result.confidence).toBeGreaterThan(0.5);

      // Verify LLM was called 3 times (3 iterations)
      expect(mockLLM.generate).toHaveBeenCalledTimes(3);
    });

    it('should handle NullPointerException with code context', async () => {
      // 1. Parse error
      const errorText = `
        NullPointerException: Attempt to invoke virtual method 'getName()' on a null object
        at com.example.UserRepository.getUserName(UserRepository.kt:23)
      `.trim();

      const parsedError = parser.parse(errorText);
      expect(parsedError).not.toBeNull();
      expect(parsedError?.type).toBe('npe');

      // 2. Create test source file
      const testFile = path.join(tempDir, 'UserRepository.kt');
      const sourceCode = `
package com.example

class UserRepository {
    private var currentUser: User? = null
    
    fun loadUser(id: String) {
        // Simulated API call
        // currentUser = api.getUser(id)
    }
    
    fun getUserName(): String {
        // ERROR: currentUser might be null
        return currentUser.getName()
    }
}
      `.trim();
      await fs.writeFile(testFile, sourceCode, 'utf-8');

      parsedError!.filePath = testFile;

      // 3. Mock LLM responses
      mockLLM.generate
        .mockResolvedValueOnce({
          text: 'Hypothesis: A null pointer exception suggests that currentUser is null when getName() is called.',
          model: 'test-model',
        })
        .mockResolvedValueOnce({
          text: 'Analysis: The code shows currentUser is nullable (User?), but line 13 accesses it without null check. The loadUser method is commented out, so currentUser remains null.',
          model: 'test-model',
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            rootCause: 'The nullable property currentUser is accessed without null-safety check at line 13. Kotlin\'s null safety is bypassed, leading to NPE.',
            fixGuidelines: [
              'Use safe call operator: currentUser?.getName() ?: "Unknown"',
              'Add null check: if (currentUser != null) return currentUser.getName()',
              'Ensure loadUser() is called before getUserName()',
            ],
            confidence: 0.85,
          }),
          model: 'test-model',
        });

      // 4. Analyze
      const result = await agent.analyze(parsedError!);

      // 5. Validate
      expect(result.rootCause).toContain('null');
      expect(result.fixGuidelines.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle errors when file cannot be read', async () => {
      // Parse error
      const errorText = `
        lateinit property data has not been initialized
        at com.example.DataManager.kt:10
      `.trim();

      const parsedError = parser.parse(errorText);
      expect(parsedError).not.toBeNull();

      // Don't create the file - should handle gracefully
      parsedError!.filePath = '/nonexistent/DataManager.kt';

      // Mock LLM responses
      mockLLM.generate
        .mockResolvedValueOnce({
          text: 'Hypothesis: lateinit property not initialized',
          model: 'test-model',
        })
        .mockResolvedValueOnce({
          text: 'Analysis: Unable to access file for code context, but error pattern suggests standard lateinit issue',
          model: 'test-model',
        })
        .mockResolvedValueOnce({
          text: JSON.stringify({
            rootCause: 'Lateinit property accessed before initialization',
            fixGuidelines: ['Initialize the property before use'],
            confidence: 0.6,
          }),
          model: 'test-model',
        });

      // Should not crash, just continue without file context
      const result = await agent.analyze(parsedError!);

      expect(result).toBeDefined();
      expect(result.rootCause.toLowerCase()).toContain('lateinit');
    });

    it('should complete analysis within timeout', async () => {
      const errorText = 'lateinit property user has not been initialized at Test.kt:5';
      const parsedError = parser.parse(errorText);

      // Mock fast LLM responses
      mockLLM.generate
        .mockResolvedValue({
          text: JSON.stringify({
            rootCause: 'Property not initialized',
            fixGuidelines: ['Initialize before use'],
            confidence: 0.7,
          }),
          model: 'test-model',
        });

      const startTime = Date.now();
      await agent.analyze(parsedError!);
      const duration = Date.now() - startTime;

      // Should complete well under 90s timeout
      expect(duration).toBeLessThan(90000);
    });

    it('should handle malformed LLM output gracefully', async () => {
      const errorText = 'lateinit property user has not been initialized at Test.kt:5';
      const parsedError = parser.parse(errorText);

      // Mock malformed responses
      mockLLM.generate
        .mockResolvedValueOnce({ text: 'Hypothesis text', model: 'test-model' })
        .mockResolvedValueOnce({ text: 'Analysis text', model: 'test-model' })
        .mockResolvedValueOnce({
          text: 'This is not valid JSON at all!',
          model: 'test-model',
        });

      const result = await agent.analyze(parsedError!);

      // Should use fallback result
      expect(result).toBeDefined();
      expect(result.confidence).toBe(0.3); // Low confidence for fallback
      expect(result.fixGuidelines.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should track analysis latency', async () => {
      const errorText = 'lateinit property test has not been initialized\nat com.example.Test.kt:1';
      const parsedError = parser.parse(errorText);
      expect(parsedError).not.toBeNull();

      mockLLM.generate.mockResolvedValue({
        text: JSON.stringify({
          rootCause: 'Test',
          fixGuidelines: ['Fix'],
          confidence: 0.7,
        }),
        model: 'test-model',
      });

      const startTime = Date.now();
      await agent.analyze(parsedError!);
      const latency = Date.now() - startTime;

      // Latency should be reasonable (< 5s for mocked LLM)
      expect(latency).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    it('should propagate LLM errors correctly', async () => {
      const errorText = 'lateinit property test has not been initialized\nat com.example.Test.kt:1';
      const parsedError = parser.parse(errorText);
      expect(parsedError).not.toBeNull();

      // Mock LLM failure
      mockLLM.generate.mockRejectedValue(new Error('LLM connection failed'));

      await expect(agent.analyze(parsedError!)).rejects.toThrow('LLM');
    });

    it('should handle parser returning null', () => {
      const invalidError = 'This is not a Kotlin error';
      const result = parser.parse(invalidError);

      expect(result).toBeNull();
    });
  });

  describe('Code Context Integration', () => {
    it('should include file content in analysis prompts', async () => {
      const errorText = 'lateinit property user has not been initialized\nat com.example.MainActivity.kt:10';
      const parsedError = parser.parse(errorText);
      expect(parsedError).not.toBeNull();

      // Create source file
      const testFile = path.join(tempDir, 'MainActivity.kt');
      await fs.writeFile(testFile, 'lateinit var user: User\nval name = user.name', 'utf-8');
      parsedError!.filePath = testFile;

      mockLLM.generate.mockResolvedValue({
        text: JSON.stringify({
          rootCause: 'Test',
          fixGuidelines: ['Fix'],
          confidence: 0.7,
        }),
        model: 'test-model',
      });

      await agent.analyze(parsedError!);

      // Verify that at least one prompt included code context
      const calls = mockLLM.generate.mock.calls;
      const hasCodeContext = calls.some(call => {
        const prompt = call[0];
        return prompt.includes('CODE CONTEXT:') || prompt.includes('Line');
      });

      expect(hasCodeContext).toBe(true);
    });
  });
});
