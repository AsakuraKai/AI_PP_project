/**
 * Tests for AgentStateStream
 * 
 * Tests event emission, subscription, progress calculation, and cleanup.
 */

import { AgentStateStream } from '../../src/agent/AgentStateStream';
import { RCAResult, ToolCall } from '../../src/types';

describe('AgentStateStream', () => {
  let stream: AgentStateStream;

  beforeEach(() => {
    stream = new AgentStateStream();
  });

  afterEach(() => {
    stream.dispose();
  });

  describe('emitIteration()', () => {
    it('should emit iteration event with correct progress', (done) => {
      stream.on('iteration', (event) => {
        expect(event.iteration).toBe(3);
        expect(event.maxIterations).toBe(10);
        expect(event.progress).toBe(0.3);
        expect(event.timestamp).toBeGreaterThan(0);
        done();
      });

      stream.emitIteration(3, 10);
    });

    it('should calculate progress correctly for first iteration', (done) => {
      stream.on('iteration', (event) => {
        expect(event.iteration).toBe(1);
        expect(event.maxIterations).toBe(5);
        expect(event.progress).toBe(0.2);
        done();
      });

      stream.emitIteration(1, 5);
    });

    it('should calculate progress correctly for last iteration', (done) => {
      stream.on('iteration', (event) => {
        expect(event.iteration).toBe(10);
        expect(event.maxIterations).toBe(10);
        expect(event.progress).toBe(1.0);
        done();
      });

      stream.emitIteration(10, 10);
    });

    it('should initialize startTime on first call', () => {
      stream.emitIteration(1, 10);
      const elapsed = stream.getElapsedTime();
      
      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(100); // Should be very quick
    });
  });

  describe('emitThought()', () => {
    it('should emit thought event', (done) => {
      const thought = 'This error is likely caused by uninitialized lateinit property';

      stream.on('thought', (event) => {
        expect(event.thought).toBe(thought);
        expect(event.iteration).toBe(2);
        expect(event.timestamp).toBeGreaterThan(0);
        done();
      });

      stream.emitThought(thought, 2);
    });

    it('should handle empty thought', (done) => {
      stream.on('thought', (event) => {
        expect(event.thought).toBe('');
        done();
      });

      stream.emitThought('', 1);
    });

    it('should handle very long thought', (done) => {
      const longThought = 'A'.repeat(5000);

      stream.on('thought', (event) => {
        expect(event.thought).toBe(longThought);
        done();
      });

      stream.emitThought(longThought, 1);
    });
  });

  describe('emitAction()', () => {
    it('should emit action event', (done) => {
      const action: ToolCall = {
        tool: 'read_file',
        parameters: { filePath: 'MainActivity.kt', line: 45 },
        timestamp: Date.now(),
      };

      stream.on('action', (event) => {
        expect(event.action).toEqual(action);
        expect(event.iteration).toBe(3);
        expect(event.timestamp).toBeGreaterThan(0);
        done();
      });

      stream.emitAction(action, 3);
    });

    it('should handle action with complex parameters', (done) => {
      const action: ToolCall = {
        tool: 'find_callers',
        parameters: {
          functionName: 'onCreate',
          filePath: 'MainActivity.kt',
          includeTests: true,
          maxDepth: 3,
        },
        timestamp: Date.now(),
      };

      stream.on('action', (event) => {
        expect(event.action.parameters).toEqual(action.parameters);
        done();
      });

      stream.emitAction(action, 2);
    });
  });

  describe('emitObservation()', () => {
    it('should emit observation event with success', (done) => {
      const observation = 'File read successfully: 50 lines of code';

      stream.on('observation', (event) => {
        expect(event.observation).toBe(observation);
        expect(event.iteration).toBe(4);
        expect(event.success).toBe(true);
        expect(event.timestamp).toBeGreaterThan(0);
        done();
      });

      stream.emitObservation(observation, 4, true);
    });

    it('should emit observation event with failure', (done) => {
      const observation = 'Tool execution failed: File not found';

      stream.on('observation', (event) => {
        expect(event.observation).toBe(observation);
        expect(event.success).toBe(false);
        done();
      });

      stream.emitObservation(observation, 3, false);
    });

    it('should default success to true', (done) => {
      stream.on('observation', (event) => {
        expect(event.success).toBe(true);
        done();
      });

      stream.emitObservation('Observation', 1);
    });
  });

  describe('emitComplete()', () => {
    it('should emit complete event with RCA result', (done) => {
      const rca: RCAResult = {
        error: 'lateinit property user has not been initialized',
        rootCause: 'Property accessed before initialization',
        fixGuidelines: ['Initialize in onCreate()', 'Use isInitialized check'],
        confidence: 0.9,
        iterations: 5,
      };

      stream.on('complete', (event) => {
        expect(event.rca).toEqual(rca);
        expect(event.totalIterations).toBe(5);
        expect(event.duration).toBeGreaterThanOrEqual(0);
        expect(event.timestamp).toBeGreaterThan(0);
        done();
      });

      // Initialize startTime
      stream.emitIteration(1, 10);

      // Small delay to ensure duration > 0
      setTimeout(() => {
        stream.emitComplete(rca, 5);
      }, 10);
    });

    it('should calculate duration correctly', (done) => {
      const rca: RCAResult = {
        error: 'Test error',
        rootCause: 'Test cause',
        fixGuidelines: ['Test fix'],
        confidence: 0.8,
      };

      stream.on('complete', (event) => {
        expect(event.duration).toBeGreaterThanOrEqual(50);
        expect(event.duration).toBeLessThan(200);
        done();
      });

      stream.emitIteration(1, 10);

      setTimeout(() => {
        stream.emitComplete(rca, 3);
      }, 50);
    });

    it('should reset startTime after completion', (done) => {
      const rca: RCAResult = {
        error: 'Test',
        rootCause: 'Test',
        fixGuidelines: [],
        confidence: 0.5,
      };

      stream.on('complete', () => {
        expect(stream.getElapsedTime()).toBe(0);
        done();
      });

      stream.emitIteration(1, 10);
      stream.emitComplete(rca, 1);
    });
  });

  describe('emitError()', () => {
    it('should emit error event', (done) => {
      const error = new Error('LLM connection failed');

      stream.on('error', (event) => {
        expect(event.error).toBe(error);
        expect(event.iteration).toBe(3);
        expect(event.phase).toBe('action');
        expect(event.timestamp).toBeGreaterThan(0);
        done();
      });

      stream.emitError(error, 3, 'action');
    });

    it('should handle error in different phases', () => {
      const phases: Array<'thought' | 'action' | 'observation' | 'synthesis'> = [
        'thought',
        'action',
        'observation',
        'synthesis',
      ];

      phases.forEach((phase) => {
        const error = new Error(`Error in ${phase}`);
        let emitted = false;

        stream.on('error', (event) => {
          expect(event.phase).toBe(phase);
          emitted = true;
        });

        stream.emitError(error, 1, phase);
        expect(emitted).toBe(true);
        stream.removeAllListeners('error');
      });
    });
  });

  describe('reset()', () => {
    it('should reset startTime', () => {
      stream.emitIteration(1, 10);
      expect(stream.getElapsedTime()).toBeGreaterThanOrEqual(0);

      stream.reset();
      expect(stream.getElapsedTime()).toBe(0);
    });

    it('should allow reuse after reset', () => {
      stream.emitIteration(1, 10);
      stream.reset();

      stream.emitIteration(1, 5);
      expect(stream.getElapsedTime()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getElapsedTime()', () => {
    it('should return 0 before first iteration', () => {
      expect(stream.getElapsedTime()).toBe(0);
    });

    it('should return elapsed time after iterations started', (done) => {
      stream.emitIteration(1, 10);

      setTimeout(() => {
        const elapsed = stream.getElapsedTime();
        expect(elapsed).toBeGreaterThanOrEqual(50);
        expect(elapsed).toBeLessThan(200);
        done();
      }, 50);
    });
  });

  describe('dispose()', () => {
    it('should remove all listeners', () => {
      stream.on('iteration', () => {});
      stream.on('thought', () => {});
      stream.on('complete', () => {});

      expect(stream.listenerCount('iteration')).toBeGreaterThan(0);

      stream.dispose();

      expect(stream.listenerCount('iteration')).toBe(0);
      expect(stream.listenerCount('thought')).toBe(0);
      expect(stream.listenerCount('complete')).toBe(0);
    });

    it('should reset state', () => {
      stream.emitIteration(1, 10);
      stream.dispose();

      expect(stream.getElapsedTime()).toBe(0);
    });
  });

  describe('multiple subscribers', () => {
    it('should notify all subscribers', () => {
      let count1 = 0;
      let count2 = 0;
      let count3 = 0;

      stream.on('iteration', () => count1++);
      stream.on('iteration', () => count2++);
      stream.on('iteration', () => count3++);

      stream.emitIteration(1, 10);

      expect(count1).toBe(1);
      expect(count2).toBe(1);
      expect(count3).toBe(1);
    });

    it('should handle 20+ listeners', () => {
      const counts: number[] = [];

      for (let i = 0; i < 25; i++) {
        counts.push(0);
        stream.on('thought', () => counts[i]++);
      }

      stream.emitThought('Test thought', 1);

      counts.forEach((count) => {
        expect(count).toBe(1);
      });
    });
  });

  describe('event ordering', () => {
    it('should emit events in correct order', () => {
      const events: string[] = [];

      stream.on('iteration', () => events.push('iteration'));
      stream.on('thought', () => events.push('thought'));
      stream.on('action', () => events.push('action'));
      stream.on('observation', () => events.push('observation'));

      stream.emitIteration(1, 10);
      stream.emitThought('Test', 1);
      stream.emitAction({ tool: 'test', parameters: {}, timestamp: Date.now() }, 1);
      stream.emitObservation('Result', 1);

      expect(events).toEqual(['iteration', 'thought', 'action', 'observation']);
    });
  });

  describe('edge cases', () => {
    it('should handle emitting events without listeners', () => {
      expect(() => {
        stream.emitIteration(1, 10);
        stream.emitThought('Test', 1);
        stream.emitComplete(
          {
            error: 'Test',
            rootCause: 'Test',
            fixGuidelines: [],
            confidence: 0.5,
          },
          1
        );
      }).not.toThrow();
    });

    it('should handle very large iteration numbers', (done) => {
      stream.on('iteration', (event) => {
        expect(event.iteration).toBe(1000000);
        expect(event.maxIterations).toBe(1000000);
        expect(event.progress).toBe(1.0);
        done();
      });

      stream.emitIteration(1000000, 1000000);
    });

    it('should handle zero iterations', (done) => {
      stream.on('complete', (event) => {
        expect(event.totalIterations).toBe(0);
        done();
      });

      stream.emitComplete(
        {
          error: 'Test',
          rootCause: 'Test',
          fixGuidelines: [],
          confidence: 0.5,
        },
        0
      );
    });
  });
});
