# System Architecture & Workflow Diagrams

**For:** Professor Review  
**Date:** January 14, 2026  

---

## 1. End-to-End RCA Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                      Developer Workflow                         │
└───────────────────────────┬──────────────────────────────────────┘
                            ↓
                  ┌─────────────────────┐
                  │  Error Occurrence   │
                  │  (Build/Runtime)    │
                  └──────────┬──────────┘
                             ↓
        ┌────────────────────────────────────────┐
        │   Collect Error Context:               │
        │   - Error message                      │
        │   - Stack trace                        │
        │   - Project context (optional)         │
        └──────────────┬───────────────────────┘
                       ↓
    ┌──────────────────────────────────────────────────┐
    │   MinimalReactAgent (Main Orchestrator)          │
    │                                                   │
    │   Loop (max 10 iterations):                      │
    │   ├─ 1. THOUGHT: Analyze error, plan next step  │
    │   ├─ 2. ACTION: Select & execute tool           │
    │   ├─ 3. OBSERVE: Process tool output            │
    │   ├─ 4. Check confidence/context limit          │
    │   └─ Repeat if needed                           │
    │                                                   │
    │   Tools Available:                              │
    │   • read_file → Source code context             │
    │   • search_docs → Documentation lookup          │
    │   • analyze_stacktrace → Trace parsing          │
    │   • search_similar_errors → RAG (ChromaDB)      │
    │   • list_files, get_file_info, check_deps, etc. │
    └──────────────┬───────────────────────────────────┘
                   ↓
    ┌──────────────────────────────────────────────────┐
    │   Error Parser Layer (26+ Error Types)          │
    │   • ErrorParser (base multi-type parser)        │
    │   • KotlinCompilerParser                        │
    │   • GradleErrorParser                           │
    │   • JetpackComposeParser                        │
    │   • AndroidXMLParser                            │
    │   ... (26+ specialized parsers)                 │
    └──────────────┬───────────────────────────────────┘
                   ↓
    ┌──────────────────────────────────────────────────┐
    │   RAG Retrieval Layer (ChromaDB)                 │
    │                                                   │
    │   Lookup Strategy:                              │
    │   1. L1 Cache: Exact-match hash (O(1))           │
    │   2. L2 Vector: Semantic similarity (cosine)     │
    │      - Threshold: ≥ 0.75 similarity             │
    │      - Top-k: 3 most similar past analyses      │
    │                                                   │
    │   Returns: Similar errors + solutions from DB   │
    └──────────────┬───────────────────────────────────┘
                   ↓
        ┌─────────────────────────────────┐
        │  Root Cause Analysis Output:    │
        │  ├─ Root cause description      │
        │  ├─ Fix guidelines (steps)      │
        │  ├─ Confidence score (0–1)      │
        │  ├─ Tools used (trace)          │
        │  └─ Iteration count             │
        └──────────────┬──────────────────┘
                       ↓
     ┌───────────────────────────────────────────┐
     │  User Validation / Feedback               │
     │  • Accept & store (quality ≥ 0.7)        │
     │  • Reject & learn from feedback          │
     └──────────────┬───────────────────────────┘
                    ↓
     ┌───────────────────────────────────────────┐
     │  Learning Pipeline (Continuous Learning)  │
     │  → Accumulate TrainingExample objects     │
     │  → Feed into ModelAdapter for fine-tuning │
     │    (when ≥ 50–100 validated samples)      │
     └───────────────────────────────────────────┘
```

---

## 2. ReAct Loop (Detailed)

```
┌──────────────────────────────────────────────────────────────┐
│                    START: New Error                           │
└─────────────────────────────┬────────────────────────────────┘
                              ↓
              ┌─────────────────────────────┐
              │  Initialize Error Context:  │
              │  • error message            │
              │  • stack trace              │
              │  • project files (if any)   │
              │  • confidence = 0           │
              └──────────┬──────────────────┘
                         ↓
    ┌─────────────────────────────────────────────────────────┐
    │                  ITERATION LOOP                          │
    │              (Max 10 iterations)                         │
    ├─────────────────────────────────────────────────────────┤
    │                                                          │
    │  STEP 1: THOUGHT                                        │
    │  ────────────────                                       │
    │  Agent analyzes:                                        │
    │  • Current error context                                │
    │  • Information gaps                                     │
    │  • Next investigation step                              │
    │  → Output: "I need to read file X at line Y"            │
    │                                                          │
    ├─────────────────────────────────────────────────────────┤
    │                                                          │
    │  STEP 2: ACTION → Tool Execution                        │
    │  ────────────────────────────────                       │
    │  Agent calls tool (if needed):                          │
    │                                                          │
    │  Tool Selection (ranked by confidence):                 │
    │  1. Exact-match cache lookup                            │
    │  2. RAG vector search (if not found)                    │
    │  3. Heuristic tool selection (error type)               │
    │                                                          │
    │  Example: read_file("MainActivity.kt", 40–50)           │
    │                                                          │
    ├─────────────────────────────────────────────────────────┤
    │                                                          │
    │  STEP 3: OBSERVATION                                    │
    │  ────────────────────                                   │
    │  Capture tool output:                                   │
    │  • File content / search results / parsed trace        │
    │  • Extract relevant information                         │
    │  • Update error context                                 │
    │                                                          │
    │  Update confidence based on findings                    │
    │                                                          │
    ├─────────────────────────────────────────────────────────┤
    │                                                          │
    │  STEP 4: DECISION                                       │
    │  ──────────────────                                     │
    │                                                          │
    │  if confidence ≥ threshold (e.g., 0.75):               │
    │    → Go to FINAL_ANSWER                                 │
    │                                                          │
    │  else if context_length < limit AND iter < 10:         │
    │    → Continue loop (STEP 1)                             │
    │                                                          │
    │  else:                                                   │
    │    → Go to UNCERTAIN_ANSWER                             │
    │                                                          │
    └─────────────────────────────────────────────────────────┘
                        ↓
        ┌──────────────────────────────┐
        │  FINAL_ANSWER (Confident)    │
        ├──────────────────────────────┤
        │ Root cause: "Property 'user' │
        │   not initialized"           │
        │                              │
        │ Fix guidelines:              │
        │ 1. Initialize before use     │
        │ 2. Use @Lazy annotation      │
        │ 3. Add null checks           │
        │                              │
        │ Confidence: 0.95             │
        │ Tools used: 3 (read_file x2, │
        │             search_docs x1)  │
        │ Iterations: 5                │
        └──────────────────────────────┘
                        ↓
              ┌──────────────────────┐
              │  END: Output Result  │
              └──────────────────────┘
```

---

## 3. Data Processing Pipeline

```
┌────────────────────────────────────────────────────────────┐
│          RCA Execution & Feedback Collection               │
└───────────────┬──────────────────────────────────────────┘
                ↓
    ┌───────────────────────────────┐
    │  Validated RCA Output         │
    │  • Root cause analysis        │
    │  • Fix guidelines             │
    │  • User confirmation/rating   │
    └──────────────┬────────────────┘
                   ↓
    ┌───────────────────────────────────────────────┐
    │  Stage 1: Feedback Collection (LearningPipeline)
    │                                               │
    │  Collect feedback:                            │
    │  • error_type                                 │
    │  • error_message                              │
    │  • suggested_root_cause                       │
    │  • fix_guidelines                             │
    │  • user_validation (accepted? rating?)        │
    │  • confidence_score                           │
    └──────────────┬────────────────────────────────┘
                   ↓
    ┌───────────────────────────────────────────────┐
    │  Stage 2: Training Data Generation            │
    │                                               │
    │  Create TrainingExample:                      │
    │  {                                            │
    │    id, errorType, errorMessage,               │
    │    expectedRootCause, expectedFixGuidelines,  │
    │    quality: (1–5 rating), validated: bool     │
    │  }                                            │
    └──────────────┬────────────────────────────────┘
                   ↓
    ┌───────────────────────────────────────────────┐
    │  Stage 3: Quality Filtering                   │
    │                                               │
    │  Filter criteria:                             │
    │  • quality ≥ 0.7 (3.5+ stars)                 │
    │  • validated = true                           │
    │  • no duplicates                              │
    │  • error type known                           │
    │                                               │
    │  Apply limits:                                │
    │  • maxExamplesPerType: 50                     │
    │  • prioritize high-quality examples           │
    └──────────────┬────────────────────────────────┘
                   ↓
    ┌───────────────────────────────────────────────┐
    │  Stage 4: ModelAdapter Processing             │
    │                                               │
    │  Convert to fine-tuning format:               │
    │  • FineTuningEntry {                          │
    │      user_prompt, assistant_response,         │
    │      metadata (quality, validated, type)      │
    │    }                                          │
    │                                               │
    │  Create prompt templates per error type       │
    └──────────────┬────────────────────────────────┘
                   ↓
    ┌───────────────────────────────────────────────┐
    │  Stage 5: Dataset Splitting                   │
    │                                               │
    │  Split configuration (default):               │
    │  • Train:      80% (101 entries for n=127)    │
    │  • Validation: 10% (13 entries)               │
    │  • Test:       10% (13 entries)               │
    │                                               │
    │  Shuffle entries for randomness               │
    └──────────────┬────────────────────────────────┘
                   ↓
    ┌───────────────────────────────────────────────┐
    │  Stage 6: Export & Storage                    │
    │                                               │
    │  Export to fine-tuning/ directory:            │
    │  • train.jsonl (JSONL format)                 │
    │  • validation.jsonl                           │
    │  • test.jsonl                                 │
    │  • Modelfile (for Ollama local fine-tune)     │
    │                                               │
    │  Formats supported:                           │
    │  • Ollama format (JSONL)                      │
    │  • OpenAI format (chat-style JSONL)           │
    │  • Anthropic format                           │
    │  • Generic JSON                               │
    │                                               │
    │  Statistics logged:                           │
    │  • Total entries: 127                         │
    │  • Train/Val/Test split: 101/13/13            │
    │  • Format: ollama                             │
    └──────────────┬────────────────────────────────┘
                   ↓
        ┌───────────────────────────┐
        │  Ready for Fine-Tuning:   │
        │  (when >= 50–100 samples) │
        └───────────────────────────┘
```

---

## 4. Vector Database (RAG) Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  Retrieval-Augmented Generation (RAG)          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input Error: "NullPointerException at line 45"               │
│  └─ Convert to embedding (all-MiniLM-L6-v2): [0.1, -0.2, ...] │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Lookup Strategy (2-Level Hierarchy)                     │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │  LEVEL 1: Exact-Match Cache (L1)                         │ │
│  │  ───────────────────────────                             │ │
│  │  Hash map: error_signature → analysis result             │ │
│  │  Lookup: O(1) time                                       │ │
│  │  Hit rate: ~20–30% for repeated errors                  │ │
│  │                                                          │ │
│  │  IF cache hit → Return cached analysis (fast!)           │ │
│  │  ELSE → Continue to L2                                   │ │
│  │                                                          │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │  LEVEL 2: Vector Database (ChromaDB)                     │ │
│  │  ──────────────────────────────                          │ │
│  │  Embedding lookup: Cosine similarity search              │ │
│  │                                                          │ │
│  │  1. Embed input error → [0.1, -0.2, ...]                │ │
│  │                                                          │ │
│  │  2. Query ChromaDB with embedding                        │ │
│  │     • Similarity threshold: ≥ 0.75 (cosine)              │ │
│  │     • Top-k results: 3 most similar analyses             │ │
│  │                                                          │ │
│  │  3. Return: Similar past RCAs (reuse + adapt)            │ │
│  │                                                          │ │
│  │  Database content:                                       │ │
│  │  • Error context embeddings                              │ │
│  │  • Analysis results (root cause + fix)                   │ │
│  │  • Quality scores (1–5)                                  │ │
│  │  • Error type tags                                       │ │
│  │                                                          │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │  Cache Maintenance:                                      │ │
│  │  • Store analyses with quality ≥ 3/5                     │ │
│  │  • Prune low-quality entries on negative feedback        │ │
│  │  • Refresh on model updates                              │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Output: [Similar analysis A (sim: 0.89),                     │
│           Similar analysis B (sim: 0.82),                     │
│           Similar analysis C (sim: 0.78)]                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Prompt Engineering Evolution

```
Prompt Optimization Iterations (11 total):

Iteration 1–3: Basic ReAct Prompting
├─ Simple thought-action-observation loop
├─ Minimal structure
└─ Accuracy: 45–50%

Iteration 4–6: Added Few-Shot Examples
├─ Included 10–30 error examples
├─ Incremental example increase
└─ Accuracy: 52–55%

Iteration 7: Maximum Few-Shot (82 examples)
├─ Saturation point reached
├─ Token limits becoming issue
└─ Accuracy: 58.3%

Iteration 8–9: Shifted to Template-Based Structure
├─ Replaced examples with structured templates
├─ Clear format for system/user/assistant messages
├─ Error type-specific templates
└─ Accuracy: 59–60%

Iteration 10–11: Final Optimization
├─ Refined templates for each error category
├─ Better error type detection
├─ Improved tool selection logic
└─ **FINAL Accuracy: 60.5–61%** ✓

KEY FINDING:
Template-based prompting (61%) > Few-shot learning (58.3%)
on 7B models with limited labeled data.
```

---

## 6. Model Configuration

```
┌──────────────────────────────────────────────────────────┐
│               Model & Runtime Configuration              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Model: DeepSeek-R1-Distill-Qwen-7B                     │
│  └─ Size: 7 billion parameters                          │
│  └─ Quantization: 4-bit GGUF (6GB VRAM)                │
│  └─ Inference Engine: Ollama (local, CPU/GPU)           │
│                                                          │
│  Context Configuration:                                 │
│  └─ Input window: 8192 tokens                           │
│  └─ Output limit: 2048 tokens                           │
│  └─ Stop sequences: Custom JSON markers                 │
│                                                          │
│  Inference Parameters:                                  │
│  └─ Temperature: 0.7 (balanced creativity vs. consistency)
│  └─ Top-p: 0.9 (nucleus sampling)                       │
│  └─ Num predict: 2048 (output token limit)              │
│                                                          │
│  ReAct Loop Configuration:                              │
│  └─ Max iterations: 10                                  │
│  └─ Tool budget: 8 tool calls per iteration max         │
│  └─ Confidence threshold: 0.75 (stop if reached)        │
│  └─ Context window management: Prune oldest observations│
│    when context exceeds limit                           │
│                                                          │
│  RAG Retrieval Configuration:                           │
│  └─ Vector DB: ChromaDB                                 │
│  └─ Embedding model: all-MiniLM-L6-v2 (384 dimensions)  │
│  └─ Similarity threshold: 0.75 (cosine)                 │
│  └─ Top-k: 3 most similar past analyses                 │
│  └─ Cache strategy: Exact-match (L1) → Semantic (L2)    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Error Classification Hierarchy

```
Error Categories (26+ types supported)

Kotlin Errors (6 types)
├─ lateinit (uninitialized property)
├─ npe (null pointer exception)
├─ type_mismatch (compile-time type error)
├─ unresolved_reference (missing import/definition)
├─ modifier_chain (invalid modifiers)
└─ nullable_type (unsafe nullable usage)

Gradle/Build Errors (5 types)
├─ dependency_resolution
├─ plugin_error
├─ build_cache
├─ sync_error
└─ gradle_daemon

Jetpack Compose Errors (4 types)
├─ compose_remember (state without remember)
├─ recomposition (composition scope violation)
├─ snapshot_state (state snapshot error)
└─ layout_error (composable layout issue)

Android/XML Errors (5 types)
├─ layout_inflation
├─ resource_not_found
├─ attribute_error
├─ permission_error
└─ manifest_merger_error

Other Errors (6+ types)
├─ theme_error
├─ obfuscation_error
├─ dex_error
├─ java_interop_error
└─ [Custom error types]

Parser Strategy:
1. Try exact-match parser (error type known)
2. Fall back to multi-type ErrorParser
3. Apply heuristics based on keywords
4. Update error type based on found signature
```

---

## 8. Quality Assurance Flow

```
┌────────────────────────────────────────────────────────┐
│              Quality Assurance Cycle                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1. Agent produces RCA                                │
│     └─ Confidence score, fix guidelines, root cause   │
│                                                        │
│  2. User Validation (Interactive Feedback)            │
│     ├─ Accept: Mark as high-quality (4–5 stars)       │
│     ├─ Reject: Provide feedback (why wrong)           │
│     └─ Uncertain: Mark for review (2–3 stars)         │
│                                                        │
│  3. Quality Filtering (LearningPipeline)              │
│     ├─ Include: quality ≥ 0.7 (3.5+ stars)            │
│     ├─ Validated: user confirmed = true               │
│     └─ Exclude: quality < 0.7 OR not validated        │
│                                                        │
│  4. Database Updates                                  │
│     ├─ High quality (≥3/5): Cache in RAG              │
│     ├─ Low quality (<3/5): Prune after negative FB   │
│     └─ Update embeddings for similar errors           │
│                                                        │
│  5. Model Feedback Loop                               │
│     ├─ Analyze why wrong (if rejected)                │
│     ├─ Update prompt templates based on patterns      │
│     └─ Retrain (if enough samples accumulate)         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**Summary:** This architecture enables continuous learning through user feedback while maintaining privacy (local-first), low latency (~30s), and generalization through zero-shot prompting with RAG augmentation.

