# RCA Agent - Chunks 1.1-1.3 Implementation

This directory contains the backend implementation for chunks 1.1-1.3 of the RCA Agent MVP.

## ✅ Completed Chunks

### Chunk 1.1: Ollama Client & Types
- ✅ `src/types.ts` - Core type definitions
- ✅ `src/llm/OllamaClient.ts` - LLM client with retry logic
- ✅ Connection management with health checks
- ✅ Timeout handling (90s default)
- ✅ Exponential backoff retry strategy

### Chunk 1.2: Kotlin NPE Parser
- ✅ `src/utils/KotlinNPEParser.ts` - Parser for Kotlin errors
- ✅ Supports `lateinit` property errors
- ✅ Supports standard `NullPointerException`
- ✅ Stack trace extraction
- ✅ Graceful degradation

### Chunk 1.3: Minimal ReAct Agent
- ✅ `src/agent/MinimalReactAgent.ts` - 3-iteration reasoning loop
- ✅ Hypothesis generation
- ✅ JSON output parsing with fallback
- ✅ Timeout handling

## 📁 Project Structure

```
├── src/
│   ├── types.ts                      # Core type definitions
│   ├── llm/
│   │   └── OllamaClient.ts           # Ollama API client
│   ├── utils/
│   │   └── KotlinNPEParser.ts        # Kotlin error parser
│   └── agent/
│       └── MinimalReactAgent.ts      # ReAct agent (3 iterations)
├── tests/
│   └── unit/
│       ├── KotlinNPEParser.test.ts   # Parser tests
│       ├── OllamaClient.test.ts      # Client tests
│       └── MinimalReactAgent.test.ts # Agent tests
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Ollama installed and running
- `granite-code:8b` model downloaded

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Verify Ollama Setup

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should return JSON with list of models
# Verify granite-code:8b is in the list
```

## 💻 Usage Example

```typescript
import { OllamaClient } from './src/llm/OllamaClient';
import { KotlinNPEParser } from './src/utils/KotlinNPEParser';
import { MinimalReactAgent } from './src/agent/MinimalReactAgent';

async function main() {
  // 1. Initialize LLM client
  const llm = new OllamaClient({
    baseUrl: 'http://localhost:11434',
    model: 'granite-code:8b',
    timeout: 90000,
  });
  await llm.connect();

  // 2. Parse error
  const errorText = `
    kotlin.UninitializedPropertyAccessException: 
    lateinit property user has not been initialized
    at com.example.MainActivity.onCreate(MainActivity.kt:45)
  `;
  
  const parser = new KotlinNPEParser();
  const error = parser.parse(errorText);
  
  if (!error) {
    console.error('Failed to parse error');
    return;
  }

  // 3. Analyze with agent
  const agent = new MinimalReactAgent(llm);
  const result = await agent.analyze(error);

  console.log('Root Cause:', result.rootCause);
  console.log('Fix Guidelines:', result.fixGuidelines);
  console.log('Confidence:', result.confidence);
}

main().catch(console.error);
```

## 🧪 Testing

All components have comprehensive unit tests:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test KotlinNPEParser.test.ts

# Watch mode
npm test -- --watch
```

### Test Coverage Goals
- Line coverage: >80%
- Function coverage: >80%
- Branch coverage: >80%

## 📊 Performance Expectations

### Ollama Client
- Connection check: <5s
- Generation (single): 4-6s on GPU, 15-20s on CPU
- Retry delay: 1s initial, exponential backoff up to 10s

### Kotlin Parser
- Parse time: <1ms per error
- Handles errors up to 50KB

### Minimal Agent
- Total analysis: 30-60s (3 iterations × 10-20s each)
- Timeout: 90s default

## 🔧 Configuration

### OllamaClient Options

```typescript
const client = new OllamaClient({
  baseUrl: 'http://localhost:11434',    // Ollama API URL
  model: 'granite-code:8b',              // Model name
  timeout: 90000,                        // Request timeout (ms)
  maxRetries: 3,                         // Retry attempts
  initialRetryDelay: 1000,               // Initial delay (ms)
});
```

### Generation Options

```typescript
await client.generate(prompt, {
  temperature: 0.7,      // Randomness (0-1)
  maxTokens: 2000,       // Max output tokens
  topP: 0.9,             // Nucleus sampling
  topK: 40,              // Top-K sampling
  stop: ['###', '\n\n'], // Stop sequences
});
```

## 🐛 Troubleshooting

### Ollama Connection Fails
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve

# Verify model is downloaded
ollama list
# Should show granite-code:8b
```

### Tests Fail
```bash
# Make sure dependencies are installed
npm install

# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

### TypeScript Compilation Errors
```bash
# Clean build
rm -rf dist/
npm run build
```

## 📝 Next Steps (Chunk 1.4+)

- [ ] Implement ReadFileTool (access workspace files)
- [ ] Add tool registry with JSON schema validation
- [ ] Integrate tools into ReAct agent
- [ ] Add ChromaDB for vector storage
- [ ] Implement caching layer

## 📚 Documentation

- See `docs/phases/Phase1-OptionB-MVP-First-KAI.md` for full roadmap
- See `docs/DEVLOG.md` for development progress
- See `docs/API_CONTRACTS.md` for tool schemas (coming in Chunk 1.4)

## 🤝 Integration with Sokchea

This backend code will be integrated with Sokchea's VS Code extension:
- Extension calls `MinimalReactAgent.analyze()`
- Agent returns `RCAResult` 
- Extension displays results in webview

## ⚠️ Known Limitations (MVP)

- Fixed 3 iterations (will become dynamic later)
- No tool execution yet (placeholder actions)
- No state persistence (coming in Chunk 1.4)
- No caching (coming in Chunk 1.4)
- JSON parsing fallback may produce low-confidence results

---

**Status:** ✅ Chunks 1.1-1.3 Complete
**Next Milestone:** Chunk 1.4 - ReadFileTool & Tool Registry
**Date Completed:** December 17, 2025
