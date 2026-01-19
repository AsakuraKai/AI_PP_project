# RCA Error Processing Workflow Investigation

## Overview
This document provides a comprehensive analysis of how the RCA (Root Cause Analysis) Agent processes errors from initiation to completion.

---

## Architecture Components

### Core Components
1. **MinimalReactAgent** (`src/agent/MinimalReactAgent.ts`) - Main analysis engine
2. **AnalysisService** (`vscode-extension/src/services/AnalysisService.ts`) - Orchestration layer
3. **PromptEngine** (`src/agent/PromptEngine.ts`) - Prompt generation
4. **ToolRegistry** (`src/tools/ToolRegistry.ts`) - Tool management
5. **AgentStateStream** (`src/agent/AgentStateStream.ts`) - Real-time progress events
6. **ErrorParser** (`src/utils/ErrorParser.ts`) - Error parsing
7. **ErrorClassifier** (`src/agent/ErrorClassifier.ts`) - Error categorization
8. **OutputValidator** (`src/agent/OutputValidator.ts`) - Quality validation

---

## Complete Error Processing Flow

### Phase 1: Initialization & Validation (0-2 seconds)

```
User Triggers Analysis
        ↓
[AnalysisService.analyzeError()]
        ↓
1. Validate & normalize error data
   - Project scope detection
   - File path normalization
   - Error type classification
        ↓
2. Initialize backend components
   - OllamaClient (LLM)
   - MinimalReactAgent
   - ErrorParser
   - ChromaDBClient (optional)
   - RCACache
        ↓
3. Check Ollama connection
   - Health check with timeout (5s)
   - Fail fast if unavailable
        ↓
4. Parse error text
   - Use ErrorParser.parse()
   - Fallback: Construct from ErrorItem data
   - Convert to ParsedError structure
        ↓
5. Set up cancellation tokens
   - Internal cancellation token
   - Link to external token (if provided)
```

### Phase 2: Error Classification & Prompt Generation

```
[MinimalReactAgent.analyze()] starts
        ↓
1. Initialize AgentState
   {
     iteration: 0,
     maxIterations: 10,
     startTime: Date.now(),
     timeout: 90000ms,
     mode: 'standard',
     thoughts: [],
     actions: [],
     observations: [],
     hypothesis: null,
     rootCause: null,
     converged: false,
     error: ParsedError
   }
        ↓
2. Classify Error (ErrorClassifier)
   - Categorize error type
   - Determine confidence level
   - Emit classification event
        ↓
3. Generate System Prompt
   - Get template-based prompt (TemplateEngine)
   - Enhance with category-specific prompt
   - Select few-shot examples based on error type
```

### Phase 3: Progressive Prompting (Optional Fast-Path)

```
IF enableProgressivePrompting = true
        ↓
Try Level 1 (Simple One-Shot)
   - Build L1 prompt
   - Call LLM with generateWithRetry()
   - Parse response
   - Validate quality (OutputValidator)
        ↓
IF quality sufficient → Return result ✓
ELSE ↓
Try Level 2 (Enhanced One-Shot)
   - Build L2 prompt with more context
   - Call LLM with higher quality threshold (0.65)
   - Parse response
   - Validate quality
        ↓
IF quality sufficient → Return result ✓
ELSE ↓
Proceed to full ReAct loop →
```

### Phase 4: ReAct Iteration Loop (Core Analysis)

```
FOR i = 0 to maxIterations (default: 10)
        ↓
[ITERATION START]
   1. Check timeout (throw AnalysisTimeoutError if exceeded)
   2. Emit iteration event → UI progress update
        ↓
[THOUGHT GENERATION]
   IF usePromptEngine:
      - Build iteration prompt (PromptEngine)
      - Include previous thoughts/actions/observations
      - Call LLM.generateWithRetry()
        • temperature: 0.0 (progresses to 0.7)
        • maxTokens: 1500
        • maxAttempts: 4
        • qualityThreshold: 0.5
      - Parse response → { thought, action, rootCause?, fixGuidelines?, confidence? }
   ELSE:
      - Use legacy generateThoughtLegacy()
        ↓
   3. Store thought in state
   4. Emit thought event → UI update
        ↓
[ACTION EXECUTION]
   IF action specified (e.g., read_file, version_lookup):
      - Emit action event → UI update
      - Execute via ToolRegistry
      - Measure execution time (PerformanceTracker)
      - Store observation (tool result or error message)
      - Emit observation event → UI update
        ↓
[CONCLUSION CHECK]
   IF response contains rootCause AND fixGuidelines:
      ↓
      [LEGACY MODE CHECK]
      IF !usePromptEngine:
         - Return immediately (backward compatibility)
         - Skip validation
      ↓
      [QUALITY VALIDATION PHASE]
      1. Create preliminary result
      2. Validate with OutputValidator
         - Check specificity score
         - Validate required fields
         - Check for generic responses
      3. Calculate quality score
         ↓
      IF quality >= 60%:
         ↓
         [FIX GENERATION]
         IF generateFix enabled:
            - Call FixGenerator.generateFix()
            - Include code fix in result
         ↓
         - Emit complete event
         - Print performance metrics
         - Return RCAResult ✓
      ↓
      ELSE (quality < 60%):
         ↓
         [REGENERATION LOOP]
         FOR regenerationCount = 1 to maxRegenerations (2):
            - Build regeneration prompt with feedback
            - Call LLM with higher temperature
            - Parse regenerated response
            - Validate quality
            ↓
            IF quality sufficient:
               - Return result ✓
            ELSE:
               - Continue loop or force return if max reached
   ELSE:
      - Continue to next iteration
        ↓
END FOR LOOP
```

### Phase 5: Forced Conclusion (Max Iterations Reached)

```
IF maxIterations reached WITHOUT conclusion:
        ↓
[FORCED SYNTHESIS]
   1. Build final prompt with all context
   2. Call LLM.generateWithRetry()
      - temperature: 0.5
      - maxTokens: 1500
      - maxAttempts: 3
      - qualityThreshold: 0.45
   3. Parse forced response
   4. Validate quality
        ↓
   IF valid:
      - Generate code fix (if enabled)
      - Return result
   ELSE:
      - Attempt regeneration (up to 2 times)
      - Return best available result
```

### Phase 6: Result Processing & Persistence

```
[Back to AnalysisService]
        ↓
1. Receive RCAResult from agent
2. Compute error hash for caching
        ↓
3. IF ChromaDB available:
   - Calculate quality score
   - Store RCA document
   - Get RCA ID for feedback
        ↓
4. Update RCACache
   - Store result with TTL (24 hours)
   - Enable fast retrieval
        ↓
5. Cleanup
   - Clear cancellation token
   - Clear current analysis state
   - Send final progress update
        ↓
6. Return RCAResult to caller
```

---

## Event Stream Flow (Real-Time Progress)

The AgentStateStream emits events throughout the process:

```javascript
// Event Flow Timeline
onInitialization → 
onClassification → 
onIteration(1) → 
onThought("Analyzing error...") → 
onAction({ tool: "read_file", ... }) → 
onObservation("File content: ...") → 
onIteration(2) → 
onThought("Hypothesis refined...") → 
... → 
onComplete({ rca: RCAResult, totalIterations: N }) → 
END
```

### Event Types
1. **iteration** - Progress update (iteration N of M)
2. **thought** - Current hypothesis/reasoning
3. **action** - Tool being executed
4. **observation** - Tool result
5. **classification** - Error category determination
6. **complete** - Analysis finished successfully
7. **error** - Analysis failed

---

## Error Handling & Timeout Management

### Timeout Protection
```
Level 1: Network Timeout (NetworkTimeoutHandler)
   - Individual operation timeouts
   - Configurable per operation type
   - Default: 30s for analysis

Level 2: Analysis Timeout (MinimalReactAgent)
   - Overall analysis timeout: 90s
   - Checked at each iteration
   - Throws AnalysisTimeoutError

Level 3: Ollama Connection Timeout
   - Health check: 5s
   - LLM generation: 30s (default)
```

### Cancellation Flow
```
User clicks "Cancel"
        ↓
cancellationToken.cancel() triggered
        ↓
AnalysisService.stopAnalysis()
        ↓
cancelTokenSource.cancel()
        ↓
cancelPromise rejects
        ↓
Promise.race() aborts analysis
        ↓
Error: "Analysis cancelled"
        ↓
Cleanup & notify UI
```

### Error Recovery Strategies

1. **LLM Generation Failure**
   - Retry with exponential backoff (generateWithRetry)
   - Increase temperature on retries (0.0 → 0.3 → 0.5 → 0.7)
   - Max 4 attempts
   - Quality threshold validation after each attempt

2. **Tool Execution Failure**
   - Graceful degradation (continue without tool result)
   - Store error as observation
   - Continue iteration loop
   - Agent can work around missing data

3. **Parse Failure**
   - Fallback to legacy parser
   - Construct ParsedError from structured data
   - Mark as fallback in metadata

4. **ChromaDB Unavailable**
   - Continue without caching
   - Disable feedback features
   - Log warning but don't fail

---

## Quality Validation Process

### OutputValidator Checks
```javascript
validateResponse(response) {
   checks: [
      ✓ Has root cause explanation
      ✓ Has fix guidelines (non-empty array)
      ✓ Guidelines are actionable
      ✓ Confidence score present
      ✓ No generic/vague language
      ✓ Specific file references
      ✓ Version validation present
      ✓ Code examples included
      ✓ Actual names (not placeholders)
      ✓ Verification steps provided
      ✓ Compatibility checks mentioned
   ]
   
   Calculate specificityScore (0.0 - 1.0)
   
   IF score >= 0.6 → PASS
   ELSE → FAIL (trigger regeneration)
}
```

### Quality Thresholds
- **Progressive L1**: 0.65 (65%)
- **Progressive L2**: 0.65 (65%)
- **Iteration Result**: 0.60 (60%)
- **Forced Conclusion**: 0.45 (45%)
- **Regeneration**: 0.60 (60%)

---

## Performance Tracking

The PerformanceTracker monitors:
1. **total_analysis** - End-to-end time
2. **prompt_generation** - Initial prompt setup
3. **prompt_build** - Per-iteration prompt building
4. **llm_inference** - LLM generation time
5. **tool_execution** - Tool execution time
6. **output_regeneration** - Quality improvement attempts
7. **final_prompt_generation** - Forced conclusion
8. **final_llm_inference** - Final LLM call
9. **fix_generation** - Code fix generation

Metrics are printed to console after each analysis.

---

## Data Structures

### ParsedError
```typescript
{
  type: string,              // 'lateinit', 'null', 'compile', etc.
  message: string,           // Error message text
  filePath: string,          // Absolute file path
  line: number,             // Line number
  language: string,          // 'kotlin', 'java', etc.
  column?: number,          // Column number
  stackTrace?: StackFrame[], // Stack trace frames
  metadata?: {
    projectScope?: string,   // Detected scope
    scopeContext?: string,   // Scope-based prompt context
    fallback?: boolean       // True if constructed fallback
  }
}
```

### RCAResult
```typescript
{
  error: string,             // Original error message
  rootCause: string,         // Root cause explanation
  fixGuidelines: string[],   // Step-by-step fix instructions
  confidence: number,        // 0.0 - 1.0
  iterations: number,        // Total iterations performed
  toolsUsed: string[],       // Tools executed during analysis
  codeFix?: CodeFix,        // Generated code fix (optional)
  codeContext?: string      // Relevant code context
}
```

### AgentState
```typescript
{
  iteration: number,
  maxIterations: number,
  startTime: number,
  timeout: number,
  mode: 'standard' | 'progressive',
  thoughts: string[],
  actions: ToolCall[],
  observations: string[],
  hypothesis: string | null,
  rootCause: string | null,
  converged: boolean,
  error: ParsedError
}
```

---

## Configuration Options

### Agent Configuration
```typescript
{
  maxIterations: 10,          // Max ReAct iterations
  timeout: 90000,            // Analysis timeout (ms)
  usePromptEngine: true,     // Use PromptEngine vs legacy
  useToolRegistry: true,     // Enable tool execution
  generateFix: true,         // Generate code fixes
  projectRoot: string,       // Project root path
  enableProgressivePrompting: false, // Fast-path optimization
  enableCaching: true        // Use RCACache
}
```

### VS Code Settings
```json
{
  "rcaAgent.ollamaUrl": "http://localhost:11434",
  "rcaAgent.model": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest",
  "rcaAgent.chromaDbPath": "http://localhost:8000",
  "rcaAgent.maxIterations": 5,
  "rcaAgent.cacheTtl": 86400000,  // 24 hours
  "rcaAgent.maxCacheEntries": 1000,
  "rcaAgent.network.timeout": 30000,
  "rcaAgent.network.retryAttempts": 3,
  "rcaAgent.network.retryDelay": 1000
}
```

---

## Tool Registry

### Available Tools
1. **read_file** - Read file content around error line
2. **find_callers** - Find function callers (LSP)
3. **version_lookup** - Check version compatibility
   - Query types: exists, latest-stable, latest-any, compatible, suggest
   - Supports: AGP, Kotlin, Gradle

### Tool Execution Flow
```
Agent decides to use tool
        ↓
ToolRegistry.execute(toolName, params)
        ↓
1. Validate parameters against schema
2. Get tool instance
3. Execute tool.execute(params)
4. Measure execution time
5. Return { success: boolean, data?: any, error?: string }
```

---

## Prompt Engineering Strategy

### System Prompt Components
1. **Role Definition** - Expert Android/Kotlin debugger
2. **Workflow Instructions** - Thought → Action → Observation
3. **Specificity Rules** - File paths, line numbers, versions
4. **Output Format** - JSON structure requirements
5. **Category Enhancement** - Error-type specific guidance

### Few-Shot Examples
- Loaded from `src/knowledge/FewShotExampleService.ts`
- Categorized by error type
- Selected dynamically based on error classification
- Max 3 examples per prompt to avoid context overflow

### Template-Based Prompts (ITERATION 11)
- Structured templates per error category
- Reduces prompt verbosity
- Improves response consistency
- Categories: gradle, kotlin, dependency, runtime, etc.

---

## Caching Strategy

### RCACache (In-Memory)
- **Key**: SHA-256 hash of ParsedError
- **TTL**: 24 hours (configurable)
- **Max Entries**: 1000 (LRU eviction)
- **Benefits**: Instant results for identical errors

### ChromaDB (Persistent)
- Stores all RCA results
- Enables similarity search
- Supports feedback/learning
- Optional (graceful degradation)

### Cache Lookup Flow
```
New error arrives
        ↓
Compute error hash
        ↓
Check RCACache.get(hash)
        ↓
IF hit: Return cached result ✓
ELSE: 
   ↓
   Search ChromaDB for similar errors
        ↓
   IF similar found with high confidence:
      Return similar result ✓
   ELSE:
      Perform full analysis →
```

---

## Common Failure Modes & Diagnostics

### 1. Ollama Connection Failure
**Symptom**: "Ollama server unavailable"
**Cause**: Ollama not running or wrong URL
**Fix**: Start Ollama, check rcaAgent.ollamaUrl setting

### 2. Analysis Timeout
**Symptom**: "Analysis timed out"
**Cause**: LLM too slow, complex error, network issues
**Fix**: Increase timeout, check LLM performance, reduce maxIterations

### 3. Empty/Invalid Response
**Symptom**: Parse errors, missing fields
**Cause**: LLM output malformed, prompt issues
**Fix**: Regeneration loop handles this, check prompt templates

### 4. Tool Execution Failure
**Symptom**: Tools fail but analysis continues
**Cause**: File not found, LSP unavailable, network issues
**Fix**: Agent works around missing data, may reduce quality

### 5. Quality Too Low
**Symptom**: Generic/vague responses
**Cause**: Insufficient context, weak LLM, bad prompt
**Fix**: Regeneration loop attempts to improve, may need better examples

---

## Performance Characteristics

### Typical Analysis Times
- **Fast Path (L1 success)**: 1-3 seconds
- **Fast Path (L2 success)**: 3-6 seconds
- **Standard (2-3 iterations)**: 8-15 seconds
- **Complex (5-10 iterations)**: 20-60 seconds
- **Max timeout**: 90 seconds

### Resource Usage
- **Memory**: ~50-200MB during analysis
- **Network**: Moderate (LLM API calls)
- **CPU**: Low (mostly waiting for LLM)
- **Disk**: Minimal (ChromaDB writes)

---

## Extension Points & Customization

### Adding New Tools
```typescript
// 1. Implement tool class
class MyTool implements Tool {
  async execute(params: any): Promise<any> { ... }
}

// 2. Register in MinimalReactAgent.registerTools()
const tool = new MyTool();
const schema = z.object({ ... });
toolRegistry.register('my_tool', tool, schema, { examples: [...] });

// 3. Agent can now use tool in thoughts
```

### Custom Error Classifiers
```typescript
// Extend ErrorClassifier
class CustomClassifier extends ErrorClassifier {
  classify(error: ParsedError): Classification {
    // Custom logic
    return { category, confidence, reasoning };
  }
}
```

### Custom Validation Rules
```typescript
// Extend OutputValidator
class CustomValidator extends OutputValidator {
  validate(result: RCAResult, error: ParsedError): ValidationResult {
    // Custom validation logic
    return { valid, score, issues, strengths };
  }
}
```

---

## Testing & Debugging

### Enable Debug Logging
```typescript
// Set in VS Code Developer Tools Console
localStorage.setItem('DEBUG', 'rca:*');
```

### Monitor Agent State
- Check "RCA Agent State" tree view in VS Code
- Shows real-time iteration progress
- Displays thoughts, actions, observations

### Performance Profiling
- PerformanceTracker prints metrics to console
- Check "Output" → "RCA Agent" channel
- Analyze bottlenecks (LLM, tools, prompt generation)

### Unit Testing
- Test individual components in isolation
- Mock LLM responses for deterministic tests
- Test tool execution, parsing, validation separately

---

## Future Improvements

### Potential Optimizations
1. **Parallel Tool Execution** - Execute multiple tools concurrently
2. **Streaming LLM Responses** - Show partial results as they arrive
3. **Adaptive Iteration Limits** - Adjust based on error complexity
4. **Smart Caching** - Cache partial results, tool outputs
5. **Learning from Feedback** - Fine-tune prompts based on user feedback

### Planned Features
1. **Multi-File Analysis** - Handle errors spanning multiple files
2. **Project-Wide Context** - Use entire codebase for context
3. **Interactive Debugging** - Let user guide analysis
4. **Code Fix Verification** - Test generated fixes automatically
5. **Team Knowledge Sharing** - Share RCA results across team

---

## Summary

The RCA error processing workflow is a sophisticated multi-phase system that:

1. ✅ **Validates & normalizes** error data
2. ✅ **Classifies** errors for targeted analysis
3. ✅ **Generates optimized prompts** with few-shot examples
4. ✅ **Iteratively reasons** using ReAct paradigm
5. ✅ **Executes tools** to gather evidence
6. ✅ **Validates quality** and regenerates if needed
7. ✅ **Generates code fixes** automatically
8. ✅ **Caches results** for performance
9. ✅ **Handles failures** gracefully
10. ✅ **Streams progress** in real-time

The system balances **speed** (progressive prompting), **quality** (validation & regeneration), and **reliability** (timeouts, retries, fallbacks) to provide robust root cause analysis for Android/Kotlin errors.
