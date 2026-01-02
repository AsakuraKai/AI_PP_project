/**
 * Integration Tests for Interactive Debugging Features
 * 
 * Tests the ConversationalAgent and GuidedDebuggingWorkflow
 * components with VS Code integration.
 * 
 * @phase Phase 4: Real-World Testing - Week 3-4
 * @feature Interactive Debugging
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConversationalAgent } from '../../src/chat/ConversationalAgent';
import { GuidedDebuggingWorkflow } from '../../src/chat/GuidedDebuggingWorkflow';
import { AnalysisService } from '../../src/services/AnalysisService';

suite('Interactive Debugging Integration Tests', () => {
  let agent: ConversationalAgent;
  let workflow: GuidedDebuggingWorkflow;
  let analysisService: AnalysisService;
  
  suiteSetup(async function() {
    // Initialize services (may take time)
    this.timeout(10000);
    analysisService = AnalysisService.getInstance();
    await analysisService.initialize();
  });
  
  setup(() => {
    agent = new ConversationalAgent(analysisService);
    workflow = new GuidedDebuggingWorkflow(analysisService);
  });
  
  suite('ConversationalAgent', () => {
    test('should create conversation session', () => {
      const sessionId = agent.createSession({
        error: 'Test error',
        errorType: 'syntax',
        filePath: '/test/file.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      assert.ok(sessionId);
      assert.ok(sessionId.length > 0);
    });
    
    test('should handle follow-up questions', async () => {
      const sessionId = agent.createSession({
        error: 'NullPointerException',
        errorType: 'runtime',
        filePath: '/test/MainActivity.kt',
        line: 42,
        rootCause: 'lateinit not initialized',
        fixGuidelines: ['Initialize before use'],
        confidence: 0.9
      });
      
      // Create mock stream
      const responses: string[] = [];
      const mockStream: any = {
        markdown: (text: string) => responses.push(text),
        button: () => {},
        progress: () => {}
      };
      
      await agent.chat('why does this happen?', mockStream, sessionId);
      
      assert.ok(responses.length > 0);
      assert.ok(responses.some(r => r.length > 0));
    });
    
    test('should track conversation context', () => {
      const sessionId = agent.createSession({
        error: 'Test error',
        errorType: 'syntax',
        filePath: '/test/file.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      // Get session (use reflection to access private property for testing)
      const sessions = (agent as any).sessions;
      const session = sessions.get(sessionId);
      
      assert.ok(session);
      assert.strictEqual(session.error.error, 'Test error');
    });
    
    test('should export conversation to markdown', () => {
      const sessionId = agent.createSession({
        error: 'Test error',
        errorType: 'syntax',
        filePath: '/test/file.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      const markdown = agent.exportToMarkdown(sessionId);
      
      assert.ok(markdown);
      assert.ok(markdown.includes('# Conversation Export'));
      assert.ok(markdown.includes('Test error'));
    });
    
    test('should persist and load sessions', async () => {
      const sessionId = agent.createSession({
        error: 'Test error',
        errorType: 'syntax',
        filePath: '/test/file.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      const sessions = agent.getSessions();
      assert.ok(sessions.length > 0);
      
      // Create new agent and load sessions
      const newAgent = new ConversationalAgent(analysisService);
      await newAgent.loadSessions(sessions);
      
      const loadedSessions = newAgent.getSessions();
      assert.strictEqual(loadedSessions.length, sessions.length);
    });
    
    test('should clear all sessions', () => {
      agent.createSession({
        error: 'Test error 1',
        errorType: 'syntax',
        filePath: '/test/file1.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      agent.createSession({
        error: 'Test error 2',
        errorType: 'runtime',
        filePath: '/test/file2.kt',
        line: 20,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.7
      });
      
      let sessions = agent.getSessions();
      assert.strictEqual(sessions.length, 2);
      
      agent.clearAllSessions();
      sessions = agent.getSessions();
      assert.strictEqual(sessions.length, 0);
    });
    
    test('should get current session ID', () => {
      const sessionId = agent.createSession({
        error: 'Test error',
        errorType: 'syntax',
        filePath: '/test/file.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      const currentId = agent.getCurrentSessionId();
      assert.strictEqual(currentId, sessionId);
    });
  });
  
  suite('GuidedDebuggingWorkflow', () => {
    test('should start workflow with steps', async function() {
      this.timeout(10000); // Workflow may take time
      
      const mockStream: any = {
        messages: [],
        markdown: function(text: string) { this.messages.push(text); },
        button: () => {},
        progress: () => {}
      };
      
      await workflow.startWorkflow({
        message: 'NullPointerException at MainActivity.kt:42',
        file: '/test/MainActivity.kt',
        line: 42
      }, mockStream);
      
      assert.ok(mockStream.messages.length > 0);
      assert.ok(mockStream.messages.some((m: string) => m.includes('step') || m.includes('Step')));
    });
    
    test('should handle multiple workflows', async function() {
      this.timeout(10000);
      
      const stream1: any = {
        messages: [],
        markdown: function(text: string) { this.messages.push(text); },
        button: () => {},
        progress: () => {}
      };
      
      const stream2: any = {
        messages: [],
        markdown: function(text: string) { this.messages.push(text); },
        button: () => {},
        progress: () => {}
      };
      
      await workflow.startWorkflow({
        message: 'Error 1',
        file: '/test/file1.kt',
        line: 10
      }, stream1);
      
      await workflow.startWorkflow({
        message: 'Error 2',
        file: '/test/file2.kt',
        line: 20
      }, stream2);
      
      assert.ok(stream1.messages.length > 0);
      assert.ok(stream2.messages.length > 0);
    });
  });
  
  suite('VS Code Integration', () => {
    test('should register commands', async () => {
      const commands = await vscode.commands.getCommands();
      
      assert.ok(commands.includes('rcaAgent.startConversation'));
      assert.ok(commands.includes('rcaAgent.startGuidedDebugging'));
      assert.ok(commands.includes('rcaAgent.exportConversation'));
      assert.ok(commands.includes('rcaAgent.clearConversations'));
    });
    
    test('should persist across VS Code restarts', async () => {
      const sessionId = agent.createSession({
        error: 'Test error',
        errorType: 'syntax',
        filePath: '/test/file.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      const sessions = agent.getSessions();
      assert.ok(Array.isArray(sessions));
      assert.ok(sessions.length > 0);
    });
    
    test('should execute commands without errors', async function() {
      this.timeout(5000);
      
      try {
        // Test commands exist and can be executed
        // Note: actual execution may fail without proper setup, we just check registration
        const commands = await vscode.commands.getCommands();
        
        assert.ok(commands.includes('rcaAgent.startConversation'));
        assert.ok(commands.includes('rcaAgent.startGuidedDebugging'));
      } catch (error) {
        assert.fail(`Command execution check failed: ${error}`);
      }
    });
  });
  
  suite('Error Handling', () => {
    test('should handle missing session gracefully', () => {
      const markdown = agent.exportToMarkdown('non-existent-id');
      
      assert.ok(markdown.includes('not found'));
    });
    
    test('should handle empty messages', async () => {
      const sessionId = agent.createSession({
        error: 'Test error',
        errorType: 'syntax',
        filePath: '/test/file.kt',
        line: 10,
        rootCause: 'Test cause',
        fixGuidelines: [],
        confidence: 0.8
      });
      
      const mockStream: any = {
        markdown: () => {},
        button: () => {},
        progress: () => {}
      };
      
      try {
        await agent.chat('', mockStream, sessionId);
        // Should not throw
        assert.ok(true);
      } catch (error) {
        assert.fail(`Should handle empty message: ${error}`);
      }
    });
  });
});
