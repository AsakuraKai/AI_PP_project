/**
 * Dashboard View - Main landing page
 * 
 * Features:
 * - Statistics cards (Pending Errors, Analyses Today, Success Rate)
 * - Quick action buttons
 * - Recent activity feed
 * - Ollama status indicator
 * - Workspace health
 * 
 * Phase 4 Enhancements:
 * - ✅ Loading skeletons for initial load
 * - ✅ Enhanced empty states
 * - ✅ Keyboard navigation
 * - ✅ ARIA labels
 * - ✅ Screen reader support
 */

import { AlertTriangle, Play, Search, Settings, RefreshCw, CheckCircle2, Clock, Zap, Sparkles } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Button } from '../components/ui/button';
import { StatsCardSkeleton, ActivityItemSkeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { useDashboardData } from '../hooks/useDashboardData';
import { cn } from '../lib/utils';
import { useEffect } from 'react';

export function Dashboard() {
  const {
    stats,
    recentActivity,
    ollamaStatus,
    loading,
    refreshData,
    analyzeAllErrors,
    scanWorkspace,
    openSettings
  } = useDashboardData();

  // Announce loading state to screen readers
  useEffect(() => {
    if (loading) {
      const announcement = document.getElementById('loading-announcement');
      if (announcement) {
        announcement.textContent = 'Loading dashboard data...';
      }
    }
  }, [loading]);
  
  return (
    <div className="p-8 space-y-8" role="main" aria-label="Dashboard">
      {/* Screen reader announcements */}
      <div
        id="loading-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">RCA Agent Dashboard</h1>
          <p className="text-zinc-400">
            AI-powered root cause analysis for your workspace
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={loading}
          className="gap-2 focus-ring"
          aria-label={loading ? 'Refreshing dashboard data' : 'Refresh dashboard data'}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Statistics Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label="Statistics"
      >
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Pending Errors"
              value={stats.pendingErrors}
              subtitle={stats.pendingErrors === 0 ? 'All clear!' : 'Ready to analyze'}
              icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
              variant={stats.pendingErrors > 0 ? 'warning' : 'success'}
              aria-label={`${stats.pendingErrors} pending errors, ${stats.pendingErrors === 0 ? 'all clear' : 'ready to analyze'}`}
            />
            
            <StatsCard
              title="Analyses Today"
              value={stats.analyzesPerformed}
              subtitle="Total analyses performed"
              icon={<Search className="h-6 w-6" aria-hidden="true" />}
              trend={{
                value: '+12%',
                direction: 'up'
              }}
              aria-label={`${stats.analyzesPerformed} analyses today, up 12%`}
            />
            
            <StatsCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              subtitle="Analysis accuracy"
              icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
              variant={stats.successRate >= 80 ? 'success' : 'warning'}
              aria-label={`${stats.successRate}% success rate`}
            />
            
            <StatsCard
              title="Avg Time"
              value={`${stats.averageTime}s`}
              subtitle="Per analysis"
              icon={<Clock className="h-6 w-6" aria-hidden="true" />}
              trend={{
                value: '-8%',
                direction: 'down'
              }}
              aria-label={`${stats.averageTime} seconds average time, down 8%`}
            />
          </>
        )}
      </div>
      
      {/* Quick Actions */}
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
        role="region"
        aria-label="Quick actions"
      >
        <h2 className="text-xl font-light mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={analyzeAllErrors}
            disabled={stats.pendingErrors === 0 || loading}
            className="gap-2 focus-ring"
            aria-label={`Analyze all ${stats.pendingErrors} pending errors`}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>Analyze All Errors</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={scanWorkspace}
            disabled={loading}
            className="gap-2 focus-ring"
            aria-label="Scan workspace for new errors"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Scan Workspace</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={openSettings}
            className="gap-2 focus-ring"
            aria-label="Open RCA Agent settings"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span>Settings</span>
          </Button>
        </div>
      </div>
      
      {/* Two-column layout for Activity and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div
          className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6"
          role="region"
          aria-label="Recent activity"
        >
          <h2 className="text-xl font-light mb-4">Recent Activity</h2>
          
          {loading ? (
            <div className="space-y-3">
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
            </div>
          ) : recentActivity.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Recent Activity"
              description="Your analysis history will appear here. Start by analyzing an error or scanning your workspace."
              action={{
                label: 'Scan Workspace',
                onClick: scanWorkspace
              }}
            />
          ) : (
            <div className="space-y-3" role="list" aria-label="Activity list">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950"
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${activity.type} activity: ${activity.message}`}
                >
                  <div className={cn(
                    'shrink-0 w-2 h-2 rounded-full mt-2',
                    activity.type === 'success' && 'bg-green-500',
                    activity.type === 'error' && 'bg-red-500',
                    activity.type === 'analyzing' && 'bg-amber-500 animate-pulse'
                  )}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{activity.message}</p>
                    {activity.errorMessage && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        {activity.errorMessage}
                      </p>
                    )}
                    <p className="text-xs text-zinc-600 mt-1">
                      <time dateTime={new Date(activity.timestamp).toISOString()}>
                        {formatTimestamp(activity.timestamp)}
                      </time>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* System Status */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
          role="region"
          aria-label="System status"
        >
          <h2 className="text-xl font-light mb-4">System Status</h2>
          
          <div className="space-y-4">
            {/* Ollama Connection */}
            <div className="flex items-start gap-3" role="status">
              <div className={cn(
                'shrink-0 w-3 h-3 rounded-full mt-1',
                ollamaStatus.connected ? 'bg-green-500' : 'bg-red-500'
              )}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-zinc-200">Ollama Server</p>
                <p className="text-xs text-zinc-500">
                  {ollamaStatus.connected ? 'Connected' : 'Disconnected'}
                </p>
                {ollamaStatus.error && (
                  <p className="text-xs text-red-400 mt-1" role="alert">
                    {ollamaStatus.error}
                  </p>
                )}
              </div>
            </div>
            
            {/* Model Info */}
            {ollamaStatus.connected && ollamaStatus.model && (
              <div className="flex items-start gap-3">
                <Zap className="shrink-0 w-4 h-4 text-zinc-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Model</p>
                  <p className="text-xs text-zinc-500">{ollamaStatus.model}</p>
                </div>
              </div>
            )}
            
            {/* Response Time */}
            {ollamaStatus.connected && ollamaStatus.responseTime && (
              <div className="flex items-start gap-3">
                <Clock className="shrink-0 w-4 h-4 text-zinc-400 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Response Time</p>
                  <p className="text-xs text-zinc-500">{ollamaStatus.responseTime}ms avg</p>
                </div>
              </div>
            )}
            
            {/* Workspace Health */}
            <div className="flex items-start gap-3 pt-4 border-t border-zinc-800">
              <CheckCircle2 className="shrink-0 w-4 h-4 text-green-500 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Workspace</p>
                <p className="text-xs text-zinc-500">Healthy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format timestamp to relative time
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
