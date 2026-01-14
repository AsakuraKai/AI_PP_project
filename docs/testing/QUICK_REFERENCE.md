# Phase 4 Testing - Quick Reference

**Testing Infrastructure:** [DONE] COMPLETE  
**Test Runner:** `npm run test:phase4`  
**Total Test Cases:** 10  
**Estimated Runtime:** 2-3 minutes (10 tests × ~12s each)

---

## [LAUNCH] Quick Start

### 1. Prerequisites
```bash
# Start Ollama (in separate terminal)
ollama serve

# Verify model is installed
ollama list | grep deepseek
# Should show: hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest

# If not installed:
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
```

### 2. Run All Tests
```bash
npm run test:phase4
```

### 3. Check Results
```bash
# Results saved to:
tests/results/phase4/

# Latest report:
ls -lt tests/results/phase4/phase4-test-suite-report-*.json | head -1
```

---

## [CHART] Test Suite Overview

### Test Cases (10 Total)

| ID | Name | Error Type | Complexity | Baseline | Target |
|----|------|------------|------------|----------|--------|
| 1 | AGP Version Conflict | gradle-dependency | Simple | 40% | 80% |
| 2 | Kotlin lateinit NPE | kotlin-npe | Medium | - | 75% |
| 3 | Compose API Breakage | compose-deprecation | Medium | - | 75% |
| 4 | XML Layout Inflation | xml-layout | Medium | - | 70% |
| 5 | Multi-Module Dependency | gradle-dependency | Complex | - | 70% |
| 6 | Manifest Permission | manifest-permission | Simple | 65% | 80% |
| 7 | Gradle Network | gradle-network | Medium | 60% | 75% |
| 8 | Build Cache | gradle-cache | Simple | 70% | 85% |
| 9 | ProGuard Rule | proguard | Complex | 55% | 70% |
| 10 | Navigation Argument | navigation | Medium | 50% | 70% |

### Metrics (7 Key Indicators)

1. **Diagnosis Accuracy** (0-100%): Correctly identified the problem?
2. **Solution Specificity** (0-100%): How actionable is the solution?
3. **File Identification** (0-100%): Exact file mentioned?
4. **Code Examples** (0-100%): Provided code snippets/diffs?
5. **Version Suggestions** (0-100%): Specific version numbers?
6. **Overall Usability** (0-100%): Weighted average
7. **Latency** (ms): Response time

---

## [SEARCH] Understanding Results

### Test Result Structure
```json
{
  "testCase": { "id": 1, "name": "...", ... },
  "timestamp": "2026-01-02T12:00:00Z",
  "duration_ms": 10350,
  "metrics": {
    "diagnosis_accuracy": 100,
    "solution_specificity": 70,
    "file_identification": 95,
    "code_examples": 80,
    "version_suggestions": 90,
    "overall_usability": 87,  // <- PRIMARY METRIC
    "confidence": 85,
    "latency_ms": 10350
  },
  "passed": true,  // overall_usability >= targetUsability
  "improvement_over_baseline": 47  // 87 - 40 = +47%
}
```

### Pass/Fail Criteria
- [DONE] **PASS:** `overall_usability >= targetUsability`
- [FAIL] **FAIL:** `overall_usability < targetUsability`

### Example: Test 1 (AGP Version)
- **Target:** 80% usability
- **Result:** 87% usability
- **Verdict:** [DONE] PASS (+7% above target)
- **Improvement:** +47% from 40% baseline

---

## [GRAPH] Interpreting Test Suite Report

### Overall Summary
```json
{
  "total_tests": 10,
  "passed_tests": 8,         // 80% pass rate
  "failed_tests": 2,
  "average_usability": 75,   // Average across all tests
  "average_latency_ms": 12500  // ~12.5s per test
}
```

### By Error Type
```json
{
  "gradle-dependency": {
    "passed": 2,
    "total": 3,
    "avg_usability": 80
  },
  "kotlin-npe": {
    "passed": 1,
    "total": 1,
    "avg_usability": 75
  }
}
```

### By Complexity
```json
{
  "simple": { "passed": 3, "total": 3, "avg_usability": 85 },
  "medium": { "passed": 4, "total": 5, "avg_usability": 72 },
  "complex": { "passed": 1, "total": 2, "avg_usability": 65 }
}
```

### Improvements Over Baseline
```json
[
  { "test_id": 1, "name": "AGP Version", "baseline": 40, "current": 87, "improvement": 47 },
  { "test_id": 6, "name": "Manifest Permission", "baseline": 65, "current": 82, "improvement": 17 }
]
```

---

## [TARGET] What to Look For

### Good Signs [DONE]
- Overall usability ≥ 80%
- Pass rate ≥ 80% (8/10 tests)
- Diagnosis accuracy = 100% (maintained from Phase 1)
- Solution specificity ≥ 70% (up from 17% baseline)
- File identification ≥ 85% (up from 30% baseline)
- Code examples ≥ 60% (up from 0% baseline)
- Version suggestions ≥ 90% (up from 0% baseline)

### Red Flags 🚩
- Overall usability < 70%
- Pass rate < 60% (6/10 tests)
- Diagnosis accuracy < 90% (regression!)
- Solution specificity < 50% (still too vague)
- High variance between test runs (LLM inconsistency)
- Latency > 20s (performance regression)

---

## [TOOL] Troubleshooting

### LLM Connection Failed
```bash
[FAIL] LLM connection failed. Is Ollama running?

# Fix:
ollama serve
# Then run tests again
```

### Model Not Found
```bash
Error: model 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest' not found

# Fix:
ollama pull hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest
```

### Test Timeout
```bash
# Some tests take longer. Increase timeout in:
# tests/real-world/Phase4TestSuite.ts

// Add timeout to agent configuration:
const agent = new MinimalReactAgent(llmClient, {
  maxIterations: 5,
  timeout: 60000  // 60 seconds
});
```

---

## [NOTE] Next Steps After Running Tests

### 1. Analyze Results
```bash
# Open latest report
cat tests/results/phase4/phase4-test-suite-report-*.json | jq '.'

# Check which tests failed
cat tests/results/phase4/phase4-test-suite-report-*.json | jq '.test_results[] | select(.passed == false) | {id: .testCase.id, name: .testCase.name, usability: .metrics.overall_usability, target: .testCase.targetUsability}'
```

### 2. Identify Patterns
- Which error types perform worst?
- Do complex tests fail more often?
- Where does agent struggle most?
  - Diagnosis? (should be 100%)
  - Solution specificity? (common gap)
  - File identification? (common gap)
  - Code examples? (common gap)
  - Version suggestions? (Gradle errors)

### 3. Prioritize Fixes
Focus on:
1. **Lowest-scoring tests** (biggest gaps)
2. **Simple tests that fail** (should be easy wins)
3. **Common patterns** (fix multiple tests at once)

### 4. Week 2 Implementation
Based on analysis, implement:
- Prompt improvements (add specificity requirements)
- Knowledge base enhancements (more examples)
- Tool improvements (better file resolution)
- Parser enhancements (extract more context)

---

## [IDEA] Tips for Success

1. **Run tests 3 times:** LLMs have variance, average the results
2. **Check individual results:** Suite summary hides details
3. **Compare with baseline:** Focus on improvement, not absolute scores
4. **Don't chase perfection:** 80-85% usability is excellent
5. **Fix in batches:** Group similar issues, fix together
6. **Re-test after changes:** Validate improvements don't break other tests

---

## [DOCS] Related Documentation

- **Implementation:** [PHASE4_WEEK1-2_COMPLETE.md](../docs/PHASE4_WEEK1-2_COMPLETE.md)
- **Test Suite Code:** [Phase4TestSuite.ts](../tests/real-world/Phase4TestSuite.ts)
- **Test Runner:** [phase4-test-runner.ts](../scripts/phase4-test-runner.ts)
- **Roadmap:** [IMPROVEMENT_ROADMAP.md](../.github/copilot-instructions.md)
- **Status:** [STATUS.md](../STATUS.md)

---

**Last Updated:** January 2, 2026  
**Status:** [DONE] Ready to Run  
**Command:** `npm run test:phase4`
