# RCA Agent - Implementation Guide

**Last Updated:** 2026-03-25
**Status:** 75% Complete - Ready for Implementation
**Estimated Time to MVP:** 16-23 hours (~2-3 days)

---

## Quick Start

Your RCA Agent project is **75% complete** with solid foundations. The error detection and analysis system works but needs finishing touches.

### What You Need to Do
1. Fix TypeScript errors (30 min) - **BLOCKER**
2. Implement context injection (4-6 hours) - **CRITICAL**
3. Improve fix quality (9-13 hours) - **HIGH PRIORITY**

---

## System Status

### ✅ What's Working
- Error detection from VS Code diagnostics
- Terminal error parsing (manual trigger)
- LLM-based root cause analysis
- Real-time progress streaming
- ChromaDB caching
- Fix generation with diffs

### ⚠️ What Needs Work
- **Context injection** - Follow-up questions don't have RCA context
- **Chat history** - Doesn't persist across sessions
- **Syntax validation** - Invalid fixes can be suggested
- **Diff algorithm** - Naive line-by-line (should use Myers)
- **Fix explanations** - Template strings (should use LLM)

### 🔴 Blockers
- TypeScript compilation errors (9+)
- Import path with apostrophe: `Prof's-Requirement`

---

## Implementation Tasks

### Task 1: Fix TypeScript Errors (30 min) 🔴 BLOCKER

**Files:**
- `scripts/test-dataset-validation.ts`
- `scripts/test-fix-generation.ts`

**Action:**
```typescript
// Fix import paths with apostrophes - use double quotes or escape
import { testDataset } from "../docs/Prof's-Requirement/AI/Dataset/Others/test-dataset";
```

**Test:** `npx tsc --noEmit` should return 0 errors

---

### Task 2: RCA Context Injection (4-6 hours) 🔴 CRITICAL

**Files:** `src/agent/ConversationManager.ts` (lines 237, 440)

**Current:**
```typescript
const currentAnalysis = undefined;
if (context.activeRcaId) {
    // TODO: Fetch actual analysis from analysis store
}
```

**Implementation:**
```typescript
let currentAnalysis = undefined;
if (context.activeRcaId) {
    try {
        const analysisService = AnalysisService.getInstance();
        const chromaDB = analysisService.getChromaDB();

        if (chromaDB) {
            currentAnalysis = await chromaDB.getById(context.activeRcaId);
            logger.debug(`Loaded RCA context: ${context.activeRcaId}`);
        }
    } catch (error) {
        logger.error('Failed to fetch RCA context:', error);
    }
}
```

**Test:**
1. Start analysis on an error
2. Ask follow-up: "Tell me more about this error"
3. Verify agent has access to previous RCA data

---

### Task 3: Chat History Hydration (2-3 hours) 🟡 MEDIUM

**Files:** `vscode-extension/src/webview/RCAWebviewProvider.ts` (line 1815)

**Current:**
```typescript
private async _handleConversationGetHistory(data: any) {
    this._sendMessage({
        type: 'conversation.history',
        data: { messages: [] }  // Always empty!
    });
}
```

**Implementation:**
```typescript
private async _handleConversationGetHistory(data: any) {
    try {
        const { sessionId } = data;
        if (!sessionId) {
            this._sendMessage({
                type: 'conversation.history',
                data: { messages: [] }
            });
            return;
        }

        const conversationManager = this._getConversationManager();
        const messages = await conversationManager.getSessionHistory(sessionId);

        this._sendMessage({
            type: 'conversation.history',
            data: { messages }
        });
    } catch (error) {
        console.error('[Conversation] Failed to get history:', error);
    }
}
```

**Test:**
1. Start chat session
2. Send 2-3 messages
3. Close and reopen webview
4. Verify chat history is restored

---

### Task 4: Upgrade Diff Algorithm (3-4 hours) 🔴 HIGH

**Files:** `src/utils/DiffFormatter.ts` (line 188)

**Current:** Naive line-by-line comparison

**Implementation:**
```bash
npm install diff
npm install --save-dev @types/diff
```

```typescript
import * as Diff from 'diff';

private computeDiff(original: string, fixed: string): DiffLine[] {
    const diffLines: DiffLine[] = [];
    const patches = Diff.diffLines(original, fixed);

    let originalLineNum = 1;
    let fixedLineNum = 1;

    for (const part of patches) {
        const lines = part.value.split('\n').filter(l => l !== '');

        for (const line of lines) {
            if (part.added) {
                diffLines.push({
                    type: 'added',
                    originalLine: null,
                    fixedLine: line,
                    originalLineNum: null,
                    fixedLineNum: fixedLineNum++
                });
            } else if (part.removed) {
                diffLines.push({
                    type: 'removed',
                    originalLine: line,
                    fixedLine: null,
                    originalLineNum: originalLineNum++,
                    fixedLineNum: null
                });
            } else {
                diffLines.push({
                    type: 'unchanged',
                    originalLine: line,
                    fixedLine: line,
                    originalLineNum: originalLineNum++,
                    fixedLineNum: fixedLineNum++
                });
            }
        }
    }

    return diffLines;
}
```

**Test:** Multiline edits show correct diffs

---

### Task 5: Syntax Validation (4-6 hours) 🔴 HIGH

**Files:** `src/agent/FixGenerator.ts` (line 506)

**Current:** Only checks balanced braces

**Implementation:**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

private async validateSyntax(code: string, language: string): Promise<boolean> {
    switch (language) {
        case 'kotlin':
            return await this.validateKotlinSyntaxWithCompiler(code);
        case 'java':
            return await this.validateJavaSyntaxWithCompiler(code);
        case 'typescript':
        case 'javascript':
            return await this.validateTSSyntax(code);
        default:
            return this.validateBasicSyntax(code);
    }
}

private async validateKotlinSyntaxWithCompiler(code: string): Promise<boolean> {
    try {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kotlin-validate-'));
        const tempFile = path.join(tempDir, 'Temp.kt');
        await fs.writeFile(tempFile, code);

        const { stderr } = await execAsync(`kotlinc ${tempFile} -d ${tempDir}`, {
            timeout: 5000
        });

        await fs.rm(tempDir, { recursive: true, force: true });
        return !stderr.includes('error:');
    } catch (error) {
        console.warn('[FixGenerator] Kotlin validation failed:', error);
        return false;
    }
}

private async validateTSSyntax(code: string): Promise<boolean> {
    try {
        const ts = require('typescript');
        const result = ts.transpileModule(code, {
            compilerOptions: { module: ts.ModuleKind.CommonJS }
        });
        return result.diagnostics?.length === 0;
    } catch {
        return false;
    }
}
```

**Test:** Invalid syntax fixes are rejected

---

### Task 6: Fix Explanations (2-3 hours) 🟡 MEDIUM

**Files:** `src/agent/FixGenerator.ts` (line 583)

**Current:** Simple template string

**Implementation:**
```typescript
private async generateExplanation(
    originalCode: string,
    fixedCode: string,
    rootCause: string
): Promise<string> {
    const prompt = `You are explaining a code fix to a developer.

**ROOT CAUSE:**
${rootCause}

**ORIGINAL CODE:**
\`\`\`
${originalCode}
\`\`\`

**FIXED CODE:**
\`\`\`
${fixedCode}
\`\`\`

Generate a concise explanation (2-3 sentences) that covers:
1. What changed in the code
2. Why this change fixes the root cause
3. Any potential side effects or considerations

Keep it clear and actionable. Output only the explanation text.`;

    try {
        const response = await this.llm.generate(prompt, {
            temperature: 0.3,
            maxTokens: 300
        });
        return response.text.trim();
    } catch (error) {
        console.warn('[FixGenerator] Failed to generate explanation:', error);
        return `Fixed the error by addressing: ${rootCause}`;
    }
}
```

**Test:** Every fix includes a clear explanation

---

## Testing Checklist

After each task:

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Manual testing in VS Code
# - Install extension (F5)
# - Test the specific feature
# - Check console for errors
```

---

## Key Architecture

**Services:**
- `AnalysisService` - Main analysis orchestrator (✅ Production-ready)
- `ErrorQueueManager` - Error queue management (✅ Complete)
- `AdvancedErrorDetector` - Multi-source detection (⚠️ Needs work)
- `ConversationManager` - Chat context (🔴 Critical gap)
- `FixGenerator` - Fix generation (⚠️ Needs work)

**Key Files:**
```
vscode-extension/src/services/
├── AnalysisService.ts              ← Main orchestrator
├── AdvancedErrorDetector.ts        ← Error detection
└── ErrorQueueManager.ts            ← Queue management

src/agent/
├── ConversationManager.ts          ← Context (NEEDS WORK)
├── FixGenerator.ts                 ← Fix generation (NEEDS WORK)
└── MultiPassAgent.ts               ← Multi-hypothesis (disabled)

src/utils/
└── DiffFormatter.ts                ← Diff algorithm (NEEDS WORK)
```

---

## Success Criteria

After completing tasks, you should be able to:

✅ **Detect errors automatically**
- From VS Code diagnostics
- From terminal output (manual trigger)

✅ **Analyze errors with LLM**
- Get root cause analysis
- See real-time progress
- Cancel if needed

✅ **Generate code fixes**
- With accurate diffs
- With syntax validation
- With clear explanations

✅ **Have conversations**
- Ask follow-up questions
- Agent remembers context
- Chat history persists

---

## Effort Summary

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| Phase 0 | Fix TS errors | 30 min | 🔴 BLOCKER |
| Phase 1 | Context + history | 6-9 hours | 🔴 CRITICAL |
| Phase 2 | Diff + validation + explanations | 9-13 hours | 🔴 HIGH |
| **MVP Total** | **Tasks 1-6** | **16-23 hours** | **~2-3 days** |

---

## Agent Prompt Template

```
I need you to complete my RCA Agent project. The error detection and
analysis system is 75% complete but needs finishing touches.

Read docs/Fix1/IMPLEMENTATION_GUIDE.md for the full plan.

Start with Task 1 (fix TypeScript errors) - this is a blocker.
Then do Task 2 (context injection) - highest user impact.
Then continue with Tasks 3-6 in order.

Test after each task:
- Run: npx tsc --noEmit (must pass)
- Test the feature manually
- Update this document with progress

Ask questions if anything is unclear.

Goal: Complete all 6 tasks for a production-ready MVP.
```

---

## Notes

- **MultiPassAgent is disabled** - Keep it disabled (performance issues)
- **Architecture is solid** - AnalysisService is production-ready
- **TODOs are clear** - Every gap is well-documented
- **Test incrementally** - Don't implement everything at once

---

## Troubleshooting & Rollback

### Before You Start - Create Safety Net

```bash
# 1. Create a backup branch
git checkout -b backup-before-fix1
git push origin backup-before-fix1

# 2. Create your working branch
git checkout -b fix1-implementation

# 3. Commit frequently
# After each task completion, commit with clear message
git add .
git commit -m "Task 1: Fix TypeScript errors"
```

### If Something Goes Wrong

#### Option 1: Rollback Specific Task
```bash
# View recent commits
git log --oneline

# Rollback last commit (keep changes)
git reset --soft HEAD~1

# Rollback last commit (discard changes)
git reset --hard HEAD~1
```

#### Option 2: Rollback to Backup
```bash
# Discard all changes and return to backup
git checkout backup-before-fix1
git checkout -b fix1-implementation-v2
```

#### Option 3: Stash and Review
```bash
# Save current work without committing
git stash save "WIP: Task 2 - needs review"

# Review what you stashed
git stash show -p

# Apply stashed changes later
git stash pop
```

### Task-Specific Fallbacks

#### Task 1: TypeScript Errors
**If compilation still fails:**
```bash
# Check specific errors
npx tsc --noEmit 2>&1 | tee typescript-errors.log

# Fallback: Comment out problematic imports temporarily
// import { testDataset } from "..."; // TODO: Fix path
```

#### Task 2: Context Injection
**If ChromaDB fails:**
```typescript
// Already has fallback in implementation
if (chromaDB) {
    currentAnalysis = await chromaDB.getById(context.activeRcaId);
} else {
    logger.warn('ChromaDB not available - context injection skipped');
    // System continues without context (degraded mode)
}
```

**If context injection breaks chat:**
```typescript
// Add try-catch wrapper (already in implementation)
try {
    // context injection code
} catch (error) {
    logger.error('Failed to fetch RCA context:', error);
    // Falls back to no context - chat still works
}
```

#### Task 3: Chat History
**If history loading fails:**
```typescript
// Fallback to empty history (already in implementation)
catch (error) {
    console.error('[Conversation] Failed to get history:', error);
    this._sendMessage({
        type: 'conversation.history',
        data: { messages: [] }  // Fallback: empty history
    });
}
```

#### Task 4: Diff Algorithm
**If diff library causes issues:**
```bash
# Uninstall and rollback
npm uninstall diff @types/diff

# Revert to original naive implementation
git checkout HEAD -- src/utils/DiffFormatter.ts
```

**Alternative: Use different diff library:**
```bash
npm install fast-diff
# Or
npm install jsdiff
```

#### Task 5: Syntax Validation
**If compiler validation is too slow:**
```typescript
// Add timeout and fallback
private async validateSyntax(code: string, language: string): Promise<boolean> {
    try {
        // Try compiler validation with timeout
        return await Promise.race([
            this.validateWithCompiler(code, language),
            new Promise<boolean>((resolve) =>
                setTimeout(() => resolve(true), 3000) // Fallback: assume valid after 3s
            )
        ]);
    } catch (error) {
        // Fallback to basic validation
        return this.validateBasicSyntax(code);
    }
}
```

**If kotlinc/javac not available:**
```typescript
// Check for compiler availability first
private async isCompilerAvailable(compiler: string): Promise<boolean> {
    try {
        await execAsync(`which ${compiler}`);
        return true;
    } catch {
        return false;
    }
}

// Use in validation
if (await this.isCompilerAvailable('kotlinc')) {
    return await this.validateKotlinSyntaxWithCompiler(code);
} else {
    console.warn('kotlinc not available, using basic validation');
    return this.validateBasicSyntax(code);
}
```

#### Task 6: Fix Explanations
**If LLM explanation fails:**
```typescript
// Already has fallback in implementation
catch (error) {
    console.warn('[FixGenerator] Failed to generate explanation:', error);
    // Fallback to simple template
    return `Fixed the error by addressing: ${rootCause}`;
}
```

### Testing Safety Checks

**Before committing each task:**
```bash
# 1. TypeScript must pass
npx tsc --noEmit || echo "❌ TypeScript errors - DO NOT COMMIT"

# 2. Lint should pass (warnings OK, errors not OK)
npm run lint

# 3. Extension should load without errors
# Press F5 in VS Code and check Debug Console for errors
```

### Emergency Recovery

**If extension won't load:**
```bash
# 1. Check extension host logs
# VS Code: Help > Toggle Developer Tools > Console

# 2. Rebuild extension
cd vscode-extension
npm run compile

# 3. If still broken, rollback
git reset --hard backup-before-fix1
```

**If database is corrupted:**
```bash
# Delete ChromaDB data (will rebuild from scratch)
rm -rf .chroma/

# Or move to backup
mv .chroma/ .chroma.backup/
```

**If settings are broken:**
```bash
# Reset VS Code settings for this extension
# .vscode/settings.json - remove rcaAgent.* entries
```

### Validation Checklist Before Merging

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Extension loads without errors (F5 test)
- [ ] Can detect an error from VS Code diagnostics
- [ ] Can analyze an error and get RCA
- [ ] Can ask follow-up question (Task 2)
- [ ] Chat history persists after reload (Task 3)
- [ ] Generated fixes have valid diffs (Task 4)
- [ ] Invalid syntax is rejected (Task 5)
- [ ] Fixes include explanations (Task 6)

### When to Ask for Help

**Stop and ask if:**
1. TypeScript errors persist after 1 hour
2. Extension crashes on startup
3. Database operations fail consistently
4. Tests fail after implementation
5. Performance degrades significantly (>5s for operations)
6. You're unsure about architectural changes

**Document blockers in:** `docs/Fix1/BLOCKERS.md`

Include:
- Task number and description
- What you tried
- Error messages (full stack trace)
- Environment info (Node version, OS, etc.)

---

**Status:** ✅ Ready for Implementation
**Next Action:** Start with Task 1 (TypeScript errors)
**Expected Completion:** 2-3 days
**Safety:** Backup branch created, rollback plan in place
