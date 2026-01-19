/**
 * Extension-specific type definitions
 * 
 * This file contains types used by the VS Code extension layer.
 * Backend/core types are in src/types.ts
 */

// Re-export project scope utilities
export {
  PROJECT_SCOPE_VALUES,
  DEFAULT_PROJECT_SCOPE,
  SCOPE_LABELS,
  SCOPE_DESCRIPTIONS,
  SCOPE_INDICATORS,
  SCOPE_COLORS,
  type ProjectScope,
  isValidProjectScope,
  getProjectScope,
  getScopeOptimizations,
  buildScopePromptContext
} from '../constants/projectScope';

// Re-export core types from backend
export {
  RCAResult,
  AgentState as CoreAgentState,
  ParsedError,
  CodeFix,
  RelatedFileFix,
  ToolCall,
  StackFrame
} from '../../../src/types';

/**
 * Extended Agent State for UI progress updates
 * Extends the core AgentState with additional UI-friendly properties
 */
export interface AgentState {
  /** Current iteration number */
  iteration: number;

  /** Maximum iterations allowed */
  maxIterations: number;

  /** Progress percentage (0-100) */
  progress?: number;

  /** Current thought/reasoning */
  currentThought?: string;

  /** Recent actions taken */
  recentActions?: string[];

  /** Recent observations */
  recentObservations?: string[];

  /** Elapsed time in milliseconds */
  elapsed?: number;

  /** Whether analysis is currently active */
  isActive?: boolean;

  /** Current hypothesis */
  hypothesis?: string | null;

  /** Identified root cause */
  rootCause?: string | null;
}

/**
 * Error item for UI display
 * Used by extension services to represent errors in the queue
 */
export interface ErrorItem {
  /** Unique error ID */
  id: string;

  /** Timestamp when error was detected */
  timestamp: number;

  /** Error message */
  message: string;

  /** Error type (e.g., 'runtime', 'build', 'lint') */
  type: 'runtime' | 'build' | 'lint' | 'syntax' | 'warning';

  /** File path where error occurred */
  filePath: string;

  /** Line number (1-indexed) */
  line: number;

  /** Column number (optional) */
  column?: number;

  /** Severity level */
  severity: 'error' | 'warning' | 'info';

  /** Analysis status */
  status: 'pending' | 'analyzing' | 'complete' | 'failed';

  /** Stack trace (optional) */
  stackTrace?: string[];

  /** Project scope - whether error is from inside or outside the workspace */
  projectScope?: 'inside' | 'outside';

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Validated error item for internal processing
 * Ensures projectScope is always present with valid value
 */
export interface ValidatedErrorItem extends ErrorItem {
  projectScope: 'inside' | 'outside';
}

/**
 * Analysis settings
 * Configuration for analysis behavior
 */
export interface AnalysisSettings {
  /** Maximum iterations for agent */
  maxIterations: number;

  /** Analysis mode */
  mode: 'standard' | 'educational' | 'fast';

  /** Enable caching */
  enableCaching: boolean;

  /** Ollama model to use */
  model: string;

  /** Ollama server URL */
  ollamaUrl: string;

  /** Number of hypotheses to generate */
  numHypotheses: number;

  /** Enable consensus building */
  enableConsensus: boolean;

  /** ChromaDB path */
  chromaDbPath: string;
}

/**
 * Analysis result with metadata
 * Extended result with timing and iteration info
 */
export interface AnalysisResultWithMetadata {
  /** RCA result */
  result: import('../../../src/types').RCAResult;

  /** Error that was analyzed */
  error: ErrorItem;

  /** Start time */
  startTime: number;

  /** End time */
  endTime: number;

  /** Duration in milliseconds */
  duration: number;

  /** Number of iterations taken */
  iterations: number;

  /** Tools used */
  toolsUsed: string[];
}

/**
 * Progress update during analysis
 * Sent to UI during analysis
 */
export interface AnalysisProgress {
  /** Error ID being analyzed */
  errorId: string;

  /** Current iteration */
  iteration: number;

  /** Max iterations */
  maxIterations: number;

  /** Current hypothesis */
  currentHypothesis: string | null;

  /** Current thought */
  currentThought?: string;

  /** Progress percentage (0-100) */
  progress: number;

  /** Status message */
  status: string;
}

/**
 * Chat message
 * For conversational debugging
 */
export interface ChatMessage {
  /** Message ID */
  id: string;

  /** Role */
  role: 'user' | 'assistant' | 'system';

  /** Message content */
  content: string;

  /** Timestamp */
  timestamp: number;

  /** Optional: Associated error */
  errorId?: string;

  /** Optional: Metadata */
  metadata?: Record<string, any>;
}

/**
 * Conversation session
 * For tracking debugging sessions
 */
export interface ConversationSession {
  /** Session ID */
  id: string;

  /** Start time */
  startTime: number;

  /** End time (if completed) */
  endTime?: number;

  /** Messages in conversation */
  messages: ChatMessage[];

  /** Associated errors */
  errors: ErrorItem[];

  /** Session status */
  status: 'active' | 'completed' | 'abandoned';
}
