# Database API Reference

> **Module:** `src/db/` and `src/cache/`  
> **Purpose:** Vector database storage, caching, and quality management  
> **Last Updated:** December 20, 2025 (Chunk 5.5)

---

## Overview

The Database module provides persistent storage for RCA results with semantic search capabilities, fast hash-based caching, and automated quality management. ChromaDB enables similarity search to leverage past analyses.

**Key Components:**
- `ChromaDBClient` - Vector database for RCA storage and semantic search
- `EmbeddingService` - Generate embeddings for similarity search
- `RCACache` - In-memory hash-based caching with TTL
- `ErrorHasher` - Consistent hashing for error deduplication
- `QualityManager` - Automated quality scoring and pruning
- `QualityScorer` - Quality score calculation algorithms
- `FeedbackHandler` - User feedback processing

---

## ChromaDBClient

**File:** `src/db/ChromaDBClient.ts`  
**Purpose:** Vector database integration for RCA storage and semantic search

### Class Definition

```typescript
class ChromaDBClient {
  static async create(options?: ChromaDBOptions): Promise<ChromaDBClient>
  
  async addRCA(rca: RCADocument): Promise<string>
  async getById(id: string): Promise<RCADocument | null>
  async searchSimilar(query: SimilarityQuery): Promise<RCADocument[]>
  async update(id: string, rca: Partial<RCADocument>): Promise<void>
  async delete(id: string): Promise<void>
  async getStats(): Promise<DatabaseStats>
}
```

### create()

Create and initialize ChromaDB client.

```typescript
static async create(options?: ChromaDBOptions): Promise<ChromaDBClient>
```

**Parameters:**
```typescript
interface ChromaDBOptions {
  host?: string;         // Default: 'localhost'
  port?: number;         // Default: 8000
  collectionName?: string; // Default: 'rca_solutions'
}
```

**Returns:** Initialized ChromaDBClient instance

**Example:**
```typescript
// Default configuration
const db = await ChromaDBClient.create();

// Custom configuration
const db = await ChromaDBClient.create({
  host: 'localhost',
  port: 8000,
  collectionName: 'my_rca_collection'
});
```

### addRCA()

Store an RCA document with embedding.

```typescript
async addRCA(rca: RCADocument): Promise<string>
```

**Parameters:**
```typescript
interface RCADocument {
  error_message: string;       // Original error text
  error_type: string;          // Error type (e.g., 'lateinit')
  language: string;            // Language ('kotlin', 'gradle', etc.)
  root_cause: string;          // Root cause explanation
  fix_guidelines: string[];    // Fix steps
  confidence: number;          // Confidence score (0.0-1.0)
  user_validated: boolean;     // User feedback (thumbs up/down)
  quality_score: number;       // Computed quality (0.0-1.0)
  file_path?: string;          // Optional file path
  line?: number;               // Optional line number
  framework?: string;          // Optional framework ('compose', 'android')
  created_at?: number;         // Timestamp (auto-added)
  updated_at?: number;         // Timestamp (auto-added)
}
```

**Returns:** Document ID (UUID)

**Example:**
```typescript
const id = await db.addRCA({
  error_message: 'lateinit property user has not been initialized',
  error_type: 'lateinit',
  language: 'kotlin',
  root_cause: 'Property accessed before initialization in onCreate()',
  fix_guidelines: [
    'Initialize user in onCreate() before accessing',
    'Or use ::user.isInitialized to check first'
  ],
  confidence: 0.9,
  user_validated: false,
  quality_score: 0.9,
  file_path: 'MainActivity.kt',
  line: 45
});

console.log('Stored with ID:', id);
// 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

### searchSimilar()

Find similar RCAs using semantic search.

```typescript
async searchSimilar(query: SimilarityQuery): Promise<RCADocument[]>
```

**Parameters:**
```typescript
interface SimilarityQuery {
  errorMessage: string;      // Query text (error message)
  limit?: number;            // Max results (default: 5)
  minQuality?: number;       // Minimum quality score (default: 0.5)
  language?: string;         // Filter by language
  errorType?: string;        // Filter by error type
}
```

**Returns:** Array of similar RCA documents, ranked by relevance

**Example:**
```typescript
// Find similar lateinit errors
const similar = await db.searchSimilar({
  errorMessage: 'lateinit property data has not been initialized',
  limit: 3,
  minQuality: 0.7,
  language: 'kotlin',
  errorType: 'lateinit'
});

console.log(`Found ${similar.length} similar solutions`);
similar.forEach((rca, i) => {
  console.log(`\n${i + 1}. ${rca.error_message}`);
  console.log(`   Quality: ${rca.quality_score}`);
  console.log(`   Root Cause: ${rca.root_cause}`);
});
```

### getById()

Retrieve RCA document by ID.

```typescript
async getById(id: string): Promise<RCADocument | null>
```

**Example:**
```typescript
const rca = await db.getById(id);

if (rca) {
  console.log('Root Cause:', rca.root_cause);
} else {
  console.log('Document not found');
}
```

### update()

Update existing RCA document.

```typescript
async update(id: string, rca: Partial<RCADocument>): Promise<void>
```

**Example:**
```typescript
// Update after positive feedback
await db.update(id, {
  confidence: 1.0,
  user_validated: true,
  quality_score: 1.0,
  updated_at: Date.now()
});
```

### delete()

Delete RCA document.

```typescript
async delete(id: string): Promise<void>
```

**Example:**
```typescript
// Delete low-quality RCA
await db.delete(id);
```

### getStats()

Get database statistics.

```typescript
async getStats(): Promise<DatabaseStats>
```

**Returns:**
```typescript
interface DatabaseStats {
  totalDocuments: number;
  byLanguage: Record<string, number>;
  byErrorType: Record<string, number>;
  avgQualityScore: number;
  avgConfidence: number;
  userValidatedCount: number;
}
```

**Example:**
```typescript
const stats = await db.getStats();

console.log('Total RCAs:', stats.totalDocuments);
console.log('Avg Quality:', stats.avgQualityScore.toFixed(2));
console.log('By Language:');
Object.entries(stats.byLanguage).forEach(([lang, count]) => {
  console.log(`  ${lang}: ${count}`);
});
```

---

## EmbeddingService

**File:** `src/db/EmbeddingService.ts`  
**Purpose:** Generate embeddings for semantic similarity search

### Class Definition

```typescript
class EmbeddingService {
  static async create(): Promise<EmbeddingService>
  
  async embed(text: string): Promise<number[]>
  async embedBatch(texts: string[]): Promise<number[][]>
}
```

**Note:** Currently returns mock embeddings (simple TF-IDF hashing). Full sentence-transformer integration planned for production.

### embed()

Generate embedding vector for single text.

```typescript
async embed(text: string): Promise<number[]>
```

**Returns:** 384-dimensional vector (default model size)

**Example:**
```typescript
const embedder = await EmbeddingService.create();
const vector = await embedder.embed('lateinit property user');

console.log('Vector length:', vector.length); // 384
console.log('First 5 dims:', vector.slice(0, 5));
```

### embedBatch()

Generate embeddings for multiple texts (efficient).

```typescript
async embedBatch(texts: string[]): Promise<number[][]>
```

**Example:**
```typescript
const errors = [
  'lateinit property user',
  'NullPointerException at line 45',
  'Type mismatch: expected Int'
];

const vectors = await embedder.embedBatch(errors);
console.log(`Generated ${vectors.length} embeddings`);
```

---

## RCACache

**File:** `src/cache/RCACache.ts`  
**Purpose:** Fast in-memory caching with TTL and automatic cleanup

### Class Definition

```typescript
class RCACache {
  constructor(ttl?: number)
  
  get(hash: string): RCAResult | null
  set(hash: string, rca: RCAResult, ttl?: number): void
  has(hash: string): boolean
  invalidate(hash: string): void
  clear(): void
  getStats(): CacheStats
  startAutoCleanup(intervalMs?: number): void
  stopAutoCleanup(): void
}
```

### Constructor

```typescript
constructor(ttl: number = 24 * 60 * 60 * 1000) // 24 hours default
```

**Example:**
```typescript
// 24-hour TTL (default)
const cache = new RCACache();

// Custom TTL (1 hour)
const shortCache = new RCACache(60 * 60 * 1000);
```

### get()

Retrieve cached RCA result.

```typescript
get(hash: string): RCAResult | null
```

**Returns:**
- `RCAResult` if found and not expired
- `null` if not found or expired

**Example:**
```typescript
const result = cache.get(errorHash);

if (result) {
  console.log('Cache hit!');
  console.log('Root Cause:', result.rootCause);
} else {
  console.log('Cache miss');
}
```

### set()

Store RCA result in cache.

```typescript
set(hash: string, rca: RCAResult, ttl?: number): void
```

**Parameters:**
- `hash: string` - Error hash
- `rca: RCAResult` - Analysis result
- `ttl?: number` - Optional custom TTL (ms)

**Example:**
```typescript
// Use default TTL
cache.set(errorHash, result);

// Custom TTL (1 hour)
cache.set(errorHash, result, 60 * 60 * 1000);
```

### has()

Check if hash exists in cache.

```typescript
has(hash: string): boolean
```

### invalidate()

Remove entry from cache.

```typescript
invalidate(hash: string): void
```

**Example:**
```typescript
// User marked as unhelpful - invalidate
await feedbackHandler.handleNegative(rcaId, errorHash);
cache.invalidate(errorHash);
```

### getStats()

Get cache statistics.

```typescript
getStats(): CacheStats
```

**Returns:**
```typescript
interface CacheStats {
  size: number;           // Current entries
  hits: number;           // Cache hits
  misses: number;         // Cache misses
  hitRate: number;        // Hit rate (0.0-1.0)
  avgAge: number;         // Average entry age (ms)
  oldestEntry: number;    // Oldest entry age (ms)
}
```

**Example:**
```typescript
const stats = cache.getStats();

console.log('Cache size:', stats.size);
console.log('Hit rate:', (stats.hitRate * 100).toFixed(1) + '%');
console.log('Hits/Misses:', `${stats.hits}/${stats.misses}`);
```

### Auto Cleanup

```typescript
startAutoCleanup(intervalMs: number = 60000): void
stopAutoCleanup(): void
```

**Example:**
```typescript
// Start cleanup every 5 minutes
cache.startAutoCleanup(5 * 60 * 1000);

// Stop cleanup (on shutdown)
cache.stopAutoCleanup();
```

---

## ErrorHasher

**File:** `src/cache/ErrorHasher.ts`  
**Purpose:** Consistent hashing for error deduplication

### Class Definition

```typescript
class ErrorHasher {
  hash(error: ParsedError): string
  hashText(errorText: string, language?: string): string
}
```

### hash()

Generate hash from ParsedError object.

```typescript
hash(error: ParsedError): string
```

**Returns:** SHA-256 hash (64 hex characters)

**Hashing Strategy:**
- Normalizes error message (lowercase, whitespace, numbers → 'N')
- Includes error type
- Includes file path (normalized)
- Includes line number
- Consistent across sessions

**Example:**
```typescript
const hasher = new ErrorHasher();

const error1: ParsedError = {
  type: 'lateinit',
  message: 'lateinit property user has not been initialized',
  filePath: 'MainActivity.kt',
  line: 45,
  language: 'kotlin'
};

const hash1 = hasher.hash(error1);
console.log('Hash:', hash1);
// 'a3f8e9b2c4d6f1a5e9b2c4d6f1a5e9b2c4d6f1a5e9b2c4d6f1a5e9b2c4d6f1a5'

// Same error, different wording → same hash
const error2: ParsedError = {
  ...error1,
  message: 'lateinit property user has not been initialized'
};

const hash2 = hasher.hash(error2);
console.log('Hashes match:', hash1 === hash2); // true
```

### hashText()

Generate hash from raw error text (for quick lookups).

```typescript
hashText(errorText: string, language?: string): string
```

**Example:**
```typescript
const hash = hasher.hashText('lateinit property user', 'kotlin');
```

---

## QualityManager

**File:** `src/db/QualityManager.ts`  
**Purpose:** Automated quality scoring and pruning

### Class Definition

```typescript
class QualityManager {
  constructor(db: ChromaDBClient, scorer: QualityScorer)
  
  async updateQualityScores(): Promise<void>
  async pruneLowQuality(threshold?: number): Promise<number>
  async getQualityDistribution(): Promise<QualityDistribution>
}
```

### updateQualityScores()

Recalculate quality scores for all RCAs.

```typescript
async updateQualityScores(): Promise<void>
```

**Use Cases:**
- Periodic maintenance (weekly)
- After significant feedback changes
- Before reporting

**Example:**
```typescript
const manager = new QualityManager(db, scorer);

await manager.updateQualityScores();
console.log('Quality scores updated');
```

### pruneLowQuality()

Delete RCAs below quality threshold.

```typescript
async pruneLowQuality(threshold: number = 0.3): Promise<number>
```

**Returns:** Number of deleted documents

**Example:**
```typescript
// Delete RCAs with quality < 0.3
const deleted = await manager.pruneLowQuality(0.3);

console.log(`Pruned ${deleted} low-quality RCAs`);
```

### getQualityDistribution()

Get quality score distribution.

```typescript
async getQualityDistribution(): Promise<QualityDistribution>
```

**Returns:**
```typescript
interface QualityDistribution {
  total: number;
  byRange: {
    '0.0-0.3': number;  // Very low
    '0.3-0.5': number;  // Low
    '0.5-0.7': number;  // Medium
    '0.7-0.9': number;  // High
    '0.9-1.0': number;  // Very high
  };
  avgScore: number;
}
```

**Example:**
```typescript
const dist = await manager.getQualityDistribution();

console.log('Quality Distribution:');
console.log('  Very Low (0.0-0.3):', dist.byRange['0.0-0.3']);
console.log('  Low (0.3-0.5):', dist.byRange['0.3-0.5']);
console.log('  Medium (0.5-0.7):', dist.byRange['0.5-0.7']);
console.log('  High (0.7-0.9):', dist.byRange['0.7-0.9']);
console.log('  Very High (0.9-1.0):', dist.byRange['0.9-1.0']);
console.log('  Average:', dist.avgScore.toFixed(2));
```

---

## QualityScorer

**File:** `src/db/QualityScorer.ts`  
**Purpose:** Calculate quality scores based on multiple factors

### Class Definition

```typescript
class QualityScorer {
  calculate(rca: RCADocument): number
}
```

### calculate()

Compute quality score for an RCA document.

```typescript
calculate(rca: RCADocument): number
```

**Returns:** Quality score (0.0-1.0)

**Scoring Factors:**
1. **Base Confidence** (50% weight) - From LLM analysis
2. **User Validation** (+20%) - Thumbs up from user
3. **Age Penalty** - 50% reduction after 6 months
4. **Completeness** (+10%) - Has all required fields

**Example:**
```typescript
const scorer = new QualityScorer();

const rca: RCADocument = {
  error_message: 'lateinit property user',
  error_type: 'lateinit',
  language: 'kotlin',
  root_cause: 'Property accessed before initialization',
  fix_guidelines: ['Initialize in onCreate()'],
  confidence: 0.8,
  user_validated: true,
  quality_score: 0, // Will be calculated
  created_at: Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days ago
};

const quality = scorer.calculate(rca);
console.log('Quality score:', quality); // ~0.9 (0.8 base + 0.2 validation, recent)
```

---

## Usage Patterns

### Complete Workflow

```typescript
import { ChromaDBClient } from './db/ChromaDBClient';
import { RCACache } from './cache/RCACache';
import { ErrorHasher } from './cache/ErrorHasher';
import { MinimalReactAgent } from './agent/MinimalReactAgent';

// Initialize
const db = await ChromaDBClient.create();
const cache = new RCACache();
const hasher = new ErrorHasher();
const agent = new MinimalReactAgent(llm);

// Start cache cleanup
cache.startAutoCleanup();

// Parse error
const parsed = parser.parse(errorText);
if (!parsed) {
  console.error('Could not parse error');
  return;
}

// Check cache first
const errorHash = hasher.hash(parsed);
let result = cache.get(errorHash);

if (result) {
  console.log('Cache hit!');
} else {
  console.log('Cache miss, checking database...');
  
  // Search for similar solutions
  const similar = await db.searchSimilar({
    errorMessage: parsed.message,
    limit: 1,
    minQuality: 0.7,
    language: parsed.language,
    errorType: parsed.type
  });
  
  if (similar.length > 0) {
    console.log('Found similar solution in database');
    result = similar[0];
    cache.set(errorHash, result); // Cache for next time
  } else {
    console.log('No similar solutions, running analysis...');
    
    // Perform fresh analysis
    result = await agent.analyze(parsed);
    
    // Store in database
    const id = await db.addRCA({
      error_message: result.error,
      error_type: parsed.type,
      language: parsed.language,
      root_cause: result.rootCause,
      fix_guidelines: result.fixGuidelines,
      confidence: result.confidence,
      user_validated: false,
      quality_score: result.confidence
    });
    
    // Cache result
    cache.set(errorHash, result);
    
    console.log('Stored RCA with ID:', id);
  }
}

// Display result
console.log('\nRoot Cause:', result.rootCause);
console.log('\nFix Guidelines:');
result.fixGuidelines.forEach((step, i) => {
  console.log(`  ${i + 1}. ${step}`);
});
```

### Periodic Maintenance

```typescript
import { QualityManager } from './db/QualityManager';
import { QualityScorer } from './db/QualityScorer';

const scorer = new QualityScorer();
const manager = new QualityManager(db, scorer);

// Run weekly maintenance
setInterval(async () => {
  console.log('Running maintenance...');
  
  // Update quality scores
  await manager.updateQualityScores();
  
  // Prune low-quality RCAs
  const deleted = await manager.pruneLowQuality(0.3);
  console.log(`Pruned ${deleted} low-quality RCAs`);
  
  // Get stats
  const dist = await manager.getQualityDistribution();
  console.log('Avg quality:', dist.avgScore.toFixed(2));
}, 7 * 24 * 60 * 60 * 1000); // Every 7 days
```

---

## Performance

### Database Operations

| Operation | Latency | Notes |
|-----------|---------|-------|
| addRCA | 50-100ms | Includes embedding generation |
| searchSimilar | 20-50ms | Depends on collection size |
| getById | 5-10ms | Direct lookup |
| update | 10-20ms | Updates metadata only |
| delete | 5-10ms | Fast removal |

### Cache Operations

| Operation | Latency | Notes |
|-----------|---------|-------|
| get | <1ms | In-memory lookup |
| set | <1ms | In-memory write |
| has | <1ms | Existence check |
| invalidate | <1ms | Removal |

### Memory Usage

- **ChromaDB:** ~50MB baseline + ~1KB per document
- **RCACache:** ~1KB per cached result
- **10K cached results:** ~10MB
- **100K database entries:** ~100MB (embeddings dominate)

---

## Error Handling

```typescript
// Database connection error
try {
  const db = await ChromaDBClient.create({
    host: 'localhost',
    port: 8000
  });
} catch (error) {
  console.error('ChromaDB connection failed:', error.message);
  console.error('Ensure ChromaDB is running: docker-compose up chroma');
}

// Search error
try {
  const results = await db.searchSimilar({ errorMessage: query });
} catch (error) {
  console.error('Search failed:', error.message);
  // Fallback to fresh analysis
}

// Cache error (shouldn't happen with in-memory)
const result = cache.get(hash);
if (!result) {
  console.log('Cache miss, fetching from database...');
}
```

---

## See Also

- [Agent API](./Agent.md) - Uses database for similar solution lookup
- [Parser API](./Parsers.md) - Provides ParsedError for hashing
- [Tool API](./Tools.md) - Tools can query database
- [Architecture Overview](../architecture/overview.md) - Data flow diagrams
