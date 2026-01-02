/**
 * AgentStateViewer - Real-time agent state display
 * 
 * Shows:
 * - Current iteration/max iterations
 * - Agent thoughts in real-time
 * - Tool execution progress
 * - Observations from tools
 * - Hypothesis generation (for MultiPassAgent)
 * 
 * Phase 6.1: Core Integration
 */

import * as vscode from 'vscode';
import { AgentStateStream } from '../../../src/agent/AgentStateStream';
import {
  AgentState,
  IterationEvent,
  ThoughtEvent,
  ActionEvent,
  ObservationEvent
} from '../../../src/agent/types';  // Use shared types (Chunk 6 Consolidation)

/**
 * Agent State Viewer component
 */
export class AgentStateViewer {
  private _state: AgentState;
  private _listeners: Array<(state: AgentState) => void> = [];
  private _stateStream?: AgentStateStream;
  private _startTime: number = 0;
  private _updateInterval?: NodeJS.Timeout;

  constructor() {
    this._state = this._getDefaultState();
  }

  /**
   * Connect to agent state stream
   */
  connectStream(stream: AgentStateStream): void {
    // Clean up previous stream
    this.disconnectStream();

    this._stateStream = stream;
    this._startTime = Date.now();
    this._state.isActive = true;

    // Listen to iteration events
    this._stateStream.on('iteration', (event: IterationEvent) => {
      this._state.iteration = event.iteration;
      this._state.maxIterations = event.maxIterations;
      this._state.progress = event.progress * 100;
      this._notifyListeners();
    });

    // Listen to thought events
    this._stateStream.on('thought', (event: ThoughtEvent) => {
      this._state.currentThought = event.thought;
      this._notifyListeners();
    });

    // Listen to action events
    this._stateStream.on('action', (event: ActionEvent) => {
      this._state.recentActions.push({
        tool: event.action.tool,
        timestamp: event.timestamp
      });

      // Keep only last 5 actions
      if (this._state.recentActions.length > 5) {
        this._state.recentActions.shift();
      }

      this._notifyListeners();
    });

    // Listen to observation events
    this._stateStream.on('observation', (event: ObservationEvent) => {
      this._state.recentObservations.push({
        text: event.observation.substring(0, 100), // Truncate for display
        success: event.success,
        timestamp: event.timestamp
      });

      // Keep only last 5 observations
      if (this._state.recentObservations.length > 5) {
        this._state.recentObservations.shift();
      }

      this._notifyListeners();
    });

    // Listen to completion
    this._stateStream.on('complete', () => {
      this._state.isActive = false;
      this._state.progress = 100;
      this._state.currentThought = 'Analysis complete';
      this._notifyListeners();
      this._stopElapsedTimer();
    });

    // Listen to errors
    this._stateStream.on('error', (event) => {
      this._state.isActive = false;
      this._state.currentThought = `Error: ${event.error.message}`;
      this._notifyListeners();
      this._stopElapsedTimer();
    });

    // Start elapsed time updater
    this._startElapsedTimer();
  }

  /**
   * Disconnect from current stream
   */
  disconnectStream(): void {
    if (this._stateStream) {
      this._stateStream.removeAllListeners();
      this._stateStream = undefined;
    }

    this._stopElapsedTimer();
    this._state = this._getDefaultState();
    this._notifyListeners();
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this._state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: AgentState) => void): vscode.Disposable {
    this._listeners.push(listener);

    // Return disposable to unsubscribe
    return new vscode.Disposable(() => {
      const index = this._listeners.indexOf(listener);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    });
  }

  /**
   * Render state as markdown
   */
  renderMarkdown(): string {
    const state = this._state;

    if (!state.isActive && state.progress === 0) {
      return '## Agent State\n\n_No active analysis_';
    }

    const progressBar = this._renderProgressBar(state.progress);
    const elapsed = (state.elapsed / 1000).toFixed(1);

    let md = `## Agent State\n\n`;
    md += `**Progress:** ${state.progress.toFixed(0)}% ${progressBar}\n\n`;
    md += `**Iteration:** ${state.iteration}/${state.maxIterations}\n\n`;
    md += `**Elapsed:** ${elapsed}s\n\n`;
    md += `**Status:** ${state.isActive ? ' Running' : ' Complete'}\n\n`;

    if (state.currentThought) {
      md += `### Current Thought\n\n`;
      md += `> ${state.currentThought}\n\n`;
    }

    if (state.recentActions.length > 0) {
      md += `### Recent Actions\n\n`;
      state.recentActions.forEach(action => {
        md += `- [TOOL] \`${action.tool}\`\n`;
      });
      md += `\n`;
    }

    if (state.recentObservations.length > 0) {
      md += `### Recent Observations\n\n`;
      state.recentObservations.forEach(obs => {
        const icon = obs.success ? '' : '';
        md += `- ${icon} ${obs.text}...\n`;
      });
      md += `\n`;
    }

    return md;
  }

  /**
   * Render state as HTML (for webview)
   */
  renderHTML(): string {
    const state = this._state;

    if (!state.isActive && state.progress === 0) {
      return `
        <div class="agent-state-empty">
          <p>No active analysis</p>
        </div>
      `;
    }

    const elapsed = (state.elapsed / 1000).toFixed(1);
    const statusIcon = state.isActive ? '' : '';
    const statusText = state.isActive ? 'Running' : 'Complete';

    let html = `
      <div class="agent-state">
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Progress: ${state.progress.toFixed(0)}%</span>
            <span class="status-badge ${state.isActive ? 'running' : 'complete'}">
              ${statusIcon} ${statusText}
            </span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${state.progress}%"></div>
          </div>
          <div class="progress-info">
            <span>Iteration: ${state.iteration}/${state.maxIterations}</span>
            <span>Elapsed: ${elapsed}s</span>
          </div>
        </div>
    `;

    if (state.currentThought) {
      html += `
        <div class="thought-section">
          <h3>Current Thought</h3>
          <blockquote>${this._escapeHtml(state.currentThought)}</blockquote>
        </div>
      `;
    }

    if (state.recentActions.length > 0) {
      html += `
        <div class="actions-section">
          <h3>Recent Actions</h3>
          <ul class="action-list">
      `;
      state.recentActions.forEach(action => {
        html += `<li><code>${this._escapeHtml(action.tool)}</code></li>`;
      });
      html += `
          </ul>
        </div>
      `;
    }

    if (state.recentObservations.length > 0) {
      html += `
        <div class="observations-section">
          <h3>Recent Observations</h3>
          <ul class="observation-list">
      `;
      state.recentObservations.forEach(obs => {
        const icon = obs.success ? '' : '';
        html += `<li>${icon} ${this._escapeHtml(obs.text)}...</li>`;
      });
      html += `
          </ul>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.disconnectStream();
    this._listeners = [];
  }

  // --- Private Methods ---

  private _getDefaultState(): AgentState {
    return {
      iteration: 0,
      maxIterations: 0,
      progress: 0,
      currentThought: '',
      recentActions: [],
      recentObservations: [],
      elapsed: 0,
      isActive: false
    };
  }

  private _notifyListeners(): void {
    const state = this.getState();
    this._listeners.forEach(listener => listener(state));
  }

  private _startElapsedTimer(): void {
    this._updateInterval = setInterval(() => {
      if (this._state.isActive) {
        this._state.elapsed = Date.now() - this._startTime;
        this._notifyListeners();
      }
    }, 100); // Update every 100ms
  }

  private _stopElapsedTimer(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = undefined;
    }
  }

  private _renderProgressBar(progress: number): string {
    const filled = Math.floor(progress / 5);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  private _escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
