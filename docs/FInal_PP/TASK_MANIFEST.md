# Dashboard Improvement - Task Manifest

**Phase**: 1 - Critical Bug Fixes
**Total Time**: 10.5 hours
**Tasks**: 7 fixes
**Execution**: Mixed (parallel + sequential)

---

## Phase 1 Overview

| Fix | Priority | Time | Dependencies | Status |
|-----|----------|------|--------------|--------|
| Fix 1 | P0 | 2h | None | Pending |
| Fix 2 | P0 | 1.5h | None | Pending |
| Fix 3 | P0 | 1h | None | Pending |
| Fix 4 | P1 | 1.5h | Fix 1 | Pending |
| Fix 5 | P1 | 2h | Fix 2 | Pending |
| Fix 6 | P1 | 1.5h | Fix 3 | Pending |
| Fix 7 | P2 | 1h | Fix 4, 5, 6 | Pending |

**Execution Strategy**:
- **Wave 1** (Parallel): Fix 1, 2, 3 (4.5h total, can run concurrently)
- **Wave 2** (Parallel): Fix 4, 5, 6 (5h total, after Wave 1)
- **Wave 3** (Sequential): Fix 7 (1h, after Wave 2)

---

## Dependency Graph

```
Wave 1 (Parallel - No Dependencies):
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Fix 1   │  │ Fix 2   │  │ Fix 3   │
│ (2h)    │  │ (1.5h)  │  │ (1h)    │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     ▼            ▼            ▼
Wave 2 (Parallel - Depends on Wave 1):
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Fix 4   │  │ Fix 5   │  │ Fix 6   │
│ (1.5h)  │  │ (2h)    │  │ (1.5h)  │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────┬───┴────────────┘
              ▼
Wave 3 (Sequential - Depends on Wave 2):
         ┌─────────┐
         │ Fix 7   │
         │ (1h)    │
         └─────────┘
```

---

## Fix Details

### Fix 1: Diff Algorithm Accuracy (P0, 2h)
**Problem**: Incorrect line mapping causing misaligned suggestions
**Files**:
- `src/utils/DiffFormatter.ts` (primary)
- `scripts/test-diff-algorithm.ts` (test)
**Changes**:
- Replace simple line-by-line diff with Myers algorithm
- Add context-aware line matching
- Handle whitespace normalization
**Verification**: `npm run test:diff`

### Fix 2: Dataset Validation (P0, 1.5h)
**Problem**: Missing validation allows corrupted data
**Files**:
- `scripts/test-dataset-validation.ts` (primary)
- `src/types/dataset.ts` (types)
**Changes**:
- Add Zod schema validation
- Implement file existence checks
- Add error reporting
**Verification**: `npm run validate:dataset`

### Fix 3: Fix Minimality (P0, 1h)
**Problem**: Suggestions include unnecessary changes
**Files**:
- `src/agent/FixGenerator.ts` (primary)
- `scripts/test-fix-minimal.ts` (test)
**Changes**:
- Filter unchanged lines from suggestions
- Optimize context window
- Add minimality scoring
**Verification**: `npm run test:minimal`

### Fix 4: RCA Context Injection (P1, 1.5h)
**Problem**: Missing root cause analysis in prompts
**Files**:
- `src/agent/FixGenerator.ts` (primary)
- `src/types/rca.ts` (types)
**Changes**:
- Add RCA field to prompt template
- Inject analysis before code context
- Update prompt structure
**Dependencies**: Fix 1 (uses DiffFormatter)
**Verification**: Check prompt includes RCA section

### Fix 5: Chat History Hydration (P1, 2h)
**Problem**: Lost conversation context on reload
**Files**:
- `vscode-extension/webview/src/components/FixSuggestion.tsx` (primary)
- `vscode-extension/src/extension.ts` (state management)
**Changes**:
- Persist chat to workspace state
- Restore on webview reload
- Add hydration indicator
**Dependencies**: Fix 2 (validates persisted data)
**Verification**: Reload webview, check history

### Fix 6: Syntax Highlighting (P1, 1.5h)
**Problem**: Plain text code blocks hard to read
**Files**:
- `vscode-extension/webview/src/components/FixSuggestion.tsx` (primary)
- `vscode-extension/webview/package.json` (dependencies)
**Changes**:
- Add Prism.js or Shiki
- Apply language-specific highlighting
- Style diff markers
**Dependencies**: Fix 3 (minimal fixes easier to highlight)
**Verification**: Visual inspection of code blocks

### Fix 7: Acceptance Workflow (P2, 1h)
**Problem**: No clear way to accept/reject fixes
**Files**:
- `vscode-extension/webview/src/components/FixSuggestion.tsx` (primary)
- `vscode-extension/src/extension.ts` (apply logic)
**Changes**:
- Add Accept/Reject buttons
- Implement apply-to-file logic
- Add confirmation dialog
**Dependencies**: Fix 4, 5, 6 (complete UI foundation)
**Verification**: Click Accept, check file updated

---

## File Locations Quick Reference

**Core Logic**:
- `src/agent/FixGenerator.ts` - Fix generation (Fix 3, 4)
- `src/utils/DiffFormatter.ts` - Diff algorithm (Fix 1)

**Validation & Testing**:
- `scripts/test-dataset-validation.ts` - Dataset checks (Fix 2)
- `scripts/test-diff-algorithm.ts` - Diff tests (Fix 1)
- `scripts/test-fix-minimal.ts` - Minimality tests (Fix 3)

**UI Components**:
- `vscode-extension/webview/src/components/FixSuggestion.tsx` - Dashboard (Fix 5, 6, 7)
- `vscode-extension/src/extension.ts` - Extension logic (Fix 5, 7)

**Type Definitions**:
- `src/types/dataset.ts` - Dataset types (Fix 2)
- `src/types/rca.ts` - RCA types (Fix 4)

---

## Verification Commands

```bash
# Fix 1: Diff Algorithm
npm run test:diff

# Fix 2: Dataset Validation
npm run validate:dataset

# Fix 3: Fix Minimality
npm run test:minimal

# Fix 4: RCA Context (manual)
# Check prompt output includes RCA section

# Fix 5: Chat History (manual)
# 1. Open dashboard
# 2. Generate fix
# 3. Reload webview
# 4. Verify history persists

# Fix 6: Syntax Highlighting (manual)
# Visual inspection of code blocks

# Fix 7: Acceptance Workflow (manual)
# 1. Click Accept button
# 2. Verify file updated
# 3. Check confirmation dialog
```

---

## Execution Recommendations

1. **Start with Wave 1** (Fix 1, 2, 3) - These are independent and can be done in parallel
2. **Verify each fix** before moving to next wave
3. **Wave 2** (Fix 4, 5, 6) requires Wave 1 completion
4. **Wave 3** (Fix 7) is the final integration

**Time Optimization**:
- If working solo: 10.5h sequential
- If working in team of 3: ~6h with parallel execution

---

## Success Criteria

- [ ] All 7 fixes implemented
- [ ] All automated tests passing
- [ ] Manual verification completed
- [ ] No regression in existing functionality
- [ ] Code reviewed and merged

---

## Help & Resources

- **Entry Point**: `docs/FInal_PP/README.md`
- **Detailed Guides**: `docs/FInal_PP/archive/QUICK_START_GUIDE.md`
- **Implementation Details**: See individual fix sections above
