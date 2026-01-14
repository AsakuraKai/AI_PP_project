/**
 * Chat Prompt Engine - Enhanced prompts for chat-based RCA agent
 * Focuses on specificity, conversational tone, and actionable solutions
 */

export interface ParsedError {
  type?: string;
  message: string;
  filePath?: string;
  line?: number;
  stackTrace?: string[];
}

export interface ChatContext {
  activeFile?: string;
  workspaceRoot?: string;
  terminalOutput?: string;
  diagnostics?: Array<{ message: string; line: number; source?: string }>;
  recentFiles?: string[];
  gradleFiles?: {
    buildGradleFiles: string[];
    versionCatalogFile: string | null;
    usesVersionCatalog: boolean;
  };
}

export interface PromptOptions {
  includeExamples?: boolean;
  includeContext?: boolean;
  verbosity?: 'concise' | 'normal' | 'detailed';
}

/**
 * Chat-optimized prompt engine for RCA Agent
 */
export class ChatPromptEngine {
  /**
   * Generate system prompt for chat-based analysis
   */
  generateSystemPrompt(context: ChatContext): string {
    return `You are RCA Agent, an expert Kotlin/Android debugging assistant in VS Code.

## RESPONSE STYLE
- **Conversational and friendly** - You're chatting with a developer, not writing a report
- **Use markdown formatting** - Headings (##), code blocks (\`\`\`), bullet points (-)
- **Start with a brief summary** - One sentence explaining what you found
- **Ask clarifying questions** - If context is unclear or incomplete
- **Suggest follow-up actions** - What should the user do next?

## CRITICAL SPECIFICITY RULES (MUST FOLLOW)

### 1. File Paths - ALWAYS be exact
Bad: "Update build.gradle"
Good: "Update \`gradle/libs.versions.toml\` line 5"

### 2. Version Numbers - ALWAYS use specific versions
Bad: "Update to latest AGP"
Good: "Update to AGP 8.7.3 (stable, released Nov 2024)"
**RULE:** ALWAYS use VersionLookupTool to verify version exists before suggesting

### 3. Code Examples - ALWAYS show before/after
Bad: "Change the version"
Good:
\`\`\`diff
- agp = "8.10.0"
+ agp = "8.7.3"
\`\`\`

### 4. Line Numbers - ALWAYS specify exact location
Bad: "The error is in MainActivity"
Good: "The error is in \`MainActivity.kt:42\`"

### 5. Verification Steps - ALWAYS explain how to test
Bad: "This should fix it"
Good: "Run \`./gradlew build\` to verify the fix works"

## AVAILABLE TOOLS (Use these!)
- **VersionLookupTool**: Query valid AGP/Kotlin versions - USE THIS BEFORE suggesting versions
- **ReadFileTool**: Read file contents to verify current state
- **FindFilesTool**: Find files if path is unclear
- **SearchInFilesTool**: Search for patterns across workspace
- **TerminalTool**: Execute commands and capture output
- **GradleCommandHelper**: Run gradle commands (clean, build, sync)

## CONTEXT AVAILABLE
${this.formatContext(context)}

## ERROR ANALYSIS WORKFLOW
1. **Understand** - What is the error? What type?
2. **Locate** - Exact file and line number
3. **Diagnose** - Root cause (use tools to verify)
4. **Validate** - Check versions exist, files are correct
5. **Fix** - Specific steps with code examples
6. **Verify** - How to test the fix works

## REMEMBER
- You can ask the user for more information
- You can run commands to gather context
- You can read files to understand the project
- NEVER suggest a version without checking it exists
- NEVER give generic advice like "ensure configuration is correct"
- ALWAYS provide actionable, specific solutions`;
  }

  /**
   * Format context information for system prompt
   */
  private formatContext(context: ChatContext): string {
    const parts: string[] = [];

    if (context.activeFile) {
      parts.push(`- Current file: \`${context.activeFile}\``);
    }

    if (context.workspaceRoot) {
      parts.push(`- Workspace: \`${context.workspaceRoot}\``);
    }

    if (context.diagnostics && context.diagnostics.length > 0) {
      parts.push(`- Errors in current file: ${context.diagnostics.length} errors detected`);
    }

    if (context.terminalOutput) {
      parts.push(`- Terminal output: Available (recent build/command output)`);
    }

    if (context.gradleFiles?.usesVersionCatalog) {
      parts.push(`- Gradle: Uses version catalog (\`gradle/libs.versions.toml\`)`);
    }

    return parts.length > 0 ? parts.join('\n') : '- No additional context available';
  }

  /**
   * Generate user message for error analysis
   */
  generateAnalysisPrompt(
    userMessage: string,
    error: ParsedError | null,
    options: PromptOptions = {}
  ): string {
    const parts: string[] = [];

    parts.push(`User request: ${userMessage}\n`);

    if (error) {
      parts.push(`## Error Details`);
      parts.push(`- **Type**: ${error.type}`);
      parts.push(`- **Message**: ${error.message}`);
      
      if (error.filePath) {
        parts.push(`- **File**: \`${error.filePath}\`${error.line ? `:${error.line}` : ''}`);
      }

      if (error.stackTrace && error.stackTrace.length > 0) {
        parts.push(`- **Stack trace**: ${error.stackTrace.length} frames`);
      }
    }

    if (options.includeExamples) {
      parts.push('\n' + this.getRelevantExamples(error?.type));
    }

    parts.push('\n**Please analyze this error and provide:**');
    parts.push('1. Root cause (why it happened)');
    parts.push('2. Exact fix (file path, line number, before/after code)');
    parts.push('3. Verification steps (how to test the fix)');

    return parts.join('\n');
  }

  /**
   * Get relevant few-shot examples for error type
   */
  private getRelevantExamples(errorType?: string): string {
    if (!errorType) {
      return '';
    }

    const examples: Record<string, string> = {
      'Gradle': `## Example: Gradle Dependency Error

**Error**: "Could not find com.android.tools.build:gradle:8.10.0"

**Analysis**:
- Error type: Gradle dependency not found
- Root cause: AGP 8.10.0 doesn't exist in Maven Central
- File: \`gradle/libs.versions.toml\` line 5

**Fix**:
\`\`\`diff
# gradle/libs.versions.toml
- agp = "8.10.0"
+ agp = "8.7.3"
\`\`\`

**Why 8.7.3?** Latest stable AGP version (verified with VersionLookupTool)

**Verification**: Run \`./gradlew --version\` to confirm AGP updated`,

      'Kotlin': `## Example: Kotlin Null Pointer

**Error**: "lateinit property viewModel has not been initialized"

**Analysis**:
- Error type: Kotlin lateinit NPE
- Root cause: \`viewModel\` accessed before initialization in \`onCreate()\`
- File: \`MainActivity.kt:42\`

**Fix**:
\`\`\`kotlin
// MainActivity.kt
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
+   viewModel = ViewModelProvider(this)[MainViewModel::class.java]
    setContentView(R.layout.activity_main)
-   viewModel.loadData() // Was here, too early!
+   viewModel.loadData() // Now safe
}
\`\`\`

**Verification**: Run the app - no more crash on launch`
    };

    return examples[errorType] || '';
  }

  /**
   * Generate prompt for fix explanation
   */
  generateExplainPrompt(fix: string): string {
    return `The user wants more details about this fix:

${fix}

Please explain:
1. **Why this fix works** - What's the technical reasoning?
2. **Potential side effects** - What else might change?
3. **Alternative approaches** - Are there other ways to fix this?
4. **Best practices** - Is this the recommended approach?

Keep it conversational and educational.`;
  }

  /**
   * Generate prompt for batch error analysis
   */
  generateBatchAnalysisPrompt(errors: ParsedError[]): string {
    return `The user has ${errors.length} errors in their project. Please:

1. **Prioritize** - Which errors should be fixed first?
2. **Group** - Are some errors related/caused by the same root issue?
3. **Suggest approach** - Should we fix one by one or all at once?

Errors:
${errors.slice(0, 10).map((e, i) => `${i + 1}. ${e.type}: ${e.message} (${e.filePath}:${e.line || '?'})`).join('\n')}

${errors.length > 10 ? `... and ${errors.length - 10} more errors` : ''}

Provide a strategic plan for fixing these efficiently.`;
  }

  /**
   * Generate prompt for suggesting next actions
   */
  generateNextActionsPrompt(context: { 
    fixApplied: boolean;
    fixedErrorType: string;
    remainingErrors: number;
  }): string {
    const parts: string[] = [];

    parts.push('## What should the user do next?\n');

    if (context.fixApplied) {
      parts.push('Fix applied successfully!\n');
      parts.push('**Suggested next steps:**');
      parts.push('1. Run `./gradlew build` to verify the fix');
      parts.push('2. Check for any new errors that appear');
      
      if (context.remainingErrors > 0) {
        parts.push(`3. Address remaining ${context.remainingErrors} errors`);
      }
    } else {
      parts.push('**Next steps:**');
      parts.push('1. Review the suggested fix carefully');
      parts.push('2. Apply the fix using the "Apply Fix" button');
      parts.push('3. Verify it works');
    }

    return parts.join('\n');
  }
}
