import { Plugin } from './Plugin';
import { Logger } from './utils';

export interface PluginOptions {
  harFile: string;
}

export type CypressInstallationCallback = (
  browser: Cypress.Browser,
  args: string[]
) => Promise<string[]> | string[];

export interface CypressTasks {
  saveHar(options: PluginOptions): Promise<void>;
  recordHar(): Promise<void>;
  removeHar(options: PluginOptions): Promise<void>;
}

export type InstallationArg = CypressInstallationCallback | CypressTasks;

export type CypressPluginEvent = 'before:browser:launch' | 'task';

export type CypressCallback = (
  event: CypressPluginEvent,
  arg?: InstallationArg
) => void;

export function install(on: CypressCallback): void {
  const plugin: Plugin = new Plugin(Logger.Instance);
  on('before:browser:launch', (browser: Cypress.Browser, args: string[]) =>
    plugin.install(browser, args)
  );
  on('task', {
    saveHar: (options: PluginOptions): Promise<void> => plugin.saveHar(options),
    recordHar: (): Promise<void> => plugin.recordHar(),
    removeHar: (options: PluginOptions): Promise<void> =>
      plugin.removeHar(options)
  });
}
