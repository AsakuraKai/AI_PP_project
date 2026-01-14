# Implementation Evidence & Architecture Summary

**Date:** January 14, 2026  
**Project:** RCA Agent - Root Cause Analysis with Zero-Shot Learning  
**For:** Professor Review  

---

## 1. Dataset Inventory & Statistics

### Test Corpora (Consolidated from repo)

| Dataset                             | Count                | Coverage                                        | Location                                     |
| ----------------------------------- | -------------------- | ----------------------------------------------- | -------------------------------------------- |
| Kotlin NPE Set                      | 10 cases             | Basic null pointer & property errors            | `tests/fixtures/test-dataset.ts`             |
| Android/Compose/Gradle/XML/Manifest | 20 cases             | 5 Compose, 3 XML, 5 Gradle, 3 Manifest, 4 Mixed | `tests/fixtures/android-test-dataset.ts`     |
| Performance Set                     | 40+ cases            | 26+ error types, 4 complexity levels            | `tests/fixtures/performance-test-dataset.ts` |
| Extended Set                        | 30 cases             | Advanced Kotlin, interop, build system          | `tests/fixtures/extended-test-dataset.ts`    |
| **Total Repository**                | **~100+ test cases** | Multi-domain, varying complexity                | `tests/fixtures/unified-test-dataset.ts`     |
| Golden Evaluation Set               | 7 labeled cases      | Core evaluation for research metrics            | Research doc (Section 3.1)                   |

**Unified Dataset Stats:**
- Aggregates Kotlin (10) + Android (20) + Performance (40+) = 70+ base cases.
- Extended adds 30 more for comprehensive coverage.
- Each case includes: error text, expected type, root cause, sample code, difficulty/complexity, tags.

### Data Collection Flow

```
1. RCA Analysis Engine
   ↓
2. User/Auto Validation → Feedback Records
   ↓
3. LearningPipeline (src/agent/LearningPipeline.ts)
   - Extracts TrainingExample objects
   - Applies quality filters (minTrainingQuality: 0.7)
   - Groups by error type
   ↓
4. ModelAdapter (src/agent/ModelAdapter.ts)
   - Converts to fine-tuning format
   - Splits dataset (default 80/10/10)
   - Supports: Ollama, OpenAI, Anthropic, Generic JSON
   ↓
5. Export Output (fine-tuning/ directory)
   - train.jsonl, validation.jsonl, test.jsonl
   - Custom Ollama Modelfile
```

**Current Status:** Data prep pipeline implemented; no active fine-tuning (awaiting more high-quality samples).

---

## 2. Zero-Shot Learning Rationale

### Why No Fine-Tuning Currently

| Factor                   | Rationale                                                               | Evidence                                     |
| ------------------------ | ----------------------------------------------------------------------- | -------------------------------------------- |
| **Limited Labeled Data** | Only 7 golden test cases; insufficient for supervised training          | RESEARCH_REFERENCES.md, Section 3.1          |
| **Base Model Quality**   | DeepSeek-R1-7B already optimized for reasoning; preserve generalization | Model selection rationale in Section 3.4     |
| **Iteration Speed**      | Prompt tuning faster than training cycles                               | 11 prompt optimization iterations documented |
| **Empirical Result**     | Template-based prompting > few-shot on 7B model                         | 61% (template) vs 58.3% (few-shot)           |

### Chosen Approach: ReAct + Prompt Templates + RAG

```
┌─────────────────────────────────────────┐
│      Input: Error + Stack Trace         │
└──────────────────┬──────────────────────┘
                   ↓
        ┌──────────────────────┐
        │  ReAct Loop Prompt   │
        │  (Structured)        │
        └──────────┬───────────┘
                   ↓
  ┌────────────────────────────────────┐
  │  1. THOUGHT: Plan investigation    │
  │  2. ACTION: Execute tool           │
  │  3. OBSERVATION: Process output    │
  │  4. [Iterate up to 10 steps]       │
  │  5. ANSWER: Root cause + fix       │
  └────────────────────────────────────┘
                   ↓
        ┌──────────────────────┐
        │  RAG Retrieval (L2)  │
        │  Vector DB lookup    │
        │  (Semantic match)    │
        └──────────┬───────────┘
                   ↓
┌─────────────────────────────────────────┐
│  Output: Root Cause + Fix Guidelines    │
│  Confidence: 0.60–0.95 (varies by type) │
└─────────────────────────────────────────┘
```

**Tool System (8 specialized tools):**
- `read_file` – Source code context extraction
- `search_docs` – Documentation lookup
- `analyze_stacktrace` – Stack trace parsing
- `list_files` – Project structure exploration
- `search_similar_errors` – RAG-based retrieval (ChromaDB)
- `get_file_info` – File metadata
- `check_dependencies` – Gradle/build analysis
- `explain_concept` – Educational mode

**Performance Profile:**
- Average latency: ~31.5 seconds (on RTX 3070 Ti)
- Range: 26–40 seconds
- Confidence range: 0.60–0.95 per error type

---

## 3. Accuracy & Quality Metrics

### Empirical Results (Test Dataset: 10 Cases)

From `docs/data/accuracy-metrics.json`:

| Metric                    | Value               |
| ------------------------- | ------------------- |
| **Total Tests**           | 10                  |
| **Parsed Successfully**   | 10 (100%)           |
| **Analyzed Successfully** | 10 (100%)           |
| **Average Confidence**    | 0.715 (71.5%)       |
| **Average Latency**       | 31.56 seconds       |
| **Min/Max Latency**       | 26.01–40.12 seconds |

**Sample Results (First 2 test cases):**

1. **TC001: Lateinit Property Not Initialized**
   - Type: `lateinit`
   - Confidence: **0.95**
   - Latency: 28.98s
   - Root Cause Detected: ✓ (Property accessed before initialization)

2. **TC002: Null Pointer - Missing Safe Call**
   - Type: `npe`
   - Confidence: **0.85**
   - Latency: [detailed analysis in json]
   - Root Cause Detected: ✓ (Nullable value accessed without safe call operator)

**Prompt Engineering Impact:**
- Iteration 1–3 (Basic ReAct): 45–50% accuracy
- Iteration 4–6 (Few-shot examples): 52–55% accuracy
- Iteration 7 (Max few-shot, 82 examples): 58.3% accuracy
- Iteration 8–9 (Template-based structure): 59–60% accuracy
- Iteration 10–11 (Final optimization): **60.5–61.0% accuracy** ✓

**Finding:** Template-based structured prompts significantly outperformed few-shot learning for this small model size, contradicting the assumption that examples always help.

---

## 4. Fine-Tuning Readiness

### Current Infrastructure (Ready to Deploy)

**ModelAdapter Components:**
- Format conversion (4 frameworks: Ollama, OpenAI, Anthropic, generic)
- Dataset splitting with configurable ratios (default 80/10/10)
- Per-error-type sampling (cap examples per category)
- Quality filtering (metadata tracking: errorType, quality score, validated flag)

**Export Example:**
```json
{
  "train": [{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}, ...],
  "validation": [...],
  "test": [...],
  "stats": {
    "totalEntries": 127,
    "trainCount": 101,
    "validationCount": 13,
    "testCount": 13,
    "format": "ollama"
  }
}
```

**Ollama Modelfile (Autogenerated):**
```dockerfile
FROM deepseek-r1-distill-qwen:7b

# Fine-tuning data from learning pipeline
ADAPTER ./adapters/lora-finetuned

PARAMETER temperature 0.0
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
```

**End-to-End Flow (Documented):**
1. Run learning pipeline → generates `TrainingExample`s
2. ModelAdapter converts to target format
3. Export JSONL files + Modelfile
4. Use Ollama CLI: `ollama create rca-agent-custom -f Modelfile`
5. Deploy: Set model ID in agent config

*Status:* Prep-only; awaiting ≥50–100 high-quality validated examples before training.

---

## 5. Architecture Conformance

### ReAct Workflow (From agent-workflow.md)

**Iterative Reasoning Loop:**
```
Loop (max 10 iterations or confidence threshold):
  1. Agent.thought()
     - Analyze current error state
     - Identify missing information
     - Plan next investigation step
  
  2. Agent.act() → Tool Execution
     - Select appropriate tool (confidence-based ranking)
     - Execute with parameters from error context
     - Example: read_file(path, line_range)
  
  3. Process Observation
     - Capture tool output
     - Update error context
     - Extract relevant data
  
  4. Confidence Check
     - If confidence ≥ threshold → FINAL_ANSWER
     - Else if iterations < max → continue loop
     - Else → UNCERTAIN_ANSWER with alternatives

Final Answer Format:
  {
    "rootCause": "...",
    "fixGuidelines": [...],
    "confidence": 0.xx,
    "iterationsUsed": N,
    "toolsUsed": [...]
  }
```

**Tool Selection Strategy:**
- Exact-match cache lookup (L1, O(1))
- RAG vector search if cache miss (L2, cosine similarity ≥ 0.75)
- Fallback: error type heuristics + documentation search

**Database Layer:**
- **ChromaDB:** Vector embeddings (all-MiniLM-L6-v2, 384 dims)
- **Cache:** In-memory hash map (analysis quality ≥ 3/5)
- **Pruning:** Low-quality entries after user negative feedback

---

## 6. Error Type Coverage

### Supported Error Categories (26+ types)

**Kotlin (6):**
- `lateinit` – Uninitialized property access
- `npe` – Null pointer exceptions
- `type_mismatch` – Compile-time type errors
- `unresolved_reference` – Missing imports/definitions
- `modifier_chain` – Invalid modifier combinations
- `nullable_type` – Unsafe nullable usage

**Gradle/Build (5):**
- `dependency_resolution` – Unresolved dependencies
- `plugin_error` – Plugin configuration issues
- `build_cache` – Cache invalidation errors
- `sync_error` – IDE sync failures
- `gradle_daemon` – Daemon process issues

**Jetpack Compose (4):**
- `compose_remember` – State without remember
- `recomposition` – Composition scope violations
- `snapshot_state` – State snapshot errors
- `layout_error` – Composable layout issues

**Android/XML (5):**
- `layout_inflation` – XML parsing errors
- `resource_not_found` – Missing resources
- `attribute_error` – Invalid attributes
- `permission_error` – Manifest permissions
- `manifest_merger_error` – Manifest merge conflicts

**Other (6):**
- `theme_error`, `obfuscation_error`, `dex_error`, etc.

---

## 7. Key Implementation Files

| File                             | Lines | Purpose                                   |
| -------------------------------- | ----- | ----------------------------------------- |
| `src/agent/MinimalReactAgent.ts` | ~600  | Main ReAct agent orchestration            |
| `src/agent/LearningPipeline.ts`  | ~500  | Training example generation from feedback |
| `src/agent/ModelAdapter.ts`      | ~650  | Fine-tuning data export & formatting      |
| `src/parsers/ErrorParser.ts`     | ~800  | Multi-type error parsing                  |
| `src/tools/`                     | ~2000 | 8 specialized tool implementations        |
| `tests/fixtures/`                | ~2500 | Consolidated 100+ test cases              |

**Total Implementation:** ~7,000+ lines of core logic + 100+ test cases.

---

## 8. Research Documentation References

| Document                                         | Key Sections                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| `docs/Prof's-Requirement/RESEARCH_REFERENCES.md` | 3.1 (Dataset), 3.2 (EDA), 3.4 (Model Selection), 3.5 (System Architecture) |
| `docs/architecture/agent-workflow.md`            | ReAct loop, tool integration, RAG design                                   |
| `docs/architecture/database-design.md`           | ChromaDB schema, caching strategy                                          |
| `docs/data/RCA_DATA_AND_TRAINING.md`             | Data flow, dataset inventory, zero-shot rationale                          |
| `docs/data/accuracy-metrics.json`                | Empirical test results (10 cases)                                          |

---

## 9. Summary of Key Achievements

✓ **Dataset:** ~100+ test cases across 26+ error types  
✓ **Architecture:** ReAct + RAG + structured prompting  
✓ **Zero-Shot Performance:** 60.5–61% accuracy (template-based)  
✓ **Latency:** 26–40 seconds average (consumer GPU)  
✓ **Fine-Tuning Ready:** ModelAdapter supports 4 frameworks; Modelfile generation ready  
✓ **Coverage:** Kotlin, Android, Gradle, Compose, XML, Manifest errors  
✓ **Code Quality:** Documented, typed, tested; no active training run needed yet  

**Next Step:** Accumulate 50–100 high-quality validated examples via the learning pipeline before initiating fine-tuning experiments.

