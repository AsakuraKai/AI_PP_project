# 🚀 Quick Start - Using RCA Agent on Your Project

> **5-Minute Setup Guide for Installing and Running the Extension**

---

## ⚡ Super Quick Start

### Step 1: Install Prerequisites (10 minutes)

```bash
# 1. Install Ollama (LLM Server)
# Windows: Download from https://ollama.ai/download and run installer
# Mac/Linux: curl -fsSL https://ollama.ai/install.sh | sh

# 2. Download AI Model (~4.7GB, takes 5-10 min depending on internet)
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# 3. Start Ollama Server
ollama serve

# 4. Verify it's running
# Windows PowerShell:
Invoke-RestMethod -Uri http://localhost:11434/api/tags
# Mac/Linux:
curl http://localhost:11434/api/tags

# Expected output (shows installed models):
# {
#   "models": [
#     {
#       "name": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest",
#       "size": 5073152000,
#       ...
#     }
#   ]
# }
# ✅ If you see this, Ollama is ready!
```

### Step 2: Install Extension (2 minutes)

**Option A: From VSIX File (If you have the .vsix file)**
1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Extensions: Install from VSIX" and press Enter
4. Navigate to and select `rca-agent-extension-0.1.0.vsix`
5. Click "Reload Now" in the popup notification (bottom-right corner)
   - Or press `Ctrl+Shift+P` → "Developer: Reload Window"

**Option B: Build from Source (If you need to create the .vsix file)**
```bash
# 1. Open terminal in VS Code (Ctrl+` or View > Terminal)

# 2. Navigate to the extension directory
# Replace with YOUR actual project path:
cd "path/to/your/AI_PP_project/vscode-extension"

# 3. Install dependencies (takes 1-2 minutes)
npm install

# 4. Build the extension
npm run compile

# 5. Package as VSIX (installs vsce if needed)
npm install -g @vscode/vsce
vsce package

# ✅ Look for: "Created rca-agent-extension-0.1.0.vsix" message
# 6. Now use Option A above to install the .vsix file
```

### Step 3: Test It! (1 minute)

1. **Open your Kotlin/Android project in VS Code**

2. **Copy this test error:**
   ```
   Exception in thread "main" kotlin.UninitializedPropertyAccessException: lateinit property myProperty has not been initialized
       at com.example.MyClass.useProperty(MyClass.kt:15)
   ```

3. **Analyze it:**
   - Paste error in any file or select it
   - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Watch for progress: "Analyzing error..." appears in status bar (bottom-left)

4. **View results** in the "RCA Agent" output panel:
   - **Where to find it:** Bottom panel → Click "OUTPUT" tab → Select "RCA Agent" from dropdown
   - **Or:** View → Output → Select "RCA Agent"
   - **What you'll see:** Root cause analysis, fix guidelines, confidence score

---

## 📖 Basic Usage

### Method 1: From Selection (Recommended - Fastest)

```
1. Find or paste error in your editor (any file works)
2. Select the error text (including stack trace)
3. Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
4. Results appear in OUTPUT panel (bottom) → "RCA Agent" channel
```

### Method 2: From Input Box (No Selection Needed)

```
1. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
2. Type "RCA Agent: Analyze Error" and press Enter
3. Input box appears → Paste your error and press Enter
4. Results appear in OUTPUT panel (bottom) → "RCA Agent" channel
```

### Method 3: Webview Mode (Best Visual Experience)

```
1. Select error text in editor
2. Press Ctrl+Shift+W (Windows/Linux) or Cmd+Shift+W (Mac)
3. Side panel opens on the RIGHT with:
   - Real-time analysis progress
   - Formatted RCA report
   - Clickable file links
   - Copy buttons
   - Feedback buttons (👍/👎)
```

---

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | macOS | Notes |
|--------|---------------|-------|-------|
| Analyze Error (Output) | `Ctrl+Shift+R` | `Cmd+Shift+R` | Shows results in Output panel |
| Analyze Error (Webview) | `Ctrl+Shift+W` | `Cmd+Shift+W` | Opens visual side panel |
| Educational Mode | `Ctrl+Shift+E` | `Cmd+Shift+E` | Beginner-friendly explanations |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` | Opens all commands (type "RCA") |

---

## 🎯 What Errors Can It Analyze?

### Kotlin Core (6 types)
- ✅ NullPointerException (NPE)
- ✅ lateinit property not initialized
- ✅ Unresolved reference
- ✅ Type mismatch
- ✅ Compilation errors
- ✅ Import errors

### Jetpack Compose (8 types)
- ✅ remember state issues
- ✅ Recomposition problems
- ✅ LaunchedEffect errors
- ✅ CompositionLocal issues
- ✅ Modifier chain errors
- ✅ Side effect problems
- ✅ DerivedState issues
- ✅ SnapshotState errors

### XML Layouts (7 types)
- ✅ Inflation errors
- ✅ Missing ID
- ✅ Attribute errors
- ✅ Namespace errors
- ✅ View not found
- ✅ Include errors
- ✅ Merge errors

### Gradle (5 types)
- ✅ Dependency conflicts
- ✅ Resolution errors
- ✅ Task failures
- ✅ Build script syntax
- ✅ Compilation errors

### AndroidManifest (5 types)
- ✅ Merge conflicts
- ✅ Missing permissions
- ✅ Undeclared activity
- ✅ Undeclared service
- ✅ Undeclared receiver

**Total: 26+ error types**

---

## 💡 Pro Tips

### 1. Enable Educational Mode (Beginner-Friendly)

**How to use:**
```
1. Select your error text
2. Press Ctrl+Shift+E (or Cmd+Shift+E on Mac)
3. Wait for analysis
```

**What you get:**
- **What**: Error explanation in plain language (no jargon)
- **Why**: Common causes (5-7 real-world scenarios)
- **How**: Prevention strategies with copy-paste code examples
- **Learn**: Additional resources and best practices

**Example output:**
```
📚 LEARNING NOTES:
──────────────────────────────────────────
What is lateinit?
latenit tells Kotlin "I'll initialize this later, trust me."
But if you forget, you get this crash.

Why does this happen?
1. Forgot to call initialization method
2. Initialized in wrong lifecycle method
3. Conditional initialization didn't run
...
```

### 2. Use Webview for Better UI

```
Press Ctrl+Shift+W instead of Ctrl+Shift+R
```

Benefits:
- Interactive visual panel
- Real-time progress updates
- Clickable file links
- Code highlighting
- Copy-to-clipboard buttons

### 3. Provide Feedback (Improves AI Learning)

**Where to find feedback buttons:**
- **Webview Mode:** At the bottom of the side panel
- **Output Panel Mode:** Look for info message with "Provide Feedback" button

**How it works:**
```
👍 Thumbs Up:
  - Saves this solution as high-quality
  - AI learns this pattern works
  - Future similar errors resolve faster

👎 Thumbs Down:
  - Marks solution as unhelpful
  - Invalidates cache for this error
  - Next time, AI tries a different approach
  - Optional: Add comment explaining what was wrong
```

**To add detailed feedback:**
1. Click 👎 (thumbs down)
2. Input box appears: "What was wrong with this analysis?"
3. Type your feedback (e.g., "Suggested fix didn't work", "Wrong root cause")
4. Press Enter
5. AI learns from your input for future analyses

### 4. Check Performance Metrics

**How to view:**
```
1. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
2. Type "RCA Agent: Toggle Performance Metrics"
3. Press Enter
```

**Where to find metrics:**
- Shows in OUTPUT panel → "RCA Agent" channel
- Updates after each analysis

**What you'll see:**
```
📊 PERFORMANCE METRICS:
──────────────────────────────────────────
⏱️  Total Analysis Time: 12.3s
💾 Cache Hit: Yes (saved 45s!)
🎯 Confidence Score: 89%
🔤 Tokens Used: 1,847 tokens
🤖 LLM Inference: 8.2s
📈 Average Response Time: 15.4s (last 10 analyses)
```

---

## 🛠️ How to Use the Agent to Fix Your Errors (Step-by-Step)

### Complete Workflow: From Error to Fixed Code

#### Step 1: Capture the Error

**From Android Studio / IntelliJ IDEA:**
```
1. Run your app/tests → Error occurs
2. Go to "Run" tab or "Logcat" (Android)
3. Find the error (usually in red)
4. Select the ENTIRE error message including:
   ✅ Error type (e.g., NullPointerException)
   ✅ Error message
   ✅ Stack trace (at least 3-5 lines)
   ✅ File paths and line numbers
5. Copy it (Ctrl+C / Cmd+C)
```

**From Terminal / Command Line:**
```
1. Build fails → Error appears in terminal
2. Scroll up to find the FIRST error (often the root cause)
3. Copy error + surrounding context (5-10 lines)
```

**From VS Code Problems Panel:**
```
1. Open Problems panel (Ctrl+Shift+M)
2. Click on an error
3. Right-click → "Copy" or select text and copy
```

#### Step 2: Analyze with RCA Agent

**Quick Method (10 seconds):**
```
1. Open any file in VS Code (temp.txt works!)
2. Paste the error (Ctrl+V)
3. Select all the error text
4. Press Ctrl+Shift+W (opens visual panel)
5. Watch the analysis in real-time
```

**What Happens During Analysis:**
```
⏳ Iteration 1/3: Parsing error type...     (2-3 seconds)
🔍 Iteration 2/3: Reading source files...   (4-6 seconds)
💡 Iteration 3/3: Generating solution...    (5-8 seconds)
✅ Analysis complete!
```

#### Step 3: Read the RCA Report

**The report has 5 key sections:**

```markdown
1. 🎯 ROOT CAUSE (Most Important!)
   - Explains EXACTLY why the error happened
   - Points to the problematic line/logic
   - Example: "Variable accessed before initialization in onCreate()"

2. 📍 ERROR LOCATION
   - Clickable file links (e.g., MainActivity.kt:42)
   - Click to jump directly to the problem

3. 🛠️ FIX GUIDELINES (Action Items)
   - Step-by-step fix instructions
   - Code snippets you can copy-paste
   - Before/after examples

4. 🔍 RELATED FILES
   - Other files that might need changes
   - Dependencies to check

5. ✅ CONFIDENCE SCORE
   - How sure the AI is (60-100%)
   - Higher = more reliable
   - <70% → Consider checking docs too
```

#### Step 4: Apply the Fix

**Method A: Manual Fix (Recommended for Learning)**
```
1. Read "Fix Guidelines" section
2. Click on file link (e.g., MainActivity.kt:42)
3. VS Code opens the file at that line
4. Compare your code with the suggested fix
5. Make the changes
6. Save (Ctrl+S)
```

**Method B: Copy-Paste Fix (For Simple Errors)**
```
1. Find code snippet in "Fix Guidelines"
2. Click "Copy" button (in webview) or select and copy
3. Navigate to your file
4. Replace the problematic code
5. Adjust variable names if needed
6. Save
```

**Example Fix for lateinit Error:**
```kotlin
// ❌ BEFORE (from RCA report):
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupUI()  // ⚠️ Uses binding before initialization!
    }
    
    private fun setupUI() {
        binding.textView.text = "Hello"  // 💥 CRASH HERE
    }
}

// ✅ AFTER (copy from Fix Guidelines):
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)  // ✅ Initialize first!
        setContentView(binding.root)
        setupUI()  // ✅ Now safe to use
    }
    
    private fun setupUI() {
        binding.textView.text = "Hello"  // ✅ Works!
    }
}
```

#### Step 5: Test the Fix

```
1. Save all files (Ctrl+Shift+S)
2. Rebuild project:
   - Android: Click "Run" or press Shift+F10
   - Gradle: Run ./gradlew build
   - Kotlin: Run your main function
3. Check if error is gone
4. Test the feature that was broken
```

#### Step 6: Provide Feedback

```
✅ If fix worked:
   1. Go back to RCA Agent webview
   2. Click 👍 (thumbs up)
   3. Done! AI learns this solution works

❌ If fix didn't work:
   1. Click 👎 (thumbs down)
   2. Add comment: "Fix didn't work because..."
   3. Try analyzing again (cache invalidated)
   4. Or check documentation links
```

### 🎯 Quick Tips for Success

**1. Provide Complete Errors**
```
✅ GOOD (AI can analyze):
  Exception in thread "main" kotlin.NullPointerException: 
  Attempt to read from field 'String user.name' on a null object reference
      at com.example.UserService.getName(UserService.kt:42)
      at com.example.MainActivity.onCreate(MainActivity.kt:28)

❌ BAD (too vague):
  NullPointerException
```

**2. Use Webview for Complex Errors**
- Multiple files involved? → Use Ctrl+Shift+W
- Need to click through files? → Webview has links
- Want to see progress? → Webview shows real-time updates

**3. Try Educational Mode First (If New to Kotlin/Android)**
- Press Ctrl+Shift+E instead of Ctrl+Shift+R
- Gets detailed explanations of concepts
- Includes learning resources

**4. Check Confidence Score**
- 90-100%: Trust the fix, apply it
- 70-89%: Good solution, but verify with docs
- <70%: Use as starting point, research more

**5. For Gradle Errors, Provide Full Output**
- Copy entire Gradle build log (last 20-30 lines)
- Include dependency tree if shown
- Mention Gradle version

---

## 🎓 Example Workflow

### Real-World Example: Fixing a lateinit Error

**Scenario:** Your Android app crashes with lateinit error

**Step 1: Get the error**
```
Run app → Crash → Copy logcat error:

Exception in thread "main" kotlin.UninitializedPropertyAccessException: 
lateinit property viewBinding has not been initialized
    at com.example.myapp.MainActivity.onCreate(MainActivity.kt:42)
    at android.app.Activity.performCreate(Activity.java:6876)
```

**Step 2: Analyze**
```
1. Paste error in VS Code
2. Select it
3. Press Ctrl+Shift+R
4. Wait 10-15 seconds
```

**Step 3: Get results**
```
🎯 ROOT CAUSE:
─────────────────────────────────────────────────────
The property 'viewBinding' was accessed in onCreate()
before being initialized. The binding is created in
setContentView() which is called after the access.

🛠️  FIX GUIDELINES:
─────────────────────────────────────────────────────
1. Move viewBinding access after setContentView()
2. Initialize binding before first use:
   private lateinit var binding: ActivityMainBinding
   
   override fun onCreate(savedInstanceState: Bundle?) {
       super.onCreate(savedInstanceState)
       binding = ActivityMainBinding.inflate(layoutInflater)
       setContentView(binding.root)
       // Now safe to use binding
   }

✅ Confidence: 92%
```

**Step 4: Apply fix**
```
1. Open MainActivity.kt:42
2. Apply suggested changes
3. Rebuild and run
4. Give feedback (👍 or 👎)
```

---

## 🔧 Configuration (Optional)

### Change AI Model

Default: `hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest` (4.7GB, recommended)

**Switch to faster model:**
```bash
# Download smaller model
ollama pull codellama:7b
```

**Update VS Code settings:**
```
Windows/Linux:
  File > Preferences > Settings (or Ctrl+,)
  
MacOS:
  Code > Preferences > Settings (or Cmd+,)

Then:
  1. Search for "RCA Agent"
  2. Find "Rca Agent: Model"
  3. Change to "codellama:7b"
  4. Reload window (Ctrl+Shift+P → "Developer: Reload Window")
```

**Available models:**
- `hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest` - Best balance (recommended)
- `codellama:7b` - Faster, slightly less accurate
- `qwen-coder:7b` - Strong reasoning, slower
- `deepseek-coder:6.7b` - Compact, good for low RAM

### Change Ollama URL

If Ollama runs on different port/server:

```json
// settings.json
{
  "rcaAgent.ollamaUrl": "http://your-server:11434"
}
```

---

## 🐛 Common Issues & Fixes

### "Could not connect to Ollama"

**Fix:**
```bash
# Check if Ollama is running
# Windows PowerShell:
Invoke-RestMethod -Uri http://localhost:11434/api/tags
# Mac/Linux:
curl http://localhost:11434/api/tags

# If you get an error, Ollama isn't running. Start it:
# Windows: Open "Ollama" from Start Menu, or run in terminal:
ollama serve

# Mac/Linux:
ollama serve

# Verify model is downloaded (should show DeepSeek model):
ollama list
```

### "Analysis timed out" or "Taking too long"

**Possible causes:**
- Model too large for your hardware
- Ollama server overloaded
- Complex error requiring more time

**Fix:**
```bash
# Option 1: Use smaller, faster model
ollama pull codellama:7b

# Then update settings (see Configuration section)
# Set "Rca Agent: Model" to "codellama:7b"

# Option 2: Increase timeout (in settings.json)
# Press Ctrl+Shift+P → "Preferences: Open Settings (JSON)"
# Add:
{
  "rcaAgent.timeout": 120000  // 120 seconds instead of 60
}
```

### "Could not parse error" or "Error not recognized"

**Why this happens:**
- Error format not recognized
- Missing critical information
- Unsupported language (currently supports Kotlin/Android/Gradle)

**Fix - Ensure your error has:**
```
✅ Error type: NullPointerException, KotlinNullPointerException, etc.
✅ File path: MyClass.kt, activity_main.xml, build.gradle
✅ Line number: :42, :line 42, or (line 42)
✅ Stack trace: At least 2-3 lines of "at com.example..."

✅ GOOD example:
Exception in thread "main" kotlin.NullPointerException
    at com.example.MyClass.doSomething(MyClass.kt:42)
    at com.example.Main.main(Main.kt:15)

❌ BAD example (too vague):
Error at line 42
```

### Extension not showing commands

**Symptoms:**
- Can't find "RCA Agent" in command palette
- Keyboard shortcuts don't work
- No "RCA Agent" in Output panel dropdown

**Fix:**
```
1. Verify extension is installed:
   - View > Extensions (Ctrl+Shift+X)
   - Search for "RCA Agent"
   - Should show "Installed" or green checkmark

2. If installed but not working:
   - Press Ctrl+Shift+P
   - Type "Developer: Reload Window"
   - Wait for reload (5-10 seconds)

3. If still not working:
   - Check extension status in Extensions panel
   - Look for error message (yellow/red icon)
   - Try disabling and re-enabling extension

4. Last resort - Reinstall:
   - Right-click extension → Uninstall
   - Restart VS Code
   - Reinstall from VSIX (see Step 2 above)
```

---

## 📊 What to Expect

### Performance

| Metric | Value |
|--------|-------|
| First analysis (no cache) | ~10-15 seconds |
| Repeated errors (cache hit) | <5 seconds |
| Accuracy | 100% on test dataset |
| Cache hit rate | ~60% for common errors |

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8GB | 16GB+ |
| Storage | 10GB free | 20GB+ |
| GPU | Optional | NVIDIA/AMD with CUDA/ROCm |
| OS | Windows 10+, macOS 10.15+, Linux | Any |

---

## 📚 Learn More

- **Full Documentation**: See [VSCODE_EXTENSION_GUIDE.md](docs/VSCODE_EXTENSION_GUIDE.md)
- **Educational Mode**: See [EDUCATIONAL_MODE.md](vscode-extension/EDUCATIONAL_MODE.md)
- **Backend Architecture**: See [docs/architecture/overview.md](docs/architecture/overview.md)

---

## 🎉 You're Ready!

Now open your Kotlin/Android project and start analyzing errors with AI!

**Remember:**
- `Ctrl+Shift+R` - Quick analysis
- `Ctrl+Shift+W` - Visual panel
- `Ctrl+Shift+E` - Educational mode
- 👍/👎 - Provide feedback

Happy debugging! 🚀

