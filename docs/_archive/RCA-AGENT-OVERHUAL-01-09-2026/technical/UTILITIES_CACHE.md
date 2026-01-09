# Utilities & Cache - Technical Reference

**Category:** Utilities & Caching  
**Purpose:** Supporting infrastructure

---

## Parsers

### ErrorParser

**Location:** `src/utils/ErrorParser.ts`

```typescript
class ErrorParser {
  static parseError(errorText: string): ParsedError
  static extractStackTrace(text: string): StackFrame[]
  static extractLocation(text: string): Location
}
```

### Specialized Parsers ([WARNING] P1 Gap)

**Not exposed via ParserRegistry**

| Parser | Location | Purpose |
|--------|----------|---------|
| KotlinParser | `src/utils/parsers/KotlinParser.ts` | Parse Kotlin errors |
| GradleParser | `src/utils/parsers/GradleParser.ts` | Parse Gradle build errors |
| XMLParser | `src/utils/parsers/XMLParser.ts` | Parse XML/manifest errors |
| JetpackComposeParser | `src/utils/parsers/JetpackComposeParser.ts` | Parse Compose errors |

**See [Integration Gaps P1.2](INTEGRATION_GAPS.md#2-parser-infrastructure-not-exposed)**

---

## Diff Formatting

### DiffFormatter

**Location:** `src/utils/DiffFormatter.ts`

```typescript
class DiffFormatter {
  static format(
    original: string,
    modified: string,
    options?: DiffOptions
  ): FormattedDiff

  static generatePatch(diff: FormattedDiff): string

  static applyPatch(original: string, patch: string): string
}
```

**Used By:** FixApplicationService  
**UI Views:** Fix Manager (diff preview)

---

## File Resolution

### FileResolver

**Location:** `src/utils/FileResolver.ts`

```typescript
class FileResolver {
  static resolve(path: string, workspaceRoot: string): string
  static relativePath(absolutePath: string, workspaceRoot: string): string
  static exists(path: string): boolean
  static isFile(path: string): boolean
  static isDirectory(path: string): boolean
}
```

---

## Language Detection

### LanguageDetector

**Location:** `src/utils/LanguageDetector.ts`

```typescript
class LanguageDetector {
  static detectFromFile(filePath: string): Language
  static detectFromContent(content: string): Language
  static detectFromError(error: string): Language
}
```

---

## Path Utilities

### PathUtils

**Location:** `src/utils/PathUtils.ts`

```typescript
class PathUtils {
  static normalize(path: string): string
  static join(...segments: string[]): string
  static dirname(path: string): string
  static basename(path: string): string
  static extname(path: string): string
}
```

---

## Caching System

### RCACache (L1)

**Location:** `src/cache/RCACache.ts`

```typescript
class RCACache {
  // Get cached result
  get(errorHash: string): RCADocument | null

  // Cache result
  set(errorHash: string, doc: RCADocument): void

  // Check if cached
  has(errorHash: string): boolean

  // Get cache statistics
  getStats(): CacheStats {
    return {
      hits: number,
      misses: number,
      size: number,
      hitRate: number
    };
  }

  // Clear cache
  clear(): void
}
```

**Features:**
- In-memory cache
- LRU eviction
- Fast lookups (< 1ms)
- Size-limited

**UI Integration:** Metrics View shows cache stats

---

### ChromaDBClient (L2)

**Location:** `src/database/ChromaDBClient.ts`

```typescript
class ChromaDBClient {
  // Add RCA to database
  async addRCA(rca: RCADocument): Promise<void>

  // Search for similar errors
  async searchSimilar(
    query: string,
    options: SearchOptions
  ): Promise<RCADocument[]>

  // Get collection
  async getCollection(name: string): Promise<Collection>

  // Delete RCA
  async deleteRCA(id: string): Promise<void>
}
```

**Features:**
- Persistent vector database
- Semantic search
- Survives restarts
- Slower than L1 (50-200ms)

** P1 Gap:** Not integrated with RCACache for two-tier caching  
**See:** [Integration Gaps P1.3](INTEGRATION_GAPS.md#3-chromadb-two-tier-caching)

---

## Performance Tracking

### PerformanceTracker

**Location:** `src/monitoring/PerformanceTracker.ts`

```typescript
class PerformanceTracker {
  // Track operation
  static track(operation: string, duration: number): void

  // Get metrics
  static getMetrics(): PerformanceMetrics {
    return {
      avgAnalysisTime: number,
      avgFixTime: number,
      successRate: number,
      totalAnalyses: number,
      cacheHitRate: number
    };
  }

  // Get success rate
  static getSuccessRate(): number

  // Get tool metrics
  static getToolMetrics(): ToolMetrics

  // Reset metrics
  static reset(): void
}
```

**UI Integration:**

| UI Component | Method | Purpose |
|--------------|--------|---------|
| Dashboard | `getMetrics()` | Stats cards |
| Metrics View | `getMetrics()` | Charts |
| Dashboard | `getSuccessRate()` | Success rate stat |

---

## Tool Orchestrator ( P2 Gap)

**Location:** `src/utils/ToolOrchestrator.ts`  
**Status:** Not leveraged

```typescript
class ToolOrchestrator {
  // Execute tools in parallel
  async executeParallel(
    tools: Tool[],
    params: any
  ): Promise<ToolResult[]>

  // Execute with dependencies
  async executeWithDeps(
    toolGraph: ToolGraph
  ): Promise<ToolResult[]>

  // Get execution plan
  getExecutionPlan(tools: Tool[]): ExecutionPlan
}
```

**Should be used for:** Faster analysis via parallel tool execution

**See:** [Integration Gaps P2](INTEGRATION_GAPS.md)

---

## Empty State Templates ( P2 Gap)

**Location:** `src/utils/EmptyStateTemplates.ts`  
**Status:** Underused

```typescript
class EmptyStateTemplates {
  static getTemplate(viewType: ViewType): EmptyState

  static customize(template: EmptyState, data: any): EmptyState
}
```

**Should be used in:** All views for empty states

---

## Theme Manager ( P2 Gap)

**Location:** `src/utils/ThemeManager.ts`  
**Status:** Not propagating updates

```typescript
class ThemeManager {
  getCurrentTheme(): Theme

  setTheme(theme: Theme): void

  onThemeChanged(callback: (theme: Theme) => void): Unsubscribe
}
```

**Issue:** Theme changes in settings don't propagate to UI

---

## Accessibility Service ( P2 Gap)

**Location:** `src/utils/AccessibilityService.ts`  
**Status:** Not utilized

```typescript
class AccessibilityService {
  generateAriaLabel(element: string, context: any): string

  validateAccessibility(component: Component): ValidationResult

  getAccessibilityReport(): AccessibilityReport
}
```

**Should be used for:** WCAG 2.1 AA compliance

---

## Summary

### Utilities Status

| Utility | Status | Priority |
|---------|--------|----------|
| ErrorParser |  Working | - |
| Specialized Parsers |  Not exposed | P1 |
| DiffFormatter |  Working | - |
| FileResolver |  Working | - |
| LanguageDetector |  Working | - |
| PathUtils |  Working | - |
| ToolOrchestrator |  Not leveraged | P2 |
| EmptyStateTemplates |  Underused | P2 |
| ThemeManager |  Not propagating | P2 |
| AccessibilityService |  Not utilized | P2 |

### Cache Status

| Component | Type | Status | Priority |
|-----------|------|--------|----------|
| RCACache | L1 in-memory |  Working | - |
| ChromaDBClient | L2 persistent |  Working | - |
| TwoTierCache | Combined |  Not integrated | P1 |

### Performance Tracking

-  PerformanceTracker functional
-  Metrics collected
-  Not fully displayed in UI (P2)

---

**Related:**
- [Frontend Services](FRONTEND_SERVICES.md)
- [Core Agents](CORE_AGENTS.md)
- [Tools System](TOOLS_SYSTEM.md)
- [Integration Gaps](INTEGRATION_GAPS.md)
