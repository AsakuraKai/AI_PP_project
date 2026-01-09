# RCA Agent UI - Figma-Inspired Redesign Plan

**Date**: January 9, 2026  
**Status**: [DESIGN] DESIGN APPROVED - READY FOR IMPLEMENTATION  
**Design System**: Based on Figma collapsible sidebar concept

---

## [TARGET] Design Vision

Transform the RCA Agent from a traditional VS Code extension UI into a **modern, elegant, Figma-inspired interface** that combines:
- Sleek collapsible sidebar navigation
- Full-screen immersive analysis experience  
- Professional dark theme with smooth animations
- React-based UI with shadcn/ui components

---

## [DESIGN] Visual Design

### Layout Structure

```

   Sidebar             Main Content              
   (Dark/Black)        (zinc-950 background)     
                                                 
   Settings           Dashboard              
   Model                   
   Theme             Stat1Stat2Stat3      
   Prefs                   
                                                 
   Navigation         View Content           
    Dashboard      • Analysis Results        
    Errors         • Error Queue Table       
    Analyze        • History Timeline        
    History        • Agent Visualization     
    Agent          • Fix Previews            
    Fixes          • Performance Metrics     
    Metrics                                  
                                                 
   Collapse                                     

```

### Color Palette

```typescript
const rcaTheme = {
  // Core Colors
  primary: '#030213',      // Deep blue-black
  sidebar: '#000000',      // Pure black
  content: '#0a0a0a',      // zinc-950
  card: '#171717',         // zinc-900
  cardHover: '#1f1f1f',    // Slightly lighter
  
  // Borders
  border: '#27272a',       // zinc-800
  borderLight: '#3f3f46',  // zinc-700
  
  // Text
  text: '#ffffff',         // White
  textMuted: '#a1a1aa',    // zinc-400
  textDim: '#71717a',      // zinc-500
  
  // States
  hover: '#18181b',        // zinc-900
  active: '#27272a',       // zinc-800
  
  // Accent & Status
  accent: '#3b82f6',       // Blue
  success: '#22c55e',      // Green
  warning: '#f59e0b',      // Amber
  error: '#ef4444',        // Red
};
```

---

## [PHONE] Navigation Structure

### Sidebar Sections

#### 1. **Settings Section** (Top - Replaces Date)

**Collapsed State:**
```

    •        ← Gear icon + status dot

```

**Expanded State:**
```

  Settings       
  Model: GPT-4  
   Connected   
   Theme       
   Prefs       

```

**Features:**
- Quick model selection
- Ollama connection status
- Theme toggle
- Educational mode toggle
- Realtime detection toggle

---

#### 2. **Navigation Section** (Main)

| Icon | Label | Route | Purpose |
|------|-------|-------|---------|
|  | Dashboard | `/` | Overview, stats, quick actions |
|  | Error Queue | `/errors` | Browse and manage detected errors |
|  | Analyze | `/analyze` | Interactive analysis interface |
|  | History | `/history` | Past analyses with search |
|  | Agent State | `/agent` | Real-time agent visualization |
|  | Fix Manager | `/fixes` | Review and apply fixes |
|  | Metrics | `/metrics` | Performance and learning stats |

**Badge Support:**
- Error Queue shows error count: ` Errors (5)`
- Analyze shows analyzing indicator: ` Analyze `

---

##  Main Content Views

### 1. **Dashboard View** (`/`)

**Purpose:** Landing page with overview and quick actions

**Layout:**
```

 RCA Agent Dashboard                         

 Pending      Analyzed     Success Rate    
 5 errors     12 today     85%             
 +2 today     ↗ trending   ↑ +5%           



 Quick Actions                               
 [Analyze All] [Scan Workspace] [Settings]  



 Recent Activity                             
   NullPointerException (2 mins ago)     
   ClassNotFoundException (5 mins ago)   
  ⏳ CompileError (analyzing...)            



 Ollama Status:  Connected                 
 Model: DeepSeek-R1-Distill-Qwen-7B         
 Response time: 1.2s avg                     

```

**Backend:**
- `ErrorQueueManager.getQueue()` → Pending errors
- `StateManager.getHistory()` → Recent activity
- `PerformanceMonitor.getMetrics()` → Stats

---

### 2. **Error Queue View** (`/errors`)

**Purpose:** Comprehensive error management

**Layout:**
```

 Error Queue (5 errors)                      
 [Refresh] [Analyze All] [Filter: All ]    



   NullPointerException                    
 MainActivity.kt:42                          
 [Analyze] [Pin] [Remove]                    

   ClassNotFoundException                  
 build.gradle:15                             
 [Analyze] [Pin] [Remove]                    

```

**Features:**
- Real-time error detection
- Filter by status (Pending/Analyzing/Complete)
- Bulk operations (select multiple, analyze all)
- Pin important errors
- Quick navigation to source

**Backend:**
- `ErrorQueueManager.getQueue()`
- `AnalysisService.analyzeError()`
- `RealtimeErrorDetector.detectErrors()`

---

### 3. **Analyze View** (`/analyze`)

**Purpose:** Interactive analysis with live progress

**Empty State:**
```

 Start Analysis                              
  
  Paste error message or stack trace...   
                                           
  
 [Analyze] [Select from Queue]              

```

**Analyzing State:**
```

 Analyzing...                                
  50% (Iteration 3/6)        
                                             
 Current Hypothesis:                         
 "Missing null check in onCreate()"         
 Confidence: 75%                             
                                             
 Tools Used: StackTraceParser, CodeSearch    
 [Cancel Analysis]                           

```

**Complete State:**
```

  Analysis Complete (95% confidence)       
                                             
  Root Cause:                              
 "Variable 'user' not initialized before..." 
                                             
  Suggested Fixes:                         
  
  1. Add null check                        
     [View Diff] [Apply Fix]               
  2. Initialize in constructor             
     [View Diff] [Apply Fix]               
  
 [Export Analysis] [Search Similar]          

```

**Backend:**
- `AnalysisService.analyzeError()` with progress callbacks
- `FixApplicationService.applyFix()`

---

### 4. **History View** (`/history`)

**Purpose:** Search and browse past analyses

**Layout:**
```

 History                                     
 [Search...] [Filter: All ] [Clear All]    


Today
  NullPointerException (2 mins ago)
  95% confidence • Applied fix
  [View] [Reanalyze] [Export]

  ClassNotFoundException (15 mins ago)
  88% confidence • Fix applied
  [View] [Reanalyze] [Export]

Yesterday
  CompileError (1 day ago)
  92% confidence • No fix applied
  [View] [Reanalyze] [Export]
```

**Features:**
- Timeline grouped by date
- Full-text search
- Filter by success/failure
- Re-analyze past errors
- Export to markdown
- Feedback (helpful/not helpful)

**Backend:**
- `StateManager.getHistory()`
- `StateManager.searchHistory(query)`

---

### 5. **Agent State View** (`/agent`)

**Purpose:** Real-time visualization of agent's thought process

**Layout:**
```

 Agent Thought Process                       
 Iteration 3 of 6  50%      



 Current Hypothesis                          
 Confidence: 75%                   
                                             
 "The error occurs because the 'user'        
  variable is not properly initialized..."   
                                             
 Observations:                               
 • Stack trace shows NPE at line 42          
 • Variable declared but not assigned        
 • onCreate() called before initialization   



 Tools Used                                  
  StackTraceParser (12ms)               
  CodeAnalyzer (45ms)                   
  PatternMatcher (8ms)                  

```

**Features:**
- Live iteration progress
- Hypothesis evolution
- Tool usage tracking
- Consensus building visualization

**Backend:**
- `AnalysisService.onProgress()` callbacks
- Real-time `AgentState` updates

---

### 6. **Fix Manager View** (`/fixes`)

**Purpose:** Review, preview, and apply suggested fixes

**Layout:**
```

 Fix Manager                                 
 [Pending: 3] [Applied: 12] [Rejected: 2]   


Pending Fixes

  Add null check to MainActivity.kt:42     
 Confidence: 95%                             
                                             
 [Show Diff] [Apply] [Reject]                

  Initialize user in constructor           
 Confidence: 88%                             
                                             
 [Show Diff] [Apply] [Reject]                

```

**Diff Preview:**
```

 - override fun onCreate(bundle: Bundle?) {  
 + override fun onCreate(bundle: Bundle?) {  
 +     if (user == null) return              
       user.name = "John"                    
   }                                         
                                             
 [Apply This Fix] [Cancel]                   

```

**Backend:**
- `FixApplicationService.getPendingFixes()`
- `FixApplicationService.previewFix()`
- `FixApplicationService.applyFix()`

---

### 7. **Metrics View** (`/metrics`)

**Purpose:** Performance tracking and learning analytics

**Layout:**
```

 Performance Metrics                         



 Success  Avg Time Total   
 85%      2.3s     127     



 Success Rate Trend (Last 7 Days)            
                                            
    /\  /\                                    
   /  \/  \                                   
  /        \                                  



 Error Type Distribution                     
 • NullPointerException    35%               
 • ClassNotFoundException  25%               
 • CompileError           20%                
 • Other                  20%                

```

**Backend:**
- `PerformanceMonitor.getMetrics()`
- `StateManager.getStatistics()`

---

##  Technical Implementation

### Technology Stack

**Frontend:**
- **React 18** + TypeScript
- **Vite** for bundling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **Framer Motion** for animations

**VS Code Integration:**
- Webview API for React app
- Message passing for backend communication
- Configuration API for settings
- FileSystemWatcher for real-time error detection

---

### File Structure

```
vscode-extension/webview/
 src/
    App.tsx
    main.tsx
    vscode.ts (VS Code API wrapper)
   
    components/
       sidebar/
          CollapsibleSidebar.tsx
          SettingsSection.tsx
          NavigationSection.tsx
      
       views/
          DashboardView.tsx
          ErrorQueueView.tsx
          AnalyzeView.tsx
          HistoryView.tsx
          AgentStateView.tsx
          FixManagerView.tsx
          MetricsView.tsx
      
       shared/
          ErrorCard.tsx
          HistoryCard.tsx
          StatsCard.tsx
          AnalyzingView.tsx
          ResultView.tsx
          DiffViewer.tsx
      
       ui/ (shadcn/ui components)
           button.tsx
           card.tsx
           badge.tsx
           progress.tsx
           ... (40+ components)
   
    hooks/
       useVSCode.ts
       useErrorQueue.ts
       useHistory.ts
       useAnalysis.ts
       useSettings.ts
   
    context/
       RCAContext.tsx
       ThemeContext.tsx
   
    types/
       index.ts
   
    styles/
        globals.css
        theme.css

 vite.config.ts
 tailwind.config.js
 tsconfig.json
 package.json
```

---

##  Message Protocol

### Extension → Webview

```typescript
type ExtensionMessage =
  | { type: 'init'; data: InitData }
  | { type: 'errorQueueUpdate'; data: { errors: ErrorItem[] } }
  | { type: 'historyUpdate'; data: { history: HistoryItem[] } }
  | { type: 'analysisProgress'; data: AgentState }
  | { type: 'analysisComplete'; data: RCAResult }
  | { type: 'analysisError'; data: { error: string } }
  | { type: 'settingsChanged'; data: Partial<PanelSettings> }
  | { type: 'themeChanged'; data: { theme: 'light' | 'dark' } };

interface InitData {
  settings: PanelSettings;
  errorQueue: ErrorItem[];
  history: HistoryItem[];
  theme: 'light' | 'dark';
}
```

### Webview → Extension

```typescript
type WebviewMessage =
  | { type: 'ready' }
  | { type: 'navigate'; route: string }
  | { type: 'analyze'; errorId?: string; errorText?: string }
  | { type: 'cancelAnalysis' }
  | { type: 'removeError'; errorId: string }
  | { type: 'pinError'; errorId: string }
  | { type: 'clearQueue' }
  | { type: 'refreshQueue' }
  | { type: 'deleteHistory'; itemId: string }
  | { type: 'exportHistory'; itemId: string }
  | { type: 'applyFix'; result: RCAResult; fixIndex: number }
  | { type: 'updateSettings'; settings: Partial<PanelSettings> };
```

---

##  Animation & Transitions

### Sidebar Collapse/Expand

```typescript
// Smooth 300ms transition
transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'

// Collapsed: 64px (w-16)
// Expanded: 224px (w-56)
```

### View Transitions

```typescript
// Fade in new views
opacity: 0 → 1 (200ms)

// Slide up for cards
transform: translateY(20px) → translateY(0) (300ms)
```

### Progress Animations

```typescript
// Analysis progress bar
transition: 'width 500ms ease-out'

// Pulsing analyzing indicator
animation: 'pulse 2s infinite'
```

---

##  Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Setup Vite + React + TypeScript
- [ ] Configure Tailwind with RCA theme
- [ ] Import shadcn/ui components
- [ ] Create base layout (Sidebar + MainContent)
- [ ] Setup message passing
- [ ] Implement theme detection

### Phase 2: Sidebar (Week 1)
- [ ] Build SettingsSection
- [ ] Build NavigationSection  
- [ ] Implement collapse/expand
- [ ] Wire settings to VS Code config
- [ ] Add badge support for error counts

### Phase 3: Main Views (Week 2-3)
- [ ] Dashboard View
- [ ] Error Queue View
- [ ] Analyze View
- [ ] History View
- [ ] Agent State View
- [ ] Fix Manager View
- [ ] Metrics View

### Phase 4: Backend Integration (Week 3)
- [ ] Connect AnalysisService
- [ ] Connect ErrorQueueManager
- [ ] Connect StateManager
- [ ] Connect FixApplicationService
- [ ] Setup real-time updates
- [ ] Implement progress callbacks

### Phase 5: Polish (Week 4)
- [ ] Animations & transitions
- [ ] Keyboard navigation
- [ ] Empty states
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility audit

### Phase 6: Testing (Week 4)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing
- [ ] User testing

---

##  Success Criteria

**Visual:**
-  Matches Figma design aesthetic
-  Smooth 60fps animations
-  Responsive layout (collapsed sidebar works)
-  Professional dark theme

**Functional:**
-  All 7 views implemented
-  Real-time error detection
-  Live analysis progress
-  Fix preview and application
-  History with search
-  Settings persistence

**Performance:**
-  Initial load < 1s
-  View transitions < 200ms
-  Handles 100+ errors smoothly
-  No memory leaks

**Accessibility:**
-  WCAG 2.1 AA compliant
-  Full keyboard navigation
-  Screen reader support
-  High contrast mode

---

##  References

- [Figma Design Concept](project/src/app/components/CollapsibleSidebar.tsx)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [RCA Backend Services](../vscode-extension/src/services/)
- [Original UI Wiring Guide](./RCA_UI_WIRING_GUIDE.md)

---

**Ready to build something beautiful! **
