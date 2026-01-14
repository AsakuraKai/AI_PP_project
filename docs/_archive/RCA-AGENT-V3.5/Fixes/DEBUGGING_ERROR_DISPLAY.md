# Debugging Error Display Issue

## Issue Summary
Errors are being detected by the ErrorParser and added to ErrorQueueManager, but they are not appearing in the UI when the RCA webview panel is opened.

## Debug Steps

### 1. Check Error Queue Status
Run command: **RCA: Debug Error Queue Status** (`rca-agent.debugErrorQueue`)
- This shows total error count
- Lists first few errors with details
- Opens console for detailed logs

### 2. Check Console Logs

When opening the RCA panel, you should see these logs:

#### Backend (Extension Host Console):
```
[RCAWebviewProvider] Webview resolved, sending initial data...
[RCAWebviewProvider] Webview object: EXISTS
[RCAWebviewProvider] ========== INITIAL LOAD DEBUG ==========
[RCAWebviewProvider] Total errors in queue: X
[RCAWebviewProvider] Sample errors (first 3): [...]
[RCAWebviewProvider] Webview ready: YES
[RCAWebviewProvider] ==========================================
[RCAWebviewProvider] Sending errorQueueData with X errors to webview
[RCAWebviewProvider] ✅ Sent X existing errors to newly opened webview
```

#### Frontend (Webview Console):
```
[App] Current route: /
[useErrorQueue] Hook initialized
[useErrorQueue] Setting up message listener
[useErrorQueue] Mounting - requesting error queue
[useErrorQueue] Received message: errorQueueData {...}
[useErrorQueue] Setting errors: X errors
```

### 3. Verify Message Flow

The message flow should be:
1. **ErrorQueueManager** detects errors → stores in StateManager
2. **StateManager** fires `onErrorQueueChange` event
3. **RCAWebviewProvider** listens to event → calls `_handleGetErrorQueue()`
4. **RCAWebviewProvider** sends `errorQueueData` message via `postMessage()`
5. **useErrorQueue** hook receives message → updates `errors` state
6. **ErrorQueue** view renders errors from state

### 4. Check if Webview is Ready

The webview must be ready before messages can be sent. We use a 100ms setTimeout to ensure the webview HTML is loaded and the message listener is attached.

### 5. Check Route Navigation

The Error Queue view is only rendered when the route is `/errors`. Check:
- Click on "Error Queue" in the sidebar
- Console should show: `[App] Current route: /errors`
- This triggers the ErrorQueue component to mount
- useErrorQueue hook mounts and requests data

## Common Issues

### Issue 1: Errors Detected Before Webview Opens
**Symptom:** Errors in queue but not shown when panel opens
**Solution:** The resolveWebviewView() method now calls `_handleGetErrorQueue()` with a setTimeout to ensure initial data is sent

### Issue 2: Message Listener Not Set Up
**Symptom:** Backend sends messages but frontend doesn't receive them
**Solution:** useErrorQueue hook sets up listener in useEffect on mount

### Issue 3: Wrong Route
**Symptom:** useErrorQueue hook never mounts
**Solution:** Ensure you navigate to /errors route by clicking "Error Queue" in sidebar

### Issue 4: Webview Not Ready
**Symptom:** postMessage() called before webview HTML loaded
**Solution:** 100ms setTimeout in resolveWebviewView() ensures webview is ready

## Testing Commands

1. **Scan for errors:**
   - Command: `RCA: Scan Workspace for Errors`
   - Should detect VS Code diagnostics

2. **Capture from clipboard:**
   - Copy error text
   - Command: `RCA: Capture Error from Clipboard`

3. **Check queue:**
   - Command: `RCA: Debug Error Queue Status`
   - Shows count and sample errors

4. **Open panel:**
   - Click "Error Queue" in RCA sidebar
   - Or run: `View: Show RCA Agent`

## Next Steps

If errors still don't appear:

1. Check browser console (Ctrl+Shift+I when webview focused)
2. Check extension host console (Help → Toggle Developer Tools)
3. Verify `_sendMessage()` is being called
4. Verify `window.addEventListener('message', ...)` is attached
5. Check if errors array in useErrorQueue state is updating

## Log Checklist

When debugging, look for these specific logs:

- [ ] `[RCAWebviewProvider] Webview resolved`
- [ ] `[RCAWebviewProvider] Total errors in queue: X`
- [ ] `[RCAWebviewProvider] Sending errorQueueData with X errors`
- [ ] `[useErrorQueue] Hook initialized`
- [ ] `[useErrorQueue] Received message: errorQueueData`
- [ ] `[useErrorQueue] Setting errors: X errors`
- [ ] `[App] Current route: /errors`

If all these logs appear but errors still don't show, the issue is in the ErrorQueue component rendering logic.
