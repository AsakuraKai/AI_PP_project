# 🚀 RCA Agent: Local-First AI Debugging Assistant

> **Mission:** Build a local-first debugging assistant for Kotlin/Android development that provides deep root cause analysis using unlimited LLM iterations.

> **Focus:** Personal learning project - no deadlines, no external validation needed. Building something useful while learning about LLM agents, RAG systems, and local AI deployment.

> **Hardware:** RTX 3070 Ti (8GB VRAM), 32GB RAM, Ryzen 5 5600x

---

## 📊 Project Status (December 19, 2025)

## 📊 Project Status (December 19, 2025)

| Component | Status | Tests | Description |
|-----------|--------|-------|-------------|
| **Chunks 1.1-1.5 (MVP)** | ✅ Complete | 83/83 | Basic RCA agent with Ollama |
| **Chunks 2.1-2.4 (Tools)** | ✅ Complete | 109/109 | ErrorParser, LSP, PromptEngine |
| **Chunks 3.1-3.4 (DB)** | ✅ Complete | 44/44 | ChromaDB, Cache, Feedback |
| **Chunk 4.1 (Compose)** | ✅ Complete | 20/20 | Jetpack Compose parser |
| **Chunk 4.2 (XML)** | ✅ Complete | 43/43 | XML Layout parser |
| **Overall** | 🎯 60% Complete | **628/628** | Phase 1 in progress |

**Current Milestone:** Week 7 - Chunk 4.3 (Gradle Build Analyzer)  
**Next:** Gradle errors, Manifest analysis, Android docs search

See [DEVLOG.md](DEVLOG.md) for detailed weekly progress.

---

## 🎯 What This Does

**AI-Powered Local Debugging Assistant:**
- Analyzes Kotlin/Android errors on your machine (complete privacy)
- Provides root cause analysis with actionable fix guidelines  
- Learns from your codebase over time (vector database)
- Unlimited iterations - no API costs or rate limits
- Educational mode explains concepts while debugging

**Supported Error Types (Phase 1):**
- ✅ Kotlin: NPE, lateinit, type mismatches, imports, compilation
- ✅ Jetpack Compose: remember, recomposition, LaunchedEffect
- ✅ XML Layouts: inflation, resources, attributes
- ⏳ Gradle: dependency conflicts, build failures (next)
- ⏳ Manifest: merge conflicts, permissions (planned)

---

## 🏁 Quick Start

### Prerequisites
```bash
# Install Ollama (Windows)
winget install Ollama.Ollama

# Download model (5GB, ~10 min)
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# Test it works
ollama run hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest "Hello"

# Install Docker for ChromaDB
winget install Docker.DockerDesktop
```

### Common Commands
```bash
# Start Ollama server
ollama serve

# List models
ollama list

# Test API
curl http://localhost:11434/api/tags

# Run tests
npm test                    # Unit tests (628 tests)
npm run test:accuracy      # Accuracy validation (requires Ollama)
npm run bench              # Performance benchmarks
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

---

## 📚 Documentation

### Essential Docs (Read These)
- **[DEVLOG.md](DEVLOG.md)** - Weekly development journal with progress, metrics, and learnings
- **[API_CONTRACTS.md](API_CONTRACTS.md)** - Tool interfaces and JSON schemas  
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Complete file tree with descriptions

### Archived Docs
- **[_archive/](\_archive/)** - Old milestones, phase guides, completion summaries
- **[_archive/phases/](\_archive/phases/)** - Detailed implementation guides (Phase 1-5)
- **[_archive/milestones/](\_archive/milestones/)** - Chunk completion reports

### Data & Architecture
- **[data/accuracy-metrics.json](data/accuracy-metrics.json)** - Test results and metrics
- **[architecture/decisions/](architecture/decisions/)** - Architecture Decision Records (ADRs)

---

## 🔧 Performance (RTX 3070 Ti)

**Actual Results (Latest Test Run):**
- ✅ Average Latency: **75.8s** (target: <90s)
- ✅ Accuracy: **100%** (10/10 test cases)
- ✅ Parse Rate: **100%**
- ✅ Max Latency: 111.5s (2 tests over 90s individual target)

**Model Performance:**
- Primary: hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest (5GB)
- Inference: 4-6s per iteration on GPU
- Total: 40-60s for 8-10 iteration analysis

---

## 💡 Why Local LLMs?

**Advantages Over Cloud Services:**

| Cloud (Copilot, etc.) | Local Agent | Your Advantage |
|----------------------|-------------|----------------|
| 8K token limit | Unlimited context | Analyze entire files |
| Rate limited (5/hour) | Unlimited iterations | Deeper root causes |
| No sensitive data | Full access | Debug production code |
| General model | Model swapping | Specialized per task |
| No learning | Learns your patterns | Gets better over time |
| Per-token cost | Zero cost | Unlimited analyses |

**Core Innovation:** Local = unlimited iterations, complete privacy, zero cost, continuous learning.

---

## 🎓 Learning Focus

This project is about **learning**, not external validation:

- 🧠 LLM agent architecture (ReAct pattern, tool use)
- 💾 Vector databases (ChromaDB, embeddings, RAG)
- 🤖 AI-assisted development workflows
- 🛠️ Building useful tools for real problems
- 📈 Local AI deployment and optimization

**Success = Learning + Useful Tool**

No deadlines, no pressure, no publication goals. Just building something cool.

---

## 🐛 Troubleshooting

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

## 🚀 Next Steps

**Phase 1 Remaining (Weeks 7-12):**
- Chunk 4.3: Gradle Build Analyzer (dependency conflicts)
- Chunk 4.4: Manifest & Android Docs
- Chunk 4.5: Android Testing & Refinement
- Chunk 5: Polish, optimization, educational mode

**Future Phases (Optional):**
- Phase 2: TypeScript/JavaScript support
- Phase 3: Python support  
- Phase 4: Advanced features (fine-tuning, multi-file refactoring)

---

**🌟 Ready to dive in? Check [DEVLOG.md](DEVLOG.md) for current progress or [API_CONTRACTS.md](API_CONTRACTS.md) to understand the system architecture.**
>>>>>>> 8c58113224bbf7a87a7715a24cf9d7750b167135
