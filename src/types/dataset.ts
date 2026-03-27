/**
 * Dataset Type Definitions and Zod Validation Schemas
 *
 * Provides comprehensive validation for all dataset types:
 * - TestCase (Kotlin dataset)
 * - AndroidTestCase (Android dataset)
 * - PerformanceTestCase (Performance dataset)
 * - ExtendedTestCase (Extended dataset)
 */

import { z } from 'zod';

// ============================================================================
// Base Validation Schemas
// ============================================================================

const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
const CategorySchema = z.enum(['compose', 'xml', 'gradle', 'manifest', 'mixed', 'kotlin', 'multi-layer']);
const ComplexitySchema = z.enum(['simple', 'medium', 'complex', 'edge-case']);

// ============================================================================
// TestCase Schema (Kotlin Dataset)
// ============================================================================

export const TestCaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  errorText: z.string().min(10, 'Error text must be at least 10 characters'),
  expectedType: z.string().min(1, 'Expected type is required'),
  expectedRootCause: z.string().min(1, 'Expected root cause is required'),
  sampleCode: z.string().min(1, 'Sample code is required'),
  difficulty: DifficultySchema,
});

export type TestCase = z.infer<typeof TestCaseSchema>;

// ============================================================================
// AndroidTestCase Schema (Android Dataset)
// ============================================================================

export const AndroidTestCaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  category: CategorySchema,
  errorText: z.string().min(10, 'Error text must be at least 10 characters'),
  expectedType: z.string().min(1, 'Expected type is required'),
  expectedParser: z.string().min(1, 'Expected parser is required'),
  expectedRootCause: z.string().min(1, 'Expected root cause is required'),
  sampleCode: z.string().min(1, 'Sample code is required'),
  difficulty: DifficultySchema,
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

export type AndroidTestCase = z.infer<typeof AndroidTestCaseSchema>;

// ============================================================================
// PerformanceTestCase Schema (Performance Dataset)
// ============================================================================

export const PerformanceTestCaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  category: CategorySchema,
  errorType: z.string().min(1, 'Error type is required'),
  complexity: ComplexitySchema,
  description: z.string().min(1, 'Description is required'),
  error: z.string().min(10, 'Error text must be at least 10 characters'),
  expectedDuration: z.number().positive('Expected duration must be positive'),
  testObjectives: z.array(z.string()).min(1, 'At least one test objective is required'),
  sourceFile: z.string().optional(),
  stackTrace: z.string().optional(),
});

export type PerformanceTestCase = z.infer<typeof PerformanceTestCaseSchema>;

// ============================================================================
// ExtendedTestCase Schema (Extended Dataset)
// ============================================================================

const ExtendedCategorySchema = z.enum(['kotlin', 'gradle', 'compose', 'xml', 'manifest', 'build', 'resource', 'interop']);

export const ExtendedTestCaseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  category: ExtendedCategorySchema,
  errorType: z.string().min(1, 'Error type is required'),
  complexity: DifficultySchema,
  description: z.string().min(1, 'Description is required'),
  errorText: z.string().min(10, 'Error text must be at least 10 characters'),
  expectedRootCause: z.string().min(1, 'Expected root cause is required'),
  sampleCode: z.string().min(1, 'Sample code is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

export type ExtendedTestCase = z.infer<typeof ExtendedTestCaseSchema>;

// ============================================================================
// Dataset Statistics Schemas
// ============================================================================

export const DatasetStatsSchema = z.object({
  easy: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  hard: z.number().int().nonnegative(),
});

export const AndroidDatasetStatsSchema = z.object({
  compose: z.number().int().nonnegative(),
  xml: z.number().int().nonnegative(),
  gradle: z.number().int().nonnegative(),
  manifest: z.number().int().nonnegative(),
  mixed: z.number().int().nonnegative(),
});

export const PerformanceStatsSchema = z.object({
  byComplexity: z.object({
    simple: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    complex: z.number().int().nonnegative(),
  }).optional(),
  byCategory: z.record(z.number().int().nonnegative()).optional(),
});

export const ExtendedDatasetStatsSchema = z.object({
  byCategory: z.object({
    kotlin: z.number().int().nonnegative(),
    gradle: z.number().int().nonnegative(),
    compose: z.number().int().nonnegative(),
    xml: z.number().int().nonnegative(),
    manifest: z.number().int().nonnegative(),
  }).optional(),
  byComplexity: z.object({
    easy: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    hard: z.number().int().nonnegative(),
  }).optional(),
});

// ============================================================================
// Array Schemas for Full Datasets
// ============================================================================

export const TestDatasetSchema = z.array(TestCaseSchema);
export const AndroidTestDatasetSchema = z.array(AndroidTestCaseSchema);
export const PerformanceTestDatasetSchema = z.array(PerformanceTestCaseSchema);
export const ExtendedTestDatasetSchema = z.array(ExtendedTestCaseSchema);

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  datasetName: string;
  totalCases: number;
  validCases: number;
}

export interface FileValidationResult {
  exists: boolean;
  path: string;
  error?: string;
}
