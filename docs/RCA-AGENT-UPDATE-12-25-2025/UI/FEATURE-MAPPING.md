# Feature Mapping - Old vs. New UI

**Complete mapping of current commands to new panel UI locations**

---

##  Overview

This document maps all existing RCA Agent features to their new locations in the panel-based UI.

### Related Documentation
- **[UI-MOCKUPS.md](./UI-MOCKUPS.md)** - Visual designs and wireframes
- **[PROPOSED-ARCHITECTURE.md](./PROPOSED-ARCHITECTURE.md)** - Technical implementation details
- **[MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)** - Step-by-step implementation guide
- **[README.md](./README.md)** - Project overview and impact assessment

### Migration Philosophy
-  **Preserve all functionality** - Nothing is removed
-  **Improve discoverability** - Features easier to find
-  **Reduce steps** - Fewer clicks to accomplish tasks
-  **Maintain shortcuts** - All keyboard shortcuts still work
-  **Progressive disclosure** - Show advanced features only when needed
-  **Contextual help** - Inline tooltips for new users

---

##  Feature Location Mapping

### Group 1: Core Analysis Features

| Current Feature | Old Location | New Location | Keyboard Shortcut |
|----------------|--------------|--------------|-------------------|
| **Analyze Error (Output)** | Command Palette | Panel "Analyze" button | `Ctrl+Shift+R` |
| **Analyze Error (Webview)** | Command Palette | Panel main view | `Ctrl+Shift+W` |
| **Select Error Text** | Manual selection | Auto-detect + manual | N/A |
| **View Results** | Output channel / Webview | Panel analysis section | N/A |

**Old Flow:**
```
1. Ctrl+Shift+P (open palette)
2. Type "RCA Agent: Analyze..."
3. Select command
4. Wait for output channel
```

**New Flow:**
```
1. Click error in panel OR
2. Press Ctrl+Shift+R (direct)
```

---

### Group 2: Display & Preferences

| Current Feature | Old Location | New Location | New UI Element |
|----------------|--------------|--------------|----------------|
| **Educational Mode** | Command: Toggle | Settings dropdown:  →  Educational Mode | Checkbox |
| **Performance Metrics** | Command: Toggle | Settings dropdown:  →  Performance Metrics | Checkbox |
| **Show Logs** | Command Palette | Settings dropdown:  →  View Logs | Button |
| **Clear Cache** | N/A (new) | Settings dropdown:  → Advanced →  Clear Cache | Button |

**Settings Dropdown Structure:**
```
 Settings
├── Display Options
│   ├──   Educational Mode
│   ├──   Performance Metrics
│   ├──   Show Confidence Bars
│   └──   Syntax Highlighting
│
├── Behavior Options
│   ├──   Auto-detect Errors
│   ├──   Auto-save Results
│   ├──   Desktop Notifications
│   └──   Keep Panel Open
│
├── Analysis Settings
│   ├── Max Iterations: [3 ]
│   ├── Analysis Mode: [Standard ]
│   └── Cache Behavior: [Auto ]
│
├── Model Configuration
│   ├── Model: [DeepSeek-R1 ]
│   ├── Ollama URL: [...]
│   └── Timeout: [120s]
│
└── Advanced
    ├──  View Logs
    ├──  Clear Cache
    ├──  Statistics
    └──  Advanced Settings...
```

---

### Group 3: Error Management (NEW!)

| Feature | Old Location | New Location | Description |
|---------|--------------|--------------|-------------|
| **Error Queue** | N/A (new) | Panel top section | List of detected errors |
| **Batch Analysis** | N/A (new) | Panel: [Analyze All] button | Process multiple errors |
| **Error Prioritization** | N/A (new) | Auto-sorted by severity | Critical → High → Medium |
| **Auto-detect Errors** | N/A (new) | Settings:  Auto-detect | Scan workspace for errors |
| **Pin Error** | N/A (new) | Context menu:  Pin | Keep error at top |
| **Remove Error** | N/A (new) | Context menu:  Remove | Delete from queue |
| **Multi-select Errors** | N/A (new) | Shift+Click / Ctrl+Click | Select multiple items |
| **Bulk Actions** | N/A (new) | Context menu on selection | Analyze/Remove selected |

**Error Queue Actions:**
```
Right-click on error →
┌──────────────────────────┐
│  Analyze Now           │
│  Go to Error Location  │
│  Copy Error Message    │
│ ──────────────────       │
│  Analyze (Fast Mode)   │
│  Analyze (Deep Mode)   │
│ ──────────────────       │
│  Pin to Top            │
│  Remove from Queue     │
│ ──────────────────       │
│  Ignore This Error     │
│  Ignore Similar Errors │
└──────────────────────────┘
```

---

### Group 4: History & Feedback

| Feature | Old Location | New Location | Description |
|---------|--------------|--------------|-------------|
| **View History** | N/A (new) | Panel:  History section | Past analyses |
| **Re-analyze** | N/A (new) | History item: [↻] button | Run again |
| **Delete History** | N/A (new) | History item: [] button | Remove item |
| **Search History** | N/A (new) | History: [ Search] | Find past errors |
| **Feedback (Thumbs)** | Analysis result | Analysis result: [] [] | Rate analysis |
| **Detailed Feedback** | N/A (new) | Analysis result: [ Feedback] | Write comment |

**History Section:**
```
 HISTORY (Collapsed by default)
├── Today
│   ├── Error 1 [↻ Re-analyze] [ Delete] [↗ Open]
│   └── Error 2 [↻] [] [↗]
├── Yesterday
│   └── Error 3 [↻] [] [↗]
└── Actions
    ├── [ Search History]
    ├── [ Clear All]
    └── [ Statistics]
```

---

### Group 5: Inline Editor Integration (NEW!)

| Feature | Old Method | New Method | Trigger |
|---------|------------|------------|---------|
| **Quick Analysis** | Select + Command | Lightbulb menu | Click  on error |
| **Peek View** | Open webview | Inline peek | Ctrl+K Ctrl+I |
| **Apply Fix** | Manual copy-paste | One-click apply | Click [Apply Fix] |
| **Copy Fix** | Manual selection | One-click copy | Click [ Copy] |
| **View Full Analysis** | Switch to webview | Click in peek | Click [View Full] |

**Lightbulb Quick Actions:**
```
Hover over error →  appears → Click →

┌────────────────────────────────┐
│  Analyze with RCA Agent      │ ← NEW!
│  Quick Fix... (if available) │
│  Explain Problem             │
│  Suppress Warning            │
└────────────────────────────────┘
```

**Peek View (After Analysis):**
```
42: println(user.name) //  Error
    ──────────────────────────────────────
    │  RCA Agent - Quick Analysis       │
    │────────────────────────────────────│
    │ Fix: Use safe call                 │
    │   println(user?.name)  [Apply Fix] │
    │                                    │
    │ [View Full] [Copy] [Dismiss]      │
    └────────────────────────────────────┘
```

---

### Group 6: Error Handling & Health Checks (NEW!)

| Feature | Old Location | New Location | Description |
|---------|--------------|--------------|-------------|
| **Health Check** | N/A (new) | Panel bottom: Status section | Ollama connection status |
| **Model Verification** | N/A (new) | Status section | Check if model installed |
| **Connection Test** | N/A (new) | Settings: [ Check Connection] | Test Ollama URL |
| **Error Recovery** | Manual retry | Auto-suggest solutions | Smart error handling |
| **Timeout Handling** | Hard failure | Graceful degradation | Suggest Fast mode |
| **Parse Error Help** | Generic error | Contextual guidance | Tips for better selection |
| **Cache Status** | N/A (new) | Status section | Cache size and health |

### Group 7: Status & Notifications

| Feature | Old Location | New Location | Visual Indicator |
|---------|--------------|--------------|------------------|
| **Analysis Status** | Progress notification | Status bar:  + Panel | "Analyzing 2/3" |
| **Error Count** | N/A | Activity bar badge | (3) |
| **Completion Alert** | Modal notification | Status bar + optional desktop | " Complete" |
| **Error Alerts** | Modal notification | In-panel error banner | Red banner |
| **Health Alerts** | N/A (new) | Status bar + panel | Ollama disconnected |

**Status Bar States:**
```
Idle:       RCA: Ready
Analyzing:  RCA: Analyzing (2/3) 67%
Errors:     (3) RCA: 3 errors detected
Error:       RCA: Analysis failed
```

**Activity Bar Badge:**
```
No errors:  
Errors:     3  (number = unanalyzed errors)
Analyzing:   (animated gear)
```

---

##  Command Palette Mapping

### Preserved Commands (Still Available)

All existing commands remain available via Command Palette for backward compatibility:

```
Ctrl+Shift+P →

RCA Agent: Commands
├──  Analyze Selected Error (Output)    [Ctrl+Shift+R]
├──  Analyze Selected Error (Webview)   [Ctrl+Shift+W]
├──  Analyze All Build Errors           [NEW!]
├── ──────────────────────────────────
├──  Toggle Panel Visibility            [Ctrl+Shift+A]
├──  Toggle Educational Mode            [Ctrl+Shift+E]
├──  Toggle Performance Metrics
├── ──────────────────────────────────
├──  Show Analysis History
├──  Refresh Error Queue
├──  Clear Error Queue
├── ──────────────────────────────────
├──  Stop Current Analysis
├──  Clear Cache
├──  View Logs
├──  Show Statistics
├── ──────────────────────────────────
├──  Open Settings
├──  Open Documentation
└──  Report Issue
```

### New Commands Added

```
NEW Commands:
├──  Analyze All Build Errors
├──  Toggle Panel Visibility
├──  Show Analysis History
├──  Refresh Error Queue
├──  Clear Error Queue
├──  Stop Current Analysis
├──  Show Statistics
└──  Report Issue
```

---

##  Keyboard Shortcut Mapping

### Core Shortcuts (Unchanged)

| Action | Shortcut | Windows/Linux | macOS |
|--------|----------|---------------|-------|
| **Analyze (Output)** | Old | `Ctrl+Shift+R` | `Cmd+Shift+R` |
| **Analyze (Webview)** | Old | `Ctrl+Shift+W` | `Cmd+Shift+W` |
| **Educational Mode** | Old | `Ctrl+Shift+E` | `Cmd+Shift+E` |

### New Shortcuts

| Action | Shortcut | Windows/Linux | macOS |
|--------|----------|---------------|-------|
| **Toggle Panel** | NEW | `Ctrl+Shift+A` | `Cmd+Shift+A` |
| **Analyze All** | NEW | `Ctrl+Shift+Alt+A` | `Cmd+Shift+Alt+A` |
| **Next Error** | NEW | `Alt+F8` | `Option+F8` |
| **Previous Error** | NEW | `Shift+Alt+F8` | `Shift+Option+F8` |
| **Stop Analysis** | NEW | `Escape` | `Escape` |
| **Focus Error Queue** | NEW | `Ctrl+Shift+Q` | `Cmd+Shift+Q` |

> **Note:** Using `Alt+F8` instead of `F8` to avoid conflict with VS Code's built-in "Go to Next Problem" command.

### Panel-Specific Navigation

| Action | Key | Description |
|--------|-----|-------------|
| **Next item** | `↓` or `Tab` | Navigate down error list |
| **Previous item** | `↑` or `Shift+Tab` | Navigate up error list |
| **Analyze selected** | `Enter` | Analyze highlighted error |
| **Expand/Collapse** | `Space` | Toggle section |
| **Delete item** | `Delete` | Remove from queue |
| **Context menu** | `Shift+F10` | Show actions menu |
| **Close panel** | `Escape` | Close panel |
| **Search history** | `Ctrl+F` | Search in history |
| **Multi-select** | `Ctrl+Click` | Add/remove from selection |
| **Range select** | `Shift+Click` | Select range of items |
| **Select all** | `Ctrl+A` | Select all visible items |
| **Deselect all** | `Escape` | Clear selection |

---

##  Context Menu Mapping

### Editor Context Menu

**Old (nothing):**
```
Right-click in editor →
├── Cut
├── Copy
├── Paste
└── ...
```

**New (added):**
```
Right-click in editor →
├── Cut
├── Copy
├── Paste
├── ──────────────
├──  Analyze with RCA Agent  ← NEW!
├──  Explain Error (RCA)     ← NEW!
└── ...
```

### Panel Context Menu

**Error Item (Single Selection):**
```
Right-click on error →
├──  Analyze Now
├──  Go to Location
├──  Copy Error
├── ──────────
├──  Analysis Options
│   ├── Fast Mode
│   ├── Standard Mode
│   └── Deep Mode
├── ──────────
├──  Pin to Top
├──  Remove
├── ──────────
├──  Ignore This Error
└──  Ignore Similar
```

**Error Item (Multi-Selection):**
```
Right-click on selection (3 items) →
├──  Analyze Selected (3)
├── ──────────
├──  Analysis Options
│   ├── Fast Mode
│   ├── Standard Mode
│   └── Deep Mode
├── ──────────
├──  Remove Selected (3)
├──  Copy All Error Messages
├── ──────────
└──  Cancel Selection
```

**History Item:**
```
Right-click on history →
├── ↻ Re-analyze
├── ↗ Open in Editor
├──  Copy Analysis
├── ──────────
├──  View Feedback
├──  View Details
├── ──────────
└──  Delete
```

---

##  Settings Location Mapping

### VS Code Settings

**Current Settings (settings.json):**
```json
{
  "rcaAgent.ollamaUrl": "http://localhost:11434",
  "rcaAgent.model": "deepseek-r1",
  "rcaAgent.showPerformanceMetrics": false
}
```

**New Settings (expanded):**
```json
{
  // Connection Settings
  "rcaAgent.ollamaUrl": "http://localhost:11434",
  "rcaAgent.model": "deepseek-r1",
  "rcaAgent.timeout": 120,
  "rcaAgent.checkConnection": true,
  
  // Display Settings
  "rcaAgent.educationalMode": false,
  "rcaAgent.showPerformanceMetrics": false,
  "rcaAgent.showConfidenceBars": true,
  "rcaAgent.syntaxHighlighting": true,
  
  // Behavior Settings
  "rcaAgent.autoDetectErrors": true,
  "rcaAgent.autoSaveResults": true,
  "rcaAgent.desktopNotifications": false,
  "rcaAgent.keepPanelOpen": true,
  
  // Analysis Settings
  "rcaAgent.maxIterations": 3,
  "rcaAgent.analysisMode": "standard",
  "rcaAgent.cacheBehavior": "auto",
  
  // Error Handling (NEW)
  "rcaAgent.autoRetryOnFailure": false,
  "rcaAgent.fallbackToFastMode": true,
  "rcaAgent.showDetailedErrors": true,
  
  // Telemetry (NEW)
  "rcaAgent.enableTelemetry": true,
  "rcaAgent.shareUsageData": false,
  
  // Advanced
  "rcaAgent.logLevel": "info",
  "rcaAgent.cacheExpiration": 86400,
  "rcaAgent.maxQueueSize": 50,
  "rcaAgent.maxHistorySize": 100
  // Existing (preserved)
  "rcaAgent.ollamaUrl": "http://localhost:11434",
  "rcaAgent.model": "deepseek-r1",
  "rcaAgent.showPerformanceMetrics": false,
  
  // NEW - Display
  "rcaAgent.educationalMode": false,
  "rcaAgent.showConfidenceBars": true,
  "rcaAgent.syntaxHighlighting": true,
  
  // NEW - Behavior
  "rcaAgent.autoDetectErrors": true,
  "rcaAgent.autoSaveResults": true,
  "rcaAgent.desktopNotifications": false,
  "rcaAgent.keepPanelOpen": true,
  
  // NEW - Analysis
  "rcaAgent.maxIterations": 3,
  "rcaAgent.analysisMode": "standard",
  "rcaAgent.timeoutSeconds": 120,
  
  // NEW - UI
  "rcaAgent.panelPosition": "right",
  "rcaAgent.showActivityBarBadge": true,
  "rcaAgent.showStatusBar": true
}
```

### Panel UI Settings

**All settings also accessible via panel:**
```
Panel →  Settings Dropdown
  ↓
Quick toggles (instant apply)
  vs.
Advanced Settings (opens VS Code settings)
```

---

##  Accessibility Compliance

### WCAG 2.1 AA Standards

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Keyboard Navigation** | All actions accessible via keyboard | ✅ Implemented |
| **Screen Readers** | ARIA labels on all interactive elements | ✅ Planned |
| **Focus Management** | Visible focus indicators, logical tab order | ✅ Planned |
| **Color Contrast** | Minimum 4.5:1 contrast ratio | ✅ Planned |
| **Error Announcements** | Live regions for status updates | ✅ Planned |
| **Reduced Motion** | Respects `prefers-reduced-motion` | ✅ Planned |

### Screen Reader Support

**Announcements:**
```typescript
// Error detected
"New error detected: NullPointerException at line 42"

// Analysis started
"Analyzing error. Progress: 0%"

// Analysis progress
"Analysis progress: 45%. Current iteration 2 of 3"

// Analysis complete
"Analysis complete. Root cause identified. Confidence: 92%"

// Batch analysis
"Analyzing 3 errors. Currently processing error 1 of 3"
```

**ARIA Labels:**
```html
<!-- Error Queue -->
<div role="list" aria-label="Error Queue">
  <div role="listitem" aria-label="NullPointerException at MainActivity.kt line 42">
    <button aria-label="Analyze error">Analyze</button>
    <button aria-label="Remove error from queue">×</button>
  </div>
</div>

<!-- Analysis Result -->
<div role="region" aria-label="Analysis Result">
  <div role="status" aria-live="polite" aria-atomic="true">
    Analysis complete. Root cause identified.
  </div>
</div>

<!-- Progress Indicator -->
<div role="progressbar" 
     aria-valuenow="65" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Analysis progress">65%</div>
```

### Focus Management

**Focus Behavior:**
1. Panel opens → Focus moves to first error in queue
2. Analysis starts → Focus stays on trigger element
3. Analysis completes → Focus moves to result section
4. Error added to queue → Announced, focus unchanged
5. Modal opens → Focus trapped until dismissed

### Keyboard Shortcuts Accessibility

**All shortcuts documented in:**
- VS Code Keyboard Shortcuts editor (`Ctrl+K Ctrl+S`)
- Panel help menu (`?` icon)
- Tooltip on hover (with 2s delay)
- Status bar on keyboard navigation

---

##  Performance Considerations

### Limits & Optimization

| Resource | Limit | Behavior at Limit |
|----------|-------|-------------------|
| **Error Queue Size** | 100 items | Oldest items auto-removed |
| **History Items** | 500 items | Paginated, 50 per page |
| **Concurrent Analyses** | 3 max | Additional queued |
| **Webview Refresh Rate** | 10 FPS (100ms) | Debounced updates |
| **Cache Size** | 100 MB | LRU eviction |
| **Search Results** | 50 items | "Show More" button |

### Memory Management

**Lifecycle:**
```typescript
// Panel visible
- Load webview content
- Initialize event listeners
- Start auto-detect (if enabled)
- Load recent history (last 20 items)

// Panel hidden
- Dispose webview (free memory)
- Keep state in memory (lightweight)
- Pause auto-detect
- Keep active analyses running

// Extension deactivated
- Save state to disk
- Cancel pending analyses
- Dispose all resources
```

### Large Workspace Handling

**Auto-detect Strategy:**
```typescript
// Incremental scanning
1. Scan active file immediately (< 100ms)
2. Scan open files in background (< 1s)
3. Scan workspace files (debounced, 5s delay)
4. Respect .gitignore and excludes
5. Max 1000 files per scan
6. Skip binary/large files (> 1MB)
```

---

##  Error States & Recovery

### Offline Mode

**When Ollama is Unavailable:**
```
┌────────────────────────────────────┐
│  Offline Mode                    │
│ Cannot connect to Ollama server    │
│ (http://localhost:11434)           │
│                                    │
│ • View cached analyses             │
│ • Configure Ollama URL             │
│ • Check connection status          │
│                                    │
│ [Retry] [Configure] [View Cache]   │
└────────────────────────────────────┘
```

**Behavior:**
- Analysis buttons disabled
- Status bar shows " Offline"
- Queue still accepts errors
- History remains accessible
- Auto-detect continues (queue only)

### Timeout Handling

**Analysis Timeout (120s default):**
```
┌────────────────────────────────────┐
│  Analysis Timeout                │
│ Analysis exceeded 120s timeout     │
│                                    │
│ Suggestions:                       │
│ • Try Fast mode (fewer iterations) │
│ • Reduce context size              │
│ • Increase timeout in settings     │
│                                    │
│ [Retry Fast] [Configure] [Cancel]  │
└────────────────────────────────────┘
```

### Failed Analysis

**Error Categories:**
```typescript
type AnalysisError =
  | 'timeout'           // Exceeded time limit
  | 'ollama_error'      // Ollama server error
  | 'parsing_error'     // Could not parse error
  | 'context_too_large' // Error context too big
  | 'rate_limit'        // Too many requests
  | 'unknown';          // Unexpected error
```

**Recovery Actions:**
| Error Type | User Action | Auto-Recovery |
|------------|-------------|---------------|
| Timeout | Retry with Fast mode | None |
| Ollama Error | Check server status | Retry after 30s |
| Parsing Error | Manual analysis | None |
| Context Too Large | Reduce file size | Auto-trim context |
| Rate Limit | Wait and retry | Queue for 60s |
| Unknown | Report issue | Retry once |

---

##  Migration Impact Summary

### For Users

| Aspect | Impact | Notes |
|--------|--------|-------|
| **Learning Curve** |  Minimal | All old commands work |
| **Workflow Change** |  Moderate | Panel is new concept |
| **Keyboard Shortcuts** |  None | All preserved + new optional |
| **Settings** |  None | Auto-migrated |
| **Existing Projects** |  None | Fully compatible |

### For Developers

| Aspect | Effort | Complexity |
|--------|--------|------------|
| **Code Changes** |  High | Major refactor |
| **Testing** | 🟡 Medium | New UI components |
| **Documentation** | 🟡 Medium | Update all docs |
| **Migration Guide** | 🟢 Low | Provide samples |

---

##  Technical Implementation Notes

### Error Detection Mechanism

**Sources:**
```typescript
// 1. VS Code Diagnostics API
vscode.languages.getDiagnostics(document.uri)
  .filter(d => d.severity === vscode.DiagnosticSeverity.Error)

// 2. Terminal Output Parser
// Parse compiler errors from terminal
// Regex patterns for common error formats

// 3. Build Task Output
// Listen to task execution events
vscode.tasks.onDidEndTask(event => {
  // Parse task output for errors
})

// 4. Manual Selection
// User selects error text in editor
// Triggered via command or context menu
```

**Debouncing:**
- Diagnostic changes: 500ms delay
- Terminal output: 1000ms delay
- Build task: Immediate (on task end)

### Panel Positioning

**VS Code Limitations:**
```json
// Panel can ONLY be positioned in:
"viewsContainers": {
  "activitybar": [...],  // Left sidebar (primary)
  "panel": [...]         // Bottom panel (alternative)
}

// Cannot position in:
// - Right sidebar (reserved for extensions)
// - Custom floating windows
// - Split views
```

**Workaround:**
- Default to left sidebar (Activity Bar)
- User can drag to bottom panel manually
- Setting saves user preference
- Restore position on reload

### State Persistence

**Storage Strategy:**
```typescript
// Workspace State (per-project)
context.workspaceState.update('errorQueue', queue);
context.workspaceState.update('history', history);

// Global State (across all projects)
context.globalState.update('settings', settings);
context.globalState.update('recentProjects', projects);

// Secret Storage (API keys, tokens)
context.secrets.store('ollamaApiKey', key);
```

**What's Persisted:**
- Error queue (workspace)
- Analysis history (workspace, last 500)
- User settings (global)
- Panel state (collapsed/expanded)
- Selected analysis mode

**What's NOT Persisted:**
- Active analysis progress (lost on reload)
- Webview scroll position
- Temporary notifications

### Theming Support

**CSS Variables:**
```css
:root {
  /* VS Code theme colors */
  --vscode-editor-background
  --vscode-editor-foreground
  --vscode-errorForeground
  --vscode-warningForeground
  --vscode-button-background
  --vscode-button-foreground
  --vscode-input-background
  
  /* Custom semantic colors */
  --rca-success-color: var(--vscode-testing-iconPassed);
  --rca-error-color: var(--vscode-testing-iconFailed);
  --rca-pending-color: var(--vscode-testing-iconQueued);
}
```

**Theme Detection:**
```typescript
// Detect theme changes
vscode.window.onDidChangeActiveColorTheme(theme => {
  // Update webview styles
  panel.updateTheme(theme.kind);
});

// Support for:
// - Light themes
// - Dark themes
// - High contrast themes
```

---

##  Checklist: What Stays, What Changes

###  Stays the Same (Preserved)
- [ ] All keyboard shortcuts work
- [ ] Command Palette commands available
- [ ] Output channel still accessible
- [ ] Webview still available (now in panel)
- [ ] All settings compatible
- [ ] Extension API unchanged
- [ ] Ollama integration unchanged
- [ ] ChromaDB integration unchanged

###  Changes (Enhanced)
- [ ] Panel replaces scattered commands
- [ ] Inline lightbulb adds quick access
- [ ] Error queue adds batch processing
- [ ] History adds persistence
- [ ] Status bar adds visibility
- [ ] Activity bar badge adds notifications
- [ ] Settings centralized in dropdown
- [ ] Context menus add convenience

###  New Features (Added)
- [ ] Auto-detect errors
- [ ] Batch analysis
- [ ] Error prioritization
- [ ] Persistent history
- [ ] Search history
- [ ] Pin errors
- [ ] Ignore errors
- [ ] Statistics view
- [ ] Desktop notifications
- [ ] Peek view

---

##  User Education Plan

### Onboarding Flow

**First Launch (New Users):**
```
1. Show welcome message:
   " Welcome to RCA Agent! 
    Your panel is now visible on the left.
    Try clicking an error to analyze it."

2. Highlight panel icon in activity bar

3. Show tooltip: "Click here to open RCA Agent"

4. On first analysis: 
   "Great! Here's what each section does..."
   (Brief tour of panel)
```

**Upgrade (Existing Users):**
```
1. Detect existing settings

2. Show changelog:
   " RCA Agent has a new home!
    • Dedicated panel for easier access
    • All your old shortcuts still work
    • New batch analysis feature
    [Show Me] [Dismiss]"

3. Preserve all settings automatically

4. Optional: Show migration guide
```

### In-App Guidance

**Empty State Hints:**
```
No errors detected
  ↓
" Select error text and press Ctrl+Shift+R
    Or enable auto-detect in settings"
```

**Feature Discovery:**
```
First time right-clicking error:
  " Tip: Right-click for more options"

First time using history:
  " Tip: Click ↻ to re-analyze"
```

---

##  Rollback Strategy

### Feature Flags

**Enable/Disable Features:**
```typescript
// Extension settings
{
  "rcaAgent.experimental.enablePanel": true,
  "rcaAgent.experimental.enableAutoDetect": true,
  "rcaAgent.experimental.enableInlineActions": true,
  "rcaAgent.experimental.enableBatchAnalysis": true
}
```

**Graceful Degradation:**
```typescript
if (!config.get('enablePanel')) {
  // Fall back to command-based workflow
  registerLegacyCommands(context);
} else {
  // Use new panel interface
  registerPanelProvider(context);
}
```

### Quick Rollback Procedure

**If Critical Issues Arise:**

1. **Immediate Disable (< 5 min):**
   ```json
   // Update package.json
   "rcaAgent.experimental.enablePanel": false
   ```
   - Publish hotfix version
   - Old commands take over
   - Panel code dormant

2. **Emergency Patch (< 1 hour):**
   - Revert commits to last stable
   - Keep feature flag for gradual re-enable
   - Publish patch version
   - Notify users via marketplace

3. **Full Rollback (< 4 hours):**
   - Remove panel code entirely
   - Restore v0.1.x codebase
   - Document issues in changelog
   - Plan fixes for next release

### Monitoring & Analytics

**Track Adoption:**
```typescript
// Anonymized telemetry (opt-in)
{
  "event": "panel_opened",
  "feature": "error_queue",
  "success": true,
  "duration_ms": 234,
  "version": "0.2.0"
}
```

**Success Metrics:**
- Panel open rate (target: 80%+)
- Command vs. panel usage ratio
- Error detection rate
- Analysis success rate
- Time to first analysis (target: < 30s)
- User retention (7-day, 30-day)

**Alert Thresholds:**
- Error rate > 5% → Investigate
- Crash rate > 1% → Emergency patch
- Panel open rate < 50% → UX review
- Negative feedback > 20% → Reconsider design

---

##  Quick Reference Card

### For Users (Printable)

```
╔════════════════════════════════════════════╗
║   RCA AGENT - QUICK REFERENCE           ║
╠════════════════════════════════════════════╣
║ SHORTCUTS                                  ║
║ Ctrl+Shift+R    Analyze error (fast)       ║
║ Ctrl+Shift+W    Analyze error (panel)      ║
║ Ctrl+Shift+A    Toggle panel               ║
║ Ctrl+Shift+E    Educational mode           ║
║                                            ║
║ PANEL ACTIONS                              ║
║ Click error     View/analyze               ║
║ Right-click     Context menu               ║
║ [Analyze All]   Batch process errors       ║
║  Settings     Configure options          ║
║                                            ║
║ TIPS                                       ║
║ • Look for  lightbulb in editor          ║
║ • Badge shows unanalyzed error count       ║
║ • History saves past analyses              ║
║ • Pin important errors to top              ║
╚════════════════════════════════════════════╝
```

---

**Summary:** Every current feature is preserved and enhanced. New panel provides unified access while maintaining backward compatibility with all existing workflows.
