/**
 * Merge TypeScript Examples to JSON
 * 
 * Converts the 30 new TypeScript examples into the existing JSON format
 * and merges them with the 39 existing examples.
 * 
 * This resolves the dynamic import issue in compiled code.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

async function mergeExamplesToJSON() {
  console.log('\n[PACKAGE] Merging TypeScript Examples to JSON\n');
  console.log('='.repeat(80));

  // 1. Load existing JSON database
  const jsonPath = path.join(__dirname, '../src/knowledge/few-shot-examples.json');
  console.log('\n[READ] Loading existing JSON database...');

  const content = await fs.readFile(jsonPath, 'utf-8');
  const database = JSON.parse(content);

  const originalCount = Object.values(database.categories).reduce(
    (sum: number, category: any) => sum + category.examples.length,
    0
  );

  console.log(`   Found ${originalCount} existing examples`);

  // 2. Dynamically import TypeScript examples
  console.log('\n[PACKAGE] Importing TypeScript examples...');

  const {
    MANIFEST_PERMISSION_EXAMPLES,
    BUILD_CACHE_EXAMPLES,
    PROGUARD_EXAMPLES,
    NAVIGATION_EXAMPLES
  } = await import('../src/knowledge/few-shot-examples/index.js');

  console.log(`   [OK] Loaded ${MANIFEST_PERMISSION_EXAMPLES?.length || 0} manifest examples`);
  console.log(`   [OK] Loaded ${BUILD_CACHE_EXAMPLES?.length || 0} cache examples`);
  console.log(`   [OK] Loaded ${PROGUARD_EXAMPLES?.length || 0} ProGuard examples`);
  console.log(`   [OK] Loaded ${NAVIGATION_EXAMPLES?.length || 0} navigation examples`);

  // 2. Add new categories if they don't exist
  console.log('\n➕ Adding new categories...');

  if (!database.categories.manifest) {
    database.categories.manifest = {
      description: 'Android Manifest permission and component errors',
      examples: []
    };
    console.log('   [OK] Created "manifest" category');
  }

  if (!database.categories.cache) {
    database.categories.cache = {
      description: 'Gradle and build cache corruption errors',
      examples: []
    };
    console.log('   [OK] Created "cache" category');
  }

  if (!database.categories.proguard) {
    database.categories.proguard = {
      description: 'R8/ProGuard minification and obfuscation errors',
      examples: []
    };
    console.log('   [OK] Created "proguard" category');
  }

  if (!database.categories.navigation) {
    database.categories.navigation = {
      description: 'Jetpack Navigation and routing errors',
      examples: []
    };
    console.log('   [OK] Created "navigation" category');
  }

  // 3. Add TypeScript examples to database
  console.log('\n[NOTE] Adding TypeScript examples...');

  let addedCount = 0;

  // Manifest examples
  if (MANIFEST_PERMISSION_EXAMPLES && Array.isArray(MANIFEST_PERMISSION_EXAMPLES)) {
    for (const example of MANIFEST_PERMISSION_EXAMPLES) {
      database.categories.manifest.examples.push(example);
      addedCount++;
    }
    console.log(`   [OK] Added ${MANIFEST_PERMISSION_EXAMPLES.length} manifest examples`);
  }

  // Cache examples
  if (BUILD_CACHE_EXAMPLES && Array.isArray(BUILD_CACHE_EXAMPLES)) {
    for (const example of BUILD_CACHE_EXAMPLES) {
      database.categories.cache.examples.push(example);
      addedCount++;
    }
    console.log(`   [OK] Added ${BUILD_CACHE_EXAMPLES.length} cache examples`);
  }

  // ProGuard examples
  if (PROGUARD_EXAMPLES && Array.isArray(PROGUARD_EXAMPLES)) {
    for (const example of PROGUARD_EXAMPLES) {
      database.categories.proguard.examples.push(example);
      addedCount++;
    }
    console.log(`   [OK] Added ${PROGUARD_EXAMPLES.length} ProGuard examples`);
  }

  // Navigation examples
  if (NAVIGATION_EXAMPLES && Array.isArray(NAVIGATION_EXAMPLES)) {
    for (const example of NAVIGATION_EXAMPLES) {
      database.categories.navigation.examples.push(example);
      addedCount++;
    }
    console.log(`   [OK] Added ${NAVIGATION_EXAMPLES.length} navigation examples`);
  }

  // 4. Update metadata
  database.version = '2.0.0'; // Increment version
  database.lastUpdated = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  database.description = 'Few-shot learning examples for Android error analysis (Chunk 9: Added manifest, cache, proguard, navigation)';

  // 5. Save updated database
  console.log('\n💾 Saving merged database...');

  // Backup original
  const backupPath = jsonPath.replace('.json', '.backup.json');
  await fs.writeFile(backupPath, content);
  console.log(`   [OK] Backed up original to: ${path.basename(backupPath)}`);

  // Write merged database
  await fs.writeFile(jsonPath, JSON.stringify(database, null, 2));
  console.log(`   [OK] Saved merged database to: ${path.basename(jsonPath)}`);

  // 6. Summary
  const finalCount = Object.values(database.categories).reduce(
    (sum: number, category: any) => sum + category.examples.length,
    0
  );

  console.log('\n' + '='.repeat(80));
  console.log('\n[STATS] MERGE SUMMARY:\n');
  console.log(`Original examples:  ${originalCount}`);
  console.log(`Added examples:     ${addedCount}`);
  console.log(`Total examples:     ${finalCount}`);
  console.log(`Version:            ${database.version}`);
  console.log(`Last updated:       ${database.lastUpdated}`);
  console.log('');
  console.log('Categories:');
  for (const [name, category] of Object.entries(database.categories)) {
    const cat = category as any;
    console.log(`  - ${name}: ${cat.examples.length} examples`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n[OK] Merge complete!\n');
  console.log('Next steps:');
  console.log('1. Run a test to verify examples load: npx ts-node scripts/chunk7-test1-agp-retest.ts');
  console.log('2. Look for "Loaded 69 few-shot examples" in the output');
  console.log('3. If successful, run full test suite: npx ts-node scripts/chunk9-retest-all.ts\n');
}

// Run merge
mergeExamplesToJSON()
  .then(() => {
    console.log('[OK] Merge script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[X] Merge failed:', error);
    process.exit(1);
  });
