# 🔌 VS Code Extension - Complete User Guide

> **AI-Powered Root Cause Analysis (RCA) Agent for Kotlin/Android Development**  
> Version: 2.0 | Last Updated: December 24, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [UI Components](#ui-components)
5. [Commands & Shortcuts](#commands--shortcuts)
6. [How to Run in Real-Time](#how-to-run-in-real-time)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The RCA Agent VS Code Extension is an **AI-powered debugging assistant** that analyzes Kotlin/Android errors and provides:
- ✅ Root cause identification
- ✅ Actionable fix guidelines
- ✅ Educational explanations (beginner-friendly)
- ✅ Performance metrics & caching
- ✅ Learning from past errors

**Technology Stack:**
- **Frontend**: TypeScript, VS Code Extension API
- **Backend**: Node.js, TypeScript (in `src/` directory)
- **AI Model**: Ollama (local LLM - hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest recommended)
- **Database**: ChromaDB (vector store for learning)

---

## ✨ Features

### 1. **Automatic Error Analysis** 🔍
- Select any error message or stack trace in your editor
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Get instant AI-powered root cause analysis

### 2. **Multi-Language Support** 🌐
- **Kotlin**: 6+ error types (NPE, lateinit, unresolved reference, etc.)
- **Jetpack Compose**: 8+ error types (remember, recomposition, LaunchedEffect, etc.)
- **XML Layouts**: 7+ error types (inflation, missing ID, attributes, etc.)
- **Gradle**: 5+ error types (dependency conflicts, build failures, etc.)
- **AndroidManifest.xml**: 5+ error types (permissions, components, merge conflicts)

**Total: 26+ error types supported**

### 3. **Interactive Webview** 🎨
- Beautiful, theme-aware UI that matches VS Code theme
- Real-time progress updates during analysis
- Agent thought process visualization
- Clickable file/line references
- Code snippet highlighting
- Copy-to-clipboard buttons

### 4. **Educational Mode** 🎓
- Beginner-friendly explanations
- "What/Why/How" learning structure
- Code examples and best practices
- Perfect for students and junior developers

**Toggle with**: `Ctrl+Shift+E` or Command Palette → "Toggle Educational Mode 🎓"

### 5. **Performance Metrics** ⚡
- Total analysis time
- LLM inference time
- Tool execution time
- Cache hit rate
- Token usage (prompt/completion)

**Toggle with**: `Ctrl+Shift+P` or Command Palette → "Toggle Performance Metrics ⚡"

### 6. **Smart Caching** 💾
- Remembers previously analyzed errors
- Instant results for repeated errors (<5s vs 75s)
- Automatic cache invalidation on negative feedback
- 60%+ cache hit rate for common errors

### 7. **User Feedback Loop** 👍👎
- Rate analysis results (helpful/not helpful)
- Provide optional comments
- Improves future analyses
- Updates knowledge base quality scores

---

## 🏗️ Architecture

```
vscode-extension/
├── src/
│   ├── extension.ts           # Main entry point (2053 lines)
│   │   ├── Command registration
│   │   ├── Error parsing & analysis
│   │   ├── Cache management
│   │   ├── Feedback handling
│   │   └── Settings integration
│   │
│   └── ui/
│       └── RCAWebview.ts      # Webview UI (1007 lines)
│           ├── Interactive panel
│           ├── Progress updates
│           ├── Result display
│           ├── Educational mode
│           └── Performance metrics
│
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
├── README.md                  # User documentation
├── QUICKSTART.md              # Setup guide
└── EDUCATIONAL_MODE.md        # Educational mode guide

Backend Integration (../src/):
├── agent/                     # AI agent logic
│   ├── MinimalReactAgent.ts   # ReAct reasoning loop
│   ├── PromptEngine.ts        # Few-shot learning
│   ├── EducationalAgent.ts    # Learning notes
│   └── AgentStateStream.ts    # Real-time updates
│
├── utils/                     # Error parsing
│   ├── ErrorParser.ts         # Multi-language routing
│   ├── LanguageDetector.ts    # Language detection
│   └── parsers/               # Language-specific parsers
│
├── tools/                     # Tool implementations
│   ├── ReadFileTool.ts        # Code context
│   ├── LSPTool.ts             # Code analysis
│   ├── AndroidBuildTool.ts    # Version resolution
│   └── AndroidDocsSearchTool.ts
│
├── db/                        # Database & embeddings
│   ├── ChromaDBClient.ts      # Vector store
│   ├── EmbeddingService.ts    # Ollama embeddings
│   └── QualityScorer.ts       # Quality scoring
│
└── cache/                     # Caching system
    ├── RCACache.ts            # L1 in-memory cache
    └── ErrorHasher.ts         # SHA-256 hashing
```

---

## 🖥️ UI Components

### 1. **Output Channel** (Text-Based)

When you run `Ctrl+Shift+R`, results appear in the **"RCA Agent"** output panel:

```
🔴 ERROR ANALYSIS
════════════════════════════════════════════════════

📄 File: MainActivity.kt:42
🔍 Error Type: lateinit
💬 Error Message: lateinit property viewBinding has not been initialized

────────────────────────────────────────────────────
🎯 ROOT CAUSE
────────────────────────────────────────────────────

The property 'viewBinding' was accessed before being initialized
in onCreate(). The binding is created in setContentView() which
is called after the property access.

────────────────────────────────────────────────────
🛠️  FIX GUIDELINES
────────────────────────────────────────────────────

1. Move the viewBinding access after setContentView() call
2. Initialize viewBinding in onCreate() before using it
3. Consider using nullable type: private var viewBinding: ViewBinding? = null

────────────────────────────────────────────────────
📊 METADATA
────────────────────────────────────────────────────

✅ Confidence: 85%
🔧 Tools Used: ReadFileTool, LSPTool
🔄 Iterations: 2
⏱️  Analysis Time: 12.5s
💾 Cache: MISS (stored for future use)
```

### 2. **Interactive Webview** (Visual UI)

When you run `Ctrl+Shift+W`, results open in a side panel with:

**Header Section:**
- 🔴/🟠/🔵 Error severity badge
- Error type & file location
- Confidence meter (visual bar)

**Progress Section** (during analysis):
- Animated progress bar
- Current iteration (e.g., "Iteration 2/3")
- Agent's thought process in real-time

**Results Section:**
- 📝 Error message (highlighted)
- 🎯 Root cause analysis
- 🛠️ Fix guidelines (numbered list)
- 📄 Code snippet (with syntax highlighting)
- 🔗 Clickable file/line references

**Educational Section** (if enabled):
- 🎓 "What" - Error explanation
- 🎓 "Why" - Common causes
- 🎓 "How" - Prevention strategies
- 📖 Code examples

**Performance Section** (if enabled):
- ⚡ Total analysis time
- 🧠 LLM inference time
- 🔧 Tool execution time
- 💾 Cache hit rate
- 📊 Token usage

**Footer Section:**
- 👍 "Helpful" button
- 👎 "Not Helpful" button
- 📋 Copy code button

---

## ⌨️ Commands & Shortcuts

### Main Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| **Analyze Error** | `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`) | Analyze selected error text (output channel) |
| **Analyze Error (Webview)** | `Ctrl+Shift+W` (Mac: `Cmd+Shift+W`) | Analyze selected error text (visual panel) |
| **Toggle Educational Mode** | `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`) | Enable/disable educational explanations |
| **Toggle Performance Metrics** | `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) | Show/hide performance metrics |

### Command Palette Access

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type:
- `RCA Agent: Analyze Error`
- `RCA Agent: Analyze Error (Webview)`
- `RCA Agent: Toggle Educational Mode 🎓`
- `RCA Agent: Toggle Performance Metrics ⚡`

### Usage Flow

1. **Copy error** from terminal, logcat, or compiler output
2. **Paste or select** in VS Code editor
3. **Press shortcut** (`Ctrl+Shift+R` or `Ctrl+Shift+W`)
4. **View results** in output channel or webview
5. **Provide feedback** (optional - 👍/👎 buttons)

---

## 🚀 How to Run in Real-Time (On Another Project)

### Prerequisites

#### 1. Install Ollama (LLM Server)

**Windows:**
```powershell
# Download from https://ollama.ai/download
# Run installer, then start Ollama

# Pull recommended model (8B parameters, ~4.7GB)
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# Verify installation
ollama list
```

**Mac/Linux:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# Start server (runs on http://localhost:11434)
ollama serve
```

**Verify Ollama is running:**
```bash
curl http://localhost:11434/api/tags
```

#### 2. Install ChromaDB (Optional - for learning from past errors)

**Using Docker (Recommended):**
```bash
docker run -d -p 8000:8000 chromadb/chroma
```

**Using Python:**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

**Verify ChromaDB is running:**
```bash
curl http://localhost:8000/api/v1/heartbeat
```

---

### Installation Methods

#### **Method 1: Install from VSIX (Recommended)**

1. **Build the extension** (if not already built):
   ```bash
   cd c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension
   npm install
   npm run compile
   ```

2. **Package the extension** (creates `.vsix` file):
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```
   This creates `rca-agent-extension-2.0.vsix`

3. **Install in VS Code**:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
   - Type "Extensions: Install from VSIX..."
   - Select `rca-agent-extension-2.0.vsix`
   - Click "Reload" when prompted

4. **Verify installation**:
   - Press `Ctrl+Shift+P`
   - Type "RCA Agent"
   - You should see all 4 commands listed

---

#### **Method 2: Run in Development Mode (For Testing)**

1. **Open extension folder in VS Code**:
   ```bash
   cd c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension
   code .
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile TypeScript**:
   ```bash
   npm run compile
   # Or watch mode for live reloading:
   npm run watch
   ```

4. **Launch Extension Development Host**:
   - Press `F5` (or click "Run > Start Debugging")
   - A new VS Code window opens with the extension loaded
   - This window has "[Extension Development Host]" in the title

5. **Open your target project** in the Extension Development Host window

6. **Test the extension**:
   - Create a test file with a Kotlin error
   - Select the error text
   - Press `Ctrl+Shift+R`
   - View results in "RCA Agent" output panel

---

### Testing on a Real Project

#### Example: Analyzing Errors in an Android Project

1. **Open your Android project in VS Code**

2. **Find an error** (one of these methods):
   - Build project and copy error from terminal
   - Open a Kotlin file with compiler errors
   - Copy stack trace from Android Studio logcat

3. **Example Kotlin Error:**
   ```kotlin
   Exception in thread "main" kotlin.UninitializedPropertyAccessException: 
   lateinit property viewBinding has not been initialized
       at com.example.myapp.MainActivity.onCreate(MainActivity.kt:42)
       at android.app.Activity.performCreate(Activity.java:6876)
   ```

4. **Analyze the error:**
   - Select the error text
   - Press `Ctrl+Shift+R` (output channel) or `Ctrl+Shift+W` (webview)
   - Wait 10-15 seconds for AI analysis

5. **View results:**
   - Root cause explanation
   - Step-by-step fix guidelines
   - Code suggestions
   - Educational notes (if enabled)

6. **Provide feedback:**
   - Click 👍 if analysis was helpful
   - Click 👎 if analysis was incorrect
   - Optionally provide comments

---

### Configuration for Your Project

#### 1. **Configure Ollama URL** (if not default):

**Settings UI:**
- `File > Preferences > Settings` (or `Ctrl+,`)
- Search for "RCA Agent"
- Set "Ollama URL" to your server address

**settings.json:**
```json
{
  "rcaAgent.ollamaUrl": "http://localhost:11434",
  "rcaAgent.model": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest",
  "rcaAgent.showPerformanceMetrics": false
}
```

#### 2. **Choose AI Model**:

Available models (from fastest to most accurate):
- `hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest` - **Recommended** (4.7GB, best balance)
- `codellama:7b` - Fast (3.8GB, good for quick analyses)
- `qwen-coder:7b` - Strong reasoning (4.2GB)
- `deepseek-coder:6.7b` - Compact (3.6GB, low-memory systems)

**Pull a different model:**
```bash
ollama pull codellama:7b
```

**Update settings:**
```json
{
  "rcaAgent.model": "codellama:7b"
}
```

#### 3. **Enable Educational Mode** (for learning):

- Press `Ctrl+Shift+E`
- Or: `Ctrl+Shift+P` → "Toggle Educational Mode 🎓"

#### 4. **Enable Performance Metrics** (for optimization):

- Press `Ctrl+Shift+P` → "Toggle Performance Metrics ⚡"
- Or update settings:
```json
{
  "rcaAgent.showPerformanceMetrics": true
}
```

---

### Real-World Usage Examples

#### Example 1: NPE Error

**Error:**
```
Exception in thread "main" java.lang.NullPointerException
    at com.example.MainActivity.onCreate(MainActivity.kt:42)
```

**Steps:**
1. Select error text
2. Press `Ctrl+Shift+R`
3. Get analysis in ~12s

**Output:**
```
🎯 ROOT CAUSE: Accessing nullable property without null check
🛠️  FIX: Use safe call (?.) or Elvis operator (?:)
✅ Confidence: 92%
```

---

#### Example 2: Compose Recomposition Issue

**Error:**
```
IllegalStateException: Reading state outside of composition
    at androidx.compose.runtime.ProduceStateKt.produceState
```

**Steps:**
1. Select error text
2. Press `Ctrl+Shift+W` (webview)
3. View interactive results with Compose-specific tips

**Output:**
- Root cause: State read in side effect
- Fix: Use rememberUpdatedState()
- Educational note: Explains Compose lifecycle

---

#### Example 3: Gradle Dependency Conflict

**Error:**
```
Conflict with dependency 'com.google.android.material' 
in project ':app'. Resolved versions: 1.5.0 and 1.6.0
```

**Steps:**
1. Select error text
2. Press `Ctrl+Shift+R`
3. Get dependency resolution strategy

**Output:**
- Conflicting versions identified
- Recommended version: 1.6.0
- Fix command: `implementation 'com.google.android.material:material:1.6.0'`

---

## ⚙️ Configuration

### Extension Settings

Access via `File > Preferences > Settings > Extensions > RCA Agent`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `rcaAgent.ollamaUrl` | string | `http://localhost:11434` | Ollama server URL |
| `rcaAgent.model` | string | `hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest` | LLM model to use |
| `rcaAgent.showPerformanceMetrics` | boolean | `false` | Show performance metrics in results |

### Model Comparison

| Model | Size | Speed | Accuracy | Best For |
|-------|------|-------|----------|----------|
| `hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest` | 4.7GB | Fast | High | **Recommended** - Best balance |
| `codellama:7b` | 3.8GB | Very Fast | Medium | Quick analyses |
| `qwen-coder:7b` | 4.2GB | Medium | High | Complex reasoning |
| `deepseek-coder:6.7b` | 3.6GB | Fast | Medium | Low-memory systems |

### Performance Tuning

**For faster analysis:**
- Use smaller model (`codellama:7b`)
- Disable performance metrics
- Ensure Ollama has GPU access

**For better accuracy:**
- Use larger model (`qwen-coder:7b`)
- Enable educational mode
- Provide more context (full stack trace)

---

## 🐛 Troubleshooting

### Issue: "Could not connect to Ollama"

**Symptoms:**
- Analysis fails immediately
- Error: "Failed to connect to http://localhost:11434"

**Solutions:**
1. Check if Ollama is running:
   ```bash
   # Windows
   netstat -an | findstr "11434"
   
   # Mac/Linux
   lsof -i :11434
   ```

2. Start Ollama server:
   ```bash
   ollama serve
   ```

3. Verify model is downloaded:
   ```bash
   ollama list
   # Should show hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```

4. Test connection:
   ```bash
   curl http://localhost:11434/api/tags
   ```

5. Check firewall/antivirus settings

---

### Issue: "Analysis timed out"

**Symptoms:**
- Analysis takes >2 minutes
- No response from LLM

**Solutions:**
1. Use smaller model:
   ```bash
   ollama pull codellama:7b
   ```
   Update settings: `"rcaAgent.model": "codellama:7b"`

2. Check system resources:
   - Task Manager (Windows) or Activity Monitor (Mac)
   - Ensure sufficient RAM (8GB+ recommended)
   - Check GPU usage (should use CUDA/Metal)

3. Simplify error text:
   - Remove unnecessary stack frames
   - Focus on the first error in the trace

4. Check Ollama logs:
   ```bash
   # View Ollama logs
   ollama logs
   ```

---

### Issue: "Could not parse error"

**Symptoms:**
- Message: "Could not parse error. Is this a Kotlin/Android error?"
- No analysis performed

**Solutions:**
1. Ensure error text includes:
   - Error type (e.g., `NullPointerException`)
   - File path (e.g., `MainActivity.kt:42`)
   - Stack trace (optional but helpful)

2. Supported error formats:
   ```
   ✅ Exception in thread "main" kotlin.UninitializedPropertyAccessException...
   ✅ Error: Unresolved reference: getString at MainActivity.kt:35
   ✅ Caused by: java.lang.NullPointerException at MyClass.kt:10
   ❌ "Something went wrong" (too vague)
   ```

3. Check supported error types:
   - View full list in [README.md](README.md#supported-error-types)
   - 26+ error types across 5 languages

4. View debug logs:
   - Open "RCA Agent Debug" output channel
   - Look for parser errors

---

### Issue: "Extension commands not showing"

**Symptoms:**
- Commands not in Command Palette
- Keyboard shortcuts don't work

**Solutions:**
1. Reload VS Code:
   - Press `Ctrl+Shift+P` → "Developer: Reload Window"

2. Verify extension is activated:
   - View → Extensions
   - Search "RCA Agent"
   - Should show "Installed" badge

3. Check activation events:
   - Open VS Code terminal
   - Run: `code --list-extensions`
   - Should include `rca-agent-extension`

4. Reinstall extension (if using VSIX):
   - Uninstall current version
   - Reinstall from VSIX file
   - Reload window

---

### Issue: No output displayed

**Symptoms:**
- Command runs but no results
- Output channel is empty

**Solutions:**
1. Check if output channel is visible:
   - View → Output
   - Dropdown → "RCA Agent"

2. Check debug logs:
   - Output dropdown → "RCA Agent Debug"
   - Look for errors

3. Verify Ollama is responding:
   ```bash
   curl -X POST http://localhost:11434/api/generate \
     -d '{"model": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest", "prompt": "test"}'
   ```

4. Try webview mode:
   - Use `Ctrl+Shift+W` instead of `Ctrl+Shift+R`
   - Webview has better error visibility

---

## 📊 Performance Benchmarks

**Hardware:** RTX 3070 Ti (8GB VRAM), Ryzen 5 5600x, 32GB RAM  
**Model:** hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest (~5GB)

| Metric | Value | Notes |
|--------|-------|-------|
| **Average Latency** | 75.8s | First analysis (cache miss) |
| **Cache Hit Latency** | <5s | Repeated errors |
| **Accuracy** | 100% | 20/20 Android test cases |
| **Cache Hit Rate** | ~60% | For common errors |
| **Parse Time** | <1ms | Error parsing only |
| **Embedding Time** | ~500ms | With caching enabled |

---

## 🎓 Educational Mode Details

**What You Get:**
- "What" - Clear error explanation
- "Why" - Root cause & common scenarios
- "How" - Prevention strategies + code examples

**Example Output:**

```
🎓 LEARNING NOTES
════════════════════════════════════════════════════

📚 WHAT is a lateinit error?
─────────────────────────────────────────────────────
A lateinit property is a non-null variable that will be
initialized later. This error occurs when you access it
before initialization.

📚 WHY did this happen?
─────────────────────────────────────────────────────
Common causes:
• Accessed in wrong lifecycle phase (e.g., before onCreate)
• Forgot to call initialization method
• Conditional initialization didn't execute

📚 HOW to prevent this?
─────────────────────────────────────────────────────
1. Use ::property.isInitialized check:
   if (::viewBinding.isInitialized) { ... }

2. Consider lazy delegation:
   private val viewBinding by lazy { ... }

3. Use nullable types if unsure:
   private var viewBinding: ViewBinding? = null
```

**Toggle:** Press `Ctrl+Shift+E` or use Command Palette

---

## 🔄 Feedback System

**How It Works:**
1. After each analysis, you see feedback prompt
2. Click 👍 "Yes, helpful!" or 👎 "Not helpful"
3. For 👎, optionally provide comments
4. System updates knowledge base automatically

**Effects of Feedback:**

**Positive (👍):**
- ✅ Confidence score +20%
- ✅ Solution prioritized in future searches
- ✅ Quality score increased in database
- ✅ Cache entry preserved

**Negative (👎):**
- ❌ Confidence score -50%
- ❌ Cache entry invalidated (re-analysis next time)
- ❌ Quality score decreased in database
- ❌ Solution de-prioritized in searches
- 📝 User comment stored for improvement

---

## 📚 Additional Resources

- **Main Documentation**: [README.md](../README.md)
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Educational Mode**: [EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md)
- **API Contracts**: [../docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md)
- **Backend Architecture**: [../docs/architecture/overview.md](../docs/architecture/overview.md)

---

## 🤝 Contributing

Found a bug or want to request a feature?
1. Open an issue on GitHub
2. Use the feedback system (👍/👎 buttons)
3. Provide detailed error logs from "RCA Agent Debug" channel

---

## 📄 License

MIT License - See [LICENSE](../LICENSE)