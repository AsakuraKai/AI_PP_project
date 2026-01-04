/**
 * TemplateEngine - Provides pre-defined response templates per error type
 * 
 * ITERATION 11: Template-based approach
 * Reduces LLM reasoning by providing structured templates to fill in
 * 
 * Design: Each error type has a specific template with placeholders
 * LLM only needs to extract values, not generate structure
 */

import { ParsedError } from '../types';

export interface ResponseTemplate {
  thoughtTemplate: string;
  rootCauseTemplate: string;
  fixGuidelinesTemplate: string[];
  placeholders: string[];
}

export class TemplateEngine {
  private templates: Record<string, ResponseTemplate> = {
    'gradle-dependency': {
      thoughtTemplate: 'Gradle dependency error: [DEPENDENCY_NAME] [ERROR_TYPE]',
      rootCauseTemplate: '[DEPENDENCY_NAME] version [VERSION] is [ISSUE] at [FILE_PATH] line [LINE_NUMBER]',
      fixGuidelinesTemplate: [
        '1. Open [FILE_PATH] at line [LINE_NUMBER]',
        '2. Before:\n```gradle\n[OLD_CODE]\n```\nAfter:\n```gradle\n[NEW_CODE]\n```',
        '3. Run ./gradlew clean build to verify'
      ],
      placeholders: ['DEPENDENCY_NAME', 'ERROR_TYPE', 'VERSION', 'ISSUE', 'FILE_PATH', 'LINE_NUMBER', 'OLD_CODE', 'NEW_CODE']
    },
    
    'kotlin-npe': {
      thoughtTemplate: 'NullPointerException in [FILE_NAME]: [VARIABLE_NAME] is null when accessed',
      rootCauseTemplate: '[VARIABLE_NAME] (declared at [DECLARATION_FILE]:[DECLARATION_LINE]) is null when accessed at [ACCESS_FILE]:[ACCESS_LINE] in [FUNCTION_NAME]()',
      fixGuidelinesTemplate: [
        '1. Modify [ACCESS_FILE] at line [ACCESS_LINE]',
        '2. Before:\n```kotlin\n[OLD_CODE]\n```\nAfter:\n```kotlin\n[NEW_CODE]\n```',
        '3. Test by running the app and navigating to [TEST_SCENARIO]'
      ],
      placeholders: ['FILE_NAME', 'VARIABLE_NAME', 'DECLARATION_FILE', 'DECLARATION_LINE', 'ACCESS_FILE', 'ACCESS_LINE', 'FUNCTION_NAME', 'OLD_CODE', 'NEW_CODE', 'TEST_SCENARIO']
    },
    
    'compose-deprecation': {
      thoughtTemplate: 'Compose Material2 API is deprecated: [API_NAME]',
      rootCauseTemplate: '[API_NAME] from Material2 (androidx.compose.material) is deprecated at [FILE_PATH]:[LINE_NUMBER]. Material3 migration required.',
      fixGuidelinesTemplate: [
        '1. Update [FILE_PATH] at line [LINE_NUMBER]',
        '2. Before:\n```kotlin\nimport androidx.compose.material.[API_NAME]\n[OLD_CODE]\n```\nAfter:\n```kotlin\nimport androidx.compose.material3.[API_NAME]\n[NEW_CODE]\n```',
        '3. Add dependency: implementation("androidx.compose.material3:material3:[VERSION]") in app/build.gradle.kts',
        '4. Build and test the affected UI screen'
      ],
      placeholders: ['API_NAME', 'FILE_PATH', 'LINE_NUMBER', 'OLD_CODE', 'NEW_CODE', 'VERSION']
    },
    
    'xml-layout': {
      thoughtTemplate: 'XML layout error in [FILE_NAME]: [ERROR_TYPE]',
      rootCauseTemplate: '[ERROR_DESCRIPTION] in [FILE_PATH] at line [LINE_NUMBER]. [SPECIFIC_ISSUE].',
      fixGuidelinesTemplate: [
        '1. Open [FILE_PATH] at line [LINE_NUMBER]',
        '2. Before:\n```xml\n[OLD_CODE]\n```\nAfter:\n```xml\n[NEW_CODE]\n```',
        '3. Sync project and rebuild'
      ],
      placeholders: ['FILE_NAME', 'ERROR_TYPE', 'ERROR_DESCRIPTION', 'FILE_PATH', 'LINE_NUMBER', 'SPECIFIC_ISSUE', 'OLD_CODE', 'NEW_CODE']
    },
    
    'manifest-permission': {
      thoughtTemplate: 'Missing Android permission: [PERMISSION_NAME]',
      rootCauseTemplate: 'App requires [PERMISSION_NAME] permission for [FEATURE_DESCRIPTION], but it is not declared in AndroidManifest.xml.',
      fixGuidelinesTemplate: [
        '1. Open AndroidManifest.xml at line [LINE_NUMBER] (before <application> tag)',
        '2. Add permission:\n```xml\n<uses-permission android:name="[PERMISSION_NAME]" />\n```',
        '3. For dangerous permissions, request at runtime in [ACTIVITY_NAME].kt',
        '4. Test by running app and using [FEATURE_NAME] feature'
      ],
      placeholders: ['PERMISSION_NAME', 'FEATURE_DESCRIPTION', 'LINE_NUMBER', 'ACTIVITY_NAME', 'FEATURE_NAME']
    },
    
    'gradle-network': {
      thoughtTemplate: 'Gradle network failure: [ERROR_TYPE]',
      rootCauseTemplate: 'Gradle failed to download [DEPENDENCY_NAME] due to [NETWORK_ISSUE]. [ROOT_CAUSE].',
      fixGuidelinesTemplate: [
        '1. Check network connectivity and proxy settings',
        '2. If behind corporate proxy, configure gradle.properties with [PROXY_CONFIG]',
        '3. Try offline mode: ./gradlew build --offline',
        '4. Clear cache: rm -rf ~/.gradle/caches/ && ./gradlew clean build'
      ],
      placeholders: ['ERROR_TYPE', 'DEPENDENCY_NAME', 'NETWORK_ISSUE', 'ROOT_CAUSE', 'PROXY_CONFIG']
    },
    
    'gradle-cache': {
      thoughtTemplate: 'Gradle cache corruption detected',
      rootCauseTemplate: 'Gradle build cache is corrupted at [CACHE_PATH]. [CORRUPTION_TYPE] causing [ERROR_SYMPTOM].',
      fixGuidelinesTemplate: [
        '1. Clear Gradle cache: rm -rf ~/.gradle/caches/',
        '2. Clean project: ./gradlew clean',
        '3. Rebuild: ./gradlew build --no-build-cache',
        '4. If issue persists, invalidate Android Studio caches: File > Invalidate Caches > Invalidate and Restart'
      ],
      placeholders: ['CACHE_PATH', 'CORRUPTION_TYPE', 'ERROR_SYMPTOM']
    },
    
    'proguard': {
      thoughtTemplate: 'ProGuard/R8 obfuscation error: [CLASS_NAME] missing',
      rootCauseTemplate: '[CLASS_NAME] is being obfuscated/removed by R8 at runtime. Class is used via reflection or from library at [USAGE_LOCATION] but not kept.',
      fixGuidelinesTemplate: [
        '1. Add ProGuard rule to proguard-rules.pro',
        '2. Add keep rule:\n```proguard\n-keep class [CLASS_NAME] { *; }\n-keepclassmembers class [CLASS_NAME] { *; }\n```',
        '3. For libraries, add: -keep class [PACKAGE_NAME].** { *; }',
        '4. Clean and rebuild in release mode: ./gradlew clean assembleRelease'
      ],
      placeholders: ['CLASS_NAME', 'USAGE_LOCATION', 'PACKAGE_NAME']
    },
    
    'navigation': {
      thoughtTemplate: 'Navigation argument mismatch in [DESTINATION]',
      rootCauseTemplate: 'NavGraph defines argument [ARG_NAME] as [EXPECTED_TYPE] at [NAV_FILE]:[NAV_LINE], but [SOURCE_SCREEN] passes [ACTUAL_TYPE] at [SOURCE_FILE]:[SOURCE_LINE]',
      fixGuidelinesTemplate: [
        '1. Update [SOURCE_FILE] at line [SOURCE_LINE]',
        '2. Before:\n```kotlin\n[OLD_CODE]\n```\nAfter:\n```kotlin\n[NEW_CODE]\n```',
        '3. Ensure NavGraph defines: argument("[ARG_NAME]") { type = [EXPECTED_TYPE] }',
        '4. Test navigation flow from [SOURCE_SCREEN] to [DESTINATION]'
      ],
      placeholders: ['DESTINATION', 'ARG_NAME', 'EXPECTED_TYPE', 'NAV_FILE', 'NAV_LINE', 'SOURCE_SCREEN', 'ACTUAL_TYPE', 'SOURCE_FILE', 'SOURCE_LINE', 'OLD_CODE', 'NEW_CODE']
    }
  };

  /**
   * Get template-based system prompt for LLM
   */
  getTemplatePrompt(errorCategory: string): string {
    const template = this.templates[errorCategory];
    if (!template) {
      return this.getGenericTemplate();
    }

    return `You are an Android/Kotlin debugging assistant using structured templates.

**ERROR CATEGORY**: ${errorCategory}

**YOUR TASK**: Fill in the template placeholders with specific values from the error.

**TEMPLATE STRUCTURE**:
Thought: ${template.thoughtTemplate}
Root Cause: ${template.rootCauseTemplate}
Fix Guidelines:
${template.fixGuidelinesTemplate.map((line, i) => `  ${i + 1}. ${line}`).join('\n')}

**PLACEHOLDERS TO FILL**: ${template.placeholders.join(', ')}

**INSTRUCTIONS**:
1. Extract values for each placeholder from the error message and context
2. Replace [PLACEHOLDER] with specific values (NO placeholders in output!)
3. For code blocks, use actual code from the files (read them if needed)
4. For line numbers, use exact locations (NO GUESSING!)
5. Be specific and precise

**OUTPUT FORMAT**:
{
  "thought": "filled template with real values",
  "action": null,
  "rootCause": "filled template with real values",
  "fixGuidelines": ["filled array with real values"],
  "confidence": 0.0-1.0
}

CRITICAL: Replace ALL [PLACEHOLDERS] with actual values. If you can't find a value, use action to gather it first.`;
  }

  /**
   * Generic template for unknown error types
   */
  private getGenericTemplate(): string {
    return `You are an Android/Kotlin debugging assistant. Analyze the error and provide:

1. **Thought**: Brief analysis with file:line reference
2. **Root Cause**: Specific cause with file:line reference  
3. **Fix Guidelines**: Step-by-step with Before/After code examples
4. **Confidence**: 0.0-1.0

**FORMAT**:
{
  "thought": "Error analysis",
  "action": null,
  "rootCause": "[specific cause] at [file:line]",
  "fixGuidelines": [
    "1. Open [file] at line [number]",
    "2. Before:\\n\\\`\\\`\\\`kotlin\\n[old code]\\n\\\`\\\`\\\`\\nAfter:\\n\\\`\\\`\\\`kotlin\\n[new code]\\n\\\`\\\`\\\`",
    "3. Test by [verification]"
  ],
  "confidence": 0.0
}

Be specific. Show code. Include line numbers.`;
  }

  /**
   * Get template for specific error category
   */
  getTemplate(errorCategory: string): ResponseTemplate | null {
    return this.templates[errorCategory] || null;
  }

  /**
   * Validate that all placeholders are filled
   */
  validateTemplateOutput(output: string, errorCategory: string): { valid: boolean; missingPlaceholders: string[] } {
    const template = this.templates[errorCategory];
    if (!template) {
      return { valid: true, missingPlaceholders: [] };
    }

    const missingPlaceholders: string[] = [];
    for (const placeholder of template.placeholders) {
      if (output.includes(`[${placeholder}]`)) {
        missingPlaceholders.push(placeholder);
      }
    }

    return {
      valid: missingPlaceholders.length === 0,
      missingPlaceholders
    };
  }

  /**
   * Classify error to get appropriate template
   */
  classifyForTemplate(error: ParsedError): string {
    const errorMsg = error.message.toLowerCase();
    // const errorType = error.type?.toLowerCase() || ''; // Currently unused
    
    // Match to template categories
    if (errorMsg.includes('agp') || errorMsg.includes('gradle') && errorMsg.includes('version')) {
      return 'gradle-dependency';
    }
    if (errorMsg.includes('nullpointerexception') || errorMsg.includes('lateinit')) {
      return 'kotlin-npe';
    }
    if (errorMsg.includes('materialtheme') || errorMsg.includes('material2')) {
      return 'compose-deprecation';
    }
    if (errorMsg.includes('.xml') || errorMsg.includes('layout')) {
      return 'xml-layout';
    }
    if (errorMsg.includes('permission') && errorMsg.includes('manifest')) {
      return 'manifest-permission';
    }
    if (errorMsg.includes('network') || errorMsg.includes('timeout') && errorMsg.includes('gradle')) {
      return 'gradle-network';
    }
    if (errorMsg.includes('cache') && errorMsg.includes('gradle')) {
      return 'gradle-cache';
    }
    if (errorMsg.includes('proguard') || errorMsg.includes('r8')) {
      return 'proguard';
    }
    if (errorMsg.includes('navigation') || errorMsg.includes('navgraph')) {
      return 'navigation';
    }
    
    return 'generic';
  }
}
