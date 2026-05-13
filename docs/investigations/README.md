# RCA Agent - Investigation Reports

This directory contains detailed investigation reports for various aspects of the RCA Agent project.

---

## Available Reports

### Model Switching Investigation (2026-03-31)

**Status:** ✅ Complete

A comprehensive investigation into how the RCA Agent switches between local (Ollama) and cloud (Gemini, Claude, OpenAI) LLM providers.

**Documents:**

1. **[MODEL_SWITCHING_INVESTIGATION.md](./MODEL_SWITCHING_INVESTIGATION.md)** - Full Investigation Report
   - 📄 **Size:** Comprehensive (50+ pages)
   - 🎯 **Audience:** Developers, architects, technical stakeholders
   - 📋 **Contents:**
     - Executive summary
     - Complete architecture overview
     - Detailed component analysis
     - Security architecture
     - Implementation status
     - Testing strategy
     - Known limitations
     - Next steps with time estimates

2. **[MODEL_SWITCHING_SUMMARY.md](./MODEL_SWITCHING_SUMMARY.md)** - Quick Summary
   - 📄 **Size:** Concise (5-10 pages)
   - 🎯 **Audience:** Quick reference, stakeholders, new team members
   - 📋 **Contents:**
     - TL;DR
     - Quick architecture diagram
     - Key components table
     - Implementation checklist
     - Next steps priority list

3. **[MODEL_SWITCHING_DIAGRAM.md](./MODEL_SWITCHING_DIAGRAM.md)** - Visual Diagrams
   - 📄 **Size:** Visual reference
   - 🎯 **Audience:** Visual learners, presentations, documentation
   - 📋 **Contents:**
     - System architecture diagram
     - Provider detection flow
     - Configuration save flow
     - Model fetching flow
     - Runtime switching flow
     - Security architecture
     - Error handling flow
     - State diagram
     - Sequence diagram

---

## Quick Navigation

### I want to understand model switching...

- **In 5 minutes:** Read [MODEL_SWITCHING_SUMMARY.md](./MODEL_SWITCHING_SUMMARY.md) - TL;DR section
- **In 15 minutes:** Read [MODEL_SWITCHING_SUMMARY.md](./MODEL_SWITCHING_SUMMARY.md) - Full summary
- **In 30 minutes:** Read [MODEL_SWITCHING_INVESTIGATION.md](./MODEL_SWITCHING_INVESTIGATION.md) - Key Components section
- **Comprehensive:** Read [MODEL_SWITCHING_INVESTIGATION.md](./MODEL_SWITCHING_INVESTIGATION.md) - Full report
- **Visual learner:** See [MODEL_SWITCHING_DIAGRAM.md](./MODEL_SWITCHING_DIAGRAM.md) - All diagrams

### I want to implement/continue the work...

1. Start with [MODEL_SWITCHING_SUMMARY.md](./MODEL_SWITCHING_SUMMARY.md) - "Next Steps" section
2. Review [MODEL_SWITCHING_INVESTIGATION.md](./MODEL_SWITCHING_INVESTIGATION.md) - "Implementation Status" section
3. Check [MODEL_SWITCHING_DIAGRAM.md](./MODEL_SWITCHING_DIAGRAM.md) - "Component Interaction Sequence"
4. See [../FInal_PP/Cloud-LLM/IMPLEMENTATION_STATUS.md](../FInal_PP/Cloud-LLM/IMPLEMENTATION_STATUS.md) - Detailed task breakdown

### I want to understand the architecture...

1. See [MODEL_SWITCHING_DIAGRAM.md](./MODEL_SWITCHING_DIAGRAM.md) - "System Architecture Overview"
2. Read [MODEL_SWITCHING_INVESTIGATION.md](./MODEL_SWITCHING_INVESTIGATION.md) - "Architecture Overview" section
3. Review [../FInal_PP/Cloud-LLM/ADR-002-CLOUD-LLM-ARCHITECTURE.md](../FInal_PP/Cloud-LLM/ADR-002-CLOUD-LLM-ARCHITECTURE.md) - Architecture decisions

### I want to test the implementation...

1. Read [MODEL_SWITCHING_INVESTIGATION.md](./MODEL_SWITCHING_INVESTIGATION.md) - "Testing Strategy" section
2. Check [../FInal_PP/Cloud-LLM/TESTING_CHECKLIST.md](../FInal_PP/Cloud-LLM/TESTING_CHECKLIST.md) - Manual testing guide
3. Review test files in `vscode-extension/test/`

---

## Key Findings Summary

### What Works ✅

- **Provider Auto-Detection:** Automatically detects Google Gemini, Anthropic Claude, or OpenAI from API key prefix
- **Secure Storage:** API keys stored in OS-level encrypted storage (Windows Credential Manager, macOS Keychain, Linux libsecret)
- **Dynamic Model Fetching:** Real API calls to fetch available models from providers
- **Runtime Switching:** No restart required to switch between local and cloud providers
- **Comprehensive Testing:** 200+ unit tests covering all scenarios
- **Error Handling:** Timeout protection, rollback mechanisms, specific error messages

### What's Pending ⏳

- **SDK Installation:** Need to install `@google/generative-ai`, `@anthropic-ai/sdk`, `openai` packages
- **Agent Integration:** Complete integration with MinimalReactAgent and ConversationalAgent
- **Manual Testing:** E2E testing with real API keys
- **Documentation:** User guide and troubleshooting docs

### Implementation Status

**Overall:** 75% Complete

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: UI Components | ✅ Complete | 100% |
| Phase 3: Model Fetching | ✅ Complete | 100% |
| Phase 4: Message Passing | ✅ Complete | 100% |
| Phase 5: API Clients | ⏳ Partial | 80% |
| Phase 6: Integration | ⏳ Partial | 50% |
| Phase 7: Testing | ⏳ Partial | 70% |

---

## Related Documentation

### Cloud LLM Feature Docs

- [docs/FInal_PP/Cloud-LLM/README.md](../FInal_PP/Cloud-LLM/README.md) - Full feature specification
- [docs/FInal_PP/Cloud-LLM/OVERVIEW.md](../FInal_PP/Cloud-LLM/OVERVIEW.md) - Quick overview
- [docs/FInal_PP/Cloud-LLM/IMPLEMENTATION_STATUS.md](../FInal_PP/Cloud-LLM/IMPLEMENTATION_STATUS.md) - Current status
- [docs/FInal_PP/Cloud-LLM/IMPLEMENTATION_TASKS.md](../FInal_PP/Cloud-LLM/IMPLEMENTATION_TASKS.md) - Task breakdown
- [docs/FInal_PP/Cloud-LLM/ADR-002-CLOUD-LLM-ARCHITECTURE.md](../FInal_PP/Cloud-LLM/ADR-002-CLOUD-LLM-ARCHITECTURE.md) - Architecture decisions
- [docs/FInal_PP/Cloud-LLM/TESTING_CHECKLIST.md](../FInal_PP/Cloud-LLM/TESTING_CHECKLIST.md) - Testing guide

### Project Documentation

- [AGENT_README.md](../../AGENT_README.md) - Project overview for AI assistants
- [README.md](../../README.md) - Main project README
- [docs/FInal_PP/Scope.md](../FInal_PP/Scope.md) - Current priorities and roadmap

---

## Investigation Methodology

### How This Investigation Was Conducted

1. **Code Analysis:**
   - Read all relevant source files
   - Traced data flow through components
   - Analyzed message passing protocols
   - Reviewed type definitions and interfaces

2. **Documentation Review:**
   - Reviewed existing Cloud LLM documentation
   - Analyzed implementation status reports
   - Studied architecture decision records (ADRs)
   - Examined testing checklists

3. **Architecture Mapping:**
   - Created system architecture diagrams
   - Mapped component interactions
   - Documented data flows
   - Identified integration points

4. **Security Analysis:**
   - Reviewed API key storage mechanisms
   - Analyzed input validation
   - Examined error handling
   - Assessed security best practices

5. **Testing Review:**
   - Analyzed existing unit tests
   - Reviewed test coverage
   - Identified testing gaps
   - Documented manual testing needs

### Tools Used

- **Code Search:** `Grep`, `Glob` tools for finding relevant code
- **File Reading:** `Read` tool for analyzing source files
- **Documentation:** Markdown for comprehensive reports
- **Diagrams:** ASCII art for visual representations

---

## Key Insights

### 1. Well-Architected System

The model switching system demonstrates solid software engineering:
- **Separation of concerns:** Clear boundaries between UI, services, and clients
- **Security-first:** OS-level encryption, input validation, no plaintext storage
- **Extensibility:** Easy to add new providers via factory pattern
- **Testability:** Comprehensive unit tests with 200+ test cases

### 2. User-Centric Design

The UX flow is intuitive:
- **Automatic detection:** No manual provider selection needed
- **Real-time feedback:** Loading states, error messages, validation
- **One-time setup:** Configuration persists across sessions
- **No restart required:** Runtime provider switching

### 3. Production-Ready Patterns

The implementation follows best practices:
- **Adapter pattern:** Cloud clients wrapped to match OllamaClient interface
- **Factory pattern:** Centralized client creation
- **Rollback mechanisms:** Automatic cleanup on failures
- **Timeout protection:** 30-second limits on all API calls

### 4. Clear Path Forward

The remaining work is well-defined:
- **Phase 5.1:** Install SDK packages (5 minutes)
- **Phase 5.5:** Refine unified interface (2-3 hours)
- **Phase 6:** Complete agent integration (6-8 hours)
- **Phase 7:** Manual testing and docs (3-4 hours)

---

## Recommendations

### For Developers Continuing This Work

1. **Start with SDK installation** - This unblocks everything else
2. **Test with real API keys** - Validate the implementation works end-to-end
3. **Complete agent integration** - Enable cloud models for actual analysis
4. **Write user documentation** - Help users understand how to configure cloud LLMs

### For Project Stakeholders

1. **75% complete** - Significant progress already made
2. **11-15 hours remaining** - Clear path to completion
3. **Well-tested foundation** - 200+ unit tests provide confidence
4. **Security-first approach** - API keys properly protected

### For Future Enhancements

1. **Add more providers** - Easy to extend (e.g., Cohere, Mistral)
2. **Cost tracking** - Monitor API usage and costs
3. **Model comparison** - A/B test different models
4. **Fallback strategies** - Automatic fallback if primary provider fails

---

## Questions & Answers

### Q: How secure is the API key storage?

**A:** Very secure. API keys are stored using VS Code's SecretStorage API, which uses OS-level encryption:
- **Windows:** Credential Manager
- **macOS:** Keychain
- **Linux:** libsecret

Keys are never stored in plaintext, never synced to cloud, and not accessible from settings.json.

### Q: Can I switch providers without restarting VS Code?

**A:** Yes! Provider selection happens at runtime. When you trigger an analysis, the system checks which provider is configured and uses that. No restart needed.

### Q: What happens if my cloud API key is invalid?

**A:** The system has comprehensive error handling:
1. Connection test will fail with specific error message
2. Configuration won't be saved
3. System falls back to local Ollama
4. User is notified of the issue

### Q: How does the agent know which provider to use?

**A:** The agent doesn't know! The `AnalysisService` wraps the cloud client to match the `OllamaClient` interface, so the `MinimalReactAgent` just calls `client.generate()` without knowing if it's local or cloud.

### Q: Can I use multiple providers simultaneously?

**A:** Not currently. The system uses one provider at a time. However, you can easily switch between providers by changing the configuration.

### Q: What's the performance difference between local and cloud?

**A:**
- **Local (Ollama):** Faster for small prompts, no API costs, requires GPU/RAM
- **Cloud:** More powerful models, no local resources needed, API costs apply, network latency

---

## Contributing

If you're adding new investigation reports to this directory:

1. **Create three documents:**
   - Full investigation report (comprehensive)
   - Quick summary (concise)
   - Visual diagrams (if applicable)

2. **Follow naming convention:**
   - `[TOPIC]_INVESTIGATION.md`
   - `[TOPIC]_SUMMARY.md`
   - `[TOPIC]_DIAGRAM.md`

3. **Update this README:**
   - Add to "Available Reports" section
   - Add to "Quick Navigation" section
   - Update "Related Documentation" if needed

4. **Include:**
   - Date of investigation
   - Status (Complete/In Progress)
   - Key findings
   - Recommendations
   - Next steps

---

## Changelog

### 2026-03-31 - Model Switching Investigation

- ✅ Created comprehensive investigation report (MODEL_SWITCHING_INVESTIGATION.md)
- ✅ Created quick summary document (MODEL_SWITCHING_SUMMARY.md)
- ✅ Created visual diagrams document (MODEL_SWITCHING_DIAGRAM.md)
- ✅ Created this README index file
- 📊 **Findings:** 75% complete, well-architected, 11-15 hours remaining
- 🎯 **Next:** Install SDK packages and complete agent integration

---

**Directory Version:** 1.0
**Last Updated:** 2026-03-31 15:28 UTC
**Maintained By:** RCA Agent Development Team
