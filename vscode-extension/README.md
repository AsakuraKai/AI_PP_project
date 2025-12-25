# RCA Agent - Root Cause Analysis for Kotlin/Android

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.80%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

AI-powered debugging assistant that analyzes your Kotlin/Android errors and suggests actionable fixes.

## 🚀 Features

- **🔍 Automatic Error Analysis**: Select any error message or stack trace and get instant root cause analysis
- **💡 Root Cause Identification**: AI-powered analysis identifies the underlying issue, not just symptoms
- **🛠️ Actionable Fix Guidelines**: Step-by-step instructions to resolve errors
- **🎓 Educational Mode**: Beginner-friendly explanations with "What/Why/How" learning notes
- **📚 Learns from Your Errors**: Stores past analyses to provide faster, smarter solutions over time
- **⚡ Performance Metrics**: Optional display of analysis latency, cache hit rates, and token usage
- **🎨 Jetpack Compose Support**: Specialized handling for Compose recomposition and state errors
- **📄 XML Layout Analysis**: Smart parsing of Android layout inflation errors
- **🔧 Gradle Conflict Resolution**: Visual dependency conflict detection with version recommendations
- **📋 Manifest Analysis**: Permission and component configuration suggestions

## 📦 Installation

### Prerequisites

1. **Ollama** - Local LLM server
   ```bash
   # Install Ollama from https://ollama.ai
   
   # Start Ollama server
   ollama serve
   
   # Pull recommended model (8B parameters, ~4.7GB)
   ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```

2. **ChromaDB** (Optional - for learning from past errors)
   ```bash
   # Using Docker
   docker run -p 8000:8000 chromadb/chroma
   
   # Or using Python
   pip install chromadb
   chroma run --host localhost --port 8000
   ```

### Install Extension

**Method 1: From VSIX (Recommended)**
1. Download `rca-agent-0.1.0.vsix` from releases
2. Open VS Code
3. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
4. Type "Extensions: Install from VSIX..."
5. Select the downloaded `.vsix` file
6. Reload VS Code

**Method 2: From Marketplace** (Coming Soon)
1. Open VS Code Extensions panel (`Ctrl+Shift+X`)
2. Search for "RCA Agent"
3. Click Install

## 🎯 Usage

### Basic Analysis

1. **Select error text** in your editor (stack trace, error message, build output)
2. Press **`Ctrl+Shift+R`** (or `Cmd+Shift+R` on Mac)
   - Or open Command Palette: **"RCA Agent: Analyze Error"**
3. View results in the webview panel

### Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Analyze Error (Output Channel) | `Ctrl+Shift+R` | `Cmd+Shift+R` |
| Analyze Error (Webview) | `Ctrl+Shift+W` | `Cmd+Shift+W` |
| Toggle Educational Mode | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Toggle Performance Metrics | `Ctrl+Shift+P` | `Cmd+Shift+P` |

### Educational Mode

Enable educational mode for beginner-friendly explanations:

```
Command Palette → "RCA Agent: Toggle Educational Mode 🎓"
```

Educational mode provides:
- **What**: Clear explanation of the error type
- **Why**: Common causes and when it happens
- **How**: Practical prevention strategies with code examples

### Performance Metrics

View detailed performance insights:

```
Command Palette → "RCA Agent: Toggle Performance Metrics ⚡"
```

Metrics include:
- Total analysis time
- LLM inference time
- Tool execution time
- Cache hit rate
- Token usage (prompt/completion)

## ⚙️ Configuration

Access settings: `File > Preferences > Settings > RCA Agent`

```json
{
  // Ollama server URL
  "rcaAgent.ollamaUrl": "http://localhost:11434",
  
  // LLM model to use
  "rcaAgent.model": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest",
  
  // Show performance metrics
  "rcaAgent.showPerformanceMetrics": false
}
```

### Supported Models

| Model | Size | Best For |
|-------|------|----------|
| `hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest` | 4.7GB | **Recommended** - Best balance of speed/accuracy |
| `codellama:7b` | 3.8GB | Fast, good for quick analyses |
| `qwen-coder:7b` | 4.2GB | Strong reasoning, slightly slower |
| `deepseek-coder:6.7b` | 3.6GB | Compact, good for low-memory systems |

## 🐛 Troubleshooting

### "Could not connect to Ollama"

**Solutions**:
1. Check if Ollama is running: `netstat -an | findstr "11434"`
2. Start Ollama: `ollama serve`
3. Verify model: `ollama list`
4. Test connection: `curl http://localhost:11434/api/tags`

### "Analysis timed out"

**Solutions**:
1. Try a smaller model (7B recommended)
2. Verify sufficient RAM (8GB+ recommended)
3. Check Ollama logs

### "Could not parse error"

**Solutions**:
1. Ensure full stack trace is selected
2. Check supported error types (NPE, lateinit, build errors, etc.)
3. View debug logs in output channel

## 🎓 Educational Mode Guide

See [EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md) for detailed guide.

## 📚 Supported Error Types

- Kotlin: NPE, lateinit, unresolved reference, type mismatch (38+ types)
- Jetpack Compose: remember, recomposition, LaunchedEffect
- XML: Layout inflation, attributes
- Gradle: Dependency conflicts, build errors
- Manifest: Permissions, components

## 🤝 Feedback

After each analysis, click:
- **👍 Helpful** - Analysis was accurate
- **👎 Not Helpful** - Analysis needs improvement

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with [Ollama](https://ollama.ai)
- Uses [ChromaDB](https://www.trychroma.com)

---

**Made with ❤️ for the Kotlin/Android community**

- [x] Extension bootstrap and activation
- [x] User input handling (selection or input box)
- [x] Output display with formatted results
- [ ] Integration with real Ollama backend (requires server)
- [ ] Real parser integration (requires Kai's implementation)
- [ ] Agent integration (requires Kai's implementation)

## Notes

- Currently uses placeholder parser and mock results
- Real AI analysis requires Ollama server (connect from desktop)
- Backend integration pending (Kai's work)

## License

MIT
