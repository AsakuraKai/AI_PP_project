"use strict";
/**
 * Core type definitions for RCA Agent
 *
 * This file contains all shared interfaces and types used throughout the system.
 * Following single source of truth principle for type definitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.AnalysisTimeoutError = exports.LLMError = exports.ParsingError = void 0;
/**
 * Error thrown when parsing fails
 */
class ParsingError extends Error {
    constructor(message, errorText, language) {
        super(message);
        this.errorText = errorText;
        this.language = language;
        this.name = 'ParsingError';
    }
}
exports.ParsingError = ParsingError;
/**
 * Error thrown when LLM operation fails
 */
class LLMError extends Error {
    constructor(message, statusCode, retryable = true) {
        super(message);
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.name = 'LLMError';
    }
}
exports.LLMError = LLMError;
/**
 * Error thrown when analysis times out
 */
class AnalysisTimeoutError extends Error {
    constructor(message, iteration, maxIterations) {
        super(message);
        this.iteration = iteration;
        this.maxIterations = maxIterations;
        this.name = 'AnalysisTimeoutError';
    }
}
exports.AnalysisTimeoutError = AnalysisTimeoutError;
/**
 * Error thrown when input validation fails
 */
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=types.js.map