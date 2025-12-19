/**
 * AgentStateStream - Real-time progress updates for UI
 * 
 * EventEmitter for streaming agent state changes to UI consumers.
 * Emits events for iterations, thoughts, actions, observations, and completion.
 * 
 * Design:
 * - EventEmitter pattern for decoupled communication
 * - Progress calculation (percentage complete)
 * - Timestamped events for UI timeline visualization
 * - Error propagation with context
 * 
 * Events:
 * - 'iteration': New iteration started
 * - 'thought': Agent generated a hypothesis
 * - 'action': Tool execution initiated
 * - 'observation': Tool result received
 * - 'complete': Analysis finished
 * - 'error': Error occurred
 * 
 * @example
 * const stream = agent.getStream();
 * stream.on('iteration', ({ iteration, progress }) => {
 *   console.log(`Iteration ${iteration}: ${progress}% complete`);
 * });
 * stream.on('complete', ({ rca }) => {
 *   console.log('Analysis done:', rca.rootCause);
 * });
 */

import { EventEmitter } from 'events';
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
 * Agent state stream for real-time UI updates
 */
export class AgentStateStream extends EventEmitter {
  private startTime: number | null = null;

  constructor() {
    super();
    this.setMaxListeners(20); // Allow multiple UI components to subscribe
  }

  /**
   * Emit iteration start event
   */
  emitIteration(iteration: number, maxIterations: number): void {
    if (!this.startTime) {
      this.startTime = Date.now();
    }

    const progress = iteration / maxIterations;

    const event: IterationEvent = {
      iteration,
      maxIterations,
      progress,
      timestamp: Date.now(),
    };

    this.emit('iteration', event);
  }

  /**
   * Emit thought generation event
   */
  emitThought(thought: string, iteration: number): void {
    const event: ThoughtEvent = {
      thought,
      iteration,
      timestamp: Date.now(),
    };

    this.emit('thought', event);
  }

  /**
   * Emit action execution event
   */
  emitAction(action: ToolCall, iteration: number): void {
    const event: ActionEvent = {
      action,
      iteration,
      timestamp: Date.now(),
    };

    this.emit('action', event);
  }

  /**
   * Emit observation (tool result) event
   */
  emitObservation(observation: string, iteration: number, success: boolean = true): void {
    const event: ObservationEvent = {
      observation,
      iteration,
      success,
      timestamp: Date.now(),
    };

    this.emit('observation', event);
  }

  /**
   * Emit analysis completion event
   */
  emitComplete(rca: RCAResult, totalIterations: number): void {
    const duration = this.startTime ? Date.now() - this.startTime : 0;

    const event: CompleteEvent = {
      rca,
      totalIterations,
      duration,
      timestamp: Date.now(),
    };

    this.emit('complete', event);
    this.reset();
  }

  /**
   * Emit error event
   */
  emitError(
    error: Error,
    iteration: number,
    phase: 'thought' | 'action' | 'observation' | 'synthesis'
  ): void {
    const event: ErrorEvent = {
      error,
      iteration,
      phase,
      timestamp: Date.now(),
    };

    this.emit('error', event);
  }

  /**
   * Reset stream state
   */
  reset(): void {
    this.startTime = null;
  }

  /**
   * Get elapsed time since analysis started (in milliseconds)
   */
  getElapsedTime(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  /**
   * Remove all listeners and reset state
   */
  dispose(): void {
    this.removeAllListeners();
    this.reset();
  }
}
