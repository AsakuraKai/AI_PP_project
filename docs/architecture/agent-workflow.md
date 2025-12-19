# Agent Workflow and Reasoning Process

> **Last Updated:** December 20, 2025 (Chunk 5.5)  
> **Component:** MinimalReactAgent, EducationalAgent  
> **Pattern:** ReAct (Reasoning + Acting)

---

## Table of Contents
- [ReAct Pattern Overview](#react-pattern-overview)
- [Analysis Lifecycle](#analysis-lifecycle)
- [Iteration Loop Details](#iteration-loop-details)
- [Tool Execution Pipeline](#tool-execution-pipeline)
- [Decision Making Process](#decision-making-process)
- [Educational Mode Workflow](#educational-mode-workflow)
- [Event Streaming Architecture](#event-streaming-architecture)
- [Error Recovery Strategies](#error-recovery-strategies)
- [Performance Optimization](#performance-optimization)

---

## ReAct Pattern Overview

### What is ReAct?

ReAct (Reasoning + Acting) is an agent paradigm that combines:
- **Reasoning:** LLM generates thoughts/hypotheses about the problem
- **Acting:** Agent executes tools to gather evidence
- **Observing:** Agent processes tool outputs
- **Iterating:** Repeat until confident conclusion

**Key Advantage:** Enables iterative refinement instead of single-shot prompting

### Core Loop

```
┌─────────────────────────────────────────┐
│         ReAct Iteration Loop            │
│                                         │
│  THOUGHT → ACTION → OBSERVATION →┐      │
│     ↑                             │      │
│     └─────────────────────────────┘      │
│   (Repeat until done or max iterations) │
└─────────────────────────────────────────┘
```

### Implementation

```typescript
// MinimalReactAgent.ts
export class MinimalReactAgent {
  async analyze(error: ParsedError): Promise<RCAResult> {
    // 1. Initialize context
    const fileContent = await this.readFileTool.execute(
      error.filePath,
      error.line
    );
    
    // 2. Iterate until conclusion
    for (let i = 0; i < this.maxIterations; i++) {
      // THOUGHT: Generate hypothesis
      const thought = await this.generateThought(state);
      state.thoughts.push(thought);
      
      // ACTION: Select and execute tool
      const action = this.selectAction(thought);
      if (action) {
        const observation = await this.executeTool(action);
        state.observations.push(observation);
      }
      
      // DECISION: Check if done
      if (this.isConclusive(state)) {
        break;
      }
    }
    
    // 3. Synthesize final result
    return this.synthesizeRCA(state);
  }
}
```

---

## Analysis Lifecycle

### Phase 1: Initialization (0-2 seconds)

```
┌────────────────────┐
│ 1. Parse Error     │  ErrorParser.parse(errorText)
└────────┬───────────┘  → Returns ParsedError or null
         │
         ▼
┌────────────────────┐
│ 2. Hash Error      │  ErrorHasher.hash(parsedError)
└────────┬───────────┘  → Returns SHA-256 hash
         │
         ▼
┌────────────────────┐
│ 3. Cache Lookup    │  RCACache.get(hash)
└────────┬───────────┘  → Returns cached RCA or null
         │
     Hit │   Miss
         │     │
         │     ▼
         │  ┌──────────────────┐
         │  │ 4. DB Search     │  ChromaDB.searchSimilar()
         │  └────────┬─────────┘  → Returns similar RCAs or []
         │           │
         │       Found│  Not Found
         │           │     │
         │           │     ▼
         │           │  ┌─────────────────┐
         │           │  │ 5. Read File    │  ReadFileTool.execute()
         │           │  │    Context      │  → Read ±25 lines
         │           │  └────────┬────────┘
         │           │           │
         │           │           ▼
         │           │  ┌─────────────────┐
         │           │  │ 6. Initialize   │  Create AgentState
         │           │  │    Agent State  │  → Set iteration = 0
         │           │  └────────┬────────┘
         │           │           │
         │           └───────────┘
         │                  │
         └──────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ 7. Start ReAct   │  Begin iteration loop
          │    Loop          │
          └──────────────────┘
```

**Key Outputs:**
- `AgentState` initialized with:
  - Error details
  - File content (50 lines)
  - Empty thoughts/actions/observations arrays
  - Iteration counter = 0

---

### Phase 2: Iterative Reasoning (30-80 seconds)

```
┌───────────────────────────────────────────────────────────┐
│              Iteration N (N = 1 to 10)                    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │ STEP 1: THOUGHT GENERATION                      │     │
│  │                                                  │     │
│  │  Input:                                          │     │
│  │   - Error details                                │     │
│  │   - File content                                 │     │
│  │   - Previous thoughts/actions/observations       │     │
│  │                                                  │     │
│  │  Process:                                        │     │
│  │   1. Build prompt with PromptEngine              │     │
│  │   2. Include few-shot examples (iteration 1)     │     │
│  │   3. Add context from prior iterations           │     │
│  │   4. Call LLM (Ollama)                           │     │
│  │   5. Extract thought from response               │     │
│  │                                                  │     │
│  │  Output:                                         │     │
│  │   - Hypothesis string                            │     │
│  │   - Added to state.thoughts[]                    │     │
│  │   - Emitted via AgentStateStream                 │     │
│  │                                                  │     │
│  │  Latency: 10-15s (GPU), 20-30s (CPU)            │     │
│  └─────────────────────────────────────────────────┘     │
│                         │                                 │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────┐     │
│  │ STEP 2: ACTION SELECTION                        │     │
│  │                                                  │     │
│  │  Input:                                          │     │
│  │   - Current thought                              │     │
│  │   - Agent state                                  │     │
│  │                                                  │     │
│  │  Process:                                        │     │
│  │   1. Parse thought for tool references           │     │
│  │   2. Extract tool name and parameters            │     │
│  │   3. Validate tool exists in registry            │     │
│  │   4. Prepare ToolCall object                     │     │
│  │                                                  │     │
│  │  Output:                                         │     │
│  │   - ToolCall object (or null if no action)       │     │
│  │   - Added to state.actions[]                     │     │
│  │   - Emitted via AgentStateStream                 │     │
│  │                                                  │     │
│  │  Latency: <1ms (parsing only)                    │     │
│  └─────────────────────────────────────────────────┘     │
│                         │                                 │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────┐     │
│  │ STEP 3: TOOL EXECUTION                          │     │
│  │                                                  │     │
│  │  Input:                                          │     │
│  │   - ToolCall object                              │     │
│  │                                                  │     │
│  │  Process:                                        │     │
│  │   1. ToolRegistry.execute(call)                  │     │
│  │   2. Validate parameters (Zod)                   │     │
│  │   3. Execute tool implementation                 │     │
│  │   4. Handle errors gracefully                    │     │
│  │   5. Format result as string                     │     │
│  │                                                  │     │
│  │  Output:                                         │     │
│  │   - Observation string                           │     │
│  │   - Added to state.observations[]                │     │
│  │   - Emitted via AgentStateStream                 │     │
│  │                                                  │     │
│  │  Latency:                                        │     │
│  │   - ReadFileTool: 2-5ms                          │     │
│  │   - LSPTool: 10-30ms                             │     │
│  │   - AndroidBuildTool: 50-100ms                   │     │
│  └─────────────────────────────────────────────────┘     │
│                         │                                 │
│                         ▼                                 │
│  ┌─────────────────────────────────────────────────┐     │
│  │ STEP 4: STATE UPDATE                            │     │
│  │                                                  │     │
│  │  Process:                                        │     │
│  │   1. Increment iteration counter                 │     │
│  │   2. Check timeout (90s)                         │     │
│  │   3. Emit iteration event                        │     │
│  │   4. Calculate progress (N / maxIterations)      │     │
│  │                                                  │     │
│  │  Decision Point:                                 │     │
│  │   - Continue if N < maxIterations                │     │
│  │   - Continue if not conclusive                   │     │
│  │   - Stop if timeout reached                      │     │
│  │   - Stop if agent decides to conclude            │     │
│  └─────────────────────────────────────────────────┘     │
│                         │                                 │
│                         │                                 │
└─────────────────────────┼─────────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼ Continue                    ▼ Done
    Next Iteration             Phase 3: Synthesis
```

**Typical Iteration Breakdown:**

| Iteration | Focus | Tools Used | Outcome |
|-----------|-------|------------|---------|
| 1 | Initial hypothesis | read_file | Identify probable cause |
| 2 | Gather evidence | find_callers, read_file | Validate hypothesis |
| 3 | Deep dive | search_docs, read_file | Understand context |
| 4-6 | Refinement | Various | Strengthen confidence |
| 7-10 | Edge cases | Additional context | Final validation |

**Early Termination:**
Agent may conclude early (before max iterations) if:
- Confidence ≥ 0.9
- Clear pattern match with known errors
- All relevant context gathered
- No additional tools would help

---

### Phase 3: Synthesis (5-10 seconds)

```
┌────────────────────────┐
│ 1. Build Final Prompt  │  PromptEngine.buildFinalPrompt()
│                        │  - Include all thoughts
│                        │  - Include all observations
│                        │  - Request structured JSON
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 2. Final LLM Call      │  OllamaClient.generate()
│                        │  - Longer prompt (all context)
│                        │  - Request confidence score
│                        │  - Request fix guidelines
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 3. Parse Response      │  PromptEngine.parseResponse()
│                        │  - Extract JSON
│                        │  - Validate structure (Zod)
│                        │  - Handle malformed output
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 4. Build RCAResult     │  Create final object
│                        │  - Root cause string
│                        │  - Fix guidelines array
│                        │  - Confidence score (0-1)
│                        │  - Metadata (iterations, tools)
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 5. Store in Database   │  ChromaDBClient.addRCA()
│                        │  - Generate embedding
│                        │  - Store with metadata
│                        │  - Update quality score
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 6. Cache Result        │  RCACache.set(hash, result)
│                        │  - TTL: 24 hours
│                        │  - In-memory storage
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 7. Emit Complete Event │  AgentStateStream.emitComplete()
│                        │  - Full RCA result
│                        │  - Performance metrics
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ 8. Return to Caller    │  Return RCAResult
└────────────────────────┘
```

**Output Structure:**
```typescript
{
  error: "lateinit property user has not been initialized",
  rootCause: "The lateinit property 'user' is declared at line 12 but never initialized before being accessed at line 45 in onCreate(). Lateinit properties must be explicitly initialized before first use.",
  fixGuidelines: [
    "Initialize 'user' in onCreate() before accessing it: `user = User()`",
    "Or check initialization status first: `if (::user.isInitialized) { ... }`",
    "Consider using nullable type `var user: User?` if initialization timing is uncertain"
  ],
  confidence: 0.92,
  iterations: 3,
  toolsUsed: ["read_file", "find_callers"],
  timestamp: 1703097234567,
  analysisTime: 42150 // ms
}
```

---

## Iteration Loop Details

### Iteration 1: Initial Hypothesis

**Objective:** Form initial understanding of error

**Prompt Structure:**
```
System: You are an expert Kotlin debugging assistant.

Few-Shot Examples:
[4 curated examples of similar errors]

Error Details:
Type: lateinit
Message: lateinit property user has not been initialized
File: MainActivity.kt
Line: 45
Language: kotlin

File Context:
Lines 20-70 of MainActivity.kt:
[50 lines of code]

Task: Generate an initial hypothesis about what caused this error.
Focus on WHAT went wrong, not just restating the error message.
```

**Expected Thought Example:**
> "The error indicates that the lateinit property 'user' was accessed before initialization. Looking at the code, 'user' is declared at line 12 as a lateinit var but I don't see any initialization in the visible context. The access at line 45 is in onCreate(), which suggests it might be initialized in another lifecycle method or never initialized at all."

**Tool Selection:** Typically none (initial hypothesis only)

---

### Iteration 2: Evidence Gathering

**Objective:** Test hypothesis with additional context

**Prompt Structure:**
```
Previous Thought:
[Iteration 1 thought]

Previous Observation:
[File content from Iteration 1]

Task: Based on your hypothesis, what additional information do you need?
Generate a thought and select a tool to gather evidence.

Available Tools:
- read_file: Read more code
- find_callers: Find where a function is called
- search_docs: Search Android documentation
```

**Expected Thought Example:**
> "I need to verify if 'user' is initialized anywhere in the class. Let me search for all assignments to 'user' in the file and check if there's an initialization in another lifecycle method like onStart() or if it's supposed to be initialized from an intent extra."

**Tool Selection:**
```json
{
  "tool": "read_file",
  "parameters": {
    "filePath": "MainActivity.kt",
    "line": 1,
    "entireFile": true
  }
}
```

---

### Iteration 3: Validation

**Objective:** Confirm root cause with high confidence

**Prompt Structure:**
```
Previous Thoughts:
[Iterations 1-2]

Previous Observations:
[All tool results]

Task: Review all evidence and validate your hypothesis.
Are you confident in the root cause? If yes, provide confidence score.
If not, gather more evidence.
```

**Expected Thought Example:**
> "After reviewing the entire file, I can confirm that 'user' is declared as lateinit at line 12 but is never initialized anywhere in the class. The property is accessed at line 45 in onCreate() to get user.name. This is a clear case of accessing a lateinit property before initialization. Confidence: 0.95"

**Decision:** Agent concludes analysis (high confidence)

---

### Iterations 4-10: Edge Cases

**Purpose:** Handle complex scenarios

**Scenarios:**
1. **Ambiguous errors:** Need more context from related files
2. **Framework-specific:** Need Android docs or Compose documentation
3. **Build errors:** Need Gradle configuration analysis
4. **Multiple possible causes:** Test each hypothesis

**Example (Build Error):**
```
Iteration 4:
Thought: "The dependency conflict might be caused by transitive dependencies. Need to check the full dependency tree."
Action: { tool: "android_build_tool", parameters: { task: "dependencies" } }
Observation: "[Dependency tree showing androidx.compose versions 1.3.0 and 1.4.0]"

Iteration 5:
Thought: "Confirmed: Multiple Compose versions are present. The conflict is between the explicit dependency in build.gradle (1.3.0) and a transitive dependency from another library (1.4.0). Recommend forcing version 1.4.0."
Action: null (conclude)
```

---

## Tool Execution Pipeline

### Tool Selection Algorithm

```typescript
selectTool(thought: string): ToolCall | null {
  // 1. Parse thought for tool keywords
  const keywords = {
    read_file: ['read', 'file', 'code', 'see', 'check line'],
    find_callers: ['callers', 'called by', 'who calls', 'usage'],
    search_docs: ['documentation', 'docs', 'API', 'what is'],
    android_build_tool: ['gradle', 'dependency', 'build', 'version'],
    manifest_tool: ['manifest', 'permission', 'activity']
  };
  
  // 2. Find matching tool
  for (const [tool, terms] of Object.entries(keywords)) {
    if (terms.some(term => thought.toLowerCase().includes(term))) {
      // 3. Extract parameters
      const params = this.extractParameters(thought, tool);
      
      // 4. Return tool call
      return { tool, parameters: params };
    }
  }
  
  return null; // No tool needed
}
```

### Parameter Extraction

```typescript
extractParameters(thought: string, tool: string): Record<string, any> {
  switch (tool) {
    case 'read_file':
      // Extract file path
      const fileMatch = thought.match(/file (?:at )?([^\s]+)/);
      const filePath = fileMatch?.[1] || this.currentError.filePath;
      
      // Extract line number
      const lineMatch = thought.match(/line (\d+)/);
      const line = lineMatch ? parseInt(lineMatch[1]) : this.currentError.line;
      
      return { filePath, line };
      
    case 'find_callers':
      // Extract function name
      const funcMatch = thought.match(/function (\w+)/);
      const functionName = funcMatch?.[1];
      
      return { functionName, filePath: this.currentError.filePath };
      
    // ... other tools
  }
}
```

### Tool Execution with Error Handling

```typescript
async executeTool(call: ToolCall): Promise<string> {
  const logger = Logger.getInstance();
  
  try {
    // 1. Validate parameters
    const validated = this.toolRegistry.validateParams(call.tool, call.parameters);
    
    // 2. Execute with timeout
    const result = await AsyncUtils.withTimeout(
      this.toolRegistry.execute(call.tool, validated),
      30000, // 30s timeout
      `Tool ${call.tool} timed out`
    );
    
    // 3. Format result
    return this.formatObservation(call.tool, result);
    
  } catch (error) {
    logger.error(`Tool execution failed: ${call.tool}`, error as Error);
    
    // 4. Return error as observation
    return `Tool ${call.tool} failed: ${error.message}. Continuing without this information.`;
  }
}
```

### Observation Formatting

```typescript
formatObservation(tool: string, result: any): string {
  switch (tool) {
    case 'read_file':
      return `File content (lines ${result.startLine}-${result.endLine}):\n\`\`\`kotlin\n${result.content}\n\`\`\``;
      
    case 'find_callers':
      const callers = result.callers.join(', ');
      return `Function is called by: ${callers || 'No callers found'}`;
      
    case 'search_docs':
      return `Documentation for ${result.query}:\n${result.snippet}`;
      
    default:
      return JSON.stringify(result, null, 2);
  }
}
```

---

## Decision Making Process

### Conclusion Criteria

Agent decides to conclude when:

1. **High Confidence** (primary)
   ```typescript
   if (this.currentConfidence >= 0.9) {
     return true; // Very confident in root cause
   }
   ```

2. **Pattern Match** (secondary)
   ```typescript
   const similar = await this.chromaDB.searchSimilar(error);
   if (similar.length > 0 && similar[0].quality_score > 0.8) {
     return true; // Known error pattern
   }
   ```

3. **Exhausted Tools** (fallback)
   ```typescript
   const usedTools = new Set(state.actions.map(a => a.tool));
   const availableTools = this.toolRegistry.listTools();
   
   if (usedTools.size === availableTools.length) {
     return true; // No more tools to try
   }
   ```

4. **Timeout** (forced)
   ```typescript
   if (Date.now() - startTime > this.timeout) {
     logger.warn('Analysis timeout, forcing conclusion');
     return true;
   }
   ```

### Confidence Calculation

```typescript
calculateConfidence(state: AgentState): number {
  let confidence = 0.5; // Base
  
  // +0.2 if clear error pattern
  if (this.hasKnownPattern(state.error)) {
    confidence += 0.2;
  }
  
  // +0.1 per successful tool execution (max +0.3)
  const successfulTools = state.observations.filter(o => !o.includes('failed')).length;
  confidence += Math.min(successfulTools * 0.1, 0.3);
  
  // +0.1 if similar RCA exists in DB
  if (state.metadata.similarRCAFound) {
    confidence += 0.1;
  }
  
  // -0.1 if many iterations needed
  if (state.iteration > 7) {
    confidence -= 0.1;
  }
  
  // -0.2 if any tool failures
  if (state.observations.some(o => o.includes('failed'))) {
    confidence -= 0.2;
  }
  
  return Math.max(0.1, Math.min(1.0, confidence));
}
```

---

## Educational Mode Workflow

### Async Learning Generation

```typescript
// EducationalAgent.ts
export class EducationalAgent extends MinimalReactAgent {
  async analyze(error: ParsedError, mode: 'sync' | 'async' = 'async'): Promise<RCAResult> {
    // 1. Perform standard analysis
    const rca = await super.analyze(error);
    
    // 2. Generate learning content
    if (mode === 'sync') {
      rca.learningNotes = await this.generateLearningNotes(rca);
    } else {
      // Async: Don't block return
      this.generateLearningNotesAsync(rca);
    }
    
    return rca;
  }
  
  private async generateLearningNotesAsync(rca: RCAResult): Promise<void> {
    setTimeout(async () => {
      try {
        const notes = await this.generateLearningNotes(rca);
        
        // Store notes separately
        await this.chromaDB.updateRCA(rca.id, { learningNotes: notes });
        
        // Emit event for UI update
        this.stream.emit('learning_notes_ready', { id: rca.id, notes });
      } catch (error) {
        logger.error('Failed to generate learning notes', error as Error);
      }
    }, 0);
  }
}
```

### Learning Note Structure

```typescript
interface LearningNotes {
  whatIsThis: string;      // Explain error type
  whyDidThis: string;      // Explain root cause
  howToPrevent: string[];  // Prevention tips
  relatedConcepts: string[]; // Related topics
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

**Example:**
```typescript
{
  whatIsThis: "A lateinit property is a way to defer initialization of a property until after object construction. Think of it like a promise: you're telling Kotlin 'I'll set this later, trust me.' But if you break that promise and access it before setting it, Kotlin throws this error.",
  
  whyDidThis: "In your code, you declared 'user' as lateinit but never initialized it before accessing it in onCreate(). It's like reaching into an empty box expecting to find something - the box exists but there's nothing inside yet.",
  
  howToPrevent: [
    "Always initialize lateinit properties before first use, typically in onCreate() or init{}",
    "Use ::propertyName.isInitialized to check if a lateinit property is ready",
    "Consider nullable types (var user: User?) if initialization timing is uncertain"
  ],
  
  relatedConcepts: [
    "Lateinit vs lazy delegation",
    "Property initialization in Kotlin",
    "Null safety in Kotlin"
  ],
  
  difficulty: 'beginner'
}
```

---

## Event Streaming Architecture

### Event Types

```typescript
type AgentEvent =
  | { type: 'iteration', iteration: number, maxIterations: number, progress: number }
  | { type: 'thought', thought: string, timestamp: number }
  | { type: 'action', action: ToolCall, timestamp: number }
  | { type: 'observation', observation: string, timestamp: number }
  | { type: 'complete', rca: RCAResult, timestamp: number }
  | { type: 'error', error: Error, timestamp: number };
```

### Stream Implementation

```typescript
// AgentStateStream.ts
export class AgentStateStream extends EventEmitter {
  emitIteration(iteration: number, maxIterations: number): void {
    this.emit('iteration', {
      type: 'iteration',
      iteration,
      maxIterations,
      progress: iteration / maxIterations,
      timestamp: Date.now()
    });
  }
  
  emitThought(thought: string): void {
    this.emit('thought', {
      type: 'thought',
      thought,
      timestamp: Date.now()
    });
  }
  
  // ... other event emitters
}
```

### Consumer Example (UI Integration)

```typescript
// Extension side (Sokchea's work)
const agent = new MinimalReactAgent(ollama);
const stream = agent.getStream();

stream.on('iteration', (event) => {
  webview.postMessage({
    command: 'progress',
    progress: event.progress,
    message: `Iteration ${event.iteration}/${event.maxIterations}`
  });
});

stream.on('thought', (event) => {
  webview.postMessage({
    command: 'thought',
    text: event.thought
  });
});

stream.on('complete', (event) => {
  webview.postMessage({
    command: 'complete',
    rca: event.rca
  });
});

const result = await agent.analyze(parsedError);
```

---

## Error Recovery Strategies

### LLM Timeout Recovery

```typescript
async generateThought(state: AgentState): Promise<string> {
  try {
    const prompt = this.promptEngine.buildIterationPrompt(state);
    
    const thought = await AsyncUtils.withTimeout(
      this.llm.generate(prompt),
      60000, // 60s timeout
      'LLM generation timed out'
    );
    
    return thought;
    
  } catch (error) {
    if (error instanceof TimeoutError) {
      logger.warn('LLM timeout, using fallback thought');
      
      // Generate simple fallback thought
      return `The error "${state.error.message}" occurred at ${state.error.filePath}:${state.error.line}. Need to investigate further.`;
    }
    
    throw error;
  }
}
```

### Tool Failure Recovery

```typescript
async executeTool(call: ToolCall): Promise<string> {
  try {
    return await this.toolRegistry.execute(call.tool, call.parameters);
  } catch (error) {
    logger.warn(`Tool ${call.tool} failed, continuing analysis`, { error });
    
    // Return error as observation (agent adapts)
    return `Tool execution failed: ${error.message}. Proceeding with available information.`;
  }
}
```

### Malformed LLM Output Recovery

```typescript
parseResponse(response: string): { thought?: string, rootCause?: string, confidence?: number } {
  try {
    // Try JSON parse first
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    // Fallback: Extract via regex
    const thoughtMatch = response.match(/thought['":\s]*(.+?)[\n"]/i);
    const causeMatch = response.match(/root[_\s]?cause['":\s]*(.+?)[\n"]/i);
    const confMatch = response.match(/confidence['":\s]*(\d*\.?\d+)/i);
    
    return {
      thought: thoughtMatch?.[1],
      rootCause: causeMatch?.[1],
      confidence: confMatch ? parseFloat(confMatch[1]) : 0.5
    };
    
  } catch (error) {
    logger.error('Failed to parse LLM response', error as Error);
    
    // Ultimate fallback: Use raw text
    return {
      thought: response,
      confidence: 0.3
    };
  }
}
```

---

## Performance Optimization

### Prompt Caching

```typescript
// Cache system prompt to avoid regeneration
private systemPromptCache: string | null = null;

getSystemPrompt(): string {
  if (!this.systemPromptCache) {
    this.systemPromptCache = this.buildSystemPrompt();
  }
  return this.systemPromptCache;
}
```

### Parallel Tool Execution

```typescript
// Execute independent tools in parallel
async executeTools(calls: ToolCall[]): Promise<string[]> {
  const results = await Promise.all(
    calls.map(call => this.executeTool(call))
  );
  
  return results;
}

// Usage
if (needsMultipleFiles) {
  const calls = [
    { tool: 'read_file', parameters: { filePath: 'MainActivity.kt' } },
    { tool: 'read_file', parameters: { filePath: 'ViewModel.kt' } },
  ];
  
  const [file1, file2] = await this.executeTools(calls);
}
```

### Context Window Management

```typescript
// Limit prompt size to avoid LLM slowdown
buildIterationPrompt(state: AgentState): string {
  const maxTokens = 4000; // Approximate
  
  let prompt = this.getSystemPrompt();
  
  // Add recent context only (last 3 iterations)
  const recentThoughts = state.thoughts.slice(-3).join('\n');
  const recentObs = state.observations.slice(-3).join('\n');
  
  prompt += `\n\nRecent Thoughts:\n${recentThoughts}`;
  prompt += `\n\nRecent Observations:\n${recentObs}`;
  
  // Trim if too long
  if (prompt.length > maxTokens * 4) {
    prompt = prompt.slice(-maxTokens * 4);
  }
  
  return prompt;
}
```

---

## Related Documentation

- [System Architecture Overview](./overview.md)
- [Agent API Reference](../api/Agent.md)
- [Tool API Reference](../api/Tools.md)
- [Performance Benchmarks](../performance/benchmarks.md)
