/**
 * Build Script: Compile TypeScript Examples to JSON
 * 
 * This script compiles the TypeScript few-shot examples into a JSON file
 * for reliable runtime loading without module resolution issues.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import all TypeScript examples
import { MANIFEST_PERMISSION_EXAMPLES } from '../src/knowledge/few-shot-examples/manifest-examples';
import { BUILD_CACHE_EXAMPLES } from '../src/knowledge/few-shot-examples/cache-examples';
import { PROGUARD_EXAMPLES } from '../src/knowledge/few-shot-examples/proguard-examples';
import { NAVIGATION_EXAMPLES } from '../src/knowledge/few-shot-examples/navigation-examples';
import { NETWORK_CONNECTIVITY_EXAMPLES } from '../src/knowledge/few-shot-examples/network-examples';

const ALL_CATEGORY_EXAMPLES = [
  ...MANIFEST_PERMISSION_EXAMPLES,
  ...BUILD_CACHE_EXAMPLES,
  ...PROGUARD_EXAMPLES,
  ...NAVIGATION_EXAMPLES,
  ...NETWORK_CONNECTIVITY_EXAMPLES,
];

const EXAMPLES_BY_CATEGORY = {
  // Lowercase (ErrorCategory enum values)
  'manifest_permission': MANIFEST_PERMISSION_EXAMPLES,
  'build_cache': BUILD_CACHE_EXAMPLES,
  'proguard_minification': PROGUARD_EXAMPLES,
  'navigation_routing': NAVIGATION_EXAMPLES,
  'network_connectivity': NETWORK_CONNECTIVITY_EXAMPLES,
  'version_dependency': [],
  'unknown': [],
  
  // Uppercase (example errorType values) - for compatibility
  'MANIFEST_PERMISSION': MANIFEST_PERMISSION_EXAMPLES,
  'BUILD_CACHE': BUILD_CACHE_EXAMPLES,
  'PROGUARD_MINIFICATION': PROGUARD_EXAMPLES,
  'NAVIGATION_ROUTING': NAVIGATION_EXAMPLES,
  'NETWORK_CONNECTIVITY': NETWORK_CONNECTIVITY_EXAMPLES,
};

// Output paths
const outputPath = path.join(__dirname, '../src/knowledge/few-shot-examples-compiled.json');

// Compile to JSON
const compiledData = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  description: 'Compiled TypeScript few-shot examples for runtime loading',
  totalExamples: ALL_CATEGORY_EXAMPLES.length,
  allExamples: ALL_CATEGORY_EXAMPLES,
  examplesByCategory: EXAMPLES_BY_CATEGORY,
};

// Write to file
fs.writeFileSync(outputPath, JSON.stringify(compiledData, null, 2), 'utf-8');

console.log('[OK] Successfully compiled TypeScript examples to JSON');
console.log(`   Output: ${outputPath}`);
console.log(`   Total examples: ${ALL_CATEGORY_EXAMPLES.length}`);
console.log(`   Categories: ${Object.keys(EXAMPLES_BY_CATEGORY).filter(k => !k.match(/[A-Z]/) && k !== 'version_dependency' && k !== 'unknown').length}`);
console.log('');
console.log('[STATS] Breakdown:');
console.log(`   - Manifest Permission: ${MANIFEST_PERMISSION_EXAMPLES.length} examples`);
console.log(`   - Build Cache: ${BUILD_CACHE_EXAMPLES.length} examples`);
console.log(`   - ProGuard/Minification: ${PROGUARD_EXAMPLES.length} examples`);
console.log(`   - Navigation/Routing: ${NAVIGATION_EXAMPLES.length} examples`);
console.log(`   - Network Connectivity: ${NETWORK_CONNECTIVITY_EXAMPLES.length} examples`);
