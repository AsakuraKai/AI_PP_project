# Chunk 6: Agent System & Analysis Flow

**Priority:** HIGH | **Phase:** Core Features | **Est. Time:** 3-4 hours  
**Depends On:** Chunks 1, 4, 5 (Backend Services, Frontend Services, Error Detection)  
**Enables:** Actual analysis functionality - core feature

## Pre-Chunk Checklist

- [ ] Chunks 1, 4, and 5 are complete and verified
- [ ] Git branch created: `fix/chunk-6-agent-system`
- [ ] Ollama is running: `ollama list` shows available models
- [ ] Have at least one real error in queue (from Chunk 5)
- [ ] Review agent architecture: MinimalReactAgent, MultiPassAgent
- [ ] Understand ReAct loop: Think → Act → Observe

## Objectives

- [DONE] Verify agent initialization
- [DONE] Test agent analysis flow end-to-end
- [DONE] Verify tool orchestration
- [DONE] Check streaming/progress updates
- [DONE] Validate result format
- [DONE] Test error handling in agent
- [DONE] Integrate EducationalAgent (if educational mode enabled)

## Files to Analyze

1. **`src/agent/MinimalReactAgent.ts`** (Core ReAct agent)
2. **`src/agent/MultiPassAgent.ts`** (Multi-pass workflow)
3. **`src/agent/ToolOrchestrator.ts`** (Tool selection & execution)
4. **`src/agent/PromptEngine.ts`** (Prompt generation)
5. **`src/agent/DocumentSynthesizer.ts`** (Final RCA document)
6. **`src/agent/FixGenerator.ts`** (Code fix generation)
7. **Integration in `AnalysisService.ts`**

## Analysis Flow

```
User clicks "Analyze" in UI
  ↓
Webview sends: { command: 'analyzeError', error: ErrorInfo }
  ↓
RCAWebviewProvider._handleAnalyzeError(error)
  ↓
AnalysisService.analyze(error)
  ↓
Create MultiPassAgent (or MinimalReactAgent)
  ↓
agent.analyze(prompt, tools)
  ↓
[Agent Loop]
  - Think (generate hypothesis)
  - Act (select tool, execute)
  - Observe (process tool result)
  - Update progress
  - Emit state stream
  - Repeat until done
  ↓
DocumentSynthesizer.synthesize(agentResult)
  ↓
Return RCAResult
  ↓
RCAWebviewProvider sends: { command: 'analysisComplete', result }
  ↓
Webview displays result
```

## Critical Checks

1. **Agent Initialization**
   ```typescript
   // How is agent created?
   const ollamaClient = new OllamaClient(config.ollamaUrl);
   const agent = new MultiPassAgent(ollamaClient, tools);
   
   // Check:
   // - OllamaClient constructor correct?
   // - Tools array properly initialized?
   // - Agent configured correctly?
   ```

2. **Tool System**
   ```typescript
   // Are all tools registered?
   const tools = [
     new FileResolverTool(),
     new VersionLookupTool(),
     new FixGeneratorTool(),
     // ... etc
   ];
   ```

3. **Streaming Progress**
   ```typescript
   // Does service listen to agent stream?
   agent.on('iteration', (data) => {
     this.sendProgressUpdate(data);
   });
   ```

## Validation Criteria

- [DONE] Agent initializes without errors
- [DONE] Agent can execute analysis
- [DONE] Tool orchestration works
- [DONE] Progress updates stream correctly
- [DONE] Final result has correct format
- [DONE] Error handling robust

## Post-Chunk Verification

**1. Agent Initialization Test:**
```typescript
import { MinimalReactAgent } from '../../src/agent/MinimalReactAgent';
import { OllamaClient } from '../../src/llm/OllamaClient';

const client = new OllamaClient('http://localhost:11434');
const agent = new MinimalReactAgent({ llmClient: client });
console.log('Agent created:', agent);
```

**2. Simple Analysis Test:**
```typescript
const error = errorQueueManager.getAllErrors()[0];
const result = await analysisService.analyze(error);
console.log('Analysis result:', result);
// Expected: RCAResult with rootCause, explanation, fixes
```

**3. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-6): Agent system fully functional with analysis flow"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-6-agent-system
git tag chunk-6-complete -m "Chunk 6: Agent System - Complete"
```

## Session Log Template

```markdown
## Chunk 6: Agent System - Session Log

**Date:** [Date]
**Duration:** [Time]
**Status:** [YELLOW] In Progress

### Objectives
- [ ] Verify agent initialization
- [ ] Test analysis flow end-to-end
- [ ] Verify tool orchestration

### Issues Found
1. **Agent Constructor Mismatch**
   - Severity: Critical
   - Description: OllamaClient constructor signature incorrect
   - Fix: Updated to match actual API

### Next Session
- Proceed to Chunk 7
```
