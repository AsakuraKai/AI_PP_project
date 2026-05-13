# RCA Agent - Project Overview for AI Assistants

## What Is This Project?

**RCA Agent** is a local-first AI debugging assistant for Kotlin/Android development, built as a VS Code extension. It uses the ReAct (Reasoning + Action) pattern with a local LLM (DeepSeek-R1 via Ollama) to analyze error logs, identify root causes, and suggest fixes.

**Status:** v3.5 - Implementation Complete, Dashboard & Error Queue Improvements in Progress

---

## Current Focus (March 2026)

### Active Work Areas
1. **Dashboard Improvements** - 7 critical bug fixes (Phase 1)
2. **Error Queue System** - Fixing cascading checkbox selection bug
3. **Third-party LLM Support** - Adding Claude, Gemini alongside local LLMs
4. **Analyze Tab** - Fixing solution display and file destinations

### Scope (from `docs/FInal_PP/Scope.md`)
- ✅ Get the dashboard working
- ⏳ Add third-party LLM support (Claude, Gemini)
- ⏳ Fix Error Queue system
- ⏳ Fix Analyze tab display issues
- 📋 Education tab, History tab, hide unfinished tabs

---

## Project Structure

```
AI_PP_project/
├── src/                    # Backend Core (TypeScript)
│   ├── agent/              # MinimalReactAgent, PromptEngine, FixGenerator
│   ├── errors/             # 26+ error parsers (Kotlin, Gradle, Compose, XML)
│   ├── tools/              # 19 tools (ReadFile, LSP, SemanticSearch, etc.)
│   ├── cache/              # ChromaDB integration, RCACache
│   ├── knowledge/          # AGP/Kotlin version databases
│   ├── llm/                # OllamaClient for DeepSeek model
│   └── types/              # TypeScript interfaces
│
├── vscode-extension/       # VS Code Extension
│   └── src/
│       ├── chat/           # @rca chat participant, ConversationalAgent
│       ├── services/       # 9 core services (Analysis, Fix, ErrorQueue)
│       ├── commands/       # 43 registered commands
│       └── webview/        # Panel UI components
│
├── tests/                  # 878+ unit tests (99% pass rate)
│
├── docs/                   # Comprehensive Documentation
│   ├── architecture/       # System design, agent workflow, decisions
│   ├── api/                # API contracts, tool docs, parser specs
│   ├── testing/            # Test summaries, coverage reports
│   ├── FInal_PP/           # Phase completion docs, task manifests
│   └── _archive/           # Historical session logs (v3.5 chunks)
│
├── fine-tuning/            # LLM fine-tuning experiments
├── examples/               # Example usage and test cases
└── scripts/                # Build and utility scripts
```

---

## Key Components

### Backend (`src/`)
- **MinimalReactAgent** - ReAct reasoning loop with tool execution
- **MultiPassAgent** - Multi-hypothesis validation
- **ErrorParser Router** - Routes to 26+ specialized parsers
- **19 Tools** - ReadFile, VersionLookup, LSP, SemanticCodeSearch, AndroidDocs, etc.
- **ChromaDB** - Vector search for semantic caching (37.5% hit rate)
- **Knowledge Bases** - 156 AGP versions, 52 Kotlin versions

**Agent Subsystems:**
- `clarification/` - ClarificationAgent, UncertaintyDetector, QuestionGenerator
- `refinement/` - RefinementAgent, RefinementService, ConfidenceTracker
- `feedback/` - EnhancedFeedbackHandler, FeedbackClassifier
- `handlers/` - Intent-specific handlers (Refinement, Clarification, Explanation, Feedback)
- **ConversationManager** - Multi-turn conversation tracking
- **IntentClassifier** - User intent detection
- **AdaptiveLearning** - Learning pipeline for model improvement

### VS Code Extension (`vscode-extension/`)
- **@rca Chat Participant** - Conversational interface in VS Code Chat
- **ConversationalAgent** - Multi-turn context-aware debugging (540 LOC)
- **GuidedDebuggingWorkflow** - 7-stage interactive debugging (550 LOC)
- **9 Services** - AnalysisService, FixApplicationService, ErrorQueueManager, etc.

**Chat System (`chat/`):**
- `RCAChatParticipant.ts` - Main router and orchestrator
- `ChatRequestRouter.ts` - Request routing to handlers
- `ContextCollector.ts` - Debug context collection
- `ResponseStreamer.ts` - Real-time response streaming
- `ChatPromptEngine.ts` - Chat-specific prompts
- `ChatActionCommands.ts` - Available chat actions

---

## Documentation Index

| Document             | Location                             | Purpose                              |
| -------------------- | ------------------------------------ | ------------------------------------ |
| Main README          | `README.md`                          | Full project overview, testing guide |
| **Scope**            | `docs/FInal_PP/Scope.md`             | Current priorities & roadmap         |
| **Error Queue Docs** | `docs/Error_Queue/`                  | Error Queue investigation & fixes    |
| Agent Entry Point    | `docs/FInal_PP/AGENT_ENTRY_POINT.md` | Dashboard bug fix mission            |
| Task Manifest        | `docs/FInal_PP/TASK_MANIFEST.md`     | 7 dashboard fixes with dependencies  |
| Phase 1 Completion   | `docs/FInal_PP/Phase1-Completion/`   | Dashboard bug fixes (7 fixes)        |
| Architecture         | `docs/architecture/`                 | System design, workflows, decisions  |
| API Contracts        | `docs/api/API_CONTRACTS.md`          | Backend/extension message contracts  |
| Tools Reference      | `docs/api/Tools.md`                  | All 19 tools documented              |
| Parser Reference     | `docs/api/Parsers.md`                | All 26+ error parsers                |
| v3.5 Chunk Logs      | `docs/_archive/RCA-AGENT-V3.5/`      | Detailed verification sessions       |

---

## Tech Stack

- **Language:** TypeScript 5.9.3
- **Runtime:** Node.js 18+
- **LLM:** DeepSeek-R1-Distill-Qwen-7B (via Ollama)
- **Vector DB:** ChromaDB
- **Extension Host:** VS Code 1.80+
- **Testing:** Jest (878 tests, 99% pass rate)

---

## Common Commands

```bash
# Build & Test
npm install && npm run build && npm test

# Run specific tests
npm test -- tests/unit/agent/
npm test -- tests/unit/parsers/

# Extension development
cd vscode-extension && npm run compile

# Start Ollama (required for LLM)
ollama serve
```

---

## When Working on This Project

1. **Check `docs/FInal_PP/Scope.md`** for current priorities
2. **Read `docs/FInal_PP/AGENT_ENTRY_POINT.md`** for dashboard bug fix tasks
3. **See `docs/Error_Queue/`** for Error Queue investigation & root cause
4. **Run `npm test`** after changes (target: 99% pass rate)
5. **Backend changes:** Focus on `src/agent/`, `src/errors/`, `src/tools/`
6. **Extension changes:** Focus on `vscode-extension/src/`
7. **UI changes:** Focus on `vscode-extension/webview/`

---

## Known Issues Being Fixed

### Error Queue - Critical Bug
**Root Cause:** ID collision due to 16-character truncation in `_generateId()`
- Location: `ErrorQueueManager.ts:130-133`
- Symptom: Selecting one checkbox selects all others
- Fix: Remove truncation or use crypto hash

### Dashboard - 7 Fixes (Phase 1)
1. Diff Algorithm Accuracy - Myers algorithm + whitespace normalization
2. Dataset Validation - Zod schemas
3. Fix Minimality - Context optimization
4. RCA Context Injection - Enhanced prompts
5. Chat History Hydration - Persistent chat
6. Syntax Highlighting - Custom CSS
7. Acceptance Workflow - Accept/Reject buttons

---

## Performance Benchmarks

| Metric         | Value         |
| -------------- | ------------- |
| Avg Latency    | 3.91s         |
| P90 Latency    | 5.83s         |
| Success Rate   | 100%          |
| Cache Hit Rate | 37.5%         |
| Test Pass Rate | 99% (878/888) |
