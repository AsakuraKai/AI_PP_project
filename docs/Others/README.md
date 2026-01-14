# [LAUNCH] RCA Agent: Local-First AI Debugging Assistant

**Mission:** Build a local-first debugging assistant for Kotlin/Android development that provides deep root cause analysis using unlimited LLM iterations.

**Focus:** Personal learning project - no deadlines, no external validation needed. Building something useful while learning about LLM agents, RAG systems, and local AI deployment.

**Hardware:** RTX 3070 Ti (8GB VRAM), 32GB RAM, Ryzen 5 5600x

---

## [CHART] Project Status (December 20, 2025)

| Component                     | Status                  | Tests       | Description                                  |
| ----------------------------- | ----------------------- | ----------- | -------------------------------------------- |
| **Chunks 1.1-1.5 (MVP)**      | [DONE] Complete         | 83/83       | Basic RCA agent with Ollama                  |
| **Chunks 2.1-2.4 (Tools)**    | [DONE] Complete         | 109/109     | ErrorParser, LSP, PromptEngine               |
| **Chunks 3.1-3.4 (DB)**       | [DONE] Complete         | 44/44       | ChromaDB, Cache, Feedback                    |
| **Chunk 4.1 (Compose)**       | [DONE] Complete         | 20/20       | Jetpack Compose parser                       |
| **Chunk 4.2 (XML)**           | [DONE] Complete         | 43/43       | XML Layout parser                            |
| **Chunk 4.3 (Gradle)**        | [DONE] Complete         | 26/26       | AndroidBuildTool                             |
| **Chunk 5.1 (Streaming)**     | [DONE] Complete         | 56/56       | AgentStateStream, DocumentSynthesizer        |
| **Chunk 5.2 (Educational)**   | [DONE] Complete         | 24/24       | EducationalAgent with sync/async             |
| **Chunk 5.3 (Performance)**   | [DONE] Complete         | 20/20       | PerformanceTracker with metrics              |
| **Chunk 5.4 (Testing)**       | [DONE] Complete         | 9/9         | Golden test suite with 7 cases               |
| **Chunk 5.5 (Documentation)** | [DONE] Complete         | 0/0         | Complete API, architecture, performance docs |
| **Overall**                   | [SUCCESS] 100% Complete | **869/878** | **PHASE 1 COMPLETE!**                        |

**Current Milestone:** Week 13 - **PHASE 1 BACKEND COMPLETE** [DONE]  
**Next:** VS Code Extension Integration (Sokchea's work)

See [DEVLOG.md](DEVLOG.md) for detailed weekly progress and current status.  
See [testing/TESTING_COMPLETE.md](testing/TESTING_COMPLETE.md) for comprehensive test results and performance metrics.

---

## [TARGET] What This Does

**AI-Powered Local Debugging Assistant:**
- Analyzes Kotlin/Android errors on your machine (complete privacy)
- Provides root cause analysis with actionable fix guidelines  
- Learns from your codebase over time (vector database)
- Unlimited iterations - no API costs or rate limits
- Educational mode explains concepts while debugging

**Supported Error Types (Phase 1):**
- [DONE] Kotlin: NPE, lateinit, type mismatches, imports, compilation
- [DONE] Jetpack Compose: remember, recomposition, LaunchedEffect
- [DONE] XML Layouts: inflation, resources, attributes
- [TIMER] Gradle: dependency conflicts, build failures (next)
- [TIMER] Manifest: merge conflicts, permissions (planned)

---

## [FINISH] Quick Start

### Prerequisites (10 minutes)
```bash
# Install Ollama (LLM Server)
# Windows:
winget install Ollama.Ollama

# Mac/Linux:
curl -fsSL https://ollama.ai/install.sh | sh

# Download AI Model (~5GB, 5-10 min depending on internet)
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# Start Ollama Server
ollama serve

# Verify it's running
# Windows PowerShell:
Invoke-RestMethod -Uri http://localhost:11434/api/tags
# Mac/Linux:
curl http://localhost:11434/api/tags

# Install Docker for ChromaDB
winget install Docker.DockerDesktop
```

### Project Setup
```bash
# Clone and install
git clone <your-repo>
cd AI_PP_project
npm install

# Build
npm run build

# Run tests
npm test
```

### VS Code Extension Setup (2 minutes)

**Option A: Install from VSIX**
1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Extensions: Install from VSIX" and press Enter
4. Navigate to and select `rca-agent-extension-2.0.vsix`
5. Click "Reload Now" when prompted

**Option B: Build from Source**
```bash
cd vscode-extension
npm install
npm run compile
npm install -g @vscode/vsce
vsce package
# Then use Option A to install the generated .vsix file
```

### Test It! (1 minute)

1. **Copy this test error:**
   ```
   Exception in thread "main" kotlin.UninitializedPropertyAccessException: lateinit property myProperty has not been initialized
       at com.example.MyClass.useProperty(MyClass.kt:15)
   ```

2. **Analyze it:**
   - Paste error in any file
   - Open Command Palette (`Ctrl+Shift+P`)
   - Select "RCA Agent: Analyze Error"

3. **View results** in "RCA Agent" output panel (bottom → OUTPUT tab)

### Usage Methods

**Method 1: From Selection** (Fastest)
1. Select error text in editor
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run "RCA Agent: Analyze Error"
4. Results in OUTPUT panel → "RCA Agent"

**Method 2: Command Palette**
1. Press `Ctrl+Shift+P` (`Cmd+Shift+P` on Mac)
2. Type "RCA Agent: Analyze Error"
3. Paste error in input box

**Method 3: Webview Mode** (Best Visual Experience)
1. Select error text
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run "RCA Agent: Analyze Error"
4. Interactive panel opens on right

### Common Commands
```bash
# Start Ollama server
ollama serve

# List models
ollama list

# Test API
curl http://localhost:11434/api/tags

# Run tests
npm test                    # Unit tests (860 tests)
npm run test:accuracy       # Accuracy validation (requires Ollama)
npm run test:golden         # Golden test suite (requires Ollama)
npm run bench               # Performance benchmarks
npm run test:coverage       # Test coverage report
```

---

## [DOCS] Documentation

**[FILE] For complete documentation index, see [DOCS_INDEX.md](DOCS_INDEX.md)**

### API Documentation (New!)
- **[api/Agent.md](api/Agent.md)** - Agent APIs (MinimalReactAgent, EducationalAgent, PromptEngine, etc.)
- **[api/Parsers.md](api/Parsers.md)** - Parser APIs (KotlinParser, GradleParser, JetpackComposeParser, etc.)
- **[api/Tools.md](api/Tools.md)** - Tool APIs (ReadFileTool, LSPTool, AndroidBuildTool, etc.)
- **[api/Database.md](api/Database.md)** - Database APIs (ChromaDBClient, RCACache, QualityManager, etc.)

### Architecture Documentation (New!)
- **[architecture/overview.md](architecture/overview.md)** - System architecture with component diagrams
- **[architecture/agent-workflow.md](architecture/agent-workflow.md)** - Detailed agent reasoning flow (ReAct pattern)
- **[architecture/database-design.md](architecture/database-design.md)** - ChromaDB schema and caching strategy

### Performance Documentation (New!)
- **[performance/benchmarks.md](performance/benchmarks.md)** - Complete performance metrics and optimization guide

### Essential Docs
- **[DEVLOG.md](DEVLOG.md)** - Weekly development journal with current status, progress, metrics, and learnings
- **[testing/TESTING_COMPLETE.md](testing/TESTING_COMPLETE.md)** - Comprehensive test results, performance tools, and validation (99% pass rate)
- **[api/API_CONTRACTS.md](api/API_CONTRACTS.md)** - Tool interfaces and JSON schemas  
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Complete file tree with descriptions
- **[architecture/extension/VSCODE_EXTENSION_GUIDE.md](architecture/extension/VSCODE_EXTENSION_GUIDE.md)** - Complete extension user guide
- **[architecture/EDUCATIONAL_MODE.md](architecture/EDUCATIONAL_MODE.md)** - Educational mode feature guide

### Archived Docs
- **[_archive/](\_archive/)** - Old milestones, phase guides, completion summaries, raw test outputs
- **[_archive/phases/](\_archive/phases/)** - Detailed implementation guides (Phase 1-5)
- **[_archive/milestones/](\_archive/milestones/)** - Chunk completion reports

### Data & Architecture
- **[data/accuracy-metrics.json](data/accuracy-metrics.json)** - Test results and metrics
- **[architecture/decisions/](architecture/decisions/)** - Architecture Decision Records (ADRs)

---

## [TOOL] Performance (RTX 3070 Ti)

**Actual Results (Latest Test Run):**
- [DONE] Average Latency: **75.8s** (target: <90s)
- [DONE] Accuracy: **100%** (10/10 test cases)
- [DONE] Parse Rate: **100%**
- [DONE] Max Latency: 111.5s (2 tests over 90s individual target)

**Model Performance:**
- Primary: hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest (5GB)
- Inference: 4-6s per iteration on GPU
- Total: 40-60s for 8-10 iteration analysis

---

## [IDEA] Why Local LLMs?

**Advantages Over Cloud Services:**

| Cloud (Copilot, etc.) | Local Agent          | Your Advantage        |
| --------------------- | -------------------- | --------------------- |
| 8K token limit        | Unlimited context    | Analyze entire files  |
| Rate limited (5/hour) | Unlimited iterations | Deeper root causes    |
| No sensitive data     | Full access          | Debug production code |
| General model         | Model swapping       | Specialized per task  |
| No learning           | Learns your patterns | Gets better over time |
| Per-token cost        | Zero cost            | Unlimited analyses    |

**Core Innovation:** Local = unlimited iterations, complete privacy, zero cost, continuous learning.

---

## [LEARN] Learning Focus

This project is about **learning**, not external validation:

- [BRAIN] LLM agent architecture (ReAct pattern, tool use)
- [SAVE] Vector databases (ChromaDB, embeddings, RAG)
- [BOT] AI-assisted development workflows
- [FIX] Building useful tools for real problems
- [GRAPH] Local AI deployment and optimization

**Success = Learning + Useful Tool**

No deadlines, no pressure, no publication goals. Just building something cool.

---

## [BUG] Troubleshooting

### Ollama Issues
```bash
# Command not found → restart terminal or add to PATH
# Download slow → 5GB model takes 10-60 min depending on connection
# Model fails → Try smaller: ollama pull qwen-coder:3b
```

### Performance Issues
```bash
# Analysis >90s → Switch to fast mode (3B model)
# GPU not used → Check: nvidia-smi
# Out of memory → Reduce context window or batch size
```

### Database Issues  
```bash
# ChromaDB fails → Check Docker running: docker ps
# Port conflict → Stop other services on port 8000
# Connection timeout → Restart: docker-compose restart
```

---

## [LAUNCH] Next Steps

**[DONE] Phase 1 Backend - COMPLETE!**
- All 5 chunks complete (MVP → Tools → Database → Android → Polish)
- 869/878 tests passing (99% pass rate)
- 85% test coverage
- Comprehensive documentation with API refs, architecture, and benchmarks

**Phase 2: VS Code Extension Integration (Sokchea's Work)**
- Extension UI and command palette
- Webview for RCA results
- Real-time progress streaming
- Feedback buttons (thumbs up/down)
- Settings and configuration

**Future Phases (Optional):**
- Phase 3: TypeScript/JavaScript support
- Phase 4: Python support  
- Phase 5: Advanced features (fine-tuning, multi-file refactoring)

---

**[STAR] Ready to dive in? Check [DEVLOG.md](DEVLOG.md) for current progress or [API_CONTRACTS.md](API_CONTRACTS.md) to understand the system architecture.**