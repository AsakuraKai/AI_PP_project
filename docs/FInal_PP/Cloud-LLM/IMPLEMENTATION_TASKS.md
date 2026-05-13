# Cloud LLM Integration - Implementation Tasks

## Quick Reference

| Phase | Duration | Status | Dependencies |
|-------|----------|--------|--------------|
| Phase 1: Foundation | 3-4 days | Not Started | None |
| Phase 2: UI Components | 4-5 days | Not Started | Phase 1 |
| Phase 3: Message Passing | 2-3 days | Not Started | Phase 1, 2 |
| Phase 4: API Clients | 3-4 days | Not Started | Phase 1 |
| Phase 5: Integration | 3-4 days | Not Started | All above |
| Phase 6: Testing | 3-4 days | Not Started | Phase 5 |

**Total Estimated Time:** 3-4 weeks

---

## Phase 1: Foundation

### Task 1.1: Define TypeScript Interfaces
**File:** `src/types/cloud-llm.ts`

```typescript
// Types to implement:
- CloudProvider (enum: 'gemini' | 'claude' | 'openai')
- CloudModelConfig (provider, modelId, displayName, maxTokens)
- CloudLLMConfig (provider, model, apiKeyConfigured)
- ConnectionTestResult (success, latency, error?)
- CloudLLMMessage (role, content)
```

**Acceptance Criteria:**
- [ ] All interfaces exported
- [ ] JSDoc comments for each type
- [ ] No `any` types

---

### Task 1.2: Create Provider Configuration
**File:** `src/config/cloud-providers.ts`

```typescript
// Configuration to implement:
export const CLOUD_PROVIDERS = {
  gemini: {
    displayName: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', maxTokens: 8192 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 32768 },
      // ...
    ],
    keyPrefix: 'AIza',  // For basic validation
    docsUrl: 'https://ai.google.dev/'
  },
  claude: { ... },
  openai: { ... }
};
```

**Acceptance Criteria:**
- [ ] All three providers configured
- [ ] At least 3 models per provider
- [ ] Max token limits defined
- [ ] Documentation URLs included

---

### Task 1.3: Implement SecretStorageService
**File:** `vscode-extension/src/services/SecretStorageService.ts`

```typescript
// Methods to implement:
class SecretStorageService {
  constructor(private secrets: vscode.SecretStorage) {}

  async storeApiKey(provider: CloudProvider, key: string): Promise<void>
  async getApiKey(provider: CloudProvider): Promise<string | undefined>
  async deleteApiKey(provider: CloudProvider): Promise<void>
  async hasApiKey(provider: CloudProvider): Promise<boolean>
}
```

**Acceptance Criteria:**
- [ ] Uses VS Code SecretStorage API
- [ ] Key names follow pattern: `rca.{provider}.apiKey`
- [ ] No plaintext storage
- [ ] Unit tests written

---

### Task 1.4: Implement CloudLLMService
**File:** `vscode-extension/src/services/CloudLLMService.ts`

```typescript
// Methods to implement:
class CloudLLMService {
  async configure(config: CloudLLMConfig): Promise<void>
  async getConfig(): Promise<CloudLLMConfig | null>
  async testConnection(provider: CloudProvider, apiKey: string): Promise<ConnectionTestResult>
  async isConfigured(): Promise<boolean>
  getActiveProvider(): CloudProvider | null
}
```

**Acceptance Criteria:**
- [ ] Integrates with SecretStorageService
- [ ] Config persisted via VS Code globalState
- [ ] Test connection makes minimal API call
- [ ] Proper error handling

---

## Phase 2: UI Components

### Task 2.1: Update SettingsSection - Add Cloud Option
**File:** `vscode-extension/webview/src/components/SettingsSection.tsx`

**Changes:**
1. Add separator in SelectContent
2. Add "Use Cloud Model" option with cloud icon
3. Handle selection to navigate to cloud config

```tsx
<SelectContent>
  {/* Existing local models */}
  <SelectItem value="deepseek-r1">DeepSeek-R1</SelectItem>
  {/* ... */}

  <SelectSeparator />

  <SelectItem value="__cloud__" className="text-purple-400">
    <Cloud size={14} /> Use Cloud Model
  </SelectItem>
</SelectContent>
```

**Acceptance Criteria:**
- [ ] Cloud option visually distinct (purple/accent color)
- [ ] Separator before cloud option
- [ ] Selection triggers navigation callback

---

### Task 2.2: Create CloudConfigSection Component
**File:** `vscode-extension/webview/src/components/CloudConfigSection.tsx`

**Structure:**
```
CloudConfigSection
├── Header (title + back button)
├── ProviderSelect
├── ModelSelect (dynamic based on provider)
├── APIKeyInput
├── StatusDisplay
└── ActionButtons (Save, Test)
```

**Props:**
```typescript
interface CloudConfigSectionProps {
  onBack: () => void;
  postMessage: (command: string, data?: any) => void;
}
```

**Acceptance Criteria:**
- [ ] Matches Stitch prototype design
- [ ] All fields functional
- [ ] Loading states for async operations
- [ ] Error display capability

---

### Task 2.3: Create APIKeyInput Component
**File:** `vscode-extension/webview/src/components/ui/APIKeyInput.tsx`

**Features:**
- Password input type
- Toggle visibility (eye icon)
- Placeholder text
- Helper text below
- Error state styling

**Acceptance Criteria:**
- [ ] Default: masked (dots)
- [ ] Eye icon toggles visibility
- [ ] Error state shows red border
- [ ] Accessible (aria labels)

---

### Task 2.4: Add Navigation State
**File:** `vscode-extension/webview/src/App.tsx` (or relevant router)

**State:**
```typescript
type SettingsView = 'main' | 'cloud-config';
const [settingsView, setSettingsView] = useState<SettingsView>('main');
```

**Acceptance Criteria:**
- [ ] Smooth transition between views
- [ ] State persists during session
- [ ] Back button works correctly

---

## Phase 3: Message Passing

### Task 3.1: Define Message Types
**File:** `vscode-extension/src/types/webview-messages.ts`

```typescript
// Webview → Extension
type CloudConfigMessage =
  | { command: 'saveCloudApiKey'; data: { provider: string; apiKey: string; model: string } }
  | { command: 'testCloudConnection'; data: { provider: string; apiKey: string } }
  | { command: 'getCloudConfig' }
  | { command: 'clearCloudConfig' };

// Extension → Webview
type CloudConfigResponse =
  | { command: 'cloudConfigStatus'; data: { success: boolean; message: string } }
  | { command: 'connectionTestResult'; data: ConnectionTestResult }
  | { command: 'cloudConfig'; data: CloudLLMConfig | null };
```

---

### Task 3.2: Implement Message Handlers
**File:** `vscode-extension/src/webview/RCAWebviewProvider.ts`

**Add handlers in `_handleMessage()`:**
```typescript
case 'saveCloudApiKey':
  await this.cloudLLMService.configure(message.data);
  this._panel.webview.postMessage({
    command: 'cloudConfigStatus',
    data: { success: true, message: 'Key saved!' }
  });
  break;

case 'testCloudConnection':
  const result = await this.cloudLLMService.testConnection(...);
  this._panel.webview.postMessage({
    command: 'connectionTestResult',
    data: result
  });
  break;
```

**Acceptance Criteria:**
- [ ] All message types handled
- [ ] Errors caught and reported
- [ ] Logging for debugging

---

### Task 3.3: Webview Message Hooks
**File:** `vscode-extension/webview/src/hooks/useCloudConfig.ts`

```typescript
function useCloudConfig() {
  const [config, setConfig] = useState<CloudLLMConfig | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const saveApiKey = (provider, apiKey, model) => { ... };
  const testConnection = (provider, apiKey) => { ... };

  // Listen for responses
  useEffect(() => {
    const handler = (event) => { ... };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return { config, status, saveApiKey, testConnection };
}
```

---

## Phase 4: API Clients

### Task 4.1: Install SDK Packages
**File:** `package.json`

```bash
npm install @google/generative-ai @anthropic-ai/sdk openai
```

**Also add to:** `vscode-extension/package.json` if separate

---

### Task 4.2: Create CloudLLMClient Interface
**File:** `src/llm/CloudLLMClient.ts`

```typescript
interface CloudLLMClient {
  provider: CloudProvider;

  generateCompletion(
    messages: CloudLLMMessage[],
    options?: CompletionOptions
  ): Promise<string>;

  streamCompletion(
    messages: CloudLLMMessage[],
    onChunk: (chunk: string) => void,
    options?: CompletionOptions
  ): Promise<void>;

  testConnection(): Promise<ConnectionTestResult>;
}
```

---

### Task 4.3: Implement GeminiClient
**File:** `src/llm/GeminiClient.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiClient implements CloudLLMClient {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string, modelId: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateCompletion(messages, options) {
    const model = this.client.getGenerativeModel({ model: this.modelId });
    const result = await model.generateContent(this.formatMessages(messages));
    return result.response.text();
  }

  async testConnection() {
    const start = Date.now();
    try {
      await this.generateCompletion([{ role: 'user', content: 'Hi' }]);
      return { success: true, latency: Date.now() - start };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

---

### Task 4.4: Implement ClaudeClient
**File:** `src/llm/ClaudeClient.ts`

Similar structure using `@anthropic-ai/sdk`

---

### Task 4.5: Implement OpenAIClient
**File:** `src/llm/OpenAIClient.ts`

Similar structure using `openai` package

---

### Task 4.6: Create Client Factory
**File:** `src/llm/CloudClientFactory.ts`

```typescript
function createCloudClient(
  provider: CloudProvider,
  apiKey: string,
  modelId: string
): CloudLLMClient {
  switch (provider) {
    case 'gemini': return new GeminiClient(apiKey, modelId);
    case 'claude': return new ClaudeClient(apiKey, modelId);
    case 'openai': return new OpenAIClient(apiKey, modelId);
  }
}
```

---

## Phase 5: Integration

### Task 5.1: Create LLMProviderService
**File:** `vscode-extension/src/services/LLMProviderService.ts`

```typescript
class LLMProviderService {
  async getActiveClient(): Promise<OllamaClient | CloudLLMClient> {
    const cloudConfig = await this.cloudLLMService.getConfig();

    if (cloudConfig?.provider) {
      const apiKey = await this.secretStorage.getApiKey(cloudConfig.provider);
      return createCloudClient(cloudConfig.provider, apiKey, cloudConfig.model);
    }

    return this.ollamaClient;  // Fallback to local
  }

  isUsingCloud(): boolean { ... }
}
```

---

### Task 5.2: Update AnalysisService
**File:** `vscode-extension/src/services/AnalysisService.ts`

**Changes:**
1. Inject LLMProviderService
2. Use `getActiveClient()` instead of hardcoded Ollama
3. Handle cloud-specific errors

---

### Task 5.3: Update ConversationalAgent
**File:** `vscode-extension/src/chat/ConversationalAgent.ts`

**Changes:**
1. Use LLMProviderService for LLM calls
2. Indicate which provider is active in responses
3. Handle provider switching mid-conversation

---

### Task 5.4: Update MinimalReactAgent
**File:** `src/agent/MinimalReactAgent.ts`

**Changes:**
1. Accept LLM client via dependency injection
2. Abstract away Ollama-specific code
3. Support both local and cloud clients

---

## Phase 6: Testing & Polish

### Task 6.1: Unit Tests
**Files:**
- `tests/unit/services/CloudLLMService.test.ts`
- `tests/unit/services/SecretStorageService.test.ts`
- `tests/unit/llm/GeminiClient.test.ts`
- `tests/unit/llm/ClaudeClient.test.ts`
- `tests/unit/llm/OpenAIClient.test.ts`

---

### Task 6.2: Integration Tests
**File:** `tests/integration/cloud-llm-integration.test.ts`

Test full flow with mocked API responses

---

### Task 6.3: Manual E2E Testing
**Reference:** `TESTING_CHECKLIST.md`

---

### Task 6.4: Error Handling Polish
- Rate limit handling
- Quota exceeded handling
- Network timeout handling
- Invalid key handling
- Graceful fallback to local

---

### Task 6.5: Documentation Updates
- Update `docs/Others/USER_GUIDE.md`
- Update `AGENT_README.md`
- Add Cloud LLM section to `README.md`

---

## File Change Summary

### New Files (13)
```
src/types/cloud-llm.ts
src/config/cloud-providers.ts
src/llm/CloudLLMClient.ts
src/llm/GeminiClient.ts
src/llm/ClaudeClient.ts
src/llm/OpenAIClient.ts
src/llm/CloudClientFactory.ts
vscode-extension/src/services/SecretStorageService.ts
vscode-extension/src/services/CloudLLMService.ts
vscode-extension/src/services/LLMProviderService.ts
vscode-extension/webview/src/components/CloudConfigSection.tsx
vscode-extension/webview/src/components/ui/APIKeyInput.tsx
vscode-extension/webview/src/hooks/useCloudConfig.ts
```

### Modified Files (7)
```
package.json (new dependencies)
vscode-extension/package.json (new dependencies)
vscode-extension/src/types/webview-messages.ts
vscode-extension/src/webview/RCAWebviewProvider.ts
vscode-extension/webview/src/components/SettingsSection.tsx
vscode-extension/src/services/AnalysisService.ts
vscode-extension/src/chat/ConversationalAgent.ts
```

### Test Files (5)
```
tests/unit/services/CloudLLMService.test.ts
tests/unit/services/SecretStorageService.test.ts
tests/unit/llm/GeminiClient.test.ts
tests/unit/llm/ClaudeClient.test.ts
tests/unit/llm/OpenAIClient.test.ts
```

---

## Definition of Done

- [ ] All tasks completed
- [ ] All unit tests passing
- [ ] Manual testing checklist completed
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Merged to main branch
