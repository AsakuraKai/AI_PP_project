# Extension Documentation - Quick Reference

> **Complete documentation for the RCA Agent VS Code Extension**

---

## I Want To...

### ... Install and Use the Extension

**Start here:** [QUICK_START_FOR_USERS.md](QUICK_START_FOR_USERS.md)
- 5-minute setup guide
- Installation steps for Ollama + Extension
- Basic usage with keyboard shortcuts
- Quick troubleshooting

### ... Learn All Features

**Read:** [docs/VSCODE_EXTENSION_GUIDE.md](docs/VSCODE_EXTENSION_GUIDE.md)
- Complete feature documentation
- All commands and shortcuts
- Configuration options
- Real-world examples
- Troubleshooting guide
- Performance benchmarks

### ... Understand How It Works

**Read:** [docs/EXTENSION_VISUAL_WORKFLOW.md](docs/EXTENSION_VISUAL_WORKFLOW.md) (Start here for visuals)
- User interaction flow diagrams
- Analysis pipeline visualization  
- Cache system comparison
- Feedback loop diagram
- Performance timeline

**Then read:** [docs/EXTENSION_ARCHITECTURE.md](docs/EXTENSION_ARCHITECTURE.md)
- Technical architecture details
- Component interactions
- Data flow specifics
- Backend integration
- Performance optimizations

### ... Develop or Extend the Extension

**Read:** [vscode-extension/README.md](vscode-extension/README.md)
- Extension manifest overview
- Development setup
- Build & package instructions
- Testing guidelines

---

## 📚 All Documentation Files

### For End Users
| File | Description | Read Time |
|------|-------------|-----------|
| [QUICK_START_FOR_USERS.md](QUICK_START_FOR_USERS.md) | Installation & basic usage | 5 min |
| [docs/VSCODE_EXTENSION_GUIDE.md](docs/VSCODE_EXTENSION_GUIDE.md) | Complete feature guide | 30 min |
| [vscode-extension/EDUCATIONAL_MODE.md](vscode-extension/EDUCATIONAL_MODE.md) | Educational mode guide | 15 min |

### For Developers
| File | Description | Read Time |
|------|-------------|-----------|
| [docs/EXTENSION_VISUAL_WORKFLOW.md](docs/EXTENSION_VISUAL_WORKFLOW.md) | Visual workflow diagrams | 20 min |
| [docs/EXTENSION_ARCHITECTURE.md](docs/EXTENSION_ARCHITECTURE.md) | Technical architecture | 45 min |
| [vscode-extension/README.md](vscode-extension/README.md) | Project overview | 10 min |
| [vscode-extension/QUICKSTART.md](vscode-extension/QUICKSTART.md) | Dev environment setup | 10 min |

### Navigation
| File | Description |
|------|-------------|
| [docs/EXTENSION_DOCS_INDEX.md](docs/EXTENSION_DOCS_INDEX.md) | Complete documentation index |

---

## ⚡ Quick Reference

### Installation (2 Steps)

```bash
# 1. Install Ollama & download model
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
ollama serve

# 2. Install extension
# In VS Code: Ctrl+Shift+P → "Install from VSIX"
# Select: rca-agent-extension-0.1.0.vsix
```

### Usage (3 Ways)

```
Method 1: Ctrl+Shift+R (output channel)
Method 2: Ctrl+Shift+W (webview panel)  
Method 3: Ctrl+Shift+P → "RCA Agent: Analyze Error"
```

### Keyboard Shortcuts (See in VSCode Settings)

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Analyze Error | N/A | N/A |
| Analyze (Webview) | N/A | N/A |
| Educational Mode | N/A | N/A |
| Performance Metrics | N/A | N/A |

### Supported Errors (26+ types)

- **Kotlin** (6): NPE, lateinit, unresolved reference, type mismatch, compilation, import
- **Compose** (8): remember, recomposition, LaunchedEffect, CompositionLocal, modifier chain, side effects, derived state, snapshot state
- **XML** (7): inflation, missing ID, attributes, namespace, view not found, include, merge
- **Gradle** (5): dependency conflicts, resolution errors, task failures, build syntax, compilation
- **Manifest** (5): merge conflicts, missing permissions, undeclared activity/service/receiver

### Performance

- First analysis: ~15 seconds
- Cached results: <5 seconds
- Accuracy: 100% (on test dataset)
- Cache hit rate: ~60%

---

## Learning Paths

### Quick User Path (10 minutes)
1. [QUICK_START_FOR_USERS.md](QUICK_START_FOR_USERS.md) - Installation & usage
2. Test with a sample error
3. Ready to use!

### Power User Path (30 minutes)
1. Quick User Path (10 min)
2. [docs/VSCODE_EXTENSION_GUIDE.md](docs/VSCODE_EXTENSION_GUIDE.md) - All features (15 min)
3. Configure settings & enable educational mode (5 min)
4. Master user!

### Developer Path (2 hours)
1. Power User Path (30 min)
2. [docs/EXTENSION_VISUAL_WORKFLOW.md](docs/EXTENSION_VISUAL_WORKFLOW.md) - Visual overview (20 min)
3. [docs/EXTENSION_ARCHITECTURE.md](docs/EXTENSION_ARCHITECTURE.md) - Technical details (45 min)
4. [vscode-extension/QUICKSTART.md](vscode-extension/QUICKSTART.md) - Dev setup (15 min)
5. Review source code (10 min)
6. Full understanding!

---

## Troubleshooting

### Common Issues

**"Could not connect to Ollama"**
```bash
# Check if running: curl http://localhost:11434/api/tags
# Start it: ollama serve
# Verify model: ollama list
```

**"Analysis timed out"**
```bash
# Use smaller model:
ollama pull codellama:7b
# Then update settings: "rcaAgent.model": "codellama:7b"
```

**"Could not parse error"**
- Ensure error includes file path (e.g., `MainActivity.kt:42`)
- Include error type (e.g., `NullPointerException`)
- Provide full stack trace if possible

**Extension not showing**
- Press N/A → "Developer: Reload Window"
- Check Extensions panel (extension is installed)
- View debug logs: Output → "RCA Agent Debug"

---

## Documentation Statistics

- **Total documentation:** ~3,944 lines across 7 files
- **User guides:** 2 files (~1,200 lines)
- **Technical docs:** 2 files (~1,900 lines)  
- **Feature guides:** 1 file (~444 lines)
- **Project docs:** 2 files (~400 lines)

---

## Extension Architecture Overview

```
Extension (TypeScript)
├── Commands (4 total)
│   ├── Analyze Error
│   ├── Analyze Error (Webview)
│   ├── Toggle Educational Mode
│   └── Toggle Performance Metrics
│
├── UI Components
│   ├── Output Channel (text)
│   └── Webview Panel (interactive)
│
└── Backend Integration
    ├── Error Parsers (26+ types)
    ├── Agent (ReAct reasoning)
    ├── Cache (L1 in-memory)
    ├── Database (ChromaDB)
    └── LLM (Ollama)
```

---

## Key Features

**Multi-language error parsing** (Kotlin, Compose, XML, Gradle, Manifest)  
**AI-powered root cause analysis** (ReAct reasoning)  
**Interactive webview UI** (real-time progress, clickable links)  
**Educational mode** (beginner-friendly explanations)  
**Smart caching** (15x faster for repeated errors)  
**User feedback loop** (improves over time)  
**Performance metrics** (latency, cache hits, token usage)  
**VS Code theme integration** (follows your theme)

---

## Getting Help

1. Check troubleshooting guides in documentation
2. View debug logs: Output → "RCA Agent Debug"
3. Use feedback buttons to report issues

---

## License

This is just a hobby-ish project. Use at your own risk.
---

Last Updated: December 25, 2025 | Version: 0.1.0