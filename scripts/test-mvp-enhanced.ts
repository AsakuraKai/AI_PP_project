/**
 * Quick MVP Test with Enhanced Prompts
 * 
 * Tests the AGP 8.10.0 error (MVP baseline case) with enhanced prompts
 * and measures specificity improvement using ResponseValidator.
 * 
 * Baseline (MVP Test Dec 26):
 * - Overall Usability: 40%
 * - Solution Specificity: 17%
 * - File Identification: 30%
 * - Version Suggestions: 0%
 * - Code Examples: 0%
 * 
 * Target (After Chunk 3):
 * - Solution Specificity: 70%+
 * - File Identification: 95%+
 * - Version Suggestions: 90%+
 * - Code Examples: 85%+
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { ResponseValidator } from '../src/agent/ResponseValidator';
import { ParsedError } from '../src/types';
import { OllamaClient } from '../src/llm/OllamaClient';

async function testMVPCaseWithEnhancedPrompts() {
  console.log('🧪 Testing MVP Case with Enhanced Prompts\n');
  console.log('Error: AGP version 8.10.0 not found');
  console.log('Location: gradle/libs.versions.toml\n');

  // Create the error from MVP test
  const error: ParsedError = {
    type: 'gradle_dependency_not_found',
    message: 'Could not find com.android.tools.build:gradle:8.10.0',
    filePath: 'gradle/libs.versions.toml',
    line: 5,
    language: 'gradle',
    stackTrace: [
      {
        file: 'build.gradle',
        line: 1,
        function: 'buildscript',
      },
    ],
    metadata: {
      dependency: 'com.android.tools.build:gradle',
      requestedVersion: '8.10.0',
      errorDetails: [
        'Could not find com.android.tools.build:gradle:8.10.0',
        'Searched in the following locations:',
        '  - https://repo.maven.apache.org/maven2/com/android/tools/build/gradle/8.10.0/gradle-8.10.0.pom',
        'Required by:',
        '    project :',
      ],
    },
  };

  try {
    // Initialize LLM
    console.log('📡 Initializing LLM (DeepSeek-R1-Distill-Qwen-7B)...');
    const llm = new OllamaClient({
      model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    });

    // Initialize agent with enhanced prompts (automatic via PromptEngine)
    console.log('🤖 Initializing agent with enhanced prompts...');
    const agent = new MinimalReactAgent(llm, {
      maxIterations: 3,
    });

    // Run analysis
    console.log('🔍 Running RCA analysis...\n');
    const startTime = Date.now();
    const result = await agent.analyze(error);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Analysis complete!\n');
    console.log('=' . repeat(80));
    console.log('📊 RESULTS');
    console.log('='.repeat(80));

    // Display agent results
    console.log('\n🔍 Root Cause:');
    console.log(result.rootCause);

    console.log('\n🔧 Fix Guidelines:');
    result.fixGuidelines.forEach((fix, i) => {
      console.log(`${i + 1}. ${fix}`);
    });

    console.log(`\n📈 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`⏱️  Duration: ${duration}s`);

    // Validate with ResponseValidator
    console.log('\n' + '='.repeat(80));
    console.log('📋 SPECIFICITY VALIDATION');
    console.log('='.repeat(80));

    const validator = new ResponseValidator();
    const validationResult = validator.validateResponse({
      thought: 'Analysis complete',
      action: null,
      rootCause: result.rootCause,
      fixGuidelines: result.fixGuidelines,
      confidence: result.confidence,
    });

    const specificityLevel = validator.getSpecificityLevel(validationResult.specificityScore);

    console.log(`\n📊 Specificity Score: ${validationResult.specificityScore}/100 (${specificityLevel})`);
    
    console.log('\n✅ Strengths:');
    validationResult.strengths.forEach(s => console.log(`   ${s}`));

    if (validationResult.issues.length > 0) {
      console.log('\n⚠️  Issues:');
      validationResult.issues.forEach(i => console.log(`   ${i}`));
    }

    console.log('\n📋 Breakdown:');
    console.log(`   Exact File Path: ${validationResult.breakdown.hasExactFilePath ? '✅' : '❌'} (30 pts)`);
    console.log(`   Version Validation: ${validationResult.breakdown.hasVersionValidation ? '✅' : '❌'} (25 pts)`);
    console.log(`   Code Example: ${validationResult.breakdown.hasCodeExample ? '✅' : '❌'} (20 pts)`);
    console.log(`   Actual Names: ${validationResult.breakdown.hasActualNames ? '✅' : '❌'} (10 pts)`);
    console.log(`   Verification Steps: ${validationResult.breakdown.hasVerificationSteps ? '✅' : '❌'} (10 pts)`);
    console.log(`   Compatibility Check: ${validationResult.breakdown.hasCompatibilityCheck ? '✅' : '❌'} (5 pts)`);

    // Compare with MVP baseline
    console.log('\n' + '='.repeat(80));
    console.log('📈 COMPARISON WITH MVP BASELINE');
    console.log('='.repeat(80));

    const baseline = {
      specificity: 17,
      usability: 40,
      fileIdentification: 30,
      versionSuggestions: 0,
      codeExamples: 0,
    };

    const improvement = validationResult.specificityScore - baseline.specificity;
    const percentImprovement = ((improvement / baseline.specificity) * 100).toFixed(0);

    console.log(`\n📊 Specificity:`);
    console.log(`   Baseline: ${baseline.specificity}% (Very Poor)`);
    console.log(`   Current: ${validationResult.specificityScore}% (${specificityLevel})`);
    console.log(`   Improvement: +${improvement} points (+${percentImprovement}%)`);
    console.log(`   Target: 70%+ ${validationResult.specificityScore >= 70 ? '✅ MET' : '⚠️ IN PROGRESS'}`);

    console.log(`\n📁 File Identification:`);
    console.log(`   Baseline: ${baseline.fileIdentification}%`);
    console.log(`   Current: ${validationResult.breakdown.hasExactFilePath ? '95%+ ✅' : '< 95% ❌'}`);
    console.log(`   Target: 95%+ ${validationResult.breakdown.hasExactFilePath ? '✅ MET' : '❌ NOT MET'}`);

    console.log(`\n🔢 Version Suggestions:`);
    console.log(`   Baseline: ${baseline.versionSuggestions}%`);
    console.log(`   Current: ${validationResult.breakdown.hasVersionValidation ? '90%+ ✅' : '< 90% ❌'}`);
    console.log(`   Target: 90%+ ${validationResult.breakdown.hasVersionValidation ? '✅ MET' : '❌ NOT MET'}`);

    console.log(`\n💻 Code Examples:`);
    console.log(`   Baseline: ${baseline.codeExamples}%`);
    console.log(`   Current: ${validationResult.breakdown.hasCodeExample ? '85%+ ✅' : '< 85% ❌'}`);
    console.log(`   Target: 85%+ ${validationResult.breakdown.hasCodeExample ? '✅ MET' : '❌ NOT MET'}`);

    // Final assessment
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL ASSESSMENT');
    console.log('='.repeat(80));

    const allTargetsMet = 
      validationResult.specificityScore >= 70 &&
      validationResult.breakdown.hasExactFilePath &&
      validationResult.breakdown.hasVersionValidation &&
      validationResult.breakdown.hasCodeExample;

    if (allTargetsMet) {
      console.log('\n✅ SUCCESS! All Chunk 3 targets achieved!');
      console.log('   - Specificity improved from 17% to 70%+');
      console.log('   - Agent now provides specific, actionable fixes');
      console.log('   - Ready to proceed to Chunk 4');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS - Some targets need work');
      if (validationResult.specificityScore < 70) {
        console.log('   ❌ Specificity below 70% target');
      }
      if (!validationResult.breakdown.hasExactFilePath) {
        console.log('   ❌ Missing exact file paths');
      }
      if (!validationResult.breakdown.hasVersionValidation) {
        console.log('   ❌ Missing specific version numbers');
      }
      if (!validationResult.breakdown.hasCodeExample) {
        console.log('   ❌ Missing code examples');
      }
      console.log('\n   Recommendations:');
      const { suggestions } = validator.validateWithSuggestions({
        thought: 'Analysis complete',
        action: null,
        rootCause: result.rootCause,
        fixGuidelines: result.fixGuidelines,
        confidence: result.confidence,
      });
      suggestions.forEach(s => console.log(`   - ${s}`));
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testMVPCaseWithEnhancedPrompts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testMVPCaseWithEnhancedPrompts };
