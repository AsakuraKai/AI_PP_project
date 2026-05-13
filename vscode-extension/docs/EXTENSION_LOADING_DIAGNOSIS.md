# VS Code Extension Loading Issue - Diagnosis

**Date:** 2026-03-28
**Issue:** Extension loading old code despite compilation

---

## 🔍 Root Cause Identified

### The Problem: Mismatched Paths

**Your `tsconfig.json` says:**
```json
{
  "compilerOptions": {
    "outDir": "out",      // ← Outputs to ./out/
    "rootDir": ".."       // ← Root is parent directory!
  }
}
```

**Your `package.json` says:**
```json
{
  "main": "./out/vscode-extension/src/extension.js"  // ✅ CORRECT!
}
```

**Actual compiled file location:**
```
✅ out/vscode-extension/src/extension.js (exists, updated today at 15:37)
```

---

## ✅ Good News

**The paths are actually CORRECT!** The file exists at the expected location and was recently compiled.

---

## 🐛 Why You're Still Seeing Old Code

Since the paths are correct, the issue is likely one of these:

### 1. **VS Code Extension Host Cache** (Most Likely)

**Problem:** VS Code cached the old extension and isn't reloading it.

**Solution:**
```bash
# Method 1: Hard reload
Ctrl+Shift+P → "Developer: Reload Window"

# Method 2: Restart extension host
Ctrl+Shift+P → "Developer: Restart Extension Host"

# Method 3: Close ALL VS Code windows and reopen
```

---

### 2. **Multiple Extension Instances**

**Check if you have the extension installed in multiple ways:**

1. **Development version** (running via F5)
2. **Installed version** (from .vsix file)

**To check:**
```bash
# In VS Code
Ctrl+Shift+X → Search "RCA Agent"
# Look for duplicates
```

**Solution:**
- Uninstall any installed versions
- Only run via F5 (Extension Development Host)

---

### 3. **Old .vsix Package**

**I see you have:**
```
rca-agent-extension-2.0.0.vsix (132 MB, from Jan 6)
```

**If you installed this .vsix:**
- It contains OLD compiled code from January 6
- Even if you recompile, the installed version won't update
- You need to uninstall it first

**Solution:**
```bash
# Uninstall the extension
Ctrl+Shift+X → Find "RCA Agent" → Uninstall

# Then run from source
F5 (to launch Extension Development Host)
```

---

### 4. **TypeScript Compilation Issue**

**Check when the file was last compiled:**
```bash
ls -la out/vscode-extension/src/extension.js
# Shows: Mar 28 15:37 (TODAY - GOOD!)
```

**But check if there are other old files:**
```bash
find out -name "*.js" -type f -exec ls -lh {} \; | grep -v "Mar 28"
```

**If you see old files, rebuild:**
```bash
# Clean and rebuild
rm -rf out/
npm run compile
```

---

## 🔧 Step-by-Step Fix

### Step 1: Verify Current State
```bash
# Check file timestamp
ls -la out/vscode-extension/src/extension.js

# Should show: Mar 28 15:37 (recent)
```

### Step 2: Check for Installed Extension
```bash
# In VS Code
Ctrl+Shift+X → Search "RCA Agent"
```

**If you see it installed:**
- Click "Uninstall"
- Reload VS Code

### Step 3: Hard Reload VS Code
```bash
# Close ALL VS Code windows
# Reopen VS Code
# Press F5 to launch Extension Development Host
```

### Step 4: Verify It's Loading New Code

**Add a console.log to verify:**
```typescript
// In src/extension.ts (line 1)
console.log('🚀 Extension loaded at:', new Date().toISOString());
console.log('🚀 File path:', __filename);
```

**Recompile:**
```bash
npm run compile
```

**Launch:**
```bash
# Press F5
# Open Developer Tools in Extension Development Host
# Ctrl+Shift+I
# Check console for your log
```

---

## 📊 Diagnostic Commands

Run these to diagnose:

```bash
# 1. Check package.json main entry
cat package.json | grep '"main"'
# Expected: "./out/vscode-extension/src/extension.js"

# 2. Check if file exists
ls -la out/vscode-extension/src/extension.js
# Expected: File exists with recent timestamp

# 3. Check tsconfig output
cat tsconfig.json | grep -A 2 '"outDir"'
# Expected: "outDir": "out"

# 4. Find all extension.js files
find . -name "extension.js" -type f
# Expected: Only one in out/vscode-extension/src/

# 5. Check for .vsix installations
ls -la *.vsix
# If exists: Uninstall the extension first
```

---

## 🎯 Most Likely Solution

Based on the diagnosis, your issue is **NOT** a path problem. The most likely causes are:

1. **VS Code cache** - Hard reload needed
2. **Installed .vsix version** - Uninstall it
3. **Multiple VS Code windows** - Close all and reopen

**Quick fix:**
```bash
# 1. Uninstall any installed "RCA Agent" extension
Ctrl+Shift+X → Uninstall

# 2. Close ALL VS Code windows

# 3. Reopen VS Code

# 4. Press F5 to launch Extension Development Host

# 5. Check if new code is loaded
```

---

## 🔍 Why Your Paths Are Unusual (But Correct)

**Your `tsconfig.json` has:**
```json
{
  "rootDir": "..",  // Parent directory
  "outDir": "out"   // Output to ./out/
}
```

**This means:**
- Source: `../vscode-extension/src/extension.ts` (parent/vscode-extension/src/)
- Output: `./out/vscode-extension/src/extension.js` (preserves structure)

**This is correct for a monorepo structure where:**
- Root: `AI_PP_project/`
- Extension: `AI_PP_project/vscode-extension/`
- Backend: `AI_PP_project/src/`

The `rootDir: ".."` preserves the directory structure in the output.

---

## ✅ Verification Checklist

After applying the fix:

- [ ] Uninstalled any .vsix versions
- [ ] Closed all VS Code windows
- [ ] Reopened VS Code
- [ ] Pressed F5 to launch Extension Development Host
- [ ] Checked Developer Console (Ctrl+Shift+I) for logs
- [ ] Verified new code is running (check console.log timestamp)

---

## 📝 Prevention

To avoid this in the future:

1. **Never install the .vsix while developing**
   - Only use F5 (Extension Development Host)
   - Install .vsix only for testing final builds

2. **Use watch mode during development**
   ```bash
   npm run watch
   ```

3. **Add a version log to your extension**
   ```typescript
   console.log('Extension version:', vscode.extensions.getExtension('Kai.rca-agent-extension')?.packageJSON.version);
   ```

4. **Hard reload after major changes**
   ```bash
   Ctrl+Shift+P → "Developer: Reload Window"
   ```

---

**Status:** Paths are correct, issue is likely VS Code cache or installed .vsix
**Next Step:** Uninstall extension, close all windows, reopen, press F5
**Expected Result:** New code should load

---

**Document Version:** 1.0
**Last Updated:** 2026-03-28
