/**
 * Type definitions for RCA Agent Panel UI
 * Chunk 1: Foundation & Activity Bar
 */

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
}

/**
 * Represents the progress of an ongoing analysis
 */
export interface AnalysisProgress {
  /** Current iteration number */
  iteration: number;
  
  /** Maximum number of iterations */
  maxIterations: number;
  
  /** Overall progress percentage (0-100) */
  progress: number;
  
  /** Current thought/action being performed */
  currentThought?: string;
  
  /** Current tool being executed */
  currentTool?: string;
  
  /** Elapsed time in seconds */
  elapsedTime?: number;
}

/**
 * Represents the state of the panel
 */
export interface PanelState {
  /** Current view state */
  view: 'empty' | 'active' | 'complete' | 'error';
  
  /** Currently analyzing error (if any) */
  currentError?: ErrorItem;
  
  /** Current analysis progress (if analyzing) */
  currentProgress?: AnalysisProgress;
  
  /** Current analysis result (if complete) */
  currentResult?: RCAResult;
  
  /** Error message (if error state) */
  errorMessage?: string;
  
  /** List of errors in the queue */
  errorQueue: ErrorItem[];
  
  /** Recent history items */
  history: HistoryItem[];
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
  | { type: 'analyze'; errorId: string }
  | { type: 'analyzeAll' }
  | { type: 'stop' }
  | { type: 'refresh' }
  | { type: 'removeError'; errorId: string }
  | { type: 'reanalyze'; historyId: string }
  | { type: 'feedback'; historyId: string; helpful: boolean; feedback?: string }
  | { type: 'copyFix'; fixText: string }
  | { type: 'applyFix'; fixText: string; filePath: string; line: number }
  | { type: 'viewFile'; filePath: string; line: number }
  | { type: 'updateSettings'; settings: Partial<PanelSettings> }
  | { type: 'requestState' };

/**
 * Message types sent from extension to webview
 */
export type ExtensionMessage =
  | { type: 'stateUpdate'; state: PanelState }
  | { type: 'progressUpdate'; progress: AnalysisProgress }
  | { type: 'analysisComplete'; result: RCAResult }
  | { type: 'analysisError'; error: string }
  | { type: 'settingsUpdate'; settings: PanelSettings };
