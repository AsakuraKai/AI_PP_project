/**
 * History View - Browse and search past analyses
 * 
 * Features:
 * - [OK] Timeline grouped by date (Today, Yesterday, This Week, etc.)
 * - [OK] Full-text search across error messages and root causes
 * - [OK] Filter by success/failure
 * - [OK] Re-analyze past errors
 * - [OK] Export analysis to markdown
 * - [OK] Delete individual items or clear all history
 * - [OK] Keyboard navigation (Arrow keys through timeline, Enter to expand)
 * - [OK] ARIA labels for accessibility
 * - [OK] Loading skeletons for async content
 * - [OK] Screen reader announcements
 */

import { useState, useRef, useEffect } from 'react';
import {
  Clock,
  Download,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter
} from 'lucide-react';
import { useHistory, type FilterStatus } from '../hooks/useHistory';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { StatsCardSkeleton, TimelineItemSkeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { handleListKeyboard, announce, createButtonProps } from '../lib/accessibility';
import { cn } from '../lib/utils';

export function History() {
  const {
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
    refreshHistory,
    searchHistory,
    reanalyzeError,
    deleteHistoryItem,
    clearHistory,
    exportToMarkdown,
    exportAllToMarkdown
  } = useHistory();

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Flatten items for keyboard navigation
  const allItems = Object.values(groupedByDate).flat();

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      const wasExpanded = next.has(itemId);
      if (wasExpanded) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      // Announce state change
      announce(wasExpanded ? 'Item collapsed' : 'Item expanded', 'polite');

      return next;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchHistory(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleItemKeyboard = (e: React.KeyboardEvent, itemId: string, index: number) => {
    handleListKeyboard(e, {
      currentIndex: index,
      itemCount: allItems.length,
      onNavigate: (newIndex) => {
        setFocusedIndex(newIndex);
        const targetItem = allItems[newIndex];
        const element = itemRefs.current.get(targetItem.id);
        element?.focus();
      },
      onSelect: () => toggleExpand(itemId),
      wrap: false
    });
  };

  // Announce stats changes
  useEffect(() => {
    if (!loading && stats.total > 0) {
      announce(`Loaded ${stats.total} analyses with ${stats.successful} successful`, 'polite');
    }
  }, [loading, stats.total, stats.successful]);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month'];
  const sortedGroups = Object.keys(groupedByDate).sort((a, b) => {
    const aIndex = groupOrder.indexOf(a);
    const bIndex = groupOrder.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // For month names, sort chronologically (most recent first)
    return b.localeCompare(a);
  });

  return (
    <main className="p-8 space-y-6" role="main" aria-label="Analysis History">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">Analysis History</h1>
          <p className="text-zinc-400" role="status" aria-live="polite">
            {stats.total} analyses • {stats.successful} successful • {stats.failed} failed
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            {...createButtonProps('Export all analyses to markdown')}
            variant="outline"
            size="sm"
            onClick={exportAllToMarkdown}
            disabled={stats.total === 0}
            className="gap-2 focus-ring"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export All</span>
          </Button>
          <Button
            {...createButtonProps('Refresh history data')}
            variant="outline"
            size="sm"
            onClick={() => {
              refreshHistory();
              announce('Refreshing history', 'polite');
            }}
            disabled={loading}
            className="gap-2 focus-ring"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4" role="search">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <label htmlFor="history-search" className="sr-only">Search analyses</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden="true" />
            <Input
              id="history-search"
              placeholder="Search errors, root causes, files..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 bg-zinc-950 border-zinc-800 focus-ring"
              aria-label="Search through analysis history"
            />
          </div>
        </div>

        {/* Status Filter */}
        <Select
          value={filterStatus}
          onValueChange={(value) => {
            setFilterStatus(value as FilterStatus);
            announce(`Filtering by ${value} status`, 'polite');
          }}
        >
          <SelectTrigger className="w-[180px] !bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800 transition-colors focus-ring" aria-label="Filter by status">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">All Status</SelectItem>
            <SelectItem value="success" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">Successful Only</SelectItem>
            <SelectItem value="failed" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">Failed Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px] !bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800 transition-colors focus-ring" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="timestamp" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">Sort by Date</SelectItem>
            <SelectItem value="confidence" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">Sort by Confidence</SelectItem>
            <SelectItem value="duration" className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800">Sort by Duration</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Button
          {...createButtonProps(`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`)}
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="gap-2 focus-ring"
        >
          <span aria-hidden="true">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
        </Button>

        {/* Clear History */}
        <Button
          {...createButtonProps('Clear all history')}
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm('Are you sure you want to clear all history?')) {
              clearHistory();
              announce('History cleared', 'polite');
            }
          }}
          disabled={stats.total === 0}
          className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 focus-ring"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span>Clear All</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Statistics summary">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Total Analyses</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.total} total analyses`}>{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-zinc-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Success Rate</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0} percent success rate`}>
                      {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Avg Duration</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.avgDuration} milliseconds average duration`}>{stats.avgDuration}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Avg Confidence</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.avgConfidence} average confidence score`}>{stats.avgConfidence}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-purple-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-6" role="status" aria-label="Loading history">
          {[...Array(3)].map((_, groupIndex) => (
            <div key={groupIndex}>
              <div className="h-6 w-32 bg-zinc-800 rounded mb-3 animate-pulse" />
              <div className="space-y-3">
                {[...Array(2)].map((_, itemIndex) => (
                  <TimelineItemSkeleton key={itemIndex} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : stats.total === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No History Yet"
          description={
            searchQuery
              ? 'No analyses match your search. Try a different query.'
              : 'Start analyzing errors to build your history timeline.'
          }
          action={
            searchQuery
              ? {
                label: 'Clear Search',
                onClick: () => {
                  setSearchQuery('');
                  searchHistory('');
                }
              }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6" role="list" aria-label="Analysis timeline">
          {sortedGroups.map(groupName => (
            <div key={groupName} role="listitem">
              <h2 className="text-lg font-medium mb-3 text-zinc-300 flex items-center gap-2">
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <span>{groupName}</span>
                <span className="text-sm text-zinc-500" aria-label={`${groupedByDate[groupName].length} items`}>
                  ({groupedByDate[groupName].length})
                </span>
              </h2>
              <div className="space-y-3" role="list" aria-label={`${groupName} analyses`}>
                {groupedByDate[groupName].map((item, index) => {
                  const isExpanded = expandedItems.has(item.id);
                  const timestamp = new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const globalIndex = allItems.findIndex(i => i.id === item.id);

                  return (
                    <Card
                      key={item.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(item.id, el);
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      aria-label={`Analysis: ${item.error.message}. ${item.success ? 'Successful' : 'Failed'}. ${timestamp}. Press Enter to ${isExpanded ? 'collapse' : 'expand'} details.`}
                      className={cn(
                        'bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer focus-ring',
                        isExpanded && 'border-zinc-600'
                      )}
                      onClick={() => toggleExpand(item.id)}
                      onKeyDown={(e) => handleItemKeyboard(e, item.id, globalIndex)}
                    >
                      <CardHeader className="p-4 pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {item.success ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden="true" />
                              )}
                              <time className="text-sm text-zinc-400" dateTime={new Date(item.timestamp).toISOString()}>
                                {timestamp}
                              </time>
                              {item.duration && (
                                <Badge variant="secondary" className="text-xs" aria-label={`Duration: ${item.duration} milliseconds`}>
                                  {item.duration}ms
                                </Badge>
                              )}
                              {item.result.confidence && (
                                <Badge variant="secondary" className="text-xs" aria-label={`Confidence: ${Math.round(item.result.confidence * 100)} percent`}>
                                  {Math.round(item.result.confidence * 100)}% confidence
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-zinc-200 truncate" title={item.error.message}>
                              {item.error.message}
                            </h3>
                            <p className="text-sm text-zinc-500 truncate" title={item.error.filePath}>
                              {item.error.filePath}
                              {item.error.line && `:${item.error.line}`}
                            </p>
                          </div>

                          <div className="flex gap-1 flex-shrink-0" role="group" aria-label="Item actions">
                            <Button
                              {...createButtonProps('Re-analyze this error')}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                reanalyzeError(item.id);
                                announce('Re-analyzing error', 'polite');
                              }}
                              className="h-8 w-8 p-0 focus-ring"
                            >
                              <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              {...createButtonProps('Export to Markdown')}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportToMarkdown(item.id);
                                announce('Exported to markdown', 'polite');
                              }}
                              className="h-8 w-8 p-0 focus-ring"
                            >
                              <Download className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              {...createButtonProps('Delete this item')}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this analysis from history?')) {
                                  deleteHistoryItem(item.id);
                                  announce('Analysis deleted', 'polite');
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/50 focus-ring"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="p-4 pt-0 border-t border-zinc-800 mt-3">
                          <div className="space-y-4">
                            {/* Root Cause */}
                            <div>
                              <h4 className="text-sm font-medium text-zinc-400 mb-2">Root Cause</h4>
                              <p className="text-zinc-200">{item.result.rootCause}</p>
                            </div>

                            {/* Analysis Details */}
                            {item.result.analysis && (
                              <div>
                                <h4 className="text-sm font-medium text-zinc-400 mb-2">Analysis</h4>
                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                                  {item.result.analysis}
                                </p>
                              </div>
                            )}

                            {/* Stack Trace (if available) */}
                            {item.error.stackTrace && (
                              <div>
                                <h4 className="text-sm font-medium text-zinc-400 mb-2">Stack Trace</h4>
                                <pre className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto border border-zinc-800">
                                  {item.error.stackTrace}
                                </pre>
                              </div>
                            )}

                            {/* Fixes */}
                            {item.result.fixes && item.result.fixes.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-zinc-400 mb-2">
                                  Suggested Fixes ({item.result.fixes.length})
                                </h4>
                                <div className="space-y-2">
                                  {item.result.fixes.slice(0, 3).map((fix, index) => (
                                    <div
                                      key={index}
                                      className="text-sm bg-zinc-950 p-3 rounded border border-zinc-800"
                                    >
                                      <p className="text-zinc-300">{fix.explanation || fix.description || 'Fix available'}</p>
                                    </div>
                                  ))}
                                  {item.result.fixes.length > 3 && (
                                    <p className="text-xs text-zinc-500" aria-label={`${item.result.fixes.length - 3} more fixes available`}>
                                      +{item.result.fixes.length - 3} more fixes
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
