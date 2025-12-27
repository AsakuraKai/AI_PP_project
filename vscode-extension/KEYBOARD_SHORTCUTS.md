# RCA Agent - Keyboard Shortcuts Reference

Complete keyboard shortcuts guide for RCA Agent 2.0. All shortcuts are fully accessible and follow VS Code conventions.

## 📋 Table of Contents

- [Primary Actions](#primary-actions)
- [Panel Control](#panel-control)
- [Error Queue Navigation](#error-queue-navigation)
- [Analysis Control](#analysis-control)
- [Settings & Preferences](#settings--preferences)
- [Accessibility Features](#accessibility-features)
- [Advanced](#advanced)
- [Customization](#customization)

---

## Primary Actions

### Analyze Errors

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Analyze Selected Error** | `Ctrl+Shift+R` | `Cmd+Shift+R` | Analyze selected text in output channel |
| **Analyze in Panel** | `Ctrl+Shift+W` | `Cmd+Shift+W` | Analyze selected text in webview panel |
| **Analyze All Errors** | `Ctrl+Shift+Alt+A` | `Cmd+Shift+Alt+A` | Batch analyze all errors in queue |
| **Analyze Current Error** | `Enter` | `Enter` | Analyze focused error in queue |

### Quick Actions

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Toggle RCA Panel** | `Ctrl+Shift+A` | `Cmd+Shift+A` | Show/hide RCA Agent panel |
| **Open Panel** | `Alt+F12` | `Option+F12` | Open RCA panel if closed |
| **Focus Panel** | `Ctrl+0` | `Cmd+0` | Focus RCA panel from editor |

---

## Panel Control

### Panel Navigation

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Next Section** | `Tab` | `Tab` | Move focus to next section |
| **Previous Section** | `Shift+Tab` | `Shift+Tab` | Move focus to previous section |
| **Scroll Up** | `PageUp` | `PageUp` | Scroll panel content up |
| **Scroll Down** | `PageDown` | `PageDown` | Scroll panel content down |

### Panel Sections

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Jump to Error Queue** | `Ctrl+1` | `Cmd+1` | Focus error queue section |
| **Jump to Analysis** | `Ctrl+2` | `Cmd+2` | Focus current analysis section |
| **Jump to History** | `Ctrl+3` | `Cmd+3` | Focus history section |

---

## Error Queue Navigation

### Movement

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Next Error** | `↓` or `Alt+F8` | `↓` or `Option+F8` | Move to next error in queue |
| **Previous Error** | `↑` or `Shift+Alt+F8` | `↑` or `Shift+Option+F8` | Move to previous error |
| **First Error** | `Home` | `Home` | Jump to first error |
| **Last Error** | `End` | `End` | Jump to last error |

### Actions on Errors

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Analyze Error** | `Enter` | `Enter` | Analyze focused error |
| **Remove Error** | `Delete` | `Delete` | Remove error from queue |
| **Pin Error** | `Ctrl+P` | `Cmd+P` | Pin error to top of queue |
| **Open in Editor** | `F4` | `F4` | Open error location in editor |
| **Copy Error** | `Ctrl+C` | `Cmd+C` | Copy error message |

### Queue Management

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Select All** | `Ctrl+A` | `Cmd+A` | Select all errors |
| **Clear Queue** | `Ctrl+Shift+Delete` | `Cmd+Shift+Delete` | Clear all errors (with confirmation) |
| **Refresh Queue** | `F5` | `F5` | Refresh error detection |

---

## Analysis Control

### During Analysis

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Stop Analysis** | `Escape` | `Escape` | Stop current analysis |
| **Pause Analysis** | `Ctrl+Shift+Pause` | `Cmd+Shift+Pause` | Pause analysis (resume later) |
| **Skip Iteration** | `Ctrl+Shift+>` | `Cmd+Shift+>` | Skip to next iteration |

### After Analysis

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Copy Fix Code** | `Ctrl+Shift+C` | `Cmd+Shift+C` | Copy suggested fix |
| **Apply Fix** | `Ctrl+Shift+F` | `Cmd+Shift+F` | Apply fix to file (if available) |
| **View in Editor** | `Ctrl+Shift+O` | `Cmd+Shift+O` | Open error location |
| **Feedback Helpful** | `Ctrl+Shift+H` | `Cmd+Shift+H` | Mark analysis as helpful |
| **Feedback Not Helpful** | `Ctrl+Shift+N` | `Cmd+Shift+N` | Mark analysis as not helpful |

---

## Settings & Preferences

### Toggle Features

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Toggle Educational Mode** | `Ctrl+Shift+E` | `Cmd+Shift+E` | Enable/disable educational explanations |
| **Toggle Performance Metrics** | `Ctrl+Shift+M` | `Cmd+Shift+M` | Show/hide performance metrics |
| **Toggle Auto-Detect** | `Ctrl+Shift+D` | `Cmd+Shift+D` | Enable/disable auto error detection |
| **Toggle Batch Analysis** | `Ctrl+Shift+B` | `Cmd+Shift+B` | Enable/disable batch analysis |

### Open Settings

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Open Settings** | `Ctrl+,` | `Cmd+,` | Open VS Code settings |
| **Open RCA Settings** | `Ctrl+Shift+,` | `Cmd+Shift+,` | Open RCA Agent settings directly |

---

## Accessibility Features

### Screen Reader Support

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Announce Panel State** | `Ctrl+Shift+S` | `Cmd+Shift+S` | Announce current panel status |
| **Announce Error Count** | `Ctrl+Shift+Q` | `Cmd+Shift+Q` | Announce error queue count |
| **Read Analysis Result** | `Ctrl+Shift+L` | `Cmd+Shift+L` | Read analysis result aloud |

### Keyboard Navigation

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Skip to Main Content** | `Alt+M` | `Option+M` | Skip navigation, jump to main content |
| **Skip to Error Queue** | `Alt+Q` | `Option+Q` | Jump directly to error queue |
| **Skip to Results** | `Alt+R` | `Option+R` | Jump to analysis results |

### High Contrast Mode

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Toggle High Contrast** | `Ctrl+Shift+H` | `Cmd+Shift+H` | Toggle high contrast theme |
| **Increase Font Size** | `Ctrl++` | `Cmd++` | Increase panel font size |
| **Decrease Font Size** | `Ctrl+-` | `Cmd+-` | Decrease panel font size |
| **Reset Font Size** | `Ctrl+0` | `Cmd+0` | Reset to default font size |

---

## Advanced

### History Management

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **View History** | `Ctrl+H` | `Cmd+H` | Focus history section |
| **Reanalyze from History** | `Ctrl+Shift+Enter` | `Cmd+Shift+Enter` | Reanalyze selected history item |
| **Delete History Item** | `Delete` | `Delete` | Remove history item |
| **Clear History** | `Ctrl+Shift+Delete` | `Cmd+Shift+Delete` | Clear all history (with confirmation) |
| **Export History** | `Ctrl+Shift+X` | `Cmd+Shift+X` | Export history to JSON |

### Developer Tools

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Open Logs** | `Ctrl+Shift+U` | `Cmd+Shift+U` | Open RCA Agent output logs |
| **Clear Cache** | `Ctrl+Shift+K` | `Cmd+Shift+K` | Clear analysis cache |
| **Show Performance Report** | `Ctrl+Shift+P` | `Cmd+Shift+P` | View detailed performance report |
| **Debug Mode** | `Ctrl+Shift+Alt+D` | `Cmd+Shift+Alt+D` | Enable debug mode with verbose logging |

### Context Menu (Right-Click)

All shortcuts can also be accessed via right-click context menus on:
- Error items in queue
- History items
- Analysis results
- Code snippets in results

---

## Customization

### Changing Shortcuts

1. Open **Keyboard Shortcuts** editor:
   - Windows/Linux: `Ctrl+K Ctrl+S`
   - macOS: `Cmd+K Cmd+S`

2. Search for "RCA Agent"

3. Click the pencil icon next to any command

4. Press your desired key combination

5. Press `Enter` to save

### Example: Change "Analyze Error" Shortcut

1. Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
2. Search: `RCA Agent: Analyze Error`
3. Click pencil icon
4. Press your new shortcut (e.g., `Ctrl+R`)
5. Press `Enter`

### Conflicts

If a shortcut conflicts with existing VS Code commands, you'll see a warning. You can:
- Choose a different shortcut
- Remove the conflicting command's shortcut
- Use "when" clauses to make shortcuts context-specific

---

## Quick Reference Card

Print this cheat sheet for quick access:

```
┌─────────────────────────────────────────────────────────────┐
│               RCA AGENT - QUICK REFERENCE                   │
├─────────────────────────────────────────────────────────────┤
│ ANALYZE                                                     │
│   Ctrl+Shift+R    Analyze selected error (output)          │
│   Ctrl+Shift+W    Analyze in panel                         │
│   Ctrl+Shift+Alt+A Analyze all errors                      │
│                                                             │
│ NAVIGATE                                                    │
│   Ctrl+Shift+A    Toggle panel                             │
│   Alt+F8         Next error                                │
│   Shift+Alt+F8   Previous error                            │
│   Enter          Analyze focused error                     │
│   Escape         Stop analysis                             │
│                                                             │
│ SETTINGS                                                    │
│   Ctrl+Shift+E    Toggle educational mode                  │
│   Ctrl+Shift+M    Toggle performance metrics               │
│   Ctrl+Shift+D    Toggle auto-detect                       │
│                                                             │
│ ACCESSIBILITY                                               │
│   Alt+M          Skip to main content                      │
│   Alt+Q          Jump to error queue                       │
│   Alt+R          Jump to results                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Tips & Best Practices

### Efficiency Tips

1. **Use keyboard-only workflow:**
   - `Ctrl+Shift+A` to open panel
   - `Alt+F8` to navigate errors
   - `Enter` to analyze
   - `Escape` to stop

2. **Batch processing:**
   - Use `Ctrl+Shift+Alt+A` to analyze all errors at once
   - Great for post-merge error cleanup

3. **Quick access:**
   - Keep panel visible in activity bar for one-click access
   - Pin frequent errors for faster reanalysis

### Accessibility Tips

1. **Screen reader users:**
   - Use `Alt+M` to skip to main content
   - Use `Ctrl+Shift+S` for status announcements
   - Navigate with `Tab` and arrow keys

2. **Keyboard-only users:**
   - All features accessible via keyboard
   - No mouse required
   - Focus indicators always visible

3. **Visual impairments:**
   - High contrast mode available
   - Font size adjustable
   - ARIA labels for all elements

---

## Troubleshooting

### Shortcut Not Working?

1. **Check for conflicts:**
   - Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
   - Search for the key combination
   - See if another extension is using it

2. **Verify VS Code focus:**
   - Some shortcuts only work when specific views are focused
   - Ensure the panel or editor has focus

3. **Restart VS Code:**
   - Sometimes shortcuts need a restart to take effect

### Reporting Issues

If a shortcut isn't working as expected:
1. Check the output log (`Ctrl+Shift+U`)
2. Enable debug mode (`Ctrl+Shift+Alt+D`)
3. Report the issue with logs

---

## Related Documentation

- [User Guide](USER_GUIDE.md) - Complete feature documentation
- [README](README.md) - Getting started
- [Educational Mode](EDUCATIONAL_MODE.md) - Learning features

---

**Last Updated:** December 27, 2025  
**Version:** 2.0.0
