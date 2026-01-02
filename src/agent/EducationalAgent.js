"use strict";
/**
 * EducationalAgent - Learning-focused error analysis
 *
 * Extends MinimalReactAgent to provide educational explanations alongside
 * root cause analysis. Designed to help developers learn while debugging.
 *
 * Key Features:
 * - Explains error types in beginner-friendly language
 * - Clarifies root causes with analogies and metaphors
 * - Provides prevention tips and best practices
 * - Async generation (optional) for faster initial analysis
 *
 * Design Decisions:
 * - Extends MinimalReactAgent to reuse core analysis logic
 * - Separate LLM calls for learning notes (cleaner prompts)
 * - Supports sync (slower, comprehensive) and async (faster, delayed learning) modes
 * - Uses simplified language and concrete examples
 *
 * @example
 * const agent = new EducationalAgent(ollamaClient);
 * const rca = await agent.analyze(error, 'sync');
 * console.log(rca.learningNotes); // Educational content
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationalAgent = void 0;
const MinimalReactAgent_1 = require("./MinimalReactAgent");
/**
 * EducationalAgent - Generates learning-focused explanations
 *
 * This agent extends the base MinimalReactAgent to add educational content
 * that helps developers understand errors and learn prevention strategies.
 */
class EducationalAgent extends MinimalReactAgent_1.MinimalReactAgent {
    constructor(llm, config) {
        super(llm, config);
        this.pendingEducation = new Map();
    }
    /**
     * Analyze error with educational content
     *
     * @param error - Parsed error to analyze
     * @param mode - 'sync' generates learning notes during analysis, 'async' generates after
     * @returns RCA result with learning notes
     */
    async analyze(error, mode = 'sync') {
        // Get base analysis from parent
        const rca = await super.analyze(error);
        const educationalRCA = {
            ...rca,
            learningNotes: []
        };
        if (mode === 'sync') {
            // Generate learning notes synchronously (slower but complete)
            educationalRCA.learningNotes = await this.generateLearningNotes(educationalRCA, error);
        }
        else {
            // Generate learning notes asynchronously (faster, delayed)
            const promise = this.generateLearningNotes(educationalRCA, error);
            this.pendingEducation.set(this.getErrorKey(error), promise);
            // Return immediately without learning notes
            educationalRCA.learningNotes = ['⏳ Learning notes generating...'];
        }
        return educationalRCA;
    }
    /**
     * Get pending learning notes for async mode
     *
     * @param error - Error that was analyzed
     * @returns Promise that resolves to learning notes
     */
    async getPendingLearningNotes(error) {
        const key = this.getErrorKey(error);
        const promise = this.pendingEducation.get(key);
        if (!promise) {
            return null;
        }
        const notes = await promise;
        this.pendingEducation.delete(key);
        return notes;
    }
    /**
     * Generate educational learning notes
     *
     * Creates three types of explanations:
     * 1. What is this error? (Error type explanation)
     * 2. Why did this happen? (Root cause explanation)
     * 3. How to prevent this? (Prevention tips)
     *
     * @param rca - Root cause analysis result
     * @param error - Original parsed error
     * @returns Array of learning notes
     */
    async generateLearningNotes(rca, error) {
        const notes = [];
        try {
            // 1. Explain error type
            const errorExplanation = await this.explainErrorType(error);
            notes.push(`🎓 **What is this error?**\n${errorExplanation}`);
            // 2. Explain root cause
            const causeExplanation = await this.explainRootCause(rca, error);
            notes.push(`🔍 **Why did this happen?**\n${causeExplanation}`);
            // 3. Prevention tips
            const preventionTips = await this.generatePreventionTips(error);
            notes.push(`🛡️ **How to prevent this:**\n${preventionTips}`);
        }
        catch (err) {
            console.error('Failed to generate learning notes:', err);
            notes.push('❌ Failed to generate learning notes. Please try again.');
        }
        return notes;
    }
    /**
     * Explain what the error type means in beginner-friendly terms
     */
    async explainErrorType(error) {
        const prompt = this.buildErrorTypePrompt(error);
        const options = {
            temperature: 0.7,
            maxTokens: 300
        };
        const response = await this.llm.generate(prompt, options);
        return this.cleanupExplanation(response.text);
    }
    /**
     * Explain why the root cause happened with analogies
     */
    async explainRootCause(rca, error) {
        const prompt = this.buildRootCausePrompt(rca, error);
        const options = {
            temperature: 0.7,
            maxTokens: 300
        };
        const response = await this.llm.generate(prompt, options);
        return this.cleanupExplanation(response.text);
    }
    /**
     * Generate prevention tips and best practices
     */
    async generatePreventionTips(error) {
        const prompt = this.buildPreventionPrompt(error);
        const options = {
            temperature: 0.7,
            maxTokens: 400
        };
        const response = await this.llm.generate(prompt, options);
        return this.cleanupExplanation(response.text);
    }
    /**
     * Build prompt for error type explanation
     */
    buildErrorTypePrompt(error) {
        const errorTypeNames = {
            'lateinit': 'lateinit property access exception',
            'npe': 'NullPointerException',
            'type_mismatch': 'type mismatch error',
            'unresolved_reference': 'unresolved reference error',
            'compilation_error': 'compilation error',
            'import_error': 'import error',
            'compose_remember': 'Compose remember error',
            'compose_recomposition': 'excessive recomposition',
            'compose_effect': 'LaunchedEffect error',
            'xml_inflation': 'XML layout inflation error',
            'gradle_dependency_conflict': 'Gradle dependency conflict',
            'manifest_merge_conflict': 'manifest merge conflict'
        };
        const friendlyName = errorTypeNames[error.type] || error.type;
        return `You are teaching a beginner ${error.language} developer.

Explain what a "${friendlyName}" error means in simple terms.

Requirements:
- Use plain English, avoid jargon
- Include a helpful analogy or metaphor
- Keep it under 100 words
- Focus on WHAT this error means, not how to fix it

Error type: ${error.type}
Language: ${error.language}
${error.framework ? `Framework: ${error.framework}` : ''}

Provide a clear, beginner-friendly explanation:`;
    }
    /**
     * Build prompt for root cause explanation
     */
    buildRootCausePrompt(rca, error) {
        return `You are teaching a beginner ${error.language} developer.

The root cause has been identified as:
"${rca.rootCause}"

Explain WHY this happened in simple terms.

Requirements:
- Use plain English and helpful analogies
- Connect it to something familiar (real-world analogy)
- Keep it under 100 words
- Make it memorable and easy to understand

Error type: ${error.type}
Language: ${error.language}

Provide a clear explanation of why this root cause occurred:`;
    }
    /**
     * Build prompt for prevention tips
     */
    buildPreventionPrompt(error) {
        return `You are teaching a beginner ${error.language} developer.

Based on this error type: "${error.type}"

Provide 3 concrete, actionable tips to PREVENT this error in the future.

Requirements:
- Be specific and actionable (not vague advice)
- Include code examples or patterns when helpful
- Prioritize practical tips over theoretical advice
- Keep each tip concise (1-2 sentences)
- Number them 1, 2, 3

Error type: ${error.type}
Language: ${error.language}
${error.framework ? `Framework: ${error.framework}` : ''}

Provide 3 prevention tips:`;
    }
    /**
     * Clean up LLM explanation output
     *
     * Removes markdown artifacts, extra whitespace, and ensures proper formatting
     */
    cleanupExplanation(text) {
        return text
            .trim()
            .replace(/^```[\w]*\n/gm, '') // Remove code fence starts
            .replace(/\n```$/gm, '') // Remove code fence ends
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
            .replace(/^\s+/gm, '') // Remove leading whitespace from lines
            .trim();
    }
    /**
     * Generate unique key for error (for async tracking)
     */
    getErrorKey(error) {
        return `${error.type}:${error.filePath}:${error.line}:${error.message.slice(0, 50)}`;
    }
    /**
     * Check if agent has pending educational content
     */
    hasPendingEducation(error) {
        return this.pendingEducation.has(this.getErrorKey(error));
    }
    /**
     * Clear all pending educational content
     */
    clearPendingEducation() {
        this.pendingEducation.clear();
    }
}
exports.EducationalAgent = EducationalAgent;
//# sourceMappingURL=EducationalAgent.js.map