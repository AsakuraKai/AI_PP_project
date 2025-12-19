/**
 * DocumentSynthesizer - Generate formatted RCA markdown reports
 * 
 * Creates human-readable markdown documents from RCA analysis results.
 * Organizes content into sections with proper formatting, code blocks,
 * and actionable recommendations.
 * 
 * Features:
 * - Structured markdown output (summary, analysis, fix steps)
 * - Syntax highlighting for code snippets
 * - File path links (VS Code compatible)
 * - Confidence visualization
 * - Tool usage summary
 * - Metadata inclusion
 * 
 * @example
 * const synthesizer = new DocumentSynthesizer();
 * const markdown = synthesizer.synthesize(rca, error, state);
 * console.log(markdown);
 */

import { RCAResult, ParsedError, AgentState } from '../types';

/**
 * Synthesis options
 */
export interface SynthesisOptions {
  /** Include code context in output */
  includeCodeContext?: boolean;
  
  /** Include tool execution details */
  includeToolDetails?: boolean;
  
  /** Include metadata section */
  includeMetadata?: boolean;
  
  /** Maximum code snippet length */
  maxCodeLength?: number;
}

/**
 * Document synthesizer for RCA reports
 */
export class DocumentSynthesizer {
  /**
   * Generate markdown RCA report
   */
  synthesize(
    rca: RCAResult,
    error: ParsedError,
    state?: Partial<AgentState>,
    options: SynthesisOptions = {}
  ): string {
    const {
      includeCodeContext = true,
      includeToolDetails = true,
      includeMetadata = true,
      maxCodeLength = 1000,
    } = options;

    const sections: string[] = [];

    // Title and summary
    sections.push(this.generateHeader(error));
    sections.push(this.generateSummary(rca, error));

    // Root cause analysis
    sections.push(this.generateRootCauseSection(rca));

    // Fix guidelines
    sections.push(this.generateFixSection(rca));

    // Code context (if available)
    if (includeCodeContext && rca.codeContext) {
      sections.push(this.generateCodeContextSection(rca, error, maxCodeLength));
    }

    // Tool usage details
    if (includeToolDetails && rca.toolsUsed && rca.toolsUsed.length > 0) {
      sections.push(this.generateToolSection(rca));
    }

    // Metadata
    if (includeMetadata) {
      sections.push(this.generateMetadataSection(rca, error, state));
    }

    return sections.join('\n\n');
  }

  /**
   * Generate document header
   */
  private generateHeader(error: ParsedError): string {
    const errorType = this.formatErrorType(error.type);
    return `# 🔍 Root Cause Analysis: ${errorType}\n`;
  }

  /**
   * Generate summary section
   */
  private generateSummary(rca: RCAResult, error: ParsedError): string {
    const confidence = this.formatConfidence(rca.confidence);
    const location = error.filePath !== 'unknown' 
      ? `[${error.filePath}:${error.line}](${error.filePath}#L${error.line})`
      : 'Unknown location';

    return `## 📋 Summary

**Error Type:** ${this.formatErrorType(error.type)}  
**Location:** ${location}  
**Language:** ${error.language.toUpperCase()}${error.framework ? ` (${error.framework})` : ''}  
**Confidence:** ${confidence}

**Error Message:**
\`\`\`
${error.message}
\`\`\``;
  }

  /**
   * Generate root cause section
   */
  private generateRootCauseSection(rca: RCAResult): string {
    return `## 🎯 Root Cause

${rca.rootCause}`;
  }

  /**
   * Generate fix guidelines section
   */
  private generateFixSection(rca: RCAResult): string {
    const steps = rca.fixGuidelines
      .map((guideline, index) => `${index + 1}. ${guideline}`)
      .join('\n');

    return `## 🛠️ Fix Guidelines

${steps}`;
  }

  /**
   * Generate code context section
   */
  private generateCodeContextSection(
    rca: RCAResult,
    error: ParsedError,
    maxLength: number
  ): string {
    let codeContext = rca.codeContext || '';
    
    if (codeContext.length > maxLength) {
      codeContext = codeContext.slice(0, maxLength) + '\n...[truncated]';
    }

    const language = this.getCodeLanguage(error.language);

    return `## 📄 Code Context

**File:** ${error.filePath}  
**Line:** ${error.line}

\`\`\`${language}
${codeContext}
\`\`\``;
  }

  /**
   * Generate tool usage section
   */
  private generateToolSection(rca: RCAResult): string {
    const tools = rca.toolsUsed || [];
    const toolList = tools.map(tool => `- ${this.formatToolName(tool)}`).join('\n');

    return `## 🔧 Analysis Tools Used

${toolList}`;
  }

  /**
   * Generate metadata section
   */
  private generateMetadataSection(
    rca: RCAResult,
    error: ParsedError,
    state?: Partial<AgentState>
  ): string {
    const metadata: string[] = [];

    if (rca.iterations !== undefined) {
      metadata.push(`**Iterations:** ${rca.iterations}`);
    }

    if (state?.startTime) {
      const duration = Date.now() - state.startTime;
      metadata.push(`**Analysis Duration:** ${(duration / 1000).toFixed(1)}s`);
    }

    if (error.metadata) {
      const customMetadata = Object.entries(error.metadata)
        .map(([key, value]) => `**${this.formatMetadataKey(key)}:** ${value}`)
        .join('  \n');
      
      if (customMetadata) {
        metadata.push(customMetadata);
      }
    }

    if (metadata.length === 0) {
      return '';
    }

    return `## 📊 Analysis Metadata

${metadata.join('  \n')}`;
  }

  /**
   * Format error type for display
   */
  private formatErrorType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format confidence as visual representation
   */
  private formatConfidence(confidence: number): string {
    const percentage = Math.round(confidence * 100);
    const bars = Math.round(confidence * 10);
    const visualization = '█'.repeat(bars) + '░'.repeat(10 - bars);
    
    let label: string;
    if (confidence >= 0.8) {
      label = 'High';
    } else if (confidence >= 0.5) {
      label = 'Medium';
    } else {
      label = 'Low';
    }

    return `${visualization} ${percentage}% (${label})`;
  }

  /**
   * Get code language identifier for syntax highlighting
   */
  private getCodeLanguage(language: string): string {
    const languageMap: Record<string, string> = {
      kotlin: 'kotlin',
      java: 'java',
      xml: 'xml',
      gradle: 'groovy',
    };

    return languageMap[language.toLowerCase()] || language.toLowerCase();
  }

  /**
   * Format tool name for display
   */
  private formatToolName(tool: string): string {
    const toolNames: Record<string, string> = {
      read_file: '📖 Read File',
      find_callers: '🔍 Find Callers (LSP)',
      vector_search_db: '🗄️ Vector Search',
      android_build_tool: '🔨 Android Build Analysis',
    };

    return toolNames[tool] || tool.replace(/_/g, ' ');
  }

  /**
   * Format metadata key for display
   */
  private formatMetadataKey(key: string): string {
    return key
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate quick summary (single line)
   */
  generateQuickSummary(rca: RCAResult, error: ParsedError): string {
    const errorType = this.formatErrorType(error.type);
    const confidence = Math.round(rca.confidence * 100);
    return `${errorType} in ${error.filePath}:${error.line} (${confidence}% confidence)`;
  }
}
