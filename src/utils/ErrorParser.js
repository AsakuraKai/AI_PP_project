"use strict";
/**
 * ErrorParser - Main router for language-specific error parsers
 *
 * Automatically detects error language and routes to appropriate parser:
 * - Kotlin errors → KotlinParser
 * - Gradle errors → GradleParser
 * - Auto-detection using LanguageDetector
 *
 * Design Philosophy:
 * - Single entry point for all error parsing
 * - Automatic language detection
 * - Extensible for new parsers
 * - Type-safe parser registration
 *
 * @example
 * const parser = ErrorParser.getInstance();
 * const error = parser.parse(errorText);
 * if (error) {
 *   console.log(`${error.type} at ${error.filePath}:${error.line}`);
 * }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorParser = void 0;
exports.parseError = parseError;
const LanguageDetector_1 = require("./LanguageDetector");
const KotlinParser_1 = require("./parsers/KotlinParser");
const GradleParser_1 = require("./parsers/GradleParser");
const JetpackComposeParser_1 = require("./parsers/JetpackComposeParser");
const XMLParser_1 = require("./parsers/XMLParser");
/**
 * Main error parser with automatic language detection
 */
class ErrorParser {
    constructor() {
        this.parsers = new Map();
        this.registerDefaultParsers();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ErrorParser.instance) {
            ErrorParser.instance = new ErrorParser();
        }
        return ErrorParser.instance;
    }
    /**
     * Register default parsers for supported languages
     */
    registerDefaultParsers() {
        this.registerParser('kotlin', new KotlinParser_1.KotlinParser());
        this.registerParser('gradle', new GradleParser_1.GradleParser());
        this.registerParser('compose', new JetpackComposeParser_1.JetpackComposeParser());
        this.registerParser('xml', new XMLParser_1.XMLParser());
        // Future: Java parser will be added here
    }
    /**
     * Register a custom parser for a language
     *
     * @param language - Language identifier
     * @param parser - Parser instance implementing LanguageParser interface
     */
    registerParser(language, parser) {
        this.parsers.set(language.toLowerCase(), parser);
    }
    /**
     * Parse error text with automatic language detection
     *
     * @param errorText - Raw error message
     * @param filePath - Optional file path hint for language detection
     * @returns ParsedError if successfully parsed, null otherwise
     */
    parse(errorText, filePath) {
        if (!errorText || typeof errorText !== 'string') {
            return null;
        }
        // Detect language
        const language = LanguageDetector_1.LanguageDetector.detect(errorText, filePath);
        if (language === 'unknown') {
            // Try all parsers in order of likelihood
            return this.tryAllParsers(errorText);
        }
        // Try detected language parser first
        const result = this.parseWithLanguage(errorText, language);
        if (result) {
            return result;
        }
        // If detected parser fails, try all parsers (handles mixed errors)
        // This is critical for mixed errors like Kotlin+Gradle or Compose+Kotlin
        // where LanguageDetector picks one but the other parser is more accurate
        return this.tryAllParsers(errorText);
    }
    /**
     * Parse error with explicit language specification
     *
     * @param errorText - Raw error message
     * @param language - Explicit language identifier
     * @returns ParsedError if successfully parsed, null otherwise
     */
    parseWithLanguage(errorText, language) {
        const parser = this.parsers.get(language.toLowerCase());
        if (!parser) {
            console.warn(`No parser registered for language: ${language}`);
            return null;
        }
        try {
            return parser.parse(errorText);
        }
        catch (error) {
            console.error(`Parser error for ${language}:`, error);
            return null;
        }
    }
    /**
     * Try all registered parsers until one succeeds
     * Used when language detection fails or for mixed errors
     */
    tryAllParsers(errorText) {
        // Try in order of most specific to least specific
        // Kotlin must come before Gradle since mixed errors have both
        const tryOrder = ['compose', 'kotlin', 'xml', 'gradle', 'java'];
        for (const language of tryOrder) {
            const parser = this.parsers.get(language);
            if (parser) {
                try {
                    const result = parser.parse(errorText);
                    if (result) {
                        return result;
                    }
                }
                catch (error) {
                    // Continue to next parser
                    continue;
                }
            }
        }
        // Try remaining parsers
        for (const [language, parser] of this.parsers.entries()) {
            if (!tryOrder.includes(language)) {
                try {
                    const result = parser.parse(errorText);
                    if (result) {
                        return result;
                    }
                }
                catch (error) {
                    // Continue to next parser
                    continue;
                }
            }
        }
        return null;
    }
    /**
     * Get list of supported languages
     */
    getSupportedLanguages() {
        return Array.from(this.parsers.keys());
    }
    /**
     * Check if a language is supported
     */
    isLanguageSupported(language) {
        return this.parsers.has(language.toLowerCase());
    }
    /**
     * Get parser for specific language (for testing or direct use)
     */
    getParser(language) {
        return this.parsers.get(language.toLowerCase());
    }
    /**
     * Clear all registered parsers (for testing)
     */
    clearParsers() {
        this.parsers.clear();
    }
    /**
     * Reset to default parsers (for testing)
     */
    resetParsers() {
        this.clearParsers();
        this.registerDefaultParsers();
    }
}
exports.ErrorParser = ErrorParser;
/**
 * Convenience function for quick parsing
 *
 * @param errorText - Raw error message
 * @param filePath - Optional file path hint
 * @returns ParsedError if successfully parsed, null otherwise
 */
function parseError(errorText, filePath) {
    return ErrorParser.getInstance().parse(errorText, filePath);
}
//# sourceMappingURL=ErrorParser.js.map