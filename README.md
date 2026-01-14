# RCA Agent v3.5: Local-First AI Debugging Assistant

> Personal Learning Project - Building a local AI debugging assistant for Kotlin/Android development.  
> Status: v3.5 Implementation Complete | Phase 4 Testing | Learning & Development Stage

---

## [UPDATE] Latest Updates

### v3.5 Implementation
Features 26+ error parsers, MinimalReactAgent, 156 AGP + 52 Kotlin versions, ChromaDB caching (37.5% hit rate), 878 backend tests (99% pass rate), conversational chat interface, and new UI components. **Actual Performance:** 3.91s average latency with 100% success rate on benchmarks.

### Phase 1-3 Completion
26+ error parsers implemented (Kotlin, Gradle, Compose, XML, Manifest), MinimalReactAgent with ReAct reasoning, 878 backend tests with 99% pass rate, conversational chat participant, real-time streaming responses.

### Phase 4 Implementation
ConversationalAgent (540 LOC), GuidedDebuggingWorkflow (550 LOC), 16 integration tests. Currently in testing phase with real Android projects. Works well for common error patterns; edge cases may require manual debugging.

---

## [ARCH] Current Architecture (v3.5)

The project is built with a modular architecture for learning and development purposes:

### Backend Core (`src/`) - Implementation Complete

**Agent System**: MinimalReactAgent (ReAct pattern), MultiPassAgent, EducationalAgent, PromptEngine, DocumentSynthesizer, FixGenerator, ErrorClassifier, FeedbackHandler, AgentStateStream

**Error Parsing**: ErrorParser router + 4 language parsers (KotlinParser, GradleParser, JetpackComposeParser, XMLParser) = 26+ error patterns

**Tools System**: 19 tools integrated
- Backend (9): ReadFile, VersionLookup, LSP, SemanticCodeSearch, DependencyGraph, HistoricalPattern, AndroidBuild, AndroidDocs, ManifestAnalyzer
- Extension (10): FileOperation, WorkspaceSearch, Terminal, GradleCommand, + 6 others

**Knowledge & Caching**: ChromaDB (vector search), RCACache (in-memory), AGP/Kotlin versions (156+52), Few-shot examples (20+)

**LLM**: OllamaClient with DeepSeek-R1-Distill-Qwen-7B-GGUF, retry logic, health checks

**Quality**: 50+ error handlers, logging, 8 config settings, 50-60MB memory usage, performance tracking

### VS Code Extension (`vscode-extension/`) - Implementation Complete
- **Chat Participant** - Conversational `@rca` interface in VS Code Chat panel
  - RCAChatParticipant (router and orchestrator)
  - ConversationalAgent (540 LOC) - Multi-turn conversations with context tracking
  - GuidedDebuggingWorkflow (550 LOC) - Step-by-step debugging through 7 stages
  - Smart routing between conversational, guided, and standard analysis modes
- **Interactive Debugging** - Phase 4 features implemented
  - Multi-turn conversations with session management
  - Follow-up question detection and handling
  - Conversation export to Markdown
  - User preference tracking (beginner/intermediate/expert)
- **Message Passing** - Full command registry (43 commands)
- **Error Detection** - Multi-source detection (diagnostics, terminal, build files)
- **Commands** - Full command registry including conversational debugging commands
- **Context Integration** - Files, diagnostics, terminal output integration
- **Services** - 9 core services with error detection and UI management
  - AnalysisService, FixApplicationService, StateManager
  - ErrorQueueManager, FeedbackService, UIEventManager
  - AdvancedErrorDetector, NetworkTimeoutHandler, BaseService

### Testing Infrastructure (`tests/`)
- **Unit Tests** - 878 backend unit tests with 99% pass rate
- **Integration Tests** - 16 chat workflow and interactive debugging tests
- **Real-World Tests** - Phase4TestSuite with 10 diverse Android scenarios

---

## [FEAT] Key Features (v3.5)

### Conversational AI Debugging
- **Chat Participant** - Natural language interface via `@rca` in VS Code Chat
- **Multi-Turn Conversations** - Maintains context across questions
  - Full conversation history tracking (last 20 messages)
  - Smart context awareness (errors, files, fixes)
  - Session management for different debugging tasks
- **Follow-Up Questions** - "Why does this happen?" "Show me an example"
- **Export Conversations** - Save debugging sessions to Markdown

### Guided Debugging Workflows
- **Step-by-Step Assistance** - Interactive 7-stage debugging process:
  1. **Understand Error** - What happened?
  2. **Gather Context** - Where and why?
  3. **Analyze Root Cause** - Deep analysis
  4. **Suggest Fix** - How to fix it
  5. **Apply Fix** - Make the change
  6. **Verify Fix** - Test it works
  7. **Complete** - Summary and export
- **Smart Routing** - Auto-detects when to use guided vs conversational mode
- **Adaptive Explanations** - Adjusts to beginner/intermediate/expert levels

### Core Analysis Engine
- **26+ Error Parsers** - Kotlin, Gradle, Compose, XML, Manifest errors
- **MinimalReactAgent** - ReAct reasoning with tool execution
- **19 Specialized Tools** - ReadFile, LSP, AndroidBuild, Manifest, Docs, and more
- **Smart Caching** - ChromaDB semantic search with 37.5% hit rate, <1ms L1 cache
- **Knowledge Bases** - 156 AGP versions + 52 Kotlin versions
- **Response Time** - Benchmark results: 3.91s avg (P90: 5.83s), 100% success rate

### Developer Experience
- **Full Command Coverage** - 43 commands fully implemented
- **High Test Pass Rate** - 878/888 tests passing (99% pass rate)
- **Comprehensive Docs** - Full session logs, API contracts, architecture guides

---

## [DOCS] Documentation

All project documentation is organized in the `docs/` folder:

### Core Documentation
- **[Development Log (DEVLOG)](docs/DEVLOG.md)** - Weekly progress journal with detailed status updates
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Complete file organization and statistics
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Architecture and extension guide
- **[User Guide](docs/USER_GUIDE.md)** - Installation and usage guide

### v3.5 Backend Polish (Jan 2026)
- **[Completion Summary](docs/_archive/RCA-AGENT-V3.5/COMPLETION_SUMMARY.md)** - Full backend polish results and quality gates (14/15 passed)
- **[Overview](docs/_archive/RCA-AGENT-V3.5/OVERVIEW.md)** - 8-chunk systematic verification approach
- **[Chunk Session Logs](docs/_archive/RCA-AGENT-V3.5/)** - Detailed logs for each chunk with verification results:
  - Chunk 1: Core Backend Services (ErrorParser, OllamaClient, ChromaDB)
  - Chunk 2: Extension Entry Point (activation flow, initialization)
  - Chunk 3: Message Passing Layer (43 commands, 46 handlers, 100% coverage)
  - Chunk 4: Frontend Services (9 services verified)
  - Chunk 5: Error Detection (multi-source detection, queue management)
  - Chunk 6: Agent System (MinimalReactAgent, tool execution, streaming)
  - Chunk 7: Tools System (19 tools inventory and verification)
  - Chunk 8: Cross-Cutting Concerns (logging, error handling, config, caching)
- **[Message Contract](docs/_archive/RCA-AGENT-V3.5/CHUNK-3-Message-Passing/MESSAGE_CONTRACT.md)** - Complete mapping of 43 commands and 46 handlers
- **[Tools Inventory](docs/_archive/RCA-AGENT-V3.5/CHUNK-7-Tools-System/TOOLS_INVENTORY.md)** - Detailed breakdown of all 19 tools

### Additional Resources
- **[Learnings](docs/LEARNINGS.md)** - Key insights from 15+ weeks of development
- **[Roadmap](docs/Roadmap.md)** - Phase-by-phase implementation plan
- **[Milestone Archive](docs/_archive/milestones/)** - Historical completion reports

---

## [START] Quick Start

### Prerequisites
- Node.js 18+
- Ollama with DeepSeek-R1-Distill-Qwen-7B-GGUF:latest model
- TypeScript 5+
- VS Code 1.80+ (for Chat Participant feature)

### Installation & Usage
```bash
npm install && npm run build && npm test

# Start Ollama (required)
ollama serve

# VS Code Chat: Ctrl+Alt+I, then type: @rca analyze this error
```

### Current Implementation Status

**[OK] Phase 1: Backend (COMPLETE)**
- 26+ error parsers (Kotlin, Gradle, Compose, XML, Manifest)
- MinimalReactAgent with ReAct reasoning and tool execution
- 9 specialized tools with error detection and analysis
- ChromaDB integration for caching and semantic search
- Knowledge bases: 156 AGP + 52 Kotlin versions
- 878 unit tests with 99% pass rate

**[OK] Phase 2-3: Chat Interface (COMPLETE)**
- Conversational `@rca` chat participant with smart routing
- Context-aware analysis from files, diagnostics, terminal
- Action buttons and real-time response streaming
- 2,900+ LOC of implementation code
- Works well for common error patterns

**[SUCCESS] Phase 4: Implementation (COMPLETE - Week 4)**
- **Week 1-2:** Testing infrastructure with Phase4TestSuite
  - 10 diverse test cases with standardized metrics
  - Automated test runner with health checks
- **Week 3-4:** Interactive debugging features
  - ConversationalAgent (540 LOC) - Multi-turn conversations
  - GuidedDebuggingWorkflow (550 LOC) - 7-stage debugging
  - Enhanced RCAChatParticipant (300 LOC) - Smart mode routing
  - Full LLM integration with session persistence
  - 16 comprehensive integration tests
- **Week 5+:** Testing and refinement (IN PROGRESS)
  - Real-world testing with Android projects
  - Collecting usage metrics
  - Identifying edge cases and limitations

**Future: Advanced Features**
- Educational Agent with learning notes
- Performance optimization (parallel tools)
- Real-time error detection
- Multi-language support

---

## [TEST] Personal Testing Guide

### A. Testing During Development

#### Quick Development Cycle
```bash
# 1. Build after code changes
npm run build

# 2. Run unit tests (fast feedback)
npm test

# 3. Check coverage (if needed)
npm run test:coverage
```

**Development Checklist:**
- [OK] Tests pass (816/826 expected)
- [OK] Coverage stays >95%
- [OK] No TypeScript errors
- [OK] Build completes (~16s)

#### Testing Backend Components

```bash
# Test specific component after changes
npm test -- tests/unit/agent/MinimalReactAgent.test.ts
npm test -- tests/unit/parsers/
npm test -- tests/unit/tools/

# Test with Ollama integration (slower)
npm run test:accuracy        # Real Android errors
npm run test:golden          # Golden test suite
npm run test:phase1-quick    # Quick integration test
```

#### Testing VS Code Extension

```bash
# 1. Build extension
cd vscode-extension
npm run compile

# 2. Test in Extension Host
# Press F5 in VS Code (opens new window with extension)

# 3. Test Chat Participant (New in Phase 4!):
#    - Open Chat panel: Ctrl+Alt+I (or Cmd+Alt+I on Mac)
#    - Type: @rca analyze this error
#    - Follow-up: @rca why does this happen?
#    - Guided mode: @rca guided
#    - Export: @rca export conversation

# 4. Test Standard Commands:
#    - Ctrl+Shift+P → "RCA Agent: Start Conversational Debugging"
#    - Ctrl+Shift+P → "RCA Agent: Start Guided Debugging Workflow"
#    - Ctrl+Shift+P → "RCA Agent: Export Conversation"

# 5. Check logs in Debug Console for errors
```

#### Testing Interactive Debugging Features

```bash
# Run integration tests for Phase 4 features
cd vscode-extension
npm run test:integration

# Specific test suites:
npm test -- interactiveDebugging.test.ts  # ConversationalAgent + GuidedWorkflow
npm test -- chatWorkflow.test.ts          # RCAChatParticipant routing

# Manual testing checklist:
# [ ] Start conversation with @rca
# [ ] Ask follow-up question
# [ ] Test guided workflow with @rca guided
# [ ] Export conversation to Markdown
# [ ] Verify context is maintained across questions
# [ ] Test different user levels (beginner/expert)
```

#### Performance Validation

```bash
# Quick performance check
npm run perf-test:quick

# Full benchmark (when optimizing)
npm run bench
npm run perf-compare
```

**Actual Performance (Benchmarked):**
- Avg latency: 3.91s (Target: <90s) ✅
- P90 latency: 5.83s ✅
- Success rate: 100% ✅
- Cache hit rate: 37.5% (Target: 30%+) ✅
- L1 cache lookup: <1ms ✅
- L2 vector search: 50-200ms ✅

#### Before Committing

```bash
# Full validation before push
npm test                     # 878/888 tests passing (99%)
npm run test:accuracy        # Real-world validation
npm run test:coverage        # Coverage: Statements 23.69%, Lines 23.57%, Functions 27.41%
npm run build                # Clean build
cd vscode-extension && npm run compile  # Extension builds
```

**Latest Coverage Report (1,111 tests executed):**
- Statements: 23.69%
- Branches: 19.62%
- Lines: 23.57%
- Functions: 27.41%
- Note: Lower coverage is normal for research/prototype projects focusing on core agent behavior

---

### B. Testing in Real Android Project

#### Setup (One-Time)

```bash
# 1. Ensure Ollama is running
ollama serve

# 2. Verify model is available
ollama list
# Should see: hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF

# 3. Install extension (if testing from source)
cd vscode-extension
vsce package
# Install .vsix in VS Code: Extensions → Install from VSIX
```

#### Testing Workflow in Android Project

**1. Open Your Android Project**
```bash
# Open project in VS Code
code /path/to/your/android-project
```

**2. Test Common Error Types**

**Kotlin lateinit Error:**
```kotlin
// Create test error in MainActivity.kt
class MainActivity : AppCompatActivity() {
    lateinit var user: User
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        println(user.name)  // Error: lateinit not initialized
    }
}

// Copy error from logcat:
// "lateinit property user has not been initialized at MainActivity.kt:45"
// Open Command Palette and select "RCA Agent: Analyze Error"
```

**Jetpack Compose Error:**
```kotlin
@Composable
fun MyScreen() {
    var count = 0  // Error: state not remembered
    Button(onClick = { count++ }) {
        Text("Count: $count")
    }
}

// Copy error: "remember { ... } should be used"
// Open Command Palette and select "RCA Agent: Analyze Error"
```

**Gradle Dependency Conflict:**
```gradle
// Add conflicting dependencies in build.gradle
dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.10.0")  // Conflict
}

// Copy build error
// Open Command Palette and select "RCA Agent: Analyze Error"
```

**3. Test Features**

| Feature          | How to Test                                                 |
| ---------------- | ----------------------------------------------------------- |
| Basic Analysis   | Copy error → Use Command Palette → Check RCA quality        |
| Educational Mode | `Ctrl+Shift+P` → Toggle Educational → Check explanations    |
| Code Context     | Verify agent reads correct file/line                        |
| Fix Guidelines   | Check if fixes are actionable                               |
| Feedback System  | Click [THUMBS_UP]/[THUMBS_DOWN] → Verify stored in ChromaDB |
| Cache            | Analyze same error twice → 2nd should be instant            |
| Panel UI         | `Ctrl+Shift+P` → Open Panel → Check real-time updates       |

**4. Test Different Error Categories**

```bash
# Create errors to test all parsers:
✓ Kotlin NPE
✓ lateinit property
✓ Type mismatch
✓ Unresolved reference
✓ Compose remember
✓ LaunchedEffect
✓ XML inflation
✓ Resource not found
✓ Gradle dependency conflict
✓ Manifest merge conflict
```

**5. Validate Results**

**Good RCA Should Have:**
- [OK] Correct root cause identified
- [OK] Actionable fix guidelines (3-5 steps)
- [OK] Relevant code context shown
- [OK] Confidence score >0.7
- [OK] Completes in 60-90s

**Red Flags:**
- [X] Generic/vague root cause
- [X] Wrong file/line referenced
- [X] Fix guidelines don't apply
- [X] Takes >2 minutes
- [X] Crashes or errors

#### Quick Experiment Protocol

**15-Minute Test Run:**
```bash
1. [ ] Start Ollama (ollama serve)
2. [ ] Open Android project in VS Code
3. [ ] Trigger 3 different error types
4. [ ] Analyze each using Command Palette
5. [ ] Verify RCA quality (root cause + fixes)
6. [ ] Test cache (re-analyze same error)
7. [ ] Test educational mode
8. [ ] Provide feedback on 1-2 analyses
9. [ ] Check performance (timing)
10. [ ] Document any issues/improvements
```

#### Troubleshooting During Experiments

**Extension not responding:**
```bash
# Check Output panel
View → Output → Select "RCA Agent"

# Check Ollama is running
curl http://localhost:11434/api/tags

# Reload VS Code
Ctrl+Shift+P → "Reload Window"
```

**Poor analysis quality:**
```bash
# Enable debug mode (see agent thought process)
Ctrl+Shift+P → "RCA: Open Analysis Panel"

# Check if correct file/line is being read
# Review agent iterations and tool calls

# If still bad, provide negative feedback
Click [THUMBS_DOWN] button
```

**Performance issues:**
```bash
# Check Ollama GPU usage
nvidia-smi  # Should see GPU usage

# Monitor memory
# Close other apps if low on RAM

# Check ChromaDB (optional, can disable)
docker ps  # See if ChromaDB running
```

#### Experiment Metrics to Track

**Accuracy:**
- How many errors correctly diagnosed?
- Are fix guidelines helpful?
- Confidence scores matching quality?

**Performance:**
- First analysis time (with model loading)
- Subsequent analysis times
- Cache hit ratio

**Usability:**
- Panel UI responsive?
- Educational mode helpful?
- Command access easy?

#### After Experiments

```bash
# Review feedback data
# Check ChromaDB for stored analyses

# Document findings in DEVLOG
# Note which error types work best/worst
# Identify improvement opportunities
```

### [STATS] Project Stats

| Metric           | Value                                            |
| ---------------- | ------------------------------------------------ |
| Total LOC        | ~16,000 (~13,000 production + ~3,000 tests)      |
| Test Results     | 878/888 passing (99% pass rate)                  |
| Test Executions  | 1,111 tests executed in coverage report          |
| Code Coverage    | 23.69% statements, 23.57% lines, 27.41% funcs    |
| Build Time       | ~16s                                             |
| **Avg Latency**  | **3.91s** (benchmarked, was estimated 30-90s)    |
| **Success Rate** | **100%** (5/5 benchmark runs passed)             |
| **Cache Hit**    | **37.5%** (L1: <1ms, L2: 50-200ms)               |
| Error Parsers    | 26+ (Kotlin, Gradle, Compose, XML, Manifest)     |
| Tools            | 19 (9 backend + 10 extension)                    |
| Knowledge Base   | 156 AGP + 52 Kotlin versions                     |
| Chat LOC         | ConversationalAgent (540) + GuidedWorkflow (550) |
| Services         | 9 core extension services                        |
| TypeScript Ver   | 5.9.3 (⚠️ officially supported: <5.4.0)           |
| Implementation   | Complete with ongoing testing                    |
| Current Progress | Testing & Refinement                             |
