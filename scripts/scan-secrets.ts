import { execFileSync } from 'node:child_process';

const patterns = [
  '-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----',
  'AKIA[0-9A-Z]{16}',
  'ASIA[0-9A-Z]{16}',
  'ghp_[0-9A-Za-z]{36}',
  'github_pat_[0-9A-Za-z_]{20,}',
  'sk-[0-9A-Za-z]{20,}',
  'xox[baprs]-[0-9A-Za-z-]{10,}',
  'AIzaSy[0-9A-Za-z_-]{35}',
];

const argv = process.argv.slice(2);
const useCachedIndex = argv.includes('--cached') || argv.includes('--staged');

const gitArgs: string[] = ['grep', '-I', '--name-only', '-E'];
if (useCachedIndex) gitArgs.push('--cached');
for (const pattern of patterns) {
  gitArgs.push('-e', pattern);
}

try {
  const stdout = execFileSync('git', gitArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

  if (stdout.length > 0) {
    const files = stdout.split(/\r?\n/).filter(Boolean);
    console.error('Potential secrets detected in tracked files (filenames only):');
    for (const file of files) console.error(`- ${file}`);
    console.error('Remove secrets from git history and rotate keys immediately.');
    process.exit(2);
  }

  process.exit(0);
} catch (err: any) {
  // git grep returns exit code 1 when no matches are found.
  if (typeof err?.status === 'number' && err.status === 1) {
    process.exit(0);
  }

  const stderr = (err?.stderr ? String(err.stderr) : '').trim();
  console.error('Failed to run secret scan via `git grep`.');
  if (stderr) console.error(stderr);
  process.exit(3);
}
