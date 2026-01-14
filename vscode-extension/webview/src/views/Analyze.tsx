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
 */

import { useState, useEffect } from 'react';
import { AlertCircle, Download, Play, RefreshCw, Search, X, Sparkles } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { FixSuggestion } from '../components/FixSuggestion';
import { EmptyState } from '../components/EmptyState';
import { announce } from '../lib/accessibility';

export function Analyze() {
  const {
    state,
    progress,
    result,
    error,
    startManualAnalysis,
    cancelAnalysis,
    applyFix,
    exportResult,
    reset
  } = useAnalysis();
  
  const [errorText, setErrorText] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  
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
  
  const handleAnalyze = () => {
    if (!errorText.trim()) return;
    
    const errorData = {
      message: errorText,
      filePath: selectedFile || 'unknown',
      line: parseInt(selectedLine) || 0
    };
    
    startManualAnalysis(JSON.stringify(errorData));
  };
  
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
            
            <Button
              type="submit"
              disabled={!errorText.trim()}
              className="w-full gap-2 focus-ring"
              size="lg"
              aria-label="Start analyzing the error"
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
          <div>
            <h1 className="text-3xl font-light mb-2">Analysis Complete</h1>
            <p className="text-zinc-400">
              Root cause identified in <time>{result.duration}ms</time>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportResult}
              className="gap-2 focus-ring"
              aria-label="Export analysis results"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              className="gap-2 focus-ring"
              aria-label="Start a new analysis"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>New Analysis</span>
            </Button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Root Cause */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="article" aria-labelledby="root-cause-title">
            <div className="flex items-start gap-3 mb-4">
              <Search className="h-6 w-6 text-purple-400 shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h2 id="root-cause-title" className="text-xl font-medium text-zinc-200 mb-2">
                  Root Cause
                </h2>
                <p className="text-zinc-300 leading-relaxed">
                  {result.rootCause}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
              <Badge variant="outline" className="text-purple-400" aria-label={`Confidence: ${Math.round(result.confidence * 100)} percent`}>
                Confidence: {Math.round(result.confidence * 100)}%
              </Badge>
              {result.fixes.length > 0 && (
                <Badge variant="outline" aria-label={`${result.fixes.length} fixes suggested`}>
                  {result.fixes.length} fixes suggested
                </Badge>
              )}
            </div>
          </div>
          
          {/* Hypothesis */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="article" aria-labelledby="hypothesis-title">
            <h3 id="hypothesis-title" className="text-lg font-medium text-zinc-200 mb-3">Hypothesis</h3>
            <p className="text-zinc-300 leading-relaxed">{result.hypothesis}</p>
          </div>
          
          {/* Reasoning Steps */}
          {result.reasoning.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="article" aria-labelledby="reasoning-title">
              <h3 id="reasoning-title" className="text-lg font-medium text-zinc-200 mb-4">
                Reasoning Steps
              </h3>
              <ol className="space-y-3" aria-label="Analysis reasoning steps">
                {result.reasoning.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="text-sm text-zinc-300 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          {/* Fix Suggestions */}
          {result.fixes.length > 0 && (
            <div className="space-y-4" role="region" aria-labelledby="fixes-title">
              <h3 id="fixes-title" className="text-lg font-medium text-zinc-200">
                Suggested Fixes
              </h3>
              {result.fixes.map((fix) => (
                <FixSuggestion
                  key={fix.id}
                  fix={fix}
                  onApply={applyFix}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return null;
}
