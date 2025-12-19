# Agent API Reference

> **Module:** `src/agent/`  
> **Purpose:** Root Cause Analysis agents with ReAct (Reasoning + Acting) pattern  
> **Last Updated:** December 20, 2025 (Chunk 5.5)

---

## Overview

The Agent module provides AI-powered error analysis using the ReAct paradigm. Agents reason about errors through iterative thought-action-observation loops, leveraging tools to gather context and LLM capabilities to synthesize root causes and fix guidelines.

**Key Components:**
- `MinimalReactAgent` - Core analysis engine with tool execution
- `EducationalAgent` - Learning-focused variant with beginner explanations
- `AgentStateStream` - Real-time progress streaming for UI
- `PromptEngine` - Structured prompt generation with few-shot examples
- `DocumentSynthesizer` - Markdown report generation
- `FeedbackHandler` - User validation and quality improvement

---

## MinimalReactAgent

**File:** `src/agent/MinimalReactAgent.ts`  
**Purpose:** Core ReAct agent with dynamic tool execution and prompt engineering

### Class Definition

```typescript
class MinimalReactAgent {
  constructor(llm: OllamaClient, config?: AgentConfig)
  
  analyze(error: ParsedError): Promise<RCAResult>
  getStream(): AgentStateStream
  cancel(): void
}
```

### Constructor

```typescript
constructor(llm: OllamaClient, config?: AgentConfig)
```

**Parameters:**
- `llm: OllamaClient` - LLM client for inference (required)
- `config?: AgentConfig` - Optional configuration
  - `maxIterations?: number` - Max reasoning iterations (default: 10)
  - `timeout?: number` - Analysis timeout in ms (default: 90000)
  - `usePromptEngine?: boolean` - Enable PromptEngine (default: true)
  - `useToolRegistry?: boolean` - Enable ToolRegistry (default: true)

**Example:**
```typescript
const llm = await OllamaClient.create();
const agent = new MinimalReactAgent(llm, {
  maxIterations: 8,
  timeout: 60000
});
```

### analyze()

Performs root cause analysis on a parsed error.

```typescript
async analyze(error: ParsedError): Promise<RCAResult>
```

**Parameters:**
- `error: ParsedError` - Parsed error object with type, message, file, line, language

**Returns:** `Promise<RCAResult>`
- `error: string` - Original error message
- `rootCause: string` - Identified root cause explanation
- `fixGuidelines: string[]` - Step-by-step fix instructions
- `confidence: number` - Confidence score (0.0-1.0)
- `iterations: number` - Number of reasoning iterations performed
- `toolsUsed: string[]` - Tools executed during analysis

**Throws:**
- `AnalysisTimeoutError` - If analysis exceeds timeout
- `LLMError` - If LLM inference fails
- `ValidationError` - If error object is invalid

**Example:**
```typescript
const parsedError: ParsedError = {
  type: 'lateinit',
  message: 'lateinit property user has not been initialized',
  filePath: 'MainActivity.kt',
  line: 45,
  language: 'kotlin'
};

const result = await agent.analyze(parsedError);

console.log('Root Cause:', result.rootCause);
console.log('Fix Guidelines:', result.fixGuidelines);
console.log('Confidence:', result.confidence);
console.log('Iterations:', result.iterations);
```

**Workflow:**
1. **Initialization** - Read file context at error location
2. **Iteration Loop** (up to `maxIterations`):
   - **Thought:** Generate hypothesis using PromptEngine
   - **Action:** Select and execute tool via ToolRegistry
   - **Observation:** Process tool results
   - **Decision:** Continue iterating or conclude analysis
3. **Synthesis** - Generate final RCA with confidence score
4. **Streaming** - Emit progress events via AgentStateStream

### getStream()

Returns the event stream for real-time progress updates.

```typescript
getStream(): AgentStateStream
```

**Returns:** `AgentStateStream` - Event emitter for agent state updates

**Events:**
- `iteration` - Iteration progress (number, max, percentage)
- `thought` - Generated hypothesis
- `action` - Tool execution started
- `observation` - Tool result or error
- `complete` - Analysis finished
- `error` - Analysis failed

**Example:**
```typescript
const stream = agent.getStream();

stream.on('iteration', ({ iteration, maxIterations, progress }) => {
  console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
});

stream.on('thought', ({ thought }) => {
  console.log('Agent thinking:', thought);
});

stream.on('complete', ({ rca, duration }) => {
  console.log('Analysis complete in', duration, 'ms');
});

stream.on('error', ({ error, phase }) => {
  console.error('Analysis failed at', phase, ':', error);
});
```

### cancel()

Cancels ongoing analysis.

```typescript
cancel(): void
```

**Example:**
```typescript
// Start analysis
const analysisPromise = agent.analyze(error);

// User cancels after 5 seconds
setTimeout(() => {
  agent.cancel();
  console.log('Analysis cancelled by user');
}, 5000);

try {
  await analysisPromise;
} catch (error) {
  console.log('Cancelled:', error.message);
}
```

---

## EducationalAgent

**File:** `src/agent/EducationalAgent.ts`  
**Purpose:** Extends MinimalReactAgent with learning-focused explanations

### Class Definition

```typescript
class EducationalAgent extends MinimalReactAgent {
  constructor(llm: OllamaClient, config?: AgentConfig)
  
  analyze(error: ParsedError, mode?: EducationalMode): Promise<EducationalRCAResult>
}
```

### Constructor

Same as `MinimalReactAgent` constructor (inherits configuration).

### analyze()

Performs analysis with educational content generation.

```typescript
async analyze(
  error: ParsedError,
  mode: EducationalMode = 'sync'
): Promise<EducationalRCAResult>
```

**Parameters:**
- `error: ParsedError` - Parsed error object
- `mode: EducationalMode` - Generation mode
  - `'sync'` - Generate learning notes during analysis (slower, complete)
  - `'async'` - Generate learning notes after analysis (faster initial result)

**Returns:** `Promise<EducationalRCAResult>` (extends `RCAResult`)
- All fields from `RCAResult`
- `learningNotes?: string[]` - Educational explanations

**Example:**
```typescript
const eduAgent = new EducationalAgent(llm);

// Sync mode - complete learning notes immediately
const result = await eduAgent.analyze(error, 'sync');

console.log('Root Cause:', result.rootCause);
console.log('\nLearning Notes:');
result.learningNotes?.forEach((note, i) => {
  console.log(`\n${i + 1}. ${note}`);
});

// Async mode - faster initial result, learning notes generated in background
const fastResult = await eduAgent.analyze(error, 'async');
console.log('Root Cause:', fastResult.rootCause); // Available immediately

// Learning notes available after a few seconds
await new Promise(resolve => setTimeout(resolve, 5000));
// Check database or cache for updated learning notes
```

**Learning Note Structure:**
Each learning note contains:
1. **Error Type Explanation** - "What is this error?" in plain English
2. **Root Cause Clarification** - "Why did this happen?" with analogies
3. **Prevention Tips** - "How to avoid this?" with specific, actionable advice

**Example Output:**
```markdown
### Learning Notes:

1. 🎓 **What is a lateinit error?**
   A `lateinit` property is like a box you promise to fill before opening. 
   If you try to open it (access the property) before putting something in 
   (initialization), Kotlin throws this error to prevent crashes.

2. 🔍 **Why did this happen?**
   The property 'user' was declared lateinit at line 12 but never initialized 
   before being accessed at line 45. This commonly happens when:
   - Initialization is in onCreate() but access is in onResume()
   - Initialization depends on async operation that hasn't completed
   - Copy-paste code missing initialization step

3. 🛡️ **How to prevent this:**
   - Initialize lateinit properties in onCreate() or init {} block
   - Use ::property.isInitialized to check before accessing
   - Consider nullable type (var user: User?) if initialization timing is uncertain
```

---

## AgentStateStream

**File:** `src/agent/AgentStateStream.ts`  
**Purpose:** Real-time event streaming for agent progress

### Class Definition

```typescript
class AgentStateStream extends EventEmitter {
  on(event: string, listener: (...args: any[]) => void): this
  
  emitIteration(iteration: number, maxIterations: number): void
  emitThought(thought: string): void
  emitAction(action: ToolCall): void
  emitObservation(observation: string): void
  emitComplete(rca: RCAResult): void
  emitError(error: Error, phase: string, iteration?: number): void
}
```

### Event Types

#### iteration

Emitted at the start of each reasoning iteration.

**Data:**
```typescript
{
  iteration: number;       // Current iteration (1-based)
  maxIterations: number;   // Maximum iterations configured
  progress: number;        // Progress percentage (0.0-1.0)
  elapsed: number;         // Elapsed time in ms
}
```

**Example:**
```typescript
stream.on('iteration', ({ iteration, maxIterations, progress }) => {
  const percent = (progress * 100).toFixed(1);
  console.log(`[${iteration}/${maxIterations}] ${percent}% complete`);
});
```

#### thought

Emitted when agent generates a hypothesis.

**Data:**
```typescript
{
  thought: string;      // Generated hypothesis text
  timestamp: number;    // Unix timestamp
}
```

#### action

Emitted when agent executes a tool.

**Data:**
```typescript
{
  action: ToolCall;     // Tool call details (tool name, parameters)
  timestamp: number;
}
```

#### observation

Emitted when tool execution completes.

**Data:**
```typescript
{
  observation: string;  // Tool result or error message
  timestamp: number;
}
```

#### complete

Emitted when analysis finishes successfully.

**Data:**
```typescript
{
  rca: RCAResult;       // Final analysis result
  duration: number;     // Total analysis time in ms
  iterations: number;   // Iterations performed
  timestamp: number;
}
```

#### error

Emitted when analysis fails.

**Data:**
```typescript
{
  error: Error;         // Error object
  phase: string;        // Phase where error occurred
  iteration?: number;   // Iteration number if applicable
  timestamp: number;
}
```

---

## PromptEngine

**File:** `src/agent/PromptEngine.ts`  
**Purpose:** Structured prompt generation with few-shot examples

### Class Definition

```typescript
class PromptEngine {
  getSystemPrompt(): string
  getFewShotExamples(errorType: string): string
  buildIterationPrompt(context: IterationContext): string
  parseResponse(response: string): ParsedResponse
}
```

### getSystemPrompt()

Returns the base system prompt with agent guidelines.

```typescript
getSystemPrompt(): string
```

**Returns:** System prompt string with:
- Agent role and capabilities
- Analysis workflow steps
- Output format requirements
- Tool usage guidelines

### getFewShotExamples()

Returns example analyses for the given error type.

```typescript
getFewShotExamples(errorType: string): string
```

**Parameters:**
- `errorType: string` - Error type (e.g., 'lateinit', 'npe', 'type_mismatch')

**Returns:** Formatted examples showing:
- Error message
- Reasoning process
- Tool execution
- Final RCA structure

**Supported Error Types:**
- `lateinit` - Uninitialized lateinit property
- `npe` - NullPointerException
- `unresolved_reference` - Symbol not found
- `type_mismatch` - Type incompatibility
- `gradle_dependency_conflict` - Gradle version conflict
- `compose_remember` - Compose state management

### buildIterationPrompt()

Builds a prompt for a specific iteration with context.

```typescript
buildIterationPrompt(context: IterationContext): string
```

**Parameters:**
```typescript
interface IterationContext {
  systemPrompt: string;
  examples: string;
  error: ParsedError;
  previousThoughts: string[];
  previousActions: ToolCall[];
  previousObservations: string[];
}
```

**Returns:** Complete prompt string combining:
- System prompt
- Few-shot examples (first iteration only)
- Error details
- Previous iteration history
- Next action instructions

### parseResponse()

Extracts structured data from LLM response.

```typescript
parseResponse(response: string): ParsedResponse
```

**Parameters:**
- `response: string` - Raw LLM output

**Returns:**
```typescript
interface ParsedResponse {
  thought: string;
  action?: ToolCall | null;
  rootCause?: string;
  fixGuidelines?: string[];
  confidence?: number;
}
```

**Features:**
- Robust JSON extraction (handles extra text)
- Fallback parsing for malformed responses
- Validation of required fields

---

## DocumentSynthesizer

**File:** `src/agent/DocumentSynthesizer.ts`  
**Purpose:** Generate formatted markdown RCA reports

### Class Definition

```typescript
class DocumentSynthesizer {
  synthesize(rca: RCAResult, error: ParsedError): string
}
```

### synthesize()

Generates a complete markdown report from RCA result.

```typescript
synthesize(rca: RCAResult, error: ParsedError): string
```

**Parameters:**
- `rca: RCAResult` - Analysis result
- `error: ParsedError` - Original error details

**Returns:** Formatted markdown string with:
- Executive summary
- Error details section
- Root cause analysis
- Fix guidelines (numbered list)
- Code references (VS Code links)
- Metadata (confidence, iterations, tools)

**Example:**
```typescript
const synthesizer = new DocumentSynthesizer();
const markdown = synthesizer.synthesize(rca, error);

console.log(markdown);
// Outputs formatted markdown document
```

**Output Format:**
```markdown
# Root Cause Analysis

## Error
**Type:** lateinit  
**File:** [MainActivity.kt](MainActivity.kt#L45)  
**Line:** 45

```kotlin
lateinit property user has not been initialized
```

## Root Cause
The lateinit property 'user' is declared but never initialized before...

## Fix Guidelines
1. Initialize 'user' in onCreate() method
2. Or check initialization with ::user.isInitialized
3. Consider nullable type if initialization timing uncertain

## Metadata
- **Confidence:** 0.9
- **Iterations:** 3
- **Tools Used:** read_file, find_callers
```

---

## FeedbackHandler

**File:** `src/agent/FeedbackHandler.ts`  
**Purpose:** Process user feedback to improve analysis quality

### Class Definition

```typescript
class FeedbackHandler {
  constructor(db: ChromaDBClient, cache: RCACache)
  
  handlePositive(rcaId: string, errorHash: string): Promise<void>
  handleNegative(rcaId: string, errorHash: string): Promise<void>
}
```

### handlePositive()

Process positive feedback (thumbs up).

```typescript
async handlePositive(rcaId: string, errorHash: string): Promise<void>
```

**Parameters:**
- `rcaId: string` - RCA document ID in database
- `errorHash: string` - Error hash for cache invalidation

**Effects:**
- Increases RCA confidence by 20% (max 1.0)
- Updates quality score
- Marks as user-validated
- Persists to database

### handleNegative()

Process negative feedback (thumbs down).

```typescript
async handleNegative(rcaId: string, errorHash: string): Promise<void>
```

**Parameters:**
- `rcaId: string` - RCA document ID
- `errorHash: string` - Error hash

**Effects:**
- Decreases RCA confidence by 50% (min 0.1)
- Updates quality score
- Invalidates cache entry
- Persists to database

---

## Usage Examples

### Basic Analysis

```typescript
import { OllamaClient } from './llm/OllamaClient';
import { MinimalReactAgent } from './agent/MinimalReactAgent';
import { ErrorParser } from './utils/ErrorParser';

// Initialize
const llm = await OllamaClient.create();
const agent = new MinimalReactAgent(llm);
const parser = ErrorParser.getInstance();

// Parse error
const errorText = `
  kotlin.UninitializedPropertyAccessException: 
  lateinit property user has not been initialized
  at com.example.MainActivity.onCreate(MainActivity.kt:45)
`;

const parsed = parser.parse(errorText, 'kotlin');
if (!parsed) {
  console.error('Could not parse error');
  return;
}

// Analyze
const result = await agent.analyze(parsed);

// Display results
console.log('Root Cause:', result.rootCause);
console.log('Fix Guidelines:');
result.fixGuidelines.forEach((step, i) => {
  console.log(`  ${i + 1}. ${step}`);
});
console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
```

### Educational Mode

```typescript
import { EducationalAgent } from './agent/EducationalAgent';

const eduAgent = new EducationalAgent(llm);

// Analyze with learning notes
const result = await eduAgent.analyze(parsed, 'sync');

console.log('Root Cause:', result.rootCause);
console.log('\nLearning Notes:');
result.learningNotes?.forEach(note => {
  console.log('\n' + note);
});
```

### Real-Time Progress

```typescript
// Subscribe to events
const stream = agent.getStream();

stream.on('iteration', ({ iteration, maxIterations, progress }) => {
  console.log(`Iteration ${iteration}/${maxIterations} (${(progress * 100).toFixed(0)}%)`);
});

stream.on('thought', ({ thought }) => {
  console.log('💭', thought);
});

stream.on('action', ({ action }) => {
  console.log('🔧', action.tool);
});

stream.on('observation', ({ observation }) => {
  console.log('👁️', observation);
});

stream.on('complete', ({ rca, duration }) => {
  console.log(`✅ Complete in ${(duration / 1000).toFixed(1)}s`);
});

// Start analysis
const result = await agent.analyze(parsed);
```

### With Feedback Loop

```typescript
import { FeedbackHandler } from './agent/FeedbackHandler';
import { ChromaDBClient } from './db/ChromaDBClient';
import { RCACache } from './cache/RCACache';

const db = await ChromaDBClient.create();
const cache = new RCACache();
const feedback = new FeedbackHandler(db, cache);

// Perform analysis
const result = await agent.analyze(parsed);

// Store in database
const rcaId = await db.addRCA({
  error_message: result.error,
  error_type: parsed.type,
  language: parsed.language,
  root_cause: result.rootCause,
  fix_guidelines: result.fixGuidelines,
  confidence: result.confidence,
  user_validated: false,
  quality_score: result.confidence
});

// User provides feedback
const userLiked = true; // From UI

if (userLiked) {
  await feedback.handlePositive(rcaId, errorHash);
  console.log('Feedback recorded: helpful');
} else {
  await feedback.handleNegative(rcaId, errorHash);
  console.log('Feedback recorded: not helpful');
}
```

---

## Performance Considerations

### Analysis Latency

Typical performance (RTX 3070 Ti, 32GB RAM):
- **Standard mode:** 45-60s (p50), 65-80s (p90)
- **Fast mode:** 30-40s (p50), 50-60s (p90)
- **Educational mode:** 60-90s (p50), 90-120s (p90)

**Optimization Tips:**
- Use `maxIterations: 6` for faster analysis
- Disable PromptEngine for simple errors
- Enable caching for repeat errors
- Use async mode for educational content

### Memory Usage

- **Baseline:** ~50MB
- **During analysis:** ~200-300MB
- **With 10K cached RCAs:** ~500MB

### Token Usage

Per analysis (average):
- **Prompt tokens:** 2000-3000
- **Completion tokens:** 500-1000
- **Total:** 2500-4000 tokens
- **Cost (local):** $0.00 (Ollama)

---

## Error Handling

### Common Errors

**AnalysisTimeoutError**
```typescript
try {
  const result = await agent.analyze(error);
} catch (error) {
  if (error instanceof AnalysisTimeoutError) {
    console.error('Analysis timed out after', error.timeout, 'ms');
    console.log('Completed iterations:', error.iteration);
  }
}
```

**LLMError**
```typescript
try {
  const result = await agent.analyze(error);
} catch (error) {
  if (error instanceof LLMError) {
    console.error('LLM inference failed:', error.message);
    if (error.retryable) {
      console.log('Retrying...');
      const result = await agent.analyze(error);
    }
  }
}
```

**ValidationError**
```typescript
try {
  const result = await agent.analyze(invalidError);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid error object:', error.message);
  }
}
```

---

## Testing

### Unit Tests

```typescript
// tests/unit/MinimalReactAgent.test.ts
describe('MinimalReactAgent', () => {
  it('should analyze lateinit error', async () => {
    const result = await agent.analyze(latinitError);
    expect(result.rootCause).toContain('not been initialized');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

### Integration Tests

```typescript
// tests/integration/e2e.test.ts
describe('End-to-end analysis', () => {
  it('should complete full workflow', async () => {
    const parsed = parser.parse(errorText);
    const result = await agent.analyze(parsed);
    const markdown = synthesizer.synthesize(result, parsed);
    
    expect(markdown).toContain('# Root Cause Analysis');
    expect(result.iterations).toBeLessThanOrEqual(10);
  });
});
```

---

## See Also

- [Parser API](./Parsers.md) - Error parsing and language detection
- [Tool API](./Tools.md) - Available tools for agent execution
- [Database API](./Database.md) - ChromaDB and caching
- [Architecture Overview](../architecture/overview.md) - System design
