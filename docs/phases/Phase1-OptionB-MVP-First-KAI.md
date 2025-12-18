# 🔧 PHASE 1 OPTION B: KAI'S WORK (Backend Implementation)

> **Role:** Backend Developer - Implements ALL business logic, algorithms, parsers, tools, and data processing
> **Responsibility:** No UI work - focus purely on implementation

---

## 🔧 Prerequisites & Environment Setup (Day 0 - Kai's Setup)

> **Your Role:** Set up backend development environment, LLM infrastructure, and testing tools.

---

### 📦 Required Manual Installations

**Priority 1: Core Backend Tools**

1. **Node.js 18+ LTS**
   - Download: https://nodejs.org/
   - Choose LTS (Long Term Support) version
   - Verify: `node --version` (should show v18+)
   - **Why:** Required for TypeScript backend development

2. **Ollama** (Your Primary Tool!)
   - Download: https://ollama.ai/download
   - Windows: Run installer, it will auto-start as a service
   - Verify: `ollama --version`
   - **Why:** Local LLM inference server - your main backend service

3. **Visual Studio Code**
   - Download: https://code.visualstudio.com/
   - Verify: `code --version`
   - **Why:** IDE for backend development

4. **Git for Windows**
   - Download: https://git-scm.com/download/win
   - During install: Choose "Git from command line and 3rd-party software"
   - Verify: `git --version`
   - **Why:** Version control and collaboration with Sokchea

**Priority 2: Database Tools (For Chunk 3+)**

5. **Docker Desktop** (Install before Week 4)
   - Download: https://www.docker.com/products/docker-desktop
   - Requires: Windows 10/11 Pro, Enterprise, or Education
   - Alternative: Install WSL2 if on Windows Home
   - **Why:** Run ChromaDB container for vector database
   - **Note:** Can skip for now, install before Chunk 3

**Priority 3: Optional Tools**

6. **Postman** (Recommended)
   - Download: https://www.postman.com/downloads/
   - **Why:** Test Ollama API and ChromaDB endpoints

7. **DB Browser for SQLite** (Optional, for debugging)
   - Download: https://sqlitebrowser.org/dl/
   - **Why:** Inspect ChromaDB data if needed

---

### ⌨️ Terminal-Based Setup

**Step 1: Verify Core Installations**
```bash
# Open PowerShell or Command Prompt
node --version
# Expected: v18.x.x or higher ✅

npm --version
# Expected: v9.x.x or higher ✅

git --version
# Expected: git version 2.x ✅

ollama --version
# Expected: ollama version x.x.x ✅
```

**Step 2: Install Global NPM Tools (Backend Development)**
```bash
# TypeScript Compiler
npm install -g typescript

# TS-Node - Run TypeScript directly
npm install -g ts-node

# Nodemon - Auto-restart on file changes
npm install -g nodemon

# Jest - Testing framework
npm install -g jest

# ESLint - Code quality
npm install -g eslint

# Verify installations
tsc --version
# Expected: 5.x.x ✅

ts-node --version
# Expected: v10.x.x ✅

nodemon --version
# Expected: 3.x.x ✅

jest --version
# Expected: 29.x.x ✅
```

**Step 3: Download and Test Ollama Model (CRITICAL!)**
```bash
# This is your main LLM - 5GB download, may take 10-30 minutes
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# Verify model is downloaded
ollama list
# Expected: Should show hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest with size ~5GB ✅

# Test model interactively
ollama run hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
# Type: "Write a hello world function in Kotlin"
# Should generate Kotlin code ✅
# Press Ctrl+D or type /bye to exit
```

**Step 4: Test Ollama API (Your Backend Interface)**
```bash
# Ensure Ollama server is running
ollama serve
# Should say "Listening on 127.0.0.1:11434" or already running

# In a new terminal, test API endpoint
curl http://localhost:11434/api/tags
# Expected: JSON response with list of models ✅

# Test generation endpoint (the one you'll use most)
curl http://localhost:11434/api/generate -d '{
  "model": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest",
  "prompt": "Explain NullPointerException in Kotlin",
  "stream": false
}'
# Expected: JSON response with generated text ✅
```

**Step 5: Install VS Code Extensions (Backend Focus)**
```bash
# ESLint
code --install-extension dbaeumer.vscode-eslint

# TypeScript
code --install-extension ms-vscode.vscode-typescript-next

# Jest Test Explorer
code --install-extension kavod-io.vscode-jest-test-adapter

# REST Client (for testing APIs)
code --install-extension humao.rest-client

# Error Lens
code --install-extension usernamehw.errorlens

# GitLens
code --install-extension eamodio.gitlens

# Verify
code --list-extensions
```

---

### ✅ Kai's Validation Checklist

**Run these commands to verify your backend setup:**

```bash
# 1. Node.js ecosystem
node --version && npm --version && tsc --version
# ✅ Should show all versions

# 2. Ollama installed
ollama --version
# ✅ Should show ollama version

# 3. Ollama model downloaded
ollama list
# ✅ Should show hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest (~5GB)

# 4. Ollama server running
curl http://localhost:11434/api/tags
# ✅ Should return JSON with models

# 5. Git configured
git --version
# ✅ Should show git version

# 6. VS Code command available
code --version
# ✅ Should show VS Code version

# 7. Testing tools
jest --version && ts-node --version
# ✅ Should show both versions
```

**All checks passed?** ✅ You're ready for Day 1!

---

### 🧪 Test Ollama Integration (Quick Backend Test)

**Create a test script to verify Ollama is working:**

```bash
# Create test directory
mkdir ollama-test
cd ollama-test

# Initialize npm project
npm init -y

# Install node-fetch
npm install node-fetch

# Create test file: test.mjs
echo "import fetch from 'node-fetch'; (async () => { const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest', prompt: 'Hello', stream: false }) }); console.log(await res.json()); })();" > test.mjs

# Run test
node test.mjs
# ✅ Should print JSON with generated response

# Cleanup
cd ..
rmdir /s ollama-test
```

**Alternative: Test with REST Client in VS Code**

1. Create file: `ollama-test.http`
```http
### Test Ollama API
POST http://localhost:11434/api/generate
Content-Type: application/json

{
  "model": "hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest",
  "prompt": "Explain NullPointerException in Kotlin",
  "stream": false
}
```

2. Click "Send Request" above the POST line
3. ✅ Should show response in new tab

---

### 🚨 Common Issues & Solutions (Kai-Specific)

**Issue 1: Ollama model download is very slow**
```bash
# Solution: Download will be ~5GB, can take 10-60 minutes
# Check download progress:
ollama list
# Shows partial download size

# If stuck, cancel and retry:
# Ctrl+C to cancel
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
```

**Issue 2: `ollama: command not found`**
```bash
# Solution 1: Restart terminal after Ollama installation

# Solution 2: Check if Ollama service is running
# Windows: Open Task Manager → Services → Look for "Ollama"

# Solution 3: Add to PATH manually
# Default install location: C:\Users\YourName\AppData\Local\Programs\Ollama
# Add to PATH in Environment Variables
```

**Issue 3: Ollama API not responding**
```bash
# Check if server is running
curl http://localhost:11434/api/tags

# If fails, start manually:
ollama serve
# Should start server on port 11434

# Check Windows Firewall:
# Allow Ollama through firewall if prompted
```

**Issue 4: Ollama model generation is slow**
```bash
# This is normal for CPU-only inference
# Expected: 15-20s per iteration on CPU
# Expected: 4-6s per iteration on GPU (RTX 3070 Ti)

# Check GPU usage:
# Task Manager → Performance → GPU
# Should show GPU utilization if using GPU

# To force CPU mode (testing):
OLLAMA_COMPUTE_UNIT=cpu ollama run hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
```

**Issue 5: npm install fails with permission errors**
```bash
# Solution: Run as administrator OR fix npm permissions

# Fix npm global directory:
npm config set prefix "C:\Users\YourName\AppData\Roaming\npm"

# Then retry:
npm install -g typescript ts-node
```

**Issue 6: Docker Desktop requires Windows Pro**
```bash
# Solution: Install WSL2 on Windows Home
# 1. Enable WSL:
wsl --install

# 2. Install Ubuntu from Microsoft Store

# 3. Install Docker Desktop with WSL2 backend

# Note: This is only needed for Chunk 3 (Week 4)
# Skip for now if issues, revisit later
```

---

### ⏱️ Kai's Setup Time Estimate

| Task | Time | Priority | Notes |
|------|------|----------|-------|
| Download & install software | 30-60min | 🔥 Critical | Node, Ollama, Git, VS Code |
| Terminal setup (npm packages) | 15-30min | 🔥 Critical | TypeScript, Jest, etc. |
| Download Ollama model (5GB) | 10-60min | 🔥 Critical | Depends on internet speed |
| Test Ollama API | 15-30min | 🔥 Critical | Verify everything works |
| VS Code extensions | 10-15min | 🟡 Medium | Improves dev experience |
| Docker setup (optional) | 30-60min | 🟢 Low | Only needed in Week 4 |
| **Total (without Docker)** | **1.5-3h** | **Do before Day 1** | |
| **Total (with Docker)** | **2-4h** | **Can defer Docker** | |

---

### 📚 Recommended Reading (Before Day 1)

**Essential (1-2 hours):**
- Ollama API Documentation: https://github.com/ollama/ollama/blob/main/docs/api.md
  - Read: `/api/generate` endpoint (your main API)
  - Read: `/api/chat` endpoint (alternative)
  - Understand: `stream` parameter (true vs false)

- TypeScript for Backend: https://www.typescriptlang.org/docs/handbook/intro.html
  - Focus: Interfaces, Types, Async/Await

**Optional (if time permits):**
- Jest Testing: https://jestjs.io/docs/getting-started
- Prompt Engineering: https://platform.openai.com/docs/guides/prompt-engineering
  - Applicable to Ollama models too

---

### 🤝 Coordination with Sokchea

**Before Day 1, sync with Sokchea to ensure:**
- [ ] You have Ollama running and responding
- [ ] You can demonstrate model generation
- [ ] Sokchea has VS Code extension generator working
- [ ] Both have Git configured (username, email)
- [ ] Agree on project structure and naming
- [ ] Both can clone/create shared Git repository

**Quick sync command to verify both setups:**
```bash
# Kai runs (your checks):
ollama list && node --version && tsc --version
# Expected: Shows hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest, Node v18+, TypeScript v5+ ✅

# Sokchea should also run (his checks):
yo --version && code --version
# Expected: Shows Yeoman and VS Code versions ✅
```

**Test integration point:**
```typescript
// Kai creates simple test script:
// File: test-ollama.ts

import fetch from 'node-fetch';

const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    prompt: 'Hello from Kai',
    stream: false
  })
});

const data = await response.json();
console.log('Ollama response:', data.response);

// Run with:
// ts-node test-ollama.ts
// ✅ Should print generated text

// Sokchea will call this from extension - verify it works!
```

---

### 🎯 Performance Expectations (Your Hardware)

**Your Setup: RTX 3070 Ti (8GB VRAM), Ryzen 5 5600x, 32GB RAM**

**Expected Ollama Performance:**
```bash
# Test generation speed:
time ollama run hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest "Write hello world in Kotlin"

# Expected results:
# - GPU mode: 4-6 seconds per iteration ✅ (FAST)
# - CPU mode: 15-20 seconds per iteration 🟡 (ACCEPTABLE)

# Your target: <60s for full RCA (8-10 iterations)
# = 4-6s per iteration × 10 = 40-60s total ✅
```

**Verify GPU is being used:**
```bash
# While running model, check:
# Task Manager → Performance → GPU
# Should show:
# - GPU utilization: 60-90%
# - Dedicated GPU memory: 4-5GB used
# - GPU Engine: "Compute_0" active
```

**If CPU-only (slower):**
```bash
# Check NVIDIA drivers:
nvidia-smi
# Should show GPU and CUDA version

# If nvidia-smi fails:
# Download drivers: https://www.nvidia.com/download/index.aspx
# Select: RTX 3070 Ti → Windows → Download
```

---

### ✅ Ready for Day 1?

**Checklist before starting Chunk 1.1:**
- [ ] Node.js 18+ installed and verified
- [ ] Ollama installed and service running
- [ ] hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest model downloaded (~5GB)
- [ ] Ollama API responding to test requests
- [ ] TypeScript, ts-node, Jest installed globally
- [ ] VS Code with backend extensions installed
- [ ] Git installed and configured
- [ ] Can demonstrate model generation (<10s)
- [ ] GPU acceleration working (optional but recommended)
- [ ] Synced with Sokchea on setup status

**All checked?** ✅ Start Day 1 - Ollama Client Implementation!

---

## Overview

**What Kai Does:**
- ✅ Implements all business logic and algorithms
- ✅ Creates all parsers, tools, and analyzers
- ✅ Builds LLM integration and agent reasoning
- ✅ Implements database and caching systems
- ✅ Writes all backend unit tests
- ✅ Optimizes performance and accuracy

**What Kai Does NOT Do:**
- ❌ UI/UX design
- ❌ VS Code extension API integration (Sokchea handles)
- ❌ Webview HTML/CSS
- ❌ User-facing documentation (Sokchea handles)

---

## 🎯 Core Development Principles

### 1. **Code Quality First**
- Write self-documenting code with clear naming
- Document WHY, not WHAT (code shows what)
- Keep functions small (<50 lines ideal)
- Single Responsibility Principle (SRP)
- DRY (Don't Repeat Yourself)

### 2. **Error Handling Philosophy**
- **Never swallow errors silently**
- Always provide context in error messages
- Use typed errors for different failure modes
- Implement graceful degradation
- Log errors with structured data

### 3. **Testing Mindset**
- Write testable code (dependency injection)
- Test behavior, not implementation
- Cover happy path + edge cases + error paths
- Use descriptive test names (`it('should return null when file not found')`)
- Mock external dependencies (Ollama, ChromaDB, filesystem)

### 4. **Performance Awareness**
- Profile before optimizing
- Measure actual impact (don't guess)
- Cache aggressively (but invalidate correctly)
- Use async/await properly (avoid blocking)
- Batch operations when possible

### 5. **Security Mindset**
- **Validate all inputs** (never trust LLM output)
- Sanitize file paths (prevent directory traversal)
- Handle sensitive data properly (API keys, tokens)
- Implement rate limiting for LLM calls
- Prevent prompt injection attacks

---

## 🛡️ Best Practices & Patterns

### Error Handling Strategy

#### Pattern 1: Typed Errors
```typescript
// Define specific error types for different failure modes
export class ParsingError extends Error {
  constructor(
    message: string,
    public readonly errorText: string,
    public readonly language: string
  ) {
    super(message);
    this.name = 'ParsingError';
  }
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class AnalysisTimeoutError extends Error {
  constructor(
    message: string,
    public readonly iteration: number,
    public readonly maxIterations: number
  ) {
    super(message);
    this.name = 'AnalysisTimeoutError';
  }
}
```

#### Pattern 2: Error Recovery with Retry Logic
```typescript
// Implement exponential backoff for transient failures
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries: number;
      initialDelay: number;
      maxDelay: number;
      retryableErrors?: string[];
    }
  ): Promise<T> {
    let lastError: Error;
    let delay = options.initialDelay;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        const isRetryable = !options.retryableErrors ||
          options.retryableErrors.includes(error.name);
        
        if (!isRetryable || attempt === options.maxRetries) {
          throw error;
        }
        
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
        
        // Exponential backoff with jitter
        delay = Math.min(delay * 2, options.maxDelay);
        delay += Math.random() * 100; // Add jitter
      }
    }
    
    throw lastError!;
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage Example
const llmResponse = await RetryHandler.withRetry(
  () => ollamaClient.generate(prompt),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    retryableErrors: ['LLMError', 'NetworkError']
  }
);
```

#### Pattern 3: Circuit Breaker for External Services
```typescript
// Prevent cascading failures
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  
  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 300000 // 5 minutes
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }
    
    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(`Circuit breaker opened after ${this.failureCount} failures`);
    }
  }
  
  private reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log('Circuit breaker reset to CLOSED');
  }
}

// Usage
const chromaBreaker = new CircuitBreaker(5, 60000, 300000);
const result = await chromaBreaker.execute(() => chromaDB.query(...));
```

### Input Validation & Sanitization

#### Pattern 4: Comprehensive Input Validation
```typescript
// Always validate inputs before processing
export class InputValidator {
  static validateParsedError(error: any): asserts error is ParsedError {
    if (!error || typeof error !== 'object') {
      throw new ValidationError('Invalid error object');
    }
    
    if (!error.type || typeof error.type !== 'string') {
      throw new ValidationError('Error type is required');
    }
    
    if (!error.message || typeof error.message !== 'string') {
      throw new ValidationError('Error message is required');
    }
    
    if (!error.filePath || typeof error.filePath !== 'string') {
      throw new ValidationError('File path is required');
    }
    
    // Sanitize file path to prevent directory traversal
    if (error.filePath.includes('..') || error.filePath.includes('~')) {
      throw new ValidationError('Invalid file path: directory traversal detected');
    }
    
    if (typeof error.line !== 'number' || error.line < 0) {
      throw new ValidationError('Line number must be a positive number');
    }
    
    const validLanguages = ['kotlin', 'java', 'xml', 'gradle'];
    if (!validLanguages.includes(error.language)) {
      throw new ValidationError(`Unsupported language: ${error.language}`);
    }
  }
  
  static sanitizeLLMOutput(output: string): string {
    // Remove potential prompt injection patterns
    let sanitized = output
      .replace(/ignore (previous|all) (instructions|rules)/gi, '[REDACTED]')
      .replace(/system:/gi, '[REDACTED]')
      .replace(/\<\|endoftext\|\>/g, '')
      .slice(0, 50000); // Limit output size
    
    return sanitized.trim();
  }
  
  static validateFilePath(filePath: string, workspaceRoot: string): string {
    // Ensure file is within workspace
    const resolvedPath = path.resolve(workspaceRoot, filePath);
    
    if (!resolvedPath.startsWith(workspaceRoot)) {
      throw new ValidationError('File path outside workspace');
    }
    
    return resolvedPath;
  }
}
```

### Logging & Observability

#### Pattern 5: Structured Logging
```typescript
// Implement structured logging for better debugging
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = LogLevel.INFO;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, {
      ...data,
      error: error?.message,
      stack: error?.stack
    });
  }
  
  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (level < this.minLevel) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...data
    };
    
    const logString = JSON.stringify(logEntry);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      default:
        console.log(logString);
    }
  }
}

// Usage
const logger = Logger.getInstance();
logger.info('Starting RCA analysis', { errorType: 'lateinit', iteration: 1 });
logger.error('LLM request failed', error, { attempt: 3, maxAttempts: 5 });
```

### Async/Await Best Practices

#### Pattern 6: Proper Async Error Handling
```typescript
// WRONG: Unhandled promise rejection
async function badExample() {
  const result = await someOperation(); // No try-catch!
  return result;
}

// CORRECT: Proper error handling
async function goodExample(): Promise<Result> {
  try {
    const result = await someOperation();
    return result;
  } catch (error) {
    logger.error('Operation failed', error as Error);
    throw new OperationError('Failed to complete operation', { cause: error });
  }
}

// CORRECT: Multiple async operations with error handling
async function multipleOperations(): Promise<void> {
  const logger = Logger.getInstance();
  
  try {
    // Parallel execution for independent operations
    const [file1, file2, file3] = await Promise.all([
      readFile('path1'),
      readFile('path2'),
      readFile('path3')
    ]);
    
    logger.info('All files read successfully');
    
    // Sequential execution when dependent
    const parsed = await parseFiles([file1, file2, file3]);
    const analyzed = await analyzeData(parsed);
    
    logger.info('Analysis complete', { resultCount: analyzed.length });
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      logger.warn('Some files missing, continuing with available data');
      // Implement fallback logic
    } else {
      logger.error('Critical error in multipleOperations', error as Error);
      throw error;
    }
  }
}
```

#### Pattern 7: Timeout Handling
```typescript
// Implement timeout for long-running operations
export class AsyncUtils {
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new TimeoutError(errorMessage, timeoutMs));
      }, timeoutMs);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }
  
  static async allSettledWithTimeout<T>(
    promises: Promise<T>[],
    timeoutMs: number
  ): Promise<PromiseSettledResult<T>[]> {
    const wrappedPromises = promises.map(p =>
      this.withTimeout(p, timeoutMs).catch(error => ({ error }))
    );
    
    const results = await Promise.allSettled(wrappedPromises);
    return results;
  }
}

// Usage
const llmResponse = await AsyncUtils.withTimeout(
  ollamaClient.generate(prompt),
  90000, // 90 seconds
  'LLM generation timed out after 90s'
);
```

### Memory Management

#### Pattern 8: Prevent Memory Leaks
```typescript
// Resource cleanup and memory management
export class ResourceManager {
  private resources: Set<Disposable> = new Set();
  
  register(resource: Disposable): void {
    this.resources.add(resource);
  }
  
  async dispose(): Promise<void> {
    const disposePromises = Array.from(this.resources).map(r => r.dispose());
    await Promise.allSettled(disposePromises);
    this.resources.clear();
  }
}

export interface Disposable {
  dispose(): Promise<void> | void;
}

// Example: Clean up agent resources
export class ReactAgent implements Disposable {
  private stream: AgentStateStream;
  private tools: ToolRegistry;
  private resourceManager = new ResourceManager();
  
  constructor() {
    this.stream = new AgentStateStream();
    this.tools = new ToolRegistry();
    
    // Register resources for cleanup
    this.resourceManager.register(this.stream);
    this.resourceManager.register(this.tools);
  }
  
  async dispose(): Promise<void> {
    // Clean up all resources
    await this.resourceManager.dispose();
    
    // Remove event listeners
    this.stream.removeAllListeners();
    
    console.log('ReactAgent resources cleaned up');
  }
}

// Usage
const agent = new ReactAgent();
try {
  await agent.analyze(error);
} finally {
  await agent.dispose(); // Always clean up
}
```

### Testing Strategies

#### Pattern 9: Comprehensive Test Structure
```typescript
// Use descriptive test structure with AAA pattern (Arrange, Act, Assert)
describe('KotlinNPEParser', () => {
  let parser: KotlinNPEParser;
  
  beforeEach(() => {
    // Arrange: Set up test dependencies
    parser = new KotlinNPEParser();
  });
  
  describe('parse()', () => {
    describe('when parsing lateinit error', () => {
      it('should extract property name from error message', () => {
        // Arrange
        const errorText = `
          kotlin.UninitializedPropertyAccessException: 
          lateinit property user has not been initialized
          at com.example.MainActivity.onCreate(MainActivity.kt:45)
        `.trim();
        
        // Act
        const result = parser.parse(errorText);
        
        // Assert
        expect(result).not.toBeNull();
        expect(result?.type).toBe('lateinit');
        expect(result?.metadata?.propertyName).toBe('user');
        expect(result?.filePath).toBe('MainActivity.kt');
        expect(result?.line).toBe(45);
      });
      
      it('should handle missing file path gracefully', () => {
        // Arrange
        const errorText = 'lateinit property user has not been initialized';
        
        // Act
        const result = parser.parse(errorText);
        
        // Assert
        expect(result).not.toBeNull();
        expect(result?.filePath).toBe('unknown');
        expect(result?.line).toBe(0);
      });
    });
    
    describe('when parsing non-Kotlin error', () => {
      it('should return null', () => {
        // Arrange
        const errorText = 'TypeError: Cannot read property of undefined';
        
        // Act
        const result = parser.parse(errorText);
        
        // Assert
        expect(result).toBeNull();
      });
    });
    
    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(parser.parse('')).toBeNull();
      });
      
      it('should handle multiline stack traces', () => {
        const errorText = `
          NullPointerException
          at MainActivity.kt:45
          at Fragment.kt:23
          at Activity.kt:12
        `.trim();
        
        const result = parser.parse(errorText);
        expect(result?.line).toBe(45); // First occurrence
      });
      
      it('should handle very long error messages (>10K chars)', () => {
        const longError = 'NullPointerException'.repeat(1000);
        expect(() => parser.parse(longError)).not.toThrow();
      });
    });
  });
});
```

#### Pattern 10: Mocking External Dependencies
```typescript
// Mock external services for unit tests
jest.mock('../llm/OllamaClient');
jest.mock('../db/ChromaDBClient');

describe('ReactAgent Integration', () => {
  let agent: ReactAgent;
  let mockLLM: jest.Mocked<OllamaClient>;
  let mockDB: jest.Mocked<ChromaDBClient>;
  
  beforeEach(() => {
    // Create mock instances
    mockLLM = {
      generate: jest.fn(),
    } as any;
    
    mockDB = {
      addRCA: jest.fn(),
      searchSimilar: jest.fn(),
    } as any;
    
    // Inject mocks
    agent = new ReactAgent(mockLLM, mockDB);
  });
  
  it('should call LLM multiple times during analysis', async () => {
    // Arrange
    mockLLM.generate
      .mockResolvedValueOnce('Hypothesis: lateinit property not initialized')
      .mockResolvedValueOnce('Analysis: Need to check initialization')
      .mockResolvedValueOnce(JSON.stringify({
        rootCause: 'Property accessed before initialization',
        fixGuidelines: ['Initialize in onCreate()'],
        confidence: 0.9
      }));
    
    const error: ParsedError = {
      type: 'lateinit',
      message: 'lateinit property user has not been initialized',
      filePath: 'MainActivity.kt',
      line: 45,
      language: 'kotlin'
    };
    
    // Act
    const result = await agent.analyze(error);
    
    // Assert
    expect(mockLLM.generate).toHaveBeenCalledTimes(3);
    expect(result.rootCause).toContain('Property accessed before initialization');
    expect(result.confidence).toBe(0.9);
  });
  
  it('should handle LLM errors gracefully', async () => {
    // Arrange
    mockLLM.generate.mockRejectedValue(new Error('LLM connection failed'));
    
    const error: ParsedError = { /* ... */ };
    
    // Act & Assert
    await expect(agent.analyze(error)).rejects.toThrow('LLM connection failed');
  });
});
```

### Performance Optimization

#### Pattern 11: Caching Strategy
```typescript
// Implement multi-level caching
export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private diskCache: DiskCache;
  
  constructor(diskCachePath: string) {
    this.diskCache = new DiskCache(diskCachePath);
  }
  
  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.value as T;
    }
    
    // L2: Disk cache (slower but persistent)
    const diskResult = await this.diskCache.get<T>(key);
    if (diskResult) {
      // Promote to memory cache
      this.memoryCache.set(key, {
        value: diskResult,
        expires: Date.now() + 24 * 60 * 60 * 1000
      });
      return diskResult;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    const entry: CacheEntry = {
      value,
      expires: Date.now() + ttl
    };
    
    // Write to both levels
    this.memoryCache.set(key, entry);
    await this.diskCache.set(key, value, ttl);
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expires;
  }
  
  // Automatic cleanup of expired entries
  startCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
        }
      }
    }, intervalMs);
  }
}
```

#### Pattern 12: Batch Processing
```typescript
// Process multiple items efficiently
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private processing = false;
  
  constructor(
    private batchSize: number,
    private processor: (batch: T[]) => Promise<R[]>,
    private flushInterval: number = 1000
  ) {
    // Auto-flush periodically
    setInterval(() => this.flush(), flushInterval);
  }
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        item,
        resolve,
        reject
      } as any);
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      }
    });
  }
  
  private async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const items = batch.map(b => b.item);
      const results = await this.processor(items);
      
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    } finally {
      this.processing = false;
    }
  }
}

// Usage: Batch embedding generation
const embedder = new EmbeddingService();
const batchEmbedder = new BatchProcessor(
  10, // Process 10 at a time
  (texts) => embedder.embedBatch(texts),
  1000 // Flush every second
);

const embedding1 = await batchEmbedder.add('error message 1');
const embedding2 = await batchEmbedder.add('error message 2');
// ... automatically batched for efficiency
```

---

## CHUNK 1: MVP Backend (Weeks 1-2)

### CHUNK 1.1: Ollama Client & Types (Days 1-3, ~24h) ✅ COMPLETE

**Goal:** Create foundation for LLM communication

**Status:** ✅ Completed December 17, 2025

**Tasks:**
- [x] `src/llm/OllamaClient.ts`
  - [x] Connection to Ollama server (http://localhost:11434)
  - [x] `generate()` method for LLM inference
  - [x] Streaming support (optional for MVP) - Deferred
  - [x] Error handling for connection failures
  - [x] Timeout handling (90s default)
  - [x] Model selection (hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest default)
  - [x] Retry logic with exponential backoff

- [x] `src/types.ts`
  - [x] `ParsedError` interface (type, message, filePath, line, language)
  - [x] `RCAResult` interface (error, rootCause, fixGuidelines, confidence)
  - [x] `AgentState` interface (iteration, thoughts, actions, observations)
  - [x] `ToolCall` interface (tool, parameters, timestamp)
  - [x] Error classes: `LLMError`, `AnalysisTimeoutError`, `ValidationError`

**Implementation Highlights:**
- Added health checks via `/api/tags` endpoint
- Implemented `isHealthy()` and `listModels()` helper methods
- Fetch with timeout support (AbortController)
- Comprehensive JSDoc documentation

**Tests:**
- [x] Connection test (Ollama responds) - 100% pass
- [x] Generate test (returns valid text) - 100% pass
- [x] Error handling test (network failure) - 100% pass
- [x] Timeout test (handles slow responses) - 100% pass
- [x] Retry logic test (exponential backoff) - 100% pass

**Coverage:** 95%

---

### CHUNK 1.2: Kotlin NPE Parser (Days 4-6, ~24h) ✅ COMPLETE

**Goal:** Parse Kotlin NullPointerException errors

**Status:** ✅ Completed December 17, 2025

**Tasks:**
- [x] `src/utils/KotlinNPEParser.ts`
  - [x] Regex patterns for NPE errors
  - [x] Regex patterns for lateinit errors
  - [x] Stack trace parsing
  - [x] File path extraction
  - [x] Line number extraction
  - [x] Normalize error messages
  - [x] Static helper methods

**Implementation Highlights:**
- Supports both `lateinit property X has not been initialized` and `UninitializedPropertyAccessException` formats
- Extracts full stack trace with function names and class names
- Handles multiline stack traces with multiple .kt files
- Graceful degradation (returns `unknown` file, line 0 if no match)
- Quick check method: `isKotlinError()` for pre-filtering

**Tests:**
- [x] Parse lateinit error (extract property name, file, line) - 100% pass
- [x] Parse NPE error (extract file, line) - 100% pass
- [x] Handle multiline stack traces - 100% pass
- [x] Handle missing file path gracefully - 100% pass
- [x] Return null for non-Kotlin errors - 100% pass
- [x] Edge cases (empty, null, very long input) - 100% pass

**Coverage:** 94%

---

### CHUNK 1.3: Minimal ReAct Agent (Days 7-9, ~24h) ✅ COMPLETE

**Goal:** 3-iteration reasoning loop (no tools yet)

**Status:** ✅ Completed December 17, 2025

**Tasks:**
- [x] `src/agent/MinimalReactAgent.ts`
  - [x] 3-iteration loop structure
  - [x] Thought generation (hypothesis about error)
  - [x] Action placeholder (will add tools later)
  - [x] Observation placeholder
  - [x] Structured JSON output parsing
  - [x] Timeout handling (90s)
  - [x] Error handling (malformed LLM output)
  - [x] JSON extraction with regex (handles extra text)

**Implementation Highlights:**
- Iteration 1: Initial hypothesis
- Iteration 2: Deeper analysis referencing previous thought
- Iteration 3: Final conclusion with JSON output
- Robust JSON parsing: Extracts JSON even if LLM adds extra text
- Fallback behavior: If JSON invalid, uses raw output with low confidence (0.3)
- Timeout checks between iterations
- Propagates LLM errors up the stack

**Tests:**
- [x] Agent completes 3 iterations - 100% pass
- [x] Returns structured result - 100% pass
- [x] Handles LLM timeout - 100% pass
- [x] Handles malformed JSON output - 100% pass
- [x] Parses JSON with extra text around it - 100% pass
- [x] Generates reasonable hypothesis for lateinit error - 100% pass
- [x] Includes error metadata in prompts - 100% pass

**Coverage:** 88%

---

**Implementation Example:**
```typescript
// src/llm/OllamaClient.ts
export class OllamaClient {
  private baseUrl: string = 'http://localhost:11434';
  private model: string = 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest';
  
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2000,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response;
  }
}
```

**Tests:**
- [ ] Connection test (Ollama responds)
- [ ] Generate test (returns valid text)
- [ ] Error handling test (network failure)
- [ ] Timeout test (handles slow responses)

---

### CHUNK 1.2: Kotlin NPE Parser (Days 4-6, ~24h)

**Goal:** Parse Kotlin NullPointerException errors

**Tasks:**
- [ ] `src/utils/KotlinNPEParser.ts`
  - [ ] Regex patterns for NPE errors
  - [ ] Regex patterns for lateinit errors
  - [ ] Stack trace parsing
  - [ ] File path extraction
  - [ ] Line number extraction
  - [ ] Normalize error messages

**Implementation Example:**
```typescript
// src/utils/KotlinNPEParser.ts
export class KotlinNPEParser {
  parse(errorText: string): ParsedError | null {
    // Match: "kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized"
    const lateinitMatch = errorText.match(/lateinit property (\w+) has not been initialized/);
    if (lateinitMatch) {
      const property = lateinitMatch[1];
      const fileMatch = errorText.match(/at (.+\.kt):(\d+)/);
      return {
        type: 'lateinit',
        message: errorText.trim(),
        filePath: fileMatch?.[1] || 'unknown',
        line: parseInt(fileMatch?.[2] || '0'),
        language: 'kotlin',
        metadata: { propertyName: property },
      };
    }
    
    // Match: "NullPointerException at MyClass.kt:42"
    const npeMatch = errorText.match(/NullPointerException.*at (.+\.kt):(\d+)/);
    if (npeMatch) {
      return {
        type: 'npe',
        message: errorText.trim(),
        filePath: npeMatch[1],
        line: parseInt(npeMatch[2]),
        language: 'kotlin',
      };
    }
    
    return null;
  }
}
```

**Tests:**
- [ ] Parse lateinit error (extract property name, file, line)
- [ ] Parse NPE error (extract file, line)
- [ ] Handle multiline stack traces
- [ ] Handle missing file path gracefully
- [ ] Return null for non-Kotlin errors

---

### CHUNK 1.3: Minimal ReAct Agent (Days 7-9, ~24h)

**Goal:** 3-iteration reasoning loop (no tools yet)

**Tasks:**
- [ ] `src/agent/MinimalReactAgent.ts`
  - [ ] 3-iteration loop structure
  - [ ] Thought generation (hypothesis about error)
  - [ ] Action placeholder (will add tools later)
  - [ ] Observation placeholder
  - [ ] Structured JSON output parsing
  - [ ] Timeout handling (90s)
  - [ ] Error handling (malformed LLM output)

**Implementation Example:**
```typescript
// src/agent/MinimalReactAgent.ts
export class MinimalReactAgent {
  private maxIterations = 3;
  
  constructor(private llm: OllamaClient) {}
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    const context = {
      error: error.message,
      file: error.filePath,
      line: error.line,
      type: error.type,
    };
    
    let thought = '';
    
    // Iteration 1: Initial hypothesis
    const prompt1 = this.buildPrompt(context, 1);
    thought = await this.llm.generate(prompt1);
    
    // Iteration 2: Deeper analysis
    const prompt2 = this.buildPrompt(context, 2, thought);
    const analysis = await this.llm.generate(prompt2);
    
    // Iteration 3: Final conclusion
    const prompt3 = this.buildFinalPrompt(context, thought, analysis);
    const finalOutput = await this.llm.generate(prompt3);
    
    return this.parseOutput(finalOutput, error);
  }
  
  private buildPrompt(context: any, iteration: number, previousThought?: string): string {
    return `You are debugging a Kotlin error. This is iteration ${iteration}/3.

ERROR:
Type: ${context.type}
Message: ${context.error}
File: ${context.file}
Line: ${context.line}

${previousThought ? `Previous thought: ${previousThought}\n\n` : ''}

Generate a hypothesis about what caused this error. Be specific and reference Kotlin concepts.`;
  }
  
  private buildFinalPrompt(context: any, thought: string, analysis: string): string {
    return `Based on your analysis, provide the final root cause and fix guidelines.

ERROR: ${context.error}
YOUR HYPOTHESIS: ${thought}
YOUR ANALYSIS: ${analysis}

Respond in JSON format:
{
  "rootCause": "Clear explanation of what went wrong",
  "fixGuidelines": ["Step 1", "Step 2", "Step 3"],
  "confidence": 0.8
}`;
  }
  
  private parseOutput(output: string, error: ParsedError): RCAResult {
    try {
      const parsed = JSON.parse(output);
      return {
        error: error.message,
        rootCause: parsed.rootCause,
        fixGuidelines: parsed.fixGuidelines,
        confidence: parsed.confidence || 0.5,
      };
    } catch (e) {
      // Fallback if JSON parsing fails
      return {
        error: error.message,
        rootCause: output,
        fixGuidelines: ['Review the error and code context'],
        confidence: 0.3,
      };
    }
  }
}
```

**Tests:**
- [ ] Agent completes 3 iterations
- [ ] Returns structured result
- [ ] Handles LLM timeout
- [ ] Handles malformed JSON output
- [ ] Generates reasonable hypothesis for lateinit error

---

### CHUNK 1.4: File Reading Tool (Days 10-12, ~24h)

**Goal:** Read code at error location to improve analysis

**Tasks:**
- [ ] `src/tools/ReadFileTool.ts`
  - [ ] Read file using VS Code filesystem API
  - [ ] Extract 50 lines around error line (±25)
  - [ ] Handle file not found errors
  - [ ] Handle binary files (skip or error)
  - [ ] UTF-8 encoding handling
  - [ ] Large file performance (>10K lines)

- [ ] Update `MinimalReactAgent.ts`
  - [ ] Integrate ReadFileTool into workflow
  - [ ] Pass file content to LLM in prompts
  - [ ] Handle file reading failures gracefully

**Implementation Example:**
```typescript
// src/tools/ReadFileTool.ts
import * as vscode from 'vscode';

export class ReadFileTool {
  async execute(filePath: string, errorLine: number): Promise<string> {
    try {
      const uri = vscode.Uri.file(filePath);
      const doc = await vscode.workspace.openTextDocument(uri);
      
      const startLine = Math.max(0, errorLine - 25);
      const endLine = Math.min(doc.lineCount, errorLine + 25);
      
      const range = new vscode.Range(startLine, 0, endLine, 0);
      const content = doc.getText(range);
      
      return `Lines ${startLine}-${endLine} of ${filePath}:\n${content}`;
    } catch (error) {
      return `Error reading file: ${error.message}`;
    }
  }
}

// Update MinimalReactAgent
export class MinimalReactAgent {
  private readFileTool = new ReadFileTool();
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    // ... existing code ...
    
    // NEW: Read file before final analysis
    const fileContent = await this.readFileTool.execute(error.filePath, error.line);
    
    // Include file content in final prompt
    const prompt3 = this.buildFinalPromptWithCode(context, thought, analysis, fileContent);
    // ...
  }
}
```

**Tests:**
- [ ] Read file successfully (50 lines)
- [ ] Handle file not found
- [ ] Handle out-of-bounds line numbers
- [ ] Handle small files (<50 lines)
- [ ] Agent includes code context in analysis

---

### CHUNK 1.5: MVP Testing & Refinement (Days 13-14, ~16h)

**Goal:** Validate MVP accuracy and fix bugs

**Tasks:**
- [ ] Create test dataset (10 real Kotlin NPE errors)
- [ ] Run analysis on all test cases
- [ ] Measure accuracy (does root cause make sense?)
- [ ] Fix parser bugs found during testing
- [ ] Optimize prompts for better accuracy
- [ ] Document accuracy metrics

**Tests:**
- [ ] End-to-end test (parse → analyze → result)
- [ ] Accuracy: 6/10 errors analyzed correctly
- [ ] Latency: <90s per analysis
- [ ] No crashes or unhandled exceptions

---

## CHUNK 2: Core Tools Backend (Week 3)

### CHUNK 2.1: Full Error Parser (Days 1-3, ~24h) ✅ COMPLETE

**Goal:** Parse 5+ Kotlin error types

**Status:** ✅ Completed December 18, 2025 - All 109 tests passing

**Tasks:**
- [x] `src/utils/ErrorParser.ts` (188 lines)
  - [x] Router for language-specific parsers
  - [x] Error type detection
  - [x] Singleton pattern with parser registration
  - [x] Automatic fallback to language detection
  
- [x] `src/utils/parsers/KotlinParser.ts` (272 lines)
  - [x] Extend KotlinNPEParser (composition pattern)
  - [x] Unresolved reference errors
  - [x] Type mismatch errors
  - [x] Compilation errors
  - [x] Import errors
  - [x] Supports 6 total error types
  
- [x] `src/utils/parsers/GradleParser.ts` (282 lines)
  - [x] Build failure errors
  - [x] Dependency resolution errors
  - [x] Dependency conflict detection with version extraction
  - [x] Task failure errors
  - [x] Syntax errors in build.gradle
  - [x] Supports 5 error types
  
- [x] `src/utils/LanguageDetector.ts` (188 lines)
  - [x] Detect language from error text (keyword-based)
  - [x] Detect language from file extension
  - [x] Heuristics for ambiguous errors
  - [x] Confidence scoring system
  - [x] Quick check methods (isKotlin, isGradle, isXML, isJava)

**Tests:**
- [x] Parse 6 Kotlin error types correctly (24 tests)
- [x] Parse 5 Gradle error types (24 tests)
- [x] Language detector identifies Kotlin vs Gradle vs XML vs Java (33 tests)
- [x] ErrorParser router functionality (28 tests)
- [x] **109 total unit tests - 100% passing**

**Coverage:** 95%+

**Production Readiness:** ✅ READY FOR CHUNK 2.4

---

### CHUNK 2.2: LSP Integration & Tool Registry (Days 4-5, ~16h) ✅ COMPLETE

**Goal:** Add LSP-powered code analysis tools

**Status:** ✅ Completed December 18, 2025 - 88 tests passing (64 ToolRegistry + 24 LSPTool)

**Tasks:**
- [x] `src/tools/ToolRegistry.ts` (295 lines, 64 tests)
  - [x] Tool registration system
  - [x] Tool discovery (list available tools)
  - [x] Tool execution with error handling
  - [x] Schema validation (Zod 3.22.4)
  
- [x] `src/tools/LSPTool.ts` (260 lines, 24 tests - placeholder implementation)
  - [x] Find function callers (call hierarchy)
  - [x] Find function definition
  - [x] Get symbol information
  - [x] Search workspace symbols
  
- [ ] Update agent to use multiple tools (deferred to Chunk 2.4)
  - [ ] Tool selection logic
  - [ ] Tool execution in agent workflow
  - [ ] Format tool results for LLM

**Implementation Example:**
```typescript
// src/tools/LSPTool.ts
export class LSPTool {
  async findCallers(functionName: string, filePath: string): Promise<string[]> {
    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);
    
    // Find function position
    const text = doc.getText();
    const funcRegex = new RegExp(`fun ${functionName}\\(`);
    const match = funcRegex.exec(text);
    if (!match) return [];
    
    const position = doc.positionAt(match.index);
    
    // Use VS Code LSP API
    const calls = await vscode.commands.executeCommand<vscode.CallHierarchyItem[]>(
      'vscode.prepareCallHierarchy',
      uri,
      position
    );
    
    if (!calls || calls.length === 0) return [];
    
    const incomingCalls = await vscode.commands.executeCommand<vscode.CallHierarchyIncomingCall[]>(
      'vscode.provideIncomingCalls',
      calls[0]
    );
    
    return incomingCalls?.map(call => call.from.name) || [];
  }
}
```

**Tests:**
- [x] Tool registry registers tools (64 tests)
- [x] LSP tool finds callers correctly (24 tests)
- [ ] Agent executes tool successfully (deferred to Chunk 2.4)
- [x] Tool errors handled gracefully

**Coverage:** 95%

**Production Readiness:** ✅ READY FOR CHUNK 2.3

---

### CHUNK 2.3: Prompt Engineering (Days 6-7, ~16h) ✅ COMPLETE

**Goal:** Improve analysis quality with better prompts

**Status:** ✅ Completed December 18, 2025 - 25 tests passing

**Tasks:**
- [x] `src/agent/PromptEngine.ts` (533 lines, 25 tests)
  - [x] System prompts with guidelines
  - [x] Few-shot examples (4 error types: lateinit, NPE, unresolved_reference, type_mismatch)
  - [x] Structured output templates
  - [x] Chain-of-thought prompting
  - [x] JSON extraction and validation
  
- [ ] Update agent to use PromptEngine (deferred to Chunk 2.4)
- [x] Create example library (4 curated RCA examples)
- [ ] A/B test prompts (measure accuracy improvement) (deferred to Chunk 2.4)

**Implementation Example:**
```typescript
// src/agent/PromptEngine.ts
export class PromptEngine {
  getSystemPrompt(): string {
    return `You are an expert Kotlin debugging assistant.

WORKFLOW:
1. Form hypothesis about error cause
2. Use tools to gather evidence (read_file, find_callers)
3. Validate hypothesis with code context
4. Provide clear root cause and fix steps

ANALYSIS RULES:
- Always explain WHY the error happened, not just WHAT it is
- Reference specific code when possible (variable names, function names)
- Provide actionable fix guidelines
- Be concise but thorough

OUTPUT FORMAT: JSON
{
  "thought": "Your reasoning about the error",
  "action": { "tool": "tool_name", "parameters": {...} } or null if done,
  "rootCause": "Clear explanation" (when done),
  "fixGuidelines": ["Step 1", "Step 2"] (when done),
  "confidence": 0.0-1.0 (when done)
}`;
  }
  
  getFewShotExamples(errorType: string): string {
    const examples = {
      lateinit: `
EXAMPLE:
Error: "lateinit property user has not been initialized at UserActivity.kt:45"
Thought: "The lateinit property 'user' is accessed before initialization. Need to check where it should be initialized."
Action: { "tool": "read_file", "parameters": { "filePath": "UserActivity.kt", "line": 45 } }
Observation: "Line 45: val name = user.name // user is lateinit var declared at line 12"
Final Analysis:
{
  "rootCause": "The lateinit property 'user' is declared but never initialized before being accessed. Lateinit properties must be explicitly initialized before first use.",
  "fixGuidelines": [
    "Initialize 'user' in onCreate() or class initialization block",
    "Or check if user is initialized with ::user.isInitialized before accessing",
    "Consider using nullable type (var user: User?) instead of lateinit if initialization timing is uncertain"
  ],
  "confidence": 0.9
}`,
      // ... more examples
    };
    return examples[errorType] || '';
  }
}
```

**Tests:**
- [x] Prompt engine returns valid prompts (25 tests passing)
- [x] Few-shot examples included correctly
- [x] JSON extraction handles various formats
- [x] Response validation catches malformed outputs
- [x] Test with 4+ error types (lateinit, NPE, unresolved_reference, type_mismatch)

**Coverage:** 95%

**Production Readiness:** ✅ READY FOR CHUNK 2.4 (Agent Integration)

---

### CHUNK 2.4: Agent Integration (Days 8-10, ~24h) 🎯 NEXT

**Goal:** Integrate all tools into ReAct agent

**Status:** 🎯 Ready to Start (Prerequisites Complete)

**Prerequisites:** ✅ All Complete
- ✅ Chunk 2.1: Error parsers ready
- ✅ Chunk 2.2: Tool registry and LSP tools ready
- ✅ Chunk 2.3: Prompt engine ready
- ✅ Chunk 1.4: ReadFileTool ready
- ✅ Chunk 1.1-1.3: Core agent framework ready

**Tasks:**
- [ ] Update `MinimalReactAgent.ts` to use PromptEngine
  - [ ] Replace hardcoded prompts with PromptEngine.getSystemPrompt()
  - [ ] Add few-shot examples based on error type
  - [ ] Use PromptEngine.buildToolSelectionPrompt()
  - [ ] Implement PromptEngine.extractJSON() for output parsing
  
- [ ] Integrate ToolRegistry into agent
  - [ ] Agent receives ToolRegistry in constructor
  - [ ] Tool selection logic (LLM chooses which tool to use)
  - [ ] Tool execution with error handling
  - [ ] Format tool results for LLM consumption
  - [ ] Handle tool failures gracefully
  
- [ ] Implement dynamic iteration count
  - [ ] Parse "action": null to detect completion
  - [ ] Max iterations = 10 (configurable)
  - [ ] Early termination when LLM signals done
  
- [ ] Add tool context to prompts
  - [ ] List available tools in system prompt
  - [ ] Show tool results in observation phase
  - [ ] Guide LLM to use tools effectively

**Implementation Example:**
```typescript
// Updated MinimalReactAgent.ts
export class MinimalReactAgent {
  private maxIterations = 10;
  
  constructor(
    private llm: OllamaClient,
    private toolRegistry: ToolRegistry,
    private promptEngine: PromptEngine
  ) {}
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    const systemPrompt = this.promptEngine.getSystemPrompt();
    const fewShotExamples = this.promptEngine.getFewShotExamples(error.type);
    const availableTools = this.toolRegistry.listTools();
    
    const thoughts: string[] = [];
    const actions: any[] = [];
    const observations: string[] = [];
    
    for (let i = 0; i < this.maxIterations; i++) {
      // Build iteration prompt
      const iterationPrompt = this.promptEngine.buildIterationPrompt({
        systemPrompt,
        fewShotExamples,
        availableTools,
        error,
        previousThoughts: thoughts,
        previousActions: actions,
        previousObservations: observations,
        iteration: i + 1,
        maxIterations: this.maxIterations
      });
      
      // Get LLM response
      const response = await this.llm.generate(iterationPrompt);
      const parsed = this.promptEngine.extractJSON(response);
      
      thoughts.push(parsed.thought);
      
      // Check if done
      if (!parsed.action || parsed.rootCause) {
        return {
          error: error.message,
          rootCause: parsed.rootCause,
          fixGuidelines: parsed.fixGuidelines,
          confidence: parsed.confidence || 0.5,
          iterations: i + 1
        };
      }
      
      // Execute tool
      try {
        const toolResult = await this.toolRegistry.execute(
          parsed.action.tool,
          parsed.action.parameters
        );
        actions.push(parsed.action);
        observations.push(JSON.stringify(toolResult));
      } catch (error) {
        observations.push(`Tool execution failed: ${error.message}`);
      }
    }
    
    // Max iterations reached - force final answer
    const finalPrompt = this.promptEngine.buildFinalPrompt({
      error,
      thoughts,
      observations
    });
    
    const finalResponse = await this.llm.generate(finalPrompt);
    const final = this.promptEngine.extractJSON(finalResponse);
    
    return {
      error: error.message,
      rootCause: final.rootCause || 'Unable to determine root cause',
      fixGuidelines: final.fixGuidelines || ['Review error and code manually'],
      confidence: final.confidence || 0.3,
      iterations: this.maxIterations
    };
  }
}
```

**Tests:**
- [ ] Agent uses PromptEngine for all prompts
- [ ] Agent selects and executes tools correctly
- [ ] Agent terminates early when done
- [ ] Agent handles tool failures gracefully
- [ ] Agent reaches max iterations if needed
- [ ] End-to-end test with real Ollama (full workflow)
- [ ] Compare accuracy vs Chunk 1.5 baseline

**Acceptance Criteria:**
- [ ] All 281 existing tests still pass
- [ ] 15+ new tests for agent integration
- [ ] Accuracy improves by 10%+ vs Chunk 1.5 (from 100%)
- [ ] Average latency remains <90s
- [ ] Agent successfully uses 2+ tools per analysis

**Production Readiness Target:** ✅ Ready for Chunk 3.1 (ChromaDB)

---

## CHUNK 3: Database Backend (Weeks 4-5)

### CHUNK 3.1: ChromaDB Setup (Days 1-3, ~24h)

**Goal:** Store and retrieve RCA documents

**Tasks:**
- [ ] `src/db/ChromaDBClient.ts`
  - [ ] Connection to ChromaDB server
  - [ ] Health check and error handling
  - [ ] Collection initialization
  - [ ] Add document method
  - [ ] Document ID generation (UUID)
  - [ ] Metadata storage
  
- [ ] `src/db/schemas/rca-collection.ts`
  - [ ] RCADocument interface
  - [ ] Metadata schema
  - [ ] Validation rules

**Implementation Example:**
```typescript
// src/db/ChromaDBClient.ts
import { ChromaClient, Collection } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';

export interface RCADocument {
  id: string;
  error_message: string;
  error_type: string;
  language: string;
  root_cause: string;
  fix_guidelines: string[];
  confidence: number;
  created_at: number;
  user_validated: boolean;
  quality_score: number;
}

export class ChromaDBClient {
  private client: ChromaClient;
  private collection: Collection;
  
  static async create(): Promise<ChromaDBClient> {
    const instance = new ChromaDBClient();
    instance.client = new ChromaClient({ path: 'http://localhost:8000' });
    
    // Create or get collection
    instance.collection = await instance.client.getOrCreateCollection({
      name: 'rca_solutions',
      metadata: { description: 'Root cause analysis solutions' },
    });
    
    return instance;
  }
  
  async addRCA(rca: Omit<RCADocument, 'id' | 'created_at'>): Promise<string> {
    const id = uuidv4();
    const document: RCADocument = {
      ...rca,
      id,
      created_at: Date.now(),
    };
    
    await this.collection.add({
      ids: [id],
      documents: [JSON.stringify(document)],
      metadatas: [{
        language: rca.language,
        error_type: rca.error_type,
        confidence: rca.confidence,
        quality_score: rca.quality_score,
      }],
    });
    
    return id;
  }
}
```

**Tests:**
- [ ] Connect to ChromaDB successfully
- [ ] Create collection
- [ ] Add document and retrieve it
- [ ] Handle connection failures
- [ ] Validate document schema

---

### CHUNK 3.2: Embedding & Search (Days 4-6, ~24h)

**Goal:** Semantic similarity search for past RCAs

**Tasks:**
- [ ] `src/db/EmbeddingService.ts`
  - [ ] Load sentence-transformers model (all-MiniLM-L6-v2)
  - [ ] Generate embeddings for text
  - [ ] Batch processing for efficiency
  - [ ] Model caching
  
- [ ] Update `ChromaDBClient`
  - [ ] Add embedding to documents
  - [ ] Similarity search method
  - [ ] Filter by metadata (language, error_type)
  - [ ] Rank by relevance + quality score
  
- [ ] `src/db/QualityScorer.ts`
  - [ ] Calculate quality score algorithm
  - [ ] Factors: confidence, user validation, age

**Implementation Example:**
```typescript
// src/db/EmbeddingService.ts
import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';

export class EmbeddingService {
  private model: use.UniversalSentenceEncoder;
  
  static async create(): Promise<EmbeddingService> {
    const instance = new EmbeddingService();
    instance.model = await use.load();
    return instance;
  }
  
  async embed(text: string): Promise<number[]> {
    const embeddings = await this.model.embed([text]);
    const embedding = await embeddings.array();
    return embedding[0];
  }
  
  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings = await this.model.embed(texts);
    return await embeddings.array();
  }
}

// Update ChromaDBClient
export class ChromaDBClient {
  private embedder: EmbeddingService;
  
  async addRCA(rca: Omit<RCADocument, 'id' | 'created_at'>): Promise<string> {
    const id = uuidv4();
    const text = `${rca.error_message} ${rca.root_cause}`;
    const embedding = await this.embedder.embed(text);
    
    await this.collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [JSON.stringify({ ...rca, id, created_at: Date.now() })],
      metadatas: [{ /* ... */ }],
    });
    
    return id;
  }
  
  async searchSimilar(errorMessage: string, limit: number = 5): Promise<RCADocument[]> {
    const embedding = await this.embedder.embed(errorMessage);
    
    const results = await this.collection.query({
      queryEmbeddings: [embedding],
      nResults: limit,
      where: { quality_score: { $gte: 0.5 } }, // Filter low quality
    });
    
    return results.documents[0].map(doc => JSON.parse(doc));
  }
}
```

**Tests:**
- [ ] Generate embedding for text
- [ ] Store RCA with embedding
- [ ] Search returns similar RCAs
- [ ] Filter by language works
- [ ] Quality score affects ranking

---

### CHUNK 3.3: Caching System (Days 7-9, ~24h)

**Goal:** Fast lookups for repeat errors

**Tasks:**
- [ ] `src/cache/ErrorHasher.ts`
  - [ ] SHA-256 hash generation
  - [ ] Normalize error messages
  - [ ] Include file path + line in hash
  
- [ ] `src/cache/RCACache.ts`
  - [ ] In-memory cache (Map)
  - [ ] TTL management (24 hours)
  - [ ] Cache hit/miss tracking
  - [ ] Automatic cleanup (expired entries)
  - [ ] Cache invalidation on negative feedback
  
- [ ] Update agent to use cache
  - [ ] Check cache before analysis
  - [ ] Store result in cache
  - [ ] Track cache hit rate

**Implementation Example:**
```typescript
// src/cache/ErrorHasher.ts
import * as crypto from 'crypto';

export class ErrorHasher {
  hash(error: ParsedError): string {
    const normalized = this.normalize(error.message);
    const key = `${error.type}:${normalized}:${error.filePath}:${error.line}`;
    return crypto.createHash('sha256').update(key).digest('hex');
  }
  
  private normalize(message: string): string {
    return message
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, 'N') // Replace numbers
      .trim();
  }
}

// src/cache/RCACache.ts
export class RCACache {
  private cache = new Map<string, CacheEntry>();
  private TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  get(hash: string): RCADocument | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(hash);
      return null;
    }
    
    entry.hits++;
    return entry.rca;
  }
  
  set(hash: string, rca: RCADocument): void {
    this.cache.set(hash, {
      rca,
      expires: Date.now() + this.TTL,
      hits: 0,
    });
  }
  
  invalidate(hash: string): void {
    this.cache.delete(hash);
  }
  
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      // Calculate hit rate from tracking
    };
  }
}
```

**Tests:**
- [ ] Hash generates consistent IDs
- [ ] Cache stores and retrieves
- [ ] TTL expiration works
- [ ] Cache invalidation works
- [ ] Measure cache hit rate (>50% for repeat errors)

---

### CHUNK 3.4: User Feedback System (Days 10-12, ~24h)

**Goal:** Learn from user validation

**Tasks:**
- [ ] `src/agent/FeedbackHandler.ts`
  - [ ] Process positive feedback (thumbs up)
  - [ ] Process negative feedback (thumbs down)
  - [ ] Update confidence scores
  - [ ] Re-embed documents with new scores
  - [ ] Invalidate cache on negative feedback
  
- [ ] `src/db/QualityManager.ts`
  - [ ] Auto-prune low-quality RCAs (<0.3 quality)
  - [ ] Expiration policy (6 months old)
  - [ ] Maintain quality metrics

**Implementation Example:**
```typescript
// src/agent/FeedbackHandler.ts
export class FeedbackHandler {
  constructor(
    private db: ChromaDBClient,
    private cache: RCACache
  ) {}
  
  async handlePositive(rcaId: string, errorHash: string): Promise<void> {
    // Get document
    const rca = await this.db.getById(rcaId);
    if (!rca) return;
    
    // Increase confidence (max 1.0)
    rca.confidence = Math.min(rca.confidence * 1.2, 1.0);
    rca.quality_score = this.calculateQuality(rca);
    rca.user_validated = true;
    
    // Update in database
    await this.db.update(rcaId, rca);
    
    console.log(`RCA ${rcaId} validated positively. New confidence: ${rca.confidence}`);
  }
  
  async handleNegative(rcaId: string, errorHash: string): Promise<void> {
    const rca = await this.db.getById(rcaId);
    if (!rca) return;
    
    // Decrease confidence
    rca.confidence = Math.max(rca.confidence * 0.5, 0.1);
    rca.quality_score = this.calculateQuality(rca);
    
    // Update and invalidate cache
    await this.db.update(rcaId, rca);
    this.cache.invalidate(errorHash);
    
    console.log(`RCA ${rcaId} marked unhelpful. New confidence: ${rca.confidence}`);
  }
  
  private calculateQuality(rca: RCADocument): number {
    let quality = rca.confidence;
    if (rca.user_validated) quality += 0.2;
    
    // Age penalty (6 months = 50% reduction)
    const age = Date.now() - rca.created_at;
    const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
    if (age > sixMonths) {
      quality *= 0.5;
    }
    
    return Math.min(quality, 1.0);
  }
}
```

**Tests:**
- [ ] Positive feedback increases confidence
- [ ] Negative feedback decreases confidence
- [ ] Cache invalidated on negative feedback
- [ ] Quality score calculated correctly
- [ ] Low-quality RCAs not returned in search

---

## CHUNK 4: Android Backend (Weeks 6-8)

### CHUNK 4.1: Jetpack Compose Parser (Days 1-4, ~32h)

**Goal:** Parse Compose-specific errors

**Tasks:**
- [ ] `src/utils/parsers/JetpackComposeParser.ts`
  - [ ] `remember` error patterns
  - [ ] `derivedStateOf` error patterns
  - [ ] Recomposition detection
  - [ ] `LaunchedEffect` error patterns
  - [ ] CompositionLocal error patterns
  - [ ] Modifier chain errors
  
- [ ] Compose-specific prompts in PromptEngine
- [ ] Few-shot examples for Compose errors
- [ ] Unit tests (10+ Compose error types)

**Implementation Example:**
```typescript
// src/utils/parsers/JetpackComposeParser.ts
export class JetpackComposeParser {
  parse(text: string): ParsedError | null {
    return (
      this.parseRememberError(text) ||
      this.parseRecompositionError(text) ||
      this.parseLaunchedEffectError(text) ||
      this.parseCompositionLocalError(text) ||
      null
    );
  }
  
  private parseRememberError(text: string): ParsedError | null {
    if (text.includes('reading a state') && text.includes('without calling remember')) {
      const fileMatch = text.match(/at (.+\.kt):(\d+)/);
      return {
        type: 'compose_remember',
        message: text,
        filePath: fileMatch?.[1] || 'unknown',
        line: parseInt(fileMatch?.[2] || '0'),
        language: 'kotlin',
        framework: 'compose',
      };
    }
    return null;
  }
  
  private parseRecompositionError(text: string): ParsedError | null {
    const match = text.match(/Recomposing (\d+) times/);
    if (match) {
      const count = parseInt(match[1]);
      if (count > 10) {
        return {
          type: 'compose_recomposition',
          message: text,
          filePath: 'unknown', // Needs profiler
          line: 0,
          language: 'kotlin',
          framework: 'compose',
          metadata: { recompositionCount: count },
        };
      }
    }
    return null;
  }
}
```

**Tests:**
- [ ] Parse remember errors
- [ ] Parse recomposition errors
- [ ] Parse LaunchedEffect errors
- [ ] Integration with main parser
- [ ] 10+ test cases

---

### CHUNK 4.2: XML Layout Parser (Days 5-7, ~24h)

**Goal:** Parse XML layout inflation errors

**Tasks:**
- [ ] `src/utils/parsers/XMLParser.ts`
  - [ ] Inflation error patterns
  - [ ] Missing view ID errors
  - [ ] Attribute error patterns (layout_width, etc.)
  - [ ] Namespace errors (xmlns:android)
  - [ ] Parse XML line numbers
  
- [ ] XML-specific prompts
- [ ] Unit tests (8+ XML error types)

**Implementation Example:**
```typescript
// src/utils/parsers/XMLParser.ts
export class XMLParser {
  parse(text: string): ParsedError | null {
    return (
      this.parseInflationError(text) ||
      this.parseMissingIdError(text) ||
      this.parseAttributeError(text) ||
      null
    );
  }
  
  private parseInflationError(text: string): ParsedError | null {
    const match = text.match(/InflateException: Binary XML file line #(\d+)/);
    if (match) {
      const line = parseInt(match[1]);
      const fileMatch = text.match(/in (.+\.xml)/);
      return {
        type: 'xml_inflation',
        message: text,
        filePath: fileMatch?.[1] || 'unknown.xml',
        line,
        language: 'xml',
        framework: 'android',
      };
    }
    return null;
  }
  
  private parseMissingIdError(text: string): ParsedError | null {
    if (text.includes('findViewById') && text.includes('null')) {
      return {
        type: 'xml_missing_id',
        message: text,
        filePath: 'unknown.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
      };
    }
    return null;
  }
}
```

**Tests:**
- [ ] Parse inflation errors
- [ ] Parse missing ID errors
- [ ] Parse attribute errors
- [ ] Extract line numbers correctly
- [ ] 8+ test cases

---

### CHUNK 4.3: Gradle Build Analyzer (Days 8-11, ~32h)

**Goal:** Analyze Gradle build errors

**Tasks:**
- [ ] `src/tools/AndroidBuildTool.ts`
  - [ ] Parse Gradle error output
  - [ ] Dependency conflict detection
  - [ ] Version mismatch analysis
  - [ ] Repository configuration errors
  - [ ] Plugin errors
  - [ ] Recommend version resolution
  
- [ ] Support both Groovy and Kotlin DSL
- [ ] Dependency graph analysis
- [ ] Unit tests (10+ Gradle errors)

**Implementation Example:**
```typescript
// src/tools/AndroidBuildTool.ts
export class AndroidBuildTool {
  parseBuildError(buildOutput: string): ParsedError | null {
    return (
      this.parseDependencyConflict(buildOutput) ||
      this.parseVersionMismatch(buildOutput) ||
      this.parseRepositoryError(buildOutput) ||
      null
    );
  }
  
  parseDependencyConflict(output: string): ParsedError | null {
    const match = output.match(/Conflict.*module '(.+?)' versions? (.+?) and (.+)/);
    if (match) {
      const [_, module, version1, version2] = match;
      return {
        type: 'gradle_dependency_conflict',
        message: output,
        filePath: 'build.gradle',
        line: 0,
        language: 'gradle',
        metadata: { module, conflictingVersions: [version1, version2] },
      };
    }
    return null;
  }
  
  recommendResolution(conflict: ParsedError): string {
    const { module, conflictingVersions } = conflict.metadata;
    const recommended = this.selectHigherVersion(conflictingVersions);
    
    return `Add explicit version in build.gradle:
implementation("${module}:${recommended}")

Or use dependency resolution strategy:
configurations.all {
  resolutionStrategy {
    force "${module}:${recommended}"
  }
}`;
  }
  
  private selectHigherVersion(versions: string[]): string {
    // Simple version comparison (can be more sophisticated)
    return versions.sort().reverse()[0];
  }
}
```

**Tests:**
- [ ] Parse dependency conflicts
- [ ] Parse version mismatches
- [ ] Recommend correct version
- [ ] Support Groovy and Kotlin DSL
- [ ] 10+ test cases

---

### CHUNK 4.4: Manifest & Docs (Days 12-15, ~32h)

**Goal:** Handle manifest errors and search Android docs

**Tasks:**
- [ ] `src/tools/ManifestAnalyzerTool.ts`
  - [ ] Parse manifest merge conflicts
  - [ ] Detect missing permissions
  - [ ] Find undeclared activities/services
  - [ ] Parse XML merge markers
  
- [ ] `src/tools/AndroidDocsSearchTool.ts`
  - [ ] Index offline Android SDK docs
  - [ ] Search by API name
  - [ ] Search by error message keywords
  - [ ] Return relevant doc snippets
  
- [ ] Unit tests for both tools

**Implementation Example:**
```typescript
// src/tools/ManifestAnalyzerTool.ts
export class ManifestAnalyzerTool {
  parseManifestError(output: string): ParsedError | null {
    if (output.includes('Manifest merger failed')) {
      return {
        type: 'manifest_merge_conflict',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
      };
    }
    
    const permMatch = output.match(/Permission denied.*requires (.+)/);
    if (permMatch) {
      return {
        type: 'manifest_missing_permission',
        message: output,
        filePath: 'AndroidManifest.xml',
        line: 0,
        language: 'xml',
        metadata: { requiredPermission: permMatch[1] },
      };
    }
    
    return null;
  }
}

// src/tools/AndroidDocsSearchTool.ts
export class AndroidDocsSearchTool {
  private docsIndex: Map<string, string> = new Map();
  
  async initialize() {
    // Index common Android APIs
    this.docsIndex.set('Activity', 'android.app.Activity - Base class for activities...');
    this.docsIndex.set('onCreate', 'Called when activity is starting...');
    // ... more indexing
  }
  
  search(query: string): string[] {
    const results: string[] = [];
    for (const [key, value] of this.docsIndex.entries()) {
      if (key.toLowerCase().includes(query.toLowerCase())) {
        results.push(value);
      }
    }
    return results.slice(0, 5);
  }
}
```

**Tests:**
- [ ] Parse manifest merge conflicts
- [ ] Detect missing permissions
- [ ] Search docs by API name
- [ ] Return relevant doc snippets
- [ ] Integration tests

---

### CHUNK 4.5: Android Testing (Days 16-18, ~24h)

**Goal:** Comprehensive Android testing

**Tasks:**
- [ ] Create test dataset (20 real Android errors)
  - [ ] 5 Compose errors
  - [ ] 3 XML errors
  - [ ] 5 Gradle errors
  - [ ] 3 Manifest errors
  - [ ] 4 mixed errors
- [ ] Run full test suite
- [ ] Measure accuracy per error type
- [ ] Fix bugs found during testing
- [ ] Performance optimization
- [ ] Document accuracy metrics

**Tests:**
- [ ] End-to-end tests for all Android features
- [ ] Accuracy: 14/20 (70%+)
- [ ] Latency: <60s per analysis
- [ ] All parsers working correctly

---

## CHUNK 5: Polish Backend (Weeks 9-12)

### CHUNK 5.1: Agent State Streaming (Days 1-5, ~40h)

**Goal:** Real-time progress updates for UI

**Tasks:**
- [ ] `src/agent/AgentStateStream.ts`
  - [ ] EventEmitter for state changes
  - [ ] Emit iteration updates
  - [ ] Emit thought/action/observation events
  - [ ] Progress calculation (%)
  
- [ ] `src/agent/DocumentSynthesizer.ts`
  - [ ] Generate markdown RCA reports
  - [ ] Section organization (summary, analysis, fix)
  - [ ] Code highlighting syntax
  - [ ] Link generation (file paths)
  
- [ ] Update ReactAgent to emit events
- [ ] Format events for UI consumption

**Implementation Example:**
```typescript
// src/agent/AgentStateStream.ts
import { EventEmitter } from 'events';

export class AgentStateStream extends EventEmitter {
  emitIteration(iteration: number, maxIterations: number) {
    this.emit('iteration', { iteration, maxIterations, progress: iteration / maxIterations });
  }
  
  emitThought(thought: string) {
    this.emit('thought', { thought, timestamp: Date.now() });
  }
  
  emitAction(action: ToolCall) {
    this.emit('action', { action, timestamp: Date.now() });
  }
  
  emitObservation(observation: string) {
    this.emit('observation', { observation, timestamp: Date.now() });
  }
  
  emitComplete(rca: RCADocument) {
    this.emit('complete', { rca, timestamp: Date.now() });
  }
}

// Update ReactAgent
export class ReactAgent {
  private stream = new AgentStateStream();
  
  getStream(): AgentStateStream {
    return this.stream;
  }
  
  async analyze(error: ParsedError): Promise<RCADocument> {
    for (let i = 0; i < this.maxIterations; i++) {
      this.stream.emitIteration(i + 1, this.maxIterations);
      
      const thought = await this.generateThought(state);
      this.stream.emitThought(thought);
      
      const action = await this.selectAction(thought);
      this.stream.emitAction(action);
      
      const observation = await this.executeAction(action);
      this.stream.emitObservation(observation);
      
      // ...
    }
    
    const rca = this.synthesizeFinalRCA(state);
    this.stream.emitComplete(rca);
    return rca;
  }
}
```

**Tests:**
- [ ] Stream emits all events
- [ ] Events have correct data
- [ ] Progress calculation accurate
- [ ] Document synthesizer generates markdown

---

### CHUNK 5.2: Educational Agent (Days 6-10, ~40h)

**Goal:** Generate learning-focused explanations

**Tasks:**
- [ ] `src/agent/EducationalAgent.ts`
  - [ ] Extend ReactAgent
  - [ ] Generate learning notes after each iteration
  - [ ] Explain error types (what is NP E?)
  - [ ] Explain root causes (why did this happen?)
  - [ ] Prevention tips (how to avoid?)
  
- [ ] Educational prompts
  - [ ] Beginner-friendly language
  - [ ] Analogies and metaphors
  - [ ] Code examples
  
- [ ] Async explanation generation (optional)

**Implementation Example:**
```typescript
// src/agent/EducationalAgent.ts
export class EducationalAgent extends ReactAgent {
  async analyze(error: ParsedError, mode: 'sync' | 'async' = 'sync'): Promise<RCADocument> {
    const rca = await super.analyze(error);
    
    if (mode === 'sync') {
      // Generate explanations during analysis
      rca.learningNotes = await this.generateLearningNotes(rca);
    } else {
      // Generate explanations after analysis (faster)
      setTimeout(() => this.generateAndStoreLearningNotes(rca), 0);
    }
    
    return rca;
  }
  
  private async generateLearningNotes(rca: RCADocument): Promise<string[]> {
    const notes: string[] = [];
    
    // Explain error type
    const errorExplanation = await this.llm.generate(`
      Explain "${rca.error_type}" error to a beginner Kotlin developer.
      Use simple language and analogies. Keep it under 100 words.
      
      Focus on WHAT this error means in plain English.
    `);
    notes.push(`🎓 **What is this error?**\n${errorExplanation}`);
    
    // Explain root cause
    const causeExplanation = await this.llm.generate(`
      The root cause is: "${rca.root_cause}"
      
      Explain WHY this happened to a beginner. Use an analogy if helpful.
      Keep it under 100 words.
    `);
    notes.push(`🔍 **Why did this happen?**\n${causeExplanation}`);
    
    // Prevention tips
    const prevention = await this.llm.generate(`
      Based on this error type (${rca.error_type}), give 3 concrete tips
      on how to prevent it in the future. Be specific and actionable.
    `);
    notes.push(`🛡️ **How to prevent this:**\n${prevention}`);
    
    return notes;
  }
}
```

**Tests:**
- [ ] Educational agent generates learning notes
- [ ] Notes are beginner-friendly
- [ ] Analogies are appropriate
- [ ] Sync vs async modes work
- [ ] Test with 5 error types

---

### CHUNK 5.3: Performance Optimization (Days 11-14, ~32h)

**Goal:** Meet all performance targets

**Tasks:**
- [ ] `src/monitoring/PerformanceTracker.ts`
  - [ ] Track latency per component (parser, LLM, tools, DB)
  - [ ] Token usage tracking
  - [ ] Cache hit rate monitoring
  - [ ] Export metrics to JSON
  
- [ ] Optimization implementation
  - [ ] Parallel tool execution
  - [ ] Context window management (chunking for large files)
  - [ ] Query optimization (ChromaDB)
  - [ ] Prompt optimization (reduce tokens)
  
- [ ] Benchmarking suite
  - [ ] Run 100 analyses
  - [ ] Measure p50, p90, p99 latencies
  - [ ] Compare before/after optimization

**Implementation Example:**
```typescript
// src/monitoring/PerformanceTracker.ts
export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  
  startTimer(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration);
    };
  }
  
  recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }
  
  getStats(operation: string): Stats {
    const values = this.metrics.get(operation) || [];
    if (values.length === 0) return { p50: 0, p90: 0, p99: 0, mean: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
    };
  }
  
  exportMetrics(): Record<string, Stats> {
    const result: Record<string, Stats> = {};
    for (const [operation, _] of this.metrics.entries()) {
      result[operation] = this.getStats(operation);
    }
    return result;
  }
}

// Usage in ReactAgent
export class ReactAgent {
  private perf = new PerformanceTracker();
  
  async analyze(error: ParsedError): Promise<RCADocument> {
    const stopTotal = this.perf.startTimer('total_analysis');
    
    const stopParsing = this.perf.startTimer('parsing');
    const parsed = this.parser.parse(error);
    stopParsing();
    
    for (let i = 0; i < this.maxIterations; i++) {
      const stopLLM = this.perf.startTimer('llm_inference');
      const thought = await this.llm.generate(prompt);
      stopLLM();
      
      const stopTool = this.perf.startTimer('tool_execution');
      const observation = await this.executeTool(action);
      stopTool();
    }
    
    stopTotal();
    console.log(this.perf.exportMetrics());
    
    return rca;
  }
}
```

**Tests:**
- [ ] Performance tracker records metrics
- [ ] Stats calculation correct
- [ ] Benchmarks show <60s average (standard mode, GPU)
- [ ] Cache hit rate >60%
- [ ] Parallel tool execution 2-3x faster

---

### CHUNK 5.4: Testing & QA (Days 15-19, ~40h)

**Goal:** Achieve 80%+ test coverage

**Tasks:**
- [ ] Unit tests for all modules
  - [ ] Parsers (15+ tests)
  - [ ] Agent (10+ tests)
  - [ ] Tools (12+ tests)
  - [ ] Database (8+ tests)
  - [ ] Cache (6+ tests)
  
- [ ] Integration tests
  - [ ] End-to-end workflow (parse → analyze → store)
  - [ ] Tool execution workflow
  - [ ] Feedback loop workflow
  
- [ ] Golden test suite
  - [ ] 15+ reference RCAs
  - [ ] Expected outputs
  - [ ] Regression testing
  
- [ ] Edge case testing
  - [ ] Large files (>10K lines)
  - [ ] Missing files
  - [ ] Malformed errors
  - [ ] LLM timeout
  - [ ] ChromaDB connection failure

**Test Organization:**
```
tests/
├── unit/
│   ├── utils/
│   │   ├── ErrorParser.test.ts
│   │   ├── KotlinParser.test.ts
│   │   └── GradleParser.test.ts
│   ├── agent/
│   │   ├── ReactAgent.test.ts
│   │   ├── EducationalAgent.test.ts
│   │   └── PromptEngine.test.ts
│   ├── tools/
│   │   ├── ReadFileTool.test.ts
│   │   ├── LSPTool.test.ts
│   │   └── AndroidBuildTool.test.ts
│   ├── db/
│   │   ├── ChromaDBClient.test.ts
│   │   └── EmbeddingService.test.ts
│   └── cache/
│       ├── RCACache.test.ts
│       └── ErrorHasher.test.ts
│
├── integration/
│   ├── end-to-end.test.ts
│   ├── database-workflow.test.ts
│   └── feedback-loop.test.ts
│
└── golden/
    ├── kotlin-npe-1.test.ts
    ├── kotlin-lateinit-1.test.ts
    ├── compose-remember-1.test.ts
    ├── gradle-conflict-1.test.ts
    └── ... (15 total)
```

**Coverage Report:**
```bash
# Run tests with coverage
npm run test:coverage

# Expected output:
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   83.45 |    78.92 |   85.12 |   83.67 |
 utils/               |   88.23 |    82.45 |   90.12 |   88.45 |
  ErrorParser.ts      |   91.34 |    85.67 |   93.21 |   91.56 |
  KotlinParser.ts     |   89.45 |    83.12 |   91.45 |   89.67 |
 agent/               |   81.23 |    75.67 |   82.34 |   81.45 |
  ReactAgent.ts       |   84.56 |    78.23 |   85.67 |   84.78 |
 tools/               |   85.67 |    80.12 |   87.23 |   85.89 |
 db/                  |   79.45 |    74.23 |   80.12 |   79.67 |
 cache/               |   87.12 |    82.34 |   88.45 |   87.34 |
----------------------|---------|----------|---------|---------|
```

**Tests:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Golden suite: 15/15 pass
- [ ] Coverage >80% overall
- [ ] No known bugs or edge case failures

---

### CHUNK 5.5: Documentation (Days 20-24, ~40h)

**Goal:** Complete API and architecture documentation

**Tasks:**
- [ ] API documentation
  - [ ] All public methods documented (JSDoc)
  - [ ] Interface documentation
  - [ ] Usage examples
  
- [ ] Architecture documentation
  - [ ] System overview diagram
  - [ ] Component interaction diagrams
  - [ ] Data flow diagrams
  - [ ] Database schema documentation
  
- [ ] Code comments cleanup
  - [ ] Remove TODO comments (resolve or file issues)
  - [ ] Add explanatory comments for complex logic
  - [ ] Document algorithm choices
  
- [ ] Performance benchmarks documentation
  - [ ] Latency metrics
  - [ ] Accuracy metrics
  - [ ] Cache hit rates
  - [ ] Token usage stats

**Documentation Structure:**
```
docs/
├── api/
│   ├── Agent.md              # Agent API reference
│   ├── Parsers.md            # Parser API reference
│   ├── Tools.md              # Tool API reference
│   └── Database.md           # DB API reference
│
├── architecture/
│   ├── overview.md           # System architecture
│   ├── agent-workflow.md     # Agent reasoning flow
│   ├── database-design.md    # ChromaDB schema
│   └── diagrams/
│       ├── component-diagram.png
│       └── data-flow.png
│
└── performance/
    ├── benchmarks.md         # Performance metrics
    └── optimization-guide.md # Optimization techniques
```

**Example API Documentation:**
```typescript
/**
 * Root Cause Analysis Agent using ReAct (Reasoning + Acting) pattern.
 * 
 * @example
 * ```typescript
 * const llm = await OllamaClient.create({ model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest' });
 * const agent = new ReactAgent(llm);
 * 
 * const error: ParsedError = {
 *   type: 'lateinit',
 *   message: 'lateinit property user has not been initialized',
 *   filePath: 'MainActivity.kt',
 *   line: 45,
 *   language: 'kotlin',
 * };
 * 
 * const rca = await agent.analyze(error);
 * console.log(rca.rootCause);
 * console.log(rca.fixGuidelines);
 * ```
 */
export class ReactAgent {
  /**
   * Analyze an error and generate root cause analysis.
   * 
   * @param error - Parsed error object
   * @param options - Analysis options (mode, maxIterations, timeout)
   * @returns RCA document with root cause and fix guidelines
   * @throws {AnalysisError} If analysis fails or times out
   */
  async analyze(error: ParsedError, options?: AnalysisOptions): Promise<RCADocument> {
    // Implementation...
  }
}
```

**Deliverables:**
- [ ] All public APIs documented
- [ ] Architecture diagrams created
- [ ] Performance benchmarks documented
- [ ] Code comments complete

---

## Testing Strategy

### Unit Testing
- **Coverage Target:** 80%+ per file
- **Framework:** Jest
- **Mocking:** Mock external dependencies (Ollama, ChromaDB, VS Code API)
- **Focus:** Individual function correctness

### Integration Testing
- **Focus:** Component interactions
- **Scenarios:**
  - Parse → Analyze → Store workflow
  - Tool execution workflow
  - Feedback loop workflow
  - Cache hit/miss scenarios

### Golden Testing
- **Purpose:** Regression prevention
- **Dataset:** 15+ real errors with expected RCAs
- **Validation:** Output matches expected (with tolerance for LLM variance)

### Performance Testing
- **Benchmarks:** 100+ analyses per test
- **Metrics:** p50, p90, p99 latencies
- **Targets:** <60s standard, <40s fast, <90s educational

---

## Development Guidelines

### Code Standards
- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with Airbnb config
- **Formatting:** Prettier (2-space indentation)
- **Comments:** JSDoc for all public methods
- **Naming:** Descriptive names (no abbreviations)

### Error Handling
- Always use try-catch for async operations
- Throw typed errors (e.g., `AnalysisError`, `ParsingError`)
- Log errors with context
- Graceful degradation (fallbacks for tool failures)

### Performance
- Profile hot paths (use PerformanceTracker)
- Optimize prompts to reduce tokens
- Use parallel tool execution where possible
- Implement caching aggressively

### Testing
- Write tests before or during implementation (TDD)
- Test edge cases (null, undefined, empty arrays)
- Mock external dependencies
- Aim for >80% coverage

---

## Collaboration with Sokchea

### Interface Contracts
Kai defines the contracts (function signatures, interfaces) that Sokchea will call:

```typescript
// Example: Agent interface for Sokchea to use
export interface IAgent {
  analyze(error: ParsedError): Promise<RCADocument>;
  getStream(): AgentStateStream; // For real-time updates
  cancel(): void; // Allow user to stop analysis
}

// Example: Feedback handler interface
export interface IFeedbackHandler {
  handlePositive(rcaId: string, errorHash: string): Promise<void>;
  handleNegative(rcaId: string, errorHash: string): Promise<void>;
}
```

### Communication
- **Daily Sync:** Share what APIs are ready for integration
- **Documentation:** Document all public methods with JSDoc
- **Examples:** Provide usage examples for Sokchea
- **Testing:** Help Sokchea test integration points

### Integration Points
1. **Extension → Agent:** Sokchea calls `agent.analyze(error)`
2. **Extension → Stream:** Sokchea subscribes to `agent.getStream()` for updates
3. **Extension → Feedback:** Sokchea calls `feedbackHandler.handlePositive()`
4. **Extension → Cache:** Sokchea shows cache hit notifications from Kai's data

---

## Success Metrics

### Phase 1 Complete When:
- ✅ All parsers working (Kotlin, Compose, XML, Gradle)
- ✅ Agent achieves 70%+ accuracy on test suite
- ✅ ChromaDB stores and retrieves RCAs correctly
- ✅ Cache hit rate >60%
- ✅ Performance <60s standard mode (GPU)
- ✅ Educational mode generates learning notes
- ✅ Test coverage >80%
- ✅ All golden tests passing
- ✅ Zero known critical bugs
- ✅ API documentation complete

---

## Notes

- Focus on implementation, not UI
- Write clean, maintainable code
- Document everything (JSDoc + architecture docs)
- Test rigorously (unit + integration + golden)
- Optimize for accuracy first, then performance
- Collaborate closely with Sokchea on interfaces
- Ask for clarification when interface contracts are unclear

**This is Kai's complete work breakdown. Sokchea handles all UI/integration separately.**

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Ignoring LLM Output Validation
**Problem:** LLM returns malformed JSON or unexpected formats
**Solution:**
```typescript
// WRONG: Trust LLM output blindly
const result = JSON.parse(llmOutput);

// CORRECT: Validate and sanitize
function parseLLMOutput(output: string): RCAResult {
  const sanitized = InputValidator.sanitizeLLMOutput(output);
  
  try {
    const parsed = JSON.parse(sanitized);
    
    // Validate structure
    if (!parsed.rootCause || !parsed.fixGuidelines) {
      logger.warn('Incomplete LLM output', { output: sanitized });
      return createFallbackResult(output);
    }
    
    // Validate types
    if (typeof parsed.rootCause !== 'string') {
      throw new ValidationError('rootCause must be a string');
    }
    
    if (!Array.isArray(parsed.fixGuidelines)) {
      throw new ValidationError('fixGuidelines must be an array');
    }
    
    return parsed as RCAResult;
  } catch (error) {
    logger.error('Failed to parse LLM output', error as Error, { output });
    return createFallbackResult(sanitized);
  }
}

function createFallbackResult(output: string): RCAResult {
  return {
    rootCause: output,
    fixGuidelines: ['Review the error and code context'],
    confidence: 0.3
  };
}
```

### Pitfall 2: Not Handling File System Errors
**Problem:** Files may not exist, be inaccessible, or be binary
**Solution:**
```typescript
// WRONG: Assume file exists and is readable
const content = fs.readFileSync(filePath, 'utf-8');

// CORRECT: Handle all edge cases
async function readFileSafely(filePath: string): Promise<string | null> {
  try {
    // Check if file exists
    const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      logger.warn('File not found', { filePath });
      return null;
    }
    
    // Check file size (avoid huge files)
    const stats = await fs.promises.stat(filePath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      logger.warn('File too large, reading first 10MB', { filePath, size: stats.size });
      const fd = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(10 * 1024 * 1024);
      await fd.read(buffer, 0, buffer.length, 0);
      await fd.close();
      return buffer.toString('utf-8');
    }
    
    // Check if binary
    const buffer = await fs.promises.readFile(filePath);
    const isBinary = buffer.some(byte => byte === 0 || byte > 127);
    
    if (isBinary) {
      logger.warn('Binary file detected', { filePath });
      return null;
    }
    
    return buffer.toString('utf-8');
  } catch (error) {
    logger.error('Error reading file', error as Error, { filePath });
    return null;
  }
}
```

### Pitfall 3: Race Conditions in Async Code
**Problem:** Multiple async operations modifying shared state
**Solution:**
```typescript
// WRONG: Concurrent modifications without locking
async function badCacheUpdate(key: string) {
  const value = await cache.get(key);
  const updated = value + 1;
  await cache.set(key, updated);
}

// CORRECT: Use mutex/semaphore for critical sections
import { Mutex } from 'async-mutex';

class ThreadSafeCache {
  private cache = new Map<string, any>();
  private locks = new Map<string, Mutex>();
  
  private getLock(key: string): Mutex {
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex());
    }
    return this.locks.get(key)!;
  }
  
  async update(key: string, updater: (value: any) => any): Promise<void> {
    const lock = this.getLock(key);
    const release = await lock.acquire();
    
    try {
      const currentValue = this.cache.get(key);
      const newValue = updater(currentValue);
      this.cache.set(key, newValue);
    } finally {
      release();
    }
  }
}
```

### Pitfall 4: Memory Leaks from Event Listeners
**Problem:** Event listeners not cleaned up
**Solution:**
```typescript
// WRONG: Add listeners without cleanup
class LeakyAgent {
  constructor() {
    process.on('uncaughtException', this.handleError);
    setInterval(this.checkHealth, 60000);
  }
}

// CORRECT: Track and clean up resources
class ProperAgent {
  private intervals: NodeJS.Timeout[] = [];
  private boundHandlers = new Map<string, (...args: any[]) => void>();
  
  constructor() {
    const errorHandler = this.handleError.bind(this);
    this.boundHandlers.set('error', errorHandler);
    process.on('uncaughtException', errorHandler);
    
    const interval = setInterval(this.checkHealth.bind(this), 60000);
    this.intervals.push(interval);
  }
  
  dispose(): void {
    // Clean up intervals
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    
    // Remove event listeners
    for (const [event, handler] of this.boundHandlers.entries()) {
      process.removeListener(event, handler);
    }
    this.boundHandlers.clear();
  }
}
```

### Pitfall 5: Inefficient Database Queries
**Problem:** N+1 query problem or fetching too much data
**Solution:**
```typescript
// WRONG: Query in loop (N+1 problem)
async function badApproach(errorIds: string[]) {
  const results = [];
  for (const id of errorIds) {
    const rca = await db.getById(id); // N queries!
    results.push(rca);
  }
  return results;
}

// CORRECT: Batch query
async function goodApproach(errorIds: string[]) {
  // Single query with filter
  const results = await db.getByIds(errorIds);
  return results;
}

// CORRECT: Pagination for large datasets
async function getPaginatedResults(query: string, pageSize: number = 50) {
  let offset = 0;
  let hasMore = true;
  const allResults = [];
  
  while (hasMore) {
    const page = await db.query({
      query,
      limit: pageSize,
      offset
    });
    
    allResults.push(...page.results);
    hasMore = page.hasMore;
    offset += pageSize;
    
    // Safety check
    if (allResults.length > 1000) {
      logger.warn('Query returning too many results, stopping at 1000');
      break;
    }
  }
  
  return allResults;
}
```

### Pitfall 6: Not Handling Partial Failures
**Problem:** One failure stops entire batch
**Solution:**
```typescript
// WRONG: All-or-nothing approach
async function processAllOrFail(items: Item[]) {
  const results = await Promise.all(items.map(processItem));
  return results;
}

// CORRECT: Process with fault tolerance
async function processWithFaultTolerance(items: Item[]) {
  const results = await Promise.allSettled(items.map(processItem));
  
  const successful = results
    .filter((r): r is PromiseFulfilledResult<Result> => r.status === 'fulfilled')
    .map(r => r.value);
  
  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r, i) => ({ item: items[i], error: r.reason }));
  
  if (failed.length > 0) {
    logger.warn('Some items failed to process', {
      successCount: successful.length,
      failCount: failed.length,
      failures: failed.map(f => f.error.message)
    });
  }
  
  return { successful, failed };
}
```

---

## 🎨 API Design Patterns

### Pattern 13: Builder Pattern for Complex Objects
```typescript
// Complex configuration with many optional parameters
export class AgentConfigBuilder {
  private config: Partial<AgentConfig> = {};
  
  setModel(model: string): this {
    this.config.model = model;
    return this;
  }
  
  setMaxIterations(max: number): this {
    if (max < 1 || max > 20) {
      throw new Error('Max iterations must be between 1 and 20');
    }
    this.config.maxIterations = max;
    return this;
  }
  
  setTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }
  
  setMode(mode: 'standard' | 'fast' | 'educational'): this {
    this.config.mode = mode;
    return this;
  }
  
  enableCaching(enable: boolean = true): this {
    this.config.caching = enable;
    return this;
  }
  
  build(): AgentConfig {
    // Set defaults
    return {
      model: this.config.model ?? 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      maxIterations: this.config.maxIterations ?? 10,
      timeout: this.config.timeout ?? 90000,
      mode: this.config.mode ?? 'standard',
      caching: this.config.caching ?? true
    };
  }
}

// Usage
const config = new AgentConfigBuilder()
  .setModel('codellama:7b')
  .setMaxIterations(8)
  .setMode('fast')
  .enableCaching()
  .build();

const agent = new ReactAgent(config);
```

### Pattern 14: Factory Pattern for Parser Creation
```typescript
// Centralized parser creation
export class ParserFactory {
  private static parsers = new Map<string, ErrorParser>();
  
  static register(language: string, parser: ErrorParser): void {
    this.parsers.set(language.toLowerCase(), parser);
  }
  
  static getParser(language: string): ErrorParser {
    const parser = this.parsers.get(language.toLowerCase());
    if (!parser) {
      throw new Error(`No parser registered for language: ${language}`);
    }
    return parser;
  }
  
  static getSupportedLanguages(): string[] {
    return Array.from(this.parsers.keys());
  }
  
  static parseError(errorText: string, language?: string): ParsedError | null {
    // Auto-detect language if not provided
    if (!language) {
      language = LanguageDetector.detect(errorText);
    }
    
    const parser = this.getParser(language);
    return parser.parse(errorText);
  }
}

// Registration
ParserFactory.register('kotlin', new KotlinParser());
ParserFactory.register('java', new JavaParser());
ParserFactory.register('xml', new XMLParser());
ParserFactory.register('gradle', new GradleParser());

// Usage
const error = ParserFactory.parseError(errorText, 'kotlin');
```

### Pattern 15: Strategy Pattern for Different Analysis Modes
```typescript
// Different analysis strategies
export interface AnalysisStrategy {
  analyze(error: ParsedError): Promise<RCAResult>;
  getMaxIterations(): number;
  getTimeout(): number;
}

export class StandardStrategy implements AnalysisStrategy {
  constructor(private agent: ReactAgent) {}
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    return this.agent.analyze(error);
  }
  
  getMaxIterations(): number {
    return 10;
  }
  
  getTimeout(): number {
    return 60000;
  }
}

export class FastStrategy implements AnalysisStrategy {
  constructor(private agent: ReactAgent) {}
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    // Use fewer iterations and smaller model
    return this.agent.analyze(error, {
      maxIterations: 6,
      model: 'qwen-coder:3b'
    });
  }
  
  getMaxIterations(): number {
    return 6;
  }
  
  getTimeout(): number {
    return 40000;
  }
}

export class EducationalStrategy implements AnalysisStrategy {
  constructor(
    private agent: ReactAgent,
    private educationalAgent: EducationalAgent
  ) {}
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    const rca = await this.agent.analyze(error);
    const learningNotes = await this.educationalAgent.generateLearningNotes(rca);
    return { ...rca, learningNotes };
  }
  
  getMaxIterations(): number {
    return 10;
  }
  
  getTimeout(): number {
    return 90000;
  }
}

// Usage
export class AnalysisEngine {
  private strategies = new Map<string, AnalysisStrategy>();
  
  constructor() {
    const agent = new ReactAgent();
    const eduAgent = new EducationalAgent();
    
    this.strategies.set('standard', new StandardStrategy(agent));
    this.strategies.set('fast', new FastStrategy(agent));
    this.strategies.set('educational', new EducationalStrategy(agent, eduAgent));
  }
  
  async analyze(error: ParsedError, mode: string = 'standard'): Promise<RCAResult> {
    const strategy = this.strategies.get(mode);
    if (!strategy) {
      throw new Error(`Unknown analysis mode: ${mode}`);
    }
    
    return strategy.analyze(error);
  }
}
```

### Pattern 16: Observer Pattern for Progress Updates
```typescript
// Observable agent for real-time updates
export interface AgentObserver {
  onIterationStart(iteration: number, maxIterations: number): void;
  onThought(thought: string): void;
  onAction(action: ToolCall): void;
  onObservation(observation: string): void;
  onComplete(rca: RCAResult): void;
  onError(error: Error): void;
}

export class ObservableAgent {
  private observers: AgentObserver[] = [];
  
  subscribe(observer: AgentObserver): () => void {
    this.observers.push(observer);
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }
  
  private notifyIterationStart(iteration: number, max: number): void {
    this.observers.forEach(o => o.onIterationStart(iteration, max));
  }
  
  private notifyThought(thought: string): void {
    this.observers.forEach(o => o.onThought(thought));
  }
  
  private notifyAction(action: ToolCall): void {
    this.observers.forEach(o => o.onAction(action));
  }
  
  private notifyObservation(observation: string): void {
    this.observers.forEach(o => o.onObservation(observation));
  }
  
  private notifyComplete(rca: RCAResult): void {
    this.observers.forEach(o => o.onComplete(rca));
  }
  
  private notifyError(error: Error): void {
    this.observers.forEach(o => o.onError(error));
  }
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    try {
      for (let i = 0; i < this.maxIterations; i++) {
        this.notifyIterationStart(i + 1, this.maxIterations);
        
        const thought = await this.generateThought();
        this.notifyThought(thought);
        
        const action = await this.selectAction(thought);
        this.notifyAction(action);
        
        const observation = await this.executeAction(action);
        this.notifyObservation(observation);
      }
      
      const rca = this.synthesizeResult();
      this.notifyComplete(rca);
      return rca;
    } catch (error) {
      this.notifyError(error as Error);
      throw error;
    }
  }
}

// Usage
const agent = new ObservableAgent();

const unsubscribe = agent.subscribe({
  onIterationStart: (iter, max) => console.log(`Iteration ${iter}/${max}`),
  onThought: (thought) => console.log(`Thinking: ${thought}`),
  onAction: (action) => console.log(`Action: ${action.tool}`),
  onObservation: (obs) => console.log(`Observed: ${obs}`),
  onComplete: (rca) => console.log(`Done: ${rca.rootCause}`),
  onError: (error) => console.error(`Error: ${error.message}`)
});

await agent.analyze(error);
unsubscribe(); // Clean up
```

---

## 🐛 Debugging & Troubleshooting

### Debug Strategy 1: Comprehensive Logging
```typescript
// Add debug logging throughout analysis
export class DebugAgent extends ReactAgent {
  async analyze(error: ParsedError): Promise<RCAResult> {
    const logger = Logger.getInstance();
    logger.setLevel(LogLevel.DEBUG);
    
    logger.debug('Starting analysis', {
      errorType: error.type,
      language: error.language,
      filePath: error.filePath,
      line: error.line
    });
    
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = await this.checkCache(error);
      if (cached) {
        logger.debug('Cache hit', { errorHash: this.hashError(error) });
        return cached;
      }
      
      // Search vector DB
      const similar = await this.searchSimilar(error);
      logger.debug('Vector DB search results', {
        count: similar.length,
        topConfidence: similar[0]?.confidence
      });
      
      // Run analysis
      const result = await super.analyze(error);
      
      const duration = Date.now() - startTime;
      logger.debug('Analysis complete', {
        duration,
        confidence: result.confidence,
        iterations: this.currentIteration
      });
      
      return result;
    } catch (error) {
      logger.error('Analysis failed', error as Error, {
        duration: Date.now() - startTime,
        errorType: error.type
      });
      throw error;
    }
  }
}
```

### Debug Strategy 2: Tracing Tool Execution
```typescript
// Trace all tool calls
export class TracedToolRegistry extends ToolRegistry {
  async executeTool(call: ToolCall): Promise<ToolResult> {
    const logger = Logger.getInstance();
    const startTime = Date.now();
    
    logger.debug('Executing tool', {
      tool: call.tool,
      parameters: call.parameters
    });
    
    try {
      const result = await super.executeTool(call);
      const duration = Date.now() - startTime;
      
      logger.debug('Tool execution succeeded', {
        tool: call.tool,
        duration,
        resultLength: JSON.stringify(result).length
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Tool execution failed', error as Error, {
        tool: call.tool,
        duration,
        parameters: call.parameters
      });
      
      throw error;
    }
  }
}
```

### Debug Strategy 3: Snapshot Agent State
```typescript
// Save agent state for debugging
export class SnapshotAgent extends ReactAgent {
  private snapshots: AgentState[] = [];
  
  async analyze(error: ParsedError): Promise<RCAResult> {
    this.snapshots = [];
    
    for (let i = 0; i < this.maxIterations; i++) {
      // Take snapshot before each iteration
      const snapshot = this.captureState();
      this.snapshots.push(snapshot);
      
      // Continue normal analysis
      await this.runIteration();
    }
    
    // Save snapshots to file for debugging
    await this.saveSnapshots(error);
    
    return this.synthesizeResult();
  }
  
  private captureState(): AgentState {
    return {
      iteration: this.currentIteration,
      thoughts: [...this.thoughts],
      actions: [...this.actions],
      observations: [...this.observations],
      hypothesis: this.currentHypothesis,
      timestamp: Date.now()
    };
  }
  
  private async saveSnapshots(error: ParsedError): Promise<void> {
    const filename = `debug-${error.type}-${Date.now()}.json`;
    const data = {
      error,
      snapshots: this.snapshots,
      finalResult: this.result
    };
    
    await fs.promises.writeFile(
      path.join(__dirname, '../debug', filename),
      JSON.stringify(data, null, 2)
    );
    
    console.log(`Debug snapshots saved to ${filename}`);
  }
}
```

### Debug Strategy 4: Assertions for Invariants
```typescript
// Use assertions to catch bugs early
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export class ReactAgent {
  async analyze(error: ParsedError): Promise<RCAResult> {
    // Validate preconditions
    assert(error !== null, 'Error cannot be null');
    assert(error.type !== '', 'Error type cannot be empty');
    assert(error.line >= 0, 'Line number must be non-negative');
    
    for (let i = 0; i < this.maxIterations; i++) {
      const thought = await this.generateThought();
      
      // Validate intermediate state
      assert(thought !== '', 'Thought cannot be empty');
      assert(this.thoughts.length === i + 1, 'Thoughts array out of sync');
      
      const action = await this.selectAction(thought);
      
      // Validate action
      assert(action !== null, 'Action cannot be null');
      assert(action.tool !== '', 'Tool name cannot be empty');
      
      const observation = await this.executeAction(action);
      
      // Validate observation
      assert(observation !== '', 'Observation cannot be empty');
    }
    
    const result = this.synthesizeResult();
    
    // Validate postconditions
    assert(result.rootCause !== '', 'Root cause cannot be empty');
    assert(result.fixGuidelines.length > 0, 'Must provide fix guidelines');
    assert(result.confidence >= 0 && result.confidence <= 1, 'Confidence must be 0-1');
    
    return result;
  }
}
```

---

## 📈 Performance Profiling

### Profiling Technique 1: Built-in Performance Marks
```typescript
// Use performance API for accurate timing
import { performance } from 'perf_hooks';

export class ProfiledAgent extends ReactAgent {
  async analyze(error: ParsedError): Promise<RCAResult> {
    performance.mark('analysis-start');
    
    // Parse error
    performance.mark('parse-start');
    const parsed = this.parseError(error);
    performance.mark('parse-end');
    performance.measure('parsing', 'parse-start', 'parse-end');
    
    // Check cache
    performance.mark('cache-start');
    const cached = await this.checkCache(parsed);
    performance.mark('cache-end');
    performance.measure('cache-lookup', 'cache-start', 'cache-end');
    
    if (cached) {
      performance.mark('analysis-end');
      performance.measure('total-analysis', 'analysis-start', 'analysis-end');
      this.logPerformance();
      return cached;
    }
    
    // Run analysis iterations
    for (let i = 0; i < this.maxIterations; i++) {
      performance.mark(`iteration-${i}-start`);
      
      performance.mark(`llm-${i}-start`);
      const thought = await this.llm.generate(prompt);
      performance.mark(`llm-${i}-end`);
      performance.measure(`llm-iteration-${i}`, `llm-${i}-start`, `llm-${i}-end`);
      
      performance.mark(`tool-${i}-start`);
      const observation = await this.executeTool(action);
      performance.mark(`tool-${i}-end`);
      performance.measure(`tool-iteration-${i}`, `tool-${i}-start`, `tool-${i}-end`);
      
      performance.mark(`iteration-${i}-end`);
      performance.measure(`iteration-${i}`, `iteration-${i}-start`, `iteration-${i}-end`);
    }
    
    performance.mark('analysis-end');
    performance.measure('total-analysis', 'analysis-start', 'analysis-end');
    
    this.logPerformance();
    
    return this.synthesizeResult();
  }
  
  private logPerformance(): void {
    const measures = performance.getEntriesByType('measure');
    
    console.log('Performance Profile:');
    console.log('===================');
    
    for (const measure of measures) {
      console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`);
    }
    
    // Clear marks and measures
    performance.clearMarks();
    performance.clearMeasures();
  }
}
```

### Profiling Technique 2: Memory Usage Tracking
```typescript
// Monitor memory usage
export class MemoryMonitor {
  private baseline: NodeJS.MemoryUsage;
  private checkpoints: Map<string, NodeJS.MemoryUsage> = new Map();
  
  constructor() {
    this.baseline = process.memoryUsage();
  }
  
  checkpoint(label: string): void {
    const usage = process.memoryUsage();
    this.checkpoints.set(label, usage);
    
    const heapDelta = (usage.heapUsed - this.baseline.heapUsed) / 1024 / 1024;
    const externalDelta = (usage.external - this.baseline.external) / 1024 / 1024;
    
    console.log(`Memory Checkpoint "${label}":`);
    console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB (Δ ${heapDelta.toFixed(2)}MB)`);
    console.log(`  External: ${(usage.external / 1024 / 1024).toFixed(2)}MB (Δ ${externalDelta.toFixed(2)}MB)`);
  }
  
  report(): void {
    const current = process.memoryUsage();
    const totalHeapGrowth = (current.heapUsed - this.baseline.heapUsed) / 1024 / 1024;
    
    console.log('\nMemory Usage Report:');
    console.log('====================');
    console.log(`Total Heap Growth: ${totalHeapGrowth.toFixed(2)}MB`);
    console.log(`Current Heap: ${(current.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Heap Limit: ${(current.heapTotal / 1024 / 1024).toFixed(2)}MB`);
  }
}

// Usage
const monitor = new MemoryMonitor();

monitor.checkpoint('before-analysis');
await agent.analyze(error);
monitor.checkpoint('after-analysis');

monitor.checkpoint('before-db-store');
await db.store(rca);
monitor.checkpoint('after-db-store');

monitor.report();
```

---

## 🔒 Security Best Practices

### Security Practice 1: Prompt Injection Defense
```typescript
// Prevent malicious prompts
export class PromptSanitizer {
  private static dangerousPatterns = [
    /ignore\s+(previous|all|prior)\s+(instructions|commands|rules)/gi,
    /forget\s+(previous|all|prior)\s+(instructions|commands|rules)/gi,
    /you\s+are\s+now\s+a/gi,
    /system\s*:/gi,
    /\<\|endoftext\|\>/g,
    /\<\|im_start\|\>/g,
    /\<\|im_end\|\>/g,
  ];
  
  static sanitize(input: string): string {
    let sanitized = input;
    
    // Remove dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    // Limit length
    if (sanitized.length > 50000) {
      sanitized = sanitized.slice(0, 50000) + '\n[TRUNCATED]';
    }
    
    return sanitized;
  }
  
  static isPromptInjection(input: string): boolean {
    return this.dangerousPatterns.some(pattern => pattern.test(input));
  }
}
```

### Security Practice 2: Rate Limiting
```typescript
// Prevent abuse of LLM API
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside window
    const recentRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    
    return true; // OK to proceed
  }
  
  async waitForSlot(userId: string): Promise<void> {
    while (!(await this.checkLimit(userId))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Usage
const rateLimiter = new RateLimiter(100, 60000);

if (!(await rateLimiter.checkLimit(userId))) {
  throw new Error('Rate limit exceeded. Please wait before retrying.');
}
```

### Security Practice 3: Secure Configuration
```typescript
// Never hardcode secrets
export class SecureConfig {
  private secrets: Map<string, string> = new Map();
  
  constructor() {
    // Load from environment variables
    this.secrets.set('ollama_api_key', process.env.OLLAMA_API_KEY || '');
    this.secrets.set('chroma_auth_token', process.env.CHROMA_AUTH_TOKEN || '');
  }
  
  getSecret(key: string): string {
    const value = this.secrets.get(key);
    if (!value) {
      throw new Error(`Secret not found: ${key}`);
    }
    return value;
  }
  
  // Never log secrets
  toString(): string {
    return '[SecureConfig - secrets hidden]';
  }
  
  toJSON(): object {
    return { type: 'SecureConfig', secretCount: this.secrets.size };
  }
}

// Usage
const config = new SecureConfig();
const apiKey = config.getSecret('ollama_api_key');

// WRONG: Never do this
console.log('API Key:', apiKey); // ❌ Leaks secret

// CORRECT
console.log('API Key configured:', !!apiKey); // ✅ Just check existence
```

**This is Kai's complete work breakdown with advanced best practices, implementation patterns, and comprehensive guidelines. Sokchea handles all UI/integration separately.**


