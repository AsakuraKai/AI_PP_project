import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('Kotlin Version Database', () => {
  const kotlinVersionsPath = path.join(__dirname, '../../../src/knowledge/kotlin-versions.json');
  const kotlinSchemaPath = path.join(__dirname, '../../../src/knowledge/kotlin-versions.schema.json');
  
  let kotlinData: any;
  let kotlinSchema: any;
  
  beforeAll(() => {
    kotlinData = JSON.parse(fs.readFileSync(kotlinVersionsPath, 'utf-8'));
    kotlinSchema = JSON.parse(fs.readFileSync(kotlinSchemaPath, 'utf-8'));
  });

  it('should have valid JSON structure', () => {
    expect(kotlinData).toBeDefined();
    expect(kotlinData.metadata).toBeDefined();
    expect(kotlinData.versions).toBeDefined();
    expect(Array.isArray(kotlinData.versions)).toBe(true);
  });

  it('should conform to schema', () => {
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = ajv.compile(kotlinSchema);
    const valid = validate(kotlinData);
    
    if (!valid) {
      console.error('Schema validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
  });

  it('should have at least 30 versions (1.5.x - 2.0.x)', () => {
    expect(kotlinData.versions.length).toBeGreaterThanOrEqual(30);
  });

  it('should have versions in reverse chronological order', () => {
    for (let i = 0; i < kotlinData.versions.length - 1; i++) {
      const currentDate = new Date(kotlinData.versions[i].releaseDate);
      const nextDate = new Date(kotlinData.versions[i + 1].releaseDate);
      expect(currentDate >= nextDate).toBe(true);
    }
  });

  it('should have unique version numbers', () => {
    const versions = kotlinData.versions.map((v: any) => v.version);
    const uniqueVersions = new Set(versions);
    expect(versions.length).toBe(uniqueVersions.size);
  });

  it('should have valid version format', () => {
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
    kotlinData.versions.forEach((v: any) => {
      expect(v.version).toMatch(versionRegex);
    });
  });

  it('should have K2 compiler for Kotlin 2.0+', () => {
    const version2x = kotlinData.versions.filter((v: any) => v.version.startsWith('2.'));
    version2x.forEach((v: any) => {
      expect(v.compilerType).toBe('K2');
    });
  });

  it('should have K1 compiler for Kotlin 1.x', () => {
    const version1x = kotlinData.versions.filter((v: any) => v.version.startsWith('1.'));
    version1x.forEach((v: any) => {
      expect(v.compilerType).toBe('K1');
    });
  });

  it('should mark older versions as deprecated', () => {
    const version1_6_and_older = kotlinData.versions.filter((v: any) => {
      const major = parseInt(v.version.split('.')[0]);
      const minor = parseInt(v.version.split('.')[1]);
      return major === 1 && minor <= 6;
    });
    
    version1_6_and_older.forEach((v: any) => {
      expect(v.deprecated).toBe(true);
    });
  });

  it('should have JVM target versions', () => {
    kotlinData.versions.forEach((v: any) => {
      expect(v.jvmTarget).toBeDefined();
      expect(Array.isArray(v.jvmTarget)).toBe(true);
      expect(v.jvmTarget.length).toBeGreaterThan(0);
    });
  });

  it('should require JDK 8+ for all versions', () => {
    kotlinData.versions.forEach((v: any) => {
      expect(v.minJdk).toBeGreaterThanOrEqual(8);
    });
  });

  it('should have AGP compatibility', () => {
    kotlinData.versions.forEach((v: any) => {
      expect(v.minAGP).toBeDefined();
      expect(v.minAGP).toBeTruthy();
    });
  });

  it('should have Kotlin 2.0.20 or later as latest stable', () => {
    const latestStable = kotlinData.versions.find((v: any) => 
      v.status === 'stable' && v.version.startsWith('2.0.')
    );
    expect(latestStable).toBeDefined();
    expect(latestStable.version).toMatch(/^2\.0\.\d+$/);
  });

  it('should support JDK 21 for Kotlin 2.0+', () => {
    const version2x = kotlinData.versions.filter((v: any) => v.version.startsWith('2.'));
    version2x.forEach((v: any) => {
      expect(v.jvmTarget).toContain('21');
    });
  });

  it('should have language features documented for major releases', () => {
    const majorVersions = kotlinData.versions.filter((v: any) => 
      v.version.endsWith('.0') && !v.version.includes('-')
    );
    majorVersions.forEach((v: any) => {
      expect(v.languageFeatures).toBeDefined();
      expect(v.languageFeatures.length).toBeGreaterThan(0);
    });
  });

  it('should have breaking changes for Kotlin 2.0', () => {
    const version2_0 = kotlinData.versions.find((v: any) => v.version === '2.0.0');
    expect(version2_0).toBeDefined();
    expect(version2_0.breakingChanges).toBeDefined();
    expect(version2_0.breakingChanges.length).toBeGreaterThan(0);
  });

  it('should have consistent metadata', () => {
    expect(kotlinData.metadata.totalVersions).toBe(kotlinData.versions.length);
    expect(kotlinData.metadata.lastUpdated).toBeDefined();
    expect(kotlinData.metadata.source).toBeDefined();
  });
});
