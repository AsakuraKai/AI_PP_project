/**
 * Analyze View - Interactive error analysis with live progress
 * 
 * Three states:
 * - Empty: Error input form
 * - Analyzing: Live iteration progress display
 * - Complete: Result display with code diffs and fix suggestions
 * 
 * Phase 4 Enhancements:
 * - [OK] Form accessibility (labels, ARIA)
 * - [OK] Keyboard navigation (Enter to submit)
 * - [OK] Screen reader support
 * - [OK] Enhanced empty state
 * - [OK] Live region for progress
 * - [OK] Project scope validation
 * - [OK] Centralized configuration constants
 */

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Play, X } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { Button } from '../components/ui/button';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { AnalysisResult } from '../components/AnalysisResult';
import { announce } from '../lib/accessibility';
import { ERROR_SCOPE_CONFIG, BUTTON_ACCESSIBILITY } from '../constants/ui';

export function Analyze() {
  const {
    state,
    progress,
    result,
    error,
    feedbackStatus,
    startManualAnalysis,
    cancelAnalysis,
    applyFix,
    exportResult,
    submitFeedback,
    reset
  } = useAnalysis();

  const [errorText, setErrorText] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [projectScope, setProjectScope] = useState<'inside' | 'outside'>('inside');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Announce state changes to screen readers
  useEffect(() => {
    if (state === 'analyzing') {
      announce('Analysis started', 'polite');
    } else if (state === 'complete') {
      announce('Analysis complete', 'polite');
    } else if (state === 'error') {
      announce('Analysis failed: ' + error, 'assertive');
    }
  }, [state, error]);

  /**
   * Validate error input before submission
   */
  const validateErrorInput = useCallback((): boolean => {
    if (!errorText.trim()) {
      setValidationError('Error message is required');
      return false;
    }

    if (errorText.trim().length < 10) {
      setValidationError('Error message should be at least 10 characters');
      return false;
    }

    setValidationError(null);
    return true;
  }, [errorText]);

  const handleAnalyze = useCallback(() => {
    if (!validateErrorInput()) {
      announce('Validation failed: ' + validationError, 'assertive');
      return;
    }

    const errorData = {
      message: errorText.trim(),
      filePath: selectedFile.trim() || 'unknown',
      line: Math.max(1, parseInt(selectedLine) || 0),
      projectScope
    };

    console.log('[Analyze] Submitting error with scope:', projectScope);
    startManualAnalysis(JSON.stringify(errorData));
  }, [errorText, selectedFile, selectedLine, projectScope, validateErrorInput, startManualAnalysis, validationError]);

  // Empty State - Error Input
  if (state === 'empty') {
    return (
      <div className="p-8 space-y-6" role="main" aria-label="Analyze Error">
        <div>
          <h1 className="text-3xl font-light mb-2">Analyze Error</h1>
          <p className="text-zinc-400">
            Paste an error message or select from the error queue to begin analysis
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <form
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyze();
            }}
            aria-label="Error analysis form"
          >
            <div>
              <label
                htmlFor="error-message"
                className="block text-sm font-medium text-zinc-200 mb-2"
              >
                Error Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="error-message"
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                placeholder="Paste your error message here..."
                rows={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                required
                aria-required="true"
                aria-describedby="error-message-hint"
              />
              <p id="error-message-hint" className="text-xs text-zinc-500 mt-1">
                Include the full error message and stack trace if available
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="file-path"
                  className="block text-sm font-medium text-zinc-200 mb-2"
                >
                  File Path (optional)
                </label>
                <input
                  id="file-path"
                  type="text"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  placeholder="e.g., src/main.ts"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-describedby="file-path-hint"
                />
                <p id="file-path-hint" className="text-xs text-zinc-500 mt-1">
                  Path to the file where the error occurred
                </p>
              </div>

              <div>
                <label
                  htmlFor="line-number"
                  className="block text-sm font-medium text-zinc-200 mb-2"
                >
                  Line Number (optional)
                </label>
                <input
                  id="line-number"
                  type="number"
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  placeholder="e.g., 42"
                  min="1"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-describedby="line-number-hint"
                />
                <p id="line-number-hint" className="text-xs text-zinc-500 mt-1">
                  Line number where the error occurred
                </p>
              </div>
            </div>

            {/* Error Scope Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  {ERROR_SCOPE_CONFIG.label}
                </label>
                <button
                  type="button"
                  onClick={() => setProjectScope(projectScope === 'inside' ? 'outside' : 'inside')}
                  className="w-full h-10 flex items-center justify-between px-4 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label={ERROR_SCOPE_CONFIG.options[projectScope].accessibleLabel}
                >
                  <span className="text-sm text-zinc-200">
                    {ERROR_SCOPE_CONFIG.options[projectScope].label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-9 h-5 rounded-full transition-colors ${projectScope === 'inside' ? ERROR_SCOPE_CONFIG.options.inside.colorClass : ERROR_SCOPE_CONFIG.options.outside.colorClass}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-all transform ${projectScope === 'inside' ? 'translate-x-2' : '-translate-x-2'}`}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      {ERROR_SCOPE_CONFIG.options[projectScope].indicator}
                    </span>
                  </div>
                </button>
                <p className="text-xs text-zinc-500 mt-1" id="scope-hint">
                  {ERROR_SCOPE_CONFIG.description}
                </p>
              </div>
            </div>

            {/* Validation Error Display */}
            {validationError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-red-300">{validationError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!errorText.trim() || validationError !== null}
              className="w-full gap-2 focus-ring"
              size="lg"
              aria-label={BUTTON_ACCESSIBILITY.submit}
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>Start Analysis</span>
            </Button>
          </form>

          <div className="text-center text-sm text-zinc-500">
            Or select an error from the <a href="#" className="text-purple-400 hover:text-purple-300">Error Queue</a>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing State - Progress Display
  if (state === 'analyzing' && progress) {
    return (
      <div className="p-8 space-y-6" role="main" aria-label="Analysis Progress">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light mb-2">Analyzing Error</h1>
            <p className="text-zinc-400" role="status" aria-live="polite">
              AI agent is analyzing the root cause...
            </p>
          </div>
          <Button
            variant="outline"
            onClick={cancelAnalysis}
            className="gap-2 focus-ring"
            aria-label="Cancel analysis"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span>Cancel</span>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="region" aria-label="Analysis progress details">
            <AnalysisProgress {...progress} />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (state === 'error' && error) {
    return (
      <div className="p-8 space-y-6" role="main" aria-label="Analysis Error">
        <div>
          <h1 className="text-3xl font-light mb-2">Analysis Failed</h1>
          <p className="text-zinc-400">
            An error occurred during analysis
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6" role="alert">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-medium text-red-300 mb-2">
                  Analysis Error
                </h3>
                <p className="text-sm text-zinc-300">{error}</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={reset}
              className="w-full gap-2 focus-ring"
              aria-label="Try analyzing again"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Try Again</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Complete State - Results Display
  if (state === 'complete' && result) {
    return (
      <div className="p-8 space-y-6" role="main" aria-label="Analysis Results">
        <div className="flex items-center justify-between">
          <AnalysisResult
            result={result}
            feedbackStatus={feedbackStatus}
            onApplyFix={applyFix}
            onExport={exportResult}
            onReset={reset}
            onSubmitFeedback={submitFeedback}
          />
        </div>
      </div>
    );
  }

  return null;
}
