# Tool API Reference

> **Module:** `src/tools/`  
> **Purpose:** Agent tools for code analysis and context gathering  
> **Last Updated:** December 20, 2025 (Chunk 5.5)

---

## Overview

The Tool module provides analysis capabilities that agents can execute during reasoning iterations. All tools are registered in ToolRegistry with Zod schema validation and provide consistent error handling.

**Available Tools:**
- `ReadFileTool` - Read source files with context window
- `LSPTool` - Language Server Protocol integration (call hierarchy, definitions)
- `AndroidBuildTool` - Gradle build analysis and dependency resolution
- `AndroidDocsSearchTool` - Android SDK documentation search
- `ManifestAnalyzerTool` - AndroidManifest.xml analysis
- `ToolRegistry` - Central tool management and execution

---

## ToolRegistry

**File:** `src/tools/ToolRegistry.ts`  
**Purpose:** Central registry for tool registration, discovery, and execution

### Class Definition

```typescript
class ToolRegistry {
  static getInstance(): ToolRegistry
  
  register(name: string, tool: any, schema: z.ZodSchema): void
  has(name: string): boolean
  execute(name: string, parameters: any): Promise<any>
  list(): ToolInfo[]
  getSchema(name: string): z.ZodSchema | undefined
}
```

### getInstance()

Get singleton instance of ToolRegistry.

```typescript
static getInstance(): ToolRegistry
```

**Example:**
```typescript
const registry = ToolRegistry.getInstance();
```

### register()

Register a tool with validation schema.

```typescript
register(name: string, tool: any, schema: z.ZodSchema): void
```

**Parameters:**
- `name: string` - Tool identifier (e.g., 'read_file')
- `tool: any` - Tool instance with execute() method
- `schema: z.ZodSchema` - Zod schema for parameter validation

**Example:**
```typescript
import { z } from 'zod';

const readFileSchema = z.object({
  filePath: z.string(),
  line: z.number(),
  contextLines: z.number().optional()
});

registry.register('read_file', new ReadFileTool(), readFileSchema);
```

### execute()

Execute a registered tool with parameters.

```typescript
async execute(name: string, parameters: any): Promise<any>
```

**Parameters:**
- `name: string` - Tool name
- `parameters: any` - Tool parameters (validated against schema)

**Returns:** Tool execution result

**Throws:**
- `Error('Tool not found')` - If tool not registered
- `ZodError` - If parameters fail validation
- Tool-specific errors

**Example:**
```typescript
try {
  const result = await registry.execute('read_file', {
    filePath: 'MainActivity.kt',
    line: 45,
    contextLines: 25
  });
  
  console.log('File content:', result);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Invalid parameters:', error.errors);
  } else {
    console.error('Tool execution failed:', error.message);
  }
}
```

### list()

Get list of all registered tools with metadata.

```typescript
list(): ToolInfo[]
```

**Returns:**
```typescript
interface ToolInfo {
  name: string;
  description?: string;
  schema: z.ZodSchema;
}
```

**Example:**
```typescript
const tools = registry.list();
console.log('Available tools:');
tools.forEach(tool => {
  console.log(`- ${tool.name}`);
});
```

---

## ReadFileTool

**File:** `src/tools/ReadFileTool.ts`  
**Purpose:** Read source files with configurable context window

### Class Definition

```typescript
class ReadFileTool {
  execute(params: ReadFileParams): Promise<string | null>
}
```

### execute()

Read file with context around specific line.

```typescript
async execute(params: ReadFileParams): Promise<string | null>
```

**Parameters:**
```typescript
interface ReadFileParams {
  filePath: string;       // Absolute or workspace-relative path
  line: number;           // Target line number (1-based)
  contextLines?: number;  // Lines of context (default: 25)
  entireFile?: boolean;   // Read entire file (ignores line/context)
}
```

**Returns:**
- `string` - File content with line numbers
- `null` - If file not found, binary, or error

**Features:**
- Binary file detection (skips)
- Size limit (10MB max)
- UTF-8 encoding support
- Line number prefix
- CRLF/LF normalization

**Example:**
```typescript
const tool = new ReadFileTool();

// Read 50 lines around line 45
const content = await tool.execute({
  filePath: 'src/MainActivity.kt',
  line: 45,
  contextLines: 25
});

if (content) {
  console.log(content);
  // Output:
  // 20: class MainActivity : AppCompatActivity() {
  // 21:     private lateinit var user: User
  // ...
  // 45:     val name = user.name  // <-- Error here
  // ...
  // 70: }
} else {
  console.log('Could not read file');
}

// Read entire file
const fullContent = await tool.execute({
  filePath: 'src/MainActivity.kt',
  line: 0,
  entireFile: true
});
```

**Error Handling:**
```typescript
const result = await tool.execute(params);

if (result === null) {
  // File not found, binary, or too large
  console.log('Could not read file');
} else if (result.includes('[Binary file detected]')) {
  console.log('File is binary, cannot read');
} else if (result.includes('[File too large]')) {
  console.log('File exceeds 10MB limit');
}
```

---

## LSPTool

**File:** `src/tools/LSPTool.ts`  
**Purpose:** Language Server Protocol integration (call hierarchy, definitions)

### Class Definition

```typescript
class LSPTool {
  findCallers(params: FindCallersParams): Promise<string | null>
  findDefinition(params: FindDefinitionParams): Promise<string | null>
  findImplementations(params: FindImplementationsParams): Promise<string | null>
}
```

### findCallers()

Find all locations that call a specific function.

```typescript
async findCallers(params: FindCallersParams): Promise<string | null>
```

**Parameters:**
```typescript
interface FindCallersParams {
  functionName: string;  // Function to find callers for
  filePath: string;      // File containing function definition
}
```

**Returns:**
- `string` - Formatted list of caller locations
- `null` - If function not found or no callers

**Example:**
```typescript
const lsp = new LSPTool();

const callers = await lsp.findCallers({
  functionName: 'getUserData',
  filePath: 'src/UserRepository.kt'
});

console.log(callers);
// Output:
// Callers of getUserData:
//   - UserViewModel.kt:45 (fun loadUser)
//   - ProfileFragment.kt:23 (fun onViewCreated)
//   - SettingsActivity.kt:67 (fun onCreate)
```

**Note:** Currently uses regex fallback. Full VS Code LSP integration pending.

### findDefinition()

Find definition of a symbol.

```typescript
async findDefinition(params: FindDefinitionParams): Promise<string | null>
```

**Parameters:**
```typescript
interface FindDefinitionParams {
  symbol: string;    // Symbol to find (class, function, variable)
  filePath: string;  // File containing symbol reference
}
```

**Returns:**
- `string` - Definition location and snippet
- `null` - If symbol not found

**Example:**
```typescript
const definition = await lsp.findDefinition({
  symbol: 'User',
  filePath: 'src/MainActivity.kt'
});

console.log(definition);
// Output:
// Definition of User:
//   File: models/User.kt
//   Line: 12
//   Code: data class User(val id: String, val name: String)
```

---

## AndroidBuildTool

**File:** `src/tools/AndroidBuildTool.ts`  
**Purpose:** Gradle build analysis and dependency resolution

### Class Definition

```typescript
class AndroidBuildTool {
  execute(params: BuildAnalysisParams): Promise<BuildAnalysisResult>
}
```

### execute()

Analyze Gradle build errors and suggest fixes.

```typescript
async execute(params: BuildAnalysisParams): Promise<BuildAnalysisResult>
```

**Parameters:**
```typescript
interface BuildAnalysisParams {
  errorText: string;     // Gradle error output
  projectRoot: string;   // Project root directory
}
```

**Returns:**
```typescript
interface BuildAnalysisResult {
  errorType: string;              // 'dependency_conflict', 'task_failure', etc.
  analysis: string;               // Root cause explanation
  suggestedFixes: string[];       // Fix recommendations
  conflictingDependencies?: {     // For dependency conflicts
    module: string;
    versions: string[];
    recommended: string;
  };
}
```

**Supported Error Types:**
- `dependency_conflict` - Version conflicts
- `dependency_resolution` - Missing dependencies
- `task_failure` - Task execution failures
- `compilation_error` - Kotlin/Java compilation
- `build_script_syntax` - build.gradle syntax errors

**Example:**
```typescript
const buildTool = new AndroidBuildTool();

const result = await buildTool.execute({
  errorText: `
    Conflict found for module 'androidx.lifecycle:lifecycle-runtime'
    versions 2.5.1 and 2.6.0
  `,
  projectRoot: '/workspace/my-app'
});

console.log('Error Type:', result.errorType);
// 'dependency_conflict'

console.log('Analysis:', result.analysis);
// Multiple versions of lifecycle-runtime are required by different dependencies

console.log('Suggested Fixes:');
result.suggestedFixes.forEach(fix => console.log('-', fix));
// - Add explicit version in build.gradle: implementation("androidx.lifecycle:lifecycle-runtime:2.6.0")
// - Use dependency resolution strategy
// - Check transitive dependencies with ./gradlew dependencies

if (result.conflictingDependencies) {
  console.log('Recommended version:', result.conflictingDependencies.recommended);
  // '2.6.0'
}
```

---

## AndroidDocsSearchTool

**File:** `src/tools/AndroidDocsSearchTool.ts`  
**Purpose:** Search Android SDK documentation

### Class Definition

```typescript
class AndroidDocsSearchTool {
  execute(params: DocsSearchParams): Promise<string>
}
```

### execute()

Search Android documentation for API or concept.

```typescript
async execute(params: DocsSearchParams): Promise<string>
```

**Parameters:**
```typescript
interface DocsSearchParams {
  query: string;      // Search query (API name, concept, error message)
  maxResults?: number; // Maximum results (default: 5)
}
```

**Returns:** Formatted search results with descriptions and links

**Example:**
```typescript
const docsTool = new AndroidDocsSearchTool();

const results = await docsTool.execute({
  query: 'Activity lifecycle',
  maxResults: 3
});

console.log(results);
// Output:
// Android Documentation Results for "Activity lifecycle":
//
// 1. Activity
//    Description: Base class for activities. onCreate() is called when activity is starting...
//    API: android.app.Activity
//
// 2. Fragment Lifecycle
//    Description: Fragments have their own lifecycle callbacks similar to activities...
//    API: androidx.fragment.app.Fragment
//
// 3. ViewModel
//    Description: Designed to store and manage UI-related data in a lifecycle-conscious way...
//    API: androidx.lifecycle.ViewModel
```

**Use Cases:**
- Lookup API documentation during error analysis
- Find best practices for specific APIs
- Understand Android concepts mentioned in errors
- Verify correct usage patterns

---

## ManifestAnalyzerTool

**File:** `src/tools/ManifestAnalyzerTool.ts`  
**Purpose:** Analyze AndroidManifest.xml errors

### Class Definition

```typescript
class ManifestAnalyzerTool {
  execute(params: ManifestAnalysisParams): Promise<ManifestAnalysisResult>
}
```

### execute()

Analyze manifest-related errors.

```typescript
async execute(params: ManifestAnalysisParams): Promise<ManifestAnalysisResult>
```

**Parameters:**
```typescript
interface ManifestAnalysisParams {
  errorText: string;      // Manifest error output
  manifestPath: string;   // Path to AndroidManifest.xml
}
```

**Returns:**
```typescript
interface ManifestAnalysisResult {
  errorType: string;              // 'merge_conflict', 'missing_permission', etc.
  analysis: string;               // Root cause
  suggestedFixes: string[];       // Fix recommendations
  missingPermission?: string;     // For permission errors
  conflictingAttributes?: {       // For merge conflicts
    attribute: string;
    values: string[];
  };
}
```

**Supported Error Types:**
- `merge_conflict` - Manifest merger conflicts
- `missing_permission` - Required permission not declared
- `undeclared_component` - Activity/Service not declared
- `duplicate_component` - Duplicate component declarations

**Example:**
```typescript
const manifestTool = new ManifestAnalyzerTool();

const result = await manifestTool.execute({
  errorText: 'Permission denied: requires android.permission.CAMERA',
  manifestPath: 'app/src/main/AndroidManifest.xml'
});

console.log('Error Type:', result.errorType);
// 'missing_permission'

console.log('Missing Permission:', result.missingPermission);
// 'android.permission.CAMERA'

console.log('Suggested Fixes:');
result.suggestedFixes.forEach(fix => console.log('-', fix));
// - Add <uses-permission android:name="android.permission.CAMERA" /> to AndroidManifest.xml
// - Request runtime permission in Android 6.0+ using ActivityCompat.requestPermissions()
// - Handle permission denial in onRequestPermissionsResult()
```

---

## Usage Patterns

### Agent Tool Execution

```typescript
import { MinimalReactAgent } from './agent/MinimalReactAgent';
import { ToolRegistry } from './tools/ToolRegistry';

const agent = new MinimalReactAgent(llm, {
  useToolRegistry: true
});

// Agent automatically executes tools during analysis
const result = await agent.analyze(error);

console.log('Tools used:', result.toolsUsed);
// ['read_file', 'find_callers']
```

### Manual Tool Execution

```typescript
const registry = ToolRegistry.getInstance();

// List available tools
const tools = registry.list();
console.log('Available tools:', tools.map(t => t.name));

// Execute tool directly
const fileContent = await registry.execute('read_file', {
  filePath: 'MainActivity.kt',
  line: 45
});

// Execute multiple tools
const results = await Promise.all([
  registry.execute('read_file', { filePath: 'MainActivity.kt', line: 45 }),
  registry.execute('find_callers', { functionName: 'onCreate', filePath: 'MainActivity.kt' })
]);
```

### Custom Tool Registration

```typescript
// Define custom tool
class GitBlameTool {
  async execute(params: { filePath: string; line: number }) {
    // Git blame logic
    return 'Last modified by: John Doe, 2 days ago';
  }
}

// Define schema
const gitBlameSchema = z.object({
  filePath: z.string(),
  line: z.number()
});

// Register
const registry = ToolRegistry.getInstance();
registry.register('git_blame', new GitBlameTool(), gitBlameSchema);

// Use
const blame = await registry.execute('git_blame', {
  filePath: 'MainActivity.kt',
  line: 45
});
```

---

## Error Handling

### Tool Not Found

```typescript
try {
  await registry.execute('nonexistent_tool', {});
} catch (error) {
  console.error('Tool error:', error.message);
  // 'Tool not found: nonexistent_tool'
}
```

### Invalid Parameters

```typescript
try {
  await registry.execute('read_file', {
    filePath: 'MainActivity.kt'
    // Missing required 'line' parameter
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation errors:');
    error.errors.forEach(err => {
      console.error(`- ${err.path.join('.')}: ${err.message}`);
    });
  }
}
```

### Tool Execution Failure

```typescript
const result = await registry.execute('read_file', {
  filePath: 'NonExistent.kt',
  line: 45
});

if (result === null) {
  console.log('Tool returned null (file not found or error)');
}
```

---

## Performance

### Tool Execution Times

| Tool | Average | Max | Notes |
|------|---------|-----|-------|
| ReadFileTool | 2-5ms | 50ms | Depends on file size |
| LSPTool | 10-30ms | 100ms | Regex fallback |
| AndroidBuildTool | 50-100ms | 500ms | Parses build output |
| AndroidDocsSearchTool | 5-10ms | 50ms | In-memory search |
| ManifestAnalyzerTool | 10-20ms | 100ms | XML parsing |

### Optimization Tips

- **Cache tool results** - Avoid redundant executions
- **Parallel execution** - Use Promise.all() for independent tools
- **Limit context** - Use smaller contextLines for ReadFileTool
- **Batch queries** - Combine multiple searches when possible

---

## Testing

### Unit Tests

```typescript
describe('ReadFileTool', () => {
  it('should read file with context', async () => {
    const result = await tool.execute({
      filePath: 'test.kt',
      line: 10,
      contextLines: 5
    });
    
    expect(result).toContain('5:');
    expect(result).toContain('10:');
    expect(result).toContain('15:');
  });
  
  it('should handle missing file', async () => {
    const result = await tool.execute({
      filePath: 'nonexistent.kt',
      line: 10
    });
    
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('Agent with Tools', () => {
  it('should use ReadFileTool during analysis', async () => {
    const result = await agent.analyze(error);
    
    expect(result.toolsUsed).toContain('read_file');
    expect(result.rootCause).toContain('code context');
  });
});
```

---

## See Also

- [Agent API](./Agent.md) - Uses tools during analysis
- [Parser API](./Parsers.md) - Parses errors before tool execution
- [Database API](./Database.md) - Stores tool results
- [Architecture Overview](../architecture/overview.md) - System design
