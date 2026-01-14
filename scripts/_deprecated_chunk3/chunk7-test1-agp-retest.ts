/**
 * Chunk 7 Test 1: Re-test MVP AGP Version Error
 * 
 * This re-tests the original MVP error from December 26, 2025 to measure
 * the improvement from all Chunks 1-6 implementations.
 * 
 * **Previous Result (MVP Test):** 40% usability
 * - Diagnosis: 100% [OK]
 * - Solution: 17% [X]
 * - File identification: 30% [WARN]
 * - Code examples: 0% [X]
 * 
 * **Expected Improvement:**
 * - Version suggestions: 0% → 90% (Chunks 1-2)
 * - File identification: 30% → 80% (Chunk 6)
 * - Code examples: 0% → 60% (Chunk 5)
 * - Solution specificity: 17% → 70% (Chunk 3)
 * - **Overall:** 40% → 70-80%
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ParsedError } from '../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TestResult {
  testName: string;
  error: ParsedError;
  result: any;
  metrics: {
    overallUsability: number;
    diagnosisAccuracy: number;
    solutionSpecificity: number;
    fileIdentification: number;
    codeExamples: number;
    versionSuggestions: number;
    confidence: number;
    latencyMs: number;
  };
  timestamp: string;
}

async function runTest1(): Promise<TestResult> {
  console.log('\n[TEST] Running Chunk 7 Test 1: AGP Version Error (Re-test MVP)\n');
  
  // Chunk 7: Set project root for FileResolver integration
  const projectRoot = 'c:/Users/Admin/OneDrive/Desktop/Nuclear Creation/AI/AI_PP_project/tests/fixtures/mvp-test-project';
  console.log(`[FOLDER] Project root: ${projectRoot}\n`);
  
  // The original MVP error
  const error: ParsedError = {
    type: 'gradle-dependency',
    message: 'Could not find com.android.tools.build:gradle:8.10.0',
    filePath: 'gradle/libs.versions.toml',
    line: 2,
    column: 1,
    language: 'gradle',
    metadata: {
      severity: 'error',
      context: 'AGP version 8.10.0 not found in Maven Central',
      raw: `
      FAILURE: Build failed with an exception.
      
      * What went wrong:
      A problem occurred configuring root project 'Lab3'.
      > Could not resolve all files for configuration ':classpath'.
         > Could not find com.android.tools.build:gradle:8.10.0.
           Searched in the following locations:
             - https://repo.maven.apache.org/maven2/com/android/tools/build/gradle/8.10.0/gradle-8.10.0.pom
           Required by:
               project :
    `,
      fullContent: `
      [versions]
      agp = "8.10.0"
      kotlin = "2.0.0"
      
      [libraries]
      androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
    `
    }
  };

  // Initialize Ollama client
  console.log('[CONFIG]  Initializing Ollama client...');
  const ollama = new OllamaClient({
    baseUrl: 'http://localhost:11434',
    model: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest',
    timeout: 120000
  });

  // Initialize agent with all improvements
  const agent = new MinimalReactAgent(ollama, {
    maxIterations: 5,
    generateFix: true,  // Chunk 5: Enable fix generation
    projectRoot: projectRoot  // Chunk 7: FileResolver integration
  });

  console.log('[CONFIG]  Agent configured with improvements');
  console.log('   - Model: DeepSeek-R1-Distill-Qwen-7B');
  console.log('   - Max iterations: 5');
  console.log('   - Fix generation: [OK]');
  console.log(`   - Project root: ${projectRoot}`);
  console.log('   - Timeout: 120s\n');

  const startTime = Date.now();
  
  try {
    const result = await agent.analyze(error);
    const latencyMs = Date.now() - startTime;

    console.log('\n[OK] Analysis complete!');
    console.log(`[TIME]  Latency: ${latencyMs}ms (${(latencyMs / 1000).toFixed(2)}s)`);
    
    // Calculate metrics
    const metrics = calculateMetrics(result, error);
    
    // Display results
    console.log('\n[STATS] Metrics:');
    console.log(`   Overall Usability: ${metrics.overallUsability}%`);
    console.log(`   Diagnosis Accuracy: ${metrics.diagnosisAccuracy}%`);
    console.log(`   Solution Specificity: ${metrics.solutionSpecificity}%`);
    console.log(`   File Identification: ${metrics.fileIdentification}%`);
    console.log(`   Code Examples: ${metrics.codeExamples}%`);
    console.log(`   Version Suggestions: ${metrics.versionSuggestions}%`);
    console.log(`   Confidence: ${metrics.confidence}%`);
    
    // Compare with MVP baseline
    console.log('\n[UP] Improvement from MVP Test:');
    console.log(`   Usability: 40% → ${metrics.overallUsability}% (+${metrics.overallUsability - 40}%)`);
    console.log(`   Solution: 17% → ${metrics.solutionSpecificity}% (+${metrics.solutionSpecificity - 17}%)`);
    console.log(`   File ID: 30% → ${metrics.fileIdentification}% (+${metrics.fileIdentification - 30}%)`);
    console.log(`   Code Examples: 0% → ${metrics.codeExamples}% (+${metrics.codeExamples}%)`);

    return {
      testName: 'Test 1: AGP Version Error',
      error,
      result,
      metrics: { ...metrics, latencyMs },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('\n[X] Test failed:', error);
    throw error;
  }
}

function calculateMetrics(result: any, _error: ParsedError): {
  overallUsability: number;
  diagnosisAccuracy: number;
  solutionSpecificity: number;
  fileIdentification: number;
  codeExamples: number;
  versionSuggestions: number;
  confidence: number;
} {
  let diagnosisAccuracy = 0;
  let solutionSpecificity = 0;
  let fileIdentification = 0;
  let codeExamples = 0;
  let versionSuggestions = 0;

  // 1. Diagnosis Accuracy (expects to identify AGP version issue)
  if (result.rootCause && result.rootCause.toLowerCase().includes('agp')) {
    diagnosisAccuracy += 50;
  }
  if (result.rootCause && result.rootCause.toLowerCase().includes('8.10.0')) {
    diagnosisAccuracy += 50;
  }

  // 2. Solution Specificity
  const fixGuidelines = result.fixGuidelines || [];
  if (fixGuidelines.length > 0) {
    solutionSpecificity += 20; // Has suggestions
    
    // Check for specific version number
    const hasSpecificVersion = fixGuidelines.some((guide: string) => 
      /\d+\.\d+\.\d+/.test(guide)
    );
    if (hasSpecificVersion) solutionSpecificity += 30;
    
    // Check for exact file reference
    const hasExactFile = fixGuidelines.some((guide: string) =>
      guide.includes('gradle/libs.versions.toml') || guide.includes('line')
    );
    if (hasExactFile) solutionSpecificity += 30;
    
    // Check for actionable steps
    if (fixGuidelines.length >= 3) solutionSpecificity += 20;
  }

  // 3. File Identification (check codeFix structure)
  const codeFix = result.codeFix;
  if (codeFix) {
    if (codeFix.filePath && codeFix.filePath.includes('gradle/libs.versions.toml')) {
      fileIdentification += 50;
    }
    if (codeFix.line && codeFix.line === 2) {
      fileIdentification += 50;
    }
  }

  // 4. Code Examples (generated fix)
  if (codeFix) {
    if (codeFix.originalCode) codeExamples += 30;
    if (codeFix.fixedCode) codeExamples += 30;
    if (codeFix.diff) codeExamples += 40;
  }

  // 5. Version Suggestions
  const suggestsVersion = fixGuidelines.some((guide: string) =>
    guide.includes('8.7.3') || guide.includes('9.0.0')
  );
  if (suggestsVersion) versionSuggestions = 100;

  // Overall usability (weighted average)
  const overallUsability = Math.round(
    diagnosisAccuracy * 0.25 +
    solutionSpecificity * 0.30 +
    fileIdentification * 0.20 +
    codeExamples * 0.15 +
    versionSuggestions * 0.10
  );

  return {
    overallUsability,
    diagnosisAccuracy,
    solutionSpecificity,
    fileIdentification,
    codeExamples,
    versionSuggestions,
    confidence: result.confidence || 0
  };
}

async function saveResults(testResult: TestResult): Promise<void> {
  const outputDir = path.join(__dirname, '../docs/_archive/RCA-AGENT-UPDATE-12-25-2025/Backend/TEST_RESULTS');
  await fs.mkdir(outputDir, { recursive: true });
  
  const filename = `test1-agp-version-${new Date().toISOString().replace(/:/g, '-')}.json`;
  const filepath = path.join(outputDir, filename);
  
  await fs.writeFile(
    filepath,
    JSON.stringify(testResult, null, 2),
    'utf-8'
  );
  
  console.log(`\n💾 Results saved to: ${filepath}`);
}

// Run test if executed directly
if (require.main === module) {
  runTest1()
    .then(result => saveResults(result))
    .then(() => {
      console.log('\n[OK] Test 1 complete!');
      console.log('\n[NOTE] Next Steps:');
      console.log('   1. Review results in TEST_RESULTS/');
      console.log('   2. Update CHUNK_7_COMPLETION.md');
      console.log('   3. Create Test 2 (Kotlin lateinit NPE)');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n[X] Test failed:', error);
      process.exit(1);
    });
}

export { runTest1, calculateMetrics };
