/**
 * Unit tests for ErrorHasher
 * 
 * Tests hash generation, normalization, and configuration options.
 */

import { ErrorHasher, ErrorHasherConfig } from '../../src/cache/ErrorHasher';
import { ParsedError } from '../../src/types';

describe('ErrorHasher', () => {
  let hasher: ErrorHasher;
  
  beforeEach(() => {
    hasher = new ErrorHasher();
  });
  
  describe('constructor', () => {
    it('should create instance with default configuration', () => {
      const h = new ErrorHasher();
      expect(h.getAlgorithm()).toBe('sha256');
      expect(h.getConfig().includeFilePath).toBe(true);
      expect(h.getConfig().includeLineNumber).toBe(true);
      expect(h.getConfig().includeColumnNumber).toBe(false);
    });
    
    it('should accept custom configuration', () => {
      const config: ErrorHasherConfig = {
        includeFilePath: false,
        includeLineNumber: false,
        algorithm: 'sha512'
      };
      const h = new ErrorHasher(config);
      expect(h.getConfig().includeFilePath).toBe(false);
      expect(h.getConfig().includeLineNumber).toBe(false);
      expect(h.getAlgorithm()).toBe('sha512');
    });
    
    it('should merge partial config with defaults', () => {
      const h = new ErrorHasher({ includeFilePath: false });
      expect(h.getConfig().includeFilePath).toBe(false);
      expect(h.getConfig().includeLineNumber).toBe(true); // default
    });
  });
  
  describe('hash()', () => {
    const baseError: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin'
    };
    
    it('should generate consistent hash for same error', () => {
      const hash1 = hasher.hash(baseError);
      const hash2 = hasher.hash(baseError);
      expect(hash1).toBe(hash2);
    });
    
    it('should generate 64-character hex string (SHA-256)', () => {
      const hash = hasher.hash(baseError);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should generate different hashes for different error types', () => {
      const error2 = { ...baseError, type: 'npe' };
      expect(hasher.hash(baseError)).not.toBe(hasher.hash(error2));
    });
    
    it('should generate different hashes for different messages', () => {
      const error2 = { ...baseError, message: 'NullPointerException' };
      expect(hasher.hash(baseError)).not.toBe(hasher.hash(error2));
    });
    
    it('should generate different hashes for different files', () => {
      const error2 = { ...baseError, filePath: 'UserActivity.kt' };
      expect(hasher.hash(baseError)).not.toBe(hasher.hash(error2));
    });
    
    it('should generate different hashes for different line numbers', () => {
      const error2 = { ...baseError, line: 100 };
      expect(hasher.hash(baseError)).not.toBe(hasher.hash(error2));
    });
    
    it('should generate different hashes for different languages', () => {
      const error2 = { ...baseError, language: 'java' as const };
      expect(hasher.hash(baseError)).not.toBe(hasher.hash(error2));
    });
    
    it('should handle zero line number', () => {
      const errorZeroLine = { ...baseError, line: 0 };
      const hash = hasher.hash(errorZeroLine);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should handle empty file path', () => {
      const errorEmptyPath = { ...baseError, filePath: '' };
      const hash = hasher.hash(errorEmptyPath);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should include column number when configured', () => {
      const h = new ErrorHasher({ includeColumnNumber: true });
      const error1: ParsedError = { ...baseError, column: 10 };
      const error2: ParsedError = { ...baseError, column: 20 };
      expect(h.hash(error1)).not.toBe(h.hash(error2));
    });
    
    it('should exclude file path when configured', () => {
      const h = new ErrorHasher({ includeFilePath: false });
      const error1 = { ...baseError, filePath: 'File1.kt' };
      const error2 = { ...baseError, filePath: 'File2.kt' };
      expect(h.hash(error1)).toBe(h.hash(error2));
    });
    
    it('should exclude line number when configured', () => {
      const h = new ErrorHasher({ includeLineNumber: false });
      const error1 = { ...baseError, line: 10 };
      const error2 = { ...baseError, line: 100 };
      expect(h.hash(error1)).toBe(h.hash(error2));
    });
  });
  
  describe('hashMessageOnly()', () => {
    const baseError: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin'
    };
    
    it('should generate same hash regardless of file path', () => {
      const error1 = { ...baseError, filePath: 'File1.kt' };
      const error2 = { ...baseError, filePath: 'File2.kt' };
      expect(hasher.hashMessageOnly(error1)).toBe(hasher.hashMessageOnly(error2));
    });
    
    it('should generate same hash regardless of line number', () => {
      const error1 = { ...baseError, line: 10 };
      const error2 = { ...baseError, line: 100 };
      expect(hasher.hashMessageOnly(error1)).toBe(hasher.hashMessageOnly(error2));
    });
    
    it('should generate different hash for different messages', () => {
      const error2 = { ...baseError, message: 'Different error message' };
      expect(hasher.hashMessageOnly(baseError)).not.toBe(hasher.hashMessageOnly(error2));
    });
    
    it('should generate different hash for different types', () => {
      const error2 = { ...baseError, type: 'npe' };
      expect(hasher.hashMessageOnly(baseError)).not.toBe(hasher.hashMessageOnly(error2));
    });
  });
  
  describe('hashString()', () => {
    it('should generate hash for arbitrary string', () => {
      const hash = hasher.hashString('test content');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should generate consistent hash for same string', () => {
      const hash1 = hasher.hashString('test content');
      const hash2 = hasher.hashString('test content');
      expect(hash1).toBe(hash2);
    });
    
    it('should generate different hash for different strings', () => {
      const hash1 = hasher.hashString('content1');
      const hash2 = hasher.hashString('content2');
      expect(hash1).not.toBe(hash2);
    });
    
    it('should handle empty string', () => {
      const hash = hasher.hashString('');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
  
  describe('normalize()', () => {
    it('should convert to lowercase', () => {
      const result = hasher.normalize('ERROR MESSAGE');
      expect(result).toBe('error message');
    });
    
    it('should collapse whitespace', () => {
      const result = hasher.normalize('error  message   with    spaces');
      expect(result).toBe('error message with spaces');
    });
    
    it('should replace numbers with N', () => {
      const result = hasher.normalize('at line 45 column 12');
      expect(result).toBe('at line n column n');
    });
    
    it('should replace memory addresses', () => {
      const result = hasher.normalize('at 0x7fff5fbff8c8');
      expect(result).toBe('at hexaddr');
    });
    
    it('should replace UUIDs', () => {
      const result = hasher.normalize('id: 550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe('id: uuid');
    });
    
    it('should trim leading and trailing whitespace', () => {
      const result = hasher.normalize('  error message  ');
      expect(result).toBe('error message');
    });
    
    it('should remove ANSI escape codes', () => {
      const result = hasher.normalize('\x1B[31mError\x1B[0m message');
      expect(result).toBe('error message');
    });
    
    it('should handle empty string', () => {
      expect(hasher.normalize('')).toBe('');
    });
    
    it('should handle null/undefined-like input', () => {
      expect(hasher.normalize(null as any)).toBe('');
      expect(hasher.normalize(undefined as any)).toBe('');
    });
    
    it('should normalize complex error message consistently', () => {
      const msg1 = 'NullPointerException at MainActivity.kt:45';
      const msg2 = 'NullPointerException at UserActivity.kt:123';
      const norm1 = hasher.normalize(msg1);
      const norm2 = hasher.normalize(msg2);
      // After normalization, line numbers become N
      expect(norm1).toBe('nullpointerexception at mainactivity.kt:n');
      expect(norm2).toBe('nullpointerexception at useractivity.kt:n');
    });
  });
  
  describe('normalizeFilePath()', () => {
    it('should convert to lowercase', () => {
      expect(hasher.normalizeFilePath('MainActivity.kt')).toBe('mainactivity.kt');
    });
    
    it('should normalize backslashes to forward slashes', () => {
      expect(hasher.normalizeFilePath('src\\main\\kotlin\\App.kt')).toBe('src/main/kotlin/app.kt');
    });
    
    it('should remove leading ./', () => {
      expect(hasher.normalizeFilePath('./src/App.kt')).toBe('src/app.kt');
    });
    
    it('should remove trailing slash', () => {
      expect(hasher.normalizeFilePath('src/main/')).toBe('src/main');
    });
    
    it('should handle empty string', () => {
      expect(hasher.normalizeFilePath('')).toBe('');
    });
    
    it('should handle null/undefined-like input', () => {
      expect(hasher.normalizeFilePath(null as any)).toBe('');
      expect(hasher.normalizeFilePath(undefined as any)).toBe('');
    });
  });
  
  describe('areEqual()', () => {
    const baseError: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin'
    };
    
    it('should return true for identical errors', () => {
      expect(hasher.areEqual(baseError, { ...baseError })).toBe(true);
    });
    
    it('should return false for different errors', () => {
      const error2 = { ...baseError, line: 100 };
      expect(hasher.areEqual(baseError, error2)).toBe(false);
    });
    
    it('should return true for errors that normalize to same hash', () => {
      const error1 = { ...baseError, message: 'error at line 45' };
      const error2 = { ...baseError, message: 'error at line 99' };
      // Numbers normalize to N, so these should be equal
      expect(hasher.areEqual(error1, error2)).toBe(true);
    });
  });
  
  describe('algorithm configuration', () => {
    it('should support sha512', () => {
      const h = new ErrorHasher({ algorithm: 'sha512' });
      const hash = h.hashString('test');
      // SHA-512 produces 128-character hex string
      expect(hash).toMatch(/^[a-f0-9]{128}$/);
    });
    
    it('should support md5', () => {
      const h = new ErrorHasher({ algorithm: 'md5' });
      const hash = h.hashString('test');
      // MD5 produces 32-character hex string
      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });
  });
});
