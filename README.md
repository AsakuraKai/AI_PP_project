# RCA Agent: Local-First AI Debugging Assistant

> **Personal Learning Project** - Building a local AI debugging assistant for Kotlin/Android development.  
> **Current Status:** Phase 4 Real-World Testing [LAUNCH] | Backend Complete [OK] | Chat Interface Complete [OK]

---

## [SUCCESS] Latest Updates (January 2026)

### [OK] Phase 1: Backend Infrastructure (COMPLETE - Dec 25, 2025)
- **26+ error parsers** with 100% parsing accuracy
- **MinimalReactAgent** with ReAct reasoning and tool execution
- **Knowledge bases** covering 156 AGP versions + 52 Kotlin versions
- **ChromaDB integration** for semantic search and caching
- **878/878 tests passing** with 99% code coverage
- **Status:** Production-ready backend

### [OK] Phase 2-3: Chat Participant + Intelligence (COMPLETE - Jan 1, 2026)
- **Conversational interface** via `@rca-agent` chat participant
- **Context-aware analysis** from files, diagnostics, and terminal output
- **Action buttons** for Apply Fix, Explain More, and Search Similar
- **2,900+ LOC** of production chat interface code
- **10.35s average response time** (88% faster than 90s target)
- **Status:** Ready for real-world testing

### [LAUNCH] Phase 4: Real-World Testing (IN PROGRESS - Week 4 Complete)
**Week 1-2 (COMPLETE):** Testing infrastructure
- Phase4TestSuite with 10 diverse test cases
- 7 standardized metrics for evaluation
- Automated test runner with health checks
- Test fixtures for 7 major error types

**Week 3-4 (COMPLETE):** Interactive debugging features
- ConversationalAgent (540 LOC) for multi-turn debugging
- GuidedDebuggingWorkflow (550 LOC) for step-by-step guidance
- Full LLM integration with persistence and VS Code commands
- 16 comprehensive integration tests

**Week 5+ (CURRENT):** Baseline testing and improvements
- Running baseline tests to collect real-world metrics
- Analyzing failure patterns and edge cases
- Target: 85%+ usability rating, 8/10 tests passing

### [STATS] Current Project Stats
- **15+ weeks** of development (Dec 2025 - Jan 2026)
- **~15,000 total LOC** (~12,000 production + ~3,000 tests)
- **1,111/1,120 tests passing** (99% pass rate)
- **99% code coverage** across all modules
- **10.35s average response time** (88% faster than target)
- **Phase 4 testing** in progress with comprehensive real-world validation

---

## 🏗️ Current Architecture

The project is built with a modular, production-ready architecture:

### Backend Core (`src/`)
- **Agent System** - MinimalReactAgent with ReAct reasoning, multi-pass analysis
- **Error Parsers** - 26+ parsers for Kotlin, Gradle, Compose, XML, Manifest errors
- **Tools** - ReadFile, LSP, AndroidBuild, Manifest, Docs tools
- **Knowledge Bases** - 156 AGP + 52 Kotlin versions with semantic search
- **Caching** - ChromaDB-backed semantic caching and RCA storage
- **Streaming** - Real-time agent state updates with EventEmitter

### VS Code Extension (`vscode-extension/`)
- **Chat Participant** - Conversational `@rca-agent` interface
- **Webview Panel** - React-based analysis dashboard
- **Commands** - Error analysis, educational mode, settings
- **Context Integration** - Files, diagnostics, terminal output

### Testing Infrastructure (`tests/`)
- **Unit Tests** - 878 backend unit tests with 99% coverage
- **Integration Tests** - 16 chat workflow and interactive debugging tests
- **Real-World Tests** - Phase4TestSuite with 10 diverse Android scenarios

---

## 📚 Documentation

All project documentation is organized in the `docs/` folder:

### Core Documentation
- **[Development Log (DEVLOG)](docs/DEVLOG.md)** - Weekly progress journal with detailed status updates
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Complete file organization and statistics
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Architecture and extension guide
- **[User Guide](docs/USER_GUIDE.md)** - Installation and usage guide

### Additional Resources
- **[Learnings](docs/LEARNINGS.md)** - Key insights from 15+ weeks of development
- **[Roadmap](docs/Roadmap.md)** - Phase-by-phase implementation plan
- **[Milestone Archive](docs/_archive/milestones/)** - Historical completion reports

---

## [LAUNCH] Quick Start

### Prerequisites
- Node.js 18+
- Ollama with DeepSeek-R1-Distill-Qwen-7B-GGUF:latest model
- TypeScript 5+

### Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run Phase 4 real-world tests (requires Ollama)
npm run test:phase4
```

### Current Implementation Status

**[OK] Phase 1: Backend (COMPLETE - Dec 25, 2025)**
- 26+ error parsers (Kotlin, Gradle, Compose, XML, Manifest)
- MinimalReactAgent with ReAct reasoning and tool execution
- 5 specialized tools (ReadFile, LSP, AndroidBuild, Manifest, Docs)
- ChromaDB integration for caching and semantic search
- Knowledge bases: 156 AGP + 52 Kotlin versions
- 878/878 tests passing, 99% coverage

**[OK] Phase 2-3: Chat Interface (COMPLETE - Jan 1, 2026)**
- Conversational `@rca-agent` chat participant
- Context-aware analysis from files, diagnostics, terminal
- Action buttons (Apply Fix, Explain More, Search Similar)
- Real-time agent state streaming
- 2,900+ LOC of production code
- 10.35s average response time

**[LAUNCH] Phase 4: Real-World Testing (IN PROGRESS - Week 4 Complete)**
- Week 1-2: Testing infrastructure with Phase4TestSuite
- Week 3-4: Interactive debugging (ConversationalAgent, GuidedDebugging)
- Week 5+: Baseline testing and iterative improvements
- Target: 85%+ usability, 8/10 tests passing

**🔮 Phase 5: Advanced Features (FUTURE)**
- Educational Agent with learning notes
- Performance optimization (parallel tools, profiling)
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

# 3. Quick test commands:
#    - Ctrl+Shift+P → "RCA: Analyze Error"
#    - Ctrl+Shift+P → "RCA: Toggle Educational Mode"
#    - Ctrl+Shift+P → "RCA: Open Analysis Panel"

# 4. Check logs in Debug Console for errors
```

#### Performance Validation

```bash
# Quick performance check
npm run perf-test:quick

# Full benchmark (when optimizing)
npm run bench
npm run perf-compare
```

**Performance Targets:**
- Avg latency: <90s
- Parse rate: 100%
- Cache hit rate: 30%+

#### Before Committing

```bash
# Full validation before push
npm test                     # All tests
npm run test:accuracy        # Real-world validation
npm run build                # Clean build
cd vscode-extension && npm run compile  # Extension builds
```

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

| Feature          | How to Test                                              |
| ---------------- | -------------------------------------------------------- |
| Basic Analysis   | Copy error → Use Command Palette → Check RCA quality     |
| Educational Mode | `Ctrl+Shift+P` → Toggle Educational → Check explanations |
| Code Context     | Verify agent reads correct file/line                     |
| Fix Guidelines   | Check if fixes are actionable                            |
| Feedback System  | Click [THUMBS_UP]/[THUMBS_DOWN] → Verify stored in ChromaDB                    |
| Cache            | Analyze same error twice → 2nd should be instant         |
| Panel UI         | `Ctrl+Shift+P` → Open Panel → Check real-time updates    |

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

---

## [STATS] Project Stats

| Metric               | Value                                        |
| -------------------- | -------------------------------------------- |
| **Development Time** | 15+ weeks (Dec 2025 - Jan 2026)              |
| **Total LOC**        | ~15,000 (~12,000 production + ~3,000 tests)  |
| **Test Results**     | 1,111/1,120 passing (99% pass rate)          |
| **Code Coverage**    | 99% across all modules                       |
| **Build Time**       | ~16s                                         |
| **Response Time**    | 10.35s avg (88% faster than 90s target)      |
| **Error Parsers**    | 26+ (Kotlin, Gradle, Compose, XML, Manifest) |
| **Tools**            | 5 specialized tools                          |
| **Knowledge Base**   | 156 AGP + 52 Kotlin versions                 |
| **Current Phase**    | Phase 4 Real-World Testing                   |

---

## 📖 Learn More

See [docs/README.md](docs/README.md) for comprehensive project documentation.
