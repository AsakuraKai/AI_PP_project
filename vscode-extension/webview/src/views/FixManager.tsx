/**
 * Fix Manager View - Manage pending and applied code fixes
 * 
 * Features:
 * - [OK] Pending fixes queue with code preview
 * - [OK] Code diff visualization
 * - [OK] Apply/reject individual fixes
 * - [OK] Batch operations (apply/reject multiple)
 * - [OK] Applied fixes history
 * - [OK] Success/failure tracking
 * - [OK] Loading skeletons for async content
 * - [OK] ARIA labels for accessibility
 * - [OK] Keyboard navigation support
 * - [OK] Screen reader announcements
 */

import { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code,
  FileText,
  RefreshCw,
  Trash2,
  X,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useFixManager } from '../hooks/useFixManager';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { StatsCardSkeleton, ListSkeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { announce, createButtonProps } from '../lib/accessibility';
import { cn } from '../lib/utils';

export function FixManager() {
  const {
    pendingFixes,
    appliedFixes,
    diffPreview,
    loading,
    selectedFixes,
    stats,
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
  } = useFixManager();

  const [expandedFixes, setExpandedFixes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('pending');

  // Announce tab changes
  useEffect(() => {
    announce(`Viewing ${activeTab} fixes`, 'polite');
  }, [activeTab]);

  // Announce selection changes
  useEffect(() => {
    if (selectedFixes.size > 0) {
      announce(`${selectedFixes.size} fixes selected`, 'polite');
    }
  }, [selectedFixes.size]);

  const toggleExpand = (fixId: string) => {
    setExpandedFixes(prev => {
      const next = new Set(prev);
      const wasExpanded = next.has(fixId);
      if (wasExpanded) {
        next.delete(fixId);
      } else {
        next.add(fixId);
      }
      announce(wasExpanded ? 'Fix collapsed' : 'Fix expanded', 'polite');
      return next;
    });
  };

  const hasSelection = selectedFixes.size > 0;
  const allSelected = selectedFixes.size === pendingFixes.length && pendingFixes.length > 0;

  return (
    <main className="p-8 space-y-6" role="main" aria-label="Fix Manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">Fix Manager</h1>
          <p className="text-zinc-400" role="status" aria-live="polite">
            {stats.pending} pending • {stats.applied} applied • {stats.failed} failed
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshFixes}
          disabled={loading}
          className="gap-2 focus-ring"
          aria-label="Refresh fixes"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Fix statistics">
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
                    <p className="text-sm text-zinc-400">Pending Fixes</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.pending} pending fixes`}>{stats.pending}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Applied</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.applied} applied fixes`}>{stats.applied}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Failed</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.failed} failed fixes`}>{stats.failed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Avg Confidence</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${stats.avgConfidence}% average confidence`}>{stats.avgConfidence}%</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-purple-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900 border border-zinc-800" role="tablist" aria-label="Fix categories">
          <TabsTrigger value="pending" className="focus-ring" aria-label={`Pending fixes: ${stats.pending}`}>
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="applied" className="focus-ring" aria-label={`Applied fixes: ${stats.applied + stats.failed}`}>
            Applied ({stats.applied + stats.failed})
          </TabsTrigger>
        </TabsList>

        {/* Pending Fixes Tab */}
        <TabsContent value="pending" className="space-y-4 mt-4" role="tabpanel">
          {/* Bulk Actions */}
          {stats.pending > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => {
                        if (allSelected) {
                          deselectAll();
                          announce('All fixes deselected', 'polite');
                        } else {
                          selectAll();
                          announce(`All ${stats.pending} fixes selected`, 'polite');
                        }
                      }}
                      aria-label={allSelected ? 'Deselect all fixes' : 'Select all fixes'}
                      className="focus-ring"
                    />
                    <span className="text-sm text-zinc-400">
                      {hasSelection ? `${stats.selected} selected` : 'Select all'}
                    </span>
                  </div>

                  {hasSelection && (
                    <div className="flex gap-2" role="group" aria-label="Bulk actions">
                      <Button
                        size="sm"
                        onClick={() => {
                          applySelectedFixes();
                          announce(`Applying ${stats.selected} fixes`, 'assertive');
                        }}
                        className="gap-2 bg-green-700 hover:bg-green-600 focus-ring"
                        aria-label={`Apply ${stats.selected} selected fixes`}
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>Apply Selected ({stats.selected})</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          rejectSelectedFixes();
                          announce(`Rejected ${stats.selected} fixes`, 'assertive');
                        }}
                        className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 focus-ring"
                        aria-label={`Reject ${stats.selected} selected fixes`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        <span>Reject Selected</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Fixes List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : stats.pending === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-12 text-center">
                <Code className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Pending Fixes</h3>
                <p className="text-zinc-400">
                  Analyze errors to generate code fixes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingFixes.map(fix => {
                const isExpanded = expandedFixes.has(fix.id);
                const isSelected = selectedFixes.has(fix.id);

                return (
                  <Card
                    key={fix.id}
                    className={cn(
                      'bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors',
                      isExpanded && 'border-zinc-600',
                      isSelected && 'border-blue-700'
                    )}
                  >
                    <CardHeader className="p-4 pb-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(fix.id)}
                          className="mt-1"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(fix.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <span className="text-sm text-zinc-400">
                              {new Date(fix.timestamp).toLocaleString()}
                            </span>
                            {fix.confidence && (
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(fix.confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-medium text-zinc-200 mb-1">
                            {fix.file}
                            {fix.line && `:${fix.line}`}
                          </h3>
                          <p className="text-sm text-zinc-400">{fix.explanation}</p>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => applyFix(fix.id)}
                            className="gap-2 bg-green-700 hover:bg-green-600"
                          >
                            <Check className="h-4 w-4" />
                            Apply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectFix(fix.id)}
                            className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/50"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 pt-0 border-t border-zinc-800 mt-3">
                        <div className="space-y-3">
                          {/* Before Code */}
                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-2">Before:</h4>
                            <pre className="text-xs bg-zinc-950 p-3 rounded overflow-x-auto border border-zinc-800">
                              <code className="text-red-300">{fix.before}</code>
                            </pre>
                          </div>

                          {/* After Code */}
                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-2">After:</h4>
                            <pre className="text-xs bg-zinc-950 p-3 rounded overflow-x-auto border border-zinc-800">
                              <code className="text-green-300">{fix.after}</code>
                            </pre>
                          </div>

                          {/* Preview Diff Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => previewFix(fix.id)}
                            className="gap-2"
                          >
                            <Code className="h-4 w-4" />
                            Preview Full Diff
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Applied Fixes Tab */}
        <TabsContent value="applied" className="space-y-4 mt-4">
          {/* Clear Button */}
          {appliedFixes.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAppliedFixes}
                className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/50"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            </div>
          )}

          {/* Applied Fixes List */}
          {appliedFixes.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Applied Fixes</h3>
                <p className="text-zinc-400">
                  Applied fixes will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appliedFixes.map(fix => (
                <Card
                  key={fix.id}
                  className={cn(
                    'bg-zinc-900 border-zinc-800',
                    fix.success ? 'border-green-800/50' : 'border-red-800/50'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {fix.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}

                        <div>
                          <h3 className="font-medium text-zinc-200 mb-1">{fix.file}</h3>
                          <p className="text-sm text-zinc-400">
                            Applied {new Date(fix.appliedAt).toLocaleString()}
                          </p>
                          {!fix.success && fix.error && (
                            <p className="text-sm text-red-400 mt-2">
                              Error: {fix.error}
                            </p>
                          )}
                        </div>
                      </div>

                      <Badge variant={fix.success ? 'default' : 'destructive'}>
                        {fix.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Diff Preview Modal (if needed) */}
      {diffPreview && (
        <Card className="bg-zinc-900 border-zinc-800 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Diff Preview: {diffPreview.file}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => previewFix('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-zinc-950 p-4 rounded overflow-x-auto border border-zinc-800 max-h-96 overflow-y-auto">
              {diffPreview.changes.map((change, index) => (
                <div
                  key={index}
                  className={cn(
                    'py-1',
                    change.type === 'add' && 'text-green-300',
                    change.type === 'remove' && 'text-red-300',
                    change.type === 'modify' && 'text-yellow-300'
                  )}
                >
                  <span className="text-zinc-500 mr-3">{change.line}</span>
                  <span>{change.content}</span>
                </div>
              ))}
            </pre>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
