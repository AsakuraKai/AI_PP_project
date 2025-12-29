/**
 * Few-Shot Examples Index (Chunk 9)
 * Exports all category-specific examples
 */

export { MANIFEST_PERMISSION_EXAMPLES } from './manifest-examples';
export { BUILD_CACHE_EXAMPLES } from './cache-examples';
export { PROGUARD_EXAMPLES } from './proguard-examples';
export { NAVIGATION_EXAMPLES } from './navigation-examples';

// Re-export for convenience
import { MANIFEST_PERMISSION_EXAMPLES } from './manifest-examples';
import { BUILD_CACHE_EXAMPLES } from './cache-examples';
import { PROGUARD_EXAMPLES } from './proguard-examples';
import { NAVIGATION_EXAMPLES } from './navigation-examples';
import { FewShotExample } from '../FewShotExampleService';

/**
 * All category-specific examples (30 total)
 */
export const ALL_CATEGORY_EXAMPLES: FewShotExample[] = [
  ...MANIFEST_PERMISSION_EXAMPLES,  // 10 examples
  ...BUILD_CACHE_EXAMPLES,          // 5 examples
  ...PROGUARD_EXAMPLES,             // 10 examples
  ...NAVIGATION_EXAMPLES,           // 5 examples
];

/**
 * Examples by category for quick lookup
 * Keys match ErrorCategory enum values
 */
export const EXAMPLES_BY_CATEGORY: Record<string, FewShotExample[]> = {
  'manifest_permission': MANIFEST_PERMISSION_EXAMPLES,
  'build_cache': BUILD_CACHE_EXAMPLES,
  'proguard_minification': PROGUARD_EXAMPLES,
  'navigation_routing': NAVIGATION_EXAMPLES,
  'version_dependency': [], // Will be populated from existing examples
  'network_connectivity': [], // Will be populated from existing examples
  'unknown': [],
};
