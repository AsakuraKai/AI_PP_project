# RCA Agent: Local-First AI Debugging Assistant

> **Personal Learning Project** - Building a local AI debugging assistant for Kotlin/Android development.  
> **Current Status:** Week 12/13 Complete - Chunks 1.1-5.1 ✅ (816/826 tests passing, 10 pre-existing Android failures) - AGENT STATE STREAMING LIVE!

---

## 📚 Documentation

All project documentation is organized in the `docs/` folder:

### Quick Links
- **[Project Overview & Setup](docs/README.md)** - What this is, hardware requirements, getting started
- **[Development Log (DEVLOG)](docs/DEVLOG.md)** - Weekly progress journal with all implementation details
- **[Roadmap](docs/Roadmap.md)** - Complete phase-by-phase implementation plan
- **[Current Status Report](docs/CHUNK-2-STATUS-REPORT.md)** - Latest chunk completion status
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - File organization and statistics

### Milestone Documentation
- [Chunk 1.1-1.3 Complete](docs/_archive/milestones/Chunk-1.1-1.3-COMPLETE.md) - LLM Client, Parser, Agent (Dec 17-18)
- [Chunk 1.4 Complete](docs/_archive/milestones/Chunk-1.4-COMPLETE.md) - File Reading Tool (Dec 18)
- [Chunk 1.5 Complete](docs/_archive/milestones/Chunk-1.5-COMPLETE.md) - MVP Testing (Dec 18)
- [Chunk 2.1 Complete](docs/_archive/milestones/Chunk-2.1-COMPLETE.md) - Full Error Parser (Dec 18)
- [Chunk 2.2-2.3 Complete](docs/_archive/milestones/Chunk-2.2-2.3-COMPLETE.md) - Tools & Prompts (Dec 18)
- [Chunk 2.4 Complete](docs/_archive/milestones/Chunk-2.4-COMPLETE.md) - Agent Integration ✅ (Dec 19)
- [Chunk 2 Summary Complete](docs/_archive/milestones/Chunk-2-COMPLETE-Summary.md) - Complete Chunk 2 Overview ✅ (Dec 18-19)
- [Chunk 3.1 Complete](docs/_archive/milestones/Chunk-3.1-COMPLETE.md) - ChromaDB Setup ✅ (Dec 19)
- [Chunk 3.2 Complete](docs/_archive/milestones/Chunk-3.2-COMPLETE.md) - Embedding & Search ✅ (Dec 19)
- [Chunk 3.3 Complete](docs/_archive/milestones/Chunk-3.3-COMPLETE.md) - Caching System ✅ (Dec 19)
- [Chunk 3.4 Complete](docs/_archive/milestones/Chunk-3.4-COMPLETE.md) - User Feedback System ✅ (Dec 19)
- [Chunk 4.1 Complete](docs/_archive/milestones/Chunk-4.1-COMPLETE.md) - Jetpack Compose Parser ✅ (Dec 19)
- [Chunk 4.2 Complete](docs/_archive/milestones/Chunk-4.2-COMPLETE.md) - XML Layout Parser ✅ (Dec 19)
- [Chunk 4.3 Complete](docs/_archive/milestones/Chunk-4.3-COMPLETE.md) - Gradle Build Analyzer ✅ (Dec 19)
- [Chunk 4.4-4.5 Complete](docs/_archive/milestones/Chunk-4.4-4.5-COMPLETE.md) - Manifest & Docs + Testing ✅ (Dec 19)
- [Chunk 5.1 Complete](docs/_archive/milestones/Kai-Backend/Chunk-5.1-COMPLETE.md) - Agent State Streaming ✅ (Dec 18, 2025)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Ollama with DeepSeek-R1-Distill-Qwen-7B-GGUF:latest model
- TypeScript 5+

### Installation
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run accuracy tests (requires Ollama)
npm run test:accuracy
```

### Current Implementation Status

**✅ Completed (Weeks 1-12/13):**
- **Chunks 1.1-1.5:** MVP Backend (OllamaClient, Parser, Agent, ReadFileTool, Testing)
- **Chunks 2.1-2.4:** Core Tools Backend (Full parser, LSP tools, PromptEngine, Integration)
- **Chunks 3.1-3.4:** Database Backend (ChromaDB, Embedding, Caching, User Feedback)
- **Chunks 4.1-4.3:** Android Parsers (Compose, XML, Gradle) ✅
- **Chunks 4.4-4.5:** Android Tools & Testing (Manifest, Docs, 20 test cases) ✅
- **Chunk 5.1:** Agent State Streaming (Real-time UI updates, EventEmitter, DocumentSynthesizer) ✅
- 33 source files (~9,600 lines)
- 816 tests passing, 10 pre-existing Android failures
- 95%+ code coverage
- 18+ error types supported (Kotlin, Gradle, Compose, XML, Manifest)
- 5 tools implemented (ReadFile, LSP, AndroidBuild, Manifest, Docs)
- 20 real Android test cases (35% baseline accuracy, optimizing to 70%)
- Dynamic tool execution with ToolRegistry
- Few-shot prompting with PromptEngine
- ChromaDB for RCA storage and semantic search
- User feedback system with quality management
- Real-time agent state streaming with 6 event types
- Markdown RCA report generation with code highlighting
- Fully integrated agent with backward compatibility

**🎯 Next Up (Week 13-14):**
- Chunk 5.2: Educational Agent (learning notes, beginner explanations)
- Chunk 5.3: Performance Optimization (parallel tools, profiling)
- Continue Android parser optimization (reach 70% accuracy)

---

## 🧪 Personal Testing Guide

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
- ✅ Tests pass (816/826 expected)
- ✅ Coverage stays >95%
- ✅ No TypeScript errors
- ✅ Build completes (~16s)

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
#    - Ctrl+Shift+R → Analyze Error
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
// Press Ctrl+Shift+R → Analyze
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
// Press Ctrl+Shift+R → Analyze
```

**Gradle Dependency Conflict:**
```gradle
// Add conflicting dependencies in build.gradle
dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.10.0")  // Conflict
}

// Copy build error
// Press Ctrl+Shift+R → Analyze
```

**3. Test Features**

| Feature | How to Test |
|---------|-------------|
| Basic Analysis | Copy error → `Ctrl+Shift+R` → Check RCA quality |
| Educational Mode | `Ctrl+Shift+P` → Toggle Educational → Check explanations |
| Code Context | Verify agent reads correct file/line |
| Fix Guidelines | Check if fixes are actionable |
| Feedback System | Click 👍/👎 → Verify stored in ChromaDB |
| Cache | Analyze same error twice → 2nd should be instant |
| Panel UI | `Ctrl+Shift+P` → Open Panel → Check real-time updates |

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
- ✅ Correct root cause identified
- ✅ Actionable fix guidelines (3-5 steps)
- ✅ Relevant code context shown
- ✅ Confidence score >0.7
- ✅ Completes in 60-90s

**Red Flags:**
- ❌ Generic/vague root cause
- ❌ Wrong file/line referenced
- ❌ Fix guidelines don't apply
- ❌ Takes >2 minutes
- ❌ Crashes or errors

#### Quick Experiment Protocol

**15-Minute Test Run:**
```bash
1. [ ] Start Ollama (ollama serve)
2. [ ] Open Android project in VS Code
3. [ ] Trigger 3 different error types
4. [ ] Analyze each with Ctrl+Shift+R
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
Click 👎 button
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
- Keyboard shortcuts working?
- Panel UI responsive?
- Educational mode helpful?

#### After Experiments

```bash
# Review feedback data
# Check ChromaDB for stored analyses

# Document findings in DEVLOG
# Note which error types work best/worst
# Identify improvement opportunities
```

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Total Source Files | 33 files |
| Total Tests | 816 passing (10 pre-existing failures) |
| Code Coverage | 95%+ |
| Build Time | ~16s |
| Lines of Code | ~9,600 |
| Documentation | ~16,000 lines |
| Android Accuracy | 35% (baseline, optimizing to 70%) |

---

## 📖 Learn More

See [docs/README.md](docs/README.md) for comprehensive project documentation.
