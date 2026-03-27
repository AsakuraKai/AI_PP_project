/**
 * useAnalysis - Hook for Analyze view
 * 
 * Provides:
 * - Error input and analysis triggering
 * - Real-time analysis progress
 * - Live hypothesis updates
 * - Result display
 * - Fix suggestion management
 * - Proper validation and error handling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useVSCode } from './useVSCode';
import { useFeedback, FeedbackStatus } from './useFeedback';

export interface AnalysisProgress {
  iteration: number;
  maxIterations: number;
  progress: number;
  currentThought?: string;
  hypothesis?: string;
  recentActions?: string[];
  recentObservations?: string[];
  elapsed?: number;
}

export interface AnalysisResult {
  hypothesis: string;
  rootCause: string;
  confidence: number;
  fixes: CodeFix[];
  reasoning: string[];
  duration: number;
  feedback?: {
    enabled: boolean;
    rcaId?: string;
    errorHash?: string;
  };
}

export interface CodeFix {
  id: string;
  filePath: string;
  description: string;
  diff: string;
  confidence: number;
}

export type AnalysisState = 'empty' | 'analyzing' | 'complete' | 'error';

export function useAnalysis() {
  const { postMessage } = useVSCode();

  const [state, setState] = useState<AnalysisState>('empty');
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentErrorId, setCurrentErrorId] = useState<string | null>(null);
  const [fixApplicationStatus, setFixApplicationStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  // Use shared feedback hook - use a valid FeedbackMetadata or undefined
  const { feedbackStatus, setFeedbackStatus, submitFeedback } = useFeedback(result?.feedback);

  // Listen for analysis updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'analysisStarted':
          setState('analyzing');
          setProgress({
            iteration: 0,
            maxIterations: message.maxIterations || 6,
            progress: 0
          });
          setResult(null);
          setError(null);
          setCurrentErrorId(message.errorId);
          setFeedbackStatus({ status: 'idle' });
          break;

        case 'analysisProgress':
          setProgress(message.progress);
          break;

        case 'analysisComplete':
          setState('complete');
          setResult(message.result);
          setProgress(null);
          setFeedbackStatus({ status: 'idle' });
          break;

        case 'analysisError':
          setState('error');
          setError(message.error);
          setProgress(null);
          setFeedbackStatus({ status: 'error', message: message.error });
          break;

        case 'analysisCancelled':
          setState('empty');
          setProgress(null);
          setError(null);
          setFeedbackStatus({ status: 'idle' });
          break;

        case 'feedbackResult':
          setFeedbackStatus({ status: 'sent', message: message.result?.message || 'Feedback submitted' });
          // Update confidence in the displayed result if provided
          if (typeof message.result?.newConfidence === 'number') {
            setResult((prev) => (prev ? { ...prev, confidence: message.result.newConfidence } : prev));
          }
          break;

        case 'feedbackError':
          setFeedbackStatus({ status: 'error', message: message.error || 'Feedback failed' });
          break;

        case 'fixApplied':
          setFixApplicationStatus({
            type: 'success',
            message: `Fix applied successfully to ${message.file || 'file'}`
          });
          // Clear success message after 5 seconds
          const successTimeoutId = setTimeout(() => {
            setFixApplicationStatus({ type: null, message: null });
          }, 5000);
          return () => clearTimeout(successTimeoutId);

        case 'fixApplyError':
          setFixApplicationStatus({
            type: 'error',
            message: message.error || 'Failed to apply fix'
          });
          // Clear error message after 5 seconds
          const errorTimeoutId = setTimeout(() => {
            setFixApplicationStatus({ type: null, message: null });
          }, 5000);
          return () => clearTimeout(errorTimeoutId);

        case 'fixRejected':
          // Remove the rejected fix from the result
          setResult((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              fixes: prev.fixes.filter(f => f.id !== message.fixId)
            };
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setFeedbackStatus]);

  const startAnalysis = useCallback((errorId: string, settings?: any) => {
    postMessage('startAnalysis', { errorId, settings });
  }, [postMessage]);

  const startManualAnalysis = useCallback((errorText: string, settings?: any) => {
    if (!errorText || typeof errorText !== 'string') {
      console.error('[useAnalysis] Invalid error text provided to startManualAnalysis');
      return;
    }

    try {
      const errorData = JSON.parse(errorText);
      console.log('[useAnalysis] Starting manual analysis with data:', {
        hasMessage: !!errorData.message,
        hasPath: !!errorData.filePath,
        projectScope: errorData.projectScope
      });
    } catch (e) {
      console.warn('[useAnalysis] Could not parse error text as JSON');
    }

    postMessage('startManualAnalysis', { errorText, settings });
  }, [postMessage]);

  const cancelAnalysis = useCallback(() => {
    postMessage('cancelAnalysis');
  }, [postMessage]);

  const applyFix = useCallback((fixId: string) => {
    postMessage('applyFixById', { fixId });
  }, [postMessage]);

  const rejectFix = useCallback((fixId: string) => {
    postMessage('rejectFix', { fixId });
  }, [postMessage]);

  const exportResult = useCallback(() => {
    if (result) {
      postMessage('exportResult', { result });
    }
  }, [postMessage, result]);

  const reset = useCallback(() => {
    setState('empty');
    setProgress(null);
    setResult(null);
    setError(null);
    setCurrentErrorId(null);
    setFeedbackStatus({ status: 'idle' });
  }, []);

  return {
    state,
    progress,
    result,
    error,
    currentErrorId,
    feedbackStatus,
    fixApplicationStatus,
    startAnalysis,
    startManualAnalysis,
    cancelAnalysis,
    applyFix,
    rejectFix,
    exportResult,
    submitFeedback,
    reset
  };
}
