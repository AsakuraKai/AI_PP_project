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

  /** Minimality score (0-100, higher is better) */
  minimalityScore?: number;

  /** Minimality metrics */
  minimalityMetrics?: MinimalityMetrics;
}

/**
 * Minimality metrics for fix quality assessment
 */
export interface MinimalityMetrics {
  /** Total lines in the fix */
  totalLines: number;

  /** Lines that were actually changed */
  changedLines: number;

  /** Unchanged context lines included */
  contextLines: number;

  /** Ratio of changed to total lines (0-1) */
  changeRatio: number;

  /** Whether the fix is minimal (< 30% unchanged lines) */
  isMinimal: boolean;
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

  /** Whether to apply minimality filtering (default: true) */
  applyMinimalityFilter?: boolean;

  /** Maximum context lines in minimal output (default: 2) */
  minimalContextLines?: number;
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
  private readonly fileResolver: FileResolver | any; // Allow any for mocking in tests

  constructor(
    private readonly llm: OllamaClient,
    readFileTool?: ReadFileTool,
    projectRoot?: string,
    fileResolver?: FileResolver | any // Allow any for mocking in tests
  ) {
    this.readFileTool = readFileTool || new ReadFileTool();
    this.diffFormatter = new DiffFormatter();
    this.fileResolver = fileResolver || new FileResolver(projectRoot || process.cwd());
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

      // [FEATURE] NEW: Validate file content
      if (originalCode.startsWith('Error:')) {
        console.warn(`[WARN] Cannot generate fix: source file not readable`);
        return null;  // Don't generate if no source
      }

      // [FEATURE] NEW: Validate file is not JSON (sanity check)
      if (originalCode.trim().startsWith('{')) {
        console.warn(`[WARN] Cannot generate fix: file content appears to be JSON`);
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

      // Step 7: Apply minimality filtering if enabled
      let finalOriginalCode = originalCode;
      let finalFixedCode = fixedCode;
      let finalDiff = diff;
      let minimalityMetrics: MinimalityMetrics | undefined;
      let minimalityScore: number | undefined;

      if (opts.applyMinimalityFilter) {
        const minimalResult = this.applyMinimalityFilter(
          originalCode,
          fixedCode,
          opts.minimalContextLines!
        );

        finalOriginalCode = minimalResult.originalCode;
        finalFixedCode = minimalResult.fixedCode;
        minimalityMetrics = minimalResult.metrics;
        minimalityScore = this.calculateMinimalityScore(minimalResult.metrics);

        // Regenerate diff with minimal code
        finalDiff = this.diffFormatter.format(
          finalOriginalCode,
          finalFixedCode,
          opts.diffFormat!,
          error.filePath
        );
      }

      return {
        filePath: error.filePath,
        line: error.line,
        originalCode: finalOriginalCode,
        fixedCode: finalFixedCode,
        diff: finalDiff,
        explanation,
        confidence,
        syntaxValid,
        minimalityScore,
        minimalityMetrics,
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
      // [FEATURE] CHUNK 7: Resolve exact file path first using FileResolver
      const resolved = await this.fileResolver.resolve(filePath);

      let pathToUse = filePath; // Default to original path

      if (!resolved.exists) {
        console.warn(`[FixGenerator] File not found after resolution: ${filePath}`);
        console.warn(`[FixGenerator] Tried: ${resolved.path}`);
        // In tests, FileResolver may fail but ReadFileTool still works
        // So we'll try with the original path as a fallback
        console.warn(`[FixGenerator] Falling back to original path: ${filePath}`);
      } else {
        console.log(`[FixGenerator] Resolved ${filePath} → ${resolved.path}`);
        pathToUse = resolved.path; // Use resolved path
      }

      // Use ReadFileTool to get context
      const result = await this.readFileTool.execute({
        filePath: pathToUse,
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

      console.log('[FixGenerator] LLM response length:', response.text.length);
      console.log('[FixGenerator] LLM response preview:', response.text.substring(0, 200));

      // Extract code from response (remove markdown fences if present)
      const extractedCode = this.extractCode(response.text);

      // [FIX] Validate extracted code
      if (!extractedCode || extractedCode.length === 0) {
        console.warn('[FixGenerator] Failed to extract valid code from LLM response');
        console.warn('[FixGenerator] Full response:', response.text);
        return null;
      }

      // [FIX] Additional validation - code should have some substance
      if (extractedCode.length < 10) {
        console.warn('[FixGenerator] Extracted code too short:', extractedCode);
        return null;
      }

      console.log('[FixGenerator] Successfully extracted code, length:', extractedCode.length);
      return extractedCode;

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
    return `You are an expert code repair assistant. Generate ONLY the corrected code that fixes the error.

**CRITICAL INSTRUCTIONS:**
- Output the COMPLETE fixed code snippet
- Include ALL lines from the original code, with corrections applied
- Output ONLY executable code, NO JSON, NO explanations, NO descriptions
- Preserve indentation and formatting
- Fix ONLY the identified error

**ERROR CONTEXT:**
Type: ${request.error.type}
Message: ${request.error.message}
Root Cause: ${request.rootCause}
File: ${request.error.filePath}:${request.error.line}
Language: ${request.error.language}

**ORIGINAL CODE (CONTAINS ERROR):**
\`\`\`${request.error.language}
${request.originalCode}
\`\`\`

${request.analysis ? `**ADDITIONAL CONTEXT:**\n${request.analysis}\n` : ''}

**REQUIRED OUTPUT FORMAT:**

Option 1 - Code in fence (PREFERRED):
\`\`\`${request.error.language}
[Put the complete fixed code here]
\`\`\`

Option 2 - Raw code:
[Put the complete fixed code here]

**NEVER OUTPUT:**
- {} or empty objects
- JSON like {"fixedCode": "..."}
- Explanations or descriptions
- Partial code or placeholders

**NOW OUTPUT THE COMPLETE FIXED CODE:`;
  }

  /**
   * Extract code from LLM response (remove markdown fences)
   * 
   * @param text - LLM response text
   * @returns Extracted code
   */
  private extractCode(text: string): string {
    const trimmed = text.trim();

    // [FIX] Detect and reject malformed/empty responses
    if (trimmed.length === 0) {
      console.warn('[WARN] LLM returned empty response');
      return '';
    }

    // [FIX] Reject obviously invalid code (just braces, parens, etc)
    if (/^[\{\}\(\)\[\];,\s]*$/.test(trimmed)) {
      console.warn('[WARN] LLM returned only punctuation/whitespace:', trimmed);
      return '';
    }

    // Check if LLM returned JSON object (wrong format)
    if (trimmed.startsWith('{') && trimmed.length < 200) {
      console.warn('[WARN] LLM may have returned JSON, attempting recovery...');
      // Try to extract from JSON
      try {
        const json = JSON.parse(trimmed);
        if (json.fixedCode && typeof json.fixedCode === 'string') {
          console.log('[OK] Extracted fixedCode from JSON');
          return json.fixedCode;
        }
        if (json.code && typeof json.code === 'string') {
          console.log('[OK] Extracted code from JSON');
          return json.code;
        }
        console.warn('[WARN] JSON object but no fixedCode/code field');
        return '';
      } catch {
        // Not valid JSON, might be actual code starting with {
        console.log('[OK] Not JSON, treating as code block');
      }
    }

    // Remove markdown code fences if present
    const fencePattern = /```(?:\w+)?\s*\n([\s\S]*?)\n```/;
    const match = text.match(fencePattern);

    if (match && match[1]) {
      const extracted = match[1].trim();
      // [FIX] Validate extracted code is not empty
      if (extracted.length === 0 || /^[\{\}\(\)\[\];,\s]*$/.test(extracted)) {
        console.warn('[WARN] Extracted code from fence is empty or invalid');
        return '';
      }
      return extracted;
    }

    // Check for inline code (single backticks)
    const inlinePattern = /`([^`]+)`/;
    const inlineMatch = text.match(inlinePattern);
    if (inlineMatch && inlineMatch[1]) {
      return inlineMatch[1].trim();
    }

    // [FIX] Last resort: check if raw text looks like code
    // Must have more than just braces/punctuation
    if (/[a-zA-Z_]/.test(trimmed)) {
      return trimmed;
    }

    console.warn('[WARN] Could not extract valid code from LLM response');
    return '';
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
    try {
      switch (language.toLowerCase()) {
        case 'kotlin':
          return await this.validateKotlinSyntax(code);
        case 'java':
          return await this.validateJavaSyntax(code);
        case 'typescript':
        case 'javascript':
          return await this.validateTSSyntax(code);
        case 'python':
          return await this.validatePythonSyntax(code);
        case 'gradle':
          return this.validateGradleSyntax(code);
        default:
          // Fallback to basic validation for unknown languages
          return this.validateBasicSyntax(code);
      }
    } catch (error) {
      console.warn(`[FixGenerator] Syntax validation failed for ${language}:`, error);
      // On error, fallback to basic validation
      return this.validateBasicSyntax(code);
    }
  }

  /**
   * Validate Kotlin syntax using kotlinc compiler
   *
   * @param code - Kotlin code
   * @returns True if syntax is valid
   */
  private async validateKotlinSyntax(code: string): Promise<boolean> {
    // Check if kotlinc is available
    if (!await this.isCompilerAvailable('kotlinc')) {
      console.warn('[FixGenerator] kotlinc not available, using basic validation');
      return this.validateBasicSyntax(code);
    }

    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const fs = require('fs/promises');
      const path = require('path');
      const os = require('os');
      const execAsync = promisify(exec);

      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kotlin-validate-'));
      const tempFile = path.join(tempDir, 'Temp.kt');

      await fs.writeFile(tempFile, code, 'utf-8');

      const { stderr } = await execAsync(
        `kotlinc "${tempFile}" -d "${tempDir}"`,
        { timeout: 5000 }
      );

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      // Check for compilation errors
      return !stderr.includes('error:');
    } catch (error: any) {
      console.warn('[FixGenerator] Kotlin validation error:', error.message);

      // Timeout or execution error - fallback to basic
      if (error.killed || error.code === 'ETIMEDOUT') {
        return this.validateBasicSyntax(code);
      }

      return false;
    }
  }

  /**
   * Validate Java syntax using javac compiler
   *
   * @param code - Java code
   * @returns True if syntax is valid
   */
  private async validateJavaSyntax(code: string): Promise<boolean> {
    // Check if javac is available
    if (!await this.isCompilerAvailable('javac')) {
      console.warn('[FixGenerator] javac not available, using basic validation');
      return this.validateBasicSyntax(code);
    }

    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const fs = require('fs/promises');
      const path = require('path');
      const os = require('os');
      const execAsync = promisify(exec);

      // Extract class name from code
      const classNameMatch = code.match(/class\s+(\w+)/);
      const className = classNameMatch ? classNameMatch[1] : 'Temp';

      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'java-validate-'));
      const tempFile = path.join(tempDir, `${className}.java`);

      await fs.writeFile(tempFile, code, 'utf-8');

      const { stderr } = await execAsync(
        `javac "${tempFile}"`,
        { timeout: 5000, cwd: tempDir }
      );

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      // Check for compilation errors
      return !stderr.includes('error:');
    } catch (error: any) {
      console.warn('[FixGenerator] Java validation error:', error.message);

      if (error.killed || error.code === 'ETIMEDOUT') {
        return this.validateBasicSyntax(code);
      }

      return false;
    }
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
   * Validate TypeScript/JavaScript syntax
   *
   * @param code - TS/JS code
   * @returns True if syntax is valid
   */
  private async validateTSSyntax(code: string): Promise<boolean> {
    try {
      const ts = require('typescript');

      const result = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2015,
          noEmit: true
        }
      });

      // Check for syntax errors (not type errors)
      const syntaxErrors = result.diagnostics?.filter((d: any) =>
        d.category === ts.DiagnosticCategory.Error &&
        d.code >= 1000 && d.code < 2000 // Syntax error range
      ) || [];

      return syntaxErrors.length === 0;
    } catch (error) {
      console.warn('[FixGenerator] TS validation error:', error);
      return this.validateBasicSyntax(code);
    }
  }

  /**
   * Validate Python syntax using python -m py_compile
   *
   * @param code - Python code
   * @returns True if syntax is valid
   */
  private async validatePythonSyntax(code: string): Promise<boolean> {
    if (!await this.isCompilerAvailable('python')) {
      return this.validateBasicSyntax(code);
    }

    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const fs = require('fs/promises');
      const path = require('path');
      const os = require('os');
      const execAsync = promisify(exec);

      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'python-validate-'));
      const tempFile = path.join(tempDir, 'temp.py');

      await fs.writeFile(tempFile, code, 'utf-8');

      await execAsync(
        `python -m py_compile "${tempFile}"`,
        { timeout: 3000 }
      );

      await fs.rm(tempDir, { recursive: true, force: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a compiler is available in PATH
   *
   * @param compiler - Compiler command (e.g., 'kotlinc', 'javac')
   * @returns True if available
   */
  private async isCompilerAvailable(compiler: string): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Use 'where' on Windows, 'which' on Unix
      const command = process.platform === 'win32' ? 'where' : 'which';
      await execAsync(`${command} ${compiler}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Basic syntax validation (fallback)
   *
   * @param code - Code to validate
   * @returns True if basic checks pass
   */
  private validateBasicSyntax(code: string): boolean {
    const checks = [
      // Balanced braces
      (code.match(/{/g) || []).length === (code.match(/}/g) || []).length,

      // Balanced parentheses
      (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length,

      // Balanced brackets
      (code.match(/\[/g) || []).length === (code.match(/\]/g) || []).length,

      // No unclosed strings (basic check)
      (code.match(/"/g) || []).length % 2 === 0,

      // Has some content
      code.trim().length > 0,
    ];

    return checks.every(check => check);
  }

  /**
   * Generate explanation for the fix using LLM
   *
   * @param originalCode - Original code
   * @param fixedCode - Fixed code
   * @param rootCause - Root cause analysis
   * @returns Explanation text
   */
  private async generateExplanation(
    originalCode: string,
    fixedCode: string,
    rootCause: string
  ): Promise<string> {
    const prompt = `You are explaining a code fix to a developer.

**ROOT CAUSE:**
${rootCause}

**ORIGINAL CODE:**
\`\`\`
${originalCode}
\`\`\`

**FIXED CODE:**
\`\`\`
${fixedCode}
\`\`\`

Generate a concise explanation (2-3 sentences) that covers:
1. What changed in the code
2. Why this change fixes the root cause
3. Any potential side effects or considerations

Keep it clear and actionable. Output only the explanation text, no markdown formatting.`;

    try {
      const response = await this.llm.generate(prompt, {
        temperature: 0.3,
        maxTokens: 300,
      });

      const explanation = response.text.trim();

      // Validate explanation is not empty and reasonable length
      if (explanation.length < 10) {
        throw new Error('Generated explanation too short');
      }

      if (explanation.length > 1000) {
        // Truncate if too long
        return explanation.substring(0, 997) + '...';
      }

      return explanation;
    } catch (error) {
      console.warn('[FixGenerator] Failed to generate explanation:', error);
      // Fallback to template
      return `Fixed the error by addressing: ${rootCause}`;
    }
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
      applyMinimalityFilter: options?.applyMinimalityFilter ?? true,
      minimalContextLines: options?.minimalContextLines ?? 2,
    };
  }

  // ========== Fix 3: Minimality Filtering ==========

  /**
   * PUBLIC TEST HELPER: Apply minimality filter to remove unnecessary unchanged lines
   * This is exposed for testing purposes only
   *
   * @param originalCode - Original code
   * @param fixedCode - Fixed code
   * @param contextLines - Number of context lines to keep around changes
   * @returns Filtered code with minimality metrics
   */
  public testApplyMinimalityFilter(
    originalCode: string,
    fixedCode: string,
    contextLines: number
  ): {
    originalCode: string;
    fixedCode: string;
    metrics: MinimalityMetrics;
  } {
    return this.applyMinimalityFilter(originalCode, fixedCode, contextLines);
  }

  /**
   * PUBLIC TEST HELPER: Calculate minimality score
   * This is exposed for testing purposes only
   *
   * @param metrics - Minimality metrics
   * @returns Score from 0-100
   */
  public testCalculateMinimalityScore(metrics: MinimalityMetrics): number {
    return this.calculateMinimalityScore(metrics);
  }

  /**
   * Apply minimality filter to remove unnecessary unchanged lines
   * Keeps only changed lines + minimal context
   *
   * @param originalCode - Original code
   * @param fixedCode - Fixed code
   * @param contextLines - Number of context lines to keep around changes
   * @returns Filtered code with minimality metrics
   */
  private applyMinimalityFilter(
    originalCode: string,
    fixedCode: string,
    contextLines: number
  ): {
    originalCode: string;
    fixedCode: string;
    metrics: MinimalityMetrics;
  } {
    const originalLines = originalCode.split('\n');
    const fixedLines = fixedCode.split('\n');

    // If codes are identical, return as-is
    if (this.diffFormatter.isIdentical(originalCode, fixedCode)) {
      return {
        originalCode,
        fixedCode,
        metrics: {
          totalLines: originalLines.length,
          changedLines: 0,
          contextLines: originalLines.length,
          changeRatio: 0,
          isMinimal: false,
        },
      };
    }

    // Use DiffFormatter's statistics to get accurate change counts
    const stats = this.diffFormatter.getStatistics(originalCode, fixedCode);
    const totalChangedLines = stats.linesAdded + stats.linesRemoved;

    if (totalChangedLines === 0) {
      // No changes detected, return original
      return {
        originalCode,
        fixedCode,
        metrics: {
          totalLines: originalLines.length,
          changedLines: 0,
          contextLines: originalLines.length,
          changeRatio: 0,
          isMinimal: false,
        },
      };
    }

    // Find changed line ranges using diff
    const changedRanges = this.findChangedRanges(originalCode, fixedCode);

    if (changedRanges.length === 0) {
      // No changes detected, return original
      return {
        originalCode,
        fixedCode,
        metrics: {
          totalLines: originalLines.length,
          changedLines: 0,
          contextLines: originalLines.length,
          changeRatio: 0,
          isMinimal: false,
        },
      };
    }

    // Extract minimal lines with context around changed ranges
    const minimalIndices = this.expandRangesWithContext(
      changedRanges,
      originalLines.length,
      contextLines
    );

    // Build minimal code snippets
    const minimalOriginal = minimalIndices
      .map(i => originalLines[i] || '')
      .join('\n');

    const minimalFixed = minimalIndices
      .map(i => fixedLines[i] || '')
      .join('\n');

    // Calculate metrics
    const metrics: MinimalityMetrics = {
      totalLines: minimalIndices.length,
      changedLines: totalChangedLines,
      contextLines: minimalIndices.length - totalChangedLines,
      changeRatio: totalChangedLines / minimalIndices.length,
      isMinimal: (minimalIndices.length - totalChangedLines) / minimalIndices.length < 0.5,
    };

    return {
      originalCode: minimalOriginal,
      fixedCode: minimalFixed,
      metrics,
    };
  }

  /**
   * Find ranges of lines that contain changes
   * Returns array of {start, end} line ranges
   *
   * @param originalCode - Original code
   * @param fixedCode - Fixed code
   * @returns Array of changed line ranges
   */
  private findChangedRanges(
    originalCode: string,
    fixedCode: string
  ): Array<{ start: number; end: number }> {
    const originalLines = originalCode.split('\n');
    const fixedLines = fixedCode.split('\n');
    const ranges: Array<{ start: number; end: number }> = [];

    let currentRangeStart: number | null = null;

    const maxLen = Math.max(originalLines.length, fixedLines.length);

    for (let i = 0; i < maxLen; i++) {
      const origLine = originalLines[i] || '';
      const fixLine = fixedLines[i] || '';

      // Normalize whitespace for comparison
      const origNorm = origLine.trim().replace(/\s+/g, ' ');
      const fixNorm = fixLine.trim().replace(/\s+/g, ' ');

      if (origNorm !== fixNorm) {
        // Line changed
        if (currentRangeStart === null) {
          currentRangeStart = i;
        }
      } else {
        // Line unchanged
        if (currentRangeStart !== null) {
          ranges.push({ start: currentRangeStart, end: i - 1 });
          currentRangeStart = null;
        }
      }
    }

    // Close final range if open
    if (currentRangeStart !== null) {
      ranges.push({ start: currentRangeStart, end: maxLen - 1 });
    }

    return ranges;
  }

  /**
   * Expand changed ranges to include context lines
   *
   * @param ranges - Changed line ranges
   * @param totalLines - Total number of lines
   * @param contextLines - Number of context lines to add
   * @returns Expanded indices including context
   */
  private expandRangesWithContext(
    ranges: Array<{ start: number; end: number }>,
    totalLines: number,
    contextLines: number
  ): number[] {
    const expanded = new Set<number>();

    for (const range of ranges) {
      // Add context before
      const contextStart = Math.max(0, range.start - contextLines);
      for (let i = contextStart; i <= range.end; i++) {
        expanded.add(i);
      }

      // Add context after
      const contextEnd = Math.min(totalLines - 1, range.end + contextLines);
      for (let i = range.start; i <= contextEnd; i++) {
        expanded.add(i);
      }
    }

    // Return sorted indices
    return Array.from(expanded).sort((a, b) => a - b);
  }

  /**
   * Calculate minimality score (0-100, higher is better)
   *
   * @param metrics - Minimality metrics
   * @returns Score from 0-100
   */
  private calculateMinimalityScore(metrics: MinimalityMetrics): number {
    // Perfect score if all lines are changed (100% relevant)
    if (metrics.changeRatio === 1) {
      return 100;
    }

    // Score based on change ratio
    // Higher ratio = higher score
    const ratioScore = metrics.changeRatio * 100;

    // Penalty for too many context lines
    const contextPenalty = Math.min(20, metrics.contextLines * 2);

    // Bonus if marked as minimal
    const minimalBonus = metrics.isMinimal ? 10 : 0;

    return Math.max(0, Math.min(100, ratioScore - contextPenalty + minimalBonus));
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
      const fixedCode = this.extractCode(response.text);
      if (!fixedCode) {
        console.warn(`[FixGenerator] Could not extract fix from LLM response for ${relatedFile.path}`);
        return null;
      }

      // Create diff
      const diff = this.diffFormatter.format(content, fixedCode, 'markdown', relatedFile.path);

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
