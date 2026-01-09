/**
 * useHistory - Hook for History view data
 * 
 * Provides:
 * - Historical analysis data
 * - Search and filter functionality
 * - Re-analyze capability
 * - Export functionality
 * - Real-time updates from extension
 */

import { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './useVSCode';

export interface HistoryItem {
  id: string;
  timestamp: number;
  error: {
    message: string;
    filePath: string;
    line?: number;
    stackTrace?: string;
  };
  result: {
    rootCause: string;
    confidence?: number;
    fixes?: any[];
    analysis?: string;
  };
  duration?: number;
  success: boolean;
}

export type FilterStatus = 'all' | 'success' | 'failed';
export type SortBy = 'timestamp' | 'confidence' | 'duration';
export type SortOrder = 'asc' | 'desc';

export function useHistory() {
  const { postMessage } = useVSCode();
  
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Callbacks
  const loadHistory = useCallback(() => {
    postMessage('getHistory');
  }, [postMessage]);
  
  const refreshHistory = useCallback(() => {
    setLoading(true);
    postMessage('refreshHistory');
  }, [postMessage]);
  
  const searchHistory = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      postMessage('searchHistory', { query });
    } else {
      loadHistory();
    }
  }, [postMessage, loadHistory]);
  
  const reanalyzeError = useCallback((historyId: string) => {
    postMessage('reanalyzeFromHistory', { historyId });
  }, [postMessage]);
  
  const deleteHistoryItem = useCallback((historyId: string) => {
    postMessage('deleteHistoryItem', { historyId });
  }, [postMessage]);
  
  const clearHistory = useCallback(() => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      postMessage('clearHistory');
    }
  }, [postMessage]);
  
  const exportToMarkdown = useCallback((historyId: string) => {
    postMessage('exportHistoryItem', { historyId });
  }, [postMessage]);
  
  const exportAllToMarkdown = useCallback(() => {
    postMessage('exportAllHistory');
  }, [postMessage]);
  
  // Load history on mount
  useEffect(() => {
    loadHistory();
    
    // Refresh every 60 seconds (less frequent than dashboard since history changes less)
    const interval = setInterval(() => {
      loadHistory();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadHistory]);
  
  // Listen for updates from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'historyData':
          setHistoryItems(message.history || []);
          setLoading(false);
          break;
          
        case 'historyUpdated':
          setHistoryItems(message.history || []);
          break;
          
        case 'searchHistoryResults':
          setHistoryItems(message.results || []);
          setLoading(false);
          break;
          
        case 'historyItemDeleted':
          setHistoryItems(prev => prev.filter(item => item.id !== message.id));
          break;
          
        case 'historyCleared':
          setHistoryItems([]);
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Apply filters and sorting
  const filteredItems = historyItems.filter(item => {
    // Filter by status
    if (filterStatus === 'success' && !item.success) return false;
    if (filterStatus === 'failed' && item.success) return false;
    
    // If there's a search query, it's already filtered by the backend
    // But we can do additional client-side filtering if needed
    return true;
  });
  
  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'timestamp':
        comparison = a.timestamp - b.timestamp;
        break;
      case 'confidence':
        comparison = (a.result.confidence || 0) - (b.result.confidence || 0);
        break;
      case 'duration':
        comparison = (a.duration || 0) - (b.duration || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Group by date for timeline view
  const groupedByDate = sortedItems.reduce((groups, item) => {
    const date = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey: string;
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else if (date >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      groupKey = 'This Week';
    } else if (date >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      groupKey = 'This Month';
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    
    return groups;
  }, {} as Record<string, HistoryItem[]>);
  
  // Calculate stats
  const stats = {
    total: historyItems.length,
    successful: historyItems.filter(item => item.success).length,
    failed: historyItems.filter(item => !item.success).length,
    avgDuration: historyItems.length > 0
      ? Math.round(historyItems.reduce((sum, item) => sum + (item.duration || 0), 0) / historyItems.length)
      : 0,
    avgConfidence: historyItems.length > 0
      ? Math.round(historyItems.reduce((sum, item) => sum + (item.result.confidence || 0), 0) / historyItems.length * 100) / 100
      : 0
  };
  
  return {
    historyItems: sortedItems,
    groupedByDate,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    loadHistory,
    refreshHistory,
    searchHistory,
    reanalyzeError,
    deleteHistoryItem,
    clearHistory,
    exportToMarkdown,
    exportAllToMarkdown
  };
}
