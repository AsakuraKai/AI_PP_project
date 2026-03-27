# Test Errors for RCA Agent

This file contains sample error messages you can paste into the RCA Agent for testing.

## Error 1: Uninitialized lateinit Property

**Copy and paste this into the Analyze view:**

```
FATAL EXCEPTION: main
Process: com.example.testapp, PID: 12345
kotlin.UninitializedPropertyAccessException: lateinit property database has not been initialized
    at com.example.testapp.MainActivity.loadData(MainActivity.kt:42)
    at com.example.testapp.MainActivity.onCreate(MainActivity.kt:28)
    at android.app.Activity.performCreate(Activity.java:8051)
    at android.app.Activity.performCreate(Activity.java:8031)
    at android.app.Instrumentation.callActivityOnCreate(Instrumentation.java:1329)
    at android.app.ActivityThread.performLaunchActivity(ActivityThread.java:3608)
```

**Expected Fix:**
- Initialize the database property before using it
- Add initialization in onCreate() or use lazy initialization
- Add null-safety checks

---

## Error 2: NullPointerException

**Copy and paste this:**

```
FATAL EXCEPTION: main
Process: com.example.testapp, PID: 12346
java.lang.NullPointerException: Attempt to invoke virtual method 'void android.widget.TextView.setText(java.lang.CharSequence)' on a null object reference
    at com.example.testapp.MainActivity.updateUI(MainActivity.kt:56)
    at com.example.testapp.MainActivity.onCreate(MainActivity.kt:30)
    at android.app.Activity.performCreate(Activity.java:8051)
```

**Expected Fix:**
- Check if TextView is null before calling setText
- Use findViewById or view binding to properly initialize views
- Add null-safety operator (?.)

---

## Error 3: Network on Main Thread

**Copy and paste this:**

```
android.os.NetworkOnMainThreadException
    at android.os.StrictMode$AndroidBlockGuardPolicy.onNetwork(StrictMode.java:1605)
    at java.net.SocketInputStream.read(SocketInputStream.java:192)
    at com.example.testapp.ApiClient.fetchData(ApiClient.kt:23)
    at com.example.testapp.MainActivity.loadRemoteData(MainActivity.kt:67)
    at com.example.testapp.MainActivity.onCreate(MainActivity.kt:31)
```

**Expected Fix:**
- Move network operation to background thread
- Use Coroutines with Dispatchers.IO
- Use AsyncTask or WorkManager
- Add proper error handling

---

## Error 4: Missing Gradle Dependency

**Copy and paste this:**

```
Unresolved reference: Room
    at MainActivity.kt:5
```

**Expected Fix:**
- Add Room dependency to build.gradle
- Sync Gradle files
- Check for correct version compatibility

---

## Testing Instructions

1. **Start the RCA Extension** (F5 to debug)
2. **Open Analyze View** from the sidebar
3. **Copy one of the errors above** and paste into the error text area
4. **Fill in the file path:** `MainActivity.kt` or `test-files/MainActivity.kt`
5. **Fill in the line number:** Use the line from the stack trace (e.g., 42)
6. **Click Analyze**
7. **Wait for results** - Should see:
   - Root cause analysis
   - Fix suggestions (with or without code diffs)
   - Confidence score
   - Reasoning steps

## Debug Checklist

If fixes don't show:
- [ ] Check Debug Console for `[RCAWebviewProvider] codeFix present: true/false`
- [ ] Look for `[FixGenerator]` logs
- [ ] Verify file path is correct
- [ ] Ensure Ollama is running: `curl http://localhost:11434`
- [ ] Check model is available: `ollama list | grep deepseek`
- [ ] Review full analysis result in console logs
