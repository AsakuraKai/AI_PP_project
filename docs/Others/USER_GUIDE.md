# RCA Agent User Guide

**Version:** 2.0.0  
**Last Updated:** January 5, 2026

Welcome to RCA Agent! This guide will help you get started with your AI-powered debugging assistant for Kotlin/Android development.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Using the Panel Interface](#using-the-panel-interface)
4. [Error Analysis Workflow](#error-analysis-workflow)
5. [Advanced Features](#advanced-features)
6. [Troubleshooting](#troubleshooting)
7. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Prerequisites

Before using RCA Agent, you'll need:

1. **VS Code 1.80 or higher**
2. **Ollama** - Local LLM server
3. **Node.js 18+** (for development)

### Installing Ollama

1. **Download Ollama** from [https://ollama.ai](https://ollama.ai)

2. **Install the recommended model:**
   ```bash
   # This will download ~5GB of model data
   ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```

3. **Start Ollama server:**
   ```bash
   ollama serve
   ```

4. **Verify installation:**
   ```bash
   ollama list
   ```
   You should see the DeepSeek model listed.

### Installing RCA Agent Extension

**Method 1: From VSIX File**
1. Download `rca-agent-extension-2.0.vsix`
2. In VS Code, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Extensions: Install from VSIX..."
4. Select the downloaded file

### First Launch

1. Open a Kotlin/Android project in VS Code
2. Look for the RCA Agent icon in the Activity Bar (left sidebar)
3. Click the icon to open the RCA Agent panel
4. The extension will check if Ollama is running and show helpful tips

---

## Core Features

### [SEARCH] Intelligent Error Detection

RCA Agent automatically scans your workspace for errors and displays them in the error queue:

- **Critical**: Build failures, crashes, null pointer exceptions
- **High**: Deprecated API usage, version conflicts
- **Medium**: Warnings, lint issues
- **Low**: Code style suggestions

### [BRAIN] Root Cause Analysis

Unlike simple error messages, RCA Agent identifies the **underlying cause** of problems:

- **What went wrong**: Clear explanation of the immediate error
- **Why it happened**: Underlying causes and contributing factors
- **How to fix it**: Step-by-step actionable instructions

### [IDEA] Actionable Fix Guidelines

Every analysis includes:
- Specific file locations and line numbers
- Code examples you can copy-paste
- Version recommendations
- Links to relevant documentation

### [DOCS] Educational Mode

Learn while debugging:
- Beginner-friendly explanations
- "What/Why/How" learning notes
- Common patterns and best practices
- Prevention tips for future issues

### [FOLDER] Smart Learning

RCA Agent learns from your project:
- Stores past analyses in ChromaDB (optional)
- Faster responses for similar errors
- Project-specific recommendations
- Pattern recognition across your codebase

---

## Using the Panel Interface

### Opening the Panel

1. **Click the RCA Agent icon** in the Activity Bar (left sidebar)
2. **Or** run command: "RCA Agent: Open Panel" (`Ctrl+Shift+P` to open command palette)

### Panel Sections

#### 1. Error Queue (Top)
- Lists all detected errors
- Shows priority levels with color coding
- Displays error status (Pending, Analyzing, Complete)
- Quick actions: Analyze, Clear, Refresh

#### 2. Analysis View (Middle)
- Live analysis progress
- Thought process visualization
- Root cause findings
- Fix recommendations

#### 3. Action Buttons (Bottom)
- **Apply Fix**: Apply suggested code changes
- **Copy Code**: Copy fix code to clipboard
- **View in Editor**: Jump to error location
- **Search Similar**: Find similar past errors
- **Share**: Export analysis for sharing

#### 4. History Sidebar (Right)
- Past analyses
- Reanalyze option
- Filter by error type
- Search functionality

---

## Error Analysis Workflow

### Method 1: Auto-Detection

1. **Open your project** in VS Code
2. RCA Agent automatically scans for errors
3. Errors appear in the **Error Queue**
4. Click **"Analyze"** next to any error
5. Wait for analysis to complete (~10-30 seconds)
6. Review findings and apply fixes

### Method 2: Quick Actions (Lightbulb)

1. **Click on an error** in your code
2. Look for the **[IDEA] lightbulb** icon
3. Click it and select **"Analyze with RCA Agent"**
4. Instant analysis appears in the panel

### Method 3: Batch Analysis

1. Open the **Error Queue**
2. Select multiple errors (hold `Ctrl`/`Cmd` to multi-select)
3. Click **"Analyze All"** button
4. Review all analyses in sequence

### Method 4: Manual Query

1. Open RCA Agent panel
2. Type your question in the input box:
   - "Why is my app crashing on startup?"
   - "How do I fix this Gradle sync error?"
   - "What's causing this Compose recomposition loop?"
3. Press Enter and wait for analysis

---

## Advanced Features

### Settings & Configuration

Access settings via:
1. Click **[SETTINGS] Settings** in panel header
2. Or go to VS Code Settings → Extensions → RCA Agent

#### Key Settings:

**Model Configuration:**
- `rcaAgent.modelName`: LLM model to use (default: DeepSeek-R1-Distill-Qwen-7B)
- `rcaAgent.ollamaUrl`: Ollama server URL (default: http://localhost:11434)
- `rcaAgent.temperature`: Analysis creativity (0.0-1.0, default: 0.7)
- `rcaAgent.maxTokens`: Maximum response length (default: 2048)

**Analysis Options:**
- `rcaAgent.enableEducationalMode`: Show learning notes (default: true)
- `rcaAgent.enableFewShot`: Use past examples (default: true)
- `rcaAgent.analysisTimeout`: Max analysis time in seconds (default: 60)
- `rcaAgent.showThoughtProcess`: Display AI reasoning (default: false)

**UI Preferences:**
- `rcaAgent.theme`: Panel color scheme (auto/light/dark)
- `rcaAgent.autoRefresh`: Auto-refresh error queue (default: true)

**ChromaDB (Optional):**
- `rcaAgent.chromaDbUrl`: ChromaDB server URL (default: http://localhost:8000)
- `rcaAgent.enableCaching`: Cache analyses (default: true)
- `rcaAgent.cacheExpiry`: Cache duration in hours (default: 24)

### Feature Flags

Enable/disable features safely:

```json
{
  "rcaAgent.features": {
    "batchAnalysis": true,
    "lightbulbIntegration": true,
    "chromaDb": false,
    "educationalMode": true,
    "realTimeProgress": true,
    "historyTracking": true
  }
}
```

### Specialized Error Support

#### Kotlin Errors
- Null pointer exceptions
- Type inference issues
- Coroutine errors
- Late-init property access

#### Gradle Errors
- Version conflicts
- Build script issues
- AGP version mismatches
- Dependency resolution

#### Jetpack Compose
- Recomposition loops
- State management
- Remember/rememberSaveable
- Side effects

#### XML Layouts
- Inflation errors
- Resource not found
- ViewBinding issues
- Constraint layout problems

#### Android Manifest
- Permission issues
- Intent filter problems
- Component registration
- Version targeting

---

## Troubleshooting

### Common Issues

#### [FAIL] "Cannot connect to Ollama"

**Symptoms:** Panel shows connection error, no analysis possible

**Solutions:**
1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. Start Ollama if not running:
   ```bash
   ollama serve
   ```
3. Verify Ollama URL in settings matches your setup
4. Check firewall isn't blocking port 11434
5. Try restarting VS Code

**Estimated Fix Time:** 2-5 minutes

---

#### [FAIL] "Model not found"

**Symptoms:** Error message about missing model

**Solutions:**
1. Check installed models:
   ```bash
   ollama list
   ```
2. Pull the required model:
   ```bash
   ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```
3. Wait for download to complete (~5GB)
4. Restart VS Code

**Estimated Fix Time:** 5-15 minutes (depends on internet speed)

---

#### [FAIL] "Analysis timed out"

**Symptoms:** Analysis gets stuck or times out after 60 seconds

**Solutions:**
1. Try a simpler query or smaller file
2. Increase timeout in settings:
   ```json
   "rcaAgent.analysisTimeout": 120
   ```
3. Check Ollama isn't overloaded (close other processes)
4. Verify model is fully downloaded:
   ```bash
   ollama show hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```

**Estimated Fix Time:** 2-5 minutes

---

#### [FAIL] "No workspace open"

**Symptoms:** Panel shows "Open a workspace first"

**Solutions:**
1. Open a folder in VS Code: File → Open Folder
2. Or open a workspace: File → Open Workspace from File
3. Make sure you're opening a Kotlin/Android project

**Estimated Fix Time:** 1 minute

---

#### [FAIL] Panel not showing/blank

**Symptoms:** Panel opens but shows nothing

**Solutions:**
1. Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check VS Code console for errors: Help → Toggle Developer Tools
3. Reinstall the extension
4. Clear extension cache: `Ctrl+Shift+P` → "Developer: Reload Window"

**Estimated Fix Time:** 2-5 minutes

---

#### [WARNING] Slow analysis performance

**Symptoms:** Analysis takes >60 seconds

**Possible Causes:**
- Large files (>1000 lines)
- Complex error context
- Ollama running on slow hardware
- Too many past examples loaded

**Solutions:**
1. Reduce file context by being more specific
2. Disable few-shot learning temporarily:
   ```json
   "rcaAgent.enableFewShot": false
   ```
3. Lower max tokens:
   ```json
   "rcaAgent.maxTokens": 1024
   ```
4. Close other resource-intensive applications

---

#### 🗃️ ChromaDB connection failed (Optional)

**Symptoms:** Warning about ChromaDB not available

**Note:** ChromaDB is optional - RCA Agent works without it

**If you want to enable ChromaDB:**
1. Install and run ChromaDB:
   ```bash
   docker run -p 8000:8000 chromadb/chroma
   ```
2. Or using Python:
   ```bash
   pip install chromadb
   chroma run --host localhost --port 8000
   ```
3. Verify it's running:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

---

### Getting Help

If you're still stuck:

1. **Check logs:** View → Output → Select "RCA Agent" from dropdown
2. **View detailed errors:** Help → Toggle Developer Tools → Console tab
3. **Report an issue:** [GitHub Issues](https://github.com/AsakuraKai/AI_PP_project/issues/new)
4. **Documentation:** [Project Docs](../README.md)

When reporting issues, include:
- VS Code version
- RCA Agent version
- Ollama version and model name
- Error logs from Output panel
- Steps to reproduce

---

## Tips & Best Practices

### [TARGET] Writing Effective Queries

**Good Examples:**
- [DONE] "Why does my app crash when clicking the login button?"
- [DONE] "How do I fix this null pointer exception in MainActivity.kt line 42?"
- [DONE] "What's causing this Gradle sync failure with AGP 8.0?"

**Less Effective:**
- [FAIL] "My app doesn't work" (too vague)
- [FAIL] "Fix this" (provide context)
- [FAIL] "Error" (be specific about what error)

### [CLIPBOARD] Error Queue Management

- **Clear regularly:** Remove fixed errors to keep queue clean
- **Prioritize:** Focus on Critical and High priority errors first
- **Batch similar:** Analyze related errors together for context
- **Use filters:** Filter by file, type, or priority

### [LAUNCH] Performance Tips

- **Keep context small:** Analyze specific errors, not entire files
- **Use caching:** Let ChromaDB remember past solutions
- **Close unused tools:** Free up resources for Ollama
- **Update regularly:** Keep Ollama and models up to date

### [DOCS] Learning Mode

- **Enable educational mode** for beginners
- **Read the "Why" sections** to understand root causes
- **Follow prevention tips** to avoid future issues
- **Save useful analyses** to your notes

### [TOOL] Customization

- **Adjust temperature:** Lower (0.3-0.5) for consistent fixes, higher (0.7-0.9) for creative solutions
- **Tune max tokens:** Increase for detailed analyses, decrease for quick answers
- **Theme preferences:** Match your VS Code theme for better readability

### 🔐 Privacy & Security

- **Local-first:** All analysis happens on your machine
- **No data sent to cloud:** Your code never leaves your computer
- **ChromaDB optional:** You control what gets stored
- **Open source:** Review the code yourself

---

## Feature Roadmap

Coming soon:
- [ ] Multi-language support (Python, JavaScript, etc.)
- [ ] Custom error patterns
- [ ] Team sharing of analyses
- [ ] VS Code Marketplace publication
- [ ] CI/CD integration
- [ ] Automated fix application with git integration

---

## Feedback & Contributions

We'd love to hear from you!

- **[STAR] Star us on GitHub:** [AI_PP_project](https://github.com/AsakuraKai/AI_PP_project)
- **[BUG] Report bugs:** [Create an issue](https://github.com/AsakuraKai/AI_PP_project/issues/new)
- **[IDEA] Suggest features:** [Feature requests](https://github.com/AsakuraKai/AI_PP_project/issues/new?labels=enhancement)
- **🤝 Contribute:** [Contributing guidelines](../docs/CONTRIBUTING.md)

---

**Happy Debugging! [SUCCESS]**

Need more help? Check out:
- [Developer Guide](DEVELOPER_GUIDE.md) - For extending RCA Agent
- [Architecture Docs](architecture/README.md) - Technical deep dive
- [API Reference](api/README.md) - For integrations
- [Main README](../README.md) - Project overview
