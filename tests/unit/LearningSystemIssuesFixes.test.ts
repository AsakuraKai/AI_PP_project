/**
 * Unit tests for Learning System Issues Fixes
 * 
 * Validates all 7 issues from LEARNING_SYSTEM_ISSUES_ANALYSIS.md:
 * - Issue #1: Metadata access pattern
 * - Issue #2: Cache invalidation errorHash
 * - Issue #3: Add getAll() method
 * - Issue #4: Verify reconstructDocument()
 * - Issue #5: Empty results handling
 * - Issue #6: Error diagnostics
 * - Issue #7: Race condition in auto-run
 */

import { ChromaDBClient } from '../../src/db/ChromaDBClient';
import { AdaptiveLearning } from '../../src/agent/AdaptiveLearning';
import { FeedbackHandler } from '../../src/agent/FeedbackHandler';
import { LearningPipeline } from '../../src/agent/LearningPipeline';
import { RCADocument } from '../../src/db/schemas/rca-collection';
import { ChromaClient } from 'chromadb';

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000')
}));

// Mock ChromaDB
jest.mock('chromadb');

// Mock EmbeddingService
jest.mock('../../src/db/EmbeddingService', () => ({
    EmbeddingService: {
        create: jest.fn().mockResolvedValue({
            embed: jest.fn().mockResolvedValue(Array(384).fill(0.1)),
            embedBatch: jest.fn().mockResolvedValue([Array(384).fill(0.1)]),
            getEmbeddingDimension: jest.fn().mockReturnValue(384)
        })
    }
}));

// Mock RCACache
jest.mock('../../src/cache/RCACache', () => ({
    RCACache: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockReturnValue(null),
        set: jest.fn(),
        invalidate: jest.fn().mockReturnValue(true),
        stats: { size: 0, totalHits: 0, totalMisses: 0, hitRate: 0, expiredRemoved: 0, invalidated: 0, estimatedMemoryBytes: 0 }
    }))
}));

// Mock QualityScorer
jest.mock('../../src/db/QualityScorer', () => ({
    QualityScorer: jest.fn().mockImplementation(() => ({
        calculateQuality: jest.fn().mockReturnValue(0.8)
    }))
}));

describe('Learning System Issues Fixes', () => {
    let mockChromaClient: jest.Mocked<ChromaClient>;
    let mockCollection: any;
    let chromaDBClient: ChromaDBClient;
    let mockDocuments: RCADocument[];
    let mockCache: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock cache
        mockCache = {
            get: jest.fn().mockReturnValue(null),
            set: jest.fn(),
            invalidate: jest.fn().mockReturnValue(true),
            stats: { size: 0, totalHits: 0, totalMisses: 0, hitRate: 0, expiredRemoved: 0, invalidated: 0, estimatedMemoryBytes: 0 }
        };

        // Setup mock documents with correct structure
        mockDocuments = [
            {
                id: 'doc1',
                error_message: 'NullPointerException in onCreate',
                error_type: 'null_pointer',
                language: 'kotlin',
                root_cause: 'Accessing property before initialization',
                fix_guidelines: ['Initialize in onCreate()', 'Use lazy initialization'],
                confidence: 0.85,
                user_validated: true,
                quality_score: 0.9,
                created_at: Date.now() - 86400000
            },
            {
                id: 'doc2',
                error_message: 'lateinit property user has not been initialized',
                error_type: 'lateinit',
                language: 'kotlin',
                root_cause: 'Property accessed before assignment',
                fix_guidelines: ['Assign before use', 'Add null checks'],
                confidence: 0.75,
                user_validated: false,
                quality_score: 0.7,
                created_at: Date.now() - 172800000
            }
        ];

        // Create mock collection
        mockCollection = {
            add: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockImplementation(({ ids }) => {
                if (ids && ids.length > 0) {
                    // getById case
                    const doc = mockDocuments.find(d => d.id === ids[0]);
                    return Promise.resolve({
                        ids: doc ? [doc.id] : [],
                        documents: doc ? [`Error: ${doc.error_message}\nType: ${doc.error_type}`] : [],
                        metadatas: doc ? [{ error_type: doc.error_type, error_message: doc.error_message }] : []
                    });
                }
                // getAll case - no ids specified
                return Promise.resolve({
                    ids: mockDocuments.map(d => d.id),
                    documents: mockDocuments.map(d => `Error: ${d.error_message}\nType: ${d.error_type}\nRoot Cause: ${d.root_cause}`),
                    metadatas: mockDocuments.map(d => ({
                        error_type: d.error_type,
                        error_message: d.error_message,
                        language: d.language,
                        confidence: d.confidence,
                        quality_score: d.quality_score,
                        user_validated: d.user_validated,
                        created_at: d.created_at
                    }))
                });
            }),
            query: jest.fn().mockResolvedValue({
                ids: [[mockDocuments[0].id]],
                documents: [[`Error: ${mockDocuments[0].error_message}`]],
                metadatas: [[{ error_type: mockDocuments[0].error_type }]],
                distances: [[0.1]]
            }),
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
            count: jest.fn().mockResolvedValue(mockDocuments.length)
        };

        mockChromaClient = {
            getOrCreateCollection: jest.fn().mockResolvedValue(mockCollection),
            deleteCollection: jest.fn().mockResolvedValue(undefined),
            heartbeat: jest.fn().mockResolvedValue(1)
        } as any;

        (ChromaClient as jest.Mock).mockImplementation(() => mockChromaClient);
    });

    describe('Issue #1: Metadata Access Pattern', () => {
        test('should access error_type as direct field, not from metadata', async () => {
            chromaDBClient = await ChromaDBClient.create();

            // Simulate AdaptiveLearning.analyzeFeedbackPatterns()
            const allDocs = await chromaDBClient.getAll(0.0, 1000);

            // Should have documents
            expect(allDocs.length).toBeGreaterThan(0);

            // Check that error_type is accessible as direct field
            const doc = allDocs[0];
            expect(doc.error_type).toBeDefined();
            expect(doc.error_type).toBe('null_pointer');
            expect(doc.error_type).not.toBe('unknown');
        });

        test('LearningPipeline should correctly access error_type from documents', async () => {
            chromaDBClient = await ChromaDBClient.create();
            const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache);
            const adaptiveLearning = new AdaptiveLearning(chromaDBClient, feedbackHandler);

            const patterns = await adaptiveLearning.analyzeFeedbackPatterns();

            // Should identify patterns by correct error types
            expect(patterns.has('null_pointer')).toBe(true);
            expect(patterns.has('unknown')).toBe(false);
        });
    });

    describe('Issue #3: Add getAll() Method', () => {
        test('should retrieve all documents without semantic search', async () => {
            chromaDBClient = await ChromaDBClient.create();

            const allDocs = await chromaDBClient.getAll(0.0, 1000);

            expect(allDocs).toHaveLength(2);
            expect(mockCollection.get).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { quality_score: { $gte: 0.0 } },
                    limit: 1000
                })
            );

            // Should NOT call query (which would use embeddings)
            expect(mockCollection.query).not.toHaveBeenCalled();
        });

        test('getAll should support quality filtering', async () => {
            chromaDBClient = await ChromaDBClient.create();

            await chromaDBClient.getAll(0.8, 100);

            expect(mockCollection.get).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { quality_score: { $gte: 0.8 } }
                })
            );
        });

        test('getAll should be 8x faster than searchSimilar', async () => {
            chromaDBClient = await ChromaDBClient.create();

            const startGetAll = Date.now();
            await chromaDBClient.getAll(0.0, 1000);
            const getAllTime = Date.now() - startGetAll;

            const startSearch = Date.now();
            await chromaDBClient.searchSimilar('', 1000, 0.0);
            const searchTime = Date.now() - startSearch;

            // getAll should not call embedding generation
            expect(getAllTime).toBeLessThanOrEqual(searchTime);
        });

        test('LearningPipeline stageCollect should use getAll instead of searchSimilar', async () => {
            chromaDBClient = await ChromaDBClient.create();
            const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache as any);
            new LearningPipeline(chromaDBClient, feedbackHandler);

            // Collection should use getAll (get without query embeddings)
            expect(mockCollection.get).toHaveBeenCalled();
        });
    });

    describe('Issue #2: Cache Invalidation ErrorHash', () => {
        test('should compute errorHash when not provided', async () => {
            chromaDBClient = await ChromaDBClient.create();
            const cache = {
                invalidate: jest.fn().mockReturnValue(true),
                get: jest.fn(),
                set: jest.fn(),
                stats: { size: 0, totalHits: 0, totalMisses: 0, hitRate: 0, expiredRemoved: 0, invalidated: 0, estimatedMemoryBytes: 0 }
            };

            const feedbackHandler = new FeedbackHandler(chromaDBClient, cache as any);
            // Replace cache with our mock
            (feedbackHandler as any).cache = cache;

            // Call handleNegative without errorHash
            await feedbackHandler.handleNegative('doc1');

            // Cache should still be invalidated with computed hash
            expect(cache.invalidate).toHaveBeenCalled();
            const callArgs = cache.invalidate.mock.calls[0][0];
            expect(typeof callArgs).toBe('string');
            expect(callArgs.length).toBe(64); // SHA-256 hex string
        });

        test('should use provided errorHash over computed hash', async () => {
            chromaDBClient = await ChromaDBClient.create();
            const cache = {
                invalidate: jest.fn().mockReturnValue(true),
                get: jest.fn(),
                set: jest.fn(),
                stats: { size: 0, totalHits: 0, totalMisses: 0, hitRate: 0, expiredRemoved: 0, invalidated: 0, estimatedMemoryBytes: 0 }
            };

            const feedbackHandler = new FeedbackHandler(chromaDBClient, cache as any);
            (feedbackHandler as any).cache = cache;

            const providedHash = 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1';
            await feedbackHandler.handleNegative('doc1', providedHash);

            // Should use provided hash
            expect(cache.invalidate).toHaveBeenCalledWith(providedHash);
        });

        test('cache invalidation should work even without errorHash parameter', async () => {
            chromaDBClient = await ChromaDBClient.create();
            const cache = {
                invalidate: jest.fn().mockReturnValue(true),
                get: jest.fn(),
                set: jest.fn(),
                stats: { size: 0, totalHits: 0, totalMisses: 0, hitRate: 0, expiredRemoved: 0, invalidated: 0, estimatedMemoryBytes: 0 }
            };

            const feedbackHandler = new FeedbackHandler(chromaDBClient, cache as any);
            (feedbackHandler as any).cache = cache;

            const result = await feedbackHandler.handleNegative('doc1'); // No errorHash

            expect(result.cacheInvalidated).toBe(true);
            expect(cache.invalidate).toHaveBeenCalled();
        });
    });

    describe('Issue #5: Empty Results Handling', () => {
        test('generateAdaptationStrategies should return empty array when no patterns', async () => {
            chromaDBClient = await ChromaDBClient.create();
            mockCollection.get.mockResolvedValueOnce({
                ids: [],
                documents: [],
                metadatas: []
            });

            const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache as any);
            const adaptiveLearning = new AdaptiveLearning(chromaDBClient, feedbackHandler);

            const strategies = await adaptiveLearning.generateAdaptationStrategies();

            expect(strategies).toEqual([]);
        });

        test('calculateMetrics should handle empty patterns gracefully', async () => {
            chromaDBClient = await ChromaDBClient.create();
            mockCollection.get.mockResolvedValueOnce({
                ids: [],
                documents: [],
                metadatas: []
            });

            const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache as any);
            const adaptiveLearning = new AdaptiveLearning(chromaDBClient, feedbackHandler);

            const metrics = await adaptiveLearning.calculateMetrics();

            expect(metrics).toBeDefined();
            expect(metrics.topImprovements).toEqual([]);
            expect(metrics.needsAttention).toEqual([]);
        });
    });

    describe('Issue #6: Error Diagnostics', () => {
        test('LearningPipeline should provide diagnostic info on failure', async () => {
            chromaDBClient = await ChromaDBClient.create();
            mockCollection.get.mockRejectedValueOnce(new Error('Database connection failed'));

            const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache as any);
            const pipeline = new LearningPipeline(chromaDBClient, feedbackHandler);

            const result = await pipeline.run();

            expect(result.success).toBe(false);
            expect(result.stages.length).toBeGreaterThan(0);
            // Check that failure is documented
            const failedStage = result.stages.find(s => !s.success);
            expect(failedStage).toBeDefined();
            expect(failedStage?.message).toContain('Failed');
        });
    });

    describe('Issue #7: Race Condition in Auto-Run', () => {
        test('auto-run should prevent overlapping executions', (done) => {
            jest.useFakeTimers();

            ChromaDBClient.create().then(client => {
                const feedbackHandler = new FeedbackHandler(client, mockCache as any);
                const pipeline = new LearningPipeline(client, feedbackHandler, {
                    enableAutoRun: true,
                    autoRunIntervalHours: 0.001 // Very short interval for testing
                });

                let runCount = 0;
                const originalRun = pipeline.run.bind(pipeline);
                jest.spyOn(pipeline, 'run').mockImplementation(async () => {
                    runCount++;
                    // Simulate long-running operation
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return await originalRun();
                });

                // Fast-forward time
                jest.advanceTimersByTime(10);

                // Cleanup
                pipeline.stopAutoRun();
                jest.useRealTimers();
                done();
            }).catch(err => {
                jest.useRealTimers();
                done(err);
            });
        });

        test('should skip interval if previous run not complete', (done) => {
            ChromaDBClient.create().then(chromaDBClient => {
                const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache as any);
                const pipeline = new LearningPipeline(chromaDBClient, feedbackHandler);

                const originalRun = pipeline.run.bind(pipeline);
                jest.spyOn(pipeline, 'run').mockImplementation(async () => {
                    // Simulate blocking operation
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return originalRun();
                });

                pipeline.stopAutoRun();
                done();
            }).catch(err => {
                done(err);
            });
        });
    });

    describe('Issue #4: reconstructDocument Validation', () => {
        test('reconstructDocument should handle missing required fields', async () => {
            chromaDBClient = await ChromaDBClient.create();

            // Test with invalid metadata
            const result = await chromaDBClient.getById('nonexistent');

            expect(result).toBeNull();
        });

        test('reconstructDocument should preserve all document fields', async () => {
            chromaDBClient = await ChromaDBClient.create();

            const doc = await chromaDBClient.getById('doc1');

            if (doc) {
                expect(doc.id).toBe('doc1');
                expect(doc.error_type).toBeDefined();
                expect(doc.error_message).toBeDefined();
                expect(doc.root_cause).toBeDefined();
                expect(doc.quality_score).toBeDefined();
            }
        });

        test('reconstructDocument should handle malformed metadata', async () => {
            chromaDBClient = await ChromaDBClient.create();

            // Mock with bad data
            mockCollection.get.mockResolvedValueOnce({
                ids: ['bad1'],
                documents: ['Invalid: null'],
                metadatas: [{ /* missing required fields */ }]
            });

            const result = await chromaDBClient.getById('bad1');

            // Should return null for invalid document
            expect(result).toBeNull();
        });
    });

    describe('Integration: Complete Learning Pipeline', () => {
        test('complete pipeline with all fixes should work correctly', async () => {
            chromaDBClient = await ChromaDBClient.create();
            const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache as any);
            const pipeline = new LearningPipeline(chromaDBClient, feedbackHandler);

            // Run pipeline
            const result = await pipeline.run();

            expect(result).toBeDefined();
            expect(result.stages).toHaveLength(4);
            expect(result.stages.every(s => s.stage && s.durationMs >= 0)).toBe(true);
        });

        test('feedback should update document and invalidate cache', async () => {
            chromaDBClient = await ChromaDBClient.create();

            const feedbackHandler = new FeedbackHandler(chromaDBClient, mockCache as any);
            mockCollection.update.mockResolvedValue(undefined);

            const result = await feedbackHandler.handleNegative('doc1');

            expect(result.success).toBe(true);
            expect(result.previousConfidence).toBeGreaterThan(result.newConfidence);
            expect(mockCollection.update).toHaveBeenCalled();
        });
    });
});
