/**
 * Tests for LSPTool
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { LSPTool } from '../../src/tools/LSPTool';

// Create a temporary test workspace
const TEST_WORKSPACE = path.join(__dirname, '..', 'fixtures', 'test-workspace');

describe('LSPTool', () => {
  let lspTool: LSPTool;

  beforeAll(async () => {
    // Create test workspace directory
    await fs.mkdir(TEST_WORKSPACE, { recursive: true });

    // Create test Kotlin files
    const mainActivityContent = `
package com.example.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var user: User
    private var textView: TextView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize views
        textView = findViewById(R.id.textView)
        
        // Call helper function
        setupUI()
    }

    private fun setupUI() {
        loadUserData()
    }

    fun loadUserData() {
        // Load user data
        user = User("John", "Doe")
    }

    fun displayUserName() {
        val name = user.name
        textView?.text = name
    }
}
`;

    const userContent = `
package com.example.app

data class User(
    val firstName: String,
    val lastName: String
) {
    val name: String
        get() = "$firstName $lastName"
}
`;

    await fs.writeFile(path.join(TEST_WORKSPACE, 'MainActivity.kt'), mainActivityContent);
    await fs.writeFile(path.join(TEST_WORKSPACE, 'User.kt'), userContent);
  });

  afterAll(async () => {
    // Clean up test workspace
    try {
      await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    lspTool = new LSPTool(TEST_WORKSPACE);
  });

  describe('execute', () => {
    it('should execute find_callers command', async () => {
      const result = await lspTool.execute({
        command: 'find_callers',
        symbolName: 'setupUI',
        filePath: 'MainActivity.kt',
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should execute find_definition command', async () => {
      const result = await lspTool.execute({
        command: 'find_definition',
        symbolName: 'loadUserData',
        filePath: 'MainActivity.kt',
      });

      expect(result).toBeTruthy();
    });

    it('should execute get_symbol_info command', async () => {
      const result = await lspTool.execute({
        command: 'get_symbol_info',
        symbolName: 'user',
        filePath: 'MainActivity.kt',
      });

      expect(result).toBeDefined();
    });

    it('should execute search_symbols command', async () => {
      const result = await lspTool.execute({
        command: 'search_symbols',
        symbolName: 'User',
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error for unknown command', async () => {
      await expect(
        lspTool.execute({
          command: 'unknown_command',
          symbolName: 'test',
          filePath: 'test.kt',
        })
      ).rejects.toThrow('Unknown LSP command');
    });
  });

  describe('findCallers', () => {
    it('should find function callers', async () => {
      const callers = await lspTool.findCallers('loadUserData', 'MainActivity.kt');

      expect(Array.isArray(callers)).toBe(true);
      // Should find call in setupUI()
      const hasCall = callers.some(caller => caller.includes('MainActivity.kt'));
      expect(hasCall).toBe(true);
    });

    it('should return empty array for function with no callers', async () => {
      const callers = await lspTool.findCallers('nonExistentFunction', 'MainActivity.kt');

      expect(Array.isArray(callers)).toBe(true);
      expect(callers.length).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const callers = await lspTool.findCallers('test', 'nonexistent.kt');

      expect(Array.isArray(callers)).toBe(true);
      // Should return error message in array
    });
  });

  describe('findDefinition', () => {
    it('should find function definition', async () => {
      const definition = await lspTool.findDefinition('onCreate', 'MainActivity.kt');

      expect(definition).toBeTruthy();
      expect(definition).toContain('MainActivity.kt');
      expect(definition).toMatch(/:\d+$/); // Should have line number
    });

    it('should find class definition', async () => {
      const definition = await lspTool.findDefinition('MainActivity', 'MainActivity.kt');

      expect(definition).toBeTruthy();
      expect(definition).toContain('MainActivity.kt');
      expect(definition).toMatch(/:\d+$/); // Should have line number
    });

    it('should return null for non-existent symbol', async () => {
      const definition = await lspTool.findDefinition('NonExistentClass', 'MainActivity.kt');

      expect(definition).toBeNull();
    });

    it('should handle missing files', async () => {
      const definition = await lspTool.findDefinition('test', 'nonexistent.kt');

      expect(typeof definition).toBe('string');
      expect(definition).toContain('Error');
    });
  });

  describe('getSymbolInfo', () => {
    it('should get info for property', async () => {
      const info = await lspTool.getSymbolInfo('user', 'MainActivity.kt');

      expect(info).toBeDefined();
      expect(info.name).toBe('user');
      expect(info.location).toContain('MainActivity.kt');
      expect(info.type).toBeTruthy();
    });

    it('should get info for function', async () => {
      const info = await lspTool.getSymbolInfo('onCreate', 'MainActivity.kt');

      expect(info).toBeDefined();
      expect(info.name).toBe('onCreate');
      expect(info.type).toBe('function');
    });

    it('should get info for class', async () => {
      const info = await lspTool.getSymbolInfo('User', 'User.kt');

      expect(info).toBeDefined();
      expect(info.name).toBe('User');
      expect(info.type).toBe('class');
    });

    it('should return error for non-existent symbol', async () => {
      const info = await lspTool.getSymbolInfo('NonExistent', 'MainActivity.kt');

      expect(info.error).toBeDefined();
      expect(info.error).toContain('not found');
    });
  });

  describe('searchWorkspaceSymbols', () => {
    it('should search for class across workspace', async () => {
      const results = await lspTool.searchWorkspaceSymbols('User');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const hasUserClass = results.some(r => r.name === 'User' && r.file.includes('User.kt'));
      expect(hasUserClass).toBe(true);
    });

    it('should search for function across workspace', async () => {
      const results = await lspTool.searchWorkspaceSymbols('onCreate');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent symbol', async () => {
      const results = await lspTool.searchWorkspaceSymbols('NonExistentSymbol123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should find multiple occurrences', async () => {
      const results = await lspTool.searchWorkspaceSymbols('name');

      expect(Array.isArray(results)).toBe(true);
      // Should find both 'name' property in User and usage in MainActivity
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty workspace', async () => {
      const emptyLsp = new LSPTool(path.join(__dirname, 'empty'));
      const results = await emptyLsp.searchWorkspaceSymbols('test');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle special characters in symbol names', async () => {
      const info = await lspTool.getSymbolInfo('name', 'User.kt');

      expect(info).toBeDefined();
    });

    it('should skip non-Kotlin files', async () => {
      // Create a non-Kotlin file
      await fs.writeFile(path.join(TEST_WORKSPACE, 'test.txt'), 'some text');

      const results = await lspTool.searchWorkspaceSymbols('User');

      // Should only search .kt files
      expect(results.every(r => r.file.endsWith('.kt'))).toBe(true);

      // Clean up
      await fs.unlink(path.join(TEST_WORKSPACE, 'test.txt'));
    });
  });
});
