/**
 * Populate ChromaDB with Few-Shot Examples (Phase 2)
 *
 * This script seeds the `rca_examples` collection used by SemanticExampleService
 * so semantic search returns real matches.
 *
 * Usage:
 *   # Start ChromaDB first (Python): chroma run --host localhost --port 8000
 *   npm run populate:chromadb
 *
 * Options:
 *   --chromaUrl=http://localhost:8000
 *   --collection=rca_examples
 *   --append          (do not clear collection first)
 */

import * as fs from 'fs';
import * as path from 'path';
import { ChromaClient } from 'chromadb';
import { SemanticExampleService } from '../src/knowledge/SemanticExampleService';
import { FewShotExample, FewShotDatabase } from '../src/knowledge/FewShotExampleService';

type CompiledExamplesFile = {
  allExamples?: FewShotExample[];
};

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.substring(prefix.length) : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function loadJson<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function flattenDatabaseExamples(db: FewShotDatabase): FewShotExample[] {
  return Object.values(db.categories).flatMap(c => c.examples || []);
}

function makeUniqueId(source: 'json' | 'compiled', id: string): string {
  return `${source}_${id}`;
}

async function main() {
  const chromaUrl = getArgValue('chromaUrl') || process.env.CHROMA_URL || 'http://localhost:8000';
  const collectionName = getArgValue('collection') || process.env.CHROMA_COLLECTION || 'rca_examples';
  const append = hasFlag('append');

  const repoRoot = path.resolve(__dirname, '..');
  const jsonDbPath = path.join(repoRoot, 'src', 'knowledge', 'few-shot-examples.json');
  const compiledPath = path.join(repoRoot, 'src', 'knowledge', 'few-shot-examples-compiled.json');

  if (!fs.existsSync(jsonDbPath)) {
    throw new Error(`Missing few-shot database: ${jsonDbPath}`);
  }

  const jsonDb = loadJson<FewShotDatabase>(jsonDbPath);
  const jsonExamples = flattenDatabaseExamples(jsonDb);

  let compiledExamples: FewShotExample[] = [];
  if (fs.existsSync(compiledPath)) {
    const compiled = loadJson<CompiledExamplesFile>(compiledPath);
    compiledExamples = compiled.allExamples || [];
  }

  // Deduplicate by ID within each source, then unify into a single list with source-prefixed IDs
  const seen = new Set<string>();
  const combined: FewShotExample[] = [];

  for (const ex of jsonExamples) {
    if (!ex?.id) continue;
    const id = makeUniqueId('json', ex.id);
    if (seen.has(id)) continue;
    seen.add(id);
    combined.push({ ...ex, id });
  }

  for (const ex of compiledExamples) {
    if (!ex?.id) continue;
    const id = makeUniqueId('compiled', ex.id);
    if (seen.has(id)) continue;
    seen.add(id);
    combined.push({ ...ex, id });
  }

  console.log('🧠 Phase 2: Populate ChromaDB Examples');
  console.log('='.repeat(60));
  console.log(`ChromaDB: ${chromaUrl}`);
  console.log(`Collection: ${collectionName}`);
  console.log(`Mode: ${append ? 'append' : 'clear+seed'}`);
  console.log(`Loaded examples: ${combined.length} (${jsonExamples.length} JSON + ${compiledExamples.length} compiled)`);

  const service = new SemanticExampleService({
    chromaUrl,
    collectionName,
    minSimilarity: 0.6,
    maxExamples: 5,
  });

  await service.initialize();
  if (!service.isAvailable()) {
    throw new Error('ChromaDB not available. Start server first: chroma run --host localhost --port 8000');
  }

  if (!append) {
    console.log('🧹 Clearing collection...');
    await service.clearExamples();
  }

  console.log('[PACKAGE] Seeding examples...');
  await service.bulkAddExamples(combined);

  // Verify count using direct client
  const client = new ChromaClient({ path: chromaUrl });
  const collection = await client.getCollection({ name: collectionName });
  const count = await collection.count();

  console.log('='.repeat(60));
  console.log(`[OK] Done. Collection now contains ${count} documents.`);
  console.log('Next: run `npm run test:phase2` to validate semantic search returns matches.');
}

main().catch(err => {
  console.error('[X] populate-chromadb failed:', err);
  process.exit(1);
});
