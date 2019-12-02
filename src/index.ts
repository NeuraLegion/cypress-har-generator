import { Plugin } from './Plugin';
import { Logger } from './utils';
import { PluginOptions } from './PluginOptions';

export type CypressInstallationCallback = (
  browser: Cypress.Browser,
  args: string[]
) => Promise<string[]> | string[];

export interface CypressTasks {
  saveHar(options: PluginOptions): Promise<void>;
  recordHar(options: PluginOptions): Promise<void>;
  removeHar(options: PluginOptions): Promise<void>;
}

export type InstallationArg = CypressInstallationCallback | CypressTasks;

export type CypressPluginEvent = 'before:browser:launch' | 'task';

export type CypressCallback = (
  event: CypressPluginEvent,
  arg?: InstallationArg
) => void;

const DEFAULT_OPTIONS: PluginOptions = {
  file: './archive.har',
  stubPath: '/__cypress/xhrs/'
};

export function install(
  on: CypressCallback,
  config: Cypress.ConfigOptions
): void {
  const env: { [key: string]: any } = config?.env ?? {};

  const pluginOptions: PluginOptions = {
    file: env?.HAR_FILE ?? DEFAULT_OPTIONS.file,
    stubPath: env?.STUB_PATH ?? DEFAULT_OPTIONS.stubPath
  };

  const plugin: Plugin = new Plugin(Logger.Instance, pluginOptions);

  on('before:browser:launch', (browser: Cypress.Browser, args: string[]) =>
    plugin.install(browser, args)
  );

  on('task', {
    saveHar(): Promise<void> {
      return plugin.saveHar();
    },
    recordHar(): Promise<void> {
      return plugin.recordHar();
    },
    removeHar(): Promise<void> {
      return plugin.removeHar();
    }
  });
}
