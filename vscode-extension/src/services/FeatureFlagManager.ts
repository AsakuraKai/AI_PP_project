/**
 * Feature Flag Manager
 * Controls feature flags and experimental UI toggle
 * CHUNK 9-10 Consolidation: Uses BaseService
 */

import * as vscode from 'vscode';
import { BaseService, SingletonService } from './BaseService';

export interface FeatureFlags {
  newUI: boolean;
  advancedDiagnostics: boolean;
  batchAnalysis: boolean;
  performanceMetrics: boolean;
  experimentalFeatures: boolean;
}

@SingletonService
export class FeatureFlagManager extends BaseService {
  private flags: FeatureFlags;
  private onFlagChangeEmitter = new vscode.EventEmitter<{ flag: string; value: boolean }>();
  public readonly onFlagChange = this.onFlagChangeEmitter.event;

  constructor() {
    super({ configurationPrefix: 'rcaAgent.experimental' });
    this.disposables.push(this.onFlagChangeEmitter);
    this.flags = this.loadFlags();
    this.registerConfigurationListener();
  }

  /**
   * Load feature flags from VS Code settings
   */
  private loadFlags(): FeatureFlags {
    return {
      newUI: this.getConfig<boolean>('newUI', true),
      advancedDiagnostics: this.getConfig<boolean>('advancedDiagnostics', false),
      batchAnalysis: this.getConfig<boolean>('batchAnalysis', true),
      performanceMetrics: this.getConfig<boolean>('performanceMetrics', false),
      experimentalFeatures: this.getConfig<boolean>('experimentalFeatures', false)
    };
  }

  /**
   * Register listener for configuration changes
   */
  private registerConfigurationListener(): void {
    this.onConfigChange(() => {
      const oldFlags = { ...this.flags };
      this.flags = this.loadFlags();
      
      // Notify listeners of flag changes
      Object.keys(this.flags).forEach(flag => {
        const key = flag as keyof FeatureFlags;
        if (oldFlags[key] !== this.flags[key]) {
          this.onFlagChangeEmitter.fire({ flag, value: this.flags[key] });
        }
      });
    });
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Enable a feature flag programmatically
   */
  async enableFlag(flag: keyof FeatureFlags): Promise<void> {
    await this.updateConfig(flag, true);
    this.flags[flag] = true;
    this.onFlagChangeEmitter.fire({ flag, value: true });
  }

  /**
   * Disable a feature flag programmatically
   */
  async disableFlag(flag: keyof FeatureFlags): Promise<void> {
    await this.updateConfig(flag, false);
    this.flags[flag] = false;
    this.onFlagChangeEmitter.fire({ flag, value: false });
  }

  /**
   * Toggle a feature flag
   */
  async toggleFlag(flag: keyof FeatureFlags): Promise<boolean> {
    const newValue = !this.flags[flag];
    if (newValue) {
      await this.enableFlag(flag);
    } else {
      await this.disableFlag(flag);
    }
    return newValue;
  }

  /**
   * Check if new UI should be used
   */
  shouldUseNewUI(): boolean {
    return this.isEnabled('newUI');
  }

  /**
   * Show feature flag picker
   */
  async showFeatureFlagPicker(): Promise<void> {
    const flags = Object.entries(this.flags).map(([flag, enabled]) => ({
      label: flag,
      description: enabled ? '✅ Enabled' : '❌ Disabled',
      flag: flag as keyof FeatureFlags,
      enabled
    }));

    const selected = await vscode.window.showQuickPick(flags, {
      placeHolder: 'Select a feature flag to toggle'
    });

    if (selected) {
      const newValue = await this.toggleFlag(selected.flag);
      vscode.window.showInformationMessage(
        `Feature flag '${selected.flag}' ${newValue ? 'enabled' : 'disabled'}`
      );
    }
  }

  /**
   * Show new UI opt-in prompt
   */
  async showNewUIPrompt(): Promise<void> {
    const result = await vscode.window.showInformationMessage(
      'RCA Agent: Try the new panel-based UI for improved workflow!',
      'Enable New UI',
      'Keep Old UI',
      'Learn More'
    );

    switch (result) {
      case 'Enable New UI':
        await this.enableFlag('newUI');
        vscode.window.showInformationMessage(
          'New UI enabled! Reload window to see changes.',
          'Reload Window'
        ).then(action => {
          if (action === 'Reload Window') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
        break;
        
      case 'Keep Old UI':
        await this.disableFlag('newUI');
        vscode.window.showInformationMessage('Keeping old UI. You can change this anytime in settings.');
        break;
        
      case 'Learn More':
        vscode.env.openExternal(
          vscode.Uri.parse('https://github.com/your-repo/rca-agent#new-ui')
        );
        break;
    }
  }

  /**
   * Generate feature flag configuration section for settings
   */
  generateConfigurationContribution(): object {
    return {
      'rcaAgent.experimental.newUI': {
        type: 'boolean',
        default: true,
        description: 'Enable the new panel-based UI (requires reload)',
        order: 0
      },
      'rcaAgent.experimental.advancedDiagnostics': {
        type: 'boolean',
        default: false,
        description: 'Enable advanced diagnostic features',
        order: 1
      },
      'rcaAgent.experimental.batchAnalysis': {
        type: 'boolean',
        default: true,
        description: 'Enable batch error analysis',
        order: 2
      },
      'rcaAgent.experimental.performanceMetrics': {
        type: 'boolean',
        default: false,
        description: 'Show performance metrics in UI',
        order: 3
      },
      'rcaAgent.experimental.experimentalFeatures': {
        type: 'boolean',
        default: false,
        description: 'Enable all experimental features',
        order: 4
      }
    };
  }

  /**
   * Check if extension requires reload after flag change
   */
  requiresReload(flag: keyof FeatureFlags): boolean {
    // New UI requires reload as it changes the entire extension structure
    return flag === 'newUI';
  }

  /**
   * Show reload prompt if needed
   */
  async promptReloadIfNeeded(flag: keyof FeatureFlags): Promise<void> {
    if (this.requiresReload(flag)) {
      const result = await vscode.window.showInformationMessage(
        'Feature flag change requires window reload to take effect.',
        'Reload Now',
        'Later'
      );

      if (result === 'Reload Now') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
  }
}
