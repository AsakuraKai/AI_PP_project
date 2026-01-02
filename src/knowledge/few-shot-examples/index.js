"use strict";
/**
 * Few-Shot Examples Index (Chunk 9 - Completion)
 * Exports all category-specific examples
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXAMPLES_BY_CATEGORY = exports.ALL_CATEGORY_EXAMPLES = exports.NETWORK_CONNECTIVITY_EXAMPLES = exports.NAVIGATION_EXAMPLES = exports.PROGUARD_EXAMPLES = exports.BUILD_CACHE_EXAMPLES = exports.MANIFEST_PERMISSION_EXAMPLES = void 0;
var manifest_examples_1 = require("./manifest-examples");
Object.defineProperty(exports, "MANIFEST_PERMISSION_EXAMPLES", { enumerable: true, get: function () { return manifest_examples_1.MANIFEST_PERMISSION_EXAMPLES; } });
var cache_examples_1 = require("./cache-examples");
Object.defineProperty(exports, "BUILD_CACHE_EXAMPLES", { enumerable: true, get: function () { return cache_examples_1.BUILD_CACHE_EXAMPLES; } });
var proguard_examples_1 = require("./proguard-examples");
Object.defineProperty(exports, "PROGUARD_EXAMPLES", { enumerable: true, get: function () { return proguard_examples_1.PROGUARD_EXAMPLES; } });
var navigation_examples_1 = require("./navigation-examples");
Object.defineProperty(exports, "NAVIGATION_EXAMPLES", { enumerable: true, get: function () { return navigation_examples_1.NAVIGATION_EXAMPLES; } });
var network_examples_1 = require("./network-examples");
Object.defineProperty(exports, "NETWORK_CONNECTIVITY_EXAMPLES", { enumerable: true, get: function () { return network_examples_1.NETWORK_CONNECTIVITY_EXAMPLES; } });
// Re-export for convenience
const manifest_examples_2 = require("./manifest-examples");
const cache_examples_2 = require("./cache-examples");
const proguard_examples_2 = require("./proguard-examples");
const navigation_examples_2 = require("./navigation-examples");
const network_examples_2 = require("./network-examples");
/**
 * All category-specific examples (35 total)
 * Updated: Added 5 network connectivity examples
 */
exports.ALL_CATEGORY_EXAMPLES = [
    ...manifest_examples_2.MANIFEST_PERMISSION_EXAMPLES, // 10 examples
    ...cache_examples_2.BUILD_CACHE_EXAMPLES, // 5 examples
    ...proguard_examples_2.PROGUARD_EXAMPLES, // 10 examples
    ...navigation_examples_2.NAVIGATION_EXAMPLES, // 5 examples
    ...network_examples_2.NETWORK_CONNECTIVITY_EXAMPLES, // 5 examples (NEW - Chunk 9 Completion)
];
/**
 * Examples by category for quick lookup
 * Keys match ErrorCategory enum values AND example errorType
 */
exports.EXAMPLES_BY_CATEGORY = {
    // Lowercase (ErrorCategory enum values)
    'manifest_permission': manifest_examples_2.MANIFEST_PERMISSION_EXAMPLES,
    'build_cache': cache_examples_2.BUILD_CACHE_EXAMPLES,
    'proguard_minification': proguard_examples_2.PROGUARD_EXAMPLES,
    'navigation_routing': navigation_examples_2.NAVIGATION_EXAMPLES,
    'network_connectivity': network_examples_2.NETWORK_CONNECTIVITY_EXAMPLES,
    'version_dependency': [], // Will be populated from existing JSON examples
    'unknown': [],
    // Uppercase (example errorType values) - for compatibility
    'MANIFEST_PERMISSION': manifest_examples_2.MANIFEST_PERMISSION_EXAMPLES,
    'BUILD_CACHE': cache_examples_2.BUILD_CACHE_EXAMPLES,
    'PROGUARD_MINIFICATION': proguard_examples_2.PROGUARD_EXAMPLES,
    'NAVIGATION_ROUTING': navigation_examples_2.NAVIGATION_EXAMPLES,
    'NETWORK_CONNECTIVITY': network_examples_2.NETWORK_CONNECTIVITY_EXAMPLES,
};
//# sourceMappingURL=index.js.map