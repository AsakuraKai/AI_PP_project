# Testing & Benchmarking Scripts

This directory contains scripts for testing and benchmarking the RCA Agent.

**Updated:** January 14, 2026 - Major cleanup and consolidation complete

---

## [OK] Cleanup Summary (Jan 14, 2026)

**Removed:**
- All compiled TypeScript artifacts (.js, .d.ts, .map files) - now in .gitignore
- Deprecated original chunk test files (non-refactored versions)
- Obsolete emoji removal scripts (.ps1, .py)
- Old model-specific test scripts (llama3)
- Legacy one-time utility scripts

**Remaining:** 27 active TypeScript files + 3 deprecated folders (for reference)

---

## [TARGET] Recent Consolidations

### [OK] CHUNK 2: MVP Test Scripts (Jan 2, 2026)
**Consolidated 3 duplicate MVP test scripts → 1 unified test runner**

**Before:**
- `simple-mvp-test.ts` (215 lines)
- `simple-mvp-test-v2.ts` (309 lines)  
- `test-mvp-project.ts` (418 lines)
- **Total:** 942 lines with ~44% duplication

**After:**
- `unified-mvp-test.ts` (530 lines)
- **Code reduction:** 412 lines (44% reduction)
- **Deprecated scripts moved to:** `_deprecated_mvp/`

**Quick Usage:**
```bash
# Simple output
npx ts-node scripts/unified-mvp-test.ts --simple

# Detailed output with report
npx ts-node scripts/unified-mvp-test.ts --detailed

# With specificity validation
npx ts-node scripts/unified-mvp-test.ts --validation
```

See [CHUNK 2 details](_deprecated_mvp/README.md) for migration guide.

---

## Active Scripts

### Test Runners
- **`run-accuracy-tests.ts`** - Comprehensive accuracy tests (10 cases)
- **`run-all-tests.ts`** - Unified test runner for all cases
- **`run-phase-tests.ts`** - Phase-specific validation (Phase 1/2)
- **`phase4-test-runner.ts`** - Phase 4 test execution
- **`unified-batch-runner.ts`** - Batch test execution with refactored tests
- **`unified-mvp-test.ts`** - Consolidated MVP test runner
- **`test-mvp-enhanced.ts`** - Enhanced MVP testing
- **`test-single-case.ts`** - Single test case runner
- **`test-ollama-connection.ts`** - Ollama connectivity validator

### Performance & Benchmarking
- **`benchmark.ts`** - Performance benchmarking (latency, memory)
- **`run-performance-tests.ts`** - Performance test suite
- **`performance-comparison.ts`** - Compare performance across runs
- **`validate-setup.ts`** - Environment and setup validation

### Refactored Test Cases (Used by unified-batch-runner)
- **`chunk7-test1-agp-refactored.ts`** - Test 1: AGP Version Error
- **`chunk8-test6-manifest-refactored.ts`** - Test 6: Manifest Permission
- **`chunk8-test7-gradle-network-refactored.ts`** - Test 7: Gradle Network
- **`chunk8-test8-build-cache-refactored.ts`** - Test 8: Build Cache
- **`chunk8-test9-proguard-refactored.ts`** - Test 9: ProGuard
- **`chunk8-test10-navigation-refactored.ts`** - Test 10: Navigation

### Utilities
- **`populate-chromadb.ts`** - Populate ChromaDB with examples
- **`merge-examples-to-json.ts`** - Merge examples to JSON format
- **`generate-file-structure-stats.ts`** - Generate project structure stats
- **`verify-message-handlers.ts`** - Verify message handlers
- **`verify-tools.ts`** - Verify tool implementations

### Deprecated (Archived for Reference)
- **`_deprecated_chunk1/`** - Old chunk 1 test files
- **`_deprecated_chunk3/`** - Old chunk 3 test files
- **`_deprecated_mvp/`** - Old MVP test files

---

## Quick Start (New Unified System)

### Run All Tests
```bash
npm run test:all              # Run all 10 test cases
npm run test:case=1,6,7       # Run specific cases
```

### Phase Validation
```bash
npm run test:phase1           # Phase 1 validation (Tests 6-10)
npm run test:phase2           # Phase 2 validation (Tests 1-2)
```

### Legacy Commands
Old test runner files have been moved to `_deprecated_chunk1/`. See [CHUNK1_CONSOLIDATION.md](../docs/CHUNK1_CONSOLIDATION.md) for details.

---

## [NOTE] Scripts Overview

### 1. `run-accuracy-tests.ts`
**Purpose:** Run comprehensive accuracy tests on 10 real Kotlin error cases

**Usage:**
```bash
npm run test:accuracy
# or
ts-node scripts/run-accuracy-tests.ts
```

**What it does:**
- Checks if Ollama is running
- Runs accuracy test suite (`tests/integration/accuracy.test.ts`)
- Collects metrics (parse rate, accuracy rate, confidence, latency)
- Exports results to `docs/accuracy-metrics.json`
- Displays detailed summary report

**Requirements:**
- Ollama server running (`ollama serve`)
- Model downloaded (`ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest`)
- Environment variable: `OLLAMA_AVAILABLE=true`

**Output:**
``` Starting Accuracy Test Suite - Chunk 1.5

Testing Requirements:
  ✓ Parse 10 real Kotlin NPE errors
  ✓ Analyze root causes
  ✓ Measure accuracy (target: 6/10 = 60%)
  ✓ Measure latency (target: <90s average)
  ✓ No crashes or unhandled exceptions

[OK] Ollama is running

Running accuracy tests...
[Test execution...]

========================================
[STATS] DETAILED ACCURACY REPORT
========================================

Overall Metrics:
  Total Tests: 10
  Parsed Successfully: 10/10 (100.0%)
  Analyzed Successfully: 7/10 (70.0%)
  Average Confidence: 0.75
  Average Latency: 65.0s
  Max Latency: 85.0s
  Min Latency: 45.0s

Per-Test Results:
  [OK] TC001: Lateinit Property Not Initialized
     Latency: 58.0s | Confidence: 0.80
  [... 9 more tests]

Target Achievement:
  Accuracy Target (60%): [OK] PASS
  Latency Target (<90s): [OK] PASS

========================================
Report saved: docs/accuracy-metrics.json
========================================
```

---

### 2. `benchmark.ts`
**Purpose:** Measure performance and latency distribution

**Usage:**
```bash
npm run bench
# or
ts-node scripts/benchmark.ts
```

**What it does:**
- Runs benchmarks on first 5 test cases (faster than full suite)
- Measures component-level timing (parse, analysis)
- Calculates latency distribution (p50, p90, p99, min, max)
- Tracks memory usage
- Exports results to `docs/benchmark-results.json`

**Requirements:**
- Same as accuracy tests (Ollama running)

**Output:**
```
🏁 Performance Benchmarking - Chunk 1.5

[OK] Ollama is running
[STATS] Running benchmarks...

Testing 5 error cases...

Running: TC001 - Lateinit Property Not Initialized
  [OK] Total: 58.00s
     Parse: 15ms
     Analysis: 57.98s
     Memory: 50.00MB

[... 4 more tests]

========================================
[STATS] BENCHMARK RESULTS
========================================

Overall Performance:
  Total Runs: 5
  Successful: 5
  Failed: 0
  Success Rate: 100.0%

Latency Statistics:
  Average: 58.00s
  p50: 55.00s
  p90: 72.00s
  p99: 78.00s
  Min: 45.00s
  Max: 78.00s

Memory Usage:
  Average: 50.00MB

Target Achievement:
  Latency <90s: [OK] PASS

========================================

[OK] Benchmark complete. Results saved to docs/benchmark-results.json
```

---

## [STATS] Output Files

### `docs/accuracy-metrics.json`
Complete accuracy test results:
```json
{
  "totalTests": 10,
  "parsedSuccessfully": 10,
  "analyzedSuccessfully": 7,
  "averageLatency": 65000,
  "maxLatency": 85000,
  "minLatency": 45000,
  "averageConfidence": 0.75,
  "results": [
    {
      "testCase": { "id": "TC001", "name": "...", ... },
      "parsed": true,
      "analyzed": true,
      "rootCause": "...",
      "fixGuidelines": ["...", "..."],
      "confidence": 0.8,
      "latency": 58000
    },
    // ... 9 more results
  ],
  "timestamp": "2025-12-18T10:30:00.000Z"
}
```

### `docs/benchmark-results.json`
Performance benchmark results:
```json
{
  "totalRuns": 5,
  "successfulRuns": 5,
  "failedRuns": 0,
  "averageLatency": 58000,
  "p50Latency": 55000,
  "p90Latency": 72000,
  "p99Latency": 78000,
  "minLatency": 45000,
  "maxLatency": 78000,
  "averageMemory": 52428800,
  "runs": [
    {
      "testCaseId": "TC001",
      "totalTime": 58000,
      "parseTime": 15,
      "analysisTime": 57985,
      "iterations": 3,
      "memoryUsed": 52428800
    },
    // ... 4 more runs
  ],
  "timestamp": "2025-12-18T10:35:00.000Z"
}
```

---

## Quick Start

**Step 1: Start Ollama**
```bash
ollama serve
```

**Step 2: Pull Model (if not already done)**
```bash
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
```

**Step 3: Set Environment Variable**
```bash
# PowerShell
$env:OLLAMA_AVAILABLE="true"

# CMD
set OLLAMA_AVAILABLE=true
```

**Step 4: Run Tests**
```bash
# Accuracy tests (comprehensive)
npm run test:accuracy

# Benchmark (faster, 5 cases)
npm run bench
```

**Step 5: Review Results**
```bash
# View accuracy results
cat docs/accuracy-metrics.json

# View benchmark results
cat docs/benchmark-results.json
```

---

## [TARGET] Success Targets

| Metric          | Target | How to Check                                        |
| --------------- | ------ | --------------------------------------------------- |
| Parse Rate      | 100%   | Check `parsedSuccessfully` in accuracy-metrics.json |
| Accuracy        | ≥60%   | Check `analyzedSuccessfully / totalTests`           |
| Average Latency | <90s   | Check `averageLatency` in both files                |
| Max Latency     | <120s  | Check `maxLatency`                                  |
| Crashes         | 0      | No exceptions during test runs                      |

---

## [BUG] Troubleshooting

### Issue: "Ollama not running"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### Issue: "Model not found"
```bash
# List available models
ollama list

# If model missing, pull it
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
```

### Issue: Tests skip with "Ollama not available"
```bash
# Ensure environment variable is set
echo $env:OLLAMA_AVAILABLE  # PowerShell
echo %OLLAMA_AVAILABLE%     # CMD

# If not set, set it
$env:OLLAMA_AVAILABLE="true"  # PowerShell
set OLLAMA_AVAILABLE=true     # CMD
```

### Issue: Slow performance (>90s)
1. Check if GPU is being used: `nvidia-smi`
2. Verify model is fully loaded (first run may be slow)
3. Check system resources (memory, CPU usage)
4. Consider running benchmark on fewer cases first

---

## 📚 Related Documentation

- [Chunk 1.5 Testing Guide](../docs/milestones/Chunk-1.5-Testing-Guide.md) - Comprehensive guide
- [Test Dataset](../tests/fixtures/test-dataset.ts) - 10 error examples
- [Accuracy Tests](../tests/integration/accuracy.test.ts) - Test implementation
- [DEVLOG](../docs/DEVLOG.md) - Development progress

---

**Ready to validate MVP accuracy and performance!**
