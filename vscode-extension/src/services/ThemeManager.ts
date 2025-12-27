/**
 * Theme Manager
 * Handles VS Code theme detection and provides theme-aware UI elements
 */

import * as vscode from 'vscode';

export type ThemeKind = 'light' | 'dark' | 'high-contrast-light' | 'high-contrast-dark';

export interface ThemeColors {
  background: string;
  foreground: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  border: string;
  hover: string;
  active: string;
}

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeKind = 'dark';
  private onThemeChangeEmitter = new vscode.EventEmitter<ThemeKind>();
  public readonly onThemeChange = this.onThemeChangeEmitter.event;

  private constructor() {
    this.detectTheme();
    this.registerThemeChangeListener();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Detect current VS Code theme
   */
  private detectTheme(): void {
    const colorTheme = vscode.window.activeColorTheme;
    
    switch (colorTheme.kind) {
      case vscode.ColorThemeKind.Light:
        this.currentTheme = 'light';
        break;
      case vscode.ColorThemeKind.Dark:
        this.currentTheme = 'dark';
        break;
      case vscode.ColorThemeKind.HighContrast:
        // Detect if it's light or dark high contrast
        this.currentTheme = 'high-contrast-dark';
        break;
      case vscode.ColorThemeKind.HighContrastLight:
        this.currentTheme = 'high-contrast-light';
        break;
      default:
        this.currentTheme = 'dark';
    }
  }

  /**
   * Register listener for theme changes
   */
  private registerThemeChangeListener(): void {
    vscode.window.onDidChangeActiveColorTheme(() => {
      this.detectTheme();
      this.onThemeChangeEmitter.fire(this.currentTheme);
    });
  }

  /**
   * Get current theme kind
   */
  getCurrentTheme(): ThemeKind {
    return this.currentTheme;
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    return this.currentTheme === 'dark' || this.currentTheme === 'high-contrast-dark';
  }

  /**
   * Check if current theme is high contrast
   */
  isHighContrast(): boolean {
    return this.currentTheme.startsWith('high-contrast');
  }

  /**
   * Get theme-specific colors
   */
  getThemeColors(): ThemeColors {
    // These will be resolved from VS Code CSS variables
    return {
      background: 'var(--vscode-editor-background)',
      foreground: 'var(--vscode-editor-foreground)',
      accent: 'var(--vscode-focusBorder)',
      error: 'var(--vscode-errorForeground)',
      warning: 'var(--vscode-editorWarning-foreground)',
      success: 'var(--vscode-testing-iconPassed)',
      border: 'var(--vscode-panel-border)',
      hover: 'var(--vscode-list-hoverBackground)',
      active: 'var(--vscode-list-activeSelectionBackground)'
    };
  }

  /**
   * Generate theme-aware CSS variables
   */
  generateThemeCSS(): string {
    const colors = this.getThemeColors();
    
    return `
      :root {
        /* Base colors */
        --rca-background: ${colors.background};
        --rca-foreground: ${colors.foreground};
        --rca-accent: ${colors.accent};
        
        /* Semantic colors */
        --rca-error: ${colors.error};
        --rca-warning: ${colors.warning};
        --rca-success: ${colors.success};
        
        /* UI elements */
        --rca-border: ${colors.border};
        --rca-hover: ${colors.hover};
        --rca-active: ${colors.active};
        
        /* Component-specific */
        --rca-panel-background: var(--vscode-sideBar-background);
        --rca-panel-foreground: var(--vscode-sideBar-foreground);
        --rca-button-background: var(--vscode-button-background);
        --rca-button-foreground: var(--vscode-button-foreground);
        --rca-button-hover: var(--vscode-button-hoverBackground);
        
        /* Progress indicators */
        --rca-progress-background: var(--vscode-progressBar-background);
        --rca-progress-foreground: var(--vscode-progressBar-foreground);
        
        /* Code elements */
        --rca-code-background: var(--vscode-textCodeBlock-background);
        --rca-code-foreground: var(--vscode-textCodeBlock-foreground);
      }
      
      ${this.isHighContrast() ? this.getHighContrastCSS() : ''}
    `;
  }

  /**
   * Get high contrast mode specific CSS
   */
  private getHighContrastCSS(): string {
    return `
      /* High contrast mode enhancements */
      .high-contrast {
        border-width: 2px !important;
      }
      
      .error-message {
        border: 2px solid var(--rca-error) !important;
      }
      
      button {
        border: 2px solid var(--rca-button-foreground) !important;
      }
      
      .panel-section {
        border: 1px solid var(--rca-border) !important;
      }
    `;
  }

  /**
   * Get theme-appropriate icon
   */
  getThemedIcon(iconName: string): string {
    const suffix = this.isDarkTheme() ? 'dark' : 'light';
    return `${iconName}-${suffix}.svg`;
  }

  /**
   * Generate theme-aware status badge
   */
  generateThemedBadge(text: string, type: 'error' | 'warning' | 'success' | 'info'): string {
    const colorMap = {
      error: 'var(--rca-error)',
      warning: 'var(--rca-warning)',
      success: 'var(--rca-success)',
      info: 'var(--rca-accent)'
    };

    return `
      <span class="status-badge status-badge-${type}" 
            style="background-color: ${colorMap[type]}; color: var(--rca-background);">
        ${text}
      </span>
    `;
  }

  /**
   * Get animation preferences
   */
  shouldReduceMotion(): boolean {
    // Check VS Code settings for animation preferences
    const config = vscode.workspace.getConfiguration('workbench');
    return config.get<boolean>('reduceMotion', false);
  }

  /**
   * Generate theme class names
   */
  getThemeClassNames(): string {
    const classes = ['rca-themed'];
    
    classes.push(`theme-${this.currentTheme}`);
    
    if (this.isHighContrast()) {
      classes.push('high-contrast');
    }
    
    if (this.shouldReduceMotion()) {
      classes.push('reduce-motion');
    }
    
    return classes.join(' ');
  }

  /**
   * Get syntax highlighting theme for code blocks
   */
  getSyntaxTheme(): 'vs-dark' | 'vs-light' {
    return this.isDarkTheme() ? 'vs-dark' : 'vs-light';
  }
}
