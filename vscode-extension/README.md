# RCA Agent - VS Code Extension

AI-powered Root Cause Analysis assistant for Kotlin/Android debugging.

## Features

- 🔍 Analyze Kotlin/Android errors with AI
- 💡 Get root cause analysis and fix guidelines
- 🎯 Support for common error types (NPE, lateinit, build errors)
- ⌨️ Quick keyboard shortcut: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

## Usage

1. Select error text in your editor OR copy error to clipboard
2. Press `Ctrl+Shift+R` or run command `RCA Agent: Analyze Error`
3. View analysis in the RCA Agent output panel

## Requirements

- Visual Studio Code 1.80.0 or higher
- Ollama running locally (for AI-powered analysis)
- Node.js 18+ for development

## Extension Settings

This extension contributes the following settings:

* `rcaAgent.ollamaUrl`: Ollama server URL (default: `http://localhost:11434`)
* `rcaAgent.model`: LLM model to use (default: `granite-code:8b`)

## Setup for Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run compile
   ```

3. Run in debug mode:
   - Press `F5` in VS Code
   - Test in the Extension Development Host window

## Project Status

**Current: MVP - Chunks 1.1-1.3 Complete** ✅

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
