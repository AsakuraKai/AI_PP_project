<<<<<<< HEAD
# 🚀 RCA Agent: Local-First AI Debugging Assistant

> **Mission:** Build a local-first debugging assistant that helps with real development work, starting with Kotlin/Android. Learn about LLM agents, RAG systems, and local AI deployment along the way.

> **Focus:** Personal hobby project for learning and practical use. **No deadlines, no pressure** - just building something useful at my own pace with heavy AI assistance.

> **Hardware:** RTX 3070 Ti (8GB VRAM), 32GB RAM, Ryzen 5 5600x - perfect for running 7B-8B models locally.

---

## 📊 Current Status (Updated: December 15, 2025)

| Component | Status | Progress |
|-----------|--------|----------|
| **Documentation System** | ✅ Complete | 100% |
| **Project Setup** | ⏳ Not Started | 0% |
| **Phase 1: Kotlin/Android** | ⏳ Not Started | 0% |
| Vector DB Setup | ⏳ Planned | 0% |
| ReAct Agent Core | ⏳ Planned | 0% |

**Next Milestone:** Project Setup & Extension Scaffolding  
**Blockers:** None - ready to start coding!

---

## 🎯 What This Project Does

An AI-powered debugging assistant that:
- Analyzes Kotlin/Android errors locally (no cloud needed)
- Provides root cause analysis with fix suggestions
- Learns from your errors over time (vector database)
- Runs entirely on your machine for complete privacy
- Has an "Educational Mode" to help you learn while debugging

**Why Local instead of Cloud?**
- ✅ **No API costs** - run unlimited analyses
- ✅ **Complete privacy** - your code never leaves your machine
- ✅ **No rate limits** - iterate as much as needed
- ✅ **Learns YOUR patterns** - gets better over time
- ✅ **Works offline** - no internet required

---

## 💻 Hardware Requirements

### Your Setup (RTX 3070 Ti)
Perfect for this project! Your 8GB VRAM handles 7B-8B models excellently.

**Expected Performance:**
- **Standard Mode:** 35-50s per analysis (granite-code:8b)
- **Fast Mode:** 16-24s per analysis (qwen-coder:3b)
- **Educational Mode:** 60-80s per analysis (with learning explanations)

### Minimum Requirements
- **GPU:** NVIDIA 8GB+ VRAM (or Apple Silicon 16GB+)
- **RAM:** 16GB minimum, 32GB recommended
- **Storage:** 50GB free (models + vector DB)
- **OS:** Windows 10+, macOS, or Linux

### Model Recommendations
| Model | Size | VRAM | Speed | Best For |
|-------|------|------|-------|----------|
| **granite-code:8b** | 5GB | 4-5GB | 4-6s/iter | Kotlin/Android (Primary) ✅ |
| **qwen-coder:3b** | 2GB | 2-3GB | 2-3s/iter | Fast feedback loops |
| **codellama:7b** | 4GB | 4-5GB | 4-6s/iter | General code debugging |

---

## 🏁 Getting Started

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] VS Code with TypeScript extension
- [ ] Git configured
- [ ] 50GB free disk space

### First-Time Setup (30 minutes)

```bash
# 1. Install Ollama (Windows)
winget install Ollama.Ollama

# 2. Download your first model (5GB - takes 5-10 min)
ollama pull granite-code:8b

# 3. Test model works
ollama run granite-code:8b "Write hello world in Kotlin"

# 4. Install Docker Desktop for ChromaDB
winget install Docker.DockerDesktop

# 5. Verify installations
ollama --version
docker --version
node --version
npm --version
```

### Next Steps
Once prerequisites are ready:
1. Initialize TypeScript project
2. Set up VS Code extension scaffolding
3. Configure ChromaDB with Docker
4. Implement first tools (read_file, parse_error)

📖 **See detailed implementation guide:** [Roadmap.md](Roadmap.md)

---

## 🎓 Phase 1: Kotlin/Android Support

**Goal:** Build a working debugger for Kotlin/Android projects that actually helps during development.

### What Phase 1 Delivers
- ✅ Analyzes Kotlin errors (NullPointerException, lateinit, scope functions)
- ✅ Handles Android lifecycle issues
- ✅ Understands Jetpack Compose errors
- ✅ Parses Gradle build errors
- ✅ XML layout debugging
- ✅ Educational mode for learning Kotlin

### Error Types Covered
| Error Category | Examples |
|----------------|----------|
| **Kotlin Null Safety** | NullPointerException, lateinit not initialized |
| **Jetpack Compose** | Recomposition issues, state handling |
| **Android Lifecycle** | Fragment lifecycle, view access timing |
| **Gradle Builds** | Dependency conflicts, repository issues |
| **XML Layouts** | View inflation, missing attributes |

### Phase 1 Success Criteria
Phase 1 is **complete** when:
- ✅ Can analyze real errors from your Android projects
- ✅ Provides useful root cause analysis
- ✅ Completes in <60s on your GPU
- ✅ Actually helps during development
- ✅ You use it regularly

**Timeline:** Flexible - work at your own pace. No deadlines!

---

## 🚀 Future Phases (Optional)

### Phase 2: TypeScript/JavaScript (When Ready)
- Web development debugging
- React/Vue/Angular errors
- Node.js backend issues

### Phase 3: Python (When Ready)
- Data science debugging
- Django/Flask errors
- General Python scripting

### Phase 4: Polish & Advanced Features (When Ready)
- Better UI/UX
- Fine-tuning on your error patterns
- Multi-file refactoring hints

---

## 📚 Documentation System

This project uses **5 documentation pillars** for complete tracking:

| Document | Purpose | Update |
|----------|---------|--------|
| **[README.md](README.md)** | Project overview, getting started | As needed |
| **[Roadmap.md](Roadmap.md)** | Detailed implementation phases | As needed |
| **[DEVLOG.md](DEVLOG.md)** | Weekly progress journal | Every Friday |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | File tree snapshot | Each milestone |
| **[API_CONTRACTS.md](API_CONTRACTS.md)** | Tool JSON schemas | When tools change |
| **[traceability.md](traceability.md)** | Requirements → Code → Tests | Throughout |
| **[ADRs](architecture/decisions/)** | Design decisions | As made |

### Essential Commands (After Setup)
```bash
# Weekly documentation update
npm run weekly-update

# Individual tasks
npm run generate-structure    # Update file tree
npm run validate-contracts    # Check tool schemas
npm run extract-functions     # Generate function list
npm run quality-check         # Pre-commit validation
```

---

## 🎯 Learning Goals

This project is about **learning first, building second:**

- 🧠 **Learn LLM agent architecture** - ReAct loops, tool use, reasoning
- 💾 **Master vector databases** - ChromaDB, embeddings, RAG systems
- 🤖 **Work with AI assistants** - Effective AI-human collaboration
- 🛠️ **Build useful tools** - Something that actually helps development
- 📈 **Understand local AI** - Model deployment, optimization, quantization

**Success = Personal growth + useful tool**

Not for external validation, publication, or deadlines. Just learning and building something cool.

---

## 🔧 Troubleshooting

### Model won't download
- Check internet connection
- Try smaller model: `ollama pull qwen-coder:3b`
- Verify 5GB+ free disk space

### "ollama: command not found"
- Restart terminal after installation
- Check PATH includes Ollama
- Windows: Reboot after installing

### ChromaDB connection fails
- Ensure Docker Desktop is running
- Check port 8000 not in use
- Try: `docker-compose restart`

### Analysis takes >90s
- Switch to Fast mode (3B model)
- Check GPU is detected: `nvidia-smi`
- Reduce max iterations in settings

---

## 💡 Why This Project?

**The Core Innovation:** Local LLMs can do things cloud services can't:

1. **Unlimited iterations** - No API rate limits
2. **Complete privacy** - Analyze any code, including secrets
3. **Zero cost** - No tokens to pay for
4. **Continuous learning** - Gets better with use
5. **Free model swapping** - Try different models per language

This makes certain debugging tasks **fundamentally better** than cloud-based tools.

---

## 🤝 Contributing (Future)

This is currently a **solo learning project**. If I decide to open-source it later:
- Issues welcome for bugs/suggestions
- PRs must include tests and documentation
- All changes require ADR for architectural decisions
- Must maintain 80%+ test coverage

For now, this is just for me to learn and build something useful.

---

## 📖 Learn More

- 📋 **[Complete Roadmap](Roadmap.md)** - All implementation phases
- 📝 **[Development Log](DEVLOG.md)** - Weekly progress tracking
- 🏗️ **[Architecture Decisions](architecture/decisions/)** - Design rationale
- 📊 **[Metrics Dashboard](metrics.md)** - Performance tracking

---

**Ready to start? Head to the [Getting Started](#-getting-started) section above!**
=======
# 🚀 RCA Agent: Local-First AI Debugging Assistant

> **Mission:** Build a local-first debugging assistant that helps with real development work, starting with Kotlin/Android. Learn about LLM agents, RAG systems, and local AI deployment along the way.

> **Focus:** Personal hobby project for learning and practical use. **No deadlines, no pressure** - just building something useful at my own pace with heavy AI assistance.

> **Hardware:** RTX 3070 Ti (8GB VRAM), 32GB RAM, Ryzen 5 5600x - perfect for running 7B-8B models locally.

---

## 📊 Current Status (Updated: December 15, 2025)

| Component | Status | Progress |
|-----------|--------|----------|
| **Documentation System** | ✅ Complete | 100% |
| **Project Setup** | ⏳ Not Started | 0% |
| **Phase 1: Kotlin/Android** | ⏳ Not Started | 0% |
| Vector DB Setup | ⏳ Planned | 0% |
| ReAct Agent Core | ⏳ Planned | 0% |

**Next Milestone:** Project Setup & Extension Scaffolding  
**Blockers:** None - ready to start coding!

---

## 🎯 What This Project Does

An AI-powered debugging assistant that:
- Analyzes Kotlin/Android errors locally (no cloud needed)
- Provides root cause analysis with fix suggestions
- Learns from your errors over time (vector database)
- Runs entirely on your machine for complete privacy
- Has an "Educational Mode" to help you learn while debugging

**Why Local instead of Cloud?**
- ✅ **No API costs** - run unlimited analyses
- ✅ **Complete privacy** - your code never leaves your machine
- ✅ **No rate limits** - iterate as much as needed
- ✅ **Learns YOUR patterns** - gets better over time
- ✅ **Works offline** - no internet required

---

## 💻 Hardware Requirements

### Your Setup (RTX 3070 Ti)
Perfect for this project! Your 8GB VRAM handles 7B-8B models excellently.

**Expected Performance:**
- **Standard Mode:** 35-50s per analysis (hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest)
- **Fast Mode:** 16-24s per analysis (qwen-coder:3b)
- **Educational Mode:** 60-80s per analysis (with learning explanations)

### Minimum Requirements
- **GPU:** NVIDIA 8GB+ VRAM (or Apple Silicon 16GB+)
- **RAM:** 16GB minimum, 32GB recommended
- **Storage:** 50GB free (models + vector DB)
- **OS:** Windows 10+, macOS, or Linux

### Model Recommendations
| Model | Size | VRAM | Speed | Best For |
|-------|------|------|-------|----------|
| **hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest** | 5GB | 4-5GB | 4-6s/iter | Kotlin/Android (Primary) ✅ |
| **qwen-coder:3b** | 2GB | 2-3GB | 2-3s/iter | Fast feedback loops |
| **codellama:7b** | 4GB | 4-5GB | 4-6s/iter | General code debugging |

---

## 🏁 Getting Started

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] VS Code with TypeScript extension
- [ ] Git configured
- [ ] 50GB free disk space

### First-Time Setup (30 minutes)

```bash
# 1. Install Ollama (Windows)
winget install Ollama.Ollama

# 2. Download your first model (5GB - takes 5-10 min)
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# 3. Test model works
ollama run hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest "Write hello world in Kotlin"

# 4. Install Docker Desktop for ChromaDB
winget install Docker.DockerDesktop

# 5. Verify installations
ollama --version
docker --version
node --version
npm --version
```

### Next Steps
Once prerequisites are ready:
1. Initialize TypeScript project
2. Set up VS Code extension scaffolding
3. Configure ChromaDB with Docker
4. Implement first tools (read_file, parse_error)

📖 **See detailed implementation guide:** [Roadmap.md](Roadmap.md)

---

## 🎓 Phase 1: Kotlin/Android Support

**Goal:** Build a working debugger for Kotlin/Android projects that actually helps during development.

### What Phase 1 Delivers
- ✅ Analyzes Kotlin errors (NullPointerException, lateinit, scope functions)
- ✅ Handles Android lifecycle issues
- ✅ Understands Jetpack Compose errors
- ✅ Parses Gradle build errors
- ✅ XML layout debugging
- ✅ Educational mode for learning Kotlin

### Error Types Covered
| Error Category | Examples |
|----------------|----------|
| **Kotlin Null Safety** | NullPointerException, lateinit not initialized |
| **Jetpack Compose** | Recomposition issues, state handling |
| **Android Lifecycle** | Fragment lifecycle, view access timing |
| **Gradle Builds** | Dependency conflicts, repository issues |
| **XML Layouts** | View inflation, missing attributes |

### Phase 1 Success Criteria
Phase 1 is **complete** when:
- ✅ Can analyze real errors from your Android projects
- ✅ Provides useful root cause analysis
- ✅ Completes in <60s on your GPU
- ✅ Actually helps during development
- ✅ You use it regularly

**Timeline:** Flexible - work at your own pace. No deadlines!

---

## 🚀 Future Phases (Optional)

### Phase 2: TypeScript/JavaScript (When Ready)
- Web development debugging
- React/Vue/Angular errors
- Node.js backend issues

### Phase 3: Python (When Ready)
- Data science debugging
- Django/Flask errors
- General Python scripting

### Phase 4: Polish & Advanced Features (When Ready)
- Better UI/UX
- Fine-tuning on your error patterns
- Multi-file refactoring hints

---

## 📚 Documentation System

This project uses **5 documentation pillars** for complete tracking:

| Document | Purpose | Update |
|----------|---------|--------|
| **[README.md](README.md)** | Project overview, getting started | As needed |
| **[Roadmap.md](Roadmap.md)** | Detailed implementation phases | As needed |
| **[DEVLOG.md](DEVLOG.md)** | Weekly progress journal | Every Friday |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | File tree snapshot | Each milestone |
| **[API_CONTRACTS.md](API_CONTRACTS.md)** | Tool JSON schemas | When tools change |
| **[traceability.md](traceability.md)** | Requirements → Code → Tests | Throughout |
| **[ADRs](architecture/decisions/)** | Design decisions | As made |

### Essential Commands (After Setup)
```bash
# Weekly documentation update
npm run weekly-update

# Individual tasks
npm run generate-structure    # Update file tree
npm run validate-contracts    # Check tool schemas
npm run extract-functions     # Generate function list
npm run quality-check         # Pre-commit validation
```

---

## 🎯 Learning Goals

This project is about **learning first, building second:**

- 🧠 **Learn LLM agent architecture** - ReAct loops, tool use, reasoning
- 💾 **Master vector databases** - ChromaDB, embeddings, RAG systems
- 🤖 **Work with AI assistants** - Effective AI-human collaboration
- 🛠️ **Build useful tools** - Something that actually helps development
- 📈 **Understand local AI** - Model deployment, optimization, quantization

**Success = Personal growth + useful tool**

Not for external validation, publication, or deadlines. Just learning and building something cool.

---

## 🔧 Troubleshooting

### Model won't download
- Check internet connection
- Try smaller model: `ollama pull qwen-coder:3b`
- Verify 5GB+ free disk space

### "ollama: command not found"
- Restart terminal after installation
- Check PATH includes Ollama
- Windows: Reboot after installing

### ChromaDB connection fails
- Ensure Docker Desktop is running
- Check port 8000 not in use
- Try: `docker-compose restart`

### Analysis takes >90s
- Switch to Fast mode (3B model)
- Check GPU is detected: `nvidia-smi`
- Reduce max iterations in settings

---

## 💡 Why This Project?

**The Core Innovation:** Local LLMs can do things cloud services can't:

1. **Unlimited iterations** - No API rate limits
2. **Complete privacy** - Analyze any code, including secrets
3. **Zero cost** - No tokens to pay for
4. **Continuous learning** - Gets better with use
5. **Free model swapping** - Try different models per language

This makes certain debugging tasks **fundamentally better** than cloud-based tools.

---

## 🤝 Contributing (Future)

This is currently a **solo learning project**. If I decide to open-source it later:
- Issues welcome for bugs/suggestions
- PRs must include tests and documentation
- All changes require ADR for architectural decisions
- Must maintain 80%+ test coverage

For now, this is just for me to learn and build something useful.

---

## 📖 Learn More

- 📋 **[Complete Roadmap](Roadmap.md)** - All implementation phases
- 📝 **[Development Log](DEVLOG.md)** - Weekly progress tracking
- 🏗️ **[Architecture Decisions](architecture/decisions/)** - Design rationale
- 📊 **[Metrics Dashboard](metrics.md)** - Performance tracking

---

**Ready to start? Head to the [Getting Started](#-getting-started) section above!**
>>>>>>> 8c58113224bbf7a87a7715a24cf9d7750b167135
