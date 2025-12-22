# ✅ CHUNK 2 (Core Tools Backend) — CONSOLIDATED

**Scope:** Chunk 2.1–2.4 (Core Tools Backend)  
**Primary Owner:** Kai (Backend)  
**Key Themes:** Multi-language parsing, tool infrastructure, prompt engineering, agent integration

---

## 1) Executive Summary

Chunk 2 delivers the backend “core tools” foundation for the RCA Agent:

- **Parsing:** Multi-language router + language detection + Kotlin/Gradle parsers (11+ error types).
- **Tools:** Schema-validated tool registry and an LSP-powered analysis tool foundation.
- **Prompting:** Prompt engine with few-shot examples, structured outputs, and robust JSON extraction.
- **Agent integration (2.4):** Minimal ReAct agent integrated with PromptEngine + ToolRegistry, configurable iterations, tool execution, and A/B toggles.

**Status:** Implemented and documented. Test/metrics reporting varies across source docs—see “Reported Metrics & Discrepancies” for a consolidated view.

---

## 2) Deliverables by Sub-Chunk

### 2.1 — Full Error Parser

**Goal:** Parse 5+ Kotlin error types (and add Gradle coverage).

**Delivered Components:**
- `src/utils/LanguageDetector.ts`
  - Heuristic language detection (keywords + file extensions) with confidence scoring.
  - Quick checks for Kotlin/Gradle/XML/Java.
- `src/utils/ErrorParser.ts`
  - Router/single entry point for parsing.
  - Parser registration + fallback to language detection.
- `src/utils/parsers/KotlinParser.ts`
  - Kotlin parsing expanded beyond NPE/lateinit.
  - Composition with existing KotlinNPEParser-style parsing behavior.
- `src/utils/parsers/GradleParser.ts`
  - Gradle build failure parsing (dependency resolution/conflict, task failure, script syntax, etc.).

**Supported Error Families (as reported):**
- Kotlin: `lateinit`, `npe`, `unresolved_reference`, `type_mismatch`, compilation/import-related.
- Gradle: dependency resolution, dependency conflict, task failure, build script syntax, compilation-related.

**Design Patterns Used:**

*Strategy Pattern (Language-Specific Parsers):*
```typescript
// Each parser implements the same interface
interface ErrorParser {
  parse(errorText: string): ParsedError | null;
}

class KotlinParser implements ErrorParser { ... }
class GradleParser implements ErrorParser { ... }
```
Benefit: Easy to add new language parsers without modifying existing code.

*Singleton Pattern (ErrorParser Router):*
```typescript
export class ErrorParser {
  private static instance: ErrorParser;
  
  static getInstance(): ErrorParser {
    if (!ErrorParser.instance) {
      ErrorParser.instance = new ErrorParser();
    }
    return ErrorParser.instance;
  }
}
```
Benefit: Single source of truth for parser registration; thread-safe.

*Composition Pattern (KotlinParser + KotlinNPEParser):*
```typescript
export class KotlinParser {
  private npeParser = new KotlinNPEParser();
  
  parse(errorText: string): ParsedError | null {
    // Try NPE parser first (from Chunk 1)
    const npeResult = this.npeParser.parse(errorText);
    if (npeResult) return npeResult;
    
    // Try new error types
    return this.parseUnresolvedReference(errorText) ||
           this.parseTypeMismatch(errorText) || ...
  }
}
```
Benefit: Reuses existing KotlinNPEParser; maintains backward compatibility.

**Key Regex Patterns:**

*Kotlin Patterns:*
```typescript
// Unresolved reference
/Unresolved reference:\s+(\w+)/

// Type mismatch
/Type mismatch.*required:?\s+([^,\n]+).*found:?\s+([^\n]+)/

// Compilation error
/e:\s+([^\n]+\.kt):(\d+):/

// Import error
/Unresolved reference:\s+([\w.]+).*import/
```

*Gradle Patterns:*
```typescript
// Dependency resolution
/Could not find\s+([^\s]+)/

// Dependency conflict
/Conflict.*?['"]([^'"]+)['"].*?\(([^\s)]+)\)/

// Task failure
/Task\s+([^\s]+)\s+FAILED/

// Build script syntax
/Could not compile build file\s+'([^']+)'/
```

---

### 2.2 — LSP Integration & Tool Registry

**Goal:** Add an extensible tool system and code-analysis capability foundation.

**Delivered Components:**
- `src/tools/ToolRegistry.ts`
  - Tool registration + discovery.
  - Runtime parameter validation (Zod-based).
  - Execution with error handling; optional parallel execution capability.
- `src/tools/LSPTool.ts`
  - Code-analysis commands (e.g., callers/definition/symbol info/workspace symbol search).
  - Reported as a “placeholder / simplified” implementation suitable for backend testing; intended for deeper VS Code LSP integration in extension context.

---

### 2.3 — Prompt Engineering

**Goal:** Improve analysis quality and reliability with stronger prompts.

**Delivered Components:**
- `src/agent/PromptEngine.ts`
  - System prompt and workflow guidance.
  - Few-shot examples (reported for at least: `lateinit`, `npe`, `unresolved_reference`, `type_mismatch`).
  - Iteration prompts + final synthesis prompts.
  - JSON extraction + response validation (tolerant of “extra text around JSON”).

---

### 2.4 — Agent Integration & Testing

**Goal:** Integrate tools + prompts into the ReAct agent workflow.

**Delivered Components (reported):**
- Updated `src/agent/MinimalReactAgent.ts`
  - Configurable iteration loop (reported as 1–10 iterations).
  - Optional feature flags for A/B testing:
    - `usePromptEngine` and `useToolRegistry`.
  - Tool execution inside the reasoning loop via ToolRegistry.
  - Tool usage tracking in output.
- Updated `src/types.ts`
  - `RCAResult` extended to include `iterations?` and `toolsUsed?`.
- Updated `src/tools/ReadFileTool.ts`
  - Reported to implement Tool interface and support backward-compatible invocation.

**Registered tools (reported):**
- `read_file` (ReadFileTool)
- `find_callers` (LSPTool)
- `get_symbol_info` (LSPTool)

**Usage Examples:**

*Example 1: Basic Error Parsing*
```typescript
import { ErrorParser } from './utils/ErrorParser';

const errorText = `
  e: MainActivity.kt:45: Unresolved reference: nonExistentFunction
  e: MainActivity.kt:46: Unresolved reference: anotherBadCall
`;

const parser = ErrorParser.getInstance();
const error = parser.parse(errorText);

console.log(error);
// Output:
// {
//   type: 'unresolved_reference',
//   message: '...',
//   filePath: 'MainActivity.kt',
//   line: 45,
//   language: 'kotlin',
//   metadata: { symbolName: 'nonExistentFunction' }
// }
```

*Example 2: Tool Registry*
```typescript
const registry = ToolRegistry.getInstance();

// Register with schema
registry.register('read_file', readFileTool, z.object({
  filePath: z.string(),
  line: z.number()
}));

// Execute tool
const result = await registry.execute('read_file', {
  filePath: 'MainActivity.kt',
  line: 45,
});

// Parallel execution
const results = await registry.executeParallel([
  { name: 'read_file', parameters: { filePath: 'A.kt', line: 10 } },
  { name: 'find_callers', parameters: { symbolName: 'onCreate' } }
]);
```

*Example 3: Prompt Engine*
```typescript
const engine = new PromptEngine();
const systemPrompt = engine.getSystemPrompt();
const examples = engine.getFewShotExamples('lateinit');
const response = await llm.generate(systemPrompt + examples + errorContext);
const result = engine.extractJSON(response);
```

*Example 4: Integrated Agent Workflow*
```typescript
// Baseline (Old Prompts, No Tools)
const baselineAgent = new MinimalReactAgent(llm, {
  maxIterations: 3,
  usePromptEngine: false,
  useToolRegistry: false,
});

// Enhanced (PromptEngine, ToolRegistry)
const enhancedAgent = new MinimalReactAgent(llm, {
  maxIterations: 10,
  usePromptEngine: true,
  useToolRegistry: true,
});

const result = await enhancedAgent.analyze(parsedError);
```

**Testing & A/B testing notes:**
- Source docs describe an A/B setup to compare “legacy prompts/no tools” vs “PromptEngine + ToolRegistry.”
- Source docs also mention some test failures after 2.4 due to mock timing / updated mock expectations; see “Reported Metrics & Discrepancies.”

---

## 3) Architecture Snapshot (Post Chunk 2)

High-level layering after Chunk 2:

- **LLM Layer:** Ollama client and response handling.
- **Parsing Layer:** Language detection + error router + language-specific parsers.
- **Tool Layer:** Tool registry + tools (ReadFile, LSP analysis placeholder).
- **Agent Layer:** ReAct-style loop, optionally using PromptEngine and ToolRegistry.

This sets up a clean path into Chunk 3 (vector DB persistence and retrieval) without altering the extension/UI integration contract.

---

## 4) Performance Metrics

### Parsing Performance
- **Average parse time:** <1ms per error
- **Regex compilation:** One-time cost at parser initialization
- **Memory footprint:** ~50KB per parser instance (singleton, so only 1 instance)

### Tool Registry Performance
- **Tool registration:** <1ms
- **Tool validation:** <1ms (Zod schema check)
- **Tool execution:** 1-10ms (tool-dependent)
- **Parallel execution:** ~same as slowest tool (not sum of all)

### LSP Tool Performance (Regex-based placeholder)
- **Find callers:** 10-50ms (depends on file count)
- **Find definition:** 5-15ms (single file scan)
- **Get symbol info:** 5-15ms (single file scan)
- **Search workspace:** 50-200ms (depends on file count)

*Note: Real LSP integration (when available) will be faster (~5-10ms per operation).*

### Prompt Generation
- **System prompt:** <1ms (cached)
- **Few-shot examples:** <1ms (cached)
- **Initial prompt:** 1-5ms (includes examples)
- **Iteration prompt:** 1-3ms (includes history)
- **Final prompt:** 1-3ms (includes history)

### Test Execution
- **Chunk 2.1 tests alone:** ~3.7 seconds (109 tests)
- **Full test suite:** ~15-17 seconds (268-281 tests)
- **CI/CD friendly:** No external dependencies (Ollama tests skipped)

---

## 5) Reported Metrics & Discrepancies

The source docs contain **inconsistent totals** (tests, pass rate, and whether Chunk 2.4 is included). Consolidating the claims:

### What’s consistent
- Chunk 2.1–2.3 are reported complete on **Dec 18, 2025**.
- Chunk 2.4 is reported complete on **Dec 18–19, 2025**.
- Coverage is repeatedly reported as **~90%+ overall** (often **95%+** for new modules).

### Differences to be aware of
- Some docs report **all tests passing** (e.g., 281/281).
- Other docs report **non-critical failures** after 2.4 integration (e.g., 268/272 passing), attributed to mock timing / expectation updates rather than core logic bugs.

**Practical interpretation for readers:**
- Treat **2.1–2.3** as stable and fully green in the reported runs.
- For **2.4**, functionality is described as integrated and working, but some tests may need mock updates depending on the repository state at the time of the report.

---

## 5) Lessons Learned

### Technical Insights

**Parser Ordering Matters:**
When multiple patterns can match (e.g., import errors vs unresolved references), check more specific patterns first. This prevents false positives and improves accuracy.

**Regex is Fast Enough:**
For error parsing, regex performance is negligible (<1ms). No need for complex AST parsing in this use case.

**Graceful Degradation:**
Returning `null` for non-matching errors is cleaner than throwing exceptions. Makes the parser composable and easier to integrate.

**Metadata is Valuable:**
Extracting extra context (property names, types, versions) helps the LLM provide better RCA. The small parsing overhead pays dividends in analysis quality.

### Testing Insights

**Edge Cases First:**
Writing tests for null/empty/long inputs early prevents bugs later. These tests caught 3 potential crashes during Chunk 2.1 development.

**Real-World Examples:**
Using actual error messages from Android Studio helps catch regex edge cases. Mock errors are less effective.

**Test Naming:**
Descriptive names like `'should extract property name from lateinit error'` make failures easier to debug than generic names.

### Process Insights

**Iterative Development:**
Implementing one parser at a time (LanguageDetector → KotlinParser → GradleParser → ErrorParser) made debugging easier and reduced cognitive load.

**Test-Driven Development:**
Writing tests before implementation caught issues early (e.g., import vs unresolved reference ambiguity discovered before production code).

**Method Overloading in TypeScript:**
Requires careful signature ordering. Parameter normalization essential for backward compatibility (see ReadFileTool implementation).

**A/B Testing Architecture:**
Configuration flags enable clean testing of new features. Legacy methods preserve old behavior exactly, essential for measuring improvement scientifically.

### Design Insights

**Singleton Pattern Trade-offs:**
While useful for global state (ErrorParser, ToolRegistry), singletons make testing harder. Future consideration: dependency injection for easier mocking.

**Zod Validation Value:**
Runtime schema validation caught 5+ parameter errors during integration testing that would have been silent failures.

**Prompt Engineering Impact:**
Few-shot examples significantly improved LLM response quality. The overhead of including examples (~200 tokens) is worth the accuracy gain.

---

## 6) Outcome: What Chunk 2 Enables

Chunk 2 enables:
- Robust error parsing across Kotlin + Gradle with a scalable architecture.
- A tool ecosystem with validated interfaces, ready to expand.
- Prompt reliability improvements for structured RCA output.
- A multi-iteration, tool-using agent workflow (2.4) that can evolve into more sophisticated reasoning and retrieval.

---

## 7) Next Steps (as implied by sources)

- Proceed to **Chunk 3.1 (ChromaDB setup)** for RCA document storage.
- Add **embedding + similarity search** (Chunk 3.2) to reuse prior solutions.
- Leverage **cache + feedback** (Chunks 3.3–3.4) for faster and higher-quality repeated RCAs.

---

## 8) Source Traceability

This consolidated document was deduplicated from these source milestone files (archived under `_chunk2_sources/`):
- `Chunk-2-COMPLETE-Summary.md`
- `Chunk-2-STATUS-REPORT.md`
- `Chunk-2.1-COMPLETE.md`
- `Chunk-2.2-2.3-COMPLETE.md`
- `Chunk-2.4-COMPLETE.md`
