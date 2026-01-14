# [SEARCH] Error Detection System - Backend Documentation

> **Module:** Error Detection & Parsing Pipeline  
> **Version:** 1.0.0 | **Last Updated:** January 13, 2026  
> **Status:** Production Ready

---

## [CLIPBOARD] Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Language Detection](#language-detection)
4. [Error Parser Router](#error-parser-router)
5. [Language-Specific Parsers](#language-specific-parsers)
   - [Kotlin Parser](#kotlin-parser)
   - [Gradle Parser](#gradle-parser)
   - [Jetpack Compose Parser](#jetpack-compose-parser)
   - [XML Parser](#xml-parser)
   - [Base Parser](#base-parser)
6. [Error Classification](#error-classification)
7. [Error Hashing & Caching](#error-hashing--caching)
8. [Data Structures](#data-structures)
9. [Integration Flow](#integration-flow)
10. [Extension Guide](#extension-guide)
11. [Performance Metrics](#performance-metrics)

---

## Overview

The Error Detection System is the entry point for all error analysis in the RCA (Root Cause Analysis) pipeline. It automatically detects, parses, and classifies errors from Android/Kotlin development, extracting structured information for downstream processing by the ReAct agent.

### Key Capabilities

| Capability                 | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| **Multi-Language Support** | Kotlin, Gradle, Jetpack Compose, XML, Java           |
| **26+ Error Types**        | Comprehensive coverage of Android development errors |
| **Automatic Detection**    | Heuristic-based language identification              |
| **Pattern Matching**       | Regex-based extraction of error metadata             |
| **Smart Caching**          | SHA-256 hashing for fast repeat error lookups        |
| **Extensible Design**      | Easy to add new parsers and error types              |

### Design Philosophy

1. **Single Entry Point** - All errors flow through `ErrorParser.getInstance()`
2. **Graceful Degradation** - Falls back to trying all parsers if detection fails
3. **Type Safety** - Strong TypeScript typing throughout
4. **Performance First** - <1ms parse time per error

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR DETECTION PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌───────────────────┐    ┌─────────────────────────┐   │
│  │  Raw Error   │───[PLAY]│ Language Detector │───[PLAY]│    Error Parser         │   │
│  │    Text      │    │  (Heuristics)     │    │    (Router)             │   │
│  └──────────────┘    └───────────────────┘    └───────────┬─────────────┘   │
│                                                           │                  │
│                      ┌────────────────────────────────────┼──────────────┐   │
│                      │                                    [DOWN]              │   │
│                      │  ┌──────────────────────────────────────────────┐ │   │
│                      │  │           LANGUAGE-SPECIFIC PARSERS          │ │   │
│                      │  ├──────────┬──────────┬──────────┬─────────────┤ │   │
│                      │  │ Kotlin   │ Gradle   │ Compose  │ XML         │ │   │
│                      │  │ Parser   │ Parser   │ Parser   │ Parser      │ │   │
│                      │  │ (6 types)│ (5 types)│ (8 types)│ (7 types)   │ │   │
│                      │  └──────────┴──────────┴──────────┴─────────────┘ │   │
│                      │                       │                           │   │
│                      │                       [DOWN]                           │   │
│                      │  ┌──────────────────────────────────────────────┐ │   │
│                      │  │              BASE PARSER                     │ │   │
│                      │  │  • File path extraction                      │ │   │
│                      │  │  • Stack trace parsing                       │ │   │
│                      │  │  • Line number detection                     │ │   │
│                      │  └──────────────────────────────────────────────┘ │   │
│                      └──────────────────────────────────────────────────────┘   │
│                                                           │                  │
│                                                           [DOWN]                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         ParsedError                                  │    │
│  │  { type, message, filePath, line, language, metadata, stackTrace }   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                           │                  │
│                      ┌────────────────────────────────────┼──────────────┐   │
│                      │                                    [DOWN]              │   │
│                      │  ┌──────────────────────────────────────────────┐ │   │
│                      │  │           POST-PROCESSING                    │ │   │
│                      │  ├──────────────────┬───────────────────────────┤ │   │
│                      │  │ Error Classifier │ Error Hasher + Cache      │ │   │
│                      │  │ (6 categories)   │ (SHA-256, TTL)            │ │   │
│                      │  └──────────────────┴───────────────────────────┘ │   │
│                      └──────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── utils/
│   ├── ErrorParser.ts          # Main router (singleton)
│   ├── LanguageDetector.ts     # Heuristic detection
│   └── parsers/
│       ├── BaseParser.ts       # Abstract base class
│       ├── KotlinParser.ts     # Kotlin errors (6 types)
│       ├── GradleParser.ts     # Gradle errors (5 types)
│       ├── JetpackComposeParser.ts  # Compose errors (8 types)
│       └── XMLParser.ts        # XML errors (7 types)
│
├── cache/
│   ├── ErrorHasher.ts          # SHA-256 hashing
│   └── RCACache.ts             # In-memory cache
│
├── agent/
│   └── ErrorClassifier.ts      # Category classification
│
└── types.ts                    # Type definitions
```

---

## Language Detection

**File:** `src/utils/LanguageDetector.ts`

The `LanguageDetector` class uses heuristic pattern matching to identify the source language/framework of an error before routing to the appropriate parser.

### Detection Algorithm

```typescript
static detect(errorText: string, filePath?: string): 
  'kotlin' | 'java' | 'xml' | 'gradle' | 'compose' | 'unknown'
```

**Detection Order (most specific first):**
1. Compose patterns (subset of Kotlin, check first)
2. Kotlin patterns
3. Gradle patterns
4. XML patterns
5. Java patterns
6. File extension fallback

### Detection Patterns

#### Jetpack Compose Detection

```typescript
private static isCompose(text: string, originalText: string): boolean {
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
```

#### Kotlin Detection

```typescript
private static isKotlin(text: string, originalText: string): boolean {
  const kotlinPatterns = [
    /lateinit property/i,
    /uninitialized.*property/i,
    /kotlin\..*exception/i,
    /\.kt:\d+/,              // Stack trace with .kt file
    /\bat\s+.*\.kt:\d+\b/,
    /smart cast/i,
    /suspend.*function/i,
    /coroutine/i,
  ];
  return kotlinPatterns.some(pattern => pattern.test(originalText));
}
```

#### Gradle Detection

```typescript
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
```

#### XML Detection

```typescript
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
```

#### Java Detection

```typescript
private static isJava(textLower: string): boolean {
  const javaPatterns = [
    /\.java:\d+/,           // Stack trace with .java file
    /\bat\s+.*\.java:\d+\b/,
    /java\..*exception/,
    /caused by:.*java\./,
  ];
  return javaPatterns.some(pattern => pattern.test(textLower));
}
```

### File Extension Fallback

```typescript
static detectFromFilePath(filePath: string): string {
  const path = filePath.toLowerCase();

  if (path.endsWith('.kt')) return 'kotlin';
  if (path.endsWith('.java')) return 'java';
  if (path.endsWith('.xml')) return 'xml';
  if (path.endsWith('.gradle') || path.endsWith('.gradle.kts')) return 'gradle';
  if (path.includes('build.gradle') || path.includes('settings.gradle')) return 'gradle';

  return 'unknown';
}
```

---

## Error Parser Router

**File:** `src/utils/ErrorParser.ts`

The `ErrorParser` is a **singleton** that serves as the main entry point for all error parsing. It routes errors to language-specific parsers based on detection results.

### API

```typescript
class ErrorParser {
  // Singleton access
  static getInstance(): ErrorParser;
  
  // Main parsing method (auto-detects language)
  parse(errorText: string, filePath?: string): ParsedError | null;
  
  // Parse with explicit language
  parseWithLanguage(errorText: string, language: string): ParsedError | null;
  
  // Parser management
  registerParser(language: string, parser: IParser): void;
  getSupportedLanguages(): string[];
  isLanguageSupported(language: string): boolean;
  getParser(language: string): IParser | undefined;
}
```

### Parsing Flow

```typescript
parse(errorText: string, filePath?: string): ParsedError | null {
  // 1. Validate input
  if (!errorText || typeof errorText !== 'string') {
    return null;
  }

  // 2. Detect language
  const language = LanguageDetector.detect(errorText, filePath);
  
  // 3. Route to appropriate parser
  if (language === 'unknown') {
    return this.tryAllParsers(errorText);  // Fallback
  }

  // 4. Try detected language parser first
  const result = this.parseWithLanguage(errorText, language);
  if (result) return result;

  // 5. If detected parser fails, try all (handles mixed errors)
  return this.tryAllParsers(errorText);
}
```

### Parser Priority Order

When language detection fails or the detected parser doesn't match, parsers are tried in this order:

```typescript
const tryOrder = ['compose', 'kotlin', 'xml', 'gradle', 'java'];
```

**Rationale:**
- `compose` first: More specific than general Kotlin
- `kotlin` second: Most common Android errors
- `xml` third: Layout errors are frequent
- `gradle` fourth: Build errors less specific
- `java` last: Least common in modern Android

### Default Parser Registration

```typescript
private registerDefaultParsers(): void {
  this.registerParser('kotlin', new KotlinParser());
  this.registerParser('gradle', new GradleParser());
  this.registerParser('compose', new JetpackComposeParser());
  this.registerParser('xml', new XMLParser());
  // Future: this.registerParser('java', new JavaParser());
}
```

---

## Language-Specific Parsers

### Base Parser

**File:** `src/utils/parsers/BaseParser.ts`

Abstract base class providing shared utilities for all parsers.

#### Interface

```typescript
interface IParser {
  parse(errorText: string): ParsedError | null;
}

interface StackFrame {
  file: string;
  line: number;
  function?: string;
  className?: string;
}

abstract class BaseParser implements IParser {
  abstract parse(errorText: string): ParsedError | null;
  
  protected extractFileInfo(text: string, fileExtension?: string): 
    { filePath: string; line: number };
  
  protected extractStackInfo(text: string, fileExtension?: string): 
    { filePath: string; line: number; stackTrace: StackFrame[] };
  
  protected sanitizeInput(text: string, maxLength?: number): string;
  protected normalizeFilePath(filePath: string): string;
}
```

#### File Path Extraction Patterns

```typescript
// Pattern 1: Compiler format - "file.kt:line:column"
const compilerPattern = /([\\w-]+\\.${ext}):(\\d+):(\\d+)/;

// Pattern 2: Simplified - "file.kt:line"
const simplePattern = /([\\w-]+\\.${ext}):(\\d+)/;

// Pattern 3: Parentheses - "(file.kt:line)"
const parenPattern = /\\(([\\w.-]+\\.${ext}):(\\d+)\\)/;

// Pattern 4: With path - "at path/file.kt (file.kt:line)"
const pathPattern = /at\\s+[\\w./]+\\(([\\w.]+\\.${ext}):(\\d+)\\)/;
```

#### Stack Trace Extraction

```typescript
// Full stack trace format:
// "at com.example.MainActivity.onCreate(MainActivity.kt:45)"
const fullStackPattern = new RegExp(
  `at\\s+(?:[\\w.]+\\.)?(\\w+)\\.(\\w+)\\(([\\w.-]+\\.${ext}):(\\d+)\\)`,
  'g'
);

// Extracts: className, functionName, file, line
```

---

### Kotlin Parser

**File:** `src/utils/parsers/KotlinParser.ts`

Parses all Kotlin-specific errors (6 types).

#### Error Types

| Type                   | Pattern                                             | Example                     |
| ---------------------- | --------------------------------------------------- | --------------------------- |
| `lateinit`             | `lateinit property X has not been initialized`      | Property access before init |
| `npe`                  | `NullPointerException`, `IndexOutOfBoundsException` | Null/bounds errors          |
| `unresolved_reference` | `Unresolved reference: X`                           | Symbol not found            |
| `type_mismatch`        | `Type mismatch: inferred X but Y expected`          | Type incompatibility        |
| `compilation_error`    | `Expecting...`, `Syntax error`                      | Syntax errors               |
| `import_error`         | `Cannot find import`, `Unresolved import`           | Missing imports             |

#### Parsing Implementation

```typescript
parse(errorText: string): ParsedError | null {
  const text = this.sanitizeInput(errorText, 100000);

  // Try in order of specificity/frequency
  return (
    this.parseLateinitOrNPE(text) ||    // Most common runtime
    this.parseImportError(text) ||       // Check before unresolved
    this.parseUnresolvedReference(text) ||
    this.parseTypeMismatch(text) ||
    this.parseCompilationError(text) ||
    null
  );
}
```

#### Lateinit Pattern

```typescript
private static readonly NPE_PATTERNS = {
  lateinit: /lateinit property (\w+) has not been initialized/i,
  npe: /(?:NullPointerException|IndexOutOfBoundsException)/i,
  uninitializedProperty: /UninitializedPropertyAccessException.*lateinit property (\w+)/i,
};
```

**Output Example:**
```typescript
{
  type: 'lateinit',
  message: 'lateinit property viewModel has not been initialized',
  filePath: 'MainActivity.kt',
  line: 45,
  language: 'kotlin',
  stackTrace: [...],
  metadata: {
    propertyName: 'viewModel',
    errorType: 'lateinit property not initialized',
  }
}
```

#### Type Mismatch Patterns

```typescript
const patterns = [
  /Type mismatch:.*inferred type is\s+(\w+(?:<[^>]+>)?)\s+but\s+(\w+(?:<[^>]+>)?)\s+was expected/i,
  /Required:\s*(\w+(?:<[^>]+>)?)\s*Found:\s*(\w+(?:<[^>]+>)?)/i,
  /Type mismatch:\s*required\s+(\w+)\s+found\s+(\w+)/i,
];
```

**Output Example:**
```typescript
{
  type: 'type_mismatch',
  message: 'Type mismatch: inferred type is String but Int was expected',
  filePath: 'Utils.kt',
  line: 23,
  language: 'kotlin',
  metadata: {
    expectedType: 'Int',
    foundType: 'String',
    errorType: 'Type mismatch',
  }
}
```

---

### Gradle Parser

**File:** `src/utils/parsers/GradleParser.ts`

Parses Gradle build errors (5 types).

#### Error Types

| Type                                 | Pattern                              | Example                |
| ------------------------------------ | ------------------------------------ | ---------------------- |
| `gradle_dependency_resolution_error` | `Could not resolve/find X`           | Missing dependency     |
| `gradle_dependency_conflict`         | `Duplicate class`, `Conflict`        | Version conflicts      |
| `version_mismatch`                   | `compiled with incompatible version` | Module incompatibility |
| `build_script_syntax_error`          | `Could not compile build file`       | DSL syntax errors      |
| `task_failure`                       | `Execution failed for task`          | Task execution errors  |

#### Parsing Implementation

```typescript
parse(errorText: string): ParsedError | null {
  const text = this.sanitizeInput(errorText, 50000);

  // Order matters - most specific first
  return (
    this.parseDependencyResolutionError(text) ||
    this.parseDependencyConflict(text) ||
    this.parseVersionMismatch(text) ||
    this.parsePluginError(text) ||
    this.parseBuildScriptSyntaxError(text) ||
    this.parseTaskFailure(text) ||
    this.parseCompilationError(text) ||
    null
  );
}
```

#### Dependency Resolution Patterns

```typescript
const patterns = [
  /Could not resolve\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
  /Could not find\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
  /Could not download\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
  /Failed to resolve:\s+([^\s:]+:[^\s:]+(?::[^\s]+)?)/i,
];
```

**Output Example:**
```typescript
{
  type: 'gradle_dependency_resolution_error',
  message: 'Could not find com.android.tools.build:gradle:8.10.0',
  filePath: 'build.gradle.kts',
  line: 0,
  language: 'gradle',
  metadata: {
    dependency: 'com.android.tools.build:gradle:8.10.0',
    group: 'com.android.tools.build',
    artifact: 'gradle',
    version: '8.10.0',
    errorType: 'Dependency resolution failed',
  }
}
```

#### Dependency Conflict Patterns (Duplicate Classes)

```typescript
// AG001: Duplicate class conflicts
const duplicateClassPattern = 
  /Duplicate class\s+([\w.]+).*found in modules[\s\S]*?([\w.-]+\.jar)\s*\(([^)]+)\)[\s\S]*?([\w.-]+\.jar)\s*\(([^)]+)\)/i;
```

**Output Example:**
```typescript
{
  type: 'gradle_dependency_conflict',
  message: 'Duplicate class kotlin.collections.ArraysKt found in modules...',
  filePath: 'build.gradle.kts',
  line: 0,
  language: 'gradle',
  metadata: {
    module: 'kotlin.collections.ArraysKt',
    conflictingVersions: ['org.jetbrains.kotlin:kotlin-stdlib:1.8.0', 'org.jetbrains.kotlin:kotlin-stdlib:1.9.0'],
    errorType: 'Duplicate class - dependency conflict',
  }
}
```

---

### Jetpack Compose Parser

**File:** `src/utils/parsers/JetpackComposeParser.ts`

Parses Jetpack Compose framework errors (8 types).

#### Error Types

| Type                        | Pattern                                            | Example                 |
| --------------------------- | -------------------------------------------------- | ----------------------- |
| `compose_remember`          | `state object during composition without remember` | State not remembered    |
| `compose_derived_state`     | `derivedStateOf should be used with remember`      | Derived state misuse    |
| `compose_recomposition`     | `Recomposing N times` (N > 10)                     | Excessive recomposition |
| `compose_launched_effect`   | `LaunchedEffect key changed`                       | Effect misuse           |
| `compose_disposable_effect` | `DisposableEffect` errors                          | Cleanup issues          |
| `compose_composition_local` | `CompositionLocal not provided`                    | Missing provider        |
| `compose_modifier`          | `Modifier order matters`                           | Modifier chain errors   |
| `compose_side_effect`       | `Side effect in composition`                       | Incorrect side effects  |

#### Remember Error Patterns

```typescript
const patterns = [
  /Reading a state.*created.*composable function but not called with remember/i,
  /Creating a state object during composition without using remember/i,
  /reading a state.*without calling remember/i,
  /State should be created with remember/i,
  /mutableStateOf\s+should be wrapped in remember/i,
  /remember\s*\{[^}]*\}\s+should\s+have\s+keys/i,
  /rememberSaveable\s+is\s+required/i,
  /State\s+created\s+outside\s+of\s+remember/i,
];
```

**Output Example:**
```typescript
{
  type: 'compose_remember',
  message: 'Creating a state object during composition without using remember',
  filePath: 'HomeScreen.kt',
  line: 45,
  language: 'kotlin',
  framework: 'compose',
  metadata: {
    errorType: 'State management',
    stateVariable: 'counter',
    suggestion: 'Wrap state creation in remember { } or rememberSaveable { }',
  }
}
```

#### Recomposition Detection

```typescript
private parseRecompositionError(text: string): ParsedError | null {
  // Pattern for explicit recomposition count
  const countMatch = text.match(/[Rr]ecompos(?:ing|ition)\s+(\d+)\s+times/);
  if (countMatch) {
    const count = parseInt(countMatch[1], 10);
    // Only flag as error if excessive (more than 10)
    if (count > 10) {
      return {
        type: 'compose_recomposition',
        // ...
        metadata: {
          framework: 'compose',
          errorType: 'Performance',
          recompositionCount: count,
          composable: this.extractComposableName(text),
          severity: count > 50 ? 'high' : 'medium',
          suggestion: 'Use derivedStateOf, remember, or key() to reduce recompositions',
        }
      };
    }
  }
  // ...
}
```

---

### XML Parser

**File:** `src/utils/parsers/XMLParser.ts`

Parses Android XML layout and resource errors (7 types).

#### Error Types

| Type                  | Pattern                       | Example                   |
| --------------------- | ----------------------------- | ------------------------- |
| `xml_inflation`       | `Error inflating class`       | View inflation failure    |
| `xml_missing_id`      | `Could not find view with id` | Missing view reference    |
| `xml_attribute_error` | `Invalid attribute`           | Wrong attribute value     |
| `xml_namespace_error` | `Namespace not bound`         | Missing xmlns declaration |
| `xml_view_not_found`  | `View not found`              | Missing view class        |
| `xml_include_error`   | `Error including layout`      | Include tag issues        |
| `xml_merge_error`     | `Merge tag error`             | Merge layout issues       |

---

## Error Classification

**File:** `src/agent/ErrorClassifier.ts`

After parsing, errors are classified into **categories** for targeted analysis prompts.

### Categories

```typescript
enum ErrorCategory {
  VERSION_DEPENDENCY = 'version_dependency',
  MANIFEST_PERMISSION = 'manifest_permission',
  BUILD_CACHE = 'build_cache',
  PROGUARD_MINIFICATION = 'proguard_minification',
  NAVIGATION_ROUTING = 'navigation_routing',
  NETWORK_CONNECTIVITY = 'network_connectivity',
  UNKNOWN = 'unknown'
}
```

### Classification Patterns

| Category                | Key Patterns                                                                     | Confidence |
| ----------------------- | -------------------------------------------------------------------------------- | ---------- |
| `VERSION_DEPENDENCY`    | `could not find.*:.*:[\d.]+`, `version conflict`, `agp`, `incompatible.*version` | 0.9        |
| `MANIFEST_PERMISSION`   | `permission.*denied`, `androidmanifest.xml`, `uses-permission`                   | 0.85       |
| `BUILD_CACHE`           | `cache.*corrupt`, `gradle daemon`, `incremental.*compilation.*failed`            | 0.8        |
| `PROGUARD_MINIFICATION` | `proguard`, `r8`, `minification`, `missing.*in release`                          | 0.85       |
| `NAVIGATION_ROUTING`    | `navigation`, `navhost`, `safeargs`, `destination.*not found`                    | 0.8        |
| `NETWORK_CONNECTIVITY`  | `connection.*refused`, `unable to resolve host`, `maven.*repository`             | 0.75       |

### API

```typescript
class ErrorClassifier {
  classify(error: ParsedError): ErrorClassification;
}

interface ErrorClassification {
  category: ErrorCategory;
  confidence: number;      // 0.0 - 1.0
  reasoning: string;       // Human-readable explanation
}
```

### Usage

```typescript
const classifier = new ErrorClassifier();
const classification = classifier.classify(parsedError);

// { 
//   category: 'VERSION_DEPENDENCY', 
//   confidence: 0.9,
//   reasoning: 'Error involves version numbers, dependencies, or compatibility issues'
// }
```

---

## Error Hashing & Caching

### Error Hasher

**File:** `src/cache/ErrorHasher.ts`

Generates deterministic SHA-256 hashes for error identification and cache keys.

#### Configuration

```typescript
interface ErrorHasherConfig {
  includeFilePath?: boolean;      // default: true
  includeLineNumber?: boolean;    // default: true
  includeColumnNumber?: boolean;  // default: false
  algorithm?: 'sha256' | 'sha512' | 'md5';  // default: 'sha256'
}
```

#### Hash Components

```typescript
hash(error: ParsedError): string {
  const components: string[] = [
    error.type,                           // Error type
    this.normalize(error.message),        // Normalized message
    error.language                        // Language
  ];
  
  if (this.config.includeFilePath && error.filePath) {
    components.push(this.normalizeFilePath(error.filePath));
  }
  
  if (this.config.includeLineNumber && error.line > 0) {
    components.push(String(error.line));
  }
  
  const key = components.join('|');
  return this.computeHash(key);  // SHA-256
}
```

#### Normalization Rules

```typescript
normalize(message: string): string {
  return message
    .toLowerCase()                        // Case insensitive
    .replace(/\s+/g, ' ')                // Collapse whitespace
    .replace(/\d+/g, 'N')                // Normalize numbers
    .replace(/0x[a-f0-9]+/gi, 'HEX')     // Normalize hex
    .trim();
}
```

### RCA Cache

**File:** `src/cache/RCACache.ts`

In-memory cache for storing previously analyzed RCA results.

#### Configuration

```typescript
interface RCACacheConfig {
  ttl?: number;              // Time-to-live (default: 24 hours)
  maxEntries?: number;       // Max cache size (default: 1000)
  cleanupInterval?: number;  // Cleanup interval (default: 5 minutes)
  enableAutoCleanup?: boolean;  // Auto cleanup (default: true)
  hasherConfig?: ErrorHasherConfig;
}
```

#### API

```typescript
class RCACache {
  // Basic operations
  get(hash: string): RCADocument | null;
  set(hash: string, rca: RCADocument, customTtl?: number): void;
  has(hash: string): boolean;
  invalidate(hash: string): boolean;
  
  // Error-based operations (auto-hashing)
  getForError(error: ParsedError): RCADocument | null;
  setForError(error: ParsedError, rca: RCADocument): string;
  hasForError(error: ParsedError): boolean;
  invalidateForError(error: ParsedError): boolean;
  
  // Statistics
  getStats(): CacheStats;
}

interface CacheStats {
  size: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;          // 0.0 - 1.0
  expiredRemoved: number;
  invalidated: number;
  estimatedMemoryBytes: number;
}
```

#### Eviction Strategy

```typescript
// LRU-like eviction when max capacity reached
private evictOldest(): void {
  let oldest: { key: string; time: number } | null = null;
  
  for (const [key, entry] of this.cache.entries()) {
    if (!oldest || entry.lastAccessed < oldest.time) {
      oldest = { key, time: entry.lastAccessed };
    }
  }
  
  if (oldest) {
    this.cache.delete(oldest.key);
  }
}
```

---

## Data Structures

### ParsedError

```typescript
interface ParsedError {
  /** Error type (e.g., 'lateinit', 'npe', 'gradle_dependency_conflict') */
  type: string;
  
  /** Full error message */
  message: string;
  
  /** File where error occurred */
  filePath: string;
  
  /** Line number (1-indexed) */
  line: number;
  
  /** Programming language */
  language: 'kotlin' | 'java' | 'xml' | 'gradle' | 'proguard';
  
  /** Optional: Framework (e.g., 'compose') */
  framework?: string;
  
  /** Optional: Column number */
  column?: number;
  
  /** Optional: Stack trace frames */
  stackTrace?: StackFrame[];
  
  /** Optional: Error-specific metadata */
  metadata?: Record<string, any>;
}
```

### StackFrame

```typescript
interface StackFrame {
  file: string;
  line: number;
  function?: string;
  className?: string;
}
```

### ErrorClassification

```typescript
interface ErrorClassification {
  category: ErrorCategory;
  confidence: number;
  reasoning: string;
}
```

### CacheEntry

```typescript
interface CacheEntry {
  rca: RCADocument;
  expires: number;
  hits: number;
  createdAt: number;
  lastAccessed: number;
}
```

---

## Integration Flow

### Complete Error Detection Flow

```typescript
import { ErrorParser } from './utils/ErrorParser';
import { ErrorClassifier } from './agent/ErrorClassifier';
import { RCACache } from './cache/RCACache';

// 1. Initialize components
const parser = ErrorParser.getInstance();
const classifier = new ErrorClassifier();
const cache = new RCACache();

// 2. Parse raw error
const errorText = `
  kotlin.UninitializedPropertyAccessException: 
  lateinit property viewModel has not been initialized
    at com.example.MainActivity.onCreate(MainActivity.kt:45)
`;

const parsedError = parser.parse(errorText);
// Result:
// {
//   type: 'lateinit',
//   message: '...',
//   filePath: 'MainActivity.kt',
//   line: 45,
//   language: 'kotlin',
//   metadata: { propertyName: 'viewModel', ... }
// }

// 3. Check cache
const cached = cache.getForError(parsedError);
if (cached) {
  console.log('Cache hit! Returning cached RCA');
  return cached;
}

// 4. Classify for targeted analysis
const classification = classifier.classify(parsedError);
// { category: 'VERSION_DEPENDENCY', confidence: 0.9, ... }

// 5. Pass to agent for analysis
const agent = new MinimalReactAgent(llm);
const result = await agent.analyze(parsedError);

// 6. Cache result
cache.setForError(parsedError, result);
```

### Sequence Diagram

```
┌─────────┐    ┌──────────────┐    ┌───────────────┐    ┌─────────────┐    ┌──────────┐
│  Input  │    │LanguageDetect│    │  ErrorParser  │    │Specific     │    │ Output   │
│  Error  │    │              │    │   (Router)    │    │Parser       │    │ParsedError│
└────┬────┘    └──────┬───────┘    └───────┬───────┘    └──────┬──────┘    └────┬─────┘
     │                │                    │                   │                │
     │  errorText     │                    │                   │                │
     │───────────────────────────────────[PLAY]│                   │                │
     │                │                    │                   │                │
     │                │   detect(text)     │                   │                │
     │                │[BACK]───────────────────│                   │                │
     │                │                    │                   │                │
     │                │   "kotlin"         │                   │                │
     │                │───────────────────[PLAY]│                   │                │
     │                │                    │                   │                │
     │                │                    │  parse(text)      │                │
     │                │                    │──────────────────[PLAY]│                │
     │                │                    │                   │                │
     │                │                    │                   │  match patterns│
     │                │                    │                   │[BACK]──────────────[PLAY]│
     │                │                    │                   │                │
     │                │                    │   ParsedError     │                │
     │                │                    │[BACK]──────────────────│                │
     │                │                    │                   │                │
     │                │                    │                   │                │
     │[BACK]──────────────────────────────────────────────────────────────────────────│
     │        ParsedError { type, message, filePath, line, ... }                │
```

---

## Extension Guide

### Adding a New Parser

1. **Create parser file:**

```typescript
// src/utils/parsers/MyLanguageParser.ts
import { ParsedError } from '../../types';
import { BaseParser } from './BaseParser';

export class MyLanguageParser extends BaseParser {
  parse(errorText: string): ParsedError | null {
    const text = this.sanitizeInput(errorText, 50000);
    
    return (
      this.parseErrorType1(text) ||
      this.parseErrorType2(text) ||
      null
    );
  }
  
  private parseErrorType1(text: string): ParsedError | null {
    const pattern = /my pattern (\w+)/i;
    const match = text.match(pattern);
    
    if (!match) return null;
    
    const { filePath, line } = this.extractFileInfo(text, 'myext');
    
    return {
      type: 'my_error_type',
      message: text,
      filePath,
      line,
      language: 'mylanguage',
      metadata: {
        extractedValue: match[1],
      },
    };
  }
}
```

2. **Register parser:**

```typescript
// In ErrorParser.ts
import { MyLanguageParser } from './parsers/MyLanguageParser';

private registerDefaultParsers(): void {
  // ... existing parsers
  this.registerParser('mylanguage', new MyLanguageParser());
}
```

3. **Add language detection:**

```typescript
// In LanguageDetector.ts
private static isMyLanguage(text: string): boolean {
  const patterns = [
    /my specific pattern/,
    /\.myext:\d+/,
  ];
  return patterns.some(p => p.test(text));
}

static detect(errorText: string): string {
  // Add before 'unknown' return
  if (this.isMyLanguage(text)) return 'mylanguage';
  // ...
}
```

### Adding a New Error Type

```typescript
// In existing parser (e.g., KotlinParser.ts)

// 1. Add to parse method
parse(errorText: string): ParsedError | null {
  return (
    // ... existing
    this.parseNewErrorType(text) ||
    null
  );
}

// 2. Implement parser method
private parseNewErrorType(text: string): ParsedError | null {
  const pattern = /new error pattern: (\w+)/i;
  const match = text.match(pattern);
  
  if (!match) return null;
  
  return {
    type: 'new_error_type',
    message: text,
    filePath: this.extractFileInfo(text, 'kt').filePath,
    line: this.extractFileInfo(text, 'kt').line,
    language: 'kotlin',
    metadata: {
      specificField: match[1],
    },
  };
}
```

---

## Performance Metrics

### Benchmarks

| Operation          | Target | Achieved   | Notes            |
| ------------------ | ------ | ---------- | ---------------- |
| Parse Time         | <5ms   | **<1ms**   | Per error        |
| Language Detection | <1ms   | **<0.5ms** | Regex-based      |
| Cache Lookup       | <5ms   | **<2ms**   | In-memory Map    |
| Hash Generation    | <1ms   | **<0.5ms** | SHA-256          |
| Classification     | <1ms   | **<0.5ms** | Pattern matching |

### Coverage

| Category  | Error Types | Test Coverage |
| --------- | ----------- | ------------- |
| Kotlin    | 6           | 95%+          |
| Gradle    | 5           | 95%+          |
| Compose   | 8           | 95%+          |
| XML       | 7           | 95%+          |
| **Total** | **26+**     | **95%+**      |

### Cache Statistics (Typical)

| Metric             | Value |
| ------------------ | ----- |
| Hit Rate           | ~60%  |
| Cache Hit Latency  | <5s   |
| Cache Miss Latency | ~26s  |
| Memory per Entry   | ~2KB  |

---

## Related Documentation

- [Agent Workflow](./agent-workflow.md) - How the ReAct agent uses parsed errors
- [Database Design](../architecture/database-design.md) - ChromaDB schema for RCA storage
- [API Reference](./Agent.md) - Full API documentation
- [Performance Benchmarks](../performance/benchmarks.md) - Detailed metrics

---

> **Last Updated:** January 13, 2026  
> **Maintainer:** Backend Team  
> **Status:** Production Ready [DONE]
