<<<<<<< HEAD
=======
<<<<<<< HEAD
# Project Structure - RCA Agent

> **Auto-generated snapshot of project file tree**  
> **Project Type:** Personal learning project - Kotlin/Android debugging assistant  
> **Last Updated:** December 15, 2025 (Planning Phase Complete)  
> **Next Update:** After Milestone 1.1 (Extension Setup)

---

## Current Structure (Planning Phase Complete)

```
rca-agent/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance document (comprehensive roadmap)
├── docs/
│   ├── README.md                  # Main roadmap: 12-week production-ready plan
│   ├── DEVLOG.md                  # Central development journal (weekly updates)
│   ├── PROJECT_STRUCTURE.md       # This file - project tree snapshot
│   ├── API_CONTRACTS.md           # Tool interface specifications (JSON schemas)
│   ├── traceability.md            # Requirements → Code → Tests mapping
│   ├── metrics.md                 # Performance & quality metrics dashboard
│   ├── architecture/
│   │   ├── decisions/             # Architecture Decision Records (ADRs)
│   │   │   ├── README.md          # ADR index and guidelines
│   │   │   └── ADR-TEMPLATE.md    # Template for new ADRs
│   │   └── diagrams/              # System design diagrams (to be created)
│   └── milestones/                # Milestone completion summaries (to be created)
└── [Implementation files to be created starting Week 1]
```

**Documentation Status:** ✅ **Complete - Ready to Start Coding**

**Key Changes (December 15, 2025):**
- ✅ Simplified documentation to focus on Phase 1 (Kotlin/Android only)
- ✅ Created clear README.md with getting started guide
- ✅ Separated detailed roadmap into Roadmap.md
- ✅ Created traceability.md (requirements tracking)
- ✅ Created metrics.md (performance dashboard)
- ✅ Created architecture/decisions/ with ADR template
- ✅ Created milestones/ directory (ready for summaries)
- 📝 Clarified: This is a learning project, not research publication

---

## Target Structure (After Phase 1 Complete)

**Note:** Phase 1 focuses exclusively on Kotlin/Android support. Future phases (TypeScript, Python, etc.) will be added when ready - no fixed timeline.

```
rca-agent/
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       └── test.yml               # CI pipeline for automated testing
├── .vscode/
│   ├── launch.json                # Debug configurations
│   └── tasks.json                 # Build tasks
├── docs/
│   ├── DEVLOG.md
│   ├── PROJECT_STRUCTURE.md
│   ├── API_CONTRACTS.md           # Tool input/output JSON schemas
│   └── architecture/
│       ├── diagrams/
│       │   └── system-architecture.png
│       └── decisions/
│           ├── 001-dual-llm-strategy.md
│           ├── 002-multi-language-support.md
│           └── 003-chromadb-selection.md
├── src/
│   ├── extension.ts               # Entry point - command registration
│   ├── db/
│   │   ├── ChromaDBClient.ts      # Vector database client
│   │   ├── EmbeddingService.ts    # Dual embedding (local + cloud)
│   │   └── schemas/
│   │       └── rca-collection.ts  # Collection schema definitions
│   ├── llm/
│   │   ├── LLMProvider.ts         # Abstract LLM interface
│   │   ├── OllamaClient.ts        # Local model client
│   │   ├── OpenAIClient.ts        # Cloud API client
│   │   └── ProviderFactory.ts     # Runtime provider selection
│   ├── tools/
│   │   ├── ToolRegistry.ts        # Central tool registration
│   │   ├── ToolBase.ts            # Base class for all tools
│   │   ├── ReadFileTool.ts        # Workspace file access
│   │   └── WebSearchTool.ts       # External knowledge retrieval
│   └── utils/
│       ├── ErrorParser.ts         # Multi-language error parsing
│       ├── LanguageDetector.ts    # Auto-detect file language
│       └── Logger.ts              # Structured logging
├── tests/
│   ├── unit/
│   │   ├── db/
│   │   │   └── ChromaDBClient.test.ts
│   │   ├── llm/
│   │   │   └── ProviderFactory.test.ts
│   │   └── tools/
│   │       └── ReadFileTool.test.ts
│   └── integration/
│       └── end-to-end-storage.test.ts
├── scripts/
│   └── generate-structure.ts      # Auto-update this file
├── docker-compose.yml             # ChromaDB local server
├── package.json                   # Extension manifest + dependencies
├── tsconfig.json                  # TypeScript configuration
├── .eslintrc.js                   # Linting rules
├── .prettierrc                    # Code formatting
├── goals.md
└── README.md
```

---

## Target Structure (After Phase 2 - Week 8)

```
rca-agent/
├── src/
│   ├── extension.ts
│   ├── agent/                     # NEW: Agent core logic
│   │   ├── ReactAgent.ts          # ReAct loop implementation
│   │   ├── AgentState.ts          # State management
│   │   ├── PromptEngine.ts        # System prompts + templates
│   │   ├── ToolExecutor.ts        # Tool execution wrapper
│   │   ├── DocumentSynthesizer.ts # Final RCA markdown generation
│   │   ├── types.ts               # Agent interfaces
│   │   └── prompts/
│   │       ├── system.ts          # Main system prompt
│   │       └── examples.ts        # Few-shot examples
│   ├── tools/                     # EXPANDED: Full toolset
│   │   ├── ToolRegistry.ts
│   │   ├── ReadFileTool.ts
│   │   ├── LSPTool.ts             # NEW: LSP integration
│   │   ├── VectorSearchTool.ts    # NEW: ChromaDB queries
│   │   ├── WebSearchTool.ts
│   │   └── GetUserErrorContext.ts # NEW: Error capture
│   ├── utils/
│   │   ├── ErrorParser.ts         # EXPANDED: 7+ languages
│   │   ├── parsers/               # NEW: Language-specific parsers
│   │   │   ├── TypeScriptParser.ts
│   │   │   ├── PythonParser.ts
│   │   │   ├── JavaParser.ts
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── tests/
│   ├── e2e/                       # NEW: End-to-end tests
│   │   ├── typescript-error.test.ts
│   │   ├── python-error.test.ts
│   │   └── java-error.test.ts
│   └── ...
└── ...
```

---

## Target Structure (After Phase 3 - Week 12 - Production)

```
rca-agent/
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── publish.yml            # NEW: Auto-publish to Marketplace
├── src/
│   ├── ui/                        # NEW: User interface
│   │   ├── RCAWebview.ts          # Webview panel controller
│   │   ├── webview/               # React UI components
│   │   │   ├── App.tsx
│   │   │   ├── ProgressView.tsx
│   │   │   └── RCAReport.tsx
│   │   └── assets/
│   │       ├── styles.css
│   │       └── icons/
│   ├── agent/
│   │   └── FeedbackHandler.ts     # NEW: User validation loop
│   └── ...
├── dist/                          # NEW: Compiled extension
├── media/                         # NEW: Marketplace assets
│   ├── icon.png
│   ├── screenshot-1.png
│   └── demo.gif
├── CONTRIBUTING.md                # NEW: Contribution guidelines
├── LICENSE                        # NEW: MIT License
└── ...
```

---

## File Count Tracking

| Phase | Week | Total Files | Source Files | Test Files | Doc Files |
|-------|------|-------------|--------------|------------|-----------|
| Planning | 0 | 4 | 0 | 0 | 4 |
| Phase 1 | 4 | ~30 | ~15 | ~10 | ~5 |
| Phase 2 | 8 | ~50 | ~30 | ~15 | ~5 |
| Phase 3 | 12 | ~70 | ~45 | ~20 | ~5 |

---

## Key Directories Explained

### `/src` - Source Code
- **`/agent`** - Core RCA logic (ReAct loop, prompts, state management)
- **`/db`** - Vector database integration (ChromaDB client, embeddings)
- **`/llm`** - LLM provider abstraction (Ollama, OpenAI, Anthropic, Gemini)
- **`/tools`** - Tool ecosystem (file access, LSP, web search, vector queries)
- **`/ui`** - User interface (Webview panel, React components)
- **`/utils`** - Shared utilities (error parsing, logging, language detection)

### `/tests` - Test Suites
- **`/unit`** - Per-function/class tests (fast, isolated)
- **`/integration`** - Cross-component tests (DB + Embeddings, Agent + Tools)
- **`/e2e`** - Full workflow tests (real errors → RCA generation)

### `/docs` - Documentation
- **`DEVLOG.md`** - Weekly progress journal (this is the single source of truth)
- **`PROJECT_STRUCTURE.md`** - This file (updated automatically)
- **`API_CONTRACTS.md`** - Tool input/output schemas
- **`/architecture`** - Design diagrams and ADRs

### `/scripts` - Automation
- **`generate-structure.ts`** - Auto-update this file from filesystem
- **`validate-contracts.ts`** - Verify tool schemas match implementation

---

## Auto-Generation Command

To update this file after creating new files:

```bash
npm run generate-structure
```

This script scans the project directory and regenerates the tree structure above.

---

**Last Updated:** December 14, 2025 (Week 0 - Planning Phase)  
**Next Update:** December 20, 2025 (End of Week 1)
=======
>>>>>>> 3d5430c42950b3f2c255ebcb00a41340af53baec
# Project Structure - RCA Agent

> **Auto-generated snapshot of project file tree**  
> **Project Type:** Personal learning project - Kotlin/Android debugging assistant  
**Last Updated:** December 2024 (Week 8 - Chunks 1.1-4.3 Complete - 654/654 tests passing)  
**Next Update:** After Chunk 4.4 (Manifest & Docs)

---

## Current Structure (Week 8 - Chunks 1.1-4.3 Complete)

```
rca-agent/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance document (comprehensive roadmap)
├── docs/
│   ├── Roadmap.md                 # Main roadmap with phase implementation guides [UPDATED]
│   ├── DEVLOG.md                  # Central development journal (weekly updates) [UPDATED]
│   ├── PROJECT_STRUCTURE.md       # This file - project tree snapshot [UPDATED]
│   ├── CHUNK-2-STATUS-REPORT.md   # Chunk 2 complete status report [EXISTING]
│   ├── API_CONTRACTS.md           # Tool interface specifications (JSON schemas) [UPDATED]
│   ├── traceability.md            # Requirements → Code → Tests mapping [UPDATED]
│   ├── metrics.md                 # Performance & quality metrics dashboard
│   ├── architecture/
│   │   ├── decisions/             # Architecture Decision Records (ADRs)
│   │   │   ├── README.md          # ADR index and guidelines
│   │   │   └── ADR-TEMPLATE.md    # Template for new ADRs
│   │   └── diagrams/              # System design diagrams (to be created)
│   ├── milestones/                # Milestone completion summaries
│   │   ├── Chunk-1.1-1.3-COMPLETE.md     # Chunk 1.1-1.3 milestone [EXISTING]
│   │   ├── Chunk-1.4-COMPLETE.md         # Chunk 1.4 milestone [EXISTING]
│   │   ├── Chunk-1.5-COMPLETE.md         # Chunk 1.5 milestone [EXISTING]
│   │   ├── Chunk-2.1-COMPLETE.md         # Chunk 2.1 milestone [EXISTING]
│   │   ├── Chunk-2.2-2.3-COMPLETE.md     # Chunk 2.2-2.3 milestone [EXISTING]
│   │   ├── Chunk-2.4-COMPLETE.md         # Chunk 2.4 milestone [EXISTING]
│   │   ├── Chunk-2-COMPLETE-Summary.md   # Chunk 2 summary [EXISTING]
│   │   ├── Chunk-3.1-COMPLETE.md         # Chunk 3.1 milestone [EXISTING]
│   │   ├── Chunk-3.2-COMPLETE.md         # Chunk 3.2 milestone [EXISTING]
│   │   ├── Chunk-3.3-COMPLETE.md         # Chunk 3.3 milestone [EXISTING]
│   │   ├── Chunk-3.4-COMPLETE.md         # Chunk 3.4 milestone [EXISTING]
│   │   ├── Chunk-4.1-COMPLETE.md         # Chunk 4.1 milestone [EXISTING]
│   │   └── Chunk-4.3-COMPLETE.md         # Chunk 4.3 milestone [NEW]
│   └── phases/                    # Phase-specific roadmaps
│       └── Phase1-OptionB-MVP-First-KAI.md  # Kai's implementation guide [UPDATED]
├── src/
│   ├── types.ts                   # Core type definitions (10 interfaces, 4 error classes) [EXISTING]
│   ├── cache/                     # Caching system
│   │   ├── ErrorHasher.ts         # SHA-256 hash generation (245 lines) [EXISTING]
│   │   └── RCACache.ts            # In-memory cache with TTL (380 lines) [EXISTING]
│   ├── db/
│   │   ├── ChromaDBClient.ts      # Vector database client (648 lines) [EXISTING]
│   │   ├── EmbeddingService.ts    # Ollama embedding generation (280 lines) [EXISTING]
│   │   ├── QualityScorer.ts       # Multi-factor quality scoring (270 lines) [EXISTING]
│   │   ├── QualityManager.ts      # Auto-prune & quality metrics (630 lines) [EXISTING]
│   │   └── schemas/
│   │       └── rca-collection.ts  # RCA document schemas & validation (227 lines) [EXISTING]
│   ├── llm/
│   │   └── OllamaClient.ts        # Local LLM client with retry logic [EXISTING]
│   ├── utils/
│   │   ├── ErrorParser.ts         # Multi-language error router [MODIFIED - Compose support]
│   │   ├── LanguageDetector.ts    # Language detection [MODIFIED - Compose detection]
│   │   ├── KotlinNPEParser.ts     # Kotlin error parser (lateinit, NPE) [EXISTING]
│   │   └── parsers/
│   │       ├── KotlinParser.ts    # 6 Kotlin error types [EXISTING]
│   │       ├── GradleParser.ts    # 5 Gradle error types [EXISTING]
│   │       └── JetpackComposeParser.ts  # 10 Compose error types (~500 lines) [EXISTING]
│   ├── tools/
│   │   ├── ReadFileTool.ts        # File reading with context extraction [EXISTING]
│   │   ├── ToolRegistry.ts        # Tool management with Zod validation [EXISTING]
│   │   ├── LSPTool.ts             # LSP placeholder implementation [EXISTING]
│   │   └── AndroidBuildTool.ts    # Gradle build analyzer with version resolution (~350 lines) [NEW]
│   └── agent/
│       ├── MinimalReactAgent.ts   # Fully integrated ReAct agent [EXISTING]
│       ├── PromptEngine.ts        # Advanced prompt generation [MODIFIED - Compose examples]
│       └── FeedbackHandler.ts     # User feedback processing (430 lines) [EXISTING]
├── tests/
│   ├── unit/
│   │   ├── JetpackComposeParser.test.ts  # Compose parser tests (49 tests) [EXISTING]
│   │   ├── AndroidBuildTool.test.ts      # Gradle build analyzer tests (26 tests) [NEW]
│   │   ├── FeedbackHandler.test.ts       # FeedbackHandler tests (38 tests) [EXISTING]
│   │   ├── QualityManager.test.ts        # QualityManager tests (38 tests) [EXISTING]
│   │   ├── ErrorHasher.test.ts           # ErrorHasher tests (51 tests) [EXISTING]
│   │   ├── RCACache.test.ts              # RCACache tests (40 tests) [EXISTING]
│   │   ├── ChromaDBClient.test.ts        # ChromaDB client tests (29 tests) [EXISTING]
│   │   ├── EmbeddingService.test.ts      # Embedding service tests (20 tests) [EXISTING]
│   │   ├── QualityScorer.test.ts         # Quality scorer tests (20 tests) [EXISTING]
│   │   ├── rca-collection.test.ts        # Schema tests (28 tests) [EXISTING]
│   │   ├── OllamaClient.test.ts          # LLM client tests (12 tests) [EXISTING]
│   │   ├── KotlinNPEParser.test.ts       # Parser unit tests (15 tests) [EXISTING]
│   │   ├── MinimalReactAgent.test.ts     # Agent tests (14 tests) [EXISTING]
│   │   ├── ReadFileTool.test.ts          # File reading tests (21 tests) [EXISTING]
│   │   ├── ErrorParser.test.ts           # Error parser tests (28 tests) [EXISTING]
│   │   ├── LanguageDetector.test.ts      # Language detection (33 tests) [EXISTING]
│   │   ├── KotlinParser.test.ts          # Kotlin parser (24 tests) [EXISTING]
│   │   ├── GradleParser.test.ts          # Gradle parser (24 tests) [EXISTING]
│   │   ├── ToolRegistry.test.ts          # Tool registry (64 tests) [EXISTING]
│   │   ├── LSPTool.test.ts               # LSP tool (24 tests) [EXISTING]
│   │   └── PromptEngine.test.ts          # Prompt engine (25 tests) [EXISTING]
│   ├── integration/
│   │   ├── e2e.test.ts                   # End-to-end workflow tests (7 tests) [EXISTING]
│   │   ├── accuracy.test.ts              # Accuracy validation (12 tests) [EXISTING]
│   │   ├── agent-tool-integration.test.ts # Agent integration (18 tests) [EXISTING]
│   │   └── e2e-chunk-2.4.test.ts         # Chunk 2.4 e2e (14 tests) [EXISTING]
│   └── fixtures/
│       └── test-dataset.ts               # 10 real Kotlin error examples [EXISTING]
├── scripts/
│   ├── run-accuracy-tests.ts      # Accuracy test runner [EXISTING]
│   ├── benchmark.ts               # Performance benchmarking [EXISTING]
│   └── README.md                  # Scripts documentation [EXISTING]
├── examples/
│   └── basic-usage.ts             # Usage examples with real error scenarios [EXISTING]
├── package.json                   # Dependencies & npm scripts [EXISTING]
├── tsconfig.json                  # TypeScript configuration (strict mode) [EXISTING]
├── jest.config.js                 # Jest test configuration (80% coverage) [EXISTING]
└── README.md                      # Quick start with links to docs/ [EXISTING]

**Status:** ✅ **Week 6 - Chunks 1.1-4.1 Complete (Android Backend In Progress)**
```

**Key Changes (December 2024 - Chunk 4.1):**
- ✅ Implemented JetpackComposeParser for 10 Compose error types (~500 lines, 49 tests)
- ✅ Added 6 Compose few-shot examples to PromptEngine
- ✅ Updated ErrorParser with Compose parser integration
- ✅ Updated LanguageDetector with Compose detection (priority over Kotlin)
- ✅ New src/utils/parsers/JetpackComposeParser.ts
- ✅ 49 new tests added (585/585 total passing)
- ✅ Zero regressions (all 536 existing tests passing)
- 📝 Updated all core documentation files
- 🎉 **Chunk 3 (Database Backend) Complete!**

**Previous Changes (December 2024 - Chunk 3.3):**
- ✅ Implemented ErrorHasher for SHA-256 hash generation (245 lines, 51 tests)
- ✅ Implemented RCACache with TTL management (380 lines, 40 tests)
- ✅ New src/cache/ directory for caching system
- ✅ 40 new tests added (369/369 total passing)

**Lines of Code (Chunk 3.3 additions):**
- Source: ~625 lines (ErrorHasher + RCACache)
- Tests: ~660 lines (ErrorHasher.test + RCACache.test)
- Documentation: ~600 lines (milestone + updates)
- **Added: ~1,885 lines**
- **Cumulative Total: ~11,749 lines (7,029 source/test + 4,720 docs)**

**Test Coverage (Cumulative):**
- Overall: 90%+
- Total Tests: 460 (100% passing)
- Pass Rate: 100%
- ErrorHasher: 95%+ (51 tests)
- RCACache: 95%+ (40 tests)
- ChromaDBClient: 95%+ (57 tests)
- RCA Schemas: 95%+ (28 tests)
- OllamaClient: 95% (12 tests)
- All Parsers: 95%+ (109 tests)
- All Tools: 95%+ (109 tests)
- PromptEngine: 95% (25 tests)
- Agent: 88% (14 tests)
- Integration: 51 tests (accuracy + e2e + agent-tool)
- **Build Time: ~17s**

---

## Target Structure (After Phase 1 Complete)

**Note:** Phase 1 focuses exclusively on Kotlin/Android support. Future phases (TypeScript, Python, etc.) will be added when ready - no fixed timeline.

```
rca-agent/
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       └── test.yml               # CI pipeline for automated testing
├── .vscode/
│   ├── launch.json                # Debug configurations
│   └── tasks.json                 # Build tasks
├── docs/
│   ├── DEVLOG.md
│   ├── PROJECT_STRUCTURE.md
│   ├── API_CONTRACTS.md           # Tool input/output JSON schemas
│   └── architecture/
│       ├── diagrams/
│       │   └── system-architecture.png
│       └── decisions/
│           ├── 001-dual-llm-strategy.md
│           ├── 002-multi-language-support.md
│           └── 003-chromadb-selection.md
├── src/
│   ├── extension.ts               # Entry point - command registration
│   ├── db/
│   │   ├── ChromaDBClient.ts      # Vector database client
│   │   ├── EmbeddingService.ts    # Dual embedding (local + cloud)
│   │   └── schemas/
│   │       └── rca-collection.ts  # Collection schema definitions
│   ├── llm/
│   │   ├── LLMProvider.ts         # Abstract LLM interface
│   │   ├── OllamaClient.ts        # Local model client
│   │   ├── OpenAIClient.ts        # Cloud API client
│   │   └── ProviderFactory.ts     # Runtime provider selection
│   ├── tools/
│   │   ├── ToolRegistry.ts        # Central tool registration
│   │   ├── ToolBase.ts            # Base class for all tools
│   │   ├── ReadFileTool.ts        # Workspace file access
│   │   └── WebSearchTool.ts       # External knowledge retrieval
│   └── utils/
│       ├── ErrorParser.ts         # Multi-language error parsing
│       ├── LanguageDetector.ts    # Auto-detect file language
│       └── Logger.ts              # Structured logging
├── tests/
│   ├── unit/
│   │   ├── db/
│   │   │   └── ChromaDBClient.test.ts
│   │   ├── llm/
│   │   │   └── ProviderFactory.test.ts
│   │   └── tools/
│   │       └── ReadFileTool.test.ts
│   └── integration/
│       └── end-to-end-storage.test.ts
├── scripts/
│   └── generate-structure.ts      # Auto-update this file
├── docker-compose.yml             # ChromaDB local server
├── package.json                   # Extension manifest + dependencies
├── tsconfig.json                  # TypeScript configuration
├── .eslintrc.js                   # Linting rules
├── .prettierrc                    # Code formatting
├── goals.md
└── README.md
```

---

## Target Structure (After Phase 2 - Week 8)

```
rca-agent/
├── src/
│   ├── extension.ts
│   ├── agent/                     # NEW: Agent core logic
│   │   ├── ReactAgent.ts          # ReAct loop implementation
│   │   ├── AgentState.ts          # State management
│   │   ├── PromptEngine.ts        # System prompts + templates
│   │   ├── ToolExecutor.ts        # Tool execution wrapper
│   │   ├── DocumentSynthesizer.ts # Final RCA markdown generation
│   │   ├── types.ts               # Agent interfaces
│   │   └── prompts/
│   │       ├── system.ts          # Main system prompt
│   │       └── examples.ts        # Few-shot examples
│   ├── tools/                     # EXPANDED: Full toolset
│   │   ├── ToolRegistry.ts
│   │   ├── ReadFileTool.ts
│   │   ├── LSPTool.ts             # NEW: LSP integration
│   │   ├── VectorSearchTool.ts    # NEW: ChromaDB queries
│   │   ├── WebSearchTool.ts
│   │   └── GetUserErrorContext.ts # NEW: Error capture
│   ├── utils/
│   │   ├── ErrorParser.ts         # EXPANDED: 7+ languages
│   │   ├── parsers/               # NEW: Language-specific parsers
│   │   │   ├── TypeScriptParser.ts
│   │   │   ├── PythonParser.ts
│   │   │   ├── JavaParser.ts
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── tests/
│   ├── e2e/                       # NEW: End-to-end tests
│   │   ├── typescript-error.test.ts
│   │   ├── python-error.test.ts
│   │   └── java-error.test.ts
│   └── ...
└── ...
```

---

## Target Structure (After Phase 3 - Week 12 - Production)

```
rca-agent/
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── publish.yml            # NEW: Auto-publish to Marketplace
├── src/
│   ├── ui/                        # NEW: User interface
│   │   ├── RCAWebview.ts          # Webview panel controller
│   │   ├── webview/               # React UI components
│   │   │   ├── App.tsx
│   │   │   ├── ProgressView.tsx
│   │   │   └── RCAReport.tsx
│   │   └── assets/
│   │       ├── styles.css
│   │       └── icons/
│   ├── agent/
│   │   └── FeedbackHandler.ts     # NEW: User validation loop
│   └── ...
├── dist/                          # NEW: Compiled extension
├── media/                         # NEW: Marketplace assets
│   ├── icon.png
│   ├── screenshot-1.png
│   └── demo.gif
├── CONTRIBUTING.md                # NEW: Contribution guidelines
├── LICENSE                        # NEW: MIT License
└── ...
```

---

## File Count Tracking

| Phase | Week | Total Files | Source Files | Test Files | Doc Files |
|-------|------|-------------|--------------|------------|-----------|
| Planning | 0 | 4 | 0 | 0 | 4 |
| Phase 1 | 4 | ~30 | ~15 | ~10 | ~5 |
| Phase 2 | 8 | ~50 | ~30 | ~15 | ~5 |
| Phase 3 | 12 | ~70 | ~45 | ~20 | ~5 |

---

## Key Directories Explained

### `/src` - Source Code
- **`/agent`** - Core RCA logic (ReAct loop, prompts, state management)
- **`/db`** - Vector database integration (ChromaDB client, embeddings)
- **`/llm`** - LLM provider abstraction (Ollama, OpenAI, Anthropic, Gemini)
- **`/tools`** - Tool ecosystem (file access, LSP, web search, vector queries)
- **`/ui`** - User interface (Webview panel, React components)
- **`/utils`** - Shared utilities (error parsing, logging, language detection)

### `/tests` - Test Suites
- **`/unit`** - Per-function/class tests (fast, isolated)
- **`/integration`** - Cross-component tests (DB + Embeddings, Agent + Tools)
- **`/e2e`** - Full workflow tests (real errors → RCA generation)

### `/docs` - Documentation
- **`DEVLOG.md`** - Weekly progress journal (this is the single source of truth)
- **`PROJECT_STRUCTURE.md`** - This file (updated automatically)
- **`API_CONTRACTS.md`** - Tool input/output schemas
- **`/architecture`** - Design diagrams and ADRs

### `/scripts` - Automation
- **`generate-structure.ts`** - Auto-update this file from filesystem
- **`validate-contracts.ts`** - Verify tool schemas match implementation

---

## Auto-Generation Command

To update this file after creating new files:

```bash
npm run generate-structure
```

This script scans the project directory and regenerates the tree structure above.

---

**Last Updated:** December 14, 2025 (Week 0 - Planning Phase)  
**Next Update:** December 20, 2025 (End of Week 1)
>>>>>>> 8c58113224bbf7a87a7715a24cf9d7750b167135
