# Database Design and Schema

> **Last Updated:** December 20, 2025 (Chunk 5.5)  
> **Database:** ChromaDB 0.4.x (Vector Database)  
> **Purpose:** Store RCA results, enable semantic similarity search, support continuous learning

---

## Table of Contents
- [Overview](#overview)
- [ChromaDB Schema](#chromadb-schema)
- [RCA Document Structure](#rca-document-structure)
- [Embedding Strategy](#embedding-strategy)
- [Quality Management](#quality-management)
- [Caching Architecture](#caching-architecture)
- [Query Patterns](#query-patterns)
- [Performance Characteristics](#performance-characteristics)
- [Maintenance and Pruning](#maintenance-and-pruning)

---

## Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Database Layer                              │
│                                                                 │
│  ┌───────────────────┐         ┌──────────────────────────┐    │
│  │   RCACache        │         │    ChromaDB              │    │
│  │   (In-Memory)     │         │    (Persistent Vector DB)│    │
│  │                   │         │                          │    │
│  │ • HashMap<hash,   │         │ • Collection:            │    │
│  │   RCAResult>      │         │   "rca_solutions"        │    │
│  │ • TTL: 24 hours   │         │ • Embeddings:            │    │
│  │ • Auto-cleanup    │         │   384-dimensional        │    │
│  │ • Hit rate: 60%+  │         │ • Documents: JSON        │    │
│  │                   │         │ • Metadata: Filters      │    │
│  └───────────────────┘         └──────────────────────────┘    │
│           ↑                              ↑                      │
│           │                              │                      │
│  ┌────────┴──────────────────────────────┴──────────┐          │
│  │           Unified Access Layer                    │          │
│  │                                                    │          │
│  │  1. Check cache (fast path)                       │          │
│  │  2. Query ChromaDB (semantic search)              │          │
│  │  3. Fresh analysis (fallback)                     │          │
│  │  4. Store result (both cache + DB)                │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Two-Level Storage:**
   - **L1 Cache (Memory):** Fast lookups for exact matches (<1ms)
   - **L2 Database (ChromaDB):** Semantic search for similar errors (20-50ms)

2. **Vector-First Design:**
   - Store embeddings for semantic similarity
   - Enable "fuzzy" error matching
   - Learn from past analyses

3. **Quality-Driven:**
   - Score RCAs based on multiple factors
   - Auto-prune low-quality entries
   - Prioritize validated results

4. **Privacy-Preserving:**
   - All data stored locally
   - No external API calls
   - User controls all data

---

## ChromaDB Schema

### Collection Configuration

```typescript
// Collection: rca_solutions
{
  name: 'rca_solutions',
  metadata: {
    description: 'Root cause analysis solutions for errors',
    hnsw_space: 'cosine', // Cosine similarity for embeddings
    version: '1.0.0'
  }
}
```

### Document Structure

Each ChromaDB document represents one RCA result.

**Fields:**
- `id` (string, UUID) - Unique identifier
- `document` (string, JSON-serialized) - Full RCADocument
- `embedding` (float[], 384-dim) - Vector representation
- `metadata` (object) - Query filters

**Example Entry:**
```typescript
{
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  
  embedding: [0.123, -0.456, 0.789, ... ], // 384 dimensions
  
  document: JSON.stringify({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    error_message: 'lateinit property user has not been initialized',
    error_type: 'lateinit',
    language: 'kotlin',
    file_path: 'MainActivity.kt',
    line_number: 45,
    root_cause: 'Property accessed before initialization in onCreate()',
    fix_guidelines: [
      'Initialize user in onCreate() before accessing',
      'Or use ::user.isInitialized to check first'
    ],
    confidence: 0.92,
    created_at: 1703097234567,
    updated_at: 1703097234567,
    user_validated: false,
    quality_score: 0.85,
    validation_count: 0,
    iterations: 3,
    tools_used: ['read_file', 'find_callers'],
    analysis_time_ms: 42150
  }),
  
  metadata: {
    language: 'kotlin',
    error_type: 'lateinit',
    confidence: 0.92,
    quality_score: 0.85,
    framework: 'android',
    created_at: 1703097234567,
    user_validated: false
  }
}
```

---

## RCA Document Structure

### TypeScript Interface

```typescript
export interface RCADocument {
  // Identity
  id: string;                      // UUID v4
  
  // Error Details
  error_message: string;           // Original error text
  error_type: string;              // Parser-detected type (e.g., 'lateinit', 'npe')
  language: string;                // 'kotlin', 'java', 'xml', 'gradle'
  file_path: string;               // Relative path from workspace root
  line_number: number;             // Line where error occurred
  
  // Analysis Results
  root_cause: string;              // Detailed explanation of root cause
  fix_guidelines: string[];        // Step-by-step fix instructions
  confidence: number;              // 0.0 - 1.0 (agent's confidence)
  
  // Metadata
  created_at: number;              // Unix timestamp (ms)
  updated_at: number;              // Unix timestamp (ms)
  user_validated: boolean;         // True if user gave thumbs up
  quality_score: number;           // 0.0 - 1.0 (calculated score)
  validation_count: number;        // Number of user validations (positive/negative)
  
  // Analysis Metadata
  iterations: number;              // Number of ReAct iterations used
  tools_used: string[];            // List of tools executed
  analysis_time_ms: number;        // Total analysis duration
  
  // Optional Fields
  framework?: string;              // 'android', 'compose', 'spring', etc.
  similar_rca_ids?: string[];      // IDs of similar RCAs (for reference)
  learning_notes?: LearningNotes;  // Educational content (EducationalAgent)
  tags?: string[];                 // User-added tags
}
```

### Field Descriptions

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | UUID | Unique identifier | `f47ac10b-...` |
| `error_message` | string | Original error text | `lateinit property user...` |
| `error_type` | string | Parsed error category | `lateinit`, `npe`, `type_mismatch` |
| `language` | string | Source language | `kotlin`, `java`, `xml`, `gradle` |
| `file_path` | string | Error location | `src/main/MainActivity.kt` |
| `line_number` | number | Line number | `45` |
| `root_cause` | string | Root cause explanation | `Property accessed before...` |
| `fix_guidelines` | string[] | Fix steps | `['Initialize in onCreate()']` |
| `confidence` | number | Agent confidence (0-1) | `0.92` |
| `created_at` | timestamp | Creation time | `1703097234567` |
| `updated_at` | timestamp | Last modification | `1703097234567` |
| `user_validated` | boolean | User validation status | `false` |
| `quality_score` | number | Calculated quality (0-1) | `0.85` |
| `validation_count` | number | User feedback count | `0` |
| `iterations` | number | ReAct iterations used | `3` |
| `tools_used` | string[] | Tools executed | `['read_file']` |
| `analysis_time_ms` | number | Analysis duration | `42150` |
| `framework` | string (opt) | Framework context | `android`, `compose` |
| `similar_rca_ids` | string[] (opt) | Related RCAs | `['abc123...']` |
| `learning_notes` | object (opt) | Educational content | `{ whatIsThis: '...' }` |
| `tags` | string[] (opt) | User tags | `['beginner', 'common']` |

---

## Embedding Strategy

### Current Implementation (MVP)

**Mock TF-IDF Embeddings:**

For MVP (Phase 1), we use a simple TF-IDF approach to generate embeddings:

```typescript
// EmbeddingService.ts
export class EmbeddingService {
  // Mock implementation for MVP
  async embed(text: string): Promise<number[]> {
    // 1. Tokenize text
    const tokens = text.toLowerCase().match(/\w+/g) || [];
    
    // 2. Calculate term frequencies
    const termFreq = new Map<string, number>();
    tokens.forEach(token => {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    });
    
    // 3. Generate 384-dimensional vector
    const embedding = new Array(384).fill(0);
    
    // Hash tokens to dimensions
    termFreq.forEach((freq, term) => {
      const hash = this.hashString(term);
      const index = hash % 384;
      embedding[index] += freq / tokens.length;
    });
    
    // 4. Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

**Embedding Input:**
Combine error details for maximum similarity coverage:
```typescript
const textForEmbedding = `
  ${rca.error_message}
  ${rca.error_type}
  ${rca.root_cause}
  ${rca.file_path}
`.trim();

const embedding = await embedder.embed(textForEmbedding);
```

### Future Implementation (Phase 2+)

**Sentence Transformers (all-MiniLM-L6-v2):**

```typescript
// Future: Use TensorFlow.js + pre-trained model
import * as use from '@tensorflow-models/universal-sentence-encoder';

export class EmbeddingService {
  private model: use.UniversalSentenceEncoder;
  
  static async create(): Promise<EmbeddingService> {
    const instance = new EmbeddingService();
    instance.model = await use.load();
    return instance;
  }
  
  async embed(text: string): Promise<number[]> {
    const embeddings = await this.model.embed([text]);
    const embedding = await embeddings.array();
    return embedding[0]; // 512 dimensions
  }
}
```

**Benefits:**
- Better semantic understanding
- Handles synonyms and paraphrasing
- Industry-standard approach

---

## Quality Management

### Quality Score Calculation

```typescript
// QualityScorer.ts
export class QualityScorer {
  calculateQuality(rca: RCADocument): number {
    let score = 0;
    
    // 1. Base: Agent confidence (40% weight)
    score += rca.confidence * 0.4;
    
    // 2. User validation (30% weight)
    if (rca.user_validated) {
      score += 0.3;
    } else if (rca.validation_count < 0) {
      // Negative feedback
      score -= 0.2;
    }
    
    // 3. Completeness (20% weight)
    const completeness = this.checkCompleteness(rca);
    score += completeness * 0.2;
    
    // 4. Freshness (10% weight)
    const age = Date.now() - rca.created_at;
    const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
    
    if (age < sixMonths) {
      score += 0.1;
    } else {
      // Age penalty
      score *= 0.7;
    }
    
    return Math.max(0.0, Math.min(1.0, score));
  }
  
  private checkCompleteness(rca: RCADocument): number {
    let completeness = 0;
    
    // Has detailed root cause?
    if (rca.root_cause.length > 50) completeness += 0.33;
    
    // Has actionable fix guidelines?
    if (rca.fix_guidelines.length >= 2) completeness += 0.33;
    
    // Used tools to gather context?
    if (rca.tools_used.length > 0) completeness += 0.34;
    
    return completeness;
  }
}
```

### Quality Thresholds

| Quality Score | Classification | Action |
|---------------|----------------|--------|
| 0.8 - 1.0 | High Quality | Prioritize in search results |
| 0.5 - 0.8 | Medium Quality | Include in results |
| 0.3 - 0.5 | Low Quality | Include only if no better matches |
| 0.0 - 0.3 | Very Low | Prune after 6 months |

### Automatic Pruning

```typescript
// QualityManager.ts
export class QualityManager {
  async pruneOldLowQuality(): Promise<number> {
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    
    // Find old, low-quality RCAs
    const results = await this.chromaDB.query({
      where: {
        $and: [
          { quality_score: { $lt: 0.3 } },
          { created_at: { $lt: sixMonthsAgo } }
        ]
      },
      nResults: 1000
    });
    
    // Delete them
    const idsToDelete = results.ids[0];
    await this.chromaDB.delete({ ids: idsToDelete });
    
    return idsToDelete.length;
  }
}
```

---

## Caching Architecture

### Hash-Based Cache

```typescript
// RCACache.ts
export class RCACache {
  private cache = new Map<string, CacheEntry>();
  private TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  interface CacheEntry {
    rca: RCADocument;
    expires: number;
    hits: number;
  }
  
  get(hash: string): RCADocument | null {
    const entry = this.cache.get(hash);
    
    if (!entry) {
      return null; // Cache miss
    }
    
    // Check expiration
    if (Date.now() > entry.expires) {
      this.cache.delete(hash);
      return null;
    }
    
    // Hit tracking
    entry.hits++;
    
    return entry.rca;
  }
  
  set(hash: string, rca: RCADocument): void {
    this.cache.set(hash, {
      rca,
      expires: Date.now() + this.TTL,
      hits: 0
    });
  }
  
  invalidate(hash: string): void {
    this.cache.delete(hash);
  }
}
```

### Error Hashing

```typescript
// ErrorHasher.ts
export class ErrorHasher {
  hash(error: ParsedError): string {
    // Normalize error message
    const normalized = this.normalize(error.message);
    
    // Create unique key
    const key = `${error.type}:${normalized}:${error.filePath}:${error.line}`;
    
    // SHA-256 hash
    return crypto.createHash('sha256').update(key).digest('hex');
  }
  
  private normalize(message: string): string {
    return message
      .toLowerCase()
      .replace(/\s+/g, ' ')      // Collapse whitespace
      .replace(/\d+/g, 'N')      // Replace numbers with 'N'
      .replace(/['"`]/g, '')     // Remove quotes
      .trim();
  }
}
```

**Why Normalization?**
- Same error with different variable names → Same hash
- Same error at different timestamps → Same hash
- Focus on error pattern, not specifics

**Example:**
```
Original: "lateinit property user123 has not been initialized at 10:45:32"
Normalized: "lateinit property userN has not been initialized at N:N:N"
Hash: "a3f5c8b9..." (consistent)
```

---

## Query Patterns

### Pattern 1: Exact Match (Cache)

```typescript
// 1. Hash the error
const hash = errorHasher.hash(parsedError);

// 2. Check cache
const cached = rcaCache.get(hash);

if (cached) {
  return cached; // <1ms latency
}
```

### Pattern 2: Semantic Search (ChromaDB)

```typescript
// 1. Generate embedding
const errorText = `${error.message} ${error.type}`;
const embedding = await embedder.embed(errorText);

// 2. Query ChromaDB
const results = await chromaDB.query({
  queryEmbeddings: [embedding],
  nResults: 5,
  where: {
    language: error.language,
    quality_score: { $gte: 0.5 } // Filter low quality
  }
});

// 3. Return best match
if (results.distances[0][0] < 0.3) { // Cosine distance threshold
  return JSON.parse(results.documents[0][0]);
}
```

### Pattern 3: Filtered Search

```typescript
// Search for Kotlin lateinit errors only
const results = await chromaDB.query({
  queryEmbeddings: [embedding],
  nResults: 10,
  where: {
    $and: [
      { language: 'kotlin' },
      { error_type: 'lateinit' },
      { quality_score: { $gte: 0.7 } }
    ]
  }
});
```

### Pattern 4: Bulk Storage

```typescript
// Store multiple RCAs efficiently
const batch: RCADocument[] = [...];

await chromaDB.collection.add({
  ids: batch.map(rca => rca.id),
  embeddings: await embedder.embedBatch(batch.map(rca => rca.error_message)),
  documents: batch.map(rca => JSON.stringify(rca)),
  metadatas: batch.map(rca => ({
    language: rca.language,
    error_type: rca.error_type,
    quality_score: rca.quality_score
  }))
});
```

---

## Performance Characteristics

### Latency Benchmarks

| Operation | Latency (p50) | Latency (p90) | Notes |
|-----------|---------------|---------------|-------|
| Cache hit | 0.1ms | 0.3ms | In-memory lookup |
| Cache miss + DB search | 25ms | 50ms | Includes embedding generation |
| Store in DB | 30ms | 60ms | Includes embedding + write |
| Store in cache | 0.2ms | 0.5ms | In-memory write |
| Prune old entries | 200ms | 500ms | Batch delete (100 entries) |
| Quality score calculation | 0.05ms | 0.1ms | Pure computation |

### Scalability

**Memory Usage (RCACache):**
```
Baseline: 50MB (agent runtime)
1K cached RCAs: 55MB (+5MB)
10K cached RCAs: 100MB (+50MB)
50K cached RCAs: 300MB (+250MB)
```

**Disk Usage (ChromaDB):**
```
Per RCA:
- JSON document: ~1.5KB
- Embedding (384 floats): ~1.5KB
- Metadata: ~0.5KB
- Total: ~3.5KB per RCA

Estimates:
- 1K RCAs: 3.5MB
- 10K RCAs: 35MB
- 100K RCAs: 350MB
- 1M RCAs: 3.5GB
```

### Cache Hit Rate

**Expected Hit Rates:**
- Development (repeat errors): 60-80%
- Testing (known errors): 70-90%
- Production (diverse errors): 20-40%

**Factors:**
- Error diversity in codebase
- Cache TTL (24 hours default)
- Invalidation on negative feedback

---

## Maintenance and Pruning

### Automatic Cleanup

```typescript
// Run daily cleanup job
setInterval(async () => {
  // 1. Prune expired cache entries
  const expiredCount = rcaCache.cleanup();
  
  // 2. Prune low-quality DB entries
  const prunedCount = await qualityManager.pruneOldLowQuality();
  
  // 3. Log metrics
  logger.info('Database maintenance complete', {
    expiredCacheEntries: expiredCount,
    prunedDBEntries: prunedCount
  });
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

### Manual Export/Import

```typescript
// Export all RCAs for backup
async exportRCAs(filePath: string): Promise<void> {
  const allRCAs = await this.chromaDB.getAll();
  await fs.promises.writeFile(
    filePath,
    JSON.stringify(allRCAs, null, 2),
    'utf-8'
  );
}

// Import RCAs from backup
async importRCAs(filePath: string): Promise<number> {
  const data = await fs.promises.readFile(filePath, 'utf-8');
  const rcas: RCADocument[] = JSON.parse(data);
  
  await this.chromaDB.addBatch(rcas);
  
  return rcas.length;
}
```

### Database Reset

```typescript
// Clear all data (use with caution!)
async resetDatabase(): Promise<void> {
  // 1. Clear cache
  this.rcaCache.clear();
  
  // 2. Delete ChromaDB collection
  await this.chromaDB.deleteCollection('rca_solutions');
  
  // 3. Recreate collection
  await this.chromaDB.createCollection('rca_solutions');
  
  logger.warn('Database reset complete - all RCAs deleted');
}
```

---

## Migration Strategy

### Schema Versioning

```typescript
// Add version field to documents
interface RCADocument {
  schema_version: string; // '1.0.0'
  // ... other fields
}

// Handle schema migrations
class SchemaM igrator {
  migrate(rca: any): RCADocument {
    const version = rca.schema_version || '1.0.0';
    
    if (version === '1.0.0') {
      // No migration needed
      return rca as RCADocument;
    }
    
    // Add migration paths as schema evolves
    throw new Error(`Unsupported schema version: ${version}`);
  }
}
```

---

## Related Documentation

- [System Architecture Overview](./overview.md)
- [Database API Reference](../api/Database.md)
- [Performance Benchmarks](../performance/benchmarks.md)
- [Agent Workflow](./agent-workflow.md)
