# Knowledge Base Directory

This directory contains version databases and compatibility matrices for Android development tools (AGP, Kotlin, Gradle, JDK).

## 📁 Files

### Version Databases

#### `agp-versions.json`
Android Gradle Plugin version database with 156+ versions covering:
- AGP 7.0.0 - 9.0.0
- Release dates, status (stable/beta/alpha/deprecated)
- Gradle, Kotlin, JDK compatibility
- Breaking changes and migration guides

**Usage:**
```typescript
import agpVersions from './agp-versions.json';

// Find a version
const version = agpVersions.versions.find(v => v.version === '8.7.3');

// Check if version exists
const exists = agpVersions.versions.some(v => v.version === '8.10.0'); // false!

// Get latest stable
const latest = agpVersions.versions.find(v => v.status === 'stable');
```

#### `kotlin-versions.json`
Kotlin version database with 52+ versions covering:
- Kotlin 1.5.0 - 2.0.21
- Compiler type (K1 vs K2)
- JVM targets, AGP compatibility
- Language features and breaking changes

**Usage:**
```typescript
import kotlinVersions from './kotlin-versions.json';

// Check compiler type
const version = kotlinVersions.versions.find(v => v.version === '2.0.0');
console.log(version.compilerType); // "K2"

// Find compatible AGP
const minAGP = version.minAGP; // "8.3.0"
```

#### `compatibility-matrix.json`
Cross-version compatibility rules with quick lookup tables:
- AGP ↔ Kotlin ↔ Gradle ↔ JDK compatibility
- Recommended version combinations
- Known issues and workarounds

**Usage:**
```typescript
import matrix from './compatibility-matrix.json';

// Quick lookup: AGP to Kotlin
const compatibleKotlin = matrix.versionMappings.agpToKotlin['8.7.3'];
// ["1.9.0", "1.9.10", ..., "2.0.21"]

// Quick lookup: AGP to Gradle
const compatibleGradle = matrix.versionMappings.agpToGradle['8.7.3'];
// ["8.7", "8.8", "8.9"]

// Detailed rule
const rule = matrix.compatibilityRules.find(r => r.agpVersionRange === '8.7.0-8.7.3');
console.log(rule.recommendedKotlin); // "1.9.25"
console.log(rule.recommendedGradle); // "8.9"
console.log(rule.recommendedJdk);    // 17
```

## 🔍 Key Facts

### AGP Version Gaps (Important!)
These versions **DO NOT EXIST** in Maven Central:
- ❌ AGP 8.8.x series (entire series skipped)
- ❌ AGP 8.10.0 (common error!)

Valid AGP 8.x series:
- ✅ 8.0.x, 8.1.x, 8.2.x, 8.3.x, 8.4.x, 8.5.x, 8.6.x, 8.7.x
- ⏩ (then jumps to 8.9.x for AGP 9.0 support)

### JDK Requirements
| Tool | JDK 8 | JDK 11 | JDK 17 | JDK 21 |
|------|-------|--------|--------|--------|
| AGP 7.x | ❌ | ✅ Required | ✅ | ❌ |
| AGP 8.x | ❌ | ❌ | ✅ Required | ✅ |
| AGP 9.x | ❌ | ❌ | ✅ | ✅ Recommended |
| Kotlin 1.9.x | ✅ | ✅ | ✅ | ✅ |
| Kotlin 2.0.x | ✅ | ✅ | ✅ Recommended | ✅ |

### Kotlin Compiler Evolution
- **K1 (Legacy):** Kotlin 1.5.x - 1.9.x
- **K2 (Modern):** Kotlin 2.0.0+
- Breaking change at 2.0.0 boundary

## 🧪 Testing

Run unit tests to validate data integrity:
```bash
npm test -- tests/unit/knowledge
```

Tests validate:
- ✅ JSON schema compliance
- ✅ Data integrity (no duplicates, valid formats)
- ✅ Business rules (correct JDK/Gradle requirements)
- ✅ Cross-referencing (versions exist across databases)
- ✅ Known gaps (8.10.0, 8.8.x don't exist)

## 📊 Schema Validation

All JSON files have corresponding `.schema.json` files for validation:
- `agp-versions.schema.json` - AGP database schema
- `kotlin-versions.schema.json` - Kotlin database schema
- `compatibility-matrix.schema.json` - Compatibility matrix schema

Schemas use JSON Schema Draft 7 specification.

## 🔄 Updating Data

### Manual Update
1. Edit JSON file directly
2. Ensure schema compliance
3. Run tests: `npm test -- tests/unit/knowledge`
4. Update `metadata.lastUpdated` field

### Automated Update (Future)
- Scraper scripts (planned for Phase 3)
- Weekly/monthly automated updates
- Validation pipeline

## 📚 Data Sources

1. **Maven Central** - Official AGP releases
2. **Android Developer Docs** - Google's official documentation
3. **Kotlin Blog** - JetBrains official releases
4. **Gradle Release Notes** - Gradle official documentation
5. **Community Reports** - GitHub issues, Stack Overflow

## 🎯 Use Cases

### For RCA Agent
```typescript
// Validate version exists
if (!agpVersions.versions.some(v => v.version === userVersion)) {
  return {
    error: `AGP ${userVersion} does not exist`,
    suggestions: getValidVersions(userVersion)
  };
}

// Suggest compatible versions
function getCompatibleKotlin(agpVersion: string): string[] {
  return matrix.versionMappings.agpToKotlin[agpVersion] || [];
}

// Check if upgrade needed
function needsUpgrade(currentAGP: string): boolean {
  const version = agpVersions.versions.find(v => v.version === currentAGP);
  return version?.deprecated === true;
}
```

### For Version Lookup Tool (Chunk 2)
```typescript
class VersionLookupTool {
  validateVersion(version: string, type: 'agp' | 'kotlin'): boolean {
    const db = type === 'agp' ? agpVersions : kotlinVersions;
    return db.versions.some(v => v.version === version);
  }
  
  findValidVersions(pattern: string): string[] {
    // Implementation using version databases
  }
  
  checkCompatibility(agp: string, kotlin: string): boolean {
    const compatibleKotlin = matrix.versionMappings.agpToKotlin[agp];
    return compatibleKotlin?.includes(kotlin) ?? false;
  }
}
```

## 📈 Statistics

- **Total AGP versions:** 156
- **Total Kotlin versions:** 52
- **Total compatibility rules:** 14
- **Total version mappings:** 110+
- **Total data points:** 222+
- **Test coverage:** 54+ unit tests

## 🚀 Next Steps (Chunk 2)

With these databases in place, Chunk 2 will implement:
1. `VersionLookupTool.ts` - Query interface
2. Version validation logic
3. Compatibility checking
4. Smart version suggestions
5. Integration with MinimalReactAgent

## 📝 Notes

- All versions sorted newest first (reverse chronological)
- Deprecated versions kept for historical reference
- Breaking changes documented for major versions
- Migration guides linked where available
- Cross-references validated via unit tests

---

**Created:** December 27, 2025  
**Part of:** Phase 3 - Intelligence Enhancement  
**Chunk:** 1/10 - Version Database Foundation
