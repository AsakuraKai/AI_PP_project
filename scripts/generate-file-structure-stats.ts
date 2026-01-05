/**
 * Script to generate accurate file structure statistics for PROJECT_FILE_STRUCTURE.md
 * Excludes: docs/, node_modules/, .git/
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileStats {
  totalFiles: number;
  totalDirectories: number;
  filesByExtension: Map<string, number>;
  largestDirectories: Array<{ path: string; fileCount: number }>;
}

const EXCLUDED_DIRS = ['node_modules', '.git', 'docs'];
const EXCLUDED_FILES = ['.DS_Store', 'Thumbs.db'];

function shouldExclude(filePath: string): boolean {
  const parts = filePath.split(path.sep);
  return EXCLUDED_DIRS.some(excluded => parts.includes(excluded));
}

function getFileExtension(filename: string): string {
  const ext = path.extname(filename);
  if (!ext) return '(no extension)';
  return ext;
}

function scanDirectory(dirPath: string, stats: FileStats, depth: number = 0): void {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let dirFileCount = 0;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (shouldExclude(fullPath) || EXCLUDED_FILES.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        stats.totalDirectories++;
        scanDirectory(fullPath, stats, depth + 1);
      } else if (entry.isFile()) {
        stats.totalFiles++;
        dirFileCount++;
        const ext = getFileExtension(entry.name);
        stats.filesByExtension.set(ext, (stats.filesByExtension.get(ext) || 0) + 1);
      }
    }

    // Track directories with many files
    if (dirFileCount > 10) {
      stats.largestDirectories.push({
        path: path.relative(process.cwd(), dirPath),
        fileCount: dirFileCount
      });
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error);
  }
}

function generateReport(stats: FileStats): string {
  let report = '# Project File Structure Statistics\n\n';
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  report += '## Summary\n\n';
  report += `- **Total Files:** ${stats.totalFiles}\n`;
  report += `- **Total Directories:** ${stats.totalDirectories}\n`;
  report += `- **Excluded:** docs/, node_modules/, .git/\n\n`;

  report += '## Files by Type\n\n';
  const sortedExtensions = Array.from(stats.filesByExtension.entries())
    .sort((a, b) => b[1] - a[1]);

  report += '| Extension | Count | Description |\n';
  report += '|-----------|-------|-------------|\n';

  const extensionDescriptions: Record<string, string> = {
    '.ts': 'TypeScript source files',
    '.js': 'JavaScript compiled/source files',
    '.d.ts': 'TypeScript declaration files',
    '.js.map': 'JavaScript source maps',
    '.d.ts.map': 'Declaration source maps',
    '.json': 'JSON configuration/data files',
    '.md': 'Markdown documentation',
    '.test.ts': 'TypeScript test files',
    '.svg': 'SVG icon files',
    '.css': 'CSS stylesheets',
    '.html': 'HTML files',
    '.xml': 'XML files',
    '.bin': 'Binary data files',
    '.sqlite3': 'SQLite database files',
    '.vsix': 'VS Code extension package'
  };

  for (const [ext, count] of sortedExtensions) {
    const description = extensionDescriptions[ext] || '';
    report += `| \`${ext}\` | ${count} | ${description} |\n`;
  }

  report += '\n## Directories with Most Files\n\n';
  stats.largestDirectories
    .sort((a, b) => b.fileCount - a.fileCount)
    .slice(0, 15)
    .forEach(dir => {
      report += `- **${dir.path}**: ${dir.fileCount} files\n`;
    });

  return report;
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  console.log(`Scanning project: ${projectRoot}`);
  console.log(`Excluding: ${EXCLUDED_DIRS.join(', ')}\n`);

  const stats: FileStats = {
    totalFiles: 0,
    totalDirectories: 0,
    filesByExtension: new Map(),
    largestDirectories: []
  };

  scanDirectory(projectRoot, stats);

  const report = generateReport(stats);
  
  // Output to console
  console.log(report);

  // Save to file
  const outputPath = path.join(projectRoot, 'PROJECT_STRUCTURE_STATS.md');
  fs.writeFileSync(outputPath, report);
  console.log(`\n✓ Statistics saved to: PROJECT_STRUCTURE_STATS.md`);

  // Generate JSON for programmatic use
  const jsonStats = {
    generated: new Date().toISOString(),
    totalFiles: stats.totalFiles,
    totalDirectories: stats.totalDirectories,
    filesByExtension: Object.fromEntries(stats.filesByExtension),
    largestDirectories: stats.largestDirectories.sort((a, b) => b.fileCount - a.fileCount).slice(0, 15)
  };

  const jsonPath = path.join(projectRoot, 'project-structure-stats.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonStats, null, 2));
  console.log(`✓ JSON statistics saved to: project-structure-stats.json`);
}

main().catch(console.error);
