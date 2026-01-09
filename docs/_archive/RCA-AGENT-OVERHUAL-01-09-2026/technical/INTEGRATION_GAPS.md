# Integration Gaps - P1, P2, P3 Priorities

**Purpose:** Track missing integrations beyond P0  
**Status:** To be addressed after v2.0 launch

---

## P0 - Critical (Week 1)

See [Phase 1 - Critical Fixes](../phases/phase-1-foundation/CRITICAL_FIXES.md)

1. ChatActionCommands Not Registered (30 min)
2. FixApplicationService Not Using FixGenerator (2 hours)
3. NetworkTimeoutHandler Not Used (1.5 hours)

**Total P0 Effort:** ~4 hours

---

## P1 - High Priority (Week 5+)

### 1. Knowledge Services Not Connected

**Effort:** 3 hours  
**Impact:** Improves analysis quality with few-shot examples

**Problem:** Agent uses hardcoded examples instead of FewShotExampleService

**Files:**
- `src/knowledge/FewShotExampleService.ts` (exists, not connected)
- `src/knowledge/SemanticExampleService.ts` (exists, not connected)
- `src/agent/MinimalReactAgent.ts` (needs integration)

**Solution:**

```typescript
import { FewShotExampleService } from '../knowledge/FewShotExampleService';
import { SemanticExampleService } from '../knowledge/SemanticExampleService';

class MinimalReactAgent {
  private fewShotService: FewShotExampleService;
  private semanticService: SemanticExampleService;

  constructor(llm: OllamaClient, promptManager: PromptManager) {
    this.fewShotService = new FewShotExampleService();
    this.semanticService = new SemanticExampleService();
  }

  async analyze(params: AnalysisParams): Promise<RCAResult> {
    // Get relevant examples
    const examples = await this.semanticService.findSimilar(
      params.error,
      { limit: 3, minSimilarity: 0.7 }
    );

    // Build prompt with examples
    const prompt = this.promptManager.buildAnalysisPrompt({
      error: params.error,
      examples: examples,
      // ... other params
    });

    // Continue with analysis
  }
}
```

**Benefits:**
- Better analysis quality
- Learning from past successes
- Context-aware prompts

---

### 2. Parser Infrastructure Not Exposed

**Effort:** 2 hours  
**Impact:** Better error parsing for different languages

**Problem:** Only generic ErrorParser used, specialized parsers ignored

**Files:**
- `src/utils/parsers/KotlinParser.ts` (exists)
- `src/utils/parsers/GradleParser.ts` (exists)
- `src/utils/parsers/XMLParser.ts` (exists)
- `src/utils/parsers/JetpackComposeParser.ts` (exists)
- Need: `src/utils/parsers/ParserRegistry.ts`

**Solution:**

```typescript
class ParserRegistry {
  private parsers: Map<string, ErrorParser> = new Map();

  constructor() {
    this.parsers.set('kotlin', new KotlinParser());
    this.parsers.set('gradle', new GradleParser());
    this.parsers.set('xml', new XMLParser());
    this.parsers.set('jetpack-compose', new JetpackComposeParser());
  }

  parseError(error: string, language?: string): ParsedError {
    if (!language) {
      language = this.detectLanguage(error);
    }

    const parser = this.parsers.get(language) || new GenericParser();
    return parser.parse(error);
  }

  private detectLanguage(error: string): string {
    // Auto-detect from error patterns
    if (error.includes('.kt:')) return 'kotlin';
    if (error.includes('build.gradle')) return 'gradle';
    if (error.includes('AndroidManifest')) return 'xml';
    return 'generic';
  }
}
```

**Usage in MinimalReactAgent:**

```typescript
class MinimalReactAgent {
  private parserRegistry = new ParserRegistry();

  async analyze(params: AnalysisParams): Promise<RCAResult> {
    // Parse error with appropriate parser
    const parsed = this.parserRegistry.parseError(
      params.error,
      params.language
    );

    // Use structured data for analysis
    const context = {
      errorType: parsed.type,
      location: parsed.location,
      stackFrames: parsed.stackFrames,
      // ...
    };
  }
}
```

**Benefits:**
- Language-specific parsing
- Better error understanding
- Structured error data

---

### 3. ChromaDB Two-Tier Caching

**Effort:** 3 hours  
**Impact:** Faster lookups, persistent cache

**Problem:** RCACache and ChromaDB work separately, no coordination

**Files:**
- `src/cache/RCACache.ts` (L1 in-memory)
- `src/database/ChromaDBClient.ts` (L2 persistent)
- Need: `src/cache/TwoTierCache.ts`

**Solution:**

```typescript
class TwoTierCache {
  constructor(
    private l1Cache: RCACache,
    private l2Cache: ChromaDBClient
  ) {}

  async get(errorHash: string): Promise<RCADocument | null> {
    // Check L1 first (fast)
    let doc = this.l1Cache.get(errorHash);
    if (doc) {
      return doc;
    }

    // Check L2 (slower but persistent)
    doc = await this.l2Cache.searchSimilar(errorHash, { limit: 1 });
    if (doc) {
      // Promote to L1
      this.l1Cache.set(errorHash, doc);
      return doc;
    }

    return null;
  }

  async set(errorHash: string, doc: RCADocument): Promise<void> {
    // Write to both caches
    this.l1Cache.set(errorHash, doc);
    await this.l2Cache.addRCA(doc);
  }

  async searchSimilar(
    query: string, 
    options: SearchOptions
  ): Promise<RCADocument[]> {
    // L2 handles semantic search
    const results = await this.l2Cache.searchSimilar(query, options);
    
    // Promote top results to L1
    results.slice(0, 3).forEach(doc => {
      this.l1Cache.set(doc.errorHash, doc);
    });

    return results;
  }

  getStats(): CacheStats {
    return {
      l1: this.l1Cache.getStats(),
      l2: { 
        // Query ChromaDB for stats
      }
    };
  }
}
```

**Integration:**

```typescript
// In MinimalReactAgent
class MinimalReactAgent {
  private cache = new TwoTierCache(
    new RCACache(),
    new ChromaDBClient()
  );

  async analyze(params: AnalysisParams): Promise<RCAResult> {
    const errorHash = this.hashError(params.error);

    // Check cache first
    const cached = await this.cache.get(errorHash);
    if (cached && cached.confidence > 0.9) {
      return cached.result;
    }

    // Perform analysis
    const result = await this.doAnalysis(params);

    // Cache result
    await this.cache.set(errorHash, {
      errorHash,
      result,
      timestamp: Date.now()
    });

    return result;
  }
}
```

**Benefits:**
- Fast L1 cache (in-memory)
- Persistent L2 cache (survives restarts)
- Automatic promotion
- Better hit rates

---

### 4. AdaptiveLearning Not Running

**Effort:** 2 hours  
**Impact:** Agent improves over time

**Problem:** Learning system exists but never executes

**Files:**
- `src/agent/AdaptiveLearning.ts` (exists)
- `src/agent/LearningPipeline.ts` (exists)
- Need: Background execution

**Solution:**

```typescript
class LearningService {
  private adaptiveLearning: AdaptiveLearning;
  private pipeline: LearningPipeline;
  private timer?: NodeJS.Timer;

  constructor() {
    this.adaptiveLearning = new AdaptiveLearning();
    this.pipeline = new LearningPipeline(this.adaptiveLearning);
  }

  start() {
    // Run every 24 hours
    this.timer = setInterval(() => {
      this.runLearningCycle();
    }, 24 * 60 * 60 * 1000);

    // Run on startup if last run > 24h ago
    const lastRun = this.getLastRunTime();
    if (Date.now() - lastRun > 24 * 60 * 60 * 1000) {
      this.runLearningCycle();
    }
  }

  async runLearningCycle() {
    try {
      console.log('Running learning cycle...');
      await this.pipeline.runCycle();
      this.setLastRunTime(Date.now());
      console.log('Learning cycle complete');
    } catch (error) {
      console.error('Learning cycle failed:', error);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // Trigger immediate learning (e.g., after N feedbacks)
  async triggerImmediate() {
    await this.runLearningCycle();
  }

  private getLastRunTime(): number {
    // Read from config/state
    return 0;
  }

  private setLastRunTime(time: number) {
    // Save to config/state
  }
}
```

**Integration in extension.ts:**

```typescript
export function activate(context: vscode.ExtensionContext) {
  // ... other activation ...

  // Start learning service
  const learningService = new LearningService();
  learningService.start();

  context.subscriptions.push({
    dispose: () => learningService.stop()
  });
}
```

**Benefits:**
- Continuous improvement
- Learns from feedback
- Adapts to user patterns

---

### 5. EducationalAgent Not Accessible

**Effort:** 1 hour  
**Impact:** Teaching mode for learning developers

**Problem:** No toggle to switch between MinimalReact and Educational modes

**Files:**
- `src/agent/EducationalAgent.ts` (exists)
- `vscode-extension/src/services/AnalysisService.ts` (needs toggle)

**Solution:**

```typescript
// In AnalysisService
import { EducationalAgent } from '../../../src/agent/EducationalAgent';
import { MinimalReactAgent } from '../../../src/agent/MinimalReactAgent';

class AnalysisService {
  private agent: MinimalReactAgent | EducationalAgent;

  constructor() {
    this.updateAgent();
  }

  private updateAgent() {
    const config = vscode.workspace.getConfiguration('rca-agent');
    const educationalMode = config.get<boolean>('educationalMode', false);

    if (educationalMode) {
      this.agent = new EducationalAgent(/* ... */);
    } else {
      this.agent = new MinimalReactAgent(/* ... */);
    }
  }

  async analyzeError(
    error: ErrorInfo
  ): Promise<RCAResult & { teaching?: TeachingContent }> {
    const result = await this.agent.analyze(error);

    // If educational agent, include teaching content
    if (this.agent instanceof EducationalAgent) {
      return {
        ...result,
        teaching: (result as any).teaching
      };
    }

    return result;
  }
}
```

**UI Integration:**

```tsx
// In Settings section
<div className="flex items-center justify-between">
  <Label>Educational Mode</Label>
  <Switch 
    checked={educationalMode}
    onCheckedChange={async (checked) => {
      await vscode.postMessage({ 
        command: 'updateConfig',
        key: 'educationalMode',
        value: checked
      });
      setEducationalMode(checked);
    }}
  />
</div>

// In Analyze view, show teaching content if present
{result.teaching && (
  <Accordion type="single" collapsible>
    <AccordionItem value="teaching">
      <AccordionTrigger>
         Learn More
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Why This Happened:</h4>
            <p>{result.teaching.why}</p>
          </div>
          <div>
            <h4 className="font-semibold">How to Fix:</h4>
            <p>{result.teaching.how}</p>
          </div>
          <div>
            <h4 className="font-semibold">Best Practices:</h4>
            <ul>
              {result.teaching.practices.map(p => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)}
```

**Benefits:**
- Teaching mode for juniors
- Detailed explanations
- Best practices

**Total P1 Effort:** ~11 hours

---

## P2 - Medium Priority

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

## P3 - Low Priority

| Gap | Effort | Impact |
|-----|--------|--------|
| VirtualScrollProvider Not Functional | 4h+ | Large list performance |

---

## Summary

### Total Technical Debt

- **P0:** 4 hours (BLOCKING)
- **P1:** 11 hours (High value)
- **P2:** 12.5 hours (Nice to have)
- **P3:** 4+ hours (Optimization)

**Total:** ~31.5 hours beyond v2.0 launch

### Recommended Schedule

- **Week 1:** Fix P0 gaps (required for v2.0)
- **Week 5:** Address P1 gaps (v2.1)
- **Week 6-7:** Address P2 gaps (v2.2)
- **Week 8+:** P3 as needed

---

**Related:**
- [Frontend Services](FRONTEND_SERVICES.md)
- [Core Agents](CORE_AGENTS.md)
- [Phase 1 - Critical Fixes](../phases/phase-1-foundation/CRITICAL_FIXES.md)
