/**
 * Response Streamer - Stream RCA analysis results to chat
 * 
 * Formats and streams:
 * - Analysis summary
 * - Root cause explanation
 * - Fix guidelines
 * - Code examples
 * - Action buttons
 * 
 * @author Sokchea (Frontend Developer)
 * @phase Phase 2: Chat Participant UI
 * @week Week 2
 */

import * as vscode from 'vscode';
import { RCAResult } from '../panel/types';

export interface CodeExample {
  file: string;
  line: number;
  before: string;
  after: string;
  explanation: string;
}

export class ResponseStreamer {
  /**
   * Stream RCA analysis results to chat
   */
  async stream(
    result: RCAResult,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Check if cancelled
    if (token.isCancellationRequested) return;
    
    // Stream analysis header
    stream.markdown(`## 🔍 Root Cause Analysis\n\n`);
    
    // Note: Skip error type - not in RCAResult interface
    
    // Stream root cause
    stream.markdown(`**Root Cause:**\n\n${result.rootCause}\n\n`);
    
    // Stream confidence
    const confidenceEmoji = this.getConfidenceEmoji(result.confidence);
    stream.markdown(`**Confidence:** ${confidenceEmoji} ${Math.round(result.confidence * 100)}%\n\n`);
    
    // Stream fix guidelines
    if (result.fixGuidelines && result.fixGuidelines.length > 0) {
      stream.markdown(`## 🛠️ Fix Guidelines\n\n`);
      
      result.fixGuidelines.forEach((guideline, index) => {
        stream.markdown(`${index + 1}. ${guideline}\n`);
      });
      
      stream.markdown('\n');
    }
    
    // Skip code examples for now (not in RCAResult type)
    // TODO: Add code examples to RCAResult type if needed
    
    // Add action buttons
    this.addActionButtons(result, stream);
    
    // Add follow-up suggestions
    stream.markdown(`\n---\n\n💬 **Follow-up actions:**\n`);
    stream.markdown(`- Ask me to explain more about this error\n`);
    stream.markdown(`- Request code examples\n`);
    stream.markdown(`- Ask about similar issues\n`);
  }
  
  /**
   * Add interactive action buttons
   */
  private addActionButtons(
    result: RCAResult,
    stream: vscode.ChatResponseStream
  ): void {
    // Apply fix button (if fix available)
    if (result.fixGuidelines && result.fixGuidelines.length > 0) {
      stream.button({
        command: 'rca-agent.applyFix',
        title: '✅ Apply Fix',
        arguments: [result]
      });
    }
    
    // Explain more button
    stream.button({
      command: 'rca-agent.explainMore',
      title: '📚 Explain More',
      arguments: [result]
    });
    
    // Search similar button
    stream.button({
      command: 'rca-agent.searchSimilar',
      title: '🔎 Search Similar Issues',
      arguments: [result]
    });
  }
  
  /**
   * Get emoji based on confidence level
   */
  private getConfidenceEmoji(confidence: number): string {
    if (confidence >= 0.8) return '🟢';
    if (confidence >= 0.5) return '🟡';
    return '🔴';
  }
}
