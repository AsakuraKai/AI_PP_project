/**
 * Guided Debugging Workflow - Step-by-step debugging assistant
 * 
 * Provides structured, interactive debugging sessions that guide users
 * through the debugging process in a conversational manner.
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 4: Real-World Testing - Week 3-4
 * @feature Interactive Debugging
 */

import * as vscode from 'vscode';
import { ConversationalAgent, ConversationContext } from './ConversationalAgent';
import { AnalysisService } from '../services/AnalysisService';
import { FixApplicationService } from '../services/FixApplicationService';

/**
 * Represents the current step in the debugging workflow
 */
export enum DebuggingStep {
  UNDERSTAND_ERROR = 'understand',
  GATHER_CONTEXT = 'gather',
  ANALYZE_ROOT_CAUSE = 'analyze',
  SUGGEST_FIX = 'suggest',
  APPLY_FIX = 'apply',
  VERIFY_FIX = 'verify',
  COMPLETED = 'completed'
}

/**
 * Workflow state
 */
export interface WorkflowState {
  currentStep: DebuggingStep;
  error: {
    message: string;
    file: string;
    line: number;
    diagnostics?: vscode.Diagnostic[];
  };
  analysis?: any;
  suggestedFix?: any;
  appliedFix?: boolean;
  verificationResult?: {
    success: boolean;
    message: string;
  };
}

/**
 * GuidedDebuggingWorkflow - Interactive step-by-step debugging
 * 
 * Guides users through a structured debugging process:
 * 1. Understand the error (what happened?)
 * 2. Gather context (where and why?)
 * 3. Analyze root cause (deep dive)
 * 4. Suggest fix (what to do)
 * 5. Apply fix (make the change)
 * 6. Verify fix (test it works)
 * 
 * Features:
 * - Conversational guidance at each step
 * - Can pause and resume
 * - Allows user to jump to specific steps
 * - Provides explanations tailored to user's skill level
 */
export class GuidedDebuggingWorkflow {
  private conversationalAgent: ConversationalAgent;
  private analysisService: AnalysisService;
  private fixService: FixApplicationService;
  private state: WorkflowState | null = null;
  private stream: vscode.ChatResponseStream | null = null;
  
  constructor() {
    this.conversationalAgent = new ConversationalAgent();
    this.analysisService = AnalysisService.getInstance();
    this.fixService = FixApplicationService.getInstance();
  }
  
  /**
   * Start a new guided debugging session
   */
  async startWorkflow(
    error: {
      message: string;
      file: string;
      line: number;
      diagnostics?: vscode.Diagnostic[];
    },
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    this.stream = stream;
    
    // Initialize state
    this.state = {
      currentStep: DebuggingStep.UNDERSTAND_ERROR,
      error
    };
    
    // Start new conversation session
    const sessionId = this.conversationalAgent.startNewSession({
      currentError: error,
      relevantFiles: [error.file]
    });
    
    // Welcome message
    stream.markdown(`# Guided Debugging Assistant\n\n`);
    stream.markdown(`I'll help you debug this error step by step. Let's start!\n\n`);
    
    // Step 1: Understand the error
    await this.executeStep(DebuggingStep.UNDERSTAND_ERROR);
  }
  
  /**
   * Execute a specific step in the workflow
   */
  private async executeStep(step: DebuggingStep): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.state.currentStep = step;
    
    switch (step) {
      case DebuggingStep.UNDERSTAND_ERROR:
        await this.stepUnderstandError();
        break;
        
      case DebuggingStep.GATHER_CONTEXT:
        await this.stepGatherContext();
        break;
        
      case DebuggingStep.ANALYZE_ROOT_CAUSE:
        await this.stepAnalyzeRootCause();
        break;
        
      case DebuggingStep.SUGGEST_FIX:
        await this.stepSuggestFix();
        break;
        
      case DebuggingStep.APPLY_FIX:
        await this.stepApplyFix();
        break;
        
      case DebuggingStep.VERIFY_FIX:
        await this.stepVerifyFix();
        break;
        
      case DebuggingStep.COMPLETED:
        await this.stepCompleted();
        break;
    }
  }
  
  /**
   * Step 1: Understand the Error
   */
  private async stepUnderstandError(): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.stream.markdown(`---\n\n## Step 1: Understanding the Error\n\n`);
    
    // Show error details
    this.stream.markdown(`**Error Message:**\n\`\`\`\n${this.state.error.message}\n\`\`\`\n\n`);
    this.stream.markdown(`**Location:** [${this.state.error.file}:${this.state.error.line}](${this.state.error.file}#L${this.state.error.line})\n\n`);
    
    // Ask conversational agent to explain the error in simple terms
    const explanation = await this.conversationalAgent.chat(
      `Explain this error in simple terms: ${this.state.error.message}. What does it mean and what typically causes it?`
    );
    
    this.stream.markdown(`**What this error means:**\n\n${explanation}\n\n`);
    
    // Offer next steps
    this.stream.markdown(`**What would you like to do next?**\n\n`);
    
    // Add action buttons
    this.stream.button({
      command: 'rca-agent.guided.nextStep',
      title: 'Continue to Step 2: Gather Context',
      arguments: [DebuggingStep.GATHER_CONTEXT]
    });
    
    this.stream.button({
      command: 'rca-agent.guided.ask',
      title: '❓ Ask a question about this error',
      arguments: ['understand']
    });
  }
  
  /**
   * Step 2: Gather Context
   */
  private async stepGatherContext(): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.stream.markdown(`\n\n---\n\n## Step 2: Gathering Context\n\n`);
    this.stream.progress('Analyzing your code and project structure...');
    
    // Collect context information
    const editor = vscode.window.activeTextEditor;
    let codeContext = '';
    
    if (editor && editor.document.uri.fsPath === this.state.error.file) {
      // Get surrounding code
      const startLine = Math.max(0, this.state.error.line - 5);
      const endLine = Math.min(editor.document.lineCount - 1, this.state.error.line + 5);
      
      codeContext = editor.document.getText(
        new vscode.Range(startLine, 0, endLine, 9999)
      );
    }
    
    this.stream.markdown(`**Analyzing:**\n`);
    this.stream.markdown(`- Error location\n`);
    this.stream.markdown(`- Surrounding code\n`);
    this.stream.markdown(`- File dependencies\n`);
    this.stream.markdown(`- Project configuration\n\n`);
    
    // Ask agent about context
    const contextAnalysis = await this.conversationalAgent.chat(
      `Given this code context around the error:\n\`\`\`\n${codeContext}\n\`\`\`\n\nWhat relevant context should we consider for debugging?`
    );
    
    this.stream.markdown(`**Context Analysis:**\n\n${contextAnalysis}\n\n`);
    
    // Next steps
    this.stream.button({
      command: 'rca-agent.guided.nextStep',
      title: 'Continue to Step 3: Analyze Root Cause',
      arguments: [DebuggingStep.ANALYZE_ROOT_CAUSE]
    });
    
    this.stream.button({
      command: 'rca-agent.guided.ask',
      title: '❓ Ask about the context',
      arguments: ['context']
    });
  }
  
  /**
   * Step 3: Analyze Root Cause
   */
  private async stepAnalyzeRootCause(): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.stream.markdown(`\n\n---\n\n## Step 3: Analyzing Root Cause 🔬\n\n`);
    this.stream.progress('Performing deep analysis...');
    
    try {
      // Use AnalysisService to get full RCA
      const errorItem = {
        id: Date.now().toString(),
        message: this.state.error.message,
        filePath: this.state.error.file,
        line: this.state.error.line,
        type: 'runtime' as const,
        severity: 'error' as const,
        status: 'pending' as const,
        timestamp: Date.now()
      };
      
      const analysis = await this.analysisService.analyzeError(
        errorItem,
        (progress) => {
          if ('message' in progress && typeof progress.message === 'string') {
            this.stream?.progress(progress.message);
          }
        }
      );
      
      this.state.analysis = analysis;
      
      // Display root cause
      this.stream.markdown(`**Root Cause Identified:**\n\n`);
      this.stream.markdown(analysis.rootCause || 'Analysis in progress...');
      this.stream.markdown(`\n\n`);
      
      if (analysis.confidence) {
        this.stream.markdown(`**Confidence:** ${Math.round(analysis.confidence * 100)}%\n\n`);
      }
      
      // Update conversation context
      this.conversationalAgent.updateContext({
        fixStatus: {
          suggested: false,
          applied: false
        }
      });
      
    } catch (error: any) {
      this.stream.markdown(`Analysis encountered an issue: ${error.message}\n\n`);
    }
    
    // Next steps
    this.stream.button({
      command: 'rca-agent.guided.nextStep',
      title: 'Continue to Step 4: Get Fix Suggestion',
      arguments: [DebuggingStep.SUGGEST_FIX]
    });
    
    this.stream.button({
      command: 'rca-agent.guided.ask',
      title: '❓ Ask about the root cause',
      arguments: ['rootcause']
    });
  }
  
  /**
   * Step 4: Suggest Fix
   */
  private async stepSuggestFix(): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.stream.markdown(`\n\n---\n\n## Step 4: Fix Suggestion\n\n`);
    
    if (this.state.analysis?.fixGuidelines) {
      this.stream.markdown(`**Recommended Fix:**\n\n`);
      
      this.state.analysis.fixGuidelines.forEach((guideline: string, index: number) => {
        this.stream!.markdown(`${index + 1}. ${guideline}\n`);
      });
      
      this.stream.markdown(`\n\n`);
      
      // Store fix
      this.state.suggestedFix = this.state.analysis;
      
      // Update conversation context
      this.conversationalAgent.updateContext({
        fixStatus: {
          suggested: true,
          applied: false,
          fixDescription: this.state.analysis.fixGuidelines.join('; ')
        }
      });
    } else {
      this.stream.markdown(`No specific fix suggestions available yet.\n\n`);
    }
    
    // Next steps
    this.stream.button({
      command: 'rca-agent.guided.nextStep',
      title: 'Continue to Step 5: Apply Fix',
      arguments: [DebuggingStep.APPLY_FIX]
    });
    
    this.stream.button({
      command: 'rca-agent.guided.ask',
      title: '❓ Ask about the fix',
      arguments: ['fix']
    });
    
    this.stream.button({
      command: 'rca-agent.guided.ask',
      title: 'Suggest alternative approaches',
      arguments: ['alternatives']
    });
  }
  
  /**
   * Step 5: Apply Fix
   */
  private async stepApplyFix(): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.stream.markdown(`\n\n---\n\n## Step 5: Applying Fix\n\n`);
    
    if (!this.state.suggestedFix) {
      this.stream.markdown(`No fix has been suggested yet. Please complete Step 4 first.\n\n`);
      return;
    }
    
    this.stream.markdown(`**Ready to apply the fix?**\n\n`);
    this.stream.markdown(`This will modify your code. You can always undo the changes.\n\n`);
    
    // Provide options
    this.stream.button({
      command: 'rca-agent.applyFix',
      title: 'Apply Fix Now',
      arguments: [this.state.suggestedFix]
    });
    
    this.stream.button({
      command: 'rca-agent.showDiff',
      title: 'Preview Changes First',
      arguments: [this.state.suggestedFix]
    });
    
    this.stream.button({
      command: 'rca-agent.guided.nextStep',
      title: 'Skip to Verification',
      arguments: [DebuggingStep.VERIFY_FIX]
    });
  }
  
  /**
   * Step 6: Verify Fix
   */
  private async stepVerifyFix(): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.stream.markdown(`\n\n---\n\n## Step 6: Verifying Fix\n\n`);
    
    this.stream.markdown(`**Verification Options:**\n\n`);
    
    // Offer verification methods
    this.stream.button({
      command: 'rca-agent.runBuild',
      title: 'Run Build',
      arguments: []
    });
    
    this.stream.button({
      command: 'rca-agent.runTests',
      title: 'Run Tests',
      arguments: []
    });
    
    this.stream.button({
      command: 'rca-agent.guided.nextStep',
      title: 'Mark as Complete',
      arguments: [DebuggingStep.COMPLETED]
    });
  }
  
  /**
   * Step 7: Completed
   */
  private async stepCompleted(): Promise<void> {
    if (!this.state || !this.stream) return;
    
    this.stream.markdown(`\n\n---\n\n## Debugging Session Complete!\n\n`);
    this.stream.markdown(`Great job working through the debugging process!\n\n`);
    
    // Summary
    this.stream.markdown(`**Summary:**\n`);
    this.stream.markdown(`- Error understood\n`);
    this.stream.markdown(`- Context gathered\n`);
    this.stream.markdown(`- Root cause identified\n`);
    this.stream.markdown(`- ${this.state.appliedFix ? 'DONE' : 'PENDING'} Fix ${this.state.appliedFix ? 'applied' : 'suggested'}\n`);
    this.stream.markdown(`\n\n`);
    
    // Offer to export
    this.stream.button({
      command: 'rca-agent.exportConversation',
      title: 'Export Conversation to Markdown',
      arguments: []
    });
    
    this.stream.button({
      command: 'rca-agent.startNew',
      title: 'Start New Debugging Session',
      arguments: []
    });
  }
  
  /**
   * Handle user asking a question during workflow
   */
  async handleQuestion(question: string, context: string): Promise<string> {
    const contextualQuestion = `During the ${context} phase, the user asks: ${question}`;
    return await this.conversationalAgent.chat(contextualQuestion);
  }
  
  /**
   * Move to next step
   */
  async nextStep(): Promise<void> {
    if (!this.state) return;
    
    const steps = Object.values(DebuggingStep);
    const currentIndex = steps.indexOf(this.state.currentStep);
    
    if (currentIndex < steps.length - 1) {
      await this.executeStep(steps[currentIndex + 1] as DebuggingStep);
    }
  }
  
  /**
   * Jump to specific step
   */
  async jumpToStep(step: DebuggingStep): Promise<void> {
    await this.executeStep(step);
  }
  
  /**
   * Get current workflow state
   */
  getState(): WorkflowState | null {
    return this.state;
  }
  
  /**
   * Get conversation agent for direct interaction
   */
  getConversationalAgent(): ConversationalAgent {
    return this.conversationalAgent;
  }
}
