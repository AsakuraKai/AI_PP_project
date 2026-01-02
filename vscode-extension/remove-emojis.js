/**
 * Script to remove all emojis from the RCA Agent UI
 * 
 * This script systematically removes emoji characters from:
 * - TypeScript source files
 * - Markdown documentation
 * - Test files
 * 
 * Usage: node remove-emojis.js
 */

const fs = require('fs');
const path = require('path');

// Emoji regex pattern - matches all emoji characters
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{2753}\u{2139}\u{25B6}\u{23F8}\u{21BB}\u{2699}\u{2717}\u{2713}\u{26A0}\u{1F4A1}\u{1F4CA}\u{1F4CB}\u{1F4BE}\u{1F4C1}\u{1F4DD}\u{1F4D6}\u{1F4D3}\u{1F4D1}\u{1F4DA}\u{1F4E5}\u{1F4E6}\u{1F4DC}\u{1F4C4}\u{1F4C3}\u{1F4D1}\u{1F4D8}][\u{FE00}-\u{FE0F}]?/gu;

// Replacement map for common emojis
const emojiReplacements = {
  // Status indicators
  '\u2705': '\u2713',  // ✅ -> ✓
  '\u274C': '\u2717',  // ❌ -> ✗
  '\u26A0\uFE0F': '!', // ⚠️ -> !
  '\u26A0': '!',       // ⚠ -> !
  '\u2753': '?',       // ❓ -> ?
  '\u2139\uFE0F': 'i', // ℹ️ -> i
  '\u2139': 'i',       // ℹ -> i
  
  // Action buttons
  '\uD83D\uDD04': '\u21BB',  // 🔄 -> ↻
  '\u2699\uFE0F': '\u2699',   // ⚙️ -> ⚙
  '\u23F8': '||',            // ⏸ -> ||
  '\u25B6\uFE0F': '\u25B6',   // ▶️ -> ▶
  '\u25B6': '>',             // ▶ -> >
  
  // Colored circles (error types) - replace with text labels
  '\uD83D\uDD34': '[ERROR]',     // 🔴 -> [ERROR]
  '\uD83D\uDFE1': '[BUILD]',     // 🟡 -> [BUILD]
  '\uD83D\uDFE3': '[COMPOSE]',   // 🟣 -> [COMPOSE]
  '\uD83D\uDFE0': '[XML]',       // 🟠 -> [XML]
  '\uD83D\uDFE2': '[MANIFEST]',  // 🟢 -> [MANIFEST]
  '\uD83D\uDD35': '[INFO]',      // 🔵 -> [INFO]
  '\u26AA': '[UNKNOWN]',        // ⚪ -> [UNKNOWN]
  
  // Tools
  '\uD83D\uDCD6': '[FILE]',      // 📖 -> [FILE]
  '\uD83D\uDD0D': '[SEARCH]',    // 🔍 -> [SEARCH]
  '\uD83D\uDCDA': '[DB]',        // 📚 -> [DB]
  '\uD83C\uDF10': '[WEB]',       // 🌐 -> [WEB]
  '\uD83D\uDCDD': '[CODE]',      // 📝 -> [CODE]
  '\uD83D\uDD27': '[TOOL]',      // 🔧 -> [TOOL]
  
  // Progress/Status
  '\uD83D\uDCA1': 'TIP:',        // 💡 -> TIP:
  '\uD83D\uDCCA': '[METRICS]',   // 📊 -> [METRICS]
  '\uD83D\uDCCB': '[LOG]',       // 📋 -> [LOG]
  '\uD83D\uDCBE': '[SAVE]',      // 💾 -> [SAVE]
  '\uD83C\uDFC1': '[FILE]',      // 📁 -> [FILE]
  '\uD83C\uDFAF': '[TARGET]',    // 🎯 -> [TARGET]
  '\uD83C\uDF89': 'DONE',        // 🎉 -> DONE
  '\uD83E\uDD16': '[AI]',        // 🤖 -> [AI]
  '\uD83E\uDDE0': '[ANALYZE]',   // 🧠 -> [ANALYZE]
  '\uD83D\uDC1B': '[BUG]',       // 🐛 -> [BUG]
  
  // Compose/Android specific
  '\uD83C\uDFA8': '[COMPOSE]',   // 🎨 -> [COMPOSE]
  '\uD83D\uDCC4': '[XML]',       // 📄 -> [XML]
  '\uD83D\uDCE6': '[PACKAGE]',   // 📦 -> [PACKAGE]
  '\uD83D\uDCCB': '[MANIFEST]',  // 📋 -> [MANIFEST]
  
  // Feedback
  '\uD83D\uDC4D': '[HELPFUL]',   // 👍 -> [HELPFUL]
  '\uD83D\uDC4E': '[NOT_HELPFUL]', // 👎 -> [NOT_HELPFUL]
  '\uD83D\uDCAC': '[COMMENT]',   // 💬 -> [COMMENT]
  
  // Educational
  '\uD83C\uDF93': '[LEARN]',     // 🎓 -> [LEARN]
  '\uD83D\uDE80': '[START]',     // 🚀 -> [START]
  '\uD83D\uDC4B': '[WELCOME]',   // 👋 -> [WELCOME]
  
  // Misc
  '\u2728': '*',                 // ✨ -> *
  '\u2B07\uFE0F': '\u2193',      // ⬇️ -> ↓
  '\u2B07': '\u2193',            // ⬇ -> ↓
  '\u{1F4C8}': '^',              // 📈 -> ^
  '\u{1F4C9}': 'v',              // 📉 -> v
  '\u{27A1}\uFE0F': '->',        // ➡️ -> ->
};

// Files to process
const filesToProcess = [
  'src/extension.ts',
  'src/panel/webview-content.ts',
  'src/panel/EmptyStateTemplates.ts',
  'src/panel/ErrorBoundary.ts',
  'src/views/ErrorTreeProvider.ts',
  'src/views/HistoryTreeProvider.ts',
  'src/views/AgentStateViewer.ts',
  'src/ui/RCAWebview.ts',
  'src/integrations/RCACodeActionProvider.ts',
  'src/integrations/StatusBarManager.ts',
  'README.md',
  'USER_GUIDE.md',
  'KEYBOARD_SHORTCUTS.md',
  'EDUCATIONAL_MODE.md',
  'QUICKSTART.md',
  'src/test/integrations/RCACodeActionProvider.test.ts',
  'test/load/load-test.ts',
];

function removeEmojis(content) {
  let result = content;
  
  // First, apply specific replacements
  for (const [emoji, replacement] of Object.entries(emojiReplacements)) {
    result = result.split(emoji).join(replacement);
  }
  
  // Then remove any remaining emojis
  result = result.replace(emojiRegex, '');
  
  return result;
}

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} (not found)`);
    return;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const cleaned = removeEmojis(content);
    
    if (content !== cleaned) {
      fs.writeFileSync(fullPath, cleaned, 'utf8');
      console.log(`✓ Processed ${filePath}`);
    } else {
      console.log(`- No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('Removing emojis from RCA Agent UI...\n');
  
  filesToProcess.forEach(processFile);
  
  console.log('\nDone! All emojis have been removed.');
  console.log('Please review the changes before committing.');
}

main();
