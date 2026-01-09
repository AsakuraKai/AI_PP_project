/**
 * AnalysisProgress - Component for displaying analysis progress
 * Shows real-time iteration progress, thoughts, and hypothesis
 */

import { Brain, Clock, Lightbulb, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export interface AnalysisProgressProps {
  iteration: number;
  maxIterations: number;
  progress: number;
  currentThought?: string;
  hypothesis?: string;
  recentActions?: string[];
  recentObservations?: string[];
  elapsed?: number;
}

export function AnalysisProgress({
  iteration,
  maxIterations,
  progress,
  currentThought,
  hypothesis,
  recentActions = [],
  recentObservations = [],
  elapsed = 0
}: AnalysisProgressProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };
  
  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-lg font-medium text-zinc-200">
              Analyzing Error
            </h3>
            <p className="text-sm text-zinc-400">
              Iteration {iteration} of {maxIterations}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="h-4 w-4" />
          <span>{formatTime(elapsed)}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
      
      {/* Current Hypothesis */}
      {hypothesis && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-purple-300 mb-2">
                Current Hypothesis
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {hypothesis}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Current Thought */}
      {currentThought && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-300 mb-2">
                Current Thought
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentThought}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Actions */}
        {recentActions.length > 0 && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-green-400" />
              <h4 className="text-sm font-medium text-zinc-200">
                Recent Actions
              </h4>
            </div>
            <ul className="space-y-2">
              {recentActions.slice(-3).map((action, i) => (
                <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                  <span className="text-green-400 mt-1">▸</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Observations */}
        {recentObservations.length > 0 && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-blue-400" />
              <h4 className="text-sm font-medium text-zinc-200">
                Recent Observations
              </h4>
            </div>
            <ul className="space-y-2">
              {recentObservations.slice(-3).map((obs, i) => (
                <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">▸</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Iteration Dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: maxIterations }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              i < iteration
                ? 'bg-purple-500'
                : i === iteration
                ? 'bg-purple-400 animate-pulse scale-150'
                : 'bg-zinc-700'
            )}
          />
        ))}
      </div>
    </div>
  );
}
