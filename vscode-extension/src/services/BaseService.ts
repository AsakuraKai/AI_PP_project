/**
 * Base Service Class
 * Consolidates common service patterns from CHUNK 9
 * 
 * Provides:
 * - Singleton pattern
 * - Lifecycle management (initialize/dispose)
 * - Event emitter support
 * - Configuration loading
 * - Disposal tracking
 */

import * as vscode from 'vscode';

export interface ServiceConfig {
  configurationPrefix: string;
  disposables?: vscode.Disposable[];
}

/**
 * Abstract base class for all services
 * Eliminates duplicate singleton and disposal patterns
 */
export abstract class BaseService implements vscode.Disposable {
  protected disposables: vscode.Disposable[] = [];
  protected configPrefix: string;

  constructor(config: ServiceConfig) {
    this.configPrefix = config.configurationPrefix;
    if (config.disposables) {
      this.disposables.push(...config.disposables);
    }
  }

  /**
   * Get configuration value
   */
  protected getConfig<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.configPrefix);
    return config.get<T>(key, defaultValue);
  }

  /**
   * Update configuration value
   */
  protected async updateConfig(
    key: string, 
    value: any, 
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configPrefix);
    await config.update(key, value, target);
  }

  /**
   * Register configuration change listener
   */
  protected onConfigChange(
    callback: (event: vscode.ConfigurationChangeEvent) => void
  ): void {
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration(this.configPrefix)) {
          callback(event);
        }
      })
    );
  }

  /**
   * Initialize service (override in subclasses)
   */
  async initialize?(): Promise<void>;

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

/**
 * Singleton mixin for services
 * Eliminates duplicate singleton implementation
 */
export function SingletonService<T extends new (...args: any[]) => any>(
  constructor: T
) {
  return class extends constructor {
    static _instance: any;

    static getInstance(...args: any[]): InstanceType<T> {
      if (!this._instance) {
        this._instance = new this(...args);
      }
      return this._instance;
    }
  };
}

/**
 * Helper type for singleton services
 */
export type SingletonType<T> = T & {
  getInstance(): T;
};
