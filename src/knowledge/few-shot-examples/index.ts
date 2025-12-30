/**
 * Few-Shot Examples Index (Chunk 9 - Completion)
 * Exports all category-specific examples
 */

export { MANIFEST_PERMISSION_EXAMPLES } from './manifest-examples';
export { BUILD_CACHE_EXAMPLES } from './cache-examples';
export { PROGUARD_EXAMPLES } from './proguard-examples';
export { NAVIGATION_EXAMPLES } from './navigation-examples';
export { NETWORK_CONNECTIVITY_EXAMPLES } from './network-examples';

// Re-export for convenience
import { MANIFEST_PERMISSION_EXAMPLES } from './manifest-examples';
import { BUILD_CACHE_EXAMPLES } from './cache-examples';
import { PROGUARD_EXAMPLES } from './proguard-examples';
import { NAVIGATION_EXAMPLES } from './navigation-examples';
import { NETWORK_CONNECTIVITY_EXAMPLES } from './network-examples';
import { FewShotExample } from '../FewShotExampleService';

/**
 * All category-specific examples (35 total)
 * Updated: Added 5 network connectivity examples
 */
export const ALL_CATEGORY_EXAMPLES: FewShotExample[] = [
  ...MANIFEST_PERMISSION_EXAMPLES,      // 10 examples
  ...BUILD_CACHE_EXAMPLES,              // 5 examples
  ...PROGUARD_EXAMPLES,                 // 10 examples
  ...NAVIGATION_EXAMPLES,               // 5 examples
  ...NETWORK_CONNECTIVITY_EXAMPLES,     // 5 examples (NEW - Chunk 9 Completion)
];

/**
 * Examples by category for quick lookup
 * Keys match ErrorCategory enum values AND example errorType
 */
export const EXAMPLES_BY_CATEGORY: Record<string, FewShotExample[]> = {
  // Lowercase (ErrorCategory enum values)
  'manifest_permission': MANIFEST_PERMISSION_EXAMPLES,
  'build_cache': BUILD_CACHE_EXAMPLES,
  'proguard_minification': PROGUARD_EXAMPLES,
  'navigation_routing': NAVIGATION_EXAMPLES,
  'network_connectivity': NETWORK_CONNECTIVITY_EXAMPLES,
  'version_dependency': [], // Will be populated from existing JSON examples
  'unknown': [],
  
  // Uppercase (example errorType values) - for compatibility
  'MANIFEST_PERMISSION': MANIFEST_PERMISSION_EXAMPLES,
  'BUILD_CACHE': BUILD_CACHE_EXAMPLES,
  'PROGUARD_MINIFICATION': PROGUARD_EXAMPLES,
  'NAVIGATION_ROUTING': NAVIGATION_EXAMPLES,
  'NETWORK_CONNECTIVITY': NETWORK_CONNECTIVITY_EXAMPLES,
};
