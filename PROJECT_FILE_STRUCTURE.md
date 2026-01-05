# AI_PP_Project - Complete File Structure

> **Last Updated:** January 5, 2026  
> **Auto-Generated Statistics:** Run `npm run generate-stats` to update counts  
> **Exclusions:** This document excludes `docs/`, `node_modules/`, and `.git/` directories.
> 
> **Build Artifacts Note:** This project outputs compiled files in multiple locations:
> - **Primary Build Output:** `dist/` - Main compilation target for distribution
> - **In-Source Artifacts:** Some `.js` and `.d.ts` files appear alongside `.ts` sources
> - **Extension Output:** `vscode-extension/out/` - VS Code extension compilation

## 📋 Table of Contents
- [Root Level Files](#root-level-files)
- [Configuration Files](#configuration-files)
- [Source Code (`src/`)](#source-code-src)
- [Distribution (`dist/`)](#distribution-dist)
- [Tests (`tests/`)](#tests-tests)
- [Scripts](#scripts)
- [VS Code Extension (`vscode-extension/`)](#vs-code-extension-vscode-extension)
- [Data & Databases](#data--databases)
- [Examples & Models](#examples--models)

---

## Root Level Files

```
.
├── .eslintrc.js
├── .git/ (excluded from documentation)
├── .gitignore
├── .prettierrc
├── jest.config.js
├── package.json
├── package-lock.json
├── PROJECT_FILE_STRUCTURE.md
├── README.md
├── start.py
├── temp/
├── tsconfig.base.json
└── tsconfig.json
```

**Note:** Build artifacts (`.js`, `.js.map`, `.d.ts`, `.d.ts.map`) may appear in `src/` directories due to compilation output alongside source files.

## Configuration Files

### GitHub Configuration
```
.github/
└── copilot-instructions.md
```

### VS Code Workspace Configuration
```
.vscode/
└── launch.json
```

---

## Source Code (`src/`)

**Note:** Source files include both TypeScript (`.ts`) and compilation outputs (`.js`, `.js.map`) in the same directories.

### Agent System
```
src/
├── types.js
├── types.js.map
├── types.ts
└── agent/
    ├── AdaptiveLearning.js.map
    ├── AdaptiveLearning.ts
    ├── AgentStateStream.js.map
    ├── AgentStateStream.ts
    ├── BasePromptEngine.ts
    ├── DocumentSynthesizer.js.map
    ├── DocumentSynthesizer.ts
    ├── EducationalAgent.js.map
    ├── EducationalAgent.ts
    ├── ErrorClassifier.js.map
    ├── ErrorClassifier.ts
    ├── FeedbackHandler.js.map
    ├── FeedbackHandler.ts
    ├── FixGenerator.js.map
    ├── FixGenerator.ts
    ├── LearningPipeline.js.map
    ├── LearningPipeline.ts
    ├── MinimalReactAgent.js.map
    ├── MinimalReactAgent.ts
    ├── ModelAdapter.js.map
    ├── ModelAdapter.ts
    ├── MultiPassAgent.js.map
    ├── MultiPassAgent.ts
    ├── OutputValidator.js.map
    ├── OutputValidator.ts
    ├── PromptEngine.js.map
    ├── PromptEngine.ts
    ├── QualityValidator.ts
    ├── ResponseValidator.js.map
    ├── ResponseValidator.ts
    ├── TemplateEngine.ts
    ├── types.ts
    ├── ValidatedMultiPassAgent.ts
    └── prompts/
        └── CategoryPrompts.ts
```

### Caching System
```
src/cache/
├── ErrorHasher.ts
└── RCACache.ts
```

### Database & Embedding Services
```
src/db/
├── ChromaDBClient.ts
├── EmbeddingService.ts
├── QualityManager.ts
├── QualityScorer.ts
└── schemas/
    └── rca-collection.ts
```

### Knowledge Management
```
src/knowledge/
├── FewShotExampleService.ts
├── SemanticExampleService.ts
└── few-shot-examples/
    ├── index.ts
    ├── index.js
    ├── index.js.map
    ├── cache-examples.ts
    ├── cache-examples.js
    ├── cache-examples.js.map
    ├── compose-examples.ts
    ├── compose-examples.js
    ├── kotlin-npe-examples.ts
    ├── kotlin-npe-examples.js
    ├── manifest-examples.ts
    ├── manifest-examples.js
    ├── manifest-examples.js.map
    ├── navigation-examples.ts
    ├── navigation-examples.js
    ├── navigation-examples.js.map
    ├── network-examples.ts
    ├── network-examples.js
    ├── network-examples.js.map
    ├── proguard-examples.ts
    ├── proguard-examples.js
    ├── proguard-examples.js.map
    ├── types.d.ts
    ├── types.js
    ├── xml-layout-examples.ts
    └── xml-layout-examples.js
```

### Language Model Integration
```
src/llm/
└── OllamaClient.ts
```

### Monitoring & Performance
```
src/monitoring/
└── PerformanceTracker.ts
```

### Tools
```
src/tools/
├── AndroidBuildTool.ts
├── AndroidDocsSearchTool.ts
├── DependencyGraphTool.ts
├── HistoricalPatternTool.ts
├── LSPTool.ts
├── ManifestAnalyzerTool.ts
├── ReadFileTool.ts
├── SemanticCodeSearchTool.ts
├── shared-types.ts
├── ToolRegistry.ts
└── VersionLookupTool.ts
```

### Utilities
```
src/utils/
├── DiffFormatter.ts
├── ErrorParser.ts
├── FileResolver.ts
├── KotlinNPEParser.ts
├── LanguageDetector.ts
├── PathUtils.ts
└── parsers/
    ├── BaseParser.ts
    ├── GradleParser.ts
    ├── JetpackComposeParser.ts
    ├── KotlinParser.ts
    └── XMLParser.ts
```

---

## Distribution (`dist/`)

**Purpose:** Primary compilation output directory for production builds and npm distribution.

The `dist/` folder contains the complete compiled output:
- **JavaScript Files (.js)** - Compiled ES modules
- **Declaration Files (.d.ts)** - TypeScript type definitions for consumers
- **Source Maps (.js.map, .d.ts.map)** - Debug mappings to original TypeScript

**Structure:** Mirrors the `src/` directory hierarchy:

```
dist/
├── agent/              # Compiled agent system
├── cache/              # Compiled caching modules
├── db/                 # Compiled database services
├── knowledge/          # Compiled knowledge management
├── llm/                # Compiled LLM clients
├── monitoring/         # Compiled performance tracking
├── scripts/            # Compiled utility scripts
├── src/                # Nested src compilation (legacy structure)
├── tests/              # Compiled test utilities
├── tools/              # Compiled tools
├── types.js/.d.ts      # Root type definitions
└── utils/              # Compiled utilities
```

**Note:** The `dist/src/` subdirectory exists due to historical build configuration. Consider flattening in future refactoring.

---

## Tests (`tests/`)

### Test Directories
```
tests/
├── fixtures/
├── golden/
├── integration/
├── real-world/
├── results/
├── tests/
└── unit/
```

### Unit Tests
```
tests/unit/
├── agent/
│   ├── FixGenerator.test.ts
│   ├── QualityValidator.test.ts
│   ├── ResponseValidator.test.ts
│   └── ValidatedMultiPassAgent.test.ts
├── knowledge/
│   ├── agp-versions.test.ts
│   ├── compatibility-matrix.test.ts
│   ├── FewShotExampleService.test.ts
│   └── kotlin-versions.test.ts
├── utils/
│   ├── DiffFormatter.test.ts
│   └── FileResolver.test.ts
├── AgentStateStream.test.ts
├── AndroidBuildTool.test.ts
├── AndroidDocsSearchTool.test.ts
├── ChromaDBClient.test.ts
├── DocumentSynthesizer.test.ts
├── EducationalAgent.test.ts
├── EmbeddingService.test.ts
├── ErrorHasher.test.ts
├── ErrorParser.test.ts
├── FeedbackHandler.test.ts
├── GradleParser.test.ts
├── JetpackComposeParser.test.ts
├── KotlinNPEParser.test.ts
├── KotlinParser.test.ts
├── LanguageDetector.test.ts
├── LSPTool.test.ts
├── ManifestAnalyzerTool.test.ts
├── MinimalReactAgent.test.ts
├── OllamaClient.test.ts
├── PerformanceTracker.test.ts
├── PromptEngine.test.ts
├── QualityManager.test.ts
├── QualityScorer.test.ts
├── rca-collection.test.ts
├── RCACache.test.ts
├── ReadFileTool.test.ts
├── ToolRegistry.test.ts
└── XMLParser.test.ts
```

### Real-World Tests
```
tests/real-world/
└── Phase4TestSuite.ts
```

### Test Fixtures
```
tests/fixtures/
├── performance-test-dataset.ts
└── test-dataset.ts
```

### Test Results

**Note:** Test results contain timestamped JSON files that are generated dynamically. Below is a representative structure:

```
test-results/
├── test-iteration8-output.txt
├── test-iteration9-no-examples.txt
├── test-iteration10-minimal.txt
├── test-iteration11-template.txt
└── archived/
    ├── chunk2/ (timestamped test result JSON files)
    ├── chunk3/ (timestamped test result JSON files)
    ├── chunk4/ (timestamped test result JSON files)
    ├── chunk5/ (timestamped test result JSON files)
    ├── chunk6/ (timestamped test result JSON files)
    ├── chunk7/ (timestamped test result JSON files)
    ├── chunk8/ (timestamped test result JSON files)
    ├── chunk9/ (timestamped test result JSON files)
    ├── phase1/ (timestamped test result JSON files)
    └── phase1-validation-*.json (multiple timestamped files)
    
tests/results/phase4/
├── option-c/
│   ├── comparison-iteration8-vs-optionc-*.json
│   ├── option-c-report-*.json
│   └── validation-metrics-*.json
└── phase4-test-suite-report-*.json (multiple timestamped files)
    test1-agp-version-conflict-*.json (multiple timestamped files)
    test2-kotlin-lateinit-npe-*.json (multiple timestamped files)
    test3-compose-api-breakage-*.json (multiple timestamped files)
    test4-xml-layout-inflation-*.json (multiple timestamped files)
    test5-multi-module-dependency-conflict-*.json (multiple timestamped files)
    test6-manifest-permission-missing-*.json (multiple timestamped files)
    test7-gradle-network-failure-*.json (multiple timestamped files)
    test8-build-cache-corruption-*.json (multiple timestamped files)
    test9-proguard-rule-missing-*.json (multiple timestamped files)
    test10-navigation-argument-mismatch-*.json (multiple timestamped files)
```

---

## Scripts

### Main Scripts

**Note:** Each `.ts` file has corresponding `.js`, `.d.ts`, `.d.ts.map`, and `.js.map` compilation outputs.

```
scripts/
├── benchmark.ts
├── benchmark.js
├── benchmark.d.ts
├── benchmark.d.ts.map
├── benchmark.js.map
├── build-examples.ts
├── build-examples.d.ts
├── build-examples.d.ts.map
├── build-examples.js
├── build-examples.js.map
├── merge-examples-to-json.ts
├── merge-examples-to-json.js
├── merge-examples-to-json.d.ts
├── merge-examples-to-json.d.ts.map
├── merge-examples-to-json.js.map
├── performance-comparison.ts
├── performance-comparison.js
├── performance-comparison.d.ts
├── performance-comparison.d.ts.map
├── performance-comparison.js.map
├── phase4-test-runner.ts
├── phase4-test-runner.js
├── phase4-test-runner.d.ts
├── phase4-test-runner.d.ts.map
├── phase4-test-runner.js.map
├── populate-chromadb.ts
├── populate-chromadb.js
├── populate-chromadb.d.ts
├── populate-chromadb.d.ts.map
├── populate-chromadb.js.map
├── README.md
├── run-accuracy-tests.ts
├── run-accuracy-tests.js
├── run-accuracy-tests.d.ts
├── run-accuracy-tests.d.ts.map
├── run-accuracy-tests.js.map
├── run-all-tests.ts
├── run-all-tests.js
├── run-all-tests.d.ts
├── run-all-tests.d.ts.map
├── run-all-tests.js.map
├── run-performance-tests.ts
├── run-performance-tests.js
├── run-performance-tests.d.ts
├── run-performance-tests.d.ts.map
├── run-performance-tests.js.map
├── run-phase-tests.ts
├── run-phase-tests.js
├── run-phase-tests.d.ts
├── run-phase-tests.d.ts.map
├── run-phase-tests.js.map
├── test-chunk3-improvements.ts
├── test-chunk3-improvements.js
├── test-chunk3-improvements.d.ts
├── test-chunk3-improvements.d.ts.map
├── test-chunk3-improvements.js.map
├── test-mvp-enhanced.ts
├── test-mvp-enhanced.js
├── test-mvp-enhanced.d.ts
├── test-mvp-enhanced.d.ts.map
├── test-mvp-enhanced.js.map
├── test-ollama-connection.ts
├── test-single-case.ts
├── unified-batch-runner.ts
├── unified-batch-runner.js
├── unified-batch-runner.d.ts
├── unified-batch-runner.d.ts.map
├── unified-batch-runner.js.map
├── unified-mvp-test.ts
├── unified-mvp-test.js
├── unified-mvp-test.d.ts
├── unified-mvp-test.d.ts.map
├── unified-mvp-test.js.map
├── validate-setup.ts
├── validate-setup.js
├── validate-setup.d.ts
├── validate-setup.d.ts.map
├── validate-setup.js.map
├── _deprecated_build-examples.ts
├── _deprecated_build-examples.js
├── _deprecated_build-examples.d.ts
├── _deprecated_build-examples.d.ts.map
├── _deprecated_build-examples.js.map
├── _deprecated_chunk1/
│   ├── chunk7-run-all-tests.ts
│   ├── chunk8-run-all-tests.ts
│   ├── chunk9-retest-all.ts
│   ├── phase1-quick-retest.ts
│   ├── phase1-validation.ts
│   ├── phase4-quickstart.ts
│   ├── README.md
│   ├── test-phase1-quick.ts
│   └── test-phase2-validation.ts
├── _deprecated_chunk3/
├── _deprecated_mvp/
├── fix-gradle-tests.js
└── shared/
    ├── test-harness.ts
    ├── test-harness.js
    ├── test-harness.d.ts
    ├── test-harness.d.ts.map
    ├── test-harness.js.map
    ├── test-runner-core.ts
    ├── test-runner-core.js
    ├── test-runner-core.d.ts
    ├── test-runner-core.d.ts.map
    ├── test-runner-core.js.map
    ├── test-types.ts
    ├── test-types.js
    ├── test-types.d.ts
    ├── test-types.d.ts.map
    └── test-types.js.map
```

### Chunk Test Scripts
```
scripts/
├── chunk7-test1-agp-refactored.ts
├── chunk7-test1-agp-refactored.js
├── chunk7-test1-agp-refactored.d.ts
├── chunk7-test1-agp-refactored.d.ts.map
├── chunk7-test1-agp-refactored.js.map
├── chunk7-test1-agp-retest.ts
├── chunk7-test1-agp-retest.js
├── chunk7-test1-agp-retest.d.ts
├── chunk7-test1-agp-retest.d.ts.map
├── chunk7-test1-agp-retest.js.map
├── chunk8-test10-navigation-refactored.ts
├── chunk8-test10-navigation-refactored.js
├── chunk8-test10-navigation-refactored.d.ts
├── chunk8-test10-navigation-refactored.d.ts.map
├── chunk8-test10-navigation-refactored.js.map
├── chunk8-test10-navigation.ts
├── chunk8-test10-navigation.js
├── chunk8-test10-navigation.d.ts
├── chunk8-test10-navigation.d.ts.map
├── chunk8-test10-navigation.js.map
├── chunk8-test6-manifest-refactored.ts
├── chunk8-test6-manifest-refactored.js
├── chunk8-test6-manifest-refactored.d.ts
├── chunk8-test6-manifest-refactored.d.ts.map
├── chunk8-test6-manifest-refactored.js.map
├── chunk8-test6-manifest.ts
├── chunk8-test6-manifest.js
├── chunk8-test6-manifest.d.ts
├── chunk8-test6-manifest.d.ts.map
├── chunk8-test6-manifest.js.map
├── chunk8-test7-gradle-network-refactored.ts
├── chunk8-test7-gradle-network-refactored.js
├── chunk8-test7-gradle-network-refactored.d.ts
├── chunk8-test7-gradle-network-refactored.d.ts.map
├── chunk8-test7-gradle-network-refactored.js.map
├── chunk8-test7-gradle-network.ts
├── chunk8-test7-gradle-network.js
├── chunk8-test7-gradle-network.d.ts
├── chunk8-test7-gradle-network.d.ts.map
├── chunk8-test7-gradle-network.js.map
├── chunk8-test8-build-cache-refactored.ts
├── chunk8-test8-build-cache-refactored.js
├── chunk8-test8-build-cache-refactored.d.ts
├── chunk8-test8-build-cache-refactored.d.ts.map
├── chunk8-test8-build-cache-refactored.js.map
├── chunk8-test8-build-cache.ts
├── chunk8-test8-build-cache.js
├── chunk8-test8-build-cache.d.ts
├── chunk8-test8-build-cache.d.ts.map
├── chunk8-test8-build-cache.js.map
├── chunk8-test9-proguard-refactored.ts
├── chunk8-test9-proguard-refactored.js
├── chunk8-test9-proguard-refactored.d.ts
├── chunk8-test9-proguard-refactored.d.ts.map
├── chunk8-test9-proguard-refactored.js.map
├── chunk8-test9-proguard.ts
├── chunk8-test9-proguard.js
├── chunk8-test9-proguard.d.ts
├── chunk8-test9-proguard.d.ts.map
└── chunk8-test9-proguard.js.map
```

---

## VS Code Extension (`vscode-extension/`)

### Extension Configuration
```
vscode-extension/
├── .eslintrc.json
├── .gitignore
├── .vscodeignore
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── compile-errors.txt
├── errors.log
├── remove-emojis.js
└── rca-agent-extension-2.0.vsix
```

### VS Code Extension Settings
```
vscode-extension/.vscode/
├── launch.json
├── settings.json
└── tasks.json
```

### Extension Source Code
```
vscode-extension/src/
├── extension.ts
├── chat/
│   ├── ChatPromptEngine.ts
│   ├── ChatRequestRouter.ts
│   ├── ContextCollector.ts
│   ├── ConversationalAgent.ts
│   ├── GuidedDebuggingWorkflow.ts
│   ├── RCAChatParticipant.ts
│   └── ResponseStreamer.ts
├── commands/
│   ├── BaseCommandHandler.ts
│   ├── BatchAnalysisCommands.ts
│   ├── ChatActionCommands.ts
│   ├── InlineIntegrationCommands.ts
│   └── TreeViewCommands.ts
├── integrations/
│   ├── BaseProvider.ts
│   ├── RCACodeActionProvider.ts
│   ├── RCADiagnosticProvider.ts
│   ├── RCAHoverProvider.ts
│   ├── RealtimeErrorDetector.ts
│   └── StatusBarManager.ts
├── panel/
│   ├── EmptyStateTemplates.ts
│   ├── ErrorBoundary.ts
│   ├── ErrorQueueManager.ts
│   ├── RCAPanelProvider.ts
│   ├── StateManager.ts
│   ├── types.ts
│   └── webview-content.ts
├── services/
│   ├── AccessibilityService.ts
│   ├── AnalysisService.ts
│   ├── BaseService.ts
│   ├── FeatureFlagManager.ts
│   ├── FixApplicationService.ts
│   ├── NetworkTimeoutHandler.ts
│   ├── PerformanceMonitor.ts
│   └── ThemeManager.ts
├── tools/
│   ├── ExecuteCommandTool.ts
│   ├── FileOperationTool.ts
│   ├── GradleCommandHelper.ts
│   ├── index.ts
│   ├── TerminalTool.ts
│   ├── ToolRegistry.ts
│   └── WorkspaceSearchTool.ts
├── ui/
│   └── RCAWebview.ts
├── utils/
│   └── ErrorHandler.ts
└── views/
    ├── AgentStateViewer.ts
    ├── ErrorTreeProvider.ts
    ├── HistoryTreeProvider.ts
    └── VirtualScrollProvider.ts
```

### Extension Tests
```
vscode-extension/src/test/
├── e2e/
│   └── workflows.test.ts
├── integration/
│   └── chunk5-services.test.ts
├── integrations/
│   ├── RCACodeActionProvider.test.ts
│   └── StatusBarManager.test.ts
├── panel/
│   ├── ErrorQueueManager.test.ts
│   └── StateManager.test.ts
└── views/
    └── TreeProvider.test.ts
```

### Additional Extension Tests
```
vscode-extension/test/
└── integration/
    ├── chatWorkflow.test.ts
    └── interactiveDebugging.test.ts
└── load/
    └── load-test.ts
```

### Extension Output (Compiled)
```
vscode-extension/out/
├── commands/
├── extension.js/js.map
├── integrations/
├── panel/
├── services/
├── src/
├── test/
├── ui/
└── views/
```

**Note:** The `out/` directory mirrors the `src/` structure with compiled JavaScript and source maps.

### Extension Resources
```
vscode-extension/resources/
├── animations.css
└── icons/
    ├── rca-agent-activity-bar.svg
    ├── rca-agent.svg
    ├── status-analyzing.svg
    ├── status-error.svg
    ├── status-idle.svg
    └── status-success.svg
```

---

## Data & Databases

### Temporary Files
```
temp/
└── (temporary build and runtime files)
```

### ChromaDB
```
chroma/
├── chroma.sqlite3
├── 1f0b7ffc-b334-4fd8-8229-ae3da4c6d01f/
│   ├── data_level0.bin
│   ├── header.bin
│   ├── length.bin
│   └── link_lists.bin
└── fabab605-f66d-43d5-8288-11793f975a37/
    ├── data_level0.bin
    ├── header.bin
    ├── length.bin
    └── link_lists.bin
```

### Coverage Reports
```
coverage/
├── clover.xml
├── coverage-final.json
├── lcov.info
└── lcov-report/
    ├── base.css
    ├── block-navigation.js
    ├── favicon.png
    ├── index.html
    ├── prettify.css
    ├── prettify.js
    ├── sort-arrow-sprite.png
    ├── sorter.js
    └── src/
        ├── agent/
        ├── llm/
        ├── tools/
        ├── types.ts.html
        └── utils/
```

---

## Examples & Models

### Examples
```
examples/
└── basic-usage.ts
```

### Ollama Models
```
ollama-models/
└── android-debug-optimized.modelfile
```

---

## Project Statistics

> **Last Generated:** January 5, 2026 | Run `npx ts-node scripts/generate-file-structure-stats.ts` for latest counts

### Overview
- **Total Files:** 2,337
- **Total Directories:** 340
- **Excluded:** docs/, node_modules/, .git/

### File Type Breakdown
| File Type | Count | Purpose |
|-----------|-------|----------|
| **Source Map Files (.map)** | 769 | Debug mapping for compiled code |
| **TypeScript Source Files (.ts)** | 486 | Primary source code |
| **JavaScript Files (.js)** | 466 | Compiled output & scripts |
| **JSON Files (.json)** | 373 | Configuration & test data |
| **Properties Files (.properties)** | 43 | Android/Gradle configuration |
| **Lock Files (.lock)** | 35 | Dependency lock files |
| **Binary Files (.bin)** | 30 | ChromaDB index data |
| **Gradle Files (.gradle)** | 17 | Build configuration |
| **Markdown Files (.md)** | 14 | Documentation (excluding docs/) |
| **HTML Files (.html)** | 14 | Coverage reports & resources |
| **Kotlin Files (.kt/.kts)** | 16 | Test fixtures |
| **Other** | 68 | Icons, configs, databases |

### Largest Directories (by file count)
1. **tests/results/phase4/** - 217 files (test outputs)
2. **scripts/** - 138 files (build & test scripts)
3. **dist/scripts/** - 116 files (compiled scripts)
4. **src/agent/** - 64+ files (core agent system)
5. **src/tools/** - 44+ files (tool implementations)

---

## Key Project Components

### 1. **Core AI Agent System**
   - Multi-pass reasoning agents
   - Adaptive learning pipeline
   - Educational debugging features
   - Quality validation systems

### 2. **Knowledge Management**
   - Few-shot learning examples
   - Semantic example services
   - Vector database integration (ChromaDB)
   - Embedding services

### 3. **Development Tools**
   - Android build automation
   - LSP integration
   - Manifest analyzer
   - Dependency graph tools
   - Code search and analysis

### 4. **VS Code Extension**
   - Chat-based debugging
   - Real-time error detection
   - Code actions and diagnostics
   - Tree view visualizations
   - Webview panels

### 5. **Testing Infrastructure**
   - Unit tests
   - Integration tests
   - E2E workflow tests
   - Performance benchmarks
   - Load testing

### 6. **Utilities & Parsers**
   - Gradle parser
   - Kotlin parser
   - Jetpack Compose parser
   - XML parser
   - Error parsers

---

## Build & Development

### Build Commands
- `npm run build` - Compile TypeScript to `dist/`
- `npm test` - Run Jest test suite
- `npm run benchmark` - Performance benchmarks
- `npm run generate-stats` - Update file structure statistics

### VS Code Extension Development
- `cd vscode-extension` - Navigate to extension directory
- `npm run compile` - Compile extension to `out/`
- `npm run watch` - Watch mode for development
- `F5` - Launch extension in debug mode (VS Code)

### Statistics & Analysis
- `npx ts-node scripts/generate-file-structure-stats.ts` - Generate PROJECT_STRUCTURE_STATS.md
- Output files:
  - `PROJECT_STRUCTURE_STATS.md` - Human-readable report
  - `project-structure-stats.json` - Machine-readable data

---

---

## Documentation

**Note:** The `docs/` folder is excluded from this file structure document to maintain focus on code architecture.

For complete documentation, see:
- **[docs/DOCS_INDEX.md](docs/DOCS_INDEX.md)** - Documentation table of contents
- **[docs/README.md](docs/README.md)** - Documentation overview
- **[docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** - Conceptual architecture
- **[docs/api/](docs/api/)** - API documentation
- **[docs/architecture/](docs/architecture/)** - System design documents
- **[docs/testing/](docs/testing/)** - Testing guides and results

---

**Generated:** January 5, 2026  
**Project:** AI_PP_Project (Root Cause Analysis Agent)  
**Version:** Development Branch (Kai)  
**Statistics Source:** `scripts/generate-file-structure-stats.ts`
