"use strict";
/**
 * Error Hasher for RCA Cache
 *
 * Generates consistent SHA-256 hashes for parsed errors to enable
 * fast cache lookups for repeat errors. Normalizes error messages
 * to improve cache hit rates for semantically similar errors.
 *
 * @module cache/ErrorHasher
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHasher = void 0;
const crypto = __importStar(require("crypto"));
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    includeFilePath: true,
    includeLineNumber: true,
    includeColumnNumber: false,
    algorithm: 'sha256'
};
/**
 * Error Hasher for generating cache keys
 *
 * Generates deterministic hashes for ParsedError objects to enable
 * efficient caching and lookup of previously analyzed errors.
 *
 * Key features:
 * - Normalizes error messages (lowercase, whitespace, numbers)
 * - Configurable hash components (file path, line number)
 * - SHA-256 for security and uniqueness
 * - Handles edge cases (null, undefined, empty strings)
 *
 * @example
 * ```typescript
 * const hasher = new ErrorHasher();
 * const hash = hasher.hash(parsedError);
 * // Returns: 'a1b2c3d4...' (64-char hex string)
 * ```
 */
class ErrorHasher {
    /**
     * Create a new ErrorHasher instance
     *
     * @param config - Configuration options
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Generate hash for a parsed error
     *
     * Creates a deterministic hash based on:
     * - Error type
     * - Normalized error message
     * - File path (optional)
     * - Line number (optional)
     *
     * @param error - Parsed error to hash
     * @returns SHA-256 hash as hex string
     *
     * @example
     * ```typescript
     * const hash = hasher.hash({
     *   type: 'lateinit',
     *   message: 'lateinit property user has not been initialized',
     *   filePath: 'MainActivity.kt',
     *   line: 45,
     *   language: 'kotlin'
     * });
     * ```
     */
    hash(error) {
        // Build key components
        const components = [
            error.type,
            this.normalize(error.message),
            error.language
        ];
        if (this.config.includeFilePath && error.filePath) {
            // Normalize file path: lowercase, forward slashes
            components.push(this.normalizeFilePath(error.filePath));
        }
        if (this.config.includeLineNumber && error.line > 0) {
            components.push(String(error.line));
        }
        if (this.config.includeColumnNumber && error.column && error.column > 0) {
            components.push(String(error.column));
        }
        // Join with separator and hash
        const key = components.join('|');
        return this.computeHash(key);
    }
    /**
     * Generate a hash for just the error message (without location)
     *
     * Useful for finding semantically similar errors across different files.
     *
     * @param error - Parsed error to hash
     * @returns SHA-256 hash as hex string
     */
    hashMessageOnly(error) {
        const components = [
            error.type,
            this.normalize(error.message),
            error.language
        ];
        const key = components.join('|');
        return this.computeHash(key);
    }
    /**
     * Generate a hash for custom content
     *
     * @param content - String content to hash
     * @returns Hash as hex string
     */
    hashString(content) {
        return this.computeHash(content);
    }
    /**
     * Normalize error message for consistent hashing
     *
     * Applies transformations:
     * - Convert to lowercase
     * - Collapse whitespace to single space
     * - Replace numbers with 'N' (for line numbers, memory addresses, etc.)
     * - Trim leading/trailing whitespace
     * - Remove ANSI escape codes
     *
     * @param message - Error message to normalize
     * @returns Normalized message
     */
    normalize(message) {
        if (!message) {
            return '';
        }
        return message
            // Remove ANSI escape codes (color codes in terminal output)
            .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
            // Replace UUIDs first (before other transformations affect them)
            .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID')
            // Replace memory addresses like 0x1a2b3c (before number replacement)
            .replace(/0x[a-f0-9]+/gi, 'HEXADDR')
            // Replace numbers with placeholder (preserves pattern without specific values)
            .replace(/\d+/g, 'N')
            // Convert to lowercase (after N replacement so N stays as n)
            .toLowerCase()
            // Collapse whitespace
            .replace(/\s+/g, ' ')
            // Trim
            .trim();
    }
    /**
     * Normalize file path for consistent hashing
     *
     * @param filePath - File path to normalize
     * @returns Normalized path
     */
    normalizeFilePath(filePath) {
        if (!filePath) {
            return '';
        }
        return filePath
            // Convert to lowercase
            .toLowerCase()
            // Normalize path separators to forward slash
            .replace(/\\/g, '/')
            // Remove leading ./ if present
            .replace(/^\.\//, '')
            // Remove trailing slash
            .replace(/\/$/, '');
    }
    /**
     * Compute hash using configured algorithm
     *
     * @param content - Content to hash
     * @returns Hash as hex string
     */
    computeHash(content) {
        return crypto
            .createHash(this.config.algorithm)
            .update(content, 'utf8')
            .digest('hex');
    }
    /**
     * Get the algorithm being used
     */
    getAlgorithm() {
        return this.config.algorithm;
    }
    /**
     * Get the current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Check if two errors would generate the same hash
     *
     * @param error1 - First error
     * @param error2 - Second error
     * @returns True if hashes match
     */
    areEqual(error1, error2) {
        return this.hash(error1) === this.hash(error2);
    }
}
exports.ErrorHasher = ErrorHasher;
//# sourceMappingURL=ErrorHasher.js.map