/**
 * RefinementAgent - Refines RCA analysis based on user feedback
 * 
 * Phase 3: Iterative Refinement
 * 
 * Responsibilities:
 * - Take original analysis and user context
 * - Generate refined analysis with improved accuracy
 * - Calculate delta between versions
 * - Track confidence changes
 * - Provide reasoning for changes
 */

import {
    RootCauseAnalysis,
    RefinementResult,
    AnalysisDelta,
    AnalysisSnapshot,
    FileChange,
    ConversationMessage,
    AffectedFile
} from '../../types';
import { RefinementService } from './RefinementService';
import { Logger } from '../../utils/Logger';

const logger = new Logger('RefinementAgent');

export class RefinementAgent {
    constructor(private refinementService: RefinementService) { }

    /**
     * Refine an existing analysis with new user context
     */
    async refineAnalysis(
        originalAnalysis: RootCauseAnalysis,
        userContext: string,
        conversationHistory: ConversationMessage[]
    ): Promise<RefinementResult> {
        try {
            logger.info('Refining analysis', { rcaId: originalAnalysis.rcaId });

            // Use RefinementService for refinement
            const refinedAnalysis = await this.refinementService.refineAnalysisWithContext(
                originalAnalysis,
                {
                    contextType: 'user_feedback',
                    contextData: userContext,
                    conversationHistory
                },
                {
                    temperature: 0.1,
                    generateNewId: true // Generate new ID for user feedback refinements
                }
            );

            // Calculate delta (unique to RefinementAgent)
            const delta = this.calculateDelta(originalAnalysis, refinedAnalysis);

            logger.info('Refinement complete', {
                confidenceChange: delta.confidenceChange,
                rootCauseChanged: delta.rootCauseChanged
            });

            return {
                originalAnalysis,
                refinedAnalysis,
                delta,
                reasoning: delta.reasoning,
                confidenceChange: refinedAnalysis.confidence - originalAnalysis.confidence
            };
        } catch (error) {
            logger.error('Refinement failed:', error);
            throw error;
        }
    }

    /**
     * Calculate delta between two analysis versions
     */
    private calculateDelta(
        original: RootCauseAnalysis,
        refined: RootCauseAnalysis
    ): AnalysisDelta {
        const rootCauseChanged = original.rootCause !== refined.rootCause;
        const filesChanged = this.compareFiles(
            original.affectedFiles,
            refined.affectedFiles
        );
        const confidenceChange = refined.confidence - original.confidence;

        const changes = {
            before: this.createSnapshot(original),
            after: this.createSnapshot(refined)
        };

        const reasoning = this.explainChanges(
            rootCauseChanged,
            filesChanged,
            confidenceChange,
            original,
            refined
        );

        return {
            rootCauseChanged,
            filesChanged,
            confidenceChange,
            changes,
            reasoning
        };
    }

    /**
     * Create snapshot of analysis
     */
    private createSnapshot(analysis: RootCauseAnalysis): AnalysisSnapshot {
        return {
            rootCause: analysis.rootCause,
            primaryFile: analysis.affectedFiles[0]?.filePath || 'N/A',
            confidence: analysis.confidence
        };
    }

    /**
     * Compare files between two analyses
     */
    private compareFiles(
        originalFiles: AffectedFile[],
        refinedFiles: AffectedFile[]
    ): FileChange[] {
        const changes: FileChange[] = [];
        const originalPaths = new Set(originalFiles.map(f => f.filePath));
        const refinedPaths = new Set(refinedFiles.map(f => f.filePath));

        // Check for added files
        for (const file of refinedFiles) {
            if (!originalPaths.has(file.filePath)) {
                changes.push({
                    type: 'added',
                    filePath: file.filePath,
                    newRelevance: file.relevanceScore
                });
            } else {
                // Check for modified relevance
                const originalFile = originalFiles.find(f => f.filePath === file.filePath);
                if (originalFile && originalFile.relevanceScore !== file.relevanceScore) {
                    changes.push({
                        type: 'modified',
                        filePath: file.filePath,
                        oldRelevance: originalFile.relevanceScore,
                        newRelevance: file.relevanceScore
                    });
                } else {
                    changes.push({
                        type: 'unchanged',
                        filePath: file.filePath,
                        oldRelevance: originalFile?.relevanceScore,
                        newRelevance: file.relevanceScore
                    });
                }
            }
        }

        // Check for removed files
        for (const file of originalFiles) {
            if (!refinedPaths.has(file.filePath)) {
                changes.push({
                    type: 'removed',
                    filePath: file.filePath,
                    oldRelevance: file.relevanceScore
                });
            }
        }

        return changes;
    }

    /**
     * Explain what changed and why
     */
    private explainChanges(
        rootCauseChanged: boolean,
        filesChanged: FileChange[],
        confidenceChange: number,
        original: RootCauseAnalysis,
        refined: RootCauseAnalysis
    ): string {
        const parts: string[] = [];

        if (rootCauseChanged) {
            parts.push(
                `Root cause updated from "${original.rootCause}" to "${refined.rootCause}" based on your input.`
            );
        }

        if (Math.abs(confidenceChange) >= 5) {
            const direction = confidenceChange > 0 ? 'increased' : 'decreased';
            parts.push(
                `Confidence ${direction} by ${Math.abs(confidenceChange)}% due to the additional context you provided.`
            );
        }

        const addedFiles = filesChanged.filter(f => f.type === 'added');
        const removedFiles = filesChanged.filter(f => f.type === 'removed');

        if (addedFiles.length > 0) {
            parts.push(
                `Added ${addedFiles.length} file(s) to the analysis: ${addedFiles.map(f => f.filePath).join(', ')}`
            );
        }

        if (removedFiles.length > 0) {
            parts.push(
                `Removed ${removedFiles.length} file(s) from analysis: ${removedFiles.map(f => f.filePath).join(', ')}`
            );
        }

        if (parts.length === 0) {
            return 'No significant changes to the analysis. Your input confirmed the current findings.';
        }

        return parts.join(' ');
    }
}
