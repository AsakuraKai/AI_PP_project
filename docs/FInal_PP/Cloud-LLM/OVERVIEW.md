# Cloud LLM Integration

> Add third-party cloud LLM support (Google Gemini, Anthropic Claude, OpenAI) to RCA Agent

**Status:** 📋 Planning Complete | ⏳ Implementation Not Started
**Priority:** High (Scope Item #2)
**Estimated Effort:** 3-4 weeks

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Full feature documentation, architecture, user flow |
| [IMPLEMENTATION_TASKS.md](./IMPLEMENTATION_TASKS.md) | Detailed task breakdown by phase |
| [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) | Manual testing guide (22 test cases) |
| [ADR-002](./ADR-002-CLOUD-LLM-ARCHITECTURE.md) | Architecture decision record |

---

## Summary

### What We're Building
A "☁️ Use Cloud Model" option in the Model dropdown that opens a Cloud Configuration tab where users can:
1. Select a provider (Google Gemini, Anthropic Claude, OpenAI)
2. Enter their API key (securely stored)
3. Test the connection
4. Use cloud models for analysis

### Prototype
**Google Stitch Project:** [View Prototype](https://stitch.withgoogle.com/projects/13681341420789817955)
- Project ID: `13681341420789817955`

---

## Implementation Phases

| Phase | Description | Duration | Status |
|-------|-------------|----------|--------|
| 1 | Foundation (types, services) | 3-4 days | ⬜ Not Started |
| 2 | UI Components | 4-5 days | ⬜ Not Started |
| 3 | Message Passing | 2-3 days | ⬜ Not Started |
| 4 | API Clients | 3-4 days | ⬜ Not Started |
| 5 | Integration | 3-4 days | ⬜ Not Started |
| 6 | Testing & Polish | 3-4 days | ⬜ Not Started |

---

## Key Files to Create

```
src/
├── types/cloud-llm.ts              # TypeScript interfaces
├── config/cloud-providers.ts       # Provider configurations
└── llm/
    ├── CloudLLMClient.ts           # Interface
    ├── GeminiClient.ts             # Google implementation
    ├── ClaudeClient.ts             # Anthropic implementation
    ├── OpenAIClient.ts             # OpenAI implementation
    └── CloudClientFactory.ts       # Factory function

vscode-extension/src/
├── services/
│   ├── SecretStorageService.ts     # API key encryption
│   ├── CloudLLMService.ts          # Cloud config management
│   └── LLMProviderService.ts       # Provider switching
└── webview/src/components/
    ├── CloudConfigSection.tsx      # Main cloud config UI
    └── ui/APIKeyInput.tsx          # Password input component
```

---

## Dependencies to Add

```json
{
  "@google/generative-ai": "^0.24.0",
  "@anthropic-ai/sdk": "^0.39.0",
  "openai": "^4.77.0"
}
```

---

## Next Steps

1. ✅ Planning complete
2. ⬜ Get stakeholder approval on ADR
3. ⬜ Begin Phase 1: Foundation
4. ⬜ Iterate through phases
5. ⬜ Complete testing checklist
6. ⬜ Merge to main
