/**
 * Workspace Search Tool - Search for files and content in the workspace
 */

import * as vscode from 'vscode';
import { Tool, ToolMetadata } from './ToolRegistry';

export interface FindFilesParams {
  pattern: string;
  exclude?: string;
  maxResults?: number;
}

export interface SearchInFilesParams {
  query: string;
  filePattern?: string;
  maxResults?: number;
  caseSensitive?: boolean;
}

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  matchLength: number;
}

/**
 * Tool for finding files by pattern
 */
export class FindFilesTool implements Tool<FindFilesParams, string[]> {
  name = 'FindFiles';
  description = 'Find files in the workspace matching a glob pattern';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      pattern: {
        type: 'string',
        description: 'Glob pattern to match (e.g., **/*.kt, **/build.gradle)',
        required: true
      },
      exclude: {
        type: 'string',
        description: 'Glob pattern to exclude (e.g., **/node_modules/**)',
        required: false
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
        required: false
      }
    },
    category: 'workspace'
  };

  async execute(params: FindFilesParams): Promise<string[]> {
    const excludePattern = params.exclude || '**/node_modules/**';
    const maxResults = params.maxResults || 100;

    try {
      const files = await vscode.workspace.findFiles(
        params.pattern,
        excludePattern,
        maxResults
      );

      return files.map(uri => uri.fsPath);
    } catch (error) {
      throw new Error(`Failed to find files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Tool for searching text content in files
 */
export class SearchInFilesTool implements Tool<SearchInFilesParams, SearchResult[]> {
  name = 'SearchInFiles';
  description = 'Search for text content in workspace files';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      query: {
        type: 'string',
        description: 'Text to search for',
        required: true
      },
      filePattern: {
        type: 'string',
        description: 'File pattern to search in (e.g., **/*.{kt,java})',
        required: false
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
        required: false
      },
      caseSensitive: {
        type: 'boolean',
        description: 'Case sensitive search (default: false)',
        required: false
      }
    },
    category: 'workspace'
  };

  async execute(params: SearchInFilesParams): Promise<SearchResult[]> {
    const filePattern = params.filePattern || '**/*.{kt,java,xml,gradle,json}';
    const maxResults = params.maxResults || 50;
    const caseSensitive = params.caseSensitive || false;
    const results: SearchResult[] = [];

    try {
      // Find all matching files
      const files = await vscode.workspace.findFiles(filePattern, '**/node_modules/**', 200);

      // Search in each file
      for (const fileUri of files) {
        if (results.length >= maxResults) {
          break;
        }

        const content = await vscode.workspace.fs.readFile(fileUri);
        const text = Buffer.from(content).toString('utf-8');
        const lines = text.split('\n');

        const searchQuery = caseSensitive ? params.query : params.query.toLowerCase();

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) {
            break;
          }

          const lineText = caseSensitive ? lines[i] : lines[i].toLowerCase();
          const index = lineText.indexOf(searchQuery);

          if (index !== -1) {
            results.push({
              file: fileUri.fsPath,
              line: i + 1, // 1-based line numbers
              column: index + 1,
              content: lines[i].trim(),
              matchLength: params.query.length
            });
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to search in files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Tool for getting workspace information
 */
export class GetWorkspaceInfoTool implements Tool<void, {
  rootPath: string;
  name: string;
  folders: string[];
}> {
  name = 'GetWorkspaceInfo';
  description = 'Get information about the current workspace';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {},
    category: 'workspace'
  };

  async execute(): Promise<{
    rootPath: string;
    name: string;
    folders: string[];
  }> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder open');
    }

    return {
      rootPath: workspaceFolders[0].uri.fsPath,
      name: workspaceFolders[0].name,
      folders: workspaceFolders.map(f => f.uri.fsPath)
    };
  }
}

/**
 * Tool for detecting Gradle files in workspace
 */
export class DetectGradleFilesTool implements Tool<void, {
  buildGradleFiles: string[];
  settingsGradleFile: string | null;
  versionCatalogFile: string | null;
  usesVersionCatalog: boolean;
}> {
  name = 'DetectGradleFiles';
  description = 'Detect Gradle configuration files in the workspace';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {},
    category: 'workspace'
  };

  async execute(): Promise<{
    buildGradleFiles: string[];
    settingsGradleFile: string | null;
    versionCatalogFile: string | null;
    usesVersionCatalog: boolean;
  }> {
    try {
      // Find all build.gradle files
      const buildGradleFiles = await vscode.workspace.findFiles(
        '**/build.gradle{,.kts}',
        '**/node_modules/**',
        50
      );

      // Find settings.gradle
      const settingsGradleFiles = await vscode.workspace.findFiles(
        'settings.gradle{,.kts}',
        '**/node_modules/**',
        1
      );

      // Find version catalog
      const versionCatalogFiles = await vscode.workspace.findFiles(
        'gradle/libs.versions.toml',
        '**/node_modules/**',
        1
      );

      return {
        buildGradleFiles: buildGradleFiles.map(f => f.fsPath),
        settingsGradleFile: settingsGradleFiles.length > 0 ? settingsGradleFiles[0].fsPath : null,
        versionCatalogFile: versionCatalogFiles.length > 0 ? versionCatalogFiles[0].fsPath : null,
        usesVersionCatalog: versionCatalogFiles.length > 0
      };
    } catch (error) {
      throw new Error(`Failed to detect Gradle files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
