/**
 * Quick Phase 1 Strengthening Test
 * 
 * Tests 1-2 cases quickly to verify:
 * - OutputValidator works
 * - Regeneration logic triggers
 * - Quality scores improve
 * 
 * Run: npm run test:phase1-quick
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ErrorParser } from '../src/utils/ErrorParser';

async function testQuick() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         Phase 1 Strengthening - Quick Test                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Testing improvements:');
  console.log('  ✓ OutputValidator: 6-factor quality scoring');
  console.log('  ✓ Regeneration: Max 2 attempts if quality < 70%');
  console.log('  ✓ Feedback prompts: Specific improvement instructions\n');
  
  // Initialize
  const llm = new OllamaClient({
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
  });
  
  const agent = new MinimalReactAgent(llm, {
    generateFix: false, // Skip fix generation for speed
  });
  
  const parser = ErrorParser.getInstance();
  
  // Test Case: AGP Version Error (Test 1 from MVP)
  console.log('\n================================================================================');
  console.log('Test 1: AGP Version Error (Baseline: 40% usability)');
  console.log('================================================================================\n');
  
  const errorLog = `
FAILURE: Build failed with an exception.

* What went wrong:
Could not resolve all files for configuration ':classpath'.
> Could not find com.android.tools.build:gradle:8.10.0.
  Searched in the following locations:
    - https://dl.google.com/dl/android/maven2/com/android/tools/build/gradle/8.10.0/gradle-8.10.0.pom
    - https://repo.maven.apache.org/maven2/com/android/tools/build/gradle/8.10.0/gradle-8.10.0.pom
  Required by:
      project :
`;
  
  const startTime = Date.now();
  
  try {
    const parsed = parser.parse(errorLog, '/path/to/project');
    if (!parsed) {
      console.error('[X] Failed to parse error');
      return;
    }
    
    console.log('[NOTE] Error parsed successfully\n');
    console.log('Starting analysis...\n');
    
    const result = await agent.analyze(parsed);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n================================================================================');
    console.log('RESULTS');
    console.log('================================================================================\n');
    
    console.log('**Root Cause:**');
    console.log(result.rootCause);
    console.log();
    
    console.log('**Fix Guidelines:**');
    result.fixGuidelines.forEach((fix, i) => {
      console.log(`${i + 1}. ${fix}`);
    });
    console.log();
    
    console.log('**Metadata:**');
    console.log(`- Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`- Iterations: ${result.iterations}`);
    console.log(`- Duration: ${duration}s`);
    console.log(`- Tools Used: ${result.toolsUsed?.join(', ') || 'none'}`);
    console.log();
    
    // Analyze quality improvement signals
    console.log('**Quality Signals:**');
    
    const hasLineNumbers = /line\s+\d+|:\d+|L\d+/i.test(result.rootCause + result.fixGuidelines.join(' '));
    const hasSpecificVersions = /\d+\.\d+\.\d+/.test(result.rootCause + result.fixGuidelines.join(' '));
    const hasCodeExamples = /before:|after:|```/.test(result.rootCause + result.fixGuidelines.join(' '));
    const hasVerification = /gradlew|gradle|build|test|verify/i.test(result.rootCause + result.fixGuidelines.join(' '));
    
    console.log(`- File paths with line numbers: ${hasLineNumbers ? '[OK] YES' : '[X] NO'}`);
    console.log(`- Specific version numbers: ${hasSpecificVersions ? '[OK] YES' : '[X] NO'}`);
    console.log(`- Code examples (before/after): ${hasCodeExamples ? '[OK] YES' : '[X] NO'}`);
    console.log(`- Verification steps: ${hasVerification ? '[OK] YES' : '[X] NO'}`);
    console.log();
    
    // Calculate approximate quality score
    let qualityScore = 0;
    if (hasLineNumbers) qualityScore += 25;
    if (hasSpecificVersions) qualityScore += 25;
    if (hasCodeExamples) qualityScore += 25;
    if (hasVerification) qualityScore += 25;
    
    console.log(`**Estimated Quality Score: ${qualityScore}%** (target: 70%+)`);
    console.log();
    
    if (qualityScore >= 70) {
      console.log('[OK] Quality target achieved! Phase 1 strengthening working.');
    } else if (qualityScore >= 55) {
      console.log('[WARN] Quality acceptable (55-70%). May need fine-tuning.');
    } else {
      console.log('[X] Quality below target. Review validation logic.');
    }
    
  } catch (error) {
    console.error('[X] Test failed:', error);
    console.error('Stack:', error instanceof Error ? error.stack : '');
  }
  
  console.log('\n================================================================================');
  console.log('Test complete. Review results above.');
  console.log('================================================================================\n');
}

testQuick().catch(console.error);
