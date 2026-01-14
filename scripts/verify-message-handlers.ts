/**
 * Message Handler Verification Script
 * 
 * This script verifies that all message commands sent by webview hooks
 * have corresponding handlers in RCAWebviewProvider.
 * 
 * Run with: npx ts-node scripts/verify-message-handlers.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Expected commands sent from webview hooks
const expectedCommands = [
    // Dashboard commands
    'getDashboardData',
    'analyzeAllErrors',
    'scanWorkspace',
    'openSettings',
    'checkOllamaStatus',

    // Error Queue commands
    'getErrorQueue',
    'refreshErrorQueue',
    'removeError',
    'pinError',
    'unpinError',
    'analyzeMultipleErrors',
    'clearCompletedErrors',
    'clearAllErrors',
    'openErrorLocation',

    // Analysis commands
    'analyzeError',
    'startAnalysis',
    'startManualAnalysis',
    'cancelAnalysis',
    'applyFixById',  // Fixed from 'applyFix'
    'exportResult',   // Fixed from 'exportAnalysis'

    // History commands
    'getHistory',
    'searchHistory',
    'reanalyzeFromHistory',
    'deleteHistoryItem',
    'clearHistory',
    'exportHistoryItem',
    'exportAllHistory',
    'refreshHistory',

    // Agent State commands
    'subscribeAgentState',
    'unsubscribeAgentState',
    'getToolMetrics',

    // Fix Manager commands
    'getPendingFixes',
    'getAppliedFixes',
    'previewFix',
    'applyFix',       // Still exists for full fix objects
    'rejectFix',
    'applyMultipleFixes',
    'rejectMultipleFixes',
    'clearAppliedFixes',

    // Metrics commands
    'getMetrics',
    'exportMetrics',

    // Configuration commands
    'updateConfig',

    // Navigation commands
    'navigate'
];

// Expected response commands sent from extension to webview
const expectedResponses = [
    'dashboardData',
    'ollamaStatus',
    'errorQueueData',
    'errorUpdated',
    'errorAdded',
    'errorRemoved',
    'analysisStarted',
    'analysisProgress',
    'analysisComplete',
    'analysisError',
    'analysisCancelled',
    'fixApplied',
    'fixApplyError',
    'fixRejected',
    'fixesCleared',
    'configUpdated',
    'routeChanged',
    'historyData',
    'historyUpdated',
    'searchHistoryResults',
    'historyItemDeleted',
    'historyCleared',
    'agentStateUpdate',
    'agentIterationUpdate',
    'agentThoughtUpdate',
    'agentActionUpdate',
    'agentObservationUpdate',
    'agentHypothesisUpdate',
    'agentPhaseUpdate',
    'agentComplete',
    'agentError',
    'toolMetricsData',
    'consensusData',
    'pendingFixesData',
    'appliedFixesData',
    'diffPreviewData',
    'metricsData',
    'metricsUpdated'
];

function extractHandlersFromProvider(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const handlers: string[] = [];

    // Extract case statements from _handleMessage
    const caseRegex = /case '([^']+)':/g;
    let match;

    while ((match = caseRegex.exec(content)) !== null) {
        handlers.push(match[1]);
    }

    return handlers;
}

function extractSentMessagesFromProvider(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const messages: string[] = [];

    // Extract command values from _sendMessage calls
    const sendRegex = /command:\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = sendRegex.exec(content)) !== null) {
        if (!messages.includes(match[1])) {
            messages.push(match[1]);
        }
    }

    return messages;
}

function main() {
    const providerPath = path.join(__dirname, '../vscode-extension/src/webview/RCAWebviewProvider.ts');

    console.log('='.repeat(80));
    console.log('MESSAGE HANDLER VERIFICATION REPORT');
    console.log('='.repeat(80));
    console.log();

    // Extract actual handlers
    const actualHandlers = extractHandlersFromProvider(providerPath);
    console.log(`✓ Found ${actualHandlers.length} case handlers in RCAWebviewProvider`);

    // Extract actual sent messages
    const actualResponses = extractSentMessagesFromProvider(providerPath);
    console.log(`✓ Found ${actualResponses.length} unique response messages sent to webview`);
    console.log();

    // Check for missing handlers
    console.log('COMMAND HANDLER COVERAGE:');
    console.log('-'.repeat(80));

    const missingHandlers = expectedCommands.filter(cmd => !actualHandlers.includes(cmd));
    const extraHandlers = actualHandlers.filter(cmd => !expectedCommands.includes(cmd));

    if (missingHandlers.length === 0) {
        console.log('[OK] All expected commands have handlers!');
    } else {
        console.log(`[X] Missing handlers for ${missingHandlers.length} commands:`);
        missingHandlers.forEach(cmd => console.log(`  - ${cmd}`));
    }

    if (extraHandlers.length > 0) {
        console.log();
        console.log(`ℹ️  Extra handlers not in expected list (${extraHandlers.length}):`);
        extraHandlers.forEach(cmd => console.log(`  + ${cmd}`));
    }

    console.log();
    console.log('RESPONSE MESSAGE COVERAGE:');
    console.log('-'.repeat(80));

    const missingResponses = expectedResponses.filter(cmd => !actualResponses.includes(cmd));
    const extraResponses = actualResponses.filter(cmd => !expectedResponses.includes(cmd));

    if (missingResponses.length === 0) {
        console.log('[OK] All expected response messages are sent!');
    } else {
        console.log(`[WARN]  Response messages in spec but not sent (${missingResponses.length}):`);
        missingResponses.forEach(cmd => console.log(`  - ${cmd}`));
    }

    if (extraResponses.length > 0) {
        console.log();
        console.log(`ℹ️  Extra responses not in expected list (${extraResponses.length}):`);
        extraResponses.forEach(cmd => console.log(`  + ${cmd}`));
    }

    console.log();
    console.log('='.repeat(80));
    console.log('SUMMARY:');
    console.log(`  Commands: ${expectedCommands.length} expected, ${actualHandlers.length} implemented`);
    console.log(`  Responses: ${expectedResponses.length} expected, ${actualResponses.length} sent`);
    console.log(`  Missing Handlers: ${missingHandlers.length}`);
    console.log(`  Missing Responses: ${missingResponses.length}`);

    if (missingHandlers.length === 0 && missingResponses.length === 0) {
        console.log();
        console.log('[OK] MESSAGE PASSING LAYER: VERIFIED AND COMPLETE!');
        process.exit(0);
    } else {
        console.log();
        console.log('[WARN]  MESSAGE PASSING LAYER: ISSUES FOUND - SEE ABOVE');
        process.exit(1);
    }
}

main();
