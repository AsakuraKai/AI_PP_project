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
          break;
          
        case 'analysisProgress':
          setProgress(message.progress);
          break;
          
        case 'analysisComplete':
          setState('complete');
          setResult(message.result);
          setProgress(null);
          break;
          
        case 'analysisError':
          setState('error');
          setError(message.error);
          setProgress(null);
          break;
          
        case 'analysisCancelled':
          setState('empty');
          setProgress(null);
          setError(null);
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
    postMessage('applyFix', { fixId });
  }, [postMessage]);
  
  const exportResult = useCallback(() => {
    if (result) {
      postMessage('exportAnalysis', { result });
    }
  }, [postMessage, result]);
  
  const reset = useCallback(() => {
    setState('empty');
    setProgress(null);
    setResult(null);
    setError(null);
    setCurrentErrorId(null);
  }, []);
  
  return {
    state,
    progress,
    result,
    error,
    currentErrorId,
    startAnalysis,
    startManualAnalysis,
    cancelAnalysis,
    applyFix,
    exportResult,
    reset
  };
}
