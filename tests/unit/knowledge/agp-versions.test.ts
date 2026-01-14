import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('AGP Version Database', () => {
  const agpVersionsPath = path.join(__dirname, '../../../src/knowledge/agp-versions.json');
  const agpSchemaPath = path.join(__dirname, '../../../src/knowledge/agp-versions.schema.json');
  
  let agpData: any;
  let agpSchema: any;
  
  beforeAll(() => {
    agpData = JSON.parse(fs.readFileSync(agpVersionsPath, 'utf-8'));
    agpSchema = JSON.parse(fs.readFileSync(agpSchemaPath, 'utf-8'));
  });

  it('should have valid JSON structure', () => {
    expect(agpData).toBeDefined();
    expect(agpData.metadata).toBeDefined();
    expect(agpData.versions).toBeDefined();
    expect(Array.isArray(agpData.versions)).toBe(true);
  });

  it('should conform to schema', () => {
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = ajv.compile(agpSchema);
    const valid = validate(agpData);
    
    if (!valid) {
      console.error('Schema validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
  });

  it('should have at least 40 versions (7.x, 8.x, 9.x)', () => {
    expect(agpData.versions.length).toBeGreaterThanOrEqual(40);
  });

  it('should have versions in reverse chronological order (newest first)', () => {
    for (let i = 0; i < agpData.versions.length - 1; i++) {
      const currentDate = new Date(agpData.versions[i].releaseDate);
      const nextDate = new Date(agpData.versions[i + 1].releaseDate);
      expect(currentDate >= nextDate).toBe(true);
    }
  });

  it('should have unique version numbers', () => {
    const versions = agpData.versions.map((v: any) => v.version);
    const uniqueVersions = new Set(versions);
    expect(versions.length).toBe(uniqueVersions.size);
  });

  it('should have valid version format', () => {
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
    agpData.versions.forEach((v: any) => {
      expect(v.version).toMatch(versionRegex);
    });
  });

  it('should mark 7.x versions as deprecated', () => {
    const version7x = agpData.versions.filter((v: any) => v.version.startsWith('7.'));
    version7x.forEach((v: any) => {
      expect(v.deprecated).toBe(true);
      expect(v.status).toBe('deprecated');
    });
  });

  it('should NOT mark 8.x and 9.x versions as deprecated', () => {
    const version8x9x = agpData.versions.filter((v: any) => 
      v.version.startsWith('8.') || v.version.startsWith('9.')
    );
    version8x9x.forEach((v: any) => {
      expect(v.deprecated).toBe(false);
    });
  });

  it('should require JDK 17+ for AGP 8.x and 9.x', () => {
    const version8x9x = agpData.versions.filter((v: any) => 
      v.version.startsWith('8.') || v.version.startsWith('9.')
    );
    version8x9x.forEach((v: any) => {
      expect(v.minJdk).toBeGreaterThanOrEqual(17);
    });
  });

  it('should require JDK 11 for AGP 7.x', () => {
    const version7x = agpData.versions.filter((v: any) => v.version.startsWith('7.'));
    version7x.forEach((v: any) => {
      expect(v.minJdk).toBe(11);
    });
  });

  it('should have Gradle version compatibility', () => {
    agpData.versions.forEach((v: any) => {
      expect(v.minGradleVersion).toBeDefined();
      expect(v.minGradleVersion).toBeTruthy();
    });
  });

  it('should have Kotlin version compatibility', () => {
    agpData.versions.forEach((v: any) => {
      expect(v.minKotlinVersion).toBeDefined();
      expect(v.minKotlinVersion).toBeTruthy();
    });
  });

  it('should have migration guides for major versions', () => {
    const majorVersions = agpData.versions.filter((v: any) => 
      v.version.endsWith('.0') && !v.version.includes('-')
    );
    majorVersions.forEach((v: any) => {
      expect(v.migrationGuide).toBeDefined();
      expect(v.migrationGuide).toContain('https://');
    });
  });

  it('should NOT have version 8.10.0 (non-existent)', () => {
    const version8_10 = agpData.versions.find((v: any) => v.version === '8.10.0');
    expect(version8_10).toBeUndefined();
  });

  it('should NOT have version 8.8.x series (skipped)', () => {
    const version8_8 = agpData.versions.filter((v: any) => v.version.startsWith('8.8.'));
    expect(version8_8.length).toBe(0);
  });

  it('should have AGP 9.0.0 as latest stable', () => {
    const version9 = agpData.versions.find((v: any) => v.version === '9.0.0');
    expect(version9).toBeDefined();
    expect(version9.status).toBe('stable');
  });

  it('should have breaking changes documented for major versions', () => {
    const version8_0 = agpData.versions.find((v: any) => v.version === '8.0.0');
    const version9_0 = agpData.versions.find((v: any) => v.version === '9.0.0');
    
    expect(version8_0.breakingChanges).toBeDefined();
    expect(version8_0.breakingChanges.length).toBeGreaterThan(0);
    
    expect(version9_0.breakingChanges).toBeDefined();
    expect(version9_0.breakingChanges.length).toBeGreaterThan(0);
  });

  it('should have consistent metadata', () => {
    expect(agpData.metadata.totalVersions).toBe(agpData.versions.length);
    expect(agpData.metadata.lastUpdated).toBeDefined();
    expect(agpData.metadata.source).toBeDefined();
  });
});
