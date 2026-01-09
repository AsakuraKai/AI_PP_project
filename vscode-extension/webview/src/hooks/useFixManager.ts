/**
 * useFixManager - Hook for Fix Manager view data
 * 
 * Provides:
 * - Pending fixes queue
 * - Code diff preview
 * - Apply/reject actions
 * - Applied fixes history
 * - Batch operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './useVSCode';

export interface PendingFix {
  id: string;
  errorId: string;
  file: string;
  line?: number;
  before: string;
  after: string;
  explanation: string;
  confidence?: number;
  timestamp: number;
}

export interface AppliedFix {
  id: string;
  fixId: string;
  file: string;
  appliedAt: number;
  success: boolean;
  error?: string;
}

export interface DiffPreview {
  file: string;
  originalContent: string;
  modifiedContent: string;
  changes: Array<{
    line: number;
    type: 'add' | 'remove' | 'modify';
    content: string;
  }>;
}

export function useFixManager() {
  const { postMessage } = useVSCode();
  
  const [pendingFixes, setPendingFixes] = useState<PendingFix[]>([]);
  const [appliedFixes, setAppliedFixes] = useState<AppliedFix[]>([]);
  const [diffPreview, setDiffPreview] = useState<DiffPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());
  
  // Callbacks
  const loadPendingFixes = useCallback(() => {
    postMessage('getPendingFixes');
  }, [postMessage]);
  
  const loadAppliedFixes = useCallback(() => {
    postMessage('getAppliedFixes');
  }, [postMessage]);
  
  const refreshFixes = useCallback(() => {
    setLoading(true);
    loadPendingFixes();
    loadAppliedFixes();
  }, [loadPendingFixes, loadAppliedFixes]);
  
  const previewFix = useCallback((fixId: string) => {
    postMessage('previewFix', { fixId });
  }, [postMessage]);
  
  const applyFix = useCallback((fixId: string) => {
    postMessage('applyFix', { fixId });
  }, [postMessage]);
  
  const rejectFix = useCallback((fixId: string) => {
    postMessage('rejectFix', { fixId });
  }, [postMessage]);
  
  const applySelectedFixes = useCallback(() => {
    if (selectedFixes.size === 0) return;
    postMessage('applyMultipleFixes', { fixIds: Array.from(selectedFixes) });
  }, [postMessage, selectedFixes]);
  
  const rejectSelectedFixes = useCallback(() => {
    if (selectedFixes.size === 0) return;
    postMessage('rejectMultipleFixes', { fixIds: Array.from(selectedFixes) });
    setSelectedFixes(new Set());
  }, [postMessage, selectedFixes]);
  
  const clearAppliedFixes = useCallback(() => {
    if (confirm('Clear all applied fixes history?')) {
      postMessage('clearAppliedFixes');
    }
  }, [postMessage]);
  
  const toggleSelection = useCallback((fixId: string) => {
    setSelectedFixes(prev => {
      const next = new Set(prev);
      if (next.has(fixId)) {
        next.delete(fixId);
      } else {
        next.add(fixId);
      }
      return next;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedFixes(new Set(pendingFixes.map(f => f.id)));
  }, [pendingFixes]);
  
  const deselectAll = useCallback(() => {
    setSelectedFixes(new Set());
  }, []);
  
  // Load fixes on mount
  useEffect(() => {
    loadPendingFixes();
    loadAppliedFixes();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadPendingFixes();
      loadAppliedFixes();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadPendingFixes, loadAppliedFixes]);
  
  // Listen for updates from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'pendingFixesData':
          setPendingFixes(message.fixes || []);
          setLoading(false);
          break;
          
        case 'appliedFixesData':
          setAppliedFixes(message.fixes || []);
          break;
          
        case 'diffPreviewData':
          setDiffPreview(message.diff);
          break;
          
        case 'fixApplied':
          // Remove from pending
          setPendingFixes(prev => prev.filter(f => f.id !== message.fixId));
          // Add to applied
          setAppliedFixes(prev => [
            {
              id: message.id,
              fixId: message.fixId,
              file: message.file,
              appliedAt: Date.now(),
              success: true
            },
            ...prev
          ]);
          // Remove from selection
          setSelectedFixes(prev => {
            const next = new Set(prev);
            next.delete(message.fixId);
            return next;
          });
          break;
          
        case 'fixRejected':
          setPendingFixes(prev => prev.filter(f => f.id !== message.fixId));
          setSelectedFixes(prev => {
            const next = new Set(prev);
            next.delete(message.fixId);
            return next;
          });
          break;
          
        case 'fixApplyError':
          setAppliedFixes(prev => [
            {
              id: message.id,
              fixId: message.fixId,
              file: message.file,
              appliedAt: Date.now(),
              success: false,
              error: message.error
            },
            ...prev
          ]);
          break;
          
        case 'fixesCleared':
          setAppliedFixes([]);
          break;
          
        case 'newFixGenerated':
          setPendingFixes(prev => [message.fix, ...prev]);
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Calculate stats
  const stats = {
    pending: pendingFixes.length,
    applied: appliedFixes.filter(f => f.success).length,
    failed: appliedFixes.filter(f => !f.success).length,
    selected: selectedFixes.size,
    avgConfidence: pendingFixes.length > 0
      ? Math.round(
          pendingFixes.reduce((sum, f) => sum + (f.confidence || 0), 0) / pendingFixes.length * 100
        ) / 100
      : 0
  };
  
  return {
    pendingFixes,
    appliedFixes,
    diffPreview,
    loading,
    selectedFixes,
    stats,
    loadPendingFixes,
    loadAppliedFixes,
    refreshFixes,
    previewFix,
    applyFix,
    rejectFix,
    applySelectedFixes,
    rejectSelectedFixes,
    clearAppliedFixes,
    toggleSelection,
    selectAll,
    deselectAll
  };
}
