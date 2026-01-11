/**
 * ErrorQueue View - Browse and manage detected errors
 * 
 * Features:
 * - Table/card layout for errors
 * - Filter by status and type
 * - Search functionality
 * - Bulk operations (select multiple, analyze all)
 * - Pin/unpin errors
 * - Quick navigation to source file
 * 
 * Phase 4 Enhancements:
 * - ✅ Loading skeletons for table rows
 * - ✅ Keyboard navigation (arrow keys, Enter)
 * - ✅ ARIA labels for accessibility
 * - ✅ Enhanced empty states
 * - ✅ Screen reader support
 */

import { useState } from 'react';
import { Check, Clock, FileText, Pin, Play, RefreshCw, Search, Trash2, X, AlertCircle } from 'lucide-react';
import { useErrorQueue, type FilterStatus, type FilterType } from '../hooks/useErrorQueue';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TableRowSkeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { handleListKeyboard } from '../lib/accessibility';
import { cn } from '../lib/utils';

export function ErrorQueue() {
  const {
    errors,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
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
    pinError,
    unpinError,
    openErrorLocation,
    stats
  } = useErrorQueue();

  const [focusedIndex, setFocusedIndex] = useState(0);

  const hasSelection = selectedIds.size > 0;
  const allSelected = selectedIds.size === errors.length && errors.length > 0;

  return (
    <div className="p-8 space-y-6" role="main" aria-label="Error Queue">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">Error Queue</h1>
          <p className="text-zinc-400" role="status" aria-live="polite">
            {stats.total} errors • {stats.pending} pending • {stats.analyzing} analyzing
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshErrors}
          disabled={loading}
          className="gap-2 focus-ring"
          aria-label={loading ? 'Refreshing errors' : 'Refresh error list'}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4" role="region" aria-label="Error filters and actions">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search errors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Search errors by message or file"
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Filter errors by status"
        >
          <option value="all" className="bg-zinc-900 text-zinc-100">All Status</option>
          <option value="pending" className="bg-zinc-900 text-zinc-100">Pending</option>
          <option value="analyzing" className="bg-zinc-900 text-zinc-100">Analyzing</option>
          <option value="complete" className="bg-zinc-900 text-zinc-100">Complete</option>
          <option value="failed" className="bg-zinc-900 text-zinc-100">Failed</option>
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Filter errors by type"
        >
          <option value="all" className="bg-zinc-900 text-zinc-100">All Types</option>
          <option value="runtime" className="bg-zinc-900 text-zinc-100">Runtime</option>
          <option value="build" className="bg-zinc-900 text-zinc-100">Build</option>
          <option value="lint" className="bg-zinc-900 text-zinc-100">Lint</option>
          <option value="syntax" className="bg-zinc-900 text-zinc-100">Syntax</option>
          <option value="warning" className="bg-zinc-900 text-zinc-100">Warning</option>
        </select>

        {/* Bulk Actions */}
        {hasSelection ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{selectedIds.size} selected</span>
            <Button
              size="sm"
              onClick={analyzeSelected}
              className="gap-2"
            >
              <Play className="h-3 w-3" />
              Analyze
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
            >
              Clear
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={analyzeAll}
              disabled={stats.pending === 0}
              className="gap-2"
            >
              <Play className="h-3 w-3" />
              Analyze All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompleted}
              disabled={stats.complete === 0 && stats.failed === 0}
              className="gap-2"
            >
              <Trash2 className="h-3 w-3" />
              Clear Completed
            </Button>
          </div>
        )}
      </div>

      {/* Error List */}
      {loading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      ) : errors.length === 0 ? (
        <EmptyState
          icon={searchQuery || filterStatus !== 'all' || filterType !== 'all' ? AlertCircle : Check}
          title={searchQuery || filterStatus !== 'all' || filterType !== 'all' ? 'No Errors Found' : 'All Clear!'}
          description={
            searchQuery || filterStatus !== 'all' || filterType !== 'all'
              ? 'No errors match your current filters. Try adjusting your search or filter criteria.'
              : 'Your workspace is error-free! Great job keeping your code clean.'
          }
          action={searchQuery || filterStatus !== 'all' || filterType !== 'all' ? {
            label: 'Clear Filters',
            onClick: () => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterType('all');
            }
          } : undefined}
        />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden" role="table" aria-label="Error list">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-800 bg-zinc-900/50 text-sm font-medium text-zinc-400" role="row">
            <div className="col-span-1 flex items-center" role="columnheader">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => allSelected ? deselectAll() : selectAll()}
                className="rounded border-zinc-700 bg-zinc-800"
                aria-label={allSelected ? 'Deselect all errors' : 'Select all errors'}
              />
            </div>
            <div className="col-span-1" role="columnheader">Status</div>
            <div className="col-span-2" role="columnheader">Type</div>
            <div className="col-span-5" role="columnheader">Message</div>
            <div className="col-span-2" role="columnheader">File</div>
            <div className="col-span-1" role="columnheader">Actions</div>
          </div>

          {/* Error Rows */}
          <div className="divide-y divide-zinc-800" role="rowgroup">
            {errors.map((error, index) => (
              <ErrorRow
                key={error.id}
                error={error}
                selected={selectedIds.has(error.id)}
                focused={index === focusedIndex}
                onToggleSelection={() => toggleSelection(error.id)}
                onAnalyze={() => analyzeError(error.id)}
                onRemove={() => removeError(error.id)}
                onPin={() => error.metadata?.pinned ? unpinError(error.id) : pinError(error.id)}
                onOpen={() => openErrorLocation(error.id)}
                onKeyDown={(e) => {
                  handleListKeyboard(e, {
                    currentIndex: index,
                    itemCount: errors.length,
                    onNavigate: setFocusedIndex,
                    onSelect: () => toggleSelection(error.id),
                    wrap: true
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {errors.length > 0 && (
        <div className="text-sm text-zinc-500 text-center">
          Showing {stats.filtered} of {stats.total} errors
        </div>
      )}
    </div>
  );
}

interface ErrorRowProps {
  error: any;
  selected: boolean;
  focused: boolean;
  onToggleSelection: () => void;
  onAnalyze: () => void;
  onRemove: () => void;
  onPin: () => void;
  onOpen: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function ErrorRow({ error, selected, focused, onToggleSelection, onAnalyze, onRemove, onPin, onOpen, onKeyDown }: ErrorRowProps) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig = {
    pending: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-800', label: 'Pending' },
    analyzing: { icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Analyzing' },
    complete: { icon: Check, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Complete' },
    failed: { icon: X, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' }
  };

  const config = statusConfig[error.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-4 p-4 hover:bg-zinc-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset',
        selected && 'bg-zinc-800/30',
        focused && 'ring-2 ring-purple-500/50'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="row"
      aria-selected={selected}
      aria-label={`Error: ${error.message} in ${getFileName(error.filePath)} at line ${error.line}, status: ${config.label}`}
    >
      {/* Checkbox */}
      <div className="col-span-1 flex items-center" role="cell">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelection}
          className="rounded border-zinc-700 bg-zinc-800"
          aria-label={`Select error: ${error.message}`}
        />
        {error.metadata?.pinned && (
          <Pin className="h-3 w-3 ml-2 text-amber-400" aria-label="Pinned" />
        )}
      </div>

      {/* Status */}
      <div className="col-span-1 flex items-center" role="cell">
        <div className={cn('flex items-center gap-2 px-2 py-1 rounded', config.bg)} role="status" aria-label={config.label}>
          <StatusIcon className={cn('h-3 w-3', config.color, error.status === 'analyzing' && 'animate-spin')} aria-hidden="true" />
          <span className="sr-only">{config.label}</span>
        </div>
      </div>

      {/* Type */}
      <div className="col-span-2 flex items-center" role="cell">
        <Badge variant="outline" className="capitalize" aria-label={`Error type: ${error.type}`}>
          {error.type}
        </Badge>
      </div>

      {/* Message */}
      <div className="col-span-5 flex items-center" role="cell">
        <p className="text-sm text-zinc-200 truncate">{error.message}</p>
      </div>

      {/* File */}
      <div className="col-span-2 flex items-center" role="cell">
        <button
          onClick={onOpen}
          className="text-sm text-zinc-400 hover:text-zinc-200 truncate flex items-center gap-1 transition-colors focus-ring"
          aria-label={`Open ${getFileName(error.filePath)} at line ${error.line}`}
        >
          <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{getFileName(error.filePath)}:{error.line}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end" role="cell">
        {(showActions || selected) && (
          <div className="flex items-center gap-1">
            {error.status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAnalyze}
                className="h-7 w-7 p-0 focus-ring"
                aria-label="Analyze this error"
              >
                <Play className="h-3 w-3" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onPin}
              className={cn('h-7 w-7 p-0 focus-ring', error.metadata?.pinned && 'text-amber-400')}
              aria-label={error.metadata?.pinned ? 'Unpin this error' : 'Pin this error'}
            >
              <Pin className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 focus-ring"
              aria-label="Remove this error"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}
