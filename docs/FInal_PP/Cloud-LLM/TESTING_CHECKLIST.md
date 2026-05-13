# Cloud LLM Integration - Manual Testing Checklist

## Pre-Testing Setup

- [ ] Extension is compiled (`npm run compile` in vscode-extension)
- [ ] Extension is running in debug mode (F5)
- [ ] Have valid API keys ready for testing:
  - [ ] Google AI Studio API key (Gemini)
  - [ ] Anthropic API key (Claude)
  - [ ] OpenAI API key

---

## Test Suite 1: UI Navigation

### T1.1 - Model Dropdown Shows Cloud Option
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open RCA Agent sidebar | Settings panel visible |
| 2 | Click Model dropdown | Dropdown opens |
| 3 | Verify options | Shows local models + divider + "Use Cloud Model" |
| 4 | Verify styling | "Use Cloud Model" has purple/accent color |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T1.2 - Navigation to Cloud Config
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Use Cloud Model" option | Navigates to Cloud Configuration tab |
| 2 | Verify header | Shows "Cloud LLM Configuration" title |
| 3 | Verify fields | Provider dropdown, Model dropdown, API Key input visible |
| 4 | Verify buttons | "Save Key" and "Test Connection" buttons present |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T1.3 - Back Navigation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Cloud Config tab, click "Back" | Returns to main Settings |
| 2 | Verify state preserved | Previous settings unchanged |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Suite 2: Provider Selection

### T2.1 - Provider Dropdown Options
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Provider dropdown | Shows: Google Gemini, Anthropic Claude, OpenAI |
| 2 | Select "Google Gemini" | Provider updates, Model dropdown updates with Gemini models |
| 3 | Select "Anthropic Claude" | Model dropdown shows Claude models |
| 4 | Select "OpenAI" | Model dropdown shows OpenAI models |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T2.2 - Model Options Per Provider
| Provider | Expected Models |
|----------|-----------------|
| Google Gemini | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash |
| Anthropic Claude | claude-3-opus, claude-3-sonnet, claude-3-haiku |
| OpenAI | gpt-4o, gpt-4-turbo, gpt-3.5-turbo |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Suite 3: API Key Input

### T3.1 - Password Field Masking
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type API key in field | Characters shown as dots (••••) |
| 2 | Click eye icon | Key becomes visible |
| 3 | Click eye icon again | Key hidden again |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T3.2 - Empty Key Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave API key field empty | - |
| 2 | Click "Save Key" | Error message: "Please enter an API key" |
| 3 | Click "Test Connection" | Error message: "Please enter an API key" |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T3.3 - Invalid Key Format (Optional)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter obviously invalid key (e.g., "abc") | - |
| 2 | Click "Test Connection" | Error from API: "Invalid API key" |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Suite 4: Save & Storage

### T4.1 - Save Valid API Key
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid Gemini API key | - |
| 2 | Click "Save Key" | Success message: "Key saved successfully!" |
| 3 | Status updates | Shows "Configured" or similar |
| 4 | Close and reopen extension | Key persists (field shows masked dots) |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T4.2 - Key Persistence Across Sessions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Save API key | Success |
| 2 | Close VS Code completely | - |
| 3 | Reopen VS Code | - |
| 4 | Open Cloud Config | Previously saved key still present |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T4.3 - Update Existing Key
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With existing key saved, enter new key | - |
| 2 | Click "Save Key" | Success message |
| 3 | Test connection | Uses new key |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Suite 5: Connection Testing

### T5.1 - Successful Connection Test (Gemini)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid Gemini API key | - |
| 2 | Click "Test Connection" | Loading indicator appears |
| 3 | Wait for response | Success: "Connected (XXXms latency)" |
| 4 | Status indicator | Green checkmark |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T5.2 - Failed Connection Test (Invalid Key)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter invalid API key | - |
| 2 | Click "Test Connection" | Loading indicator |
| 3 | Wait for response | Error: "Authentication failed" or similar |
| 4 | Status indicator | Red X |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T5.3 - Network Timeout Handling
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect internet | - |
| 2 | Click "Test Connection" | - |
| 3 | Wait | Error: "Network error" or timeout message |
| 4 | Reconnect internet | - |
| 5 | Retry | Should succeed |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Suite 6: Integration with Analysis

### T6.1 - Use Cloud Model for Analysis
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Configure and save cloud provider | Success |
| 2 | Select cloud model in main dropdown | Model shows as active |
| 3 | Paste an error log | - |
| 4 | Click "Analyze" | Analysis runs using cloud model |
| 5 | Verify response | Valid RCA response returned |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T6.2 - Switch Between Local and Cloud
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run analysis with cloud model | Uses cloud API |
| 2 | Switch to local model (DeepSeek) | - |
| 3 | Run analysis | Uses Ollama/local |
| 4 | Switch back to cloud | - |
| 5 | Run analysis | Uses cloud API again |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T6.3 - Chat Integration (@rca)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Configure cloud model | - |
| 2 | Open VS Code Chat | - |
| 3 | Type `@rca analyze this error...` | - |
| 4 | Verify response | Uses cloud model for response |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Suite 7: Error Handling

### T7.1 - API Rate Limit
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger rate limit (spam requests) | - |
| 2 | Observe error | User-friendly rate limit message |
| 3 | Wait and retry | Should recover |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T7.2 - API Quota Exceeded
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use exhausted API key | - |
| 2 | Run analysis | Clear error: "Quota exceeded" |
| 3 | Suggestion to check billing | Helpful message |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T7.3 - Graceful Fallback
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Cloud connection fails mid-analysis | - |
| 2 | Observe behavior | Error shown, option to retry or use local |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Suite 8: Security

### T8.1 - Key Not in Logs
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Developer Tools (Help > Toggle Dev Tools) | - |
| 2 | Save and test API key | - |
| 3 | Search console for API key | Key NOT visible in logs |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

### T8.2 - Key Not in Settings.json
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Save API key | - |
| 2 | Open `.vscode/settings.json` | - |
| 3 | Search for API key | Key NOT present |
| 4 | Open User settings.json | Key NOT present |

**Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## Test Summary

| Suite | Tests | Passed | Failed | Blocked |
|-------|-------|--------|--------|---------|
| UI Navigation | 3 | | | |
| Provider Selection | 2 | | | |
| API Key Input | 3 | | | |
| Save & Storage | 3 | | | |
| Connection Testing | 3 | | | |
| Integration | 3 | | | |
| Error Handling | 3 | | | |
| Security | 2 | | | |
| **TOTAL** | **22** | | | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Project Lead | | | |

---

## Notes & Issues Found

_Document any issues discovered during testing:_

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| | | | |
| | | | |
| | | | |
