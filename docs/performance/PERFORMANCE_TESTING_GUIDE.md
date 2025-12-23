# Performance Testing Guide

Complete guide for testing the RCA Agent's performance across multiple error types.

---

## 📊 Overview

This guide covers the comprehensive performance test suite with **31 test cases** spanning:
- **6 categories:** Kotlin, Gradle, Jetpack Compose, XML, Manifest, Multi-Layer
- **4 complexity levels:** Simple, Medium, Complex, Edge-Case
- **26+ error types:** Complete coverage of all supported error types

---

## 🎯 Test Dataset

### Test Distribution

| Category | Test Cases | Error Types | Complexity Range |
|----------|------------|-------------|------------------|
| **Kotlin** | 6 | lateinit, NPE, type_mismatch, unresolved_reference, compilation_error | Simple → Complex |
| **Gradle** | 5 | dependency_conflict, resolution_error, task_failure | Simple → Complex |
| **Jetpack Compose** | 8 | remember, recomposition, launched_effect, composition_local, modifier_chain, side_effect, derived_state, snapshot_state | Simple → Complex |
| **XML** | 7 | inflation, missing_id, attribute_error, namespace_error, view_not_found, include_error, merge_error | Simple → Complex |
| **Manifest** | 5 | undeclared_activity, missing_permission, merge_conflict, undeclared_service, undeclared_receiver | Simple → Complex |
| **Multi-Layer** | 5 | Cross-cutting errors (Compose+Kotlin, Gradle+Manifest, etc.) | Complex → Edge-Case |
| **TOTAL** | **31** | **26+** | All levels |

### Complexity Levels

- **Simple (8 tests):** Baseline errors, straightforward root causes, expected completion <70s
- **Medium (15 tests):** Moderate complexity, multiple factors, expected completion 70-85s
- **Complex (7 tests):** High complexity, cross-cutting concerns, expected completion 85-100s
- **Edge-Case (1 test):** Maximum complexity, all layers combined, expected completion >100s

---

## 🚀 Quick Start

### Prerequisites

1. **Ollama running** with model loaded:
   ```bash
   ollama serve
   ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
   ```

2. **Dependencies installed:**
   ```bash
   npm install
   ```

3. **Agent backend functional** (Phase 1 complete)

### Run All Tests

```bash
npm run perf-test
```

**Expected Duration:** ~40 minutes (31 tests × ~75s average)

---

## 📋 Usage Examples

### 1. Run All Tests

```bash
npm run perf-test
```

**Output:**
- Progress indicator for each test
- Real-time pass/fail status
- Comprehensive final report
- Latency metrics (avg, median, p90, p95, p99)
- Success rates by category and complexity

### 2. Filter by Category

Run only Kotlin errors:
```bash
npm run perf-test -- --category kotlin
```

Run only Compose errors:
```bash
npm run perf-test -- --category compose
```

**Available categories:**
- `kotlin` (6 tests)
- `gradle` (5 tests)
- `compose` (8 tests)
- `xml` (7 tests)
- `manifest` (5 tests)
- `multi-layer` (5 tests)

### 3. Filter by Complexity

Run only simple tests (baseline performance):
```bash
npm run perf-test -- --complexity simple
```

Run only complex tests (stress testing):
```bash
npm run perf-test -- --complexity complex
```

**Available complexities:**
- `simple` (8 tests, ~9 minutes)
- `medium` (15 tests, ~19 minutes)
- `complex` (7 tests, ~11 minutes)
- `edge-case` (1 test, ~2 minutes)

### 4. Run Specific Test

```bash
npm run perf-test -- --test KT-001
```

**Test IDs:**
- Kotlin: `KT-001` to `KT-006`
- Gradle: `GR-001` to `GR-005`
- Compose: `CP-001` to `CP-008`
- XML: `XML-001` to `XML-007`
- Manifest: `MF-001` to `MF-005`
- Multi-Layer: `ML-001` to `ML-005`

### 5. Export Results to JSON

```bash
npm run perf-test -- --output results.json
```

**JSON contains:**
- All test results with timestamps
- Full latency statistics
- Confidence scores
- Category/complexity breakdowns
- Error details for failed tests

### 6. Verbose Mode

```bash
npm run perf-test -- --verbose
```

**Shows:**
- Parsed error details
- Confidence scores per test
- Root cause detection status
- Number of fix suggestions
- Individual test latencies

### 7. Custom Agent Configuration

```bash
npm run perf-test -- --max-iterations 5
```

**Options:**
- `--max-iterations <n>`: Override default 3 iterations (test with 5, 8, or 10)
- Useful for testing agent behavior with more reasoning cycles

### 8. Combine Multiple Filters

Run simple Kotlin tests with verbose output:
```bash
npm run perf-test -- --category kotlin --complexity simple --verbose
```

Run complex multi-layer tests and export:
```bash
npm run perf-test -- --complexity complex --output complex-results.json
```

---

## 📈 Understanding the Report

### Sample Output

```
📈 PERFORMANCE TEST REPORT
================================================================================

Timestamp: 2025-12-23T10:30:45.123Z
Total Tests: 31
Tests Run: 31
Success: 29 (93.5%)
Failure: 2 (6.5%)

--------------------------------------------------------------------------------
⏱️  LATENCY METRICS
--------------------------------------------------------------------------------
Total Duration: 2310.5s (38.5 minutes)
Average Latency: 74.5s
Median Latency: 72.3s
P90 Latency: 95.2s
P95 Latency: 102.8s
P99 Latency: 118.4s
Average Confidence: 87.3%

--------------------------------------------------------------------------------
📁 BY CATEGORY
--------------------------------------------------------------------------------

KOTLIN:
  Tests: 6 | Success: 6/6 (100.0%)
  Avg Latency: 68.2s | Avg Confidence: 92.1%

GRADLE:
  Tests: 5 | Success: 5/5 (100.0%)
  Avg Latency: 78.5s | Avg Confidence: 84.7%

COMPOSE:
  Tests: 8 | Success: 7/8 (87.5%)
  Avg Latency: 81.3s | Avg Confidence: 86.2%

XML:
  Tests: 7 | Success: 7/7 (100.0%)
  Avg Latency: 65.8s | Avg Confidence: 89.5%

MANIFEST:
  Tests: 5 | Success: 5/5 (100.0%)
  Avg Latency: 70.4s | Avg Confidence: 88.3%

MULTI-LAYER:
  Tests: 5 | Success: 4/5 (80.0%)
  Avg Latency: 98.7s | Avg Confidence: 82.1%

--------------------------------------------------------------------------------
🎯 BY COMPLEXITY
--------------------------------------------------------------------------------

SIMPLE:
  Tests: 8 | Success: 8/8 (100.0%)
  Avg Latency: 62.5s | Avg Confidence: 91.2%

MEDIUM:
  Tests: 15 | Success: 14/15 (93.3%)
  Avg Latency: 73.8s | Avg Confidence: 87.5%

COMPLEX:
  Tests: 7 | Success: 6/7 (85.7%)
  Avg Latency: 92.1s | Avg Confidence: 83.9%

EDGE-CASE:
  Tests: 1 | Success: 1/1 (100.0%)
  Avg Latency: 115.3s | Avg Confidence: 78.2%

--------------------------------------------------------------------------------
❌ FAILED TESTS
--------------------------------------------------------------------------------

CP-002: Infinite recomposition loop
  Category: compose | Complexity: complex
  Error: Analysis timeout after 120s

ML-005: All layers combined
  Category: multi-layer | Complexity: edge-case
  Error: Agent reached max iterations without conclusion
```

---

## 🎯 Success Criteria

### Target Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **Overall Success Rate** | ≥90% | 28+ out of 31 tests passing |
| **Simple Success Rate** | 100% | All 8 baseline tests must pass |
| **Medium Success Rate** | ≥93% | 14+ out of 15 tests passing |
| **Complex Success Rate** | ≥85% | 6+ out of 7 tests passing |
| **Average Latency** | <80s | Below Phase 1 target of 90s |
| **P95 Latency** | <110s | 95% of tests under 110s |
| **Average Confidence** | ≥85% | High-quality analysis |

### Phase 1 Baseline Comparison

**Phase 1 Achieved (10 Kotlin + 20 Android tests):**
- Accuracy: 100% (30/30)
- Avg Latency: 75.8s
- Test Coverage: 95%+

**Performance Test Suite Expected:**
- Broader coverage (31 tests, 26+ error types)
- Higher complexity (multi-layer scenarios)
- More realistic edge cases
- Expected: 90-95% success rate with similar latency

---

## 🔍 Test Case Details

### Kotlin Tests (KT-001 to KT-006)

1. **KT-001: Simple lateinit NPE** - Basic lateinit property access
2. **KT-002: Standard NullPointerException** - Classic NPE pattern
3. **KT-003: Type mismatch error** - Compile-time type error
4. **KT-004: Unresolved reference** - Missing import
5. **KT-005: IndexOutOfBoundsException** - Array access error
6. **KT-006: Multi-threaded NPE** - Concurrency issue

### Gradle Tests (GR-001 to GR-005)

1. **GR-001: Dependency version conflict** - Version mismatch
2. **GR-002: Missing repository** - Artifact not found
3. **GR-003: Kotlin version mismatch** - Plugin incompatibility
4. **GR-004: Task execution failure** - Build task error
5. **GR-005: Multi-module dependency cycle** - Circular dependencies

### Compose Tests (CP-001 to CP-008)

1. **CP-001: Missing remember call** - State management issue
2. **CP-002: Infinite recomposition loop** - Performance killer
3. **CP-003: LaunchedEffect missing key** - Side effect lifecycle
4. **CP-004: CompositionLocal not provided** - Context issue
5. **CP-005: Incorrect Modifier order** - Layout problem
6. **CP-006: SideEffect in composition** - State mutation error
7. **CP-007: DerivedStateOf misuse** - Performance issue
8. **CP-008: SnapshotStateList concurrent modification** - Race condition

### XML Tests (XML-001 to XML-007)

1. **XML-001: Layout inflation error** - Invalid XML syntax
2. **XML-002: Missing view ID reference** - findViewById null
3. **XML-003: Invalid attribute value** - Type mismatch
4. **XML-004: Namespace declaration missing** - Custom attribute error
5. **XML-005: View class not found** - Custom view issue
6. **XML-006: Include tag error** - Circular inclusion
7. **XML-007: Merge tag misuse** - Layout optimization error

### Manifest Tests (MF-001 to MF-005)

1. **MF-001: Activity not declared** - Missing registration
2. **MF-002: Missing permission** - Permission denial
3. **MF-003: Manifest merge conflict** - Library conflict
4. **MF-004: Service not declared** - Background service issue
5. **MF-005: BroadcastReceiver not declared** - Receiver registration

### Multi-Layer Tests (ML-001 to ML-005)

1. **ML-001: Compose + Kotlin NPE** - Cross-layer error
2. **ML-002: Gradle + Manifest conflict** - Build-manifest issue
3. **ML-003: Compose + XML mixed layout** - Hybrid UI error
4. **ML-004: Version mismatch across ecosystem** - Multi-tool incompatibility
5. **ML-005: All layers combined** - Catastrophic failure (stress test)

---

## 🛠️ Troubleshooting

### Common Issues

**1. "Ollama server not responding"**
```bash
# Solution: Start Ollama server
ollama serve

# Verify model loaded
ollama list
```

**2. "Model not found"**
```bash
# Solution: Download model
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
```

**3. "Timeout errors on complex tests"**
```bash
# Solution: Increase max iterations
npm run perf-test -- --max-iterations 5 --complexity complex
```

**4. "Low success rate (<90%)"**
- Check Ollama model quality
- Verify backend code is Phase 1 complete
- Run with `--verbose` to see detailed errors
- Test simpler cases first to isolate issues

**5. "High latency (>90s average)"**
- Check GPU acceleration enabled in Ollama
- Verify no other heavy processes running
- Consider reducing max iterations
- Test with simpler model if available

---

## 📊 Analyzing Results

### JSON Export Structure

```json
{
  "timestamp": "2025-12-23T10:30:45.123Z",
  "totalTests": 31,
  "successRate": 0.935,
  "averageLatencyMs": 74500,
  "averageConfidence": 0.873,
  "byCategory": {
    "kotlin": {
      "total": 6,
      "success": 6,
      "successRate": 1.0,
      "averageLatencyMs": 68200
    }
    // ... other categories
  },
  "results": [
    {
      "testId": "KT-001",
      "testName": "Simple lateinit NPE",
      "success": true,
      "latencyMs": 65300,
      "confidence": 0.92,
      "rootCauseFound": true,
      "fixSuggestions": 3
    }
    // ... all test results
  ]
}
```

### Key Metrics to Track

1. **Success Rate Trends:** Are rates improving over time?
2. **Latency Distribution:** Are p95/p99 acceptable?
3. **Confidence Scores:** Are analyses high-quality?
4. **Failure Patterns:** Which categories/complexities fail most?
5. **Regression Detection:** Compare against baseline results

---

## 🎯 Best Practices

### When to Run Performance Tests

✅ **Before merging to main:** Ensure no regressions  
✅ **After agent improvements:** Validate enhancements  
✅ **After model upgrades:** Test new LLM behavior  
✅ **Weekly regression check:** Maintain quality  
✅ **Before releases:** Final validation

### Test Strategy

1. **Quick Check (5 min):** Run simple tests only
   ```bash
   npm run perf-test -- --complexity simple
   ```

2. **Standard Suite (20 min):** Run simple + medium
   ```bash
   npm run perf-test -- --complexity medium
   ```

3. **Full Suite (40 min):** Run all tests
   ```bash
   npm run perf-test
   ```

4. **Stress Test (15 min):** Run complex + edge-case
   ```bash
   npm run perf-test -- --complexity complex
   ```

### Interpreting Results

**Good Performance:**
- ≥95% success on simple tests
- ≥90% success on medium tests
- ≥80% success on complex tests
- Average latency <80s
- Average confidence ≥85%

**Needs Improvement:**
- <90% success on simple tests → Fix parsing/baseline logic
- <80% success on medium tests → Improve agent reasoning
- Latency >100s average → Optimize or reduce iterations
- Confidence <80% → Enhance prompt engineering

---

## 📚 Related Documentation

- [Phase 1 Completion Summary](../COMPLETION_SUMMARY.md)
- [Agent API Documentation](./api/Agent.md)
- [Parser Documentation](./api/Parsers.md)
- [Performance Benchmarks](./performance/benchmarks.md)
- [Architecture Overview](./architecture/overview.md)

---

## 🤝 Contributing

To add new test cases:

1. Edit `tests/fixtures/performance-test-dataset.ts`
2. Add test case to appropriate category array
3. Follow existing structure (id, name, category, etc.)
4. Update TEST_STATISTICS if adding new categories
5. Run test suite to validate
6. Update this guide with new test details

---

**Last Updated:** December 23, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
