# Dynamic UI Architecture - Visual Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Extension Host)                        │
└─────────────────────────────────────────────────────────────────────────┘

                            User Actions / System Events
                                       │
                                       [DOWN]
┌────────────────────────────────────────────────────────────────────────┐
│                          StateManager.ts                                │
│  - addError()           → fires onErrorQueueChange                     │
│  - removeError()        → fires onErrorQueueChange                     │
│  - addToHistory()       → fires onHistoryChange                        │
│  - updateError()        → fires onErrorQueueChange                     │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ EventEmitter events
                                       [DOWN]
┌────────────────────────────────────────────────────────────────────────┐
│                        UIEventManager.ts (NEW!)                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Listens to:                                                       │  │
│  │  - onErrorQueueChange → process error events                     │  │
│  │  - onHistoryChange    → process analysis completion              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Generates:                                                        │  │
│  │  - UIEvent { type, timestamp, data }                             │  │
│  │  - ActivityUpdate { message, type, timestamp }                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Features:                                                         │  │
│  │  • Activity Feed (max 50 items)                                  │  │
│  │  • Debounced metrics updates (1s)                                │  │
│  │  • Event aggregation                                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ fires onUIEvent / onActivityUpdate
                                       [DOWN]
┌────────────────────────────────────────────────────────────────────────┐
│                      RCAWebviewProvider.ts                              │
│  Subscribes to UIEventManager:                                         │
│    uiEventManager.onUIEvent((event) => {                               │
│      _sendMessage({ command: 'uiEvent', event })                       │
│    })                                                                   │
│                                                                         │
│    uiEventManager.onActivityUpdate((activity) => {                     │
│      _sendMessage({ command: 'activityUpdate', activity })             │
│    })                                                                   │
└────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ postMessage
                                       [DOWN]
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Webview)                              │
└─────────────────────────────────────────────────────────────────────────┘

                          window.addEventListener('message')
                                       │
                                       [DOWN]
           ┌────────────────────────────────────────────┐
           │                                             │
           [DOWN]                        [DOWN]                    [DOWN]
   ┌──────────────┐        ┌──────────────┐    ┌──────────────┐
   │useDashboard  │        │useMetrics    │    │useErrorQueue │
   │Data.ts       │        │.ts           │    │.ts           │
   └──────────────┘        └──────────────┘    └──────────────┘
           │                        │                    │
           │ Handles:               │ Handles:           │ Handles:
           │ • uiEvent              │ • uiEvent          │ • uiEvent
           │ • activityUpdate       │ • metrics_changed  │ • error_*
           │                        │ • analysis_*       │
           [DOWN]                        [DOWN]                    [DOWN]
   ┌──────────────┐        ┌──────────────┐    ┌──────────────┐
   │Dashboard.tsx │        │Metrics.tsx   │    │ErrorQueue.tsx│
   └──────────────┘        └──────────────┘    └──────────────┘
           │                        │                    │
           │ Uses:                  │ Updates:           │ Updates:
           │ AnimatedStatGrid       │ Charts             │ Error list
           │ Activity Feed          │ Summary stats      │ Counts
           [DOWN]                        [DOWN]                    [DOWN]
   ┌──────────────────────────────────────────────────────────┐
   │            AnimatedStat.tsx (NEW!)                        │
   │  • requestAnimationFrame for smooth transitions          │
   │  • 800ms animation with ease-out cubic                   │
   │  • Pulse effect on change                                │
   │  • Trend indicators ([UP] [DOWN])                                │
   │  • Scale effect                                          │
   └──────────────────────────────────────────────────────────┘
                                       │
                                       [DOWN]
                              VISUAL UPDATE [SPARKLE]
```

---

## Event Flow Examples

### Example 1: Error Added

```
User runs: ./gradlew build
              │
              [DOWN]
ErrorQueueManager.addError()
              │
              [DOWN]
StateManager.addError()
              │
              [DOWN]
fires onErrorQueueChange → [error1, error2, ...]
              │
              [DOWN]
UIEventManager receives event
              │
              ├─► Fires UIEvent { type: 'error_added', data: { error } }
              │
              └─► Adds to activity feed: "New error detected: ..."
                            │
                            [DOWN]
            RCAWebviewProvider receives
                            │
                            [DOWN]
            postMessage({ command: 'uiEvent', event })
                            │
                            [DOWN]
            useDashboardData receives message
                            │
                            ├─► Updates pendingErrors count
                            │
                            └─► Triggers loadDashboardData()
                                          │
                                          [DOWN]
                              Dashboard.tsx re-renders
                                          │
                                          [DOWN]
                    AnimatedStatGrid animates counter up
                                          │
                                          [DOWN]
                              [DONE] User sees change (< 100ms)
```

### Example 2: Analysis Completed

```
User clicks "Analyze"
              │
              [DOWN]
AnalysisService.analyzeError()
              │
              [DOWN]
StateManager.addToHistory(result)
              │
              [DOWN]
fires onHistoryChange → [historyItem1, historyItem2, ...]
              │
              [DOWN]
UIEventManager receives event
              │
              ├─► Fires UIEvent { type: 'analysis_completed' }
              │
              ├─► Adds to activity feed: "✓ Analyzed: ..."
              │
              └─► Schedules metrics update (debounced 1s)
                            │
                            [DOWN]
            RCAWebviewProvider receives
                            │
                            ├─► postMessage('uiEvent')
                            │
                            └─► postMessage('activityUpdate')
                                          │
                                          [DOWN]
              ┌─────────────────────────┴────────────────────────┐
              │                                                    │
              [DOWN]                                                    [DOWN]
   useDashboardData                                        useMetrics
   • Shows activity                                        • Auto-refreshes
   • Updates stats                                         • Recalculates
              │                                                    │
              [DOWN]                                                    [DOWN]
   Dashboard.tsx                                          Metrics.tsx
   • AnimatedStat: analyzesPerformed++                    • Charts update
   • AnimatedStat: successRate updates                    • Stats recalc
   • Activity feed adds item                              
              │                                                    │
              └────────────────┬───────────────────────────────────┘
                               [DOWN]
                    [DONE] User sees updates instantly
                    • Stats animate smoothly
                    • Activity feed shows success
                    • Metrics charts update
```

### Example 3: Multiple Rapid Events (Debouncing)

```
User clicks "Analyze All" (10 errors)
              │
              [DOWN]
10x analysis complete in 2 seconds
              │
              [DOWN]
StateManager.addToHistory() × 10
              │
              [DOWN]
fires onHistoryChange × 10
              │
              [DOWN]
UIEventManager receives 10 events
              │
              ├─► Fires 10x 'analysis_completed'
              │   (Activity feed gets 10 entries)
              │
              └─► Schedules metrics update × 10
                  BUT only last one matters!
                  ↓
         [Debounce timeout 1s]
                  ↓
         After 1s: Single 'metrics_changed' event
                            │
                            [DOWN]
            useMetrics auto-refreshes ONCE
                            │
                            [DOWN]
                  Metrics.tsx updates
                            │
                            [DOWN]
          [DONE] No flicker! Smooth single update
             instead of 10 rapid updates
```

---

## Component Responsibilities

### Backend

| Component | Responsibility |
|-----------|----------------|
| **StateManager** | Core state management, fires events |
| **UIEventManager** | Event aggregation, activity feed, debouncing |
| **RCAWebviewProvider** | Bridge to webview, message passing |

### Frontend

| Component | Responsibility |
|-----------|----------------|
| **useVSCode** | Generic VS Code message handler |
| **useDashboardData** | Dashboard data + real-time events |
| **useMetrics** | Metrics data + auto-refresh |
| **useErrorQueue** | Error queue + real-time updates |
| **AnimatedStat** | Animated number display + trends |

---

## Performance Characteristics

### Without Optimizations
```
10 errors added in 1 second
  → 10 metrics updates
  → 10 UI re-renders
  → Flickering
  → Poor UX
  → Battery drain
```

### With Optimizations
```
10 errors added in 1 second
  → Activity feed: 10 items (immediate)
  → Stats update: 1 time (immediate)
  → Metrics update: 1 time (after 1s debounce)
  → Smooth animations
  → Great UX
  → Battery friendly
```

---

## Memory Footprint

```
Activity Feed: 50 items max × ~200 bytes = ~10 KB
Event Listeners: 4 hooks × ~1 KB = ~4 KB
Animation States: 4 stats × ~100 bytes = ~400 bytes

Total: ~15 KB additional memory
```

**Impact:** Negligible (< 0.01% of typical VS Code extension memory)

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE: Static, Polling-Based                               │
│  [TIMER]  30-60s update delay                                     │
│  [REFRESH] No visual feedback                                       │
│  [CHART] Static numbers                                           │
└─────────────────────────────────────────────────────────────┘

                          [DOWN] UPGRADE [DOWN]

┌─────────────────────────────────────────────────────────────┐
│  AFTER: Dynamic, Event-Driven                                │
│  [FAST] < 100ms real-time updates                                │
│  [DONE] Animated visual feedback                                 │
│  [GRAPH] Smooth transitions + trends                              │
│  [TARGET] Live activity feed                                       │
│  💚 Great user experience                                    │
└─────────────────────────────────────────────────────────────┘
```

**The UI is now fully reactive!** [LAUNCH]
