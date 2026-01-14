/**
 * Test Script: Model Adapter (Fine-Tuning Export)
 * 
 * Tests:
 * - Load sample training feedback (20–30 examples)
 * - Convert to fine-tuning entries
 * - Split dataset (80/10/10)
 * - Export to Ollama/OpenAI format
 * - Show file counts and sample JSONL entry
 */

import { ModelAdapter } from '../src/agent/ModelAdapter';
import type { TrainingExample } from '../src/agent/LearningPipeline';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testModelAdapter() {
    console.log('='.repeat(60));
    console.log('TEST 4: Model Adapter (Fine-Tuning Export)');
    console.log('='.repeat(60));
    console.log();

    try {
        // Step 1: Generate sample training examples
        console.log('Step 1: Generating sample training examples...');

        // Create sample training examples (simulating 30 examples from various error types)
        const sampleExamples: TrainingExample[] = [
            // Gradle Build Errors (10 examples)
            {
                id: 'example-1',
                errorType: 'gradle_build',
                errorMessage: 'Could not resolve all dependencies for configuration',
                expectedRootCause: 'Missing repository declaration in build.gradle',
                expectedFixGuidelines: ['Add mavenCentral() to the repositories block'],
                quality: 0.9,
                validated: true,
                sourceRcaId: 'rca-1',
                createdAt: Date.now()
            },
            {
                id: 'example-2',
                errorType: 'gradle_build',
                errorMessage: 'Execution failed for task :app:mergeDebugResources',
                expectedRootCause: 'Duplicate resource definitions',
                expectedFixGuidelines: ['Remove duplicate resource files or use resource qualifiers'],
                quality: 0.85,
                validated: true,
                sourceRcaId: 'rca-2',
                createdAt: Date.now()
            },
            {
                id: 'example-3',
                errorType: 'gradle_build',
                errorMessage: 'Android Gradle plugin requires Java 11',
                expectedRootCause: 'Incompatible Java version',
                expectedFixGuidelines: ['Update to Java 11 or higher in gradle.properties'],
                quality: 0.95,
                validated: true,
                sourceRcaId: 'rca-3',
                createdAt: Date.now()
            },
            {
                id: 'example-4',
                errorType: 'gradle_build',
                errorMessage: 'Could not find com.android.tools.build:gradle',
                expectedRootCause: 'Missing AGP dependency',
                expectedFixGuidelines: ['Add Android Gradle Plugin to build dependencies'],
                quality: 0.88,
                validated: true,
                sourceRcaId: 'rca-4',
                createdAt: Date.now()
            },
            {
                id: 'example-5',
                errorType: 'gradle_build',
                errorMessage: 'Manifest merger failed with multiple errors',
                expectedRootCause: 'Conflicting manifest declarations',
                expectedFixGuidelines: ['Use tools:replace or tools:merge attributes'],
                quality: 0.82,
                validated: true,
                sourceRcaId: 'rca-5',
                createdAt: Date.now()
            },

            // Kotlin Syntax Errors (10 examples)
            {
                id: 'example-6',
                errorType: 'kotlin_syntax',
                errorMessage: 'Unresolved reference: context',
                expectedRootCause: 'Missing import statement for Context',
                expectedFixGuidelines: ['Import android.content.Context'],
                quality: 0.9,
                validated: true,
                sourceRcaId: 'rca-6',
                createdAt: Date.now()
            },
            {
                id: 'example-7',
                errorType: 'kotlin_syntax',
                errorMessage: 'Type mismatch: inferred type is String? but String was expected',
                expectedRootCause: 'Accessing nullable type without null check',
                expectedFixGuidelines: ['Use safe call operator (?.) or null check'],
                quality: 0.87,
                validated: true,
                sourceRcaId: 'rca-7',
                createdAt: Date.now()
            },
            {
                id: 'example-8',
                errorType: 'kotlin_syntax',
                errorMessage: 'lateinit property has not been initialized',
                expectedRootCause: 'Accessing lateinit property before assignment',
                expectedFixGuidelines: ['Initialize property in onCreate() or use lazy delegate'],
                quality: 0.92,
                validated: true,
                sourceRcaId: 'rca-8',
                createdAt: Date.now()
            },
            {
                id: 'example-9',
                errorType: 'kotlin_syntax',
                errorMessage: 'Smart cast to String is impossible',
                expectedRootCause: 'Variable may be modified between check and use',
                expectedFixGuidelines: ['Use local variable or explicit cast'],
                quality: 0.85,
                validated: true,
                sourceRcaId: 'rca-9',
                createdAt: Date.now()
            },
            {
                id: 'example-10',
                errorType: 'kotlin_syntax',
                errorMessage: 'Overload resolution ambiguity',
                expectedRootCause: 'Multiple functions match the call signature',
                expectedFixGuidelines: ['Use explicit type annotations or rename function'],
                quality: 0.80,
                validated: true,
                sourceRcaId: 'rca-10',
                createdAt: Date.now()
            },

            // Android Manifest Errors (10 examples)
            {
                id: 'example-11',
                errorType: 'android_manifest',
                errorMessage: 'Activity not declared in AndroidManifest.xml',
                expectedRootCause: 'Missing activity declaration',
                expectedFixGuidelines: ['Add <activity> tag with android:name attribute'],
                quality: 0.93,
                validated: true,
                sourceRcaId: 'rca-11',
                createdAt: Date.now()
            },
            {
                id: 'example-12',
                errorType: 'android_manifest',
                errorMessage: 'Permission denied for: android.permission.CAMERA',
                expectedRootCause: 'Permission not declared in manifest',
                expectedFixGuidelines: ['Add <uses-permission> tag in manifest'],
                quality: 0.89,
                validated: true,
                sourceRcaId: 'rca-12',
                createdAt: Date.now()
            },
            {
                id: 'example-13',
                errorType: 'android_manifest',
                errorMessage: 'Duplicate attribute android:name',
                expectedRootCause: 'Same attribute defined twice',
                expectedFixGuidelines: ['Remove duplicate attribute declaration'],
                quality: 0.95,
                validated: true,
                sourceRcaId: 'rca-13',
                createdAt: Date.now()
            },
            {
                id: 'example-14',
                errorType: 'android_manifest',
                errorMessage: 'uses-sdk:minSdkVersion cannot be smaller than 1',
                expectedRootCause: 'Invalid minSdkVersion value',
                expectedFixGuidelines: ['Set minSdkVersion to valid API level (21+)'],
                quality: 0.91,
                validated: true,
                sourceRcaId: 'rca-14',
                createdAt: Date.now()
            },
            {
                id: 'example-15',
                errorType: 'android_manifest',
                errorMessage: 'Attribute application@theme is not allowed',
                expectedRootCause: 'Invalid theme attribute location',
                expectedFixGuidelines: ['Move theme to styles.xml and reference it'],
                quality: 0.84,
                validated: true,
                sourceRcaId: 'rca-15',
                createdAt: Date.now()
            },

            // Runtime Errors (remaining examples)
            {
                id: 'example-16',
                errorType: 'runtime_error',
                errorMessage: 'java.lang.NullPointerException',
                expectedRootCause: 'Object not initialized before use',
                expectedFixGuidelines: ['Add null check or use safe call operator'],
                quality: 0.88,
                validated: true,
                sourceRcaId: 'rca-16',
                createdAt: Date.now()
            },
            {
                id: 'example-17',
                errorType: 'runtime_error',
                errorMessage: 'android.content.ActivityNotFoundException',
                expectedRootCause: 'Target activity not registered',
                expectedFixGuidelines: ['Register activity in AndroidManifest.xml'],
                quality: 0.90,
                validated: true,
                sourceRcaId: 'rca-17',
                createdAt: Date.now()
            },
            {
                id: 'example-18',
                errorType: 'runtime_error',
                errorMessage: 'java.lang.IllegalStateException: Fragment not attached',
                expectedRootCause: 'Accessing context after fragment detached',
                expectedFixGuidelines: ['Check isAdded() before accessing context'],
                quality: 0.86,
                validated: true,
                sourceRcaId: 'rca-18',
                createdAt: Date.now()
            },
            {
                id: 'example-19',
                errorType: 'runtime_error',
                errorMessage: 'android.view.InflateException',
                expectedRootCause: 'Invalid XML syntax or missing resources',
                expectedFixGuidelines: ['Check XML syntax and resource references'],
                quality: 0.83,
                validated: true,
                sourceRcaId: 'rca-19',
                createdAt: Date.now()
            },
            {
                id: 'example-20',
                errorType: 'runtime_error',
                errorMessage: 'java.lang.ClassCastException',
                expectedRootCause: 'Incorrect type cast',
                expectedFixGuidelines: ['Use instanceof check before casting'],
                quality: 0.87,
                validated: true,
                sourceRcaId: 'rca-20',
                createdAt: Date.now()
            },
            {
                id: 'example-21',
                errorType: 'dependency_error',
                errorMessage: 'Failed to resolve: androidx.appcompat:appcompat:1.6.1',
                expectedRootCause: 'Repository not accessible',
                expectedFixGuidelines: ['Check internet connection and add google() repository'],
                quality: 0.89,
                validated: true,
                sourceRcaId: 'rca-21',
                createdAt: Date.now()
            },
            {
                id: 'example-22',
                errorType: 'dependency_error',
                errorMessage: 'Duplicate class found in modules',
                expectedRootCause: 'Multiple versions of same library',
                expectedFixGuidelines: ['Use dependency resolution strategy to exclude duplicates'],
                quality: 0.85,
                validated: true,
                sourceRcaId: 'rca-22',
                createdAt: Date.now()
            },
            {
                id: 'example-23',
                errorType: 'layout_error',
                errorMessage: 'Binary XML file line #12: Error inflating class',
                expectedRootCause: 'Missing no-arg constructor',
                expectedFixGuidelines: ['Add public no-arg constructor to custom view'],
                quality: 0.88,
                validated: true,
                sourceRcaId: 'rca-23',
                createdAt: Date.now()
            },
            {
                id: 'example-24',
                errorType: 'layout_error',
                errorMessage: 'RecyclerView: No adapter attached',
                expectedRootCause: 'Adapter not set',
                expectedFixGuidelines: ['Call recyclerView.adapter = myAdapter'],
                quality: 0.91,
                validated: true,
                sourceRcaId: 'rca-24',
                createdAt: Date.now()
            },
            {
                id: 'example-25',
                errorType: 'network_error',
                errorMessage: 'java.net.UnknownHostException',
                expectedRootCause: 'No internet connection or invalid URL',
                expectedFixGuidelines: ['Check connectivity and validate URL'],
                quality: 0.84,
                validated: true,
                sourceRcaId: 'rca-25',
                createdAt: Date.now()
            },
            {
                id: 'example-26',
                errorType: 'network_error',
                errorMessage: 'javax.net.ssl.SSLHandshakeException',
                expectedRootCause: 'SSL certificate validation failed',
                expectedFixGuidelines: ['Update security config or certificate pinning'],
                quality: 0.82,
                validated: true,
                sourceRcaId: 'rca-26',
                createdAt: Date.now()
            },
            {
                id: 'example-27',
                errorType: 'database_error',
                errorMessage: 'SQLiteException: no such table',
                expectedRootCause: 'Table not created or wrong database version',
                expectedFixGuidelines: ['Run CREATE TABLE statement or update database version'],
                quality: 0.90,
                validated: true,
                sourceRcaId: 'rca-27',
                createdAt: Date.now()
            },
            {
                id: 'example-28',
                errorType: 'database_error',
                errorMessage: 'IllegalStateException: Cannot access database',
                expectedRootCause: 'Database accessed on main thread',
                expectedFixGuidelines: ['Use coroutines or background thread for database operations'],
                quality: 0.93,
                validated: true,
                sourceRcaId: 'rca-28',
                createdAt: Date.now()
            },
            {
                id: 'example-29',
                errorType: 'proguard_error',
                errorMessage: 'ClassNotFoundException after ProGuard',
                expectedRootCause: 'Required class obfuscated or removed',
                expectedFixGuidelines: ['Add -keep rule for the class in proguard-rules.pro'],
                quality: 0.86,
                validated: true,
                sourceRcaId: 'rca-29',
                createdAt: Date.now()
            },
            {
                id: 'example-30',
                errorType: 'proguard_error',
                errorMessage: 'NoSuchMethodException in release APK',
                expectedRootCause: 'Method name obfuscated',
                expectedFixGuidelines: ['Add -keepclassmembers rule for reflected methods'],
                quality: 0.88,
                validated: true,
                sourceRcaId: 'rca-30',
                createdAt: Date.now()
            }
        ];

        const exampleCount = sampleExamples.length;
        console.log(`✓ Generated ${exampleCount} training examples\n`);

        // Step 2: Convert to fine-tuning entries
        console.log('Step 2: Converting to fine-tuning entries...');

        const adapter = new ModelAdapter({
            format: 'ollama',
            split: { train: 0.8, validation: 0.1, test: 0.1 },
            includeSystemPrompts: true,
            maxExamplesPerType: 50,
            enableLogging: true
        });

        const entries = adapter.convertExamples(sampleExamples);

        console.log(`✓ Converted ${entries.length} entries\n`);

        // Step 3: Split dataset
        console.log('Step 3: Splitting dataset (80/10/10)...');

        const split = adapter.splitDataset(entries);

        console.log(`✓ Dataset split complete:`);
        console.log(`  - Training:   ${split.train.length} entries`);
        console.log(`  - Validation: ${split.validation.length} entries`);
        console.log(`  - Test:       ${split.test.length} entries\n`);

        // Step 4: Export dataset
        console.log('Step 4: Exporting to Ollama format...');

        const dataset = adapter.exportDataset(entries);

        console.log(`✓ Export complete:`);
        console.log(`  - Total entries:    ${dataset.stats.totalEntries}`);
        console.log(`  - Train count:      ${dataset.stats.trainCount}`);
        console.log(`  - Validation count: ${dataset.stats.validationCount}`);
        console.log(`  - Test count:       ${dataset.stats.testCount}`);
        console.log(`  - Format:           ${dataset.stats.format}\n`);

        // Step 5: Show sample JSONL entry
        console.log('Step 5: Sample JSONL Output:');
        console.log('-'.repeat(60));

        const trainLines = dataset.train.split('\n').filter(line => line.trim());
        if (trainLines.length > 0) {
            const sampleEntry = JSON.parse(trainLines[0]);
            console.log(JSON.stringify(sampleEntry, null, 2));
        }
        console.log('-'.repeat(60));
        console.log();

        // Step 6: Save to files
        const outputDir = path.join(process.cwd(), 'fine-tuning');
        await fs.mkdir(outputDir, { recursive: true });

        await fs.writeFile(path.join(outputDir, 'train.jsonl'), dataset.train);
        await fs.writeFile(path.join(outputDir, 'validation.jsonl'), dataset.validation);
        await fs.writeFile(path.join(outputDir, 'test.jsonl'), dataset.test);

        console.log('Files saved to fine-tuning/ directory:');
        console.log(`  - train.jsonl       (${dataset.stats.trainCount} entries)`);
        console.log(`  - validation.jsonl  (${dataset.stats.validationCount} entries)`);
        console.log(`  - test.jsonl        (${dataset.stats.testCount} entries)\n`);

        // Summary
        console.log('='.repeat(60));
        console.log('TEST PASSED: Model Adapter Export');
        console.log('='.repeat(60));
        console.log();
        console.log('Summary:');
        console.log(`  ✓ Loaded ${exampleCount} training examples`);
        console.log(`  ✓ Converted to ${entries.length} fine-tuning entries`);
        console.log(`  ✓ Split dataset (${split.train.length}/${split.validation.length}/${split.test.length})`);
        console.log(`  ✓ Exported to ${dataset.stats.format.toUpperCase()} format`);
        console.log(`  ✓ Saved to fine-tuning/ directory`);
        console.log();

    } catch (error) {
        console.error('TEST FAILED:', error);
        process.exit(1);
    }
}

// Run test
testModelAdapter().catch(console.error);
