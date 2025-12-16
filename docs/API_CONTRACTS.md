<<<<<<< HEAD
# API Contracts - Tool Input/Output Schemas

> **Purpose:** Define exact JSON schemas for all LLM tools to ensure consistent communication between agent and toolset.  
> **Project:** Local-first Kotlin/Android debugging assistant (Phase 1)  
> **Validation:** Use Zod runtime validation to enforce contracts.  
> **Update Rule:** Every new tool MUST have its schema documented here before implementation.

**Key Design Principle:** Tools support unlimited iterations and context - advantages of local LLM deployment.

---

## Schema Format

Each tool contract specifies:
1. **Tool Name** - Unique identifier used by LLM
2. **Description** - What the tool does (visible to LLM in system prompt)
3. **Input Parameters** - JSON schema with types, constraints, descriptions
4. **Output Format** - Expected return structure
5. **Error Responses** - How failures are communicated
6. **Example Usage** - Sample LLM request and tool response

---

## Tool Registry

| Tool Name | Phase | Purpose | Status |
|-----------|-------|---------|--------|
| `read_file` | 1.3 | Read workspace file contents | ☐ Not Implemented |
| `web_search_wiki` | 1.3 | Search external documentation | ☐ Not Implemented |
| `get_code_context` | 1.6 | Extract code around error location | ☐ Not Implemented |
| `find_callers_of_function` | 1.6 | LSP call hierarchy | ☐ Not Implemented |
| `vector_search_db` | 2.3 | Query past RCA solutions | ☐ Not Implemented |
| `get_user_error_context` | 2.3 | Capture error logs from user | ☐ Not Implemented |

---

## 1. `read_file`

### Description
Read the complete contents of a file in the workspace, optionally specifying line range.

### Input Parameters (Zod Schema)
```typescript
z.object({
  filePath: z.string()
    .describe('Relative path from workspace root (e.g., "src/utils/helper.ts")'),
  lineStart: z.number().int().positive().optional()
    .describe('Starting line number (1-indexed, inclusive)'),
  lineEnd: z.number().int().positive().optional()
    .describe('Ending line number (1-indexed, inclusive)'),
  encoding: z.enum(['utf-8', 'utf-16', 'ascii']).default('utf-8')
    .describe('File encoding'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    filePath: string;
    content: string;
    lineCount: number;
    encoding: string;
    fileSize: number;  // bytes
  };
  error?: {
    code: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'BINARY_FILE' | 'TOO_LARGE';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "read_file",
  "parameters": {
    "filePath": "src/api/user.ts",
    "lineStart": 40,
    "lineEnd": 55
  }
}
```

**Tool Response (Success):**
```json
{
  "success": true,
  "data": {
    "filePath": "src/api/user.ts",
    "content": "export async function fetchUserData(userId: string) {\n  const response = await fetch(`/api/users/${userId}`);\n  const data = await response.json();\n  return data.users.map(u => u.name);\n}",
    "lineCount": 5,
    "encoding": "utf-8",
    "fileSize": 156
  }
}
```

**Tool Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File 'src/api/user.ts' does not exist in workspace"
  }
}
```

---

## 2. `web_search_wiki`

### Description
Search external documentation (Stack Overflow, GitHub issues, official docs) for error solutions.

### Input Parameters (Zod Schema)
```typescript
z.object({
  query: z.string().min(3).max(200)
    .describe('Search query (error message, function name, or concept)'),
  sources: z.array(z.enum(['stackoverflow', 'github', 'docs', 'mdn']))
    .default(['stackoverflow', 'github'])
    .describe('Which sources to search'),
  maxResults: z.number().int().min(1).max(10).default(5)
    .describe('Maximum number of results to return'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    query: string;
    results: Array<{
      title: string;
      url: string;
      snippet: string;  // 200 char excerpt
      source: 'stackoverflow' | 'github' | 'docs' | 'mdn';
      relevanceScore: number;  // 0.0-1.0
    }>;
    totalFound: number;
  };
  error?: {
    code: 'RATE_LIMIT_EXCEEDED' | 'API_ERROR' | 'NO_RESULTS';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "web_search_wiki",
  "parameters": {
    "query": "TypeError Cannot read property map of undefined",
    "sources": ["stackoverflow"],
    "maxResults": 3
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "query": "TypeError Cannot read property map of undefined",
    "results": [
      {
        "title": "How to handle undefined when using .map()?",
        "url": "https://stackoverflow.com/questions/12345",
        "snippet": "The error occurs when the variable is undefined. Use optional chaining: data?.map(...)",
        "source": "stackoverflow",
        "relevanceScore": 0.92
      }
    ],
    "totalFound": 3
  }
}
```

---

## 3. `get_code_context`

### Description
Extract code surrounding an error location, including function definitions and relevant imports.

### Input Parameters (Zod Schema)
```typescript
z.object({
  filePath: z.string()
    .describe('File containing the error'),
  line: z.number().int().positive()
    .describe('Error line number (1-indexed)'),
  contextLines: z.number().int().min(5).max(100).default(50)
    .describe('Number of lines to include (before and after error)'),
  includeFunctionDef: z.boolean().default(true)
    .describe('Whether to include the full function containing the error'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    filePath: string;
    errorLine: number;
    context: {
      before: string;  // Code before error line
      errorLine: string;  // The actual error line
      after: string;  // Code after error line
    };
    functionDefinition?: {
      name: string;
      startLine: number;
      endLine: number;
      signature: string;
    };
    relevantImports: Array<{
      module: string;
      imported: string[];
      line: number;
    }>;
  };
  error?: {
    code: 'FILE_NOT_FOUND' | 'LINE_OUT_OF_RANGE';
    message: string;
  };
}
```

---

## 4. `find_callers_of_function`

### Description
Use VS Code LSP to find all functions/methods that call the specified function. Useful for tracing error propagation.

### Input Parameters (Zod Schema)
```typescript
z.object({
  functionName: z.string()
    .describe('Name of the function to find callers for'),
  filePath: z.string()
    .describe('File where function is defined'),
  maxDepth: z.number().int().min(1).max(5).default(2)
    .describe('Maximum call chain depth to traverse'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    functionName: string;
    filePath: string;
    callers: Array<{
      callerName: string;
      filePath: string;
      line: number;
      callChain: string[];  // ['main', 'processData', 'fetchData']
      depth: number;
    }>;
    totalCallers: number;
  };
  error?: {
    code: 'FUNCTION_NOT_FOUND' | 'LSP_UNAVAILABLE' | 'TIMEOUT';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "find_callers_of_function",
  "parameters": {
    "functionName": "fetchUserData",
    "filePath": "src/api/user.ts",
    "maxDepth": 2
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "functionName": "fetchUserData",
    "filePath": "src/api/user.ts",
    "callers": [
      {
        "callerName": "UserProfile.loadData",
        "filePath": "src/components/UserProfile.tsx",
        "line": 23,
        "callChain": ["UserProfile.render", "UserProfile.loadData", "fetchUserData"],
        "depth": 2
      },
      {
        "callerName": "Dashboard.init",
        "filePath": "src/views/Dashboard.tsx",
        "line": 45,
        "callChain": ["Dashboard.init", "fetchUserData"],
        "depth": 1
      }
    ],
    "totalCallers": 2
  }
}
```

---

## 5. `vector_search_db`

### Description
Query ChromaDB for past RCA solutions similar to the current error.

### Input Parameters (Zod Schema)
```typescript
z.object({
  query: z.string()
    .describe('Error description or stack trace to search for'),
  language: z.string().optional()
    .describe('Filter by programming language (e.g., "typescript", "python")'),
  errorType: z.string().optional()
    .describe('Filter by error type (e.g., "TypeError", "NullPointerException")'),
  minConfidence: z.number().min(0).max(1).default(0.7)
    .describe('Minimum confidence score for results'),
  limit: z.number().int().min(1).max(10).default(5)
    .describe('Maximum number of results'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    query: string;
    results: Array<{
      id: string;
      errorDescription: string;
      rootCause: string;
      solution: string;
      language: string;
      errorType: string;
      confidence: number;  // 0.0-1.0
      userValidated: boolean;
      similarity: number;  // Cosine similarity to query
      metadata: {
        createdAt: string;
        fixedIn: string;  // File path
      };
    }>;
    totalFound: number;
  };
  error?: {
    code: 'DB_CONNECTION_FAILED' | 'EMBEDDING_FAILED' | 'NO_RESULTS';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "vector_search_db",
  "parameters": {
    "query": "Cannot read property 'map' of undefined in React component",
    "language": "typescript",
    "errorType": "TypeError",
    "minConfidence": 0.75,
    "limit": 3
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "query": "Cannot read property 'map' of undefined in React component",
    "results": [
      {
        "id": "rca-001",
        "errorDescription": "TypeError: Cannot read property 'map' of undefined when rendering user list",
        "rootCause": "API response returns null when no users found, but component assumes array",
        "solution": "Add null check before mapping: users?.map(...) ?? []",
        "language": "typescript",
        "errorType": "TypeError",
        "confidence": 0.89,
        "userValidated": true,
        "similarity": 0.94,
        "metadata": {
          "createdAt": "2025-12-01T10:30:00Z",
          "fixedIn": "src/components/UserList.tsx"
        }
      }
    ],
    "totalFound": 3
  }
}
```

---

## 6. `get_user_error_context`

### Description
Capture error context from user's active editor: selected text, cursor position, diagnostic messages, terminal output.

### Input Parameters (Zod Schema)
```typescript
z.object({
  captureSelection: z.boolean().default(true)
    .describe('Include currently selected text'),
  captureDiagnostics: z.boolean().default(true)
    .describe('Include VS Code error/warning diagnostics'),
  captureTerminal: z.boolean().default(false)
    .describe('Include recent terminal output (last 50 lines)'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    activeFile: string;
    cursorPosition: { line: number; character: number };
    selectedText?: string;
    diagnostics: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      line: number;
      column: number;
      source: string;  // 'typescript', 'eslint', etc.
    }>;
    terminalOutput?: string;
  };
  error?: {
    code: 'NO_ACTIVE_EDITOR' | 'NO_DIAGNOSTICS';
    message: string;
  };
}
```

---

## Error Code Reference

### Common Error Codes (All Tools)
- `INVALID_PARAMETERS` - Input validation failed (Zod schema violation)
- `TOOL_TIMEOUT` - Tool execution exceeded 2s limit
- `INTERNAL_ERROR` - Unexpected exception in tool implementation

### File Access Errors
- `FILE_NOT_FOUND` - File path doesn't exist in workspace
- `PERMISSION_DENIED` - File access restricted
- `BINARY_FILE` - Attempted to read non-text file
- `TOO_LARGE` - File exceeds 10MB limit

### API Errors
- `RATE_LIMIT_EXCEEDED` - External API rate limit hit
- `API_ERROR` - External service returned error
- `NO_RESULTS` - Query returned zero results

### LSP Errors
- `FUNCTION_NOT_FOUND` - Symbol not found in file
- `LSP_UNAVAILABLE` - Language server not running
- `TIMEOUT` - LSP request exceeded timeout

### Database Errors
- `DB_CONNECTION_FAILED` - Cannot connect to ChromaDB
- `EMBEDDING_FAILED` - Error generating embedding vector
- `COLLECTION_NOT_FOUND` - ChromaDB collection doesn't exist

---

## Validation Rules

### Runtime Validation (Zod)
All tool parameters MUST be validated using Zod before execution:

```typescript
// src/tools/ToolBase.ts
export abstract class ToolBase implements ToolDefinition {
  async execute(rawParams: unknown): Promise<ToolResult> {
    // 1. Validate parameters
    const parseResult = this.parameters.safeParse(rawParams);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: parseResult.error.message,
        },
      };
    }
    
    // 2. Execute tool logic
    return this.executeInternal(parseResult.data);
  }
  
  protected abstract executeInternal(params: z.infer<this['parameters']>): Promise<ToolResult>;
}
```

### Contract Testing
Each tool must have a contract test verifying schema compliance:

```typescript
// tests/unit/tools/ReadFileTool.test.ts
describe('ReadFileTool Contract', () => {
  test('validates input parameters', async () => {
    const invalidInput = { filePath: 123 };  // Wrong type
    const result = await ReadFileTool.execute(invalidInput);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_PARAMETERS');
  });
  
  test('returns correct output structure', async () => {
    const result = await ReadFileTool.execute({ filePath: 'test.ts' });
    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result.data).toHaveProperty('filePath');
      expect(result.data).toHaveProperty('content');
      expect(result.data).toHaveProperty('lineCount');
    }
  });
});
```

---

## Schema Evolution

### Adding New Parameters (Non-Breaking)
- New parameters MUST be optional or have defaults
- Update this document with new parameter
- Add example usage
- Increment tool version in comments

### Modifying Existing Parameters (Breaking)
- Document in `DEVLOG.md` under "Architecture Decisions"
- Update all example prompts
- Add migration guide if affects stored data

### Deprecating Parameters
- Mark as deprecated in Zod schema: `.describe('[DEPRECATED] ...')`
- Maintain backward compatibility for 2 versions
- Remove after 2 releases

---

## LLM System Prompt Integration

Tools are presented to LLM in system prompt as:

```markdown
AVAILABLE TOOLS:
{
  "read_file": {
    "description": "Read contents of a file in the workspace",
    "parameters": {
      "filePath": "string (required) - Relative path from workspace root",
      "lineStart": "number (optional) - Starting line (1-indexed)",
      "lineEnd": "number (optional) - Ending line (1-indexed)"
    }
  },
  "web_search_wiki": { ... },
  ...
}

USAGE FORMAT:
{
  "tool": "tool_name",
  "parameters": { ... }
}
```

Auto-generated from this document via `scripts/generate-tool-docs.ts`.

---

**Last Updated:** December 14, 2025 (Week 0)  
**Next Update:** After implementing first tools (Week 1-2)
=======
# API Contracts - Tool Input/Output Schemas

> **Purpose:** Define exact JSON schemas for all LLM tools to ensure consistent communication between agent and toolset.  
> **Project:** Local-first Kotlin/Android debugging assistant (Phase 1)  
> **Validation:** Use Zod runtime validation to enforce contracts.  
> **Update Rule:** Every new tool MUST have its schema documented here before implementation.

**Key Design Principle:** Tools support unlimited iterations and context - advantages of local LLM deployment.

---

## Schema Format

Each tool contract specifies:
1. **Tool Name** - Unique identifier used by LLM
2. **Description** - What the tool does (visible to LLM in system prompt)
3. **Input Parameters** - JSON schema with types, constraints, descriptions
4. **Output Format** - Expected return structure
5. **Error Responses** - How failures are communicated
6. **Example Usage** - Sample LLM request and tool response

---

## Tool Registry

| Tool Name | Phase | Purpose | Status |
|-----------|-------|---------|--------|
| `read_file` | 1.3 | Read workspace file contents | ☐ Not Implemented |
| `web_search_wiki` | 1.3 | Search external documentation | ☐ Not Implemented |
| `get_code_context` | 1.6 | Extract code around error location | ☐ Not Implemented |
| `find_callers_of_function` | 1.6 | LSP call hierarchy | ☐ Not Implemented |
| `vector_search_db` | 2.3 | Query past RCA solutions | ☐ Not Implemented |
| `get_user_error_context` | 2.3 | Capture error logs from user | ☐ Not Implemented |

---

## 1. `read_file`

### Description
Read the complete contents of a file in the workspace, optionally specifying line range.

### Input Parameters (Zod Schema)
```typescript
z.object({
  filePath: z.string()
    .describe('Relative path from workspace root (e.g., "src/utils/helper.ts")'),
  lineStart: z.number().int().positive().optional()
    .describe('Starting line number (1-indexed, inclusive)'),
  lineEnd: z.number().int().positive().optional()
    .describe('Ending line number (1-indexed, inclusive)'),
  encoding: z.enum(['utf-8', 'utf-16', 'ascii']).default('utf-8')
    .describe('File encoding'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    filePath: string;
    content: string;
    lineCount: number;
    encoding: string;
    fileSize: number;  // bytes
  };
  error?: {
    code: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'BINARY_FILE' | 'TOO_LARGE';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "read_file",
  "parameters": {
    "filePath": "src/api/user.ts",
    "lineStart": 40,
    "lineEnd": 55
  }
}
```

**Tool Response (Success):**
```json
{
  "success": true,
  "data": {
    "filePath": "src/api/user.ts",
    "content": "export async function fetchUserData(userId: string) {\n  const response = await fetch(`/api/users/${userId}`);\n  const data = await response.json();\n  return data.users.map(u => u.name);\n}",
    "lineCount": 5,
    "encoding": "utf-8",
    "fileSize": 156
  }
}
```

**Tool Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File 'src/api/user.ts' does not exist in workspace"
  }
}
```

---

## 2. `web_search_wiki`

### Description
Search external documentation (Stack Overflow, GitHub issues, official docs) for error solutions.

### Input Parameters (Zod Schema)
```typescript
z.object({
  query: z.string().min(3).max(200)
    .describe('Search query (error message, function name, or concept)'),
  sources: z.array(z.enum(['stackoverflow', 'github', 'docs', 'mdn']))
    .default(['stackoverflow', 'github'])
    .describe('Which sources to search'),
  maxResults: z.number().int().min(1).max(10).default(5)
    .describe('Maximum number of results to return'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    query: string;
    results: Array<{
      title: string;
      url: string;
      snippet: string;  // 200 char excerpt
      source: 'stackoverflow' | 'github' | 'docs' | 'mdn';
      relevanceScore: number;  // 0.0-1.0
    }>;
    totalFound: number;
  };
  error?: {
    code: 'RATE_LIMIT_EXCEEDED' | 'API_ERROR' | 'NO_RESULTS';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "web_search_wiki",
  "parameters": {
    "query": "TypeError Cannot read property map of undefined",
    "sources": ["stackoverflow"],
    "maxResults": 3
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "query": "TypeError Cannot read property map of undefined",
    "results": [
      {
        "title": "How to handle undefined when using .map()?",
        "url": "https://stackoverflow.com/questions/12345",
        "snippet": "The error occurs when the variable is undefined. Use optional chaining: data?.map(...)",
        "source": "stackoverflow",
        "relevanceScore": 0.92
      }
    ],
    "totalFound": 3
  }
}
```

---

## 3. `get_code_context`

### Description
Extract code surrounding an error location, including function definitions and relevant imports.

### Input Parameters (Zod Schema)
```typescript
z.object({
  filePath: z.string()
    .describe('File containing the error'),
  line: z.number().int().positive()
    .describe('Error line number (1-indexed)'),
  contextLines: z.number().int().min(5).max(100).default(50)
    .describe('Number of lines to include (before and after error)'),
  includeFunctionDef: z.boolean().default(true)
    .describe('Whether to include the full function containing the error'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    filePath: string;
    errorLine: number;
    context: {
      before: string;  // Code before error line
      errorLine: string;  // The actual error line
      after: string;  // Code after error line
    };
    functionDefinition?: {
      name: string;
      startLine: number;
      endLine: number;
      signature: string;
    };
    relevantImports: Array<{
      module: string;
      imported: string[];
      line: number;
    }>;
  };
  error?: {
    code: 'FILE_NOT_FOUND' | 'LINE_OUT_OF_RANGE';
    message: string;
  };
}
```

---

## 4. `find_callers_of_function`

### Description
Use VS Code LSP to find all functions/methods that call the specified function. Useful for tracing error propagation.

### Input Parameters (Zod Schema)
```typescript
z.object({
  functionName: z.string()
    .describe('Name of the function to find callers for'),
  filePath: z.string()
    .describe('File where function is defined'),
  maxDepth: z.number().int().min(1).max(5).default(2)
    .describe('Maximum call chain depth to traverse'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    functionName: string;
    filePath: string;
    callers: Array<{
      callerName: string;
      filePath: string;
      line: number;
      callChain: string[];  // ['main', 'processData', 'fetchData']
      depth: number;
    }>;
    totalCallers: number;
  };
  error?: {
    code: 'FUNCTION_NOT_FOUND' | 'LSP_UNAVAILABLE' | 'TIMEOUT';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "find_callers_of_function",
  "parameters": {
    "functionName": "fetchUserData",
    "filePath": "src/api/user.ts",
    "maxDepth": 2
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "functionName": "fetchUserData",
    "filePath": "src/api/user.ts",
    "callers": [
      {
        "callerName": "UserProfile.loadData",
        "filePath": "src/components/UserProfile.tsx",
        "line": 23,
        "callChain": ["UserProfile.render", "UserProfile.loadData", "fetchUserData"],
        "depth": 2
      },
      {
        "callerName": "Dashboard.init",
        "filePath": "src/views/Dashboard.tsx",
        "line": 45,
        "callChain": ["Dashboard.init", "fetchUserData"],
        "depth": 1
      }
    ],
    "totalCallers": 2
  }
}
```

---

## 5. `vector_search_db`

### Description
Query ChromaDB for past RCA solutions similar to the current error.

### Input Parameters (Zod Schema)
```typescript
z.object({
  query: z.string()
    .describe('Error description or stack trace to search for'),
  language: z.string().optional()
    .describe('Filter by programming language (e.g., "typescript", "python")'),
  errorType: z.string().optional()
    .describe('Filter by error type (e.g., "TypeError", "NullPointerException")'),
  minConfidence: z.number().min(0).max(1).default(0.7)
    .describe('Minimum confidence score for results'),
  limit: z.number().int().min(1).max(10).default(5)
    .describe('Maximum number of results'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    query: string;
    results: Array<{
      id: string;
      errorDescription: string;
      rootCause: string;
      solution: string;
      language: string;
      errorType: string;
      confidence: number;  // 0.0-1.0
      userValidated: boolean;
      similarity: number;  // Cosine similarity to query
      metadata: {
        createdAt: string;
        fixedIn: string;  // File path
      };
    }>;
    totalFound: number;
  };
  error?: {
    code: 'DB_CONNECTION_FAILED' | 'EMBEDDING_FAILED' | 'NO_RESULTS';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "vector_search_db",
  "parameters": {
    "query": "Cannot read property 'map' of undefined in React component",
    "language": "typescript",
    "errorType": "TypeError",
    "minConfidence": 0.75,
    "limit": 3
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "query": "Cannot read property 'map' of undefined in React component",
    "results": [
      {
        "id": "rca-001",
        "errorDescription": "TypeError: Cannot read property 'map' of undefined when rendering user list",
        "rootCause": "API response returns null when no users found, but component assumes array",
        "solution": "Add null check before mapping: users?.map(...) ?? []",
        "language": "typescript",
        "errorType": "TypeError",
        "confidence": 0.89,
        "userValidated": true,
        "similarity": 0.94,
        "metadata": {
          "createdAt": "2025-12-01T10:30:00Z",
          "fixedIn": "src/components/UserList.tsx"
        }
      }
    ],
    "totalFound": 3
  }
}
```

---

## 6. `get_user_error_context`

### Description
Capture error context from user's active editor: selected text, cursor position, diagnostic messages, terminal output.

### Input Parameters (Zod Schema)
```typescript
z.object({
  captureSelection: z.boolean().default(true)
    .describe('Include currently selected text'),
  captureDiagnostics: z.boolean().default(true)
    .describe('Include VS Code error/warning diagnostics'),
  captureTerminal: z.boolean().default(false)
    .describe('Include recent terminal output (last 50 lines)'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    activeFile: string;
    cursorPosition: { line: number; character: number };
    selectedText?: string;
    diagnostics: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      line: number;
      column: number;
      source: string;  // 'typescript', 'eslint', etc.
    }>;
    terminalOutput?: string;
  };
  error?: {
    code: 'NO_ACTIVE_EDITOR' | 'NO_DIAGNOSTICS';
    message: string;
  };
}
```

---

## Error Code Reference

### Common Error Codes (All Tools)
- `INVALID_PARAMETERS` - Input validation failed (Zod schema violation)
- `TOOL_TIMEOUT` - Tool execution exceeded 2s limit
- `INTERNAL_ERROR` - Unexpected exception in tool implementation

### File Access Errors
- `FILE_NOT_FOUND` - File path doesn't exist in workspace
- `PERMISSION_DENIED` - File access restricted
- `BINARY_FILE` - Attempted to read non-text file
- `TOO_LARGE` - File exceeds 10MB limit

### API Errors
- `RATE_LIMIT_EXCEEDED` - External API rate limit hit
- `API_ERROR` - External service returned error
- `NO_RESULTS` - Query returned zero results

### LSP Errors
- `FUNCTION_NOT_FOUND` - Symbol not found in file
- `LSP_UNAVAILABLE` - Language server not running
- `TIMEOUT` - LSP request exceeded timeout

### Database Errors
- `DB_CONNECTION_FAILED` - Cannot connect to ChromaDB
- `EMBEDDING_FAILED` - Error generating embedding vector
- `COLLECTION_NOT_FOUND` - ChromaDB collection doesn't exist

---

## Validation Rules

### Runtime Validation (Zod)
All tool parameters MUST be validated using Zod before execution:

```typescript
// src/tools/ToolBase.ts
export abstract class ToolBase implements ToolDefinition {
  async execute(rawParams: unknown): Promise<ToolResult> {
    // 1. Validate parameters
    const parseResult = this.parameters.safeParse(rawParams);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: parseResult.error.message,
        },
      };
    }
    
    // 2. Execute tool logic
    return this.executeInternal(parseResult.data);
  }
  
  protected abstract executeInternal(params: z.infer<this['parameters']>): Promise<ToolResult>;
}
```

### Contract Testing
Each tool must have a contract test verifying schema compliance:

```typescript
// tests/unit/tools/ReadFileTool.test.ts
describe('ReadFileTool Contract', () => {
  test('validates input parameters', async () => {
    const invalidInput = { filePath: 123 };  // Wrong type
    const result = await ReadFileTool.execute(invalidInput);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_PARAMETERS');
  });
  
  test('returns correct output structure', async () => {
    const result = await ReadFileTool.execute({ filePath: 'test.ts' });
    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result.data).toHaveProperty('filePath');
      expect(result.data).toHaveProperty('content');
      expect(result.data).toHaveProperty('lineCount');
    }
  });
});
```

---

## Schema Evolution

### Adding New Parameters (Non-Breaking)
- New parameters MUST be optional or have defaults
- Update this document with new parameter
- Add example usage
- Increment tool version in comments

### Modifying Existing Parameters (Breaking)
- Document in `DEVLOG.md` under "Architecture Decisions"
- Update all example prompts
- Add migration guide if affects stored data

### Deprecating Parameters
- Mark as deprecated in Zod schema: `.describe('[DEPRECATED] ...')`
- Maintain backward compatibility for 2 versions
- Remove after 2 releases

---

## LLM System Prompt Integration

Tools are presented to LLM in system prompt as:

```markdown
AVAILABLE TOOLS:
{
  "read_file": {
    "description": "Read contents of a file in the workspace",
    "parameters": {
      "filePath": "string (required) - Relative path from workspace root",
      "lineStart": "number (optional) - Starting line (1-indexed)",
      "lineEnd": "number (optional) - Ending line (1-indexed)"
    }
  },
  "web_search_wiki": { ... },
  ...
}

USAGE FORMAT:
{
  "tool": "tool_name",
  "parameters": { ... }
}
```

Auto-generated from this document via `scripts/generate-tool-docs.ts`.

---

**Last Updated:** December 14, 2025 (Week 0)  
**Next Update:** After implementing first tools (Week 1-2)
>>>>>>> 8c58113224bbf7a87a7715a24cf9d7750b167135
