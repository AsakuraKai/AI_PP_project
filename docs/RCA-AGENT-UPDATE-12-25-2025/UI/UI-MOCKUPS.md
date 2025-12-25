# UI Mockups - RCA Agent Panel Design

**Visual designs and wireframes for the new dedicated panel interface**

---

## Overview

The new RCA Agent interface consists of:
1. **Activity Bar Icon** - Always visible access point
2. **Main Panel** - Dedicated side panel (TreeView + WebviewView hybrid)
3. **Inline Integration** - Lightbulb actions in editor
4. **Status Bar** - Quick status indicator

---

## Activity Bar Integration

### Icon Placement
```
┌───┐
│   │ ← Explorer
├───┤
│   │ ← Search
├───┤
│   │ ← Source Control
├───┤
│   │ ← Run & Debug
├───┤
│   │ ← Extensions
├───┤
│   │ ← RCA AGENT (NEW!)
└───┘
```

### Badge Notifications
```
┌───┐
│ 3 │ ← "3" = Number of unanalyzed errors
└───┘
```

**Behavior:**
- Click icon → Toggle panel visibility
- Right-click → Quick actions menu
- Badge updates automatically when errors detected

---

## Main Panel Layout (Full View)

### Default State (No Errors)
```
╔═══════════════════════════════════════════════════════╗
║ RCA AGENT                             [Settings] [Docs] [X] ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║              [ Analyze Selected Error]               ║
║                                                       ║
║  ╭───────────────────────────────────────────────╮   ║
║  │                                               │   ║
║  │        No errors detected                     │   ║
║  │                                               │   ║
║  │   Select error text in editor and            │   ║
║  │      click "Analyze Selected Error"          │   ║
║  │                                               │   ║
║  │   Or use keyboard shortcut:                  │   ║
║  │   • Ctrl+Shift+R (Quick analyze)             │   ║
║  │   • Ctrl+Shift+W (Panel analyze)             │   ║
║  │                                               │   ║
║  ╯───────────────────────────────────────────────╯   ║
║                                                       ║
║  Tips:                                                 ║
║  • Enable auto-detect in settings                    ║
║  • Right-click errors for quick actions              ║
║  • Use educational mode for learning                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Active State (With Errors)
```
╔═══════════════════════════════════════════════════════╗
║ RCA AGENT                             [Settings] [Docs] [X] ║
╠═══════════════════════════════════════════════════════╣
║ ERROR QUEUE                            [> Analyze All]║
╟───────────────────────────────────────────────────────╢
║ ┌─────────────────────────────────────────────────┐   ║
║ │  NullPointerException                  Line 42│   ║
║ │    MainActivity.kt                      [Analyze]│   ║
║ ├─────────────────────────────────────────────────┤   ║
║ │ 🟡 Unresolved reference: User            Line 15│   ║
║ │    UserRepository.kt                    [Analyze]│   ║
║ ├─────────────────────────────────────────────────┤   ║
║ │ 🟢 Compose recomposition                Line 88│   ║
║ │    HomeScreen.kt                        [Analyze]│   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║  CURRENT ANALYSIS                    [ Stop] []  ║
╟───────────────────────────────────────────────────────╢
║ Error: NullPointerException at MainActivity.kt:42     ║
║ Type: kotlin_npe                                      ║
║                                                       ║
║  Progress: █████████████░░░░░░░ 65%                 ║
║     Analyzing error pattern...                      ║
║                                                       ║
║ Iteration 2 of 3                                      ║
║ Tools used: ReadFileTool, KotlinParser                ║
║ Elapsed: 23.4s                                        ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║  HISTORY                                      []   ║
╟───────────────────────────────────────────────────────╢
║ • NPE at MainActivity.kt:42          5 mins ago [↻]   ║
║ • lateinit at UserRepo.kt:28         1 hour ago [↻]   ║
║ • Gradle conflict                    2 hours ago [↻]  ║
╚═══════════════════════════════════════════════════════╝
```

### Error States

#### Ollama Unavailable
```
╔═══════════════════════════════════════════════════════╗
║  RCA AGENT                           [] [] [] ║
╠═══════════════════════════════════════════════════════╣
║   OLLAMA SERVER NOT AVAILABLE                       ║
╟───────────────────────────────────────────────────────╢
║                                                       ║
║  The Ollama server is not responding.                 ║
║                                                       ║
║  Please ensure Ollama is running:                     ║
║  1. Open terminal                                     ║
║  2. Run: ollama serve                                 ║
║  3. Wait for "Ollama is running" message              ║
║                                                       ║
║  Current URL: http://localhost:11434                  ║
║                                                       ║
║  [ Check Connection] [ Change URL] [ View Logs]     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

#### Model Not Found
```
╔═══════════════════════════════════════════════════════╗
║  RCA AGENT                           [] [] [] ║
╠═══════════════════════════════════════════════════════╣
║   MODEL NOT FOUND                                   ║
╟───────────────────────────────────────────────────────╢
║                                                       ║
║  The model 'deepseek-r1' is not installed.           ║
║                                                       ║
║  To install the model:                                ║
║  1. Open terminal                                     ║
║  2. Run: ollama pull deepseek-r1                      ║
║  3. Wait for download to complete                     ║
║                                                       ║
║  Alternative models:                                  ║
║  • deepseek-coder (smaller, faster)                   ║
║  • codellama (optimized for code)                     ║
║                                                       ║
║  [ Install Model] [ Choose Different Model]         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

#### Analysis Timeout
```
╔═══════════════════════════════════════════════════════╗
║  RCA AGENT                           [] [] [] ║
╠═══════════════════════════════════════════════════════╣
║   ANALYSIS TIMEOUT                                  ║
║ NullPointerException at MainActivity.kt:42            ║
╟───────────────────────────────────────────────────────╢
║                                                       ║
║  Analysis exceeded timeout limit (120s)               ║
║                                                       ║
║  Suggestions:                                         ║
║  • Try Fast mode (1-2 iterations)                     ║
║  • Reduce max iterations in settings                  ║
║  • Increase timeout value                             ║
║  • Check if error context is too large                ║
║                                                       ║
║  [ Retry with Fast Mode] [ Adjust Settings]         ║
║  [ Retry with Same Settings]                         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

#### Parse Error
```
╔═══════════════════════════════════════════════════════╗
║  RCA AGENT                           [] [] [] ║
╠═══════════════════════════════════════════════════════╣
║   COULD NOT PARSE ERROR                             ║
╟───────────────────────────────────────────────────────╢
║                                                       ║
║  The error format was not recognized.                 ║
║                                                       ║
║  Detected text:                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ Some random text that's not an error message   │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
║  Tips:                                                ║
║  • Select the complete error message                  ║
║  • Include stack trace if available                   ║
║  • Copy from Problems panel for best results          ║
║                                                       ║
║  [ Try Different Selection] [ Report Issue]         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Health Check Indicator

Added to bottom of panel:
```
╠═══════════════════════════════════════════════════════╣
║ STATUS                                                ║
║  Ollama: Connected (localhost:11434)                ║
║  Model: deepseek-r1 (loaded)                        ║
║  Cache: 45 entries (12.3 MB)                        ║
║  Last check: 2s ago                  [ Refresh]    ║
╚═══════════════════════════════════════════════════════╝
```

### Analysis Complete State
```
╔═══════════════════════════════════════════════════════╗
║  RCA AGENT                           [] [] [] ║
╠═══════════════════════════════════════════════════════╣
║  ANALYSIS COMPLETE                                  ║
║ NullPointerException at MainActivity.kt:42            ║
╟───────────────────────────────────────────────────────╢
║                                                       ║
║  ROOT CAUSE                                         ║
║ ┌─────────────────────────────────────────────────┐   ║
║ │ Accessing 'name' property on null User object.  │   ║
║ │ The getUserById() returns null when user not    │   ║
║ │ found, but code doesn't check for null.         │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║  CODE CONTEXT                         [View File ↗] ║
║ ┌─────────────────────────────────────────────────┐   ║
║ │ 40: fun displayUser(id: Int) {               │   ║
║ │ 41:   val user = getUserById(id)             │   ║
║ │ 42: → println(user.name) //  CRASH HERE    │   ║
║ │ 43:   println(user.email)                    │   ║
║ │ 44: }                                        │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║  FIX GUIDELINES                                     ║
║ ┌─────────────────────────────────────────────────┐   ║
║ │ 1. Use safe call operator                       │   ║
║ │    println(user?.name)              [ Copy]   │   ║
║ │                                                 │   ║
║ │ 2. Use Elvis operator with default             │   ║
║ │    val name = user?.name ?: "Unknown"          │   ║
║ │    println(name)                    [ Copy]   │   ║
║ │                                                 │   ║
║ │ 3. Check for null explicitly                   │   ║
║ │    if (user != null) {                         │   ║
║ │      println(user.name)                        │   ║
║ │    }                                [ Copy]   │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║  CONFIDENCE: ████████████████████░ 92%              ║
║                                                       ║
║ [ Helpful] [ Not Helpful] [ Feedback]          ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║  LEARNING NOTES (Educational Mode)           []   ║
╟───────────────────────────────────────────────────────╢
║  What is NullPointerException?                      ║
║ Kotlin's null means "no value" - like an empty box.  ║
║ NPE happens when you try to use what's inside a      ║
║ null/empty box.                                      ║
║                                                       ║
║  Why did this happen?                               ║
║ getUserById() returns User? (nullable type), but     ║
║ you accessed .name without checking for null first.  ║
║                                                       ║
║  How to prevent this?                               ║
║ • Always use ?. for nullable types                   ║
║ • Use ?: to provide defaults                         ║
║ • Avoid !! (force unwrap) unless 100% certain        ║
╚═══════════════════════════════════════════════════════╝
```

---

## 3⃣ Toolbar Actions

### Main Toolbar (Always Visible)
```
┌──────────────────────────────────────────┐
│ [ Analyze] [] [] [] [] []    │
└──────────────────────────────────────────┘

 Analyze    = Analyze selected/all errors
 Pause      = Stop current analysis
 Refresh    = Reload error queue
 Settings  = Open settings dropdown
 Docs       = Open documentation
 Close       = Close panel
```

### Settings Dropdown () - Expanded
```
┌─────────────────────────────────────────┐
│  SETTINGS                             │
├─────────────────────────────────────────┤
│ Display                                 │
│   Educational Mode                   │
│   Performance Metrics                │
│   Show Confidence Bars               │
│   Syntax Highlighting                │
│                                         │
│ Behavior                                │
│   Auto-detect Errors                 │
│   Auto-save Results                  │
│   Desktop Notifications              │
│   Keep Panel Open After Analysis     │
│                                         │
│ Analysis                                │
│ • Max Iterations: [3  ]                │
│ • Analysis Mode: [Standard ]           │
│   ├─ Fast (1-2 iterations)              │
│   ├─ Standard (3 iterations)            │
│   └─ Deep (5-10 iterations)             │
│                                         │
│ Model Configuration                     │
│ • Model: [DeepSeek-R1 ]                │
│ • Ollama URL: [localhost:11434]         │
│ • Timeout: [120s]                       │
│                                         │
│ Advanced                                │
│ • [ View Logs]                        │
│ • [ Clear Cache]                      │
│ • [ Advanced Settings...]             │
│                                         │
│ [Reset to Defaults] [Apply] [Cancel]   │
└─────────────────────────────────────────┘
```

---

## 4⃣ Error Queue Item States

### Unanalyzed Error
```
┌─────────────────────────────────────────────────┐
│  NullPointerException                  Line 42│
│    MainActivity.kt                      [Analyze]│
│    Detected 2 mins ago                          │
└─────────────────────────────────────────────────┘
  │
  └─ Click anywhere to expand details
     Right-click for context menu
```

### Analyzing (In Progress)
```
┌─────────────────────────────────────────────────┐
│ 🟡 NullPointerException                  Line 42│
│    MainActivity.kt                      [ Stop]│
│     Analyzing... 45s elapsed                  │
│    █████████░░░░░░░ 60%                         │
└─────────────────────────────────────────────────┘
```

### Analyzed (Success)
```
┌─────────────────────────────────────────────────┐
│ 🟢 NullPointerException                  Line 42│
│    MainActivity.kt                  [View ↗] [↻]│
│     Analyzed • 92% confidence • 56.3s         │
│    Fix: Use safe call operator (?.)             │
└─────────────────────────────────────────────────┘
  │
  └─ Click to view full analysis
     [↻] Re-analyze with different settings
```

### Analyzed (Failed)
```
┌─────────────────────────────────────────────────┐
│  NullPointerException                  Line 42│
│    MainActivity.kt                  [Retry] [?] │
│     Analysis failed • Timeout after 120s      │
│    Suggestion: Try Fast mode or smaller context │
└─────────────────────────────────────────────────┘
```

### Context Menu (Right-click on error)
```
┌──────────────────────────┐
│  Analyze Now           │
│  Go to Error Location  │
│  Copy Error Message    │
│ ──────────────────       │
│  Analyze with Fast Mode│
│  Analyze with Deep Mode│
│ ──────────────────       │
│  Remove from Queue     │
│  Pin to Top            │
└──────────────────────────┘
```

---

## 5⃣ Inline Editor Integration

### Lightbulb Quick Actions
```
40: fun displayUser(id: Int) {
41:   val user = getUserById(id)
42:   println(user.name) //  Error: NPE
         ↑
          ← Hover shows lightbulb

Click lightbulb → Quick Actions Menu:
┌────────────────────────────────┐
│  Analyze with RCA Agent      │ ← NEW!
│  Quick Fix...                │
│  Explain Problem             │
│  Suppress Warning            │
└────────────────────────────────┘
```

### Peek View (After Analysis)
```
40: fun displayUser(id: Int) {
41:   val user = getUserById(id)
42:   println(user.name) //  Error
43: }
    ──────────────────────────────────────────
    │  RCA Agent - Analysis Result           │
    │─────────────────────────────────────────│
    │ Root Cause: Null reference access       │
    │                                         │
    │ Fix: Use safe call operator             │
    │   println(user?.name)    [Apply Fix]   │
    │                                         │
    │ [View Full Analysis] [Copy] [Dismiss]  │
    └─────────────────────────────────────────┘
```

---

## 6⃣ Status Bar Integration

### Idle State
```
Status Bar: [...other items...]  RCA: Ready  [...other items...]
```

### Analyzing State
```
Status Bar: [...]  RCA: Analyzing (2/3) 67% [...] 
                         ↑
                         Click to open panel
```

### Error Detected State
```
Status Bar: [...]  RCA: 3 errors detected [...] 
                         ↑
                         Badge notification (clickable)
```

### With Badge Count
```
Status Bar: [...]  (3) RCA Agent [...]
```

---

## 7⃣ Batch Analysis View

### Batch Analysis Panel
```
╔═══════════════════════════════════════════════════════╗
║  BATCH ANALYSIS - 3 Errors                          ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  PRIORITY QUEUE                                     ║
║ ┌─────────────────────────────────────────────────┐   ║
║ │  CRITICAL - Fix First                          │   ║
║ │ ├─ Gradle dependency conflict (blocks build)    │   ║
║ │ │  build.gradle.kts:15                          │   ║
║ │ └─ Status:  Analyzing...                       │   ║
║ │                                                 │   ║
║ │ 🟡 HIGH - Fix Next                               │   ║
║ │ ├─ NullPointerException (runtime crash)         │   ║
║ │ │  MainActivity.kt:42                           │   ║
║ │ └─ Status:  Queued                             │   ║
║ │                                                 │   ║
║ │ 🟢 MEDIUM - Optimize Later                       │   ║
║ │ ├─ Compose recomposition (performance)          │   ║
║ │ │  HomeScreen.kt:88                             │   ║
║ │ └─ Status:  Queued                             │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║  PROGRESS                                           ║
║ ┌─────────────────────────────────────────────────┐   ║
║ │ Overall: ███████░░░░░░░░░░░░░ 33%               │   ║
║ │                                                 │   ║
║ │ • Critical: █████░░░░░ 50%                      │   ║
║ │ • High: ░░░░░░░░░░ 0%                           │   ║
║ │ • Medium: ░░░░░░░░░░ 0%                         │   ║
║ │                                                 │   ║
║ │ Estimated time remaining: ~45s                  │   ║
║ └─────────────────────────────────────────────────┘   ║
║                                                       ║
║ [ Pause All] [ Stop] [ Settings]                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## 8⃣ History View (Collapsed/Expanded)

### Collapsed
```
╔═══════════════════════════════════════════════════════╗
║  HISTORY (5)                                  []   ║
╚═══════════════════════════════════════════════════════╝
```

### Expanded
```
╔═══════════════════════════════════════════════════════╗
║  HISTORY                                      []   ║
╟───────────────────────────────────────────────────────╢
║ Today                                                 ║
║ • NullPointerException                   5 mins ago   ║
║   MainActivity.kt:42                    [↻] [] [↗] ║
║   ├─ Confidence: 92%                                  ║
║   └─ Fix applied: Safe call operator                 ║
║                                                       ║
║ • Unresolved reference                   1 hour ago   ║
║   UserRepository.kt:15                  [↻] [] [↗] ║
║   └─ From cache                                       ║
║                                                       ║
║ Yesterday                                             ║
║ • Gradle conflict                        2 hours ago  ║
║   build.gradle.kts:28                   [↻] [] [↗] ║
║                                                       ║
║ • lateinit error                         3 hours ago  ║
║   DataManager.kt:56                     [↻] [] [↗] ║
║                                                       ║
║ [ Search History] [ Clear All] [ Statistics]    ║
╚═══════════════════════════════════════════════════════╝
```

### History Item Actions
```
[↻] = Re-analyze with current settings
[] = Delete from history
[↗] = Open in editor
```

---

## 9⃣ Theme Variants

### Dark Theme
```
Colors:
- Background: #1E1E1E (VS Code dark)
- Foreground: #D4D4D4
- Accent: #007ACC (blue)
- Success: #4EC9B0 (green)
- Warning: #CE9178 (orange)
- Error: #F48771 (red)
- Border: #3C3C3C
```

### Light Theme
```
Colors:
- Background: #FFFFFF
- Foreground: #000000
- Accent: #0066CC (blue)
- Success: #107C10 (green)
- Warning: #CA5010 (orange)
- Error: #E81123 (red)
- Border: #CCCCCC
```

### High Contrast Theme
```
Colors:
- Background: #000000
- Foreground: #FFFFFF
- Accent: #FFFF00 (yellow)
- Success: #00FF00 (bright green)
- Warning: #FFAA00 (bright orange)
- Error: #FF0000 (bright red)
- Border: #FFFFFF
```

---

##  Interaction Patterns

### Keyboard Navigation
```
Tab          = Navigate between sections
Shift+Tab    = Navigate backwards
Arrow Keys   = Navigate error list
Enter        = Analyze selected error
Space        = Toggle section expand/collapse
Escape       = Close panel / Cancel analysis
Ctrl+F       = Search in history
Ctrl+R       = Refresh error queue
```

### Mouse Gestures
```
Click        = Select error / Open section
Double-Click = Analyze error immediately
Right-Click  = Context menu
Hover        = Show tooltip / Preview
Drag         = Reorder errors (in manual mode)
```

### Touch Gestures (for touch screens)
```
Tap          = Select / Open
Long Press   = Context menu
Swipe Left   = Delete error
Swipe Right  = Analyze error
Pinch        = Zoom UI (accessibility)
```

---

##  Responsive Design

### Narrow Panel (Width < 300px)
```
╔═══════════════════════╗
║  RCA      [] [] ║
╠═══════════════════════╣
║ QUEUE (3)             ║
║ ┌───────────────────┐ ║
║ │  NPE            │ ║
║ │ Line 42           │ ║
║ │ [Analyze]         │ ║
║ └───────────────────┘ ║
║                       ║
║ (Compact view)        ║
╚═══════════════════════╝
```

### Standard Panel (Width 300-500px)
```
Standard layout shown above
```

### Wide Panel (Width > 500px)
```
╔═══════════════════════════════════════════════╗
║  RCA AGENT                    [] [] []║
╠═════════════════════╦═════════════════════════╣
║ ERROR QUEUE         ║ ANALYSIS DETAILS        ║
║ ┌─────────────────┐ ║ ┌─────────────────────┐ ║
║ │  NPE Line 42  │ ║ │ Root Cause: ...     │ ║
║ └─────────────────┘ ║ │                     │ ║
║ ┌─────────────────┐ ║ │ Fix: ...            │ ║
║ │ 🟡 Unresolved   │ ║ │                     │ ║
║ └─────────────────┘ ║ │ [Apply] [Copy]      │ ║
║                     ║ └─────────────────────┘ ║
║ (Side-by-side view) ║                         ║
╚═════════════════════╩═════════════════════════╝
```

---

##  Visual Enhancements

### Loading Animations
```
Analyzing:  →  →  →  → 
(Animated icon rotation)

Progress Bar: 
[████████░░░░░░░░] → Smooth left-to-right fill
```

### Transition Effects
```
Error Added:    Slide in from top + fade in
Error Removed:  Fade out + slide up
Panel Open:     Slide in from side
Panel Close:    Slide out to side
Section Expand: Smooth height transition (200ms)
```

### Microinteractions
```
Button Hover:   Scale 1.05 + shadow
Button Click:   Scale 0.95 + ripple effect
Badge Update:   Pulse animation (1 cycle)
Success:        Checkmark  with bounce
Error:          Shake animation + red glow
```

---

**Design Notes:**
- All measurements are flexible (CSS flexbox/grid)
- Icons use VS Code Codicons font
- Colors use CSS variables for theming
- Animations respect `prefers-reduced-motion`
- All interactive elements have focus indicators
- Minimum touch target: 44×44px (WCAG)

**Accessibility:**
- ARIA labels on all interactive elements
- Keyboard shortcuts don't conflict with VS Code
- Screen reader announcements for state changes
- Color contrast meets WCAG 2.1 AA (4.5:1 minimum)
- Focus visible for keyboard navigation
