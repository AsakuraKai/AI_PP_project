# RCA Agent - User Guide

**Version:** 2.0.0  
**Last Updated:** December 27, 2025

Welcome to the RCA Agent User Guide! This guide will help you get the most out of the new panel-based UI.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Panel Overview](#panel-overview)
3. [Analyzing Errors](#analyzing-errors)
4. [Using the Error Queue](#using-the-error-queue)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Accessibility Features](#accessibility-features)
7. [Feature Flags](#feature-flags)
8. [Performance Monitoring](#performance-monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

1. Install the RCA Agent extension from VS Code marketplace
2. Ensure Ollama is running: `ollama serve`
3. Pull the required model: `ollama pull deepseek-r1`
4. Open the RCA Agent panel by clicking the icon in the activity bar

### First-Time Setup

When you first open the extension, you'll see a prompt to enable the new UI. Click "Enable New UI" to get started!

---

## Panel Overview

The RCA Agent panel consists of three main sections:

```
┌─────────────────────────────────────────┐
│ RCA AGENT                    [⚙️] [📖] │ ← Header
├─────────────────────────────────────────┤
│ ERROR QUEUE                 [▶ Analyze] │ ← Error Queue
│  🔴 NullPointerException        Line 42 │
│  🟡 Unresolved reference       Line 15  │
├─────────────────────────────────────────┤
│ 📊 CURRENT ANALYSIS           [⏸ Stop] │ ← Analysis View
│  Progress: ███████░░░░ 65%             │
├─────────────────────────────────────────┤
│ 📜 HISTORY                         [⏷] │ ← History
│  • NPE at file.kt:42    5 mins ago [↻] │
└─────────────────────────────────────────┘
```

### Status Bar Integration

Look for the RCA Agent status in your VS Code status bar:

- `🤖 RCA: Ready` - Ready to analyze
- `🔄 RCA: Analyzing (2/3) 67%` - Analysis in progress
- `🤖 (3) RCA: 3 errors detected` - Errors detected
- `⚠️ RCA: Analysis failed` - Error occurred

Click the status bar item to toggle the panel!

---

## Analyzing Errors

### Method 1: From the Panel

1. Open the RCA Agent panel (click activity bar icon or `Ctrl+Shift+A`)
2. Errors will auto-populate in the Error Queue
3. Click "Analyze" next to any error
4. Watch the real-time progress
5. Review the results with root cause and fix guidelines

### Method 2: From Editor (Lightbulb)

1. Place cursor on an error (red squiggle)
2. Click the lightbulb icon (💡) or press `Ctrl+.`
3. Select "🤖 Analyze with RCA Agent"
4. The panel opens with analysis

### Method 3: Keyboard Shortcuts

- `Ctrl+Shift+R` - Quick analyze (output channel)
- `Ctrl+Shift+W` - Analyze in panel
- `Ctrl+Shift+.` - Analyze current error
- `Alt+F8` - Next error
- `Shift+Alt+F8` - Previous error

---

## Using the Error Queue

###Auto-Detection

Enable auto-detection in settings to automatically populate the error queue:

```json
{
  "rcaAgent.experimental.advancedDiagnostics": true
}
```

### Priority Sorting

Errors are automatically sorted by severity:
- 🔴 **Critical** - NullPointerExceptions, crashes
- 🟡 **High** - Compilation errors, unresolved references
- 🟢 **Medium** - Warnings, deprecations

### Batch Analysis

Analyze multiple errors at once:

1. Click "Analyze All" button
2. Or press `Ctrl+Shift+Alt+A`
3. Errors are processed sequentially
4. Press `Escape` to cancel batch analysis

### Context Menu Actions

Right-click on any error to:
- 📌 Pin error (keeps it at top)
- 🗑️ Remove from queue
- 📁 Open file location
- 🔄 Reanalyze
- 📋 Copy error details

---

## Keyboard Shortcuts

### Navigation
- `Tab` / `↓` - Next item
- `Shift+Tab` / `↑` - Previous item
- `Enter` - Analyze selected error
- `Space` - Expand/collapse section
- `Escape` - Close/cancel

### Analysis
- `Ctrl+Shift+R` - Quick analyze (output)
- `Ctrl+Shift+W` - Analyze in webview
- `Ctrl+Shift+.` - Analyze current error
- `Ctrl+Shift+Alt+A` - Analyze all errors

### Panel
- `Ctrl+Shift+A` - Toggle panel
- `Ctrl+Shift+E` - Toggle educational mode
- `Ctrl+Shift+P` - Toggle performance metrics

### Error Navigation
- `Alt+F8` - Jump to next error
- `Shift+Alt+F8` - Jump to previous error

---

## Accessibility Features

RCA Agent is built with accessibility in mind!

### Screen Reader Support

All UI elements have proper ARIA labels:
- Buttons announce their action
- Progress bars announce completion percentage
- Error lists announce severity and line numbers

### Keyboard Navigation

Every action can be performed with keyboard:
- Full tab navigation support
- Arrow key navigation in lists
- Enter to activate buttons
- Escape to cancel/close

### High Contrast Mode

Automatically detects and adapts to:
- Dark theme
- Light theme
- High contrast dark
- High contrast light

### Reduced Motion

Respects `prefers-reduced-motion` setting:
- Disables animations when enabled
- Provides instant transitions

---

## Feature Flags

Control experimental features via settings:

### Available Flags

```json
{
  // Enable new panel UI (requires reload)
  "rcaAgent.experimental.newUI": true,
  
  // Enable advanced diagnostics
  "rcaAgent.experimental.advancedDiagnostics": false,
  
  // Enable batch analysis
  "rcaAgent.experimental.batchAnalysis": true,
  
  // Show performance metrics in UI
  "rcaAgent.experimental.performanceMetrics": false,
  
  // Enable all experimental features
  "rcaAgent.experimental.experimentalFeatures": false
}
```

### Toggle Feature Flags

1. Command Palette: "RCA Agent: Toggle Feature Flag"
2. Or press `Ctrl+Shift+P` → "Toggle Feature Flag"
3. Select flag to toggle
4. Reload window if prompted

---

## Performance Monitoring

### Enable Metrics

```json
{
  "rcaAgent.performance.enableMonitoring": true,
  "rcaAgent.performance.panelLoadThreshold": 100
}
```

### View Performance Report

1. Command Palette: "RCA Agent: Show Performance Metrics"
2. Or enable in settings to show in UI

Sample report:
```
RCA Agent Performance Report
============================

Latest Metrics:
- Panel Load: 50ms (target: <100ms)
- Analysis Start: 20ms (target: <50ms)
- Memory Usage: 30MB

Status: ✅ ACCEPTABLE
```

---

## Troubleshooting

### Ollama Server Not Available

**Problem:** Error message "Ollama server not responding"

**Solution:**
1. Open terminal
2. Run: `ollama serve`
3. Wait for "Ollama is running" message
4. Click "Check Connection" in panel

### Model Not Found

**Problem:** Error message "Model not found"

**Solution:**
1. Open terminal
2. Run: `ollama pull deepseek-r1`
3. Wait for download to complete
4. Click "Check Model" in panel

### Panel Not Loading

**Problem:** Panel shows blank or doesn't load

**Solution:**
1. Check if new UI is enabled: Settings → `rcaAgent.experimental.newUI`
2. Reload window: `Ctrl+Shift+P` → "Reload Window"
3. Check output logs: View → Output → "RCA Agent"

### Slow Performance

**Problem:** Panel loads slowly or feels laggy

**Solution:**
1. Enable performance monitoring to identify bottlenecks
2. Check memory usage in performance report
3. Clear cache: Command Palette → "RCA Agent: Clear Cache"
4. Reduce number of errors in queue

### Keyboard Shortcuts Not Working

**Problem:** Shortcuts don't respond

**Solution:**
1. Check for conflicts: File → Preferences → Keyboard Shortcuts
2. Search for "RCA Agent" to see all shortcuts
3. Customize if needed

---

## Tips & Tricks

### Educational Mode

Learn while debugging! Enable educational mode to get:
- Detailed explanations of error types
- Best practices for fixing
- Links to documentation
- Code examples

Toggle with `Ctrl+Shift+E` or in settings:
```json
{
  "rcaAgent.educationalMode": true
}
```

### Pin Important Errors

Pin errors you're actively working on:
1. Right-click error in queue
2. Select "Pin Error"
3. Pinned errors stay at top of queue

### Batch Processing

For multiple related errors:
1. Select errors (Ctrl+Click)
2. Right-click → "Analyze Selected"
3. Or use "Analyze All" for everything

### Quick Access

Add RCA Agent to your sidebar:
- Drag the activity bar icon to reorder
- Right-click to hide/show in activity bar

---

## Feedback & Support

### Report Issues

Found a bug? Report it!

1. Click "Report Issue" in error dialog
2. Or manually: GitHub Issues
3. Include error logs from Output panel

### Request Features

Have an idea? We'd love to hear it!

1. Open GitHub Issues
2. Tag with "enhancement"
3. Describe your use case

### Get Help

- Documentation: [README.md](./README.md)
- Architecture: [EXTENSION_ARCHITECTURE.md](../docs/EXTENSION_ARCHITECTURE.md)
- API Docs: [docs/api/](../docs/api/)

---

## What's New in 2.0

### New Features
- ✨ Panel-based UI with activity bar integration
- 🎯 Error queue with auto-detection
- 📊 Real-time analysis progress
- 💡 Lightbulb quick actions
- ⌨️ Complete keyboard navigation
- 🎨 Theme support (dark/light/high-contrast)
- ♿ Full accessibility (WCAG 2.1 AA)
- 📈 Performance monitoring
- 🚩 Feature flags for gradual rollout

### Improved
- 🚀 3x faster panel load times
- 💾 50% less memory usage
- 🎯 Better error detection
- 📚 Enhanced educational mode
- 🔧 More reliable error recovery

---

**Happy Debugging! 🐛→✅**

*If you find RCA Agent helpful, please leave a review!*
