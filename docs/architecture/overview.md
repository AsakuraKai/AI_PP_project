# System Architecture Overview

> **Last Updated:** December 20, 2025 (Chunk 5.5)  
> **Status:** Phase 1 Complete - Production Ready

---

## Executive Summary

The RCA Agent is a local-first AI debugging assistant that provides root cause analysis for Kotlin/Android errors. Built on a ReAct (Reasoning + Acting) agent paradigm, it combines LLM reasoning with code analysis tools, vector database storage, and continuous learning from user feedback.

**Key Features:**
- **Local-First:** Runs entirely on local hardware with Ollama (no API costs, complete privacy)
- **Unlimited Iterations:** No token limits or rate caps - agent can reason exhaustively
- **Continuous Learning:** Learns from your codebase via vector database and user feedback
- **Multi-Language:** Supports Kotlin, Gradle, Jetpack Compose, and XML
- **Real-Time Progress:** Event streaming for responsive UI updates
- **Educational Mode:** Beginner-friendly explanations alongside analysis

---

## System Components

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VS Code Extension (UI)                       │
│                         (Sokchea's Work)                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RCA Agent Backend (Kai's Work)                  │
│                                                                       │
│  ┌───────────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Error Parsers   │  │     Agent    │  │   Tool Registry    │   │
│  │                   │  │              │  │                    │   │
│  │ • KotlinParser    │  │ • MinimalReac│  │ • ReadFileTool     │   │
│  │ • GradleParser    │──▶   tAgent     │◀─│ • LSPTool          │   │
│  │ • ComposeParser   │  │ • Educational│  │ • AndroidBuildTool │   │
│  │ • XMLParser       │  │   Agent      │  │ • DocsSearchTool   │   │
│  │ • LanguageDetector│  │ • PromptEngin│  │ • ManifestTool     │   │
│  └───────────────────┘  │   e          │  └────────────────────┘   │
│                         │ • DocumentSyn│                            │
│  ┌───────────────────┐  │   thesizer   │  ┌────────────────────┐   │
│  │   Database Layer  │  │ • AgentState │  │   Monitoring       │   │
│  │                   │  │   Stream     │  │                    │   │
│  │ • ChromaDBClient  │◀─┘ • FeedbackHan│  │ • PerformanceTrack│   │
│  │ • EmbeddingServic │    │   dler      │  │   er               │   │
│  │   e               │    └──────────────┘  └────────────────────┘   │
│  │ • RCACache        │                                               │
│  │ • QualityManager  │                                               │
│  └───────────────────┘                                               │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   External Dependencies                        │  │
│  │                                                                 │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐      │  │
│  │  │   Ollama    │    │  ChromaDB   │    │  Filesystem  │      │  │
│  │  │ (Local LLM) │    │  (Vector DB)│    │  (Code)      │      │  │
│  │  └─────────────┘    └─────────────┘    └──────────────┘      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Descriptions

### 1. Error Parsers (Entry Point)

**Purpose:** Extract structured information from raw error messages

**Components:**
- `ErrorParser` - Main router with automatic language detection
- `KotlinParser` - 6 Kotlin error types (lateinit, NPE, type mismatch, etc.)
- `GradleParser` - 5 Gradle error types (conflicts, tasks, dependencies)
- `JetpackComposeParser` - 10 Compose error types (remember, recomposition, effects)
- `XMLParser` - 5 XML error types (inflation, resources, attributes)
- `LanguageDetector` - Automatic language/framework detection

**Input:** Raw error text (string)

**Output:** `ParsedError` object
```typescript
{
  type: 'lateinit',
  message: 'lateinit property user has not been initialized',
  filePath: 'MainActivity.kt',
  line: 45,
  language: 'kotlin',
  metadata: { propertyName: 'user' }
}
```

**Key Features:**
- Supports 26 error types across 4 languages
- Graceful degradation (returns null for unknown errors)
- Metadata extraction (property names, versions, symbols)
- 95%+ test coverage per parser

---

### 2. ReAct Agent (Core Analysis Engine)

**Purpose:** Perform root cause analysis using reasoning loops

**Components:**
- `MinimalReactAgent` - Core ReAct loop implementation
- `EducationalAgent` - Extended agent with learning content
- `PromptEngine` - Prompt generation with few-shot examples
- `AgentStateStream` - Real-time event streaming
- `DocumentSynthesizer` - Markdown report generation
- `FeedbackHandler` - User validation processing

**Workflow:**
1. **Initialize** - Read file context at error location
2. **Iterate** (up to 10 times):
   - **Thought:** Generate hypothesis using LLM
   - **Action:** Execute tool (read_file, find_callers, etc.)
   - **Observation:** Process tool result
   - **Decision:** Continue or conclude
3. **Synthesize** - Generate final RCA with confidence
4. **Stream** - Emit progress events for UI

**Input:** `ParsedError`

**Output:** `RCAResult`
```typescript
{
  error: 'lateinit property user has not been initialized',
  rootCause: 'Property accessed before initialization in onCreate()',
  fixGuidelines: [
    'Initialize user in onCreate() before accessing',
    'Or use ::user.isInitialized to check first'
  ],
  confidence: 0.9,
  iterations: 3,
  toolsUsed: ['read_file', 'find_callers']
}
```

**Key Features:**
- Dynamic iteration count (agent decides when to stop)
- Tool execution with graceful failure handling
- Real-time progress streaming
- Educational mode for beginners
- 88%+ test coverage

---

### 3. Tool Registry (Context Gathering)

**Purpose:** Provide analysis tools for agent execution

**Available Tools:**
1. **ReadFileTool** - Read source files with context window
2. **LSPTool** - Call hierarchy and symbol definitions (regex fallback for MVP)
3. **AndroidBuildTool** - Gradle error analysis and dependency resolution
4. **AndroidDocsSearchTool** - Android SDK documentation search
5. **ManifestAnalyzerTool** - AndroidManifest.xml error analysis

**Architecture:**
- Central `ToolRegistry` with Zod schema validation
- Plugin architecture (tools registered at runtime)
- Consistent error handling across tools
- Mock/real implementations for testing

**Tool Execution Flow:**
```
Agent → ToolRegistry.execute('read_file', params)
         ↓
      Validate params (Zod)
         ↓
      Execute ReadFileTool
         ↓
      Return result (or error)
         ↓
      Agent processes observation
```

**Key Features:**
- Type-safe parameter validation
- Graceful failure (tools return null on error)
- Extensible (new tools via registration)
- 95%+ test coverage

---

### 4. Database Layer (Persistence & Learning)

**Purpose:** Store RCA results, enable similarity search, provide fast caching

**Components:**
- `ChromaDBClient` - Vector database for semantic search
- `EmbeddingService` - Generate embeddings (mock TF-IDF for MVP)
- `RCACache` - In-memory hash-based cache with TTL
- `ErrorHasher` - Consistent error hashing
- `QualityManager` - Automated quality scoring and pruning
- `QualityScorer` - Quality calculation algorithm

**Data Flow:**
```
1. Error occurs → Hash error
2. Check RCACache (fast lookup)
   - Hit: Return cached result
   - Miss: Continue to step 3
3. Search ChromaDB for similar errors
   - Found: Return similar RCA + cache it
   - Not found: Continue to step 4
4. Run fresh analysis with Agent
5. Store result in ChromaDB
6. Cache result for future
```

**Key Features:**
- Two-level caching (memory + vector DB)
- Semantic similarity search
- Quality-based ranking
- Automatic pruning of low-quality RCAs
- 95%+ test coverage

---

### 5. Monitoring (Performance Tracking)

**Purpose:** Track performance metrics for optimization

**Components:**
- `PerformanceTracker` - Latency tracking with percentiles

**Tracked Metrics:**
- Total analysis time (p50, p90, p99)
- LLM inference time
- Tool execution time
- Prompt generation time
- Cache hit/miss rates

**Output Format:**
```
Performance Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Operation              Count    Mean      p50       p90       p99
────────────────────────────────────────────────────────────────
total_analysis         100      45.2s     42.1s     68.3s     89.1s
llm_inference          300      10.1s     9.8s      14.2s     18.7s
tool_read_file         150      2.3ms     2.1ms     3.5ms     5.2ms
prompt_generation      300      65ms      58ms      92ms      120ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Data Flow Diagrams

### 1. End-to-End Analysis Flow

```
┌─────────────┐
│ User copies │
│ error text  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ ErrorParser │──────────┐
└──────┬──────┘          │ Returns null
       │ ParsedError     │ (unknown error)
       ▼                 │
┌─────────────┐          │
│ ErrorHasher │          │
└──────┬──────┘          │
       │ hash            │
       ▼                 │
┌─────────────┐          │
│  RCACache   │          │
│   .get()    │          │
└──────┬──────┘          │
       │                 │
   Hit │   Miss          │
       │     │           │
       │     ▼           │
       │ ┌────────────┐  │
       │ │ ChromaDB   │  │
       │ │ .searchSim │  │
       │ └─────┬──────┘  │
       │   Found│NotFound│
       │       │   │     │
       │       │   ▼     │
       │       │ ┌────┐  │
       │       │ │Agent│ │
       │       │ │.anal│ │
       │       │ │yze()│ │
       │       │ └──┬─┘  │
       │       │    │    │
       │       │    ▼    │
       │       │ ┌────┐  │
       │       │ │Store│ │
       │       │ │in DB│ │
       │       │ └──┬─┘  │
       │       │    │    │
       │       └────┴────┘
       │            │
       │            ▼
       │      ┌──────────┐
       │      │  Cache   │
       │      │  result  │
       │      └────┬─────┘
       │           │
       └───────────┘
              │
              ▼
       ┌────────────┐
       │ Return to  │
       │   User     │
       └────────────┘
```

### 2. Agent Reasoning Loop (ReAct)

```
┌──────────────┐
│ Start analyze│
│ (ParsedError)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Read file at │
│ error line   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│  Iteration Loop (max 10 times)  │
│                                  │
│  ┌────────────────────────────┐ │
│  │ 1. THOUGHT                 │ │
│  │   - Generate hypothesis    │ │
│  │   - Use PromptEngine       │ │
│  │   - Include prior context  │ │
│  └───────────┬────────────────┘ │
│              │                   │
│              ▼                   │
│  ┌────────────────────────────┐ │
│  │ 2. ACTION (optional)       │ │
│  │   - Select tool            │ │
│  │   - Execute via Registry   │ │
│  │   - Handle errors          │ │
│  └───────────┬────────────────┘ │
│              │                   │
│              ▼                   │
│  ┌────────────────────────────┐ │
│  │ 3. OBSERVATION             │ │
│  │   - Process tool result    │ │
│  │   - Update state           │ │
│  │   - Emit events            │ │
│  └───────────┬────────────────┘ │
│              │                   │
│              ▼                   │
│  ┌────────────────────────────┐ │
│  │ 4. DECISION                │ │
│  │   - Continue iterating?    │ │
│  │   - Or conclude analysis?  │ │
│  └───────────┬────────────────┘ │
│              │                   │
│              ▼                   │
│         Done? No ────┐           │
│              │       │           │
│             Yes      └───────┐   │
│              │               │   │
└──────────────┼───────────────┼───┘
               │               │
               ▼               │
        ┌─────────────┐        │
        │  Synthesize │        │
        │  Final RCA  │        │
        └──────┬──────┘        │
               │               │
               ▼               │
        ┌─────────────┐        │
        │ Return RCA  │        │
        │   Result    │        │
        └─────────────┘        │
                               │
                               └──► Next Iteration
```

### 3. Tool Execution Flow

```
┌────────────┐
│   Agent    │
│  decides   │
│  to call   │
│    tool    │
└─────┬──────┘
      │
      ▼
┌───────────────────────────┐
│  ToolRegistry.execute()   │
│                           │
│  1. Validate params (Zod)│
│  2. Get registered tool  │
│  3. Call tool.execute()  │
└─────┬─────────────────────┘
      │
      ▼
┌───────────────────────────┐
│   Tool Implementation     │
│                           │
│   Example: ReadFileTool   │
│   - Check file exists     │
│   - Read with context     │
│   - Format output         │
└─────┬─────────────────────┘
      │
      ▼
┌───────────────────────────┐
│   Return Result           │
│                           │
│   Success: string/object  │
│   Failure: null or throw  │
└─────┬─────────────────────┘
      │
      ▼
┌───────────────────────────┐
│  Agent processes result   │
│  as "observation"         │
└───────────────────────────┘
```

---

## Technology Stack

### Core Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Runtime** | Node.js 18+ | Backend runtime |
| **Language** | TypeScript 5.x | Type-safe development |
| **Testing** | Jest 29.x | Unit & integration tests |
| **LLM** | Ollama (DeepSeek-R1) | Local inference |
| **Vector DB** | ChromaDB 0.4.x | Semantic search |
| **Validation** | Zod 3.22 | Schema validation |
| **Events** | Node EventEmitter | Agent state streaming |

### External Dependencies

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| Ollama | 11434 | LLM inference | Required |
| ChromaDB | 8000 | Vector storage | Required |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code quality |
| Prettier | Code formatting |
| ts-node | TypeScript execution |
| nodemon | Auto-restart on changes |

---

## Design Decisions

### 1. ReAct Paradigm

**Choice:** Implement ReAct (Reasoning + Acting) over simpler prompt-response

**Rationale:**
- Enables iterative reasoning (not limited to single LLM call)
- Agent can gather context via tools (files, definitions, docs)
- More accurate than zero-shot prompting
- Aligns with research on agent capabilities

**Trade-offs:**
- Slower than single-shot (45-60s vs 10-20s)
- More complex implementation
- Higher token usage

### 2. Local-First Architecture

**Choice:** Ollama (local) as primary LLM vs cloud APIs

**Rationale:**
- **No costs:** Unlimited inference at $0
- **Privacy:** Code never leaves machine
- **Unlimited iterations:** No rate limits
- **Offline support:** Works without internet

**Trade-offs:**
- Requires GPU (RTX 3060+) for good performance
- Slightly lower accuracy than GPT-4 (but acceptable)
- User must install Ollama

### 3. Vector Database (ChromaDB)

**Choice:** ChromaDB for similarity search vs simple keyword matching

**Rationale:**
- Semantic search (finds similar errors even with different wording)
- Enables continuous learning (leverages past analyses)
- Proven technology for RAG systems

**Trade-offs:**
- Requires Docker setup
- Adds deployment complexity
- Storage overhead (~1KB per RCA)

### 4. Two-Level Caching

**Choice:** In-memory cache + vector DB vs DB only

**Rationale:**
- **Fast path:** Memory cache returns in <1ms
- **Semantic path:** Vector DB for similar (but not identical) errors
- **Hit rate:** 60%+ for repeat errors in development

**Trade-offs:**
- Memory usage (~10MB for 10K cached entries)
- Cache invalidation complexity
- Two systems to maintain

### 5. Event Streaming

**Choice:** EventEmitter for real-time updates vs polling

**Rationale:**
- **Responsive UI:** Progress updates during long analyses
- **Better UX:** Users see agent thinking
- **Cancellable:** Can stop analysis mid-iteration

**Trade-offs:**
- More complex integration with UI
- Event ordering considerations
- Error propagation across streams

---

## Performance Characteristics

### Analysis Latency

**Target:** <60s for standard analysis (p50)

**Actual Performance (RTX 3070 Ti):**
- p50: 45-55s ✅
- p90: 65-80s ✅
- p99: 85-100s ✅

**Breakdown:**
- LLM inference: 60% (10-12s per iteration × 3-5 iterations)
- Tool execution: 20% (2-5s total)
- Prompt generation: 10% (50-80ms per iteration)
- Overhead: 10% (parsing, validation, etc.)

### Cache Performance

**Hit Rate:** 60-70% for repeat errors

**Latencies:**
- Memory cache hit: <1ms
- ChromaDB search: 20-50ms
- Fresh analysis: 45-60s

**Memory Usage:**
- Baseline: 50MB
- With 10K cached results: ~60MB
- With 100K ChromaDB entries: ~150MB

### Scalability

**Current Limits:**
- **Concurrent analyses:** 1 (single LLM instance)
- **Database size:** Tested up to 10K RCAs
- **Cache size:** No hard limit (TTL-based eviction)

**Scaling Strategy:**
- Horizontal: Multiple Ollama instances (load balancing)
- Vertical: Larger GPU for faster inference
- Database: ChromaDB scales to millions of vectors

---

## Security Considerations

### Threat Model

**In-Scope Threats:**
1. Malicious error text (prompt injection)
2. Path traversal in file reading
3. Resource exhaustion (infinite loops)
4. Sensitive data leakage

**Out-of-Scope:**
- Network attacks (local-only system)
- Ollama vulnerabilities (external dependency)
- OS-level security

### Mitigations

| Threat | Mitigation | Implementation |
|--------|------------|----------------|
| Prompt injection | Input sanitization | Remove `system:`, `ignore instructions`, etc. |
| Path traversal | Path validation | Check file is within workspace |
| Resource exhaustion | Timeouts | 90s analysis timeout, max 10 iterations |
| Data leakage | Local processing | No data sent to external services |
| LLM output validation | Schema validation | Zod validation for all outputs |

---

## Testing Strategy

### Test Pyramid

```
         /\
        /  \
       /E2E \ (7 golden tests)
      /──────\
     /  INT  \ (28 integration tests)
    /────────\
   /   UNIT   \ (834 unit tests)
  /────────────\
```

**Total Tests:** 869 passing / 878 total (99% pass rate)

### Coverage

| Module | Lines | Statements | Branches | Functions | Status |
|--------|-------|------------|----------|-----------|--------|
| Agent | 88% | 90% | 85% | 92% | ✅ |
| Parsers | 95% | 96% | 94% | 97% | ✅ |
| Tools | 95% | 96% | 93% | 96% | ✅ |
| Database | 95% | 96% | 94% | 97% | ✅ |
| **Overall** | **85%** | **87%** | **83%** | **89%** | ✅ |

### Test Types

1. **Unit Tests** (834) - Test individual functions/classes
2. **Integration Tests** (28) - Test component interactions
3. **Golden Tests** (7) - Regression testing with reference RCAs
4. **End-to-End Tests** (7) - Full workflow validation

---

## Deployment

### Prerequisites

**Hardware:**
- CPU: 4+ cores (Ryzen 5 5600x or better)
- RAM: 16GB minimum, 32GB recommended
- GPU: RTX 3060+ (8GB+ VRAM) for best performance
- Storage: 10GB for model + 5GB for data

**Software:**
- Windows 10/11, macOS 11+, or Linux
- Node.js 18+
- Docker Desktop (for ChromaDB)
- Ollama installed and running

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd rca-agent

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Start Ollama
ollama serve

# 5. Download model
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# 6. Start ChromaDB
docker-compose up -d chroma

# 7. Run tests
npm test
```

### Configuration

```typescript
// config.ts
export const config = {
  llm: {
    host: 'http://localhost:11434',
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    timeout: 90000
  },
  database: {
    host: 'localhost',
    port: 8000,
    collection: 'rca_solutions'
  },
  cache: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 10000
  },
  agent: {
    maxIterations: 10,
    timeout: 90000
  }
};
```

---

## Future Enhancements

### Phase 2: Additional Languages
- TypeScript/JavaScript support
- React error parsing
- Node.js error handling

### Phase 3: Python Support
- Python error parsing
- Django/Flask frameworks
- Jupyter notebook integration

### Phase 4: Advanced Features
- Fine-tuned models per language
- Multi-file refactoring suggestions
- Security vulnerability detection
- Performance optimization hints

### Phase 5: Team Features
- Shared RCA database (team learning)
- Analytics dashboard
- Custom rule definitions
- Integration with issue trackers

---

## Related Documentation

- [Agent API Reference](../api/Agent.md)
- [Parser API Reference](../api/Parsers.md)
- [Tool API Reference](../api/Tools.md)
- [Database API Reference](../api/Database.md)
- [Agent Workflow Details](./agent-workflow.md)
- [Performance Benchmarks](../performance/benchmarks.md)
