/**
 * useFeedback - Shared hook for feedback submission
 * Provides consistent feedback handling across views
 */

import { useState, useCallback } from 'react';
import { useVSCode } from './useVSCode';

export interface FeedbackStatus {
  status: 'idle' | 'sending' | 'sent' | 'error';
  message?: string;
}

export interface FeedbackMetadata {
  enabled: boolean;
  rcaId?: string;
  errorHash?: string;
}

/**
 * Hook for submitting feedback on analysis results
 * @param feedbackMeta - Feedback metadata from analysis result
 * @returns feedback status and submit function
 */
export function useFeedback(feedbackMeta?: FeedbackMetadata) {
  const { postMessage } = useVSCode();
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>({ status: 'idle' });

  const submitFeedback = useCallback((feedbackType: 'positive' | 'negative') => {
    if (!feedbackMeta?.enabled || !feedbackMeta.rcaId) {
      setFeedbackStatus({ 
        status: 'error', 
        message: 'Feedback unavailable (analysis not persisted to ChromaDB)' 
      });
      return;
    }

    setFeedbackStatus({ status: 'sending' });
    postMessage('submitFeedback', {
      feedbackType,
      rcaId: feedbackMeta.rcaId,
      errorHash: feedbackMeta.errorHash
    });
  }, [postMessage, feedbackMeta]);

  const resetFeedbackStatus = useCallback(() => {
    setFeedbackStatus({ status: 'idle' });
  }, []);

  return {
    feedbackStatus,
    setFeedbackStatus,
    submitFeedback,
    resetFeedbackStatus
  };
}
