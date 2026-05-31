/**
 * AnalysisProgress - Component for displaying analysis progress
 * Shows real-time iteration progress, thoughts, and hypothesis
 *
 * v2.0 - Enhanced with smooth animations:
 * - Shimmer effect on progress bar
 * - Pulsing ring animation on current iteration dot
 * - Glow pulse on brain icon
 * - Smooth transitions for percentage updates
 */

import { Brain, Clock, Lightbulb, Activity, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState, useRef } from 'react';

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
  // Animated progress value for smooth transitions
  const [displayProgress, setDisplayProgress] = useState(progress);
  const [displayIteration, setDisplayIteration] = useState(iteration);
  const [internalElapsed, setInternalElapsed] = useState(elapsed);
  const animationRef = useRef<number | null>(null);
  const currentProgressRef = useRef(progress);

  // Sync internal elapsed with props and start ticking
  useEffect(() => {
    setInternalElapsed(elapsed);
    const interval = setInterval(() => {
      setInternalElapsed(prev => prev + 100); // tick every 100ms
    }, 100);
    return () => clearInterval(interval);
  }, [elapsed]);

  // Smoothly animate progress changes
  useEffect(() => {
    const targetProgress = progress;
    const startProgress = currentProgressRef.current;
    const duration = 500; // 500ms animation
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      const currentVal = startProgress + (targetProgress - startProgress) * eased;

      setDisplayProgress(currentVal);
      currentProgressRef.current = currentVal;

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress]);

  // Animate iteration changes
  useEffect(() => {
    setDisplayIteration(iteration);
  }, [iteration]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* CSS Keyframes for animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.6));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.9));
            transform: scale(1.05);
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .shimmer-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }

        .glow-pulse-icon {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #a855f7;
          animation: pulse-ring 1.5s ease-out infinite;
        }
      `}</style>

      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-6 w-6 text-purple-400 glow-pulse-icon" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-200">
              Analyzing Error
            </h3>
            <p className="text-sm text-zinc-400">
              Iteration {Math.max(1, displayIteration)} of {maxIterations}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="h-4 w-4" />
          <span>{formatTime(internalElapsed)}</span>
        </div>
      </div>

      {/* Progress Bar with Shimmer */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden relative">
          {/* Progress fill with gradient */}
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 transition-all duration-300 ease-out relative"
            style={{ width: `${displayProgress}%` }}
          >
            {/* Shimmer overlay */}
            <div className="shimmer-effect" />
            {/* Glowing leading edge */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-sm"
              style={{ boxShadow: '0 0 8px 2px rgba(168, 85, 247, 0.6)' }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Progress</span>
          <span className="tabular-nums font-medium text-zinc-400">{Math.round(displayProgress)}%</span>
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
      
      {/* Iteration Dots with Pulsing Ring */}
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: maxIterations }).map((_, i) => (
          <div key={i} className="relative flex items-center justify-center">
            {/* Pulsing ring for current iteration */}
            {i === Math.max(0, displayIteration - 1) && (
              <>
                <div className="pulse-ring" />
                <div className="pulse-ring" style={{ animationDelay: '0.5s' }} />
              </>
            )}
            <div
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-all duration-300',
                i < Math.max(0, displayIteration - 1)
                  ? 'bg-purple-500' // completed
                  : i === Math.max(0, displayIteration - 1)
                  ? 'bg-purple-400 scale-150 z-10' // current
                  : 'bg-zinc-700' // pending
              )}
            />
          </div>
        ))}
      </div>

      {/* Activity Spinner */}
      {(currentThought || recentActions.length > 0) && (
        <div className="flex items-center justify-center gap-3 py-2">
          <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
          <span className="text-sm text-zinc-400">
            {currentThought || `Processing ${recentActions.length} actions...`}
          </span>
        </div>
      )}
    </div>
  );
}
