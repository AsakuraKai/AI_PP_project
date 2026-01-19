/**
 * Scope-Aware Prompt Builder
 * 
 * Enhances agent prompts based on project scope
 * When button is toggled, RCA gets proper context instructions
 */

import { ParsedError, ProjectScope } from '../types';

/**
 * Get the project scope from error metadata
 */
export function getErrorProjectScope(error: ParsedError): ProjectScope {
    const scope = error.metadata?.projectScope;
    if (scope === 'inside' || scope === 'outside') {
        return scope;
    }
    return 'inside'; // Default fallback
}

/**
 * Build scope-specific system prompt context
 * This gets injected into the agent's thinking
 */
export function buildScopedSystemContext(error: ParsedError): string {
    const scope = getErrorProjectScope(error);
    const scopeContext = error.metadata?.scopeContext;

    if (scope === 'outside') {
        return `
**PROJECT SCOPE: EXTERNAL ERROR** (Outside Workspace)
${scopeContext || ''}

INSTRUCTIONS FOR EXTERNAL ERRORS:
- This error is from outside the user's project
- Do NOT search the workspace for related files
- Do NOT assume project-specific structure or patterns
- Focus on generic debugging patterns and documentation
- Provide general-purpose solutions that apply to any similar setup
- Avoid mentioning "workspace" or "project files"
- Give examples that work without project context`;
    }

    // scope === 'inside'
    return `
**PROJECT SCOPE: INTERNAL ERROR** (Inside Workspace)
${scopeContext || ''}

INSTRUCTIONS FOR WORKSPACE ERRORS:
- This error is from within the user's project
- Use workspace context, file structure, and project configuration
- Search for related files and understand project architecture
- Look at actual code to identify specific issues
- Reference exact file paths and line numbers from the workspace
- Use semantic search to find similar patterns in the codebase
- Build solutions specific to this project's setup`;
}

/**
 * Enhance the system prompt with scope context
 * Use this when building the agent's thinking prompt
 */
export function enhanceSystemPromptWithScope(
    baseSystemPrompt: string,
    error: ParsedError
): string {
    const scopeContext = buildScopedSystemContext(error);

    // Insert scope context after base instructions, before specific examples
    const insertPoint = baseSystemPrompt.indexOf('**CRITICAL SPECIFICITY RULES');

    if (insertPoint > 0) {
        return baseSystemPrompt.slice(0, insertPoint) + scopeContext + '\n\n' + baseSystemPrompt.slice(insertPoint);
    }

    // Fallback: append to end
    return baseSystemPrompt + '\n\n' + scopeContext;
}

/**
 * Filter tools based on project scope
 * External errors don't need workspace-specific tools
 */
export function filterToolsByScope(tools: string[], scope: ProjectScope): string[] {
    if (scope === 'outside') {
        // Remove workspace-specific tools
        const workspaceTools = ['read_file', 'find_callers', 'search_workspace', 'semantic_search'];
        return tools.filter(tool => !workspaceTools.includes(tool));
    }

    // Inside workspace - all tools available
    return tools;
}

/**
 * Adjust search strategies based on scope
 */
export function getSearchStrategy(scope: ProjectScope): {
    useChromaDB: boolean;
    useWorkspaceSearch: boolean;
    useExternalDocs: boolean;
    similarity_threshold: number;
} {
    if (scope === 'outside') {
        return {
            useChromaDB: false,      // Skip internal database for external errors
            useWorkspaceSearch: false, // No workspace to search
            useExternalDocs: true,     // Use documentation instead
            similarity_threshold: 0.6   // Broader matching for generic patterns
        };
    }

    // Inside workspace
    return {
        useChromaDB: true,         // Use knowledge base
        useWorkspaceSearch: true,  // Search project files
        useExternalDocs: true,     // Also check external docs
        similarity_threshold: 0.7   // Tighter matching for project-specific patterns
    };
}

/**
 * Log scope information for debugging
 */
export function logScopeContext(error: ParsedError, context: string = 'Agent'): void {
    const scope = getErrorProjectScope(error);
    console.log(`[${context}] Error scope: "${scope}"`, {
        message: error.message.substring(0, 60),
        filePath: error.filePath,
        scopeFromMetadata: error.metadata?.projectScope,
        scopeContext: error.metadata?.scopeContext?.substring(0, 50)
    });
}
