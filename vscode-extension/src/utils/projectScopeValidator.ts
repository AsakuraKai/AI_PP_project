/**
 * Project Scope Validation & Conversion
 * 
 * Handles validation and conversion of project scope data
 * across the extension boundary (webview ↔ extension)
 * 
 * Uses projectScope constants from ../constants/projectScope.ts for:
 * - isValidProjectScope (type guard)
 * - getProjectScope (safe getter with fallback)
 * - DEFAULT_PROJECT_SCOPE (default value)
 */

import { ProjectScope, isValidProjectScope, getProjectScope, DEFAULT_PROJECT_SCOPE } from '../constants/projectScope';

/**
 * Validates incoming error data and ensures projectScope is present
 * @param data - Raw error data from webview
 * @returns Validated data with projectScope guaranteed to be set
 */
export function validateErrorData(data: any): {
  message: string;
  filePath: string;
  line: number;
  projectScope: ProjectScope;
  [key: string]: any;
} {
  if (!data || typeof data !== 'object') {
    console.error('[ProjectScopeValidator] Invalid error data received:', data);
    throw new Error('Error data must be an object');
  }

  const { message, filePath, line, projectScope, ...rest } = data;

  if (!message || typeof message !== 'string') {
    throw new Error('Error message is required and must be a string');
  }

  const validatedScope = getProjectScope(projectScope);

  return {
    message: message.trim(),
    filePath: filePath ? String(filePath).trim() : 'unknown',
    line: Math.max(1, parseInt(String(line)) || 1),
    projectScope: validatedScope,
    ...rest
  };
}

/**
 * Log project scope for debugging
 * @param scope - Project scope to log
 * @param context - Context identifier
 */
export function logProjectScope(scope: ProjectScope, context: string = 'ProjectScope'): void {
  const scopeInfo = {
    scope,
    timestamp: new Date().toISOString(),
    isValid: isValidProjectScope(scope)
  };

  console.log(`[${context}]`, scopeInfo);
}

/**
 * Create a diagnostic report for project scope
 * @param errorData - Error data with scope
 * @returns Diagnostic report
 */
export function createScopeDiagnostics(errorData: {
  message?: string;
  filePath?: string;
  projectScope?: ProjectScope;
}): {
  scope: ProjectScope;
  isValid: boolean;
  message: string;
} {
  const scope = getProjectScope(errorData.projectScope);
  const isValid = isValidProjectScope(scope);

  return {
    scope,
    isValid,
    message: isValid
      ? `Using "${scope}" scope for error analysis`
      : `Invalid scope provided, fell back to default "${DEFAULT_PROJECT_SCOPE}"`
  };
}
