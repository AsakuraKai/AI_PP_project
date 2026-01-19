/**
 * Webview UI Constants
 * Centralized styling, labels, and configuration for webview components
 */

/**
 * Error scope UI configuration
 */
export const ERROR_SCOPE_CONFIG = {
  label: 'Error Scope',
  description: 'Is the error from this workspace?',
  options: {
    inside: {
      label: 'Inside This Project',
      accessibleLabel: 'Error scope: Inside this project',
      description: 'Error originated from within this workspace',
      indicator: 'O|',
      colorClass: 'bg-purple-600'
    },
    outside: {
      label: 'Not Inside This Project',
      accessibleLabel: 'Error scope: Not inside this project',
      description: 'Error originated from outside this workspace',
      indicator: '|O',
      colorClass: 'bg-zinc-600'
    }
  }
} as const;

/**
 * Form field styles
 */
export const FORM_STYLES = {
  input: 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500',
  label: 'block text-sm font-medium text-zinc-200 mb-2',
  container: 'bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4',
  hint: 'text-xs text-zinc-500 mt-1'
} as const;

/**
 * Button accessibility
 */
export const BUTTON_ACCESSIBILITY = {
  submit: 'Start analyzing the error',
  cancel: 'Cancel the current analysis',
  reset: 'Reset form and clear analysis',
  applFix: 'Apply this fix to the file'
} as const;
