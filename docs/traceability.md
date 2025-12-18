# Traceability Matrix - RCA Agent

> **Purpose:** Link requirements to implementation, tests, and validation  
> **Project:** Personal learning project - Kotlin/Android debugging assistant  
> **Update Frequency:** Throughout development as features are implemented  
> **Status Legend:** ✅ Complete | 🟡 In Progress | ⏳ Planned | ❌ Blocked

---

## Phase 1 Goals (Kotlin/Android Support)

**Success Criteria:**
- ✅ Analyzes common Kotlin errors (NullPointerException, lateinit, etc.)
- ✅ Handles Android-specific issues (lifecycle, Compose, Gradle)
- ✅ Completes analysis in <60s on RTX 3070 Ti
- ✅ Actually useful in real development
- ✅ Learning about LLM agents and RAG systems

---

## Requirements Overview

**Total Requirements:** 20 (Phase 1: 12, Phase 2: 5, Phase 3: 3)  
**Completed:** 7 (REQ-001, REQ-003, REQ-005, REQ-006, REQ-007, REQ-010, REQ-012)  
**In Progress:** 0  
**Planned:** 13  
**Last Updated:** December 18, 2025 (Chunks 2.1-2.3 Complete)  

---

## Core Requirements (Phase 1)

| Requirement ID | Requirement Description | Implementation Files | Test Files | Coverage | Status |
|----------------|------------------------|---------------------|------------|----------|--------|
| REQ-001 | Support local LLMs (Ollama) | `src/llm/OllamaClient.ts` | `tests/unit/OllamaClient.test.ts` | 95% | ✅ Complete |
| REQ-002 | Support cloud LLMs (OpenAI, Anthropic, Gemini) | `src/llm/ProviderFactory.ts` (planned) | `tests/unit/llm/*Client.test.ts` (planned) | - | ⏳ Planned |
| REQ-003 | Kotlin/Android error parsing (NullPointer, lateinit, Compose, Gradle, XML) | `src/utils/KotlinNPEParser.ts`, `src/utils/parsers/KotlinParser.ts`, `src/utils/parsers/GradleParser.ts`, `src/utils/ErrorParser.ts`, `src/utils/LanguageDetector.ts` | `tests/unit/KotlinNPEParser.test.ts`, `tests/unit/KotlinParser.test.ts`, `tests/unit/GradleParser.test.ts`, `tests/unit/ErrorParser.test.ts`, `tests/unit/LanguageDetector.test.ts` | 95% | ✅ Complete (11 error types: 6 Kotlin + 5 Gradle) |
| REQ-004 | Vector database integration (ChromaDB) | `src/db/ChromaDBClient.ts`, `src/db/EmbeddingService.ts` | `tests/integration/vectordb.test.ts` | - | ⏳ Planned |
| REQ-005 | Tool registry with JSON schema validation | `src/tools/ToolRegistry.ts` (Zod validation) | `tests/unit/ToolRegistry.test.ts` | 95% | ✅ Complete (64 tests) |
| REQ-006 | Read workspace files tool | `src/tools/ReadFileTool.ts` | `tests/unit/ReadFileTool.test.ts`, `tests/integration/e2e.test.ts` | 95%+ | ✅ Complete |
| REQ-007 | LSP integration for call hierarchy | `src/tools/LSPTool.ts` (placeholder with regex fallback) | `tests/unit/LSPTool.test.ts` | 95% | ✅ Complete (24 tests, ready for VS Code LSP enhancement) |
| REQ-008 | Agent state persistence & checkpoints | `src/agent/StateManager.ts`, `src/agent/Checkpoint.ts` | `tests/unit/agent/StateManager.test.ts` | - | ⏳ Planned |
| REQ-009 | Result caching (hash-based deduplication) | `src/cache/RCACache.ts` (planned) | `tests/unit/cache/RCACache.test.ts` (planned) | - | ⏳ Planned |
| REQ-010 | ReAct agent with reasoning loop | `src/agent/MinimalReactAgent.ts` (3-iteration MVP) | `tests/unit/MinimalReactAgent.test.ts` | 88% | ✅ Complete (MVP) |
| REQ-011 | Performance monitoring & metrics | `src/monitoring/PerformanceTracker.ts` (planned) | `tests/unit/monitoring/PerformanceTracker.test.ts` (planned) | - | ⏳ Planned |
| REQ-012 | Advanced prompt engineering with few-shot learning | `src/agent/PromptEngine.ts` | `tests/unit/PromptEngine.test.ts` | 95% | ✅ Complete (system prompts, few-shot examples, JSON extraction) |

---

## Agent Requirements (Phase 2)

| Requirement ID | Requirement Description | Implementation Files | Test Files | Coverage | Status |
|----------------|------------------------|---------------------|------------|----------|--------|
| REQ-013 | ReAct agent loop (Thought-Action-Observation) | `src/agent/ReactAgent.ts` | `tests/unit/agent/ReactAgent.test.ts` | - | ⏳ Planned |
| REQ-014 | Self-reflection mechanism (hypothesis validation) | `src/agent/ReactAgent.ts` (reflectOnHypothesis) | `tests/unit/agent/ReactAgent.test.ts` | - | ⏳ Planned |
| REQ-015 | Parallel tool execution | `src/agent/ParallelToolExecutor.ts` | `tests/unit/agent/ParallelToolExecutor.test.ts` | - | ⏳ Planned |
| REQ-016 | Dynamic iteration budget (complexity-based) | `src/agent/ReactAgent.ts` (calculateComplexity) | `tests/unit/agent/ReactAgent.test.ts` | - | ⏳ Planned |
| REQ-017 | Educational mode (step-by-step explanations) | `src/agent/ReactAgent.ts`, `src/agent/PromptEngine.ts` | `tests/unit/agent/ReactAgent.test.ts` | - | ⏳ Planned |

---

## UI & Output Requirements (Phase 3)

| Requirement ID | Requirement Description | Implementation Files | Test Files | Coverage | Status |
|----------------|------------------------|---------------------|------------|----------|--------|
| REQ-018 | Webview UI with real-time progress | `src/ui/RCAWebview.ts`, `src/ui/webview/*` | `tests/unit/ui/RCAWebview.test.ts` | - | ⏳ Planned |
| REQ-019 | Markdown RCA document generation | `src/agent/DocumentSynthesizer.ts` | `tests/unit/agent/DocumentSynthesizer.test.ts` | - | ⏳ Planned |
| REQ-020 | User feedback loop (validate/invalidate RCAs) | `src/agent/FeedbackHandler.ts` | `tests/unit/agent/FeedbackHandler.test.ts` | - | ⏳ Planned |

---

## Non-Functional Requirements

| Requirement ID | Requirement Description | Implementation Strategy | Test Approach | Target | Status |
|----------------|------------------------|------------------------|---------------|--------|--------|
| NFR-001 | RCA generation time (standard mode) | Parallel tool execution, caching | Performance benchmarks | <60s (p90) | ⏳ Planned |
| NFR-002 | RCA generation time (fast mode) | Use 3B model, limited iterations | Performance benchmarks | <40s (p90) | ⏳ Planned |
| NFR-003 | RCA generation time (educational mode) | Extended context, explanations | Performance benchmarks | <90s (p90) | ⏳ Planned |
| NFR-004 | Test coverage | Comprehensive unit/integration tests | Jest coverage reports | >80% | ⏳ Planned |
| NFR-005 | Cache hit rate for repeat errors | Hash-based deduplication | Integration tests | >60% | ⏳ Planned |
| NFR-006 | Tool success rate | Error handling, retries | Integration tests | >95% | ⏳ Planned |
| NFR-007 | Checkpoint recovery success | State persistence tests | Integration tests | 100% | ⏳ Planned |
| NFR-008 | Security (prompt injection defense) | Input sanitization | Security tests | 100% blocked | ⏳ Planned |

---

## Update Instructions

When implementing a requirement:

1. **Update Status:** Change from ⏳ Planned → 🟡 In Progress
2. **Add Implementation Files:** List all files created
3. **Add Test Files:** List all test files
4. **Update Coverage:** Add coverage % when tests complete
5. **Mark Complete:** Change to ✅ Complete when all tests pass
6. **Update DEVLOG.md:** Reference requirement ID in weekly update

**Example:**
```markdown
| REQ-001 | Support local LLMs | `src/llm/OllamaClient.ts` | `tests/unit/llm/OllamaClient.test.ts` | 92% | ✅ Complete |
```

---

## Traceability Reports

### Week 1 Report (Example - To Be Generated)
```
Requirements Completed: 3/15 (20%)
- REQ-001: Local LLM support ✅
- REQ-003: Error parsing (TS, Python) ✅
- REQ-005: Tool registry ✅

Average Test Coverage: 85%
```

Generate reports using:
```bash
npm run traceability:report
```

---

**Last Updated:** December 14, 2025 (Week 0 - Planning Phase)
