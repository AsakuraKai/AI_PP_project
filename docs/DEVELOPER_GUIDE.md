# RCA Agent Developer Guide

**Version:** 2.0.0  
**Last Updated:** January 5, 2026

This guide is for developers who want to understand, extend, or contribute to RCA Agent.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Development Setup](#development-setup)
5. [Building & Testing](#building--testing)
6. [Extending RCA Agent](#extending-rca-agent)
7. [Code Patterns](#code-patterns)
8. [Performance Considerations](#performance-considerations)
9. [Contributing](#contributing)

---

## Architecture Overview

RCA Agent follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                   VS Code Extension                  │
│  (Panel UI, Commands, Integrations, Settings)       │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   Agent Layer                        │
│  (MultiPassAgent, StateManager, ToolOrchestrator)   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   Tool Layer                         │
│  (FileResolver, VersionLookup, FixGenerator, etc.)  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                Knowledge & LLM Layer                 │
│  (TemplateEngine, FewShotDB, OllamaClient)         │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│                   Storage Layer                      │
│  (ChromaDB, Cache, File System)                     │
└─────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Local-First:** All processing happens on the user's machine
2. **Modular:** Components are loosely coupled and independently testable
3. **Template-Based:** Structured prompts reduce cognitive load on smaller models
4. **Progressive Enhancement:** Core features work without optional services (ChromaDB)
5. **Performance-Conscious:** Caching, parallel execution, and smart tool selection

---

## Project Structure

```
AI_PP_project/
├── src/                          # Core backend logic
│   ├── agent/                    # Agent implementation
│   │   ├── MultiPassAgent.ts     # Multi-pass analysis workflow
│   │   ├── ToolOrchestrator.ts   # Smart tool selection & execution
│   │   └── StateManager.ts       # Agent state tracking
│   ├── knowledge/                # Knowledge base
│   │   ├── TemplateEngine.ts     # Error category templates
│   │   ├── FewShotDatabase.ts    # Example storage & retrieval
│   │   └── examples/             # 82 few-shot examples (JSON/TS)
│   ├── llm/                      # LLM integration
│   │   └── OllamaClient.ts       # Ollama API client
│   ├── tools/                    # Analysis tools
│   │   ├── FileResolver.ts       # File path resolution
│   │   ├── VersionLookupTool.ts  # Version info & migrations
│   │   ├── FixGenerator.ts       # Code fix generation
│   │   └── ...                   # Other specialized tools
│   ├── db/                       # Database layer
│   │   ├── ChromaDBClient.ts     # ChromaDB integration (optional)
│   │   └── CacheManager.ts       # Analysis caching
│   └── utils/                    # Shared utilities
│       ├── ErrorHandler.ts       # Comprehensive error handling
│       └── Logger.ts             # Logging utilities
│
├── vscode-extension/             # VS Code extension
│   ├── src/
│   │   ├── extension.ts          # Extension entry point
│   │   ├── panel/                # Panel UI
│   │   │   ├── RCAPanelProvider.ts
│   │   │   ├── webview-content.ts
│   │   │   ├── StateManager.ts
│   │   │   └── ErrorQueueManager.ts
│   │   ├── commands/             # VS Code commands
│   │   ├── views/                # TreeView providers
│   │   ├── chat/                 # Chat participant (legacy)
│   │   └── utils/                # Extension utilities
│   └── resources/                # Static resources
│       └── webview/              # Webview assets
│
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── real-world/               # Real-world test cases
│   └── fixtures/                 # Test fixtures (10 error types)
│
├── docs/                         # Documentation
│   ├── architecture/             # Architecture docs
│   ├── api/                      # API reference
│   └── _archive/                 # Historical docs
│
└── scripts/                      # Build & utility scripts
```

### Key Files

| File | Purpose | LOC |
|------|---------|-----|
| `src/agent/MultiPassAgent.ts` | Core analysis orchestration | ~500 |
| `src/knowledge/TemplateEngine.ts` | Template-based prompting | ~265 |
| `src/knowledge/FewShotDatabase.ts` | Example management | ~350 |
| `src/tools/FileResolver.ts` | File path resolution | ~400 |
| `src/tools/VersionLookupTool.ts` | Version lookups | ~300 |
| `vscode-extension/src/extension.ts` | Extension entry | ~200 |
| `vscode-extension/src/panel/RCAPanelProvider.ts` | Panel management | ~600 |

**Total Project Size:** ~15,000 LOC (excluding tests and node_modules)

---

## Core Components

### 1. MultiPassAgent

**Location:** `src/agent/MultiPassAgent.ts`

**Purpose:** Orchestrates multi-step error analysis workflow

**Key Methods:**
```typescript
class MultiPassAgent {
  // Main entry point for analysis
  async analyzeError(errorContext: ErrorContext): Promise<AnalysisResult>
  
  // Execute tools in parallel
  private async executeToolsInParallel(tools: Tool[]): Promise<ToolResult[]>
  
  // Generate structured prompt using templates
  private generatePrompt(context: ErrorContext): string
}
```

**Workflow:**
1. **Classify Error:** Determine error category (gradle, kotlin, compose, etc.)
2. **Select Tools:** Choose relevant analysis tools
3. **Execute Tools:** Run tools in parallel for speed
4. **Generate Prompt:** Create structured template-based prompt
5. **Call LLM:** Send to Ollama with context
6. **Parse Response:** Extract findings and recommendations
7. **Generate Fixes:** Create code diffs if applicable

**Performance:**
- Average latency: **11.7 seconds**
- Tool execution: **Parallel**
- Caching: **Enabled** (5-minute TTL)

---

### 2. TemplateEngine

**Location:** `src/knowledge/TemplateEngine.ts`

**Purpose:** Provides structured, fill-in-the-blank prompts for error categories

**Supported Categories:**
1. `gradle-version` - AGP/Gradle version conflicts
2. `kotlin-npe` - Null pointer exceptions
3. `compose-api` - Jetpack Compose API changes
4. `xml-layout` - XML inflation errors
5. `manifest` - AndroidManifest.xml issues
6. `multi-module` - Multi-module dependency conflicts
7. `gradle-network` - Gradle sync failures
8. `gradle-cache` - Build cache corruption
9. `proguard` - ProGuard configuration

**Why Templates?**
- **Reduced cognitive load** for smaller models (7B parameters)
- **Consistent output format**
- **Faster inference** (less token generation)
- **Better quality** vs. open-ended generation

**Example Template:**
```typescript
{
  category: 'kotlin-npe',
  template: `
## Error Classification
Category: Kotlin Runtime Error - Null Pointer Exception
Severity: [FILL: Critical/High/Medium]

## Root Cause Analysis
Primary Cause: [FILL: lateinit not initialized / nullable type access / ...]
Contributing Factors: [FILL: List any related issues]

## File & Location
File: [FILL: exact file path]
Line: [FILL: line number]
Symbol: [FILL: variable/property name]

## Fix Recommendations
1. [FILL: Primary fix with code example]
2. [FILL: Alternative approach if applicable]

## Prevention
[FILL: How to avoid this in future]
`,
  metadata: {
    avgTokens: 150,
    avgLatency: 8.5
  }
}
```

---

### 3. FewShotDatabase

**Location:** `src/knowledge/FewShotDatabase.ts`

**Purpose:** Manages 82 few-shot examples for in-context learning

**Database Structure:**
```
src/knowledge/examples/
├── gradle-version/          # 5 examples
├── kotlin-npe/              # 3 examples
├── compose-api/             # 4 examples
├── xml-layout/              # 3 examples
├── manifest/                # 2 examples
├── multi-module/            # 3 examples
├── gradle-network/          # 2 examples
├── gradle-cache/            # 2 examples
└── proguard/                # 2 examples

Total: 39 JSON examples + 43 TypeScript test definitions = 82 examples
```

**Example Format:**
```typescript
interface FewShotExample {
  category: string;          // Error category
  errorMessage: string;      // Original error
  context: {                 // File context
    file: string;
    language: string;
    code: string;
  };
  analysis: {                // Expected analysis
    rootCause: string;
    findings: string[];
    recommendations: FixRecommendation[];
  };
}
```

**Loading Strategy:**
- **Async initialization** with singleton pattern
- **Category-based filtering** for relevance
- **Limit:** Max 3 examples per query (prevent model confusion)

**Performance Findings:**
- ✅ **3-5 examples optimal** for quality
- ❌ **All 82 examples causes regression** (58.3% vs 61% with 3-5)
- ✅ **Category relevance matters** more than quantity

---

### 4. ToolOrchestrator

**Location:** `src/agent/ToolOrchestrator.ts`

**Purpose:** Smart tool selection and parallel execution

**Available Tools:**
1. **FileResolver** - Finds gradle files, version catalogs, buildSrc
2. **VersionLookupTool** - Checks latest versions, migration paths
3. **FixGenerator** - Generates code diffs for fixes
4. **GradleAnalyzer** - Parses build.gradle files
5. **ManifestParser** - Analyzes AndroidManifest.xml
6. **ComposeAnalyzer** - Jetpack Compose-specific analysis

**Tool Selection Logic:**
```typescript
async selectTools(errorCategory: string): Promise<Tool[]> {
  const toolMap = {
    'gradle-version': ['FileResolver', 'VersionLookupTool', 'GradleAnalyzer'],
    'kotlin-npe': ['FileResolver', 'FixGenerator'],
    'compose-api': ['FileResolver', 'ComposeAnalyzer', 'VersionLookupTool'],
    // ...
  };
  return this.loadTools(toolMap[errorCategory] || []);
}
```

**Parallel Execution:**
```typescript
const results = await Promise.allSettled(
  tools.map(tool => tool.execute(context))
);
```

**Caching:**
- **Per-tool caching** with 5-minute TTL
- **Result deduplication** across similar queries
- **Cache hit rate:** ~40% in typical usage

---

### 5. ErrorHandler

**Location:** `vscode-extension/src/utils/ErrorHandler.ts`

**Purpose:** Comprehensive user-friendly error handling (Phase 6 feature)

**Error Categories:**
```typescript
enum ErrorSeverity {
  INFO = 'info',       // User cancellation
  WARNING = 'warning', // Timeouts, parsing errors
  ERROR = 'error',     // File not found, permissions
  CRITICAL = 'critical' // Ollama down, model missing
}
```

**Features:**
- 🎯 **Contextual error messages** with emoji indicators
- 💡 **Step-by-step recovery instructions** with time estimates
- 🔧 **Alternative solutions** for common scenarios
- 📚 **Documentation links** (Ollama, model installation)
- ⚡ **Quick action buttons** (Retry, View Logs, Report Issue)

**Example Error Handling:**
```typescript
if (error.message.includes('ECONNREFUSED')) {
  return {
    code: 'LLM_CONNECTION_ERROR',
    message: 'Cannot connect to Ollama',
    severity: ErrorSeverity.CRITICAL,
    userMessage: `I couldn't connect to the Ollama LLM service. Make sure Ollama is running:
    
1. Check if Ollama is installed: \`ollama --version\`
2. Start Ollama: \`ollama serve\`
3. Verify model is available: \`ollama list\`

If you don't have Ollama installed, visit: https://ollama.ai/download`,
    recovery: async () => {
      // Show helpful dialog with links
    }
  };
}
```

---

## Development Setup

### Prerequisites

- **Node.js 18+** and npm
- **TypeScript 5+**
- **VS Code 1.80+**
- **Ollama** with model installed
- **Git**

### Initial Setup

```bash
# Clone repository
git clone https://github.com/AsakuraKai/AI_PP_project.git
cd AI_PP_project

# Install root dependencies
npm install

# Install extension dependencies
cd vscode-extension
npm install

# Build extension
npm run compile

# Return to root
cd ..
```

### Development Workflow

#### 1. Backend Development

```bash
# Run backend tests
npm test

# Run specific test suite
npm test -- tests/unit/TemplateEngine.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

#### 2. Extension Development

```bash
cd vscode-extension

# Compile TypeScript
npm run compile

# Watch mode (auto-recompile)
npm run watch

# Lint
npm run lint

# Package extension
npm run package
```

#### 3. Debug in VS Code

1. Open workspace in VS Code
2. Press `F5` to launch Extension Development Host
3. Set breakpoints in TypeScript files
4. Test extension functionality
5. View logs in Debug Console

**Launch Configuration:** (`.vscode/launch.json`)
```json
{
  "name": "Run Extension",
  "type": "extensionHost",
  "request": "launch",
  "args": [
    "--extensionDevelopmentPath=${workspaceFolder}/vscode-extension"
  ],
  "outFiles": [
    "${workspaceFolder}/vscode-extension/out/**/*.js"
  ],
  "preLaunchTask": "npm: watch"
}
```

---

## Building & Testing

### Build Process

```bash
# Full build (root + extension)
npm run build

# Build extension only
cd vscode-extension && npm run compile

# Clean build
npm run clean && npm run build
```

### Test Suites

#### 1. Unit Tests (~500 tests)

**Location:** `tests/unit/`

```bash
# Run all unit tests
npm test

# Run specific component tests
npm test -- tests/unit/TemplateEngine.test.ts
npm test -- tests/unit/FewShotDatabase.test.ts
```

**Key Test Files:**
- `TemplateEngine.test.ts` - Template generation (45 tests)
- `FewShotDatabase.test.ts` - Example loading (38 tests)
- `MultiPassAgent.test.ts` - Agent workflow (52 tests)
- `FileResolver.test.ts` - File resolution (41 tests)

#### 2. Integration Tests (~200 tests)

**Location:** `tests/integration/`

```bash
# Run integration tests (requires Ollama)
npm run test:integration
```

Tests full workflow from error input to fix generation.

#### 3. Real-World Tests (10 test cases)

**Location:** `tests/real-world/`

```bash
# Run accuracy tests (requires Ollama + model)
npm run test:accuracy

# Generate test report
npm run test:report
```

**Test Cases:**
1. AGP Version Conflict (85% accuracy ✅)
2. Kotlin lateinit NPE (76% accuracy)
3. Compose API Breakage (69% accuracy)
4. XML Layout Inflation (54% accuracy)
5. Manifest Permission Missing (52% accuracy)
6. Multi-module Dependency (48% accuracy)
7. Gradle Sync Network Failure (65% accuracy)
8. Build Cache Corruption (58% accuracy)
9. ProGuard Rule Missing (51% accuracy)
10. Navigation Argument Mismatch (73% accuracy)

**Average Accuracy:** 61% (production baseline with DeepSeek-R1-Distill-Qwen-7B)

#### 4. Accessibility Tests

**Location:** `vscode-extension/src/test/accessibility/`

```bash
cd vscode-extension
npm run test:a11y
```

Tests WCAG 2.1 AA compliance:
- Keyboard navigation
- Screen reader compatibility
- ARIA labels
- Color contrast
- Focus management

---

## Extending RCA Agent

### Adding a New Error Category

**1. Create Template** (`src/knowledge/TemplateEngine.ts`):

```typescript
private templates: Record<string, ErrorTemplate> = {
  // ... existing templates
  'new-category': {
    category: 'new-category',
    template: `
## Error Classification
Category: [Your Category Name]
Severity: [FILL: Critical/High/Medium]

## Root Cause Analysis
Primary Cause: [FILL: Root cause description]
Contributing Factors: [FILL: Related issues]

## File & Location
File: [FILL: file path]
Line: [FILL: line number]

## Fix Recommendations
1. [FILL: Fix with code example]
2. [FILL: Alternative if applicable]

## Prevention
[FILL: Prevention tips]
`,
    metadata: {
      avgTokens: 150,
      avgLatency: 10.0
    }
  }
};
```

**2. Add Few-Shot Examples** (`src/knowledge/examples/new-category/`):

```json
// example-1.json
{
  "category": "new-category",
  "errorMessage": "Your error message here",
  "context": {
    "file": "path/to/file.kt",
    "language": "kotlin",
    "code": "relevant code snippet"
  },
  "analysis": {
    "rootCause": "Explanation of root cause",
    "findings": [
      "Finding 1",
      "Finding 2"
    ],
    "recommendations": [
      {
        "title": "Fix Title",
        "description": "How to fix",
        "code": "// Code example",
        "priority": "high"
      }
    ]
  }
}
```

**3. Add Tool Selection Logic** (`src/agent/ToolOrchestrator.ts`):

```typescript
async selectTools(errorCategory: string): Promise<Tool[]> {
  const toolMap = {
    // ... existing mappings
    'new-category': ['FileResolver', 'CustomTool'],
  };
  return this.loadTools(toolMap[errorCategory] || []);
}
```

**4. Write Tests** (`tests/unit/new-category.test.ts`):

```typescript
describe('New Category Analysis', () => {
  it('should analyze new error type correctly', async () => {
    const agent = new MultiPassAgent();
    const result = await agent.analyzeError({
      category: 'new-category',
      message: 'Test error',
      file: 'test.kt',
      line: 10
    });
    
    expect(result.category).toBe('new-category');
    expect(result.findings).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
```

---

### Adding a New Tool

**1. Create Tool Class** (`src/tools/MyCustomTool.ts`):

```typescript
import { Tool, ToolResult } from '../types';

export class MyCustomTool implements Tool {
  name = 'MyCustomTool';
  description = 'What this tool does';
  
  async execute(context: ErrorContext): Promise<ToolResult> {
    try {
      // Your tool logic here
      const data = await this.performAnalysis(context);
      
      return {
        success: true,
        data,
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: this.name
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async performAnalysis(context: ErrorContext): Promise<any> {
    // Implementation
  }
}
```

**2. Register Tool** (`src/agent/ToolOrchestrator.ts`):

```typescript
import { MyCustomTool } from '../tools/MyCustomTool';

class ToolOrchestrator {
  private toolRegistry: Map<string, Tool> = new Map([
    // ... existing tools
    ['MyCustomTool', new MyCustomTool()],
  ]);
}
```

**3. Add to Tool Selection:**

```typescript
const toolMap = {
  'your-category': [...existingTools, 'MyCustomTool'],
};
```

**4. Write Tool Tests:**

```typescript
describe('MyCustomTool', () => {
  let tool: MyCustomTool;
  
  beforeEach(() => {
    tool = new MyCustomTool();
  });
  
  it('should execute successfully', async () => {
    const result = await tool.execute(mockContext);
    expect(result.success).toBe(true);
  });
  
  it('should handle errors gracefully', async () => {
    const result = await tool.execute(invalidContext);
    expect(result.success).toBe(false);
  });
});
```

---

### Adding Panel UI Features

**1. Update Webview HTML** (`vscode-extension/src/panel/webview-content.ts`):

```typescript
private static getContentHTML(state?: PanelState): string {
  return `
    <div id="custom-feature">
      <!-- Your HTML here -->
    </div>
  `;
}
```

**2. Add Message Handlers** (`vscode-extension/src/panel/RCAPanelProvider.ts`):

```typescript
private setupMessageHandlers() {
  this._panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.type) {
        case 'custom-action':
          await this.handleCustomAction(message.data);
          break;
      }
    }
  );
}
```

**3. Add Client-Side Script** (`vscode-extension/resources/webview/scripts.js`):

```javascript
function handleCustomAction() {
  vscode.postMessage({
    type: 'custom-action',
    data: { /* your data */ }
  });
}
```

**4. Update CSS** (`vscode-extension/resources/webview/styles.css`):

```css
#custom-feature {
  /* Your styles */
}
```

---

## Code Patterns

### 1. Error Handling Pattern

```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

### 2. Async Initialization Pattern

```typescript
class MyService {
  private static instance: MyService;
  private initialized = false;
  
  private constructor() {}
  
  static async getInstance(): Promise<MyService> {
    if (!MyService.instance) {
      MyService.instance = new MyService();
      await MyService.instance.initialize();
    }
    return MyService.instance;
  }
  
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    // Load resources
    this.initialized = true;
  }
}
```

### 3. Caching Pattern

```typescript
class CachedService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  
  async getData(key: string): Promise<any> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    const data = await this.fetchData(key);
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

### 4. Tool Execution Pattern

```typescript
async function executeToolsInParallel(tools: Tool[]): Promise<ToolResult[]> {
  const results = await Promise.allSettled(
    tools.map(tool => tool.execute(context))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      logger.warn(`Tool ${tools[index].name} failed`, { error: result.reason });
      return { success: false, error: result.reason };
    }
  });
}
```

---

## Performance Considerations

### Benchmarks (Phase 5 Optimizations)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Avg Latency | 45s | 11.7s | **74% faster** |
| Tool Execution | Sequential | Parallel | **3x speedup** |
| Cache Hit Rate | 0% | 40% | **40% reduction** |
| Memory Usage | 250MB | 180MB | **28% reduction** |

### Optimization Techniques

#### 1. Parallel Tool Execution

```typescript
// Before: Sequential (slow)
for (const tool of tools) {
  results.push(await tool.execute(context));
}

// After: Parallel (fast)
const results = await Promise.allSettled(
  tools.map(tool => tool.execute(context))
);
```

**Impact:** 3x faster when running 3+ tools

#### 2. Result Caching

```typescript
class VersionLookupTool {
  private cache = new Map<string, CachedResult>();
  
  async lookup(dependency: string): Promise<VersionInfo> {
    if (this.cache.has(dependency)) {
      return this.cache.get(dependency)!.data;
    }
    
    const info = await this.fetchVersionInfo(dependency);
    this.cache.set(dependency, { data: info, timestamp: Date.now() });
    return info;
  }
}
```

**Impact:** 40% cache hit rate in typical usage

#### 3. Template-Based Prompting

```typescript
// Before: Generate entire prompt (slow, inconsistent)
const prompt = `Analyze this error and provide detailed...` +
  generateLongContext() + manyExamples();

// After: Fill-in-the-blank template (fast, consistent)
const prompt = template.replace('[FILL: ...]', specificDetails);
```

**Impact:** 
- 74% faster latency (45s → 11.7s)
- Better output quality (57% → 61%)
- Lower token usage

#### 4. Example Limiting

```typescript
// Before: Load all 82 examples (confuses model)
const examples = await fewShotDB.getAllExamples();

// After: Load 3-5 relevant examples
const examples = await fewShotDB.getExamplesByCategory(category, 5);
```

**Impact:** 61% accuracy vs 58% with all examples

---

## Contributing

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** for linting
- **Prettier** for formatting (2 spaces, single quotes)
- **JSDoc comments** for public APIs
- **Meaningful names** (no abbreviations)

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add support for new error category
fix: Correct cache invalidation logic
docs: Update developer guide
test: Add tests for ToolOrchestrator
refactor: Simplify FileResolver logic
perf: Optimize template loading
```

### Pull Request Process

1. **Fork** the repository
2. **Create feature branch:** `git checkout -b feature/my-feature`
3. **Make changes** with tests
4. **Run tests:** `npm test`
5. **Lint code:** `npm run lint`
6. **Commit changes:** `git commit -m "feat: add my feature"`
7. **Push branch:** `git push origin feature/my-feature`
8. **Open PR** with description

### PR Template

```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

---

## Resources

### Internal Documentation
- [Architecture Docs](architecture/README.md)
- [API Reference](api/README.md)
- [Test Results](../docs/_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/ROADMAP/PHASE4_TEST_RESULTS.md)
- [Iteration Comparison](../docs/_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/ROADMAP/ITERATION_COMPARISON_9-11.md)

### External Resources
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Ollama Documentation](https://ollama.ai/docs)
- [ChromaDB Docs](https://docs.trychroma.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community
- [GitHub Issues](https://github.com/AsakuraKai/AI_PP_project/issues)
- [Discussions](https://github.com/AsakuraKai/AI_PP_project/discussions)

---

**Happy Coding! 🚀**

Questions? Open an issue or start a discussion on GitHub.
