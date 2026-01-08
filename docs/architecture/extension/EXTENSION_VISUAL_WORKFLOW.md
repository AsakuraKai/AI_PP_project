# 🎨 VS Code Extension - Visual Workflow Guide

> **Visual diagrams showing how the extension works from user interaction to final result**

---

## 🎯 Table of Contents

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
         ▼             ▼              ▼                ▼
   [Paste in    [Select in    [Cmd Palette]   [Cmd Palette]
    editor]      editor]                       
         │             │              │                │
         │             │              │                │
         └─────────────┴──────────────┴────────────────┘
                       │
                       ▼
              [Press Ctrl+Shift+R]
               OR [Ctrl+Shift+W]
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                  EXTENSION ACTIVATION                           │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  analyzeErrorCommand()  │
         └─────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼                            ▼
   [Get from           [Show input box]
    selection]          "Paste error..."
         │                            │
         └────────────┬───────────────┘
                      │
                      ▼
              [Error text acquired]
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                     PROCESSING                                  │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
              [Sanitize input]
                      │
                      ▼
              [Parse error]
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    [Cache HIT]              [Cache MISS]
         │                         │
         │                         ▼
         │              [Run full analysis]
         │              [3 iterations]
         │                         │
         └────────────┬────────────┘
                      │
                      ▼
┌─────────────────────┴───────────────────────────────────────────┐
│                      DISPLAY                                    │
└─────────────────────────────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
  [Output Channel]           [Webview Panel]
   (Text format)            (Visual UI)
         │                         │
         └────────────┬────────────┘
                      │
                      ▼
              [Show feedback]
                 [👍 / 👎]
                      │
                      ▼
              [Update database]
              [Update cache]
                      │
                      ▼
                   [DONE]
```

---

## 🔄 Analysis Pipeline

### Detailed Processing Steps

```
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 1: INPUT VALIDATION & SANITIZATION                            │
└──────────────────────────────────────────────────────────────────────┘

Input Text (raw)
      │
      ▼
  ┌─────────────────────┐
  │ Length Check        │  Max 50KB
  │ (<50,000 chars)     │  ✅ Pass / ❌ Reject
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ Sanitize            │  Remove control chars
  │ - Remove \x00-\x1F  │  Trim whitespace
  │ - Trim              │
  └─────────┬───────────┘
            │
            ▼
  Sanitized Text
      │
┌─────┴──────────────────────────────────────────────────────────────┐
│  STEP 2: ERROR PARSING & LANGUAGE DETECTION                        │
└────────────────────────────────────────────────────────────────────┘
      │
      ▼
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
            ▼
  ┌─────────────────────┐
  │ Language Parser     │  Extract:
  │ - Error type        │  • type (lateinit, npe)
  │ - File path         │  • message
  │ - Line number       │  • filePath (MyClass.kt)
  │ - Stack trace       │  • line (42)
  └─────────┬───────────┘
            │
            ▼
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
      ▼
  ┌─────────────────────┐
  │ ErrorHasher         │  SHA-256 hash
  │ - Normalize message │  of normalized
  │ - Generate hash     │  error
  └─────────┬───────────┘
            │
            ▼
  hash: "a3b2c1d4..."
      │
      ▼
  ┌─────────────────────┐
  │ RCACache.get()      │  Check L1 cache
  │ - Lookup hash       │  (in-memory Map)
  │ - Check TTL         │
  └─────────┬───────────┘
            │
      ┌─────┴──────┐
      │            │
      ▼ (Hit)      ▼ (Miss)
  [Return      [Continue to
   cached]      analysis]
      │            │
      │            ▼
      │  ┌─────────────────────┐
      │  │ Agent Analysis      │  3 iterations
      │  │ (75s avg)           │  with tools
      │  └─────────┬───────────┘
      │            │
      │            ▼
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
                   ▼
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
      ▼                          ▼
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
                   ▼
         [Show feedback prompt]
              [👍 / 👎]
                   │
      ┌────────────┴─────────────┐
      │                          │
      ▼ (Positive)               ▼ (Negative)
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
                   ▼
         [Update database]
         [Quality score]
                   │
                   ▼
                 [DONE]
```

---

## 🎨 UI Update Flow

### Real-Time Progress Updates

```
┌──────────────────────────────────────────────────────────────────┐
│                   WEBVIEW UPDATES                                │
└──────────────────────────────────────────────────────────────────┘

Agent Analysis Starts
         │
         ▼
  ┌─────────────────┐
  │ Iteration 1/3   │
  │ Thought:        │
  │ "Analyzing      │
  │  error type..." │
  └────────┬────────┘
           │
           │ [Event: 'iteration']
           │
           ▼
   ┌─────────────────────┐
   │ Webview.postMessage │
   │ { type: 'progress', │
   │   iteration: 1,     │
   │   maxIterations: 3, │
   │   thought: '...',   │
   │   progress: 33 }    │
   └─────────┬───────────┘
             │
             ▼
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
             ▼
  [Repeat for iterations 2 and 3]
             │
             ▼
  ┌─────────────────┐
  │ Analysis        │
  │ Complete        │
  └────────┬────────┘
           │
           │ [Event: 'complete']
           │
           ▼
   ┌─────────────────────┐
   │ Webview.postMessage │
   │ { type: 'result',   │
   │   rca: {...} }      │
   └─────────┬───────────┘
             │
             ▼
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
   │  ║  🔴 LATEINIT                       ║  │
   │  ║  MainActivity.kt:42                ║  │
   │  ╠════════════════════════════════════╣  │
   │  ║                                    ║  │
   │  ║  🎯 Root Cause                     ║  │
   │  ║  Property accessed before init...  ║  │
   │  ║                                    ║  │
   │  ║  🛠️ Fix Guidelines                 ║  │
   │  ║  1. Initialize in onCreate()       ║  │
   │  ║  2. Use nullable type              ║  │
   │  ║                                    ║  │
   │  ║  ✅ Confidence: 92%                ║  │
   │  ║                                    ║  │
   │  ║  [👍 Helpful] [👎 Not Helpful]    ║  │
   │  ║                                    ║  │
   │  ╚════════════════════════════════════╝  │
   │                                          │
   └──────────────────────────────────────────┘
```

---

## 💾 Cache Flow

### Cache Hit vs Cache Miss

```
┌──────────────────────────────────────────────────────────────────┐
│                      CACHE SYSTEM                                │
└──────────────────────────────────────────────────────────────────┘

ParsedError
     │
     ▼
┌─────────────────┐
│ ErrorHasher     │
│ hash(error)     │
└────────┬────────┘
         │
         ▼
   hash: "a3b2..."
         │
         ▼
┌─────────────────┐
│ RCACache        │
│ .get(hash)      │
└────────┬────────┘
         │
   ┌─────┴──────┐
   │            │
   ▼            ▼
[Found]      [Not Found]
   │            │
   ├─ Check TTL
   │            │
   ├─ Expired?  │
   │   │        │
   │   ▼        │
   │  Yes       No
   │   │        │
   │   └────────┤
   │            │
   │            ▼
   │       [Return result]
   │       ⚡ <5s
   │
   └────────────┼────────────┐
                │            │
                ▼            ▼
        ┌──────────────────────────┐
        │ Full Analysis Required   │
        │ - Initialize agent       │
        │ - Run 3 iterations       │
        │ - Execute tools          │
        │ - Generate RCA           │
        │ ⏱️ ~75s                  │
        └─────────┬────────────────┘
                  │
                  ▼
        ┌──────────────────────────┐
        │ Store in Cache           │
        │ - Generate hash          │
        │ - Set TTL (24h)          │
        │ - Store in Map           │
        └─────────┬────────────────┘
                  │
                  ▼
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

## 🔁 Feedback Loop

### How Feedback Improves Future Analyses

```
┌──────────────────────────────────────────────────────────────────┐
│                   FEEDBACK SYSTEM                                │
└──────────────────────────────────────────────────────────────────┘

User Views Result
        │
        ▼
[Show feedback buttons]
   [👍] [👎]
        │
   ┌────┴─────┐
   │          │
   ▼          ▼
[Positive] [Negative]
   │          │
   │          ▼
   │     [Optional comment]
   │          │
   └─────┬────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  POSITIVE FEEDBACK (👍)                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ Update Database  │
  │ - confidence +20%│
  │ - quality +0.1   │
  │ - validated=true │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Update Cache     │
  │ - Keep entry     │
  │ - Update metadata│
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Future Impact    │
  │ ✅ Higher rank   │
  │ ✅ More visible  │
  │ ✅ Longer TTL    │
  └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  NEGATIVE FEEDBACK (👎)                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ Update Database  │
  │ - confidence -50%│
  │ - quality -0.2   │
  │ - validated=false│
  │ - store comment  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Invalidate Cache │
  │ - Remove entry   │
  │ - Force re-run   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Future Impact    │
  │ ❌ Lower rank    │
  │ ❌ Less visible  │
  │ ❌ Re-analyzed   │
  └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FEEDBACK CYCLE                                                 │
└─────────────────────────────────────────────────────────────────┘

    Iteration 1: Initial Analysis
         │
         ▼
    [User feedback: 👎]
         │
         ▼
    [Confidence lowered]
    [Cache invalidated]
         │
         ▼
    Iteration 2: Re-Analysis (next time)
         │
         ▼
    [Better result]
         │
         ▼
    [User feedback: 👍]
         │
         ▼
    [Confidence boosted]
    [Cached & prioritized]
         │
         ▼
    Future: Fast & Accurate Results ✅
```

---

## 🎓 Educational Mode Flow

### How Educational Mode Enriches Results

```
┌──────────────────────────────────────────────────────────────────┐
│           EDUCATIONAL MODE (Ctrl+Shift+E)                        │
└──────────────────────────────────────────────────────────────────┘

Standard Analysis
        │
        ▼
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
      ▼ (No)     ▼ (Yes)
  [Return]  ┌────────────────────┐
            │ EducationalAgent   │
            │ .enrichWithNotes() │
            └─────────┬──────────┘
                      │
                      ▼
            ┌────────────────────┐
            │ Generate:          │
            │ - "What" section   │
            │ - "Why" section    │
            │ - "How" section    │
            │ - Code examples    │
            └─────────┬──────────┘
                      │
                      ▼
            RCAResult + LearningNotes
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  DISPLAY COMPARISON                                             │
└─────────────────────────────────────────────────────────────────┘

    Standard Mode               Educational Mode
    
    ╔═════════════════╗         ╔═════════════════════════════╗
    ║ 🔴 LATEINIT     ║         ║ 🔴 LATEINIT                 ║
    ║ MainActivity:42 ║         ║ MainActivity:42             ║
    ╠═════════════════╣         ╠═════════════════════════════╣
    ║                 ║         ║                             ║
    ║ 🎯 Root Cause   ║         ║ 🎯 Root Cause               ║
    ║ Property...     ║         ║ Property accessed before... ║
    ║                 ║         ║                             ║
    ║ 🛠️ Fix          ║         ║ 🛠️ Fix Guidelines           ║
    ║ 1. Initialize   ║         ║ 1. Initialize in onCreate() ║
    ║ 2. Use nullable ║         ║ 2. Use nullable type        ║
    ║                 ║         ║                             ║
    ║ ✅ 92%          ║         ║ ✅ Confidence: 92%          ║
    ╚═════════════════╝         ║                             ║
                                ║ 🎓 LEARNING NOTES           ║
                                ║                             ║
                                ║ 📚 WHAT is lateinit?        ║
                                ║ lateinit allows non-null    ║
                                ║ properties to be init later ║
                                ║                             ║
                                ║ 📚 WHY did this happen?     ║
                                ║ Common causes:              ║
                                ║ • Wrong lifecycle phase     ║
                                ║ • Forgot initialization     ║
                                ║ • Conditional didn't run    ║
                                ║                             ║
                                ║ 📚 HOW to prevent?          ║
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

## 📊 Performance Flow

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
    ▼
┌─────────────────────┐
│ Length Check        │  ✅ Max 50KB
│ if (len > 50000)    │  ❌ Reject if too large
│   reject()          │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Control Char Filter │  Remove dangerous chars
│ .replace(           │  \x00-\x1F (control)
│   /[\x00-\x1F]/g    │  \x7F (delete)
│ )                   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Trim Whitespace     │  Remove leading/trailing
│ .trim()             │  whitespace
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Type Validation     │  Ensure string type
│ typeof input ===    │  No objects/arrays
│ 'string'            │
└─────────┬───────────┘
          │
          ▼
  ✅ Sanitized Input
      │
      └─ Safe to process
```

---

## 🎨 Theme Integration

### VS Code Theme Compatibility

```
┌──────────────────────────────────────────────────────────────────┐
│              THEME-AWARE UI                                      │
└──────────────────────────────────────────────────────────────────┘

User Changes Theme
        │
        ▼
  VS Code Emits Event
        │
        ▼
  Webview CSS Variables Update
        │
        ▼
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
               ▼
       Automatic Re-render
               │
   ┌───────────┴────────────┐
   │                        │
   ▼                        ▼
Light Theme            Dark Theme

╔════════════════╗    ╔════════════════╗
║ 🔴 LATEINIT   ║    ║ 🔴 LATEINIT   ║
║ White bg      ║    ║ Dark bg       ║
║ Black text    ║    ║ White text    ║
║               ║    ║               ║
║ [Blue links]  ║    ║ [Cyan links]  ║
╚════════════════╝    ╚════════════════╝
```

---

## 📚 Summary

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

