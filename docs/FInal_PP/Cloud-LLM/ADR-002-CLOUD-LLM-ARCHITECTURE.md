# ADR-002: Cloud LLM Integration Architecture

## Status
**Proposed** - 2026-03-30

## Context

The RCA Agent currently uses only local LLMs via Ollama (DeepSeek-R1-Distill-Qwen-7B). Users have requested the ability to use cloud-based LLMs (Google Gemini, Anthropic Claude, OpenAI) for:

1. More powerful models for complex debugging scenarios
2. No local resource requirements (GPU/RAM)
3. Flexibility to choose based on cost/performance tradeoffs

We need to decide how to:
- Store API keys securely
- Switch between local and cloud providers
- Integrate with the existing agent architecture
- Handle the UI/UX flow

## Decision

### 1. API Key Storage: VS Code SecretStorage API

**Choice:** Use `vscode.SecretStorage` for all API key storage.

**Rationale:**
- Encrypted using OS-level credential storage (Windows Credential Manager, macOS Keychain, Linux libsecret)
- Built into VS Code, no external dependencies
- Automatic encryption/decryption
- Survives extension updates

**Rejected Alternatives:**
- `globalState`: Not encrypted
- `settings.json`: Plaintext, synced to cloud
- Environment variables: User-hostile, not persistent
- Custom encryption: Reinventing the wheel, security risk

### 2. Provider Abstraction: Unified CloudLLMClient Interface

**Choice:** Create a common interface that all cloud providers implement.

```typescript
interface CloudLLMClient {
  generateCompletion(messages: Message[]): Promise<string>;
  streamCompletion(messages: Message[], onChunk: Callback): Promise<void>;
  testConnection(): Promise<TestResult>;
}
```

**Rationale:**
- Allows seamless provider switching
- Isolates SDK-specific code
- Enables future provider additions
- Simplifies testing (mock interface)

### 3. UI Pattern: Separate Tab/View for Cloud Configuration

**Choice:** Add "Use Cloud Model" option to dropdown, which navigates to a dedicated Cloud Configuration view.

**Rationale:**
- Keeps main settings panel clean/simple
- Cloud config is a one-time setup, not frequent interaction
- More space for explanatory text and validation
- Clear mental model: "I'm now configuring cloud"

**Rejected Alternatives:**
- Inline in settings: Too cluttered for password input + provider selection
- Modal dialog: Feels more intrusive, less integrated
- Separate VS Code settings page: Disconnected from RCA UI

### 4. Provider Selection: Runtime Switching via ConfigService

**Choice:** Store active provider in VS Code `globalState`, retrieve at runtime.

```typescript
// On analysis request
const provider = configService.getActiveProvider();
const client = provider === 'local'
  ? ollamaClient
  : cloudClientFactory.create(provider, await getApiKey(provider));
```

**Rationale:**
- No restart required to switch
- Configuration persists across sessions
- Clear separation of config from runtime

### 5. SDK Dependencies: Official SDKs Only

**Choice:** Use official SDKs from each provider.

| Provider | Package |
|----------|---------|
| Google | `@google/generative-ai` |
| Anthropic | `@anthropic-ai/sdk` |
| OpenAI | `openai` |

**Rationale:**
- Best API coverage and maintenance
- Type safety
- Automatic updates for new features
- Community support

**Rejected Alternatives:**
- Raw HTTP: More code, less type safety, version drift
- `langchain`: Heavy dependency, abstracts too much
- `ai` (Vercel): Tied to specific patterns

## Consequences

### Positive
- Users can leverage powerful cloud models
- Clean separation of concerns
- Secure credential storage
- Extensible for future providers

### Negative
- Adds ~3 new dependencies (~500KB total)
- More complex testing (need mocks for 3 providers)
- Users must manage their own API keys/billing

### Risks
- API changes in provider SDKs (mitigated by pinned versions)
- Rate limits affecting UX (mitigated by clear error messages)
- Cost concerns for users (mitigated by clear documentation)

## Implementation Notes

See: `IMPLEMENTATION_TASKS.md` for detailed task breakdown.

## References

- [VS Code SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)
- [Google AI SDK](https://ai.google.dev/gemini-api/docs)
- [Anthropic SDK](https://docs.anthropic.com/en/api/client-sdks)
- [OpenAI SDK](https://platform.openai.com/docs/libraries)
