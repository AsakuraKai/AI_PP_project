# Core Agents - Technical Reference

**Category:** Core Backend Agents (src/agent/)  
**Purpose:** Analysis logic and intelligence

---

## Overview

These components implement the reasoning and analysis capabilities.

---

## 1. MinimalReactAgent

**Location:** `src/agent/MinimalReactAgent.ts`  
**Purpose:** Main React-style reasoning agent

### Key Methods

```typescript
class MinimalReactAgent {
  // Main analysis entry point
  async analyze(params: {
    error: string;
    file?: string;
    line?: number;
    maxIterations?: number;
    onProgress?: (state: AgentState) => void;
  }): Promise<RCAResult>

  // Get current state
  getState(): AgentState

  // Cancel analysis
  cancel(): void
}
```

### Used By
- AnalysisService (primary)
- RCAChatParticipant

### UI Views
- Analyze (shows progress)
- Agent State (visualization)

---

## 2. MultiPassAgent

**Location:** `src/agent/MultiPassAgent.ts`  
**Purpose:** Multi-iteration refinement of analysis

### Key Methods

```typescript
class MultiPassAgent {
  async analyzeMultiPass(
    error: string,
    passes: number = 3
  ): Promise<RCAResult[]>

  // Combine multiple passes into consensus
  buildConsensus(passes: RCAResult[]): RCAResult
}
```

### Used By
- MinimalReactAgent (when multi-pass enabled)

### UI Views
- Agent State (shows iteration progress)

---

## 3. FixGenerator

**Location:** `src/agent/FixGenerator.ts`  
**Purpose:** Generate intelligent code fixes using LLM

**[WARNING] P0 Gap:** Not connected to FixApplicationService

### Key Methods

```typescript
class FixGenerator {
  // Generate fix for error
  async generateFix(params: {
    error: string;
    stackTrace?: string;
    file: string;
    line: number;
    context: string;
  }): Promise<Fix>

  // Validate generated fix
  validateFix(fix: Fix): ValidationResult
}
```

### Should Be Used By
- FixApplicationService (NOT CONNECTED YET)

### UI Views
- Analyze (fix suggestions)
- Fix Manager (pending fixes)

---

## 4. ErrorClassifier

**Location:** `src/agent/ErrorClassifier.ts`  
**Purpose:** Classify errors by type, severity, category

### Key Methods

```typescript
class ErrorClassifier {
  // Classify error
  classify(error: string): ErrorClassification

  // Suggest appropriate tools for error type
  suggestTools(classification: ErrorClassification): Tool[]
}
```

### Used By
- MinimalReactAgent

### UI Views
- Error Queue (classification badges)

---

## 5. EducationalAgent

**Location:** `src/agent/EducationalAgent.ts`  
**Purpose:** Teaching mode with detailed explanations

** P1 Gap:** Not accessible from UI

### Key Methods

```typescript
class EducationalAgent extends MinimalReactAgent {
  // Analyze with educational explanations
  async analyzeWithTeaching(error: string): Promise<{
    result: RCAResult;
    teaching: TeachingContent;
  }>
}
```

### Should Be Used By
- AnalysisService (when educational mode enabled)

### UI Integration Needed
- Settings: Toggle for educational mode
- Analyze View: Show teaching content

---

## 6. DocumentSynthesizer

**Location:** `src/agent/DocumentSynthesizer.ts`  
**Purpose:** Generate markdown reports from analysis

### Key Methods

```typescript
class DocumentSynthesizer {
  // Generate markdown report
  synthesize(result: RCAResult): string

  // Export to file
  exportToFile(result: RCAResult, path: string): void
}
```

### Used By
- Should be used for History View export

### UI Views
- History (export button)
- Analyze (export results)

---

## 7. PromptEngine & TemplateEngine

**Location:** `src/agent/PromptEngine.ts`, `src/agent/TemplateEngine.ts`  
**Purpose:** Build prompts for LLM

### Key Methods

```typescript
class PromptEngine {
  buildAnalysisPrompt(params: PromptParams): string
  buildFixPrompt(params: FixParams): string
}

class TemplateEngine {
  getTemplate(type: string): string
  renderTemplate(template: string, data: any): string
}
```

### Used By
- MinimalReactAgent
- FixGenerator
- All agents

---

## 8. ResponseValidator & OutputValidator

**Location:** `src/agent/ResponseValidator.ts`, `src/agent/OutputValidator.ts`  
**Purpose:** Validate LLM responses and agent outputs

### Key Methods

```typescript
class ResponseValidator {
  validateResponse(response: string): ValidationResult
}

class OutputValidator {
  validateOutput(output: RCAResult): ValidationResult
}
```

### Used By
- All agents (ensure quality)

---

## 9. ModelAdapter

**Location:** `src/agent/ModelAdapter.ts`  
**Purpose:** Adapt prompts for different LLM models

** P2 Gap:** Not used

### Key Methods

```typescript
class ModelAdapter {
  adaptPrompt(prompt: string, model: string): string
}
```

### Should Support
- DeepSeek-R1
- Llama 3
- Gemma
- Qwen

---

## 10. AgentStateStream

**Location:** `src/agent/AgentStateStream.ts`  
**Purpose:** Real-time state updates

### Key Methods

```typescript
class AgentStateStream {
  // Subscribe to state changes
  subscribe(callback: (state: AgentState) => void): Unsubscribe

  // Emit state update
  emit(state: AgentState): void
}
```

### Used By
- MinimalReactAgent (emits updates)
- AnalysisService (subscribes)

### UI Views
- Agent State (real-time visualization)
- Analyze (progress updates)

---

## 11. AdaptiveLearning & LearningPipeline

**Location:** `src/agent/AdaptiveLearning.ts`, `src/agent/LearningPipeline.ts`  
**Purpose:** Learn from user feedback and improve

** P1 Gap:** Not running

### Key Methods

```typescript
class AdaptiveLearning {
  // Process feedback
  processFeedback(feedback: Feedback): void

  // Get learning metrics
  getMetrics(): LearningMetrics
}

class LearningPipeline {
  // Run learning cycle
  async runCycle(): Promise<void>
}
```

### Should Run
- Background process every 24 hours
- After N feedbacks collected

### UI Views
- Metrics (learning stats)

---

## 12. FeedbackHandler

**Location:** `src/agent/FeedbackHandler.ts`  
**Purpose:** Collect and process user feedback

### Key Methods

```typescript
class FeedbackHandler {
  // Submit feedback
  submitFeedback(feedback: {
    analysisId: string;
    helpful: boolean;
    comment?: string;
  }): void

  // Get all feedback
  getFeedback(): Feedback[]
}
```

### Used By
- Should be used in History View

### UI Views
- History (/ buttons)
- Analyze (feedback form)

---

## Summary

### Agent Hierarchy

```
MinimalReactAgent (main)
 uses: ErrorClassifier
 uses: PromptEngine
 uses: ResponseValidator
 uses: OutputValidator
 emits: AgentStateStream
 optional: MultiPassAgent

FixGenerator
 uses: PromptEngine
 uses: ResponseValidator

EducationalAgent extends MinimalReactAgent
 adds: TeachingContent

AdaptiveLearning
 uses: FeedbackHandler
 runs: LearningPipeline
```

### Integration Status

| Agent | Status | Priority |
|-------|--------|----------|
| MinimalReactAgent |  Working | - |
| MultiPassAgent |  Working | - |
| FixGenerator |  Not connected | P0 |
| ErrorClassifier |  Working | - |
| EducationalAgent |  Not accessible | P1 |
| DocumentSynthesizer |  Not used for export | P2 |
| AgentStateStream |  Working | - |
| AdaptiveLearning |  Not running | P1 |
| FeedbackHandler |  No UI | P1 |

---

**Related:**
- [Frontend Services](FRONTEND_SERVICES.md)
- [Tools System](TOOLS_SYSTEM.md)
- [Integration Gaps](INTEGRATION_GAPS.md)
