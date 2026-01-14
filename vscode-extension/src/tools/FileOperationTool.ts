/**
 * File Operation Tool - Read, write, and edit files in the workspace
 */

import * as vscode from 'vscode';
import { Tool, ToolMetadata } from './ToolRegistry';

export interface ReadFileParams {
  path: string;
  encoding?: 'utf-8' | 'utf16le' | 'base64';
}

export interface WriteFileParams {
  path: string;
  content: string;
  createIfNotExists?: boolean;
  encoding?: 'utf8' | 'utf16le';
}

export interface EditFileParams {
  path: string;
  line: number;
  oldText: string;
  newText: string;
}

export interface DeleteFileParams {
  path: string;
  force?: boolean;
}

/**
 * Tool for reading files
 */
export class ReadFileTool implements Tool<ReadFileParams, string> {
  name = 'ReadFile';
  description = 'Read the contents of a file from the workspace';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to read',
        required: true
      },
      encoding: {
        type: 'string',
        description: 'File encoding (default: utf-8)',
        required: false
      }
    },
    category: 'file'
  };

  async execute(params: ReadFileParams): Promise<string> {
    const uri = vscode.Uri.file(params.path);
    
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const encoding = params.encoding || 'utf-8';
      
      if (encoding === 'base64') {
        return Buffer.from(content).toString('base64');
      }
      
      return Buffer.from(content).toString(encoding as BufferEncoding);
    } catch (error) {
      throw new Error(`Failed to read file ${params.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Tool for writing files
 */
export class WriteFileTool implements Tool<WriteFileParams, void> {
  name = 'WriteFile';
  description = 'Write content to a file in the workspace';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to write',
        required: true
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
        required: true
      },
      createIfNotExists: {
        type: 'boolean',
        description: 'Create file if it does not exist (default: true)',
        required: false
      },
      encoding: {
        type: 'string',
        description: 'File encoding (default: utf-8)',
        required: false
      }
    },
    category: 'file'
  };

  async execute(params: WriteFileParams): Promise<void> {
    const uri = vscode.Uri.file(params.path);
    const encoding = (params.encoding || 'utf8') as BufferEncoding;
    const buffer = Buffer.from(params.content, encoding);

    try {
      await vscode.workspace.fs.writeFile(uri, buffer);
    } catch (error) {
      if (params.createIfNotExists !== false) {
        // Try to create parent directories
        const dirUri = vscode.Uri.file(params.path.substring(0, params.path.lastIndexOf('\\')));
        try {
          await vscode.workspace.fs.createDirectory(dirUri);
          await vscode.workspace.fs.writeFile(uri, buffer);
        } catch (createError) {
          throw new Error(`Failed to write file ${params.path}: ${createError instanceof Error ? createError.message : String(createError)}`);
        }
      } else {
        throw new Error(`Failed to write file ${params.path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

/**
 * Tool for editing specific lines in files
 */
export class EditFileTool implements Tool<EditFileParams, boolean> {
  name = 'EditFile';
  description = 'Edit a specific line in a file';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to edit',
        required: true
      },
      line: {
        type: 'number',
        description: 'Line number to edit (0-based)',
        required: true
      },
      oldText: {
        type: 'string',
        description: 'Text to find on the line',
        required: true
      },
      newText: {
        type: 'string',
        description: 'Text to replace with',
        required: true
      }
    },
    category: 'file'
  };

  async execute(params: EditFileParams): Promise<boolean> {
    const uri = vscode.Uri.file(params.path);

    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const edit = new vscode.WorkspaceEdit();

      // Find the text on the specified line
      const lineText = doc.lineAt(params.line).text;
      const index = lineText.indexOf(params.oldText);

      if (index === -1) {
        return false; // Text not found
      }

      const range = new vscode.Range(
        params.line,
        index,
        params.line,
        index + params.oldText.length
      );

      edit.replace(uri, range, params.newText);
      const success = await vscode.workspace.applyEdit(edit);
      
      if (success) {
        await doc.save();
      }
      
      return success;
    } catch (error) {
      throw new Error(`Failed to edit file ${params.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Tool for deleting files
 */
export class DeleteFileTool implements Tool<DeleteFileParams, void> {
  name = 'DeleteFile';
  description = 'Delete a file from the workspace';

  metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    parameters: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to delete',
        required: true
      },
      force: {
        type: 'boolean',
        description: 'Force delete without confirmation (default: false)',
        required: false
      }
    },
    category: 'file'
  };

  async execute(params: DeleteFileParams): Promise<void> {
    const uri = vscode.Uri.file(params.path);

    try {
      await vscode.workspace.fs.delete(uri, { 
        recursive: false, 
        useTrash: !params.force 
      });
    } catch (error) {
      throw new Error(`Failed to delete file ${params.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
