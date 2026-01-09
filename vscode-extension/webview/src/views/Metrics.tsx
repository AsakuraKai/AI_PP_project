/**
 * Metrics View - Performance analytics and insights
 * 
 * Features:
 * - ✅ Success rate chart (line graph over time)
 * - ✅ Average analysis time chart (bar graph)
 * - ✅ Error type distribution (pie/bar chart)
 * - ✅ Model performance comparison
 * - ✅ Learning metrics (cache hit rate, improvements)
 * - ✅ Time range selector
 * - ✅ Export functionality
 * - ✅ Loading skeletons for async content
 * - ✅ ARIA labels for accessibility
 * - ✅ Screen reader support
 */

import { useEffect } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  PieChart,
  RefreshCw,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StatsCardSkeleton, ChartSkeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { announce, createButtonProps } from '../lib/accessibility';
import { cn } from '../lib/utils';

export function Metrics() {
  const {
    metricsData,
    loading,
    timeRange,
    setTimeRange,
    successRateChartData,
    analysisTimeChartData,
    summaryStats,
    refreshMetrics,
    exportMetrics
  } = useMetrics();
  
  // Announce metrics updates
  useEffect(() => {
    if (!loading && summaryStats) {
      announce(`Metrics loaded: ${summaryStats.totalAnalyses} analyses, ${summaryStats.overallSuccessRate}% success rate`, 'polite');
    }
  }, [loading, summaryStats]);
  
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  return (
    <main className="p-8 space-y-6" role="main" aria-label="Performance Metrics">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">Performance Metrics</h1>
          <p className="text-zinc-400">
            Analytics and insights for your RCA analyses
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Metrics controls">
          <Select value={timeRange} onValueChange={(value: any) => {
            setTimeRange(value);
            announce(`Time range changed to ${value}`, 'polite');
          }}>
            <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 focus-ring" aria-label="Select time range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            {...createButtonProps('Export metrics data')}
            variant="outline"
            size="sm"
            onClick={() => {
              exportMetrics();
              announce('Exporting metrics', 'polite');
            }}
            className="gap-2 focus-ring"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export</span>
          </Button>
          <Button
            {...createButtonProps('Refresh metrics data')}
            variant="outline"
            size="sm"
            onClick={() => {
              refreshMetrics();
              announce('Refreshing metrics', 'polite');
            }}
            disabled={loading}
            className="gap-2 focus-ring"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
      
      {loading && !metricsData ? (
        <div className="space-y-4" role="status" aria-label="Loading metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : !summaryStats ? (
        <EmptyState
          icon={BarChart3}
          title="No Metrics Available"
          description="Perform some analyses to see metrics and insights."
        />
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="region" aria-label="Summary statistics">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Total Analyses</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${summaryStats.totalAnalyses} total analyses`}>
                      {summaryStats.totalAnalyses}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Success Rate</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${summaryStats.overallSuccessRate} percent success rate`}>
                      {summaryStats.overallSuccessRate}%
                    </p>
                  </div>
                  <CheckCircle2
                    className={cn(
                      'h-8 w-8',
                      summaryStats.overallSuccessRate >= 80 ? 'text-green-600' : 'text-yellow-600'
                    )}
                    aria-hidden="true"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Avg Time</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`Average time: ${formatTime(summaryStats.avgAnalysisTime)}`}>
                      {formatTime(summaryStats.avgAnalysisTime)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Top Error Type</p>
                    <p className="text-lg font-semibold mt-1 truncate" title={summaryStats.topErrorType}>
                      {summaryStats.topErrorType}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Cache Hit Rate</p>
                    <p className="text-2xl font-semibold mt-1">{summaryStats.cacheHitRate}%</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Avg Confidence</p>
                    <p className="text-2xl font-semibold mt-1">{summaryStats.avgConfidence}%</p>
                  </div>
                  <Brain className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Success Rate Chart */}
          {successRateChartData && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Success Rate Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart
                  data={successRateChartData}
                  height={200}
                  color="#10b981"
                />
              </CardContent>
            </Card>
          )}
          
          {/* Analysis Time Chart */}
          {analysisTimeChartData && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Average Analysis Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={analysisTimeChartData}
                  height={200}
                  color="#3b82f6"
                  formatValue={formatTime}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Error Type Distribution */}
          {metricsData && metricsData.errorTypes.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-orange-500" />
                  Error Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricsData.errorTypes.map((errorType, index) => {
                    const percentage = (errorType.count / summaryStats.totalAnalyses) * 100;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300">{errorType.type}</span>
                          <span className="text-zinc-400">
                            {errorType.count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              errorType.successRate >= 0.8
                                ? 'bg-green-950 text-green-300'
                                : errorType.successRate >= 0.5
                                ? 'bg-yellow-950 text-yellow-300'
                                : 'bg-red-950 text-red-300'
                            )}
                          >
                            {Math.round(errorType.successRate * 100)}% success rate
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Model Performance */}
          {metricsData && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-pink-500" />
                  Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-sm text-zinc-400">Model</span>
                      <span className="font-medium">{metricsData.modelPerformance.model}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-sm text-zinc-400">Total Analyses</span>
                      <span className="font-medium">{metricsData.modelPerformance.totalAnalyses}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-sm text-zinc-400">Success Rate</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          metricsData.modelPerformance.successRate >= 0.8
                            ? 'bg-green-950 text-green-300'
                            : 'bg-yellow-950 text-yellow-300'
                        )}
                      >
                        {Math.round(metricsData.modelPerformance.successRate * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-sm text-zinc-400">Avg Time</span>
                      <span className="font-medium">{formatTime(metricsData.modelPerformance.avgTime)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Learning Metrics */}
          {metricsData && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Learning & Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-950 rounded border border-zinc-800 text-center">
                    <p className="text-sm text-zinc-400 mb-2">Total Learnings</p>
                    <p className="text-3xl font-semibold text-yellow-500">
                      {metricsData.learningMetrics.totalLearnings}
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded border border-zinc-800 text-center">
                    <p className="text-sm text-zinc-400 mb-2">Cache Hit Rate</p>
                    <p className="text-3xl font-semibold text-green-500">
                      {Math.round(metricsData.learningMetrics.cacheHitRate * 100)}%
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded border border-zinc-800 text-center">
                    <p className="text-sm text-zinc-400 mb-2">Confidence Improvement</p>
                    <p className="text-3xl font-semibold text-blue-500">
                      +{Math.round(metricsData.learningMetrics.avgConfidenceImprovement * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// Simple Line Chart Component
function SimpleLineChart({ data, height, color }: {
  data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> };
  height: number;
  color: string;
}) {
  const maxValue = Math.max(...data.datasets[0].data);
  const points = data.datasets[0].data.map((value, index) => ({
    x: (index / (data.labels.length - 1)) * 100,
    y: ((maxValue - value) / maxValue) * 100
  }));
  
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  
  return (
    <div className="space-y-4">
      <div className="relative bg-zinc-950 rounded border border-zinc-800 p-4" style={{ height: `${height}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0"
        >
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        {data.labels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data, height, color, formatValue }: {
  data: { labels: string[]; datasets: Array<{ label: string; data: number[] }> };
  height: number;
  color: string;
  formatValue?: (value: number) => string;
}) {
  const maxValue = Math.max(...data.datasets[0].data);
  
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 justify-between" style={{ height: `${height}px` }}>
        {data.datasets[0].data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-zinc-950 rounded border border-zinc-800 relative overflow-hidden">
              <div
                className="absolute bottom-0 inset-x-0 rounded transition-all"
                style={{
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: color
                }}
              />
              <div className="h-full" style={{ minHeight: `${height}px` }} />
            </div>
            <span className="text-xs text-zinc-400">
              {formatValue ? formatValue(value) : value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        {data.labels.map((label, index) => (
          <span key={index} className="text-center flex-1">{label}</span>
        ))}
      </div>
    </div>
  );
}
