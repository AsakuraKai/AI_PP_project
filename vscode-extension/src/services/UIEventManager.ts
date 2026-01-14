/**
 * UIEventManager - Real-time event propagation for UI updates
 * 
 * Coordinates between backend events and webview updates
 * Provides event aggregation and debouncing for efficient updates
 * 
 * Features:
 * - Real-time error queue updates
 * - Live metrics calculation on analysis completion
 * - Activity feed updates
 * - Debounced batch updates for performance
 */

import * as vscode from 'vscode';
import { StateManager, HistoryItem } from './StateManager';
import { ErrorItem } from '../types';

export interface UIEvent {
    type: 'error_added' | 'error_removed' | 'error_updated' | 'analysis_started' | 'analysis_completed' | 'analysis_failed' | 'metrics_changed' | 'activity_added';
    timestamp: number;
    data: any;
}

export interface ActivityUpdate {
    id: string;
    timestamp: number;
    message: string;
    type: 'success' | 'error' | 'analyzing' | 'info';
    errorMessage?: string;
    metadata?: any;
}

/**
 * UI Event Manager - Singleton
 */
export class UIEventManager {
    private static _instance: UIEventManager;
    private _stateManager: StateManager;
    private _context: vscode.ExtensionContext;

    // Event emitters for webview
    private _onUIEvent = new vscode.EventEmitter<UIEvent>();
    readonly onUIEvent = this._onUIEvent.event;

    private _onActivityUpdate = new vscode.EventEmitter<ActivityUpdate>();
    readonly onActivityUpdate = this._onActivityUpdate.event;

    // Activity feed (in-memory)
    private _activityFeed: ActivityUpdate[] = [];
    private _maxActivityItems = 50;

    // Debouncing
    private _metricsUpdateTimeout?: NodeJS.Timeout;
    private _metricsUpdateDelay = 1000; // 1 second debounce

    private constructor(context: vscode.ExtensionContext, stateManager: StateManager) {
        this._context = context;
        this._stateManager = stateManager;
        this._setupListeners();
    }

    static getInstance(context: vscode.ExtensionContext, stateManager: StateManager): UIEventManager {
        if (!UIEventManager._instance) {
            UIEventManager._instance = new UIEventManager(context, stateManager);
        }
        return UIEventManager._instance;
    }

    /**
     * Setup listeners for state changes
     */
    private _setupListeners(): void {
        // Listen to error queue changes
        this._stateManager.onErrorQueueChange((errors) => {
            this._onErrorQueueChange(errors);
        });

        // Listen to history changes
        this._stateManager.onHistoryChange((history) => {
            this._onHistoryChange(history);
        });

        console.log('[UIEventManager] Event listeners initialized');
    }

    /**
     * Handle error queue changes
     */
    private _onErrorQueueChange(errors: ErrorItem[]): void {
        const pendingCount = errors.filter(e => e.status === 'pending').length;
        const analyzingCount = errors.filter(e => e.status === 'analyzing').length;

        // Fire UI event
        this._fireUIEvent({
            type: 'error_updated',
            timestamp: Date.now(),
            data: {
                totalErrors: errors.length,
                pendingErrors: pendingCount,
                analyzingErrors: analyzingCount
            }
        });

        // Schedule metrics update
        this._scheduleMetricsUpdate();
    }

    /**
     * Handle history changes (analysis completed)
     */
    private _onHistoryChange(history: HistoryItem[]): void {
        if (history.length === 0) return;

        const latestItem = history[0]; // Most recent

        // Fire analysis completed event
        this._fireUIEvent({
            type: 'analysis_completed',
            timestamp: Date.now(),
            data: {
                historyItem: latestItem,
                totalHistoryCount: history.length
            }
        });

        // Add to activity feed
        const wasSuccessful = latestItem.result && latestItem.result.confidence > 0.7;
        this._addActivity({
            id: `activity-${Date.now()}`,
            timestamp: latestItem.timestamp,
            message: wasSuccessful
                ? `✓ Analyzed: ${this._truncate(latestItem.error.message, 50)}`
                : `⚠ Low confidence: ${this._truncate(latestItem.error.message, 50)}`,
            type: wasSuccessful ? 'success' : 'error',
            metadata: {
                duration: latestItem.duration,
                confidence: latestItem.result?.confidence || 0
            }
        });

        // Schedule metrics update
        this._scheduleMetricsUpdate();
    }

    /**
     * Fire error added event
     */
    errorAdded(error: ErrorItem): void {
        this._fireUIEvent({
            type: 'error_added',
            timestamp: Date.now(),
            data: { error }
        });

        this._addActivity({
            id: `activity-${Date.now()}`,
            timestamp: Date.now(),
            message: `New error detected: ${this._truncate(error.message, 50)}`,
            type: 'info',
            metadata: { errorId: error.id }
        });

        this._scheduleMetricsUpdate();
    }

    /**
     * Fire error removed event
     */
    errorRemoved(errorId: string): void {
        this._fireUIEvent({
            type: 'error_removed',
            timestamp: Date.now(),
            data: { errorId }
        });
    }

    /**
     * Fire analysis started event
     */
    analysisStarted(error: ErrorItem): void {
        this._fireUIEvent({
            type: 'analysis_started',
            timestamp: Date.now(),
            data: { error }
        });

        this._addActivity({
            id: `activity-${Date.now()}`,
            timestamp: Date.now(),
            message: `Analyzing: ${this._truncate(error.message, 50)}`,
            type: 'analyzing',
            metadata: { errorId: error.id }
        });
    }

    /**
     * Fire analysis failed event
     */
    analysisFailed(error: ErrorItem, reason: string): void {
        this._fireUIEvent({
            type: 'analysis_failed',
            timestamp: Date.now(),
            data: { error, reason }
        });

        this._addActivity({
            id: `activity-${Date.now()}`,
            timestamp: Date.now(),
            message: `✗ Failed: ${this._truncate(error.message, 50)}`,
            type: 'error',
            errorMessage: reason,
            metadata: { errorId: error.id }
        });
    }

    /**
     * Add activity to feed
     */
    private _addActivity(activity: ActivityUpdate): void {
        this._activityFeed.unshift(activity);

        // Keep only last N items
        if (this._activityFeed.length > this._maxActivityItems) {
            this._activityFeed = this._activityFeed.slice(0, this._maxActivityItems);
        }

        // Fire event
        this._onActivityUpdate.fire(activity);
    }

    /**
     * Get activity feed
     */
    getActivityFeed(limit?: number): ActivityUpdate[] {
        return limit
            ? this._activityFeed.slice(0, limit)
            : [...this._activityFeed];
    }

    /**
     * Fire UI event
     */
    private _fireUIEvent(event: UIEvent): void {
        this._onUIEvent.fire(event);
    }

    /**
     * Schedule metrics update (debounced)
     */
    private _scheduleMetricsUpdate(): void {
        // Clear existing timeout
        if (this._metricsUpdateTimeout) {
            clearTimeout(this._metricsUpdateTimeout);
        }

        // Schedule new update
        this._metricsUpdateTimeout = setTimeout(() => {
            this._fireUIEvent({
                type: 'metrics_changed',
                timestamp: Date.now(),
                data: {
                    needsRefresh: true
                }
            });
        }, this._metricsUpdateDelay);
    }

    /**
     * Truncate text for display
     */
    private _truncate(text: string, maxLength: number): string {
        return text.length > maxLength
            ? text.substring(0, maxLength) + '...'
            : text;
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        if (this._metricsUpdateTimeout) {
            clearTimeout(this._metricsUpdateTimeout);
        }
        this._onUIEvent.dispose();
        this._onActivityUpdate.dispose();
    }
}
