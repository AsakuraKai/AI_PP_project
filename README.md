# RCA Agent: Local-First AI Debugging Assistant

> **Personal Learning Project** - Building a local AI debugging assistant for Kotlin/Android development.  
> **Current Status:** Week 8 Complete - Chunks 1.1-4.5 ✅ (772/772 tests passing) - ANDROID BACKEND COMPLETE! (Optimization In Progress)

---

## 📚 Documentation

All project documentation is organized in the `docs/` folder:

### Quick Links
- **[Project Overview & Setup](docs/README.md)** - What this is, hardware requirements, getting started
- **[Development Log (DEVLOG)](docs/DEVLOG.md)** - Weekly progress journal with all implementation details
- **[Roadmap](docs/Roadmap.md)** - Complete phase-by-phase implementation plan
- **[Current Status Report](docs/CHUNK-2-STATUS-REPORT.md)** - Latest chunk completion status
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - File organization and statistics

### Milestone Documentation
- [Chunk 1.1-1.3 Complete](docs/_archive/milestones/Chunk-1.1-1.3-COMPLETE.md) - LLM Client, Parser, Agent (Dec 17-18)
- [Chunk 1.4 Complete](docs/_archive/milestones/Chunk-1.4-COMPLETE.md) - File Reading Tool (Dec 18)
- [Chunk 1.5 Complete](docs/_archive/milestones/Chunk-1.5-COMPLETE.md) - MVP Testing (Dec 18)
- [Chunk 2.1 Complete](docs/_archive/milestones/Chunk-2.1-COMPLETE.md) - Full Error Parser (Dec 18)
- [Chunk 2.2-2.3 Complete](docs/_archive/milestones/Chunk-2.2-2.3-COMPLETE.md) - Tools & Prompts (Dec 18)
- [Chunk 2.4 Complete](docs/_archive/milestones/Chunk-2.4-COMPLETE.md) - Agent Integration ✅ (Dec 19)
- [Chunk 2 Summary Complete](docs/_archive/milestones/Chunk-2-COMPLETE-Summary.md) - Complete Chunk 2 Overview ✅ (Dec 18-19)
- [Chunk 3.1 Complete](docs/_archive/milestones/Chunk-3.1-COMPLETE.md) - ChromaDB Setup ✅ (Dec 19)
- [Chunk 3.2 Complete](docs/_archive/milestones/Chunk-3.2-COMPLETE.md) - Embedding & Search ✅ (Dec 19)
- [Chunk 3.3 Complete](docs/_archive/milestones/Chunk-3.3-COMPLETE.md) - Caching System ✅ (Dec 19)
- [Chunk 3.4 Complete](docs/_archive/milestones/Chunk-3.4-COMPLETE.md) - User Feedback System ✅ (Dec 19)
- [Chunk 4.1 Complete](docs/_archive/milestones/Chunk-4.1-COMPLETE.md) - Jetpack Compose Parser ✅ (Dec 19)
- [Chunk 4.2 Complete](docs/_archive/milestones/Chunk-4.2-COMPLETE.md) - XML Layout Parser ✅ (Dec 19)
- [Chunk 4.3 Complete](docs/_archive/milestones/Chunk-4.3-COMPLETE.md) - Gradle Build Analyzer ✅ (Dec 19)
- [Chunk 4.4-4.5 Complete](docs/_archive/milestones/Chunk-4.4-4.5-COMPLETE.md) - Manifest & Docs + Testing ✅ (Dec 19)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Ollama with DeepSeek-R1-Distill-Qwen-7B-GGUF:latest model
- TypeScript 5+

### Installation
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run accuracy tests (requires Ollama)
npm run test:accuracy
```

### Current Implementation Status

**✅ Completed (Weeks 1-8):**
- **Chunks 1.1-1.5:** MVP Backend (OllamaClient, Parser, Agent, ReadFileTool, Testing)
- **Chunks 2.1-2.4:** Core Tools Backend (Full parser, LSP tools, PromptEngine, Integration)
- **Chunks 3.1-3.4:** Database Backend (ChromaDB, Embedding, Caching, User Feedback)
- **Chunks 4.1-4.3:** Android Parsers (Compose, XML, Gradle) ✅
- **Chunks 4.4-4.5:** Android Tools & Testing (Manifest, Docs, 20 test cases) ✅
- 30 source files (~9,000 lines)
- 772 tests (100% passing)
- 95%+ code coverage
- 18+ error types supported (Kotlin, Gradle, Compose, XML, Manifest)
- 5 tools implemented (ReadFile, LSP, AndroidBuild, Manifest, Docs)
- 20 real Android test cases (35% baseline accuracy, optimizing to 70%)
- Dynamic tool execution with ToolRegistry
- Few-shot prompting with PromptEngine
- ChromaDB for RCA storage and semantic search
- User feedback system with quality management
- Fully integrated agent with backward compatibility

**🎯 Next Up (Week 9):**
- Parser optimization (reach 70% Android accuracy target)
- Update all documentation
- Begin Chunk 5.1: Agent State Streaming

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Total Source Files | 30 files |
| Total Tests | 772 (100% passing) |
| Code Coverage | 95%+ |
| Build Time | ~15s |
| Lines of Code | ~9,000 |
| Documentation | ~15,000 lines |
| Android Accuracy | 35% (baseline, optimizing to 70%) |

---

## 📖 Learn More

See [docs/README.md](docs/README.md) for comprehensive project documentation.
