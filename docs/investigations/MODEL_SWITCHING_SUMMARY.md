# Model Switching - Quick Summary

**Investigation Date:** 2026-03-31
**Status:** ✅ Investigation Complete
**Implementation Status:** 75% Complete

---

## TL;DR

RCA Agent supports **dual-mode LLM operation**:
- **Local:** Ollama (DeepSeek-R1-Distill-Qwen-7B)
- **Cloud:** Google Gemini, Anthropic Claude, OpenAI

**How it works:** Runtime provider selection with automatic API key detection, secure storage, and transparent agent integration.

---

## Quick Architecture

```
User enters API key → Auto-detect provider → Fetch models → Save config
                                                                ↓
                                                    Stored securely in OS
                                                                ↓
Analysis triggered → Check if cloud configured → Use cloud or Ollama
                                                                ↓
                                            Inject into MinimalReactAgent
```

---

## Key Components

| Component | Purpose | File |
|-----------|---------|------|
| **CloudLLMService** | Orchestrates all cloud operations | `vscode-extension/src/services/CloudLLMService.ts` |
| **SecretStorageService** | Secure API key storage (OS-level) | `vscode-extension/src/services/SecretStorageService.ts` |
| **Provider Detection** | Auto-detect from key prefix | `vscode-extension/src/utils/detectProvider.ts` |
| **GeminiClient** | Google Gemini integration | `vscode-extension/src/llm/GeminiClient.ts` |
| **OpenAIClient** | OpenAI integration | `vscode-extension/src/llm/OpenAIClient.ts` |
| **Claude Config** | Anthropic model list | `vscode-extension/src/config/anthropic-models.ts` |
| **CloudConfigSection** | UI for cloud setup | `vscode-extension/webview/src/components/CloudConfigSection.tsx` |
| **AnalysisService** | Runtime provider switching | `vscode-extension/src/services/AnalysisService.ts` |

---

## Provider Detection Rules

```typescript
AIza...         → Google Gemini
sk-ant-...      → Anthropic Claude
sk-...          → OpenAI
[other]         → Unknown
```

**Automatic** - No user selection needed!

---

## Security

✅ **API Keys:**
- Stored in OS-level encrypted storage (Windows Credential Manager, macOS Keychain, Linux libsecret)
- Never in plaintext settings.json
- Masked in UI
- Not logged to console

✅ **Input Validation:**
- Type checking
- Whitespace trimming
- Format validation
- Timeout protection (30s)

✅ **Error Handling:**
- Rollback on save failures
- Specific error messages
- Graceful degradation

---

## User Flow

1. **Settings → "Use Cloud Model"** → Opens Cloud Config screen
2. **Enter API key** → Provider auto-detected
3. **Models fetched** → Dropdown populated from provider API
4. **Test connection** (optional) → Verify key works
5. **Save configuration** → Stored securely
6. **Use for analysis** → Transparent to user

---

## Implementation Status

### ✅ Complete (75%)

- [x] CloudLLMService orchestrator
- [x] Secure API key storage
- [x] Provider auto-detection
- [x] Dynamic model fetching (real API calls)
- [x] Cloud configuration UI
- [x] Message passing layer
- [x] 200+ unit tests
- [x] Error handling & timeouts

### ⏳ Pending (25%)

- [ ] Install SDK packages (`@google/generative-ai`, `@anthropic-ai/sdk`, `openai`)
- [ ] Refine unified CloudLLMClient interface
- [ ] Complete agent integration (ConversationalAgent)
- [ ] E2E manual testing with real API keys
- [ ] User guide documentation

---

## How Runtime Switching Works

**In AnalysisService.initialize():**

```typescript
// Check if cloud configured
const useCloudLLM = await this._cloudLLMService.isConfigured();

if (useCloudLLM) {
  // Get cloud client
  const cloudClient = await this._cloudLLMService.getCloudClient();

  // Wrap to match OllamaClient interface
  this._client = this._createCloudClientWrapper(cloudClient);
} else {
  // Use local Ollama
  this._client = new OllamaClient({ baseUrl, model });
}

// Inject into agent (transparent to agent)
this._agent = new MinimalReactAgent(this._client, config);
```

**Key Points:**
- No restart required
- Transparent to MinimalReactAgent
- Graceful fallback to Ollama if cloud unavailable
- Interface adapter pattern

---

## Data Storage

**Configuration (VS Code globalState):**
```json
{
  "provider": "gemini",
  "model": "gemini-2.0-flash-exp"
}
```

**API Keys (OS SecretStorage):**
```
rca.cloud.apiKey.gemini      → [encrypted by OS]
rca.cloud.apiKey.anthropic   → [encrypted by OS]
rca.cloud.apiKey.openai      → [encrypted by OS]
```

---

## Message Protocol

**Frontend → Extension:**
- `getCloudConfig` - Retrieve current config
- `fetchModels` - Get available models
- `testCloudConnection` - Test API key
- `saveCloudApiKey` - Save configuration

**Extension → Frontend:**
- `cloudConfigLoaded` - Config data
- `availableModels` - Model list
- `connectionTestResult` - Test result
- `cloudConfigStatus` - Save result
- `modelFetchError` - Error message

---

## Next Steps (Priority Order)

### 1. Install SDK Packages ⚡ START HERE
```bash
cd vscode-extension
npm install @google/generative-ai @anthropic-ai/sdk openai
```
**Time:** 5 minutes

### 2. Refine Unified Interface
- Ensure consistency across clients
- Test interface compatibility
**Time:** 2-3 hours

### 3. Complete Agent Integration
- Finish AnalysisService integration
- Integrate with ConversationalAgent
**Time:** 6-8 hours

### 4. Manual Testing & Docs
- E2E testing with real keys
- Write user guide
**Time:** 3-4 hours

**Total Remaining:** 11-15 hours

---

## Known Limitations

1. **SDK packages not installed** - Clients won't work until packages added
2. **Unified interface needs refinement** - Minor inconsistencies between clients
3. **Agent integration incomplete** - Cloud models not fully usable for analysis yet
4. **Manual testing pending** - No real-world validation with actual API keys

---

## Testing

**Unit Tests:** ✅ 200+ test cases
- CloudLLMService operations
- Provider detection (edge cases, security)
- Integration workflows
- Error handling & timeouts

**Manual Tests:** ⏳ Pending
- Real API key validation
- E2E user workflows
- Provider switching
- Error scenarios

---

## Documentation

**Full Investigation Report:**
[MODEL_SWITCHING_INVESTIGATION.md](./MODEL_SWITCHING_INVESTIGATION.md)

**Cloud LLM Docs:**
- [docs/FInal_PP/Cloud-LLM/README.md](../FInal_PP/Cloud-LLM/README.md) - Full spec
- [docs/FInal_PP/Cloud-LLM/OVERVIEW.md](../FInal_PP/Cloud-LLM/OVERVIEW.md) - Quick overview
- [docs/FInal_PP/Cloud-LLM/IMPLEMENTATION_STATUS.md](../FInal_PP/Cloud-LLM/IMPLEMENTATION_STATUS.md) - Current status
- [docs/FInal_PP/Cloud-LLM/ADR-002-CLOUD-LLM-ARCHITECTURE.md](../FInal_PP/Cloud-LLM/ADR-002-CLOUD-LLM-ARCHITECTURE.md) - Architecture decisions

---

## Conclusion

✅ **Well-architected system** with secure storage, automatic detection, and runtime switching

✅ **75% complete** - UI and backend services functional

⏳ **25% remaining** - SDK installation and agent integration needed

🎯 **Recommended action:** Install SDK packages and complete agent integration

---

**Document Version:** 1.0
**Last Updated:** 2026-03-31 15:26 UTC
