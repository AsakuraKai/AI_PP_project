/**
 * Test script for Myers diff algorithm implementation
 * Tests the upgraded DiffFormatter with various scenarios
 */

import { DiffFormatter } from '../src/utils/DiffFormatter';

function testDiff(name: string, original: string, fixed: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${name}`);
  console.log('='.repeat(60));

  const formatter = new DiffFormatter();

  // Test unified format
  console.log('\n--- Unified Diff ---');
  const unified = formatter.format(original, fixed, 'unified');
  console.log(unified);

  // Test statistics
  const stats = formatter.getStatistics(original, fixed);
  console.log('\n--- Statistics ---');
  console.log(`Lines Added: ${stats.linesAdded}`);
  console.log(`Lines Removed: ${stats.linesRemoved}`);
  console.log(`Lines Unchanged: ${stats.linesUnchanged}`);
}

// Test Case 1: Simple single line change
testDiff(
  'Simple Edit',
  "function test() {\n  console.log('old');\n}",
  "function test() {\n  console.log('new');\n}"
);

// Test Case 2: Multiline insertion
testDiff(
  'Multiline Insert',
  "line1\nline2\nline4",
  "line1\nline2\nline3\nline4"
);

// Test Case 3: Multiline deletion
testDiff(
  'Multiline Delete',
  "line1\nline2\nline3\nline4\nline5",
  "line1\nline5"
);

// Test Case 4: Block replacement
testDiff(
  'Block Replacement',
  "if (x) {\n  doA();\n  doB();\n}",
  "if (x) {\n  doC();\n}"
);

// Test Case 5: Complex changes
testDiff(
  'Complex Changes',
  `class MyClass {
  private var x: Int = 0

  fun methodA() {
    println("A")
  }

  fun methodB() {
    println("B")
  }
}`,
  `class MyClass {
  private var x: Int = 0
  private var y: Int = 1

  fun methodA() {
    println("A modified")
  }

  fun methodC() {
    println("C")
  }
}`
);

// Test Case 6: No changes
testDiff(
  'No Changes',
  "unchanged line",
  "unchanged line"
);

// Test Case 7: Complete replacement
testDiff(
  'Complete Replacement',
  "old code\nold line 2",
  "new code\nnew line 2"
);

// Test Case 8: Whitespace - Leading/trailing spaces
testDiff(
  'Whitespace - Leading/Trailing',
  "function test() {\n  console.log('hello');\n}",
  "function test() {\n    console.log('hello');  \n}"
);

// Test Case 9: Whitespace - Tab vs spaces
testDiff(
  'Whitespace - Tabs vs Spaces',
  "if (x) {\n\tdoSomething();\n}",
  "if (x) {\n  doSomething();\n}"
);

// Test Case 10: Whitespace - Multiple spaces collapsed
testDiff(
  'Whitespace - Multiple Spaces',
  "const x    =    5;",
  "const x = 5;"
);

// Test Case 11: Whitespace - Mixed with real changes
testDiff(
  'Whitespace - Mixed with Real Changes',
  "function test() {\n  const x = 1;\n  return x;\n}",
  "function test() {\n    const y = 2;  \n  return y;\n}"
);

// Test Case 12: Whitespace - Only whitespace differences
testDiff(
  'Whitespace - Only Whitespace Differences',
  "line1\n  line2\nline3",
  "line1\n    line2  \nline3"
);

console.log('\n' + '='.repeat(60));
console.log('All tests completed!');
console.log('='.repeat(60));
