/**
 * Frontend conversation types
 * 
 * These types are used by the webview components
 */

export type ViewType = 'dashboard' | 'errors' | 'analyze' | 'history' | 'agent' | 'fixes' | 'metrics';

export type MessageIntent =
    | 'clarification'
    | 'explanation'
    | 'detail_request'
    | 'refinement'
    | 'alternative'
    | 'correction'
    | 'positive_feedback'
    | 'negative_feedback'
    | 'partial_feedback'
    | 'new_analysis'
    | 'related_issue'
    | 'agent_clarification'
    | 'agent_suggestion'
    | 'followup'
    | 'feedback'
    | 'general';

export interface ConversationContext {
    viewType: ViewType;
    route: string;
    timestamp: number;
    activeRcaId?: string;
    activeErrorId?: string;
    metadata?: Record<string, unknown>;
}

export interface ConversationMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'failed';
    metadata?: {
        intent?: MessageIntent;
        confidence?: number;
        toolsUsed?: string[];
        processingTime?: number;
        context?: ConversationContext;
        delta?: AnalysisDelta; // Phase 3: For refinement messages
        clarificationQuestions?: any[]; // Phase 4: For agent-initiated questions
    };
}

export interface ConversationSession {
    id: string;
    rcaId?: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'paused' | 'completed';
    messages: ConversationMessage[];
    metadata: {
        messageCount: number;
        confidenceEvolution: number[];
        refinementCount: number;
        viewsVisited: ViewType[];
    };
}

// ============================================================================
// Phase 3: Iterative Refinement Types
// ============================================================================

export interface AffectedFile {
    filePath: string;
    lineNumbers: number[];
    reason: string;
    relevanceScore: number;
}

export interface RootCauseAnalysis {
    rcaId: string;
    errorLogId: string;
    rootCause: string;
    category: string;
    affectedFiles: AffectedFile[];
    confidence: number;
    suggestedFix: Record<string, unknown>;
    generatedAt: Date;
    modelVersion: string;
    refinementCount: number;
    previousVersionId?: string;
}

export interface AnalysisSnapshot {
    rootCause: string;
    primaryFile: string;
    confidence: number;
}

export interface FileChange {
    type: 'added' | 'removed' | 'unchanged' | 'modified';
    filePath: string;
    oldRelevance?: number;
    newRelevance?: number;
}

export interface AnalysisDelta {
    rootCauseChanged: boolean;
    filesChanged: FileChange[];
    confidenceChange: number;
    changes: {
        before: AnalysisSnapshot;
        after: AnalysisSnapshot;
    };
    reasoning: string;
}

export interface RefinementResult {
    originalAnalysis: RootCauseAnalysis;
    refinedAnalysis: RootCauseAnalysis;
    delta: AnalysisDelta;
    reasoning: string;
    confidenceChange: number;
}

