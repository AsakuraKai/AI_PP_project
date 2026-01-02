/**
 * Shared type definitions for Agent State Management
 * 
 * This module consolidates state-related interfaces used across:
 * - AgentStateStream (backend state streaming)
 * - StateManager (extension state management)
 * - AgentStateViewer (UI state viewer)
 * 
 * Eliminates duplicate type definitions (Chunk 6 Consolidation)
 */

import { RCAResult, ToolCall } from '../types';

/**
 * Event data for iteration updates
 */
export interface IterationEvent {
  iteration: number;
  maxIterations: number;
  progress: number; // 0-1 (percentage as decimal)
  timestamp: number;
}

/**
 * Event data for thought updates
 */
export interface ThoughtEvent {
  thought: string;
  iteration: number;
  timestamp: number;
}

/**
 * Event data for action updates
 */
export interface ActionEvent {
  action: ToolCall;
  iteration: number;
  timestamp: number;
}

/**
 * Event data for observation updates
 */
export interface ObservationEvent {
  observation: string;
  iteration: number;
  success: boolean;
  timestamp: number;
}

/**
 * Event data for completion
 */
export interface CompleteEvent {
  rca: RCAResult;
  totalIterations: number;
  duration: number; // milliseconds
  timestamp: number;
}

/**
 * Event data for errors
 */
export interface ErrorEvent {
  error: Error;
  iteration: number;
  phase: 'thought' | 'action' | 'observation' | 'synthesis';
  timestamp: number;
}

/**
 * Agent state for real-time UI display
 * Consolidates AgentState from AgentStateViewer and AnalysisProgress from panel types
 */
export interface AgentState {
  /** Current iteration number */
  iteration: number;
  
  /** Maximum number of iterations */
  maxIterations: number;
  
  /** Overall progress (0-100) */
  progress: number;
  
  /** Current thought/hypothesis being processed */
  currentThought: string;
  
  /** Recent tool actions executed */
  recentActions: Array<{ tool: string; timestamp: number }>;
  
  /** Recent observations from tools */
  recentObservations: Array<{ text: string; success: boolean; timestamp: number }>;
  
  /** Elapsed time in milliseconds */
  elapsed: number;
  
  /** Whether analysis is currently active */
  isActive: boolean;
  
  /** Current tool being executed (optional) */
  currentTool?: string;
  
  /** Tools used so far (optional) */
  toolsUsed?: string[];
}

/**
 * Learning metrics for agent performance tracking
 */
export interface LearningMetrics {
  totalAnalyses: number;
  successfulAnalyses: number;
  averageConfidence: number;
  averageLatency: number; // ms
  topErrorTypes: Array<{ type: string; count: number }>;
  improvementTrend: number; // -1 to 1 (negative = worse, positive = better)
  cacheHitRate: number; // 0-1
  lastUpdated: number; // timestamp
}
