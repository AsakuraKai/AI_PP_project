# Model Switching Architecture - Visual Diagrams

**Date:** 2026-03-31
**Purpose:** Visual representation of model switching system

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VS Code Extension                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                        Webview (React)                          │    │
│  │                                                                 │    │
│  │  ┌──────────────────┐         ┌──────────────────────────┐    │    │
│  │  │ SettingsSection  │         │  CloudConfigSection      │    │    │
│  │  │                  │         │                          │    │    │
│  │  │ • Model Select   │────────▶│  • API Key Input         │    │    │
│  │  │ • Local Models   │         │  • Provider Detection    │    │    │
│  │  │ • Cloud Option   │         │  • Model Selection       │    │    │
│  │  │ • Status Display │         │  • Connection Test       │    │    │
│  │  └──────────────────┘         │  • Save Configuration    │    │    │
│  │                                └──────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    │ postMessage()                       │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    RCAWebviewProvider                           │    │
│  │                                                                 │    │
│  │  Message Handlers:                                             │    │
│  │  • getCloudConfig                                              │    │
│  │  • fetchModels                                                 │    │
│  │  • testCloudConnection                                         │    │
│  │  • saveCloudApiKey                                             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     CloudLLMService                             │    │
│  │                                                                 │    │
│  │  • saveCloudConfig(apiKey, model)                              │    │
│  │  • getCloudConfig()                                            │    │
│  │  • getApiKey()                                                 │    │
│  │  • testConnection(apiKey, model)                               │    │
│  │  • fetchAvailableModels(apiKey)                                │    │
│  │  • getCloudClient()                                            │    │
│  │  • isConfigured()                                              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                │                                      │                  │
│                ▼                                      ▼                  │
│  ┌──────────────────────────┐      ┌──────────────────────────────┐   │
│  │  SecretStorageService    │      │  VS Code globalState         │   │
│  │                          │      │                              │   │
│  │  • storeApiKey()         │      │  Config: {                   │   │
│  │  • getApiKey()           │      │    provider: 'gemini',       │   │
│  │  • deleteApiKey()        │      │    model: 'gemini-2.0-...'   │   │
│  │  • hasApiKey()           │      │  }                           │   │
│  └──────────────────────────┘      └──────────────────────────────┘   │
│                │                                                        │
│                ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │           VS Code SecretStorage (OS-level)                    │     │
│  │                                                               │     │
│  │  rca.cloud.apiKey.gemini      → [encrypted]                  │     │
│  │  rca.cloud.apiKey.anthropic   → [encrypted]                  │     │
│  │  rca.cloud.apiKey.openai      → [encrypted]                  │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        Cloud Provider Clients                            │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  GeminiClient    │  │  ClaudeClient    │  │  OpenAIClient    │     │
│  │                  │  │                  │  │                  │     │
│  │  • listModels()  │  │  • listModels()  │  │  • listModels()  │     │
│  │  • testConn()    │  │  • testConn()    │  │  • testConn()    │     │
│  │  • generate()    │  │  • generate()    │  │  • generate()    │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│          │                      │                      │                │
│          └──────────────────────┴──────────────────────┘                │
│                                 │                                        │
│                                 ▼                                        │
│                    ┌──────────────────────────┐                         │
│                    │  CloudLLMClient Factory  │                         │
│                    │  createCloudLLMClient()  │                         │
│                    └──────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        Analysis & Agent Layer                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     AnalysisService                             │    │
│  │                                                                 │    │
│  │  initialize() {                                                │    │
│  │    if (cloudConfigured) {                                      │    │
│  │      client = wrapCloudClient(getCloudClient())                │    │
│  │    } else {                                                    │    │
│  │      client = new OllamaClient()                               │    │
│  │    }                                                           │    │
│  │    agent = new MinimalReactAgent(client)                       │    │
│  │  }                                                             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   MinimalReactAgent                             │    │
│  │                                                                 │    │
│  │  • Uses injected LLM client (local or cloud)                   │    │
│  │  • Agnostic to provider type                                   │    │
│  │  • Performs RCA analysis                                       │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Provider Detection Flow

```
User enters API key
        │
        ▼
┌───────────────────┐
│ detectProvider()  │
└───────────────────┘
        │
        ├─── Starts with "AIza"? ────────────▶ Google Gemini
        │
        ├─── Starts with "sk-ant-"? ─────────▶ Anthropic Claude
        │
        ├─── Starts with "sk-"? ─────────────▶ OpenAI
        │
        └─── Other format? ──────────────────▶ Unknown Provider
                                                    │
                                                    ▼
                                              Show error message
```

---

## Configuration Save Flow

```
User clicks "Save Configuration"
        │
        ▼
┌─────────────────────────────────────────┐
│ CloudLLMService.saveCloudConfig()       │
└─────────────────────────────────────────┘
        │
        ├─── 1. Validate inputs (apiKey, model)
        │         │
        │         ├─── Empty? ──────────▶ Throw error
        │         └─── Valid ────────────▶ Continue
        │
        ├─── 2. Detect provider from API key
        │         │
        │         └─── detectProvider(apiKey)
        │                   │
        │                   └─── Returns: 'gemini' | 'anthropic' | 'openai' | 'unknown'
        │
        ├─── 3. Store API key securely
        │         │
        │         └─── SecretStorageService.storeApiKey(provider, apiKey)
        │                   │
        │                   └─── VS Code SecretStorage (OS-level encryption)
        │
        ├─── 4. Store configuration
        │         │
        │         └─── globalState.update('rca.cloud.config', { provider, model })
        │
        ├─── 5. Success? ──────────▶ Return provider
        │
        └─── 6. Error? ────────────▶ Rollback API key + Throw error
```

---

## Model Fetching Flow

```
User enters API key
        │
        ▼
┌─────────────────────────────────────────┐
│ Auto-detect provider                    │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ CloudLLMService.fetchAvailableModels()  │
└─────────────────────────────────────────┘
        │
        ├─── Provider: Gemini ──────────────────┐
        │                                        │
        │                                        ▼
        │                          ┌──────────────────────────┐
        │                          │ GeminiClient.listModels()│
        │                          │                          │
        │                          │ • Call Google API        │
        │                          │ • Filter by capability   │
        │                          │ • Sort by version        │
        │                          └──────────────────────────┘
        │
        ├─── Provider: OpenAI ───────────────────┐
        │                                         │
        │                                         ▼
        │                          ┌──────────────────────────┐
        │                          │ OpenAIClient.listModels()│
        │                          │                          │
        │                          │ • Call OpenAI API        │
        │                          │ • Filter chat models     │
        │                          │ • Sort by priority       │
        │                          └──────────────────────────┘
        │
        └─── Provider: Anthropic ────────────────┐
                                                  │
                                                  ▼
                                   ┌──────────────────────────┐
                                   │ getClaudeModels()        │
                                   │                          │
                                   │ • Return curated list    │
                                   │ • No API available       │
                                   └──────────────────────────┘
                                                  │
                                                  ▼
                                   ┌──────────────────────────┐
                                   │ Return CloudModel[]      │
                                   │                          │
                                   │ [{                       │
                                   │   id: 'model-id',        │
                                   │   name: 'Display Name',  │
                                   │   contextWindow: 200000  │
                                   │ }]                       │
                                   └──────────────────────────┘
                                                  │
                                                  ▼
                                   ┌──────────────────────────┐
                                   │ Populate dropdown in UI  │
                                   └──────────────────────────┘
```

---

## Runtime Provider Switching

```
User triggers analysis (e.g., analyzes error)
        │
        ▼
┌─────────────────────────────────────────┐
│ AnalysisService.initialize()            │
└─────────────────────────────────────────┘
        │
        ├─── Check: Cloud configured?
        │         │
        │         ├─── Yes ──────────────────────┐
        │         │                               │
        │         │                               ▼
        │         │                ┌──────────────────────────────┐
        │         │                │ Get cloud client             │
        │         │                │ cloudLLMService.getCloudClient()│
        │         │                └──────────────────────────────┘
        │         │                               │
        │         │                               ▼
        │         │                ┌──────────────────────────────┐
        │         │                │ Wrap to OllamaClient interface│
        │         │                │ _createCloudClientWrapper()  │
        │         │                └──────────────────────────────┘
        │         │                               │
        │         │                               ▼
        │         │                ┌──────────────────────────────┐
        │         │                │ client = wrappedCloudClient  │
        │         │                └──────────────────────────────┘
        │         │
        │         └─── No ───────────────────────┐
        │                                         │
        │                                         ▼
        │                          ┌──────────────────────────────┐
        │                          │ Use local Ollama             │
        │                          │ client = new OllamaClient()  │
        │                          └──────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Inject client into agent                │
│ agent = new MinimalReactAgent(client)   │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Agent performs analysis                 │
│ (Transparent to which provider is used) │
└─────────────────────────────────────────┘
```

---

## Cloud Client Wrapper Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudLLMClient                            │
│                  (Cloud Provider API)                        │
│                                                              │
│  Interface:                                                  │
│  • generateContent(model, prompt) → CloudLLMResponse        │
│  • testConnection() → boolean                               │
│  • listModels() → CloudModel[]                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Wrapped by
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloud Client Wrapper                            │
│           (OllamaClient Interface Adapter)                   │
│                                                              │
│  Adapts CloudLLMClient to OllamaClient interface:           │
│                                                              │
│  generate(prompt, options) {                                │
│    response = cloudClient.generateContent(model, prompt)    │
│    return {                                                 │
│      response: response.content,                            │
│      model: response.model,                                 │
│      done: true,                                            │
│      prompt_eval_count: response.usage.promptTokens,        │
│      eval_count: response.usage.completionTokens            │
│    }                                                        │
│  }                                                          │
│                                                              │
│  isHealthy() {                                              │
│    return cloudClient.testConnection()                      │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Injected into
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  MinimalReactAgent                           │
│                                                              │
│  • Expects OllamaClient interface                           │
│  • Calls client.generate(prompt)                            │
│  • Doesn't know if it's local or cloud                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Input                            │
│                      (API Key Entry)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Validation
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Input Validation Layer                     │
│                                                              │
│  • Type checking (string, non-empty)                        │
│  • Whitespace trimming                                      │
│  • Length validation                                        │
│  • Format validation (provider detection)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Secure Storage
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              VS Code SecretStorage API                       │
│                                                              │
│  • OS-level encryption                                      │
│  • Automatic encryption/decryption                          │
│  • Not synced to cloud                                      │
│  • Not in settings.json                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                OS Credential Storage                         │
│                                                              │
│  Windows: Credential Manager                                │
│  macOS:   Keychain                                          │
│  Linux:   libsecret                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    UI Security                               │
│                                                              │
│  • Password field (masked by default)                       │
│  • Show/hide toggle                                         │
│  • Keys not logged to console                               │
│  • Masked placeholder when loaded (••••••••)                │
│  • React auto-escapes output (XSS protection)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Transmission Security                        │
│                                                              │
│  • Keys only sent to official provider APIs                 │
│  • HTTPS enforced                                           │
│  • No third-party services                                  │
│  • Timeout protection (30s)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
Operation attempted (save, test, fetch)
        │
        ▼
┌─────────────────────────────────────────┐
│ Input Validation                        │
└─────────────────────────────────────────┘
        │
        ├─── Invalid input? ────────────▶ Throw specific error
        │                                 "API key is required..."
        │
        └─── Valid ─────────────────────▶ Continue
                │
                ▼
┌─────────────────────────────────────────┐
│ Timeout Protection (30s)                │
│ Promise.race([operation, timeout])      │
└─────────────────────────────────────────┘
        │
        ├─── Timeout? ──────────────────▶ Throw timeout error
        │                                 "Operation timed out..."
        │
        └─── Success ───────────────────▶ Continue
                │
                ▼
┌─────────────────────────────────────────┐
│ API Call                                │
└─────────────────────────────────────────┘
        │
        ├─── Invalid API key? ──────────▶ Throw auth error
        │                                 "Invalid API key"
        │
        ├─── Quota exceeded? ───────────▶ Throw quota error
        │                                 "API quota exceeded"
        │
        ├─── Network error? ────────────▶ Throw network error
        │                                 "Network error"
        │
        └─── Success ───────────────────▶ Return result
                │
                ▼
┌─────────────────────────────────────────┐
│ Response Validation                     │
└─────────────────────────────────────────┘
        │
        ├─── Invalid response? ─────────▶ Throw validation error
        │                                 "Invalid response format"
        │
        └─── Valid ─────────────────────▶ Return to user
                │
                ▼
┌─────────────────────────────────────────┐
│ Rollback on Failure (if save operation)│
│ • Delete stored API key                 │
│ • Clear configuration                   │
└─────────────────────────────────────────┘
```

---

## State Diagram - Cloud Configuration

```
┌─────────────────┐
│  Not Configured │ (Initial State)
└─────────────────┘
        │
        │ User enters API key
        ▼
┌─────────────────┐
│  Detecting      │
│  Provider       │
└─────────────────┘
        │
        ├─── Unknown format ────────────▶ ┌─────────────────┐
        │                                 │  Error State    │
        │                                 │  (Unknown Key)  │
        │                                 └─────────────────┘
        │                                         │
        │                                         │ User fixes key
        │                                         ▼
        │                                 (Back to Detecting)
        │
        └─── Valid format ──────────────▶ ┌─────────────────┐
                                          │  Fetching       │
                                          │  Models         │
                                          └─────────────────┘
                                                  │
                                                  ├─── API error ──▶ ┌─────────────────┐
                                                  │                  │  Error State    │
                                                  │                  │  (API Failed)   │
                                                  │                  └─────────────────┘
                                                  │
                                                  └─── Success ─────▶ ┌─────────────────┐
                                                                      │  Models Loaded  │
                                                                      └─────────────────┘
                                                                              │
                                                                              │ User selects model
                                                                              ▼
                                                                      ┌─────────────────┐
                                                                      │  Ready to Save  │
                                                                      └─────────────────┘
                                                                              │
                                                                              ├─── Test Connection (optional)
                                                                              │         │
                                                                              │         ├─── Success ──▶ (Stay in Ready)
                                                                              │         └─── Failure ──▶ (Show error, stay in Ready)
                                                                              │
                                                                              │ User clicks Save
                                                                              ▼
                                                                      ┌─────────────────┐
                                                                      │  Saving         │
                                                                      └─────────────────┘
                                                                              │
                                                                              ├─── Error ──▶ (Back to Ready to Save)
                                                                              │
                                                                              └─── Success ──▶ ┌─────────────────┐
                                                                                               │  Configured     │
                                                                                               │  (Final State)  │
                                                                                               └─────────────────┘
```

---

## Component Interaction Sequence

```
User                CloudConfigSection    RCAWebviewProvider    CloudLLMService    SecretStorage    Provider API
  │                         │                      │                   │                │               │
  │ Enter API key          │                      │                   │                │               │
  ├────────────────────────▶                      │                   │                │               │
  │                         │                      │                   │                │               │
  │                         │ detectProvider()     │                   │                │               │
  │                         ├──────────────────────┤                   │                │               │
  │                         │ Provider detected    │                   │                │               │
  │                         ◀──────────────────────┤                   │                │               │
  │                         │                      │                   │                │               │
  │                         │ fetchModels          │                   │                │               │
  │                         ├─────────────────────▶│                   │                │               │
  │                         │                      │ fetchAvailableModels()             │               │
  │                         │                      ├──────────────────▶│                │               │
  │                         │                      │                   │ Call API       │               │
  │                         │                      │                   ├────────────────────────────────▶
  │                         │                      │                   │                │  Model list   │
  │                         │                      │                   ◀────────────────────────────────┤
  │                         │                      │  CloudModel[]     │                │               │
  │                         │                      ◀──────────────────┤                │               │
  │                         │  availableModels     │                   │                │               │
  │                         ◀─────────────────────┤                   │                │               │
  │                         │                      │                   │                │               │
  │ Select model           │                      │                   │                │               │
  ├────────────────────────▶                      │                   │                │               │
  │                         │                      │                   │                │               │
  │ Click Save             │                      │                   │                │               │
  ├────────────────────────▶                      │                   │                │               │
  │                         │ saveCloudApiKey      │                   │                │               │
  │                         ├─────────────────────▶│                   │                │               │
  │                         │                      │ saveCloudConfig() │                │               │
  │                         │                      ├──────────────────▶│                │               │
  │                         │                      │                   │ storeApiKey()  │               │
  │                         │                      │                   ├───────────────▶│               │
  │                         │                      │                   │   Encrypted    │               │
  │                         │                      │                   ◀───────────────┤               │
  │                         │                      │  Success          │                │               │
  │                         │                      ◀──────────────────┤                │               │
  │                         │  cloudConfigStatus   │                   │                │               │
  │                         ◀─────────────────────┤                   │                │               │
  │ Success message        │                      │                   │                │               │
  ◀────────────────────────┤                      │                   │                │               │
```

---

**Document Version:** 1.0
**Last Updated:** 2026-03-31 15:30 UTC
