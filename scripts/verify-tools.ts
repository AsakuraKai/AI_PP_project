/**
 * Tool Verification Script - Comprehensive tool system validation
 * 
 * This script verifies:
 * 1. All backend tools are implemented and registered
 * 2. All extension tools are implemented and registered
 * 3. Tool interfaces match expected signatures
 * 4. Tool registration in agents works correctly
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
export interface ToolVerificationResult {
    name: string;
    fileExists: boolean;
    hasName: boolean;
    hasDescription: boolean;
    hasExecute: boolean;
    errors: string[];
}

export interface VerificationSummary {
    totalTools: number;
    passedTools: number;
    failedTools: number;
    backendToolsFound: number;
    extensionToolsFound: number;
    results: ToolVerificationResult[];
}

// Tool inventory from README
const EXPECTED_BACKEND_TOOLS = [
    { name: 'AndroidBuildTool', file: 'AndroidBuildTool.ts', category: 'android' },
    { name: 'AndroidDocsSearchTool', file: 'AndroidDocsSearchTool.ts', category: 'android' },
    { name: 'DependencyGraphTool', file: 'DependencyGraphTool.ts', category: 'analysis' },
    { name: 'HistoricalPatternTool', file: 'HistoricalPatternTool.ts', category: 'analysis' },
    { name: 'LSPTool', file: 'LSPTool.ts', category: 'analysis' },
    { name: 'ManifestAnalyzerTool', file: 'ManifestAnalyzerTool.ts', category: 'android' },
    { name: 'ReadFileTool', file: 'ReadFileTool.ts', category: 'file' },
    { name: 'SemanticCodeSearchTool', file: 'SemanticCodeSearchTool.ts', category: 'search' },
    { name: 'VersionLookupTool', file: 'VersionLookupTool.ts', category: 'version' },
];

const EXPECTED_EXTENSION_TOOLS = [
    { name: 'ReadFileTool', file: 'FileOperationTool.ts', category: 'file' },
    { name: 'WriteFileTool', file: 'FileOperationTool.ts', category: 'file' },
    { name: 'EditFileTool', file: 'FileOperationTool.ts', category: 'file' },
    { name: 'DeleteFileTool', file: 'FileOperationTool.ts', category: 'file' },
    { name: 'FindFilesTool', file: 'WorkspaceSearchTool.ts', category: 'workspace' },
    { name: 'SearchInFilesTool', file: 'WorkspaceSearchTool.ts', category: 'workspace' },
    { name: 'GetWorkspaceInfoTool', file: 'WorkspaceSearchTool.ts', category: 'workspace' },
    { name: 'DetectGradleFilesTool', file: 'WorkspaceSearchTool.ts', category: 'gradle' },
    { name: 'TerminalTool', file: 'TerminalTool.ts', category: 'terminal' },
    { name: 'GradleCommandHelper', file: 'GradleCommandHelper.ts', category: 'gradle' },
];

export class ToolVerifier {
    private projectRoot: string;
    private results: ToolVerificationResult[] = [];

    constructor() {
        this.projectRoot = process.cwd();
    }

    /**
     * Verify all backend tools
     */
    async verifyBackendTools(): Promise<void> {
        console.log('\n=== Verifying Backend Tools ===\n');

        for (const tool of EXPECTED_BACKEND_TOOLS) {
            const result = await this.verifyTool(
                tool.name,
                path.join(this.projectRoot, 'src', 'tools', tool.file),
                'backend'
            );
            this.results.push(result);
            this.printToolResult(result);
        }
    }

    /**
     * Verify all extension tools
     */
    async verifyExtensionTools(): Promise<void> {
        console.log('\n=== Verifying Extension Tools ===\n');

        for (const tool of EXPECTED_EXTENSION_TOOLS) {
            const result = await this.verifyTool(
                tool.name,
                path.join(this.projectRoot, 'vscode-extension', 'src', 'tools', tool.file),
                'extension'
            );
            this.results.push(result);
            this.printToolResult(result);
        }
    }

    /**
     * Verify ToolRegistry implementation
     */
    async verifyToolRegistry(): Promise<void> {
        console.log('\n=== Verifying ToolRegistry ===\n');

        const backendRegistry = path.join(this.projectRoot, 'src', 'tools', 'ToolRegistry.ts');
        const extensionRegistry = path.join(this.projectRoot, 'vscode-extension', 'src', 'tools', 'ToolRegistry.ts');

        console.log('Backend ToolRegistry:', fs.existsSync(backendRegistry) ? '✅' : '❌');
        console.log('Extension ToolRegistry:', fs.existsSync(extensionRegistry) ? '✅' : '❌');

        if (fs.existsSync(backendRegistry)) {
            const content = fs.readFileSync(backendRegistry, 'utf-8');
            console.log('  - Has singleton pattern:', content.includes('getInstance') ? '✅' : '❌');
            console.log('  - Has register method:', content.includes('register(') ? '✅' : '❌');
            console.log('  - Has execute method:', content.includes('execute(') ? '✅' : '❌');
            console.log('  - Has Zod validation:', content.includes('ZodSchema') ? '✅' : '❌');
        }
    }

    /**
     * Verify tool registration in agent
     */
    async verifyAgentIntegration(): Promise<void> {
        console.log('\n=== Verifying Agent Integration ===\n');

        const agentFile = path.join(this.projectRoot, 'src', 'agent', 'MinimalReactAgent.ts');

        if (fs.existsSync(agentFile)) {
            const content = fs.readFileSync(agentFile, 'utf-8');
            console.log('MinimalReactAgent found:', '✅');
            console.log('  - Has registerTools method:', content.includes('registerTools') ? '✅' : '❌');
            console.log('  - Registers read_file:', content.includes('read_file') ? '✅' : '❌');
            console.log('  - Registers find_callers:', content.includes('find_callers') ? '✅' : '❌');
            console.log('  - Registers version_lookup:', content.includes('version_lookup') ? '✅' : '❌');
            console.log('  - Uses ToolRegistry:', content.includes('ToolRegistry') ? '✅' : '❌');
        } else {
            console.log('MinimalReactAgent found:', '❌');
        }

        // Check extension tool initialization
        const extensionToolsFile = path.join(this.projectRoot, 'vscode-extension', 'src', 'tools', 'index.ts');

        if (fs.existsSync(extensionToolsFile)) {
            const content = fs.readFileSync(extensionToolsFile, 'utf-8');
            console.log('\nExtension Tool Initialization:', '✅');
            console.log('  - Has initializeTools function:', content.includes('initializeTools') ? '✅' : '❌');
            console.log('  - Registers file tools:', content.includes('ReadFileTool') ? '✅' : '❌');
            console.log('  - Registers workspace tools:', content.includes('FindFilesTool') ? '✅' : '❌');
            console.log('  - Registers terminal tool:', content.includes('TerminalTool') ? '✅' : '❌');
            console.log('  - Registers gradle helper:', content.includes('GradleCommandHelper') ? '✅' : '❌');
        }
    }

    /**
     * Verify ToolOrchestrator implementation
     */
    async verifyToolOrchestrator(): Promise<void> {
        console.log('\n=== Verifying ToolOrchestrator ===\n');

        const orchestratorFile = path.join(this.projectRoot, 'src', 'utils', 'ToolOrchestrator.ts');

        if (fs.existsSync(orchestratorFile)) {
            const content = fs.readFileSync(orchestratorFile, 'utf-8');
            console.log('ToolOrchestrator found:', '✅');
            console.log('  - Has createExecutionPlan:', content.includes('createExecutionPlan') ? '✅' : '❌');
            console.log('  - Has executePlan:', content.includes('executePlan') ? '✅' : '❌');
            console.log('  - Supports parallel execution:', content.includes('Promise.allSettled') ? '✅' : '❌');
            console.log('  - Has result caching:', content.includes('resultCache') ? '✅' : '❌');
        } else {
            console.log('ToolOrchestrator found:', '❌');
        }
    }

    /**
     * Verify individual tool
     */
    private async verifyTool(
        toolName: string,
        filePath: string,
        type: 'backend' | 'extension'
    ): Promise<ToolVerificationResult> {
        const result: ToolVerificationResult = {
            name: toolName,
            fileExists: false,
            hasName: false,
            hasDescription: false,
            hasExecute: false,
            errors: [],
        };

        // Check file exists
        if (!fs.existsSync(filePath)) {
            result.errors.push(`File not found: ${filePath}`);
            return result;
        }
        result.fileExists = true;

        // Read file content
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for class/export matching tool name
        const classPattern = new RegExp(`class\\s+${toolName}`, 'i');
        const exportPattern = new RegExp(`export.*${toolName}`, 'i');

        if (!classPattern.test(content) && !exportPattern.test(content)) {
            result.errors.push(`Tool class "${toolName}" not found in file`);
        }

        // Check for name property/field
        const namePattern = /name\s*=\s*['"]|name:\s*['"]|readonly\s+name\s*=\s*['"]/;
        result.hasName = namePattern.test(content);
        if (!result.hasName) {
            result.errors.push('Missing "name" property');
        }

        // Check for description
        const descPattern = /description\s*=\s*['"]|description:\s*['"]|readonly\s+description\s*=\s*['"]/;
        result.hasDescription = descPattern.test(content);
        if (!result.hasDescription) {
            result.errors.push('Missing "description" property');
        }

        // Check for execute method
        const executePattern = /(?:async\s+)?execute\s*\(/;
        result.hasExecute = executePattern.test(content);
        if (!result.hasExecute) {
            result.errors.push('Missing "execute()" method');
        }

        // For backend tools, check Tool interface implementation
        if (type === 'backend') {
            const implementsPattern = /implements\s+Tool|extends\s+Tool/;
            if (!implementsPattern.test(content) && toolName !== 'AndroidBuildTool' && toolName !== 'ManifestAnalyzerTool') {
                result.errors.push('Does not implement Tool interface (may be helper class)');
            }
        }

        return result;
    }

    /**
     * Print tool verification result
     */
    private printToolResult(result: ToolVerificationResult): void {
        const status = result.errors.length === 0 ? '✅' : '❌';
        console.log(`${status} ${result.name}`);

        if (result.errors.length > 0) {
            result.errors.forEach(error => {
                console.log(`     - ${error}`);
            });
        }
    }

    /**
     * Generate summary report
     */
    generateSummary(): VerificationSummary {
        const totalTools = this.results.length;
        const passedTools = this.results.filter(r => r.errors.length === 0).length;
        const failedTools = totalTools - passedTools;

        const backendToolsFound = this.results.filter(r =>
            EXPECTED_BACKEND_TOOLS.some(t => t.name === r.name) && r.fileExists
        ).length;

        const extensionToolsFound = this.results.filter(r =>
            EXPECTED_EXTENSION_TOOLS.some(t => t.name === r.name) && r.fileExists
        ).length;

        return {
            totalTools,
            passedTools,
            failedTools,
            backendToolsFound,
            extensionToolsFound,
            results: this.results,
        };
    }

    /**
     * Print summary
     */
    printSummary(summary: VerificationSummary): void {
        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tools Verified: ${summary.totalTools}`);
        console.log(`✅ Passed: ${summary.passedTools}`);
        console.log(`❌ Failed: ${summary.failedTools}`);
        console.log(`Backend Tools Found: ${summary.backendToolsFound}/${EXPECTED_BACKEND_TOOLS.length}`);
        console.log(`Extension Tools Found: ${summary.extensionToolsFound}/${EXPECTED_EXTENSION_TOOLS.length}`);
        console.log('='.repeat(60));

        if (summary.failedTools > 0) {
            console.log('\n⚠️  Some tools have issues. Review the output above for details.');
        } else {
            console.log('\n🎉 All tools verified successfully!');
        }
    }
}

// Run verification
async function main() {
    console.log('🔍 Tool System Verification Script');
    console.log('===================================\n');

    const verifier = new ToolVerifier();

    await verifier.verifyBackendTools();
    await verifier.verifyExtensionTools();
    await verifier.verifyToolRegistry();
    await verifier.verifyAgentIntegration();
    await verifier.verifyToolOrchestrator();

    const summary = verifier.generateSummary();
    verifier.printSummary(summary);

    // Exit with appropriate code
    process.exit(summary.failedTools > 0 ? 1 : 0);
}

// Execute
main().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
});
