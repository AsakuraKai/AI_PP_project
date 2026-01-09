# Tools System - Technical Reference

**Category:** Tools (src/tools/)  
**Purpose:** Agent capabilities and actions

---

## Overview

Tools provide capabilities for the agent to interact with code, files, and environment.

---

## Tool Registry

**Location:** `src/tools/ToolRegistry.ts`

```typescript
class ToolRegistry {
  static getAvailableTools(): Tool[]
  static getTool(name: string): Tool | undefined
  static registerTool(tool: Tool): void
}
```

---

## Core Tools (15+)

### File Operations

| Tool | Purpose | Key Methods |
|------|---------|-------------|
| ReadFileTool | Read file contents | `read(path: string)` |
| WriteFileTool | Write to file | `write(path: string, content: string)` |
| EditFileTool | Edit file | `edit(path: string, changes: Edit[])` |
| ListDirectoryTool | List files | `list(path: string)` |

### Search Tools

| Tool | Purpose | Key Methods |
|------|---------|-------------|
| SearchInFilesTool | Grep search | `search(pattern: string, path: string)` |
| CodeSearchTool | Semantic search | `searchCode(query: string)` |
| PatternMatcher | Pattern matching | `match(pattern: string, text: string)` |
| SymbolResolver | Resolve symbols | `resolve(symbol: string)` |

### Android-Specific

| Tool | Purpose | Key Methods |
|------|---------|-------------|
| StackTraceParser | Parse traces | `parse(stackTrace: string)` |
| GradleExecutor | Run Gradle | `execute(command: string)` |
| AndroidLogcatTool | Parse logcat | `parse(logcat: string)` |
| ManifestAnalyzer | Analyze manifest | `analyze(manifest: string)` |
| DependencyAnalyzer | Analyze deps | `analyze(buildFile: string)` |
| NetworkAnalyzer | Network debug | `analyze(networkLog: string)` |

### Context Tools

| Tool | Purpose | Key Methods |
|------|---------|-------------|
| ContextEnricher | Enrich context | `enrich(context: Context)` |

---

## Tool Interface

```typescript
interface Tool {
  name: string;
  description: string;
  
  execute(params: any): Promise<ToolResult>;
  
  validate(params: any): ValidationResult;
  
  getSchema(): JSONSchema;
}
```

---

## Usage in Agents

```typescript
class MinimalReactAgent {
  private tools: Tool[];

  async analyze(params: AnalysisParams): Promise<RCAResult> {
    // Select tools based on error type
    const classification = this.classifier.classify(params.error);
    const selectedTools = this.classifier.suggestTools(classification);

    // Execute tools
    for (const tool of selectedTools) {
      const result = await tool.execute({
        error: params.error,
        file: params.file,
        line: params.line
      });

      // Use tool results in analysis
      this.observations.push(result);
    }

    // Build hypothesis from observations
    const hypothesis = await this.buildHypothesis(this.observations);
    
    return hypothesis;
  }
}
```

---

## Tool Selection Strategy

```typescript
class ErrorClassifier {
  suggestTools(classification: ErrorClassification): Tool[] {
    const tools: Tool[] = [];

    // Always include these
    tools.push(ToolRegistry.getTool('ReadFile'));
    tools.push(ToolRegistry.getTool('StackTraceParser'));

    // Add based on error type
    switch (classification.type) {
      case 'NullPointerException':
        tools.push(ToolRegistry.getTool('CodeSearch'));
        tools.push(ToolRegistry.getTool('SymbolResolver'));
        break;

      case 'GradleBuildError':
        tools.push(ToolRegistry.getTool('GradleExecutor'));
        tools.push(ToolRegistry.getTool('DependencyAnalyzer'));
        break;

      case 'AndroidManifestError':
        tools.push(ToolRegistry.getTool('ManifestAnalyzer'));
        break;

      case 'NetworkError':
        tools.push(ToolRegistry.getTool('NetworkAnalyzer'));
        break;
    }

    return tools;
  }
}
```

---

## ToolOrchestrator ( P2 Gap)

**Location:** `src/utils/ToolOrchestrator.ts`  
**Purpose:** Parallel tool execution  
**Status:** Not leveraged

```typescript
class ToolOrchestrator {
  // Execute tools in parallel
  async executeParallel(
    tools: Tool[],
    params: any
  ): Promise<ToolResult[]> {
    return Promise.all(
      tools.map(tool => tool.execute(params))
    );
  }

  // Execute with dependencies
  async executeWithDeps(
    toolGraph: ToolGraph
  ): Promise<ToolResult[]> {
    // Topological sort
    // Execute in order
  }
}
```

**Should be used for:** Faster analysis by running independent tools in parallel

---

## UI Integration

### Agent State View

Shows which tools were used:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Tool</TableHead>
      <TableHead>Duration</TableHead>
      <TableHead>Result</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {toolUsage.map(usage => (
      <TableRow key={usage.tool}>
        <TableCell>{usage.tool}</TableCell>
        <TableCell>{usage.duration}ms</TableCell>
        <TableCell>
          <Badge variant={usage.success ? 'success' : 'destructive'}>
            {usage.success ? 'Success' : 'Failed'}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Performance Tracking

```typescript
class PerformanceTracker {
  static trackTool(toolName: string, duration: number) {
    // Record tool execution time
  }

  static getToolMetrics(): ToolMetrics {
    return {
      avgDuration: {
        'ReadFile': 120,
        'CodeSearch': 450,
        'GradleExecutor': 3200,
        // ...
      },
      usageCount: {
        'ReadFile': 1250,
        'CodeSearch': 890,
        // ...
      }
    };
  }
}
```

**Used in:** Metrics View

---

## Summary

### Tool Categories
- **File Operations:** 4 tools
- **Search Tools:** 4 tools
- **Android-Specific:** 6 tools
- **Context:** 1 tool

**Total:** 15+ tools

### Integration Status
-  All tools functional
-  ToolOrchestrator not leveraged (P2 gap)
-  UI shows tool usage in Agent State view

---

**Related:**
- [Core Agents](CORE_AGENTS.md)
- [Frontend Services](FRONTEND_SERVICES.md)
- [Integration Gaps](INTEGRATION_GAPS.md)
