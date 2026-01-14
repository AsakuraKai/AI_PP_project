# RCA Agent - Root Cause Analysis for Kotlin/Android

Version: 3.5.0

AI-powered debugging assistant that analyzes your Kotlin/Android errors and suggests actionable fixes. Uses local Ollama LLM for analysis. **Note:** This is an ongoing learning project. Features work for common error cases but may have limitations with edge cases or complex scenarios.

## What's New in v3.5

### New Components & Services
- **AnalysisResult Component** - Dedicated component for displaying analysis results with structured root cause, hypothesis, reasoning, and fix suggestions
- **Feedback Integration** - New FeedbackService for managing user feedback on analysis quality with positive/negative rating buttons
- **UIEventManager Service** - Centralized UI event management (287 lines) for improved component communication and state handling
- **AnimatedStat Component** - Animated statistics display with smooth transitions for metrics visualization
- **DropdownMenu Component** - Radix UI-based dropdown for enhanced menu interactions
- **Enhanced Error Queue Views** - Improved error detection and visualization with integrated feedback submission
- **Standardized Logging** - Unified log message formatting across all services and components for better debugging

### Conversational AI Debugging (v3.5)
- Multi-Turn Conversations - Chat interface with conversation memory (`@rca` in VS Code Chat)
- Context-Aware Responses - Remembers previous messages and maintains debugging context
- Follow-Up Questions - Ask "Why does this happen?" or "Show me an example" naturally
- Session Management - Separate conversations for different errors with full history

### Guided Debugging Workflows (v3.5)
- Step-by-Step Assistance - Interactive debugging guide through complex issues
- Workflow Stages - Context Gathering → Analysis → Fix → Verification
- Smart Routing - Automatically detects when to use guided vs conversational mode
- Export Conversations - Save entire debugging sessions to Markdown

### Enhanced Intelligence
- Improved Context Collection - Smarter file analysis and workspace search
- LLM-Powered Responses - Direct integration with Ollama for natural conversations
- Action Buttons - Apply Fix, Explain More, Search Similar directly in chat
- Preference Tracking - Learns your debugging style (beginner/intermediate/expert)

## Core Features

### Conversational Interface (New in v3.5)
- **Chat Participant** (`@rca`) - Natural language debugging in VS Code Chat panel
- **Multi-Turn Conversations** - Maintains context across multiple questions
- **Guided Workflows** - Step-by-step debugging assistance with interactive prompts
- **Export Sessions** - Save entire debugging conversations to Markdown

### Analysis Engine
- **Intelligent Error Detection** - Auto-detects errors in your workspace with priority sorting (Critical → High → Medium)
- **Root Cause Identification** - AI-powered analysis identifies underlying issues, not just symptoms
- **Actionable Fix Guidelines** - Step-by-step instructions with code examples you can copy
- **Educational Mode** - Beginner-friendly explanations with What/Why/How learning notes
- **Smart Caching** - Instant results for repeated errors using ChromaDB (configurable)
- **Intelligent Code Context** - Automatically reads relevant files, uses LSP for symbol resolution, searches workspace
- **Documentation Search** - Finds and displays relevant Android/Kotlin documentation for your error

### UI & Interaction
- **Panel Interface** - Always-visible panel in activity bar for quick access
- **Error Queue TreeView** - Visual list of detected errors with status indicators
- **Batch Processing** - Analyze all errors in queue with one click
- **Error Pinning** - Keep important errors at the top of the queue
- **Error Navigation** - Jump through errors efficiently
- **Queue Management** - Clear completed errors, remove individual items, refresh queue
- **Quick Actions** - Click lightbulb on errors for instant analysis
- **Real-time Progress** - Live iteration tracking with thought process display
- **History Tracking** - Full history with reanalyze, export, delete, and copy actions
- **Analysis Result Display** - Dedicated component showing root cause, hypothesis, reasoning, and fix suggestions
- **Feedback System** - Rate analysis quality with positive/negative feedback buttons

### Result Visualization (NEW in v3.5)
- **AnalysisResult Component** - Structured display of root cause, hypothesis, reasoning steps, and fix recommendations
- **Animated Metrics** - Real-time statistics with smooth animations for performance tracking
- **Confidence Indicators** - Shows analysis confidence level (note: confidence scores may not always reflect actual accuracy)
- **Feedback Submission** - Integrated feedback buttons to rate analysis accuracy

### Specialized Support
- **Jetpack Compose** - Specialized handling for Compose recomposition and state errors
- **XML Layouts** - Smart parsing of Android layout inflation errors
- **Gradle Conflicts** - Visual dependency conflict detection with version recommendations
- **Manifest Issues** - Permission and component configuration suggestions
- **Multi-Module Projects** - Detects and analyzes errors across multiple app modules

### Accessibility & Performance

- **Keyboard Navigation** - Supports basic keyboard shortcuts (Tab, Enter, Delete)
- **Theme Support** - Adapts to dark/light themes
- **Virtual Scrolling** - Handles larger error queues with virtual scrolling
- **Performance Metrics** - Optional display of analysis latency and cache hit rates
- **Response Time** - Typical analysis takes 30-90 seconds depending on error complexity and LLM


## [PACKAGE] Installation

### Prerequisites

1. **Ollama** - Local LLM server
   ```bash
   # Install Ollama from https://ollama.ai
   
   # Start Ollama server
   ollama serve
   
   # Pull recommended model (8B parameters, ~4.7GB)
   ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```

2. **ChromaDB** (Optional - for caching and faster repeat analyses)
   ```bash
   # Using Docker (recommended)
   docker run -p 8000:8000 chromadb/chroma
   
   # Or using Python
   pip install chromadb
   chroma run --host localhost --port 8000
   ```
   
   **Benefits of ChromaDB:**
   - Instant results for repeated errors (no LLM call needed)
   - Learns from your feedback to improve future analyses
   - Stores analyses with quality scores
   - Can be disabled if you prefer fresh analyses each time

### Install Extension

**Method 1: From VSIX (Recommended)**
1. Download `rca-agent-3.5.vsix` from releases
2. Open VS Code
3. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
4. Type "Extensions: Install from VSIX..."
5. Select the downloaded `.vsix` file
6. Reload VS Code



## Usage Guide

### Quick Start - Chat Interface (New in v3.5)

1. **Open VS Code Chat** - Press Ctrl+Alt+I (Windows/Linux) or Cmd+Alt+I (Mac)
2. **Start with @rca** - Type `@rca` followed by your question
3. **Describe your error** - "I'm getting a NullPointerException in MainActivity.kt"
4. **Ask follow-ups** - "Why does this happen?" or "Show me how to fix it"
5. **Use guided mode** - Type `@rca guided` for step-by-step debugging

**Example Conversations:**
```
You: @rca I'm getting "lateinit property not initialized" error
RCA: Let me analyze that. [analyzes error]
RCA: This error occurs when... [explanation]

You: How do I fix it?
RCA: Here are three approaches... [fix options]

You: Show me the code for option 1
RCA: Here's the implementation... [code example]
```

### Panel Interface

1. **Open RCA Agent Panel** - Click the RCA icon in the activity bar (left sidebar)
2. **Auto-detected Errors** - Errors appear in the queue automatically
3. **One-Click Analysis** - Click "Analyze" on any error OR click "Analyze All" for batch processing
4. **View Results** - Results display in the panel with code context and fix guidelines

### Access Methods

#### Chat Participant (Recommended)
1. **Open VS Code Chat** - Press Ctrl+Alt+I (or Cmd+Alt+I on Mac)
2. **Type @rca** - Start your question with `@rca`
3. **Natural conversation** - Describe your error naturally, ask follow-ups
4. **Example:** `@rca Why am I getting NullPointerException in line 42?`

#### Lightbulb Quick Action
1. Hover over any error in your code
2. Click the lightbulb that appears
3. Select "Analyze with RCA Agent"
4. Results appear instantly in the panel

#### Manual Selection (Classic Mode)
1. **Select error text** in your editor (stack trace, error message, build output)
2. **Run command:** Press Ctrl+Shift+P and type "RCA Agent: Analyze Error"
3. View results in the panel

### Educational Mode

Enable educational mode for beginner-friendly explanations:

Command Palette → "RCA Agent: Toggle Educational Mode"

Educational mode provides:
- **What** - Clear explanation of the error type
- **Why** - Common causes and when it happens
- **How** - Practical prevention strategies with code examples

### Conversational Debugging (v3.5)

Use the chat interface for natural, interactive debugging:

**Starting a Conversation:**
1. Open VS Code Chat (Ctrl+Alt+I or Cmd+Alt+I)
2. Type `@rca` followed by your question
3. RCA Agent maintains context throughout the conversation

**Follow-Up Questions:**
- "Why does this error happen?"
- "Can you show me an example?"
- "What's the best way to fix this?"
- "Are there other ways to solve this?"

**Guided Debugging:**
Type `@rca guided` to start a step-by-step debugging workflow:
1. **Context Gathering** - RCA Agent collects information about your error
2. **Hypothesis Generation** - Proposes potential causes
3. **Investigation** - Guides you through diagnostic checks
4. **Resolution** - Provides fix recommendations
5. **Verification** - Helps confirm the fix works

**Export Conversations:**
```
@rca export conversation
```
Saves your entire debugging session to Markdown for documentation or sharing.

### History Management

Access your analysis history in the RCA Agent panel:

**Available Actions:**
- **View**: Click any history item to view full analysis
- **Reanalyze** (F2): Run fresh analysis with latest code changes
- **Export**: Save analysis to markdown file
- **Copy**: Copy analysis to clipboard
- **Delete**: Remove individual items
- **Clear All**: Remove entire history

**Context Menu**: Right-click any history item for all actions.

### Error Queue Management

Manage detected errors efficiently:

**Queue Actions:**
- **Pin/Unpin**: Keep critical errors at the top (click pin icon)
- **Remove**: Delete errors you don't want to analyze (Delete key)
- **Clear Completed**: Remove all successfully analyzed errors
- **Clear All**: Empty the entire queue
- **Refresh**: Rescan workspace for new errors
- **Navigate**: Use next/previous error commands

**Batch Operations:**
- **Analyze All**: Process entire queue sequentially
- **Analyze Pending**: Only process unanyzed errors
- **Cancel Batch**: Stop ongoing batch analysis

### Performance Metrics

View detailed performance insights:

Command Palette → "RCA Agent: Toggle Performance Metrics"

Metrics include:
- Total analysis time
- LLM inference time
- Tool execution time
- Cache hit rate
- Token usage (prompt/completion)

### Understanding Results

**Confidence Score** (displayed with color-coded bar):
- **High (80%+)**: Very reliable analysis, fix guidelines should work
- **Medium (60-79%)**: Good analysis, may need minor adjustments
- **Low (<60%)**: Review carefully, consider manual debugging

**Quality Score** (from user feedback):
- Improves over time as you mark analyses helpful/unhelpful
- Used to prioritize cached results

**Cache Indicator**:
- **"From Cache"**: Instant result from previous analysis
- Shows cache timestamp
- Reanalyze if code has changed since cached

## Configuration

Access settings: File > Preferences > Settings > RCA Agent

### Core Settings
```json
{
  // Ollama server URL
  "rcaAgent.ollamaUrl": "http://localhost:11434",
  
  // LLM model to use
  "rcaAgent.model": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest",
  
  // ChromaDB for caching (optional)
  "rcaAgent.chromaUrl": "http://localhost:8000",
  "rcaAgent.enableCache": true,
  
  // Analysis behavior
  "rcaAgent.maxIterations": 5,
  "rcaAgent.timeout": 120000,
  
  // Show performance metrics
  "rcaAgent.showPerformanceMetrics": false
}
```

### UI Settings (v3.5)
```json
{
  // Enable chat participant (default: true)
  "rcaAgent.chatParticipant.enabled": true,
  
  // Conversational debugging settings
  "rcaAgent.conversation.maxHistory": 20,
  "rcaAgent.conversation.autoExport": false,
  "rcaAgent.conversation.contextTracking": true,
  
  // Guided workflow settings
  "rcaAgent.guidedWorkflow.enabled": true,
  "rcaAgent.guidedWorkflow.verbosity": "standard",
  
  // Result display settings
  "rcaAgent.resultDisplay.showAnimations": true,
  "rcaAgent.resultDisplay.showConfidenceScore": true,
  
  // Feedback collection
  "rcaAgent.feedback.enabled": true,
  "rcaAgent.feedback.promptInterval": 3,
  
  // Enable new panel-based UI
  "rcaAgent.experimental.newUI": true,
  
  // Enable batch error analysis
  "rcaAgent.experimental.batchAnalysis": true,
  
  // Auto-detect errors in workspace
  "rcaAgent.autoDetectErrors": true,
  
  // Maximum errors to show in queue
  "rcaAgent.maxErrorQueueSize": 100,
  
  // Performance monitoring
  "rcaAgent.performance.enableMonitoring": true,
  "rcaAgent.performance.showMetrics": false,
  
  // Accessibility features
  "rcaAgent.accessibility.announceChanges": true,
  "rcaAgent.accessibility.reducedMotion": false
}
```

### Tool Configuration
```json
{
  // Enable specific analysis tools
  "rcaAgent.tools.enableReadFile": true,
  "rcaAgent.tools.enableLSP": true,
  "rcaAgent.tools.enableWorkspaceSearch": true,
  "rcaAgent.tools.enableAndroidBuild": true,
  
  // Tool behavior
  "rcaAgent.tools.maxFileSize": 1048576,
  "rcaAgent.tools.searchDepth": 5
}
```

### Export & Backup
```json
{
  // Export settings
  "rcaAgent.export.includeMetadata": true,
  "rcaAgent.export.includeCodeContext": true,
  "rcaAgent.export.format": "markdown",
  
  // Auto-save history
  "rcaAgent.history.autoSave": true,
  "rcaAgent.history.maxItems": 100
}
```

### Supported Models

| Model                                                   | Size  | Notes                                                 |
| ------------------------------------------------------- | ----- | ----------------------------------------------------- |
| `hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest` | 4.7GB | **Recommended** - Best reasoning and accuracy for RCA |
| `deepseek-r1:7b`                                        | 4.7GB | Alternative with strong analytical capabilities       |

**Note:** Smaller 3.8-4.2GB models have limited reasoning capability and may produce less reliable root cause analysis. Recommend using recommended models for best results.

## Command Reference

### Chat Commands (v3.5)
- `@rca <question>` - Ask RCA Agent anything about your code or errors
- `@rca guided` - Start guided debugging workflow
- `@rca follow up` - Continue previous conversation
- `@rca export conversation` - Save chat history to Markdown
- `RCA Agent: Start Conversational Debugging` - Open new chat session
- `RCA Agent: Start Guided Debugging Workflow` - Begin step-by-step debugging
- `RCA Agent: Export Conversation` - Save conversation externally
- `RCA Agent: Clear Conversation History` - Reset all chat sessions

### Analysis Commands
- `RCA Agent: Analyze Error` - Analyze selected error text
- `RCA Agent: Analyze Error at Cursor` - Analyze error under cursor
- `RCA Agent: Analyze with RCA Agent` - From lightbulb quick action

### Queue Commands
- `RCA Agent: Analyze All` - Batch analyze entire queue
- `RCA Agent: Analyze Pending` - Only analyze unprocessed errors
- `RCA Agent: Cancel Batch Analysis` - Stop batch operation
- `Refresh Error Queue` - Rescan workspace
- `Clear Error Queue` - Remove all errors
- `Clear Completed Errors` - Remove analyzed errors
- `Pin/Unpin Error` - Toggle error priority
- `Go to Error Location` - Jump to error in code
- `Go to Next/Previous Error` - Navigate error queue

### History Commands
- `Refresh History` - Reload analysis history
- `Clear History` - Remove all history items
- `Delete History Item` - Remove single item
- `Reanalyze` - Run fresh analysis on past error
- `Export Analysis` - Save to markdown file
- `Copy Analysis to Clipboard` - Copy formatted result
- `View Analysis` - Open full analysis details

### Mode Toggles
- `RCA Agent: Toggle Educational Mode` - Enable/disable learning notes
- `RCA Agent: Toggle Performance Metrics` - Show/hide metrics
- `RCA Agent: Toggle Panel` - Show/hide panel

### Feedback Commands
- `Mark as Helpful` - Improve analysis quality
- `Mark as Unhelpful` - Report inaccurate analysis

## Troubleshooting

### Could not connect to Ollama

**Solutions:**
1. Check if Ollama is running: `netstat -an | findstr "11434"`
2. Start Ollama: `ollama serve`
3. Verify model: `ollama list`
4. Test connection: `curl http://localhost:11434/api/tags`

### Analysis timed out

**Solutions:**
1. Try a smaller model (7B recommended)
2. Verify sufficient RAM (8GB+ recommended)
3. Check Ollama logs
4. Increase timeout in settings: `rcaAgent.timeout`

### Chat participant not working

**Solutions:**
1. Ensure VS Code version is 1.80 or higher
2. Reload window: Ctrl+Shift+P → "Developer: Reload Window"
3. Check extension is activated in Extensions panel
4. Verify `@rca` appears in chat participant list

### Conversation context lost

**Solutions:**
1. Check conversation history: `@rca export conversation`
2. Increase history limit in settings: `rcaAgent.conversation.maxHistory`
3. Restart conversation: `RCA Agent: Clear Conversation History`

### Could not parse error

**Solutions:**
1. Ensure full stack trace is selected
2. Check supported error types (NPE, lateinit, build errors, etc.)
3. View debug logs in output channel
4. Try chat interface: `@rca [paste your error]`

## Documentation

For detailed educational mode guide, see [EDUCATIONAL_MODE.md](EDUCATIONAL_MODE.md).

## Supported Error Types

- Kotlin: NPE, lateinit, unresolved reference, type mismatch (38+ types)
- Jetpack Compose: remember, recomposition, LaunchedEffect
- XML: Layout inflation, attributes
- Gradle: Dependency conflicts, build errors
- Manifest: Permissions, components

## Feedback System

After each analysis, you can provide feedback:
- **Helpful** - Analysis was accurate (available in panel and chat)
- **Not Helpful** - Analysis needs improvement

**In Chat:**
Your feedback is tracked automatically through conversation flow and helps improve future responses.

**In Panel:**
Click the feedback buttons after viewing analysis results to rate accuracy.

## Acknowledgments

- Built with Ollama
- Uses ChromaDB
- Chat Participant powered by VS Code Chat API
- Conversational AI with context-aware prompting

## Technology Stack (v3.5)

**Frontend:**
- VS Code Extension API (Webview + Chat Participant)
- TypeScript for type-safe development
- React + Tailwind CSS for modern UI

**Backend:**
- MinimalReactAgent for ReAct reasoning
- 26+ specialized error parsers
- Tool-calling architecture (LSP, file operations, workspace search)
- ChromaDB for semantic caching

**AI/LLM:**
- Ollama for local LLM inference
- DeepSeek-R1 (recommended model)
- Context-aware prompt engineering
- Multi-turn conversation management

## Version History

### v3.5.0 (January 2026)
- New AnalysisResult component for structured result display
- FeedbackService for managing user feedback on analysis quality
- UIEventManager for centralized event handling (287 lines)
- AnimatedStat component for performance metrics visualization
- DropdownMenu component with Radix UI integration
- Standardized logging across all services
- ConversationalAgent + GuidedDebuggingWorkflow implemented
- 19 tools integrated (some with limitations)
- Chat participant basic functionality working
- Supports common Android/Kotlin error patterns

### v3.0.0 (January 2026)
- Conversational AI Debugging - Chat participant with @rca
- Multi-Turn Conversations - Context-aware responses with memory
- Guided Debugging Workflows - Step-by-step interactive assistance
- Enhanced Intelligence - Improved context collection and LLM integration
- Export Conversations - Save debugging sessions to Markdown
- Smart Routing - Automatic detection between guided and conversational modes

### v2.0.0 (December 2025)
- Redesigned panel-based UI with always-visible error queue
- Batch analysis for multiple errors
- Lightbulb integration for quick actions
- Full keyboard navigation (WCAG 2.1 AA compliant)
- Theme-aware UI with dark/light/high-contrast support
- Real-time progress tracking with iteration display
- Feature flags for experimental features

### v1.0.0 (Initial Release)
- Core error analysis with 38+ error types
- ChromaDB caching for faster results
- Educational mode with learning notes
- Android/Kotlin/Compose error support

## Limitations & Notes

- **Learning Project:** This is an ongoing project focused on learning LLM integration and VS Code extension development
- **Real AI requires Ollama:** Local LLM server is mandatory; uses DeepSeek-R1 for best results
- **Works for common cases:** Handles standard Kotlin/Android/Gradle errors well; edge cases may fail
- **LLM quality varies:** Analysis quality depends heavily on the selected model and error context
- **Not production-tested:** Use for learning and development, not for critical production scenarios
- **Feedback helps:** User feedback improves analysis quality over time through ChromaDB caching
- **Network timeouts possible:** Long analyses (>120s) may timeout; adjust settings if needed