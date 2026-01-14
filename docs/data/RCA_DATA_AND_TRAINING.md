# RCA Dataset & Training Summary

**Scope:** How RCA data is collected, why the project is currently zero-shot with prompt engineering, and what datasets exist today.

## Current Approach
- Model: DeepSeek-R1-7B via Ollama; zero-shot with structured prompts; no gradient updates or fine-tuning run in this repo.
- Reasoning pattern: ReAct-style prompt templates + RAG; template-based prompts outperformed few-shot (61% vs 58.3% reported in research notes).
- Fine-tune status: Pipeline to prepare/export data exists; actual training deferred until more high-quality samples accumulate.

## Dataset Inventory (in repo)
- Kotlin NPE test set: 10 cases ([tests/fixtures/test-dataset.ts](../../tests/fixtures/test-dataset.ts)).
- Android/Compose/Gradle/XML/Manifest: 20 cases ([tests/fixtures/android-test-dataset.ts](../../tests/fixtures/android-test-dataset.ts)).
- Performance set: 40+ cases across 26+ error types and multiple complexities ([tests/fixtures/performance-test-dataset.ts](../../tests/fixtures/performance-test-dataset.ts)).
- Extended set: 30 additional mixed cases, bringing coverage to ~100+ total when combined ([tests/fixtures/extended-test-dataset.ts](../../tests/fixtures/extended-test-dataset.ts)).
- Unified view/stats helper: Aggregates counts across core sets ([tests/fixtures/unified-test-dataset.ts](../../tests/fixtures/unified-test-dataset.ts)).
- Golden evaluation set (research doc): 7 labeled cases used in early experiments (see research reference below).

## Data Flow (RCA → Training Prep)
1) RCA analyses and user/auto validation produce feedback records.
2) LearningPipeline builds `TrainingExample` objects from validated feedback ([src/agent/LearningPipeline.ts](../../src/agent/LearningPipeline.ts)).
3) ModelAdapter converts examples to fine-tuning entries, applies per-error-type caps, and logs stats ([src/agent/ModelAdapter.ts](../../src/agent/ModelAdapter.ts)).
4) Dataset split: default 80/10/10 train/validation/test (configurable via ModelAdapterConfig).
5) Export formats: Ollama JSONL, OpenAI JSONL, Anthropic JSONL, or generic JSON; can also emit an Ollama Modelfile for local fine-tuning.
6) Outputs are written under `fine-tuning/` when the learning cycle script is run (see Phase 5 guide below).

## Zero-Shot Decision (Why no fine-tune yet)
- Limited labeled data: only a handful of high-quality gold cases; not enough to justify supervised fine-tuning.
- Preserve base reasoning: keep the small model’s generalization while relying on structured prompts + RAG.
- Iteration speed: prompt/template tweaks are faster than training cycles.
- Empirical result: template-based prompting outperformed few-shot on this 7B model (61% vs 58.3%).

## Fine-Tuning Readiness
- End-to-end instructions, commands, and example scripts: [docs/_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/COMPLETION/CHUNK_9/PHASE5/PHASE5_CONTINUOUS_LEARNING.md](../_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/COMPLETION/CHUNK_9/PHASE5/PHASE5_CONTINUOUS_LEARNING.md).
- ModelAdapter supports export for Ollama, OpenAI, Anthropic; includes Modelfile generation for local Ollama fine-tunes.
- Recommended next step before training: accumulate more validated examples via the learning pipeline.

## Source References
- Zero-shot rationale, gold set description, and prompt experiments: [docs/Prof's-Requirement/RESEARCH_REFERENCES.md](../Prof's-Requirement/RESEARCH_REFERENCES.md).
- Data processing and export pipeline: [src/agent/LearningPipeline.ts](../../src/agent/LearningPipeline.ts), [src/agent/ModelAdapter.ts](../../src/agent/ModelAdapter.ts).
- Dataset files: see inventory above in `tests/fixtures/`.
