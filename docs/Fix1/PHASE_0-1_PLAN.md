# Phase 0-1 Implementation Plan

**Created:** 2026-03-25
**Status:** Ready to Execute
**Total Time:** 6.5-9.5 hours
**Priority:** 🔴 CRITICAL PATH

---

## Overview

This plan covers the foundational work needed to unblock development and implement critical context continuity features for the RCA Agent.

**Phase 0** removes compilation blockers (30 min)
**Phase 1** enables context-aware conversations (6-9 hours)

---

## Phase 0: Unblock Tooling (30 min) 🔴 BLOCKER

### Current State
- 9 TypeScript compilation errors
- Cannot run tests or validate code changes
- Blocks all downstream work

### Errors to Fix

#### 1. ErrorParser.parse() Method Missing
**File:** `scripts/test-fix-generation.ts:57`
**Error:** `Property 'parse' does not exist on type 'typeof ErrorParser'`

**Action:**
- Check ErrorParser class implementation
- Either add missing `parse()` method or fix the call site
- Likely needs to instantiate ErrorParser first

#### 2. Unused Type Declarations
**File:** `src/agent/feedback/EnhancedFeedbackHandler.ts`
**Errors:**
- Line 13: `'LearningSignal' is declared but never used`
- Line 16: `'FeedbackCorrections' is declared but never used`

**Action:**
- Remove unused type declarations or export them if needed elsewhere
- Check if these are intended for future use

#### 3. Unused Variables
**File:** `src/agent/feedback/EnhancedFeedbackHandler.ts`
**Errors:**
- Line 72: `'classification' is declared but its value is never read`
- Line 110: `'explanation' is declared but its value is never read`
- Line 111: `'negativeCount' is declared but its value is never read`

**Action:**
- Prefix with underscore: `_classification`, `_explanation`, `_negativeCount`
- Or remove if truly unnecessary

#### 4. More Unused Type Declarations
**File:** `src/agent/feedback/FeedbackClassifier.ts`
**Errors:**
- Line 14: `'NegativeAspect' is declared but never used`
- Line 15: `'FeedbackDimensions' is declared but never used`

**Action:**
- Remove or export these types

#### 5. Unused Variable in RefinementHandler
**File:** `src/agent/handlers/RefinementHandler.ts:43`
**Error:** `'classification' is declared but its value is never read`

**Action:**
- Prefix with underscore or remove

### Implementation Steps

```bash
# 1. Fix ErrorParser issue
# Read the file to understand the problem
# Fix either the method or the call site

# 2. Fix unused declarations
# Remove or prefix with underscore

# 3. Validate
npx tsc --noEmit
# Must return 0 errors

# 4. Commit
git add .
git commit -m "Phase 0: Fix TypeScript compilation errors"
```

### Success Criteria
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] No new errors introduced
- [ ] Code still compiles and runs

### Time Estimate: 30 minutes

---

## Phase 1: Context Continuity (6-9 hours) 🔴 CRITICAL

### Current State
- Follow-up questions don't have access to RCA context
- Chat history doesn't persist across sessions
- Users must repeat context in every message

### Impact
- Poor user experience
- Agent appears to "forget" previous analysis
- Cannot have meaningful multi-turn conversations

---

## Phase 1.1: RCA Context Injection (4-6 hours)

### Problem
When users ask follow-up questions about an error, the agent doesn't have access to the previous RCA analysis. The code has TODOs at critical points.

### Files to Modify
- `src/agent/ConversationManager.ts` (lines 237, 440)

### Current Code (Line 237)
```typescript
const currentAnalysis = undefined;
if (context.activeRcaId) {
    // TODO: Fetch actual analysis from analysis store
}
```

### Implementation

#### Step 1: Import Dependencies
```typescript
import { AnalysisService } from '../../vscode-extension/src/services/AnalysisService';
import { logger } from '../utils/Logger';
```

#### Step 2: Implement Context Fetching (Line 237)
```typescript
let currentAnalysis = undefined;
if (context.activeRcaId) {
    try {
        const analysisService = AnalysisService.getInstance();
        const chromaDB = analysisService.getChromaDB();

        if (chromaDB) {
            currentAnalysis = await chromaDB.getById(context.activeRcaId);
            logger.debug(`[ConversationManager] Loaded RCA context: ${context.activeRcaId}`);
        } else {
            logger.warn('[ConversationManager] ChromaDB not available - context injection skipped');
        }
    } catch (error) {
        logger.error('[ConversationManager] Failed to fetch RCA context:', error);
        // Falls back to undefined - chat continues without context
    }
}
```

#### Step 3: Repeat for Line 440
Apply the same implementation at line 440 (likely in a different method).

#### Step 4: Add Context to System Prompt
Ensure the fetched `currentAnalysis` is properly injected into the system prompt:

```typescript
if (currentAnalysis) {
    systemPrompt += `\n\n## Current RCA Context\n`;
    systemPrompt += `**Error:** ${currentAnalysis.error}\n`;
    systemPrompt += `**Root Cause:** ${currentAnalysis.rootCause}\n`;
    systemPrompt += `**Analysis:** ${currentAnalysis.analysis}\n`;
    systemPrompt += `\nUse this context to answer follow-up questions.\n`;
}
```

### Testing

#### Manual Test
1. Trigger error analysis on a file with an error
2. Wait for RCA to complete
3. Ask follow-up question: "Tell me more about this error"
4. Verify agent response references the RCA data
5. Ask: "What was the root cause?" - should answer without re-analysis

#### Debug Verification
```typescript
// Add temporary logging
console.log('[DEBUG] activeRcaId:', context.activeRcaId);
console.log('[DEBUG] currentAnalysis:', currentAnalysis ? 'LOADED' : 'NOT LOADED');
```

#### Edge Cases to Test
- [ ] No active RCA (should work normally)
- [ ] Invalid RCA ID (should fallback gracefully)
- [ ] ChromaDB unavailable (should fallback gracefully)
- [ ] Multiple RCAs in session (should load correct one)

### Success Criteria
- [ ] Follow-up questions reference previous RCA
- [ ] No errors in console when loading context
- [ ] Graceful fallback when context unavailable
- [ ] Debug logs confirm context loading

### Time Estimate: 4-6 hours

---

## Phase 1.2: Chat History Hydration (2-3 hours)

### Problem
When users close and reopen the webview, all chat history is lost. The handler always returns an empty array.

### Files to Modify
- `vscode-extension/src/webview/RCAWebviewProvider.ts` (line 1815)

### Current Code (Line 1815)
```typescript
private async _handleConversationGetHistory(data: any) {
    this._sendMessage({
        type: 'conversation.history',
        data: { messages: [] }  // Always empty!
    });
}
```

### Implementation

#### Step 1: Understand the Data Flow
1. Frontend requests history with `sessionId`
2. Backend should fetch from `ConversationManager`
3. Return messages array to frontend

#### Step 2: Implement History Loading
```typescript
private async _handleConversationGetHistory(data: any) {
    try {
        const { sessionId } = data;

        // Validate sessionId
        if (!sessionId) {
            logger.warn('[RCAWebviewProvider] No sessionId provided for history request');
            this._sendMessage({
                type: 'conversation.history',
                data: { messages: [] }
            });
            return;
        }

        // Get conversation manager
        const conversationManager = this._getConversationManager();
        if (!conversationManager) {
            logger.error('[RCAWebviewProvider] ConversationManager not available');
            this._sendMessage({
                type: 'conversation.history',
                data: { messages: [] }
            });
            return;
        }

        // Fetch history
        const messages = await conversationManager.getSessionHistory(sessionId);

        logger.debug(`[RCAWebviewProvider] Loaded ${messages.length} messages for session ${sessionId}`);

        this._sendMessage({
            type: 'conversation.history',
            data: { messages }
        });
    } catch (error) {
        logger.error('[RCAWebviewProvider] Failed to get conversation history:', error);

        // Fallback to empty history
        this._sendMessage({
            type: 'conversation.history',
            data: { messages: [] }
        });
    }
}
```

#### Step 3: Verify ConversationManager Method Exists
Check if `getSessionHistory()` method exists in ConversationManager:

```typescript
// In ConversationManager.ts
public async getSessionHistory(sessionId: string): Promise<Message[]> {
    // Implementation should already exist
    // If not, need to add it
}
```

### Testing

#### Manual Test
1. Start a chat session
2. Send 3-4 messages back and forth
3. Note the sessionId from console
4. Close the webview panel
5. Reopen the webview
6. Verify chat history is restored with all messages

#### Debug Verification
```typescript
// Add temporary logging
console.log('[DEBUG] History request for sessionId:', sessionId);
console.log('[DEBUG] Loaded messages count:', messages.length);
console.log('[DEBUG] First message:', messages[0]);
```

#### Edge Cases to Test
- [ ] New session (no history) - should return empty array
- [ ] Invalid sessionId - should return empty array
- [ ] Very long history (100+ messages) - should load all
- [ ] Session with only system messages - should include them

### Success Criteria
- [ ] Chat history persists after webview reload
- [ ] All messages restored in correct order
- [ ] No duplicate messages
- [ ] Graceful fallback on errors

### Time Estimate: 2-3 hours

---

## Testing Gates (After Phase 0-1)

### Automated Tests
```bash
# 1. TypeScript compilation
npx tsc --noEmit
# Expected: 0 errors

# 2. Linting
npm run lint
# Expected: No critical errors

# 3. Build extension
cd vscode-extension
npm run compile
# Expected: Successful build
```

### Manual Testing Checklist

#### Phase 0 Validation
- [ ] TypeScript compiles without errors
- [ ] Extension loads in VS Code (F5)
- [ ] No console errors on startup

#### Phase 1.1 Validation (Context Injection)
- [ ] Trigger error analysis
- [ ] Wait for RCA completion
- [ ] Ask: "What was the root cause?"
- [ ] Verify: Agent answers without re-analyzing
- [ ] Ask: "Tell me more about this error"
- [ ] Verify: Response references specific error details

#### Phase 1.2 Validation (Chat History)
- [ ] Start new chat session
- [ ] Send 3 messages
- [ ] Close webview
- [ ] Reopen webview
- [ ] Verify: All 3 messages restored
- [ ] Send another message
- [ ] Verify: Conversation continues naturally

### Integration Testing
- [ ] Analyze error → Ask follow-up → Close → Reopen → Continue conversation
- [ ] Multiple RCA sessions → Switch between them → Context switches correctly
- [ ] Long conversation (20+ messages) → History loads completely

---

## Rollback Plan

### Before Starting
```bash
# Create backup
git checkout -b backup-phase-0-1
git push origin backup-phase-0-1

# Create working branch
git checkout -b phase-0-1-implementation
```

### If Phase 0 Fails
```bash
# Rollback TypeScript fixes
git reset --hard HEAD~1

# Or rollback specific file
git checkout HEAD -- src/agent/feedback/EnhancedFeedbackHandler.ts
```

### If Phase 1.1 Fails
```typescript
// Context injection has built-in fallback
// If it breaks chat entirely, rollback:
git checkout HEAD -- src/agent/ConversationManager.ts
```

### If Phase 1.2 Fails
```typescript
// History loading has built-in fallback
// If it breaks webview, rollback:
git checkout HEAD -- vscode-extension/src/webview/RCAWebviewProvider.ts
```

### Emergency Recovery
```bash
# Nuclear option - return to backup
git checkout backup-phase-0-1
git checkout -b phase-0-1-implementation-v2
```

---

## Success Metrics

### Phase 0 Success
- ✅ 0 TypeScript errors
- ✅ Extension compiles and loads
- ✅ No regressions in existing functionality

### Phase 1 Success
- ✅ Follow-up questions work without re-analysis
- ✅ Chat history persists across sessions
- ✅ No console errors during normal operation
- ✅ Graceful degradation when services unavailable

### Overall Success
- ✅ All automated tests pass
- ✅ All manual tests pass
- ✅ Code committed with clear messages
- ✅ Documentation updated

---

## Next Steps After Phase 0-1

Once Phase 0-1 is complete, proceed to Phase 2:
- Upgrade diff algorithm (3-4 hours)
- Add syntax validation (4-6 hours)
- Implement fix explanations (2-3 hours)

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for Phase 2 details.

---

## Notes

- **Commit frequently** - After each sub-task
- **Test incrementally** - Don't wait until the end
- **Log everything** - Helps with debugging
- **Fallbacks are critical** - Every feature must degrade gracefully
- **Ask questions** - If anything is unclear, stop and clarify

---

**Status:** ✅ Ready to Execute
**Next Action:** Start Phase 0 - Fix TypeScript errors
**Estimated Completion:** 6.5-9.5 hours total
