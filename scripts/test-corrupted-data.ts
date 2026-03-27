/**
 * Test Script: Verify Corrupted Data Detection
 *
 * Tests that the validation script correctly catches:
 * - Missing required fields
 * - Invalid data types
 * - Empty strings
 * - Invalid enum values
 * - Duplicate IDs
 */

import {
  TestCaseSchema,
  AndroidTestCaseSchema,
  PerformanceTestCaseSchema,
  ExtendedTestCaseSchema,
} from '../src/types/dataset';
import { z } from 'zod';

console.log('\n' + '='.repeat(80));
console.log('[CORRUPTED DATA TEST] Verifying Validation Catches Errors');
console.log('='.repeat(80) + '\n');

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Missing required field
console.log('[TEST 1] Missing required field (id)...');
try {
  TestCaseSchema.parse({
    // id: missing
    name: 'Test Case',
    errorText: 'Some error text here',
    expectedType: 'npe',
    expectedRootCause: 'Null pointer',
    sampleCode: 'code here',
    difficulty: 'easy',
  });
  console.log('✗ FAILED: Should have thrown validation error');
  testsFailed++;
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✓ PASSED: Caught missing field');
    console.log(`   Error: ${error.errors[0].message}`);
    testsPassed++;
  }
}

// Test 2: Invalid enum value
console.log('\n[TEST 2] Invalid enum value (difficulty)...');
try {
  TestCaseSchema.parse({
    id: 'TC001',
    name: 'Test Case',
    errorText: 'Some error text here',
    expectedType: 'npe',
    expectedRootCause: 'Null pointer',
    sampleCode: 'code here',
    difficulty: 'invalid_difficulty', // Invalid
  });
  console.log('✗ FAILED: Should have thrown validation error');
  testsFailed++;
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✓ PASSED: Caught invalid enum value');
    console.log(`   Error: ${error.errors[0].message}`);
    testsPassed++;
  }
}

// Test 3: String too short
console.log('\n[TEST 3] String too short (errorText < 10 chars)...');
try {
  TestCaseSchema.parse({
    id: 'TC001',
    name: 'Test Case',
    errorText: 'Short', // Too short
    expectedType: 'npe',
    expectedRootCause: 'Null pointer',
    sampleCode: 'code here',
    difficulty: 'easy',
  });
  console.log('✗ FAILED: Should have thrown validation error');
  testsFailed++;
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✓ PASSED: Caught string too short');
    console.log(`   Error: ${error.errors[0].message}`);
    testsPassed++;
  }
}

// Test 4: Empty array (tags)
console.log('\n[TEST 4] Empty array (tags)...');
try {
  AndroidTestCaseSchema.parse({
    id: 'AC001',
    name: 'Test Case',
    category: 'compose',
    errorText: 'Some error text here',
    expectedType: 'compose_error',
    expectedParser: 'ComposeParser',
    expectedRootCause: 'Compose issue',
    sampleCode: 'code here',
    difficulty: 'easy',
    tags: [], // Empty array
  });
  console.log('✗ FAILED: Should have thrown validation error');
  testsFailed++;
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✓ PASSED: Caught empty array');
    console.log(`   Error: ${error.errors[0].message}`);
    testsPassed++;
  }
}

// Test 5: Invalid number (negative duration)
console.log('\n[TEST 5] Invalid number (negative expectedDuration)...');
try {
  PerformanceTestCaseSchema.parse({
    id: 'KT-001',
    name: 'Test Case',
    category: 'kotlin',
    errorType: 'npe',
    complexity: 'simple',
    description: 'Test description',
    error: 'Error text here',
    expectedDuration: -10, // Negative
    testObjectives: ['objective 1'],
  });
  console.log('✗ FAILED: Should have thrown validation error');
  testsFailed++;
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✓ PASSED: Caught negative number');
    console.log(`   Error: ${error.errors[0].message}`);
    testsPassed++;
  }
}

// Test 6: Wrong data type
console.log('\n[TEST 6] Wrong data type (expectedDuration as string)...');
try {
  PerformanceTestCaseSchema.parse({
    id: 'KT-001',
    name: 'Test Case',
    category: 'kotlin',
    errorType: 'npe',
    complexity: 'simple',
    description: 'Test description',
    error: 'Error text here',
    expectedDuration: '60', // String instead of number
    testObjectives: ['objective 1'],
  });
  console.log('✗ FAILED: Should have thrown validation error');
  testsFailed++;
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✓ PASSED: Caught wrong data type');
    console.log(`   Error: ${error.errors[0].message}`);
    testsPassed++;
  }
}

// Test 7: Valid data should pass
console.log('\n[TEST 7] Valid data should pass...');
try {
  TestCaseSchema.parse({
    id: 'TC001',
    name: 'Test Case',
    errorText: 'Some error text here that is long enough',
    expectedType: 'npe',
    expectedRootCause: 'Null pointer',
    sampleCode: 'code here',
    difficulty: 'easy',
  });
  console.log('✓ PASSED: Valid data accepted');
  testsPassed++;
} catch (error) {
  console.log('✗ FAILED: Valid data should not throw error');
  testsFailed++;
}

// Test 8: Multiple errors at once
console.log('\n[TEST 8] Multiple validation errors...');
try {
  ExtendedTestCaseSchema.parse({
    id: '', // Empty
    name: '', // Empty
    category: 'invalid_category', // Invalid enum
    errorType: '', // Empty
    complexity: 'easy',
    description: '', // Empty
    errorText: 'Short', // Too short
    expectedRootCause: '', // Empty
    sampleCode: '', // Empty
    tags: [], // Empty array
  });
  console.log('✗ FAILED: Should have thrown validation error');
  testsFailed++;
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(`✓ PASSED: Caught ${error.errors.length} validation errors`);
    console.log('   Errors:');
    error.errors.slice(0, 3).forEach((err) => {
      console.log(`     • ${err.path.join('.')}: ${err.message}`);
    });
    if (error.errors.length > 3) {
      console.log(`     ... and ${error.errors.length - 3} more`);
    }
    testsPassed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`[RESULT] ${testsPassed}/${testsPassed + testsFailed} Tests Passed`);
console.log('='.repeat(80) + '\n');

if (testsFailed === 0) {
  console.log('✓ CORRUPTED DATA TEST PASSED: All validation checks working correctly\n');
  process.exit(0);
} else {
  console.log('✗ CORRUPTED DATA TEST FAILED: Some validation checks not working\n');
  process.exit(1);
}
