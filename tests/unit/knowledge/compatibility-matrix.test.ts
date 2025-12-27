import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('Compatibility Matrix', () => {
  const matrixPath = path.join(__dirname, '../../../src/knowledge/compatibility-matrix.json');
  const matrixSchemaPath = path.join(__dirname, '../../../src/knowledge/compatibility-matrix.schema.json');
  const agpVersionsPath = path.join(__dirname, '../../../src/knowledge/agp-versions.json');
  const kotlinVersionsPath = path.join(__dirname, '../../../src/knowledge/kotlin-versions.json');
  
  let matrixData: any;
  let matrixSchema: any;
  let agpData: any;
  let kotlinData: any;
  
  beforeAll(() => {
    matrixData = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));
    matrixSchema = JSON.parse(fs.readFileSync(matrixSchemaPath, 'utf-8'));
    agpData = JSON.parse(fs.readFileSync(agpVersionsPath, 'utf-8'));
    kotlinData = JSON.parse(fs.readFileSync(kotlinVersionsPath, 'utf-8'));
  });

  it('should have valid JSON structure', () => {
    expect(matrixData).toBeDefined();
    expect(matrixData.metadata).toBeDefined();
    expect(matrixData.compatibilityRules).toBeDefined();
    expect(matrixData.versionMappings).toBeDefined();
  });

  it('should conform to schema', () => {
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = ajv.compile(matrixSchema);
    const valid = validate(matrixData);
    
    if (!valid) {
      console.error('Schema validation errors:', validate.errors);
    }
    
    expect(valid).toBe(true);
  });

  it('should have compatibility rules for AGP 7.x, 8.x, 9.x', () => {
    const hasAGP7 = matrixData.compatibilityRules.some((r: any) => r.agpVersionRange.includes('7.'));
    const hasAGP8 = matrixData.compatibilityRules.some((r: any) => r.agpVersionRange.includes('8.'));
    const hasAGP9 = matrixData.compatibilityRules.some((r: any) => r.agpVersionRange.includes('9.'));
    
    expect(hasAGP7).toBe(true);
    expect(hasAGP8).toBe(true);
    expect(hasAGP9).toBe(true);
  });

  it('should specify JDK 17+ for AGP 8.x and 9.x', () => {
    const agp8x9xRules = matrixData.compatibilityRules.filter((r: any) => 
      r.agpVersionRange.includes('8.') || r.agpVersionRange.includes('9.')
    );
    
    agp8x9xRules.forEach((rule: any) => {
      expect(rule.jdkVersions).toBeDefined();
      expect(Math.min(...rule.jdkVersions)).toBeGreaterThanOrEqual(17);
    });
  });

  it('should specify JDK 11 for AGP 7.x', () => {
    const agp7xRules = matrixData.compatibilityRules.filter((r: any) => 
      r.agpVersionRange.includes('7.')
    );
    
    agp7xRules.forEach((rule: any) => {
      expect(rule.jdkVersions).toContain(11);
    });
  });

  it('should have AGP to Kotlin mappings', () => {
    expect(matrixData.versionMappings.agpToKotlin).toBeDefined();
    expect(Object.keys(matrixData.versionMappings.agpToKotlin).length).toBeGreaterThan(0);
  });

  it('should have AGP to Gradle mappings', () => {
    expect(matrixData.versionMappings.agpToGradle).toBeDefined();
    expect(Object.keys(matrixData.versionMappings.agpToGradle).length).toBeGreaterThan(0);
  });

  it('should have Kotlin to JDK mappings', () => {
    expect(matrixData.versionMappings.kotlinToJdk).toBeDefined();
    expect(Object.keys(matrixData.versionMappings.kotlinToJdk).length).toBeGreaterThan(0);
  });

  it('should map AGP 8.10.0 to nothing (non-existent version)', () => {
    expect(matrixData.versionMappings.agpToKotlin['8.10.0']).toBeUndefined();
  });

  it('should have Kotlin 2.0+ for AGP 9.0.0', () => {
    const agp9Rule = matrixData.compatibilityRules.find((r: any) => 
      r.agpVersionRange === '9.0.0'
    );
    
    expect(agp9Rule).toBeDefined();
    expect(agp9Rule.kotlinVersionRange).toContain('2.0');
  });

  it('should recommend stable versions', () => {
    matrixData.compatibilityRules.forEach((rule: any) => {
      expect(rule.recommendedKotlin).toBeDefined();
      expect(rule.recommendedGradle).toBeDefined();
      expect(rule.recommendedJdk).toBeDefined();
    });
  });

  it('should have breaking change notes for major AGP versions', () => {
    const agp8_0_rule = matrixData.compatibilityRules.find((r: any) => 
      r.agpVersionRange.includes('8.0.0')
    );
    
    expect(agp8_0_rule).toBeDefined();
    expect(agp8_0_rule.notes).toBeDefined();
    expect(agp8_0_rule.notes.length).toBeGreaterThan(0);
  });

  it('should cross-reference with AGP versions database', () => {
    // Check that major AGP versions in matrix exist in AGP database
    const agpVersionsInMatrix = new Set<string>();
    matrixData.compatibilityRules.forEach((rule: any) => {
      const match = rule.agpVersionRange.match(/\d+\.\d+\.\d+/);
      if (match) agpVersionsInMatrix.add(match[0]);
    });
    
    const agpVersionsInDb = new Set(agpData.versions.map((v: any) => v.version));
    
    agpVersionsInMatrix.forEach((version: string) => {
      expect(agpVersionsInDb.has(version)).toBe(true);
    });
  });

  it('should cross-reference with Kotlin versions database', () => {
    // Check that recommended Kotlin versions exist in Kotlin database
    const kotlinVersionsInMatrix = new Set<string>();
    matrixData.compatibilityRules.forEach((rule: any) => {
      if (rule.recommendedKotlin) {
        kotlinVersionsInMatrix.add(rule.recommendedKotlin);
      }
    });
    
    const kotlinVersionsInDb = new Set(kotlinData.versions.map((v: any) => v.version));
    
    kotlinVersionsInMatrix.forEach((version: string) => {
      expect(kotlinVersionsInDb.has(version)).toBe(true);
    });
  });

  it('should have workarounds for known issues', () => {
    const rulesWithIssues = matrixData.compatibilityRules.filter((r: any) => 
      r.issues && r.issues.length > 0
    );
    
    rulesWithIssues.forEach((rule: any) => {
      rule.issues.forEach((issue: any) => {
        expect(issue.description).toBeDefined();
        expect(issue.workaround).toBeDefined();
      });
    });
  });

  it('should have AGP 8.7.3 recommended for Kotlin 1.9.x', () => {
    const mapping = matrixData.versionMappings.agpToKotlin['8.7.3'];
    expect(mapping).toBeDefined();
    expect(mapping).toContain('1.9.25');
  });

  it('should support Kotlin 2.0 with AGP 8.5+', () => {
    const agp8_5_mapping = matrixData.versionMappings.agpToKotlin['8.5.0'];
    expect(agp8_5_mapping).toBeDefined();
    expect(agp8_5_mapping).toContain('2.0.0');
  });
});
