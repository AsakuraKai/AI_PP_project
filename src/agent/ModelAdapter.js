"use strict";
/**
 * Model Adapter for Fine-Tuning Preparation
 *
 * Prepares RCA data for model fine-tuning:
 * - Converts examples to model-specific formats
 * - Generates prompt templates
 * - Creates validation datasets
 * - Exports for popular fine-tuning frameworks
 *
 * @module agent/ModelAdapter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelFineTuningUtils = exports.ModelAdapter = void 0;
const DEFAULT_CONFIG = {
    format: 'ollama',
    split: {
        train: 0.8,
        validation: 0.1,
        test: 0.1
    },
    includeSystemPrompts: true,
    maxExamplesPerType: -1, // unlimited
    enableLogging: true
};
/**
 * Model Adapter
 *
 * Converts RCA training data to formats suitable for model fine-tuning.
 * Supports multiple frameworks and provides dataset splitting.
 *
 * @example
 * ```typescript
 * const adapter = new ModelAdapter({ format: 'ollama' });
 *
 * // Convert training examples
 * const entries = await adapter.convertExamples(examples);
 *
 * // Export for fine-tuning
 * const dataset = adapter.exportDataset(entries);
 * await fs.writeFile('training.jsonl', dataset.train);
 * await fs.writeFile('validation.jsonl', dataset.validation);
 * ```
 */
class ModelAdapter {
    constructor(config) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            split: {
                ...DEFAULT_CONFIG.split,
                ...config?.split
            }
        };
    }
    /**
     * Convert training examples to fine-tuning entries
     *
     * @param examples - Training examples from LearningPipeline
     * @returns Fine-tuning entries in target format
     */
    convertExamples(examples) {
        if (this.config.enableLogging) {
            console.log(`[ModelAdapter] Converting ${examples.length} examples to ${this.config.format} format...`);
        }
        // Limit per error type if specified
        let processedExamples = examples;
        if (this.config.maxExamplesPerType > 0) {
            const typeGroups = new Map();
            for (const ex of examples) {
                const existing = typeGroups.get(ex.errorType) || [];
                existing.push(ex);
                typeGroups.set(ex.errorType, existing);
            }
            processedExamples = [];
            for (const [, group] of typeGroups) {
                const limited = group
                    .sort((a, b) => b.quality - a.quality)
                    .slice(0, this.config.maxExamplesPerType);
                processedExamples.push(...limited);
            }
        }
        // Convert to format-specific entries
        const entries = processedExamples.map(ex => this.convertToEntry(ex));
        if (this.config.enableLogging) {
            console.log(`[ModelAdapter] Converted ${entries.length} entries`);
        }
        return entries;
    }
    /**
     * Convert single training example to fine-tuning entry
     */
    convertToEntry(example) {
        const template = this.getPromptTemplate(example.errorType);
        // Build user message
        const userMessage = template.user
            .replace('{{ERROR_TYPE}}', example.errorType)
            .replace('{{ERROR_MESSAGE}}', example.errorMessage);
        // Build assistant response
        const fixGuidelines = example.expectedFixGuidelines
            .map((guideline, i) => `${i + 1}. ${guideline}`)
            .join('\n');
        const assistantResponse = template.assistant
            .replace('{{ROOT_CAUSE}}', example.expectedRootCause)
            .replace('{{FIX_GUIDELINES}}', fixGuidelines);
        const entry = {
            id: example.id,
            user: userMessage,
            assistant: assistantResponse,
            metadata: {
                errorType: example.errorType,
                quality: example.quality,
                validated: example.validated,
                sourceRcaId: example.sourceRcaId
            }
        };
        if (this.config.includeSystemPrompts) {
            entry.system = template.system;
        }
        return entry;
    }
    /**
     * Get prompt template for error type
     */
    getPromptTemplate(errorType) {
        // Base system prompt
        const system = `You are an expert Android/Kotlin debugging assistant specializing in Root Cause Analysis (RCA).
Your task is to analyze error messages and provide:
1. A detailed root cause explanation
2. Step-by-step fix guidelines with code examples
3. High confidence in your analysis

Always output valid JSON with these fields:
- "rootCause": Detailed explanation with file:line references
- "fixGuidelines": Array of actionable steps with BEFORE/AFTER code
- "confidence": Score between 0.0 and 1.0`;
        // Error-type specific user template
        const userTemplate = `Analyze this ${errorType} error:

Error: {{ERROR_MESSAGE}}

Provide a root cause analysis with fix guidelines.`;
        // Assistant response template
        const assistantTemplate = `{
  "rootCause": "{{ROOT_CAUSE}}",
  "fixGuidelines": [
{{FIX_GUIDELINES}}
  ],
  "confidence": 0.9
}`;
        return {
            system,
            user: userTemplate,
            assistant: assistantTemplate
        };
    }
    /**
     * Split dataset into train/validation/test sets
     *
     * @param entries - Fine-tuning entries to split
     * @returns Split datasets
     */
    splitDataset(entries) {
        // Shuffle entries
        const shuffled = [...entries].sort(() => Math.random() - 0.5);
        const trainCount = Math.floor(shuffled.length * this.config.split.train);
        const valCount = Math.floor(shuffled.length * this.config.split.validation);
        const train = shuffled.slice(0, trainCount);
        const validation = shuffled.slice(trainCount, trainCount + valCount);
        const test = shuffled.slice(trainCount + valCount);
        if (this.config.enableLogging) {
            console.log(`[ModelAdapter] Dataset split: train=${train.length}, val=${validation.length}, test=${test.length}`);
        }
        return { train, validation, test };
    }
    /**
     * Export dataset in target format
     *
     * @param entries - Fine-tuning entries to export
     * @returns Formatted strings for each dataset split
     */
    exportDataset(entries) {
        const split = this.splitDataset(entries);
        let trainStr;
        let valStr;
        let testStr;
        switch (this.config.format) {
            case 'ollama':
                trainStr = this.formatOllama(split.train);
                valStr = this.formatOllama(split.validation);
                testStr = this.formatOllama(split.test);
                break;
            case 'openai':
                trainStr = this.formatOpenAI(split.train);
                valStr = this.formatOpenAI(split.validation);
                testStr = this.formatOpenAI(split.test);
                break;
            case 'anthropic':
                trainStr = this.formatAnthropic(split.train);
                valStr = this.formatAnthropic(split.validation);
                testStr = this.formatAnthropic(split.test);
                break;
            case 'generic':
            default:
                trainStr = this.formatGeneric(split.train);
                valStr = this.formatGeneric(split.validation);
                testStr = this.formatGeneric(split.test);
                break;
        }
        const stats = {
            totalEntries: entries.length,
            trainCount: split.train.length,
            validationCount: split.validation.length,
            testCount: split.test.length,
            format: this.config.format
        };
        if (this.config.enableLogging) {
            console.log(`[ModelAdapter] ✅ Exported ${stats.totalEntries} entries in ${this.config.format} format`);
        }
        return {
            train: trainStr,
            validation: valStr,
            test: testStr,
            stats
        };
    }
    /**
     * Format entries for Ollama fine-tuning (JSONL)
     */
    formatOllama(entries) {
        return entries.map(entry => {
            const ollamaEntry = {
                prompt: entry.user,
                response: entry.assistant,
                system: entry.system,
                metadata: entry.metadata
            };
            return JSON.stringify(ollamaEntry);
        }).join('\n');
    }
    /**
     * Format entries for OpenAI fine-tuning (JSONL)
     */
    formatOpenAI(entries) {
        return entries.map(entry => {
            const messages = [];
            if (entry.system) {
                messages.push({ role: 'system', content: entry.system });
            }
            messages.push({ role: 'user', content: entry.user }, { role: 'assistant', content: entry.assistant });
            return JSON.stringify({ messages });
        }).join('\n');
    }
    /**
     * Format entries for Anthropic fine-tuning (JSONL)
     */
    formatAnthropic(entries) {
        return entries.map(entry => {
            const anthropicEntry = {
                prompt: entry.system ? `${entry.system}\n\nHuman: ${entry.user}` : `Human: ${entry.user}`,
                completion: ` ${entry.assistant}`,
                metadata: entry.metadata
            };
            return JSON.stringify(anthropicEntry);
        }).join('\n');
    }
    /**
     * Format entries in generic JSON format
     */
    formatGeneric(entries) {
        return JSON.stringify(entries, null, 2);
    }
    /**
     * Generate Ollama Modelfile for custom model
     *
     * @param baseModel - Base model to build from
     * @param modelName - Name for the custom model
     * @returns Modelfile content
     */
    generateOllamaModelfile(baseModel, modelName) {
        return `# Custom RCA Model: ${modelName}
# Fine-tuned for Android/Kotlin debugging
# Base: ${baseModel}

FROM ${baseModel}

# System prompt optimized for RCA
SYSTEM """
You are an expert Android/Kotlin debugging assistant specializing in Root Cause Analysis (RCA).

Your training includes validated solutions from production debugging sessions.

**CRITICAL RULES:**
1. ALWAYS output valid JSON only
2. Include "rootCause" with file:line references
3. Include "fixGuidelines" with BEFORE/AFTER code examples
4. Include "confidence" score (0.0-1.0)

**Analysis Process:**
1. Identify error type and location
2. Analyze root cause with domain knowledge
3. Provide actionable fixes with code examples
4. Calculate confidence based on pattern matching

**Output Format:**
{
  "thought": "Analysis reasoning...",
  "rootCause": "Detailed cause with MainActivity.kt:42 references",
  "fixGuidelines": [
    "1. Fix description",
    "2. Before:\\n\`\`\`kotlin\\nold code\\n\`\`\`\\nAfter:\\n\`\`\`kotlin\\nnew code\\n\`\`\`"
  ],
  "confidence": 0.85
}
"""

# Model parameters
PARAMETER temperature 0.0
PARAMETER num_ctx 8192
PARAMETER num_predict 2500
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

# Stop tokens
PARAMETER stop "<think>"
PARAMETER stop "</think>"
`;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.ModelAdapter = ModelAdapter;
/**
 * Utility functions for model fine-tuning
 */
class ModelFineTuningUtils {
    /**
     * Validate training dataset quality
     *
     * @param entries - Fine-tuning entries to validate
     * @returns Validation report
     */
    static validateDataset(entries) {
        const issues = [];
        let emptyPrompts = 0;
        let emptyResponses = 0;
        let missingMetadata = 0;
        let totalPromptLength = 0;
        let totalResponseLength = 0;
        for (const entry of entries) {
            if (!entry.user || entry.user.trim().length === 0) {
                emptyPrompts++;
                issues.push(`Entry ${entry.id}: Empty user message`);
            }
            if (!entry.assistant || entry.assistant.trim().length === 0) {
                emptyResponses++;
                issues.push(`Entry ${entry.id}: Empty assistant response`);
            }
            if (!entry.metadata || Object.keys(entry.metadata).length === 0) {
                missingMetadata++;
            }
            totalPromptLength += entry.user?.length || 0;
            totalResponseLength += entry.assistant?.length || 0;
        }
        const stats = {
            totalEntries: entries.length,
            emptyPrompts,
            emptyResponses,
            missingMetadata,
            avgPromptLength: entries.length > 0 ? totalPromptLength / entries.length : 0,
            avgResponseLength: entries.length > 0 ? totalResponseLength / entries.length : 0
        };
        const valid = issues.length === 0;
        return { valid, issues, stats };
    }
    /**
     * Generate statistics report for dataset
     */
    static generateReport(entries) {
        const validation = this.validateDataset(entries);
        const report = `
# Fine-Tuning Dataset Report

## Overview
- **Total Entries**: ${validation.stats.totalEntries}
- **Validation Status**: ${validation.valid ? '✅ PASSED' : '❌ FAILED'}

## Quality Metrics
- **Empty Prompts**: ${validation.stats.emptyPrompts}
- **Empty Responses**: ${validation.stats.emptyResponses}
- **Missing Metadata**: ${validation.stats.missingMetadata}

## Length Statistics
- **Avg Prompt Length**: ${Math.round(validation.stats.avgPromptLength)} characters
- **Avg Response Length**: ${Math.round(validation.stats.avgResponseLength)} characters

${validation.issues.length > 0 ? `
## Issues Found
${validation.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Recommendations
${validation.valid
            ? '- Dataset is ready for fine-tuning\n- Consider balancing error type distribution'
            : '- Fix validation issues before fine-tuning\n- Review empty entries\n- Ensure all required fields are present'}
`;
        return report.trim();
    }
}
exports.ModelFineTuningUtils = ModelFineTuningUtils;
//# sourceMappingURL=ModelAdapter.js.map