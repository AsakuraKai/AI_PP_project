"use strict";
/**
 * Few-Shot Examples Index (Updated - Phase 4 Improvements)
 * Exports all category-specific examples
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXAMPLES_BY_CATEGORY = exports.ALL_CATEGORY_EXAMPLES = exports.XML_LAYOUT_EXAMPLES = exports.COMPOSE_DEPRECATION_EXAMPLES = exports.KOTLIN_NPE_EXAMPLES = exports.NETWORK_CONNECTIVITY_EXAMPLES = exports.NAVIGATION_EXAMPLES = exports.PROGUARD_EXAMPLES = exports.BUILD_CACHE_EXAMPLES = exports.MANIFEST_PERMISSION_EXAMPLES = void 0;
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
var kotlin_npe_examples_1 = require("./kotlin-npe-examples");
Object.defineProperty(exports, "KOTLIN_NPE_EXAMPLES", { enumerable: true, get: function () { return kotlin_npe_examples_1.KOTLIN_NPE_EXAMPLES; } });
var compose_examples_1 = require("./compose-examples");
Object.defineProperty(exports, "COMPOSE_DEPRECATION_EXAMPLES", { enumerable: true, get: function () { return compose_examples_1.COMPOSE_DEPRECATION_EXAMPLES; } });
var xml_layout_examples_1 = require("./xml-layout-examples");
Object.defineProperty(exports, "XML_LAYOUT_EXAMPLES", { enumerable: true, get: function () { return xml_layout_examples_1.XML_LAYOUT_EXAMPLES; } });
// Re-export for convenience
var manifest_examples_2 = require("./manifest-examples");
var cache_examples_2 = require("./cache-examples");
var proguard_examples_2 = require("./proguard-examples");
var navigation_examples_2 = require("./navigation-examples");
var network_examples_2 = require("./network-examples");
var kotlin_npe_examples_2 = require("./kotlin-npe-examples");
var compose_examples_2 = require("./compose-examples");
var xml_layout_examples_2 = require("./xml-layout-examples");
/**
 * All category-specific examples (43 total)
 * Updated: Added 8 new examples for Phase 4
 */
exports.ALL_CATEGORY_EXAMPLES = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], manifest_examples_2.MANIFEST_PERMISSION_EXAMPLES, true), cache_examples_2.BUILD_CACHE_EXAMPLES, true), proguard_examples_2.PROGUARD_EXAMPLES, true), navigation_examples_2.NAVIGATION_EXAMPLES, true), network_examples_2.NETWORK_CONNECTIVITY_EXAMPLES, true), kotlin_npe_examples_2.KOTLIN_NPE_EXAMPLES, true), compose_examples_2.COMPOSE_DEPRECATION_EXAMPLES, true), xml_layout_examples_2.XML_LAYOUT_EXAMPLES, true);
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
    'kotlin_npe': kotlin_npe_examples_2.KOTLIN_NPE_EXAMPLES,
    'compose_deprecation': compose_examples_2.COMPOSE_DEPRECATION_EXAMPLES,
    'xml_layout': xml_layout_examples_2.XML_LAYOUT_EXAMPLES,
    'version_dependency': [], // Will be populated from existing JSON examples
    'unknown': [],
    // Uppercase (example errorType values) - for compatibility
    'MANIFEST_PERMISSION': manifest_examples_2.MANIFEST_PERMISSION_EXAMPLES,
    'BUILD_CACHE': cache_examples_2.BUILD_CACHE_EXAMPLES,
    'PROGUARD_MINIFICATION': proguard_examples_2.PROGUARD_EXAMPLES,
    'NAVIGATION_ROUTING': navigation_examples_2.NAVIGATION_EXAMPLES,
    'NETWORK_CONNECTIVITY': network_examples_2.NETWORK_CONNECTIVITY_EXAMPLES,
    'KOTLIN_NPE': kotlin_npe_examples_2.KOTLIN_NPE_EXAMPLES,
    'COMPOSE_DEPRECATION': compose_examples_2.COMPOSE_DEPRECATION_EXAMPLES,
    'XML_LAYOUT': xml_layout_examples_2.XML_LAYOUT_EXAMPLES,
};
