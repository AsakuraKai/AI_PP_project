/**
 * useErrorQueue - Hook for Error Queue view
 * 
 * Provides:
 * - Error list with real-time updates
 * - Filtering by status and type
 * - Search functionality
 * - Bulk operations
 * - Pin/unpin errors
 */

import { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './useVSCode';

export interface ErrorItem {
  id: string;
  timestamp: number;
  message: string;
  type: 'runtime' | 'build' | 'lint' | 'syntax' | 'warning';
  filePath: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  stackTrace?: string[];
  metadata?: {
    pinned?: boolean;
    [key: string]: any;
  };
}

export type FilterStatus = 'all' | 'pending' | 'analyzing' | 'complete' | 'failed';
export type FilterType = 'all' | 'runtime' | 'build' | 'lint' | 'syntax' | 'warning';
export type SortBy = 'timestamp' | 'file' | 'type' | 'severity';
export type SortOrder = 'asc' | 'desc';

export function useErrorQueue() {
  const { postMessage } = useVSCode();
  
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Callbacks
  const loadErrors = useCallback(() => {
    postMessage('getErrorQueue');
  }, [postMessage]);
  
  const refreshErrors = useCallback(() => {
    setLoading(true);
    postMessage('refreshErrorQueue');
  }, [postMessage]);
  
  // Load errors on mount
  useEffect(() => {
    loadErrors();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadErrors, 10000);
    return () => clearInterval(interval);
  }, [loadErrors]);
  
  // Listen for error queue updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      console.log('[useErrorQueue] Received message:', message.command, message);
      
      switch (message.command) {
        case 'errorQueueData':
          console.log('[useErrorQueue] Setting errors:', message.errors?.length || 0, 'errors');
          setErrors(message.errors || []);
          setLoading(false);
          break;
          
        case 'errorUpdated':
          console.log('[useErrorQueue] Error updated:', message.error?.id);
          setErrors(prev =>
            prev.map(e => e.id === message.error.id ? message.error : e)
          );
          break;
          
        case 'errorAdded':
          console.log('[useErrorQueue] Error added:', message.error?.id);
          setErrors(prev => [...prev, message.error]);
          break;
          
        case 'errorRemoved':
          console.log('[useErrorQueue] Error removed:', message.errorId);
          setErrors(prev => prev.filter(e => e.id !== message.errorId));
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(message.errorId);
            return next;
          });
          break;
      }
    };
    
    console.log('[useErrorQueue] Setting up message listener');
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Filter and sort errors
  const filteredErrors = errors
    .filter(error => {
      // Status filter
      if (filterStatus !== 'all' && error.status !== filterStatus) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all' && error.type !== filterType) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          error.message.toLowerCase().includes(query) ||
          error.filePath.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'file':
          comparison = a.filePath.localeCompare(b.filePath);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'severity': {
          const severityOrder = { error: 0, warning: 1, info: 2 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  const analyzeError = useCallback((errorId: string) => {
    postMessage('analyzeError', { errorId });
  }, [postMessage]);
  
  const analyzeSelected = useCallback(() => {
    const errorIds = Array.from(selectedIds);
    postMessage('analyzeMultipleErrors', { errorIds });
    setSelectedIds(new Set());
  }, [postMessage, selectedIds]);
  
  const analyzeAll = useCallback(() => {
    postMessage('analyzeAllErrors');
  }, [postMessage]);
  
  const removeError = useCallback((errorId: string) => {
    postMessage('removeError', { errorId });
  }, [postMessage]);
  
  const clearCompleted = useCallback(() => {
    postMessage('clearCompletedErrors');
  }, [postMessage]);
  
  const clearAll = useCallback(() => {
    postMessage('clearAllErrors');
    setSelectedIds(new Set());
  }, [postMessage]);
  
  const pinError = useCallback((errorId: string) => {
    postMessage('pinError', { errorId });
  }, [postMessage]);
  
  const unpinError = useCallback((errorId: string) => {
    postMessage('unpinError', { errorId });
  }, [postMessage]);
  
  const openErrorLocation = useCallback((errorId: string) => {
    postMessage('openErrorLocation', { errorId });
  }, [postMessage]);
  
  const toggleSelection = useCallback((errorId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(errorId)) {
        next.delete(errorId);
      } else {
        next.add(errorId);
      }
      return next;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredErrors.map(e => e.id)));
  }, [filteredErrors]);
  
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  return {
    errors: filteredErrors,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
    refreshErrors,
    analyzeError,
    analyzeSelected,
    analyzeAll,
    removeError,
    clearCompleted,
    clearAll,
    pinError,
    unpinError,
    openErrorLocation,
    stats: {
      total: errors.length,
      filtered: filteredErrors.length,
      selected: selectedIds.size,
      pending: errors.filter(e => e.status === 'pending').length,
      analyzing: errors.filter(e => e.status === 'analyzing').length,
      complete: errors.filter(e => e.status === 'complete').length,
      failed: errors.filter(e => e.status === 'failed').length,
    }
  };
}
