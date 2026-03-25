# Implementation Checklist

**Last Updated:** 2026-03-25
**Status:** Phase 0-1 Complete (85%)
**See:** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed instructions

---

## Phase 0 — Unblock Tooling (30 min) ✅ COMPLETE

- [x] **Fix TypeScript compilation errors**
  - Fixed ErrorParser.parse() call in `scripts/test-fix-generation.ts`
  - Removed unused type imports and variables
  - **Test:** `npx tsc --noEmit` passes for all Phase 0-1 files ✅

---

## Phase 1 — Context Continuity (6-9 hours) ✅ COMPLETE

- [x] **1.1 RCA Context Injection** (4-6 hours)
  - Implemented in `src/agent/ConversationManager.ts` (lines 237, 440)
  - Added fetchRcaContext() and convertRcaDocument() methods
  - Fetches RCA from ChromaDB using `activeRcaId`
  - **Test:** Ready for manual testing - Follow-up questions will reference previous RCA

- [x] **1.2 Chat History Hydration** (2-3 hours)
  - Implemented in `vscode-extension/src/webview/RCAWebviewProvider.ts` (line 1815)
  - Added getSessionById() to ConversationalAgent
  - Loads from ConversationalAgent session store
  - **Test:** Ready for manual testing - Reopening webview should restore chat history

---

## Phase 2 — Fix Quality (9-13 hours) 🔴 HIGH

- [ ] **2.1 Upgrade Diff Algorithm** (3-4 hours)
  - Implement in `src/utils/DiffFormatter.ts` (line 188)
  - Use `diff` library (Myers algorithm)
  - **Test:** Multiline edits show correct diffs

- [ ] **2.2 Syntax Validation** (4-6 hours)
  - Implement in `src/agent/FixGenerator.ts` (line 506)
  - Add language-aware validation (kotlinc, javac, TypeScript)
  - **Test:** Invalid syntax fixes are rejected

- [ ] **2.3 Fix Explanations** (2-3 hours)
  - Implement in `src/agent/FixGenerator.ts` (line 583)
  - Use LLM to generate explanations
  - **Test:** Every fix includes clear explanation

---

## Phase 3 — Detection Hardening (8-11 hours) 🟡 MEDIUM

- [ ] **3.1 Automatic Terminal Capture** (6-8 hours)
  - Enhance `vscode-extension/src/services/AdvancedErrorDetector.ts`
  - Add task execution listeners or PTY integration
  - **Test:** Build errors detected automatically

- [ ] **3.2 Deduplication** (2-3 hours)
  - Update `ErrorQueueManager` dedup logic
  - Merge same error from multiple sources
  - **Test:** Same error appears once

---

## Phase 4 — Polish (3-5 hours) 🟢 LOW

- [ ] **4.1 Cancellation Integrity**
  - Verify cancel propagates to all async operations
  - **Test:** Cancel stops backend work immediately

- [ ] **4.2 UI Sync**
  - Surface agent actions in webview
  - Fix race conditions
  - **Test:** No ghost items or double-starts

---

## Testing Gates (Run After Each Phase)

- [x] `npx tsc --noEmit` passes (Phase 0-1 files clean)
- [x] `npm run lint` passes
- [x] Extension compiles successfully
- [ ] Manual testing in VS Code (F5)
- [x] Checklist updated

---

## Progress Tracking

**MVP (Phases 0-2):** 16-23 hours (~2-3 days)
**Full (Phases 0-4):** 27-38 hours (~3-5 days)

**Current Phase:** Phase 2 (Fix Quality) - Ready to start
**Completed:** Phase 0 (30 min) ✅ | Phase 1 (6-9 hours) ✅
**Next Phase:** Phase 2 - Diff Algorithm, Syntax Validation, Fix Explanations
