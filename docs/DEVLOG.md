# Development Log - RCA Agent: Local-First AI Debugging Assistant

> **Purpose:** Weekly journal of all development progress, decisions, and learnings  
> **Project Type:** Personal learning project - Kotlin/Android debugging assistant  
> **Timeline:** Flexible - no deadlines, work at your own pace  
> **Update Frequency:** End of each week (every Friday)  
> **Status Legend:** 🟢 On Track | 🟡 Learning Challenge | 🔴 Blocked | ✅ Complete

---

## Project Mission

**Goal:** Build a local-first debugging assistant that actually helps with Kotlin/Android development while learning about LLM agents, RAG systems, and local AI deployment.

**What Makes This Interesting:**
- 🔓 Unlimited context - No token limits or costs
- ♾️ Unlimited iterations - No API rate limits
- 🔒 Complete privacy - Code stays on your machine
- 📈 Continuous learning - Gets better over time
- 🎓 Educational mode - Learn while debugging

**This is for:** Personal learning, practical use, fun exploration  
**Not for:** Publication, external validation, strict deadlines

---

## Current Status

**Phase:** Pre-Development (Planning Complete)  
**Next Milestone:** Project Setup & Extension Scaffolding  
**Overall Status:** 🟢 Ready to Begin Coding

---

## Week 0 - Project Planning & Documentation
**Date Range:** December 14-15, 2025  
**Milestone:** Documentation Setup  
**Status:** ✅ Complete

### Summary
Completed documentation system for tracking development progress. Set up 5-pillar documentation strategy (README, DEVLOG, PROJECT_STRUCTURE, API_CONTRACTS, traceability, ADRs) for maintainable development. Clarified project scope: Phase 1 focuses exclusively on Kotlin/Android support - this is a personal learning project, not research publication.

### Files Created/Modified
| File Path | Purpose | Key Content | Status |
|-----------|---------|-------------|--------|
| `docs/README.md` | Project overview & getting started guide | What this is, hardware requirements, Phase 1 goals, troubleshooting | ✅ |
| `docs/Roadmap.md` | Detailed implementation phases | Complete Phase 1 breakdown, milestones, code examples, architecture | ✅ |
| `.github/copilot-instructions.md` | AI assistant guidance | Kotlin/Android focus, development workflow, documentation standards | ✅ |
| `docs/DEVLOG.md` | Development journal | This file - weekly progress tracking | ✅ |
| `docs/PROJECT_STRUCTURE.md` | File tree snapshot | Current structure, planned structure for Phase 1 | ✅ |
| `docs/API_CONTRACTS.md` | Tool interface specifications | JSON schemas for all LLM tools | ✅ |
| `docs/traceability.md` | Requirements tracking | Phase 1 requirements mapped to implementation | ✅ |
| `docs/metrics.md` | Performance tracking | Code stats, performance benchmarks | ✅ |
| `docs/metrics.md` | Performance & quality metrics dashboard | Code stats, performance benchmarks, milestone tracking | ✅ |
| `docs/architecture/decisions/README.md` | ADR index and guidelines | ADR lifecycle, naming conventions, current ADR list | ✅ |
| `docs/architecture/decisions/ADR-TEMPLATE.md` | Template for new ADRs | Comprehensive template with all required sections | ✅ |

### Files Deleted (Cleanup)
| File Path | Reason | Content Disposition |
|-----------|--------|---------------------|
| `docs/QUICKSTART.md` | Redundant with README.md | Setup instructions absorbed into README Phase 1 |
| `docs/goals.md` | Original vision captured | Content moved to README.md mission statement |

### Directories Created
| Directory Path | Purpose | Status |
|----------------|---------|--------|
| `docs/architecture/decisions/` | Store Architecture Decision Records | ✅ Ready |
| `docs/architecture/diagrams/` | System design diagrams (UML, sequence, etc.) | ✅ Ready |
| `docs/milestones/` | Milestone completion summaries | ✅ Ready |

### Architecture Decisions

#### Decision 001: Dual LLM Provider Strategy
- **Date:** December 14, 2025
- **Decision:** Support both local (Ollama) and cloud (OpenAI, Anthropic, Gemini) LLMs with runtime switching
- **Rationale:** 
  - Users need cost control via local models (<10B params: 3B-8B range)
  - Cloud APIs provide superior performance for complex reasoning
  - Fallback chain ensures availability (local → cloud if local fails)
- **Trade-offs:**
  - **Pros:** User flexibility, cost optimization, resilience
  - **Cons:** Increased complexity, 2x testing matrix, provider abstraction overhead
- **Implementation Strategy:**
  - Abstract `LLMProvider` interface
  - Concrete classes: `OllamaClient`, `OpenAIClient`, `AnthropicClient`, `GeminiClient`
  - `ProviderFactory` handles runtime selection based on user config
  - Configuration: `settings.json` with provider priority (local-first vs cloud-first)
- **Future Implications:** 
  - New providers can be added by implementing `LLMProvider` interface
  - Each provider needs separate API key management via VS Code SecretStorage

#### Decision 002: Focused Language Strategy (Depth Over Breadth)
- **Date:** December 14, 2025
- **Decision:** Focus on 2-4 popular languages (TypeScript, Python as primary; Java/C++ as secondary) rather than comprehensive multi-language support
- **Rationale:**
  - 2-person team with flexible timeline prioritizes research quality
  - Depth more valuable than breadth for proving local LLM advantages
  - TypeScript + Python cover most modern development
  - Can expand to Java/C++ after core research validated (Month 19+)
  - Allows unlimited context experiments on large codebases
- **Trade-offs:**
  - **Pros:** Deeper analysis, better evaluation, manageable scope, focused experimentation
  - **Cons:** Limited initial market, language-specific optimizations
- **Implementation Strategy:**
  - Months 1-8: Perfect TypeScript + Python support
  - Month 19+: Add Java or C++ for multi-language validation
  - Language detection from file extension + stack trace patterns
  - Modular error parsers (reusable architecture)
  - LSP integration per language (TSServer, Pylance initially)
- **Future Implications:**
  - Research results will be language-specific initially
  - Multi-language validation strengthens publication

#### Decision 003: ChromaDB for Vector Storage
- **Date:** December 14, 2025
- **Decision:** Use ChromaDB for storing and retrieving past RCA solutions
- **Rationale:**
  - Lightweight, runs locally or in Docker
  - Native embedding support (no separate Pinecone/Weaviate needed)
  - Python + TypeScript clients available
  - Free and open-source
- **Alternatives Considered:**
  - **Pinecone:** Cloud-only, costs money, overkill for local extension
  - **FAISS:** No metadata filtering, harder to update documents
  - **PostgreSQL + pgvector:** Requires DB management, heavier setup
- **Implementation Strategy:**
  - Docker Compose for local ChromaDB server
  - Dual embedding: local (`all-MiniLM-L6-v2`) + cloud (`text-embedding-3-small`)
  - Collection schema: `error_type`, `language`, `stack_trace`, `solution`, `confidence`, `user_validated`
- **Future Implications:**
  - Easy to add new collections (e.g., separate collection for code patterns)
  - Can export/import RCA database for sharing across teams

### Blockers & Solutions
**No blockers this week** - Planning phase completed successfully.

### Key Insights
1. **Development Tracking is Critical:** With 12 weeks and multiple phases, losing track of progress is a real risk. DEVLOG.md + PROJECT_STRUCTURE.md solve this.
2. **Tool Contracts Must Be Defined Early:** LLM depends on structured JSON responses. Defining schemas upfront (Week 1.3) prevents refactoring later.
3. **Performance Targets Drive Architecture:** <45s RCA generation requirement means:
   - Parallel tool execution where possible
   - Efficient vector search (k=5 max)
   - LLM response streaming
   - Caching for repeated tool calls

### Next Week Goals (Week 1)
**Milestone 1.1-1.2: Extension Scaffold + Vector DB Setup**

- [ ] Initialize VS Code extension project with TypeScript
  - [ ] Configure `tsconfig.json`, ESLint, Prettier
  - [ ] Implement `activate()` function with command registration
  - [ ] Test "Hello World" command in Extension Development Host
- [ ] Set up ChromaDB
  - [ ] Create `docker-compose.yml` for local server
  - [ ] Implement `ChromaDBClient.ts` with connection logic
  - [ ] Create `rca_solutions` collection with schema
  - [ ] Verify end-to-end: embed sample error → store → retrieve
- [ ] Begin dual embedding service
  - [ ] Research `all-MiniLM-L6-v2` integration (HuggingFace Transformers.js)
  - [ ] Implement OpenAI embedding fallback
- [ ] Document all files created in DEVLOG Week 1 section

**Expected Deliverables:**
- Working VS Code extension (minimal)
- ChromaDB running and accessible
- First end-to-end test passing

---

## Week 1 - Foundation Setup
**Date Range:** [TO BE FILLED]  
**Milestone:** 1.1-1.2  
**Status:** 🔵 Not Started

### Files Created/Modified
| File Path | Purpose | Key Functions/Classes | Status |
|-----------|---------|----------------------|--------|
| `package.json` | Extension manifest | Commands, activation events | ☐ |
| `tsconfig.json` | TypeScript config | Strict mode, ES2020 target | ☐ |
| `src/extension.ts` | Entry point | `activate()`, `deactivate()` | ☐ |
| ... | ... | ... | ... |

*(To be filled as development progresses)*

---

## Development Metrics

### Code Statistics (As of Week 0)
- **Total Files:** 4 (documentation only)
- **Lines of Code:** 0 (no implementation yet)
- **Test Coverage:** N/A
- **Functions Implemented:** 0
- **Classes Created:** 0

### Milestone Progress
| Milestone | Status | Completion Date | Blockers |
|-----------|--------|----------------|----------|
| 1.1 Project Setup | 🔵 Not Started | - | - |
| 1.2 Database Backend | 🔵 Not Started | - | - |
| 1.3 Tool Wrapper APIs | 🔵 Not Started | - | - |
| 1.4 Test Integration | 🔵 Not Started | - | - |

---

## Technical Debt Log
*(Track shortcuts taken during development that need future refactoring)*

| Issue | Location | Severity | Reason | Plan to Address |
|-------|----------|----------|--------|-----------------|
| *(None yet)* | - | - | - | - |

---

## Learning Resources & References
*(Useful links discovered during development)*

| Resource | URL | Relevant To | Notes |
|----------|-----|-------------|-------|
| VS Code Extension API | https://code.visualstudio.com/api | All phases | Official API documentation |
| ChromaDB Docs | https://docs.trychroma.com/ | Phase 1 | Vector DB setup guide |
| ReAct Paper | https://arxiv.org/abs/2210.03629 | Phase 2 | Original agent framework |
| Ollama API | https://github.com/ollama/ollama/blob/main/docs/api.md | Phase 2 | Local LLM integration |

---

## Questions & Open Items
*(Unresolved questions that need decisions)*

1. **Embedding Model Selection:** Should we prioritize `all-MiniLM-L6-v2` (fast, local) or `text-embedding-3-small` (better quality, requires API)? → **Decision:** Support both, make configurable
2. **Error Context Window:** How many lines of code should `get_code_context` tool retrieve? → **To be determined in Week 3 based on testing**
3. **Web Search Provider:** DuckDuckGo (free, limited) vs Serper API (paid, better)? → **To be decided Week 7**

---

## Feedback & Retrospectives
*(After each phase, reflect on what worked and what didn't)*

### Phase 1 Retrospective (To be filled after Week 4)
- **What went well:**
- **What could be improved:**
- **Action items for Phase 2:**

---

**Last Updated:** December 14, 2025  
**Next Update Due:** December 20, 2025 (End of Week 1)
