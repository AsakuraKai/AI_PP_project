/**
 * useMetrics - Hook for Metrics view data
 * 
 * Provides:
 * - Success rate over time
 * - Average analysis time
 * - Error type distribution
 * - Model performance comparison
 * - Learning metrics
 * - Performance trends
 */

import { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './useVSCode';

export interface MetricsData {
  successRate: {
    overall: number;
    byDay: Array<{
      date: string;
      success: number;
      failed: number;
      rate: number;
    }>;
  };
  analysisTime: {
    average: number;
    median: number;
    byDay: Array<{
      date: string;
      avgTime: number;
    }>;
  };
  errorTypes: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
  modelPerformance: {
    model: string;
    totalAnalyses: number;
    successRate: number;
    avgTime: number;
    avgConfidence: number;
  };
  learningMetrics: {
    totalLearnings: number;
    cacheHitRate: number;
    avgConfidenceImprovement: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export function useMetrics() {
  const { postMessage } = useVSCode();
  
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  
  // Callbacks
  const loadMetrics = useCallback(() => {
    postMessage('getMetrics', { timeRange });
  }, [postMessage, timeRange]);
  
  const refreshMetrics = useCallback(() => {
    setLoading(true);
    loadMetrics();
  }, [loadMetrics]);
  
  const exportMetrics = useCallback(() => {
    postMessage('exportMetrics', { timeRange });
  }, [postMessage, timeRange]);
  
  // Load metrics on mount and when timeRange changes
  useEffect(() => {
    loadMetrics();
    
    // Refresh every 60 seconds
    const interval = setInterval(() => {
      loadMetrics();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadMetrics]);
  
  // Listen for updates from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'metricsData':
          setMetricsData(message.metrics);
          setLoading(false);
          break;
          
        case 'metricsUpdated':
          setMetricsData(message.metrics);
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Transform data for charts with defensive checks
  const successRateChartData: ChartData | null = (metricsData?.successRate?.byDay) ? {
    labels: metricsData.successRate.byDay.map(d => d.date),
    datasets: [{
      label: 'Success Rate (%)',
      data: metricsData.successRate.byDay.map(d => d.rate * 100),
      color: '#10b981' // green
    }]
  } : null;
  
  const analysisTimeChartData: ChartData | null = (metricsData?.analysisTime?.byDay) ? {
    labels: metricsData.analysisTime.byDay.map(d => d.date),
    datasets: [{
      label: 'Avg Time (ms)',
      data: metricsData.analysisTime.byDay.map(d => d.avgTime),
      color: '#3b82f6' // blue
    }]
  } : null;
  
  const errorTypeChartData: ChartData | null = (metricsData?.errorTypes) ? {
    labels: metricsData.errorTypes.map(e => e.type),
    datasets: [{
      label: 'Count',
      data: metricsData.errorTypes.map(e => e.count),
      color: '#f59e0b' // orange
    }]
  } : null;
  
  // Calculate summary stats with defensive checks
  const summaryStats = (metricsData?.successRate?.byDay && metricsData?.analysisTime && metricsData?.errorTypes && metricsData?.learningMetrics && metricsData?.modelPerformance) ? {
    totalAnalyses: metricsData.successRate.byDay.reduce((sum, d) => sum + d.success + d.failed, 0),
    overallSuccessRate: Math.round(metricsData.successRate.overall * 100),
    avgAnalysisTime: Math.round(metricsData.analysisTime.average),
    topErrorType: metricsData.errorTypes.length > 0 ? metricsData.errorTypes[0].type : 'N/A',
    cacheHitRate: Math.round(metricsData.learningMetrics.cacheHitRate * 100),
    avgConfidence: Math.round(metricsData.modelPerformance.avgConfidence * 100)
  } : null;
  
  return {
    metricsData,
    loading,
    timeRange,
    setTimeRange,
    successRateChartData,
    analysisTimeChartData,
    errorTypeChartData,
    summaryStats,
    loadMetrics,
    refreshMetrics,
    exportMetrics
  };
}
