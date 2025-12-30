# Phase 2 Quick Start Guide

**Status:** ✅ Implementation Complete  
**Date:** December 31, 2025

---

## 🚀 Quick Start

### Prerequisites Check ✅

**Good news!** Your system already has:
- ✅ ChromaDB npm package (^3.1.8) - Installed
- ✅ ChromaDB Python package (1.3.7) - Installed
- ✅ Node.js (v24.11.1) - Running
- ✅ Ollama with DeepSeek-R1-Distill - Running
- ✅ All npm dependencies - Installed
- ✅ TypeScript compiled - Ready

**Only needed:** Start ChromaDB server (1 command)

### Start ChromaDB Server

```powershell
# Start ChromaDB server (already installed)
chroma run --host localhost --port 8000
```

**Note:** Docker not required - using Python installation

---

## 📝 Usage Examples

### 1. Multi-Pass Reasoning

```typescript
import { OllamaClient } from './src/llm/OllamaClient';
import { MultiPassAgent } from './src/agent/MultiPassAgent';

const llm = new OllamaClient('http://localhost:11434', 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
const agent = new MultiPassAgent(llm, {
  numHypotheses: 3,      // Generate 3 diverse hypotheses
  enableConsensus: false, // Use best hypothesis (not consensus)
  minEvidenceItems: 2,   // Minimum evidence required
});

const result = await agent.analyze(parsedError);
console.log(result.rootCause);
```

### 2. Semantic Example Search

```typescript
import { SemanticExampleService } from './src/knowledge/SemanticExampleService';

const service = new SemanticExampleService({
  chromaUrl: 'http://localhost:8000',
  minSimilarity: 0.6,
  maxExamples: 5,
});

await service.initialize();

const results = await service.findSimilarExamples(parsedError);
results.forEach(r => {
  console.log(`Similarity: ${(r.similarity * 100).toFixed(0)}%`);
  console.log(`Reason: ${r.reason}`);
});
```

### 3. Semantic Code Search

```typescript
import { SemanticCodeSearchTool } from './src/tools/SemanticCodeSearchTool';

const tool = new SemanticCodeSearchTool();
await tool.initialize('/path/to/project');

const results = await tool.execute({
  error: parsedError,
  query: 'initialization code',
  maxResults: 5,
});

results.forEach(r => {
  console.log(`${r.filePath}:${r.startLine} (${(r.similarity * 100).toFixed(0)}%)`);
});
```

### 4. Dependency Graph Analysis

```typescript
import { DependencyGraphTool } from './src/tools/DependencyGraphTool';

const tool = new DependencyGraphTool();
const graph = await tool.execute({
  projectPath: '/path/to/project',
  checkOutdated: false,
});

console.log(`Version conflicts: ${graph.conflicts.length}`);
console.log(`Circular dependencies: ${graph.circular.length}`);
```

### 5. Historical Pattern Tracking

```typescript
import { HistoricalPatternTool } from './src/tools/HistoricalPatternTool';

const tool = new HistoricalPatternTool();

// Record error and fix
await tool.recordError(parsedError, rcaResult, projectPath, true);

// Analyze patterns
const pattern = await tool.execute({
  error: parsedError,
  projectPath,
});

if (pattern) {
  console.log(`Success rate: ${(pattern.successRate * 100).toFixed(0)}%`);
  console.log(`Best fix: ${pattern.bestFix?.rootCause}`);
}
```

---

## 🧪 Running Tests

### Phase 2 Validation Tests

```powershell
# Terminal 1: Start ChromaDB server
chroma run --host localhost --port 8000

# Terminal 2: Run Phase 2 tests
npm run test:phase2

# Or manually
npx ts-node scripts/test-phase2-validation.ts

# Alternative: Test without ChromaDB (graceful degradation)
npm run test:phase2
# (Semantic search will be skipped, other features still work)
```

### Expected Test Output

```
🚀 Phase 2 Validation Tests
============================================================

📋 TEST 1: Multi-Pass Reasoning
✓ Analysis complete
⏱️  Duration: 7.5s
Confidence: 85%

📋 TEST 2: Semantic Example Search
✓ Found 5 similar examples
⏱️  Search time: 320ms

📋 TEST 3: Full Phase 2 Integration
✓ Full analysis complete
⏱️  Duration: 12.3s
Confidence: 78%

============================================================
✅ Phase 2 Validation Complete
```

---

## 📊 Configuration Options

### MultiPassAgent Options

```typescript
interface MultiPassConfig {
  numHypotheses?: number;        // Default: 3
  enableConsensus?: boolean;     // Default: false
  minEvidenceItems?: number;     // Default: 2
  maxIterations?: number;        // Default: 10
  timeout?: number;              // Default: 90000ms
}
```

### SemanticExampleService Options

```typescript
interface SemanticServiceConfig {
  chromaUrl?: string;            // Default: 'http://localhost:8000'
  collectionName?: string;       // Default: 'rca_examples'
  minSimilarity?: number;        // Default: 0.6
  maxExamples?: number;          // Default: 5
}
```

---

## 🔧 Troubleshooting

### ChromaDB Connection Issues

```powershell
# Check if ChromaDB is running
curl http://localhost:8000/api/v1

# If not running, start it (Python method - no Docker needed)
chroma run --host localhost --port 8000

# If port 8000 is busy, use alternate port:
chroma run --host localhost --port 8001
# (Update chromaUrl in config to http://localhost:8001)
```

### Fallback Behavior

If ChromaDB is not available:
- MultiPassAgent works normally (doesn't require ChromaDB)
- SemanticExampleService returns empty results
- Advanced tools gracefully degrade
- No errors thrown (graceful degradation)

### Performance Tuning

```typescript
// Faster but less diverse
const agent = new MultiPassAgent(llm, {
  numHypotheses: 2,              // Reduce hypotheses
  maxIterations: 5,              // Reduce iterations
});

// Better quality but slower
const agent = new MultiPassAgent(llm, {
  numHypotheses: 5,              // More hypotheses
  enableConsensus: true,         // Build consensus
  minEvidenceItems: 3,           // Require more evidence
});
```

---

## 📁 File Structure

```
src/
├── agent/
│   └── MultiPassAgent.ts           (490 lines, NEW)
├── knowledge/
│   └── SemanticExampleService.ts   (430 lines, NEW)
└── tools/
    ├── SemanticCodeSearchTool.ts   (340 lines, NEW)
    ├── DependencyGraphTool.ts      (420 lines, NEW)
    └── HistoricalPatternTool.ts    (380 lines, NEW)

scripts/
└── test-phase2-validation.ts       (120 lines, NEW)

docs/_archive/.../PHASE2/
├── PHASE2_IMPLEMENTATION.md        (Complete documentation)
└── PHASE2_QUICK_START.md           (This file)
```

---

## 🎯 Success Metrics

| Metric | Phase 1 | Phase 2 Target | How to Measure |
|--------|---------|----------------|----------------|
| Usability | 55-60% | 65-70% | Run test:phase2 |
| Root Cause Accuracy | 65-70% | 75-80% | Manual review |
| Fix Quality | 60-65% | 70-75% | User feedback |
| Latency | <10s | <15s | Test output |

---

## 📚 Additional Resources

- **Full Documentation:** [PHASE2_IMPLEMENTATION.md](./PHASE2_IMPLEMENTATION.md)
- **Phase 1 Results:** [CHUNK_9_POST_FIX_RESULTS.md](../CHUNK_9_POST_FIX_RESULTS.md)
- **Copilot Instructions:** [.github/copilot-instructions.md](../../../../../.github/copilot-instructions.md)

---

## ✅ Next Steps

1. **Validate Implementation**
   ```powershell
   # Start ChromaDB server first
   chroma run --host localhost --port 8000
   
   # Then run tests (in another terminal)
   npm run test:phase2
   ```

2. **Integrate with Existing Code**
   - Replace MinimalReactAgent with MultiPassAgent
   - Add SemanticExampleService to PromptEngine
   - Register advanced tools in ToolRegistry

3. **Populate ChromaDB**
   - Add existing few-shot examples
   - Index sample projects
   - Build historical database

4. **Measure Improvements**
   - Compare Phase 2 vs Phase 1 results
   - Document actual improvements
   - Adjust parameters if needed

---

**Date:** December 31, 2025  
**Status:** ✅ Ready for Validation  
**Questions:** Check PHASE2_IMPLEMENTATION.md for detailed documentation
