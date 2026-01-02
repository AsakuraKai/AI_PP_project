"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStateStream = void 0;
const events_1 = require("events");
/**
 * Agent state stream for real-time UI updates
 */
class AgentStateStream extends events_1.EventEmitter {
    constructor() {
        super();
        this.startTime = null;
        this.setMaxListeners(20); // Allow multiple UI components to subscribe
    }
    /**
     * Emit iteration start event
     */
    emitIteration(iteration, maxIterations) {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        const progress = iteration / maxIterations;
        const event = {
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
    emitThought(thought, iteration) {
        const event = {
            thought,
            iteration,
            timestamp: Date.now(),
        };
        this.emit('thought', event);
    }
    /**
     * Emit action execution event
     */
    emitAction(action, iteration) {
        const event = {
            action,
            iteration,
            timestamp: Date.now(),
        };
        this.emit('action', event);
    }
    /**
     * Emit observation (tool result) event
     */
    emitObservation(observation, iteration, success = true) {
        const event = {
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
    emitComplete(rca, totalIterations) {
        const duration = this.startTime ? Date.now() - this.startTime : 0;
        const event = {
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
    emitError(error, iteration, phase) {
        const event = {
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
    reset() {
        this.startTime = null;
    }
    /**
     * Get elapsed time since analysis started (in milliseconds)
     */
    getElapsedTime() {
        return this.startTime ? Date.now() - this.startTime : 0;
    }
    /**
     * Remove all listeners and reset state
     */
    dispose() {
        this.removeAllListeners();
        this.reset();
    }
}
exports.AgentStateStream = AgentStateStream;
//# sourceMappingURL=AgentStateStream.js.map