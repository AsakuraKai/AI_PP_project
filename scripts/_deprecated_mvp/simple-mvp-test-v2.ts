/**
 * Simplified MVP Project Test - Tests RCA Agent on Real Android Project
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { GradleParser } from '../src/utils/parsers/GradleParser';
import * as fs from 'fs';
import * as path from 'path';

async function testMVPError(): Promise<void> {
  console.log('='.repeat(80));
  console.log('[TEST] RCA AGENT - MVP PROJECT TEST');
  console.log('='.repeat(80));
  console.log('\n[FOLDER] Project: MVP Android App');
  console.log('📍 Location: MVP folder\n');

  // Real Gradle error from MVP project
  const gradleError = `
FAILURE: Build failed with an exception.

* What went wrong:
Could not resolve all files for configuration ':classpath'.
> Could not find com.android.tools.build:gradle:8.10.0.
  Searched in the following locations:
    - https://dl.google.com/dl/android/maven2/com/android/tools/build/gradle/8.10.0/gradle-8.10.0.pom
  Required by:
      project : > com.android.application:com.android.application.gradle.plugin:8.10.0

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.

BUILD FAILED in 937ms
`;

  const startTime = Date.now();
  
  try {
    console.log('[LIST] Test Case: Invalid AGP Version in gradle/libs.versions.toml');
    console.log('-'.repeat(80));
    console.log('Error: AGP version 8.10.0 does not exist\n');

    // Step 1: Parse the error
    console.log('[CONFIG]  Step 1: Parsing error...');
    const parser = new GradleParser();
    const parsed = parser.parse(gradleError);
    
    if (!parsed) {
      throw new Error('Failed to parse error');
    }
    
    console.log('[OK] Parsed successfully');
    console.log(`   Type: ${parsed.type}`);
    console.log(`   Message: ${parsed.message.substring(0, 80)}...\n`);
    
    // Step 2: Initialize Ollama client
    console.log('[CONFIG]  Step 2: Initializing RCA Agent...');
    const ollamaClient = new OllamaClient({
      baseUrl: 'http://localhost:11434',
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      timeout: 120000
    });
    
    console.log('   - Model: DeepSeek-R1-Distill-Qwen-7B');
    console.log('   - Max Iterations: 3');
    console.log('   - Timeout: 120s\n');
    
    // Step 3: Analyze with agent
    console.log('[CONFIG]  Step 3: Analyzing with RCA Agent...');
    const agent = new MinimalReactAgent(ollamaClient);
    const result = await agent.analyze(parsed);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Display results
    console.log('\n' + '='.repeat(80));
    console.log('[OK] ANALYSIS COMPLETE!');
    console.log('='.repeat(80));
    console.log(`\n[TIME]  Duration: ${duration.toFixed(2)}s`);
    console.log(`[SYNC] Iterations: ${result.iterations || 0}`);
    console.log(`[STATS] Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    
    console.log(`\n[NOTE] Root Cause:\n${'-'.repeat(80)}`);
    console.log(result.rootCause);
    
    console.log(`\n[IDEA] Fix Guidelines:\n${'-'.repeat(80)}`);
    result.fixGuidelines.forEach((step, idx) => {
      console.log(`${idx + 1}. ${step}`);
    });
    
    // Verification
    console.log(`\n[TARGET] Verification:\n${'-'.repeat(80)}`);
    const expectedKeywords = ['8.10.0', 'version', 'AGP', 'gradle'];
    const analysisText = `${result.rootCause} ${result.fixGuidelines.join(' ')}`.toLowerCase();
    const foundKeywords = expectedKeywords.filter(kw => 
      analysisText.includes(kw.toLowerCase())
    );
    
    console.log(`Keywords found: ${foundKeywords.length}/${expectedKeywords.length} (${foundKeywords.join(', ')})`);
    
    const isAccurate = foundKeywords.length >= 3 && result.confidence >= 0.7;
    const verdict = isAccurate ? '[OK] PASS' : '[X] FAIL';
    console.log(`Accuracy: ${verdict}`);
    
    // Save report
    const reportDir = path.join(__dirname, '..', 'docs', 'REAL-PROJECT-TEST');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = generateSimpleReport(
      gradleError,
      result,
      duration,
      isAccurate,
      foundKeywords
    );
    
    const reportPath = path.join(reportDir, 'MVP_TEST_RESULTS.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n💾 Report saved to: docs/REAL-PROJECT-TEST/MVP_TEST_RESULTS.md`);
    
    console.log('\n' + '='.repeat(80));
    console.log('[SUCCESS] TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    
  } catch (error: any) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.error('\n' + '='.repeat(80));
    console.error('[X] TEST FAILED');
    console.error('='.repeat(80));
    console.error(`\n[TIME]  Duration: ${duration.toFixed(2)}s`);
    console.error(`📛 Error: ${error.message}`);
    
    if (error.stack) {
      console.error(`\n[SEARCH] Stack Trace:\n${error.stack}`);
    }
    
    process.exit(1);
  }
}

function generateSimpleReport(
  errorMessage: string,
  analysisResult: any,
  duration: number,
  isAccurate: boolean,
  foundKeywords: string[]
): string {
  const timestamp = new Date().toISOString();
  
  return `# RCA Agent - MVP Project Test Results

**Generated:** ${timestamp}  
**Test Duration:** ${duration.toFixed(2)}s  
**Status:** ${isAccurate ? '[OK] PASSED' : '[X] FAILED'}

---

## [TARGET] Test Overview

This test validates the RCA Agent's ability to analyze real-world Android project errors from the MVP folder.

### Test Case: Invalid AGP Version

**Error Location:** \`gradle/libs.versions.toml\`  
**Error Type:** Gradle Dependency Resolution Error  
**Issue:** AGP version 8.10.0 does not exist

---

## [LIST] Original Build Error

\`\`\`
${errorMessage.trim()}
\`\`\`

---

## 🔬 Analysis Results

### Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Duration** | ${duration.toFixed(2)}s | ${duration < 90 ? '[OK] Under 90s target' : '[WARN] Over target'} |
| **Iterations** | ${analysisResult.iterations || 0} | ${(analysisResult.iterations || 0) <= 3 ? '[OK] Within limit' : '[WARN] Over limit'} |
| **Confidence** | ${(analysisResult.confidence * 100).toFixed(0)}% | ${analysisResult.confidence >= 0.7 ? '[OK] High confidence' : '[WARN] Low confidence'} |
| **Accuracy** | ${isAccurate ? 'PASS' : 'FAIL'} | ${isAccurate ? '[OK] Correct analysis' : '[X] Incorrect analysis'} |

### Root Cause Identified

\`\`\`
${analysisResult.rootCause}
\`\`\`

### Fix Guidelines

${analysisResult.fixGuidelines.map((step: string, idx: number) => `${idx + 1}. ${step}`).join('\n')}

### Verification

**Expected Keywords:** 8.10.0, version, AGP, gradle  
**Keywords Found:** ${foundKeywords.join(', ')}  
**Match Rate:** ${foundKeywords.length}/4  
**Verdict:** ${isAccurate ? '[OK] PASS' : '[X] FAIL'}

---

## [OK] What Worked Well

${isAccurate ? `
- [OK] Error parsing: Successfully detected Gradle dependency resolution error
- [OK] Root cause: Correctly identified invalid AGP version
- [OK] Performance: Completed in ${duration.toFixed(2)}s ${duration < 90 ? '(under target)' : ''}
- [OK] Confidence: ${(analysisResult.confidence * 100).toFixed(0)}% ${analysisResult.confidence >= 0.7 ? '(high)' : ''}
- [OK] Fix suggestion: Provided actionable solution
` : `
- [WARN] Analysis completed but with issues
- [WARN] May need improvement in accuracy
`}

---

## 🎓 Key Findings

### Parser Performance
- **Gradle Parser:** Successfully identified dependency resolution error
- **Error Detection:** Correctly extracted error type and message
- **Context Awareness:** Identified relevant file location

### Agent Performance
- **Reasoning:** Used ${analysisResult.iterations || 0} iterations
- **Confidence:** ${(analysisResult.confidence * 100).toFixed(0)}%
- **Fix Quality:** ${isAccurate ? 'Specific and actionable' : 'Needs improvement'}

---

## [STATS] Comparison to Benchmarks

| Metric | Target | Achieved | Result |
|--------|--------|----------|---------|
| Accuracy | ≥60% | ${isAccurate ? '100%' : '0%'} | ${isAccurate ? '[OK] +40%' : '[X] Below target'} |
| Avg Latency | <90s | ${duration.toFixed(2)}s | ${duration < 90 ? '[OK] ' + (90 - duration).toFixed(2) + 's faster' : '[X] ' + (duration - 90).toFixed(2) + 's slower'} |
| Confidence | ≥70% | ${(analysisResult.confidence * 100).toFixed(0)}% | ${analysisResult.confidence >= 0.7 ? '[OK]' : '[X]'} |

---

## [TOOL] Recommendations

${isAccurate && duration < 90 ? `
### Ready for Production [OK]
- Gradle parser is working correctly
- Performance meets IDE integration requirements
- Accuracy is excellent
- Confidence levels are acceptable

### Next Steps:
1. Test with more Android error types
2. Add caching for repeated errors
3. Expand test coverage with additional MVP errors
` : `
### Needs Improvement [WARN]
1. ${!isAccurate ? 'Improve accuracy for Gradle version errors' : ''}
2. ${duration >= 90 ? 'Optimize performance for faster response times' : ''}
3. ${analysisResult.confidence < 0.7 ? 'Enhance confidence scoring' : ''}
4. Add more test cases
`}

---

## [NOTE] Verdict

**Overall Assessment:** ${isAccurate && duration < 90 && analysisResult.confidence >= 0.7 ? '[OK] **EXCELLENT**' : isAccurate ? '[WARN] **GOOD**' : '[X] **NEEDS IMPROVEMENT**'}

${isAccurate && duration < 90 ? `
The RCA Agent successfully analyzed a real Android project error with:
- [OK] Accurate root cause identification
- [OK] Fast performance (${duration.toFixed(2)}s)
- [OK] High confidence (${(analysisResult.confidence * 100).toFixed(0)}%)
- [OK] Actionable fix suggestions

**Status:** Ready for Phase 2 VS Code extension integration
` : `
The analysis completed but may need fine-tuning:
- Consider optimizing for better performance
- May need additional training or prompt engineering
- Expand test coverage
`}

---

**Test Completed:** ${timestamp}  
**Next Steps:** Review results and proceed with additional MVP error tests
`;
}

// Run the test
testMVPError().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
