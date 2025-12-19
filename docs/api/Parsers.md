# Parser API Reference

> **Module:** `src/utils/` and `src/utils/parsers/`  
> **Purpose:** Error parsing and language detection for Kotlin/Android errors  
> **Last Updated:** December 20, 2025 (Chunk 5.5)

---

## Overview

The Parser module extracts structured information from raw error messages, supporting 20+ error types across 4 languages (Kotlin, Gradle, XML, Jetpack Compose). All parsers return a consistent `ParsedError` interface for downstream analysis.

**Key Components:**
- `ErrorParser` - Main router with automatic language detection
- `KotlinParser` - Kotlin-specific errors (NPE, lateinit, type mismatches, etc.)
- `GradleParser` - Build system errors (dependencies, conflicts, tasks)
- `JetpackComposeParser` - Compose-specific errors (remember, recomposition, effects)
- `XMLParser` - Layout inflation and resource errors
- `LanguageDetector` - Automatic language/framework detection

---

## ErrorParser

**File:** `src/utils/ErrorParser.ts`  
**Purpose:** Main entry point with automatic language detection

### Class Definition

```typescript
class ErrorParser {
  static getInstance(): ErrorParser
  
  parse(errorText: string, filePath?: string): ParsedError | null
  registerParser(language: string, parser: LanguageParser): void
  getSupportedLanguages(): string[]
}
```

### getInstance()

Returns singleton instance of ErrorParser.

```typescript
static getInstance(): ErrorParser
```

**Example:**
```typescript
const parser = ErrorParser.getInstance();
```

### parse()

Parse error text with automatic language detection.

```typescript
parse(errorText: string, filePath?: string): ParsedError | null
```

**Parameters:**
- `errorText: string` - Raw error message (required)
- `filePath?: string` - Optional file path hint for language detection

**Returns:** `ParsedError | null`
- Returns `ParsedError` object if successfully parsed
- Returns `null` if error format not recognized

**ParsedError Structure:**
```typescript
interface ParsedError {
  type: string;           // Error type (e.g., 'lateinit', 'npe', 'gradle_conflict')
  message: string;        // Original error message
  filePath: string;       // File where error occurred
  line: number;           // Line number (0 if unknown)
  language: string;       // Language ('kotlin', 'gradle', 'xml', 'compose')
  framework?: string;     // Framework if applicable ('compose', 'android')
  metadata?: Record<string, any>; // Type-specific metadata
}
```

**Example:**
```typescript
const parser = ErrorParser.getInstance();

// With automatic language detection
const error1 = parser.parse(`
  kotlin.UninitializedPropertyAccessException: 
  lateinit property user has not been initialized
  at MainActivity.kt:45
`);

console.log(error1);
// {
//   type: 'lateinit',
//   message: 'lateinit property user has not been initialized',
//   filePath: 'MainActivity.kt',
//   line: 45,
//   language: 'kotlin',
//   metadata: { propertyName: 'user' }
// }

// With file path hint
const error2 = parser.parse(
  'Execution failed for task :app:compileDebugKotlin',
  'build.gradle'
);

console.log(error2.language); // 'gradle'
```

### registerParser()

Register a custom parser for a language.

```typescript
registerParser(language: string, parser: LanguageParser): void
```

**Parameters:**
- `language: string` - Language identifier
- `parser: LanguageParser` - Parser instance

**Example:**
```typescript
// Create custom Java parser
class JavaParser implements LanguageParser {
  parse(errorText: string): ParsedError | null {
    // Custom parsing logic
    return null;
  }
}

const parser = ErrorParser.getInstance();
parser.registerParser('java', new JavaParser());
```

### getSupportedLanguages()

Get list of supported languages.

```typescript
getSupportedLanguages(): string[]
```

**Returns:** Array of language identifiers

**Example:**
```typescript
const languages = parser.getSupportedLanguages();
console.log(languages); // ['kotlin', 'gradle', 'compose', 'xml']
```

---

## KotlinParser

**File:** `src/utils/parsers/KotlinParser.ts`  
**Purpose:** Parse Kotlin-specific errors

### Supported Error Types

| Type | Description | Metadata |
|------|-------------|----------|
| `lateinit` | Uninitialized lateinit property | `propertyName: string` |
| `npe` | NullPointerException | - |
| `unresolved_reference` | Symbol not found | `symbol: string` |
| `type_mismatch` | Type incompatibility | `expected: string`, `actual: string` |
| `compilation_error` | Generic compilation error | - |
| `import_error` | Import resolution failure | `import: string` |

### Examples

**lateinit Error:**
```typescript
const input = `
  kotlin.UninitializedPropertyAccessException: 
  lateinit property user has not been initialized
  at com.example.MainActivity.onCreate(MainActivity.kt:45)
`;

const result = parser.parse(input);
// {
//   type: 'lateinit',
//   message: 'lateinit property user has not been initialized',
//   filePath: 'MainActivity.kt',
//   line: 45,
//   language: 'kotlin',
//   metadata: { propertyName: 'user' }
// }
```

**Type Mismatch:**
```typescript
const input = `
  Type mismatch: inferred type is String but Int was expected
  at UserViewModel.kt:23
`;

const result = parser.parse(input);
// {
//   type: 'type_mismatch',
//   filePath: 'UserViewModel.kt',
//   line: 23,
//   metadata: { expected: 'Int', actual: 'String' }
// }
```

**Unresolved Reference:**
```typescript
const input = `
  Unresolved reference: getUserData
  at MainActivity.kt:67
`;

const result = parser.parse(input);
// {
//   type: 'unresolved_reference',
//   filePath: 'MainActivity.kt',
//   line: 67,
//   metadata: { symbol: 'getUserData' }
// }
```

---

## GradleParser

**File:** `src/utils/parsers/GradleParser.ts`  
**Purpose:** Parse Gradle build errors

### Supported Error Types

| Type | Description | Metadata |
|------|-------------|----------|
| `dependency_resolution_error` | Failed to resolve dependency | `dependency: string` |
| `dependency_conflict` | Version conflict | `module: string`, `conflictingVersions: string[]` |
| `task_failure` | Task execution failed | `task: string` |
| `build_script_syntax_error` | build.gradle syntax error | - |
| `compilation_error` | Kotlin/Java compilation in Gradle | - |

### Examples

**Dependency Conflict:**
```typescript
const input = `
  Conflict found for module 'androidx.lifecycle:lifecycle-runtime' 
  versions 2.5.1 and 2.6.0
  in build.gradle
`;

const result = parser.parse(input);
// {
//   type: 'dependency_conflict',
//   message: '...',
//   filePath: 'build.gradle',
//   line: 0,
//   language: 'gradle',
//   metadata: {
//     module: 'androidx.lifecycle:lifecycle-runtime',
//     conflictingVersions: ['2.5.1', '2.6.0']
//   }
// }
```

**Task Failure:**
```typescript
const input = `
  Execution failed for task ':app:compileDebugKotlin'
  in build.gradle.kts
`;

const result = parser.parse(input);
// {
//   type: 'task_failure',
//   filePath: 'build.gradle.kts',
//   metadata: { task: ':app:compileDebugKotlin' }
// }
```

---

## JetpackComposeParser

**File:** `src/utils/parsers/JetpackComposeParser.ts`  
**Purpose:** Parse Jetpack Compose errors

### Supported Error Types

| Type | Description | Metadata |
|------|-------------|----------|
| `compose_remember` | Missing remember for state | - |
| `compose_recomposition` | Excessive recomposition | `count?: number` |
| `compose_launched_effect` | LaunchedEffect misuse | - |
| `compose_composition_local` | CompositionLocal error | `local?: string` |
| `compose_modifier` | Modifier chain error | - |
| `compose_state` | State hoisting issue | - |
| `compose_side_effect` | Side-effect in composition | - |
| `compose_key` | Missing or duplicate key | - |
| `compose_derivedstateof` | derivedStateOf misuse | - |
| `compose_snapshot` | Snapshot state error | - |

### Examples

**Remember Error:**
```typescript
const input = `
  IllegalStateException: Reading a state that was created in a composition 
  that is no longer active without calling remember
  at HomeScreen.kt:34
`;

const result = parser.parse(input);
// {
//   type: 'compose_remember',
//   filePath: 'HomeScreen.kt',
//   line: 34,
//   language: 'kotlin',
//   framework: 'compose'
// }
```

**Recomposition:**
```typescript
const input = `
  Recomposing 156 times in 1 second
  Composable: UserCard in ProfileScreen.kt:56
`;

const result = parser.parse(input);
// {
//   type: 'compose_recomposition',
//   filePath: 'ProfileScreen.kt',
//   line: 56,
//   metadata: { count: 156 }
// }
```

---

## XMLParser

**File:** `src/utils/parsers/XMLParser.ts`  
**Purpose:** Parse Android XML layout errors

### Supported Error Types

| Type | Description | Metadata |
|------|-------------|----------|
| `xml_inflation` | Layout inflation failed | - |
| `xml_missing_id` | View ID not found | `id?: string` |
| `xml_attribute` | Invalid/missing attribute | `attribute?: string` |
| `xml_resource` | Resource not found | `resource?: string` |
| `xml_namespace` | Namespace error | - |

### Examples

**Inflation Error:**
```typescript
const input = `
  android.view.InflateException: Binary XML file line #23: 
  Error inflating class TextView
  in activity_main.xml
`;

const result = parser.parse(input);
// {
//   type: 'xml_inflation',
//   filePath: 'activity_main.xml',
//   line: 23,
//   language: 'xml',
//   framework: 'android'
// }
```

**Missing ID:**
```typescript
const input = `
  java.lang.NullPointerException: findViewById returned null for id 'btnSubmit'
  at MainActivity.kt:45
`;

const result = parser.parse(input);
// {
//   type: 'xml_missing_id',
//   filePath: 'MainActivity.kt',
//   line: 45,
//   metadata: { id: 'btnSubmit' }
// }
```

---

## LanguageDetector

**File:** `src/utils/LanguageDetector.ts`  
**Purpose:** Automatic language and framework detection

### Class Definition

```typescript
class LanguageDetector {
  static detect(errorText: string, filePath?: string): string
  static detectFromExtension(filePath: string): string
  static isKotlin(text: string): boolean
  static isGradle(text: string): boolean
  static isCompose(text: string): boolean
  static isXML(text: string): boolean
}
```

### detect()

Detect language from error text and optional file path.

```typescript
static detect(errorText: string, filePath?: string): string
```

**Parameters:**
- `errorText: string` - Error message
- `filePath?: string` - Optional file path

**Returns:** Language identifier: `'kotlin'`, `'gradle'`, `'xml'`, `'compose'`, or `'unknown'`

**Detection Strategy:**
1. Check file extension if provided
2. Check for framework-specific keywords (Compose > Gradle > XML > Kotlin)
3. Fallback to generic Kotlin if uncertain

**Example:**
```typescript
const lang1 = LanguageDetector.detect('lateinit property user');
console.log(lang1); // 'kotlin'

const lang2 = LanguageDetector.detect('Composable', 'HomeScreen.kt');
console.log(lang2); // 'compose'

const lang3 = LanguageDetector.detect('task failed', 'build.gradle');
console.log(lang3); // 'gradle'
```

### detectFromExtension()

Detect language from file extension only.

```typescript
static detectFromExtension(filePath: string): string
```

**Supported Extensions:**
- `.kt` → `'kotlin'`
- `.gradle`, `.gradle.kts` → `'gradle'`
- `.xml` → `'xml'`

### Quick Check Methods

```typescript
static isKotlin(text: string): boolean
static isGradle(text: string): boolean
static isCompose(text: string): boolean
static isXML(text: string): boolean
```

**Example:**
```typescript
if (LanguageDetector.isCompose(errorText)) {
  // Use Compose-specific parser
}
```

---

## Usage Patterns

### Basic Parsing

```typescript
import { ErrorParser } from './utils/ErrorParser';

const parser = ErrorParser.getInstance();

// Parse error
const error = parser.parse(errorText);

if (error) {
  console.log(`Found ${error.type} error at ${error.filePath}:${error.line}`);
  
  // Access type-specific metadata
  if (error.type === 'lateinit' && error.metadata) {
    console.log('Property:', error.metadata.propertyName);
  }
} else {
  console.log('Could not parse error');
}
```

### Batch Parsing

```typescript
const errors = [errorText1, errorText2, errorText3];

const parsed = errors
  .map(text => parser.parse(text))
  .filter((e): e is ParsedError => e !== null);

console.log(`Parsed ${parsed.length} of ${errors.length} errors`);
```

### Type Guards

```typescript
function isLateinitError(error: ParsedError): error is ParsedError & { 
  metadata: { propertyName: string } 
} {
  return error.type === 'lateinit' && 
         error.metadata?.propertyName !== undefined;
}

if (isLateinitError(error)) {
  // TypeScript knows error.metadata.propertyName exists
  console.log('Uninitialized property:', error.metadata.propertyName);
}
```

### Custom Parser Registration

```typescript
// Define custom parser
class JavaParser {
  parse(errorText: string): ParsedError | null {
    if (errorText.includes('java.lang.')) {
      return {
        type: 'java_error',
        message: errorText,
        filePath: 'unknown',
        line: 0,
        language: 'java'
      };
    }
    return null;
  }
}

// Register
const parser = ErrorParser.getInstance();
parser.registerParser('java', new JavaParser());

// Use
const javaError = parser.parse('java.lang.NullPointerException', 'Main.java');
```

---

## Error Handling

### Null Returns

```typescript
const error = parser.parse(errorText);

if (!error) {
  console.error('Unrecognized error format');
  console.error('Error text:', errorText);
  return;
}

// error is guaranteed to be ParsedError here
console.log(error.type);
```

### Validation

```typescript
import { InputValidator } from './utils/InputValidator';

try {
  InputValidator.validateParsedError(error);
  // error is valid
} catch (validationError) {
  console.error('Invalid parsed error:', validationError.message);
}
```

---

## Testing

### Unit Tests

```typescript
describe('ErrorParser', () => {
  it('should parse lateinit error', () => {
    const result = parser.parse('lateinit property user has not been initialized');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('lateinit');
  });
  
  it('should detect Compose from keywords', () => {
    const result = parser.parse('Composable recomposing');
    expect(result?.language).toBe('kotlin');
    expect(result?.framework).toBe('compose');
  });
});
```

### Coverage

- **ErrorParser:** 95%+ coverage
- **KotlinParser:** 95%+ coverage (24 tests)
- **GradleParser:** 95%+ coverage (24 tests)
- **JetpackComposeParser:** 95%+ coverage (20 tests)
- **XMLParser:** 95%+ coverage (18 tests)
- **LanguageDetector:** 95%+ coverage (33 tests)

---

## Performance

### Parsing Speed

- **Average:** 1-5ms per error
- **Large errors (>10KB):** 10-20ms
- **Batch (100 errors):** 200-500ms

### Memory

- **Per ParsedError:** ~1KB
- **Parser instance:** ~10KB
- **With 1000 cached results:** ~1MB

---

## Extending Parsers

### Adding New Error Type

```typescript
// In KotlinParser.ts
private parseNewErrorType(text: string): ParsedError | null {
  const match = text.match(/pattern for new error/);
  if (match) {
    return {
      type: 'new_error_type',
      message: text,
      filePath: extractFilePath(text),
      line: extractLine(text),
      language: 'kotlin',
      metadata: { /* custom metadata */ }
    };
  }
  return null;
}

// Add to parse() method
parse(text: string): ParsedError | null {
  return (
    this.parseNewErrorType(text) ||
    this.parseLateinit(text) ||
    // ... other parsers
    null
  );
}
```

### Adding New Language Parser

```typescript
// Create new parser file
// src/utils/parsers/JavaParser.ts
export class JavaParser {
  parse(errorText: string): ParsedError | null {
    // Parsing logic
    return null;
  }
}

// Register in ErrorParser constructor
import { JavaParser } from './parsers/JavaParser';

private registerDefaultParsers(): void {
  this.registerParser('kotlin', new KotlinParser());
  this.registerParser('java', new JavaParser()); // New
  // ...
}
```

---

## See Also

- [Agent API](./Agent.md) - Uses parsed errors for analysis
- [Tool API](./Tools.md) - Tools for gathering error context
- [Database API](./Database.md) - Stores parsed errors
- [Architecture Overview](../architecture/overview.md) - System design
