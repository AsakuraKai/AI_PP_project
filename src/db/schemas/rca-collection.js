"use strict";
/**
 * RCA Collection Schema Definitions
 *
 * Defines the structure and validation rules for RCA documents stored in ChromaDB.
 * All documents must conform to these schemas for consistency and reliability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RCAMetadataSchema = exports.RCADocumentSchema = void 0;
exports.isRCADocument = isRCADocument;
exports.isRCAMetadata = isRCAMetadata;
exports.calculateQualityScore = calculateQualityScore;
exports.extractMetadata = extractMetadata;
const zod_1 = require("zod");
/**
 * Zod schema for validating RCADocument
 *
 * Ensures all documents conform to expected structure before storage.
 */
exports.RCADocumentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Document ID must be a valid UUID'),
    error_message: zod_1.z.string().min(1, 'Error message cannot be empty'),
    error_type: zod_1.z.string().min(1, 'Error type cannot be empty'),
    language: zod_1.z.enum(['kotlin', 'java', 'xml', 'gradle'], {
        errorMap: () => ({ message: 'Language must be kotlin, java, xml, or gradle' })
    }),
    root_cause: zod_1.z.string().min(10, 'Root cause must be at least 10 characters'),
    fix_guidelines: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'Must provide at least one fix guideline'),
    confidence: zod_1.z.number()
        .min(0, 'Confidence must be between 0 and 1')
        .max(1, 'Confidence must be between 0 and 1'),
    created_at: zod_1.z.number()
        .int('Created timestamp must be an integer')
        .positive('Created timestamp must be positive'),
    user_validated: zod_1.z.boolean(),
    quality_score: zod_1.z.number()
        .min(0, 'Quality score must be between 0 and 1')
        .max(1, 'Quality score must be between 0 and 1'),
    // Optional fields
    file_path: zod_1.z.string().optional(),
    line_number: zod_1.z.number().int().positive().optional(),
    code_context: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
/**
 * Zod schema for validating RCAMetadata
 */
exports.RCAMetadataSchema = zod_1.z.object({
    language: zod_1.z.string(),
    error_type: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
    quality_score: zod_1.z.number().min(0).max(1),
    created_at: zod_1.z.number().int().positive(),
    user_validated: zod_1.z.boolean(),
    file_extension: zod_1.z.string().optional()
});
/**
 * Type guard to check if an object is a valid RCADocument
 */
function isRCADocument(obj) {
    try {
        exports.RCADocumentSchema.parse(obj);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Type guard to check if an object is a valid RCAMetadata
 */
function isRCAMetadata(obj) {
    try {
        exports.RCAMetadataSchema.parse(obj);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Calculate quality score for an RCA document
 *
 * Quality score is based on:
 * - Confidence score (70% weight)
 * - User validation (20% boost if validated)
 * - Age penalty (50% reduction after 6 months)
 *
 * @param rca - RCA document to calculate quality for
 * @returns Quality score between 0.0 and 1.0
 */
function calculateQualityScore(rca) {
    let quality = rca.confidence || 0.5;
    // Boost for user validation
    if (rca.user_validated) {
        quality += 0.2;
    }
    // Age penalty (6 months = 50% reduction)
    if (rca.created_at) {
        const age = Date.now() - rca.created_at;
        const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
        if (age > sixMonths) {
            quality *= 0.5;
        }
    }
    // Clamp to 0.0-1.0
    return Math.min(Math.max(quality, 0.0), 1.0);
}
/**
 * Extract metadata from RCA document for ChromaDB storage
 *
 * @param rca - Complete RCA document
 * @returns Metadata object for ChromaDB filtering
 */
function extractMetadata(rca) {
    const metadata = {
        language: rca.language,
        error_type: rca.error_type,
        confidence: rca.confidence,
        quality_score: rca.quality_score,
        created_at: rca.created_at,
        user_validated: rca.user_validated
    };
    // Extract file extension if file path provided
    if (rca.file_path) {
        const match = rca.file_path.match(/\.([^.]+)$/);
        if (match) {
            metadata.file_extension = match[1];
        }
    }
    return metadata;
}
//# sourceMappingURL=rca-collection.js.map