# [DESIGN] VS Code Extension - Visual Workflow Guide

> **Visual diagrams showing how the extension works from user interaction to final result**

---

## [TARGET] Table of Contents

1. [User Interaction Flow](#user-interaction-flow)
2. [Analysis Pipeline](#analysis-pipeline)
3. [UI Update Flow](#ui-update-flow)
4. [Cache Flow](#cache-flow)
5. [Feedback Loop](#feedback-loop)

---

## 👤 User Interaction Flow

### Scenario: User Analyzes an Error

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                               │
└─────────────────────────────────────────────────────────────────┘

[User copies error from terminal/logcat]
         │
         ├─────────────┬──────────────┬────────────────┐
         │             │              │                │
         [DOWN]             [DOWN]              [DOWN]                [DOWN]
   [Paste in    [Select in    [Cmd Palette]   [Cmd Palette]
    editor]      editor]                       
         │             │              │                │
         │             │              │                │
         └─────────────┴──────────────┴────────────────┘
                       │
                       [DOWN]
              [Press Ctrl+Shift+R]
               OR [Ctrl+Shift+W]
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                  EXTENSION ACTIVATION                           │
└─────────────────────────────────────────────────────────────────┘
                       │
                       [DOWN]
         ┌─────────────────────────┐
         │  analyzeErrorCommand()  │
         └─────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         [DOWN]                            [DOWN]
   [Get from           [Show input box]
    selection]          "Paste error..."
         │                            │
         └────────────┬───────────────┘
                      │
                      [DOWN]
              [Error text acquired]
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                     PROCESSING                                  │
└─────────────────────────────────────────────────────────────────┘
                      │
                      [DOWN]
              [Sanitize input]
                      │
                      [DOWN]
              [Parse error]
                      │
         ┌────────────┴────────────┐
         │                         │
         [DOWN]                         [DOWN]
    [Cache HIT]              [Cache MISS]
         │                         │
         │                         [DOWN]
         │              [Run full analysis]
         │              [3 iterations]
         │                         │
         └────────────┬────────────┘
                      │
                      [DOWN]
┌─────────────────────┴───────────────────────────────────────────┐
│                      DISPLAY                                    │
└─────────────────────────────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         [DOWN]                         [DOWN]
  [Output Channel]           [Webview Panel]
   (Text format)            (Visual UI)
         │                         │
         └────────────┬────────────┘
                      │
                      [DOWN]
              [Show feedback]
                 [[LIKE] / [DISLIKE]]
                      │
                      [DOWN]
              [Update database]
              [Update cache]
                      │
                      [DOWN]
                   [DONE]
```

---

## [REFRESH] Analysis Pipeline

### Detailed Processing Steps

```
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 1: INPUT VALIDATION & SANITIZATION                            │
└──────────────────────────────────────────────────────────────────────┘

Input Text (raw)
      │
      [DOWN]
  ┌─────────────────────┐
  │ Length Check        │  Max 50KB
  │ (<50,000 chars)     │  [DONE] Pass / [FAIL] Reject
  └─────────┬───────────┘
            │
            [DOWN]
  ┌─────────────────────┐
  │ Sanitize            │  Remove control chars
  │ - Remove \x00-\x1F  │  Trim whitespace
  │ - Trim              │
  └─────────┬───────────┘
            │
            [DOWN]
  Sanitized Text
      │
┌─────┴──────────────────────────────────────────────────────────────┐
│  STEP 2: ERROR PARSING & LANGUAGE DETECTION                        │
└────────────────────────────────────────────────────────────────────┘
      │
      [DOWN]
  ┌─────────────────────┐
  │ Language Detector   │  Keyword analysis
  │ - Check keywords    │  + File extension
  │ - Check extension   │  → Confidence score
  └─────────┬───────────┘
            │
            ├─ Kotlin (90%) → KotlinParser
            ├─ Compose (85%) → JetpackComposeParser
            ├─ XML (95%) → XMLParser
            ├─ Gradle (80%) → GradleParser
            └─ Manifest (90%) → ManifestParser
            │
            [DOWN]
  ┌─────────────────────┐
  │ Language Parser     │  Extract:
  │ - Error type        │  • type (lateinit, npe)
  │ - File path         │  • message
  │ - Line number       │  • filePath (MyClass.kt)
  │ - Stack trace       │  • line (42)
  └─────────┬───────────┘
            │
            [DOWN]
  ParsedError {
    type: 'lateinit',
    message: '...',
    filePath: 'MainActivity.kt',
    line: 42,
    language: 'kotlin'
  }
      │
┌─────┴──────────────────────────────────────────────────────────────┐
│  STEP 3: CACHE LOOKUP                                              │
└────────────────────────────────────────────────────────────────────┘
      │
      [DOWN]
  ┌─────────────────────┐
  │ ErrorHasher         │  SHA-256 hash
  │ - Normalize message │  of normalized
  │ - Generate hash     │  error
  └─────────┬───────────┘
            │
            [DOWN]
  hash: "a3b2c1d4..."
      │
      [DOWN]
  ┌─────────────────────┐
  │ RCACache.get()      │  Check L1 cache
  │ - Lookup hash       │  (in-memory Map)
  │ - Check TTL         │
  └─────────┬───────────┘
            │
      ┌─────┴──────┐
      │            │
      [DOWN] (Hit)      [DOWN] (Miss)
  [Return      [Continue to
   cached]      analysis]
      │            │
      │            [DOWN]
      │  ┌─────────────────────┐
      │  │ Agent Analysis      │  3 iterations
      │  │ (75s avg)           │  with tools
      │  └─────────┬───────────┘
      │            │
      │            [DOWN]
      │  ┌─────────────────────┐
      │  │ RCACache.set()      │  Store result
      │  │ - Cache with TTL    │  for 24 hours
      │  └─────────┬───────────┘
      │            │
      └────────────┼───────────┐
                   │
┌──────────────────┴───────────────────────────────────────────────────┐
│  STEP 4: RESULT DISPLAY                                             │
└──────────────────────────────────────────────────────────────────────┘
                   │
                   [DOWN]
         RCAResult {
           error: '...',
           rootCause: '...',
           fixGuidelines: ['1...', '2...'],
           confidence: 0.92,
           fromCache: false,
           ...
         }
                   │
      ┌────────────┴─────────────┐
      │                          │
      [DOWN]                          [DOWN]
┌──────────────┐      ┌──────────────────┐
│ Output       │      │ Webview          │
│ Channel      │      │ Panel            │
│              │      │                  │
│ Text format  │      │ Visual UI        │
│ with         │      │ with progress    │
│ separators   │      │ & interactions   │
└──────┬───────┘      └────────┬─────────┘
       │                       │
       └───────────┬───────────┘
                   │
┌──────────────────┴───────────────────────────────────────────────────┐
│  STEP 5: FEEDBACK COLLECTION                                        │
└──────────────────────────────────────────────────────────────────────┘
                   │
                   [DOWN]
         [Show feedback prompt]
              [[LIKE] / [DISLIKE]]
                   │
      ┌────────────┴─────────────┐
      │                          │
      [DOWN] (Positive)               [DOWN] (Negative)
┌──────────────┐      ┌──────────────────┐
│ +20%         │      │ -50%             │
│ confidence   │      │ confidence       │
│              │      │                  │
│ Keep in      │      │ Invalidate       │
│ cache        │      │ cache            │
└──────┬───────┘      └────────┬─────────┘
       │                       │
       └───────────┬───────────┘
                   │
                   [DOWN]
         [Update database]
         [Quality score]
                   │
                   [DOWN]
                 [DONE]
```

---

## [DESIGN] UI Update Flow

### Real-Time Progress Updates

```
┌──────────────────────────────────────────────────────────────────┐
│                   WEBVIEW UPDATES                                │
└──────────────────────────────────────────────────────────────────┘

Agent Analysis Starts
         │
         [DOWN]
  ┌─────────────────┐
  │ Iteration 1/3   │
  │ Thought:        │
  │ "Analyzing      │
  │  error type..." │
  └────────┬────────┘
           │
           │ [Event: 'iteration']
           │
           [DOWN]
   ┌─────────────────────┐
   │ Webview.postMessage │
   │ { type: 'progress', │
   │   iteration: 1,     │
   │   maxIterations: 3, │
   │   thought: '...',   │
   │   progress: 33 }    │
   └─────────┬───────────┘
             │
             [DOWN]
   ┌─────────────────────────┐
   │ Webview JavaScript      │
   │ - Update progress bar   │
   │ - Show thought text     │
   │ - Animate transition    │
   └─────────┬───────────────┘
             │
   ┌─────────┴────────────────────────────────┐
   │                                          │
   │  ╔════════════════════════════════════╗  │
   │  ║  RCA Agent - Analysis              ║  │
   │  ╠════════════════════════════════════╣  │
   │  ║                                    ║  │
   │  ║  Iteration 1/3                     ║  │
   │  ║  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ 33%     ║  │
   │  ║                                    ║  │
   │  ║  💭 Analyzing error type and       ║  │
   │  ║     extracting file context...     ║  │
   │  ║                                    ║  │
   │  ╚════════════════════════════════════╝  │
   │                                          │
   └──────────────────────────────────────────┘
             │
             [DOWN]
  [Repeat for iterations 2 and 3]
             │
             [DOWN]
  ┌─────────────────┐
  │ Analysis        │
  │ Complete        │
  └────────┬────────┘
           │
           │ [Event: 'complete']
           │
           [DOWN]
   ┌─────────────────────┐
   │ Webview.postMessage │
   │ { type: 'result',   │
   │   rca: {...} }      │
   └─────────┬───────────┘
             │
             [DOWN]
   ┌─────────────────────────┐
   │ Webview JavaScript      │
   │ - Hide progress         │
   │ - Render results        │
   │ - Show feedback buttons │
   └─────────┬───────────────┘
             │
   ┌─────────┴────────────────────────────────┐
   │                                          │
   │  ╔════════════════════════════════════╗  │
   │  ║  [RED] LATEINIT                       ║  │
   │  ║  MainActivity.kt:42                ║  │
   │  ╠════════════════════════════════════╣  │
   │  ║                                    ║  │
   │  ║  [TARGET] Root Cause                     ║  │
   │  ║  Property accessed before init...  ║  │
   │  ║                                    ║  │
   │  ║  [FIX] Fix Guidelines                 ║  │
   │  ║  1. Initialize in onCreate()       ║  │
   │  ║  2. Use nullable type              ║  │
   │  ║                                    ║  │
   │  ║  [DONE] Confidence: 92%                ║  │
   │  ║                                    ║  │
   │  ║  [[LIKE] Helpful] [[DISLIKE] Not Helpful]    ║  │
   │  ║                                    ║  │
   │  ╚════════════════════════════════════╝  │
   │                                          │
   └──────────────────────────────────────────┘
```

---

## [SAVE] Cache Flow

### Cache Hit vs Cache Miss

```
┌──────────────────────────────────────────────────────────────────┐
│                      CACHE SYSTEM                                │
└──────────────────────────────────────────────────────────────────┘

ParsedError
     │
     [DOWN]
┌─────────────────┐
│ ErrorHasher     │
│ hash(error)     │
└────────┬────────┘
         │
         [DOWN]
   hash: "a3b2..."
         │
         [DOWN]
┌─────────────────┐
│ RCACache        │
│ .get(hash)      │
└────────┬────────┘
         │
   ┌─────┴──────┐
   │            │
   [DOWN]            [DOWN]
[Found]      [Not Found]
   │            │
   ├─ Check TTL
   │            │
   ├─ Expired?  │
   │   │        │
   │   [DOWN]        │
   │  Yes       No
   │   │        │
   │   └────────┤
   │            │
   │            [DOWN]
   │       [Return result]
   │       [FAST] <5s
   │
   └────────────┼────────────┐
                │            │
                [DOWN]            [DOWN]
        ┌──────────────────────────┐
        │ Full Analysis Required   │
        │ - Initialize agent       │
        │ - Run 3 iterations       │
        │ - Execute tools          │
        │ - Generate RCA           │
        │ [TIMER] ~75s                  │
        └─────────┬────────────────┘
                  │
                  [DOWN]
        ┌──────────────────────────┐
        │ Store in Cache           │
        │ - Generate hash          │
        │ - Set TTL (24h)          │
        │ - Store in Map           │
        └─────────┬────────────────┘
                  │
                  [DOWN]
              [Return result]

┌─────────────────────────────────────────────────────────────────┐
│  CACHE STATISTICS                                               │
└─────────────────────────────────────────────────────────────────┘

    Average Performance:
    
    ╔══════════════════════════════════════════════╗
    ║  Cache Hit:  <5s    ▓▓░░░░░░░░░░░░░░░░░░   ║
    ║  Cache Miss: 75s    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ║
    ║                                              ║
    ║  Cache Hit Rate: ~60% for common errors     ║
    ║  Speed Improvement: 15x faster              ║
    ╚══════════════════════════════════════════════╝
```

---

## [REPEAT] Feedback Loop

### How Feedback Improves Future Analyses

```
┌──────────────────────────────────────────────────────────────────┐
│                   FEEDBACK SYSTEM                                │
└──────────────────────────────────────────────────────────────────┘

User Views Result
        │
        [DOWN]
[Show feedback buttons]
   [[LIKE]] [[DISLIKE]]
        │
   ┌────┴─────┐
   │          │
   [DOWN]          [DOWN]
[Positive] [Negative]
   │          │
   │          [DOWN]
   │     [Optional comment]
   │          │
   └─────┬────┘
         │
         [DOWN]
┌─────────────────────────────────────────────────────────────────┐
│  POSITIVE FEEDBACK ([LIKE])                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         [DOWN]
  ┌──────────────────┐
  │ Update Database  │
  │ - confidence +20%│
  │ - quality +0.1   │
  │ - validated=true │
  └────────┬─────────┘
           │
           [DOWN]
  ┌──────────────────┐
  │ Update Cache     │
  │ - Keep entry     │
  │ - Update metadata│
  └────────┬─────────┘
           │
           [DOWN]
  ┌──────────────────┐
  │ Future Impact    │
  │ [DONE] Higher rank   │
  │ [DONE] More visible  │
  │ [DONE] Longer TTL    │
  └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NEGATIVE FEEDBACK ([DISLIKE])                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         [DOWN]
  ┌──────────────────┐
  │ Update Database  │
  │ - confidence -50%│
  │ - quality -0.2   │
  │ - validated=false│
  │ - store comment  │
  └────────┬─────────┘
           │
           [DOWN]
  ┌──────────────────┐
  │ Invalidate Cache │
  │ - Remove entry   │
  │ - Force re-run   │
  └────────┬─────────┘
           │
           [DOWN]
  ┌──────────────────┐
  │ Future Impact    │
  │ [FAIL] Lower rank    │
  │ [FAIL] Less visible  │
  │ [FAIL] Re-analyzed   │
  └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FEEDBACK CYCLE                                                 │
└─────────────────────────────────────────────────────────────────┘

    Iteration 1: Initial Analysis
         │
         [DOWN]
    [User feedback: [DISLIKE]]
         │
         [DOWN]
    [Confidence lowered]
    [Cache invalidated]
         │
         [DOWN]
    Iteration 2: Re-Analysis (next time)
         │
         [DOWN]
    [Better result]
         │
         [DOWN]
    [User feedback: [LIKE]]
         │
         [DOWN]
    [Confidence boosted]
    [Cached & prioritized]
         │
         [DOWN]
    Future: Fast & Accurate Results [DONE]
```

---

## [LEARN] Educational Mode Flow

### How Educational Mode Enriches Results

```
┌──────────────────────────────────────────────────────────────────┐
│           EDUCATIONAL MODE (Ctrl+Shift+E)                        │
└──────────────────────────────────────────────────────────────────┘

Standard Analysis
        │
        [DOWN]
  ┌──────────────────┐
  │ Generate RCA     │
  │ - Root cause     │
  │ - Fix guidelines │
  │ - Confidence     │
  └────────┬─────────┘
           │
           │
     [Educational Mode Enabled?]
           │
      ┌────┴─────┐
      │          │
      [DOWN] (No)     [DOWN] (Yes)
  [Return]  ┌────────────────────┐
            │ EducationalAgent   │
            │ .enrichWithNotes() │
            └─────────┬──────────┘
                      │
                      [DOWN]
            ┌────────────────────┐
            │ Generate:          │
            │ - "What" section   │
            │ - "Why" section    │
            │ - "How" section    │
            │ - Code examples    │
            └─────────┬──────────┘
                      │
                      [DOWN]
            RCAResult + LearningNotes
                      │
                      [DOWN]
┌─────────────────────────────────────────────────────────────────┐
│  DISPLAY COMPARISON                                             │
└─────────────────────────────────────────────────────────────────┘

    Standard Mode               Educational Mode
    
    ╔═════════════════╗         ╔═════════════════════════════╗
    ║ [RED] LATEINIT     ║         ║ [RED] LATEINIT                 ║
    ║ MainActivity:42 ║         ║ MainActivity:42             ║
    ╠═════════════════╣         ╠═════════════════════════════╣
    ║                 ║         ║                             ║
    ║ [TARGET] Root Cause   ║         ║ [TARGET] Root Cause               ║
    ║ Property...     ║         ║ Property accessed before... ║
    ║                 ║         ║                             ║
    ║ [FIX] Fix          ║         ║ [FIX] Fix Guidelines           ║
    ║ 1. Initialize   ║         ║ 1. Initialize in onCreate() ║
    ║ 2. Use nullable ║         ║ 2. Use nullable type        ║
    ║                 ║         ║                             ║
    ║ [DONE] 92%          ║         ║ [DONE] Confidence: 92%          ║
    ╚═════════════════╝         ║                             ║
                                ║ [LEARN] LEARNING NOTES           ║
                                ║                             ║
                                ║ [DOCS] WHAT is lateinit?        ║
                                ║ lateinit allows non-null    ║
                                ║ properties to be init later ║
                                ║                             ║
                                ║ [DOCS] WHY did this happen?     ║
                                ║ Common causes:              ║
                                ║ • Wrong lifecycle phase     ║
                                ║ • Forgot initialization     ║
                                ║ • Conditional didn't run    ║
                                ║                             ║
                                ║ [DOCS] HOW to prevent?          ║
                                ║ 1. Check isInitialized      ║
                                ║    if (::prop.isInit)       ║
                                ║                             ║
                                ║ 2. Use lazy delegation      ║
                                ║    by lazy { ... }          ║
                                ║                             ║
                                ║ 3. Use nullable types       ║
                                ║    var prop: Type? = null   ║
                                ╚═════════════════════════════╝
```

---

## [CHART] Performance Flow

### Where Time is Spent

```
┌──────────────────────────────────────────────────────────────────┐
│           TYPICAL ANALYSIS TIMELINE (75s total)                  │
└──────────────────────────────────────────────────────────────────┘

0s ════════════════════════════════════════════════════════ 75s

├─┤ Input Processing (0.1s)
│ └─ Sanitization, validation
│
├════┤ Error Parsing (0.5s)
│    └─ Language detection, regex matching
│
├═┤ Cache Lookup (0.05s)
│ └─ Hash generation, Map lookup
│
├═══════════════════════════════════════════════════════┤ Agent (70s)
│ │
│ ├═════════════════════┤ Iteration 1 (23s)
│ │ ├──┤ LLM (20s)
│ │ └┤ Tools (3s)
│ │
│ ├═════════════════════┤ Iteration 2 (23s)
│ │ ├──┤ LLM (20s)
│ │ └┤ Tools (3s)
│ │
│ └═════════════════════┤ Iteration 3 (24s)
│   ├──┤ LLM (21s)
│   └┤ Tools (3s)
│
├═┤ Cache Storage (0.1s)
│ └─ Hash, store in Map
│
├══┤ Result Formatting (2s)
│  └─ Markdown generation, HTML
│
└═┤ UI Update (0.2s)
  └─ Post message, render


┌─────────────────────────────────────────────────────────────────┐
│  TIME BREAKDOWN (Percentages)                                   │
└─────────────────────────────────────────────────────────────────┘

    ╔════════════════════════════════════════════════════╗
    ║                                                    ║
    ║  LLM Inference:    82% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓         ║
    ║  Tool Execution:   12% ▓▓▓░░░░░░░░░░░░░░░░       ║
    ║  Result Format:     3% ▓░░░░░░░░░░░░░░░░░░       ║
    ║  Parsing:           2% ░░░░░░░░░░░░░░░░░░░       ║
    ║  Cache/UI:          1% ░░░░░░░░░░░░░░░░░░░       ║
    ║                                                    ║
    ╚════════════════════════════════════════════════════╝

    Total: 75 seconds (average for first analysis)
    Cache Hit: <5 seconds (15x faster!)
```

---

## 🔐 Security Flow

### Input Sanitization & Validation

```
┌──────────────────────────────────────────────────────────────────┐
│                   SECURITY MEASURES                              │
└──────────────────────────────────────────────────────────────────┘

User Input
    │
    [DOWN]
┌─────────────────────┐
│ Length Check        │  [DONE] Max 50KB
│ if (len > 50000)    │  [FAIL] Reject if too large
│   reject()          │
└─────────┬───────────┘
          │
          [DOWN]
┌─────────────────────┐
│ Control Char Filter │  Remove dangerous chars
│ .replace(           │  \x00-\x1F (control)
│   /[\x00-\x1F]/g    │  \x7F (delete)
│ )                   │
└─────────┬───────────┘
          │
          [DOWN]
┌─────────────────────┐
│ Trim Whitespace     │  Remove leading/trailing
│ .trim()             │  whitespace
└─────────┬───────────┘
          │
          [DOWN]
┌─────────────────────┐
│ Type Validation     │  Ensure string type
│ typeof input ===    │  No objects/arrays
│ 'string'            │
└─────────┬───────────┘
          │
          [DOWN]
  [DONE] Sanitized Input
      │
      └─ Safe to process
```

---

## [DESIGN] Theme Integration

### VS Code Theme Compatibility

```
┌──────────────────────────────────────────────────────────────────┐
│              THEME-AWARE UI                                      │
└──────────────────────────────────────────────────────────────────┘

User Changes Theme
        │
        [DOWN]
  VS Code Emits Event
        │
        [DOWN]
  Webview CSS Variables Update
        │
        [DOWN]
┌──────────────────────────────────────────┐
│  CSS Variables                           │
│                                          │
│  --vscode-editor-foreground             │
│  --vscode-editor-background             │
│  --vscode-textLink-foreground           │
│  --vscode-errorForeground               │
│  --vscode-button-background             │
│  ... (50+ variables)                    │
└──────────────┬───────────────────────────┘
               │
               [DOWN]
       Automatic Re-render
               │
   ┌───────────┴────────────┐
   │                        │
   [DOWN]                        [DOWN]
Light Theme            Dark Theme

╔════════════════╗    ╔════════════════╗
║ [RED] LATEINIT   ║    ║ [RED] LATEINIT   ║
║ White bg      ║    ║ Dark bg       ║
║ Black text    ║    ║ White text    ║
║               ║    ║               ║
║ [Blue links]  ║    ║ [Cyan links]  ║
╚════════════════╝    ╚════════════════╝
```

---

## [DOCS] Summary

This visual guide shows:
1. **User Interaction** - How users trigger analysis
2. **Analysis Pipeline** - 5-step processing flow
3. **UI Updates** - Real-time progress rendering
4. **Cache System** - Hit/miss performance comparison
5. **Feedback Loop** - How feedback improves results
6. **Educational Mode** - Enhanced learning experience
7. **Performance** - Time breakdown and optimization
8. **Security** - Input validation & sanitization
9. **Theming** - VS Code theme integration

---

**Last Updated:** December 24, 2025  
**Version:** 2.0

