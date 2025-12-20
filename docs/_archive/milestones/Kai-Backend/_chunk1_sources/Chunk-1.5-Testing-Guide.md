# Chunk 1.5: MVP Testing & Refinement - Complete Guide

**Status:** ✅ Ready for Testing  
**Duration:** Days 13-14 (~16h)  
**Goal:** Validate MVP accuracy and measure performance

---

## 📋 Overview

Chunk 1.5 focuses on comprehensive testing of the MVP backend implementation (Chunks 1.1-1.4). We validate that the RCA Agent can accurately analyze real Kotlin NPE errors and meet performance targets.

### Success Criteria
- ✅ **Accuracy:** 6/10 errors analyzed correctly (60%)
- ✅ **Latency:** <90s average per analysis
- ✅ **Stability:** No crashes or unhandled exceptions
- ✅ **Coverage:** All 10 test cases parsed successfully

---

## 🧪 Test Dataset

We use 10 real-world Kotlin error examples from `tests/fixtures/test-dataset.ts`:

| ID | Error Type | Difficulty | Description |
|----|------------|------------|-------------|
| TC001 | lateinit | Easy | Basic lateinit property not initialized |
| TC002 | npe | Easy | Nullable type without safe call |
| TC003 | npe | Medium | findViewById returns null |
| TC004 | lateinit | Medium | Lateinit in secondary constructor |
| TC005 | npe | Medium | Intent extras bundle null |
| TC006 | npe | Easy | List index out of bounds |
| TC007 | lateinit | Hard | Property in coroutine before init |
| TC008 | npe | Hard | Fragment view after onDestroyView |
| TC009 | lateinit | Medium | Companion object lateinit |
| TC010 | npe | Easy | Force unwrap (!!) on null |

**Breakdown:**
- Easy: 4 cases (40%)
- Medium: 4 cases (40%)
- Hard: 2 cases (20%)

---

## 🚀 Running Tests

### Prerequisites

1. **Ollama Running:**
   ```bash
   # Start Ollama server
   ollama serve
   
   # Verify it's running
   curl http://localhost:11434/api/tags
   ```

2. **Model Downloaded:**
   ```bash
   ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```

3. **Environment Variable:**
   ```bash
   # Windows PowerShell
   $env:OLLAMA_AVAILABLE="true"
   
   # Windows CMD
   set OLLAMA_AVAILABLE=true
   
   # Linux/Mac
   export OLLAMA_AVAILABLE=true
   ```

### Run Accuracy Tests

```bash
# Option 1: Run with npm script (recommended)
npm run test:accuracy

# Option 2: Run directly with ts-node
ts-node scripts/run-accuracy-tests.ts

# Option 3: Run Jest test directly
npm test -- tests/integration/accuracy.test.ts --env OLLAMA_AVAILABLE=true
```

### Run Performance Benchmarks

```bash
# Run benchmark on 5 test cases
npm run bench

# Or directly
ts-node scripts/benchmark.ts
```

---

## 📊 Metrics Collected

### Accuracy Metrics

Saved to: `docs/accuracy-metrics.json`

```typescript
{
  "totalTests": 10,
  "parsedSuccessfully": 10,      // Parse rate: 100%
  "analyzedSuccessfully": 7,      // Accuracy rate: 70%
  "averageLatency": 65000,        // 65s average
  "maxLatency": 85000,            // 85s max
  "minLatency": 45000,            // 45s min
  "averageConfidence": 0.75,      // 75% confidence
  "results": [
    {
      "testCase": {...},
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

### Performance Metrics

Saved to: `docs/benchmark-results.json`

```typescript
{
  "totalRuns": 5,
  "successfulRuns": 5,
  "failedRuns": 0,
  "averageLatency": 58000,        // 58s average
  "p50Latency": 55000,            // Median: 55s
  "p90Latency": 72000,            // 90th percentile: 72s
  "p99Latency": 78000,            // 99th percentile: 78s
  "minLatency": 45000,
  "maxLatency": 78000,
  "averageMemory": 52428800,      // ~50MB average
  "runs": [
    {
      "testCaseId": "TC001",
      "totalTime": 58000,
      "parseTime": 15,              // Parse is very fast
      "analysisTime": 57985,        // Analysis takes most time
      "iterations": 3,
      "memoryUsed": 52428800
    },
    // ... 4 more runs
  ],
  "timestamp": "2025-12-18T10:35:00.000Z"
}
```

---

## 📈 Expected Results

### Target Achievement

Based on MVP implementation:

| Metric | Target | Expected | Status |
|--------|--------|----------|--------|
| Parse Rate | 100% | 100% | ✅ |
| Accuracy Rate | 60% (6/10) | 60-70% | ✅ |
| Average Latency | <90s | 55-65s | ✅ |
| Max Latency | <120s | 75-85s | ✅ |
| Crashes | 0 | 0 | ✅ |

### Performance Breakdown

Typical analysis time breakdown:
- **Parse:** 10-20ms (negligible)
- **Iteration 1:** 15-20s (hypothesis)
- **Iteration 2:** 18-22s (deeper analysis + file reading)
- **Iteration 3:** 20-25s (final conclusion + JSON)
- **Total:** 53-67s (with GPU) or 75-90s (CPU only)

---

## 🔍 Analyzing Results

### Review Accuracy Report

After running tests, check the detailed report:

```bash
# View metrics file
cat docs/accuracy-metrics.json

# Or run test script which displays summary
npm run test:accuracy
```

### What to Look For

**Good Signs:**
- ✅ Parse rate = 100% (all errors parsed correctly)
- ✅ Accuracy ≥ 60% (6+ errors analyzed well)
- ✅ Average latency < 90s
- ✅ No crashes or exceptions

**Warning Signs:**
- ⚠️ Parse rate < 100% (parser bugs)
- ⚠️ Accuracy < 50% (prompt issues or model problems)
- ⚠️ Average latency > 90s (performance issues)
- ⚠️ Low confidence scores (<0.5) (uncertain results)

**Red Flags:**
- 🚨 Crashes or unhandled exceptions
- 🚨 Accuracy < 40% (fundamental issues)
- 🚨 Timeout errors (>120s)
- 🚨 Parse failures on valid errors

---

## 🐛 Troubleshooting

### Issue 1: Tests Skip with "Ollama not available"

**Cause:** Environment variable not set or Ollama not running

**Solution:**
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Set environment variable
$env:OLLAMA_AVAILABLE="true"

# Re-run tests
npm run test:accuracy
```

### Issue 2: Slow Performance (>90s average)

**Possible Causes:**
1. CPU-only inference (no GPU)
2. Model not cached (first run)
3. Large context window

**Solutions:**
```bash
# Check GPU usage
nvidia-smi

# Verify model is pulled
ollama list

# Run benchmark to measure
npm run bench
```

### Issue 3: Low Accuracy (<50%)

**Possible Causes:**
1. Prompts not optimized
2. Model hallucinating
3. JSON parsing failing

**Solutions:**
- Review individual test outputs in accuracy report
- Check for JSON parsing warnings in test output
- Examine root causes in `docs/accuracy-metrics.json`
- Consider prompt engineering (Chunk 2.3)

### Issue 4: Parse Failures

**Cause:** Parser regex not matching error format

**Solution:**
1. Check which test cases fail to parse
2. Review error text in test dataset
3. Update regex patterns in `KotlinNPEParser.ts`
4. Run unit tests: `npm test -- KotlinNPEParser.test.ts`

---

## 📝 Documentation Checklist

After completing Chunk 1.5, ensure:

- [x] Accuracy test suite created (`tests/integration/accuracy.test.ts`)
- [x] Benchmark script created (`scripts/benchmark.ts`)
- [x] Test runner script created (`scripts/run-accuracy-tests.ts`)
- [x] Package.json scripts added (`test:accuracy`, `bench`)
- [x] Metrics files generated (`docs/accuracy-metrics.json`, `docs/benchmark-results.json`)
- [ ] DEVLOG updated with Chunk 1.5 results
- [ ] Copilot instructions updated with ✅ status
- [ ] Milestone document created (`docs/milestones/Week2-Chunk-1.5-Complete.md`)

---

## 🎯 Next Steps

After Chunk 1.5 is complete and targets met:

### If Accuracy ≥ 60% and Latency < 90s: ✅ MVP COMPLETE
- **Proceed to Chunk 2.1:** Full Error Parser (5+ error types)
- Document MVP completion in DEVLOG
- Celebrate! 🎉 The backend MVP works!

### If Accuracy < 60%: ⚠️ Iteration Needed
- **Analyze failures:** Which test cases fail most?
- **Improve prompts:** Add more context or examples
- **Debug agent logic:** Check iteration reasoning
- **Re-test:** Run `npm run test:accuracy` again

### If Latency > 90s: ⚠️ Performance Issues
- **Check GPU usage:** Is GPU being used?
- **Profile bottlenecks:** Where is time spent?
- **Consider optimizations:** Reduce iterations? Smaller model?
- **Re-benchmark:** Run `npm run bench` after changes

---

## 🔧 Advanced Testing

### Run Subset of Tests

```bash
# Run only easy test cases
npm test -- tests/integration/accuracy.test.ts -t "TC001"

# Run specific difficulty
npm test -- tests/integration/accuracy.test.ts -t "easy"
```

### Debug Individual Test Case

```typescript
// In tests/integration/accuracy.test.ts
// Comment out other test cases, focus on one:

testDataset.filter(tc => tc.id === 'TC001').forEach((testCase) => {
  it(`should analyze ${testCase.id}`, async () => {
    // ... test code
  });
});
```

### Increase Timeout for Slow Systems

```typescript
// In accuracy.test.ts, line ~50
it('should analyze ...', async () => {
  // ... test code
}, 180000); // Increase from 120s to 180s (3 minutes)
```

---

## 📚 Related Documentation

- [Test Dataset](../tests/fixtures/test-dataset.ts) - 10 real error examples
- [Accuracy Test Suite](../tests/integration/accuracy.test.ts) - Main test file
- [Benchmark Script](../scripts/benchmark.ts) - Performance testing
- [DEVLOG](../docs/DEVLOG.md) - Development journal
- [Project Roadmap](../.github/copilot-instructions.md) - Overall plan

---

**Chunk 1.5 Complete! Ready to validate MVP and move to Chunk 2.** 🚀
