# Project Structure - RCA Agent

> **Auto-generated snapshot of project file tree**  
> **Project Type:** Personal learning project - Kotlin/Android debugging assistant  
> **Last Updated:** December 20, 2024 (Week 13 - Chunks 5.3-5.4 Performance & Testing Complete)  
> **Next Update:** After Chunk 5.5 (Documentation)

---

## Current Structure (Week 13 - Polish Backend Phase 5.3-5.4 Complete)

```
rca-agent/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance document (comprehensive roadmap)
├── docs/
│   ├── README.md                  # Main roadmap: 12-week production-ready plan
│   ├── DEVLOG.md                  # Central development journal (weekly updates) - UPDATED Week 12
│   ├── PROJECT_STRUCTURE.md       # This file - project tree snapshot - UPDATED Week 12
│   ├── API_CONTRACTS.md           # Tool interface specifications (JSON schemas)
│   ├── WEEK-8-SUMMARY.md          # Week 8 completion summary
│   ├── WEEK-9-SUMMARY.md          # Week 9 completion summary
│   ├── WEEK-10-SUMMARY.md         # Week 10 completion summary (Chunks 3.1-3.2)
│   ├── WEEK-11-SUMMARY.md         # Week 11 completion summary (Chunks 3.3-3.4)
│   ├── WEEK-12-SUMMARY.md         # Week 12 completion summary (Chunks 4.1-4.2) - TO BE CREATED
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
│       │   ├── Chunk-1.4-1.5-UI-COMPLETE.md      # UI: Code Context & Polish
│       │   ├── Chunk-2.1-2.2-UI-COMPLETE.md      # UI: Error Badges & Tool Feedback
│       │   ├── Chunk-2.1-COMPLETE.md             # Backend: Error Type Badges
│       │   ├── Chunk-2.2-2.3-COMPLETE.md         # Backend: Tool Execution & Accuracy
│       │   ├── Chunk-3.1-3.2-UI-COMPLETE.md      # UI: Storage & Similar Solutions (Week 10)
│       │   ├── Chunk-3.3-3.4-UI-COMPLETE.md      # UI: Cache & Feedback (Week 11)
│       │   ├── Chunk-3.1-3.4-COMPLETE.md         # Backend: Database Integration
│       │   ├── Chunk-4.1-4.2-UI-COMPLETE.md      # UI: Android Compose & XML (Week 12)
│       │   ├── Chunk-4.1-4.2-COMPLETE.md         # Backend: Android (Compose, XML)
│       │   ├── Chunk-5.1-COMPLETE.md             # Backend: Agent State Streaming (Week 12/13)
│       │   ├── Chunk-5.2-COMPLETE.md             # Backend: Educational Agent (Week 12/13)
│       │   ├── Chunk-5.3-5.4-COMPLETE.md         # Backend: Performance & Testing (Week 13) - NEW
│       │   └── Kai-Backend/                      # Kai's backend milestone folder
│       │       ├── Chunk-5.3-5.4-COMPLETE.md     # Performance & Testing details
│       │   ├── Chunk-4.1-4.2-COMPLETE.md         # Backend: Android (Compose, XML)
│       │   ├── Chunk-5.1-COMPLETE.md             # Backend: Agent State Streaming (Week 12/13)
│       │   ├── Chunk-5.2-COMPLETE.md             # Backend: Educational Agent (Week 12/13) - NEW
│       │   └── ...more milestones
│       └── phases/                # Phase planning documents
│           ├── Phase1-OptionB-MVP-First-SOKCHEA.md  # Sokchea's UI roadmap
│           └── ...
├── vscode-extension/              # VS Code Extension (Sokchea's work) - UPDATED Week 12
│   ├── package.json               # Extension manifest with commands & config
│   ├── tsconfig.json              # TypeScript configuration
│   ├── README.md                  # Extension user guide
│   ├── QUICKSTART.md              # Quick setup instructions
│   └── src/
│       └── extension.ts           # Main extension code (~1359 lines, +182 from Week 11)
│           # Chunks 1.1-4.2 Complete (Phase 4 40% Complete):
│           # - Extension activation & command registration
│           # - User input handling with validation
│           # - Output channel display with formatting
│           # - Code context display with syntax highlighting
│           # - Confidence visualization (bar + interpretation)
│           # - Enhanced error handling (4 categories)
│           # - 38 error type badges (Kotlin, Gradle, Compose, XML)
│           # - Tool execution feedback with progress updates
│           # - Tool usage display with icons
│           # - Accuracy metrics display (quality, latency, model)
│           # - Database storage notifications (Chunk 3.1)
│           # - Similar solutions display (Chunk 3.2)
│           # - Cache hit notifications with timestamps (Chunk 3.3)
│           # - User feedback system (👍/👎/Skip) (Chunk 3.4)
│           # - Compose error detection & tips (NEW - Chunk 4.1)
│           # - XML error detection & tips (NEW - Chunk 4.2)
│           # - Framework-specific documentation links (NEW)
│           # - XML attribute suggestions (NEW - Chunk 4.2)
│           # - Ready for backend integration
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

**Key Changes (December 20, 2024):**
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
- ✅ **LLM Client:** OllamaClient tested with granite-code:8b
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
