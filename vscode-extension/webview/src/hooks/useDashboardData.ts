/**
 * useDashboardData - Hook for Dashboard view data
 * 
 * Provides:
 * - Real-time statistics
 * - Recent activity feed
 * - Ollama connection status
 * - Quick action handlers
 */

import { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './useVSCode';

export interface DashboardStats {
  pendingErrors: number;
  analyzesPerformed: number;
  successRate: number;
  averageTime: number;
}

export interface ActivityItem {
  id: string;
  timestamp: number;
  message: string;
  type: 'success' | 'error' | 'analyzing';
  errorMessage?: string;
}

export interface OllamaStatus {
  connected: boolean;
  model?: string;
  responseTime?: number;
  error?: string;
}

export function useDashboardData() {
  const { postMessage } = useVSCode();

  const [stats, setStats] = useState<DashboardStats>({
    pendingErrors: 0,
    analyzesPerformed: 0,
    successRate: 0,
    averageTime: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    connected: false
  });
  const [loading, setLoading] = useState(true);

  // Callbacks
  const loadDashboardData = useCallback(() => {
    postMessage('getDashboardData');
  }, [postMessage]);

  const checkOllamaStatus = useCallback(() => {
    postMessage('checkOllamaStatus');
  }, [postMessage]);

  const refreshData = useCallback(() => {
    setLoading(true);
    loadDashboardData();
    checkOllamaStatus();
  }, [loadDashboardData, checkOllamaStatus]);

  const analyzeAllErrors = useCallback(() => {
    postMessage('analyzeAllErrors');
  }, [postMessage]);

  const scanWorkspace = useCallback(() => {
    postMessage('scanWorkspace');
  }, [postMessage]);

  const openSettings = useCallback(() => {
    postMessage('openSettings');
  }, [postMessage]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    checkOllamaStatus();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      checkOllamaStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData, checkOllamaStatus]);

  // Listen for updates from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[RCA Frontend - Dashboard] Received message:', message);

      switch (message.command) {
        case 'dashboardData':
          if (message.stats) {
            console.log('[RCA Frontend - Dashboard] Stats:', message.stats);
            setStats(message.stats);
          }
          if (message.activity) {
            console.log('[RCA Frontend - Dashboard] Activity:', message.activity);
            setRecentActivity(message.activity);
          }
          setLoading(false);
          break;

        case 'ollamaStatus':
          if (message.status) {
            console.log('[RCA Frontend - Dashboard] Ollama status:', message.status);
            setOllamaStatus({
              connected: message.status.connected || false,
              model: message.status.model,
              responseTime: message.status.responseTime,
              error: message.status.error
            });
          }
          break;

        case 'activityUpdate':
          if (message.activity) {
            console.log('[RCA Frontend - Dashboard] Activity update:', message.activity);
            setRecentActivity(prev => [message.activity, ...prev].slice(0, 5));
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return {
    stats,
    recentActivity,
    ollamaStatus,
    loading,
    refreshData,
    analyzeAllErrors,
    scanWorkspace,
    openSettings
  };
}
