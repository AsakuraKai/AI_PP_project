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
# Project Structure - RCA Agent

> **Auto-generated snapshot of project file tree**  
> **Project Type:** Personal learning project - Kotlin/Android debugging assistant  
> **Last Updated:** December 18, 2025 (Week 1 Extended - Chunks 1.1-1.4 Complete - 71/71 tests passing)  
> **Next Update:** After Chunk 1.5 (MVP Testing & Refinement)

---

## Current Structure (Week 1 Extended - Chunks 1.1-1.4 Complete)

```
rca-agent/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance document (comprehensive roadmap)
├── docs/
│   ├── README.md                  # Main roadmap: 12-week production-ready plan
│   ├── DEVLOG.md                  # Central development journal (weekly updates) [UPDATED]
│   ├── PROJECT_STRUCTURE.md       # This file - project tree snapshot [UPDATED]
│   ├── API_CONTRACTS.md           # Tool interface specifications (JSON schemas)
│   ├── traceability.md            # Requirements → Code → Tests mapping [TO UPDATE]
│   ├── metrics.md                 # Performance & quality metrics dashboard [TO UPDATE]
│   ├── architecture/
│   │   ├── decisions/             # Architecture Decision Records (ADRs)
│   │   │   ├── README.md          # ADR index and guidelines
│   │   │   └── ADR-TEMPLATE.md    # Template for new ADRs
│   │   └── diagrams/              # System design diagrams (to be created)
│   ├── milestones/                # Milestone completion summaries
│   │   └── Chunk-1.1-1.3-COMPLETE.md  # First milestone [EXISTING]
│   └── phases/                    # Phase-specific roadmaps
│       └── Phase1-OptionB-MVP-First-KAI.md  # Kai's implementation guide
├── src/
│   ├── types.ts                   # Core type definitions (9 interfaces, 4 error classes) [UPDATED]
│   ├── llm/
│   │   └── OllamaClient.ts        # Local LLM client with retry logic [EXISTING]
│   ├── utils/
│   │   └── KotlinNPEParser.ts     # Kotlin error parser (lateinit, NPE) [EXISTING]
│   ├── tools/
│   │   └── ReadFileTool.ts        # File reading with context extraction [NEW]
│   └── agent/
│       └── MinimalReactAgent.ts   # 3-iteration ReAct with file reading [UPDATED]
├── tests/
│   ├── unit/
│   │   ├── KotlinNPEParser.test.ts       # Parser unit tests (15 tests) [EXISTING]
│   │   ├── OllamaClient.test.ts          # LLM client tests (12 tests) [EXISTING]
│   │   ├── MinimalReactAgent.test.ts     # Agent tests (14 tests) [UPDATED]
│   │   └── ReadFileTool.test.ts          # File reading tests (21 tests) [NEW]
│   ├── integration/
│   │   └── e2e.test.ts                   # End-to-end workflow tests (7 tests) [NEW]
│   └── fixtures/
│       └── test-dataset.ts               # 10 real Kotlin error examples [NEW]
├── examples/
│   └── basic-usage.ts             # Usage examples with real error scenarios [EXISTING]
├── package.json                   # Dependencies & npm scripts [EXISTING]
├── tsconfig.json                  # TypeScript configuration (strict mode) [EXISTING]
├── jest.config.js                 # Jest test configuration (80% coverage) [EXISTING]
├── IMPLEMENTATION_README.md       # Implementation guide & setup instructions [EXISTING]
└── README.md                      # Project overview

**Status:** ✅ **Week 1 Extended - Chunks 1.1-1.4 Complete (Tool Infrastructure Implemented)**
```

**Key Changes (December 18, 2025 - Chunk 1.4):**
- ✅ Implemented ReadFileTool with context extraction (180 lines, 21 tests, 95% coverage)
- ✅ Integrated ReadFileTool into MinimalReactAgent workflow
- ✅ Extended AgentState type to track file content
- ✅ Created comprehensive end-to-end integration tests (332 lines, 7 scenarios)
- ✅ Created test dataset with 10 real Kotlin error examples (180 lines)
- ✅ All tests passing (71/71) with maintained coverage >85%
- 📝 Updated DEVLOG, PROJECT_STRUCTURE docs

**Lines of Code (Chunk 1.4 additions):**
- Source: ~690 lines (ReadFileTool + agent integration + type updates)
- Tests: ~760 lines (ReadFileTool tests + e2e tests + test dataset)
- **Added: ~1,450 lines**
- **Cumulative Total: ~3,250 lines**

**Test Coverage (Cumulative):**
- Overall: 88%+
- OllamaClient: 95% (12 tests)
- KotlinNPEParser: 94% (15 tests)
- MinimalReactAgent: 88% (14 tests)
- ReadFileTool: 95%+ (21 tests)
- Integration: 7 e2e tests
- **Total: 71 tests passing**

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
