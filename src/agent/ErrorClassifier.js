"use strict";
/**
 * Error Classification System (Chunk 9 - Priority 2)
 * Classifies Android errors into categories for targeted analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorClassifier = exports.ErrorCategory = void 0;
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VERSION_DEPENDENCY"] = "version_dependency";
    ErrorCategory["MANIFEST_PERMISSION"] = "manifest_permission";
    ErrorCategory["BUILD_CACHE"] = "build_cache";
    ErrorCategory["PROGUARD_MINIFICATION"] = "proguard_minification";
    ErrorCategory["NAVIGATION_ROUTING"] = "navigation_routing";
    ErrorCategory["NETWORK_CONNECTIVITY"] = "network_connectivity";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
class ErrorClassifier {
    /**
     * Classify error into category based on patterns and keywords
     */
    classify(error) {
        const message = error.message.toLowerCase();
        const fullText = `${error.message} ${error.filePath || ''} ${error.stackTrace || ''}`.toLowerCase();
        // Check for version/dependency errors (highest priority)
        if (this.isVersionDependency(message, fullText)) {
            return {
                category: ErrorCategory.VERSION_DEPENDENCY,
                confidence: 0.9,
                reasoning: 'Error involves version numbers, dependencies, or compatibility issues'
            };
        }
        // Check for manifest/permission errors
        if (this.isManifestPermission(message, fullText)) {
            return {
                category: ErrorCategory.MANIFEST_PERMISSION,
                confidence: 0.85,
                reasoning: 'Error involves missing permissions or AndroidManifest.xml'
            };
        }
        // Check for build cache errors
        if (this.isBuildCache(message, fullText)) {
            return {
                category: ErrorCategory.BUILD_CACHE,
                confidence: 0.8,
                reasoning: 'Error involves corrupted cache or build state'
            };
        }
        // Check for ProGuard/R8 errors
        if (this.isProguardMinification(message, fullText)) {
            return {
                category: ErrorCategory.PROGUARD_MINIFICATION,
                confidence: 0.85,
                reasoning: 'Error involves obfuscation, minification, or missing classes in release build'
            };
        }
        // Check for Navigation/Routing errors
        if (this.isNavigationRouting(message, fullText)) {
            return {
                category: ErrorCategory.NAVIGATION_ROUTING,
                confidence: 0.8,
                reasoning: 'Error involves Jetpack Navigation arguments or routing'
            };
        }
        // Check for network/connectivity errors
        if (this.isNetworkConnectivity(message, fullText)) {
            return {
                category: ErrorCategory.NETWORK_CONNECTIVITY,
                confidence: 0.75,
                reasoning: 'Error involves network connection or repository access'
            };
        }
        // Default to unknown
        return {
            category: ErrorCategory.UNKNOWN,
            confidence: 0.5,
            reasoning: 'Could not classify error into known categories'
        };
    }
    isVersionDependency(message, fullText) {
        const versionPatterns = [
            /could not find.*:.*:[\d.]+/,
            /version conflict/,
            /incompatible.*version/,
            /failed to resolve/,
            /dependency.*not found/,
            /agp|android gradle plugin/,
            /kotlin.*version/,
            /gradle.*version/,
            /androidx\./,
            /com\.android\./,
            /implementation.*not found/,
            /api.*not found/,
            /unresolved reference/i
        ];
        return versionPatterns.some(pattern => pattern.test(message) || pattern.test(fullText));
    }
    isManifestPermission(message, fullText) {
        const manifestPatterns = [
            /permission.*denied/,
            /requires permission/,
            /missing permission/,
            /uses-permission/,
            /androidmanifest\.xml/,
            /security exception.*permission/,
            /permission.*not granted/,
            /android\.permission\./,
            /manifest merger/,
            /requires.*in manifest/
        ];
        return manifestPatterns.some(pattern => pattern.test(message) || pattern.test(fullText));
    }
    isBuildCache(message, fullText) {
        const cachePatterns = [
            /cache.*corrupt/,
            /could not open.*cache/,
            /gradle daemon/,
            /build cache/,
            /incremental.*compilation.*failed/,
            /\.gradle.*cache/,
            /daemon.*died/,
            /cache.*invalid/,
            /could not.*lock/,
            /build state/
        ];
        return cachePatterns.some(pattern => pattern.test(message) || pattern.test(fullText));
    }
    isProguardMinification(message, fullText) {
        const proguardPatterns = [
            /proguard/,
            /r8/,
            /minification/,
            /obfuscation/,
            /classnotfoundexception.*release/,
            /nosuchmethoderror.*release/,
            /shrinking/,
            /-keep.*class/,
            /proguard-rules/,
            /missing.*in release/
        ];
        return proguardPatterns.some(pattern => pattern.test(message) || pattern.test(fullText));
    }
    isNavigationRouting(message, fullText) {
        const navigationPatterns = [
            /navigation/,
            /navhost/,
            /argument.*mismatch/,
            /destination.*not found/,
            /safeargs/,
            /navigation.*argument/,
            /deep link/,
            /navcontroller/,
            /composable.*argument/,
            /route.*argument/
        ];
        return navigationPatterns.some(pattern => pattern.test(message) || pattern.test(fullText));
    }
    isNetworkConnectivity(message, fullText) {
        const networkPatterns = [
            /connection.*refused/,
            /connection.*timeout/,
            /unable to resolve host/,
            /network.*error/,
            /failed to connect/,
            /socket.*timeout/,
            /could not.*download/,
            /maven.*repository/,
            /ssl.*error/,
            /certificate/
        ];
        return networkPatterns.some(pattern => pattern.test(message) || pattern.test(fullText));
    }
}
exports.ErrorClassifier = ErrorClassifier;
//# sourceMappingURL=ErrorClassifier.js.map