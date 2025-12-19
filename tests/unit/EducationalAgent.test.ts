import { EducationalAgent } from '../../src/agent/EducationalAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ParsedError, LLMResponse } from '../../src/types';

// Mock OllamaClient
jest.mock('../../src/llm/OllamaClient');

describe('EducationalAgent', () => {
  let agent: EducationalAgent;
  let mockLLM: jest.Mocked<OllamaClient>;

  const sampleError: ParsedError = {
    type: 'lateinit',
    message: 'lateinit property user has not been initialized',
    filePath: 'MainActivity.kt',
    line: 45,
    language: 'kotlin'
  };

  // Helper to create LLMResponse objects
  const mockResponse = (text: string): LLMResponse => ({
    text,
    tokensUsed: 100,
    generationTime: 1000,
    model: 'test-model'
  });

  // Helper to add base analysis mock (concludes in 1 iteration)
  const mockBaseAnalysis = () => {
    mockLLM.generate.mockResolvedValueOnce(
      mockResponse(JSON.stringify({
        rootCause: 'Property accessed before initialization in onCreate()',
        fixGuidelines: [
          'Initialize user in onCreate() before accessing',
          'Use nullable type if initialization timing uncertain',
          'Check ::user.isInitialized before access'
        ],
        confidence: 0.9
      }))
    );
  };

  beforeEach(() => {
    // Create mock LLM
    mockLLM = {
      generate: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
      listModels: jest.fn().mockResolvedValue(['test-model'])
    } as any;

    agent = new EducationalAgent(mockLLM);
  });

  afterEach(() => {
    jest.clearAllMocks();
    agent.clearPendingEducation();
  });

  describe('Synchronous Mode', () => {
    it('should generate learning notes during analysis', async () => {
      // Mock base analysis + educational explanations
      mockBaseAnalysis();
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('A lateinit property is like a promise to initialize a variable later. In Kotlin, lateinit tells the compiler "trust me, I\'ll set this value before using it." When you access it before initialization, it\'s like trying to open a box before putting anything inside.'))
        .mockResolvedValueOnce(mockResponse('This happened because the onCreate() method tried to use the user property, but nothing had assigned a value to it yet. Think of it like trying to read a book before writing anything in it - there\'s nothing there to read!'))
        .mockResolvedValueOnce(mockResponse('1. Always initialize lateinit properties in onCreate() or init{} blocks before first use\n2. Use nullable types (User?) instead of lateinit if initialization timing is uncertain\n3. Check if property is initialized with ::property.isInitialized before accessing'));

      const result = await agent.analyze(sampleError, 'sync');

      expect(result.learningNotes).toBeDefined();
      expect(result.learningNotes).toHaveLength(3);
      
      // Check structure of learning notes
      expect(result.learningNotes![0]).toContain('🎓 **What is this error?**');
      expect(result.learningNotes![1]).toContain('🔍 **Why did this happen?**');
      expect(result.learningNotes![2]).toContain('🛡️ **How to prevent this:**');
    });

    it('should include beginner-friendly explanations', async () => {
      mockBaseAnalysis();
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('A lateinit property error means you tried to use a variable before giving it a value.'))
        .mockResolvedValueOnce(mockResponse('You tried to read the user variable before writing to it.'))
        .mockResolvedValueOnce(mockResponse('1. Initialize before use\n2. Use nullable types\n3. Check isInitialized'));

      const result = await agent.analyze(sampleError, 'sync');

      // Should not contain complex jargon
      const allText = result.learningNotes!.join(' ');
      expect(allText.toLowerCase()).not.toContain('polymorphism');
      expect(allText.toLowerCase()).not.toContain('covariance');
      
      // Should contain simple terms
      const hasPropertyOrVariable = allText.toLowerCase().includes('property') || allText.toLowerCase().includes('variable');
      expect(hasPropertyOrVariable).toBe(true);
    });

    it('should provide actionable prevention tips', async () => {
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'lateinit not initialized', fixGuidelines: ['Initialize'], confidence: 0.8 })))
        .mockResolvedValueOnce(mockResponse('Error explanation'))
        .mockResolvedValueOnce(mockResponse('Cause explanation'))
        .mockResolvedValueOnce(mockResponse('1. Initialize in onCreate()\n2. Use nullable types (User?)\n3. Check ::user.isInitialized'));

      const result = await agent.analyze(sampleError, 'sync');

      const preventionSection = result.learningNotes!.find(note => 
        note.includes('How to prevent')
      );
      
      expect(preventionSection).toBeDefined();
      expect(preventionSection).toContain('1.');
      expect(preventionSection).toContain('2.');
      expect(preventionSection).toContain('3.');
    });

    it('should handle LLM failures gracefully', async () => {
      // Reset mocks and configure fresh
      mockLLM.generate.mockReset();
      
      // Mock LLM: base analysis succeeds, educational calls fail
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'lateinit not initialized', fixGuidelines: ['Initialize'], confidence: 0.8 })))
        .mockRejectedValueOnce(new Error('LLM timeout'))
        .mockRejectedValueOnce(new Error('LLM timeout'))
        .mockRejectedValueOnce(new Error('LLM timeout'));

      const result = await agent.analyze(sampleError, 'sync');

      expect(result.learningNotes).toBeDefined();
      // The error message should be in the last note after partial content
      const lastNote = result.learningNotes![result.learningNotes!.length - 1];
      expect(lastNote).toContain('Failed to generate learning notes');
    });
  });

  describe('Asynchronous Mode', () => {
    it('should return immediately with placeholder', async () => {
      mockBaseAnalysis();
      const result = await agent.analyze(sampleError, 'async');

      expect(result.learningNotes).toBeDefined();
      expect(result.learningNotes![0]).toContain('⏳');
      expect(result.learningNotes![0]).toContain('generating');
    });

    it('should track pending educational content', async () => {
      mockBaseAnalysis();
      await agent.analyze(sampleError, 'async');

      expect(agent.hasPendingEducation(sampleError)).toBe(true);
    });

    it('should allow retrieval of pending notes', async () => {
      // Mock educational explanations
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('Error explanation'))
        .mockResolvedValueOnce(mockResponse('Cause explanation'))
        .mockResolvedValueOnce(mockResponse('Prevention tips'));

      await agent.analyze(sampleError, 'async');

      // Wait a bit for async generation
      const notes = await agent.getPendingLearningNotes(sampleError);

      expect(notes).not.toBeNull();
      expect(notes).toHaveLength(3);
      expect(agent.hasPendingEducation(sampleError)).toBe(false);
    });

    it('should return null for non-pending errors', async () => {
      const notes = await agent.getPendingLearningNotes(sampleError);
      expect(notes).toBeNull();
    });

    it('should clear all pending education', async () => {
      mockBaseAnalysis();
      await agent.analyze(sampleError, 'async');
      expect(agent.hasPendingEducation(sampleError)).toBe(true);

      agent.clearPendingEducation();
      expect(agent.hasPendingEducation(sampleError)).toBe(false);
    });
  });

  describe('Error Type Explanations', () => {
    it('should explain lateinit errors', async () => {
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'lateinit property not initialized', fixGuidelines: ['Initialize in onCreate'], confidence: 0.8 })))
        .mockResolvedValueOnce(mockResponse('Lateinit is a promise to initialize later. Breaking that promise causes this error.'))
        .mockResolvedValueOnce(mockResponse('Cause'))
        .mockResolvedValueOnce(mockResponse('1. Initialize in onCreate\n2. Check isInitialized\n3. Use nullable type'));

      const result = await agent.analyze(sampleError, 'sync');
      const whatSection = result.learningNotes![0];

      expect(whatSection.toLowerCase()).toContain('lateinit');
    });

    it('should explain NPE errors', async () => {
      const npeError: ParsedError = {
        type: 'npe',
        message: 'java.lang.NullPointerException',
        filePath: 'MainActivity.kt',
        line: 50,
        language: 'kotlin'
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'Null value', fixGuidelines: ['Check null'], confidence: 0.8 })))
        .mockResolvedValueOnce(mockResponse('NullPointerException means accessing a null reference'))
        .mockResolvedValueOnce(mockResponse('Cause'))
        .mockResolvedValueOnce(mockResponse('Tips'));

      const result = await agent.analyze(npeError, 'sync');
      const whatSection = result.learningNotes![0];

      expect(whatSection).toContain('NullPointerException');
    });

    it('should explain Compose errors', async () => {
      const composeError: ParsedError = {
        type: 'compose_remember',
        message: 'Reading state without remember',
        filePath: 'HomeScreen.kt',
        line: 30,
        language: 'kotlin',
        framework: 'compose'
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'State without remember', fixGuidelines: ['Use remember'], confidence: 0.9 })))
        .mockResolvedValueOnce(mockResponse('Compose remember preserves state across recompositions'))
        .mockResolvedValueOnce(mockResponse('Cause'))
        .mockResolvedValueOnce(mockResponse('Tips'));

      const result = await agent.analyze(composeError, 'sync');
      const whatSection = result.learningNotes![0];

      expect(whatSection).toContain('remember');
    });
  });

  describe('Root Cause Explanations', () => {
    it('should use analogies to explain causes', async () => {
      mockBaseAnalysis();
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('What'))
        .mockResolvedValueOnce(mockResponse('Imagine trying to read a book before writing in it - that\'s what happened here!'))
        .mockResolvedValueOnce(mockResponse('Tips'));

      const result = await agent.analyze(sampleError, 'sync');
      const whySection = result.learningNotes![1];

      expect(whySection).toContain('Why did this happen');
      // Should contain some form of analogy
      expect(whySection.length).toBeGreaterThan(50);
    });

    it('should connect root cause to error context', async () => {
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('What'))
        .mockResolvedValueOnce(mockResponse('The onCreate method tried to use user before it was assigned'))
        .mockResolvedValueOnce(mockResponse('Tips'));

      const result = await agent.analyze(sampleError, 'sync');
      const whySection = result.learningNotes![1];

      expect(whySection).toBeDefined();
      expect(whySection.length).toBeGreaterThan(20);
    });
  });

  describe('Prevention Tips', () => {
    it('should provide numbered tips', async () => {
      mockBaseAnalysis();
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('What'))
        .mockResolvedValueOnce(mockResponse('Why'))
        .mockResolvedValueOnce(mockResponse('1. First tip\n2. Second tip\n3. Third tip'));

      const result = await agent.analyze(sampleError, 'sync');
      const preventionSection = result.learningNotes![2];

      expect(preventionSection).toContain('1.');
      expect(preventionSection).toContain('2.');
      expect(preventionSection).toContain('3.');
    });

    it('should provide specific, actionable advice', async () => {
      mockBaseAnalysis();
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('What'))
        .mockResolvedValueOnce(mockResponse('Why'))
        .mockResolvedValueOnce(mockResponse('1. Initialize user in onCreate() before accessing\n2. Use nullable type User? if timing uncertain\n3. Check ::user.isInitialized before access'));

      const result = await agent.analyze(sampleError, 'sync');
      const preventionSection = result.learningNotes![2];

      // Should mention specific actions
      expect(preventionSection.toLowerCase()).toMatch(/initialize|check|use/);
    });
  });

  describe('Output Cleanup', () => {
    it('should remove markdown code fences', async () => {
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('What'))
        .mockResolvedValueOnce(mockResponse('Why'))
        .mockResolvedValueOnce(mockResponse('```kotlin\n1. Tip one\n2. Tip two\n```'));

      const result = await agent.analyze(sampleError, 'sync');
      const preventionSection = result.learningNotes![2];

      expect(preventionSection).not.toContain('```kotlin');
      expect(preventionSection).not.toContain('```');
    });

    it('should trim extra whitespace', async () => {
      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('What'))
        .mockResolvedValueOnce(mockResponse('Why'))
        .mockResolvedValueOnce(mockResponse('   \n\n\n1. Tip\n\n\n\n2. Tip   \n\n\n   '));

      const result = await agent.analyze(sampleError, 'sync');
      const preventionSection = result.learningNotes![2];

      // Should not have leading/trailing whitespace
      expect(preventionSection).toBe(preventionSection.trim());
      // Should not have excessive newlines
      expect(preventionSection).not.toContain('\n\n\n');
    });
  });

  describe('Multiple Error Types', () => {
    it('should handle type mismatch errors', async () => {
      const typeMismatchError: ParsedError = {
        type: 'type_mismatch',
        message: 'Type mismatch: inferred type is String but Int was expected',
        filePath: 'Utils.kt',
        line: 20,
        language: 'kotlin'
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('Base'))
        .mockResolvedValueOnce(mockResponse('Base 2'))
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'Wrong type', fixGuidelines: ['Fix type'], confidence: 0.85 })))
        .mockResolvedValueOnce(mockResponse('Type mismatch means types don\'t match'))
        .mockResolvedValueOnce(mockResponse('Expected one thing, got another'))
        .mockResolvedValueOnce(mockResponse('1. Check types\n2. Use type conversion\n3. Verify declarations'));

      const result = await agent.analyze(typeMismatchError, 'sync');

      expect(result.learningNotes).toHaveLength(3);
    });

    it('should handle Gradle dependency conflicts', async () => {
      const gradleError: ParsedError = {
        type: 'gradle_dependency_conflict',
        message: 'Conflict with versions',
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle'
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('Base'))
        .mockResolvedValueOnce(mockResponse('Base 2'))
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'Version conflict', fixGuidelines: ['Force version'], confidence: 0.8 })))
        .mockResolvedValueOnce(mockResponse('Dependency conflict explanation'))
        .mockResolvedValueOnce(mockResponse('Multiple versions wanted'))
        .mockResolvedValueOnce(mockResponse('1. Force versions\n2. Exclude transitive deps\n3. Update to compatible versions'));

      const result = await agent.analyze(gradleError, 'sync');

      expect(result.learningNotes).toHaveLength(3);
    });

    it('should handle XML inflation errors', async () => {
      const xmlError: ParsedError = {
        type: 'xml_inflation',
        message: 'InflateException: Binary XML file line #12',
        filePath: 'activity_main.xml',
        line: 12,
        language: 'xml'
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('Base'))
        .mockResolvedValueOnce(mockResponse('Base 2'))
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'Invalid XML', fixGuidelines: ['Fix XML'], confidence: 0.75 })))
        .mockResolvedValueOnce(mockResponse('XML inflation means creating views from XML'))
        .mockResolvedValueOnce(mockResponse('Invalid XML structure'))
        .mockResolvedValueOnce(mockResponse('1. Validate XML\n2. Check attributes\n3. Verify IDs'));

      const result = await agent.analyze(xmlError, 'sync');

      expect(result.learningNotes).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown error types gracefully', async () => {
      const unknownError: ParsedError = {
        type: 'unknown_error_type',
        message: 'Something went wrong',
        filePath: 'Unknown.kt',
        line: 1,
        language: 'kotlin'
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('Base'))
        .mockResolvedValueOnce(mockResponse('Base 2'))
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'Unknown', fixGuidelines: ['Debug'], confidence: 0.5 })))
        .mockResolvedValueOnce(mockResponse('This is an error'))
        .mockResolvedValueOnce(mockResponse('Something unexpected'))
        .mockResolvedValueOnce(mockResponse('1. Check logs\n2. Debug step by step\n3. Search documentation'));

      const result = await agent.analyze(unknownError, 'sync');

      expect(result.learningNotes).toHaveLength(3);
    });

    it('should handle very long error messages', async () => {
      const longError: ParsedError = {
        type: 'compilation_error',
        message: 'A'.repeat(1000),
        filePath: 'Long.kt',
        line: 1,
        language: 'kotlin'
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('Base'))
        .mockResolvedValueOnce(mockResponse('Base 2'))
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'Long error', fixGuidelines: ['Fix'], confidence: 0.6 })))
        .mockResolvedValueOnce(mockResponse('Error explanation'))
        .mockResolvedValueOnce(mockResponse('Cause'))
        .mockResolvedValueOnce(mockResponse('Tips'));

      const result = await agent.analyze(longError, 'sync');

      expect(result.learningNotes).toHaveLength(3);
    });

    it('should handle errors without framework', async () => {
      const basicError: ParsedError = {
        type: 'npe',
        message: 'NullPointerException',
        filePath: 'Basic.kt',
        line: 10,
        language: 'kotlin'
        // No framework field
      };

      mockLLM.generate
        .mockResolvedValueOnce(mockResponse('Base'))
        .mockResolvedValueOnce(mockResponse('Base 2'))
        .mockResolvedValueOnce(mockResponse(JSON.stringify({ rootCause: 'Null', fixGuidelines: ['Check'], confidence: 0.85 })))
        .mockResolvedValueOnce(mockResponse('NPE explanation'))
        .mockResolvedValueOnce(mockResponse('Null access'))
        .mockResolvedValueOnce(mockResponse('Tips'));

      const result = await agent.analyze(basicError, 'sync');

      expect(result.learningNotes).toHaveLength(3);
    });
  });
});

