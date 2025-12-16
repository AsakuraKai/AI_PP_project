<<<<<<< HEAD
# 🏗️ PHASE 1 - OPTION B: MVP-First Rapid Iteration

> **Goal:** Get working prototype fast, then expand. Best for quick validation.

[← Back to Phase 1 Overview](Phase1-Foundation-Kotlin-Android.md) | [Compare with Option A →](Phase1-OptionA-Traditional.md)

---

## Overview

**Timeline:** 3-4 weeks MVP + 8-10 weeks expansion  
**Best for:** Quick feedback, iterative development  
**Structure:** MVP first, then expand with 4 enhancement chunks

### When to Choose This Approach

✅ Want to see results in 2 weeks  
✅ Learn best by iterating on working prototypes  
✅ Want to validate LLM reasoning early  
✅ Prefer discovering problems through real use  
✅ More comfortable with refactoring as you learn

**Recommendation:** Try this approach first. If MVP works well in 2 weeks, you've validated the approach. If it doesn't, you've only invested 2 weeks instead of 8-12.

---

## Chunk Overview

| Chunk | Focus | Duration | Test Deliverable |
|-------|-------|----------|------------------|
| **Chunk 1** | Minimal Viable Prototype | Weeks 1-2 | Analyzes ONE Kotlin NPE end-to-end |
| **Chunk 2** | Core Tools & Validation | Week 3 | Works on 5+ error types with tools |
| **Chunk 3** | Database & Learning | Weeks 4-5 | Vector DB learns from errors |
| **Chunk 4** | Android Full Coverage | Weeks 6-8 | Compose, XML, Gradle support |
| **Chunk 5** | Polish & Production | Weeks 9-12 | UI, educational mode, deployment |

---

## ⚡ CHUNK 1: Minimal Viable Prototype (Weeks 1-2)

**Priority:** 🔥 CRITICAL - Prove the concept works  
**Goal:** ONE Kotlin NPE working end-to-end in 2 weeks

---

### CHUNK 1.1: Extension Bootstrap (Days 1-3, ~24h)

**Goal:** Get basic extension structure working with Ollama

**Kai (Backend - Implements Everything):**
- [ ] Ollama client implementation (`OllamaClient.ts`)
  - [ ] Basic connection to Ollama server
  - [ ] `generate()` method for LLM inference
  - [ ] Error handling for connection failures
- [ ] Basic types and interfaces (`types.ts`)
  - [ ] `ParsedError` interface
  - [ ] `RCAResult` interface

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] VS Code extension project setup (`yo code`)
- [ ] Extension activation/deactivation (boilerplate)
- [ ] Register `rcaAgent.analyzeError` command (empty handler)
- [ ] Test command appears in command palette

**Deliverable:** Command registered, Ollama client responds to test prompt

**Development Timeline:**

**Day 1:**
- [ ] **Sokchea:** Create VS Code extension project (`yo code`)
- [ ] **Sokchea:** Register `rcaAgent.analyzeError` command
- [ ] **Kai:** Add Ollama client (just `generate()` method)
- [ ] **Together:** Test - Command appears in palette, Ollama responds

**Days 4-6: Minimal Parser + Agent**
- [ ] **Kai:** Parse Kotlin NPE stacktrace (file, line, message)
- [ ] **Kai:** ReAct loop: 3 iterations, reasoning only (no tools yet)
- [ ] **Sokchea:** Connect parser to command handler
- [ ] **Together:** Test - Agent generates hypothesis for NPE

**Days 7-10: Add File Reading**
- [ ] **Kai:** Implement `read_file` tool
- [ ] **Kai:** Agent uses tool to read error location
- [ ] **Sokchea:** Display file content and agent reasoning in output
- [ ] **Together:** Test - Agent reads code and explains error

**Days 11-14: Real Testing**
- [ ] **Kai:** Test backend logic on 5 real Kotlin NPEs
- [ ] **Sokchea:** Refine output formatting (console or notification)
- [ ] **Together:** Test - At least 3/5 give useful root cause

### Test Criteria (End of Chunk 1 - All Sub-Chunks Complete)
```bash
# MVP Success Checklist
✅ Extension activates without errors
✅ Can analyze this exact error:
   "kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized"
✅ Agent uses read_file tool correctly
✅ Generates hypothesis mentioning "lateinit" and "initialization"
✅ Completes in <90s (even on CPU)
✅ Output includes: root cause, affected file, line number
✅ Works on at least 6/10 real errors from your projects (60%+ accuracy)
```

### Files Created (Chunk 1 - MVP)
```
src/
├── extension.ts                   # Minimal entry point
├── llm/
│   └── OllamaClient.ts           # Basic client
├── utils/
│   └── KotlinNPEParser.ts        # Just NPE parsing
├── agent/
│   └── MinimalReactAgent.ts      # 3-iteration loop
└── tools/
    └── ReadFileTool.ts           # File reading only

tests/
└── mvp.test.ts                   # Core functionality test
```

### Implementation: Minimal Extension

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { OllamaClient } from './llm/OllamaClient';
import { MinimalReactAgent } from './agent/MinimalReactAgent';
import { KotlinNPEParser } from './utils/KotlinNPEParser';

export function activate(context: vscode.ExtensionContext) {
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      // Get error text from selection or input box
      const editor = vscode.window.activeTextEditor;
      const errorText = editor?.document.getText(editor.selection) || 
                       await vscode.window.showInputBox({ prompt: 'Paste error message' });
      
      if (!errorText) return;
      
      // Parse error
      const parser = new KotlinNPEParser();
      const parsedError = parser.parse(errorText);
      
      if (!parsedError) {
        vscode.window.showErrorMessage('Could not parse error');
        return;
      }
      
      // Analyze with agent
      const llm = await OllamaClient.create({ model: 'granite-code:8b' });
      const agent = new MinimalReactAgent(llm);
      
      vscode.window.showInformationMessage('Analyzing error...');
      const result = await agent.analyze(parsedError);
      
      // Show result in output channel
      const output = vscode.window.createOutputChannel('RCA Agent');
      output.appendLine('=== ROOT CAUSE ANALYSIS ===');
      output.appendLine(`\nError: ${result.error}`);
      output.appendLine(`\nRoot Cause:\n${result.rootCause}`);
      output.appendLine(`\nFix Guidelines:\n${result.fixGuidelines.join('\n')}`);
      output.show();
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}
```

### Implementation: Minimal Agent

```typescript
// src/agent/MinimalReactAgent.ts
export class MinimalReactAgent {
  constructor(private llm: OllamaClient) {}
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    const context = {
      error: error.message,
      file: error.filePath,
      line: error.line,
    };
    
    let thought = '';
    let fileContent = '';
    
    // Iteration 1: Initial reasoning
    thought = await this.llm.generate(`
      You are debugging a Kotlin error. Analyze this:
      Error: ${context.error}
      File: ${context.file}
      Line: ${context.line}
      
      What is your initial hypothesis about the root cause?
    `);
    
    // Iteration 2: Read file
    fileContent = await this.readFile(context.file, context.line);
    
    // Iteration 3: Final analysis
    const rootCause = await this.llm.generate(`
      Error: ${context.error}
      Your hypothesis: ${thought}
      Code at error location:
      ${fileContent}
      
      Based on the actual code, what is the root cause? Provide:
      1. Root cause explanation
      2. Fix guidelines (bullet points)
      
      Format as JSON: { "rootCause": "...", "fixGuidelines": ["...", "..."] }
    `);
    
    const result = JSON.parse(rootCause);
    return {
      error: context.error,
      rootCause: result.rootCause,
      fixGuidelines: result.fixGuidelines,
    };
  }
  
  private async readFile(filePath: string, line: number): Promise<string> {
    // Simple file reading: 50 lines around error
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    const start = Math.max(0, line - 25);
    const end = Math.min(doc.lineCount, line + 25);
    return doc.getText(new vscode.Range(start, 0, end, 0));
  }
}
```

### Implementation: Minimal Parser

```typescript
// src/utils/KotlinNPEParser.ts
export interface ParsedError {
  message: string;
  filePath: string;
  line: number;
  type: 'npe' | 'lateinit';
}

export class KotlinNPEParser {
  parse(errorText: string): ParsedError | null {
    // Match: "kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized"
    // or: "NullPointerException at MyClass.kt:42"
    
    const lateinitMatch = errorText.match(/lateinit property (\w+) has not been initialized/);
    if (lateinitMatch) {
      const fileMatch = errorText.match(/at (.+\.kt):(\d+)/);
      return {
        message: errorText,
        filePath: fileMatch?.[1] || 'unknown',
        line: parseInt(fileMatch?.[2] || '0'),
        type: 'lateinit',
      };
    }
    
    const npeMatch = errorText.match(/NullPointerException.*at (.+\.kt):(\d+)/);
    if (npeMatch) {
      return {
        message: errorText,
        filePath: npeMatch[1],
        line: parseInt(npeMatch[2]),
        type: 'npe',
      };
    }
    
    return null;
  }
}
```

### What You're NOT Building Yet

- ❌ Vector database
- ❌ Multiple error types
- ❌ UI/Webview
- ❌ Educational mode
- ❌ Caching
- ❌ State persistence
- ❌ LSP integration
- ❌ Android-specific features (Compose, XML, Gradle)

### Lessons to Learn from MVP

After completing this chunk, you'll discover:
- Does the LLM reason well enough about Kotlin errors?
- Is 3 iterations enough or too few?
- What tools are actually essential?
- How accurate is root cause identification?
- Are your prompts effective?

**Decision Point:** If MVP doesn't work well, pivot before building more infrastructure!

---

## 🛠️ CHUNK 2: Core Tools & Validation (Week 3)

**Priority:** 🔥 HIGH - Expand MVP to handle more cases  
**Goal:** Work on 5+ error types with better tool support

---

### CHUNK 2.1: Full Error Parser (Days 1-3, ~24h)

**Goal:** Parse multiple Kotlin error types beyond NPE

**Kai (Backend - Implements Everything):**
- [ ] Full ErrorParser implementation (`ErrorParser.ts`)
  - [ ] Unresolved reference errors
  - [ ] Type mismatch errors
  - [ ] Compilation errors
- [ ] Language detector (`LanguageDetector.ts`)
- [ ] Gradle build error parser (`GradleParser.ts`)
- [ ] Unit tests for each error type (15+ test cases)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display error type badges (NPE, Lateinit, Build, etc.)
- [ ] Color-code different error types in output
- [ ] Wire new parser to command handler

**Deliverable:** Parser handles 5+ Kotlin error types correctly

**Development Timeline:**

**Day 1:**
- **Kai:** Extend parser with unresolved reference + type mismatch
- **Sokchea:** Add error type badges to UI

**Day 2:**
- **Kai:** Add Gradle build error parsing
- **Sokchea:** Add color coding for error types

**Day 3:**
- **Together:** Test with 15 diverse errors
- **Together:** Fix parsing edge cases

**Test:** Correctly identifies 5 different error types

---

### CHUNK 2.2: LSP Integration & Tool Registry (Days 4-5, ~16h)

**Goal:** Add LSP-powered tools for better code analysis

**Kai (Backend - Implements Everything):**
- [ ] Tool registry system (`ToolRegistry.ts`)
  - [ ] Tool registration API
  - [ ] Schema validation
- [ ] LSP tool implementation (`LSPTool.ts`)
  - [ ] Find function callers
  - [ ] Get symbol definitions
  - [ ] Search workspace symbols
- [ ] Integrate tools into agent workflow

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display tool execution status ("Finding callers...")
- [ ] Show tool results in output
- [ ] Format LSP results for readability

**Deliverable:** Agent uses LSP to find function relationships

**Development Timeline:**

**Day 4:**
- **Kai:** Implement tool registry and LSP tool
- **Sokchea:** Add tool execution status notifications

**Day 5:**
- **Together:** Test LSP tool on sample projects
- **Together:** Debug LSP integration issues

**Test:** Agent successfully finds callers for a function

---

### CHUNK 2.3: Prompt Engineering & Validation (Days 6-7, ~16h)

**Goal:** Improve analysis quality through better prompts

**Kai (Backend - Implements Everything):**
- [ ] Prompt engine (`PromptEngine.ts`)
  - [ ] System prompts with guidelines
  - [ ] Few-shot examples for each error type
  - [ ] Structured output formatting
- [ ] Test suite with 10+ real errors
- [ ] Measure accuracy metrics

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display accuracy metrics in output
- [ ] Show confidence scores
- [ ] Better formatting of agent reasoning

**Deliverable:** 70%+ accuracy on 10-error test suite

**Development Timeline:**

**Day 6:**
- **Kai:** Create prompt engine with few-shot examples
- **Sokchea:** Add confidence score display

**Day 7:**
- **Together:** Run test suite, measure accuracy
- **Together:** Iterate on prompts to improve results

**Test:** 7/10 errors analyzed correctly with useful root causes

### Test Criteria (End of Chunk 2)
```bash
# Expanded Coverage Checklist
✅ Handles: NPE, lateinit, unresolved reference, build errors, type mismatch
✅ LSP tool works for simple projects
✅ 7/10 test errors analyzed successfully
✅ Agent explains WHY error happened (not just WHAT)
✅ Completes in <60s on GPU
```

### Files Created (Chunk 2 - Expansion)
```
src/
├── utils/
│   ├── ErrorParser.ts            # Full parser
│   ├── LanguageDetector.ts       # Auto-detection
│   └── parsers/
│       ├── KotlinParser.ts       # All Kotlin errors
│       └── GradleParser.ts       # Build errors
├── tools/
│   ├── ToolRegistry.ts           # Organize tools
│   └── LSPTool.ts                # Call hierarchy
└── agent/
    └── PromptEngine.ts           # Better prompts

tests/
└── error-coverage.test.ts        # 10+ error types
```

### Implementation: Full Error Parser

```typescript
// src/utils/ErrorParser.ts
export class ErrorParser {
  private parsers = {
    kotlin: new KotlinParser(),
    gradle: new GradleParser(),
  };
  
  parse(errorText: string): ParsedError | null {
    const language = LanguageDetector.detect(errorText);
    const parser = this.parsers[language];
    return parser?.parse(errorText) || null;
  }
}

// src/utils/parsers/KotlinParser.ts
export class KotlinParser {
  parse(text: string): ParsedError | null {
    // Try each error pattern
    return (
      this.parseLateinit(text) ||
      this.parseNPE(text) ||
      this.parseUnresolvedReference(text) ||
      this.parseTypeMismatch(text) ||
      null
    );
  }
  
  private parseLateinit(text: string): ParsedError | null {
    // ... implementation
  }
  
  private parseUnresolvedReference(text: string): ParsedError | null {
    // Match: "Unresolved reference: functionName"
    const match = text.match(/Unresolved reference: (\w+)/);
    if (!match) return null;
    
    const fileMatch = text.match(/at (.+\.kt):(\d+)/);
    return {
      type: 'unresolved_reference',
      message: text,
      symbol: match[1],
      filePath: fileMatch?.[1] || 'unknown',
      line: parseInt(fileMatch?.[2] || '0'),
      language: 'kotlin',
    };
  }
}
```

### Implementation: LSP Tool

```typescript
// src/tools/LSPTool.ts
export class LSPTool {
  async findCallers(functionName: string, filePath: string): Promise<string[]> {
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    
    // Find function position
    const text = doc.getText();
    const funcRegex = new RegExp(`fun ${functionName}\\(`);
    const match = funcRegex.exec(text);
    if (!match) return [];
    
    const position = doc.positionAt(match.index);
    
    // Use VS Code LSP
    const calls = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>(
      'vscode.prepareCallHierarchy',
      uri,
      position
    );
    
    return calls?.map(c => c.name) || [];
  }
}
```

### Improved Prompts

```typescript
// src/agent/PromptEngine.ts
export class PromptEngine {
  getSystemPrompt(): string {
    return `You are an expert Kotlin debugging assistant.

WORKFLOW:
1. Form hypothesis about error cause
2. Use tools to gather evidence
3. Validate hypothesis with code
4. Provide root cause and fix

AVAILABLE TOOLS:
- read_file: Read code at error location
- find_callers: Find who calls a function

Always explain WHY the error happened, not just WHAT the error is.`;
  }
  
  getAnalysisPrompt(error: ParsedError, context: AnalysisContext): string {
    return `${this.getSystemPrompt()}

ERROR:
${error.message}
File: ${error.filePath}
Line: ${error.line}

${context.fileContent ? `CODE:\n${context.fileContent}\n` : ''}

${context.callers ? `CALLERS:\n${context.callers.join(', ')}\n` : ''}

Provide your analysis as JSON:
{
  "thought": "Your reasoning",
  "action": { "tool": "tool_name", "parameters": {...} } or null if done,
  "rootCause": "Explanation" (if done),
  "fixGuidelines": ["step 1", "step 2"] (if done)
}`;
  }
}
```

---

## 🗄️ CHUNK 3: Database & Learning (Weeks 4-5)

**Priority:** 🟡 MEDIUM - Add memory/learning capability  
**Goal:** Vector DB learns from solved errors

---

### CHUNK 3.1: ChromaDB Setup & Integration (Days 1-3, ~24h)

**Goal:** Get ChromaDB running and storing RCAs

**Kai (Backend - Implements Everything):**
- [ ] ChromaDB client (`ChromaDBClient.ts`)
  - [ ] Connection to local ChromaDB server
  - [ ] Collection initialization
  - [ ] Add document method
  - [ ] Error handling
- [ ] RCA schema definition (`rca-collection.ts`)
- [ ] Integration tests

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Docker setup guide for ChromaDB (documentation)
- [ ] Display "Storing result..." notification
- [ ] Show storage success/failure messages

**Deliverable:** ChromaDB stores RCA documents successfully

**Development Timeline:**

**Day 1:**
- **Together:** Set up ChromaDB via Docker
- **Kai:** Create ChromaDB client skeleton

**Day 2:**
- **Kai:** Implement add document method
- **Sokchea:** Add storage notifications

**Day 3:**
- **Together:** Test storing 5 RCA documents
- **Together:** Verify data persists after restart

**Test:** 5 RCAs stored and retrievable from DB

---

### CHUNK 3.2: Embedding & Similarity Search (Days 4-6, ~24h)

**Goal:** Search vector DB for similar past errors

**Kai (Backend - Implements Everything):**
- [ ] Local embedding service (`EmbeddingService.ts`)
  - [ ] Load sentence transformer model
  - [ ] Generate embeddings for errors
  - [ ] Batch processing
- [ ] Similarity search implementation
  - [ ] Query by error message
  - [ ] Filter by language/error type
  - [ ] Rank by relevance
- [ ] Quality scorer (`QualityScorer.ts`)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display "Searching past solutions..." status
- [ ] Show similar errors found in output
- [ ] Format similarity scores for user

**Deliverable:** Search returns relevant past RCAs

**Development Timeline:**

**Day 4:**
- **Kai:** Implement embedding service
- **Sokchea:** Add search status notifications

**Day 5:**
- **Kai:** Implement similarity search with filtering
- **Sokchea:** Format search results for display

**Day 6:**
- **Together:** Test search with 10 stored RCAs
- **Together:** Tune similarity thresholds

**Test:** Search for "NullPointerException" returns relevant past solutions

---

### CHUNK 3.3: Caching & Deduplication (Days 7-9, ~24h)

**Goal:** Speed up analysis for repeat errors

**Kai (Backend - Implements Everything):**
- [ ] Error hasher (`ErrorHasher.ts`)
  - [ ] SHA-256 signature generation
  - [ ] Normalize error messages
- [ ] RCA cache (`RCACache.ts`)
  - [ ] In-memory cache with TTL
  - [ ] Cache hit/miss tracking
  - [ ] Invalidation on feedback
- [ ] Performance metrics

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display "Cache hit" notification
- [ ] Show cache statistics (optional)
- [ ] Faster response feedback

**Deliverable:** Repeat errors return in <5s

**Development Timeline:**

**Day 7:**
- **Kai:** Implement error hashing
- **Sokchea:** Add cache hit notifications

**Day 8:**
- **Kai:** Implement cache with TTL
- **Sokchea:** Test cache behavior in UI

**Day 9:**
- **Together:** Measure cache hit rates
- **Together:** Tune cache TTL and size

**Test:** Identical error returns cached result in <5s

---

### CHUNK 3.4: User Feedback System (Days 10-12, ~24h)

**Goal:** Learn from user validation of RCAs

**Kai (Backend - Implements Everything):**
- [ ] Feedback handler (`FeedbackHandler.ts`)
  - [ ] Process thumbs up/down
  - [ ] Update confidence scores
  - [ ] Re-embed with new scores
- [ ] Quality management
  - [ ] Auto-prune low-quality RCAs
  - [ ] Expiration policy (6 months)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] "Helpful?" buttons (👍/👎) in output
- [ ] Thank you message on feedback
- [ ] Optional comment box
- [ ] Wire buttons to Kai's feedback handler

**Deliverable:** User feedback improves future results

**Development Timeline:**

**Day 10:**
- **Sokchea:** Add feedback buttons to output
- **Kai:** Create feedback handler

**Day 11:**
- **Kai:** Implement confidence score updates
- **Sokchea:** Wire buttons to handler

**Day 12:**
- **Together:** Test feedback loop
- **Together:** Verify scores update correctly

**Test:** Positive feedback increases confidence, negative invalidates cache

### Test Criteria (End of Chunk 3)
```bash
# Learning System Checklist
✅ Store 10 RCAs in vector DB
✅ Query "NullPointerException" returns relevant past solutions
✅ Repeat identical error: <5s (cache hit)
✅ Positive feedback increases confidence score
✅ Low-quality RCAs (confidence <0.5) not returned in search
```

### Files Created (Chunk 3 - Database)
```
src/
├── db/
│   ├── ChromaDBClient.ts         # Vector DB client
│   ├── EmbeddingService.ts       # Local embeddings
│   ├── QualityScorer.ts          # Auto-scoring
│   └── schemas/
│       └── rca-collection.ts     # Schema definition
├── cache/
│   ├── RCACache.ts               # Deduplication
│   └── ErrorHasher.ts            # Signature hashing
└── agent/
    └── FeedbackHandler.ts        # User ratings

tests/integration/
└── database.test.ts              # DB operations
```

### Implementation: ChromaDB Integration

```typescript
// src/db/ChromaDBClient.ts
import { ChromaClient } from 'chromadb';
import { EmbeddingService } from './EmbeddingService';

export class ChromaDBClient {
  private client: ChromaClient;
  private embedder: EmbeddingService;
  
  static async create(): Promise<ChromaDBClient> {
    const instance = new ChromaDBClient();
    instance.client = new ChromaClient({ path: 'http://localhost:8000' });
    instance.embedder = await EmbeddingService.create();
    await instance.initCollection();
    return instance;
  }
  
  private async initCollection() {
    this.collection = await this.client.getOrCreateCollection({
      name: 'rca_solutions',
      metadata: { description: 'Root cause analysis solutions' },
    });
  }
  
  async addRCA(rca: RCADocument): Promise<string> {
    const embedding = await this.embedder.embed(
      `${rca.error_message} ${rca.root_cause}`
    );
    
    await this.collection.add({
      ids: [rca.id],
      embeddings: [embedding],
      metadatas: [{
        language: rca.language,
        error_type: rca.error_type,
        confidence: rca.confidence,
        created_at: rca.created_at,
      }],
      documents: [JSON.stringify(rca)],
    });
    
    return rca.id;
  }
  
  async searchSimilar(errorMessage: string, limit: number = 5): Promise<RCADocument[]> {
    const embedding = await this.embedder.embed(errorMessage);
    
    const results = await this.collection.query({
      queryEmbeddings: [embedding],
      nResults: limit,
      where: { confidence: { $gte: 0.5 } }, // Filter low quality
    });
    
    return results.documents[0].map(doc => JSON.parse(doc));
  }
}
```

### Implementation: Result Caching

```typescript
// src/cache/RCACache.ts
import * as crypto from 'crypto';

export class RCACache {
  private cache = new Map<string, { rca: RCADocument; expires: number }>();
  private TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  hash(error: ParsedError): string {
    const key = `${error.type}:${error.message}:${error.filePath}:${error.line}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }
  
  get(errorHash: string): RCADocument | null {
    const cached = this.cache.get(errorHash);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(errorHash);
      return null;
    }
    
    return cached.rca;
  }
  
  set(errorHash: string, rca: RCADocument): void {
    this.cache.set(errorHash, {
      rca,
      expires: Date.now() + this.TTL,
    });
  }
  
  invalidate(errorHash: string): void {
    this.cache.delete(errorHash);
  }
}
```

### Integration with Agent

```typescript
// Update MinimalReactAgent to use DB
export class ReactAgent {
  constructor(
    private llm: OllamaClient,
    private db: ChromaDBClient,
    private cache: RCACache
  ) {}
  
  async analyze(error: ParsedError): Promise<RCADocument> {
    // 1. Check cache first
    const errorHash = this.cache.hash(error);
    const cached = this.cache.get(errorHash);
    if (cached) {
      console.log('Cache hit!');
      return cached;
    }
    
    // 2. Search vector DB for similar errors
    const similar = await this.db.searchSimilar(error.message, 3);
    
    // 3. Run analysis (with similar solutions as context)
    const rca = await this.runAnalysis(error, similar);
    
    // 4. Store result
    await this.db.addRCA(rca);
    this.cache.set(errorHash, rca);
    
    return rca;
  }
}
```

---

## 📱 CHUNK 4: Android Full Coverage (Weeks 6-8)

**Priority:** 🟡 MEDIUM - Complete Android support  
**Goal:** Handle all Android error types (Compose, XML, Gradle)

---

### CHUNK 4.1: Jetpack Compose Parser (Days 1-4, ~32h)

**Goal:** Parse and analyze Compose-specific errors

**Kai (Backend - Implements Everything):**
- [ ] Jetpack Compose parser (`JetpackComposeParser.ts`)
  - [ ] `remember` errors
  - [ ] `derivedStateOf` errors
  - [ ] Recomposition issues
  - [ ] `LaunchedEffect` errors
  - [ ] CompositionLocal errors
- [ ] Compose-specific prompts
- [ ] Unit tests (10+ Compose errors)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Compose error badge/icon
- [ ] Display recomposition hints
- [ ] Format Compose-specific output

**Deliverable:** Analyze 5+ Compose error types

**Development Timeline:**

**Days 1-2:**
- **Kai:** Implement remember and recomposition parsers
- **Sokchea:** Add Compose badge to UI

**Days 3-4:**
- **Kai:** Add LaunchedEffect and CompositionLocal parsers
- **Together:** Test with real Compose errors

**Test:** Correctly identifies and explains 5 Compose errors

---

### CHUNK 4.2: XML Layout Parser (Days 5-7, ~24h)

**Goal:** Handle XML layout inflation errors

**Kai (Backend - Implements Everything):**
- [ ] XML parser (`XMLParser.ts`)
  - [ ] Inflation errors
  - [ ] Missing view ID errors
  - [ ] Attribute errors (layout_width, etc.)
  - [ ] Namespace issues
- [ ] XML-specific prompts
- [ ] Unit tests (8+ XML errors)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] XML error badge
- [ ] Display XML code snippets
- [ ] Format XML attribute suggestions

**Deliverable:** Analyze 3+ XML layout error types

**Development Timeline:**

**Day 5:**
- **Kai:** Implement inflation and missing ID parsers
- **Sokchea:** Add XML badge and snippet display

**Days 6-7:**
- **Kai:** Add attribute and namespace parsers
- **Together:** Test with real XML errors

**Test:** Correctly identifies XML inflation and attribute errors

---

### CHUNK 4.3: Gradle Build Analyzer (Days 8-11, ~32h)

**Goal:** Analyze Gradle build errors and dependency conflicts

**Kai (Backend - Implements Everything):**
- [ ] Android build tool (`AndroidBuildTool.ts`)
  - [ ] Dependency conflict detection
  - [ ] Version mismatch analysis
  - [ ] Repository configuration errors
  - [ ] Plugin errors
- [ ] Gradle DSL parser (Groovy + Kotlin DSL)
- [ ] Dependency recommendation engine
- [ ] Unit tests (10+ Gradle errors)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Gradle error badge
- [ ] Display dependency conflicts clearly
- [ ] Format version recommendations
- [ ] Show Kai's build fix suggestions

**Deliverable:** Analyze 5+ Gradle build error types

**Development Timeline:**

**Days 8-9:**
- **Kai:** Implement dependency conflict detection
- **Sokchea:** Add conflict visualization

**Days 10-11:**
- **Kai:** Add version mismatch and plugin error parsers
- **Together:** Test with real Gradle errors

**Test:** Correctly identifies dependency conflicts and suggests fixes

---

### CHUNK 4.4: Manifest & Docs Integration (Days 12-15, ~32h)

**Goal:** Handle manifest errors and add Android documentation

**Kai (Backend - Implements Everything):**
- [ ] Manifest analyzer tool (`ManifestAnalyzerTool.ts`)
  - [ ] Merge conflict detection
  - [ ] Missing permission errors
  - [ ] Activity/Service declaration issues
- [ ] Android docs search (`AndroidDocsSearchTool.ts`)
  - [ ] Offline Android SDK docs
  - [ ] Jetpack library docs
  - [ ] Common API references
- [ ] Unit tests

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Manifest error badge
- [ ] Display Kai's docs search results
- [ ] Format permission suggestions
- [ ] Link to relevant documentation

**Deliverable:** Analyze manifest errors + search Android docs

**Development Timeline:**

**Days 12-13:**
- **Kai:** Implement manifest analyzer
- **Sokchea:** Add manifest error display

**Days 14-15:**
- **Kai:** Implement Android docs search tool
- **Together:** Test manifest + docs integration

**Test:** Identifies manifest merge conflicts and finds relevant docs

---

### CHUNK 4.5: Android Testing & Validation (Days 16-18, ~24h)

**Goal:** Comprehensive testing of all Android features

**Kai (Backend - Implements Everything):**
- [ ] Integration tests for all Android parsers
- [ ] Test suite with 20+ real Android errors
- [ ] Accuracy measurement
- [ ] Performance optimization

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Android error summary dashboard (optional)
- [ ] Test all UI components with real data
- [ ] Polish Android-specific UI elements

**Deliverable:** 70%+ accuracy on Android error test suite

**Development Timeline:**

**Days 16-17:**
- **Kai:** Run comprehensive test suite
- **Together:** Fix bugs and edge cases

**Day 18:**
- **Together:** Final validation and documentation
- **Together:** Measure accuracy metrics

**Test:** 14/20 Android errors analyzed successfully

### Test Criteria (End of Chunk 4)
```bash
# Full Android Support Checklist
✅ 5+ Compose errors: remember, derivedStateOf, LaunchedEffect
✅ 3+ XML errors: inflation, missing IDs, attribute errors
✅ 3+ Gradle errors: dependency conflicts, version mismatches
✅ 2+ Manifest errors: merge conflicts, missing permissions
✅ Android docs search returns SDK references
```

### Files Created (Chunk 4 - Android)
```
src/
├── utils/parsers/
│   ├── JetpackComposeParser.ts   # Compose errors
│   └── XMLParser.ts              # Layout errors
├── tools/
│   ├── AndroidBuildTool.ts       # Gradle analysis
│   ├── AndroidDocsSearchTool.ts  # Offline docs
│   └── ManifestAnalyzerTool.ts   # Manifest issues
└── validators/
    └── AndroidFixValidator.ts    # Compile check

tests/integration/
└── android-coverage.test.ts      # All Android errors
```

### Implementation: Compose Parser

```typescript
// src/utils/parsers/JetpackComposeParser.ts
export class JetpackComposeParser {
  parse(text: string): ParsedError | null {
    return (
      this.parseRememberError(text) ||
      this.parseRecompositionError(text) ||
      this.parseLaunchedEffectError(text) ||
      null
    );
  }
  
  private parseRememberError(text: string): ParsedError | null {
    // Match: "reading a state in a composable function without calling remember"
    if (text.includes('reading a state') && text.includes('without calling remember')) {
      const fileMatch = text.match(/at (.+\.kt):(\d+)/);
      return {
        type: 'compose_remember',
        message: text,
        filePath: fileMatch?.[1] || 'unknown',
        line: parseInt(fileMatch?.[2] || '0'),
        language: 'kotlin',
        framework: 'compose',
      };
    }
    return null;
  }
  
  private parseRecompositionError(text: string): ParsedError | null {
    // Match excessive recomposition warnings
    if (text.includes('Recomposing') && text.includes('times')) {
      return {
        type: 'compose_recomposition',
        message: text,
        filePath: 'unknown', // Needs profiler trace
        line: 0,
        language: 'kotlin',
        framework: 'compose',
      };
    }
    return null;
  }
}
```

### Implementation: Gradle Analyzer

```typescript
// src/tools/AndroidBuildTool.ts
export class AndroidBuildTool {
  async analyzeDependencyConflict(buildError: string): Promise<ConflictAnalysis> {
    // Parse Gradle output for dependency conflicts
    const conflictMatch = buildError.match(
      /Conflict.*module '(.+)' versions? (.+) and (.+)/
    );
    
    if (conflictMatch) {
      const [_, module, version1, version2] = conflictMatch;
      return {
        module,
        conflictingVersions: [version1, version2],
        resolution: `Add explicit version in build.gradle:
implementation("${module}:${this.recommendVersion(version1, version2)}")`,
      };
    }
    
    return { module: 'unknown', conflictingVersions: [], resolution: '' };
  }
  
  private recommendVersion(v1: string, v2: string): string {
    // Simple: recommend higher version
    return v1 > v2 ? v1 : v2;
  }
}
```

---

## 🎨 CHUNK 5: Polish & Production (Weeks 9-12)

**Priority:** 🟢 POLISH - Make it production-ready  
**Goal:** UI, educational mode, testing, deployment

---

### CHUNK 5.1: Webview UI Foundation (Days 1-5, ~40h)

**Goal:** Replace text output with interactive webview UI

**Kai (Backend - Implements Everything):**
- [ ] Agent state streaming (`AgentStateStream.ts`)
  - [ ] Real-time iteration updates
  - [ ] Progress events
- [ ] Document synthesizer (`DocumentSynthesizer.ts`)
  - [ ] Markdown RCA reports
  - [ ] Code highlighting
  - [ ] Section organization

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Webview panel creation (`RCAWebview.ts`)
- [ ] HTML/CSS layout design
- [ ] Real-time progress display
  - [ ] Iteration counter
  - [ ] Current thought/action/observation
  - [ ] Progress bar
- [ ] Message passing (extension ↔ webview)
- [ ] Display Kai's synthesized reports

**Deliverable:** Interactive webview showing live analysis progress

**Development Timeline:**

**Days 1-2:**
- **Sokchea:** Create webview panel boilerplate
- **Kai:** Implement state streaming

**Days 3-4:**
- **Sokchea:** Design HTML/CSS layout, implement progress display
- **Kai:** Create document synthesizer

**Day 5:**
- **Together:** Wire streaming to webview
- **Together:** Test with live analysis

**Test:** Webview shows real-time iteration progress

---

### CHUNK 5.2: Educational Mode (Days 6-10, ~40h)

**Goal:** Add beginner-friendly learning explanations

**Kai (Backend - Implements Everything):**
- [ ] Educational agent (`EducationalAgent.ts`)
  - [ ] Generate learning notes
  - [ ] Explain error types
  - [ ] Explain root causes
  - [ ] Prevention tips
- [ ] Educational prompts
  - [ ] Beginner-friendly language
  - [ ] Analogies and examples
- [ ] Async explanation generation (optional)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Educational mode toggle in UI
- [ ] "🎓 Learning Note" sections
- [ ] Display Kai's educational content
- [ ] Formatted tips and examples
- [ ] "Why This Error Happened" section

**Deliverable:** Educational mode generates learning content

**Development Timeline:**

**Days 6-7:**
- **Kai:** Implement educational agent logic
- **Sokchea:** Add educational mode toggle

**Days 8-9:**
- **Kai:** Create educational prompts and examples
- **Sokchea:** Design learning note UI sections

**Day 10:**
- **Together:** Test educational mode output quality
- **Together:** Refine explanations for clarity

**Test:** Educational mode provides clear, beginner-friendly explanations

---

### CHUNK 5.3: Performance Optimization (Days 11-14, ~32h)

**Goal:** Meet all performance targets

**Kai (Backend - Implements Everything):**
- [ ] Performance tracker (`PerformanceTracker.ts`)
  - [ ] Latency measurement per tool
  - [ ] Token usage tracking
  - [ ] Cache hit rate monitoring
- [ ] Optimization implementation
  - [ ] Parallel tool execution
  - [ ] Context window management
  - [ ] Query optimization
- [ ] Benchmarking suite

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Performance metrics display (optional)
- [ ] Loading states optimization
- [ ] UI responsiveness improvements

**Deliverable:** <60s analysis time (standard mode, GPU)

**Development Timeline:**

**Days 11-12:**
- **Kai:** Implement performance tracking
- **Kai:** Add parallel tool execution

**Days 13-14:**
- **Kai:** Run benchmarks, optimize bottlenecks
- **Together:** Validate performance targets met

**Test:** Standard mode completes in <60s, Fast mode in <40s

---

### CHUNK 5.4: Testing & Quality Assurance (Days 15-19, ~40h)

**Goal:** Achieve 80%+ test coverage and high reliability

**Kai (Backend - Implements Everything):**
- [ ] Unit test completion (all modules)
- [ ] Integration tests (full workflows)
- [ ] Golden test suite (15+ reference RCAs)
- [ ] Edge case testing
- [ ] Error handling validation
- [ ] Performance regression tests

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] UI component tests
- [ ] Extension activation tests
- [ ] Webview rendering tests
- [ ] User interaction tests

**Deliverable:** 80%+ test coverage, all tests passing

**Development Timeline:**

**Days 15-16:**
- **Kai:** Write missing unit tests
- **Sokchea:** Write UI tests

**Days 17-18:**
- **Kai:** Create golden test suite
- **Together:** Run full test suite

**Day 19:**
- **Together:** Fix failing tests
- **Together:** Measure final coverage

**Test:** 80%+ coverage, 0 failing tests

---

### CHUNK 5.5: Documentation & Deployment (Days 20-24, ~40h)

**Goal:** Package extension and create comprehensive docs

**Kai (Backend - Implements Everything):**
- [ ] API documentation
- [ ] Code comments cleanup
- [ ] Architecture documentation
- [ ] Performance benchmarks documentation

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] User guide (`README.md`)
- [ ] Educational mode guide (`EDUCATIONAL_MODE.md`)
- [ ] Installation instructions
- [ ] Screenshots and demo video
- [ ] Extension packaging (`.vsix`)
- [ ] VS Code marketplace listing (optional)
- [ ] Troubleshooting guide

**Deliverable:** Packaged extension ready for installation

**Development Timeline:**

**Days 20-21:**
- **Sokchea:** Write user guide and installation docs
- **Kai:** Write API documentation

**Days 22-23:**
- **Sokchea:** Create screenshots and demo video
- **Together:** Review all documentation

**Day 24:**
- **Sokchea:** Package extension (`.vsix`)
- **Together:** Test installation on clean VS Code
- **Together:** Final validation

**Test:** Extension installs successfully, all features work

### Test Criteria (End of Chunk 5)
```bash
# Production Ready Checklist
✅ UI shows iteration progress in real-time
✅ Educational mode generates beginner-friendly explanations
✅ All performance targets met (<60s standard)
✅ Golden test suite passes (15+ reference RCAs)
✅ CI pipeline green
✅ Extension installs successfully
✅ Documentation complete
```

### Files Created (Chunk 5 - Polish)
```
src/
├── ui/
│   ├── RCAWebview.ts             # Main UI
│   └── ProgressDisplay.ts        # Live updates
├── agent/
│   └── DocumentSynthesizer.ts    # Beautiful RCA reports
└── monitoring/
    └── PerformanceTracker.ts     # Metrics

tests/
├── golden/                       # Reference RCAs
├── performance/                  # Benchmarks
└── e2e/                         # Full workflows

docs/
├── README.md                     # User guide
└── EDUCATIONAL_MODE.md           # Learning guide
```

### Implementation: Webview UI

```typescript
// src/ui/RCAWebview.ts
export class RCAWebview {
  private panel: vscode.WebviewPanel;
  
  static create(): RCAWebview {
    const panel = vscode.window.createWebviewPanel(
      'rcaAgent',
      'RCA Agent',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );
    
    return new RCAWebview(panel);
  }
  
  updateProgress(state: AgentState) {
    this.panel.webview.postMessage({
      type: 'update',
      iteration: state.iteration,
      maxIterations: state.maxIterations,
      thought: state.thoughts[state.thoughts.length - 1],
      action: state.actions[state.actions.length - 1],
      observation: state.observations[state.observations.length - 1],
    });
  }
  
  showFinalRCA(rca: RCADocument) {
    const markdown = this.synthesizeMarkdown(rca);
    this.panel.webview.html = this.getHtmlContent(markdown);
  }
  
  private getHtmlContent(markdown: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; padding: 20px; }
    .iteration { border-left: 3px solid #007acc; padding-left: 10px; margin: 10px 0; }
    .thought { color: #333; }
    .action { color: #0066cc; }
    .observation { color: #666; background: #f5f5f5; padding: 5px; }
  </style>
</head>
<body>
  ${markdown}
  <script>
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'update') {
        // Update progress display
        document.getElementById('progress').innerHTML = 
          \`Iteration \${msg.iteration}/\${msg.maxIterations}\`;
      }
    });
  </script>
</body>
</html>`;
  }
}
```

### Implementation: Educational Mode

```typescript
// src/agent/EducationalAgent.ts
export class EducationalAgent extends ReactAgent {
  async analyze(error: ParsedError): Promise<RCADocument> {
    const rca = await super.analyze(error);
    
    // Add educational explanations
    rca.learningNotes = await this.generateLearningNotes(rca);
    
    return rca;
  }
  
  private async generateLearningNotes(rca: RCADocument): Promise<string[]> {
    const notes: string[] = [];
    
    // Explain the error type
    notes.push(await this.explainErrorType(rca.error_type));
    
    // Explain the root cause
    notes.push(await this.explainRootCause(rca.root_cause));
    
    // Explain how to prevent it
    notes.push(await this.explainPrevention(rca));
    
    return notes;
  }
  
  private async explainErrorType(errorType: string): Promise<string> {
    return await this.llm.generate(`
      Explain "${errorType}" error to a beginner Kotlin developer.
      Use simple language and analogies. Keep it under 100 words.
    `);
  }
}
```

---

## 📊 Development Milestones

Track your progress through each chunk:

- [ ] **Chunk 1 Complete:** MVP working (Week 2)
  - **Kai:** Backend analysis engine working
  - **Sokchea:** Extension activates and displays results
  - **Together:** Analyzes at least 1 Kotlin NPE end-to-end
  
- [ ] **Chunk 2 Complete:** Expanded coverage (Week 3)
  - **Kai:** All parsers and tools implemented
  - **Sokchea:** Tool results displayed properly
  - **Together:** Handles 5+ error types, 7/10 test errors successful
  
- [ ] **Chunk 3 Complete:** Learning system (Week 5)
  - **Kai:** ChromaDB storing and retrieving RCAs
  - **Sokchea:** User feedback UI working
  - **Together:** Cache hit: <5s, similarity search functional
  
- [ ] **Chunk 4 Complete:** Full Android (Week 8)
  - **Kai:** All Android parsers and tools working
  - **Sokchea:** Android-specific UI elements complete
  - **Together:** Compose/XML/Gradle errors analyzed correctly
  
- [ ] **Chunk 5 Complete:** Production (Week 12)
  - **Kai:** Backend optimized and tested
  - **Sokchea:** Full webview UI functional
  - **Together:** 80%+ test coverage, extension packaged and ready

---

## 🎯 Success Criteria

**Phase 1 Option B is complete when:**
- ✅ Can analyze 15+ different Kotlin/Android error types
- ✅ Handles all Android approaches (Kotlin+Compose, Java+XML, Gradle)
- ✅ Completes analysis in <60s on GPU
- ✅ Educational mode works
- ✅ Vector DB learns from errors
- ✅ UI shows live progress
- ✅ Extension packaged and installable
- ✅ You actually use it during development

---

## 🔄 Iteration Strategy

**After Chunk 1 MVP:**
- **Kai:** If LLM reasoning is weak → Improve prompts before continuing
- **Kai:** If 3 iterations insufficient → Increase to 5-8 iterations
- **Kai:** If parsing fails → Enhance error parser
- **Sokchea:** If UI display unclear → Improve output formatting
- **Together:** Review MVP with real errors, decide on improvements

**After Chunk 2:**
- **Kai:** If accuracy <70% → Focus on prompt engineering (Kai implements)
- **Kai:** If too slow → Add caching/optimize (Kai implements)
- **Kai:** If LSP issues → Use simpler code analysis (Kai implements)
- **Sokchea:** If UI feedback unclear → Improve display of Kai's results
- **Together:** Test on diverse error set, validate improvements

**After Chunk 3:**
- **Kai:** If vector search not helpful → Improve embedding strategy (Kai implements)
- **Kai:** If cache not effective → Adjust TTL or hash algorithm (Kai implements)
- **Sokchea:** If feedback buttons not working → Fix UI wiring to Kai's handler
- **Together:** Review learning effectiveness, tune quality scoring

**Key Principle:** Don't move to next chunk until current chunk delivers value!

### 🤝 Collaboration Points

**Daily Sync (15 min):**
- Kai shares what functions/APIs are ready
- Sokchea shares what UI components need backend data
- Coordinate interface contracts (function signatures, data formats)
- Plan integration points for the day

**Integration Days (End of each week):**
- **Kai demos:** Backend functionality (functions, APIs, data)
- **Sokchea demos:** UI wireframes and VS Code extension shell
- **Together:** Wire Sokchea's UI to Kai's backend
- Fix any interface mismatches

**Code Reviews:**
- Kai reviews Sokchea's integration/wiring code
- Sokchea reviews Kai's API contracts (to understand how to call them)
- Both review tests together

**Clear Division:**
- **Kai = ALL implementation** (parsers, agents, tools, database, algorithms)
- **Sokchea = ONLY UI + wiring** (displays, buttons, extension API, calling Kai's functions)

---

[← Back to Phase 1 Overview](Phase1-Foundation-Kotlin-Android.md) | [Compare with Option A →](Phase1-OptionA-Traditional.md)
=======
# 🏗️ PHASE 1 - OPTION B: MVP-First Rapid Iteration

> **Goal:** Get working prototype fast, then expand. Best for quick validation.

[← Back to Phase 1 Overview](Phase1-Foundation-Kotlin-Android.md) | [Compare with Option A →](Phase1-OptionA-Traditional.md)

---

## Overview

**Timeline:** 3-4 weeks MVP + 8-10 weeks expansion  
**Best for:** Quick feedback, iterative development  
**Structure:** MVP first, then expand with 4 enhancement chunks

### When to Choose This Approach

✅ Want to see results in 2 weeks  
✅ Learn best by iterating on working prototypes  
✅ Want to validate LLM reasoning early  
✅ Prefer discovering problems through real use  
✅ More comfortable with refactoring as you learn

**Recommendation:** Try this approach first. If MVP works well in 2 weeks, you've validated the approach. If it doesn't, you've only invested 2 weeks instead of 8-12.

---

## Chunk Overview

| Chunk | Focus | Duration | Test Deliverable |
|-------|-------|----------|------------------|
| **Chunk 1** | Minimal Viable Prototype | Weeks 1-2 | Analyzes ONE Kotlin NPE end-to-end |
| **Chunk 2** | Core Tools & Validation | Week 3 | Works on 5+ error types with tools |
| **Chunk 3** | Database & Learning | Weeks 4-5 | Vector DB learns from errors |
| **Chunk 4** | Android Full Coverage | Weeks 6-8 | Compose, XML, Gradle support |
| **Chunk 5** | Polish & Production | Weeks 9-12 | UI, educational mode, deployment |

---

## 🔧 Prerequisites & Environment Setup (Day 0, ~4-8h)

> **CRITICAL:** Complete this setup BEFORE starting Chunk 1.1. Both developers should work through this together.

### 📦 Required Manual Installations (Cannot be done via terminal)

**Both Developers Must Install:**

1. **Node.js 18+ LTS**
   - Download: https://nodejs.org/
   - Verify after install: `node --version` (should show v18+)
   - Includes npm package manager
   - **Why:** Required for TypeScript compilation and VS Code extension development

2. **Visual Studio Code**
   - Download: https://code.visualstudio.com/
   - Verify after install: `code --version`
   - **Why:** IDE for extension development and testing

3. **Git**
   - Download: https://git-scm.com/
   - Verify after install: `git --version`
   - **Why:** Version control and collaboration

4. **Ollama** (Kai's primary tool)
   - Download: https://ollama.ai/download
   - Windows: Run installer, follow prompts
   - Verify after install: `ollama --version`
   - **Why:** Local LLM inference server

5. **Docker Desktop** (Optional, for Chunk 3)
   - Download: https://www.docker.com/products/docker-desktop
   - **Why:** ChromaDB container (needed in Week 4)
   - **Note:** Can skip for now, install before Chunk 3

---

### ⌨️ Terminal-Based Setup (Run these commands)

**Step 1: Verify Prerequisites Installed**
```bash
# Check all required software
node --version          # Should show v18.x.x or higher
npm --version           # Should show v9.x.x or higher
git --version           # Should show version
code --version          # Should show VS Code version
ollama --version        # Should show Ollama version
```

**Step 2: Install Global NPM Packages** (Sokchea's tools)
```bash
# Yeoman - VS Code extension generator
npm install -g yo

# VS Code Extension generator
npm install -g generator-code

# TypeScript compiler (if not included in project)
npm install -g typescript

# ESLint for code quality
npm install -g eslint

# Verify installations
yo --version
tsc --version
eslint --version
```

**Step 3: Download Ollama Model** (Kai's LLM)
```bash
# Download granite-code:8b model (~5GB download)
# This may take 10-30 minutes depending on internet speed
ollama pull granite-code:8b

# Verify model downloaded
ollama list

# Test model works
ollama run granite-code:8b "Write a hello world function in Kotlin"
# Should return Kotlin code - press Ctrl+D to exit
```

**Step 4: Test Ollama API** (Kai's backend test)
```bash
# Start Ollama server (if not auto-started)
ollama serve

# In a new terminal, test API endpoint
curl http://localhost:11434/api/generate -d '{
  "model": "granite-code:8b",
  "prompt": "Hello",
  "stream": false
}'

# Should return JSON response with generated text
```

---

### 📚 Optional Tools (Recommended for easier development)

**Install via Terminal:**
```bash
# Prettier for code formatting
npm install -g prettier

# Nodemon for auto-restart during development
npm install -g nodemon

# Jest for testing (will also be in project dependencies)
npm install -g jest
```

**Manual Installations:**
- **Postman** or **Insomnia** - Test HTTP APIs (Ollama, ChromaDB)
- **GitKraken** or **GitHub Desktop** - Git GUI (if you prefer visual tools)
- **Windows Terminal** - Better terminal experience (Microsoft Store)

---

### ✅ Final Validation Checklist

**Run these commands to verify everything works:**

```bash
# Create test directory
mkdir rca-test-setup
cd rca-test-setup

# Test Node.js
node --version
# Expected: v18.x.x or higher ✅

# Test npm
npm --version
# Expected: v9.x.x or higher ✅

# Test TypeScript
tsc --version
# Expected: Version 5.x.x ✅

# Test VS Code
code --version
# Expected: Version output ✅

# Test Yeoman
yo --version
# Expected: Version output ✅

# Test Ollama
ollama list
# Expected: Should show granite-code:8b in list ✅

# Test Ollama API
curl http://localhost:11434/api/tags
# Expected: JSON response with models list ✅

# Cleanup
cd ..
rmdir rca-test-setup
```

**All checks passed?** ✅ You're ready to start Chunk 1.1!

**Any failures?** ❌ Review the installation steps for that tool.

---

### 🚨 Common Setup Issues & Solutions

**Issue: `node: command not found`**
- **Solution:** Node.js not in PATH. Restart terminal or add to PATH manually
- Windows: Search "Environment Variables" → Edit PATH → Add Node.js install directory

**Issue: `ollama: command not found`**
- **Solution:** Restart terminal after Ollama installation
- Windows: Check if Ollama service is running (Task Manager → Services)

**Issue: `yo: command not found` after npm install**
- **Solution:** Global npm packages not in PATH
- Run: `npm config get prefix` → Add that directory to PATH

**Issue: Ollama model download fails**
- **Solution:** Check internet connection, proxy settings, firewall
- Try: `ollama pull granite-code:8b --insecure` (if behind corporate proxy)

**Issue: Docker Desktop won't start**
- **Solution:** Enable Hyper-V (Windows) or install WSL2
- **Note:** Not needed until Chunk 3 (Week 4)

---

### ⏱️ Estimated Setup Time

| Task | Time | Notes |
|------|------|-------|
| Download & install software | 1-2h | Depends on internet speed |
| Terminal setup (npm packages) | 15-30min | Quick installs |
| Download Ollama model (5GB) | 10-60min | Depends on internet speed |
| Testing & validation | 15-30min | Running verification commands |
| **Total** | **2-4h** | **Can be done in parallel by both developers** |

---

### 👥 Division of Responsibilities

**Sokchea's Priority:**
- ✅ Node.js + npm
- ✅ VS Code
- ✅ Yeoman + generator-code
- ✅ Git
- ⚠️ Ollama (basic awareness, but Kai will configure)

**Kai's Priority:**
- ✅ Node.js + npm
- ✅ Ollama + model download
- ✅ Test Ollama API thoroughly
- ✅ Git
- ⚠️ VS Code (basic awareness, but Sokchea will configure extension)

**Both Together:**
- Verify all installations
- Test Ollama is responding
- Ensure both can run `yo code` successfully

---

## ⚡ CHUNK 1: Minimal Viable Prototype (Weeks 1-2)

**Priority:** 🔥 CRITICAL - Prove the concept works  
**Goal:** ONE Kotlin NPE working end-to-end in 2 weeks

---

### CHUNK 1.1: Extension Bootstrap (Days 1-3, ~24h)

**Goal:** Get basic extension structure working with Ollama

**Kai (Backend - Implements Everything):**
- [ ] Ollama client implementation (`OllamaClient.ts`)
  - [ ] Basic connection to Ollama server
  - [ ] `generate()` method for LLM inference
  - [ ] Error handling for connection failures
- [ ] Basic types and interfaces (`types.ts`)
  - [ ] `ParsedError` interface
  - [ ] `RCAResult` interface

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] VS Code extension project setup (`yo code`)
- [ ] Extension activation/deactivation (boilerplate)
- [ ] Register `rcaAgent.analyzeError` command (empty handler)
- [ ] Test command appears in command palette

**Deliverable:** Command registered, Ollama client responds to test prompt

**Development Timeline:**

**Day 1:**
- [ ] **Sokchea:** Create VS Code extension project (`yo code`)
- [ ] **Sokchea:** Register `rcaAgent.analyzeError` command
- [ ] **Kai:** Add Ollama client (just `generate()` method)
- [ ] **Together:** Test - Command appears in palette, Ollama responds

**Days 4-6: Minimal Parser + Agent**
- [ ] **Kai:** Parse Kotlin NPE stacktrace (file, line, message)
- [ ] **Kai:** ReAct loop: 3 iterations, reasoning only (no tools yet)
- [ ] **Sokchea:** Connect parser to command handler
- [ ] **Together:** Test - Agent generates hypothesis for NPE

**Days 7-10: Add File Reading**
- [ ] **Kai:** Implement `read_file` tool
- [ ] **Kai:** Agent uses tool to read error location
- [ ] **Sokchea:** Display file content and agent reasoning in output
- [ ] **Together:** Test - Agent reads code and explains error

**Days 11-14: Real Testing**
- [ ] **Kai:** Test backend logic on 5 real Kotlin NPEs
- [ ] **Sokchea:** Refine output formatting (console or notification)
- [ ] **Together:** Test - At least 3/5 give useful root cause

### Test Criteria (End of Chunk 1 - All Sub-Chunks Complete)
```bash
# MVP Success Checklist
✅ Extension activates without errors
✅ Can analyze this exact error:
   "kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized"
✅ Agent uses read_file tool correctly
✅ Generates hypothesis mentioning "lateinit" and "initialization"
✅ Completes in <90s (even on CPU)
✅ Output includes: root cause, affected file, line number
✅ Works on at least 6/10 real errors from your projects (60%+ accuracy)
```

### Files Created (Chunk 1 - MVP)
```
src/
├── extension.ts                   # Minimal entry point
├── llm/
│   └── OllamaClient.ts           # Basic client
├── utils/
│   └── KotlinNPEParser.ts        # Just NPE parsing
├── agent/
│   └── MinimalReactAgent.ts      # 3-iteration loop
└── tools/
    └── ReadFileTool.ts           # File reading only

tests/
└── mvp.test.ts                   # Core functionality test
```

### Implementation: Minimal Extension

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { OllamaClient } from './llm/OllamaClient';
import { MinimalReactAgent } from './agent/MinimalReactAgent';
import { KotlinNPEParser } from './utils/KotlinNPEParser';

export function activate(context: vscode.ExtensionContext) {
  const analyzeCommand = vscode.commands.registerCommand(
    'rcaAgent.analyzeError',
    async () => {
      // Get error text from selection or input box
      const editor = vscode.window.activeTextEditor;
      const errorText = editor?.document.getText(editor.selection) || 
                       await vscode.window.showInputBox({ prompt: 'Paste error message' });
      
      if (!errorText) return;
      
      // Parse error
      const parser = new KotlinNPEParser();
      const parsedError = parser.parse(errorText);
      
      if (!parsedError) {
        vscode.window.showErrorMessage('Could not parse error');
        return;
      }
      
      // Analyze with agent
      const llm = await OllamaClient.create({ model: 'granite-code:8b' });
      const agent = new MinimalReactAgent(llm);
      
      vscode.window.showInformationMessage('Analyzing error...');
      const result = await agent.analyze(parsedError);
      
      // Show result in output channel
      const output = vscode.window.createOutputChannel('RCA Agent');
      output.appendLine('=== ROOT CAUSE ANALYSIS ===');
      output.appendLine(`\nError: ${result.error}`);
      output.appendLine(`\nRoot Cause:\n${result.rootCause}`);
      output.appendLine(`\nFix Guidelines:\n${result.fixGuidelines.join('\n')}`);
      output.show();
    }
  );
  
  context.subscriptions.push(analyzeCommand);
}
```

### Implementation: Minimal Agent

```typescript
// src/agent/MinimalReactAgent.ts
export class MinimalReactAgent {
  constructor(private llm: OllamaClient) {}
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    const context = {
      error: error.message,
      file: error.filePath,
      line: error.line,
    };
    
    let thought = '';
    let fileContent = '';
    
    // Iteration 1: Initial reasoning
    thought = await this.llm.generate(`
      You are debugging a Kotlin error. Analyze this:
      Error: ${context.error}
      File: ${context.file}
      Line: ${context.line}
      
      What is your initial hypothesis about the root cause?
    `);
    
    // Iteration 2: Read file
    fileContent = await this.readFile(context.file, context.line);
    
    // Iteration 3: Final analysis
    const rootCause = await this.llm.generate(`
      Error: ${context.error}
      Your hypothesis: ${thought}
      Code at error location:
      ${fileContent}
      
      Based on the actual code, what is the root cause? Provide:
      1. Root cause explanation
      2. Fix guidelines (bullet points)
      
      Format as JSON: { "rootCause": "...", "fixGuidelines": ["...", "..."] }
    `);
    
    const result = JSON.parse(rootCause);
    return {
      error: context.error,
      rootCause: result.rootCause,
      fixGuidelines: result.fixGuidelines,
    };
  }
  
  private async readFile(filePath: string, line: number): Promise<string> {
    // Simple file reading: 50 lines around error
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    const start = Math.max(0, line - 25);
    const end = Math.min(doc.lineCount, line + 25);
    return doc.getText(new vscode.Range(start, 0, end, 0));
  }
}
```

### Implementation: Minimal Parser

```typescript
// src/utils/KotlinNPEParser.ts
export interface ParsedError {
  message: string;
  filePath: string;
  line: number;
  type: 'npe' | 'lateinit';
}

export class KotlinNPEParser {
  parse(errorText: string): ParsedError | null {
    // Match: "kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized"
    // or: "NullPointerException at MyClass.kt:42"
    
    const lateinitMatch = errorText.match(/lateinit property (\w+) has not been initialized/);
    if (lateinitMatch) {
      const fileMatch = errorText.match(/at (.+\.kt):(\d+)/);
      return {
        message: errorText,
        filePath: fileMatch?.[1] || 'unknown',
        line: parseInt(fileMatch?.[2] || '0'),
        type: 'lateinit',
      };
    }
    
    const npeMatch = errorText.match(/NullPointerException.*at (.+\.kt):(\d+)/);
    if (npeMatch) {
      return {
        message: errorText,
        filePath: npeMatch[1],
        line: parseInt(npeMatch[2]),
        type: 'npe',
      };
    }
    
    return null;
  }
}
```

### What You're NOT Building Yet

- ❌ Vector database
- ❌ Multiple error types
- ❌ UI/Webview
- ❌ Educational mode
- ❌ Caching
- ❌ State persistence
- ❌ LSP integration
- ❌ Android-specific features (Compose, XML, Gradle)

### Lessons to Learn from MVP

After completing this chunk, you'll discover:
- Does the LLM reason well enough about Kotlin errors?
- Is 3 iterations enough or too few?
- What tools are actually essential?
- How accurate is root cause identification?
- Are your prompts effective?

**Decision Point:** If MVP doesn't work well, pivot before building more infrastructure!

---

## 🛠️ CHUNK 2: Core Tools & Validation (Week 3)

**Priority:** 🔥 HIGH - Expand MVP to handle more cases  
**Goal:** Work on 5+ error types with better tool support

---

### CHUNK 2.1: Full Error Parser (Days 1-3, ~24h)

**Goal:** Parse multiple Kotlin error types beyond NPE

**Kai (Backend - Implements Everything):**
- [ ] Full ErrorParser implementation (`ErrorParser.ts`)
  - [ ] Unresolved reference errors
  - [ ] Type mismatch errors
  - [ ] Compilation errors
- [ ] Language detector (`LanguageDetector.ts`)
- [ ] Gradle build error parser (`GradleParser.ts`)
- [ ] Unit tests for each error type (15+ test cases)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display error type badges (NPE, Lateinit, Build, etc.)
- [ ] Color-code different error types in output
- [ ] Wire new parser to command handler

**Deliverable:** Parser handles 5+ Kotlin error types correctly

**Development Timeline:**

**Day 1:**
- **Kai:** Extend parser with unresolved reference + type mismatch
- **Sokchea:** Add error type badges to UI

**Day 2:**
- **Kai:** Add Gradle build error parsing
- **Sokchea:** Add color coding for error types

**Day 3:**
- **Together:** Test with 15 diverse errors
- **Together:** Fix parsing edge cases

**Test:** Correctly identifies 5 different error types

---

### CHUNK 2.2: LSP Integration & Tool Registry (Days 4-5, ~16h)

**Goal:** Add LSP-powered tools for better code analysis

**Kai (Backend - Implements Everything):**
- [ ] Tool registry system (`ToolRegistry.ts`)
  - [ ] Tool registration API
  - [ ] Schema validation
- [ ] LSP tool implementation (`LSPTool.ts`)
  - [ ] Find function callers
  - [ ] Get symbol definitions
  - [ ] Search workspace symbols
- [ ] Integrate tools into agent workflow

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display tool execution status ("Finding callers...")
- [ ] Show tool results in output
- [ ] Format LSP results for readability

**Deliverable:** Agent uses LSP to find function relationships

**Development Timeline:**

**Day 4:**
- **Kai:** Implement tool registry and LSP tool
- **Sokchea:** Add tool execution status notifications

**Day 5:**
- **Together:** Test LSP tool on sample projects
- **Together:** Debug LSP integration issues

**Test:** Agent successfully finds callers for a function

---

### CHUNK 2.3: Prompt Engineering & Validation (Days 6-7, ~16h)

**Goal:** Improve analysis quality through better prompts

**Kai (Backend - Implements Everything):**
- [ ] Prompt engine (`PromptEngine.ts`)
  - [ ] System prompts with guidelines
  - [ ] Few-shot examples for each error type
  - [ ] Structured output formatting
- [ ] Test suite with 10+ real errors
- [ ] Measure accuracy metrics

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display accuracy metrics in output
- [ ] Show confidence scores
- [ ] Better formatting of agent reasoning

**Deliverable:** 70%+ accuracy on 10-error test suite

**Development Timeline:**

**Day 6:**
- **Kai:** Create prompt engine with few-shot examples
- **Sokchea:** Add confidence score display

**Day 7:**
- **Together:** Run test suite, measure accuracy
- **Together:** Iterate on prompts to improve results

**Test:** 7/10 errors analyzed correctly with useful root causes

### Test Criteria (End of Chunk 2)
```bash
# Expanded Coverage Checklist
✅ Handles: NPE, lateinit, unresolved reference, build errors, type mismatch
✅ LSP tool works for simple projects
✅ 7/10 test errors analyzed successfully
✅ Agent explains WHY error happened (not just WHAT)
✅ Completes in <60s on GPU
```

### Files Created (Chunk 2 - Expansion)
```
src/
├── utils/
│   ├── ErrorParser.ts            # Full parser
│   ├── LanguageDetector.ts       # Auto-detection
│   └── parsers/
│       ├── KotlinParser.ts       # All Kotlin errors
│       └── GradleParser.ts       # Build errors
├── tools/
│   ├── ToolRegistry.ts           # Organize tools
│   └── LSPTool.ts                # Call hierarchy
└── agent/
    └── PromptEngine.ts           # Better prompts

tests/
└── error-coverage.test.ts        # 10+ error types
```

### Implementation: Full Error Parser

```typescript
// src/utils/ErrorParser.ts
export class ErrorParser {
  private parsers = {
    kotlin: new KotlinParser(),
    gradle: new GradleParser(),
  };
  
  parse(errorText: string): ParsedError | null {
    const language = LanguageDetector.detect(errorText);
    const parser = this.parsers[language];
    return parser?.parse(errorText) || null;
  }
}

// src/utils/parsers/KotlinParser.ts
export class KotlinParser {
  parse(text: string): ParsedError | null {
    // Try each error pattern
    return (
      this.parseLateinit(text) ||
      this.parseNPE(text) ||
      this.parseUnresolvedReference(text) ||
      this.parseTypeMismatch(text) ||
      null
    );
  }
  
  private parseLateinit(text: string): ParsedError | null {
    // ... implementation
  }
  
  private parseUnresolvedReference(text: string): ParsedError | null {
    // Match: "Unresolved reference: functionName"
    const match = text.match(/Unresolved reference: (\w+)/);
    if (!match) return null;
    
    const fileMatch = text.match(/at (.+\.kt):(\d+)/);
    return {
      type: 'unresolved_reference',
      message: text,
      symbol: match[1],
      filePath: fileMatch?.[1] || 'unknown',
      line: parseInt(fileMatch?.[2] || '0'),
      language: 'kotlin',
    };
  }
}
```

### Implementation: LSP Tool

```typescript
// src/tools/LSPTool.ts
export class LSPTool {
  async findCallers(functionName: string, filePath: string): Promise<string[]> {
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    
    // Find function position
    const text = doc.getText();
    const funcRegex = new RegExp(`fun ${functionName}\\(`);
    const match = funcRegex.exec(text);
    if (!match) return [];
    
    const position = doc.positionAt(match.index);
    
    // Use VS Code LSP
    const calls = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>(
      'vscode.prepareCallHierarchy',
      uri,
      position
    );
    
    return calls?.map(c => c.name) || [];
  }
}
```

### Improved Prompts

```typescript
// src/agent/PromptEngine.ts
export class PromptEngine {
  getSystemPrompt(): string {
    return `You are an expert Kotlin debugging assistant.

WORKFLOW:
1. Form hypothesis about error cause
2. Use tools to gather evidence
3. Validate hypothesis with code
4. Provide root cause and fix

AVAILABLE TOOLS:
- read_file: Read code at error location
- find_callers: Find who calls a function

Always explain WHY the error happened, not just WHAT the error is.`;
  }
  
  getAnalysisPrompt(error: ParsedError, context: AnalysisContext): string {
    return `${this.getSystemPrompt()}

ERROR:
${error.message}
File: ${error.filePath}
Line: ${error.line}

${context.fileContent ? `CODE:\n${context.fileContent}\n` : ''}

${context.callers ? `CALLERS:\n${context.callers.join(', ')}\n` : ''}

Provide your analysis as JSON:
{
  "thought": "Your reasoning",
  "action": { "tool": "tool_name", "parameters": {...} } or null if done,
  "rootCause": "Explanation" (if done),
  "fixGuidelines": ["step 1", "step 2"] (if done)
}`;
  }
}
```

---

## 🗄️ CHUNK 3: Database & Learning (Weeks 4-5)

**Priority:** 🟡 MEDIUM - Add memory/learning capability  
**Goal:** Vector DB learns from solved errors

---

### CHUNK 3.1: ChromaDB Setup & Integration (Days 1-3, ~24h)

**Goal:** Get ChromaDB running and storing RCAs

**Kai (Backend - Implements Everything):**
- [ ] ChromaDB client (`ChromaDBClient.ts`)
  - [ ] Connection to local ChromaDB server
  - [ ] Collection initialization
  - [ ] Add document method
  - [ ] Error handling
- [ ] RCA schema definition (`rca-collection.ts`)
- [ ] Integration tests

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Docker setup guide for ChromaDB (documentation)
- [ ] Display "Storing result..." notification
- [ ] Show storage success/failure messages

**Deliverable:** ChromaDB stores RCA documents successfully

**Development Timeline:**

**Day 1:**
- **Together:** Set up ChromaDB via Docker
- **Kai:** Create ChromaDB client skeleton

**Day 2:**
- **Kai:** Implement add document method
- **Sokchea:** Add storage notifications

**Day 3:**
- **Together:** Test storing 5 RCA documents
- **Together:** Verify data persists after restart

**Test:** 5 RCAs stored and retrievable from DB

---

### CHUNK 3.2: Embedding & Similarity Search (Days 4-6, ~24h)

**Goal:** Search vector DB for similar past errors

**Kai (Backend - Implements Everything):**
- [ ] Local embedding service (`EmbeddingService.ts`)
  - [ ] Load sentence transformer model
  - [ ] Generate embeddings for errors
  - [ ] Batch processing
- [ ] Similarity search implementation
  - [ ] Query by error message
  - [ ] Filter by language/error type
  - [ ] Rank by relevance
- [ ] Quality scorer (`QualityScorer.ts`)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display "Searching past solutions..." status
- [ ] Show similar errors found in output
- [ ] Format similarity scores for user

**Deliverable:** Search returns relevant past RCAs

**Development Timeline:**

**Day 4:**
- **Kai:** Implement embedding service
- **Sokchea:** Add search status notifications

**Day 5:**
- **Kai:** Implement similarity search with filtering
- **Sokchea:** Format search results for display

**Day 6:**
- **Together:** Test search with 10 stored RCAs
- **Together:** Tune similarity thresholds

**Test:** Search for "NullPointerException" returns relevant past solutions

---

### CHUNK 3.3: Caching & Deduplication (Days 7-9, ~24h)

**Goal:** Speed up analysis for repeat errors

**Kai (Backend - Implements Everything):**
- [ ] Error hasher (`ErrorHasher.ts`)
  - [ ] SHA-256 signature generation
  - [ ] Normalize error messages
- [ ] RCA cache (`RCACache.ts`)
  - [ ] In-memory cache with TTL
  - [ ] Cache hit/miss tracking
  - [ ] Invalidation on feedback
- [ ] Performance metrics

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Display "Cache hit" notification
- [ ] Show cache statistics (optional)
- [ ] Faster response feedback

**Deliverable:** Repeat errors return in <5s

**Development Timeline:**

**Day 7:**
- **Kai:** Implement error hashing
- **Sokchea:** Add cache hit notifications

**Day 8:**
- **Kai:** Implement cache with TTL
- **Sokchea:** Test cache behavior in UI

**Day 9:**
- **Together:** Measure cache hit rates
- **Together:** Tune cache TTL and size

**Test:** Identical error returns cached result in <5s

---

### CHUNK 3.4: User Feedback System (Days 10-12, ~24h)

**Goal:** Learn from user validation of RCAs

**Kai (Backend - Implements Everything):**
- [ ] Feedback handler (`FeedbackHandler.ts`)
  - [ ] Process thumbs up/down
  - [ ] Update confidence scores
  - [ ] Re-embed with new scores
- [ ] Quality management
  - [ ] Auto-prune low-quality RCAs
  - [ ] Expiration policy (6 months)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] "Helpful?" buttons (👍/👎) in output
- [ ] Thank you message on feedback
- [ ] Optional comment box
- [ ] Wire buttons to Kai's feedback handler

**Deliverable:** User feedback improves future results

**Development Timeline:**

**Day 10:**
- **Sokchea:** Add feedback buttons to output
- **Kai:** Create feedback handler

**Day 11:**
- **Kai:** Implement confidence score updates
- **Sokchea:** Wire buttons to handler

**Day 12:**
- **Together:** Test feedback loop
- **Together:** Verify scores update correctly

**Test:** Positive feedback increases confidence, negative invalidates cache

### Test Criteria (End of Chunk 3)
```bash
# Learning System Checklist
✅ Store 10 RCAs in vector DB
✅ Query "NullPointerException" returns relevant past solutions
✅ Repeat identical error: <5s (cache hit)
✅ Positive feedback increases confidence score
✅ Low-quality RCAs (confidence <0.5) not returned in search
```

### Files Created (Chunk 3 - Database)
```
src/
├── db/
│   ├── ChromaDBClient.ts         # Vector DB client
│   ├── EmbeddingService.ts       # Local embeddings
│   ├── QualityScorer.ts          # Auto-scoring
│   └── schemas/
│       └── rca-collection.ts     # Schema definition
├── cache/
│   ├── RCACache.ts               # Deduplication
│   └── ErrorHasher.ts            # Signature hashing
└── agent/
    └── FeedbackHandler.ts        # User ratings

tests/integration/
└── database.test.ts              # DB operations
```

### Implementation: ChromaDB Integration

```typescript
// src/db/ChromaDBClient.ts
import { ChromaClient } from 'chromadb';
import { EmbeddingService } from './EmbeddingService';

export class ChromaDBClient {
  private client: ChromaClient;
  private embedder: EmbeddingService;
  
  static async create(): Promise<ChromaDBClient> {
    const instance = new ChromaDBClient();
    instance.client = new ChromaClient({ path: 'http://localhost:8000' });
    instance.embedder = await EmbeddingService.create();
    await instance.initCollection();
    return instance;
  }
  
  private async initCollection() {
    this.collection = await this.client.getOrCreateCollection({
      name: 'rca_solutions',
      metadata: { description: 'Root cause analysis solutions' },
    });
  }
  
  async addRCA(rca: RCADocument): Promise<string> {
    const embedding = await this.embedder.embed(
      `${rca.error_message} ${rca.root_cause}`
    );
    
    await this.collection.add({
      ids: [rca.id],
      embeddings: [embedding],
      metadatas: [{
        language: rca.language,
        error_type: rca.error_type,
        confidence: rca.confidence,
        created_at: rca.created_at,
      }],
      documents: [JSON.stringify(rca)],
    });
    
    return rca.id;
  }
  
  async searchSimilar(errorMessage: string, limit: number = 5): Promise<RCADocument[]> {
    const embedding = await this.embedder.embed(errorMessage);
    
    const results = await this.collection.query({
      queryEmbeddings: [embedding],
      nResults: limit,
      where: { confidence: { $gte: 0.5 } }, // Filter low quality
    });
    
    return results.documents[0].map(doc => JSON.parse(doc));
  }
}
```

### Implementation: Result Caching

```typescript
// src/cache/RCACache.ts
import * as crypto from 'crypto';

export class RCACache {
  private cache = new Map<string, { rca: RCADocument; expires: number }>();
  private TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  hash(error: ParsedError): string {
    const key = `${error.type}:${error.message}:${error.filePath}:${error.line}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }
  
  get(errorHash: string): RCADocument | null {
    const cached = this.cache.get(errorHash);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(errorHash);
      return null;
    }
    
    return cached.rca;
  }
  
  set(errorHash: string, rca: RCADocument): void {
    this.cache.set(errorHash, {
      rca,
      expires: Date.now() + this.TTL,
    });
  }
  
  invalidate(errorHash: string): void {
    this.cache.delete(errorHash);
  }
}
```

### Integration with Agent

```typescript
// Update MinimalReactAgent to use DB
export class ReactAgent {
  constructor(
    private llm: OllamaClient,
    private db: ChromaDBClient,
    private cache: RCACache
  ) {}
  
  async analyze(error: ParsedError): Promise<RCADocument> {
    // 1. Check cache first
    const errorHash = this.cache.hash(error);
    const cached = this.cache.get(errorHash);
    if (cached) {
      console.log('Cache hit!');
      return cached;
    }
    
    // 2. Search vector DB for similar errors
    const similar = await this.db.searchSimilar(error.message, 3);
    
    // 3. Run analysis (with similar solutions as context)
    const rca = await this.runAnalysis(error, similar);
    
    // 4. Store result
    await this.db.addRCA(rca);
    this.cache.set(errorHash, rca);
    
    return rca;
  }
}
```

---

## 📱 CHUNK 4: Android Full Coverage (Weeks 6-8)

**Priority:** 🟡 MEDIUM - Complete Android support  
**Goal:** Handle all Android error types (Compose, XML, Gradle)

---

### CHUNK 4.1: Jetpack Compose Parser (Days 1-4, ~32h)

**Goal:** Parse and analyze Compose-specific errors

**Kai (Backend - Implements Everything):**
- [ ] Jetpack Compose parser (`JetpackComposeParser.ts`)
  - [ ] `remember` errors
  - [ ] `derivedStateOf` errors
  - [ ] Recomposition issues
  - [ ] `LaunchedEffect` errors
  - [ ] CompositionLocal errors
- [ ] Compose-specific prompts
- [ ] Unit tests (10+ Compose errors)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Compose error badge/icon
- [ ] Display recomposition hints
- [ ] Format Compose-specific output

**Deliverable:** Analyze 5+ Compose error types

**Development Timeline:**

**Days 1-2:**
- **Kai:** Implement remember and recomposition parsers
- **Sokchea:** Add Compose badge to UI

**Days 3-4:**
- **Kai:** Add LaunchedEffect and CompositionLocal parsers
- **Together:** Test with real Compose errors

**Test:** Correctly identifies and explains 5 Compose errors

---

### CHUNK 4.2: XML Layout Parser (Days 5-7, ~24h)

**Goal:** Handle XML layout inflation errors

**Kai (Backend - Implements Everything):**
- [ ] XML parser (`XMLParser.ts`)
  - [ ] Inflation errors
  - [ ] Missing view ID errors
  - [ ] Attribute errors (layout_width, etc.)
  - [ ] Namespace issues
- [ ] XML-specific prompts
- [ ] Unit tests (8+ XML errors)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] XML error badge
- [ ] Display XML code snippets
- [ ] Format XML attribute suggestions

**Deliverable:** Analyze 3+ XML layout error types

**Development Timeline:**

**Day 5:**
- **Kai:** Implement inflation and missing ID parsers
- **Sokchea:** Add XML badge and snippet display

**Days 6-7:**
- **Kai:** Add attribute and namespace parsers
- **Together:** Test with real XML errors

**Test:** Correctly identifies XML inflation and attribute errors

---

### CHUNK 4.3: Gradle Build Analyzer (Days 8-11, ~32h)

**Goal:** Analyze Gradle build errors and dependency conflicts

**Kai (Backend - Implements Everything):**
- [ ] Android build tool (`AndroidBuildTool.ts`)
  - [ ] Dependency conflict detection
  - [ ] Version mismatch analysis
  - [ ] Repository configuration errors
  - [ ] Plugin errors
- [ ] Gradle DSL parser (Groovy + Kotlin DSL)
- [ ] Dependency recommendation engine
- [ ] Unit tests (10+ Gradle errors)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Gradle error badge
- [ ] Display dependency conflicts clearly
- [ ] Format version recommendations
- [ ] Show Kai's build fix suggestions

**Deliverable:** Analyze 5+ Gradle build error types

**Development Timeline:**

**Days 8-9:**
- **Kai:** Implement dependency conflict detection
- **Sokchea:** Add conflict visualization

**Days 10-11:**
- **Kai:** Add version mismatch and plugin error parsers
- **Together:** Test with real Gradle errors

**Test:** Correctly identifies dependency conflicts and suggests fixes

---

### CHUNK 4.4: Manifest & Docs Integration (Days 12-15, ~32h)

**Goal:** Handle manifest errors and add Android documentation

**Kai (Backend - Implements Everything):**
- [ ] Manifest analyzer tool (`ManifestAnalyzerTool.ts`)
  - [ ] Merge conflict detection
  - [ ] Missing permission errors
  - [ ] Activity/Service declaration issues
- [ ] Android docs search (`AndroidDocsSearchTool.ts`)
  - [ ] Offline Android SDK docs
  - [ ] Jetpack library docs
  - [ ] Common API references
- [ ] Unit tests

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Manifest error badge
- [ ] Display Kai's docs search results
- [ ] Format permission suggestions
- [ ] Link to relevant documentation

**Deliverable:** Analyze manifest errors + search Android docs

**Development Timeline:**

**Days 12-13:**
- **Kai:** Implement manifest analyzer
- **Sokchea:** Add manifest error display

**Days 14-15:**
- **Kai:** Implement Android docs search tool
- **Together:** Test manifest + docs integration

**Test:** Identifies manifest merge conflicts and finds relevant docs

---

### CHUNK 4.5: Android Testing & Validation (Days 16-18, ~24h)

**Goal:** Comprehensive testing of all Android features

**Kai (Backend - Implements Everything):**
- [ ] Integration tests for all Android parsers
- [ ] Test suite with 20+ real Android errors
- [ ] Accuracy measurement
- [ ] Performance optimization

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Android error summary dashboard (optional)
- [ ] Test all UI components with real data
- [ ] Polish Android-specific UI elements

**Deliverable:** 70%+ accuracy on Android error test suite

**Development Timeline:**

**Days 16-17:**
- **Kai:** Run comprehensive test suite
- **Together:** Fix bugs and edge cases

**Day 18:**
- **Together:** Final validation and documentation
- **Together:** Measure accuracy metrics

**Test:** 14/20 Android errors analyzed successfully

### Test Criteria (End of Chunk 4)
```bash
# Full Android Support Checklist
✅ 5+ Compose errors: remember, derivedStateOf, LaunchedEffect
✅ 3+ XML errors: inflation, missing IDs, attribute errors
✅ 3+ Gradle errors: dependency conflicts, version mismatches
✅ 2+ Manifest errors: merge conflicts, missing permissions
✅ Android docs search returns SDK references
```

### Files Created (Chunk 4 - Android)
```
src/
├── utils/parsers/
│   ├── JetpackComposeParser.ts   # Compose errors
│   └── XMLParser.ts              # Layout errors
├── tools/
│   ├── AndroidBuildTool.ts       # Gradle analysis
│   ├── AndroidDocsSearchTool.ts  # Offline docs
│   └── ManifestAnalyzerTool.ts   # Manifest issues
└── validators/
    └── AndroidFixValidator.ts    # Compile check

tests/integration/
└── android-coverage.test.ts      # All Android errors
```

### Implementation: Compose Parser

```typescript
// src/utils/parsers/JetpackComposeParser.ts
export class JetpackComposeParser {
  parse(text: string): ParsedError | null {
    return (
      this.parseRememberError(text) ||
      this.parseRecompositionError(text) ||
      this.parseLaunchedEffectError(text) ||
      null
    );
  }
  
  private parseRememberError(text: string): ParsedError | null {
    // Match: "reading a state in a composable function without calling remember"
    if (text.includes('reading a state') && text.includes('without calling remember')) {
      const fileMatch = text.match(/at (.+\.kt):(\d+)/);
      return {
        type: 'compose_remember',
        message: text,
        filePath: fileMatch?.[1] || 'unknown',
        line: parseInt(fileMatch?.[2] || '0'),
        language: 'kotlin',
        framework: 'compose',
      };
    }
    return null;
  }
  
  private parseRecompositionError(text: string): ParsedError | null {
    // Match excessive recomposition warnings
    if (text.includes('Recomposing') && text.includes('times')) {
      return {
        type: 'compose_recomposition',
        message: text,
        filePath: 'unknown', // Needs profiler trace
        line: 0,
        language: 'kotlin',
        framework: 'compose',
      };
    }
    return null;
  }
}
```

### Implementation: Gradle Analyzer

```typescript
// src/tools/AndroidBuildTool.ts
export class AndroidBuildTool {
  async analyzeDependencyConflict(buildError: string): Promise<ConflictAnalysis> {
    // Parse Gradle output for dependency conflicts
    const conflictMatch = buildError.match(
      /Conflict.*module '(.+)' versions? (.+) and (.+)/
    );
    
    if (conflictMatch) {
      const [_, module, version1, version2] = conflictMatch;
      return {
        module,
        conflictingVersions: [version1, version2],
        resolution: `Add explicit version in build.gradle:
implementation("${module}:${this.recommendVersion(version1, version2)}")`,
      };
    }
    
    return { module: 'unknown', conflictingVersions: [], resolution: '' };
  }
  
  private recommendVersion(v1: string, v2: string): string {
    // Simple: recommend higher version
    return v1 > v2 ? v1 : v2;
  }
}
```

---

## 🎨 CHUNK 5: Polish & Production (Weeks 9-12)

**Priority:** 🟢 POLISH - Make it production-ready  
**Goal:** UI, educational mode, testing, deployment

---

### CHUNK 5.1: Webview UI Foundation (Days 1-5, ~40h)

**Goal:** Replace text output with interactive webview UI

**Kai (Backend - Implements Everything):**
- [ ] Agent state streaming (`AgentStateStream.ts`)
  - [ ] Real-time iteration updates
  - [ ] Progress events
- [ ] Document synthesizer (`DocumentSynthesizer.ts`)
  - [ ] Markdown RCA reports
  - [ ] Code highlighting
  - [ ] Section organization

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Webview panel creation (`RCAWebview.ts`)
- [ ] HTML/CSS layout design
- [ ] Real-time progress display
  - [ ] Iteration counter
  - [ ] Current thought/action/observation
  - [ ] Progress bar
- [ ] Message passing (extension ↔ webview)
- [ ] Display Kai's synthesized reports

**Deliverable:** Interactive webview showing live analysis progress

**Development Timeline:**

**Days 1-2:**
- **Sokchea:** Create webview panel boilerplate
- **Kai:** Implement state streaming

**Days 3-4:**
- **Sokchea:** Design HTML/CSS layout, implement progress display
- **Kai:** Create document synthesizer

**Day 5:**
- **Together:** Wire streaming to webview
- **Together:** Test with live analysis

**Test:** Webview shows real-time iteration progress

---

### CHUNK 5.2: Educational Mode (Days 6-10, ~40h)

**Goal:** Add beginner-friendly learning explanations

**Kai (Backend - Implements Everything):**
- [ ] Educational agent (`EducationalAgent.ts`)
  - [ ] Generate learning notes
  - [ ] Explain error types
  - [ ] Explain root causes
  - [ ] Prevention tips
- [ ] Educational prompts
  - [ ] Beginner-friendly language
  - [ ] Analogies and examples
- [ ] Async explanation generation (optional)

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Educational mode toggle in UI
- [ ] "🎓 Learning Note" sections
- [ ] Display Kai's educational content
- [ ] Formatted tips and examples
- [ ] "Why This Error Happened" section

**Deliverable:** Educational mode generates learning content

**Development Timeline:**

**Days 6-7:**
- **Kai:** Implement educational agent logic
- **Sokchea:** Add educational mode toggle

**Days 8-9:**
- **Kai:** Create educational prompts and examples
- **Sokchea:** Design learning note UI sections

**Day 10:**
- **Together:** Test educational mode output quality
- **Together:** Refine explanations for clarity

**Test:** Educational mode provides clear, beginner-friendly explanations

---

### CHUNK 5.3: Performance Optimization (Days 11-14, ~32h)

**Goal:** Meet all performance targets

**Kai (Backend - Implements Everything):**
- [ ] Performance tracker (`PerformanceTracker.ts`)
  - [ ] Latency measurement per tool
  - [ ] Token usage tracking
  - [ ] Cache hit rate monitoring
- [ ] Optimization implementation
  - [ ] Parallel tool execution
  - [ ] Context window management
  - [ ] Query optimization
- [ ] Benchmarking suite

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] Performance metrics display (optional)
- [ ] Loading states optimization
- [ ] UI responsiveness improvements

**Deliverable:** <60s analysis time (standard mode, GPU)

**Development Timeline:**

**Days 11-12:**
- **Kai:** Implement performance tracking
- **Kai:** Add parallel tool execution

**Days 13-14:**
- **Kai:** Run benchmarks, optimize bottlenecks
- **Together:** Validate performance targets met

**Test:** Standard mode completes in <60s, Fast mode in <40s

---

### CHUNK 5.4: Testing & Quality Assurance (Days 15-19, ~40h)

**Goal:** Achieve 80%+ test coverage and high reliability

**Kai (Backend - Implements Everything):**
- [ ] Unit test completion (all modules)
- [ ] Integration tests (full workflows)
- [ ] Golden test suite (15+ reference RCAs)
- [ ] Edge case testing
- [ ] Error handling validation
- [ ] Performance regression tests

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] UI component tests
- [ ] Extension activation tests
- [ ] Webview rendering tests
- [ ] User interaction tests

**Deliverable:** 80%+ test coverage, all tests passing

**Development Timeline:**

**Days 15-16:**
- **Kai:** Write missing unit tests
- **Sokchea:** Write UI tests

**Days 17-18:**
- **Kai:** Create golden test suite
- **Together:** Run full test suite

**Day 19:**
- **Together:** Fix failing tests
- **Together:** Measure final coverage

**Test:** 80%+ coverage, 0 failing tests

---

### CHUNK 5.5: Documentation & Deployment (Days 20-24, ~40h)

**Goal:** Package extension and create comprehensive docs

**Kai (Backend - Implements Everything):**
- [ ] API documentation
- [ ] Code comments cleanup
- [ ] Architecture documentation
- [ ] Performance benchmarks documentation

**Sokchea (UI & Integration ONLY - No Implementation):**
- [ ] User guide (`README.md`)
- [ ] Educational mode guide (`EDUCATIONAL_MODE.md`)
- [ ] Installation instructions
- [ ] Screenshots and demo video
- [ ] Extension packaging (`.vsix`)
- [ ] VS Code marketplace listing (optional)
- [ ] Troubleshooting guide

**Deliverable:** Packaged extension ready for installation

**Development Timeline:**

**Days 20-21:**
- **Sokchea:** Write user guide and installation docs
- **Kai:** Write API documentation

**Days 22-23:**
- **Sokchea:** Create screenshots and demo video
- **Together:** Review all documentation

**Day 24:**
- **Sokchea:** Package extension (`.vsix`)
- **Together:** Test installation on clean VS Code
- **Together:** Final validation

**Test:** Extension installs successfully, all features work

### Test Criteria (End of Chunk 5)
```bash
# Production Ready Checklist
✅ UI shows iteration progress in real-time
✅ Educational mode generates beginner-friendly explanations
✅ All performance targets met (<60s standard)
✅ Golden test suite passes (15+ reference RCAs)
✅ CI pipeline green
✅ Extension installs successfully
✅ Documentation complete
```

### Files Created (Chunk 5 - Polish)
```
src/
├── ui/
│   ├── RCAWebview.ts             # Main UI
│   └── ProgressDisplay.ts        # Live updates
├── agent/
│   └── DocumentSynthesizer.ts    # Beautiful RCA reports
└── monitoring/
    └── PerformanceTracker.ts     # Metrics

tests/
├── golden/                       # Reference RCAs
├── performance/                  # Benchmarks
└── e2e/                         # Full workflows

docs/
├── README.md                     # User guide
└── EDUCATIONAL_MODE.md           # Learning guide
```

### Implementation: Webview UI

```typescript
// src/ui/RCAWebview.ts
export class RCAWebview {
  private panel: vscode.WebviewPanel;
  
  static create(): RCAWebview {
    const panel = vscode.window.createWebviewPanel(
      'rcaAgent',
      'RCA Agent',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );
    
    return new RCAWebview(panel);
  }
  
  updateProgress(state: AgentState) {
    this.panel.webview.postMessage({
      type: 'update',
      iteration: state.iteration,
      maxIterations: state.maxIterations,
      thought: state.thoughts[state.thoughts.length - 1],
      action: state.actions[state.actions.length - 1],
      observation: state.observations[state.observations.length - 1],
    });
  }
  
  showFinalRCA(rca: RCADocument) {
    const markdown = this.synthesizeMarkdown(rca);
    this.panel.webview.html = this.getHtmlContent(markdown);
  }
  
  private getHtmlContent(markdown: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; padding: 20px; }
    .iteration { border-left: 3px solid #007acc; padding-left: 10px; margin: 10px 0; }
    .thought { color: #333; }
    .action { color: #0066cc; }
    .observation { color: #666; background: #f5f5f5; padding: 5px; }
  </style>
</head>
<body>
  ${markdown}
  <script>
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'update') {
        // Update progress display
        document.getElementById('progress').innerHTML = 
          \`Iteration \${msg.iteration}/\${msg.maxIterations}\`;
      }
    });
  </script>
</body>
</html>`;
  }
}
```

### Implementation: Educational Mode

```typescript
// src/agent/EducationalAgent.ts
export class EducationalAgent extends ReactAgent {
  async analyze(error: ParsedError): Promise<RCADocument> {
    const rca = await super.analyze(error);
    
    // Add educational explanations
    rca.learningNotes = await this.generateLearningNotes(rca);
    
    return rca;
  }
  
  private async generateLearningNotes(rca: RCADocument): Promise<string[]> {
    const notes: string[] = [];
    
    // Explain the error type
    notes.push(await this.explainErrorType(rca.error_type));
    
    // Explain the root cause
    notes.push(await this.explainRootCause(rca.root_cause));
    
    // Explain how to prevent it
    notes.push(await this.explainPrevention(rca));
    
    return notes;
  }
  
  private async explainErrorType(errorType: string): Promise<string> {
    return await this.llm.generate(`
      Explain "${errorType}" error to a beginner Kotlin developer.
      Use simple language and analogies. Keep it under 100 words.
    `);
  }
}
```

---

## 📊 Development Milestones

Track your progress through each chunk:

- [ ] **Chunk 1 Complete:** MVP working (Week 2)
  - **Kai:** Backend analysis engine working
  - **Sokchea:** Extension activates and displays results
  - **Together:** Analyzes at least 1 Kotlin NPE end-to-end
  
- [ ] **Chunk 2 Complete:** Expanded coverage (Week 3)
  - **Kai:** All parsers and tools implemented
  - **Sokchea:** Tool results displayed properly
  - **Together:** Handles 5+ error types, 7/10 test errors successful
  
- [ ] **Chunk 3 Complete:** Learning system (Week 5)
  - **Kai:** ChromaDB storing and retrieving RCAs
  - **Sokchea:** User feedback UI working
  - **Together:** Cache hit: <5s, similarity search functional
  
- [ ] **Chunk 4 Complete:** Full Android (Week 8)
  - **Kai:** All Android parsers and tools working
  - **Sokchea:** Android-specific UI elements complete
  - **Together:** Compose/XML/Gradle errors analyzed correctly
  
- [ ] **Chunk 5 Complete:** Production (Week 12)
  - **Kai:** Backend optimized and tested
  - **Sokchea:** Full webview UI functional
  - **Together:** 80%+ test coverage, extension packaged and ready

---

## 🎯 Success Criteria

**Phase 1 Option B is complete when:**
- ✅ Can analyze 15+ different Kotlin/Android error types
- ✅ Handles all Android approaches (Kotlin+Compose, Java+XML, Gradle)
- ✅ Completes analysis in <60s on GPU
- ✅ Educational mode works
- ✅ Vector DB learns from errors
- ✅ UI shows live progress
- ✅ Extension packaged and installable
- ✅ You actually use it during development

---

## 🔄 Iteration Strategy

**After Chunk 1 MVP:**
- **Kai:** If LLM reasoning is weak → Improve prompts before continuing
- **Kai:** If 3 iterations insufficient → Increase to 5-8 iterations
- **Kai:** If parsing fails → Enhance error parser
- **Sokchea:** If UI display unclear → Improve output formatting
- **Together:** Review MVP with real errors, decide on improvements

**After Chunk 2:**
- **Kai:** If accuracy <70% → Focus on prompt engineering (Kai implements)
- **Kai:** If too slow → Add caching/optimize (Kai implements)
- **Kai:** If LSP issues → Use simpler code analysis (Kai implements)
- **Sokchea:** If UI feedback unclear → Improve display of Kai's results
- **Together:** Test on diverse error set, validate improvements

**After Chunk 3:**
- **Kai:** If vector search not helpful → Improve embedding strategy (Kai implements)
- **Kai:** If cache not effective → Adjust TTL or hash algorithm (Kai implements)
- **Sokchea:** If feedback buttons not working → Fix UI wiring to Kai's handler
- **Together:** Review learning effectiveness, tune quality scoring

**Key Principle:** Don't move to next chunk until current chunk delivers value!

### 🤝 Collaboration Points

**Daily Sync (15 min):**
- Kai shares what functions/APIs are ready
- Sokchea shares what UI components need backend data
- Coordinate interface contracts (function signatures, data formats)
- Plan integration points for the day

**Integration Days (End of each week):**
- **Kai demos:** Backend functionality (functions, APIs, data)
- **Sokchea demos:** UI wireframes and VS Code extension shell
- **Together:** Wire Sokchea's UI to Kai's backend
- Fix any interface mismatches

**Code Reviews:**
- Kai reviews Sokchea's integration/wiring code
- Sokchea reviews Kai's API contracts (to understand how to call them)
- Both review tests together

**Clear Division:**
- **Kai = ALL implementation** (parsers, agents, tools, database, algorithms)
- **Sokchea = ONLY UI + wiring** (displays, buttons, extension API, calling Kai's functions)

---

[← Back to Phase 1 Overview](Phase1-Foundation-Kotlin-Android.md) | [Compare with Option A →](Phase1-OptionA-Traditional.md)
>>>>>>> 8c58113224bbf7a87a7715a24cf9d7750b167135
