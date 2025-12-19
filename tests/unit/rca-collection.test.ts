/**
 * Unit tests for RCA Collection Schemas
 * 
 * Tests schema validation, type guards, and utility functions.
 */

import {
  RCADocument,
  RCAMetadata,
  RCADocumentSchema,
  RCAMetadataSchema,
  isRCADocument,
  isRCAMetadata,
  calculateQualityScore,
  extractMetadata
} from '../../src/db/schemas/rca-collection';

describe('RCA Collection Schemas', () => {
  describe('RCADocumentSchema', () => {
    it('should validate valid RCA document', () => {
      const validDoc: RCADocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'lateinit property user has not been initialized',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Property accessed before initialization',
        fix_guidelines: ['Initialize in onCreate()'],
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(() => RCADocumentSchema.parse(validDoc)).not.toThrow();
    });
    
    it('should reject document with invalid UUID', () => {
      const invalidDoc: any = {
        id: 'not-a-uuid',
        error_message: 'Test error',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(() => RCADocumentSchema.parse(invalidDoc)).toThrow('valid UUID');
    });
    
    it('should reject document with empty error message', () => {
      const invalidDoc: any = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: '',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(() => RCADocumentSchema.parse(invalidDoc)).toThrow('cannot be empty');
    });
    
    it('should reject document with invalid language', () => {
      const invalidDoc: any = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'test',
        language: 'python', // Not in enum
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(() => RCADocumentSchema.parse(invalidDoc)).toThrow('kotlin, java, xml, or gradle');
    });
    
    it('should reject document with short root cause', () => {
      const invalidDoc: any = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Short', // Less than 10 chars
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(() => RCADocumentSchema.parse(invalidDoc)).toThrow('at least 10 characters');
    });
    
    it('should reject document with empty fix guidelines', () => {
      const invalidDoc: any = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: [], // Empty array
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(() => RCADocumentSchema.parse(invalidDoc)).toThrow('at least one fix guideline');
    });
    
    it('should reject document with confidence out of range', () => {
      const invalidDoc: any = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 1.5, // > 1.0
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(() => RCADocumentSchema.parse(invalidDoc)).toThrow('between 0 and 1');
    });
    
    it('should accept document with optional fields', () => {
      const validDoc: RCADocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1', 'Fix 2'],
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: true,
        quality_score: 0.95,
        file_path: 'MainActivity.kt',
        line_number: 45,
        code_context: 'val name = user.name',
        metadata: { custom: 'data' }
      };
      
      expect(() => RCADocumentSchema.parse(validDoc)).not.toThrow();
    });
  });
  
  describe('RCAMetadataSchema', () => {
    it('should validate valid metadata', () => {
      const validMeta: RCAMetadata = {
        language: 'kotlin',
        error_type: 'lateinit',
        confidence: 0.9,
        quality_score: 0.9,
        created_at: Date.now(),
        user_validated: false
      };
      
      expect(() => RCAMetadataSchema.parse(validMeta)).not.toThrow();
    });
    
    it('should accept metadata with optional file extension', () => {
      const validMeta: RCAMetadata = {
        language: 'kotlin',
        error_type: 'lateinit',
        confidence: 0.9,
        quality_score: 0.9,
        created_at: Date.now(),
        user_validated: false,
        file_extension: 'kt'
      };
      
      expect(() => RCAMetadataSchema.parse(validMeta)).not.toThrow();
    });
    
    it('should reject metadata with invalid confidence', () => {
      const invalidMeta: any = {
        language: 'kotlin',
        error_type: 'lateinit',
        confidence: -0.5, // Negative
        quality_score: 0.9,
        created_at: Date.now(),
        user_validated: false
      };
      
      expect(() => RCAMetadataSchema.parse(invalidMeta)).toThrow();
    });
  });
  
  describe('isRCADocument()', () => {
    it('should return true for valid document', () => {
      const validDoc: RCADocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'test',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: Date.now(),
        user_validated: false,
        quality_score: 0.9
      };
      
      expect(isRCADocument(validDoc)).toBe(true);
    });
    
    it('should return false for invalid document', () => {
      const invalidDoc = {
        id: 'not-uuid',
        error_message: ''
      };
      
      expect(isRCADocument(invalidDoc)).toBe(false);
    });
    
    it('should return false for null', () => {
      expect(isRCADocument(null)).toBe(false);
    });
    
    it('should return false for undefined', () => {
      expect(isRCADocument(undefined)).toBe(false);
    });
  });
  
  describe('isRCAMetadata()', () => {
    it('should return true for valid metadata', () => {
      const validMeta: RCAMetadata = {
        language: 'kotlin',
        error_type: 'lateinit',
        confidence: 0.9,
        quality_score: 0.9,
        created_at: Date.now(),
        user_validated: false
      };
      
      expect(isRCAMetadata(validMeta)).toBe(true);
    });
    
    it('should return false for invalid metadata', () => {
      const invalidMeta = {
        language: 'kotlin',
        confidence: 'high' // Wrong type
      };
      
      expect(isRCAMetadata(invalidMeta)).toBe(false);
    });
  });
  
  describe('calculateQualityScore()', () => {
    it('should use confidence as base score', () => {
      const rca: Partial<RCADocument> = {
        confidence: 0.7,
        user_validated: false,
        created_at: Date.now()
      };
      
      const quality = calculateQualityScore(rca);
      
      expect(quality).toBeCloseTo(0.7, 1);
    });
    
    it('should boost score for user validation', () => {
      const rca: Partial<RCADocument> = {
        confidence: 0.7,
        user_validated: true,
        created_at: Date.now()
      };
      
      const quality = calculateQualityScore(rca);
      
      expect(quality).toBeCloseTo(0.9, 1); // 0.7 + 0.2
    });
    
    it('should apply age penalty after 6 months', () => {
      const sixMonthsAgo = Date.now() - (7 * 30 * 24 * 60 * 60 * 1000); // 7 months
      
      const rca: Partial<RCADocument> = {
        confidence: 0.8,
        user_validated: false,
        created_at: sixMonthsAgo
      };
      
      const quality = calculateQualityScore(rca);
      
      expect(quality).toBeCloseTo(0.4, 1); // 0.8 * 0.5
    });
    
    it('should combine user validation and age penalty', () => {
      const sixMonthsAgo = Date.now() - (7 * 30 * 24 * 60 * 60 * 1000);
      
      const rca: Partial<RCADocument> = {
        confidence: 0.6,
        user_validated: true,
        created_at: sixMonthsAgo
      };
      
      const quality = calculateQualityScore(rca);
      
      expect(quality).toBeCloseTo(0.4, 1); // (0.6 + 0.2) * 0.5
    });
    
    it('should clamp score to 1.0 maximum', () => {
      const rca: Partial<RCADocument> = {
        confidence: 0.9,
        user_validated: true, // Would be 1.1 without clamping
        created_at: Date.now()
      };
      
      const quality = calculateQualityScore(rca);
      
      expect(quality).toBe(1.0);
    });
    
    it('should clamp score to 0.0 minimum', () => {
      const rca: Partial<RCADocument> = {
        confidence: 0.0,
        user_validated: false,
        created_at: Date.now()
      };
      
      const quality = calculateQualityScore(rca);
      
      expect(quality).toBeGreaterThanOrEqual(0.0);
    });
    
    it('should use default confidence if missing', () => {
      const rca: Partial<RCADocument> = {
        user_validated: false,
        created_at: Date.now()
      };
      
      const quality = calculateQualityScore(rca);
      
      expect(quality).toBeCloseTo(0.5, 1);
    });
  });
  
  describe('extractMetadata()', () => {
    it('should extract basic metadata fields', () => {
      const doc: RCADocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: 123456789,
        user_validated: true,
        quality_score: 0.95
      };
      
      const metadata = extractMetadata(doc);
      
      expect(metadata).toEqual({
        language: 'kotlin',
        error_type: 'lateinit',
        confidence: 0.9,
        quality_score: 0.95,
        created_at: 123456789,
        user_validated: true
      });
    });
    
    it('should extract file extension from file path', () => {
      const doc: RCADocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: 123456789,
        user_validated: false,
        quality_score: 0.9,
        file_path: 'src/main/MainActivity.kt'
      };
      
      const metadata = extractMetadata(doc);
      
      expect(metadata.file_extension).toBe('kt');
    });
    
    it('should handle file path without extension', () => {
      const doc: RCADocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: 123456789,
        user_validated: false,
        quality_score: 0.9,
        file_path: 'README'
      };
      
      const metadata = extractMetadata(doc);
      
      expect(metadata.file_extension).toBeUndefined();
    });
    
    it('should handle missing file path', () => {
      const doc: RCADocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        error_message: 'Test error',
        error_type: 'lateinit',
        language: 'kotlin',
        root_cause: 'Test cause that is long enough',
        fix_guidelines: ['Fix 1'],
        confidence: 0.9,
        created_at: 123456789,
        user_validated: false,
        quality_score: 0.9
      };
      
      const metadata = extractMetadata(doc);
      
      expect(metadata.file_extension).toBeUndefined();
    });
  });
});
