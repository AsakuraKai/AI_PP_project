/**
 * VersionLookupTool - Query version databases for valid versions and compatibility
 * 
 * Provides:
 * - Query AGP versions by range or criteria
 * - Query Kotlin versions with compiler info
 * - Check version compatibility (AGP ↔ Kotlin ↔ Gradle)
 * - Find latest stable/compatible versions
 * - Suggest alternative versions when invalid version detected
 * 
 * Design Philosophy:
 * - Fast in-memory lookups from JSON databases
 * - Comprehensive version validation
 * - Smart version suggestions based on compatibility
 * - Detailed compatibility explanations
 * 
 * This tool is critical for Phase 3: Solution Quality Enhancement
 * to enable the agent to suggest specific, valid version numbers
 * instead of generic "update to latest" advice.
 * 
 * @example
 * const tool = new VersionLookupTool();
 * await tool.initialize();
 * 
 * // Check if version exists
 * const exists = tool.versionExists('agp', '8.10.0'); // false
 * 
 * // Get latest stable
 * const latest = tool.getLatestStable('agp'); // "8.7.3"
 * 
 * // Check compatibility
 * const compatible = tool.checkCompatibility('8.7.3', '1.9.0'); // true
 * 
 * // Suggest alternatives
 * const suggestions = tool.suggestVersions('agp', '8.10.0'); 
 * // ["8.7.3", "8.9.0-alpha01", "9.0.0"]
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './ToolRegistry';

/**
 * AGP Version from database
 */
export interface AGPVersion {
  version: string;
  releaseDate: string;
  status: 'stable' | 'rc' | 'beta' | 'alpha' | 'deprecated';
  minGradleVersion: string;
  maxGradleVersion?: string;
  minKotlinVersion: string;
  recommendedKotlinVersion?: string;
  minJdk: number;
  recommendedJdk?: number;
  breakingChanges?: string[];
  knownIssues: string[];
  migrationGuide?: string;
  deprecated: boolean;
}

/**
 * Kotlin Version from database
 */
export interface KotlinVersion {
  version: string;
  releaseDate: string;
  status: 'stable' | 'rc' | 'beta' | 'eap' | 'deprecated';
  minJdk: number;
  recommendedJdk?: number;
  maxJdk?: number;
  minAGP: string;
  recommendedAGP?: string;
  jvmTarget: string[];
  languageFeatures: string[];
  breakingChanges?: string[];
  knownIssues: string[];
  compilerType: 'K1' | 'K2';
  migrationGuide?: string;
  deprecated: boolean;
}

/**
 * Compatibility Rule from matrix
 */
export interface CompatibilityRule {
  agpVersion: string;
  minKotlinVersion: string;
  maxKotlinVersion?: string;
  minGradleVersion: string;
  maxGradleVersion?: string;
  jdkVersion: string;
  notes: string;
}

/**
 * Version query parameters
 */
export interface VersionQueryParams {
  /** Tool to query: agp, kotlin, gradle */
  tool: 'agp' | 'kotlin' | 'gradle';
  
  /** Query type */
  queryType: 'exists' | 'latest-stable' | 'latest-any' | 'compatible' | 'suggest';
  
  /** Version to check (for exists/suggest queries) */
  version?: string;
  
  /** Reference version for compatibility check */
  referenceVersion?: string;
  
  /** Reference tool for compatibility check */
  referenceTool?: 'agp' | 'kotlin' | 'gradle';
  
  /** Status filter (stable, rc, beta, alpha) */
  statusFilter?: string[];
}

/**
 * Version lookup result
 */
export interface VersionLookupResult {
  /** Whether query succeeded */
  success: boolean;
  
  /** Query type that was executed */
  queryType: string;
  
  /** Result data */
  data: {
    /** Version(s) found */
    versions?: string[];
    
    /** Whether version exists */
    exists?: boolean;
    
    /** Compatibility result */
    compatible?: boolean;
    
    /** Compatibility details */
    compatibilityDetails?: string;
    
    /** Suggestions with reasoning */
    suggestions?: Array<{
      version: string;
      reason: string;
      status: string;
    }>;
  };
  
  /** Error message if query failed */
  error?: string;
}

/**
 * Version Lookup Tool implementation
 */
export class VersionLookupTool implements Tool {
  name = 'version_lookup';
  description = 'Query version databases for AGP, Kotlin, and Gradle versions. Check compatibility, find latest versions, and suggest alternatives.';
  
  private agpVersions: AGPVersion[] = [];
  private kotlinVersions: KotlinVersion[] = [];
  private compatibilityRules: CompatibilityRule[] = [];
  private initialized = false;
  
  private knowledgePath: string;
  
  constructor(knowledgePath?: string) {
    // Default to src/knowledge relative to project root
    this.knowledgePath = knowledgePath || path.join(__dirname, '..', 'knowledge');
  }
  
  /**
   * Initialize by loading version databases
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Load AGP versions
      const agpPath = path.join(this.knowledgePath, 'agp-versions.json');
      const agpData = await fs.readFile(agpPath, 'utf-8');
      const agpJson = JSON.parse(agpData);
      this.agpVersions = agpJson.versions;
      
      // Load Kotlin versions
      const kotlinPath = path.join(this.knowledgePath, 'kotlin-versions.json');
      const kotlinData = await fs.readFile(kotlinPath, 'utf-8');
      const kotlinJson = JSON.parse(kotlinData);
      this.kotlinVersions = kotlinJson.versions;
      
      // Load compatibility matrix
      const compatPath = path.join(this.knowledgePath, 'compatibility-matrix.json');
      const compatData = await fs.readFile(compatPath, 'utf-8');
      const compatJson = JSON.parse(compatData);
      this.compatibilityRules = compatJson.compatibilityRules;
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize VersionLookupTool: ${error}`);
    }
  }
  
  /**
   * Execute tool with parameters
   */
  async execute(parameters: Record<string, any>): Promise<VersionLookupResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const params = parameters as VersionQueryParams;
    
    try {
      switch (params.queryType) {
        case 'exists':
          return this.queryExists(params);
        case 'latest-stable':
          return this.queryLatestStable(params);
        case 'latest-any':
          return this.queryLatestAny(params);
        case 'compatible':
          return this.queryCompatible(params);
        case 'suggest':
          return this.querySuggest(params);
        default:
          return {
            success: false,
            queryType: params.queryType,
            data: {},
            error: `Unknown query type: ${params.queryType}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        queryType: params.queryType,
        data: {},
        error: `Query failed: ${error}`,
      };
    }
  }
  
  /**
   * Check if a version exists
   */
  private queryExists(params: VersionQueryParams): VersionLookupResult {
    if (!params.version) {
      return {
        success: false,
        queryType: 'exists',
        data: {},
        error: 'Version parameter required for exists query',
      };
    }
    
    const exists = this.versionExists(params.tool, params.version);
    
    return {
      success: true,
      queryType: 'exists',
      data: {
        exists,
        versions: exists ? [params.version] : [],
      },
    };
  }
  
  /**
   * Get latest stable version
   */
  private queryLatestStable(params: VersionQueryParams): VersionLookupResult {
    const latest = this.getLatestStable(params.tool);
    
    if (!latest) {
      return {
        success: false,
        queryType: 'latest-stable',
        data: {},
        error: `No stable version found for ${params.tool}`,
      };
    }
    
    return {
      success: true,
      queryType: 'latest-stable',
      data: {
        versions: [latest],
      },
    };
  }
  
  /**
   * Get latest version (any status)
   */
  private queryLatestAny(params: VersionQueryParams): VersionLookupResult {
    const latest = this.getLatestAny(params.tool);
    
    if (!latest) {
      return {
        success: false,
        queryType: 'latest-any',
        data: {},
        error: `No version found for ${params.tool}`,
      };
    }
    
    return {
      success: true,
      queryType: 'latest-any',
      data: {
        versions: [latest],
      },
    };
  }
  
  /**
   * Check version compatibility
   */
  private queryCompatible(params: VersionQueryParams): VersionLookupResult {
    if (!params.version || !params.referenceVersion || !params.referenceTool) {
      return {
        success: false,
        queryType: 'compatible',
        data: {},
        error: 'Version, referenceVersion, and referenceTool required for compatibility query',
      };
    }
    
    const result = this.checkCompatibility(
      params.tool,
      params.version,
      params.referenceTool,
      params.referenceVersion
    );
    
    return {
      success: true,
      queryType: 'compatible',
      data: {
        compatible: result.compatible,
        compatibilityDetails: result.reason,
      },
    };
  }
  
  /**
   * Suggest alternative versions
   */
  private querySuggest(params: VersionQueryParams): VersionLookupResult {
    if (!params.version) {
      return {
        success: false,
        queryType: 'suggest',
        data: {},
        error: 'Version parameter required for suggest query',
      };
    }
    
    const suggestions = this.suggestVersions(
      params.tool,
      params.version,
      params.statusFilter
    );
    
    return {
      success: true,
      queryType: 'suggest',
      data: {
        suggestions,
      },
    };
  }
  
  /**
   * Check if version exists in database
   */
  versionExists(tool: string, version: string): boolean {
    if (tool === 'agp') {
      return this.agpVersions.some(v => v.version === version && !v.deprecated);
    } else if (tool === 'kotlin') {
      return this.kotlinVersions.some(v => v.version === version && !v.deprecated);
    }
    return false;
  }
  
  /**
   * Get latest stable version
   */
  getLatestStable(tool: string): string | null {
    if (tool === 'agp') {
      const stable = this.agpVersions.filter(v => 
        v.status === 'stable' && !v.deprecated
      );
      return stable.length > 0 ? stable[0].version : null;
    } else if (tool === 'kotlin') {
      const stable = this.kotlinVersions.filter(v => v.status === 'stable' && !v.deprecated);
      return stable.length > 0 ? stable[0].version : null;
    }
    return null;
  }
  
  /**
   * Get latest version (any status)
   */
  getLatestAny(tool: string): string | null {
    if (tool === 'agp') {
      const existing = this.agpVersions.filter(v => !v.deprecated);
      return existing.length > 0 ? existing[0].version : null;
    } else if (tool === 'kotlin') {
      return this.kotlinVersions.length > 0 ? this.kotlinVersions[0].version : null;
    }
    return null;
  }
  
  /**
   * Check compatibility between two tools/versions
   */
  checkCompatibility(
    tool1: string,
    version1: string,
    tool2: string,
    version2: string
  ): { compatible: boolean; reason: string } {
    // AGP ↔ Kotlin compatibility
    if ((tool1 === 'agp' && tool2 === 'kotlin') || 
        (tool1 === 'kotlin' && tool2 === 'agp')) {
      const agpVer = tool1 === 'agp' ? version1 : version2;
      const kotlinVer = tool1 === 'kotlin' ? version1 : version2;
      
      return this.checkAGPKotlinCompatibility(agpVer, kotlinVer);
    }
    
    // AGP ↔ Gradle compatibility
    if ((tool1 === 'agp' && tool2 === 'gradle') || 
        (tool1 === 'gradle' && tool2 === 'agp')) {
      const agpVer = tool1 === 'agp' ? version1 : version2;
      const gradleVer = tool1 === 'gradle' ? version1 : version2;
      
      return this.checkAGPGradleCompatibility(agpVer, gradleVer);
    }
    
    return {
      compatible: false,
      reason: 'Compatibility check not supported for this tool combination',
    };
  }
  
  /**
   * Check AGP ↔ Kotlin compatibility
   */
  private checkAGPKotlinCompatibility(
    agpVersion: string,
    kotlinVersion: string
  ): { compatible: boolean; reason: string } {
    // Find AGP version info
    const agpInfo = this.agpVersions.find(v => v.version === agpVersion);
    if (!agpInfo) {
      return {
        compatible: false,
        reason: `AGP version ${agpVersion} not found in database`,
      };
    }
    
    // Check minimum Kotlin version
    if (this.compareVersions(kotlinVersion, agpInfo.minKotlinVersion) < 0) {
      return {
        compatible: false,
        reason: `AGP ${agpVersion} requires Kotlin ${agpInfo.minKotlinVersion}+, but ${kotlinVersion} provided`,
      };
    }
    
    // Check compatibility rules
    const rule = this.compatibilityRules.find(r => r.agpVersion === agpVersion);
    if (rule) {
      if (this.compareVersions(kotlinVersion, rule.minKotlinVersion) < 0) {
        return {
          compatible: false,
          reason: `AGP ${agpVersion} requires Kotlin ${rule.minKotlinVersion}+`,
        };
      }
      
      if (rule.maxKotlinVersion && 
          this.compareVersions(kotlinVersion, rule.maxKotlinVersion) > 0) {
        return {
          compatible: false,
          reason: `AGP ${agpVersion} supports Kotlin up to ${rule.maxKotlinVersion}`,
        };
      }
    }
    
    return {
      compatible: true,
      reason: `AGP ${agpVersion} is compatible with Kotlin ${kotlinVersion}`,
    };
  }
  
  /**
   * Check AGP ↔ Gradle compatibility
   */
  private checkAGPGradleCompatibility(
    agpVersion: string,
    gradleVersion: string
  ): { compatible: boolean; reason: string } {
    const agpInfo = this.agpVersions.find(v => v.version === agpVersion);
    if (!agpInfo) {
      return {
        compatible: false,
        reason: `AGP version ${agpVersion} not found in database`,
      };
    }
    
    if (this.compareVersions(gradleVersion, agpInfo.minGradleVersion) < 0) {
      return {
        compatible: false,
        reason: `AGP ${agpVersion} requires Gradle ${agpInfo.minGradleVersion}+, but ${gradleVersion} provided`,
      };
    }
    
    if (agpInfo.maxGradleVersion && 
        this.compareVersions(gradleVersion, agpInfo.maxGradleVersion) > 0) {
      return {
        compatible: false,
        reason: `AGP ${agpVersion} supports Gradle up to ${agpInfo.maxGradleVersion}`,
      };
    }
    
    return {
      compatible: true,
      reason: `AGP ${agpVersion} is compatible with Gradle ${gradleVersion}`,
    };
  }
  
  /**
   * Suggest alternative versions
   */
  suggestVersions(
    tool: string,
    requestedVersion: string,
    statusFilter: string[] = ['stable', 'rc']
  ): Array<{ version: string; reason: string; status: string }> {
    const suggestions: Array<{ version: string; reason: string; status: string }> = [];
    
    if (tool === 'agp') {
      // Get filtered versions
      const filtered = this.agpVersions.filter(v => 
        !v.deprecated && statusFilter.includes(v.status)
      );
      
      // Check if requested version exists
      const exists = this.agpVersions.find(v => v.version === requestedVersion);
      
      if (!exists) {
        // Version doesn't exist at all
        suggestions.push({
          version: filtered[0].version,
          reason: `Version ${requestedVersion} does not exist. Latest stable is ${filtered[0].version}.`,
          status: filtered[0].status,
        });
        
        // Add alternative options
        if (filtered.length > 1) {
          suggestions.push({
            version: filtered[1].version,
            reason: `Alternative stable version with similar features`,
            status: filtered[1].status,
          });
        }
      } else if (exists.deprecated) {
        // Version exists but is deprecated
        suggestions.push({
          version: filtered[0].version,
          reason: `Version ${requestedVersion} is deprecated. Use ${filtered[0].version} instead.`,
          status: filtered[0].status,
        });
      } else {
        // Version exists but might be deprecated or outdated
        const newer = filtered.filter(v => 
          this.compareVersions(v.version, requestedVersion) > 0
        );
        
        if (newer.length > 0) {
          suggestions.push({
            version: newer[0].version,
            reason: `Newer stable version available with bug fixes and improvements`,
            status: newer[0].status,
          });
        }
      }
    } else if (tool === 'kotlin') {
      const filtered = this.kotlinVersions.filter(v => 
        statusFilter.includes(v.status)
      );
      
      const exists = this.kotlinVersions.find(v => v.version === requestedVersion);
      
      if (!exists) {
        suggestions.push({
          version: filtered[0].version,
          reason: `Version ${requestedVersion} not found. Latest stable is ${filtered[0].version}.`,
          status: filtered[0].status,
        });
      } else {
        const newer = filtered.filter(v => 
          this.compareVersions(v.version, requestedVersion) > 0
        );
        
        if (newer.length > 0) {
          suggestions.push({
            version: newer[0].version,
            reason: `Newer version available with language improvements`,
            status: newer[0].status,
          });
        }
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
  
  /**
   * Compare semantic versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    // Remove any pre-release suffixes for comparison
    const clean1 = v1.split('-')[0];
    const clean2 = v2.split('-')[0];
    
    const parts1 = clean1.split('.').map(Number);
    const parts2 = clean2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    
    return 0;
  }
  
  /**
   * Get all versions for a tool (for testing/debugging)
   */
  getAllVersions(tool: string): string[] {
    if (tool === 'agp') {
      return this.agpVersions
        .filter(v => !v.deprecated)
        .map(v => v.version);
    } else if (tool === 'kotlin') {
      return this.kotlinVersions
        .filter(v => !v.deprecated)
        .map(v => v.version);
    }
    return [];
  }
  
  /**
   * Get version info
   */
  getVersionInfo(tool: string, version: string): AGPVersion | KotlinVersion | null {
    if (tool === 'agp') {
      return this.agpVersions.find(v => v.version === version) || null;
    } else if (tool === 'kotlin') {
      return this.kotlinVersions.find(v => v.version === version) || null;
    }
    return null;
  }
}
