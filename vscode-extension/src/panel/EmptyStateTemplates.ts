/**
 * Empty State UI Templates for RCA Agent
 * Comprehensive empty states for all scenarios with helpful guidance
 */

import * as vscode from 'vscode';

export interface EmptyStateConfig {
  icon: string;
  title: string;
  description: string;
  actions: EmptyStateAction[];
  tips?: string[];
  keyboardHints?: string[];
}

export interface EmptyStateAction {
  label: string;
  command: string;
  primary?: boolean;
  icon?: string;
}

export class EmptyStateTemplates {
  /**
   * No errors detected in workspace
   */
  static getNoErrorsState(): EmptyStateConfig {
    return {
      icon: '✨',
      title: 'No Errors Detected',
      description: 'Your workspace is looking great! No errors found.',
      actions: [
        {
          label: 'Analyze Selected Text',
          command: 'rca-agent.analyzeError',
          primary: true,
          icon: '🔍'
        },
        {
          label: 'Refresh Error Detection',
          command: 'rca-agent.refreshErrors',
          icon: '🔄'
        },
        {
          label: 'View Documentation',
          command: 'rca-agent.openDocs',
          icon: '📖'
        }
      ],
      tips: [
        'Select error text in any file and press Ctrl+Shift+R to analyze',
        'Enable auto-detect in settings to catch errors automatically',
        'Use educational mode (Ctrl+Shift+E) for learning explanations'
      ],
      keyboardHints: [
        'Ctrl+Shift+R - Analyze selected error',
        'Ctrl+Shift+A - Toggle this panel',
        'Ctrl+Shift+E - Toggle educational mode'
      ]
    };
  }

  /**
   * Ollama server not available
   */
  static getOllamaDownState(ollamaUrl: string): EmptyStateConfig {
    return {
      icon: '⚠️',
      title: 'Ollama Server Not Available',
      description: `Cannot connect to Ollama at ${ollamaUrl}`,
      actions: [
        {
          label: 'Check Connection',
          command: 'rca-agent.checkOllama',
          primary: true,
          icon: '🔄'
        },
        {
          label: 'Change Server URL',
          command: 'rca-agent.changeOllamaUrl',
          icon: '🔧'
        },
        {
          label: 'View Logs',
          command: 'rca-agent.showLogs',
          icon: '📋'
        },
        {
          label: 'Installation Guide',
          command: 'rca-agent.openOllamaGuide',
          icon: '📖'
        }
      ],
      tips: [
        '1. Open terminal and run: ollama serve',
        '2. Wait for "Ollama is running" message',
        '3. Click "Check Connection" button above',
        '4. If using custom URL, check settings'
      ],
      keyboardHints: [
        'Terminal: Ctrl+` (open)',
        'Settings: Ctrl+,'
      ]
    };
  }

  /**
   * Model not installed
   */
  static getModelMissingState(modelName: string): EmptyStateConfig {
    return {
      icon: '📦',
      title: 'Model Not Found',
      description: `The model "${modelName}" is not installed on your system.`,
      actions: [
        {
          label: 'Install Model',
          command: 'rca-agent.installModel',
          primary: true,
          icon: '⬇️'
        },
        {
          label: 'Choose Different Model',
          command: 'rca-agent.selectModel',
          icon: '🔄'
        },
        {
          label: 'View Available Models',
          command: 'rca-agent.listModels',
          icon: '📋'
        }
      ],
      tips: [
        '1. Open terminal (Ctrl+`)',
        `2. Run: ollama pull ${modelName}`,
        '3. Wait for download to complete (~5 minutes)',
        '4. Click "Check Connection" to verify',
        '',
        'Alternative recommended models:',
        '• hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest (fast, accurate)',
        '• codellama:7b (optimized for code)',
        '• qwen-coder:7b (strong reasoning)'
      ]
    };
  }

  /**
   * Analysis in progress (loading state)
   */
  static getAnalyzingState(errorCount: number, currentIndex: number): EmptyStateConfig {
    const progress = Math.round((currentIndex / errorCount) * 100);
    return {
      icon: '🔄',
      title: 'Analysis in Progress',
      description: `Analyzing error ${currentIndex} of ${errorCount} (${progress}%)`,
      actions: [
        {
          label: 'Stop Analysis',
          command: 'rca-agent.stopAnalysis',
          primary: true,
          icon: '⏸'
        },
        {
          label: 'View Progress Details',
          command: 'rca-agent.showProgress',
          icon: '📊'
        }
      ],
      tips: [
        'Analysis typically takes 10-30 seconds per error',
        'Press Escape to stop at any time',
        'Results will appear in the panel as they complete'
      ],
      keyboardHints: [
        'Escape - Stop analysis',
        'Ctrl+Shift+P - Performance metrics'
      ]
    };
  }

  /**
   * Error queue is empty (all analyzed)
   */
  static getAllAnalyzedState(): EmptyStateConfig {
    return {
      icon: '✅',
      title: 'All Errors Analyzed',
      description: 'Great job! All errors in the queue have been analyzed.',
      actions: [
        {
          label: 'View History',
          command: 'rca-agent.showHistory',
          primary: true,
          icon: '📜'
        },
        {
          label: 'Refresh Error Detection',
          command: 'rca-agent.refreshErrors',
          icon: '🔄'
        },
        {
          label: 'Clear Queue',
          command: 'rca-agent.clearQueue',
          icon: '🗑️'
        }
      ],
      tips: [
        'Check the History section below for past analyses',
        'Enable auto-detect to catch new errors automatically',
        'Use Ctrl+H to focus history section'
      ]
    };
  }

  /**
   * Analysis failed
   */
  static getAnalysisFailedState(errorMessage: string): EmptyStateConfig {
    return {
      icon: '❌',
      title: 'Analysis Failed',
      description: errorMessage || 'An error occurred during analysis',
      actions: [
        {
          label: 'Try Again',
          command: 'rca-agent.retryAnalysis',
          primary: true,
          icon: '🔄'
        },
        {
          label: 'View Logs',
          command: 'rca-agent.showLogs',
          icon: '📋'
        },
        {
          label: 'Report Issue',
          command: 'rca-agent.reportIssue',
          icon: '🐛'
        },
        {
          label: 'Get Help',
          command: 'rca-agent.getHelp',
          icon: '❓'
        }
      ],
      tips: [
        'Common solutions:',
        '• Check Ollama is running (ollama serve)',
        '• Verify model is installed (ollama list)',
        '• Ensure sufficient system resources',
        '• Try a smaller model if memory is limited',
        '',
        'Still not working? Check logs for details.'
      ]
    };
  }

  /**
   * First time user experience
   */
  static getWelcomeState(): EmptyStateConfig {
    return {
      icon: '👋',
      title: 'Welcome to RCA Agent!',
      description: 'AI-powered root cause analysis for your Kotlin/Android errors.',
      actions: [
        {
          label: 'Quick Start Guide',
          command: 'rca-agent.quickStart',
          primary: true,
          icon: '🚀'
        },
        {
          label: 'Analyze Demo Error',
          command: 'rca-agent.demoAnalysis',
          icon: '🎓'
        },
        {
          label: 'Configure Settings',
          command: 'rca-agent.openSettings',
          icon: '⚙️'
        },
        {
          label: 'View Documentation',
          command: 'rca-agent.openDocs',
          icon: '📖'
        }
      ],
      tips: [
        'Getting Started:',
        '1. Ensure Ollama is running (ollama serve)',
        '2. Pull the recommended model (see Quick Start)',
        '3. Select any error in your code',
        '4. Press Ctrl+Shift+R to analyze',
        '',
        'Features:',
        '✨ Auto-detect errors in workspace',
        '🔄 Batch analysis for multiple errors',
        '🎓 Educational mode for learning',
        '⚡ Performance metrics & caching',
        '♿ Full keyboard navigation (WCAG 2.1 AA)'
      ],
      keyboardHints: [
        'Ctrl+Shift+R - Analyze error',
        'Ctrl+Shift+A - Toggle panel',
        'Ctrl+Shift+E - Educational mode',
        'Alt+F8 - Navigate errors',
        'F1 - View all shortcuts'
      ]
    };
  }

  /**
   * History is empty
   */
  static getNoHistoryState(): EmptyStateConfig {
    return {
      icon: '📜',
      title: 'No Analysis History',
      description: 'Analyzed errors will appear here for quick reference.',
      actions: [
        {
          label: 'Analyze an Error',
          command: 'rca-agent.analyzeError',
          primary: true,
          icon: '🔍'
        },
        {
          label: 'Import History',
          command: 'rca-agent.importHistory',
          icon: '📥'
        }
      ],
      tips: [
        'History tracks all your analyses',
        'Reanalyze past errors with one click',
        'Export history for team sharing',
        'History persists across VS Code sessions'
      ]
    };
  }

  /**
   * Large workspace detected
   */
  static getLargeWorkspaceState(fileCount: number): EmptyStateConfig {
    return {
      icon: '📦',
      title: 'Large Workspace Detected',
      description: `Found ${fileCount} files in workspace. Auto-detection may take longer.`,
      actions: [
        {
          label: 'Enable Auto-Detect',
          command: 'rca-agent.enableAutoDetect',
          primary: true,
          icon: '✅'
        },
        {
          label: 'Manual Detection Only',
          command: 'rca-agent.disableAutoDetect',
          icon: '⏸'
        },
        {
          label: 'Configure Exclusions',
          command: 'rca-agent.configureExclusions',
          icon: '⚙️'
        }
      ],
      tips: [
        'Performance tips for large workspaces:',
        '• Exclude build directories (node_modules, .gradle)',
        '• Use manual selection for specific errors',
        '• Enable virtual scrolling in settings',
        '• Consider analyzing project by project'
      ]
    };
  }

  /**
   * Render empty state HTML
   */
  static renderEmptyState(config: EmptyStateConfig, theme: 'dark' | 'light'): string {
    const isDark = theme === 'dark';
    
    return `
      <div class="empty-state" role="region" aria-label="Empty state">
        <div class="empty-state-icon" role="img" aria-label="${config.title}">
          ${config.icon}
        </div>
        
        <h2 class="empty-state-title">${config.title}</h2>
        
        <p class="empty-state-description">${config.description}</p>
        
        <div class="empty-state-actions" role="group" aria-label="Available actions">
          ${config.actions.map(action => `
            <button 
              class="empty-state-action ${action.primary ? 'primary' : ''}" 
              onclick="executeCommand('${action.command}')"
              aria-label="${action.label}">
              ${action.icon ? `<span class="action-icon">${action.icon}</span>` : ''}
              <span class="action-label">${action.label}</span>
            </button>
          `).join('')}
        </div>
        
        ${config.tips && config.tips.length > 0 ? `
          <div class="empty-state-tips" role="complementary" aria-label="Helpful tips">
            <h3>💡 Tips</h3>
            <ul>
              ${config.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${config.keyboardHints && config.keyboardHints.length > 0 ? `
          <div class="empty-state-keyboard" role="complementary" aria-label="Keyboard shortcuts">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <ul>
              ${config.keyboardHints.map(hint => `<li><code>${hint}</code></li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
      
      <style>
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          animation: fadeIn 0.3s ease-out;
        }
        
        .empty-state-icon {
          font-size: 64px;
          margin-bottom: 20px;
          animation: bounce 0.6s ease-out;
        }
        
        .empty-state-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--vscode-foreground);
        }
        
        .empty-state-description {
          font-size: 14px;
          color: var(--vscode-descriptionForeground);
          margin-bottom: 30px;
          max-width: 500px;
        }
        
        .empty-state-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 30px;
        }
        
        .empty-state-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 1px solid var(--vscode-button-border);
          background: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        
        .empty-state-action.primary {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          font-weight: 500;
        }
        
        .empty-state-action:hover {
          background: var(--vscode-button-hoverBackground);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .empty-state-action:active {
          transform: translateY(0);
        }
        
        .empty-state-tips,
        .empty-state-keyboard {
          margin-top: 20px;
          padding: 20px;
          background: var(--vscode-editor-background);
          border-radius: 6px;
          text-align: left;
          max-width: 600px;
          width: 100%;
        }
        
        .empty-state-tips h3,
        .empty-state-keyboard h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--vscode-foreground);
        }
        
        .empty-state-tips ul,
        .empty-state-keyboard ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .empty-state-tips li,
        .empty-state-keyboard li {
          padding: 6px 0;
          color: var(--vscode-descriptionForeground);
          font-size: 13px;
          line-height: 1.5;
        }
        
        .empty-state-keyboard code {
          padding: 2px 6px;
          background: var(--vscode-textCodeBlock-background);
          border-radius: 3px;
          font-family: var(--vscode-editor-font-family);
          font-size: 12px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .empty-state,
          .empty-state-icon,
          .empty-state-action {
            animation: none !important;
            transition: none !important;
          }
        }
      </style>
    `;
  }
}
