# 🏗️ PHASE 1 - OPTION A: Traditional Systematic Approach

> **Goal:** Build systematically with testable milestones. Best for thorough learning.

[← Back to Phase 1 Overview](Phase1-Foundation-Kotlin-Android.md) | [Compare with Option B →](Phase1-OptionB-MVP-First.md)

---

## Overview

**Timeline:** 12 weeks (flexible)  
**Best for:** Comprehensive coverage, deep understanding  
**Structure:** 6 major chunks, each ending with integration tests

### When to Choose This Approach

✅ Want to learn systematically and thoroughly  
✅ Prefer building solid foundations before moving forward  
✅ Have 12 weeks to dedicate (flexible pace)  
✅ Like structured learning with clear milestones  
✅ Don't mind waiting to see it work end-to-end

---

## Chunk Overview

| Chunk | Focus | Duration | Test Deliverable |
|-------|-------|----------|------------------|
| **Chunk 1** | Core Infrastructure | Weeks 1-2 | Extension loads, DB works, basic command runs |
| **Chunk 2** | Tool Ecosystem | Weeks 3-4 | Can read files, parse errors, use LSP |
| **Chunk 3** | Agent Intelligence | Weeks 5-6 | End-to-end RCA for simple Kotlin NPE |
| **Chunk 4** | Android Specialization | Weeks 7-8 | Handles Compose, XML, Gradle errors |
| **Chunk 5** | User Experience | Weeks 9-10 | UI works, educational mode functional |
| **Chunk 6** | Production Ready | Weeks 11-12 | Full test suite, performance targets met |

---

## 🔧 CHUNK 1: Core Infrastructure Setup (Weeks 1-2)

**Priority:** 🔥 CRITICAL - Foundation for everything else  
**Goal:** Get basic extension running with database connection

### What You'll Build
- VS Code extension with command registration
- Ollama LLM client integration
- ChromaDB vector database setup
- Basic configuration system
- State persistence layer

### Deliverables
- [ ] Extension activates without errors
- [ ] `rcaAgent.analyzeError` command appears in palette
- [ ] Ollama client can call hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest model
- [ ] ChromaDB running and accepting connections
- [ ] Can save/load agent state from workspace storage

### Test Criteria (End of Chunk 1)
```bash
# Integration test checklist
✅ Extension loads in VS Code (<1s activation time)
✅ Command palette shows "RCA Agent: Analyze Error"
✅ Ollama responds to test prompt in <5s
✅ ChromaDB health check passes (localhost:8000)
✅ Can create RCA collection in ChromaDB
✅ StateManager saves/loads checkpoint successfully
✅ Configuration schema accepts model selection
```

### Files Created (Chunk 1)
```
src/
├── extension.ts                    # Entry point
├── commands/
│   └── AnalyzeErrorCommand.ts     # Main command
├── llm/
│   ├── OllamaClient.ts            # LLM integration
│   └── LLMProvider.ts             # Interface
├── db/
│   ├── ChromaDBClient.ts          # Vector DB client
│   └── EmbeddingService.ts        # Local embeddings
├── agent/
│   └── StateManager.ts            # Persistence
└── config/
    └── ConfigManager.ts           # Settings

tests/integration/
└── chunk1-infrastructure.test.ts   # End-to-end test
```

### Milestone 1.1 - Extension Bootstrap

| Task | Implementation Details | Files Created | Checklist |
|------|----------------------|---------------|-----------|
| **1.1.1 Extension Setup** | Initialize TypeScript project with proper tsconfig, ESLint, Prettier | • `package.json`<br>• `tsconfig.json`<br>• `.eslintrc.js`<br>• `src/extension.ts` | ☐ Node.js 18+ installed<br>☐ VS Code Extension API types<br>☐ Build script (`npm run compile`)<br>☐ Watch mode (`npm run watch`) |
| **1.1.2 Command Registration** | Implement `rcaAgent.analyzeError` command | • `src/commands/AnalyzeErrorCommand.ts` | ☐ Command appears in palette<br>☐ Keybinding configured<br>☐ Context menu integration |
| **1.1.3 Configuration Schema** | Define user settings for LLM provider, API keys, model selection | • Update `package.json` contributes.configuration | ☐ Local/Cloud toggle<br>☐ API key secure storage<br>☐ **Model dropdown list with free swapping**<br>☐ Hot-swap models without restart<br>☐ Per-project model preferences |

**Key Functions:**
```typescript
// src/extension.ts
export function activate(context: vscode.ExtensionContext): void {
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => { /* Entry point for RCA analysis */ }
  );
  context.subscriptions.push(analyzeCommand);
}

// src/llm/OllamaClient.ts
export class OllamaClient implements LLMProvider {
  static async create(config: LLMConfig): Promise<OllamaClient> {
    // Primary: hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest for Kotlin/Android (5GB VRAM)
    // Fallback: qwen-coder:3b for fast mode (2GB VRAM)
    // Uses your 3070 Ti GPU for 4-6s per iteration
  }
  
  async switchModel(newModel: string): Promise<void> {
    // Hot-swap between models if needed
  }
}
```

---

### Milestone 1.2 - Vector Database Integration

**Deliverable:** ChromaDB connection with dual embedding strategy

| Task | Implementation Details | Files Created | Checklist |
|------|----------------------|---------------|-----------|
| **1.2.1 ChromaDB Setup** | Docker container or local server, collection initialization | • `docker-compose.yml`<br>• `src/db/ChromaDBClient.ts` | ☐ ChromaDB running on localhost:8000<br>☐ Health check endpoint working<br>☐ Collection created: `rca_solutions` |
| **1.2.2 Embedding Service** | Local embeddings with model versioning | • `src/db/EmbeddingService.ts`<br>• `src/db/embeddings/LocalEmbedder.ts`<br>• `src/db/ModelVersionManager.ts` | ☐ Model download: `all-MiniLM-L6-v2`<br>☐ Fallback model: `paraphrase-MiniLM-L3-v2`<br>☐ Version metadata tracking |
| **1.2.3 Schema Definition** | Define RCA document structure with quality management | • `src/db/schemas/rca-collection.ts`<br>• `src/db/CollectionManager.ts` | ☐ Fields: error_type, language, stack_trace, solution, confidence, quality_score, user_rating, embedding_version<br>☐ Metadata indexing for filtering<br>☐ Collection merging utility (merge workspace collections) |

**RCA Document Schema:**
```typescript
// src/db/schemas/rca-collection.ts
export interface RCADocument {
  id: string;  // UUID
  error_type: string;
  error_message: string;
  stack_trace: StackFrame[];
  language: 'kotlin' | 'java' | 'xml' | 'groovy';
  file_path: string;
  line_number: number;
  root_cause: string;
  hypothesis: string;
  fix_guidelines: string[];
  code_snippets: {
    before: CodeSnippet;
    after: CodeSnippet;
  };
  dependencies_involved: string[];
  confidence: number;  // 0.0-1.0
  quality_score: number;  // 0.0-1.0 (auto-calculated)
  user_rating: 'helpful' | 'not_helpful' | null;
  embedding_version: string;  // Model version used
  created_at: number;  // Timestamp
  updated_at: number;
  validated: boolean;  // User confirmed correct
  workspace_id: string;  // For collection merging
}

interface StackFrame {
  file: string;
  line: number;
  column?: number;
  function: string;
}

interface CodeSnippet {
  before: string;
  after: string;
  line_start: number;
  language: string;
}
```

**Key Functions:**
```typescript
// src/db/ChromaDBClient.ts
export class ChromaDBClient {
  async addRCADocument(doc: RCADocument): Promise<string> {
    // Embed error description + solution
    // Store with metadata (language, file_path, timestamp)
  }
  
  async queryRelevantRCAs(errorContext: string, k: number = 5): Promise<RCADocument[]> {
    // Semantic search with hybrid filtering
  }
  
  async mergeCollections(sourceWorkspaceId: string, targetWorkspaceId: string): Promise<void> {
    // Combine two workspace knowledge bases
    // Deduplicate similar RCAs
    // Preserve user ratings and validation status
  }
  
  async pruneOldRCAs(maxAge: number = 180): Promise<number> {
    // Remove RCAs older than maxAge days
    // Keep user-validated RCAs regardless of age
    // Return count of deleted documents
  }
}
```

**End-to-End Test:**
```typescript
// tests/integration/vectordb.test.ts
test('Store and retrieve RCA document', async () => {
  const doc = { error: 'NullPointerException', solution: '...' };
  const id = await db.addRCADocument(doc);
  const results = await db.queryRelevantRCAs('NullPointerException', 3);
  expect(results[0].id).toBe(id);
});
```

---

### Milestone 1.3 - Tool Infrastructure

**Deliverable:** Tool registry with JSON schema validation

| Task | Implementation Details | Files Created | Checklist |
|------|----------------------|---------------|-----------|
| **1.3.1 Tool Registry** | Central registry for tool discovery and execution | • `src/tools/ToolRegistry.ts`<br>• `src/tools/ToolBase.ts` | ☐ Tool registration API<br>☐ Schema validation (Zod/Yup)<br>☐ Error handling wrapper |
| **1.3.2 Read File Tool** | Access workspace files via VS Code API | • `src/tools/ReadFileTool.ts` | ☐ UTF-8 encoding handling<br>☐ Binary file detection<br>☐ Large file streaming (>1MB)<br>☐ Context window chunking |
| **1.3.3 Documentation Search Tool** | Search local developer documentation | • `src/tools/LocalDocsSearchTool.ts` | ☐ Index common docs (MDN, Python docs, Kotlin docs, Android docs, Flutter docs, Dart docs)<br>☐ Offline access<br>☐ Language-specific doc routing<br>☐ XML layout reference (Android)<br>☐ Gradle DSL reference |
| **1.3.4 Android Build Tool** | Analyze Kotlin/Android build errors | • `src/tools/AndroidBuildTool.ts` | ☐ Parse build.gradle (Groovy)<br>☐ Parse build.gradle.kts (Kotlin DSL)<br>☐ Detect dependency conflicts<br>☐ Analyze manifest merge errors<br>☐ Check Android SDK versions<br>☐ XML layout validation |

**Tool Contract Example:**
```typescript
// src/tools/types.ts
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodSchema;  // Zod schema for validation
  execute: (params: unknown) => Promise<ToolResult>;
}

// src/tools/ReadFileTool.ts
export const ReadFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read contents of a file in the workspace',
  parameters: z.object({
    filePath: z.string().describe('Relative path from workspace root'),
    lineStart: z.number().optional(),
    lineEnd: z.number().optional(),
  }),
  execute: async (params) => {
    // Implementation with VS Code workspace.fs
  },
};
```

---

### Milestone 1.4 - Persistence & Performance Layer

**Deliverable:** Agent state persistence, caching system, and performance monitoring

| Task | Implementation Details | Files Created | Checklist |
|------|----------------------|---------------|-----------|
| **1.4.1 Agent State Persistence** | Checkpoint agent state after each iteration | • `src/agent/StateManager.ts`<br>• `src/agent/Checkpoint.ts` | ☐ Save state to workspace storage<br>☐ Resume from checkpoint on crash<br>☐ Auto-cleanup old checkpoints |
| **1.4.2 Result Caching** | Hash-based deduplication of identical errors | • `src/cache/RCACache.ts`<br>• `src/cache/ErrorHasher.ts` | ☐ SHA-256 error signature hashing<br>☐ TTL-based cache expiration (24h)<br>☐ Cache invalidation on feedback |
| **1.4.3 Performance Monitor** | Track latency, token usage, tool execution times | • `src/monitoring/PerformanceTracker.ts`<br>• `src/monitoring/MetricsCollector.ts` | ☐ Per-tool execution metrics<br>☐ LLM inference time tracking<br>☐ Export metrics to JSON |
| **1.4.4 Vector DB Quality Manager** | Score and filter low-quality RCAs | • `src/db/QualityScorer.ts`<br>• `src/db/VectorDBMaintenance.ts` | ☐ Automatic quality scoring<br>☐ Expiration policy (6 months)<br>☐ Manual removal interface |

**Key Functions:**
```typescript
// src/agent/StateManager.ts
export class StateManager {
  async saveCheckpoint(state: AgentState): Promise<void> {
    // Persist to workspace storage with timestamp
    // Keep last 5 checkpoints per error
  }
  
  async loadLatestCheckpoint(errorHash: string): Promise<AgentState | null> {
    // Resume from last valid checkpoint
    // Return null if no checkpoint found
  }
}

// src/cache/RCACache.ts
export class RCACache {
  async get(errorSignature: string): Promise<RCADocument | null> {
    // Check if identical error analyzed recently
    // Return cached result if confidence > 0.8
  }
  
  async set(errorSignature: string, rca: RCADocument): Promise<void> {
    // Store with 24h TTL
    // Invalidate on negative user feedback
  }
}
```

---

### Milestone 1.5 - Testing & Validation

**Deliverable:** Automated test suite for foundation components

#### Testing Strategy for LLM-Based Systems

**Challenge:** Non-deterministic LLM outputs make traditional assertions fail  
**Solution:** Quality criteria testing instead of exact string matching

```typescript
// tests/agent/ReactAgent.test.ts
describe('ReactAgent RCA Quality', () => {
  const kotlinNPEError = {
    type: 'runtime',
    message: 'kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized',
    stackTrace: [/* ... */],
    language: 'kotlin'
  };
  
  test('should mention lateinit and initialization in root cause', async () => {
    const agent = new ReactAgent(mockLLM, mockTools);
    const result = await agent.analyze(kotlinNPEError);
    
    // Quality criteria instead of exact string match
    expect(result.rootCause.toLowerCase()).toMatch(/lateinit|initialization|initialized/);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.fixGuidelines.length).toBeGreaterThan(0);
  });
  
  test('should identify the uninitialized property name', async () => {
    const result = await agent.analyze(kotlinNPEError);
    expect(result.rootCause).toContain('user'); // Property name from error
  });
  
  test('should suggest initialization in proper lifecycle method', async () => {
    const result = await agent.analyze(kotlinNPEError);
    const fixText = result.fixGuidelines.join(' ').toLowerCase();
    expect(fixText).toMatch(/oncreate|init|constructor|lazy/);
  });
});
```

#### Golden Test Suite
**Approach:** Reference RCAs for common errors, validate new outputs against criteria

```typescript
// tests/golden/kotlin-npe.json
{
  "name": "Kotlin Lateinit NPE",
  "error": {/* ... */},
  "quality_criteria": {
    "must_mention_keywords": ["lateinit", "initialization", "initialized"],
    "must_identify_property": "user",
    "must_suggest_fix_location": ["onCreate", "init block", "constructor", "lazy delegate"],
    "min_confidence": 0.75,
    "should_include_code_example": true,
    "should_mention_file": true
  }
}
```

```typescript
// tests/golden/runner.ts
describe('Golden Test Suite', () => {
  const goldenTests = loadGoldenTests();
  
  for (const golden of goldenTests) {
    test(`Golden: ${golden.name}`, async () => {
      const result = await agent.analyze(golden.error);
      
      // Validate against quality criteria
      for (const keyword of golden.quality_criteria.must_mention_keywords) {
        expect(result.rootCause.toLowerCase()).toContain(keyword);
      }
      
      expect(result.confidence).toBeGreaterThanOrEqual(golden.quality_criteria.min_confidence);
      // ... more criteria checks
    });
  }
});
```

#### Performance Regression Tests
```typescript
// tests/performance/benchmarks.test.ts
describe('Performance Benchmarks', () => {
  test('should complete standard analysis in <60s', async () => {
    const start = Date.now();
    await agent.analyze(testError, 'standard');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(60000); // 60s
  });
  
  test('cache hit should be <5s', async () => {
    await agent.analyze(testError); // First run (cache miss)
    const start = Date.now();
    await agent.analyze(testError); // Second run (cache hit)
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // 5s
  });
});
```

| Task | Files Created | Coverage Target |
|------|---------------|-----------------|
| **Unit Tests** | • `tests/unit/llm/ProviderFactory.test.ts`<br>• `tests/unit/db/ChromaDBClient.test.ts`<br>• `tests/unit/tools/*.test.ts` | 80%+ |
| **Integration Tests** | • `tests/integration/end-to-end-storage.test.ts` | Core workflows |
| **CI Pipeline** | • `.github/workflows/test.yml` | All tests on PR |

---

## 🛠️ CHUNK 2: Tool Ecosystem (Weeks 3-4)

**Priority:** 🔥 HIGH - Agent needs tools to be useful  
**Goal:** Build complete tool infrastructure and parsers

### What You'll Build
- Tool registry with schema validation
- File reading tool (with chunking for large files)
- Error parsers (Kotlin, Java, XML, Gradle)
- LSP integration for call hierarchy
- Language detector
- Input sanitization for security

### Deliverables
- [ ] Tool registry with 5+ tools registered
- [ ] Can parse Kotlin NPE, lateinit, and build errors
- [ ] Read file tool handles large files (>1MB)
- [ ] LSP tool can find function callers
- [ ] Language detector identifies Kotlin/Java/XML/Groovy
- [ ] Prompt injection defense active

### Test Criteria (End of Chunk 2)
```bash
# Integration test checklist
✅ Parse 10+ different Kotlin error types correctly
✅ Read file tool extracts code context (50 lines)
✅ LSP tool finds callers of test function
✅ Language detector: 95%+ accuracy on sample errors
✅ Sanitizer blocks "Ignore previous instructions" attacks
✅ Tool execution errors handled gracefully
✅ All tool schemas validate with Zod
```

### Files Created (Chunk 2)
```
src/
├── tools/
│   ├── ToolRegistry.ts            # Central registry
│   ├── ReadFileTool.ts            # File access
│   ├── LSPTool.ts                 # Call hierarchy
│   └── AndroidBuildTool.ts        # Gradle analysis
├── utils/
│   ├── ErrorParser.ts             # Main parser
│   ├── parsers/
│   │   ├── KotlinParser.ts       # Kotlin errors
│   │   ├── XMLParser.ts          # Layout errors
│   │   └── GradleParser.ts       # Build errors
│   └── LanguageDetector.ts       # Auto-detection
└── security/
    └── PromptSanitizer.ts         # Injection defense

tests/integration/
└── chunk2-tools.test.ts           # End-to-end test
```

### Milestone 1.6 - Kotlin/Android Parser Complete

**Deliverable:** Full Kotlin error parsing + Android-specific handlers

| Task | Implementation Details | Files Created |
|------|----------------------|---------------|
| **1.6.1 Kotlin Error Parser** | Full Kotlin error parsing with Android context | • `src/utils/ErrorParser.ts`<br>• `src/utils/parsers/KotlinParser.ts`<br>• `src/utils/parsers/JetpackComposeParser.ts`<br>• `src/utils/parsers/XMLParser.ts` (layouts)<br>• `src/utils/parsers/GradleParser.ts` (build files)<br>• `src/utils/InputSanitizer.ts` |
| **1.6.2 Language Detector** | Auto-detect Kotlin/Android files | • `src/utils/LanguageDetector.ts` (`.kt`, `.kts`, `.xml`, `.gradle`) |
| **1.6.3 LSP Integration** | Call hierarchy, definitions, references | • `src/tools/LSPTool.ts` | Via VS Code LSP API |
| **1.6.4 Input Sanitization** | Prevent prompt injection attacks | • `src/security/PromptSanitizer.ts` | Strip malicious instructions from error text |

**Error Parser Example:**
```typescript
// src/utils/ErrorParser.ts
export interface ParsedError {
  type: 'syntax' | 'runtime' | 'build' | 'linter';
  message: string;
  filePath: string;
  line: number;
  column?: number;
  stackTrace?: StackFrame[];
  language: SupportedLanguage;
}

export class ErrorParser {
  static parse(errorText: string, language?: string): ParsedError | null {
    const lang = language || LanguageDetector.detect(errorText);
    const parser = this.getParser(lang);
    return parser.parse(errorText);
  }
}

// Language-specific parsers
// PHASE 1: Kotlin/Android parsers only

class KotlinErrorParser {
  parse(text: string): ParsedError {
    // Handle Kotlin-specific errors:
    // - UninitializedPropertyAccessException
    // - NullPointerException (with Kotlin null safety hints)
    // - Unresolved reference errors
    // - Android lifecycle errors (onCreate, onResume, etc.)
  }
}

class JetpackComposeParser {
  parse(text: string): ParsedError {
    // Handle Compose-specific errors:
    // - Recomposition issues
    // - remember/rememberSaveable misuse
    // - State hoisting errors
    // - CompositionLocal errors
    // - Modifier chain issues
  }
}

class XMLParser {
  parse(text: string): ParsedError {
    // Handle XML layout errors:
    // - Missing view IDs
    // - Attribute errors (layout_width, layout_height)
    // - Namespace issues (xmlns:android)
    // - View inflation errors
  }
}

class GroovyParser {
  parse(text: string): ParsedError {
    // Handle Gradle build.gradle errors:
    // - Dependency resolution failures
    // - Plugin conflicts
    // - buildscript configuration errors
    // - Repository issues
  }
}

// Input Sanitization
class InputSanitizer {
  static sanitize(errorText: string): string {
    // Remove potential prompt injection patterns
    // Strip: "Ignore previous instructions", "System:", etc.
    // Escape special tokens used by LLM
    return errorText
      .replace(/ignore (previous|all) (instructions|rules)/gi, '[REDACTED]')
      .replace(/system:/gi, '[REDACTED]')
      .slice(0, 10000); // Max 10K chars
  }
}
```

---

### Milestone 1.7 - LSP-Powered Tools

**Deliverable:** Call hierarchy, symbol search, dependency analysis, and parallel tool execution

| Tool | Implementation | Use Case |
|------|----------------|----------|
| **Get Code Context** | Extract 50 lines with smart chunking for large files | Understanding error environment |
| **Find Callers** | LSP call hierarchy provider | Trace function dependencies |
| **Symbol Search** | Workspace symbol provider | Find related classes/functions |
| **Dependency Graph** | Parse import statements + version check | Identify external package issues |
| **Parallel Tool Executor** | Execute independent tools concurrently | 3x faster analysis |
| **Context Window Manager** | Intelligent code summarization for LLM limits | Handle large files (>10K lines) |

```typescript
// src/tools/LSPTool.ts
export const FindCallersTool: ToolDefinition = {
  name: 'find_callers_of_function',
  description: 'Find all functions that call the specified function',
  parameters: z.object({
    functionName: z.string(),
    filePath: z.string(),
  }),
  execute: async ({ functionName, filePath }) => {
    const uri = vscode.Uri.file(filePath);
    const position = await findFunctionPosition(uri, functionName);
    const calls = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>(
      'vscode.prepareCallHierarchy',
      uri,
      position
    );
    return { callers: calls.map(c => c.name) };
  },
};

// Parallel Tool Execution
export class ParallelToolExecutor {
  async executeParallel(tools: ToolCall[]): Promise<ToolResult[]> {
    // Build dependency graph
    const independent = tools.filter(t => !this.hasDependencies(t));
    const dependent = tools.filter(t => this.hasDependencies(t));
    
    // Execute independent tools in parallel
    const results = await Promise.all(
      independent.map(tool => this.executeSingle(tool))
    );
    
    // Execute dependent tools sequentially
    for (const tool of dependent) {
      results.push(await this.executeSingle(tool));
    }
    
    return results;
  }
}

// Context Window Management
export class ContextWindowManager {
  async chunkLargeFile(filePath: string, focusLine: number): Promise<string[]> {
    const content = await readFile(filePath);
    if (content.length < 8000) return [content]; // Fits in context
    
    // Extract: focus area (500 lines) + function signatures (rest of file)
    const focusChunk = this.extractLines(content, focusLine - 250, focusLine + 250);
    const signatures = this.extractFunctionSignatures(content);
    
    return [focusChunk, signatures];
  }
}
```

---

## 🧠 CHUNK 3: Agent Intelligence (Weeks 5-6)

**Priority:** 🔥 HIGH - The brain of the system  
**Goal:** Working ReAct agent that can analyze simple errors

### What You'll Build
- Complete ReAct loop (Thought-Action-Observation)
- Prompt engineering with system prompts
- Tool executor with parallel execution
- Self-reflection mechanism
- Convergence detection
- Hypothesis backtracking

### Deliverables
- [ ] Agent completes full ReAct cycle
- [ ] Can analyze simple Kotlin NPE end-to-end
- [ ] Self-reflection prevents wrong paths
- [ ] Parallel tool execution (3+ tools simultaneously)
- [ ] Terminates correctly (convergence/timeout/max iterations)
- [ ] Generates structured RCA document

### Test Criteria (End of Chunk 3)
```bash
# Integration test checklist
✅ Analyzes Kotlin NPE with >70% confidence
✅ Uses 3+ tools during analysis
✅ Completes in <60s on GPU
✅ Self-reflection triggers on contradicting evidence
✅ Generates root cause + fix guidelines
✅ Parallel tool execution: 3x faster than sequential
✅ Hypothesis mentioned in final RCA
✅ Agent terminates without hanging
```

### Files Created (Chunk 3)
```
src/
├── agent/
│   ├── ReactAgent.ts              # Main agent loop
│   ├── PromptEngine.ts            # Prompt templates
│   ├── ToolExecutor.ts            # Tool orchestration
│   ├── types.ts                   # Agent interfaces
│   └── prompts/
│       ├── system.ts              # System prompts
│       └── examples.ts            # Few-shot examples
├── cache/
│   ├── RCACache.ts                # Result caching
│   └── ErrorHasher.ts             # Deduplication
└── monitoring/
    └── PerformanceTracker.ts      # Metrics

tests/integration/
└── chunk3-agent.test.ts           # End-to-end test
```

### Milestone 2.1 - ReAct Loop Implementation

**Deliverable:** Thought-Action-Observation loop with termination logic

| Task | Implementation Details | Files Created |
|------|----------------------|---------------|
| **2.1.1 Agent State Machine** | Manage iteration count, timeout, convergence detection | • `src/agent/ReactAgent.ts`<br>• `src/agent/AgentState.ts` |
| **2.1.2 Prompt Engine** | System prompts + few-shot examples | • `src/agent/PromptEngine.ts`<br>• `src/agent/prompts/system.ts`<br>• `src/agent/prompts/examples.ts` |
| **2.1.3 Tool Executor** | Parse LLM tool calls, execute, format observations | • `src/agent/ToolExecutor.ts` |

**Agent State Interface:**
```typescript
// src/agent/types.ts
export interface AgentState {
  iteration: number;
  maxIterations: number;  // Dynamic: 6-12 based on complexity
  startTime: number;
  timeout: number;  // 60000ms (standard), 90000ms (educational sync), 60000ms (educational async)
  mode: 'standard' | 'educational' | 'fast';
  educationalAsync: boolean;  // If true, generate explanations after analysis
  thoughts: string[];
  actions: ToolCall[];
  observations: ToolResult[];
  hypothesis: string | null;
  rootCause: string | null;
  converged: boolean;
  complexityScore: number;  // 0-1, determines iteration budget
  educationalExplanations: string[];  // Step-by-step learning notes (sync) or final (async)
  pendingExplanations: Array<{ thought: string; iteration: number }>;  // For async mode
  checkpointId?: string;  // For state persistence
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  timestamp: number;
}
```

**ReAct Loop:**
```typescript
// src/agent/ReactAgent.ts
export class ReactAgent {
  async analyze(errorContext: ErrorContext, mode: 'standard' | 'educational' | 'fast' = 'standard'): Promise<RCADocument> {
    const state = this.initializeState(errorContext, mode);
    const stateManager = new StateManager();
    
    while (!this.shouldTerminate(state)) {
      // 1. THOUGHT: LLM reasons about next step
      const thought = await this.generateThought(state);
      state.thoughts.push(thought);
      
      // Educational Mode: Add learning explanation
      if (state.mode === 'educational') {
        if (state.educationalAsync) {
          // Async mode: Generate explanations after analysis completes
          state.pendingExplanations.push({ thought, iteration: state.iteration });
        } else {
          // Sync mode: Generate explanation immediately
          const explanation = await this.generateEducationalNote(thought, state);
          state.educationalExplanations.push(explanation);
        }
      }
      
      // 2. ACTION: LLM selects tool and parameters (with parallel execution)
      const actions = await this.selectActions(thought, state);
      if (!actions.length) break;  // LLM decided to terminate
      
      // 3. OBSERVATION: Execute tools (parallel when possible)
      const observations = await this.executeToolsParallel(actions);
      state.observations.push(...observations);
      
      // 4. SELF-REFLECTION: Evaluate hypothesis quality
      const reflection = await this.reflectOnHypothesis(state);
      if (reflection.shouldBacktrack) {
        state.hypothesis = reflection.revisedHypothesis;
        state.thoughts.push(`[BACKTRACK] ${reflection.reason}`);
      }
      
      // 5. UPDATE: Check convergence + save checkpoint
      state.converged = await this.checkConvergence(state);
      state.iteration++;
      await stateManager.saveCheckpoint(state);
      
      // Dynamic iteration adjustment
      if (state.complexityScore > 0.7 && state.iteration === state.maxIterations - 2) {
        state.maxIterations += 2;  // Extend for complex errors
      }
    }
    
    return this.synthesizeFinalRCA(state);
  }
  
  private shouldTerminate(state: AgentState): boolean {
    return (
      state.iteration >= state.maxIterations ||
      Date.now() - state.startTime > state.timeout ||
      state.converged
    );
  }
  
  private async generateEducationalNote(thought: string, state: AgentState): Promise<string> {
    // Generate beginner-friendly explanation of current reasoning
    const prompt = `Explain this debugging step to a junior developer: ${thought}`;
    return await this.llm.generate(prompt);
  }
  
  private async reflectOnHypothesis(state: AgentState): Promise<ReflectionResult> {
    // Self-evaluate: Does evidence support current hypothesis?
    const recentEvidence = state.observations.slice(-3);
    const prompt = `
      Current Hypothesis: ${state.hypothesis}
      Recent Evidence: ${JSON.stringify(recentEvidence)}
      
      Does the evidence contradict the hypothesis? Should we backtrack?
    `;
    const reflection = await this.llm.generate(prompt);
    return this.parseReflection(reflection);
  }
  
  private calculateComplexity(errorContext: ErrorContext): number {
    // Score 0-1 based on: stack trace depth, file count, dependency count
    const factors = [
      errorContext.stackTrace.length / 20,  // Deep traces = complex
      errorContext.involvedFiles.length / 10,
      errorContext.externalDependencies.length / 15,
    ];
    return Math.min(factors.reduce((a, b) => a + b, 0) / factors.length, 1.0);
  }
  
  private initializeState(errorContext: ErrorContext, mode: string): AgentState {
    const complexity = this.calculateComplexity(errorContext);
    return {
      iteration: 0,
      maxIterations: mode === 'fast' ? 6 : Math.ceil(8 + complexity * 4), // 8-12 iterations
      timeout: mode === 'educational' ? 90000 : 60000,
      mode,
      complexityScore: complexity,
      // ... rest of state
    };
  }
}
```

---

### Milestone 2.2 - System Prompts & Chain-of-Thought

**Deliverable:** Optimized prompts for RCA workflow

**System Prompt Structure:**
```typescript
// src/agent/prompts/system.ts
export const getSystemPrompt = (mode: 'standard' | 'educational' | 'fast') => `
You are an expert Root Cause Analysis agent for software errors.
Mode: ${mode.toUpperCase()}

${mode === 'educational' ? `
EDUCATIONAL MODE GUIDELINES:
- Explain each reasoning step in beginner-friendly terms
- Define technical terms when first used
- Show both "what" and "why" for each action
- Use analogies to explain complex concepts
- Highlight common mistakes and how to avoid them
` : ''}

WORKFLOW:
1. HYPOTHESIS: Form initial theory about error cause
2. INVESTIGATE: Use tools to gather evidence
3. VALIDATE: Test hypothesis with code context and dependencies
4. REFLECT: Evaluate if evidence supports hypothesis, backtrack if needed
5. ITERATE: Refine understanding until root cause identified

AVAILABLE TOOLS:
${JSON.stringify(ToolRegistry.getAllTools(), null, 2)}

TERMINATION:
Stop when you have:
- Identified root cause with 80%+ confidence
- Traced error to specific file/line/function
- Found similar past solutions (if available)
- Validated hypothesis with code evidence

OUTPUT FORMAT:
{
  "thought": "Current reasoning step",
  "action": {
    "tool": "tool_name",
    "parameters": { ... }
  },
  "confidence": 0.0-1.0
}

Or to finish:
{
  "thought": "Final analysis",
  "action": null,
  "root_cause": "Detailed explanation",
  "fix_guidelines": ["Step 1", "Step 2", ...]
}
`;

// Few-shot examples
export const FEW_SHOT_EXAMPLES = [
  {
    error: 'TypeError: Cannot read property "map" of undefined',
    workflow: [
      {
        thought: 'Error suggests accessing .map() on undefined value. Need to find where this occurs.',
        action: { tool: 'read_file', parameters: { filePath: 'error.stack.file' } },
      },
      {
        thought: 'Line 45 has `data.map()` but data comes from API response. Need to check API function.',
        action: { tool: 'find_callers_of_function', parameters: { functionName: 'fetchData' } },
      },
      // ... more steps
    ],
  },
];
```

---

### Milestone 2.3 - Advanced Tools

**Deliverable:** Full toolset with vector search and local documentation

| Tool | Purpose | API Integration |
|------|---------|-----------------||
| **Vector Search** | Query past RCAs with quality filtering | ChromaDB semantic search + quality scores |
| **Local Docs Search** | Offline documentation lookup | Indexed Kotlin docs, Android SDK, Jetpack Compose, Java docs, XML layout reference, Gradle DSL |
| **Git Blame** | Find code authors | Git CLI wrapper |
| **Dependency Checker** | Verify package versions | Gradle wrapper APIs |
| **Fix Validator** | Verify suggested fixes compile | Kotlin/Java syntax checkers |

```typescript
// src/tools/VectorSearchTool.ts
export const VectorSearchTool: ToolDefinition = {
  name: 'vector_search_db',
  description: 'Search past RCA solutions for similar errors',
  parameters: z.object({
    query: z.string().describe('Error description or stack trace'),
    language: z.string().optional(),
    limit: z.number().default(5),
  }),
  execute: async ({ query, language, limit }) => {
    const db = ChromaDBClient.getInstance();
    const results = await db.queryRelevantRCAs(query, limit);
    
    // Filter by language if specified
    const filtered = language 
      ? results.filter(r => r.metadata.language === language)
      : results;
    
    return {
      found: filtered.length,
      solutions: filtered.map(r => ({
        error: r.error_description,
        solution: r.solution,
        confidence: r.confidence,
      })),
    };
  },
};
```

---

## 📱 CHUNK 4: Android Specialization (Weeks 7-8)

**Priority:** 🟡 MEDIUM - Android-specific features  
**Goal:** Handle all Android error types comprehensively

### What You'll Build
- Jetpack Compose error parser
- XML layout inflation handler
- Gradle dependency analyzer
- Manifest merge error parser
- Android lifecycle error detection
- Local Android documentation search

### Deliverables
- [ ] Handles Compose recomposition errors
- [ ] Parses XML layout inflation failures
- [ ] Detects Gradle dependency conflicts
- [ ] Identifies lifecycle errors (onCreate, onResume, etc.)
- [ ] Searches Android SDK documentation offline
- [ ] Validates Android-specific fix suggestions

### Test Criteria (End of Chunk 4)
```bash
# Integration test checklist
✅ 5+ Compose errors analyzed correctly
✅ XML inflation errors identify missing IDs
✅ Gradle conflicts detected and explained
✅ Manifest merge errors show conflicting attributes
✅ Lifecycle errors mention proper initialization points
✅ Android docs search returns relevant results
✅ Fix suggestions compile (Android-specific validation)
```

### Files Created (Chunk 4)
```
src/
├── utils/parsers/
│   └── JetpackComposeParser.ts    # Compose errors
├── tools/
│   ├── AndroidDocsSearchTool.ts   # Offline docs
│   └── ManifestAnalyzerTool.ts    # Manifest issues
└── validators/
    └── AndroidFixValidator.ts     # Compile check

tests/integration/
└── chunk4-android.test.ts         # End-to-end test
```

---

## 🎨 CHUNK 5: User Experience (Weeks 9-10)

**Priority:** 🟡 MEDIUM - Makes it usable  
**Goal:** Polish UI and add educational mode

### What You'll Build
- Webview panel with live progress
- Markdown RCA document synthesizer
- Educational mode (sync and async)
- User feedback system
- Vector DB quality management
- Collection merging utility

### Deliverables
- [ ] Interactive UI shows iteration progress
- [ ] Beautiful markdown RCA reports
- [ ] Educational mode generates learning notes
- [ ] User can rate RCA as helpful/not helpful
- [ ] Low-quality RCAs auto-pruned from DB
- [ ] Can merge workspace collections

### Test Criteria (End of Chunk 5)
```bash
# Integration test checklist
✅ UI displays thought/action/observation in real-time
✅ Markdown document includes code snippets with syntax highlighting
✅ Educational mode explanations are beginner-friendly
✅ Positive feedback increases RCA confidence score
✅ Quality scorer identifies low-quality RCAs (<0.5)
✅ Collection merge combines 2+ workspaces successfully
✅ UI responsive during long-running analysis
```

### Files Created (Chunk 5)
```
src/
├── ui/
│   ├── RCAWebview.ts              # Main UI
│   └── ProgressDisplay.ts         # Live updates
├── agent/
│   ├── DocumentSynthesizer.ts     # RCA formatting
│   └── FeedbackHandler.ts         # User ratings
└── db/
    ├── QualityScorer.ts           # Auto-scoring
    └── CollectionManager.ts       # Merging

tests/integration/
└── chunk5-ui.test.ts              # End-to-end test
```

---

## 🚀 CHUNK 6: Production Ready (Weeks 11-12)

**Priority:** 🟢 POLISH - Make it production-grade  
**Goal:** Testing, performance optimization, deployment

### What You'll Build
- Comprehensive test suite (unit + integration + golden)
- Performance benchmarking system
- Automated quality gate checks
- CI/CD pipeline
- User documentation
- Extension packaging

### Deliverables
- [ ] 80%+ test coverage
- [ ] Golden test suite for 15+ error types
- [ ] Performance: <60s standard, <40s fast, <90s educational
- [ ] CI runs all tests on PR
- [ ] README with setup instructions
- [ ] Packaged .vsix file ready to install

### Test Criteria (End of Chunk 6)
```bash
# Production readiness checklist
✅ All unit tests passing (500+ tests)
✅ Integration tests cover 15+ real scenarios
✅ Golden tests validate against reference RCAs
✅ Performance benchmarks meet targets
✅ CI pipeline green (GitHub Actions)
✅ ESLint + Prettier + TypeScript strict mode
✅ Documentation complete (README + API_CONTRACTS)
✅ Extension installs and activates successfully
✅ No console errors or warnings
```

### Files Created (Chunk 6)
```
tests/
├── golden/
│   ├── kotlin-npe.json            # Reference RCA
│   ├── compose-recomposition.json
│   └── runner.ts                  # Golden test suite
├── performance/
│   └── benchmarks.test.ts         # Speed tests
└── e2e/
    └── production.test.ts         # Full workflow

scripts/
├── benchmark.ts                   # Perf tracking
└── quality-gate.ts                # Pre-commit checks

.github/workflows/
└── test.yml                       # CI pipeline

docs/
├── README.md                      # User guide
└── EDUCATIONAL_MODE.md            # Learning guide
```

---

## 📊 Progress Tracking

Track your progress through each chunk:

- [ ] **Chunk 1 Complete:** Infrastructure working (Week 2)
- [ ] **Chunk 2 Complete:** Tools operational (Week 4)
- [ ] **Chunk 3 Complete:** Agent functional (Week 6)
- [ ] **Chunk 4 Complete:** Android coverage (Week 8)
- [ ] **Chunk 5 Complete:** UI polished (Week 10)
- [ ] **Chunk 6 Complete:** Production ready (Week 12)

---

## 🎯 Success Criteria

**Phase 1 Option A is complete when:**
- ✅ All 6 chunks delivered
- ✅ Can analyze 15+ different Kotlin/Android error types
- ✅ Handles all Android approaches (Kotlin+Compose, Java+XML, Gradle)
- ✅ Completes analysis in <60s on GPU
- ✅ Educational mode works (both sync and async)
- ✅ Vector DB learns from errors
- ✅ 80%+ test coverage
- ✅ Extension packaged and installable
- ✅ You actually use it during development

---

[← Back to Phase 1 Overview](Phase1-Foundation-Kotlin-Android.md) | [Compare with Option B →](Phase1-OptionB-MVP-First.md)
