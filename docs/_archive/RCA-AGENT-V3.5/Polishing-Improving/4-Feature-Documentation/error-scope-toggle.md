# Error Scope Toggle — Implementation Documentation

## Overview
Allows users to tell the RCA whether an error is **inside this workspace** or **outside** so the agent can avoid wasting time searching the project when the error is external.

## UX Design
- **Location**: Analyze view, positioned below File Path field
- **Layout**: Uses 2-column grid; toggle occupies one column (half the File Path width on desktop, full width on mobile)
- **Labels**: "Inside This Project" / "Not Inside This Project" with animated pill toggle
- **Default State**: "Inside This Project" (defaults to `'inside'`)
- **Visual Feedback**: 
  - Inside: Purple toggle indicator (`bg-purple-600`)
  - Outside: Gray toggle indicator (`bg-zinc-600`)
  - Visual state indicator: `O|` (inside) / `|O` (outside)
- **Accessibility**: Button semantics, descriptive aria-labels, focus ring, keyboard navigable

## Implementation Details

### 1. Type Definitions
**File**: `vscode-extension/src/types/index.ts`

```typescript
export interface ErrorItem {
  // ... existing properties
  
  /** Project scope - whether error is from inside or outside the workspace */
  projectScope?: 'inside' | 'outside';
  
  // ... remaining properties
}
```

**Changes**:
- Added `projectScope` optional property to `ErrorItem` interface (lines 88-89)
- Type: `'inside' | 'outside'` union type for type safety

---

### 2. Backend Service Integration
**File**: `vscode-extension/src/services/AnalysisService.ts`

#### Function: `analyzeError()`
**Location**: Lines 207-587

**Changes Made**:

1. **Enhanced Logging** (Lines 213-216):
```typescript
console.log('[AnalysisService] Starting analysis for:', error.id, {
  projectScope: error.projectScope || 'inside',
  filePath: error.filePath
});
```
- Logs `projectScope` for debugging and observability
- Defaults to `'inside'` if not provided

2. **Metadata Injection** (Lines 268-274):
```typescript
parsed = {
  type: error.type || 'runtime',
  message: error.message,
  filePath: error.filePath,
  line: error.line || 0,
  language: this._detectLanguage(error.filePath) || 'typescript',
  column: error.column,
  stackTrace: stackFrames,
  metadata: {
    ...error.metadata,
    projectScope: error.projectScope || 'inside',
    fallback: true
  }
};
```
- Merges `projectScope` into error metadata before agent analysis
- Preserves existing metadata with spread operator
- Ensures default value of `'inside'` if undefined
- Passes to `MultiPassAgent.analyze()` for backend processing

**Purpose**: 
- Backend agent receives `metadata.projectScope` for downstream decision-making
- Can optimize workspace scans based on scope (future enhancement)

---

### 3. Frontend UI Component
**File**: `vscode-extension/webview/src/views/Analyze.tsx`

#### A. State Management
**Location**: Lines 17-46

**Added Import**:
```typescript
import { AlertCircle, RefreshCw, Sparkles, Play, X } from 'lucide-react';
```
- Added `Play` and `X` icons (previously missing)

**Added State**:
```typescript
const [projectScope, setProjectScope] = useState<'inside' | 'outside'>('inside');
```
- Line 45: State hook for project scope
- Default: `'inside'`
- Type-safe with union type

#### B. Form Submission Handler
**Location**: Lines 57-66

**Updated Function**: `handleAnalyze()`
```typescript
const handleAnalyze = () => {
  if (!errorText.trim()) return;

  const errorData = {
    message: errorText,
    filePath: selectedFile || 'unknown',
    line: parseInt(selectedLine) || 0,
    projectScope  // Added this property
  };

  startManualAnalysis(JSON.stringify(errorData));
};
```
- Line 63: Added `projectScope` to error payload
- Serialized and sent via `startManualAnalysis()`

#### C. Toggle UI Component
**Location**: Lines 157-191

**Structure**:
```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <label className="block text-sm font-medium text-zinc-200">
      Error Scope
    </label>
    <button
      type="button"
      onClick={() => setProjectScope(projectScope === 'inside' ? 'outside' : 'inside')}
      className="w-full h-10 flex items-center justify-between px-4 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
      aria-label={`Error scope: ${projectScope === 'inside' ? 'Inside this project' : 'Not inside this project'}`}
    >
      <span className="text-sm text-zinc-200">
        {projectScope === 'inside' ? 'Inside This Project' : 'Not Inside This Project'}
      </span>
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-9 h-5 rounded-full transition-colors ${
          projectScope === 'inside' ? 'bg-purple-600' : 'bg-zinc-600'
        }`}>
          <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${
            projectScope === 'inside' ? 'translate-x-2' : '-translate-x-2'
          }`} />
        </div>
        <span className="text-xs font-mono text-zinc-400">
          {projectScope === 'inside' ? 'O|' : '|O'}
        </span>
      </div>
    </button>
    <p className="text-xs text-zinc-500 mt-1">
      Is the error from this workspace?
    </p>
  </div>
</div>
```

**Features**:
- **Grid Layout**: `grid-cols-2` ensures toggle is half the File Path width
- **Interactive Button**: Click toggles between inside/outside
- **Animated Pill**: Smooth transition with `translate-x-2` / `-translate-x-2`
- **Color Coding**: Purple (inside) vs Gray (outside)
- **Text Indicator**: `O|` vs `|O` for quick visual reference
- **Hover State**: Border color change on hover
- **Focus State**: Ring outline on keyboard focus
- **Helper Text**: Clarifies purpose below toggle

**Accessibility Features**:
- `aria-label`: Dynamic label based on current state
- `type="button"`: Prevents form submission
- Focus ring: `focus:ring-2 focus:ring-purple-500`
- Semantic HTML: `<label>` properly associated

---

### 4. Frontend Hook Fixes
**File**: `vscode-extension/webview/src/hooks/useAnalysis.ts`

#### Function: `useAnalysis()`
**Location**: Lines 51-171

**Changes Made**:

1. **Added Missing State** (Line 57):
```typescript
const [currentErrorId, setCurrentErrorId] = useState<string | null>(null);
```
- Previously referenced but never declared
- Stores the current error ID being analyzed

2. **Fixed Feedback Hook** (Line 60):
```typescript
const { feedbackStatus, setFeedbackStatus, submitFeedback } = useFeedback(result?.feedback);
```
- Changed from invalid `{ status: 'idle' }` to `result?.feedback`
- Now passes correct `FeedbackMetadata` type
- Uses optional chaining for safety

3. **State Management Wiring** (Lines 77, 151, 160):
```typescript
// Line 77: Set on analysis start
setCurrentErrorId(message.errorId);

// Line 151: Clear on reset
setCurrentErrorId(null);

// Line 160: Return in hook interface
return {
  state,
  progress,
  result,
  error,
  currentErrorId,  // Now properly exposed
  feedbackStatus,
  // ...
};
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User Interaction (Analyze View)                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Toggle Button: Inside ⇄ Outside                            │ │
│ │ State: projectScope = 'inside' | 'outside'                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ handleAnalyze() serializes
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Message Payload                                                 │
│ {                                                               │
│   message: string,                                              │
│   filePath: string,                                             │
│   line: number,                                                 │
│   projectScope: 'inside' | 'outside'  ◄── Added                │
│ }                                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ postMessage to extension
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ AnalysisService.analyzeError(error: ErrorItem)                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Log projectScope for observability                      │ │
│ │ 2. Parse error text                                         │ │
│ │ 3. Inject projectScope into metadata:                      │ │
│ │    metadata: {                                              │ │
│ │      ...error.metadata,                                     │ │
│ │      projectScope: error.projectScope || 'inside'           │ │
│ │    }                                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Call agent.analyze()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ MultiPassAgent.analyze(parsed: ParsedError)                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ parsed.metadata.projectScope available for:                │ │
│ │ - Tool execution decisions                                  │ │
│ │ - Workspace scan optimization                              │ │
│ │ - Context retrieval logic                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing & Validation

### Build Status
- **Webview**: `npm run build` ✅ Success (440.12 kB gzipped)
- **Extension**: `npm run compile` ✅ Success (TypeScript compilation clean)

### Manual Testing Checklist
- [ ] Toggle button renders below File Path field
- [ ] Toggle width is half of File Path on desktop (grid-cols-2)
- [ ] Toggle is full width on mobile screens
- [ ] Click toggles between Inside/Outside states
- [ ] Label text updates: "Inside This Project" ⇄ "Not Inside This Project"
- [ ] Pill animation works: `O|` ⇄ `|O`
- [ ] Color changes: Purple ⇄ Gray
- [ ] Hover effect shows border highlight
- [ ] Focus ring appears on keyboard navigation
- [ ] Aria-label updates dynamically
- [ ] Form submission includes `projectScope` in payload
- [ ] Console logs show `projectScope` value
- [ ] Error metadata contains `projectScope` field

### Integration Points
1. **Webview → Extension**: `startManualAnalysis()` message includes `projectScope`
2. **Extension → Service**: `ErrorItem.projectScope` passed to `AnalysisService`
3. **Service → Agent**: `ParsedError.metadata.projectScope` available to tools

---

## Future Enhancements

### Backend Optimization (Not Yet Implemented)
The `projectScope` metadata is now available but not actively used for optimization. Future work:

1. **Workspace Search Skip**:
```typescript
if (parsed.metadata.projectScope === 'outside') {
  // Skip workspace file searches
  // Skip semantic code search in ChromaDB
  // Focus on generic error patterns
}
```

2. **Tool Selection**:
```typescript
const tools = projectScope === 'inside' 
  ? [ReadFileTool, WorkspaceSearchTool, SemanticSearchTool]
  : [GenericSearchTool, DocumentationTool];
```

3. **Prompt Adjustment**:
```typescript
const systemPrompt = projectScope === 'inside'
  ? "Analyze this workspace error..."
  : "Analyze this external error (no workspace context)...";
```

### Persistence (Optional)
Store user preference per workspace:
```typescript
context.workspaceState.update('defaultProjectScope', projectScope);
```

---

## Files Modified Summary

| File                                                | Lines Changed        | Type      | Changes                             |
| --------------------------------------------------- | -------------------- | --------- | ----------------------------------- |
| `vscode-extension/src/types/index.ts`               | 88-89                | Type      | Added `projectScope` to `ErrorItem` |
| `vscode-extension/src/services/AnalysisService.ts`  | 213-216, 268-274     | Service   | Logging + metadata injection        |
| `vscode-extension/webview/src/views/Analyze.tsx`    | 17, 45, 63, 157-191  | Component | State, handler, UI toggle           |
| `vscode-extension/webview/src/hooks/useAnalysis.ts` | 57, 60, 77, 151, 160 | Hook      | State wiring + feedback fix         |

**Total**: 4 files, ~50 lines of new/modified code

---

## Dependencies
- **React**: State management (`useState`)
- **Lucide React**: Icon library (`Play`, `X`)
- **Tailwind CSS**: Styling (`grid-cols-2`, transitions, colors)
- **VS Code API**: Message passing between webview and extension

---

## Design Reference
Based on Figma design: `Figma/Redesign Error Scope Bar/src/app/components/ErrorForm.tsx`
- Matches visual design with purple/gray states
- Maintains accessibility standards
- Responsive grid layout
