winget install Ollama.Ollama
## Slide Presentation (Concise Outline for Deck Authoring)

### 1. Introduction
- Local-first AI agent for Kotlin/Android debugging; runs fully offline on consumer GPU (3070 Ti, 8GB).
- Goal: practical debugging help plus learning about LLM agents, RAG, and ReAct prompting.

### 2. Problem Statement
- Need unlimited, privacy-preserving RCA without API cost, rate limits, or truncated context.
- Target: reliable Kotlin/Android error analysis using a small local model.

### 3. Objective
- Specialized assistant for Kotlin/Android errors.
- Validate local-first viability (100% parse accuracy, 3.91s latency, 37.5% cache hit rate).
- Ship reusable pieces: parsers, prompt templates, caching, VS Code extension UI.

### 4. Literature Review

| No.                       | Author & Year                                          | Focus / Method                                                               | Dataset / Model                                                                                    | Key Contribution                                                                                                                        | RCA Agent Difference                                                                                                                                     |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                         | **Yao et al. (2022)** <br> *ReAct Framework*           | Reasoning + Action loops for LLM agents                                      | HotpotQA, FEVER, ALFWorld (General QA)                                                             | Interleaved reasoning traces improve task performance by 27%                                                                            | Adapted ReAct for **domain-specific Android debugging** with specialized tools (LSP, file resolver, version lookup)                                      |
| 2                         | **Chen et al. (2023)** <br> *Self-Debugging*           | Code generation with execution feedback                                      | Spider, MBPP, GSM8K (Code/Math)                                                                    | LLMs can iteratively improve code via execution feedback (+7% accuracy)                                                                 | Applied self-debugging to **error analysis in existing code**, not code generation; uses 7B local models vs GPT-3.5+                                     |
| 3                         | **Jimenez et al. (2024)** <br> *SWE-agent*             | Agent-Computer Interface for software engineering                            | 2,294 GitHub issues (Python repos)                                                                 | Specialized interfaces boost agent performance (12.5% → 18% issue resolution)                                                           | Extended ACI concept to **Kotlin/Android specifics** (26+ error types, manifest parsing, Gradle analysis); **100% local execution** vs cloud-based GPT-4 |
| 4                         | **Cloud Copilots** <br> (ChatGPT, Copilot, Codeium)    | Cloud-based LLM APIs with web integration                                    | Proprietary training data (billions of tokens)                                                     | Accuracy (70-85%+), multi-language support(Future Implementation)                                                                       | **Zero API cost**, full privacy, runs entirely offline on consumer GPU; trades 10-20% accuracy for unlimited iterations and no rate limits               |
| 5                         | **LocalAI / Cline** <br> *(Existing local frameworks)* | Local model deployment with generic tools                                    | Open-source models (Llama, Mistral, etc.)                                                          | Demonstrates feasibility of local-first AI; broad language support                                                                      | **Domain-specialized**: 26 error parsers + template-based prompting; comprehensive testing (1,111 tests, 100% parse accuracy)                            |
| **RCA Agent (This Work)** | Template-based prompting + ReAct + RAG                 | 96 test cases + 9 real projects (105 resources), DeepSeek-R1-Distill-Qwen-7B | **Combined approach**: structured templates + multi-pass reasoning + vector DB for semantic search | **100% parse accuracy**; **3.91s average latency**; **37.5% L1 cache hit rate**; full offline execution; reusable parsers and templates |

**Key Research Gaps Addressed:**
- Local-first on consumer hardware
- Domain-specific optimization for mobile development
- Template-based prompting as small-model alternative
- Privacy-preserving with zero external dependencies

### 5. Methodology
- Data: 96 test cases + 9 real buildable projects (105 test resources) across 26 error types; version metadata (AGP, Kotlin).
- Preprocess: detect language → specialized parser → add context (files/deps/symbols) → structured prompt.
- Architecture: VS Code UI → ReAct agent → tools (LSP, build/version lookups) → prompt/RAG → DeepSeek-R1-Distill-Qwen-7B (quantized).
- Training: prompt-engineering only; temp 0.7, top-p 0.9, 3–5 iterations; GPU inference.
- Tests: 1,111 test cases executed; track latency (3.91s avg) and cache hit rate (37.5% L1).

### 6. Technology Stack

| Category                    | Technologies                                                | Purpose                                                         |
| --------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| **Programming Languages**   | TypeScript (backend), Python (scripts), Kotlin (test cases) | Core implementation, automation, test data                      |
| **LLM Framework**           | Ollama, DeepSeek-R1-Distill-Qwen-7B                         | Local model deployment and inference (7B params, quantized)     |
| **Vector Database**         | ChromaDB                                                    | Semantic similarity search, few-shot example retrieval, caching |
| **Testing**                 | Jest, ts-jest                                               | Unit testing (878 tests), coverage reporting (99%+)             |
| **Development Environment** | VS Code Extension API                                       | IDE integration, UI panels, command palette                     |
| **Build Tools**             | TypeScript compiler, npm, Vite                              | Code compilation, dependency management, extension bundling     |
| **Language Services**       | LSP (Language Server Protocol)                              | Code parsing, symbol resolution, file context retrieval         |
| **Version Control**         | Git                                                         | Source control and change tracking                              |
| **Hardware**                | RTX 3070 Ti (8GB VRAM), AMD Ryzen 5 5600x, 32GB RAM         | GPU inference, consumer-grade local deployment                  |
| **Parsers (Custom)**        | 26 error-specific parsers                                   | Kotlin, Gradle, Jetpack Compose, XML error extraction           |

**Key Technical Decisions:**
- Template-based prompting over few-shot learning (3% accuracy gain)
- Multi-pass ReAct agent with tool orchestration (5 specialized tools)
- Deterministic error hashing for cache efficiency (60%+ hit rate)
- Async parallel tool execution for latency optimization

### 7. Conclusion
- Local-first works: full privacy, no API spend, 3.91s average latency on consumer GPU.
- Structured templates + specialized parsers achieve 100% parsing accuracy; 37.5% L1 cache hit rate significantly improves responsiveness.

### 8. Future Improvement
- Try 13B or hybrid template + few-shot to raise accuracy.
- Broaden parser coverage and datasets; tighten latency with batching/caching tweaks.
- Add feedback loops and clearer UI guidance in the extension.
**Project Homepage:** [[Your GitHub/Website](https://github.com/AsakuraKai/AI_PP_project.git)]