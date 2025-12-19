/**
 * Chunk 4.5 - Android Testing Suite
 * 
 * Comprehensive end-to-end testing of all Android parsers and tools.
 * Tests 20 real Android errors across:
 * - Jetpack Compose (5 errors)
 * - XML Layouts (3 errors)
 * - Gradle Build (5 errors)
 * - Android Manifest (3 errors)
 * - Mixed Errors (4 errors)
 * 
 * Target: 14/20 (70%+) accuracy
 * Latency: <60s per analysis (fast mode)
 */

import {
  androidTestDataset,
  getTestCasesByCategory,
  androidDatasetStats,
} from '../fixtures/android-test-dataset';
import { ErrorParser } from '../../src/utils/ErrorParser';
import { JetpackComposeParser } from '../../src/utils/parsers/JetpackComposeParser';
import { XMLParser } from '../../src/utils/parsers/XMLParser';
import { GradleParser } from '../../src/utils/parsers/GradleParser';
import { ManifestAnalyzerTool } from '../../src/tools/ManifestAnalyzerTool';
import type { ParsedError } from '../../src/types';

describe('Chunk 4.5 - Android Testing Suite', () => {
  let errorParser: ErrorParser;
  let composeParser: JetpackComposeParser;
  let xmlParser: XMLParser;
  let gradleParser: GradleParser;
  let manifestTool: ManifestAnalyzerTool;

  beforeAll(() => {
    errorParser = ErrorParser.getInstance();
    composeParser = new JetpackComposeParser();
    xmlParser = new XMLParser();
    gradleParser = new GradleParser();
    manifestTool = new ManifestAnalyzerTool();

    console.log('\n========================================');
    console.log('Starting Chunk 4.5 Android Testing Suite');
    console.log('========================================');
    console.log(`Total Test Cases: ${androidDatasetStats.total}`);
    console.log(`  - Compose: ${androidDatasetStats.compose}`);
    console.log(`  - XML: ${androidDatasetStats.xml}`);
    console.log(`  - Gradle: ${androidDatasetStats.gradle}`);
    console.log(`  - Manifest: ${androidDatasetStats.manifest}`);
    console.log(`  - Mixed: ${androidDatasetStats.mixed}`);
    console.log('========================================\n');
  });

  afterAll(() => {
    console.log('\n========================================');
    console.log('Android Testing Suite Complete');
    console.log('========================================\n');
  });

  // ========== JETPACK COMPOSE TESTS (5) ==========
  
  describe('Jetpack Compose Parser Tests', () => {
    const composeTests = getTestCasesByCategory('compose');

    it('should have 5 Compose test cases', () => {
      expect(composeTests).toHaveLength(5);
    });

    test('AC001: Parse Compose State Without remember', () => {
      const testCase = composeTests.find(tc => tc.id === 'AC001')!;
      expect(testCase).toBeDefined();

      const result = composeParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_remember');
      expect(result?.language).toBe('kotlin');
      expect(result?.framework).toBe('compose');
      expect(result?.message).toContain('Reading a state');
      expect(result?.filePath).toBe('HomeScreen.kt');
      expect(result?.line).toBe(45);
    });

    test('AC002: Parse Compose Infinite Recomposition', () => {
      const testCase = composeTests.find(tc => tc.id === 'AC002')!;
      const result = composeParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_recomposition');
      expect(result?.metadata?.recompositionCount).toBeGreaterThan(100);
      expect(result?.filePath).toBe('ProfileCard.kt');
      expect(result?.line).toBe(28);
    });

    test('AC003: Parse LaunchedEffect Without Key', () => {
      const testCase = composeTests.find(tc => tc.id === 'AC003')!;
      const result = composeParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_launched_effect');
      expect(result?.filePath).toBe('DataScreen.kt');
      expect(result?.line).toBe(52);
    });

    test('AC004: Parse CompositionLocal Not Provided', () => {
      const testCase = composeTests.find(tc => tc.id === 'AC004')!;
      const result = composeParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_composition_local');
      expect(result?.message).toContain('LocalUserSession');
      expect(result?.filePath).toBe('UserProfile.kt');
      expect(result?.line).toBe(15);
    });

    test('AC005: Parse Compose Modifier Order Issue', () => {
      const testCase = composeTests.find(tc => tc.id === 'AC005')!;
      const result = composeParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('compose_modifier');
      expect(result?.message).toContain('Clickable modifier');
      expect(result?.filePath).toBe('CustomButton.kt');
      expect(result?.line).toBe(22);
    });

    test('All Compose errors should parse correctly', () => {
      let successCount = 0;
      const results: Array<{ id: string; success: boolean; type: string | null }> = [];

      for (const testCase of composeTests) {
        const result = composeParser.parse(testCase.errorText);
        const success = result !== null && result.type === testCase.expectedType;
        
        results.push({
          id: testCase.id,
          success,
          type: result?.type || null,
        });

        if (success) successCount++;
      }

      console.log('\n--- Compose Parser Results ---');
      results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`${status} ${r.id}: ${r.type || 'null'}`);
      });
      console.log(`Accuracy: ${successCount}/${composeTests.length} (${(successCount / composeTests.length * 100).toFixed(1)}%)`);

      // Expect at least 80% accuracy for Compose errors
      expect(successCount).toBeGreaterThanOrEqual(Math.ceil(composeTests.length * 0.8));
    });
  });

  // ========== XML LAYOUT TESTS (3) ==========
  
  describe('XML Parser Tests', () => {
    const xmlTests = getTestCasesByCategory('xml');

    it('should have 3 XML test cases', () => {
      expect(xmlTests).toHaveLength(3);
    });

    test('AX001: Parse XML Layout Inflation Error', () => {
      const testCase = xmlTests.find(tc => tc.id === 'AX001')!;
      const result = xmlParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('xml_inflation');
      expect(result?.language).toBe('xml');
      expect(result?.line).toBe(23);
    });

    test('AX002: Parse XML Missing Required Attribute', () => {
      const testCase = xmlTests.find(tc => tc.id === 'AX002')!;
      const result = xmlParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('xml_missing_attribute');
      expect(result?.message).toContain('layout_width');
      expect(result?.line).toBe(45);
    });

    test('AX003: Parse XML View ID Not Found', () => {
      const testCase = xmlTests.find(tc => tc.id === 'AX003')!;
      const result = xmlParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('xml_missing_id');
      expect(result?.language).toBe('xml');
    });

    test('All XML errors should parse correctly', () => {
      let successCount = 0;
      const results: Array<{ id: string; success: boolean; type: string | null }> = [];

      for (const testCase of xmlTests) {
        const result = xmlParser.parse(testCase.errorText);
        const success = result !== null && result.type === testCase.expectedType;
        
        results.push({
          id: testCase.id,
          success,
          type: result?.type || null,
        });

        if (success) successCount++;
      }

      console.log('\n--- XML Parser Results ---');
      results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`${status} ${r.id}: ${r.type || 'null'}`);
      });
      console.log(`Accuracy: ${successCount}/${xmlTests.length} (${(successCount / xmlTests.length * 100).toFixed(1)}%)`);

      // Expect at least 70% accuracy for XML errors
      expect(successCount).toBeGreaterThanOrEqual(Math.ceil(xmlTests.length * 0.7));
    });
  });

  // ========== GRADLE BUILD TESTS (5) ==========
  
  describe('Gradle Parser Tests', () => {
    const gradleTests = getTestCasesByCategory('gradle');

    it('should have 5 Gradle test cases', () => {
      expect(gradleTests).toHaveLength(5);
    });

    test('AG001: Parse Gradle Dependency Conflict', () => {
      const testCase = gradleTests.find(tc => tc.id === 'AG001')!;
      const result = gradleParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('gradle_dependency_conflict');
      expect(result?.language).toBe('gradle');
      expect(result?.metadata).toHaveProperty('conflictingDependencies');
    });

    test('AG002: Parse Gradle Kotlin Version Mismatch', () => {
      const testCase = gradleTests.find(tc => tc.id === 'AG002')!;
      const result = gradleParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('gradle_version_mismatch');
      expect(result?.message).toContain('incompatible version');
    });

    test('AG003: Parse Gradle Repository Not Found', () => {
      const testCase = gradleTests.find(tc => tc.id === 'AG003')!;
      const result = gradleParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('gradle_dependency_resolution_error');
      expect(result?.message).toContain('Could not find');
    });

    test('AG004: Parse Gradle Plugin Not Applied', () => {
      const testCase = gradleTests.find(tc => tc.id === 'AG004')!;
      const result = gradleParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('gradle_plugin_error');
      expect(result?.message).toContain('Plugin');
    });

    test('AG005: Parse Gradle Build Script Syntax Error', () => {
      const testCase = gradleTests.find(tc => tc.id === 'AG005')!;
      const result = gradleParser.parse(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('gradle_build_script_syntax_error');
      expect(result?.filePath).toBe('build.gradle');
      expect(result?.line).toBe(45);
    });

    test('All Gradle errors should parse correctly', () => {
      let successCount = 0;
      const results: Array<{ id: string; success: boolean; type: string | null }> = [];

      for (const testCase of gradleTests) {
        const result = gradleParser.parse(testCase.errorText);
        const success = result !== null && result.type === testCase.expectedType;
        
        results.push({
          id: testCase.id,
          success,
          type: result?.type || null,
        });

        if (success) successCount++;
      }

      console.log('\n--- Gradle Parser Results ---');
      results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`${status} ${r.id}: ${r.type || 'null'}`);
      });
      console.log(`Accuracy: ${successCount}/${gradleTests.length} (${(successCount / gradleTests.length * 100).toFixed(1)}%)`);

      // Expect at least 70% accuracy for Gradle errors
      expect(successCount).toBeGreaterThanOrEqual(Math.ceil(gradleTests.length * 0.7));
    });
  });

  // ========== MANIFEST TESTS (3) ==========
  
  describe('Manifest Analyzer Tests', () => {
    const manifestTests = getTestCasesByCategory('manifest');

    it('should have 3 Manifest test cases', () => {
      expect(manifestTests).toHaveLength(3);
    });

    test('AM001: Parse Manifest Missing Camera Permission', () => {
      const testCase = manifestTests.find(tc => tc.id === 'AM001')!;
      const result = manifestTool.parseManifestError(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('manifest_missing_permission');
      expect(result?.language).toBe('xml');
      expect(result?.metadata?.requiredPermission).toBe('android.permission.CAMERA');
      expect(result?.metadata?.isDangerous).toBe(true);
    });

    test('AM002: Parse Manifest Undeclared Activity', () => {
      const testCase = manifestTests.find(tc => tc.id === 'AM002')!;
      const result = manifestTool.parseManifestError(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('manifest_undeclared_activity');
      expect(result?.metadata?.componentType).toBe('activity');
      expect(result?.metadata?.componentName).toContain('SettingsActivity');
    });

    test('AM003: Parse Manifest Merge Conflict', () => {
      const testCase = manifestTests.find(tc => tc.id === 'AM003')!;
      const result = manifestTool.parseManifestError(testCase.errorText);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('manifest_merge_conflict');
      expect(result?.metadata?.attribute).toBe('allowBackup');
    });

    test('All Manifest errors should parse correctly', () => {
      let successCount = 0;
      const results: Array<{ id: string; success: boolean; type: string | null }> = [];

      for (const testCase of manifestTests) {
        const result = manifestTool.parseManifestError(testCase.errorText);
        const success = result !== null && result.type === testCase.expectedType;
        
        results.push({
          id: testCase.id,
          success,
          type: result?.type || null,
        });

        if (success) successCount++;
      }

      console.log('\n--- Manifest Analyzer Results ---');
      results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`${status} ${r.id}: ${r.type || 'null'}`);
      });
      console.log(`Accuracy: ${successCount}/${manifestTests.length} (${(successCount / manifestTests.length * 100).toFixed(1)}%)`);

      // Expect at least 70% accuracy for Manifest errors
      expect(successCount).toBeGreaterThanOrEqual(Math.ceil(manifestTests.length * 0.7));
    });
  });

  // ========== MIXED ERROR TESTS (4) ==========
  
  describe('Mixed Error Tests', () => {
    const mixedTests = getTestCasesByCategory('mixed');

    it('should have 4 Mixed error test cases', () => {
      expect(mixedTests).toHaveLength(4);
    });

    test('AM004: Parse Mixed Kotlin + Gradle Error', () => {
      const testCase = mixedTests.find(tc => tc.id === 'AM004')!;
      
      // Should parse as Kotlin error first
      const kotlinResult = errorParser.parse(testCase.errorText);
      expect(kotlinResult).not.toBeNull();
      expect(kotlinResult?.type).toBe('unresolved_reference');
      expect(kotlinResult?.message).toContain('viewModelScope');
    });

    test('AM005: Parse Mixed XML + Manifest Error', () => {
      const testCase = mixedTests.find(tc => tc.id === 'AM005')!;
      
      // Should parse as XML inflation error
      const xmlResult = xmlParser.parse(testCase.errorText);
      expect(xmlResult).not.toBeNull();
      expect(xmlResult?.type).toBe('xml_inflation');
      expect(xmlResult?.message).toContain('WebView');
    });

    test('AM006: Parse Mixed Compose + Kotlin Error', () => {
      const testCase = mixedTests.find(tc => tc.id === 'AM006')!;
      
      // Should parse as lateinit error
      const result = errorParser.parse(testCase.errorText);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('lateinit');
      expect(result?.message).toContain('viewModel');
    });

    test('AM007: Parse Mixed Gradle + Manifest Error', () => {
      const testCase = mixedTests.find(tc => tc.id === 'AM007')!;
      
      // Should parse as Gradle dependency conflict
      const gradleResult = gradleParser.parse(testCase.errorText);
      expect(gradleResult).not.toBeNull();
      expect(gradleResult?.type).toBe('gradle_dependency_conflict');
      expect(gradleResult?.message).toContain('androidx.core');
    });

    test('All Mixed errors should parse correctly', () => {
      let successCount = 0;
      const results: Array<{ id: string; success: boolean; type: string | null }> = [];

      for (const testCase of mixedTests) {
        let result: ParsedError | null = null;
        
        // Try appropriate parser based on expected type
        if (testCase.expectedType.includes('gradle')) {
          result = gradleParser.parse(testCase.errorText);
        } else if (testCase.expectedType.includes('xml')) {
          result = xmlParser.parse(testCase.errorText);
        } else {
          result = errorParser.parse(testCase.errorText);
        }
        
        const success = result !== null && result.type === testCase.expectedType;
        
        results.push({
          id: testCase.id,
          success,
          type: result?.type || null,
        });

        if (success) successCount++;
      }

      console.log('\n--- Mixed Error Results ---');
      results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`${status} ${r.id}: ${r.type || 'null'}`);
      });
      console.log(`Accuracy: ${successCount}/${mixedTests.length} (${(successCount / mixedTests.length * 100).toFixed(1)}%)`);

      // Expect at least 60% accuracy for Mixed errors (hardest category)
      expect(successCount).toBeGreaterThanOrEqual(Math.ceil(mixedTests.length * 0.6));
    });
  });

  // ========== OVERALL ACCURACY TEST ==========
  
  describe('Overall Android Testing Accuracy', () => {
    test('Should achieve 70%+ accuracy across all 20 Android errors', () => {
      let successCount = 0;
      const categoryResults = {
        compose: { success: 0, total: 0 },
        xml: { success: 0, total: 0 },
        gradle: { success: 0, total: 0 },
        manifest: { success: 0, total: 0 },
        mixed: { success: 0, total: 0 },
      };

      for (const testCase of androidTestDataset) {
        let result: ParsedError | null = null;
        
        // Route to appropriate parser
        if (testCase.expectedParser === 'JetpackComposeParser') {
          result = composeParser.parse(testCase.errorText);
        } else if (testCase.expectedParser === 'XMLParser') {
          result = xmlParser.parse(testCase.errorText);
        } else if (testCase.expectedParser === 'GradleParser') {
          result = gradleParser.parse(testCase.errorText);
        } else if (testCase.expectedParser === 'ManifestAnalyzerTool') {
          result = manifestTool.parseManifestError(testCase.errorText);
        } else {
          result = errorParser.parse(testCase.errorText);
        }

        const success = result !== null && result.type === testCase.expectedType;
        
        categoryResults[testCase.category].total++;
        if (success) {
          successCount++;
          categoryResults[testCase.category].success++;
        }
      }

      const accuracy = (successCount / androidTestDataset.length) * 100;

      console.log('\n========================================');
      console.log('FINAL ANDROID TESTING RESULTS');
      console.log('========================================');
      console.log(`Overall Accuracy: ${successCount}/${androidTestDataset.length} (${accuracy.toFixed(1)}%)`);
      console.log('');
      console.log('Category Breakdown:');
      console.log(`  Compose:  ${categoryResults.compose.success}/${categoryResults.compose.total} (${(categoryResults.compose.success / categoryResults.compose.total * 100).toFixed(1)}%)`);
      console.log(`  XML:      ${categoryResults.xml.success}/${categoryResults.xml.total} (${(categoryResults.xml.success / categoryResults.xml.total * 100).toFixed(1)}%)`);
      console.log(`  Gradle:   ${categoryResults.gradle.success}/${categoryResults.gradle.total} (${(categoryResults.gradle.success / categoryResults.gradle.total * 100).toFixed(1)}%)`);
      console.log(`  Manifest: ${categoryResults.manifest.success}/${categoryResults.manifest.total} (${(categoryResults.manifest.success / categoryResults.manifest.total * 100).toFixed(1)}%)`);
      console.log(`  Mixed:    ${categoryResults.mixed.success}/${categoryResults.mixed.total} (${(categoryResults.mixed.success / categoryResults.mixed.total * 100).toFixed(1)}%)`);
      console.log('========================================\n');

      // Target: 14/20 = 70%
      expect(successCount).toBeGreaterThanOrEqual(14);
      expect(accuracy).toBeGreaterThanOrEqual(70);
    });
  });

  // ========== PERFORMANCE BENCHMARKING ==========
  
  describe('Performance Benchmarking', () => {
    test('Parser performance should be under 100ms per error', () => {
      const timings: number[] = [];

      for (const testCase of androidTestDataset.slice(0, 10)) {
        const start = Date.now();
        
        // Parse with appropriate parser
        if (testCase.expectedParser === 'JetpackComposeParser') {
          composeParser.parse(testCase.errorText);
        } else if (testCase.expectedParser === 'XMLParser') {
          xmlParser.parse(testCase.errorText);
        } else if (testCase.expectedParser === 'GradleParser') {
          gradleParser.parse(testCase.errorText);
        } else if (testCase.expectedParser === 'ManifestAnalyzerTool') {
          manifestTool.parseManifestError(testCase.errorText);
        } else {
          errorParser.parse(testCase.errorText);
        }
        
        const duration = Date.now() - start;
        timings.push(duration);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);

      console.log('\n--- Parser Performance ---');
      console.log(`Average: ${avgTime.toFixed(2)}ms`);
      console.log(`Max: ${maxTime.toFixed(2)}ms`);
      console.log(`Min: ${Math.min(...timings).toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(500);
    });
  });
});
