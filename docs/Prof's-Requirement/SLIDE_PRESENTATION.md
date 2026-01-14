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
- Validate local-first viability (61% analysis accuracy, 100% parse accuracy, 45–55s latency).
- Ship reusable pieces: parsers, prompt templates, caching, VS Code extension UI.

### 4. Literature Review

| No.                       | Author & Year                                          | Focus / Method                                    | Dataset / Model                                                                                    | Key Contribution                                                                                                                         | RCA Agent Difference                                                                                                                                       |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                         | **Yao et al. (2022)** <br> *ReAct Framework*           | Reasoning + Action loops for LLM agents           | HotpotQA, FEVER, ALFWorld (General QA)                                                             | Interleaved reasoning traces improve task performance by 27%                                                                             | Adapted ReAct for **domain-specific Android debugging** with specialized tools (LSP, file resolver, version lookup)                                        |
| 2                         | **Chen et al. (2023)** <br> *Self-Debugging*           | Code generation with execution feedback           | Spider, MBPP, GSM8K (Code/Math)                                                                    | LLMs can iteratively improve code via execution feedback (+7% accuracy)                                                                  | Applied self-debugging to **error analysis in existing code**, not code generation; uses 7B local models vs GPT-3.5+                                       |
| 3                         | **Jimenez et al. (2024)** <br> *SWE-agent*             | Agent-Computer Interface for software engineering | 2,294 GitHub issues (Python repos)                                                                 | Specialized interfaces boost agent performance (12.5% → 18% issue resolution)                                                            | Extended ACI concept to **Kotlin/Android specifics** (26+ error types, manifest parsing, Gradle analysis); **100% local execution** vs cloud-based GPT-4   |
| 4                         | **Cloud Copilots** <br> (ChatGPT, Copilot, Codeium)    | Cloud-based LLM APIs with web integration         | Proprietary training data (billions of tokens)                                                     | Accuracy (70-85%+), multi-language support(Future Implementation)                                                                        | **Zero API cost**, full privacy, runs entirely offline on consumer GPU; trades 10-20% accuracy for unlimited iterations and no rate limits      |
| 5                         | **LocalAI / Cline** <br> *(Existing local frameworks)* | Local model deployment with generic tools         | Open-source models (Llama, Mistral, etc.)                                                          | Demonstrates feasibility of local-first AI; broad language support                                                                       | **Domain-specialized**: 26 error parsers + template-based prompting (61% accuracy vs 58% few-shot); comprehensive testing (878 tests, 100% parse accuracy) |
| **RCA Agent (This Work)** | Template-based prompting + ReAct + RAG                 | 82 curated Kotlin/Android errors, LLM Model  | **Combined approach**: structured templates + multi-pass reasoning + vector DB for semantic search | **61% analysis accuracy** on complex Android errors; **45-55s latency**; acceptable backend; reusable parsers and prompt templates |

**Key Research Gaps Addressed:**
- Local-first on consumer hardware
- Domain-specific optimization for mobile development
- Template-based prompting as small-model alternative
- Privacy-preserving with zero external dependencies

### 5. Methodology
- Data: 115 real errors across 26 types; 82 few-shot examples; version metadata (AGP, Kotlin).
- Preprocess: detect language → specialized parser → add context (files/deps/symbols) → structured prompt.
- Architecture: VS Code UI → ReAct agent → tools (LSP, build/version lookups) → prompt/RAG → local 7B model (quantized).
- Training: prompt-engineering only; temp 0.7, top-p 0.9, 3–5 iterations; GPU inference.
- Tests: 878 unit (99% pass/coverage), 30 accuracy cases, 7 golden tests; track latency and cache hit rate.

### 6. Conclusion
- Local-first works: full privacy, no API spend, acceptable latency on consumer GPU.
- Structured templates + specialized parsers reach 61% analysis accuracy with perfect parsing; caching lifts responsiveness.

### 7. Future Improvement
- Try 13B or hybrid template + few-shot to raise accuracy.
- Broaden parser coverage and datasets; tighten latency with batching/caching tweaks.
- Add feedback loops and clearer UI guidance in the extension.
**Project Homepage:** [[Your GitHub/Website](https://github.com/AsakuraKai/AI_PP_project.git)]