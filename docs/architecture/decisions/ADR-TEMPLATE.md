<<<<<<< HEAD
# ADR [Number]: [Title - Short but Descriptive]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded  
**Supersedes:** [ADR number if replacing another decision, or N/A]  
**Superseded By:** [ADR number if this decision was replaced, or N/A]  
**Related Requirements:** [REQ-XXX, REQ-YYY]

---

## Context

[Describe the situation that requires this decision. Include:]
- What problem are we trying to solve?
- What technical constraints exist?
- What business requirements drive this?
- What is the current state?
- Why does this decision need to be made now?

**Example:**
```
The RCA agent needs to support both cost-conscious users who want to run 
models locally and performance-focused users who prefer cloud APIs. Current 
architecture only supports OpenAI, forcing all users to incur API costs.
```

---

## Decision

[State the decision clearly and concisely. Be specific about what will be done.]

**Example:**
```
We will implement an abstract LLMProvider interface with concrete 
implementations for:
- OllamaClient (local models: Llama 3.2, Phi-3, Mistral)
- OpenAIClient (cloud: GPT-4, GPT-3.5)
- AnthropicClient (cloud: Claude 3.5)
- GeminiClient (cloud: Gemini Pro)

Users can select their provider via VS Code settings with a priority 
chain for automatic fallback (local → cloud).
```

---

## Consequences

### Positive (Benefits)
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Example:**
```
- Users have full control over cost (free local) vs performance (paid cloud)
- No vendor lock-in; can switch providers without code changes
- Graceful degradation if local model unavailable
- Supports air-gapped environments
```

### Negative (Trade-offs/Costs)
- [Trade-off 1]
- [Trade-off 2]
- [Trade-off 3]

**Example:**
```
- Increased complexity in provider abstraction layer
- Testing matrix doubles (test each provider separately)
- Need to maintain API key management for multiple services
- Documentation must cover all provider configurations
```

### Neutral (Other Impacts)
- [Impact 1]
- [Impact 2]

**Example:**
```
- Adds ~500 LOC to codebase
- Requires 4 additional integration tests
```

---

## Implementation Details

[Provide concrete examples of how this decision manifests in code]

```typescript
// Example implementation
export interface LLMProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  getModelInfo(): ModelInfo;
  isAvailable(): Promise<boolean>;
}

export class ProviderFactory {
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'ollama': return new OllamaClient(config);
      case 'openai': return new OpenAIClient(config);
      case 'anthropic': return new AnthropicClient(config);
      case 'gemini': return new GeminiClient(config);
    }
  }
}
```

**Files to Create:**
- `src/llm/LLMProvider.ts` - Interface definition
- `src/llm/ProviderFactory.ts` - Provider selection logic
- `src/llm/OllamaClient.ts` - Local model implementation
- `src/llm/OpenAIClient.ts` - OpenAI API implementation
- ... (additional clients)

---

## Alternatives Considered

### Option 1: [Alternative Name]
**Description:** [What this approach would involve]

**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

**Why Rejected:** [Reason this wasn't chosen]

**Example:**
```
### Option 1: Cloud-Only (OpenAI Exclusive)
**Description:** Support only OpenAI API, no local models

**Pros:**
- Simplest implementation
- Best performance (GPT-4)
- No local model management

**Cons:**
- Forces API costs on all users
- No air-gapped support
- Vendor lock-in

**Why Rejected:** User feedback indicated strong preference for local 
models to control costs during development/debugging.
```

### Option 2: [Alternative Name]
**Description:** [What this approach would involve]

**Pros:**
- [Benefit 1]

**Cons:**
- [Drawback 1]

**Why Rejected:** [Reason]

---

## Related Decisions

- **ADR 001:** [Related decision title] - [How it relates]
- **ADR 005:** [Related decision title] - [How it relates]

**Example:**
```
- ADR 002: Multi-Language Support - Dual LLM strategy enables switching
  to specialized models per language (e.g., Qwen2.5-Coder for Python)
- ADR 008: Prompt Engineering - System prompts must be provider-agnostic
  and work across different LLM architectures
```

---

## References

[List any external documentation, research papers, blog posts, GitHub issues, or other resources that informed this decision]

- [Documentation Link](https://example.com)
- [Research Paper](https://arxiv.org/...)
- [GitHub Issue #123](https://github.com/...)

**Example:**
```
- Ollama Documentation: https://ollama.ai/docs
- OpenAI API Reference: https://platform.openai.com/docs
- Anthropic Claude API: https://docs.anthropic.com
- Comparison of Local vs Cloud LLMs: [Blog Post]
- User Survey Results: docs/research/user-preferences-survey.md
```

---

## Notes

[Any additional context, future reconsideration triggers, or follow-up tasks]

**Example:**
```
- Reconsider this decision if:
  * Google Gemini Nano becomes available for local deployment
  * User feedback shows strong preference for single provider
  * Maintenance burden exceeds 20% of development time

- Future enhancements:
  * Add automatic provider selection based on prompt complexity
  * Implement cost tracking per provider
  * Support custom model endpoints (e.g., self-hosted)

- Follow-up tasks:
  * Create user documentation for provider configuration
  * Add provider selection wizard in extension settings
  * Implement provider health monitoring dashboard
```

---

## Approval

**Proposed By:** [Your Name]  
**Reviewed By:** [Reviewer Names, or "Self-Review" for personal projects]  
**Approved Date:** [Date when status changed to Accepted]

---

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-01-15 | Initial proposal | [Name] |
| 2025-01-16 | Addressed review comments | [Name] |
| 2025-01-17 | Accepted | [Name] |
=======
# ADR [Number]: [Title - Short but Descriptive]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded  
**Supersedes:** [ADR number if replacing another decision, or N/A]  
**Superseded By:** [ADR number if this decision was replaced, or N/A]  
**Related Requirements:** [REQ-XXX, REQ-YYY]

---

## Context

[Describe the situation that requires this decision. Include:]
- What problem are we trying to solve?
- What technical constraints exist?
- What business requirements drive this?
- What is the current state?
- Why does this decision need to be made now?

**Example:**
```
The RCA agent needs to support both cost-conscious users who want to run 
models locally and performance-focused users who prefer cloud APIs. Current 
architecture only supports OpenAI, forcing all users to incur API costs.
```

---

## Decision

[State the decision clearly and concisely. Be specific about what will be done.]

**Example:**
```
We will implement an abstract LLMProvider interface with concrete 
implementations for:
- OllamaClient (local models: Llama 3.2, Phi-3, Mistral)
- OpenAIClient (cloud: GPT-4, GPT-3.5)
- AnthropicClient (cloud: Claude 3.5)
- GeminiClient (cloud: Gemini Pro)

Users can select their provider via VS Code settings with a priority 
chain for automatic fallback (local → cloud).
```

---

## Consequences

### Positive (Benefits)
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Example:**
```
- Users have full control over cost (free local) vs performance (paid cloud)
- No vendor lock-in; can switch providers without code changes
- Graceful degradation if local model unavailable
- Supports air-gapped environments
```

### Negative (Trade-offs/Costs)
- [Trade-off 1]
- [Trade-off 2]
- [Trade-off 3]

**Example:**
```
- Increased complexity in provider abstraction layer
- Testing matrix doubles (test each provider separately)
- Need to maintain API key management for multiple services
- Documentation must cover all provider configurations
```

### Neutral (Other Impacts)
- [Impact 1]
- [Impact 2]

**Example:**
```
- Adds ~500 LOC to codebase
- Requires 4 additional integration tests
```

---

## Implementation Details

[Provide concrete examples of how this decision manifests in code]

```typescript
// Example implementation
export interface LLMProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  getModelInfo(): ModelInfo;
  isAvailable(): Promise<boolean>;
}

export class ProviderFactory {
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'ollama': return new OllamaClient(config);
      case 'openai': return new OpenAIClient(config);
      case 'anthropic': return new AnthropicClient(config);
      case 'gemini': return new GeminiClient(config);
    }
  }
}
```

**Files to Create:**
- `src/llm/LLMProvider.ts` - Interface definition
- `src/llm/ProviderFactory.ts` - Provider selection logic
- `src/llm/OllamaClient.ts` - Local model implementation
- `src/llm/OpenAIClient.ts` - OpenAI API implementation
- ... (additional clients)

---

## Alternatives Considered

### Option 1: [Alternative Name]
**Description:** [What this approach would involve]

**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

**Why Rejected:** [Reason this wasn't chosen]

**Example:**
```
### Option 1: Cloud-Only (OpenAI Exclusive)
**Description:** Support only OpenAI API, no local models

**Pros:**
- Simplest implementation
- Best performance (GPT-4)
- No local model management

**Cons:**
- Forces API costs on all users
- No air-gapped support
- Vendor lock-in

**Why Rejected:** User feedback indicated strong preference for local 
models to control costs during development/debugging.
```

### Option 2: [Alternative Name]
**Description:** [What this approach would involve]

**Pros:**
- [Benefit 1]

**Cons:**
- [Drawback 1]

**Why Rejected:** [Reason]

---

## Related Decisions

- **ADR 001:** [Related decision title] - [How it relates]
- **ADR 005:** [Related decision title] - [How it relates]

**Example:**
```
- ADR 002: Multi-Language Support - Dual LLM strategy enables switching
  to specialized models per language (e.g., Qwen2.5-Coder for Python)
- ADR 008: Prompt Engineering - System prompts must be provider-agnostic
  and work across different LLM architectures
```

---

## References

[List any external documentation, research papers, blog posts, GitHub issues, or other resources that informed this decision]

- [Documentation Link](https://example.com)
- [Research Paper](https://arxiv.org/...)
- [GitHub Issue #123](https://github.com/...)

**Example:**
```
- Ollama Documentation: https://ollama.ai/docs
- OpenAI API Reference: https://platform.openai.com/docs
- Anthropic Claude API: https://docs.anthropic.com
- Comparison of Local vs Cloud LLMs: [Blog Post]
- User Survey Results: docs/research/user-preferences-survey.md
```

---

## Notes

[Any additional context, future reconsideration triggers, or follow-up tasks]

**Example:**
```
- Reconsider this decision if:
  * Google Gemini Nano becomes available for local deployment
  * User feedback shows strong preference for single provider
  * Maintenance burden exceeds 20% of development time

- Future enhancements:
  * Add automatic provider selection based on prompt complexity
  * Implement cost tracking per provider
  * Support custom model endpoints (e.g., self-hosted)

- Follow-up tasks:
  * Create user documentation for provider configuration
  * Add provider selection wizard in extension settings
  * Implement provider health monitoring dashboard
```

---

## Approval

**Proposed By:** [Your Name]  
**Reviewed By:** [Reviewer Names, or "Self-Review" for personal projects]  
**Approved Date:** [Date when status changed to Accepted]

---

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2025-01-15 | Initial proposal | [Name] |
| 2025-01-16 | Addressed review comments | [Name] |
| 2025-01-17 | Accepted | [Name] |
>>>>>>> 8c58113224bbf7a87a7715a24cf9d7750b167135
