/**
 * FixGenerator - Automated code fix generation with diff support
 * 
 * Generates concrete code fixes for errors with before/after diffs.
 * Addresses the MVP test finding that agent showed 0% code examples.
 * 
 * Features:
 * - Parse error location (file, line)
 * - Read surrounding code context
 * - Generate before/after code diffs
 * - Support multiple diff formats (markdown, unified)
 * - Multi-file fix support
 * - Syntax validation
 * 
 * Design Philosophy:
 * - Show concrete code changes, not vague instructions
 * - Validate generated code syntax
 * - Provide actionable diffs users can apply
 * - Support VS Code diff preview format
 * 
 * @example
 * const generator = new FixGenerator(ollamaClient, readFileTool);
 * const fix = await generator.generateFix(parsedError, rootCause, analysis);
 * console.log(fix.diff); // Shows before/after code
 * 
 * @author Kai (Backend Developer)
 * @created December 27, 2025
 * @phase Chunk 5: Fix Generator Foundation
 */

import { OllamaClient } from '../llm/OllamaClient';
import { ReadFileTool } from '../tools/ReadFileTool';
import { ParsedError } from '../types';
import { DiffFormatter, DiffFormat } from '../utils/DiffFormatter';
import { FileResolver } from '../utils/FileResolver';

/**
 * Generated code fix with diff information
 */
export interface CodeFix {
  /** File being fixed */
  filePath: string;
  
  /** Line number where fix applies */
  line: number;
  
  /** Original code (before fix) */
  originalCode: string;
  
  /** Fixed code (after fix) */
  fixedCode: string;
  
  /** Formatted diff (markdown or unified) */
  diff: string;
  
  /** Explanation of what changed and why */
  explanation: string;
  
  /** Confidence score (0-100) */
  confidence: number;
  
  /** Whether fix is syntactically valid */
  syntaxValid: boolean;
  
  /** Optional: Additional files that need changes */
  relatedFiles?: RelatedFileFix[];
}

/**
 * Fix for related files (e.g., Gradle + Kotlin)
 */
export interface RelatedFileFix {
  filePath: string;
  line: number;
  originalCode: string;
  fixedCode: string;
  explanation: string;
}

/**
 * Fix generation options
 */
export interface FixGenerationOptions {
  /** Number of context lines to read around error (default: 10) */
  contextLines?: number;
  
  /** Diff format to use (default: 'markdown') */
  diffFormat?: DiffFormat;
  
  /** Whether to validate syntax (default: true) */
  validateSyntax?: boolean;
  
  /** Maximum number of fix attempts (default: 3) */
  maxAttempts?: number;
  
  /** Whether to include related file fixes (default: false) */
  includeRelatedFiles?: boolean;
}

/**
 * LLM request for fix generation
 */
interface FixGenerationRequest {
  error: ParsedError;
  rootCause: string;
  originalCode: string;
  analysis?: string;
  fileContext?: string;
}

/**
 * FixGenerator class
 */
export class FixGenerator {
  private readonly readFileTool: ReadFileTool;
  private readonly diffFormatter: DiffFormatter;
  
  // Default options
  private readonly DEFAULT_CONTEXT_LINES = 10;
  private readonly DEFAULT_DIFF_FORMAT: DiffFormat = 'markdown';
  private readonly DEFAULT_MAX_ATTEMPTS = 3;
  private readonly fileResolver: FileResolver;

  constructor(
    private readonly llm: OllamaClient,
    readFileTool?: ReadFileTool,
    projectRoot?: string
  ) {
    this.readFileTool = readFileTool || new ReadFileTool();
    this.diffFormatter = new DiffFormatter();
    this.fileResolver = new FileResolver(projectRoot || process.cwd());
  }

  /**
   * Generate a code fix for the given error
   * 
   * @param error - Parsed error information
   * @param rootCause - Identified root cause
   * @param analysis - Optional: detailed analysis text
   * @param options - Fix generation options
   * @returns CodeFix object with diff
   */
  async generateFix(
    error: ParsedError,
    rootCause: string,
    analysis?: string,
    options?: FixGenerationOptions
  ): Promise<CodeFix | null> {
    const opts = this.mergeOptions(options);
    
    try {
      // Step 1: Read code context around error location
      const originalCode = await this.readCodeContext(
        error.filePath,
        error.line,
        opts.contextLines!
      );
      
      if (!originalCode) {
        console.warn(`[FixGenerator] Could not read file: ${error.filePath}`);
        return null;
      }
      
      // ✨ NEW: Validate file content
      if (originalCode.startsWith('Error:')) {
        console.warn(`⚠️ Cannot generate fix: source file not readable`);
        return null;  // Don't generate if no source
      }
      
      // ✨ NEW: Validate file is not JSON (sanity check)
      if (originalCode.trim().startsWith('{')) {
        console.warn(`⚠️ Cannot generate fix: file content appears to be JSON`);
        return null;
      }
      
      // Step 2: Generate fixed code using LLM
      const fixedCode = await this.generateFixedCode({
        error,
        rootCause,
        originalCode,
        analysis,
      });
      
      if (!fixedCode) {
        console.warn(`[FixGenerator] LLM failed to generate fix`);
        return null;
      }
      
      // Step 3: Validate syntax (if enabled)
      const syntaxValid = opts.validateSyntax!
        ? await this.validateSyntax(fixedCode, error.language)
        : true;
      
      // Step 4: Generate diff
      const diff = this.diffFormatter.format(
        originalCode,
        fixedCode,
        opts.diffFormat!,
        error.filePath
      );
      
      // Step 5: Generate explanation
      const explanation = await this.generateExplanation(
        originalCode,
        fixedCode,
        rootCause
      );
      
      // Step 6: Calculate confidence
      const confidence = this.calculateConfidence(
        syntaxValid,
        originalCode,
        fixedCode,
        rootCause
      );
      
      return {
        filePath: error.filePath,
        line: error.line,
        originalCode,
        fixedCode,
        diff,
        explanation,
        confidence,
        syntaxValid,
      };
      
    } catch (err) {
      console.error(`[FixGenerator] Error generating fix:`, err);
      return null;
    }
  }

  /**
   * Generate multiple fix options for comparison
   * 
   * @param error - Parsed error
   * @param rootCause - Root cause
   * @param count - Number of alternatives (default: 3)
   * @returns Array of CodeFix objects
   */
  async generateAlternatives(
    error: ParsedError,
    rootCause: string,
    count: number = 3
  ): Promise<CodeFix[]> {
    const fixes: CodeFix[] = [];
    
    for (let i = 0; i < count; i++) {
      const fix = await this.generateFix(error, rootCause, undefined, {
        // Vary temperature for diversity
        maxAttempts: 1,
      });
      
      if (fix) {
        fixes.push(fix);
      }
    }
    
    // Sort by confidence (highest first)
    return fixes.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Read code context around error location
   * 
   * @param filePath - File to read
   * @param line - Error line number
   * @param contextLines - Lines before/after to include
   * @returns Code snippet or null if read fails
   */
  private async readCodeContext(
    filePath: string,
    line: number,
    contextLines: number
  ): Promise<string | null> {
    try {
      // ✨ CHUNK 7: Resolve exact file path first using FileResolver
      const resolved = await this.fileResolver.resolve(filePath);
      
      if (!resolved.exists) {
        console.warn(`[FixGenerator] File not found after resolution: ${filePath}`);
        console.warn(`[FixGenerator] Tried: ${resolved.path}`);
        return null;
      }
      
      console.log(`[FixGenerator] Resolved ${filePath} → ${resolved.path}`);      
      // Use ReadFileTool to get context with resolved path
      const result = await this.readFileTool.execute({
        filePath: resolved.path, // ✅ Use exact resolved path
        line,
        contextLines,
      });
      
      // ReadFileTool returns formatted string, extract code
      return this.extractCodeFromToolResult(result);
      
    } catch (err) {
      console.error(`[FixGenerator] Failed to read context:`, err);
      return null;
    }
  }

  /**
   * Extract code from ReadFileTool formatted result
   * 
   * @param toolResult - Result from ReadFileTool
   * @returns Extracted code
   */
  private extractCodeFromToolResult(toolResult: string): string {
    // ReadFileTool format: "Lines X-Y of file:\n<code>"
    const lines = toolResult.split('\n');
    if (lines.length > 1) {
      // Skip first line (header), join rest
      return lines.slice(1).join('\n');
    }
    return toolResult;
  }

  /**
   * Generate fixed code using LLM
   * 
   * @param request - Fix generation request
   * @returns Fixed code or null
   */
  private async generateFixedCode(
    request: FixGenerationRequest
  ): Promise<string | null> {
    const prompt = this.buildFixPrompt(request);
    
    try {
      const response = await this.llm.generate(prompt, {
        temperature: 0.3, // Lower temperature for consistency
        maxTokens: 1000,
      });
      
      // Extract code from response (remove markdown fences if present)
      return this.extractCode(response.text);
      
    } catch (err) {
      console.error(`[FixGenerator] LLM generation failed:`, err);
      return null;
    }
  }

  /**
   * Build prompt for fix generation
   * 
   * @param request - Fix generation request
   * @returns LLM prompt
   */
  private buildFixPrompt(request: FixGenerationRequest): string {
    return `You are a code fix expert. Your ONLY job is to output the corrected code.

**CRITICAL: OUTPUT CODE ONLY, NOT JSON!**

ERROR TYPE: ${request.error.type}
ERROR MESSAGE: ${request.error.message}
ROOT CAUSE: ${request.rootCause}
FILE: ${request.error.filePath} (line ${request.error.line})

ORIGINAL CODE (with error):
\`\`\`${request.error.language}
${request.originalCode}
\`\`\`

${request.analysis ? `\nANALYSIS:\n${request.analysis}\n` : ''}

INSTRUCTIONS:
1. Fix ONLY the specific error identified
2. Preserve code structure and formatting
3. Make minimal changes necessary
4. Ensure syntax is valid
5. Output MUST be valid ${request.error.language} code
6. Do NOT wrap in JSON objects
7. Do NOT add explanations outside code

❌ DO NOT output like this:
{
  "fixedCode": "..."
}

✅ DO output like this (code in a fence or raw):
\`\`\`${request.error.language}
[your fixed code here]
\`\`\`

FIXED CODE (start with \`\`\`${request.error.language}):`;
  }

  /**
   * Extract code from LLM response (remove markdown fences)
   * 
   * @param text - LLM response text
   * @returns Extracted code
   */
  private extractCode(text: string): string {
    // Check if LLM returned JSON object (wrong format)
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.length < 50) {
      console.warn('⚠️ LLM returned JSON instead of code, attempting recovery');
      // Try to extract from JSON
      try {
        const json = JSON.parse(trimmed);
        if (json.fixedCode) return json.fixedCode;
        if (json.code) return json.code;
      } catch {
        // Not valid JSON, continue
      }
    }
    
    // Remove markdown code fences if present
    const fencePattern = /```(?:\w+)?\s*\n([\s\S]*?)\n```/;
    const match = text.match(fencePattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Check for inline code (single backticks)
    const inlinePattern = /`([^`]+)`/;
    const inlineMatch = text.match(inlinePattern);
    if (inlineMatch && inlineMatch[1]) {
      return inlineMatch[1].trim();
    }
    
    // No fences, return as is (trimmed)
    return text.trim();
  }

  /**
   * Validate syntax of generated code
   * 
   * @param code - Code to validate
   * @param language - Programming language
   * @returns True if syntax is valid
   */
  private async validateSyntax(
    code: string,
    language: string
  ): Promise<boolean> {
    // TODO: Implement language-specific syntax validation
    // For now, basic checks:
    
    switch (language) {
      case 'kotlin':
        return this.validateKotlinSyntax(code);
      case 'java':
        return this.validateJavaSyntax(code);
      case 'gradle':
        return this.validateGradleSyntax(code);
      default:
        // Unknown language, assume valid
        return true;
    }
  }

  /**
   * Validate Kotlin syntax (basic)
   * 
   * @param code - Kotlin code
   * @returns True if likely valid
   */
  private validateKotlinSyntax(code: string): boolean {
    // Basic checks for common syntax errors
    const checks = [
      // Balanced braces
      (code.match(/{/g) || []).length === (code.match(/}/g) || []).length,
      
      // Balanced parentheses
      (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length,
      
      // No unclosed strings (basic)
      (code.match(/"/g) || []).length % 2 === 0,
      
      // Has some content
      code.trim().length > 0,
    ];
    
    return checks.every(check => check);
  }

  /**
   * Validate Java syntax (basic)
   * 
   * @param code - Java code
   * @returns True if likely valid
   */
  private validateJavaSyntax(code: string): boolean {
    // Similar to Kotlin for now
    return this.validateKotlinSyntax(code);
  }

  /**
   * Validate Gradle syntax (basic)
   * 
   * @param code - Gradle code
   * @returns True if likely valid
   */
  private validateGradleSyntax(code: string): boolean {
    // Check for common Gradle patterns
    return code.trim().length > 0;
  }

  /**
   * Generate explanation for the fix
   * 
   * @param _originalCode - Original code (reserved for future use)
   * @param _fixedCode - Fixed code (reserved for future use)
   * @param rootCause - Root cause
   * @returns Explanation text
   */
  private async generateExplanation(
    _originalCode: string,
    _fixedCode: string,
    rootCause: string
  ): Promise<string> {
    // For now, simple explanation
    // TODO: Use LLM to generate detailed explanation
    return `Fixed the error by addressing: ${rootCause}`;
  }

  /**
   * Calculate confidence score for the fix
   * 
   * @param syntaxValid - Whether syntax is valid
   * @param _originalCode - Original code (reserved for future use)
   * @param _fixedCode - Fixed code (reserved for future use)
   * @param _rootCause - Root cause (reserved for future use)
   * @returns Confidence score (0-100)
   */
  private calculateConfidence(
    syntaxValid: boolean,
    _originalCode: string,
    _fixedCode: string,
    _rootCause: string
  ): number {
    let confidence = 50; // Base confidence
    
    // +30 if syntax valid
    if (syntaxValid) {
      confidence += 30;
    }
    
    // +10 if code actually changed
    if (_originalCode !== _fixedCode) {
      confidence += 10;
    }
    
    // +10 if change is minimal (good sign)
    const changeRatio = this.calculateChangeRatio(_originalCode, _fixedCode);
    if (changeRatio < 0.3) { // Less than 30% changed
      confidence += 10;
    }
    
    return Math.min(100, confidence);
  }

  /**
   * Calculate ratio of changed lines
   * 
   * @param original - Original code
   * @param fixed - Fixed code
   * @returns Ratio of changed lines (0-1)
   */
  private calculateChangeRatio(original: string, fixed: string): number {
    const originalLines = original.split('\n');
    const fixedLines = fixed.split('\n');
    
    const maxLines = Math.max(originalLines.length, fixedLines.length);
    if (maxLines === 0) return 0;
    
    let differentLines = 0;
    for (let i = 0; i < maxLines; i++) {
      if (originalLines[i] !== fixedLines[i]) {
        differentLines++;
      }
    }
    
    return differentLines / maxLines;
  }

  /**
   * Merge user options with defaults
   * 
   * @param options - User-provided options
   * @returns Merged options
   */
  private mergeOptions(
    options?: FixGenerationOptions
  ): Required<FixGenerationOptions> {
    return {
      contextLines: options?.contextLines ?? this.DEFAULT_CONTEXT_LINES,
      diffFormat: options?.diffFormat ?? this.DEFAULT_DIFF_FORMAT,
      validateSyntax: options?.validateSyntax ?? true,
      maxAttempts: options?.maxAttempts ?? this.DEFAULT_MAX_ATTEMPTS,
      includeRelatedFiles: options?.includeRelatedFiles ?? false,
    };
  }
  
  // ========== Phase 5: Enhanced Multi-File Fix Support ==========
  
  /**
   * Generate fixes for multiple related files
   * Phase 5: Support common scenarios like Gradle + Kotlin changes
   * 
   * @param error - Parsed error
   * @param rootCause - Root cause
   * @param analysis - Additional analysis context
   * @returns Array of fixes for all affected files
   */
  async generateMultiFileFix(
    error: ParsedError,
    rootCause: string,
    analysis?: string
  ): Promise<CodeFix[]> {
    const fixes: CodeFix[] = [];
    
    try {
      // Generate primary fix
      const primaryFix = await this.generateFix(error, rootCause, analysis);
      if (primaryFix) {
        fixes.push(primaryFix);
      }
      
      // Detect related files based on error type
      const relatedFiles = await this.detectRelatedFiles(error, rootCause);
      
      // Generate fixes for related files
      for (const relatedFile of relatedFiles) {
        const relatedFix = await this.generateRelatedFix(
          relatedFile,
          error,
          rootCause,
          analysis
        );
        if (relatedFix) {
          fixes.push(relatedFix);
        }
      }
      
      return fixes;
      
    } catch (err) {
      console.error(`[FixGenerator] Multi-file fix generation failed:`, err);
      return fixes; // Return whatever we have so far
    }
  }
  
  /**
   * Detect related files that may need changes
   * Phase 5: Smart detection based on error patterns
   */
  private async detectRelatedFiles(
    error: ParsedError,
    rootCause: string
  ): Promise<Array<{ path: string; reason: string }>> {
    const related: Array<{ path: string; reason: string }> = [];
    const lowerCause = rootCause.toLowerCase();
    
    // Gradle dependency errors may require both build.gradle and version catalog
    if (lowerCause.includes('dependency') || lowerCause.includes('gradle')) {
      const versionCatalogPath = 'gradle/libs.versions.toml';
      const resolved = await this.fileResolver.resolve(versionCatalogPath);
      
      if (resolved.exists && resolved.path !== error.filePath) {
        related.push({
          path: resolved.path,
          reason: 'Version catalog may need dependency version update',
        });
      }
    }
    
    // AGP version conflicts may require gradle-wrapper.properties
    if (lowerCause.includes('agp') || lowerCause.includes('android gradle plugin')) {
      const wrapperPath = 'gradle/wrapper/gradle-wrapper.properties';
      const resolved = await this.fileResolver.resolve(wrapperPath);
      
      if (resolved.exists && resolved.path !== error.filePath) {
        related.push({
          path: resolved.path,
          reason: 'Gradle wrapper version may need update for AGP compatibility',
        });
      }
    }
    
    // Kotlin version changes may require gradle.properties
    if (lowerCause.includes('kotlin')) {
      const propertiesPath = 'gradle.properties';
      const resolved = await this.fileResolver.resolve(propertiesPath);
      
      if (resolved.exists && resolved.path !== error.filePath) {
        related.push({
          path: resolved.path,
          reason: 'Kotlin version property may need update',
        });
      }
    }
    
    return related;
  }
  
  /**
   * Generate fix for a related file
   * Phase 5: Context-aware fix generation
   */
  private async generateRelatedFix(
    relatedFile: { path: string; reason: string },
    primaryError: ParsedError,
    rootCause: string,
    analysis?: string
  ): Promise<CodeFix | null> {
    try {
      console.log(`[FixGenerator] Generating related fix for ${relatedFile.path}...`);
      
      // Read the related file content
      const content = await this.readCodeContext(relatedFile.path, 1, 50);
      if (!content) {
        console.warn(`[FixGenerator] Could not read related file: ${relatedFile.path}`);
        return null;
      }
      
      // Generate fix using LLM with context about why this file needs changes
      const prompt = this.buildRelatedFixPrompt(
        relatedFile,
        content,
        primaryError,
        rootCause,
        analysis
      );
      
      const response = await this.llm.generate(prompt, {
        temperature: 0.1,
        maxTokens: 2000,
      });
      
      // Parse the response to extract fixed code
      const fixedCode = this.extractCodeFromLLMResponse(response.text);
      if (!fixedCode) {
        console.warn(`[FixGenerator] Could not extract fix from LLM response for ${relatedFile.path}`);
        return null;
      }
      
      // Create diff
      const diff = this.diffFormatter.formatDiff(content, fixedCode, 'markdown');
      
      return {
        filePath: relatedFile.path,
        line: 1,
        originalCode: content,
        fixedCode,
        diff,
        explanation: relatedFile.reason,
        confidence: 70, // Lower confidence for related files
        syntaxValid: true, // Assume valid for now
      };
      
    } catch (err) {
      console.error(`[FixGenerator] Error generating related fix:`, err);
      return null;
    }
  }
  
  /**
   * Build prompt for generating related file fixes
   * Phase 5: Specialized prompt for related file changes
   */
  private buildRelatedFixPrompt(
    relatedFile: { path: string; reason: string },
    currentContent: string,
    primaryError: ParsedError,
    rootCause: string,
    analysis?: string
  ): string {
    return `You are fixing a related file that needs changes due to the primary error.

PRIMARY ERROR:
File: ${primaryError.filePath}
Line: ${primaryError.line}
Error: ${primaryError.message}

ROOT CAUSE:
${rootCause}

RELATED FILE TO FIX:
Path: ${relatedFile.path}
Reason: ${relatedFile.reason}

CURRENT CONTENT:
\`\`\`
${currentContent}
\`\`\`

${analysis ? `ADDITIONAL CONTEXT:\n${analysis}\n` : ''}

Generate the fixed version of ${relatedFile.path} that addresses the related changes needed.
Only output the corrected code, nothing else.`;
  }
  
  /**
   * Better error message generation for fix failures
   * Phase 5: Actionable error messages
   */
  generateFixErrorMessage(error: ParsedError, failureReason: string): string {
    const suggestions: string[] = [];
    
    if (failureReason.includes('file not found')) {
      suggestions.push('• Verify the file path exists in your project');
      suggestions.push('• Check if the file is in a different module');
      suggestions.push('• Ensure the project structure matches expectations');
    } else if (failureReason.includes('syntax')) {
      suggestions.push('• The generated code may have syntax errors');
      suggestions.push('• Try regenerating the fix with different context');
      suggestions.push('• Manually review and adjust the suggested changes');
    } else if (failureReason.includes('timeout')) {
      suggestions.push('• LLM took too long to generate fix');
      suggestions.push('• Try with a smaller context window');
      suggestions.push('• Check your network connection to Ollama');
    }
    
    return `Failed to generate fix for ${error.filePath}:${error.line}

Reason: ${failureReason}

Suggestions:
${suggestions.join('\n')}

You can try:
1. Manually fix the error using the root cause analysis
2. Reduce the context window size
3. Check the error details for more specific guidance`;
  }
}
