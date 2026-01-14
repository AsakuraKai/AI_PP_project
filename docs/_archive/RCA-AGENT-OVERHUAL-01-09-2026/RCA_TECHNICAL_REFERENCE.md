# RCA Agent - Technical Reference & Backend Wiring

**Created:** January 9, 2026  
**Last Updated:** January 9, 2026  
**Status:**  Complete - All 60+ components documented

---

## [INFO] Document Purpose

This is the **complete technical reference** for wiring the RCA Agent UI to backend services. It consolidates:
- Complete component mapping (60+ backend components)
- Backend API reference for all services
- Integration points and message passing
- Priority-based implementation gaps (P1-P3)

**Related Documents:**
- [RCA_MASTER_IMPLEMENTATION_GUIDE.md](./RCA_MASTER_IMPLEMENTATION_GUIDE.md) - Visual design, roadmap, timeline
- [RCA_UI_REMOVAL_SUMMARY.md](./RCA_UI_REMOVAL_SUMMARY.md) - What was removed

---

## [ARCHITECTURE] Architecture Overview

### Communication Flow

```

         React UI (Webview)                           
          
   Dashboard     ErrorQueue     Analyze       
          

                      Message Passing (postMessage)
                     ↓

    VS Code Extension (vscode-extension/src/)         
     
    Frontend Services (services/)                  
    • AnalysisService                              
    • FixApplicationService                        
    • NetworkTimeoutHandler                        
     

                      Direct Imports
                     ↓

       Core Backend (src/)                            
     
    Agents (agent/)                                
    • MinimalReactAgent                            
    • MultiPassAgent                               
    • FixGenerator                                 
    • ErrorClassifier                              
     ... (16 total components)                   
     
    Tools (tools/)                                 
    • ReadFileTool                                 
    • SearchInFilesTool                            
     ... (15+ tools)                             
     
    LLM Integration (llm/)                         
    • OllamaClient                                 
    • PromptManager                                
     

```

---

## [TOOL] Backend Services (Frontend Layer)

These services live in `vscode-extension/src/services/` and are the **primary integration points** for the UI.

### 1. AnalysisService

**Location:** `vscode-extension/src/services/AnalysisService.ts`  
**Purpose:** Orchestrates error analysis using MinimalReactAgent

**Key Methods:**

```typescript
class AnalysisService {
  // Main analysis method
  async analyzeError(
    error: ErrorInfo,
    options?: AnalysisOptions
  ): Promise<AnalysisResult>
  
  // Cancel ongoing analysis
  cancelAnalysis(): void
  
  // Get real-time state stream
  getStateStream(): AgentStateStream
  
  // Get analysis history
  getHistory(): AnalysisResult[]
  
  // Search history
  searchHistory(query: string): AnalysisResult[]
}
```

**UI Integration:**

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Analyze View | `analyzeError()` | Trigger new analysis |
| Analyze View | `getStateStream()` | Live progress updates |
| Analyze View | `cancelAnalysis()` | Cancel button |
| History View | `getHistory()` | Load past analyses |
| History View | `searchHistory()` | Search functionality |
| Dashboard | `getHistory()` | Recent activity feed |

**Message Passing Example:**

```typescript
// In webview:
vscode.postMessage({
  command: 'analyzeError',
  error: { message: 'NPE at line 42', file: 'Main.kt' }
});

// In extension:
case 'analyzeError':
  const result = await analysisService.analyzeError(message.error);
  panel.webview.postMessage({
    command: 'analysisComplete',
    result
  });
```

---

### 2. FixApplicationService

**Location:** `vscode-extension/src/services/FixApplicationService.ts`  
**Purpose:** Generate, preview, and apply code fixes

**[WARNING] P0 Gap:** Currently uses templates, needs integration with `src/agent/FixGenerator.ts`

**Key Methods:**

```typescript
class FixApplicationService {
  // Generate fix for error (TODO: Use FixGenerator)
  async generateFix(error: ErrorInfo): Promise<Fix>
  
  // Generate diff preview
  async generateDiffPreview(fix: Fix): Promise<DiffPreview>
  
  // Apply fix to file
  async applyFix(fix: Fix): Promise<ApplyResult>
  
  // Validate fix syntax
  async validateFix(fix: Fix): Promise<ValidationResult>
  
  // Get pending fixes
  getPendingFixes(): Fix[]
  
  // Get applied fixes history
  getAppliedFixes(): Fix[]
}
```

**UI Integration:**

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Analyze View | `generateFix()` | Generate fix suggestions |
| Fix Manager | `getPendingFixes()` | Load pending queue |
| Fix Manager | `generateDiffPreview()` | Show diff modal |
| Fix Manager | `applyFix()` | Apply button |
| Fix Manager | `validateFix()` | Validate before apply |
| Fix Manager | `getAppliedFixes()` | Applied history tab |

**Required Integration (P0):**

```typescript
import { FixGenerator } from '../../../src/agent/FixGenerator';
import { OllamaClient } from '../../../src/llm/OllamaClient';

class FixApplicationService {
  private fixGenerator: FixGenerator;
  
  constructor() {
    this.fixGenerator = new FixGenerator(new OllamaClient());
  }
  
  async generateFix(error: ErrorInfo): Promise<Fix> {
    // Use AI instead of templates
    return this.fixGenerator.generateFix(error);
  }
}
```

---

### 3. NetworkTimeoutHandler

**Location:** `vscode-extension/src/services/NetworkTimeoutHandler.ts` (359 lines)  
**Purpose:** Timeout protection for Ollama API calls

**[WARNING] P0 Gap:** Exists but not used - must wrap all Ollama calls

**Key Methods:**

```typescript
class NetworkTimeoutHandler {
  static getInstance(): NetworkTimeoutHandler
  
  // Wrap async operation with timeout
  async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T>
  
  // Check Ollama availability
  async checkOllamaAvailability(): Promise<{
    available: boolean;
    latency?: number;
    error?: string;
  }>
  
  // Configure timeout settings
  configure(settings: TimeoutSettings): void
}
```

**UI Integration:**

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Dashboard | `checkOllamaAvailability()` | Connection status card |
| Settings | `checkOllamaAvailability()` | Status indicator |
| Analyze View | `withTimeout()` | Wrap analysis calls |

**Required Integration (P0):**

```typescript
// In AnalysisService.ts
import { NetworkTimeoutHandler } from './NetworkTimeoutHandler';

class AnalysisService {
  private timeoutHandler = NetworkTimeoutHandler.getInstance();
  
  async analyzeError(error: ErrorInfo): Promise<Analysis> {
    return this.timeoutHandler.withTimeout(
      () => this.agent.analyze(error),
      30000 // 30s timeout
    );
  }
}
```

---

## [BRAIN] Core Backend Agents

These components live in `src/agent/` and implement the analysis logic.

### 4. MinimalReactAgent

**Location:** `src/agent/MinimalReactAgent.ts`  
**Purpose:** Main React-style reasoning agent

**Key Methods:**

```typescript
class MinimalReactAgent {
  // Main analysis entry point
  async analyze(
    error: ParsedError,
    options?: AnalysisOptions
  ): Promise<RCAResult>
  
  // Get real-time state stream
  getStateStream(): AgentStateStream
  
  // Cancel analysis
  cancel(): void
}
```

**Used By:** AnalysisService  
**UI Views:** Analyze, Agent State

---

### 5. MultiPassAgent

**Location:** `src/agent/MultiPassAgent.ts`  
**Purpose:** Multi-iteration refinement of analysis

**Key Methods:**

```typescript
class MultiPassAgent {
  async analyzeMultiPass(
    error: ParsedError,
    maxPasses: number = 3
  ): Promise<RCAResult>
  
  // Get consensus from multiple passes
  buildConsensus(passes: RCAResult[]): RCAResult
}
```

**Used By:** MinimalReactAgent (when enabled)  
**UI Views:** Agent State (shows iteration progress)

---

### 6. FixGenerator

**Location:** `src/agent/FixGenerator.ts`  
**Purpose:** Generate intelligent code fixes using LLM

**[WARNING] P0 Gap:** Not connected to FixApplicationService

**Key Methods:**

```typescript
class FixGenerator {
  // Generate fix for error
  async generateFix(error: ParsedError): Promise<Fix>
  
  // Generate multiple fix alternatives
  async generateFixAlternatives(
    error: ParsedError,
    count: number = 3
  ): Promise<Fix[]>
  
  // Validate fix syntax
  validateFix(fix: Fix): ValidationResult
}
```

**UI Integration:** Should be used by FixApplicationService

---

### 7. ErrorClassifier

**Location:** `src/agent/ErrorClassifier.ts`  
**Purpose:** Classify errors by type, severity, category

**Key Methods:**

```typescript
class ErrorClassifier {
  // Classify error
  classify(error: ParsedError): ErrorClassification
  
  // Get suggested tools for error type
  suggestTools(classification: ErrorClassification): Tool[]
}
```

**Used By:** MinimalReactAgent  
**UI Views:** Error Queue (shows classification badges)

---

### 8-16. Other Agent Components

| Component | Location | Purpose |
|-----------|----------|---------|
| EducationalAgent | `src/agent/EducationalAgent.ts` | Teaching mode with explanations ([WARNING] P1 gap - not accessible) |
| DocumentSynthesizer | `src/agent/DocumentSynthesizer.ts` | Generate markdown reports |
| PromptEngine | `src/agent/PromptEngine.ts` | Build prompts for LLM |
| TemplateEngine | `src/agent/TemplateEngine.ts` | Prompt templates |
| ResponseValidator | `src/agent/ResponseValidator.ts` | Validate LLM responses |
| OutputValidator | `src/agent/OutputValidator.ts` | Validate agent outputs |
| ModelAdapter | `src/agent/ModelAdapter.ts` | Adapt prompts for different models ([WARNING] P2 gap - not used) |
| AgentStateStream | `src/agent/AgentStateStream.ts` | Real-time state updates |
| AdaptiveLearning | `src/agent/AdaptiveLearning.ts` | Learn from feedback ([WARNING] P1 gap - not running) |
| LearningPipeline | `src/agent/LearningPipeline.ts` | Periodic learning execution |
| FeedbackHandler | `src/agent/FeedbackHandler.ts` | User feedback processing |

---

## [BUILD] Tool System

Tools live in `src/tools/` and provide capabilities to the agent.

### Tool Registry

**Location:** `src/tools/ToolRegistry.ts`  
**Purpose:** Central registry of all available tools

```typescript
class ToolRegistry {
  static getAvailableTools(): Tool[]
  static getTool(name: string): Tool | undefined
}
```

### Core Tools (15+)

| Tool | File | Purpose |
|------|------|---------|
| ReadFileTool | `ReadFileTool.ts` | Read file contents |
| WriteFileTool | `WriteFileTool.ts` | Write file |
| EditFileTool | `EditFileTool.ts` | Edit file |
| SearchInFilesTool | `SearchInFilesTool.ts` | Grep search |
| ListDirectoryTool | `ListDirectoryTool.ts` | List files |
| CodeSearchTool | `CodeSearchTool.ts` | Semantic code search |
| StackTraceParser | `StackTraceParser.ts` | Parse stack traces |
| GradleExecutor | `GradleExecutor.ts` | Run Gradle commands |
| AndroidLogcatTool | `AndroidLogcatTool.ts` | Parse logcat |
| ManifestAnalyzer | `ManifestAnalyzer.ts` | Analyze AndroidManifest |
| DependencyAnalyzer | `DependencyAnalyzer.ts` | Analyze dependencies |
| NetworkAnalyzer | `NetworkAnalyzer.ts` | Network debugging |
| PatternMatcher | `PatternMatcher.ts` | Pattern matching |
| SymbolResolver | `SymbolResolver.ts` | Resolve symbols |
| ContextEnricher | `ContextEnricher.ts` | Enrich context |

**UI Integration:** Tool usage displayed in Agent State View

---

## [PUZZLE] Utility Components

### ErrorParser

**Location:** `src/utils/ErrorParser.ts`  
**Purpose:** Parse error messages into structured format

```typescript
class ErrorParser {
  static parseError(errorText: string): ParsedError
  static extractStackTrace(text: string): StackFrame[]
}
```

### Specialized Parsers ([WARNING] P1 Gap - Not Exposed)

| Parser | File | Purpose |
|--------|------|---------|
| KotlinParser | `src/utils/parsers/KotlinParser.ts` | Parse Kotlin errors |
| GradleParser | `src/utils/parsers/GradleParser.ts` | Parse Gradle errors |
| XMLParser | `src/utils/parsers/XMLParser.ts` | Parse XML errors |
| JetpackComposeParser | `src/utils/parsers/JetpackComposeParser.ts` | Parse Compose errors |

**Required Integration:**

```typescript
class ParserRegistry {
  private parsers = [
    new KotlinParser(),
    new GradleParser(),
    new XMLParser(),
    new JetpackComposeParser()
  ];
  
  parse(errorText: string, filePath?: string): ParsedError {
    for (const parser of this.parsers) {
      if (parser.canHandle(errorText, filePath)) {
        return parser.parse(errorText);
      }
    }
    return ErrorParser.parseError(errorText); // Fallback
  }
}
```

### DiffFormatter

**Location:** `src/utils/DiffFormatter.ts`  
**Purpose:** Format code diffs for display

```typescript
class DiffFormatter {
  static format(
    before: string,
    after: string,
    options?: FormatOptions
  ): FormattedDiff
}
```

**Used By:** FixApplicationService  
**UI Views:** Fix Manager (diff preview)

### Other Utilities

| Utility | File | Purpose |
|---------|------|---------|
| FileResolver | `src/utils/FileResolver.ts` | Resolve file paths |
| LanguageDetector | `src/utils/LanguageDetector.ts` | Detect programming language |
| PathUtils | `src/utils/PathUtils.ts` | Path manipulation |
| ToolOrchestrator | `src/utils/ToolOrchestrator.ts` | Parallel tool execution ([WARNING] P2 gap) |

---

## [SAVE] Caching System

### RCACache

**Location:** `src/cache/RCACache.ts`  
**Purpose:** In-memory L1 cache

```typescript
class RCACache {
  get(errorHash: string): RCADocument | null
  set(errorHash: string, rca: RCADocument): void
  clear(): void
  getStats(): CacheStats
}
```

**UI Integration:** Metrics View shows cache stats

### ChromaDBClient

**Location:** `src/database/ChromaDBClient.ts`  
**Purpose:** Persistent vector database (L2 cache)

**[WARNING] P1 Gap:** Not integrated with RCACache for two-tier caching

```typescript
class ChromaDBClient {
  async addRCA(rca: RCADocument): Promise<void>
  async searchSimilar(query: string, options: SearchOptions): Promise<RCADocument[]>
  async getCollection(name: string): Promise<Collection>
}
```

**Required Integration:** See "ChromaDB Two-Tier Caching" in P1 gaps below

---

## [CHART] Monitoring & Performance

### PerformanceTracker

**Location:** `src/monitoring/PerformanceTracker.ts`  
**Purpose:** Track analysis performance metrics

```typescript
class PerformanceTracker {
  static track(operation: string, duration: number): void
  static getMetrics(): PerformanceMetrics
  static getAverageTime(operation: string): number
  static getSuccessRate(): number
}
```

**UI Integration:**

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Dashboard | `getMetrics()` | Stats cards |
| Metrics View | `getMetrics()` | Charts and graphs |
| Dashboard | `getSuccessRate()` | Success rate stat |

---

## [CHAT] Chat Participant Integration

### RCAChatParticipant

**Location:** `vscode-extension/src/chat/RCAChatParticipant.ts`  
**Purpose:** GitHub Copilot Chat integration

**[WARNING] P0 Gap:** ChatActionCommands not registered

**Key Methods:**

```typescript
class RCAChatParticipant {
  async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream
  ): Promise<void>
}
```

**Commands (Not Registered!):**
- `rca-agent.applyFix` - Apply suggested fix
- `rca-agent.explainMore` - Get detailed explanation
- `rca-agent.searchSimilar` - Find similar errors

**Required Fix:** Register commands in `extension.ts` and `package.json`

---

## [BRAIN] Knowledge Services ([WARNING] P1 Gap - Not Connected)

### FewShotExampleService

**Location:** `src/knowledge/FewShotExampleService.ts`  
**Purpose:** Manage few-shot examples for prompts

```typescript
class FewShotExampleService {
  getExamplesForErrorType(
    errorType: string,
    options?: { limit?: number }
  ): Example[]
  
  addExample(example: Example): void
  updateExample(id: string, example: Example): void
}
```

### SemanticExampleService

**Location:** `src/knowledge/SemanticExampleService.ts`  
**Purpose:** Semantic retrieval of relevant examples

```typescript
class SemanticExampleService {
  async findSimilar(
    query: string,
    options: { limit?: number; threshold?: number }
  ): Promise<Example[]>
}
```

**Required Integration:** Wire to MinimalReactAgent to improve analysis quality

---

## [WARNING] Priority Gaps & Required Integrations

### P0 - Critical (Must Fix Before UI Implementation)

Covered in [RCA_MASTER_IMPLEMENTATION_GUIDE.md](./RCA_MASTER_IMPLEMENTATION_GUIDE.md):

1. **ChatActionCommands Not Registered** (30 min)
2. **FixApplicationService Not Using FixGenerator** (2 hours)
3. **NetworkTimeoutHandler Not Used** (1.5 hours)

**Total: ~4 hours**

---

### P1 - High Priority (Implement After UI)

#### 1. Knowledge Services Not Connected (3 hours)

**Problem:** Agent uses hardcoded examples instead of FewShotExampleService

**Solution:**

```typescript
import { FewShotExampleService } from '../knowledge/FewShotExampleService';
import { SemanticExampleService } from '../knowledge/SemanticExampleService';

class MinimalReactAgent {
  private fewShotService: FewShotExampleService;
  private semanticService?: SemanticExampleService;
  
  constructor(config: AgentConfig) {
    this.fewShotService = new FewShotExampleService();
    
    if (config.useSemanticRetrieval) {
      this.semanticService = new SemanticExampleService(chromaClient);
    }
  }
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    // Get relevant examples
    const examples = await this.fewShotService.getExamplesForErrorType(
      error.type,
      { limit: 3 }
    );
    
    // Or semantic retrieval
    if (this.semanticService) {
      const semanticExamples = await this.semanticService.findSimilar(
        error.message,
        { limit: 3, threshold: 0.7 }
      );
      examples.push(...semanticExamples);
    }
    
    // Use in prompt
    const prompt = this.promptEngine.buildIterationPrompt({
      error,
      examples // ← Now uses retrieved examples
    });
  }
}
```

---

#### 2. Parser Infrastructure Not Exposed (2 hours)

**Problem:** Only generic ErrorParser used, specialized parsers ignored

**Solution:** Create ParserRegistry (shown in Specialized Parsers section above)

---

#### 3. ChromaDB Two-Tier Caching (3 hours)

**Problem:** RCACache and ChromaDB work separately, no coordination

**Solution:**

```typescript
class TwoTierCache {
  constructor(
    private l1Cache: RCACache,
    private l2Cache: ChromaDBClient
  ) {}
  
  async get(errorHash: string): Promise<RCADocument | null> {
    // Try L1 (memory)
    const l1Result = this.l1Cache.get(errorHash);
    if (l1Result) return l1Result;
    
    // Try L2 (persistent)
    const l2Results = await this.l2Cache.searchSimilar(
      errorHash,
      { limit: 1, threshold: 0.95 }
    );
    
    if (l2Results.length > 0) {
      const result = l2Results[0];
      this.l1Cache.set(errorHash, result); // Promote to L1
      return result;
    }
    
    return null;
  }
  
  async set(errorHash: string, rca: RCADocument): Promise<void> {
    this.l1Cache.set(errorHash, rca);
    await this.l2Cache.addRCA(rca);
  }
}
```

---

#### 4. AdaptiveLearning Not Running (2 hours)

**Problem:** Learning system exists but never executes

**Solution:**

```typescript
class LearningService {
  private adaptiveLearning: AdaptiveLearning;
  private pipeline: LearningPipeline;
  
  async runNightlyLearning(): Promise<void> {
    await this.adaptiveLearning.analyzeFeedbackPatterns();
    const result = await this.pipeline.run();
    
    if (result.newExamplesGenerated > 0) {
      await this.updateFewShotExamples(result.examples);
    }
  }
  
  schedulePeriodicLearning(): void {
    setInterval(() => {
      this.runNightlyLearning().catch(console.error);
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }
}
```

---

#### 5. EducationalAgent Not Accessible (1 hour)

**Problem:** No toggle to switch between MinimalReact and Educational modes

**Solution:**

```typescript
// In AnalysisService
import { EducationalAgent } from '../../../src/agent/EducationalAgent';
import { MinimalReactAgent } from '../../../src/agent/MinimalReactAgent';

class AnalysisService {
  private agent: MinimalReactAgent | EducationalAgent;
  
  setEducationalMode(enabled: boolean): void {
    this.agent = enabled
      ? new EducationalAgent(this.config)
      : new MinimalReactAgent(this.config);
  }
}
```

**UI:** Add toggle in Settings section of sidebar

**Total P1 Effort:** ~11 hours

---

### P2 - Medium Priority (Nice to Have)

| Gap | Effort | Impact |
|-----|--------|--------|
| ModelAdapter Not Used | 2h | Better multi-model support |
| DocumentSynthesizer Output Not Exported | 1h | Export analysis reports |
| ToolOrchestrator Not Leveraged | 3h | Parallel tool execution |
| Performance Metrics Not Displayed | 2h | Metrics View charts |
| EmptyStateTemplates Underused | 1h | Better empty states |
| ThemeManager Not Propagating Updates | 30min | Theme sync |
| AccessibilityService Not Utilized | 3h | ARIA labels |

**Total P2 Effort:** ~12.5 hours

---

### P3 - Low Priority

| Gap | Effort | Impact |
|-----|--------|--------|
| VirtualScrollProvider Not Functional | 4h+ | Large list performance |

---

## [PLUGIN] Message Passing Reference

### Extension → Webview

```typescript
// In extension.ts or service
panel.webview.postMessage({
  command: 'analysisComplete',
  result: { /* RCAResult */ }
});

panel.webview.postMessage({
  command: 'progressUpdate',
  iteration: 3,
  totalIterations: 6,
  hypothesis: '...',
  confidence: 0.75
});

panel.webview.postMessage({
  command: 'errorDetected',
  error: { /* ErrorInfo */ }
});

panel.webview.postMessage({
  command: 'ollamaStatusChanged',
  status: { available: true, latency: 120 }
});
```

### Webview → Extension

```typescript
// In webview React component
const vscode = acquireVsCodeApi();

vscode.postMessage({
  command: 'analyzeError',
  error: { message: '...', file: '...', line: 42 }
});

vscode.postMessage({
  command: 'applyFix',
  fixId: 'fix-123'
});

vscode.postMessage({
  command: 'searchHistory',
  query: 'NullPointerException'
});

vscode.postMessage({
  command: 'getOllamaStatus'
});

vscode.postMessage({
  command: 'updateSettings',
  settings: { educationalMode: true }
});
```

---

## [SETTINGS] Configuration Settings

### VS Code Configuration Schema

```json
{
  "rca-agent.model": {
    "type": "string",
    "default": "deepseek-r1:7b",
    "description": "Ollama model to use for analysis"
  },
  "rca-agent.ollamaUrl": {
    "type": "string",
    "default": "http://localhost:11434",
    "description": "Ollama API endpoint"
  },
  "rca-agent.educationalMode": {
    "type": "boolean",
    "default": false,
    "description": "Enable educational explanations"
  },
  "rca-agent.realtimeDetection": {
    "type": "boolean",
    "default": true,
    "description": "Auto-detect errors while typing"
  },
  "rca-agent.maxIterations": {
    "type": "number",
    "default": 6,
    "description": "Maximum analysis iterations"
  },
  "rca-agent.cacheEnabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable result caching"
  }
}
```

### Reading Configuration

```typescript
// In extension
const config = vscode.workspace.getConfiguration('rca-agent');
const model = config.get<string>('model', 'deepseek-r1:7b');
const educationalMode = config.get<boolean>('educationalMode', false);

// Listen for changes
vscode.workspace.onDidChangeConfiguration(event => {
  if (event.affectsConfiguration('rca-agent')) {
    // Reload settings
  }
});
```

---

## [DOCS] Type Definitions

### Core Types

```typescript
interface ErrorInfo {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stackTrace?: string;
  language?: string;
}

interface ParsedError extends ErrorInfo {
  type: ErrorType;
  severity: 'error' | 'warning' | 'info';
  category: ErrorCategory;
  context?: CodeContext;
}

interface RCAResult {
  rootCause: string;
  confidence: number;
  iterations: IterationResult[];
  suggestedFixes: Fix[];
  relatedErrors: ErrorInfo[];
  timestamp: Date;
}

interface Fix {
  id: string;
  description: string;
  filePath: string;
  changes: FileChange[];
  confidence: number;
  validated: boolean;
}

interface DiffPreview {
  before: string;
  after: string;
  formatted: string; // HTML or markdown
}

interface AnalysisResult {
  id: string;
  error: ErrorInfo;
  rca: RCAResult;
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}
```

---

## [TARGET] Quick Reference: UI View → Backend Mapping

| UI View | Primary Services | Secondary Services | Data Sources |
|---------|-----------------|-------------------|--------------|
| Dashboard | StateManager | PerformanceTracker, NetworkTimeoutHandler | getHistory(), getMetrics(), checkAvailability() |
| Error Queue | ErrorQueueManager | RealtimeErrorDetector | getQueue(), detectErrors() |
| Analyze | AnalysisService | FixApplicationService, AgentStateStream | analyzeError(), getStateStream() |
| History | StateManager | - | getHistory(), searchHistory() |
| Agent State | AgentStateStream | PerformanceTracker | Real-time state updates |
| Fix Manager | FixApplicationService | FixGenerator | getPendingFixes(), applyFix() |
| Metrics | PerformanceTracker | AdaptiveLearning | getMetrics(), getLearningMetrics() |

---

## [LAUNCH] Next Steps

1. **Fix P0 gaps** (4 hours) - See [RCA_MASTER_IMPLEMENTATION_GUIDE.md](./RCA_MASTER_IMPLEMENTATION_GUIDE.md)
2. **Implement UI** following 4-week roadmap
3. **Wire backend services** using this reference
4. **Address P1 gaps** (11 hours) for enhanced functionality
5. **Optionally implement P2/P3** as time permits

---

**Related Documents:**
- [RCA_MASTER_IMPLEMENTATION_GUIDE.md](./RCA_MASTER_IMPLEMENTATION_GUIDE.md) - Complete design and roadmap
- [RCA_UI_REMOVAL_SUMMARY.md](./RCA_UI_REMOVAL_SUMMARY.md) - What was removed

---

**Questions?** Refer to source code or open an issue.
