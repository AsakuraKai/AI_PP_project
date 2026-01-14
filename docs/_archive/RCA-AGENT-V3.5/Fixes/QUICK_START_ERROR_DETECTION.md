# 🚀 Quick Start: Error Detection System

> **Automatic error detection - No setup required!**

---

## 📋 What You Get

The RCA Agent now **automatically detects 26+ error types** from Android/Kotlin projects with **zero configuration**:

✅ **Kotlin Errors:** lateinit, NPE, unresolved references, type mismatches  
✅ **Gradle Errors:** Dependency conflicts, version mismatches, build failures  
✅ **Jetpack Compose Errors:** Remember issues, recomposition problems  
✅ **XML Errors:** Layout inflation, missing resources  
✅ **Plus:** TypeScript, JavaScript, ESLint errors

### 🎯 Automatic Detection (Enabled by Default)

- **Build Logs:** Automatically monitored when you build your project
- **Terminal Output:** Automatically captured when terminals close
- **VS Code Diagnostics:** Real-time detection as you code
- **Startup Scan:** Scans recent build logs (last 24 hours) when workspace opens

**Just build your project and errors appear automatically!** 🎉

---

## 🔍 How It Works

### Fully Automatic Detection

1. **Open your Android/Kotlin project** in VS Code
2. **RCA Agent activates automatically** on workspace open
3. **Build your project** normally:
   ```bash
   ./gradlew build
   ```
4. **Errors detected automatically** - notification shows error count
5. **Click "View Errors"** to see them in the RCA panel

**That's it!** No commands, no configuration needed.

### 🎨 Real-Time UI Updates (NEW!)

The RCA Agent now features a **fully dynamic UI** with:

- ⚡ **Instant visual feedback** when errors are detected
- 📈 **Animated statistics** that smoothly update in real-time
- 🎯 **Live activity feed** showing what's happening as it happens
- ✅ **Auto-refreshing metrics** when analyses complete
- 💫 **Smooth animations** with trend indicators

**Watch the stats come alive!** Numbers animate smoothly when they change, and you'll see pulse effects and trend arrows (▲▼) showing increases/decreases.

See [DYNAMIC_UI_UPDATES.md](./DYNAMIC_UI_UPDATES.md) for full details on the dynamic UI system.

---

## 📊 Additional Detection Methods

While automatic detection works great, you can also manually capture errors:

### Method 1: Capture from Clipboard

**When:** You have error text from terminal, browser, or logcat

1. **Copy error text** from anywhere (terminal, logcat, browser)
   ```
   Copy: Unresolved reference: viewModel
   ```

### Method 2: Capture from Terminal (Alternative)

**Note:** Terminal output is now automatically captured when terminals close, but you can still manually capture:om Clipboard`

4. **Done!** Error added to queue

---

### Method 3: Capture from Terminal

1. **Run build in integrated terminal**

2. **Select and copy** error output

3. **Press:** `Ctrl+Shift+P`

4. **Type:** `RCA: Capture Error from Terminal`

5. **Click "Parse"**

---

## 📊 View Your Errors

### Open Error Queue

**Option A:** Click RCA Agent icon in sidebar

**Option B:** Press `Ctrl+Shift+P` → `RCA: Show Error Queue Status`

### What You'll See

```
RCA Agent: 5 errors in queue
Pending: 4, Analyzing: 1, Complete: 0, Failed: 0
```

---

## 🧪 Test It Now

### Quick Test (30 seconds)

1. **Copy this error:**
   ```
   e: MainActivity.kt:45:5 
   Unresolved reference: viewModel
   ```

2. **Capture it:**
   - `Ctrl+Shift+P` → "Capture Error from Clipboard"

3. **Check result:**
   - Notification: "Found 1 error(s)"
   - Open RCA panel to see it

---

## ⚙️ Configuration (Optional)

**All features are enabled by default!** But you can customize if needed:

### Default Settings (Already Active)

```json
{
  // Auto-detect from VS Code diagnostics
  "rcaAgent.autoDetectErrors": true,
  
  // Enable Android/Kotlin error detection
  "rcaAgent.enableAdvancedErrorDetection": true,
  
  // Monitor terminal output automatically
  "rcaAgent.monitorTerminalOutput": true,
  
  // Scan build logs on workspace open
  "rcaAgent.scanBuildLogsOnStartup": true,
  
  // Watch build log files
  "rcaAgent.watchBuildFiles": true,
  
  // Max log file size to parse (5MB)
  "rcaAgent.maxBuildLogSize": 5242880
}
```

### To Disable Automatic Detection

Only needed if you prefer manual control:

```json
{
  "rcaAgent.enableAdvancedErrorDetection": false,
  "rcaAgent.monitorTerminalOutput": false,
  "rcaAgent.scanBuildLogsOnStartup": false
}
```

---

## 🎓 What Gets Detected

### Kotlin Errors (6 types)
- `lateinit property not initialized`
- `NullPointerException`
- `Unresolved reference`
- `Type mismatch`
- `Compilation errors`
- `Import errors`

### Gradle Errors (5 types)
- `Dependency resolution failures`
- `Duplicate class conflicts`
- `Version mismatches`
- `Build script syntax errors`
- `Task execution failures`

### Jetpack Compose (8 types)
- State without remember
- Derived state issues
- Excessive recomposition
- LaunchedEffect problems
- It's working!** If you don't see errors, it means:
- No build errors exist (your code is clean ✅)
- Build logs are older than 24 hours
- No terminal output had recognizable errors

**To test:** Intentionally create an error, build, and check again.

### Want to verify it's running?

**Check logs:**
1. `Help` → `Toggle Developer Tools` → `Console` tab
2. Look for: `[ErrorQueueManager] ✅ Advanced error detection fully activated`
3. You should see: `Terminal output monitoring initialized`, `Build log monitoring initialized`

### Disable if needed

If automatic detection causes issues:
```json
{
  "rcaAgent.enableAdvancedErrorDetection": false
}
```abled?
```json
"rcaAgent.enableAdvancedErrorDetection": true
```

**Check 2:** Is your build log in the right location?
- Must be in `build/` directory
- Check: `build/outputs/logs/*.log`

**Check 3:** Is the file too large?
- Default limit: 5MB
- Increase: `"rcaAgent.maxBuildLogSize": 10485760`

### ErOpened Android/Kotlin project in VS Code
- [ ] Built project with `./gradlew build`
- [ ] Saw notification about detected errors (or no errors if code is clean)
- [ ] Errors automatically appear in RCA panel (if any exist)
- [ ] Terminal output automatically captured when terminal closes

**Everything automatic - no manual steps required!** 🎉
**Solution 2:** Check console
- `Help` → `Toggle Developer Tools` → `Console` tab
- Look for "[ErrorQueueManager]" logs

---

## 📖 Learn More

- **Full Documentation:** [ERROR_PARSER_INTEGRATION.md](./api/ERROR_PARSER_INTEGRATION.md)
- **Backend System:** [ERROR_DETECTION_SYSTEM.md](./api/ERROR_DETECTION_SYSTEM.md)
- **User Guide:** [USER_GUIDE.md](./USER_GUIDE.md)

---

## ✅ Success Checklist

- [ ] Advanced detection enabled in settings
- [ ] Built project and saw notification
- [ ] Captured error from clipboard
- [ ] Viewed errors in RCA panel
- [ ] Errors show correct file paths and line numbers

---

> **Need Help?** Open an issue on GitHub or check the full documentation.
