/**
 * Test Fix Generation - Diagnostic script to verify fix generation works
 * 
 * This script tests the full pipeline:
 * 1. Parse error
 * 2. Run MinimalReactAgent analysis
 * 3. Check if codeFix is generated
 * 4. Display the fix
 */

import { MinimalReactAgent } from '../src/agent/MinimalReactAgent';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ErrorParser } from '../src/utils/ErrorParser';

const TEST_ERROR = `
Exception in thread "main" kotlin.UninitializedPropertyAccessException: lateinit property database has not been initialized
    at com.example.app.MainActivity.onCreate(MainActivity.kt:42)
    at android.app.Activity.performCreate(Activity.java:8051)
`;

async function main() {
    console.log('='.repeat(80));
    console.log('FIX GENERATION DIAGNOSTIC TEST');
    console.log('='.repeat(80));

    // Initialize components
    console.log('\n[1/4] Initializing OllamaClient...');
    const client = new OllamaClient({
        baseUrl: 'http://localhost:11434',
        model: 'deepseek-r1:7b',
        timeout: 90000
    });

    // Check Ollama connectivity
    try {
        await client.generate('test', { maxTokens: 5 });
        console.log('✓ Ollama connection successful');
    } catch (error) {
        console.error('✗ Ollama connection failed:', error);
        process.exit(1);
    }

    // Initialize agent with generateFix enabled
    console.log('\n[2/4] Initializing MinimalReactAgent with generateFix=true...');
    const agent = new MinimalReactAgent(client, {
        maxIterations: 6,
        timeout: 90000,
        generateFix: true, // ← KEY: Enable fix generation
        usePromptEngine: true,
        useToolRegistry: true,
        projectRoot: process.cwd()
    });
    console.log('✓ Agent initialized');

    // Parse test error
    console.log('\n[3/4] Parsing test error...');
    const errorParser = ErrorParser.getInstance();
    const parsed = errorParser.parse(TEST_ERROR, 'MainActivity.kt');
    if (!parsed) {
        console.error('✗ Failed to parse error');
        process.exit(1);
    }
    console.log('✓ Error parsed:', {
        type: parsed.type,
        file: parsed.filePath,
        line: parsed.line,
        language: parsed.language
    });

    // Run analysis
    console.log('\n[4/4] Running analysis with fix generation...');
    console.log('This may take 30-60 seconds...\n');

    const startTime = Date.now();
    const result = await agent.analyze(parsed);
    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS RESULTS');
    console.log('='.repeat(80));
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`Iterations: ${result.iterations || 'N/A'}`);
    console.log(`Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
    console.log();

    console.log('Root Cause:');
    console.log('-'.repeat(80));
    console.log(result.rootCause);
    console.log();

    // Check if codeFix is present
    console.log('Fix Generation Status:');
    console.log('-'.repeat(80));
    if (result.codeFix) {
        console.log('✓ CODE FIX GENERATED SUCCESSFULLY!');
        console.log();
        console.log('Fix Details:');
        console.log(`  File: ${result.codeFix.filePath}`);
        console.log(`  Line: ${result.codeFix.line}`);
        console.log(`  Confidence: ${result.codeFix.confidence}%`);
        console.log(`  Syntax Valid: ${result.codeFix.syntaxValid}`);
        console.log();
        console.log('Explanation:');
        console.log(result.codeFix.explanation);
        console.log();
        console.log('Diff:');
        console.log(result.codeFix.diff);
        console.log();
        if (result.codeFix.relatedFiles && result.codeFix.relatedFiles.length > 0) {
            console.log(`Related Files: ${result.codeFix.relatedFiles.length}`);
        }
    } else {
        console.log('✗ NO CODE FIX GENERATED!');
        console.log();
        console.log('Possible reasons:');
        console.log('  1. generateFix flag not enabled (but we set it to true)');
        console.log('  2. FixGenerator.generateFix() returned null');
        console.log('  3. File could not be read');
        console.log('  4. Error in FixGenerator execution');
        console.log();
        console.log('Fix Guidelines (text-based):');
        if (result.fixGuidelines && result.fixGuidelines.length > 0) {
            result.fixGuidelines.forEach((guideline, i) => {
                console.log(`  ${i + 1}. ${guideline}`);
            });
        } else {
            console.log('  (none provided)');
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));
}

main().catch(error => {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
});
