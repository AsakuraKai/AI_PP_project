/**
 * Type definitions for RCA Agent Panel UI
 * Chunk 1: Foundation & Activity Bar
 * Chunk 6: Consolidated with shared agent types
 */

/**
 * Agent state for progress tracking
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
  averageLatency: number;
  topErrorTypes: Array<{ type: string; count: number }>;
  improvementTrend: number;
  cacheHitRate: number;
  lastUpdated: number;
}

/**
 * Represents an error item in the error queue
 */
export interface ErrorItem {
  /** Unique identifier for the error */
  id: string;
  
  /** Error message text */
  message: string;
  
  /** Absolute path to the file containing the error */
  filePath: string;
  
  /** Line number where the error occurs (1-indexed) */
  line: number;
  
  /** Column number where the error occurs (1-indexed, optional) */
  column?: number;
  
  /** Severity level of the error */
  severity: 'critical' | 'high' | 'medium';
  
  /** Current status of the error analysis */
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  
  /** Timestamp when the error was added (Unix timestamp) */
  timestamp: number;
  
  /** Optional raw error text for context */
  rawText?: string;
  
  /** Optional error type (e.g., 'kotlin_npe', 'gradle_conflict') */
  errorType?: string;
  
  /** Optional source of the diagnostic (e.g., 'typescript', 'eslint') */
  source?: string;
  
  /** Optional analysis result from RCA */
  analysisResult?: {
    explanation: string;
    confidence: number;
    fixGuidelines: string[];
  };
}

/**
 * Represents an analysis result in the history
 */
export interface HistoryItem {
  /** Unique identifier for the history entry */
  id: string;
  
  /** Timestamp when the analysis was performed */
  timestamp: number;
  
  /** ID of the error that was analyzed */
  errorId: string;
  
  /** The analysis result */
  result: RCAResult;
  
  /** Duration of the analysis in milliseconds */
  duration: number;
  
  /** Whether the user marked this as helpful */
  helpful?: boolean;
  
  /** Optional user feedback */
  feedback?: string;
  
  /** Confidence score (for metrics) */
  confidence?: number;
  
  /** Latency in milliseconds (for metrics) */
  latency?: number;
  
  /** Error type (for metrics) */
  errorType?: string;
}

/**
 * Represents the result of an RCA analysis
 */
export interface RCAResult {
  /** Root cause explanation */
  rootCause: string;
  
  /** Code context around the error */
  codeContext?: string;
  
  /** Fix guidelines/suggestions */
  fixGuidelines: string[];
  
  /** Confidence score (0-100) */
  confidence: number;
  
  /** Number of iterations performed */
  iterations: number;
  
  /** Tools used during analysis */
  toolsUsed: string[];
  
  /** Educational explanation (if educational mode enabled) */
  educationalExplanation?: string;
  
  /** Performance metrics (if enabled) */
  performanceMetrics?: {
    totalTime: number;
    llmCalls: number;
    toolCalls: number;
  };
  
  /** Latency in milliseconds */
  latency?: number;
  
  /** Documentation search results */
  docResults?: any[];
  
  /** Error information (for webview display) */
  error?: string;
  
  /** File path where error occurred */
  filePath?: string;
  
  /** Line number where error occurred */
  line?: number;
  
  /** Code snippet with error */
  codeSnippet?: string;
}

/**
 * Represents the state of the panel
 */
export interface PanelState {
  /** Current view state */
  view: 'empty' | 'active' | 'complete' | 'error' | 'analyzing';
  
  /** Currently analyzing error (if any) */
  currentError?: ErrorItem;
  
  /** Current analysis progress (if analyzing) - uses shared AgentState type */
  currentProgress?: AgentState;
  
  /** Current analysis result (if complete) */
  currentResult?: RCAResult;
  
  /** Error message (if error state) */
  errorMessage?: string;
  
  /** List of errors in the queue */
  errorQueue: ErrorItem[];
  
  /** Recent history items */
  history: HistoryItem[];
  
  /** Result (for backward compatibility) */
  result?: RCAResult;
  
  /** Progress (for backward compatibility) */
  progress?: number;
  
  /** Current thought (for progress display) */
  currentThought?: string;
  
  /** Current iteration (for progress display) */
  currentIteration?: number;
  
  /** Max iterations (for progress display) */
  maxIterations?: number;
  
  /** Error type (for error states) */
  errorType?: string;
  
  /** Ollama URL (for configuration) */
  ollamaUrl?: string;
  
  /** Model name (for configuration) */
  modelName?: string;
  
  /** Tools used (for progress display) */
  toolsUsed?: string[];
  
  /** Elapsed time (for progress display) */
  elapsed?: number;
}

/**
 * Settings/configuration for the RCA Agent panel
 */
export interface PanelSettings {
  /** Enable educational mode */
  educationalMode: boolean;
  
  /** Show performance metrics */
  showPerformanceMetrics: boolean;
  
  /** Show confidence bars */
  showConfidenceBars: boolean;
  
  /** Enable syntax highlighting */
  syntaxHighlighting: boolean;
  
  /** Auto-detect errors in workspace */
  autoDetectErrors: boolean;
  
  /** Auto-save results to history */
  autoSaveResults: boolean;
  
  /** Show desktop notifications */
  desktopNotifications: boolean;
  
  /** Keep panel open after analysis */
  keepPanelOpen: boolean;
  
  /** Maximum iterations for analysis */
  maxIterations: number;
  
  /** Analysis mode */
  analysisMode: 'fast' | 'standard' | 'deep';
  
  /** Ollama model name */
  modelName: string;
  
  /** Ollama server URL */
  ollamaUrl: string;
  
  /** Analysis timeout in seconds */
  timeoutSeconds: number;
}

/**
 * Message types for webview communication
 */
export type WebviewMessage =
  | { type: 'analyze'; errorId?: string }
  | { type: 'analyzeNew' }
  | { type: 'analyzeAll' }
  | { type: 'stop' }
  | { type: 'refresh' }
  | { type: 'removeError'; errorId: string }
  | { type: 'reanalyze'; historyId: string }
  | { type: 'feedback'; value?: any; historyId?: string; helpful?: boolean; feedback?: string }
  | { type: 'copy'; fixIndex: string }
  | { type: 'searchSimilar'; query: string }
  | { type: 'runValidationTests' }
  | { type: 'previewFix'; fixIndex: number }
  | { type: 'applyFixIndex'; fixIndex: number }
  | { type: 'applyAllFixes' }
  | { type: 'copyFix'; fixText: string }
  | { type: 'applyFix'; fixText: string; filePath: string; line: number }
  | { type: 'viewFile'; filePath: string; line: number }
  | { type: 'openExternal'; url: string }
  | { type: 'updateSettings'; settings: Partial<PanelSettings> }
  | { type: 'clearCache' }
  | { type: 'checkConnection' }
  | { type: 'installModel' }
  | { type: 'viewLogs' }
  | { type: 'openDocs' }
  | { type: 'toggleEducational' }
  | { type: 'togglePerf' }
  | { type: 'requestState' };

/**
 * Message types sent from extension to webview
 */
export type ExtensionMessage =
  | { type: 'stateUpdate'; state: PanelState }
  | { type: 'progressUpdate'; progress: AgentState }
  | { type: 'analysisComplete'; result: RCAResult }
  | { type: 'analysisError'; error: string }
  | { type: 'settingsUpdate'; settings: PanelSettings };
