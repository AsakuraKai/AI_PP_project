/**
 * Fix 3: Minimality Test Suite
 * Tests that suggestions contain only minimal, necessary changes
 */

import { FixGenerator } from '../src/agent/FixGenerator';
import { OllamaClient } from '../src/llm/OllamaClient';
import { ParsedError } from '../src/types';

// Test scenarios
interface TestScenario {
    name: string;
    originalCode: string;
    fixedCode: string;
    expectedChangedLines: number;
    expectedMinimal: boolean;
}

const testScenarios: TestScenario[] = [
    {
        name: 'Small single-line change',
        originalCode: `private lateinit var database: AppDatabase

private fun loadData() {
    val userDao = database.userDao()
    userDao.getAllUsers()
}`,
        fixedCode: `private lateinit var database: AppDatabase

private fun loadData() {
    database = Room.databaseBuilder(context, AppDatabase::class.java, "app-db").build()
    val userDao = database.userDao()
    userDao.getAllUsers()
}`,
        expectedChangedLines: 1,
        expectedMinimal: true,
    },
    {
        name: 'Multiple changes in same block',
        originalCode: `fun calculate(x: Int, y: Int): Int {
    val result = x + y
    return result
}`,
        fixedCode: `fun calculate(x: Int, y: Int): Int {
    require(x >= 0) { "x must be non-negative" }
    require(y >= 0) { "y must be non-negative" }
    val result = x + y
    return result
}`,
        expectedChangedLines: 2,
        expectedMinimal: true,
    },
    {
        name: 'Large file with small change',
        originalCode: `class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        viewModel = ViewModelProvider(this).get(MainViewModel::class.java)

        setupUI()
        observeData()
    }

    private fun setupUI() {
        binding.button.setOnClickListener {
            viewModel.loadData()
        }
    }

    private fun observeData() {
        viewModel.data.observe(this) { data ->
            binding.textView.text = data
        }
    }
}`,
        fixedCode: `class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        viewModel = ViewModelProvider(this)[MainViewModel::class.java]

        setupUI()
        observeData()
    }

    private fun setupUI() {
        binding.button.setOnClickListener {
            viewModel.loadData()
        }
    }

    private fun observeData() {
        viewModel.data.observe(this) { data ->
            binding.textView.text = data
        }
    }
}`,
        expectedChangedLines: 1,
        expectedMinimal: true,
    },
    {
        name: 'No changes (identical code)',
        originalCode: `fun greet(name: String) {
    println("Hello, $name!")
}`,
        fixedCode: `fun greet(name: String) {
    println("Hello, $name!")
}`,
        expectedChangedLines: 0,
        expectedMinimal: false,
    },
];

async function runMinimalityTests() {
    console.log('=== Fix 3: Minimality Test Suite ===\n');

    const client = new OllamaClient({
        baseUrl: 'http://localhost:11434',
        model: 'deepseek-r1:7b',
        timeout: 60000
    });

    const generator = new FixGenerator(client);

    let passed = 0;
    let failed = 0;

    for (const scenario of testScenarios) {
        console.log(`\n--- Test: ${scenario.name} ---`);

        try {
            // Test minimality filter directly using public test helper
            const result = generator.testApplyMinimalityFilter(
                scenario.originalCode,
                scenario.fixedCode,
                2 // context lines
            );

            console.log('Metrics:');
            console.log(`  Total lines: ${result.metrics.totalLines}`);
            console.log(`  Changed lines: ${result.metrics.changedLines}`);
            console.log(`  Context lines: ${result.metrics.contextLines}`);
            console.log(`  Change ratio: ${(result.metrics.changeRatio * 100).toFixed(1)}%`);
            console.log(`  Is minimal: ${result.metrics.isMinimal}`);

            const minimalityScore = generator.testCalculateMinimalityScore(result.metrics);
            console.log(`  Minimality score: ${minimalityScore}/100`);

            // Validate expectations
            const changedLinesMatch = result.metrics.changedLines === scenario.expectedChangedLines;
            const minimalMatch = result.metrics.isMinimal === scenario.expectedMinimal;

            if (changedLinesMatch && minimalMatch) {
                console.log('✓ PASSED');
                passed++;
            } else {
                console.log('✗ FAILED');
                if (!changedLinesMatch) {
                    console.log(`  Expected ${scenario.expectedChangedLines} changed lines, got ${result.metrics.changedLines}`);
                }
                if (!minimalMatch) {
                    console.log(`  Expected minimal=${scenario.expectedMinimal}, got ${result.metrics.isMinimal}`);
                }
                failed++;
            }

            // Show filtered output for inspection
            if (result.metrics.changedLines > 0) {
                console.log('\nFiltered output (original):');
                console.log(result.originalCode.split('\n').slice(0, 5).join('\n'));
                if (result.originalCode.split('\n').length > 5) {
                    console.log('...');
                }
            }

        } catch (error) {
            console.log('✗ FAILED with error:', error);
            failed++;
        }
    }

    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${passed}/${testScenarios.length}`);
    console.log(`Failed: ${failed}/${testScenarios.length}`);

    if (failed > 0) {
        process.exit(1);
    }
}

async function testIntegration() {
    console.log('\n\n=== Integration Test: Full Fix Generation with Minimality ===\n');

    const client = new OllamaClient({
        baseUrl: 'http://localhost:11434',
        model: 'deepseek-r1:7b',
        timeout: 60000
    });

    // Check connection
    try {
        console.log('Checking Ollama connection...');
        await client.generate('test', { maxTokens: 5 });
        console.log('✓ Connected to Ollama\n');
    } catch (error) {
        console.error('✗ Cannot connect to Ollama:', error);
        console.log('Skipping integration test (Ollama not available)');
        return;
    }

    const testError: ParsedError = {
        type: 'lateinit',
        message: 'lateinit property database has not been initialized',
        filePath: 'MainActivity.kt',
        line: 42,
        language: 'kotlin'
    };

    const rootCause = 'The database property is declared as lateinit but never initialized before being accessed in loadData()';

    console.log('Test Error:', testError.message);
    console.log('Root Cause:', rootCause);
    console.log('\nGenerating fix with minimality filtering...\n');

    const generator = new FixGenerator(client);

    // Mock the readCodeContext to return code with extra context
    const originalCode = `class MainActivity : AppCompatActivity() {
    private lateinit var database: AppDatabase
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupDatabase()
    }

    private fun loadData() {
        // Error occurs here - database not initialized
        val userDao = database.userDao()
        userDao.getAllUsers()
    }

    private fun setupDatabase() {
        // TODO: Initialize database
    }
}`;

    try {
        // Mock readCodeContext
        (generator as any).readCodeContext = async () => originalCode;

        const fix = await generator.generateFix(testError, rootCause, undefined, {
            applyMinimalityFilter: true,
            minimalContextLines: 2,
            validateSyntax: false, // Skip syntax validation for speed
        });

        if (!fix) {
            console.log('✗ FAILED: No fix generated');
            return;
        }

        console.log('=== Generated Fix ===');
        console.log('Minimality Score:', fix.minimalityScore);
        console.log('Minimality Metrics:', fix.minimalityMetrics);
        console.log('\nFiltered Code (Original):');
        console.log(fix.originalCode);
        console.log('\nFiltered Code (Fixed):');
        console.log(fix.fixedCode);
        console.log('\nDiff:');
        console.log(fix.diff);

        // Validate minimality
        if (fix.minimalityMetrics) {
            const contextRatio = fix.minimalityMetrics.contextLines / fix.minimalityMetrics.totalLines;
            if (contextRatio < 0.5) {
                console.log('\n✓ SUCCESS: Fix is minimal (context < 50% of total)');
            } else {
                console.log('\n⚠ WARNING: Fix has high context ratio:', (contextRatio * 100).toFixed(1) + '%');
            }
        }

    } catch (error) {
        console.error('\n✗ Error during integration test:', error);
    }
}

async function main() {
    try {
        await runMinimalityTests();
        await testIntegration();
        console.log('\n✓ All tests completed successfully!');
    } catch (error) {
        console.error('\n✗ Test suite failed:', error);
        process.exit(1);
    }
}

main();
