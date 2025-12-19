# RCA Agent: Local-First AI Debugging Assistant

> **Personal Learning Project** - Building a local AI debugging assistant for Kotlin/Android development.  
> **Current Status:** Week 5 Complete - Chunks 1.1-3.4 ✅ (536/536 tests passing) - CHUNK 3 (Database Backend) COMPLETE!

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
- [Chunk 1.1-1.3 Complete](docs/milestones/Chunk-1.1-1.3-COMPLETE.md) - LLM Client, Parser, Agent (Dec 17-18)
- [Chunk 1.4 Complete](docs/milestones/Chunk-1.4-COMPLETE.md) - File Reading Tool (Dec 18)
- [Chunk 1.5 Complete](docs/milestones/Chunk-1.5-COMPLETE.md) - MVP Testing (Dec 18)
- [Chunk 2.1 Complete](docs/milestones/Chunk-2.1-COMPLETE.md) - Full Error Parser (Dec 18)
- [Chunk 2.2-2.3 Complete](docs/milestones/Chunk-2.2-2.3-COMPLETE.md) - Tools & Prompts (Dec 18)
- [Chunk 2.4 Complete](docs/milestones/Chunk-2.4-COMPLETE.md) - Agent Integration ✅ (Dec 19)
- [Chunk 2 Summary Complete](docs/milestones/Chunk-2-COMPLETE-Summary.md) - Complete Chunk 2 Overview ✅ (Dec 18-19)
- [Chunk 3.1 Complete](docs/milestones/Chunk-3.1-COMPLETE.md) - ChromaDB Setup ✅ (Dec 19)
- [Chunk 3.2 Complete](docs/milestones/Chunk-3.2-COMPLETE.md) - Embedding & Search ✅ (Dec 19)
- [Chunk 3.3 Complete](docs/milestones/Chunk-3.3-COMPLETE.md) - Caching System ✅ (Dec 19)
- [Chunk 3.4 Complete](docs/milestones/Chunk-3.4-COMPLETE.md) - User Feedback System ✅ (Dec 19)

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

**✅ Completed (Week 1-5):**
- **Chunks 1.1-1.5:** MVP Backend (OllamaClient, Parser, Agent, ReadFileTool, Testing)
- **Chunks 2.1-2.4:** Core Tools Backend (Full parser, LSP tools, PromptEngine, Integration)
- **Chunks 3.1-3.4:** Database Backend (ChromaDB, Embedding, Caching, User Feedback) ✅
- 21 source files (~6,300 lines)
- 536 tests (100% passing)
- 90%+ code coverage
- 11 error types supported (Kotlin, Gradle)
- Dynamic tool execution with ToolRegistry
- Few-shot prompting with PromptEngine
- ChromaDB for RCA storage and semantic search
- User feedback system with quality management
- Fully integrated agent with backward compatibility

**🎯 Next Up (Week 6):**
- Chunk 4.1: Jetpack Compose Parser
- Android-specific error parsers
- Compose error types (remember, LaunchedEffect, recomposition)
- XML layout inflation errors

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Total Source Files | 21 files |
| Total Tests | 536 (100% passing) |
| Code Coverage | 90%+ |
| Build Time | ~15s |
| Lines of Code | ~6,300 |
| Documentation | ~10,000 lines |

---

## 📖 Learn More

See [docs/README.md](docs/README.md) for comprehensive project documentation.
