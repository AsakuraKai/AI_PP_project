/**
 * Agent State View - Real-time visualization of agent's thought process
 * 
 * Features:
 * - [OK] Live iteration progress bar
 * - [OK] Current hypothesis with confidence meter
 * - [OK] Observations list
 * - [OK] Tools used with timing
 * - [OK] Consensus building visualization
 * - [OK] Phase indicators
 * - [OK] Loading skeletons for async content
 * - [OK] ARIA labels for accessibility
 * - [OK] Screen reader announcements
 * - [OK] Keyboard navigation support
 */

import { useEffect } from 'react';
import {
  Activity,
  Brain,
  CheckCircle2,
  Clock,
  Eye,
  Lightbulb,
  Loader2,
  Play,
  Settings,
  Target,
  Zap
} from 'lucide-react';
import { useAgentState } from '../hooks/useAgentState';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StatsCardSkeleton, ListSkeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { announce, createButtonProps } from '../lib/accessibility';
import { cn } from '../lib/utils';

export function AgentState() {
  const {
    agentState,
    toolMetrics,
    loading,
    metrics,
    getToolMetrics,
    resetAgentState
  } = useAgentState();
  
  // Announce phase changes
  useEffect(() => {
    if (agentState?.phase) {
      const phaseLabel = getPhaseLabel(agentState.phase);
      announce(`Agent phase: ${phaseLabel}`, 'polite');
    }
  }, [agentState?.phase]);
  
  // Announce completion
  useEffect(() => {
    if (agentState?.phase === 'complete') {
      announce('Analysis complete', 'assertive');
    }
  }, [agentState?.phase]);
  
  const getPhaseIcon = (phase?: string) => {
    switch (phase) {
      case 'parsing':
        return <Settings className="h-4 w-4 animate-spin" />;
      case 'analyzing':
        return <Brain className="h-4 w-4 animate-pulse" />;
      case 'generating':
        return <Lightbulb className="h-4 w-4 animate-pulse" />;
      case 'consensus':
        return <Target className="h-4 w-4 animate-pulse" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };
  
  const getPhaseLabel = (phase?: string) => {
    switch (phase) {
      case 'parsing':
        return 'Parsing Error';
      case 'analyzing':
        return 'Analyzing';
      case 'generating':
        return 'Generating Fix';
      case 'consensus':
        return 'Building Consensus';
      case 'complete':
        return 'Complete';
      default:
        return 'Idle';
    }
  };
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  return (
    <main className="p-8 space-y-6" role="main" aria-label="Agent State">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light mb-2">Agent State</h1>
          <p className="text-zinc-400">
            Real-time visualization of the analysis process
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Actions">
          <Button
            {...createButtonProps('Refresh tool usage metrics')}
            variant="outline"
            size="sm"
            onClick={() => {
              getToolMetrics();
              announce('Refreshing metrics', 'polite');
            }}
            className="gap-2 focus-ring"
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span>Refresh Metrics</span>
          </Button>
          <Button
            {...createButtonProps('Reset agent state')}
            variant="outline"
            size="sm"
            onClick={() => {
              resetAgentState();
              announce('Agent state reset', 'polite');
            }}
            className="gap-2 focus-ring"
          >
            <span>Reset</span>
          </Button>
        </div>
      </div>
      
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label="Status overview">
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
                    <p className="text-sm text-zinc-400">Status</p>
                    <div className="flex items-center gap-2 mt-1" role="status" aria-live="polite" aria-label={agentState?.isActive ? 'Agent is active' : 'Agent is idle'}>
                      {agentState?.isActive ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />
                          <span className="text-lg font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                          <span className="text-lg font-medium text-zinc-500">Idle</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div aria-hidden="true">{getPhaseIcon(agentState?.phase)}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Iteration</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`Iteration ${metrics.totalIterations} of ${agentState?.maxIterations || 0}`}>
                      {metrics.totalIterations} / {agentState?.maxIterations || 0}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-zinc-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Progress</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`${metrics.progressPercentage} percent complete`}>
                      {metrics.progressPercentage}%
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
                    <p className="text-sm text-zinc-400">Elapsed</p>
                    <p className="text-2xl font-semibold mt-1" aria-label={`Elapsed time: ${formatDuration(metrics.elapsedTime)}`}>
                      {formatDuration(metrics.elapsedTime)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Progress Bar */}
      {agentState && (
        <Card className="bg-zinc-900 border-zinc-800" role="region" aria-label="Analysis progress">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Analysis Progress</CardTitle>
              <Badge variant="secondary" className="gap-2" aria-label={`Phase: ${getPhaseLabel(agentState.phase)}`}>
                <span aria-hidden="true">{getPhaseIcon(agentState.phase)}</span>
                <span>{getPhaseLabel(agentState.phase)}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress 
              value={metrics.progressPercentage} 
              className="h-3" 
              aria-label={`Progress: ${metrics.progressPercentage} percent`}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Current Hypothesis */}
      {agentState?.hypothesis && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Current Hypothesis
              </CardTitle>
              {agentState.confidence !== undefined && (
                <Badge variant="secondary">
                  {Math.round(agentState.confidence * 100)}% confidence
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-200">{agentState.hypothesis}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Current Thought */}
      {agentState?.currentThought && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Current Thought
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 italic">{agentState.currentThought}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Actions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              Recent Actions ({metrics.actionsCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentState?.recentActions && agentState.recentActions.length > 0 ? (
              <div className="space-y-2">
                {agentState.recentActions.slice().reverse().map((action, index) => (
                  <div
                    key={index}
                    className="p-3 bg-zinc-950 rounded border border-zinc-800"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-zinc-200">{action.tool}</span>
                      <span className="text-xs text-zinc-500">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {action.params && (
                      <pre className="text-xs text-zinc-400 mt-2 overflow-x-auto">
                        {JSON.stringify(action.params, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-4">No actions yet</p>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Observations */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              Recent Observations ({metrics.observationsCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentState?.recentObservations && agentState.recentObservations.length > 0 ? (
              <div className="space-y-2">
                {agentState.recentObservations.slice().reverse().map((observation, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded border',
                      observation.isFinal
                        ? 'bg-green-950/30 border-green-800'
                        : 'bg-zinc-950 border-zinc-800'
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {observation.isFinal && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-xs text-zinc-500">
                          {new Date(observation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300">{observation.result}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-4">No observations yet</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tool Usage Metrics */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Tool Usage Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {toolMetrics && toolMetrics.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead>Tool</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Total Duration</TableHead>
                    <TableHead className="text-right">Avg Duration</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolMetrics.map((metric, index) => (
                    <TableRow key={index} className="border-zinc-800">
                      <TableCell className="font-medium">{metric.toolName}</TableCell>
                      <TableCell className="text-right">{metric.callCount}</TableCell>
                      <TableCell className="text-right">
                        {formatDuration(metric.totalDuration)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDuration(metric.avgDuration)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={metric.successRate >= 0.8 ? 'default' : 'secondary'}
                          className={cn(
                            metric.successRate >= 0.8
                              ? 'bg-green-950 text-green-300 hover:bg-green-900'
                              : metric.successRate >= 0.5
                              ? 'bg-yellow-950 text-yellow-300 hover:bg-yellow-900'
                              : 'bg-red-950 text-red-300 hover:bg-red-900'
                          )}
                        >
                          {Math.round(metric.successRate * 100)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              {loading ? 'Loading metrics...' : 'No tool usage data available'}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Empty State */}
      {!agentState && !loading && (
        <EmptyState
          icon={Brain}
          title="No Active Analysis"
          description="Start an analysis from the Analyze or Error Queue view to see the agent's thought process in real-time."
        />
      )}
    </main>
  );
}
