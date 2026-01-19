# Project Scope Integration Guide for RCA Backend

## Current Status

✅ **Frontend → Backend Path Working**:
- User toggles project scope button
- `projectScope` is sent to backend
- AnalysisService validates and injects into metadata
- Metadata reaches the agent

❌ **Backend Usage Not Implemented**:
- Agent receives scope but doesn't use it
- No differentiation in prompts or tool selection
- Scope context sits unused in metadata

## What Needs to Happen

When the button is toggled, the RCA agent should:
1. **Read the scope** from error metadata
2. **Adjust system prompt** with scope-specific instructions
3. **Filter tools** based on scope (no workspace tools for external errors)
4. **Change search strategy** (ChromaDB vs external docs)
5. **Frame solutions** differently (project-specific vs generic)

## Implementation Steps

### Step 1: Import the Scope Builder

In `src/agent/MinimalReactAgent.ts` (or the agent you're using):

```typescript
import {
  getErrorProjectScope,
  buildScopedSystemContext,
  enhanceSystemPromptWithScope,
  filterToolsByScope,
  getSearchStrategy,
  logScopeContext
} from './ScopeAwarePromptBuilder';
```

### Step 2: Log Scope at Analysis Start

In the `analyze()` method, add logging:

```typescript
async analyze(error: ParsedError): Promise<RCAResult> {
  // Log scope for debugging
  logScopeContext(error, 'MinimalReactAgent');
  
  // ... rest of method
}
```

### Step 3: Enhance System Prompt

Modify how you get the system prompt:

**Before**:
```typescript
const basePrompt = this.promptEngine.getSystemPrompt(error);
```

**After**:
```typescript
const basePrompt = this.promptEngine.getSystemPrompt(error);
const scopeEnhancedPrompt = enhanceSystemPromptWithScope(basePrompt, error);
```

Then use `scopeEnhancedPrompt` instead of `basePrompt`.

### Step 4: Filter Tools by Scope

When initializing available tools:

```typescript
const scope = getErrorProjectScope(error);
const availableTools = filterToolsByScope(this.tools, scope);
```

### Step 5: Use Search Strategy

If using ChromaDB or semantic search:

```typescript
const strategy = getSearchStrategy(scope);

if (strategy.useChromaDB && this.chromaDB) {
  // Search ChromaDB with adjusted threshold
  results = await this.chromaDB.search(query, {
    similarity_threshold: strategy.similarity_threshold
  });
}
```

## Complete Integration Example

Here's a minimal example of how to integrate into `MinimalReactAgent.analyze()`:

```typescript
async analyze(error: ParsedError): Promise<RCAResult> {
  const perf = new PerformanceTracker();
  const analysisStart = perf.startTimer('analysis');

  // NEW: Log scope at start
  logScopeContext(error);

  const scope = getErrorProjectScope(error);
  const strategy = getSearchStrategy(scope);
  
  console.log(`[Agent] Analyzing error with scope: ${scope}`);
  console.log(`[Agent] Search strategy: ${JSON.stringify(strategy)}`);

  try {
    // Initialize state
    let state: AgentState = {
      error,
      iteration: 0,
      thoughts: [],
      actions: [],
      observations: [],
      tools: filterToolsByScope(this.tools, scope) // NEW: Filter by scope
    };

    // Build initial prompt with scope context
    const systemPrompt = this.promptEngine.getSystemPrompt(error);
    const scopedPrompt = enhanceSystemPromptWithScope(systemPrompt, error); // NEW

    // ... rest of analysis using scopedPrompt and filtered tools
    
  } catch (error) {
    console.error('[Agent] Analysis failed:', error);
    throw error;
  } finally {
    analysisStart();
  }
}
```

## Testing the Integration

### Manual Test
1. Toggle project scope button in VS Code
2. Submit an error
3. Check console output:
   ```
   [useAnalysis] Starting manual analysis with data: {
     projectScope: 'outside'
   }
   [Agent] Error scope: "outside"
   [Agent] Analyzing error with scope: outside
   [Agent] Search strategy: {
     useChromaDB: false,
     useWorkspaceSearch: false,
     useExternalDocs: true,
     similarity_threshold: 0.6
   }
   ```

### Expected Behavior

**For Inside Workspace** (`scope === 'inside'`):
- Agent prompt includes: "Use workspace context, search files, look at actual code"
- All tools available (read_file, search_workspace, semantic_search, etc.)
- Higher similarity threshold (0.7) for semantic search
- Solutions reference exact file paths and line numbers

**For Outside Workspace** (`scope === 'outside'`):
- Agent prompt includes: "No workspace context available, focus on generic patterns"
- Workspace tools filtered out
- Only external documentation searched
- Lower similarity threshold (0.6) for broader matching
- Solutions are generic, not project-specific

## Files Involved

| File | Changes Needed |
|------|---|
| `src/agent/ScopeAwarePromptBuilder.ts` | ✅ Created (ready to use) |
| `src/agent/MinimalReactAgent.ts` | 🔄 Import & use builder functions |
| `src/agent/MultiPassAgent.ts` | 🔄 May inherit from MinimalReactAgent |
| `vscode-extension/src/services/AnalysisService.ts` | ✅ Already injecting scope |
| `vscode-extension/webview/src/views/Analyze.tsx` | ✅ Already collecting scope |

## Quick Checklist

- [ ] Import `ScopeAwarePromptBuilder` functions
- [ ] Add `logScopeContext()` at analysis start
- [ ] Enhance system prompt with `enhanceSystemPromptWithScope()`
- [ ] Filter tools with `filterToolsByScope()`
- [ ] Apply search strategy with `getSearchStrategy()`
- [ ] Test with both scope values
- [ ] Verify console logs show correct scope
- [ ] Check that internal vs external analysis produces different results

## Debugging Tips

If scope isn't working:

1. **Check metadata is present**:
   ```typescript
   console.log('Error metadata:', error.metadata);
   ```

2. **Verify scope value**:
   ```typescript
   const scope = getErrorProjectScope(error);
   console.log('Detected scope:', scope); // Should be 'inside' or 'outside'
   ```

3. **Check prompt enhancement**:
   ```typescript
   const enhanced = enhanceSystemPromptWithScope(basePrompt, error);
   console.log('Scope context:', enhanced.substring(0, 200));
   ```

4. **Verify tool filtering**:
   ```typescript
   const filtered = filterToolsByScope(tools, scope);
   console.log('Available tools:', filtered);
   ```

## Next Steps

Once integrated:
1. Test with external error (scope = 'outside')
2. Verify workspace tools are not used
3. Test with internal error (scope = 'inside')
4. Verify full tool suite is available
5. Compare analysis quality between the two modes

The infrastructure is all in place - just needs to be wired up in the agent!
