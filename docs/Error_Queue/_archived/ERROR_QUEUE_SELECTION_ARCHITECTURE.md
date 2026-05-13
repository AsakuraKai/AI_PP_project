# Error Queue Selection Architecture - Quick Reference

**Date:** 2026-03-28
**Related:** [ERROR_QUEUE_SELECTION_LOGIC_ANALYSIS.md](./ERROR_QUEUE_SELECTION_LOGIC_ANALYSIS.md)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (ErrorQueue.tsx)                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────────────────────────┐   │
│  │   Master     │  │         Error Rows                   │   │
│  │  Checkbox    │  │  ┌──────┐  ┌──────┐  ┌──────┐       │   │
│  │  [Select All]│  │  │ ☑ A  │  │ ☐ B  │  │ ☑ C  │  ...  │   │
│  └──────┬───────┘  │  └──┬───┘  └──┬───┘  └──┬───┘       │   │
│         │          └─────┼─────────┼─────────┼───────────┘   │
│         │                │         │         │               │
│         └────────────────┴─────────┴─────────┘               │
│                          │                                    │
│                          ↓                                    │
│         ┌────────────────────────────────────┐               │
│         │  Bulk Action Buttons               │               │
│         │  [Analyze Selected] [Clear]        │               │
│         └────────────────┬───────────────────┘               │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      REACT HOOK LAYER                           │
│                    (useErrorQueue.ts)                           │
│                                                                 │
│  State: selectedIds = Set<string>                              │
│                                                                 │
│  Functions:                                                     │
│  ├─ toggleSelection(id)  → Add/remove from Set                 │
│  ├─ selectAll()          → Set = all filtered error IDs        │
│  ├─ deselectAll()        → Set = empty                         │
│  ├─ analyzeSelected()    → Send IDs to backend + clear Set     │
│  └─ analyzeAll()         → Send command to backend             │
│                                                                 │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ↓ postMessage()
┌─────────────────────────────────────────────────────────────────┐
│                   MESSAGE PASSING LAYER                         │
│                  (VSCode Webview API)                           │
│                                                                 │
│  Messages:                                                      │
│  ├─ analyzeMultipleErrors  → { errorIds: string[] }            │
│  ├─ analyzeAllErrors       → { }                               │
│  ├─ removeError            → { errorId: string }               │
│  ├─ clearCompletedErrors   → { }                               │
│  └─ clearAllErrors         → { }                               │
│                                                                 │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND MESSAGE HANDLER                      │
│                  (RCAWebviewProvider.ts)                        │
│                                                                 │
│  Handlers:                                                      │
│  ├─ _handleAnalyzeMultipleErrors(errorIds)                     │
│  │   └─ Filter by IDs → Analyze each sequentially              │
│  ├─ _handleAnalyzeAllErrors()                                  │
│  │   └─ Filter by status='pending' → Analyze each              │
│  ├─ _handleRemoveError(errorId)                                │
│  ├─ _handleClearCompletedErrors()                              │
│  └─ _handleClearAllErrors()                                    │
│                                                                 │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ERROR QUEUE MANAGER                           │
│                 (ErrorQueueManager.ts)                          │
│                                                                 │
│  Operations:                                                    │
│  ├─ getAllErrors()        → ErrorItem[]                         │
│  ├─ removeError(id)       → Remove from queue                   │
│  ├─ clearCompleted()      → Remove complete/failed             │
│  ├─ clearQueue()          → Remove all                          │
│  └─ pinError(id)          → Mark as pinned                      │
│                                                                 │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGER                              │
│                   (StateManager.ts)                             │
│                                                                 │
│  Persistence:                                                   │
│  ├─ errorQueue: ErrorItem[]                                     │
│  ├─ addError(error)                                             │
│  ├─ removeError(id)                                             │
│  ├─ updateError(id, error)                                      │
│  └─ clearErrorQueue()                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Select Individual Error

```
User clicks checkbox on Error A
         ↓
ErrorRow: onToggleSelection()
         ↓
useErrorQueue: toggleSelection('error-a-id')
         ↓
React State Update:
  selectedIds: Set {} → Set { 'error-a-id' }
         ↓
UI Re-render:
  - Checkbox shows checked ✓
  - Row background: bg-zinc-800/30
  - Bulk buttons appear
  - Count: "1 selected"
```

---

## Data Flow: Analyze Selected

```
User clicks "Analyze Selected"
         ↓
useErrorQueue: analyzeSelected()
  - errorIds = ['error-a-id', 'error-b-id']
  - postMessage('analyzeMultipleErrors', { errorIds })
  - setSelectedIds(new Set())  ← IMMEDIATE CLEAR
         ↓
RCAWebviewProvider: _handleAnalyzeMultipleErrors(errorIds)
  - errors = errorQueueManager.getAllErrors()
  - selectedErrors = errors.filter(e => errorIds.includes(e.id))
  - for (const error of selectedErrors) {
      await this._handleAnalyzeError(error);  ← SEQUENTIAL
    }
         ↓
Analysis Processing
  - Error status: 'pending' → 'analyzing' → 'complete'/'failed'
  - UI receives updates via messages
```

---

## State Management

### Frontend State (React)
```typescript
// Location: useErrorQueue.ts
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Properties:
// - Type: Set<string> (error IDs)
// - Scope: Component-level (not persisted)
// - Lifecycle: Cleared on page refresh
// - Updates: Immutable (new Set created each time)
```

### Backend State (VSCode Extension)
```typescript
// Location: StateManager.ts
private _errorQueue: ErrorItem[] = [];

// Properties:
// - Type: ErrorItem[] (full error objects)
// - Scope: Extension-level (persisted in memory)
// - Lifecycle: Persists during extension lifetime
// - Updates: Mutable array operations
```

---

## Key Functions Reference

### Frontend (useErrorQueue.ts)

| Function | Purpose | Side Effects |
|----------|---------|--------------|
| `toggleSelection(id)` | Add/remove ID from selection | Updates `selectedIds` state |
| `selectAll()` | Select all filtered errors | Sets `selectedIds` to all visible IDs |
| `deselectAll()` | Clear all selections | Empties `selectedIds` Set |
| `analyzeSelected()` | Analyze selected errors | Sends message + clears selection |
| `analyzeAll()` | Analyze all pending errors | Sends message (no selection change) |
| `removeError(id)` | Remove error from queue | Sends message |

### Backend (RCAWebviewProvider.ts)

| Handler | Input | Action |
|---------|-------|--------|
| `_handleAnalyzeMultipleErrors` | `errorIds: string[]` | Filter by IDs → analyze each |
| `_handleAnalyzeAllErrors` | None | Filter by status → analyze each |
| `_handleRemoveError` | `errorId: string` | Remove from queue |
| `_handleClearCompletedErrors` | None | Remove complete/failed |
| `_handleClearAllErrors` | None | Clear entire queue |

---

## Message Protocol

### Frontend → Backend

```typescript
// Analyze selected errors
postMessage('analyzeMultipleErrors', {
  errorIds: ['id1', 'id2', 'id3']
});

// Analyze all pending errors
postMessage('analyzeAllErrors');

// Remove single error
postMessage('removeError', {
  errorId: 'id1'
});

// Clear completed errors
postMessage('clearCompletedErrors');

// Clear all errors
postMessage('clearAllErrors');
```

### Backend → Frontend

```typescript
// Error queue data
{
  command: 'errorQueueData',
  errors: ErrorItem[]
}

// Error removed
{
  command: 'errorRemoved',
  errorId: string
}

// Error updated
{
  command: 'errorUpdated',
  error: ErrorItem
}

// Error added
{
  command: 'errorAdded',
  error: ErrorItem
}
```

---

## Selection State Transitions

```
┌─────────────┐
│   EMPTY     │  selectedIds.size = 0
│  No errors  │  Bulk buttons hidden
│  selected   │
└──────┬──────┘
       │ User clicks checkbox
       ↓
┌─────────────┐
│  PARTIAL    │  0 < selectedIds.size < errors.length
│  Some errors│  Bulk buttons visible
│  selected   │  Master checkbox unchecked
└──────┬──────┘
       │ User clicks "Select All"
       ↓
┌─────────────┐
│    ALL      │  selectedIds.size = errors.length
│  All errors │  Bulk buttons visible
│  selected   │  Master checkbox checked
└──────┬──────┘
       │ User clicks "Analyze Selected"
       ↓
┌─────────────┐
│   EMPTY     │  Selection cleared
│  (back to   │  Bulk buttons hidden
│   start)    │
└─────────────┘
```

---

## Critical Code Locations

### Selection Logic
- **Toggle:** `vscode-extension/webview/src/hooks/useErrorQueue.ts:197-207`
- **Select All:** `vscode-extension/webview/src/hooks/useErrorQueue.ts:209-211`
- **Deselect All:** `vscode-extension/webview/src/hooks/useErrorQueue.ts:213-215`

### UI Components
- **Master Checkbox:** `vscode-extension/webview/src/views/ErrorQueue.tsx:308-313`
- **Row Checkbox:** `vscode-extension/webview/src/views/ErrorQueue.tsx:413-418`
- **Bulk Actions:** `vscode-extension/webview/src/views/ErrorQueue.tsx:226-244`

### Backend Handlers
- **Analyze Multiple:** `vscode-extension/src/webview/RCAWebviewProvider.ts:634-650`
- **Analyze All:** `vscode-extension/src/webview/RCAWebviewProvider.ts:523-539`
- **Remove Error:** `vscode-extension/src/webview/RCAWebviewProvider.ts:590-600`

### State Management
- **Error Queue:** `vscode-extension/src/services/ErrorQueueManager.ts`
- **State Persistence:** `vscode-extension/src/services/StateManager.ts`

---

## Quick Debugging Guide

### Issue: Checkbox not updating
**Check:**
1. Is `selectedIds` state updating? (React DevTools)
2. Is `selected` prop passed correctly to ErrorRow?
3. Is checkbox `checked` prop bound to `selected`?

### Issue: Selection count wrong
**Check:**
1. `selectedIds.size` value
2. Are there duplicate IDs in the Set?
3. Is selection cleared after operations?

### Issue: "Analyze Selected" not working
**Check:**
1. Are error IDs in `selectedIds` valid?
2. Backend receiving correct `errorIds` array?
3. Are errors filtered out by status?

### Issue: Master checkbox state incorrect
**Check:**
1. `allSelected` calculation: `selectedIds.size === errors.length`
2. Are `errors` filtered correctly?
3. Does `errors.length` match visible errors?

---

**Document Version:** 1.0
**Last Updated:** 2026-03-28
**Related Documents:**
- [ERROR_QUEUE_SELECTION_LOGIC_ANALYSIS.md](./ERROR_QUEUE_SELECTION_LOGIC_ANALYSIS.md) - Detailed analysis
