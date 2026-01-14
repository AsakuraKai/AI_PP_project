/**
 * LanguageDetector - Automatically detect programming language from error text
 * 
 * Uses heuristics to identify the language/framework that generated an error:
 * - File extensions in stack traces
 * - Error message patterns
 * - Framework-specific keywords
 * 
 * Design Philosophy:
 * - Fast detection using regex patterns
 * - Graceful degradation (return 'unknown' if can't detect)
 * - Extensible for new languages
 * 
 * @example
 * const language = LanguageDetector.detect(errorText);
 * if (language === 'kotlin') {
 *   // Use Kotlin parser
 * }
 */

export class LanguageDetector {
  /**
   * Detect language from error text
   * 
   * @param errorText - Raw error message
   * @param filePath - Optional file path hint
   * @returns Detected language: 'kotlin' | 'java' | 'xml' | 'gradle' | 'compose' | 'unknown'
   */
  static detect(errorText: string, filePath?: string): 'kotlin' | 'java' | 'xml' | 'gradle' | 'compose' | 'unknown' {
    if (!errorText) {
      return filePath ? this.detectFromFilePath(filePath) : 'unknown';
    }

    // Normalize text for pattern matching
    const text = errorText.toLowerCase();

    // Check Compose patterns first (more specific than general Kotlin)
    if (this.isCompose(text, errorText)) {
      return 'compose';
    }

    // Check Kotlin-specific patterns
    if (this.isKotlin(text, errorText)) {
      return 'kotlin';
    }

    // Check Gradle build patterns
    if (this.isGradle(text)) {
      return 'gradle';
    }

    // Check XML layout patterns (added in Chunk 4.2)
    if (this.isXML(text)) {
      return 'xml';
    }

    // Check Java patterns
    if (this.isJava(text)) {
      return 'java';
    }

    // Fall back to file extension if provided
    if (filePath) {
      return this.detectFromFilePath(filePath);
    }

    return 'unknown';
  }

  /**
   * Detect language from file extension
   */
  static detectFromFilePath(filePath: string): 'kotlin' | 'java' | 'xml' | 'gradle' | 'compose' | 'unknown' {
    const path = filePath.toLowerCase();

    if (path.endsWith('.kt')) {
      return 'kotlin';
    }

    if (path.endsWith('.java')) {
      return 'java';
    }

    if (path.endsWith('.xml')) {
      return 'xml';
    }

    if (path.endsWith('.gradle') || path.endsWith('.gradle.kts')) {
      return 'gradle';
    }

    if (path.includes('build.gradle') || path.includes('settings.gradle')) {
      return 'gradle';
    }

    return 'unknown';
  }

  /**
   * Check if error is from Jetpack Compose (added in Chunk 4.1)
   */
  private static isCompose(_textLower: string, originalText: string): boolean {
    // Compose-specific error patterns
    const composePatterns = [
      /remember\s*\{/i,
      /rememberSaveable/i,
      /derivedStateOf/i,
      /LaunchedEffect/i,
      /DisposableEffect/i,
      /SideEffect/i,
      /CompositionLocal/i,
      /mutableStateOf/i,
      /@Composable/i,
      /[Rr]ecompos(ing|ition)/,
      /Modifier\./i,
      /androidx\.compose/i,
      /snapshotFlow/i,
      /produceState/i,
      /state\s+object\s+during\s+composition/i,
      /composition\s+without\s+using\s+remember/i,
    ];

    return composePatterns.some(pattern => pattern.test(originalText));
  }

  /**
   * Check if error is from Kotlin
   */
  private static isKotlin(_textLower: string, originalText: string): boolean {
    // Kotlin-specific error messages
    const kotlinPatterns = [
      /lateinit property/i,
      /uninitialized.*property/i,
      /kotlin\..*exception/i,
      /\.kt:\d+/,  // Stack trace with .kt file
      /\bat\s+.*\.kt:\d+\b/,
      /smart cast/i,
      /suspend.*function/i,
      /coroutine/i,
    ];

    return kotlinPatterns.some(pattern => pattern.test(originalText));
  }

  /**
   * Check if error is from Gradle build
   */
  private static isGradle(textLower: string): boolean {
    const gradlePatterns = [
      /gradle/,
      /build failed/,
      /dependency.*resolution.*failed/,
      /could not resolve/,
      /execution failed for task/,
      /build\.gradle/,
      /settings\.gradle/,
      /compilation failed/,
      /unable to resolve/,
    ];

    return gradlePatterns.some(pattern => pattern.test(textLower));
  }

  /**
   * Check if error is from XML (enhanced in Chunk 4.2)
   */
  private static isXML(textLower: string): boolean {
    const xmlPatterns = [
      /inflateexception/,
      /binary xml file/,
      /xml.*parse/,
      /layout.*inflation/,
      /error inflating/,
      /\.xml:\d+/,
      /resource.*not found/,
      /android:id/,
      /findviewbyid/,
      /xmlns/,
      /layout_width/,
      /layout_height/,
      /@\+id\//,
      /@string\//,
      /@drawable\//,
    ];

    return xmlPatterns.some(pattern => pattern.test(textLower));
  }

  /**
   * Check if error is from Java
   */
  private static isJava(textLower: string): boolean {
    const javaPatterns = [
      /\.java:\d+/,  // Stack trace with .java file
      /\bat\s+.*\.java:\d+\b/,
      /java\..*exception/,
      /caused by:.*java\./,
    ];

    return javaPatterns.some(pattern => pattern.test(textLower));
  }

  /**
   * Get confidence score for language detection (0-1)
   * Higher score = more confident
   */
  static getConfidence(errorText: string, detectedLanguage: string): number {
    if (!errorText || detectedLanguage === 'unknown') {
      return 0;
    }

    let confidence = 0.5; // Base confidence

    // Check for strong indicators
    const strongIndicators = {
      compose: [/@Composable/i, /remember\s*\{/i, /LaunchedEffect/i, /CompositionLocal/i],
      kotlin: [/lateinit property/i, /\.kt:\d+/],
      gradle: [/gradle.*build failed/i, /execution failed for task/i],
      xml: [/inflateexception/i, /binary xml file/i],
      java: [/\.java:\d+/, /java\..*exception/i],
    };

    const indicators = strongIndicators[detectedLanguage as keyof typeof strongIndicators];
    if (indicators) {
      const matches = indicators.filter(pattern => pattern.test(errorText));
      confidence += matches.length * 0.2;
    }

    return Math.min(confidence, 1.0);
  }
}
