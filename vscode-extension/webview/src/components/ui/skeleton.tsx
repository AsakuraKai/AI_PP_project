/**
 * Loading Skeleton Components
 * 
 * Accessible loading states for async content
 * with shimmer animation
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton with shimmer effect
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        'animate-pulse rounded-md bg-zinc-800/50',
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Stats card skeleton for Dashboard
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="status" aria-label="Loading statistics">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-32" />
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
}

/**
 * Table row skeleton for ErrorQueue
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-zinc-800" role="status" aria-label="Loading error">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-24 rounded" />
      <span className="sr-only">Loading error...</span>
    </div>
  );
}

/**
 * Activity item skeleton for Dashboard
 */
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50" role="status" aria-label="Loading activity">
      <Skeleton className="h-2 w-2 rounded-full shrink-0 mt-2" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-24" />
      </div>
      <span className="sr-only">Loading activity...</span>
    </div>
  );
}

/**
 * Timeline item skeleton for History
 */
export function TimelineItemSkeleton() {
  return (
    <div className="flex gap-4 p-4" role="status" aria-label="Loading history item">
      <div className="flex flex-col items-center">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-16 w-0.5" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <span className="sr-only">Loading history item...</span>
    </div>
  );
}

/**
 * Chart skeleton for Metrics
 */
export function ChartSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="status" aria-label="Loading chart">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-end gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className={`h-${(i + 1) * 8} flex-1`} />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      <span className="sr-only">Loading chart data...</span>
    </div>
  );
}

/**
 * Progress skeleton for Analysis
 */
export function ProgressSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading analysis progress">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
      <span className="sr-only">Loading analysis progress...</span>
    </div>
  );
}

/**
 * Generic list skeleton
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading list">
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
      <span className="sr-only">Loading list...</span>
    </div>
  );
}

/**
 * Card skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6" role="status" aria-label="Loading content">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-10 w-32 rounded" />
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
