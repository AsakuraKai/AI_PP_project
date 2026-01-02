# 💬 Interactive Debugging - User Guide

**New in Phase 4 Week 3-4!** RCA Agent now supports conversational, multi-turn debugging sessions.

---

## 🌟 What's New?

### 1. **Conversational Debugging**
Ask follow-up questions and RCA Agent remembers the context!

```
You: @rca-agent analyze this gradle error
🤖: [Full analysis of AGP version conflict]

You: why does this version not exist?
🤖: The AGP 8.x series intentionally skips 8.8.x and 8.10.x...

You: what should I use instead?
🤖: Based on your project, I recommend AGP 8.7.3 because...

You: how do I apply that?
🤖: Here's the exact change needed...
```

### 2. **Guided Debugging Workflow**
Step-by-step assistance through the entire debugging process!

```
You: @rca-agent guided debug

🤖: I'll help you debug this step by step!

Step 1: Understanding the Error 🔍
[Explanation of what the error means]
[➡️ Continue to Step 2] [❓ Ask a question]

Step 2: Gathering Context 📋
[Analysis of surrounding code]
[➡️ Continue to Step 3] [❓ Ask a question]

... continues through 7 steps ...
```

### 3. **Export Conversations**
Save your debugging session for documentation!

```
You: @rca-agent export conversation

🤖: ✅ Conversation exported to new document!
[Opens markdown file with full conversation]
```

---

## 📖 How to Use

### Standard Error Analysis (Phase 2-3 behavior)
Just like before - analyze errors with a single command:

```
@rca-agent analyze this error
@rca-agent fix gradle build failure
@rca-agent explain this NullPointerException
```

### Follow-up Questions (NEW!)
After any analysis, ask follow-up questions naturally:

```
@rca-agent analyze error
    → [Agent provides analysis]

why does this happen?
    → [Agent explains, remembering context]

show me an example
    → [Agent shows code example]

how do I prevent this in future?
    → [Agent gives best practices]
```

**Keywords that trigger conversational mode:**
- "why", "how", "what"
- "show me", "explain"
- "that", "this", "it"
- "more details", "elaborate"

### Guided Debugging (NEW!)
For complex errors, use guided mode:

```
@rca-agent guided debug
@rca-agent step by step debugging
@rca-agent help me debug this
```

**The 7-step workflow:**
1. **Understand Error** 🔍 - What happened?
2. **Gather Context** 📋 - Where and why?
3. **Analyze Root Cause** 🔬 - Deep dive analysis
4. **Suggest Fix** 💡 - How to fix it
5. **Apply Fix** 🔧 - Make the change
6. **Verify Fix** ✅ - Test it works
7. **Complete** 🎉 - Summary and export

At each step, you can:
- Click [➡️ Continue] to move forward
- Click [❓ Ask a question] to get more info
- Ask any question naturally in chat

### Export Conversations (NEW!)
Save your debugging session:

```
@rca-agent export conversation
@rca-agent save this conversation
```

Creates a markdown document with:
- Full conversation history
- Error context
- Timestamps
- All Q&A pairs

Perfect for:
- Documenting bug fixes
- Sharing with teammates
- Learning references
- Project wikis

---

## 🎯 Best Practices

### 1. **Start Simple, Go Deep**
```
✅ Good:
@rca-agent analyze error
→ why?
→ how to fix?
→ show me example

❌ Avoid:
Asking everything in one long message
```

### 2. **Use Guided Mode for Complex Issues**
```
✅ Use guided mode when:
- Error is unfamiliar
- Multiple potential causes
- Want step-by-step help
- Learning new concepts

✅ Use standard mode when:
- Quick analysis needed
- Error is familiar
- Just need confirmation
```

### 3. **Ask Follow-ups Freely**
```
✅ Examples:
"Why does this happen?"
"What else could cause this?"
"Show me the correct code"
"How do I test the fix?"
"What are the alternatives?"
"Explain this in simple terms"
```

### 4. **Export Important Sessions**
```
✅ Export when:
- Solved a tricky bug
- Want to document for team
- Need reference for future
- Found valuable insights
```

---

## 🔧 Tips & Tricks

### Conversation Control

**Start new conversation:**
```
@rca-agent analyze [different error]
```
This automatically starts a new session.

**Continue previous conversation:**
```
@rca-agent continue conversation
@rca-agent follow up
```
Or just ask follow-up questions directly!

**Switch modes:**
```
# From standard → guided
@rca-agent guided debug

# From guided → standard
@rca-agent quick analysis
```

### Getting Better Answers

**Be specific with follow-ups:**
```
✅ "Why does lateinit cause this specific error?"
❌ "Why?"

✅ "Show me how to fix line 42"
❌ "Show me"
```

**Reference previous context:**
```
"What about the fix you suggested?"
"Can you explain that root cause more?"
"How does this relate to what we discussed?"
```

**Ask for alternatives:**
```
"What are other ways to fix this?"
"Is there a better approach?"
"What would you do instead?"
```

---

## 🐛 Troubleshooting

### "No active conversation found"
**Cause:** You asked a follow-up but there's no previous context.  
**Fix:** Start with `@rca-agent analyze error` first.

### "⚠️ No errors found in the current file"
**Cause:** Guided mode needs an error to debug.  
**Fix:** Open a file with errors or specify the error manually.

### Follow-up not detected
**Cause:** Question might be too vague or no previous messages.  
**Fix:** Use explicit keywords: "why", "how", "explain that", etc.

### Conversation too long
**Cause:** Auto-trimmed to 20 messages for performance.  
**Fix:** Export current conversation and start new one.

---

## 📊 Example Sessions

### Session 1: Quick Error Fix
```
You: @rca-agent analyze gradle error

🤖: AGP version 8.10.0 doesn't exist. Use 8.7.3 instead.
[Apply Fix] [Explain More]

You: why not 9.0?

🤖: You can use 9.0.0, but it requires Kotlin 2.0+. You have 1.9.22.
Would need to upgrade Kotlin first.

You: ok use 8.7.3

🤖: ✅ Applied fix to gradle/libs.versions.toml:6
[Run Build] [Undo]
```

### Session 2: Guided Debugging
```
You: @rca-agent guided debug

🤖: Step 1: Understanding the Error 🔍
lateinit property viewModel not initialized
[Full explanation]

You: when should I initialize it?

🤖: Initialize in onCreate() before first use...

[Continue through steps 2-7]

🤖: Step 7: Complete! 🎉
[Summary + Export option]
```

### Session 3: Deep Investigation
```
You: @rca-agent analyze NPE at line 42

🤖: [Analysis]

You: why null here?

🤖: getUserById() returns null when user doesn't exist...

You: how to prevent?

🤖: 3 options: safe call, null check, or Result type...

You: show safe call example

🤖: ```kotlin
val name = user?.name ?: "Unknown"
```

You: what if I need to crash on null?

🤖: Use requireNotNull()...
```

---

## 🚀 Next Features (Coming Soon)

- **Persistence**: Conversations saved across VS Code restarts
- **Smart context**: Better understanding of project structure
- **Code analysis tools**: Agent can read/analyze code directly
- **Visual debugging**: Graphs and diagrams in conversation
- **Team sharing**: Export conversations for collaboration

---

## 💡 Feedback

Found a bug or have a feature request?
- Open an issue on GitHub
- Use the feedback button in VS Code
- Export conversation and share it

---

**Happy Debugging! 🎉**

For more info: See [PHASE4_WEEK3-4_COMPLETE.md](./PHASE4_WEEK3-4_COMPLETE.md)
