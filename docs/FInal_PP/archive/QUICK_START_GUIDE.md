# Dashboard Critical Fixes - Quick Start Guide

**Date**: 2026-03-27
**Estimated Time**: 10.5 hours (1.5 days)
**Priority**: P0 - Critical

---

## Overview

This guide walks you through implementing the 7 critical fixes identified in the Dashboard Analysis Plan. These fixes address the most dangerous issues that could cause production failures.

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Development environment set up
- [ ] Access to the codebase
- [ ] Read the full [Dashboard Analysis Plan](./DASHBOARD_ANALYSIS_AND_PLAN.md)

---

## Critical Fixes Checklist

### ✅ Fix 1: Test Hook Mismatch (30 minutes)

**Priority**: P0 - CRITICAL
**File**: `vscode-extension/webview/__tests__/views/Dashboard.test.tsx`

#### Problem
Tests mock `useDashboard` but component uses `useDashboardData`. All tests are passing but testing nothing.

#### Solution

```typescript
// BEFORE (Line 18)
jest.mock('../../src/hooks/useDashboard', () => ({
  useDashboard: () => ({ ... })
}));

// AFTER
jest.mock('../../src/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    stats: {
      pendingErrors: 5,
      analyzesPerformed: 10,
      successRate: 85,
      averageTime: 3
    },
    recentActivity: [
      {
        id: '1',
        type: 'success',
        message: 'Analysis completed',
        timestamp: Date.now()
      }
    ],
    ollamaStatus: {
      connected: true,
      model: 'llama2',
      responseTime: 150
    },
    loading: false,
    error: null,
    refreshData: jest.fn(),
    analyzeAllErrors: jest.fn(),
    scanWorkspace: jest.fn(),
    openSettings: jest.fn()
  })
}));
```

#### Verification
```bash
npm test -- Dashboard.test.tsx
```

Expected: All tests should still pass, but now they're actually testing the right hook.

---

### ✅ Fix 2: Add Error Boundary (1 hour)

**Priority**: P0 - CRITICAL
**Files**:
- `vscode-extension/webview/src/components/DashboardErrorBoundary.tsx` (new)
- `vscode-extension/webview/src/App.tsx` (modify)

#### Problem
Component crashes affect entire UI with no recovery mechanism.

#### Solution

**Step 1**: Create error boundary component

```typescript
// vscode-extension/webview/src/components/DashboardErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard crashed:', error, errorInfo);

    // TODO: Send to error tracking service
    // trackError('dashboard:crash', { error, errorInfo });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-8 bg-zinc-950">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-light text-zinc-200 mb-2">
            Dashboard Error
          </h2>
          <p className="text-zinc-400 mb-6 text-center max-w-md">
            Something went wrong loading the dashboard. Please try refreshing.
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="default">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-8 w-full max-w-2xl">
              <summary className="cursor-pointer text-zinc-400 mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="p-4 bg-zinc-900 rounded text-xs text-red-400 overflow-auto">
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 2**: Wrap Dashboard component

```typescript
// vscode-extension/webview/src/App.tsx
import { DashboardErrorBoundary } from './components/DashboardErrorBoundary';

function App() {
  return (
    <DashboardErrorBoundary>
      <Dashboard />
    </DashboardErrorBoundary>
  );
}
```

#### Verification
```typescript
// Test by throwing an error in Dashboard
const Dashboard = () => {
  if (Math.random() > 0.5) throw new Error('Test error');
  // ... rest of component
};
```

Expected: Error boundary should catch the error and show fallback UI.

---

### ✅ Fix 3: Add Message Validation (2 hours)

**Priority**: P0 - CRITICAL
**File**: `vscode-extension/webview/src/hooks/useDashboardData.ts`

#### Problem
No validation of backend messages. Malformed data crashes component.

#### Solution

**Step 1**: Install Zod
```bash
npm install zod
```

**Step 2**: Add schemas and validation

```typescript
// vscode-extension/webview/src/hooks/useDashboardData.ts
import { z } from 'zod';

// Define schemas
const DashboardStatsSchema = z.object({
  pendingErrors: z.number().int().nonnegative(),
  analyzesPerformed: z.number().int().nonnegative(),
  successRate: z.number().min(0).max(100),
  averageTime: z.number().nonnegative()
});

const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum(['success', 'error', 'analyzing', 'partial']),
  message: z.string(),
  errorMessage: z.string().optional(),
  timestamp: z.number()
});

const OllamaStatusSchema = z.object({
  connected: z.boolean(),
  model: z.string().optional(),
  responseTime: z.number().optional(),
  error: z.string().optional()
});

const DashboardMessageSchema = z.discriminatedUnion('command', [
  z.object({
    command: z.literal('dashboardData'),
    stats: DashboardStatsSchema,
    activity: z.array(ActivityItemSchema)
  }),
  z.object({
    command: z.literal('ollamaStatus'),
    status: OllamaStatusSchema
  }),
  z.object({
    command: z.literal('analysisComplete'),
    activity: ActivityItemSchema
  }),
  z.object({
    command: z.literal('error'),
    message: z.string()
  })
]);

type DashboardMessage = z.infer<typeof DashboardMessageSchema>;

// Add error state
interface DashboardError {
  type: 'validation' | 'network' | 'unknown';
  message: string;
  details?: any;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>(/* ... */);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>(/* ... */);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);

  // Enhanced message handler with validation
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      // Validate message structure
      const message = DashboardMessageSchema.parse(event.data);

      // Clear any previous errors
      setError(null);

      switch (message.command) {
        case 'dashboardData':
          setStats(message.stats);
          setRecentActivity(message.activity);
          setLoading(false);
          break;

        case 'ollamaStatus':
          setOllamaStatus(message.status);
          break;

        case 'analysisComplete':
          setRecentActivity(prev => [message.activity, ...prev].slice(0, 5));
          break;

        case 'error':
          setError({
            type: 'unknown',
            message: message.message
          });
          setLoading(false);
          break;

        default:
          console.warn('Unknown message command:', message);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error('Invalid message format:', err.errors);
        setError({
          type: 'validation',
          message: 'Received invalid data from backend',
          details: err.errors
        });
      } else {
        console.error('Message handling error:', err);
        setError({
          type: 'unknown',
          message: 'Failed to process dashboard update'
        });
      }

      setLoading(false);

      // Track error for monitoring
      // trackError('dashboard:message:invalid', { error: err });
    }
  }, []);

  // ... rest of hook

  return {
    stats,
    recentActivity,
    ollamaStatus,
    loading,
    error, // NEW: Expose error state
    refreshData,
    analyzeAllErrors,
    scanWorkspace,
    openSettings
  };
};
```

**Step 3**: Update Dashboard to show errors

```typescript
// vscode-extension/webview/src/views/Dashboard.tsx
export function Dashboard() {
  const {
    stats,
    recentActivity,
    ollamaStatus,
    loading,
    error, // NEW
    refreshData,
    analyzeAllErrors,
    scanWorkspace,
    openSettings
  } = useDashboardData();

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-light text-zinc-200 mb-2">
          {error.type === 'validation' ? 'Data Error' : 'Connection Error'}
        </h2>
        <p className="text-zinc-400 mb-6 text-center max-w-md">
          {error.message}
        </p>
        <Button onClick={refreshData}>
          Try Again
        </Button>
      </div>
    );
  }

  // ... rest of component
}
```

#### Verification
```typescript
// Test with invalid data
postMessage({ command: 'dashboardData', stats: { invalid: 'data' } });
```

Expected: Error should be caught, validated, and displayed to user.

---

### ✅ Fix 4: Implement Request Cancellation (1 hour)

**Priority**: P0 - CRITICAL
**File**: `vscode-extension/webview/src/hooks/useDashboardData.ts`

#### Problem
No cleanup for in-flight requests on unmount. Causes memory leaks.

#### Solution

```typescript
// vscode-extension/webview/src/hooks/useDashboardData.ts
export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadDashboardData = useCallback(() => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);

    // Send message with signal (if your postMessage supports it)
    postMessage({ command: 'getDashboardData' });

    // Set a timeout to handle the request
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && !signal.aborted) {
        setError({
          type: 'network',
          message: 'Request timed out. Please try again.'
        });
        setLoading(false);
      }
    }, 30000); // 30 second timeout

    // Store timeout ID for cleanup
    return () => clearTimeout(timeoutId);
  }, [postMessage]);

  const checkOllamaStatus = useCallback(() => {
    postMessage({ command: 'checkOllamaStatus' });
  }, [postMessage]);

  useEffect(() => {
    isMountedRef.current = true;

    loadDashboardData();
    checkOllamaStatus();

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadDashboardData();
        checkOllamaStatus();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty deps - only run once

  // Update message handler to check if mounted
  const handleMessage = useCallback((event: MessageEvent) => {
    if (!isMountedRef.current) {
      console.log('Component unmounted, ignoring message');
      return;
    }

    try {
      const message = DashboardMessageSchema.parse(event.data);
      // ... rest of handler
    } catch (err) {
      // ... error handling
    }
  }, []);

  // ... rest of hook
};
```

#### Verification
```typescript
// Test by mounting and unmounting quickly
const TestComponent = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return show ? <Dashboard /> : null;
};
```

Expected: No console warnings about unmounted component updates.

---

### ✅ Fix 5: Fix Unstable Dependencies (1 hour)

**Priority**: P1 - HIGH
**File**: `vscode-extension/webview/src/hooks/useDashboardData.ts`

#### Problem
Effect dependencies are recreated on every render, causing unnecessary re-runs.

#### Solution

```typescript
// vscode-extension/webview/src/hooks/useDashboardData.ts
const REFRESH_INTERVAL_MS = 30_000;

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>(/* ... */);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>(/* ... */);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);

  // Stable reference to postMessage
  const postMessageRef = useRef(postMessage);
  useEffect(() => {
    postMessageRef.current = postMessage;
  }, [postMessage]);

  // Memoize callbacks to prevent recreation
  const loadDashboardData = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    postMessageRef.current({ command: 'getDashboardData' });
  }, []); // No dependencies - uses ref

  const checkOllamaStatus = useCallback(() => {
    postMessageRef.current({ command: 'checkOllamaStatus' });
  }, []); // No dependencies - uses ref

  const refreshData = useCallback(() => {
    loadDashboardData();
    checkOllamaStatus();
  }, [loadDashboardData, checkOllamaStatus]); // Stable dependencies

  const analyzeAllErrors = useCallback(() => {
    postMessageRef.current({ command: 'analyzeAllErrors' });
  }, []);

  const scanWorkspace = useCallback(() => {
    postMessageRef.current({ command: 'scanWorkspace' });
  }, []);

  const openSettings = useCallback(() => {
    postMessageRef.current({ command: 'openSettings' });
  }, []);

  // Effect with stable dependencies
  useEffect(() => {
    isMountedRef.current = true;

    loadDashboardData();
    checkOllamaStatus();

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadDashboardData();
        checkOllamaStatus();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty deps - callbacks are stable

  // ... rest of hook

  return {
    stats,
    recentActivity,
    ollamaStatus,
    loading,
    error,
    refreshData,
    analyzeAllErrors,
    scanWorkspace,
    openSettings
  };
};
```

#### Verification
Add logging to see how many times effect runs:
```typescript
useEffect(() => {
  console.log('Effect running');
  // ... rest of effect
}, []);
```

Expected: Effect should only run once on mount, not on every render.

---

### ✅ Fix 6: Add Error State Exposure (1 hour)

**Priority**: P1 - HIGH
**Files**: Already covered in Fix 3 above

This fix is integrated into the message validation fix.

---

### ✅ Fix 7: Implement Real Trend Calculations (4 hours)

**Priority**: P1 - HIGH
**Files**:
- `vscode-extension/webview/src/hooks/useTrendCalculator.ts` (new)
- `vscode-extension/webview/src/views/Dashboard.tsx` (modify)
- `vscode-extension/src/webview/RCAWebviewProvider.ts` (modify)

#### Problem
Trend values are hardcoded (+12%, -8%), not calculated from real data.

#### Solution

**Step 1**: Create trend calculator hook

```typescript
// vscode-extension/webview/src/hooks/useTrendCalculator.ts
import { useMemo } from 'react';

export interface TrendData {
  value: string;
  direction: 'up' | 'down' | 'neutral';
}

export const useTrendCalculator = (
  current: number,
  historical: number[]
): TrendData => {
  return useMemo(() => {
    if (!historical || historical.length === 0) {
      return { value: 'N/A', direction: 'neutral' };
    }

    // Calculate average of historical data
    const average = historical.reduce((sum, val) => sum + val, 0) / historical.length;

    if (average === 0) {
      return { value: 'N/A', direction: 'neutral' };
    }

    // Calculate percentage change
    const percentChange = ((current - average) / average) * 100;
    const roundedChange = Math.round(percentChange);

    // Handle near-zero changes
    if (Math.abs(roundedChange) < 1) {
      return { value: '0%', direction: 'neutral' };
    }

    return {
      value: `${roundedChange > 0 ? '+' : ''}${roundedChange}%`,
      direction: roundedChange > 0 ? 'up' : 'down'
    };
  }, [current, historical]);
};
```

**Step 2**: Update backend to send historical data

```typescript
// vscode-extension/src/webview/RCAWebviewProvider.ts
private async _handleGetDashboardData() {
  try {
    const history = this.stateManager.getHistory(100);
    const errorCount = this.errorQueueManager.getErrorCount();

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAnalyses = history.filter(h =>
      new Date(h.timestamp).getTime() >= today.getTime()
    );

    // Calculate historical data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i - 1);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      return history.filter(h => {
        const ts = new Date(h.timestamp).getTime();
        return ts >= dayStart && ts < dayEnd;
      }).length;
    });

    // Calculate average time for last 7 days
    const last7DaysAvgTime = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i - 1);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayAnalyses = history.filter(h => {
        const ts = new Date(h.timestamp).getTime();
        return ts >= dayStart && ts < dayEnd && h.error.status === 'complete';
      });

      if (dayAnalyses.length === 0) return 0;

      return dayAnalyses.reduce((sum, h) => sum + h.duration, 0) / dayAnalyses.length / 1000;
    });

    const completedAnalyses = history.filter(h => h.error.status === 'complete');
    const successRate = completedAnalyses.length > 0
      ? completedAnalyses.filter(h => h.result.confidence && h.result.confidence > 0.7).length / completedAnalyses.length
      : 0;

    const avgTime = completedAnalyses.length > 0
      ? completedAnalyses.reduce((sum, h) => sum + h.duration, 0) / completedAnalyses.length
      : 0;

    this._sendMessage({
      command: 'dashboardData',
      stats: {
        pendingErrors: errorCount,
        analyzesPerformed: todayAnalyses.length,
        successRate: Math.round(successRate * 100),
        averageTime: Math.round(avgTime / 1000)
      },
      historical: {
        analyzesPerformed: last7Days,
        averageTime: last7DaysAvgTime
      },
      activity: history.slice(0, 5).map(h => ({
        id: h.id,
        type: this._getActivityType(h.result.confidence),
        message: h.error.message.substring(0, 100),
        errorMessage: h.error.type,
        timestamp: h.timestamp
      }))
    });
  } catch (error: any) {
    console.error('Failed to get dashboard data:', error);
    this._sendMessage({
      command: 'error',
      message: 'Failed to load dashboard data'
    });
  }
}

private _getActivityType(confidence?: number): 'success' | 'partial' | 'error' {
  if (!confidence) return 'error';
  if (confidence > 0.7) return 'success';
  if (confidence > 0.4) return 'partial';
  return 'error';
}
```

**Step 3**: Update Dashboard to use trend calculator

```typescript
// vscode-extension/webview/src/views/Dashboard.tsx
import { useTrendCalculator } from '../hooks/useTrendCalculator';

export function Dashboard() {
  const {
    stats,
    historical, // NEW
    recentActivity,
    ollamaStatus,
    loading,
    error,
    refreshData,
    analyzeAllErrors,
    scanWorkspace,
    openSettings
  } = useDashboardData();

  // Calculate trends
  const analyzesPerformedTrend = useTrendCalculator(
    stats.analyzesPerformed,
    historical?.analyzesPerformed || []
  );

  const averageTimeTrend = useTrendCalculator(
    stats.averageTime,
    historical?.averageTime || []
  );

  return (
    <div className="p-8 space-y-8" role="main" aria-label="Dashboard">
      {/* ... */}

      <StatsCard
        title="Analyses Today"
        value={stats.analyzesPerformed}
        subtitle="Total analyses performed"
        icon={<Search className="h-6 w-6" aria-hidden="true" />}
        trend={analyzesPerformedTrend} // Real trend
        aria-label={`${stats.analyzesPerformed} analyses today, ${analyzesPerformedTrend.value}`}
      />

      <StatsCard
        title="Avg Time"
        value={`${stats.averageTime}s`}
        subtitle="Per analysis"
        icon={<Clock className="h-6 w-6" aria-hidden="true" />}
        trend={averageTimeTrend} // Real trend
        aria-label={`${stats.averageTime} seconds average time, ${averageTimeTrend.value}`}
      />

      {/* ... */}
    </div>
  );
}
```

**Step 4**: Update message schema

```typescript
// vscode-extension/webview/src/hooks/useDashboardData.ts
const DashboardMessageSchema = z.discriminatedUnion('command', [
  z.object({
    command: z.literal('dashboardData'),
    stats: DashboardStatsSchema,
    historical: z.object({
      analyzesPerformed: z.array(z.number()),
      averageTime: z.array(z.number())
    }).optional(),
    activity: z.array(ActivityItemSchema)
  }),
  // ... other message types
]);
```

#### Verification
```typescript
// Check that trends are calculated correctly
console.log('Current:', stats.analyzesPerformed);
console.log('Historical:', historical.analyzesPerformed);
console.log('Trend:', analyzesPerformedTrend);
```

Expected: Trends should show real percentage changes based on 7-day average.

---

## Testing All Fixes

### Unit Tests
```bash
npm test
```

Expected: All tests pass with >80% coverage.

### Integration Test
```bash
npm run test:integration
```

### Manual Testing Checklist
- [ ] Dashboard loads without errors
- [ ] Stats display correctly
- [ ] Trends show real calculations
- [ ] Error states display properly
- [ ] Component doesn't crash on bad data
- [ ] No memory leaks on unmount
- [ ] Refresh button works
- [ ] Auto-refresh works every 30 seconds
- [ ] Ollama status updates
- [ ] Activity feed updates

---

## Deployment Checklist

### Before Merging
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Code reviewed by 2+ developers
- [ ] Documentation updated
- [ ] Changelog updated

### After Merging
- [ ] Monitor error tracking
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Plan next phase

---

## Troubleshooting

### Tests Still Failing
- Check that mock matches actual hook interface
- Verify all required props are provided
- Check for TypeScript errors

### Component Still Crashing
- Check error boundary is properly wrapped
- Verify error boundary is a class component
- Check console for error details

### Validation Errors
- Check Zod schema matches backend data
- Verify all required fields are present
- Check data types match schema

### Memory Leaks
- Verify abort controller is being used
- Check that cleanup functions are called
- Use React DevTools Profiler to check

### Trends Not Showing
- Verify backend sends historical data
- Check that historical array has data
- Verify trend calculator logic

---

## Next Steps

After completing these critical fixes:

1. **Run full test suite** to ensure nothing broke
2. **Deploy to staging** for testing
3. **Monitor for issues** for 24-48 hours
4. **Deploy to production** if stable
5. **Begin Phase 2** (Robustness improvements)

---

## Support

If you encounter issues:
1. Check the [full analysis plan](./DASHBOARD_ANALYSIS_AND_PLAN.md)
2. Review the [improvements summary](./DASHBOARD_PLAN_IMPROVEMENTS.md)
3. Check existing tests for examples
4. Ask the team for help

---

**Estimated Completion Time**: 10.5 hours
**Priority**: Complete within 1-2 days
**Status**: Ready to implement

Good luck! 🚀
