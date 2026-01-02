# RCA Agent - Project Files by Chunk

> **Purpose:** Organized file listing by implementation phase/chunk  
> **Generated:** January 2, 2026  
> **Excludes:** `docs/`, test result JSON files, compiled `.js` files, `.map` files

---

## 📦 **CHUNK 1: MVP Foundation (Core Agent)**

### **Core Agent Logic**
- `src/agent/MinimalReactAgent.ts` - Main ReACT agent implementation
- `src/agent/PromptEngine.ts` - Prompt generation and few-shot learning
- `src/agent/ResponseValidator.ts` - Validates LLM responses
- `src/agent/FixGenerator.ts` - Generates code fixes
- `src/agent/OutputValidator.ts` - Validates agent output

### **LLM Integration**
- `src/llm/OllamaClient.ts` - Ollama API client

### **Core Tools**
- `src/tools/ReadFileTool.ts` - File reading capability
- `src/tools/ToolRegistry.ts` - Tool registration and management

### **Basic Parsing**
- `src/utils/ErrorParser.ts` - Master error parser
- `src/utils/KotlinNPEParser.ts` - Kotlin NPE/lateinit parser
- `src/types.ts` - Core TypeScript interfaces

### **Example**
- `examples/basic-usage.ts` - Basic agent usage example

---

## 📦 **CHUNK 2: Core Tools & Parsing**

### **Advanced Parsers**
- `src/utils/parsers/KotlinParser.ts` - Comprehensive Kotlin error parser
- `src/utils/parsers/GradleParser.ts` - Gradle build error parser
- `src/utils/LanguageDetector.ts` - Language detection utility
- `src/utils/FileResolver.ts` - File path resolution

### **LSP Integration**
- `src/tools/LSPTool.ts` - Language Server Protocol integration
- `src/tools/VersionLookupTool.ts` - Version compatibility lookups

### **Agent Enhancements**
- `src/agent/FeedbackHandler.ts` - User feedback processing
- `src/agent/ModelAdapter.ts` - Model-specific adaptations

---

## 📦 **CHUNK 3: Database & Knowledge Management**

### **ChromaDB Integration**
- `src/db/ChromaDBClient.ts` - ChromaDB client
- `src/db/EmbeddingService.ts` - Text embedding service
- `src/db/schemas/rca-collection.ts` - RCA collection schema

### **Quality Management**
- `src/db/QualityManager.ts` - Solution quality tracking
- `src/db/QualityScorer.ts` - Quality scoring algorithm

### **Caching**
- `src/cache/RCACache.ts` - RCA result caching
- `src/cache/ErrorHasher.ts` - Error fingerprinting

### **Knowledge Base**
- `src/knowledge/FewShotExampleService.ts` - Few-shot example management
- `src/knowledge/SemanticExampleService.ts` - Semantic example search
- `src/knowledge/few-shot-examples/index.ts` - Example index
- `src/knowledge/few-shot-examples/manifest-examples.ts`
- `src/knowledge/few-shot-examples/navigation-examples.ts`
- `src/knowledge/few-shot-examples/network-examples.ts`
- `src/knowledge/few-shot-examples/proguard-examples.ts`
- `src/knowledge/few-shot-examples/cache-examples.ts`

### **Knowledge Data**
- `src/knowledge/agp-versions.json` - AGP version database
- `src/knowledge/agp-versions.schema.json`
- `src/knowledge/kotlin-versions.json` - Kotlin version database
- `src/knowledge/kotlin-versions.schema.json`
- `src/knowledge/compatibility-matrix.json` - Version compatibility
- `src/knowledge/compatibility-matrix.schema.json`
- `src/knowledge/few-shot-examples.json` - Example database
- `src/knowledge/few-shot-examples-compiled.json`
- `src/knowledge/few-shot-examples.schema.json`
- `src/knowledge/README.md`

---

## 📦 **CHUNK 4: Android-Specific Tools & Parsers**

### **Android Parsers**
- `src/utils/parsers/JetpackComposeParser.ts` - Jetpack Compose error parser
- `src/utils/parsers/XMLParser.ts` - XML layout parser

### **Android Tools**
- `src/tools/AndroidBuildTool.ts` - Android build analysis
- `src/tools/AndroidDocsSearchTool.ts` - Android documentation search
- `src/tools/ManifestAnalyzerTool.ts` - AndroidManifest.xml analyzer

### **Advanced Tools**
- `src/tools/DependencyGraphTool.ts` - Dependency graph analysis
- `src/tools/HistoricalPatternTool.ts` - Historical error patterns
- `src/tools/SemanticCodeSearchTool.ts` - Semantic code search

### **Utilities**
- `src/utils/DiffFormatter.ts` - Diff formatting for fixes

---

## 📦 **CHUNK 5: Polish & Advanced Features**

### **Agent State Streaming**
- `src/agent/AgentStateStream.ts` - Real-time agent state updates
- `src/agent/DocumentSynthesizer.ts` - Markdown report generation

### **Educational Mode**
- `src/agent/EducationalAgent.ts` - Educational explanations
- `src/agent/ErrorClassifier.ts` - Error classification system

### **Learning & Adaptation**
- `src/agent/AdaptiveLearning.ts` - Adaptive learning system
- `src/agent/LearningPipeline.ts` - Learning pipeline
- `src/agent/MultiPassAgent.ts` - Multi-pass analysis

### **Performance Monitoring**
- `src/monitoring/PerformanceTracker.ts` - Performance metrics tracking

### **Prompts**
- `src/agent/prompts/CategoryPrompts.ts` - Category-specific prompts

---

## 🧪 **TEST INFRASTRUCTURE**

### **Unit Tests (42 files)**
- `tests/unit/AgentStateStream.test.ts`
- `tests/unit/AndroidBuildTool.test.ts`
- `tests/unit/AndroidDocsSearchTool.test.ts`
- `tests/unit/ChromaDBClient.test.ts`
- `tests/unit/DocumentSynthesizer.test.ts`
- `tests/unit/EducationalAgent.test.ts`
- `tests/unit/EmbeddingService.test.ts`
- `tests/unit/ErrorHasher.test.ts`
- `tests/unit/ErrorParser.test.ts`
- `tests/unit/FeedbackHandler.test.ts`
- `tests/unit/GradleParser.test.ts`
- `tests/unit/JetpackComposeParser.test.ts`
- `tests/unit/KotlinNPEParser.test.ts`
- `tests/unit/KotlinParser.test.ts`
- `tests/unit/LanguageDetector.test.ts`
- `tests/unit/LSPTool.test.ts`
- `tests/unit/ManifestAnalyzerTool.test.ts`
- `tests/unit/MinimalReactAgent.test.ts`
- `tests/unit/OllamaClient.test.ts`
- `tests/unit/PerformanceTracker.test.ts`
- `tests/unit/PromptEngine.test.ts`
- `tests/unit/QualityManager.test.ts`
- `tests/unit/QualityScorer.test.ts`
- `tests/unit/rca-collection.test.ts`
- `tests/unit/RCACache.test.ts`
- `tests/unit/ReadFileTool.test.ts`
- `tests/unit/ToolRegistry.test.ts`
- `tests/unit/XMLParser.test.ts`
- `tests/unit/agent/FixGenerator.test.ts`
- `tests/unit/agent/ResponseValidator.test.ts`
- `tests/unit/knowledge/agp-versions.test.ts`
- `tests/unit/knowledge/compatibility-matrix.test.ts`
- `tests/unit/knowledge/FewShotExampleService.test.ts`
- `tests/unit/knowledge/kotlin-versions.test.ts`
- `tests/unit/utils/DiffFormatter.test.ts`
- `tests/unit/utils/FileResolver.test.ts`

### **Integration Tests**
- `tests/integration/accuracy.test.ts`
- `tests/integration/android-accuracy.test.ts`
- `tests/integration/e2e.test.ts`
- `tests/integration/agent/PromptEngine-FewShot.test.ts`
- `tests/integration/tools/VersionLookupTool.test.ts`

### **Real-World Tests**
- `tests/real-world/Phase4TestSuite.ts` - 10 real Android error test cases

### **Golden Tests**
- `tests/golden/golden-suite.test.ts` - Golden test suite (7 cases)

### **Test Fixtures**
- `tests/fixtures/test-dataset.ts`
- `tests/fixtures/android-test-dataset.ts`
- `tests/fixtures/performance-test-dataset.ts`
- `tests/fixtures/test4-xml-layout/activity_main.xml` - XML layout test case
- `tests/fixtures/test-4-xml-inflation/activity_main.xml` - XML inflation test
- `tests/fixtures/test6-manifest-permission/AndroidManifest.xml` - Manifest test

---

## 🔧 **SCRIPTS & UTILITIES**

### **Test Runners**
- `scripts/phase4-test-runner.ts` - Phase 4 unified test runner
- `scripts/chunk7-run-all-tests.ts` - Chunk 7 test runner (Tests 1-5)
- `scripts/chunk8-run-all-tests.ts` - Chunk 8 test runner (Tests 6-10)
- `scripts/chunk9-retest-all.ts` - Chunk 9 re-test all 10 cases

### **Individual Test Scripts**
- `scripts/chunk7-test1-agp-retest.ts` - Test 1: AGP Version
- `scripts/chunk8-test6-manifest.ts` - Test 6: Manifest Permission
- `scripts/chunk8-test7-gradle-network.ts` - Test 7: Gradle Network
- `scripts/chunk8-test8-build-cache.ts` - Test 8: Build Cache
- `scripts/chunk8-test9-proguard.ts` - Test 9: ProGuard
- `scripts/chunk8-test10-navigation.ts` - Test 10: Navigation

### **MVP Test Scripts**
- `scripts/simple-mvp-test.ts` - Simple MVP test
- `scripts/simple-mvp-test-v2.ts` - MVP test v2
- `scripts/test-mvp-project.ts` - MVP project test
- `scripts/test-mvp-enhanced.ts` - Enhanced MVP test
- `scripts/test-chunk3-improvements.ts` - Chunk 3 improvements test

### **Phase Test Scripts**
- `scripts/phase1-validation.ts` - Phase 1 validation
- `scripts/phase1-quick-retest.ts` - Phase 1 quick retest
- `scripts/test-phase1-quick.ts` - Phase 1 quick test
- `scripts/test-phase2-validation.ts` - Phase 2 validation
- `scripts/phase4-quickstart.ts` - Phase 4 quickstart

### **Performance & Accuracy**
- `scripts/run-accuracy-tests.ts` - Run accuracy tests
- `scripts/run-performance-tests.ts` - Run performance tests
- `scripts/performance-comparison.ts` - Performance comparison
- `scripts/benchmark.ts` - Benchmarking tool

### **Utilities**
- `scripts/validate-setup.ts` - Setup validation
- `scripts/populate-chromadb.ts` - Populate ChromaDB
- `scripts/build-examples.ts` - Build examples
- `scripts/merge-examples-to-json.ts` - Merge examples
- `scripts/fix-gradle-tests.js` - Fix Gradle tests
- `scripts/shared/test-types.ts` - Shared test type definitions

---

## 🎨 **VS CODE EXTENSION**

### **Extension Entry Point**
- `vscode-extension/src/extension.ts` - Main extension entry point

### **Chat Participant**
- `vscode-extension/src/chat/RCAChatParticipant.ts` - Chat participant
- `vscode-extension/src/chat/ChatRequestRouter.ts` - Request routing
- `vscode-extension/src/chat/ChatPromptEngine.ts` - Prompt generation
- `vscode-extension/src/chat/ConversationalAgent.ts` - Conversational AI
- `vscode-extension/src/chat/ContextCollector.ts` - Context collection
- `vscode-extension/src/chat/ResponseStreamer.ts` - Response streaming
- `vscode-extension/src/chat/GuidedDebuggingWorkflow.ts` - Guided debugging

### **Panel/Webview**
- `vscode-extension/src/panel/RCAPanelProvider.ts` - Panel provider
- `vscode-extension/src/panel/StateManager.ts` - State management
- `vscode-extension/src/panel/ErrorQueueManager.ts` - Error queue
- `vscode-extension/src/panel/webview-content.ts` - Webview HTML
- `vscode-extension/src/panel/ErrorBoundary.ts` - Error boundary
- `vscode-extension/src/panel/EmptyStateTemplates.ts` - Empty states
- `vscode-extension/src/panel/types.ts` - Panel types

### **UI Components**
- `vscode-extension/src/ui/RCAWebview.ts` - Webview component

### **Views/Tree Providers**
- `vscode-extension/src/views/ErrorTreeProvider.ts` - Error tree view
- `vscode-extension/src/views/HistoryTreeProvider.ts` - History tree view
- `vscode-extension/src/views/AgentStateViewer.ts` - Agent state viewer
- `vscode-extension/src/views/VirtualScrollProvider.ts` - Virtual scrolling

### **Commands**
- `vscode-extension/src/commands/BatchAnalysisCommands.ts` - Batch analysis
- `vscode-extension/src/commands/ChatActionCommands.ts` - Chat actions
- `vscode-extension/src/commands/InlineIntegrationCommands.ts` - Inline integration
- `vscode-extension/src/commands/TreeViewCommands.ts` - Tree view commands

### **Services**
- `vscode-extension/src/services/AnalysisService.ts` - Analysis service
- `vscode-extension/src/services/FixApplicationService.ts` - Fix application
- `vscode-extension/src/services/PerformanceMonitor.ts` - Performance monitoring
- `vscode-extension/src/services/ThemeManager.ts` - Theme management
- `vscode-extension/src/services/AccessibilityService.ts` - Accessibility
- `vscode-extension/src/services/FeatureFlagManager.ts` - Feature flags
- `vscode-extension/src/services/NetworkTimeoutHandler.ts` - Network timeout

### **Integrations**
- `vscode-extension/src/integrations/RCACodeActionProvider.ts` - Code actions
- `vscode-extension/src/integrations/RCADiagnosticProvider.ts` - Diagnostics
- `vscode-extension/src/integrations/RCAHoverProvider.ts` - Hover info
- `vscode-extension/src/integrations/RealtimeErrorDetector.ts` - Real-time detection
- `vscode-extension/src/integrations/StatusBarManager.ts` - Status bar

### **Tools**
- `vscode-extension/src/tools/ExecuteCommandTool.ts` - Command execution
- `vscode-extension/src/tools/FileOperationTool.ts` - File operations
- `vscode-extension/src/tools/GradleCommandHelper.ts` - Gradle helper
- `vscode-extension/src/tools/TerminalTool.ts` - Terminal integration
- `vscode-extension/src/tools/WorkspaceSearchTool.ts` - Workspace search
- `vscode-extension/src/tools/ToolRegistry.ts` - Tool registry
- `vscode-extension/src/tools/index.ts` - Tools index

### **Utils**
- `vscode-extension/src/utils/ErrorHandler.ts` - Error handling
- `vscode-extension/remove-emojis.js` - Emoji removal utility

### **Extension Tests**
- `vscode-extension/src/test/e2e/workflows.test.ts` - E2E workflows
- `vscode-extension/src/test/integration/chunk5-services.test.ts` - Services
- `vscode-extension/src/test/integrations/RCACodeActionProvider.test.ts`
- `vscode-extension/src/test/integrations/StatusBarManager.test.ts`
- `vscode-extension/src/test/panel/ErrorQueueManager.test.ts`
- `vscode-extension/src/test/panel/StateManager.test.ts`
- `vscode-extension/src/test/views/TreeProvider.test.ts`
- `vscode-extension/test/integration/chatWorkflow.test.ts`
- `vscode-extension/test/integration/interactiveDebugging.test.ts`
- `vscode-extension/test/load/load-test.ts`

### **Extension Configuration**
- `vscode-extension/package.json` - Extension manifest
- `vscode-extension/package-lock.json` - Locked dependencies
- `vscode-extension/tsconfig.json` - TypeScript config
- `vscode-extension/.eslintrc.json` - ESLint config
- `vscode-extension/.gitignore` - Git ignore patterns
- `vscode-extension/.vscodeignore` - Extension packaging ignore
- `vscode-extension/README.md` - Extension README
- `vscode-extension/compile-errors.txt` - Build error log
- `vscode-extension/.vscode/launch.json` - Debug config
- `vscode-extension/.vscode/tasks.json` - Build tasks
- `vscode-extension/.vscode/settings.json` - Workspace settings

### **Extension Resources**
- `vscode-extension/resources/animations.css` - CSS animations
- `vscode-extension/resources/icons/rca-agent.svg` - Main icon
- `vscode-extension/resources/icons/rca-agent-activity-bar.svg` - Activity bar icon
- `vscode-extension/resources/icons/status-analyzing.svg` - Status icon
- `vscode-extension/resources/icons/status-error.svg` - Error status icon
- `vscode-extension/resources/icons/status-idle.svg` - Idle status icon
- `vscode-extension/resources/icons/status-success.svg` - Success status icon

---

## ⚙️ **CONFIGURATION FILES**

### **Root Configuration**
- `package.json` - Project dependencies and scripts
- `package-lock.json` - Locked dependencies
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest testing configuration
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier code formatting config
- `.gitignore` - Git ignore patterns
- `README.md` - Project README
- `PROJECT_FILE_CHUNKS.md` - This file

### **GitHub Configuration**
- `.github/copilot-instructions.md` - GitHub Copilot AI assistant instructions

### **VS Code Workspace**
- `.vscode/launch.json` - Debug configurations

### **Python Starter**
- `start.py` - Python startup script (ChromaDB)

### **Ollama Models**
- `ollama-models/android-debug-optimized.modelfile` - Custom Ollama model configuration

### **Database**
- `chroma/chroma.sqlite3` - ChromaDB database
- `chroma/1f0b7ffc-b334-4fd8-8229-ae3da4c6d01f/` - Collection data
- `chroma/fabab605-f66d-43d5-8288-11793f975a37/` - Collection data

### **Build Output (Generated, gitignored)**
- `dist/` - Compiled JavaScript output
- `coverage/` - Test coverage reports
  - `coverage/clover.xml`
  - `coverage/lcov.info`
  - `coverage/coverage-final.json`
  - `coverage/lcov-report/` - HTML coverage reports

---
:**
- TypeScript (.ts): ~210 files
- JavaScript (.js): ~56 files (compiled output + utilities)
- JSON (.json): ~37 files (config, data, schemas)
- Test Fixtures (.xml): 3 files
- CSS: 1 file
- SVG Icons: 6 files
- Python: 1 file
- Modelfile: 1 file
- **Total Source: ~315 tracked files**
- **Generated Files (gitignored):** dist/, coverage/, node_modules/
- Tests: ~80 files
- Scripts: ~30 files
- **Total: ~210 TypeScript files**

**Key Technologies:**
- TypeScript 5.0+
- Node.js 18+
- Ollama (DeepSeek-R1-Distill-Qwen-7B)
- ChromaDB for vector storage
- Jest for testing
- VS Code Extension API

**Test Coverage:**
- 869/878 tests passing (99%)
- 95%+ code coverage
- 10 real-world Android test cases
- 7 golden test cases

---

## 🎯 **FILE ORGANIZATION PRINCIPLES**

**Backend Core (`src/`):**
- `agent/` - Agent logic and prompts
- `llm/` - LLM client implementations
- `tools/` - Tool implementations
- `utils/` - Parsers and utilities
- `db/` - Database and quality management
- `cache/` - Caching layer
- `knowledge/` - Knowledge base and examples
- `monitoring/` - Performance tracking

**VS Code Extension (`vscode-extension/src/`):**
- `chat/` - Chat participant and conversation
- `panel/` - Main panel UI
- `views/` - Tree views and custom views
- `commands/` - Command implementations
- `services/` - Background services
- `integrations/` - VS Code IDE integrations
- `tools/` - Extension-specific tools
- `ui/` - UI components

**Tests (`tests/`):**
- `unit/` - Unit tests
- `integration/` - Integration tests
- `real-world/` - Real-world scenario tests
- `golden/` - Golden test suite
- `fixtures/` - Test data and fixtures

**Scripts (`scripts/`):**
- Test runners for each phase/chunk
- Performance and accuracy testing
- Database population
- Build utilities
- Shared test types

---

**End of File Listing**
