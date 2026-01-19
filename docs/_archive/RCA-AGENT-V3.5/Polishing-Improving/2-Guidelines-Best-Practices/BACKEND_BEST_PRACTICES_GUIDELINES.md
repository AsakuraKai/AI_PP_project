# Backend Best Practices Guidelines

**Document Version:** 1.1  
**Last Updated:** January 16, 2026 (Phase 1 Complete)  
**Status:** Phase 1 (Foundation) ✅ **COMPLETE** | Phase 2-3 **PENDING**  
**Purpose:** Comprehensive guidelines for maintaining and improving the RCA backend codebase

---

## 🎯 Implementation Status Summary

### ✅ Phase 1: Foundation (Week 1) - COMPLETE

**Completed Items:**
- ✅ **Day 1-2: Structured Logging** - Logger utility created and integrated into OllamaClient, HistoricalPatternTool
- ✅ **Day 3-4: Error Handling** - AppErrors hierarchy created and integrated into types.ts with backward compatibility
- ✅ **Day 5: Type Safety & Config** - AppConfig, Environment, Disposable utilities created with .env.example
- ✅ **TypeScript Compilation** - All changes verified (npm run compile exit code 0)

**Files Created:**
- `src/utils/Logger.ts` - Structured logging with LogLevel enum
- `src/errors/AppErrors.ts` - Typed error hierarchy (AppError, ServiceError, LLMError, ValidationError, TimeoutError)
- `src/utils/Disposable.ts` - Disposable pattern with DisposableStore
- `src/config/AppConfig.ts` - Centralized configuration management
- `src/config/Environment.ts` - Lightweight .env loader
- `.env.example` - Documented environment variables

**Files Modified:**
- `src/utils/index.ts` - Added Logger and Disposable exports
- `src/types.ts` - Re-exported AppErrors with backward compatibility
- `src/llm/OllamaClient.ts` - Migrated to Logger (8 console.* calls replaced)
- `src/tools/HistoricalPatternTool.ts` - Migrated to Logger (14+ console.* calls replaced)

### 🔄 Phase 2: Stability (Week 2) - PENDING
- ⏳ Resource cleanup adoption in services
- ⏳ AppConfig migration across backend
- ⏳ Initialization guards for race conditions

### 📋 Phase 3: Quality (Week 3) - PENDING  
- ⏳ Dependency injection patterns
- ⏳ JSDoc documentation
- ⏳ Remaining type safety improvements

---

## Table of Contents

1. [Overview](#overview)
2. [Critical Standards](#critical-standards)
3. [High Priority Guidelines](#high-priority-guidelines)
4. [Medium Priority Guidelines](#medium-priority-guidelines)
5. [Code Quality Standards](#code-quality-standards)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Examples and Patterns](#examples-and-patterns)

---

## Overview

This document provides best practices for the RCA agent backend codebase. Following these guidelines ensures:
- **Maintainability**: Code that's easy to understand and modify
- **Reliability**: Robust error handling and resource management
- **Testability**: Code that can be effectively unit tested
- **Performance**: Efficient resource usage and monitoring
- **Security**: Safe handling of sensitive data and external inputs

### Current Architecture

```
Backend Components:
├── Agent Layer (MinimalReactAgent, PromptEngine)
├── LLM Layer (OllamaClient)
├── Knowledge Layer (ChromaDB, RCACache, FewShotService)
├── Tools Layer (ReadFileTool, LSPTool, VersionLookupTool)
└── Utils Layer (ErrorParser, Validators, PerformanceTracker)
```

---

## Critical Standards

### � 1. Structured Logging

**Status:** ✅ **IMPLEMENTED** - `src/utils/Logger.ts` created and adopted  
**Progress:** OllamaClient ✅ | HistoricalPatternTool ✅ | Remaining files ⏳

**Completed Solution:**
- ✅ Centralized Logger utility in `src/utils/Logger.ts`
  - LogLevel enum (DEBUG=0, INFO=1, WARN=2, ERROR=3)
  - Context-aware logging with timestamp and metadata
  - Static setLevel() for global log level control
  - Methods: debug(), info(), warn(), error()
- ✅ Integrated into key backend files
- ✅ Log level configuration via AppConfig and Environment

#### Create Logger Utility

```typescript
// src/utils/Logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogMeta {
  [key: string]: any;
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  
  constructor(private readonly context: string) {}
  
  static setLevel(level: LogLevel): void {
    Logger.level = level;
  }
  
  debug(message: string, meta?: LogMeta): void {
    this.log(LogLevel.DEBUG, message, meta);
  }
  
  info(message: string, meta?: LogMeta): void {
    this.log(LogLevel.INFO, message, meta);
  }
  
  warn(message: string, meta?: LogMeta): void {
    this.log(LogLevel.WARN, message, meta);
  }
  
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorMeta = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : { error: String(error) };
    this.log(LogLevel.ERROR, message, { ...meta, ...errorMeta });
  }
  
  private log(level: LogLevel, message: string, meta?: LogMeta): void {
    if (level < Logger.level) return;
    
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    
    const logMessage = `[${timestamp}] [${levelStr}] [${this.context}] ${message}${metaStr}`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}
```

#### Usage Pattern

```typescript
// Before
console.log('[AnalysisService] Initialized successfully');
console.warn('ChromaDB initialization failed:', err.message);
console.error('Failed to connect:', error);

// After
export class AnalysisService {
  private readonly logger = new Logger('AnalysisService');
  
  async initialize(): Promise<void> {
    this.logger.info('Initializing', { ollamaUrl, model, chromaUrl });
    
    try {
      this._client = new OllamaClient({ baseUrl: ollamaUrl, model });
      this.logger.info('Ollama client initialized');
    } catch (error) {
      this.logger.error('ChromaDB initialization failed', error, { chromaUrl });
      this._chromaDB = undefined;
    }
    
    this.logger.info('Initialized successfully');
  }
}
```

**Migration Path:**
1. ✅ Create `Logger` utility class → Completed in `src/utils/Logger.ts`
2. ⏳ Replace all `console.*` in remaining backend files → Started (2 of ~20+ files complete)
3. ✅ Keep webview console.* for browser DevTools → Architecture decision made
4. ✅ Set log level via configuration → Implemented in Environment/AppConfig

**Example Usage:**
```typescript
import { Logger } from '../utils/Logger';

class MyService {
  private readonly logger = new Logger('MyService');
  
  async init() {
    this.logger.info('Service initialized', { port: 8080 });
    this.logger.warn('Deprecated API usage detected');
    this.logger.error('Connection failed', { error, retryCount: 3 });
  }
}
```

---

### 🔴 2. Eliminate `any` Types

**Current Issue:** 20+ instances of `any` type, weakening type safety

**Problem:**
- Loss of IDE autocomplete and type checking
- Runtime errors that TypeScript should catch
- Difficult to refactor safely

**Solution:** Define proper interfaces for all types

#### Message Types

```typescript
// vscode-extension/src/types/messages.ts

export interface WebviewMessage {
  command: string;
  data?: unknown;
}

export interface AnalyzeErrorMessage extends WebviewMessage {
  command: 'analyzeError';
  data: {
    errorId: string;
    settings?: AnalysisSettings;
  };
}

export interface SubmitFeedbackMessage extends WebviewMessage {
  command: 'submitFeedback';
  data: {
    resultId: string;
    helpful: boolean;
    comments?: string;
  };
}

// Union type for all messages
export type VSCodeMessage = 
  | AnalyzeErrorMessage 
  | SubmitFeedbackMessage 
  | ApplyFixMessage
  | UpdateConfigMessage;
```

#### Error Handling Types

```typescript
// Before
catch (error: any) {
  console.error('Failed:', error.message);
}

// After
catch (error: unknown) {
  if (error instanceof Error) {
    this.logger.error('Operation failed', error);
  } else {
    this.logger.error('Unknown error', new Error(String(error)));
  }
}
```

#### VS Code API Types

```typescript
// vscode-extension/src/hooks/useVSCode.ts

// Before
interface VSCodeAPI {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
}

// After
interface VSCodeAPI<TState = unknown> {
  postMessage(message: WebviewMessage): void;
  setState(state: TState): void;
  getState(): TState | undefined;
}

interface WebviewState {
  errors: ErrorItem[];
  selectedErrorId?: string;
  analysisHistory: RCAResult[];
}

const vscode = acquireVsCodeApi<WebviewState>();
```

**Replacement Priority:**
1. Message handlers (highest risk)
2. Error catch blocks
3. VS Code API interfaces
4. Generic data parameters

---

### � 3. Consistent Error Handling

**Status:** ✅ **IMPLEMENTED** - `src/errors/AppErrors.ts` created with backward compatibility

**Completed Solution:**
- ✅ Typed error hierarchy in `src/errors/AppErrors.ts`
  - `AppError`: Base class with code, isRetryable, details
  - `ServiceError`: Named service with context
  - `LLMError`: StatusCode + backward-compatible `retryable` getter
  - `ValidationError`: Field and value context
  - `TimeoutError`: Operation and timeoutMs tracking
- ✅ Re-exported from `src/types.ts` for backward compatibility
- ✅ Error.captureStackTrace for proper stack traces

**Usage:**
```typescript
throw new LLMError('Connection failed', {
  statusCode: 503,
  isRetryable: true,
  details: { url: endpoint, attempts: 3 }
});
```

#### Error Class Hierarchy

```typescript
// src/errors/AppErrors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ServiceError extends AppError {
  constructor(
    message: string,
    code: string,
    isRetryable: boolean = false,
    public readonly service: string,
    details?: Record<string, unknown>
  ) {
    super(message, code, isRetryable, details);
  }
}

export class LLMError extends ServiceError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    isRetryable: boolean = false
  ) {
    super(message, 'LLM_ERROR', isRetryable, 'OllamaClient', { statusCode });
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message, 'VALIDATION_ERROR', false, { field, value });
  }
}

export class TimeoutError extends AppError {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(message, 'TIMEOUT_ERROR', true, { operation, timeoutMs });
  }
}
```

#### Error Handling Patterns

```typescript
// Pattern 1: Service layer - wrap and rethrow with context
export class AnalysisService {
  async initialize(): Promise<void> {
    try {
      this._client = new OllamaClient({ baseUrl: ollamaUrl, model });
    } catch (error) {
      throw new ServiceError(
        'Failed to initialize Ollama client',
        'OLLAMA_INIT_FAILED',
        false,
        'AnalysisService',
        { ollamaUrl, model, cause: error }
      );
    }
  }
}

// Pattern 2: Agent layer - graceful degradation
export class MinimalReactAgent {
  private registerTools(): void {
    try {
      this.toolRegistry.register('read_file', this.readFileTool, schema);
    } catch (error) {
      // Tool already registered - graceful continue
      if (error instanceof Error && error.message.includes('already registered')) {
        this.logger.debug('Tool already registered', { tool: 'read_file' });
        return;
      }
      // Unexpected error - rethrow
      throw new ServiceError(
        'Failed to register tool',
        'TOOL_REGISTRATION_FAILED',
        false,
        'MinimalReactAgent',
        { tool: 'read_file', cause: error }
      );
    }
  }
}

// Pattern 3: UI layer - user-friendly messages
private async _handleAnalyzeError(error: unknown): Promise<void> {
  try {
    await this.analysisService.analyzeError(errorData);
  } catch (error) {
    let userMessage = 'Analysis failed. Please try again.';
    
    if (error instanceof TimeoutError) {
      userMessage = `Analysis timed out after ${error.timeoutMs / 1000}s. Try a simpler error.`;
    } else if (error instanceof LLMError && error.statusCode === 404) {
      userMessage = 'LLM model not found. Check your Ollama installation.';
    } else if (error instanceof ValidationError) {
      userMessage = `Invalid input: ${error.message}`;
    }
    
    this.logger.error('Analysis failed', error);
    this._sendToWebview({ command: 'analysisFailed', error: userMessage });
  }
}
```

**Error Handling Checklist:**
- [ ] Always preserve original error in `cause` field
- [ ] Include relevant context in `details`
- [ ] Mark errors as retryable when appropriate
- [ ] Convert to user-friendly messages at UI boundary
- [ ] Log errors before rethrowing

---

## High Priority Guidelines

### � 4. Resource Cleanup (Disposable Pattern)

**Status:** ✅ **UTILITY CREATED** - `src/utils/Disposable.ts` | ⏳ **ADOPTION PENDING** in services

**Completed Solution:**
- ✅ Created `src/utils/Disposable.ts` with:
  - `IDisposable` interface (dispose() contract)
  - `DisposableStore`: Collection that disposes in reverse order
  - Guards against double-dispose
  - Resilient error handling during cleanup
- ⏳ Ready for adoption in: AnalysisService, MinimalReactAgent, ChromaDB wrappers

**Example:**
```typescript
class MyService implements IDisposable {
  private readonly disposables = new DisposableStore();
  
  constructor() {
    const timer = setInterval(() => {}, 5000);
    this.disposables.add({ dispose: () => clearInterval(timer) });
  }
  
  dispose() {
    this.disposables.dispose();
  }
}
```

#### Pattern Implementation

```typescript
// src/utils/Disposable.ts

export interface IDisposable {
  dispose(): void;
}

export class DisposableStore implements IDisposable {
  private items: IDisposable[] = [];
  private isDisposed = false;
  
  add<T extends IDisposable>(item: T): T {
    if (this.isDisposed) {
      item.dispose();
      throw new Error('DisposableStore already disposed');
    }
    this.items.push(item);
    return item;
  }
  
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    
    this.items.reverse().forEach(item => {
      try {
        item.dispose();
      } catch (error) {
        console.error('Error disposing item:', error);
      }
    });
    this.items = [];
  }
}
```

#### Service with Cleanup

```typescript
export class AnalysisService implements IDisposable {
  private readonly disposables = new DisposableStore();
  
  async initialize(): Promise<void> {
    // Add disposable resources
    if (this._chromaDB) {
      this.disposables.add({
        dispose: () => this._chromaDB?.disconnect?.()
      });
    }
    
    if (this._cache) {
      this.disposables.add(this._cache);
    }
    
    if (this._stateStream) {
      this.disposables.add(this._stateStream);
    }
    
    if (this._timeoutHandler) {
      this.disposables.add(this._timeoutHandler);
    }
  }
  
  dispose(): void {
    this.disposables.dispose();
  }
}

// RCACache with cleanup
export class RCACache implements IDisposable {
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}
```

---

### � 5. Configuration Management

**Status:** ✅ **IMPLEMENTED** - `src/config/AppConfig.ts` created | ⏳ **ADOPTION PENDING** in services

**Completed Solution:**
- ✅ Centralized `src/config/AppConfig.ts` with:
  - Typed config interfaces: OllamaConfig, ChromaConfig, CacheConfig, AgentConfig
  - Static getters for each domain
  - Private validation helpers (getString, getNumber, getBoolean)
  - Environment variable priority: config > env > defaults
- ✅ Environment loader in `src/config/Environment.ts`
- ✅ Comprehensive `.env.example` documentation
- ⏳ Services still need migration from vscode.workspace.getConfiguration

**Example:**
```typescript
import { AppConfig } from '../config/AppConfig';

const ollama = AppConfig.getOllamaConfig();
const chroma = AppConfig.getChromaConfig();
```

#### Configuration Module

```typescript
// src/config/AppConfig.ts

import * as vscode from 'vscode';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

export interface ChromaConfig {
  url: string;
  collectionName: string;
  timeout: number;
}

export interface CacheConfig {
  ttl: number;
  maxEntries: number;
  cleanupInterval: number;
}

export interface AgentConfig {
  maxIterations: number;
  timeout: number;
  usePromptEngine: boolean;
  generateFix: boolean;
  enableProgressivePrompting: boolean;
}

export class AppConfig {
  private static readonly CONFIG_PREFIX = 'rcaAgent';
  
  static get ollama(): OllamaConfig {
    return {
      baseUrl: this.getString('ollamaUrl', 'http://localhost:11434'),
      model: this.getModel(),
      timeout: this.getNumber('timeout', 90000),
      maxRetries: this.getNumber('maxRetries', 3)
    };
  }
  
  static get chroma(): ChromaConfig {
    const configValue = this.getString('chromaDbPath', 'http://localhost:8000');
    return {
      url: /^https?:\/\//i.test(configValue) 
        ? configValue 
        : 'http://localhost:8000',
      collectionName: 'rca_solutions',
      timeout: 30000
    };
  }
  
  static get cache(): CacheConfig {
    return {
      ttl: this.getNumber('cacheTtl', 24 * 60 * 60 * 1000),
      maxEntries: this.getNumber('maxCacheEntries', 1000),
      cleanupInterval: 5 * 60 * 1000
    };
  }
  
  static get agent(): AgentConfig {
    return {
      maxIterations: this.getNumber('maxIterations', 10),
      timeout: this.getNumber('timeout', 90000),
      usePromptEngine: this.getBoolean('usePromptEngine', true),
      generateFix: this.getBoolean('generateFix', true),
      enableProgressivePrompting: this.getBoolean('enableProgressivePrompting', false)
    };
  }
  
  private static getModel(): string {
    // Priority: config > env > default
    const config = this.getString('model');
    if (config) return config;
    
    const envModel = process.env.AI_PP_OLLAMA_MODEL || process.env.OLLAMA_MODEL;
    if (envModel) return envModel;
    
    return 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest';
  }
  
  private static getString(key: string, defaultValue: string = ''): string {
    return vscode.workspace
      .getConfiguration(this.CONFIG_PREFIX)
      .get<string>(key, defaultValue);
  }
  
  private static getNumber(key: string, defaultValue: number): number {
    return vscode.workspace
      .getConfiguration(this.CONFIG_PREFIX)
      .get<number>(key, defaultValue);
  }
  
  private static getBoolean(key: string, defaultValue: boolean): boolean {
    return vscode.workspace
      .getConfiguration(this.CONFIG_PREFIX)
      .get<boolean>(key, defaultValue);
  }
}
```

#### Usage

```typescript
// Before
const config = vscode.workspace.getConfiguration('rcaAgent');
const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434');
const model = config.get<string>('model', 'default-model');

// After
const ollamaConfig = AppConfig.ollama;
this._client = new OllamaClient({
  baseUrl: ollamaConfig.baseUrl,
  model: ollamaConfig.model,
  timeout: ollamaConfig.timeout
});
```

---

### � 6. Environment Variables Documentation

**Status:** ✅ **COMPLETED** - `.env.example` and `src/config/Environment.ts` created

**Variables Documented:**
- `AI_PP_OLLAMA_MODEL` - Model selection with priority chain
- `OLLAMA_BASE_URL` - Ollama server URL
- `CHROMA_URL` - ChromaDB server URL
- `CHROMA_COLLECTION` - Collection name
- `NODE_ENV` - Development/test/production mode
- `LOG_LEVEL` - DEBUG/INFO/WARN/ERROR
- `DEBUG` - Enable debug mode
- `JEST_WORKER_ID` - Test environment detection

#### Create .env.example

```bash
# .env.example

# ===========================
# Ollama Configuration
# ===========================
# Model to use for LLM inference
# Priority: VS Code config > AI_PP_OLLAMA_MODEL > OLLAMA_MODEL > default
AI_PP_OLLAMA_MODEL=hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# Ollama server base URL
OLLAMA_BASE_URL=http://localhost:11434

# ===========================
# ChromaDB Configuration
# ===========================
# ChromaDB server URL for vector database
CHROMA_URL=http://localhost:8000

# Collection name for RCA documents
CHROMA_COLLECTION=rca_solutions

# ===========================
# Development
# ===========================
# Environment mode
NODE_ENV=development

# Log level (DEBUG=0, INFO=1, WARN=2, ERROR=3)
LOG_LEVEL=1

# Enable debug logging
DEBUG=false

# ===========================
# Testing
# ===========================
# Jest worker ID (set by Jest automatically)
# JEST_WORKER_ID=1
```

#### Environment Loading

```typescript
// src/config/Environment.ts

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

export class Environment {
  static load(): void {
    const envPath = join(process.cwd(), '.env');
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }
  
  static get isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
  
  static get isTest(): boolean {
    return !!process.env.JEST_WORKER_ID;
  }
  
  static get logLevel(): number {
    return parseInt(process.env.LOG_LEVEL || '1', 10);
  }
}

// Initialize at startup
// src/extension.ts
export function activate(context: vscode.ExtensionContext) {
  Environment.load();
  Logger.setLevel(Environment.logLevel);
  // ...
}
```

---

## Medium Priority Guidelines

### 🟡 7. Async Initialization Guards

**Current Issue:** Potential race conditions from concurrent initialization

**Solution:** Idempotent initialization with guards

```typescript
export class AnalysisService {
  private initPromise?: Promise<void>;
  private initialized = false;
  
  async initialize(): Promise<void> {
    // Already initialized
    if (this.initialized) {
      return;
    }
    
    // Initialization in progress - wait for it
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // Start new initialization
    this.initPromise = this._initialize();
    
    try {
      await this.initPromise;
      this.initialized = true;
    } finally {
      this.initPromise = undefined;
    }
  }
  
  private async _initialize(): Promise<void> {
    // Actual initialization logic
    this._client = new OllamaClient(AppConfig.ollama);
    this._chromaDB = await ChromaDBClient.create(AppConfig.chroma);
    this._cache = new RCACache(AppConfig.cache);
    this._agent = new MinimalReactAgent(this._client, AppConfig.agent);
  }
  
  // Ensure initialized before operations
  async analyzeError(error: ParsedError): Promise<RCAResult> {
    await this.initialize();
    return this._agent!.analyze(error);
  }
}
```

---

### 🟡 8. Dependency Injection for Testability

**Current Issue:** Hard-coded dependencies and singletons

**Solution:** Accept dependencies through constructor

```typescript
// Before - tight coupling
export class MinimalReactAgent {
  constructor(llm: OllamaClient, config?: AgentConfig) {
    this.toolRegistry = ToolRegistry.getInstance(); // Singleton
    this.promptEngine = new PromptEngine(); // Hard-coded
    this.fixGenerator = new FixGenerator(llm, readFileTool, projectRoot);
  }
}

// After - dependency injection
export class MinimalReactAgent {
  constructor(
    protected llm: OllamaClient,
    config?: AgentConfig,
    private toolRegistry: ToolRegistry = ToolRegistry.getInstance(),
    private promptEngine: PromptEngine = new PromptEngine(),
    private fixGenerator?: FixGenerator
  ) {
    this.fixGenerator = fixGenerator || new FixGenerator(
      llm,
      new ReadFileTool(),
      config?.projectRoot || process.cwd()
    );
  }
}

// Testing with mocks
describe('MinimalReactAgent', () => {
  it('should analyze error', async () => {
    const mockLLM = createMockOllamaClient();
    const mockToolRegistry = createMockToolRegistry();
    const mockPromptEngine = createMockPromptEngine();
    
    const agent = new MinimalReactAgent(
      mockLLM,
      { maxIterations: 5 },
      mockToolRegistry,
      mockPromptEngine
    );
    
    const result = await agent.analyze(testError);
    expect(result.rootCause).toBeDefined();
  });
});
```

---

## Code Quality Standards

### Documentation Requirements

```typescript
/**
 * Brief one-line description of the class/function
 * 
 * Detailed explanation of what this does, when to use it,
 * and any important considerations or limitations.
 * 
 * @example
 * ```typescript
 * const service = new AnalysisService();
 * await service.initialize();
 * const result = await service.analyzeError(parsedError);
 * ```
 * 
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter
 * @returns Description of return value
 * @throws {ServiceError} When initialization fails
 * @throws {ValidationError} When input is invalid
 */
```

### Naming Conventions

```typescript
// Classes: PascalCase
class AnalysisService {}

// Interfaces: PascalCase with 'I' prefix for core interfaces
interface IDisposable {}
interface AnalysisConfig {}

// Functions/Methods: camelCase
async analyzeError(): Promise<RCAResult> {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 90000;

// Private fields: underscore prefix
private _client?: OllamaClient;
private _initialized = false;

// Type aliases: PascalCase
type AnalysisResult = RCAResult | null;
```

### File Organization

```typescript
// 1. Imports (grouped and sorted)
import * as vscode from 'vscode';
import { ParsedError, RCAResult } from '../types';
import { OllamaClient } from '../llm/OllamaClient';
import { Logger } from '../utils/Logger';

// 2. Type definitions
export interface ServiceConfig {}

// 3. Constants
const DEFAULT_TIMEOUT = 90000;

// 4. Main class
export class AnalysisService {
  // Static members
  private static _instance: AnalysisService;
  
  // Instance fields (public first, then private)
  public readonly name: string;
  private readonly logger: Logger;
  private _client?: OllamaClient;
  
  // Constructor
  constructor() {}
  
  // Static methods
  static getInstance(): AnalysisService {}
  
  // Public methods (lifecycle first)
  async initialize(): Promise<void> {}
  dispose(): void {}
  
  // Public methods (alphabetical)
  async analyzeError(): Promise<RCAResult> {}
  
  // Private methods (alphabetical)
  private async _initialize(): Promise<void> {}
}

// 5. Helper functions (if any)
function parseErrorMessage(msg: string): ParsedError {}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1) - ✅ COMPLETE

**Priority: Critical issues affecting reliability and debugging**

- [x] **Day 1-2: Structured Logging** ✅
  - [x] Create `src/utils/Logger.ts`
  - [x] Integrate Logger in OllamaClient and HistoricalPatternTool
  - [x] Add log level configuration via AppConfig
  - [x] Export from `src/utils/index.ts`
  - [ ] Complete remaining console.* replacement (ongoing)

- [x] **Day 3-4: Error Handling** ✅
  - [x] Create `src/errors/AppErrors.ts` with typed error hierarchy
  - [x] Re-export from `src/types.ts` with backward compatibility
  - [x] Support LLMError.retryable for legacy code
  - [ ] Update all error catch blocks (ongoing)

- [x] **Day 5: Type Safety & Config** ✅
  - [x] Create `src/config/AppConfig.ts` with centralized configuration
  - [x] Create `src/config/Environment.ts` with .env loading
  - [x] Create `.env.example` with documentation
  - [x] Create `src/utils/Disposable.ts` for resource cleanup
  - [ ] Remove scattered config reads (ongoing)

### Phase 2: Stability (Week 2) - ⏳ PENDING

**Priority: Resource management and configuration adoption**

- [ ] **Day 1-2: Resource Cleanup Adoption**
  - [ ] Implement `IDisposable` in AnalysisService
  - [ ] Implement `IDisposable` in MinimalReactAgent
  - [ ] Add cleanup in ChromaDB connections
  - [ ] Test for memory leaks

- [ ] **Day 3-4: Configuration Migration**
  - [ ] Migrate AnalysisService to use AppConfig
  - [ ] Migrate MinimalReactAgent to use AppConfig
  - [ ] Remove vscode.workspace.getConfiguration calls
  - [ ] Validate configuration values

- [ ] **Day 5: Initialization Guards**
  - [ ] Add idempotent initialization pattern
  - [ ] Protect against concurrent initialization
  - [ ] Test race condition scenarios

### Phase 3: Quality (Week 3) - ⏳ PENDING

**Priority: Testability and maintainability**

- [ ] **Day 1-2: Dependency Injection**
  - [ ] Update ToolRegistry for DI
  - [ ] Update service constructors
  - [ ] Create factory functions
  - [ ] Update unit tests

- [ ] **Day 3-4: Documentation**
  - [ ] Add JSDoc to public APIs
  - [ ] Create usage examples
  - [ ] Document error patterns
  - [ ] Update README

- [ ] **Day 5: Code Review & Cleanup**
  - [ ] Address TODOs with GitHub issues
  - [ ] Review type definitions
  - [ ] Performance profiling

---

## Examples and Patterns

### Complete Service Example

```typescript
// src/services/AnalysisService.ts

import * as vscode from 'vscode';
import { Logger } from '../utils/Logger';
import { AppConfig } from '../config/AppConfig';
import { DisposableStore, IDisposable } from '../utils/Disposable';
import { ServiceError, ValidationError } from '../errors/AppErrors';
import { ParsedError, RCAResult } from '../types';
import { MinimalReactAgent } from '../agent/MinimalReactAgent';
import { OllamaClient } from '../llm/OllamaClient';
import { ChromaDBClient } from '../db/ChromaDBClient';
import { RCACache } from '../cache/RCACache';

export class AnalysisService implements IDisposable {
  private static _instance: AnalysisService;
  private readonly logger = new Logger('AnalysisService');
  private readonly disposables = new DisposableStore();
  
  private initPromise?: Promise<void>;
  private initialized = false;
  
  private _agent?: MinimalReactAgent;
  private _client?: OllamaClient;
  private _chromaDB?: ChromaDBClient;
  private _cache?: RCACache;
  
  private constructor() {
    this.logger.debug('Service created');
  }
  
  static getInstance(): AnalysisService {
    if (!AnalysisService._instance) {
      AnalysisService._instance = new AnalysisService();
    }
    return AnalysisService._instance;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.debug('Already initialized');
      return;
    }
    
    if (this.initPromise) {
      this.logger.debug('Initialization in progress, waiting...');
      return this.initPromise;
    }
    
    this.logger.info('Starting initialization');
    this.initPromise = this._initialize();
    
    try {
      await this.initPromise;
      this.initialized = true;
      this.logger.info('Initialization complete');
    } finally {
      this.initPromise = undefined;
    }
  }
  
  private async _initialize(): Promise<void> {
    try {
      // Initialize Ollama client
      const ollamaConfig = AppConfig.ollama;
      this._client = new OllamaClient(ollamaConfig);
      this.logger.info('Ollama client initialized', { 
        model: ollamaConfig.model 
      });
      
      // Initialize ChromaDB (optional)
      try {
        const chromaConfig = AppConfig.chroma;
        this._chromaDB = await ChromaDBClient.create(chromaConfig);
        this.disposables.add({
          dispose: () => this._chromaDB?.disconnect?.()
        });
        this.logger.info('ChromaDB initialized', { url: chromaConfig.url });
      } catch (error) {
        this.logger.warn('ChromaDB unavailable, continuing without cache', error);
      }
      
      // Initialize cache
      const cacheConfig = AppConfig.cache;
      this._cache = new RCACache(cacheConfig);
      this.disposables.add(this._cache);
      
      // Initialize agent
      const agentConfig = AppConfig.agent;
      this._agent = new MinimalReactAgent(this._client, agentConfig);
      
    } catch (error) {
      this.logger.error('Initialization failed', error);
      throw new ServiceError(
        'Failed to initialize AnalysisService',
        'INIT_FAILED',
        false,
        'AnalysisService',
        { cause: error }
      );
    }
  }
  
  async analyzeError(error: ParsedError): Promise<RCAResult> {
    await this.initialize();
    
    if (!error?.message) {
      throw new ValidationError(
        'Error message is required',
        'message',
        error
      );
    }
    
    this.logger.info('Starting analysis', { 
      errorType: error.type,
      message: error.message.substring(0, 100)
    });
    
    try {
      const result = await this._agent!.analyze(error);
      this.logger.info('Analysis complete', {
        confidence: result.confidence,
        iterations: result.iterations
      });
      return result;
    } catch (error) {
      this.logger.error('Analysis failed', error, { 
        errorType: error.type 
      });
      throw error;
    }
  }
  
  dispose(): void {
    this.logger.info('Disposing service');
    this.disposables.dispose();
    this.initialized = false;
  }
}
```

---

## Checklist for New Code

When adding new code, verify:

- [x] No `console.*` - use `Logger` instead ✅ (Logger.ts created, adopted in key services)
- [ ] No `any` types - define proper interfaces (In progress: ~166 instances remain)
- [x] Errors use custom error classes ✅ (AppErrors.ts created with backward compatibility)
- [x] Long-lived resources implement `IDisposable` ✅ (Disposable.ts created, adoption pending)
- [x] Configuration accessed via `AppConfig` ✅ (AppConfig.ts created, adoption pending)
- [ ] Async initialization has guards against race conditions (To be implemented in Phase 2)
- [ ] Dependencies injected, not hard-coded (To be implemented in Phase 3)
- [ ] Public APIs have JSDoc documentation (To be completed in Phase 3)
- [ ] Unit tests with mocked dependencies (To be completed in Phase 3)
- [ ] Error handling covers edge cases (Partially complete, full adoption pending)

---

## Files Created During Phase 1

### Core Utilities
- `src/utils/Logger.ts` - Structured logging with LogLevel enum and context-aware formatting
- `src/errors/AppErrors.ts` - Typed error hierarchy (AppError, ServiceError, LLMError, ValidationError, TimeoutError)
- `src/utils/Disposable.ts` - VS Code Disposable pattern with DisposableStore for resource cleanup
- `src/config/AppConfig.ts` - Centralized configuration with typed interfaces (OllamaConfig, ChromaConfig, CacheConfig, AgentConfig)
- `src/config/Environment.ts` - Lightweight .env loader with isDevelopment/isTest/logLevel getters
- `.env.example` - Documented environment variables template

### Updated Files
- `src/utils/index.ts` - Added exports for Logger and Disposable
- `src/types.ts` - Re-exported AppErrors classes for backward compatibility
- `src/llm/OllamaClient.ts` - Migrated to Logger, removed 8 console.* calls
- `src/tools/HistoricalPatternTool.ts` - Migrated to Logger, removed 14+ console.* calls, fixed import order

---

## Related Documentation

- [RCA Error Processing Workflow](./RCA_ERROR_PROCESSING_WORKFLOW.md)
- [RCA Processing Logic and Outputs](./RCA_PROCESSING_LOGIC_AND_OUTPUTS.md)
- [Code Cleanup Summary](./CODE_CLEANUP_SUMMARY.md)
- [Review Checklist](./REVIEW_CHECKLIST.md)

---

## Next Steps (Priority Order)

### Immediate (Phase 2 - Stability)
1. ✅ Phase 1 Foundation Complete - All utilities created and compiled successfully
2. **Continue Logger adoption** - Replace remaining ~180+ console.* calls in DependencyGraphTool, other tools, and services
3. **Adopt AppConfig in services** - Migrate AnalysisService, MinimalReactAgent, and other services from vscode.workspace.getConfiguration
4. **Implement Disposable in services** - Add dispose() methods to long-lived services (AnalysisService, MinimalReactAgent, ChromaDB wrappers)
5. **Add initialization guards** - Implement idempotent initialization pattern to prevent race conditions

### Soon (Phase 3 - Quality)
6. Add comprehensive JSDoc documentation to all public APIs
7. Eliminate remaining `any` type usages (~166 instances across codebase)
8. Implement dependency injection patterns in service and tool constructors
9. Create comprehensive unit tests with mocked dependencies
10. Performance profiling and optimization

### Notes for Contributors
- All new code should follow the **Checklist for New Code** above
- Backward compatibility is maintained with existing LLMError.retryable field
- Environment variables support multiple sources: process.env > .env file > hardcoded defaults
- Logger output routes to console (future: integrate with external logging service)
- Compiled successfully: `npm run compile` exit code 0 (verified January 16, 2026)
1. Review this document with team
2. Prioritize which improvements to implement first
3. Create GitHub issues for tracking
4. Begin Phase 1 implementation
