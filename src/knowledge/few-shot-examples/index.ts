/**
 * Few-Shot Examples Index (Updated - Phase 4 Improvements)
 * Exports all category-specific examples
 */

export { MANIFEST_PERMISSION_EXAMPLES } from './manifest-examples';
export { BUILD_CACHE_EXAMPLES } from './cache-examples';
export { PROGUARD_EXAMPLES } from './proguard-examples';
export { NAVIGATION_EXAMPLES } from './navigation-examples';
export { NETWORK_CONNECTIVITY_EXAMPLES } from './network-examples';
export { KOTLIN_NPE_EXAMPLES } from './kotlin-npe-examples';
export { COMPOSE_DEPRECATION_EXAMPLES } from './compose-examples';
export { XML_LAYOUT_EXAMPLES } from './xml-layout-examples';

// Re-export for convenience
import { MANIFEST_PERMISSION_EXAMPLES } from './manifest-examples';
import { BUILD_CACHE_EXAMPLES } from './cache-examples';
import { PROGUARD_EXAMPLES } from './proguard-examples';
import { NAVIGATION_EXAMPLES } from './navigation-examples';
import { NETWORK_CONNECTIVITY_EXAMPLES } from './network-examples';
import { KOTLIN_NPE_EXAMPLES } from './kotlin-npe-examples';
import { COMPOSE_DEPRECATION_EXAMPLES } from './compose-examples';
import { XML_LAYOUT_EXAMPLES } from './xml-layout-examples';
import { FewShotExample } from '../FewShotExampleService';

/**
 * All category-specific examples (43 total)
 * Updated: Added 8 new examples for Phase 4
 */
export const ALL_CATEGORY_EXAMPLES: FewShotExample[] = [
  ...MANIFEST_PERMISSION_EXAMPLES,      // 10 examples
  ...BUILD_CACHE_EXAMPLES,              // 5 examples
  ...PROGUARD_EXAMPLES,                 // 10 examples
  ...NAVIGATION_EXAMPLES,               // 5 examples
  ...NETWORK_CONNECTIVITY_EXAMPLES,     // 5 examples
  ...KOTLIN_NPE_EXAMPLES,               // 3 examples (NEW - Phase 4)
  ...COMPOSE_DEPRECATION_EXAMPLES,      // 3 examples (NEW - Phase 4)
  ...XML_LAYOUT_EXAMPLES,               // 2 examples (NEW - Phase 4)
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
  'kotlin_npe': KOTLIN_NPE_EXAMPLES,
  'compose_deprecation': COMPOSE_DEPRECATION_EXAMPLES,
  'xml_layout': XML_LAYOUT_EXAMPLES,
  'version_dependency': [], // Will be populated from existing JSON examples
  'unknown': [],
  
  // Uppercase (example errorType values) - for compatibility
  'MANIFEST_PERMISSION': MANIFEST_PERMISSION_EXAMPLES,
  'BUILD_CACHE': BUILD_CACHE_EXAMPLES,
  'PROGUARD_MINIFICATION': PROGUARD_EXAMPLES,
  'NAVIGATION_ROUTING': NAVIGATION_EXAMPLES,
  'NETWORK_CONNECTIVITY': NETWORK_CONNECTIVITY_EXAMPLES,
  'KOTLIN_NPE': KOTLIN_NPE_EXAMPLES,
  'COMPOSE_DEPRECATION': COMPOSE_DEPRECATION_EXAMPLES,
  'XML_LAYOUT': XML_LAYOUT_EXAMPLES,
};
