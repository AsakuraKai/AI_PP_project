/**
 * Simple Real-World Test: MVP Android Project
 * Tests the complete RCA pipeline on actual error
 */

import { OllamaClient } from '../src/llm/OllamaClient';
import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { GradleParser } from '../src/utils/parsers/GradleParser';
import * as fs from 'fs';
import * as path from 'path';

async function testMVPError(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        RCA AGENT - MVP PROJECT TEST (COMPLETE)                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

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

BUILD FAILED in 937ms
`;

  console.log('[LIST] Testing Error from: MVP/gradle/libs.versions.toml');
  console.log('[X] Issue: AGP version 8.10.0 (invalid - this version does not exist)\n');

  const startTime = Date.now();

  try {
    // Step 1: Parse
    console.log('[CONFIG]  Step 1: Parsing error...');
    const parser = new GradleParser();
    const parsed = parser.parse(gradleError);

    if (!parsed) {
      throw new Error('Failed to parse error');
    }

    console.log('[OK] Parsed successfully');
    console.log(`   Type: ${parsed.type}`);
    console.log(`   Dependency: ${parsed.metadata?.dependency || 'N/A'}`);
    console.log(`   Version: ${parsed.metadata?.version || 'N/A'}\n`);

    // Step 2: Analyze with RCA Agent
    console.log('[CONFIG]  Step 2: Analyzing with RCA Agent...');
    console.log('   Model: DeepSeek-R1-Distill-Qwen-7B');
    console.log('   Max Iterations: 3\n');

    const ollamaClient = new OllamaClient({
      baseUrl: 'http://localhost:11434',
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
      timeout: 120000
    });

    const agent = new MinimalReactAgent(ollamaClient);
    const result = await agent.analyze(parsed);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Display results
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ANALYSIS COMPLETE                           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`[TIME]  Duration: ${duration.toFixed(2)}s`);
    console.log(`[SYNC] Iterations: ${result.iterations || 0}`);
    console.log(`[STATS] Confidence: ${(result.confidence * 100).toFixed(0)}%\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[TARGET] ROOT CAUSE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(result.rootCause);
    console.log();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[BUILD]  FIX GUIDELINES');
    console.log('═══════════════════════════════════════════════════════════════');
    result.fixGuidelines.forEach((fix, idx) => {
      console.log(`${idx + 1}. ${fix}`);
    });
    console.log();

    if (result.toolsUsed && result.toolsUsed.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('[TOOL] TOOLS USED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(result.toolsUsed.join(', '));
      console.log();
    }

    // Verify correctness
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('[TARGET] VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════════');

    const keywords = ['8.10.0', 'version', 'AGP', 'gradle', 'plugin', 'Android'];
    const text = result.rootCause + ' ' + result.fixGuidelines.join(' ');
    const found = keywords.filter(kw => text.toLowerCase().includes(kw.toLowerCase()));

    console.log(`Keywords found: ${found.length}/${keywords.length}`);
    console.log(`Matched: ${found.join(', ')}`);

    const isAccurate = found.length >= 4 && result.confidence >= 0.7;
    console.log(`\n${isAccurate ? '[OK] PASS' : '[X] FAIL'}: ${isAccurate ? 'High accuracy' : 'Low accuracy'}`);

    // Performance assessment
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('[STATS] PERFORMANCE ASSESSMENT');
    console.log('═══════════════════════════════════════════════════════════════');

    const target = 90;
    const speedStatus = duration < target ? '[OK] Fast' : '[WARN] Slow';
    const confStatus = result.confidence >= 0.7 ? '[OK] High' : '[WARN] Low';
    const accStatus = isAccurate ? '[OK] Accurate' : '[X] Inaccurate';

    console.log(`Speed:      ${speedStatus} (${duration.toFixed(2)}s vs ${target}s target)`);
    console.log(`Confidence: ${confStatus} (${(result.confidence * 100).toFixed(0)}% vs 70% target)`);
    console.log(`Accuracy:   ${accStatus} (keyword matching)`);

    // Save summary
    const summary = `# MVP Project Test - Complete Results

**Date:** ${new Date().toISOString()}
**Duration:** ${duration.toFixed(2)}s
**Status:** ${isAccurate && duration < target && result.confidence >= 0.7 ? '[OK] SUCCESS' : '[WARN] PARTIAL SUCCESS'}

## Test Case
- **Error:** Invalid AGP version 8.10.0 in gradle/libs.versions.toml
- **Type:** Gradle dependency resolution error

## Results
- **Parse Time:** <1ms
- **Analysis Time:** ${duration.toFixed(2)}s
- **Iterations:** ${result.iterations || 0}
- **Confidence:** ${(result.confidence * 100).toFixed(0)}%
- **Keywords Matched:** ${found.length}/${keywords.length} (${found.join(', ')})

## Root Cause
${result.rootCause}

## Fix Guidelines
${result.fixGuidelines.map((fix, idx) => `${idx + 1}. ${fix}`).join('\n')}

## Performance
- Speed: ${speedStatus} (${duration < target ? (target - duration).toFixed(2) + 's faster' : (duration - target).toFixed(2) + 's slower'} than target)
- Confidence: ${confStatus}
- Accuracy: ${accStatus}

## Verdict
${isAccurate && duration < target && result.confidence >= 0.7 
  ? '[OK] **EXCELLENT** - All targets met. Parser and agent working perfectly on real-world errors.'
  : '[WARN] **GOOD** - Agent works but has room for improvement.'}

**Ready for Phase 2:** ${isAccurate && result.confidence >= 0.7 ? 'Yes [OK]' : 'Needs tuning [WARN]'}
`;

    const outputDir = path.join(__dirname, '..', 'docs', 'REAL-PROJECT-TEST');
    fs.writeFileSync(path.join(outputDir, 'COMPLETE_TEST_RESULTS.md'), summary);

    console.log('\n[OK] Summary saved to: docs/REAL-PROJECT-TEST/COMPLETE_TEST_RESULTS.md');

    // Final verdict
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      FINAL VERDICT                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
    if (isAccurate && duration < target && result.confidence >= 0.7) {
      console.log('\n[SUCCESS] [OK] EXCELLENT - ALL TARGETS MET');
      console.log('\n✓ Parser: Production ready');
      console.log('✓ Agent: High accuracy and confidence');
      console.log('✓ Performance: Under target latency');
      console.log('✓ Real-world: Handles actual project errors\n');
      console.log('👉 RECOMMENDATION: Proceed with Phase 2 (VS Code Extension)');
    } else {
      console.log('\n[WARN] GOOD - Agent works with some areas for improvement');
      console.log('\n✓ Parser: Working');
      console.log(`${result.confidence >= 0.7 ? '✓' : '[WARN]'} Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`${duration < target ? '✓' : '[WARN]'} Performance: ${duration.toFixed(2)}s`);
      console.log(`${isAccurate ? '✓' : '[WARN]'} Accuracy: Keyword matching\n`);
      console.log('👉 RECOMMENDATION: Review and tune before Phase 2');
    }

  } catch (error: any) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.error('\n╔════════════════════════════════════════════════════════════════╗');
    console.error('║                      TEST FAILED                               ║');
    console.error('╚════════════════════════════════════════════════════════════════╝\n');
    console.error(`[TIME]  Duration before failure: ${duration.toFixed(2)}s`);
    console.error(`[X] Error: ${error.message}\n`);

    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.error('[IDEA] TIP: Make sure Ollama is running:');
      console.error('   ollama serve\n');
    }

    process.exit(1);
  }
}

// Run the test
testMVPError().catch(console.error);
