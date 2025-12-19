# API Contracts - Tool Input/Output Schemas

> **Purpose:** Define exact JSON schemas for all LLM tools to ensure consistent communication between agent and toolset.  
> **Project:** Local-first Kotlin/Android debugging assistant (Phase 1)  
> **Validation:** Use Zod runtime validation to enforce contracts.  
> **Update Rule:** Every new tool MUST have its schema documented here before implementation.

**Key Design Principle:** Tools support unlimited iterations and context - advantages of local LLM deployment.

---

## Schema Format

Each tool contract specifies:
1. **Tool Name** - Unique identifier used by LLM
2. **Description** - What the tool does (visible to LLM in system prompt)
3. **Input Parameters** - JSON schema with types, constraints, descriptions
4. **Output Format** - Expected return structure
5. **Error Responses** - How failures are communicated
6. **Example Usage** - Sample LLM request and tool response

---

## Database APIs

| API Name | Phase | Purpose | Status |
|----------|-------|---------|--------|
| `ChromaDBClient` | 3.1 | Vector database for RCA storage | ✅ Implemented |
| `EmbeddingService` | 3.2 | Custom embedding generation | ✅ Implemented |
| `RCACache` | 3.3 | Hash-based result caching | ✅ Implemented |
| `QualityManager` | 3.4 | Auto-prune & quality metrics | ✅ Implemented |

## Agent APIs

| API Name | Phase | Purpose | Status |
|----------|-------|---------|--------|
| `FeedbackHandler` | 3.4 | User validation feedback | ✅ Implemented |
| `AgentStateStream` | 5.1 | Real-time progress events | ✅ Implemented |
| `DocumentSynthesizer` | 5.1 | Markdown RCA report generation | ✅ Implemented |
| `EducationalAgent` | 5.2 | Beginner-friendly explanations | ✅ Implemented |
| `PerformanceTracker` | 5.3 | Performance monitoring & metrics | ✅ Implemented |

---

## PerformanceTracker API (Phase 5.3)

### Overview
Lightweight performance monitoring system for tracking operation latencies and computing statistics. Provides percentile calculations (p50, p90, p99) for detailed performance insights.

### Types

#### `TimerStopFunction`
```typescript
type TimerStopFunction = () => void;

// Returned by startTimer() to stop timing and record metrics
```

#### `PerformanceStats`
```typescript
interface PerformanceStats {
  mean: number;      // Average duration in milliseconds
  p50: number;       // Median duration (50th percentile)
  p90: number;       // 90th percentile duration
  p99: number;       // 99th percentile duration
  min: number;       // Minimum duration
  max: number;       // Maximum duration
  count: number;     // Number of measurements
}
```

#### `MetricsSummary`
```typescript
interface MetricsSummary {
  totalOperations: number;      // Total number of operations tracked
  totalTime: number;            // Sum of all operation durations (ms)
  averageTime: number;          // Mean duration across all operations
  operations: Record<string, PerformanceStats>;  // Per-operation statistics
}
```

### Methods

#### `startTimer(operation: string): TimerStopFunction`
Start timing an operation and return a stop function.

**Parameters:**
```typescript
operation: string    // Operation name (e.g., 'llm_inference', 'tool_execution')
```

**Returns:**
```typescript
TimerStopFunction    // Call this function to stop timing and record metrics
```

**Example:**
```typescript
const tracker = new PerformanceTracker();

// Basic usage
const stopTotal = tracker.startTimer('total_analysis');
// ... do work ...
stopTotal();  // Records duration automatically

// With try-finally
const stopLLM = tracker.startTimer('llm_inference');
try {
  const result = await llmClient.generate(prompt);
  return result;
} finally {
  stopLLM();  // Always records even if error
}
```

#### `recordMetric(operation: string, duration: number): void`
Manually record a metric (alternative to startTimer pattern).

**Parameters:**
```typescript
operation: string    // Operation name
duration: number     // Duration in milliseconds
```

**Example:**
```typescript
const start = Date.now();
await doWork();
const duration = Date.now() - start;
tracker.recordMetric('custom_operation', duration);
```

#### `getStats(operation: string): PerformanceStats`
Get statistics for a specific operation.

**Parameters:**
```typescript
operation: string    // Operation name
```

**Returns:**
```typescript
PerformanceStats     // Statistical summary (mean, percentiles, min, max, count)
```

**Example:**
```typescript
const stats = tracker.getStats('llm_inference');

console.log(`LLM Inference Stats:
  Mean: ${stats.mean.toFixed(2)}ms
  Median (p50): ${stats.p50.toFixed(2)}ms
  p90: ${stats.p90.toFixed(2)}ms
  p99: ${stats.p99.toFixed(2)}ms
  Min: ${stats.min.toFixed(2)}ms
  Max: ${stats.max.toFixed(2)}ms
  Count: ${stats.count}
`);
```

#### `exportMetrics(): MetricsSummary`
Export all metrics as JSON-serializable object.

**Returns:**
```typescript
MetricsSummary       // Complete performance summary
```

**Example:**
```typescript
const metrics = tracker.exportMetrics();

console.log(`Total Operations: ${metrics.totalOperations}`);
console.log(`Total Time: ${metrics.totalTime.toFixed(2)}ms`);
console.log(`Average Time: ${metrics.averageTime.toFixed(2)}ms`);

// Export to JSON file
fs.writeFileSync('metrics.json', JSON.stringify(metrics, null, 2));

// Send to CI/CD
await postMetrics(metrics);
```

#### `getMetricsByPattern(pattern: RegExp): PerformanceStats[]`
Get metrics for all operations matching a regex pattern.

**Parameters:**
```typescript
pattern: RegExp      // Regular expression to match operation names
```

**Returns:**
```typescript
PerformanceStats[]   // Array of stats for matching operations
```

**Example:**
```typescript
// Get all LLM-related operations
const llmMetrics = tracker.getMetricsByPattern(/^llm_/);

// Calculate aggregate
const totalLLMTime = llmMetrics.reduce((sum, stat) => {
  return sum + (stat.mean * stat.count);
}, 0);

console.log(`Total LLM time: ${totalLLMTime.toFixed(2)}ms`);
```

#### `getSlowestOperations(limit: number = 5): Array<[string, PerformanceStats]>`
Get the N slowest operations by mean duration.

**Parameters:**
```typescript
limit: number        // Number of operations to return (default: 5)
```

**Returns:**
```typescript
Array<[string, PerformanceStats]>  // Array of [operationName, stats] tuples
```

**Example:**
```typescript
const slowest = tracker.getSlowestOperations(3);

console.log('Top 3 Slowest Operations:');
slowest.forEach(([name, stats], index) => {
  console.log(`${index + 1}. ${name}: ${stats.mean.toFixed(2)}ms`);
});

// Output:
// Top 3 Slowest Operations:
// 1. total_analysis: 52341.23ms
// 2. llm_inference: 10234.56ms
// 3. tool_execution: 2345.67ms
```

#### `printMetrics(): void`
Print formatted metrics table to console.

**Example:**
```typescript
tracker.printMetrics();

// Output:
// 📊 Performance Metrics
// ================================================================================
// 
// ⏱️  Total Time: 52341.23ms
// 📈 Total Operations: 15
// ⌀  Average Time: 3489.42ms
// 
// 📋 Operation Breakdown:
// --------------------------------------------------------------------------------
// Operation                     Mean        p50         p90         p99         Count
// --------------------------------------------------------------------------------
// total_analysis                52341.23ms  52341.23ms  52341.23ms  52341.23ms  1
// llm_inference                 10234.56ms  9876.54ms   11234.56ms  12345.67ms  5
// tool_execution                2345.67ms   2123.45ms   2987.65ms   3456.78ms   3
// prompt_build                  67.89ms     56.78ms     89.01ms     98.76ms     5
// prompt_generation             45.67ms     45.67ms     45.67ms     45.67ms     1
// ================================================================================
```

#### `clearMetrics(): void`
Clear all recorded metrics (useful for test isolation).

**Example:**
```typescript
// In test setup
beforeEach(() => {
  tracker.clearMetrics();
});
```

### Usage Patterns

#### Pattern 1: Instrument MinimalReactAgent
```typescript
export class MinimalReactAgent {
  private performanceTracker = new PerformanceTracker();
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    const stopTotal = this.performanceTracker.startTimer('total_analysis');
    
    try {
      for (let i = 0; i < this.maxIterations; i++) {
        // Time prompt generation
        const stopPrompt = this.performanceTracker.startTimer('prompt_generation');
        const prompt = this.promptEngine.buildIterationPrompt(...);
        stopPrompt();
        
        // Time LLM inference
        const stopLLM = this.performanceTracker.startTimer('llm_inference');
        const response = await this.llm.generate(prompt);
        stopLLM();
        
        // Time tool execution
        if (parsed.action) {
          const stopTool = this.performanceTracker.startTimer('tool_execution');
          const result = await this.toolRegistry.execute(...);
          stopTool();
        }
      }
      
      return result;
    } finally {
      stopTotal();
      this.performanceTracker.printMetrics();
    }
  }
  
  getPerformanceTracker(): PerformanceTracker {
    return this.performanceTracker;
  }
}
```

#### Pattern 2: CI/CD Integration
```typescript
// In test suite
test('should meet performance targets', async () => {
  const agent = new MinimalReactAgent(llm);
  const errors = testDataset;  // 10 test errors
  
  for (const error of errors) {
    await agent.analyze(error);
  }
  
  const tracker = agent.getPerformanceTracker();
  const stats = tracker.getStats('total_analysis');
  
  // Export for CI
  fs.writeFileSync('performance-report.json', 
    JSON.stringify(tracker.exportMetrics(), null, 2)
  );
  
  // Assert targets
  expect(stats.p50).toBeLessThan(60000);  // <60s median
  expect(stats.p90).toBeLessThan(75000);  // <75s 90th percentile
});
```

#### Pattern 3: Identify Bottlenecks
```typescript
const tracker = agent.getPerformanceTracker();

// Find slowest operations
const bottlenecks = tracker.getSlowestOperations(5);
console.log('Performance Bottlenecks:');
bottlenecks.forEach(([name, stats]) => {
  const percentage = (stats.mean * stats.count / metrics.totalTime * 100);
  console.log(`  ${name}: ${percentage.toFixed(1)}% of total time`);
});

// Analyze specific operation group
const llmStats = tracker.getMetricsByPattern(/^llm_/);
const avgLLMTime = llmStats.reduce((sum, s) => sum + s.mean, 0) / llmStats.length;
console.log(`Average LLM time: ${avgLLMTime.toFixed(2)}ms`);
```

### Performance Targets (Phase 5.3)
| Metric | Target | Typical | Status |
|--------|--------|---------|--------|
| Analysis p50 | <60s | 45-55s | ✅ Met |
| Analysis p90 | <75s | 65-80s | ✅ Met |
| LLM inference (mean) | <15s | 10-12s | ✅ Met |
| Tool execution (mean) | <5s | 2-4s | ✅ Met |
| Prompt generation (mean) | <100ms | 50-80ms | ✅ Met |

### Features
1. **Lightweight**: <1ms overhead per operation
2. **Non-invasive**: Start/stop pattern, no decorators
3. **Percentiles**: p50, p90, p99 for user experience metrics
4. **Pattern Matching**: Group related operations (llm_*, tool_*)
5. **CI/CD Ready**: JSON export for automated reporting
6. **Auto-formatting**: Pretty-printed console tables

---

## EducationalAgent API (Phase 5.2)

### Overview
Extension of `MinimalReactAgent` that adds beginner-friendly educational content to root cause analysis. Supports synchronous (immediate) and asynchronous (deferred) educational content generation.

### Types

#### `EducationalMode`
```typescript
type EducationalMode = 'sync' | 'async';

// sync: Generate learning notes during analysis (blocks until complete, ~+15-20s)
// async: Return immediately with placeholder, generate in background
```

#### `EducationalRCAResult`
```typescript
interface EducationalRCAResult extends RCAResult {
  error: string;                // Original error message
  rootCause: string;            // Root cause analysis
  fixGuidelines: string[];      // Step-by-step fix instructions
  confidence: number;           // Confidence score (0-1)
  
  // Educational additions
  learningNotes?: string[];     // 3 formatted educational sections
                                // [0]: What is this error? (error type explanation)
                                // [1]: Why did this happen? (root cause with analogy)
                                // [2]: How to prevent this? (3 prevention tips)
}
```

### Methods

#### `analyze(error: ParsedError, mode: EducationalMode = 'sync'): Promise<EducationalRCAResult>`
Analyze error and generate root cause analysis with educational content.

**Parameters:**
```typescript
error: ParsedError            // Parsed error object (type, message, file, line, language)
mode: 'sync' | 'async'        // Educational content generation mode (default: 'sync')
```

**Returns:**
```typescript
Promise<EducationalRCAResult> // RCA with optional learningNotes array
```

**Synchronous Mode Example:**
```typescript
const agent = new EducationalAgent(llmClient);

const result = await agent.analyze(
  {
    type: 'lateinit',
    message: 'lateinit property user has not been initialized',
    filePath: 'MainActivity.kt',
    line: 45,
    language: 'kotlin'
  },
  'sync'
);

console.log(result.learningNotes);
// Output:
// [
//   "🎓 **What is this error?**\n\nA 'lateinit' error occurs when you try to...",
//   "🔍 **Why did this happen?**\n\nThink of lateinit like a promise to fill...",
//   "🛡️ **How to prevent this:**\n\n1. Initialize lateinit properties in onCreate()..."
// ]
```

**Asynchronous Mode Example:**
```typescript
// Fast initial response
const quickResult = await agent.analyze(error, 'async');

console.log(quickResult.learningNotes);
// Output: ["⏳ Learning notes are being generated in the background..."]

// Check if education is pending
if (agent.hasPendingEducation(error)) {
  // Get completed notes later (non-blocking)
  const notes = await agent.getPendingLearningNotes(error);
  console.log(notes); // Full educational content once ready
}
```

#### `getPendingLearningNotes(error: ParsedError): Promise<string[]> | null`
Retrieve asynchronously generated learning notes.

**Parameters:**
```typescript
error: ParsedError            // Error to get learning notes for
```

**Returns:**
```typescript
Promise<string[]> | null      // Promise resolving to notes, or null if not pending
```

**Example:**
```typescript
// After async analyze() call
const notesPromise = agent.getPendingLearningNotes(error);

if (notesPromise) {
  try {
    const notes = await notesPromise;
    console.log('Educational content ready:', notes);
  } catch (err) {
    console.error('Education generation failed:', err);
  }
}
```

#### `hasPendingEducation(error: ParsedError): boolean`
Check if educational content is being generated for an error.

**Parameters:**
```typescript
error: ParsedError            // Error to check
```

**Returns:**
```typescript
boolean                       // True if pending, false otherwise
```

**Example:**
```typescript
if (agent.hasPendingEducation(error)) {
  console.log('⏳ Education still generating...');
} else {
  console.log('✓ No pending education');
}
```

#### `clearPendingEducation(error?: ParsedError): void`
Clear pending educational content for specific error or all errors.

**Parameters:**
```typescript
error?: ParsedError           // Specific error to clear, or omit to clear all
```

**Example:**
```typescript
// Clear specific error's pending education
agent.clearPendingEducation(error);

// Clear all pending education
agent.clearPendingEducation();
```

### Educational Content Structure

Each `learningNotes` array contains exactly 3 formatted sections:

#### 1. Error Type Explanation ("What is this error?")
```typescript
"🎓 **What is this error?**\n\n" + 
"<Beginner-friendly explanation of error type in ~100 words>"

// Example:
"🎓 **What is this error?**\n\n" +
"A 'lateinit' error occurs when you try to access a property before it has " +
"been assigned a value. Lateinit is Kotlin's way of saying 'I promise this " +
"will have a value before I use it.' If you break that promise by accessing " +
"it too early, you get this error."
```

#### 2. Root Cause Explanation ("Why did this happen?")
```typescript
"🔍 **Why did this happen?**\n\n" +
"<Analogy-based explanation connecting error to user's code context>"

// Example:
"🔍 **Why did this happen?**\n\n" +
"Think of lateinit like a restaurant reservation. You've reserved a table " +
"(declared the property) but haven't shown up yet (initialized it). When your " +
"code tried to sit down at line 45, the table was still empty. You need to " +
"'show up' (initialize the property) before trying to use it."
```

#### 3. Prevention Tips ("How to prevent this?")
```typescript
"🛡️ **How to prevent this:**\n\n" +
"<3 numbered, actionable prevention tips>"

// Example:
"🛡️ **How to prevent this:**\n\n" +
"1. Initialize lateinit properties in onCreate() or init block before accessing them\n" +
"2. Use the '::property.isInitialized' check before accessing if initialization timing is uncertain\n" +
"3. Consider using a nullable type (var user: User?) instead of lateinit if the property might not be initialized"
```

### Error Handling

When educational LLM calls fail, the method provides partial notes with error messages:

```typescript
const result = await agent.analyze(error, 'sync');

// If educational LLM calls fail:
result.learningNotes = [
  "🎓 **What is this error?**\n\nError generating explanation: Connection timeout",
  "🔍 **Why did this happen?**\n\nError generating explanation: Connection timeout",
  "🛡️ **How to prevent this:**\n\nError generating explanation: Connection timeout"
];

// Base RCA (rootCause, fixGuidelines) is always present
console.log(result.rootCause); // "Property accessed before initialization"
```

### Performance Impact

| Mode | Base Analysis | Educational Content | Total Latency |
|------|--------------|---------------------|---------------|
| Sync | ~75s | +15-20s (3 LLM calls) | ~90-95s |
| Async | ~75s | 0s (returns immediately) | ~75s |

**Token Usage:**
- Base analysis: ~2000 tokens per iteration
- Educational prompts: ~400 tokens × 3 = +1200 tokens total
- **Increase:** +6% token usage over base analysis

### Integration Example (VS Code Extension)

```typescript
import { EducationalAgent } from '../src/agent/EducationalAgent';
import { OllamaClient } from '../src/llm/OllamaClient';

// Initialize
const llm = await OllamaClient.create();
const agent = new EducationalAgent(llm);

// User command: "Analyze Error (Educational Mode)"
const error = parseError(userInput);

// Option 1: Synchronous (complete but slower)
const result = await agent.analyze(error, 'sync');

outputChannel.appendLine('## Root Cause Analysis\n');
outputChannel.appendLine(result.rootCause);
outputChannel.appendLine('\n## Fix Guidelines\n');
result.fixGuidelines.forEach((step, i) => {
  outputChannel.appendLine(`${i + 1}. ${step}`);
});

if (result.learningNotes) {
  outputChannel.appendLine('\n## Learning Notes\n');
  result.learningNotes.forEach(note => {
    outputChannel.appendLine(note + '\n');
  });
}

// Option 2: Asynchronous (fast initial response)
const quickResult = await agent.analyze(error, 'async');

// Show RCA immediately
showResult(quickResult);

// Show placeholder for educational content
outputChannel.appendLine('\n## Learning Notes\n');
outputChannel.appendLine('⏳ Educational content is being generated...\n');

// Fetch completed notes later (non-blocking)
setTimeout(async () => {
  const notes = await agent.getPendingLearningNotes(error);
  if (notes) {
    outputChannel.clear();
    showResult(quickResult); // Re-show RCA
    outputChannel.appendLine('\n## Learning Notes\n');
    notes.forEach(note => outputChannel.appendLine(note + '\n'));
  }
}, 100); // Check after 100ms (notes generate in background)
```

### Testing

Test coverage: 24 tests across 8 categories

```typescript
// Example test
it('should generate learning notes in sync mode', async () => {
  const result = await agent.analyze(error, 'sync');
  
  expect(result.learningNotes).toHaveLength(3);
  expect(result.learningNotes![0]).toContain('🎓 **What is this error?**');
  expect(result.learningNotes![1]).toContain('🔍 **Why did this happen?**');
  expect(result.learningNotes![2]).toContain('🛡️ **How to prevent this:**');
  
  // Verify content quality
  expect(result.learningNotes![0].toLowerCase()).toContain('lateinit');
  expect(result.learningNotes![2]).toMatch(/\d+\./); // Numbered tips
});
```



## AgentStateStream API (Phase 5.1)

### Overview
EventEmitter class for streaming real-time agent state updates to VS Code extension UI. Emits 6 event types during analysis.

### Events

#### 1. `iteration` Event
```typescript
interface IterationEvent {
  iteration: number;        // Current iteration (1-based)
  maxIterations: number;    // Maximum iterations allowed
  progress: number;         // Progress (0-1) as decimal
  timestamp: number;        // Unix timestamp (ms)
}

// Example
stream.on('iteration', (event: IterationEvent) => {
  console.log(`Iteration ${event.iteration}/${event.maxIterations}: ${(event.progress * 100).toFixed(0)}%`);
});
```

#### 2. `thought` Event
```typescript
interface ThoughtEvent {
  thought: string;          // Hypothesis generated by agent
  iteration: number;        // Current iteration
  timestamp: number;        // Unix timestamp (ms)
}

// Example
stream.on('thought', (event: ThoughtEvent) => {
  console.log(`💭 Thought: ${event.thought}`);
});
```

#### 3. `action` Event
```typescript
interface ActionEvent {
  action: ToolCall;         // Tool to execute (see ToolCall schema)
  iteration: number;        // Current iteration
  timestamp: number;        // Unix timestamp (ms)
}

interface ToolCall {
  tool: string;             // Tool name (e.g., 'read_file')
  parameters: Record<string, any>; // Tool parameters
  timestamp: number;        // When tool was called
}

// Example
stream.on('action', (event: ActionEvent) => {
  console.log(`🔧 Action: ${event.action.tool}`);
});
```

#### 4. `observation` Event
```typescript
interface ObservationEvent {
  observation: string;      // Tool result or error message
  iteration: number;        // Current iteration
  success: boolean;         // Whether tool executed successfully
  timestamp: number;        // Unix timestamp (ms)
}

// Example
stream.on('observation', (event: ObservationEvent) => {
  console.log(`${event.success ? '✓' : '✗'} Result: ${event.observation}`);
});
```

#### 5. `complete` Event
```typescript
interface CompleteEvent {
  rca: RCAResult;           // Final root cause analysis (see RCAResult schema)
  totalIterations: number;  // How many iterations were performed
  duration: number;         // Total analysis time in milliseconds
  timestamp: number;        // Unix timestamp (ms)
}

// Example
stream.on('complete', (event: CompleteEvent) => {
  console.log(`✅ Complete in ${event.duration}ms after ${event.totalIterations} iterations`);
  console.log(`Root Cause: ${event.rca.rootCause}`);
});
```

#### 6. `error` Event
```typescript
interface ErrorEvent {
  error: Error;             // Error object
  iteration: number;        // Which iteration failed
  phase: 'thought' | 'action' | 'observation' | 'synthesis'; // Where error occurred
  timestamp: number;        // Unix timestamp (ms)
}

// Example
stream.on('error', (event: ErrorEvent) => {
  console.error(`❌ Error in ${event.phase} at iteration ${event.iteration}: ${event.error.message}`);
});
```

### Methods

#### `emitIteration(iteration: number, maxIterations: number): void`
Emit iteration progress event.

```typescript
// Called at start of each iteration loop
this.stream.emitIteration(3, 10); // Iteration 3 of 10 (30%)
```

#### `emitThought(thought: string, iteration: number): void`
Emit thought generation event.

```typescript
// Called after LLM generates hypothesis
this.stream.emitThought('This error is likely caused by uninitialized lateinit property', 1);
```

#### `emitAction(action: ToolCall, iteration: number): void`
Emit tool execution start event.

```typescript
// Called before tool execution
this.stream.emitAction({
  tool: 'read_file',
  parameters: { filePath: 'MainActivity.kt', line: 45 },
  timestamp: Date.now()
}, 2);
```

#### `emitObservation(observation: string, iteration: number, success: boolean): void`
Emit tool result event.

```typescript
// Called after tool execution
this.stream.emitObservation('Lines 20-70 of MainActivity.kt:\n...', 2, true);
```

#### `emitComplete(rca: RCAResult, totalIterations: number): void`
Emit analysis completion event with duration calculation.

```typescript
// Called when analysis concludes successfully
this.stream.emitComplete({
  error: 'lateinit property user has not been initialized',
  rootCause: 'Property accessed before initialization',
  fixGuidelines: ['Initialize in onCreate()'],
  confidence: 0.9
}, 5);
```

#### `emitError(error: Error, iteration: number, phase: string): void`
Emit error event with context.

```typescript
// Called in catch blocks
this.stream.emitError(
  new AnalysisTimeoutError('Analysis timed out'),
  3,
  'synthesis'
);
```

#### `getElapsedTime(): number`
Get milliseconds since analysis started.

```typescript
const elapsed = stream.getElapsedTime(); // e.g., 2500 (2.5 seconds)
```

#### `reset(): void`
Reset stream state (clears startTime).

```typescript
stream.reset(); // Prepare for next analysis
```

#### `dispose(): void`
Remove all listeners and reset state.

```typescript
agent.dispose(); // Clean up when done
```

### Usage Example

```typescript
import { MinimalReactAgent } from './agent/MinimalReactAgent';
import { OllamaClient } from './llm/OllamaClient';

const ollama = await OllamaClient.create();
const agent = new MinimalReactAgent(ollama);
const stream = agent.getStream();

// Subscribe to all events
stream.on('iteration', (e) => progressBar.update(e.progress));
stream.on('thought', (e) => console.log(`💭 ${e.thought}`));
stream.on('action', (e) => console.log(`🔧 ${e.action.tool}`));
stream.on('observation', (e) => console.log(`${e.success ? '✓' : '✗'} ${e.observation}`));
stream.on('complete', (e) => console.log(`✅ Done in ${e.duration}ms`));
stream.on('error', (e) => console.error(`❌ ${e.error.message}`));

// Run analysis
const rca = await agent.analyze(error);

// Clean up
agent.dispose();
```

---

## DocumentSynthesizer API (Phase 5.1)

### Overview
Generates beautifully formatted markdown RCA reports with proper structure, code highlighting, and VS Code-compatible file links.

### Methods

#### `synthesize(rca: RCAResult, error: ParsedError): string`
Generate full markdown report.

**Input:**
```typescript
interface RCAResult {
  error: string;              // Original error message
  rootCause: string;          // What caused the error
  fixGuidelines: string[];    // Step-by-step fix instructions
  confidence: number;         // 0-1 confidence score
  iterations?: number;        // How many iterations were performed
  toolsUsed?: string[];       // Which tools were executed
}

interface ParsedError {
  type: string;               // Error type (e.g., 'lateinit', 'npe')
  message: string;            // Full error message
  filePath: string;           // File where error occurred
  line: number;               // Line number
  language: string;           // Language (e.g., 'kotlin')
  metadata?: Record<string, any>; // Additional context
}
```

**Output:**
```markdown
# 🔧 Root Cause Analysis: Lateinit

## 📋 Summary
**Error Type:** Lateinit
**Location:** [MainActivity.kt:45](MainActivity.kt#L45)
**Language:** KOTLIN
**Confidence:** █████████░ 90% (High)

**Error Message:**
```
lateinit property user has not been initialized
```

## 🔍 Root Cause
The lateinit property 'user' is declared but never initialized before being accessed.

## 🛠️ Fix Guidelines
1. Initialize 'user' in onCreate() or class initialization block
2. Or check if user is initialized with ::user.isInitialized before accessing

## 📝 Analysis Metadata
**PropertyName:** user
**ClassName:** MainActivity
```

**7 Report Sections:**
1. **Header:** Error type icon, title
2. **Summary:** Type, location, language, confidence bar
3. **Root Cause:** Clear explanation
4. **Fix Guidelines:** Numbered steps
5. **Code Context:** Syntax-highlighted code (if available)
6. **Tool Usage:** List of tools executed (if any)
7. **Metadata:** Additional context (property names, class names, etc.)

#### `generateQuickSummary(rca: RCAResult, error: ParsedError): string`
Generate one-line summary for notifications.

**Input:** Same as `synthesize()`

**Output:**
```
"✅ Lateinit error in MainActivity.kt:45 - Initialize in onCreate() (90% confidence)"
```

### Usage Example

```typescript
import { DocumentSynthesizer } from './agent/DocumentSynthesizer';

const synthesizer = new DocumentSynthesizer();

// Generate full report
const markdown = synthesizer.synthesize(rca, error);
console.log(markdown); // Displays formatted markdown

// Generate quick summary
const summary = synthesizer.generateQuickSummary(rca, error);
console.log(summary); // "✅ Lateinit error in MainActivity.kt:45..."
```

### Confidence Visualization

| Confidence | Bar | Label |
|------------|-----|-------|
| 0.0 - 0.4  | `████░░░░░░ 30%` | Low |
| 0.4 - 0.7  | `█████░░░░░ 50%` | Medium |
| 0.7 - 1.0  | `█████████░ 90%` | High |
| 1.0        | `██████████ 100%` | Perfect |

### VS Code File Links

File links use markdown format that VS Code auto-detects:
- `[MainActivity.kt](MainActivity.kt)` - Opens file
- `[MainActivity.kt:45](MainActivity.kt#L45)` - Opens file at line 45

--- Parser APIs

| API Name | Phase | Purpose | Status |
|----------|-------|---------|--------|
| `ErrorParser` | 2.1 | Multi-language error router | ✅ Implemented |
| `KotlinParser` | 2.1 | Kotlin error parsing (6 types) | ✅ Implemented |
| `GradleParser` | 2.1 | Gradle build error parsing (5 types) | ✅ Implemented |
| `JetpackComposeParser` | 4.1 | Compose error parsing (10 types) | ✅ Implemented |
| `LanguageDetector` | 2.1 | Automatic language detection | ✅ Implemented |

## Tool Registry

| Tool Name | Phase | Purpose | Status |
|-----------|-------|---------|--------|
| `read_file` | 1.4 | Read workspace file contents | ✅ Implemented |
| `web_search_wiki` | 1.3 | Search external documentation | ⏳ Planned |
| `get_code_context` | 1.6 | Extract code around error location | ⏳ Planned |
| `find_callers_of_function` | 2.2 | LSP call hierarchy | ✅ Implemented |
| `vector_search_db` | 3.1 | Query past RCA solutions | ✅ Implemented |
| `get_user_error_context` | 2.3 | Capture error logs from user | ⏳ Planned |
| `android_build_tool` | 4.3 | Gradle build error analysis | ✅ Implemented |

---

## Database API: `ChromaDBClient`

### Description
Vector database client for storing and retrieving Root Cause Analysis (RCA) documents with semantic similarity search.

### Initialization
```typescript
const client = await ChromaDBClient.create();
```

### Methods

#### `addRCA(rca: Omit<RCADocument, 'id' | 'created_at' | 'updated_at'>): Promise<string>`
Store a new RCA document with automatic embedding generation.

**Input:**
```typescript
{
  error_message: string;           // Required: Original error text
  error_type: string;              // Required: lateinit, npe, etc.
  language: string;                // Required: kotlin, java, xml, gradle
  root_cause: string;              // Required: Analysis result
  fix_guidelines: string[];        // Required: Step-by-step fixes
  confidence: number;              // Required: 0.0-1.0
  file_path: string;               // Required: Error location
  line_number: number;             // Required: Error line
  code_context?: string;           // Optional: Surrounding code
  stack_trace?: string;            // Optional: Full stack trace
  tool_calls_made: string[];       // Required: Tools used
  iterations: number;              // Required: Analysis iterations
  user_validated: boolean;         // Required: User feedback
  validation_feedback?: string;    // Optional: User notes
  quality_score: number;           // Required: Computed quality
}
```

**Output:**
```typescript
string  // UUID of created document
```

#### `getById(id: string): Promise<RCADocument | null>`
Retrieve specific RCA document by ID.

#### `searchSimilar(errorMessage: string, filters?: RCASearchFilters): Promise<RCADocument[]>`
Find similar past RCAs using vector similarity search.

**Filters:**
```typescript
{
  language?: string;          // Exact match
  error_type?: string;        // Exact match
  min_confidence?: number;    // >= comparison
  min_quality_score?: number; // >= comparison
  limit?: number;             // Default: 5
}
```

#### `update(id: string, updates: Partial<RCADocument>): Promise<boolean>`
Update existing RCA document (partial or full).

#### `delete(id: string): Promise<boolean>`
Remove RCA document by ID.

#### `clear(): Promise<number>`
Remove all documents (returns count deleted). **Dangerous operation!**

#### `getStats(): Promise<CollectionStats>`
Get collection statistics.

**Output:**
```typescript
{
  count: number;                    // Total documents
  metadata: Record<string, any>;    // Collection metadata
}
```

#### `checkHealth(): Promise<boolean>`
Validate ChromaDB connection health.

### Example Usage

**Store RCA:**
```typescript
const rcaId = await client.addRCA({
  error_message: 'lateinit property user has not been initialized',
  error_type: 'lateinit',
  language: 'kotlin',
  root_cause: 'Property accessed before initialization in onCreate',
  fix_guidelines: ['Initialize user in onCreate()', 'Add null check'],
  confidence: 0.9,
  file_path: 'MainActivity.kt',
  line_number: 45,
  tool_calls_made: ['read_file'],
  iterations: 3,
  user_validated: false,
  quality_score: 0.63
});
console.log('Stored RCA:', rcaId);
```

**Search Similar:**
```typescript
const similar = await client.searchSimilar(
  'lateinit property user has not been initialized',
  {
    language: 'kotlin',
    error_type: 'lateinit',
    min_confidence: 0.7,
    limit: 3
  }
);

for (const rca of similar) {
  console.log(`Found: ${rca.root_cause} (confidence: ${rca.confidence})`);
}
```

**Update RCA:**
```typescript
const updated = await client.update(rcaId, {
  user_validated: true,
  confidence: 0.95,
  quality_score: 0.85
});
```

### Error Responses
```typescript
class ChromaDBError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly context?: Record<string, any>
  );
}
```

**Common Errors:**
- `ChromaDB health check failed: Connection refused` - Server not running
- `Collection 'rca_solutions' not found` - Initialization failed
- `Invalid RCA document: [field] is required` - Validation error
- `Document with id [id] not found` - Document doesn't exist

---

## Tool API: `read_file`

### Description
Read the complete contents of a file in the workspace, optionally specifying line range.

### Input Parameters (Zod Schema)
```typescript
z.object({
  filePath: z.string()
    .describe('Relative path from workspace root (e.g., "src/utils/helper.ts")'),
  lineStart: z.number().int().positive().optional()
    .describe('Starting line number (1-indexed, inclusive)'),
  lineEnd: z.number().int().positive().optional()
    .describe('Ending line number (1-indexed, inclusive)'),
  encoding: z.enum(['utf-8', 'utf-16', 'ascii']).default('utf-8')
    .describe('File encoding'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    filePath: string;
    content: string;
    lineCount: number;
    encoding: string;
    fileSize: number;  // bytes
  };
  error?: {
    code: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'BINARY_FILE' | 'TOO_LARGE';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "read_file",
  "parameters": {
    "filePath": "src/api/user.ts",
    "lineStart": 40,
    "lineEnd": 55
  }
}
```

**Tool Response (Success):**
```json
{
  "success": true,
  "data": {
    "filePath": "src/api/user.ts",
    "content": "export async function fetchUserData(userId: string) {\n  const response = await fetch(`/api/users/${userId}`);\n  const data = await response.json();\n  return data.users.map(u => u.name);\n}",
    "lineCount": 5,
    "encoding": "utf-8",
    "fileSize": 156
  }
}
```

**Tool Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File 'src/api/user.ts' does not exist in workspace"
  }
}
```

---

## 2. `web_search_wiki`

### Description
Search external documentation (Stack Overflow, GitHub issues, official docs) for error solutions.

### Input Parameters (Zod Schema)
```typescript
z.object({
  query: z.string().min(3).max(200)
    .describe('Search query (error message, function name, or concept)'),
  sources: z.array(z.enum(['stackoverflow', 'github', 'docs', 'mdn']))
    .default(['stackoverflow', 'github'])
    .describe('Which sources to search'),
  maxResults: z.number().int().min(1).max(10).default(5)
    .describe('Maximum number of results to return'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    query: string;
    results: Array<{
      title: string;
      url: string;
      snippet: string;  // 200 char excerpt
      source: 'stackoverflow' | 'github' | 'docs' | 'mdn';
      relevanceScore: number;  // 0.0-1.0
    }>;
    totalFound: number;
  };
  error?: {
    code: 'RATE_LIMIT_EXCEEDED' | 'API_ERROR' | 'NO_RESULTS';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "web_search_wiki",
  "parameters": {
    "query": "TypeError Cannot read property map of undefined",
    "sources": ["stackoverflow"],
    "maxResults": 3
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "query": "TypeError Cannot read property map of undefined",
    "results": [
      {
        "title": "How to handle undefined when using .map()?",
        "url": "https://stackoverflow.com/questions/12345",
        "snippet": "The error occurs when the variable is undefined. Use optional chaining: data?.map(...)",
        "source": "stackoverflow",
        "relevanceScore": 0.92
      }
    ],
    "totalFound": 3
  }
}
```

---

## 3. `get_code_context`

### Description
Extract code surrounding an error location, including function definitions and relevant imports.

### Input Parameters (Zod Schema)
```typescript
z.object({
  filePath: z.string()
    .describe('File containing the error'),
  line: z.number().int().positive()
    .describe('Error line number (1-indexed)'),
  contextLines: z.number().int().min(5).max(100).default(50)
    .describe('Number of lines to include (before and after error)'),
  includeFunctionDef: z.boolean().default(true)
    .describe('Whether to include the full function containing the error'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    filePath: string;
    errorLine: number;
    context: {
      before: string;  // Code before error line
      errorLine: string;  // The actual error line
      after: string;  // Code after error line
    };
    functionDefinition?: {
      name: string;
      startLine: number;
      endLine: number;
      signature: string;
    };
    relevantImports: Array<{
      module: string;
      imported: string[];
      line: number;
    }>;
  };
  error?: {
    code: 'FILE_NOT_FOUND' | 'LINE_OUT_OF_RANGE';
    message: string;
  };
}
```

---

## 4. `find_callers_of_function`

### Description
Use VS Code LSP to find all functions/methods that call the specified function. Useful for tracing error propagation.

### Input Parameters (Zod Schema)
```typescript
z.object({
  functionName: z.string()
    .describe('Name of the function to find callers for'),
  filePath: z.string()
    .describe('File where function is defined'),
  maxDepth: z.number().int().min(1).max(5).default(2)
    .describe('Maximum call chain depth to traverse'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    functionName: string;
    filePath: string;
    callers: Array<{
      callerName: string;
      filePath: string;
      line: number;
      callChain: string[];  // ['main', 'processData', 'fetchData']
      depth: number;
    }>;
    totalCallers: number;
  };
  error?: {
    code: 'FUNCTION_NOT_FOUND' | 'LSP_UNAVAILABLE' | 'TIMEOUT';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "find_callers_of_function",
  "parameters": {
    "functionName": "fetchUserData",
    "filePath": "src/api/user.ts",
    "maxDepth": 2
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "functionName": "fetchUserData",
    "filePath": "src/api/user.ts",
    "callers": [
      {
        "callerName": "UserProfile.loadData",
        "filePath": "src/components/UserProfile.tsx",
        "line": 23,
        "callChain": ["UserProfile.render", "UserProfile.loadData", "fetchUserData"],
        "depth": 2
      },
      {
        "callerName": "Dashboard.init",
        "filePath": "src/views/Dashboard.tsx",
        "line": 45,
        "callChain": ["Dashboard.init", "fetchUserData"],
        "depth": 1
      }
    ],
    "totalCallers": 2
  }
}
```

---

## 5. `vector_search_db`

### Description
Query ChromaDB for past RCA solutions similar to the current error.

### Input Parameters (Zod Schema)
```typescript
z.object({
  query: z.string()
    .describe('Error description or stack trace to search for'),
  language: z.string().optional()
    .describe('Filter by programming language (e.g., "typescript", "python")'),
  errorType: z.string().optional()
    .describe('Filter by error type (e.g., "TypeError", "NullPointerException")'),
  minConfidence: z.number().min(0).max(1).default(0.7)
    .describe('Minimum confidence score for results'),
  limit: z.number().int().min(1).max(10).default(5)
    .describe('Maximum number of results'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    query: string;
    results: Array<{
      id: string;
      errorDescription: string;
      rootCause: string;
      solution: string;
      language: string;
      errorType: string;
      confidence: number;  // 0.0-1.0
      userValidated: boolean;
      similarity: number;  // Cosine similarity to query
      metadata: {
        createdAt: string;
        fixedIn: string;  // File path
      };
    }>;
    totalFound: number;
  };
  error?: {
    code: 'DB_CONNECTION_FAILED' | 'EMBEDDING_FAILED' | 'NO_RESULTS';
    message: string;
  };
}
```

### Example Usage

**LLM Request:**
```json
{
  "tool": "vector_search_db",
  "parameters": {
    "query": "Cannot read property 'map' of undefined in React component",
    "language": "typescript",
    "errorType": "TypeError",
    "minConfidence": 0.75,
    "limit": 3
  }
}
```

**Tool Response:**
```json
{
  "success": true,
  "data": {
    "query": "Cannot read property 'map' of undefined in React component",
    "results": [
      {
        "id": "rca-001",
        "errorDescription": "TypeError: Cannot read property 'map' of undefined when rendering user list",
        "rootCause": "API response returns null when no users found, but component assumes array",
        "solution": "Add null check before mapping: users?.map(...) ?? []",
        "language": "typescript",
        "errorType": "TypeError",
        "confidence": 0.89,
        "userValidated": true,
        "similarity": 0.94,
        "metadata": {
          "createdAt": "2025-12-01T10:30:00Z",
          "fixedIn": "src/components/UserList.tsx"
        }
      }
    ],
    "totalFound": 3
  }
}
```

---

## 6. `get_user_error_context`

### Description
Capture error context from user's active editor: selected text, cursor position, diagnostic messages, terminal output.

### Input Parameters (Zod Schema)
```typescript
z.object({
  captureSelection: z.boolean().default(true)
    .describe('Include currently selected text'),
  captureDiagnostics: z.boolean().default(true)
    .describe('Include VS Code error/warning diagnostics'),
  captureTerminal: z.boolean().default(false)
    .describe('Include recent terminal output (last 50 lines)'),
})
```

### Output Format
```typescript
{
  success: boolean;
  data?: {
    activeFile: string;
    cursorPosition: { line: number; character: number };
    selectedText?: string;
    diagnostics: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
      line: number;
      column: number;
      source: string;  // 'typescript', 'eslint', etc.
    }>;
    terminalOutput?: string;
  };
  error?: {
    code: 'NO_ACTIVE_EDITOR' | 'NO_DIAGNOSTICS';
    message: string;
  };
}
```

---

## Error Code Reference

### Common Error Codes (All Tools)
- `INVALID_PARAMETERS` - Input validation failed (Zod schema violation)
- `TOOL_TIMEOUT` - Tool execution exceeded 2s limit
- `INTERNAL_ERROR` - Unexpected exception in tool implementation

### File Access Errors
- `FILE_NOT_FOUND` - File path doesn't exist in workspace
- `PERMISSION_DENIED` - File access restricted
- `BINARY_FILE` - Attempted to read non-text file
- `TOO_LARGE` - File exceeds 10MB limit

### API Errors
- `RATE_LIMIT_EXCEEDED` - External API rate limit hit
- `API_ERROR` - External service returned error
- `NO_RESULTS` - Query returned zero results

### LSP Errors
- `FUNCTION_NOT_FOUND` - Symbol not found in file
- `LSP_UNAVAILABLE` - Language server not running
- `TIMEOUT` - LSP request exceeded timeout

### Database Errors
- `DB_CONNECTION_FAILED` - Cannot connect to ChromaDB
- `EMBEDDING_FAILED` - Error generating embedding vector
- `COLLECTION_NOT_FOUND` - ChromaDB collection doesn't exist

---

## Validation Rules

### Runtime Validation (Zod)
All tool parameters MUST be validated using Zod before execution:

```typescript
// src/tools/ToolBase.ts
export abstract class ToolBase implements ToolDefinition {
  async execute(rawParams: unknown): Promise<ToolResult> {
    // 1. Validate parameters
    const parseResult = this.parameters.safeParse(rawParams);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: parseResult.error.message,
        },
      };
    }
    
    // 2. Execute tool logic
    return this.executeInternal(parseResult.data);
  }
  
  protected abstract executeInternal(params: z.infer<this['parameters']>): Promise<ToolResult>;
}
```

### Contract Testing
Each tool must have a contract test verifying schema compliance:

```typescript
// tests/unit/tools/ReadFileTool.test.ts
describe('ReadFileTool Contract', () => {
  test('validates input parameters', async () => {
    const invalidInput = { filePath: 123 };  // Wrong type
    const result = await ReadFileTool.execute(invalidInput);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_PARAMETERS');
  });
  
  test('returns correct output structure', async () => {
    const result = await ReadFileTool.execute({ filePath: 'test.ts' });
    expect(result).toHaveProperty('success');
    if (result.success) {
      expect(result.data).toHaveProperty('filePath');
      expect(result.data).toHaveProperty('content');
      expect(result.data).toHaveProperty('lineCount');
    }
  });
});
```

---

## Schema Evolution

### Adding New Parameters (Non-Breaking)
- New parameters MUST be optional or have defaults
- Update this document with new parameter
- Add example usage
- Increment tool version in comments

### Modifying Existing Parameters (Breaking)
- Document in `DEVLOG.md` under "Architecture Decisions"
- Update all example prompts
- Add migration guide if affects stored data

### Deprecating Parameters
- Mark as deprecated in Zod schema: `.describe('[DEPRECATED] ...')`
- Maintain backward compatibility for 2 versions
- Remove after 2 releases

---

## Agent API: `FeedbackHandler`

### Description
Processes user validation feedback (thumbs up/down) to update RCA confidence scores and invalidate cache for unhelpful results.

### Initialization
```typescript
const handler = new FeedbackHandler(chromaDBClient, rcaCache, {
  positiveMultiplier: 1.2,     // Optional: +20% boost
  negativeMultiplier: 0.5,     // Optional: -50% reduction
  maxConfidence: 1.0,          // Optional: Upper bound
  minConfidence: 0.1,          // Optional: Lower bound
  enableCacheInvalidation: true, // Optional: Invalidate on negative
  enableLogging: true          // Optional: Console logging
});
```

### Methods

#### `handlePositive(rcaId: string, errorHash?: string): Promise<FeedbackResult>`
Process positive feedback (thumbs up).

**Input:**
```typescript
{
  rcaId: string;          // Required: RCA document ID
  errorHash?: string;     // Optional: Error hash (reserved for future use)
}
```

**Output:**
```typescript
{
  rcaId: string;
  feedbackType: 'positive';
  previousConfidence: number;
  newConfidence: number;
  qualityScore: number;
  cacheInvalidated: false;
  timestamp: number;
}
```

#### `handleNegative(rcaId: string, errorHash?: string): Promise<FeedbackResult>`
Process negative feedback (thumbs down).

**Input:**
```typescript
{
  rcaId: string;          // Required: RCA document ID
  errorHash?: string;     // Optional: Error hash for cache invalidation
}
```

**Output:**
```typescript
{
  rcaId: string;
  feedbackType: 'negative';
  previousConfidence: number;
  newConfidence: number;
  qualityScore: number;
  cacheInvalidated: boolean;  // True if errorHash provided
  timestamp: number;
}
```

#### `getStats(): FeedbackStats`
Get feedback statistics.

**Output:**
```typescript
{
  totalPositive: number;
  totalNegative: number;
  successRate: number;              // % positive / total
  averagePositiveBoost: number;     // Average confidence increase
  averageNegativeReduction: number; // Average confidence decrease
}
```

---

## Database API: `QualityManager`

### Description
Manages RCA document quality through automatic pruning of low-quality and expired documents.

### Initialization
```typescript
const manager = new QualityManager(chromaDBClient, {
  minQualityThreshold: 0.3,  // Optional: Prune below this
  maxAgeMs: 15552000000,     // Optional: 6 months in ms
  enableAutoPrune: false,    // Optional: Auto-prune timer
  autoPruneInterval: 86400000, // Optional: 24 hours
  enableLogging: true        // Optional: Console logging
});
```

### Methods

#### `pruneLowQuality(): Promise<PruneResult>`
Remove documents with quality score below threshold.

**Output:**
```typescript
{
  removedLowQuality: number;
  removedExpired: number;
  totalRemoved: number;
  totalScanned: number;
  retained: number;
  durationMs: number;
  timestamp: number;
}
```

#### `pruneExpired(): Promise<PruneResult>`
Remove documents older than max age.

#### `pruneAll(): Promise<PruneResult>`
Remove both low-quality and expired documents.

#### `getQualityMetrics(): Promise<QualityMetrics>`
Get quality statistics for all documents.

**Output:**
```typescript
{
  totalDocuments: number;
  highQualityCount: number;
  lowQualityCount: number;
  validatedCount: number;
  oldDocumentsCount: number;
  averageQuality: number;
  medianQuality: number;
  qualityDistribution: {
    excellent: number;  // >= 0.8
    good: number;       // 0.6-0.79
    fair: number;       // 0.4-0.59
    poor: number;       // < 0.4
  }
}
```

#### `evaluateDocument(doc: RCADocument): DocumentEvaluation`
Evaluate a single document's quality status.

**Output:**
```typescript
{
  id: string;
  quality: number;
  ageMs: number;
  isBelowThreshold: boolean;
  isExpired: boolean;
  isNearingExpiration: boolean;
  recommendation: 'keep' | 'prune' | 'flag';
}
```

---

## LLM System Prompt Integration

Tools are presented to LLM in system prompt as:

```markdown
AVAILABLE TOOLS:
{
  "read_file": {
    "description": "Read contents of a file in the workspace",
    "parameters": {
      "filePath": "string (required) - Relative path from workspace root",
      "lineStart": "number (optional) - Starting line (1-indexed)",
      "lineEnd": "number (optional) - Ending line (1-indexed)"
    }
  },
  "web_search_wiki": { ... },
  ...
}

USAGE FORMAT:
{
  "tool": "tool_name",
  "parameters": { ... }
}
```

Auto-generated from this document via `scripts/generate-tool-docs.ts`.

---

## Parser API: `JetpackComposeParser`

### Description
Parser for Jetpack Compose-specific errors. Handles 10 error types related to Compose's declarative UI paradigm.

### Initialization
```typescript
import { JetpackComposeParser } from './parsers/JetpackComposeParser';
const parser = new JetpackComposeParser();
```

### Methods

#### `parse(errorText: string): ParsedError | null`
Parse a Compose error text and extract structured information.

**Input:**
```typescript
errorText: string  // Full error text including stack trace
```

**Output:**
```typescript
{
  type: ComposeErrorType;          // One of 10 error types
  message: string;                 // Normalized error message
  filePath: string;                // Source file path (.kt)
  line: number;                    // Line number (0 if unknown)
  language: 'kotlin';              // Always 'kotlin'
  framework: 'compose';            // Always 'compose'
  metadata?: {
    composableName?: string;       // Affected composable
    keyValue?: string;             // LaunchedEffect key
    recompositionCount?: number;   // For recomposition errors
    localName?: string;            // CompositionLocal name
  }
}
```

#### `static isComposeError(text: string): boolean`
Quick check if error text is Compose-related.

### Supported Error Types

| Type ID | Description | Pattern Example |
|---------|-------------|-----------------|
| `compose_remember` | State read without remember | "reading a state...without calling remember" |
| `compose_derived_state` | derivedStateOf misuse | "derivedStateOf.*recalculating" |
| `compose_recomposition` | Excessive recomposition | "Recomposing X times" (>10) |
| `compose_launched_effect` | LaunchedEffect key issues | "LaunchedEffect.*key" |
| `compose_disposable_effect` | DisposableEffect cleanup | "DisposableEffect.*dispose" |
| `compose_composition_local` | Missing CompositionLocal | "CompositionLocal.*not provided" |
| `compose_modifier` | Modifier chain issues | "Modifier.*incompatible" |
| `compose_side_effect` | Generic side effects | "SideEffect.*composition" |
| `compose_state_read` | State during composition | "State.*read during composition" |
| `compose_snapshot` | Snapshot mutation | "Snapshot.*mutation" |

### Example Usage

```typescript
const parser = new JetpackComposeParser();

// Quick check
if (JetpackComposeParser.isComposeError(errorText)) {
  const result = parser.parse(errorText);
  if (result) {
    console.log(result.type);      // 'compose_remember'
    console.log(result.framework); // 'compose'
    console.log(result.metadata);  // { composableName: 'UserProfile' }
  }
}

// Via ErrorParser (automatic routing)
const errorParser = new ErrorParser();
const result = errorParser.parse(errorText);
// Automatically routes to JetpackComposeParser if Compose error
```

---

## Tool API: `AndroidBuildTool`

### Description
Comprehensive Gradle build error analyzer with version resolution recommendations, dependency conflict analysis, and repository diagnostics. Wraps GradleParser with advanced features.

### Initialization
```typescript
const tool = new AndroidBuildTool();
```

### Methods

#### `parseBuildError(buildOutput: string): ParsedError | null`
Parse Gradle build output and identify errors.

**Input:**
```typescript
string  // Raw Gradle build output
```

**Output:**
```typescript
ParsedError | null  // Parsed error or null if not Gradle-related
```

**Example:**
```typescript
const error = tool.parseBuildError(`
  FAILURE: Build failed with an exception.
  
  * What went wrong:
  Could not resolve com.google.android.material:material:1.9.0
`);

// error?.type === 'dependency_resolution_error'
// error?.metadata.dependency === 'com.google.android.material:material:1.9.0'
```

#### `recommendResolution(error: ParsedError): VersionResolution | null`
Recommend version resolution strategy for dependency conflicts.

**Input:**
```typescript
ParsedError  // Must be dependency_conflict or dependency_resolution_error
```

**Output:**
```typescript
interface VersionResolution {
  recommended: string;           // Recommended version
  reason: string;                // Explanation for choice
  implementation: {
    groovy: string;              // Groovy DSL code
    kotlin: string;              // Kotlin DSL code
  };
}
```

**Example:**
```typescript
const resolution = tool.recommendResolution(error);

console.log(resolution?.recommended);  // "1.12.0"
console.log(resolution?.reason);       // "Selected highest version..."
console.log(resolution?.implementation.groovy);
// Output:
// // Option 1: Force specific version (Groovy DSL)
// configurations.all {
//     resolutionStrategy {
//         force 'androidx.core:core-ktx:1.12.0'
//     }
// }
// ...
```

#### `analyzeDependencyConflict(error: ParsedError): DependencyAnalysis | null`
Detailed analysis of dependency conflicts.

**Input:**
```typescript
ParsedError  // Must be dependency_conflict type
```

**Output:**
```typescript
interface DependencyAnalysis {
  module: string;                  // Module identifier
  requestedVersions: string[];     // All conflicting versions
  conflicts: string[];             // Conflict source descriptions
  recommendation: VersionResolution;
}
```

**Example:**
```typescript
const analysis = tool.analyzeDependencyConflict(error);

console.log(analysis?.module);  // "com.google.guava:guava"
console.log(analysis?.requestedVersions);  // ["28.0-android", "30.1-android"]
console.log(analysis?.recommendation.recommended);  // "30.1-android"
```

#### `diagnoseRepositoryIssues(error: ParsedError): string | null`
Diagnose and suggest repository configuration fixes.

**Input:**
```typescript
ParsedError  // Must be dependency_resolution_error type
```

**Output:**
```typescript
string | null  // Diagnostic message with configuration suggestions
```

**Example:**
```typescript
const diagnosis = tool.diagnoseRepositoryIssues(error);

console.log(diagnosis);
// Output:
// 📦 Android/AndroidX library detected
// ✅ Ensure Google Maven repository is configured:
//    repositories { google() }
```

#### `static isBuildError(text: string): boolean`
Quick check if error text is Gradle-related.

**Input:**
```typescript
string  // Error text
```

**Output:**
```typescript
boolean  // true if Gradle error detected
```

**Example:**
```typescript
if (AndroidBuildTool.isBuildError(errorText)) {
  const error = tool.parseBuildError(errorText);
  // Process Gradle error...
}
```

### Error Types Handled
- `dependency_resolution_error` - Cannot resolve dependency
- `dependency_conflict` - Version conflict between dependencies
- `task_failure` - Gradle task execution failure
- `build_script_syntax_error` - Syntax error in build.gradle
- `compilation_error` - Compilation failure reported by Gradle

### Features
1. **Semantic Versioning**: Correctly compares versions (1.10.0 > 1.9.99)
2. **Version Prefixes**: Handles v, V prefixes (v1.2.3, V2.0.0)
3. **Dual DSL**: Generates both Groovy and Kotlin code
4. **Repository Detection**: Smart detection based on group ID
5. **Three Resolution Strategies**: Force, explicit dependency, exclude transitive

---

**Last Updated:** December 20, 2024 (Week 13 - Chunks 5.3-5.4 Complete)  
**Next Update:** After implementing Chunk 5.5 (Documentation)
