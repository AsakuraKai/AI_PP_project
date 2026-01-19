# Chunk 1: Core Backend Services

**Priority:** CRITICAL | **Phase:** Foundation | **Est. Time:** 2-3 hours  
**Depends On:** None (Foundational)  
**Unblocks:** Chunks 4, 6, 7

## Pre-Chunk Checklist

- [ ] Git branch created: `fix/chunk-1-core-backend`
- [ ] Current branch is clean (no uncommitted changes)
- [ ] Extension is not running (close all VS Code instances with extension)
- [ ] Read through this entire chunk before starting
- [ ] Have terminal ready for quick verification tests
- [ ] Backup important files if unsure about changes

## Objectives

- [DONE] Verify `src/types.ts` definitions are correct
- [DONE] Verify LLM client (`OllamaClient`) API
- [DONE] Verify database client (`ChromaDBClient`) API
- [DONE] Verify core parsers (`ErrorParser`, `LogcatParser`, etc.)
- [DONE] Document actual signatures vs expected signatures
- [DONE] Create compatibility layer if needed

## Files to Analyze

1. **`src/types.ts`** (Core type definitions)
   - Verify `RCAResult`, `ErrorInfo`, `ToolCall`, etc.
   - Check for breaking changes from UI overhauls
   - Document all exported types

2. **`src/llm/OllamaClient.ts`** (LLM Integration)
   ```typescript
   // What to check:
   // - Constructor signature: OllamaClient(baseUrl: string, options?: OllamaOptions)
   // - analyze() method signature
   // - streaming support
   // - error handling
   ```

3. **`src/db/ChromaDBClient.ts`** (Vector Database)
   ```typescript
   // What to check:
   // - Is constructor private? Why?
   // - getInstance() method
   // - addExample() / queryExamples() methods
   // - Initialization requirements
   ```

4. **`src/utils/ErrorParser.ts`** (Error Parsing)
   ```typescript
   // What to check:
   // - parseError() signature and return type
   // - Support for different error formats
   // - Integration with diagnostic sources
   ```

## Analysis Script

```typescript
// Run this to document current APIs
import { OllamaClient } from '../src/llm/OllamaClient';
import { ChromaDBClient } from '../src/db/ChromaDBClient';
import { ErrorParser } from '../src/utils/ErrorParser';

// Document constructor signatures
console.log('OllamaClient constructor:', OllamaClient.constructor.length, 'params');
console.log('ChromaDBClient constructor:', ChromaDBClient.constructor.length, 'params');

// Document key method signatures
console.log('ErrorParser.parseError:', typeof ErrorParser.parseError);
```

## Expected Issues

1. **Constructor Mismatches**
   - Extension code may be using old signatures
   - Need to update all initialization code

2. **Missing Methods**
   - UI expects methods that don't exist in backend
   - Need to implement or create adapters

3. **Type Incompatibilities**
   - Backend returns one shape, UI expects another
   - Need normalization functions

## Validation Criteria

- [DONE] All backend services can be imported without errors
- [DONE] All constructor calls use correct parameters
- [DONE] All method calls match actual signatures
- [DONE] Types are consistent between backend and extension

## Post-Chunk Verification

**1. Compilation Test:**
```bash
cd vscode-extension
npm run compile
# Expected: 0 errors related to src/* imports
```

**2. Import Test:**
```typescript
// Create temp file: vscode-extension/src/test-chunk-1.ts
import { OllamaClient } from '../../src/llm/OllamaClient';
import { ChromaDBClient } from '../../src/db/ChromaDBClient';
import { ErrorParser } from '../../src/utils/ErrorParser';
import type { RCAResult, ErrorInfo } from '../../src/types';

console.log('All imports successful');
```
Run: `npx ts-node vscode-extension/src/test-chunk-1.ts`

**3. API Verification:**
```typescript
// Verify constructor signatures
const ollama = new OllamaClient(/* verify param count */);
const chroma = new ChromaDBClient(/* verify param count */);
console.log('Constructors accept correct parameters');
```

**4. Git Checkpoint:**
```bash
git add .
git commit -m "fix(chunk-1): Core backend services verified and fixed"
git checkout fix/backend-polish-comprehensive
git merge fix/chunk-1-core-backend
git tag chunk-1-complete -m "Chunk 1: Core Backend Services - Complete"
```

**5. Checklist:**
- [ ] Compilation passes without backend-related errors
- [ ] All imports resolve correctly
- [ ] No runtime errors when instantiating services
- [ ] Types are properly exported and importable
- [ ] All fixes are committed and tagged
- [ ] Session log updated with findings

**If any check fails:** Review fixes, do NOT proceed to Chunk 2.

## Session Log

Create a file `SESSION_LOG.md` to track your progress:

```markdown
## Chunk 1: Core Backend Services - Session Log

**Date:** [Date]
**Duration:** [Time]
**Status:** [RED] Not Started | [YELLOW] In Progress | [GREEN] Complete | 🔵 Blocked

### Objectives
- [ ] Verify src/types.ts definitions
- [ ] Verify OllamaClient API
- [ ] Verify ChromaDBClient API
- [ ] Verify core parsers

### Files Analyzed
- `path/to/file.ts` - [Brief description of findings]

### Issues Found
1. **Issue Title** (Severity: Critical/High/Medium/Low)
   - Description
   - Location
   - Fix applied: Yes/No

### Fixes Implemented
1. **Fix Description**
   - File: `path/to/file.ts`
   - Change: [Brief description]
   - Verification: Pass/Fail

### Blockers
- None / [Description of blocker]

### Next Session
- [What to tackle next]
```
