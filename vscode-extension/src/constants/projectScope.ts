/**
 * Project Scope Constants & Utilities
 * 
 * Centralized handling of project scope validation and configuration
 * Used for determining whether errors originate from inside or outside the workspace
 */

import { ProjectScope } from '../../../src/types';

/**
 * Valid project scope values
 */
export const PROJECT_SCOPE_VALUES = {
  INSIDE: 'inside',
  OUTSIDE: 'outside'
} as const;

/**
 * Type representing project scope (re-exported from core types)
 */
export type { ProjectScope };

/**
 * Default project scope
 */
export const DEFAULT_PROJECT_SCOPE: ProjectScope = PROJECT_SCOPE_VALUES.INSIDE;

/**
 * Scope labels for UI display
 */
export const SCOPE_LABELS: Record<ProjectScope, string> = {
  inside: 'Inside This Project',
  outside: 'Not Inside This Project'
};

/**
 * Scope descriptions for accessibility
 */
export const SCOPE_DESCRIPTIONS: Record<ProjectScope, string> = {
  inside: 'Error originated from within this workspace',
  outside: 'Error originated from outside this workspace'
};

/**
 * Visual indicators for each scope
 */
export const SCOPE_INDICATORS: Record<ProjectScope, string> = {
  inside: 'O|',
  outside: '|O'
};

/**
 * Theme colors for scope visualization
 */
export const SCOPE_COLORS = {
  inside: {
    bg: 'bg-purple-600',
    text: 'text-purple-600',
    border: 'border-purple-600'
  },
  outside: {
    bg: 'bg-zinc-600',
    text: 'text-zinc-600',
    border: 'border-zinc-600'
  }
} as const;

/**
 * Validate if a value is a valid project scope
 * @param value - Value to validate
 * @returns True if value is a valid ProjectScope
 */
export function isValidProjectScope(value: unknown): value is ProjectScope {
  return (
    typeof value === 'string' &&
    Object.values(PROJECT_SCOPE_VALUES).includes(value as ProjectScope)
  );
}

/**
 * Get project scope with fallback to default
 * @param scope - Scope value to validate
 * @returns Valid ProjectScope or DEFAULT_PROJECT_SCOPE
 */
export function getProjectScope(scope: unknown): ProjectScope {
  if (isValidProjectScope(scope)) {
    return scope;
  }
  console.warn('[ProjectScope] Invalid scope value, using default:', { value: scope, default: DEFAULT_PROJECT_SCOPE });
  return DEFAULT_PROJECT_SCOPE;
}

/**
 * Determine optimization strategy based on project scope
 * @param scope - Project scope
 * @returns Object with optimization flags
 */
export function getScopeOptimizations(scope: ProjectScope) {
  return {
    skipWorkspaceSearch: scope === PROJECT_SCOPE_VALUES.OUTSIDE,
    skipSemanticSearch: scope === PROJECT_SCOPE_VALUES.OUTSIDE,
    skipChromaDB: scope === PROJECT_SCOPE_VALUES.OUTSIDE,
    focusGenericPatterns: scope === PROJECT_SCOPE_VALUES.OUTSIDE,
    useProjectContext: scope === PROJECT_SCOPE_VALUES.INSIDE
  };
}

/**
 * Build system prompt context based on project scope
 * @param scope - Project scope
 * @returns Prompt context string
 */
export function buildScopePromptContext(scope: ProjectScope): string {
  if (scope === PROJECT_SCOPE_VALUES.INSIDE) {
    return 'This error is from the user\'s workspace. Use workspace files, semantic search, and project context to understand the codebase.';
  }
  return 'This error is from an external source (not the user\'s workspace). Provide generic debugging guidance and patterns without expecting project context.';
}
