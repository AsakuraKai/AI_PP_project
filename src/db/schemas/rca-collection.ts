/**
 * RCA Collection Schema Definitions
 * 
 * Defines the structure and validation rules for RCA documents stored in ChromaDB.
 * All documents must conform to these schemas for consistency and reliability.
 */

import { z } from 'zod';
import { QualityScorer } from '../QualityScorer';

/**
 * RCA Document stored in ChromaDB
 * 
 * Represents a complete root cause analysis result that can be retrieved
 * for similar errors in the future.
 */
export interface RCADocument {
  /** Unique document ID (UUID v4) */
  id: string;
  
  /** Original error message that triggered analysis */
  error_message: string;
  
  /** Error type classification (e.g., 'lateinit', 'npe', 'compilation_error') */
  error_type: string;
  
  /** Programming language of the error */
  language: 'kotlin' | 'java' | 'xml' | 'gradle';
  
  /** Identified root cause explanation */
  root_cause: string;
  
  /** Step-by-step fix guidelines */
  fix_guidelines: string[];
  
  /** Confidence score from analysis (0.0-1.0) */
  confidence: number;
  
  /** Timestamp of document creation (milliseconds since epoch) */
  created_at: number;
  
  /** Whether user validated this RCA as helpful */
  user_validated: boolean;
  
  /** Calculated quality score (0.0-1.0) */
  quality_score: number;
  
  /** Optional: File path where error occurred */
  file_path?: string;
  
  /** Optional: Line number where error occurred */
  line_number?: number;
  
  /** Optional: Code context at error location */
  code_context?: string;
  
  /** Optional: Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Metadata stored separately in ChromaDB for filtering
 * 
 * ChromaDB allows filtering by metadata fields, so we extract
 * key fields for efficient querying.
 */
export interface RCAMetadata {
  /** Programming language */
  language: string;
  
  /** Error type for filtering */
  error_type: string;
  
  /** Confidence score for ranking */
  confidence: number;
  
  /** Quality score for filtering low-quality results */
  quality_score: number;
  
  /** Creation timestamp for age-based filtering */
  created_at: number;
  
  /** User validation status */
  user_validated: boolean;
  
  /** Optional: File extension for additional filtering */
  file_extension?: string;
}

/**
 * Zod schema for validating RCADocument
 * 
 * Ensures all documents conform to expected structure before storage.
 */
export const RCADocumentSchema = z.object({
  id: z.string().uuid('Document ID must be a valid UUID'),
  
  error_message: z.string().min(1, 'Error message cannot be empty'),
  
  error_type: z.string().min(1, 'Error type cannot be empty'),
  
  language: z.enum(['kotlin', 'java', 'xml', 'gradle'], {
    errorMap: () => ({ message: 'Language must be kotlin, java, xml, or gradle' })
  }),
  
  root_cause: z.string().min(10, 'Root cause must be at least 10 characters'),
  
  fix_guidelines: z.array(z.string().min(1)).min(1, 'Must provide at least one fix guideline'),
  
  confidence: z.number()
    .min(0, 'Confidence must be between 0 and 1')
    .max(1, 'Confidence must be between 0 and 1'),
  
  created_at: z.number()
    .int('Created timestamp must be an integer')
    .positive('Created timestamp must be positive'),
  
  user_validated: z.boolean(),
  
  quality_score: z.number()
    .min(0, 'Quality score must be between 0 and 1')
    .max(1, 'Quality score must be between 0 and 1'),
  
  // Optional fields
  file_path: z.string().optional(),
  line_number: z.number().int().positive().optional(),
  code_context: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Zod schema for validating RCAMetadata
 */
export const RCAMetadataSchema = z.object({
  language: z.string(),
  error_type: z.string(),
  confidence: z.number().min(0).max(1),
  quality_score: z.number().min(0).max(1),
  created_at: z.number().int().positive(),
  user_validated: z.boolean(),
  file_extension: z.string().optional()
});

/**
 * Type guard to check if an object is a valid RCADocument
 */
export function isRCADocument(obj: any): obj is RCADocument {
  try {
    RCADocumentSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if an object is a valid RCAMetadata
 */
export function isRCAMetadata(obj: any): obj is RCAMetadata {
  try {
    RCAMetadataSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

// Singleton QualityScorer instance for consistent quality calculations
const qualityScorer = new QualityScorer();

/**
 * Calculate quality score for an RCA document
 * 
 * Uses QualityScorer for consistent quality calculations across the application.
 * Quality score is based on:
 * - Base confidence score (0-1)
 * - User validation boost (+0.2 if validated)
 * - Age penalty (up to -50% for documents older than 6 months)
 * - Usage bonus (logarithmic scaling based on helpfulness count)
 * 
 * @param rca - RCA document to calculate quality for
 * @returns Quality score between 0.0 and 1.0
 */
export function calculateQualityScore(rca: Partial<RCADocument>): number {
  const ageMs = rca.created_at ? Date.now() - rca.created_at : 0;
  
  return qualityScorer.calculateQuality({
    baseConfidence: rca.confidence || 0.5,
    userValidated: rca.user_validated || false,
    ageMs,
    usageCount: 0 // Can be enhanced later with actual usage tracking
  });
}

/**
 * Extract metadata from RCA document for ChromaDB storage
 * 
 * @param rca - Complete RCA document
 * @returns Metadata object for ChromaDB filtering
 */
export function extractMetadata(rca: RCADocument): RCAMetadata {
  const metadata: RCAMetadata = {
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
