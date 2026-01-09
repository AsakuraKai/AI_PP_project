# RCA Agent - Complete Project Structure

> **Comprehensive project file structure and statistics**  
> **Project Type:** Personal learning project - Kotlin/Android debugging assistant  
> **Last Updated:** January 9, 2026 (Consolidated Structure)  
> **Status:** Backend Complete - UI Removed - Ready for Fresh Implementation

---

## 📊 Project Statistics

**Last Generated:** January 9, 2026

### Overview
- **Total Files:** 1,861
- **Total Directories:** 286
- **Excluded:** docs/, node_modules/, .git/

### File Type Breakdown

| Extension | Count | Description |
|-----------|-------|-------------|
| `.map` | 516 | Source maps for debugging |
| `.ts` | 488 | TypeScript source files |
| `.json` | 374 | JSON configuration/data files |
| `.js` | 265 | JavaScript compiled/source files |
| `.properties` | 41 | Android/Gradle configuration |
| `.lock` | 32 | Dependency lock files |
| `.bin` | 26 | Binary data files |
| `.gradle` | 17 | Gradle build files |
| `.class` | 16 | Compiled Java classes |
| `.md` | 15 | Markdown documentation |
| `.html` | 14 | HTML files (coverage reports) |
| `.kt` | 14 | Kotlin source files |
| `.txt` | 6 | Text files |
| `.log` | 6 | Log files |
| `.svg` | 6 | SVG icon files |
| `.xml` | 3 | XML files |
| `.css` | 3 | CSS stylesheets |
| `.sqlite3` | 1 | SQLite database files |
| `.vsix` | 1 | VS Code extension package |

### Largest Directories by File Count

| Directory | Files | Purpose |
|-----------|-------|---------|
| **tests/tests/results/phase4** | 217 | Phase 4 test results |
| **scripts** | 138 | Build & test scripts |
| **dist/scripts** | 96 | Compiled scripts |
| **dist/src/agent** | 68 | Compiled agent system |
| **tests/results/chunk8** | 68 | Chunk 8 test results |
| **vscode-extension/out/src/agent** | 68 | Extension compiled agent |

---

## 📁 Current Structure (Production Ready - Backend Complete)

```
rca-agent/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance document
│
├── docs/                          # Documentation (excluded from structure)
│   ├── README.md                  # Main roadmap
│   ├── DEVLOG.md                  # Development journal
│   ├── PROJECT_STRUCTURE.md       # This file
│   ├── DEVELOPER_GUIDE.md         # Developer reference
│   ├── USER_GUIDE.md              # User guide
│   ├── LEARNINGS.md               # Project insights
│   ├── RCA_UI_WIRING_GUIDE.md     # UI implementation guide
│   ├── RCA_UI_REMOVAL_SUMMARY.md  # UI removal summary
│   ├── DOCS_INDEX.md              # Documentation index
│   ├── architecture/              # Architecture docs
│   ├── api/                       # API documentation
│   ├── performance/               # Performance metrics
│   ├── testing/                   # Testing docs
│   ├── data/                      # Test results data
│   └── _archive/                  # Historical documents
│
├── src/                           # Backend (Kai's Implementation) ✅
│   ├── types.ts                   # Core TypeScript interfaces
│   │
│   ├── agent/                     # LLM Agent System
│   │   ├── MinimalReactAgent.ts   # ReAct agent with tool execution
│   │   ├── MultiPassAgent.ts      # Multi-pass analysis workflow
│   │   ├── PromptEngine.ts        # Few-shot examples & prompts
│   │   ├── EducationalAgent.ts    # Educational debugging mode
│   │   ├── AgentStateStream.ts    # State streaming
│   │   ├── DocumentSynthesizer.ts # Final RCA markdown generation
│   │   ├── FeedbackHandler.ts     # User feedback processing
│   │   ├── FixGenerator.ts        # Code fix generation
│   │   ├── OutputValidator.ts     # Output validation
│   │   ├── QualityValidator.ts    # Quality validation
│   │   ├── ErrorClassifier.ts     # Error classification
│   │   ├── AdaptiveLearning.ts    # Adaptive learning
│   │   ├── LearningPipeline.ts    # Learning pipeline
│   │   └── ModelAdapter.ts        # Model adaptation
│   │
│   ├── cache/                     # Caching Layer
│   │   ├── ErrorHasher.ts         # Deterministic error hashing
│   │   └── RCACache.ts            # In-memory LRU cache
│   │
│   ├── db/                        # Database Integration
│   │   ├── ChromaDBClient.ts      # Vector database client
│   │   ├── EmbeddingService.ts    # Dual embedding (local + cloud)
│   │   ├── QualityManager.ts      # Quality score management
│   │   ├── QualityScorer.ts       # Confidence-based scoring
│   │   └── schemas/
│   │       └── rca-collection.ts  # Collection schema
│   │
│   ├── llm/                       # LLM Integration
│   │   └── OllamaClient.ts        # Local Ollama client
│   │
│   ├── knowledge/                 # Knowledge Base
│   │   ├── FewShotExampleService.ts    # Example management
│   │   ├── SemanticExampleService.ts   # Semantic search
│   │   └── few-shot-examples/     # 82 examples (JSON/TS)
│   │
│   ├── monitoring/                # Performance Monitoring
│   │   └── PerformanceTracker.ts  # Metrics tracking
│   │
│   ├── tools/                     # Agent Tools
│   │   ├── ReadFileTool.ts        # File reading with context
│   │   ├── LSPTool.ts             # Language Server Protocol
│   │   ├── AndroidBuildTool.ts    # Android build analysis
│   │   ├── AndroidDocsSearchTool.ts # Android docs search
│   │   ├── ManifestAnalyzerTool.ts # Manifest analysis
│   │   ├── DependencyGraphTool.ts # Dependency analysis
│   │   ├── HistoricalPatternTool.ts # Pattern matching
│   │   ├── SemanticCodeSearchTool.ts # Code search
│   │   ├── ToolRegistry.ts        # Tool management
│   │   └── shared-types.ts        # Tool type definitions
│   │
│   └── utils/                     # Utilities
│       ├── ErrorParser.ts         # Multi-language error router
│       ├── KotlinNPEParser.ts     # Kotlin NPE parser
│       ├── LanguageDetector.ts    # Language detection
│       ├── FileResolver.ts        # File path resolution
│       ├── DiffFormatter.ts       # Diff formatting
│       ├── PathUtils.ts           # Path utilities
│       └── parsers/               # Language-specific parsers
│           ├── BaseParser.ts      # Base parser class
│           ├── KotlinParser.ts    # Kotlin error patterns
│           ├── GradleParser.ts    # Gradle build errors
│           ├── JetpackComposeParser.ts # Compose errors
│           └── XMLParser.ts       # XML layout errors
│
├── vscode-extension/              # VS Code Extension ⚠️ UI REMOVED
│   ├── package.json               # Extension manifest (minimal)
│   ├── tsconfig.json              # TypeScript configuration
│   ├── README.md                  # Extension guide
│   │
│   ├── src/
│   │   ├── extension.ts           # Main extension (211 lines - minimal)
│   │   ├── types/                 # Extension types
│   │   │   └── index.ts           # Centralized type definitions
│   │   │
│   │   ├── services/              # Backend Services (✅ Preserved)
│   │   │   ├── AnalysisService.ts        # RCA analysis orchestration
│   │   │   ├── FixApplicationService.ts  # Code fix application
│   │   │   ├── NetworkTimeoutHandler.ts  # Ollama timeout handling
│   │   │   └── BaseService.ts            # Base service class
│   │   │
│   │   ├── chat/                  # Chat Participant (✅ Preserved)
│   │   │   ├── RCAChatParticipant.ts     # Chat integration
│   │   │   ├── ConversationalAgent.ts    # Conversational debugging
│   │   │   ├── GuidedDebuggingWorkflow.ts # Guided workflow
│   │   │   ├── ChatPromptEngine.ts       # Chat prompts
│   │   │   ├── ChatRequestRouter.ts      # Request routing
│   │   │   ├── ContextCollector.ts       # Context collection
│   │   │   └── ResponseStreamer.ts       # Response streaming
│   │   │
│   │   └── tools/                 # Extension Tools (✅ Preserved)
│   │       ├── ExecuteCommandTool.ts     # Command execution
│   │       ├── FileOperationTool.ts      # File operations
│   │       ├── GradleCommandHelper.ts    # Gradle helpers
│   │       ├── TerminalTool.ts           # Terminal integration
│   │       ├── WorkspaceSearchTool.ts    # Workspace search
│   │       ├── ToolRegistry.ts           # Tool registry
│   │       └── index.ts                  # Tool exports
│   │
│   ├── out/                       # Compiled extension output
│   │   └── (mirrors src/ structure)
│   │
│   └── resources/                 # Extension Resources
│       ├── animations.css
│       └── icons/                 # SVG icons
│
├── tests/                         # Test Suite (878 tests - 99% pass)
│   ├── unit/                      # Unit tests (28 files)
│   │   ├── agent/                 # Agent tests
│   │   ├── knowledge/             # Knowledge tests
│   │   ├── utils/                 # Utility tests
│   │   └── (26+ test files)      # Individual component tests
│   │
│   ├── integration/               # Integration tests
│   │   └── end-to-end-storage.test.ts
│   │
│   ├── fixtures/                  # Test fixtures
│   │   ├── test-dataset.ts        # 10 real error examples
│   │   └── performance-test-dataset.ts
│   │
│   ├── golden/                    # Golden test suite
│   │
│   ├── real-world/                # Real-world tests
│   │   └── Phase4TestSuite.ts     # Phase 4 test suite
│   │
│   └── results/                   # Test results
│       ├── chunk8/                # Chunk 8 results
│       ├── chunk9/                # Chunk 9 results
│       └── phase4/                # Phase 4 results (217 files)
│
├── scripts/                       # Automation Scripts (138 files)
│   ├── benchmark.ts               # Performance benchmarking
│   ├── run-accuracy-tests.ts      # Accuracy validation
│   ├── run-performance-tests.ts   # Performance tests
│   ├── phase4-test-runner.ts      # Phase 4 test runner
│   ├── populate-chromadb.ts       # ChromaDB population
│   ├── performance-comparison.ts  # Performance comparison
│   ├── validate-setup.ts          # Setup validation
│   ├── unified-batch-runner.ts    # Batch test runner
│   ├── merge-examples-to-json.ts  # Example merging
│   ├── README.md                  # Scripts documentation
│   │
│   ├── shared/                    # Shared test utilities
│   │   ├── test-harness.ts        # Test harness
│   │   ├── test-runner-core.ts    # Test runner core
│   │   └── test-types.ts          # Test types
│   │
│   ├── _deprecated_chunk1/        # Deprecated chunk tests
│   ├── _deprecated_chunk3/
│   └── _deprecated_mvp/
│
├── dist/                          # Compiled Output (mirrors src/)
│   ├── agent/
│   ├── cache/
│   ├── db/
│   ├── knowledge/
│   ├── llm/
│   ├── monitoring/
│   ├── scripts/                   # 96 compiled scripts
│   ├── src/                       # Legacy nested src
│   ├── tests/
│   ├── tools/
│   └── utils/
│
├── chroma/                        # ChromaDB Storage
│   ├── chroma.sqlite3
│   └── (vector index files)
│
├── coverage/                      # Test Coverage Reports
│   ├── lcov.info
│   ├── clover.xml
│   ├── coverage-final.json
│   └── lcov-report/               # HTML coverage report
│
├── examples/                      # Usage Examples
│   └── basic-usage.ts
│
├── ollama-models/                 # Ollama Model Configurations
│   └── android-debug-optimized.modelfile
│
├── test-results/                  # Test Result Archives
│   ├── test-iteration8-output.txt
│   ├── test-iteration9-no-examples.txt
│   ├── test-iteration10-minimal.txt
│   ├── test-iteration11-template.txt
│   └── archived/                  # Archived results by chunk
│
├── temp/                          # Temporary files
│
├── .vscode/                       # VS Code Workspace Settings
│   └── launch.json                # Debug configuration
│
├── .github/                       # GitHub Configuration
│   └── copilot-instructions.md
│
├── Configuration Files
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .gitignore                     # Git ignore rules
├── jest.config.js                 # Jest test configuration
├── tsconfig.json                  # Root TypeScript config
├── tsconfig.base.json             # Base TypeScript config
├── package.json                   # Root package manifest
├── package-lock.json              # Dependency lock
├── README.md                      # Project overview
└── start.py                       # Python startup script
```

---

## 🔑 Key Components Explained

### Backend Services (src/) - ✅ Complete

**Agent System:**
- **MinimalReactAgent** - Core ReAct reasoning loop with tool execution
- **MultiPassAgent** - Multi-pass analysis with hypotheses
- **PromptEngine** - Template-based prompting for small models
- **EducationalAgent** - Beginner-friendly explanations

**Knowledge Management:**
- **FewShotExampleService** - 82 curated examples
- **SemanticExampleService** - Vector-based example retrieval
- **ChromaDB** - Optional persistent storage

**Tools:**
- **ReadFileTool** - Code context extraction
- **LSPTool** - Language Server Protocol integration
- **AndroidBuildTool** - Gradle build analysis
- **ManifestAnalyzerTool** - Android manifest analysis

**Parsers:**
- **KotlinParser** - Kotlin error detection (15 patterns)
- **GradleParser** - Gradle build errors (8 patterns)
- **JetpackComposeParser** - Compose errors (12 patterns)
- **XMLParser** - XML layout errors (8 patterns)

### VS Code Extension - ⚠️ UI Removed, Backend Preserved

**Preserved Services:**
- **AnalysisService** - Orchestrates RCA analysis with backend
- **FixApplicationService** - Applies code fixes
- **Chat Participant** - @rca-agent conversational debugging
- **ConversationalAgent** - Multi-turn debugging workflows
- **Tool Integration** - Terminal, file operations, search

**Removed (See RCA_UI_WIRING_GUIDE.md for reimplementation):**
- Panel providers (webview, state management)
- Tree view providers (error queue, history)
- Integration providers (diagnostics, code actions, hover)
- Status bar, accessibility services
- All UI commands (40+ removed)

### Testing Infrastructure

**Test Coverage:**
- 878 total tests
- 869 passing (99% pass rate)
- 85%+ code coverage
- Performance validated (<60s p50, <75s p90)

**Test Types:**
- Unit tests (28 files) - Component isolation
- Integration tests - Cross-component validation
- Golden tests - Reference RCA cases
- Real-world tests - Phase 4 test suite (10 cases)
- Performance benchmarks

---

## 📊 File Size Overview

### Source Code Statistics

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| **Backend (src/)** | ~22 | ~4,480 | ✅ Complete |
| **VS Code Extension** | ~8 | ~800 | ⚠️ Minimal (UI removed) |
| **Tests** | ~29 | ~4,055 | ✅ 878 tests (99% pass) |
| **Scripts** | ~15 | ~600 | ✅ Complete |
| **Documentation** | ~17 | ~8,200 | ✅ Up to date |
| **Total** | **~91** | **~18,135** | ✅ Production ready |

---

## 🚀 Development Workflow

### Build Commands
```bash
# Install dependencies
npm install

# Build backend
npm run build

# Run tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Performance benchmarks
npm run benchmark

# Accuracy validation
npm run test:accuracy
```

### VS Code Extension Development
```bash
cd vscode-extension
npm install
npm run compile        # Compile to out/
npm run watch          # Watch mode
# Press F5 in VS Code to launch extension
```

### Statistics Generation
```bash
# Update project statistics
npx ts-node scripts/generate-file-structure-stats.ts
```

---

## 🎯 Integration Readiness

### Backend Status (✅ Production Ready)
- ✅ **Parsers:** 26+ error types, 100% accuracy
- ✅ **Agent:** MinimalReactAgent with ReAct reasoning
- ✅ **LLM Client:** Ollama integration tested
- ✅ **Knowledge Base:** 156 AGP + 52 Kotlin versions
- ✅ **Database:** ChromaDB optional integration
- ✅ **Caching:** RCACache with ErrorHasher
- ✅ **Performance:** All targets achieved
- ✅ **Testing:** 878 tests, 99% pass rate
- ✅ **Coverage:** 85%+ across all modules

### Extension Status (⚠️ Ready for Fresh UI)
- ✅ **Backend Services:** Fully functional
- ✅ **Chat Participant:** Working conversational debugging
- ✅ **Tool Integration:** Terminal, files, search operational
- ⚠️ **UI Components:** Removed - See RCA_UI_WIRING_GUIDE.md
- ⚠️ **Commands:** Minimal (4 conversational debugging commands)
- ⚠️ **Configuration:** Basic settings only

### Next Steps for UI Implementation
See [RCA_UI_WIRING_GUIDE.md](RCA_UI_WIRING_GUIDE.md) for complete implementation guide:
1. Panel UI - Webview with error queue and analysis display
2. Tree Views - Error queue, history, agent state
3. Integration - Diagnostics, code actions, hover tooltips
4. Commands - 40+ command handlers
5. Services - Theme, accessibility, performance monitoring

---

## 📝 Notes

**Current Status:** Backend production ready, UI removed for fresh implementation  
**Test Status:** 869/878 passing (99% pass rate), 85%+ coverage  
**Performance:** Validated at <60s p50, <75s p90 latency  
**Accuracy:** 100% on validation dataset  
**Error Coverage:** 26+ types across Kotlin, Gradle, Compose, XML

**Documentation:**
- See [DOCS_INDEX.md](DOCS_INDEX.md) for all documentation
- See [RCA_UI_WIRING_GUIDE.md](RCA_UI_WIRING_GUIDE.md) for UI implementation
- See [DEVLOG.md](DEVLOG.md) for development history
- See [LEARNINGS.md](LEARNINGS.md) for project insights

---

**Last Updated:** January 9, 2026  
**Status:** ✅ Backend Complete | ⚠️ UI Removed | 📘 Documentation Current  
**Next Milestone:** Fresh UI Implementation (Estimated 11-17 days)
│       │   ├── Chunk-4.1-4.2-COMPLETE.md         # Backend: Android (Compose, XML)
│       │   ├── Chunk-5.1-5.2-UI-COMPLETE.md      # UI: Webview Panel & Educational Mode (Week 13)
│       │   ├── Chunk-5.3-5.5-UI-COMPLETE.md      # UI: Performance, Polish, Documentation (Week 14) - NEW
│       │   └── ...more milestones
│       └── phases/                # Phase planning documents
│           ├── Phase1-OptionB-MVP-First-SOKCHEA.md  # Sokchea's UI roadmap
│           └── ...
├── vscode-extension/              # VS Code Extension (Sokchea's work) - UPDATED Week 14
│   ├── package.json               # Extension manifest with 4 commands & 3 configs - UPDATED
│   ├── tsconfig.json              # TypeScript configuration
│   ├── README.md                  # Comprehensive user guide (203 lines) - UPDATED
│   ├── EDUCATIONAL_MODE.md        # Educational mode guide (320 lines) - NEW
│   ├── QUICKSTART.md              # Quick setup instructions
│   └── src/
│       ├── extension.ts           # Main extension code (~2056 lines, +45 from Week 13)
│       │   # Chunks 1.1-5.5 Complete (ALL 19 CHUNKS - 100%):
│       │   # - Extension activation & command registration (4 commands)
│       │   # - User input handling with validation
│       │   # - Output channel display with formatting
│       │   # - Code context display with syntax highlighting
│       │   # - Confidence visualization (bar + interpretation)
│       │   # - Enhanced error handling (4 categories)
│       │   # - 43 error type badges (Kotlin, Gradle, Compose, XML, Manifest)
│       │   # - Tool execution feedback with progress updates
│       │   # - Tool usage display with icons
│       │   # - Accuracy metrics display (quality, latency, model)
│       │   # - Database storage notifications (Chunk 3.1)
│       │   # - Similar solutions display (Chunk 3.2)
│       │   # - Cache hit notifications with timestamps (Chunk 3.3)
│       │   # - User feedback system (👍/👎/Skip) (Chunk 3.4)
│       │   # - Compose error detection & tips (Chunk 4.1)
│       │   # - XML error detection & tips (Chunk 4.2)
│       │   # - Gradle conflict visualization (Chunk 4.3)
│       │   # - Manifest permission templates (Chunk 4.4)
│       │   # - Documentation integration (Chunk 4.4)
│       │   # - Complete Android framework support (Chunk 4.5)
│       │   # - Framework-specific documentation links
│       │   # - XML attribute suggestions
│       │   # - Webview analysis command (Chunk 5.1)
│       │   # - Educational mode toggle (Chunk 5.2)
│       │   # - Learning notes generation (Chunk 5.2)
│       │   # - Performance metrics toggle (NEW - Chunk 5.3)
│       │   # - Performance metrics generation (NEW - Chunk 5.3)
│       │   # - Ready for backend integration
│       │   # - PRODUCTION READY
│       └── ui/                    # UI Components
│           └── RCAWebview.ts      # Webview panel class (~1088 lines, +268 from Week 13)
│               # CHUNK 5.1-5.5 Features:
│               # - Interactive webview panel
│               # - Real-time progress updates
│               # - Agent iteration visualization
│               # - Comprehensive result display
│               # - Educational mode support
│               # - Performance metrics display (NEW - Chunk 5.3)
│               # - Skeleton loader (NEW - Chunk 5.4)
│               # - Enhanced error handling with retry (NEW - Chunk 5.4)
│               # - Full ARIA accessibility (NEW - Chunk 5.4)
│               # - Keyboard navigation (NEW - Chunk 5.4)
│               # - Screen reader support (NEW - Chunk 5.4)
│               # - Error state handling
│               # - Message passing
│               # - CSP-compliant security
│               # - VS Code theme integration
│               # - Resource disposal
│               # - PRODUCTION READY
├── src/                           # Backend (Kai's work)
│   ├── types.ts                   # Core TypeScript interfaces (230 lines)
│   ├── agent/                     # LLM Agent components
│   │   ├── MinimalReactAgent.ts   # ReAct agent with tool execution & performance tracking (~624 lines, +35) - 5.3
│   │   ├── AgentStateStream.ts    # EventEmitter for real-time UI updates (~220 lines) - Chunk 5.1
│   │   ├── DocumentSynthesizer.ts # Markdown RCA report generator (~320 lines) - Chunk 5.1
│   │   ├── EducationalAgent.ts    # Educational wrapper for beginner-friendly explanations (~335 lines) - 5.2
│   │   ├── FeedbackHandler.ts     # User feedback processing
│   │   └── PromptEngine.ts        # Few-shot examples & prompts
│   ├── cache/                     # Caching layer
│   │   ├── ErrorHasher.ts         # Deterministic error hashing
│   │   └── RCACache.ts            # In-memory LRU cache
│   ├── db/                        # ChromaDB integration
│   │   ├── ChromaDBClient.ts      # Vector database client
│   │   ├── EmbeddingService.ts    # Dual embedding (local + cloud)
│   │   ├── QualityManager.ts      # Quality score management
│   │   ├── QualityScorer.ts       # Confidence-based scoring
│   │   └── schemas/               # Collection schema definitions
│   ├── llm/                       # LLM clients
│   │   └── OllamaClient.ts        # Local Ollama client (291 lines)
│   ├── monitoring/                # Performance monitoring - NEW 5.3
│   │   └── PerformanceTracker.ts  # Metrics collection with percentiles (~243 lines) - NEW 5.3
│   ├── tools/                     # Agent tools
│   │   ├── ReadFileTool.ts        # File reading with context (180 lines)
│   │   ├── LSPTool.ts             # Language Server Protocol integration
│   │   └── ToolRegistry.ts        # Tool management & execution
│   └── utils/                     # Parsers & utilities
│       ├── ErrorParser.ts         # Multi-language error router
│       ├── KotlinNPEParser.ts     # Kotlin NPE parser (220 lines)
│       ├── LanguageDetector.ts    # Auto-detect language
│       └── parsers/               # Language-specific parsers
│           ├── KotlinParser.ts    # Kotlin error patterns (6 types)
│           ├── GradleParser.ts    # Gradle build errors (5 types)
│           ├── JetpackComposeParser.ts  # Compose errors (10 types)
│           └── XMLParser.ts       # XML layout errors (8 types)
├── tests/                         # Test suite
│   ├── fixtures/
│   │   └── test-dataset.ts        # 10 real Kotlin error examples
│   ├── golden/                    # Golden test suite - NEW 5.4
│   │   └── golden-suite.test.ts   # 7 reference RCA cases (~315 lines) - NEW 5.4
│   ├── integration/               # End-to-end tests
│   │   ├── accuracy.test.ts       # 10-test accuracy validation
│   │   └── e2e.test.ts            # Full workflow tests
│   └── unit/                      # Unit tests (869 tests passing of 878)
│       ├── OllamaClient.test.ts   # 12 tests
│       ├── KotlinNPEParser.test.ts # 15 tests
│       ├── MinimalReactAgent.test.ts # 14 tests
│       ├── ReadFileTool.test.ts   # 21 tests
│       ├── AgentStateStream.test.ts # 25 tests - Chunk 5.1
│       ├── DocumentSynthesizer.test.ts # 31 tests - Chunk 5.1
│       ├── EducationalAgent.test.ts # 24 tests - 5.2
│       ├── PerformanceTracker.test.ts # 20 tests - NEW 5.3
│       ├── DocumentSynthesizer.test.ts # 31 tests - Chunk 5.1
│       ├── EducationalAgent.test.ts # 24 tests - NEW 5.2
│       ├── XMLParser.test.ts      # 43 tests
│       └── ...more tests
├── scripts/                       # Testing & benchmarking
│   ├── run-accuracy-tests.ts      # Orchestrates accuracy testing
│   ├── benchmark.ts               # Performance benchmarking
│   └── README.md                  # Scripts documentation
├── examples/                      # Usage examples
│   └── basic-usage.ts             # Simple example
├── jest.config.js                 # Jest test configuration
├── tsconfig.json                  # Root TypeScript config
├── package.json                   # Dependencies & scripts
└── README.md                      # Project overview
```

**Documentation Status:** ✅ **Week 13 Complete - Performance & Testing Ready**

**Key Changes (December 20, 2025):**
- ✅ Completed Chunks 5.3-5.4 (Performance Optimization & Testing)
- ✅ Updated DEVLOG.md with Week 13 comprehensive entry
- ✅ Added PerformanceTracker with metrics collection (~243 lines)
- ✅ Integrated performance tracking into MinimalReactAgent (+35 lines)
- ✅ Created golden test suite with 7 reference RCA cases (~315 lines)
- ✅ Added 29 new tests (20 performance + 9 golden)
- ✅ Achieved all performance targets (p50 <60s, p90 <75s)
- ✅ 869/878 tests passing (99% pass rate, 85%+ coverage)
- ✅ Ready for documentation phase (Chunk 5.5)

---

## File Size Overview (Week 13)

### Source Code

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| **VS Code Extension** | 1 | ~600 | ✅ Chunks 1.1-2.2 Complete |
| **Backend (src/)** | ~22 | ~4,480 | ✅ Chunks 1.1-5.4 Complete |
| **Tests** | ~29 | ~4,055 | ✅ 869 tests passing (878 total) |
| **Scripts** | 3 | ~600 | ✅ Accuracy & benchmark |
| **Docs** | ~17 | ~8,200 | ✅ Updated Week 13 |
| **Total** | **~72** | **~17,935** | ✅ Performance & Testing Complete |

### Extension Breakdown (vscode-extension/src/extension.ts)

| Section | Lines | Description |
|---------|-------|-------------|
| **Interfaces** | ~30 | ParsedError, RCAResult with tools/iterations |
| **Activation** | ~25 | activate(), command registration |
| **Input Handling** | ~40 | getErrorText(), sanitization |
| **Parsing** | ~40 | parseError() placeholder |
| **Progress & Analysis** | ~80 | analyzeWithProgress() with tool feedback |
| **Output Display** | ~100 | showResult() with badges, tools, iterations |
| **Error Handling** | ~100 | handleAnalysisError() with 4 categories |
| **Helper Functions** | ~80 | getErrorBadge (30+ types), getToolIcon, confidence helpers |
| **Logging & Cleanup** | ~30 | log(), deactivate() |
| **Total** | **~600** | ✅ Core UI Complete |

---

## Integration Readiness

### Backend Status (Kai's Work)
- ✅ **Parsers:** 4 parsers supporting 29 error types (628 tests passing)
- ✅ **Agent:** MinimalReactAgent with ReadFileTool & performance tracking
- ✅ **LLM Client:** OllamaClient tested with DeepSeek-R1-Distill-Qwen-7B
- ✅ **Accuracy:** 100% on 10-test validation (avg 75.8s latency)
- ✅ **Database:** ChromaDB integration ready (optional for MVP)
- ✅ **Caching:** RCACache with ErrorHasher implemented
- ✅ **Tools:** ReadFileTool, LSPTool, ToolRegistry operational
- ✅ **Monitoring:** PerformanceTracker with percentiles (Chunk 5.3)
- ✅ **Testing:** Golden test suite with 7 reference cases (Chunk 5.4)
- ✅ **Performance:** All targets achieved (p50 <60s, p90 <75s)
- ✅ **Coverage:** 85%+ across all modules, 869/878 tests passing

### UI Status (Sokchea's Work)
- ✅ **Extension:** Command registration & activation working
- ✅ **Input:** User input with validation & sanitization complete
- ✅ **Output:** Output channel with formatting, code context, confidence bar
- ✅ **Error Badges:** 30+ error types with color coding
- ✅ **Tool Feedback:** Progress updates and tool usage display
- ✅ **Database UI:** Storage notifications and similar solutions display
- ✅ **Cache UI:** Cache hit notifications with timestamps
- ✅ **Feedback UI:** User feedback system (👍/👎/Skip)
- ✅ **Android UI:** Compose & XML error tips and documentation links
- ✅ **Error Handling:** 4 specific error categories with action buttons
- ✅ **Configuration:** Settings for ollamaUrl & model defined
- 🔄 **Integration Points:** Placeholders ready for backend wiring

### Next Steps for Integration
1. **Wire parsers:** Replace `parseError()` with Kai's `ErrorParser.parse()`
2. **Wire agent:** Replace `generateMockResult()` with `MinimalReactAgent.analyze()`
3. **Add real tool feedback:** Stream progress from agent iterations
4. **Display real tool results:** Show LSP caller lists, search results
5. **Test end-to-end:** Run full workflow with real Ollama server

---

## Milestones Completed

### Week 1-2: MVP Backend & UI ✅
- [x] Chunk 1.1: Extension Bootstrap & Backend Foundation
- [x] Chunk 1.2: User Input Handling & Kotlin Parser
- [x] Chunk 1.3: Output Display & Ollama Integration
- [x] Chunk 1.4 (Backend): ReadFileTool with code context (21 tests)
- [x] Chunk 1.4 (UI): Code Context Display in extension
- [x] Chunk 1.5 (Backend): MVP Testing & Refinement (100% accuracy)
- [x] Chunk 1.5 (UI): MVP Polish with confidence & error handling

### Week 9: Core UI Enhancements ✅
- [x] Chunk 2.1 (UI): Error Type Badges expansion (30+ types)
- [x] Chunk 2.2 (UI): Tool Execution Feedback with progress

### Weeks 3-7: Advanced Backend ✅
- [x] Chunk 2.1-2.4 (Backend): Error badges, tool feedback, accuracy metrics
- [x] Chunk 3.1-3.4 (Backend): Database integration, caching, feedback
- [x] Chunk 4.1-4.2 (Backend): Android parsers (Compose, XML)

### Weeks 10-13: Database, Android, Polish Backend ✅
- [x] Chunk 3.1-3.2 (UI): Database storage & similar solutions display
- [x] Chunk 3.3-3.4 (UI): Cache hit notifications & feedback system
- [x] Chunk 4.1-4.2 (UI): Android Compose & XML error tips
- [x] Chunk 5.1 (Backend): Agent state streaming (~220 lines)
- [x] Chunk 5.2 (Backend): Educational agent (~335 lines, 24 tests)
- [x] Chunk 5.3 (Backend): Performance optimization (~243 lines, 20 tests)
- [x] Chunk 5.4 (Backend): Golden test suite (~315 lines, 9 tests)

### Next Up: Week 14
- [ ] Chunk 5.5 (Backend): Documentation & API cleanup
- [ ] Chunk 4.3 (Backend): Gradle Build Analyzer (if needed)
- [ ] Backend Integration: Wire UI to Kai's components

---

## Technical Debt & Future Work

### High Priority
1. **Backend Integration** - Wire UI placeholders to Kai's components (Week 10)
2. **Unit Tests for UI** - Add tests for new functions
3. **Real Tool Streaming** - Stream progress from actual agent iterations

### Medium Priority
1. **Webview UI** - Replace output channel with webview (Chunk 5.1)
2. **Configuration UI** - Settings page instead of manual JSON editing
3. **Accessibility** - Verify screen reader compatibility

### Low Priority (Future Phases)
1. **Multi-language Support** - TypeScript, Python, Java (Phase 2-3)
2. **Educational Mode** - Beginner-friendly explanations
3. **Marketplace Publishing** - Package for VS Code marketplace

---

## Notes

**Current Focus:** Accuracy Metrics Display (Chunk 2.3 UI) and backend integration.  
**Blockers:** None - both UI and backend are complete and ready to integrate.  
**Test Status:** Backend has 628 tests passing; UI needs automated tests.  
**Performance:** Backend validated at 75.8s avg latency (target: <90s).  
**Accuracy:** Backend validated at 100% on 10-test dataset (target: ≥60%).  
**Error Coverage:** 30+ error types supported across 4 languages (Kotlin, Gradle, Compose, XML).

---

**Status:** ✅ **Core UI Complete - Ready for Integration**  
**Next Milestone:** Accuracy Metrics Display & Backend Integration  
**Timeline:** Week 10 (December 23-27, 2025)

```
rca-agent/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance document (comprehensive roadmap)
├── docs/
│   ├── README.md                  # Main roadmap: 12-week production-ready plan
│   ├── DEVLOG.md                  # Central development journal (weekly updates) - UPDATED Week 8
│   ├── PROJECT_STRUCTURE.md       # This file - project tree snapshot
│   ├── API_CONTRACTS.md           # Tool interface specifications (JSON schemas)
│   ├── architecture/
│   │   ├── decisions/             # Architecture Decision Records (ADRs)
│   │   │   ├── README.md          # ADR index and guidelines
│   │   │   └── ADR-TEMPLATE.md    # Template for new ADRs
│   │   └── diagrams/              # System design diagrams (to be created)
│   ├── data/
│   │   └── accuracy-metrics.json  # Test results from Chunk 1.5 validation
│   └── _archive/
│       ├── milestones/            # Milestone completion summaries
│       │   ├── Chunk-1.1-1.3-COMPLETE.md         # Extension Bootstrap & Basic UI
│       │   ├── Chunk-1.4-COMPLETE.md             # Backend: ReadFileTool
│       │   ├── Chunk-1.5-COMPLETE.md             # Backend: MVP Testing
│       │   ├── Chunk-1.4-1.5-UI-COMPLETE.md      # UI: Code Context & Polish - NEW
│       │   ├── Chunk-2.1-COMPLETE.md             # Error Type Badges (backend)
│       │   ├── Chunk-2.2-2.3-COMPLETE.md         # Tool Execution & Accuracy (backend)
│       │   ├── Chunk-3.1-3.4-COMPLETE.md         # Database Integration (backend)
│       │   ├── Chunk-4.1-4.2-COMPLETE.md         # Android Backend (Compose, XML)
│       │   └── ...more milestones
│       └── phases/                # Phase planning documents
│           ├── Phase1-OptionB-MVP-First-SOKCHEA.md  # Sokchea's UI roadmap
│           └── ...
├── vscode-extension/              # VS Code Extension (Sokchea's work) - UPDATED
│   ├── package.json               # Extension manifest with commands & config
│   ├── tsconfig.json              # TypeScript configuration
│   ├── README.md                  # Extension user guide
│   ├── QUICKSTART.md              # Quick setup instructions
│   └── src/
│       └── extension.ts           # Main extension code (~470 lines)
│           # Chunks 1.1-1.5 Complete:
│           # - Extension activation & command registration
│           # - User input handling with validation
│           # - Output channel display with formatting
│           # - Code context display with syntax highlighting
│           # - Confidence visualization (bar + interpretation)
│           # - Enhanced error handling (4 categories)
│           # - Ready for backend integration
├── src/                           # Backend (Kai's work)
│   ├── types.ts                   # Core TypeScript interfaces (230 lines)
│   ├── agent/                     # LLM Agent components
│   │   ├── MinimalReactAgent.ts   # ReAct agent with tool execution (280 lines)
│   │   ├── FeedbackHandler.ts     # User feedback processing
│   │   └── PromptEngine.ts        # Few-shot examples & prompts
│   ├── cache/                     # Caching layer
│   │   ├── ErrorHasher.ts         # Deterministic error hashing
│   │   └── RCACache.ts            # In-memory LRU cache
│   ├── db/                        # ChromaDB integration
│   │   ├── ChromaDBClient.ts      # Vector database client
│   │   ├── EmbeddingService.ts    # Dual embedding (local + cloud)
│   │   ├── QualityManager.ts      # Quality score management
│   │   ├── QualityScorer.ts       # Confidence-based scoring
│   │   └── schemas/               # Collection schema definitions
│   ├── llm/                       # LLM clients
│   │   └── OllamaClient.ts        # Local Ollama client (291 lines)
│   ├── tools/                     # Agent tools
│   │   ├── ReadFileTool.ts        # File reading with context (180 lines)
│   │   ├── LSPTool.ts             # Language Server Protocol integration
│   │   └── ToolRegistry.ts        # Tool management & execution
│   └── utils/                     # Parsers & utilities
│       ├── ErrorParser.ts         # Multi-language error router
│       ├── KotlinNPEParser.ts     # Kotlin NPE parser (220 lines)
│       ├── LanguageDetector.ts    # Auto-detect language
│       └── parsers/               # Language-specific parsers
│           ├── KotlinParser.ts    # Kotlin error patterns
│           ├── GradleParser.ts    # Gradle build errors
│           ├── JetpackComposeParser.ts  # Compose errors
│           └── XMLParser.ts       # XML layout errors (500 lines)
├── tests/                         # Test suite
│   ├── fixtures/
│   │   └── test-dataset.ts        # 10 real Kotlin error examples
│   ├── integration/               # End-to-end tests
│   │   ├── accuracy.test.ts       # 10-test accuracy validation
│   │   └── e2e.test.ts            # Full workflow tests
│   └── unit/                      # Unit tests (628 tests passing)
│       ├── OllamaClient.test.ts   # 12 tests
│       ├── KotlinNPEParser.test.ts # 15 tests
│       ├── MinimalReactAgent.test.ts # 14 tests
│       ├── ReadFileTool.test.ts   # 21 tests
│       ├── XMLParser.test.ts      # 43 tests
│       └── ...more tests
├── scripts/                       # Testing & benchmarking
│   ├── run-accuracy-tests.ts      # Orchestrates accuracy testing
│   ├── benchmark.ts               # Performance benchmarking
│   └── README.md                  # Scripts documentation
├── examples/                      # Usage examples
│   └── basic-usage.ts             # Simple example
├── jest.config.js                 # Jest test configuration
├── tsconfig.json                  # Root TypeScript config
├── package.json                   # Dependencies & scripts
└── README.md                      # Project overview
```

**Documentation Status:** ✅ **Week 8 Complete - UI MVP Ready for Integration**

**Key Changes (December 19, 2025):**
- ✅ Completed Chunks 1.4-1.5 UI (Code Context Display & MVP Polish)
- ✅ Updated DEVLOG.md with Week 8 entry
- ✅ Created Chunk-1.4-1.5-UI-COMPLETE.md milestone
- ✅ Enhanced vscode-extension/src/extension.ts (~470 lines, +120 new)
- ✅ Added confidence visualization (bar + interpretation)
- ✅ Implemented comprehensive error handling (4 categories)
- ✅ Ready for backend integration (all placeholders in place)

---

## File Size Overview (Week 8)

### Source Code

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| **VS Code Extension** | 1 | ~470 | ✅ Chunks 1.1-1.5 Complete |
| **Backend (src/)** | ~20 | ~3,500 | ✅ Chunks 1.1-4.2 Complete |
| **Tests** | ~25 | ~3,000 | ✅ 628 tests passing |
| **Scripts** | 3 | ~600 | ✅ Accuracy & benchmark |
| **Docs** | ~15 | ~5,000 | ✅ Updated Week 8 |
| **Total** | **~64** | **~12,570** | ✅ MVP Ready |

### Extension Breakdown (vscode-extension/src/extension.ts)

| Section | Lines | Description |
|---------|-------|-------------|
| **Interfaces** | ~25 | ParsedError, RCAResult types |
| **Activation** | ~25 | activate(), command registration |
| **Input Handling** | ~40 | getErrorText(), sanitization |
| **Parsing** | ~40 | parseError() placeholder |
| **Progress & Analysis** | ~60 | analyzeWithProgress(), generateMockResult() |
| **Output Display** | ~80 | showResult() with code context & confidence |
| **Error Handling** | ~100 | handleAnalysisError() with 4 categories |
| **Helper Functions** | ~40 | getErrorBadge(), createConfidenceBar(), etc. |
| **Logging & Cleanup** | ~30 | log(), deactivate() |
| **Total** | **~470** | ✅ Complete MVP UI |

---

## Integration Readiness

### Backend Status (Kai's Work)
- ✅ **Parsers:** KotlinNPEParser, XMLParser, GradleParser ready (628 tests passing)
- ✅ **Agent:** MinimalReactAgent with ReadFileTool integration complete
- ✅ **LLM Client:** OllamaClient tested with hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
- ✅ **Accuracy:** 100% on 10-test validation (avg 75.8s latency)
- ✅ **Database:** ChromaDB integration ready (optional for MVP)
- ✅ **Caching:** RCACache with ErrorHasher implemented

### UI Status (Sokchea's Work)
- ✅ **Extension:** Command registration & activation working
- ✅ **Input:** User input with validation & sanitization complete
- ✅ **Output:** Output channel with formatting, code context, confidence bar
- ✅ **Error Handling:** 4 specific error categories with action buttons
- ✅ **Configuration:** Settings for ollamaUrl & model defined
- 🔄 **Integration Points:** Placeholders ready for backend wiring

### Next Steps for Integration
1. **Wire parsers:** Replace `parseError()` with Kai's `KotlinNPEParser`
2. **Wire agent:** Replace `generateMockResult()` with `MinimalReactAgent.analyze()`
3. **Add file reading:** Use Kai's `ReadFileTool` for code snippets
4. **Test end-to-end:** Run full workflow with real Ollama server
5. **Measure performance:** Validate <90s latency target

---

## Milestones Completed

### Week 1-2: MVP Backend ✅
- [x] Chunk 1.1: Extension Bootstrap & Backend Foundation
- [x] Chunk 1.2: User Input Handling & Kotlin Parser
- [x] Chunk 1.3: Output Display & Ollama Integration

### Week 1 Extended: Tool Infrastructure ✅
- [x] Chunk 1.4 (Backend): ReadFileTool with code context (21 tests)
- [x] Chunk 1.5 (Backend): MVP Testing & Refinement (100% accuracy)

### Week 8: MVP UI Complete ✅
- [x] Chunk 1.4 (UI): Code Context Display in extension
- [x] Chunk 1.5 (UI): MVP Polish with confidence & error handling

### Weeks 3-7: Advanced Backend ✅
- [x] Chunk 2.1-2.4: Error badges, tool feedback, accuracy metrics
- [x] Chunk 3.1-3.4: Database integration, caching, feedback
- [x] Chunk 4.1-4.2: Android parsers (Compose, XML)

### Next Up: Week 9
- [ ] Chunk 2.1 (UI): Error Type Badges expansion in extension
- [ ] Chunk 4.3 (Backend): Gradle Build Analyzer (if needed)

---

## Technical Debt & Future Work

### High Priority
1. **Backend Integration** - Wire UI placeholders to Kai's components (Week 9)
2. **Unit Tests for UI** - Add tests for createConfidenceBar(), etc.
3. **Webview UI** - Replace output channel with webview (Chunk 5.1)

### Medium Priority
1. **Configuration UI** - Settings page instead of manual JSON editing
2. **Progress Streaming** - Real-time agent iteration updates
3. **Accessibility** - Verify screen reader compatibility

### Low Priority (Future Phases)
1. **Multi-language Support** - TypeScript, Python, Java (Phase 2-3)
2. **Educational Mode** - Beginner-friendly explanations
3. **Marketplace Publishing** - Package for VS Code marketplace

---

## Notes

**Current Focus:** Integration testing to connect Sokchea's UI with Kai's backend.  
**Blockers:** None - both UI and backend are complete and ready to integrate.  
**Test Status:** Backend has 628 tests passing; UI needs automated tests.  
**Performance:** Backend validated at 75.8s avg latency (target: <90s).  
**Accuracy:** Backend validated at 100% on 10-test dataset (target: ≥60%).

---

**Status:** ✅ **MVP UI Complete - Ready for Integration**  
**Next Milestone:** Backend Integration & End-to-End Testing  
**Timeline:** Week 9 (December 23-27, 2025)
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
