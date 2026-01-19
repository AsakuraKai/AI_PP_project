/**
 * UnifiedValidator - Consolidated validation for RCA responses and outputs
 * 
 * Merges ResponseValidator and OutputValidator into a single, configurable validator
 * with quality metric tracking and adaptive thresholds based on error complexity.
 * 
 * Features:
 * - Dual modes: 'intermediate' (85%+ threshold) and 'final' (60%+ threshold)
 * - Quality metric tracking over time
 * - Adaptive thresholds based on error complexity
 * - Catastrophic failure handling
 * - Consistent validation logic
 * 
 * @example
 * const validator = new UnifiedValidator({ mode: 'final' });
 * const result = validator.validate(rcaResult, parsedError);
 * const metrics = validator.getMetrics();
 */

import { RCAResult, ParsedError } from '../types';
import { QualityChecker } from '../utils/QualityChecker';

export type ValidationMode = 'intermediate' | 'final';

export interface ValidationConfig {
    /** Validation mode: 'intermediate' (stricter) or 'final' (more forgiving) */
    mode?: ValidationMode;

    /** Custom threshold override (0.0-1.0) */
    customThreshold?: number;

    /** Enable adaptive thresholds based on error complexity */
    adaptiveThresholds?: boolean;

    /** Enable metric tracking */
    trackMetrics?: boolean;
}

export interface ValidationResult {
    /** Whether output passes validation */
    passes: boolean;

    /** Overall quality score (0.0-1.0) */
    score: number;

    /** Threshold used for validation */
    threshold: number;

    /** Individual dimension scores */
    dimensions: {
        filePathSpecificity: number;
        versionSpecificity: number;
        codeExamples: number;
        variableReferences: number;
        verificationSteps: number;
        completeness: number;
    };

    /** Issues found (for regeneration feedback) */
    issues: string[];

    /** Strengths found */
    strengths: string[];

    /** Error complexity score (0.0-1.0) */
    errorComplexity?: number;

    /** Get feedback message for regeneration */
    getFeedback(): string;
}

export interface QualityMetric {
    /** Timestamp of validation */
    timestamp: Date;

    /** Error type */
    errorType: string;

    /** Validation mode used */
    mode: ValidationMode;

    /** Quality score achieved */
    qualityScore: number;

    /** Threshold used */
    threshold: number;

    /** Whether validation passed */
    passed: boolean;

    /** Individual dimension scores */
    dimensions: Record<string, number>;

    /** Number of regeneration attempts */
    regenerationCount: number;

    /** Error complexity score */
    errorComplexity: number;

    /** Response time in ms */
    responseTime?: number;
}

export class UnifiedValidator {
    private readonly DEFAULT_INTERMEDIATE_THRESHOLD = 0.85; // 85% for intermediate responses
    private readonly DEFAULT_FINAL_THRESHOLD = 0.60;        // 60% for final output
    private readonly qualityChecker: QualityChecker;
    private readonly metrics: QualityMetric[] = [];
    private readonly config: {
        mode: ValidationMode;
        customThreshold?: number;
        adaptiveThresholds: boolean;
        trackMetrics: boolean;
    };

    constructor(config: ValidationConfig = {}) {
        this.config = {
            mode: config.mode || 'final',
            customThreshold: config.customThreshold,
            adaptiveThresholds: config.adaptiveThresholds ?? true,
            trackMetrics: config.trackMetrics ?? true,
        };
        this.qualityChecker = new QualityChecker();
    }

    /**
     * Validate RCA result with adaptive thresholds and metric tracking
     */
    validate(
        result: RCAResult,
        error: ParsedError,
        regenerationCount = 0
    ): ValidationResult {
        const startTime = Date.now();

        try {
            // Calculate error complexity
            const errorComplexity = this.calculateErrorComplexity(error, result);

            // Determine threshold (adaptive or fixed)
            const threshold = this.determineThreshold(errorComplexity);

            // Cross-check diagnostic accuracy using shared QualityChecker
            const jsonText = JSON.stringify({
                rootCause: result.rootCause,
                fixGuidelines: result.fixGuidelines,
            });

            const stackTrace = Array.isArray(error.stackTrace)
                ? error.stackTrace.map(frame => `${frame.file}:${frame.line}`).join('\n')
                : (error.stackTrace || '');

            this.qualityChecker.check(
                jsonText,
                error.message + '\n' + stackTrace
            );

            // Extended validation with individual dimensions
            const dimensions = {
                filePathSpecificity: this.checkFilePathSpecificity(result),
                versionSpecificity: this.checkVersionSpecificity(result),
                codeExamples: this.checkCodeExamples(result),
                variableReferences: this.checkVariableReferences(result),
                verificationSteps: this.checkVerificationSteps(result),
                completeness: this.checkCompleteness(result),
            };

            // Weighted average (mode-dependent weights)
            const weights = this.getWeights();

            const score = Object.entries(dimensions).reduce((sum, [key, value]) => {
                const weight = weights[key as keyof typeof weights];
                return sum + (value * weight);
            }, 0);

            // Clamp score to [0, 1]
            const clampedScore = Math.max(0, Math.min(1, score));
            const passes = clampedScore >= threshold;

            const issues = this.collectIssues(dimensions, result);
            const strengths = this.collectStrengths(dimensions, result);

            const validationResult: ValidationResult = {
                score: clampedScore,
                threshold,
                passes,
                dimensions,
                issues,
                strengths,
                errorComplexity,
                getFeedback: () => this.buildFeedback(dimensions, issues, threshold),
            };

            // Track metrics if enabled
            if (this.config.trackMetrics) {
                this.trackMetric({
                    timestamp: new Date(),
                    errorType: error.type,
                    mode: this.config.mode,
                    qualityScore: clampedScore,
                    threshold,
                    passed: passes,
                    dimensions,
                    regenerationCount,
                    errorComplexity,
                    responseTime: Date.now() - startTime,
                });
            }

            return validationResult;

        } catch (error) {
            // Catastrophic failure handling
            console.error('[UnifiedValidator] Catastrophic failure:', error);

            return {
                score: 0.3,
                threshold: this.config.customThreshold || this.DEFAULT_FINAL_THRESHOLD,
                passes: false,
                dimensions: {
                    filePathSpecificity: 0.3,
                    versionSpecificity: 0.3,
                    codeExamples: 0.3,
                    variableReferences: 0.3,
                    verificationSteps: 0.3,
                    completeness: 0.3,
                },
                issues: [
                    'Validation failed catastrophically',
                    'Manual review recommended',
                    `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
                ],
                strengths: [],
                getFeedback: () => `Validation system encountered an error. Manual review recommended.\nError: ${error instanceof Error ? error.message : 'Unknown'}`,
            };
        }
    }

    /**
     * Calculate error complexity score (0.0-1.0)
     * 
     * Factors considered:
     * - Stack trace depth (deeper = more complex)
     * - Number of files involved
     * - Error type (some types are inherently complex)
     * - Message length (longer = more context needed)
     */
    private calculateErrorComplexity(error: ParsedError, result: RCAResult): number {
        let complexity = 0.5; // Base complexity

        // Factor 1: Stack trace depth (max +0.2)
        const stackDepth = error.stackTrace?.length || 0;
        if (stackDepth > 10) {
            complexity += 0.2;
        } else if (stackDepth > 5) {
            complexity += 0.1;
        }

        // Factor 2: Error type complexity (max +0.15)
        const complexErrorTypes = ['proguard', 'r8', 'network', 'cache', 'build'];
        const simpleErrorTypes = ['lateinit', 'npe', 'null-pointer'];

        if (complexErrorTypes.some(type => error.type.toLowerCase().includes(type))) {
            complexity += 0.15;
        } else if (simpleErrorTypes.some(type => error.type.toLowerCase().includes(type))) {
            complexity -= 0.1;
        }

        // Factor 3: Message length (max +0.1)
        if (error.message.length > 500) {
            complexity += 0.1;
        } else if (error.message.length > 200) {
            complexity += 0.05;
        }

        // Factor 4: Multiple file involvement (max +0.1)
        const fileReferences = (result.rootCause + result.fixGuidelines.join(' '))
            .match(/\.(kt|java|xml|gradle|toml)/g) || [];
        const uniqueFiles = new Set(fileReferences).size;

        if (uniqueFiles > 3) {
            complexity += 0.1;
        } else if (uniqueFiles > 1) {
            complexity += 0.05;
        }

        // Factor 5: Framework/library specific (max +0.05)
        if (error.framework) {
            complexity += 0.05;
        }

        // Clamp to [0, 1]
        return Math.max(0, Math.min(1, complexity));
    }

    /**
     * Determine validation threshold based on mode and complexity
     */
    private determineThreshold(errorComplexity: number): number {
        // Use custom threshold if provided
        if (this.config.customThreshold !== undefined) {
            return this.config.customThreshold;
        }

        // Get base threshold from mode
        const baseThreshold = this.config.mode === 'intermediate'
            ? this.DEFAULT_INTERMEDIATE_THRESHOLD
            : this.DEFAULT_FINAL_THRESHOLD;

        // Apply adaptive adjustment if enabled
        if (!this.config.adaptiveThresholds) {
            return baseThreshold;
        }

        // Adaptive formula: lower threshold for complex errors
        // complexity 0.0 → threshold = base
        // complexity 0.5 → threshold = base - 0.05
        // complexity 1.0 → threshold = base - 0.15
        const adjustment = errorComplexity * -0.15;
        const adaptiveThreshold = baseThreshold + adjustment;

        // Ensure threshold stays reasonable
        return Math.max(0.40, Math.min(0.95, adaptiveThreshold));
    }

    /**
     * Get dimension weights based on mode
     */
    private getWeights(): Record<string, number> {
        if (this.config.mode === 'intermediate') {
            // Stricter weights for intermediate responses
            return {
                filePathSpecificity: 0.30,  // More critical
                versionSpecificity: 0.20,   // More critical
                codeExamples: 0.20,         // Critical
                variableReferences: 0.15,   // Important
                verificationSteps: 0.10,    // Moderate
                completeness: 0.05,         // Basic
            };
        } else {
            // Balanced weights for final output
            return {
                filePathSpecificity: 0.25,
                versionSpecificity: 0.15,
                codeExamples: 0.25,
                variableReferences: 0.15,
                verificationSteps: 0.15,
                completeness: 0.05,
            };
        }
    }

    /**
     * Track quality metric
     */
    private trackMetric(metric: QualityMetric): void {
        this.metrics.push(metric);

        // Keep only last 1000 metrics to prevent memory issues
        if (this.metrics.length > 1000) {
            this.metrics.shift();
        }
    }

    /**
     * Get all tracked metrics
     */
    getMetrics(): QualityMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics summary
     */
    getMetricsSummary(): {
        totalValidations: number;
        avgQualityScore: number;
        passRate: number;
        avgErrorComplexity: number;
        avgResponseTime: number;
        byErrorType: Record<string, { count: number; avgScore: number; passRate: number }>;
    } {
        if (this.metrics.length === 0) {
            return {
                totalValidations: 0,
                avgQualityScore: 0,
                passRate: 0,
                avgErrorComplexity: 0,
                avgResponseTime: 0,
                byErrorType: {},
            };
        }

        const totalValidations = this.metrics.length;
        const avgQualityScore = this.metrics.reduce((sum, m) => sum + m.qualityScore, 0) / totalValidations;
        const passRate = this.metrics.filter(m => m.passed).length / totalValidations;
        const avgErrorComplexity = this.metrics.reduce((sum, m) => sum + m.errorComplexity, 0) / totalValidations;
        const avgResponseTime = this.metrics
            .filter(m => m.responseTime !== undefined)
            .reduce((sum, m) => sum + (m.responseTime || 0), 0) / totalValidations;

        // Group by error type
        const byErrorType: Record<string, { count: number; avgScore: number; passRate: number }> = {};

        for (const metric of this.metrics) {
            if (!byErrorType[metric.errorType]) {
                byErrorType[metric.errorType] = { count: 0, avgScore: 0, passRate: 0 };
            }

            const typeMetrics = byErrorType[metric.errorType];
            typeMetrics.count++;
            typeMetrics.avgScore += metric.qualityScore;
            if (metric.passed) {
                typeMetrics.passRate++;
            }
        }

        // Calculate averages
        for (const type in byErrorType) {
            const typeMetrics = byErrorType[type];
            typeMetrics.avgScore /= typeMetrics.count;
            typeMetrics.passRate /= typeMetrics.count;
        }

        return {
            totalValidations,
            avgQualityScore,
            passRate,
            avgErrorComplexity,
            avgResponseTime,
            byErrorType,
        };
    }

    /**
     * Export metrics to JSON
     */
    exportMetrics(): string {
        return JSON.stringify({
            summary: this.getMetricsSummary(),
            metrics: this.metrics,
        }, null, 2);
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.metrics.length = 0;
    }

    // ===== Dimension Check Methods =====
    // (Imported from OutputValidator with improvements)

    private checkFilePathSpecificity(result: RCAResult): number {
        const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');

        const filePathRegex = /([a-zA-Z0-9_\-\/]+\.(gradle|kt|kts|xml|toml|properties))/g;
        const filePaths = text.match(filePathRegex) || [];

        if (filePaths.length === 0) {
            return 0.3; // Generic response
        }

        let score = 0.0;
        let checks = 0;

        for (const path of filePaths) {
            checks++;
            const context = text.substring(
                Math.max(0, text.indexOf(path) - 50),
                Math.min(text.length, text.indexOf(path) + path.length + 50)
            );

            if (/line\s+\d+|:\d+|@\d+|L\d+/.test(context)) {
                score += 1.0; // Has line number
            } else {
                score += 0.3; // File path but no line number
            }
        }

        return checks > 0 ? score / checks : 0.5;
    }

    private checkVersionSpecificity(result: RCAResult): number {
        const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');

        const genericTerms = [
            'latest', 'newest', 'current', 'update to latest',
            'newer version', 'recent version', 'upgrade to latest'
        ];

        const hasGenericTerms = genericTerms.some(term =>
            text.toLowerCase().includes(term)
        );

        const specificVersions = text.match(/\d+\.\d+\.\d+/g) || [];

        if (hasGenericTerms && specificVersions.length === 0) {
            return 0.2;
        }

        if (specificVersions.length > 0) {
            return 1.0;
        }

        return 0.6;
    }

    private checkCodeExamples(result: RCAResult): number {
        const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');

        const beforeAfterIndicators = [
            'before:', 'after:',
            'current:', 'change to:',
            'old:', 'new:',
            '```',
            'was:', 'should be:',
        ];

        let foundIndicators = 0;
        for (const indicator of beforeAfterIndicators) {
            if (text.toLowerCase().includes(indicator)) {
                foundIndicators++;
            }
        }

        const hasCodeLike = /[=:]\s*["'][^"']+["']|[{}\[\]()]/.test(text);

        if (foundIndicators >= 2 && hasCodeLike) {
            return 1.0;
        }

        if (foundIndicators >= 1) {
            return 0.6;
        }

        return 0.2;
    }

    private checkVariableReferences(result: RCAResult): number {
        const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');

        const genericTerms = [
            'the variable', 'the function', 'the method',
            'the property', 'the field', 'the class',
            'this variable', 'that function',
        ];

        const genericCount = genericTerms.filter(term =>
            text.toLowerCase().includes(term)
        ).length;

        const specificRefs = text.match(/\b[a-z][a-zA-Z0-9]*\b|\b[A-Z][a-zA-Z0-9]*\b/g) || [];
        const meaningfulRefs = specificRefs.filter(ref =>
            ref.length > 3 &&
            !/^(the|and|for|with|from|this|that|will|should|must)$/i.test(ref)
        );

        if (meaningfulRefs.length > 5) {
            return 1.0;
        }

        if (meaningfulRefs.length > 2) {
            return 0.7;
        }

        if (genericCount > 2) {
            return 0.3;
        }

        return 0.5;
    }

    private checkVerificationSteps(result: RCAResult): number {
        const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');

        const verificationTerms = [
            'run', 'test', 'verify', 'check',
            './gradlew', 'gradle', 'build',
            'compile', 'sync', 'clean',
            'after applying', 'to confirm', 'to ensure',
        ];

        const found = verificationTerms.filter(term =>
            text.toLowerCase().includes(term)
        ).length;

        if (found >= 3) {
            return 1.0;
        }

        if (found >= 1) {
            return 0.6;
        }

        return 0.2;
    }

    private checkCompleteness(result: RCAResult): number {
        let score = 1.0;

        if (!result.rootCause || result.rootCause.trim().length < 20) {
            score -= 0.3;
        }

        if (!result.fixGuidelines || result.fixGuidelines.length === 0) {
            score -= 0.3;
        }

        if (result.fixGuidelines.length === 1 && result.fixGuidelines[0].length < 20) {
            score -= 0.2;
        }

        if (result.confidence === undefined || result.confidence < 0.5) {
            score -= 0.2;
        }

        return Math.max(0, score);
    }

    private collectIssues(
        dimensions: ValidationResult['dimensions'],
        _result: RCAResult
    ): string[] {
        const issues: string[] = [];

        if (dimensions.filePathSpecificity < 0.7) {
            issues.push('File paths lack line numbers - specify exact locations');
        }

        if (dimensions.versionSpecificity < 0.7) {
            issues.push('Version numbers are generic - use specific versions (e.g., 8.7.3)');
        }

        if (dimensions.codeExamples < 0.7) {
            issues.push('Missing code examples - show before/after snippets');
        }

        if (dimensions.variableReferences < 0.7) {
            issues.push('Using generic terms - reference actual variable/function names');
        }

        if (dimensions.verificationSteps < 0.7) {
            issues.push('Missing verification steps - explain how to test the fix');
        }

        if (dimensions.completeness < 0.7) {
            issues.push('Response incomplete - add more detail to root cause or fixes');
        }

        return issues;
    }

    private collectStrengths(
        dimensions: ValidationResult['dimensions'],
        _result: RCAResult
    ): string[] {
        const strengths: string[] = [];

        if (dimensions.filePathSpecificity >= 0.9) {
            strengths.push('[OK] Includes exact file paths with line numbers');
        }

        if (dimensions.versionSpecificity >= 0.9) {
            strengths.push('[OK] Uses specific version numbers');
        }

        if (dimensions.codeExamples >= 0.9) {
            strengths.push('[OK] Includes before/after code examples');
        }

        if (dimensions.variableReferences >= 0.9) {
            strengths.push('[OK] References actual variable/function names');
        }

        if (dimensions.verificationSteps >= 0.9) {
            strengths.push('[OK] Includes verification steps');
        }

        if (dimensions.completeness >= 0.9) {
            strengths.push('[OK] Response is complete and detailed');
        }

        return strengths;
    }

    private buildFeedback(
        dimensions: ValidationResult['dimensions'],
        issues: string[],
        threshold: number
    ): string {
        const weakDimensions = Object.entries(dimensions)
            .filter(([_, score]: [string, any]) => score < 0.7)
            .sort((a, b) => (a[1] as number) - (b[1] as number));

        let feedback = `Current quality score below ${(threshold * 100).toFixed(0)}% threshold\n\n`;
        feedback += 'Areas needing improvement:\n\n';

        for (const [dim, score] of weakDimensions) {
            feedback += `${dim}: ${(score as number * 100).toFixed(0)}%\n`;

            if (dim === 'filePathSpecificity') {
                feedback += '  → Add exact file paths with line numbers (e.g., "gradle/libs.versions.toml at line 5")\n';
            } else if (dim === 'versionSpecificity') {
                feedback += '  → Use specific version numbers (e.g., "AGP 8.7.3"), not "latest" or "newest"\n';
            } else if (dim === 'codeExamples') {
                feedback += '  → Show before/after code examples with actual code snippets\n';
            } else if (dim === 'variableReferences') {
                feedback += '  → Reference actual variable/function names from the code\n';
            } else if (dim === 'verificationSteps') {
                feedback += '  → Add verification steps (e.g., "Run \'./gradlew build\' to test")\n';
            }
        }

        feedback += '\nTop Issues:\n';
        issues.slice(0, 5).forEach((issue, i) => {
            feedback += `${i + 1}. ${issue}\n`;
        });

        return feedback;
    }
}
