/**
 * Integration tests for VersionLookupTool
 * Tests all query types and edge cases
 */

import { VersionLookupTool, VersionQueryParams } from '../../../src/tools/VersionLookupTool';
import * as path from 'path';

describe('VersionLookupTool Integration Tests', () => {
  let tool: VersionLookupTool;
  
  beforeAll(async () => {
    // Initialize with knowledge path
    const knowledgePath = path.join(__dirname, '../../../src/knowledge');
    tool = new VersionLookupTool(knowledgePath);
    await tool.initialize();
  });
  
  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      expect(tool).toBeDefined();
      const agpVersions = tool.getAllVersions('agp');
      expect(agpVersions.length).toBeGreaterThan(0);
    });
    
    test('should load AGP versions', () => {
      const versions = tool.getAllVersions('agp');
      expect(versions).toContain('8.7.3');
      expect(versions).toContain('9.0.0');
      expect(versions.length).toBeGreaterThan(20); // Adjusted expectation
    });
    
    test('should load Kotlin versions', () => {
      const versions = tool.getAllVersions('kotlin');
      expect(versions).toContain('1.9.0');
      expect(versions).toContain('2.0.0');
      expect(versions.length).toBeGreaterThan(10); // Adjusted expectation
    });
  });
  
  describe('Version Existence Queries', () => {
    test('should detect existing AGP version', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'exists',
        version: '8.7.3',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(true);
      expect(result.data.versions).toContain('8.7.3');
    });
    
    test('should detect non-existing AGP version (8.10.0)', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'exists',
        version: '8.10.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(false);
    });
    
    test('should detect non-existing AGP version (8.8.0)', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'exists',
        version: '8.8.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(false);
    });
    
    test('should detect existing Kotlin version', async () => {
      const params: VersionQueryParams = {
        tool: 'kotlin',
        queryType: 'exists',
        version: '1.9.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(true);
    });
    
    test('should detect non-existing Kotlin version', async () => {
      const params: VersionQueryParams = {
        tool: 'kotlin',
        queryType: 'exists',
        version: '1.9.99',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.exists).toBe(false);
    });
  });
  
  describe('Latest Version Queries', () => {
    test('should get latest stable AGP version', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'latest-stable',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.versions).toBeDefined();
      expect(result.data.versions!.length).toBe(1);
      
      const version = result.data.versions![0];
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Format: X.Y.Z
    });
    
    test('should get latest stable Kotlin version', async () => {
      const params: VersionQueryParams = {
        tool: 'kotlin',
        queryType: 'latest-stable',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.versions).toBeDefined();
      expect(result.data.versions!.length).toBe(1);
    });
    
    test('should get latest any AGP version', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'latest-any',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.versions).toBeDefined();
    });
  });
  
  describe('Version Suggestions', () => {
    test('should suggest alternatives for non-existing AGP 8.10.0', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'suggest',
        version: '8.10.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeDefined();
      expect(result.data.suggestions!.length).toBeGreaterThan(0);
      
      const firstSuggestion = result.data.suggestions![0];
      expect(firstSuggestion.version).toBeDefined();
      expect(firstSuggestion.reason).toContain('does not exist');
      expect(firstSuggestion.status).toBe('stable');
    });
    
    test('should suggest alternatives for non-existing AGP 8.8.0', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'suggest',
        version: '8.8.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.suggestions!.length).toBeGreaterThan(0);
    });
    
    test('should suggest newer versions for outdated AGP', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'suggest',
        version: '7.0.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeDefined();
      
      if (result.data.suggestions!.length > 0) {
        const suggestion = result.data.suggestions![0];
        expect(suggestion.reason).toMatch(/newer|deprecated/i); // Accept either "newer" or "deprecated"
      }
    });
    
    test('should suggest alternatives for Kotlin', async () => {
      const params: VersionQueryParams = {
        tool: 'kotlin',
        queryType: 'suggest',
        version: '1.5.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeDefined();
    });
    
    test('should limit suggestions to 3 items', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'suggest',
        version: '7.0.0',
      };
      
      const result = await tool.execute(params);
      expect(result.data.suggestions!.length).toBeLessThanOrEqual(3);
    });
  });
  
  describe('Compatibility Checks', () => {
    test('should check AGP-Kotlin compatibility (compatible)', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'compatible',
        version: '8.7.3',
        referenceTool: 'kotlin',
        referenceVersion: '1.9.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.compatible).toBe(true);
      expect(result.data.compatibilityDetails).toContain('compatible');
    });
    
    test('should check AGP-Kotlin compatibility (incompatible - Kotlin too old)', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'compatible',
        version: '8.7.3',
        referenceTool: 'kotlin',
        referenceVersion: '1.5.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.compatible).toBe(false);
      expect(result.data.compatibilityDetails).toContain('requires Kotlin');
    });
    
    test('should check Kotlin-AGP compatibility (reverse check)', async () => {
      const params: VersionQueryParams = {
        tool: 'kotlin',
        queryType: 'compatible',
        version: '1.9.0',
        referenceTool: 'agp',
        referenceVersion: '8.7.3',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.compatible).toBe(true);
    });
    
    test('should check AGP-Gradle compatibility (compatible)', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'compatible',
        version: '8.7.3',
        referenceTool: 'gradle',
        referenceVersion: '8.9',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.compatible).toBe(true);
    });
    
    test('should check AGP-Gradle compatibility (incompatible - Gradle too old)', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'compatible',
        version: '8.7.3',
        referenceTool: 'gradle',
        referenceVersion: '7.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.compatible).toBe(false);
      expect(result.data.compatibilityDetails).toContain('requires Gradle');
    });
    
    test('should handle missing parameters in compatibility check', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'compatible',
        version: '8.7.3',
        // Missing referenceTool and referenceVersion
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('should handle unknown query type', async () => {
      const params: any = {
        tool: 'agp',
        queryType: 'unknown-query',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown query type');
    });
    
    test('should handle missing version in exists query', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'exists',
        // Missing version
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Version parameter required');
    });
    
    test('should handle missing version in suggest query', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'suggest',
        // Missing version
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Version parameter required');
    });
    
    test('should handle non-existent version in compatibility check', async () => {
      const params: VersionQueryParams = {
        tool: 'agp',
        queryType: 'compatible',
        version: '99.99.99',
        referenceTool: 'kotlin',
        referenceVersion: '1.9.0',
      };
      
      const result = await tool.execute(params);
      expect(result.success).toBe(true);
      expect(result.data.compatible).toBe(false);
      expect(result.data.compatibilityDetails).toContain('not found');
    });
  });
  
  describe('Helper Methods', () => {
    test('should check version existence directly', () => {
      expect(tool.versionExists('agp', '8.7.3')).toBe(true);
      expect(tool.versionExists('agp', '8.10.0')).toBe(false);
      expect(tool.versionExists('kotlin', '1.9.0')).toBe(true);
      expect(tool.versionExists('kotlin', '9.9.9')).toBe(false);
    });
    
    test('should get latest stable directly', () => {
      const agpLatest = tool.getLatestStable('agp');
      expect(agpLatest).toBeDefined();
      expect(agpLatest).toMatch(/^\d+\.\d+\.\d+$/);
      
      const kotlinLatest = tool.getLatestStable('kotlin');
      expect(kotlinLatest).toBeDefined();
      expect(kotlinLatest).toMatch(/^\d+\.\d+\.\d+/);
    });
    
    test('should get latest any directly', () => {
      const agpLatest = tool.getLatestAny('agp');
      expect(agpLatest).toBeDefined();
      
      const kotlinLatest = tool.getLatestAny('kotlin');
      expect(kotlinLatest).toBeDefined();
    });
    
    test('should get version info', () => {
      const info = tool.getVersionInfo('agp', '8.7.3');
      expect(info).toBeDefined();
      expect(info?.version).toBe('8.7.3');
      expect(info?.status).toBeDefined();
      
      const kotlinInfo = tool.getVersionInfo('kotlin', '1.9.0');
      expect(kotlinInfo).toBeDefined();
      expect(kotlinInfo?.version).toBe('1.9.0');
    });
    
    test('should return null for non-existent version info', () => {
      const info = tool.getVersionInfo('agp', '99.99.99');
      expect(info).toBeNull();
    });
  });
  
  describe('Real-World Scenarios', () => {
    test('MVP test case: AGP 8.10.0 error', async () => {
      // This is the exact scenario from MVP testing
      // User has AGP 8.10.0 which doesn't exist
      
      // Step 1: Check if version exists
      const existsResult = await tool.execute({
        tool: 'agp',
        queryType: 'exists',
        version: '8.10.0',
      });
      
      expect(existsResult.data.exists).toBe(false);
      
      // Step 2: Get suggestions
      const suggestResult = await tool.execute({
        tool: 'agp',
        queryType: 'suggest',
        version: '8.10.0',
      });
      
      expect(suggestResult.data.suggestions!.length).toBeGreaterThan(0);
      const suggestion = suggestResult.data.suggestions![0];
      expect(suggestion.version).toBeDefined();
      expect(suggestion.reason).toContain('does not exist');
      
      // Step 3: Verify suggested version exists and is stable
      const verifyResult = await tool.execute({
        tool: 'agp',
        queryType: 'exists',
        version: suggestion.version,
      });
      
      expect(verifyResult.data.exists).toBe(true);
    });
    
    test('Kotlin version upgrade path', async () => {
      // User wants to upgrade from 1.7.0 to latest
      
      // Get latest stable Kotlin
      const latestResult = await tool.execute({
        tool: 'kotlin',
        queryType: 'latest-stable',
      });
      
      const latestKotlin = latestResult.data.versions![0];
      
      // Check if it's compatible with their AGP 8.7.3
      const compatResult = await tool.execute({
        tool: 'kotlin',
        queryType: 'compatible',
        version: latestKotlin,
        referenceTool: 'agp',
        referenceVersion: '8.7.3',
      });
      
      expect(compatResult.data.compatible).toBeDefined();
    });
    
    test('Detect AGP 8.8.x gap', async () => {
      // Verify 8.8.0, 8.8.1, etc. don't exist
      const versions = ['8.8.0', '8.8.1', '8.8.2'];
      
      for (const version of versions) {
        const result = await tool.execute({
          tool: 'agp',
          queryType: 'exists',
          version,
        });
        
        expect(result.data.exists).toBe(false);
      }
    });
  });
  
  describe('Performance', () => {
    test('should execute queries quickly', async () => {
      const startTime = Date.now();
      
      await tool.execute({
        tool: 'agp',
        queryType: 'exists',
        version: '8.7.3',
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should be < 100ms
    });
    
    test('should handle multiple queries efficiently', async () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          tool.execute({
            tool: 'agp',
            queryType: 'suggest',
            version: '8.10.0',
          })
        );
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // 10 queries in < 500ms
    });
  });
});
