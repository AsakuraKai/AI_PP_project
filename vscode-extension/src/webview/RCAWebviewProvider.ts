import * as vscode from 'vscode';
import * as path from 'path';
import { AnalysisService } from '../services/AnalysisService';
import { FixApplicationService } from '../services/FixApplicationService';
import { StateManager } from '../services/StateManager';
import { ErrorQueueManager } from '../services/ErrorQueueManager';
import { NetworkTimeoutHandler } from '../services/NetworkTimeoutHandler';
import { FeedbackService } from '../services/FeedbackService';

export class RCAWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'rca-agent.mainView';
    private _view?: vscode.WebviewView;
    private readonly _extensionUri: vscode.Uri;
    private readonly _extensionContext: vscode.ExtensionContext;
    private readonly analysisService: AnalysisService;
    private readonly fixApplicationService: FixApplicationService;
    private readonly networkTimeoutHandler: NetworkTimeoutHandler;
    private readonly feedbackService: FeedbackService;
    private readonly stateManager: StateManager;
    private readonly errorQueueManager: ErrorQueueManager;

    constructor(extensionUri: vscode.Uri, extensionContext: vscode.ExtensionContext) {
        this._extensionUri = extensionUri;
        this._extensionContext = extensionContext;
        this.analysisService = AnalysisService.getInstance();
        this.fixApplicationService = FixApplicationService.getInstance();
        this.networkTimeoutHandler = new NetworkTimeoutHandler();
        this.feedbackService = FeedbackService.getInstance();

        // Use existing singletons that were initialized in extension.ts
        // This ensures error detection is already active before webview opens
        this.stateManager = StateManager.getInstance(extensionContext);
        this.errorQueueManager = ErrorQueueManager.getInstance(extensionContext);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Set up state change listeners
        this.stateManager.onErrorQueueChange(() => this._handleErrorQueueChanged());
        this.stateManager.onStateChange(() => this._handleStateChanged());

        // Phase 3: Set up history change listener
        this.stateManager.onHistoryChange((history) => {
            this._sendMessage({
                command: 'historyUpdated',
                history: this._normalizeHistoryForWebview(history)
            });
        });

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            await this._handleMessage(message);
        });

        // Send initial state
        this._sendInitialState();

        // Send initial error queue data (non-blocking)
        console.log('[RCAWebviewProvider] Webview resolved, sending initial data...');
        this._handleGetErrorQueue();
        this._handleGetDashboardData();
    }

    private async _handleMessage(message: any) {
        switch (message.command) {
            // Dashboard commands
            case 'getDashboardData':
                await this._handleGetDashboardData();
                break;
            case 'analyzeAllErrors':
                await this._handleAnalyzeAllErrors();
                break;
            case 'scanWorkspace':
                await this._handleScanWorkspace();
                break;
            case 'openSettings':
                await this._handleOpenSettings();
                break;

            // Error Queue commands
            case 'getErrorQueue':
                await this._handleGetErrorQueue();
                break;
            case 'refreshErrorQueue':
                await this._handleRefreshErrorQueue();
                break;
            case 'removeError':
                await this._handleRemoveError(message.errorId);
                break;
            case 'pinError':
                await this._handlePinError(message.errorId);
                break;
            case 'unpinError':
                await this._handleUnpinError(message.errorId);
                break;
            case 'analyzeMultipleErrors':
                await this._handleAnalyzeMultipleErrors(message.errorIds);
                break;
            case 'clearCompletedErrors':
                await this._handleClearCompletedErrors();
                break;
            case 'clearAllErrors':
                await this._handleClearAllErrors();
                break;
            case 'openErrorLocation':
                await this._handleOpenErrorLocation(message.errorId);
                break;

            // Analysis commands
            case 'analyzeError':
                await this._handleAnalyzeError(message.error);
                break;
            case 'startAnalysis':
                await this._handleStartAnalysis(message.errorId, message.settings);
                break;
            case 'startManualAnalysis':
                await this._handleStartManualAnalysis(message.errorText, message.settings);
                break;
            case 'cancelAnalysis':
                await this._handleCancelAnalysis();
                break;
            case 'applyFix':
                await this._handleApplyFix(message.fix);
                break;
            case 'exportResult':
                await this._handleExportResult(message.result);
                break;

            // Feedback
            case 'submitFeedback':
                await this._handleSubmitFeedback(message);
                break;

            // Config commands
            case 'updateConfig':
                await this._handleUpdateConfig(message.key, message.value);
                break;
            case 'checkOllamaStatus':
                await this._handleCheckOllamaStatus();
                break;

            // Navigation
            case 'navigate':
                this._handleNavigate(message.route);
                break;

            // ============================================================================
            // Phase 3: History View Handlers
            // ============================================================================
            case 'getHistory':
                await this._handleGetHistory(message.limit);
                break;
            case 'searchHistory':
                await this._handleSearchHistory(message.query);
                break;
            case 'reanalyzeFromHistory':
                await this._handleReanalyzeFromHistory(message.historyId);
                break;
            case 'deleteHistoryItem':
                await this._handleDeleteHistoryItem(message.historyId);
                break;
            case 'clearHistory':
                await this._handleClearHistory();
                break;
            case 'exportHistoryItem':
                await this._handleExportHistoryItem(message.historyId);
                break;
            case 'exportAllHistory':
                await this._handleExportAllHistory();
                break;
            case 'refreshHistory':
                await this._handleRefreshHistory();
                break;

            // ============================================================================
            // Phase 3: Agent State View Handlers
            // ============================================================================
            case 'subscribeAgentState':
                await this._handleSubscribeAgentState();
                break;
            case 'unsubscribeAgentState':
                await this._handleUnsubscribeAgentState();
                break;
            case 'getToolMetrics':
                await this._handleGetToolMetrics();
                break;

            // ============================================================================
            // Phase 3: Fix Manager View Handlers
            // ============================================================================
            case 'getPendingFixes':
                await this._handleGetPendingFixes();
                break;
            case 'getAppliedFixes':
                await this._handleGetAppliedFixes();
                break;
            case 'previewFix':
                await this._handlePreviewFix(message.fixId);
                break;
            case 'applyFixById':
                await this._handleApplyFixById(message.fixId);
                break;
            case 'rejectFix':
                await this._handleRejectFix(message.fixId);
                break;
            case 'applyMultipleFixes':
                await this._handleApplyMultipleFixes(message.fixIds);
                break;
            case 'rejectMultipleFixes':
                await this._handleRejectMultipleFixes(message.fixIds);
                break;
            case 'clearAppliedFixes':
                await this._handleClearAppliedFixes();
                break;

            // ============================================================================
            // Phase 3: Metrics View Handlers
            // ============================================================================
            case 'getMetrics':
                await this._handleGetMetrics(message.timeRange);
                break;
            case 'exportMetrics':
                await this._handleExportMetrics(message.timeRange);
                break;

            default:
                console.warn('Unknown command:', message.command);
        }
    }

    private async _handleSubmitFeedback(message: any) {
        try {
            const feedbackType = message.feedbackType as 'positive' | 'negative' | undefined;
            const rcaId = message.rcaId as string | undefined;
            const errorHash = message.errorHash as string | undefined;

            if (!feedbackType || (feedbackType !== 'positive' && feedbackType !== 'negative')) {
                throw new Error('Invalid feedback type');
            }
            if (!rcaId) {
                throw new Error('Missing rcaId (analysis was not persisted)');
            }

            const res = await this.feedbackService.submitFeedback({
                rcaId,
                feedbackType,
                errorHash
            });

            this._sendMessage({
                command: 'feedbackResult',
                result: res
            });
        } catch (error: any) {
            this._sendMessage({
                command: 'feedbackError',
                error: error?.message || 'Failed to submit feedback',
                feedbackType: message?.feedbackType,
                rcaId: message?.rcaId,
                errorHash: message?.errorHash
            });
        }
    }

    private async _handleAnalyzeError(error: any) {
        try {
            const startTime = Date.now();
            this._sendMessage({
                command: 'analysisStarted',
                errorId: error.id,
                maxIterations: 6
            });

            const result = await this.analysisService.analyzeError(
                error,
                (progress) => {
                    this._sendMessage({
                        command: 'analysisProgress',
                        progress: progress
                    });
                }
            );

            const duration = Date.now() - startTime;

            // Transform backend result to webview-compatible format
            const webviewResult = this._normalizeResultForWebview(result);
            webviewResult.duration = duration;

            this._sendMessage({
                command: 'analysisComplete',
                result: webviewResult
            });

            // Record analysis to history (used by History + Metrics views)
            try {
                await this.stateManager.addToHistory({
                    id: `hist-${Date.now()}-${error.id}`,
                    timestamp: Date.now(),
                    error,
                    result: webviewResult,
                    duration
                } as any);
            } catch (historyError) {
                console.warn('[RCAWebviewProvider] Failed to add item to history:', historyError);
            }
        } catch (error: any) {
            this._sendMessage({
                command: 'analysisError',
                error: error.message
            });
        }
    }

    private async _handleApplyFix(fix: any) {
        try {
            const result = await this.fixApplicationService.applyFixes([fix]);
            this._sendMessage({
                command: 'fixApplied',
                data: { success: result.success }
            });
            vscode.window.showInformationMessage(`Fix applied: ${result.applied} succeeded, ${result.failed} failed`);
        } catch (error: any) {
            this._sendMessage({
                command: 'fixApplied',
                data: { success: false, error: error.message }
            });
            vscode.window.showErrorMessage(`Failed to apply fix: ${error.message}`);
        }
    }

    private async _handleUpdateConfig(key: string, value: any) {
        console.log(`[RCA Backend] Updating config: ${key} = ${value}`);
        const config = vscode.workspace.getConfiguration('rcaAgent');
        await config.update(key, value, vscode.ConfigurationTarget.Global);
        this._sendMessage({
            command: 'configUpdated',
            data: { key, value }
        });
        console.log(`[RCA Backend] Config updated successfully: ${key}`);
    }

    private async _handleCheckOllamaStatus() {
        console.log('[RCA Backend] Checking Ollama status...');
        try {
            const config = vscode.workspace.getConfiguration('rcaAgent');
            const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
            const model = config.get<string>('model', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');

            const startTime = Date.now();
            const result = await this.networkTimeoutHandler.checkOllamaConnection(ollamaUrl);
            const responseTime = result.duration;

            const statusMessage = {
                command: 'ollamaStatus',
                status: result.success && result.data ? {
                    connected: true,
                    model: model,
                    responseTime: Math.round(responseTime)
                } : {
                    connected: false,
                    error: result.error?.message || 'Connection failed'
                }
            };

            console.log('[RCA Backend] Ollama status result:', statusMessage);
            this._sendMessage(statusMessage);
        } catch (error: any) {
            const errorMessage = {
                command: 'ollamaStatus',
                status: {
                    connected: false,
                    error: error.message || 'Unknown error'
                }
            };
            console.error('[RCA Backend] Ollama status check error:', errorMessage);
            this._sendMessage(errorMessage);
        }
    }

    private _handleNavigate(route: string) {
        // Store current route in global state for persistence
        this._sendMessage({
            command: 'routeChanged',
            data: { route }
        });
    }

    private async _handleCancelAnalysis() {
        try {
            // Stop the analysis service
            this.analysisService.stopAnalysis();

            // Notify the webview that analysis was cancelled
            this._sendMessage({
                command: 'analysisCancelled',
                message: 'Analysis cancelled by user'
            });

            vscode.window.showInformationMessage('Analysis cancelled');
        } catch (error: any) {
            console.error('Failed to cancel analysis:', error);
            vscode.window.showErrorMessage('Failed to cancel analysis: ' + error.message);
        }
    }

    // ============================================================================
    // Dashboard Handlers
    // ============================================================================

    private async _handleGetDashboardData() {
        try {
            const history = this.stateManager.getHistory(10);
            const errorCount = this.errorQueueManager.getErrorCount();

            // Calculate stats from history
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayAnalyses = history.filter(h =>
                new Date(h.timestamp).getTime() >= today.getTime()
            );

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
                    averageTime: Math.round(avgTime / 1000) // Convert ms to seconds
                },
                activity: history.slice(0, 5).map(h => ({
                    id: h.id,
                    type: h.result.confidence && h.result.confidence > 0.7 ? 'success' : 'error',
                    message: h.error.message.substring(0, 100),
                    errorMessage: h.error.type,
                    timestamp: h.timestamp
                }))
            });
        } catch (error: any) {
            console.error('Failed to get dashboard data:', error);
        }
    }

    private async _handleAnalyzeAllErrors() {
        try {
            const errors = this.errorQueueManager.getAllErrors();
            const pendingErrors = errors.filter(e => e.status === 'pending');

            vscode.window.showInformationMessage(
                `Starting analysis for ${pendingErrors.length} pending errors...`
            );

            // Analyze each error sequentially
            for (const error of pendingErrors) {
                await this._handleAnalyzeError(error);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to analyze all errors: ${error.message}`);
        }
    }

    private async _handleScanWorkspace() {
        try {
            vscode.window.showInformationMessage('Scanning workspace for errors...');

            // Perform error detection
            await this.errorQueueManager.detectErrors();

            // Refresh the error queue display
            await this._handleRefreshErrorQueue();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to scan workspace: ${error.message}`);
        }
    }

    private async _handleOpenSettings() {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'rcaAgent');
    }

    // ============================================================================
    // Error Queue Handlers
    // ============================================================================

    private async _handleGetErrorQueue() {
        try {
            const errors = this.errorQueueManager.getAllErrors();
            console.log(`[RCAWebviewProvider] Sending errorQueueData with ${errors.length} errors to webview`);
            console.log(`[RCAWebviewProvider] Sample errors:`, errors.slice(0, 2).map(e => ({ id: e.id, message: e.message.substring(0, 30), file: e.filePath })));
            this._sendMessage({
                command: 'errorQueueData',
                errors: errors
            });
        } catch (error: any) {
            console.error('[RCAWebviewProvider] Failed to get error queue:', error);
        }
    }

    private async _handleRefreshErrorQueue() {
        try {
            // Re-scan diagnostics
            const errors = this.errorQueueManager.getAllErrors();
            this._sendMessage({
                command: 'errorQueueData',
                errors: errors
            });
        } catch (error: any) {
            console.error('Failed to refresh error queue:', error);
        }
    }

    private async _handleRemoveError(errorId: string) {
        try {
            this.stateManager.removeError(errorId);
            this._sendMessage({
                command: 'errorRemoved',
                errorId: errorId
            });
        } catch (error: any) {
            console.error('Failed to remove error:', error);
        }
    }

    private async _handlePinError(errorId: string) {
        try {
            this.errorQueueManager.pinError(errorId);
            const errors = this.errorQueueManager.getAllErrors();
            const error = errors.find(e => e.id === errorId);
            if (error) {
                this._sendMessage({
                    command: 'errorUpdated',
                    error: error
                });
            }
        } catch (error: any) {
            console.error('Failed to pin error:', error);
        }
    }

    private async _handleUnpinError(errorId: string) {
        try {
            this.errorQueueManager.unpinError(errorId);
            const errors = this.errorQueueManager.getAllErrors();
            const error = errors.find(e => e.id === errorId);
            if (error) {
                this._sendMessage({
                    command: 'errorUpdated',
                    error: error
                });
            }
        } catch (error: any) {
            console.error('Failed to unpin error:', error);
        }
    }

    private async _handleAnalyzeMultipleErrors(errorIds: string[]) {
        try {
            const errors = this.errorQueueManager.getAllErrors();
            const selectedErrors = errors.filter(e => errorIds.includes(e.id));

            vscode.window.showInformationMessage(
                `Starting analysis for ${selectedErrors.length} errors...`
            );

            // Analyze each error sequentially
            for (const error of selectedErrors) {
                await this._handleAnalyzeError(error);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to analyze errors: ${error.message}`);
        }
    }

    private async _handleClearCompletedErrors() {
        try {
            await this.errorQueueManager.clearCompleted();
            await this._handleRefreshErrorQueue();
            vscode.window.showInformationMessage('Cleared completed errors');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to clear completed errors: ${error.message}`);
        }
    }

    private async _handleClearAllErrors() {
        try {
            await this.errorQueueManager.clearQueue();
            await this._handleRefreshErrorQueue();
            vscode.window.showInformationMessage('Cleared all errors');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to clear errors: ${error.message}`);
        }
    }

    private async _handleOpenErrorLocation(errorId: string) {
        // Use existing ErrorQueueManager method which handles file resolution
        await this.errorQueueManager.openErrorLocation(errorId);
    }

    // ============================================================================
    // Analysis Handlers
    // ============================================================================

    private async _handleStartAnalysis(errorId: string, settings: any) {
        try {
            const errors = this.errorQueueManager.getAllErrors();
            const error = errors.find(e => e.id === errorId);

            if (!error) {
                throw new Error('Error not found in queue');
            }

            await this._handleAnalyzeError(error);
        } catch (error: any) {
            this._sendMessage({
                command: 'analysisError',
                data: { message: error.message }
            });
        }
    }

    private async _handleStartManualAnalysis(errorText: string, settings: any) {
        try {
            const errorData = JSON.parse(errorText);
            const error = {
                id: `manual-${Date.now()}`,
                message: errorData.message,
                filePath: errorData.filePath || 'unknown',
                line: errorData.line || 0,
                type: 'runtime',
                status: 'pending',
                timestamp: Date.now(),
                ...errorData
            };

            await this._handleAnalyzeError(error);
        } catch (error: any) {
            this._sendMessage({
                command: 'analysisError',
                data: { message: error.message }
            });
        }
    }

    private async _handleExportResult(result: any) {
        try {
            const fileName = `rca-analysis-${Date.now()}.json`;
            const content = JSON.stringify(result, null, 2);

            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: { 'JSON': ['json'] }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
                vscode.window.showInformationMessage('Analysis result exported successfully!');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to export result: ${error.message}`);
        }
    }

    // ============================================================================
    // State Change Handlers
    // ============================================================================

    private _handleErrorQueueChanged() {
        // Notify webview of queue changes
        const errorCount = this.errorQueueManager.getErrorCount();
        console.log(`[RCAWebviewProvider] Error queue changed, sending ${errorCount} errors to webview`);
        this._handleGetErrorQueue();
        this._handleGetDashboardData();
    }

    private _handleStateChanged() {
        // Notify webview of state changes
        this._handleGetDashboardData();
    }

    // ============================================================================
    // Phase 3: History View Handlers
    // ============================================================================

    private async _handleGetHistory(limit?: number) {
        try {
            const history = this.stateManager.getHistory(limit || 100);
            this._sendMessage({
                command: 'historyData',
                history: this._normalizeHistoryForWebview(history)
            });
        } catch (error: any) {
            console.error('Failed to get history:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to get history: ${error.message}`
            });
        }
    }

    private async _handleSearchHistory(query: string) {
        try {
            const results = this.stateManager.searchHistory(query);
            this._sendMessage({
                command: 'searchHistoryResults',
                results: this._normalizeHistoryForWebview(results)
            });
        } catch (error: any) {
            console.error('Failed to search history:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to search history: ${error.message}`
            });
        }
    }

    private _normalizeHistoryForWebview(history: any[]): any[] {
        return (history || []).map((item: any) => {
            const confidence = item?.result?.confidence;
            const success = typeof item?.success === 'boolean'
                ? item.success
                : typeof confidence === 'number'
                    ? confidence > 0.7
                    : true;

            return {
                id: item.id,
                timestamp: item.timestamp,
                error: {
                    message: item?.error?.message,
                    filePath: item?.error?.filePath,
                    line: item?.error?.line,
                    stackTrace: item?.error?.stackTrace
                },
                result: {
                    rootCause: item?.result?.rootCause,
                    confidence: item?.result?.confidence,
                    fixes: item?.result?.fixes,
                    analysis: item?.result?.analysis,
                    feedback: item?.result?.feedback
                },
                duration: item?.duration,
                success
            };
        });
    }

    private async _handleReanalyzeFromHistory(historyId: string) {
        try {
            const history = this.stateManager.getHistory();
            const item = history.find(h => h.id === historyId);

            if (!item) {
                throw new Error('History item not found');
            }

            vscode.window.showInformationMessage(`Re-analyzing error: ${item.error.message.substring(0, 50)}...`);

            // Re-analyze the error
            await this._handleAnalyzeError(item.error);
        } catch (error: any) {
            console.error('Failed to re-analyze from history:', error);
            vscode.window.showErrorMessage(`Failed to re-analyze: ${error.message}`);
        }
    }

    private async _handleDeleteHistoryItem(historyId: string) {
        try {
            this.stateManager.removeFromHistory(historyId);
            this._sendMessage({
                command: 'historyItemDeleted',
                id: historyId
            });
        } catch (error: any) {
            console.error('Failed to delete history item:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to delete history item: ${error.message}`
            });
        }
    }

    private async _handleClearHistory() {
        try {
            this.stateManager.clearHistory();
            this._sendMessage({
                command: 'historyCleared'
            });
            vscode.window.showInformationMessage('History cleared successfully');
        } catch (error: any) {
            console.error('Failed to clear history:', error);
            vscode.window.showErrorMessage(`Failed to clear history: ${error.message}`);
        }
    }

    private async _handleExportHistoryItem(historyId: string) {
        try {
            const history = this.stateManager.getHistory();
            const item = history.find(h => h.id === historyId);

            if (!item) {
                throw new Error('History item not found');
            }

            const markdown = this._generateHistoryMarkdown(item);
            const fileName = `rca-history-${historyId}-${Date.now()}.md`;

            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: { 'Markdown': ['md'] }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown));
                vscode.window.showInformationMessage('History item exported successfully!');
            }
        } catch (error: any) {
            console.error('Failed to export history item:', error);
            vscode.window.showErrorMessage(`Failed to export: ${error.message}`);
        }
    }

    private async _handleExportAllHistory() {
        try {
            const history = this.stateManager.getHistory();
            const markdown = this._generateAllHistoryMarkdown(history);
            const fileName = `rca-history-all-${Date.now()}.md`;

            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: { 'Markdown': ['md'] }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown));
                vscode.window.showInformationMessage('History exported successfully!');
            }
        } catch (error: any) {
            console.error('Failed to export history:', error);
            vscode.window.showErrorMessage(`Failed to export: ${error.message}`);
        }
    }

    private async _handleRefreshHistory() {
        await this._handleGetHistory();
    }

    // ============================================================================
    // Phase 3: Agent State View Handlers
    // ============================================================================

    private agentStateSubscription: vscode.Disposable | null = null;

    private async _handleSubscribeAgentState() {
        try {
            const stateStream = this.analysisService.getStateStream();

            if (!stateStream) {
                this._sendMessage({
                    command: 'agentStateUpdate',
                    state: null
                });
                return;
            }

            // Send current state immediately
            this._sendMessage({
                command: 'agentStateUpdate',
                state: this.analysisService.getCurrentState()
            });

            // Subscribe to state updates
            stateStream.on('iteration', (data: any) => {
                this._sendMessage({
                    command: 'agentIterationUpdate',
                    iteration: data.iteration,
                    maxIterations: data.maxIterations,
                    progress: data.progress
                });
            });

            stateStream.on('thought', (thought: string) => {
                this._sendMessage({
                    command: 'agentThoughtUpdate',
                    thought: thought
                });
            });

            stateStream.on('action', (data: any) => {
                this._sendMessage({
                    command: 'agentActionUpdate',
                    tool: data.tool,
                    params: data.params,
                    timestamp: Date.now()
                });
            });

            stateStream.on('observation', (data: any) => {
                this._sendMessage({
                    command: 'agentObservationUpdate',
                    result: data.result,
                    tool: data.tool,
                    isFinal: data.isFinal
                });
            });

            stateStream.on('hypothesis', (data: any) => {
                this._sendMessage({
                    command: 'agentHypothesisUpdate',
                    hypothesis: data.hypothesis,
                    confidence: data.confidence
                });
            });

            stateStream.on('phase', (phase: string) => {
                this._sendMessage({
                    command: 'agentPhaseUpdate',
                    phase: phase
                });
            });

            stateStream.on('complete', () => {
                this._sendMessage({
                    command: 'agentComplete'
                });
            });

            stateStream.on('error', (error: any) => {
                this._sendMessage({
                    command: 'agentError',
                    error: error.message
                });
            });

        } catch (error: any) {
            console.error('Failed to subscribe to agent state:', error);
        }
    }

    private async _handleUnsubscribeAgentState() {
        if (this.agentStateSubscription) {
            this.agentStateSubscription.dispose();
            this.agentStateSubscription = null;
        }
    }

    private async _handleGetToolMetrics() {
        try {
            // Tool metrics would come from PerformanceTracker if available
            // For now, send empty data
            this._sendMessage({
                command: 'toolMetricsData',
                metrics: []
            });
        } catch (error: any) {
            console.error('Failed to get tool metrics:', error);
        }
    }

    // ============================================================================
    // Phase 3: Fix Manager View Handlers
    // ============================================================================

    private async _handleGetPendingFixes() {
        try {
            const fixes = this.fixApplicationService.getPendingFixes();
            this._sendMessage({
                command: 'pendingFixesData',
                fixes: fixes
            });
        } catch (error: any) {
            console.error('Failed to get pending fixes:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to get pending fixes: ${error.message}`
            });
        }
    }

    private async _handleGetAppliedFixes() {
        try {
            const fixes = this.fixApplicationService.getAppliedFixes();
            this._sendMessage({
                command: 'appliedFixesData',
                fixes: fixes
            });
        } catch (error: any) {
            console.error('Failed to get applied fixes:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to get applied fixes: ${error.message}`
            });
        }
    }

    private async _handlePreviewFix(fixId: string) {
        try {
            const diff = await this.fixApplicationService.previewFix(fixId);
            if (!diff) {
                this._sendMessage({
                    command: 'error',
                    message: 'Unable to generate diff preview'
                });
                return;
            }
            this._sendMessage({
                command: 'diffPreviewData',
                diff: diff
            });
        } catch (error: any) {
            console.error('Failed to preview fix:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to preview fix: ${error.message}`
            });
        }
    }

    private async _handleApplyFixById(fixId: string) {
        try {
            const result = await this.fixApplicationService.applyFixById(fixId);

            if (result.success) {
                this._sendMessage({
                    command: 'fixApplied',
                    fixId: fixId,
                    id: result.id,
                    file: result.file
                });
                vscode.window.showInformationMessage(`Fix applied successfully to ${result.file}`);
            } else {
                this._sendMessage({
                    command: 'fixApplyError',
                    fixId: fixId,
                    error: result.error || 'Unknown error'
                });
                vscode.window.showErrorMessage(`Failed to apply fix: ${result.error}`);
            }
        } catch (error: any) {
            console.error('Failed to apply fix:', error);
            this._sendMessage({
                command: 'fixApplyError',
                fixId: fixId,
                error: error.message
            });
            vscode.window.showErrorMessage(`Failed to apply fix: ${error.message}`);
        }
    }

    private async _handleRejectFix(fixId: string) {
        try {
            await this.fixApplicationService.rejectFix(fixId);
            this._sendMessage({
                command: 'fixRejected',
                fixId: fixId
            });
        } catch (error: any) {
            console.error('Failed to reject fix:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to reject fix: ${error.message}`
            });
        }
    }

    private async _handleApplyMultipleFixes(fixIds: string[]) {
        try {
            let successCount = 0;
            let failCount = 0;

            for (const fixId of fixIds) {
                try {
                    const result = await this.fixApplicationService.applyFixById(fixId);
                    if (result.success) {
                        successCount++;
                        this._sendMessage({
                            command: 'fixApplied',
                            fixId: fixId,
                            id: result.id,
                            file: result.file
                        });
                    } else {
                        failCount++;
                        this._sendMessage({
                            command: 'fixApplyError',
                            fixId: fixId,
                            error: result.error || 'Unknown error'
                        });
                    }
                } catch (error: any) {
                    failCount++;
                    this._sendMessage({
                        command: 'fixApplyError',
                        fixId: fixId,
                        error: error.message
                    });
                }
            }

            vscode.window.showInformationMessage(
                `Applied ${successCount} fixes successfully. ${failCount} failed.`
            );
        } catch (error: any) {
            console.error('Failed to apply multiple fixes:', error);
            vscode.window.showErrorMessage(`Failed to apply fixes: ${error.message}`);
        }
    }

    private async _handleRejectMultipleFixes(fixIds: string[]) {
        try {
            for (const fixId of fixIds) {
                await this.fixApplicationService.rejectFix(fixId);
                this._sendMessage({
                    command: 'fixRejected',
                    fixId: fixId
                });
            }
            vscode.window.showInformationMessage(`Rejected ${fixIds.length} fixes`);
        } catch (error: any) {
            console.error('Failed to reject multiple fixes:', error);
            vscode.window.showErrorMessage(`Failed to reject fixes: ${error.message}`);
        }
    }

    private async _handleClearAppliedFixes() {
        try {
            await this.fixApplicationService.clearAppliedFixes();
            this._sendMessage({
                command: 'fixesCleared'
            });
            vscode.window.showInformationMessage('Applied fixes history cleared');
        } catch (error: any) {
            console.error('Failed to clear applied fixes:', error);
            vscode.window.showErrorMessage(`Failed to clear fixes: ${error.message}`);
        }
    }

    // ============================================================================
    // Phase 3: Metrics View Handlers
    // ============================================================================

    private async _handleGetMetrics(timeRange: string = '7d') {
        try {
            const history = this.stateManager.getHistory();
            const timeRangeMs = this._getTimeRangeMs(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;

            // Filter history by time range
            const filteredHistory = timeRange === 'all'
                ? history
                : history.filter(h => h.timestamp >= cutoffTime);

            // Calculate metrics
            const totalAnalyses = filteredHistory.length;
            const successfulAnalyses = filteredHistory.filter(h =>
                h.result?.confidence && h.result.confidence > 0.7
            ).length;
            const failedAnalyses = totalAnalyses - successfulAnalyses;

            const avgConfidence = totalAnalyses > 0
                ? filteredHistory.reduce((sum, h) => sum + (h.result?.confidence || 0), 0) / totalAnalyses
                : 0;

            const avgTime = totalAnalyses > 0
                ? filteredHistory.reduce((sum, h) => sum + h.duration, 0) / totalAnalyses
                : 0;

            const totalTime = filteredHistory.reduce((sum, h) => sum + h.duration, 0);

            // Calculate detailed metrics matching frontend expectations
            const successRateByDay = this._calculateSuccessRateByDay(filteredHistory);
            const analysisTimeByDay = this._calculateAnalysisTimeByDay(filteredHistory);
            const errorTypesData = this._calculateErrorTypesDetailed(filteredHistory);

            this._sendMessage({
                command: 'metricsData',
                metrics: {
                    successRate: {
                        overall: totalAnalyses > 0 ? successfulAnalyses / totalAnalyses : 0,
                        byDay: successRateByDay
                    },
                    analysisTime: {
                        average: avgTime,
                        median: this._calculateMedian(filteredHistory.map(h => h.duration)),
                        byDay: analysisTimeByDay
                    },
                    errorTypes: errorTypesData,
                    modelPerformance: {
                        model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
                        totalAnalyses,
                        successRate: totalAnalyses > 0 ? successfulAnalyses / totalAnalyses : 0,
                        avgTime,
                        avgConfidence
                    },
                    learningMetrics: {
                        totalLearnings: filteredHistory.length,
                        cacheHitRate: this.analysisService.getCacheStats().hitRate,
                        avgConfidenceImprovement: this._calculateConfidenceImprovement(filteredHistory)
                    }
                }
            });
        } catch (error: any) {
            console.error('Failed to get metrics:', error);
            this._sendMessage({
                command: 'error',
                message: `Failed to get metrics: ${error.message}`
            });
        }
    }

    private async _handleExportMetrics(timeRange: string = '7d') {
        try {
            const history = this.stateManager.getHistory();
            const timeRangeMs = this._getTimeRangeMs(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;

            const filteredHistory = timeRange === 'all'
                ? history
                : history.filter(h => h.timestamp >= cutoffTime);

            const markdown = this._generateMetricsMarkdown(filteredHistory, timeRange);
            const fileName = `rca-metrics-${timeRange}-${Date.now()}.md`;

            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: { 'Markdown': ['md'] }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown));
                vscode.window.showInformationMessage('Metrics exported successfully!');
            }
        } catch (error: any) {
            console.error('Failed to export metrics:', error);
            vscode.window.showErrorMessage(`Failed to export metrics: ${error.message}`);
        }
    }

    // ============================================================================
    // Helper Functions
    // ============================================================================

    private _generateHistoryMarkdown(item: any): string {
        return `# RCA Analysis Report

**ID**: ${item.id}
**Timestamp**: ${new Date(item.timestamp).toLocaleString()}
**Status**: ${item.error.status}
**Duration**: ${Math.round(item.duration / 1000)}s
**Confidence**: ${((item.result?.confidence || 0) * 100).toFixed(1)}%

## Error Details

**File**: ${item.error.filePath}:${item.error.line}
**Type**: ${item.error.type}
**Message**: 
\`\`\`
${item.error.message}
\`\`\`

## Root Cause Analysis

${item.result?.rootCause || 'No root cause identified'}

## Fix Suggestion

${item.result?.fixSuggestion ? '```\n' + item.result.fixSuggestion + '\n```' : 'No fix suggested'}

## Additional Context

${item.result?.context || 'N/A'}

---
*Generated by RCA Agent on ${new Date().toLocaleString()}*
`;
    }

    private _generateAllHistoryMarkdown(history: any[]): string {
        let markdown = `# RCA Analysis History\n\n`;
        markdown += `**Total Analyses**: ${history.length}\n`;
        markdown += `**Export Date**: ${new Date().toLocaleString()}\n\n`;
        markdown += `---\n\n`;

        for (const item of history) {
            markdown += `## Analysis: ${item.id}\n\n`;
            markdown += `- **Date**: ${new Date(item.timestamp).toLocaleString()}\n`;
            markdown += `- **File**: ${item.error.filePath}:${item.error.line}\n`;
            markdown += `- **Error**: ${item.error.message.substring(0, 100)}...\n`;
            markdown += `- **Confidence**: ${((item.result?.confidence || 0) * 100).toFixed(1)}%\n`;
            markdown += `- **Duration**: ${Math.round(item.duration / 1000)}s\n\n`;
            markdown += `---\n\n`;
        }

        markdown += `\n*Generated by RCA Agent*\n`;
        return markdown;
    }

    private _generateMetricsMarkdown(history: any[], timeRange: string): string {
        const totalAnalyses = history.length;
        const successfulAnalyses = history.filter(h =>
            h.result?.confidence && h.result.confidence > 0.7
        ).length;
        const failedAnalyses = totalAnalyses - successfulAnalyses;

        const avgConfidence = totalAnalyses > 0
            ? history.reduce((sum, h) => sum + (h.result?.confidence || 0), 0) / totalAnalyses
            : 0;

        const avgTime = totalAnalyses > 0
            ? history.reduce((sum, h) => sum + h.duration, 0) / totalAnalyses
            : 0;

        return `# RCA Metrics Report

**Time Range**: ${timeRange}
**Export Date**: ${new Date().toLocaleString()}

## Summary

- **Total Analyses**: ${totalAnalyses}
- **Successful**: ${successfulAnalyses} (${((successfulAnalyses / totalAnalyses) * 100).toFixed(1)}%)
- **Failed**: ${failedAnalyses} (${((failedAnalyses / totalAnalyses) * 100).toFixed(1)}%)
- **Average Confidence**: ${(avgConfidence * 100).toFixed(1)}%
- **Average Time**: ${Math.round(avgTime / 1000)}s

## Analysis Details

${history.map(h => `- ${new Date(h.timestamp).toLocaleString()}: ${h.error.message.substring(0, 80)}... (${((h.result?.confidence || 0) * 100).toFixed(1)}%)`).join('\n')}

---
*Generated by RCA Agent*
`;
    }

    private _getTimeRangeMs(range: string): number {
        switch (range) {
            case '7d': return 7 * 24 * 60 * 60 * 1000;
            case '30d': return 30 * 24 * 60 * 60 * 1000;
            case 'all': return Number.MAX_SAFE_INTEGER;
            default: return 7 * 24 * 60 * 60 * 1000;
        }
    }

    private _calculateConfidenceImprovement(history: any[]): number {
        if (history.length < 2) {
            return 0;
        }

        // Calculate average confidence for first half vs second half
        const midpoint = Math.floor(history.length / 2);
        const firstHalf = history.slice(0, midpoint);
        const secondHalf = history.slice(midpoint);

        const avgFirst = firstHalf.reduce((sum, h) => sum + (h.result?.confidence || 0), 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, h) => sum + (h.result?.confidence || 0), 0) / secondHalf.length;

        return avgSecond - avgFirst;
    }

    private _calculateSuccessRateByDay(history: any[]): Array<{ date: string; success: number; failed: number; rate: number }> {
        // Group by day and calculate success rate
        const dailyStats = new Map<string, { success: number; failed: number }>();

        for (const item of history) {
            const date = new Date(item.timestamp).toISOString().split('T')[0];
            if (!dailyStats.has(date)) {
                dailyStats.set(date, { success: 0, failed: 0 });
            }
            const stats = dailyStats.get(date)!;
            if (item.result?.confidence && item.result.confidence > 0.7) {
                stats.success++;
            } else {
                stats.failed++;
            }
        }

        return Array.from(dailyStats.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, stats]) => ({
                date,
                success: stats.success,
                failed: stats.failed,
                rate: stats.success / (stats.success + stats.failed)
            }));
    }

    private _calculateAnalysisTimeByDay(history: any[]): Array<{ date: string; avgTime: number }> {
        // Group by day and calculate average analysis time
        const dailyTimes = new Map<string, number[]>();

        for (const item of history) {
            const date = new Date(item.timestamp).toISOString().split('T')[0];
            if (!dailyTimes.has(date)) {
                dailyTimes.set(date, []);
            }
            dailyTimes.get(date)!.push(item.duration);
        }

        return Array.from(dailyTimes.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, times]) => ({
                date,
                avgTime: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
            }));
    }

    private _calculateErrorTypesDetailed(history: any[]): Array<{ type: string; count: number; successRate: number }> {
        const typeStats = new Map<string, { count: number; successful: number }>();

        for (const item of history) {
            const type = item.error?.type || 'unknown';
            if (!typeStats.has(type)) {
                typeStats.set(type, { count: 0, successful: 0 });
            }
            const stats = typeStats.get(type)!;
            stats.count++;
            if (item.result?.confidence && item.result.confidence > 0.7) {
                stats.successful++;
            }
        }

        return Array.from(typeStats.entries())
            .map(([type, stats]) => ({
                type,
                count: stats.count,
                successRate: stats.count > 0 ? stats.successful / stats.count : 0
            }))
            .sort((a, b) => b.count - a.count);
    }

    private _calculateMedian(values: number[]): number {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    // Legacy methods for backward compatibility (kept but unused)
    private _calculateSuccessRate(history: any[]): any {
        const byDay = this._calculateSuccessRateByDay(history);
        return {
            labels: byDay.map(d => d.date),
            data: byDay.map(d => d.rate * 100)
        };
    }

    private _calculateAnalysisTime(history: any[]): any {
        const byDay = this._calculateAnalysisTimeByDay(history);
        return {
            labels: byDay.map(d => d.date),
            data: byDay.map(d => Math.round(d.avgTime / 1000))
        };
    }

    private _calculateErrorTypes(history: any[]): any[] {
        return this._calculateErrorTypesDetailed(history).map(item => ({
            type: item.type,
            count: item.count,
            percentage: (item.count / history.length) * 100
        }));
    }

    private _sendInitialState() {
        const config = vscode.workspace.getConfiguration('rcaAgent');
        const initData = {
            command: 'init',
            data: {
                config: {
                    model: config.get('model', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest'),
                    ollamaUrl: config.get('ollamaUrl', 'http://localhost:11434'),
                    theme: vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light',
                    educationalMode: config.get('educationalMode', false),
                    realtimeDetection: config.get('realtimeDetection', false)
                }
            }
        };
        console.log('[RCA Backend] Sending initial state:', initData);
        this._sendMessage(initData);
    }

    private _sendMessage(message: any) {
        if (this._view) {
            console.log('[RCAWebviewProvider] Sending message to webview:', message.command, message);
            this._view.webview.postMessage(message);
        } else {
            console.warn('[RCAWebviewProvider] Cannot send message - webview not available:', message.command);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const fs = require('fs');
        const webviewPath = path.join(this._extensionUri.fsPath, 'webview', 'dist');
        const indexPath = path.join(webviewPath, 'index.html');

        // Read the built index.html
        let html = fs.readFileSync(indexPath, 'utf8');

        // Add cache-busting timestamp
        const timestamp = Date.now();

        // Replace asset paths with webview URIs
        html = html.replace(
            /href="\/assets\/(.*?)"/g,
            (match: string, filename: string) => {
                const assetUri = webview.asWebviewUri(
                    vscode.Uri.file(path.join(webviewPath, 'assets', filename))
                );
                return `href="${assetUri}?v=${timestamp}"`;
            }
        );

        html = html.replace(
            /src="\/assets\/(.*?)"/g,
            (match: string, filename: string) => {
                const assetUri = webview.asWebviewUri(
                    vscode.Uri.file(path.join(webviewPath, 'assets', filename))
                );
                return `src="${assetUri}?v=${timestamp}"`;
            }
        );

        // Update CSP
        const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; img-src ${webview.cspSource} https:;`;
        html = html.replace(
            /<meta charset="UTF-8" \/>/,
            `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}">`
        );

        return html;
    }

    /**
     * Normalize backend RCAResult to webview-compatible format
     * Ensures all expected properties exist to avoid runtime errors
     */
    private _normalizeResultForWebview(result: import('../../../src/types').RCAResult): any {
        const rcaId = (result as any).rcaId as string | undefined;
        const errorHash = (result as any).errorHash as string | undefined;

        return {
            ...result,
            // Map fixGuidelines to fixes array if not already present
            fixes: result.codeFix ? [{
                id: 'fix-1',
                filePath: result.codeFix.filePath,
                description: result.codeFix.explanation || 'Apply suggested fix',
                diff: result.codeFix.diff || '',
                confidence: result.confidence
            }] : [],
            // Extract hypothesis from rootCause if not present
            hypothesis: result.rootCause || 'No hypothesis available',
            // Map fixGuidelines to reasoning steps if not present
            reasoning: result.fixGuidelines || [],
            // Feedback metadata for UI
            feedback: {
                enabled: !!rcaId,
                rcaId,
                errorHash
            }
        };
    }
}
