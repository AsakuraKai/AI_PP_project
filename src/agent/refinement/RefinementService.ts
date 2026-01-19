/**
 * RefinementService - Shared refinement logic for all agents
 * 
 * Provides unified refinement functionality used by both:
 * - ClarificationAgent: for agent-initiated clarification refinements
 * - RefinementAgent: for user-initiated feedback refinements
 * 
 * This eliminates code duplication and ensures consistent behavior
 * across all refinement types.
 * 
 * @see DUPLICATION_REVIEW.md for context
 */

import { RootCauseAnalysis, ConversationMessage } from '../../types';
import { OllamaClient } from '../../llm/OllamaClient';
import { Logger } from '../../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('RefinementService');

export type RefinementContextType = 'user_feedback' | 'clarification';

export interface RefinementContext {
    contextType: RefinementContextType;
    contextData: string;
    conversationHistory?: ConversationMessage[];
    specificInstructions?: string;
}

export interface RefinementOptions {
    temperature?: number;
    maxTokens?: number;
    generateNewId?: boolean;
}

export class RefinementService {
    constructor(private llmClient: OllamaClient) { }

    /**
     * Refine an analysis with additional context
     * 
     * Generic refinement method that handles both:
     * - User feedback refinements (via RefinementAgent)
     * - Clarification refinements (via ClarificationAgent)
     * 
     * @param originalAnalysis - The analysis to refine
     * @param context - Context information for refinement
     * @param options - Optional refinement parameters
     * @returns Refined analysis with updated information
     */
    async refineAnalysisWithContext(
        originalAnalysis: RootCauseAnalysis,
        context: RefinementContext,
        options: RefinementOptions = {}
    ): Promise<RootCauseAnalysis> {
        logger.info('Refining analysis', {
            rcaId: originalAnalysis.rcaId,
            contextType: context.contextType,
            oldConfidence: originalAnalysis.confidence
        });

        // Build refinement prompt based on context type
        const prompt = this.buildRefinementPrompt(originalAnalysis, context);

        // Generate refined analysis
        const response = await this.llmClient.generate(prompt, {
            temperature: options.temperature ?? 0.15,
            maxTokens: options.maxTokens ?? 2000
        });

        // Parse and validate the refined analysis
        const refinedAnalysis = this.parseRefinementResponse(
            response.text,
            originalAnalysis,
            options.generateNewId ?? context.contextType === 'user_feedback'
        );

        logger.info('Analysis refined', {
            rcaId: refinedAnalysis.rcaId,
            newConfidence: refinedAnalysis.confidence,
            confidenceChange: refinedAnalysis.confidence - originalAnalysis.confidence,
            contextType: context.contextType
        });

        return refinedAnalysis;
    }

    /**
     * Build refinement prompt based on context type
     */
    private buildRefinementPrompt(
        originalAnalysis: RootCauseAnalysis,
        context: RefinementContext
    ): string {
        const baseInfo = this.buildBaseAnalysisInfo(originalAnalysis);
        const contextSection = this.buildContextSection(context);
        const taskInstructions = this.buildTaskInstructions(context.contextType);
        const outputFormat = this.buildOutputFormat(originalAnalysis.category);

        return `You are an Android debugging expert refining a root cause analysis based on new information.

${baseInfo}

${contextSection}

${taskInstructions}

${outputFormat}`;
    }

    /**
     * Build base analysis information section
     */
    private buildBaseAnalysisInfo(analysis: RootCauseAnalysis): string {
        const primaryFile = analysis.affectedFiles[0];
        return `ORIGINAL ANALYSIS:
- Root Cause: ${analysis.rootCause}
- Confidence: ${analysis.confidence}%
- Primary File: ${primaryFile?.filePath || 'N/A'}
- Lines: ${primaryFile?.lineNumbers.join(', ') || 'N/A'}
- Category: ${analysis.category}
- Affected Files: ${analysis.affectedFiles.map(f => f.filePath).join(', ')}`;
    }

    /**
     * Build context section based on type
     */
    private buildContextSection(context: RefinementContext): string {
        let section = '';

        if (context.contextType === 'clarification') {
            section = `USER PROVIDED CLARIFICATION:
${context.contextData}`;
        } else {
            section = `USER'S ADDITIONAL CONTEXT:
${context.contextData}`;
        }

        // Add conversation history if provided
        if (context.conversationHistory && context.conversationHistory.length > 0) {
            const historyText = context.conversationHistory
                .slice(-5) // Last 5 messages
                .map(m => `${m.role}: ${m.content}`)
                .join('\n');

            section += `\n\nRECENT CONVERSATION:
${historyText}`;
        }

        return section;
    }

    /**
     * Build task instructions based on context type
     */
    private buildTaskInstructions(contextType: RefinementContextType): string {
        if (contextType === 'clarification') {
            return `TASK:
Re-analyze the error with this new information. Update the root cause, affected files, and confidence score based on what the user clarified.

IMPORTANT:
- Increase confidence if clarification resolved uncertainty
- Update affected files if user indicated different files are relevant
- Provide clear reasoning for any changes
- Maintain JSON structure`;
        } else {
            return `TASK:
1. Re-analyze the error with this new context
2. Determine if the root cause should change
3. Adjust confidence based on new information
4. Update affected files if needed
5. Explain what changed and why

IMPORTANT RULES:
- Only change analysis if user's context genuinely improves understanding
- Increase confidence when user provides clarifying information
- Decrease confidence if user points out mistakes
- Keep the same format and structure`;
        }
    }

    /**
     * Build output format specification
     */
    private buildOutputFormat(category: string): string {
        return `OUTPUT FORMAT (JSON only, no markdown):
{
  "rootCause": "updated root cause based on new information",
  "confidence": 85,
  "category": "${category}",
  "affectedFiles": [
    {
      "filePath": "path/to/file.kt",
      "lineNumbers": [10, 15],
      "reason": "reason based on new information",
      "relevanceScore": 0.95
    }
  ],
  "reasoning": "Explanation of how the new information improved the analysis",
  "changes": {
    "whatChanged": "summary of changes",
    "reasoning": "why changes were made",
    "confidenceJustification": "why confidence increased/decreased"
  }
}

RESPOND WITH ONLY THE JSON, NO OTHER TEXT.`;
    }

    /**
     * Parse refinement response and create updated analysis
     */
    private parseRefinementResponse(
        responseText: string,
        originalAnalysis: RootCauseAnalysis,
        generateNewId: boolean
    ): RootCauseAnalysis {
        try {
            // Remove markdown code blocks if present
            const cleanText = responseText
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            // Extract JSON from response
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn('No JSON found in response, using original analysis');
                return this.createFallbackRefinedAnalysis(originalAnalysis, generateNewId);
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Create refined analysis with incremented refinement count
            const refinedAnalysis: RootCauseAnalysis = {
                rcaId: generateNewId ? uuidv4() : originalAnalysis.rcaId,
                errorLogId: originalAnalysis.errorLogId,
                rootCause: parsed.rootCause || originalAnalysis.rootCause,
                category: parsed.category || originalAnalysis.category,
                affectedFiles: parsed.affectedFiles || originalAnalysis.affectedFiles,
                confidence: parsed.confidence || originalAnalysis.confidence,
                suggestedFix: parsed.suggestedFix || originalAnalysis.suggestedFix,
                generatedAt: new Date(),
                modelVersion: generateNewId ? 'ollama-refinement-v1' : originalAnalysis.modelVersion,
                refinementCount: originalAnalysis.refinementCount + 1,
                previousVersionId: originalAnalysis.rcaId
            };

            return refinedAnalysis;
        } catch (error) {
            logger.error('Failed to parse refinement response', error);
            return this.createFallbackRefinedAnalysis(originalAnalysis, generateNewId);
        }
    }

    /**
     * Create fallback refined analysis when parsing fails
     */
    private createFallbackRefinedAnalysis(
        originalAnalysis: RootCauseAnalysis,
        generateNewId: boolean
    ): RootCauseAnalysis {
        return {
            ...originalAnalysis,
            rcaId: generateNewId ? uuidv4() : originalAnalysis.rcaId,
            refinementCount: originalAnalysis.refinementCount + 1,
            generatedAt: new Date(),
            previousVersionId: originalAnalysis.rcaId
        };
    }
}
