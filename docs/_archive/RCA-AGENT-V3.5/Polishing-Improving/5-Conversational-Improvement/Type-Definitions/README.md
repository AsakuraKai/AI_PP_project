# Type Definitions

**Purpose:** Complete TypeScript type system for conversational features  
**Audience:** All developers

---

## Table of Contents

- [Core Types](#core-types)
- [Message Types](#message-types)
- [Context Types](#context-types)
- [Feedback Types](#feedback-types)
- [Analysis Types](#analysis-types)
- [Intent Types](#intent-types)
- [Handler Types](#handler-types)
- [State Types](#state-types)

---

## Core Types

### ConversationSession

**Location:** `src/types/conversation.ts`

```typescript
export interface ConversationSession {
  sessionId: string;
  userId: string;
  context: ConversationContext;
  messages: Message[];
  metadata: SessionMetadata;
  startedAt: Date;
  lastActiveAt: Date;
  status: 'active' | 'paused' | 'ended';
}
```

---

### ConversationContext

**Location:** `src/types/conversation.ts`

```typescript
export interface ConversationContext {
  // View context
  currentView: ViewType;
  previousView?: ViewType;
  
  // RCA context (if in Analysis view)
  rcaId?: string;
  errorLogId?: string;
  
  // Data context
  relevantData: Record<string, any>;
  
  // Conversation state
  threadId?: string;
  previousMessageCount: number;
}

export type ViewType =
  | 'dashboard'
  | 'errors'
  | 'analyze'
  | 'history'
  | 'agent'
  | 'fixes'
  | 'metrics';
```

---

### SessionMetadata

```typescript
export interface SessionMetadata {
  // Analytics
  messageCount: number;
  feedbackCount: number;
  refinementCount: number;
  
  // Engagement
  totalDuration: number; // milliseconds
  averageResponseTime: number;
  
  // Quality metrics
  averageFeedbackScore?: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
}
```

---

## Message Types

### Message

**Location:** `src/types/conversation.ts`

```typescript
export interface Message {
  messageId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  
  // Optional fields
  intent?: MessageIntent;
  context?: MessageContext;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
  
  // Feedback
  feedback?: UserFeedback;
  detailedFeedback?: DetailedFeedback;
}

export type MessageRole =
  | 'user'
  | 'assistant'
  | 'system';
```

---

### MessageIntent

**Location:** `src/types/intents.ts`

```typescript
export enum MessageIntent {
  // Questions
  CLARIFICATION = 'clarification',
  EXPLANATION = 'explanation',
  ALTERNATIVES = 'alternatives',
  
  // Feedback
  POSITIVE_FEEDBACK = 'positive_feedback',
  NEGATIVE_FEEDBACK = 'negative_feedback',
  CORRECTION = 'correction',
  
  // Actions
  REQUEST_ANALYSIS = 'request_analysis',
  REQUEST_FIX = 'request_fix',
  APPLY_FIX = 'apply_fix',
  
  // Refinement
  REFINE_ANALYSIS = 'refine_analysis',
  PROVIDE_MORE_CONTEXT = 'provide_more_context',
  
  // General
  GREETING = 'greeting',
  SMALL_TALK = 'small_talk',
  OTHER = 'other'
}
```

---

### MessageContext

```typescript
export interface MessageContext {
  // User's intent
  detectedIntent: MessageIntent;
  intentConfidence: number;
  
  // Referenced entities
  referencedRcaId?: string;
  referencedErrorId?: string;
  referencedMessageId?: string;
  
  // User state
  viewContext: ViewType;
  previousMessages: string[]; // IDs
}
```

---

### MessageMetadata

```typescript
export interface MessageMetadata {
  // Generation info (for assistant messages)
  generatedBy?: 'ollama' | 'agent-state' | 'template';
  modelName?: string;
  tokensUsed?: number;
  generationTime?: number; // milliseconds
  
  // UI state
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  
  // Threading
  replyToMessageId?: string;
  threadStartMessageId?: string;
}
```

---

### Attachment

```typescript
export interface Attachment {
  attachmentId: string;
  type: 'code' | 'log' | 'screenshot' | 'file';
  name: string;
  content: string | ArrayBuffer;
  mimeType: string;
  size: number;
}
```

---

## Context Types

### ViewContextData

**Location:** `src/types/context.ts`

```typescript
export type ViewContextData =
  | DashboardContext
  | ErrorQueueContext
  | AnalysisContext
  | HistoryContext
  | AgentStateContext
  | FixManagerContext
  | MetricsContext;
```

---

### AnalysisContext

```typescript
export interface AnalysisContext {
  viewType: 'analyze';
  rcaId: string;
  errorLogId: string;
  
  // Analysis data
  rootCause: RootCauseAnalysis;
  confidence: ConfidenceMetrics;
  affectedFiles: string[];
  
  // User actions
  hasViewedFullAnalysis: boolean;
  hasProvidedFeedback: boolean;
  hasAppliedFix: boolean;
}
```

---

### ErrorQueueContext

```typescript
export interface ErrorQueueContext {
  viewType: 'errors';
  
  // Selected errors
  selectedErrorIds: string[];
  selectedCount: number;
  
  // Filters
  activeFilters: ErrorFilter[];
  sortBy: 'priority' | 'timestamp' | 'frequency';
  
  // Queue state
  totalErrors: number;
  unanalyzedCount: number;
}
```

---

### DashboardContext

```typescript
export interface DashboardContext {
  viewType: 'dashboard';
  
  // Summary stats
  stats: DashboardStats;
  
  // Recent activity
  recentErrors: ErrorSummary[];
  recentAnalyses: AnalysisSummary[];
}
```

---

## Feedback Types

### UserFeedback (Simple)

**Location:** `src/types/feedback.ts`

```typescript
export interface UserFeedback {
  feedbackId: string;
  messageId: string;
  analysisId?: string;
  
  rating: 'helpful' | 'partial' | 'not-helpful';
  timestamp: Date;
}
```

---

### DetailedFeedback (Phase 5)

```typescript
export interface DetailedFeedback {
  feedbackId: string;
  messageId: string;
  analysisId?: string;
  
  // Overall rating
  rating: FeedbackRating;
  
  // Multi-dimensional feedback
  dimensions: FeedbackDimensions;
  
  // Free-text
  explanation?: string;
  
  // Structured corrections
  corrections?: FeedbackCorrections;
  
  // Metadata
  timestamp: Date;
  context: ViewType;
}

export type FeedbackRating = 'helpful' | 'partial' | 'not-helpful';
```

---

### FeedbackDimensions

```typescript
export interface FeedbackDimensions {
  // What worked well
  positiveAspects: PositiveAspect[];
  
  // What needs improvement
  negativeAspects: NegativeAspect[];
  
  // Specific ratings (1-5)
  accuracy?: number;
  clarity?: number;
  completeness?: number;
  relevance?: number;
}

export type PositiveAspect =
  | 'correct_file'
  | 'accurate_root_cause'
  | 'clear_explanation'
  | 'helpful_examples'
  | 'good_confidence'
  | 'relevant_context';

export type NegativeAspect =
  | 'wrong_file'
  | 'incorrect_root_cause'
  | 'unclear_explanation'
  | 'missing_examples'
  | 'wrong_confidence'
  | 'missing_context'
  | 'too_generic';
```

---

### FeedbackCorrections

```typescript
export interface FeedbackCorrections {
  // File corrections
  correctFile?: string;
  correctLineNumber?: number;
  
  // Root cause corrections
  correctRootCause?: string;
  correctCategory?: ErrorCategory;
  
  // Fix corrections
  correctFix?: string;
  correctApproach?: string;
}
```

---

## Analysis Types

### RootCauseAnalysis

**Location:** `src/types/analysis.ts`

```typescript
export interface RootCauseAnalysis {
  rcaId: string;
  errorLogId: string;
  
  // Analysis results
  rootCause: string;
  category: ErrorCategory;
  affectedFiles: AffectedFile[];
  suggestedFix: Fix;
  
  // Metadata
  confidence: number;
  generatedAt: Date;
  modelVersion: string;
  
  // History (for refinements)
  previousVersions?: RootCauseAnalysis[];
  refinementCount: number;
}

export type ErrorCategory =
  | 'null_pointer'
  | 'lateinit_not_initialized'
  | 'type_mismatch'
  | 'resource_not_found'
  | 'network_error'
  | 'permission_denied'
  | 'other';
```

---

### AffectedFile

```typescript
export interface AffectedFile {
  filePath: string;
  relevanceScore: number;
  lineNumbers: number[];
  reason: string;
}
```

---

### Fix

```typescript
export interface Fix {
  fixId: string;
  description: string;
  approach: string;
  codeChanges: CodeChange[];
  estimatedImpact: 'low' | 'medium' | 'high';
  risks: string[];
  testingSteps: string[];
}

export interface CodeChange {
  filePath: string;
  lineNumber: number;
  changeType: 'add' | 'remove' | 'modify';
  before?: string;
  after: string;
}
```

---

### ConfidenceMetrics

```typescript
export interface ConfidenceMetrics {
  overall: number; // 0-100
  
  // Component scores
  fileIdentification: number;
  rootCauseDetermination: number;
  fixSuggestion: number;
  
  // Trend
  trend?: 'improving' | 'declining' | 'stable';
  previousScore?: number;
  changePercentage?: number;
}
```

---

## Intent Types

### IntentClassificationResult

**Location:** `src/types/intents.ts`

```typescript
export interface IntentClassificationResult {
  intent: MessageIntent;
  confidence: number;
  reasoning: string;
  suggestedHandler: string;
  extractedEntities?: ExtractedEntities;
}
```

---

### ExtractedEntities

```typescript
export interface ExtractedEntities {
  rcaId?: string;
  errorId?: string;
  fileName?: string;
  lineNumber?: number;
  feedbackRating?: FeedbackRating;
  [key: string]: any;
}
```

---

## Handler Types

### IntentHandler

**Location:** `src/types/handlers.ts`

```typescript
export interface IntentHandler {
  name: string;
  supportedIntents: MessageIntent[];
  
  canHandle(message: Message, context: ConversationContext): boolean;
  handle(message: Message, context: ConversationContext): Promise<HandlerResult>;
  
  // Optional
  priority?: number;
  requiresContext?: string[];
}
```

---

### HandlerResult

```typescript
export interface HandlerResult {
  success: boolean;
  response: string;
  
  // Optional fields
  suggestions?: string[];
  updatedContext?: Partial<ConversationContext>;
  followUpQuestions?: string[];
  error?: string;
  
  // Metadata
  handlerName: string;
  processingTime: number;
}
```

---

## State Types

### ChatWidgetState

**Location:** `vscode-extension/webview/src/types/state.ts`

```typescript
export interface ChatWidgetState {
  // UI state
  isExpanded: boolean;
  unreadCount: number;
  
  // Current conversation
  sessionId?: string;
  messages: Message[];
  
  // Input state
  draft: string;
  isAgentTyping: boolean;
  
  // Context
  currentContext: ConversationContext;
}
```

---

### ConversationMemoryState

**Location:** `src/types/memory.ts`

```typescript
export interface ConversationMemoryState {
  // Sessions
  activeSessions: Map<string, ConversationSession>;
  sessionIndex: Map<string, string>; // userId -> sessionId
  
  // Context cache
  contextCache: Map<string, ConversationContext>;
  
  // Message history
  messageCache: Map<string, Message[]>; // sessionId -> messages
  
  // Stats
  totalSessions: number;
  totalMessages: number;
}
```

---

### NavigationState

```typescript
export interface NavigationState {
  currentView: ViewType;
  previousView?: ViewType;
  navigationHistory: ViewType[];
  
  // View-specific state
  viewStates: Map<ViewType, ViewState>;
}

export interface ViewState {
  scrollPosition: number;
  selectedItems: string[];
  filters: any;
  // ... view-specific fields
}
```

---

## Enums and Constants

### System Constants

```typescript
export const CONVERSATION_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_MESSAGES_PER_SESSION: 100,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  MAX_CONTEXT_SIZE: 10, // messages
  
  // Feedback
  MIN_FEEDBACK_INTERVAL_MS: 5000, // 5 seconds
  
  // UI
  TYPING_INDICATOR_DELAY_MS: 500,
  AUTO_SAVE_INTERVAL_MS: 2000,
};
```

---

### View-Specific Prompts

```typescript
export const VIEW_PROMPTS: Record<ViewType, string[]> = {
  dashboard: [
    "What errors need attention?",
    "Show today's summary",
    "How is Ollama performing?"
  ],
  
  errors: [
    "Which error should I fix first?",
    "Group similar errors",
    "Analyze selected"
  ],
  
  analyze: [
    "Why did you choose this file?",
    "Can you explain the fix?",
    "Show me alternatives"
  ],
  
  history: [
    "Show recent analyses",
    "What was fixed today?",
    "Compare two analyses"
  ],
  
  agent: [
    "Show agent memory",
    "How confident is the agent?",
    "View learning progress"
  ],
  
  fixes: [
    "Show pending fixes",
    "Which fix is highest priority?",
    "Review fix history"
  ],
  
  metrics: [
    "What's the accuracy trend?",
    "Show performance stats",
    "Compare model versions"
  ]
};
```

---

## Type Guards

### Message Type Guards

```typescript
export function isUserMessage(message: Message): boolean {
  return message.role === 'user';
}

export function isAssistantMessage(message: Message): boolean {
  return message.role === 'assistant';
}

export function hasDetailedFeedback(message: Message): message is Message & { detailedFeedback: DetailedFeedback } {
  return message.detailedFeedback !== undefined;
}

export function hasIntent(message: Message): message is Message & { intent: MessageIntent } {
  return message.intent !== undefined;
}
```

---

### Context Type Guards

```typescript
export function isAnalysisContext(context: ViewContextData): context is AnalysisContext {
  return context.viewType === 'analyze';
}

export function isDashboardContext(context: ViewContextData): context is DashboardContext {
  return context.viewType === 'dashboard';
}

export function isErrorQueueContext(context: ViewContextData): context is ErrorQueueContext {
  return context.viewType === 'errors';
}
```

---

## Migration from Existing Types

If you have existing RCA types, map them to conversation types:

```typescript
// Old: ErrorLog
// New: Use errorLogId in ConversationContext

// Old: AnalysisResult
// New: RootCauseAnalysis

// Old: FeedbackData
// New: DetailedFeedback

// Import old types during migration
import type { ErrorLog, AnalysisResult } from '@/types/rca';

function migrateAnalysisResult(old: AnalysisResult): RootCauseAnalysis {
  return {
    rcaId: old.id,
    errorLogId: old.errorId,
    rootCause: old.analysis.rootCause,
    category: old.analysis.category,
    affectedFiles: old.analysis.files,
    suggestedFix: old.fix,
    confidence: old.metrics.confidence,
    generatedAt: old.timestamp,
    modelVersion: old.modelVersion,
    refinementCount: 0
  };
}
```

---

**Next:** [Integration Points](../Integration-Points/README.md)  
**Back:** [Component Specifications](../Component-Specifications/README.md)
