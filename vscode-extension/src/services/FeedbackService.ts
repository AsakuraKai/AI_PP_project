import { AnalysisService } from './AnalysisService';
import {
    FeedbackHandler,
    type FeedbackResult,
    type FeedbackStats,
    type FeedbackType
} from '../../../src/agent/FeedbackHandler';

export interface SubmitFeedbackRequest {
    rcaId: string;
    feedbackType: FeedbackType;
    errorHash?: string;
}

/**
 * FeedbackService
 * Bridges webview feedback events to the backend FeedbackHandler.
 */
export class FeedbackService {
    private static _instance: FeedbackService;
    private readonly analysisService = AnalysisService.getInstance();
    private _handler?: FeedbackHandler;

    static getInstance(): FeedbackService {
        if (!FeedbackService._instance) {
            FeedbackService._instance = new FeedbackService();
        }
        return FeedbackService._instance;
    }

    private async _getHandler(): Promise<FeedbackHandler> {
        // Ensure AnalysisService has tried to initialize its components.
        if (!this.analysisService.getCache()) {
            await this.analysisService.initialize();
        }

        const db = this.analysisService.getChromaDB();
        const cache = this.analysisService.getCache();

        if (!db) {
            throw new Error('ChromaDB is not available; feedback cannot be persisted.');
        }
        if (!cache) {
            throw new Error('RCA cache is not initialized; feedback cannot be processed.');
        }

        if (!this._handler) {
            this._handler = new FeedbackHandler(db, cache);
        }

        return this._handler;
    }

    async submitFeedback(req: SubmitFeedbackRequest): Promise<FeedbackResult> {
        const handler = await this._getHandler();
        return handler.handleFeedback(req.rcaId, req.feedbackType, req.errorHash);
    }

    async getStats(): Promise<FeedbackStats> {
        const handler = await this._getHandler();
        return handler.getStats();
    }

    async resetStats(): Promise<void> {
        const handler = await this._getHandler();
        handler.resetStats();
    }
}
