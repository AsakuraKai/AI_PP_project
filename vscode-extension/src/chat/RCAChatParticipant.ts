/**
 * RCA Chat Participant - Main entry point for @rca-agent chat interface
 * 
 * This replaces the command-based UI (Ctrl+Shift+R) with a conversational
 * chat interface similar to GitHub Copilot.
 * 
 * Enhanced with Phase 4 Week 3-4:
 * - Multi-turn conversations with memory
 * - Guided debugging workflows
 * - Follow-up question handling
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 4: Real-World Testing - Week 3-4
 * @feature Interactive Debugging
 */

import * as vscode from 'vscode';
import { ChatRequestRouter } from './ChatRequestRouter';
import { ContextCollector } from './ContextCollector';
import { ResponseStreamer } from './ResponseStreamer';
import { ChatPromptEngine } from './ChatPromptEngine';
import { ConversationalAgent } from './ConversationalAgent';
import { GuidedDebuggingWorkflow } from './GuidedDebuggingWorkflow';
import { AnalysisService } from '../services/AnalysisService';
import { getToolRegistry } from '../tools/ToolRegistry';

export class RCAChatParticipant {
  private router: ChatRequestRouter;
  private contextCollector: ContextCollector;
  private streamer: ResponseStreamer;
  private promptEngine: ChatPromptEngine;
  private analysisService: AnalysisService;
  private toolRegistry = getToolRegistry();
  
  // Phase 4 additions: Conversational features
  private conversationalAgent: ConversationalAgent;
  private guidedWorkflow: GuidedDebuggingWorkflow;
  private isGuidedMode: boolean = false;

  constructor(context: vscode.ExtensionContext) {
    this.router = new ChatRequestRouter();
    this.contextCollector = new ContextCollector();
    this.streamer = new ResponseStreamer();
    this.promptEngine = new ChatPromptEngine();
    
    // Use existing AnalysisService instead of BackendIntegration
    this.analysisService = AnalysisService.getInstance();
    
    // Phase 4: Initialize conversational features
    this.conversationalAgent = new ConversationalAgent();
    this.guidedWorkflow = new GuidedDebuggingWorkflow();
  }

  /**
   * Handle incoming chat request from user
   * 
   * Enhanced Workflow (Phase 4):
   * 1. Detect if guided mode or conversational mode
   * 2. Check for follow-up questions
   * 3. Route to appropriate handler:
   *    - Guided workflow for step-by-step debugging
   *    - Conversational agent for follow-up questions
   *    - Standard analysis for new errors
   */
  async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      const prompt = request.prompt.toLowerCase();
      
      // Check for special commands
      if (prompt.includes('guided') || prompt.includes('step by step')) {
        await this.handleGuidedMode(request, stream);
        return;
      }
      
      if (prompt.includes('follow up') || prompt.includes('continue conversation')) {
        await this.handleFollowUp(request, stream);
        return;
      }
      
      if (prompt.includes('export conversation') || prompt.includes('save conversation')) {
        await this.handleExportConversation(stream);
        return;
      }
      
      // Check if this is a follow-up question (conversational mode)
      const isFollowUp = this.detectFollowUpQuestion(prompt, context);
      
      if (isFollowUp) {
        await this.handleConversationalMode(request, stream);
        return;
      }
      
      // Default: Standard analysis (Phase 2-3 behavior)
      await this.handleStandardAnalysis(request, stream, token);
      
    } catch (error: any) {
      // Error handling
      stream.markdown(`## Error\n\n${error.message}\n\n`);
      stream.markdown('Please try again or provide more context.');
      
      console.error('[RCAChatParticipant] Error handling request:', error);
    }
  }
  
  /**
   * Handle standard analysis (original Phase 2-3 behavior)
   */
  private async handleStandardAnalysis(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Show progress
    stream.progress('Analyzing your request...');
    
    // 1. Detect user intent
    const intent = await this.router.route(request);
    
    // 2. Collect context
    stream.progress('Gathering context from workspace...');
    const errorContext = await this.contextCollector.collect(intent);
    
    // 3. Call existing AnalysisService (already integrated with Kai's backend)
    stream.progress('Analyzing error with AI agent...');
    
    // Convert context to AnalysisService format
    const errorItem = {
      id: Date.now().toString(),
      message: errorContext.errors[0]?.message || request.prompt,
      filePath: errorContext.errors[0]?.file || '',
      line: errorContext.errors[0]?.line || 0,
      type: 'runtime' as const,
      severity: 'error' as const,
      status: 'pending' as const,
      timestamp: Date.now()
    };
    
    const result = await this.analysisService.analyzeError(
      errorItem,
      (progress) => {
        // Stream progress updates
        if ('message' in progress && typeof progress.message === 'string') {
          stream.progress(progress.message);
        }
      }
    );
    
    // 4. Stream response
    await this.streamer.stream(result, stream, token);
    
    // 5. Start conversation session for potential follow-ups
    this.conversationalAgent.startNewSession({
      currentError: {
        message: errorItem.message,
        file: errorItem.filePath,
        line: errorItem.line
      },
      relevantFiles: [errorItem.filePath]
    });
  }
  
  /**
   * Handle guided debugging workflow
   */
  private async handleGuidedMode(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    this.isGuidedMode = true;
    stream.markdown(`Starting guided debugging mode...\n\n`);
    
    // Get current error from workspace
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      stream.markdown(`Please open a file with an error to start guided debugging.\n`);
      return;
    }
    
    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
    const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
    
    if (errors.length === 0) {
      stream.markdown(`No errors found in the current file.\n`);
      return;
    }
    
    // Start guided workflow with first error
    const firstError = errors[0];
    await this.guidedWorkflow.startWorkflow(
      {
        message: firstError.message,
        file: editor.document.uri.fsPath,
        line: firstError.range.start.line,
        diagnostics: errors
      },
      stream
    );
  }
  
  /**
   * Handle conversational mode (follow-up questions)
   */
  private async handleConversationalMode(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    stream.progress('Thinking about your question...');
    
    // Use conversational agent for response
    const response = await this.conversationalAgent.chat(request.prompt);
    
    stream.markdown(response);
    stream.markdown(`\n\n`);
    
    // Offer follow-up options
    stream.button({
      command: 'rca-agent.askFollowUp',
      title: 'Ask Another Question',
      arguments: []
    });
    
    stream.button({
      command: 'rca-agent.exportConversation',
      title: 'Export Conversation',
      arguments: []
    });
  }
  
  /**
   * Handle follow-up questions explicitly
   */
  private async handleFollowUp(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    const session = this.conversationalAgent.getCurrentSession();
    
    if (!session || session.messages.length === 0) {
      stream.markdown(`No active conversation found. Start by analyzing an error first.\n`);
      return;
    }
    
    // Show conversation context
    stream.markdown(`**Continuing our conversation...**\n\n`);
    
    await this.handleConversationalMode(request, stream);
  }
  
  /**
   * Export conversation to markdown
   */
  private async handleExportConversation(stream: vscode.ChatResponseStream): Promise<void> {
    const markdown = this.conversationalAgent.exportToMarkdown();
    
    // Create new document with conversation
    const doc = await vscode.workspace.openTextDocument({
      content: markdown,
      language: 'markdown'
    });
    
    await vscode.window.showTextDocument(doc);
    
    stream.markdown(`Conversation exported to new document!\n`);
  }
  
  /**
   * Detect if user message is a follow-up question
   */
  private detectFollowUpQuestion(prompt: string, context: vscode.ChatContext): boolean {
    // Check VS Code chat context history
    if (context.history.length > 0) {
      // Look for conversational patterns
      const followUpPatterns = [
        /^why/i,
        /^how/i,
        /^what (about|does|is)/i,
        /^can you/i,
        /^could you/i,
        /^please/i,
        /\b(that|this|it)\b/i,
        /more (detail|info|explanation)/i,
        /explain (that|this|it)/i,
        /show me/i
      ];
      
      return followUpPatterns.some(pattern => pattern.test(prompt));
    }
    
    return false;
  }
  
  /**
   * Get conversational agent for external access
   */
  getConversationalAgent(): ConversationalAgent {
    return this.conversationalAgent;
  }
  
  /**
   * Get guided workflow for external access
   */
  getGuidedWorkflow(): GuidedDebuggingWorkflow {
    return this.guidedWorkflow;
  }
}

/**
 * Register the RCA Agent chat participant
 * 
 * This makes @rca-agent available in VS Code chat panel
 */
export function registerChatParticipant(
  context: vscode.ExtensionContext
): void {
  const rcaParticipant = new RCAChatParticipant(context);
  
  const participant = vscode.chat.createChatParticipant(
    'rca-agent',
    async (request, context, stream, token) => {
      await rcaParticipant.handleRequest(request, context, stream, token);
    }
  );
  
  // Set icon
  participant.iconPath = vscode.Uri.joinPath(
    context.extensionUri,
    'resources/icons/rca-agent.svg'
  );
  
  // Add to subscriptions for cleanup
  context.subscriptions.push(participant);
  
  console.log('[RCAChatParticipant] Chat participant registered: @rca-agent');
}
