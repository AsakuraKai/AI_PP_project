# Quick Start Guide - Testing the VS Code Extension

## Prerequisites
- Visual Studio Code installed
- Node.js 18+ installed

## Setup Instructions

### 1. Install Dependencies
```bash
cd vscode-extension
npm install
```

### 2. Compile TypeScript
```bash
npm run compile
```

### 3. Run in Debug Mode
- Open `vscode-extension` folder in VS Code
- Press `F5` to launch Extension Development Host
- A new VS Code window will open with the extension loaded

### 4. Test the Extension

#### Option 1: Using Keyboard Shortcut
1. Create a new file with Kotlin error text:
```kotlin
Exception in thread "main" kotlin.UninitializedPropertyAccessException: lateinit property myProperty has not been initialized
    at com.example.MyClass.useProperty(MyClass.kt:15)
    at com.example.Main.main(Main.kt:8)
```

2. Select the error text
3. Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
4. View output in "RCA Agent" panel

#### Option 2: Using Command Palette
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "RCA Agent: Analyze Error"
3. Paste error text in input box
4. View output in "RCA Agent" panel

### 5. View Debug Logs
- Open "RCA Agent Debug" output channel to see detailed logs

## Sample Error Texts for Testing

### NPE Error
```
Exception in thread "main" java.lang.NullPointerException
    at com.example.MainActivity.onCreate(MainActivity.kt:42)
    at android.app.Activity.performCreate(Activity.java:6876)
```

### Lateinit Error
```
kotlin.UninitializedPropertyAccessException: lateinit property viewBinding has not been initialized
    at com.example.MyFragment.onViewCreated(MyFragment.kt:28)
```

### Unresolved Reference
```
Error: Unresolved reference: getString
    at MainActivity.kt:35
```

## Expected Output

You should see:
- 🔴/🟠/🔵 Error badge
- File and line number
- Root cause analysis
- Fix guidelines (numbered list)
- Confidence percentage

## Current Limitations

⚠️ **Note:** This is a placeholder version. It will show mock results until integrated with the backend (requires desktop access with Ollama).

The real AI-powered analysis requires:
1. Ollama server running
2. granite-code:8b model downloaded
3. Backend integration complete

## Troubleshooting

### Extension Won't Activate
- Check Output > Extension Host for errors
- Run `npm run compile` to rebuild
- Restart VS Code

### Command Not Showing
- Check package.json has correct command registration
- Reload Extension Development Host window

### No Output Displayed
- Check "RCA Agent" output panel is visible
- Check "RCA Agent Debug" for error logs

## Next Steps

Once you have desktop access:
1. Start Ollama server
2. Test backend components
3. Integrate frontend with backend
4. Test end-to-end workflow
