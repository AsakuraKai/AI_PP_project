/**
 * useAnalysis - Hook for Analyze view
 * 
 * Provides:
 * - Error input and analysis triggering
 * - Real-time analysis progress
 * - Live hypothesis updates
 * - Result display
 * - Fix suggestion management
 */

import { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './useVSCode';

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
  const [feedbackStatus, setFeedbackStatus] = useState<{ status: 'idle' | 'sending' | 'sent' | 'error'; message?: string }>(
    { status: 'idle' }
  );

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
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startAnalysis = useCallback((errorId: string, settings?: any) => {
    postMessage('startAnalysis', { errorId, settings });
  }, [postMessage]);

  const startManualAnalysis = useCallback((errorText: string, settings?: any) => {
    postMessage('startManualAnalysis', { errorText, settings });
  }, [postMessage]);

  const cancelAnalysis = useCallback(() => {
    postMessage('cancelAnalysis');
  }, [postMessage]);

  const applyFix = useCallback((fixId: string) => {
    postMessage('applyFixById', { fixId });
  }, [postMessage]);

  const exportResult = useCallback(() => {
    if (result) {
      postMessage('exportResult', { result });
    }
  }, [postMessage, result]);

  const submitFeedback = useCallback((feedbackType: 'positive' | 'negative') => {
    if (!result?.feedback?.enabled || !result.feedback.rcaId) {
      setFeedbackStatus({ status: 'error', message: 'Feedback unavailable (no persisted rcaId)' });
      return;
    }

    setFeedbackStatus({ status: 'sending' });
    postMessage('submitFeedback', {
      feedbackType,
      rcaId: result.feedback.rcaId,
      errorHash: result.feedback.errorHash
    });
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
    startAnalysis,
    startManualAnalysis,
    cancelAnalysis,
    applyFix,
    exportResult,
    submitFeedback,
    reset
  };
}
