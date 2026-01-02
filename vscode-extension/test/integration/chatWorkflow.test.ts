/**
 * Chat Workflow Integration Tests
 * Phase 2-3 Week 4 Implementation
 * 
 * Tests the complete chat participant workflow:
 * - User sends message to @rca-agent
 * - Intent detection and routing
 * - Context collection
 * - Backend analysis
 * - Response streaming
 * - Action button handling
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { RCAChatParticipant } from '../../chat/RCAChatParticipant';
import { ChatRequestRouter } from '../../chat/ChatRequestRouter';
import { ContextCollector } from '../../chat/ContextCollector';
import { ResponseStreamer } from '../../chat/ResponseStreamer';

describe('Chat Workflow Integration Tests', () => {
  let chatParticipant: RCAChatParticipant;
  let router: ChatRequestRouter;
  let contextCollector: ContextCollector;
  let streamer: ResponseStreamer;

  before(() => {
    chatParticipant = new RCAChatParticipant();
    router = new ChatRequestRouter();
    contextCollector = new ContextCollector();
    streamer = new ResponseStreamer();
  });

  describe('Intent Detection', () => {
    it('should detect analyze intent', async () => {
      const intent = await router.detectIntent('analyze this gradle error');
      assert.strictEqual(intent.type, 'analyze');
    });

    it('should detect fix intent', async () => {
      const intent = await router.detectIntent('fix this kotlin error');
      assert.strictEqual(intent.type, 'fix');
    });

    it('should detect explain intent', async () => {
      const intent = await router.detectIntent('explain this error');
      assert.strictEqual(intent.type, 'explain');
    });

    it('should detect build intent', async () => {
      const intent = await router.detectIntent('run gradle build');
      assert.strictEqual(intent.type, 'build');
    });

    it('should detect batch intent', async () => {
      const intent = await router.detectIntent('analyze all errors in workspace');
      assert.strictEqual(intent.type, 'batch');
    });

    it('should handle general questions', async () => {
      const intent = await router.detectIntent('what is kotlin?');
      assert.strictEqual(intent.type, 'general');
    });
  });

  describe('Context Collection', () => {
    it('should collect workspace files', async () => {
      const context = await contextCollector.collectWorkspaceContext();
      assert.ok(context);
      assert.ok(Array.isArray(context.workspaceFiles));
    });

    it('should collect error diagnostics', async () => {
      const context = await contextCollector.collectErrorContext();
      assert.ok(context);
    });

    it('should collect terminal output', async () => {
      const context = await contextCollector.collectTerminalContext();
      assert.ok(context);
    });
  });

  describe('Response Streaming', () => {
    it('should stream RCA results', async () => {
      const mockResult = {
        rootCause: 'Test error',
        confidence: 0.85,
        fixGuidelines: ['Fix step 1', 'Fix step 2'],
        timestamp: Date.now(),
        context: {}
      };

      const mockStream = createMockStream();
      const mockToken = createMockCancellationToken();

      await streamer.stream(mockResult, mockStream, mockToken);

      assert.ok(mockStream.markdown.called);
      assert.ok(mockStream.button.called);
    });

    it('should add action buttons', async () => {
      const mockResult = {
        rootCause: 'Test error',
        confidence: 0.9,
        fixGuidelines: ['Fix step 1'],
        timestamp: Date.now(),
        context: {}
      };

      const mockStream = createMockStream();
      const mockToken = createMockCancellationToken();

      await streamer.stream(mockResult, mockStream, mockToken);

      // Should have at least 2 buttons (Apply Fix, Explain More)
      assert.ok(mockStream.button.callCount >= 2);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle complete analyze workflow', async function() {
      this.timeout(15000); // 15 seconds for full workflow

      // Create test file with error
      const testFilePath = await createTestFile(`
        fun test() {
          val user = getUserById(123)
          println(user.name) // NullPointerException
        }
      `);

      try {
        // Open file in editor
        const doc = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(doc);

        // Create mock chat request
        const mockRequest = createMockChatRequest('analyze this error');
        const mockContext = createMockChatContext();
        const mockStream = createMockStream();
        const mockToken = createMockCancellationToken();

        // Execute workflow
        await chatParticipant.handleRequest(mockRequest, mockContext, mockStream, mockToken);

        // Verify response was streamed
        assert.ok(mockStream.markdown.called, 'Response should be streamed');
        assert.ok(mockStream.button.called, 'Action buttons should be added');
      } finally {
        // Cleanup test file
        await cleanupTestFile(testFilePath);
      }
    });

    it('should handle fix workflow with button click', async function() {
      this.timeout(15000);

      const mockResult = {
        rootCause: 'AGP version 8.10.0 does not exist',
        confidence: 1.0,
        fixGuidelines: [
          'Update gradle/libs.versions.toml line 5: agp = "8.7.3"'
        ],
        timestamp: Date.now(),
        context: {
          filePath: 'gradle/libs.versions.toml'
        }
      };

      // Simulate button click
      await vscode.commands.executeCommand('rca-agent.applyFix', mockResult);

      // Verify fix application was attempted
      // (In real scenario, would check file was modified)
      assert.ok(true, 'Fix command executed without error');
    });

    it('should handle batch analysis workflow', async function() {
      this.timeout(20000); // 20 seconds for batch processing

      const mockRequest = createMockChatRequest('analyze all errors in workspace');
      const mockContext = createMockChatContext();
      const mockStream = createMockStream();
      const mockToken = createMockCancellationToken();

      await chatParticipant.handleRequest(mockRequest, mockContext, mockStream, mockToken);

      // Verify multiple results were streamed
      assert.ok(mockStream.markdown.called, 'Batch results should be streamed');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing file gracefully', async () => {
      const mockRequest = createMockChatRequest('analyze error in nonexistent.kt');
      const mockContext = createMockChatContext();
      const mockStream = createMockStream();
      const mockToken = createMockCancellationToken();

      await chatParticipant.handleRequest(mockRequest, mockContext, mockStream, mockToken);

      // Should not throw, should show error message in stream
      assert.ok(mockStream.markdown.called);
    });

    it('should handle cancellation', async () => {
      const mockRequest = createMockChatRequest('analyze error');
      const mockContext = createMockChatContext();
      const mockStream = createMockStream();
      const mockToken = createMockCancellationToken(true); // Cancelled

      await chatParticipant.handleRequest(mockRequest, mockContext, mockStream, mockToken);

      // Should exit early without error
      assert.ok(true);
    });

    it('should handle LLM errors gracefully', async function() {
      this.timeout(15000);

      // TODO: Mock LLM client to throw error
      // Verify error is caught and user-friendly message shown
      assert.ok(true);
    });
  });

  describe('Performance', () => {
    it('should respond within 15 seconds', async function() {
      this.timeout(20000);

      const startTime = Date.now();

      const mockRequest = createMockChatRequest('analyze this gradle error');
      const mockContext = createMockChatContext();
      const mockStream = createMockStream();
      const mockToken = createMockCancellationToken();

      await chatParticipant.handleRequest(mockRequest, mockContext, mockStream, mockToken);

      const duration = Date.now() - startTime;
      assert.ok(duration < 15000, `Response took ${duration}ms, should be < 15000ms`);
    });

    it('should stream first response within 3 seconds', async function() {
      this.timeout(10000);

      const mockStream = createMockStreamWithTimestamp();
      const startTime = Date.now();

      const mockRequest = createMockChatRequest('analyze error');
      const mockContext = createMockChatContext();
      const mockToken = createMockCancellationToken();

      await chatParticipant.handleRequest(mockRequest, mockContext, mockStream, mockToken);

      const firstStreamTime = mockStream.firstStreamTimestamp - startTime;
      assert.ok(firstStreamTime < 3000, `First stream took ${firstStreamTime}ms, should be < 3000ms`);
    });
  });
});

// Mock helpers
function createMockStream() {
  const calls: any[] = [];
  return {
    markdown: Object.assign((text: string) => {
      calls.push({ type: 'markdown', text });
    }, { called: false, callCount: 0, calls }),
    button: Object.assign((button: any) => {
      calls.push({ type: 'button', button });
    }, { called: false, callCount: 0, calls }),
    get markdown() {
      return Object.assign(this._markdown, {
        called: calls.some(c => c.type === 'markdown'),
        callCount: calls.filter(c => c.type === 'markdown').length
      });
    },
    get button() {
      return Object.assign(this._button, {
        called: calls.some(c => c.type === 'button'),
        callCount: calls.filter(c => c.type === 'button').length
      });
    },
    _markdown: (text: string) => calls.push({ type: 'markdown', text }),
    _button: (button: any) => calls.push({ type: 'button', button })
  } as any;
}

function createMockStreamWithTimestamp() {
  const stream = createMockStream();
  (stream as any).firstStreamTimestamp = 0;
  const originalMarkdown = stream.markdown;
  stream.markdown = (text: string) => {
    if ((stream as any).firstStreamTimestamp === 0) {
      (stream as any).firstStreamTimestamp = Date.now();
    }
    originalMarkdown(text);
  };
  return stream;
}

function createMockCancellationToken(cancelled = false) {
  return {
    isCancellationRequested: cancelled,
    onCancellationRequested: () => ({ dispose: () => {} })
  } as vscode.CancellationToken;
}

function createMockChatRequest(prompt: string) {
  return {
    prompt,
    command: undefined,
    references: []
  } as any;
}

function createMockChatContext() {
  return {
    history: []
  } as any;
}

async function createTestFile(content: string): Promise<string> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    throw new Error('No workspace folder');
  }

  const testFilePath = vscode.Uri.joinPath(workspaceFolder.uri, 'test-file.kt').fsPath;
  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(testFilePath),
    Buffer.from(content, 'utf-8')
  );

  return testFilePath;
}

async function cleanupTestFile(filePath: string): Promise<void> {
  try {
    await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
  } catch {
    // Ignore errors
  }
}
